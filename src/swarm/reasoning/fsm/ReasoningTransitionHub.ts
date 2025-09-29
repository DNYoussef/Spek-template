/**
 * Centralized Transition Hub for Reasoning FSM
 * Manages all state transitions in the reasoning pipeline
 */

import { EventEmitter } from 'events';
import { ReasoningState, ReasoningEvent, ReasoningStateData, ReasoningTransition } from './ReasoningStates';

export class ReasoningTransitionHub extends EventEmitter {
  private currentState: ReasoningState = ReasoningState.IDLE;
  private stateData: ReasoningStateData;
  private transitions: Map<string, ReasoningTransition> = new Map();

  constructor() {
    super();
    this.initializeStateData();
    this.defineTransitions();
  }

  /**
   * Process an event and execute state transition if valid
   */
  processEvent(event: ReasoningEvent, payload?: any): boolean {
    const transitionKey = `${this.currentState}-${event}`;
    const transition = this.transitions.get(transitionKey);

    if (!transition) {
      this.handleInvalidTransition(event, payload);
      return false;
    }

    if (transition.guard && !transition.guard(this.stateData, payload)) {
      this.emit('transition:blocked', {
        from: this.currentState,
        event,
        reason: 'Guard condition failed'
      });
      return false;
    }

    return this.executeTransition(transition, payload);
  }

  /**
   * Get current state
   */
  getCurrentState(): ReasoningState {
    return this.currentState;
  }

  /**
   * Get state data
   */
  getStateData(): ReasoningStateData {
    return this.stateData;
  }

  /**
   * Reset to idle state
   */
  reset(): void {
    this.currentState = ReasoningState.IDLE;
    this.initializeStateData();
    this.emit('state:reset');
  }

  private initializeStateData(): void {
    this.stateData = {
      currentState: ReasoningState.IDLE,
      evidence: new Map(),
      hypotheses: new Map(),
      beliefs: new Map(),
      analyses: new Map(),
      decisions: new Map(),
      biases: new Map(),
      redTeamResults: new Map(),
      context: {},
      errors: []
    };
  }

  private defineTransitions(): void {
    const transitions: ReasoningTransition[] = [
      // From IDLE
      { from: ReasoningState.IDLE, event: ReasoningEvent.EVIDENCE_RECEIVED, to: ReasoningState.EVIDENCE_COLLECTION },
      { from: ReasoningState.IDLE, event: ReasoningEvent.GENERATE_HYPOTHESES, to: ReasoningState.HYPOTHESIS_GENERATION },
      { from: ReasoningState.IDLE, event: ReasoningEvent.ANALYZE_DECISION, to: ReasoningState.DECISION_ANALYSIS },
      
      // From EVIDENCE_COLLECTION
      { from: ReasoningState.EVIDENCE_COLLECTION, event: ReasoningEvent.GENERATE_HYPOTHESES, to: ReasoningState.HYPOTHESIS_GENERATION },
      { from: ReasoningState.EVIDENCE_COLLECTION, event: ReasoningEvent.UPDATE_BELIEFS, to: ReasoningState.BELIEF_UPDATE },
      { from: ReasoningState.EVIDENCE_COLLECTION, event: ReasoningEvent.CHECK_BIASES, to: ReasoningState.BIAS_DETECTION },
      
      // From HYPOTHESIS_GENERATION
      { from: ReasoningState.HYPOTHESIS_GENERATION, event: ReasoningEvent.TEST_HYPOTHESIS, to: ReasoningState.HYPOTHESIS_TESTING },
      { from: ReasoningState.HYPOTHESIS_GENERATION, event: ReasoningEvent.CHECK_BIASES, to: ReasoningState.BIAS_DETECTION },
      
      // From HYPOTHESIS_TESTING
      { from: ReasoningState.HYPOTHESIS_TESTING, event: ReasoningEvent.UPDATE_BELIEFS, to: ReasoningState.BELIEF_UPDATE },
      { from: ReasoningState.HYPOTHESIS_TESTING, event: ReasoningEvent.SYNTHESIZE_RESULTS, to: ReasoningState.RESULTS_SYNTHESIS },
      
      // From BELIEF_UPDATE
      { from: ReasoningState.BELIEF_UPDATE, event: ReasoningEvent.CHECK_BIASES, to: ReasoningState.BIAS_DETECTION },
      { from: ReasoningState.BELIEF_UPDATE, event: ReasoningEvent.SYNTHESIZE_RESULTS, to: ReasoningState.RESULTS_SYNTHESIS },
      
      // From DECISION_ANALYSIS
      { from: ReasoningState.DECISION_ANALYSIS, event: ReasoningEvent.PERFORM_RED_TEAM, to: ReasoningState.RED_TEAM_ANALYSIS },
      { from: ReasoningState.DECISION_ANALYSIS, event: ReasoningEvent.CHECK_BIASES, to: ReasoningState.BIAS_DETECTION },
      { from: ReasoningState.DECISION_ANALYSIS, event: ReasoningEvent.SYNTHESIZE_RESULTS, to: ReasoningState.RESULTS_SYNTHESIS },
      
      // From BIAS_DETECTION
      { from: ReasoningState.BIAS_DETECTION, event: ReasoningEvent.SYNTHESIZE_RESULTS, to: ReasoningState.RESULTS_SYNTHESIS },
      
      // From RED_TEAM_ANALYSIS
      { from: ReasoningState.RED_TEAM_ANALYSIS, event: ReasoningEvent.SYNTHESIZE_RESULTS, to: ReasoningState.RESULTS_SYNTHESIS },
      
      // From RESULTS_SYNTHESIS
      { from: ReasoningState.RESULTS_SYNTHESIS, event: ReasoningEvent.COMPLETE, to: ReasoningState.IDLE },
      
      // Error transitions (from any state)
      { from: ReasoningState.EVIDENCE_COLLECTION, event: ReasoningEvent.ERROR, to: ReasoningState.ERROR_STATE },
      { from: ReasoningState.HYPOTHESIS_GENERATION, event: ReasoningEvent.ERROR, to: ReasoningState.ERROR_STATE },
      { from: ReasoningState.HYPOTHESIS_TESTING, event: ReasoningEvent.ERROR, to: ReasoningState.ERROR_STATE },
      { from: ReasoningState.BELIEF_UPDATE, event: ReasoningEvent.ERROR, to: ReasoningState.ERROR_STATE },
      { from: ReasoningState.DECISION_ANALYSIS, event: ReasoningEvent.ERROR, to: ReasoningState.ERROR_STATE },
      { from: ReasoningState.BIAS_DETECTION, event: ReasoningEvent.ERROR, to: ReasoningState.ERROR_STATE },
      { from: ReasoningState.RED_TEAM_ANALYSIS, event: ReasoningEvent.ERROR, to: ReasoningState.ERROR_STATE },
      { from: ReasoningState.RESULTS_SYNTHESIS, event: ReasoningEvent.ERROR, to: ReasoningState.ERROR_STATE },
      
      // Reset from any state
      { from: ReasoningState.ERROR_STATE, event: ReasoningEvent.RESET, to: ReasoningState.IDLE }
    ];

    for (const transition of transitions) {
      const key = `${transition.from}-${transition.event}`;
      this.transitions.set(key, transition);
    }
  }

  private executeTransition(transition: ReasoningTransition, payload?: any): boolean {
    try {
      const previousState = this.currentState;
      
      // Execute transition action if defined
      if (transition.action) {
        transition.action(this.stateData, payload);
      }
      
      // Update state
      this.currentState = transition.to;
      this.stateData.currentState = transition.to;
      
      this.emit('state:changed', {
        from: previousState,
        to: this.currentState,
        event: transition.event,
        payload
      });
      
      return true;
    } catch (error) {
      this.handleTransitionError(error as Error, transition);
      return false;
    }
  }

  private handleInvalidTransition(event: ReasoningEvent, payload?: any): void {
    this.emit('transition:invalid', {
      currentState: this.currentState,
      event,
      payload
    });
  }

  private handleTransitionError(error: Error, transition: ReasoningTransition): void {
    this.stateData.errors.push(error);
    this.currentState = ReasoningState.ERROR_STATE;
    this.stateData.currentState = ReasoningState.ERROR_STATE;
    
    this.emit('transition:error', {
      error,
      transition,
      timestamp: new Date()
    });
  }
}

export default ReasoningTransitionHub;

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: reasoning-fsm-transitions-001
// inputs: ["ReasoningStates.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"codex","prompt":"v1"}
// === END FOOTER ===