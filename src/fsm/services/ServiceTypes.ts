/**
 * Service Types - Core service definitions for FSM architecture
 * NASA Rule 10 compliant const type definitions
 */
// Service configuration
export interface ServiceConfig {
  readonly id: string;
  readonly name: string;
  readonly type: ServiceType;
  readonly endpoint?: string;
  readonly timeout?: number;
  readonly retryPolicy?: RetryPolicy;
  readonly authentication?: AuthConfig;
  readonly monitoring?: MonitoringConfig;
}
// Service types
export enum ServiceType {
  REST_API  =  'REST_API',
  GRAPHQL  =  'GRAPHQL',
  WEBSOCKET  =  'WEBSOCKET',
  GRPC  =  'GRPC',
  MESSAGE_QUEUE  =  'MESSAGE_QUEUE',
  DATABASE  =  'DATABASE',
  CACHE  =  'CACHE',
  STORAGE  =  'STORAGE',
  NOTIFICATION  =  'NOTIFICATION',
  MONITORING  =  'MONITORING'
}
// Retry policy
export interface RetryPolicy {
  readonly maxRetries: number;
  readonly retryDelayMs: number;
  readonly backoffMultiplier?: number;
  readonly maxDelayMs?: number;
  readonly retryableStatuses?: number[];
}
// Authentication configuration
export interface AuthConfig {
  readonly type: AuthType;
  readonly credentials?: Record<string, string>;
  readonly tokenEndpoint?: string;
  readonly refreshEndpoint?: string;
}
export enum AuthType {
  NONE  =  'NONE',
  API_KEY  =  'API_KEY',
  BEARER_TOKEN  =  'BEARER_TOKEN',
  OAUTH2  =  'OAUTH2',
  BASIC  =  'BASIC',
  CUSTOM  =  'CUSTOM'
}
// Monitoring configuration
export interface MonitoringConfig {
  readonly enabled: boolean;
  readonly metricsEndpoint?: string;
  readonly healthEndpoint?: string;
  readonly alertThresholds?: AlertThresholds;
}
export interface AlertThresholds {
  readonly errorRate?: number;
  readonly latency?: number;
  readonly availability?: number;
}
// Service status
export interface ServiceStatus {
  readonly serviceId: string;
  readonly status: ServiceHealthStatus;
  readonly lastChecked: number;
  readonly responseTime?: number;
  readonly errorRate?: number;
  readonly availability?: number;
  readonly metadata?: Record<string, any>;
}
export enum ServiceHealthStatus {
  HEALTHY  =  'HEALTHY',
  DEGRADED  =  'DEGRADED',
  UNHEALTHY  =  'UNHEALTHY',
  UNKNOWN  =  'UNKNOWN',
  OFFLINE  =  'OFFLINE'
}
// Service request/response
export interface ServiceRequest {
  readonly id: string;
  readonly serviceId: string;
  readonly method: string;
  readonly path?: string;
  readonly headers?: Record<string, string>;
  readonly body?: any;
  readonly timeout?: number;
  readonly metadata?: Record<string, any>;
}
export interface ServiceResponse {
  readonly requestId: string;
  readonly status: number;
  readonly headers?: Record<string, string>;
  readonly body?: any;
  readonly error?: ServiceError;
  readonly duration: number;
  readonly metadata?: Record<string, any>;
}
export interface ServiceError {
  readonly code: string;
  readonly message: string;
  readonly details?: any;
  readonly stack?: string;
  readonly retryable?: boolean;
}
// Service metrics
export interface ServiceMetrics {
  readonly serviceId: string;
  readonly period: MetricsPeriod;
  readonly requests: number;
  readonly errors: number;
  readonly averageLatency: number;
  readonly p50Latency: number;
  readonly p95Latency: number;
  readonly p99Latency: number;
  readonly availability: number;
  readonly errorRate: number;
}
export enum MetricsPeriod {
  MINUTE  =  'MINUTE',
  HOUR  =  'HOUR',
  DAY  =  'DAY',
  WEEK  =  'WEEK',
  MONTH  =  'MONTH'
}
// Service discovery
export interface ServiceDiscovery {
  readonly services: ServiceInfo[];
  readonly lastUpdated: number;
  readonly healthChecks: ServiceHealthCheck[];
}
export interface ServiceInfo {
  readonly id: string;
  readonly name: string;
  readonly type: ServiceType;
  readonly endpoint: string;
  readonly version?: string;
  readonly metadata?: Record<string, any>;
}
export interface ServiceHealthCheck {
  readonly serviceId: string;
  readonly checkType: HealthCheckType;
  readonly interval: number;
  readonly timeout: number;
  readonly healthyThreshold: number;
  readonly unhealthyThreshold: number;
}
export enum HealthCheckType {
  HTTP  =  'HTTP',
  TCP  =  'TCP',
  GRPC  =  'GRPC',
  CUSTOM  =  'CUSTOM'
}
// Service orchestration
export interface ServiceOrchestration {
  readonly id: string;
  readonly name: string;
  readonly services: string[];
  readonly workflow: ServiceWorkflow;
  readonly errorHandling?: ErrorHandlingStrategy;
}
export interface ServiceWorkflow {
  readonly steps: WorkflowStep[];
  readonly parallelExecution?: boolean;
  readonly timeout?: number;
}
export interface WorkflowStep {
  readonly id: string;
  readonly serviceId: string;
  readonly operation: string;
  readonly input?: any;
  readonly transform?: string;
  readonly onError?: ErrorAction;
}
export interface ErrorHandlingStrategy {
  readonly type: ErrorHandlingType;
  readonly retryPolicy?: RetryPolicy;
  readonly fallbackService?: string;
  readonly compensationSteps?: string[];
}
export enum ErrorHandlingType {
  RETRY  =  'RETRY',
  FALLBACK  =  'FALLBACK',
  COMPENSATE  =  'COMPENSATE',
  FAIL_FAST  =  'FAIL_FAST',
  IGNORE  =  'IGNORE'
}
export enum ErrorAction {
  RETRY  =  'RETRY',
  SKIP  =  'SKIP',
  FAIL  =  'FAIL',
  COMPENSATE  =  'COMPENSATE'
}
// Export collections for validation
export const AllowedServiceTypes  =  Object.values(ServiceType);
export const AllowedAuthTypes  =  Object.values(AuthType);
export const AllowedHealthStatuses  =  Object.values(ServiceHealthStatus);
export const AllowedMetricsPeriods  =  Object.values(MetricsPeriod);
export const AllowedHealthCheckTypes  =  Object.values(HealthCheckType);
export const AllowedErrorHandlingTypes  =  Object.values(ErrorHandlingType);
export const AllowedErrorActions  =  Object.values(ErrorAction);
// Default configurations
export const DEFAULT_RETRY_POLICY: RetryPolicy  =  {
  maxRetries: 3,
  retryDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000
};
export const DEFAULT_MONITORING_CONFIG: MonitoringConfig  =  {
  enabled: true,
  alertThresholds: {
    errorRate: 0.05,
    latency: 1000,
    availability: 0.99
  }
};
export default {
  ServiceType,
  ServiceHealthStatus,
  MetricsPeriod,
  HealthCheckType,
  ErrorHandlingType,
  ErrorAction,
  AuthType
};