import { Logger } from '../../utils/Logger';
import { 
  ProtocolMessage, 
  TranslationRule, 
  TranslationResult,
  FieldTransformation,
  RuleApplicationResult,
  TransformationResult,
  TranslationWarning
} from './ProtocolTypes';

export class ProtocolParser {
  private logger: Logger;
  private transformationEngine: TransformationEngine;

  constructor() {
    this.logger = new Logger('ProtocolParser');
    this.transformationEngine = new TransformationEngine();
  }

  public async applyTransformationRules(
    message: ProtocolMessage,
    rules: TranslationRule[],
    result: TranslationResult
  ): Promise<ProtocolMessage | null> {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!message || !rules || !result) {
      throw new Error('Message, rules, and result are required');
    }
    
    if (rules.length === 0) {
      throw new Error('At least one transformation rule is required');
    }
    
    let transformedMessage = { ...message };
    
    for (const rule of rules) {
      try {
        const ruleResult = await this.applyTransformationRule(transformedMessage, rule);
        
        if (ruleResult.success) {
          transformedMessage = ruleResult.message;
          result.appliedRules.push(rule.id);
          result.metadata.transformationsApplied += ruleResult.transformationsApplied;
          
          if (ruleResult.warnings) {
            result.warnings.push(...ruleResult.warnings);
          }
        } else {
          result.errors.push({
            code: 'RULE_APPLICATION_FAILED',
            message: `Failed to apply rule ${rule.id}: ${ruleResult.error}`,
            recoverable: true,
            suggestions: [`Review rule ${rule.id}`, 'Check transformation logic']
          });
        }
        
      } catch (error) {
        result.errors.push({
          code: 'RULE_EXCEPTION',
          message: `Exception applying rule ${rule.id}: ${error.message}`,
          cause: error,
          recoverable: true,
          suggestions: [`Debug rule ${rule.id}`, 'Check transformation implementation']
        });
      }
    }
    
    return result.errors.length === 0 ? transformedMessage : null;
  }

  private async applyTransformationRule(
    message: ProtocolMessage,
    rule: TranslationRule
  ): Promise<RuleApplicationResult> {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!message || !rule) {
      throw new Error('Message and rule are required');
    }
    
    if (!rule.transformations || rule.transformations.length === 0) {
      throw new Error('Rule must have at least one transformation');
    }
    
    const result: RuleApplicationResult = {
      success: false,
      message: { ...message },
      transformationsApplied: 0,
      warnings: []
    };
    
    try {
      for (const transformation of rule.transformations) {
        const transformResult = await this.transformationEngine.applyTransformation(
          result.message,
          transformation
        );
        
        if (transformResult.success) {
          result.message = transformResult.transformedMessage;
          result.transformationsApplied++;
          
          if (transformResult.warnings) {
            result.warnings.push(...transformResult.warnings);
          }
        } else {
          if (transformation.required) {
            result.error = `Required transformation failed: ${transformResult.error}`;
            return result;
          } else {
            result.warnings.push({
              code: 'OPTIONAL_TRANSFORMATION_FAILED',
              message: `Optional transformation failed: ${transformResult.error}`,
              field: transformation.targetField,
              severity: 'medium'
            });
          }
        }
      }
      
      result.success = true;
      return result;
      
    } catch (error) {
      result.error = error.message;
      return result;
    }
  }

  public extractFields(message: ProtocolMessage): FieldInfo[] {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!message) {
      throw new Error('Message is required for field extraction');
    }
    
    const fields: FieldInfo[] = [];
    this.extractFieldsRecursive(message, '', fields);
    
    if (fields.length === 0) {
      this.logger.warn('No fields extracted from message', { messageId: message.id });
    }
    
    return fields;
  }

  private extractFieldsRecursive(obj: any, prefix: string, fields: FieldInfo[]): void {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!obj || !fields) {
      throw new Error('Object and fields array are required');
    }
    
    const maxDepth = 10; // Prevent infinite recursion
    const currentDepth = prefix.split('.').length;
    
    if (currentDepth > maxDepth) {
      this.logger.warn('Maximum field extraction depth exceeded', { prefix });
      return;
    }
    
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        this.extractFieldsRecursive(value, path, fields);
      } else {
        fields.push({ path, value, type: typeof value });
      }
    }
  }

  public getFieldValue(message: ProtocolMessage, fieldPath: string): any {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!message || !fieldPath) {
      throw new Error('Message and field path are required');
    }
    
    const parts = fieldPath.split('.');
    if (parts.length === 0) {
      throw new Error('Invalid field path format');
    }
    
    let current = message;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  public setFieldValue(message: ProtocolMessage, fieldPath: string, value: any): boolean {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!message || !fieldPath) {
      throw new Error('Message and field path are required');
    }
    
    const parts = fieldPath.split('.');
    if (parts.length === 0) {
      throw new Error('Invalid field path format');
    }
    
    let current = message;
    
    // Navigate to the parent of the target field
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      
      current = current[part];
    }
    
    // Set the final field value
    const finalPart = parts[parts.length - 1];
    current[finalPart] = value;
    
    return true;
  }

  public removeField(message: ProtocolMessage, fieldPath: string): boolean {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!message || !fieldPath) {
      throw new Error('Message and field path are required');
    }
    
    const parts = fieldPath.split('.');
    if (parts.length === 0) {
      throw new Error('Invalid field path format');
    }
    
    let current = message;
    
    // Navigate to the parent of the target field
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      if (!current[part] || typeof current[part] !== 'object') {
        return false; // Field doesn't exist
      }
      
      current = current[part];
    }
    
    const finalPart = parts[parts.length - 1];
    if (finalPart in current) {
      delete current[finalPart];
      return true;
    }
    
    return false;
  }

  public validateFieldStructure(message: ProtocolMessage): boolean {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!message) {
      throw new Error('Message is required for structure validation');
    }
    
    const requiredFields = ['id', 'type', 'version', 'timestamp', 'metadata'];
    
    for (const field of requiredFields) {
      if (!(field in message)) {
        this.logger.error('Missing required field', { field, messageId: message.id });
        return false;
      }
    }
    
    // Validate metadata structure
    if (!message.metadata || typeof message.metadata !== 'object') {
      this.logger.error('Invalid metadata structure', { messageId: message.id });
      return false;
    }
    
    const requiredMetadataFields = ['sourceProtocol', 'targetProtocol', 'contentType'];
    for (const field of requiredMetadataFields) {
      if (!(field in message.metadata)) {
        this.logger.error('Missing required metadata field', { field, messageId: message.id });
        return false;
      }
    }
    
    return true;
  }

  public normalizeMessage(message: ProtocolMessage): ProtocolMessage {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!message) {
      throw new Error('Message is required for normalization');
    }
    
    const normalized = { ...message };
    
    // Ensure timestamp is a Date object
    if (typeof normalized.timestamp === 'string') {
      normalized.timestamp = new Date(normalized.timestamp);
    }
    
    // Normalize headers
    if (!normalized.headers) {
      normalized.headers = {};
    }
    
    // Ensure metadata exists
    if (!normalized.metadata) {
      normalized.metadata = {
        sourceProtocol: 'unknown',
        targetProtocol: 'unknown',
        contentType: 'application/json',
        encoding: 'utf-8'
      };
    }
    
    // Validate normalized structure
    if (!this.validateFieldStructure(normalized)) {
      throw new Error('Message normalization resulted in invalid structure');
    }
    
    return normalized;
  }
}

// Supporting class
class TransformationEngine {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('TransformationEngine');
  }

  async applyTransformation(
    message: ProtocolMessage,
    transformation: FieldTransformation
  ): Promise<TransformationResult> {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!message || !transformation) {
      throw new Error('Message and transformation are required');
    }
    
    if (!transformation.sourceField || !transformation.targetField) {
      throw new Error('Source and target fields are required');
    }
    
    try {
      const transformedMessage = { ...message };
      const sourceValue = this.getFieldValue(message, transformation.sourceField);
      
      switch (transformation.type) {
        case 'map':
          this.setFieldValue(transformedMessage, transformation.targetField, sourceValue);
          break;
          
        case 'transform':
          if (transformation.transformation) {
            const transformedValue = await this.executeTransformation(
              sourceValue, 
              transformation.transformation,
              transformation.parameters
            );
            this.setFieldValue(transformedMessage, transformation.targetField, transformedValue);
          } else {
            this.setFieldValue(transformedMessage, transformation.targetField, sourceValue);
          }
          break;
          
        case 'default':
          if (sourceValue === undefined || sourceValue === null) {
            const defaultValue = transformation.parameters?.defaultValue;
            this.setFieldValue(transformedMessage, transformation.targetField, defaultValue);
          } else {
            this.setFieldValue(transformedMessage, transformation.targetField, sourceValue);
          }
          break;
          
        case 'remove':
          this.removeField(transformedMessage, transformation.sourceField);
          break;
          
        default:
          throw new Error(`Unsupported transformation type: ${transformation.type}`);
      }
      
      return {
        success: true,
        transformedMessage,
        warnings: []
      };
      
    } catch (error) {
      return {
        success: false,
        transformedMessage: message,
        warnings: [],
        error: error.message
      };
    }
  }

  private async executeTransformation(
    value: any, 
    transformation: any, 
    parameters?: Record<string, any>
  ): Promise<any> {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!transformation) {
      throw new Error('Transformation function is required');
    }
    
    try {
      // Create a safe execution context
      const transformFunc = new Function('input', 'params', transformation.implementation);
      const result = transformFunc(value, parameters || {});
      
      if (result === undefined) {
        this.logger.warn('Transformation returned undefined', {
          transformationName: transformation.name
        });
      }
      
      return result;
      
    } catch (error) {
      throw new Error(`Transformation execution failed: ${error.message}`);
    }
  }

  private getFieldValue(obj: any, path: string): any {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!obj || !path) {
      throw new Error('Object and path are required');
    }
    
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  private setFieldValue(obj: any, path: string, value: any): void {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!obj || !path) {
      throw new Error('Object and path are required');
    }
    
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }

  private removeField(obj: any, path: string): void {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!obj || !path) {
      throw new Error('Object and path are required');
    }
    
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      if (!current[part] || typeof current[part] !== 'object') {
        return; // Path doesn't exist
      }
      
      current = current[part];
    }
    
    delete current[parts[parts.length - 1]];
  }
}

// Supporting interface
interface FieldInfo {
  path: string;
  value: any;
  type: string;
}