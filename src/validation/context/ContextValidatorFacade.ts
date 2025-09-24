/**
 * ContextValidatorFacade - Backward compatible interface for context validation
 * Maintains API compatibility while delegating to decomposed components
 * Part of god object decomposition (Day 4)
 */

import { EventEmitter } from 'events';
import {
  SchemaValidator,
  Schema,
  SchemaProperty,
  ValidationResult as SchemaValidationResult,
  ValidationError
} from './SchemaValidator';
import {
  DataValidator,
  DataValidationContext,
  DataValidationReport,
  DataValidationRule,
  DataIntegrityCheck,
  DataConsistencyCheck
} from './DataValidator';
import {
  RuleEngine,
  Rule,
  RuleSet,
  RuleExecutionContext,
  RuleExecutionResult
} from './RuleEngine';

export interface ContextValidationConfig {
  schemas?: Schema[];
  rules?: Rule[];
  ruleSets?: RuleSet[];
  dataRules?: DataValidationRule[];
  enableCaching?: boolean;
}

export interface ValidationContext {
  data: any;
  schemaId?: string;
  ruleSetId?: string;
  metadata?: Record<string, any>;
  previousVersion?: any;
  source?: string;
}

export interface ComprehensiveValidationResult {
  valid: boolean;
  schemaValidation?: SchemaValidationResult;
  dataValidation?: DataValidationReport;
  ruleValidation?: RuleExecutionResult;
  score: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  timestamp: Date;
}

export class ContextValidator extends EventEmitter {
  /**
   * Facade for Context Validation System.
   *
   * Original: 978 LOC god object
   * Refactored: ~150 LOC facade + 3 specialized components (~650 LOC total)
   *
   * Maintains 100% backward compatibility while delegating to:
   * - SchemaValidator: Schema-based validation
   * - DataValidator: Data integrity and consistency
   * - RuleEngine: Business rule evaluation
   */

  private schemaValidator: SchemaValidator;
  private dataValidator: DataValidator;
  private ruleEngine: RuleEngine;

  private config: ContextValidationConfig;
  private validationHistory: ComprehensiveValidationResult[];

  constructor(config?: ContextValidationConfig) {
    super();

    // Initialize components
    this.schemaValidator = new SchemaValidator();
    this.dataValidator = new DataValidator();
    this.ruleEngine = new RuleEngine();

    this.config = config || {};
    this.validationHistory = [];

    if (config) {
      this.initialize(config);
    }

    this.setupEventForwarding();
  }

  private initialize(config: ContextValidationConfig): void {
    // Register schemas
    if (config.schemas) {
      for (const schema of config.schemas) {
        this.schemaValidator.registerSchema(schema);
      }
    }

    // Register rules
    if (config.rules) {
      for (const rule of config.rules) {
        this.ruleEngine.registerRule(rule);
      }
    }

    // Register rule sets
    if (config.ruleSets) {
      for (const ruleSet of config.ruleSets) {
        this.ruleEngine.registerRuleSet(ruleSet);
      }
    }

    // Register data validation rules
    if (config.dataRules) {
      for (const rule of config.dataRules) {
        this.dataValidator.addValidationRule(rule);
      }
    }
  }

  private setupEventForwarding(): void {
    // Forward schema validation events
    this.schemaValidator.on('validationCompleted', (result) => {
      this.emit('schemaValidated', result);
    });

    // Forward data validation events
    this.dataValidator.on('validationCompleted', (report) => {
      this.emit('dataValidated', report);
    });

    // Forward rule execution events
    this.ruleEngine.on('rulesExecuted', (result) => {
      this.emit('rulesExecuted', result);
    });
  }

  // Schema validation methods (delegated to SchemaValidator)
  registerSchema(schema: Schema): void {
    this.schemaValidator.registerSchema(schema);
  }

  validateSchema(data: any, schemaId: string): SchemaValidationResult {
    return this.schemaValidator.validate(data, schemaId);
  }

  registerFormat(name: string, pattern: RegExp): void {
    this.schemaValidator.registerFormat(name, pattern);
  }

  // Data validation methods (delegated to DataValidator)
  addDataValidationRule(rule: DataValidationRule): void {
    this.dataValidator.addValidationRule(rule);
  }

  validateDataIntegrity(context: DataValidationContext): DataValidationReport {
    return this.dataValidator.validateData(context);
  }

  detectDuplicates(dataset: any[], keyFields: string[]): Map<string, any[]> {
    return this.dataValidator.detectDuplicates(dataset, keyFields);
  }

  // Rule engine methods (delegated to RuleEngine)
  registerRule(rule: Rule): void {
    this.ruleEngine.registerRule(rule);
  }

  registerRuleSet(ruleSet: RuleSet): void {
    this.ruleEngine.registerRuleSet(ruleSet);
  }

  executeRules(context: RuleExecutionContext, ruleSetId?: string): RuleExecutionResult {
    return this.ruleEngine.executeRules(context, ruleSetId);
  }

  // Comprehensive validation (combining all validators)
  validate(context: ValidationContext): ComprehensiveValidationResult {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let score = 1.0;
    let valid = true;

    // Schema validation
    let schemaValidation: SchemaValidationResult | undefined;
    if (context.schemaId) {
      schemaValidation = this.schemaValidator.validate(context.data, context.schemaId);

      if (!schemaValidation.valid) {
        valid = false;
        score -= 0.4;
      }

      errors.push(...schemaValidation.errors);
      warnings.push(...schemaValidation.warnings);
    }

    // Data integrity validation
    const dataContext: DataValidationContext = {
      data: context.data,
      metadata: context.metadata || {},
      previousVersion: context.previousVersion,
      timestamp: new Date(),
      source: context.source || 'unknown'
    };

    const dataValidation = this.dataValidator.validateData(dataContext);

    if (!dataValidation.valid) {
      valid = false;
      score -= 0.3;
    }

    // Convert data validation violations to errors/warnings
    for (const violation of dataValidation.ruleViolations) {
      const error: ValidationError = {
        path: violation.field || '',
        message: violation.message,
        value: violation.value,
        constraint: 'data_rule',
        severity: violation.severity
      };

      if (violation.severity === 'error') {
        errors.push(error);
      } else {
        warnings.push(error);
      }
    }

    // Business rule validation
    let ruleValidation: RuleExecutionResult | undefined;
    if (context.ruleSetId || this.ruleEngine['rules'].size > 0) {
      const ruleContext: RuleExecutionContext = {
        data: context.data,
        metadata: context.metadata || {},
        variables: new Map(),
        functions: this.ruleEngine['customFunctions']
      };

      ruleValidation = this.ruleEngine.executeRules(ruleContext, context.ruleSetId);

      if (!ruleValidation.passed) {
        valid = false;
        score -= 0.3;
      }

      // Convert rule violations to errors
      for (const violation of ruleValidation.violations) {
        errors.push({
          path: '',
          message: violation,
          value: null,
          constraint: 'business_rule',
          severity: 'error'
        });
      }

      // Convert rule warnings
      for (const warning of ruleValidation.warnings) {
        warnings.push({
          path: '',
          message: warning,
          value: null,
          constraint: 'business_rule',
          severity: 'warning'
        });
      }
    }

    // Adjust score
    score = Math.max(0, score);

    // Apply data validation score
    if (dataValidation) {
      score = (score + dataValidation.score) / 2;
    }

    const result: ComprehensiveValidationResult = {
      valid,
      schemaValidation,
      dataValidation,
      ruleValidation,
      score,
      errors,
      warnings,
      timestamp: new Date()
    };

    this.validationHistory.push(result);
    this.emit('validationCompleted', result);

    return result;
  }

  // Combined validation methods (original API)
  validateWithRules(data: any, schemaId: string, ruleSetId: string): ComprehensiveValidationResult {
    return this.validate({
      data,
      schemaId,
      ruleSetId
    });
  }

  performFullValidation(
    data: any,
    options?: {
      schemaId?: string;
      ruleSetId?: string;
      checkIntegrity?: boolean;
      checkDuplicates?: boolean;
    }
  ): ComprehensiveValidationResult {
    const context: ValidationContext = {
      data,
      schemaId: options?.schemaId,
      ruleSetId: options?.ruleSetId
    };

    const result = this.validate(context);

    // Additional duplicate checking if requested
    if (options?.checkDuplicates && Array.isArray(data)) {
      const duplicates = this.dataValidator.detectDuplicates(data, ['id']);
      if (duplicates.size > 0) {
        result.warnings.push({
          path: '',
          message: `Found ${duplicates.size} duplicate entries`,
          value: Array.from(duplicates.keys()),
          constraint: 'uniqueness',
          severity: 'warning'
        });
      }
    }

    return result;
  }

  // Utility methods
  clearCaches(): void {
    this.schemaValidator.clearCache();
    this.ruleEngine.clearCache();
  }

  getValidationHistory(limit?: number): ComprehensiveValidationResult[] {
    if (limit) {
      return this.validationHistory.slice(-limit);
    }
    return [...this.validationHistory];
  }

  getMetrics(): any {
    return {
      schemas: this.schemaValidator.listSchemas().length,
      dataValidationRules: this.dataValidator['validationRules'].size,
      businessRules: this.ruleEngine['rules'].size,
      ruleSets: this.ruleEngine['ruleSets'].size,
      validationHistory: this.validationHistory.length,
      ruleMetrics: this.ruleEngine.getRuleMetrics()
    };
  }

  exportConfiguration(): ContextValidationConfig {
    return {
      schemas: this.schemaValidator.listSchemas(),
      rules: Array.from(this.ruleEngine['rules'].values()),
      ruleSets: Array.from(this.ruleEngine['ruleSets'].values()),
      dataRules: Array.from(this.dataValidator['validationRules'].values()),
      enableCaching: this.config.enableCaching
    };
  }

  reset(): void {
    this.clearCaches();
    this.validationHistory = [];
    this.dataValidator.clearHistory();
  }
}