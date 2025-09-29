/**
 * Phase Definition Types - Core phase structures and definitions
 * Extracted from PhaseTransitionTypes.ts for NASA Rule 10 compliance
 * Focus: Phase definitions, prerequisites, deliverables, quality gates
 */

export interface PhaseDefinition {
  phaseId: string;
  phaseName: string;
  phaseType: 'infrastructure' | 'research' | 'deployment' | 'security' | 'integration' | 'quality' | 'production';
  description: string;
  version: string;
  prerequisites: PhasePrerequisite[];
  deliverables: PhaseDeliverable[];
  exitCriteria: ExitCriteria[];
  qualityGates: PhaseQualityGate[];
  rollbackStrategy: PhaseRollbackStrategy;
  estimatedDuration: number;
  resources: PhaseResources;
  riskAssessment: PhaseRiskAssessment;
}

export interface PhasePrerequisite {
  prerequisiteId: string;
  name: string;
  description: string;
  type: 'phase_completion' | 'deliverable' | 'quality_gate' | 'external_dependency';
  criteria: PrerequisiteCriteria;
  blocking: boolean;
  validator: string;
  timeout: number;
}

export interface PrerequisiteCriteria {
  targetPhase?: string;
  targetDeliverable?: string;
  qualityThreshold?: number;
  completionPercentage?: number;
  customValidation?: string;
  dependencies?: string[];
}

export interface PhaseDeliverable {
  deliverableId: string;
  name: string;
  description: string;
  type: 'artifact' | 'documentation' | 'code' | 'configuration' | 'deployment' | 'report';
  location: string;
  format: string;
  qualityRequirements: DeliverableQuality[];
  acceptanceCriteria: AcceptanceCriteria[];
  dependencies: string[];
  estimatedSize: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface DeliverableQuality {
  qualityId: string;
  metric: string;
  threshold: number;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  measurementMethod: string;
  automatedCheck: boolean;
}

export interface AcceptanceCriteria {
  criteriaId: string;
  description: string;
  testMethod: string;
  expectedResult: string;
  actualResult?: string;
  status: 'pending' | 'testing' | 'passed' | 'failed';
  lastChecked?: number;
}

export interface ExitCriteria {
  criteriaId: string;
  name: string;
  description: string;
  type: 'quality' | 'completion' | 'performance' | 'security' | 'compliance' | 'approval';
  requirement: ExitRequirement;
  weight: number;
  mandatory: boolean;
  validator: string;
}

export interface ExitRequirement {
  metric: string;
  threshold: number;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  measurementUnit: string;
  calculationMethod: string;
  validationFrequency: number;
}

export interface PhaseQualityGate {
  gateId: string;
  gateName: string;
  gateType: 'entry' | 'milestone' | 'exit';
  position: number;
  criteria: QualityGateCriteria[];
  automation: GateAutomation;
  escalation: GateEscalation;
  bypassPolicy: BypassPolicy;
}

export interface QualityGateCriteria {
  criteriaId: string;
  name: string;
  description: string;
  metric: string;
  threshold: number;
  weight: number;
  category: 'functional' | 'performance' | 'security' | 'quality' | 'compliance';
  automated: boolean;
  validator: string;
}

export interface GateAutomation {
  enabled: boolean;
  triggers: string[];
  actions: AutomationAction[];
  rollbackOnFailure: boolean;
  notificationChannels: string[];
}

export interface AutomationAction {
  actionId: string;
  actionType: 'validation' | 'remediation' | 'notification' | 'rollback' | 'escalation';
  target: string;
  parameters: Map<string, any>;
  timeout: number;
  retryPolicy: ActionRetryPolicy;
}

export interface ActionRetryPolicy {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  retryableConditions: string[];
}

export interface GateEscalation {
  enabled: boolean;
  escalationTriggers: string[];
  escalationLevels: EscalationLevel[];
  timeoutEscalation: number;
}

export interface EscalationLevel {
  level: number;
  stakeholders: string[];
  actions: string[];
  timeout: number;
  autoApprove: boolean;
}

export interface BypassPolicy {
  allowBypass: boolean;
  bypassConditions: string[];
  requiredApprovals: string[];
  bypassDocumentation: boolean;
  auditRequired: boolean;
}

export interface PhaseRollbackStrategy {
  strategyType: 'none' | 'checkpoint' | 'full_rollback' | 'selective' | 'compensation';
  rollbackTriggers: string[];
  rollbackSteps: RollbackStep[];
  dataProtection: DataProtectionStrategy;
  rollbackTimeout: number;
  verificationRequired: boolean;
}

export interface RollbackStep {
  stepId: string;
  stepName: string;
  stepType: 'restore' | 'compensate' | 'cleanup' | 'notification';
  target: string;
  action: string;
  order: number;
  timeout: number;
  validation: string;
  dependencies: string[];
}

export interface DataProtectionStrategy {
  backupRequired: boolean;
  backupLocation: string;
  encryptionRequired: boolean;
  retentionPeriod: number;
  accessControl: string[];
  auditTrail: boolean;
}

export interface PhaseResources {
  personnel: PersonnelRequirement[];
  infrastructure: InfrastructureRequirement[];
  tools: ToolRequirement[];
  budget: BudgetRequirement;
  timeAllocation: TimeAllocation[];
}

export interface PersonnelRequirement {
  role: string;
  skillLevel: 'junior' | 'mid' | 'senior' | 'expert';
  allocation: number;
  duration: number;
  criticality: 'essential' | 'important' | 'optional';
}

export interface InfrastructureRequirement {
  resourceType: 'compute' | 'storage' | 'network' | 'database' | 'security';
  specification: string;
  quantity: number;
  duration: number;
  scalability: boolean;
}

export interface ToolRequirement {
  toolName: string;
  toolType: 'development' | 'testing' | 'deployment' | 'monitoring' | 'analysis';
  version: string;
  licenses: number;
  integration: string[];
}

export interface BudgetRequirement {
  totalBudget: number;
  breakdown: BudgetBreakdown[];
  contingency: number;
  approvalRequired: boolean;
}

export interface BudgetBreakdown {
  category: string;
  amount: number;
  justification: string;
}

export interface TimeAllocation {
  activity: string;
  estimatedHours: number;
  dependencies: string[];
  criticalPath: boolean;
}

export interface PhaseRiskAssessment {
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  mitigationStrategies: MitigationStrategy[];
  contingencyPlans: ContingencyPlan[];
  monitoringPlan: RiskMonitoringPlan;
}

export interface RiskFactor {
  riskId: string;
  description: string;
  category: 'technical' | 'resource' | 'schedule' | 'quality' | 'external';
  probability: number;
  impact: number;
  riskScore: number;
  triggers: string[];
  indicators: string[];
}

export interface MitigationStrategy {
  strategyId: string;
  targetRiskId: string;
  strategy: string;
  actions: MitigationAction[];
  effectiveness: number;
  cost: number;
  timeline: number;
}

export interface MitigationAction {
  actionId: string;
  description: string;
  actionType: 'preventive' | 'detective' | 'corrective';
  responsible: string;
  deadline: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
}

export interface ContingencyPlan {
  planId: string;
  triggerCondition: string;
  activationCriteria: string[];
  actions: ContingencyAction[];
  resources: ContingencyResources;
  successCriteria: string[];
}

export interface ContingencyAction {
  actionId: string;
  description: string;
  actionType: 'alternative_approach' | 'resource_reallocation' | 'scope_reduction' | 'timeline_extension';
  impact: string;
  approval: string[];
}

export interface ContingencyResources {
  additionalPersonnel: number;
  additionalBudget: number;
  additionalTime: number;
  alternativeTools: string[];
}

export interface RiskMonitoringPlan {
  monitoringFrequency: number;
  monitoringMetrics: string[];
  alertThresholds: Map<string, number>;
  reportingSchedule: string;
  stakeholders: string[];
}

// FSM State Enums
export enum PhaseState {
  PLANNED = 'PLANNED',
  STARTING = 'STARTING',
  IN_PROGRESS = 'IN_PROGRESS',
  VALIDATING = 'VALIDATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  ROLLED_BACK = 'ROLLED_BACK'
}

export enum PhaseEvent {
  START_PHASE = 'START_PHASE',
  PREREQUISITES_VALIDATED = 'PREREQUISITES_VALIDATED',
  PHASE_EXECUTION_STARTED = 'PHASE_EXECUTION_STARTED',
  PHASE_EXECUTION_COMPLETED = 'PHASE_EXECUTION_COMPLETED',
  VALIDATION_STARTED = 'VALIDATION_STARTED',
  VALIDATION_COMPLETED = 'VALIDATION_COMPLETED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  PHASE_FAILED = 'PHASE_FAILED',
  CANCEL_PHASE = 'CANCEL_PHASE',
  ROLLBACK_INITIATED = 'ROLLBACK_INITIATED'
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: phase-decomposition-001
// inputs: ["PhaseTransitionTypes.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"type-decomposition-v1"}
// === END FOOTER ===