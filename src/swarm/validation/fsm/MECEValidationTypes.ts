/**
 * MECE Validation Types - Centralized type definitions
 * NASA Rule 10 Compliant: All types and interfaces for MECE validation
 */

export interface DomainBoundary {
  domainName: string;
  principalResponsibilities: string[];
  criticalKeys: string[];
  managedAgentTypes: string[];
  exclusionPatterns: string[];
  dependencies: string[];
}

export interface MECEViolation {
  violationType: 'overlap' | 'gap' | 'dependency_conflict' | 'boundary_breach';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedDomains: string[];
  conflictingElements: string[];
  resolutionRequired: boolean;
  suggestedFix: string;
}

export interface MECEValidationResult {
  validationId: string;
  timestamp: number;
  overallCompliance: number; // 0-1 scale
  mutuallyExclusive: boolean;
  collectivelyExhaustive: boolean;
  violations: MECEViolation[];
  domainCoverage: Map<string, number>;
  recommendedActions: string[];
}

export interface CrossDomainHandoff {
  fromDomain: string;
  toDomain: string;
  handoffType: 'task_completion' | 'dependency_resolution' | 'escalation' | 'information_sharing';
  payload: any;
  requiresConsensus: boolean;
  contextIntegrity: boolean;
  timestamp: number;
}

// FSM States for validation
export enum ValidationState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  VALIDATING_EXCLUSIVITY = 'validating_exclusivity',
  VALIDATING_EXHAUSTIVENESS = 'validating_exhaustiveness',
  PROCESSING_VIOLATIONS = 'processing_violations',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// FSM Events for validation
export enum ValidationEvent {
  START_VALIDATION = 'start_validation',
  INITIALIZATION_COMPLETE = 'initialization_complete',
  EXCLUSIVITY_CHECK_COMPLETE = 'exclusivity_check_complete',
  EXHAUSTIVENESS_CHECK_COMPLETE = 'exhaustiveness_check_complete',
  VIOLATIONS_PROCESSED = 'violations_processed',
  VALIDATION_COMPLETE = 'validation_complete',
  ERROR_OCCURRED = 'error_occurred',
  RESET = 'reset'
}

// Validation configuration constants
export const MECE_COMPLIANCE_THRESHOLD = 0.85; // 85% minimum
export const OVERLAP_TOLERANCE = 0.05; // 5% maximum overlap
export const COVERAGE_MINIMUM = 0.95; // 95% minimum coverage
export const MAX_DOMAINS = 20; // NASA Rule 10: Fixed domain limit
export const MAX_VIOLATIONS = 100; // NASA Rule 10: Fixed violation limit
export const MAX_HANDOFFS = 50; // NASA Rule 10: Fixed handoff limit