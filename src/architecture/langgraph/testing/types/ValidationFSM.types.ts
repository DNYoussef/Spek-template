/**
 * NASA Rule 10 Compliant Validation FSM Types
 * Type definitions for FSM-based LangGraph validation system
 */

import { ValidationState, ValidationEvent } from '../ValidationSuite';

export interface ValidationTransition {
  fromState: ValidationState;
  event: ValidationEvent;
  toState: ValidationState;
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

export interface ValidationExecutionContext {
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
  currentState: ValidationState;
  transitionState(event: ValidationEvent): boolean;
  isValidTransition(fromState: ValidationState, event: ValidationEvent): boolean;
  getValidTransitions(state: ValidationState): ValidationEvent[];
  getCurrentState(): ValidationState;
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
  fromState: ValidationState;
  toState: ValidationState;
  event: ValidationEvent;
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
    public state: ValidationState,
    public event: ValidationEvent,
    public context?: any
  ) {
    super(message);
    this.name = 'ValidationFSMError';
  }
}

export class NASARule10ViolationError extends ValidationFSMError {
  constructor(
    message: string,
    state: ValidationState,
    event: ValidationEvent,
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
  getCurrentState(): ValidationState;
  transitionState(event: ValidationEvent): Promise<boolean>;

  // Validation Execution
  executeValidationSuite(): Promise<FSMValidationResult[]>;
  executeTest(testDefinition: ValidationTestDefinition): Promise<FSMValidationResult>;

  // NASA Rule 10 Compliance
  validateNASACompliance(): NASAComplianceReport;

  // Cleanup
  cleanup(): Promise<void>;
  reset(): void;
}