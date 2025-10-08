/**
 * Decomposed Quality Gate Types
 * Focused types for quality gate functionality
 */

// Core quality gate types (decomposed from 576-line QualityGateTypes.ts)
export interface QualityGate {
  gateId: string;
  name: string;
  description: string;
  type: QualityGateType;
  criteria: QualityCriteria[];
  thresholds: QualityThreshold[];
  actions: QualityGateAction[];
  status: QualityGateStatus;
}

export type QualityGateType = 'entry' | 'in_process' | 'exit' | 'milestone';
export type QualityGateStatus = 'pending' | 'in_progress' | 'passed' | 'failed' | 'blocked';

export interface QualityCriteria {
  criteriaId: string;
  name: string;
  description: string;
  type: 'automated' | 'manual' | 'hybrid';
  measurement: QualityMeasurement;
  weight: number;
  mandatory: boolean;
}

export interface QualityMeasurement {
  metric: string;
  method: 'count' | 'percentage' | 'ratio' | 'score' | 'binary';
  dataSource: string;
  frequency: 'real_time' | 'on_demand' | 'scheduled';
  aggregation?: 'sum' | 'average' | 'max' | 'min';
}

export interface QualityThreshold {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'between';
  value: number | string;
  unit?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface QualityGateAction {
  actionId: string;
  trigger: QualityGateTrigger;
  type: QualityActionType;
  parameters: Record<string, any>;
  notification?: NotificationConfig;
}

export type QualityGateTrigger = 'threshold_exceeded' | 'criteria_failed' | 'gate_passed' | 'gate_failed';
export type QualityActionType = 'block' | 'warn' | 'notify' | 'escalate' | 'auto_fix' | 'rollback';

export interface NotificationConfig {
  recipients: string[];
  channels: NotificationChannel[];
  template: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'teams' | 'webhook' | 'sms';
  configuration: Record<string, any>;
  fallback?: string;
}

// Quality gate execution and reporting
export interface QualityGateExecution {
  executionId: string;
  gateId: string;
  startTime: Date;
  endTime?: Date;
  status: QualityGateStatus;
  results: QualityGateResult[];
  summary: ExecutionSummary;
}

export interface QualityGateResult {
  criteriaId: string;
  status: 'passed' | 'failed' | 'skipped';
  actualValue: any;
  expectedValue: any;
  score: number;
  evidence: Evidence[];
  recommendations?: string[];
}

export interface Evidence {
  type: 'measurement' | 'artifact' | 'documentation' | 'approval';
  source: string;
  content: any;
  timestamp: Date;
  confidence: number;
}

export interface ExecutionSummary {
  totalCriteria: number;
  passedCriteria: number;
  failedCriteria: number;
  skippedCriteria: number;
  overallScore: number;
  passRate: number;
  qualityLevel: 'excellent' | 'good' | 'acceptable' | 'poor';
}