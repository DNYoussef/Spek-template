/**
 * Migration Validation Types
 * Quality assurance and validation types
 * NASA Rule 10 Compliant - Extracted from MigrationAnalysisTypes.ts
 */

export interface QualityMetrics {
  analysis_quality: AnalysisQuality;
  prediction_accuracy: PredictionAccuracy;
  completeness: CompletenessMetrics;
  reliability: ReliabilityMetrics;
  stakeholder_confidence: StakeholderConfidence;
}

export interface AnalysisQuality {
  methodology_score: number;
  data_quality_score: number;
  expert_review_score: number;
  validation_score: number;
  overall_quality_score: number;
}

export interface PredictionAccuracy {
  effort_estimation_accuracy: number;
  timeline_prediction_accuracy: number;
  risk_prediction_accuracy: number;
  cost_estimation_accuracy: number;
  overall_accuracy_score: number;
}

export interface CompletenessMetrics {
  scope_coverage: number;
  stakeholder_input_coverage: number;
  technical_coverage: number;
  business_coverage: number;
  overall_completeness: number;
}

export interface ReliabilityMetrics {
  consistency_score: number;
  reproducibility_score: number;
  sensitivity_analysis_score: number;
  peer_review_score: number;
  overall_reliability: number;
}

export interface StakeholderConfidence {
  technical_team_confidence: number;
  business_team_confidence: number;
  management_confidence: number;
  customer_confidence: number;
  overall_confidence: number;
}

export interface TestingRequirement {
  type: 'unit' | 'integration' | 'system' | 'acceptance' | 'performance' | 'security';
  scope: string;
  effort_estimate: string;
  tools_required: string[];
  dependencies: string[];
}

export interface ValidationStep {
  name: string;
  description: string;
  validation_method: string;
  expected_outcome: string;
  pass_criteria: string;
  responsible_party: string;
}

export interface QualityGate {
  id: string;
  name: string;
  phase: string;
  criteria: QualityGateCriteria[];
  approval_required: boolean;
  approvers: string[];
  escalation_procedure: string;
}

export interface QualityGateCriteria {
  metric: string;
  threshold: number;
  measurement_method: string;
  data_source: string;
  frequency: string;
}