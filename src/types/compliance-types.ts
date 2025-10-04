/**
 * compliance-types - Production-Ready Compliance Type Definitions
 * NASA Rule 10 Compliant: Type definitions for compliance monitoring
 * FSM-First: Enum-based states and severities
 */

import { ComplianceRuleId, Timestamp, FilePath, Percentage, Score } from './base/primitives';

/**
 * Compliance Severity Enumeration
 */
export enum ComplianceSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Alert Level Enumeration
 */
export enum AlertLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * Drift Trend Enumeration
 */
export enum DriftTrend {
  STABLE = 'STABLE',
  INCREASING = 'INCREASING',
  DECREASING = 'DECREASING',
  VOLATILE = 'VOLATILE'
}

/**
 * Compliance Standard Interface
 */
export interface ComplianceStandard {
  id: string;
  name: string;
  version: string;
  description: string;
  rules: ComplianceRuleId[];
  severity: ComplianceSeverity;
  category: string;
  applicableRegions: string[];
  effectiveDate: Timestamp;
  metadata?: Record<string, any>;
}

/**
 * Rule Details Interface
 */
export interface RuleDetails {
  ruleId: ComplianceRuleId;
  name: string;
  description: string;
  severity: ComplianceSeverity;
  category: string;
  standard: string;
  checkFunction: string;
  remediationSteps: string[];
  references: string[];
  metadata?: Record<string, any>;
}

/**
 * Compliance Rule Violation Interface
 */
export interface ComplianceRuleViolation {
  ruleId: ComplianceRuleId;
  severity: ComplianceSeverity;
  message: string;
  filePath: FilePath;
  lineNumber?: number;
  columnNumber?: number;
  detectedAt: Timestamp;
  context: Record<string, any>;
  suggestedFix?: string;
}

/**
 * Compliance Evidence Interface
 */
export interface ComplianceEvidence {
  type: 'log' | 'screenshot' | 'document' | 'metric' | 'attestation';
  source: string;
  timestamp: Timestamp;
  data: any;
  hash: string;
  metadata?: Record<string, any>;
}

/**
 * Tool Info Interface
 */
export interface ToolInfo {
  name: string;
  version: string;
  vendor: string;
  configuration: Record<string, any>;
}

/**
 * Scan Metadata Interface
 */
export interface ScanMetadata {
  scanId: string;
  initiatedBy: string;
  startTime: Timestamp;
  endTime: Timestamp;
  duration: number;
  toolsUsed: ToolInfo[];
}

/**
 * Compliance Scan Result Interface
 */
export interface ComplianceScanResult {
  scanId: string;
  standard: string;
  timestamp: Timestamp;
  overallScore: Score;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  violations: ComplianceRuleViolation[];
  evidence: ComplianceEvidence[];
  metadata: ScanMetadata;
}

/**
 * Baseline Metadata Interface
 */
export interface BaselineMetadata {
  createdBy: string;
  createdAt: Timestamp;
  approvedBy?: string;
  approvedAt?: Timestamp;
  version: string;
  description: string;
}

/**
 * Baseline Evidence Interface
 */
export interface BaselineEvidence {
  scanResults: ComplianceScanResult[];
  documentation: string[];
  attestations: Record<string, any>[];
  artifacts: string[];
}

/**
 * Compliance Baseline Interface
 */
export interface ComplianceBaseline {
  id: string;
  standard: string;
  version: string;
  score: Score;
  overallScore: number;
  establishedAt: Timestamp;
  configuration: Record<string, any>;
  evidence: BaselineEvidence;
  metadata: BaselineMetadata;
  ruleScores?: Record<string, number>;
  validUntil?: Timestamp;
  timestamp?: Timestamp;
}

/**
 * Drift Metadata Interface
 */
export interface DriftMetadata {
  detectedBy: string;
  detectionMethod: string;
  confidence: Percentage;
  impactAssessment: string;
}

/**
 * Compliance Drift Interface
 */
export interface ComplianceDrift {
  id: string;
  baselineId: string;
  detectedAt: Timestamp;
  severity: ComplianceSeverity;
  affectedRules: ComplianceRuleId[];
  scoreChange: number;
  trend: DriftTrend;
  rootCause?: string;
  metadata: DriftMetadata;
  standard?: string;
  driftPercentage?: number;
  timeToViolation?: number;
}

/**
 * Alert Recipient Interface
 */
export interface AlertRecipient {
  type: 'email' | 'slack' | 'pagerduty' | 'webhook';
  target: string;
  escalationLevel: number;
  address: string;
}

/**
 * Alert Metadata Interface
 */
export interface AlertMetadata {
  alertId: string;
  triggeredBy: string;
  notificationsSent: number;
  acknowledgedBy?: string;
  acknowledgedAt?: Timestamp;
  resolvedBy?: string;
  resolvedAt?: Timestamp;
}

/**
 * Drift Alert Interface
 */
export interface DriftAlert {
  id: string;
  driftId: string;
  level: AlertLevel;
  message: string;
  createdAt: Timestamp;
  recipients: AlertRecipient[];
  isActive: boolean;
  metadata: AlertMetadata;
  alertLevel?: AlertLevel;
  escalationRequired?: boolean;
  suppressUntil?: Timestamp;
}

/**
 * Documentation Reference Interface
 */
export interface DocumentationReference {
  title: string;
  url: string;
  section?: string;
  version?: string;
}

/**
 * Fix Action Interface
 */
export interface FixAction {
  step: number;
  action: string;
  command?: string;
  estimatedTime: number;
  automatable: boolean;
  documentation?: DocumentationReference[];
}

/**
 * Impact Assessment Interface
 */
export interface ImpactAssessment {
  severity: ComplianceSeverity;
  affectedSystems: string[];
  estimatedDowntime: number;
  rollbackPossible: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  mitigationSteps: string[];
}

/**
 * Remediation Plan Interface
 */
export interface RemediationPlan {
  driftId: string;
  createdAt: Timestamp;
  createdBy: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCompletion: Timestamp;
  actions: FixAction[];
  impactAssessment: ImpactAssessment;
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: Timestamp;
}

/**
 * Rollback Snapshot Interface
 */
export interface RollbackSnapshot {
  id: string;
  timestamp: Timestamp;
  baseline: ComplianceBaseline;
  configuration: Record<string, any>;
  state: Record<string, any>;
  metadata: {
    createdBy: string;
    reason: string;
    verified: boolean;
    verifiedAt?: Timestamp;
    verifiedBy?: string;
  };
}

/**
 * Legacy Types for Backward Compatibility
 */
export interface ComplianceTypesConfig {
  standards: ComplianceStandard[];
  rules: RuleDetails[];
  metadata: Record<string, any>;
}

export interface ComplianceTypesState {
  currentBaseline?: ComplianceBaseline;
  activeDrifts: ComplianceDrift[];
  activeAlerts: DriftAlert[];
  lastScan?: ComplianceScanResult;
}

export interface ComplianceTypesResult {
  success: boolean;
  data?: any;
  error?: string;
}

export enum ComplianceTypesStatus {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export type ComplianceTypesType = ComplianceScanResult | ComplianceBaseline | ComplianceDrift;