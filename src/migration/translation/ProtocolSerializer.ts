import { Logger } from '../../utils/Logger';
import { 
  ProtocolMessage,
  TranslationResult,
  BatchTranslationResult,
  BatchSummary,
  BatchPerformanceMetrics,
  ErrorSummary,
  FieldInfo
} from './ProtocolTypes';

export class ProtocolSerializer {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ProtocolSerializer');
  }

  public async calculateFidelity(
    original: ProtocolMessage,
    translated: ProtocolMessage
  ): Promise<number> {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!original || !translated) {
      throw new Error('Original and translated messages are required');
    }
    
    if (!original.id || !translated.id) {
      throw new Error('Messages must have valid IDs');
    }
    
    try {
      // Compare structure and content to calculate fidelity percentage
      const originalFields = this.extractFields(original);
      const translatedFields = this.extractFields(translated);
      
      const totalFields = originalFields.length;
      if (totalFields === 0) {
        this.logger.warn('No fields found in original message', { messageId: original.id });
        return 100;
      }
      
      let preservedFields = 0;
      for (const field of originalFields) {
        if (translatedFields.some(tf => 
          tf.path === field.path && 
          this.compareValues(tf.value, field.value)
        )) {
          preservedFields++;
        }
      }
      
      const fidelity = (preservedFields / totalFields) * 100;
      
      if (fidelity < 0 || fidelity > 100) {
        throw new Error('Invalid fidelity calculation result');
      }
      
      return Math.round(fidelity * 100) / 100; // Round to 2 decimal places
      
    } catch (error) {
      this.logger.error('Fidelity calculation failed', { 
        error: error.message,
        originalId: original.id,
        translatedId: translated.id
      });
      return 0;
    }
  }

  private compareValues(value1: any, value2: any): boolean {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (value1 === value2) {
      return true;
    }
    
    // Handle null/undefined
    if (value1 == null && value2 == null) {
      return true;
    }
    
    if (value1 == null || value2 == null) {
      return false;
    }
    
    // Type check
    if (typeof value1 !== typeof value2) {
      return false;
    }
    
    // Deep comparison for objects
    if (typeof value1 === 'object') {
      if (Array.isArray(value1) && Array.isArray(value2)) {
        if (value1.length !== value2.length) {
          return false;
        }
        for (let i = 0; i < value1.length; i++) {
          if (!this.compareValues(value1[i], value2[i])) {
            return false;
          }
        }
        return true;
      }
      
      if (!Array.isArray(value1) && !Array.isArray(value2)) {
        const keys1 = Object.keys(value1);
        const keys2 = Object.keys(value2);
        
        if (keys1.length !== keys2.length) {
          return false;
        }
        
        for (const key of keys1) {
          if (!keys2.includes(key) || !this.compareValues(value1[key], value2[key])) {
            return false;
          }
        }
        return true;
      }
      
      return false;
    }
    
    // Handle dates
    if (value1 instanceof Date && value2 instanceof Date) {
      return value1.getTime() === value2.getTime();
    }
    
    return false;
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
      
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        this.extractFieldsRecursive(value, path, fields);
      } else {
        fields.push({ path, value, type: this.getValueType(value) });
      }
    }
  }

  private getValueType(value: any): string {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    
    return typeof value;
  }

  public async generateBatchSummary(
    results: TranslationResult[],
    totalTime: number
  ): Promise<BatchSummary> {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!results || !Array.isArray(results)) {
      throw new Error('Results array is required');
    }
    
    if (totalTime < 0) {
      throw new Error('Total time must be non-negative');
    }
    
    const successfulResults = results.filter(r => r.success);
    
    const averageTranslationTime = successfulResults.length > 0 ?
      successfulResults.reduce((sum, r) => sum + r.performance.totalTime, 0) / successfulResults.length : 0;
    
    const averageFidelity = successfulResults.length > 0 ?
      successfulResults.reduce((sum, r) => sum + r.metadata.fidelity, 0) / successfulResults.length : 0;
    
    const errorCounts = this.aggregateErrors(results);
    const commonErrors = this.generateErrorSummary(errorCounts, results.length);
    
    const performanceMetrics = this.calculateBatchPerformanceMetrics(
      results, 
      totalTime, 
      averageTranslationTime
    );
    
    return {
      averageTranslationTime,
      totalDataLoss: results.some(r => r.metadata.dataLoss),
      averageFidelity: Math.round(averageFidelity * 100) / 100,
      commonErrors,
      performance: performanceMetrics
    };
  }

  private aggregateErrors(results: TranslationResult[]): Map<string, number> {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!results) {
      throw new Error('Results array is required');
    }
    
    const errorCounts = new Map<string, number>();
    
    results.forEach(result => {
      if (!result.errors) {
        return;
      }
      
      result.errors.forEach(error => {
        if (error.code) {
          errorCounts.set(error.code, (errorCounts.get(error.code) || 0) + 1);
        }
      });
    });
    
    return errorCounts;
  }

  private generateErrorSummary(errorCounts: Map<string, number>, totalResults: number): ErrorSummary[] {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!errorCounts || totalResults < 0) {
      throw new Error('Error counts and total results are required');
    }
    
    if (totalResults === 0) {
      return [];
    }
    
    return Array.from(errorCounts.entries())
      .map(([code, count]) => {
        if (count < 0 || count > totalResults) {
          throw new Error('Invalid error count detected');
        }
        
        return {
          errorCode: code,
          count,
          percentage: Math.round((count / totalResults) * 10000) / 100, // Round to 2 decimal places
          examples: []
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 most common errors
  }

  private calculateBatchPerformanceMetrics(
    results: TranslationResult[],
    totalTime: number,
    averageTranslationTime: number
  ): BatchPerformanceMetrics {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!results || totalTime < 0 || averageTranslationTime < 0) {
      throw new Error('Valid results, total time, and average time are required');
    }
    
    const averageMessageTime = results.length > 0 ? totalTime / results.length : 0;
    const throughput = totalTime > 0 ? (results.length / totalTime) * 1000 : 0; // messages per second
    
    const memoryUsages = results.map(r => r.performance.memoryUsage).filter(m => m > 0);
    const memoryPeak = memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0;
    
    const cpuUsages = results.map(r => r.performance.cpuUsage).filter(c => c >= 0);
    const avgCpuUtilization = cpuUsages.length > 0 ?
      cpuUsages.reduce((sum, cpu) => sum + cpu, 0) / cpuUsages.length : 0;
    
    return {
      totalTime,
      averageMessageTime: Math.round(averageMessageTime * 100) / 100,
      throughput: Math.round(throughput * 100) / 100,
      memoryPeak,
      cpuUtilization: Math.round(avgCpuUtilization * 100) / 100
    };
  }

  public serializeMessage(message: ProtocolMessage, format: 'json' | 'xml' | 'binary' = 'json'): string | Buffer {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!message) {
      throw new Error('Message is required for serialization');
    }
    
    if (!message.id || !message.type) {
      throw new Error('Message must have id and type for serialization');
    }
    
    try {
      switch (format) {
        case 'json':
          return JSON.stringify(message, null, 2);
          
        case 'xml':
          return this.convertToXml(message);
          
        case 'binary':
          return Buffer.from(JSON.stringify(message), 'utf8');
          
        default:
          throw new Error(`Unsupported serialization format: ${format}`);
      }
    } catch (error) {
      this.logger.error('Message serialization failed', {
        error: error.message,
        messageId: message.id,
        format
      });
      throw error;
    }
  }

  private convertToXml(obj: any, rootElement: string = 'message'): string {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!obj) {
      throw new Error('Object is required for XML conversion');
    }
    
    if (!rootElement) {
      throw new Error('Root element name is required');
    }
    
    try {
      let xml = `<${rootElement}>`;
      
      for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
          xml += `<${key} />`;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          xml += this.convertToXml(value, key);
        } else if (Array.isArray(value)) {
          xml += `<${key}>`;
          for (const item of value) {
            if (typeof item === 'object') {
              xml += this.convertToXml(item, 'item');
            } else {
              xml += `<item>${this.escapeXml(String(item))}</item>`;
            }
          }
          xml += `</${key}>`;
        } else {
          xml += `<${key}>${this.escapeXml(String(value))}</${key}>`;
        }
      }
      
      xml += `</${rootElement}>`;
      return xml;
      
    } catch (error) {
      throw new Error(`XML conversion failed: ${error.message}`);
    }
  }

  private escapeXml(text: string): string {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (typeof text !== 'string') {
      throw new Error('Text must be a string for XML escaping');
    }
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  public deserializeMessage(data: string | Buffer, format: 'json' | 'xml' | 'binary' = 'json'): ProtocolMessage {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!data) {
      throw new Error('Data is required for deserialization');
    }
    
    try {
      let message: ProtocolMessage;
      
      switch (format) {
        case 'json':
          const jsonData = typeof data === 'string' ? data : data.toString('utf8');
          message = JSON.parse(jsonData);
          break;
          
        case 'binary':
          const binaryData = Buffer.isBuffer(data) ? data.toString('utf8') : data;
          message = JSON.parse(binaryData);
          break;
          
        case 'xml':
          throw new Error('XML deserialization not implemented');
          
        default:
          throw new Error(`Unsupported deserialization format: ${format}`);
      }
      
      // Validate deserialized message
      if (!message.id || !message.type) {
        throw new Error('Deserialized message missing required fields');
      }
      
      return message;
      
    } catch (error) {
      this.logger.error('Message deserialization failed', {
        error: error.message,
        format
      });
      throw error;
    }
  }

  public calculateDataIntegrity(original: any, processed: any): number {
    // NASA Rule 10: Function ≤60 lines, has assertions
    if (!original || !processed) {
      throw new Error('Original and processed data are required');
    }
    
    try {
      const originalStr = JSON.stringify(original);
      const processedStr = JSON.stringify(processed);
      
      if (originalStr === processedStr) {
        return 100;
      }
      
      // Calculate similarity based on character-level differences
      const maxLength = Math.max(originalStr.length, processedStr.length);
      if (maxLength === 0) {
        return 100;
      }
      
      let matchingChars = 0;
      const minLength = Math.min(originalStr.length, processedStr.length);
      
      for (let i = 0; i < minLength; i++) {
        if (originalStr[i] === processedStr[i]) {
          matchingChars++;
        }
      }
      
      const integrity = (matchingChars / maxLength) * 100;
      return Math.round(integrity * 100) / 100;
      
    } catch (error) {
      this.logger.error('Data integrity calculation failed', { error: error.message });
      return 0;
    }
  }
}