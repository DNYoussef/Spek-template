/**
 * Debug State Enumeration - FSM States for Debug Orchestration
 * NASA Rule 10 Compliant: Fixed enumeration values
 */
export enum DebugState {
  IDLE = 'IDLE',
  ANALYZING_ERRORS = 'ANALYZING_ERRORS',
  DISTRIBUTING_TO_EXPERTS = 'DISTRIBUTING_TO_EXPERTS',
  COORDINATING_DEBUGGING = 'COORDINATING_DEBUGGING',
  MONITORING_PROGRESS = 'MONITORING_PROGRESS',
  VALIDATING_FIXES = 'VALIDATING_FIXES',
  TESTING_INTEGRATION = 'TESTING_INTEGRATION',
  DEPLOYING_FIXES = 'DEPLOYING_FIXES',
  ERROR_RECOVERY = 'ERROR_RECOVERY',
  COMPLETED = 'COMPLETED'
}

export enum DebugEvent {
  START_ANALYSIS = 'START_ANALYSIS',
  ANALYSIS_COMPLETE = 'ANALYSIS_COMPLETE',
  DISTRIBUTION_READY = 'DISTRIBUTION_READY',
  EXPERTS_ASSIGNED = 'EXPERTS_ASSIGNED',
  DEBUGGING_STARTED = 'DEBUGGING_STARTED',
  FIXES_GENERATED = 'FIXES_GENERATED',
  VALIDATION_REQUESTED = 'VALIDATION_REQUESTED',
  INTEGRATION_READY = 'INTEGRATION_READY',
  DEPLOYMENT_READY = 'DEPLOYMENT_READY',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RECOVERY_COMPLETE = 'RECOVERY_COMPLETE',
  PROCESS_COMPLETE = 'PROCESS_COMPLETE',
  RESET_REQUESTED = 'RESET_REQUESTED'
}

export interface DebugStateContext {
  swarmId: string;
  errorReports: import('../DebugSwarmController').ErrorReport[];
  analysis?: import('../DebugSwarmController').ErrorAnalysis;
  assignments: import('../DebugSwarmController').DebugAssignment[];
  fixes: import('../DebugSwarmController').Fix[];
  validationResults: Map<string, boolean>;
  integrationStatus: boolean;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
}

export interface StateTransition {
  fromState: DebugState;
  event: DebugEvent;
  toState: DebugState;
  guard?: (context: DebugStateContext) => boolean;
  action?: (context: DebugStateContext) => Promise<void>;
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T15:30:15-04:00 | codex@sonnet-4 | Create DebugState types with FSM enums | DebugState.ts | OK | FSM-first development | 0.00 | a1b2c3d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: debug-fsm-types-001
- inputs: ["Mission requirements"]
- tools_used: ["MultiEdit"]
- versions: {"model":"sonnet-4","prompt":"fsm-debug-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->