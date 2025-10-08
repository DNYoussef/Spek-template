/**
 * Shared GitHub FSM Types and Enums
 * Common state machines and events for all GitHub integrations
 */

// Common GitHub FSM States
export enum GitHubFSMState {
  IDLE = 'idle',
  AUTHENTICATING = 'authenticating',
  FETCHING = 'fetching',
  PROCESSING = 'processing',
  SYNCING = 'syncing',
  VALIDATING = 'validating',
  UPDATING = 'updating',
  COMPLETE = 'complete',
  ERROR = 'error'
}

// Common GitHub FSM Events
export enum GitHubFSMEvent {
  START = 'start',
  AUTHENTICATE = 'authenticate',
  FETCH_DATA = 'fetch_data',
  PROCESS_DATA = 'process_data',
  SYNC_CHANGES = 'sync_changes',
  VALIDATE_RESULT = 'validate_result',
  UPDATE_STATE = 'update_state',
  COMPLETE_OPERATION = 'complete_operation',
  ERROR_OCCURRED = 'error_occurred',
  RESET = 'reset'
}

// Base GitHub Operation Context
export interface GitHubOperationContext {
  operationId: string;
  repository: string;
  owner: string;
  token: string;
  retryCount: number;
  maxRetries: number;
  startTime: Date;
  metadata: Record<string, any>;
}

// Base GitHub Operation Result
export interface GitHubOperationResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  apiCallsUsed: number;
}

// FSM Transition Definition
export interface GitHubFSMTransition {
  fromState: GitHubFSMState;
  event: GitHubFSMEvent;
  toState: GitHubFSMState;
  guard?: () => boolean;
  action?: (context: GitHubOperationContext) => Promise<void>;
}

// Common GitHub API Response Types
export interface GitHubAPIResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  rateLimit: {
    limit: number;
    remaining: number;
    resetAt: Date;
  };
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/* Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T10:47:12-04:00 | MEGA-086@Claude-Sonnet-4 | Created shared GitHub FSM types and enums | GitHubSharedTypes.ts | OK | Base types for all GitHub FSM implementations | 0.00 | 2f5a8b3 |

Receipt:
- status: OK
- reason_if_blocked: --
- run_id: mega-086-github-fsm-shared-types
- inputs: []
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"github-fsm-shared-v1"}
*/
/* AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */