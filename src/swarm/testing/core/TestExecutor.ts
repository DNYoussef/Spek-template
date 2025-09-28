/**
 * Test Executor - Manages test execution with FSM lifecycle
 * NASA Rule 10 Compliant - Functions ≤60 lines
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { TestExecutionTransitionHub } from '../fsm/TestExecutionTransitionHub';
import { TestExecutionContext, TestExecutionEvent, ExecutionOptions } from '../fsm/TestExecutionStates';
import { IdleState } from '../states/IdleState';
import { InitializingState } from '../states/InitializingState';
import { RunningState } from '../states/RunningState';

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: Test[];
  setup: SetupConfiguration;
  teardown: TeardownConfiguration;
  timeout: number;
  parallelExecution: boolean;
}

export interface Test {
  id: string;
  name: string;
  description: string;
  type: 'unit' | 'integration' | 'e2e' | 'security' | 'performance';
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeout: number;
  retryCount: number;
}

interface SetupConfiguration {
  commands: TestCommand[];
  timeout: number;
  retryOnFailure: boolean;
}

interface TeardownConfiguration {
  commands: TestCommand[];
  timeout: number;
  force: boolean;
}

interface TestCommand {
  command: string;
  args: string[];
  workingDirectory: string;
  environment: Record<string, string>;
  timeout: number;
}

export class TestExecutor extends EventEmitter {
  private transitionHub: TestExecutionTransitionHub;
  private testSuites: Map<string, TestSuite> = new Map();
  private states: Map<string, any> = new Map();

  constructor() {
    super();
    this.transitionHub = new TestExecutionTransitionHub();
    this.initializeStates();
    this.setupEventHandlers();
  }

  /**
   * Initialize state machines
   */
  private initializeStates(): void {
    this.states.set('idle', new IdleState());
    this.states.set('initializing', new InitializingState());
    this.states.set('running', new RunningState());
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.transitionHub.on('stateChanged', this.handleStateChange.bind(this));
  }

  /**
   * Execute test suite in sandbox
   */
  async executeTestSuite(
    sandboxId: string,
    testSuiteId: string,
    options: ExecutionOptions = {}
  ): Promise<string> {
    const executionId = crypto.randomUUID();
    const context = this.createExecutionContext(executionId, sandboxId, testSuiteId, options);

    this.transitionHub.registerExecution(context);
    await this.startExecution(executionId);

    return executionId;
  }

  /**
   * Create execution context
   */
  private createExecutionContext(
    executionId: string,
    sandboxId: string,
    testSuiteId: string,
    options: ExecutionOptions
  ): TestExecutionContext {
    return {
      executionId,
      sandboxId,
      testSuiteId,
      options,
      results: [],
      errors: [],
      startTime: new Date()
    };
  }

  /**
   * Start test execution
   */
  private async startExecution(executionId: string): Promise<void> {
    await this.transitionHub.handleTransition(executionId, TestExecutionEvent.START_EXECUTION);
  }

  /**
   * Handle state changes
   */
  private handleStateChange(event: any): void {
    console.log(`State change: ${event.from} -> ${event.to} (${event.executionId})`);

    this.emit('execution:stateChanged', {
      executionId: event.executionId,
      state: event.to,
      previousState: event.from
    });
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): any {
    const state = this.transitionHub.getCurrentState(executionId);
    const context = this.transitionHub.getContext(executionId);

    if (!state || !context) {
      return null;
    }

    return {
      executionId,
      state,
      testSuiteId: context.testSuiteId,
      sandboxId: context.sandboxId,
      startTime: context.startTime,
      endTime: context.endTime,
      results: context.results,
      errors: context.errors
    };
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    await this.transitionHub.handleTransition(executionId, TestExecutionEvent.CANCEL_EXECUTION);
  }

  /**
   * Register test suite
   */
  registerTestSuite(testSuite: TestSuite): void {
    this.testSuites.set(testSuite.id, testSuite);
    console.log(`Registered test suite: ${testSuite.name}`);
  }

  /**
   * Get test suite
   */
  getTestSuite(testSuiteId: string): TestSuite | undefined {
    return this.testSuites.get(testSuiteId);
  }

  /**
   * List registered test suites
   */
  listTestSuites(): TestSuite[] {
    return Array.from(this.testSuites.values());
  }

  /**
   * Create built-in test suites
   */
  initializeBuiltInTestSuites(): void {
    const suites = [
      this.createUnitTestSuite(),
      this.createIntegrationTestSuite(),
      this.createSecurityTestSuite()
    ];

    suites.forEach(suite => this.registerTestSuite(suite));
    console.log(`Initialized ${suites.length} built-in test suites`);
  }

  /**
   * Create unit test suite
   */
  private createUnitTestSuite(): TestSuite {
    return {
      id: 'unit-test-suite',
      name: 'Unit Test Suite',
      description: 'Comprehensive unit testing',
      tests: [{
        id: 'unit-test-1',
        name: 'Component Unit Tests',
        description: 'Test individual components',
        type: 'unit',
        priority: 'high',
        timeout: 60000,
        retryCount: 2
      }],
      setup: { commands: [], timeout: 30000, retryOnFailure: false },
      teardown: { commands: [], timeout: 30000, force: false },
      timeout: 300000,
      parallelExecution: true
    };
  }

  /**
   * Create integration test suite
   */
  private createIntegrationTestSuite(): TestSuite {
    return {
      id: 'integration-test-suite',
      name: 'Integration Test Suite',
      description: 'Integration testing for multiple components',
      tests: [{
        id: 'integration-test-1',
        name: 'System Integration Tests',
        description: 'Test system integration',
        type: 'integration',
        priority: 'high',
        timeout: 120000,
        retryCount: 1
      }],
      setup: { commands: [], timeout: 60000, retryOnFailure: false },
      teardown: { commands: [], timeout: 30000, force: false },
      timeout: 600000,
      parallelExecution: false
    };
  }

  /**
   * Create security test suite
   */
  private createSecurityTestSuite(): TestSuite {
    return {
      id: 'security-test-suite',
      name: 'Security Test Suite',
      description: 'Security vulnerability testing',
      tests: [{
        id: 'security-test-1',
        name: 'Security Scan',
        description: 'Comprehensive security scanning',
        type: 'security',
        priority: 'critical',
        timeout: 120000,
        retryCount: 0
      }],
      setup: { commands: [], timeout: 30000, retryOnFailure: false },
      teardown: { commands: [], timeout: 30000, force: false },
      timeout: 300000,
      parallelExecution: false
    };
  }

  /**
   * Cleanup execution
   */
  cleanupExecution(executionId: string): void {
    this.transitionHub.cleanupExecution(executionId);
  }
}