/**
 * ValidationEngine - Extracted from StageProgressionValidator
 * Executes validation rules for stage transitions
 * Part of god object decomposition (Day 3-5)
 */

import { EventEmitter } from 'events';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  type: 'sync' | 'async';
  severity: 'error' | 'warning' | 'info';
  validator: (context: ValidationContext) => boolean | Promise<boolean>;
  errorMessage: string;
  metadata?: Record<string, any>;
}

export interface ValidationContext {
  stageId: string;
  stageName: string;
  data: Record<string, any>;
  previousStage?: string;
  environment: Record<string, any>;
}

export interface ValidationResult {
  ruleId: string;
  passed: boolean;
  severity: ValidationRule['severity'];
  message: string;
  timestamp: Date;
  duration: number;
  context: ValidationContext;
}

export interface ValidationSummary {
  stageId: string;
  totalRules: number;
  passed: number;
  failed: number;
  warnings: number;
  errors: number;
  duration: number;
  results: ValidationResult[];
  overallStatus: 'passed' | 'failed' | 'passed_with_warnings';
}

export class ValidationEngine extends EventEmitter {
  /**
   * Executes validation rules for stage transitions.
   *
   * Extracted from StageProgressionValidator (1,188 LOC -> ~250 LOC component).
   * Handles:
   * - Validation rule definition and execution
   * - Sync and async validation
   * - Rule prioritization
   * - Validation caching
   * - Custom validators
   */

  private validationRules: Map<string, ValidationRule>;
  private stageValidators: Map<string, Set<string>>; // stage -> rule IDs
  private validationCache: Map<string, ValidationSummary>;
  private customValidators: Map<string, (context: ValidationContext) => boolean | Promise<boolean>>;
  private defaultTimeout: number = 30000;
  private enableCaching: boolean = true;

  constructor() {
    super();

    this.validationRules = new Map();
    this.stageValidators = new Map();
    this.validationCache = new Map();
    this.customValidators = new Map();

    this.loadBuiltInValidators();
  }

  private loadBuiltInValidators(): void {
    // Common validation rules
    this.defineRule({
      id: 'required-fields',
      name: 'Required Fields Validation',
      description: 'Checks if all required fields are present',
      type: 'sync',
      severity: 'error',
      validator: (context) => {
        const required = context.data.requiredFields || [];
        for (const field of required) {
          if (!(field in context.data)) {
            return false;
          }
        }
        return true;
      },
      errorMessage: 'Missing required fields'
    });

    this.defineRule({
      id: 'data-type-validation',
      name: 'Data Type Validation',
      description: 'Validates data types',
      type: 'sync',
      severity: 'error',
      validator: (context) => {
        const schema = context.data.schema;
        if (!schema) return true;

        for (const [key, expectedType] of Object.entries(schema)) {
          const actualType = typeof context.data[key];
          if (actualType !== expectedType) {
            return false;
          }
        }
        return true;
      },
      errorMessage: 'Data type mismatch'
    });

    this.defineRule({
      id: 'dependency-check',
      name: 'Dependency Validation',
      description: 'Checks if dependencies are satisfied',
      type: 'async',
      severity: 'error',
      validator: async (context) => {
        const dependencies = context.data.dependencies || [];
        for (const dep of dependencies) {
          // Simulate async dependency check
          await new Promise(resolve => setTimeout(resolve, 10));
          if (!context.environment[dep]) {
            return false;
          }
        }
        return true;
      },
      errorMessage: 'Dependencies not satisfied'
    });
  }

  defineRule(rule: ValidationRule): void {
    this.validationRules.set(rule.id, rule);
    this.emit('ruleDefine', rule);
  }

  assignRuleToStage(stageId: string, ruleId: string): void {
    if (!this.validationRules.has(ruleId)) {
      throw new Error(`Validation rule ${ruleId} not found`);
    }

    if (!this.stageValidators.has(stageId)) {
      this.stageValidators.set(stageId, new Set());
    }

    this.stageValidators.get(stageId)!.add(ruleId);
    this.emit('ruleAssigned', { stageId, ruleId });
  }

  async validateStage(context: ValidationContext): Promise<ValidationSummary> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(context);

    // Check cache
    if (this.enableCaching && this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey)!;
      this.emit('validationCacheHit', { stageId: context.stageId });
      return cached;
    }

    // Get rules for stage
    const ruleIds = this.stageValidators.get(context.stageId) || new Set();
    const results: ValidationResult[] = [];

    // Execute validations
    for (const ruleId of ruleIds) {
      const rule = this.validationRules.get(ruleId);
      if (!rule) continue;

      const result = await this.executeRule(rule, context);
      results.push(result);

      this.emit('ruleExecuted', result);

      // Stop on critical error if needed
      if (result.severity === 'error' && !result.passed) {
        this.emit('validationError', result);
      }
    }

    // Calculate summary
    const summary = this.createSummary(context.stageId, results, Date.now() - startTime);

    // Cache result
    if (this.enableCaching) {
      this.validationCache.set(cacheKey, summary);
    }

    this.emit('validationCompleted', summary);
    return summary;
  }

  private async executeRule(
    rule: ValidationRule,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    let passed = false;
    let message = rule.errorMessage;

    try {
      if (rule.type === 'async') {
        // Apply timeout for async validators
        passed = await this.executeWithTimeout(
          rule.validator(context),
          this.defaultTimeout
        );
      } else {
        passed = rule.validator(context) as boolean;
      }

      if (passed) {
        message = `Validation passed: ${rule.name}`;
      }
    } catch (error) {
      passed = false;
      message = `Validation error: ${error instanceof Error ? error.message : String(error)}`;
    }

    return {
      ruleId: rule.id,
      passed,
      severity: rule.severity,
      message,
      timestamp: new Date(),
      duration: Date.now() - startTime,
      context
    };
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Validation timeout')), timeoutMs)
      )
    ]);
  }

  private createSummary(
    stageId: string,
    results: ValidationResult[],
    duration: number
  ): ValidationSummary {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const errors = results.filter(r => !r.passed && r.severity === 'error').length;
    const warnings = results.filter(r => !r.passed && r.severity === 'warning').length;

    let overallStatus: ValidationSummary['overallStatus'] = 'passed';
    if (errors > 0) {
      overallStatus = 'failed';
    } else if (warnings > 0) {
      overallStatus = 'passed_with_warnings';
    }

    return {
      stageId,
      totalRules: results.length,
      passed,
      failed,
      warnings,
      errors,
      duration,
      results,
      overallStatus
    };
  }

  private getCacheKey(context: ValidationContext): string {
    return `${context.stageId}-${JSON.stringify(context.data)}`;
  }

  registerCustomValidator(
    name: string,
    validator: (context: ValidationContext) => boolean | Promise<boolean>
  ): void {
    this.customValidators.set(name, validator);

    // Create a rule for the custom validator
    this.defineRule({
      id: `custom-${name}`,
      name: `Custom Validator: ${name}`,
      description: 'Custom validation logic',
      type: 'async',
      severity: 'error',
      validator,
      errorMessage: `Custom validation failed: ${name}`
    });
  }

  clearCache(): void {
    this.validationCache.clear();
    this.emit('cacheCleared');
  }

  removeRule(ruleId: string): void {
    this.validationRules.delete(ruleId);

    // Remove from stage assignments
    for (const stageRules of this.stageValidators.values()) {
      stageRules.delete(ruleId);
    }

    this.emit('ruleRemoved', ruleId);
  }

  getRules(): ValidationRule[] {
    return Array.from(this.validationRules.values());
  }

  getStageRules(stageId: string): ValidationRule[] {
    const ruleIds = this.stageValidators.get(stageId);
    if (!ruleIds) return [];

    return Array.from(ruleIds)
      .map(id => this.validationRules.get(id))
      .filter(rule => rule !== undefined) as ValidationRule[];
  }

  async batchValidate(contexts: ValidationContext[]): Promise<ValidationSummary[]> {
    const results = await Promise.all(
      contexts.map(context => this.validateStage(context))
    );

    this.emit('batchValidationCompleted', {
      total: contexts.length,
      passed: results.filter(r => r.overallStatus === 'passed').length,
      failed: results.filter(r => r.overallStatus === 'failed').length
    });

    return results;
  }

  getMetrics(): any {
    const rules = Array.from(this.validationRules.values());
    const cacheSize = this.validationCache.size;

    return {
      totalRules: rules.length,
      syncRules: rules.filter(r => r.type === 'sync').length,
      asyncRules: rules.filter(r => r.type === 'async').length,
      customValidators: this.customValidators.size,
      stagesWithRules: this.stageValidators.size,
      cacheSize,
      cacheEnabled: this.enableCaching
    };
  }

  setCacheEnabled(enabled: boolean): void {
    this.enableCaching = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }
}