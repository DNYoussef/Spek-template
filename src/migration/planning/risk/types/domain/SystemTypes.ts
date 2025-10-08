/**
 * System Domain Types
 * Types for system context, integration, and performance
 */

// System Context
export interface SystemContext {
  id: string;
  name: string;
  type: 'monolith' | 'microservices' | 'hybrid' | 'legacy' | 'cloud_native';
  environment: 'development' | 'staging' | 'production' | 'disaster_recovery';
  architecture: SystemArchitecture;
  technology_stack: TechnologyStack;
  data_context: DataContext;
  performance_context: PerformanceContext;
  security_context: SecurityContext;
  compliance_context: ComplianceContext;
  integrations: SystemIntegration[];
}

export interface SystemArchitecture {
  pattern: string;
  layers: ArchitecturalLayer[];
  components: SystemComponent[];
  interfaces: SystemInterface[];
  data_flow: DataFlow[];
}

export interface ArchitecturalLayer {
  name: string;
  responsibility: string;
  technologies: string[];
  dependencies: string[];
}

export interface SystemComponent {
  id: string;
  name: string;
  type: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  interfaces: string[];
}

export interface SystemInterface {
  id: string;
  name: string;
  type: 'REST' | 'GraphQL' | 'SOAP' | 'gRPC' | 'WebSocket' | 'Message Queue';
  protocol: string;
  authentication: string;
  rate_limits: RateLimit[];
}

export interface RateLimit {
  type: string;
  limit: number;
  window: string;
  burst_allowance?: number;
}

export interface DataFlow {
  source: string;
  destination: string;
  data_type: string;
  volume: number;
  frequency: string;
  transformation: string[];
}

// Technology Stack
export interface TechnologyStack {
  languages: ProgrammingLanguage[];
  frameworks: Framework[];
  databases: Database[];
  infrastructure: Infrastructure;
  tools: DevelopmentTool[];
}

export interface ProgrammingLanguage {
  name: string;
  version: string;
  usage: 'primary' | 'secondary' | 'legacy';
  end_of_life?: Date;
  migration_complexity: 'low' | 'medium' | 'high';
}

export interface Framework {
  name: string;
  version: string;
  category: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  alternative_options: string[];
}

export interface Database {
  name: string;
  type: 'relational' | 'document' | 'key_value' | 'graph' | 'time_series';
  version: string;
  size: number;
  performance_characteristics: PerformanceProfile;
}

export interface PerformanceProfile {
  throughput: number;
  latency: number;
  availability: number;
  consistency_model: string;
}

export interface Infrastructure {
  hosting: 'on_premise' | 'cloud' | 'hybrid';
  cloud_provider?: string;
  regions: string[];
  compute_resources: ComputeResource[];
  network_configuration: NetworkConfiguration;
}

export interface ComputeResource {
  type: string;
  specifications: ResourceSpecification;
  scaling: ScalingConfiguration;
  cost: ResourceCost;
}

export interface ResourceSpecification {
  cpu: number;
  memory: number;
  storage: number;
  network_bandwidth: number;
}

export interface ScalingConfiguration {
  type: 'manual' | 'automatic';
  triggers: ScalingTrigger[];
  limits: ScalingLimits;
}

export interface ScalingTrigger {
  metric: string;
  threshold: number;
  action: 'scale_up' | 'scale_down';
}

export interface ScalingLimits {
  min_instances: number;
  max_instances: number;
  max_cost_per_hour: number;
}

export interface ResourceCost {
  hourly_rate: number;
  currency: string;
  billing_model: 'pay_as_you_go' | 'reserved' | 'spot';
}

export interface NetworkConfiguration {
  topology: string;
  security_groups: SecurityGroup[];
  load_balancers: LoadBalancer[];
  cdn_configuration?: CDNConfiguration;
}

export interface SecurityGroup {
  name: string;
  rules: SecurityRule[];
  applied_to: string[];
}

export interface SecurityRule {
  direction: 'inbound' | 'outbound';
  protocol: string;
  port_range: string;
  source_destination: string;
  action: 'allow' | 'deny';
}

export interface LoadBalancer {
  type: string;
  algorithm: string;
  health_checks: HealthCheck[];
  ssl_termination: boolean;
}

export interface HealthCheck {
  protocol: string;
  path?: string;
  interval: number;
  timeout: number;
  failure_threshold: number;
}

export interface CDNConfiguration {
  provider: string;
  edge_locations: string[];
  cache_policies: CachePolicy[];
}

export interface CachePolicy {
  content_type: string;
  ttl: number;
  compression: boolean;
}

export interface DevelopmentTool {
  name: string;
  category: string;
  version: string;
  license: string;
  business_criticality: 'low' | 'medium' | 'high' | 'critical';
}

// System Integration
export interface SystemIntegration {
  system: string;
  type: 'api' | 'database' | 'file' | 'message_queue' | 'event_stream';
  direction: 'inbound' | 'outbound' | 'bidirectional';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  dataVolume: number;
  frequency: string;
  errorTolerance: number;
  fallbackMechanism: string;
}

// Performance Context
export interface PerformanceContext {
  currentMetrics: PerformanceMetrics;
  requirements: PerformanceRequirements;
  benchmarks: PerformanceBenchmark[];
  trends: PerformanceTrend[];
}

export interface PerformanceMetrics {
  response_time: ResponseTimeMetrics;
  throughput: ThroughputMetrics;
  resource_utilization: ResourceUtilization;
  error_rates: ErrorRateMetrics;
}

export interface ResponseTimeMetrics {
  average: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
}

export interface ThroughputMetrics {
  requests_per_second: number;
  transactions_per_second: number;
  data_processed_per_hour: number;
}

export interface ResourceUtilization {
  cpu_usage: number;
  memory_usage: number;
  disk_io: number;
  network_io: number;
}

export interface ErrorRateMetrics {
  total_error_rate: number;
  error_breakdown: ErrorBreakdown[];
  timeout_rate: number;
}

export interface ErrorBreakdown {
  error_type: string;
  count: number;
  percentage: number;
}

export interface PerformanceRequirements {
  response_time_sla: number;
  throughput_minimum: number;
  availability_target: number;
  error_rate_maximum: number;
}

export interface PerformanceBenchmark {
  name: string;
  baseline_value: number;
  target_value: number;
  measurement_method: string;
  test_conditions: string[];
}

export interface PerformanceTrend {
  metric: string;
  time_period: string;
  trend_direction: 'improving' | 'stable' | 'degrading';
  change_rate: number;
}