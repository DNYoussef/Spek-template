/**
 * Queen FSM Types - Finite State Machine Types for Queen Orchestrator
 * NASA Rule 10 Compliant: Fixed, bounded state transitions
 */

export enum QueenFSMStates {
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  REGISTERING_PRINCESS = 'REGISTERING_PRINCESS',
  DEFINING_OBJECTIVE = 'DEFINING_OBJECTIVE',
  PLANNING_EXECUTION = 'PLANNING_EXECUTION',
  EXECUTING_OBJECTIVE = 'EXECUTING_OBJECTIVE',
  MAKING_DECISION = 'MAKING_DECISION',
  DELEGATING_TASK = 'DELEGATING_TASK',
  HANDLING_ESCALATION = 'HANDLING_ESCALATION',
  MONITORING = 'MONITORING',
  ERROR = 'ERROR',
  SHUTDOWN = 'SHUTDOWN'
}

export enum QueenFSMEvents {
  INITIALIZE = 'INITIALIZE',
  REGISTER_PRINCESS = 'REGISTER_PRINCESS',
  DEFINE_OBJECTIVE = 'DEFINE_OBJECTIVE',
  PLAN_EXECUTION = 'PLAN_EXECUTION',
  EXECUTE_OBJECTIVE = 'EXECUTE_OBJECTIVE',
  MAKE_DECISION = 'MAKE_DECISION',
  DELEGATE_TASK = 'DELEGATE_TASK',
  HANDLE_ESCALATION = 'HANDLE_ESCALATION',
  START_MONITORING = 'START_MONITORING',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RECOVER_FROM_ERROR = 'RECOVER_FROM_ERROR',
  SHUTDOWN_REQUESTED = 'SHUTDOWN_REQUESTED',
  OPERATION_COMPLETED = 'OPERATION_COMPLETED'
}

export interface QueenFSMTransition {
  from: QueenFSMStates;
  to: QueenFSMStates;
  event: QueenFSMEvents;
  guard?: (context: any) => boolean;
  action?: (context: any) => void;
}

// NASA Rule 10: Fixed transition matrix
export const QUEEN_FSM_TRANSITIONS: QueenFSMTransition[] = [
  // Initialization transitions
  { from: QueenFSMStates.INITIALIZING, to: QueenFSMStates.ACTIVE, event: QueenFSMEvents.INITIALIZE },

  // Active state transitions
  { from: QueenFSMStates.ACTIVE, to: QueenFSMStates.REGISTERING_PRINCESS, event: QueenFSMEvents.REGISTER_PRINCESS },
  { from: QueenFSMStates.ACTIVE, to: QueenFSMStates.DEFINING_OBJECTIVE, event: QueenFSMEvents.DEFINE_OBJECTIVE },
  { from: QueenFSMStates.ACTIVE, to: QueenFSMStates.PLANNING_EXECUTION, event: QueenFSMEvents.PLAN_EXECUTION },
  { from: QueenFSMStates.ACTIVE, to: QueenFSMStates.EXECUTING_OBJECTIVE, event: QueenFSMEvents.EXECUTE_OBJECTIVE },
  { from: QueenFSMStates.ACTIVE, to: QueenFSMStates.MAKING_DECISION, event: QueenFSMEvents.MAKE_DECISION },
  { from: QueenFSMStates.ACTIVE, to: QueenFSMStates.DELEGATING_TASK, event: QueenFSMEvents.DELEGATE_TASK },
  { from: QueenFSMStates.ACTIVE, to: QueenFSMStates.HANDLING_ESCALATION, event: QueenFSMEvents.HANDLE_ESCALATION },
  { from: QueenFSMStates.ACTIVE, to: QueenFSMStates.MONITORING, event: QueenFSMEvents.START_MONITORING },
  { from: QueenFSMStates.ACTIVE, to: QueenFSMStates.SHUTDOWN, event: QueenFSMEvents.SHUTDOWN_REQUESTED },

  // Operation completion transitions (back to ACTIVE)
  { from: QueenFSMStates.REGISTERING_PRINCESS, to: QueenFSMStates.ACTIVE, event: QueenFSMEvents.OPERATION_COMPLETED },
  { from: QueenFSMStates.DEFINING_OBJECTIVE, to: QueenFSMStates.ACTIVE, event: QueenFSMEvents.OPERATION_COMPLETED },
  { from: QueenFSMStates.PLANNING_EXECUTION, to: QueenFSMStates.ACTIVE, event: QueenFSMEvents.OPERATION_COMPLETED },
  { from: QueenFSMStates.EXECUTING_OBJECTIVE, to: QueenFSMStates.ACTIVE, event: QueenFSMEvents.OPERATION_COMPLETED },
  { from: QueenFSMStates.MAKING_DECISION, to: QueenFSMStates.ACTIVE, event: QueenFSMEvents.OPERATION_COMPLETED },
  { from: QueenFSMStates.DELEGATING_TASK, to: QueenFSMStates.ACTIVE, event: QueenFSMEvents.OPERATION_COMPLETED },
  { from: QueenFSMStates.HANDLING_ESCALATION, to: QueenFSMStates.ACTIVE, event: QueenFSMEvents.OPERATION_COMPLETED },
  { from: QueenFSMStates.MONITORING, to: QueenFSMStates.ACTIVE, event: QueenFSMEvents.OPERATION_COMPLETED },

  // Error transitions (from any state except SHUTDOWN)
  { from: QueenFSMStates.INITIALIZING, to: QueenFSMStates.ERROR, event: QueenFSMEvents.ERROR_OCCURRED },
  { from: QueenFSMStates.ACTIVE, to: QueenFSMStates.ERROR, event: QueenFSMEvents.ERROR_OCCURRED },
  { from: QueenFSMStates.REGISTERING_PRINCESS, to: QueenFSMStates.ERROR, event: QueenFSMEvents.ERROR_OCCURRED },
  { from: QueenFSMStates.DEFINING_OBJECTIVE, to: QueenFSMStates.ERROR, event: QueenFSMEvents.ERROR_OCCURRED },
  { from: QueenFSMStates.PLANNING_EXECUTION, to: QueenFSMStates.ERROR, event: QueenFSMEvents.ERROR_OCCURRED },
  { from: QueenFSMStates.EXECUTING_OBJECTIVE, to: QueenFSMStates.ERROR, event: QueenFSMEvents.ERROR_OCCURRED },
  { from: QueenFSMStates.MAKING_DECISION, to: QueenFSMStates.ERROR, event: QueenFSMEvents.ERROR_OCCURRED },
  { from: QueenFSMStates.DELEGATING_TASK, to: QueenFSMStates.ERROR, event: QueenFSMEvents.ERROR_OCCURRED },
  { from: QueenFSMStates.HANDLING_ESCALATION, to: QueenFSMStates.ERROR, event: QueenFSMEvents.ERROR_OCCURRED },
  { from: QueenFSMStates.MONITORING, to: QueenFSMStates.ERROR, event: QueenFSMEvents.ERROR_OCCURRED },

  // Error recovery
  { from: QueenFSMStates.ERROR, to: QueenFSMStates.ACTIVE, event: QueenFSMEvents.RECOVER_FROM_ERROR },
  { from: QueenFSMStates.ERROR, to: QueenFSMStates.SHUTDOWN, event: QueenFSMEvents.SHUTDOWN_REQUESTED }
];

export interface QueenFSMContext {
  currentState: QueenFSMStates;
  previousState: QueenFSMStates;
  stateHistory: QueenFSMStates[];
  errorHistory: Error[];
  transitionCount: number;
  maxTransitions: number;
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T16:25:14-04:00 | CODEX AGENT 024@Claude Sonnet | Created QueenFSMTypes.ts with NASA Rule 10 compliant FSM states, events, and transition matrix | QueenFSMTypes.ts | OK | FSM architecture for Queen Orchestrator | 0.00 | a7b9c2d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: codex-024-queen-fsm-types
- inputs: ["QueenOrchestrator.ts refactoring requirements"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->