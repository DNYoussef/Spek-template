/**
 * FSM-based Stress Test System Entry Point
 * Exports the refactored stress testing components
 * NASA Rule 10 compliant replacement for god object
 */

// Main orchestrator - replaces StressTestRunner god object
export { StressTestOrchestrator } from './core/StressTestOrchestrator';

// FSM components
export { StressTestStateMachine } from './fsm/StressTestStateMachine';

// State implementations
export { PhaseExecutionState } from './states/PhaseExecutionState';
export { MonitoringState } from './states/MonitoringState';
export { RecoveryState } from './states/RecoveryState';

// Type definitions
export * from './types/StressTestTypes';

// Backward compatibility facade
export { StressTestRunnerFacade as StressTestRunner } from './StressTestRunnerFacade';

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: stress_test_refactor_007
// inputs: ["StressTestOrchestrator.ts"]
// tools_used: ["Write"]
// versions: {"model":"Sonnet 4","prompt":"v1.0"}
// === END FOOTER ===