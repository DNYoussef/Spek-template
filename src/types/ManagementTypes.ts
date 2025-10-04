/**
 * Management Types for System Management Operations
 * Common types for resource, execution, and lifecycle management
 */

import { UUID, Timestamp } from './base/primitives';

// Resource Management
export interface ResourceAllocation {
  readonly id: UUID;
  readonly resourceType: string;
  readonly amount: number;
  readonly allocated: number;
  readonly available: number;
  readonly timestamp: Timestamp;
}

export interface ResourceRequirement {
  readonly resourceType: string;
  readonly minimum: number;
  readonly preferred: number;
  readonly maximum: number;
}

// Execution Management
export interface ExecutionPlan {
  readonly id: UUID;
  readonly name: string;
  readonly steps: ExecutionStep[];
  readonly dependencies: ExecutionDependency[];
  readonly estimatedDuration: number;
}

export interface ExecutionStep {
  readonly id: UUID;
  readonly name: string;
  readonly action: string;
  readonly parameters: Record<string, unknown>;
  readonly timeout: number;
  readonly retryPolicy?: RetryPolicy;
}

export interface ExecutionDependency {
  readonly stepId: UUID;
  readonly dependsOn: UUID[];
  readonly type: 'required' | 'optional';
}

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly backoffMs: number;
  readonly backoffMultiplier: number;
}

// Lifecycle Management
export interface LifecyclePhase {
  readonly name: string;
  readonly order: number;
  readonly actions: LifecycleAction[];
}

export interface LifecycleAction {
  readonly name: string;
  readonly execute: () => Promise<void>;
  readonly rollback?: () => Promise<void>;
}

export interface LifecycleState {
  readonly currentPhase: string;
  readonly completedPhases: string[];
  readonly failedPhases: string[];
  readonly timestamp: Timestamp;
}

// Component Info Types (for FSM components)
export interface DependencyInfo {
  readonly dependencyId: UUID;
  readonly type: string;
  readonly version: string;
  readonly status: 'resolved' | 'pending' | 'failed';
  readonly resolvedAt?: Timestamp;
  readonly dependsOn?: readonly UUID[]; // Dependencies this item depends on
  readonly requiredBy?: readonly UUID[]; // Dependencies that require this item
  readonly resolution?: {
    strategy: 'immediate' | 'deferred' | 'lazy';
    version: string;
    source: string;
  }; // Resolution strategy information
}

export interface LifecycleInfo {
  readonly phase: string;
  readonly state: LifecycleState;
  readonly actions: readonly LifecycleAction[];
  readonly duration: number;
  readonly status?: 'initializing' | 'running' | 'paused' | 'completed' | 'failed'; // Lifecycle execution status
  readonly startTime?: Timestamp; // When lifecycle started
  readonly endTime?: Timestamp; // When lifecycle ended
}

export interface ResourceInfo {
  readonly id?: UUID; // Alias for resourceId (backward compatibility)
  readonly resourceId: UUID;
  readonly allocation: ResourceAllocation;
  readonly utilization: number;
  readonly status: 'available' | 'allocated' | 'exhausted';
  readonly available?: number; // Available resource amount
  readonly allocated?: number; // Allocated resource amount
  readonly capacity?: number; // Total resource capacity
}

export interface CoordinationInfo {
  readonly coordinatorId: UUID;
  readonly participants: readonly UUID[];
  readonly status: 'coordinating' | 'synchronized' | 'conflicted';
  readonly lastSyncTime: Timestamp;
  readonly currentState?: string; // Current coordination state
  readonly targetState?: string; // Target coordination state
  readonly transitionTime?: Timestamp; // When last state transition occurred
  readonly dependencies?: readonly UUID[]; // Coordination dependencies
}

export interface TaskInfo {
  readonly taskId: UUID;
  readonly name: string;
  readonly type?: string; // Task type identifier
  readonly status: 'pending' | 'running' | 'completed' | 'failed';
  readonly state?: 'queued' | 'active' | 'paused' | 'cancelled' | 'done'; // Detailed task state
  readonly priority?: number; // Task priority (0-10)
  readonly dependencies?: readonly UUID[]; // Task dependencies
  readonly startTime?: Timestamp;
  readonly endTime?: Timestamp;
  readonly result?: unknown;
}

// FSM State Management for Management domain
export enum ManagementState {
  INIT = 'INIT',
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  PLANNING = 'PLANNING',
  ALLOCATING = 'ALLOCATING',
  ALLOCATING_RESOURCES = 'ALLOCATING_RESOURCES',
  EXECUTING = 'EXECUTING',
  COORDINATING = 'COORDINATING',
  MONITORING = 'MONITORING',
  CLEANUP = 'CLEANUP',
  ERROR = 'ERROR',
  COMPLETED = 'COMPLETED'
}

export enum ManagementEvent {
  START = 'START',
  INITIALIZE = 'INITIALIZE',
  ALLOCATE = 'ALLOCATE',
  ALLOCATE_RESOURCES = 'ALLOCATE_RESOURCES',
  RESOURCES_ALLOCATED = 'RESOURCES_ALLOCATED',
  ALLOCATION_FAILED = 'ALLOCATION_FAILED',
  START_EXECUTION = 'START_EXECUTION',
  EXECUTION_COMPLETED = 'EXECUTION_COMPLETED',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  COORDINATE = 'COORDINATE',
  COORDINATION_COMPLETED = 'COORDINATION_COMPLETED',
  MONITOR = 'MONITOR',
  CLEANUP = 'CLEANUP',
  CLEANUP_REQUESTED = 'CLEANUP_REQUESTED',
  CLEANUP_COMPLETED = 'CLEANUP_COMPLETED',
  ERROR = 'ERROR',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RESET = 'RESET'
}

export interface ManagementContext {
  readonly managementId?: UUID;
  readonly managerId?: UUID; // Alias for managementId (backward compatibility)
  readonly resources?: readonly ResourceInfo[];
  readonly tasks?: readonly TaskInfo[];
  readonly activeTasks?: readonly UUID[]; // Currently active task IDs
  readonly dependencies?: readonly DependencyInfo[];
  readonly lifecycle?: LifecycleInfo;
  readonly coordination?: CoordinationInfo;
  readonly errors?: readonly string[];
  readonly startTime?: Timestamp;
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-10-03T16:45:00-04:00 | coder@sonnet-4.5 | Create ManagementTypes to resolve ~types/ManagementTypes imports | ManagementTypes.ts | OK | Phase 1 critical blocker fixes - Week 2 | 0.00 | a9e5f1c |
 * | 1.1.0   | 2025-10-04T00:15:00-04:00 | coder@sonnet-4.5 | Add component info types + FSM types (State, Event, Context) | ManagementTypes.ts | OK | Type Consolidation Phase 3 - TS2305 fixes | 0.00 | c2d7a4f |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: type-consolidation-phase3-management
 * - inputs: ["ManagementTypes.ts", "primitives.ts"]
 * - tools_used: ["Read", "Edit"]
 * - versions: {"model":"claude-sonnet-4-5-20250929","prompt":"type-consolidation-ts2305-phase3"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
