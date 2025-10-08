/**
 * Performance Drift FSM Events
 * Event enumeration for drift detection state machine
 */

export enum DriftEvent {
  START = 'START',
  COLLECT = 'COLLECT',
  ANALYZE = 'ANALYZE',
  DETECT = 'DETECT',
  ALERT = 'ALERT',
  COMPLETE = 'COMPLETE',
  FAIL = 'FAIL',
  ERROR = 'ERROR',
  RESET = 'RESET'
}

// Backward compatibility
export type DriftEvents = DriftEvent;

// === AGENT FOOTER ===
// Version: 1.0.0 (Phase 2.1 FSM event enum)
// === END FOOTER ===
