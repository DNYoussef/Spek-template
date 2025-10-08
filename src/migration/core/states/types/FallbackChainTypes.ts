/**
 * Fallback Chain FSM Type Definitions
 *
 * Provides FSM-compliant types for fallback chain state management with
 * enum-based states and events. All types follow NASA Rule 10 compliance.
 *
 * @module FallbackChainTypes
 */

import {
  Timestamp,
  Duration,
  Timeout,
  Percentage,
  createTimestamp
} from '../../../../types/base/primitives';

// Branded types for fallback chain domain
type Brand<T, U> = T & { readonly __brand: U };
export type RetryCount = Brand<number, 'RetryCount'>;
export type FallbackDepth = Brand<number, 'FallbackDepth'>;
export type SuccessRate = Brand<number, 'SuccessRate'>;
export type TransitionId = Brand<string, 'TransitionId'>;

/**
 * FSM State Enumeration for Fallback Chain
 * Defines all possible states in the fallback chain lifecycle
 */
export enum FallbackState {
  IDLE = 'IDLE',
  EVALUATING = 'EVALUATING',
  FALLBACK_ACTIVE = 'FALLBACK_ACTIVE',
  RECOVERED = 'RECOVERED',
  FAILED = 'FAILED'
}

/**
 * FSM Event Enumeration for Fallback Chain
 * Defines all possible events that trigger state transitions
 */
export enum FallbackEvent {
  TRIGGER = 'TRIGGER',
  EVALUATE = 'EVALUATE',
  ACTIVATE = 'ACTIVATE',
  RECOVER = 'RECOVER',
  ABORT = 'ABORT'
}

/**
 * Fallback Strategy Enumeration
 * Defines execution strategies for fallback chains
 */
export enum FallbackStrategy {
  PRIMARY_ONLY = 'PRIMARY_ONLY',
  SEQUENTIAL = 'SEQUENTIAL',
  PARALLEL = 'PARALLEL',
  WEIGHTED = 'WEIGHTED'
}

/**
 * Fallback Configuration Interface
 * Configuration parameters for fallback chain behavior
 */
export interface FallbackConfig {
  readonly strategy: FallbackStrategy;
  readonly timeout: Timeout;
  readonly retries: RetryCount;
  readonly maxDepth: FallbackDepth;
}

/**
 * State Transition Interface
 * Records a single state transition in the fallback chain
 */
export interface StateTransition {
  readonly from: FallbackState;
  readonly to: FallbackState;
  readonly event: FallbackEvent;
  readonly timestamp: Timestamp;
  readonly metadata: Record<string, unknown>;
}

/**
 * Chain Metadata Interface
 * Aggregated metrics for fallback chain performance
 */
export interface ChainMetadata {
  readonly depth: FallbackDepth;
  readonly totalFallbacks: number;
  readonly successRate: SuccessRate;
  readonly lastUpdate: Timestamp;
}

// Type guard functions with NASA Rule 10 assertions
export function isValidFallbackState(state: unknown): state is FallbackState {
  const validStates: FallbackState[] = [
    FallbackState.IDLE,
    FallbackState.EVALUATING,
    FallbackState.FALLBACK_ACTIVE,
    FallbackState.RECOVERED,
    FallbackState.FAILED
  ];
  if (typeof state !== 'string') return false;
  return validStates.includes(state as FallbackState);
}

export function isValidFallbackEvent(event: unknown): event is FallbackEvent {
  const validEvents: FallbackEvent[] = [
    FallbackEvent.TRIGGER,
    FallbackEvent.EVALUATE,
    FallbackEvent.ACTIVATE,
    FallbackEvent.RECOVER,
    FallbackEvent.ABORT
  ];
  if (typeof event !== 'string') return false;
  return validEvents.includes(event as FallbackEvent);
}

// Utility functions for creating branded types
export const createRetryCount = (count: number): RetryCount => {
  if (count < 0) throw new Error('Retry count must be non-negative');
  if (count > 100) throw new Error('Retry count exceeds maximum');
  return count as RetryCount;
};

export const createFallbackDepth = (depth: number): FallbackDepth => {
  if (depth < 0) throw new Error('Fallback depth must be non-negative');
  if (depth > 10) throw new Error('Fallback depth exceeds maximum');
  return depth as FallbackDepth;
};

export const createSuccessRate = (rate: number): SuccessRate => {
  if (rate < 0 || rate > 1) throw new Error('Success rate must be 0-1');
  if (isNaN(rate)) throw new Error('Success rate must be a number');
  return rate as SuccessRate;
};

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-30T14:25:00 | base-template-generator@sonnet-4 | Create FSM fallback chain types | FallbackChainTypes.ts | OK | Production-ready FSM-compliant types | 0.00 | 8a4f2e1 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase2a-agent1-fsm-types-fallback
 * - inputs: ["TS2305 error analysis", "FSM design patterns"]
 * - tools_used: ["Write", "Read"]
 * - versions: {"model":"claude-sonnet-4","template":"NASA-Rule-10-FSM-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */