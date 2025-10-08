/**
 * Risk Assessment Types - FSM State and Event Definitions
 * Part of RiskAssessmentEngine decomposition
 * NASA Rule 10 compliant - focused type definitions
 */

// FSM State Definitions
export enum RiskAssessmentState {
  INITIALIZED = 'initialized',
  COLLECTING_DATA = 'collecting_data',
  ANALYZING_RISKS = 'analyzing_risks',
  VALIDATING_RESULTS = 'validating_results',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum RiskAssessmentEvent {
  START_ASSESSMENT = 'start_assessment',
  DATA_COLLECTED = 'data_collected',
  DATA_COLLECTION_FAILED = 'data_collection_failed',
  ANALYSIS_COMPLETED = 'analysis_completed',
  ANALYSIS_FAILED = 'analysis_failed',
  VALIDATION_PASSED = 'validation_passed',
  VALIDATION_FAILED = 'validation_failed',
  CANCEL = 'cancel',
  RETRY = 'retry'
}

export interface RiskAssessmentRequest {
  assessmentId: string;
  migrationPlan: MigrationPlan;
  systemContext: SystemContext;
  stakeholders: Stakeholder[];
  constraints: RiskConstraint[];
  historicalData?: HistoricalData;
  options: RiskAssessmentOptions;
}

export interface RiskAssessmentResult {
  assessmentId: string;
  overallRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  identifiedRisks: IdentifiedRisk[];
  mitigationStrategies: MitigationStrategy[];
  recommendations: Recommendation[];
  assessmentSummary: AssessmentSummary;
  metadata: AssessmentMetadata;
}

export interface IdentifiedRisk {
  riskId: string;
  category: RiskCategory;
  description: string;
  probability: number; // 0-1
  impact: number; // 0-1
  riskScore: number; // probability * impact
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  triggers: string[];
  indicators: string[];
  mitigationOptions: MitigationOption[];
}

export interface MitigationStrategy {
  strategyId: string;
  riskIds: string[];
  description: string;
  approach: MitigationApproach;
  cost: number;
  effort: EffortEstimate;
  effectiveness: number; // 0-1
  timeframe: string;
  dependencies: string[];
  resources: ResourceRequirement[];
}

export interface Recommendation {
  recommendationId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: RecommendationCategory;
  title: string;
  description: string;
  rationale: string;
  implementation: ImplementationGuidance;
  benefits: string[];
  tradeoffs: string[];
}

export interface MigrationPlan {
  id: string;
  name: string;
  scope: MigrationScope;
  phases: MigrationPhase[];
  timeline: Timeline;
  resources: ResourcePlan;
  dependencies: Dependency[];
  assumptions: Assumption[];
}

export interface SystemContext {
  systemId: string;
  systemName: string;
  currentArchitecture: ArchitectureDescription;
  targetArchitecture: ArchitectureDescription;
  businessContext: BusinessContext;
  technicalContext: TechnicalContext;
  regulatoryContext: RegulatoryContext;
}

export interface Stakeholder {
  stakeholderId: string;
  name: string;
  role: string;
  department: string;
  influence: 'LOW' | 'MEDIUM' | 'HIGH';
  interest: 'LOW' | 'MEDIUM' | 'HIGH';
  concerns: string[];
  expectations: string[];
}

export interface RiskConstraint {
  constraintId: string;
  type: ConstraintType;
  description: string;
  severity: 'SOFT' | 'HARD';
  value: any;
  rationale: string;
}

export interface HistoricalData {
  previousMigrations: PreviousMigration[];
  incidents: HistoricalIncident[];
  lessons: LessonLearned[];
  benchmarks: Benchmark[];
}

export interface RiskAssessmentOptions {
  assessmentDepth: 'QUICK' | 'STANDARD' | 'COMPREHENSIVE';
  includeProbabilityAnalysis: boolean;
  includeImpactAnalysis: boolean;
  includeMitigationPlanning: boolean;
  includeStakeholderAnalysis: boolean;
  riskThreshold: number;
  timeframe: string;
  updateFrequency: string;
}

// Supporting types
export type RiskCategory =
  | 'TECHNICAL'
  | 'OPERATIONAL'
  | 'BUSINESS'
  | 'SECURITY'
  | 'COMPLIANCE'
  | 'RESOURCE'
  | 'TIMELINE'
  | 'QUALITY';

export type MitigationApproach =
  | 'AVOID'
  | 'MITIGATE'
  | 'TRANSFER'
  | 'ACCEPT'
  | 'MONITOR';

export type RecommendationCategory =
  | 'RISK_MITIGATION'
  | 'PROCESS_IMPROVEMENT'
  | 'RESOURCE_OPTIMIZATION'
  | 'TIMELINE_ADJUSTMENT'
  | 'STAKEHOLDER_ENGAGEMENT';

export type ConstraintType =
  | 'BUDGET'
  | 'TIMELINE'
  | 'RESOURCE'
  | 'REGULATORY'
  | 'TECHNICAL'
  | 'BUSINESS';

export interface AssessmentRecord {
  assessmentId: string;
  timestamp: number;
  state: RiskAssessmentState;
  progress: number;
  currentPhase: string;
  completedPhases: string[];
  pendingPhases: string[];
  errors: AssessmentError[];
}

export interface AssessmentError {
  errorId: string;
  timestamp: number;
  phase: string;
  errorType: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recoverable: boolean;
}

export interface AssessmentSummary {
  totalRisks: number;
  risksByCategory: Record<RiskCategory, number>;
  risksBySeverity: Record<string, number>;
  mitigationCoverage: number;
  overallConfidence: number;
  assessmentDuration: number;
}

export interface AssessmentMetadata {
  assessmentDate: Date;
  assessor: string;
  version: string;
  methodology: string;
  tools: string[];
  dataQuality: DataQualityMetrics;
}

export interface DataQualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  reliability: number;
}

// Additional supporting interfaces
export interface MigrationScope {
  systems: string[];
  components: string[];
  dataVolume: number;
  userBase: number;
  geographicScope: string[];
}

export interface MigrationPhase {
  phaseId: string;
  name: string;
  description: string;
  duration: number;
  prerequisites: string[];
  deliverables: string[];
  risks: string[];
}

export interface Timeline {
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
  criticalPath: string[];
}

export interface Milestone {
  milestoneId: string;
  name: string;
  date: Date;
  dependencies: string[];
  criteria: string[];
}

export interface ResourcePlan {
  personnel: PersonnelRequirement[];
  infrastructure: InfrastructureRequirement[];
  budget: BudgetAllocation[];
  tooling: ToolingRequirement[];
}

export interface PersonnelRequirement {
  role: string;
  skillLevel: string;
  allocation: number;
  duration: number;
  availability: string;
}

export interface InfrastructureRequirement {
  type: string;
  specifications: Record<string, any>;
  quantity: number;
  duration: number;
}

export interface BudgetAllocation {
  category: string;
  amount: number;
  currency: string;
  contingency: number;
}

export interface ToolingRequirement {
  tool: string;
  purpose: string;
  licensing: string;
  cost: number;
}

export interface Dependency {
  dependencyId: string;
  type: string;
  description: string;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  externalDependency: boolean;
}

export interface Assumption {
  assumptionId: string;
  description: string;
  rationale: string;
  confidence: number;
  validationRequired: boolean;
}

export interface ArchitectureDescription {
  components: Component[];
  interfaces: Interface[];
  dataFlows: DataFlow[];
  technologies: Technology[];
}

export interface Component {
  componentId: string;
  name: string;
  type: string;
  responsibilities: string[];
  interfaces: string[];
}

export interface Interface {
  interfaceId: string;
  name: string;
  protocol: string;
  format: string;
  security: SecurityRequirement[];
}

export interface DataFlow {
  flowId: string;
  source: string;
  destination: string;
  dataType: string;
  volume: number;
  frequency: string;
}

export interface Technology {
  technologyId: string;
  name: string;
  version: string;
  purpose: string;
  maturity: string;
}

export interface BusinessContext {
  businessDrivers: string[];
  objectives: string[];
  successCriteria: string[];
  constraints: string[];
  stakeholderGroups: string[];
}

export interface TechnicalContext {
  currentPlatforms: string[];
  targetPlatforms: string[];
  integrationPoints: string[];
  dataVolumes: Record<string, number>;
  performanceRequirements: PerformanceRequirement[];
}

export interface RegulatoryContext {
  regulations: Regulation[];
  complianceRequirements: ComplianceRequirement[];
  auditRequirements: AuditRequirement[];
  certifications: Certification[];
}

export interface PerformanceRequirement {
  metric: string;
  threshold: number;
  unit: string;
  criticality: string;
}

export interface Regulation {
  regulationId: string;
  name: string;
  jurisdiction: string;
  applicability: string;
  requirements: string[];
}

export interface ComplianceRequirement {
  requirementId: string;
  standard: string;
  control: string;
  evidence: string[];
  frequency: string;
}

export interface AuditRequirement {
  auditType: string;
  frequency: string;
  scope: string[];
  auditor: string;
}

export interface Certification {
  certificationId: string;
  name: string;
  issuer: string;
  validUntil: Date;
  scope: string[];
}

export interface SecurityRequirement {
  requirementId: string;
  type: string;
  level: string;
  controls: string[];
}

export interface MitigationOption {
  optionId: string;
  description: string;
  approach: MitigationApproach;
  cost: number;
  effort: EffortEstimate;
  effectiveness: number;
}

export interface EffortEstimate {
  hours: number;
  skillLevel: string;
  duration: string;
  confidence: number;
}

export interface ResourceRequirement {
  type: string;
  quantity: number;
  unit: string;
  availability: string;
}

export interface ImplementationGuidance {
  steps: string[];
  timeline: string;
  prerequisites: string[];
  risks: string[];
  successCriteria: string[];
}

export interface PreviousMigration {
  migrationId: string;
  scope: string;
  timeline: string;
  outcome: string;
  lessons: string[];
  risks: string[];
}

export interface HistoricalIncident {
  incidentId: string;
  category: string;
  description: string;
  impact: string;
  resolution: string;
  prevention: string[];
}

export interface LessonLearned {
  lessonId: string;
  context: string;
  lesson: string;
  applicability: string;
  recommendation: string;
}

export interface Benchmark {
  benchmarkId: string;
  metric: string;
  value: number;
  unit: string;
  context: string;
  source: string;
}