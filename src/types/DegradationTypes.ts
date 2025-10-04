/**
 * Degradation Types for System Degradation Detection and Recovery
 * Types for monitoring, detecting, and recovering from degraded states
 */

import { Timestamp, Score } from './base/primitives';
import { MetricsCollector } from './base/shared';

// Degradation Detection
export interface DegradationIndicator {
  readonly metric: string;
  readonly threshold: number;
  readonly currentValue: number;
  readonly severity: DegradationSeverity;
  readonly timestamp: Timestamp;
}

export enum DegradationSeverity {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING',
  DEGRADED = 'DEGRADED',
  CRITICAL = 'CRITICAL',
  FAILING = 'FAILING'
}

export interface DegradationEvent {
  readonly id: string;
  readonly type: string;
  readonly severity: DegradationSeverity;
  readonly indicators: DegradationIndicator[];
  readonly timestamp: Timestamp;
  readonly context: Record<string, unknown>;
}

// Degradation Monitoring
export interface DegradationMonitor {
  readonly metrics: MetricsCollector;
  readonly thresholds: DegradationThreshold[];
  checkHealth(): Promise<DegradationStatus>;
  detectDegradation(): Promise<DegradationEvent[]>;
}

export interface DegradationThreshold {
  readonly metric: string;
  readonly warning: number;
  readonly degraded: number;
  readonly critical: number;
}

export interface DegradationStatus {
  readonly severity: DegradationSeverity;
  readonly indicators: DegradationIndicator[];
  readonly score: Score;
  readonly recommendations: string[];
}

// Degradation Recovery
export interface RecoveryStrategy {
  readonly name: string;
  readonly applicableSeverities: DegradationSeverity[];
  readonly actions: RecoveryAction[];
  readonly estimatedRecoveryTime: number;
}

export interface RecoveryAction {
  readonly name: string;
  readonly priority: number;
  readonly execute: () => Promise<RecoveryResult>;
}

export interface RecoveryResult {
  readonly success: boolean;
  readonly severity: DegradationSeverity;
  readonly message: string;
  readonly timestamp: Timestamp;
}

// Additional exports for component compatibility
export enum AlertLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export interface DriftMetrics {
  readonly contextDrift: number;
  readonly qualityDrift: number;
  readonly performanceDrift: number;
  readonly timestamp: Timestamp;
}

export interface MonitoringConfig {
  readonly enabled: boolean;
  readonly interval: number;
  readonly thresholds: DegradationThreshold[];
  readonly alerts: readonly AlertLevel[];
}

export interface MonitoringContext {
  readonly sessionId: string;
  readonly startTime: Timestamp;
  readonly currentMetrics: DriftMetrics;
  readonly history: readonly DegradationEvent[];
}

export interface MonitoringEvent {
  readonly type: 'DRIFT_DETECTED' | 'RECOVERY_STARTED' | 'RECOVERY_COMPLETED';
  readonly severity: DegradationSeverity;
  readonly data: Record<string, unknown>;
  readonly timestamp: Timestamp;
}

export enum MonitoringState {
  IDLE = 'IDLE',
  MONITORING = 'MONITORING',
  ALERTING = 'ALERTING',
  RECOVERING = 'RECOVERING'
}

export enum FSMState {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  DEGRADED = 'DEGRADED',
  RECOVERING = 'RECOVERING',
  FAILED = 'FAILED'
}

export interface StateTransition {
  readonly from: FSMState;
  readonly to: FSMState;
  readonly event: string;
  readonly timestamp: Timestamp;
}

export interface TrendAnalysis {
  readonly metric: string;
  readonly trend: TrendType;
  readonly rate: number;
  readonly confidence: number;
}

export enum TrendType {
  IMPROVING = 'IMPROVING',
  STABLE = 'STABLE',
  DEGRADING = 'DEGRADING',
  CRITICAL_DEGRADATION = 'CRITICAL_DEGRADATION'
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly score: Score;
}

export enum RecoveryType {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
  HYBRID = 'HYBRID'
}

// Interface contracts for components
export interface IAlertManager {
  createAlert(level: AlertLevel, message: string): Promise<void>;
  getActiveAlerts(): Promise<readonly DegradationEvent[]>;
  clearAlerts(): Promise<void>;
}

export interface IDriftCalculator {
  calculateDrift(current: DriftMetrics, baseline: DriftMetrics): Promise<number>;
  analyzeTrend(history: readonly DriftMetrics[]): Promise<TrendAnalysis>;
}

export interface IRecoveryExecutor {
  executeRecovery(strategy: RecoveryStrategy): Promise<RecoveryResult>;
  validateRecovery(result: RecoveryResult): Promise<ValidationResult>;
}

export interface IValidationEngine {
  validate(data: unknown): Promise<ValidationResult>;
  getValidationRules(): readonly string[];
}

// Default configuration
export const DEFAULT_CONFIG: MonitoringConfig = {
  enabled: true,
  interval: 5000,
  thresholds: [],
  alerts: [AlertLevel.WARNING, AlertLevel.ERROR, AlertLevel.CRITICAL]
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-10-03T16:45:00-04:00 | coder@sonnet-4.5 | Create DegradationTypes to resolve ~types/DegradationTypes imports | DegradationTypes.ts | OK | Phase 1 critical blocker fixes - Week 2 | 0.00 | d7c2b4a |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: week2-phase1-degradation-types
 * - inputs: ["critical-blocker-fix-plan.md", "primitives.ts", "shared.ts"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4-5-20250929","prompt":"week2-critical-blockers"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
