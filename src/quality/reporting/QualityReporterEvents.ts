/**
 * Quality Reporter FSM Events
 * Event enumeration for quality reporting state machine
 */

export enum QualityReporterEvent {
  START = 'START',
  COLLECT = 'COLLECT',
  AGGREGATE = 'AGGREGATE',
  ANALYZE = 'ANALYZE',
  GENERATE = 'GENERATE',
  PUBLISH = 'PUBLISH',
  COMPLETE = 'COMPLETE',
  FAIL = 'FAIL',
  RESET = 'RESET'
}

// Backward compatibility
export type QualityReporterEvents = QualityReporterEvent;

// === AGENT FOOTER ===
// Version: 1.0.0 (Phase 2.1 FSM event enum)
// === END FOOTER ===
