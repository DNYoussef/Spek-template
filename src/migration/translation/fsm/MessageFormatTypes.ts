import { ValidationResult } from '../../../types/validation-types';

/**
 * Message Format Types - Centralized type definitions
 * NASA Rule 10 Compliant: All types and interfaces for message format conversion
 */

// NASA Rule 10: Fixed bounds for all loops
export const MAX_FORMATS = 100;
export const MAX_CONVERSION_RULES = 500;
export const MAX_PARALLEL_CHUNKS = 10;
export const MAX_CONVERSION_HISTORY = 10000;
export const MAX_FIELD_DEPTH = 20;
export const MAX_ERROR_ENTRIES = 10;
export const MAX_ARRAY_ITEMS = 1000;
export const MAX_RETRY_ATTEMPTS = 3;
export const MAX_VALIDATION_ISSUES = 50;
export const MAX_BATCH_SIZE = 1000;

// FSM States for Message Format Conversion
export enum ConversionState {
  IDLE = 'idle',
  VALIDATING_FORMAT = 'validating_format',
  DESERIALIZING = 'deserializing',
  CONVERTING = 'converting',
  SERIALIZING = 'serializing',
  VALIDATING_RESULT = 'validating_result',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// FSM Events for state transitions
export enum ConversionEvent {
  START_CONVERSION = 'start_conversion',
  FORMAT_VALIDATED = 'format_validated',
  FORMAT_INVALID = 'format_invalid',
  DESERIALIZATION_COMPLETE = 'deserialization_complete',
  DESERIALIZATION_FAILED = 'deserialization_failed',
  CONVERSION_COMPLETE = 'conversion_complete',
  CONVERSION_FAILED = 'conversion_failed',
  SERIALIZATION_COMPLETE = 'serialization_complete',
  SERIALIZATION_FAILED = 'serialization_failed',
  VALIDATION_COMPLETE = 'validation_complete',
  VALIDATION_FAILED = 'validation_failed',
  RESET = 'reset',
  ERROR_OCCURRED = 'error_occurred'
}

export interface MessageFormat {
  name: string;
  version: string;
  contentType: string;
  encoding: string;
  schema: FormatSchema;
  characteristics: FormatCharacteristics;
  serialization: SerializationConfig;
  validation: ValidationConfig;
}

export interface FormatSchema {
  type: 'json' | 'xml' | 'avro' | 'protobuf' | 'yaml' | 'binary' | 'custom';
  definition: any; // JSON Schema, XSD, Avro schema, etc.
  namespace?: string;
  imports?: string[];
  extensions?: Record<string, any>;
}

export interface FormatCharacteristics {
  humanReadable: boolean;
  binaryFormat: boolean;
  selfDescribing: boolean;
  schemaEvolution: boolean;
  compression: string[];
  encryption: string[];
  streaming: boolean;
  size: 'compact' | 'medium' | 'verbose';
}

export interface SerializationConfig {
  serializer: string;
  deserializer: string;
  options: Record<string, any>;
  contentTypeMapping: Record<string, string>;
}

export interface ValidationConfig {
  validateOnSerialize: boolean;
  validateOnDeserialize: boolean;
  strictMode: boolean;
  allowedExtensions: string[];
}

export interface ConversionRule {
  id: string;
  name: string;
  sourceFormat: string;
  targetFormat: string;
  priority: number;
  converters: FieldConverter[];
  postProcessors: PostProcessor[];
  validationRules: ConversionValidationRule[];
  preserveMetadata: boolean;
  lossless: boolean;
}

export interface FieldConverter {
  sourceField: string;
  targetField: string;
  converterType: 'direct' | 'transform' | 'aggregate' | 'split' | 'compute';
  transformer?: FieldTransformer;
  defaultValue?: any;
  required: boolean;
  constraints?: FieldConstraint[];
}

export interface FieldTransformer {
  name: string;
  function: string; // JavaScript function as string
  parameters: TransformerParameter[];
  reversible: boolean;
  reverseFunction?: string;
}

export interface TransformerParameter {
  name: string;
  type: string;
  defaultValue?: any;
  description: string;
}

export interface PostProcessor {
  name: string;
  stage: 'pre_conversion' | 'post_conversion' | 'validation';
  processor: string; // JavaScript function as string
  parameters: Record<string, any>;
  critical: boolean;
}

export interface ConversionValidationRule {
  name: string;
  validator: string; // JavaScript function as string
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
  stage: 'pre' | 'post' | 'both';
}

export interface ConversionRequest {
  message: any;
  sourceFormat: string;
  targetFormat: string;
  options: ConversionOptions;
  metadata?: ConversionMetadata;
}

export interface ConversionOptions {
  strict: boolean;
  preserveUnknownFields: boolean;
  validateResult: boolean;
  compression?: string;
  encoding?: string;
  pretty?: boolean;
  includeMetadata?: boolean;
}

export interface ConversionMetadata {
  messageId: string;
  timestamp: Date;
  source: string;
  correlationId?: string;
  traceId?: string;
  context?: Record<string, any>;
}

export interface ConversionResult {
  success: boolean;
  convertedMessage: any;
  originalMessage: any;
  sourceFormat: string;
  targetFormat: string;
  appliedRules: string[];
  metadata: ConversionResultMetadata;
  validation: ValidationResult;
  performance: ConversionPerformanceMetrics;
  warnings: ConversionWarning[];
  errors: ConversionError[];
}

export interface ConversionResultMetadata {
  conversionId: string;
  timestamp: Date;
  duration: number;
  dataLoss: boolean;
  fidelity: number;
  compressionRatio?: number;
  sizeChange: SizeChange;
}

export interface SizeChange {
  originalSize: number;
  convertedSize: number;
  compressionRatio: number;
  sizeIncrease: number;
}


export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

export interface ConversionPerformanceMetrics {
  deserializationTime: number;
  conversionTime: number;
  serializationTime: number;
  validationTime: number;
  totalTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface ConversionWarning {
  code: string;
  message: string;
  field?: string;
  severity: 'low' | 'medium' | 'high';
  impact: string;
  suggestion?: string;
}

export interface ConversionError {
  code: string;
  message: string;
  field?: string;
  cause?: Error;
  recoverable: boolean;
  suggestions: string[];
}

export interface BatchConversionRequest {
  messages: ConversionRequest[];
  options: BatchConversionOptions;
}

export interface BatchConversionOptions {
  parallelism: number;
  stopOnError: boolean;
  validateAll: boolean;
  generateReport: boolean;
  preserveOrder: boolean;
}

export interface BatchConversionResult {
  success: boolean;
  totalMessages: number;
  successfulConversions: number;
  failedConversions: number;
  results: ConversionResult[];
  summary: BatchConversionSummary;
  report?: ConversionReport;
}

export interface BatchConversionSummary {
  totalTime: number;
  averageConversionTime: number;
  throughput: number;
  totalDataLoss: boolean;
  averageFidelity: number;
  formatDistribution: FormatDistribution[];
  commonErrors: ErrorDistribution[];
  performance: BatchPerformanceMetrics;
}

export interface FormatDistribution {
  format: string;
  count: number;
  percentage: number;
  successRate: number;
}

export interface ErrorDistribution {
  errorCode: string;
  count: number;
  percentage: number;
  affectedFormats: string[];
}

export interface BatchPerformanceMetrics {
  totalCpuTime: number;
  peakMemoryUsage: number;
  averageMemoryUsage: number;
  diskIoOperations: number;
  networkOperations: number;
}

export interface ConversionReport {
  summary: BatchConversionSummary;
  detailedResults: ConversionResult[];
  formatAnalysis: FormatAnalysis[];
  ruleEffectiveness: RuleEffectiveness[];
  recommendations: ConversionRecommendation[];
  qualityMetrics: ConversionQualityMetrics;
}

export interface FormatAnalysis {
  format: string;
  messageCount: number;
  averageSize: number;
  successRate: number;
  commonIssues: string[];
  performance: FormatPerformanceMetrics;
}

export interface FormatPerformanceMetrics {
  averageConversionTime: number;
  throughput: number;
  memoryEfficiency: number;
  cpuEfficiency: number;
}

export interface RuleEffectiveness {
  ruleId: string;
  applicationsCount: number;
  successRate: number;
  averageExecutionTime: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface ConversionRecommendation {
  type: 'performance' | 'accuracy' | 'rule_optimization' | 'format_specific';
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  impact: string;
  details: string;
}

export interface ConversionQualityMetrics {
  overallFidelity: number;
  dataLossRate: number;
  validationPassRate: number;
  performanceScore: number;
  reliabilityScore: number;
  userSatisfactionScore: number;
}

export interface ConversionPathValidation {
  valid: boolean;
  path: 'direct' | 'indirect' | 'none';
  intermediateFormats?: string[];
  rules: ConversionRule[];
  estimatedFidelity: number;
  estimatedPerformance: PerformanceEstimate;
  suggestions?: string[];
}

export interface PerformanceEstimate {
  time: number;
  memory: number;
  cpu: number;
}

export interface IndirectConversionPath {
  intermediates: string[];
  rules: ConversionRule[];
  estimatedFidelity: number;
  estimatedPerformance: PerformanceEstimate;
}

export interface FieldConstraint {
  type: string;
  value: any;
  message?: string;
}

export interface MessageField {
  path: string;
  value: any;
  type: string;
}

export interface RuleConversionResult {
  success: boolean;
  convertedMessage: any;
  warnings: ConversionWarning[];
  error?: string;
}

export interface ConversionRecord {
  conversionId: string;
  timestamp: Date;
  sourceFormat: string;
  targetFormat: string;
  success: boolean;
  duration: number;
  fidelity: number;
}

export interface PerformanceData {
  startTime?: number;
  startMemory?: number;
  memoryUsage: number;
  cpuUsage: number;
}

// Abstract base classes for serialization
export abstract class MessageSerializer {
  abstract serialize(message: any, format: MessageFormat, options: ConversionOptions): Promise<any>;
}

export abstract class MessageDeserializer {
  abstract deserialize(message: any, format: MessageFormat): Promise<any>;
}

export abstract class FormatValidator {
  abstract validate(message: any, format: MessageFormat): Promise<ValidationResult>;
}