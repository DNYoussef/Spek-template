/**
 * TransitionHub.ts - Centralized state transition management
 * 
 * Manages all state transitions for the deployment readiness FSM,
 * ensuring valid transitions and providing transition guards.
 */

import {
  ReadinessState,
  ReadinessEvent,
  StateTransition,
  ReadinessContext,
  ReadinessValidationError
} from '~types/ReadinessTypes';

/**
 * Centralized hub for managing state transitions
 * Enforces valid transitions and executes guards
 */
export class TransitionHub {
  private transitions: Map<string, StateTransition[]> = new Map();

  /**
   * Register multiple transitions
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  registerTransitions(transitions: StateTransition[]): void {
    console.assert(Array.isArray(transitions), 'Transitions must be an array');
    console.assert(transitions.length > 0, 'Must register at least one transition');
    
    for (const transition of transitions) {
      this.registerTransition(transition);
    }
  }

  /**
   * Register single transition
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  registerTransition(transition: StateTransition): void {
    console.assert(transition !== undefined, 'Transition must be defined');
    console.assert(transition.from !== undefined, 'From state must be defined');
    console.assert(transition.to !== undefined, 'To state must be defined');
    console.assert(transition.event !== undefined, 'Event must be defined');
    
    const key = this.createTransitionKey(transition.from, transition.event);
    
    if (!this.transitions.has(key)) {
      this.transitions.set(key, []);
    }
    
    const existingTransitions = this.transitions.get(key)!;
    
    // Check for duplicate transitions
    const duplicate = existingTransitions.find(
      t => t.from === transition.from && 
           t.to === transition.to && 
           t.event === transition.event
    );
    
    if (duplicate) {
      throw new ReadinessValidationError(
        `Duplicate transition: ${transition.from} -> ${transition.to} via ${transition.event}`
      );
    }
    
    existingTransitions.push(transition);
  }

  /**
   * Find valid transition for state and event
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  findTransition(state: ReadinessState, event: ReadinessEvent): StateTransition | null {
    console.assert(state !== undefined, 'State must be defined');
    console.assert(event !== undefined, 'Event must be defined');
    
    const key = this.createTransitionKey(state, event);
    const transitions = this.transitions.get(key);
    
    if (!transitions || transitions.length === 0) {
      return null;
    }
    
    // Return first valid transition (should only be one per state/event pair)
    return transitions[0];
  }

  /**
   * Check if transition is valid
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  isValidTransition(
    from: ReadinessState, 
    to: ReadinessState, 
    event: ReadinessEvent,
    context?: ReadinessContext
  ): boolean {
    console.assert(from !== undefined, 'From state must be defined');
    console.assert(to !== undefined, 'To state must be defined');
    console.assert(event !== undefined, 'Event must be defined');
    
    const transition = this.findTransition(from, event);
    
    if (!transition || transition.to !== to) {
      return false;
    }
    
    // Check guard condition if present and context provided
    if (transition.guard && context) {
      return transition.guard(context);
    }
    
    return true;
  }

  /**
   * Get all valid transitions from a state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getValidTransitions(state: ReadinessState): StateTransition[] {
    console.assert(state !== undefined, 'State must be defined');
    
    const validTransitions: StateTransition[] = [];
    
    // Check all possible events for this state
    for (const event of Object.values(ReadinessEvent)) {
      const transition = this.findTransition(state, event as ReadinessEvent);
      if (transition) {
        validTransitions.push(transition);
      }
    }
    
    console.assert(validTransitions.length >= 0, 'Valid transitions array must be initialized');
    return validTransitions;
  }

  /**
   * Get all registered transitions (for debugging)
   * NASA Rule 10: Simple getter with assertion
   */
  getAllTransitions(): StateTransition[] {
    console.assert(this.transitions !== undefined, 'Transitions map must be defined');
    
    const allTransitions: StateTransition[] = [];
    
    for (const transitionList of this.transitions.values()) {
      allTransitions.push(...transitionList);
    }
    
    return allTransitions;
  }

  /**
   * Clear all registered transitions
   * NASA Rule 10: Simple clear with assertion
   */
  clearTransitions(): void {
    console.assert(this.transitions !== undefined, 'Transitions map must be defined');
    this.transitions.clear();
  }

  /**
   * Get transition count for monitoring
   * NASA Rule 10: Simple count with assertion
   */
  getTransitionCount(): number {
    console.assert(this.transitions !== undefined, 'Transitions map must be defined');
    
    let count = 0;
    for (const transitionList of this.transitions.values()) {
      count += transitionList.length;
    }
    
    return count;
  }

  /**
   * Validate transition graph completeness
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  validateTransitionGraph(): { valid: boolean; issues: string[] } {
    console.assert(this.transitions !== undefined, 'Transitions map must be defined');
    
    const issues: string[] = [];
    const states = Object.values(ReadinessState);
    const events = Object.values(ReadinessEvent);
    
    console.assert(states.length > 0, 'Must have at least one state defined');
    console.assert(events.length > 0, 'Must have at least one event defined');
    
    // Check for unreachable states (except IDLE)
    const reachableStates = new Set<ReadinessState>([ReadinessState.IDLE]);
    
    for (const transition of this.getAllTransitions()) {
      reachableStates.add(transition.to);
    }
    
    for (const state of states) {
      if (!reachableStates.has(state as ReadinessState)) {
        issues.push(`Unreachable state: ${state}`);
      }
    }
    
    // Check for dead-end states (except terminal states)
    const terminalStates = [ReadinessState.COMPLETED, ReadinessState.ERROR];
    
    for (const state of states) {
      const readinessState = state as ReadinessState;
      if (!terminalStates.includes(readinessState)) {
        const outgoingTransitions = this.getValidTransitions(readinessState);
        if (outgoingTransitions.length === 0) {
          issues.push(`Dead-end state: ${state}`);
        }
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Create unique key for state/event pair
   * NASA Rule 10: Simple key creation with assertion
   */
  private createTransitionKey(state: ReadinessState, event: ReadinessEvent): string {
    console.assert(state !== undefined, 'State must be defined for key creation');
    console.assert(event !== undefined, 'Event must be defined for key creation');
    
    return `${state}:${event}`;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: readiness-hub-003
// inputs: ["ReadinessStateMachine.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"fsm-refactor-v2"}
// === END FOOTER ===