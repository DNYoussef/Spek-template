/**
 * Validation FSM State Type Definitions
 *
 * Provides FSM-compliant types for validation state management with
 * enum-based states and events. All types follow NASA Rule 10 compliance.
 *
 * @module ValidationStates
 */

import {
  Timestamp,
  Duration,
  Score,
  createTimestamp
} from '../../types/base/primitives';

// Branded types for validation domain
type Brand<T, U> = T & { readonly __brand: U };
export type ValidationScore = Brand<number, 'ValidationScore'>;
export type CheckCount = Brand<number, 'CheckCount'>;
export type ErrorCount = Brand<number, 'ErrorCount'>;
export type WarningCount = Brand<number, 'WarningCount'>;

/**
 * FSM State Enumeration for Validation
 * Defines all possible states in the validation lifecycle
 */
export enum ValidationState {
  PENDING = 'PENDING',
  VALIDATING = 'VALIDATING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED'
}

/**
 * FSM Event Enumeration for Validation
 * Defines all possible events that trigger state transitions
 */
export enum ValidationEvent {
  START = 'START',
  COMPLETE = 'COMPLETE',
  FAIL = 'FAIL',
  SKIP = 'SKIP',
  RETRY = 'RETRY'
}

/**
 * Validation Result Interface
 * Complete result of a validation operation
 */
export interface ValidationResult {
  readonly state: ValidationState;
  readonly score: ValidationScore;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
  readonly timestamp: Timestamp;
}

/**
 * Validation Error Interface
 * Individual error from validation
 */
export interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  readonly location: string;
}

/**
 * Validation Warning Interface
 * Individual warning from validation
 */
export interface ValidationWarning {
  readonly code: string;
  readonly message: string;
  readonly location: string;
}

/**
 * Validation Metrics Interface
 * Aggregated metrics for validation performance
 */
export interface ValidationMetrics {
  readonly totalChecks: CheckCount;
  readonly passed: CheckCount;
  readonly failed: CheckCount;
  readonly duration: Duration;
}

// Type guard functions with NASA Rule 10 assertions
export function isValidValidationState(state: unknown): state is ValidationState {
  const validStates: ValidationState[] = [
    ValidationState.PENDING,
    ValidationState.VALIDATING,
    ValidationState.PASSED,
    ValidationState.FAILED,
    ValidationState.SKIPPED
  ];
  if (typeof state !== 'string') return false;
  return validStates.includes(state as ValidationState);
}

export function isValidValidationEvent(event: unknown): event is ValidationEvent {
  const validEvents: ValidationEvent[] = [
    ValidationEvent.START,
    ValidationEvent.COMPLETE,
    ValidationEvent.FAIL,
    ValidationEvent.SKIP,
    ValidationEvent.RETRY
  ];
  if (typeof event !== 'string') return false;
  return validEvents.includes(event as ValidationEvent);
}

// Utility functions for creating branded types
export const createValidationScore = (score: number): ValidationScore => {
  if (score < 0 || score > 100) throw new Error('Score must be 0-100');
  if (isNaN(score)) throw new Error('Score must be a number');
  return score as ValidationScore;
};

export const createCheckCount = (count: number): CheckCount => {
  if (count < 0) throw new Error('Check count must be non-negative');
  if (isNaN(count)) throw new Error('Check count must be a number');
  return count as CheckCount;
};

export const createErrorCount = (count: number): ErrorCount => {
  if (count < 0) throw new Error('Error count must be non-negative');
  if (isNaN(count)) throw new Error('Error count must be a number');
  return count as ErrorCount;
};

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-30T14:25:00 | base-template-generator@sonnet-4 | Create FSM validation state types | ValidationStates.ts | OK | Production-ready FSM-compliant types | 0.00 | 5b8e4f2 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase2a-agent1-fsm-types-validation
 * - inputs: ["TS2305 error analysis", "FSM design patterns"]
 * - tools_used: ["Write", "Read"]
 * - versions: {"model":"claude-sonnet-4","template":"NASA-Rule-10-FSM-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */