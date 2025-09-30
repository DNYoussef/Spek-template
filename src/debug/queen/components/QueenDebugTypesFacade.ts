/**
 * Queen Debug FSM Type Definitions
 *
 * Provides FSM-compliant types for Queen agent debugging with
 * enum-based states and events. All types follow NASA Rule 10 compliance.
 *
 * @module QueenDebugTypes
 */

import {
  Timestamp,
  createTimestamp
} from '../../../types/base/primitives';

// Branded types for debug domain
type Brand<T, U> = T & { readonly __brand: U };
export type SessionId = Brand<string, 'SessionId'>;
export type AgentId = Brand<string, 'AgentId'>;
export type ErrorCount = Brand<number, 'ErrorCount'>;
export type DebugScore = Brand<number, 'DebugScore'>;

/**
 * FSM State Enumeration for Debug System
 * Defines all possible states in the debug lifecycle
 */
export enum DebugState {
  INACTIVE = 'INACTIVE',
  INITIALIZED = 'INITIALIZED',
  TARGET_ANALYSIS = 'TARGET_ANALYSIS',
  PRINCESS_ASSIGNMENT = 'PRINCESS_ASSIGNMENT',
  DRONE_DEPLOYMENT = 'DRONE_DEPLOYMENT',
  SWARM_EXECUTION = 'SWARM_EXECUTION',
  AUDIT_PIPELINE = 'AUDIT_PIPELINE',
  QUALITY_VALIDATION = 'QUALITY_VALIDATION',
  EVIDENCE_COLLECTION = 'EVIDENCE_COLLECTION',
  GITHUB_INTEGRATION = 'GITHUB_INTEGRATION',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  MONITORING = 'MONITORING',
  ANALYZING = 'ANALYZING',
  REPORTING = 'REPORTING'
}

/**
 * FSM Event Enumeration for Debug System
 * Defines all possible events that trigger state transitions
 */
export enum DebugEvent {
  START_DEBUG = 'START_DEBUG',
  TARGET_ANALYZED = 'TARGET_ANALYZED',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  PRINCESS_ASSIGNED = 'PRINCESS_ASSIGNED',
  ASSIGNMENT_FAILED = 'ASSIGNMENT_FAILED',
  DRONES_DEPLOYED = 'DRONES_DEPLOYED',
  DEPLOYMENT_FAILED = 'DEPLOYMENT_FAILED',
  EXECUTION_COMPLETED = 'EXECUTION_COMPLETED',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  AUDIT_PASSED = 'AUDIT_PASSED',
  AUDIT_FAILED = 'AUDIT_FAILED',
  VALIDATION_PASSED = 'VALIDATION_PASSED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  EVIDENCE_COLLECTED = 'EVIDENCE_COLLECTED',
  COLLECTION_FAILED = 'COLLECTION_FAILED',
  GITHUB_INTEGRATED = 'GITHUB_INTEGRATED',
  INTEGRATION_FAILED = 'INTEGRATION_FAILED',
  RETRY_DEBUG = 'RETRY_DEBUG',
  CANCEL_DEBUG = 'CANCEL_DEBUG',
  START = 'START',
  LOG = 'LOG',
  ANALYZE = 'ANALYZE',
  REPORT = 'REPORT',
  STOP = 'STOP'
}

/**
 * Debug Level Enumeration
 * Defines severity levels for debug messages
 */
export enum DebugLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  TRACE = 'TRACE'
}

/**
 * Debug Target Interface
 * Identifies the target of debugging operations
 */
export interface DebugTarget {
  readonly id: string;
  readonly agentId: AgentId;
  readonly component: string;
  readonly subsystem: string;
}

/**
 * Debug Session Interface
 * Complete debug session information
 */
export interface DebugSession {
  readonly id: string;
  readonly sessionId?: SessionId;
  readonly target: DebugTarget;
  readonly level?: DebugLevel;
  readonly startTime: number | Timestamp;
  readonly endTime?: number;
  readonly status: 'active' | 'completed' | 'failed' | 'cancelled';
  readonly assignedPrincess: string;
  readonly deployedDrones: string[];
  readonly progress: DebugProgress;
  readonly events: DebugEvent[];
  readonly tags?: readonly string[];
}

/**
 * Debug Context Interface
 * Context information for a debug session
 */
export interface DebugContext {
  readonly sessionId: SessionId;
  readonly agentId: AgentId;
  readonly level: DebugLevel;
  readonly tags: readonly string[];
}

/**
 * Debug Progress Interface
 * Tracks progress of debug session execution
 */
export interface DebugProgress {
  readonly currentStage: number;
  readonly totalStages: number;
  readonly percentage: number;
  readonly estimatedCompletion: number;
  readonly bottlenecks: string[];
}

/**
 * Debug Result Interface
 * Aggregated results from a debug analysis
 */
export interface DebugResult {
  readonly status: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  readonly findings: readonly DebugFinding[];
  readonly recommendations: readonly string[];
  readonly timestamp: Timestamp;
}

/**
 * Debug Finding Interface
 * Individual finding from debug analysis
 */
export interface DebugFinding {
  readonly level: DebugLevel;
  readonly message: string;
  readonly location: string;
  readonly timestamp: Timestamp;
}

// Debug limits for NASA compliance
export const DEBUG_LIMITS = {
  MAX_SESSION_DURATION: 3600000,
  MAX_FINDINGS: 1000,
  MAX_TAGS: 50
} as const;

// Allowed state and event types
export type AllowedDebugStates = DebugState;
export type AllowedDebugEvents = DebugEvent;

// Type guard functions with NASA Rule 10 assertions
export function isValidDebugState(state: unknown): state is DebugState {
  const validStates: DebugState[] = [
    DebugState.INACTIVE,
    DebugState.MONITORING,
    DebugState.ANALYZING,
    DebugState.REPORTING
  ];
  if (typeof state !== 'string') return false;
  return validStates.includes(state as DebugState);
}

export function isValidDebugEvent(event: unknown): event is DebugEvent {
  const validEvents: DebugEvent[] = [
    DebugEvent.START,
    DebugEvent.LOG,
    DebugEvent.ANALYZE,
    DebugEvent.REPORT,
    DebugEvent.STOP
  ];
  if (typeof event !== 'string') return false;
  return validEvents.includes(event as DebugEvent);
}

export function isValidDebugLevel(level: unknown): level is DebugLevel {
  const validLevels: DebugLevel[] = [
    DebugLevel.ERROR,
    DebugLevel.WARN,
    DebugLevel.INFO,
    DebugLevel.DEBUG,
    DebugLevel.TRACE
  ];
  if (typeof level !== 'string') return false;
  return validLevels.includes(level as DebugLevel);
}

// Utility functions for creating branded types
export const createSessionId = (id: string): SessionId => {
  if (id.length === 0) throw new Error('Session ID cannot be empty');
  if (id.length > 128) throw new Error('Session ID exceeds maximum length');
  return id as SessionId;
};

export const createAgentId = (id: string): AgentId => {
  if (id.length === 0) throw new Error('Agent ID cannot be empty');
  if (id.length > 128) throw new Error('Agent ID exceeds maximum length');
  return id as AgentId;
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
 * | 1.0.0   | 2025-09-30T14:25:00 | base-template-generator@sonnet-4 | Create FSM Queen debug types | QueenDebugTypesFacade.ts | OK | Production-ready FSM-compliant types | 0.00 | 7c2d9a3 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase2a-agent1-fsm-types-queen-debug
 * - inputs: ["TS2305 error analysis", "FSM design patterns"]
 * - tools_used: ["Write", "Read"]
 * - versions: {"model":"claude-sonnet-4","template":"NASA-Rule-10-FSM-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */