/**
 * Risk Assessment Type Definitions
 * Provides comprehensive risk assessment and mitigation types
 * NASA Rule 10 Compliant: All interfaces modular, FSM-based enums
 */

import type { Timestamp, Probability, RiskScore } from '../../types/brands';

/**
 * Risk assessment depth levels
 * FSM State: Defines assessment thoroughness levels
 */
export enum AssessmentLevel {
  PRELIMINARY = 'PRELIMINARY',
  STANDARD = 'STANDARD',
  COMPREHENSIVE = 'COMPREHENSIVE',
  CRITICAL = 'CRITICAL'
}

/**
 * Risk impact severity classifications
 * FSM State: Defines impact magnitude levels
 */
export enum RiskImpact {
  NEGLIGIBLE = 'NEGLIGIBLE',
  MINOR = 'MINOR',
  MODERATE = 'MODERATE',
  MAJOR = 'MAJOR',
  CATASTROPHIC = 'CATASTROPHIC'
}

/**
 * Mitigation strategy types
 * FSM State: Defines risk response strategies
 */
export enum MitigationStrategy {
  ACCEPT = 'ACCEPT',
  AVOID = 'AVOID',
  MITIGATE = 'MITIGATE',
  TRANSFER = 'TRANSFER'
}

/**
 * Mitigation plan status
 * FSM State: Defines mitigation execution states
 */
export enum MitigationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  IMPLEMENTED = 'IMPLEMENTED',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED'
}

/**
 * Risk assessment data structure
 */
export interface RiskAssessment {
  readonly id: string;
  readonly level: AssessmentLevel;
  readonly impact: RiskImpact;
  readonly probability: Probability;
  readonly score: RiskScore;
  readonly mitigation: MitigationPlan;
  readonly timestamp: Timestamp;
}

/**
 * Risk mitigation plan
 */
export interface MitigationPlan {
  readonly strategy: MitigationStrategy;
  readonly steps: ReadonlyArray<MitigationStep>;
  readonly timeline: Timeline;
  readonly responsible: string;
  readonly status: MitigationStatus;
  readonly cost: number;
}

/**
 * Individual mitigation step
 */
export interface MitigationStep {
  readonly id: string;
  readonly description: string;
  readonly priority: number;
  readonly dependencies: ReadonlyArray<string>;
  readonly completed: boolean;
  readonly timestamp: Timestamp;
}

/**
 * Timeline specification
 */
export interface Timeline {
  readonly startDate: Timestamp;
  readonly endDate: Timestamp;
  readonly milestones: ReadonlyArray<Milestone>;
  readonly criticalPath: ReadonlyArray<string>;
}

/**
 * Milestone definition
 */
export interface Milestone {
  readonly id: string;
  readonly name: string;
  readonly date: Timestamp;
  readonly completed: boolean;
  readonly dependencies: ReadonlyArray<string>;
}

/**
 * Risk assessment criteria
 */
export interface AssessmentCriteria {
  readonly scope: ReadonlyArray<string>;
  readonly thresholds: RiskThresholds;
  readonly methodology: string;
  readonly complianceStandards: ReadonlyArray<string>;
}

/**
 * Risk threshold definitions
 */
export interface RiskThresholds {
  readonly acceptable: RiskScore;
  readonly warning: RiskScore;
  readonly critical: RiskScore;
  readonly catastrophic: RiskScore;
}

/**
 * Risk assessment result
 */
export interface AssessmentResult {
  readonly assessment: RiskAssessment;
  readonly findings: ReadonlyArray<Finding>;
  readonly recommendations: ReadonlyArray<string>;
  readonly nextReviewDate: Timestamp;
}

/**
 * Individual assessment finding
 */
export interface Finding {
  readonly severity: RiskImpact;
  readonly category: string;
  readonly description: string;
  readonly evidence: ReadonlyArray<string>;
  readonly timestamp: Timestamp;
}

/**
 * Risk monitoring data
 */
export interface RiskMonitoring {
  readonly assessmentId: string;
  readonly currentScore: RiskScore;
  readonly trend: string;
  readonly lastUpdate: Timestamp;
  readonly alerts: ReadonlyArray<string>;
}

/**
 * Validates assessment level is within defined bounds
 * @param level - Assessment level to validate
 * @returns True if valid
 */
export function isValidAssessmentLevel(level: AssessmentLevel): boolean {
  const validLevels = Object.values(AssessmentLevel);
  if (!validLevels.includes(level)) {
    throw new Error(`Invalid assessment level: ${level}`);
  }
  return validLevels.includes(level);
}

/**
 * Validates risk impact is within defined bounds
 * @param impact - Risk impact to validate
 * @returns True if valid
 */
export function isValidRiskImpact(impact: RiskImpact): boolean {
  const validImpacts = Object.values(RiskImpact);
  if (!validImpacts.includes(impact)) {
    throw new Error(`Invalid risk impact: ${impact}`);
  }
  return validImpacts.includes(impact);
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-30T14:36:00 | base-template-generator@sonnet-4 | Create risk assessment types | RiskAssessmentTypes.ts | OK | FSM-compliant with comprehensive risk modeling | 0.00 | q7r8s9t |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase2a-agent2-risk-assessment-types
 * - inputs: ["TS2305 errors for RiskAssessmentTypes"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4","template":"NASA-Rule-10-FSM-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */