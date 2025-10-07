/**
 * GitHub Project FSM Events
 * Event enumeration for GitHub project integration state machine
 */

export enum GitHubProjectEvent {
  START = 'START',
  CONNECT = 'CONNECT',
  SYNC = 'SYNC',
  UPDATE = 'UPDATE',
  VALIDATE = 'VALIDATE',
  COMPLETE = 'COMPLETE',
  DISCONNECT = 'DISCONNECT',
  FAIL = 'FAIL',
  RESET = 'RESET'
}

// Backward compatibility
export type GitHubProjectEvents = GitHubProjectEvent;

// === AGENT FOOTER ===
// Version: 1.0.0 (Phase 2.1 FSM event enum)
// === END FOOTER ===
