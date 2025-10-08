/**
 * A2A Communication State Machine
 * NASA Rule 10 Compliant FSM Implementation
 */

import {
  A2ACommState,
  A2ACommEvent,
  StateTransition,
  AgentMessage,
  OptimizedCommunication
} from '../interfaces/types';

interface StateContext {
  currentMessage?: AgentMessage;
  processingAttempts: number;
  errorCount: number;
  lastError?: Error;
  optimizationResult?: OptimizedCommunication;
}

export class A2AStateMachine {
  private currentState: A2ACommState = A2ACommState.INITIALIZING;
  private context: StateContext = { processingAttempts: 0, errorCount: 0 };
  private transitions: StateTransition[] = [];

  constructor() {
    this.initializeTransitions();
    assert(this.transitions.length > 0, 'State transitions must be initialized');
    assert(this.currentState === A2ACommState.INITIALIZING, 'Initial state must be INITIALIZING');
  }

  /**
   * Initialize all valid state transitions
   * Fixed transition table - no dynamic modifications
   */
  private initializeTransitions(): void {
    // Maximum 20 transitions for bounded complexity
    const maxTransitions = 20;
    const transitionDefinitions: StateTransition[] = [
      // From INITIALIZING
      { from: A2ACommState.INITIALIZING, event: A2ACommEvent.INITIALIZE, to: A2ACommState.ANALYZING_CONTEXT },
      { from: A2ACommState.INITIALIZING, event: A2ACommEvent.ERROR_DETECTED, to: A2ACommState.ERROR_RECOVERY },

      // From ANALYZING_CONTEXT
      { from: A2ACommState.ANALYZING_CONTEXT, event: A2ACommEvent.CONTEXT_READY, to: A2ACommState.OPTIMIZING_MESSAGE },
      { from: A2ACommState.ANALYZING_CONTEXT, event: A2ACommEvent.ERROR_DETECTED, to: A2ACommState.ERROR_RECOVERY },

      // From OPTIMIZING_MESSAGE
      { from: A2ACommState.OPTIMIZING_MESSAGE, event: A2ACommEvent.MESSAGE_OPTIMIZED, to: A2ACommState.VALIDATING_QUALITY },
      { from: A2ACommState.OPTIMIZING_MESSAGE, event: A2ACommEvent.ERROR_DETECTED, to: A2ACommState.ERROR_RECOVERY },

      // From VALIDATING_QUALITY
      { from: A2ACommState.VALIDATING_QUALITY, event: A2ACommEvent.QUALITY_VALIDATED, to: A2ACommState.TRANSMITTING },
      { from: A2ACommState.VALIDATING_QUALITY, event: A2ACommEvent.ERROR_DETECTED, to: A2ACommState.ERROR_RECOVERY },

      // From TRANSMITTING
      { from: A2ACommState.TRANSMITTING, event: A2ACommEvent.TRANSMISSION_COMPLETE, to: A2ACommState.MONITORING_FEEDBACK },
      { from: A2ACommState.TRANSMITTING, event: A2ACommEvent.ERROR_DETECTED, to: A2ACommState.ERROR_RECOVERY },

      // From MONITORING_FEEDBACK
      { from: A2ACommState.MONITORING_FEEDBACK, event: A2ACommEvent.FEEDBACK_RECEIVED, to: A2ACommState.INITIALIZING },
      { from: A2ACommState.MONITORING_FEEDBACK, event: A2ACommEvent.ERROR_DETECTED, to: A2ACommState.ERROR_RECOVERY },

      // From ERROR_RECOVERY
      { from: A2ACommState.ERROR_RECOVERY, event: A2ACommEvent.RESET, to: A2ACommState.INITIALIZING },
      { from: A2ACommState.ERROR_RECOVERY, event: A2ACommEvent.INITIALIZE, to: A2ACommState.ANALYZING_CONTEXT }
    ];

    // Fixed bounds: only take first maxTransitions entries
    for (let i = 0; i < Math.min(transitionDefinitions.length, maxTransitions); i++) {
      this.transitions.push(transitionDefinitions[i]);
    }

    assert(this.transitions.length <= maxTransitions, 'Transition count must not exceed maximum');
    assert(this.transitions.length > 0, 'At least one transition must be defined');
  }

  /**
   * Process an event and transition state if valid
   * NASA Rule 10: Fixed loop bounds, assertions
   */
  processEvent(event: A2ACommEvent, data?: any): boolean {
    assert(Object.values(A2ACommEvent).includes(event), 'Event must be valid A2ACommEvent');

    const validTransition = this.findValidTransition(event);
    if (!validTransition) {
      this.context.errorCount++;
      return false;
    }

    const oldState = this.currentState;
    this.currentState = validTransition.to;

    // Execute transition action if defined
    if (validTransition.action) {
      validTransition.action(this.context);
    }

    // Update context based on new state
    this.updateContextForState(data);

    assert(this.currentState !== oldState || event === A2ACommEvent.RESET, 'State must change unless reset');
    return true;
  }

  /**
   * Find valid transition for current state and event
   * Fixed bounds: maximum 20 transitions to check
   */
  private findValidTransition(event: A2ACommEvent): StateTransition | null {
    const maxTransitionsToCheck = 20;

    for (let i = 0; i < Math.min(this.transitions.length, maxTransitionsToCheck); i++) {
      const transition = this.transitions[i];

      if (transition.from === this.currentState && transition.event === event) {
        // Check guard condition if present
        if (transition.guard && !transition.guard(this.context)) {
          continue;
        }
        return transition;
      }
    }

    return null;
  }

  /**
   * Update context based on current state
   * NASA Rule 10: No recursion, fixed execution paths
   */
  private updateContextForState(data?: any): void {
    assert(Object.values(A2ACommState).includes(this.currentState), 'Current state must be valid');

    switch (this.currentState) {
      case A2ACommState.INITIALIZING:
        this.context.processingAttempts = 0;
        this.context.errorCount = 0;
        this.context.lastError = undefined;
        break;

      case A2ACommState.ANALYZING_CONTEXT:
        this.context.processingAttempts++;
        if (data && data.message) {
          this.context.currentMessage = data.message;
        }
        break;

      case A2ACommState.OPTIMIZING_MESSAGE:
        // Increment attempts, bounded by maximum
        if (this.context.processingAttempts < 10) {
          this.context.processingAttempts++;
        }
        break;

      case A2ACommState.VALIDATING_QUALITY:
        // No context updates needed for validation
        break;

      case A2ACommState.TRANSMITTING:
        if (data && data.optimizationResult) {
          this.context.optimizationResult = data.optimizationResult;
        }
        break;

      case A2ACommState.MONITORING_FEEDBACK:
        // Reset processing attempts after successful transmission
        this.context.processingAttempts = 0;
        break;

      case A2ACommState.ERROR_RECOVERY:
        this.context.errorCount++;
        if (data && data.error) {
          this.context.lastError = data.error;
        }
        break;

      default:
        assert(false, 'Unknown state encountered in updateContextForState');
    }

    assert(this.context.processingAttempts >= 0, 'Processing attempts must be non-negative');
    assert(this.context.errorCount >= 0, 'Error count must be non-negative');
  }

  /**
   * Get current state and context information
   */
  getState(): { state: A2ACommState; context: StateContext } {
    return {
      state: this.currentState,
      context: { ...this.context }
    };
  }

  /**
   * Check if current state allows processing
   */
  canProcess(): boolean {
    const processingStates = [
      A2ACommState.ANALYZING_CONTEXT,
      A2ACommState.OPTIMIZING_MESSAGE,
      A2ACommState.VALIDATING_QUALITY,
      A2ACommState.TRANSMITTING
    ];

    return processingStates.includes(this.currentState) && this.context.errorCount < 5;
  }

  /**
   * Reset state machine to initial state
   */
  reset(): void {
    this.currentState = A2ACommState.INITIALIZING;
    this.context = { processingAttempts: 0, errorCount: 0 };

    assert(this.currentState === A2ACommState.INITIALIZING, 'State must be reset to INITIALIZING');
    assert(this.context.processingAttempts === 0, 'Processing attempts must be reset to 0');
  }

  /**
   * Validate state machine integrity
   */
  validateIntegrity(): boolean {
    assert(Object.values(A2ACommState).includes(this.currentState), 'Current state must be valid');
    assert(this.transitions.length > 0, 'Transitions must be initialized');
    assert(this.context.processingAttempts >= 0, 'Processing attempts must be non-negative');
    assert(this.context.errorCount >= 0, 'Error count must be non-negative');

    return true;
  }
}

/**
 * Assert function for NASA Rule 10 compliance
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: a2a-dspy-002
// inputs: ["types.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
// === END FOOTER ===