/**
 * Risk Domain Types
 * Core risk management types including categories, matrices, and mitigation
 */

import { BaseRisk, RiskScore, TimeFrame } from '../core/BaseRiskTypes';

// Risk Categories and Classification
export interface RiskCategory {
  name: string;
  description: string;
  risks: Risk[];
  score: number;
  weight: number;
  subcategories: RiskSubcategory[];
}

export interface RiskSubcategory {
  name: string;
  parent_category: string;
  risks: string[];
  assessment_criteria: string[];
}

export interface Risk extends BaseRisk {
  subcategory?: string;
  triggers: RiskTrigger[];
  indicators: RiskIndicator[];
  interdependencies: RiskDependency[];
  historical_occurrences: HistoricalOccurrence[];
}

export interface RiskTrigger {
  id: string;
  name: string;
  type: 'internal' | 'external' | 'technical' | 'business';
  probability: number;
  detection_method: string;
  early_warning_signs: string[];
}

export interface RiskIndicator {
  name: string;
  type: 'leading' | 'lagging';
  measurement: string;
  threshold: ThresholdValue;
  monitoring_frequency: string;
  data_source: string;
}

export interface ThresholdValue {
  green: number;
  yellow: number;
  red: number;
  unit: string;
}

export interface RiskDependency {
  related_risk_id: string;
  relationship_type: 'causal' | 'correlation' | 'mutual_exclusion' | 'amplification';
  strength: number; // 0-100
  description: string;
}

export interface HistoricalOccurrence {
  date: Date;
  description: string;
  impact_realized: ImpactRealized;
  lessons_learned: string[];
  prevention_measures_added: string[];
}

export interface ImpactRealized {
  financial: number;
  operational: string;
  timeline_delay: number;
  reputation: string;
  compliance: string[];
}

// Risk Register
export interface RiskRegister {
  risks: Risk[];
  last_updated: Date;
  version: string;
  owner: string;
  review_cycle: string;
  metadata: RiskRegisterMetadata;
}

export interface RiskRegisterMetadata {
  total_risks: number;
  risk_distribution: RiskDistribution;
  trend_analysis: TrendAnalysis;
  quality_indicators: QualityIndicator[];
}

export interface RiskDistribution {
  by_category: CategoryDistribution[];
  by_priority: PriorityDistribution[];
  by_status: StatusDistribution[];
  by_owner: OwnerDistribution[];
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
  average_score: number;
}

export interface PriorityDistribution {
  priority: string;
  count: number;
  percentage: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface OwnerDistribution {
  owner: string;
  count: number;
  categories: string[];
}

export interface TrendAnalysis {
  new_risks_trend: number;
  resolved_risks_trend: number;
  average_score_trend: number;
  time_period: string;
}

export interface QualityIndicator {
  metric: string;
  value: number;
  target: number;
  status: 'good' | 'acceptable' | 'needs_improvement';
}

// Risk Matrix
export interface RiskMatrix {
  dimensions: MatrixDimensions;
  cells: MatrixCell[];
  color_coding: ColorCoding;
  risk_appetite_overlay: RiskAppetiteZone[];
}

export interface MatrixDimensions {
  probability: ProbabilityScale;
  impact: ImpactScale;
}

export interface ProbabilityScale {
  name: string;
  levels: ScaleLevel[];
  measurement_guidance: string;
}

export interface ImpactScale {
  name: string;
  levels: ScaleLevel[];
  dimensions: ImpactDimension[];
}

export interface ScaleLevel {
  value: number;
  label: string;
  description: string;
  quantitative_range?: QuantitativeRange;
}

export interface QuantitativeRange {
  min: number;
  max: number;
  unit: string;
}

export interface ImpactDimension {
  name: string;
  weight: number;
  scale_mapping: ScaleMapping[];
}

export interface ScaleMapping {
  scale_level: number;
  description: string;
  examples: string[];
}

export interface MatrixCell {
  probability_level: number;
  impact_level: number;
  risk_score: number;
  color: string;
  action_required: string;
  escalation_level: string;
}

export interface ColorCoding {
  low: string;
  medium: string;
  high: string;
  critical: string;
}

export interface RiskAppetiteZone {
  name: string;
  description: string;
  cells: CellCoordinate[];
  acceptable: boolean;
  action_guidance: string;
}

export interface CellCoordinate {
  probability: number;
  impact: number;
}

// Mitigation Portfolio
export interface MitigationPortfolio {
  strategies: MitigationStrategy[];
  timeline: MitigationTimeline;
  resource_allocation: ResourceAllocation;
  effectiveness_tracking: EffectivenessTracking;
  cost_benefit_analysis: CostBenefitAnalysis;
}

export interface MitigationStrategy {
  id: string;
  risk_id: string;
  type: 'avoid' | 'mitigate' | 'transfer' | 'accept';
  description: string;
  actions: MitigationAction[];
  cost: number;
  effort_estimate: string;
  expected_risk_reduction: number;
  success_criteria: string[];
  owner: string;
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
}

export interface MitigationAction {
  id: string;
  description: string;
  type: 'preventive' | 'detective' | 'corrective';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_duration: string;
  dependencies: string[];
  deliverables: string[];
  success_metrics: SuccessMetric[];
}

export interface SuccessMetric {
  name: string;
  target_value: number;
  measurement_method: string;
  reporting_frequency: string;
}

export interface MitigationTimeline extends TimeFrame {
  phases: MitigationPhase[];
  milestones: MitigationMilestone[];
  dependencies: MitigationDependency[];
}

export interface MitigationPhase {
  name: string;
  start_date: Date;
  end_date: Date;
  strategies: string[];
  success_criteria: string[];
}

export interface MitigationMilestone {
  name: string;
  date: Date;
  type: 'start' | 'checkpoint' | 'deliverable' | 'review' | 'completion';
  criteria: string[];
  stakeholders: string[];
}

export interface MitigationDependency {
  strategy_id: string;
  depends_on: string;
  type: 'prerequisite' | 'parallel' | 'sequence';
  impact_if_delayed: string;
}

export interface ResourceAllocation {
  total_budget: number;
  by_strategy: StrategyAllocation[];
  by_time_period: TemporalAllocation[];
  contingency: number;
}

export interface StrategyAllocation {
  strategy_id: string;
  allocated_budget: number;
  allocated_resources: AllocatedResource[];
}

export interface AllocatedResource {
  type: 'human' | 'technology' | 'external_service';
  description: string;
  quantity: number;
  cost: number;
  availability: string;
}

export interface TemporalAllocation {
  period: string;
  start_date: Date;
  end_date: Date;
  allocated_budget: number;
  strategies: string[];
}

export interface EffectivenessTracking {
  metrics: EffectivenessMetric[];
  reporting_schedule: ReportingSchedule[];
  review_process: ReviewProcess;
}

export interface EffectivenessMetric {
  name: string;
  description: string;
  measurement_method: string;
  target_value: number;
  current_value?: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export interface ReportingSchedule {
  frequency: string;
  stakeholders: string[];
  content_focus: string[];
  format: string;
}

export interface ReviewProcess {
  frequency: string;
  participants: string[];
  scope: string[];
  decision_criteria: string[];
  escalation_triggers: string[];
}

export interface CostBenefitAnalysis {
  total_investment: number;
  expected_savings: number;
  roi_calculation: ROICalculation;
  payback_period: string;
  sensitivity_analysis: SensitivityVariable[];
}

export interface ROICalculation {
  method: string;
  time_horizon: string;
  discount_rate: number;
  net_present_value: number;
  roi_percentage: number;
}

export interface SensitivityVariable {
  variable: string;
  base_case: number;
  scenarios: SensitivityScenario[];
  impact_on_roi: number;
}

export interface SensitivityScenario {
  name: string;
  value: number;
  probability: number;
  roi_impact: number;
}