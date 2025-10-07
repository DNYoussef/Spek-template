/**
 * Workflow State Machine Facade
 * FSM-First workflow state management
 * State isolation with centralized transitions
 *
 * Epic 6.1: Renamed from WorkflowState/Event to SwarmWorkflowState/Event
 * to disambiguate from canonical workflow/fsm/WorkflowStates.ts
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export enum SwarmWorkflowState {
  IDLE = 'IDLE',
  VALIDATING = 'VALIDATING',
  EXECUTING = 'EXECUTING',
  MONITORING = 'MONITORING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum SwarmWorkflowEvent {
  START = 'START',
  VALIDATE = 'VALIDATE',
  EXECUTE = 'EXECUTE',
  MONITOR = 'MONITOR',
  COMPLETE = 'COMPLETE',
  FAIL = 'FAIL',
  RESET = 'RESET'
}

// Type aliases for backward compatibility with unqualified names
export type WorkflowState = SwarmWorkflowState;
export type WorkflowEvent = SwarmWorkflowEvent;
export type WorkflowData = SwarmWorkflowData;
export type TransitionResult = SwarmTransitionResult;

export interface SwarmWorkflowContext {
  readonly workflowId: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly progress: number;
  readonly currentStep: string;
  readonly totalSteps: number;
  readonly completedSteps: number;
}

export interface SwarmWorkflowResult {
  readonly success: boolean;
  readonly message: string;
  readonly data?: Record<string, unknown>;
  readonly errors: string[];
}

interface SwarmTransitionResult {
  readonly nextState: SwarmWorkflowState;
  readonly context?: Partial<SwarmWorkflowContext>;
  readonly result?: Partial<SwarmWorkflowResult>;
}

interface SwarmWorkflowData {
  context: SwarmWorkflowContext;
  result: SwarmWorkflowResult;
}

// ============================================================================
// STATE CONTRACTS
// ============================================================================

interface StateContract {
  init(): void;
  update(event: SwarmWorkflowEvent, data: Partial<SwarmWorkflowData>): Promise<SwarmTransitionResult>;
  shutdown(): void;
  checkInvariants(): boolean;
}

// ============================================================================
// STATE: IDLE
// ============================================================================

class IdleState implements StateContract {
  init(): void {
    // No initialization needed
  }

  async update(event: SwarmWorkflowEvent, data: Partial<SwarmWorkflowData>): Promise<SwarmTransitionResult> {
    console.assert(event !== null, 'Event must not be null');

    if (event === SwarmWorkflowEvent.START) {
      return { nextState: SwarmWorkflowState.VALIDATING };
    }

    return { nextState: SwarmWorkflowState.IDLE };
  }

  shutdown(): void {
    // No cleanup needed
  }

  checkInvariants(): boolean {
    return true;
  }
}

// ============================================================================
// STATE: VALIDATING
// ============================================================================

class ValidatingState implements StateContract {
  private validationErrors: string[] = [];

  init(): void {
    this.validationErrors = [];
  }

  async update(event: WorkflowEvent, data: Partial<WorkflowData>): Promise<TransitionResult> {
    console.assert(event !== null, 'Event must not be null');
    console.assert(data !== null, 'Data must not be null');

    if (event === WorkflowEvent.VALIDATE) {
      const isValid = this.validateWorkflow(data);

      if (isValid) {
        return {
          nextState: WorkflowState.EXECUTING,
          context: { progress: 0.1, currentStep: 'validation_complete' }
        };
      } else {
        return {
          nextState: WorkflowState.FAILED,
          result: {
            success: false,
            message: 'Validation failed',
            errors: this.validationErrors
          }
        };
      }
    }

    if (event === WorkflowEvent.FAIL) {
      return { nextState: WorkflowState.FAILED };
    }

    return { nextState: WorkflowState.VALIDATING };
  }

  shutdown(): void {
    this.validationErrors = [];
  }

  checkInvariants(): boolean {
    return Array.isArray(this.validationErrors);
  }

  private validateWorkflow(data: Partial<WorkflowData>): boolean {
    console.assert(data !== null, 'Data must not be null');

    if (!data.context || !data.context.workflowId) {
      this.validationErrors.push('Missing workflow ID');
      return false;
    }

    if (data.context.totalSteps <= 0) {
      this.validationErrors.push('Total steps must be positive');
      return false;
    }

    return true;
  }
}

// ============================================================================
// STATE: EXECUTING
// ============================================================================

class ExecutingState implements StateContract {
  private executionProgress = 0;

  init(): void {
    this.executionProgress = 0;
  }

  async update(event: WorkflowEvent, data: Partial<WorkflowData>): Promise<TransitionResult> {
    console.assert(event !== null, 'Event must not be null');

    if (event === WorkflowEvent.EXECUTE) {
      this.executionProgress += 0.1;

      if (this.executionProgress >= 1.0) {
        return {
          nextState: WorkflowState.MONITORING,
          context: { progress: 0.8, currentStep: 'execution_complete' }
        };
      }

      return {
        nextState: WorkflowState.EXECUTING,
        context: { progress: this.executionProgress * 0.7 }
      };
    }

    if (event === WorkflowEvent.FAIL) {
      return { nextState: WorkflowState.FAILED };
    }

    return { nextState: WorkflowState.EXECUTING };
  }

  shutdown(): void {
    this.executionProgress = 0;
  }

  checkInvariants(): boolean {
    return this.executionProgress >= 0 && this.executionProgress <= 1;
  }
}

// ============================================================================
// STATE: MONITORING
// ============================================================================

class MonitoringState implements StateContract {
  init(): void {
    // Start monitoring
  }

  async update(event: WorkflowEvent, data: Partial<WorkflowData>): Promise<TransitionResult> {
    console.assert(event !== null, 'Event must not be null');

    if (event === WorkflowEvent.COMPLETE) {
      return {
        nextState: WorkflowState.COMPLETED,
        context: { progress: 1.0, endTime: Date.now() },
        result: { success: true, message: 'Workflow completed', errors: [] }
      };
    }

    if (event === WorkflowEvent.FAIL) {
      return { nextState: WorkflowState.FAILED };
    }

    return { nextState: WorkflowState.MONITORING };
  }

  shutdown(): void {
    // Stop monitoring
  }

  checkInvariants(): boolean {
    return true;
  }
}

// ============================================================================
// TRANSITION HUB
// ============================================================================

class TransitionHub {
  private readonly states: Map<WorkflowState, StateContract>;

  constructor() {
    this.states = new Map([
      [WorkflowState.IDLE, new IdleState()],
      [WorkflowState.VALIDATING, new ValidatingState()],
      [WorkflowState.EXECUTING, new ExecutingState()],
      [WorkflowState.MONITORING, new MonitoringState()]
    ]);
  }

  async transition(
    currentState: WorkflowState,
    event: WorkflowEvent,
    data: Partial<WorkflowData>
  ): Promise<TransitionResult> {
    console.assert(currentState !== null, 'Current state must not be null');
    console.assert(event !== null, 'Event must not be null');

    const state = this.states.get(currentState);
    if (!state) {
      return { nextState: WorkflowState.FAILED };
    }

    return state.update(event, data);
  }

  initState(state: WorkflowState): void {
    const stateObj = this.states.get(state);
    if (stateObj) {
      stateObj.init();
    }
  }

  shutdownState(state: WorkflowState): void {
    const stateObj = this.states.get(state);
    if (stateObj) {
      stateObj.shutdown();
    }
  }
}

// ============================================================================
// FACADE
// ============================================================================

export class WorkflowStateMachine extends EventEmitter {
  private currentState: WorkflowState = WorkflowState.IDLE;
  private readonly transitionHub: TransitionHub;
  private data: WorkflowData;

  constructor(workflowId: string, totalSteps: number) {
    super();
    console.assert(workflowId !== null && workflowId.length > 0, 'Workflow ID must be provided');
    console.assert(totalSteps > 0, 'Total steps must be positive');

    this.transitionHub = new TransitionHub();
    this.data = {
      context: {
        workflowId,
        startTime: Date.now(),
        progress: 0,
        currentStep: 'initial',
        totalSteps,
        completedSteps: 0
      },
      result: {
        success: false,
        message: '',
        errors: []
      }
    };

    this.transitionHub.initState(this.currentState);
  }

  async start(): Promise<void> {
    await this.handleEvent(WorkflowEvent.START);
    await this.handleEvent(WorkflowEvent.VALIDATE);
  }

  async execute(): Promise<void> {
    console.assert(this.currentState === WorkflowState.EXECUTING, 'Must be in executing state');
    await this.handleEvent(WorkflowEvent.EXECUTE);
  }

  async complete(): Promise<void> {
    await this.handleEvent(WorkflowEvent.COMPLETE);
  }

  getCurrentState(): WorkflowState {
    return this.currentState;
  }

  getContext(): WorkflowContext {
    return { ...this.data.context };
  }

  getResult(): WorkflowResult {
    return { ...this.data.result };
  }

  private async handleEvent(event: WorkflowEvent, eventData: Partial<WorkflowData> = {}): Promise<void> {
    console.assert(event !== null, 'Event must not be null');

    const result = await this.transitionHub.transition(this.currentState, event, eventData);

    if (result.nextState !== this.currentState) {
      this.transitionHub.shutdownState(this.currentState);
      this.currentState = result.nextState;
      this.transitionHub.initState(this.currentState);
      this.emit('stateChange', this.currentState);
    }

    if (result.context) {
      this.data.context = { ...this.data.context, ...result.context };
    }

    if (result.result) {
      this.data.result = { ...this.data.result, ...result.result };
    }
  }

  destroy(): void {
    this.transitionHub.shutdownState(this.currentState);
    this.removeAllListeners();
  }
}

// Backward compatibility
export default WorkflowStateMachine;

/**
 * AGENT FOOTER
 * Version & Run Log
 *
 * Version: 1.0.0
 * Timestamp: 2025-10-01T16:50:00-04:00
 * Agent: assistant@claude-sonnet-4-5
 * Change Summary: Created WorkflowStateMachine facade with FSM architecture
 * Artifacts: WorkflowStateMachineFacade.ts
 * Status: OK
 * Notes: FSM-first workflow state management with validation, execution, monitoring
 * Cost: 0.00
 * Hash: d9e5f3a
 *
 * Receipt:
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase2-ts1192-fix-003
 * - inputs: ["WorkflowFacade.ts", "WorkflowStateMachine.ts"]
 * - tools_used: ["Read", "Write"]
 * - versions: {"model":"claude-sonnet-4-5","prompt":"fsm-first-v1"}
 */
