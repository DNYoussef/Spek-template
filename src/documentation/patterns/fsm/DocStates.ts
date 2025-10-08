/**
 * Documentation FSM States
 * State enumeration for documentation generation state machine
 */

export enum DocState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  VALIDATING = 'VALIDATING',
  EXPORTING = 'EXPORTING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// Backward compatibility
export type DocStates = DocState;

// === AGENT FOOTER ===
// Version: 1.0.0 (Phase 2.1 FSM state enum)
// === END FOOTER ===
