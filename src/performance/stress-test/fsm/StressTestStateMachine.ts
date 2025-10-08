/**
 * FSM State Machine for Stress Testing
 * Centralized state management with explicit transitions
 * NASA Rule 10 compliant: Fixed loop bounds and event processing
 */

import { EventEmitter } from 'events';
import {
  StressTestState,
  StressTestEvent,
  StressTestContext,
  StateTransition,
  StressTestConfig
} from '~types/StressTestTypes';

export class StressTestStateMachine extends EventEmitter {
  private currentState: StressTestState = StressTestState.IDLE;
  private context: StressTestContext | null = null;
  private transitions: Map<string, StateTransition> = new Map();
  private readonly MAX_RECOVERY_ATTEMPTS = 3; // NASA Rule 10: Fixed bound
  private readonly MAX_PHASE_RETRIES = 2; // NASA Rule 10: Fixed bound
  private readonly MAX_EVENT_QUEUE = 100; // NASA Rule 10: Fixed bound

  constructor() {
    super();
    this.initializeTransitions();
  }

  /**
   * Initialize all valid state transitions
   * NASA Rule 10: Fixed, bounded transition table
   */
  private initializeTransitions(): void {
    const transitionList: StateTransition[] = [
      // From IDLE
      { from: StressTestState.IDLE, event: StressTestEvent.START_TEST, to: StressTestState.INITIALIZING },

      // From INITIALIZING
      { from: StressTestState.INITIALIZING, event: StressTestEvent.SETUP_COMPLETE, to: StressTestState.SETTING_UP },
      { from: StressTestState.INITIALIZING, event: StressTestEvent.CRITICAL_ERROR, to: StressTestState.FAILED },

      // From SETTING_UP
      { from: StressTestState.SETTING_UP, event: StressTestEvent.MONITORING_READY, to: StressTestState.MONITORING_STARTED },
      { from: StressTestState.SETTING_UP, event: StressTestEvent.CRITICAL_ERROR, to: StressTestState.FAILED },

      // From MONITORING_STARTED
      { from: StressTestState.MONITORING_STARTED, event: StressTestEvent.START_PHASE, to: StressTestState.PHASE_RUNNING },
      { from: StressTestState.MONITORING_STARTED, event: StressTestEvent.STOP_TEST, to: StressTestState.TEARING_DOWN },

      // From PHASE_RUNNING
      { from: StressTestState.PHASE_RUNNING, event: StressTestEvent.PHASE_SUCCESS, to: StressTestState.PHASE_COMPLETED },
      { from: StressTestState.PHASE_RUNNING, event: StressTestEvent.PHASE_FAILURE, to: StressTestState.RECOVERING },
      { from: StressTestState.PHASE_RUNNING, event: StressTestEvent.STOP_TEST, to: StressTestState.TEARING_DOWN },
      { from: StressTestState.PHASE_RUNNING, event: StressTestEvent.CRITICAL_ERROR, to: StressTestState.FAILED },

      // From PHASE_COMPLETED
      { from: StressTestState.PHASE_COMPLETED, event: StressTestEvent.START_PHASE, to: StressTestState.PHASE_RUNNING },
      { from: StressTestState.PHASE_COMPLETED, event: StressTestEvent.TEARDOWN_COMPLETE, to: StressTestState.COMPLETED },
      { from: StressTestState.PHASE_COMPLETED, event: StressTestEvent.STOP_TEST, to: StressTestState.TEARING_DOWN },

      // From RECOVERING
      { from: StressTestState.RECOVERING, event: StressTestEvent.RECOVERY_COMPLETE, to: StressTestState.PHASE_RUNNING },
      { from: StressTestState.RECOVERING, event: StressTestEvent.RECOVERY_FAILED, to: StressTestState.FAILED },
      { from: StressTestState.RECOVERING, event: StressTestEvent.STOP_TEST, to: StressTestState.TEARING_DOWN },

      // From TEARING_DOWN
      { from: StressTestState.TEARING_DOWN, event: StressTestEvent.TEARDOWN_COMPLETE, to: StressTestState.STOPPED },
      { from: StressTestState.TEARING_DOWN, event: StressTestEvent.CRITICAL_ERROR, to: StressTestState.FAILED },

      // Terminal states transitions to IDLE
      { from: StressTestState.COMPLETED, event: StressTestEvent.START_TEST, to: StressTestState.INITIALIZING },
      { from: StressTestState.FAILED, event: StressTestEvent.START_TEST, to: StressTestState.INITIALIZING },
      { from: StressTestState.STOPPED, event: StressTestEvent.START_TEST, to: StressTestState.INITIALIZING }
    ];

    // NASA Rule 10: Process with fixed bound
    const MAX_TRANSITIONS = 50; // Fixed upper bound
    for (let i = 0; i < Math.min(transitionList.length, MAX_TRANSITIONS); i++) {
      const transition = transitionList[i];
      const key = this.getTransitionKey(transition.from, transition.event);
      this.transitions.set(key, transition);
    }
  }

  /**
   * Initialize test context
   */
  initializeTest(config: StressTestConfig): void {
    this.context = {
      config,
      currentPhaseIndex: 0,
      phaseResults: [],
      startTime: Date.now(),
      failures: [],
      recoveryAttempts: [],
      alerts: [],
      systemHealthHistory: []
    };
  }

  /**
   * Process state transition with guards and actions
   * NASA Rule 10: Bounded event processing
   */
  async transition(event: StressTestEvent): Promise<boolean> {
    if (!this.context) {
      throw new Error('State machine not initialized');
    }

    const key = this.getTransitionKey(this.currentState, event);
    const transition = this.transitions.get(key);

    if (!transition) {
      this.emit('invalid-transition', { from: this.currentState, event });
      return false;
    }

    // Check guard condition
    if (transition.guard && !transition.guard(this.context)) {
      this.emit('guard-failed', { from: this.currentState, event, guard: transition.guard.name });
      return false;
    }

    const previousState = this.currentState;
    this.currentState = transition.to;

    this.emit('state-changed', {
      from: previousState,
      to: this.currentState,
      event,
      timestamp: Date.now()
    });

    // Execute transition action
    if (transition.action) {
      try {
        await transition.action(this.context);
      } catch (error) {
        this.emit('action-error', { transition, error });
        // On action failure, trigger error handling
        if (this.currentState !== StressTestState.FAILED) {
          await this.transition(StressTestEvent.CRITICAL_ERROR);
        }
        return false;
      }
    }

    return true;
  }

  /**
   * Get current state
   */
  getCurrentState(): StressTestState {
    return this.currentState;
  }

  /**
   * Get test context
   */
  getContext(): StressTestContext | null {
    return this.context;
  }

  /**
   * Check if test is in terminal state
   */
  isTerminal(): boolean {
    return [
      StressTestState.COMPLETED,
      StressTestState.FAILED,
      StressTestState.STOPPED
    ].includes(this.currentState);
  }

  /**
   * Check if test is running
   */
  isRunning(): boolean {
    return [
      StressTestState.INITIALIZING,
      StressTestState.SETTING_UP,
      StressTestState.MONITORING_STARTED,
      StressTestState.PHASE_RUNNING,
      StressTestState.PHASE_COMPLETED,
      StressTestState.RECOVERING,
      StressTestState.TEARING_DOWN
    ].includes(this.currentState);
  }

  /**
   * Check if in recovery state
   */
  isRecovering(): boolean {
    return this.currentState === StressTestState.RECOVERING;
  }

  /**
   * Check if recovery attempts exceeded limit
   * NASA Rule 10: Fixed recovery limit
   */
  canAttemptRecovery(): boolean {
    if (!this.context) return false;
    return this.context.recoveryAttempts.length < this.MAX_RECOVERY_ATTEMPTS;
  }

  /**
   * Check if phase can be retried
   * NASA Rule 10: Fixed retry limit
   */
  canRetryPhase(): boolean {
    if (!this.context) return false;

    const currentPhase = this.context.config.phases[this.context.currentPhaseIndex];
    if (!currentPhase) return false;

    const phaseFailures = this.context.failures.filter(f => f.phase === currentPhase.name);
    return phaseFailures.length < this.MAX_PHASE_RETRIES;
  }

  /**
   * Advance to next phase
   * NASA Rule 10: Bounded phase iteration
   */
  advancePhase(): boolean {
    if (!this.context) return false;

    this.context.currentPhaseIndex++;
    const hasMorePhases = this.context.currentPhaseIndex < this.context.config.phases.length;

    if (!hasMorePhases) {
      this.context.endTime = Date.now();
    }

    return hasMorePhases;
  }

  /**
   * Get current phase
   */
  getCurrentPhase() {
    if (!this.context) return null;
    return this.context.config.phases[this.context.currentPhaseIndex] || null;
  }

  /**
   * Reset state machine to IDLE
   */
  reset(): void {
    this.currentState = StressTestState.IDLE;
    this.context = null;
    this.emit('reset');
  }

  /**
   * Get valid events for current state
   */
  getValidEvents(): StressTestEvent[] {
    const validEvents: StressTestEvent[] = [];

    // NASA Rule 10: Fixed iteration over events
    const allEvents = Object.values(StressTestEvent);
    const MAX_EVENTS = 20; // Fixed bound

    for (let i = 0; i < Math.min(allEvents.length, MAX_EVENTS); i++) {
      const event = allEvents[i];
      const key = this.getTransitionKey(this.currentState, event);
      if (this.transitions.has(key)) {
        validEvents.push(event);
      }
    }

    return validEvents;
  }

  /**
   * Generate transition key
   */
  private getTransitionKey(from: StressTestState, event: StressTestEvent): string {
    return `${from}->${event}`;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: stress_test_refactor_002
// inputs: ["StressTestTypes.ts"]
// tools_used: ["Write"]
// versions: {"model":"Sonnet 4","prompt":"v1.0"}
// === END FOOTER ===