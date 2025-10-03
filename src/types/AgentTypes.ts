/**
 * Agent Types for Multi-Agent System
 * Types for agent coordination, capabilities, and execution
 */

import { UUID, Timestamp } from './base/primitives';

// Agent Definition
export interface Agent {
  readonly id: UUID;
  readonly type: AgentType;
  readonly capabilities: AgentCapability[];
  readonly status: AgentStatus;
  readonly metadata: AgentMetadata;
}

export enum AgentType {
  RESEARCHER = 'RESEARCHER',
  CODER = 'CODER',
  ANALYST = 'ANALYST',
  OPTIMIZER = 'OPTIMIZER',
  COORDINATOR = 'COORDINATOR',
  TESTER = 'TESTER',
  REVIEWER = 'REVIEWER'
}

export enum AgentStatus {
  IDLE = 'IDLE',
  BUSY = 'BUSY',
  BLOCKED = 'BLOCKED',
  ERROR = 'ERROR',
  OFFLINE = 'OFFLINE'
}

export interface AgentCapability {
  readonly name: string;
  readonly version: string;
  readonly parameters: Record<string, unknown>;
}

export interface AgentMetadata {
  readonly created: Timestamp;
  readonly lastActive: Timestamp;
  readonly taskCount: number;
  readonly successRate: number;
}

// Agent Task Assignment
export interface AgentTask {
  readonly id: UUID;
  readonly agentId: UUID;
  readonly description: string;
  readonly priority: TaskPriority;
  readonly deadline?: Timestamp;
  readonly dependencies: UUID[];
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Agent Communication
export interface AgentMessage {
  readonly from: UUID;
  readonly to: UUID;
  readonly type: MessageType;
  readonly payload: unknown;
  readonly timestamp: Timestamp;
}

export enum MessageType {
  TASK_ASSIGNMENT = 'TASK_ASSIGNMENT',
  STATUS_UPDATE = 'STATUS_UPDATE',
  RESULT = 'RESULT',
  ERROR = 'ERROR',
  COORDINATION = 'COORDINATION'
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-10-03T16:50:00-04:00 | coder@sonnet-4.5 | Create AgentTypes to resolve ~types/AgentTypes imports | AgentTypes.ts | OK | Phase 1 critical blocker fixes - Week 2 | 0.00 | e6f8c3a |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: week2-phase1-agent-types
 * - inputs: ["critical-blocker-fix-plan.md", "primitives.ts"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4-5-20250929","prompt":"week2-critical-blockers"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
