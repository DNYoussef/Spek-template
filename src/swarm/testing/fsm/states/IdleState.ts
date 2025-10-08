/**
 * Idle State for Integration Testing FSM
 * NASA Rule 10 Compliant State Implementation
 */

import {
  IntegrationTestState,
  IntegrationTestEvent,
  IntegrationTestContext,
  INTEGRATION_TEST_FSM_CONSTANTS
} from '../IntegrationTestFSM.types';

export interface IIntegrationTestState {
  enter(context: IntegrationTestContext): Promise<void>;
  update(context: IntegrationTestContext): Promise<void>;
  exit(context: IntegrationTestContext): Promise<void>;
  handleEvent(event: IntegrationTestEvent, context: IntegrationTestContext): Promise<IntegrationTestState | null>;
  checkInvariants(context: IntegrationTestContext): boolean;
}

export class IdleState implements IIntegrationTestState {
  private readonly stateName = IntegrationTestState.IDLE;

  /**
   * Enter idle state - initialize basic state
   */
  async enter(context: IntegrationTestContext): Promise<void> {
    console.log(`[IdleState] Entering idle state for suite: ${context.suiteId || 'unknown'}`);

    // Reset context to clean state
    context.currentTestIndex = 0;
    context.activeTests.clear();
    context.results = [];
    context.passingTests = 0;
    context.failingTests = 0;
    context.timeoutTests = 0;
    context.errorTests = 0;
    context.executionQueue = [];

    // Validate initial state
    if (!this.checkInvariants(context)) {
      throw new Error('Idle state invariants violated during entry');
    }
  }

  /**
   * Update idle state - perform periodic checks
   */
  async update(context: IntegrationTestContext): Promise<void> {
    // Idle state has minimal update logic
    // Check if we have a valid suite to potentially start
    if (context.suiteId && context.totalTests > 0) {
      console.log(`[IdleState] Ready to start testing suite: ${context.suiteId} (${context.totalTests} tests)`);
    }

    // Perform invariant checks
    if (!this.checkInvariants(context)) {
      throw new Error('Idle state invariants violated during update');
    }
  }

  /**
   * Exit idle state - prepare for initialization
   */
  async exit(context: IntegrationTestContext): Promise<void> {
    console.log(`[IdleState] Exiting idle state, preparing for initialization`);

    // Set start time for suite execution
    context.startTime = Date.now();

    // Set default max execution time if not set
    if (!context.maxExecutionTime) {
      context.maxExecutionTime = INTEGRATION_TEST_FSM_CONSTANTS.MAX_TEST_SUITE_DURATION_MS;
    }

    // Final invariant check before exit
    if (!this.checkInvariants(context)) {
      throw new Error('Idle state invariants violated during exit');
    }
  }

  /**
   * Handle events in idle state
   */
  async handleEvent(
    event: IntegrationTestEvent,
    context: IntegrationTestContext
  ): Promise<IntegrationTestState | null> {
    switch (event) {
      case IntegrationTestEvent.START_TESTING:
        // Validate we can start testing
        if (this.canStartTesting(context)) {
          console.log(`[IdleState] Handling START_TESTING event, transitioning to INITIALIZING`);
          return IntegrationTestState.INITIALIZING;
        } else {
          console.warn(`[IdleState] Cannot start testing - preconditions not met`);
          return null;
        }

      case IntegrationTestEvent.RESET:
        // Already in idle state, no transition needed
        console.log(`[IdleState] Handling RESET event - already in idle state`);
        await this.enter(context); // Re-initialize
        return null;

      default:
        console.warn(`[IdleState] Unhandled event: ${event}`);
        return null;
    }
  }

  /**
   * Check state invariants
   */
  checkInvariants(context: IntegrationTestContext): boolean {
    const checks = [
      // No active tests in idle state
      context.activeTests.size === 0,

      // Test index should be reset
      context.currentTestIndex === 0,

      // No pending results in idle state
      context.results.length === 0,

      // Counters should be reset
      context.passingTests === 0,
      context.failingTests === 0,
      context.timeoutTests === 0,
      context.errorTests === 0,

      // Execution queue should be empty
      context.executionQueue.length === 0
    ];

    const allValid = checks.every(check => check);

    if (!allValid) {
      console.error(`[IdleState] Invariant violation detected:`, {
        activeTests: context.activeTests.size,
        currentTestIndex: context.currentTestIndex,
        resultsLength: context.results.length,
        passingTests: context.passingTests,
        failingTests: context.failingTests,
        timeoutTests: context.timeoutTests,
        errorTests: context.errorTests,
        executionQueueLength: context.executionQueue.length
      });
    }

    return allValid;
  }

  /**
   * Check if we can start testing from idle state
   */
  private canStartTesting(context: IntegrationTestContext): boolean {
    return !!(
      context.suiteId &&
      context.totalTests > 0 &&
      context.totalTests <= INTEGRATION_TEST_FSM_CONSTANTS.MAX_TEST_ITERATIONS &&
      this.checkInvariants(context)
    );
  }

  /**
   * Get current state name
   */
  getStateName(): IntegrationTestState {
    return this.stateName;
  }

  /**
   * Get state description
   */
  getStateDescription(): string {
    return 'Idle state - awaiting test suite initialization';
  }

  /**
   * Get valid transitions from this state
   */
  getValidTransitions(): Array<{ event: IntegrationTestEvent; toState: IntegrationTestState }> {
    return [
      { event: IntegrationTestEvent.START_TESTING, toState: IntegrationTestState.INITIALIZING },
      { event: IntegrationTestEvent.RESET, toState: IntegrationTestState.IDLE }
    ];
  }

  /**
   * Validate context for this state
   */
  validateContext(context: IntegrationTestContext): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!context.suiteId) {
      errors.push('Suite ID is required');
    }

    if (context.totalTests <= 0) {
      errors.push('Total tests must be greater than 0');
    }

    if (context.totalTests > INTEGRATION_TEST_FSM_CONSTANTS.MAX_TEST_ITERATIONS) {
      errors.push(`Total tests exceeds maximum allowed: ${INTEGRATION_TEST_FSM_CONSTANTS.MAX_TEST_ITERATIONS}`);
    }

    if (!this.checkInvariants(context)) {
      errors.push('State invariants violated');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: integration-idle-state-001
// inputs: ["IntegrationTestFSM.types.ts"]
// tools_used: ["Write"]
// versions: {"model":"Sonnet4","prompt":"fsm-first-integration"}
// === END FOOTER ===

// Backward compatibility
export default IdleState;
