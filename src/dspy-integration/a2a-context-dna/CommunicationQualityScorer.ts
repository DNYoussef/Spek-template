/**
 * Communication Quality Scorer - Real-time quality assessment system
 * NASA Rule 10 Compliant Implementation with bounded metrics validation
 */

import {
  EnhancedMessage,
  QualityMetrics,
  QualityValidation,
  ValidationIssue,
  AgentMessage
} from './interfaces/types';

interface ScoringWeights {
  semantic: number;
  relevance: number;
  clarity: number;
  completeness: number;
}

interface ScoringThresholds {
  minAcceptable: number;
  target: number;
  excellent: number;
}

export class CommunicationQualityScorer {
  private weights: ScoringWeights;
  private thresholds: ScoringThresholds;
  private scoringCache: Map<string, QualityMetrics> = new Map();
  private validationHistory: ValidationIssue[] = [];

  constructor() {
    // Fixed weights for scoring (no dynamic calculation)
    this.weights = {
      semantic: 0.3,
      relevance: 0.3,
      clarity: 0.25,
      completeness: 0.15
    };

    this.thresholds = {
      minAcceptable: 0.6,
      target: 0.8,
      excellent: 0.9
    };

    assert(this.weights.semantic + this.weights.relevance + this.weights.clarity + this.weights.completeness === 1.0, 'Weights must sum to 1.0');
    assert(this.thresholds.minAcceptable < this.thresholds.target, 'Thresholds must be ordered');
    assert(this.thresholds.target < this.thresholds.excellent, 'Thresholds must be ordered');
  }

  /**
   * Main quality scoring entry point
   * NASA Rule 10: Fixed bounds, explicit error handling, assertions
   */
  async scoreMessage(message: EnhancedMessage): Promise<QualityMetrics> {
    assert(message.originalMessage.content.length > 0, 'Message content required');
    assert(message.semanticHash.length > 0, 'Semantic hash required');

    const cacheKey = this.generateScoringCacheKey(message);
    const cached = this.scoringCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Step 1: Score semantic coherence (bounded operation)
      const semanticScore = await this.scoreSemantic(message);
      assert(semanticScore >= 0 && semanticScore <= 1, 'Semantic score must be valid');

      // Step 2: Score context relevance (bounded operation)
      const relevanceScore = await this.scoreRelevance(message);
      assert(relevanceScore >= 0 && relevanceScore <= 1, 'Relevance score must be valid');

      // Step 3: Score action clarity (bounded operation)
      const clarityScore = await this.scoreClarity(message);
      assert(clarityScore >= 0 && clarityScore <= 1, 'Clarity score must be valid');

      // Step 4: Score completeness (bounded operation)
      const completenessScore = await this.scoreCompleteness(message);
      assert(completenessScore >= 0 && completenessScore <= 1, 'Completeness score must be valid');

      // Calculate weighted overall score
      const overall = this.calculateOverallScore(semanticScore, relevanceScore, clarityScore, completenessScore);
      assert(overall >= 0 && overall <= 1, 'Overall score must be valid');

      const qualityMetrics: QualityMetrics = {
        semanticCoherence: semanticScore,
        contextRelevance: relevanceScore,
        actionClarity: clarityScore,
        completeness: completenessScore,
        overallScore: overall
      };

      // Cache with bounded size: maximum 100 entries
      if (this.scoringCache.size < 100) {
        this.scoringCache.set(cacheKey, qualityMetrics);
      }

      return qualityMetrics;

    } catch (error) {
      throw new Error(`Quality scoring failed: ${error.message}`);
    }
  }

  /**
   * Validate message quality with comprehensive checks
   * NASA Rule 10: Bounded validation operations, fixed issue limits
   */
  async validateQuality(message: EnhancedMessage): Promise<QualityValidation> {
    assert(message !== null, 'Enhanced message required for validation');

    const qualityMetrics = await this.scoreMessage(message);
    const issues = await this.identifyQualityIssues(message, qualityMetrics);
    const recommendations = this.generateRecommendations(issues);

    const isValid = qualityMetrics.overallScore >= this.thresholds.minAcceptable && issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'ERROR').length === 0;

    const validation: QualityValidation = {
      isValid: isValid,
      score: qualityMetrics,
      issues: issues,
      recommendations: recommendations
    };

    // Update validation history (bounded to 50 entries)
    this.updateValidationHistory(issues);

    assert(typeof validation.isValid === 'boolean', 'Validation result must be boolean');
    assert(validation.issues.length <= 20, 'Issues must be bounded');

    return validation;
  }

  /**
   * Score semantic coherence with bounded operations
   * NASA Rule 10: Fixed text analysis bounds, no recursion
   */
  private async scoreSemantic(message: EnhancedMessage): Promise<number> {
    assert(message.originalMessage.content.length > 0, 'Message content required for semantic scoring');

    const content = message.originalMessage.content;
    let semanticScore = 0.5; // Base score

    // Factor 1: Content length appropriateness (bounded check)
    const contentLength = Math.min(content.length, 2000);
    const lengthScore = this.scoreContentLength(contentLength);
    semanticScore += lengthScore * 0.3;

    // Factor 2: Vocabulary complexity (bounded analysis)
    const vocabularyScore = this.scoreVocabularyComplexity(content);
    semanticScore += vocabularyScore * 0.3;

    // Factor 3: Semantic hash quality
    const hashQuality = this.scoreSemanticHashQuality(message.semanticHash);
    semanticScore += hashQuality * 0.2;

    // Factor 4: Context integration (bounded to enhanced context)
    const integrationScore = this.scoreContextIntegration(message.enhancedContext);
    semanticScore += integrationScore * 0.2;

    const finalScore = Math.min(Math.max(semanticScore, 0), 1);
    assert(finalScore >= 0 && finalScore <= 1, 'Semantic score must be valid');

    return finalScore;
  }

  /**
   * Score context relevance with bounded operations
   * NASA Rule 10: Fixed relevance calculation bounds
   */
  private async scoreRelevance(message: EnhancedMessage): Promise<number> {
    assert(message.relevanceScore >= 0, 'Base relevance score must be non-negative');

    let relevanceScore = message.relevanceScore; // Start with base relevance

    // Factor 1: Memory pointer relevance (bounded to 10 pointers)
    const memoryRelevance = this.scoreMemoryPointerRelevance(message.memoryPointers);
    relevanceScore += memoryRelevance * 0.3;

    // Factor 2: Context compression efficiency
    const compressionRelevance = this.scoreCompressionRelevance(message.enhancedContext);
    relevanceScore += compressionRelevance * 0.2;

    // Factor 3: Agent type compatibility
    const agentCompatibility = this.scoreAgentCompatibility(message.originalMessage);
    relevanceScore += agentCompatibility * 0.2;

    // Factor 4: Task alignment
    const taskAlignment = this.scoreTaskAlignment(message.originalMessage);
    relevanceScore += taskAlignment * 0.3;

    const finalScore = Math.min(Math.max(relevanceScore, 0), 1);
    assert(finalScore >= 0 && finalScore <= 1, 'Relevance score must be valid');

    return finalScore;
  }

  /**
   * Score action clarity with bounded operations
   * NASA Rule 10: Fixed clarity analysis bounds
   */
  private async scoreClarity(message: EnhancedMessage): Promise<number> {
    assert(message.originalMessage.content.length > 0, 'Message content required for clarity scoring');

    const content = message.originalMessage.content;
    let clarityScore = 0.4; // Base clarity score

    // Factor 1: Action verbs identification (bounded to 20 verbs)
    const actionVerbScore = this.scoreActionVerbs(content);
    clarityScore += actionVerbScore * 0.3;

    // Factor 2: Instruction clarity (bounded analysis)
    const instructionScore = this.scoreInstructionClarity(content);
    clarityScore += instructionScore * 0.3;

    // Factor 3: Ambiguity detection (bounded checks)
    const ambiguityScore = this.scoreAmbiguityLevel(content);
    clarityScore += ambiguityScore * 0.2;

    // Factor 4: Specificity level (bounded specificity check)
    const specificityScore = this.scoreSpecificity(content);
    clarityScore += specificityScore * 0.2;

    const finalScore = Math.min(Math.max(clarityScore, 0), 1);
    assert(finalScore >= 0 && finalScore <= 1, 'Clarity score must be valid');

    return finalScore;
  }

  /**
   * Score completeness with bounded operations
   * NASA Rule 10: Fixed completeness checks
   */
  private async scoreCompleteness(message: EnhancedMessage): Promise<number> {
    assert(message.originalMessage !== null, 'Original message required for completeness scoring');

    let completenessScore = 0.3; // Base completeness

    // Factor 1: Required information presence (bounded checks)
    const requiredInfoScore = this.scoreRequiredInformation(message.originalMessage);
    completenessScore += requiredInfoScore * 0.4;

    // Factor 2: Context coverage (bounded context analysis)
    const contextCoverage = this.scoreContextCoverage(message.enhancedContext);
    completenessScore += contextCoverage * 0.3;

    // Factor 3: Agent information completeness
    const agentInfoScore = this.scoreAgentInformation(message.originalMessage);
    completenessScore += agentInfoScore * 0.2;

    // Factor 4: Quality prediction alignment
    const predictionAlignment = this.scorePredictionAlignment(message.qualityPrediction);
    completenessScore += predictionAlignment * 0.1;

    const finalScore = Math.min(Math.max(completenessScore, 0), 1);
    assert(finalScore >= 0 && finalScore <= 1, 'Completeness score must be valid');

    return finalScore;
  }

  /**
   * Calculate overall weighted score
   * NASA Rule 10: Fixed weight calculation, explicit bounds
   */
  private calculateOverallScore(semantic: number, relevance: number, clarity: number, completeness: number): number {
    assert(semantic >= 0 && semantic <= 1, 'Semantic score must be valid');
    assert(relevance >= 0 && relevance <= 1, 'Relevance score must be valid');
    assert(clarity >= 0 && clarity <= 1, 'Clarity score must be valid');
    assert(completeness >= 0 && completeness <= 1, 'Completeness score must be valid');

    const overall =
      semantic * this.weights.semantic +
      relevance * this.weights.relevance +
      clarity * this.weights.clarity +
      completeness * this.weights.completeness;

    const boundedScore = Math.min(Math.max(overall, 0), 1);
    assert(boundedScore >= 0 && boundedScore <= 1, 'Overall score must be valid');

    return boundedScore;
  }

  /**
   * Identify quality issues with bounded analysis
   * NASA Rule 10: Fixed bounds on issue detection
   */
  private async identifyQualityIssues(message: EnhancedMessage, metrics: QualityMetrics): Promise<ValidationIssue[]> {
    assert(message !== null, 'Message required for issue identification');
    assert(metrics.overallScore >= 0, 'Metrics must be valid');

    const issues: ValidationIssue[] = [];

    // Check semantic coherence issues (maximum 5 issues per category)
    if (metrics.semanticCoherence < this.thresholds.minAcceptable) {
      issues.push({
        severity: 'ERROR',
        category: 'SEMANTIC',
        description: `Semantic coherence below threshold: ${metrics.semanticCoherence.toFixed(2)}`,
        suggestedFix: 'Improve message structure and vocabulary'
      });
    }

    // Check relevance issues
    if (metrics.contextRelevance < this.thresholds.minAcceptable) {
      issues.push({
        severity: 'WARNING',
        category: 'RELEVANCE',
        description: `Context relevance below threshold: ${metrics.contextRelevance.toFixed(2)}`,
        suggestedFix: 'Add more relevant context information'
      });
    }

    // Check clarity issues
    if (metrics.actionClarity < this.thresholds.minAcceptable) {
      issues.push({
        severity: 'ERROR',
        category: 'CLARITY',
        description: `Action clarity below threshold: ${metrics.actionClarity.toFixed(2)}`,
        suggestedFix: 'Use clearer action words and instructions'
      });
    }

    // Check completeness issues
    if (metrics.completeness < this.thresholds.minAcceptable) {
      issues.push({
        severity: 'WARNING',
        category: 'COMPLETENESS',
        description: `Completeness below threshold: ${metrics.completeness.toFixed(2)}`,
        suggestedFix: 'Include missing required information'
      });
    }

    // Critical overall score check
    if (metrics.overallScore < this.thresholds.minAcceptable * 0.8) { // 20% below minimum
      issues.push({
        severity: 'CRITICAL',
        category: 'SEMANTIC',
        description: `Overall quality critically low: ${metrics.overallScore.toFixed(2)}`,
        suggestedFix: 'Complete message rewrite recommended'
      });
    }

    // Bounded result: maximum 10 issues
    const boundedIssues = issues.slice(0, 10);
    assert(boundedIssues.length <= 10, 'Issues must be bounded');

    return boundedIssues;
  }

  /**
   * Generate recommendations based on issues
   * NASA Rule 10: Fixed recommendation generation bounds
   */
  private generateRecommendations(issues: ValidationIssue[]): string[] {
    assert(issues.length <= 20, 'Issues must be bounded');

    const recommendations: string[] = [];
    const maxRecommendations = 5;

    // Fixed bounds: process maximum 10 issues
    const issuesToProcess = issues.slice(0, 10);

    for (let i = 0; i < issuesToProcess.length && recommendations.length < maxRecommendations; i++) {
      const issue = issuesToProcess[i];

      if (issue.severity === 'CRITICAL' || issue.severity === 'ERROR') {
        recommendations.push(`Priority: ${issue.suggestedFix}`);
      } else if (recommendations.length < maxRecommendations - 1) {
        recommendations.push(`Consider: ${issue.suggestedFix}`);
      }
    }

    // Add general recommendation if space available
    if (recommendations.length < maxRecommendations) {
      recommendations.push('Review message structure and clarity');
    }

    assert(recommendations.length <= maxRecommendations, 'Recommendations must be bounded');
    return recommendations;
  }

  /**
   * Helper scoring methods with bounded operations
   */
  private scoreContentLength(length: number): number {
    assert(length >= 0, 'Content length must be non-negative');

    if (length < 10) return 0.2; // Too short
    if (length < 50) return 0.5; // Short but acceptable
    if (length < 200) return 0.8; // Good length
    if (length < 500) return 1.0; // Optimal length
    if (length < 1000) return 0.8; // Long but acceptable
    return 0.6; // Too long
  }

  private scoreVocabularyComplexity(content: string): number {
    const boundedContent = content.slice(0, 500);
    const words = boundedContent.split(/\s+/).slice(0, 100);
    const avgWordLength = words.reduce((sum, word) => sum + Math.min(word.length, 20), 0) / Math.max(words.length, 1);
    return Math.min(avgWordLength / 10, 1.0);
  }

  private scoreSemanticHashQuality(hash: string): number {
    return hash && hash.length >= 8 ? 0.8 : 0.4;
  }

  private scoreContextIntegration(context: any): number {
    if (!context || !context.essentialElements) return 0.3;
    const elementCount = Math.min(context.essentialElements.length, 10);
    return Math.min(0.4 + (elementCount * 0.06), 1.0);
  }

  private scoreMemoryPointerRelevance(pointers: any[]): number {
    if (!pointers || pointers.length === 0) return 0.3;
    const boundedPointers = pointers.slice(0, 10);
    const avgRelevance = boundedPointers.reduce((sum, p) => sum + (p.relevanceScore || 0.5), 0) / boundedPointers.length;
    return Math.min(avgRelevance, 1.0);
  }

  private scoreCompressionRelevance(context: any): number {
    if (!context || !context.compressionRatio) return 0.5;
    const ratio = context.compressionRatio;
    if (ratio >= 0.5 && ratio <= 0.8) return 1.0; // Optimal compression
    if (ratio > 0.8) return 0.8; // Too little compression
    return 0.6; // Too much compression
  }

  private scoreAgentCompatibility(message: AgentMessage): number {
    if (!message.sourceAgent || !message.targetAgent) return 0.5;
    const sameType = message.sourceAgent.type === message.targetAgent.type;
    const sameDomain = message.sourceAgent.domain === message.targetAgent.domain;
    return 0.4 + (sameType ? 0.3 : 0) + (sameDomain ? 0.3 : 0);
  }

  private scoreTaskAlignment(message: AgentMessage): number {
    if (!message.agentContext || !message.agentContext.taskContext) return 0.5;
    const priority = message.agentContext.taskContext.priority;
    const priorityScores = { 'LOW': 0.4, 'MEDIUM': 0.6, 'HIGH': 0.8, 'CRITICAL': 1.0 };
    return priorityScores[priority] || 0.5;
  }

  private scoreActionVerbs(content: string): number {
    const actionVerbs = ['create', 'implement', 'analyze', 'process', 'generate', 'optimize', 'validate', 'execute'];
    const boundedContent = content.toLowerCase().slice(0, 500);
    let verbCount = 0;

    for (let i = 0; i < actionVerbs.length; i++) {
      if (boundedContent.includes(actionVerbs[i])) {
        verbCount++;
      }
    }

    return Math.min(verbCount / 4, 1.0);
  }

  private scoreInstructionClarity(content: string): number {
    const indicators = ['please', 'should', 'must', 'will', 'need to', 'required'];
    const boundedContent = content.toLowerCase().slice(0, 500);
    let indicatorCount = 0;

    for (let i = 0; i < indicators.length; i++) {
      if (boundedContent.includes(indicators[i])) {
        indicatorCount++;
      }
    }

    return Math.min(0.3 + (indicatorCount * 0.15), 1.0);
  }

  private scoreAmbiguityLevel(content: string): number {
    const ambiguousWords = ['maybe', 'perhaps', 'might', 'could', 'possibly', 'unclear'];
    const boundedContent = content.toLowerCase().slice(0, 500);
    let ambiguityCount = 0;

    for (let i = 0; i < ambiguousWords.length; i++) {
      if (boundedContent.includes(ambiguousWords[i])) {
        ambiguityCount++;
      }
    }

    return Math.max(1.0 - (ambiguityCount * 0.2), 0);
  }

  private scoreSpecificity(content: string): number {
    const specificWords = ['exactly', 'specifically', 'precisely', 'detailed', 'particular'];
    const boundedContent = content.toLowerCase().slice(0, 500);
    let specificityCount = 0;

    for (let i = 0; i < specificWords.length; i++) {
      if (boundedContent.includes(specificWords[i])) {
        specificityCount++;
      }
    }

    return Math.min(0.4 + (specificityCount * 0.2), 1.0);
  }

  private scoreRequiredInformation(message: AgentMessage): number {
    let score = 0.2; // Base score

    if (message.sourceAgent && message.sourceAgent.id) score += 0.2;
    if (message.targetAgent && message.targetAgent.id) score += 0.2;
    if (message.content && message.content.length > 10) score += 0.2;
    if (message.agentContext) score += 0.2;

    return Math.min(score, 1.0);
  }

  private scoreContextCoverage(context: any): number {
    if (!context || !context.essentialElements) return 0.3;
    const elementTypes = new Set(context.essentialElements.map(e => e.type));
    return Math.min(0.4 + (elementTypes.size * 0.15), 1.0);
  }

  private scoreAgentInformation(message: AgentMessage): number {
    let score = 0.3; // Base score

    if (message.sourceAgent && message.sourceAgent.capabilities && message.sourceAgent.capabilities.length > 0) score += 0.2;
    if (message.targetAgent && message.targetAgent.capabilities && message.targetAgent.capabilities.length > 0) score += 0.2;
    if (message.priority && message.priority !== 'LOW') score += 0.2;
    if (message.timestamp && message.timestamp > 0) score += 0.1;

    return Math.min(score, 1.0);
  }

  private scorePredictionAlignment(prediction: number): number {
    if (typeof prediction !== 'number') return 0.5;
    return Math.min(Math.max(prediction, 0), 1);
  }

  private generateScoringCacheKey(message: EnhancedMessage): string {
    const contentHash = message.semanticHash || 'unknown';
    const relevanceHash = Math.floor(message.relevanceScore * 100).toString();
    return `score_${contentHash}_${relevanceHash}`;
  }

  private updateValidationHistory(issues: ValidationIssue[]): void {
    // Add new issues to history (bounded to 50 total)
    this.validationHistory.push(...issues);

    // Keep only last 50 issues
    if (this.validationHistory.length > 50) {
      this.validationHistory = this.validationHistory.slice(-50);
    }
  }

  /**
   * Get scoring statistics
   */
  getScoringStatistics(): { cacheSize: number; historySize: number; weights: ScoringWeights; thresholds: ScoringThresholds } {
    return {
      cacheSize: this.scoringCache.size,
      historySize: this.validationHistory.length,
      weights: { ...this.weights },
      thresholds: { ...this.thresholds }
    };
  }
}

/**
 * Assert function for NASA Rule 10 compliance
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: a2a-dspy-005
// inputs: ["types.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
// === END FOOTER ===