/**
 * HypothesisEngine - Hypothesis generation and testing for rationalist reasoning
 *
 * Handles hypothesis creation, testing, and systematic evaluation
 * with NASA Rule 10 compliance and FSM-based state management.
 *
 * @version 1.0.0
 * @nasa_compliant true
 * @max_function_lines 60
 * @component RationalistReasoningEngine decomposition
 */

import { MegaTransitionHub, MegaState, MegaEvent, MegaStateContext } from '../../../shared/mega-fsm/MegaTransitionHub';
import { ComponentConfig, ProcessInput, ProcessResult } from '../../../shared/mega-fsm/types/MegaDecompositionTypes';
import { Evidence } from './EvidenceProcessor';

// NASA Rule 10: Fixed bounds constants
const MAX_HYPOTHESES = 100;
const MAX_PREDICTIONS_PER_HYPOTHESIS = 20;
const MAX_ALTERNATIVES = 10;
const MAX_TESTING_ITERATIONS = 50;

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

export interface Prediction {
  id: string;
  description: string;
  hypothesisId: string;
  probability: number;
  timeframe: string;
  testable: boolean;
  outcome?: 'confirmed' | 'refuted' | 'pending';
  evidence?: Evidence[];
  confidence: number;
}

export interface HypothesisTest {
  testId: string;
  hypothesisId: string;
  testType: 'prediction' | 'experiment' | 'observation' | 'logical';
  description: string;
  methodology: string;
  expectedResults: any;
  actualResults?: any;
  status: 'planned' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  confidence: number;
}

/**
 * HypothesisEngine manages hypothesis lifecycle and testing
 * NASA Rule 10: All functions ≤60 lines, no recursion, bounded operations
 */
export class HypothesisEngine {
  private transitionHub: MegaTransitionHub;
  private hypotheses: Map<string, Hypothesis> = new Map();
  private activeTests: Map<string, HypothesisTest> = new Map();
  private testHistory: Map<string, HypothesisTest[]> = new Map();

  constructor(transitionHub: MegaTransitionHub) {
    this.transitionHub = transitionHub;
    this.validateConfiguration();
  }

  /**
   * Generate hypothesis from observations
   * NASA Rule 10: Fixed bounds, assertions for safety
   */
  public generateHypothesis(
    description: string,
    priorProbability: number,
    evidence: Evidence[] = [],
    complexity: number = 1
  ): Hypothesis {
    // NASA Rule 10: Input validation assertions
    console.assert(description.length > 0, 'Hypothesis description cannot be empty');
    console.assert(priorProbability >= 0 && priorProbability <= 1, 'Prior probability out of range');
    console.assert(this.hypotheses.size < MAX_HYPOTHESES, 'Hypothesis store at capacity');

    const hypothesis: Hypothesis = {
      id: this.generateHypothesisId(),
      description,
      probability: priorProbability,
      evidence: evidence.slice(0, 50), // Bounded evidence
      predictions: [],
      testable: this.assessTestability(description),
      falsifiable: this.assessFalsifiability(description),
      complexity,
      status: 'proposed',
      confidence: this.calculateInitialConfidence(priorProbability, evidence),
      lastUpdated: new Date(),
      alternatives: []
    };

    // Generate initial predictions
    hypothesis.predictions = this.generatePredictions(hypothesis);

    this.hypotheses.set(hypothesis.id, hypothesis);

    return hypothesis;
  }

  /**
   * Test hypothesis using available evidence
   * NASA Rule 10: Fixed bounds, systematic testing
   */
  public async testHypothesis(hypothesisId: string): Promise<HypothesisTest> {
    // NASA Rule 10: Input validation
    console.assert(hypothesisId.length > 0, 'Hypothesis ID cannot be empty');
    console.assert(this.activeTests.size < 20, 'Too many active tests');

    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis not found: ${hypothesisId}`);
    }

    const test: HypothesisTest = {
      testId: this.generateTestId(),
      hypothesisId,
      testType: 'prediction',
      description: `Test predictions of hypothesis: ${hypothesis.description}`,
      methodology: 'prediction-validation',
      expectedResults: hypothesis.predictions,
      status: 'running',
      startTime: new Date(),
      confidence: 0.8
    };

    this.activeTests.set(test.testId, test);

    try {
      // Execute test
      test.actualResults = await this.executePredictionTest(hypothesis);
      test.status = 'completed';
      test.endTime = new Date();

      // Update hypothesis based on test results
      await this.updateHypothesisFromTest(hypothesis, test);

      return test;
    } catch (error) {
      test.status = 'failed';
      test.endTime = new Date();
      test.actualResults = { error: error instanceof Error ? error.message : 'Unknown error' };

      throw error;
    } finally {
      this.recordTestHistory(test);
      this.activeTests.delete(test.testId);
    }
  }

  /**
   * Update hypothesis probability based on new evidence
   * NASA Rule 10: Bounded probability updates
   */
  public updateHypothesisProbability(hypothesisId: string, newEvidence: Evidence[]): boolean {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      return false;
    }

    // Add new evidence with bounds
    const boundedEvidence = newEvidence.slice(0, 10);
    hypothesis.evidence.push(...boundedEvidence);

    // Keep evidence within bounds
    if (hypothesis.evidence.length > 50) {
      hypothesis.evidence = hypothesis.evidence.slice(-50);
    }

    // Recalculate probability
    const supportingEvidence = this.countSupportingEvidence(hypothesis);
    const contradictingEvidence = this.countContradictingEvidence(hypothesis);

    const evidenceRatio = supportingEvidence / Math.max(1, supportingEvidence + contradictingEvidence);
    hypothesis.posteriorProbability = (hypothesis.probability + evidenceRatio) / 2;

    // Update status based on probability
    hypothesis.status = this.determineHypothesisStatus(hypothesis.posteriorProbability || hypothesis.probability);
    hypothesis.confidence = this.calculateConfidence(hypothesis);
    hypothesis.lastUpdated = new Date();

    return true;
  }

  /**
   * Generate predictions from hypothesis
   * NASA Rule 10: Bounded prediction generation
   */
  private generatePredictions(hypothesis: Hypothesis): Prediction[] {
    const predictions: Prediction[] = [];

    // Generate basic predictions based on hypothesis type
    const baseDescriptions = [
      'If hypothesis is true, observable outcome A should occur',
      'If hypothesis is true, measurable metric B should change',
      'If hypothesis is true, behavior C should be observed'
    ];

    // NASA Rule 10: Bounded loop with fixed maximum iterations
    for (let i = 0; i < Math.min(baseDescriptions.length, MAX_PREDICTIONS_PER_HYPOTHESIS); i++) {
      const prediction: Prediction = {
        id: `pred-${hypothesis.id}-${i}`,
        description: baseDescriptions[i],
        hypothesisId: hypothesis.id,
        probability: hypothesis.probability * 0.8, // Slightly lower than hypothesis
        timeframe: '1-week',
        testable: true,
        confidence: 0.7
      };

      predictions.push(prediction);
    }

    return predictions;
  }

  /**
   * Execute prediction test
   * NASA Rule 10: Simple test execution with bounds
   */
  private async executePredictionTest(hypothesis: Hypothesis): Promise<any> {
    const results = {
      predictionsCorrect: 0,
      predictionsTotal: hypothesis.predictions.length,
      averageConfidence: 0,
      supportingEvidence: 0,
      contradictingEvidence: 0
    };

    // Simulate testing predictions
    for (let i = 0; i < Math.min(hypothesis.predictions.length, MAX_PREDICTIONS_PER_HYPOTHESIS); i++) {
      const prediction = hypothesis.predictions[i];

      // Simulate prediction outcome
      const outcomeCorrect = Math.random() < prediction.probability;

      if (outcomeCorrect) {
        results.predictionsCorrect++;
        prediction.outcome = 'confirmed';
      } else {
        prediction.outcome = 'refuted';
      }

      results.averageConfidence += prediction.confidence;
    }

    results.averageConfidence /= Math.max(1, hypothesis.predictions.length);
    results.supportingEvidence = this.countSupportingEvidence(hypothesis);
    results.contradictingEvidence = this.countContradictingEvidence(hypothesis);

    return results;
  }

  /**
   * Update hypothesis based on test results
   * NASA Rule 10: Simple update logic
   */
  private async updateHypothesisFromTest(hypothesis: Hypothesis, test: HypothesisTest): Promise<void> {
    if (test.actualResults && test.actualResults.predictionsCorrect !== undefined) {
      const successRate = test.actualResults.predictionsCorrect / test.actualResults.predictionsTotal;

      // Update probability based on test success
      if (successRate > 0.7) {
        hypothesis.posteriorProbability = Math.min(1, (hypothesis.probability + successRate) / 2);
        hypothesis.status = 'supported';
      } else if (successRate < 0.3) {
        hypothesis.posteriorProbability = Math.max(0, hypothesis.probability * successRate);
        hypothesis.status = 'refuted';
      } else {
        hypothesis.status = 'uncertain';
      }

      hypothesis.confidence = this.calculateConfidence(hypothesis);
      hypothesis.lastUpdated = new Date();
    }
  }

  /**
   * Helper methods with NASA Rule 10 compliance
   */
  private assessTestability(description: string): boolean {
    const testableKeywords = ['measure', 'observe', 'predict', 'compare', 'verify'];
    return testableKeywords.some(keyword => description.toLowerCase().includes(keyword));
  }

  private assessFalsifiability(description: string): boolean {
    const falsifiableKeywords = ['if', 'when', 'should', 'will', 'expected'];
    return falsifiableKeywords.some(keyword => description.toLowerCase().includes(keyword));
  }

  private calculateInitialConfidence(probability: number, evidence: Evidence[]): number {
    const evidenceWeight = Math.min(1, evidence.length / 10);
    return (probability + evidenceWeight) / 2;
  }

  private countSupportingEvidence(hypothesis: Hypothesis): number {
    return hypothesis.evidence.filter(e => e.supports.includes(hypothesis.id)).length;
  }

  private countContradictingEvidence(hypothesis: Hypothesis): number {
    return hypothesis.evidence.filter(e => e.contradicts.includes(hypothesis.id)).length;
  }

  private determineHypothesisStatus(probability: number): Hypothesis['status'] {
    if (probability > 0.8) return 'supported';
    if (probability < 0.2) return 'refuted';
    return 'uncertain';
  }

  private calculateConfidence(hypothesis: Hypothesis): number {
    const evidenceCount = hypothesis.evidence.length;
    const predictionAccuracy = hypothesis.predictions.filter(p => p.outcome === 'confirmed').length /
                              Math.max(1, hypothesis.predictions.length);

    return Math.min(1, (evidenceCount / 10 + predictionAccuracy) / 2);
  }

  private generateHypothesisId(): string {
    return `hyp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private recordTestHistory(test: HypothesisTest): void {
    const history = this.testHistory.get(test.hypothesisId) || [];
    history.push(test);

    // NASA Rule 10: Bounded history size
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }

    this.testHistory.set(test.hypothesisId, history);
  }

  /**
   * Get hypothesis by ID
   */
  public getHypothesis(hypothesisId: string): Hypothesis | null {
    return this.hypotheses.get(hypothesisId) || null;
  }

  /**
   * Get all hypotheses
   */
  public getAllHypotheses(): Hypothesis[] {
    return Array.from(this.hypotheses.values());
  }

  /**
   * Get active tests
   */
  public getActiveTests(): HypothesisTest[] {
    return Array.from(this.activeTests.values());
  }

  /**
   * Validate configuration with NASA Rule 10 assertions
   */
  private validateConfiguration(): void {
    console.assert(MAX_HYPOTHESES > 0, 'Maximum hypotheses must be positive');
    console.assert(MAX_PREDICTIONS_PER_HYPOTHESIS > 0, 'Maximum predictions per hypothesis must be positive');
    console.assert(MAX_ALTERNATIVES > 0, 'Maximum alternatives must be positive');
  }
}