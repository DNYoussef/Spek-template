/**
 * Semantic Drift Detector FSM Type Definitions
 *
 * Provides FSM-compliant types for semantic drift detection with
 * enum-based states and events. All types follow NASA Rule 10 compliance.
 *
 * @module SemanticDriftDetectorFSM
 */

import {
  Timestamp,
  Percentage,
  createTimestamp
} from '../types/base/primitives';

// Branded types for drift detection domain
type Brand<T, U> = T & { readonly __brand: U };
export type ConfidenceScore = Brand<number, 'ConfidenceScore'>;
export type DriftMagnitude = Brand<number, 'DriftMagnitude'>;
export type EmbeddingVector = Brand<number[], 'EmbeddingVector'>;
export type ThresholdValue = Brand<number, 'ThresholdValue'>;

/**
 * Drift Pattern Enumeration
 * Defines observable patterns in semantic drift
 */
export enum DriftPattern {
  GRADUAL = 'GRADUAL',
  SUDDEN = 'SUDDEN',
  OSCILLATING = 'OSCILLATING',
  STABLE = 'STABLE'
}

/**
 * Drift Severity Enumeration
 * Defines severity levels for detected drift
 */
export enum DriftSeverity {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Context Snapshot Interface
 * Captures semantic context at a point in time
 */
export interface ContextSnapshot {
  readonly timestamp: Timestamp;
  readonly embeddings: EmbeddingVector;
  readonly metadata: Record<string, unknown>;
}

/**
 * Drift Metrics Interface
 * Quantitative metrics for detected drift
 */
export interface DriftMetrics {
  readonly pattern: DriftPattern;
  readonly severity: DriftSeverity;
  readonly magnitude: DriftMagnitude;
  readonly confidence: ConfidenceScore;
}

/**
 * Adaptive Threshold Interface
 * Dynamic threshold that adjusts based on observed patterns
 */
export interface AdaptiveThreshold {
  readonly baseline: ThresholdValue;
  readonly current: ThresholdValue;
  readonly tolerance: Percentage;
  readonly adjusted: boolean;
}

/**
 * Drift Detection Result Interface
 * Complete result of drift detection analysis
 */
export interface DriftDetectionResult {
  readonly detected: boolean;
  readonly metrics: DriftMetrics;
  readonly threshold: AdaptiveThreshold;
  readonly snapshots: readonly ContextSnapshot[];
  readonly timestamp: Timestamp;
}

// Type guard functions with NASA Rule 10 assertions
export function isValidDriftPattern(pattern: unknown): pattern is DriftPattern {
  const validPatterns: DriftPattern[] = [
    DriftPattern.GRADUAL,
    DriftPattern.SUDDEN,
    DriftPattern.OSCILLATING,
    DriftPattern.STABLE
  ];
  if (typeof pattern !== 'string') return false;
  return validPatterns.includes(pattern as DriftPattern);
}

export function isValidDriftSeverity(severity: unknown): severity is DriftSeverity {
  const validSeverities: DriftSeverity[] = [
    DriftSeverity.NONE,
    DriftSeverity.LOW,
    DriftSeverity.MEDIUM,
    DriftSeverity.HIGH,
    DriftSeverity.CRITICAL
  ];
  if (typeof severity !== 'string') return false;
  return validSeverities.includes(severity as DriftSeverity);
}

// Utility functions for creating branded types
export const createConfidenceScore = (score: number): ConfidenceScore => {
  if (score < 0 || score > 1) throw new Error('Confidence must be 0-1');
  if (isNaN(score)) throw new Error('Confidence must be a number');
  return score as ConfidenceScore;
};

export const createDriftMagnitude = (magnitude: number): DriftMagnitude => {
  if (magnitude < 0) throw new Error('Magnitude must be non-negative');
  if (isNaN(magnitude)) throw new Error('Magnitude must be a number');
  return magnitude as DriftMagnitude;
};

export const createEmbeddingVector = (vector: number[]): EmbeddingVector => {
  if (vector.length === 0) throw new Error('Vector cannot be empty');
  if (vector.some(isNaN)) throw new Error('Vector contains invalid values');
  return vector as EmbeddingVector;
};

export const createThresholdValue = (value: number): ThresholdValue => {
  if (value < 0 || value > 1) throw new Error('Threshold must be 0-1');
  if (isNaN(value)) throw new Error('Threshold must be a number');
  return value as ThresholdValue;
};

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-30T14:25:00 | base-template-generator@sonnet-4 | Create FSM drift detector types | SemanticDriftDetectorFSMFacade.ts | OK | Production-ready FSM-compliant types | 0.00 | 9d4b1c7 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase2a-agent1-fsm-types-drift
 * - inputs: ["TS2305 error analysis", "FSM design patterns"]
 * - tools_used: ["Write", "Read"]
 * - versions: {"model":"claude-sonnet-4","template":"NASA-Rule-10-FSM-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */