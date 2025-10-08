/**
 * ISO27001 Compliance FSM States
 * State enumeration for ISO27001 compliance checking state machine
 */

export enum ISO27001State {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  VALIDATING = 'VALIDATING',
  REPORTING = 'REPORTING',
  REMEDIATING = 'REMEDIATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// Backward compatibility
export type ISO27001States = ISO27001State;

// === AGENT FOOTER ===
// Version: 1.0.0 (Phase 2.1 FSM state enum)
// === END FOOTER ===
