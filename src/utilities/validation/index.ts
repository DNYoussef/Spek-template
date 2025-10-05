import { ValidationResult } from '../../types/validation-types';

/**
 * Validation utilities for various system components
 * Domain-specific validation logic decomposed from god objects
 */


/**
 * Generic validation utilities
 */
export class ValidationUtils {
  /**
   * Validate required fields exist
   */
  static validateRequiredFields(
    obj: Record<string, any>,
    requiredFields: string[]
  ): ValidationResult {
    const errors: string[] = [];

    for (const field of requiredFields) {
      if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate field types
   */
  static validateFieldTypes(
    obj: Record<string, any>,
    typeSpecs: Record<string, string>
  ): ValidationResult {
    const errors: string[] = [];

    for (const [field, expectedType] of Object.entries(typeSpecs)) {
      if (field in obj && obj[field] !== undefined) {
        const actualType = typeof obj[field];
        if (actualType !== expectedType) {
          errors.push(`Field ${field} expected ${expectedType}, got ${actualType}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate array field contents
   */
  static validateArrayField(
    obj: Record<string, any>,
    field: string,
    itemValidator?: (item: any) => boolean
  ): ValidationResult {
    const errors: string[] = [];

    if (field in obj) {
      if (!Array.isArray(obj[field])) {
        errors.push(`Field ${field} must be an array`);
      } else if (itemValidator) {
        obj[field].forEach((item: any, index: number) => {
          if (!itemValidator(item)) {
            errors.push(`Invalid item at ${field}[${index}]`);
          }
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate string constraints
   */
  static validateStringConstraints(
    value: string,
    constraints: {
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      allowEmpty?: boolean;
    }
  ): ValidationResult {
    const errors: string[] = [];

    if (!constraints.allowEmpty && value.length === 0) {
      errors.push('String cannot be empty');
    }

    if (constraints.minLength !== undefined && value.length < constraints.minLength) {
      errors.push(`String must be at least ${constraints.minLength} characters`);
    }

    if (constraints.maxLength !== undefined && value.length > constraints.maxLength) {
      errors.push(`String must be at most ${constraints.maxLength} characters`);
    }

    if (constraints.pattern && !constraints.pattern.test(value)) {
      errors.push('String does not match required pattern');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate numeric constraints
   */
  static validateNumericConstraints(
    value: number,
    constraints: {
      min?: number;
      max?: number;
      integer?: boolean;
      positive?: boolean;
    }
  ): ValidationResult {
    const errors: string[] = [];

    if (constraints.min !== undefined && value < constraints.min) {
      errors.push(`Value must be at least ${constraints.min}`);
    }

    if (constraints.max !== undefined && value > constraints.max) {
      errors.push(`Value must be at most ${constraints.max}`);
    }

    if (constraints.integer && !Number.isInteger(value)) {
      errors.push('Value must be an integer');
    }

    if (constraints.positive && value <= 0) {
      errors.push('Value must be positive');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Combine multiple validation results
   */
  static combineResults(...results: ValidationResult[]): ValidationResult {
    const allErrors = results.flatMap(result => result.errors);
    const allWarnings = results.flatMap(result => result.warnings || []);

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings.length > 0 ? allWarnings : undefined
    };
  }

  /**
   * Validate NASA Rule 10 compliance (functions ≤60 lines)
   */
  static validateNASARule10(functionCode: string, functionName: string): ValidationResult {
    const lines = functionCode.split('\n').filter(line => line.trim().length > 0);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (lines.length > 60) {
      errors.push(`Function ${functionName} has ${lines.length} lines, exceeds NASA Rule 10 limit of 60`);
    } else if (lines.length > 50) {
      warnings.push(`Function ${functionName} has ${lines.length} lines, approaching NASA Rule 10 limit`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}