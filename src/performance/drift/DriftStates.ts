/**
 * Performance Drift FSM States
 * State enumeration for drift detection state machine
 */

export enum DriftState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  COLLECTING = 'COLLECTING',
  ANALYZING = 'ANALYZING',
  DETECTING = 'DETECTING',
  ALERTING = 'ALERTING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// Backward compatibility
export type DriftStates = DriftState;

// === AGENT FOOTER ===
// Version: 1.0.0 (Phase 2.1 FSM state enum)
// === END FOOTER ===
