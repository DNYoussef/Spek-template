/**
 * Workflow Types - Type definitions for LangGraph workflow system
 * Comprehensive type definitions for workflow management, execution,
 * and monitoring in the LangGraph Princess architecture.
 */

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  states: WorkflowStateDefinition[];
  transitions: WorkflowTransitionDefinition[];
  initialState: string;
  finalStates: string[];
  variables: WorkflowVariableDefinition[];
  context: ExecutionContext;
  metadata?: WorkflowMetadata;
}

export interface WorkflowStateDefinition {
  name: string;
  type: 'princess' | 'parallel' | 'conditional' | 'wait' | 'merge' | 'split';
  princess?: string;
  task?: any;
  parallel?: WorkflowStateDefinition[];
  condition?: string;
  onTrue?: WorkflowStateDefinition;
  onFalse?: WorkflowStateDefinition;
  duration?: number;
  next?: string | Record<string, string>;
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    baseDelay: number;
  };
}

export interface WorkflowTransitionDefinition {
  from: string;
  to: string;
  condition?: string;
  weight?: number;
  metadata?: {
    description?: string;
    probability?: number;
  };
}

export interface WorkflowVariableDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: any;
  required: boolean;
  validation?: string;
  description?: string;
}

export interface WorkflowMetadata {
  version: string;
  author: string;
  created: Date;
  modified: Date;
  tags: string[];
  category: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedDuration: number;
}

export interface ExecutionContext {
  workflowId?: string;
  sessionId?: string;
  userId?: string;
  environment?: 'development' | 'staging' | 'production';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    baseDelay: number;
  };
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface WorkflowExecution {
  id: string;
  definition: WorkflowDefinition;
  context: ExecutionContext;
  status: 'initializing' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  currentState: string;
  startTime: Date;
  endTime?: Date;
  error?: Error;
  stateHistory: StateExecutionRecord[];
  metrics?: WorkflowExecutionMetrics;
}

export interface StateExecutionRecord {
  state: string;
  timestamp: Date;
  duration: number;
  result: any;
  error?: Error;
  retryCount?: number;
  resourceUsage?: {
    cpu: number;
    memory: number;
    network: number;
  };
}

export interface WorkflowExecutionMetrics {
  totalDuration: number;
  stateExecutionTimes: Record<string, number>;
  transitionTimes: Record<string, number>;
  resourceUsage: {
    peak: {
      cpu: number;
      memory: number;
      network: number;
    };
    average: {
      cpu: number;
      memory: number;
      network: number;
    };
  };
  errorCount: number;
  retryCount: number;
  throughput: number;
  efficiency: number;
}

export interface WorkflowSchedule {
  id: string;
  workflowId: string;
  type: 'once' | 'recurring' | 'cron' | 'event-driven';
  schedule: {
    startTime?: Date;
    endTime?: Date;
    interval?: number;
    cronExpression?: string;
    eventTrigger?: string;
  };
  enabled: boolean;
  context: ExecutionContext;
  metadata: {
    created: Date;
    lastRun?: Date;
    nextRun?: Date;
    runCount: number;
    successCount: number;
    failureCount: number;
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  definition: WorkflowDefinition;
  parameters: WorkflowTemplateParameter[];
  examples: WorkflowTemplateExample[];
  metadata: {
    version: string;
    author: string;
    created: Date;
    modified: Date;
    tags: string[];
    popularity: number;
    rating: number;
    usageCount: number;
  };
}

export interface WorkflowTemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  label: string;
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: Array<{ value: any; label: string }>;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}

export interface WorkflowTemplateExample {
  name: string;
  description: string;
  parameters: Record<string, any>;
  expectedOutcome: string;
}

export interface WorkflowEvent {
  id: string;
  workflowId: string;
  type: 'started' | 'completed' | 'failed' | 'paused' | 'resumed' | 'cancelled' | 'state_changed' | 'error';
  timestamp: Date;
  data: any;
  source: 'system' | 'user' | 'external';
  metadata?: Record<string, any>;
}

export interface WorkflowConfiguration {
  maxConcurrentWorkflows: number;
  defaultTimeout: number;
  defaultRetryPolicy: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    baseDelay: number;
  };
  resourceLimits: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
  monitoring: {
    metricsEnabled: boolean;
    loggingLevel: 'debug' | 'info' | 'warn' | 'error';
    alerting: {
      enabled: boolean;
      thresholds: {
        errorRate: number;
        executionTime: number;
        resourceUsage: number;
      };
    };
  };
  persistence: {
    enabled: boolean;
    storageLocation: string;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
  };
}

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: WorkflowValidationError[];
  warnings: WorkflowValidationWarning[];
  suggestions: WorkflowOptimizationSuggestion[];
}

export interface WorkflowValidationError {
  type: 'structure' | 'reference' | 'logic' | 'resource' | 'security';
  message: string;
  location: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface WorkflowValidationWarning {
  type: 'performance' | 'best_practice' | 'compatibility' | 'resource';
  message: string;
  location: string;
  recommendation: string;
}

export interface WorkflowOptimizationSuggestion {
  type: 'parallelization' | 'caching' | 'resource_optimization' | 'state_reduction';
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  estimatedImprovement: {
    performance: number; // percentage
    resource: number; // percentage
    cost: number; // percentage
  };
}

export interface WorkflowAnalytics {
  workflowId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  executionStatistics: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    minExecutionTime: number;
    maxExecutionTime: number;
    percentiles: {
      p50: number;
      p90: number;
      p95: number;
      p99: number;
    };
  };
  stateStatistics: Record<string, {
    executionCount: number;
    averageExecutionTime: number;
    errorRate: number;
    skipRate: number;
  }>;
  resourceStatistics: {
    averageResourceUsage: {
      cpu: number;
      memory: number;
      network: number;
    };
    peakResourceUsage: {
      cpu: number;
      memory: number;
      network: number;
    };
  };
  errorAnalysis: {
    mostCommonErrors: Array<{
      error: string;
      count: number;
      percentage: number;
    }>;
    errorsByState: Record<string, Array<{
      error: string;
      count: number;
    }>>;
  };
  trends: {
    executionTimetrend: Array<{
      date: Date;
      averageTime: number;
    }>;
    successRateTrend: Array<{
      date: Date;
      successRate: number;
    }>;
    resourceUsageTrend: Array<{
      date: Date;
      cpu: number;
      memory: number;
      network: number;
    }>;
  };
}

export interface WorkflowDependency {
  id: string;
  type: 'workflow' | 'resource' | 'service' | 'data';
  name: string;
  version?: string;
  status: 'available' | 'unavailable' | 'degraded' | 'unknown';
  healthCheck?: {
    endpoint: string;
    method: 'GET' | 'POST' | 'HEAD';
    expectedStatus: number;
    timeout: number;
  };
  fallback?: {
    type: 'alternative' | 'cache' | 'mock';
    configuration: any;
  };
}

export interface WorkflowNotification {
  id: string;
  workflowId: string;
  type: 'email' | 'webhook' | 'slack' | 'sms' | 'push';
  trigger: 'started' | 'completed' | 'failed' | 'delayed' | 'custom';
  configuration: {
    recipients?: string[];
    template?: string;
    customCondition?: string;
    throttling?: {
      enabled: boolean;
      maxPerHour: number;
      cooldownPeriod: number;
    };
  };
  enabled: boolean;
}

export interface WorkflowAudit {
  id: string;
  workflowId: string;
  executionId: string;
  timestamp: Date;
  action: 'created' | 'started' | 'paused' | 'resumed' | 'completed' | 'failed' | 'cancelled' | 'modified';
  actor: {
    type: 'user' | 'system' | 'service';
    id: string;
    name: string;
  };
  details: {
    previousState?: any;
    newState?: any;
    changes?: Record<string, {
      from: any;
      to: any;
    }>;
    reason?: string;
    metadata?: Record<string, any>;
  };
  compliance: {
    retentionPeriod: number;
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
    tags: string[];
  };
}

export interface WorkflowBatch {
  id: string;
  name: string;
  description: string;
  workflows: Array<{
    workflowId: string;
    context: ExecutionContext;
    dependencies: string[];
  }>;
  executionStrategy: 'sequential' | 'parallel' | 'staged';
  schedule?: WorkflowSchedule;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    total: number;
    completed: number;
    failed: number;
    running: number;
  };
  metadata: {
    created: Date;
    started?: Date;
    completed?: Date;
    creator: string;
    tags: string[];
  };
}

export interface WorkflowSLA {
  id: string;
  workflowId: string;
  name: string;
  description: string;
  metrics: Array<{
    name: string;
    type: 'execution_time' | 'success_rate' | 'availability' | 'throughput';
    threshold: number;
    operator: 'less_than' | 'greater_than' | 'equal_to' | 'not_equal_to';
    unit: 'ms' | 'seconds' | 'minutes' | 'hours' | 'percentage' | 'count';
  }>;
  timeWindow: {
    duration: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  };
  actions: Array<{
    type: 'alert' | 'escalate' | 'auto_scale' | 'fallback';
    configuration: any;
    delay: number;
  }>;
  enabled: boolean;
  metadata: {
    created: Date;
    modified: Date;
    owner: string;
    criticality: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface WorkflowVersioning {
  workflowId: string;
  versions: Array<{
    version: string;
    definition: WorkflowDefinition;
    metadata: {
      created: Date;
      author: string;
      description: string;
      breaking: boolean;
      deprecated: boolean;
    };
    compatibility: {
      backwardCompatible: boolean;
      forwardCompatible: boolean;
      migrationRequired: boolean;
      migrationInstructions?: string;
    };
  }>;
  currentVersion: string;
  latestVersion: string;
  versioningStrategy: 'semantic' | 'sequential' | 'date-based';
}

export interface WorkflowTestSuite {
  id: string;
  workflowId: string;
  name: string;
  description: string;
  tests: Array<{
    id: string;
    name: string;
    type: 'unit' | 'integration' | 'end-to-end' | 'performance' | 'security';
    description: string;
    inputs: ExecutionContext;
    expectedOutputs: any;
    assertions: Array<{
      type: 'equals' | 'contains' | 'matches' | 'less_than' | 'greater_than';
      path: string;
      expected: any;
    }>;
    timeout: number;
    retries: number;
  }>;
  coverage: {
    states: number;
    transitions: number;
    conditions: number;
    errorPaths: number;
  };
  lastRun: {
    timestamp: Date;
    duration: number;
    passed: number;
    failed: number;
    skipped: number;
    results: Array<{
      testId: string;
      status: 'passed' | 'failed' | 'skipped';
      duration: number;
      error?: string;
      artifacts?: string[];
    }>;
  };
}

// Export utility types
export type WorkflowStatus = WorkflowExecution['status'];
export type WorkflowStateType = WorkflowStateDefinition['type'];
export type WorkflowEventType = WorkflowEvent['type'];
export type ExecutionPriority = NonNullable<ExecutionContext['priority']>;
export type ValidationErrorType = WorkflowValidationError['type'];
export type OptimizationSuggestionType = WorkflowOptimizationSuggestion['type'];
export type NotificationTrigger = WorkflowNotification['trigger'];
export type AuditAction = WorkflowAudit['action'];
export type SLAMetricType = WorkflowSLA['metrics'][0]['type'];
export type TestType = WorkflowTestSuite['tests'][0]['type'];

// Export type guards
export function isWorkflowCompleted(execution: WorkflowExecution): boolean {
  return execution.status === 'completed';
}

export function isWorkflowFailed(execution: WorkflowExecution): boolean {
  return execution.status === 'failed';
}

export function isWorkflowRunning(execution: WorkflowExecution): boolean {
  return execution.status === 'running';
}

export function hasWorkflowError(execution: WorkflowExecution): boolean {
  return execution.error !== undefined;
}

export function isValidWorkflowState(state: string, definition: WorkflowDefinition): boolean {
  return definition.states.some(s => s.name === state);
}

export function getWorkflowDuration(execution: WorkflowExecution): number {
  if (!execution.endTime) {
    return Date.now() - execution.startTime.getTime();
  }
  return execution.endTime.getTime() - execution.startTime.getTime();
}