/**
 * Readiness Module Index - Clean exports for FSM-based deployment readiness validation
 * 
 * Provides clean module interface for the refactored deployment readiness system,
 * exposing only the necessary components for external consumption.
 */

// Main orchestrator (primary interface)
export { ReadinessOrchestrator } from './ReadinessOrchestrator';

// Core FSM components
export { ReadinessStateMachine } from './core/ReadinessStateMachine';
export { TransitionHub } from './core/TransitionHub';
export { StateRegistry } from './core/StateRegistry';

// All type definitions
export {
  ReadinessValidation,
  CategoryReadiness,
  ReadinessCheck,
  ReadinessBlocker,
  ReadinessWarning,
  Evidence,
  Signoff,
  DeploymentApproval,
  ValidationOptions,
  ReadinessState,
  ReadinessEvent,
  ReadinessContext,
  StateTransition,
  ValidationResult,
  TransitionGuard,
  StateAction,
  StateHandler,
  ReadinessMetrics,
  ReadinessValidationError,
  CategoryConfig,
  CheckConfig,
  ReadinessConfig
} from './types/ReadinessTypes';

// Base validator for extending
export { BaseValidator } from './validators/BaseValidator';

// State handlers (for advanced usage)
export { default as InitializingState } from './states/InitializingState';
export { default as CodeQualityState } from './states/CodeQualityState';
export { default as SecurityState } from './states/SecurityState';
// Note: Additional state handlers can be imported as needed

// Default export (primary interface)
export { ReadinessOrchestrator as default } from './ReadinessOrchestrator';

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: readiness-index-011
// inputs: ["ReadinessOrchestrator.ts", "types", "core components"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"fsm-refactor-v2"}
// === END FOOTER ===