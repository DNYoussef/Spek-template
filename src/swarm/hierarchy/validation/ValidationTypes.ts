/**
 * FSM Validation Types - Type System for Sandbox Validation States
 * NASA Rule 10 compliant: Centralized type definitions with no functions >60 lines
 */

// FSM State Definitions
export enum ValidationState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  SETTING_UP = 'SETTING_UP',
  COMPILING = 'COMPILING',
  TESTING = 'TESTING',
  ANALYZING_PERFORMANCE = 'ANALYZING_PERFORMANCE',
  SCANNING_SECURITY = 'SCANNING_SECURITY',
  RUNNING_INTEGRATION = 'RUNNING_INTEGRATION',
  FINALIZING = 'FINALIZING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED'
}

// FSM Event Definitions
export enum ValidationEvent {
  START_VALIDATION = 'START_VALIDATION',
  INITIALIZATION_COMPLETE = 'INITIALIZATION_COMPLETE',
  SETUP_COMPLETE = 'SETUP_COMPLETE',
  COMPILATION_COMPLETE = 'COMPILATION_COMPLETE',
  COMPILATION_FAILED = 'COMPILATION_FAILED',
  TESTING_COMPLETE = 'TESTING_COMPLETE',
  TESTING_FAILED = 'TESTING_FAILED',
  PERFORMANCE_COMPLETE = 'PERFORMANCE_COMPLETE',
  SECURITY_COMPLETE = 'SECURITY_COMPLETE',
  SECURITY_FAILED = 'SECURITY_FAILED',
  INTEGRATION_COMPLETE = 'INTEGRATION_COMPLETE',
  FINALIZATION_COMPLETE = 'FINALIZATION_COMPLETE',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  TERMINATE = 'TERMINATE',
  RESET = 'RESET'
}

// Validation Context (passed between states)
export interface ValidationContext {
  sandboxId: string;
  files: string[];
  context: any;
  config: SandboxConfiguration;
  startTime: number;
  currentState?: ValidationState;
  previousState?: ValidationState;

  // State Results
  sandbox?: SandboxInstance;
  compilationResult?: Partial<SandboxTestResult>;
  testResult?: Partial<SandboxTestResult>;
  performanceMetrics?: SandboxTestResult['performanceMetrics'];
  securityIssues?: SecurityIssue[];
  integrationTests?: IntegrationTestResult[];

  // Error tracking
  errors?: string[];
  warnings?: string[];

  // FSM metadata
  transitionHistory?: Array<{
    from: ValidationState;
    to: ValidationState;
    event: ValidationEvent;
    timestamp: number;
  }>;
}

// State Handler Contract
export interface StateHandler {
  readonly stateName: ValidationState;

  /**
   * Enter state and execute state logic
   * NASA Rule 10: Must be ≤60 lines with 2+ assertions
   */
  enter(context: ValidationContext): Promise<StateResult>;

  /**
   * Handle events while in this state
   * NASA Rule 10: Must be ≤60 lines with 2+ assertions
   */
  handleEvent(event: ValidationEvent, context: ValidationContext): Promise<StateTransition>;

  /**
   * Exit state and cleanup
   * NASA Rule 10: Must be ≤60 lines with 2+ assertions
   */
  exit(context: ValidationContext): Promise<void>;

  /**
   * Check state invariants
   * NASA Rule 10: Must be ≤60 lines with 2+ assertions
   */
  checkInvariants(context: ValidationContext): boolean;
}

// State execution result
export interface StateResult {
  success: boolean;
  nextEvent?: ValidationEvent;
  data?: any;
  errors?: string[];
  warnings?: string[];
}

// State transition definition
export interface StateTransition {
  targetState: ValidationState;
  shouldTransition: boolean;
  guards?: TransitionGuard[];
  data?: any;
}

// Transition guard for complex transitions
export interface TransitionGuard {
  name: string;
  condition: (context: ValidationContext) => boolean;
  errorMessage?: string;
}

// FSM Transition Rules
export interface TransitionRule {
  fromState: ValidationState;
  toState: ValidationState;
  event: ValidationEvent;
  guards?: TransitionGuard[];
}

// Re-export existing types for compatibility
export interface SandboxConfiguration {
  timeout: number;
  model: string;
  autoFix: boolean;
  strictMode: boolean;
  environment?: {
    nodeVersion?: string;
    pythonVersion?: string;
    dependencies?: Record<string, string>;
  };
}

export interface SandboxTestResult {
  sandboxId: string;
  timestamp: number;
  compiled: boolean;
  compilationErrors?: string[];
  compilationWarnings?: string[];
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  testErrors?: TestError[];
  allTestsPassed: boolean;
  runtimeErrors: string[];
  consoleOutput: string[];
  executionTime: number;
  performanceMetrics: {
    executionTime: number;
    memoryUsage: number;
    cpuUsage?: number;
    networkLatency?: number;
  };
  coverage?: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
  integrationTests?: IntegrationTestResult[];
  securityIssues?: SecurityIssue[];
}

export interface TestError {
  testName: string;
  errorMessage: string;
  stackTrace?: string;
  file?: string;
  line?: number;
}

export interface IntegrationTestResult {
  testName: string;
  components: string[];
  passed: boolean;
  executionTime: number;
  errors?: string[];
}

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  file?: string;
  line?: number;
  recommendation: string;
}

export interface SandboxInstance {
  id: string;
  config: SandboxConfiguration;
  startTime: number;
  status: 'initializing' | 'ready' | 'running' | 'terminated';
  processes: any[];
  fileSystem: Map<string, string>;
  environment: Record<string, any>;
  capabilities?: {
    maxRuntime: number;
    autoDebug: boolean;
    iterativeTesting: boolean;
    browserAutomation: boolean;
  };
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T09:45:12-04:00 | agent@Sonnet-4 | Created FSM validation types system | ValidationTypes.ts | OK | NASA Rule 10 compliant type definitions | 0.00 | a7b3c4e |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: codex-046-fsm-types
- inputs: ["CodexSandboxValidator analysis"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4-20250514","prompt":"v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->