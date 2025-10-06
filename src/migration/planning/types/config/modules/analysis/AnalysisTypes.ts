/**
 * Analysis Configuration Types
 * Types for analysis constraints, options, and configuration
 */

// Analysis Configuration
export interface AnalysisConstraint {
  type: 'time' | 'budget' | 'resource' | 'compliance' | 'technical' | 'business';
  description: string;
  value: any;
  flexibility: 'fixed' | 'negotiable' | 'flexible';
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnalysisOptions {
  depth: 'shallow' | 'standard' | 'deep' | 'comprehensive';
  focus_areas: string[];
  risk_tolerance: 'low' | 'medium' | 'high';
  include_recommendations: boolean;
  include_alternatives: boolean;
  parallel_analysis: boolean;
  confidence_level: number;
}

export interface AnalysisConfigurationContext {
  constraints: AnalysisConstraint[];
  options: AnalysisOptions;
  environment: AnalysisEnvironment;
  stakeholders: AnalysisStakeholder[];
}

export interface AnalysisEnvironment {
  system_complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  data_sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  regulatory_requirements: string[];
  business_criticality: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnalysisStakeholder {
  role: string;
  involvement_level: 'observer' | 'participant' | 'decision_maker' | 'approver';
  expertise_areas: string[];
  availability: string;
}

// Analysis Methodology
export interface AnalysisMethodology {
  name: string;
  type: 'qualitative' | 'quantitative' | 'mixed_method';
  steps: AnalysisStep[];
  tools: AnalysisTool[];
  outputs: AnalysisOutput[];
  quality_criteria: QualityCriteria[];
}

export interface AnalysisStep {
  order: number;
  name: string;
  description: string;
  duration_estimate: string;
  inputs: string[];
  outputs: string[];
  tools_required: string[];
  skills_required: string[];
}

export interface AnalysisTool {
  name: string;
  type: 'automated' | 'manual' | 'hybrid';
  purpose: string;
  inputs: string[];
  outputs: string[];
  accuracy_level: number;
  effort_required: string;
}

export interface AnalysisOutput {
  type: 'report' | 'dashboard' | 'model' | 'recommendation' | 'data_export';
  format: string;
  audience: string[];
  content_summary: string;
  delivery_method: string;
}

export interface QualityCriteria {
  dimension: 'accuracy' | 'completeness' | 'consistency' | 'timeliness' | 'relevance';
  measurement: string;
  target_threshold: number;
  acceptable_threshold: number;
}

// Analysis Configuration Management
export interface AnalysisConfiguration {
  id: string;
  name: string;
  version: string;
  methodology: AnalysisMethodology;
  parameters: AnalysisParameter[];
  templates: AnalysisTemplate[];
  validation_rules: AnalysisValidationRule[];
}

export interface AnalysisParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  default_value: any;
  constraints: ParameterConstraint[];
  description: string;
}

export interface ParameterConstraint {
  type: 'range' | 'enum' | 'pattern' | 'custom';
  value: any;
  error_message: string;
}

export interface AnalysisTemplate {
  name: string;
  type: string;
  content: string;
  variables: TemplateVariable[];
  output_format: string;
}

export interface TemplateVariable {
  name: string;
  type: string;
  source: 'input' | 'calculation' | 'lookup';
  transformation?: string;
}

export interface AnalysisValidationRule {
  name: string;
  type: 'data_quality' | 'business_rule' | 'consistency_check' | 'completeness_check';
  rule_expression: string;
  severity: 'error' | 'warning' | 'info';
  auto_fix_available: boolean;
}

// Analysis Results and Reporting
export interface ConfigurationAnalysisResult {
  id: string;
  analysis_id: string;
  timestamp: Date;
  status: 'completed' | 'partial' | 'failed';
  findings: AnalysisFinding[];
  recommendations: AnalysisRecommendation[];
  quality_assessment: AnalysisQualityAssessment;
  metadata: AnalysisResultMetadata;
}

export interface AnalysisFinding {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence: Evidence[];
  impact_assessment: ImpactAssessment;
}

export interface Evidence {
  type: 'quantitative' | 'qualitative' | 'documentation' | 'observation';
  source: string;
  data: any;
  confidence_level: number;
  collection_method: string;
}

export interface ImpactAssessment {
  business_impact: string;
  technical_impact: string;
  financial_impact: number;
  timeline_impact: string;
  risk_level: string;
}

export interface AnalysisRecommendation {
  id: string;
  finding_id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  implementation_effort: string;
  expected_benefit: string;
  alternatives: Alternative[];
}

export interface Alternative {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  effort_estimate: string;
  risk_assessment: string;
}

export interface AnalysisQualityAssessment {
  completeness_score: number;
  accuracy_score: number;
  consistency_score: number;
  timeliness_score: number;
  overall_quality: 'excellent' | 'good' | 'acceptable' | 'poor';
  improvement_areas: string[];
}

export interface AnalysisResultMetadata {
  analyst: string;
  review_status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  tags: string[];
  related_analyses: string[];
  data_sources: string[];
  limitations: string[];
}