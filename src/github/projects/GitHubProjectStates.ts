/**
 * GitHub Project FSM States
 * State enumeration for GitHub project integration state machine
 */

export enum GitHubProjectState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  CONNECTING = 'CONNECTING',
  SYNCING = 'SYNCING',
  UPDATING = 'UPDATING',
  VALIDATING = 'VALIDATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  DISCONNECTED = 'DISCONNECTED'
}

// Backward compatibility
export type GitHubProjectStates = GitHubProjectState;

// === AGENT FOOTER ===
// Version: 1.0.0 (Phase 2.1 FSM state enum)
// === END FOOTER ===
