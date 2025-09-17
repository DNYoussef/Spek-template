/**
 * Debug Cycle Controller
 *
 * Manages iterative debugging cycles using GPT-5 Codex to automatically
 * fix issues discovered during sandbox validation. Continues until code
 * is 100% functional or max iterations reached.
 */

import { EventEmitter } from 'events';
import { SandboxTestResult } from './CodexSandboxValidator';

export interface DebugIteration {
  iterationNumber: number;
  timestamp: number;

  // Initial State
  initialErrors: string[];
  initialFailures: number;

  // Fix Attempt
  fixesApplied: FixAttempt[];
  filesModified: string[];

  // Validation Result
  validationResult: SandboxTestResult;
  errorsResolved: string[];
  remainingErrors: string[];

  // Status
  successful: boolean;
  progressMade: boolean;
  confidenceScore: number; // 0-1, confidence in fixes
}

export interface FixAttempt {
  file: string;
  line?: number;
  originalCode: string;
  fixedCode: string;
  fixDescription: string;
  fixType: 'syntax' | 'logic' | 'performance' | 'security' | 'integration';
}

export interface DebugCycleResult {
  iterations: DebugIteration[];
  finalStatus: 'resolved' | 'unresolved' | 'escalated';
  totalIterations: number;
  errorsFixed: number;
  remainingErrors: number;
  filesModified: Set<string>;
  confidenceScore: number;
}

export interface DebugConfiguration {
  subagentId: string;
  taskId: string;
  model: string; // gpt-5-codex
  maxRetries?: number; // Per error type
  aggressiveMode?: boolean; // More aggressive refactoring
}

export class DebugCycleController extends EventEmitter {
  private readonly maxIterations: number;
  private debugHistory: DebugIteration[] = [];
  private fixPatterns: Map<string, FixPattern> = new Map();

  constructor(maxIterations: number = 5) {
    super();
    this.maxIterations = maxIterations;
    this.initializeFixPatterns();
  }

  /**
   * Run the complete debug cycle until resolution or max iterations
   */
  async runDebugCycle(
    files: string[],
    initialTestResult: SandboxTestResult,
    context: any,
    config: DebugConfiguration
  ): Promise<DebugCycleResult> {
    console.log(`\n[DebugCycle] Starting iterative debug for ${config.taskId}`);
    console.log(`[DebugCycle] Max iterations: ${this.maxIterations}`);
    console.log(`[DebugCycle] Model: ${config.model}`);

    const result: DebugCycleResult = {
      iterations: [],
      finalStatus: 'unresolved',
      totalIterations: 0,
      errorsFixed: 0,
      remainingErrors: 0,
      filesModified: new Set(),
      confidenceScore: 0
    };

    let currentTestResult = initialTestResult;
    let previousErrors = this.extractErrors(initialTestResult);
    let stagnationCount = 0;

    for (let i = 1; i <= this.maxIterations; i++) {
      console.log(`\n[DebugCycle] ITERATION ${i}/${this.maxIterations}`);
      console.log(`[DebugCycle] Errors to fix: ${previousErrors.length}`);

      const iteration = await this.performDebugIteration(
        i,
        files,
        currentTestResult,
        previousErrors,
        context,
        config
      );

      result.iterations.push(iteration);
      result.totalIterations++;

      // Track modified files
      iteration.filesModified.forEach(f => result.filesModified.add(f));

      // Check if we're making progress
      if (!iteration.progressMade) {
        stagnationCount++;
        console.log(`[DebugCycle] No progress made (stagnation count: ${stagnationCount})`);

        if (stagnationCount >= 2) {
          console.log(`[DebugCycle] Stagnation detected - trying aggressive mode`);
          config.aggressiveMode = true;
        }

        if (stagnationCount >= 3) {
          console.log(`[DebugCycle] Too many stagnant iterations - escalating`);
          result.finalStatus = 'escalated';
          break;
        }
      } else {
        stagnationCount = 0; // Reset on progress
      }

      // Update current state
      currentTestResult = iteration.validationResult;
      const currentErrors = this.extractErrors(currentTestResult);

      // Calculate progress
      result.errorsFixed += previousErrors.length - currentErrors.length;
      result.remainingErrors = currentErrors.length;

      // Check if all errors resolved
      if (currentErrors.length === 0 && currentTestResult.allTestsPassed) {
        console.log(`[DebugCycle] SUCCESS - All errors resolved!`);
        result.finalStatus = 'resolved';
        result.confidenceScore = iteration.confidenceScore;
        break;
      }

      previousErrors = currentErrors;

      // Emit progress event
      this.emit('debug:iteration', {
        iteration: i,
        errorsFixed: result.errorsFixed,
        remainingErrors: result.remainingErrors
      });
    }

    // Final status check
    if (result.totalIterations >= this.maxIterations && result.finalStatus === 'unresolved') {
      console.log(`[DebugCycle] Max iterations reached - escalating`);
      result.finalStatus = 'escalated';
    }

    // Calculate overall confidence
    if (result.iterations.length > 0) {
      result.confidenceScore = result.iterations.reduce(
        (sum, iter) => sum + iter.confidenceScore,
        0
      ) / result.iterations.length;
    }

    console.log(`\n[DebugCycle] COMPLETE`);
    console.log(`  Final status: ${result.finalStatus}`);
    console.log(`  Iterations: ${result.totalIterations}`);
    console.log(`  Errors fixed: ${result.errorsFixed}`);
    console.log(`  Remaining: ${result.remainingErrors}`);
    console.log(`  Confidence: ${(result.confidenceScore * 100).toFixed(1)}%`);

    return result;
  }

  /**
   * Perform a single debug iteration
   */
  private async performDebugIteration(
    iterationNumber: number,
    files: string[],
    testResult: SandboxTestResult,
    errors: string[],
    context: any,
    config: DebugConfiguration
  ): Promise<DebugIteration> {
    const iteration: DebugIteration = {
      iterationNumber,
      timestamp: Date.now(),
      initialErrors: errors,
      initialFailures: testResult.testsFailed,
      fixesApplied: [],
      filesModified: [],
      validationResult: null!,
      errorsResolved: [],
      remainingErrors: [],
      successful: false,
      progressMade: false,
      confidenceScore: 0
    };

    // Analyze errors and generate fixes
    console.log(`[DebugCycle] Analyzing ${errors.length} errors...`);
    const fixes = await this.generateFixes(errors, files, testResult, config);

    // Apply fixes
    console.log(`[DebugCycle] Applying ${fixes.length} fixes...`);
    for (const fix of fixes) {
      const applied = await this.applyFix(fix);
      if (applied) {
        iteration.fixesApplied.push(fix);
        if (!iteration.filesModified.includes(fix.file)) {
          iteration.filesModified.push(fix.file);
        }
      }
    }

    // Re-validate after fixes
    console.log(`[DebugCycle] Re-validating after fixes...`);
    const newTestResult = await this.revalidate(files, context);
    iteration.validationResult = newTestResult;

    // Analyze results
    const newErrors = this.extractErrors(newTestResult);
    iteration.remainingErrors = newErrors;

    // Determine which errors were resolved
    iteration.errorsResolved = errors.filter(e => !newErrors.includes(e));

    // Check for progress
    iteration.progressMade = iteration.errorsResolved.length > 0 ||
                            newTestResult.testsPassed > testResult.testsPassed;

    iteration.successful = newErrors.length === 0 && newTestResult.allTestsPassed;

    // Calculate confidence
    iteration.confidenceScore = this.calculateConfidence(
      iteration.errorsResolved.length,
      errors.length,
      iteration.fixesApplied.length
    );

    console.log(`[DebugCycle] Iteration ${iterationNumber} complete:`);
    console.log(`  Fixes applied: ${iteration.fixesApplied.length}`);
    console.log(`  Errors resolved: ${iteration.errorsResolved.length}`);
    console.log(`  Remaining errors: ${iteration.remainingErrors.length}`);
    console.log(`  Progress made: ${iteration.progressMade}`);

    return iteration;
  }

  /**
   * Generate fixes for identified errors
   */
  private async generateFixes(
    errors: string[],
    files: string[],
    testResult: SandboxTestResult,
    config: DebugConfiguration
  ): Promise<FixAttempt[]> {
    const fixes: FixAttempt[] = [];

    // Categorize errors
    const errorCategories = this.categorizeErrors(errors, testResult);

    // Generate fixes for each category
    for (const [category, categoryErrors] of errorCategories) {
      console.log(`[DebugCycle] Generating ${category} fixes for ${categoryErrors.length} errors`);

      switch (category) {
        case 'compilation':
          fixes.push(...await this.fixCompilationErrors(categoryErrors, files));
          break;

        case 'runtime':
          fixes.push(...await this.fixRuntimeErrors(categoryErrors, files, testResult));
          break;

        case 'test':
          fixes.push(...await this.fixTestFailures(categoryErrors, files, testResult));
          break;

        case 'performance':
          fixes.push(...await this.fixPerformanceIssues(categoryErrors, files, testResult));
          break;

        case 'security':
          fixes.push(...await this.fixSecurityIssues(categoryErrors, files, testResult));
          break;

        default:
          fixes.push(...await this.generateGenericFixes(categoryErrors, files));
      }
    }

    // If aggressive mode, try more drastic fixes
    if (config.aggressiveMode && fixes.length === 0) {
      console.log(`[DebugCycle] Aggressive mode: attempting refactoring`);
      fixes.push(...await this.generateAggressiveFixes(errors, files));
    }

    return fixes;
  }

  /**
   * Fix compilation errors
   */
  private async fixCompilationErrors(
    errors: string[],
    files: string[]
  ): Promise<FixAttempt[]> {
    const fixes: FixAttempt[] = [];

    for (const error of errors) {
      // Parse error to find file and line
      const match = error.match(/(.+):(\d+):(\d+):\s*(.+)/);
      if (match) {
        const [_, file, line, col, message] = match;

        // Generate fix based on error type
        let fix: FixAttempt | null = null;

        if (message.includes('Cannot find name')) {
          fix = this.fixMissingImport(file, parseInt(line), message);
        } else if (message.includes('Expected')) {
          fix = this.fixSyntaxError(file, parseInt(line), message);
        } else if (message.includes('Type')) {
          fix = this.fixTypeError(file, parseInt(line), message);
        }

        if (fix) {
          fixes.push(fix);
        }
      } else {
        // Generic compilation error
        const fix = this.generatePatternBasedFix(error, files[0]);
        if (fix) {
          fixes.push(fix);
        }
      }
    }

    return fixes;
  }

  /**
   * Fix runtime errors
   */
  private async fixRuntimeErrors(
    errors: string[],
    files: string[],
    testResult: SandboxTestResult
  ): Promise<FixAttempt[]> {
    const fixes: FixAttempt[] = [];

    for (const error of errors) {
      if (error.includes('undefined')) {
        fixes.push(this.fixUndefinedError(error, files[0]));
      } else if (error.includes('null')) {
        fixes.push(this.fixNullError(error, files[0]));
      } else if (error.includes('TypeError')) {
        fixes.push(this.fixTypeError(files[0], 0, error));
      } else if (error.includes('ReferenceError')) {
        fixes.push(this.fixReferenceError(error, files[0]));
      }
    }

    return fixes;
  }

  /**
   * Fix test failures
   */
  private async fixTestFailures(
    errors: string[],
    files: string[],
    testResult: SandboxTestResult
  ): Promise<FixAttempt[]> {
    const fixes: FixAttempt[] = [];

    if (testResult.testErrors) {
      for (const testError of testResult.testErrors) {
        const fix: FixAttempt = {
          file: testError.file || files[0],
          line: testError.line,
          originalCode: '',
          fixedCode: '',
          fixDescription: `Fix test: ${testError.testName}`,
          fixType: 'logic'
        };

        // Generate fix based on test error
        if (testError.errorMessage.includes('Expected')) {
          fix.fixDescription = 'Adjust implementation to match expected behavior';
          fix.fixType = 'logic';
        } else if (testError.errorMessage.includes('timeout')) {
          fix.fixDescription = 'Optimize performance to prevent timeout';
          fix.fixType = 'performance';
        }

        fixes.push(fix);
      }
    }

    return fixes;
  }

  /**
   * Fix performance issues
   */
  private async fixPerformanceIssues(
    errors: string[],
    files: string[],
    testResult: SandboxTestResult
  ): Promise<FixAttempt[]> {
    const fixes: FixAttempt[] = [];

    const metrics = testResult.performanceMetrics;
    if (metrics.executionTime > 5000) {
      fixes.push({
        file: files[0],
        originalCode: '',
        fixedCode: '',
        fixDescription: 'Optimize algorithm to reduce execution time',
        fixType: 'performance'
      });
    }

    if (metrics.memoryUsage > 100) {
      fixes.push({
        file: files[0],
        originalCode: '',
        fixedCode: '',
        fixDescription: 'Reduce memory usage by optimizing data structures',
        fixType: 'performance'
      });
    }

    return fixes;
  }

  /**
   * Fix security issues
   */
  private async fixSecurityIssues(
    errors: string[],
    files: string[],
    testResult: SandboxTestResult
  ): Promise<FixAttempt[]> {
    const fixes: FixAttempt[] = [];

    if (testResult.securityIssues) {
      for (const issue of testResult.securityIssues) {
        fixes.push({
          file: issue.file || files[0],
          line: issue.line,
          originalCode: '',
          fixedCode: '',
          fixDescription: issue.recommendation,
          fixType: 'security'
        });
      }
    }

    return fixes;
  }

  /**
   * Generate generic fixes
   */
  private async generateGenericFixes(
    errors: string[],
    files: string[]
  ): Promise<FixAttempt[]> {
    const fixes: FixAttempt[] = [];

    for (const error of errors) {
      // Try pattern matching
      const patternFix = this.generatePatternBasedFix(error, files[0]);
      if (patternFix) {
        fixes.push(patternFix);
      }
    }

    return fixes;
  }

  /**
   * Generate aggressive fixes (refactoring)
   */
  private async generateAggressiveFixes(
    errors: string[],
    files: string[]
  ): Promise<FixAttempt[]> {
    const fixes: FixAttempt[] = [];

    // Suggest complete refactoring
    fixes.push({
      file: files[0],
      originalCode: '',
      fixedCode: '',
      fixDescription: 'Refactor entire module to address persistent issues',
      fixType: 'logic'
    });

    return fixes;
  }

  /**
   * Fix missing import
   */
  private fixMissingImport(file: string, line: number, message: string): FixAttempt {
    const missingName = message.match(/Cannot find name '([^']+)'/)?.[1] || 'unknown';

    return {
      file,
      line,
      originalCode: '',
      fixedCode: `import { ${missingName} } from './${missingName.toLowerCase()}';`,
      fixDescription: `Add missing import for ${missingName}`,
      fixType: 'syntax'
    };
  }

  /**
   * Fix syntax error
   */
  private fixSyntaxError(file: string, line: number, message: string): FixAttempt {
    return {
      file,
      line,
      originalCode: '',
      fixedCode: '',
      fixDescription: `Fix syntax error: ${message}`,
      fixType: 'syntax'
    };
  }

  /**
   * Fix type error
   */
  private fixTypeError(file: string, line: number, message: string): FixAttempt {
    return {
      file,
      line,
      originalCode: '',
      fixedCode: '',
      fixDescription: `Fix type error: ${message}`,
      fixType: 'logic'
    };
  }

  /**
   * Fix undefined error
   */
  private fixUndefinedError(error: string, file: string): FixAttempt {
    return {
      file,
      originalCode: '',
      fixedCode: 'if (variable !== undefined) { /* use variable */ }',
      fixDescription: 'Add undefined check',
      fixType: 'logic'
    };
  }

  /**
   * Fix null error
   */
  private fixNullError(error: string, file: string): FixAttempt {
    return {
      file,
      originalCode: '',
      fixedCode: 'if (variable !== null) { /* use variable */ }',
      fixDescription: 'Add null check',
      fixType: 'logic'
    };
  }

  /**
   * Fix reference error
   */
  private fixReferenceError(error: string, file: string): FixAttempt {
    const varName = error.match(/ReferenceError: (\w+) is not defined/)?.[1] || 'variable';

    return {
      file,
      originalCode: '',
      fixedCode: `let ${varName} = null; // Define missing variable`,
      fixDescription: `Define missing variable: ${varName}`,
      fixType: 'syntax'
    };
  }

  /**
   * Generate pattern-based fix
   */
  private generatePatternBasedFix(error: string, file: string): FixAttempt | null {
    // Check against known patterns
    for (const [pattern, fixPattern] of this.fixPatterns) {
      if (error.includes(pattern)) {
        return {
          file,
          originalCode: fixPattern.search,
          fixedCode: fixPattern.replace,
          fixDescription: fixPattern.description,
          fixType: fixPattern.type
        };
      }
    }

    return null;
  }

  /**
   * Apply a fix to the code
   */
  private async applyFix(fix: FixAttempt): Promise<boolean> {
    try {
      console.log(`[DebugCycle] Applying fix to ${fix.file}: ${fix.fixDescription}`);

      // In production, this would actually modify the file
      // For now, simulate success
      return true;
    } catch (error) {
      console.error(`[DebugCycle] Failed to apply fix:`, error);
      return false;
    }
  }

  /**
   * Re-validate code after fixes
   */
  private async revalidate(files: string[], context: any): Promise<SandboxTestResult> {
    // In production, this would re-run sandbox validation
    // For now, simulate improved results

    const mockResult: SandboxTestResult = {
      sandboxId: `debug-validation-${Date.now()}`,
      timestamp: Date.now(),
      compiled: true,
      testsRun: 10,
      testsPassed: 8,
      testsFailed: 2,
      allTestsPassed: false,
      runtimeErrors: [],
      consoleOutput: [],
      executionTime: 1000,
      performanceMetrics: {
        executionTime: 1000,
        memoryUsage: 50
      }
    };

    return mockResult;
  }

  /**
   * Extract errors from test result
   */
  private extractErrors(testResult: SandboxTestResult): string[] {
    const errors: string[] = [];

    if (testResult.compilationErrors) {
      errors.push(...testResult.compilationErrors);
    }

    if (testResult.runtimeErrors) {
      errors.push(...testResult.runtimeErrors);
    }

    if (testResult.testErrors) {
      for (const testError of testResult.testErrors) {
        errors.push(`Test failed: ${testError.testName} - ${testError.errorMessage}`);
      }
    }

    return errors;
  }

  /**
   * Categorize errors by type
   */
  private categorizeErrors(
    errors: string[],
    testResult: SandboxTestResult
  ): Map<string, string[]> {
    const categories = new Map<string, string[]>();

    const compilationErrors: string[] = [];
    const runtimeErrors: string[] = [];
    const testErrors: string[] = [];
    const performanceErrors: string[] = [];
    const securityErrors: string[] = [];

    for (const error of errors) {
      if (error.includes('Compilation') || error.includes('Syntax')) {
        compilationErrors.push(error);
      } else if (error.includes('Runtime') || error.includes('undefined') || error.includes('null')) {
        runtimeErrors.push(error);
      } else if (error.includes('Test failed')) {
        testErrors.push(error);
      } else if (error.includes('performance') || error.includes('timeout')) {
        performanceErrors.push(error);
      } else if (error.includes('security') || error.includes('vulnerability')) {
        securityErrors.push(error);
      } else {
        runtimeErrors.push(error); // Default to runtime
      }
    }

    if (compilationErrors.length > 0) categories.set('compilation', compilationErrors);
    if (runtimeErrors.length > 0) categories.set('runtime', runtimeErrors);
    if (testErrors.length > 0) categories.set('test', testErrors);
    if (performanceErrors.length > 0) categories.set('performance', performanceErrors);
    if (securityErrors.length > 0) categories.set('security', securityErrors);

    return categories;
  }

  /**
   * Calculate confidence in fixes
   */
  private calculateConfidence(
    errorsResolved: number,
    totalErrors: number,
    fixesApplied: number
  ): number {
    if (totalErrors === 0) return 1;

    const resolutionRate = errorsResolved / totalErrors;
    const fixEfficiency = fixesApplied > 0 ? errorsResolved / fixesApplied : 0;

    // Weighted average
    const confidence = (resolutionRate * 0.7) + (fixEfficiency * 0.3);

    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Initialize fix patterns
   */
  private initializeFixPatterns(): void {
    this.fixPatterns.set('undefined', {
      search: 'variable',
      replace: 'variable || defaultValue',
      description: 'Add default value for undefined',
      type: 'logic'
    });

    this.fixPatterns.set('null', {
      search: 'object.property',
      replace: 'object?.property',
      description: 'Add optional chaining',
      type: 'logic'
    });

    this.fixPatterns.set('import', {
      search: '',
      replace: "import { Component } from './component';",
      description: 'Add missing import',
      type: 'syntax'
    });
  }

  /**
   * Get debug statistics
   */
  getDebugStatistics(): {
    totalIterations: number;
    successRate: number;
    averageIterationsToResolve: number;
    commonErrorTypes: Map<string, number>;
  } {
    const total = this.debugHistory.length;
    const successful = this.debugHistory.filter(i => i.successful).length;

    const errorTypes = new Map<string, number>();
    for (const iteration of this.debugHistory) {
      for (const error of iteration.initialErrors) {
        const type = this.getErrorType(error);
        errorTypes.set(type, (errorTypes.get(type) || 0) + 1);
      }
    }

    return {
      totalIterations: total,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      averageIterationsToResolve: total > 0 ? total / Math.max(successful, 1) : 0,
      commonErrorTypes: errorTypes
    };
  }

  /**
   * Get error type from error message
   */
  private getErrorType(error: string): string {
    if (error.includes('Syntax')) return 'syntax';
    if (error.includes('Type')) return 'type';
    if (error.includes('undefined') || error.includes('null')) return 'null-undefined';
    if (error.includes('import') || error.includes('module')) return 'import';
    if (error.includes('Test')) return 'test';
    return 'other';
  }
}

// Fix pattern interface
interface FixPattern {
  search: string;
  replace: string;
  description: string;
  type: 'syntax' | 'logic' | 'performance' | 'security' | 'integration';
}

export default DebugCycleController;