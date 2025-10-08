/**
 * Phase Transition Monitor Type Definitions
 * Provides comprehensive phase transition tracking types
 * NASA Rule 10 Compliant: All interfaces modular, FSM-based enums
 */

import type { Timestamp, Duration, PhaseId } from '../../../../types/brands';

/**
 * Phase transition status states
 * FSM State: Defines transition lifecycle states
 */
export enum TransitionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK'
}

/**
 * Phase execution states
 * FSM State: Defines phase runtime states
 */
export enum PhaseState {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

/**
 * Transition event types
 * FSM Event: Defines phase transition events
 */
export enum TransitionEvent {
  START = 'START',
  PROGRESS = 'PROGRESS',
  COMPLETE = 'COMPLETE',
  FAIL = 'FAIL',
  ROLLBACK = 'ROLLBACK',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME'
}

/**
 * Monitor alert levels
 * FSM State: Defines monitoring alert severity
 */
export enum AlertLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * Phase execution metrics
 */
export interface PhaseMetrics {
  readonly duration: Duration;
  readonly successRate: number;
  readonly errorCount: number;
  readonly warnings: number;
  readonly resourceUsage: ResourceMetrics;
}

/**
 * Resource utilization metrics
 */
export interface ResourceMetrics {
  readonly cpuUsage: number;
  readonly memoryUsage: number;
  readonly diskIO: number;
  readonly networkIO: number;
}

/**
 * Monitor data snapshot
 */
export interface MonitorData {
  readonly currentPhase: PhaseId;
  readonly status: TransitionStatus;
  readonly state: PhaseState;
  readonly metrics: PhaseMetrics;
  readonly timestamp: Timestamp;
  readonly alerts: ReadonlyArray<MonitorAlert>;
}

/**
 * Monitor alert definition
 */
export interface MonitorAlert {
  readonly level: AlertLevel;
  readonly message: string;
  readonly source: string;
  readonly timestamp: Timestamp;
  readonly resolved: boolean;
}

/**
 * Phase transition record
 */
export interface TransitionRecord {
  readonly fromPhase: PhaseId;
  readonly toPhase: PhaseId;
  readonly status: TransitionStatus;
  readonly startTime: Timestamp;
  readonly endTime: Timestamp;
  readonly duration: Duration;
  readonly errors: ReadonlyArray<string>;
}

/**
 * Monitor configuration
 */
export interface MonitorConfiguration {
  readonly pollInterval: Duration;
  readonly alertThresholds: AlertThresholds;
  readonly enabledMetrics: ReadonlyArray<string>;
  readonly retentionPeriod: Duration;
}

/**
 * Alert threshold definitions
 */
export interface AlertThresholds {
  readonly errorRate: number;
  readonly responseTime: Duration;
  readonly resourceUsage: number;
  readonly failureCount: number;
}

/**
 * Phase checkpoint data
 */
export interface PhaseCheckpoint {
  readonly phaseId: PhaseId;
  readonly state: PhaseState;
  readonly timestamp: Timestamp;
  readonly metrics: PhaseMetrics;
  readonly canRollback: boolean;
}

/**
 * Transition validation result
 */
export interface TransitionValidation {
  readonly valid: boolean;
  readonly errors: ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
  readonly recommendations: ReadonlyArray<string>;
}

/**
 * Validates transition status is within defined bounds
 * @param status - Transition status to validate
 * @returns True if valid
 */
export function isValidTransitionStatus(status: TransitionStatus): boolean {
  const validStatuses = Object.values(TransitionStatus);
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid transition status: ${status}`);
  }
  return validStatuses.includes(status);
}

/**
 * Validates phase state is within defined bounds
 * @param state - Phase state to validate
 * @returns True if valid
 */
export function isValidPhaseState(state: PhaseState): boolean {
  const validStates = Object.values(PhaseState);
  if (!validStates.includes(state)) {
    throw new Error(`Invalid phase state: ${state}`);
  }
  return validStates.includes(state);
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-30T14:44:00 | base-template-generator@sonnet-4 | Create transition monitor types | PhaseTransitionMonitorTypes.ts | OK | FSM-compliant with comprehensive monitoring | 0.00 | b22887f |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase2a-agent2-transition-monitor-types
 * - inputs: ["TS2305 errors for PhaseTransitionMonitor"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4","template":"NASA-Rule-10-FSM-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */