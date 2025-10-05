import { ValidationResult } from '../../types/validation-types';

/**
 * DSPy Integration Type Definitions
 * Complete type system for DSPy-SPEK integration
 * NASA Rule 10 compliant with comprehensive validation
 */

// Core DSPy Types
export interface DSPySignature {
  id: string;
  name: string;
  inputs: DSPyField[];
  outputs: DSPyField[];
  description: string;
  version: string;
  metadata: SignatureMetadata;
}

export interface DSPyField {
  name: string;
  type: FieldType;
  description: string;
  validation?: ValidationRule;
  required: boolean;
  defaultValue?: any;
}

export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
  JSON = 'json'
}

export interface ValidationRule {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  allowedValues?: any[];
  customValidator?: (value: any) => boolean;
}

export interface SignatureMetadata {
  category: SignatureCategory;
  communicationType: CommunicationType;
  agentTypes: AgentType[];
  qualityRequirements: QualityRequirement[];
  performanceProfile: PerformanceProfile;
  createdAt: Date;
  updatedAt: Date;
}

export enum SignatureCategory {
  QUEEN_TO_PRINCESS = 'queen_to_princess',
  PRINCESS_TO_DRONE = 'princess_to_drone',
  DRONE_TO_PRINCESS = 'drone_to_princess',
  PRINCESS_TO_QUEEN = 'princess_to_queen',
  CONTEXT_COORDINATION = 'context_coordination',
  QUALITY_ASSESSMENT = 'quality_assessment'
}

export enum CommunicationType {
  STRATEGIC_DIRECTIVE = 'strategic_directive',
  TASK_ASSIGNMENT = 'task_assignment',
  STATUS_REPORT = 'status_report',
  RESOURCE_REQUEST = 'resource_request',
  ISSUE_ESCALATION = 'issue_escalation',
  COMPLETION_REPORT = 'completion_report',
  QUALITY_VALIDATION = 'quality_validation'
}

export enum AgentType {
  QUEEN = 'queen',
  PRINCESS = 'princess',
  DRONE = 'drone',
  COORDINATOR = 'coordinator',
  SPECIALIST = 'specialist'
}

// Communication Context Types
export interface CommunicationContext {
  id: string;
  sourceAgent: AgentIdentity;
  targetAgent: AgentIdentity;
  communicationType: CommunicationType;
  priority: Priority;
  contextDNA: ContextDNAReference;
  qualityRequirements: QualityRequirement[];
  timestamp: Date;
  sessionId?: string;
  parentContext?: string;
}

export interface AgentIdentity {
  id: string;
  type: AgentType;
  domain?: DomainType;
  capabilities: string[];
  modelAssignment: ModelAssignment;
}

export enum DomainType {
  ARCHITECTURE = 'Architecture',
  DEVELOPMENT = 'Development',
  QUALITY = 'Quality',
  SECURITY = 'Security',
  PERFORMANCE = 'Performance',
  DOCUMENTATION = 'Documentation'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ModelAssignment {
  model: AIModel;
  platform: AIPlatform;
  mcpServers: string[];
  configuration: ModelConfiguration;
}

export enum AIModel {
  GEMINI_PRO = 'gemini-2.5-pro',
  GEMINI_FLASH = 'gemini-2.5-flash',
  GPT5 = 'gpt-5',
  GPT5_CODEX = 'gpt-5-codex',
  CLAUDE_OPUS = 'claude-opus-4.1',
  CLAUDE_SONNET = 'claude-sonnet-4'
}

export enum AIPlatform {
  GEMINI = 'gemini',
  OPENAI = 'openai',
  CLAUDE = 'claude'
}

export interface ModelConfiguration {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  sequentialThinking?: boolean;
}

// Context DNA Integration Types
export interface ContextDNAReference {
  coordinationKey: string;
  memoryReferences: string[];
  relevanceScore: number;
  pruningStrategy: PruningStrategy;
  evolutionHistory: ContextEvolution[];
}

export enum PruningStrategy {
  RELEVANCE_BASED = 'relevance_based',
  TIME_BASED = 'time_based',
  SIZE_BASED = 'size_based',
  INTELLIGENT = 'intelligent',
  HYBRID = 'hybrid'
}

export interface ContextEvolution {
  timestamp: Date;
  change: ContextChange;
  reason: string;
  impact: number;
}

export enum ContextChange {
  ADDED = 'added',
  MODIFIED = 'modified',
  REMOVED = 'removed',
  PRUNED = 'pruned',
  MERGED = 'merged'
}

// Quality and Performance Types
export interface QualityRequirement {
  type: QualityType;
  threshold: number;
  measurement: QualityMeasurement;
  enforcement: EnforcementLevel;
}

export enum QualityType {
  NASA_COMPLIANCE = 'nasa_compliance',
  THEATER_DETECTION = 'theater_detection',
  COMMUNICATION_CLARITY = 'communication_clarity',
  CONTEXT_EFFICIENCY = 'context_efficiency',
  RESPONSE_ACCURACY = 'response_accuracy',
  PERFORMANCE_BASELINE = 'performance_baseline'
}

export enum QualityMeasurement {
  PERCENTAGE = 'percentage',
  SCORE = 'score',
  RATE = 'rate',
  TIME = 'time',
  COUNT = 'count',
  BINARY = 'binary'
}

export enum EnforcementLevel {
  ADVISORY = 'advisory',
  WARNING = 'warning',
  BLOCKING = 'blocking',
  CRITICAL = 'critical'
}

export interface PerformanceProfile {
  expectedResponseTime: number;
  maxResponseTime: number;
  targetThroughput: number;
  memoryUsageLimit: number;
  cpuUsageLimit: number;
  qualityThresholds: QualityThreshold[];
}

export interface QualityThreshold {
  metric: string;
  minimum: number;
  target: number;
  maximum?: number;
}

// Optimization Types
export interface OptimizationResult {
  signatureId: string;
  success: boolean;
  improvementScore: number;
  optimizedSignature: DSPySignature | null;
  metrics: OptimizationMetrics;
  timestamp: Date;
  error?: Error;
  validationResults?: ValidationResult[];
}

export interface OptimizationMetrics {
  communicationClarity: number;
  contextEfficiency: number;
  responseTime: number;
  errorRate: number;
  qualityScore: number;
  improvementScore: number;
}


// A/B Testing Types
export interface ABTestResult {
  testId: string;
  controlMetrics: OptimizationMetrics;
  treatmentMetrics: OptimizationMetrics;
  statisticalSignificance: number;
  improvementScore: number;
  confidenceLevel: number;
  sampleSize: number;
  startTime: Date;
  endTime: Date | null;
  success: boolean;
  error?: Error;
}

export interface TestConfiguration {
  sampleSizePerGroup: number;
  significanceLevel: number;
  minimumEffect: number;
  testDuration: number;
  randomizationMethod: RandomizationMethod;
}

export enum RandomizationMethod {
  SIMPLE = 'simple',
  STRATIFIED = 'stratified',
  BLOCK = 'block',
  CLUSTER = 'cluster'
}

// Performance Monitoring Types
export interface PerformanceBaseline {
  signatureId: string;
  baselineMetrics: OptimizationMetrics;
  collectionPeriod: DateRange;
  sampleSize: number;
  confidence: number;
  variance: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PerformanceSnapshot {
  timestamp: Date;
  metrics: OptimizationMetrics;
  systemLoad: SystemLoad;
  communicationVolume: CommunicationVolume;
  qualityIndicators: QualityIndicator[];
}

export interface SystemLoad {
  cpuUsage: number;
  memoryUsage: number;
  networkIO: number;
  diskIO: number;
  activeConnections: number;
}

export interface CommunicationVolume {
  totalCommunications: number;
  communicationsByType: Map<CommunicationType, number>;
  communicationsByPriority: Map<Priority, number>;
  averageSize: number;
  peakThroughput: number;
}

export interface QualityIndicator {
  metric: string;
  value: number;
  threshold: number;
  status: QualityStatus;
  trend: TrendDirection;
}

export enum QualityStatus {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  ACCEPTABLE = 'acceptable',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export enum TrendDirection {
  IMPROVING = 'improving',
  STABLE = 'stable',
  DECLINING = 'declining',
  VOLATILE = 'volatile'
}

// Caching Types
export interface SignatureCache {
  store(signatureId: string, optimization: OptimizationResult): void;
  get(signatureId: string): OptimizationResult | null;
  invalidate(signatureId: string): void;
  clear(): void;
  size(): number;
}

export interface CacheEntry {
  key: string;
  value: OptimizationResult;
  timestamp: Date;
  accessCount: number;
  lastAccessed: Date;
  expiresAt?: Date;
}

export interface CacheConfiguration {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  evictionPolicy: EvictionPolicy;
  compressionEnabled: boolean;
}

export enum EvictionPolicy {
  LRU = 'lru', // Least Recently Used
  LFU = 'lfu', // Least Frequently Used
  FIFO = 'fifo', // First In First Out
  TTL = 'ttl' // Time To Live
}

// Theater Detection Enhancement Types
export interface TheaterDetectionEnhancement {
  communicationId: string;
  baselineTheaterScore: number;
  enhancedTheaterScore: number;
  improvementFactors: TheaterImprovementFactor[];
  confidence: number;
  validationChecks: TheaterValidationCheck[];
}

export interface TheaterImprovementFactor {
  factor: string;
  impact: number;
  evidence: string[];
  confidence: number;
}

export interface TheaterValidationCheck {
  checkType: TheaterCheckType;
  result: boolean;
  score: number;
  details: string;
}

export enum TheaterCheckType {
  SIGNATURE_CONSISTENCY = 'signature_consistency',
  PERFORMANCE_CORRELATION = 'performance_correlation',
  PATTERN_AUTHENTICITY = 'pattern_authenticity',
  QUALITY_CORRELATION = 'quality_correlation',
  IMPROVEMENT_VALIDITY = 'improvement_validity'
}

// Error Handling Types
export interface DSPyIntegrationError extends Error {
  code: ErrorCode;
  context: ErrorContext;
  severity: ErrorSeverity;
  recoverable: boolean;
  timestamp: Date;
}

export enum ErrorCode {
  SIGNATURE_VALIDATION_FAILED = 'SIGNATURE_VALIDATION_FAILED',
  OPTIMIZATION_FAILED = 'OPTIMIZATION_FAILED',
  COMMUNICATION_FAILED = 'COMMUNICATION_FAILED',
  CACHE_ERROR = 'CACHE_ERROR',
  ABTEST_FAILED = 'ABTEST_FAILED',
  DEPLOYMENT_FAILED = 'DEPLOYMENT_FAILED',
  MONITORING_ERROR = 'MONITORING_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export interface ErrorContext {
  signatureId?: string;
  communicationId?: string;
  testId?: string;
  operation: string;
  parameters: Record<string, any>;
  stackTrace?: string;
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Configuration Types
export interface DSPyIntegrationConfig {
  enabled: boolean;
  optimization: OptimizationConfig;
  caching: CacheConfiguration;
  monitoring: MonitoringConfig;
  abTesting: ABTestingConfig;
  qualityGates: QualityGateConfig;
  errorHandling: ErrorHandlingConfig;
}

export interface OptimizationConfig {
  enabledSignatures: string[];
  learningRate: number;
  maxIterations: number;
  convergenceThreshold: number;
  batchSize: number;
  parallelOptimizations: number;
}

export interface MonitoringConfig {
  enabled: boolean;
  metricsRetention: number; // Days
  alerting: AlertingConfig;
  dashboards: DashboardConfig;
}

export interface AlertingConfig {
  enabled: boolean;
  thresholds: AlertThreshold[];
  channels: AlertChannel[];
}

export interface AlertThreshold {
  metric: string;
  operator: ComparisonOperator;
  value: number;
  severity: ErrorSeverity;
}

export enum ComparisonOperator {
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  EQUAL = 'eq',
  NOT_EQUAL = 'ne',
  GREATER_EQUAL = 'gte',
  LESS_EQUAL = 'lte'
}

export interface AlertChannel {
  type: AlertChannelType;
  configuration: Record<string, any>;
  enabled: boolean;
}

export enum AlertChannelType {
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  LOG = 'log'
}

export interface DashboardConfig {
  enabled: boolean;
  refreshInterval: number;
  charts: ChartConfig[];
}

export interface ChartConfig {
  type: ChartType;
  metrics: string[];
  timeRange: TimeRange;
  refreshRate: number;
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  SCATTER = 'scatter',
  HEATMAP = 'heatmap'
}

export enum TimeRange {
  LAST_HOUR = '1h',
  LAST_DAY = '24h',
  LAST_WEEK = '7d',
  LAST_MONTH = '30d',
  CUSTOM = 'custom'
}

export interface ABTestingConfig {
  enabled: boolean;
  defaultSampleSize: number;
  defaultSignificanceLevel: number;
  maxConcurrentTests: number;
  autoApprovalThreshold: number;
}

export interface QualityGateConfig {
  enabled: boolean;
  thresholds: QualityThreshold[];
  enforcementLevel: EnforcementLevel;
  bypassRoles: string[];
}

export interface ErrorHandlingConfig {
  retryAttempts: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  fallbackEnabled: boolean;
  loggingLevel: LogLevel;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// Event Types for FSM Integration
export interface DSPyEvent {
  type: string;
  payload: Record<string, any>;
  timestamp: Date;
  source: string;
  target?: string;
}

export interface StateTransition {
  fromState: string;
  toState: string;
  event: string;
  guard?: (context: any) => boolean;
  action?: (context: any) => void;
}

export interface FSMConfiguration {
  initialState: string;
  states: string[];
  events: string[];
  transitions: StateTransition[];
  guards: Record<string, (context: any) => boolean>;
  actions: Record<string, (context: any) => void>;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: dspy-types-001
// inputs: ["Type system requirements", "Integration patterns"]
// tools_used: ["sequential-thinking", "memory", "filesystem"]
// versions: {"model":"gemini-2.5-pro","prompt":"type-system-v1"}
// === END FOOTER ===