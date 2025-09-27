/**
 * Compliance System Type Definitions
 * Comprehensive types for ComplianceDriftDetector and compliance monitoring
 */

import { ComplianceRuleId, ComplianceScore, DriftThreshold, Timestamp } from '../base/primitives';
import { Result } from '../base/common';

// Core compliance types
export interface ComplianceRule {
  readonly id: ComplianceRuleId;
  readonly name: string;
  readonly description: string;
  readonly standard: ComplianceStandard;
  readonly category: ComplianceCategory;
  readonly requirement: ComplianceRequirement;
  readonly severity: ComplianceSeverity;
  readonly autoFixable: boolean;
  readonly metadata: RuleMetadata;
}

export interface ComplianceRequirement {
  readonly type: 'MUST' | 'SHOULD' | 'MAY' | 'MUST_NOT' | 'SHOULD_NOT';
  readonly condition: RequirementCondition;
  readonly evidence: EvidenceRequirement[];
  readonly exemptions: Exemption[];
}

export interface RequirementCondition {
  readonly expression: string;
  readonly context: ComplianceContext;
  readonly parameters: Record<string, ComplianceValue>;
  readonly timeout?: number;
}

export type ComplianceValue =
  | { type: 'string'; value: string; pattern?: string }
  | { type: 'number'; value: number; min?: number; max?: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'array'; elements: ComplianceValue[] }
  | { type: 'object'; properties: Record<string, ComplianceValue> }
  | { type: 'reference'; target: string; property?: string };

export interface ComplianceContext {
  readonly environment: string;
  readonly component: string;
  readonly version: string;
  readonly location: string;
  readonly dependencies: string[];
  readonly configuration: Record<string, ComplianceValue>;
}

export interface EvidenceRequirement {
  readonly type: 'file' | 'test' | 'documentation' | 'configuration' | 'audit_log';
  readonly source: string;
  readonly pattern?: string;
  readonly validation: EvidenceValidation;
}

export interface EvidenceValidation {
  readonly method: 'signature' | 'checksum' | 'timestamp' | 'content' | 'schema';
  readonly criteria: ValidationCriteria;
  readonly tolerance: number;
}

export interface ValidationCriteria {
  readonly required: string[];
  readonly forbidden: string[];
  readonly patterns: RegexPattern[];
  readonly limits: LimitConstraint[];
}

export interface RegexPattern {
  readonly pattern: string;
  readonly flags: string;
  readonly required: boolean;
  readonly description: string;
}

export interface LimitConstraint {
  readonly property: string;
  readonly operator: '<' | '<=' | '>' | '>=' | '==' | '!=';
  readonly value: number;
  readonly unit?: string;
}

export interface Exemption {
  readonly id: string;
  readonly reason: string;
  readonly grantedBy: string;
  readonly validUntil: Timestamp;
  readonly conditions: string[];
  readonly reviewRequired: boolean;
}

// Compliance result types
export interface ComplianceResult {
  readonly ruleId: ComplianceRuleId;
  readonly status: ComplianceStatus;
  readonly score: ComplianceScore;
  readonly evidence: ComplianceEvidence;
  readonly violations: RuleViolation[];
  readonly metadata: ResultMetadata;
}

export interface ComplianceEvidence {
  readonly artifacts: EvidenceArtifact[];
  readonly measurements: Measurement[];
  readonly attestations: Attestation[];
  readonly timestamp: Timestamp;
  readonly collector: string;
}

export interface EvidenceArtifact {
  readonly type: string;
  readonly source: string;
  readonly content: ArtifactContent;
  readonly checksum: string;
  readonly signature?: string;
}

export interface ArtifactContent {
  readonly format: 'text' | 'json' | 'xml' | 'binary';
  readonly encoding: string;
  readonly data: string;
  readonly metadata: Record<string, ComplianceValue>;
}

export interface Measurement {
  readonly metric: string;
  readonly value: number;
  readonly unit: string;
  readonly timestamp: Timestamp;
  readonly method: string;
  readonly accuracy: number;
}

export interface Attestation {
  readonly claim: string;
  readonly attestor: string;
  readonly timestamp: Timestamp;
  readonly signature: string;
  readonly evidence: string[];
}

export interface RuleViolation {
  readonly type: ViolationType;
  readonly severity: ComplianceSeverity;
  readonly description: string;
  readonly location: ViolationLocation;
  readonly currentValue: ComplianceValue;
  readonly requiredValue: ComplianceValue;
  readonly remediation: RemediationAction[];
}

export interface ViolationLocation {
  readonly component: string;
  readonly file?: string;
  readonly line?: number;
  readonly property?: string;
  readonly context: Record<string, string>;
}

export interface RemediationAction {
  readonly type: 'fix' | 'configure' | 'document' | 'review' | 'escalate';
  readonly description: string;
  readonly automated: boolean;
  readonly priority: number;
  readonly prerequisites: string[];
  readonly validation: ActionValidation;
}

export interface ActionValidation {
  readonly checks: ValidationCheck[];
  readonly rollback: RollbackPlan;
  readonly verification: VerificationStep[];
}

export interface ValidationCheck {
  readonly name: string;
  readonly condition: string;
  readonly timeout: number;
  readonly critical: boolean;
}

export interface RollbackPlan {
  readonly automatic: boolean;
  readonly triggers: string[];
  readonly steps: RollbackStep[];
  readonly verification: string[];
}

export interface RollbackStep {
  readonly action: string;
  readonly order: number;
  readonly timeout: number;
  readonly validation: string;
}

export interface VerificationStep {
  readonly name: string;
  readonly method: 'test' | 'check' | 'review' | 'audit';
  readonly criteria: string;
  readonly evidence: string[];
}

// Baseline and drift types
export interface ComplianceBaseline {
  readonly id: string;
  readonly standard: ComplianceStandard;
  readonly timestamp: Timestamp;
  readonly version: string;
  readonly overallScore: ComplianceScore;
  readonly ruleScores: Map<ComplianceRuleId, ComplianceScore>;
  readonly checksum: string;
  readonly validUntil: Timestamp;
  readonly metadata: BaselineMetadata;
}

export interface BaselineMetadata {
  readonly environment: string;
  readonly components: string[];
  readonly assessor: string;
  readonly methodology: string;
  readonly tools: string[];
  readonly configuration: Record<string, ComplianceValue>;
}

export interface ComplianceDrift {
  readonly id: string;
  readonly timestamp: Timestamp;
  readonly standard: ComplianceStandard;
  readonly baseline: string; // baseline ID
  readonly current: ComplianceResult[];
  readonly driftMetrics: DriftMetrics;
  readonly severity: ComplianceSeverity;
  readonly trend: DriftTrend;
  readonly alerts: DriftAlert[];
}

export interface DriftMetrics {
  readonly overallDrift: number; // percentage
  readonly scoreDrift: number;
  readonly rulesDegraded: number;
  readonly rulesImproved: number;
  readonly newViolations: number;
  readonly resolvedViolations: number;
  readonly timeToViolation: number; // seconds
}

export interface DriftAlert {
  readonly level: AlertLevel;
  readonly message: string;
  readonly affectedRules: ComplianceRuleId[];
  readonly recommendedActions: RemediationAction[];
  readonly escalationRequired: boolean;
  readonly suppressUntil?: Timestamp;
}

// Enum types
export enum ComplianceStandard {
  NASA_POT10 = 'NASA_POT10',
  DFARS = 'DFARS',
  NIST_800_53 = 'NIST_800_53',
  ISO27001 = 'ISO27001',
  SOC2 = 'SOC2',
  FISMA = 'FISMA',
  CMMC = 'CMMC'
}

export enum ComplianceCategory {
  ACCESS_CONTROL = 'ACCESS_CONTROL',
  AUDIT_ACCOUNTABILITY = 'AUDIT_ACCOUNTABILITY',
  CONFIGURATION_MANAGEMENT = 'CONFIGURATION_MANAGEMENT',
  IDENTIFICATION_AUTHENTICATION = 'IDENTIFICATION_AUTHENTICATION',
  SYSTEM_COMMUNICATIONS_PROTECTION = 'SYSTEM_COMMUNICATIONS_PROTECTION',
  SYSTEM_INFORMATION_INTEGRITY = 'SYSTEM_INFORMATION_INTEGRITY',
  INCIDENT_RESPONSE = 'INCIDENT_RESPONSE',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  SECURITY_ASSESSMENT = 'SECURITY_ASSESSMENT',
  SYSTEM_SERVICES_ACQUISITION = 'SYSTEM_SERVICES_ACQUISITION'
}

export enum ComplianceSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  PARTIALLY_COMPLIANT = 'PARTIALLY_COMPLIANT',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  UNDER_REVIEW = 'UNDER_REVIEW',
  EXEMPTED = 'EXEMPTED'
}

export enum ViolationType {
  MISSING = 'MISSING',
  INCORRECT = 'INCORRECT',
  INSUFFICIENT = 'INSUFFICIENT',
  EXPIRED = 'EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INCOMPLETE = 'INCOMPLETE'
}

export enum AlertLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export enum DriftTrend {
  IMPROVING = 'IMPROVING',
  DEGRADING = 'DEGRADING',
  STABLE = 'STABLE',
  VOLATILE = 'VOLATILE'
}

// Utility types and functions
export interface RuleMetadata {
  readonly version: string;
  readonly lastUpdated: Timestamp;
  readonly references: string[];
  readonly tags: string[];
  readonly complexity: 'low' | 'medium' | 'high';
  readonly frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'on_demand';
}

export interface ResultMetadata {
  readonly assessmentId: string;
  readonly timestamp: Timestamp;
  readonly duration: number;
  readonly assessor: string;
  readonly tool: string;
  readonly version: string;
  readonly environment: string;
}

// Type guards and utilities
export const isComplianceScore = (value: unknown): value is ComplianceScore =>
  typeof value === 'number' && value >= 0 && value <= 100;

export const isComplianceValue = (value: unknown): value is ComplianceValue => {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.type === 'string' &&
         ['string', 'number', 'boolean', 'array', 'object', 'reference'].includes(obj.type);
};

export const createComplianceResult = (
  ruleId: ComplianceRuleId,
  status: ComplianceStatus,
  score: ComplianceScore
): ComplianceResult => ({
  ruleId,
  status,
  score,
  evidence: {
    artifacts: [],
    measurements: [],
    attestations: [],
    timestamp: Date.now() as Timestamp,
    collector: 'system'
  },
  violations: [],
  metadata: {
    assessmentId: '',
    timestamp: Date.now() as Timestamp,
    duration: 0,
    assessor: 'automated',
    tool: 'compliance-drift-detector',
    version: '1.0.0',
    environment: 'production'
  }
});

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-26T23:09:30-04:00 | coder@claude-sonnet-4 | Create comprehensive compliance types replacing 'any' in ComplianceDriftDetector | compliance-types.ts | OK | -- | 0.00 | 5b9d8e2 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: phase4-week10-type-elimination-004
- inputs: ["primitives.ts", "common.ts", "ComplianceDriftDetector.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"phase4-week10-implementation"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->