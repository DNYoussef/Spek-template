/**
 * Degradation Monitoring Types
 * Centralized type definitions for degradation monitoring system
 */

import { ContextFingerprint } from '../../ContextDNA';

// FSM State Enums
export enum MonitoringState {
  IDLE = 'IDLE',
  MONITORING = 'MONITORING',
  ALERT_GENERATED = 'ALERT_GENERATED',
  RECOVERY_PENDING = 'RECOVERY_PENDING',
  RECOVERY_EXECUTING = 'RECOVERY_EXECUTING',
  VALIDATION = 'VALIDATION',
  ERROR = 'ERROR'
}

export enum MonitoringEvent {
  START_MONITORING = 'START_MONITORING',
  STOP_MONITORING = 'STOP_MONITORING',
  DRIFT_DETECTED = 'DRIFT_DETECTED',
  ALERT_TRIGGERED = 'ALERT_TRIGGERED',
  RECOVERY_INITIATED = 'RECOVERY_INITIATED',
  RECOVERY_COMPLETED = 'RECOVERY_COMPLETED',
  VALIDATION_PASSED = 'VALIDATION_PASSED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RESET = 'RESET'
}

export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export enum RecoveryType {
  ROLLBACK = 'rollback',
  RECONSTRUCT = 'reconstruct',
  ESCALATE = 'escalate',
  QUARANTINE = 'quarantine'
}

// Core Interfaces
export interface DriftMetrics {
  readonly currentDrift: number;
  readonly driftRate: number;
  readonly projectedDrift: number;
  readonly timeToThreshold: number;
}

export interface DegradationAlert {
  readonly level: AlertLevel;
  readonly message: string;
  readonly affectedAgents: readonly string[];
  readonly metrics: DriftMetrics;
  readonly recommendedAction: string;
  readonly timestamp: number;
}

export interface RecoveryAction {
  readonly type: RecoveryType;
  readonly targetAgent: string;
  readonly checkpointId?: string;
  readonly reason: string;
  readonly confidence: number;
}

export interface MonitoringConfig {
  readonly criticalDrift: number;
  readonly warningDrift: number;
  readonly monitoringInterval: number;
  readonly maxHistoryLength: number;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly checksum: string;
  readonly confidence?: number;
}

export interface RecoveryResult {
  readonly success: boolean;
  readonly result?: any;
  readonly error?: string;
  readonly metrics?: {
    readonly executionTime: number;
    readonly recoveryScore: number;
    readonly validationPassed: boolean;
  };
}

// FSM State Machine Interfaces
export interface FSMState {
  readonly name: MonitoringState;
  enter(context: MonitoringContext): Promise<void>;
  update(context: MonitoringContext): Promise<MonitoringEvent | null>;
  exit(context: MonitoringContext): Promise<void>;
  canTransition(event: MonitoringEvent): boolean;
}

export interface MonitoringContext {
  readonly config: MonitoringConfig;
  driftHistory: Map<string, DriftMetrics[]>;
  alerts: DegradationAlert[];
  recoveryActions: RecoveryAction[];
  currentTransfer?: {
    context: any;
    fingerprint: ContextFingerprint;
    previousFingerprints: ContextFingerprint[];
  };
  error?: Error;
}

export interface StateTransition {
  readonly from: MonitoringState;
  readonly event: MonitoringEvent;
  readonly to: MonitoringState;
  readonly guard?: (context: MonitoringContext) => boolean;
}

// Component Interfaces
export interface IDriftCalculator {
  calculateDrift(
    current: ContextFingerprint,
    previous: ContextFingerprint[]
  ): DriftMetrics;
}

export interface IAlertManager {
  generateAlert(
    metrics: DriftMetrics,
    fingerprint: ContextFingerprint,
    config: MonitoringConfig
  ): DegradationAlert | null;
  
  getRecentAlerts(limit?: number): DegradationAlert[];
  clearAlerts(): void;
}

export interface IRecoveryExecutor {
  executeRecovery(action: RecoveryAction): Promise<RecoveryResult>;
  determineRecoveryAction(
    metrics: DriftMetrics,
    fingerprint: ContextFingerprint,
    context: any,
    config: MonitoringConfig
  ): Promise<RecoveryAction | null>;
}

export interface IValidationEngine {
  validateRollback(context: any, checksum: string): Promise<ValidationResult>;
  validateReconstruction(context: any, agent: string): Promise<ValidationResult>;
  checkCheckpointAvailability(agent: string): Promise<string | null>;
}

// Trend Analysis
export type TrendType = 'stable' | 'improving' | 'degrading' | 'accelerating';

export interface TrendAnalysis {
  readonly trend: TrendType;
  readonly confidence: number;
  readonly dataPoints: number;
}

// Constants
export const DEFAULT_CONFIG: MonitoringConfig = {
  criticalDrift: 0.15,
  warningDrift: 0.10,
  monitoringInterval: 10000,
  maxHistoryLength: 100
};

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T15:47:23-04:00 | codex@sonnet-4 | Create degradation monitoring types | DegradationTypes.ts | OK | FSM types, interfaces, enums | 0.01 | 3bf7c42 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: deg-types-001
- inputs: ["DegradationMonitor.ts analysis"]
- tools_used: ["MultiEdit"]
- versions: {"model":"sonnet-4","prompt":"nasa-rule-10"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->