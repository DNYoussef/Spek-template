/**
 * FSM Integration Module - Entry Point
 * Exports all FSM components and types for SystemIntegrationOrchestrator
 * NASA Rule 10 Compliant Architecture
 */

// Main FSM Orchestrator
export { SystemIntegrationOrchestratorFSM as default } from '../SystemIntegrationOrchestratorFSM';
export { SystemIntegrationOrchestratorFSM } from '../SystemIntegrationOrchestratorFSM';

// FSM Core
export { TransitionHub } from './TransitionHub';

// FSM Components
export { IntegrationPlanManager } from './components/IntegrationPlanManager';
export { IntegrationExecutor } from './components/IntegrationExecutor';
export { IntegrationValidatorFSM } from './components/IntegrationValidatorFSM';
export { IntegrationMonitor } from './components/IntegrationMonitor';
export { ComponentIntegrator } from './components/ComponentIntegrator';
export { RollbackManager } from './components/RollbackManager';

// FSM Types and Enums
export * from './types/IntegrationFSMTypes';

// Backward Compatibility
export { SystemIntegrationOrchestrator } from '../SystemIntegrationOrchestrator';

/**
 * Usage Example:
 *
 * import { SystemIntegrationOrchestratorFSM } from './fsm';
 * import { ComponentDependencyResolver, IntegrationSequencer, ConflictResolutionEngine, IntegrationValidator } from '../';
 *
 * const orchestrator = new SystemIntegrationOrchestratorFSM(
 *   dependencyResolver,
 *   sequencer,
 *   conflictEngine,
 *   validator
 * );
 *
 * // API remains identical to original
 * const execution = await orchestrator.executeIntegrationPlan('phase9-final-integration', {
 *   dryRun: false,
 *   parallelExecution: true
 * });
 */

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: fsm-index-001
// inputs: ["All FSM components"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"fsm-first-refactor-v1"}
// === END FOOTER ===