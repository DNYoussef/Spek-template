/**
 * Task type definitions for SPEK platform
 */

import { PrincessDomain } from '../hierarchy/types';

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface TaskResources {
  memory: number;           // MB required
  cpu: number;             // CPU cores needed
  network: boolean;        // Network access required
  storage: number;         // GB storage needed
  gpu?: boolean;           // GPU acceleration needed
  timeout: number;         // Max execution time (seconds)
}

export interface TaskMetadata {
  estimatedDuration: number;     // Minutes
  complexity: number;            // 1-100 scale
  tags: string[];               // Categorization tags
  author: string;               // Task creator
  version: string;              // Task definition version
  framework?: string;           // Target framework
  testRequired: boolean;        // Requires testing
  reviewRequired: boolean;      // Requires code review
}

export interface Task {
  id: string;
  name: string;
  description: string;
  domain: PrincessDomain;
  files?: string[];
  dependencies?: string[];
  estimatedLOC?: number;
  priority?: TaskPriority;
  status?: TaskStatus;
  type?: string;
  resources?: TaskResources;
  metadata?: TaskMetadata;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaskMetrics {
  executionTime: number;        // Milliseconds
  memoryUsage: number;         // MB peak usage
  cpuUsage: number;            // Average % utilization
  linesChanged: number;        // Lines of code modified
  filesModified: number;       // Number of files changed
  testsRun: number;           // Test cases executed
  testsPassed: number;        // Successful tests
  qualityScore: number;       // 0-100 quality assessment
  complexityReduction: number; // Complexity delta
}

export interface TaskResult<T = unknown> {
  taskId: string;
  status: TaskStatus;
  result?: T;
  error?: Error;
  duration?: number;
  metrics?: TaskMetrics;
}