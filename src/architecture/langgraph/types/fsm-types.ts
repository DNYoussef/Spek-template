/**
 * FSM Types for LangGraph Architecture
 * Re-exports from main fsm-types module for backward compatibility
 */
export * from '../../../types/fsm-types';
// Additional architecture-specific FSM types
export interface StateDefinition {
  readonly name: string;
  readonly entry?: ()  = > void;
  readonly exit?: ()  = > void;
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
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: type-import-error-fix-001
 * - inputs: ["DashboardBaseFSM.ts", "main fsm-types.ts"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4","prompt":"type-import-error-fix"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */