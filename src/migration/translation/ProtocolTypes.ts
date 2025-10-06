export interface ProtocolMessage {
  id: string;
  type: string;
  version: string;
  timestamp: Date;
  headers: Record<string, any>;
  payload: any;
  metadata: MessageMetadata;
  checksum?: string;
}

export interface MessageMetadata {
  sourceProtocol: string;
  targetProtocol: string;
  contentType: string;
  encoding: string;
  compression?: string;
  encryption?: EncryptionMetadata;
  routing?: RoutingMetadata;
}

export interface EncryptionMetadata {
  algorithm: string;
  keyId: string;
  initVector?: string;
  signature?: string;
}

export interface RoutingMetadata {
  source: string;
  destination: string;
  priority: number;
  ttl?: number;
  retryPolicy?: RetryPolicy;
}

export interface TranslationRule {
  id: string;
  name: string;
  sourceProtocol: string;
  targetProtocol: string;
  sourceVersion: string;
  targetVersion: string;
  transformations: FieldTransformation[];
  conditions: TranslationCondition[];
  priority: number;
  bidirectional: boolean;
  validUntil?: Date;
}

export interface FieldTransformation {
  type: 'map' | 'transform' | 'aggregate' | 'split' | 'default' | 'remove';
  sourceField: string;
  targetField: string;
  transformation?: TransformationFunction;
  parameters?: Record<string, any>;
  required: boolean;
  validation?: FieldValidation;
}

export interface TransformationFunction {
  name: string;
  implementation: string;
  parameters: Parameter[];
  returnType: string;
  description: string;
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description?: string;
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

export interface TranslationResult {
  success: boolean;
  translatedMessage: ProtocolMessage | null;
  originalMessage: ProtocolMessage;
  appliedRules: string[];
  warnings: TranslationWarning[];
  errors: TranslationError[];
  metadata: TranslationMetadata;
  performance: PerformanceMetrics;
}

export interface TranslationWarning {
  code: string;
  message: string;
  field?: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export interface TranslationError {
  code: string;
  message: string;
  field?: string;
  cause?: Error;
  recoverable: boolean;
  suggestions: string[];
}

export interface TranslationMetadata {
  translationId: string;
  timestamp: Date;
  duration: number;
  rulesEvaluated: number;
  transformationsApplied: number;
  dataLoss: boolean;
  fidelity: number;
}

export interface PerformanceMetrics {
  translationTime: number;
  validationTime: number;
  serializationTime: number;
  totalTime: number;
  memoryUsage: number;
  cpuUsage: number;
  response_time_ms?: number; // Response time in milliseconds (optional)
  token_count?: number; // Token count for AI operations (optional)
  user_satisfaction_estimate?: number; // User satisfaction estimate 0-1 (optional)
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

export interface BatchTranslationRequest {
  messages: ProtocolMessage[];
  sourceProtocol: string;
  targetProtocol: string;
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

export interface TranslationOptions {
  useCache?: boolean;
  strictValidation?: boolean;
  allowInvalidTarget?: boolean;
}

export interface RuleApplicationResult {
  success: boolean;
  message: ProtocolMessage;
  transformationsApplied: number;
  warnings: TranslationWarning[];
  error?: string;
}

export interface TransformationResult {
  success: boolean;
  transformedMessage: ProtocolMessage;
  warnings: TranslationWarning[];
  error?: string;
}

export interface MessageValidationResult {
  valid: boolean;
  warnings?: string[];
  errors?: string[];
  error?: Error;
}

export interface FieldInfo {
  path: string;
  value: any;
  type: string;
}

export interface TranslationPathValidation {
  valid: boolean;
  path: 'direct' | 'indirect' | 'none';
  intermediateProtocols?: string[];
  rules: TranslationRule[];
  estimatedFidelity: number;
  suggestions?: string[];
}

export interface IndirectTranslationPath {
  intermediates: string[];
  rules: TranslationRule[];
  estimatedFidelity: number;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
}

// FSM State Enums
export enum ProtocolState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  VALIDATING_SOURCE = 'VALIDATING_SOURCE',
  FINDING_RULES = 'FINDING_RULES',
  APPLYING_TRANSFORMATIONS = 'APPLYING_TRANSFORMATIONS',
  VALIDATING_TARGET = 'VALIDATING_TARGET',
  CALCULATING_FIDELITY = 'CALCULATING_FIDELITY',
  CACHING_RESULT = 'CACHING_RESULT',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum ProtocolEvent {
  START_TRANSLATION = 'START_TRANSLATION',
  SOURCE_VALIDATION_SUCCESS = 'SOURCE_VALIDATION_SUCCESS',
  SOURCE_VALIDATION_FAILED = 'SOURCE_VALIDATION_FAILED',
  RULES_FOUND = 'RULES_FOUND',
  NO_RULES_FOUND = 'NO_RULES_FOUND',
  TRANSFORMATIONS_SUCCESS = 'TRANSFORMATIONS_SUCCESS',
  TRANSFORMATIONS_FAILED = 'TRANSFORMATIONS_FAILED',
  TARGET_VALIDATION_SUCCESS = 'TARGET_VALIDATION_SUCCESS',
  TARGET_VALIDATION_FAILED = 'TARGET_VALIDATION_FAILED',
  FIDELITY_CALCULATED = 'FIDELITY_CALCULATED',
  CACHING_COMPLETE = 'CACHING_COMPLETE',
  TRANSLATION_COMPLETE = 'TRANSLATION_COMPLETE',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RESET = 'RESET'
}