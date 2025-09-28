/**
 * Data Migration Types - Data management and migration interfaces
 * Extracted from MigrationAnalysisTypes.ts for NASA Rule 10 compliance
 * Focus: Data profiles, migration strategies, and data governance
 */

export interface DataProfile {
  databases: DatabaseInfo[];
  files: FileSystemInfo[];
  integrations: DataIntegration[];
  governance: DataGovernance;
  migration: DataMigrationPlan;
}

export interface DatabaseInfo {
  id: string;
  name: string;
  type: 'relational' | 'nosql' | 'graph' | 'timeseries' | 'search';
  technology: string;
  version: string;
  size: DataSize;
  schema: SchemaInfo;
  performance: DatabasePerformance;
  backup: BackupInfo;
  replication: ReplicationInfo;
}

export interface DataSize {
  records: number;
  sizeGB: number;
  tables: number;
  indexes: number;
  growthRate: number;
}

export interface SchemaInfo {
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  tables: number;
  relationships: number;
  constraints: number;
  procedures: number;
  functions: number;
  triggers: number;
  views: number;
}

export interface DatabasePerformance {
  throughput: number;
  latency: number;
  concurrency: number;
  indexEfficiency: number;
  queryOptimization: number;
  bottlenecks: string[];
}

export interface BackupInfo {
  strategy: 'full' | 'incremental' | 'differential' | 'continuous';
  frequency: string;
  retention: string;
  location: string[];
  encryption: boolean;
  compression: boolean;
  verification: boolean;
}

export interface ReplicationInfo {
  enabled: boolean;
  type: 'master_slave' | 'master_master' | 'cluster' | 'distributed';
  lag: number;
  consistency: 'eventual' | 'strong' | 'weak';
  failover: boolean;
}

export interface FileSystemInfo {
  id: string;
  type: 'local' | 'network' | 'cloud' | 'hybrid';
  protocol: string;
  capacity: number;
  utilization: number;
  structure: FileStructure;
  access: AccessPattern[];
  backup: FileBackupInfo;
}

export interface FileStructure {
  directories: number;
  files: number;
  totalSize: number;
  averageFileSize: number;
  largestFile: number;
  formats: FileFormat[];
}

export interface FileFormat {
  extension: string;
  count: number;
  totalSize: number;
  importance: 'critical' | 'important' | 'optional';
}

export interface AccessPattern {
  type: 'read' | 'write' | 'delete' | 'modify';
  frequency: string;
  volume: number;
  users: string[];
  applications: string[];
}

export interface FileBackupInfo {
  strategy: string;
  frequency: string;
  compression: boolean;
  versioning: boolean;
  synchronization: boolean;
}

export interface DataIntegration {
  id: string;
  type: 'etl' | 'elt' | 'streaming' | 'batch' | 'api';
  source: string;
  target: string;
  frequency: string;
  volume: number;
  transformation: TransformationInfo;
  validation: ValidationInfo;
  monitoring: IntegrationMonitoring;
}

export interface TransformationInfo {
  complexity: 'simple' | 'moderate' | 'complex';
  rules: number;
  customCode: boolean;
  dataMapping: DataMapping[];
  businessRules: BusinessRule[];
}

export interface DataMapping {
  sourceField: string;
  targetField: string;
  transformation: string;
  validation: string;
  defaultValue: any;
}

export interface BusinessRule {
  id: string;
  description: string;
  logic: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  validation: boolean;
}

export interface ValidationInfo {
  dataQuality: DataQualityCheck[];
  businessRules: BusinessRuleCheck[];
  reconciliation: ReconciliationCheck[];
  errorHandling: ErrorHandling;
}

export interface DataQualityCheck {
  type: 'completeness' | 'accuracy' | 'consistency' | 'validity' | 'uniqueness';
  threshold: number;
  severity: 'warning' | 'error' | 'critical';
  action: string;
}

export interface BusinessRuleCheck {
  rule: string;
  threshold: number;
  action: string;
}

export interface ReconciliationCheck {
  type: 'count' | 'sum' | 'hash' | 'sample';
  frequency: string;
  tolerance: number;
  escalation: string[];
}

export interface ErrorHandling {
  strategy: 'stop' | 'skip' | 'retry' | 'fallback';
  logging: boolean;
  notification: string[];
  recovery: string;
}

export interface IntegrationMonitoring {
  metrics: string[];
  alerting: AlertConfig[];
  reporting: ReportConfig;
  auditing: AuditConfig;
}

export interface AlertConfig {
  metric: string;
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  recipients: string[];
  escalation: boolean;
}

export interface ReportConfig {
  frequency: string;
  recipients: string[];
  content: string[];
  format: string;
}

export interface AuditConfig {
  enabled: boolean;
  level: 'basic' | 'detailed' | 'comprehensive';
  retention: string;
  access: string[];
}

export interface DataGovernance {
  classification: DataClassification;
  privacy: PrivacyInfo;
  retention: RetentionPolicy[];
  lineage: DataLineage;
  catalog: DataCatalog;
}

export interface DataClassification {
  scheme: string;
  levels: ClassificationLevel[];
  automation: boolean;
  coverage: number;
}

export interface ClassificationLevel {
  level: string;
  description: string;
  criteria: string[];
  handling: string[];
  access: string[];
}

export interface PrivacyInfo {
  regulations: string[];
  personalData: PersonalDataInfo[];
  consent: ConsentManagement;
  anonymization: AnonymizationInfo;
}

export interface PersonalDataInfo {
  type: string;
  location: string[];
  processing: string[];
  lawfulBasis: string;
  retention: string;
}

export interface ConsentManagement {
  mechanism: string;
  granularity: string;
  withdrawal: string;
  documentation: boolean;
}

export interface AnonymizationInfo {
  techniques: string[];
  reversibility: boolean;
  effectiveness: number;
  validation: boolean;
}

export interface RetentionPolicy {
  dataType: string;
  period: string;
  trigger: string;
  method: string;
  verification: boolean;
}

export interface DataLineage {
  tracking: boolean;
  granularity: 'field' | 'table' | 'system';
  visualization: boolean;
  impact: ImpactAnalysis;
}

export interface ImpactAnalysis {
  automated: boolean;
  scope: string[];
  dependencies: string[];
  reporting: boolean;
}

export interface DataCatalog {
  coverage: number;
  metadata: MetadataInfo;
  discovery: DiscoveryInfo;
  collaboration: CollaborationInfo;
}

export interface MetadataInfo {
  technical: boolean;
  business: boolean;
  operational: boolean;
  quality: boolean;
}

export interface DiscoveryInfo {
  automated: boolean;
  manual: boolean;
  profiling: boolean;
  sampling: boolean;
}

export interface CollaborationInfo {
  annotation: boolean;
  rating: boolean;
  discussion: boolean;
  ownership: boolean;
}

export interface DataMigrationPlan {
  strategy: MigrationStrategy;
  phases: MigrationPhase[];
  validation: MigrationValidation;
  rollback: RollbackPlan;
  testing: MigrationTesting;
}

export interface MigrationStrategy {
  approach: 'big_bang' | 'phased' | 'parallel' | 'pilot';
  sequence: string[];
  dependencies: string[];
  constraints: string[];
  assumptions: string[];
}

export interface MigrationPhase {
  id: string;
  name: string;
  scope: string[];
  method: 'bulk' | 'incremental' | 'streaming' | 'manual';
  tools: string[];
  duration: number;
  resources: string[];
  risks: string[];
}

export interface MigrationValidation {
  preValidation: ValidationStep[];
  postValidation: ValidationStep[];
  reconciliation: ReconciliationStep[];
  rollback: RollbackValidation;
}

export interface ValidationStep {
  id: string;
  type: string;
  description: string;
  automated: boolean;
  criteria: string[];
  tolerance: number;
}

export interface ReconciliationStep {
  id: string;
  source: string;
  target: string;
  method: string;
  frequency: string;
  reporting: boolean;
}

export interface RollbackValidation {
  criteria: string[];
  automation: boolean;
  verification: string[];
}

export interface RollbackPlan {
  triggers: string[];
  steps: RollbackStep[];
  validation: string[];
  communication: string[];
  timeline: number;
}

export interface RollbackStep {
  id: string;
  action: string;
  sequence: number;
  automation: boolean;
  verification: string;
  dependencies: string[];
}

export interface MigrationTesting {
  unitTesting: TestPhase;
  integrationTesting: TestPhase;
  systemTesting: TestPhase;
  userAcceptanceTesting: TestPhase;
  performanceTesting: TestPhase;
}

export interface TestPhase {
  scope: string[];
  scenarios: TestScenario[];
  automation: number;
  environment: string;
  duration: number;
}

export interface TestScenario {
  id: string;
  description: string;
  steps: string[];
  expected: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  automation: boolean;
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T10:18:22-04:00 | decomposer@claude-sonnet-4 | Created DataMigrationTypes.ts - data migration interfaces | DataMigrationTypes.ts | OK | Extracted data migration types, <500 lines | 0.00 | c9f4e0a |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: migration-decomposition-003
- inputs: ["MigrationAnalysisTypes.ts"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"type-decomposition-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->