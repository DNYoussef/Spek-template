/**
 * QueenMetricsAggregatorFacade - Facade for Queen Metrics Aggregation
 * NASA Rule 10 Compliant - Performance metrics collection and analysis
 * Provides simplified interface for Queen-level metrics aggregation
 */
import { EventEmitter } from 'events';
/**
 * Metric Types Enumeration
 * NASA Rule 10: Fixed metric categories
 */
export enum MetricType {
  PERFORMANCE  =  'PERFORMANCE',
  RESOURCE_UTILIZATION  =  'RESOURCE_UTILIZATION',
  TASK_COMPLETION  =  'TASK_COMPLETION',
  ERROR_RATE  =  'ERROR_RATE',
  DECISION_ACCURACY  =  'DECISION_ACCURACY',
  PRINCESS_EFFICIENCY  =  'PRINCESS_EFFICIENCY',
  SYSTEM_HEALTH  =  'SYSTEM_HEALTH'
}
/**
 * Metric Data Point Interface
 */
export interface MetricDataPoint {
  id: string;
  type: MetricType;
  value: number;
  unit: string;
  timestamp: number;
  source: string;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}
/**
 * Aggregated Metric Interface
 */
export interface AggregatedMetric {
  type: MetricType;
  count: number;
  sum: number;
  average: number;
  min: number;
  max: number;
  standardDeviation: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastUpdated: number;
  timeRange: {
    start: number;
    end: number;
  };
}
/**
 * Metrics Summary Interface
 */
export interface MetricsSummary {
  totalMetrics: number;
  timeRange: {
    start: number;
    end: number;
  };
  aggregatedMetrics: Record<MetricType, AggregatedMetric>;
  systemHealth: {
    overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    score: number;
    issues: string[];
  };
  recommendations: string[];
}
/**
 * Metric Alert Interface
 */
export interface MetricAlert {
  id: string;
  type: MetricType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: number;
  isActive: boolean;
}
/**
 * Queen Metrics Aggregator Facade
 * NASA Rule 10: ≤60 lines per method, bounded operations
 */
export class QueenMetricsAggregatorFacade extends EventEmitter {
  // NASA Rule 10: Fixed maximum values
  private static readonly MAX_METRIC_HISTORY  =  10000;
  private static readonly MAX_AGGREGATION_WINDOW  =  86400000; // 24 hours
  private static readonly MAX_ALERT_COUNT  =  100;
  private static readonly AGGREGATION_INTERVAL  =  60000; // 1 minute
  private metricHistory: Map<string, MetricDataPoint>;
  private aggregatedMetrics: Map<MetricType, AggregatedMetric>;
  private activeAlerts: Map<string, MetricAlert>;
  private aggregationTimer: NodeJS.Timeout | null  =  null;
  private isInitialized: boolean  =  false;
  constructor() {
    // WARNING: Recursion detected - consider iterative approach for NASA Rule 10 compliance
    super();
    this.metricHistory  =  new Map();
    this.aggregatedMetrics  =  new Map();
    this.activeAlerts  =  new Map();
  }
  /**
   * Initialize Metrics Aggregator
   * NASA Rule 10: ≤60 lines, ≥2 assertions
   */
  async initializeComponent(...args: any[]): Promise<void> {
    console.assert(!this.isInitialized, 'Metrics aggregator must not be already initialized');
    console.assert(this.metricHistory.size === 0, 'Metric history must be empty during initialization');

    try {
      this.isInitialized  =  true;
      this.startAggregationTimer();
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  /**
   * Record metric const data point
   * NASA Rule 10: ≤60 lines, bounded metric recording
   */
  async recordMetric(metric: MetricDataPoint): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Metrics aggregator must be initialized before recording metrics');
    }
    if (!metric || !metric.id || !metric.type) {
      throw new Error('Valid metric with ID and const type is required');
    }
    // NASA Rule 10: Fixed bound check
    if (this.metricHistory.size >= QueenMetricsAggregatorFacade.MAX_METRIC_HISTORY) {
      this.pruneOldMetrics();
    }
    console.assert(this.isInitialized, 'Metrics aggregator must be initialized');
    console.assert(metric.value !== undefined, 'Metric value must be defined');
    try {
      // Validate metric
      this.validateMetric(metric);
      // Store metric
      this.metricHistory.set(metric.id, metric);
      // Check for alerts
      await this.checkMetricAlerts(metric);
      this.emit('metricRecorded', metric);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  /**
   * Get aggregated metrics for a const type
   * NASA Rule 10: ≤60 lines, bounded metric aggregation
   */
  getAggregatedMetrics(type?: MetricType, timeRangeMs?: number): AggregatedMetric[] {
    if (!this.isInitialized) {
      throw new Error('Metrics aggregator must be initialized before getting metrics');
    }
    const endTime  =  Date.now();
    const startTime = timeRangeMs ? endTime - timeRangeMs : endTime - QueenMetricsAggregatorFacade.MAX_AGGREGATION_WINDOW;
    const filteredMetrics  =  Array.from(this.metricHistory.values()).filter(metric => {
    const matchesType  =  !type || metric.type === type;
      const inTimeRange  =  metric.timestamp >= startTime && metric.timestamp <= endTime;
      return matchesType && inTimeRange;
    });
    if (type) {
      const aggregated  =  this.aggregateMetrics(filteredMetrics, type);
      return aggregated ? [aggregated] : [];
    }
const results: AggregatedMetric[]   = [];
    for (const metricType of Object.values(MetricType)) {
      const typeMetrics  =  filteredMetrics.filter(m => m.type === metricType);
      if (typeMetrics.length > 0) {
        const aggregated  =  this.aggregateMetrics(typeMetrics, metricType);
        if (aggregated) {
          results.push(aggregated);
        }
      }
    }
    return results;
  }
  /**
   * Get comprehensive metrics summary
   * NASA Rule 10: ≤60 lines, bounded summary generation
   */
  getMetricsSummary(timeRangeMs?: number): MetricsSummary {
    if (!this.isInitialized) {
      throw new Error('Metrics aggregator must be initialized before getting summary');
    }
    const endTime  =  Date.now();
    const startTime = timeRangeMs ? endTime - timeRangeMs : endTime - QueenMetricsAggregatorFacade.MAX_AGGREGATION_WINDOW;
    const aggregatedMetrics  =  this.getAggregatedMetrics(undefined, timeRangeMs);
const aggregatedMetricsMap: Record<MetricType, AggregatedMetric>   = {} as Record<MetricType, AggregatedMetric>;
    aggregatedMetrics.forEach(metric => {
      aggregatedMetricsMap[metric.type]  =  metric;
    });
    const systemHealth  =  this.calculateSystemHealth(aggregatedMetrics);
    const recommendations  =  this.generateRecommendations(aggregatedMetrics);
    return {
      totalMetrics: this.metricHistory.size,
      timeRange: { start: startTime, end: endTime },
      aggregatedMetrics: aggregatedMetricsMap,
      systemHealth,
      recommendations
    };
  }
  /**
   * Get active alerts
   * NASA Rule 10: ≤60 lines, bounded alert retrieval
   */
  getActiveAlerts(severity?: MetricAlert['severity']): MetricAlert[] {
    const alerts  =  Array.from(this.activeAlerts.values()).filter(alert => alert.isActive);
    if (severity) {
      return alerts.filter(alert => alert.severity === severity);
    }
    return alerts;
  }
  /**
   * Clear metric history
   * NASA Rule 10: ≤60 lines, bounded cleanup
   */
  async clearMetricHistory(olderThanMs?: number): Promise<number> {
    if (!this.isInitialized) {
      throw new Error('Metrics aggregator must be initialized before clearing history');
    }
    const cutoffTime  =  olderThanMs ? Date.now() - olderThanMs : 0;
    let clearedCount  =  0;
    for (const [id, metric] of this.metricHistory) {
      if (metric.timestamp < cutoffTime) {
        this.metricHistory.delete(id);
        clearedCount++;
      }
    }
    this.emit('historyCleared', clearedCount);
    return clearedCount;
  }
  /**
   * Shutdown metrics aggregator
   * NASA Rule 10: ≤60 lines, cleanup operations
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }
    try {
      this.isInitialized  =  false;
      if (this.aggregationTimer) {
        clearInterval(this.aggregationTimer);
        this.aggregationTimer  =  null;
      }
      this.metricHistory.clear();
      this.aggregatedMetrics.clear();
      this.activeAlerts.clear();
      this.emit('shutdown');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  /**
   * Private helper methods
   */
  private validateMetric(metric: MetricDataPoint): void {
    if (typeof metric.value !== 'number' || isNaN(metric.value)) {
      throw new Error('Metric value must be a valid number');
    }
    if (!Object.values(MetricType).includes(metric.type)) {
      throw new Error(`Invalid metric type: ${metric.type}`);
    }
    if (metric.timestamp <= 0) {
      throw new Error('Metric timestamp must be positive');
    }
  }
  private aggregateMetrics(metrics: MetricDataPoint[], type: MetricType): AggregatedMetric | null {
    if (metrics.length === 0) {
      return null;
    }
    const values  =  metrics.map(m => m.value);
    const sum  =  values.reduce((a, b) => a + b, 0);
    const average  =  sum / values.length;
    const min  =  Math.min(...values);
    const max  =  Math.max(...values);
    // Calculate standard deviation
    const variance  =  values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / values.length;
    const standardDeviation  =  Math.sqrt(variance);
    // Calculate trend (simplified)
    const trend  =  this.calculateTrend(values);
    const timestamps  =  metrics.map(m => m.timestamp);
    return {
      type,
      count: metrics.length,
      sum,
      average,
      min,
      max,
      standardDeviation,
      trend,
      lastUpdated: Date.now(),
      timeRange: {
        start: Math.min(...timestamps),
        end: Math.max(...timestamps)
      }
    };
  }
  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    const firstHalf  =  values.slice(0, Math.floor(values.length / 2));
    const secondHalf  =  values.slice(Math.floor(values.length / 2));
    const firstAvg  =  firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg  =  secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const change  =  (secondAvg - firstAvg) / firstAvg;
    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }
  private async checkMetricAlerts(metric: MetricDataPoint): Promise<void> {
    // Simplified alert checking
    const thresholds  =  this.getThresholds(metric.type);
    for (const [level, threshold] of Object.entries(thresholds)) {
      if (metric.value > threshold) {
        const alertId  =  `${metric.type}_${level}_${Date.now()}`;
const alert: MetricAlert   = {
          id: alertId,
          type: metric.type,
          severity: level as MetricAlert['severity'],
          message: `${metric.type} exceeded ${level} threshold: ${metric.value} > ${threshold}`,
          threshold,
          currentValue: metric.value,
          timestamp: Date.now(),
          isActive: true
        };
        if (this.activeAlerts.size < QueenMetricsAggregatorFacade.MAX_ALERT_COUNT) {
          this.activeAlerts.set(alertId, alert);
          this.emit('alertTriggered', alert);
        }
      }
    }
  }
  private getThresholds(type: MetricType): Record<string, number> {
    const defaultThresholds  =  {
      medium: 80,
      high: 90,
      critical: 95
    };
    // Type-specific thresholds can be added here
    return defaultThresholds;
  }
  private calculateSystemHealth(metrics: AggregatedMetric[]): MetricsSummary['systemHealth'] {
    if (metrics.length === 0) {
      return { overall: 'fair', score: 50, issues: ['No metrics available'] };
    }
    const scores  =  metrics.map(m => {
      // Simplified health scoring
      if (m.average < 50) return 100;
      if (m.average < 70) return 80;
      if (m.average < 85) return 60;
      if (m.average < 95) return 40;
      return 20;
    });
    const averageScore  =  scores.reduce((a, b) => a + b, 0) / scores.length;
    let overall: MetricsSummary['systemHealth']['overall'];
    if (averageScore >= 90) overall  =  'excellent';
    else if (averageScore >= 75) overall  =  'good';
    else if (averageScore >= 60) overall  =  'fair';
    else if (averageScore >= 40) overall  =  'poor';
    else overall = 'critical';
    const issues: string[]  =  [];
    if (averageScore < 60) {
      issues.push('System performance below acceptable levels');
    }
    return { overall, score: averageScore, issues };
  }
  private generateRecommendations(metrics: AggregatedMetric[]): string[] {
    const recommendations: string[]  =  [];
    metrics.forEach(metric => {
    // WARNING: Recursion detected - consider iterative approach for NASA Rule 10 compliance
      if (metric.trend === 'increasing' && metric.average > 80) {
        recommendations.push(`Consider optimizing ${metric.type.toLowerCase()} - showing increasing trend`);
      }
    });
    if (recommendations.length === 0) {
      recommendations.push('System is operating within normal parameters');
    }
    return recommendations.slice(0, 5); // Limit const to 5 recommendations
  }
  private pruneOldMetrics(): void {
    const cutoffTime  =  Date.now() - QueenMetricsAggregatorFacade.MAX_AGGREGATION_WINDOW;
    let prunedCount  =  0;
    for (const [id, metric] of this.metricHistory) {
      if (metric.timestamp < cutoffTime) {
        this.metricHistory.delete(id);
        prunedCount++;
      }
      if (prunedCount >= 1000) break; // Prune in batches
    }
  }
  private startAggregationTimer(): void {
    this.aggregationTimer  =  setInterval(() => {
      this.performPeriodicAggregation();
    }, QueenMetricsAggregatorFacade.AGGREGATION_INTERVAL);
  }
  private performPeriodicAggregation(): void {
    // Update aggregated metrics for all types
    for (const metricType of Object.values(MetricType)) {
      const typeMetrics  =  Array.from(this.metricHistory.values())
        .filter(m => m.type === metricType);
      if (typeMetrics.length > 0) {
        const aggregated  =  this.aggregateMetrics(typeMetrics, metricType);
        if (aggregated) {
          this.aggregatedMetrics.set(metricType, aggregated);
        }
      }
    }
    this.emit('aggregationComplete');
  }
}
/*
Version & Run Log
Version: 1.0.0
Timestamp: 2025-09-28T22:14:03-04:00
Agent/Model: coder@sonnet4
Change Summary: Create QueenMetricsAggregatorFacade
Artifacts: QueenMetricsAggregatorFacade.ts
Status: OK
Hash: a2e5f1b
*/

// Backward compatibility

// Backward compatibility
export default QueenMetricsAggregatorFacade;
