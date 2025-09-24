/**
 * DataValidator - Extracted from ContextValidator
 * Handles data integrity and consistency validation
 * Part of god object decomposition (Day 4)
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export interface DataIntegrityCheck {
  type: 'checksum' | 'hash' | 'signature' | 'timestamp' | 'sequence';
  expected?: string;
  actual?: string;
  valid: boolean;
  details: string;
}

export interface DataConsistencyCheck {
  type: 'referential' | 'uniqueness' | 'completeness' | 'format';
  field: string;
  valid: boolean;
  violations: string[];
}

export interface DataValidationRule {
  id: string;
  name: string;
  type: 'integrity' | 'consistency' | 'business' | 'format';
  condition: (data: any) => boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
}

export interface DataValidationContext {
  data: any;
  metadata: Record<string, any>;
  previousVersion?: any;
  timestamp: Date;
  source: string;
}

export interface DataValidationReport {
  context: DataValidationContext;
  integrityChecks: DataIntegrityCheck[];
  consistencyChecks: DataConsistencyCheck[];
  ruleViolations: RuleViolation[];
  valid: boolean;
  score: number;
  timestamp: Date;
}

export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  field?: string;
  value?: any;
}

export class DataValidator extends EventEmitter {
  /**
   * Handles data integrity and consistency validation.
   *
   * Extracted from ContextValidator (978 LOC -> ~200 LOC component).
   * Handles:
   * - Data integrity verification
   * - Consistency checking
   * - Duplicate detection
   * - Cross-field validation
   * - Data quality scoring
   */

  private validationRules: Map<string, DataValidationRule>;
  private integrityAlgorithms: Map<string, (data: any) => string>;
  private consistencyRules: Map<string, (data: any) => DataConsistencyCheck>;
  private validationHistory: DataValidationReport[];

  constructor() {
    super();

    this.validationRules = new Map();
    this.integrityAlgorithms = new Map();
    this.consistencyRules = new Map();
    this.validationHistory = [];

    this.registerDefaultAlgorithms();
    this.registerDefaultRules();
  }

  private registerDefaultAlgorithms(): void {
    // Checksum algorithms
    this.integrityAlgorithms.set('md5', (data) => {
      return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    });

    this.integrityAlgorithms.set('sha256', (data) => {
      return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    });

    this.integrityAlgorithms.set('crc32', (data) => {
      // Simplified CRC32
      const str = JSON.stringify(data);
      let crc = 0 ^ (-1);
      for (let i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ str.charCodeAt(i);
      }
      return (crc ^ (-1)) >>> 0;
    }.toString());
  }

  private registerDefaultRules(): void {
    // Common validation rules
    this.addValidationRule({
      id: 'required-fields',
      name: 'Required Fields Check',
      type: 'completeness',
      condition: (data) => {
        const required = ['id', 'name', 'type'];
        return required.every(field => field in data && data[field] !== null);
      },
      message: 'Missing required fields',
      severity: 'error',
      enabled: true
    });

    this.addValidationRule({
      id: 'no-empty-strings',
      name: 'No Empty Strings',
      type: 'format',
      condition: (data) => {
        const checkEmpty = (obj: any): boolean => {
          for (const value of Object.values(obj)) {
            if (typeof value === 'string' && value.trim() === '') return false;
            if (typeof value === 'object' && value !== null) {
              if (!checkEmpty(value)) return false;
            }
          }
          return true;
        };
        return checkEmpty(data);
      },
      message: 'Empty string values detected',
      severity: 'warning',
      enabled: true
    });
  }

  addValidationRule(rule: DataValidationRule): void {
    this.validationRules.set(rule.id, rule);
    this.emit('ruleAdded', rule);
  }

  removeValidationRule(ruleId: string): void {
    this.validationRules.delete(ruleId);
    this.emit('ruleRemoved', ruleId);
  }

  validateData(context: DataValidationContext): DataValidationReport {
    const startTime = Date.now();

    const integrityChecks = this.performIntegrityChecks(context.data, context.metadata);
    const consistencyChecks = this.performConsistencyChecks(context.data);
    const ruleViolations = this.checkValidationRules(context.data);

    // Calculate validation score
    const score = this.calculateValidationScore(
      integrityChecks,
      consistencyChecks,
      ruleViolations
    );

    const report: DataValidationReport = {
      context,
      integrityChecks,
      consistencyChecks,
      ruleViolations,
      valid: score >= 0.8 && ruleViolations.filter(v => v.severity === 'error').length === 0,
      score,
      timestamp: new Date()
    };

    this.validationHistory.push(report);
    this.emit('validationCompleted', report);

    return report;
  }

  private performIntegrityChecks(data: any, metadata: Record<string, any>): DataIntegrityCheck[] {
    const checks: DataIntegrityCheck[] = [];

    // Hash check
    if (metadata.expectedHash) {
      const actualHash = this.integrityAlgorithms.get('sha256')!(data);
      checks.push({
        type: 'hash',
        expected: metadata.expectedHash,
        actual: actualHash,
        valid: actualHash === metadata.expectedHash,
        details: actualHash === metadata.expectedHash ? 'Hash matches' : 'Hash mismatch detected'
      });
    }

    // Checksum verification
    const checksum = this.integrityAlgorithms.get('md5')!(data);
    checks.push({
      type: 'checksum',
      actual: checksum,
      valid: true,
      details: `Checksum calculated: ${checksum}`
    });

    // Timestamp validation
    if (metadata.timestamp) {
      const timeDiff = Date.now() - new Date(metadata.timestamp).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      checks.push({
        type: 'timestamp',
        valid: timeDiff < maxAge,
        details: timeDiff < maxAge ? 'Timestamp within acceptable range' : 'Data is stale'
      });
    }

    return checks;
  }

  private performConsistencyChecks(data: any): DataConsistencyCheck[] {
    const checks: DataConsistencyCheck[] = [];

    // Referential integrity
    if (data.references) {
      const refCheck: DataConsistencyCheck = {
        type: 'referential',
        field: 'references',
        valid: true,
        violations: []
      };

      for (const ref of data.references) {
        if (!ref.id || !ref.type) {
          refCheck.violations.push(`Invalid reference: ${JSON.stringify(ref)}`);
          refCheck.valid = false;
        }
      }

      checks.push(refCheck);
    }

    // Uniqueness checks
    if (Array.isArray(data)) {
      const uniqueCheck = this.checkUniqueness(data, 'id');
      checks.push(uniqueCheck);
    }

    // Completeness check
    const completenessCheck = this.checkCompleteness(data);
    checks.push(completenessCheck);

    // Format consistency
    const formatCheck = this.checkFormatConsistency(data);
    checks.push(formatCheck);

    return checks;
  }

  private checkUniqueness(data: any[], field: string): DataConsistencyCheck {
    const seen = new Set();
    const duplicates: string[] = [];

    for (const item of data) {
      const value = item[field];
      if (seen.has(value)) {
        duplicates.push(`Duplicate ${field}: ${value}`);
      }
      seen.add(value);
    }

    return {
      type: 'uniqueness',
      field,
      valid: duplicates.length === 0,
      violations: duplicates
    };
  }

  private checkCompleteness(data: any): DataConsistencyCheck {
    const violations: string[] = [];
    let incomplete = 0;
    let total = 0;

    const checkObject = (obj: any, path: string = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        total++;
        const currentPath = path ? `${path}.${key}` : key;

        if (value === null || value === undefined) {
          violations.push(`Missing value at ${currentPath}`);
          incomplete++;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          checkObject(value, currentPath);
        }
      }
    };

    checkObject(data);

    return {
      type: 'completeness',
      field: 'all',
      valid: incomplete === 0,
      violations
    };
  }

  private checkFormatConsistency(data: any): DataConsistencyCheck {
    const violations: string[] = [];

    // Check date formats
    const checkDates = (obj: any, path: string = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === 'string' && key.toLowerCase().includes('date')) {
          if (!this.isValidDateFormat(value)) {
            violations.push(`Invalid date format at ${currentPath}: ${value}`);
          }
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          checkDates(value, currentPath);
        }
      }
    };

    checkDates(data);

    return {
      type: 'format',
      field: 'dates',
      valid: violations.length === 0,
      violations
    };
  }

  private isValidDateFormat(dateStr: string): boolean {
    const iso8601 = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    return iso8601.test(dateStr);
  }

  private checkValidationRules(data: any): RuleViolation[] {
    const violations: RuleViolation[] = [];

    for (const rule of this.validationRules.values()) {
      if (!rule.enabled) continue;

      try {
        if (!rule.condition(data)) {
          violations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            message: rule.message,
            severity: rule.severity
          });
        }
      } catch (error) {
        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          message: `Rule evaluation failed: ${error.message}`,
          severity: 'error'
        });
      }
    }

    return violations;
  }

  private calculateValidationScore(
    integrityChecks: DataIntegrityCheck[],
    consistencyChecks: DataConsistencyCheck[],
    ruleViolations: RuleViolation[]
  ): number {
    let score = 1.0;

    // Deduct for integrity failures
    const failedIntegrity = integrityChecks.filter(c => !c.valid).length;
    score -= failedIntegrity * 0.2;

    // Deduct for consistency failures
    const failedConsistency = consistencyChecks.filter(c => !c.valid).length;
    score -= failedConsistency * 0.15;

    // Deduct for rule violations
    const errorViolations = ruleViolations.filter(v => v.severity === 'error').length;
    const warningViolations = ruleViolations.filter(v => v.severity === 'warning').length;
    score -= errorViolations * 0.25;
    score -= warningViolations * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  detectDuplicates(dataset: any[], keyFields: string[]): Map<string, any[]> {
    const duplicates = new Map<string, any[]>();

    const keyMap = new Map<string, any[]>();

    for (const item of dataset) {
      const key = keyFields.map(field => item[field]).join(':');

      if (!keyMap.has(key)) {
        keyMap.set(key, []);
      }
      keyMap.get(key)!.push(item);
    }

    // Find duplicates
    for (const [key, items] of keyMap) {
      if (items.length > 1) {
        duplicates.set(key, items);
      }
    }

    return duplicates;
  }

  getValidationHistory(limit?: number): DataValidationReport[] {
    if (limit) {
      return this.validationHistory.slice(-limit);
    }
    return [...this.validationHistory];
  }

  clearHistory(): void {
    this.validationHistory = [];
  }
}