/**
 * Queen-Princess Communication DSPy Signature Contracts
 *
 * Comprehensive signature contracts for strategic directive optimization
 * between Queen and Princess agents in the SPEK hierarchy.
 *
 * NASA Rule 10 Compliant | FSM-Compatible | TypeScript Type Safety
 */

import { QueenState, QueenEvent, PrincessDomain, QueenCommandType } from '../../../architecture/langgraph/queen/fsm/QueenFSMTypes';

// Base DSPy Signature Interface
export interface DSPySignature<TInputs = any, TOutputs = any> {
  inputs: TInputs;
  outputs: TOutputs;
  optimization_criteria: string[];
  fallback_strategy: FallbackStrategy;
  performance_metrics: PerformanceMetrics;
  validation_rules: ValidationRule[];
}

// Common Types
export interface ResourceConstraints {
  readonly maxConcurrentTasks: number;
  readonly timeoutMs: number;
  readonly memoryLimitMB: number;
  readonly priorityLevel: 'low' | 'medium' | 'high' | 'critical';
  readonly budgetCredits: number;
}

export interface QualityGateConfig {
  readonly gateId: string;
  readonly type: 'nasa_compliance' | 'theater_detection' | 'connascence' | 'security';
  readonly threshold: number;
  readonly required: boolean;
  readonly timeoutMs: number;
}

export interface PerformanceMetrics {
  readonly latency_p95_ms: number;
  readonly accuracy_score: number;
  readonly completion_rate: number;
  readonly cost_per_task_usd: number;
  readonly resource_utilization: number;
}

export interface FallbackStrategy {
  readonly strategy: 'retry' | 'degrade' | 'escalate' | 'abort';
  readonly max_retries: number;
  readonly backoff_ms: number;
  readonly fallback_agent?: string;
}

export interface ValidationRule {
  readonly rule_id: string;
  readonly field: string;
  readonly constraint: string;
  readonly error_message: string;
}

// Strategic Directive Signatures

/**
 * Queen -> Princess Strategic Directive Contract
 * Optimized for clarity, actionability, and execution feasibility
 */
export interface QueenToPrincessDirective extends DSPySignature {
  inputs: {
    readonly domain: PrincessDomain;
    readonly strategic_objective: string;
    readonly priority: 'critical' | 'high' | 'medium' | 'low';
    readonly resource_constraints: ResourceConstraints;
    readonly quality_gates: readonly QualityGateConfig[];
    readonly context_dna: Record<string, any>;
    readonly state_context: {
      readonly current_state: QueenState;
      readonly target_state: QueenState;
      readonly transition_event: QueenEvent;
    };
  };
  outputs: {
    readonly princess_acknowledgment: PrincessAcknowledgment;
    readonly execution_plan: StrategicExecutionPlan;
    readonly resource_allocation: ResourceAllocation;
    readonly quality_metrics: QualityMetrics;
    readonly fsm_validation: FSMValidationResult;
  };
  optimization_criteria: [
    'clarity_score >= 0.90',
    'actionability_score >= 0.85',
    'execution_feasibility >= 0.80',
    'resource_efficiency >= 0.75',
    'quality_assurance >= 0.95'
  ];
  fallback_strategy: {
    readonly strategy: 'escalate';
    readonly max_retries: 3;
    readonly backoff_ms: 5000;
    readonly fallback_agent: 'emergency_coordinator';
  };
  performance_metrics: {
    readonly latency_p95_ms: 2000;
    readonly accuracy_score: 0.92;
    readonly completion_rate: 0.95;
    readonly cost_per_task_usd: 0.15;
    readonly resource_utilization: 0.80;
  };
  validation_rules: [
    {
      readonly rule_id: 'STRATEGIC_CLARITY';
      readonly field: 'strategic_objective';
      readonly constraint: 'length >= 10 && specificity_score >= 0.8';
      readonly error_message: 'Strategic objective must be specific and detailed';
    },
    {
      readonly rule_id: 'RESOURCE_BOUNDS';
      readonly field: 'resource_constraints';
      readonly constraint: 'maxConcurrentTasks <= 20 && timeoutMs <= 300000';
      readonly error_message: 'Resource constraints must respect NASA Rule 10 bounds';
    }
  ];
}

/**
 * Princess -> Queen Status Report Contract
 * Optimized for executive summary clarity and decision support
 */
export interface PrincessToQueenReport extends DSPySignature {
  inputs: {
    readonly domain: PrincessDomain;
    readonly execution_status: ExecutionStatus;
    readonly progress_metrics: ProgressMetrics;
    readonly quality_assessment: QualityAssessment;
    readonly resource_utilization: ResourceUtilization;
    readonly blocking_issues: readonly BlockingIssue[];
    readonly recommendations: readonly Recommendation[];
  };
  outputs: {
    readonly executive_summary: ExecutiveSummary;
    readonly decision_options: readonly DecisionOption[];
    readonly escalation_triggers: readonly EscalationTrigger[];
    readonly next_actions: readonly NextAction[];
    readonly risk_assessment: RiskAssessment;
  };
  optimization_criteria: [
    'executive_clarity >= 0.95',
    'decision_support_quality >= 0.90',
    'actionability_score >= 0.85',
    'risk_identification >= 0.88',
    'recommendation_quality >= 0.80'
  ];
  fallback_strategy: {
    readonly strategy: 'retry';
    readonly max_retries: 2;
    readonly backoff_ms: 3000;
    readonly fallback_agent: 'backup_princess';
  };
  performance_metrics: {
    readonly latency_p95_ms: 1500;
    readonly accuracy_score: 0.94;
    readonly completion_rate: 0.97;
    readonly cost_per_task_usd: 0.08;
    readonly resource_utilization: 0.75;
  };
  validation_rules: [
    {
      readonly rule_id: 'EXECUTIVE_COMPLETENESS';
      readonly field: 'executive_summary';
      readonly constraint: 'contains_status && contains_progress && contains_risks';
      readonly error_message: 'Executive summary must include status, progress, and risks';
    }
  ];
}

/**
 * Queen -> Princess Resource Allocation Contract
 * Optimized for efficient resource distribution and load balancing
 */
export interface QueenToPrincessAllocation extends DSPySignature {
  inputs: {
    readonly target_domain: PrincessDomain;
    readonly resource_request: ResourceRequest;
    readonly current_allocations: readonly CurrentAllocation[];
    readonly system_capacity: SystemCapacity;
    readonly priority_matrix: PriorityMatrix;
  };
  outputs: {
    readonly allocation_decision: AllocationDecision;
    readonly load_balancing_plan: LoadBalancingPlan;
    readonly capacity_forecast: CapacityForecast;
    readonly optimization_recommendations: readonly OptimizationRecommendation[];
  };
  optimization_criteria: [
    'resource_efficiency >= 0.85',
    'load_balance_score >= 0.80',
    'capacity_utilization >= 0.75',
    'fairness_index >= 0.90',
    'response_time_p95 <= 3000'
  ];
  fallback_strategy: {
    readonly strategy: 'degrade';
    readonly max_retries: 1;
    readonly backoff_ms: 2000;
    readonly fallback_agent: 'resource_coordinator';
  };
  performance_metrics: {
    readonly latency_p95_ms: 1000;
    readonly accuracy_score: 0.89;
    readonly completion_rate: 0.93;
    readonly cost_per_task_usd: 0.05;
    readonly resource_utilization: 0.85;
  };
  validation_rules: [
    {
      readonly rule_id: 'ALLOCATION_BOUNDS';
      readonly field: 'allocation_decision';
      readonly constraint: 'total_allocation <= system_capacity';
      readonly error_message: 'Allocation cannot exceed system capacity';
    }
  ];
}

// Supporting Interfaces

export interface PrincessAcknowledgment {
  readonly acknowledgment_id: string;
  readonly domain: PrincessDomain;
  readonly status: 'accepted' | 'rejected' | 'needs_clarification';
  readonly timestamp: number;
  readonly estimated_completion: number;
  readonly resource_requirements: ResourceConstraints;
  readonly quality_commitments: readonly string[];
  readonly risk_factors: readonly string[];
}

export interface StrategicExecutionPlan {
  readonly plan_id: string;
  readonly phases: readonly ExecutionPhase[];
  readonly dependencies: readonly PhaseDependency[];
  readonly milestones: readonly Milestone[];
  readonly quality_checkpoints: readonly QualityCheckpoint[];
  readonly risk_mitigation: readonly RiskMitigation[];
}

export interface ExecutionPhase {
  readonly phase_id: string;
  readonly name: string;
  readonly description: string;
  readonly estimated_duration_ms: number;
  readonly required_resources: ResourceConstraints;
  readonly deliverables: readonly string[];
  readonly success_criteria: readonly string[];
}

export interface ResourceAllocation {
  readonly allocation_id: string;
  readonly domain: PrincessDomain;
  readonly allocated_resources: ResourceConstraints;
  readonly allocation_duration_ms: number;
  readonly priority_level: number;
  readonly utilization_targets: Record<string, number>;
}

export interface QualityMetrics {
  readonly nasa_compliance_score: number;
  readonly theater_detection_score: number;
  readonly connascence_score: number;
  readonly security_score: number;
  readonly test_coverage: number;
  readonly code_quality_score: number;
}

export interface FSMValidationResult {
  readonly is_valid: boolean;
  readonly current_state: QueenState;
  readonly valid_transitions: readonly QueenEvent[];
  readonly state_invariants: readonly StateInvariant[];
  readonly transition_guards: readonly TransitionGuard[];
}

export interface StateInvariant {
  readonly invariant_id: string;
  readonly description: string;
  readonly condition: string;
  readonly satisfied: boolean;
}

export interface TransitionGuard {
  readonly guard_id: string;
  readonly from_state: QueenState;
  readonly to_state: QueenState;
  readonly event: QueenEvent;
  readonly condition: string;
  readonly satisfied: boolean;
}

export interface ExecutionStatus {
  readonly status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  readonly progress_percentage: number;
  readonly start_time: number;
  readonly estimated_completion: number;
  readonly last_update: number;
}

export interface ProgressMetrics {
  readonly tasks_completed: number;
  readonly tasks_remaining: number;
  readonly velocity: number;
  readonly quality_score: number;
  readonly efficiency_score: number;
}

export interface QualityAssessment {
  readonly overall_score: number;
  readonly nasa_compliance: number;
  readonly theater_score: number;
  readonly test_coverage: number;
  readonly code_quality: number;
  readonly security_score: number;
}

export interface ResourceUtilization {
  readonly cpu_utilization: number;
  readonly memory_utilization: number;
  readonly task_capacity_utilization: number;
  readonly cost_utilization: number;
}

export interface BlockingIssue {
  readonly issue_id: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly description: string;
  readonly impact: string;
  readonly suggested_resolution: string;
  readonly escalation_required: boolean;
}

export interface Recommendation {
  readonly recommendation_id: string;
  readonly type: 'optimization' | 'risk_mitigation' | 'resource_adjustment' | 'process_improvement';
  readonly description: string;
  readonly expected_benefit: string;
  readonly implementation_effort: 'low' | 'medium' | 'high';
  readonly priority: number;
}

export interface ExecutiveSummary {
  readonly summary: string;
  readonly key_achievements: readonly string[];
  readonly critical_issues: readonly string[];
  readonly resource_status: string;
  readonly timeline_status: string;
  readonly quality_status: string;
  readonly recommendations: readonly string[];
}

export interface DecisionOption {
  readonly option_id: string;
  readonly description: string;
  readonly pros: readonly string[];
  readonly cons: readonly string[];
  readonly resource_impact: ResourceConstraints;
  readonly risk_level: 'low' | 'medium' | 'high' | 'critical';
  readonly estimated_outcome: string;
}

export interface EscalationTrigger {
  readonly trigger_id: string;
  readonly condition: string;
  readonly urgency: 'low' | 'medium' | 'high' | 'critical';
  readonly escalation_path: readonly string[];
  readonly required_actions: readonly string[];
}

export interface NextAction {
  readonly action_id: string;
  readonly description: string;
  readonly owner: string;
  readonly deadline: number;
  readonly dependencies: readonly string[];
  readonly success_criteria: readonly string[];
}

export interface RiskAssessment {
  readonly overall_risk_level: 'low' | 'medium' | 'high' | 'critical';
  readonly identified_risks: readonly IdentifiedRisk[];
  readonly mitigation_effectiveness: number;
  readonly residual_risk: number;
}

export interface IdentifiedRisk {
  readonly risk_id: string;
  readonly description: string;
  readonly probability: number;
  readonly impact: number;
  readonly mitigation_plan: string;
  readonly owner: string;
}

// Additional supporting interfaces for resource allocation
export interface ResourceRequest {
  readonly request_id: string;
  readonly requesting_domain: PrincessDomain;
  readonly resource_type: 'compute' | 'memory' | 'storage' | 'network' | 'credits';
  readonly amount: number;
  readonly duration_ms: number;
  readonly justification: string;
  readonly priority: number;
}

export interface CurrentAllocation {
  readonly allocation_id: string;
  readonly domain: PrincessDomain;
  readonly resource_type: string;
  readonly allocated_amount: number;
  readonly utilization_rate: number;
  readonly expires_at: number;
}

export interface SystemCapacity {
  readonly total_compute: number;
  readonly total_memory: number;
  readonly total_storage: number;
  readonly total_credits: number;
  readonly available_compute: number;
  readonly available_memory: number;
  readonly available_storage: number;
  readonly available_credits: number;
}

export interface PriorityMatrix {
  readonly domain_priorities: Record<PrincessDomain, number>;
  readonly task_type_priorities: Record<string, number>;
  readonly time_based_multipliers: Record<string, number>;
}

export interface AllocationDecision {
  readonly decision_id: string;
  readonly approved_amount: number;
  readonly allocated_duration_ms: number;
  readonly conditions: readonly string[];
  readonly monitoring_requirements: readonly string[];
}

export interface LoadBalancingPlan {
  readonly plan_id: string;
  readonly rebalancing_actions: readonly RebalancingAction[];
  readonly expected_improvement: number;
  readonly implementation_timeline: number;
}

export interface RebalancingAction {
  readonly action_id: string;
  readonly action_type: 'move_task' | 'scale_up' | 'scale_down' | 'redistribute';
  readonly source_domain: PrincessDomain;
  readonly target_domain: PrincessDomain;
  readonly resource_amount: number;
  readonly estimated_impact: string;
}

export interface CapacityForecast {
  readonly forecast_id: string;
  readonly time_horizon_ms: number;
  readonly predicted_utilization: Record<string, number>;
  readonly bottleneck_predictions: readonly BottleneckPrediction[];
  readonly scaling_recommendations: readonly ScalingRecommendation[];
}

export interface BottleneckPrediction {
  readonly resource_type: string;
  readonly predicted_saturation_time: number;
  readonly confidence_level: number;
  readonly mitigation_options: readonly string[];
}

export interface ScalingRecommendation {
  readonly recommendation_id: string;
  readonly resource_type: string;
  readonly action: 'scale_up' | 'scale_down' | 'redistribute';
  readonly amount: number;
  readonly timeline: number;
  readonly cost_impact: number;
}

export interface OptimizationRecommendation {
  readonly recommendation_id: string;
  readonly optimization_type: 'performance' | 'cost' | 'efficiency' | 'reliability';
  readonly description: string;
  readonly expected_benefit: number;
  readonly implementation_effort: 'low' | 'medium' | 'high';
  readonly priority: number;
}

export interface PhaseDependency {
  readonly dependency_id: string;
  readonly predecessor_phase: string;
  readonly successor_phase: string;
  readonly dependency_type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish';
  readonly lag_time_ms: number;
}

export interface Milestone {
  readonly milestone_id: string;
  readonly name: string;
  readonly description: string;
  readonly target_date: number;
  readonly success_criteria: readonly string[];
  readonly dependencies: readonly string[];
}

export interface QualityCheckpoint {
  readonly checkpoint_id: string;
  readonly phase_id: string;
  readonly quality_gates: readonly QualityGateConfig[];
  readonly acceptance_criteria: readonly string[];
  readonly review_required: boolean;
}

export interface RiskMitigation {
  readonly mitigation_id: string;
  readonly risk_description: string;
  readonly mitigation_strategy: string;
  readonly contingency_plan: string;
  readonly monitoring_approach: string;
}

// Export all signature contracts
export const QueenPrincessSignatures = {
  QueenToPrincessDirective,
  PrincessToQueenReport,
  QueenToPrincessAllocation
} as const;

/*
 * AGENT FOOTER: QueenPrincessSignatures v1.0.0
 * Status: OK | NASA Rule 10 Compliant | FSM-Compatible | TypeScript Type Safety
 * Created: 2025-09-28T16:15:30-04:00 | Agent: dspy-signature-specialist@claude-sonnet-4
 */

// Backward compatibility
export default QueenPrincessSignatures;
