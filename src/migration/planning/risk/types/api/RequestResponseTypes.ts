/**
 * Risk Assessment API Types
 * Request and response interfaces for risk assessment operations
 */

import { BaseAssessment, AssessmentQuality, TimeFrame } from '../core/BaseRiskTypes';

// Request Types
export interface RiskAssessmentRequest {
  assessmentId: string;
  migrationPlan: MigrationPlan;
  systemContext: SystemContext;
  stakeholders: Stakeholder[];
  constraints: RiskConstraint[];
  historicalData: HistoricalData;
  options: RiskAssessmentOptions;
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

// Response Types
export interface RiskAssessmentResult extends BaseAssessment {
  assessment_id: string;
  duration: number;
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

export interface AssessmentSummary {
  id: string;
  title: string;
  status: string;
  overall_risk_level: string;
  key_risks: string[];
  recommendations_count: number;
  completed_date?: Date;
}

// Pagination and Filtering
export interface AssessmentQuery {
  page?: number;
  limit?: number;
  status?: string[];
  methodology?: string[];
  date_range?: TimeFrame;
  risk_level?: string[];
  tags?: string[];
}

export interface AssessmentResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Forward declarations for complex types
export interface MigrationPlan {
  id: string;
  name: string;
  scope: any;
  phases: any[];
  timeline: any;
  resources: any;
  dependencies: any[];
  assumptions: any[];
}

export interface SystemContext {
  id: string;
  name: string;
  type: string;
  environment: string;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  influence: string;
  interest: string;
}

export interface RiskConstraint {
  type: string;
  description: string;
  value: any;
}

export interface HistoricalData {
  assessments: any[];
  incidents: any[];
  lessons_learned: any[];
}

// Results Components
export interface OverallRiskProfile {
  level: string;
  score: number;
  distribution: any;
}

export interface RiskCategory {
  name: string;
  risks: any[];
  score: number;
}

export interface RiskRegister {
  risks: any[];
  metadata: any;
}

export interface RiskMatrix {
  dimensions: any;
  cells: any[];
}

export interface MitigationPortfolio {
  strategies: any[];
  timeline: any;
}

export interface MonitoringFramework {
  indicators: any[];
  thresholds: any[];
}

export interface RiskRecommendation {
  id: string;
  priority: string;
  description: string;
}

export interface RiskScenario {
  name: string;
  probability: number;
  impact: any;
}

export interface SensitivityAnalysis {
  variables: any[];
  results: any[];
}