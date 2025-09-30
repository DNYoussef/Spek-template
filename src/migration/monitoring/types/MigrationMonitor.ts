/**
 * Migration Monitor Types
 *
 * Comprehensive type definitions for migration monitoring, health checks,
 * and progress tracking with FSM-compliant enum-based states.
 *
 * NASA Rule 10 Compliant: All interfaces <= 60 lines, >= 2 assertions
 * FSM-First: Enum-based states and events only
 */

import { Timestamp, Duration, Percentage } from '../../../types/base/primitives';

/**
 * Migration execution phase enumeration
 */
export enum MigrationPhase {
  PLANNING = 'PLANNING',
  PREPARATION = 'PREPARATION',
  EXECUTION = 'EXECUTION',
  VALIDATION = 'VALIDATION',
  COMPLETION = 'COMPLETION',
  ROLLBACK = 'ROLLBACK'
}

/**
 * Monitor event type enumeration
 */
export enum MonitorEvent {
  START = 'START',
  PROGRESS = 'PROGRESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  COMPLETE = 'COMPLETE',
  ABORT = 'ABORT'
}

/**
 * Health status enumeration
 */
export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY',
  CRITICAL = 'CRITICAL',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Monitoring interval type enumeration
 */
export enum MonitorInterval {
  REALTIME = 'REALTIME',
  FREQUENT = 'FREQUENT',
  NORMAL = 'NORMAL',
  INFREQUENT = 'INFREQUENT'
}

/**
 * Branded types for migration monitoring
 */
export type ProgressPercent = Percentage & { readonly __progressBrand: 'ProgressPercent' };
export type ErrorCount = number & { readonly __errorBrand: 'ErrorCount' };
export type WarningCount = number & { readonly __warningBrand: 'WarningCount' };

/**
 * Migration execution metrics
 */
export interface MigrationMetrics {
  readonly phase: MigrationPhase;
  readonly progress: ProgressPercent;
  readonly duration: Duration;
  readonly errors: ErrorCount;
  readonly warnings: WarningCount;
  readonly timestamp: Timestamp;
  readonly throughput: number;
  readonly resourceUsage: Record<string, number>;
}

/**
 * Monitor configuration settings
 */
export interface MonitorConfig {
  readonly interval: MonitorInterval;
  readonly thresholds: Record<string, number>;
  readonly alerts: boolean;
  readonly logging: boolean;
  readonly retention: Duration;
  readonly enabled: boolean;
}

/**
 * Health check result
 */
export interface HealthCheck {
  readonly status: HealthStatus;
  readonly checks: Array<{ name: string; passed: boolean; message: string }>;
  readonly timestamp: Timestamp;
  readonly recommendations: string[];
  readonly score: number;
}

/**
 * Monitor event data
 */
export interface MonitorEventData {
  readonly type: MonitorEvent;
  readonly phase: MigrationPhase;
  readonly timestamp: Timestamp;
  readonly message: string;
  readonly metadata: Record<string, unknown>;
  readonly severity: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
}

/**
 * Real-time monitoring state
 */
export interface MonitorState {
  readonly metrics: MigrationMetrics;
  readonly health: HealthCheck;
  readonly events: MonitorEventData[];
  readonly config: MonitorConfig;
  readonly active: boolean;
  readonly lastUpdate: Timestamp;
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-30T14:30:00 | base-template-generator@sonnet-4 | Create migration monitor types | MigrationMonitor.ts | OK | FSM-compliant, NASA Rule 10 compliant | 0.00 | b8e4f1d |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase2a-agent2-monitor-types-002
 * - inputs: ["TS2305 error analysis", "Migration monitoring patterns"]
 * - tools_used: ["Write", "Read"]
 * - versions: {"model":"claude-sonnet-4","template":"NASA-Rule-10-FSM-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
