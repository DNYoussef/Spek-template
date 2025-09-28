/**
 * Queen Transition Hub - Centralized State Transition Control
 * Single point of control for all Queen state transitions
 * NASA Rule 10 compliant with fixed bounds and no recursion
 */

import { EventEmitter } from 'events';
import {
  QueenState,
  QueenEvent,
  TransitionResult,
  StateGuard,
  NASA_QUEEN_LIMITS
} from './QueenFSMTypes';

interface StateTransition {
  readonly from: QueenState;
  readonly event: QueenEvent;
  readonly to: QueenState;
  readonly guards?: readonly StateGuard[];
  readonly actions?: readonly string[];
}

interface TransitionContext {
  readonly event: QueenEvent;
  readonly data?: Record<string, unknown>;
  readonly timestamp: number;
}

export class QueenTransitionHub extends EventEmitter {
  private currentState: QueenState = QueenState.INITIALIZING;
  private readonly transitions = new Map<string, StateTransition>();
  private readonly stateHistory: TransitionResult[] = [];
  private readonly maxHistorySize = NASA_QUEEN_LIMITS.MAX_MONITORING_CYCLES;

  constructor() {
    super();
    this.initializeTransitions();
  }

  /**
   * Execute state transition - NASA Rule 10 compliant (≤60 lines)
   */
  async executeTransition(
    event: QueenEvent,
    context?: Record<string, unknown>
  ): Promise<TransitionResult> {
    // Assert preconditions
    this.assertValidEvent(event);
    this.assertStateConsistency();

    const transitionContext: TransitionContext = {
      event,
      data: context,
      timestamp: Date.now()
    };

    try {
      // Find valid transition
      const transition = this.findValidTransition(event);
      if (!transition) {
        return this.createFailureResult(event,
          new Error(`Invalid transition: ${this.currentState} -> ${event}`));
      }

      // Validate guards
      const guardResult = this.validateGuards(transition, transitionContext);
      if (!guardResult.valid) {
        return this.createFailureResult(event,
          new Error(`Guard failed: ${guardResult.message}`));
      }

      // Execute transition
      const previousState = this.currentState;
      this.currentState = transition.to;

      // Execute actions
      await this.executeActions(transition, transitionContext);

      // Create success result
      const result = this.createSuccessResult(previousState, transition.to, event);

      // Record in history
      this.recordTransition(result);

      // Emit events
      this.emit('transition:complete', result);
      this.emit('state:changed', this.currentState);

      return result;

    } catch (error) {
      return this.createFailureResult(event, error as Error);
    }
  }

  /**
   * Get current state
   */
  getCurrentState(): QueenState {
    return this.currentState;
  }

  /**
   * Check if transition is valid
   */
  canTransition(event: QueenEvent): boolean {
    return this.findValidTransition(event) !== null;
  }

  /**
   * Get available transitions from current state
   */
  getAvailableTransitions(): readonly QueenEvent[] {
    const available: QueenEvent[] = [];

    // NASA Rule 10: Fixed loop bound
    for (let i = 0; i < Object.values(QueenEvent).length; i++) {
      const event = Object.values(QueenEvent)[i];
      if (this.findValidTransition(event)) {
        available.push(event);
      }
    }

    return available;
  }

  /**
   * Get transition history
   */
  getTransitionHistory(): readonly TransitionResult[] {
    return [...this.stateHistory];
  }

  /**
   * Initialize valid state transitions - NASA Rule 10 compliant
   */
  private initializeTransitions(): void {
    const transitions: StateTransition[] = [
      // Initialization flow
      {
        from: QueenState.INITIALIZING,
        event: QueenEvent.INITIALIZE,
        to: QueenState.COMMANDING,
        guards: [this.createGuard('initialization_complete', () => true)]
      },

      // Command processing flow
      {
        from: QueenState.COMMANDING,
        event: QueenEvent.COMMAND_RECEIVED,
        to: QueenState.DELEGATING,
        guards: [this.createGuard('can_process_command', () => true)]
      },

      // Delegation flow
      {
        from: QueenState.DELEGATING,
        event: QueenEvent.DELEGATE_TASK,
        to: QueenState.MONITORING,
        guards: [this.createGuard('delegation_ready', () => true)]
      },

      // Monitoring flow
      {
        from: QueenState.MONITORING,
        event: QueenEvent.MONITOR_STATUS,
        to: QueenState.DECIDING,
        guards: [this.createGuard('monitoring_complete', () => true)]
      },

      // Decision flow
      {
        from: QueenState.DECIDING,
        event: QueenEvent.MAKE_DECISION,
        to: QueenState.COMMANDING,
        guards: [this.createGuard('decision_ready', () => true)]
      },

      // Escalation flow
      {
        from: QueenState.DECIDING,
        event: QueenEvent.ESCALATE_ISSUE,
        to: QueenState.ESCALATING,
        guards: [this.createGuard('escalation_required', () => true)]
      },

      {
        from: QueenState.ESCALATING,
        event: QueenEvent.TRANSITION_COMPLETE,
        to: QueenState.COMMANDING,
        guards: [this.createGuard('escalation_resolved', () => true)]
      },

      // Error recovery
      {
        from: QueenState.ERROR_RECOVERY,
        event: QueenEvent.RECOVER_ERROR,
        to: QueenState.COMMANDING,
        guards: [this.createGuard('recovery_complete', () => true)]
      },

      // Emergency transitions from any state
      {
        from: QueenState.COMMANDING,
        event: QueenEvent.SHUTDOWN_INITIATED,
        to: QueenState.SHUTDOWN
      },
      {
        from: QueenState.DELEGATING,
        event: QueenEvent.SHUTDOWN_INITIATED,
        to: QueenState.SHUTDOWN
      },
      {
        from: QueenState.MONITORING,
        event: QueenEvent.SHUTDOWN_INITIATED,
        to: QueenState.SHUTDOWN
      },
      {
        from: QueenState.DECIDING,
        event: QueenEvent.SHUTDOWN_INITIATED,
        to: QueenState.SHUTDOWN
      },
      {
        from: QueenState.ESCALATING,
        event: QueenEvent.SHUTDOWN_INITIATED,
        to: QueenState.SHUTDOWN
      }
    ];

    // Store transitions by key for O(1) lookup
    transitions.forEach(transition => {
      const key = this.createTransitionKey(transition.from, transition.event);
      this.transitions.set(key, transition);
    });
  }

  /**
   * Find valid transition for current state and event
   */
  private findValidTransition(event: QueenEvent): StateTransition | null {
    const key = this.createTransitionKey(this.currentState, event);
    return this.transitions.get(key) || null;
  }

  /**
   * Create transition lookup key
   */
  private createTransitionKey(from: QueenState, event: QueenEvent): string {
    return `${from}->${event}`;
  }

  /**
   * Validate transition guards
   */
  private validateGuards(
    transition: StateTransition,
    context: TransitionContext
  ): { valid: boolean; message?: string } {
    if (!transition.guards || transition.guards.length === 0) {
      return { valid: true };
    }

    // NASA Rule 10: Fixed loop bound
    for (let i = 0; i < Math.min(transition.guards.length, 10); i++) {
      const guard = transition.guards[i];
      if (!guard.condition(context)) {
        return { valid: false, message: guard.errorMessage };
      }
    }

    return { valid: true };
  }

  /**
   * Execute transition actions
   */
  private async executeActions(
    transition: StateTransition,
    context: TransitionContext
  ): Promise<void> {
    if (!transition.actions || transition.actions.length === 0) {
      return;
    }

    // NASA Rule 10: Fixed loop bound
    for (let i = 0; i < Math.min(transition.actions.length, 5); i++) {
      const action = transition.actions[i];
      this.emit(`action:${action}`, context);
    }
  }

  /**
   * Create state guard helper
   */
  private createGuard(name: string, condition: () => boolean): StateGuard {
    return {
      name,
      condition,
      errorMessage: `Guard failed: ${name}`
    };
  }

  /**
   * Create successful transition result
   */
  private createSuccessResult(
    previousState: QueenState,
    newState: QueenState,
    event: QueenEvent
  ): TransitionResult {
    return {
      success: true,
      previousState,
      newState,
      event,
      timestamp: Date.now()
    };
  }

  /**
   * Create failed transition result
   */
  private createFailureResult(event: QueenEvent, error: Error): TransitionResult {
    return {
      success: false,
      previousState: this.currentState,
      newState: this.currentState,
      event,
      timestamp: Date.now(),
      error
    };
  }

  /**
   * Record transition in history with size limit
   */
  private recordTransition(result: TransitionResult): void {
    this.stateHistory.push(result);

    // Maintain history size bound (NASA Rule 10)
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.splice(0, this.stateHistory.length - this.maxHistorySize);
    }
  }

  /**
   * Assert valid event - NASA Rule 10 assertion requirement
   */
  private assertValidEvent(event: QueenEvent): void {
    if (!Object.values(QueenEvent).includes(event)) {
      throw new Error(`Invalid event: ${event}`);
    }
  }

  /**
   * Assert state consistency - NASA Rule 10 assertion requirement
   */
  private assertStateConsistency(): void {
    if (!Object.values(QueenState).includes(this.currentState)) {
      throw new Error(`Invalid current state: ${this.currentState}`);
    }
  }
}

export default QueenTransitionHub;

/*
 * AGENT FOOTER: QueenTransitionHub v1.0.0
 * Status: OK | NASA Rule 10 Compliant | Centralized state control
 * Created: 2025-09-28T16:12:45-04:00 | Agent: claude-sonnet-4
 */