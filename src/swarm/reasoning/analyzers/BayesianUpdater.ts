/**
 * Bayesian Update Analyzer
 * Implements Bayesian reasoning for belief and hypothesis updates
 */

import { Evidence, Belief, Hypothesis } from '../types/ReasoningTypes';

export class BayesianUpdater {
  /**
   * Perform Bayesian update on hypothesis with evidence
   */
  updateHypothesis(hypothesis: Hypothesis, evidence: Evidence[]): UpdateResult {
    let posteriorProbability = hypothesis.probability;
    let confidence = 0.5;
    let uncertainty = 0.3;

    for (const ev of evidence) {
      const likelihood = this.calculateLikelihood(ev, hypothesis.description);
      posteriorProbability = this.bayesianUpdate(
        posteriorProbability, 
        likelihood, 
        ev.weight
      );
    }

    confidence = this.calculateConfidence(evidence, posteriorProbability);
    uncertainty = 1 - confidence;

    return {
      posteriorProbability,
      confidence,
      uncertainty,
      evidenceCount: evidence.length
    };
  }

  /**
   * Update belief credence using Bayesian reasoning
   */
  updateBelief(belief: Belief, evidence: Evidence): number {
    const likelihood = this.calculateLikelihoodForBelief(evidence, belief);
    return this.bayesianUpdate(belief.credence, likelihood, evidence.weight);
  }

  /**
   * Calculate likelihood of evidence given proposition
   */
  calculateLikelihood(evidence: Evidence, proposition: string): number {
    if (evidence.supports.includes(proposition) ||
        evidence.content.toLowerCase().includes(proposition.toLowerCase())) {
      return 0.8;
    }
    
    if (evidence.contradicts.includes(proposition)) {
      return 0.2;
    }
    
    return 0.5;
  }

  /**
   * Core Bayesian update formula
   */
  private bayesianUpdate(
    prior: number, 
    likelihood: number, 
    weight: number = 1
  ): number {
    const weightedLikelihood = likelihood * weight;
    const numerator = prior * weightedLikelihood;
    const denominator = numerator + ((1 - prior) * (1 - weightedLikelihood));
    
    return Math.max(0.01, Math.min(0.99, numerator / denominator));
  }

  private calculateLikelihoodForBelief(evidence: Evidence, belief: Belief): number {
    if (evidence.supports.includes(belief.proposition) ||
        evidence.content.toLowerCase().includes(belief.proposition.toLowerCase())) {
      return 0.8;
    }
    
    if (evidence.contradicts.includes(belief.proposition)) {
      return 0.2;
    }
    
    return 0.5;
  }

  private calculateConfidence(evidence: Evidence[], posterior: number): number {
    const evidenceQuality = evidence.reduce((sum, e) => sum + e.reliability, 0) / evidence.length;
    const evidenceQuantity = Math.min(1, evidence.length / 10);
    
    return Math.min(0.95, 0.3 + (evidenceQuantity * 0.3) + (evidenceQuality * 0.4));
  }
}

interface UpdateResult {
  posteriorProbability: number;
  confidence: number;
  uncertainty: number;
  evidenceCount: number;
}

export default BayesianUpdater;

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T15:35:00-04:00 | codex@Model | Create Bayesian updater analyzer | BayesianUpdater.ts | OK | <=60 lines per method | 0.00 | 1a6b7e9 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: bayesian-analyzer-001
- inputs: ["RationalistReasoningEngine.ts"]
- tools_used: ["MultiEdit"]
- versions: {"model":"codex","prompt":"v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->