/**
 * DecisionMaker - Extracted from RationalistReasoningEngine
 * Makes decisions based on reasoning and evidence
 * Part of god object decomposition (Day 3-5)
 */

import { EventEmitter } from 'events';

export interface Option {
  id: string;
  name: string;
  description: string;
  utility: number;
  probability: number;
  risks: Risk[];
  benefits: Benefit[];
  constraints: Constraint[];
}

export interface Risk {
  description: string;
  probability: number;
  impact: number; // 0-10
  mitigable: boolean;
}

export interface Benefit {
  description: string;
  value: number; // 0-10
  certainty: number; // 0-1
}

export interface Constraint {
  type: 'resource' | 'time' | 'logical' | 'ethical';
  description: string;
  satisfied: boolean;
}

export interface Decision {
  id: string;
  selectedOption: Option;
  alternatives: Option[];
  rationale: string;
  expectedUtility: number;
  confidence: number;
  timestamp: Date;
  criteria: DecisionCriteria;
}

export interface DecisionCriteria {
  weights: {
    utility: number;
    probability: number;
    risk: number;
    constraints: number;
  };
  threshold: number;
  riskTolerance: number;
}

export class DecisionMaker extends EventEmitter {
  /**
   * Makes decisions based on reasoning and evidence.
   *
   * Extracted from RationalistReasoningEngine (1,061 LOC -> ~150 LOC component).
   * Handles:
   * - Decision analysis
   * - Utility calculation
   * - Risk assessment
   * - Multi-criteria decision making
   * - Decision tree construction
   */

  private options: Map<string, Option>;
  private decisions: Map<string, Decision>;
  private defaultCriteria: DecisionCriteria;
  private decisionHistory: Decision[];

  constructor() {
    super();

    this.options = new Map();
    this.decisions = new Map();
    this.decisionHistory = [];

    this.defaultCriteria = {
      weights: {
        utility: 0.4,
        probability: 0.3,
        risk: 0.2,
        constraints: 0.1
      },
      threshold: 0.5,
      riskTolerance: 0.5
    };
  }

  addOption(option: Omit<Option, 'id'>): Option {
    const fullOption: Option = {
      ...option,
      id: this.generateId('option')
    };

    this.options.set(fullOption.id, fullOption);
    this.emit('optionAdded', fullOption);

    return fullOption;
  }

  evaluateOptions(criteria?: Partial<DecisionCriteria>): Map<string, number> {
    const mergedCriteria = { ...this.defaultCriteria, ...criteria };
    const scores = new Map<string, number>();

    for (const option of this.options.values()) {
      const score = this.calculateScore(option, mergedCriteria);
      scores.set(option.id, score);
    }

    this.emit('optionsEvaluated', { scores, criteria: mergedCriteria });
    return scores;
  }

  private calculateScore(option: Option, criteria: DecisionCriteria): number {
    const utilityScore = option.utility * criteria.weights.utility;
    const probabilityScore = option.probability * criteria.weights.probability;
    const riskScore = this.calculateRiskScore(option) * criteria.weights.risk;
    const constraintScore = this.calculateConstraintScore(option) * criteria.weights.constraints;

    const totalScore = utilityScore + probabilityScore - riskScore + constraintScore;

    // Normalize to 0-1
    return Math.max(0, Math.min(1, totalScore));
  }

  private calculateRiskScore(option: Option): number {
    if (option.risks.length === 0) return 0;

    const totalRisk = option.risks.reduce((sum, risk) => {
      const riskValue = risk.probability * (risk.impact / 10);
      const mitigation = risk.mitigable ? 0.5 : 1.0;
      return sum + (riskValue * mitigation);
    }, 0);

    return totalRisk / option.risks.length;
  }

  private calculateConstraintScore(option: Option): number {
    if (option.constraints.length === 0) return 1;

    const satisfiedCount = option.constraints.filter(c => c.satisfied).length;
    return satisfiedCount / option.constraints.length;
  }

  makeDecision(criteria?: Partial<DecisionCriteria>): Decision | null {
    const mergedCriteria = { ...this.defaultCriteria, ...criteria };
    const scores = this.evaluateOptions(mergedCriteria);

    if (scores.size === 0) {
      this.emit('noOptionsAvailable');
      return null;
    }

    // Find best option
    let bestOption: Option | null = null;
    let bestScore = 0;

    for (const [optionId, score] of scores) {
      if (score > bestScore && score >= mergedCriteria.threshold) {
        bestScore = score;
        bestOption = this.options.get(optionId) || null;
      }
    }

    if (!bestOption) {
      this.emit('noViableOptions', { threshold: mergedCriteria.threshold });
      return null;
    }

    // Calculate expected utility
    const expectedUtility = this.calculateExpectedUtility(bestOption);

    // Generate rationale
    const rationale = this.generateRationale(bestOption, bestScore, mergedCriteria);

    const decision: Decision = {
      id: this.generateId('decision'),
      selectedOption: bestOption,
      alternatives: Array.from(this.options.values()).filter(o => o.id !== bestOption!.id),
      rationale,
      expectedUtility,
      confidence: this.calculateConfidence(bestOption, bestScore),
      timestamp: new Date(),
      criteria: mergedCriteria
    };

    this.decisions.set(decision.id, decision);
    this.decisionHistory.push(decision);

    this.emit('decisionMade', decision);
    return decision;
  }

  private calculateExpectedUtility(option: Option): number {
    const baseUtility = option.utility * option.probability;

    // Add benefits
    const benefitValue = option.benefits.reduce((sum, benefit) =>
      sum + (benefit.value * benefit.certainty), 0
    ) / 10;

    // Subtract risks
    const riskCost = option.risks.reduce((sum, risk) =>
      sum + (risk.probability * risk.impact), 0
    ) / 10;

    return Math.max(0, baseUtility + benefitValue - riskCost);
  }

  private generateRationale(option: Option, score: number, criteria: DecisionCriteria): string {
    const reasons: string[] = [];

    reasons.push(`Selected "${option.name}" with score ${(score * 100).toFixed(1)}%`);

    if (option.utility > 0.7) {
      reasons.push(`High utility value (${option.utility.toFixed(2)})`);
    }

    if (option.probability > 0.7) {
      reasons.push(`High probability of success (${(option.probability * 100).toFixed(0)}%)`);
    }

    const satisfiedConstraints = option.constraints.filter(c => c.satisfied).length;
    if (satisfiedConstraints === option.constraints.length) {
      reasons.push('All constraints satisfied');
    }

    if (option.risks.filter(r => r.mitigable).length === option.risks.length) {
      reasons.push('All risks are mitigable');
    }

    return reasons.join('. ');
  }

  private calculateConfidence(option: Option, score: number): number {
    // Base confidence on score
    let confidence = score;

    // Adjust for uncertainty
    const uncertainRisks = option.risks.filter(r => !r.mitigable).length;
    confidence -= uncertainRisks * 0.05;

    // Adjust for constraint violations
    const violatedConstraints = option.constraints.filter(c => !c.satisfied).length;
    confidence -= violatedConstraints * 0.1;

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  compareOptions(optionIds: string[]): {
    comparison: Map<string, any>;
    recommendation: string;
  } {
    const comparison = new Map<string, any>();

    for (const id of optionIds) {
      const option = this.options.get(id);
      if (!option) continue;

      comparison.set(id, {
        name: option.name,
        utility: option.utility,
        probability: option.probability,
        expectedUtility: this.calculateExpectedUtility(option),
        riskLevel: this.calculateRiskScore(option),
        constraintsSatisfied: option.constraints.filter(c => c.satisfied).length,
        totalConstraints: option.constraints.length
      });
    }

    // Generate recommendation
    let bestId = '';
    let bestUtility = 0;

    for (const [id, data] of comparison) {
      if (data.expectedUtility > bestUtility) {
        bestUtility = data.expectedUtility;
        bestId = id;
      }
    }

    const recommendation = bestId ?
      `Recommend option "${comparison.get(bestId).name}" with expected utility ${bestUtility.toFixed(2)}` :
      'No clear recommendation based on current analysis';

    return { comparison, recommendation };
  }

  sensitivityAnalysis(optionId: string, parameter: 'utility' | 'probability' | 'risk'): {
    results: Array<{ value: number; score: number }>;
    breakpoint?: number;
  } {
    const option = this.options.get(optionId);
    if (!option) {
      throw new Error(`Option ${optionId} not found`);
    }

    const results: Array<{ value: number; score: number }> = [];
    const originalValue = option[parameter === 'risk' ? 'risks' : parameter];

    // Test range of values
    for (let value = 0; value <= 1; value += 0.1) {
      // Temporarily modify option
      if (parameter === 'utility') {
        option.utility = value;
      } else if (parameter === 'probability') {
        option.probability = value;
      }

      const score = this.calculateScore(option, this.defaultCriteria);
      results.push({ value, score });
    }

    // Restore original value
    if (parameter === 'utility') {
      option.utility = originalValue as number;
    } else if (parameter === 'probability') {
      option.probability = originalValue as number;
    }

    // Find breakpoint where decision changes
    const threshold = this.defaultCriteria.threshold;
    let breakpoint: number | undefined;

    for (let i = 1; i < results.length; i++) {
      if ((results[i - 1].score < threshold && results[i].score >= threshold) ||
          (results[i - 1].score >= threshold && results[i].score < threshold)) {
        breakpoint = results[i].value;
        break;
      }
    }

    return { results, breakpoint };
  }

  clearOptions(): void {
    this.options.clear();
    this.emit('optionsCleared');
  }

  getDecisionHistory(): Decision[] {
    return [...this.decisionHistory];
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getMetrics(): any {
    return {
      totalOptions: this.options.size,
      totalDecisions: this.decisions.size,
      averageConfidence: this.calculateAverageConfidence(),
      defaultCriteria: this.defaultCriteria
    };
  }

  private calculateAverageConfidence(): number {
    if (this.decisionHistory.length === 0) return 0;
    const sum = this.decisionHistory.reduce((total, d) => total + d.confidence, 0);
    return sum / this.decisionHistory.length;
  }
}