/**
 * Task Distribution State Machine
 * FSM-based task distribution architecture
 * NASA Rule 10 Compliant - Extracted from TaskDistributor.ts
 */

// FSM State and Event Enums
export enum TaskDistributionState {
  IDLE = 'IDLE',
  ANALYZING_TASK = 'ANALYZING_TASK',
  DECOMPOSING = 'DECOMPOSING',
  MECE_VALIDATION = 'MECE_VALIDATION',
  ASSIGNING = 'ASSIGNING',
  MONITORING = 'MONITORING',
  BALANCING = 'BALANCING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum TaskDistributionEvent {
  START_DISTRIBUTION = 'START_DISTRIBUTION',
  ANALYSIS_COMPLETE = 'ANALYSIS_COMPLETE',
  DECOMPOSITION_COMPLETE = 'DECOMPOSITION_COMPLETE',
  MECE_COMPLETE = 'MECE_COMPLETE',
  ASSIGNMENT_COMPLETE = 'ASSIGNMENT_COMPLETE',
  REBALANCE_NEEDED = 'REBALANCE_NEEDED',
  BALANCE_COMPLETE = 'BALANCE_COMPLETE',
  DISTRIBUTION_ERROR = 'DISTRIBUTION_ERROR',
  RESET = 'RESET'
}

export interface DistributionPlan {
  readonly planId: string;
  readonly originalTask: Task;
  readonly subtasks: SubTask[];
  readonly assignments: TaskAssignment[];
  readonly dependencies: TaskDependency[];
  readonly estimatedCompletion: number;
  readonly parallelizable: boolean;
}

export interface SubTask {
  readonly id: string;
  readonly parentTaskId: string;
  readonly description: string;
  readonly domain: string;
  readonly priority: TaskPriority;
  readonly estimatedDuration: number;
  readonly requiredCapabilities: string[];
  readonly dependencies: string[];
  readonly resources: TaskResources;
}

export interface TaskAssignment {
  readonly assignmentId: string;
  readonly taskId: string;
  readonly assignedTo: string;
  readonly assignedAt: number;
  readonly estimatedCompletion: number;
  readonly status: AssignmentStatus;
  readonly priority: number;
}

export enum AssignmentStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REASSIGNED = 'REASSIGNED'
}

export interface TaskDependency {
  readonly dependentTaskId: string;
  readonly prerequisiteTaskId: string;
  readonly dependencyType: DependencyType;
  readonly strict: boolean;
}

export enum DependencyType {
  DATA = 'DATA',
  SEQUENCE = 'SEQUENCE',
  RESOURCE = 'RESOURCE',
  CAPABILITY = 'CAPABILITY'
}

// Core distribution types
export interface Task {
  id: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  domain: string;
  capabilities: string[];
  resources: TaskResources;
  deadline?: Date;
  metadata?: TaskMetadata;
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  ANALYZING = 'ANALYZING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface TaskResources {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  apiCalls: number;
  specializedTools: string[];
}

export interface TaskMetadata {
  createdBy: string;
  createdAt: Date;
  estimatedDuration: number;
  actualDuration?: number;
  tags: string[];
  context: Record<string, any>;
}