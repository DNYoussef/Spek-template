/**
 * Performance Analysis Types - Performance and scalability interfaces
 * Extracted from MigrationAnalysisTypes.ts for NASA Rule 10 compliance
 * Focus: Performance metrics, benchmarks, and scalability analysis
 */

export interface ArchitectureProfile {
  pattern: 'monolith' | 'microservices' | 'serverless' | 'hybrid';
  components: ComponentInfo[];
  integrations: IntegrationInfo[];
  scalability: ScalabilityInfo;
  availability: AvailabilityInfo;
  security: SecurityInfo;
}

export interface ComponentInfo {
  id: string;
  name: string;
  type: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  replicas: number;
  resources: ResourceRequirements;
}

export interface IntegrationInfo {
  id: string;
  type: 'api' | 'database' | 'messaging' | 'file' | 'stream';
  protocol: string;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  volume: number;
  criticality: 'low' | 'medium' | 'high' | 'critical';
}

export interface ResourceRequirements {
  cpu: string;
  memory: string;
  storage: string;
  network: string;
}

export interface PerformanceProfile {
  throughput: ThroughputMetrics;
  latency: LatencyMetrics;
  availability: AvailabilityMetrics;
  scalability: ScalabilityMetrics;
  baseline: PerformanceBaseline;
}

export interface ThroughputMetrics {
  requestsPerSecond: number;
  transactionsPerSecond: number;
  dataTransferRate: number;
  peakMultiplier: number;
}

export interface LatencyMetrics {
  average: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface AvailabilityMetrics {
  uptime: number;
  mtbf: number; // Mean Time Between Failures
  mttr: number; // Mean Time To Recovery
  sla: number;
}

export interface ScalabilityMetrics {
  maxUsers: number;
  maxThroughput: number;
  scalingFactor: number;
  horizontalLimits: number;
  verticalLimits: number;
}

export interface PerformanceBaseline {
  measurementDate: Date;
  conditions: BaselineCondition[];
  metrics: BaselineMetrics;
  environment: string;
  dataVolume: number;
}

export interface BaselineCondition {
  parameter: string;
  value: any;
  impact: string;
}

export interface BaselineMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  response: number;
  throughput: number;
}

export interface ScalabilityInfo {
  horizontal: ScalabilityDimension;
  vertical: ScalabilityDimension;
  bottlenecks: PerformanceBottleneck[];
  testing: ScalabilityTesting;
}

export interface ScalabilityDimension {
  supported: boolean;
  mechanism: string;
  limits: ScalingLimits;
  cost: ScalingCost;
  complexity: number;
}

export interface ScalingLimits {
  technical: string[];
  business: string[];
  regulatory: string[];
}

export interface ScalingCost {
  linear: boolean;
  breakpoints: CostBreakpoint[];
  optimization: string[];
}

export interface CostBreakpoint {
  threshold: number;
  costMultiplier: number;
  reason: string;
}

export interface PerformanceBottleneck {
  component: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'database' | 'algorithm';
  impact: number;
  threshold: number;
  mitigation: string[];
}

export interface ScalabilityTesting {
  loadTesting: TestingInfo;
  stressTesting: TestingInfo;
  volumeTesting: TestingInfo;
  enduranceTesting: TestingInfo;
}

export interface TestingInfo {
  conducted: boolean;
  lastDate: Date;
  results: TestResult[];
  recommendations: string[];
}

export interface TestResult {
  metric: string;
  value: number;
  status: 'pass' | 'fail' | 'warning';
  threshold: number;
  impact: string;
}

export interface AvailabilityInfo {
  requirements: AvailabilityRequirement[];
  current: AvailabilityMetrics;
  incidents: IncidentHistory[];
  recovery: RecoveryPlan;
}

export interface AvailabilityRequirement {
  sla: number;
  rpo: number; // Recovery Point Objective
  rto: number; // Recovery Time Objective
  businessHours: string;
  exceptions: string[];
}

export interface IncidentHistory {
  date: Date;
  duration: number;
  cause: string;
  impact: string;
  resolution: string;
  prevention: string[];
}

export interface RecoveryPlan {
  backup: BackupStrategy;
  failover: FailoverStrategy;
  monitoring: MonitoringStrategy;
  communication: CommunicationPlan;
}

export interface BackupStrategy {
  frequency: string;
  retention: string;
  location: string[];
  verification: boolean;
  encryption: boolean;
}

export interface FailoverStrategy {
  automatic: boolean;
  manual: boolean;
  criteria: string[];
  testing: string;
  rollback: string;
}

export interface MonitoringStrategy {
  metrics: string[];
  alerting: AlertingConfig;
  dashboard: DashboardConfig;
  reporting: ReportingConfig;
}

export interface AlertingConfig {
  thresholds: Record<string, number>;
  escalation: string[];
  channels: string[];
  suppression: boolean;
}

export interface DashboardConfig {
  realtime: boolean;
  historical: boolean;
  predictive: boolean;
  customizable: boolean;
}

export interface ReportingConfig {
  frequency: string;
  recipients: string[];
  format: string;
  automation: boolean;
}

export interface CommunicationPlan {
  stakeholders: string[];
  channels: string[];
  templates: string[];
  escalation: string[];
}

export interface SecurityInfo {
  authentication: AuthenticationInfo;
  authorization: AuthorizationInfo;
  encryption: EncryptionInfo;
  compliance: SecurityCompliance;
  vulnerabilities: VulnerabilityInfo;
}

export interface AuthenticationInfo {
  methods: string[];
  sso: boolean;
  mfa: boolean;
  passwordPolicy: PasswordPolicy;
  sessionManagement: SessionManagement;
}

export interface PasswordPolicy {
  minLength: number;
  complexity: string[];
  expiration: number;
  history: number;
  lockout: LockoutPolicy;
}

export interface LockoutPolicy {
  threshold: number;
  duration: number;
  resetMethod: string[];
}

export interface SessionManagement {
  timeout: number;
  concurrent: number;
  tracking: boolean;
  security: string[];
}

export interface AuthorizationInfo {
  model: 'rbac' | 'abac' | 'dac' | 'mac';
  roles: RoleInfo[];
  permissions: PermissionInfo[];
  delegation: boolean;
  auditing: boolean;
}

export interface RoleInfo {
  name: string;
  permissions: string[];
  inheritance: string[];
  constraints: string[];
}

export interface PermissionInfo {
  resource: string;
  actions: string[];
  conditions: string[];
  delegation: boolean;
}

export interface EncryptionInfo {
  dataAtRest: EncryptionDetails;
  dataInTransit: EncryptionDetails;
  keyManagement: KeyManagement;
  compliance: string[];
}

export interface EncryptionDetails {
  algorithm: string;
  keyLength: number;
  mode: string;
  implementation: string;
}

export interface KeyManagement {
  generation: string;
  storage: string;
  rotation: string;
  escrow: boolean;
  hsm: boolean;
}

export interface SecurityCompliance {
  frameworks: string[];
  certifications: string[];
  assessments: AssessmentInfo[];
  remediation: RemediationInfo[];
}

export interface AssessmentInfo {
  type: string;
  date: Date;
  scope: string;
  findings: FindingInfo[];
  score: number;
}

export interface FindingInfo {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  remediation: string;
  timeline: string;
}

export interface RemediationInfo {
  issue: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  solution: string;
  timeline: string;
  cost: number;
  status: 'planned' | 'in_progress' | 'completed' | 'deferred';
}

export interface VulnerabilityInfo {
  scanning: ScanningInfo;
  management: VulnManagement;
  disclosure: DisclosurePolicy;
  response: ResponsePlan;
}

export interface ScanningInfo {
  frequency: string;
  tools: string[];
  coverage: string[];
  automation: boolean;
}

export interface VulnManagement {
  identification: string;
  classification: string;
  prioritization: string;
  remediation: string;
  tracking: boolean;
}

export interface DisclosurePolicy {
  internal: string;
  external: string;
  timeline: string;
  coordination: string[];
}

export interface ResponsePlan {
  team: string[];
  procedures: string[];
  communication: string[];
  documentation: boolean;
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T10:16:45-04:00 | decomposer@claude-sonnet-4 | Created PerformanceAnalysisTypes.ts - performance interfaces | PerformanceAnalysisTypes.ts | OK | Extracted performance/security types, <500 lines | 0.00 | b8f3d9e |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: migration-decomposition-002
- inputs: ["MigrationAnalysisTypes.ts"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"type-decomposition-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->