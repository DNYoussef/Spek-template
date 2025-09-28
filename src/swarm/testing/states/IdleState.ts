/**
 * Idle State - Test execution waiting to start
 * NASA Rule 10 Compliant - Functions ≤60 lines
 */

import { TestExecutionState, TestExecutionEvent, TestExecutionContext } from '../fsm/TestExecutionStates';

export class IdleState {
  readonly name = TestExecutionState.IDLE;

  /**
   * Initialize idle state
   */
  init(context: TestExecutionContext): void {
    console.log(`Test execution ${context.executionId} in idle state`);
    context.results = [];
    context.errors = [];
  }

  /**
   * Update idle state - prepare for execution
   */
  update(context: TestExecutionContext): TestExecutionEvent | null {
    // Check if we have all required components to start
    if (this.canStartExecution(context)) {
      return TestExecutionEvent.START_EXECUTION;
    }
    return null;
  }

  /**
   * Check if execution can start
   */
  private canStartExecution(context: TestExecutionContext): boolean {
    return !!(
      context.executionId &&
      context.sandboxId &&
      context.testSuiteId
    );
  }

  /**
   * Handle incoming events
   */
  handleEvent(event: TestExecutionEvent, context: TestExecutionContext): boolean {
    switch (event) {
      case TestExecutionEvent.START_EXECUTION:
        return this.startExecution(context);
      case TestExecutionEvent.CANCEL_EXECUTION:
        return this.cancelExecution(context);
      default:
        console.warn(`Unhandled event in idle state: ${event}`);
        return false;
    }
  }

  /**
   * Start test execution
   */
  private startExecution(context: TestExecutionContext): boolean {
    if (!this.validateExecutionContext(context)) {
      return false;
    }

    console.log(`Starting test execution: ${context.executionId}`);
    context.startTime = new Date();
    return true;
  }

  /**
   * Cancel execution before it starts
   */
  private cancelExecution(context: TestExecutionContext): boolean {
    console.log(`Cancelling test execution: ${context.executionId}`);
    return true;
  }

  /**
   * Validate execution context
   */
  private validateExecutionContext(context: TestExecutionContext): boolean {
    if (!context.executionId) {
      console.error('Missing execution ID');
      return false;
    }
    if (!context.sandboxId) {
      console.error('Missing sandbox ID');
      return false;
    }
    if (!context.testSuiteId) {
      console.error('Missing test suite ID');
      return false;
    }
    return true;
  }

  /**
   * Cleanup idle state
   */
  shutdown(context: TestExecutionContext): void {
    console.log(`Shutting down idle state for: ${context.executionId}`);
  }

  /**
   * Check state invariants
   */
  checkInvariants(context: TestExecutionContext): boolean {
    return context.results.length === 0 && context.errors.length === 0;
  }
}