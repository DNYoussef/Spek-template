/**
 * dspy-integration.types.ts - DSPy Integration Type Definitions
 * @stub true
 * @architecture DSPy signature and optimization type system
 */

// DSPy signature definition
export interface DSPySignature {
  readonly id: string;
  readonly name: string;
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly description: string;
  readonly examples: readonly SignatureExample[];
  readonly version: string;
}

// Signature example
export interface SignatureExample {
  readonly inputs: Record<string, unknown>;
  readonly outputs: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

// Signature cache
export interface SignatureCache {
  readonly signatures: ReadonlyMap<string, DSPySignature>;
  readonly hitRate: number;
  readonly size: number;
  readonly maxSize: number;
}

// Optimization result
export interface OptimizationResult {
  readonly success: boolean;
  readonly signatureId: string;
  readonly optimizedInputs: Record<string, unknown>;
  readonly optimizedOutputs: Record<string, unknown>;
  readonly improvementScore: number;
  readonly iterations: number;
  readonly duration: number;
}

// Communication context
export interface CommunicationContext {
  readonly sessionId: string;
  readonly agentId: string;
  readonly messageId: string;
  readonly timestamp: number;
  readonly metadata: Record<string, unknown>;
  readonly history: readonly CommunicationEvent[];
}

// Communication event
export interface CommunicationEvent {
  readonly type: 'request' | 'response' | 'error' | 'optimization';
  readonly timestamp: number;
  readonly data: Record<string, unknown>;
  readonly duration?: number;
}

// DSPy optimizer configuration
export interface DSPyOptimizerConfig {
  readonly maxIterations: number;
  readonly targetScore: number;
  readonly learningRate: number;
  readonly batchSize: number;
  readonly cacheEnabled: boolean;
}

// Additional exports for integration configuration
export interface DSPyIntegrationConfig {
  readonly enabled: boolean;
  readonly endpoint: string;
  readonly apiKey: string;
  readonly timeout: number;
  readonly retryAttempts: number;
  readonly optimizerConfig: DSPyOptimizerConfig;
  readonly cacheConfig: CacheConfiguration;
}

export interface CacheConfiguration {
  readonly enabled: boolean;
  readonly maxSize: number;
  readonly ttl: number;
  readonly evictionPolicy: EvictionPolicy;
}

export enum EvictionPolicy {
  LRU = 'LRU',
  LFU = 'LFU',
  FIFO = 'FIFO',
  TTL = 'TTL'
}

export interface OptimizationConfig {
  readonly enabled: boolean;
  readonly strategy: 'aggressive' | 'balanced' | 'conservative';
  readonly targetMetrics: readonly string[];
  readonly baseline: PerformanceBaseline;
}

export interface PerformanceBaseline {
  readonly throughput: number;
  readonly latency: number;
  readonly accuracy: number;
  readonly cost: number;
}

export interface OptimizationMetrics {
  readonly throughputImprovement: number;
  readonly latencyReduction: number;
  readonly accuracyGain: number;
  readonly costReduction: number;
  readonly overallScore: number;
}

export interface MonitoringConfig {
  readonly enabled: boolean;
  readonly interval: number;
  readonly metrics: readonly string[];
  readonly alerts: readonly AlertChannelType[];
  readonly logLevel: LogLevel;
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export enum AlertChannelType {
  EMAIL = 'EMAIL',
  SLACK = 'SLACK',
  WEBHOOK = 'WEBHOOK',
  LOG = 'LOG'
}

export interface ErrorHandlingConfig {
  readonly retryEnabled: boolean;
  readonly maxRetries: number;
  readonly backoffMultiplier: number;
  readonly fallbackEnabled: boolean;
  readonly errorThreshold: number;
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface QualityGateConfig {
  readonly enabled: boolean;
  readonly minimumScore: number;
  readonly requiredMetrics: readonly string[];
  readonly enforcement: EnforcementLevel;
}

export enum EnforcementLevel {
  ADVISORY = 'ADVISORY',
  WARNING = 'WARNING',
  BLOCKING = 'BLOCKING'
}

export interface ABTestingConfig {
  readonly enabled: boolean;
  readonly variants: readonly string[];
  readonly trafficSplit: Record<string, number>;
  readonly duration: number;
  readonly successMetrics: readonly string[];
}

export interface ABTestResult {
  readonly variant: string;
  readonly metrics: Record<string, number>;
  readonly sampleSize: number;
  readonly confidence: number;
  readonly winner: boolean;
}

export interface TimeRange {
  readonly start: number;
  readonly end: number;
  readonly duration: number;
}

export enum ChartType {
  LINE = 'LINE',
  BAR = 'BAR',
  PIE = 'PIE',
  SCATTER = 'SCATTER',
  HEATMAP = 'HEATMAP'
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0
// === END FOOTER ===
