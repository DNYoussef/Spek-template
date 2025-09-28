/**
 * Fallback Chain Manager Types - Core type definitions for FSM architecture
 */

export enum FallbackStates {
  IDLE = 'idle',
  ANALYZING = 'analyzing',
  ACTIVATING = 'activating',
  ACTIVE = 'active',
  FAILING_OVER = 'failing_over',
  RECOVERING = 'recovering',
  ERROR = 'error'
}

export enum FallbackEvents {
  ANALYZE_REQUEST = 'analyze_request',
  ANALYSIS_COMPLETE = 'analysis_complete',
  ACTIVATION_NEEDED = 'activation_needed',
  ACTIVATION_COMPLETE = 'activation_complete',
  ACTIVATION_FAILED = 'activation_failed',
  PROTOCOL_FAILED = 'protocol_failed',
  FAILOVER_COMPLETE = 'failover_complete',
  RECOVERY_NEEDED = 'recovery_needed',
  RECOVERY_COMPLETE = 'recovery_complete',
  DEACTIVATION_REQUESTED = 'deactivation_requested',
  DEACTIVATION_COMPLETE = 'deactivation_complete',
  TESTING_STARTED = 'testing_started',
  TESTING_COMPLETE = 'testing_complete',
  TESTING_FAILED = 'testing_failed',
  ERROR = 'error',
  RESET = 'reset',
  RETRY = 'retry'
}

export interface FallbackProtocol {
  id: string;
  name: string;
  priority: number;
  type: 'primary' | 'secondary' | 'tertiary' | 'emergency' | 'offline';
  activationCriteria: ActivationCriteria;
  configuration: ProtocolConfiguration;
  capabilities: ProtocolCapability[];
  limitations: ProtocolLimitation[];
  healthCheck: HealthCheckConfig;
  performance: PerformanceProfile;
  security: SecurityProfile;
  rollbackPolicy: RollbackPolicy;
}

export interface ActivationCriteria {
  conditions: ActivationCondition[];
  operator: 'AND' | 'OR';
  timeout: number;
  retryPolicy: RetryPolicy;
  manualOverride: boolean;
}

export interface ActivationCondition {
  type: 'failure_rate' | 'latency' | 'availability' | 'error_threshold' | 'manual';
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  duration: number;
}

export interface ProtocolConfiguration {
  endpoint?: string;
  port?: number;
  encryption: EncryptionConfig;
  authentication: AuthenticationConfig;
  messageFormat: MessageFormat;
  compression: CompressionConfig;
  timeout: TimeoutConfig;
  connectionPool: ConnectionPoolConfig;
}

export interface ProtocolCapability {
  name: string;
  type: 'messaging' | 'streaming' | 'batch' | 'realtime' | 'offline';
  supported: boolean;
  limitations?: string[];
  configuration?: Record<string, any>;
}

export interface ProtocolLimitation {
  type: 'throughput' | 'latency' | 'size' | 'duration' | 'feature';
  description: string;
  value?: number;
  unit?: string;
  workaround?: string;
}

export interface HealthCheckConfig {
  interval: number;
  timeout: number;
  endpoint: string;
  expectedResponse: any;
  failureThreshold: number;
  recoveryThreshold: number;
}

export interface PerformanceProfile {
  latency: LatencyProfile;
  throughput: ThroughputProfile;
  reliability: ReliabilityProfile;
  scalability: ScalabilityProfile;
}

export interface SecurityProfile {
  encryptionStrength: 'weak' | 'medium' | 'strong' | 'military';
  authenticationRequired: boolean;
  auditLogging: boolean;
  dataIntegrity: boolean;
  nonRepudiation: boolean;
}

export interface FallbackChain {
  id: string;
  name: string;
  protocols: FallbackProtocol[];
  activationStrategy: ActivationStrategy;
  failoverPolicy: FailoverPolicy;
  monitoringConfig: MonitoringConfig;
  testSchedule: TestSchedule;
}

export interface ActivationStrategy {
  type: 'cascade' | 'parallel' | 'intelligent' | 'load_based';
  parameters: Record<string, any>;
  decisionEngine?: DecisionEngine;
}

export interface FailoverPolicy {
  automaticFailover: boolean;
  failbackPolicy: FailbackPolicy;
  notificationConfig: NotificationConfig;
  escalationProcedure: EscalationProcedure;
}

export interface FallbackActivation {
  chainId: string;
  protocolId: string;
  reason: string;
  triggeredBy: ActivationTrigger;
  timestamp: Date;
  context: ActivationContext;
  expectedDuration?: number;
}

export interface FailoverResult {
  success: boolean;
  activatedProtocol: string;
  failoverTime: number;
  affectedSystems: string[];
  metrics: FailoverMetrics;
  rollbackPlan?: RollbackPlan;
}

export interface FallbackContext {
  fallbackChains: Map<string, FallbackChain>;
  activeProtocols: Map<string, FallbackProtocol>;
  activationHistory: FallbackActivation[];
  healthMonitor: any;
  chainBuilder: any;
  protocolFactory: any;
  activationValidator: any;
  currentChain: FallbackChain | null;
  currentProtocol: FallbackProtocol | null;
  lastActivationResult: FailoverResult | null;
  lastError?: Error;
}

// Supporting interfaces
export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
}

export interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  enabled: boolean;
}

export interface AuthenticationConfig {
  type: string;
  required: boolean;
  timeout: number;
}

export interface MessageFormat {
  type: string;
  compression: string;
  maxSize: number;
}

export interface CompressionConfig {
  enabled: boolean;
  algorithm: string;
  level: number;
}

export interface TimeoutConfig {
  connection: number;
  request: number;
  idle: number;
}

export interface ConnectionPoolConfig {
  minSize: number;
  maxSize: number;
  idleTimeout: number;
}

export interface LatencyProfile {
  average: number;
  p95: number;
  p99: number;
}

export interface ThroughputProfile {
  requestsPerSecond: number;
  bytesPerSecond: number;
}

export interface ReliabilityProfile {
  uptime: number;
  errorRate: number;
}

export interface ScalabilityProfile {
  maxConcurrentConnections: number;
  horizontalScaling: boolean;
}

export interface RollbackPolicy {
  automatic: boolean;
  conditions: Array<{
    metric: string;
    threshold: number;
    duration: number;
  }>;
  approvalRequired: boolean;
}

export interface DecisionEngine {
  algorithm: string;
  parameters: Record<string, any>;
}

export interface FailbackPolicy {
  automatic: boolean;
  requiresApproval: boolean;
  healthThreshold: number;
}

export interface NotificationConfig {
  channels: string[];
  escalation: boolean;
}

export interface EscalationProcedure {
  levels: Array<{
    title: string;
    timeoutMinutes: number;
  }>;
}

export interface MonitoringConfig {
  healthCheckInterval: number;
  performanceThresholds: {
    maxLatency: number;
    minThroughput: number;
    maxErrorRate: number;
  };
}

export interface TestSchedule {
  interval: number;
  comprehensive: boolean;
  maintenanceWindow: {
    start: string;
    end: string;
    timezone: string;
  };
}

export interface ActivationTrigger {
  type: string;
  source: string;
  timestamp: Date;
}

export interface ActivationContext {
  chainId?: string;
  migrationId?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  expectedDuration?: number;
  affectedSystems?: string[];
}

export interface FailoverMetrics {
  activationTime: number;
  successRate: number;
  errorCount: number;
  performanceImpact: number;
}

export interface RollbackPlan {
  steps: string[];
  estimatedTime: number;
}