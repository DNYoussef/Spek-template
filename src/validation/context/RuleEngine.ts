/**
 * RuleEngine - Extracted from ContextValidator
 * Handles business rule evaluation and enforcement
 * Part of god object decomposition (Day 4)
 */

import { EventEmitter } from 'events';

export interface Rule {
  id: string;
  name: string;
  category: string;
  priority: number;
  condition: string | ((context: any) => boolean);
  actions: RuleAction[];
  enabled: boolean;
  metadata: Record<string, any>;
}

export interface RuleAction {
  type: 'validate' | 'transform' | 'reject' | 'warn' | 'log';
  target?: string;
  value?: any;
  message?: string;
}

export interface RuleSet {
  id: string;
  name: string;
  version: string;
  rules: Rule[];
  priority: number;
  enabled: boolean;
}

export interface RuleEvaluation {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  actions: RuleAction[];
  executionTime: number;
  error?: string;
}

export interface RuleExecutionContext {
  data: any;
  metadata: Record<string, any>;
  variables: Map<string, any>;
  functions: Map<string, Function>;
}

export interface RuleExecutionResult {
  context: RuleExecutionContext;
  evaluations: RuleEvaluation[];
  transformations: any;
  violations: string[];
  warnings: string[];
  passed: boolean;
  executionTime: number;
}

export class RuleEngine extends EventEmitter {
  /**
   * Handles business rule evaluation and enforcement.
   *
   * Extracted from ContextValidator (978 LOC -> ~200 LOC component).
   * Handles:
   * - Business rule definition
   * - Rule evaluation
   * - Conditional logic
   * - Action execution
   * - Rule prioritization
   */

  private rules: Map<string, Rule>;
  private ruleSets: Map<string, RuleSet>;
  private customFunctions: Map<string, Function>;
  private evaluationCache: Map<string, RuleEvaluation>;
  private executionHistory: RuleExecutionResult[];

  constructor() {
    super();

    this.rules = new Map();
    this.ruleSets = new Map();
    this.customFunctions = new Map();
    this.evaluationCache = new Map();
    this.executionHistory = [];

    this.registerDefaultFunctions();
  }

  private registerDefaultFunctions(): void {
    // Register common utility functions
    this.customFunctions.set('exists', (value: any) => value !== undefined && value !== null);
    this.customFunctions.set('isEmpty', (value: any) => {
      if (value === null || value === undefined) return true;
      if (typeof value === 'string') return value.trim() === '';
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === 'object') return Object.keys(value).length === 0;
      return false;
    });
    this.customFunctions.set('isEmail', (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
    this.customFunctions.set('isUrl', (value: string) => /^https?:\/\/.+/.test(value));
    this.customFunctions.set('inRange', (value: number, min: number, max: number) => value >= min && value <= max);
    this.customFunctions.set('matches', (value: string, pattern: string) => new RegExp(pattern).test(value));
  }

  registerRule(rule: Rule): void {
    this.rules.set(rule.id, rule);
    this.emit('ruleRegistered', rule);
    this.clearCache();
  }

  registerRuleSet(ruleSet: RuleSet): void {
    this.ruleSets.set(ruleSet.id, ruleSet);

    // Register individual rules from set
    for (const rule of ruleSet.rules) {
      this.rules.set(rule.id, rule);
    }

    this.emit('ruleSetRegistered', ruleSet);
    this.clearCache();
  }

  registerFunction(name: string, func: Function): void {
    this.customFunctions.set(name, func);
  }

  executeRules(context: RuleExecutionContext, ruleSetId?: string): RuleExecutionResult {
    const startTime = Date.now();

    // Get rules to execute
    const rulesToExecute = this.getRulesToExecute(ruleSetId);

    // Sort by priority
    rulesToExecute.sort((a, b) => b.priority - a.priority);

    // Execute rules
    const evaluations: RuleEvaluation[] = [];
    const violations: string[] = [];
    const warnings: string[] = [];
    let transformedData = { ...context.data };

    for (const rule of rulesToExecute) {
      if (!rule.enabled) continue;

      const evaluation = this.evaluateRule(rule, {
        ...context,
        data: transformedData
      });

      evaluations.push(evaluation);

      if (evaluation.matched) {
        // Execute actions
        for (const action of evaluation.actions) {
          const actionResult = this.executeAction(action, transformedData, context);

          switch (action.type) {
            case 'transform':
              transformedData = actionResult;
              break;
            case 'reject':
              violations.push(action.message || `Rule ${rule.name} violated`);
              break;
            case 'warn':
              warnings.push(action.message || `Warning from rule ${rule.name}`);
              break;
            case 'log':
              this.emit('ruleLog', { rule, message: action.message });
              break;
          }
        }
      }
    }

    const result: RuleExecutionResult = {
      context,
      evaluations,
      transformations: transformedData,
      violations,
      warnings,
      passed: violations.length === 0,
      executionTime: Date.now() - startTime
    };

    this.executionHistory.push(result);
    this.emit('rulesExecuted', result);

    return result;
  }

  private getRulesToExecute(ruleSetId?: string): Rule[] {
    if (ruleSetId) {
      const ruleSet = this.ruleSets.get(ruleSetId);
      return ruleSet ? ruleSet.rules.filter(r => r.enabled) : [];
    }

    return Array.from(this.rules.values()).filter(r => r.enabled);
  }

  private evaluateRule(rule: Rule, context: RuleExecutionContext): RuleEvaluation {
    const startTime = Date.now();

    // Check cache
    const cacheKey = this.getCacheKey(rule.id, context.data);
    if (this.evaluationCache.has(cacheKey)) {
      return this.evaluationCache.get(cacheKey)!;
    }

    let matched = false;
    let error: string | undefined;

    try {
      if (typeof rule.condition === 'function') {
        // Function condition
        matched = rule.condition(context);
      } else {
        // String expression condition
        matched = this.evaluateExpression(rule.condition, context);
      }
    } catch (e) {
      error = e.message;
      matched = false;
    }

    const evaluation: RuleEvaluation = {
      ruleId: rule.id,
      ruleName: rule.name,
      matched,
      actions: matched ? rule.actions : [],
      executionTime: Date.now() - startTime,
      error
    };

    // Cache result
    this.evaluationCache.set(cacheKey, evaluation);

    return evaluation;
  }

  private evaluateExpression(expression: string, context: RuleExecutionContext): boolean {
    // Simple expression evaluator
    // In production, would use a proper expression parser

    // Replace variables
    let expr = expression;
    for (const [key, value] of context.variables) {
      expr = expr.replace(new RegExp(`\\$${key}`, 'g'), JSON.stringify(value));
    }

    // Replace data references
    expr = expr.replace(/data\.(\w+)/g, (match, prop) => {
      return JSON.stringify(context.data[prop]);
    });

    // Replace function calls
    for (const [name, func] of this.customFunctions) {
      if (expr.includes(name)) {
        // This is simplified - would need proper parsing
        const funcRegex = new RegExp(`${name}\\(([^)]+)\\)`, 'g');
        expr = expr.replace(funcRegex, (match, args) => {
          try {
            const argValues = args.split(',').map((arg: string) => {
              arg = arg.trim();
              if (arg.startsWith('"') || arg.startsWith("'")) {
                return arg.slice(1, -1);
              }
              return JSON.parse(arg);
            });
            return String(func(...argValues));
          } catch {
            return 'false';
          }
        });
      }
    }

    // Evaluate final expression
    try {
      // WARNING: eval is dangerous - in production use a safe expression evaluator
      return new Function('return ' + expr)();
    } catch {
      return false;
    }
  }

  private executeAction(action: RuleAction, data: any, context: RuleExecutionContext): any {
    switch (action.type) {
      case 'transform':
        if (action.target && action.value !== undefined) {
          // Set nested property
          const parts = action.target.split('.');
          let current = data;

          for (let i = 0; i < parts.length - 1; i++) {
            if (!(parts[i] in current)) {
              current[parts[i]] = {};
            }
            current = current[parts[i]];
          }

          current[parts[parts.length - 1]] = action.value;
        }
        return data;

      case 'validate':
        // Validation action (handled externally)
        return data;

      default:
        return data;
    }
  }

  validateRuleSet(ruleSetId: string, data: any): {
    valid: boolean;
    violations: string[];
    warnings: string[];
  } {
    const context: RuleExecutionContext = {
      data,
      metadata: {},
      variables: new Map(),
      functions: this.customFunctions
    };

    const result = this.executeRules(context, ruleSetId);

    return {
      valid: result.passed,
      violations: result.violations,
      warnings: result.warnings
    };
  }

  getRuleMetrics(): any {
    const totalRules = this.rules.size;
    const enabledRules = Array.from(this.rules.values()).filter(r => r.enabled).length;

    const categoryCount = new Map<string, number>();
    for (const rule of this.rules.values()) {
      categoryCount.set(rule.category, (categoryCount.get(rule.category) || 0) + 1);
    }

    return {
      totalRules,
      enabledRules,
      disabledRules: totalRules - enabledRules,
      ruleSets: this.ruleSets.size,
      categories: Object.fromEntries(categoryCount),
      executionHistory: this.executionHistory.length,
      averageExecutionTime: this.calculateAverageExecutionTime()
    };
  }

  private calculateAverageExecutionTime(): number {
    if (this.executionHistory.length === 0) return 0;

    const total = this.executionHistory.reduce((sum, result) => sum + result.executionTime, 0);
    return total / this.executionHistory.length;
  }

  private getCacheKey(ruleId: string, data: any): string {
    const dataStr = JSON.stringify(data);
    return `${ruleId}:${dataStr.length}:${dataStr.slice(0, 50)}`;
  }

  clearCache(): void {
    this.evaluationCache.clear();
  }

  getExecutionHistory(limit?: number): RuleExecutionResult[] {
    if (limit) {
      return this.executionHistory.slice(-limit);
    }
    return [...this.executionHistory];
  }
}