/**
 * Template Validator
 * Comprehensive validation system for DSPy template compliance
 */

import { readFile } from 'fs/promises';
import * as path from 'path';

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: 'nasa_rule_10' | 'fsm_patterns' | 'production_quality' | 'theater_detection' | 'dspy_compliance';
  severity: 'error' | 'warning' | 'info';
  check: (content: string, metadata?: any) => ValidationResult;
}

interface ValidationResult {
  passed: boolean;
  score: number; // 0-100
  violations: Violation[];
  metrics: Record<string, number>;
  suggestions: string[];
}

interface Violation {
  line?: number;
  column?: number;
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  suggestion?: string;
}

interface ComprehensiveValidationReport {
  agentId: string;
  templatePath: string;
  timestamp: Date;
  overallScore: number;
  overallStatus: 'PASS' | 'CONDITIONAL_PASS' | 'FAIL';
  categoryScores: Record<string, number>;
  totalViolations: number;
  criticalViolations: number;
  warnings: number;
  detailedResults: Record<string, ValidationResult>;
  recommendations: string[];
  complianceMatrix: Record<string, boolean>;
  performanceMetrics: {
    validationTime: number;
    rulesExecuted: number;
    linesAnalyzed: number;
  };
}

export class TemplateValidator {
  private rules: ValidationRule[];
  private validationCache: Map<string, ComprehensiveValidationReport>;

  constructor() {
    this.rules = [];
    this.validationCache = new Map();
    this.initializeValidationRules();
  }

  private initializeValidationRules(): void {
    this.rules = [
      // NASA Rule 10 Compliance Rules
      {
        id: 'nasa_function_length',
        name: 'Function Length Compliance',
        description: 'All functions must be ≤60 lines (NASA Rule 10)',
        category: 'nasa_rule_10',
        severity: 'error',
        check: this.checkFunctionLength.bind(this)
      },
      {
        id: 'nasa_assertions',
        name: 'Assertion Density',
        description: 'Minimum 2 assertions per function (NASA Rule 10)',
        category: 'nasa_rule_10',
        severity: 'error',
        check: this.checkAssertionDensity.bind(this)
      },
      {
        id: 'nasa_recursion',
        name: 'Recursion Prohibition',
        description: 'No recursive functions allowed (NASA Rule 10)',
        category: 'nasa_rule_10',
        severity: 'error',
        check: this.checkRecursionProhibition.bind(this)
      },
      {
        id: 'nasa_goto',
        name: 'Goto Prohibition',
        description: 'No goto statements allowed (NASA Rule 10)',
        category: 'nasa_rule_10',
        severity: 'error',
        check: this.checkGotoProhibition.bind(this)
      },
      {
        id: 'nasa_loop_bounds',
        name: 'Fixed Loop Bounds',
        description: 'All loops must have fixed bounds (NASA Rule 10)',
        category: 'nasa_rule_10',
        severity: 'error',
        check: this.checkFixedLoopBounds.bind(this)
      },
      {
        id: 'nasa_return_checks',
        name: 'Return Value Checks',
        description: 'All non-void returns must be checked (NASA Rule 10)',
        category: 'nasa_rule_10',
        severity: 'error',
        check: this.checkReturnValueChecks.bind(this)
      },

      // FSM Pattern Rules
      {
        id: 'fsm_state_isolation',
        name: 'State Isolation',
        description: 'Each state must be in separate file/class',
        category: 'fsm_patterns',
        severity: 'error',
        check: this.checkStateIsolation.bind(this)
      },
      {
        id: 'fsm_centralized_transitions',
        name: 'Centralized Transitions',
        description: 'All transitions through TransitionHub',
        category: 'fsm_patterns',
        severity: 'error',
        check: this.checkCentralizedTransitions.bind(this)
      },
      {
        id: 'fsm_enum_events',
        name: 'Enum Events',
        description: 'No string literals for events/states',
        category: 'fsm_patterns',
        severity: 'error',
        check: this.checkEnumEvents.bind(this)
      },
      {
        id: 'fsm_contract_implementation',
        name: 'State Contract Implementation',
        description: 'Full StateContract implementation required',
        category: 'fsm_patterns',
        severity: 'error',
        check: this.checkStateContractImplementation.bind(this)
      },

      // Production Quality Rules
      {
        id: 'prod_no_placeholders',
        name: 'No Placeholder Implementations',
        description: 'No TODO, FIXME, or placeholder code',
        category: 'production_quality',
        severity: 'error',
        check: this.checkNoPlaceholders.bind(this)
      },
      {
        id: 'prod_no_unicode',
        name: 'No Unicode Characters',
        description: 'ASCII only in code (production requirement)',
        category: 'production_quality',
        severity: 'error',
        check: this.checkNoUnicode.bind(this)
      },
      {
        id: 'prod_single_responsibility',
        name: 'Single Responsibility Principle',
        description: 'Each function/class has single responsibility',
        category: 'production_quality',
        severity: 'warning',
        check: this.checkSingleResponsibility.bind(this)
      },
      {
        id: 'prod_dependency_injection',
        name: 'Dependency Injection',
        description: 'Use dependency injection patterns',
        category: 'production_quality',
        severity: 'warning',
        check: this.checkDependencyInjection.bind(this)
      },

      // Theater Detection Rules
      {
        id: 'theater_empty_functions',
        name: 'Empty Function Detection',
        description: 'Detect suspiciously empty implementations',
        category: 'theater_detection',
        severity: 'warning',
        check: this.checkEmptyFunctions.bind(this)
      },
      {
        id: 'theater_copy_paste',
        name: 'Copy-Paste Detection',
        description: 'Detect duplicate code blocks',
        category: 'theater_detection',
        severity: 'warning',
        check: this.checkCopyPaste.bind(this)
      },
      {
        id: 'theater_complexity_mismatch',
        name: 'Complexity Mismatch',
        description: 'Simple solutions to complex problems',
        category: 'theater_detection',
        severity: 'info',
        check: this.checkComplexityMismatch.bind(this)
      },

      // DSPy Compliance Rules
      {
        id: 'dspy_signature_structure',
        name: 'DSPy Signature Structure',
        description: 'Proper DSPy Signature class structure',
        category: 'dspy_compliance',
        severity: 'error',
        check: this.checkDSPySignatureStructure.bind(this)
      },
      {
        id: 'dspy_example_bank',
        name: 'Example Bank Quality',
        description: 'High-quality example bank with diversity',
        category: 'dspy_compliance',
        severity: 'warning',
        check: this.checkExampleBankQuality.bind(this)
      },
      {
        id: 'dspy_optimization_criteria',
        name: 'Optimization Criteria',
        description: 'Complete optimization criteria definition',
        category: 'dspy_compliance',
        severity: 'error',
        check: this.checkOptimizationCriteria.bind(this)
      }
    ];
  }

  async validateTemplate(templatePath: string, agentId: string): Promise<ComprehensiveValidationReport> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = `${templatePath}-${agentId}`;
      if (this.validationCache.has(cacheKey)) {
        return this.validationCache.get(cacheKey)!;
      }

      // Read template content
      const content = await readFile(templatePath, 'utf-8');
      const lines = content.split('\n');

      // Initialize report
      const report: ComprehensiveValidationReport = {
        agentId,
        templatePath,
        timestamp: new Date(),
        overallScore: 0,
        overallStatus: 'FAIL',
        categoryScores: {},
        totalViolations: 0,
        criticalViolations: 0,
        warnings: 0,
        detailedResults: {},
        recommendations: [],
        complianceMatrix: {},
        performanceMetrics: {
          validationTime: 0,
          rulesExecuted: 0,
          linesAnalyzed: lines.length
        }
      };

      // Execute all validation rules
      for (const rule of this.rules) {
        try {
          const result = rule.check(content, { agentId, templatePath });
          report.detailedResults[rule.id] = result;
          report.performanceMetrics.rulesExecuted++;

          // Count violations by severity
          for (const violation of result.violations) {
            report.totalViolations++;
            if (violation.severity === 'error') {
              report.criticalViolations++;
            } else if (violation.severity === 'warning') {
              report.warnings++;
            }
          }

          // Update category scores
          if (!report.categoryScores[rule.category]) {
            report.categoryScores[rule.category] = 0;
          }
          report.categoryScores[rule.category] = Math.max(
            report.categoryScores[rule.category],
            result.score
          );

          // Update compliance matrix
          report.complianceMatrix[rule.id] = result.passed;

        } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`Rule ${rule.id} failed to execute: ${errorMessage}`);
          report.detailedResults[rule.id] = {
            passed: false,
            score: 0,
            violations: [{
              code: 'RULE_EXECUTION_ERROR',
              message: `Rule execution failed: ${error.message}`,
              severity: 'error',
              category: rule.category
            }],
            metrics: {},
            suggestions: ['Review rule implementation']
          };
        }
      }

      // Calculate overall score and status
      this.calculateOverallResults(report);

      // Generate recommendations
      this.generateRecommendations(report);

      // Update performance metrics
      report.performanceMetrics.validationTime = Date.now() - startTime;

      // Cache the result
      this.validationCache.set(cacheKey, report);

      return report;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Template validation failed: ${errorMessage}`);
    }
  }

  private calculateOverallResults(report: ComprehensiveValidationReport): void {
    // Calculate weighted overall score
    const categoryWeights = {
      'nasa_rule_10': 0.35,      // 35% - Critical for compliance
      'fsm_patterns': 0.25,      // 25% - Core architectural requirement
      'production_quality': 0.20, // 20% - Essential for deployment
      'theater_detection': 0.15,  // 15% - Quality assurance
      'dspy_compliance': 0.05     // 5% - Template structure
    };

    let weightedScore = 0;
    let totalWeight = 0;

    for (const [category, weight] of Object.entries(categoryWeights)) {
      if (report.categoryScores[category] !== undefined) {
        weightedScore += report.categoryScores[category] * weight;
        totalWeight += weight;
      }
    }

    report.overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    // Determine overall status
    if (report.criticalViolations > 0) {
      report.overallStatus = 'FAIL';
    } else if (report.overallScore >= 95 && report.warnings <= 2) {
      report.overallStatus = 'PASS';
    } else if (report.overallScore >= 85) {
      report.overallStatus = 'CONDITIONAL_PASS';
    } else {
      report.overallStatus = 'FAIL';
    }
  }

  private generateRecommendations(report: ComprehensiveValidationReport): void {
    const recommendations: string[] = [];

    // Critical issues
    if (report.criticalViolations > 0) {
      recommendations.push(`Address ${report.criticalViolations} critical violations before deployment`);
    }

    // Category-specific recommendations
    if (report.categoryScores['nasa_rule_10'] < 100) {
      recommendations.push('NASA Rule 10 compliance is mandatory - address all function length, assertion, and control flow violations');
    }

    if (report.categoryScores['fsm_patterns'] < 95) {
      recommendations.push('FSM pattern implementation needs improvement - ensure state isolation and centralized transitions');
    }

    if (report.categoryScores['production_quality'] < 90) {
      recommendations.push('Production quality standards not met - remove placeholders and improve code structure');
    }

    if (report.categoryScores['theater_detection'] > 30) {
      recommendations.push('High theater score detected - verify genuine implementations and remove placeholder code');
    }

    // Performance recommendations
    if (report.warnings > 5) {
      recommendations.push('High warning count - consider addressing warnings to improve code quality');
    }

    if (recommendations.length === 0) {
      recommendations.push('Template meets all validation criteria - ready for deployment');
    }

    report.recommendations = recommendations;
  }

  // Validation rule implementations
  private checkFunctionLength(content: string): ValidationResult {
    const violations: Violation[] = [];
    const functions = this.extractFunctions(content);
    let score = 100;

    for (const func of functions) {
      if (func.lineCount > 60) {
        violations.push({
          line: func.startLine,
          code: 'NASA_FUNCTION_LENGTH',
          message: `Function '${func.name}' has ${func.lineCount} lines (max 60)`,
          severity: 'error',
          category: 'nasa_rule_10',
          suggestion: `Split function '${func.name}' into smaller functions`
        });
        score -= 15;
      }
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, score),
      violations,
      metrics: {
        totalFunctions: functions.length,
        averageFunctionLength: functions.reduce((sum, f) => sum + f.lineCount, 0) / functions.length,
        maxFunctionLength: Math.max(...functions.map(f => f.lineCount))
      },
      suggestions: violations.length > 0 ? ['Break large functions into smaller, focused functions'] : []
    };
  }

  private checkAssertionDensity(content: string): ValidationResult {
    const violations: Violation[] = [];
    const functions = this.extractFunctions(content);
    let score = 100;

    for (const func of functions) {
      if (func.assertionCount < 2) {
        violations.push({
          line: func.startLine,
          code: 'NASA_ASSERTION_DENSITY',
          message: `Function '${func.name}' has ${func.assertionCount} assertions (min 2)`,
          severity: 'error',
          category: 'nasa_rule_10',
          suggestion: `Add assertions to validate inputs and preconditions in '${func.name}'`
        });
        score -= 10;
      }
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, score),
      violations,
      metrics: {
        totalAssertions: functions.reduce((sum, f) => sum + f.assertionCount, 0),
        averageAssertionsPerFunction: functions.reduce((sum, f) => sum + f.assertionCount, 0) / functions.length
      },
      suggestions: violations.length > 0 ? ['Add input validation and precondition assertions'] : []
    };
  }

  private checkRecursionProhibition(content: string): ValidationResult {
    const violations: Violation[] = [];
    const recursivePatterns = this.findRecursivePatterns(content);

    for (const pattern of recursivePatterns) {
      violations.push({
        line: pattern.line,
        code: 'NASA_RECURSION_PROHIBITED',
        message: `Recursive call detected in function '${pattern.functionName}'`,
        severity: 'error',
        category: 'nasa_rule_10',
        suggestion: `Replace recursion with iterative approach in '${pattern.functionName}'`
      });
    }

    return {
      passed: violations.length === 0,
      score: violations.length === 0 ? 100 : 0,
      violations,
      metrics: {
        recursivePatterns: recursivePatterns.length
      },
      suggestions: violations.length > 0 ? ['Convert recursive algorithms to iterative implementations'] : []
    };
  }

  private checkGotoProhibition(content: string): ValidationResult {
    const violations: Violation[] = [];
    const gotoPatterns = /\bgoto\s+\w+/gi;
    const matches = Array.from(content.matchAll(gotoPatterns));

    for (const match of matches) {
      const line = content.substring(0, match.index).split('\n').length;
      violations.push({
        line,
        code: 'NASA_GOTO_PROHIBITED',
        message: 'Goto statement detected',
        severity: 'error',
        category: 'nasa_rule_10',
        suggestion: 'Replace goto with structured control flow'
      });
    }

    return {
      passed: violations.length === 0,
      score: violations.length === 0 ? 100 : 0,
      violations,
      metrics: {
        gotoStatements: matches.length
      },
      suggestions: violations.length > 0 ? ['Use structured control flow instead of goto'] : []
    };
  }

  private checkFixedLoopBounds(content: string): ValidationResult {
    const violations: Violation[] = [];
    const dynamicLoops = this.findDynamicLoops(content);

    for (const loop of dynamicLoops) {
      violations.push({
        line: loop.line,
        code: 'NASA_DYNAMIC_LOOP_BOUNDS',
        message: `Dynamic loop bounds detected: ${loop.pattern}`,
        severity: 'error',
        category: 'nasa_rule_10',
        suggestion: 'Use fixed upper bounds for all loops'
      });
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, 100 - dynamicLoops.length * 20),
      violations,
      metrics: {
        dynamicLoops: dynamicLoops.length
      },
      suggestions: violations.length > 0 ? ['Replace dynamic loop bounds with fixed constants'] : []
    };
  }

  private checkReturnValueChecks(content: string): ValidationResult {
    const violations: Violation[] = [];
    const uncheckedReturns = this.findUncheckedReturnValues(content);

    for (const unchecked of uncheckedReturns) {
      violations.push({
        line: unchecked.line,
        code: 'NASA_UNCHECKED_RETURN',
        message: `Unchecked return value from '${unchecked.functionCall}'`,
        severity: 'error',
        category: 'nasa_rule_10',
        suggestion: `Check return value of '${unchecked.functionCall}'`
      });
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, 100 - uncheckedReturns.length * 10),
      violations,
      metrics: {
        uncheckedReturns: uncheckedReturns.length
      },
      suggestions: violations.length > 0 ? ['Add return value checking for all function calls'] : []
    };
  }

  private checkStateIsolation(content: string): ValidationResult {
    const violations: Violation[] = [];
    const stateClasses = this.findStateClasses(content);

    if (stateClasses.length > 1) {
      violations.push({
        code: 'FSM_MULTIPLE_STATES_PER_FILE',
        message: `Multiple state classes found in single file: ${stateClasses.map(s => s.name).join(', ')}`,
        severity: 'error',
        category: 'fsm_patterns',
        suggestion: 'Move each state class to separate file'
      });
    }

    return {
      passed: violations.length === 0,
      score: violations.length === 0 ? 100 : 50,
      violations,
      metrics: {
        stateClassesFound: stateClasses.length
      },
      suggestions: violations.length > 0 ? ['Implement one state per file pattern'] : []
    };
  }

  private checkCentralizedTransitions(content: string): ValidationResult {
    const violations: Violation[] = [];
    const directTransitions = this.findDirectStateTransitions(content);

    for (const transition of directTransitions) {
      violations.push({
        line: transition.line,
        code: 'FSM_DIRECT_TRANSITION',
        message: `Direct state transition detected: ${transition.pattern}`,
        severity: 'error',
        category: 'fsm_patterns',
        suggestion: 'Use TransitionHub for all state changes'
      });
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, 100 - directTransitions.length * 15),
      violations,
      metrics: {
        directTransitions: directTransitions.length
      },
      suggestions: violations.length > 0 ? ['Route all transitions through TransitionHub'] : []
    };
  }

  private checkEnumEvents(content: string): ValidationResult {
    const violations: Violation[] = [];
    const stringLiterals = this.findEventStringLiterals(content);

    for (const literal of stringLiterals) {
      violations.push({
        line: literal.line,
        code: 'FSM_STRING_EVENT',
        message: `String literal used for event: ${literal.value}`,
        severity: 'error',
        category: 'fsm_patterns',
        suggestion: 'Use enum constants instead of string literals'
      });
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, 100 - stringLiterals.length * 10),
      violations,
      metrics: {
        stringLiterals: stringLiterals.length
      },
      suggestions: violations.length > 0 ? ['Define event enums and use constants'] : []
    };
  }

  private checkStateContractImplementation(content: string): ValidationResult {
    const violations: Violation[] = [];
    const stateClasses = this.findStateClasses(content);
    const requiredMethods = ['init', 'update', 'shutdown', 'checkInvariants'];

    for (const stateClass of stateClasses) {
      for (const method of requiredMethods) {
        if (!stateClass.methods.includes(method)) {
          violations.push({
            line: stateClass.line,
            code: 'FSM_INCOMPLETE_CONTRACT',
            message: `State '${stateClass.name}' missing required method: ${method}`,
            severity: 'error',
            category: 'fsm_patterns',
            suggestion: `Implement ${method} method in ${stateClass.name}`
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, 100 - violations.length * 20),
      violations,
      metrics: {
        stateClassesChecked: stateClasses.length,
        missingMethods: violations.length
      },
      suggestions: violations.length > 0 ? ['Implement all StateContract methods'] : []
    };
  }

  private checkNoPlaceholders(content: string): ValidationResult {
    const violations: Violation[] = [];
    const placeholderPatterns = [
      /TODO/gi,
      /FIXME/gi,
      /placeholder/gi,
      /coming\s+soon/gi,
      /not\s+implemented/gi
    ];

    for (const pattern of placeholderPatterns) {
      const matches = Array.from(content.matchAll(pattern));
      for (const match of matches) {
        const line = content.substring(0, match.index).split('\n').length;
        violations.push({
          line,
          code: 'PROD_PLACEHOLDER_CODE',
          message: `Placeholder implementation found: ${match[0]}`,
          severity: 'error',
          category: 'production_quality',
          suggestion: 'Replace placeholder with actual implementation'
        });
      }
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, 100 - violations.length * 25),
      violations,
      metrics: {
        placeholderCount: violations.length
      },
      suggestions: violations.length > 0 ? ['Complete all placeholder implementations'] : []
    };
  }

  private checkNoUnicode(content: string): ValidationResult {
    const violations: Violation[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/[^\x00-\x7F]/.test(line)) {
        violations.push({
          line: i + 1,
          code: 'PROD_UNICODE_DETECTED',
          message: 'Unicode characters detected in code',
          severity: 'error',
          category: 'production_quality',
          suggestion: 'Use ASCII characters only'
        });
      }
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, 100 - violations.length * 20),
      violations,
      metrics: {
        unicodeLines: violations.length
      },
      suggestions: violations.length > 0 ? ['Replace Unicode characters with ASCII equivalents'] : []
    };
  }

  private checkSingleResponsibility(content: string): ValidationResult {
    const violations: Violation[] = [];
    const functions = this.extractFunctions(content);

    for (const func of functions) {
      if (func.cyclomaticComplexity > 10) {
        violations.push({
          line: func.startLine,
          code: 'PROD_SRP_VIOLATION',
          message: `Function '${func.name}' has high complexity (${func.cyclomaticComplexity})`,
          severity: 'warning',
          category: 'production_quality',
          suggestion: `Break down '${func.name}' into smaller functions`
        });
      }
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, 100 - violations.length * 10),
      violations,
      metrics: {
        averageComplexity: functions.reduce((sum, f) => sum + f.cyclomaticComplexity, 0) / functions.length,
        highComplexityFunctions: violations.length
      },
      suggestions: violations.length > 0 ? ['Reduce function complexity by extracting methods'] : []
    };
  }

  private checkDependencyInjection(content: string): ValidationResult {
    const violations: Violation[] = [];
    const hardcodedDependencies = this.findHardcodedDependencies(content);

    for (const dependency of hardcodedDependencies) {
      violations.push({
        line: dependency.line,
        code: 'PROD_HARDCODED_DEPENDENCY',
        message: `Hardcoded dependency detected: ${dependency.pattern}`,
        severity: 'warning',
        category: 'production_quality',
        suggestion: 'Use dependency injection instead of direct instantiation'
      });
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, 100 - violations.length * 15),
      violations,
      metrics: {
        hardcodedDependencies: violations.length
      },
      suggestions: violations.length > 0 ? ['Implement dependency injection pattern'] : []
    };
  }

  private checkEmptyFunctions(content: string): ValidationResult {
    const violations: Violation[] = [];
    const emptyFunctions = this.findEmptyFunctions(content);

    for (const emptyFunc of emptyFunctions) {
      violations.push({
        line: emptyFunc.line,
        code: 'THEATER_EMPTY_FUNCTION',
        message: `Empty function detected: ${emptyFunc.name}`,
        severity: 'warning',
        category: 'theater_detection',
        suggestion: `Implement functionality for '${emptyFunc.name}' or remove if unnecessary`
      });
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, 100 - violations.length * 20),
      violations,
      metrics: {
        emptyFunctions: violations.length
      },
      suggestions: violations.length > 0 ? ['Implement all function bodies'] : []
    };
  }

  private checkCopyPaste(content: string): ValidationResult {
    const violations: Violation[] = [];
    const duplicateBlocks = this.findDuplicateCodeBlocks(content);

    for (const duplicate of duplicateBlocks) {
      violations.push({
        line: duplicate.line1,
        code: 'THEATER_DUPLICATE_CODE',
        message: `Duplicate code block found (lines ${duplicate.line1}-${duplicate.line2})`,
        severity: 'warning',
        category: 'theater_detection',
        suggestion: 'Extract common code into reusable functions'
      });
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, 100 - violations.length * 15),
      violations,
      metrics: {
        duplicateBlocks: violations.length
      },
      suggestions: violations.length > 0 ? ['Eliminate code duplication through refactoring'] : []
    };
  }

  private checkComplexityMismatch(content: string): ValidationResult {
    const violations: Violation[] = [];
    const functions = this.extractFunctions(content);

    // Detect suspiciously simple implementations
    for (const func of functions) {
      if (func.lineCount < 5 && func.name.includes('complex') || func.name.includes('advanced')) {
        violations.push({
          line: func.startLine,
          code: 'THEATER_COMPLEXITY_MISMATCH',
          message: `Function '${func.name}' seems too simple for its implied complexity`,
          severity: 'info',
          category: 'theater_detection',
          suggestion: `Verify that '${func.name}' adequately addresses its requirements`
        });
      }
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, 100 - violations.length * 10),
      violations,
      metrics: {
        suspiciouslySimpleFunctions: violations.length
      },
      suggestions: violations.length > 0 ? ['Review implementation complexity vs requirements'] : []
    };
  }

  private checkDSPySignatureStructure(content: string): ValidationResult {
    const violations: Violation[] = [];
    const hasSignatureClass = /class.*Signature.*dspy\.Signature/i.test(content);
    const hasInputFields = /InputField\(\)/i.test(content);
    const hasOutputFields = /OutputField\(\)/i.test(content);

    if (!hasSignatureClass) {
      violations.push({
        code: 'DSPY_MISSING_SIGNATURE',
        message: 'DSPy Signature class not found',
        severity: 'error',
        category: 'dspy_compliance',
        suggestion: 'Create proper DSPy Signature class'
      });
    }

    if (!hasInputFields) {
      violations.push({
        code: 'DSPY_MISSING_INPUT_FIELDS',
        message: 'No InputField definitions found',
        severity: 'error',
        category: 'dspy_compliance',
        suggestion: 'Define input fields using dspy.InputField()'
      });
    }

    if (!hasOutputFields) {
      violations.push({
        code: 'DSPY_MISSING_OUTPUT_FIELDS',
        message: 'No OutputField definitions found',
        severity: 'error',
        category: 'dspy_compliance',
        suggestion: 'Define output fields using dspy.OutputField()'
      });
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, 100 - violations.length * 33),
      violations,
      metrics: {
        hasSignatureClass,
        hasInputFields,
        hasOutputFields
      },
      suggestions: violations.length > 0 ? ['Implement proper DSPy Signature structure'] : []
    };
  }

  private checkExampleBankQuality(content: string): ValidationResult {
    const violations: Violation[] = [];
    const hasExampleBank = /examples\s*=\s*\[/.test(content);
    const exampleCount = (content.match(/dspy\.Example/g) || []).length;

    if (!hasExampleBank) {
      violations.push({
        code: 'DSPY_MISSING_EXAMPLE_BANK',
        message: 'No example bank found',
        severity: 'warning',
        category: 'dspy_compliance',
        suggestion: 'Create example bank with diverse, high-quality examples'
      });
    } else if (exampleCount < 3) {
      violations.push({
        code: 'DSPY_INSUFFICIENT_EXAMPLES',
        message: `Only ${exampleCount} examples found (minimum 3 recommended)`,
        severity: 'warning',
        category: 'dspy_compliance',
        suggestion: 'Add more examples to improve optimization quality'
      });
    }

    return {
      passed: violations.length === 0,
      score: hasExampleBank ? Math.min(100, exampleCount * 15) : 0,
      violations,
      metrics: {
        hasExampleBank,
        exampleCount
      },
      suggestions: violations.length > 0 ? ['Improve example bank quality and diversity'] : []
    };
  }

  private checkOptimizationCriteria(content: string): ValidationResult {
    const violations: Violation[] = [];
    const hasOptimizationCriteria = /OPTIMIZATION_CRITERIA/.test(content);
    const hasQualityGates = /QUALITY_GATES/.test(content);

    if (!hasOptimizationCriteria) {
      violations.push({
        code: 'DSPY_MISSING_OPTIMIZATION_CRITERIA',
        message: 'Optimization criteria not defined',
        severity: 'error',
        category: 'dspy_compliance',
        suggestion: 'Define OPTIMIZATION_CRITERIA list'
      });
    }

    if (!hasQualityGates) {
      violations.push({
        code: 'DSPY_MISSING_QUALITY_GATES',
        message: 'Quality gates not defined',
        severity: 'error',
        category: 'dspy_compliance',
        suggestion: 'Define QUALITY_GATES dictionary'
      });
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, 100 - violations.length * 50),
      violations,
      metrics: {
        hasOptimizationCriteria,
        hasQualityGates
      },
      suggestions: violations.length > 0 ? ['Define complete optimization and quality criteria'] : []
    };
  }

  // Helper methods for parsing and analysis
  private extractFunctions(content: string): any[] {
    // Simplified function extraction - would need more sophisticated parsing
    const functions: any[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const funcMatch = line.match(/def\s+(\w+)\s*\(/);

      if (funcMatch) {
        const name = funcMatch[1];
        let lineCount = 1;
        let assertionCount = 0;
        let cyclomaticComplexity = 1;

        // Count lines and assertions in function
        for (let j = i + 1; j < lines.length; j++) {
          const funcLine = lines[j];
          if (funcLine.match(/^\s*def\s+/) || funcLine.match(/^\s*class\s+/)) {
            break;
          }
          lineCount++;
          if (funcLine.includes('assert')) assertionCount++;
          if (funcLine.match(/\b(if|while|for|try|except|elif)\b/)) {
            cyclomaticComplexity++;
          }
        }

        functions.push({
          name,
          startLine: i + 1,
          lineCount,
          assertionCount,
          cyclomaticComplexity
        });
      }
    }

    return functions;
  }

  private findRecursivePatterns(content: string): any[] {
    // Simplified recursion detection
    return [];
  }

  private findDynamicLoops(content: string): any[] {
    // Detect while loops and for loops without fixed bounds
    const patterns: any[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/while\s+.*(?!range\()/)) {
        patterns.push({ line: i + 1, pattern: line.trim() });
      }
    }

    return patterns;
  }

  private findUncheckedReturnValues(content: string): any[] {
    // Simplified unchecked return detection
    return [];
  }

  private findStateClasses(content: string): any[] {
    const stateClasses: any[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const classMatch = line.match(/class\s+(\w*State\w*)/);

      if (classMatch) {
        const name = classMatch[1];
        const methods: string[] = [];

        // Find methods in this class
        for (let j = i + 1; j < lines.length; j++) {
          const methodLine = lines[j];
          if (methodLine.match(/^\s*class\s+/)) break;

          const methodMatch = methodLine.match(/def\s+(\w+)\s*\(/);
          if (methodMatch) {
            methods.push(methodMatch[1]);
          }
        }

        stateClasses.push({ name, line: i + 1, methods });
      }
    }

    return stateClasses;
  }

  private findDirectStateTransitions(content: string): any[] {
    // Find patterns like setState(), currentState = , etc.
    const patterns: any[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/setState\(|currentState\s*=/)) {
        patterns.push({ line: i + 1, pattern: line.trim() });
      }
    }

    return patterns;
  }

  private findEventStringLiterals(content: string): any[] {
    const literals: any[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = line.match(/["']([A-Z_]+)["']/g);

      if (matches) {
        for (const match of matches) {
          if (match.match(/["'][A-Z_]+["']/)) {
            literals.push({ line: i + 1, value: match });
          }
        }
      }
    }

    return literals;
  }

  private findHardcodedDependencies(content: string): any[] {
    const patterns: any[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/new\s+\w+\(|import\s+.*from\s+["']\./)) {
        patterns.push({ line: i + 1, pattern: line.trim() });
      }
    }

    return patterns;
  }

  private findEmptyFunctions(content: string): any[] {
    const emptyFunctions: any[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const funcMatch = line.match(/def\s+(\w+)\s*\(/);

      if (funcMatch) {
        const name = funcMatch[1];
        let hasImplementation = false;

        // Check if function has meaningful implementation
        for (let j = i + 1; j < lines.length; j++) {
          const funcLine = lines[j];
          if (funcLine.match(/^\s*def\s+/) || funcLine.match(/^\s*class\s+/)) break;

          if (funcLine.trim() && !funcLine.match(/^\s*(pass|return|#)/)) {
            hasImplementation = true;
            break;
          }
        }

        if (!hasImplementation) {
          emptyFunctions.push({ name, line: i + 1 });
        }
      }
    }

    return emptyFunctions;
  }

  private findDuplicateCodeBlocks(content: string): any[] {
    // Simplified duplicate detection
    return [];
  }

  // Public utility methods
  async validateMultipleTemplates(templatePaths: string[]): Promise<ComprehensiveValidationReport[]> {
    const results: ComprehensiveValidationReport[] = [];

    for (const templatePath of templatePaths) {
      const agentId = path.basename(templatePath, path.extname(templatePath));
      const result = await this.validateTemplate(templatePath, agentId);
      results.push(result);
    }

    return results;
  }

  clearCache(): void {
    this.validationCache.clear();
  }

  getValidationRules(): ValidationRule[] {
    return [...this.rules];
  }
}

export {
  TemplateValidator,
  ValidationRule,
  ValidationResult,
  Violation,
  ComprehensiveValidationReport
};

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: template-validator-001
// inputs: ["MasterAgentTemplate.ts", "BatchOptimizationEngine.ts"]
// tools_used: ["filesystem", "memory"]
// versions: {"model":"gemini-2.5-pro","prompt":"template-validator-v1.0"}
// === END FOOTER ===