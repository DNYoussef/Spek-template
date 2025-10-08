/**
 * Phase Transition Components - Public API
 * NASA Rule 10 Compliant exports for decomposed components
 */

// Main facade (primary entry point)
export { PhaseTransitionManagerFacade } from './PhaseTransitionFacade';

// Core components
export { PhaseTransitionCore } from './PhaseTransitionCore';
export { PhaseStateMachine, TransitionStateMachine, PhaseTransitionHub } from './PhaseTransitionStateMachine';

// Validation components
export {
  PhasePrerequisitesValidator,
  ExitCriteriaValidator,
  QualityGateCriteriaValidator,
  TransitionValidator
} from './PhaseTransitionValidator';

// Processing components
export {
  PhaseExecutionProcessor,
  TransitionExecutionProcessor
} from './PhaseTransitionProcessor';

// Monitoring components
export {
  PhaseExecutionMonitor,
  TransitionExecutionMonitor,
  SystemMetricsMonitor
} from './PhaseTransitionMonitor';

// Reporting components
export {
  PhaseExecutionReporter,
  TransitionExecutionReporter,
  SystemReporter
} from './PhaseTransitionReporter';

// All types and interfaces
export * from './PhaseTransitionTypes';

// Option types
export type { PhaseStartOptions, TransitionOptions } from './PhaseTransitionCore';

// Performance summary types
export type {
  PhasePerformanceSummary,
  TransitionPerformanceSummary,
  SystemMetrics
} from './PhaseTransitionMonitor';

// Report types
export type {
  PhaseExecutionReport,
  TransitionExecutionReport,
  SystemReport,
  SystemHealthStatus
} from './PhaseTransitionReporter';