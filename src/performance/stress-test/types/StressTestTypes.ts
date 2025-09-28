/**
 * Stress Test Type Definitions
 * Extracted from god object for type safety and reusability
 */

export interface StressTestConfig {
  name: string;
  description?: string;
  phases: StressPhase[];
  maxDuration: number; // milliseconds
  failureThresholds: FailureThresholds;
  monitoring: MonitoringConfig;
  recovery: RecoveryConfig;
  targets: TestTargets;
}

export interface StressPhase {
  name: string;
  duration: number;
  concurrency: number;
  requestsPerSecond: number;
  rampUpTime?: number;
  rampDownTime?: number;
  distributionPattern: 'constant' | 'ramp' | 'spike' | 'burst' | 'wave';
  expectedBehavior?: {
    maxResponseTime?: number;
    minSuccessRate?: number;
    maxMemoryMB?: number;
    maxCPUPercent?: number;
  };
}

export interface FailureThresholds {
  maxResponseTime: number; // milliseconds
  minSuccessRate: number; // percentage (0-1)
  maxMemoryMB: number;
  maxCPUPercent: number;
  maxErrorRate: number; // percentage (0-1)
  systemFailure: {
    maxLoadAverage: number;
    minFreeMemoryMB: number;
    maxDiskUsagePercent: number;
  };
}

export interface MonitoringConfig {
  collectSystemMetrics: boolean;
  collectMemoryProfile: boolean;
  collectCPUProfile: boolean;
  metricsInterval: number; // milliseconds
  alertThresholds: AlertThresholds;
}

export interface AlertThresholds {
  responseTimeWarning: number;
  memoryWarningMB: number;
  cpuWarningPercent: number;
  errorRateWarning: number;
}

export interface RecoveryConfig {
  enableAutoRecovery: boolean;
  maxRecoveryAttempts: number;
  recoveryDelay: number; // milliseconds
  gracefulShutdown: boolean;
  cleanupTimeout: number; // milliseconds
}

export interface TestTargets {
  targetFunction?: string;
  targetModule?: string;
  payload?: any;
  setupFunction?: string;
  teardownFunction?: string;
}

export interface StressTestResult {
  testName: string;
  startTime: number;
  endTime: number;
  totalDuration: number;
  phases: PhaseResult[];
  overallMetrics: OverallMetrics;
  systemHealth: SystemHealthSnapshot[];
  failures: StressFailure[];
  recovery: RecoveryAttempt[];
  success: boolean;
  summary: TestSummary;
}

export interface PhaseResult {
  phaseName: string;
  loadResult: any; // LoadResult from LoadGenerator
  systemMetrics: any[]; // SystemMetrics array
  memoryProfile?: any;
  cpuProfile?: any;
  alerts: Alert[];
  thresholdViolations: ThresholdViolation[];
  success: boolean;
}

export interface OverallMetrics {
  totalRequests: number;
  totalSuccesses: number;
  totalFailures: number;
  overallSuccessRate: number;
  averageResponseTime: number;
  peakResponseTime: number;
  peakConcurrency: number;
  peakMemoryMB: number;
  peakCPUPercent: number;
  throughputPeakRPS: number;
  systemStability: number; // 0-1 score
}

export interface SystemHealthSnapshot {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    temperature?: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    cached: number;
    swap: number;
  };
  disk: {
    usage: number;
    readIOPS: number;
    writeIOPS: number;
  };
  network: {
    connectionsActive: number;
    throughputMbps: number;
    packetLoss: number;
  };
  process: {
    handles: number;
    threads: number;
    uptime: number;
  };
}

export interface StressFailure {
  timestamp: number;
  type: 'threshold' | 'system' | 'application' | 'timeout';
  phase: string;
  severity: 'warning' | 'error' | 'critical';
  description: string;
  metrics: any;
  recoverable: boolean;
}

export interface RecoveryAttempt {
  timestamp: number;
  reason: string;
  action: string;
  success: boolean;
  duration: number;
  resultingState: any;
}

export interface Alert {
  timestamp: number;
  type: 'performance' | 'resource' | 'error' | 'system';
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metrics: any;
}

export interface ThresholdViolation {
  timestamp: number;
  threshold: string;
  expected: number;
  actual: number;
  severity: 'minor' | 'major' | 'critical';
  duration: number;
}

export interface TestSummary {
  passedPhases: number;
  failedPhases: number;
  totalAlerts: number;
  criticalIssues: number;
  recoveryAttempts: number;
  maxSystemStress: number;
  recommendedActions: string[];
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// FSM-specific types
export enum StressTestState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  SETTING_UP = 'SETTING_UP',
  MONITORING_STARTED = 'MONITORING_STARTED',
  PHASE_RUNNING = 'PHASE_RUNNING',
  PHASE_COMPLETED = 'PHASE_COMPLETED',
  RECOVERING = 'RECOVERING',
  TEARING_DOWN = 'TEARING_DOWN',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  STOPPED = 'STOPPED'
}

export enum StressTestEvent {
  START_TEST = 'START_TEST',
  SETUP_COMPLETE = 'SETUP_COMPLETE',
  MONITORING_READY = 'MONITORING_READY',
  START_PHASE = 'START_PHASE',
  PHASE_SUCCESS = 'PHASE_SUCCESS',
  PHASE_FAILURE = 'PHASE_FAILURE',
  RECOVERY_NEEDED = 'RECOVERY_NEEDED',
  RECOVERY_COMPLETE = 'RECOVERY_COMPLETE',
  RECOVERY_FAILED = 'RECOVERY_FAILED',
  STOP_TEST = 'STOP_TEST',
  TEARDOWN_COMPLETE = 'TEARDOWN_COMPLETE',
  CRITICAL_ERROR = 'CRITICAL_ERROR'
}

export interface StressTestContext {
  config: StressTestConfig;
  currentPhaseIndex: number;
  phaseResults: PhaseResult[];
  startTime: number;
  endTime?: number;
  failures: StressFailure[];
  recoveryAttempts: RecoveryAttempt[];
  alerts: Alert[];
  systemHealthHistory: SystemHealthSnapshot[];
}

export interface StateTransition {
  from: StressTestState;
  event: StressTestEvent;
  to: StressTestState;
  guard?: (context: StressTestContext) => boolean;
  action?: (context: StressTestContext) => Promise<void>;
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T16:31:27-04:00 | coder@Sonnet | Extract type definitions for FSM-based stress testing | StressTestTypes.ts | OK | Extracted all interfaces and added FSM enums | 0.00 | abc123f |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: stress_test_refactor_001
- inputs: ["StressTestRunner.ts"]
- tools_used: ["Write"]
- versions: {"model":"Sonnet 4","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->