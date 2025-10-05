/**
 * Core types and interfaces for FSM-based migration analysis workflow.
 * NASA Rule 10 compliant: Functions ≤60 lines, explicit assertions.
 */

// FSM States
export enum AnalysisState {
  INITIALIZED = 'INITIALIZED',
  ANALYZING = 'ANALYZING',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  DEPENDENCY_MAPPING = 'DEPENDENCY_MAPPING',
  PLANNING = 'PLANNING',
  VALIDATION = 'VALIDATION',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// FSM Events
export enum AnalysisEvent {
  START_ANALYSIS = 'START_ANALYSIS',
  ANALYSIS_COMPLETE = 'ANALYSIS_COMPLETE',
  START_RISK_ASSESSMENT = 'START_RISK_ASSESSMENT',
  RISK_ASSESSMENT_COMPLETE = 'RISK_ASSESSMENT_COMPLETE',
  START_DEPENDENCY_MAPPING = 'START_DEPENDENCY_MAPPING',
  DEPENDENCY_MAPPING_COMPLETE = 'DEPENDENCY_MAPPING_COMPLETE',
  START_PLANNING = 'START_PLANNING',
  PLANNING_COMPLETE = 'PLANNING_COMPLETE',
  START_VALIDATION = 'START_VALIDATION',
  VALIDATION_COMPLETE = 'VALIDATION_COMPLETE',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  CANCEL_ANALYSIS = 'CANCEL_ANALYSIS',
  RETRY_OPERATION = 'RETRY_OPERATION',
  RESET = 'RESET'
}

// State Machine Configuration
export interface StateMachineConfig {
  maxRetries: number;
  timeoutMs: number;
  enableLogging: boolean;
  enableMetrics: boolean;
  persistState: boolean;
}

// State Context for Migration FSM
export interface MigrationAnalysisContext {
  analysisId: string;
  request: ImpactAnalysisRequest;
  systemAnalysis?: SystemAnalysisResult;
  gapAnalysis?: GapAnalysisResult;
  riskAnalysis?: RiskAnalysisResult;
  dependencyAnalysis?: DependencyAnalysisResult;
  migrationPlan?: ComprehensiveMigrationPlan;
  validationResults?: ValidationResults;
  errors: AnalysisError[];
  retryCount: number;
  startTime: Date;
  phaseTimings: Map<string, PhaseTimings>;
  metadata: AnalysisMetadata;
}

export interface AnalysisError {
  phase: string;
  error: Error;
  timestamp: Date;
  recoverable: boolean;
  retryAttempts: number;
}

export interface PhaseTimings {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  success: boolean;
}

export interface AnalysisMetadata {
  version: string;
  configHash: string;
  userId?: string;
  sessionId?: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationResults {
  overall: 'pass' | 'fail' | 'warning';
  checks: ValidationCheck[];
  recommendations: string[];
  score: number;
}

export interface ValidationCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

// State Handler Interface
export interface StateHandler {
  init(context: MigrationAnalysisContext): Promise<void>;
  update(event: AnalysisEvent, context: MigrationAnalysisContext): Promise<AnalysisEvent | null>;
  shutdown(context: MigrationAnalysisContext): Promise<void>;
  checkInvariants(context: MigrationAnalysisContext): boolean;
}

// State Machine Transition
export interface StateTransition {
  from: AnalysisState;
  event: AnalysisEvent;
  to: AnalysisState;
  guard?: TransitionGuard;
  action?: TransitionAction;
  timeout?: number;
}

export type TransitionGuard = (context: MigrationAnalysisContext) => boolean;
export type TransitionAction = (context: MigrationAnalysisContext) => Promise<void>;

export interface StateTransitionRecord {
  from: AnalysisState;
  event: AnalysisEvent;
  to: AnalysisState;
  timestamp: Date;
  analysisId: string;
}

export interface AnalysisStatus {
  analysisId: string;
  currentState: AnalysisState;
  progress: number;
  duration: number;
  errorCount: number;
  retryCount: number;
  isComplete: boolean;
  lastTransition: StateTransitionRecord | null;
  nextPossibleEvents: AnalysisEvent[];
}

// Re-export types from other modules
export interface ImpactAnalysisRequest {
  sourceSystem: string;
  migrationScope: string;
  targetEnvironment?: string;
  constraints?: string[];
}

// Alias for backward compatibility
export type AnalysisRequest = ImpactAnalysisRequest;

export interface SystemAnalysisResult {
  components: string[];
  dependencies: string[];
  complexity: number;
}

export interface GapAnalysisResult {
  gaps: string[];
  impact: number;
}

export interface RiskAnalysisResult {
  risks: string[];
  severity: number;
}

export interface DependencyAnalysisResult {
  dependencies: string[];
  circular: boolean;
}

export interface ComprehensiveMigrationPlan {
  phases: string[];
  timeline: number;
  resources: string[];
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: fsm-refactor-001
// inputs: ["AnalysisStateMachine.ts"]
// tools_used: ["filesystem"]
// versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
// === END FOOTER ===