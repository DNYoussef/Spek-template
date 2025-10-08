/**
 * Quality Threshold FSM States
 * State enumeration for quality threshold validation state machine
 */

export enum ThresholdState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  COLLECTING = 'COLLECTING',
  EVALUATING = 'EVALUATING',
  VALIDATING = 'VALIDATING',
  ALERTING = 'ALERTING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// Backward compatibility
export type ThresholdStates = ThresholdState;

// === AGENT FOOTER ===
// Version: 1.0.0 (Phase 2.1 FSM state enum)
// === END FOOTER ===
