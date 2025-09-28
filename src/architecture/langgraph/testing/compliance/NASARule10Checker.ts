/**
 * NASA Rule 10 Compliance Checker for LangGraph Validation Suite
 * Enforces "No recursion, no variable loops" requirements
 *
 * NASA Rule 10: The use of recursion shall not be allowed.
 * Extension: Variable loop bounds shall not be used.
 */

import {
  NASARule10Validator,
  LoopInfo,
  NASAComplianceReport,
  ValidationFSMError,
  NASARule10ViolationError
} from '../types/ValidationFSM.types';

export class NASARule10Checker implements NASARule10Validator {
  private callStack: string[] = [];
  private loopRegistry: Map<string, LoopInfo[]> = new Map();
  private violations: string[] = [];
  private unboundedLoops: string[] = [];

  /**
   * Validate that no recursion occurs in function calls
   */
  validateNoRecursion(functionName: string, callStack: string[]): boolean {
    // Check if function already exists in call stack (recursion detection)
    if (callStack.includes(functionName)) {
      const violation = `Recursion detected: ${functionName} called recursively. Call stack: ${callStack.join(' -> ')} -> ${functionName}`;
      this.violations.push(violation);
      return false;
    }

    return true;
  }

  /**
   * Validate that all loops have fixed, bounded iterations
   */
  validateFixedLoops(loopInfo: LoopInfo[]): boolean {
    let allLoopsValid = true;

    for (const loop of loopInfo) {
      // Check if loop has fixed bounds
      if (!loop.isFixed) {
        const violation = `Variable loop bound detected in ${loop.functionName}: ${loop.loopType} loop with variable iterations`;
        this.unboundedLoops.push(violation);
        allLoopsValid = false;
      }

      // Check if loop is bounded
      if (!loop.isBounded || loop.maxIterations <= 0) {
        const violation = `Unbounded loop detected in ${loop.functionName}: ${loop.loopType} loop without finite bound`;
        this.unboundedLoops.push(violation);
        allLoopsValid = false;
      }

      // Check if actual iterations exceed maximum
      if (loop.actualIterations > loop.maxIterations) {
        const violation = `Loop bound exceeded in ${loop.functionName}: ${loop.actualIterations} > ${loop.maxIterations}`;
        this.unboundedLoops.push(violation);
        allLoopsValid = false;
      }
    }

    return allLoopsValid;
  }

  /**
   * Validate that iterations are bounded by fixed maximum
   */
  validateBoundedIterations(iterations: number, maxIterations: number): boolean {
    if (maxIterations <= 0) {
      this.violations.push(`Invalid maximum iterations: ${maxIterations} must be positive`);
      return false;
    }

    if (iterations > maxIterations) {
      this.violations.push(`Iteration bound exceeded: ${iterations} > ${maxIterations}`);
      return false;
    }

    return true;
  }

  /**
   * Register a function call for recursion tracking
   */
  enterFunction(functionName: string): void {
    if (!this.validateNoRecursion(functionName, this.callStack)) {
      throw new NASARule10ViolationError(
        `Recursion violation in ${functionName}`,
        'error' as any,
        'error_occurred' as any,
        'RECURSION',
        { functionName, callStack: [...this.callStack] }
      );
    }

    this.callStack.push(functionName);
  }

  /**
   * Exit function call tracking
   */
  exitFunction(functionName: string): void {
    const lastFunction = this.callStack.pop();
    if (lastFunction !== functionName) {
      console.warn(`Function exit mismatch: expected ${functionName}, got ${lastFunction}`);
    }
  }

  /**
   * Register loop information for validation
   */
  registerLoop(functionName: string, loopInfo: LoopInfo): void {
    if (!this.loopRegistry.has(functionName)) {
      this.loopRegistry.set(functionName, []);
    }

    this.loopRegistry.get(functionName)!.push(loopInfo);

    // Immediate validation
    if (!this.validateFixedLoops([loopInfo])) {
      throw new NASARule10ViolationError(
        `Loop violation in ${functionName}`,
        'error' as any,
        'error_occurred' as any,
        loopInfo.isBounded ? 'VARIABLE_ITERATION' : 'UNBOUNDED_LOOP',
        { functionName, loopInfo }
      );
    }
  }

  /**
   * Create a bounded for-loop wrapper (NASA Rule 10 compliant)
   */
  boundedForLoop<T>(
    functionName: string,
    maxIterations: number,
    iterationCallback: (index: number) => T
  ): T[] {
    const loopInfo: LoopInfo = {
      functionName,
      loopType: 'for',
      maxIterations,
      actualIterations: 0,
      isFixed: true,
      isBounded: true
    };

    this.registerLoop(functionName, loopInfo);

    const results: T[] = [];

    // Fixed-bound for loop - NASA Rule 10 compliant
    for (let i = 0; i < maxIterations; i++) {
      loopInfo.actualIterations = i + 1;
      results.push(iterationCallback(i));
    }

    return results;
  }

  /**
   * Create a bounded async for-loop wrapper (NASA Rule 10 compliant)
   */
  async boundedAsyncForLoop<T>(
    functionName: string,
    maxIterations: number,
    iterationCallback: (index: number) => Promise<T>
  ): Promise<T[]> {
    const loopInfo: LoopInfo = {
      functionName,
      loopType: 'for',
      maxIterations,
      actualIterations: 0,
      isFixed: true,
      isBounded: true
    };

    this.registerLoop(functionName, loopInfo);

    const results: T[] = [];

    // Fixed-bound async for loop - NASA Rule 10 compliant
    for (let i = 0; i < maxIterations; i++) {
      loopInfo.actualIterations = i + 1;
      results.push(await iterationCallback(i));
    }

    return results;
  }

  /**
   * Create a bounded retry mechanism (NASA Rule 10 compliant)
   */
  async boundedRetry<T>(
    functionName: string,
    maxRetries: number,
    operation: () => Promise<T>,
    delayMs: number = 1000
  ): Promise<T> {
    const loopInfo: LoopInfo = {
      functionName: `${functionName}_retry`,
      loopType: 'for',
      maxIterations: maxRetries,
      actualIterations: 0,
      isFixed: true,
      isBounded: true
    };

    this.registerLoop(functionName, loopInfo);

    let lastError: Error | null = null;

    // Fixed-bound retry loop - NASA Rule 10 compliant
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      loopInfo.actualIterations = attempt + 1;

      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Fixed delay between retries (no exponential backoff to avoid variable timing)
        if (attempt < maxRetries - 1) {
          await this.fixedDelay(delayMs);
        }
      }
    }

    throw new Error(`${functionName} failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Fixed delay function (NASA Rule 10 compliant)
   */
  private async fixedDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate array operations with bounded processing
   */
  validateBoundedArrayProcessing<T, R>(
    functionName: string,
    array: T[],
    maxElements: number,
    processor: (item: T, index: number) => R
  ): R[] {
    if (array.length > maxElements) {
      throw new NASARule10ViolationError(
        `Array processing bound exceeded: ${array.length} > ${maxElements}`,
        'error' as any,
        'error_occurred' as any,
        'UNBOUNDED_LOOP',
        { functionName, arrayLength: array.length, maxElements }
      );
    }

    return this.boundedForLoop(
      `${functionName}_array_processing`,
      array.length,
      (index) => processor(array[index], index)
    );
  }

  /**
   * Generate comprehensive compliance report
   */
  generateComplianceReport(): NASAComplianceReport {
    // Collect all loop information
    const allLoops: LoopInfo[] = [];
    for (const loops of this.loopRegistry.values()) {
      allLoops.push(...loops);
    }

    // Validate all registered loops
    const fixedLoopCompliance = this.validateFixedLoops(allLoops);

    // Check iteration bounds
    const iterationBoundCompliance = allLoops.every(loop =>
      loop.actualIterations <= loop.maxIterations && loop.isBounded
    );

    const overallCompliance =
      this.violations.length === 0 &&
      this.unboundedLoops.length === 0 &&
      fixedLoopCompliance &&
      iterationBoundCompliance;

    const recommendations: string[] = [];

    if (this.violations.length > 0) {
      recommendations.push('Eliminate all recursive function calls');
      recommendations.push('Replace recursion with iterative approaches using fixed-bound loops');
    }

    if (this.unboundedLoops.length > 0) {
      recommendations.push('Replace variable loops with fixed-bound loops');
      recommendations.push('Set explicit maximum iteration limits for all loops');
    }

    if (!iterationBoundCompliance) {
      recommendations.push('Ensure all loops respect their declared maximum iteration bounds');
    }

    if (overallCompliance) {
      recommendations.push('NASA Rule 10 compliance achieved - maintain current practices');
    }

    return {
      overallCompliance,
      recursionViolations: [...this.violations],
      unboundedLoopViolations: [...this.unboundedLoops],
      fixedLoopCompliance,
      iterationBoundCompliance,
      recommendations
    };
  }

  /**
   * Get current call stack (for debugging)
   */
  getCurrentCallStack(): string[] {
    return [...this.callStack];
  }

  /**
   * Get registered loops for a function
   */
  getLoopsForFunction(functionName: string): LoopInfo[] {
    return this.loopRegistry.get(functionName) || [];
  }

  /**
   * Reset checker state
   */
  reset(): void {
    this.callStack = [];
    this.loopRegistry.clear();
    this.violations = [];
    this.unboundedLoops = [];
  }

  /**
   * Get compliance statistics
   */
  getComplianceStats(): {
    totalFunctions: number;
    totalLoops: number;
    compliantLoops: number;
    violationCount: number;
  } {
    const allLoops: LoopInfo[] = [];
    for (const loops of this.loopRegistry.values()) {
      allLoops.push(...loops);
    }

    const compliantLoops = allLoops.filter(loop =>
      loop.isFixed && loop.isBounded && loop.actualIterations <= loop.maxIterations
    ).length;

    return {
      totalFunctions: this.loopRegistry.size,
      totalLoops: allLoops.length,
      compliantLoops,
      violationCount: this.violations.length + this.unboundedLoops.length
    };
  }
}

/**
 * Function decorator for NASA Rule 10 compliance tracking
 */
export function nasaCompliant(functionName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const checker = this.nasaChecker || new NASARule10Checker();

      try {
        checker.enterFunction(functionName);
        const result = await method.apply(this, args);
        checker.exitFunction(functionName);
        return result;
      } catch (error) {
        checker.exitFunction(functionName);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Utility function to validate NASA Rule 10 compliance for any function
 */
export function validateNASACompliance<T extends (...args: any[]) => any>(
  functionName: string,
  func: T,
  checker: NASARule10Checker = new NASARule10Checker()
): T {
  return ((...args: any[]) => {
    checker.enterFunction(functionName);
    try {
      const result = func(...args);
      checker.exitFunction(functionName);
      return result;
    } catch (error) {
      checker.exitFunction(functionName);
      throw error;
    }
  }) as T;
}

export default NASARule10Checker;