/**
 * Workflow Transition Hub - Centralized State Management
 * NASA Rule 10 Compliant - All functions ≤60 lines with 2+ assertions
 * FSM-First Development: Single hub for all workflow state transitions
 */

import { EventEmitter } from 'events';
import { 
  WorkflowState, 
  WorkflowEvent, 
  StepState, 
  StepEvent, 
  WorkflowContext, 
  StepContext,
  WorkflowInvariants 
} from './WorkflowStates';

export interface WorkflowStateMachine {
  workflowId: string;
  currentState: WorkflowState;
  context: WorkflowContext;
  stepMachines: Map<string, StepStateMachine>;
  history: StateTransition[];
}

export interface StepStateMachine {
  stepId: string;
  currentState: StepState;
  context: StepContext;
  history: StateTransition[];
}

export interface StateTransition {
  fromState: WorkflowState | StepState;
  toState: WorkflowState | StepState;
  event: WorkflowEvent | StepEvent;
  timestamp: number;
  reason?: string;
}

/**
 * Centralized workflow state transition management
 * Single point of control for all workflow and step state changes
 */
export class WorkflowTransitionHub extends EventEmitter {
  private workflowMachines: Map<string, WorkflowStateMachine> = new Map();
  private readonly MAX_HISTORY = 100;
  private readonly MAX_WORKFLOWS = 50;

  constructor() {
    super();
    console.assert(this instanceof EventEmitter, 'Must extend EventEmitter');
    console.assert(this.workflowMachines instanceof Map, 'Workflow machines must be initialized');
  }

  /**
   * Create new workflow state machine
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  createWorkflow(workflowId: string, initialContext: Partial<WorkflowContext>): void {
    console.assert(typeof workflowId === 'string' && workflowId.length > 0, 'Workflow ID must be non-empty string');
    console.assert(initialContext != null, 'Initial context must be provided');

    if (this.workflowMachines.size >= this.MAX_WORKFLOWS) {
      throw new Error(`Maximum workflows reached: ${this.MAX_WORKFLOWS}`);
    }

    if (this.workflowMachines.has(workflowId)) {
      throw new Error(`Workflow already exists: ${workflowId}`);
    }

    const context: WorkflowContext = {
      workflowId,
      executionId: initialContext.executionId || `exec-${Date.now()}`,
      startTime: Date.now(),
      totalSteps: initialContext.totalSteps || 0,
      completedSteps: 0,
      failedSteps: 0,
      metadata: initialContext.metadata || {},
      ...initialContext
    };

    const machine: WorkflowStateMachine = {
      workflowId,
      currentState: WorkflowState.PENDING,
      context,
      stepMachines: new Map(),
      history: []
    };

    this.workflowMachines.set(workflowId, machine);

    console.assert(this.workflowMachines.has(workflowId), 'Workflow must be stored');
    console.assert(machine.currentState === WorkflowState.PENDING, 'Initial state must be PENDING');

    this.emit('workflow:created', { workflowId, state: WorkflowState.PENDING });
  }

  /**
   * Transition workflow state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async transitionWorkflow(workflowId: string, event: WorkflowEvent, reason?: string): Promise<void> {
    console.assert(typeof workflowId === 'string' && workflowId.length > 0, 'Workflow ID must be non-empty string');
    console.assert(event != null, 'Event must be provided');

    const machine = this.workflowMachines.get(workflowId);
    if (!machine) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const currentState = machine.currentState;
    
    // Validate transition is allowed
    if (!WorkflowInvariants.canTransition(currentState, event)) {
      throw new Error(`Invalid transition: ${currentState} -> ${event}`);
    }

    // Calculate next state
    const nextState = this.calculateNextWorkflowState(currentState, event);
    
    // Validate state invariants before transition
    const updatedContext = this.updateWorkflowContext(machine.context, event, nextState);
    if (!WorkflowInvariants.validateWorkflowState(nextState, updatedContext)) {
      throw new Error(`State invariant violation: ${nextState}`);
    }

    // Execute transition
    const transition: StateTransition = {
      fromState: currentState,
      toState: nextState,
      event,
      timestamp: Date.now(),
      reason
    };

    machine.currentState = nextState;
    machine.context = updatedContext;
    machine.history.push(transition);

    // Trim history if too long
    if (machine.history.length > this.MAX_HISTORY) {
      machine.history = machine.history.slice(-this.MAX_HISTORY);
    }

    console.assert(machine.currentState === nextState, 'State must be updated');
    console.assert(machine.history.length <= this.MAX_HISTORY, 'History must be bounded');

    this.emit('workflow:transitioned', { 
      workflowId, 
      fromState: currentState, 
      toState: nextState, 
      event,
      context: machine.context 
    });
  }

  /**
   * Create step state machine within workflow
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  createStep(workflowId: string, stepId: string, initialContext: Partial<StepContext>): void {
    console.assert(typeof workflowId === 'string' && workflowId.length > 0, 'Workflow ID must be non-empty string');
    console.assert(typeof stepId === 'string' && stepId.length > 0, 'Step ID must be non-empty string');

    const workflowMachine = this.workflowMachines.get(workflowId);
    if (!workflowMachine) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (workflowMachine.stepMachines.has(stepId)) {
      throw new Error(`Step already exists: ${stepId}`);
    }

    const context: StepContext = {
      stepId,
      workflowId,
      executionId: workflowMachine.context.executionId,
      startTime: 0,
      retryCount: 0,
      maxRetries: 3,
      timeout: 30000,
      input: null,
      ...initialContext
    };

    const stepMachine: StepStateMachine = {
      stepId,
      currentState: StepState.IDLE,
      context,
      history: []
    };

    workflowMachine.stepMachines.set(stepId, stepMachine);

    console.assert(workflowMachine.stepMachines.has(stepId), 'Step must be stored');
    console.assert(stepMachine.currentState === StepState.IDLE, 'Initial step state must be IDLE');

    this.emit('step:created', { workflowId, stepId, state: StepState.IDLE });
  }

  /**
   * Transition step state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async transitionStep(workflowId: string, stepId: string, event: StepEvent, data?: any): Promise<void> {
    console.assert(typeof workflowId === 'string' && workflowId.length > 0, 'Workflow ID must be non-empty string');
    console.assert(typeof stepId === 'string' && stepId.length > 0, 'Step ID must be non-empty string');

    const workflowMachine = this.workflowMachines.get(workflowId);
    if (!workflowMachine) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const stepMachine = workflowMachine.stepMachines.get(stepId);
    if (!stepMachine) {
      throw new Error(`Step not found: ${stepId}`);
    }

    const currentState = stepMachine.currentState;
    
    // Validate transition is allowed
    if (!WorkflowInvariants.canStepTransition(currentState, event)) {
      throw new Error(`Invalid step transition: ${currentState} -> ${event}`);
    }

    // Calculate next state
    const nextState = this.calculateNextStepState(currentState, event);
    
    // Update context based on event
    const updatedContext = this.updateStepContext(stepMachine.context, event, data);
    
    // Validate state invariants
    if (!WorkflowInvariants.validateStepState(nextState, updatedContext)) {
      throw new Error(`Step state invariant violation: ${nextState}`);
    }

    // Execute transition
    const transition: StateTransition = {
      fromState: currentState,
      toState: nextState,
      event,
      timestamp: Date.now()
    };

    stepMachine.currentState = nextState;
    stepMachine.context = updatedContext;
    stepMachine.history.push(transition);

    // Update workflow context based on step completion
    await this.updateWorkflowFromStep(workflowMachine, stepMachine, nextState);

    console.assert(stepMachine.currentState === nextState, 'Step state must be updated');

    this.emit('step:transitioned', { 
      workflowId, 
      stepId, 
      fromState: currentState, 
      toState: nextState, 
      event,
      context: stepMachine.context 
    });
  }

  /**
   * Get workflow current state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getWorkflowState(workflowId: string): WorkflowStateMachine | null {
    console.assert(typeof workflowId === 'string' && workflowId.length > 0, 'Workflow ID must be non-empty string');

    const machine = this.workflowMachines.get(workflowId);
    console.assert(machine == null || machine.workflowId === workflowId, 'Returned machine must match ID');

    return machine || null;
  }

  /**
   * Get step current state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getStepState(workflowId: string, stepId: string): StepStateMachine | null {
    console.assert(typeof workflowId === 'string' && workflowId.length > 0, 'Workflow ID must be non-empty string');
    console.assert(typeof stepId === 'string' && stepId.length > 0, 'Step ID must be non-empty string');

    const workflowMachine = this.workflowMachines.get(workflowId);
    if (!workflowMachine) return null;

    const stepMachine = workflowMachine.stepMachines.get(stepId);
    console.assert(stepMachine == null || stepMachine.stepId === stepId, 'Returned step must match ID');

    return stepMachine || null;
  }

  /**
   * Remove completed workflow
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  removeWorkflow(workflowId: string): boolean {
    console.assert(typeof workflowId === 'string' && workflowId.length > 0, 'Workflow ID must be non-empty string');

    const machine = this.workflowMachines.get(workflowId);
    if (!machine) return false;

    // Only remove completed, failed, or cancelled workflows
    const terminalStates = [WorkflowState.COMPLETED, WorkflowState.FAILED, WorkflowState.CANCELLED];
    if (!terminalStates.includes(machine.currentState)) {
      throw new Error(`Cannot remove active workflow: ${workflowId} (${machine.currentState})`);
    }

    const removed = this.workflowMachines.delete(workflowId);
    console.assert(removed, 'Workflow must be removed');
    console.assert(!this.workflowMachines.has(workflowId), 'Workflow must not exist after removal');

    this.emit('workflow:removed', { workflowId, finalState: machine.currentState });
    return true;
  }

  // Private helper methods

  /**
   * Calculate next workflow state based on current state and event
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private calculateNextWorkflowState(currentState: WorkflowState, event: WorkflowEvent): WorkflowState {
    console.assert(currentState != null, 'Current state must be provided');
    console.assert(event != null, 'Event must be provided');

    const stateMap: Record<string, WorkflowState> = {
      [`${WorkflowState.PENDING}-${WorkflowEvent.INITIALIZE}`]: WorkflowState.INITIALIZING,
      [`${WorkflowState.INITIALIZING}-${WorkflowEvent.START}`]: WorkflowState.RUNNING,
      [`${WorkflowState.RUNNING}-${WorkflowEvent.PAUSE}`]: WorkflowState.PAUSED,
      [`${WorkflowState.RUNNING}-${WorkflowEvent.COMPLETE}`]: WorkflowState.COMPLETED,
      [`${WorkflowState.RUNNING}-${WorkflowEvent.FAIL}`]: WorkflowState.FAILED,
      [`${WorkflowState.PAUSED}-${WorkflowEvent.RESUME}`]: WorkflowState.RESUMING,
      [`${WorkflowState.RESUMING}-${WorkflowEvent.START}`]: WorkflowState.RUNNING,
      [`${currentState}-${WorkflowEvent.CANCEL}`]: WorkflowState.CANCELLED,
      [`${currentState}-${WorkflowEvent.RESET}`]: WorkflowState.PENDING
    };

    const key = `${currentState}-${event}`;
    const nextState = stateMap[key];

    console.assert(nextState != null, `Invalid transition mapping: ${key}`);
    return nextState;
  }

  /**
   * Calculate next step state based on current state and event
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private calculateNextStepState(currentState: StepState, event: StepEvent): StepState {
    console.assert(currentState != null, 'Current state must be provided');
    console.assert(event != null, 'Event must be provided');

    const stateMap: Record<string, StepState> = {
      [`${StepState.IDLE}-${StepEvent.QUEUE}`]: StepState.QUEUED,
      [`${StepState.IDLE}-${StepEvent.SKIP}`]: StepState.SKIPPED,
      [`${StepState.QUEUED}-${StepEvent.START}`]: StepState.EXECUTING,
      [`${StepState.QUEUED}-${StepEvent.SKIP}`]: StepState.SKIPPED,
      [`${StepState.EXECUTING}-${StepEvent.COMPLETE}`]: StepState.COMPLETED,
      [`${StepState.EXECUTING}-${StepEvent.FAIL}`]: StepState.FAILED,
      [`${StepState.FAILED}-${StepEvent.RETRY}`]: StepState.QUEUED,
      [`${StepState.FAILED}-${StepEvent.SKIP}`]: StepState.SKIPPED
    };

    const key = `${currentState}-${event}`;
    const nextState = stateMap[key];

    console.assert(nextState != null, `Invalid step transition mapping: ${key}`);
    return nextState;
  }

  /**
   * Update workflow context based on event
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private updateWorkflowContext(context: WorkflowContext, event: WorkflowEvent, nextState: WorkflowState): WorkflowContext {
    console.assert(context != null, 'Context must be provided');
    console.assert(event != null, 'Event must be provided');

    const updated = { ...context };

    switch (event) {
      case WorkflowEvent.START:
        updated.startTime = Date.now();
        break;
      case WorkflowEvent.FAIL:
        updated.error = new Error('Workflow failed');
        break;
      case WorkflowEvent.RESET:
        updated.completedSteps = 0;
        updated.failedSteps = 0;
        updated.error = undefined;
        break;
    }

    console.assert(updated.workflowId === context.workflowId, 'Workflow ID must not change');
    return updated;
  }

  /**
   * Update step context based on event
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private updateStepContext(context: StepContext, event: StepEvent, data?: any): StepContext {
    console.assert(context != null, 'Context must be provided');
    console.assert(event != null, 'Event must be provided');

    const updated = { ...context };

    switch (event) {
      case StepEvent.START:
        updated.startTime = Date.now();
        if (data) updated.input = data;
        break;
      case StepEvent.COMPLETE:
        updated.endTime = Date.now();
        if (data) updated.output = data;
        break;
      case StepEvent.FAIL:
        updated.endTime = Date.now();
        updated.error = data instanceof Error ? data : new Error(data || 'Step failed');
        break;
      case StepEvent.RETRY:
        updated.retryCount++;
        updated.error = undefined;
        break;
    }

    console.assert(updated.stepId === context.stepId, 'Step ID must not change');
    return updated;
  }

  /**
   * Update workflow context when step completes
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async updateWorkflowFromStep(
    workflowMachine: WorkflowStateMachine, 
    stepMachine: StepStateMachine, 
    stepState: StepState
  ): Promise<void> {
    console.assert(workflowMachine != null, 'Workflow machine must be provided');
    console.assert(stepMachine != null, 'Step machine must be provided');

    const context = workflowMachine.context;

    switch (stepState) {
      case StepState.COMPLETED:
        context.completedSteps++;
        break;
      case StepState.FAILED:
        context.failedSteps++;
        break;
    }

    // Auto-transition workflow if all steps completed
    if (context.completedSteps === context.totalSteps) {
      await this.transitionWorkflow(workflowMachine.workflowId, WorkflowEvent.COMPLETE);
    }

    console.assert(context.completedSteps <= context.totalSteps, 'Completed steps cannot exceed total');
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: workflow-transition-hub-001
// inputs: ["WorkflowStates.ts"]
// tools_used: ["mcp__filesystem__write_file"]
// versions: {"model":"claude-sonnet-4","prompt":"workflow-hunter-v1"}
// === END FOOTER ===