/**
 * SchemaValidator - Extracted from ContextValidator
 * Handles schema definition and validation
 * Part of god object decomposition (Day 4)
 */

import { EventEmitter } from 'events';

export interface Schema {
  id: string;
  name: string;
  version: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  items?: Schema;
  additionalProperties?: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  enum?: any[];
  format?: string;
  description?: string;
}

export interface SchemaProperty {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, SchemaProperty>;
  required?: boolean;
  items?: SchemaProperty;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  enum?: any[];
  format?: string;
  default?: any;
  description?: string;
}

export interface ValidationError {
  path: string;
  message: string;
  value: any;
  constraint: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  metadata: {
    schemaId: string;
    schemaVersion: string;
    validatedAt: Date;
    duration: number;
  };
}

export class SchemaValidator extends EventEmitter {
  /**
   * Handles schema definition and validation.
   *
   * Extracted from ContextValidator (978 LOC -> ~250 LOC component).
   * Handles:
   * - Schema registration and versioning
   * - JSON Schema validation
   * - Type checking
   * - Format validation
   * - Custom validators
   */

  private schemas: Map<string, Schema>;
  private customValidators: Map<string, (value: any, schema: Schema) => ValidationError[]>;
  private formatValidators: Map<string, RegExp>;
  private validationCache: Map<string, ValidationResult>;

  constructor() {
    super();

    this.schemas = new Map();
    this.customValidators = new Map();
    this.formatValidators = new Map();
    this.validationCache = new Map();

    this.registerDefaultFormats();
  }

  private registerDefaultFormats(): void {
    this.formatValidators.set('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    this.formatValidators.set('url', /^https?:\/\/.+/);
    this.formatValidators.set('uuid', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    this.formatValidators.set('date', /^\d{4}-\d{2}-\d{2}$/);
    this.formatValidators.set('datetime', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    this.formatValidators.set('ipv4', /^(\d{1,3}\.){3}\d{1,3}$/);
  }

  registerSchema(schema: Schema): void {
    this.schemas.set(schema.id, schema);
    this.emit('schemaRegistered', schema);

    // Clear validation cache for this schema
    this.clearCache(schema.id);
  }

  registerCustomValidator(
    name: string,
    validator: (value: any, schema: Schema) => ValidationError[]
  ): void {
    this.customValidators.set(name, validator);
  }

  registerFormat(name: string, pattern: RegExp): void {
    this.formatValidators.set(name, pattern);
  }

  validate(data: any, schemaId: string): ValidationResult {
    const startTime = Date.now();

    const schema = this.schemas.get(schemaId);
    if (!schema) {
      throw new Error(`Schema '${schemaId}' not found`);
    }

    // Check cache
    const cacheKey = this.getCacheKey(data, schemaId);
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate against schema
    this.validateValue(data, schema, '', errors, warnings);

    // Run custom validators
    for (const [name, validator] of this.customValidators) {
      const customErrors = validator(data, schema);
      errors.push(...customErrors);
    }

    const result: ValidationResult = {
      valid: errors.filter(e => e.severity === 'error').length === 0,
      errors: errors.filter(e => e.severity === 'error'),
      warnings: [...errors.filter(e => e.severity === 'warning'), ...warnings],
      metadata: {
        schemaId: schema.id,
        schemaVersion: schema.version,
        validatedAt: new Date(),
        duration: Date.now() - startTime
      }
    };

    // Cache result
    this.validationCache.set(cacheKey, result);

    this.emit('validationCompleted', result);
    return result;
  }

  private validateValue(
    value: any,
    schema: Schema | SchemaProperty,
    path: string,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    // Type validation
    if (schema.type && !this.checkType(value, schema.type)) {
      errors.push({
        path,
        message: `Expected type '${schema.type}' but got '${typeof value}'`,
        value,
        constraint: 'type',
        severity: 'error'
      });
      return;
    }

    // Null check
    if (value === null || value === undefined) {
      if ('required' in schema && schema.required) {
        errors.push({
          path,
          message: 'Value is required',
          value,
          constraint: 'required',
          severity: 'error'
        });
      }
      return;
    }

    // Type-specific validation
    switch (schema.type) {
      case 'object':
        this.validateObject(value, schema, path, errors, warnings);
        break;
      case 'array':
        this.validateArray(value, schema, path, errors, warnings);
        break;
      case 'string':
        this.validateString(value, schema, path, errors, warnings);
        break;
      case 'number':
        this.validateNumber(value, schema, path, errors, warnings);
        break;
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({
        path,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        value,
        constraint: 'enum',
        severity: 'error'
      });
    }
  }

  private checkType(value: any, type: string): boolean {
    switch (type) {
      case 'object':
        return value !== null && typeof value === 'object' && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'null':
        return value === null;
      default:
        return false;
    }
  }

  private validateObject(
    value: any,
    schema: Schema | SchemaProperty,
    path: string,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (!schema.properties) return;

    // Check required properties
    if ('required' in schema && schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in value)) {
          errors.push({
            path: `${path}.${requiredProp}`,
            message: `Missing required property '${requiredProp}'`,
            value: undefined,
            constraint: 'required',
            severity: 'error'
          });
        }
      }
    }

    // Validate properties
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (propName in value) {
        const propPath = path ? `${path}.${propName}` : propName;
        this.validateValue(value[propName], propSchema, propPath, errors, warnings);
      }
    }

    // Check additional properties
    if ('additionalProperties' in schema && schema.additionalProperties === false) {
      const definedProps = new Set(Object.keys(schema.properties));
      for (const prop of Object.keys(value)) {
        if (!definedProps.has(prop)) {
          warnings.push({
            path: `${path}.${prop}`,
            message: `Additional property '${prop}' is not allowed`,
            value: value[prop],
            constraint: 'additionalProperties',
            severity: 'warning'
          });
        }
      }
    }
  }

  private validateArray(
    value: any[],
    schema: Schema | SchemaProperty,
    path: string,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (!schema.items) return;

    // Validate each item
    value.forEach((item, index) => {
      const itemPath = `${path}[${index}]`;
      this.validateValue(item, schema.items, itemPath, errors, warnings);
    });
  }

  private validateString(
    value: string,
    schema: Schema | SchemaProperty,
    path: string,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    // Length validation
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        path,
        message: `String length must be at least ${schema.minLength}`,
        value,
        constraint: 'minLength',
        severity: 'error'
      });
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({
        path,
        message: `String length must be at most ${schema.maxLength}`,
        value,
        constraint: 'maxLength',
        severity: 'error'
      });
    }

    // Pattern validation
    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        errors.push({
          path,
          message: `String does not match pattern: ${schema.pattern}`,
          value,
          constraint: 'pattern',
          severity: 'error'
        });
      }
    }

    // Format validation
    if (schema.format && this.formatValidators.has(schema.format)) {
      const formatRegex = this.formatValidators.get(schema.format)!;
      if (!formatRegex.test(value)) {
        errors.push({
          path,
          message: `Invalid format: ${schema.format}`,
          value,
          constraint: 'format',
          severity: 'error'
        });
      }
    }
  }

  private validateNumber(
    value: number,
    schema: Schema | SchemaProperty,
    path: string,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    // Range validation
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({
        path,
        message: `Value must be at least ${schema.minimum}`,
        value,
        constraint: 'minimum',
        severity: 'error'
      });
    }

    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({
        path,
        message: `Value must be at most ${schema.maximum}`,
        value,
        constraint: 'maximum',
        severity: 'error'
      });
    }
  }

  getSchema(schemaId: string): Schema | undefined {
    return this.schemas.get(schemaId);
  }

  listSchemas(): Schema[] {
    return Array.from(this.schemas.values());
  }

  private getCacheKey(data: any, schemaId: string): string {
    const dataStr = JSON.stringify(data);
    return `${schemaId}:${dataStr.length}:${dataStr.slice(0, 100)}`;
  }

  clearCache(schemaId?: string): void {
    if (schemaId) {
      // Clear specific schema validations
      const keysToDelete = Array.from(this.validationCache.keys())
        .filter(key => key.startsWith(`${schemaId}:`));
      keysToDelete.forEach(key => this.validationCache.delete(key));
    } else {
      // Clear all
      this.validationCache.clear();
    }
  }
}