/**
 * Unified Testing Types - Shared across all testing frameworks
 * NASA Rule 10 Compliant: Clean interfaces, no recursion
 */

export enum TestState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  SETUP = 'setup',
  EXECUTING = 'executing',
  ASSERTING = 'asserting',
  REPORTING = 'reporting',
  TEARDOWN = 'teardown',
  COMPLETED = 'completed',
  ERROR = 'error',
  TIMEOUT = 'timeout'
}

export enum TestEvent {
  START = 'start',
  SETUP_COMPLETE = 'setup_complete',
  EXECUTION_COMPLETE = 'execution_complete',
  ASSERTION_COMPLETE = 'assertion_complete',
  REPORT_COMPLETE = 'report_complete',
  TEARDOWN_COMPLETE = 'teardown_complete',
  ERROR_OCCURRED = 'error_occurred',
  TIMEOUT_OCCURRED = 'timeout_occurred',
  RESET = 'reset'
}

export interface TestResult {
  testId: string;
  testName: string;
  testType: 'unit' | 'integration' | 'validation' | 'mece' | 'sandbox';
  status: 'passed' | 'failed' | 'timeout' | 'error' | 'skipped';
  startTime: number;
  endTime: number;
  duration: number;
  assertions: TestAssertion[];
  errors: string[];
  warnings: string[];
  metadata: Record<string, any>;
}

export interface TestAssertion {
  id: string;
  description: string;
  expected: any;
  actual: any;
  passed: boolean;
  errorMessage?: string;
}

export interface TestContext {
  testId: string;
  currentState: TestState;
  config: TestConfig;
  environment: TestEnvironment;
  data: Record<string, any>;
  metrics: TestMetrics;
}

export interface TestConfig {
  timeout: number;
  retries: number;
  parallel: boolean;
  strictMode: boolean;
  cleanup: boolean;
}

export interface TestEnvironment {
  type: 'local' | 'sandbox' | 'integration';
  resources: Record<string, any>;
  constraints: Record<string, any>;
}

export interface TestMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  assertionCount: number;
  passedAssertions: number;
  failedAssertions: number;
}

export interface TestSuite {
  suiteId: string;
  suiteName: string;
  tests: TestDefinition[];
  config: TestConfig;
  dependencies: string[];
}

export interface TestDefinition {
  testId: string;
  testName: string;
  testFunction: () => Promise<void>;
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  dependencies: string[];
  timeout: number;
}