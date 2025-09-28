/**
 * Unified Request Validator
 * Reusable validation component for all controllers
 */

import {
  ControllerRequest,
  ControllerError,
  RequestValidator
} from '../core/ControllerFSMTypes';

export class UnifiedRequestValidator implements RequestValidator {
  private errors: ControllerError[] = [];
  private validationRules: Map<string, ValidationRule[]> = new Map();

  /**
   * Add validation rule for a request type
   */
  addRule(requestType: string, rule: ValidationRule): void {
    if (!this.validationRules.has(requestType)) {
      this.validationRules.set(requestType, []);
    }
    this.validationRules.get(requestType)!.push(rule);
  }

  /**
   * Validate a request
   */
  async validate(request: ControllerRequest): Promise<boolean> {
    this.errors = [];

    // Basic structure validation
    if (!this.validateBasicStructure(request)) {
      return false;
    }

    // Type-specific validation
    const rules = this.validationRules.get(request.type) || [];
    for (const rule of rules) {
      try {
        const isValid = await rule.validate(request);
        if (!isValid) {
          this.errors.push({
            code: 'VALIDATION_FAILED',
            message: rule.errorMessage || `Validation failed for rule: ${rule.name}`
          });
        }
      } catch (error) {
        this.errors.push({
          code: 'VALIDATION_ERROR',
          message: `Validation error: ${error.message}`,
          details: { rule: rule.name, error }
        });
      }
    }

    return this.errors.length === 0;
  }

  /**
   * Get validation errors
   */
  getValidationErrors(): ControllerError[] {
    return [...this.errors];
  }

  /**
   * Validate basic request structure
   */
  private validateBasicStructure(request: ControllerRequest): boolean {
    if (!request.id) {
      this.errors.push({
        code: 'MISSING_ID',
        message: 'Request ID is required'
      });
    }

    if (!request.type) {
      this.errors.push({
        code: 'MISSING_TYPE',
        message: 'Request type is required'
      });
    }

    if (!request.payload) {
      this.errors.push({
        code: 'MISSING_PAYLOAD',
        message: 'Request payload is required'
      });
    }

    if (!request.timestamp) {
      this.errors.push({
        code: 'MISSING_TIMESTAMP',
        message: 'Request timestamp is required'
      });
    }

    return this.errors.length === 0;
  }
}

export interface ValidationRule {
  name: string;
  errorMessage?: string;
  validate(request: ControllerRequest): Promise<boolean> | boolean;
}

// Common validation rules
export class RequiredFieldRule implements ValidationRule {
  name = 'RequiredFieldRule';

  constructor(
    private fieldPath: string,
    public errorMessage?: string
  ) {
    this.errorMessage = errorMessage || `Field ${fieldPath} is required`;
  }

  validate(request: ControllerRequest): boolean {
    const value = this.getNestedValue(request.payload, this.fieldPath);
    return value !== undefined && value !== null && value !== '';
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

export class TypeValidationRule implements ValidationRule {
  name = 'TypeValidationRule';

  constructor(
    private fieldPath: string,
    private expectedType: string,
    public errorMessage?: string
  ) {
    this.errorMessage = errorMessage || `Field ${fieldPath} must be of type ${expectedType}`;
  }

  validate(request: ControllerRequest): boolean {
    const value = this.getNestedValue(request.payload, this.fieldPath);
    return typeof value === this.expectedType;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

export class RangeValidationRule implements ValidationRule {
  name = 'RangeValidationRule';

  constructor(
    private fieldPath: string,
    private min: number,
    private max: number,
    public errorMessage?: string
  ) {
    this.errorMessage = errorMessage || `Field ${fieldPath} must be between ${min} and ${max}`;
  }

  validate(request: ControllerRequest): boolean {
    const value = this.getNestedValue(request.payload, this.fieldPath);
    return typeof value === 'number' && value >= this.min && value <= this.max;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}