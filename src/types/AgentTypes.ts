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
  readonly capabilityId?: string; // Unique capability identifier
  readonly proficiency?: number; // Agent proficiency level (0-1)
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
  readonly targetAgent?: UUID;
  readonly type: MessageType;
  readonly payload: unknown;
  readonly timestamp: Timestamp;
  readonly communication_type?: string;
  readonly sourceId?: string;
}

export enum MessageType {
  TASK_ASSIGNMENT = 'TASK_ASSIGNMENT',
  STATUS_UPDATE = 'STATUS_UPDATE',
  RESULT = 'RESULT',
  ERROR = 'ERROR',
  COORDINATION = 'COORDINATION'
}

// Additional exports for agent management
export interface AgentDefinition {
  readonly id: UUID;
  readonly agentId?: UUID; // Alias for id (backward compatibility)
  readonly name: string;
  readonly agentName?: string; // Alias for name (backward compatibility)
  readonly type: AgentType;
  readonly capabilities: readonly AgentCapability[];
  readonly configuration: Record<string, unknown>;
  readonly version: string;
  readonly workload?: number; // Current workload metric
  readonly responsibilities?: readonly string[]; // Agent responsibilities
  readonly maxConcurrentTasks?: number | { limit: number; threshold: number }; // Task concurrency limit
  readonly preferredTaskTypes?: readonly string[]; // Preferred task types for this agent
}

export interface AgentExecution {
  readonly id: UUID;
  readonly executionId: UUID;
  readonly agentId: UUID;
  readonly taskId: UUID;
  readonly startTime: Timestamp;
  readonly endTime?: Timestamp;
  readonly status: 'running' | 'completed' | 'failed' | 'cancelled';
  readonly result?: unknown;
  readonly error?: string;
  readonly timestamp?: Timestamp;
  readonly currentTask?: string;
  readonly monitoring?: unknown;
  readonly assignedTasks?: readonly UUID[]; // Tasks assigned to this execution
  readonly taskQueue?: readonly UUID[]; // Pending tasks queue
  readonly completedTasks?: readonly UUID[]; // Completed tasks list
  readonly failedTasks?: readonly UUID[]; // Failed tasks list
  readonly resources?: ResourceUtilization; // Resource utilization tracking
  readonly performance?: AgentPerformance; // Performance metrics
  readonly communication?: {
    messagesSent: number;
    messagesReceived: number;
    lastCommunication?: Timestamp;
    messagesPending?: number;
  }; // Communication tracking
  logs?: AgentLog[]; // Not readonly - needs mutation (push operations)
}

export interface AgentPerformance {
  readonly agentId: UUID;
  readonly tasksCompleted: number;
  readonly successRate: number;
  readonly averageDuration: number;
  readonly resourceUsage: ResourceUtilization;
  readonly lastUpdated: Timestamp;
  readonly tasksFailed?: number; // Failed task count
  readonly efficiency?: number; // Task efficiency metric (0-1)
  readonly reliability?: number; // Agent reliability score (0-1)
  readonly throughput?: number; // Tasks per unit time
}

export interface ResourceUtilization {
  readonly cpu: number; // 0-100
  readonly memory: number; // bytes
  readonly network: number; // bytes/sec
  readonly storage: number; // bytes
  readonly cpuUsage?: number; // Percentage-based CPU usage
  readonly memoryUsage?: number; // Memory usage in bytes
  readonly storageUsage?: number; // Storage usage in bytes
  readonly networkUsage?: number; // Network usage in bytes/sec
  readonly toolsInUse?: number; // Number of active tools
  readonly costs?: number; // Resource costs
}

export interface AgentLog {
  readonly timestamp: Timestamp;
  readonly agentId: UUID;
  readonly level: 'debug' | 'info' | 'warn' | 'error';
  readonly message: string;
  readonly context: Record<string, unknown>;
}

export interface WorkflowExecution {
  readonly id: UUID;
  readonly executionId?: UUID; // Alias for id (backward compatibility)
  readonly agents: readonly UUID[];
  readonly startTime: Timestamp;
  readonly endTime?: Timestamp;
  readonly status: 'pending' | 'running' | 'completed' | 'failed';
  readonly progress: number; // 0-100
  readonly tasks?: readonly UUID[]; // Tasks in this workflow execution
}

export enum CommunicationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT'
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
