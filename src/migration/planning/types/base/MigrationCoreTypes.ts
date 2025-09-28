/**
 * Migration Core Types - Base interfaces and types
 * Extracted from MigrationAnalysisTypes.ts for NASA Rule 10 compliance
 * Focus: Core migration concepts and basic data structures
 */

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

export interface MigrationScope {
  components: string[];
  systems: string[];
  data: string[];
  users: string[];
  integrations: string[];
  customizations: string[];
}

export interface MigrationTimeline {
  phases: TimelinePhase[];
  milestones: TimelineMilestone[];
  dependencies: TimelineDependency[];
  buffers: TimelineBuffer[];
  constraints: TimelineConstraint[];
}

export interface TimelinePhase {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  prerequisites: string[];
  deliverables: string[];
  resources: string[];
  risks: string[];
}

export interface TimelineMilestone {
  id: string;
  name: string;
  date: Date;
  type: 'start' | 'end' | 'checkpoint' | 'decision' | 'delivery';
  description: string;
  criteria: string[];
  stakeholders: string[];
}

export interface TimelineDependency {
  id: string;
  type: 'start_to_start' | 'start_to_finish' | 'finish_to_start' | 'finish_to_finish';
  predecessor: string;
  successor: string;
  lag: number;
  constraint: string;
}

export interface TimelineBuffer {
  id: string;
  type: 'management' | 'feeding' | 'resource' | 'integration';
  duration: number;
  location: string;
  justification: string;
}

export interface TimelineConstraint {
  id: string;
  type: 'must_start_on' | 'must_finish_on' | 'start_no_earlier' | 'start_no_later' | 'finish_no_earlier' | 'finish_no_later';
  date: Date;
  flexibility: number;
  impact: string;
}

export interface AnalysisConstraint {
  id: string;
  type: 'resource' | 'time' | 'budget' | 'quality' | 'scope' | 'regulatory';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  flexibility: 'fixed' | 'negotiable' | 'flexible';
  mitigation: string[];
}

export interface AnalysisOptions {
  depth: 'high_level' | 'detailed' | 'comprehensive';
  methodology: 'qualitative' | 'quantitative' | 'hybrid';
  riskAssessment: boolean;
  costBenefitAnalysis: boolean;
  performanceAnalysis: boolean;
  securityAnalysis: boolean;
  complianceAnalysis: boolean;
  stakeholderAnalysis: boolean;
  contingencyPlanning: boolean;
}

// Basic data structures
export interface SystemDependency {
  id: string;
  type: 'internal' | 'external' | 'shared' | 'vendor';
  system: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  relationship: 'consumer' | 'provider' | 'peer';
  dataFlow: 'inbound' | 'outbound' | 'bidirectional';
  protocol: string;
  volume: number;
  frequency: string;
}

export interface UserProfile {
  type: string;
  count: number;
  characteristics: UserCharacteristics;
  usage: UsagePattern[];
  requirements: UserRequirement[];
  impact: UserImpact;
}

export interface UserCharacteristics {
  skillLevel: 'novice' | 'intermediate' | 'advanced' | 'expert';
  technicalSavvy: 'low' | 'medium' | 'high';
  changeReadiness: 'resistant' | 'neutral' | 'supportive' | 'champion';
  businessRole: string;
  department: string;
  location: string[];
}

export interface UsagePattern {
  timeOfDay: string;
  frequency: string;
  duration: number;
  features: string[];
  volume: number;
  concurrency: number;
}

export interface UserRequirement {
  requirement: string;
  priority: 'must_have' | 'should_have' | 'could_have' | 'wont_have';
  impact: string;
  alternative: string;
}

export interface UserImpact {
  productivity: number;
  satisfaction: number;
  training: TrainingRequirement;
  support: SupportRequirement;
}

export interface TrainingRequirement {
  required: boolean;
  duration: number;
  delivery: 'instructor_led' | 'online' | 'self_paced' | 'job_aids';
  audience: string[];
  cost: number;
}

export interface SupportRequirement {
  level: 'basic' | 'standard' | 'premium' | 'enterprise';
  channels: string[];
  hours: string;
  escalation: string[];
  documentation: string[];
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T10:15:32-04:00 | decomposer@claude-sonnet-4 | Created MigrationCoreTypes.ts - base migration interfaces | MigrationCoreTypes.ts | OK | Extracted core migration types, <500 lines | 0.00 | a7f2c8d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: migration-decomposition-001
- inputs: ["MigrationAnalysisTypes.ts"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"type-decomposition-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->