/**
 * Protocol Translator Types - Core Type Definitions
 * Part of ProtocolTranslator decomposition
 * NASA Rule 10 compliant - focused type definitions
 */

export interface TranslationRequest {
  sourceProtocol: string;
  targetProtocol: string;
  sourceVersion: string;
  targetVersion: string;
  message: ProtocolMessage;
  options?: TranslationOptions;
}

export interface TranslationResult {
  translationId: string;
  success: boolean;
  originalMessage: ProtocolMessage | null;
  translatedMessage: ProtocolMessage | null;
  rulesApplied: string[];
  duration: number;
  fidelity: number;
  errors: string[];
  warnings: string[];
}

export interface TranslationOptions {
  useCache?: boolean;
  strictValidation?: boolean;
  allowPartialTranslation?: boolean;
  maxRetries?: number;
}

export interface ProtocolMessage {
  id: string;
  type: string;
  payload: Record<string, any>;
  metadata: MessageMetadata;
  timestamp: number;
}

export interface MessageMetadata {
  sourceProtocol: string;
  targetProtocol?: string;
  version: string;
  encoding: string;
  compression?: string;
  security?: SecurityMetadata;
}

export interface SecurityMetadata {
  encrypted: boolean;
  algorithm?: string;
  keyId?: string;
  signature?: string;
}

export interface TranslationRule {
  id: string;
  name: string;
  sourceProtocol: string;
  targetProtocol: string;
  sourceVersion: string;
  targetVersion: string;
  priority: number;
  bidirectional: boolean;
  transformations: FieldTransformation[];
  conditions: TranslationCondition[];
  validUntil?: Date;
}

export interface FieldTransformation {
  type: 'map' | 'transform' | 'aggregate' | 'split' | 'default' | 'remove';
  sourceField: string;
  targetField: string;
  required: boolean;
  transformation?: TransformationFunction;
  validation?: FieldValidation;
}

export interface TransformationFunction {
  name: string;
  implementation: string;
  parameters: Parameter[];
  returnType: string;
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
}

export interface FieldValidation {
  type: string;
  rules: ValidationRule[];
  errorHandling: 'strict' | 'lenient' | 'ignore';
}

export interface ValidationRule {
  name: string;
  condition: string;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
}

export interface TranslationCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'regex';
  value: any;
  caseSensitive?: boolean;
}

export interface BatchTranslationRequest {
  messages: ProtocolMessage[];
  sourceProtocol: string;
  targetProtocol: string;
  sourceVersion: string;
  targetVersion: string;
  options: BatchTranslationOptions;
}

export interface BatchTranslationOptions {
  parallelism: number;
  stopOnError: boolean;
  validateResults: boolean;
  generateReport: boolean;
  retryFailures: boolean;
}

export interface BatchTranslationResult {
  success: boolean;
  totalMessages: number;
  successfulTranslations: number;
  failedTranslations: number;
  results: TranslationResult[];
  summary: BatchSummary;
  report?: TranslationReport;
}

export interface BatchSummary {
  averageTranslationTime: number;
  totalDataLoss: boolean;
  averageFidelity: number;
  commonErrors: ErrorSummary[];
  performance: BatchPerformanceMetrics;
}

export interface ErrorSummary {
  errorCode: string;
  count: number;
  percentage: number;
  examples: string[];
}

export interface BatchPerformanceMetrics {
  totalTime: number;
  averageMessageTime: number;
  throughput: number;
  memoryPeak: number;
  cpuUtilization: number;
}

export interface TranslationReport {
  summary: BatchSummary;
  detailedResults: TranslationResult[];
  ruleUsageStatistics: RuleUsageStats[];
  recommendations: TranslationRecommendation[];
  qualityMetrics: QualityMetrics;
}

export interface RuleUsageStats {
  ruleId: string;
  timesApplied: number;
  averageExecutionTime: number;
  successRate: number;
  errorRate: number;
}

export interface TranslationRecommendation {
  type: 'optimization' | 'rule_improvement' | 'schema_update' | 'performance';
  message: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  details: string;
}

export interface QualityMetrics {
  overallFidelity: number;
  dataLossPercentage: number;
  validationPassRate: number;
  performanceScore: number;
  reliabilityScore: number;
}

export interface ProtocolSchema {
  protocol: string;
  version: string;
  schema: any;
  messageTypes: MessageTypeDefinition[];
  constraints: SchemaConstraint[];
  compatibility: CompatibilityInfo;
}

export interface MessageTypeDefinition {
  type: string;
  description: string;
  fields: FieldDefinition[];
  required: string[];
  examples: any[];
}

export interface FieldDefinition {
  name: string;
  type: string;
  description: string;
  constraints?: FieldConstraint[];
  format?: string;
  default?: any;
}

export interface FieldConstraint {
  type: 'minLength' | 'maxLength' | 'pattern' | 'enum' | 'range' | 'custom';
  value: any;
  message?: string;
}

export interface SchemaConstraint {
  field: string;
  constraint: FieldConstraint;
  scope: 'global' | 'message_type' | 'conditional';
}

export interface CompatibilityInfo {
  backwardCompatible: string[];
  forwardCompatible: string[];
  breaking: BreakingChange[];
  deprecated: DeprecatedField[];
}

export interface BreakingChange {
  version: string;
  field: string;
  changeType: 'removed' | 'renamed' | 'type_changed' | 'constraint_added';
  description: string;
  migrationPath?: string;
}

export interface DeprecatedField {
  field: string;
  deprecatedIn: string;
  removedIn?: string;
  replacement?: string;
  reason: string;
}

export interface TranslationCache {
  enabled: boolean;
  maxSize: number;
  ttl: number;
  statistics: CacheStatistics;
}

export interface CacheStatistics {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  averageAge: number;
}

export interface TranslationEngine {
  id: string;
  name: string;
  version: string;
  capabilities: EngineCapability[];
  performance: EnginePerformance;
  status: EngineStatus;
}

export interface EngineCapability {
  sourceProtocol: string;
  targetProtocol: string;
  supportedVersions: string[];
  features: string[];
  limitations: string[];
}

export interface EnginePerformance {
  averageLatency: number;
  throughput: number;
  errorRate: number;
  fidelityScore: number;
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

export interface EngineStatus {
  state: 'active' | 'inactive' | 'maintenance' | 'error';
  uptime: number;
  lastHealthCheck: number;
  healthScore: number;
  errors: EngineError[];
}

export interface EngineError {
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context: Record<string, any>;
  resolved: boolean;
}

export interface ValidationEngine {
  validateMessage(message: ProtocolMessage, schema: ProtocolSchema): Promise<ValidationResult>;
  validateRule(rule: TranslationRule): Promise<RuleValidationResult>;
  validateTranslation(original: ProtocolMessage, translated: ProtocolMessage): Promise<TranslationValidationResult>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  recommendation: string;
}

export interface RuleValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
  suggestions: string[];
}

export interface TranslationValidationResult {
  fidelityScore: number;
  dataLoss: boolean;
  structuralChanges: StructuralChange[];
  semanticChanges: SemanticChange[];
  qualityAssessment: QualityAssessment;
}

export interface StructuralChange {
  type: 'field_added' | 'field_removed' | 'field_renamed' | 'type_changed';
  field: string;
  oldValue?: any;
  newValue?: any;
  impact: 'low' | 'medium' | 'high';
}

export interface SemanticChange {
  type: 'meaning_preserved' | 'meaning_altered' | 'meaning_lost';
  field: string;
  description: string;
  confidence: number;
}

export interface QualityAssessment {
  overall: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  usability: number;
  recommendations: string[];
}

export interface TranslationContext {
  sessionId: string;
  userId?: string;
  timestamp: number;
  environment: 'development' | 'staging' | 'production';
  metadata: Record<string, any>;
}

export interface TranslationEvent {
  type: 'translation_started' | 'translation_completed' | 'translation_failed' | 'rule_applied' | 'validation_performed';
  timestamp: number;
  context: TranslationContext;
  data: Record<string, any>;
}

export interface TranslationMetrics {
  totalTranslations: number;
  successfulTranslations: number;
  failedTranslations: number;
  averageLatency: number;
  averageFidelity: number;
  rulesUsed: Record<string, number>;
  errorFrequency: Record<string, number>;
}

export interface ProtocolRegistry {
  protocols: Map<string, ProtocolDefinition>;
  relationships: Map<string, ProtocolRelationship[]>;
  capabilities: Map<string, TranslationCapability>;
}

export interface ProtocolDefinition {
  name: string;
  version: string;
  description: string;
  schema: ProtocolSchema;
  examples: ProtocolMessage[];
  documentation: string;
}

export interface ProtocolRelationship {
  sourceProtocol: string;
  targetProtocol: string;
  relationshipType: 'compatible' | 'translatable' | 'incompatible';
  translationRules: string[];
  effort: 'low' | 'medium' | 'high';
}

export interface TranslationCapability {
  protocolPair: string;
  bidirectional: boolean;
  fidelityScore: number;
  performanceScore: number;
  limitations: string[];
}

export type TranslationEventHandler = (event: TranslationEvent) => void;
export type TranslationErrorHandler = (error: Error, context: TranslationContext) => void;
export type TranslationProgressHandler = (progress: TranslationProgress) => void;

export interface TranslationProgress {
  completed: number;
  total: number;
  percentage: number;
  currentMessage?: string;
  estimatedTimeRemaining?: number;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}