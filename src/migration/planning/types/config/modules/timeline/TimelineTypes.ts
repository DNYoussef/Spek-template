/**
 * Timeline Configuration Types
 * Types for migration timeline, phases, milestones, and scheduling
 */

// Timeline Structure
export interface MigrationTimeline {
  phases: MigrationPhase[];
  milestones: Milestone[];
  dependencies: Dependency[];
  critical_path: string[];
}

export interface MigrationPhase {
  id: string;
  name: string;
  duration: string;
  start_date: Date;
  end_date: Date;
  dependencies: string[];
  deliverables: Deliverable[];
  risks: RiskItem[];
  resources: ResourceAllocation[];
}

export interface Milestone {
  id: string;
  name: string;
  date: Date;
  type: 'start' | 'checkpoint' | 'deliverable' | 'completion';
  criteria: AcceptanceCriteria[];
  dependencies: string[];
}

export interface AcceptanceCriteria {
  id: string;
  description: string;
  type: 'functional' | 'technical' | 'business' | 'quality';
  measurement: string;
  target: any;
  validation_method: string;
}

export interface Dependency {
  id: string;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  predecessor: string;
  successor: string;
  lag: number;
  description: string;
}

export interface Deliverable {
  id: string;
  name: string;
  type: 'document' | 'code' | 'configuration' | 'training' | 'system' | 'process';
  description: string;
  acceptance_criteria: string[];
  owner: string;
  due_date: Date;
}

export interface RiskItem {
  id: string;
  description: string;
  probability: number;
  impact: number;
  mitigation_strategy: string;
  owner: string;
}

export interface ResourceAllocation {
  resource_id: string;
  resource_type: 'human' | 'technical' | 'financial';
  allocation_percentage: number;
  start_date: Date;
  end_date: Date;
  cost: number;
}

// Scheduling and Planning
export interface SchedulingConfiguration {
  calendar: WorkingCalendar;
  constraints: SchedulingConstraint[];
  optimization_criteria: OptimizationCriteria[];
  buffer_strategy: BufferStrategy;
}

export interface WorkingCalendar {
  working_days: string[];
  working_hours: WorkingHours;
  holidays: Holiday[];
  exceptions: CalendarException[];
}

export interface WorkingHours {
  start_time: string;
  end_time: string;
  break_times: BreakTime[];
  timezone: string;
}

export interface BreakTime {
  start_time: string;
  end_time: string;
  description: string;
}

export interface Holiday {
  date: Date;
  name: string;
  type: 'national' | 'company' | 'regional';
  recurring: boolean;
}

export interface CalendarException {
  date: Date;
  type: 'working_day' | 'non_working_day' | 'partial_day';
  working_hours?: WorkingHours;
  reason: string;
}

export interface SchedulingConstraint {
  type: 'must_start_on' | 'must_finish_on' | 'start_no_earlier_than' | 'finish_no_later_than';
  task_id: string;
  date: Date;
  reason: string;
  flexibility: 'hard' | 'soft';
}

export interface OptimizationCriteria {
  objective: 'minimize_duration' | 'minimize_cost' | 'maximize_quality' | 'balance_resources';
  weight: number;
  constraints: string[];
}

export interface BufferStrategy {
  type: 'percentage' | 'fixed_time' | 'risk_based' | 'critical_chain';
  value: number;
  application: 'per_task' | 'per_phase' | 'project_level';
}

// Timeline Analysis and Optimization
export interface TimelineAnalysis {
  critical_path: CriticalPathAnalysis;
  resource_analysis: ResourceAnalysis;
  risk_analysis: TimelineRiskAnalysis;
  scenario_analysis: ScenarioAnalysis[];
  optimization_recommendations: OptimizationRecommendation[];
}

export interface CriticalPathAnalysis {
  critical_path: string[];
  total_duration: number;
  float_analysis: FloatAnalysis[];
  bottlenecks: Bottleneck[];
}

export interface FloatAnalysis {
  task_id: string;
  total_float: number;
  free_float: number;
  criticality_index: number;
}

export interface Bottleneck {
  task_id: string;
  type: 'resource' | 'dependency' | 'constraint';
  impact: number;
  mitigation_options: string[];
}

export interface ResourceAnalysis {
  utilization: ResourceUtilization[];
  conflicts: ResourceConflict[];
  leveling_recommendations: LevelingRecommendation[];
}

export interface ResourceUtilization {
  resource_id: string;
  time_period: TimePeriod;
  utilization_percentage: number;
  overallocation_periods: OverallocationPeriod[];
}

export interface TimePeriod {
  start_date: Date;
  end_date: Date;
  description?: string;
}

export interface OverallocationPeriod extends TimePeriod {
  overallocation_percentage: number;
  affected_tasks: string[];
  resolution_options: string[];
}

export interface ResourceConflict {
  resource_id: string;
  conflicting_tasks: string[];
  time_period: TimePeriod;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution_priority: number;
}

export interface LevelingRecommendation {
  type: 'delay_task' | 'split_task' | 'reassign_resource' | 'adjust_allocation';
  task_id: string;
  resource_id: string;
  impact_assessment: string;
  effort_required: string;
}

export interface TimelineRiskAnalysis {
  schedule_risks: ScheduleRisk[];
  delay_probability: DelayProbability;
  impact_analysis: DelayImpactAnalysis;
  mitigation_strategies: RiskMitigationStrategy[];
}

export interface ScheduleRisk {
  id: string;
  description: string;
  affected_tasks: string[];
  probability: number;
  schedule_impact: number;
  cost_impact: number;
  early_warning_indicators: string[];
}

export interface DelayProbability {
  on_time_probability: number;
  delay_scenarios: DelayScenario[];
  monte_carlo_analysis?: MonteCarloResult;
}

export interface DelayScenario {
  delay_duration: number;
  probability: number;
  causes: string[];
  impact_description: string;
}

export interface MonteCarloResult {
  iterations: number;
  completion_date_distribution: DateDistribution;
  confidence_intervals: ConfidenceInterval[];
}

export interface DateDistribution {
  p10: Date;
  p25: Date;
  p50: Date;
  p75: Date;
  p90: Date;
  mean: Date;
  standard_deviation: number;
}

export interface ConfidenceInterval {
  confidence_level: number;
  earliest_date: Date;
  latest_date: Date;
}

export interface DelayImpactAnalysis {
  business_impact: BusinessImpact;
  financial_impact: FinancialImpact;
  stakeholder_impact: StakeholderImpact[];
}

export interface BusinessImpact {
  revenue_loss: number;
  opportunity_cost: number;
  operational_disruption: string;
  competitive_disadvantage: string;
}

export interface FinancialImpact {
  additional_costs: number;
  penalty_costs: number;
  resource_costs: number;
  contingency_needed: number;
}

export interface StakeholderImpact {
  stakeholder_group: string;
  impact_description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation_actions: string[];
}

export interface RiskMitigationStrategy {
  risk_id: string;
  strategy_type: 'avoid' | 'mitigate' | 'transfer' | 'accept';
  actions: MitigationAction[];
  cost: number;
  effectiveness: number;
  implementation_effort: string;
}

export interface MitigationAction {
  description: string;
  responsible_party: string;
  due_date: Date;
  success_criteria: string[];
  monitoring_method: string;
}

export interface ScenarioAnalysis {
  scenario_name: string;
  assumptions: string[];
  timeline_changes: TimelineChange[];
  resource_changes: ResourceChange[];
  impact_summary: ImpactSummary;
}

export interface TimelineChange {
  affected_element: string;
  change_type: 'duration' | 'date' | 'dependency' | 'constraint';
  original_value: any;
  new_value: any;
  reason: string;
}

export interface ResourceChange {
  resource_id: string;
  change_type: 'availability' | 'skill_level' | 'cost' | 'assignment';
  original_value: any;
  new_value: any;
  reason: string;
}

export interface ImpactSummary {
  duration_impact: number;
  cost_impact: number;
  quality_impact: string;
  risk_impact: string;
  stakeholder_satisfaction: string;
}

export interface OptimizationRecommendation {
  type: 'schedule' | 'resource' | 'cost' | 'risk';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  implementation_steps: string[];
  expected_benefit: string;
  implementation_effort: string;
  risks: string[];
}