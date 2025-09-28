/**
 * Quality Gate Definition Types - Core quality gate structures
 * Extracted from QualityGateTypes.ts for NASA Rule 10 compliance
 * Focus: Gate definitions, criteria, validation, and automation
 */

export interface QualityGateDefinition {
  gateId: string;
  gateName: string;
  gateType: 'pre_integration' | 'compilation' | 'testing' | 'security' | 'performance' | 'compliance' | 'deployment';
  description: string;
  category: 'functional' | 'non_functional' | 'operational' | 'regulatory';
  priority: 'critical' | 'high' | 'medium' | 'low';
  sequence: number;
  prerequisites: GatePrerequisite[];
  criteria: QualityCriteria[];
  validation: GateValidation;
  automation: GateAutomation;
  reporting: GateReporting;
  thresholds: GateThreshold;
  rollback: GateRollback;
}

export interface GatePrerequisite {
  prerequisiteId: string;
  name: string;
  description: string;
  type: 'gate_completion' | 'artifact_presence' | 'metric_threshold' | 'approval' | 'external_dependency';
  requirement: PrerequisiteRequirement;
  blocking: boolean;
  timeout: number;
  validator: string;
}

export interface PrerequisiteRequirement {
  targetGate?: string;
  targetArtifact?: string;
  metric?: string;
  threshold?: number;
  operator?: '>' | '<' | '>=' | '<=' | '==' | '!=';
  approver?: string;
  externalSystem?: string;
}

export interface QualityCriteria {
  criteriaId: string;
  name: string;
  description: string;
  type: 'metric' | 'assertion' | 'inspection' | 'approval' | 'test_result';
  metric: QualityMetric;
  weight: number;
  mandatory: boolean;
  automation: CriteriaAutomation;
  measurement: CriteriaMeasurement;
}

export interface QualityMetric {
  metricId: string;
  metricName: string;
  metricType: 'coverage' | 'performance' | 'quality' | 'security' | 'compliance' | 'reliability';
  unit: string;
  dataSource: string;
  calculationMethod: string;
  aggregationMethod: 'sum' | 'average' | 'max' | 'min' | 'count' | 'percentage';
  baseline: number;
  target: number;
  threshold: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface CriteriaAutomation {
  automated: boolean;
  automationTool: string;
  automationScript: string;
  automationTimeout: number;
  retryPolicy: AutomationRetryPolicy;
  fallbackToManual: boolean;
}

export interface AutomationRetryPolicy {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  retryableConditions: string[];
}

export interface CriteriaMeasurement {
  measurementMethod: 'tool' | 'manual' | 'calculated' | 'imported';
  measurementTool?: string;
  measurementFrequency: number;
  measurementWindow: number;
  dataRetention: number;
  qualityAssurance: MeasurementQA;
}

export interface MeasurementQA {
  calibration: boolean;
  validation: boolean;
  crossCheck: boolean;
  auditTrail: boolean;
  dataIntegrity: boolean;
}

export interface GateValidation {
  validationType: 'automatic' | 'manual' | 'hybrid';
  validators: ValidatorInfo[];
  validationFlow: ValidationFlow;
  failureHandling: FailureHandling;
  documentation: ValidationDocumentation;
}

export interface ValidatorInfo {
  validatorId: string;
  name: string;
  type: 'system' | 'human' | 'service';
  qualifications: string[];
  availability: ValidatorAvailability;
  escalation: ValidatorEscalation;
}

export interface ValidatorAvailability {
  timeZone: string;
  workingHours: string;
  capacity: number;
  backupValidators: string[];
}

export interface ValidatorEscalation {
  escalationTrigger: string;
  escalationPath: string[];
  escalationTimeout: number;
  autoEscalation: boolean;
}

export interface ValidationFlow {
  steps: ValidationStep[];
  parallelValidation: boolean;
  consensusRequired: boolean;
  minimumApprovals: number;
  timeoutHandling: string;
}

export interface ValidationStep {
  stepId: string;
  stepName: string;
  stepType: 'criteria_check' | 'approval' | 'inspection' | 'test_execution';
  validators: string[];
  timeout: number;
  required: boolean;
  dependencies: string[];
}

export interface FailureHandling {
  onFailure: 'stop' | 'continue' | 'escalate' | 'rollback';
  retryPolicy: FailureRetryPolicy;
  notification: FailureNotification;
  documentation: FailureDocumentation;
}

export interface FailureRetryPolicy {
  maxRetries: number;
  retryDelay: number;
  retryConditions: string[];
  escalateAfterRetries: boolean;
}

export interface FailureNotification {
  immediate: string[];
  escalation: string[];
  channels: string[];
  template: string;
}

export interface FailureDocumentation {
  required: boolean;
  template: string;
  approver: string;
  retention: string;
}

export interface ValidationDocumentation {
  evidenceRequired: boolean;
  evidenceTypes: string[];
  documentation: DocumentationRequirement[];
  auditTrail: boolean;
  retention: string;
}

export interface DocumentationRequirement {
  type: string;
  format: string;
  content: string[];
  approval: string;
  storage: string;
}

export interface GateAutomation {
  automationLevel: 'none' | 'partial' | 'full';
  triggers: AutomationTrigger[];
  actions: AutomationAction[];
  monitoring: AutomationMonitoring;
  maintenance: AutomationMaintenance;
}

export interface AutomationTrigger {
  triggerId: string;
  triggerType: 'schedule' | 'event' | 'threshold' | 'manual';
  condition: string;
  priority: number;
  enabled: boolean;
}

export interface AutomationAction {
  actionId: string;
  actionType: 'validation' | 'notification' | 'escalation' | 'rollback' | 'repair';
  target: string;
  parameters: ActionParameters;
  timeout: number;
  retryPolicy: ActionRetryPolicy;
}

export interface ActionParameters {
  [key: string]: any;
}

export interface ActionRetryPolicy {
  maxRetries: number;
  retryDelay: number;
  retryConditions: string[];
  exponentialBackoff: boolean;
}

export interface AutomationMonitoring {
  healthChecks: boolean;
  performanceMetrics: boolean;
  errorTracking: boolean;
  alerting: boolean;
  dashboards: boolean;
}

export interface AutomationMaintenance {
  selfHealing: boolean;
  updateMechanism: string;
  maintenanceWindows: string[];
  rollbackCapability: boolean;
}

export interface GateReporting {
  reports: ReportDefinition[];
  dashboards: DashboardDefinition[];
  notifications: NotificationDefinition[];
  archival: ArchivalPolicy;
}

export interface ReportDefinition {
  reportId: string;
  reportName: string;
  reportType: 'summary' | 'detailed' | 'trend' | 'exception';
  frequency: string;
  recipients: string[];
  template: string;
  automation: boolean;
}

export interface DashboardDefinition {
  dashboardId: string;
  dashboardName: string;
  widgets: DashboardWidget[];
  access: string[];
  refreshRate: number;
  customizable: boolean;
}

export interface DashboardWidget {
  widgetId: string;
  widgetType: 'metric' | 'chart' | 'table' | 'gauge' | 'alert';
  dataSource: string;
  configuration: WidgetConfiguration;
  position: WidgetPosition;
}

export interface WidgetConfiguration {
  [key: string]: any;
}

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NotificationDefinition {
  notificationId: string;
  trigger: string;
  recipients: string[];
  channels: string[];
  template: string;
  escalation: boolean;
}

export interface ArchivalPolicy {
  retention: string;
  compression: boolean;
  storage: string;
  access: string[];
  purgePolicy: string;
}

export interface GateThreshold {
  thresholds: ThresholdDefinition[];
  aggregation: ThresholdAggregation;
  weighting: ThresholdWeighting;
  calculation: ThresholdCalculation;
}

export interface ThresholdDefinition {
  thresholdId: string;
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  action: string;
}

export interface ThresholdAggregation {
  method: 'average' | 'sum' | 'max' | 'min' | 'weighted';
  window: number;
  overlap: number;
  smoothing: boolean;
}

export interface ThresholdWeighting {
  weighted: boolean;
  weights: Record<string, number>;
  normalization: boolean;
  adjustments: WeightAdjustment[];
}

export interface WeightAdjustment {
  condition: string;
  adjustment: number;
  reason: string;
}

export interface ThresholdCalculation {
  formula: string;
  variables: Record<string, string>;
  precision: number;
  rounding: 'up' | 'down' | 'nearest';
}

export interface GateRollback {
  rollbackEnabled: boolean;
  triggers: RollbackTrigger[];
  strategy: RollbackStrategy;
  validation: RollbackValidation;
  recovery: RollbackRecovery;
}

export interface RollbackTrigger {
  triggerId: string;
  condition: string;
  automatic: boolean;
  approval: string[];
  timeout: number;
}

export interface RollbackStrategy {
  strategyType: 'checkpoint' | 'incremental' | 'full' | 'selective';
  steps: RollbackStep[];
  verification: boolean;
  notification: boolean;
}

export interface RollbackStep {
  stepId: string;
  action: string;
  target: string;
  order: number;
  verification: string;
  dependencies: string[];
}

export interface RollbackValidation {
  preValidation: boolean;
  postValidation: boolean;
  criteria: string[];
  approval: string[];
}

export interface RollbackRecovery {
  dataRecovery: boolean;
  stateRecovery: boolean;
  configRecovery: boolean;
  verification: string[];
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T10:27:45-04:00 | decomposer@claude-sonnet-4 | Created QualityGateDefinitionTypes.ts - quality gate core interfaces | QualityGateDefinitionTypes.ts | OK | Extracted quality gate definition types, <500 lines | 0.00 | h4d9a0e |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: quality-decomposition-001
- inputs: ["QualityGateTypes.ts"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"type-decomposition-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->