/**
 * Documentation FSM Events
 * Event enumeration for documentation generation state machine
 */

export enum DocEvent {
  START = 'START',
  SCAN = 'SCAN',
  ANALYZE = 'ANALYZE',
  GENERATE = 'GENERATE',
  VALIDATE = 'VALIDATE',
  EXPORT = 'EXPORT',
  COMPLETE = 'COMPLETE',
  FAIL = 'FAIL',
  ERROR = 'ERROR',
  RESET = 'RESET'
}

// Backward compatibility
export type DocEvents = DocEvent;

// === AGENT FOOTER ===
// Version: 1.0.0 (Phase 2.1 FSM event enum)
// === END FOOTER ===
