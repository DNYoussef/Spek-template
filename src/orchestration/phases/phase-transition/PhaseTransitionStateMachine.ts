/**
 * Phase Transition State Machine - FSM-First Implementation
 * NASA Rule 10 Compliant: Functions ≤60 lines, no recursion, fixed bounds
 */

import {
  PhaseState,
  PhaseEvent,
  TransitionState,
  TransitionEvent,
  PhaseTransitionContext,
  PhaseExecution,
  TransitionExecution
} from './PhaseTransitionTypes';

// State machine configuration
interface StateTransition<S, E> {
  from: S;
  event: E;
  to: S;
  guard?: (context: PhaseTransitionContext) => boolean;
  action?: (context: PhaseTransitionContext) => void;
}

interface StateMachineConfig<S, E> {
  initialState: S;
  transitions: StateTransition<S, E>[];
  states: S[];
  events: E[];
}

/**
 * Phase State Machine Implementation
 * NASA Rule 10: Function ≤60 lines, 2+ assertions
 */
export class PhaseStateMachine {
  private currentState: PhaseState;
  private readonly config: StateMachineConfig<PhaseState, PhaseEvent>;

  constructor(initialState: PhaseState = PhaseState.PLANNED) {
    // NASA Rule 10: Assertions
    console.assert(initialState !== null, 'Initial state cannot be null');
    console.assert(Object.values(PhaseState).includes(initialState), 'Invalid initial state');

    this.currentState = initialState;
    this.config = this.createPhaseStateMachineConfig();
  }

  /**
   * Create phase state machine configuration
   * NASA Rule 10: ≤60 lines, fixed bounds
   */
  private createPhaseStateMachineConfig(): StateMachineConfig<PhaseState, PhaseEvent> {
    // NASA Rule 10: Assertions
    console.assert(Object.keys(PhaseState).length <= 10, 'Too many phase states');

    const transitions: StateTransition<PhaseState, PhaseEvent>[] = [
      { from: PhaseState.PLANNED, event: PhaseEvent.START_PHASE, to: PhaseState.STARTING },
      { from: PhaseState.STARTING, event: PhaseEvent.PREREQUISITES_VALIDATED, to: PhaseState.IN_PROGRESS },
      { from: PhaseState.STARTING, event: PhaseEvent.VALIDATION_FAILED, to: PhaseState.FAILED },
      { from: PhaseState.IN_PROGRESS, event: PhaseEvent.PHASE_EXECUTION_COMPLETED, to: PhaseState.VALIDATING },
      { from: PhaseState.IN_PROGRESS, event: PhaseEvent.PHASE_FAILED, to: PhaseState.FAILED },
      { from: PhaseState.VALIDATING, event: PhaseEvent.VALIDATION_COMPLETED, to: PhaseState.COMPLETED },
      { from: PhaseState.VALIDATING, event: PhaseEvent.VALIDATION_FAILED, to: PhaseState.FAILED },
      { from: PhaseState.FAILED, event: PhaseEvent.ROLLBACK_INITIATED, to: PhaseState.ROLLED_BACK },
      // Emergency transitions
      { from: PhaseState.STARTING, event: PhaseEvent.CANCEL_PHASE, to: PhaseState.CANCELLED },
      { from: PhaseState.IN_PROGRESS, event: PhaseEvent.CANCEL_PHASE, to: PhaseState.CANCELLED },
      { from: PhaseState.VALIDATING, event: PhaseEvent.CANCEL_PHASE, to: PhaseState.CANCELLED }
    ];

    return {
      initialState: PhaseState.PLANNED,
      transitions,
      states: Object.values(PhaseState),
      events: Object.values(PhaseEvent)
    };
  }

  /**
   * Process phase event
   * NASA Rule 10: ≤60 lines, 2+ assertions, fixed bounds
   */
  processEvent(event: PhaseEvent, context: PhaseTransitionContext): boolean {
    // NASA Rule 10: Assertions
    console.assert(event !== null, 'Event cannot be null');
    console.assert(this.config.events.includes(event), 'Invalid event');

    const validTransitions = this.findValidTransitions(event);

    if (validTransitions.length === 0) {
      return false;
    }

    // Single transition expected (no non-determinism)
    const transition = validTransitions[0];

    // Execute guard if present
    if (transition.guard && !transition.guard(context)) {
      return false;
    }

    // Execute action if present
    if (transition.action) {
      transition.action(context);
    }

    this.currentState = transition.to;
    return true;
  }

  /**
   * Find valid transitions for current state and event
   * NASA Rule 10: ≤60 lines, fixed bounds
   */
  private findValidTransitions(event: PhaseEvent): StateTransition<PhaseState, PhaseEvent>[] {
    // NASA Rule 10: Assertions
    console.assert(this.config.transitions.length <= 50, 'Too many transitions');

    const validTransitions: StateTransition<PhaseState, PhaseEvent>[] = [];

    for (let i = 0; i < this.config.transitions.length; i++) {
      const transition = this.config.transitions[i];
      if (transition.from === this.currentState && transition.event === event) {
        validTransitions.push(transition);
      }
    }

    return validTransitions;
  }

  /**
   * Check if transition is valid
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  canTransition(event: PhaseEvent): boolean {
    // NASA Rule 10: Assertions
    console.assert(event !== null, 'Event cannot be null');
    console.assert(this.config.events.includes(event), 'Invalid event');

    return this.findValidTransitions(event).length > 0;
  }

  /**
   * Get current state
   * NASA Rule 10: ≤60 lines, 1+ assertion
   */
  getCurrentState(): PhaseState {
    console.assert(this.currentState !== null, 'Current state cannot be null');
    return this.currentState;
  }

  /**
   * Reset to initial state
   * NASA Rule 10: ≤60 lines, 1+ assertion
   */
  reset(): void {
    console.assert(this.config.initialState !== null, 'Initial state cannot be null');
    this.currentState = this.config.initialState;
  }

  /**
   * Check if in final state
   * NASA Rule 10: ≤60 lines, 1+ assertion
   */
  isInFinalState(): boolean {
    console.assert(this.currentState !== null, 'Current state cannot be null');

    const finalStates = [
      PhaseState.COMPLETED,
      PhaseState.FAILED,
      PhaseState.CANCELLED,
      PhaseState.ROLLED_BACK
    ];

    return finalStates.includes(this.currentState);
  }
}

/**
 * Transition State Machine Implementation
 * NASA Rule 10: Functions ≤60 lines, 2+ assertions
 */
export class TransitionStateMachine {
  private currentState: TransitionState;
  private readonly config: StateMachineConfig<TransitionState, TransitionEvent>;

  constructor(initialState: TransitionState = TransitionState.PLANNED) {
    // NASA Rule 10: Assertions
    console.assert(initialState !== null, 'Initial state cannot be null');
    console.assert(Object.values(TransitionState).includes(initialState), 'Invalid initial state');

    this.currentState = initialState;
    this.config = this.createTransitionStateMachineConfig();
  }

  /**
   * Create transition state machine configuration
   * NASA Rule 10: ≤60 lines, fixed bounds
   */
  private createTransitionStateMachineConfig(): StateMachineConfig<TransitionState, TransitionEvent> {
    // NASA Rule 10: Assertions
    console.assert(Object.keys(TransitionState).length <= 10, 'Too many transition states');

    const transitions: StateTransition<TransitionState, TransitionEvent>[] = [
      { from: TransitionState.PLANNED, event: TransitionEvent.START_TRANSITION, to: TransitionState.VALIDATING_PREREQUISITES },
      { from: TransitionState.VALIDATING_PREREQUISITES, event: TransitionEvent.PREREQUISITES_VALIDATED, to: TransitionState.EXECUTING },
      { from: TransitionState.VALIDATING_PREREQUISITES, event: TransitionEvent.TRANSITION_FAILED, to: TransitionState.FAILED },
      { from: TransitionState.EXECUTING, event: TransitionEvent.EXECUTION_COMPLETED, to: TransitionState.VALIDATING_COMPLETION },
      { from: TransitionState.EXECUTING, event: TransitionEvent.TRANSITION_FAILED, to: TransitionState.FAILED },
      { from: TransitionState.VALIDATING_COMPLETION, event: TransitionEvent.COMPLETION_VALIDATED, to: TransitionState.COMPLETED },
      { from: TransitionState.VALIDATING_COMPLETION, event: TransitionEvent.TRANSITION_FAILED, to: TransitionState.FAILED },
      { from: TransitionState.FAILED, event: TransitionEvent.ROLLBACK_INITIATED, to: TransitionState.ROLLED_BACK }
    ];

    return {
      initialState: TransitionState.PLANNED,
      transitions,
      states: Object.values(TransitionState),
      events: Object.values(TransitionEvent)
    };
  }

  /**
   * Process transition event
   * NASA Rule 10: ≤60 lines, 2+ assertions, fixed bounds
   */
  processEvent(event: TransitionEvent, context: PhaseTransitionContext): boolean {
    // NASA Rule 10: Assertions
    console.assert(event !== null, 'Event cannot be null');
    console.assert(this.config.events.includes(event), 'Invalid event');

    const validTransitions = this.findValidTransitions(event);

    if (validTransitions.length === 0) {
      return false;
    }

    const transition = validTransitions[0];

    if (transition.guard && !transition.guard(context)) {
      return false;
    }

    if (transition.action) {
      transition.action(context);
    }

    this.currentState = transition.to;
    return true;
  }

  /**
   * Find valid transitions for current state and event
   * NASA Rule 10: ≤60 lines, fixed bounds
   */
  private findValidTransitions(event: TransitionEvent): StateTransition<TransitionState, TransitionEvent>[] {
    // NASA Rule 10: Assertions
    console.assert(this.config.transitions.length <= 30, 'Too many transitions');

    const validTransitions: StateTransition<TransitionState, TransitionEvent>[] = [];

    for (let i = 0; i < this.config.transitions.length; i++) {
      const transition = this.config.transitions[i];
      if (transition.from === this.currentState && transition.event === event) {
        validTransitions.push(transition);
      }
    }

    return validTransitions;
  }

  /**
   * Get current state
   * NASA Rule 10: ≤60 lines, 1+ assertion
   */
  getCurrentState(): TransitionState {
    console.assert(this.currentState !== null, 'Current state cannot be null');
    return this.currentState;
  }

  /**
   * Check if transition is valid
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  canTransition(event: TransitionEvent): boolean {
    console.assert(event !== null, 'Event cannot be null');
    console.assert(this.config.events.includes(event), 'Invalid event');

    return this.findValidTransitions(event).length > 0;
  }

  /**
   * Reset to initial state
   * NASA Rule 10: ≤60 lines, 1+ assertion
   */
  reset(): void {
    console.assert(this.config.initialState !== null, 'Initial state cannot be null');
    this.currentState = this.config.initialState;
  }

  /**
   * Check if in final state
   * NASA Rule 10: ≤60 lines, 1+ assertion
   */
  isInFinalState(): boolean {
    console.assert(this.currentState !== null, 'Current state cannot be null');

    const finalStates = [
      TransitionState.COMPLETED,
      TransitionState.FAILED,
      TransitionState.ROLLED_BACK
    ];

    return finalStates.includes(this.currentState);
  }
}

/**
 * Centralized Transition Hub
 * NASA Rule 10: All state changes go through single hub
 */
export class PhaseTransitionHub {
  private phaseStateMachines: Map<string, PhaseStateMachine>;
  private transitionStateMachines: Map<string, TransitionStateMachine>;

  constructor() {
    // NASA Rule 10: Assertions
    this.phaseStateMachines = new Map();
    this.transitionStateMachines = new Map();

    console.assert(this.phaseStateMachines !== null, 'Phase state machines map cannot be null');
    console.assert(this.transitionStateMachines !== null, 'Transition state machines map cannot be null');
  }

  /**
   * Register phase state machine
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  registerPhaseStateMachine(executionId: string, stateMachine: PhaseStateMachine): void {
    console.assert(executionId !== null && executionId.length > 0, 'Execution ID cannot be null or empty');
    console.assert(stateMachine !== null, 'State machine cannot be null');

    this.phaseStateMachines.set(executionId, stateMachine);
  }

  /**
   * Register transition state machine
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  registerTransitionStateMachine(executionId: string, stateMachine: TransitionStateMachine): void {
    console.assert(executionId !== null && executionId.length > 0, 'Execution ID cannot be null or empty');
    console.assert(stateMachine !== null, 'State machine cannot be null');

    this.transitionStateMachines.set(executionId, stateMachine);
  }

  /**
   * Process phase event through hub
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  processPhaseEvent(executionId: string, event: PhaseEvent, context: PhaseTransitionContext): boolean {
    console.assert(executionId !== null && executionId.length > 0, 'Execution ID cannot be null or empty');
    console.assert(event !== null, 'Event cannot be null');

    const stateMachine = this.phaseStateMachines.get(executionId);
    if (!stateMachine) {
      return false;
    }

    return stateMachine.processEvent(event, context);
  }

  /**
   * Process transition event through hub
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  processTransitionEvent(executionId: string, event: TransitionEvent, context: PhaseTransitionContext): boolean {
    console.assert(executionId !== null && executionId.length > 0, 'Execution ID cannot be null or empty');
    console.assert(event !== null, 'Event cannot be null');

    const stateMachine = this.transitionStateMachines.get(executionId);
    if (!stateMachine) {
      return false;
    }

    return stateMachine.processEvent(event, context);
  }

  /**
   * Get phase state
   * NASA Rule 10: ≤60 lines, 1+ assertion
   */
  getPhaseState(executionId: string): PhaseState | null {
    console.assert(executionId !== null && executionId.length > 0, 'Execution ID cannot be null or empty');

    const stateMachine = this.phaseStateMachines.get(executionId);
    return stateMachine ? stateMachine.getCurrentState() : null;
  }

  /**
   * Get transition state
   * NASA Rule 10: ≤60 lines, 1+ assertion
   */
  getTransitionState(executionId: string): TransitionState | null {
    console.assert(executionId !== null && executionId.length > 0, 'Execution ID cannot be null or empty');

    const stateMachine = this.transitionStateMachines.get(executionId);
    return stateMachine ? stateMachine.getCurrentState() : null;
  }

  /**
   * Clean up completed executions
   * NASA Rule 10: ≤60 lines, fixed bounds
   */
  cleanup(): void {
    // NASA Rule 10: Fixed loop bounds
    const phaseExecutions = Array.from(this.phaseStateMachines.entries());
    for (let i = 0; i < phaseExecutions.length && i < 100; i++) {
      const [executionId, stateMachine] = phaseExecutions[i];
      if (stateMachine.isInFinalState()) {
        this.phaseStateMachines.delete(executionId);
      }
    }

    const transitionExecutions = Array.from(this.transitionStateMachines.entries());
    for (let i = 0; i < transitionExecutions.length && i < 100; i++) {
      const [executionId, stateMachine] = transitionExecutions[i];
      if (stateMachine.isInFinalState()) {
        this.transitionStateMachines.delete(executionId);
      }
    }
  }
}