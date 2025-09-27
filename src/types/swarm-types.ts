/**
 * Queen-Princess-Drone Type Hierarchy
 * Comprehensive type definitions for swarm coordination and communication
 */

// Base branded types for swarm identity
export type SwarmId = string & { readonly __brand: 'SwarmId' };
export type QueenId = string & { readonly __brand: 'QueenId' };
export type PrincessId = string & { readonly __brand: 'PrincessId' };
export type DroneId = string & { readonly __brand: 'DroneId' };
export type DirectiveId = string & { readonly __brand: 'DirectiveId' };
export type MissionId = string & { readonly __brand: 'MissionId' };

// Temporal types
export type Timestamp = number & { readonly __brand: 'Timestamp' };
export type Duration = number & { readonly __brand: 'Duration'; readonly __unit: 'ms' };
export type Deadline = Date & { readonly __brand: 'Deadline' };

// Priority and status types
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum PrincessDomain {
  DEVELOPMENT = 'development',
  QUALITY = 'quality',
  INFRASTRUCTURE = 'infrastructure',
  RESEARCH = 'research',
  DEPLOYMENT = 'deployment',
  SECURITY = 'security'
}

export enum DirectiveStatus {
  PENDING = 'pending',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum DroneStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
  OFFLINE = 'offline'
}

// =============================================================================
// QUEEN TYPES
// =============================================================================

export interface QueenConfiguration {
  readonly id: QueenId;
  readonly swarmId: SwarmId;
  readonly maxPrincesses: number;
  readonly coordinationStrategy: CoordinationStrategy;
  readonly healthCheckInterval: Duration;
  readonly failoverEnabled: boolean;
  readonly metaLogicEnabled: boolean;
}

export type CoordinationStrategy =
  | 'hierarchical'
  | 'mesh'
  | 'ring'
  | 'star'
  | 'adaptive';

export interface QueenDirective<TPayload = unknown> {
  readonly id: DirectiveId;
  readonly queenId: QueenId;
  readonly targetDomain: PrincessDomain;
  readonly targetPrincess?: PrincessId;
  readonly priority: TaskPriority;
  readonly payload: TPayload;
  readonly deadline?: Deadline;
  readonly dependencies: readonly DirectiveId[];
  readonly metadata: DirectiveMetadata;
  readonly createdAt: Timestamp;
}

export interface DirectiveMetadata {
  readonly source: 'user' | 'system' | 'automated';
  readonly complexity: ComplexityScore;
  readonly estimatedDuration: Duration;
  readonly resourceRequirements: ResourceRequirements;
  readonly complianceLevel: ComplianceLevel;
}

export type ComplexityScore = number & {
  readonly __brand: 'ComplexityScore';
  readonly __range: [1, 100]
};

export type ComplianceLevel = 'basic' | 'enhanced' | 'nasa-pot10';

export interface ResourceRequirements {
  readonly cpuIntensive: boolean;
  readonly memoryIntensive: boolean;
  readonly diskIntensive: boolean;
  readonly networkIntensive: boolean;
  readonly estimatedMemory: number;
  readonly estimatedCpu: number;
}

export interface QueenState {
  readonly id: QueenId;
  readonly status: QueenStatus;
  readonly activePrincesses: ReadonlyMap<PrincessDomain, PrincessId>;
  readonly pendingDirectives: readonly QueenDirective[];
  readonly completedDirectives: readonly DirectiveId[];
  readonly failedDirectives: readonly DirectiveId[];
  readonly performance: QueenPerformanceMetrics;
  readonly lastHealthCheck: Timestamp;
}

export enum QueenStatus {
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  DEGRADED = 'degraded',
  MAINTENANCE = 'maintenance',
  FAILED = 'failed'
}

export interface QueenPerformanceMetrics {
  readonly directivesPerMinute: number;
  readonly averageResponseTime: Duration;
  readonly successRate: PercentageScore;
  readonly coordinationEfficiency: PercentageScore;
  readonly resourceUtilization: ResourceUtilization;
}

export type PercentageScore = number & {
  readonly __brand: 'PercentageScore';
  readonly __range: [0, 100]
};

export interface ResourceUtilization {
  readonly cpu: PercentageScore;
  readonly memory: PercentageScore;
  readonly network: PercentageScore;
  readonly disk: PercentageScore;
}

// =============================================================================
// PRINCESS TYPES
// =============================================================================

export interface PrincessConfiguration {
  readonly id: PrincessId;
  readonly domain: PrincessDomain;
  readonly queenId: QueenId;
  readonly swarmId: SwarmId;
  readonly maxDrones: number;
  readonly specializations: readonly string[];
  readonly autonomyLevel: AutonomyLevel;
  readonly learningEnabled: boolean;
}

export type AutonomyLevel = number & {
  readonly __brand: 'AutonomyLevel';
  readonly __range: [0, 1]
};

export interface PrincessDirectiveAcknowledgment {
  readonly directiveId: DirectiveId;
  readonly princessId: PrincessId;
  readonly status: DirectiveStatus;
  readonly estimatedCompletion: Deadline;
  readonly assignedDrones: readonly DroneId[];
  readonly decomposition: TaskDecomposition;
  readonly acknowledgmentTime: Timestamp;
}

export interface TaskDecomposition {
  readonly strategy: DecompositionStrategy;
  readonly subtasks: readonly SubTask[];
  readonly dependencies: ReadonlyMap<string, readonly string[]>;
  readonly parallelizable: boolean;
  readonly criticalPath: readonly string[];
}

export type DecompositionStrategy =
  | 'file-based'
  | 'feature-based'
  | 'complexity-based'
  | 'dependency-based'
  | 'hybrid';

export interface SubTask {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly assignedDrone?: DroneId;
  readonly estimatedDuration: Duration;
  readonly complexity: ComplexityScore;
  readonly dependencies: readonly string[];
  readonly deliverables: readonly string[];
}

export interface PrincessResponse<TResult = unknown> {
  readonly directiveId: DirectiveId;
  readonly princessId: PrincessId;
  readonly status: DirectiveStatus;
  readonly result?: TResult;
  readonly error?: PrincessError;
  readonly metrics: ExecutionMetrics;
  readonly completionTime: Timestamp;
  readonly qualityScore: QualityScore;
}

export type QualityScore = number & {
  readonly __brand: 'QualityScore';
  readonly __range: [0, 100]
};

export interface ExecutionMetrics {
  readonly totalDuration: Duration;
  readonly activeDrones: number;
  readonly tasksCompleted: number;
  readonly tasksFailed: number;
  readonly resourcesUsed: ResourceUtilization;
  readonly bottlenecks: readonly BottleneckReport[];
}

export interface BottleneckReport {
  readonly type: 'cpu' | 'memory' | 'network' | 'disk' | 'coordination';
  readonly severity: 'low' | 'medium' | 'high';
  readonly duration: Duration;
  readonly impact: string;
}

export interface PrincessError {
  readonly code: string;
  readonly message: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly recoverable: boolean;
  readonly context: ErrorContext;
  readonly suggestions: readonly string[];
}

export interface ErrorContext {
  readonly phase: 'acknowledgment' | 'decomposition' | 'execution' | 'completion';
  readonly affectedDrones: readonly DroneId[];
  readonly affectedSubtasks: readonly string[];
  readonly systemState: Record<string, unknown>;
}

export interface PrincessState {
  readonly id: PrincessId;
  readonly domain: PrincessDomain;
  readonly status: PrincessStatus;
  readonly activeDrones: ReadonlyMap<DroneId, DroneInfo>;
  readonly currentDirectives: readonly DirectiveId[];
  readonly capabilities: PrincessCapabilities;
  readonly performance: PrincessPerformanceMetrics;
  readonly learningModel: LearningModelState;
}

export enum PrincessStatus {
  READY = 'ready',
  BUSY = 'busy',
  OVERWHELMED = 'overwhelmed',
  MAINTENANCE = 'maintenance',
  ERROR = 'error'
}

export interface DroneInfo {
  readonly id: DroneId;
  readonly status: DroneStatus;
  readonly capabilities: readonly string[];
  readonly currentTask?: string;
  readonly performance: DronePerformanceSnapshot;
}

export interface DronePerformanceSnapshot {
  readonly tasksCompleted: number;
  readonly averageTaskDuration: Duration;
  readonly successRate: PercentageScore;
  readonly lastActivity: Timestamp;
}

export interface PrincessCapabilities {
  readonly maxConcurrentTasks: number;
  readonly specializations: readonly string[];
  readonly supportedFileTypes: readonly string[];
  readonly frameworks: readonly string[];
  readonly tools: readonly string[];
  readonly qualityGates: readonly QualityGate[];
}

export interface QualityGate {
  readonly name: string;
  readonly threshold: number;
  readonly metric: string;
  readonly required: boolean;
}

export interface PrincessPerformanceMetrics {
  readonly directivesCompleted: number;
  readonly averageCompletionTime: Duration;
  readonly successRate: PercentageScore;
  readonly droneUtilization: PercentageScore;
  readonly qualityScoreAverage: QualityScore;
  readonly learningProgress: LearningProgress;
}

export interface LearningProgress {
  readonly totalSessions: number;
  readonly patternsLearned: number;
  readonly accuracyImprovement: PercentageScore;
  readonly adaptationRate: number;
}

export interface LearningModelState {
  readonly version: string;
  readonly trainingHours: number;
  readonly accuracy: PercentageScore;
  readonly specializations: readonly string[];
  readonly lastUpdate: Timestamp;
}

// =============================================================================
// DRONE TYPES
// =============================================================================

export interface DroneConfiguration {
  readonly id: DroneId;
  readonly princessId: PrincessId;
  readonly swarmId: SwarmId;
  readonly capabilities: readonly DroneCapability[];
  readonly processingPower: ProcessingPower;
  readonly specialization?: string;
  readonly autonomyLevel: AutonomyLevel;
}

export type ProcessingPower = 'low' | 'medium' | 'high' | 'maximum';

export enum DroneCapability {
  FILE_PROCESSING = 'file-processing',
  CODE_GENERATION = 'code-generation',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  REFACTORING = 'refactoring',
  ANALYSIS = 'analysis',
  VALIDATION = 'validation',
  DEPLOYMENT = 'deployment',
  MONITORING = 'monitoring',
  SECURITY = 'security'
}

export interface DroneTask<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly princessId: PrincessId;
  readonly droneId: DroneId;
  readonly input: TInput;
  readonly expectedOutput: TOutput;
  readonly constraints: TaskConstraints;
  readonly deadline: Deadline;
  readonly priority: TaskPriority;
  readonly metadata: TaskMetadata;
}

export interface TaskConstraints {
  readonly maxDuration: Duration;
  readonly maxMemory: number;
  readonly requiredCapabilities: readonly DroneCapability[];
  readonly qualityThreshold: QualityScore;
  readonly complianceRequired: boolean;
}

export interface TaskMetadata {
  readonly source: 'princess' | 'system';
  readonly category: string;
  readonly tags: readonly string[];
  readonly relatedTasks: readonly string[];
  readonly estimatedComplexity: ComplexityScore;
}

export interface DroneTaskResult<TOutput = unknown> {
  readonly taskId: string;
  readonly droneId: DroneId;
  readonly status: TaskResultStatus;
  readonly output?: TOutput;
  readonly error?: DroneError;
  readonly metrics: DroneTaskMetrics;
  readonly completionTime: Timestamp;
  readonly qualityScore: QualityScore;
}

export enum TaskResultStatus {
  SUCCESS = 'success',
  PARTIAL_SUCCESS = 'partial-success',
  FAILURE = 'failure',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled'
}

export interface DroneError {
  readonly code: string;
  readonly message: string;
  readonly type: 'user' | 'system' | 'network' | 'timeout' | 'validation';
  readonly recoverable: boolean;
  readonly retryable: boolean;
  readonly context: Record<string, unknown>;
}

export interface DroneTaskMetrics {
  readonly executionTime: Duration;
  readonly memoryUsed: number;
  readonly cpuUsage: PercentageScore;
  readonly qualityChecks: readonly QualityCheckResult[];
  readonly artifacts: readonly string[];
}

export interface QualityCheckResult {
  readonly checkName: string;
  readonly passed: boolean;
  readonly score: QualityScore;
  readonly details: string;
  readonly suggestions: readonly string[];
}

export interface DroneState {
  readonly id: DroneId;
  readonly status: DroneStatus;
  readonly currentTask?: string;
  readonly capabilities: readonly DroneCapability[];
  readonly performance: DronePerformanceMetrics;
  readonly health: DroneHealthStatus;
  readonly lastHeartbeat: Timestamp;
}

export interface DronePerformanceMetrics {
  readonly tasksCompleted: number;
  readonly tasksInProgress: number;
  readonly averageTaskDuration: Duration;
  readonly successRate: PercentageScore;
  readonly qualityScoreAverage: QualityScore;
  readonly utilizationRate: PercentageScore;
}

export interface DroneHealthStatus {
  readonly overall: 'healthy' | 'degraded' | 'critical' | 'offline';
  readonly memory: HealthMetric;
  readonly cpu: HealthMetric;
  readonly network: HealthMetric;
  readonly errorRate: PercentageScore;
}

export interface HealthMetric {
  readonly status: 'good' | 'warning' | 'critical';
  readonly value: number;
  readonly threshold: number;
  readonly trend: 'improving' | 'stable' | 'degrading';
}

// =============================================================================
// COMMUNICATION TYPES
// =============================================================================

export interface SwarmMessage<TPayload = unknown> {
  readonly id: string;
  readonly from: SwarmEntityId;
  readonly to: SwarmEntityId;
  readonly type: MessageType;
  readonly payload: TPayload;
  readonly timestamp: Timestamp;
  readonly priority: MessagePriority;
  readonly encryption?: EncryptionInfo;
}

export type SwarmEntityId = QueenId | PrincessId | DroneId;

export enum MessageType {
  DIRECTIVE = 'directive',
  ACKNOWLEDGMENT = 'acknowledgment',
  PROGRESS_UPDATE = 'progress-update',
  COMPLETION = 'completion',
  ERROR_REPORT = 'error-report',
  HEARTBEAT = 'heartbeat',
  COORDINATION = 'coordination',
  EMERGENCY = 'emergency'
}

export enum MessagePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3,
  EMERGENCY = 4
}

export interface EncryptionInfo {
  readonly algorithm: string;
  readonly keyId: string;
  readonly integrity: string;
}

export interface SwarmCommunicationProtocol {
  readonly version: string;
  readonly maxMessageSize: number;
  readonly timeoutMs: Duration;
  readonly retryAttempts: number;
  readonly encryptionRequired: boolean;
  readonly compressionEnabled: boolean;
}

// =============================================================================
// COORDINATION TYPES
// =============================================================================

export interface SwarmCoordinationState {
  readonly swarmId: SwarmId;
  readonly queenId: QueenId;
  readonly topology: CoordinationStrategy;
  readonly activePrincesses: ReadonlyMap<PrincessDomain, PrincessCoordinationInfo>;
  readonly globalState: SwarmGlobalState;
  readonly consensusState: ConsensusState;
}

export interface PrincessCoordinationInfo {
  readonly id: PrincessId;
  readonly domain: PrincessDomain;
  readonly status: PrincessStatus;
  readonly load: PercentageScore;
  readonly capabilities: readonly string[];
  readonly lastCommunication: Timestamp;
}

export interface SwarmGlobalState {
  readonly totalDirectives: number;
  readonly activeDirectives: number;
  readonly completedDirectives: number;
  readonly failedDirectives: number;
  readonly totalDrones: number;
  readonly activeDrones: number;
  readonly systemLoad: PercentageScore;
  readonly performanceScore: PercentageScore;
}

export interface ConsensusState {
  readonly algorithm: 'raft' | 'byzantine' | 'gossip' | 'paxos';
  readonly leader?: QueenId | PrincessId;
  readonly term: number;
  readonly lastConsensus: Timestamp;
  readonly participatingNodes: readonly SwarmEntityId[];
}

// =============================================================================
// UTILITY TYPES AND TYPE GUARDS
// =============================================================================

// Type predicate functions
export function isQueenId(value: string): value is QueenId {
  return value.startsWith('queen-') && value.length > 6;
}

export function isPrincessId(value: string): value is PrincessId {
  return value.startsWith('princess-') && value.length > 9;
}

export function isDroneId(value: string): value is DroneId {
  return value.startsWith('drone-') && value.length > 6;
}

export function isValidSwarmMessage(value: unknown): value is SwarmMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'from' in value &&
    'to' in value &&
    'type' in value &&
    'payload' in value &&
    'timestamp' in value
  );
}

export function isValidDirective(value: unknown): value is QueenDirective {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'queenId' in value &&
    'targetDomain' in value &&
    'priority' in value &&
    'payload' in value &&
    'createdAt' in value
  );
}

// Factory functions for creating branded types
export function createSwarmId(value: string): SwarmId {
  if (!value || value.length === 0) {
    throw new Error('SwarmId cannot be empty');
  }
  return value as SwarmId;
}

export function createQueenId(value: string): QueenId {
  if (!isQueenId(value)) {
    throw new Error('Invalid QueenId format');
  }
  return value;
}

export function createPrincessId(value: string): PrincessId {
  if (!isPrincessId(value)) {
    throw new Error('Invalid PrincessId format');
  }
  return value;
}

export function createDroneId(value: string): DroneId {
  if (!isDroneId(value)) {
    throw new Error('Invalid DroneId format');
  }
  return value;
}

export function createTimestamp(value?: number): Timestamp {
  return (value ?? Date.now()) as Timestamp;
}

export function createDuration(milliseconds: number): Duration {
  if (milliseconds < 0) {
    throw new Error('Duration cannot be negative');
  }
  return milliseconds as Duration;
}

// Type conversion utilities
export function princessDomainFromString(value: string): PrincessDomain {
  if (!Object.values(PrincessDomain).includes(value as PrincessDomain)) {
    throw new Error(`Invalid PrincessDomain: ${value}`);
  }
  return value as PrincessDomain;
}

export function taskPriorityFromString(value: string): TaskPriority {
  if (!Object.values(TaskPriority).includes(value as TaskPriority)) {
    throw new Error(`Invalid TaskPriority: ${value}`);
  }
  return value as TaskPriority;
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  // Base types
  SwarmId, QueenId, PrincessId, DroneId, DirectiveId, MissionId,
  Timestamp, Duration, Deadline,

  // Queen types
  QueenConfiguration, QueenDirective, QueenState, QueenPerformanceMetrics,
  DirectiveMetadata, ResourceRequirements,

  // Princess types
  PrincessConfiguration, PrincessDirectiveAcknowledgment, PrincessResponse,
  PrincessState, PrincessCapabilities, PrincessPerformanceMetrics,
  TaskDecomposition, SubTask, ExecutionMetrics,

  // Drone types
  DroneConfiguration, DroneTask, DroneTaskResult, DroneState,
  DronePerformanceMetrics, DroneHealthStatus, TaskConstraints,

  // Communication types
  SwarmMessage, SwarmCommunicationProtocol,

  // Coordination types
  SwarmCoordinationState, SwarmGlobalState, ConsensusState
};

export {
  // Enums
  TaskPriority, PrincessDomain, DirectiveStatus, DroneStatus,
  QueenStatus, PrincessStatus, DroneCapability, MessageType, MessagePriority,
  TaskResultStatus,

  // Type guards
  isQueenId, isPrincessId, isDroneId, isValidSwarmMessage, isValidDirective,

  // Factory functions
  createSwarmId, createQueenId, createPrincessId, createDroneId,
  createTimestamp, createDuration,

  // Utility functions
  princessDomainFromString, taskPriorityFromString
};