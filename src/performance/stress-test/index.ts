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

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T16:31:33-04:00 | coder@Sonnet | Create index file for FSM-based stress test system | index.ts | OK | Main entry point with backward compatibility | 0.00 | stu901l |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: stress_test_refactor_007
- inputs: ["StressTestOrchestrator.ts"]
- tools_used: ["Write"]
- versions: {"model":"Sonnet 4","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->