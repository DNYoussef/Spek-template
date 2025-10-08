/**
 * Compliance Domain Types
 * Types for compliance requirements, stakeholders, and governance
 */

// Compliance Framework
export interface ComplianceContext {
  frameworks: ComplianceFramework[];
  requirements: ComplianceRequirement[];
  assessments: ComplianceAssessment[];
  audit_trail: AuditRecord[];
}

export interface ComplianceFramework {
  name: string;
  version: string;
  jurisdiction: string;
  scope: string[];
  controls: ComplianceControl[];
  certification_requirements: CertificationRequirement[];
}

export interface ComplianceControl {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  implementation_guidance: string;
  testing_procedures: string[];
}

export interface CertificationRequirement {
  name: string;
  authority: string;
  validity_period: string;
  renewal_process: string;
  cost: number;
}

export interface ComplianceRequirement {
  framework: string;
  jurisdiction: string;
  applicability: number; // 0-100 percentage
  criticalControls: string[];
  auditFrequency: string;
  penalties: CompliancePenalty[];
}

export interface CompliancePenalty {
  violationType: string;
  financialPenalty: number;
  operationalImpact: string;
  reputationalImpact: string;
  likelihood: number;
}

export interface ComplianceAssessment {
  id: string;
  framework: string;
  assessment_date: Date;
  assessor: string;
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_assessed';
  score: number;
  findings: ComplianceFinding[];
  recommendations: ComplianceRecommendation[];
}

export interface ComplianceFinding {
  control_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  remediation_required: boolean;
  deadline?: Date;
}

export interface ComplianceRecommendation {
  id: string;
  priority: string;
  description: string;
  effort_estimate: string;
  cost_estimate: number;
  risk_if_not_implemented: string;
}

// Security Context
export interface SecurityContext {
  classification: DataClassification;
  threats: ThreatAssessment[];
  controls: SecurityControl[];
  incidents: SecurityIncident[];
}

export interface DataClassification {
  public: DataCategory;
  internal: DataCategory;
  confidential: DataCategory;
  restricted: DataCategory;
}

export interface DataCategory {
  volume: number;
  types: string[];
  retention_requirements: RetentionRequirement[];
  protection_measures: string[];
}

export interface RetentionRequirement {
  data_type: string;
  period: string;
  reason: string;
  destruction_method: string;
}

export interface ThreatAssessment {
  threat_id: string;
  name: string;
  category: string;
  likelihood: number;
  impact: number;
  risk_score: number;
  mitigation_measures: string[];
}

export interface SecurityControl {
  id: string;
  name: string;
  type: 'preventive' | 'detective' | 'corrective';
  implementation_status: 'implemented' | 'partial' | 'planned' | 'not_implemented';
  effectiveness: number;
  cost: number;
}

export interface SecurityIncident {
  id: string;
  date: Date;
  severity: string;
  category: string;
  impact: IncidentImpact;
  resolution_time: number;
  lessons_learned: string[];
}

export interface IncidentImpact {
  financial: number;
  operational: string;
  reputational: string;
  regulatory: string;
}

// Stakeholder Management
export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  department: string;
  influence: 'low' | 'medium' | 'high' | 'critical';
  interest: 'low' | 'medium' | 'high' | 'critical';
  riskTolerance: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  impactOnProject: StakeholderImpact;
  communicationPreferences: CommunicationPreference[];
}

export interface StakeholderImpact {
  decisionMaking: boolean;
  resourceAllocation: boolean;
  approval: boolean;
  implementation: boolean;
  testing: boolean;
  signOff: boolean;
}

export interface CommunicationPreference {
  method: string;
  frequency: string;
  detail_level: 'summary' | 'detailed' | 'technical';
  urgency_threshold: 'low' | 'medium' | 'high' | 'critical';
}

// Governance Structure
export interface GovernanceStructure {
  committees: GovernanceCommittee[];
  roles: GovernanceRole[];
  processes: GovernanceProcess[];
  policies: GovernancePolicy[];
}

export interface GovernanceCommittee {
  name: string;
  purpose: string;
  members: CommitteeMember[];
  meeting_frequency: string;
  decision_authority: string[];
}

export interface CommitteeMember {
  stakeholder_id: string;
  role_in_committee: string;
  voting_rights: boolean;
  expertise_areas: string[];
}

export interface GovernanceRole {
  title: string;
  responsibilities: string[];
  authority_level: string;
  reporting_structure: string[];
  required_skills: string[];
}

export interface GovernanceProcess {
  name: string;
  purpose: string;
  steps: ProcessStep[];
  inputs: string[];
  outputs: string[];
  frequency: string;
}

export interface ProcessStep {
  order: number;
  name: string;
  description: string;
  responsible_role: string;
  duration_estimate: string;
  dependencies: string[];
}

export interface GovernancePolicy {
  name: string;
  version: string;
  effective_date: Date;
  review_cycle: string;
  scope: string[];
  requirements: PolicyRequirement[];
}

export interface PolicyRequirement {
  id: string;
  statement: string;
  mandatory: boolean;
  measurement_criteria: string;
  compliance_evidence: string[];
}

// Audit and Documentation
export interface AuditRecord {
  id: string;
  timestamp: Date;
  auditor: string;
  scope: string[];
  findings: AuditFinding[];
  recommendations: AuditRecommendation[];
  follow_up_required: boolean;
}

export interface AuditFinding {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  root_cause: string;
  impact_assessment: string;
}

export interface AuditRecommendation {
  id: string;
  finding_id: string;
  recommendation: string;
  priority: string;
  target_completion: Date;
  responsible_party: string;
  success_criteria: string[];
}