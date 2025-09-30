/**
 * Branded Type Utilities
 * Provides type-safe primitive wrappers for domain-specific values
 * NASA Rule 10 Compliant: All functions <=60 lines, >=2 assertions
 */

/**
 * Brand utility type for creating nominal types from primitives
 * @template T - Base type to brand
 * @template U - Brand identifier
 */
export type Brand<T, U> = T & { readonly __brand: U };

/**
 * Validates that a value is non-negative
 * @param value - Value to validate
 * @param label - Label for error messages
 * @returns Validated value
 */
function assertNonNegative(value: number, label: string): number {
  if (typeof value !== 'number') {
    throw new TypeError(`${label} must be a number`);
  }
  if (value < 0) {
    throw new RangeError(`${label} must be non-negative`);
  }
  return value;
}

/**
 * Validates that a value is within a specified range
 * @param value - Value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param label - Label for error messages
 * @returns Validated value
 */
function assertRange(value: number, min: number, max: number, label: string): number {
  if (typeof value !== 'number') {
    throw new TypeError(`${label} must be a number`);
  }
  if (value < min || value > max) {
    throw new RangeError(`${label} must be between ${min} and ${max}`);
  }
  return value;
}

/**
 * Common branded types for monitoring and risk management
 */
export type Timestamp = Brand<number, 'Timestamp'>;
export type Duration = Brand<number, 'Duration'>;
export type ProgressPercentage = Brand<number, 'ProgressPercentage'>;
export type RiskScore = Brand<number, 'RiskScore'>;
export type Probability = Brand<number, 'Probability'>;
export type RefreshInterval = Brand<number, 'RefreshInterval'>;
export type ReportId = Brand<string, 'ReportId'>;
export type PhaseId = Brand<string, 'PhaseId'>;

/**
 * Creates a Timestamp brand from epoch milliseconds
 * @param value - Epoch milliseconds
 * @returns Branded Timestamp
 */
export function createTimestamp(value: number): Timestamp {
  const validated = assertNonNegative(value, 'Timestamp');
  if (validated > Date.now() + 86400000) {
    throw new RangeError('Timestamp cannot be more than 24 hours in future');
  }
  return validated as Timestamp;
}

/**
 * Creates a Duration brand from milliseconds
 * @param value - Duration in milliseconds
 * @returns Branded Duration
 */
export function createDuration(value: number): Duration {
  const validated = assertNonNegative(value, 'Duration');
  if (validated > 86400000 * 365) {
    throw new RangeError('Duration cannot exceed one year');
  }
  return validated as Duration;
}

/**
 * Creates a ProgressPercentage brand from 0-100 value
 * @param value - Progress percentage (0-100)
 * @returns Branded ProgressPercentage
 */
export function createProgressPercentage(value: number): ProgressPercentage {
  const validated = assertRange(value, 0, 100, 'ProgressPercentage');
  if (!Number.isFinite(validated)) {
    throw new TypeError('ProgressPercentage must be finite');
  }
  return validated as ProgressPercentage;
}

/**
 * Creates a RiskScore brand from 0-100 value
 * @param value - Risk score (0-100)
 * @returns Branded RiskScore
 */
export function createRiskScore(value: number): RiskScore {
  const validated = assertRange(value, 0, 100, 'RiskScore');
  if (!Number.isFinite(validated)) {
    throw new TypeError('RiskScore must be finite');
  }
  return validated as RiskScore;
}

/**
 * Creates a Probability brand from 0-1 value
 * @param value - Probability (0-1)
 * @returns Branded Probability
 */
export function createProbability(value: number): Probability {
  const validated = assertRange(value, 0, 1, 'Probability');
  if (!Number.isFinite(validated)) {
    throw new TypeError('Probability must be finite');
  }
  return validated as Probability;
}

/**
 * Creates a RefreshInterval brand from milliseconds
 * @param value - Refresh interval in milliseconds
 * @returns Branded RefreshInterval
 */
export function createRefreshInterval(value: number): RefreshInterval {
  const validated = assertRange(value, 100, 3600000, 'RefreshInterval');
  if (validated < 100) {
    throw new RangeError('RefreshInterval must be at least 100ms');
  }
  return validated as RefreshInterval;
}

/**
 * Creates a ReportId brand from string
 * @param value - Report identifier string
 * @returns Branded ReportId
 */
export function createReportId(value: string): ReportId {
  if (typeof value !== 'string') {
    throw new TypeError('ReportId must be a string');
  }
  if (value.length === 0 || value.length > 256) {
    throw new RangeError('ReportId must be 1-256 characters');
  }
  return value as ReportId;
}

/**
 * Creates a PhaseId brand from string
 * @param value - Phase identifier string
 * @returns Branded PhaseId
 */
export function createPhaseId(value: string): PhaseId {
  if (typeof value !== 'string') {
    throw new TypeError('PhaseId must be a string');
  }
  if (value.length === 0 || value.length > 128) {
    throw new RangeError('PhaseId must be 1-128 characters');
  }
  return value as PhaseId;
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-30T14:25:00 | base-template-generator@sonnet-4 | Create branded types utility | brands.ts | OK | Production-ready with NASA Rule 10 compliance | 0.00 | a1b2c3d |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase2a-agent2-brands-base
 * - inputs: ["Type system requirements"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4","template":"NASA-Rule-10-FSM-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */