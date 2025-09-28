/**
 * Dependency Mapping State Machine
 * FSM-based dependency analysis architecture
 * NASA Rule 10 Compliant - Extracted from DependencyMapper.ts
 */

// FSM State Enums for NASA Rule 10 Compliance
export enum DependencyMappingState {
  IDLE = 'idle',
  ANALYZING = 'analyzing',
  BUILDING_GRAPH = 'building_graph',
  FINDING_PATHS = 'finding_paths',
  DETECTING_CYCLES = 'detecting_cycles',
  ANALYZING_IMPACT = 'analyzing_impact',
  OPTIMIZING_ORDER = 'optimizing_order',
  ASSESSING_RISKS = 'assessing_risks',
  COMPLETE = 'complete',
  ERROR = 'error'
}

export enum GraphBuildingState {
  INITIALIZE = 'initialize',
  CREATE_NODES = 'create_nodes',
  CREATE_EDGES = 'create_edges',
  CREATE_CLUSTERS = 'create_clusters',
  CALCULATE_METADATA = 'calculate_metadata',
  VALIDATE = 'validate'
}

export enum PathFindingState {
  INITIALIZE = 'initialize',
  PROCESS_NODE = 'process_node',
  FIND_DEPENDENCIES = 'find_dependencies',
  COMPLETE = 'complete'
}

export enum CycleDetectionState {
  ENTER_NODE = 'enter_node',
  CHECK_CYCLE = 'check_cycle',
  PROCESS_DEPENDENCIES = 'process_dependencies',
  EXIT_NODE = 'exit_node'
}

export enum TopologicalSortState {
  ENTER = 'enter',
  PROCESS_DEPS = 'process_deps',
  EXIT = 'exit'
}

export interface DependencyMappingRequest {
  sourceSystem: SystemProfile;
  targetSystem: SystemProfile;
  migrationScope: MigrationScope;
  options: AnalysisOptions;
}

export interface DependencyAnalysisResult {
  dependencyGraph: DependencyGraph;
  criticalPaths: CriticalPath[];
  circularDependencies: CircularDependency[];
  impactAnalysis: DependencyImpactAnalysis;
  migrationOrder: MigrationOrder;
  riskAssessment: DependencyRiskAssessment;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  clusters: DependencyCluster[];
  metadata: GraphMetadata;
}

export interface DependencyNode {
  id: string;
  name: string;
  type: 'component' | 'service' | 'database' | 'integration' | 'infrastructure';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  migrationComplexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  attributes: NodeAttributes;
  constraints: NodeConstraint[];
  dependencies: string[];
  dependents: string[];
}

export interface DependencyEdge {
  source: string;
  target: string;
  type: 'sync' | 'async' | 'data' | 'api' | 'event' | 'shared_resource';
  strength: 'weak' | 'medium' | 'strong' | 'critical';
  direction: 'bidirectional' | 'unidirectional';
  latencyRequirement: number;
  volumeRequirement: number;
  failureImpact: 'isolated' | 'localized' | 'cascading' | 'catastrophic';
}

export interface DependencyCluster {
  id: string;
  name: string;
  nodes: string[];
  cohesion: number;
  coupling: number;
  migrationUnit: boolean;
  estimatedEffort: string;
}

export interface GraphMetadata {
  totalNodes: number;
  totalEdges: number;
  totalClusters: number;
  complexity: number;
  density: number;
  averageDegree: number;
  maxDegree: number;
  diamater: number;
  radius: number;
}

export interface NodeAttributes {
  version: string;
  environment: string;
  technology: string;
  owner: string;
  criticality: string;
  availability: number;
  performance: PerformanceCharacteristics;
  security: SecurityCharacteristics;
}

export interface PerformanceCharacteristics {
  throughput: number;
  latency: number;
  availability: number;
  scalability: number;
}

export interface SecurityCharacteristics {
  classification: string;
  encryption: boolean;
  authentication: string;
  authorization: string;
}

export interface NodeConstraint {
  type: 'time' | 'resource' | 'dependency' | 'regulatory' | 'technical';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
}

export interface CriticalPath {
  id: string;
  nodes: string[];
  totalDuration: number;
  totalRisk: number;
  bottlenecks: string[];
  alternatives: AlternativePath[];
}

export interface AlternativePath {
  nodes: string[];
  duration: number;
  risk: number;
  feasibility: 'high' | 'medium' | 'low';
}

export interface CircularDependency {
  id: string;
  cycle: string[];
  type: 'direct' | 'indirect';
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution: ResolutionStrategy[];
}

export interface ResolutionStrategy {
  type: 'break_dependency' | 'merge_components' | 'introduce_mediator' | 'phase_migration';
  description: string;
  effort: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  impact: string;
}

export interface DependencyImpactAnalysis {
  nodeImpacts: NodeImpact[];
  cascadeAnalysis: CascadeAnalysis[];
  riskMatrix: RiskMatrix;
  mitigationOptions: MitigationOption[];
}

export interface NodeImpact {
  nodeId: string;
  directImpact: number;
  indirectImpact: number;
  cascadeRisk: number;
  recoveryTime: number;
  businessImpact: string;
}

export interface CascadeAnalysis {
  sourceNode: string;
  affectedNodes: string[];
  propagationPath: string[];
  maxImpact: number;
  probability: number;
}

export interface RiskMatrix {
  risks: RiskItem[];
  aggregatedRisk: number;
  topRisks: string[];
  mitigationCoverage: number;
}

export interface RiskItem {
  id: string;
  description: string;
  probability: number;
  impact: number;
  riskScore: number;
  category: string;
  mitigated: boolean;
}

export interface MitigationOption {
  riskId: string;
  strategy: string;
  effectiveness: number;
  cost: number;
  timeframe: string;
  dependencies: string[];
}

export interface MigrationOrder {
  phases: MigrationPhase[];
  parallelGroups: ParallelGroup[];
  criticalMilestones: Milestone[];
  dependencies: PhaseDependency[];
}

export interface MigrationPhase {
  id: string;
  name: string;
  components: string[];
  duration: number;
  complexity: 'low' | 'medium' | 'high' | 'very_high';
  risk: 'low' | 'medium' | 'high' | 'critical';
  prerequisites: string[];
  deliverables: string[];
}

export interface ParallelGroup {
  id: string;
  phase: string;
  components: string[];
  canRunInParallel: boolean;
  sharedResources: string[];
  estimatedTime: number;
}

export interface Milestone {
  id: string;
  name: string;
  phase: string;
  date: Date;
  criteria: string[];
  dependencies: string[];
  critical: boolean;
}

export interface PhaseDependency {
  sourcePhase: string;
  targetPhase: string;
  type: 'hard' | 'soft';
  description: string;
  flexibility: number;
}

export interface DependencyRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskCategories: RiskCategory[];
  keyRisks: KeyRisk[];
  contingencyPlans: ContingencyPlan[];
  monitoringPlan: MonitoringPlan;
}

export interface RiskCategory {
  category: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  risks: string[];
  mitigations: string[];
}

export interface KeyRisk {
  id: string;
  description: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  triggers: string[];
  indicators: string[];
  response: string;
}

export interface ContingencyPlan {
  riskId: string;
  trigger: string;
  actions: ContingencyAction[];
  resources: string[];
  timeline: string;
}

export interface ContingencyAction {
  sequence: number;
  action: string;
  responsible: string;
  duration: string;
  success_criteria: string;
}

export interface MonitoringPlan {
  metrics: MonitoringMetric[];
  frequency: string;
  alerts: AlertDefinition[];
  reports: ReportDefinition[];
}

export interface MonitoringMetric {
  name: string;
  description: string;
  source: string;
  frequency: string;
  thresholds: Threshold[];
}

export interface Threshold {
  level: 'info' | 'warning' | 'error' | 'critical';
  value: number;
  action: string;
}

export interface AlertDefinition {
  name: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[];
  escalation: EscalationRule[];
}

export interface EscalationRule {
  level: number;
  delay: number;
  recipients: string[];
  action: string;
}

export interface ReportDefinition {
  name: string;
  type: 'status' | 'progress' | 'risk' | 'performance';
  frequency: string;
  recipients: string[];
  format: string;
}

// Required dependency interfaces
export interface SystemProfile {
  id: string;
  name: string;
  type: string;
  version: string;
  components: any[];
  dependencies: any[];
}

export interface MigrationScope {
  components: string[];
  exclusions: string[];
  constraints: any[];
}

export interface AnalysisOptions {
  depth: string;
  includeIndirect: boolean;
  maxDepth: number;
  parallelAnalysis: boolean;
}