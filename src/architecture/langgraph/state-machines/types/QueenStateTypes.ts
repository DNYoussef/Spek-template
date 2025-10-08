/**
 * Queen State Types - Production-Ready FSM Definitions
 * NASA Rule 10 Compliant: Queen orchestration states and events
 * FSM-First: Complete enum-based state management
 * NO TODOs, NO placeholders, production-ready code
 * ASCII ONLY - no Unicode characters
 */

import type { Timestamp } from '../../../../types/brands';

/**
 * Queen FSM States Enumeration
 * Complete lifecycle states for Queen orchestrator
 */
export enum QueenState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  REGISTERING_PRINCESS = 'REGISTERING_PRINCESS',
  DEFINING_OBJECTIVE = 'DEFINING_OBJECTIVE',
  EXECUTING_OBJECTIVE = 'EXECUTING_OBJECTIVE',
  DELEGATING_TASK = 'DELEGATING_TASK',
  DELEGATING = 'DELEGATING',
  MONITORING = 'MONITORING',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR',
  SHUTDOWN = 'SHUTDOWN'
}

/**
 * Queen FSM Events Enumeration
 * Events that trigger Queen state transitions
 */
export enum QueenEvent {
  INITIALIZE = 'INITIALIZE',
  REGISTER_PRINCESS = 'REGISTER_PRINCESS',
  DEFINE_OBJECTIVE = 'DEFINE_OBJECTIVE',
  EXECUTE_OBJECTIVE = 'EXECUTE_OBJECTIVE',
  DELEGATE_TASK = 'DELEGATE_TASK',
  MONITOR_PROGRESS = 'MONITOR_PROGRESS',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  SHUTDOWN = 'SHUTDOWN'
}

/**
 * Queen FSM States Type Alias
 * Backward compatibility alias for QueenState enum
 */
export type QueenFSMStates = QueenState;

/**
 * Queen FSM Configuration Interface
 * Core configuration for Queen orchestrator initialization
 */
export interface QueenFSMConfig {
  readonly initialState: QueenState;
  readonly maxPrincesses: number;
  readonly maxConcurrentTasks: number;
  readonly timeout: number;
}

/**
 * Queen State Transition Record
 * Captures a single Queen state transition
 */
export interface QueenStateTransition {
  readonly from: QueenState;
  readonly to: QueenState;
  readonly event: QueenEvent;
  readonly timestamp: Timestamp;
  readonly princessId?: string;
  readonly taskId?: string;
}

/**
 * Princess Registration Data
 * Information required to register a Princess with Queen
 */
export interface PrincessRegistration {
  readonly princessId: string;
  readonly domain: string;
  readonly capabilities: readonly string[];
  readonly registeredAt: Timestamp;
}

/**
 * Queen Objective Definition
 * High-level objective managed by Queen
 */
export interface QueenObjective {
  readonly objectiveId: string;
  readonly description: string;
  readonly requiredCapabilities: readonly string[];
  readonly priority: number;
  readonly deadline: Timestamp;
}

/**
 * Queen Delegation Record
 * Records task delegation from Queen to Princess
 */
export interface QueenDelegation {
  readonly taskId: string;
  readonly princessId: string;
  readonly objective: string;
  readonly delegatedAt: Timestamp;
  readonly status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

/**
 * Validates Queen state is within defined enumeration
 * @param state - Queen state to validate
 * @returns True if valid
 */
export function isValidQueenState(state: QueenState): boolean {
  const validStates = Object.values(QueenState);
  if (!validStates.includes(state)) {
    throw new Error(`Invalid Queen state: ${state}`);
  }
  return validStates.includes(state);
}

/**
 * Validates Queen event is within defined enumeration
 * @param event - Queen event to validate
 * @returns True if valid
 */
export function isValidQueenEvent(event: QueenEvent): boolean {
  const validEvents = Object.values(QueenEvent);
  if (!validEvents.includes(event)) {
    throw new Error(`Invalid Queen event: ${event}`);
  }
  return validEvents.includes(event);
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-30T20:15:00 | base-template-generator@sonnet-4.5 | Create Queen state types | QueenStateTypes.ts | OK | Complete enum-based Queen FSM types | 0.00 | 7c9e3f2 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase4-4-queen-types-creation
 * - inputs: ["TS2305/TS2459 errors from QueenFacadeFacade.ts"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4.5","template":"NASA-Rule-10-FSM-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
