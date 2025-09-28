/**
 * Running Basic Tests State for Integration Testing FSM
 * NASA Rule 10 Compliant State Implementation
 */

import {
  IntegrationTestState,
  IntegrationTestEvent,
  IntegrationTestContext,
  INTEGRATION_TEST_FSM_CONSTANTS
} from '../IntegrationTestFSM.types';
import { IIntegrationTestState } from './IdleState';
import { TestResult, IntegrationTest } from '../../CrossDomainIntegrationTester';

export class RunningBasicTestsState implements IIntegrationTestState {
  private readonly stateName = IntegrationTestState.RUNNING_BASIC_TESTS;
  private basicTestsExecuted = 0;
  private readonly maxBasicTests = 10; // Fixed limit for NASA Rule 10

  /**
   * Enter running basic tests state
   */
  async enter(context: IntegrationTestContext): Promise<void> {
    console.log(`[RunningBasicTestsState] Entering basic tests execution for suite: ${context.suiteId}`);

    // Reset basic test tracking
    this.basicTestsExecuted = 0;

    // Filter basic tests from execution queue
    const basicTests = this.filterBasicTests(context);
    console.log(`[RunningBasicTestsState] Found ${basicTests.length} basic tests to execute`);

    // Validate we can execute basic tests
    if (!this.checkInvariants(context)) {
      throw new Error('Running basic tests state invariants violated during entry');
    }

    // Start executing basic tests with bounded iteration
    await this.executeBasicTestsBounded(basicTests, context);
  }

  /**
   * Update running basic tests state
   */
  async update(context: IntegrationTestContext): Promise<void> {
    // Check execution progress
    const basicTestResults = this.getBasicTestResults(context);
    const completedTests = basicTestResults.length;
    const totalBasicTests = this.getBasicTestCount(context);

    console.log(`[RunningBasicTestsState] Progress: ${completedTests}/${totalBasicTests} basic tests completed`);

    // Check for timeout violations
    const executionTime = Date.now() - context.startTime;
    if (executionTime > INTEGRATION_TEST_FSM_CONSTANTS.MAX_SINGLE_TEST_DURATION_MS * totalBasicTests) {
      throw new Error('Basic tests execution timeout exceeded');
    }

    // Validate state invariants
    if (!this.checkInvariants(context)) {
      throw new Error('Running basic tests state invariants violated during update');
    }
  }

  /**
   * Exit running basic tests state
   */
  async exit(context: IntegrationTestContext): Promise<void> {
    console.log(`[RunningBasicTestsState] Exiting basic tests state`);

    const basicTestResults = this.getBasicTestResults(context);
    const passedTests = basicTestResults.filter(r => r.status === 'passed').length;
    const totalBasicTests = basicTestResults.length;

    console.log(`[RunningBasicTestsState] Basic tests summary: ${passedTests}/${totalBasicTests} passed`);

    // Update context counters
    this.updateContextCounters(context, basicTestResults);

    // Final invariant check
    if (!this.checkInvariants(context)) {
      throw new Error('Running basic tests state invariants violated during exit');
    }
  }

  /**
   * Handle events in running basic tests state
   */
  async handleEvent(
    event: IntegrationTestEvent,
    context: IntegrationTestContext
  ): Promise<IntegrationTestState | null> {
    switch (event) {
      case IntegrationTestEvent.BASIC_TESTS_COMPLETE:
        console.log(`[RunningBasicTestsState] Handling BASIC_TESTS_COMPLETE event`);

        if (this.areBasicTestsComplete(context)) {
          return IntegrationTestState.RUNNING_CONSENSUS_TESTS;
        } else {
          console.warn(`[RunningBasicTestsState] Basic tests not yet complete`);
          return null;
        }

      case IntegrationTestEvent.ERROR_OCCURRED:
        console.error(`[RunningBasicTestsState] Error occurred during basic tests`);
        return IntegrationTestState.ERROR;

      case IntegrationTestEvent.CLEANUP_REQUESTED:
        console.log(`[RunningBasicTestsState] Cleanup requested, transitioning to cleanup`);
        return IntegrationTestState.CLEANUP;

      default:
        console.warn(`[RunningBasicTestsState] Unhandled event: ${event}`);
        return null;
    }
  }

  /**
   * Check state invariants
   */
  checkInvariants(context: IntegrationTestContext): boolean {
    const checks = [
      // Should have active tests or completed tests
      context.activeTests.size > 0 || context.results.length > 0,

      // Test index should be progressing
      context.currentTestIndex >= 0,

      // Execution time should be within bounds
      (Date.now() - context.startTime) <= context.maxExecutionTime,

      // Basic tests executed should not exceed limit
      this.basicTestsExecuted <= this.maxBasicTests,

      // Should have a valid suite
      context.currentSuite != null
    ];

    const allValid = checks.every(check => check);

    if (!allValid) {
      console.error(`[RunningBasicTestsState] Invariant violation detected:`, {
        activeTests: context.activeTests.size,
        resultsLength: context.results.length,
        currentTestIndex: context.currentTestIndex,
        executionTime: Date.now() - context.startTime,
        maxExecutionTime: context.maxExecutionTime,
        basicTestsExecuted: this.basicTestsExecuted,
        maxBasicTests: this.maxBasicTests,
        hasSuite: context.currentSuite != null
      });
    }

    return allValid;
  }

  /**
   * Execute basic tests with bounded iteration (NASA Rule 10)
   */
  private async executeBasicTestsBounded(
    basicTests: Array<() => Promise<TestResult>>,
    context: IntegrationTestContext
  ): Promise<void> {
    const maxIterations = Math.min(basicTests.length, this.maxBasicTests);

    // Fixed-loop execution for NASA Rule 10 compliance
    for (let i = 0; i < maxIterations; i++) {
      if (this.basicTestsExecuted >= this.maxBasicTests) {
        console.log(`[RunningBasicTestsState] Reached maximum basic tests limit: ${this.maxBasicTests}`);
        break;
      }

      try {
        console.log(`[RunningBasicTestsState] Executing basic test ${i + 1}/${maxIterations}`);

        const testResult = await basicTests[i]();
        context.results.push(testResult);

        this.basicTestsExecuted++;
        context.currentTestIndex++;

        // Check timeout for each test
        const testExecutionTime = Date.now() - context.startTime;
        if (testExecutionTime > INTEGRATION_TEST_FSM_CONSTANTS.MAX_SINGLE_TEST_DURATION_MS) {
          console.warn(`[RunningBasicTestsState] Test execution time exceeded for test ${i + 1}`);
          break;
        }

      } catch (error) {
        console.error(`[RunningBasicTestsState] Error executing basic test ${i + 1}:`, error);

        // Create error result
        const errorResult: TestResult = {
          testId: `basic-test-${i + 1}`,
          startTime: Date.now(),
          endTime: Date.now(),
          duration: 0,
          status: 'error',
          actualOutcome: null,
          errorDetails: error.message || 'Unknown error',
          performanceMetrics: {
            latency: 0,
            throughput: 0,
            memoryUsage: 0,
            contextIntegrity: 0
          },
          integrationPoints: []
        };

        context.results.push(errorResult);
        this.basicTestsExecuted++;
        context.currentTestIndex++;
      }
    }

    console.log(`[RunningBasicTestsState] Completed ${this.basicTestsExecuted} basic tests`);
  }

  /**
   * Filter basic tests from context
   */
  private filterBasicTests(context: IntegrationTestContext): Array<() => Promise<TestResult>> {
    // Filter execution queue for basic tests
    return context.executionQueue.filter((_, index) => {
      // Assuming first portion of tests are basic tests
      return index < this.maxBasicTests;
    });
  }

  /**
   * Get basic test results
   */
  private getBasicTestResults(context: IntegrationTestContext): TestResult[] {
    return context.results.filter(result =>
      result.testId.includes('basic-') ||
      result.testId.includes('handoff') ||
      result.testId.includes('communication')
    );
  }

  /**
   * Get basic test count
   */
  private getBasicTestCount(context: IntegrationTestContext): number {
    return Math.min(context.totalTests, this.maxBasicTests);
  }

  /**
   * Check if basic tests are complete
   */
  private areBasicTestsComplete(context: IntegrationTestContext): boolean {
    const basicTestResults = this.getBasicTestResults(context);
    const expectedBasicTests = this.getBasicTestCount(context);

    return basicTestResults.length >= expectedBasicTests &&
           this.basicTestsExecuted >= expectedBasicTests;
  }

  /**
   * Update context counters
   */
  private updateContextCounters(context: IntegrationTestContext, basicTestResults: TestResult[]): void {
    const passed = basicTestResults.filter(r => r.status === 'passed').length;
    const failed = basicTestResults.filter(r => r.status === 'failed').length;
    const timeout = basicTestResults.filter(r => r.status === 'timeout').length;
    const error = basicTestResults.filter(r => r.status === 'error').length;

    context.passingTests += passed;
    context.failingTests += failed;
    context.timeoutTests += timeout;
    context.errorTests += error;
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
    return `Running basic tests state - ${this.basicTestsExecuted}/${this.maxBasicTests} tests executed`;
  }

  /**
   * Get valid transitions from this state
   */
  getValidTransitions(): Array<{ event: IntegrationTestEvent; toState: IntegrationTestState }> {
    return [
      { event: IntegrationTestEvent.BASIC_TESTS_COMPLETE, toState: IntegrationTestState.RUNNING_CONSENSUS_TESTS },
      { event: IntegrationTestEvent.ERROR_OCCURRED, toState: IntegrationTestState.ERROR },
      { event: IntegrationTestEvent.CLEANUP_REQUESTED, toState: IntegrationTestState.CLEANUP }
    ];
  }

  /**
   * Get execution progress
   */
  getExecutionProgress(): { completed: number; total: number; percentage: number } {
    const total = this.maxBasicTests;
    const completed = this.basicTestsExecuted;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return { completed, total, percentage };
  }

  /**
   * Reset state for reuse
   */
  reset(): void {
    this.basicTestsExecuted = 0;
  }
}

export default RunningBasicTestsState;

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T16:03:15-04:00 | agent@Sonnet4 | Created RunningBasicTestsState with bounded execution and NASA Rule 10 compliance | RunningBasicTestsState.ts | OK | Fixed-loop basic test execution | 0.00 | c4f7a9e |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: integration-basic-state-001
- inputs: ["IntegrationTestFSM.types.ts", "IdleState.ts"]
- tools_used: ["Write"]
- versions: {"model":"Sonnet4","prompt":"fsm-first-integration"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->