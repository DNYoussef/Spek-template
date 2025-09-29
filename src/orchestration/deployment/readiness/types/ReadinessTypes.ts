/**
 * ReadinessTypes.ts - Type definitions for deployment readiness validation FSM
 * 
 * Provides comprehensive type safety for the deployment readiness validation system
 * with explicit states, events, and validation structures.
 */

// Core readiness data structures
export interface ReadinessValidation {
  validationId: string;
  timestamp: number;
  overallReadiness: boolean;
  readinessScore: number;
  targetScore: number;
  categories: CategoryReadiness[];
  blockers: ReadinessBlocker[];
  warnings: ReadinessWarning[];
  recommendations: string[];
  signoffs: Signoff[];
  deploymentApproval: DeploymentApproval;
}

export interface CategoryReadiness {
  categoryId: string;
  name: string;
  ready: boolean;
  score: number;
  minimumScore: number;
  checks: ReadinessCheck[];
  criticalIssues: number;
  warningIssues: number;
  lastValidated: number;
}

export interface ReadinessCheck {
  checkId: string;
  name: string;
  description: string;
  category: string;
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  score: number;
  required: boolean;
  evidence: Evidence[];
  lastRun: number;
  recommendations: string[];
}

export interface ReadinessBlocker {
  blockerId: string;
  category: string;
  severity: 'critical' | 'major' | 'minor';
  title: string;
  description: string;
  impact: string;
  remediation: string;
  estimatedResolution: number;
  blocksDeployment: boolean;
  assignee?: string;
}

export interface ReadinessWarning {
  warningId: string;
  category: string;
  title: string;
  description: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Evidence {
  type: 'file' | 'command_output' | 'metric' | 'test_result' | 'manual_verification';
  source: string;
  content: string;
  timestamp: number;
  valid: boolean;
}

export interface Signoff {
  signoffId: string;
  role: string;
  approver: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp?: number;
  comments?: string;
  requiredFor: 'staging' | 'production' | 'both';
}

export interface DeploymentApproval {
  approved: boolean;
  approvalLevel: 'conditional' | 'full' | 'rejected';
  conditions: string[];
  validUntil: number;
  approvedBy: string[];
  rejectedBy: string[];
  notes: string;
}

export interface ValidationOptions {
  includeManualChecks?: boolean;
  skipCategories?: string[];
  generateEvidence?: boolean;
  requireSignoffs?: boolean;
  environmentTarget?: 'staging' | 'production';
  strictMode?: boolean;
}

// FSM State definitions
export enum ReadinessState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  VALIDATING_CODE_QUALITY = 'VALIDATING_CODE_QUALITY',
  VALIDATING_TESTING = 'VALIDATING_TESTING',
  VALIDATING_SECURITY = 'VALIDATING_SECURITY',
  VALIDATING_PERFORMANCE = 'VALIDATING_PERFORMANCE',
  VALIDATING_INFRASTRUCTURE = 'VALIDATING_INFRASTRUCTURE',
  VALIDATING_DOCUMENTATION = 'VALIDATING_DOCUMENTATION',
  VALIDATING_OPERATIONAL = 'VALIDATING_OPERATIONAL',
  VALIDATING_BUSINESS = 'VALIDATING_BUSINESS',
  CALCULATING_READINESS = 'CALCULATING_READINESS',
  PROCESSING_SIGNOFFS = 'PROCESSING_SIGNOFFS',
  MAKING_DECISION = 'MAKING_DECISION',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// FSM Event definitions
export enum ReadinessEvent {
  START_VALIDATION = 'START_VALIDATION',
  VALIDATION_COMPLETE = 'VALIDATION_COMPLETE',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  PROCEED_NEXT = 'PROCEED_NEXT',
  SKIP_CATEGORY = 'SKIP_CATEGORY',
  RETRY_VALIDATION = 'RETRY_VALIDATION',
  ABORT_VALIDATION = 'ABORT_VALIDATION',
  RESET = 'RESET'
}

// Context for FSM state management
export interface ReadinessContext {
  validationId: string;
  validation: ReadinessValidation;
  options: ValidationOptions;
  projectRoot: string;
  currentCategory?: string;
  retryCount: number;
  maxRetries: number;
  error?: Error;
}

// Check configuration interface
export interface CheckConfig {
  checkId: string;
  name: string;
  description: string;
  category: string;
  command: string;
  required: boolean;
  scoreWeight: number;
  timeout?: number;
}

// Validation result interface
export interface ValidationResult {
  success: boolean;
  category?: CategoryReadiness;
  error?: Error;
  recommendations: string[];
}

// Transition guard function type
export type TransitionGuard = (context: ReadinessContext) => boolean;

// Action function type
export type StateAction = (context: ReadinessContext) => Promise<ReadinessContext>;

// FSM transition definition
export interface StateTransition {
  from: ReadinessState;
  to: ReadinessState;
  event: ReadinessEvent;
  guard?: TransitionGuard;
  action?: StateAction;
}

// State handler interface
export interface StateHandler {
  enter(context: ReadinessContext): Promise<ReadinessContext>;
  exit(context: ReadinessContext): Promise<ReadinessContext>;
  checkInvariants(context: ReadinessContext): boolean;
}

// Readiness metrics for monitoring
export interface ReadinessMetrics {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  skippedChecks: number;
  criticalIssues: number;
  warnings: number;
  validationDuration: number;
  categoryScores: Record<string, number>;
}

// Error handling for readiness validation
export class ReadinessValidationError extends Error {
  constructor(
    message: string,
    public readonly category?: string,
    public readonly checkId?: string,
    public readonly severity: 'critical' | 'major' | 'minor' = 'major'
  ) {
    super(message);
    this.name = 'ReadinessValidationError';
  }
}

// Configuration for validation categories
export interface CategoryConfig {
  categoryId: string;
  name: string;
  minimumScore: number;
  required: boolean;
  checks: CheckConfig[];
  dependencies?: string[];
}

// Complete readiness configuration
export interface ReadinessConfig {
  categories: CategoryConfig[];
  targetScores: {
    staging: number;
    production: number;
  };
  signoffRequirements: {
    staging: string[];
    production: string[];
  };
  timeouts: {
    checkTimeout: number;
    categoryTimeout: number;
    overallTimeout: number;
  };
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: readiness-types-001
// inputs: ["DeploymentReadinessValidator.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"fsm-refactor-v2"}
// === END FOOTER ===