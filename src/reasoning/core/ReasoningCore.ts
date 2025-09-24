/**
 * ReasoningCore - Extracted from RationalistReasoningEngine
 * Core logic for rationalist reasoning and decision making
 * Part of god object decomposition (Day 3-5)
 */

import { EventEmitter } from 'events';

export interface Hypothesis {
  id: string;
  statement: string;
  probability: number; // 0-1
  evidence: Evidence[];
  supportingArguments: Argument[];
  counterArguments: Argument[];
  confidence: number; // 0-1
  lastUpdated: Date;
}

export interface Evidence {
  id: string;
  source: string;
  type: 'empirical' | 'theoretical' | 'anecdotal' | 'expert';
  strength: number; // 0-1
  relevance: number; // 0-1
  description: string;
  timestamp: Date;
}

export interface Argument {
  id: string;
  premise: string[];
  conclusion: string;
  type: 'deductive' | 'inductive' | 'abductive';
  strength: number; // 0-1
  fallacies: string[];
}

export interface BeliefState {
  hypothesis: Hypothesis;
  priorProbability: number;
  posteriorProbability: number;
  updateReason: string;
  timestamp: Date;
}

export class ReasoningCore extends EventEmitter {
  /**
   * Core logic for rationalist reasoning.
   *
   * Extracted from RationalistReasoningEngine (1,061 LOC -> ~200 LOC component).
   * Handles:
   * - Hypothesis formation and testing
   * - Bayesian belief updating
   * - Evidence evaluation
   * - Argument analysis
   * - Logical consistency checking
   */

  private hypotheses: Map<string, Hypothesis>;
  private beliefHistory: Map<string, BeliefState[]>;
  private evidenceBase: Map<string, Evidence>;
  private logicalConstraints: Set<(h: Hypothesis) => boolean>;
  private defaultPrior: number = 0.5;

  constructor() {
    super();

    this.hypotheses = new Map();
    this.beliefHistory = new Map();
    this.evidenceBase = new Map();
    this.logicalConstraints = new Set();

    this.initializeConstraints();
  }

  private initializeConstraints(): void {
    // Add basic logical constraints
    this.addConstraint((h) => h.probability >= 0 && h.probability <= 1);
    this.addConstraint((h) => h.confidence >= 0 && h.confidence <= 1);
    this.addConstraint((h) => h.evidence.length > 0 || h.probability === this.defaultPrior);
  }

  formHypothesis(statement: string, initialProbability?: number): Hypothesis {
    const hypothesis: Hypothesis = {
      id: this.generateId('hypothesis'),
      statement,
      probability: initialProbability || this.defaultPrior,
      evidence: [],
      supportingArguments: [],
      counterArguments: [],
      confidence: initialProbability ? 0.5 : 0.1,
      lastUpdated: new Date()
    };

    this.hypotheses.set(hypothesis.id, hypothesis);

    // Initialize belief history
    this.beliefHistory.set(hypothesis.id, [{
      hypothesis,
      priorProbability: this.defaultPrior,
      posteriorProbability: hypothesis.probability,
      updateReason: 'Initial hypothesis formation',
      timestamp: new Date()
    }]);

    this.emit('hypothesisFormed', hypothesis);
    return hypothesis;
  }

  addEvidence(hypothesisId: string, evidence: Omit<Evidence, 'id' | 'timestamp'>): void {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis ${hypothesisId} not found`);
    }

    const fullEvidence: Evidence = {
      ...evidence,
      id: this.generateId('evidence'),
      timestamp: new Date()
    };

    // Store evidence
    this.evidenceBase.set(fullEvidence.id, fullEvidence);
    hypothesis.evidence.push(fullEvidence);

    // Update belief based on evidence
    this.updateBelief(hypothesis, fullEvidence);

    this.emit('evidenceAdded', { hypothesis, evidence: fullEvidence });
  }

  private updateBelief(hypothesis: Hypothesis, evidence: Evidence): void {
    const priorProbability = hypothesis.probability;

    // Bayesian update
    const likelihoodRatio = this.calculateLikelihoodRatio(evidence);
    const posteriorOdds = (priorProbability / (1 - priorProbability)) * likelihoodRatio;
    const posteriorProbability = posteriorOdds / (1 + posteriorOdds);

    // Apply evidence strength and relevance
    const adjustedPosterior = this.adjustProbability(
      posteriorProbability,
      evidence.strength,
      evidence.relevance
    );

    hypothesis.probability = adjustedPosterior;
    hypothesis.lastUpdated = new Date();

    // Update confidence based on evidence quality
    hypothesis.confidence = this.updateConfidence(hypothesis);

    // Record belief update
    const beliefState: BeliefState = {
      hypothesis,
      priorProbability,
      posteriorProbability: adjustedPosterior,
      updateReason: `Evidence from ${evidence.source}`,
      timestamp: new Date()
    };

    this.beliefHistory.get(hypothesis.id)?.push(beliefState);

    this.emit('beliefUpdated', beliefState);
  }

  private calculateLikelihoodRatio(evidence: Evidence): number {
    // Simplified likelihood calculation based on evidence type and strength
    const typeWeights = {
      'empirical': 2.0,
      'theoretical': 1.5,
      'expert': 1.3,
      'anecdotal': 0.8
    };

    const baseRatio = typeWeights[evidence.type] || 1.0;
    return baseRatio * (1 + evidence.strength);
  }

  private adjustProbability(probability: number, strength: number, relevance: number): number {
    // Weight the update by evidence quality
    const weight = strength * relevance;
    const adjusted = (probability * weight) + (this.defaultPrior * (1 - weight));

    // Ensure within bounds
    return Math.max(0.01, Math.min(0.99, adjusted));
  }

  private updateConfidence(hypothesis: Hypothesis): number {
    if (hypothesis.evidence.length === 0) {
      return 0.1;
    }

    // Calculate confidence based on evidence quality and consistency
    const avgStrength = hypothesis.evidence.reduce((sum, e) => sum + e.strength, 0) / hypothesis.evidence.length;
    const avgRelevance = hypothesis.evidence.reduce((sum, e) => sum + e.relevance, 0) / hypothesis.evidence.length;

    // Check for contradictory evidence
    const hasContradictions = this.hasContradictoryEvidence(hypothesis);
    const contradictionPenalty = hasContradictions ? 0.3 : 0;

    const confidence = Math.max(0.1, Math.min(0.95,
      (avgStrength * 0.5 + avgRelevance * 0.5) - contradictionPenalty
    ));

    return confidence;
  }

  private hasContradictoryEvidence(hypothesis: Hypothesis): boolean {
    // Simple check for evidence pointing in different directions
    const strengths = hypothesis.evidence.map(e => e.strength);
    const variance = this.calculateVariance(strengths);
    return variance > 0.3;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  }

  addArgument(
    hypothesisId: string,
    argument: Omit<Argument, 'id'>,
    supporting: boolean = true
  ): void {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis ${hypothesisId} not found`);
    }

    const fullArgument: Argument = {
      ...argument,
      id: this.generateId('argument')
    };

    if (supporting) {
      hypothesis.supportingArguments.push(fullArgument);
    } else {
      hypothesis.counterArguments.push(fullArgument);
    }

    // Adjust probability based on argument strength
    const adjustment = fullArgument.strength * (supporting ? 0.1 : -0.1);
    hypothesis.probability = Math.max(0.01, Math.min(0.99, hypothesis.probability + adjustment));

    this.emit('argumentAdded', { hypothesis, argument: fullArgument, supporting });
  }

  evaluateConsistency(hypothesisId: string): { consistent: boolean; violations: string[] } {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis ${hypothesisId} not found`);
    }

    const violations: string[] = [];

    // Check logical constraints
    for (const constraint of this.logicalConstraints) {
      if (!constraint(hypothesis)) {
        violations.push('Logical constraint violation');
      }
    }

    // Check for circular reasoning
    if (this.hasCircularReasoning(hypothesis)) {
      violations.push('Circular reasoning detected');
    }

    // Check for known fallacies
    const fallacies = this.detectFallacies(hypothesis);
    violations.push(...fallacies);

    return {
      consistent: violations.length === 0,
      violations
    };
  }

  private hasCircularReasoning(hypothesis: Hypothesis): boolean {
    // Check if conclusion appears in premises
    for (const arg of hypothesis.supportingArguments) {
      if (arg.premise.includes(arg.conclusion)) {
        return true;
      }
    }
    return false;
  }

  private detectFallacies(hypothesis: Hypothesis): string[] {
    const fallacies: string[] = [];

    for (const arg of [...hypothesis.supportingArguments, ...hypothesis.counterArguments]) {
      fallacies.push(...arg.fallacies);
    }

    return fallacies;
  }

  addConstraint(constraint: (h: Hypothesis) => boolean): void {
    this.logicalConstraints.add(constraint);
  }

  getHypothesis(id: string): Hypothesis | undefined {
    return this.hypotheses.get(id);
  }

  getAllHypotheses(): Hypothesis[] {
    return Array.from(this.hypotheses.values());
  }

  getBeliefHistory(hypothesisId: string): BeliefState[] {
    return this.beliefHistory.get(hypothesisId) || [];
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getMetrics(): any {
    return {
      totalHypotheses: this.hypotheses.size,
      totalEvidence: this.evidenceBase.size,
      averageConfidence: this.calculateAverageConfidence(),
      constraints: this.logicalConstraints.size
    };
  }

  private calculateAverageConfidence(): number {
    const hypotheses = Array.from(this.hypotheses.values());
    if (hypotheses.length === 0) return 0;
    return hypotheses.reduce((sum, h) => sum + h.confidence, 0) / hypotheses.length;
  }
}