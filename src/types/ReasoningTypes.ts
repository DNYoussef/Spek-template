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
}

export interface Hypothesis {
  readonly id: string;
  readonly statement: string;
  readonly evidence: readonly Evidence[];
  readonly confidence: number;
  readonly alternatives: readonly string[];
}

export interface Analysis {
  readonly id: string;
  readonly subject: string;
  readonly methodology: ReasoningStrategy;
  readonly findings: readonly string[];
  readonly confidence: number;
  readonly limitations: readonly string[];
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
}

export interface Cost {
  readonly monetary: number;
  readonly time: number;
  readonly resources: Record<string, number>;
  readonly risk: number; // 0-1
}

export interface DecisionContext {
  readonly goal: string;
  readonly constraints: readonly string[];
  readonly criteria: readonly DecisionCriteria[];
  readonly options: readonly DecisionOption[];
  readonly timestamp: number;
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
}

export interface CognitiveBias {
  readonly type: string;
  readonly description: string;
  readonly impact: 'low' | 'medium' | 'high';
  readonly mitigation: BiasMetigation[];
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
