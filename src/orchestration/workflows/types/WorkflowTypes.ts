/**
 * Workflow Orchestration Types
 * Type definitions for workflow execution and state management
 * NASA Rule 10 Compliant
 */

import { WorkflowState } from './WorkflowStates';
import { WorkflowEvent } from './WorkflowEvents';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  metadata?: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'task' | 'decision' | 'parallel' | 'sequential';
  action: string;
  inputs?: Record<string, any>;
  outputs?: string[];
  timeout?: number;
  retries?: number;
  dependencies?: string[];
}

export interface WorkflowData {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  context: Record<string, any>;
  stepData: Map<string, any>;
}

export interface WorkflowContext {
  workflowId: string;
  executionId: string;
  state: WorkflowState;
  data: WorkflowData;
  currentStep?: string;
  startTime: Date;
  endTime?: Date;
  error?: Error;
}

export interface WorkflowTransition {
  from: WorkflowState;
  to: WorkflowState;
  event: WorkflowEvent;
  timestamp: Date;
  data?: any;
}

export interface WorkflowMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  currentlyRunning: number;
}

// === AGENT FOOTER ===
// Version: 1.0.0 (Phase 2.1 workflow types)
// === END FOOTER ===
