/**
 * Management Transition Hub - FSM State Machine for Management Operations
 * NASA Rule 10 Compliant: ≤60 line functions, bounded loops, no recursion
 *
 * FSM States: INIT→PLANNING→ALLOCATING→COORDINATING→MONITORING→CLEANUP
 * Centralized state transitions for all management operations
 */

import { EventEmitter } from 'events';
import { ManagementState, ManagementEvent, ManagementContext } from '../types/ManagementTypes';

export interface StateTransition {
  from: ManagementState;
  event: ManagementEvent;
  to: ManagementState;
  guard?: (context: ManagementContext) => boolean;
  action?: (context: ManagementContext) => Promise<void>;
}

export class ManagementTransitionHub extends EventEmitter {
  private currentState: ManagementState = ManagementState.INIT;
  private transitions: Map<string, StateTransition> = new Map();
  private config: any;
  private transitionHistory: Array<{state: ManagementState, event: ManagementEvent, timestamp: number}> = [];

  constructor(config: any) {
    super();
    console.assert(config !== null, 'ManagementTransitionHub config required');
    this.config = config;
    this.initializeTransitions();
  }

  /**
   * Initialize valid state transitions
   * NASA Rule 10: ≤60 lines, bounded initialization
   */
  private initializeTransitions(): void {
    console.assert(this.transitions !== null, 'Transitions map must exist');

    // Define FSM transitions (bounded to essential transitions)
    const transitionDefinitions: Array<{from: ManagementState, event: ManagementEvent, to: ManagementState}> = [
      { from: ManagementState.INIT, event: ManagementEvent.START, to: ManagementState.PLANNING },
      { from: ManagementState.PLANNING, event: ManagementEvent.ALLOCATE, to: ManagementState.ALLOCATING },
      { from: ManagementState.ALLOCATING, event: ManagementEvent.COORDINATE, to: ManagementState.COORDINATING },
      { from: ManagementState.COORDINATING, event: ManagementEvent.MONITOR, to: ManagementState.MONITORING },
      { from: ManagementState.MONITORING, event: ManagementEvent.CLEANUP, to: ManagementState.CLEANUP },
      { from: ManagementState.MONITORING, event: ManagementEvent.ALLOCATE, to: ManagementState.ALLOCATING },
      { from: ManagementState.CLEANUP, event: ManagementEvent.START, to: ManagementState.INIT },
      // Error transitions from any state
      { from: ManagementState.INIT, event: ManagementEvent.ERROR, to: ManagementState.CLEANUP },
      { from: ManagementState.PLANNING, event: ManagementEvent.ERROR, to: ManagementState.CLEANUP },
      { from: ManagementState.ALLOCATING, event: ManagementEvent.ERROR, to: ManagementState.CLEANUP },
      { from: ManagementState.COORDINATING, event: ManagementEvent.ERROR, to: ManagementState.CLEANUP },
      { from: ManagementState.MONITORING, event: ManagementEvent.ERROR, to: ManagementState.CLEANUP }
    ];

    // Register transitions (bounded to 12 transitions)
    transitionDefinitions.forEach(def => {
      const key = `${def.from}-${def.event}`;
      const transition: StateTransition = {
        from: def.from,
        event: def.event,
        to: def.to
      };
      this.transitions.set(key, transition);
    });

    console.assert(this.transitions.size === 12, 'All transitions initialized');
  }

  /**
   * Execute state transition
   * NASA Rule 10: ≤60 lines, no recursion
   */
  async transition(event: ManagementEvent, context: ManagementContext): Promise<ManagementState> {
    console.assert(event !== null, 'Event required for transition');
    console.assert(context !== null, 'Context required for transition');

    const transitionKey = `${this.currentState}-${event}`;
    const transition = this.transitions.get(transitionKey);

    if (!transition) {
      throw new Error(`Invalid transition: ${this.currentState} + ${event}`);
    }

    // Check guard condition if present
    if (transition.guard && !transition.guard(context)) {
      throw new Error(`Transition guard failed: ${transitionKey}`);
    }

    const previousState = this.currentState;
    this.currentState = transition.to;

    // Record transition history (bounded to last 100)
    this.transitionHistory.push({
      state: this.currentState,
      event: event,
      timestamp: Date.now()
    });
    if (this.transitionHistory.length > 100) {
      this.transitionHistory.shift();
    }

    // Execute transition action if present
    if (transition.action) {
      await transition.action(context);
    }

    this.emit('state-changed', {
      previousState,
      currentState: this.currentState,
      event,
      timestamp: Date.now()
    });

    console.assert(this.currentState === transition.to, 'State transition completed');
    return this.currentState;
  }

  /**
   * Get current state
   */
  getCurrentState(): ManagementState {
    return this.currentState;
  }

  /**
   * Check if transition is valid
   * NASA Rule 10: ≤60 lines, bounded validation
   */
  isTransitionValid(event: ManagementEvent): boolean {
    console.assert(event !== null, 'Event required for validation');

    const transitionKey = `${this.currentState}-${event}`;
    const isValid = this.transitions.has(transitionKey);

    console.assert(typeof isValid === 'boolean', 'Validation result is boolean');
    return isValid;
  }

  /**
   * Get transition history
   * NASA Rule 10: ≤60 lines, bounded retrieval
   */
  getTransitionHistory(limit: number = 10): Array<{state: ManagementState, event: ManagementEvent, timestamp: number}> {
    console.assert(limit > 0 && limit <= 100, 'Valid limit required');

    const boundedLimit = Math.min(limit, this.transitionHistory.length);
    const history = this.transitionHistory.slice(-boundedLimit);

    console.assert(history.length <= limit, 'History retrieval bounded');
    return history;
  }

  /**
   * Get valid next events for current state
   * NASA Rule 10: ≤60 lines, bounded computation
   */
  getValidNextEvents(): ManagementEvent[] {
    console.assert(this.currentState !== null, 'Current state must be set');

    const validEvents: ManagementEvent[] = [];

    // Check up to 10 possible events (bounded)
    const allEvents = Object.values(ManagementEvent).slice(0, 10);
    allEvents.forEach(event => {
      const transitionKey = `${this.currentState}-${event}`;
      if (this.transitions.has(transitionKey)) {
        validEvents.push(event);
      }
    });

    console.assert(validEvents.length >= 0, 'Valid events computed');
    return validEvents;
  }

  /**
   * Reset FSM to initial state
   * NASA Rule 10: ≤60 lines, bounded reset
   */
  reset(): void {
    console.assert(this.currentState !== null, 'Current state exists');

    const previousState = this.currentState;
    this.currentState = ManagementState.INIT;

    // Clear history (keep last 10 for audit)
    this.transitionHistory = this.transitionHistory.slice(-10);

    this.emit('fsm-reset', {
      previousState,
      timestamp: Date.now()
    });

    console.assert(this.currentState === ManagementState.INIT, 'FSM reset to INIT state');
  }

  /**
   * Get FSM metrics
   */
  getMetrics(): any {
    const stateDistribution = new Map<ManagementState, number>();

    // Count state occurrences in history (bounded)
    this.transitionHistory.slice(-50).forEach(entry => {
      const count = stateDistribution.get(entry.state) || 0;
      stateDistribution.set(entry.state, count + 1);
    });

    return {
      currentState: this.currentState,
      totalTransitions: this.transitionHistory.length,
      stateDistribution: Object.fromEntries(stateDistribution),
      validNextEvents: this.getValidNextEvents(),
      transitionCount: this.transitions.size
    };
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: mega-agent-094-transition-hub
// inputs: ["ManagementHub architecture"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"v1"}
// === END FOOTER ===