/**
 * Test Executor Base Class - NASA Rule 10 Compliant
 * Shared test execution logic with FSM state management
 */

import { EventEmitter } from 'events';
import { TestTransitionHub } from '../fsm/TestTransitionHub';
import {
  TestState,
  TestEvent,
  TestContext,
  TestResult,
  TestDefinition,
  TestConfig
} from '~types/TestingTypes';

export abstract class TestExecutor extends EventEmitter {
  protected transitionHub: TestTransitionHub;
  protected context: TestContext;
  protected startTime: number = 0;
  protected timeoutHandle?: NodeJS.Timeout;

  constructor(testId: string, config: TestConfig) {
    super();
    // Assertion 1: Valid test ID
    console.assert(testId && testId.length > 0, 'Test ID required');
    // Assertion 2: Valid config
    console.assert(config !== null, 'Test config required');

    this.transitionHub = new TestTransitionHub();
    this.context = this.createTestContext(testId, config);
    this.setupStateActions();
  }

  /**
   * Create test context - NASA Rule 10: ≤60 lines
   */
  private createTestContext(testId: string, config: TestConfig): TestContext {
    // Assertion 1: Valid test ID
    console.assert(testId && testId.length > 0, 'Test ID required');
    // Assertion 2: Valid config
    console.assert(config !== null, 'Config required');

    return {
      testId,
      currentState: TestState.IDLE,
      config,
      environment: {
        type: 'local',
        resources: {},
        constraints: {}
      },
      data: {},
      metrics: {
        executionTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        assertionCount: 0,
        passedAssertions: 0,
        failedAssertions: 0
      }
    };
  }

  /**
   * Setup FSM state actions - NASA Rule 10: ≤60 lines
   */
  private setupStateActions(): void {
    // Assertion 1: Transition hub initialized
    console.assert(this.transitionHub !== null, 'Transition hub required');
    // Assertion 2: Context initialized
    console.assert(this.context !== null, 'Context required');

    this.transitionHub.addStateAction(TestState.INITIALIZING, async (ctx) => {
      await this.initialize(ctx);
    });

    this.transitionHub.addStateAction(TestState.SETUP, async (ctx) => {
      await this.setup(ctx);
    });

    this.transitionHub.addStateAction(TestState.EXECUTING, async (ctx) => {
      await this.execute(ctx);
    });

    this.transitionHub.addStateAction(TestState.ASSERTING, async (ctx) => {
      await this.assert(ctx);
    });

    this.transitionHub.addStateAction(TestState.REPORTING, async (ctx) => {
      await this.report(ctx);
    });

    this.transitionHub.addStateAction(TestState.TEARDOWN, async (ctx) => {
      await this.teardown(ctx);
    });
  }

  /**
   * Execute test with FSM state management - NASA Rule 10: ≤60 lines
   */
  async executeTest(testDefinition: TestDefinition): Promise<TestResult> {
    // Assertion 1: Valid test definition
    console.assert(testDefinition && testDefinition.testId, 'Test definition required');
    // Assertion 2: Test function exists
    console.assert(typeof testDefinition.testFunction === 'function', 'Test function required');

    this.startTime = Date.now();
    this.context.data.testDefinition = testDefinition;

    try {
      // Setup timeout
      if (testDefinition.timeout > 0) {
        this.timeoutHandle = setTimeout(() => {
          this.handleTimeout();
        }, testDefinition.timeout);
      }

      // Execute FSM transitions
      await this.transitionHub.transition(this.context, TestEvent.START);
      await this.transitionHub.transition(this.context, TestEvent.SETUP_COMPLETE);
      await this.transitionHub.transition(this.context, TestEvent.EXECUTION_COMPLETE);
      await this.transitionHub.transition(this.context, TestEvent.ASSERTION_COMPLETE);
      await this.transitionHub.transition(this.context, TestEvent.REPORT_COMPLETE);
      await this.transitionHub.transition(this.context, TestEvent.TEARDOWN_COMPLETE);

      return this.createTestResult('passed');

    } catch (error) {
      await this.handleError(error);
      return this.createTestResult('failed', error as Error);

    } finally {
      if (this.timeoutHandle) {
        clearTimeout(this.timeoutHandle);
      }
    }
  }

  /**
   * Handle test timeout - NASA Rule 10: ≤60 lines
   */
  private async handleTimeout(): Promise<void> {
    // Assertion 1: Context exists
    console.assert(this.context !== null, 'Context required');
    // Assertion 2: Not already completed
    console.assert(this.context.currentState !== TestState.COMPLETED, 'Test not completed');

    try {
      await this.transitionHub.transition(this.context, TestEvent.TIMEOUT_OCCURRED);
      this.emit('timeout', this.context);
    } catch (error) {
      console.error('Error handling timeout:', error);
    }
  }

  /**
   * Handle test error - NASA Rule 10: ≤60 lines
   */
  private async handleError(error: any): Promise<void> {
    // Assertion 1: Context exists
    console.assert(this.context !== null, 'Context required');
    // Assertion 2: Error occurred
    console.assert(error !== null, 'Error required');

    try {
      await this.transitionHub.transition(this.context, TestEvent.ERROR_OCCURRED);
      this.emit('error', { error, context: this.context });
    } catch (transitionError) {
      console.error('Error in error handling:', transitionError);
    }
  }

  /**
   * Create test result - NASA Rule 10: ≤60 lines
   */
  private createTestResult(status: 'passed' | 'failed' | 'timeout' | 'error', error?: Error): TestResult {
    // Assertion 1: Valid status
    console.assert(['passed', 'failed', 'timeout', 'error'].includes(status), 'Valid status required');
    // Assertion 2: Context exists
    console.assert(this.context !== null, 'Context required');

    const endTime = Date.now();
    const testDef = this.context.data.testDefinition;

    return {
      testId: this.context.testId,
      testName: testDef?.testName || 'Unknown',
      testType: 'unit',
      status,
      startTime: this.startTime,
      endTime,
      duration: endTime - this.startTime,
      assertions: this.context.data.assertions || [],
      errors: error ? [error.message] : [],
      warnings: this.context.data.warnings || [],
      metadata: {
        state: this.context.currentState,
        metrics: this.context.metrics
      }
    };
  }

  // Abstract methods to be implemented by subclasses
  protected abstract initializeComponent(context: TestContext): Promise<void>;
  protected abstract setup(context: TestContext): Promise<void>;
  protected abstract execute(context: TestContext): Promise<void>;
  protected abstract assert(context: TestContext): Promise<void>;
  protected abstract report(context: TestContext): Promise<void>;
  protected abstract teardown(context: TestContext): Promise<void>;
}