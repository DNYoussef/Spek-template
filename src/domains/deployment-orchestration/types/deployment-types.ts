/**
 * Deployment Orchestration Types
 * Comprehensive type definitions for deployment operations
 */

// Environment and configuration types
export interface Environment {
  name: string;
  type: 'development' | 'staging' | 'production' | 'canary';
  config: EnvironmentConfig;
  healthEndpoints: string[];
  rollbackCapable: boolean;
}

export interface EnvironmentConfig {
  replicas: number;
  resources: ResourceConfig;
  networkConfig: NetworkConfig;
  secrets: SecretConfig[];
  featureFlags: Record<string, boolean>;
  complianceLevel: 'basic' | 'enhanced' | 'nasa-pot10';
}

export interface ResourceConfig {
  cpu: string;
  memory: string;
  storage: string;
  nodeSelector?: Record<string, string>;
}

export interface NetworkConfig {
  ingressClass?: string;
  loadBalancer: LoadBalancerConfig;
  serviceType: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
}

export interface LoadBalancerConfig {
  type: 'application' | 'network';
  healthCheckPath: string;
  healthCheckInterval: number;
  unhealthyThreshold: number;
}

export interface SecretConfig {
  name: string;
  type: 'generic' | 'tls' | 'docker-registry';
  mountPath?: string;
}

// Deployment strategy types
export interface DeploymentStrategy {
  type: 'blue-green' | 'canary' | 'rolling' | 'recreate';
  config: StrategyConfig;
  rollbackStrategy: RollbackConfig;
}

export interface BlueGreenConfig extends StrategyConfig {
  switchTrafficPercentage: number;
  validationDuration: number;
  autoSwitch: boolean;
  switchTriggers: SwitchTrigger[];
}

export interface CanaryConfig extends StrategyConfig {
  initialTrafficPercentage: number;
  stepPercentage: number;
  stepDuration: number;
  maxSteps: number;
  successThreshold: SuccessMetrics;
  failureThreshold: FailureMetrics;
}

export interface StrategyConfig {
  timeout: number;
  healthCheckDelay: number;
  healthCheckTimeout: number;
  healthCheckInterval: number;
  progressDeadlineSeconds: number;
}

export interface RollbackConfig {
  enabled: boolean;
  autoTriggers: RollbackTrigger[];
  manualApprovalRequired: boolean;
  preserveResourceVersion: boolean;
}

// Health and monitoring types
export interface HealthCheck {
  endpoint: string;
  method: 'GET' | 'POST' | 'HEAD';
  expectedStatus: number[];
  timeout: number;
  interval: number;
  retries: number;
}

export interface SuccessMetrics {
  errorRate: number;
  responseTime: number;
  availability: number;
  throughput: number;
}

export interface FailureMetrics {
  errorRate: number;
  responseTime: number;
  availability: number;
  consecutiveFailures: number;
}

// Trigger and automation types
export interface SwitchTrigger {
  type: 'health' | 'metrics' | 'time' | 'manual';
  condition: TriggerCondition;
  action: 'switch' | 'rollback' | 'pause';
}

export interface RollbackTrigger {
  type: 'health-failure' | 'error-rate' | 'performance-degradation' | 'manual';
  threshold: number;
  duration: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TriggerCondition {
  metric: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte';
  value: number | string;
  duration?: number;
}

// Platform abstraction types
export interface PlatformConfig {
  type: 'kubernetes' | 'docker' | 'serverless' | 'vm';
  version: string;
  endpoint?: string;
  credentials: PlatformCredentials;
  features: PlatformFeatures;
}

export interface PlatformCredentials {
  type: 'kubeconfig' | 'token' | 'certificate' | 'aws' | 'azure' | 'gcp';
  data: Record<string, string>;
  secretRef?: string;
}

export interface PlatformFeatures {
  blueGreenSupport: boolean;
  canarySupport: boolean;
  autoScaling: boolean;
  loadBalancing: boolean;
  secretManagement: boolean;
}

// Deployment execution types
export interface DeploymentExecution {
  id: string;
  strategy: DeploymentStrategy;
  environment: Environment;
  platform: PlatformConfig;
  artifact: DeploymentArtifact;
  status: DeploymentStatus;
  metadata: DeploymentMetadata;
  timeline: DeploymentEvent[];
}

export interface DeploymentArtifact {
  id: string;
  version: string;
  imageTag?: string;
  packagePath?: string;
  checksums: Record<string, string>;
  compliance: ComplianceStatus;
}

export interface DeploymentStatus {
  phase: 'pending' | 'preparing' | 'deploying' | 'validating' | 'complete' | 'failed' | 'rolling-back';
  conditions: StatusCondition[];
  replicas: ReplicaStatus;
  traffic: TrafficStatus;
}

export interface StatusCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  reason: string;
  message: string;
  lastTransitionTime: Date;
}

export interface ReplicaStatus {
  desired: number;
  ready: number;
  available: number;
  unavailable: number;
}

export interface TrafficStatus {
  blue: number;
  green: number;
  canary?: number;
  stable?: number;
}

export interface DeploymentMetadata {
  createdBy: string;
  createdAt: Date;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  approvals: ApprovalRecord[];
}

export interface ApprovalRecord {
  approver: string;
  approvedAt: Date;
  stage: string;
  comments?: string;
}

export interface DeploymentEvent {
  timestamp: Date;
  type: 'info' | 'warning' | 'error';
  component: string;
  message: string;
  metadata?: Record<string, any>;
}

// Compliance and audit types
export interface ComplianceStatus {
  level: 'basic' | 'enhanced' | 'nasa-pot10';
  checks: ComplianceCheck[];
  overallStatus: 'pass' | 'fail' | 'warning';
  auditTrail: AuditEvent[];
}

export interface ComplianceCheck {
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'skip';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: string;
}

export interface AuditEvent {
  timestamp: Date;
  actor: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure';
  details: Record<string, any>;
}

// Pipeline orchestration types
export interface PipelineStage {
  name: string;
  type: 'build' | 'test' | 'deploy' | 'validate' | 'approve';
  dependencies: string[];
  config: StageConfig;
  timeout: number;
  retryPolicy: RetryPolicy;
}

export interface StageConfig {
  parallelism?: number;
  resources?: ResourceConfig;
  environment?: Record<string, string>;
  artifacts?: ArtifactRef[];
}

export interface ArtifactRef {
  name: string;
  type: 'image' | 'package' | 'config' | 'secret';
  source: string;
  destination?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
}

// Error and result types
export interface DeploymentError {
  code: string;
  message: string;
  component: string;
  recoverable: boolean;
  suggestions: string[];
}

export interface DeploymentResult {
  success: boolean;
  deploymentId: string;
  duration: number;
  errors: DeploymentError[];
  metrics: DeploymentMetrics;
}

export interface DeploymentMetrics {
  totalDuration: number;
  deploymentDuration: number;
  validationDuration: number;
  rollbackCount: number;
  successRate: number;
  performanceImpact: number;
}