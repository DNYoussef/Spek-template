/**
 * Security Validation FSM Types
 * Defines states, events, and data structures for FSM-based security validation
 */

// Security validation states
export enum SecurityValidationState {
  INITIAL = 'INITIAL',
  DATA_EXTRACTION = 'DATA_EXTRACTION',
  VULNERABILITY_ANALYSIS = 'VULNERABILITY_ANALYSIS',
  COMPLIANCE_VALIDATION = 'COMPLIANCE_VALIDATION',
  THREAT_ASSESSMENT = 'THREAT_ASSESSMENT',
  REPORT_GENERATION = 'REPORT_GENERATION',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// Security validation events
export enum SecurityValidationEvent {
  START_VALIDATION = 'START_VALIDATION',
  DATA_EXTRACTED = 'DATA_EXTRACTED',
  VULNERABILITIES_ANALYZED = 'VULNERABILITIES_ANALYZED',
  COMPLIANCE_CHECKED = 'COMPLIANCE_CHECKED',
  THREATS_ASSESSED = 'THREATS_ASSESSED',
  REPORT_GENERATED = 'REPORT_GENERATED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RESET = 'RESET'
}

// Security validation context data
export interface SecurityValidationContext {
  artifacts: any[];
  requestContext: Record<string, any>;
  extractedData?: Record<string, any>;
  vulnerabilities?: SecurityViolation[];
  complianceMetrics?: ComplianceMetrics;
  threatAssessment?: ThreatAssessment;
  securityMetrics?: SecurityMetrics;
  violations?: SecurityViolation[];
  recommendations?: string[];
  blockers?: SecurityViolation[];
  startTime: number;
  currentStep?: string;
  errorDetails?: any;
}

// Threat assessment data
export interface ThreatAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  threatVectors: string[];
  attackSurface: number;
  businessImpact: number;
  likelihood: number;
  overallRisk: number;
}

// Re-export types from main module
export interface SecurityThresholds {
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  mediumVulnerabilities: number;
  lowVulnerabilities: number;
  minimumSecurityScore: number;
}

export interface SecurityMetrics {
  vulnerabilities: VulnerabilityMetrics;
  compliance: ComplianceMetrics;
  authentication: AuthenticationMetrics;
  authorization: AuthorizationMetrics;
  encryption: EncryptionMetrics;
  logging: LoggingMetrics;
  overallScore: number;
}

export interface VulnerabilityMetrics {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  byCategory: Record<string, number>;
  trends: {
    newVulnerabilities: number;
    fixedVulnerabilities: number;
    regressionRate: number;
  };
}

export interface ComplianceMetrics {
  owasp: OWASPCompliance;
  nist: NISTCompliance;
  pci: PCICompliance;
  gdpr: GDPRCompliance;
  iso27001: ISO27001Compliance;
}

export interface OWASPCompliance {
  score: number;
  top10Coverage: Record<string, boolean>;
  violations: string[];
}

export interface NISTCompliance {
  score: number;
  frameworkCoverage: Record<string, number>;
  controlsImplemented: number;
  totalControls: number;
}

export interface PCICompliance {
  score: number;
  requirements: Record<string, boolean>;
  dataProtection: boolean;
  networkSecurity: boolean;
}

export interface GDPRCompliance {
  score: number;
  dataProcessing: boolean;
  consent: boolean;
  rightToErasure: boolean;
  dataPortability: boolean;
}

export interface ISO27001Compliance {
  score: number;
  controls: Record<string, boolean>;
  riskAssessment: boolean;
  informationSecurity: boolean;
}

export interface AuthenticationMetrics {
  score: number;
  multiFactorAuth: boolean;
  passwordPolicies: boolean;
  sessionManagement: boolean;
  accountLockout: boolean;
  weakCredentials: number;
}

export interface AuthorizationMetrics {
  score: number;
  accessControl: boolean;
  roleBasedAccess: boolean;
  privilegeEscalation: number;
  unauthorizedAccess: number;
  dataLeakage: number;
}

export interface EncryptionMetrics {
  score: number;
  dataAtRest: boolean;
  dataInTransit: boolean;
  keyManagement: boolean;
  cryptographicStrength: number;
  weakEncryption: number;
}

export interface LoggingMetrics {
  score: number;
  securityEvents: boolean;
  auditTrail: boolean;
  logIntegrity: boolean;
  logRetention: boolean;
  sensitiveDataLogging: number;
}

export interface SecurityViolation {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  cwe?: string;
  cve?: string;
  location: string;
  recommendation: string;
  autoRemediable: boolean;
  estimatedFixTime: number;
}

export interface SecurityResult {
  metrics: SecurityMetrics;
  violations: SecurityViolation[];
  recommendations: string[];
  passed: boolean;
  blockers: SecurityViolation[];
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
Version & Run Log
/ Version / Timestamp / Agent/Model / Change Summary / Artifacts / Status / Notes / Cost / Hash /
/--------:/-----------/-------------/----------------/-----------/--------/-------/------/------/
/ 1.0.0   / 2025-09-28T18:35:00-04:00 / coder@sonnet-4 / Created SecurityValidationTypes.ts with FSM states, events, and comprehensive type definitions / SecurityValidationTypes.ts / OK / FSM type system foundation / 0.03 / 5f2a8c7 /

Receipt:
- status: OK
- reason_if_blocked: --
- run_id: secval-fsm-001
- inputs: ["NASA Rule 10 requirements", "FSM design patterns"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"secval-refactor-v1"}
AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */