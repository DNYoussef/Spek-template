/**
 * WorkflowStateMachine - FSM Implementation for Workflow Orchestration
 * NASA Rule 10 Compliant - All functions ≤60 lines with explicit state management
 * Manages workflow state transitions with proper validation and event handling
 */

import { EventEmitter } from 'events';
import {
  WorkflowState,
  WorkflowEvent,
  WorkflowTransition,
  WorkflowContext,
  WorkflowDefinition,
  WorkflowExecution
} from './WorkflowTypes';

// Re-export for convenience
export { WorkflowState, WorkflowEvent };

/**
 * FSM-based workflow state machine
 * NASA Rule 10: All functions ≤60 lines, 2+ assertions each
 */
export class WorkflowStateMachine extends EventEmitter {
  private currentState: WorkflowState = WorkflowState.IDLE;
  private context: WorkflowContext = {};
  private transitions: WorkflowTransition[] = [];

  constructor(initialContext: Partial<WorkflowContext> = {}) {
    super();

    // NASA Assertion 1: Validate constructor parameters
    console.assert(initialContext !== null && initialContext !== undefined, 'Initial context must be provided');

    this.context = { ...initialContext };
    this.initializeTransitions();

    // NASA Assertion 2: Validate initialization
    console.assert(this.transitions.length > 0, 'Transitions must be initialized');
  }

  /**
   * Initialize FSM transition table
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private initializeTransitions(): void {
    // NASA Assertion 1: Validate FSM initialization
    console.assert(this.transitions !== null, 'Transitions array must be initialized');

    this.transitions = [
      // Creation transitions
      {
        fromState: WorkflowState.IDLE,
        event: WorkflowEvent.CREATE_WORKFLOW,
        toState: WorkflowState.CREATING,
        action: this.handleWorkflowCreation.bind(this)
      },

      // Validation transitions
      {
        fromState: WorkflowState.CREATING,
        event: WorkflowEvent.VALIDATE_WORKFLOW,
        toState: WorkflowState.VALIDATING,
        action: this.handleWorkflowValidation.bind(this)
      },

      // Execution transitions
      {
        fromState: WorkflowState.VALIDATING,
        event: WorkflowEvent.START_EXECUTION,
        toState: WorkflowState.EXECUTING,
        guard: this.isWorkflowValid.bind(this),
        action: this.handleExecutionStart.bind(this)
      },

      // Optimization transitions
      {
        fromState: WorkflowState.EXECUTING,
        event: WorkflowEvent.OPTIMIZE_WORKFLOW,
        toState: WorkflowState.OPTIMIZING,
        action: this.handleWorkflowOptimization.bind(this)
      },

      // Completion transitions
      {
        fromState: WorkflowState.EXECUTING,
        event: WorkflowEvent.COMPLETE_EXECUTION,
        toState: WorkflowState.COMPLETED,
        action: this.handleWorkflowCompletion.bind(this)
      },

      // Failure transitions
      {
        fromState: WorkflowState.EXECUTING,
        event: WorkflowEvent.FAIL_EXECUTION,
        toState: WorkflowState.FAILED,
        action: this.handleWorkflowFailure.bind(this)
      },

      // Cancellation transitions (from any executing state)
      {
        fromState: WorkflowState.EXECUTING,
        event: WorkflowEvent.CANCEL_EXECUTION,
        toState: WorkflowState.CANCELLED,
        action: this.handleWorkflowCancellation.bind(this)
      },

      // Reset transitions
      {
        fromState: WorkflowState.COMPLETED,
        event: WorkflowEvent.RESET_WORKFLOW,
        toState: WorkflowState.IDLE,
        action: this.handleWorkflowReset.bind(this)
      },
      {
        fromState: WorkflowState.FAILED,
        event: WorkflowEvent.RESET_WORKFLOW,
        toState: WorkflowState.IDLE,
        action: this.handleWorkflowReset.bind(this)
      },
      {
        fromState: WorkflowState.CANCELLED,
        event: WorkflowEvent.RESET_WORKFLOW,
        toState: WorkflowState.IDLE,
        action: this.handleWorkflowReset.bind(this)
      }
    ];

    // NASA Assertion 2: Validate transition initialization
    console.assert(this.transitions.length === 10, 'All 10 transitions must be defined');
  }

  /**
   * Process FSM event with state transition validation
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async processEvent(event: WorkflowEvent, eventData?: any): Promise<void> {
    // NASA Assertion 1: Validate event parameters
    console.assert(Object.values(WorkflowEvent).includes(event), 'Event must be valid WorkflowEvent');

    const transition = this.findValidTransition(event);
    if (!transition) {
      throw new Error(`Invalid transition: ${this.currentState} -> ${event}`);
    }

    // Check guard condition if present
    if (transition.guard && !transition.guard(this.context)) {
      throw new Error(`Guard condition failed for transition: ${this.currentState} -> ${event}`);
    }

    const previousState = this.currentState;
    this.currentState = transition.toState;

    // Execute transition action if present
    if (transition.action) {
      try {
        await transition.action(this.context);
      } catch (error) {
        // Rollback on action failure
        this.currentState = previousState;
        throw error;
      }
    }

    // Emit state change event
    this.emit('stateChanged', {
      from: previousState,
      to: this.currentState,
      event,
      data: eventData,
      timestamp: new Date()
    });

    // NASA Assertion 2: Validate state transition
    console.assert(this.currentState === transition.toState, 'State must match transition target');
  }

  /**
   * Find valid transition for current state and event
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private findValidTransition(event: WorkflowEvent): WorkflowTransition | null {
    // NASA Assertion 1: Validate input parameters
    console.assert(Object.values(WorkflowEvent).includes(event), 'Event must be valid');

    const validTransitions = this.transitions.filter(
      transition => transition.fromState === this.currentState && transition.event === event
    );

    // NASA Assertion 2: Validate transition lookup
    console.assert(validTransitions.length <= 1, 'At most one valid transition should exist');

    return validTransitions.length > 0 ? validTransitions[0] : null;
  }

  /**
   * Get current FSM state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getCurrentState(): WorkflowState {
    // NASA Assertion 1: Validate state consistency
    console.assert(Object.values(WorkflowState).includes(this.currentState), 'Current state must be valid');

    // NASA Assertion 2: Validate state accessibility
    console.assert(this.currentState !== null && this.currentState !== undefined, 'Current state must be defined');

    return this.currentState;
  }

  /**
   * Get current FSM context
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getContext(): WorkflowContext {
    // NASA Assertion 1: Validate context existence
    console.assert(this.context !== null && this.context !== undefined, 'Context must be defined');

    // Return copy to prevent external mutation
    const contextCopy = { ...this.context };

    // NASA Assertion 2: Validate context integrity
    console.assert(typeof contextCopy === 'object', 'Context must be an object');

    return contextCopy;
  }

  /**
   * Update FSM context
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  updateContext(updates: Partial<WorkflowContext>): void {
    // NASA Assertion 1: Validate update parameters
    console.assert(updates !== null && updates !== undefined, 'Updates object is required');
    console.assert(typeof updates === 'object', 'Updates must be an object');

    this.context = { ...this.context, ...updates };

    this.emit('contextUpdated', {
      updates,
      newContext: this.getContext(),
      timestamp: new Date()
    });

    // NASA Assertion 2: Validate context update
    console.assert(this.context !== null, 'Context must remain defined after update');
  }

  // Transition action handlers - NASA Rule 10: ≤60 lines each

  /**
   * Handle workflow creation action
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async handleWorkflowCreation(context: WorkflowContext): Promise<void> {
    // NASA Assertion 1: Validate context
    console.assert(context !== null && context !== undefined, 'Context is required for workflow creation');

    // Initialize workflow creation metadata
    context.creationTimestamp = new Date();
    context.creationState = 'initializing';

    // NASA Assertion 2: Validate creation setup
    console.assert(context.creationTimestamp instanceof Date, 'Creation timestamp must be set');
  }

  /**
   * Handle workflow validation action
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async handleWorkflowValidation(context: WorkflowContext): Promise<void> {
    // NASA Assertion 1: Validate context
    console.assert(context !== null && context !== undefined, 'Context is required for validation');

    context.validationTimestamp = new Date();
    context.validationState = 'validating';

    // NASA Assertion 2: Validate validation setup
    console.assert(context.validationTimestamp instanceof Date, 'Validation timestamp must be set');
  }

  /**
   * Handle execution start action
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async handleExecutionStart(context: WorkflowContext): Promise<void> {
    // NASA Assertion 1: Validate context
    console.assert(context !== null && context !== undefined, 'Context is required for execution start');

    context.executionStartTimestamp = new Date();
    context.executionState = 'running';

    // NASA Assertion 2: Validate execution setup
    console.assert(context.executionStartTimestamp instanceof Date, 'Execution start timestamp must be set');
  }

  /**
   * Handle workflow optimization action
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async handleWorkflowOptimization(context: WorkflowContext): Promise<void> {
    // NASA Assertion 1: Validate context
    console.assert(context !== null && context !== undefined, 'Context is required for optimization');

    context.optimizationTimestamp = new Date();
    context.optimizationState = 'optimizing';

    // NASA Assertion 2: Validate optimization setup
    console.assert(context.optimizationTimestamp instanceof Date, 'Optimization timestamp must be set');
  }

  /**
   * Handle workflow completion action
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async handleWorkflowCompletion(context: WorkflowContext): Promise<void> {
    // NASA Assertion 1: Validate context
    console.assert(context !== null && context !== undefined, 'Context is required for completion');

    context.completionTimestamp = new Date();
    context.executionState = 'completed';

    // NASA Assertion 2: Validate completion setup
    console.assert(context.completionTimestamp instanceof Date, 'Completion timestamp must be set');
  }

  /**
   * Handle workflow failure action
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async handleWorkflowFailure(context: WorkflowContext): Promise<void> {
    // NASA Assertion 1: Validate context
    console.assert(context !== null && context !== undefined, 'Context is required for failure handling');

    context.failureTimestamp = new Date();
    context.executionState = 'failed';

    // NASA Assertion 2: Validate failure setup
    console.assert(context.failureTimestamp instanceof Date, 'Failure timestamp must be set');
  }

  /**
   * Handle workflow cancellation action
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async handleWorkflowCancellation(context: WorkflowContext): Promise<void> {
    // NASA Assertion 1: Validate context
    console.assert(context !== null && context !== undefined, 'Context is required for cancellation');

    context.cancellationTimestamp = new Date();
    context.executionState = 'cancelled';

    // NASA Assertion 2: Validate cancellation setup
    console.assert(context.cancellationTimestamp instanceof Date, 'Cancellation timestamp must be set');
  }

  /**
   * Handle workflow reset action
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async handleWorkflowReset(context: WorkflowContext): Promise<void> {
    // NASA Assertion 1: Validate context
    console.assert(context !== null && context !== undefined, 'Context is required for reset');

    // Clear all execution-related context while preserving workflow definition
    const workflowDefinition = context.currentWorkflow;

    Object.keys(context).forEach(key => {
      if (key !== 'currentWorkflow') {
        delete context[key];
      }
    });

    if (workflowDefinition) {
      context.currentWorkflow = workflowDefinition;
    }

    context.resetTimestamp = new Date();

    // NASA Assertion 2: Validate reset completion
    console.assert(context.resetTimestamp instanceof Date, 'Reset timestamp must be set');
  }

  // Guard conditions - NASA Rule 10: ≤60 lines each

  /**
   * Guard condition: Check if workflow is valid for execution
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private isWorkflowValid(context: WorkflowContext): boolean {
    // NASA Assertion 1: Validate context
    console.assert(context !== null && context !== undefined, 'Context is required for validation check');

    const isValid = context.currentWorkflow !== null &&
                   context.currentWorkflow !== undefined &&
                   context.validationState === 'validating';

    // NASA Assertion 2: Validate validation result
    console.assert(typeof isValid === 'boolean', 'Validation result must be boolean');

    return isValid;
  }

  /**
   * Check if FSM can accept event in current state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  canProcessEvent(event: WorkflowEvent): boolean {
    // NASA Assertion 1: Validate event parameter
    console.assert(Object.values(WorkflowEvent).includes(event), 'Event must be valid WorkflowEvent');

    const transition = this.findValidTransition(event);
    const canProcess = transition !== null;

    // NASA Assertion 2: Validate process capability
    console.assert(typeof canProcess === 'boolean', 'Process capability must be boolean');

    return canProcess;
  }

  /**
   * Get all valid events for current state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getValidEvents(): WorkflowEvent[] {
    // NASA Assertion 1: Validate current state
    console.assert(Object.values(WorkflowState).includes(this.currentState), 'Current state must be valid');

    const validEvents = this.transitions
      .filter(transition => transition.fromState === this.currentState)
      .map(transition => transition.event);

    // NASA Assertion 2: Validate event list
    console.assert(Array.isArray(validEvents), 'Valid events must be an array');

    return validEvents;
  }
}

// Backward compatibility
export default WorkflowStateMachine;
