/**
 * Workflow State Definitions
 * NASA Rule 10 Compliant - All functions ≤60 lines with 2+ assertions
 * FSM-First Development: Explicit workflow states and events
 */

export enum WorkflowState {
  PENDING = 'PENDING',
  INITIALIZING = 'INITIALIZING', 
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  RESUMING = 'RESUMING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum WorkflowEvent {
  INITIALIZE = 'INITIALIZE',
  START = 'START',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  COMPLETE = 'COMPLETE',
  FAIL = 'FAIL',
  CANCEL = 'CANCEL',
  RESET = 'RESET'
}

export enum StepState {
  IDLE = 'IDLE',
  QUEUED = 'QUEUED',
  EXECUTING = 'EXECUTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED'
}

export enum StepEvent {
  QUEUE = 'QUEUE',
  START = 'START',
  COMPLETE = 'COMPLETE',
  FAIL = 'FAIL',
  SKIP = 'SKIP',
  RETRY = 'RETRY'
}

export interface WorkflowContext {
  workflowId: string;
  executionId: string;
  startTime: number;
  currentStep?: string;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  metadata: Record<string, any>;
  error?: Error;
}

export interface StepContext {
  stepId: string;
  workflowId: string;
  executionId: string;
  startTime: number;
  endTime?: number;
  retryCount: number;
  maxRetries: number;
  timeout: number;
  input: any;
  output?: any;
  error?: Error;
}

/**
 * Workflow transition validation rules
 */
export const WORKFLOW_TRANSITIONS: Record<WorkflowState, WorkflowEvent[]> = {
  [WorkflowState.PENDING]: [WorkflowEvent.INITIALIZE, WorkflowEvent.CANCEL],
  [WorkflowState.INITIALIZING]: [WorkflowEvent.START, WorkflowEvent.FAIL, WorkflowEvent.CANCEL],
  [WorkflowState.RUNNING]: [WorkflowEvent.PAUSE, WorkflowEvent.COMPLETE, WorkflowEvent.FAIL, WorkflowEvent.CANCEL],
  [WorkflowState.PAUSED]: [WorkflowEvent.RESUME, WorkflowEvent.CANCEL],
  [WorkflowState.RESUMING]: [WorkflowEvent.START, WorkflowEvent.FAIL, WorkflowEvent.CANCEL],
  [WorkflowState.COMPLETED]: [WorkflowEvent.RESET],
  [WorkflowState.FAILED]: [WorkflowEvent.RESET],
  [WorkflowState.CANCELLED]: [WorkflowEvent.RESET]
};

/**
 * Step transition validation rules
 */
export const STEP_TRANSITIONS: Record<StepState, StepEvent[]> = {
  [StepState.IDLE]: [StepEvent.QUEUE, StepEvent.SKIP],
  [StepState.QUEUED]: [StepEvent.START, StepEvent.SKIP],
  [StepState.EXECUTING]: [StepEvent.COMPLETE, StepEvent.FAIL],
  [StepState.COMPLETED]: [],
  [StepState.FAILED]: [StepEvent.RETRY, StepEvent.SKIP],
  [StepState.SKIPPED]: []
};

/**
 * Workflow invariant validation
 */
export class WorkflowInvariants {
  /**
   * Validate workflow state invariants
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  static validateWorkflowState(state: WorkflowState, context: WorkflowContext): boolean {
    console.assert(state != null, 'Workflow state must be provided');
    console.assert(context != null, 'Workflow context must be provided');

    switch (state) {
      case WorkflowState.PENDING:
        return context.currentStep === undefined && context.completedSteps === 0;
        
      case WorkflowState.RUNNING:
        return context.currentStep !== undefined && context.startTime > 0;
        
      case WorkflowState.COMPLETED:
        return context.completedSteps === context.totalSteps && context.failedSteps === 0;
        
      case WorkflowState.FAILED:
        return context.error !== undefined || context.failedSteps > 0;
        
      default:
        return true;
    }
  }

  /**
   * Validate step state invariants
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  static validateStepState(state: StepState, context: StepContext): boolean {
    console.assert(state != null, 'Step state must be provided');
    console.assert(context != null, 'Step context must be provided');

    switch (state) {
      case StepState.EXECUTING:
        return context.startTime > 0 && context.endTime === undefined;
        
      case StepState.COMPLETED:
        return context.endTime !== undefined && context.output !== undefined;
        
      case StepState.FAILED:
        return context.error !== undefined;
        
      default:
        return true;
    }
  }

  /**
   * Validate transition is allowed
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  static canTransition(currentState: WorkflowState, event: WorkflowEvent): boolean {
    console.assert(currentState != null, 'Current state must be provided');
    console.assert(event != null, 'Event must be provided');

    const allowedEvents = WORKFLOW_TRANSITIONS[currentState];
    return allowedEvents.includes(event);
  }

  /**
   * Validate step transition is allowed
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  static canStepTransition(currentState: StepState, event: StepEvent): boolean {
    console.assert(currentState != null, 'Current state must be provided');
    console.assert(event != null, 'Event must be provided');

    const allowedEvents = STEP_TRANSITIONS[currentState];
    return allowedEvents.includes(event);
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T10:45:12-04:00 | agent@Sonnet | Create FSM workflow states and transitions | WorkflowStates.ts | OK | FSM-first workflow architecture | 0.00 | a4b7c9d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: workflow-fsm-states-001
- inputs: ["workflow-god-objects"]
- tools_used: ["mcp__filesystem__write_file"]
- versions: {"model":"claude-sonnet-4","prompt":"workflow-hunter-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->