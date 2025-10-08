/**
 * Phase Definition Core Types
 * Core types for phase definitions, prerequisites, and basic structures
 */

// Core Phase Structure
export interface PhaseDefinition {
  phaseId: string;
  phaseName: string;
  phaseType: PhaseType;
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

export type PhaseType = 'infrastructure' | 'research' | 'deployment' | 'security' | 'integration' | 'quality' | 'production';

export interface PhasePrerequisite {
  prerequisiteId: string;
  name: string;
  description: string;
  type: PrerequisiteType;
  criteria: PrerequisiteCriteria;
  blocking: boolean;
  validator: string;
  timeout: number;
}

export type PrerequisiteType = 'phase_completion' | 'deliverable' | 'quality_gate' | 'external_dependency';

export interface PrerequisiteCriteria {
  targetPhase?: string;
  targetDeliverable?: string;
  qualityThreshold?: number;
  completionPercentage?: number;
  customValidation?: string;
  dependencies?: string[];
}

// Phase Deliverables
export interface PhaseDeliverable {
  deliverableId: string;
  name: string;
  description: string;
  type: DeliverableType;
  location: string;
  format: string;
  qualityRequirements: DeliverableQuality[];
  acceptanceCriteria: AcceptanceCriteria[];
  dependencies: DeliverableDependency[];
  estimatedSize: number;
  actualSize?: number;
}

export type DeliverableType = 'artifact' | 'documentation' | 'code' | 'configuration' | 'deployment' | 'report';

export interface DeliverableQuality {
  metric: string;
  threshold: number;
  measurement: string;
  weight: number;
}

export interface AcceptanceCriteria {
  criteriaId: string;
  description: string;
  type: 'functional' | 'technical' | 'business' | 'quality';
  testMethod: string;
  successCondition: string;
  priority: 'must_have' | 'should_have' | 'could_have' | 'wont_have';
}

export interface DeliverableDependency {
  dependencyId: string;
  dependsOnDeliverable: string;
  dependencyType: 'input' | 'reference' | 'integration' | 'approval';
  mandatory: boolean;
  timing: 'before' | 'concurrent' | 'after';
}

// Exit Criteria
export interface ExitCriteria {
  criteriaId: string;
  name: string;
  description: string;
  type: ExitCriteriaType;
  measurement: CriteriaMeasurement;
  threshold: CriteriaThreshold;
  weight: number;
  mandatory: boolean;
  validator: string;
}

export type ExitCriteriaType = 'quality' | 'completion' | 'performance' | 'compliance' | 'approval' | 'testing';

export interface CriteriaMeasurement {
  metric: string;
  method: 'automated' | 'manual' | 'hybrid';
  frequency: string;
  dataSource: string;
  calculation: string;
}

export interface CriteriaThreshold {
  operator: 'greater_than' | 'less_than' | 'equal_to' | 'between' | 'not_equal_to';
  value: number | string;
  unit?: string;
  tolerance?: number;
}

// Quality Gates
export interface PhaseQualityGate {
  gateId: string;
  name: string;
  description: string;
  phase: string;
  timing: 'entry' | 'during' | 'exit';
  checks: QualityCheck[];
  thresholds: QualityThreshold[];
  actions: QualityGateAction[];
  escalation: EscalationRule[];
}

export interface QualityCheck {
  checkId: string;
  name: string;
  type: 'automated' | 'manual' | 'review';
  tool?: string;
  script?: string;
  reviewer?: string;
  criteria: string;
  weight: number;
}

export interface QualityThreshold {
  metric: string;
  minValue?: number;
  maxValue?: number;
  targetValue?: number;
  unit: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface QualityGateAction {
  trigger: 'pass' | 'fail' | 'warning';
  action: 'continue' | 'block' | 'approve' | 'escalate' | 'rollback';
  parameters?: Record<string, any>;
  notification?: NotificationConfig;
}

export interface NotificationConfig {
  recipients: string[];
  method: 'email' | 'slack' | 'teams' | 'webhook';
  template: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface EscalationRule {
  condition: string;
  level: number;
  stakeholders: string[];
  timeframe: string;
  action: string;
}

// Rollback Strategy
export interface PhaseRollbackStrategy {
  strategyId: string;
  name: string;
  triggers: RollbackTrigger[];
  steps: RollbackStep[];
  validation: RollbackValidation[];
  recovery: RecoveryPlan;
  communication: CommunicationPlan;
}

export interface RollbackTrigger {
  triggerId: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  automatic: boolean;
  approvalRequired: boolean;
  approvers?: string[];
}

export interface RollbackStep {
  stepId: string;
  order: number;
  description: string;
  type: 'automated' | 'manual';
  script?: string;
  estimatedTime: number;
  rollbackPoint: string;
  validation: string[];
  dependencies: string[];
}

export interface RollbackValidation {
  validationId: string;
  type: 'functional' | 'data' | 'performance' | 'security';
  method: string;
  criteria: string;
  timeout: number;
  retryCount: number;
}

export interface RecoveryPlan {
  dataRecovery: DataRecoveryPlan;
  systemRecovery: SystemRecoveryPlan;
  businessRecovery: BusinessRecoveryPlan;
}

export interface DataRecoveryPlan {
  backupStrategy: string;
  recoveryPoints: RecoveryPoint[];
  validationSteps: string[];
  integrityChecks: string[];
}

export interface RecoveryPoint {
  pointId: string;
  timestamp: Date;
  description: string;
  scope: string[];
  verificationMethod: string;
}

export interface SystemRecoveryPlan {
  rollbackOrder: string[];
  serviceRecovery: ServiceRecoveryStep[];
  configurationRecovery: string[];
  monitoringRecovery: string[];
}

export interface ServiceRecoveryStep {
  service: string;
  order: number;
  method: string;
  healthCheck: string;
  dependencies: string[];
}

export interface BusinessRecoveryPlan {
  processRecovery: ProcessRecoveryStep[];
  userCommunication: UserCommunication[];
  businessValidation: BusinessValidation[];
}

export interface ProcessRecoveryStep {
  process: string;
  recovery_method: string;
  estimated_time: string;
  stakeholders: string[];
  success_criteria: string[];
}

export interface UserCommunication {
  audience: string;
  message_template: string;
  delivery_method: string;
  timing: string;
}

export interface BusinessValidation {
  validation_type: string;
  method: string;
  success_criteria: string;
  responsible_party: string;
}

export interface CommunicationPlan {
  stakeholders: CommunicationStakeholder[];
  channels: CommunicationChannel[];
  templates: CommunicationTemplate[];
  escalationMatrix: CommunicationEscalation[];
}

export interface CommunicationStakeholder {
  role: string;
  contact_info: string;
  notification_preferences: string[];
  escalation_level: number;
}

export interface CommunicationChannel {
  type: string;
  configuration: Record<string, any>;
  fallback?: string;
  reliability: number;
}

export interface CommunicationTemplate {
  template_id: string;
  type: 'status' | 'alert' | 'escalation' | 'completion';
  format: 'text' | 'html' | 'markdown';
  content: string;
  variables: string[];
}

export interface CommunicationEscalation {
  level: number;
  timeframe: string;
  stakeholders: string[];
  channels: string[];
  approval_required: boolean;
}

// Phase Resources
export interface PhaseResources {
  human: HumanResource[];
  technical: TechnicalResource[];
  financial: FinancialResource;
  external: ExternalResource[];
}

export interface HumanResource {
  role: string;
  skillsRequired: string[];
  effort: number;
  allocation: number;
  availability: Availability[];
  cost: number;
}

export interface Availability {
  startDate: Date;
  endDate: Date;
  percentage: number;
  constraints?: string[];
}

export interface TechnicalResource {
  type: string;
  specification: string;
  quantity: number;
  usage_duration: string;
  cost: number;
  procurement_lead_time: string;
}

export interface FinancialResource {
  budget: number;
  currency: string;
  breakdown: BudgetBreakdown;
  approvals: BudgetApproval[];
}

export interface BudgetBreakdown {
  personnel: number;
  technology: number;
  external_services: number;
  contingency: number;
  overhead: number;
}

export interface BudgetApproval {
  amount_threshold: number;
  approver: string;
  process: string;
  lead_time: string;
}

export interface ExternalResource {
  provider: string;
  service_type: string;
  description: string;
  contract_terms: string;
  cost: number;
  dependencies: string[];
}

// Phase Risk Assessment
export interface PhaseRiskAssessment {
  risks: PhaseRisk[];
  overall_score: number;
  mitigation_strategy: RiskMitigationStrategy;
  monitoring_plan: RiskMonitoringPlan;
}

export interface PhaseRisk {
  riskId: string;
  description: string;
  category: 'technical' | 'schedule' | 'resource' | 'external' | 'business';
  probability: number;
  impact: number;
  risk_score: number;
  triggers: string[];
  mitigation_actions: string[];
  contingency_plans: string[];
  owner: string;
}

export interface RiskMitigationStrategy {
  strategy_id: string;
  approach: 'avoid' | 'mitigate' | 'transfer' | 'accept';
  actions: MitigationAction[];
  budget: number;
  timeline: string;
  success_metrics: string[];
}

export interface MitigationAction {
  action_id: string;
  description: string;
  type: 'preventive' | 'corrective' | 'detective';
  responsible_party: string;
  due_date: Date;
  success_criteria: string[];
  cost: number;
}

export interface RiskMonitoringPlan {
  indicators: RiskIndicator[];
  reporting_frequency: string;
  escalation_thresholds: EscalationThreshold[];
  review_cycle: string;
}

export interface RiskIndicator {
  indicator_id: string;
  name: string;
  type: 'leading' | 'lagging';
  measurement: string;
  threshold: number;
  data_source: string;
  collection_frequency: string;
}

export interface EscalationThreshold {
  level: number;
  condition: string;
  stakeholders: string[];
  response_time: string;
  actions: string[];
}