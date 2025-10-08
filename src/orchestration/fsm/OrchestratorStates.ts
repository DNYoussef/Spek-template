/**
 * Unified Orchestrator States & Events for FSM-First Architecture
 * Used by all orchestrator components to ensure consistent state management
 */

export enum OrchestratorState {
  IDLE = 'idle',
  PLANNING = 'planning',
  ALLOCATING = 'allocating',
  EXECUTING = 'executing',
  MONITORING = 'monitoring',
  VALIDATING = 'validating',
  COMPLETING = 'completing',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

export enum OrchestratorEvent {
  START_ORCHESTRATION = 'start_orchestration',
  PLANNING_COMPLETE = 'planning_complete',
  ALLOCATION_COMPLETE = 'allocation_complete',
  EXECUTION_STARTED = 'execution_started',
  TASK_PROGRESS = 'task_progress',
  VALIDATION_REQUIRED = 'validation_required',
  VALIDATION_PASSED = 'validation_passed',
  VALIDATION_FAILED = 'validation_failed',
  EXECUTION_COMPLETE = 'execution_complete',
  ERROR_OCCURRED = 'error_occurred',
  CANCEL_REQUESTED = 'cancel_requested',
  RESET = 'reset'
}

export interface OrchestratorContext {
  readonly orchestratorId: string;
  readonly orchestrationType: string;
  readonly startTime: number;
  readonly tasks: TaskInfo[];
  readonly resources: ResourceInfo[];
  readonly metrics: MetricsInfo;
  readonly errors: ErrorInfo[];
}

export interface TaskInfo {
  readonly taskId: string;
  readonly type: string;
  readonly status: 'pending' | 'running' | 'completed' | 'failed';
  readonly progress: number;
  readonly startTime?: number;
  readonly endTime?: number;
}

export interface ResourceInfo {
  readonly resourceId: string;
  readonly type: string;
  readonly allocated: boolean;
  readonly capacity: number;
  readonly usage: number;
}

export interface MetricsInfo {
  readonly tasksTotal: number;
  readonly tasksCompleted: number;
  readonly tasksFailed: number;
  readonly averageTaskTime: number;
  readonly resourceUtilization: number;
  readonly successRate: number;
}

export interface ErrorInfo {
  readonly errorId: string;
  readonly timestamp: number;
  readonly type: string;
  readonly message: string;
  readonly context: Record<string, any>;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface StateTransition {
  readonly fromState: OrchestratorState;
  readonly event: OrchestratorEvent;
  readonly toState: OrchestratorState;
  readonly guard?: (context: OrchestratorContext) => boolean;
  readonly action?: (context: OrchestratorContext) => Promise<void>;
}

export const ORCHESTRATOR_TRANSITIONS: StateTransition[] = [
  {
    fromState: OrchestratorState.IDLE,
    event: OrchestratorEvent.START_ORCHESTRATION,
    toState: OrchestratorState.PLANNING
  },
  {
    fromState: OrchestratorState.PLANNING,
    event: OrchestratorEvent.PLANNING_COMPLETE,
    toState: OrchestratorState.ALLOCATING
  },
  {
    fromState: OrchestratorState.ALLOCATING,
    event: OrchestratorEvent.ALLOCATION_COMPLETE,
    toState: OrchestratorState.EXECUTING
  },
  {
    fromState: OrchestratorState.EXECUTING,
    event: OrchestratorEvent.VALIDATION_REQUIRED,
    toState: OrchestratorState.VALIDATING
  },
  {
    fromState: OrchestratorState.VALIDATING,
    event: OrchestratorEvent.VALIDATION_PASSED,
    toState: OrchestratorState.EXECUTING
  },
  {
    fromState: OrchestratorState.VALIDATING,
    event: OrchestratorEvent.VALIDATION_FAILED,
    toState: OrchestratorState.ERROR
  },
  {
    fromState: OrchestratorState.EXECUTING,
    event: OrchestratorEvent.EXECUTION_COMPLETE,
    toState: OrchestratorState.COMPLETING
  },
  {
    fromState: OrchestratorState.COMPLETING,
    event: OrchestratorEvent.RESET,
    toState: OrchestratorState.IDLE
  },
  {
    fromState: OrchestratorState.ERROR,
    event: OrchestratorEvent.RESET,
    toState: OrchestratorState.IDLE
  },
  {
    fromState: OrchestratorState.CANCELLED,
    event: OrchestratorEvent.RESET,
    toState: OrchestratorState.IDLE
  }
];