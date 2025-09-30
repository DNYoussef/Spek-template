/**
 * Quality Gate Core Type Definitions
 *
 * Provides comprehensive quality gate types for multi-dimensional quality
 * validation. Implements FSM-based gate categories with threshold types
 * and trend analysis for continuous quality improvement.
 *
 * @module QualityGateTypes
 * @version 1.0.0
 */

/**
 * Branded type for ISO 8601 timestamps
 */
export type Timestamp = string & { readonly __brand: 'Timestamp' };

/**
 * Branded type for quality scores (0-100)
 */
export type QualityScore = number & { readonly __brand: 'QualityScore' };

/**
 * Branded type for trend values (-100 to +100)
 */
export type TrendValue = number & { readonly __brand: 'TrendValue' };

/**
 * Quality gate categories for comprehensive validation
 */
export enum GateCategory {
  SYNTAX = 'SYNTAX',
  SEMANTIC = 'SEMANTIC',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  COMPLIANCE = 'COMPLIANCE'
}

/**
 * Threshold evaluation strategies
 */
export enum ThresholdType {
  ABSOLUTE = 'ABSOLUTE',
  PERCENTAGE = 'PERCENTAGE',
  TREND = 'TREND',
  DELTA = 'DELTA'
}

/**
 * Gate severity levels
 */
export enum GateSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO'
}

/**
 * Gate metrics with trend analysis
 */
export interface GateMetrics {
  readonly category: GateCategory;
  readonly score: QualityScore;
  readonly threshold: number;
  readonly trend: TrendValue;
  readonly timestamp: Timestamp;
  readonly measurements: ReadonlyArray<number>;
  readonly violations: number;
}

/**
 * Quality gate configuration
 */
export interface GateConfig {
  readonly category: GateCategory;
  readonly enabled: boolean;
  readonly threshold: number;
  readonly thresholdType: ThresholdType;
  readonly weight: number;
  readonly blocking: boolean;
  readonly description: string;
  readonly severity: GateSeverity;
}

/**
 * Gate validation result
 */
export interface GateValidation {
  readonly category: GateCategory;
  readonly passed: boolean;
  readonly score: QualityScore;
  readonly threshold: number;
  readonly trend: TrendValue;
  readonly timestamp: Timestamp;
  readonly details: ReadonlyArray<ValidationDetail>;
}

/**
 * Individual validation detail
 */
export interface ValidationDetail {
  readonly rule: string;
  readonly passed: boolean;
  readonly severity: GateSeverity;
  readonly message: string;
  readonly location?: string;
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-30T14:25:00 | base-template-generator@sonnet-4 | Create quality gate types | QualityGateTypes.ts | OK | Production-ready FSM-compliant | 0.00 | d0f5j7h |
 *
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase2a-agent3-cicd-types
 * - inputs: ["TS2305 error analysis", "Quality validation patterns"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4","template":"NASA-Rule-10-FSM-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */