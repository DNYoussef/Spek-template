/**
 * FSM Types for Cross-Domain Integration Testing
 * NASA Rule 10 Compliant Type Definitions
 */

import { TestResult, IntegrationTest, IntegrationTestSuite } from '../CrossDomainIntegrationTester';

/**
 * Integration Test FSM States
 */
export enum IntegrationTestState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  RUNNING_BASIC_TESTS = 'running_basic_tests',
  RUNNING_CONSENSUS_TESTS = 'running_consensus_tests',
  RUNNING_STRESS_TESTS = 'running_stress_tests',
  RUNNING_FAILURE_TESTS = 'running_failure_tests',
  VALIDATING_RESULTS = 'validating_results',
  STORING_RESULTS = 'storing_results',
  COMPLETED = 'completed',
  ERROR = 'error',
  CLEANUP = 'cleanup'
}

/**
 * Integration Test FSM Events
 */
export enum IntegrationTestEvent {
  START_TESTING = 'start_testing',
  BASIC_TESTS_COMPLETE = 'basic_tests_complete',
  CONSENSUS_TESTS_COMPLETE = 'consensus_tests_complete',
  STRESS_TESTS_COMPLETE = 'stress_tests_complete',
  FAILURE_TESTS_COMPLETE = 'failure_tests_complete',
  RESULTS_VALIDATED = 'results_validated',
  RESULTS_STORED = 'results_stored',
  ERROR_OCCURRED = 'error_occurred',
  CLEANUP_REQUESTED = 'cleanup_requested',
  RESET = 'reset'
}

/**
 * Test Execution States
 */
export enum TestExecutionState {
  PENDING = 'pending',
  RUNNING = 'running',
  VALIDATING = 'validating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout'
}

/**
 * Integration Test Context
 */
export interface IntegrationTestContext {
  suiteId: string;
  currentTestIndex: number;
  totalTests: number;
  executionQueue: Array<() => Promise<TestResult>>;
  startTime: number;
  maxExecutionTime: number;
  currentSuite?: IntegrationTestSuite;
  activeTests: Map<string, IntegrationTest>;
  results: TestResult[];
  passingTests: number;
  failingTests: number;
  timeoutTests: number;
  errorTests: number;
}

/**
 * State Transition Configuration
 */
export interface IntegrationTestTransition {
  fromState: IntegrationTestState;
  event: IntegrationTestEvent;
  toState: IntegrationTestState;
  condition?: (context: IntegrationTestContext) => boolean;
  action?: (context: IntegrationTestContext) => Promise<void>;
  guards?: IntegrationTestGuard[];
}

/**
 * FSM Guards for Integration Testing
 */
export interface IntegrationTestGuard {
  name: string;
  condition: (context: IntegrationTestContext) => boolean;
  errorMessage: string;
}

/**
 * State Transition Guard
 */
export interface IntegrationStateTransitionGuard extends IntegrationTestGuard {
  fromState: IntegrationTestState;
  toState: IntegrationTestState;
  event: IntegrationTestEvent;
}

/**
 * Test Execution Bounds (NASA Rule 10 Compliance)
 */
export interface IntegrationTestBounds {
  maxTestIterations: number;
  maxSuiteIterations: number;
  maxRetryAttempts: number;
  maxConcurrentTests: number;
  maxExecutionTimeMs: number;
  maxTestTimeoutMs: number;
}

/**
 * Integration Test Metrics
 */
export interface IntegrationTestMetrics {
  totalTransitions: number;
  successfulTransitions: number;
  failedTransitions: number;
  totalExecutionTime: number;
  averageTestTime: number;
  throughputTestsPerSecond: number;
  memoryUsagePeak: number;
  contextIntegrityScore: number;
  complianceStatus: 'NASA_RULE_10_COMPLIANT' | 'NON_COMPLIANT';
}

/**
 * Princess Domain Test Configuration
 */
export interface PrincessDomainTestConfig {
  domainName: string;
  coordinationPrincess: string;
  targetPrincesses: string[];
  testTypes: Array<'handoff' | 'communication' | 'consensus'>;
  maxHandoffTime: number;
  maxCommunicationTime: number;
  maxConsensusTime: number;
}

/**
 * Integration Point Status
 */
export interface IntegrationPointStatus {
  point: string;
  status: 'success' | 'failure' | 'pending';
  details: string;
  timestamp: number;
  principalDomain?: string;
  targetDomain?: string;
}

/**
 * Test Suite Execution Result
 */
export interface IntegrationTestSuiteResult {
  suiteId: string;
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  timeoutTests: number;
  errorTests: number;
  duration: number;
  overallStatus: 'passed' | 'failed' | 'partial' | 'error';
  results: TestResult[];
  metrics: IntegrationTestMetrics;
  integrationPoints: IntegrationPointStatus[];
}

/**
 * FSM State Machine Contract for Integration Testing
 */
export interface IIntegrationTestStateMachine {
  // State Management
  getCurrentState(): IntegrationTestState;
  transitionState(event: IntegrationTestEvent, context?: IntegrationTestContext): Promise<boolean>;
  isValidTransition(fromState: IntegrationTestState, event: IntegrationTestEvent): boolean;
  getValidTransitions(state: IntegrationTestState): IntegrationTestEvent[];

  // Test Execution
  initializeTestSuite(suiteId: string): Promise<void>;
  executeTestSuite(suiteId: string): Promise<IntegrationTestSuiteResult>;
  executeSingleTest(test: IntegrationTest, context: IntegrationTestContext): Promise<TestResult>;

  // Cleanup and Reset
  cleanup(): Promise<void>;
  reset(): void;
}

/**
 * NASA Rule 10 Compliance Validator for Integration Tests
 */
export interface IntegrationTestNASAValidator {
  validateNoRecursion(testExecution: string, callStack: string[]): boolean;
  validateFixedLoops(testIterations: number, maxIterations: number): boolean;
  validateBoundedExecution(executionTime: number, maxTime: number): boolean;
  generateComplianceReport(metrics: IntegrationTestMetrics): IntegrationNASAComplianceReport;
}

/**
 * NASA Compliance Report for Integration Tests
 */
export interface IntegrationNASAComplianceReport {
  overallCompliance: boolean;
  recursionViolations: string[];
  unboundedLoopViolations: string[];
  fixedLoopCompliance: boolean;
  iterationBoundCompliance: boolean;
  executionTimeCompliance: boolean;
  recommendations: string[];
  testMetrics: IntegrationTestMetrics;
}

/**
 * Integration Test Error Types
 */
export class IntegrationTestFSMError extends Error {
  constructor(
    message: string,
    public state: IntegrationTestState,
    public event: IntegrationTestEvent,
    public context?: any
  ) {
    super(message);
    this.name = 'IntegrationTestFSMError';
  }
}

export class IntegrationTestNASAViolationError extends IntegrationTestFSMError {
  constructor(
    message: string,
    state: IntegrationTestState,
    event: IntegrationTestEvent,
    public violationType: 'RECURSION' | 'UNBOUNDED_LOOP' | 'TIMEOUT_VIOLATION',
    context?: any
  ) {
    super(message, state, event, context);
    this.name = 'IntegrationTestNASAViolationError';
  }
}

/**
 * FSM Configuration Constants for Integration Testing
 */
export const INTEGRATION_TEST_FSM_CONSTANTS = {
  MAX_STATE_TRANSITIONS: 1000,
  MAX_TEST_SUITE_DURATION_MS: 900000, // 15 minutes
  MAX_SINGLE_TEST_DURATION_MS: 60000, // 1 minute
  MAX_RETRY_ATTEMPTS: 3,
  MAX_CONCURRENT_TESTS: 10,
  MAX_TEST_ITERATIONS: 100,
  FIXED_DELAY_MS: 1000,
  DEFAULT_TIMEOUT_MS: 30000,
  PRINCESS_HANDOFF_TIMEOUT_MS: 15000,
  CONSENSUS_TIMEOUT_MS: 45000,
  COMMUNICATION_TIMEOUT_MS: 10000
} as const;

/**
 * Princess Domain Integration Configuration
 */
export interface PrincessIntegrationConfig {
  coordinationDomain: string;
  targetDomains: string[];
  handoffProtocol: 'mece' | 'consensus' | 'direct';
  communicationProtocol: 'broadcast' | 'unicast' | 'multicast';
  consensusProtocol: 'byzantine' | 'raft' | 'gossip';
  timeoutConfiguration: {
    handoff: number;
    communication: number;
    consensus: number;
  };
  retryConfiguration: {
    maxAttempts: number;
    backoffMs: number;
    exponentialBackoff: boolean;
  };
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T15:47:23-04:00 | agent@Sonnet4 | Created FSM types for integration testing with NASA Rule 10 compliance | IntegrationTestFSM.types.ts | OK | FSM-first development pattern | 0.00 | 8a7c5fd |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: integration-fsm-types-001
- inputs: ["CrossDomainIntegrationTester.ts", "ValidationFSM.types.ts"]
- tools_used: ["Write"]
- versions: {"model":"Sonnet4","prompt":"fsm-first-integration"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->