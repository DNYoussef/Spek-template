/**
 * Compliance and Monitoring Types - Compliance and monitoring interfaces
 * Extracted from MigrationAnalysisTypes.ts for NASA Rule 10 compliance
 * Focus: Compliance frameworks, monitoring, and regulatory requirements
 */

export interface ComplianceProfile {
  frameworks: ComplianceFramework[];
  requirements: ComplianceRequirement[];
  assessments: ComplianceAssessment[];
  monitoring: ComplianceMonitoring;
  reporting: ComplianceReporting;
}

export interface ComplianceFramework {
  name: string;
  version: string;
  scope: string[];
  controls: ControlRequirement[];
  assessment: AssessmentRequirement;
  certification: CertificationInfo;
}

export interface ControlRequirement {
  id: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  implementation: ImplementationInfo;
  testing: TestingRequirement;
  evidence: EvidenceRequirement[];
}

export interface ImplementationInfo {
  status: 'not_implemented' | 'partial' | 'implemented' | 'verified';
  method: string;
  tools: string[];
  automation: number;
  documentation: string[];
}

export interface TestingRequirement {
  frequency: string;
  method: string[];
  automation: boolean;
  reporting: boolean;
  remediation: string;
}

export interface EvidenceRequirement {
  type: string;
  source: string;
  frequency: string;
  retention: string;
  access: string[];
}

export interface AssessmentRequirement {
  frequency: string;
  scope: string[];
  methodology: string;
  assessor: 'internal' | 'external' | 'third_party';
  reporting: boolean;
}

export interface CertificationInfo {
  required: boolean;
  authority: string;
  validity: string;
  renewal: string;
  cost: number;
}

export interface ComplianceRequirement {
  id: string;
  framework: string;
  category: string;
  description: string;
  implementation: RequirementImplementation;
  verification: RequirementVerification;
  exceptions: RequirementException[];
}

export interface RequirementImplementation {
  approach: string;
  tools: string[];
  timeline: string;
  resources: string[];
  dependencies: string[];
}

export interface RequirementVerification {
  method: string[];
  frequency: string;
  criteria: string[];
  automation: boolean;
  documentation: boolean;
}

export interface RequirementException {
  reason: string;
  justification: string;
  approver: string;
  expiration: Date;
  mitigation: string[];
}

export interface ComplianceAssessment {
  id: string;
  framework: string;
  assessor: string;
  date: Date;
  scope: string[];
  findings: ComplianceFinding[];
  score: number;
  certification: boolean;
}

export interface ComplianceFinding {
  controlId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_applicable';
  description: string;
  evidence: string[];
  remediation: RemediationPlan;
}

export interface RemediationPlan {
  actions: RemediationAction[];
  timeline: string;
  responsible: string;
  cost: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface RemediationAction {
  description: string;
  method: string;
  timeline: string;
  resources: string[];
  verification: string;
}

export interface ComplianceMonitoring {
  continuous: boolean;
  metrics: MonitoringMetric[];
  alerting: MonitoringAlert[];
  automation: MonitoringAutomation;
  integration: MonitoringIntegration[];
}

export interface MonitoringMetric {
  name: string;
  description: string;
  source: string;
  frequency: string;
  threshold: MetricThreshold[];
  trending: boolean;
}

export interface MetricThreshold {
  level: 'info' | 'warning' | 'error' | 'critical';
  value: number;
  action: string;
  escalation: string[];
}

export interface MonitoringAlert {
  trigger: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[];
  channels: string[];
  escalation: EscalationPath;
}

export interface EscalationPath {
  levels: EscalationLevel[];
  automatic: boolean;
  criteria: string[];
}

export interface EscalationLevel {
  level: number;
  recipients: string[];
  delay: number;
  actions: string[];
}

export interface MonitoringAutomation {
  collection: boolean;
  analysis: boolean;
  alerting: boolean;
  reporting: boolean;
  remediation: boolean;
}

export interface MonitoringIntegration {
  system: string;
  type: 'push' | 'pull' | 'bidirectional';
  frequency: string;
  data: string[];
  transformation: boolean;
}

export interface ComplianceReporting {
  schedules: ReportingSchedule[];
  templates: ReportingTemplate[];
  distribution: ReportingDistribution[];
  automation: ReportingAutomation;
}

export interface ReportingSchedule {
  name: string;
  frequency: string;
  scope: string[];
  recipients: string[];
  format: string;
}

export interface ReportingTemplate {
  name: string;
  framework: string;
  sections: TemplateSection[];
  automation: number;
  customization: boolean;
}

export interface TemplateSection {
  name: string;
  content: string[];
  source: string;
  automation: boolean;
  visualization: boolean;
}

export interface ReportingDistribution {
  method: string;
  recipients: RecipientGroup[];
  scheduling: boolean;
  tracking: boolean;
}

export interface RecipientGroup {
  name: string;
  members: string[];
  role: string;
  access: string[];
}

export interface ReportingAutomation {
  generation: boolean;
  distribution: boolean;
  validation: boolean;
  archival: boolean;
}

export interface MonitoringProfile {
  infrastructure: InfrastructureMonitoring;
  application: ApplicationMonitoring;
  security: SecurityMonitoring;
  business: BusinessMonitoring;
  integration: IntegrationMonitoring;
}

export interface InfrastructureMonitoring {
  metrics: InfrastructureMetric[];
  tools: MonitoringTool[];
  alerting: InfrastructureAlerting;
  automation: InfrastructureAutomation;
}

export interface InfrastructureMetric {
  category: 'cpu' | 'memory' | 'disk' | 'network' | 'database' | 'middleware';
  name: string;
  threshold: number;
  critical: boolean;
  trending: boolean;
}

export interface MonitoringTool {
  name: string;
  type: 'agent' | 'agentless' | 'synthetic' | 'log' | 'apm';
  coverage: string[];
  integration: boolean;
  cost: number;
}

export interface InfrastructureAlerting {
  realtime: boolean;
  correlation: boolean;
  suppression: boolean;
  escalation: boolean;
}

export interface InfrastructureAutomation {
  selfHealing: boolean;
  scaling: boolean;
  provisioning: boolean;
  patching: boolean;
}

export interface ApplicationMonitoring {
  performance: PerformanceMonitoring;
  errors: ErrorMonitoring;
  usage: UsageMonitoring;
  business: BusinessMetricMonitoring;
}

export interface PerformanceMonitoring {
  response: boolean;
  throughput: boolean;
  resource: boolean;
  bottleneck: boolean;
  synthetic: boolean;
}

export interface ErrorMonitoring {
  tracking: boolean;
  aggregation: boolean;
  analysis: boolean;
  notification: boolean;
  resolution: boolean;
}

export interface UsageMonitoring {
  user: boolean;
  feature: boolean;
  geographic: boolean;
  device: boolean;
  behavior: boolean;
}

export interface BusinessMetricMonitoring {
  kpi: boolean;
  conversion: boolean;
  revenue: boolean;
  satisfaction: boolean;
  adoption: boolean;
}

export interface SecurityMonitoring {
  events: SecurityEventMonitoring;
  threats: ThreatMonitoring;
  compliance: SecurityComplianceMonitoring;
  incidents: SecurityIncidentMonitoring;
}

export interface SecurityEventMonitoring {
  authentication: boolean;
  authorization: boolean;
  dataAccess: boolean;
  configuration: boolean;
  vulnerability: boolean;
}

export interface ThreatMonitoring {
  detection: boolean;
  analysis: boolean;
  intelligence: boolean;
  hunting: boolean;
  response: boolean;
}

export interface SecurityComplianceMonitoring {
  frameworks: string[];
  controls: boolean;
  reporting: boolean;
  assessment: boolean;
}

export interface SecurityIncidentMonitoring {
  detection: boolean;
  classification: boolean;
  response: boolean;
  forensics: boolean;
  recovery: boolean;
}

export interface BusinessMonitoring {
  kpis: BusinessKPI[];
  processes: ProcessMonitoring[];
  outcomes: OutcomeMonitoring[];
  stakeholders: StakeholderMonitoring[];
}

export interface BusinessKPI {
  name: string;
  category: string;
  target: number;
  current: number;
  trend: 'up' | 'down' | 'stable';
  frequency: string;
}

export interface ProcessMonitoring {
  process: string;
  metrics: string[];
  automation: boolean;
  optimization: boolean;
}

export interface OutcomeMonitoring {
  outcome: string;
  measurement: string;
  frequency: string;
  stakeholders: string[];
}

export interface StakeholderMonitoring {
  group: string;
  satisfaction: boolean;
  engagement: boolean;
  feedback: boolean;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: migration-decomposition-004
// inputs: ["MigrationAnalysisTypes.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"type-decomposition-v1"}
// === END FOOTER ===