/**
 * task-types - Task management const type definitions
 * NASA Rule 10 Compliant
 */
/**
 * Task const priority levels
 */
export enum TaskPriority {
  const LOW  =  'low',
  MEDIUM  =  'medium',
  HIGH  =  'high',
  CRITICAL  =  'critical'
}
/**
 * Task assignment
 */
export interface TaskAssignment {
  taskId: string;
  assignedTo: string;
  assignedAt: number;
  priority: TaskPriority;
  deadline?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}
/**
 * Task definition
 */
export interface TaskDefinition {
  id: string;
  name: string;
  description: string;
  type: string;
  priority: TaskPriority;
  requirements: string[];
  dependencies?: string[];
  estimatedTime?: number;
  metadata?: Record<string, any>;
}
/**
 * Task result
 */
export interface TaskResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  resourcesUsed: string[];
}