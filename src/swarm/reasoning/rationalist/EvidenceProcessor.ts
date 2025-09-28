/**
 * EvidenceProcessor - Evidence collection and validation for rationalist reasoning
 *
 * Handles evidence gathering, reliability assessment, and Bayesian updates
 * with NASA Rule 10 compliance and FSM-based state management.
 *
 * @version 1.0.0
 * @nasa_compliant true
 * @max_function_lines 60
 * @component RationalistReasoningEngine decomposition
 */

import { MegaTransitionHub, MegaState, MegaEvent, MegaStateContext } from '../../../shared/mega-fsm/MegaTransitionHub';
import { ComponentConfig, ProcessInput, ProcessResult } from '../../../shared/mega-fsm/types/MegaDecompositionTypes';

// NASA Rule 10: Fixed bounds constants
const MAX_EVIDENCE_ITEMS = 500;
const MAX_EVIDENCE_SOURCES = 100;
const MAX_CONTRADICTIONS = 50;
const MAX_RELIABILITY_CHECKS = 20;

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

export interface EvidenceAssessment {
  evidenceId: string;
  reliabilityScore: number;
  biasFactors: string[];
  sourceCredibility: number;
  independentVerification: boolean;
  consistencyScore: number;
  recommendations: string[];
}

/**
 * EvidenceProcessor manages evidence collection and validation
 * NASA Rule 10: All functions ≤60 lines, no recursion, bounded operations
 */
export class EvidenceProcessor {
  private transitionHub: MegaTransitionHub;
  private evidenceStore: Map<string, Evidence> = new Map();
  private reliabilityCache: Map<string, number> = new Map();
  private sourceCredibility: Map<string, number> = new Map();

  constructor(transitionHub: MegaTransitionHub) {
    this.transitionHub = transitionHub;
    this.initializeProcessor();
    this.validateConfiguration();
  }

  /**
   * Process and validate evidence
   * NASA Rule 10: Fixed bounds, assertions for safety
   */
  public processEvidence(evidence: Omit<Evidence, 'id' | 'timestamp'>): Evidence {
    // NASA Rule 10: Input validation assertions
    console.assert(evidence.content.length > 0, 'Evidence content cannot be empty');
    console.assert(evidence.reliability >= 0 && evidence.reliability <= 1, 'Reliability must be 0-1');
    console.assert(this.evidenceStore.size < MAX_EVIDENCE_ITEMS, 'Evidence store at capacity');

    const processedEvidence: Evidence = {
      ...evidence,
      id: this.generateEvidenceId(),
      timestamp: new Date(),
      weight: this.calculateEvidenceWeight(evidence),
      reliability: this.assessReliability(evidence)
    };

    // Validate evidence consistency
    this.validateConsistency(processedEvidence);

    // Store evidence
    this.evidenceStore.set(processedEvidence.id, processedEvidence);

    return processedEvidence;
  }

  /**
   * Assess evidence reliability
   * NASA Rule 10: Bounded assessment with fixed limits
   */
  private assessReliability(evidence: Omit<Evidence, 'id' | 'timestamp'>): number {
    let reliabilityScore = evidence.reliability;

    // Check source credibility
    const sourceCredibility = this.sourceCredibility.get(evidence.source) || 0.5;
    reliabilityScore = (reliabilityScore + sourceCredibility) / 2;

    // Apply type-based adjustments
    const typeMultipliers = {
      'empirical': 1.0,
      'statistical': 0.9,
      'logical': 0.8,
      'testimonial': 0.6,
      'observational': 0.7
    };

    reliabilityScore *= typeMultipliers[evidence.type] || 0.5;

    // Cache result
    this.reliabilityCache.set(evidence.source, reliabilityScore);

    return Math.max(0, Math.min(1, reliabilityScore));
  }

  /**
   * Calculate evidence weight based on multiple factors
   * NASA Rule 10: Simple calculation with bounds
   */
  private calculateEvidenceWeight(evidence: Omit<Evidence, 'id' | 'timestamp'>): number {
    let weight = evidence.confidence * evidence.reliability;

    // Adjust for recency (newer evidence gets slight boost)
    const hoursSinceCreation = 0; // New evidence
    const recencyBoost = Math.max(0, 1 - hoursSinceCreation / (24 * 7)); // Week decay
    weight *= (1 + recencyBoost * 0.1);

    return Math.max(0, Math.min(1, weight));
  }

  /**
   * Validate evidence consistency with existing evidence
   * NASA Rule 10: Bounded consistency checking
   */
  private validateConsistency(evidence: Evidence): void {
    const contradictoryEvidence: string[] = [];
    const supportingEvidence: string[] = [];

    // NASA Rule 10: Bounded loop for consistency checking
    let checkCount = 0;
    for (const [existingId, existingEvidence] of this.evidenceStore) {
      if (checkCount >= MAX_RELIABILITY_CHECKS) break;

      const consistency = this.calculateConsistency(evidence, existingEvidence);

      if (consistency < -0.5) {
        contradictoryEvidence.push(existingId);
      } else if (consistency > 0.5) {
        supportingEvidence.push(existingId);
      }

      checkCount++;
    }

    // Update evidence relationships
    evidence.contradicts = contradictoryEvidence.slice(0, MAX_CONTRADICTIONS);
    evidence.supports = supportingEvidence.slice(0, MAX_CONTRADICTIONS);
  }

  /**
   * Calculate consistency between two pieces of evidence
   * NASA Rule 10: Simple consistency calculation
   */
  private calculateConsistency(evidence1: Evidence, evidence2: Evidence): number {
    // Simplified consistency calculation
    if (evidence1.type === evidence2.type && evidence1.source === evidence2.source) {
      return 0.8; // High consistency from same source/type
    }

    if (evidence1.content.includes(evidence2.content.substring(0, 50))) {
      return 0.6; // Content similarity
    }

    return 0; // Neutral consistency
  }

  /**
   * Update Bayesian probability based on new evidence
   * NASA Rule 10: Bounded Bayesian calculation
   */
  public updateBayesianProbability(
    priorProbability: number,
    evidenceId: string,
    likelihoodGivenHypothesis: number,
    likelihoodGivenNotHypothesis: number
  ): number {
    // NASA Rule 10: Input validation
    console.assert(priorProbability >= 0 && priorProbability <= 1, 'Prior probability out of range');
    console.assert(likelihoodGivenHypothesis >= 0 && likelihoodGivenHypothesis <= 1, 'Likelihood out of range');

    const evidence = this.evidenceStore.get(evidenceId);
    if (!evidence) {
      return priorProbability; // No change if evidence not found
    }

    // Bayes' theorem calculation
    const numerator = likelihoodGivenHypothesis * priorProbability;
    const denominator = (likelihoodGivenHypothesis * priorProbability) +
                       (likelihoodGivenNotHypothesis * (1 - priorProbability));

    if (denominator === 0) {
      return priorProbability; // Avoid division by zero
    }

    const posteriorProbability = numerator / denominator;

    // Apply evidence weight
    const weightedPosterior = (posteriorProbability * evidence.weight) +
                             (priorProbability * (1 - evidence.weight));

    return Math.max(0, Math.min(1, weightedPosterior));
  }

  /**
   * Generate comprehensive evidence assessment
   * NASA Rule 10: Bounded assessment generation
   */
  public assessEvidence(evidenceId: string): EvidenceAssessment | null {
    const evidence = this.evidenceStore.get(evidenceId);
    if (!evidence) {
      return null;
    }

    const assessment: EvidenceAssessment = {
      evidenceId,
      reliabilityScore: evidence.reliability,
      biasFactors: this.identifyBiasFactors(evidence),
      sourceCredibility: this.sourceCredibility.get(evidence.source) || 0.5,
      independentVerification: evidence.supports.length > 0,
      consistencyScore: this.calculateOverallConsistency(evidence),
      recommendations: this.generateRecommendations(evidence)
    };

    return assessment;
  }

  /**
   * Helper methods with NASA Rule 10 compliance
   */
  private identifyBiasFactors(evidence: Evidence): string[] {
    const biases: string[] = [];

    if (evidence.type === 'testimonial') {
      biases.push('confirmation-bias');
    }

    if (evidence.reliability < 0.3) {
      biases.push('low-reliability-source');
    }

    if (evidence.contradicts.length > evidence.supports.length * 2) {
      biases.push('contradictory-evidence');
    }

    return biases.slice(0, 10); // Bounded result
  }

  private calculateOverallConsistency(evidence: Evidence): number {
    const supportWeight = evidence.supports.length * 0.1;
    const contradictWeight = evidence.contradicts.length * -0.1;
    return Math.max(0, Math.min(1, 0.5 + supportWeight + contradictWeight));
  }

  private generateRecommendations(evidence: Evidence): string[] {
    const recommendations: string[] = [];

    if (evidence.reliability < 0.5) {
      recommendations.push('Seek additional verification');
    }

    if (evidence.contradicts.length > 3) {
      recommendations.push('Investigate contradictory evidence');
    }

    if (evidence.supports.length > 5) {
      recommendations.push('Strong supporting evidence available');
    }

    return recommendations.slice(0, 5); // Bounded result
  }

  private generateEvidenceId(): string {
    return `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeProcessor(): void {
    // Initialize default source credibility scores
    this.sourceCredibility.set('peer-reviewed', 0.9);
    this.sourceCredibility.set('expert-testimony', 0.8);
    this.sourceCredibility.set('direct-observation', 0.7);
    this.sourceCredibility.set('secondary-source', 0.6);
    this.sourceCredibility.set('anecdotal', 0.3);
  }

  /**
   * Get evidence by ID
   */
  public getEvidence(evidenceId: string): Evidence | null {
    return this.evidenceStore.get(evidenceId) || null;
  }

  /**
   * Get all evidence
   */
  public getAllEvidence(): Evidence[] {
    return Array.from(this.evidenceStore.values());
  }

  /**
   * Clear evidence store
   */
  public clearEvidence(): void {
    this.evidenceStore.clear();
    this.reliabilityCache.clear();
  }

  /**
   * Validate configuration with NASA Rule 10 assertions
   */
  private validateConfiguration(): void {
    console.assert(MAX_EVIDENCE_ITEMS > 0, 'Maximum evidence items must be positive');
    console.assert(MAX_EVIDENCE_SOURCES > 0, 'Maximum evidence sources must be positive');
    console.assert(MAX_CONTRADICTIONS > 0, 'Maximum contradictions must be positive');
  }
}