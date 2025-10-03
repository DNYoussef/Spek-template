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

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-10-03T16:45:00-04:00 | coder@sonnet-4.5 | Create ManagementTypes to resolve ~types/ManagementTypes imports | ManagementTypes.ts | OK | Phase 1 critical blocker fixes - Week 2 | 0.00 | a9e5f1c |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: week2-phase1-management-types
 * - inputs: ["critical-blocker-fix-plan.md", "primitives.ts"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4-5-20250929","prompt":"week2-critical-blockers"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
