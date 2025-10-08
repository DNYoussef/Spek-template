/**
 * Swarm Workflow Types - Namespaced Type Definitions
 * Multi-agent swarm orchestration with quality gates and MECE validation
 * NASA Rule 10 Compliant - Type definitions only
 *
 * NAMESPACE STRATEGY (Week 5 Phase 2B):
 * These types are prefixed with "Swarm" to distinguish them from the canonical
 * LangGraph workflow types. While names are similar, the architectures are different:
 *
 * - Canonical: FSM-based template system with state transitions
 * - Swarm: Stage-based multi-agent coordination with quality validation
 *
 * @module types/swarm/SwarmWorkflowTypes
 * @architecture Multi-agent swarm orchestration
 */

import { WorkflowStage, StageExecution } from '../../swarm/workflow/StageProgressionValidator';

// ============================================================================
// NAMESPACED CORE TYPES (Swarm-specific)
// ============================================================================

export type SwarmWorkflowType = 'sparc' | 'feature_development' | 'bug_fix' | 'deployment' | 'maintenance' | 'custom';
export type SwarmWorkflowStatus = 'pending' | 'running' | 'validating' | 'completed' | 'failed' | 'cancelled' | 'rolled_back';
export type SwarmTaskStatus = 'completed' | 'failed' | 'timeout';
export type SwarmAgentStatus = 'idle' | 'busy' | 'unhealthy';
export type SwarmPriority = 'low' | 'medium' | 'high' | 'critical';
export type SwarmLogLevel = 'info' | 'warn' | 'error' | 'debug';
export type SwarmRollbackStrategyType = 'complete_rollback' | 'stage_rollback' | 'compensation' | 'manual';
export type SwarmMECEEnforcementLevel = 'warning' | 'blocking' | 'critical';
export type SwarmConsensusStatus = 'consensus' | 'no_consensus';
export type SwarmVoteDecision = 'agree' | 'disagree';

// ============================================================================
// NAMESPACED FSM ENUMS (Swarm-specific state machine)
// ============================================================================

export enum SwarmWorkflowState {
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

export enum SwarmWorkflowEvent {
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

// ============================================================================
// NAMESPACED CORE INTERFACES (Swarm workflow definition)
// ============================================================================

export interface SwarmWorkflowDefinition {
  workflowId: string;
  workflowName: string;
  workflowType: SwarmWorkflowType;
  description: string;
  stages: WorkflowStage[];
  globalTimeout: number;
  retryPolicy: SwarmWorkflowRetryPolicy;
  qualityRequirements: SwarmQualityRequirement[];
  meceCompliance: SwarmMECEComplianceRequirement;
  rollbackStrategy: SwarmRollbackStrategy;
}

export interface SwarmWorkflowRetryPolicy {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  retryableErrors: string[];
  escalationThreshold: number;
}

export interface SwarmQualityRequirement {
  requirementId: string;
  name: string;
  description: string;
  threshold: number; // 0-1 scale
  validationStage: string;
  blockingFailure: boolean;
  validator: string; // Princess domain responsible
}

export interface SwarmMECEComplianceRequirement {
  mutualExclusivity: number; // 0-1, minimum required
  collectiveExhaustiveness: number; // 0-1, minimum required
  boundaryIntegrity: number; // 0-1, minimum required
  validationInterval: number; // ms between validations
  enforcementLevel: SwarmMECEEnforcementLevel;
}

export interface SwarmRollbackStrategy {
  strategyType: SwarmRollbackStrategyType;
  rollbackTriggers: string[];
  rollbackSteps: SwarmRollbackStep[];
  dataProtection: boolean;
  notificationRequired: boolean;
}

export interface SwarmRollbackStep {
  stepId: string;
  stepName: string;
  targetStage: string;
  action: string;
  order: number;
  timeout: number;
}

// ============================================================================
// NAMESPACED EXECUTION INTERFACES (Swarm execution tracking)
// ============================================================================

export interface SwarmWorkflowExecution {
  executionId: string;
  workflowId: string;
  startTime: number;
  endTime?: number;
  status: SwarmWorkflowStatus;
  currentStage?: string;
  stageExecutions: Map<string, StageExecution>;
  qualityMetrics: SwarmQualityMetrics;
  meceValidationResults: SwarmMECEValidationResult[];
  dependencyResolutions: string[];
  integrationTestResults: string[];
  retryCount: number;
  rollbackReason?: string;
  artifacts: string[];
  logs: SwarmWorkflowLog[];
}

export interface SwarmQualityMetrics {
  overallQuality: number; // 0-1
  stageQuality: Map<string, number>;
  complianceScore: number; // 0-1
  performanceScore: number; // 0-1
  securityScore: number; // 0-1
  completenessScore: number; // 0-1
  maintainabilityScore: number; // 0-1
}

export interface SwarmMECEValidationResult {
  validationId: string;
  timestamp: number;
  mutualExclusivity: boolean;
  collectiveExhaustiveness: boolean;
  boundaryIntegrity: boolean;
  overallCompliance: number;
  violations: string[];
  resolutionActions: string[];
}

export interface SwarmWorkflowLog {
  timestamp: number;
  level: SwarmLogLevel;
  stage?: string;
  domain?: string;
  message: string;
  data?: any;
}

// ============================================================================
// NAMESPACED AGENT INTERFACES (Swarm agent coordination)
// ============================================================================

export interface SwarmTaskResult {
  taskId: string;
  status: SwarmTaskStatus;
  output: any;
  duration: number;
  agent: string;
  metrics?: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export interface SwarmAgent {
  id: string;
  type: string;
  domain: string;
  status: SwarmAgentStatus;
  capabilities: string[];
  lastHeartbeat: number;
  taskLoad: number;
  responseTime: number;
  executeTask(task: any): Promise<any>;
}

export interface SwarmTask {
  id: string;
  description: string;
  requirements: string[];
  acceptanceCriteria: string[];
  domain: string;
  priority: SwarmPriority;
  timeout: number;
}

// ============================================================================
// NAMESPACED CONSENSUS INTERFACES (Byzantine consensus for swarm)
// ============================================================================

export interface SwarmConsensusResult {
  status: SwarmConsensusStatus;
  votes: number;
  total: number;
  decision?: any;
}

export interface SwarmHealthMetrics {
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

export interface SwarmSemanticSimilarityResult {
  similarity: number;
  confidence: number;
  overlap: string[];
}

export interface SwarmMECEAnalysisResult {
  overlaps: Array<{
    task1: string;
    task2: string;
    similarity: number;
    conflictArea: string;
  }>;
  gaps: string[];
  score: number;
}

// ============================================================================
// NAMESPACED OPTIONS AND CONFIGURATION (Swarm execution options)
// ============================================================================

export interface SwarmWorkflowExecutionOptions {
  priority?: SwarmPriority;
  dryRun?: boolean;
  customStages?: string[];
  qualityOverrides?: Map<string, number>;
}

export interface SwarmOrchestrationHealth {
  overallHealth: number;
  activeWorkflows: number;
  systemLoad: number;
  avgExecutionTime: number;
  successRate: number;
  criticalIssues: string[];
}

export interface SwarmSystemMetrics {
  activeWorkflows: number;
  totalExecutions: number;
  globalMetrics: Record<string, any>;
  workflowDefinitions: number;
}

// ============================================================================
// NAMESPACED TRANSITION CONTEXT (Swarm FSM context)
// ============================================================================

export interface SwarmWorkflowTransitionContext {
  execution: SwarmWorkflowExecution;
  workflow: SwarmWorkflowDefinition;
  inputData?: any;
  options?: SwarmWorkflowExecutionOptions;
  error?: Error;
  validationResult?: any;
}

// ============================================================================
// NAMESPACED VOTING INTERFACES (Swarm voting/decision making)
// ============================================================================

export interface SwarmVoteRequest {
  agent: string;
  decision: SwarmVoteDecision;
  confidence: number;
}

export interface SwarmDecisionExecutionPlan {
  type: 'workflow_modification' | 'agent_reallocation' | 'priority_adjustment';
  id: string;
  workflowId?: string;
  modifications?: any;
  reallocationPlan?: any;
  priorityChanges?: any;
}

// ============================================================================
// NAMESPACED CONSTANTS (Swarm orchestration constants)
// ============================================================================

export const SWARM_WORKFLOW_CONSTANTS = {
  MECE_VALIDATION_INTERVAL: 60000, // 1 minute
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  MAX_CONCURRENT_WORKFLOWS: 10,
  QUALITY_GATE_TIMEOUT: 300000, // 5 minutes
  AGENT_HEARTBEAT_TIMEOUT: 60000, // 1 minute
  STAGE_MONITORING_INTERVAL: 30000, // 30 seconds
  EXECUTION_CLEANUP_INTERVAL: 300000, // 5 minutes
  EXECUTION_RETENTION_PERIOD: 24 * 60 * 60 * 1000 // 24 hours
} as const;

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS (Legacy non-prefixed names)
// ============================================================================

/**
 * DEPRECATED: Use namespaced types instead
 * These exports maintain backward compatibility but will be removed in future versions
 */

// Type aliases for backward compatibility
export type WorkflowType = SwarmWorkflowType;
export type WorkflowStatus = SwarmWorkflowStatus;
export type TaskStatus = SwarmTaskStatus;
export type AgentStatus = SwarmAgentStatus;
export type Priority = SwarmPriority;
export type LogLevel = SwarmLogLevel;
export type RollbackStrategyType = SwarmRollbackStrategyType;
export type MECEEnforcementLevel = SwarmMECEEnforcementLevel;
export type ConsensusStatus = SwarmConsensusStatus;
export type VoteDecision = SwarmVoteDecision;

// Enum aliases for backward compatibility
export const WorkflowState = SwarmWorkflowState;
export const WorkflowEvent = SwarmWorkflowEvent;

// Interface aliases for backward compatibility
export type WorkflowDefinition = SwarmWorkflowDefinition;
export type WorkflowRetryPolicy = SwarmWorkflowRetryPolicy;
export type QualityRequirement = SwarmQualityRequirement;
export type MECEComplianceRequirement = SwarmMECEComplianceRequirement;
export type RollbackStrategy = SwarmRollbackStrategy;
export type RollbackStep = SwarmRollbackStep;
export type WorkflowExecution = SwarmWorkflowExecution;
export type QualityMetrics = SwarmQualityMetrics;
export type MECEValidationResult = SwarmMECEValidationResult;
export type WorkflowLog = SwarmWorkflowLog;
export type TaskResult = SwarmTaskResult;
export type Agent = SwarmAgent;
export type Task = SwarmTask;
export type ConsensusResult = SwarmConsensusResult;
export type SwarmHealth = SwarmHealthMetrics;
export type SemanticSimilarityResult = SwarmSemanticSimilarityResult;
export type MECEAnalysisResult = SwarmMECEAnalysisResult;
export type WorkflowExecutionOptions = SwarmWorkflowExecutionOptions;
export type OrchestrationHealth = SwarmOrchestrationHealth;
export type SystemMetrics = SwarmSystemMetrics;
export type WorkflowTransitionContext = SwarmWorkflowTransitionContext;
export type VoteRequest = SwarmVoteRequest;
export type DecisionExecutionPlan = SwarmDecisionExecutionPlan;

// Constant alias for backward compatibility
export const WORKFLOW_CONSTANTS = SWARM_WORKFLOW_CONSTANTS;

// Default export for backward compatibility
export default {
  WorkflowState: SwarmWorkflowState,
  WorkflowEvent: SwarmWorkflowEvent,
  WORKFLOW_CONSTANTS: SWARM_WORKFLOW_CONSTANTS
};
