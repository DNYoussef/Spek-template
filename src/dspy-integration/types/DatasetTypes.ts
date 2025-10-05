import { ValidationResult } from '../../types/validation-types';

/**
 * Type definitions for DSPy dataset building system
 * Comprehensive types for communication examples, scoring, and performance tracking
 */

export interface CommunicationExample {
  id: string;
  communication_type: 'queen_princess' | 'princess_drone' | 'drone_princess' | 'princess_queen' | 'context_dna';
  input: {
    context: Record<string, any>;
    requirements: string[];
    constraints: Record<string, any>;
  };
  output: {
    communication: string;
    structured_data: Record<string, any>;
    quality_metrics: QualityMetrics;
  };
  scoring: {
    clarity: number; // 1-10
    actionability: number; // 1-10
    completeness: number; // 0-100% (converted to 1-10 scale)
    efficiency: number; // 1-10
    overall_score: number; // calculated weighted average
  };
  metadata: {
    created_date: string;
    agent_source: string;
    validation_status: 'validated' | 'pending' | 'rejected';
    performance_data?: PerformanceMetrics;
    user_feedback?: UserFeedback;
    collection_source?: 'manual' | 'automated' | 'swarm_logs';
    feedback_received?: string;
  };
}

export interface QualityMetrics {
  clarity: number;
  completeness: number;
  actionability: number;
  readability_score?: number;
  information_density?: number;
  task_specificity?: number;
}

export interface PerformanceMetrics {
  response_time_ms: number;
  token_count: number;
  complexity_score: number;
  user_satisfaction_estimate: number; // 0-1
  timestamp: string;
  success_rate?: number;
  resource_utilization?: {
    cpu_usage: number;
    memory_usage: number;
    api_calls: number;
  };
}

export interface UserFeedback {
  satisfaction: number; // 1-10
  effectiveness: number; // 1-10
  comments?: string;
  specific_issues?: string[];
  suggested_improvements?: string[];
  would_use_again?: boolean;
}


export interface ScoringResult {
  clarity: number;
  actionability: number;
  completeness: number;
  efficiency: number;
  overall_score: number;
  performance_metrics: PerformanceMetrics;
  quality_assessment: {
    grade: string; // A+, A, A-, B+, etc.
    strengths: string[];
    improvement_areas: string[];
    recommendation: string;
  };
  benchmarks?: {
    vs_baseline_improvement: number; // percentage
    vs_target_progress: number; // percentage
    rank_percentile: number; // 0-100
  };
}

export interface DatasetMetrics {
  total_examples: number;
  by_type: Record<string, number>;
  validation_rates: Record<string, number>;
  average_scores: Record<string, number>;
  last_updated: string;
  health_status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  quality_trends?: {
    daily_averages: Array<{ date: string; avg_score: number }>;
    trending_direction: 'improving' | 'stable' | 'declining';
    trend_strength: number; // 0-1
  };
}

export interface BaselineSnapshot {
  communication_type: string;
  created_date: string;
  sample_count: number;
  measurement_window_hours: number;
  metrics: {
    response_time_avg: number;
    response_time_p95: number;
    user_satisfaction_avg: number;
    quality_score_avg: number;
    token_efficiency_avg: number;
    success_rate: number;
  };
  confidence_intervals: Record<string, { lower: number; upper: number }>;
  last_updated: string;
}

export interface OptimizationTarget {
  metric: string;
  current_value: number;
  target_value: number;
  improvement_percentage: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_effort: 'low' | 'medium' | 'high';
  timeline_estimate?: string;
  success_criteria?: string[];
  dependencies?: string[];
}

export interface TrainingDataFormat {
  input: {
    context: Record<string, any>;
    requirements: string[];
    constraints: Record<string, any>;
    communication_type: string;
  };
  output: string; // The communication text
  metadata: {
    score: number;
    type: string;
    quality_grade: string;
    performance_tier: 'excellent' | 'good' | 'acceptable' | 'poor';
  };
}

export interface ABTestConfiguration {
  test_name: string;
  baseline_model: string;
  candidate_model: string;
  traffic_split: number; // 0-1, percentage to candidate
  success_metrics: string[];
  minimum_sample_size: number;
  confidence_level: number; // 0.95 for 95% confidence
  max_duration_days: number;
  early_stopping_rules: {
    significance_threshold: number;
    minimum_effect_size: number;
    safety_threshold: number; // Stop if performance degrades too much
  };
}

export interface ExperimentResult {
  test_name: string;
  status: 'running' | 'completed' | 'stopped' | 'failed';
  start_date: string;
  end_date?: string;
  baseline_performance: Record<string, number>;
  candidate_performance: Record<string, number>;
  statistical_significance: Record<string, boolean>;
  effect_sizes: Record<string, number>;
  confidence_intervals: Record<string, { lower: number; upper: number }>;
  recommendation: 'deploy' | 'reject' | 'continue_testing' | 'modify_and_retest';
  reasoning: string;
}

export interface CollectionEvent {
  event_type: 'interaction_recorded' | 'batch_collected' | 'batch_processed' | 'feedback_processed' | 'collection_error';
  timestamp: string;
  data: Record<string, any>;
}

export interface DatasetHealthCheck {
  overall_health: 'healthy' | 'warning' | 'critical';
  checks: Array<{
    name: string;
    status: 'pass' | 'warning' | 'fail';
    message: string;
    value?: number;
    threshold?: number;
  }>;
  recommendations: string[];
  last_check: string;
}

export interface PromptOptimizationConfig {
  optimization_strategy: 'evolutionary' | 'gradient_based' | 'random_search' | 'bayesian';
  population_size: number; // For evolutionary strategy
  generations: number;
  mutation_rate: number;
  selection_pressure: number;
  objective_function: 'weighted_score' | 'user_satisfaction' | 'efficiency' | 'multi_objective';
  constraints: {
    max_token_length: number;
    required_elements: string[];
    forbidden_patterns: string[];
  };
}

export interface OptimizationProgress {
  generation: number;
  best_score: number;
  average_score: number;
  convergence_trend: number; // Rate of improvement
  estimated_completion_time: string;
  current_best_prompt: string;
  performance_history: Array<{
    generation: number;
    scores: number[];
    best_individual: {
      prompt: string;
      score: number;
      validation_results: ValidationResult;
    };
  }>;
}

// Specialized types for different communication patterns

export interface QueenPrincessContext {
  domain: 'development' | 'testing' | 'deployment' | 'planning' | 'monitoring';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  scope: 'task' | 'feature' | 'project' | 'system';
  resources: {
    agents_available: number;
    time_constraints: string;
    technical_constraints: string[];
  };
}

export interface PrincessDroneContext {
  task_type: 'implementation' | 'testing' | 'analysis' | 'documentation' | 'optimization';
  skill_requirements: string[];
  dependencies: string[];
  acceptance_criteria: string[];
  estimated_effort: 'small' | 'medium' | 'large' | 'extra_large';
}

export interface DronePrincessContext {
  completion_status: 'completed' | 'in_progress' | 'blocked' | 'failed';
  deliverables: string[];
  issues_encountered: string[];
  next_steps: string[];
  quality_metrics: Record<string, number>;
}

export interface PrincessQueenContext {
  domain_summary: Record<string, any>;
  progress_metrics: Record<string, number>;
  risk_assessment: {
    risks: Array<{ description: string; probability: number; impact: number }>;
    mitigation_strategies: string[];
  };
  resource_utilization: Record<string, number>;
  recommendations: string[];
}

export interface ContextDNAStructure {
  project_phase: 'planning' | 'development' | 'testing' | 'deployment' | 'maintenance';
  architecture_patterns: string[];
  quality_gates: Record<string, number>;
  team_coordination: {
    communication_frequency: string;
    decision_makers: string[];
    escalation_paths: string[];
  };
  technical_stack: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    infrastructure: string[];
  };
}

// Export all types for easy importing
export type {
  CommunicationExample as Example,
  QualityMetrics as Quality,
  PerformanceMetrics as Performance,
  ValidationResult as Validation,
  ScoringResult as Scoring,
  DatasetMetrics as Metrics,
  BaselineSnapshot as Baseline,
  OptimizationTarget as Target
};