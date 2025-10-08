import { ValidationResult } from '../../../../types/validation-types';

/**
 * NASA Rule 10 Compliant Validation FSM Types
 * Type definitions for FSM-based LangGraph validation system
 */

// FSM-First: Export ValidationState and ValidationEvent enums
export enum LangGraphTestValidationState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  RUNNING_CORE = 'RUNNING_CORE',
  RUNNING_STATE_MACHINES = 'RUNNING_STATE_MACHINES',
  RUNNING_INTEGRATION = 'RUNNING_INTEGRATION',
  RUNNING_EDGE_CASES = 'RUNNING_EDGE_CASES',
  RUNNING_RECOVERY = 'RUNNING_RECOVERY',
  RUNNING_CONCURRENCY = 'RUNNING_CONCURRENCY',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  CLEANUP = 'CLEANUP',
  VALIDATING = 'VALIDATING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED'
}

export enum LangGraphTestValidationEvent {
  START = 'START',
  CORE_COMPLETE = 'CORE_COMPLETE',
  STATE_MACHINES_COMPLETE = 'STATE_MACHINES_COMPLETE',
  INTEGRATION_COMPLETE = 'INTEGRATION_COMPLETE',
  EDGE_CASES_COMPLETE = 'EDGE_CASES_COMPLETE',
  RECOVERY_COMPLETE = 'RECOVERY_COMPLETE',
  CONCURRENCY_COMPLETE = 'CONCURRENCY_COMPLETE',
  CLEANUP_REQUESTED = 'CLEANUP_REQUESTED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  VALIDATE = 'VALIDATE',
  PASS = 'PASS',
  FAIL = 'FAIL',
  SKIP = 'SKIP',
  RESET = 'RESET'
}

export interface ValidationTransition {
  fromState: LangGraphTestValidationState;
  event: LangGraphTestValidationEvent;
  toState: LangGraphTestValidationState;
  condition?: () => boolean;
  action?: () => Promise<void>;
}

export interface ValidationFSMConfig {
  maxIterationsPerTest: number;
  maxRetryAttempts: number;
  maxConcurrentOperations: number;
  fixedTimeoutMs: number;
  enableBoundedExecution: boolean;
}

export interface ValidationConfig {
  enableIntegrationTests: boolean;
  enableStressTests: boolean;
  enableEdgeCaseTests: boolean;
  enableRecoveryTests: boolean;
  timeout: number;
  maxRetries: number;
}


export interface ValidationExecutionContext {
  currentState: LangGraphTestValidationState;
  previousState?: LangGraphTestValidationState;
  lastEvent?: LangGraphTestValidationEvent;
  currentTestIndex: number;
  totalTests: number;
  executionQueue: Array<() => Promise<void>>;
  startTime: number;
  maxExecutionTime: number;
}

export interface ValidationBounds {
  maxConcurrentWorkflows: number;
  maxConcurrentStateUpdates: number;
  maxConcurrentMessages: number;
  maxStateHistoryChecks: number;
  maxCircuitBreakerAttempts: number;
  maxReceivers: number;
}

export interface FSMValidationMetrics {
  stateTransitions: Array<{
    from: LangGraphTestValidationState;
    to: LangGraphTestValidationState;
    event: LangGraphTestValidationEvent;
    timestamp: number;
    duration: number;
  }>;
  stateExecutionTime: Record<LangGraphTestValidationState, number>;
  stateTransitionCount: number;
  validTransitions: number;
  invalidTransitions: number;
  executionTime: number;
  iterationBounds: ValidationBounds;
  complianceStatus: 'NASA_RULE_10_COMPLIANT' | 'NON_COMPLIANT';
}

export interface ValidationTestExecution {
  testName: string;
  iterations: number;
  maxIterations: number;
  boundedExecution: boolean;
  fixedLoopCompliance: boolean;
  nonRecursiveExecution: boolean;
}

/**
 * FSM State Machine Contract
 */
export interface ValidationStateMachine {
  currentState: LangGraphTestValidationState;
  transitionState(event: LangGraphTestValidationEvent): boolean;
  isValidTransition(fromState: LangGraphTestValidationState, event: LangGraphTestValidationEvent): boolean;
  getValidTransitions(state: LangGraphTestValidationState): LangGraphTestValidationEvent[];
  getCurrentState(): LangGraphTestValidationState;
  reset(): void;
}

/**
 * NASA Rule 10 Compliance Validator
 */
export interface NASARule10Validator {
  validateNoRecursion(functionName: string, callStack: string[]): boolean;
  validateFixedLoops(loopInfo: LoopInfo[]): boolean;
  validateBoundedIterations(iterations: number, maxIterations: number): boolean;
  generateComplianceReport(): NASAComplianceReport;
}

export interface LoopInfo {
  functionName: string;
  loopType: 'for' | 'while' | 'do-while';
  maxIterations: number;
  actualIterations: number;
  isFixed: boolean;
  isBounded: boolean;
}

export interface NASAComplianceReport {
  overallCompliance: boolean;
  recursionViolations: string[];
  unboundedLoopViolations: string[];
  fixedLoopCompliance: boolean;
  iterationBoundCompliance: boolean;
  recommendations: string[];
}

/**
 * Validation Test Registry
 */
export interface ValidationTestRegistry {
  coreTests: ValidationTestDefinition[];
  conditionalTests: ValidationTestDefinition[];
  integrationTests: ValidationTestDefinition[];
  edgeCaseTests: ValidationTestDefinition[];
  recoveryTests: ValidationTestDefinition[];
  concurrencyTests: ValidationTestDefinition[];
}

export interface ValidationTestDefinition {
  name: string;
  description: string;
  executionFunction: () => Promise<void>;
  maxIterations: number;
  timeout: number;
  dependencies: string[];
  bounds: Partial<ValidationBounds>;
  nasaCompliant: boolean;
}

/**
 * FSM Execution Guards
 */
export interface ValidationGuard {
  name: string;
  condition: () => boolean;
  errorMessage: string;
}

export interface StateTransitionGuard extends ValidationGuard {
  fromState: LangGraphTestValidationState;
  toState: LangGraphTestValidationState;
  event: LangGraphTestValidationEvent;
}

/**
 * Test Execution Bounds
 */
export interface ExecutionBounds {
  maxTestDuration: number;
  maxTotalDuration: number;
  maxRetries: number;
  maxConcurrentOperations: number;
  timeoutMs: number;
}

/**
 * Validation Result Extensions
 */
export interface FSMValidationResult {
  testName: string;
  success: boolean;
  message: string;
  details?: any;
  errors: string[];
  warnings: string[];
  executionTime: number;
  assertions: {
    total: number;
    passed: number;
    failed: number;
  };
  iterationCount: number;
  maxIterations: number;
  nasaCompliance: {
    rule10Compliant: boolean;
    noRecursion: boolean;
    fixedLoops: boolean;
    boundedIterations: boolean;
  };
  fsmMetrics: FSMValidationMetrics;
}

/**
 * Error Types for FSM Validation
 */
export class ValidationFSMError extends Error {
  constructor(
    message: string,
    public state: LangGraphTestValidationState,
    public event: LangGraphTestValidationEvent,
    public context?: any
  ) {
    super(message);
    this.name = 'ValidationFSMError';
  }
}

export class NASARule10ViolationError extends ValidationFSMError {
  constructor(
    message: string,
    state: LangGraphTestValidationState,
    event: LangGraphTestValidationEvent,
    public violationType: 'RECURSION' | 'UNBOUNDED_LOOP' | 'VARIABLE_ITERATION',
    context?: any
  ) {
    super(message, state, event, context);
    this.name = 'NASARule10ViolationError';
  }
}

/**
 * FSM Configuration Constants
 */
export const FSM_VALIDATION_CONSTANTS = {
  MAX_STATE_TRANSITIONS: 1000,
  MAX_TEST_DURATION_MS: 60000,
  MAX_TOTAL_SUITE_DURATION_MS: 600000,
  MAX_RETRY_ATTEMPTS: 5,
  MAX_CONCURRENT_OPERATIONS: 50,
  FIXED_DELAY_MS: 1000,
  DEFAULT_TIMEOUT_MS: 30000
} as const;

/**
 * Validation State Machine Implementation Contract
 */
export interface IValidationStateMachine {
  // State Management
  initialize(): Promise<void>;
  getCurrentState(): LangGraphTestValidationState;
  transitionState(event: LangGraphTestValidationEvent): Promise<boolean>;

  // Validation Execution
  executeValidationSuite(): Promise<FSMValidationResult[]>;
  executeTest(testDefinition: ValidationTestDefinition): Promise<FSMValidationResult>;

  // NASA Rule 10 Compliance
  validateNASACompliance(): NASAComplianceReport;

  // Cleanup
  cleanup(): Promise<void>;
  destroy(): Promise<void>; // Alternative to cleanup to avoid EventEmitter conflicts
  reset(): void;
  initialize(): Promise<void>; // Add explicit initialize method
}