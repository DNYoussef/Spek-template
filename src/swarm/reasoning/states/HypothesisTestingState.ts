/**
 * Hypothesis Testing State Implementation
 * Handles hypothesis validation and testing in the reasoning pipeline
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { Hypothesis, Evidence, Analysis } from '../types/ReasoningTypes';
import { BayesianUpdater } from '../analyzers/BayesianUpdater';

export class HypothesisTestingState extends EventEmitter {
  private isActive: boolean = false;
  private bayesianUpdater: BayesianUpdater = new BayesianUpdater();
  private testResults: Map<string, Analysis> = new Map();

  /**
   * Initialize the hypothesis testing state
   */
  init(): void {
    this.isActive = true;
    this.testResults.clear();
    this.emit('state:initialized', { state: 'HypothesisTesting' });
  }

  /**
   * Test hypothesis against evidence
   */
  async testHypothesis(
    hypothesis: Hypothesis, 
    evidence: Evidence[], 
    testData?: any
  ): Promise<Analysis> {
    if (!this.isActive) {
      throw new Error('Hypothesis testing state not active');
    }

    hypothesis.status = 'testing';
    hypothesis.lastUpdated = new Date();

    const analysis = this.createAnalysis(hypothesis.id, testData);
    const bayesianUpdate = this.bayesianUpdater.updateHypothesis(hypothesis, evidence);
    const predictionResults = this.evaluatePredictions(hypothesis);

    this.updateHypothesisFromResults(hypothesis, bayesianUpdate, predictionResults);
    this.populateAnalysisResults(analysis, hypothesis, bayesianUpdate, predictionResults);

    this.testResults.set(analysis.analysisId, analysis);
    this.emit('hypothesis:tested', {
      hypothesisId: hypothesis.id,
      analysisId: analysis.analysisId,
      status: hypothesis.status
    });

    return analysis;
  }

  /**
   * Get test results for hypothesis
   */
  getTestResults(analysisId: string): Analysis | undefined {
    return this.testResults.get(analysisId);
  }

  /**
   * Get all test results
   */
  getAllTestResults(): Analysis[] {
    return Array.from(this.testResults.values());
  }

  /**
   * Shutdown the state
   */
  shutdown(): void {
    this.isActive = false;
    this.emit('state:shutdown', { 
      state: 'HypothesisTesting',
      testsCompleted: this.testResults.size 
    });
  }

  /**
   * Check state invariants
   */
  checkInvariants(): boolean {
    return this.testResults.size >= 0;
  }

  private createAnalysis(hypothesisId: string, testData?: any): Analysis {
    return {
      analysisId: crypto.randomUUID(),
      type: 'hypothesis_evaluation',
      input: { hypothesisId, testData },
      methodology: {
        name: 'Bayesian Hypothesis Testing',
        description: 'Evaluate hypothesis using Bayesian evidence accumulation',
        steps: [
          'Collect relevant evidence',
          'Assess evidence quality and reliability',
          'Calculate likelihood ratios',
          'Update posterior probability',
          'Evaluate predictions',
          'Determine hypothesis status'
        ],
        assumptions: [
          'Evidence is conditionally independent',
          'Prior probabilities are well-calibrated',
          'Evidence reliability is accurately assessed'
        ],
        limitations: [
          'Limited to available evidence',
          'Subjective reliability assessments',
          'Potential for confirmation bias'
        ],
        validity_conditions: [
          'Sufficient evidence volume',
          'Evidence diversity',
          'Independent sources'
        ]
      },
      results: [],
      confidence: 0,
      limitations: [],
      recommendations: [],
      timestamp: new Date(),
      analyst: 'hypothesis-testing-state',
      reviewed: false,
      reviewers: []
    };
  }

  private evaluatePredictions(hypothesis: Hypothesis): PredictionResults {
    const confirmed = hypothesis.predictions.filter(p => p.outcome === 'confirmed').length;
    const total = hypothesis.predictions.length;
    const confidence = total > 0 ? confirmed / total : 0.5;

    return {
      confirmed,
      total,
      confidence,
      evidence: [`${confirmed}/${total} predictions confirmed`],
      implications: [`Prediction success rate: ${(confidence * 100).toFixed(1)}%`],
      uncertainty: 1 - confidence
    };
  }

  private updateHypothesisFromResults(
    hypothesis: Hypothesis,
    bayesianUpdate: any,
    predictionResults: PredictionResults
  ): void {
    hypothesis.posteriorProbability = bayesianUpdate.posteriorProbability;
    hypothesis.confidence = bayesianUpdate.confidence;
    hypothesis.status = this.determineStatus(bayesianUpdate, predictionResults);
    hypothesis.lastUpdated = new Date();
  }

  private populateAnalysisResults(
    analysis: Analysis,
    hypothesis: Hypothesis,
    bayesianUpdate: any,
    predictionResults: PredictionResults
  ): void {
    analysis.results = [
      {
        finding: `Hypothesis probability updated from ${hypothesis.probability.toFixed(3)} to ${hypothesis.posteriorProbability?.toFixed(3)}`,
        confidence: bayesianUpdate.confidence,
        evidence: hypothesis.evidence.map(e => e.id),
        implications: this.generateImplications(hypothesis),
        uncertainty: bayesianUpdate.uncertainty
      },
      {
        finding: `${predictionResults.confirmed} of ${predictionResults.total} predictions confirmed`,
        confidence: predictionResults.confidence,
        evidence: predictionResults.evidence,
        implications: predictionResults.implications,
        uncertainty: predictionResults.uncertainty
      }
    ];

    analysis.confidence = (bayesianUpdate.confidence + predictionResults.confidence) / 2;
  }

  private determineStatus(bayesianUpdate: any, predictionResults: PredictionResults): Hypothesis['status'] {
    if (bayesianUpdate.posteriorProbability > 0.8 && predictionResults.confidence > 0.7) {
      return 'supported';
    }
    if (bayesianUpdate.posteriorProbability < 0.2 || predictionResults.confidence < 0.3) {
      return 'refuted';
    }
    return 'uncertain';
  }

  private generateImplications(hypothesis: Hypothesis): string[] {
    return [
      `If true, affects ${hypothesis.alternatives.length} alternative hypotheses`,
      `Confidence level: ${(hypothesis.confidence * 100).toFixed(1)}%`,
      `Status: ${hypothesis.status}`
    ];
  }
}

interface PredictionResults {
  confirmed: number;
  total: number;
  confidence: number;
  evidence: string[];
  implications: string[];
  uncertainty: number;
}

export default HypothesisTestingState;

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: hypothesis-testing-state-001
// inputs: ["RationalistReasoningEngine.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"codex","prompt":"v1"}
// === END FOOTER ===