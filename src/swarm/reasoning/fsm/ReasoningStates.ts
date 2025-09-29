/**
 * FSM States for Rationalist Reasoning Engine
 * Implements reasoning pipeline as finite state machine
 */

export enum ReasoningState {
  IDLE = 'IDLE',
  EVIDENCE_COLLECTION = 'EVIDENCE_COLLECTION',
  HYPOTHESIS_GENERATION = 'HYPOTHESIS_GENERATION',
  HYPOTHESIS_TESTING = 'HYPOTHESIS_TESTING',
  BELIEF_UPDATE = 'BELIEF_UPDATE',
  DECISION_ANALYSIS = 'DECISION_ANALYSIS',
  BIAS_DETECTION = 'BIAS_DETECTION',
  RED_TEAM_ANALYSIS = 'RED_TEAM_ANALYSIS',
  RESULTS_SYNTHESIS = 'RESULTS_SYNTHESIS',
  ERROR_STATE = 'ERROR_STATE'
}

export enum ReasoningEvent {
  EVIDENCE_RECEIVED = 'EVIDENCE_RECEIVED',
  GENERATE_HYPOTHESES = 'GENERATE_HYPOTHESES',
  TEST_HYPOTHESIS = 'TEST_HYPOTHESIS',
  UPDATE_BELIEFS = 'UPDATE_BELIEFS',
  ANALYZE_DECISION = 'ANALYZE_DECISION',
  CHECK_BIASES = 'CHECK_BIASES',
  PERFORM_RED_TEAM = 'PERFORM_RED_TEAM',
  SYNTHESIZE_RESULTS = 'SYNTHESIZE_RESULTS',
  RESET = 'RESET',
  ERROR = 'ERROR',
  COMPLETE = 'COMPLETE'
}

export interface ReasoningStateData {
  currentState: ReasoningState;
  evidence: Map<string, any>;
  hypotheses: Map<string, any>;
  beliefs: Map<string, any>;
  analyses: Map<string, any>;
  decisions: Map<string, any>;
  biases: Map<string, any>;
  redTeamResults: Map<string, any>;
  context: Record<string, any>;
  errors: Error[];
}

export interface ReasoningTransition {
  from: ReasoningState;
  event: ReasoningEvent;
  to: ReasoningState;
  guard?: (data: ReasoningStateData, payload?: any) => boolean;
  action?: (data: ReasoningStateData, payload?: any) => void;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: reasoning-fsm-states-001
// inputs: ["RationalistReasoningEngine.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"codex","prompt":"v1"}
// === END FOOTER ===