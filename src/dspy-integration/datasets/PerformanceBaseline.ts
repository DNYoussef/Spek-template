/**
 * Baseline measurements for optimization targets and A/B testing
 * Tracks current system performance for DSPy optimization comparison
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { PerformanceMetrics, BaselineSnapshot, OptimizationTarget } from '~types/DatasetTypes';
import { CommunicationType } from './CommunicationExampleDataset';

export interface BaselineConfig {
  measurement_window_hours: number;
  min_samples_for_baseline: number;
  confidence_interval: number; // 0.95 for 95% confidence
  performance_targets: {
    response_time_p95: number; // ms
    user_satisfaction_target: number; // 0-1
    quality_score_target: number; // 1-10
    token_efficiency_target: number; // tokens per effective action
  };
}

export class PerformanceBaseline {
  private config: BaselineConfig;
  private baselines: Map<string, BaselineSnapshot> = new Map();
  private measurements: Map<string, PerformanceMetrics[]> = new Map();
  private dataPath: string;

  constructor(dataPath: string = '.claude/.artifacts/dspy-datasets', config?: Partial<BaselineConfig>) {
    this.dataPath = dataPath;
    this.config = {
      measurement_window_hours: 24,
      min_samples_for_baseline: 30,
      confidence_interval: 0.95,
      performance_targets: {
        response_time_p95: 2000, // 2 seconds
        user_satisfaction_target: 0.85,
        quality_score_target: 7.5,
        token_efficiency_target: 50 // tokens per action
      },
      ...config
    };
  }

  /**
   * Record performance measurement for baseline calculation
   * NASA Rule 10: ≤60 lines, fixed bounds, ≥2 assertions
   */
  async recordMeasurement(
    communicationType: CommunicationType,
    metrics: PerformanceMetrics,
    context?: Record<string, any>
  ): Promise<void> {
    assert(communicationType.length > 0, 'Communication type required');
    assert(metrics.response_time_ms >= 0, 'Valid response time required');

    const key = this.getBaselineKey(communicationType, context);

    if (!this.measurements.has(key)) {
      this.measurements.set(key, []);
    }

    const measurements = this.measurements.get(key)!;
    measurements.push({
      ...metrics,
      timestamp: new Date().toISOString()
    });

    // Keep only measurements within the window
    const cutoffTime = Date.now() - (this.config.measurement_window_hours * 60 * 60 * 1000);
    this.measurements.set(key, measurements.filter(m =>
      new Date(m.timestamp).getTime() > cutoffTime
    ));

    // Update baseline if we have enough samples
    const filteredMeasurements = this.measurements.get(key)!;
    if (filteredMeasurements.length >= this.config.min_samples_for_baseline) {
      await this.updateBaseline(key, filteredMeasurements);
    }

    // Persist measurements
    await this.saveMeasurements();
  }

  /**
   * Get current baseline for communication type
   */
  getBaseline(communicationType: CommunicationType, context?: Record<string, any>): BaselineSnapshot | null {
    const key = this.getBaselineKey(communicationType, context);
    return this.baselines.get(key) || null;
  }

  /**
   * Calculate optimization targets based on current baselines
   */
  getOptimizationTargets(communicationType: CommunicationType): OptimizationTarget[] {
    const baseline = this.getBaseline(communicationType);
    if (!baseline) {
      return this.getDefaultTargets();
    }

    const targets: OptimizationTarget[] = [];

    // Response time optimization
    if (baseline.metrics.response_time_p95 > this.config.performance_targets.response_time_p95) {
      targets.push({
        metric: 'response_time',
        current_value: baseline.metrics.response_time_p95,
        target_value: this.config.performance_targets.response_time_p95,
        improvement_percentage: ((baseline.metrics.response_time_p95 - this.config.performance_targets.response_time_p95) / baseline.metrics.response_time_p95) * 100,
        priority: 'high',
        estimated_effort: this.estimateOptimizationEffort('response_time', baseline.metrics.response_time_p95)
      });
    }

    // User satisfaction optimization
    if (baseline.metrics.user_satisfaction_avg < this.config.performance_targets.user_satisfaction_target) {
      targets.push({
        metric: 'user_satisfaction',
        current_value: baseline.metrics.user_satisfaction_avg,
        target_value: this.config.performance_targets.user_satisfaction_target,
        improvement_percentage: ((this.config.performance_targets.user_satisfaction_target - baseline.metrics.user_satisfaction_avg) / baseline.metrics.user_satisfaction_avg) * 100,
        priority: 'high',
        estimated_effort: this.estimateOptimizationEffort('user_satisfaction', baseline.metrics.user_satisfaction_avg)
      });
    }

    // Quality score optimization
    if (baseline.metrics.quality_score_avg < this.config.performance_targets.quality_score_target) {
      targets.push({
        metric: 'quality_score',
        current_value: baseline.metrics.quality_score_avg,
        target_value: this.config.performance_targets.quality_score_target,
        improvement_percentage: ((this.config.performance_targets.quality_score_target - baseline.metrics.quality_score_avg) / baseline.metrics.quality_score_avg) * 100,
        priority: 'medium',
        estimated_effort: this.estimateOptimizationEffort('quality_score', baseline.metrics.quality_score_avg)
      });
    }

    // Token efficiency optimization
    if (baseline.metrics.token_efficiency_avg > this.config.performance_targets.token_efficiency_target) {
      targets.push({
        metric: 'token_efficiency',
        current_value: baseline.metrics.token_efficiency_avg,
        target_value: this.config.performance_targets.token_efficiency_target,
        improvement_percentage: ((baseline.metrics.token_efficiency_avg - this.config.performance_targets.token_efficiency_target) / baseline.metrics.token_efficiency_avg) * 100,
        priority: 'low',
        estimated_effort: this.estimateOptimizationEffort('token_efficiency', baseline.metrics.token_efficiency_avg)
      });
    }

    return targets;
  }

  /**
   * Compare two performance snapshots for A/B testing
   */
  comparePerformance(
    baseline: BaselineSnapshot,
    comparison: BaselineSnapshot,
    significanceLevel: number = 0.05
  ): {
    is_significant: boolean;
    improvement_percentage: Record<string, number>;
    confidence_intervals: Record<string, { lower: number; upper: number }>;
    recommendation: string;
  } {
    assert(baseline.sample_count >= this.config.min_samples_for_baseline, 'Insufficient baseline samples');
    assert(comparison.sample_count >= this.config.min_samples_for_baseline, 'Insufficient comparison samples');

    const metrics = ['response_time_avg', 'user_satisfaction_avg', 'quality_score_avg', 'token_efficiency_avg'];
    const improvements: Record<string, number> = {};
    const confidenceIntervals: Record<string, { lower: number; upper: number }> = {};

    let significantImprovements = 0;
    let totalMetrics = 0;

    for (const metric of metrics) {
      const baselineValue = baseline.metrics[metric as keyof typeof baseline.metrics] as number;
      const comparisonValue = comparison.metrics[metric as keyof typeof comparison.metrics] as number;

      if (baselineValue > 0) {
        const improvement = ((comparisonValue - baselineValue) / baselineValue) * 100;
        improvements[metric] = improvement;

        // Calculate confidence interval (simplified)
        const standardError = this.calculateStandardError(baseline, comparison, metric);
        const tValue = this.getTValue(significanceLevel, baseline.sample_count + comparison.sample_count - 2);
        const marginOfError = tValue * standardError;

        confidenceIntervals[metric] = {
          lower: improvement - marginOfError,
          upper: improvement + marginOfError
        };

        // Check for statistical significance
        if (Math.abs(improvement) > marginOfError) {
          if ((metric === 'response_time_avg' && improvement < 0) || // Lower is better
              (metric !== 'response_time_avg' && improvement > 0)) { // Higher is better
            significantImprovements++;
          }
        }

        totalMetrics++;
      }
    }

    const isSignificant = significantImprovements >= (totalMetrics / 2);

    let recommendation: string;
    if (isSignificant) {
      if (significantImprovements === totalMetrics) {
        recommendation = 'Deploy immediately - significant improvements across all metrics';
      } else {
        recommendation = 'Deploy with monitoring - mixed results require careful observation';
      }
    } else {
      recommendation = 'Do not deploy - insufficient improvement or potential regression';
    }

    return {
      is_significant: isSignificant,
      improvement_percentage: improvements,
      confidence_intervals: confidenceIntervals,
      recommendation
    };
  }

  /**
   * Get performance trends over time
   */
  getPerformanceTrends(communicationType: CommunicationType, days: number = 7): {
    trend_direction: 'improving' | 'stable' | 'declining';
    trend_strength: number; // 0-1
    key_changes: Array<{
      date: string;
      metric: string;
      change_percentage: number;
      significance: 'high' | 'medium' | 'low';
    }>;
  } {
    const measurements = this.measurements.get(communicationType) || [];
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentMeasurements = measurements.filter(m =>
      new Date(m.timestamp).getTime() > cutoffTime
    );

    if (recentMeasurements.length < 10) {
      return {
        trend_direction: 'stable',
        trend_strength: 0,
        key_changes: []
      };
    }

    // Calculate daily averages
    const dailyAverages = this.calculateDailyAverages(recentMeasurements);
    const trendSlope = this.calculateTrendSlope(dailyAverages);

    let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';
    if (trendSlope > 0.1) trendDirection = 'improving';
    else if (trendSlope < -0.1) trendDirection = 'declining';

    const trendStrength = Math.min(1, Math.abs(trendSlope));

    // Identify key changes
    const keyChanges = this.identifyKeyChanges(dailyAverages);

    return {
      trend_direction: trendDirection,
      trend_strength: trendStrength,
      key_changes: keyChanges
    };
  }

  /**
   * Load existing baselines and measurements from disk
   */
  async loadBaselines(): Promise<void> {
    try {
      const baselinePath = join(this.dataPath, 'performance-baselines.json');
      const measurementPath = join(this.dataPath, 'performance-measurements.json');

      // Load baselines
      try {
        const baselineData = await fs.readFile(baselinePath, 'utf-8');
        const baselines = JSON.parse(baselineData);
        this.baselines = new Map(Object.entries(baselines));
      } catch {
        // File doesn't exist, start fresh
      }

      // Load measurements
      try {
        const measurementData = await fs.readFile(measurementPath, 'utf-8');
        const measurements = JSON.parse(measurementData);
        this.measurements = new Map(Object.entries(measurements));
      } catch {
        // File doesn't exist, start fresh
      }
    } catch (error) {
      console.error('Error loading baselines:', error);
    }
  }

  /**
   * Save baselines and measurements to disk
   */
  async saveBaselines(): Promise<void> {
    try {
      const baselinePath = join(this.dataPath, 'performance-baselines.json');
      const measurementPath = join(this.dataPath, 'performance-measurements.json');

      // Save baselines
      const baselineData = Object.fromEntries(this.baselines);
      await fs.writeFile(baselinePath, JSON.stringify(baselineData, null, 2));

      // Save measurements
      const measurementData = Object.fromEntries(this.measurements);
      await fs.writeFile(measurementPath, JSON.stringify(measurementData, null, 2));
    } catch (error) {
      console.error('Error saving baselines:', error);
    }
  }

  // Private helper methods

  private getBaselineKey(communicationType: CommunicationType, context?: Record<string, any>): string {
    // Include relevant context factors in the key
    const contextKey = context ? JSON.stringify(context) : '';
    return `${communicationType}_${contextKey}`;
  }

  private async updateBaseline(key: string, measurements: PerformanceMetrics[]): Promise<void> {
    const sortedByResponseTime = [...measurements].sort((a, b) => a.response_time_ms - b.response_time_ms);
    const p95Index = Math.floor(measurements.length * 0.95);

    const baseline: BaselineSnapshot = {
      communication_type: key.split('_')[0] as CommunicationType,
      created_date: new Date().toISOString(),
      sample_count: measurements.length,
      measurement_window_hours: this.config.measurement_window_hours,
      metrics: {
        response_time_avg: this.average(measurements.map(m => m.response_time_ms)),
        response_time_p95: sortedByResponseTime[Math.min(p95Index, measurements.length - 1)].response_time_ms,
        user_satisfaction_avg: this.average(measurements.map(m => m.user_satisfaction_estimate)),
        quality_score_avg: this.average(measurements.map(m => m.complexity_score)), // Using complexity as proxy for quality
        token_efficiency_avg: this.average(measurements.map(m => m.token_count)),
        success_rate: measurements.filter(m => m.user_satisfaction_estimate > 0.7).length / measurements.length
      },
      confidence_intervals: this.calculateConfidenceIntervals(measurements),
      last_updated: new Date().toISOString()
    };

    this.baselines.set(key, baseline);
  }

  private async saveMeasurements(): Promise<void> {
    // Periodically save measurements (implement throttling in production)
    if (Math.random() < 0.1) { // Save 10% of the time to avoid excessive I/O
      await this.saveBaselines();
    }
  }

  private getDefaultTargets(): OptimizationTarget[] {
    return [
      {
        metric: 'response_time',
        current_value: 0,
        target_value: this.config.performance_targets.response_time_p95,
        improvement_percentage: 0,
        priority: 'high',
        estimated_effort: 'medium'
      }
    ];
  }

  private estimateOptimizationEffort(metric: string, currentValue: number): 'low' | 'medium' | 'high' {
    const targets = this.config.performance_targets;

    switch (metric) {
      case 'response_time':
        return currentValue > targets.response_time_p95 * 2 ? 'high' : 'medium';
      case 'user_satisfaction':
        return currentValue < targets.user_satisfaction_target * 0.7 ? 'high' : 'medium';
      default:
        return 'medium';
    }
  }

  private calculateStandardError(baseline: BaselineSnapshot, comparison: BaselineSnapshot, metric: string): number {
    // Simplified standard error calculation
    const pooledVariance = 0.1; // Assume 10% variance for simplification
    return Math.sqrt(pooledVariance * (1 / baseline.sample_count + 1 / comparison.sample_count));
  }

  private getTValue(significanceLevel: number, degreesOfFreedom: number): number {
    // Simplified t-value lookup (use proper statistical library in production)
    return significanceLevel <= 0.05 ? 1.96 : 1.645;
  }

  private average(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private calculateConfidenceIntervals(measurements: PerformanceMetrics[]): Record<string, { lower: number; upper: number }> {
    // Simplified confidence interval calculation
    const responseTimeAvg = this.average(measurements.map(m => m.response_time_ms));
    const responseTimeStd = this.standardDeviation(measurements.map(m => m.response_time_ms));

    return {
      response_time: {
        lower: responseTimeAvg - (1.96 * responseTimeStd),
        upper: responseTimeAvg + (1.96 * responseTimeStd)
      }
    };
  }

  private standardDeviation(values: number[]): number {
    const avg = this.average(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(this.average(squareDiffs));
  }

  private calculateDailyAverages(measurements: PerformanceMetrics[]): Array<{ date: string; avg_score: number }> {
    const dailyGroups = measurements.reduce((groups, measurement) => {
      const date = new Date(measurement.timestamp).toISOString().split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(measurement);
      return groups;
    }, {} as Record<string, PerformanceMetrics[]>);

    return Object.entries(dailyGroups).map(([date, dayMeasurements]) => ({
      date,
      avg_score: this.average(dayMeasurements.map(m => m.user_satisfaction_estimate))
    }));
  }

  private calculateTrendSlope(dailyAverages: Array<{ date: string; avg_score: number }>): number {
    if (dailyAverages.length < 2) return 0;

    // Simple linear regression slope
    const n = dailyAverages.length;
    const sumX = dailyAverages.reduce((sum, _, index) => sum + index, 0);
    const sumY = dailyAverages.reduce((sum, item) => sum + item.avg_score, 0);
    const sumXY = dailyAverages.reduce((sum, item, index) => sum + (index * item.avg_score), 0);
    const sumXX = dailyAverages.reduce((sum, _, index) => sum + (index * index), 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private identifyKeyChanges(dailyAverages: Array<{ date: string; avg_score: number }>): Array<{
    date: string;
    metric: string;
    change_percentage: number;
    significance: 'high' | 'medium' | 'low';
  }> {
    const changes: any[] = [];

    for (let i = 1; i < dailyAverages.length; i++) {
      const current = dailyAverages[i];
      const previous = dailyAverages[i - 1];
      const changePercentage = ((current.avg_score - previous.avg_score) / previous.avg_score) * 100;

      if (Math.abs(changePercentage) > 5) {
        let significance: 'high' | 'medium' | 'low' = 'low';
        if (Math.abs(changePercentage) > 20) significance = 'high';
        else if (Math.abs(changePercentage) > 10) significance = 'medium';

        changes.push({
          date: current.date,
          metric: 'user_satisfaction',
          change_percentage: changePercentage,
          significance
        });
      }
    }

    return changes;
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}