/**
 * Test Execution FSM States
 * NASA Rule 10 Compliant - Functions ≤60 lines
 */

export enum TestExecutionState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  SETUP = 'setup',
  RUNNING = 'running',
  TEARDOWN = 'teardown',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TestExecutionEvent {
  START_EXECUTION = 'start_execution',
  SETUP_COMPLETE = 'setup_complete',
  START_TESTS = 'start_tests',
  TESTS_COMPLETE = 'tests_complete',
  START_TEARDOWN = 'start_teardown',
  TEARDOWN_COMPLETE = 'teardown_complete',
  EXECUTION_FAILED = 'execution_failed',
  CANCEL_EXECUTION = 'cancel_execution'
}

export interface TestExecutionContext {
  executionId: string;
  sandboxId: string;
  testSuiteId: string;
  options: ExecutionOptions;
  results: TestResult[];
  errors: Error[];
  startTime: Date;
  endTime?: Date;
}

export interface ExecutionOptions {
  timeout?: number;
  parallel?: boolean;
  retryOnFailure?: boolean;
  stopOnCriticalFailure?: boolean;
}

export interface TestResult {
  testId: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  output: string;
  error?: string;
}

export interface StateTransition {
  from: TestExecutionState;
  event: TestExecutionEvent;
  to: TestExecutionState;
  guard?: (context: TestExecutionContext) => boolean;
  action?: (context: TestExecutionContext) => Promise<void>;
}

export const TEST_EXECUTION_TRANSITIONS: StateTransition[] = [
  {
    from: TestExecutionState.IDLE,
    event: TestExecutionEvent.START_EXECUTION,
    to: TestExecutionState.INITIALIZING,
    action: async (ctx) => {
      ctx.startTime = new Date();
      console.log(`Starting test execution: ${ctx.executionId}`);
    }
  },
  {
    from: TestExecutionState.INITIALIZING,
    event: TestExecutionEvent.SETUP_COMPLETE,
    to: TestExecutionState.SETUP
  },
  {
    from: TestExecutionState.SETUP,
    event: TestExecutionEvent.START_TESTS,
    to: TestExecutionState.RUNNING
  },
  {
    from: TestExecutionState.RUNNING,
    event: TestExecutionEvent.TESTS_COMPLETE,
    to: TestExecutionState.TEARDOWN
  },
  {
    from: TestExecutionState.TEARDOWN,
    event: TestExecutionEvent.TEARDOWN_COMPLETE,
    to: TestExecutionState.COMPLETED,
    action: async (ctx) => {
      ctx.endTime = new Date();
      console.log(`Test execution completed: ${ctx.executionId}`);
    }
  },
  {
    from: TestExecutionState.INITIALIZING,
    event: TestExecutionEvent.EXECUTION_FAILED,
    to: TestExecutionState.FAILED
  },
  {
    from: TestExecutionState.SETUP,
    event: TestExecutionEvent.EXECUTION_FAILED,
    to: TestExecutionState.FAILED
  },
  {
    from: TestExecutionState.RUNNING,
    event: TestExecutionEvent.EXECUTION_FAILED,
    to: TestExecutionState.FAILED
  },
  {
    from: TestExecutionState.TEARDOWN,
    event: TestExecutionEvent.EXECUTION_FAILED,
    to: TestExecutionState.FAILED
  },
  {
    from: TestExecutionState.IDLE,
    event: TestExecutionEvent.CANCEL_EXECUTION,
    to: TestExecutionState.CANCELLED
  },
  {
    from: TestExecutionState.INITIALIZING,
    event: TestExecutionEvent.CANCEL_EXECUTION,
    to: TestExecutionState.CANCELLED
  },
  {
    from: TestExecutionState.SETUP,
    event: TestExecutionEvent.CANCEL_EXECUTION,
    to: TestExecutionState.CANCELLED
  },
  {
    from: TestExecutionState.RUNNING,
    event: TestExecutionEvent.CANCEL_EXECUTION,
    to: TestExecutionState.CANCELLED
  }
];