/**
 * StressTestTypes.ts - Stress Testing Type Definitions
 * @stub true
 * @architecture Performance testing type system
 */

// Stress test configuration
export interface StressTestConfig {
  readonly duration: number; // milliseconds
  readonly concurrency: number; // parallel operations
  readonly rampUp: number; // time to reach full concurrency
  readonly targetRPS: number; // requests per second
  readonly phases?: readonly StressPhase[]; // multi-phase stress test support
  readonly monitoring?: MonitoringConfig; // monitoring configuration
  readonly recovery?: RecoveryConfig; // recovery configuration
  readonly failureThresholds?: FailureThresholds; // failure thresholds
}

// Stress test scenario
export interface StressTestScenario {
  readonly id: string;
  readonly name: string;
  readonly config: StressTestConfig;
  readonly operations: readonly StressTestOperation[];
}

// Stress test operation
export interface StressTestOperation {
  readonly id: string;
  readonly type: 'read' | 'write' | 'update' | 'delete' | 'custom';
  readonly weight: number; // 0-1, probability of execution
  readonly payload?: unknown;
}

// Stress test result
export interface StressTestResult {
  readonly testName?: string;
  readonly scenarioId?: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly duration?: number;
  readonly totalDuration?: number;
  readonly phases?: readonly PhaseResult[];
  readonly overallMetrics?: OverallMetrics;
  readonly systemHealth?: readonly SystemHealthSnapshot[];
  readonly failures?: readonly StressFailure[];
  readonly recovery?: readonly RecoveryAttempt[];
  readonly success?: boolean;
  readonly summary?: TestSummary;
  readonly metrics?: StressTestMetrics;
  readonly errors?: readonly StressTestError[];
}

// Stress test metrics
export interface StressTestMetrics {
  readonly totalOperations?: number;
  readonly successfulOperations?: number;
  readonly failedOperations?: number;
  readonly operationsPerSecond?: number;
  readonly avgResponseTime?: number;
  readonly p50ResponseTime?: number;
  readonly p95ResponseTime?: number;
  readonly p99ResponseTime?: number;
  readonly minResponseTime?: number;
  readonly maxResponseTime?: number;
  readonly throughput?: number; // bytes per second
  readonly totalRequests?: number;
  readonly totalSuccesses?: number;
  readonly totalFailures?: number;
  readonly overallSuccessRate?: number;
  readonly averageResponseTime?: number;
  readonly peakResponseTime?: number;
  readonly peakConcurrency?: number;
  readonly peakMemoryMB?: number;
  readonly peakCPUPercent?: number;
  readonly throughputPeakRPS?: number;
  readonly systemStability?: number;
}

export interface OverallMetrics {
  readonly totalRequests: number;
  readonly totalSuccesses: number;
  readonly totalFailures: number;
  readonly overallSuccessRate: number;
  readonly averageResponseTime: number;
  readonly peakResponseTime: number;
  readonly peakConcurrency: number;
  readonly peakMemoryMB: number;
  readonly peakCPUPercent: number;
  readonly throughputPeakRPS: number;
  readonly systemStability: number;
}

export interface TestSummary {
  readonly passedPhases: number;
  readonly failedPhases: number;
  readonly totalAlerts: number;
  readonly criticalIssues: number;
  readonly recoveryAttempts: number;
  readonly maxSystemStress: number;
  readonly recommendedActions: string[];
  readonly performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// Stress test error
export interface StressTestError {
  readonly timestamp: number;
  readonly operationId: string;
  readonly error: string;
  readonly stack?: string;
}

// Additional exports for FSM and monitoring compatibility
export enum StressTestState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  SETTING_UP = 'SETTING_UP',
  MONITORING_STARTED = 'MONITORING_STARTED',
  RAMPING_UP = 'RAMPING_UP',
  RUNNING = 'RUNNING',
  PHASE_RUNNING = 'PHASE_RUNNING',
  PHASE_COMPLETED = 'PHASE_COMPLETED',
  RECOVERING = 'RECOVERING',
  TEARING_DOWN = 'TEARING_DOWN',
  COOLING_DOWN = 'COOLING_DOWN',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  STOPPED = 'STOPPED'
}

export enum StressTestEvent {
  START = 'START',
  START_TEST = 'START_TEST',
  SETUP_COMPLETE = 'SETUP_COMPLETE',
  MONITORING_READY = 'MONITORING_READY',
  START_PHASE = 'START_PHASE',
  RAMP_COMPLETE = 'RAMP_COMPLETE',
  PHASE_COMPLETE = 'PHASE_COMPLETE',
  PHASE_SUCCESS = 'PHASE_SUCCESS',
  PHASE_FAILURE = 'PHASE_FAILURE',
  THRESHOLD_VIOLATED = 'THRESHOLD_VIOLATED',
  RECOVERY_NEEDED = 'RECOVERY_NEEDED',
  RECOVERY_COMPLETE = 'RECOVERY_COMPLETE',
  RECOVERY_FAILED = 'RECOVERY_FAILED',
  STOP_TEST = 'STOP_TEST',
  TEARDOWN_COMPLETE = 'TEARDOWN_COMPLETE',
  TEST_COMPLETE = 'TEST_COMPLETE',
  CRITICAL_ERROR = 'CRITICAL_ERROR',
  ERROR = 'ERROR'
}

export interface StressTestContext {
  readonly scenarioId?: string;
  readonly currentState?: StressTestState;
  readonly config: StressTestConfig;
  readonly metrics?: StressTestMetrics;
  readonly startTime: number;
  readonly elapsedTime?: number;
  readonly recoveryAttempts?: RecoveryAttempt[]; // Not readonly array - needs push
  readonly currentPhaseIndex: number;
  readonly systemHealthHistory?: SystemHealthSnapshot[]; // Not readonly array - needs push
  readonly alerts?: Alert[]; // Not readonly array - needs push
  readonly failures?: StressFailure[]; // Not readonly array - needs push
  readonly endTime?: number;
  readonly phaseResults?: readonly PhaseResult[];
}

export interface StateTransition {
  readonly from: StressTestState;
  readonly to: StressTestState;
  readonly event: StressTestEvent;
  readonly timestamp?: number;
  readonly guard?: (context: StressTestContext) => boolean; // transition guard condition
  readonly action?: (context: StressTestContext) => Promise<void>; // transition action
}

export interface StressPhase {
  readonly name: string;
  readonly duration: number;
  readonly concurrency: number;
  readonly targetRPS?: number;
  readonly requestsPerSecond?: number;
  readonly completed?: boolean;
  readonly rampUpTime?: number;
  readonly rampDownTime?: number;
  readonly distributionPattern?: 'constant' | 'ramp' | 'spike' | 'burst' | 'wave';
  readonly expectedBehavior?: {
    readonly maxResponseTime?: number;
    readonly minSuccessRate?: number;
    readonly maxMemoryMB?: number;
    readonly maxCPUPercent?: number;
  };
}

export interface PhaseResult {
  readonly phaseName?: string;
  readonly phase?: StressPhase;
  readonly loadResult?: any;
  readonly systemMetrics?: any[];
  readonly memoryProfile?: any;
  readonly cpuProfile?: any;
  readonly alerts?: readonly Alert[];
  readonly thresholdViolations?: readonly ThresholdViolation[];
  readonly violations?: readonly ThresholdViolation[];
  readonly metrics?: StressTestMetrics;
  readonly success?: boolean;
}

export interface ThresholdViolation {
  readonly metric: string;
  readonly threshold: number;
  readonly actual: number;
  readonly timestamp: number;
  readonly severity: 'warning' | 'critical';
}

export interface Alert {
  readonly level: 'info' | 'warning' | 'error' | 'critical';
  readonly message: string;
  readonly timestamp: number;
  readonly context: Record<string, unknown>;
}

export interface AlertThresholds {
  readonly responseTimeP95?: number;
  readonly responseTimeP99?: number;
  readonly errorRate?: number;
  readonly failureRate?: number;
  readonly responseTimeWarning?: number;
  readonly memoryWarningMB?: number;
  readonly cpuWarningPercent?: number;
  readonly errorRateWarning?: number;
}

export interface MonitoringConfig {
  readonly enabled?: boolean;
  readonly interval?: number;
  readonly thresholds?: AlertThresholds;
  readonly alerts?: readonly string[];
  readonly collectSystemMetrics?: boolean;
  readonly collectMemoryProfile?: boolean;
  readonly collectCPUProfile?: boolean;
  readonly metricsInterval?: number;
  readonly alertThresholds?: AlertThresholds;
}

export interface SystemHealthSnapshot {
  readonly timestamp: number;
  readonly cpu: {
    readonly usage: number;
    readonly loadAverage: number[];
    readonly temperature?: number;
  };
  readonly memory: {
    readonly total: number;
    readonly free: number;
    readonly used: number;
    readonly cached: number;
    readonly swap: number;
  };
  readonly disk?: {
    readonly usage: number;
    readonly readIOPS: number;
    readonly writeIOPS: number;
  };
  readonly network?: {
    readonly connectionsActive: number;
    readonly throughputMbps: number;
    readonly packetLoss: number;
  };
  readonly process?: {
    readonly handles: number;
    readonly threads: number;
    readonly uptime: number;
  };
}

export interface FailureThresholds {
  readonly maxErrorRate?: number;
  readonly maxResponseTime?: number;
  readonly minSuccessRate?: number;
  readonly maxConsecutiveFailures?: number;
  readonly maxMemoryMB?: number;
  readonly maxCPUPercent?: number;
  readonly systemFailure?: {
    readonly maxLoadAverage?: number;
    readonly minFreeMemoryMB?: number;
    readonly maxDiskUsagePercent?: number;
  };
}

export interface StressFailure {
  readonly type: 'timeout' | 'error' | 'threshold' | 'resource';
  readonly message: string;
  readonly timestamp: number;
  readonly context: Record<string, unknown>;
  readonly phase?: string; // phase where failure occurred
  readonly severity?: 'warning' | 'error' | 'critical'; // failure severity
  readonly recoverable?: boolean; // whether failure is recoverable
}

export interface RecoveryConfig {
  readonly enabled?: boolean;
  readonly maxAttempts?: number;
  readonly maxRecoveryAttempts?: number;
  readonly cooldownPeriod?: number;
  readonly recoveryDelay?: number;
  readonly strategy?: 'immediate' | 'gradual' | 'abort';
  readonly enableAutoRecovery?: boolean;
  readonly gracefulShutdown?: boolean;
  readonly cleanupTimeout?: number;
}

export interface RecoveryAttempt {
  readonly attemptNumber?: number;
  readonly timestamp: number;
  readonly success: boolean;
  readonly duration?: number;
  readonly message?: string;
  readonly reason?: string;
  readonly action?: string;
  readonly resultingState?: any;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0
// === END FOOTER ===
