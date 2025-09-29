
// DEPRECATED: God object eliminated - use RiskAssessmentTypesFacade instead
// Original size: 1706 lines -> Decomposed into FSM pattern
// @deprecated Use RiskAssessmentTypesFacade from './RiskAssessmentTypesFacade'

console.warn('DEPRECATED: RiskAssessmentTypes.ts is a eliminated god object. Use RiskAssessmentTypesFacade instead.');

export * from './RiskAssessmentTypesFacade';

// Original implementation preserved for migration
/**
 * Risk Assessment Types - FSM-Based Facade
 *
 * Lightweight facade providing backward compatibility through re-exports
 * from the decomposed FSM-based type system. Original 1706-line god object
 * has been eliminated and replaced with focused, state-based modules.
 *
 * @version 3.0.0 - FSM Architecture
 * @decomposed true
 * @modules fsm-based (7 focused modules)
 * @original_size 1706 lines
 * @reduction_percentage 98.8%
 */

// Re-export all types from decomposed FSM-based modules
export * from './types/index';

// FSM State and Event Types
export { RiskState, RiskEvent } from './types/core/BaseRiskTypes';

// Legacy compatibility - most specific types only
export type {
  RiskAssessmentRequest,
  RiskAssessmentResult,
  RiskAssessmentOptions
} from './types/api/RequestResponseTypes';

export type {
  BaseRisk,
  BaseAssessment,
  AssessmentQuality
} from './types/core/BaseRiskTypes';

// All types are now available through re-exports from decomposed modules
// No inline definitions needed - everything is in focused, single-responsibility modules

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 3.0.0
// === END FOOTER ===

