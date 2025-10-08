/**
 * Shared Workflow Type Definitions
 * Extracted from original AgentWorkflowCoordinator for reusability
 */

import { AgentExecution } from './AgentTypes';

export interface WorkflowTask {
  taskId: string;
  taskName: string;
  taskType: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
  dependencies: TaskDependency[];
  assignedAgent?: string;
  assignmentCriteria: AssignmentCriteria;
  constraints: TaskConstraint[];
  deliverables: TaskDeliverable[];
  validation: TaskValidation;
  timeline: TaskTimeline;
  resources: TaskResources;
}

export interface TaskDependency {
  dependencyId: string;
  dependencyType: 'prerequisite' | 'resource' | 'data' | 'approval' | 'timing';
  targetTask: string;
  relationship: 'blocks' | 'enables' | 'informs' | 'synchronizes';
  requirement: string;
  timeout: number;
}

export interface AssignmentCriteria {
  requiredCapabilities: string[];
  preferredAgent?: string;
  excludedAgents: string[];
  loadThreshold: number;
  skillLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  availabilityWindow: AvailabilityWindow;
}

export interface AvailabilityWindow {
  startTime: number;
  endTime: number;
  timezone: string;
  flexibility: number; // 0-1
}

export interface TaskConstraint {
  constraintId: string;
  constraintType: 'resource' | 'timing' | 'quality' | 'security' | 'compliance';
  description: string;
  requirement: string;
  enforced: boolean;
  violationAction: string;
}

export interface TaskDeliverable {
  deliverableId: string;
  name: string;
  description: string;
  format: string;
  location: string;
  qualityRequirements: QualityRequirement[];
  acceptanceCriteria: AcceptanceCriteria[];
}

export interface QualityRequirement {
  requirementId: string;
  metric: string;
  threshold: number;
  measurement: string;
  automated: boolean;
}

export interface AcceptanceCriteria {
  criteriaId: string;
  description: string;
  testMethod: string;
  expectedResult: string;
  priority: string;
}

export interface TaskValidation {
  preValidation: ValidationStep[];
  postValidation: ValidationStep[];
  continuousValidation: ValidationStep[];
  validationTimeout: number;
}

export interface ValidationStep {
  stepId: string;
  validationType: string;
  validator: string;
  criteria: string;
  blocking: boolean;
  timeout: number;
}

export interface TaskTimeline {
  estimatedStart: number;
  estimatedDuration: number;
  deadline: number;
  milestones: TaskMilestone[];
  bufferTime: number;
  criticalPath: boolean;
}

export interface TaskMilestone {
  milestoneId: string;
  name: string;
  description: string;
  targetDate: number;
  completionCriteria: string;
  dependencies: string[];
}

export interface TaskResources {
  computeRequirements: ComputeRequirement[];
  storageRequirements: StorageRequirement[];
  networkRequirements: NetworkRequirement[];
  toolRequirements: ToolRequirement[];
  budgetRequirement: BudgetRequirement;
}

export interface ComputeRequirement {
  cpu: number;
  memory: number;
  gpu: boolean;
  duration: number;
  scalability: boolean;
}

export interface StorageRequirement {
  size: number;
  type: 'persistent' | 'temporary' | 'shared';
  performance: 'standard' | 'high' | 'premium';
  backup: boolean;
}

export interface NetworkRequirement {
  bandwidth: number;
  latency: number;
  reliability: number;
  security: boolean;
}

export interface ToolRequirement {
  toolName: string;
  version: string;
  license: string;
  configuration: Map<string, any>;
}

export interface BudgetRequirement {
  estimatedCost: number;
  currency: string;
  breakdown: CostBreakdown[];
  approval: string[];
}

export interface CostBreakdown {
  category: string;
  amount: number;
  justification: string;
}

export interface WorkflowExecution {
  executionId: string;
  workflowName: string;
  description: string;
  startTime: number;
  endTime?: number;
  status: 'planning' | 'executing' | 'synchronizing' | 'validating' | 'completed' | 'failed' | 'cancelled';
  tasks: Map<string, WorkflowTask>;
  agents: Map<string, AgentExecution>;
  coordination: CoordinationState;
  conflicts: WorkflowConflict[];
  synchronization: SynchronizationState;
  metrics: WorkflowMetrics;
  logs: WorkflowLog[];
}

export interface CoordinationState {
  currentLeader?: string;
  coordinationMode: string;
  activeDecisions: Decision[];
  consensusResults: ConsensusResult[];
  coordinationIssues: CoordinationIssue[];
}

export interface Decision {
  decisionId: string;
  decisionType: string;
  participants: string[];
  proposal: string;
  votes: Map<string, Vote>;
  status: 'pending' | 'voting' | 'decided' | 'implemented';
  deadline: number;
}

export interface Vote {
  voter: string;
  choice: 'approve' | 'reject' | 'abstain';
  reasoning: string;
  timestamp: number;
}

export interface ConsensusResult {
  consensusId: string;
  proposal: string;
  result: 'approved' | 'rejected' | 'timeout';
  participants: string[];
  votes: Map<string, Vote>;
  timestamp: number;
}

export interface CoordinationIssue {
  issueId: string;
  issueType: 'communication' | 'conflict' | 'deadlock' | 'resource' | 'performance';
  description: string;
  affectedAgents: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'analyzing' | 'resolving' | 'resolved';
  resolution?: string;
}

export interface WorkflowConflict {
  conflictId: string;
  conflictType: 'resource' | 'task' | 'priority' | 'data' | 'timing';
  description: string;
  participants: string[];
  impact: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'analyzing' | 'mediating' | 'resolved' | 'escalated';
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  resolutionId: string;
  strategy: string;
  actions: ResolutionAction[];
  mediator?: string;
  implementedAt: number;
  outcome: string;
}

export interface ResolutionAction {
  actionId: string;
  actionType: string;
  target: string;
  description: string;
  timeline: number;
}

export interface SynchronizationState {
  activeSyncPoints: Map<string, SyncPointStatus>;
  completedSyncPoints: string[];
  pendingBarriers: string[];
  checkpoints: Map<string, CheckpointStatus>;
  globalState: GlobalSynchronizationState;
}

export interface SyncPointStatus {
  pointId: string;
  status: 'waiting' | 'synchronizing' | 'completed' | 'failed' | 'timeout';
  participants: Map<string, ParticipantStatus>;
  startTime: number;
  completionTime?: number;
  issues: string[];
}

export interface ParticipantStatus {
  agentId: string;
  status: 'pending' | 'ready' | 'synchronized' | 'failed';
  timestamp: number;
  data?: any;
}

export interface CheckpointStatus {
  checkpointId: string;
  status: 'created' | 'validated' | 'restored';
  timestamp: number;
  data: Map<string, any>;
  participants: string[];
}

export interface GlobalSynchronizationState {
  globalPhase: string;
  synchronizationHealth: number;
  lastGlobalSync: number;
  nextGlobalSync: number;
  issues: string[];
}

export interface WorkflowMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskDuration: number;
  workflowEfficiency: number;
  agentUtilization: number;
  communicationOverhead: number;
  conflictRate: number;
  synchronizationEfficiency: number;
  qualityScore: number;
}

export interface WorkflowLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  source: string;
  category: 'workflow' | 'agent' | 'task' | 'coordination' | 'conflict' | 'sync';
  message: string;
  data?: any;
  correlation?: string;
}