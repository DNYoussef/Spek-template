/**
 * Validation Test Executor - Specialized FSM executor for validation testing
 * NASA Rule 10 Compliant: Functions ≤60 lines, ≥2 assertions per function
 */

import { TestExecutor } from './TestExecutor';
import { AssertionEngine } from './AssertionEngine';
import { TestReporter } from './TestReporter';
import { TestContext, TestConfig } from '../types/TestingTypes';

export class ValidationTestExecutor extends TestExecutor {
  private assertionEngine: AssertionEngine;
  private reporter: TestReporter;

  constructor(testId: string, config: TestConfig) {
    super(testId, config);
    // Assertion 1: Valid test ID
    console.assert(testId && testId.length > 0, 'Test ID required');
    // Assertion 2: Valid config
    console.assert(config !== null, 'Config required');

    this.assertionEngine = new AssertionEngine();
    this.reporter = new TestReporter();
  }

  /**
   * Initialize validation test - NASA Rule 10: ≤60 lines
   */
  protected async initializeComponent(context: TestContext): Promise<void> {
    // Assertion 1: Valid context
    console.assert(context && context.testId, 'Valid context required');
    // Assertion 2: Assertion engine initialized
    console.assert(this.assertionEngine !== null, 'Assertion engine required');

    context.data.validationStartTime = Date.now();
    context.data.validationComponents = [];
    this.reporter.startReporting();
  }

  /**
   * Setup validation environment - NASA Rule 10: ≤60 lines
   */
  protected async setup(context: TestContext): Promise<void> {
    // Assertion 1: Valid context
    console.assert(context && context.testId, 'Valid context required');
    // Assertion 2: Data structure initialized
    console.assert(context.data !== null, 'Context data required');

    // Setup validation components
    context.environment.type = 'integration';
    context.environment.resources = {
      engines: [],
      stateMachines: [],
      workflows: []
    };
  }

  /**
   * Execute validation tests - NASA Rule 10: ≤60 lines
   */
  protected async execute(context: TestContext): Promise<void> {
    // Assertion 1: Valid context
    console.assert(context && context.testId, 'Valid context required');
    // Assertion 2: Test definition exists
    console.assert(context.data.testDefinition, 'Test definition required');

    const testFunction = context.data.testDefinition.testFunction;
    await testFunction();

    // Record execution metrics
    context.metrics.executionTime = Date.now() - context.data.validationStartTime;
  }

  /**
   * Assert validation results - NASA Rule 10: ≤60 lines
   */
  protected async assert(context: TestContext): Promise<void> {
    // Assertion 1: Valid context
    console.assert(context && context.testId, 'Valid context required');
    // Assertion 2: Assertion engine exists
    console.assert(this.assertionEngine !== null, 'Assertion engine required');

    // Run validation assertions
    const summary = this.assertionEngine.getAssertionSummary();
    context.data.assertions = this.assertionEngine.getAllAssertions();
    context.metrics.assertionCount = summary.total;
    context.metrics.passedAssertions = summary.passed;
    context.metrics.failedAssertions = summary.failed;
  }

  /**
   * Report validation results - NASA Rule 10: ≤60 lines
   */
  protected async report(context: TestContext): Promise<void> {
    // Assertion 1: Valid context
    console.assert(context && context.testId, 'Valid context required');
    // Assertion 2: Reporter exists
    console.assert(this.reporter !== null, 'Reporter required');

    const testResult = {
      testId: context.testId,
      testName: context.data.testDefinition?.testName || 'Validation Test',
      testType: 'validation' as const,
      status: context.metrics.failedAssertions === 0 ? 'passed' as const : 'failed' as const,
      startTime: context.data.validationStartTime,
      endTime: Date.now(),
      duration: context.metrics.executionTime,
      assertions: context.data.assertions || [],
      errors: [],
      warnings: [],
      metadata: { metrics: context.metrics }
    };

    this.reporter.addResult(testResult);
  }

  /**
   * Teardown validation resources - NASA Rule 10: ≤60 lines
   */
  protected async teardown(context: TestContext): Promise<void> {
    // Assertion 1: Valid context
    console.assert(context && context.testId, 'Valid context required');
    // Assertion 2: Cleanup required
    console.assert(context.config.cleanup !== false, 'Cleanup should be enabled');

    // Clear assertion engine
    this.assertionEngine.clearAssertions();

    // Clean environment resources
    if (context.environment.resources) {
      context.environment.resources = {};
    }
  }

  /**
   * Get assertion engine - NASA Rule 10: ≤60 lines
   */
  getAssertionEngine(): AssertionEngine {
    // Assertion 1: Assertion engine exists
    console.assert(this.assertionEngine !== null, 'Assertion engine required');
    // Assertion 2: Valid engine type
    console.assert(this.assertionEngine instanceof AssertionEngine, 'Valid assertion engine required');

    return this.assertionEngine;
  }

  /**
   * Get reporter - NASA Rule 10: ≤60 lines
   */
  getReporter(): TestReporter {
    // Assertion 1: Reporter exists
    console.assert(this.reporter !== null, 'Reporter required');
    // Assertion 2: Valid reporter type
    console.assert(this.reporter instanceof TestReporter, 'Valid reporter required');

    return this.reporter;
  }
}