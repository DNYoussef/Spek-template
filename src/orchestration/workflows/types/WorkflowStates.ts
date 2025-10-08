/**
 * Workflow FSM States
 * State enumeration for workflow orchestration state machine
 */

export enum WorkflowState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  PLANNING = 'PLANNING',
  EXECUTING = 'EXECUTING',
  MONITORING = 'MONITORING',
  PAUSED = 'PAUSED',
  RESUMING = 'RESUMING',
  COMPLETING = 'COMPLETING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// Backward compatibility
export type WorkflowStates = WorkflowState;

// === AGENT FOOTER ===
// Version: 1.0.0 (Phase 2.1 FSM state enum)
// === END FOOTER ===
