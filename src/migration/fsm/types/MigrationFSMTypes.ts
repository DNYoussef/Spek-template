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
}