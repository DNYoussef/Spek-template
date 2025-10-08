/**
 * ISO27001 Compliance FSM Events
 * Event enumeration for ISO27001 compliance checking state machine
 */

export enum ISO27001Event {
  START = 'START',
  SCAN = 'SCAN',
  ANALYZE = 'ANALYZE',
  VALIDATE = 'VALIDATE',
  REPORT = 'REPORT',
  REMEDIATE = 'REMEDIATE',
  COMPLETE = 'COMPLETE',
  FAIL = 'FAIL',
  ERROR = 'ERROR',
  RESET = 'RESET'
}

// Backward compatibility
export type ISO27001Events = ISO27001Event;

// === AGENT FOOTER ===
// Version: 1.0.0 (Phase 2.1 FSM event enum)
// === END FOOTER ===
