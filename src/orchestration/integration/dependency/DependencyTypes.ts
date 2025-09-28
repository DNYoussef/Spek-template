/**
 * CODEX AGENT 008 - Dependency Types
 * NASA Rule 10 Compliant: All interfaces, enums, and type definitions
 * FSM-First Design: Explicit state types and event enums
 */

// FSM State Types
export enum DependencyState {
  PENDING = 'pending',
  RESOLVING = 'resolving',
  RESOLVED = 'resolved',
  FAILED = 'failed',
  BLOCKED = 'blocked'
}

export enum ResolutionState {
  PLANNING = 'planning',
  EXECUTING = 'executing',
  VALIDATING = 'validating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back'
}

export enum StepState {
  PENDING = 'pending',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

export enum ValidationState {
  PENDING = 'pending',
  CHECKING = 'checking',
  SATISFIED = 'satisfied',
  FAILED = 'failed',
  TIMEOUT = 'timeout'
}

// FSM Event Types
export enum DependencyEvent {
  START_RESOLUTION = 'START_RESOLUTION',
  DEPENDENCY_SATISFIED = 'DEPENDENCY_SATISFIED',
  DEPENDENCY_FAILED = 'DEPENDENCY_FAILED',
  TIMEOUT_REACHED = 'TIMEOUT_REACHED',
  RETRY_ATTEMPT = 'RETRY_ATTEMPT',
  ROLLBACK_INITIATED = 'ROLLBACK_INITIATED'
}

export enum ResolutionEvent {
  BEGIN_PLANNING = 'BEGIN_PLANNING',
  START_EXECUTION = 'START_EXECUTION',
  STEP_COMPLETED = 'STEP_COMPLETED',
  STEP_FAILED = 'STEP_FAILED',
  VALIDATION_PASSED = 'VALIDATION_PASSED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  EXECUTION_COMPLETED = 'EXECUTION_COMPLETED',
  EXECUTION_FAILED = 'EXECUTION_FAILED'
}

// Core Data Interfaces
export interface DependencyNode {
  nodeId: string;
  componentId: string;
  componentName: string;
  componentType: 'service' | 'library' | 'configuration' | 'data' | 'infrastructure';
  version: string;
  location: string;
  status: DependencyState;
  dependencies: DependencyEdge[];
  dependents: string[];
  metadata: ComponentMetadata;
}

export interface DependencyEdge {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  dependencyType: 'hard' | 'soft' | 'optional' | 'critical' | 'runtime' | 'build' | 'test';
  requirement: DependencyRequirement;
  status: ValidationState;
  lastChecked: number;
  checkCount: number;
  maxRetries: number;
}

export interface DependencyRequirement {
  requirementId: string;
  name: string;
  description: string;
  type: 'version' | 'availability' | 'health' | 'compatibility' | 'performance' | 'security';
  criteria: RequirementCriteria;
  validator: string;
  timeout: number;
  retryPolicy: RetryPolicy;
}

export interface RequirementCriteria {
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'regex' | 'custom';
  value: any;
  customValidator?: string;
  additionalParams?: Map<string, any>;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  retryableErrors: string[];
  escalationThreshold: number;
}

export interface ComponentMetadata {
  description: string;
  owner: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  stability: 'experimental' | 'beta' | 'stable' | 'deprecated';
  supportLevel: 'community' | 'commercial' | 'enterprise';
  documentation: string;
  healthEndpoint?: string;
  monitoringConfig?: MonitoringConfig;
}

export interface MonitoringConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  metrics: string[];
  alerts: AlertConfig[];
}

export interface AlertConfig {
  alertId: string;
  condition: string;
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  notification: NotificationConfig;
}

export interface NotificationConfig {
  channels: string[];
  escalation: boolean;
  cooldown: number;
}

export interface DependencyGraph {
  graphId: string;
  graphName: string;
  description: string;
  version: string;
  nodes: Map<string, DependencyNode>;
  edges: Map<string, DependencyEdge>;
  resolutionOrder: string[];
  circularDependencies: CircularDependency[];
  criticalPath: string[];
  statistics: GraphStatistics;
}

export interface CircularDependency {
  circularId: string;
  cycle: string[];
  severity: 'warning' | 'error' | 'critical';
  resolution: CircularResolution;
  status: 'detected' | 'resolving' | 'resolved' | 'ignored';
}

export interface CircularResolution {
  strategy: 'break_cycle' | 'dependency_injection' | 'lazy_loading' | 'refactor' | 'ignore';
  breakPoint?: string;
  alternativeApproach?: string;
  implementationPlan: string[];
  riskAssessment: string;
}

export interface GraphStatistics {
  totalNodes: number;
  totalEdges: number;
  resolvedNodes: number;
  failedNodes: number;
  circularDependencies: number;
  criticalPathLength: number;
  averageResolutionTime: number;
  resolutionSuccessRate: number;
}

export interface ResolutionPlan {
  planId: string;
  planName: string;
  graphId: string;
  executionOrder: ResolutionStep[];
  parallelGroups: ParallelGroup[];
  contingencyPlans: ContingencyPlan[];
  estimatedDuration: number;
  riskLevel: number;
}

export interface ResolutionStep {
  stepId: string;
  stepType: 'resolve' | 'validate' | 'wait' | 'checkpoint' | 'rollback';
  targetNodeId: string;
  dependsOn: string[];
  estimatedDuration: number;
  timeout: number;
  retryPolicy: RetryPolicy;
  rollbackPlan?: RollbackStep[];
}

export interface ParallelGroup {
  groupId: string;
  stepIds: string[];
  coordinationType: 'barrier' | 'pipeline' | 'independent';
  maxConcurrency: number;
  failureStrategy: 'fail_fast' | 'continue' | 'partial_success';
}

export interface ContingencyPlan {
  planId: string;
  triggerCondition: string;
  actions: ContingencyAction[];
  fallbackStrategy: string;
  notificationRequired: boolean;
}

export interface ContingencyAction {
  actionId: string;
  actionType: 'skip' | 'alternative' | 'manual' | 'escalate';
  target: string;
  parameters: Map<string, any>;
  timeout: number;
}

export interface RollbackStep {
  stepId: string;
  action: string;
  target: string;
  timeout: number;
  validation: string;
}

export interface ResolutionExecution {
  executionId: string;
  planId: string;
  startTime: number;
  endTime?: number;
  status: ResolutionState;
  currentStep?: string;
  stepExecutions: Map<string, StepExecution>;
  resolvedNodes: Set<string>;
  failedNodes: Set<string>;
  blockedNodes: Set<string>;
  metrics: ResolutionMetrics;
  logs: ResolutionLog[];
}

export interface StepExecution {
  stepId: string;
  nodeId: string;
  startTime: number;
  endTime?: number;
  status: StepState;
  attempts: number;
  lastError?: string;
  validationResults: ValidationResult[];
  duration: number;
}

export interface ResolutionMetrics {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  averageStepDuration: number;
  parallelEfficiency: number;
  resourceUtilization: number;
  errorRate: number;
}

export interface ResolutionLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  stepId?: string;
  nodeId?: string;
  message: string;
  data?: any;
  correlationId?: string;
}

export interface ValidationResult {
  validationId: string;
  requirementId: string;
  passed: boolean;
  score: number;
  message: string;
  timestamp: number;
  details?: any;
}

// FSM Configuration Interfaces
export interface DependencyFSMConfig {
  maxRetries: number;
  defaultTimeout: number;
  retryDelay: number;
  exponentialBackoff: boolean;
}

export interface ResolutionFSMConfig {
  maxConcurrentResolutions: number;
  healthCheckInterval: number;
  metricsUpdateInterval: number;
}

// Validator Configuration
export interface ValidatorConfig {
  type: string;
  timeout: number;
  retryPolicy: RetryPolicy;
  customParams?: Map<string, any>;
}

// Event Payload Types
export interface DependencyEventPayload {
  nodeId: string;
  timestamp: number;
  data?: any;
}

export interface ResolutionEventPayload {
  executionId: string;
  stepId?: string;
  timestamp: number;
  data?: any;
}

// Options and Configuration Types
export interface GraphBuildOptions {
  includeOptional?: boolean;
  validateCircular?: boolean;
  calculateCriticalPath?: boolean;
}

export interface ResolutionOptions {
  parallelism?: number;
  failureStrategy?: 'fail_fast' | 'continue' | 'partial_success';
  timeout?: number;
  dryRun?: boolean;
  continueOnFailure?: boolean;
}

// Constants
export const DEFAULT_CONFIG = {
  MAX_CONCURRENT_RESOLUTIONS: 5,
  DEFAULT_TIMEOUT: 300000, // 5 minutes
  HEALTH_CHECK_INTERVAL: 30000,
  RETRY_LIMIT: 3,
  MAX_CYCLE_LENGTH: 10,
  MAX_GRAPH_SIZE: 1000
} as const;

export const VALIDATOR_TYPES = {
  VERSION: 'version',
  AVAILABILITY: 'availability',
  HEALTH: 'health',
  COMPATIBILITY: 'compatibility',
  PERFORMANCE: 'performance',
  SECURITY: 'security'
} as const;