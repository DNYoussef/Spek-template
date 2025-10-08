/**
 * Base Risk Assessment Types
 * Core interfaces that form the foundation of the risk assessment system
 */

// Base Risk Entities
export interface BaseRisk {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  likelihood: number; // 0-100
  impact: number; // 0-100
  created: Date;
  updated: Date;
}

export interface RiskIdentifier {
  id: string;
  type: string;
  version?: string;
}

export interface RiskContext {
  system: string;
  domain: string;
  environment: string;
  scope: string[];
}

// Base Assessment Types
export interface BaseAssessment {
  id: string;
  timestamp: Date;
  assessor: string;
  methodology: string;
  status: 'draft' | 'in_progress' | 'completed' | 'reviewed' | 'approved';
}

export interface AssessmentMetadata {
  version: string;
  created_by: string;
  approved_by?: string;
  tags: string[];
  confidence_level: number;
}

// Base Temporal Types
export interface TimeFrame {
  start: Date;
  end: Date;
  duration?: number;
}

export interface Timeline {
  start: Date;
  end: Date;
  phases: any[];
  milestones: any[];
}

// Base Quality Types
export interface QualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  reliability: number;
}

export interface AssessmentQuality extends QualityMetrics {
  data_sources: string[];
  expert_reviews: number;
  validation_methods: string[];
  limitations: string[];
}

// Base Score Types
export interface RiskScore {
  value: number;
  scale: string;
  methodology: string;
  confidence: number;
}

export interface ScoreBreakdown {
  technical: number;
  business: number;
  financial: number;
  operational: number;
  strategic: number;
}