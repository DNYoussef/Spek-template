/**
 * Migration Monitor Type Definitions
 * Provides comprehensive migration tracking and health monitoring types
 * NASA Rule 10 Compliant: All interfaces modular, FSM-based enums
 */

import type { Timestamp, Duration, ProgressPercentage } from '../../../types/brands';

/**
 * Migration lifecycle phases
 * FSM State: Defines sequential migration workflow states
 */
export enum MigrationPhase {
  PLANNING = 'PLANNING',
  PREPARATION = 'PREPARATION',
  EXECUTION = 'EXECUTION',
  VALIDATION = 'VALIDATION',
  COMPLETE = 'COMPLETE'
}

/**
 * Monitor event types
 * FSM Event: Defines monitoring lifecycle events
 */
export enum MonitorEvent {
  START = 'START',
  PROGRESS = 'PROGRESS',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
  ROLLBACK = 'ROLLBACK'
}

/**
 * System health status levels
 * FSM State: Defines health classification states
 */
export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY',
  CRITICAL = 'CRITICAL'
}

/**
 * Monitor severity levels
 * FSM State: Defines issue severity classification
 */
export enum MonitorSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * Migration metrics data structure
 */
export interface MigrationMetrics {
  readonly phase: MigrationPhase;
  readonly progress: ProgressPercentage;
  readonly duration: Duration;
  readonly errors: number;
  readonly warnings: number;
  readonly timestamp: Timestamp;
  readonly throughputPerSecond?: number;
  readonly networkLatencyMs?: number;
  readonly memoryUsageMB?: number;
  readonly errorCount?: number;
  readonly cpuUsagePercentage?: number;
  readonly progressPercentage?: number;
  readonly healthScore?: number;
  readonly systemLoad?: number;
  readonly successCount?: number;
  readonly startTime?: Timestamp;
  readonly migrationId?: string;
  readonly estimatedRemainingMs?: number;
  readonly activeConnections?: number;
  readonly warningCount?: number;
}

/**
 * Monitor configuration settings
 */
export interface MonitorConfig {
  readonly interval: Duration;
  readonly thresholds: HealthThresholds;
  readonly alerting: AlertConfig;
  readonly logging: LogConfig;
  readonly retryPolicy: RetryPolicy;
}

/**
 * Health threshold definitions
 */
export interface HealthThresholds {
  readonly errorRate: number;
  readonly warningRate: number;
  readonly responseTime: Duration;
  readonly memoryUsage: number;
}

/**
 * Alert configuration settings
 */
export interface AlertConfig {
  readonly enabled: boolean;
  readonly channels: ReadonlyArray<string>;
  readonly minSeverity: MonitorSeverity;
  readonly throttleInterval: Duration;
}

/**
 * Logging configuration settings
 */
export interface LogConfig {
  readonly level: string;
  readonly destination: string;
  readonly retention: Duration;
  readonly format: string;
}

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly backoffMultiplier: number;
  readonly initialDelay: Duration;
  readonly maxDelay: Duration;
}

/**
 * Monitor health report
 */
export interface MonitorHealthReport {
  readonly status: HealthStatus;
  readonly metrics: MigrationMetrics;
  readonly issues: ReadonlyArray<MonitorIssue>;
  readonly timestamp: Timestamp;
}

/**
 * Individual monitor issue
 */
export interface MonitorIssue {
  readonly severity: MonitorSeverity;
  readonly message: string;
  readonly source: string;
  readonly timestamp: Timestamp;
}

/**
 * Validates migration phase is within defined bounds
 * @param phase - Migration phase to validate
 * @returns True if valid
 */
export function isValidMigrationPhase(phase: MigrationPhase): boolean {
  const validPhases = Object.values(MigrationPhase);
  if (!validPhases.includes(phase)) {
    throw new Error(`Invalid migration phase: ${phase}`);
  }
  return validPhases.includes(phase);
}

/**
 * Validates health status is within defined bounds
 * @param status - Health status to validate
 * @returns True if valid
 */
export function isValidHealthStatus(status: HealthStatus): boolean {
  const validStatuses = Object.values(HealthStatus);
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid health status: ${status}`);
  }
  return validStatuses.includes(status);
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-30T14:40:00 | base-template-generator@sonnet-4 | Create migration monitor types | MigrationMonitorTypes.ts | OK | FSM-compliant with comprehensive monitoring | 0.00 | 3d0ce46 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase2a-agent2-monitor-types
 * - inputs: ["TS2305 errors for MigrationMonitor"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4","template":"NASA-Rule-10-FSM-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */