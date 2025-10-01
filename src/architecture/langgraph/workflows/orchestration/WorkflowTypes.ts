/**
 * WorkflowOrchestrator Types - Complete Type System
 * Comprehensive type definitions for FSM-based workflow orchestration
 * NASA Rule 10 Compliant - Modular type organization
 */

// Core workflow state definitions
export enum WorkflowState {
  IDLE = 'IDLE',
  CREATING = 'CREATING',
  VALIDATING = 'VALIDATING',
  EXECUTING = 'EXECUTING',
  OPTIMIZING = 'OPTIMIZING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum WorkflowEvent {
  CREATE_WORKFLOW = 'CREATE_WORKFLOW',
  VALIDATE_WORKFLOW = 'VALIDATE_WORKFLOW',
  START_EXECUTION = 'START_EXECUTION',
  OPTIMIZE_WORKFLOW = 'OPTIMIZE_WORKFLOW',
  COMPLETE_EXECUTION = 'COMPLETE_EXECUTION',
  FAIL_EXECUTION = 'FAIL_EXECUTION',
  CANCEL_EXECUTION = 'CANCEL_EXECUTION',
  RESET_WORKFLOW = 'RESET_WORKFLOW'
}

// Core workflow interfaces
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
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  states: WorkflowStateDefinition[];
  transitions: WorkflowTransitionDefinition[];
  variables: WorkflowVariableDefinition[];
  metadata: WorkflowTemplateMetadata;
}

export interface WorkflowStateDefinition {
  id: string;
  name: string;
  type: 'princess' | 'parallel' | 'conditional' | 'split' | 'merge';
  configuration: StateConfiguration;
}

export interface WorkflowTransitionDefinition {
  id: string;
  from: string;
  to: string;
  condition?: string;
  weight: number;
  metadata: TransitionMetadata;
}

export interface WorkflowVariableDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required: boolean;
  defaultValue?: any;
  description?: string;
}

// Execution context and metrics
export interface ExecutionContext {
  workflowId?: string;
  templateId?: string;
  variables?: Record<string, any>;
  startTime?: Date;
  metricsEnabled?: boolean;
  status?: 'running' | 'completed' | 'failed' | 'cancelled';
  [key: string]: any;
}

export interface WorkflowExecution {
  id: string;
  definition: WorkflowDefinition;
  context: ExecutionContext;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  currentState: string;
  startTime: Date;
  endTime?: Date;
  error?: Error;
  stateHistory: StateTransition[];
}

export interface StateTransition {
  from: string;
  to: string;
  timestamp: Date;
  duration: number;
  data?: any;
}

// Configuration interfaces
export interface StateConfiguration {
  princess?: string;
  tasks?: Task[];
  condition?: string;
  branches?: ConditionalBranch[];
  [key: string]: any;
}

export interface Task {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: Record<string, any>;
  dependencies: string[];
}

export interface ConditionalBranch {
  id: string;
  condition: string;
  states: string[];
}

// Metadata interfaces
export interface WorkflowTemplateMetadata {
  version: string;
  author: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedDuration: number;
  tags?: string[];
}

export interface TransitionMetadata {
  description: string;
  estimatedDuration?: number;
  [key: string]: any;
}

// Metrics and optimization
export interface WorkflowExecutionMetrics {
  workflowId: string;
  executionMetrics: ExecutionMetrics;
  princessMetrics: Record<string, PrincessMetrics>;
  resourceMetrics: ResourceMetrics;
}

export interface ExecutionMetrics {
  totalDuration: number;
  stateExecutionTimes: Record<string, number>;
  transitionTimes: Record<string, number>;
  retryCount: number;
  errorCount: number;
}

export interface PrincessMetrics {
  tasksCompleted: number;
  averageTaskDuration: number;
  errorRate: number;
  resourceUtilization: number;
}

export interface ResourceMetrics {
  memoryUsage: number;
  cpuUsage: number;
  networkUsage: number;
}

export interface WorkflowOptimizationSuggestion {
  type: OptimizationSuggestionType;
  description: string;
  estimatedImprovement: number;
  effort: 'low' | 'medium' | 'high';
  applicableStates: string[];
  metadata?: Record<string, any>;
}

export enum OptimizationSuggestionType {
  PARALLELIZATION = 'parallelization',
  REORDERING = 'reordering',
  CACHING = 'caching',
  RESOURCE_OPTIMIZATION = 'resource_optimization',
  STATE_CONSOLIDATION = 'state_consolidation'
}

// Validation interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface WorkflowValidationContext {
  workflow: WorkflowDefinition;
  templates: Map<string, WorkflowTemplate>;
  executionHistory: WorkflowExecution[];
}

// FSM transition interfaces
export interface WorkflowTransition {
  fromState: WorkflowState;
  event: WorkflowEvent;
  toState: WorkflowState;
  guard?: (context: WorkflowContext) => boolean;
  action?: (context: WorkflowContext) => Promise<void>;
}

export interface WorkflowContext {
  currentWorkflow?: WorkflowDefinition;
  execution?: WorkflowExecution;
  metrics?: WorkflowExecutionMetrics;
  error?: Error;
  optimizations?: WorkflowOptimizationSuggestion[];
  creationTimestamp?: number;
  creationState?: WorkflowState;
  validationTimestamp?: number;
  validationState?: WorkflowState;
  executionStartTimestamp?: number;
  executionState?: WorkflowState | string;
  optimizationTimestamp?: number;
  optimizationState?: WorkflowState;
  failureTimestamp?: Date;
  resetTimestamp?: Date;
}

// Factory and builder interfaces
export interface WorkflowFactory {
  createFromTemplate(templateId: string, variables: Record<string, any>): Promise<WorkflowDefinition>;
  createFromDescription(description: string): Promise<WorkflowDefinition>;
  createComposite(domains: string[], coordination: CoordinationType): Promise<WorkflowDefinition>;
}

export type CoordinationType = 'sequential' | 'parallel' | 'conditional';

export interface TemplateBuilder {
  setId(id: string): TemplateBuilder;
  setName(name: string): TemplateBuilder;
  setDescription(description: string): TemplateBuilder;
  addState(state: WorkflowStateDefinition): TemplateBuilder;
  addTransition(transition: WorkflowTransitionDefinition): TemplateBuilder;
  addVariable(variable: WorkflowVariableDefinition): TemplateBuilder;
  build(): WorkflowTemplate;
}

// Component interfaces for FSM architecture
export interface WorkflowCore {
  initialize(): Promise<void>;
  createExecution(definition: WorkflowDefinition, context: ExecutionContext): Promise<string>;
  getExecution(workflowId: string): WorkflowExecution | null;
  updateExecution(workflowId: string, updates: Partial<WorkflowExecution>): void;
  finalizeExecution(workflowId: string): void;
}

export interface WorkflowExecutor {
  executeWorkflow(definition: WorkflowDefinition, context: ExecutionContext): Promise<string>;
  cancelWorkflow(workflowId: string): Promise<void>;
  optimizeWorkflow(workflow: WorkflowDefinition): Promise<WorkflowDefinition>;
  applyOptimizations(workflow: WorkflowDefinition, suggestions: WorkflowOptimizationSuggestion[]): Promise<WorkflowDefinition>;
}

export interface WorkflowValidator {
  validateDefinition(workflow: WorkflowDefinition): Promise<ValidationResult>;
  validateTemplate(template: WorkflowTemplate): ValidationResult;
  validateVariables(template: WorkflowTemplate, variables: Record<string, any>): ValidationResult;
  validateExecution(execution: WorkflowExecution): ValidationResult;
}

export interface WorkflowMonitor {
  startMetricsCollection(workflowId: string): void;
  updateMetrics(workflowId: string, event: string, data: any): void;
  getMetrics(workflowId: string): WorkflowExecutionMetrics | null;
  generateOptimizationSuggestions(workflowId: string): Promise<WorkflowOptimizationSuggestion[]>;
}

// Event system interfaces
export interface WorkflowEventEmitter {
  on(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): boolean;
  removeListener(event: string, listener: (...args: any[]) => void): void;
}

export interface WorkflowEventData {
  workflowId: string;
  event: WorkflowEvent;
  timestamp: Date;
  data?: any;
}

// Error handling interfaces
export interface WorkflowError extends Error {
  workflowId?: string;
  state?: string;
  code: string;
  recoverable: boolean;
  context?: Record<string, any>;
}

export interface ErrorHandler {
  handleError(error: WorkflowError): Promise<void>;
  isRecoverable(error: WorkflowError): boolean;
  createRecoveryPlan(error: WorkflowError): RecoveryPlan;
}

export interface RecoveryPlan {
  strategy: 'retry' | 'rollback' | 'skip' | 'manual';
  steps: RecoveryStep[];
  timeout: number;
}

export interface RecoveryStep {
  action: string;
  parameters: Record<string, any>;
  validation: string;
}