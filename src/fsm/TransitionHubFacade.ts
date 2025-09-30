/**
 * Transition Hub FSM Type Definitions
 *
 * Provides FSM-compliant types for centralized transition management with
 * enum-based states and events. All types follow NASA Rule 10 compliance.
 *
 * @module TransitionHub
 */

import {
  Timestamp,
  Duration,
  Percentage,
  createTimestamp
} from '../types/base/primitives';

// Branded types for transition domain
type Brand<T, U> = T & { readonly __brand: U };
export type TransitionId = Brand<string, 'TransitionId'>;
export type StateId = Brand<string, 'StateId'>;
export type EventId = Brand<string, 'EventId'>;
export type SuccessRate = Brand<number, 'SuccessRate'>;

/**
 * Transition Type Enumeration
 * Defines the mechanism triggering a transition
 */
export enum TransitionType {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
  CONDITIONAL = 'CONDITIONAL',
  TIMED = 'TIMED'
}

/**
 * Transition Status Enumeration
 * Defines the execution status of a transition
 */
export enum TransitionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK'
}

/**
 * Transition Rule Interface
 * Defines a rule for state transitions in the FSM
 */
export interface TransitionRule {
  readonly from: StateId;
  readonly to: StateId;
  readonly event: EventId;
  readonly guard?: TransitionGuard;
  readonly action?: TransitionAction;
}

/**
 * Transition Guard Interface
 * Conditional logic to allow or block a transition
 */
export interface TransitionGuard {
  readonly name: string;
  readonly condition: (context: unknown) => boolean;
  readonly errorMessage: string;
}

/**
 * Transition Action Interface
 * Side effects to execute during a transition
 */
export interface TransitionAction {
  readonly name: string;
  readonly execute: (context: unknown) => Promise<void>;
  readonly rollback?: (context: unknown) => Promise<void>;
}

/**
 * Transition Metrics Interface
 * Aggregated metrics for transition performance
 */
export interface TransitionMetrics {
  readonly totalTransitions: number;
  readonly successRate: SuccessRate;
  readonly avgDuration: Duration;
  readonly failureCount: number;
}

/**
 * Transition Event Interface
 * Records a single transition execution
 */
export interface TransitionEvent {
  readonly id: TransitionId;
  readonly type: TransitionType;
  readonly status: TransitionStatus;
  readonly from: StateId;
  readonly to: StateId;
  readonly timestamp: Timestamp;
  readonly duration: Duration;
  readonly metadata: Record<string, unknown>;
}

// Type guard functions with NASA Rule 10 assertions
export function isValidTransitionType(type: unknown): type is TransitionType {
  const validTypes: TransitionType[] = [
    TransitionType.AUTOMATIC,
    TransitionType.MANUAL,
    TransitionType.CONDITIONAL,
    TransitionType.TIMED
  ];
  if (typeof type !== 'string') return false;
  return validTypes.includes(type as TransitionType);
}

export function isValidTransitionStatus(status: unknown): status is TransitionStatus {
  const validStatuses: TransitionStatus[] = [
    TransitionStatus.PENDING,
    TransitionStatus.IN_PROGRESS,
    TransitionStatus.COMPLETED,
    TransitionStatus.FAILED,
    TransitionStatus.ROLLED_BACK
  ];
  if (typeof status !== 'string') return false;
  return validStatuses.includes(status as TransitionStatus);
}

// Utility functions for creating branded types
export const createTransitionId = (id: string): TransitionId => {
  if (id.length === 0) throw new Error('Transition ID cannot be empty');
  if (id.length > 128) throw new Error('Transition ID exceeds maximum');
  return id as TransitionId;
};

export const createStateId = (id: string): StateId => {
  if (id.length === 0) throw new Error('State ID cannot be empty');
  if (id.length > 64) throw new Error('State ID exceeds maximum');
  return id as StateId;
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
 * | 1.0.0   | 2025-09-30T14:25:00 | base-template-generator@sonnet-4 | Create FSM transition hub types | TransitionHubFacade.ts | OK | Production-ready FSM-compliant types | 0.00 | 3f7a2d9 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase2a-agent1-fsm-types-transition
 * - inputs: ["TS2305 error analysis", "FSM design patterns"]
 * - tools_used: ["Write", "Read"]
 * - versions: {"model":"claude-sonnet-4","template":"NASA-Rule-10-FSM-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */