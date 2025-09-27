import { EventEmitter } from 'events';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  enabled: boolean;
  conditions: ValidationCondition[];
  actions: ValidationAction[];
  tags: string[];
  metadata: Record<string, any>;
}

export type ValidationCategory =
  | 'data_integrity'
  | 'business_logic'
  | 'performance'
  | 'security'
  | 'compliance'
  | 'consistency'
  | 'availability'
  | 'functionality'
  | 'compatibility'
  | 'custom';

export type ValidationSeverity = 'blocker' | 'critical' | 'major' | 'minor' | 'info';

export interface ValidationCondition {
  id: string;
  type: ConditionType;
  operator: ConditionOperator;
  field: string;
  value: any;
  tolerance: number;
  required: boolean;
  description: string;
}

export type ConditionType =
  | 'data_comparison'
  | 'count_validation'
  | 'schema_validation'
  | 'format_validation'
  | 'range_validation'
  | 'relationship_validation'
  | 'checksum_validation'
  | 'custom_validation';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'contains'
  | 'not_contains'
  | 'matches_pattern'
  | 'in_range'
  | 'is_null'
  | 'is_not_null'
  | 'exists'
  | 'not_exists';

export interface ValidationAction {
  id: string;
  type: ActionType;
  priority: number;
  autoExecute: boolean;
  parameters: Record<string, any>;
  conditions: string[];
  description: string;
}

export type ActionType =
  | 'log_warning'
  | 'log_error'
  | 'send_alert'
  | 'auto_correct'
  | 'rollback_change'
  | 'pause_migration'
  | 'terminate_migration'
  | 'create_ticket'
  | 'notify_stakeholder'
  | 'custom_action';

export interface ValidationResult {
  ruleId: string;
  status: ValidationStatus;
  timestamp: Date;
  executionTime: number;
  violations: ValidationViolation[];
  warnings: ValidationWarning[];
  summary: string;
  confidence: number;
  metadata: Record<string, any>;
}

export type ValidationStatus = 'passed' | 'failed' | 'warning' | 'skipped' | 'error';

export interface ValidationViolation {
  id: string;
  ruleId: string;
  conditionId: string;
  severity: ValidationSeverity;
  message: string;
  actualValue: any;
  expectedValue: any;
  context: ValidationContext;
  recommendation: string;
  autoCorrectAvailable: boolean;
}

export interface ValidationWarning {
  id: string;
  ruleId: string;
  message: string;
  context: ValidationContext;
  recommendation: string;
}

export interface ValidationContext {
  migrationId: string;
  migrationPhase: string;
  sourceSystem: string;
  targetSystem: string;
  dataSet: string;
  recordId?: string;
  field?: string;
  timestamp: Date;
  additionalContext: Record<string, any>;
}

export interface ValidationReport {
  migrationId: string;
  validationId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  warningRules: number;
  skippedRules: number;
  overallStatus: ValidationStatus;
  confidence: number;
  results: ValidationResult[];
  summary: ValidationSummary;
  recommendations: string[];
}

export interface ValidationSummary {
  criticalIssues: number;
  majorIssues: number;
  minorIssues: number;
  blockerIssues: number;
  totalViolations: number;
  dataIntegrityScore: number;
  performanceScore: number;
  securityScore: number;
  complianceScore: number;
  overallHealthScore: number;
}

export interface DataSnapshot {
  id: string;
  timestamp: Date;
  source: string;
  schema: Record<string, any>;
  records: any[];
  metadata: Record<string, any>;
  checksum: string;
}

export interface SchemaDefinition {
  name: string;
  version: string;
  fields: SchemaField[];
  constraints: SchemaConstraint[];
  relationships: SchemaRelationship[];
}

export interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  nullable: boolean;
  defaultValue?: any;
  constraints: FieldConstraint[];
}

export interface FieldConstraint {
  type: 'min_length' | 'max_length' | 'pattern' | 'min_value' | 'max_value' | 'enum';
  value: any;
  message: string;
}

export interface SchemaConstraint {
  type: 'unique' | 'primary_key' | 'foreign_key' | 'check' | 'index';
  fields: string[];
  reference?: string;
  condition?: string;
}

export interface SchemaRelationship {
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
  sourceField: string;
  targetTable: string;
  targetField: string;
  cascadeDelete: boolean;
}

export abstract class ValidationEngine {
  abstract validate(data: any, rule: ValidationRule, context: ValidationContext): Promise<ValidationResult>;
  abstract getEngineType(): ValidationCategory;
  abstract supportsRule(rule: ValidationRule): boolean;
}

export class DataIntegrityEngine extends ValidationEngine {
  async validate(data: any, rule: ValidationRule, context: ValidationContext): Promise<ValidationResult> {
    const result: ValidationResult = {
      ruleId: rule.id,
      status: 'passed',
      timestamp: new Date(),
      executionTime: 0,
      violations: [],
      warnings: [],
      summary: '',
      confidence: 100,
      metadata: {}
    };

    const startTime = Date.now();

    try {
      for (const condition of rule.conditions) {
        const violation = await this.validateCondition(data, condition, context, rule);
        if (violation) {
          result.violations.push(violation);
          result.status = this.getSeverityStatus(violation.severity);
        }
      }

      if (result.violations.length === 0) {
        result.summary = 'All data integrity checks passed';
      } else {
        result.summary = `Found ${result.violations.length} data integrity violation(s)`;
        result.confidence = Math.max(0, 100 - (result.violations.length * 20));
      }

    } catch (error) {
      result.status = 'error';
      result.summary = `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.confidence = 0;
    }

    result.executionTime = Date.now() - startTime;
    return result;
  }

  private async validateCondition(
    data: any,
    condition: ValidationCondition,
    context: ValidationContext,
    rule: ValidationRule
  ): Promise<ValidationViolation | null> {
    const actualValue = this.extractFieldValue(data, condition.field);
    const expectedValue = condition.value;

    const isValid = this.evaluateCondition(actualValue, expectedValue, condition.operator, condition.tolerance);

    if (!isValid) {
      return {
        id: this.generateViolationId(),
        ruleId: rule.id,
        conditionId: condition.id,
        severity: rule.severity,
        message: `Data integrity violation: ${condition.description}`,
        actualValue,
        expectedValue,
        context,
        recommendation: this.generateRecommendation(condition, actualValue, expectedValue),
        autoCorrectAvailable: this.canAutoCorrect(condition)
      };
    }

    return null;
  }

  private extractFieldValue(data: any, field: string): any {
    const parts = field.split('.');
    let value = data;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private evaluateCondition(actual: any, expected: any, operator: ConditionOperator, tolerance: number): boolean {
    switch (operator) {
      case 'equals':
        return this.isEqual(actual, expected, tolerance);
      case 'not_equals':
        return !this.isEqual(actual, expected, tolerance);
      case 'greater_than':
        return Number(actual) > Number(expected);
      case 'less_than':
        return Number(actual) < Number(expected);
      case 'greater_or_equal':
        return Number(actual) >= Number(expected);
      case 'less_or_equal':
        return Number(actual) <= Number(expected);
      case 'contains':
        return String(actual).includes(String(expected));
      case 'not_contains':
        return !String(actual).includes(String(expected));
      case 'matches_pattern':
        return new RegExp(String(expected)).test(String(actual));
      case 'in_range':
        if (Array.isArray(expected) && expected.length === 2) {
          const num = Number(actual);
          return num >= Number(expected[0]) && num <= Number(expected[1]);
        }
        return false;
      case 'is_null':
        return actual === null || actual === undefined;
      case 'is_not_null':
        return actual !== null && actual !== undefined;
      case 'exists':
        return actual !== undefined;
      case 'not_exists':
        return actual === undefined;
      default:
        return false;
    }
  }

  private isEqual(actual: any, expected: any, tolerance: number): boolean {
    if (typeof actual === 'number' && typeof expected === 'number') {
      return Math.abs(actual - expected) <= tolerance;
    }
    return actual === expected;
  }

  private getSeverityStatus(severity: ValidationSeverity): ValidationStatus {
    switch (severity) {
      case 'blocker':
      case 'critical':
        return 'failed';
      case 'major':
      case 'minor':
        return 'warning';
      case 'info':
        return 'passed';
      default:
        return 'warning';
    }
  }

  private generateRecommendation(condition: ValidationCondition, actual: any, expected: any): string {
    switch (condition.type) {
      case 'data_comparison':
        return `Expected ${condition.field} to be ${expected}, but got ${actual}. Verify data transformation logic.`;
      case 'count_validation':
        return `Record count mismatch. Expected ${expected} records, found ${actual}. Check data extraction and loading processes.`;
      case 'schema_validation':
        return `Schema validation failed for ${condition.field}. Ensure data types and constraints are compatible.`;
      case 'format_validation':
        return `Data format validation failed. Expected format: ${expected}, actual: ${actual}. Verify data parsing and formatting.`;
      case 'range_validation':
        return `Value ${actual} is outside expected range ${expected}. Check business rules and data quality.`;
      default:
        return 'Review the validation condition and ensure data meets requirements.';
    }
  }

  private canAutoCorrect(condition: ValidationCondition): boolean {
    return ['format_validation', 'data_comparison'].includes(condition.type);
  }

  private generateViolationId(): string {
    return `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getEngineType(): ValidationCategory {
    return 'data_integrity';
  }

  supportsRule(rule: ValidationRule): boolean {
    return rule.category === 'data_integrity';
  }
}

export class SchemaValidationEngine extends ValidationEngine {
  async validate(data: any, rule: ValidationRule, context: ValidationContext): Promise<ValidationResult> {
    const result: ValidationResult = {
      ruleId: rule.id,
      status: 'passed',
      timestamp: new Date(),
      executionTime: 0,
      violations: [],
      warnings: [],
      summary: '',
      confidence: 100,
      metadata: {}
    };

    const startTime = Date.now();

    try {
      const schema = rule.metadata.schema as SchemaDefinition;
      if (!schema) {
        throw new Error('Schema definition not found in rule metadata');
      }

      const violations = await this.validateSchema(data, schema, context, rule);
      result.violations.push(...violations);

      if (violations.length > 0) {
        result.status = 'failed';
        result.summary = `Schema validation failed with ${violations.length} violation(s)`;
        result.confidence = Math.max(0, 100 - (violations.length * 15));
      } else {
        result.summary = 'Schema validation passed';
      }

    } catch (error) {
      result.status = 'error';
      result.summary = `Schema validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.confidence = 0;
    }

    result.executionTime = Date.now() - startTime;
    return result;
  }

  private async validateSchema(
    data: any,
    schema: SchemaDefinition,
    context: ValidationContext,
    rule: ValidationRule
  ): Promise<ValidationViolation[]> {
    const violations: ValidationViolation[] = [];

    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        const record = data[i];
        const recordViolations = await this.validateRecord(record, schema, context, rule, i);
        violations.push(...recordViolations);
      }
    } else {
      const recordViolations = await this.validateRecord(data, schema, context, rule);
      violations.push(...recordViolations);
    }

    return violations;
  }

  private async validateRecord(
    record: any,
    schema: SchemaDefinition,
    context: ValidationContext,
    rule: ValidationRule,
    recordIndex?: number
  ): Promise<ValidationViolation[]> {
    const violations: ValidationViolation[] = [];

    for (const field of schema.fields) {
      const value = record[field.name];

      if (field.required && (value === undefined || value === null)) {
        violations.push({
          id: this.generateViolationId(),
          ruleId: rule.id,
          conditionId: field.name,
          severity: 'major',
          message: `Required field '${field.name}' is missing`,
          actualValue: value,
          expectedValue: 'non-null value',
          context: {
            ...context,
            field: field.name,
            recordId: recordIndex?.toString()
          },
          recommendation: `Ensure '${field.name}' is provided in the source data`,
          autoCorrectAvailable: false
        });
        continue;
      }

      if (value !== null && value !== undefined) {
        const typeViolation = this.validateFieldType(value, field, context, rule, recordIndex);
        if (typeViolation) violations.push(typeViolation);

        const constraintViolations = this.validateFieldConstraints(value, field, context, rule, recordIndex);
        violations.push(...constraintViolations);
      }
    }

    return violations;
  }

  private validateFieldType(
    value: any,
    field: SchemaField,
    context: ValidationContext,
    rule: ValidationRule,
    recordIndex?: number
  ): ValidationViolation | null {
    const actualType = typeof value;
    const expectedType = field.type.toLowerCase();

    let isValidType = false;

    switch (expectedType) {
      case 'string':
        isValidType = actualType === 'string';
        break;
      case 'number':
      case 'integer':
        isValidType = actualType === 'number' && (expectedType !== 'integer' || Number.isInteger(value));
        break;
      case 'boolean':
        isValidType = actualType === 'boolean';
        break;
      case 'date':
        isValidType = value instanceof Date || !isNaN(Date.parse(value));
        break;
      case 'array':
        isValidType = Array.isArray(value);
        break;
      case 'object':
        isValidType = actualType === 'object' && !Array.isArray(value);
        break;
      default:
        isValidType = true;
    }

    if (!isValidType) {
      return {
        id: this.generateViolationId(),
        ruleId: rule.id,
        conditionId: field.name,
        severity: 'major',
        message: `Type mismatch for field '${field.name}': expected ${expectedType}, got ${actualType}`,
        actualValue: value,
        expectedValue: expectedType,
        context: {
          ...context,
          field: field.name,
          recordId: recordIndex?.toString()
        },
        recommendation: `Convert '${field.name}' to ${expectedType} type`,
        autoCorrectAvailable: true
      };
    }

    return null;
  }

  private validateFieldConstraints(
    value: any,
    field: SchemaField,
    context: ValidationContext,
    rule: ValidationRule,
    recordIndex?: number
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    for (const constraint of field.constraints) {
      const violation = this.validateConstraint(value, field, constraint, context, rule, recordIndex);
      if (violation) violations.push(violation);
    }

    return violations;
  }

  private validateConstraint(
    value: any,
    field: SchemaField,
    constraint: FieldConstraint,
    context: ValidationContext,
    rule: ValidationRule,
    recordIndex?: number
  ): ValidationViolation | null {
    let isValid = true;
    let message = '';

    switch (constraint.type) {
      case 'min_length':
        isValid = String(value).length >= Number(constraint.value);
        message = `Field '${field.name}' length is below minimum of ${constraint.value}`;
        break;
      case 'max_length':
        isValid = String(value).length <= Number(constraint.value);
        message = `Field '${field.name}' length exceeds maximum of ${constraint.value}`;
        break;
      case 'pattern':
        isValid = new RegExp(String(constraint.value)).test(String(value));
        message = `Field '${field.name}' does not match required pattern`;
        break;
      case 'min_value':
        isValid = Number(value) >= Number(constraint.value);
        message = `Field '${field.name}' value is below minimum of ${constraint.value}`;
        break;
      case 'max_value':
        isValid = Number(value) <= Number(constraint.value);
        message = `Field '${field.name}' value exceeds maximum of ${constraint.value}`;
        break;
      case 'enum':
        isValid = Array.isArray(constraint.value) && constraint.value.includes(value);
        message = `Field '${field.name}' value is not in allowed values: ${constraint.value.join(', ')}`;
        break;
    }

    if (!isValid) {
      return {
        id: this.generateViolationId(),
        ruleId: rule.id,
        conditionId: field.name,
        severity: 'minor',
        message: constraint.message || message,
        actualValue: value,
        expectedValue: constraint.value,
        context: {
          ...context,
          field: field.name,
          recordId: recordIndex?.toString()
        },
        recommendation: `Adjust '${field.name}' to meet constraint requirements`,
        autoCorrectAvailable: constraint.type === 'min_length' || constraint.type === 'max_length'
      };
    }

    return null;
  }

  private generateViolationId(): string {
    return `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getEngineType(): ValidationCategory {
    return 'data_integrity';
  }

  supportsRule(rule: ValidationRule): boolean {
    return rule.category === 'data_integrity' && rule.metadata.schema;
  }
}

export class PerformanceValidationEngine extends ValidationEngine {
  async validate(data: any, rule: ValidationRule, context: ValidationContext): Promise<ValidationResult> {
    const result: ValidationResult = {
      ruleId: rule.id,
      status: 'passed',
      timestamp: new Date(),
      executionTime: 0,
      violations: [],
      warnings: [],
      summary: '',
      confidence: 100,
      metadata: {}
    };

    const startTime = Date.now();

    try {
      const performanceMetrics = this.extractPerformanceMetrics(data, rule.metadata);
      const violations = await this.validatePerformanceThresholds(performanceMetrics, rule, context);

      result.violations.push(...violations);
      result.metadata.performanceMetrics = performanceMetrics;

      if (violations.length > 0) {
        result.status = 'warning';
        result.summary = `Performance validation found ${violations.length} threshold violation(s)`;
        result.confidence = Math.max(0, 100 - (violations.length * 10));
      } else {
        result.summary = 'All performance thresholds met';
      }

    } catch (error) {
      result.status = 'error';
      result.summary = `Performance validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.confidence = 0;
    }

    result.executionTime = Date.now() - startTime;
    return result;
  }

  private extractPerformanceMetrics(data: any, metadata: Record<string, any>): Record<string, number> {
    const metrics: Record<string, number> = {};

    if (metadata.extractExecutionTime && data.executionTime) {
      metrics.executionTime = Number(data.executionTime);
    }

    if (metadata.extractThroughput && data.throughput) {
      metrics.throughput = Number(data.throughput);
    }

    if (metadata.extractMemoryUsage && data.memoryUsage) {
      metrics.memoryUsage = Number(data.memoryUsage);
    }

    if (metadata.extractLatency && data.latency) {
      metrics.latency = Number(data.latency);
    }

    if (Array.isArray(data)) {
      metrics.recordCount = data.length;
    }

    return metrics;
  }

  private async validatePerformanceThresholds(
    metrics: Record<string, number>,
    rule: ValidationRule,
    context: ValidationContext
  ): Promise<ValidationViolation[]> {
    const violations: ValidationViolation[] = [];

    for (const condition of rule.conditions) {
      if (condition.type === 'performance') {
        const metricValue = metrics[condition.field];
        if (metricValue !== undefined) {
          const isValid = this.evaluatePerformanceCondition(metricValue, condition);
          if (!isValid) {
            violations.push({
              id: this.generateViolationId(),
              ruleId: rule.id,
              conditionId: condition.id,
              severity: rule.severity,
              message: `Performance threshold violation: ${condition.description}`,
              actualValue: metricValue,
              expectedValue: condition.value,
              context,
              recommendation: this.generatePerformanceRecommendation(condition.field, metricValue, condition.value),
              autoCorrectAvailable: false
            });
          }
        }
      }
    }

    return violations;
  }

  private evaluatePerformanceCondition(actual: number, condition: ValidationCondition): boolean {
    const expected = Number(condition.value);

    switch (condition.operator) {
      case 'less_than':
        return actual < expected;
      case 'less_or_equal':
        return actual <= expected;
      case 'greater_than':
        return actual > expected;
      case 'greater_or_equal':
        return actual >= expected;
      case 'in_range':
        if (Array.isArray(condition.value) && condition.value.length === 2) {
          return actual >= Number(condition.value[0]) && actual <= Number(condition.value[1]);
        }
        return false;
      default:
        return true;
    }
  }

  private generatePerformanceRecommendation(metric: string, actual: number, expected: any): string {
    switch (metric) {
      case 'executionTime':
        return `Execution time of ${actual}ms exceeds threshold. Consider optimizing queries or parallel processing.`;
      case 'throughput':
        return `Throughput of ${actual} records/sec is below expected ${expected}. Review batch sizes and processing logic.`;
      case 'memoryUsage':
        return `Memory usage of ${actual}MB exceeds threshold. Optimize data structures or implement streaming.`;
      case 'latency':
        return `Latency of ${actual}ms is higher than expected. Check network connectivity and query optimization.`;
      default:
        return `Performance metric '${metric}' needs optimization.`;
    }
  }

  private generateViolationId(): string {
    return `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getEngineType(): ValidationCategory {
    return 'performance';
  }

  supportsRule(rule: ValidationRule): boolean {
    return rule.category === 'performance';
  }
}

export class MigrationValidator extends EventEmitter {
  private validationRules: Map<string, ValidationRule> = new Map();
  private validationEngines: Map<ValidationCategory, ValidationEngine> = new Map();
  private validationHistory: ValidationReport[] = [];
  private dataSnapshots: Map<string, DataSnapshot> = new Map();

  constructor() {
    super();
    this.initializeDefaultEngines();
  }

  private initializeDefaultEngines(): void {
    this.registerEngine(new DataIntegrityEngine());
    this.registerEngine(new SchemaValidationEngine());
    this.registerEngine(new PerformanceValidationEngine());
  }

  registerEngine(engine: ValidationEngine): void {
    this.validationEngines.set(engine.getEngineType(), engine);
  }

  addValidationRule(rule: ValidationRule): void {
    this.validationRules.set(rule.id, rule);
    this.emit('validationRuleAdded', rule);
  }

  removeValidationRule(ruleId: string): boolean {
    const removed = this.validationRules.delete(ruleId);
    if (removed) {
      this.emit('validationRuleRemoved', { ruleId });
    }
    return removed;
  }

  async validateMigration(
    migrationId: string,
    data: any,
    context: Partial<ValidationContext> = {}
  ): Promise<ValidationReport> {
    const validationId = this.generateValidationId();
    const startTime = new Date();

    const validationContext: ValidationContext = {
      migrationId,
      migrationPhase: context.migrationPhase || 'unknown',
      sourceSystem: context.sourceSystem || 'unknown',
      targetSystem: context.targetSystem || 'unknown',
      dataSet: context.dataSet || 'unknown',
      timestamp: new Date(),
      additionalContext: context.additionalContext || {}
    };

    this.emit('validationStarted', { migrationId, validationId, context: validationContext });

    const report: ValidationReport = {
      migrationId,
      validationId,
      startTime,
      endTime: new Date(),
      duration: 0,
      totalRules: 0,
      passedRules: 0,
      failedRules: 0,
      warningRules: 0,
      skippedRules: 0,
      overallStatus: 'passed',
      confidence: 100,
      results: [],
      summary: {
        criticalIssues: 0,
        majorIssues: 0,
        minorIssues: 0,
        blockerIssues: 0,
        totalViolations: 0,
        dataIntegrityScore: 100,
        performanceScore: 100,
        securityScore: 100,
        complianceScore: 100,
        overallHealthScore: 100
      },
      recommendations: []
    };

    try {
      const enabledRules = Array.from(this.validationRules.values()).filter(rule => rule.enabled);
      report.totalRules = enabledRules.length;

      for (const rule of enabledRules) {
        const engine = this.validationEngines.get(rule.category);
        if (!engine || !engine.supportsRule(rule)) {
          report.skippedRules++;
          continue;
        }

        try {
          const result = await engine.validate(data, rule, validationContext);
          report.results.push(result);

          switch (result.status) {
            case 'passed':
              report.passedRules++;
              break;
            case 'failed':
              report.failedRules++;
              break;
            case 'warning':
              report.warningRules++;
              break;
            default:
              report.skippedRules++;
          }

        } catch (error) {
          report.skippedRules++;
          this.emit('validationRuleError', {
            ruleId: rule.id,
            error,
            migrationId,
            validationId
          });
        }
      }

      this.calculateOverallResults(report);
      this.generateRecommendations(report);

    } catch (error) {
      report.overallStatus = 'error';
      report.confidence = 0;
      this.emit('validationError', { error, migrationId, validationId });
    }

    report.endTime = new Date();
    report.duration = report.endTime.getTime() - report.startTime.getTime();

    this.validationHistory.push(report);
    this.emit('validationCompleted', report);

    return report;
  }

  private calculateOverallResults(report: ValidationReport): void {
    let totalViolations = 0;
    let criticalIssues = 0;
    let majorIssues = 0;
    let minorIssues = 0;
    let blockerIssues = 0;

    for (const result of report.results) {
      totalViolations += result.violations.length;

      for (const violation of result.violations) {
        switch (violation.severity) {
          case 'blocker':
            blockerIssues++;
            break;
          case 'critical':
            criticalIssues++;
            break;
          case 'major':
            majorIssues++;
            break;
          case 'minor':
            minorIssues++;
            break;
        }
      }
    }

    report.summary.totalViolations = totalViolations;
    report.summary.criticalIssues = criticalIssues;
    report.summary.majorIssues = majorIssues;
    report.summary.minorIssues = minorIssues;
    report.summary.blockerIssues = blockerIssues;

    if (blockerIssues > 0 || criticalIssues > 0) {
      report.overallStatus = 'failed';
    } else if (majorIssues > 0 || minorIssues > 0) {
      report.overallStatus = 'warning';
    } else {
      report.overallStatus = 'passed';
    }

    report.summary.dataIntegrityScore = this.calculateCategoryScore(report, 'data_integrity');
    report.summary.performanceScore = this.calculateCategoryScore(report, 'performance');
    report.summary.securityScore = this.calculateCategoryScore(report, 'security');
    report.summary.complianceScore = this.calculateCategoryScore(report, 'compliance');

    const scores = [
      report.summary.dataIntegrityScore,
      report.summary.performanceScore,
      report.summary.securityScore,
      report.summary.complianceScore
    ];

    report.summary.overallHealthScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    report.confidence = Math.max(0, 100 - (totalViolations * 5));
  }

  private calculateCategoryScore(report: ValidationReport, category: ValidationCategory): number {
    const categoryResults = report.results.filter(r => {
      const rule = this.validationRules.get(r.ruleId);
      return rule && rule.category === category;
    });

    if (categoryResults.length === 0) return 100;

    const totalViolations = categoryResults.reduce((sum, result) => sum + result.violations.length, 0);
    const maxPossibleViolations = categoryResults.length * 5;

    return Math.max(0, 100 - ((totalViolations / maxPossibleViolations) * 100));
  }

  private generateRecommendations(report: ValidationReport): void {
    const recommendations: string[] = [];

    if (report.summary.blockerIssues > 0) {
      recommendations.push('Address all blocker issues before proceeding with migration');
    }

    if (report.summary.criticalIssues > 0) {
      recommendations.push('Resolve critical data integrity issues to prevent data corruption');
    }

    if (report.summary.performanceScore < 70) {
      recommendations.push('Optimize migration performance to meet SLA requirements');
    }

    if (report.summary.dataIntegrityScore < 80) {
      recommendations.push('Improve data quality and validation processes');
    }

    if (report.summary.overallHealthScore < 75) {
      recommendations.push('Consider postponing migration until quality issues are resolved');
    }

    report.recommendations = recommendations;
  }

  createDataSnapshot(id: string, source: string, data: any[]): DataSnapshot {
    const snapshot: DataSnapshot = {
      id,
      timestamp: new Date(),
      source,
      schema: this.inferSchema(data),
      records: data,
      metadata: {
        recordCount: data.length,
        version: '1.0.0'
      },
      checksum: this.calculateChecksum(data)
    };

    this.dataSnapshots.set(id, snapshot);
    this.emit('dataSnapshotCreated', snapshot);

    return snapshot;
  }

  private inferSchema(data: any[]): Record<string, any> {
    if (data.length === 0) return {};

    const schema: Record<string, any> = {};
    const sample = data[0];

    for (const [key, value] of Object.entries(sample)) {
      schema[key] = {
        type: typeof value,
        nullable: false,
        inferred: true
      };
    }

    return schema;
  }

  private calculateChecksum(data: any[]): string {
    const content = JSON.stringify(data);
    let hash = 0;

    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(16);
  }

  private generateValidationId(): string {
    return `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getValidationRule(ruleId: string): ValidationRule | null {
    return this.validationRules.get(ruleId) || null;
  }

  getValidationRules(category?: ValidationCategory): ValidationRule[] {
    const rules = Array.from(this.validationRules.values());

    if (category) {
      return rules.filter(rule => rule.category === category);
    }

    return rules;
  }

  getValidationReport(validationId: string): ValidationReport | null {
    return this.validationHistory.find(report => report.validationId === validationId) || null;
  }

  getValidationHistory(migrationId?: string): ValidationReport[] {
    if (migrationId) {
      return this.validationHistory.filter(report => report.migrationId === migrationId);
    }

    return [...this.validationHistory];
  }

  getDataSnapshot(snapshotId: string): DataSnapshot | null {
    return this.dataSnapshots.get(snapshotId) || null;
  }

  compareDataSnapshots(snapshot1Id: string, snapshot2Id: string): any {
    const snapshot1 = this.dataSnapshots.get(snapshot1Id);
    const snapshot2 = this.dataSnapshots.get(snapshot2Id);

    if (!snapshot1 || !snapshot2) {
      throw new Error('One or both snapshots not found');
    }

    return {
      checksumMatch: snapshot1.checksum === snapshot2.checksum,
      recordCountDifference: snapshot2.records.length - snapshot1.records.length,
      schemaDifferences: this.compareSchemas(snapshot1.schema, snapshot2.schema),
      dataDifferences: this.compareData(snapshot1.records, snapshot2.records)
    };
  }

  private compareSchemas(schema1: Record<string, any>, schema2: Record<string, any>): any {
    const differences: any = {
      added: [],
      removed: [],
      modified: []
    };

    const fields1 = new Set(Object.keys(schema1));
    const fields2 = new Set(Object.keys(schema2));

    for (const field of fields2) {
      if (!fields1.has(field)) {
        differences.added.push(field);
      }
    }

    for (const field of fields1) {
      if (!fields2.has(field)) {
        differences.removed.push(field);
      } else if (JSON.stringify(schema1[field]) !== JSON.stringify(schema2[field])) {
        differences.modified.push({
          field,
          before: schema1[field],
          after: schema2[field]
        });
      }
    }

    return differences;
  }

  private compareData(data1: any[], data2: any[]): any {
    return {
      recordCountChange: data2.length - data1.length,
      sampleDifferences: this.sampleDataDifferences(data1.slice(0, 10), data2.slice(0, 10))
    };
  }

  private sampleDataDifferences(sample1: any[], sample2: any[]): any[] {
    const differences: any[] = [];

    const maxLength = Math.max(sample1.length, sample2.length);

    for (let i = 0; i < maxLength; i++) {
      const record1 = sample1[i];
      const record2 = sample2[i];

      if (!record1) {
        differences.push({ type: 'added', index: i, record: record2 });
      } else if (!record2) {
        differences.push({ type: 'removed', index: i, record: record1 });
      } else if (JSON.stringify(record1) !== JSON.stringify(record2)) {
        differences.push({
          type: 'modified',
          index: i,
          before: record1,
          after: record2
        });
      }
    }

    return differences;
  }

  cleanup(): void {
    this.validationRules.clear();
    this.validationEngines.clear();
    this.validationHistory.splice(0);
    this.dataSnapshots.clear();
    this.removeAllListeners();
  }
}