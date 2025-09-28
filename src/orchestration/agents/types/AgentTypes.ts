/**
 * Shared Agent Type Definitions
 * Extracted from original AgentWorkflowCoordinator for reusability
 */

export interface AgentDefinition {
  agentId: string;
  agentName: string;
  agentType: 'integration' | 'quality' | 'compilation' | 'validation' | 'deployment' | 'orchestration';
  specialization: string;
  capabilities: AgentCapability[];
  responsibilities: string[];
  workload: AgentWorkload;
  communication: CommunicationConfig;
  coordination: CoordinationConfig;
}

export interface AgentCapability {
  capabilityId: string;
  name: string;
  description: string;
  proficiency: 'basic' | 'intermediate' | 'advanced' | 'expert';
  dependencies: string[];
  tools: string[];
  prerequisites: string[];
}

export interface AgentWorkload {
  maxConcurrentTasks: number;
  preferredTaskTypes: string[];
  workingHours: WorkingHours;
  loadBalancing: LoadBalancingConfig;
  performanceTargets: PerformanceTarget[];
}

export interface WorkingHours {
  timezone: string;
  startTime: string;
  endTime: string;
  breaks: BreakSchedule[];
  availability: number; // 0-1
}

export interface BreakSchedule {
  startTime: string;
  duration: number;
  type: 'mandatory' | 'optional' | 'maintenance';
}

export interface LoadBalancingConfig {
  algorithm: 'round_robin' | 'least_loaded' | 'capability_based' | 'priority_based';
  weights: Map<string, number>;
  thresholds: Map<string, number>;
  fallbackAgent?: string;
}

export interface PerformanceTarget {
  metric: string;
  target: number;
  threshold: number;
  weight: number;
  measurementPeriod: number;
}

export interface CommunicationConfig {
  protocols: CommunicationProtocol[];
  messageTypes: string[];
  responseTimeouts: Map<string, number>;
  retryPolicies: Map<string, RetryPolicy>;
  escalationRules: EscalationRule[];
}

export interface CommunicationProtocol {
  protocolId: string;
  protocolType: 'direct' | 'pubsub' | 'queue' | 'broadcast' | 'mesh';
  format: 'json' | 'binary' | 'protobuf' | 'custom';
  encryption: boolean;
  compression: boolean;
  reliability: 'at_most_once' | 'at_least_once' | 'exactly_once';
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  retryableErrors: string[];
  circuitBreaker: CircuitBreakerConfig;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  recoveryTimeout: number;
  halfOpenMaxCalls: number;
}

export interface EscalationRule {
  ruleId: string;
  condition: string;
  escalationLevel: number;
  action: string;
  timeout: number;
  stakeholders: string[];
}

export interface CoordinationConfig {
  coordinationType: 'hierarchical' | 'peer_to_peer' | 'leader_follower' | 'consensus';
  leaderElection: LeaderElectionConfig;
  consensusAlgorithm: ConsensusConfig;
  conflictResolution: ConflictResolutionConfig;
  synchronization: SynchronizationConfig;
}

export interface LeaderElectionConfig {
  enabled: boolean;
  algorithm: 'raft' | 'bully' | 'ring' | 'custom';
  electionTimeout: number;
  heartbeatInterval: number;
  leaderLease: number;
}

export interface ConsensusConfig {
  algorithm: 'raft' | 'pbft' | 'paxos' | 'custom';
  quorumSize: number;
  consensusTimeout: number;
  maxRounds: number;
}

export interface ConflictResolutionConfig {
  strategy: 'priority_based' | 'voting' | 'mediation' | 'escalation';
  votingThreshold: number;
  mediatorAgent?: string;
  escalationHierarchy: string[];
}

export interface SynchronizationConfig {
  synchronizationPoints: SynchronizationPoint[];
  barrierTimeout: number;
  checkpointInterval: number;
  recoveryStrategy: string;
}

export interface SynchronizationPoint {
  pointId: string;
  pointType: 'barrier' | 'checkpoint' | 'milestone' | 'decision';
  condition: string;
  participants: string[];
  timeout: number;
  failureStrategy: string;
}

export interface AgentExecution {
  executionId: string;
  agentId: string;
  workflowId: string;
  startTime: number;
  endTime?: number;
  status: 'initializing' | 'ready' | 'working' | 'waiting' | 'completed' | 'failed' | 'suspended';
  currentTask?: string;
  assignedTasks: string[];
  completedTasks: string[];
  failedTasks: string[];
  taskQueue: string[];
  performance: AgentPerformance;
  communication: CommunicationStatus;
  resources: ResourceUtilization;
  logs: AgentLog[];
}

export interface AgentPerformance {
  tasksCompleted: number;
  tasksFailed: number;
  averageTaskDuration: number;
  throughput: number;
  quality: number;
  efficiency: number;
  reliability: number;
  responsiveness: number;
}

export interface CommunicationStatus {
  messagesReceived: number;
  messagesSent: number;
  messagesPending: number;
  communicationErrors: number;
  averageResponseTime: number;
  lastCommunication: number;
}

export interface ResourceUtilization {
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  networkUsage: number;
  toolsInUse: string[];
  costs: number;
}

export interface AgentLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: 'task' | 'communication' | 'performance' | 'error' | 'system';
  message: string;
  data?: any;
  correlation?: string;
}