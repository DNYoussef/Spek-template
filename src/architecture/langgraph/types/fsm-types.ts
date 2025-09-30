/**
 * FSM Types for LangGraph Architecture
 * Core FSM types for LangGraph components
 * NASA Rule 10 Compliant: Enum-based FSM implementation
 */

// Core FSM State Enumeration
export enum FSMState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  PROCESSING = 'PROCESSING',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR',
  SHUTDOWN = 'SHUTDOWN'
}

// Core FSM Event Enumeration
export enum FSMEvent {
  INITIALIZE = 'INITIALIZE',
  START = 'START',
  PROCESS = 'PROCESS',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  ERROR = 'ERROR',
  SHUTDOWN = 'SHUTDOWN',
  RESET = 'RESET'
}

// Additional architecture-specific FSM types
export interface StateDefinition {
  readonly name: string;
  readonly entry?: () => void;
  readonly exit?: () => void;
  readonly actions?: string[];
  readonly metadata?: Record<string, unknown>;
}
export interface TransitionDefinition {
  readonly from: string;
  readonly to: string;
  readonly event: string;
  readonly guard?: string;
  readonly actions?: string[];
  readonly metadata?: Record<string, unknown>;
}
export interface FSMConfig {
  readonly id: string;
  readonly initialState: string;
  readonly states: StateDefinition[];
  readonly transitions: TransitionDefinition[];
  readonly globalActions?: string[];
  readonly metadata?: Record<string, unknown>;
}
/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-28T22:25:15-04:00 | coder@claude-sonnet-4 | Create architecture FSM types for DashboardBaseFSM compatibility | fsm-types.ts | OK | -- | 0.00 | f8a4c2d |
 * | 1.1.0   | 2025-09-30T20:30:00 | base-template-generator@sonnet-4.5 | Add FSMState and FSMEvent enums for complete FSM implementation | fsm-types.ts | OK | Phase 4.4 - Core FSM enums added | 0.00 | 2a7f3e6 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase4-4-langgraph-fsm-completion
 * - inputs: ["TS2307 errors from DashboardBaseFSM.ts"]
 * - tools_used: ["Edit"]
 * - versions: {"model":"claude-sonnet-4.5","template":"NASA-Rule-10-FSM-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */