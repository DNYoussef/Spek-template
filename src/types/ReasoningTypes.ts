/**
 * ReasoningTypes.ts - AI Reasoning Type Definitions
 * @stub true
 * @architecture AI reasoning and decision-making type system
 */

// Reasoning step
export interface ReasoningStep {
  readonly id: string;
  readonly type: 'observation' | 'hypothesis' | 'inference' | 'conclusion';
  readonly content: string;
  readonly confidence: number; // 0-1
  readonly timestamp: number;
}

// Reasoning chain
export interface ReasoningChain {
  readonly id: string;
  readonly goal: string;
  readonly steps: readonly ReasoningStep[];
  readonly conclusion?: string;
  readonly confidence: number;
}

// Reasoning strategy
export type ReasoningStrategy =
  | 'deductive'
  | 'inductive'
  | 'abductive'
  | 'analogical'
  | 'causal'
  | 'sequential';

// Reasoning context
export interface ReasoningContext {
  readonly facts: readonly string[];
  readonly assumptions: readonly string[];
  readonly constraints: readonly string[];
  readonly strategy: ReasoningStrategy;
}

// Reasoning result
export interface ReasoningResult {
  readonly chain: ReasoningChain;
  readonly alternatives: readonly ReasoningChain[];
  readonly confidence: number;
  readonly explanation: string;
}

// Additional exports for decision-making and analysis
export interface Evidence {
  readonly id: string;
  readonly type: 'empirical' | 'theoretical' | 'anecdotal' | 'statistical';
  readonly content: string;
  readonly reliability: number; // 0-1
  readonly source: string;
  readonly weight?: number; // Evidence weight in analysis (0-1)
  readonly supports?: readonly string[]; // Hypotheses/beliefs this evidence supports
  readonly contradicts?: readonly string[]; // Hypotheses/beliefs this evidence contradicts
  readonly data?: any; // Raw evidence data
  readonly timestamp?: number; // Evidence collection timestamp
  readonly confidence?: number; // Confidence in evidence (0-1)
  readonly metadata?: Record<string, unknown>; // Additional metadata
}

export interface Hypothesis {
  readonly id: string;
  readonly statement: string;
  readonly evidence: readonly Evidence[];
  readonly confidence: number;
  readonly alternatives: readonly string[];
  readonly probability?: number; // Probability estimate (0-1)
  readonly description?: string; // Human-readable description
  readonly status?: 'active' | 'testing' | 'validated' | 'rejected'; // Hypothesis status
  readonly lastUpdated?: number; // Last update timestamp
  readonly predictions?: readonly Prediction[]; // Predictions based on hypothesis
  readonly posteriorProbability?: number; // Bayesian posterior probability (0-1)
}

export interface Analysis {
  readonly id: string;
  readonly analysisId?: string; // Alias for id (backward compatibility)
  readonly subject: string;
  readonly methodology: ReasoningStrategy;
  readonly findings: readonly string[];
  readonly confidence: number;
  readonly limitations: readonly string[];
  readonly recommendations?: readonly Recommendation[]; // Analysis recommendations
  readonly results?: any; // Analysis results data
}

export interface Prediction {
  readonly id: string;
  readonly outcome: string;
  readonly probability: number;
  readonly timeframe: string;
  readonly assumptions: readonly string[];
  readonly confidence: number;
}

export interface DecisionOption {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly pros: readonly string[];
  readonly cons: readonly string[];
  readonly cost: Cost;
  readonly expectedOutcome: string;
  readonly feasibility?: number; // Feasibility score (0-1)
  readonly expected_value?: number; // Expected value calculation
  readonly risks?: readonly string[]; // Associated risks
}

export interface Cost {
  readonly monetary: number;
  readonly time: number;
  readonly resources: Record<string, number>;
  readonly risk: number; // 0-1
  readonly type?: 'fixed' | 'variable' | 'opportunity'; // Cost type
}

export interface DecisionContext {
  readonly goal: string;
  readonly constraints: readonly string[];
  readonly criteria: readonly DecisionCriteria[];
  readonly options: readonly DecisionOption[];
  readonly timestamp: number;
  readonly uncertainty?: number | UncertaintyAnalysis; // Uncertainty level or detailed analysis
}

export interface UncertaintyAnalysis {
  readonly epistemic: number; // Knowledge uncertainty (0-1)
  readonly aleatory: number; // Random uncertainty (0-1)
  readonly sources: readonly string[]; // Uncertainty sources
  readonly impact: number; // Impact on decision (0-1)
}

export interface DecisionCriteria {
  readonly name: string;
  readonly weight: number; // 0-1
  readonly type: 'quantitative' | 'qualitative';
  readonly threshold?: number;
}

export interface Recommendation {
  readonly optionId: string;
  readonly reasoning: ReasoningChain;
  readonly confidence: number;
  readonly alternatives: readonly string[];
  readonly risks: readonly string[];
}

export interface Belief {
  readonly statement: string;
  readonly confidence: number;
  readonly evidence: readonly Evidence[];
  readonly formed: number;
  readonly updated: number;
  readonly credence?: number; // Degree of belief (0-1)
  readonly proposition?: string; // Propositional content
}

export interface CognitiveBias {
  readonly type: string;
  readonly description: string;
  readonly impact: 'low' | 'medium' | 'high';
  readonly mitigation: BiasMetigation[];
  readonly name?: string; // Bias name identifier
  readonly detected?: boolean; // Whether bias was detected
  readonly evidence?: readonly Evidence[]; // Evidence of bias
  readonly severity?: 'low' | 'medium' | 'high' | 'critical'; // Bias severity
}

export interface BiasMetigation {
  readonly strategy: string;
  readonly effectiveness: number;
  readonly implementation: string;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0
// === END FOOTER ===
