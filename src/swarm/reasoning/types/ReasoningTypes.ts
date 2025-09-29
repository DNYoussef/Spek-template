/**
 * Type definitions for Rationalist Reasoning Engine
 * Extracted from monolithic implementation for modularity
 */

export interface Evidence {
  id: string;
  type: 'empirical' | 'statistical' | 'logical' | 'testimonial' | 'observational';
  source: string;
  reliability: number; // 0-1 scale
  content: string;
  data: any;
  timestamp: Date;
  confidence: number;
  weight: number;
  contradicts: string[];
  supports: string[];
  metadata: Record<string, any>;
}

export interface Hypothesis {
  id: string;
  description: string;
  probability: number; // Prior probability
  posteriorProbability?: number; // After evidence update
  evidence: Evidence[];
  predictions: Prediction[];
  testable: boolean;
  falsifiable: boolean;
  complexity: number; // Occam's razor consideration
  status: 'proposed' | 'testing' | 'supported' | 'refuted' | 'uncertain';
  confidence: number;
  lastUpdated: Date;
  alternatives: string[]; // Alternative hypotheses
}

export interface Belief {
  id: string;
  proposition: string;
  credence: number; // Degree of belief (0-1)
  justification: Justification;
  evidenceBase: Evidence[];
  epistemic_status: 'certain' | 'highly_confident' | 'confident' | 'uncertain' | 'skeptical';
  last_updated: Date;
  revision_history: BeliefRevision[];
  dependencies: string[]; // Other beliefs this depends on
  implications: string[]; // What this belief implies
}

export interface DecisionContext {
  id: string;
  description: string;
  goal: string;
  constraints: Constraint[];
  options: DecisionOption[];
  criteria: DecisionCriteria[];
  stakeholders: Stakeholder[];
  timeHorizon: TimeHorizon;
  uncertainty: UncertaintyAssessment;
  riskTolerance: number;
  reversibility: number; // How easily the decision can be undone
}

export interface Analysis {
  analysisId: string;
  type: 'decision' | 'hypothesis_evaluation' | 'evidence_assessment' | 'bias_check' | 'failure_mode';
  input: any;
  methodology: AnalysisMethodology;
  results: AnalysisResult[];
  confidence: number;
  limitations: string[];
  recommendations: Recommendation[];
  timestamp: Date;
  analyst: string;
  reviewed: boolean;
  reviewers: string[];
}

export interface CognitiveBias {
  name: string;
  description: string;
  category: 'confirmation' | 'availability' | 'anchoring' | 'overconfidence' | 'attribution' | 'planning' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected: boolean;
  evidence: string[];
  mitigation: BiasMetigation;
  prevalence: number; // How common this bias is in the context
}

export interface RedTeamAnalysis {
  analysisId: string;
  target: string;
  attackVectors: AttackVector[];
  failureModes: FailureMode[];
  assumptions: Assumption[];
  vulnerabilities: Vulnerability[];
  mitigations: Mitigation[];
  residualRisk: number;
  confidence: number;
  recommendations: string[];
  timestamp: Date;
}

export interface Prediction {
  description: string;
  probability: number;
  timeframe: string;
  testable: boolean;
  outcome?: 'confirmed' | 'refuted' | 'uncertain';
}

export interface Justification {
  type: 'deductive' | 'inductive' | 'abductive' | 'empirical' | 'pragmatic';
  strength: number;
  premises: string[];
  inference_rule: string;
  validity: boolean;
  soundness: boolean;
}

export interface BeliefRevision {
  timestamp: Date;
  old_credence: number;
  new_credence: number;
  reason: string;
  evidence: string[];
  method: 'bayesian_update' | 'total_evidence' | 'coherence_adjustment';
}

export interface Constraint {
  type: 'resource' | 'time' | 'legal' | 'ethical' | 'technical' | 'political';
  description: string;
  severity: 'hard' | 'soft';
  impact: number;
}

export interface DecisionOption {
  id: string;
  name: string;
  description: string;
  expected_value: number;
  probability_distributions: ProbabilityDistribution[];
  costs: Cost[];
  benefits: Benefit[];
  risks: Risk[];
  feasibility: number;
  reversibility: number;
}

export interface DecisionCriteria {
  name: string;
  weight: number;
  type: 'quantitative' | 'qualitative';
  measurement: string;
  threshold?: number;
}

export interface Stakeholder {
  name: string;
  interests: string[];
  influence: number;
  impact: number;
  alignment: number; // How aligned with our goals
}

export interface TimeHorizon {
  immediate: string; // <1 month
  short_term: string; // 1-6 months
  medium_term: string; // 6 months - 2 years
  long_term: string; // >2 years
}

export interface UncertaintyAssessment {
  epistemic: number; // Uncertainty due to lack of knowledge
  aleatory: number; // Uncertainty due to inherent randomness
  sources: string[];
  reducible: boolean;
  impact: number;
}

export interface AnalysisMethodology {
  name: string;
  description: string;
  steps: string[];
  assumptions: string[];
  limitations: string[];
  validity_conditions: string[];
}

export interface AnalysisResult {
  finding: string;
  confidence: number;
  evidence: string[];
  implications: string[];
  uncertainty: number;
}

export interface Recommendation {
  id: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  rationale: string;
  evidence: string[];
  implementation: string;
  timeline: string;
  resources_required: string[];
  success_criteria: string[];
}

export interface BiasMetigation {
  strategies: string[];
  effectiveness: number;
  implementation_difficulty: number;
  cost: number;
}

export interface AttackVector {
  name: string;
  description: string;
  likelihood: number;
  impact: number;
  detection_difficulty: number;
  mitigation_cost: number;
}

export interface FailureMode {
  name: string;
  description: string;
  probability: number;
  impact: number;
  detectability: number;
  causes: string[];
  effects: string[];
  mitigations: string[];
}

export interface Assumption {
  description: string;
  confidence: number;
  criticality: number;
  testable: boolean;
  evidence: string[];
  alternatives: string[];
}

export interface Vulnerability {
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  exploitability: number;
  impact: number;
  mitigations: string[];
}

export interface Mitigation {
  name: string;
  description: string;
  effectiveness: number;
  cost: number;
  implementation_time: string;
  side_effects: string[];
}

export interface ProbabilityDistribution {
  parameter: string;
  distribution_type: 'normal' | 'uniform' | 'beta' | 'gamma' | 'exponential';
  parameters: Record<string, number>;
  confidence_interval: [number, number];
}

export interface Cost {
  type: 'financial' | 'time' | 'opportunity' | 'reputation' | 'political';
  amount: number;
  probability: number;
  timeframe: string;
}

export interface Benefit {
  type: 'financial' | 'strategic' | 'operational' | 'reputation' | 'learning';
  amount: number;
  probability: number;
  timeframe: string;
}

export interface Risk {
  description: string;
  probability: number;
  impact: number;
  mitigation: string;
  contingency: string;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: reasoning-types-001
// inputs: ["RationalistReasoningEngine.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"codex","prompt":"v1"}
// === END FOOTER ===