/**
 * Quality Reporter FSM States
 * State enumeration for quality reporting state machine
 */

export enum QualityReporterState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  COLLECTING = 'COLLECTING',
  AGGREGATING = 'AGGREGATING',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  PUBLISHING = 'PUBLISHING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// Backward compatibility
export type QualityReporterStates = QualityReporterState;

// === AGENT FOOTER ===
// Version: 1.0.0 (Phase 2.1 FSM state enum)
// === END FOOTER ===
