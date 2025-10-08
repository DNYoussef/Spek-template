import { Logger } from '../../utils/Logger';
import { 
  ProtocolMessage, 
  ProtocolSchema,
  TranslationCondition,
  MessageValidationResult,
  ValidationRule,
  FieldDefinition,
  FieldConstraint
} from './ProtocolTypes';

export class ProtocolValidator {
  private logger: Logger;
  private protocolSchemas: Map<string, ProtocolSchema>;

  constructor() {
    this.logger = new Logger('ProtocolValidator');
    this.protocolSchemas = new Map();
  }

  public async validateMessage(
    message: ProtocolMessage,
    version: string
  ): Promise<MessageValidationResult> {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!message || !version) {
      throw new Error('Message and version are required for validation');
    }
    
    if (!message.id || !message.type) {
      throw new Error('Message must have id and type fields');
    }
    
    try {
      const schemaKey = `${message.metadata?.sourceProtocol || message.metadata?.targetProtocol}_${version}`;
      const schema = this.protocolSchemas.get(schemaKey);
      
      if (!schema) {
        return {
          valid: true, // Allow if no schema is registered
          warnings: [`No schema found for ${schemaKey}`]
        };
      }
      
      return await this.validateAgainstSchema(message, schema);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        valid: false,
        error,
        errors: [`Validation failed: ${errorMessage}`]
      };
    }
  }

  private async validateAgainstSchema(
    message: ProtocolMessage,
    schema: ProtocolSchema
  ): Promise<MessageValidationResult> {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!message || !schema) {
      throw new Error('Message and schema are required');
    }
    
    if (!schema.messageTypes || schema.messageTypes.length === 0) {
      throw new Error('Schema must define at least one message type');
    }
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Find matching message type definition
    const messageTypeDef = schema.messageTypes.find(mt => mt.type === message.type);
    if (!messageTypeDef) {
      errors.push(`Unknown message type: ${message.type}`);
      return { valid: false, errors, warnings };
    }
    
    // Validate required fields
    for (const requiredField of messageTypeDef.required) {
      const fieldValue = this.getFieldValue(message, requiredField);
      if (fieldValue === undefined || fieldValue === null) {
        errors.push(`Missing required field: ${requiredField}`);
      }
    }
    
    // Validate field definitions
    for (const fieldDef of messageTypeDef.fields) {
      const fieldValue = this.getFieldValue(message, fieldDef.name);
      if (fieldValue !== undefined) {
        const fieldValidation = this.validateField(fieldValue, fieldDef);
        if (!fieldValidation.valid) {
          errors.push(...fieldValidation.errors);
        }
        warnings.push(...fieldValidation.warnings);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  private validateField(value: any, fieldDef: FieldDefinition): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!fieldDef) {
      throw new Error('Field definition is required');
    }
    
    if (!fieldDef.name || !fieldDef.type) {
      throw new Error('Field definition must have name and type');
    }
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate type
    if (!this.validateFieldType(value, fieldDef.type)) {
      errors.push(`Field '${fieldDef.name}' expected type '${fieldDef.type}' but got '${typeof value}'`);
    }
    
    // Validate constraints
    if (fieldDef.constraints) {
      for (const constraint of fieldDef.constraints) {
        const constraintResult = this.validateConstraint(value, constraint, fieldDef.name);
        if (!constraintResult.valid) {
          errors.push(constraintResult.error);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateFieldType(value: any, expectedType: string): boolean {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!expectedType) {
      throw new Error('Expected type is required');
    }
    
    if (value === null || value === undefined) {
      return expectedType === 'null' || expectedType === 'any';
    }
    
    const actualType = typeof value;
    
    switch (expectedType) {
      case 'any':
        return true;
      case 'string':
        return actualType === 'string';
      case 'number':
        return actualType === 'number' && !isNaN(value);
      case 'boolean':
        return actualType === 'boolean';
      case 'object':
        return actualType === 'object' && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'null':
        return value === null;
      default:
        this.logger.warn('Unknown field type', { expectedType });
        return false;
    }
  }

  private validateConstraint(
    value: any, 
    constraint: FieldConstraint, 
    fieldName: string
  ): { valid: boolean; error: string } {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!constraint || !fieldName) {
      throw new Error('Constraint and field name are required');
    }
    
    if (!constraint.type || constraint.value === undefined) {
      throw new Error('Constraint must have type and value');
    }
    
    try {
      switch (constraint.type) {
        case 'minLength':
          if (typeof value === 'string' && value.length < constraint.value) {
            return { valid: false, error: `Field '${fieldName}' must be at least ${constraint.value} characters` };
          }
          break;
          
        case 'maxLength':
          if (typeof value === 'string' && value.length > constraint.value) {
            return { valid: false, error: `Field '${fieldName}' must be at most ${constraint.value} characters` };
          }
          break;
          
        case 'pattern':
          if (typeof value === 'string') {
            const regex = new RegExp(constraint.value);
            if (!regex.test(value)) {
              return { valid: false, error: `Field '${fieldName}' does not match required pattern` };
            }
          }
          break;
          
        case 'enum':
          if (Array.isArray(constraint.value) && !constraint.value.includes(value)) {
            return { valid: false, error: `Field '${fieldName}' must be one of: ${constraint.value.join(', ')}` };
          }
          break;
          
        case 'range':
          if (typeof value === 'number' && constraint.value.min !== undefined && value < constraint.value.min) {
            return { valid: false, error: `Field '${fieldName}' must be at least ${constraint.value.min}` };
          }
          if (typeof value === 'number' && constraint.value.max !== undefined && value > constraint.value.max) {
            return { valid: false, error: `Field '${fieldName}' must be at most ${constraint.value.max}` };
          }
          break;
          
        default:
          this.logger.warn('Unknown constraint type', { type: constraint.type, fieldName });
          break;
      }
      
      return { valid: true, error: '' };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { valid: false, error: `Constraint validation failed: ${errorMessage}` };
    }
  }

  public async evaluateCondition(
    condition: TranslationCondition,
    message: ProtocolMessage
  ): Promise<boolean> {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!condition || !message) {
      throw new Error('Condition and message are required');
    }
    
    if (!condition.field || !condition.operator || condition.value === undefined) {
      throw new Error('Condition must have field, operator, and value');
    }
    
    try {
      const fieldValue = this.getFieldValue(message, condition.field);
      
      switch (condition.operator) {
        case 'eq':
          return fieldValue === condition.value;
        case 'ne':
          return fieldValue !== condition.value;
        case 'gt':
          return fieldValue > condition.value;
        case 'lt':
          return fieldValue < condition.value;
        case 'gte':
          return fieldValue >= condition.value;
        case 'lte':
          return fieldValue <= condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        case 'contains':
          return typeof fieldValue === 'string' && 
                 fieldValue.includes(condition.value.toString());
        case 'regex':
          return typeof fieldValue === 'string' && 
                 new RegExp(condition.value).test(fieldValue);
        default:
          this.logger.warn('Unknown condition operator', { operator: condition.operator });
          return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Condition evaluation failed', { 
        error: errorMessage, 
        condition: condition.field 
      });
      return false;
    }
  }

  public validateTransformationData(
    data: any,
    validationRules: ValidationRule[]
  ): { valid: boolean; errors: string[] } {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!validationRules) {
      throw new Error('Validation rules are required');
    }
    
    if (validationRules.length === 0) {
      return { valid: true, errors: [] };
    }
    
    const errors: string[] = [];
    
    for (const rule of validationRules) {
      try {
        const validatorFunction = new Function('value', 'data', `return ${rule.condition}`);
        const fieldValue = rule.name ? this.getFieldValue(data, rule.name) : data;
        const isValid = validatorFunction(fieldValue, data);
        
        if (!isValid) {
          errors.push(rule.errorMessage || `Validation failed for rule: ${rule.name}`);
        }
      } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Validation error for ${rule.name}: ${errorMessage}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  private getFieldValue(message: ProtocolMessage, fieldPath: string): any {
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

  public registerProtocolSchema(schema: ProtocolSchema): void {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!schema) {
      throw new Error('Schema is required for registration');
    }
    
    if (!schema.protocol || !schema.version) {
      throw new Error('Schema must have protocol and version');
    }
    
    const schemaKey = `${schema.protocol}_${schema.version}`;
    
    // Validate schema before registration
    this.validateProtocolSchema(schema);
    
    this.protocolSchemas.set(schemaKey, schema);
    
    this.logger.info('Protocol schema registered', {
      protocol: schema.protocol,
      version: schema.version,
      messageTypes: schema.messageTypes.length
    });
  }

  private validateProtocolSchema(schema: ProtocolSchema): void {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!schema) {
      throw new Error('Schema is required for validation');
    }
    
    const errors: string[] = [];
    
    // Validate basic structure
    if (!schema.protocol || schema.protocol.trim().length === 0) {
      errors.push('Protocol name is required');
    }
    
    if (!schema.version || schema.version.trim().length === 0) {
      errors.push('Protocol version is required');
    }
    
    // Validate version format (semantic versioning)
    const versionPattern = /^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    if (schema.version && !versionPattern.test(schema.version)) {
      errors.push('Version must follow semantic versioning format (e.g., 1.0.0)');
    }
    
    // Validate message types
    if (!schema.messageTypes || schema.messageTypes.length === 0) {
      errors.push('At least one message type must be defined');
    }
    
    if (errors.length > 0) {
      throw new Error(`Schema validation failed: ${errors.join('; ')}`);
    }
  }

  public getProtocolSchemas(): ProtocolSchema[] {
    return Array.from(this.protocolSchemas.values());
  }

  public hasSchema(protocol: string, version: string): boolean {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!protocol || !version) {
      throw new Error('Protocol and version are required');
    }
    
    const schemaKey = `${protocol}_${version}`;
    return this.protocolSchemas.has(schemaKey);
  }

  public getSchema(protocol: string, version: string): ProtocolSchema | null {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!protocol || !version) {
      throw new Error('Protocol and version are required');
    }
    
    const schemaKey = `${protocol}_${version}`;
    return this.protocolSchemas.get(schemaKey) || null;
  }
}