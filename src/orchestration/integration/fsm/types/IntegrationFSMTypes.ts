/**
 * FSM-First Integration Types
 * Shared types and enums for SystemIntegrationOrchestrator FSM
 * NASA Rule 10 Compliant - Centralized type definitions
 */

// FSM State Enum - No string literals
export enum IntegrationState {
  IDLE = 'IDLE',
  PLANNING = 'PLANNING',
  VALIDATING_PLAN = 'VALIDATING_PLAN',
  EXECUTING = 'EXECUTING',
  MONITORING = 'MONITORING',
  VALIDATING_RESULTS = 'VALIDATING_RESULTS',
  ROLLBACK = 'ROLLBACK',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// FSM Event Enum - No string literals
export enum IntegrationEvent {
  START_INTEGRATION = 'START_INTEGRATION',
  PLAN_CREATED = 'PLAN_CREATED',
  PLAN_VALIDATED = 'PLAN_VALIDATED',
  PLAN_VALIDATION_FAILED = 'PLAN_VALIDATION_FAILED',
  EXECUTION_STARTED = 'EXECUTION_STARTED',
  PHASE_COMPLETED = 'PHASE_COMPLETED',
  PHASE_FAILED = 'PHASE_FAILED',
  QUALITY_GATE_PASSED = 'QUALITY_GATE_PASSED',
  QUALITY_GATE_FAILED = 'QUALITY_GATE_FAILED',
  ROLLBACK_COMPLETED = 'ROLLBACK_COMPLETED',
  CANCEL_INTEGRATION = 'CANCEL_INTEGRATION',
  HEALTH_DEGRADED = 'HEALTH_DEGRADED',
  CONFLICT_DETECTED = 'CONFLICT_DETECTED',
  EXECUTION_ARCHIVED = 'EXECUTION_ARCHIVED',
  CLEANUP_COMPLETED = 'CLEANUP_COMPLETED'
}

// FSM Event Data Interfaces
export interface IntegrationEventData {
  [IntegrationEvent.START_INTEGRATION]: {
    planId: string;
    options: IntegrationOptions;
  };
  [IntegrationEvent.PLAN_VALIDATED]: {
    validationResult: ValidationResult;
  };
  [IntegrationEvent.PLAN_VALIDATION_FAILED]: {
    errors: ValidationError[];
  };
  [IntegrationEvent.PHASE_COMPLETED]: {
    phaseId: string;
    result: PhaseResult;
  };
  [IntegrationEvent.PHASE_FAILED]: {
    phaseId: string;
    error: IntegrationError;
  };
  [IntegrationEvent.QUALITY_GATE_PASSED]: {
    gateId: string;
    score: number;
  };
  [IntegrationEvent.QUALITY_GATE_FAILED]: {
    gateId: string;
    failure: QualityFailure;
  };
  [IntegrationEvent.ROLLBACK_COMPLETED]: {
    rollbackResult: RollbackResult;
  };
  [IntegrationEvent.CANCEL_INTEGRATION]: {
    reason: string;
  };
  [IntegrationEvent.HEALTH_DEGRADED]: {
    healthScore: number;
  };
  [IntegrationEvent.CONFLICT_DETECTED]: {
    conflict: IntegrationConflict;
  };
}

// FSM Context Interface
export interface IntegrationFSMContext {
  currentExecution: IntegrationExecution | null;
  currentPlan: IntegrationPlan | null;
  currentPhase: IntegrationPhase | null;
  currentPhaseIndex: number;
  totalPhases: number;
  activeExecutions: Map<string, IntegrationExecution>;
  planValidated: boolean;
  qualityGatesPassed: boolean;
  rollbackInProgress: boolean;
  cancellationFlag: boolean;
  healthScore: number;
  validationResult: ValidationResult | null;
  rollbackResult: RollbackResult | null;
  cleanupResult: CleanupResult | null;
  errorLogged: boolean;
  allPhasesCompleted: boolean;
}

// Component Interfaces
export interface IntegrationOptions {
  dryRun?: boolean;
  parallelExecution?: boolean;
  skipValidation?: boolean;
  customTimeout?: number;
}

export interface ValidationResult {
  passed: boolean;
  criticalErrors: ValidationError[];
  warnings: ValidationWarning[];
  score: number;
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  component?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  component?: string;
}

export interface PhaseResult {
  phaseId: string;
  success: boolean;
  duration: number;
  componentResults: ComponentResult[];
  qualityMetrics: PhaseQualityMetrics;
}

export interface IntegrationError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  blocking: boolean;
  stack?: string;
  context?: any;
}

export interface QualityFailure {
  gateId: string;
  criteriaId: string;
  expectedValue: number;
  actualValue: number;
  message: string;
}

export interface RollbackResult {
  success: boolean;
  duration: number;
  affectedComponents: string[];
  errors: string[];
}

export interface CleanupResult {
  completed: boolean;
  duration: number;
  resourcesReleased: string[];
}

export interface PhaseQualityMetrics {
  successRate: number;
  averageLatency: number;
  errorRate: number;
  throughput: number;
}

// FSM Guard Functions Type
export type IntegrationGuard = (context: IntegrationFSMContext, eventData?: any) => boolean;

// FSM Action Functions Type
export type IntegrationAction = (context: IntegrationFSMContext, eventData?: any) => Promise<void>;

// FSM Transition Definition
export interface IntegrationTransition {
  from: IntegrationState;
  to: IntegrationState;
  event: IntegrationEvent;
  guard?: IntegrationGuard;
  action?: IntegrationAction;
}

// Component State Contract
export interface ComponentStateContract {
  init(): Promise<void>;
  update(context: IntegrationFSMContext): Promise<void>;
  shutdown(): Promise<void>;
  checkInvariants(context: IntegrationFSMContext): boolean;
}

// Re-export original interfaces for backward compatibility
export {
  IntegrationPlan,
  IntegrationPhase,
  IntegrationComponent,
  IntegrationPoint,
  IntegrationDependency,
  QualityGate,
  QualityCriteria,
  IntegrationTimeline,
  IntegrationMilestone,
  RiskMitigationStrategy,
  IntegrationExecution,
  PhaseExecution,
  ComponentResult,
  IntegrationPointResult,
  IntegrationResult,
  IntegrationConflict,
  ConflictResolution,
  ResolutionAction,
  IntegrationQualityMetrics,
  IntegrationLog
} from '../SystemIntegrationOrchestrator';

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: fsm-types-creation-001
// inputs: ["SystemIntegrationOrchestrator.ts", "IntegrationOrchestratorFSM.yaml"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"fsm-first-refactor-v1"}
// === END FOOTER ===