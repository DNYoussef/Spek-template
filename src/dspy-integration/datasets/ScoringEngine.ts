/**
 * Automated scoring system for DSPy prompt optimization
 * Implements multi-dimensional quality assessment with performance baselines
 */

import { CommunicationExample, ScoringResult, PerformanceMetrics } from '~types/DatasetTypes';

export interface ScoringConfig {
  weights: {
    clarity: number;
    actionability: number;
    completeness: number;
    efficiency: number;
  };
  thresholds: {
    min_passing_score: number;
    excellent_score: number;
  };
  performance_targets: {
    response_time_ms: number;
    token_efficiency: number;
    user_satisfaction: number;
  };
}

export class ScoringEngine {
  private config: ScoringConfig;
  private performanceBaselines: Map<string, PerformanceMetrics> = new Map();
  private scoringHistory: Map<string, ScoringResult[]> = new Map();

  constructor(config?: Partial<ScoringConfig>) {
    this.config = {
      weights: {
        clarity: 0.25,
        actionability: 0.30,
        completeness: 0.25,
        efficiency: 0.20
      },
      thresholds: {
        min_passing_score: 6.0,
        excellent_score: 8.5
      },
      performance_targets: {
        response_time_ms: 2000,
        token_efficiency: 0.8,
        user_satisfaction: 0.85
      },
      ...config
    };
  }

  /**
   * Score communication example with automated quality assessment
   * NASA Rule 10: ≤60 lines, fixed bounds, ≥2 assertions
   */
  async scoreExample(example: CommunicationExample): Promise<ScoringResult> {
    assert(example.output?.communication !== undefined, 'Communication output required');
    assert(example.input !== undefined, 'Input required for scoring');

    const clarity = this.scoreClaritySyllableReadability(example.output.communication);
    const actionability = this.scoreActionabilityVerbs(example.output.communication);
    const completeness = this.scoreCompletenessFields(example.output.structured_data);
    const efficiency = this.scoreEfficiencyTokens(example);

    // Fixed bounds: 4 scoring iterations maximum
    const overallScore = this.calculateWeightedScore(clarity, actionability, completeness, efficiency);

    const result: ScoringResult = {
      clarity,
      actionability,
      completeness,
      efficiency,
      overall_score: overallScore,
      performance_metrics: {
        response_time_ms: this.estimateResponseTime(example),
        token_count: this.countTokens(example.output.communication),
        complexity_score: this.calculateComplexityScore(example),
        user_satisfaction_estimate: this.estimateUserSatisfaction(overallScore)
      },
      quality_assessment: {
        grade: this.getQualityGrade(overallScore),
        strengths: this.identifyStrengths(clarity, actionability, completeness, efficiency),
        improvement_areas: this.identifyImprovements(clarity, actionability, completeness, efficiency),
        recommendation: this.generateRecommendation(overallScore)
      }
    };

    // Store in history
    if (!this.scoringHistory.has(example.id)) {
      this.scoringHistory.set(example.id, []);
    }
    this.scoringHistory.get(example.id)!.push(result);

    return result;
  }

  /**
   * Batch score multiple examples with performance optimization
   */
  async batchScore(examples: CommunicationExample[]): Promise<Map<string, ScoringResult>> {
    assert(examples.length > 0, 'Examples required for batch scoring');

    const results = new Map<string, ScoringResult>();
    const startTime = Date.now();

    // Process in parallel batches of 10
    const batchSize = 10;
    for (let i = 0; i < examples.length; i += batchSize) {
      const batch = examples.slice(i, i + batchSize);
      const batchPromises = batch.map(async example => {
        const result = await this.scoreExample(example);
        return { id: example.id, result };
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ id, result }) => {
        results.set(id, result);
      });
    }

    // Update performance metrics
    const totalTime = Date.now() - startTime;
    console.log(`Batch scored ${examples.length} examples in ${totalTime}ms (${totalTime / examples.length}ms per example)`);

    return results;
  }

  /**
   * Set performance baseline for comparison
   */
  setPerformanceBaseline(communicationType: string, metrics: PerformanceMetrics): void {
    this.performanceBaselines.set(communicationType, metrics);
  }

  /**
   * Compare current performance against baseline
   */
  compareToBaseline(example: CommunicationExample, currentMetrics: PerformanceMetrics): {
    improvement_percentage: number;
    meets_targets: boolean;
    recommendations: string[];
  } {
    const baseline = this.performanceBaselines.get(example.communication_type);
    if (!baseline) {
      return {
        improvement_percentage: 0,
        meets_targets: false,
        recommendations: ['No baseline available for comparison']
      };
    }

    const improvements = {
      response_time: ((baseline.response_time_ms - currentMetrics.response_time_ms) / baseline.response_time_ms) * 100,
      token_efficiency: ((currentMetrics.token_count - baseline.token_count) / baseline.token_count) * -100,
      user_satisfaction: ((currentMetrics.user_satisfaction_estimate - baseline.user_satisfaction_estimate) / baseline.user_satisfaction_estimate) * 100
    };

    const avgImprovement = (improvements.response_time + improvements.token_efficiency + improvements.user_satisfaction) / 3;

    const meetsTargets =
      currentMetrics.response_time_ms <= this.config.performance_targets.response_time_ms &&
      (currentMetrics.token_count / baseline.token_count) <= this.config.performance_targets.token_efficiency &&
      currentMetrics.user_satisfaction_estimate >= this.config.performance_targets.user_satisfaction;

    const recommendations: string[] = [];
    if (currentMetrics.response_time_ms > this.config.performance_targets.response_time_ms) {
      recommendations.push('Optimize response time - consider shorter prompts or caching');
    }
    if ((currentMetrics.token_count / baseline.token_count) > this.config.performance_targets.token_efficiency) {
      recommendations.push('Improve token efficiency - reduce redundant content');
    }
    if (currentMetrics.user_satisfaction_estimate < this.config.performance_targets.user_satisfaction) {
      recommendations.push('Enhance user satisfaction - improve clarity and actionability');
    }

    return {
      improvement_percentage: avgImprovement,
      meets_targets: meetsTargets,
      recommendations
    };
  }

  /**
   * Get scoring statistics for monitoring
   */
  getScoringStats(): {
    total_scored: number;
    average_scores: Record<string, number>;
    score_distribution: Record<string, number>;
    trending_quality: 'improving' | 'stable' | 'declining';
  } {
    const allResults = Array.from(this.scoringHistory.values()).flat();

    if (allResults.length === 0) {
      return {
        total_scored: 0,
        average_scores: {},
        score_distribution: {},
        trending_quality: 'stable'
      };
    }

    const averageScores = {
      clarity: allResults.reduce((sum, r) => sum + r.clarity, 0) / allResults.length,
      actionability: allResults.reduce((sum, r) => sum + r.actionability, 0) / allResults.length,
      completeness: allResults.reduce((sum, r) => sum + r.completeness, 0) / allResults.length,
      efficiency: allResults.reduce((sum, r) => sum + r.efficiency, 0) / allResults.length,
      overall: allResults.reduce((sum, r) => sum + r.overall_score, 0) / allResults.length
    };

    // Score distribution
    const scoreRanges = ['0-3', '3-5', '5-7', '7-8.5', '8.5-10'];
    const distribution = scoreRanges.reduce((dist, range) => {
      dist[range] = 0;
      return dist;
    }, {} as Record<string, number>);

    allResults.forEach(result => {
      const score = result.overall_score;
      if (score < 3) distribution['0-3']++;
      else if (score < 5) distribution['3-5']++;
      else if (score < 7) distribution['5-7']++;
      else if (score < 8.5) distribution['7-8.5']++;
      else distribution['8.5-10']++;
    });

    // Trending analysis (compare recent vs older scores)
    const recentResults = allResults.slice(-20);
    const olderResults = allResults.slice(0, -20);
    let trending: 'improving' | 'stable' | 'declining' = 'stable';

    if (olderResults.length > 0 && recentResults.length > 0) {
      const recentAvg = recentResults.reduce((sum, r) => sum + r.overall_score, 0) / recentResults.length;
      const olderAvg = olderResults.reduce((sum, r) => sum + r.overall_score, 0) / olderResults.length;
      const diff = recentAvg - olderAvg;

      if (diff > 0.5) trending = 'improving';
      else if (diff < -0.5) trending = 'declining';
    }

    return {
      total_scored: allResults.length,
      average_scores: averageScores,
      score_distribution: distribution,
      trending_quality: trending
    };
  }

  // Private scoring methods

  private scoreClaritySyllableReadability(text: string): number {
    if (!text || text.length === 0) return 0;

    // Calculate readability using syllable count and sentence structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);

    if (words.length === 0) return 0;

    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);
    const avgWordsPerSentence = words.length / Math.max(1, sentences.length);
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch Reading Ease approximation
    const readabilityScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    // Convert to 1-10 scale
    return Math.max(1, Math.min(10, readabilityScore / 10));
  }

  private scoreActionabilityVerbs(text: string): number {
    if (!text || text.length === 0) return 0;

    const actionVerbs = [
      'create', 'implement', 'analyze', 'validate', 'execute', 'deploy',
      'develop', 'build', 'design', 'test', 'configure', 'optimize',
      'review', 'update', 'modify', 'enhance', 'fix', 'resolve',
      'establish', 'coordinate', 'manage', 'monitor', 'track', 'measure'
    ];

    const words = text.toLowerCase().split(/\s+/);
    const actionWordCount = words.filter(word => actionVerbs.includes(word)).length;
    const actionDensity = actionWordCount / Math.max(1, words.length);

    // Check for specific task indicators
    const hasDeadlines = /by|within|before|after|deadline/i.test(text);
    const hasQuantifiableGoals = /\d+|percent|%|all|every|complete/i.test(text);
    const hasAssignments = /responsible|assign|delegate|owner/i.test(text);

    let score = actionDensity * 40; // Base score from action verb density
    if (hasDeadlines) score += 2;
    if (hasQuantifiableGoals) score += 2;
    if (hasAssignments) score += 2;

    return Math.max(1, Math.min(10, score));
  }

  private scoreCompletenessFields(structuredData: Record<string, any>): number {
    if (!structuredData || Object.keys(structuredData).length === 0) return 1;

    const expectedFields = ['task_id', 'priority', 'timeline', 'requirements', 'deliverables'];
    const presentFields = expectedFields.filter(field => structuredData[field] !== undefined);

    const completenessRatio = presentFields.length / expectedFields.length;

    // Bonus for additional valuable fields
    const bonusFields = ['dependencies', 'risks', 'success_criteria', 'resources'];
    const bonusCount = bonusFields.filter(field => structuredData[field] !== undefined).length;

    const baseScore = completenessRatio * 8;
    const bonusScore = (bonusCount / bonusFields.length) * 2;

    return Math.max(1, Math.min(10, baseScore + bonusScore));
  }

  private scoreEfficiencyTokens(example: CommunicationExample): number {
    const communication = example.output.communication;
    const tokenCount = this.countTokens(communication);

    // Efficiency based on information density
    const wordCount = communication.split(/\s+/).length;
    const uniqueWords = new Set(communication.toLowerCase().split(/\s+/)).size;
    const uniquenessRatio = uniqueWords / Math.max(1, wordCount);

    // Penalize excessive length without proportional information
    const lengthPenalty = tokenCount > 500 ? Math.max(0, 1 - ((tokenCount - 500) / 1000)) : 1;

    // Reward high information density
    const densityScore = uniquenessRatio * 10;

    return Math.max(1, Math.min(10, densityScore * lengthPenalty));
  }

  private calculateWeightedScore(clarity: number, actionability: number, completeness: number, efficiency: number): number {
    return (
      clarity * this.config.weights.clarity +
      actionability * this.config.weights.actionability +
      completeness * this.config.weights.completeness +
      efficiency * this.config.weights.efficiency
    );
  }

  private countTokens(text: string): number {
    // Simplified token counting - approximate GPT tokenization
    return Math.ceil(text.length / 4);
  }

  private countSyllables(word: string): number {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord.length <= 3) return 1;

    const vowels = 'aeiouy';
    let syllableCount = 0;
    let prevWasVowel = false;

    for (let i = 0; i < cleanWord.length; i++) {
      const isVowel = vowels.includes(cleanWord[i]);
      if (isVowel && !prevWasVowel) {
        syllableCount++;
      }
      prevWasVowel = isVowel;
    }

    // Handle silent e
    if (cleanWord.endsWith('e') && syllableCount > 1) {
      syllableCount--;
    }

    return Math.max(1, syllableCount);
  }

  private estimateResponseTime(example: CommunicationExample): number {
    const complexity = this.calculateComplexityScore(example);
    const baseTime = 1000; // 1 second base
    return baseTime + (complexity * 100);
  }

  private calculateComplexityScore(example: CommunicationExample): number {
    const communication = example.output.communication;
    const structuredDataFields = Object.keys(example.output.structured_data).length;
    const communicationLength = communication.length;

    return Math.min(10, (communicationLength / 100) + (structuredDataFields / 2));
  }

  private estimateUserSatisfaction(overallScore: number): number {
    // Linear mapping from score to satisfaction
    return Math.max(0, Math.min(1, overallScore / 10));
  }

  private getQualityGrade(score: number): string {
    if (score >= 9) return 'A+';
    if (score >= 8.5) return 'A';
    if (score >= 8) return 'A-';
    if (score >= 7.5) return 'B+';
    if (score >= 7) return 'B';
    if (score >= 6.5) return 'B-';
    if (score >= 6) return 'C+';
    if (score >= 5.5) return 'C';
    if (score >= 5) return 'C-';
    return 'D';
  }

  private identifyStrengths(clarity: number, actionability: number, completeness: number, efficiency: number): string[] {
    const strengths: string[] = [];
    const scores = { clarity, actionability, completeness, efficiency };

    Object.entries(scores).forEach(([dimension, score]) => {
      if (score >= 8) {
        strengths.push(`Excellent ${dimension}`);
      } else if (score >= 7) {
        strengths.push(`Good ${dimension}`);
      }
    });

    return strengths;
  }

  private identifyImprovements(clarity: number, actionability: number, completeness: number, efficiency: number): string[] {
    const improvements: string[] = [];
    const scores = { clarity, actionability, completeness, efficiency };

    Object.entries(scores).forEach(([dimension, score]) => {
      if (score < 6) {
        improvements.push(`Significantly improve ${dimension}`);
      } else if (score < 7.5) {
        improvements.push(`Enhance ${dimension}`);
      }
    });

    return improvements;
  }

  private generateRecommendation(overallScore: number): string {
    if (overallScore >= 8.5) {
      return 'Excellent communication - ready for production use';
    } else if (overallScore >= 7) {
      return 'Good quality - minor improvements needed';
    } else if (overallScore >= 6) {
      return 'Acceptable - requires meaningful improvements';
    } else {
      return 'Needs significant revision before use';
    }
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}