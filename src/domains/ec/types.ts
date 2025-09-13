/**
 * Enterprise Compliance Domain Type Definitions
 * Comprehensive types for compliance automation, audit trails, and monitoring
 *
 * Domain: EC (Enterprise Compliance)
 */

export type ComplianceFramework = 'soc2' | 'iso27001' | 'nist-ssdf' | 'pci-dss' | 'hipaa' | 'gdpr';
export type TrustServicesCriteria = 'security' | 'availability' | 'integrity' | 'confidentiality' | 'privacy';
export type ComplianceRating = 'compliant' | 'partially-compliant' | 'non-compliant' | 'not-assessed';
export type FindingSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EvidenceType = 'document' | 'screenshot' | 'log' | 'configuration' | 'report' | 'certificate';

/**
 * Core Compliance Interfaces
 */
export interface ComplianceStatus {
  overall: number;
  frameworks: Record<string, any>;
  auditTrail?: string;
  correlationResults?: any;
  performanceOverhead?: number;
  timestamp: Date;
}

export interface ComplianceEvidence {
  id: string;
  type: EvidenceType;
  source: string;
  content: string;
  timestamp: Date;
  hash?: string;
  controlId?: string;
  framework?: string;
  retentionDate?: Date;
  classification?: 'public' | 'internal' | 'confidential' | 'restricted';
  metadata?: Record<string, any>;
}

export interface ControlAssessment {
  controlId: string;
  description: string;
  status: ComplianceRating;
  score: number;
  findings: string[];
  evidence: string[];
  testResults: TestResult[];
  timestamp: Date;
  assessor?: string;
  reviewDate?: Date;
  nextAssessmentDue?: Date;
}

export interface TestResult {
  testId: string;
  testName: string;
  result: 'pass' | 'fail' | 'error' | 'skip';
  details: string;
  timestamp: Date;
  duration?: number;
  automated: boolean;
}

/**
 * Framework-Specific Types
 */
export interface SOC2Assessment {
  assessmentId: string;
  type: 'type-i' | 'type-ii';
  trustServicesCriteria: TrustServicesCriteria[];
  reportingPeriod: {
    start: Date;
    end: Date;
  };
  overallOpinion: 'unqualified' | 'qualified' | 'adverse' | 'disclaimer';
  controlDeficiencies: ControlDeficiency[];
  managementLetter: string[];
  auditFirm?: string;
  auditorSignature?: string;
}

export interface ControlDeficiency {
  id: string;
  control: string;
  severity: 'deficiency' | 'significant-deficiency' | 'material-weakness';
  description: string;
  impact: string;
  recommendation: string;
  managementResponse: string;
  remediationTarget: Date;
  status: 'open' | 'in-progress' | 'closed';
}

export interface ISO27001Assessment {
  assessmentId: string;
  standard: 'iso27001:2013' | 'iso27001:2022';
  scope: string;
  applicabilityStatement: ApplicabilityStatement;
  riskAssessment: ISO27001RiskAssessment;
  auditResults: ISO27001AuditResult[];
  certificateValidity: {
    issued: Date;
    expires: Date;
  };
  surveillanceAudits: Date[];
  nonConformities: NonConformity[];
}

export interface ApplicabilityStatement {
  control: string;
  applicable: boolean;
  justification: string;
  implementationStatus: 'implemented' | 'partially-implemented' | 'not-implemented' | 'not-applicable';
  evidence: string[];
}

export interface ISO27001RiskAssessment {
  methodology: string;
  riskCriteria: RiskCriteria;
  risks: IdentifiedRisk[];
  treatmentPlan: RiskTreatmentPlan;
  acceptanceRecord: string;
  reviewDate: Date;
}

export interface RiskCriteria {
  likelihoodScale: number[];
  impactScale: number[];
  riskMatrix: number[][];
  acceptanceCriteria: number;
}

export interface IdentifiedRisk {
  id: string;
  description: string;
  asset: string;
  threat: string;
  vulnerability: string;
  likelihood: number;
  impact: number;
  riskLevel: number;
  treatment: 'mitigate' | 'avoid' | 'transfer' | 'accept';
  controls: string[];
  residualRisk: number;
  owner: string;
  reviewDate: Date;
}

export interface RiskTreatmentPlan {
  risks: string[];
  controls: string[];
  timeline: string;
  resources: string[];
  responsible: string;
  budget: number;
  approval: {
    approver: string;
    date: Date;
    conditions: string[];
  };
}

export interface ISO27001AuditResult {
  auditType: 'internal' | 'external' | 'surveillance' | 'recertification';
  auditor: string;
  auditDate: Date;
  scope: string;
  findings: AuditFinding[];
  opportunities: ImprovementOpportunity[];
  conclusion: string;
  recommendation: 'certificate' | 'certificate-with-conditions' | 'no-certificate';
}

export interface AuditFinding {
  id: string;
  type: 'nonconformity' | 'observation' | 'opportunity';
  severity: 'minor' | 'major' | 'critical';
  control: string;
  description: string;
  evidence: string;
  requirement: string;
  impact: string;
  correctiveAction: string;
  targetDate: Date;
  responsiblePerson: string;
  status: 'open' | 'in-progress' | 'closed' | 'verified';
}

export interface NonConformity {
  id: string;
  severity: 'minor' | 'major';
  control: string;
  finding: string;
  evidence: string;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  targetDate: Date;
  responsible: string;
  verificationDate?: Date;
  verificationEvidence?: string;
  status: 'open' | 'corrected' | 'verified' | 'closed';
}

export interface ImprovementOpportunity {
  id: string;
  area: string;
  description: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  owner: string;
  targetDate: Date;
  status: 'identified' | 'approved' | 'in-progress' | 'completed';
}

export interface NISTSSFDAssessment {
  assessmentId: string;
  version: 'v1.0' | 'v1.1';
  currentTier: number;
  targetTier: number;
  practices: NISTSSFDPracticeAssessment[];
  functions: NISTSSFDFunctionAssessment[];
  maturityLevel: number;
  gapAnalysis: NISTSSFDGapAnalysis;
  improvementPlan: NISTSSFDImprovementPlan;
}

export interface NISTSSFDPracticeAssessment {
  practiceId: string;
  function: 'prepare' | 'protect' | 'produce' | 'respond';
  category: 'po' | 'ps' | 'pw' | 'rv';
  currentTier: number;
  targetTier: number;
  implementationEvidence: string[];
  gapDescription: string;
  recommendedActions: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface NISTSSFDFunctionAssessment {
  function: 'prepare' | 'protect' | 'produce' | 'respond';
  practices: NISTSSFDPracticeAssessment[];
  averageTier: number;
  maturityScore: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

export interface NISTSSFDGapAnalysis {
  totalGaps: number;
  criticalGaps: number;
  gapsByFunction: Record<string, number>;
  prioritizedGaps: {
    practice: string;
    currentTier: number;
    targetTier: number;
    effort: string;
    impact: string;
    dependencies: string[];
  }[];
  remediationRoadmap: {
    phase: number;
    practices: string[];
    duration: string;
    deliverables: string[];
  }[];
}

export interface NISTSSFDImprovementPlan {
  objectives: string[];
  initiatives: {
    id: string;
    name: string;
    practices: string[];
    timeline: string;
    resources: string[];
    success_criteria: string[];
    owner: string;
    dependencies: string[];
    status: 'planned' | 'in-progress' | 'completed' | 'on-hold';
  }[];
  milestones: {
    id: string;
    name: string;
    date: Date;
    criteria: string[];
    status: 'upcoming' | 'achieved' | 'missed';
  }[];
  metrics: {
    metric: string;
    baseline: number;
    target: number;
    current: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
}

/**
 * Audit Trail Types
 */
export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  source: string;
  actor: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'pending';
  details: Record<string, any>;
  sessionId?: string;
  correlationId?: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export type AuditEventType =
  | 'compliance_assessment'
  | 'control_evaluation'
  | 'evidence_collection'
  | 'finding_generated'
  | 'remediation_action'
  | 'user_access'
  | 'system_change'
  | 'data_export'
  | 'configuration_change'
  | 'policy_update'
  | 'risk_assessment'
  | 'approval_request'
  | 'workflow_execution';

export interface AuditTrail {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  events: AuditEvent[];
  integrity: AuditTrailIntegrity;
  retention: {
    policy: string;
    expiration: Date;
    archiveLocation?: string;
  };
  access: {
    viewers: string[];
    restrictions: string[];
    lastAccessed: Date;
  };
}

export interface AuditTrailIntegrity {
  hashChain: string[];
  signatures: {
    signer: string;
    timestamp: Date;
    signature: string;
    algorithm: string;
  }[];
  tamperEvidence: {
    detected: boolean;
    events: {
      timestamp: Date;
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }[];
  };
  verification: {
    lastVerified: Date;
    verifier: string;
    result: 'valid' | 'invalid' | 'corrupted';
    details: string;
  };
}

/**
 * Monitoring Types
 */
export interface ComplianceMetric {
  id: string;
  name: string;
  description: string;
  type: ComplianceMetricType;
  framework: ComplianceFramework;
  value: number | string | boolean;
  threshold: number;
  status: MetricStatus;
  unit: string;
  collectTime: Date;
  source: string;
  tags: Record<string, string>;
  trend: {
    direction: 'up' | 'down' | 'stable' | 'volatile';
    change: number;
    period: string;
  };
}

export type ComplianceMetricType =
  | 'compliance_score'
  | 'control_effectiveness'
  | 'risk_exposure'
  | 'audit_findings'
  | 'remediation_rate'
  | 'cost_of_compliance'
  | 'time_to_remediate'
  | 'certification_status'
  | 'policy_coverage'
  | 'training_completion';

export type MetricStatus = 'normal' | 'warning' | 'critical' | 'unknown';

export interface ComplianceAlert {
  id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  framework: ComplianceFramework;
  metric: string;
  condition: {
    operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
    value: number;
    duration: number; // seconds
  };
  status: 'active' | 'resolved' | 'suppressed' | 'acknowledged';
  triggeredAt: Date;
  resolvedAt?: Date;
  assignee?: string;
  escalation: {
    level: number;
    nextEscalation?: Date;
    escalationPath: string[];
  };
  actions: {
    automated: string[];
    manual: string[];
    executed: {
      action: string;
      timestamp: Date;
      result: string;
      actor: string;
    }[];
  };
}

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ComplianceDashboard {
  id: string;
  name: string;
  description: string;
  framework: ComplianceFramework | 'all';
  widgets: DashboardWidget[];
  layout: {
    type: 'grid' | 'flex' | 'custom';
    configuration: Record<string, any>;
  };
  refreshInterval: number;
  filters: {
    timeRange: string;
    framework: string[];
    severity: string[];
    status: string[];
  };
  access: {
    viewers: string[];
    editors: string[];
    owners: string[];
  };
  createdAt: Date;
  lastModified: Date;
}

export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  title: string;
  description: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  dataSource: {
    type: 'metric' | 'query' | 'static';
    configuration: Record<string, any>;
  };
  visualization: {
    type: 'chart' | 'gauge' | 'table' | 'heatmap' | 'timeline' | 'metric' | 'list';
    options: Record<string, any>;
  };
  refreshInterval: number;
}

export type DashboardWidgetType =
  | 'compliance_score'
  | 'framework_status'
  | 'findings_summary'
  | 'risk_heatmap'
  | 'audit_timeline'
  | 'remediation_status'
  | 'metric_trend'
  | 'alert_summary'
  | 'evidence_status'
  | 'certification_status';

/**
 * Integration Types
 */
export interface ComplianceIntegration {
  id: string;
  name: string;
  type: IntegrationType;
  configuration: IntegrationConfiguration;
  status: IntegrationStatus;
  lastSync: Date;
  metrics: {
    successfulSyncs: number;
    failedSyncs: number;
    averageSyncTime: number;
    dataQuality: number;
  };
  errorLog: IntegrationError[];
}

export type IntegrationType =
  | 'evidence_system'
  | 'audit_platform'
  | 'risk_management'
  | 'grc_platform'
  | 'security_tools'
  | 'monitoring_system'
  | 'ticketing_system'
  | 'documentation_system'
  | 'learning_management'
  | 'identity_management';

export interface IntegrationConfiguration {
  endpoint: string;
  authentication: {
    type: 'api_key' | 'oauth' | 'certificate' | 'basic';
    credentials: Record<string, string>;
  };
  syncFrequency: string;
  dataMapping: {
    sourceField: string;
    targetField: string;
    transformation?: string;
  }[];
  filters: Record<string, any>;
  retryPolicy: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    retryDelay: number;
  };
}

export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'syncing' | 'pending';

export interface IntegrationError {
  timestamp: Date;
  operation: string;
  error: string;
  details: Record<string, any>;
  resolved: boolean;
  resolution?: string;
}

/**
 * Configuration Types
 */
export interface ComplianceConfiguration {
  frameworks: {
    framework: ComplianceFramework;
    enabled: boolean;
    version: string;
    configuration: FrameworkConfiguration;
  }[];
  automation: {
    enabled: boolean;
    schedules: {
      assessments: string;
      monitoring: string;
      reporting: string;
      remediation: string;
    };
    thresholds: {
      compliance_score: number;
      risk_score: number;
      finding_count: number;
      remediation_time: number;
    };
  };
  reporting: {
    frequency: string;
    recipients: string[];
    formats: string[];
    includeEvidence: boolean;
    retentionPeriod: number;
  };
  integrations: {
    phase3Evidence: boolean;
    enterpriseConfig: boolean;
    nasaPOT10: boolean;
    additionalSystems: string[];
  };
  performance: {
    budgetPercentage: number;
    monitoringEnabled: boolean;
    optimizationEnabled: boolean;
  };
}

export interface FrameworkConfiguration {
  scope: string[];
  controls: {
    control: string;
    enabled: boolean;
    customization: Record<string, any>;
  }[];
  assessment: {
    frequency: string;
    method: 'automated' | 'manual' | 'hybrid';
    approvers: string[];
  };
  evidence: {
    types: EvidenceType[];
    retention: number;
    encryption: boolean;
  };
  notifications: {
    enabled: boolean;
    channels: string[];
    recipients: string[];
    conditions: string[];
  };
}

/**
 * Automation Configuration Interface
 */
export interface AutomationConfig {
  enabled: boolean;
  workflows: {
    assessment: boolean;
    remediation: boolean;
    reporting: boolean;
    alerting: boolean;
  };
  schedules: {
    dailyChecks: string;
    weeklyReports: string;
    monthlyAssessments: string;
    quarterlyReviews: string;
  };
  thresholds: {
    complianceScore: number;
    riskScore: number;
    findingCount: number;
    remediationTime: number;
  };
  escalation: {
    enabled: boolean;
    levels: {
      level: number;
      delay: number;
      recipients: string[];
      actions: string[];
    }[];
  };
  approvals: {
    required: boolean;
    approvers: string[];
    timeout: number;
    escalation: string[];
  };
}