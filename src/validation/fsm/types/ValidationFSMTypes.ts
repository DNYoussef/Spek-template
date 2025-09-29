/**
 * ValidationFSMTypes.ts
 * FSM-First validation system types and enums
 * NASA POT10 Compliant: Bounded state definitions
 */

// Core FSM States - Exactly 5 as required
export enum ValidationState {
  CHECKING = 'CHECKING',
  VALIDATING = 'VALIDATING', 
  REPORTING = 'REPORTING',
  ENFORCING = 'ENFORCING',
  CERTIFIED = 'CERTIFIED'
}

// FSM Events - No string literals
export enum ValidationEvent {
  START_CHECK = 'START_CHECK',
  CHECK_COMPLETED = 'CHECK_COMPLETED',
  VALIDATION_PASSED = 'VALIDATION_PASSED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  REPORT_GENERATED = 'REPORT_GENERATED',
  ENFORCEMENT_APPLIED = 'ENFORCEMENT_APPLIED',
  CERTIFICATION_GRANTED = 'CERTIFICATION_GRANTED',
  RESET = 'RESET',
  ERROR = 'ERROR'
}

// Compliance Levels
export enum ComplianceLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH', 
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

// Validation Types
export enum ValidationType {
  NASA_POT10 = 'NASA_POT10',
  SECURITY = 'SECURITY',
  QUALITY = 'QUALITY',
  PERFORMANCE = 'PERFORMANCE',
  COMPLIANCE = 'COMPLIANCE'
}

// Base FSM Context
export interface ValidationContext {
  readonly currentState: ValidationState;
  readonly targetId: string;
  readonly validationType: ValidationType;
  readonly startTime: number;
  readonly complianceLevel: ComplianceLevel;
  
  // Mutable state data
  checkResults: CheckResult[];
  validationResults: ValidationResult[];
  reportData: ReportData;
  enforcementActions: EnforcementAction[];
  certificationStatus: CertificationStatus;
  errors: ValidationError[];
}

// Check Results (Bounded for NASA Rule 10)
export interface CheckResult {
  readonly checkId: string;
  readonly checkType: string;
  readonly status: 'PASS' | 'FAIL' | 'SKIP';
  readonly timestamp: number;
  readonly details: string;
  readonly metrics: Record<string, number>;
}

// Validation Results (Bounded)
export interface ValidationResult {
  readonly validationId: string;
  readonly rule: string;
  readonly status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
  readonly score: number; // 0-100
  readonly evidence: string[];
  readonly recommendations: string[];
}

// Report Data (Structured)
export interface ReportData {
  readonly reportId: string;
  readonly generatedAt: number;
  readonly summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    complianceScore: number;
  };
  readonly findings: ValidationFinding[];
  readonly recommendations: string[];
}

// Validation Finding (Bounded)
export interface ValidationFinding {
  readonly findingId: string;
  readonly severity: ComplianceLevel;
  readonly description: string;
  readonly location: string;
  readonly remediation: string;
  readonly timeline: string;
}

// Enforcement Action (Bounded)
export interface EnforcementAction {
  readonly actionId: string;
  readonly actionType: 'BLOCK' | 'WARN' | 'REQUIRE' | 'MONITOR';
  readonly trigger: string;
  readonly applied: boolean;
  readonly timestamp: number;
}

// Certification Status
export interface CertificationStatus {
  readonly certified: boolean;
  readonly certificationLevel: ComplianceLevel;
  readonly validUntil: number;
  readonly certificationId?: string;
  readonly conditions: string[];
}

// Validation Error (Bounded)
export interface ValidationError {
  readonly errorId: string;
  readonly errorType: string;
  readonly message: string;
  readonly timestamp: number;
  readonly recoverable: boolean;
}

// State Transition Guard Functions
export type TransitionGuard = (context: ValidationContext, event: ValidationEvent) => boolean;

// State Action Functions (NASA Rule 10: ≤60 lines each)
export type StateAction = (context: ValidationContext) => Promise<ValidationContext>;

// FSM Transition Definition
export interface StateTransition {
  readonly from: ValidationState;
  readonly to: ValidationState;
  readonly event: ValidationEvent;
  readonly guard?: TransitionGuard;
  readonly action?: StateAction;
}

// FSM Configuration
export interface ValidationFSMConfig {
  readonly initialState: ValidationState;
  readonly transitions: StateTransition[];
  readonly stateActions: Map<ValidationState, StateAction>;
  readonly errorState: ValidationState;
  readonly finalStates: ValidationState[];
}

// Component Interfaces for Decomposition
export interface IRuleEngine {
  loadRules(type: ValidationType): Promise<ValidationRule[]>;
  evaluateRule(rule: ValidationRule, target: any): Promise<ValidationResult>;
  getRuleMetrics(): RuleMetrics;
}

export interface IComplianceChecker {
  performCheck(checkSpec: CheckSpecification): Promise<CheckResult>;
  validateCompliance(results: CheckResult[]): Promise<ValidationResult[]>;
  getComplianceScore(results: ValidationResult[]): number;
}

export interface IValidationReporter {
  generateReport(context: ValidationContext): Promise<ReportData>;
  exportReport(reportData: ReportData, format: 'JSON' | 'HTML' | 'PDF'): Promise<string>;
  archiveReport(reportId: string): Promise<void>;
}

export interface ICertificationManager {
  evaluateCertification(context: ValidationContext): Promise<CertificationStatus>;
  issueCertificate(certificationId: string): Promise<Certificate>;
  revokeCertificate(certificationId: string): Promise<void>;
}

// Supporting Types
export interface ValidationRule {
  readonly ruleId: string;
  readonly ruleType: ValidationType;
  readonly priority: ComplianceLevel;
  readonly description: string;
  readonly parameters: Record<string, any>;
  readonly enabled: boolean;
}

export interface RuleMetrics {
  readonly totalRules: number;
  readonly activeRules: number;
  readonly passRate: number;
  readonly averageExecutionTime: number;
}

export interface CheckSpecification {
  readonly specId: string;
  readonly checkType: string;
  readonly target: string;
  readonly parameters: Record<string, any>;
  readonly timeout: number;
}

export interface Certificate {
  readonly certificateId: string;
  readonly issuedTo: string;
  readonly issuedBy: string;
  readonly issuedAt: number;
  readonly validUntil: number;
  readonly level: ComplianceLevel;
  readonly conditions: string[];
  readonly signature: string;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: validation-fsm-types-001
// inputs: ["god-object-analysis"]
// tools_used: ["mcp__filesystem__write_file"]
// versions: {"model":"claude-4","prompt":"validation-destroyer-v1"}
// === END FOOTER ===