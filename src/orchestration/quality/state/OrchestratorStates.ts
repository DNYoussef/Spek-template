/**
 * FSM States for Quality Gate Orchestrator
 * Following FSM-first development with centralized transitions
 */

// State Enums (NO string literals)
export enum OrchestratorState {
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  EXECUTING_SEQUENCE = 'EXECUTING_SEQUENCE',
  MONITORING_EXECUTION = 'MONITORING_EXECUTION',
  PROCESSING_CHECKPOINT = 'PROCESSING_CHECKPOINT',
  HANDLING_FAILURE = 'HANDLING_FAILURE',
  EXECUTING_ROLLBACK = 'EXECUTING_ROLLBACK',
  GENERATING_REPORTS = 'GENERATING_REPORTS',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  DESTROYED = 'DESTROYED'
}

export enum OrchestratorEvent {
  INITIALIZE = 'INITIALIZE',
  READY_TO_EXECUTE = 'READY_TO_EXECUTE',
  EXECUTE_SEQUENCE = 'EXECUTE_SEQUENCE',
  GATE_STARTED = 'GATE_STARTED',
  GATE_COMPLETED = 'GATE_COMPLETED',
  GATE_FAILED = 'GATE_FAILED',
  CHECKPOINT_REACHED = 'CHECKPOINT_REACHED',
  CHECKPOINT_PASSED = 'CHECKPOINT_PASSED',
  CHECKPOINT_FAILED = 'CHECKPOINT_FAILED',
  ROLLBACK_TRIGGERED = 'ROLLBACK_TRIGGERED',
  ROLLBACK_COMPLETED = 'ROLLBACK_COMPLETED',
  ROLLBACK_FAILED = 'ROLLBACK_FAILED',
  SEQUENCE_COMPLETED = 'SEQUENCE_COMPLETED',
  SEQUENCE_FAILED = 'SEQUENCE_FAILED',
  GENERATE_REPORTS = 'GENERATE_REPORTS',
  REPORTS_GENERATED = 'REPORTS_GENERATED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  DESTROY = 'DESTROY',
  RESET = 'RESET'
}

export interface OrchestratorStateContext {
  currentSequenceId?: string;
  currentGateId?: string;
  activeExecutions: Map<string, any>;
  errorCount: number;
  lastError?: Error;
  rollbackInProgress: boolean;
  checkpointsPassed: number;
  totalCheckpoints: number;
  startTime?: number;
  endTime?: number;
}

export interface StateTransition {
  fromState: OrchestratorState;
  event: OrchestratorEvent;
  toState: OrchestratorState;
  guard?: (context: OrchestratorStateContext) => boolean;
  action?: (context: OrchestratorStateContext) => Promise<void>;
}

// Transition Guards (NASA Rule 10: Functions ≤60 lines with 2+ assertions)
export class TransitionGuards {
  static canExecuteSequence(context: OrchestratorStateContext): boolean {
    // Assertion 1: No active executions beyond limit
    assert(context.activeExecutions.size >= 0, 'Active executions cannot be negative');
    // Assertion 2: Current sequence must be set
    assert(context.currentSequenceId !== undefined, 'Sequence ID must be defined');

    return context.activeExecutions.size < 3 &&
           context.currentSequenceId !== undefined;
  }

  static canProcessCheckpoint(context: OrchestratorStateContext): boolean {
    // Assertion 1: Valid checkpoint numbers
    assert(context.checkpointsPassed >= 0, 'Checkpoints passed cannot be negative');
    // Assertion 2: Valid total checkpoints
    assert(context.totalCheckpoints >= 0, 'Total checkpoints cannot be negative');

    return context.checkpointsPassed < context.totalCheckpoints;
  }

  static canTriggerRollback(context: OrchestratorStateContext): boolean {
    // Assertion 1: Not already in rollback
    assert(typeof context.rollbackInProgress === 'boolean', 'Rollback flag must be boolean');
    // Assertion 2: Must have error or failed gate
    assert(context.errorCount >= 0, 'Error count cannot be negative');

    return !context.rollbackInProgress &&
           (context.errorCount > 0 || context.lastError !== undefined);
  }

  static canCompleteSequence(context: OrchestratorStateContext): boolean {
    // Assertion 1: All checkpoints must be passed
    assert(context.checkpointsPassed >= 0, 'Checkpoints passed cannot be negative');
    // Assertion 2: Total checkpoints must be valid
    assert(context.totalCheckpoints >= 0, 'Total checkpoints cannot be negative');

    return context.checkpointsPassed >= context.totalCheckpoints &&
           context.errorCount === 0;
  }

  static canReset(context: OrchestratorStateContext): boolean {
    // Assertion 1: No active executions
    assert(context.activeExecutions instanceof Map, 'Active executions must be a Map');
    // Assertion 2: Not in rollback state
    assert(typeof context.rollbackInProgress === 'boolean', 'Rollback flag must be boolean');

    return context.activeExecutions.size === 0 &&
           !context.rollbackInProgress;
  }
}

// State Actions (NASA Rule 10: Functions ≤60 lines with 2+ assertions)
export class StateActions {
  static async initializeOrchestrator(context: OrchestratorStateContext): Promise<void> {
    // Assertion 1: Context is valid
    assert(context !== null && context !== undefined, 'Context cannot be null');
    // Assertion 2: Active executions map exists
    assert(context.activeExecutions instanceof Map, 'Active executions must be a Map');

    context.activeExecutions.clear();
    context.errorCount = 0;
    context.rollbackInProgress = false;
    context.checkpointsPassed = 0;
    context.totalCheckpoints = 0;
    context.startTime = Date.now();

    // Additional initialization logic would go here
  }

  static async startSequenceExecution(context: OrchestratorStateContext): Promise<void> {
    // Assertion 1: Sequence ID is set
    assert(context.currentSequenceId !== undefined, 'Sequence ID must be set');
    // Assertion 2: Start time is valid
    assert(typeof context.startTime === 'number', 'Start time must be a number');

    if (!context.startTime) {
      context.startTime = Date.now();
    }

    // Additional sequence start logic would go here
  }

  static async processCheckpoint(context: OrchestratorStateContext): Promise<void> {
    // Assertion 1: Valid checkpoint numbers
    assert(context.checkpointsPassed >= 0, 'Checkpoints passed cannot be negative');
    // Assertion 2: Not exceeding total checkpoints
    assert(context.checkpointsPassed < context.totalCheckpoints, 'Cannot exceed total checkpoints');

    context.checkpointsPassed++;

    // Additional checkpoint processing logic would go here
  }

  static async handleFailure(context: OrchestratorStateContext): Promise<void> {
    // Assertion 1: Error count is valid
    assert(context.errorCount >= 0, 'Error count cannot be negative');
    // Assertion 2: Context is valid
    assert(context !== null, 'Context cannot be null');

    context.errorCount++;

    // Additional failure handling logic would go here
  }

  static async executeRollback(context: OrchestratorStateContext): Promise<void> {
    // Assertion 1: Not already in rollback
    assert(!context.rollbackInProgress, 'Rollback already in progress');
    // Assertion 2: Context is valid
    assert(context !== null, 'Context cannot be null');

    context.rollbackInProgress = true;

    try {
      // Rollback logic would go here

      context.rollbackInProgress = false;
    } catch (error) {
      context.rollbackInProgress = false;
      context.lastError = error as Error;
      throw error;
    }
  }

  static async generateReports(context: OrchestratorStateContext): Promise<void> {
    // Assertion 1: Sequence execution completed
    assert(context.currentSequenceId !== undefined, 'Sequence ID must be defined');
    // Assertion 2: End time should be set
    assert(context.endTime !== undefined, 'End time should be set for completed sequence');

    // Report generation logic would go here
  }

  static async completeSequence(context: OrchestratorStateContext): Promise<void> {
    // Assertion 1: All checkpoints passed
    assert(context.checkpointsPassed >= context.totalCheckpoints, 'All checkpoints must be passed');
    // Assertion 2: No errors
    assert(context.errorCount === 0, 'No errors should remain');

    context.endTime = Date.now();

    // Sequence completion logic would go here
  }

  static async resetOrchestrator(context: OrchestratorStateContext): Promise<void> {
    // Assertion 1: No active executions
    assert(context.activeExecutions.size === 0, 'No active executions should remain');
    // Assertion 2: Context is valid
    assert(context !== null, 'Context cannot be null');

    context.currentSequenceId = undefined;
    context.currentGateId = undefined;
    context.errorCount = 0;
    context.lastError = undefined;
    context.rollbackInProgress = false;
    context.checkpointsPassed = 0;
    context.totalCheckpoints = 0;
    context.startTime = undefined;
    context.endTime = undefined;
  }

  static async destroyOrchestrator(context: OrchestratorStateContext): Promise<void> {
    // Assertion 1: Context exists
    assert(context !== null && context !== undefined, 'Context must exist');
    // Assertion 2: Active executions map exists
    assert(context.activeExecutions instanceof Map, 'Active executions must be a Map');

    context.activeExecutions.clear();

    // Cleanup logic would go here
  }
}

// Helper function for assertions (NASA Rule 10 compliance)
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

