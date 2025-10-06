/**
 * Quality Threshold FSM Events
 * Event enumeration for quality threshold validation state machine
 */

export enum ThresholdEvent {
  START = 'START',
  COLLECT = 'COLLECT',
  EVALUATE = 'EVALUATE',
  VALIDATE = 'VALIDATE',
  ALERT = 'ALERT',
  COMPLETE = 'COMPLETE',
  FAIL = 'FAIL',
  ERROR = 'ERROR',
  RESET = 'RESET'
}

// Backward compatibility
export type ThresholdEvents = ThresholdEvent;

// === AGENT FOOTER ===
// Version: 1.0.0 (Phase 2.1 FSM event enum)
// === END FOOTER ===
