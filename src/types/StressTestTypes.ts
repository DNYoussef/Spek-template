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
  readonly scenarioId: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly duration: number;
  readonly metrics: StressTestMetrics;
  readonly errors: readonly StressTestError[];
}

// Stress test metrics
export interface StressTestMetrics {
  readonly totalOperations: number;
  readonly successfulOperations: number;
  readonly failedOperations: number;
  readonly operationsPerSecond: number;
  readonly avgResponseTime: number;
  readonly p50ResponseTime: number;
  readonly p95ResponseTime: number;
  readonly p99ResponseTime: number;
  readonly minResponseTime: number;
  readonly maxResponseTime: number;
  readonly throughput: number; // bytes per second
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
  RAMPING_UP = 'RAMPING_UP',
  RUNNING = 'RUNNING',
  COOLING_DOWN = 'COOLING_DOWN',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum StressTestEvent {
  START = 'START',
  RAMP_COMPLETE = 'RAMP_COMPLETE',
  PHASE_COMPLETE = 'PHASE_COMPLETE',
  THRESHOLD_VIOLATED = 'THRESHOLD_VIOLATED',
  RECOVERY_NEEDED = 'RECOVERY_NEEDED',
  TEST_COMPLETE = 'TEST_COMPLETE',
  ERROR = 'ERROR'
}

export interface StressTestContext {
  readonly scenarioId: string;
  readonly currentState: StressTestState;
  readonly config: StressTestConfig;
  readonly metrics: StressTestMetrics;
  readonly startTime: number;
  readonly elapsedTime: number;
  readonly recoveryAttempts?: readonly RecoveryAttempt[];
  readonly currentPhaseIndex?: number;
  readonly systemHealthHistory?: readonly SystemHealthSnapshot[];
  readonly alerts?: readonly Alert[];
  readonly failures?: readonly StressFailure[];
  readonly endTime?: number;
}

export interface StateTransition {
  readonly from: StressTestState;
  readonly to: StressTestState;
  readonly event: StressTestEvent;
  readonly timestamp: number;
}

export interface StressPhase {
  readonly name: string;
  readonly duration: number;
  readonly concurrency: number;
  readonly targetRPS: number;
  readonly completed: boolean;
}

export interface PhaseResult {
  readonly phase: StressPhase;
  readonly metrics: StressTestMetrics;
  readonly violations: readonly ThresholdViolation[];
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
  readonly responseTimeP95: number;
  readonly responseTimeP99: number;
  readonly errorRate: number;
  readonly failureRate: number;
}

export interface MonitoringConfig {
  readonly enabled: boolean;
  readonly interval: number;
  readonly thresholds: AlertThresholds;
  readonly alerts: readonly string[];
}

export interface SystemHealthSnapshot {
  readonly timestamp: number;
  readonly cpu: number;
  readonly memory: number;
  readonly disk: number;
  readonly network: number;
}

export interface FailureThresholds {
  readonly maxErrorRate: number;
  readonly maxResponseTime: number;
  readonly minSuccessRate: number;
  readonly maxConsecutiveFailures: number;
}

export interface StressFailure {
  readonly type: 'timeout' | 'error' | 'threshold' | 'resource';
  readonly message: string;
  readonly timestamp: number;
  readonly context: Record<string, unknown>;
}

export interface RecoveryConfig {
  readonly enabled: boolean;
  readonly maxAttempts: number;
  readonly cooldownPeriod: number;
  readonly strategy: 'immediate' | 'gradual' | 'abort';
}

export interface RecoveryAttempt {
  readonly attemptNumber: number;
  readonly timestamp: number;
  readonly success: boolean;
  readonly duration: number;
  readonly message: string;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0
// === END FOOTER ===
