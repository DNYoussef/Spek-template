/**
 * Migration Orchestrator FSM Type Definitions
 * NASA Rule 10 Compliant - Centralized type definitions
 */

// Core FSM Types
export enum MigrationState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  VALIDATING_PREREQUISITES = 'VALIDATING_PREREQUISITES',
  EXECUTING_PHASE = 'EXECUTING_PHASE',
  EXECUTING_STEP = 'EXECUTING_STEP',
  VALIDATING_STEP = 'VALIDATING_STEP',
  ROLLING_BACK = 'ROLLING_BACK',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED'
}

export enum MigrationEvent {
  START_EXECUTION = 'START_EXECUTION',
  PREREQUISITES_VALIDATED = 'PREREQUISITES_VALIDATED',
  PHASE_STARTED = 'PHASE_STARTED',
  STEP_STARTED = 'STEP_STARTED',
  STEP_COMPLETED = 'STEP_COMPLETED',
  STEP_FAILED = 'STEP_FAILED',
  PHASE_COMPLETED = 'PHASE_COMPLETED',
  PHASE_FAILED = 'PHASE_FAILED',
  VALIDATION_PASSED = 'VALIDATION_PASSED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  ROLLBACK_REQUIRED = 'ROLLBACK_REQUIRED',
  ROLLBACK_COMPLETED = 'ROLLBACK_COMPLETED',
  EXECUTION_COMPLETED = 'EXECUTION_COMPLETED',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  PAUSE_EXECUTION = 'PAUSE_EXECUTION',
  RESUME_EXECUTION = 'RESUME_EXECUTION',
  ABORT_EXECUTION = 'ABORT_EXECUTION'
}

// Migration Context Types
export interface MigrationContext {
  executionId: string;
  plan: MigrationPlan;
  currentPhaseIndex: number;
  currentStepIndex: number;
  currentPhase?: MigrationPhase;
  currentStep?: MigrationStep;
  phaseResults: Map<string, PhaseExecutionResult>;
  stepResults: StepExecutionResult[];
  globalContext: Map<string, any>;
  startTime: Date;
  timeout?: number;
  options: ExecutionOptions;
  callbacks: ExecutionCallbacks;
  rollbackData?: RollbackData;
  error?: Error;
}

// Event Data Types
export interface MigrationEventData {
  type: MigrationEvent;
  payload?: any;
  timestamp: Date;
  source: string;
}

// State Transition Guard Types
export interface GuardContext {
  context: MigrationContext;
  event: MigrationEventData;
}

export type GuardFunction = (guard: GuardContext) => boolean;

// Transition Types
export interface StateTransition {
  fromState: MigrationState;
  toState: MigrationState;
  event: MigrationEvent;
  guard?: GuardFunction;
  action?: TransitionAction;
}

export type TransitionAction = (context: MigrationContext, event: MigrationEventData) => Promise<void>;

// FSM Configuration
export interface MigrationFSMConfig {
  initialState: MigrationState;
  transitions: StateTransition[];
  states: Map<MigrationState, StateHandler>;
  context: MigrationContext;
}

// State Handler Interface
export interface StateHandler {
  onEnter?(context: MigrationContext): Promise<void>;
  onExit?(context: MigrationContext): Promise<void>;
  tick?(context: MigrationContext): Promise<MigrationEvent | null>;
  canExit?(context: MigrationContext): boolean;
}

// Existing Type Imports (simplified for FSM)
export interface MigrationPlan {
  id: string;
  phases: MigrationPhase[];
  metadata: Record<string, any>;
}

export interface MigrationPhase {
  id: string;
  name: string;
  order: number;
  type: string;
  steps: MigrationStep[];
  prerequisites: string[];
  rollbackPoint: boolean;
  estimatedDuration: number;
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface MigrationStep {
  id: string;
  name: string;
  action: string;
  parameters: Record<string, any>;
  timeout: number;
  retryPolicy: RetryPolicy;
  validationChecks: ValidationCheck[];
  rollbackAction?: string;
  dependsOn?: string[];
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier?: number;
}

export interface ValidationCheck {
  type: string;
  threshold: number;
  unit?: string;
}

export interface ExecutionOptions {
  dryRun?: boolean;
  parallelExecution?: boolean;
  skipValidation?: boolean;
  continueOnError?: boolean;
  customTimeout?: number;
  rollbackOnFailure?: boolean;
  preserveState?: boolean;
}

export interface ExecutionCallbacks {
  onPhaseStart?: (phase: MigrationPhase, context: MigrationContext) => Promise<void>;
  onPhaseComplete?: (phase: MigrationPhase, result: PhaseExecutionResult) => Promise<void>;
  onPhaseError?: (phase: MigrationPhase, error: Error, context: MigrationContext) => Promise<void>;
  onStepStart?: (step: MigrationStep, context: MigrationContext) => Promise<void>;
  onStepComplete?: (step: MigrationStep, result: StepExecutionResult) => Promise<void>;
  onStepError?: (step: MigrationStep, error: Error, context: MigrationContext) => Promise<void>;
}

export interface PhaseExecutionResult {
  phaseId: string;
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  stepResults: StepExecutionResult[];
  artifacts: ExecutionArtifact[];
  metrics: PhaseMetrics;
  rollbackData?: RollbackData;
}

export interface StepExecutionResult {
  stepId: string;
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  output: any;
  error?: Error;
  retryCount: number;
  validationResults: StepValidationResult[];
  artifacts: ExecutionArtifact[];
}

export interface ExecutionArtifact {
  type: 'configuration' | 'backup' | 'deployment' | 'log' | 'metric';
  name: string;
  path: string;
  checksum: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface PhaseMetrics {
  executionTime: number;
  resourceUsage: ResourceUsage;
  throughput: number;
  errorCount: number;
  retryCount: number;
  validationScore: number;
}

export interface StepValidationResult {
  checkId: string;
  passed: boolean;
  value: any;
  threshold: any;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RollbackData {
  rollbackType: 'step' | 'phase' | 'full';
  rollbackActions: RollbackAction[];
  preservedState: any;
  dependencies: string[];
}

export interface RollbackAction {
  id: string;
  type: 'restore' | 'revert' | 'cleanup' | 'notify';
  action: string;
  parameters: Record<string, any>;
  order: number;
  timeout: number;
  critical: boolean;
}

export interface ResourceUsage {
  cpuUsage: number;
  memoryUsage: number;
  networkUsage: number;
  storageUsage: number;
}// APPEND TO END OF src/migration/fsm/types/MigrationFSMTypes.ts
// Additional types for migration planning strategy FSM

// State result type for FSM state handlers
export interface StateResult {
  success: boolean;
  nextState?: string;
  data?: unknown;
  error?: string;
  sideEffects?: SideEffect[];
}

// Migration planning events (subset specific to planning)
export enum MigrationPlanningEvent {
  START_PLANNING = 'START_PLANNING',
  ANALYZE_REQUEST = 'ANALYZE_REQUEST',
  REQUEST_ANALYZED = 'REQUEST_ANALYZED',
  REQUEST_VALIDATED = 'REQUEST_VALIDATED',
  REQUEST_INVALID = 'REQUEST_INVALID',
  SELECT_STRATEGY = 'SELECT_STRATEGY',
  STRATEGY_SELECTED = 'STRATEGY_SELECTED',
  STRATEGY_FAILED = 'STRATEGY_FAILED',
  GENERATE_PLAN = 'GENERATE_PLAN',
  PLAN_GENERATED = 'PLAN_GENERATED',
  VALIDATE_PLAN = 'VALIDATE_PLAN',
  PLAN_VALIDATED = 'PLAN_VALIDATED',
  PLAN_FINALIZED = 'PLAN_FINALIZED',
  PLAN_FAILED = 'PLAN_FAILED',
  CREATING_IMPLEMENTATION_PLAN = 'CREATING_IMPLEMENTATION_PLAN',
  IMPLEMENTATION_CREATED = 'IMPLEMENTATION_CREATED',
  IMPLEMENTATION_FAILED = 'IMPLEMENTATION_FAILED',
  CREATING_ROLLBACK_PLAN = 'CREATING_ROLLBACK_PLAN',
  ROLLBACK_CREATED = 'ROLLBACK_CREATED',
  ROLLBACK_FAILED = 'ROLLBACK_FAILED',
  ESTIMATING_RESOURCES = 'ESTIMATING_RESOURCES',
  RESOURCES_ESTIMATED = 'RESOURCES_ESTIMATED',
  RESOURCES_FAILED = 'RESOURCES_FAILED',
  GENERATING_MONITORING_PLAN = 'GENERATING_MONITORING_PLAN',
  MONITORING_CREATED = 'MONITORING_CREATED',
  MONITORING_FAILED = 'MONITORING_FAILED',
  PLANNING_COMMUNICATION = 'PLANNING_COMMUNICATION',
  COMMUNICATION_PLANNED = 'COMMUNICATION_PLANNED',
  COMMUNICATION_FAILED = 'COMMUNICATION_FAILED',
  ENSURING_QUALITY = 'ENSURING_QUALITY',
  QUALITY_ENSURED = 'QUALITY_ENSURED',
  QUALITY_FAILED = 'QUALITY_FAILED',
  FINALIZING_PLAN = 'FINALIZING_PLAN',
  PLANNING_FAILED = 'PLANNING_FAILED',
  PLANNING_COMPLETE = 'PLANNING_COMPLETE',
  RETRY_OPERATION = 'RETRY_OPERATION',
  ABORT_PLANNING = 'ABORT_PLANNING',
  ERROR = 'ERROR',
  RESET = 'RESET'
}

// Side effects for state transitions
export interface SideEffect {
  type: 'log' | 'notify' | 'persist' | 'trigger' | 'rollback';
  payload: unknown;
  timestamp: Date;
  priority?: 'low' | 'medium' | 'high';
}

// Migration planning state enum
export enum MigrationPlanningState {
  IDLE = 'IDLE',
  ANALYZING_REQUEST = 'ANALYZING_REQUEST',
  SELECTING_STRATEGY = 'SELECTING_STRATEGY',
  GENERATING_PLAN = 'GENERATING_PLAN',
  VALIDATING_PLAN = 'VALIDATING_PLAN',
  CREATING_IMPLEMENTATION_PLAN = 'CREATING_IMPLEMENTATION_PLAN',
  CREATING_ROLLBACK_PLAN = 'CREATING_ROLLBACK_PLAN',
  ESTIMATING_RESOURCES = 'ESTIMATING_RESOURCES',
  GENERATING_MONITORING_PLAN = 'GENERATING_MONITORING_PLAN',
  PLANNING_COMMUNICATION = 'PLANNING_COMMUNICATION',
  ENSURING_QUALITY = 'ENSURING_QUALITY',
  FINALIZING_PLAN = 'FINALIZING_PLAN',
  ERROR = 'ERROR',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// Migration planning request
export interface MigrationPlanningRequest {
  requestId: string;
  sourceSystem: string;
  targetSystem: string;
  scope: string[];
  constraints: Record<string, unknown>;
  preferences?: MigrationPreferences;
  metadata?: Record<string, unknown>;
  gapAnalysis?: any; // Gap analysis results
  riskAnalysis?: any; // Risk analysis results
  dependencyAnalysis?: any; // Dependency analysis results
  timeline?: number; // Timeline estimate in milliseconds
}

export interface MigrationPreferences {
  riskTolerance: 'low' | 'medium' | 'high';
  downtime: {
    maxMinutes: number;
    preferredWindow?: string;
  };
  rollbackStrategy: 'automatic' | 'manual' | 'none';
}

// Migration approach
export interface MigrationApproach {
  id: string;
  name: string;
  description: string;
  phases: string[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
  complexity: 'simple' | 'moderate' | 'complex';
  prerequisites: string[];
  benefits: string[];
  drawbacks: string[];
}

// Alternative approach
export interface AlternativeApproach extends MigrationApproach {
  comparisonToSelected: {
    timeDelta: number;
    riskDelta: number;
    costDelta: number;
    reasons: string[];
  };
}

// Transition guard type
export interface TransitionGuard {
  check: (context: unknown) => boolean;
  errorMessage?: string;
}

// Transition context for FSM state transitions
export interface TransitionContext {
  sourceState: MigrationState | string;
  targetState: MigrationState | string;
  event: MigrationEvent | string;
  payload?: any;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

// State invariants for validation
export interface StateInvariants {
  validateState(state: MigrationState | string, payload?: any): Promise<boolean>;
  checkTransitionPreconditions(
    sourceState: MigrationState | string,
    targetState: MigrationState | string,
    event: MigrationEvent | string,
    payload?: any
  ): Promise<boolean>;
  verifyPostConditions(
    targetState: MigrationState | string,
    event: MigrationEvent | string,
    payload?: any
  ): Promise<boolean>;
}
