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
  resources?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  result?: any;
  error?: Error;
  duration?: number;
  metrics?: Record<string, any>;
}