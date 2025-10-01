/**
 * Princess-Drone Communication DSPy Signature Contracts
 *
 * Comprehensive signature contracts for task delegation and performance tracking
 * between Princess and Drone agents in the SPEK hierarchy.
 *
 * NASA Rule 10 Compliant | FSM-Compatible | TypeScript Type Safety
 */

import { PrincessDomain, QueenState, QueenEvent } from '../../../architecture/langgraph/queen/fsm/QueenFSMTypes';
import { DSPySignature, ResourceConstraints, QualityGateConfig, PerformanceMetrics, FallbackStrategy, ValidationRule } from './QueenPrincessSignatures';

// Drone-specific Types
export enum DroneType {
  DEVELOPMENT = 'DEVELOPMENT',
  TESTING = 'TESTING',
  ANALYSIS = 'ANALYSIS',
  DOCUMENTATION = 'DOCUMENTATION',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  INTEGRATION = 'INTEGRATION',
  DEPLOYMENT = 'DEPLOYMENT'
}

export enum DroneState {
  IDLE = 'IDLE',
  ASSIGNED = 'ASSIGNED',
  EXECUTING = 'EXECUTING',
  REPORTING = 'REPORTING',
  BLOCKED = 'BLOCKED',
  ERROR = 'ERROR',
  COMPLETED = 'COMPLETED'
}

export enum TaskComplexity {
  TRIVIAL = 'TRIVIAL',
  SIMPLE = 'SIMPLE',
  MODERATE = 'MODERATE',
  COMPLEX = 'COMPLEX',
  CRITICAL = 'CRITICAL'
}

export enum TaskPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
  EMERGENCY = 5
}

// Task Delegation Signatures

/**
 * Princess -> Drone Task Assignment Contract
 * Optimized for task clarity, resource efficiency, and execution success
 */
export interface PrincessToDroneAssignment extends DSPySignature {
  inputs: {
    readonly drone_id: string;
    readonly drone_type: DroneType;
    readonly task_definition: TaskDefinition;
    readonly execution_context: ExecutionContext;
    readonly resource_allocation: DroneResourceAllocation;
    readonly quality_requirements: readonly QualityRequirement[];
    readonly performance_expectations: PerformanceExpectations;
    readonly coordination_rules: CoordinationRules;
  };
  outputs: {
    readonly task_acknowledgment: DroneTaskAcknowledgment;
    readonly execution_plan: DroneExecutionPlan;
    readonly resource_confirmation: ResourceConfirmation;
    readonly quality_commitment: QualityCommitment;
    readonly timeline_estimate: TimelineEstimate;
    readonly risk_assessment: TaskRiskAssessment;
  };
  optimization_criteria: [
    'task_clarity_score >= 0.92',
    'resource_optimization >= 0.88',
    'execution_feasibility >= 0.85',
    'quality_achievability >= 0.90',
    'timeline_accuracy >= 0.80'
  ];
  fallback_strategy: {
    readonly strategy: 'retry';
    readonly max_retries: 2;
    readonly backoff_ms: 2000;
    readonly fallback_agent: 'backup_drone';
  };
  performance_metrics: {
    readonly latency_p95_ms: 1500;
    readonly accuracy_score: 0.91;
    readonly completion_rate: 0.94;
    readonly cost_per_task_usd: 0.08;
    readonly resource_utilization: 0.82;
  };
  validation_rules: [
    {
      readonly rule_id: 'TASK_CLARITY';
      readonly field: 'task_definition';
      readonly constraint: 'description_length >= 20 && acceptance_criteria_count >= 3';
      readonly error_message: 'Task definition must be detailed with clear acceptance criteria';
    },
    {
      readonly rule_id: 'RESOURCE_BOUNDS';
      readonly field: 'resource_allocation';
      readonly constraint: 'timeout_ms <= 3600000 && max_memory_mb <= 2048';
      readonly error_message: 'Resource allocation must respect NASA Rule 10 bounds';
    }
  ];
}

/**
 * Drone -> Princess Task Completion Contract
 * Optimized for completeness validation, quality metrics, and actionable reporting
 */
export interface DroneToPrincessCompletion extends DSPySignature {
  inputs: {
    readonly task_id: string;
    readonly completion_status: CompletionStatus;
    readonly deliverables: readonly TaskDeliverable[];
    readonly quality_metrics: DroneQualityMetrics;
    readonly performance_data: DronePerformanceData;
    readonly issues_encountered: readonly TaskIssue[];
    readonly recommendations: readonly DroneRecommendation[];
    readonly learned_patterns: readonly LearnedPattern[];
  };
  outputs: {
    readonly completion_validation: CompletionValidation;
    readonly quality_assessment: QualityAssessment;
    readonly performance_evaluation: PerformanceEvaluation;
    readonly knowledge_extraction: KnowledgeExtraction;
    readonly improvement_suggestions: readonly ImprovementSuggestion[];
    readonly next_task_optimization: NextTaskOptimization;
  };
  optimization_criteria: [
    'completeness_score >= 0.95',
    'quality_validation >= 0.92',
    'performance_accuracy >= 0.88',
    'knowledge_value >= 0.80',
    'actionability_score >= 0.85'
  ];
  fallback_strategy: {
    readonly strategy: 'escalate';
    readonly max_retries: 1;
    readonly backoff_ms: 1000;
    readonly fallback_agent: 'quality_validator';
  };
  performance_metrics: {
    readonly latency_p95_ms: 2000;
    readonly accuracy_score: 0.93;
    readonly completion_rate: 0.96;
    readonly cost_per_task_usd: 0.12;
    readonly resource_utilization: 0.75;
  };
  validation_rules: [
    {
      readonly rule_id: 'DELIVERABLE_COMPLETENESS';
      readonly field: 'deliverables';
      readonly constraint: 'all_required_present && quality_scores_above_threshold';
      readonly error_message: 'All required deliverables must be present with acceptable quality';
    },
    {
      readonly rule_id: 'QUALITY_METRICS';
      readonly field: 'quality_metrics';
      readonly constraint: 'nasa_compliance >= 0.90 && theater_score <= 0.60';
      readonly error_message: 'Quality metrics must meet minimum thresholds';
    }
  ];
}

/**
 * Princess -> Drone Performance Feedback Contract
 * Optimized for learning enhancement and performance improvement
 */
export interface PrincessToDroneFeedback extends DSPySignature {
  inputs: {
    readonly drone_id: string;
    readonly task_id: string;
    readonly performance_analysis: PerformanceAnalysis;
    readonly quality_evaluation: QualityEvaluation;
    readonly improvement_areas: readonly ImprovementArea[];
    readonly learning_objectives: readonly LearningObjective[];
    readonly optimization_targets: OptimizationTargets;
    readonly context_updates: ContextUpdates;
  };
  outputs: {
    readonly feedback_acknowledgment: FeedbackAcknowledgment;
    readonly learning_plan: LearningPlan;
    readonly performance_adjustments: readonly PerformanceAdjustment[];
    readonly capability_updates: CapabilityUpdates;
    readonly future_task_preferences: FutureTaskPreferences;
  };
  optimization_criteria: [
    'feedback_clarity >= 0.90',
    'learning_effectiveness >= 0.85',
    'performance_improvement >= 0.80',
    'adaptation_speed >= 0.75',
    'knowledge_retention >= 0.88'
  ];
  fallback_strategy: {
    readonly strategy: 'retry';
    readonly max_retries: 1;
    readonly backoff_ms: 1500;
    readonly fallback_agent: 'learning_coordinator';
  };
  performance_metrics: {
    readonly latency_p95_ms: 1000;
    readonly accuracy_score: 0.89;
    readonly completion_rate: 0.92;
    readonly cost_per_task_usd: 0.06;
    readonly resource_utilization: 0.70;
  };
  validation_rules: [
    {
      readonly rule_id: 'FEEDBACK_CONSTRUCTIVENESS';
      readonly field: 'improvement_areas';
      readonly constraint: 'actionable_count >= 2 && specificity_score >= 0.8';
      readonly error_message: 'Feedback must contain actionable, specific improvement areas';
    }
  ];
}

/**
 * Drone -> Princess Status Update Contract
 * Optimized for real-time monitoring and early problem detection
 */
export interface DroneToPrincessStatus extends DSPySignature {
  inputs: {
    readonly drone_id: string;
    readonly current_state: DroneState;
    readonly active_tasks: readonly ActiveTask[];
    readonly resource_utilization: DroneResourceUtilization;
    readonly health_metrics: DroneHealthMetrics;
    readonly progress_updates: readonly ProgressUpdate[];
    readonly blocking_issues: readonly BlockingIssue[];
    readonly capacity_forecast: DroneCapacityForecast;
  };
  outputs: {
    readonly status_summary: StatusSummary;
    readonly health_assessment: HealthAssessment;
    readonly capacity_evaluation: CapacityEvaluation;
    readonly intervention_recommendations: readonly InterventionRecommendation[];
    readonly load_balancing_suggestions: readonly LoadBalancingSuggestion[];
    readonly predictive_alerts: readonly PredictiveAlert[];
  };
  optimization_criteria: [
    'status_accuracy >= 0.95',
    'health_prediction >= 0.88',
    'early_warning >= 0.92',
    'intervention_relevance >= 0.85',
    'prediction_accuracy >= 0.80'
  ];
  fallback_strategy: {
    readonly strategy: 'degrade';
    readonly max_retries: 0;
    readonly backoff_ms: 500;
    readonly fallback_agent: 'health_monitor';
  };
  performance_metrics: {
    readonly latency_p95_ms: 800;
    readonly accuracy_score: 0.94;
    readonly completion_rate: 0.98;
    readonly cost_per_task_usd: 0.03;
    readonly resource_utilization: 0.60;
  };
  validation_rules: [
    {
      readonly rule_id: 'STATUS_FRESHNESS';
      readonly field: 'progress_updates';
      readonly constraint: 'timestamp_age_ms <= 30000';
      readonly error_message: 'Status updates must be recent (within 30 seconds)';
    }
  ];
}

// Supporting Interfaces

export interface TaskDefinition {
  readonly task_id: string;
  readonly title: string;
  readonly description: string;
  readonly complexity: TaskComplexity;
  readonly priority: TaskPriority;
  readonly task_type: DroneType;
  readonly acceptance_criteria: readonly AcceptanceCriteria[];
  readonly dependencies: readonly TaskDependency[];
  readonly deliverables: readonly DeliverableSpec[];
  readonly constraints: readonly TaskConstraint[];
}

export interface AcceptanceCriteria {
  readonly criteria_id: string;
  readonly description: string;
  readonly verification_method: 'automated' | 'manual' | 'peer_review';
  readonly success_threshold: number;
  readonly measurement_unit: string;
}

export interface TaskDependency {
  readonly dependency_id: string;
  readonly dependency_type: 'task' | 'resource' | 'external';
  readonly target_id: string;
  readonly relationship: 'blocks' | 'enables' | 'enhances';
  readonly urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface DeliverableSpec {
  readonly deliverable_id: string;
  readonly name: string;
  readonly description: string;
  readonly format: string;
  readonly quality_gates: readonly QualityGateConfig[];
  readonly validation_rules: readonly string[];
  readonly file_requirements: FileRequirements;
}

export interface FileRequirements {
  readonly max_size_bytes: number;
  readonly allowed_extensions: readonly string[];
  readonly required_metadata: readonly string[];
  readonly security_requirements: readonly string[];
}

export interface TaskConstraint {
  readonly constraint_id: string;
  readonly type: 'time' | 'resource' | 'quality' | 'security' | 'compliance';
  readonly description: string;
  readonly hard_limit: boolean;
  readonly violation_consequence: string;
}

export interface ExecutionContext {
  readonly context_id: string;
  readonly environment: 'development' | 'staging' | 'production' | 'testing';
  readonly available_tools: readonly string[];
  readonly security_context: SecurityContext;
  readonly integration_points: readonly IntegrationPoint[];
  readonly monitoring_requirements: readonly MonitoringRequirement[];
}

export interface SecurityContext {
  readonly security_level: 'public' | 'internal' | 'confidential' | 'secret';
  readonly access_permissions: readonly string[];
  readonly audit_requirements: readonly string[];
  readonly compliance_frameworks: readonly string[];
}

export interface IntegrationPoint {
  readonly integration_id: string;
  readonly system_name: string;
  readonly api_endpoint: string;
  readonly authentication_method: string;
  readonly rate_limits: RateLimits;
  readonly error_handling: ErrorHandling;
}

export interface RateLimits {
  readonly requests_per_minute: number;
  readonly burst_capacity: number;
  readonly backoff_strategy: string;
}

export interface ErrorHandling {
  readonly retry_strategy: string;
  readonly max_retries: number;
  readonly timeout_ms: number;
  readonly fallback_action: string;
}

export interface MonitoringRequirement {
  readonly metric_name: string;
  readonly collection_interval_ms: number;
  readonly alert_thresholds: Record<string, number>;
  readonly retention_period_days: number;
}

export interface DroneResourceAllocation {
  readonly allocation_id: string;
  readonly cpu_cores: number;
  readonly memory_mb: number;
  readonly storage_gb: number;
  readonly network_bandwidth_mbps: number;
  readonly execution_timeout_ms: number;
  readonly concurrent_task_limit: number;
  readonly cost_budget_credits: number;
}

export interface QualityRequirement {
  readonly requirement_id: string;
  readonly category: 'performance' | 'security' | 'reliability' | 'maintainability' | 'usability';
  readonly metric: string;
  readonly target_value: number;
  readonly measurement_method: string;
  readonly criticality: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceExpectations {
  readonly response_time_p95_ms: number;
  readonly throughput_ops_per_second: number;
  readonly error_rate_threshold: number;
  readonly availability_percentage: number;
  readonly resource_efficiency_score: number;
}

export interface CoordinationRules {
  readonly coordination_id: string;
  readonly communication_protocol: 'sync' | 'async' | 'hybrid';
  readonly status_update_frequency_ms: number;
  readonly collaboration_constraints: readonly string[];
  readonly conflict_resolution_strategy: string;
  readonly escalation_procedures: readonly EscalationProcedure[];
}

export interface EscalationProcedure {
  readonly trigger_condition: string;
  readonly escalation_level: number;
  readonly target_agent: string;
  readonly timeout_ms: number;
  readonly required_context: readonly string[];
}

export interface DroneTaskAcknowledgment {
  readonly acknowledgment_id: string;
  readonly task_id: string;
  readonly drone_id: string;
  readonly status: 'accepted' | 'rejected' | 'needs_clarification';
  readonly estimated_start_time: number;
  readonly estimated_completion_time: number;
  readonly resource_requirements_met: boolean;
  readonly capability_gaps: readonly CapabilityGap[];
  readonly clarification_requests: readonly ClarificationRequest[];
}

export interface CapabilityGap {
  readonly gap_id: string;
  readonly missing_capability: string;
  readonly impact_level: 'low' | 'medium' | 'high' | 'critical';
  readonly mitigation_options: readonly string[];
  readonly learning_requirement: boolean;
}

export interface ClarificationRequest {
  readonly request_id: string;
  readonly question: string;
  readonly category: 'requirements' | 'resources' | 'constraints' | 'context';
  readonly urgency: 'low' | 'medium' | 'high';
  readonly blocking: boolean;
}

export interface DroneExecutionPlan {
  readonly plan_id: string;
  readonly task_id: string;
  readonly execution_phases: readonly ExecutionPhase[];
  readonly resource_schedule: ResourceSchedule;
  readonly quality_checkpoints: readonly QualityCheckpoint[];
  readonly risk_mitigation_steps: readonly RiskMitigationStep[];
  readonly monitoring_plan: MonitoringPlan;
}

export interface ExecutionPhase {
  readonly phase_id: string;
  readonly name: string;
  readonly description: string;
  readonly start_time: number;
  readonly duration_ms: number;
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly success_criteria: readonly string[];
  readonly rollback_procedure: string;
}

export interface ResourceSchedule {
  readonly schedule_id: string;
  readonly resource_allocations: readonly TimedResourceAllocation[];
  readonly peak_usage_periods: readonly PeakUsagePeriod[];
  readonly optimization_opportunities: readonly string[];
}

export interface TimedResourceAllocation {
  readonly start_time: number;
  readonly end_time: number;
  readonly resource_type: string;
  readonly allocated_amount: number;
  readonly utilization_target: number;
}

export interface PeakUsagePeriod {
  readonly start_time: number;
  readonly end_time: number;
  readonly resource_type: string;
  readonly peak_usage: number;
  readonly mitigation_strategy: string;
}

export interface QualityCheckpoint {
  readonly checkpoint_id: string;
  readonly phase_id: string;
  readonly checkpoint_time: number;
  readonly quality_gates: readonly QualityGateConfig[];
  readonly validation_procedures: readonly string[];
  readonly failure_actions: readonly string[];
}

export interface RiskMitigationStep {
  readonly step_id: string;
  readonly risk_description: string;
  readonly mitigation_action: string;
  readonly trigger_condition: string;
  readonly success_metrics: readonly string[];
  readonly fallback_options: readonly string[];
}

export interface MonitoringPlan {
  readonly plan_id: string;
  readonly metrics_to_collect: readonly MetricDefinition[];
  readonly collection_frequency_ms: number;
  readonly alert_rules: readonly AlertRule[];
  readonly dashboards: readonly DashboardConfig[];
}

export interface MetricDefinition {
  readonly metric_name: string;
  readonly metric_type: 'counter' | 'gauge' | 'histogram' | 'timer';
  readonly collection_method: string;
  readonly tags: Record<string, string>;
  readonly retention_policy: string;
}

export interface AlertRule {
  readonly rule_name: string;
  readonly condition: string;
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  readonly notification_targets: readonly string[];
  readonly suppression_period_ms: number;
}

export interface DashboardConfig {
  readonly dashboard_name: string;
  readonly charts: readonly ChartConfig[];
  readonly refresh_interval_ms: number;
  readonly access_permissions: readonly string[];
}

export interface ChartConfig {
  readonly chart_type: 'line' | 'bar' | 'pie' | 'heatmap' | 'table';
  readonly data_source: string;
  readonly time_range: string;
  readonly aggregation_method: string;
}

export interface ResourceConfirmation {
  readonly confirmation_id: string;
  readonly confirmed_resources: DroneResourceAllocation;
  readonly availability_guaranteed: boolean;
  readonly allocation_start_time: number;
  readonly allocation_end_time: number;
  readonly usage_monitoring: boolean;
  readonly optimization_enabled: boolean;
}

export interface QualityCommitment {
  readonly commitment_id: string;
  readonly quality_targets: readonly QualityTarget[];
  readonly measurement_plan: QualityMeasurementPlan;
  readonly review_schedule: readonly ReviewScheduleItem[];
  readonly improvement_plan: QualityImprovementPlan;
}

export interface QualityTarget {
  readonly target_id: string;
  readonly metric_name: string;
  readonly target_value: number;
  readonly measurement_unit: string;
  readonly tolerance: number;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface QualityMeasurementPlan {
  readonly plan_id: string;
  readonly measurement_methods: readonly MeasurementMethod[];
  readonly validation_procedures: readonly ValidationProcedure[];
  readonly reporting_schedule: ReportingSchedule;
}

export interface MeasurementMethod {
  readonly method_id: string;
  readonly metric_name: string;
  readonly measurement_technique: string;
  readonly automation_level: 'manual' | 'semi_automated' | 'automated';
  readonly frequency: string;
  readonly accuracy_target: number;
}

export interface ValidationProcedure {
  readonly procedure_id: string;
  readonly validation_type: 'unit_test' | 'integration_test' | 'system_test' | 'acceptance_test';
  readonly execution_trigger: string;
  readonly success_criteria: readonly string[];
  readonly failure_escalation: string;
}

export interface ReportingSchedule {
  readonly schedule_id: string;
  readonly report_frequency: string;
  readonly report_recipients: readonly string[];
  readonly report_format: string;
  readonly delivery_method: string;
}

export interface ReviewScheduleItem {
  readonly review_id: string;
  readonly review_type: 'checkpoint' | 'milestone' | 'gate' | 'retrospective';
  readonly scheduled_time: number;
  readonly participants: readonly string[];
  readonly agenda_items: readonly string[];
  readonly decision_authority: string;
}

export interface QualityImprovementPlan {
  readonly plan_id: string;
  readonly improvement_initiatives: readonly ImprovementInitiative[];
  readonly resource_requirements: ResourceConstraints;
  readonly timeline: Timeline;
  readonly success_metrics: readonly string[];
}

export interface ImprovementInitiative {
  readonly initiative_id: string;
  readonly description: string;
  readonly expected_benefit: string;
  readonly implementation_effort: 'low' | 'medium' | 'high';
  readonly timeline: Timeline;
  readonly dependencies: readonly string[];
}

export interface Timeline {
  readonly start_date: number;
  readonly end_date: number;
  readonly milestones: readonly TimelineMilestone[];
  readonly critical_path: readonly string[];
}

export interface TimelineMilestone {
  readonly milestone_id: string;
  readonly name: string;
  readonly target_date: number;
  readonly deliverables: readonly string[];
  readonly success_criteria: readonly string[];
}

export interface TimelineEstimate {
  readonly estimate_id: string;
  readonly task_id: string;
  readonly estimated_start: number;
  readonly estimated_completion: number;
  readonly confidence_level: number;
  readonly assumptions: readonly string[];
  readonly risk_factors: readonly RiskFactor[];
  readonly buffer_time_ms: number;
}

export interface RiskFactor {
  readonly factor_id: string;
  readonly description: string;
  readonly probability: number;
  readonly impact_days: number;
  readonly mitigation_strategy: string;
}

export interface TaskRiskAssessment {
  readonly assessment_id: string;
  readonly overall_risk_level: 'low' | 'medium' | 'high' | 'critical';
  readonly identified_risks: readonly IdentifiedRisk[];
  readonly risk_mitigation_plan: RiskMitigationPlan;
  readonly contingency_plans: readonly ContingencyPlan[];
}

export interface IdentifiedRisk {
  readonly risk_id: string;
  readonly category: 'technical' | 'resource' | 'schedule' | 'quality' | 'external';
  readonly description: string;
  readonly probability: number;
  readonly impact: number;
  readonly risk_score: number;
  readonly mitigation_strategies: readonly string[];
}

export interface RiskMitigationPlan {
  readonly plan_id: string;
  readonly mitigation_strategies: readonly MitigationStrategy[];
  readonly monitoring_approach: MonitoringApproach;
  readonly escalation_criteria: readonly string[];
}

export interface MitigationStrategy {
  readonly strategy_id: string;
  readonly risk_id: string;
  readonly action: string;
  readonly responsible_party: string;
  readonly timeline: number;
  readonly success_criteria: readonly string[];
  readonly cost_estimate: number;
}

export interface MonitoringApproach {
  readonly approach_id: string;
  readonly monitoring_frequency: string;
  readonly key_indicators: readonly string[];
  readonly alert_thresholds: Record<string, number>;
  readonly reporting_mechanism: string;
}

export interface ContingencyPlan {
  readonly plan_id: string;
  readonly trigger_conditions: readonly string[];
  readonly alternative_approaches: readonly AlternativeApproach[];
  readonly resource_requirements: ResourceConstraints;
  readonly activation_procedure: string;
}

export interface AlternativeApproach {
  readonly approach_id: string;
  readonly description: string;
  readonly feasibility_score: number;
  readonly resource_impact: string;
  readonly timeline_impact: string;
  readonly quality_impact: string;
}

// Additional interfaces for completion workflow
export interface CompletionStatus {
  readonly status: 'completed' | 'partial' | 'failed' | 'cancelled';
  readonly completion_percentage: number;
  readonly completion_time: number;
  readonly quality_score: number;
  readonly deliverables_count: number;
  readonly issues_count: number;
}

export interface TaskDeliverable {
  readonly deliverable_id: string;
  readonly spec_id: string;
  readonly content: string | ArrayBuffer;
  readonly format: string;
  readonly size_bytes: number;
  readonly quality_score: number;
  readonly validation_results: readonly ValidationResult[];
  readonly metadata: Record<string, any>;
}

export interface ValidationResult {
  readonly validator_id: string;
  readonly validation_type: string;
  readonly passed: boolean;
  readonly score: number;
  readonly issues: readonly ValidationIssue[];
  readonly suggestions: readonly string[];
}

export interface ValidationIssue {
  readonly issue_id: string;
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  readonly description: string;
  readonly location: string;
  readonly suggested_fix: string;
}

export interface DroneQualityMetrics {
  readonly overall_score: number;
  readonly nasa_compliance_score: number;
  readonly theater_detection_score: number;
  readonly connascence_score: number;
  readonly security_score: number;
  readonly test_coverage: number;
  readonly code_quality: number;
  readonly documentation_quality: number;
  readonly maintainability_score: number;
}

export interface DronePerformanceData {
  readonly execution_time_ms: number;
  readonly resource_utilization: DroneResourceUtilization;
  readonly throughput_ops_per_second: number;
  readonly error_rate: number;
  readonly efficiency_score: number;
  readonly optimization_opportunities: readonly string[];
}

export interface DroneResourceUtilization {
  readonly cpu_utilization_percentage: number;
  readonly memory_utilization_percentage: number;
  readonly storage_utilization_percentage: number;
  readonly network_utilization_percentage: number;
  readonly cost_utilization_percentage: number;
}

export interface TaskIssue {
  readonly issue_id: string;
  readonly category: 'technical' | 'resource' | 'process' | 'communication' | 'external';
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly description: string;
  readonly impact: string;
  readonly resolution_attempted: string;
  readonly resolution_status: 'resolved' | 'unresolved' | 'escalated';
  readonly lessons_learned: readonly string[];
}

export interface DroneRecommendation {
  readonly recommendation_id: string;
  readonly type: 'process_improvement' | 'tool_enhancement' | 'training' | 'resource_optimization';
  readonly description: string;
  readonly rationale: string;
  readonly expected_benefit: string;
  readonly implementation_effort: 'low' | 'medium' | 'high';
  readonly priority: number;
}

export interface LearnedPattern {
  readonly pattern_id: string;
  readonly pattern_type: 'best_practice' | 'anti_pattern' | 'optimization' | 'failure_mode';
  readonly description: string;
  readonly context: string;
  readonly applicability: readonly string[];
  readonly confidence_score: number;
  readonly validation_count: number;
}

export interface CompletionValidation {
  readonly validation_id: string;
  readonly overall_status: 'valid' | 'invalid' | 'incomplete';
  readonly validation_score: number;
  readonly completeness_checks: readonly CompletenessCheck[];
  readonly quality_validations: readonly QualityValidation[];
  readonly compliance_checks: readonly ComplianceCheck[];
  readonly recommendations: readonly string[];
}

export interface CompletenessCheck {
  readonly check_id: string;
  readonly requirement: string;
  readonly status: 'met' | 'partial' | 'missing';
  readonly evidence: readonly string[];
  readonly gaps: readonly string[];
}

export interface QualityValidation {
  readonly validation_id: string;
  readonly quality_aspect: string;
  readonly target_score: number;
  readonly actual_score: number;
  readonly passed: boolean;
  readonly improvement_suggestions: readonly string[];
}

export interface ComplianceCheck {
  readonly check_id: string;
  readonly framework: string;
  readonly requirement: string;
  readonly compliance_level: number;
  readonly violations: readonly ComplianceViolation[];
  readonly remediation_plan: string;
}

export interface ComplianceViolation {
  readonly violation_id: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly description: string;
  readonly location: string;
  readonly remediation_action: string;
  readonly deadline: number;
}

export interface QualityAssessment {
  readonly assessment_id: string;
  readonly overall_quality_score: number;
  readonly quality_dimensions: readonly QualityDimension[];
  readonly benchmark_comparison: BenchmarkComparison;
  readonly improvement_roadmap: ImprovementRoadmap;
}

export interface QualityDimension {
  readonly dimension: string;
  readonly score: number;
  readonly target: number;
  readonly trend: 'improving' | 'stable' | 'declining';
  readonly contributing_factors: readonly string[];
}

export interface BenchmarkComparison {
  readonly benchmark_type: 'historical' | 'peer' | 'industry_standard';
  readonly comparison_score: number;
  readonly percentile_ranking: number;
  readonly insights: readonly string[];
}

export interface ImprovementRoadmap {
  readonly roadmap_id: string;
  readonly priority_areas: readonly PriorityArea[];
  readonly timeline: Timeline;
  readonly resource_requirements: ResourceConstraints;
  readonly success_metrics: readonly string[];
}

export interface PriorityArea {
  readonly area: string;
  readonly current_score: number;
  readonly target_score: number;
  readonly improvement_actions: readonly string[];
  readonly timeline_weeks: number;
}

export interface PerformanceEvaluation {
  readonly evaluation_id: string;
  readonly performance_score: number;
  readonly efficiency_metrics: EfficiencyMetrics;
  readonly bottleneck_analysis: BottleneckAnalysis;
  readonly optimization_recommendations: readonly OptimizationRecommendation[];
}

export interface EfficiencyMetrics {
  readonly task_completion_rate: number;
  readonly resource_efficiency: number;
  readonly time_to_completion_ratio: number;
  readonly quality_velocity: number;
  readonly cost_effectiveness: number;
}

export interface BottleneckAnalysis {
  readonly identified_bottlenecks: readonly Bottleneck[];
  readonly impact_assessment: ImpactAssessment;
  readonly resolution_priorities: readonly ResolutionPriority[];
}

export interface Bottleneck {
  readonly bottleneck_id: string;
  readonly type: 'resource' | 'process' | 'dependency' | 'skill' | 'tool';
  readonly description: string;
  readonly impact_level: 'low' | 'medium' | 'high' | 'critical';
  readonly frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
  readonly resolution_options: readonly string[];
}

export interface ImpactAssessment {
  readonly overall_impact: number;
  readonly productivity_loss: number;
  readonly quality_impact: number;
  readonly cost_impact: number;
  readonly timeline_impact: number;
}

export interface ResolutionPriority {
  readonly bottleneck_id: string;
  readonly priority_score: number;
  readonly effort_estimate: 'low' | 'medium' | 'high';
  readonly expected_improvement: number;
  readonly timeline_estimate: number;
}

export interface OptimizationRecommendation {
  readonly recommendation_id: string;
  readonly optimization_type: 'performance' | 'resource' | 'process' | 'tool' | 'skill';
  readonly description: string;
  readonly expected_benefit: number;
  readonly implementation_effort: 'low' | 'medium' | 'high';
  readonly prerequisites: readonly string[];
  readonly success_metrics: readonly string[];
}

export interface KnowledgeExtraction {
  readonly extraction_id: string;
  readonly extracted_knowledge: readonly KnowledgeItem[];
  readonly pattern_analysis: PatternAnalysis;
  readonly best_practices: readonly BestPractice[];
  readonly lessons_learned: readonly LessonLearned[];
}

export interface KnowledgeItem {
  readonly item_id: string;
  readonly type: 'fact' | 'pattern' | 'insight' | 'heuristic' | 'rule';
  readonly description: string;
  readonly confidence: number;
  readonly applicability_scope: readonly string[];
  readonly validation_evidence: readonly string[];
}

export interface PatternAnalysis {
  readonly analysis_id: string;
  readonly identified_patterns: readonly IdentifiedPattern[];
  readonly pattern_correlations: readonly PatternCorrelation[];
  readonly predictive_insights: readonly PredictiveInsight[];
}

export interface IdentifiedPattern {
  readonly pattern_id: string;
  readonly pattern_type: 'behavioral' | 'performance' | 'quality' | 'failure' | 'success';
  readonly description: string;
  readonly frequency: number;
  readonly confidence: number;
  readonly context_conditions: readonly string[];
}

export interface PatternCorrelation {
  readonly correlation_id: string;
  readonly pattern_a: string;
  readonly pattern_b: string;
  readonly correlation_strength: number;
  readonly causal_relationship: 'none' | 'weak' | 'moderate' | 'strong';
  readonly implications: readonly string[];
}

export interface PredictiveInsight {
  readonly insight_id: string;
  readonly prediction_type: 'performance' | 'quality' | 'risk' | 'resource' | 'timeline';
  readonly description: string;
  readonly confidence_level: number;
  readonly time_horizon: number;
  readonly supporting_evidence: readonly string[];
}

export interface BestPractice {
  readonly practice_id: string;
  readonly title: string;
  readonly description: string;
  readonly applicability: readonly string[];
  readonly evidence_strength: 'low' | 'medium' | 'high' | 'very_high';
  readonly implementation_guidance: string;
}

export interface LessonLearned {
  readonly lesson_id: string;
  readonly category: 'success' | 'failure' | 'optimization' | 'risk' | 'process';
  readonly description: string;
  readonly context: string;
  readonly actionable_insight: string;
  readonly prevention_strategy: string;
}

export interface ImprovementSuggestion {
  readonly suggestion_id: string;
  readonly improvement_area: string;
  readonly current_performance: number;
  readonly target_performance: number;
  readonly improvement_actions: readonly string[];
  readonly effort_estimate: 'low' | 'medium' | 'high';
  readonly expected_timeline: number;
  readonly success_probability: number;
}

export interface NextTaskOptimization {
  readonly optimization_id: string;
  readonly optimized_parameters: readonly OptimizedParameter[];
  readonly resource_recommendations: ResourceRecommendations;
  readonly process_improvements: readonly ProcessImprovement[];
  readonly learning_applications: readonly LearningApplication[];
}

export interface OptimizedParameter {
  readonly parameter_name: string;
  readonly current_value: any;
  readonly recommended_value: any;
  readonly optimization_reason: string;
  readonly expected_impact: number;
}

export interface ResourceRecommendations {
  readonly cpu_recommendation: ResourceRecommendation;
  readonly memory_recommendation: ResourceRecommendation;
  readonly storage_recommendation: ResourceRecommendation;
  readonly network_recommendation: ResourceRecommendation;
  readonly budget_recommendation: ResourceRecommendation;
}

export interface ResourceRecommendation {
  readonly resource_type: string;
  readonly current_allocation: number;
  readonly recommended_allocation: number;
  readonly justification: string;
  readonly confidence: number;
}

export interface ProcessImprovement {
  readonly improvement_id: string;
  readonly process_area: string;
  readonly current_approach: string;
  readonly improved_approach: string;
  readonly expected_benefit: string;
  readonly implementation_complexity: 'low' | 'medium' | 'high';
}

export interface LearningApplication {
  readonly application_id: string;
  readonly learned_pattern_id: string;
  readonly application_context: string;
  readonly adaptation_required: string;
  readonly expected_outcome: string;
}

// Additional interfaces for feedback and status workflows
export interface PerformanceAnalysis {
  readonly analysis_id: string;
  readonly performance_metrics: PerformanceMetrics;
  readonly trend_analysis: TrendAnalysis;
  readonly comparative_analysis: ComparativeAnalysis;
  readonly improvement_opportunities: readonly ImprovementOpportunity[];
}

export interface TrendAnalysis {
  readonly analysis_period: TimePeriod;
  readonly performance_trends: readonly PerformanceTrend[];
  readonly trend_significance: TrendSignificance;
  readonly future_projections: readonly FutureProjection[];
}

export interface TimePeriod {
  readonly start_time: number;
  readonly end_time: number;
  readonly duration_ms: number;
  readonly sample_count: number;
}

export interface PerformanceTrend {
  readonly metric_name: string;
  readonly trend_direction: 'improving' | 'stable' | 'declining';
  readonly change_rate: number;
  readonly statistical_significance: number;
  readonly confidence_interval: ConfidenceInterval;
}

export interface ConfidenceInterval {
  readonly lower_bound: number;
  readonly upper_bound: number;
  readonly confidence_level: number;
}

export interface TrendSignificance {
  readonly overall_significance: 'none' | 'low' | 'medium' | 'high';
  readonly statistically_significant_trends: readonly string[];
  readonly actionable_trends: readonly string[];
  readonly concerning_trends: readonly string[];
}

export interface FutureProjection {
  readonly metric_name: string;
  readonly projection_horizon_ms: number;
  readonly projected_value: number;
  readonly confidence_level: number;
  readonly assumptions: readonly string[];
}

export interface ComparativeAnalysis {
  readonly comparison_type: 'historical' | 'peer' | 'target' | 'benchmark';
  readonly baseline_metrics: PerformanceMetrics;
  readonly comparison_results: readonly ComparisonResult[];
  readonly insights: readonly AnalysisInsight[];
}

export interface ComparisonResult {
  readonly metric_name: string;
  readonly baseline_value: number;
  readonly current_value: number;
  readonly percentage_change: number;
  readonly significance: 'negligible' | 'minor' | 'moderate' | 'major';
}

export interface AnalysisInsight {
  readonly insight_type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  readonly description: string;
  readonly supporting_data: readonly string[];
  readonly recommended_action: string;
}

export interface ImprovementOpportunity {
  readonly opportunity_id: string;
  readonly area: string;
  readonly current_performance: number;
  readonly potential_performance: number;
  readonly improvement_potential: number;
  readonly effort_required: 'low' | 'medium' | 'high';
  readonly implementation_steps: readonly string[];
}

export interface QualityEvaluation {
  readonly evaluation_id: string;
  readonly quality_score: number;
  readonly quality_dimensions: readonly QualityDimensionEvaluation[];
  readonly quality_trends: readonly QualityTrend[];
  readonly benchmark_performance: BenchmarkPerformance;
}

export interface QualityDimensionEvaluation {
  readonly dimension: string;
  readonly score: number;
  readonly weight: number;
  readonly contribution: number;
  readonly evaluation_criteria: readonly EvaluationCriteria[];
}

export interface EvaluationCriteria {
  readonly criteria_id: string;
  readonly description: string;
  readonly target_value: number;
  readonly actual_value: number;
  readonly score: number;
  readonly weight: number;
}

export interface QualityTrend {
  readonly dimension: string;
  readonly trend_direction: 'improving' | 'stable' | 'declining';
  readonly trend_strength: 'weak' | 'moderate' | 'strong';
  readonly trend_duration_ms: number;
  readonly projected_outcome: string;
}

export interface BenchmarkPerformance {
  readonly benchmark_type: string;
  readonly percentile_ranking: number;
  readonly performance_gap: number;
  readonly competitive_position: 'leading' | 'competitive' | 'lagging';
  readonly improvement_targets: readonly ImprovementTarget[];
}

export interface ImprovementTarget {
  readonly target_dimension: string;
  readonly current_score: number;
  readonly target_score: number;
  readonly timeline_weeks: number;
  readonly success_probability: number;
}

export interface ImprovementArea {
  readonly area_id: string;
  readonly area_name: string;
  readonly current_performance: number;
  readonly target_performance: number;
  readonly gap_analysis: GapAnalysis;
  readonly improvement_strategies: readonly ImprovementStrategy[];
}

export interface GapAnalysis {
  readonly gap_size: number;
  readonly gap_significance: 'minor' | 'moderate' | 'major' | 'critical';
  readonly root_causes: readonly RootCause[];
  readonly contributing_factors: readonly ContributingFactor[];
}

export interface RootCause {
  readonly cause_id: string;
  readonly description: string;
  readonly impact_level: 'low' | 'medium' | 'high' | 'critical';
  readonly frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
  readonly addressability: 'easy' | 'moderate' | 'difficult' | 'very_difficult';
}

export interface ContributingFactor {
  readonly factor_id: string;
  readonly description: string;
  readonly contribution_percentage: number;
  readonly controllability: 'high' | 'medium' | 'low' | 'none';
}

export interface ImprovementStrategy {
  readonly strategy_id: string;
  readonly strategy_type: 'training' | 'process' | 'tool' | 'resource' | 'organizational';
  readonly description: string;
  readonly expected_impact: number;
  readonly implementation_effort: 'low' | 'medium' | 'high';
  readonly timeline_estimate: number;
  readonly prerequisites: readonly string[];
}

export interface LearningObjective {
  readonly objective_id: string;
  readonly learning_area: string;
  readonly current_competency: number;
  readonly target_competency: number;
  readonly learning_methods: readonly LearningMethod[];
  readonly success_criteria: readonly string[];
  readonly timeline: LearningTimeline;
}

export interface LearningMethod {
  readonly method_id: string;
  readonly method_type: 'training' | 'practice' | 'mentoring' | 'self_study' | 'experimentation';
  readonly description: string;
  readonly effectiveness_score: number;
  readonly resource_requirements: ResourceConstraints;
}

export interface LearningTimeline {
  readonly start_date: number;
  readonly target_completion_date: number;
  readonly milestones: readonly LearningMilestone[];
  readonly assessment_schedule: readonly AssessmentSchedule[];
}

export interface LearningMilestone {
  readonly milestone_id: string;
  readonly description: string;
  readonly target_date: number;
  readonly success_criteria: readonly string[];
  readonly assessment_method: string;
}

export interface AssessmentSchedule {
  readonly assessment_id: string;
  readonly assessment_type: 'formative' | 'summative' | 'peer' | 'self';
  readonly scheduled_date: number;
  readonly assessment_criteria: readonly string[];
}

export interface OptimizationTargets {
  readonly target_id: string;
  readonly performance_targets: readonly PerformanceTarget[];
  readonly quality_targets: readonly QualityTarget[];
  readonly efficiency_targets: readonly EfficiencyTarget[];
  readonly learning_targets: readonly LearningTarget[];
}

export interface PerformanceTarget {
  readonly metric_name: string;
  readonly current_value: number;
  readonly target_value: number;
  readonly improvement_percentage: number;
  readonly timeline_weeks: number;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface EfficiencyTarget {
  readonly efficiency_dimension: string;
  readonly current_efficiency: number;
  readonly target_efficiency: number;
  readonly measurement_method: string;
  readonly optimization_approach: string;
}

export interface LearningTarget {
  readonly skill_area: string;
  readonly current_level: number;
  readonly target_level: number;
  readonly learning_path: string;
  readonly assessment_method: string;
}

export interface ContextUpdates {
  readonly update_id: string;
  readonly context_changes: readonly ContextChange[];
  readonly new_capabilities: readonly string[];
  readonly deprecated_features: readonly string[];
  readonly integration_updates: readonly IntegrationUpdate[];
}

export interface ContextChange {
  readonly change_id: string;
  readonly change_type: 'addition' | 'modification' | 'removal';
  readonly affected_component: string;
  readonly description: string;
  readonly impact_assessment: string;
  readonly migration_required: boolean;
}

export interface IntegrationUpdate {
  readonly integration_id: string;
  readonly system_name: string;
  readonly update_type: 'api_change' | 'protocol_change' | 'configuration_change';
  readonly description: string;
  readonly required_actions: readonly string[];
  readonly deadline: number;
}

export interface FeedbackAcknowledgment {
  readonly acknowledgment_id: string;
  readonly feedback_received: boolean;
  readonly understanding_level: number;
  readonly questions: readonly FeedbackQuestion[];
  readonly commitment_to_improvement: boolean;
  readonly expected_improvement_timeline: number;
}

export interface FeedbackQuestion {
  readonly question_id: string;
  readonly question: string;
  readonly category: 'clarification' | 'implementation' | 'prioritization' | 'resources';
  readonly urgency: 'low' | 'medium' | 'high';
}

export interface LearningPlan {
  readonly plan_id: string;
  readonly learning_objectives: readonly LearningObjective[];
  readonly learning_activities: readonly LearningActivity[];
  readonly resource_requirements: ResourceConstraints;
  readonly progress_tracking: ProgressTracking;
  readonly success_metrics: readonly string[];
}

export interface LearningActivity {
  readonly activity_id: string;
  readonly activity_type: 'training' | 'practice' | 'experimentation' | 'collaboration';
  readonly description: string;
  readonly duration_hours: number;
  readonly prerequisites: readonly string[];
  readonly expected_outcomes: readonly string[];
}

export interface ProgressTracking {
  readonly tracking_id: string;
  readonly tracking_frequency: string;
  readonly progress_indicators: readonly ProgressIndicator[];
  readonly review_schedule: readonly ProgressReview[];
  readonly adjustment_triggers: readonly string[];
}

export interface ProgressIndicator {
  readonly indicator_name: string;
  readonly measurement_method: string;
  readonly target_value: number;
  readonly current_value: number;
  readonly trend: 'improving' | 'stable' | 'declining';
}

export interface ProgressReview {
  readonly review_id: string;
  readonly review_date: number;
  readonly review_type: 'checkpoint' | 'milestone' | 'final';
  readonly participants: readonly string[];
  readonly agenda: readonly string[];
}

export interface PerformanceAdjustment {
  readonly adjustment_id: string;
  readonly adjustment_type: 'parameter' | 'algorithm' | 'resource' | 'process';
  readonly description: string;
  readonly target_metric: string;
  readonly expected_improvement: number;
  readonly implementation_effort: 'low' | 'medium' | 'high';
  readonly risk_level: 'low' | 'medium' | 'high';
}

export interface CapabilityUpdates {
  readonly update_id: string;
  readonly new_capabilities: readonly NewCapability[];
  readonly enhanced_capabilities: readonly EnhancedCapability[];
  readonly deprecated_capabilities: readonly string[];
  readonly capability_roadmap: CapabilityRoadmap;
}

export interface NewCapability {
  readonly capability_id: string;
  readonly name: string;
  readonly description: string;
  readonly competency_level: number;
  readonly validation_method: string;
  readonly prerequisites: readonly string[];
}

export interface EnhancedCapability {
  readonly capability_id: string;
  readonly enhancement_description: string;
  readonly previous_level: number;
  readonly new_level: number;
  readonly improvement_evidence: readonly string[];
}

export interface CapabilityRoadmap {
  readonly roadmap_id: string;
  readonly planned_capabilities: readonly PlannedCapability[];
  readonly development_timeline: Timeline;
  readonly resource_allocation: ResourceConstraints;
}

export interface PlannedCapability {
  readonly capability_name: string;
  readonly target_competency_level: number;
  readonly development_approach: string;
  readonly estimated_timeline_weeks: number;
  readonly dependencies: readonly string[];
}

export interface FutureTaskPreferences {
  readonly preferences_id: string;
  readonly preferred_task_types: readonly TaskTypePreference[];
  readonly optimal_complexity_range: ComplexityRange;
  readonly resource_preferences: ResourcePreferences;
  readonly collaboration_preferences: CollaborationPreferences;
}

export interface TaskTypePreference {
  readonly task_type: DroneType;
  readonly preference_score: number;
  readonly competency_level: number;
  readonly experience_count: number;
  readonly success_rate: number;
}

export interface ComplexityRange {
  readonly min_complexity: TaskComplexity;
  readonly max_complexity: TaskComplexity;
  readonly optimal_complexity: TaskComplexity;
  readonly complexity_growth_rate: number;
}

export interface ResourcePreferences {
  readonly preferred_cpu_range: ResourceRange;
  readonly preferred_memory_range: ResourceRange;
  readonly preferred_duration_range: DurationRange;
  readonly cost_sensitivity: 'low' | 'medium' | 'high';
}

export interface ResourceRange {
  readonly min_value: number;
  readonly max_value: number;
  readonly optimal_value: number;
}

export interface DurationRange {
  readonly min_duration_ms: number;
  readonly max_duration_ms: number;
  readonly optimal_duration_ms: number;
}

export interface CollaborationPreferences {
  readonly preferred_team_size: number;
  readonly collaboration_style: 'independent' | 'collaborative' | 'hybrid';
  readonly communication_frequency: 'minimal' | 'regular' | 'frequent';
  readonly knowledge_sharing_willingness: number;
}

// Status workflow interfaces
export interface ActiveTask {
  readonly task_id: string;
  readonly title: string;
  readonly status: 'assigned' | 'in_progress' | 'paused' | 'completing';
  readonly progress_percentage: number;
  readonly estimated_completion: number;
  readonly priority: TaskPriority;
  readonly resource_utilization: TaskResourceUtilization;
}

export interface TaskResourceUtilization {
  readonly cpu_usage_percentage: number;
  readonly memory_usage_percentage: number;
  readonly storage_usage_mb: number;
  readonly network_bandwidth_mbps: number;
}

export interface DroneHealthMetrics {
  readonly overall_health_score: number;
  readonly system_health: SystemHealth;
  readonly performance_health: PerformanceHealth;
  readonly resource_health: ResourceHealth;
  readonly connectivity_health: ConnectivityHealth;
}

export interface SystemHealth {
  readonly cpu_health: number;
  readonly memory_health: number;
  readonly storage_health: number;
  readonly process_health: number;
  readonly error_rate: number;
}

export interface PerformanceHealth {
  readonly response_time_health: number;
  readonly throughput_health: number;
  readonly efficiency_health: number;
  readonly quality_health: number;
}

export interface ResourceHealth {
  readonly allocation_efficiency: number;
  readonly utilization_balance: number;
  readonly capacity_headroom: number;
  readonly cost_efficiency: number;
}

export interface ConnectivityHealth {
  readonly network_latency_ms: number;
  readonly packet_loss_rate: number;
  readonly connection_stability: number;
  readonly api_availability: number;
}

export interface ProgressUpdate {
  readonly update_id: string;
  readonly task_id: string;
  readonly progress_percentage: number;
  readonly milestone_completed: string;
  readonly next_milestone: string;
  readonly estimated_completion: number;
  readonly issues_encountered: readonly string[];
  readonly achievements: readonly string[];
}

export interface BlockingIssue {
  readonly issue_id: string;
  readonly issue_type: 'resource' | 'dependency' | 'technical' | 'external' | 'process';
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly description: string;
  readonly impact: string;
  readonly blocking_duration_ms: number;
  readonly resolution_attempts: readonly ResolutionAttempt[];
  readonly escalation_required: boolean;
}

export interface ResolutionAttempt {
  readonly attempt_id: string;
  readonly approach: string;
  readonly timestamp: number;
  readonly outcome: 'successful' | 'failed' | 'partial';
  readonly lessons_learned: string;
}

export interface DroneCapacityForecast {
  readonly forecast_id: string;
  readonly time_horizon_ms: number;
  readonly capacity_projections: readonly CapacityProjection[];
  readonly bottleneck_predictions: readonly CapacityBottleneck[];
  readonly optimization_opportunities: readonly CapacityOptimization[];
}

export interface CapacityProjection {
  readonly resource_type: string;
  readonly current_capacity: number;
  readonly projected_demand: number;
  readonly utilization_forecast: number;
  readonly confidence_level: number;
}

export interface CapacityBottleneck {
  readonly resource_type: string;
  readonly predicted_saturation_time: number;
  readonly saturation_probability: number;
  readonly impact_severity: 'low' | 'medium' | 'high' | 'critical';
  readonly mitigation_options: readonly string[];
}

export interface CapacityOptimization {
  readonly optimization_type: 'scaling' | 'reallocation' | 'efficiency' | 'scheduling';
  readonly description: string;
  readonly expected_benefit: number;
  readonly implementation_cost: number;
  readonly timeline_estimate: number;
}

export interface StatusSummary {
  readonly summary_id: string;
  readonly overall_status: 'healthy' | 'warning' | 'critical' | 'error';
  readonly key_metrics: Record<string, number>;
  readonly current_workload: WorkloadSummary;
  readonly performance_summary: PerformanceSummary;
  readonly capacity_summary: CapacitySummary;
  readonly alerts: readonly Alert[];
}

export interface WorkloadSummary {
  readonly total_tasks: number;
  readonly active_tasks: number;
  readonly completed_tasks_today: number;
  readonly average_task_duration_ms: number;
  readonly workload_trend: 'increasing' | 'stable' | 'decreasing';
}

export interface PerformanceSummary {
  readonly efficiency_score: number;
  readonly quality_score: number;
  readonly speed_score: number;
  readonly reliability_score: number;
  readonly trend: 'improving' | 'stable' | 'declining';
}

export interface CapacitySummary {
  readonly current_utilization: number;
  readonly available_capacity: number;
  readonly peak_capacity: number;
  readonly capacity_trend: 'growing' | 'stable' | 'shrinking';
}

export interface Alert {
  readonly alert_id: string;
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  readonly message: string;
  readonly category: 'performance' | 'resource' | 'quality' | 'security' | 'process';
  readonly timestamp: number;
  readonly actionable: boolean;
  readonly suggested_actions: readonly string[];
}

export interface HealthAssessment {
  readonly assessment_id: string;
  readonly overall_health_score: number;
  readonly health_dimensions: readonly HealthDimension[];
  readonly health_trends: readonly HealthTrend[];
  readonly intervention_recommendations: readonly HealthIntervention[];
}

export interface HealthDimension {
  readonly dimension_name: string;
  readonly current_score: number;
  readonly target_score: number;
  readonly trend: 'improving' | 'stable' | 'declining';
  readonly risk_factors: readonly string[];
  readonly protective_factors: readonly string[];
}

export interface HealthTrend {
  readonly metric_name: string;
  readonly trend_direction: 'up' | 'stable' | 'down';
  readonly trend_strength: 'weak' | 'moderate' | 'strong';
  readonly statistical_significance: number;
  readonly projected_trajectory: string;
}

export interface HealthIntervention {
  readonly intervention_id: string;
  readonly intervention_type: 'preventive' | 'corrective' | 'optimization';
  readonly target_dimension: string;
  readonly description: string;
  readonly urgency: 'low' | 'medium' | 'high' | 'critical';
  readonly expected_impact: number;
  readonly implementation_effort: 'low' | 'medium' | 'high';
}

export interface CapacityEvaluation {
  readonly evaluation_id: string;
  readonly current_capacity_utilization: number;
  readonly optimal_capacity_range: CapacityRange;
  readonly capacity_constraints: readonly CapacityConstraint[];
  readonly scaling_recommendations: readonly CapacityScalingRecommendation[];
}

export interface CapacityRange {
  readonly min_utilization: number;
  readonly max_utilization: number;
  readonly optimal_utilization: number;
  readonly efficiency_zone: EfficiencyZone;
}

export interface EfficiencyZone {
  readonly lower_bound: number;
  readonly upper_bound: number;
  readonly peak_efficiency_point: number;
  readonly efficiency_curve: readonly EfficiencyPoint[];
}

export interface EfficiencyPoint {
  readonly utilization_level: number;
  readonly efficiency_score: number;
  readonly quality_impact: number;
  readonly cost_factor: number;
}

export interface CapacityConstraint {
  readonly constraint_id: string;
  readonly constraint_type: 'hard' | 'soft';
  readonly resource_type: string;
  readonly limit_value: number;
  readonly current_usage: number;
  readonly constraint_source: string;
  readonly relaxation_options: readonly string[];
}

export interface CapacityScalingRecommendation {
  readonly recommendation_id: string;
  readonly scaling_direction: 'up' | 'down' | 'rebalance';
  readonly resource_type: string;
  readonly current_allocation: number;
  readonly recommended_allocation: number;
  readonly justification: string;
  readonly timeline: number;
  readonly cost_impact: number;
  readonly risk_assessment: string;
}

export interface InterventionRecommendation {
  readonly recommendation_id: string;
  readonly intervention_type: 'immediate' | 'scheduled' | 'preventive';
  readonly target_issue: string;
  readonly recommended_action: string;
  readonly urgency_level: 'low' | 'medium' | 'high' | 'critical';
  readonly expected_outcome: string;
  readonly implementation_steps: readonly string[];
  readonly success_criteria: readonly string[];
}

export interface LoadBalancingSuggestion {
  readonly suggestion_id: string;
  readonly rebalancing_strategy: 'task_redistribution' | 'resource_reallocation' | 'priority_adjustment';
  readonly current_load_distribution: LoadDistribution;
  readonly proposed_load_distribution: LoadDistribution;
  readonly expected_improvement: number;
  readonly implementation_complexity: 'low' | 'medium' | 'high';
  readonly timeline_estimate: number;
}

export interface LoadDistribution {
  readonly distribution_id: string;
  readonly resource_allocations: readonly ResourceAllocation[];
  readonly task_assignments: readonly TaskAssignment[];
  readonly utilization_balance: number;
  readonly efficiency_score: number;
}

export interface TaskAssignment {
  readonly assignment_id: string;
  readonly task_id: string;
  readonly assigned_resources: ResourceConstraints;
  readonly priority_level: number;
  readonly estimated_duration: number;
  readonly dependencies: readonly string[];
}

export interface PredictiveAlert {
  readonly alert_id: string;
  readonly prediction_type: 'performance_degradation' | 'resource_exhaustion' | 'quality_decline' | 'failure_risk';
  readonly predicted_event: string;
  readonly probability: number;
  readonly time_to_event_ms: number;
  readonly confidence_level: number;
  readonly contributing_factors: readonly string[];
  readonly prevention_actions: readonly string[];
  readonly mitigation_strategies: readonly string[];
}

// Export all Princess-Drone signature contracts
export const PrincessDroneSignatures = {
  PrincessToDroneAssignment,
  DroneToPrincessCompletion,
  PrincessToDroneFeedback,
  DroneToPrincessStatus
} as const;

/*
 * AGENT FOOTER: PrincessDroneSignatures v1.0.0
 * Status: OK | NASA Rule 10 Compliant | FSM-Compatible | TypeScript Type Safety
 * Created: 2025-09-28T16:25:45-04:00 | Agent: dspy-signature-specialist@claude-sonnet-4
 */

// Backward compatibility
export default PrincessDroneSignatures;
