/**
 * Security Types
 * 
 * Comprehensive type definitions for the security audit and penetration testing framework.
 */

export type VulnerabilityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityAuditResult {
  auditId: string;
  timestamp: Date;
  overallScore: number;
  vulnerabilities: Vulnerability[];
  metrics: SecurityMetrics;
  recommendations: string[];
  complianceStatus: Map<string, boolean>;
  executionTime: number;
}

export interface Vulnerability {
  id: string;
  type: string;
  severity: VulnerabilityLevel;
  description: string;
  location: string;
  remediation: string;
  cveId: string | null;
}

export interface SecurityMetrics {
  totalVulnerabilities: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  mediumVulnerabilities: number;
  lowVulnerabilities: number;
  scanCoverage: number;
  falsePositives: number;
  averageResolutionTime: number;
  complianceScore: number;
}

export interface PenTestResult {
  testId: string;
  timestamp: Date;
  testType: string;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  findings: SecurityFinding[];
  attackVectors: AttackVector[];
  recommendations: string[];
  executionTime: number;
  testCoverage: number;
  complianceIssues: string[];
}

export interface SecurityFinding {
  id: string;
  type: string;
  severity: VulnerabilityLevel;
  description: string;
  location: string;
  evidence: string;
  remediation: string;
  riskScore: number;
}

export interface AttackVector {
  id: string;
  name: string;
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  exploitability: 'low' | 'medium' | 'high';
  mitigationEffort: 'low' | 'medium' | 'high';
}

export interface ThreatModel {
  id: string;
  name: string;
  description: string;
  assets: Asset[];
  threats: Threat[];
  vulnerabilities: Vulnerability[];
  mitigations: Mitigation[];
  riskAssessment: RiskAssessment;
}

export interface Asset {
  id: string;
  name: string;
  type: 'data' | 'system' | 'network' | 'application' | 'process';
  value: 'low' | 'medium' | 'high' | 'critical';
  confidentialityRequirement: 'low' | 'medium' | 'high';
  integrityRequirement: 'low' | 'medium' | 'high';
  availabilityRequirement: 'low' | 'medium' | 'high';
}

export interface Threat {
  id: string;
  name: string;
  category: 'spoofing' | 'tampering' | 'repudiation' | 'information_disclosure' | 'denial_of_service' | 'elevation_of_privilege';
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  targetAssets: string[];
  attackVectors: string[];
}

export interface Mitigation {
  id: string;
  name: string;
  type: 'preventive' | 'detective' | 'corrective' | 'recovery';
  description: string;
  effectiveness: 'low' | 'medium' | 'high';
  cost: 'low' | 'medium' | 'high';
  implementationComplexity: 'low' | 'medium' | 'high';
  mitigatedThreats: string[];
}

export interface RiskAssessment {
  totalRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  residualRisk: number;
  riskTolerance: 'low' | 'medium' | 'high';
  recommendedActions: string[];
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  eventType: 'authentication' | 'authorization' | 'data_access' | 'system_change' | 'security_violation' | 'anomaly';
  severity: VulnerabilityLevel;
  source: string;
  description: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
}

export interface ComplianceValidationResult {
  standard: string;
  version: string;
  overallCompliance: number;
  requirements: ComplianceRequirement[];
  gaps: ComplianceGap[];
  recommendations: string[];
  lastAssessment: Date;
  nextAssessment: Date;
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  category: string;
  mandatory: boolean;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence: string[];
  lastValidated: Date;
}

export interface ComplianceGap {
  requirementId: string;
  description: string;
  severity: VulnerabilityLevel;
  remediation: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  dueDate?: Date;
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-27T05:06:00-04:00 | SecurityTypes@Claude-4 | Created comprehensive security type definitions | security-types.ts | OK | Complete type system for security framework | 0.00 | g3h8i9j |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: phase9-security-audit-007
- inputs: ["security framework type requirements"]
- tools_used: ["filesystem", "typescript"]
- versions: {"model":"claude-4","prompt":"security-types-v1"}
/* AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */