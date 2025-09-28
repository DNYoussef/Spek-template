/**
 * NASA Rule 10 Compliant Test Execution Bounds Manager
 * Manages fixed bounds and timeout constraints for LangGraph validation
 */

import {
  ExecutionBounds,
  ValidationBounds,
  ValidationTestExecution,
  FSM_VALIDATION_CONSTANTS,
  NASARule10ViolationError
} from '../types/ValidationFSM.types';
import { NASARule10Checker } from '../compliance/NASARule10Checker';

export class BoundsManager {
  private nasaChecker: NASARule10Checker;
  private executionBounds: ExecutionBounds;
  private validationBounds: ValidationBounds;
  private activeExecutions: Map<string, ValidationTestExecution> = new Map();
  private startTime: number = 0;

  constructor(
    executionBounds?: Partial<ExecutionBounds>,
    validationBounds?: Partial<ValidationBounds>
  ) {
    this.nasaChecker = new NASARule10Checker();

    // Set fixed execution bounds (NASA Rule 10 compliant)
    this.executionBounds = {
      maxTestDuration: FSM_VALIDATION_CONSTANTS.MAX_TEST_DURATION_MS,
      maxTotalDuration: FSM_VALIDATION_CONSTANTS.MAX_TOTAL_SUITE_DURATION_MS,
      maxRetries: FSM_VALIDATION_CONSTANTS.MAX_RETRY_ATTEMPTS,
      maxConcurrentOperations: FSM_VALIDATION_CONSTANTS.MAX_CONCURRENT_OPERATIONS,
      timeoutMs: FSM_VALIDATION_CONSTANTS.DEFAULT_TIMEOUT_MS,
      ...executionBounds
    };

    // Set fixed validation bounds (NASA Rule 10 compliant)
    this.validationBounds = {
      maxConcurrentWorkflows: 10,
      maxConcurrentStateUpdates: 20,
      maxConcurrentMessages: 50,
      maxStateHistoryChecks: 5,
      maxCircuitBreakerAttempts: 5,
      maxReceivers: 5,
      ...validationBounds
    };
  }

  /**
   * Initialize bounds manager with session tracking
   */
  initialize(): void {
    this.startTime = Date.now();
    this.activeExecutions.clear();
    this.nasaChecker.reset();

    console.log('[BoundsManager] Initialized with NASA Rule 10 compliant bounds');
    console.log('[BoundsManager] Execution bounds:', this.executionBounds);
    console.log('[BoundsManager] Validation bounds:', this.validationBounds);
  }

  /**
   * Start test execution with bounds tracking
   */
  startTestExecution(testName: string, expectedIterations: number): string {
    const executionId = `${testName}_${Date.now()}`;

    // Validate bounds before starting
    this.validateTestBounds(testName, expectedIterations);

    const execution: ValidationTestExecution = {
      testName,
      iterations: 0,
      maxIterations: expectedIterations,
      boundedExecution: true,
      fixedLoopCompliance: true,
      nonRecursiveExecution: true
    };

    this.activeExecutions.set(executionId, execution);
    this.nasaChecker.enterFunction(testName);

    console.log(`[BoundsManager] Started execution: ${executionId} (max: ${expectedIterations})`);
    return executionId;
  }

  /**
   * Update iteration count for active execution
   */
  updateIterationCount(executionId: string, currentIteration: number): void {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error(`Unknown execution ID: ${executionId}`);
    }

    execution.iterations = currentIteration;

    // Validate iteration bounds
    if (currentIteration > execution.maxIterations) {
      throw new NASARule10ViolationError(
        `Iteration bound exceeded: ${currentIteration} > ${execution.maxIterations}`,
        'error' as any,
        'error_occurred' as any,
        'UNBOUNDED_LOOP',
        { executionId, execution }
      );
    }

    // Check total execution time
    const elapsedTime = Date.now() - this.startTime;
    if (elapsedTime > this.executionBounds.maxTotalDuration) {
      throw new Error(`Total execution time exceeded: ${elapsedTime}ms > ${this.executionBounds.maxTotalDuration}ms`);
    }
  }

  /**
   * End test execution and validate compliance
   */
  endTestExecution(executionId: string): ValidationTestExecution {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error(`Unknown execution ID: ${executionId}`);
    }

    this.nasaChecker.exitFunction(execution.testName);

    // Validate final compliance
    const isCompliant = execution.iterations <= execution.maxIterations;
    execution.boundedExecution = isCompliant;
    execution.fixedLoopCompliance = isCompliant;

    this.activeExecutions.delete(executionId);

    console.log(`[BoundsManager] Ended execution: ${executionId} (${execution.iterations}/${execution.maxIterations})`);
    return execution;
  }

  /**
   * Execute bounded operation with automatic tracking
   */
  async executeBoundedOperation<T>(
    operationName: string,
    maxIterations: number,
    operation: (iteration: number) => Promise<T>
  ): Promise<T[]> {
    const executionId = this.startTestExecution(operationName, maxIterations);

    try {
      const results: T[] = [];

      // Fixed-bound loop execution (NASA Rule 10 compliant)
      for (let i = 0; i < maxIterations; i++) {
        this.updateIterationCount(executionId, i + 1);

        const result = await this.executeWithTimeout(
          () => operation(i),
          this.executionBounds.timeoutMs
        );

        results.push(result);
      }

      this.endTestExecution(executionId);
      return results;

    } catch (error) {
      // Cleanup on error
      if (this.activeExecutions.has(executionId)) {
        this.endTestExecution(executionId);
      }
      throw error;
    }
  }

  /**
   * Execute bounded concurrent operations with fixed limits
   */
  async executeBoundedConcurrent<T>(
    operationName: string,
    operations: Array<() => Promise<T>>,
    maxConcurrent?: number
  ): Promise<T[]> {
    const concurrentLimit = maxConcurrent || this.executionBounds.maxConcurrentOperations;

    // Validate concurrent bounds
    if (operations.length > concurrentLimit) {
      throw new NASARule10ViolationError(
        `Concurrent operation limit exceeded: ${operations.length} > ${concurrentLimit}`,
        'error' as any,
        'error_occurred' as any,
        'UNBOUNDED_LOOP',
        { operationName, requested: operations.length, limit: concurrentLimit }
      );
    }

    const executionId = this.startTestExecution(`${operationName}_concurrent`, operations.length);

    try {
      const results: T[] = [];

      // Execute operations in fixed-size batches
      const batchSize = Math.min(concurrentLimit, operations.length);

      for (let batchStart = 0; batchStart < operations.length; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, operations.length);
        const batch = operations.slice(batchStart, batchEnd);

        this.updateIterationCount(executionId, batchEnd);

        const batchResults = await Promise.all(
          batch.map(op => this.executeWithTimeout(op, this.executionBounds.timeoutMs))
        );

        results.push(...batchResults);
      }

      this.endTestExecution(executionId);
      return results;

    } catch (error) {
      if (this.activeExecutions.has(executionId)) {
        this.endTestExecution(executionId);
      }
      throw error;
    }
  }

  /**
   * Execute operation with fixed timeout (NASA Rule 10 compliant)
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Execute bounded retry with fixed attempts
   */
  async executeBoundedRetry<T>(
    operationName: string,
    operation: () => Promise<T>,
    maxRetries?: number,
    delayMs?: number
  ): Promise<T> {
    const retryLimit = maxRetries || this.executionBounds.maxRetries;
    const fixedDelay = delayMs || FSM_VALIDATION_CONSTANTS.FIXED_DELAY_MS;

    return this.nasaChecker.boundedRetry(
      operationName,
      retryLimit,
      operation,
      fixedDelay
    );
  }

  /**
   * Validate test bounds before execution
   */
  private validateTestBounds(testName: string, expectedIterations: number): void {
    // Validate iteration bounds
    if (expectedIterations <= 0) {
      throw new NASARule10ViolationError(
        `Invalid iteration count: ${expectedIterations} must be positive`,
        'error' as any,
        'error_occurred' as any,
        'UNBOUNDED_LOOP',
        { testName, expectedIterations }
      );
    }

    if (expectedIterations > FSM_VALIDATION_CONSTANTS.MAX_STATE_TRANSITIONS) {
      throw new NASARule10ViolationError(
        `Iteration count exceeds maximum: ${expectedIterations} > ${FSM_VALIDATION_CONSTANTS.MAX_STATE_TRANSITIONS}`,
        'error' as any,
        'error_occurred' as any,
        'UNBOUNDED_LOOP',
        { testName, expectedIterations }
      );
    }

    // Validate total execution time projection
    const elapsedTime = Date.now() - this.startTime;
    const remainingTime = this.executionBounds.maxTotalDuration - elapsedTime;

    if (remainingTime <= 0) {
      throw new Error(`Total execution time budget exhausted: ${elapsedTime}ms >= ${this.executionBounds.maxTotalDuration}ms`);
    }
  }

  /**
   * Get current bounds configuration
   */
  getBounds(): { execution: ExecutionBounds; validation: ValidationBounds } {
    return {
      execution: { ...this.executionBounds },
      validation: { ...this.validationBounds }
    };
  }

  /**
   * Get active executions status
   */
  getActiveExecutions(): Map<string, ValidationTestExecution> {
    return new Map(this.activeExecutions);
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): {
    totalExecutionTime: number;
    activeExecutions: number;
    completedExecutions: number;
    remainingTime: number;
    nasaCompliance: boolean;
  } {
    const totalExecutionTime = Date.now() - this.startTime;
    const remainingTime = Math.max(0, this.executionBounds.maxTotalDuration - totalExecutionTime);
    const complianceReport = this.nasaChecker.generateComplianceReport();

    return {
      totalExecutionTime,
      activeExecutions: this.activeExecutions.size,
      completedExecutions: 0, // Would need to track this separately
      remainingTime,
      nasaCompliance: complianceReport.overallCompliance
    };
  }

  /**
   * Validate specific bounds for different test types
   */
  validateConcurrencyBounds(workflowCount: number, stateUpdates: number, messageCount: number): void {
    const bounds = this.validationBounds;

    if (workflowCount > bounds.maxConcurrentWorkflows) {
      throw new NASARule10ViolationError(
        `Workflow concurrency limit exceeded: ${workflowCount} > ${bounds.maxConcurrentWorkflows}`,
        'error' as any,
        'error_occurred' as any,
        'UNBOUNDED_LOOP'
      );
    }

    if (stateUpdates > bounds.maxConcurrentStateUpdates) {
      throw new NASARule10ViolationError(
        `State update concurrency limit exceeded: ${stateUpdates} > ${bounds.maxConcurrentStateUpdates}`,
        'error' as any,
        'error_occurred' as any,
        'UNBOUNDED_LOOP'
      );
    }

    if (messageCount > bounds.maxConcurrentMessages) {
      throw new NASARule10ViolationError(
        `Message concurrency limit exceeded: ${messageCount} > ${bounds.maxConcurrentMessages}`,
        'error' as any,
        'error_occurred' as any,
        'UNBOUNDED_LOOP'
      );
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // End any remaining active executions
    for (const [executionId, execution] of this.activeExecutions) {
      console.warn(`[BoundsManager] Cleaning up active execution: ${executionId}`);
      this.nasaChecker.exitFunction(execution.testName);
    }

    this.activeExecutions.clear();
    this.nasaChecker.reset();

    console.log('[BoundsManager] Cleanup completed');
  }

  /**
   * Generate bounds compliance report
   */
  generateBoundsReport(): {
    executionBounds: ExecutionBounds;
    validationBounds: ValidationBounds;
    compliance: {
      boundsRespected: boolean;
      totalExecutionTime: number;
      maxExecutionTime: number;
      activeExecutions: number;
      nasaRule10Compliant: boolean;
    };
    recommendations: string[];
  } {
    const stats = this.getExecutionStats();
    const complianceReport = this.nasaChecker.generateComplianceReport();

    const boundsRespected =
      stats.totalExecutionTime <= this.executionBounds.maxTotalDuration &&
      stats.activeExecutions <= this.executionBounds.maxConcurrentOperations;

    const recommendations: string[] = [];

    if (!boundsRespected) {
      recommendations.push('Reduce test complexity or increase execution bounds');
    }

    if (!complianceReport.overallCompliance) {
      recommendations.push(...complianceReport.recommendations);
    }

    if (stats.remainingTime < 60000) {
      recommendations.push('Consider increasing total execution time budget');
    }

    return {
      executionBounds: this.executionBounds,
      validationBounds: this.validationBounds,
      compliance: {
        boundsRespected,
        totalExecutionTime: stats.totalExecutionTime,
        maxExecutionTime: this.executionBounds.maxTotalDuration,
        activeExecutions: stats.activeExecutions,
        nasaRule10Compliant: complianceReport.overallCompliance
      },
      recommendations
    };
  }
}

export default BoundsManager;