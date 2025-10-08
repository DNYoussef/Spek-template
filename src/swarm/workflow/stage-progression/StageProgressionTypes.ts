/**
 * Stage Progression Types - FSM State and Event Definitions
 * Part of StageProgressionValidator decomposition
 * NASA Rule 10 compliant - focused type definitions
 */

// FSM State Definitions
export enum StageState {
  PENDING = 'pending',
  ENTRY_VALIDATION = 'entry_validation',
  IN_PROGRESS = 'in_progress',
  EXIT_VALIDATION = 'exit_validation',
  COMPLETED = 'completed',
  FAILED = 'failed',
  BLOCKED = 'blocked',
  RETRY = 'retry'
}

export enum StageEvent {
  START = 'start',
  ENTRY_GATES_PASSED = 'entry_gates_passed',
  ENTRY_GATES_FAILED = 'entry_gates_failed',
  WORK_COMPLETED = 'work_completed',
  WORK_FAILED = 'work_failed',
  EXIT_GATES_PASSED = 'exit_gates_passed',
  EXIT_GATES_FAILED = 'exit_gates_failed',
  RETRY_REQUESTED = 'retry_requested',
  TIMEOUT = 'timeout',
  BLOCK = 'block',
  UNBLOCK = 'unblock'
}

export interface StageTransition {
  fromState: StageState;
  event: StageEvent;
  toState: StageState;
  guard?: (context: StageContext) => boolean;
  action?: (context: StageContext) => Promise<void>;
}

export interface WorkflowStage {
  stageId: string;
  stageName: string;
  state: StageState;
  entryGates: ValidationGate[];
  exitGates: ValidationGate[];
  dependencies: string[];
  estimatedDuration: number;
  actualDuration?: number;
  retryCount: number;
  maxRetries: number;
  metadata: Record<string, any>;
}

export interface ValidationGate {
  gateId: string;
  gateName: string;
  validator: string;
  required: boolean;
  threshold: number;
  actualValue?: number;
  passed?: boolean;
  message?: string;
}

export interface StageContext {
  stageId: string;
  currentState: StageState;
  workflowId: string;
  executionContext: Record<string, any>;
  validationResults: Record<string, any>;
  metadata: Record<string, any>;
  startTime?: number;
  endTime?: number;
}

export interface ProgressionResult {
  success: boolean;
  newState: StageState;
  validationsPassed: number;
  validationsFailed: number;
  message: string;
  errors: string[];
  evidence: ProgressionEvidence;
}

export interface ProgressionEvidence {
  timestamp: number;
  stageId: string;
  transition: string;
  validationDetails: ValidationDetail[];
  metrics: ProgressionMetrics;
}

export interface ValidationDetail {
  gateId: string;
  result: boolean;
  score: number;
  evidence: string;
  timestamp: number;
}

export interface ProgressionMetrics {
  transitionTime: number;
  validationTime: number;
  totalGates: number;
  passedGates: number;
  failedGates: number;
  retryAttempts: number;
}