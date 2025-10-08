/**
 * Reporting System Index
 *
 * Main entry point for the FSM-based reporting system.
 * Exports all public interfaces and implementations.
 *
 * @version 1.0.0
 * @author RiskAssessment FSM Refactor Agent
 */

// ============================================================================
// MAIN FACADE EXPORT
// ============================================================================

export { ReportGeneratorFacade } from './ReportGeneratorFacade';

// ============================================================================
// CORE COMPONENTS
// ============================================================================

export { ReportGeneratorCore } from './core/ReportGeneratorCore';

// ============================================================================
// STATE MACHINE
// ============================================================================

export {
  ReportGenerationStateMachine,
  ReportGenerationState,
  ReportGenerationEvent
} from './fsm/ReportGenerationStateMachine';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export {
  ReporterConfig,
  ReportTemplate,
  ReportSection,
  DashboardLayout,
  ObjectiveGenerationRequest,
  ObjectiveGenerationResult,
  IndicatorGenerationRequest,
  IndicatorGenerationResult,
  DashboardGenerationRequest,
  DashboardGenerationResult,
  ReportGenerationRequest,
  ReportGenerationResult,
  AlertGenerationRequest,
  AlertGenerationResult,
  ReviewGenerationRequest,
  ReviewGenerationResult,
  FrameworkAssemblyRequest,
  FrameworkAssemblyResult,
  ValidationRequest,
  ValidationResult,
  ComponentValidationResult,
  ReportingError,
  ErrorRecoveryStrategy,
  PerformanceMetrics,
  QualityMetrics,
  ComponentFactory,
  DEFAULT_REPORTER_CONFIG,
  NASA_RULE_10_BOUNDS
} from '~types/ReportingTypes';

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// For backward compatibility
export { ReportGeneratorFacade as RiskAssessmentReporter } from './ReportGeneratorFacade';

// For direct instantiation
export const createReportGenerator = (config?: Partial<ReporterConfig>) => {
  return new ReportGeneratorFacade(config);
};

// For testing and debugging
export const createReportGeneratorWithCore = (config?: Partial<ReporterConfig>) => {
  const facade = new ReportGeneratorFacade(config);
  return {
    facade,
    core: new ReportGeneratorCore(config),
    stateMachine: new ReportGenerationStateMachine()
  };
};