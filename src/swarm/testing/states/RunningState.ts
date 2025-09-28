/**
 * Running State - Executing tests in sandbox
 * NASA Rule 10 Compliant - Functions ≤60 lines
 */

import { TestExecutionState, TestExecutionEvent, TestExecutionContext, TestResult } from '../fsm/TestExecutionStates';

export class RunningState {
  readonly name = TestExecutionState.RUNNING;
  private runningTests: Set<string> = new Set();
  private completedTests: Set<string> = new Set();
  private failedTests: Set<string> = new Set();

  /**
   * Initialize running state
   */
  init(context: TestExecutionContext): void {
    console.log(`Starting test execution: ${context.executionId}`);
    this.runningTests.clear();
    this.completedTests.clear();
    this.failedTests.clear();
  }

  /**
   * Update running state
   */
  update(context: TestExecutionContext): TestExecutionEvent | null {
    // Simulate test execution progress
    this.processRunningTests(context);

    if (this.areAllTestsComplete(context)) {
      return TestExecutionEvent.TESTS_COMPLETE;
    }

    if (this.shouldStopOnCriticalFailure(context)) {
      return TestExecutionEvent.EXECUTION_FAILED;
    }

    return null;
  }

  /**
   * Process currently running tests
   */
  private processRunningTests(context: TestExecutionContext): void {
    // Mock test execution - in real implementation this would manage actual test runs
    const totalTests = 5; // Mock total tests
    const completedCount = this.completedTests.size;

    if (completedCount < totalTests) {
      this.simulateTestCompletion(context, completedCount);
    }
  }

  /**
   * Simulate test completion for demonstration
   */
  private simulateTestCompletion(context: TestExecutionContext, testIndex: number): void {
    const testId = `test-${testIndex}`;

    if (!this.runningTests.has(testId) && !this.completedTests.has(testId)) {
      this.runningTests.add(testId);

      // Simulate test result
      const result: TestResult = {
        testId,
        status: Math.random() > 0.2 ? 'passed' : 'failed', // 80% pass rate
        duration: Math.random() * 5000 + 1000,
        output: `Test ${testId} output`,
        error: Math.random() > 0.8 ? 'Mock test error' : undefined
      };

      this.completeTest(testId, result, context);
    }
  }

  /**
   * Complete a test and update state
   */
  private completeTest(testId: string, result: TestResult, context: TestExecutionContext): void {
    this.runningTests.delete(testId);
    this.completedTests.add(testId);
    context.results.push(result);

    if (result.status === 'failed') {
      this.failedTests.add(testId);
    }

    console.log(`Test completed: ${testId} - ${result.status}`);
  }

  /**
   * Check if all tests are complete
   */
  private areAllTestsComplete(context: TestExecutionContext): boolean {
    const totalTests = 5; // Mock total - in real implementation this comes from test suite
    return this.completedTests.size >= totalTests;
  }

  /**
   * Check if execution should stop on critical failure
   */
  private shouldStopOnCriticalFailure(context: TestExecutionContext): boolean {
    if (!context.options.stopOnCriticalFailure) {
      return false;
    }

    // Check if any critical tests failed
    const criticalFailures = context.results.filter(r =>
      r.status === 'failed' && r.error?.includes('critical')
    );

    return criticalFailures.length > 0;
  }

  /**
   * Handle incoming events
   */
  handleEvent(event: TestExecutionEvent, context: TestExecutionContext): boolean {
    switch (event) {
      case TestExecutionEvent.TESTS_COMPLETE:
        return this.handleTestsComplete(context);
      case TestExecutionEvent.EXECUTION_FAILED:
        return this.handleExecutionFailure(context);
      case TestExecutionEvent.CANCEL_EXECUTION:
        return this.handleCancellation(context);
      default:
        console.warn(`Unhandled event in running state: ${event}`);
        return false;
    }
  }

  /**
   * Handle tests completion
   */
  private handleTestsComplete(context: TestExecutionContext): boolean {
    const passedCount = context.results.filter(r => r.status === 'passed').length;
    const totalCount = context.results.length;

    console.log(`Tests completed: ${passedCount}/${totalCount} passed`);
    return true;
  }

  /**
   * Handle execution failure
   */
  private handleExecutionFailure(context: TestExecutionContext): boolean {
    console.error(`Test execution failed: ${context.executionId}`);
    this.stopAllRunningTests();
    return true;
  }

  /**
   * Handle execution cancellation
   */
  private handleCancellation(context: TestExecutionContext): boolean {
    console.log(`Cancelling test execution: ${context.executionId}`);
    this.stopAllRunningTests();
    return true;
  }

  /**
   * Stop all currently running tests
   */
  private stopAllRunningTests(): void {
    this.runningTests.forEach(testId => {
      console.log(`Stopping test: ${testId}`);
    });
    this.runningTests.clear();
  }

  /**
   * Cleanup running state
   */
  shutdown(context: TestExecutionContext): void {
    console.log(`Shutting down running state for: ${context.executionId}`);
    this.stopAllRunningTests();
    this.completedTests.clear();
    this.failedTests.clear();
  }

  /**
   * Check state invariants
   */
  checkInvariants(context: TestExecutionContext): boolean {
    const runningCount = this.runningTests.size;
    const completedCount = this.completedTests.size;
    const resultsCount = context.results.length;

    return completedCount === resultsCount && runningCount >= 0;
  }
}