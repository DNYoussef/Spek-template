/**
 * FSM-based Analysis State Machine exports.
 * NASA Rule 10 compliant migration analysis workflow.
 */

// Main state machine
export { AnalysisStateMachine } from './AnalysisStateMachineRefactored';

// Core components
export { TransitionHub } from './core/TransitionHub';
export { BaseStateHandler } from './core/BaseStateHandler';

// State handlers
export { InitializedState } from './states/InitializedState';
export { AnalyzingState } from './states/AnalyzingState';
export { RiskAssessmentState } from './states/RiskAssessmentState';
export { DependencyMappingState } from './states/DependencyMappingState';
export { PlanningState } from './states/PlanningState';
export { ValidationState } from './states/ValidationState';
export { CompletedState, FailedState, CancelledState } from './states/TerminalStates';

// Types and interfaces
export * from './types/AnalysisTypes';

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T15:32:30-04:00 | agent@coder | Created FSM module index with exports | index.ts | OK | -- | 0.00 | c7a5e8d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: fsm-refactor-012
- inputs: ["AnalysisStateMachine.ts"]
- tools_used: ["filesystem"]
- versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->