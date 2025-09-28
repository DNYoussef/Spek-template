/**
 * Workflow Orchestrator Types and Interfaces
 * Extracted from WorkflowOrchestrator.ts for modular architecture
 * NASA Rule 10 Compliant - Type definitions only
 */

import { WorkflowStage, StageExecution } from '../workflow/StageProgressionValidator';

// Core workflow types
export type WorkflowType = 'sparc' | 'feature_development' | 'bug_fix' | 'deployment' | 'maintenance' | 'custom';
export type WorkflowStatus = 'pending' | 'running' | 'validating' | 'completed' | 'failed' | 'cancelled' | 'rolled_back';
export type TaskStatus = 'completed' | 'failed' | 'timeout';
export type AgentStatus = 'idle' | 'busy' | 'unhealthy';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type RollbackStrategyType = 'complete_rollback' | 'stage_rollback' | 'compensation' | 'manual';
export type MECEEnforcementLevel = 'warning' | 'blocking' | 'critical';
export type ConsensusStatus = 'consensus' | 'no_consensus';
export type VoteDecision = 'agree' | 'disagree';

// FSM-related types
export enum WorkflowState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  VALIDATING = 'validating',
  EXECUTING = 'executing',
  MONITORING = 'monitoring',
  ROLLING_BACK = 'rolling_back',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum WorkflowEvent {
  START_WORKFLOW = 'start_workflow',
  VALIDATION_COMPLETE = 'validation_complete',
  VALIDATION_FAILED = 'validation_failed',
  STAGE_COMPLETE = 'stage_complete',
  STAGE_FAILED = 'stage_failed',
  ROLLBACK_REQUIRED = 'rollback_required',
  ROLLBACK_COMPLETE = 'rollback_complete',
  WORKFLOW_COMPLETE = 'workflow_complete',
  WORKFLOW_FAILED = 'workflow_failed',
  CANCEL_WORKFLOW = 'cancel_workflow'
}

// Core interfaces
export interface WorkflowDefinition {
  workflowId: string;
  workflowName: string;
  workflowType: WorkflowType;
  description: string;
  stages: WorkflowStage[];
  globalTimeout: number;
  retryPolicy: WorkflowRetryPolicy;
  qualityRequirements: QualityRequirement[];
  meceCompliance: MECEComplianceRequirement;
  rollbackStrategy: RollbackStrategy;
}

export interface WorkflowRetryPolicy {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  retryableErrors: string[];
  escalationThreshold: number;
}

export interface QualityRequirement {
  requirementId: string;
  name: string;
  description: string;
  threshold: number; // 0-1 scale
  validationStage: string;
  blockingFailure: boolean;
  validator: string; // Princess domain responsible
}

export interface MECEComplianceRequirement {
  mutualExclusivity: number; // 0-1, minimum required
  collectiveExhaustiveness: number; // 0-1, minimum required
  boundaryIntegrity: number; // 0-1, minimum required
  validationInterval: number; // ms between validations
  enforcementLevel: MECEEnforcementLevel;
}

export interface RollbackStrategy {
  strategyType: RollbackStrategyType;
  rollbackTriggers: string[];
  rollbackSteps: RollbackStep[];
  dataProtection: boolean;
  notificationRequired: boolean;
}

export interface RollbackStep {
  stepId: string;
  stepName: string;
  targetStage: string;
  action: string;
  order: number;
  timeout: number;
}

export interface WorkflowExecution {
  executionId: string;
  workflowId: string;
  startTime: number;
  endTime?: number;
  status: WorkflowStatus;
  currentStage?: string;
  stageExecutions: Map<string, StageExecution>;
  qualityMetrics: QualityMetrics;
  meceValidationResults: MECEValidationResult[];
  dependencyResolutions: string[];
  integrationTestResults: string[];
  retryCount: number;
  rollbackReason?: string;
  artifacts: string[];
  logs: WorkflowLog[];
}

export interface QualityMetrics {
  overallQuality: number; // 0-1
  stageQuality: Map<string, number>;
  complianceScore: number; // 0-1
  performanceScore: number; // 0-1
  securityScore: number; // 0-1
  completenessScore: number; // 0-1
  maintainabilityScore: number; // 0-1
}

export interface MECEValidationResult {
  validationId: string;
  timestamp: number;
  mutualExclusivity: boolean;
  collectiveExhaustiveness: boolean;
  boundaryIntegrity: boolean;
  overallCompliance: number;
  violations: string[];
  resolutionActions: string[];
}

export interface WorkflowLog {
  timestamp: number;
  level: LogLevel;
  stage?: string;
  domain?: string;
  message: string;
  data?: any;
}

export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  output: any;
  duration: number;
  agent: string;
  metrics?: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export interface Agent {
  id: string;
  type: string;
  domain: string;
  status: AgentStatus;
  capabilities: string[];
  lastHeartbeat: number;
  taskLoad: number;
  responseTime: number;
  executeTask(task: any): Promise<any>;
}

export interface Task {
  id: string;
  description: string;
  requirements: string[];
  acceptanceCriteria: string[];
  domain: string;
  priority: Priority;
  timeout: number;
}

export interface ConsensusResult {
  status: ConsensusStatus;
  votes: number;
  total: number;
  decision?: any;
}

export interface SwarmHealth {
  totalAgents: number;
  healthyAgents: number;
  averageResponseTime: number;
  overloadedAgents: number;
  details: Array<{
    agentId: string;
    status: string;
    lastHeartbeat: number;
    taskLoad: number;
    responseTime: number;
  }>;
}

export interface SemanticSimilarityResult {
  similarity: number;
  confidence: number;
  overlap: string[];
}

export interface MECEAnalysisResult {
  overlaps: Array<{
    task1: string;
    task2: string;
    similarity: number;
    conflictArea: string;
  }>;
  gaps: string[];
  score: number;
}

// Execution options and configuration
export interface WorkflowExecutionOptions {
  priority?: Priority;
  dryRun?: boolean;
  customStages?: string[];
  qualityOverrides?: Map<string, number>;
}

export interface OrchestrationHealth {
  overallHealth: number;
  activeWorkflows: number;
  systemLoad: number;
  avgExecutionTime: number;
  successRate: number;
  criticalIssues: string[];
}

export interface SystemMetrics {
  activeWorkflows: number;
  totalExecutions: number;
  globalMetrics: Record<string, any>;
  workflowDefinitions: number;
}

// FSM transition context
export interface WorkflowTransitionContext {
  execution: WorkflowExecution;
  workflow: WorkflowDefinition;
  inputData?: any;
  options?: WorkflowExecutionOptions;
  error?: Error;
  validationResult?: any;
}

// Vote request/response types
export interface VoteRequest {
  agent: string;
  decision: VoteDecision;
  confidence: number;
}

export interface DecisionExecutionPlan {
  type: 'workflow_modification' | 'agent_reallocation' | 'priority_adjustment';
  id: string;
  workflowId?: string;
  modifications?: any;
  reallocationPlan?: any;
  priorityChanges?: any;
}

// Constants
export const WORKFLOW_CONSTANTS = {
  MECE_VALIDATION_INTERVAL: 60000, // 1 minute
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  MAX_CONCURRENT_WORKFLOWS: 10,
  QUALITY_GATE_TIMEOUT: 300000, // 5 minutes
  AGENT_HEARTBEAT_TIMEOUT: 60000, // 1 minute
  STAGE_MONITORING_INTERVAL: 30000, // 30 seconds
  EXECUTION_CLEANUP_INTERVAL: 300000, // 5 minutes
  EXECUTION_RETENTION_PERIOD: 24 * 60 * 60 * 1000 // 24 hours
} as const;

export default {
  WorkflowState,
  WorkflowEvent,
  WORKFLOW_CONSTANTS
};
