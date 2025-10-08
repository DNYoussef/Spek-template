/**
 * Workflow FSM Events
 * Event enumeration for workflow orchestration state machine
 */

export enum WorkflowEvent {
  START = 'START',
  PLAN = 'PLAN',
  EXECUTE = 'EXECUTE',
  MONITOR = 'MONITOR',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  COMPLETE = 'COMPLETE',
  FAIL = 'FAIL',
  ERROR = 'ERROR',
  CANCEL = 'CANCEL',
  RESET = 'RESET'
}

// Backward compatibility
export type WorkflowEvents = WorkflowEvent;

// === AGENT FOOTER ===
// Version: 1.0.0 (Phase 2.1 FSM event enum)
// === END FOOTER ===
