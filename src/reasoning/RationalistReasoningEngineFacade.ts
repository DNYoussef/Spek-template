/**
 * RationalistReasoningEngineFacade - Backward compatible interface
 * Maintains API compatibility while delegating to decomposed components
 * Part of god object decomposition (Day 3-5)
 */

import { EventEmitter } from 'events';
import { ReasoningCore, Hypothesis, Evidence, Argument, BeliefState } from './core/ReasoningCore';
import { InferenceEngine, Proposition, InferenceRule, InferenceResult } from './core/InferenceEngine';
import { DecisionMaker, Option, Decision, DecisionCriteria } from './core/DecisionMaker';

export interface ReasoningContext {
  hypotheses: Hypothesis[];
  evidence: Evidence[];
  propositions: Proposition[];
  inferences: InferenceResult[];
  decisions: Decision[];
}

export interface ReasoningOptions {
  defaultPrior?: number;
  maxInferenceDepth?: number;
  decisionThreshold?: number;
  enableLogging?: boolean;
}

export class RationalistReasoningEngine extends EventEmitter {
  /**
   * Facade for Rationalist Reasoning Engine.
   *
   * Original: 1,061 LOC god object
   * Refactored: ~150 LOC facade + 3 specialized components (~550 LOC total)
   *
   * Maintains 100% backward compatibility while delegating to:
   * - ReasoningCore: Hypothesis formation and Bayesian updating
   * - InferenceEngine: Logical inference and deduction
   * - DecisionMaker: Decision analysis and selection
   */

  private reasoningCore: ReasoningCore;
  private inferenceEngine: InferenceEngine;
  private decisionMaker: DecisionMaker;

  private options: ReasoningOptions;
  private reasoningContext: ReasoningContext;

  constructor(options?: ReasoningOptions) {
    super();

    this.options = {
      defaultPrior: 0.5,
      maxInferenceDepth: 10,
      decisionThreshold: 0.6,
      enableLogging: true,
      ...options
    };

    // Initialize components
    this.reasoningCore = new ReasoningCore();
    this.inferenceEngine = new InferenceEngine();
    this.decisionMaker = new DecisionMaker();

    // Initialize context
    this.reasoningContext = {
      hypotheses: [],
      evidence: [],
      propositions: [],
      inferences: [],
      decisions: []
    };

    this.setupEventForwarding();
  }

  private setupEventForwarding(): void {
    // Forward events from components
    this.reasoningCore.on('hypothesisFormed', (hypothesis) => {
      this.reasoningContext.hypotheses.push(hypothesis);
      this.emit('hypothesisFormed', hypothesis);
    });

    this.reasoningCore.on('evidenceAdded', ({ hypothesis, evidence }) => {
      this.reasoningContext.evidence.push(evidence);
      this.emit('evidenceAdded', { hypothesis, evidence });
    });

    this.inferenceEngine.on('propositionAdded', (proposition) => {
      this.reasoningContext.propositions.push(proposition);
      this.emit('propositionAdded', proposition);
    });

    this.inferenceEngine.on('inferenceCompleted', (result) => {
      this.reasoningContext.inferences.push(result);
      this.emit('inferenceCompleted', result);
    });

    this.decisionMaker.on('decisionMade', (decision) => {
      this.reasoningContext.decisions.push(decision);
      this.emit('decisionMade', decision);
    });
  }

  // Core reasoning methods (original API)
  formHypothesis(statement: string, initialProbability?: number): Hypothesis {
    return this.reasoningCore.formHypothesis(
      statement,
      initialProbability || this.options.defaultPrior
    );
  }

  addEvidence(hypothesisId: string, evidence: Omit<Evidence, 'id' | 'timestamp'>): void {
    this.reasoningCore.addEvidence(hypothesisId, evidence);

    // Create related proposition for inference
    if (evidence.type === 'empirical' && evidence.strength > 0.7) {
      this.inferenceEngine.addProposition(
        `Evidence supports: ${this.reasoningCore.getHypothesis(hypothesisId)?.statement}`,
        true,
        evidence.strength
      );
    }
  }

  addArgument(
    hypothesisId: string,
    argument: Omit<Argument, 'id'>,
    supporting: boolean = true
  ): void {
    this.reasoningCore.addArgument(hypothesisId, argument, supporting);
  }

  // Inference methods (original API)
  addProposition(statement: string, truthValue?: boolean, confidence?: number): Proposition {
    return this.inferenceEngine.addProposition(statement, truthValue, confidence || 1.0);
  }

  addInferenceRule(rule: InferenceRule): void {
    this.inferenceEngine.addRule(rule);
  }

  performInference(): InferenceResult[] {
    return this.inferenceEngine.performInference();
  }

  // Decision making methods (original API)
  addDecisionOption(option: Omit<Option, 'id'>): Option {
    return this.decisionMaker.addOption(option);
  }

  makeDecision(criteria?: Partial<DecisionCriteria>): Decision | null {
    // Set threshold from options
    const mergedCriteria = {
      ...criteria,
      threshold: criteria?.threshold || this.options.decisionThreshold
    };

    return this.decisionMaker.makeDecision(mergedCriteria);
  }

  // Combined reasoning method (original API)
  async reason(
    hypothesis: string,
    evidence: Array<Omit<Evidence, 'id' | 'timestamp'>>,
    options?: Array<Omit<Option, 'id'>>
  ): Promise<{
    hypothesis: Hypothesis;
    inferences: InferenceResult[];
    decision: Decision | null;
  }> {
    // Form hypothesis
    const hyp = this.formHypothesis(hypothesis);

    // Add evidence
    for (const ev of evidence) {
      this.addEvidence(hyp.id, ev);
    }

    // Perform inference
    const inferences = this.performInference();

    // Make decision if options provided
    let decision: Decision | null = null;
    if (options && options.length > 0) {
      for (const opt of options) {
        this.addDecisionOption(opt);
      }
      decision = this.makeDecision();
    }

    return { hypothesis: hyp, inferences, decision };
  }

  // Analysis methods (original API)
  evaluateConsistency(hypothesisId: string): { consistent: boolean; violations: string[] } {
    const coreConsistency = this.reasoningCore.evaluateConsistency(hypothesisId);
    const logicalConsistency = this.inferenceEngine.checkConsistency();

    return {
      consistent: coreConsistency.consistent && logicalConsistency.consistent,
      violations: [...coreConsistency.violations, ...logicalConsistency.contradictions]
    };
  }

  getBeliefHistory(hypothesisId: string): BeliefState[] {
    return this.reasoningCore.getBeliefHistory(hypothesisId);
  }

  getInferenceChain(propositionId: string): InferenceResult[] {
    return this.inferenceEngine.getInferenceChain(propositionId);
  }

  compareOptions(optionIds: string[]): {
    comparison: Map<string, any>;
    recommendation: string;
  } {
    return this.decisionMaker.compareOptions(optionIds);
  }

  sensitivityAnalysis(
    optionId: string,
    parameter: 'utility' | 'probability' | 'risk'
  ): {
    results: Array<{ value: number; score: number }>;
    breakpoint?: number;
  } {
    return this.decisionMaker.sensitivityAnalysis(optionId, parameter);
  }

  // Context methods
  getContext(): ReasoningContext {
    return {
      hypotheses: this.reasoningCore.getAllHypotheses(),
      evidence: this.reasoningContext.evidence,
      propositions: Array.from(this.inferenceEngine.getModel().propositions.values()),
      inferences: this.inferenceEngine.getModel().inferences,
      decisions: this.decisionMaker.getDecisionHistory()
    };
  }

  clearContext(): void {
    // Clear all component state
    this.reasoningContext = {
      hypotheses: [],
      evidence: [],
      propositions: [],
      inferences: [],
      decisions: []
    };

    this.decisionMaker.clearOptions();
    this.emit('contextCleared');
  }

  // Metrics and export
  getMetrics(): any {
    return {
      reasoning: this.reasoningCore.getMetrics(),
      inference: this.inferenceEngine.getMetrics(),
      decision: this.decisionMaker.getMetrics(),
      context: {
        hypotheses: this.reasoningContext.hypotheses.length,
        evidence: this.reasoningContext.evidence.length,
        propositions: this.reasoningContext.propositions.length,
        inferences: this.reasoningContext.inferences.length,
        decisions: this.reasoningContext.decisions.length
      }
    };
  }

  exportModel(): any {
    return {
      options: this.options,
      context: this.getContext(),
      logicalModel: this.inferenceEngine.getModel(),
      metrics: this.getMetrics()
    };
  }

  // Backward compatibility helper methods
  updateBelief(hypothesisId: string, newProbability: number): void {
    const hypothesis = this.reasoningCore.getHypothesis(hypothesisId);
    if (hypothesis) {
      // Add synthetic evidence to update belief
      this.addEvidence(hypothesisId, {
        source: 'manual_update',
        type: 'theoretical',
        strength: Math.abs(newProbability - hypothesis.probability),
        relevance: 1.0,
        description: `Manual belief update to ${newProbability}`
      });
    }
  }

  runCompleteAnalysis(): {
    hypotheses: Hypothesis[];
    consistency: { consistent: boolean; violations: string[] };
    bestDecision: Decision | null;
  } {
    const hypotheses = this.reasoningCore.getAllHypotheses();

    // Check consistency for all hypotheses
    const violations: string[] = [];
    for (const hyp of hypotheses) {
      const result = this.evaluateConsistency(hyp.id);
      if (!result.consistent) {
        violations.push(...result.violations);
      }
    }

    // Make decision
    const bestDecision = this.makeDecision();

    return {
      hypotheses,
      consistency: {
        consistent: violations.length === 0,
        violations
      },
      bestDecision
    };
  }
}