/**
 * workflow.typesFacade - Production-Ready Workflow Type Definitions
 * NASA Rule 10 Compliant: Type definitions for workflow system
 * FSM-First: Enum-based states and events, no string literals
 */

/**
 * Workflow State Enumeration
 * NASA Rule 10: Fixed state vocabulary
 */
export enum WorkflowState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

/**
 * Workflow Event Enumeration
 * NASA Rule 10: Fixed event vocabulary
 */
export enum WorkflowEvent {
  START = 'START',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  COMPLETE = 'COMPLETE',
  FAIL = 'FAIL',
  CANCEL = 'CANCEL',
  RESET = 'RESET'
}

/**
 * Workflow Variable Definition
 */
export interface WorkflowVariableDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  defaultValue?: any;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

/**
 * Workflow State Definition
 */
export interface WorkflowStateDefinition {
  id: string;
  name: string;
  type: 'princess' | 'parallel' | 'conditional' | 'split' | 'merge';
  state: WorkflowState;
  isInitial: boolean;
  isFinal: boolean;
  transitions: string[]; // IDs of allowed transitions
  onEnter?: string; // Function name to execute on entry
  onExit?: string; // Function name to execute on exit
  metadata?: Record<string, any>;
}

/**
 * Workflow Transition Definition
 */
export interface WorkflowTransitionDefinition {
  id: string;
  event: WorkflowEvent;
  from: string; // State ID
  to: string; // State ID
  guard?: string; // Function name for transition guard
  action?: string; // Function name to execute on transition
  priority: number;
  metadata?: Record<string, any>;
}

/**
 * Workflow Definition
 * Complete workflow specification
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  description?: string;
  states: WorkflowStateDefinition[];
  transitions: WorkflowTransitionDefinition[];
  variables: WorkflowVariableDefinition[];
  initialState: string; // State ID
  finalStates: string[]; // State IDs
  metadata?: Record<string, any>;
  timeout?: number; // Milliseconds
  maxRetries?: number;
}

/**
 * Execution Context
 * Runtime context for workflow execution
 */
export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  currentState: string; // State ID
  status?: 'running' | 'completed' | 'failed' | 'cancelled';
  variables: Record<string, any>;
  startTime: number;
  lastTransition?: number;
  history: Array<{
    state: string;
    timestamp: number;
    event?: WorkflowEvent;
  }>;
  errors: Array<{
    message: string;
    timestamp: number;
    state: string;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Workflow Template
 * Reusable workflow template
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  workflowDefinition: WorkflowDefinition;
  parameters: WorkflowVariableDefinition[];
  tags: string[];
  author?: string;
  version: string;
  created: number;
  updated: number;
}

/**
 * Workflow Execution Metrics
 */
export interface WorkflowExecutionMetrics {
  executionId: string;
  workflowId: string;
  totalDuration: number;
  stateTransitions: number;
  failedTransitions: number;
  averageStateTime: number;
  stateTimeDistribution: Record<string, number>; // State ID -> time in ms
  stateExecutionTimes: Record<string, number>; // Alias for compatibility
  transitionTimes: Record<string, number>; // Transition duration tracking
  throughput: number; // Executions per second
  errorRate: number; // Percentage
  successRate: number; // Percentage
  resourceUtilization: {
    cpu: number; // Percentage
    memory: number; // Bytes
    io: number; // Operations per second
  };
}

/**
 * Workflow Optimization Suggestion
 */
export interface WorkflowOptimizationSuggestion {
  id: string;
  workflowId: string;
  type: 'parallelization' | 'reordering' | 'caching' | 'resource_optimization' | 'state_consolidation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'reliability' | 'maintainability' | 'security';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  effort: 'low' | 'medium' | 'high';
  estimatedImprovement: {
    metric: string;
    before: number;
    after: number;
    unit: string;
    performance?: number; // Performance improvement metric
    resource?: number; // Resource improvement metric
    cost?: number; // Cost improvement metric
  };
  implementationCost: 'low' | 'medium' | 'high';
  priority: number;
  timestamp: number;
}

/**
 * Workflow Validation Result
 */
export interface WorkflowValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
  metadata?: Record<string, any>;
}