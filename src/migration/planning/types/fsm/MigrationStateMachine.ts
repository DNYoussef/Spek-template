/**
 * Migration State Machine Types
 * FSM-based state management for migration analysis
 * NASA Rule 10 Compliant - Extracted from MigrationAnalysisTypes.ts
 */

// FSM State and Event Enums
export enum MigrationState {
  IDLE = 'IDLE',
  ANALYZING_SOURCE = 'ANALYZING_SOURCE',
  ANALYZING_TARGET = 'ANALYZING_TARGET',
  ASSESSING_COMPATIBILITY = 'ASSESSING_COMPATIBILITY',
  PLANNING_MIGRATION = 'PLANNING_MIGRATION',
  VALIDATING_PLAN = 'VALIDATING_PLAN',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum MigrationEvent {
  START_ANALYSIS = 'START_ANALYSIS',
  SOURCE_COMPLETE = 'SOURCE_COMPLETE',
  TARGET_COMPLETE = 'TARGET_COMPLETE',
  COMPATIBILITY_COMPLETE = 'COMPATIBILITY_COMPLETE',
  PLANNING_COMPLETE = 'PLANNING_COMPLETE',
  VALIDATION_COMPLETE = 'VALIDATION_COMPLETE',
  ANALYSIS_ERROR = 'ANALYSIS_ERROR',
  RESET = 'RESET'
}

// Core migration types
export interface ImpactAnalysisRequest {
  migrationId: string;
  sourceSystem: SystemProfile;
  targetSystem: SystemProfile;
  migrationScope: MigrationScope;
  timeline: MigrationTimeline;
  constraints: AnalysisConstraint[];
  options: AnalysisOptions;
}

export interface SystemProfile {
  id: string;
  name: string;
  type: 'application' | 'database' | 'infrastructure' | 'service' | 'protocol';
  version: string;
  environment: 'development' | 'staging' | 'production';
  architecture: ArchitectureProfile;
  performance: PerformanceProfile;
  dependencies: SystemDependency[];
  users: UserProfile[];
  data: DataProfile;
  compliance: ComplianceProfile;
  monitoring: MonitoringProfile;
}

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

export interface SystemDependency {
  id: string;
  name: string;
  type: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  relationship: 'depends_on' | 'provides_to' | 'integrates_with';
}

export interface ScalabilityInfo {
  maxConcurrentUsers: number;
  maxThroughput: number;
  scalingStrategy: string;
  bottlenecks: string[];
}

export interface AvailabilityInfo {
  currentSla: number;
  targetSla: number;
  redundancy: string;
  failoverTime: number;
}

export interface SecurityInfo {
  authenticationMethods: string[];
  authorizationModel: string;
  encryptionInTransit: boolean;
  encryptionAtRest: boolean;
  complianceFrameworks: string[];
}