/**
 * Agent State Machine Definitions
 * Defines all possible agent states and events for FSM-first workflow coordination
 *
 * Epic 6.1: Renamed from WorkflowState/Event to AgentWorkflowState/Event
 * to disambiguate from canonical workflow/fsm/WorkflowStates.ts
 */

// Agent States
export enum AgentState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  READY = 'ready',
  WORKING = 'working',
  WAITING = 'waiting',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SUSPENDED = 'suspended',
  ERROR = 'error'
}

// Agent Events
export enum AgentEvent {
  INITIALIZE = 'initialize',
  READY = 'ready',
  START_TASK = 'start_task',
  TASK_COMPLETE = 'task_complete',
  TASK_FAILED = 'task_failed',
  WAIT_DEPENDENCY = 'wait_dependency',
  DEPENDENCY_READY = 'dependency_ready',
  SUSPEND = 'suspend',
  RESUME = 'resume',
  ERROR_OCCURRED = 'error_occurred',
  RECOVER = 'recover',
  SHUTDOWN = 'shutdown'
}

// Workflow States
export enum AgentWorkflowState {
  PLANNING = 'planning',
  EXECUTING = 'executing',
  SYNCHRONIZING = 'synchronizing',
  VALIDATING = 'validating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  ERROR = 'error'
}

// Workflow Events
export enum AgentWorkflowEvent {
  START_PLANNING = 'start_planning',
  PLANNING_COMPLETE = 'planning_complete',
  START_EXECUTION = 'start_execution',
  EXECUTION_COMPLETE = 'execution_complete',
  START_SYNC = 'start_sync',
  SYNC_COMPLETE = 'sync_complete',
  START_VALIDATION = 'start_validation',
  VALIDATION_COMPLETE = 'validation_complete',
  COMPLETE = 'complete',
  FAIL = 'fail',
  CANCEL = 'cancel',
  ERROR_OCCURRED = 'error_occurred'
}

// State Transition Definitions
export interface StateTransition<TState, TEvent> {
  from: TState;
  event: TEvent;
  to: TState;
  guard?: () => boolean;
  action?: () => Promise<void> | void;
}

// Agent State Transitions
export const AGENT_TRANSITIONS: StateTransition<AgentState, AgentEvent>[] = [
  { from: AgentState.IDLE, event: AgentEvent.INITIALIZE, to: AgentState.INITIALIZING },
  { from: AgentState.INITIALIZING, event: AgentEvent.READY, to: AgentState.READY },
  { from: AgentState.READY, event: AgentEvent.START_TASK, to: AgentState.WORKING },
  { from: AgentState.WORKING, event: AgentEvent.TASK_COMPLETE, to: AgentState.READY },
  { from: AgentState.WORKING, event: AgentEvent.TASK_FAILED, to: AgentState.ERROR },
  { from: AgentState.WORKING, event: AgentEvent.WAIT_DEPENDENCY, to: AgentState.WAITING },
  { from: AgentState.WAITING, event: AgentEvent.DEPENDENCY_READY, to: AgentState.WORKING },
  { from: AgentState.READY, event: AgentEvent.SUSPEND, to: AgentState.SUSPENDED },
  { from: AgentState.WORKING, event: AgentEvent.SUSPEND, to: AgentState.SUSPENDED },
  { from: AgentState.SUSPENDED, event: AgentEvent.RESUME, to: AgentState.READY },
  { from: AgentState.ERROR, event: AgentEvent.RECOVER, to: AgentState.READY },
  { from: AgentState.READY, event: AgentEvent.SHUTDOWN, to: AgentState.COMPLETED },
  { from: AgentState.WORKING, event: AgentEvent.ERROR_OCCURRED, to: AgentState.ERROR }
];

// Workflow State Transitions
export const AGENT_WORKFLOW_TRANSITIONS: StateTransition<AgentWorkflowState, AgentWorkflowEvent>[] = [
  { from: AgentWorkflowState.PLANNING, event: AgentWorkflowEvent.PLANNING_COMPLETE, to: AgentWorkflowState.EXECUTING },
  { from: AgentWorkflowState.EXECUTING, event: AgentWorkflowEvent.EXECUTION_COMPLETE, to: AgentWorkflowState.SYNCHRONIZING },
  { from: AgentWorkflowState.SYNCHRONIZING, event: AgentWorkflowEvent.SYNC_COMPLETE, to: AgentWorkflowState.VALIDATING },
  { from: AgentWorkflowState.VALIDATING, event: AgentWorkflowEvent.VALIDATION_COMPLETE, to: AgentWorkflowState.COMPLETED },
  { from: AgentWorkflowState.PLANNING, event: AgentWorkflowEvent.FAIL, to: AgentWorkflowState.FAILED },
  { from: AgentWorkflowState.EXECUTING, event: AgentWorkflowEvent.FAIL, to: AgentWorkflowState.FAILED },
  { from: AgentWorkflowState.SYNCHRONIZING, event: AgentWorkflowEvent.FAIL, to: AgentWorkflowState.FAILED },
  { from: AgentWorkflowState.VALIDATING, event: AgentWorkflowEvent.FAIL, to: AgentWorkflowState.FAILED },
  { from: AgentWorkflowState.PLANNING, event: AgentWorkflowEvent.CANCEL, to: AgentWorkflowState.CANCELLED },
  { from: AgentWorkflowState.EXECUTING, event: AgentWorkflowEvent.CANCEL, to: AgentWorkflowState.CANCELLED },
  { from: AgentWorkflowState.SYNCHRONIZING, event: AgentWorkflowEvent.CANCEL, to: AgentWorkflowState.CANCELLED }
];

// State Machine Interface
export interface StateMachine<TState, TEvent> {
  currentState: TState;
  transitions: StateTransition<TState, TEvent>[];

  canTransition(event: TEvent): boolean;
  transition(event: TEvent): Promise<TState>;
  getValidEvents(): TEvent[];
  reset(): void;
}

// Agent State Contract
export interface AgentStateContract {
  init(): Promise<void>;
  update(deltaTime: number): Promise<void>;
  shutdown(): Promise<void>;
  checkInvariants(): boolean;
}

// Workflow State Contract
export interface WorkflowStateContract {
  enter(): Promise<void>;
  execute(): Promise<void>;
  exit(): Promise<void>;
  checkInvariants(): boolean;
}