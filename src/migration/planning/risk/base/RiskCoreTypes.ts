/**
 * Risk Assessment Core Types - Base risk interfaces and core structures
 * Extracted from RiskAssessmentTypes.ts for NASA Rule 10 compliance
 * Focus: Core risk concepts, basic assessment structures
 */

export interface RiskAssessmentRequest {
  assessmentId: string;
  migrationPlan: MigrationPlan;
  systemContext: SystemContext;
  stakeholders: Stakeholder[];
  constraints: RiskConstraint[];
  historicalData: HistoricalData;
  options: RiskAssessmentOptions;
}

export interface RiskAssessmentResult {
  assessment_id: string;
  timestamp: Date;
  duration: number;
  methodology: string;
  confidence_level: number;
  overall_risk_profile: OverallRiskProfile;
  risk_categories: RiskCategory[];
  risk_register: RiskRegister;
  risk_matrix: RiskMatrix;
  mitigation_portfolio: MitigationPortfolio;
  monitoring_framework: MonitoringFramework;
  recommendations: RiskRecommendation[];
  scenarios: RiskScenario[];
  sensitivity_analysis?: SensitivityAnalysis;
  quality_assessment: AssessmentQuality;
}

export interface RiskAssessmentOptions {
  methodology: 'qualitative' | 'quantitative' | 'hybrid' | 'monte_carlo';
  scope: 'technical' | 'business' | 'comprehensive';
  depth: 'high_level' | 'detailed' | 'comprehensive';
  time_horizon: string;
  confidence_level: number;
  sensitivity_analysis: boolean;
  scenario_analysis: boolean;
  expert_judgment: boolean;
  stakeholder_input: boolean;
  benchmarking: boolean;
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

export interface MigrationScope {
  components: string[];
  systems: string[];
  data: string[];
  users: string[];
}

export interface MigrationPhase {
  id: string;
  name: string;
  duration: number;
  prerequisites: string[];
  deliverables: string[];
  risks: string[];
}

export interface Timeline {
  start: Date;
  end: Date;
  phases: any[];
  milestones: any[];
}

export interface ResourcePlan {
  human: any[];
  technical: any[];
  financial: any;
}

export interface Dependency {
  id: string;
  type: string;
  description: string;
  impact: string;
}

export interface Assumption {
  id: string;
  description: string;
  confidence: number;
  validation: string;
}

export interface RiskConstraint {
  type: 'regulatory' | 'business' | 'technical' | 'financial' | 'operational';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  flexibility: 'fixed' | 'negotiable' | 'flexible';
  mitigation_options: string[];
}

export interface OverallRiskProfile {
  risk_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high' | 'extreme';
  risk_score: number;
  confidence: number;
  key_drivers: RiskDriver[];
  residual_risk: number;
  risk_appetite_alignment: RiskAppetiteAlignment;
  trend: RiskTrend;
}

export interface RiskDriver {
  factor: string;
  contribution: number;
  controllability: 'high' | 'medium' | 'low' | 'none';
  time_sensitivity: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  impact_areas: string[];
}

export interface RiskAppetiteAlignment {
  alignment: 'within' | 'approaching' | 'exceeding' | 'far_exceeding';
  gap: number;
  recommendations: string[];
  escalation_required: boolean;
}

export interface RiskTrend {
  direction: 'increasing' | 'stable' | 'decreasing';
  velocity: 'slow' | 'moderate' | 'fast' | 'accelerating';
  confidence: number;
  factors: TrendInfluenceFactor[];
}

export interface TrendInfluenceFactor {
  factor: string;
  influence: number;
  timeframe: string;
  controllability: string;
}

export interface RiskCategory {
  name: string;
  description: string;
  risk_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  risk_count: number;
  top_risks: string[];
  mitigation_status: MitigationStatus;
  trend: CategoryTrend;
  stakeholder_concern: StakeholderConcern;
}

export interface MitigationStatus {
  coverage: number; // percentage
  effectiveness: number; // percentage
  cost: number;
  timeline: string;
  gaps: string[];
}

export interface CategoryTrend {
  risk_emergence: number;
  risk_escalation: number;
  risk_resolution: number;
  net_change: number;
}

export interface StakeholderConcern {
  level: 'low' | 'medium' | 'high' | 'critical';
  stakeholders: string[];
  concerns: string[];
  communication_frequency: string;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  department: string;
  influence: 'low' | 'medium' | 'high' | 'critical';
  interest: 'low' | 'medium' | 'high' | 'critical';
  riskTolerance: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  impactOnProject: StakeholderImpact;
  communicationPreferences: CommunicationPreference[];
}

export interface StakeholderImpact {
  decisionMaking: boolean;
  resourceAllocation: boolean;
  approval: boolean;
  implementation: boolean;
  testing: boolean;
  signOff: boolean;
}

export interface CommunicationPreference {
  method: string;
  frequency: string;
  detail_level: 'summary' | 'detailed' | 'technical';
  urgency_threshold: 'low' | 'medium' | 'high' | 'critical';
}

export interface AssessmentRecord {
  assessmentId: string;
  timestamp: Date;
  duration: number;
  riskLevel: string;
  riskCount: number;
  success: boolean;
  error?: string;
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T10:23:15-04:00 | decomposer@claude-sonnet-4 | Created RiskCoreTypes.ts - core risk assessment interfaces | RiskCoreTypes.ts | OK | Extracted core risk types, <500 lines | 0.00 | f2b7e8c |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: risk-decomposition-001
- inputs: ["RiskAssessmentTypes.ts"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"type-decomposition-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->