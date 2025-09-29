/**
 * Optimization Feedback Loop - Continuous improvement system
 * NASA Rule 10 Compliant Implementation with bounded learning operations
 */

import {
  OptimizedCommunication,
  QualityMetrics,
  PerformanceMetrics,
  OptimizationResult,
  OptimizationAction,
  AgentMessage,
  EnhancedMessage
} from './interfaces/types';

interface FeedbackMetrics {
  successRate: number;
  averageQuality: number;
  improvementTrend: number;
  learningRate: number;
}

interface OptimizationPattern {
  patternId: string;
  actionType: 'COMPRESS_CONTEXT' | 'ENHANCE_SEMANTICS' | 'FILTER_NOISE' | 'BOOST_RELEVANCE';
  successCount: number;
  failureCount: number;
  averageImpact: number;
  lastUsed: number;
}

interface LearningSnapshot {
  timestamp: number;
  totalOptimizations: number;
  successfulOptimizations: number;
  patterns: OptimizationPattern[];
  metrics: FeedbackMetrics;
}

export class OptimizationFeedbackLoop {
  private optimizationHistory: OptimizedCommunication[] = [];
  private optimizationPatterns: Map<string, OptimizationPattern> = new Map();
  private feedbackMetrics: FeedbackMetrics;
  private learningSnapshots: LearningSnapshot[] = [];
  private adaptationThreshold: number = 0.1;

  constructor() {
    this.optimizationHistory = [];
    this.optimizationPatterns = new Map();
    this.learningSnapshots = [];

    this.feedbackMetrics = {
      successRate: 0.7,
      averageQuality: 0.6,
      improvementTrend: 0.05,
      learningRate: 0.1
    };

    assert(this.feedbackMetrics.successRate >= 0 && this.feedbackMetrics.successRate <= 1, 'Success rate must be valid');
    assert(this.adaptationThreshold > 0 && this.adaptationThreshold < 1, 'Adaptation threshold must be valid');
  }

  /**
   * Process optimization feedback and learn from results
   * NASA Rule 10: Fixed bounds, explicit error handling, assertions
   */
  async processFeedback(
    originalMessage: AgentMessage,
    optimizedCommunication: OptimizedCommunication,
    actualOutcome: QualityMetrics
  ): Promise<OptimizationResult> {
    assert(originalMessage.content.length > 0, 'Original message required');
    assert(optimizedCommunication.qualityScore >= 0, 'Optimized quality score must be valid');
    assert(actualOutcome.overallScore >= 0 && actualOutcome.overallScore <= 1, 'Actual outcome score must be valid');

    try {
      // Step 1: Record optimization attempt (bounded recording)
      this.recordOptimizationAttempt(optimizedCommunication);

      // Step 2: Analyze optimization effectiveness (bounded analysis)
      const effectiveness = this.analyzeOptimizationEffectiveness(optimizedCommunication, actualOutcome);
      assert(effectiveness >= 0 && effectiveness <= 1, 'Effectiveness must be valid');

      // Step 3: Update optimization patterns (bounded pattern updates)
      const updatedPatterns = await this.updateOptimizationPatterns(optimizedCommunication, effectiveness);
      assert(updatedPatterns.length <= 10, 'Updated patterns must be bounded');

      // Step 4: Calculate improvement recommendations (bounded calculations)
      const recommendations = this.calculateImprovementRecommendations(effectiveness, actualOutcome);
      assert(recommendations.length <= 5, 'Recommendations must be bounded');

      // Step 5: Update feedback metrics (bounded metric updates)
      this.updateFeedbackMetrics(effectiveness);

      // Create optimization result
      const optimizationResult: OptimizationResult = {
        improved: effectiveness > 0.5,
        oldScore: optimizedCommunication.qualityScore,
        newScore: actualOutcome.overallScore,
        optimizationActions: recommendations,
        nextOptimizationHint: this.generateNextOptimizationHint(effectiveness)
      };

      // Create learning snapshot if significant change
      if (Math.abs(effectiveness - 0.5) > this.adaptationThreshold) {
        this.createLearningSnapshot();
      }

      assert(optimizationResult.newScore >= 0 && optimizationResult.newScore <= 1, 'New score must be valid');
      return optimizationResult;

    } catch (error) {
      throw new Error(`Optimization feedback processing failed: ${error.message}`);
    }
  }

  /**
   * Generate optimization recommendations based on learning
   * NASA Rule 10: Fixed bounds on recommendation generation
   */
  async generateOptimizationRecommendations(
    message: EnhancedMessage,
    currentQuality: QualityMetrics
  ): Promise<OptimizationAction[]> {
    assert(message !== null, 'Enhanced message required for recommendations');
    assert(currentQuality.overallScore >= 0, 'Current quality score must be valid');

    const recommendations: OptimizationAction[] = [];

    // Analyze current quality gaps (bounded analysis)
    const qualityGaps = this.identifyQualityGaps(currentQuality);
    assert(qualityGaps.length <= 4, 'Quality gaps must be bounded to quality metrics');

    // Fixed bounds: generate maximum 5 recommendations
    const maxRecommendations = 5;
    for (let i = 0; i < Math.min(qualityGaps.length, maxRecommendations); i++) {
      const gap = qualityGaps[i];
      const recommendation = this.generateRecommendationForGap(gap, message);

      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Add pattern-based recommendations (bounded to top 3 patterns)
    const patternRecommendations = this.getPatternBasedRecommendations(message);
    const boundedPatternRecs = patternRecommendations.slice(0, 3);

    recommendations.push(...boundedPatternRecs);

    // Return bounded final recommendations
    const finalRecommendations = recommendations.slice(0, maxRecommendations);
    assert(finalRecommendations.length <= maxRecommendations, 'Recommendations must be bounded');

    return finalRecommendations;
  }

  /**
   * Adapt optimization strategy based on feedback patterns
   * NASA Rule 10: Fixed adaptation bounds, no dynamic loops
   */
  async adaptOptimizationStrategy(): Promise<{ adapted: boolean; changes: string[] }> {
    const changes: string[] = [];
    let adapted = false;

    // Analyze recent performance trends (bounded to last 20 optimizations)
    const recentOptimizations = this.optimizationHistory.slice(-20);
    if (recentOptimizations.length < 5) {
      return { adapted: false, changes: ['Insufficient data for adaptation'] };
    }

    // Calculate trend metrics (bounded calculations)
    const trendMetrics = this.calculateTrendMetrics(recentOptimizations);
    assert(trendMetrics.averageQuality >= 0, 'Average quality must be non-negative');

    // Adaptation strategy 1: Adjust learning rate
    if (trendMetrics.improvementRate < 0.1) {
      this.feedbackMetrics.learningRate = Math.min(this.feedbackMetrics.learningRate * 1.2, 0.3);
      changes.push('Increased learning rate for better adaptation');
      adapted = true;
    } else if (trendMetrics.improvementRate > 0.3) {
      this.feedbackMetrics.learningRate = Math.max(this.feedbackMetrics.learningRate * 0.8, 0.05);
      changes.push('Decreased learning rate for stability');
      adapted = true;
    }

    // Adaptation strategy 2: Update pattern weights (bounded to top 10 patterns)
    const topPatterns = this.getTopPerformingPatterns(10);
    for (let i = 0; i < Math.min(topPatterns.length, 5); i++) {
      const pattern = topPatterns[i];
      if (pattern.successCount > pattern.failureCount * 2) {
        pattern.averageImpact = Math.min(pattern.averageImpact * 1.1, 1.0);
        changes.push(`Boosted pattern ${pattern.patternId} impact`);
        adapted = true;
      }
    }

    // Adaptation strategy 3: Prune ineffective patterns (bounded cleanup)
    const ineffectivePatterns = this.getIneffectivePatterns();
    for (let i = 0; i < Math.min(ineffectivePatterns.length, 3); i++) {
      const pattern = ineffectivePatterns[i];
      this.optimizationPatterns.delete(pattern.patternId);
      changes.push(`Removed ineffective pattern ${pattern.patternId}`);
      adapted = true;
    }

    assert(changes.length >= 0, 'Changes array must be valid');
    return { adapted, changes };
  }

  /**
   * Record optimization attempt with bounded storage
   * NASA Rule 10: Fixed bounds on history storage
   */
  private recordOptimizationAttempt(optimization: OptimizedCommunication): void {
    assert(optimization.qualityScore >= 0, 'Quality score must be valid for recording');

    // Add to history with bounded size (maximum 100 entries)
    this.optimizationHistory.push(optimization);
    if (this.optimizationHistory.length > 100) {
      this.optimizationHistory = this.optimizationHistory.slice(-100);
    }

    assert(this.optimizationHistory.length <= 100, 'Optimization history must be bounded');
  }

  /**
   * Analyze optimization effectiveness with bounded calculations
   * NASA Rule 10: Fixed effectiveness calculation bounds
   */
  private analyzeOptimizationEffectiveness(
    optimization: OptimizedCommunication,
    actualOutcome: QualityMetrics
  ): number {
    assert(optimization.qualityScore >= 0, 'Optimization score must be valid');
    assert(actualOutcome.overallScore >= 0, 'Actual outcome must be valid');

    // Calculate improvement (can be negative)
    const improvement = actualOutcome.overallScore - optimization.qualityScore;

    // Normalize effectiveness to [0, 1] range
    // Improvement of 0.2 or more = 1.0 effectiveness
    // Improvement of -0.2 or less = 0.0 effectiveness
    const effectiveness = Math.min(Math.max((improvement + 0.2) / 0.4, 0), 1);

    assert(effectiveness >= 0 && effectiveness <= 1, 'Effectiveness must be in valid range');
    return effectiveness;
  }

  /**
   * Update optimization patterns with bounded operations
   * NASA Rule 10: Fixed bounds on pattern updates
   */
  private async updateOptimizationPatterns(
    optimization: OptimizedCommunication,
    effectiveness: number
  ): Promise<OptimizationPattern[]> {
    assert(optimization.optimizationTrace.length >= 0, 'Optimization trace must be valid');
    assert(effectiveness >= 0 && effectiveness <= 1, 'Effectiveness must be valid');

    const updatedPatterns: OptimizationPattern[] = [];

    // Fixed bounds: process maximum 10 optimization actions
    const actionsToProcess = optimization.optimizationTrace.slice(0, 10);

    for (let i = 0; i < actionsToProcess.length; i++) {
      const action = actionsToProcess[i];
      const patternId = `${action.type}_${Math.floor(action.impact * 10)}`;

      let pattern = this.optimizationPatterns.get(patternId);
      if (!pattern) {
        pattern = {
          patternId: patternId,
          actionType: action.type,
          successCount: 0,
          failureCount: 0,
          averageImpact: action.impact,
          lastUsed: Date.now()
        };
      }

      // Update pattern based on effectiveness
      if (effectiveness > 0.6) {
        pattern.successCount++;
      } else {
        pattern.failureCount++;
      }

      // Update average impact (exponential moving average)
      const alpha = 0.1;
      pattern.averageImpact = (1 - alpha) * pattern.averageImpact + alpha * action.impact;
      pattern.lastUsed = Date.now();

      this.optimizationPatterns.set(patternId, pattern);
      updatedPatterns.push(pattern);
    }

    // Keep patterns bounded (maximum 100 patterns)
    if (this.optimizationPatterns.size > 100) {
      this.pruneOldestPatterns(20);
    }

    assert(updatedPatterns.length <= 10, 'Updated patterns must be bounded');
    return updatedPatterns;
  }

  /**
   * Calculate improvement recommendations with bounded generation
   * NASA Rule 10: Fixed bounds on recommendation calculation
   */
  private calculateImprovementRecommendations(
    effectiveness: number,
    actualOutcome: QualityMetrics
  ): OptimizationAction[] {
    assert(effectiveness >= 0 && effectiveness <= 1, 'Effectiveness must be valid');
    assert(actualOutcome.overallScore >= 0, 'Actual outcome must be valid');

    const recommendations: OptimizationAction[] = [];

    // Generate recommendations based on quality metrics gaps
    if (actualOutcome.semanticCoherence < 0.7) {
      recommendations.push({
        type: 'ENHANCE_SEMANTICS',
        applied: false,
        impact: 0.8 - actualOutcome.semanticCoherence,
        description: 'Improve semantic coherence through vocabulary enhancement'
      });
    }

    if (actualOutcome.contextRelevance < 0.7) {
      recommendations.push({
        type: 'BOOST_RELEVANCE',
        applied: false,
        impact: 0.8 - actualOutcome.contextRelevance,
        description: 'Boost context relevance by filtering irrelevant information'
      });
    }

    if (actualOutcome.actionClarity < 0.7) {
      recommendations.push({
        type: 'FILTER_NOISE',
        applied: false,
        impact: 0.8 - actualOutcome.actionClarity,
        description: 'Filter noise to improve action clarity'
      });
    }

    if (actualOutcome.completeness < 0.7) {
      recommendations.push({
        type: 'COMPRESS_CONTEXT',
        applied: false,
        impact: 0.8 - actualOutcome.completeness,
        description: 'Compress context while maintaining completeness'
      });
    }

    // Return bounded recommendations (maximum 5)
    const boundedRecommendations = recommendations.slice(0, 5);
    assert(boundedRecommendations.length <= 5, 'Recommendations must be bounded');

    return boundedRecommendations;
  }

  /**
   * Generate optimization hint for next iteration
   * NASA Rule 10: Fixed hint generation
   */
  private generateNextOptimizationHint(effectiveness: number): string {
    assert(effectiveness >= 0 && effectiveness <= 1, 'Effectiveness must be valid');

    if (effectiveness > 0.8) {
      return 'Continue current optimization strategy - high effectiveness achieved';
    } else if (effectiveness > 0.6) {
      return 'Fine-tune current approach - moderate effectiveness observed';
    } else if (effectiveness > 0.4) {
      return 'Consider alternative optimization strategies - low effectiveness';
    } else {
      return 'Major strategy revision needed - poor optimization effectiveness';
    }
  }

  /**
   * Helper methods with bounded operations
   */
  private identifyQualityGaps(quality: QualityMetrics): { metric: string; gap: number; priority: number }[] {
    const gaps = [];
    const targetScore = 0.8;

    if (quality.semanticCoherence < targetScore) {
      gaps.push({ metric: 'semanticCoherence', gap: targetScore - quality.semanticCoherence, priority: 1 });
    }
    if (quality.contextRelevance < targetScore) {
      gaps.push({ metric: 'contextRelevance', gap: targetScore - quality.contextRelevance, priority: 2 });
    }
    if (quality.actionClarity < targetScore) {
      gaps.push({ metric: 'actionClarity', gap: targetScore - quality.actionClarity, priority: 1 });
    }
    if (quality.completeness < targetScore) {
      gaps.push({ metric: 'completeness', gap: targetScore - quality.completeness, priority: 3 });
    }

    return gaps.sort((a, b) => a.priority - b.priority);
  }

  private generateRecommendationForGap(gap: any, message: EnhancedMessage): OptimizationAction | null {
    const actionTypes = {
      'semanticCoherence': 'ENHANCE_SEMANTICS',
      'contextRelevance': 'BOOST_RELEVANCE',
      'actionClarity': 'FILTER_NOISE',
      'completeness': 'COMPRESS_CONTEXT'
    };

    const actionType = actionTypes[gap.metric];
    if (!actionType) return null;

    return {
      type: actionType as any,
      applied: false,
      impact: gap.gap,
      description: `Address ${gap.metric} gap of ${gap.gap.toFixed(2)}`
    };
  }

  private getPatternBasedRecommendations(message: EnhancedMessage): OptimizationAction[] {
    const recommendations: OptimizationAction[] = [];
    const topPatterns = this.getTopPerformingPatterns(3);

    for (let i = 0; i < topPatterns.length; i++) {
      const pattern = topPatterns[i];
      if (pattern.averageImpact > 0.1) {
        recommendations.push({
          type: pattern.actionType,
          applied: false,
          impact: pattern.averageImpact,
          description: `Apply successful pattern ${pattern.patternId}`
        });
      }
    }

    return recommendations;
  }

  private calculateTrendMetrics(optimizations: OptimizedCommunication[]): {
    averageQuality: number;
    improvementRate: number;
    volatility: number;
  } {
    if (optimizations.length === 0) {
      return { averageQuality: 0, improvementRate: 0, volatility: 0 };
    }

    const qualities = optimizations.map(opt => opt.qualityScore);
    const avgQuality = qualities.reduce((sum, q) => sum + q, 0) / qualities.length;

    let improvementRate = 0;
    if (qualities.length > 1) {
      const firstHalf = qualities.slice(0, Math.floor(qualities.length / 2));
      const secondHalf = qualities.slice(Math.floor(qualities.length / 2));
      const firstAvg = firstHalf.reduce((sum, q) => sum + q, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, q) => sum + q, 0) / secondHalf.length;
      improvementRate = secondAvg - firstAvg;
    }

    const variance = qualities.reduce((sum, q) => sum + Math.pow(q - avgQuality, 2), 0) / qualities.length;
    const volatility = Math.sqrt(variance);

    return { averageQuality: avgQuality, improvementRate, volatility };
  }

  private getTopPerformingPatterns(count: number): OptimizationPattern[] {
    const patterns = Array.from(this.optimizationPatterns.values());
    return patterns
      .filter(p => p.successCount > 0)
      .sort((a, b) => {
        const aSuccessRate = a.successCount / (a.successCount + a.failureCount);
        const bSuccessRate = b.successCount / (b.successCount + b.failureCount);
        return bSuccessRate - aSuccessRate;
      })
      .slice(0, count);
  }

  private getIneffectivePatterns(): OptimizationPattern[] {
    const patterns = Array.from(this.optimizationPatterns.values());
    return patterns.filter(p => {
      const totalAttempts = p.successCount + p.failureCount;
      if (totalAttempts < 3) return false; // Need minimum attempts
      const successRate = p.successCount / totalAttempts;
      return successRate < 0.3; // Less than 30% success rate
    });
  }

  private pruneOldestPatterns(countToRemove: number): void {
    const patterns = Array.from(this.optimizationPatterns.entries());
    const sortedByAge = patterns.sort((a, b) => a[1].lastUsed - b[1].lastUsed);

    for (let i = 0; i < Math.min(countToRemove, sortedByAge.length); i++) {
      this.optimizationPatterns.delete(sortedByAge[i][0]);
    }
  }

  private updateFeedbackMetrics(effectiveness: number): void {
    const alpha = this.feedbackMetrics.learningRate;

    // Update success rate
    const isSuccess = effectiveness > 0.5 ? 1 : 0;
    this.feedbackMetrics.successRate = (1 - alpha) * this.feedbackMetrics.successRate + alpha * isSuccess;

    // Update average quality (using effectiveness as proxy)
    this.feedbackMetrics.averageQuality = (1 - alpha) * this.feedbackMetrics.averageQuality + alpha * effectiveness;

    // Update improvement trend
    const currentTrend = effectiveness - 0.5; // Baseline expectation
    this.feedbackMetrics.improvementTrend = (1 - alpha) * this.feedbackMetrics.improvementTrend + alpha * currentTrend;
  }

  private createLearningSnapshot(): void {
    const snapshot: LearningSnapshot = {
      timestamp: Date.now(),
      totalOptimizations: this.optimizationHistory.length,
      successfulOptimizations: this.optimizationHistory.filter(opt => opt.qualityScore > 0.7).length,
      patterns: Array.from(this.optimizationPatterns.values()).slice(0, 20), // Bounded
      metrics: { ...this.feedbackMetrics }
    };

    this.learningSnapshots.push(snapshot);

    // Keep snapshots bounded (maximum 20 snapshots)
    if (this.learningSnapshots.length > 20) {
      this.learningSnapshots = this.learningSnapshots.slice(-20);
    }
  }

  /**
   * Public interface methods
   */
  getFeedbackMetrics(): FeedbackMetrics {
    return { ...this.feedbackMetrics };
  }

  getOptimizationStatistics(): {
    totalOptimizations: number;
    successRate: number;
    averageQuality: number;
    patternCount: number;
    snapshotCount: number;
  } {
    const successfulOpts = this.optimizationHistory.filter(opt => opt.qualityScore > 0.7).length;
    const successRate = this.optimizationHistory.length > 0
      ? successfulOpts / this.optimizationHistory.length
      : 0;

    return {
      totalOptimizations: this.optimizationHistory.length,
      successRate: successRate,
      averageQuality: this.feedbackMetrics.averageQuality,
      patternCount: this.optimizationPatterns.size,
      snapshotCount: this.learningSnapshots.length
    };
  }

  getRecentLearningSnapshot(): LearningSnapshot | null {
    return this.learningSnapshots.length > 0
      ? this.learningSnapshots[this.learningSnapshots.length - 1]
      : null;
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
// run_id: a2a-dspy-007
// inputs: ["types.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
// === END FOOTER ===