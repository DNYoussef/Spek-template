/**
 * Latency Analyzer
 * Identifies and analyzes latency bottlenecks in the SPEK Enhanced platform
 * Provides actionable insights for performance optimization
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';

export interface LatencyMeasurement {
  timestamp: number;
  component: string;
  operation: string;
  latency: number;
  metadata: Record<string, any>;
  traceId?: string;
  spanId?: string;
}

export interface LatencyBottleneck {
  component: string;
  operation: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  maxLatency: number;
  occurrences: number;
  impact: number; // 0-100 scale
  rootCauses: string[];
  recommendations: string[];
  confidence: number; // 0-1 scale
}

export interface LatencyProfile {
  component: string;
  timeRange: {
    start: number;
    end: number;
  };
  measurements: LatencyMeasurement[];
  statistics: {
    count: number;
    mean: number;
    median: number;
    p95: number;
    p99: number;
    standardDeviation: number;
    variance: number;
  };
  trends: {
    direction: 'IMPROVING' | 'DEGRADING' | 'STABLE';
    rate: number; // ms per hour
    confidence: number;
  };
}

export interface LatencyAnalysisResult {
  analysisId: string;
  timestamp: number;
  timeRange: {
    start: number;
    end: number;
  };
  overallLatency: {
    mean: number;
    p95: number;
    p99: number;
    trend: 'IMPROVING' | 'DEGRADING' | 'STABLE';
  };
  componentProfiles: Map<string, LatencyProfile>;
  bottlenecks: LatencyBottleneck[];
  criticalPaths: Array<{
    path: string[];
    totalLatency: number;
    contribution: number; // percentage
  }>;
  recommendations: Array<{
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    action: string;
    expectedImprovement: string;
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  anomalies: Array<{
    timestamp: number;
    component: string;
    operation: string;
    expectedLatency: number;
    actualLatency: number;
    deviation: number;
    possibleCauses: string[];
  }>;
}

export class LatencyAnalyzer extends EventEmitter {
  private measurements: LatencyMeasurement[] = [];
  private componentBaselines: Map<string, Map<string, number>> = new Map();
  private analysisHistory: LatencyAnalysisResult[] = [];
  private activeTraces: Map<string, any> = new Map();

  // Configuration
  private readonly ANALYSIS_WINDOW = 3600000; // 1 hour
  private readonly MIN_SAMPLES = 100;
  private readonly BOTTLENECK_THRESHOLD = 200; // ms
  private readonly ANOMALY_THRESHOLD = 2.0; // 2x standard deviation

  constructor() {
    super();
    this.initializeBaselines();
  }

  /**
   * Record latency measurement
   */
  recordLatency(
    component: string,
    operation: string,
    latency: number,
    metadata: Record<string, any> = {},
    traceId?: string,
    spanId?: string
  ): void {
    const measurement: LatencyMeasurement = {
      timestamp: Date.now(),
      component,
      operation,
      latency,
      metadata,
      traceId,
      spanId
    };

    this.measurements.push(measurement);

    // Update baselines
    this.updateBaseline(component, operation, latency);

    // Check for immediate anomalies
    this.checkForAnomalies(measurement);

    // Emit measurement event
    this.emit('measurement', measurement);

    // Cleanup old measurements
    this.cleanupOldMeasurements();
  }

  /**
   * Start latency trace
   */
  startTrace(component: string, operation: string, metadata: Record<string, any> = {}): string {
    const traceId = `trace_${Date.now()}_${process.pid}_${this.generateTraceId()}`;
    const startTime = performance.now();

    this.activeTraces.set(traceId, {
      component,
      operation,
      startTime,
      metadata,
      spans: []
    });

    return traceId;
  }

  /**
   * End latency trace
   */
  endTrace(traceId: string, additionalMetadata: Record<string, any> = {}): void {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      console.warn(`Unknown trace ID: ${traceId}`);
      return;
    }

    const endTime = performance.now();
    const latency = endTime - trace.startTime;

    this.recordLatency(
      trace.component,
      trace.operation,
      latency,
      { ...trace.metadata, ...additionalMetadata },
      traceId
    );

    this.activeTraces.delete(traceId);
  }

  /**
   * Add span to existing trace
   */
  addSpan(
    traceId: string,
    component: string,
    operation: string,
    startTime: number,
    endTime: number,
    metadata: Record<string, any> = {}
  ): string {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      console.warn(`Unknown trace ID: ${traceId}`);
      return '';
    }

    const spanId = `span_${Date.now()}_${process.pid}_${this.generateSpanId()}`;
    const latency = endTime - startTime;

    const span = {
      spanId,
      component,
      operation,
      startTime,
      endTime,
      latency,
      metadata
    };

    trace.spans.push(span);

    // Record span as separate measurement
    this.recordLatency(component, operation, latency, metadata, traceId, spanId);

    return spanId;
  }

  /**
   * Analyze latency patterns
   */
  async analyzeLatencyPatterns(
    timeRangeMs: number = this.ANALYSIS_WINDOW
  ): Promise<LatencyAnalysisResult> {
    const endTime = Date.now();
    const startTime = endTime - timeRangeMs;

    console.log(`🔍 Analyzing latency patterns from ${new Date(startTime).toISOString()} to ${new Date(endTime).toISOString()}`);

    // Filter measurements within time range
    const relevantMeasurements = this.measurements.filter(m =>
      m.timestamp >= startTime && m.timestamp <= endTime
    );

    if (relevantMeasurements.length < this.MIN_SAMPLES) {
      throw new Error(`Insufficient data: ${relevantMeasurements.length} samples (minimum ${this.MIN_SAMPLES})`);
    }

    const analysisId = `analysis_${Date.now()}`;

    // Generate component profiles
    const componentProfiles = this.generateComponentProfiles(relevantMeasurements, startTime, endTime);

    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(componentProfiles);

    // Analyze critical paths
    const criticalPaths = this.analyzeCriticalPaths(relevantMeasurements);

    // Calculate overall latency statistics
    const overallLatency = this.calculateOverallLatency(relevantMeasurements);

    // Detect anomalies
    const anomalies = this.detectAnomalies(relevantMeasurements);

    // Generate recommendations
    const recommendations = this.generateRecommendations(bottlenecks, criticalPaths, anomalies);

    const result: LatencyAnalysisResult = {
      analysisId,
      timestamp: Date.now(),
      timeRange: { start: startTime, end: endTime },
      overallLatency,
      componentProfiles,
      bottlenecks,
      criticalPaths,
      recommendations,
      anomalies
    };

    // Store analysis result
    this.analysisHistory.push(result);

    // Emit analysis complete event
    this.emit('analysisComplete', result);

    console.log(`✅ Latency analysis complete: ${bottlenecks.length} bottlenecks, ${anomalies.length} anomalies`);

    return result;
  }

  /**
   * Generate component profiles
   */
  private generateComponentProfiles(
    measurements: LatencyMeasurement[],
    startTime: number,
    endTime: number
  ): Map<string, LatencyProfile> {
    const profiles = new Map<string, LatencyProfile>();

    // Group measurements by component
    const componentGroups = new Map<string, LatencyMeasurement[]>();
    for (const measurement of measurements) {
      if (!componentGroups.has(measurement.component)) {
        componentGroups.set(measurement.component, []);
      }
      componentGroups.get(measurement.component)!.push(measurement);
    }

    // Generate profile for each component
    for (const [component, componentMeasurements] of componentGroups) {
      const latencies = componentMeasurements.map(m => m.latency);
      const statistics = this.calculateStatistics(latencies);
      const trends = this.analyzeTrends(componentMeasurements);

      profiles.set(component, {
        component,
        timeRange: { start: startTime, end: endTime },
        measurements: componentMeasurements,
        statistics,
        trends
      });
    }

    return profiles;
  }

  /**
   * Identify performance bottlenecks
   */
  private identifyBottlenecks(componentProfiles: Map<string, LatencyProfile>): LatencyBottleneck[] {
    const bottlenecks: LatencyBottleneck[] = [];

    for (const [component, profile] of componentProfiles) {
      // Group operations within component
      const operationGroups = new Map<string, LatencyMeasurement[]>();
      for (const measurement of profile.measurements) {
        const key = measurement.operation;
        if (!operationGroups.has(key)) {
          operationGroups.set(key, []);
        }
        operationGroups.get(key)!.push(measurement);
      }

      // Analyze each operation
      for (const [operation, measurements] of operationGroups) {
        const latencies = measurements.map(m => m.latency);
        const stats = this.calculateStatistics(latencies);

        // Determine if this is a bottleneck
        if (stats.p95 > this.BOTTLENECK_THRESHOLD || stats.mean > this.BOTTLENECK_THRESHOLD * 0.7) {
          const severity = this.determineSeverity(stats.p95, stats.mean);
          const impact = this.calculateImpact(measurements.length, stats.mean, profile.measurements.length);
          const rootCauses = this.identifyRootCauses(component, operation, stats, measurements);
          const recommendations = this.generateBottleneckRecommendations(component, operation, rootCauses, stats);
          const confidence = this.calculateConfidence(measurements.length, stats.standardDeviation);

          bottlenecks.push({
            component,
            operation,
            severity,
            avgLatency: stats.mean,
            p95Latency: stats.p95,
            p99Latency: stats.p99,
            maxLatency: Math.max(...latencies),
            occurrences: measurements.length,
            impact,
            rootCauses,
            recommendations,
            confidence
          });
        }
      }
    }

    // Sort by impact (descending)
    return bottlenecks.sort((a, b) => b.impact - a.impact);
  }

  /**
   * Analyze critical paths
   */
  private analyzeCriticalPaths(measurements: LatencyMeasurement[]): Array<{
    path: string[];
    totalLatency: number;
    contribution: number;
  }> {
    const criticalPaths: Array<{ path: string[]; totalLatency: number; contribution: number }> = [];

    // Group by trace ID to find request paths
    const traceGroups = new Map<string, LatencyMeasurement[]>();
    for (const measurement of measurements) {
      if (measurement.traceId) {
        if (!traceGroups.has(measurement.traceId)) {
          traceGroups.set(measurement.traceId, []);
        }
        traceGroups.get(measurement.traceId)!.push(measurement);
      }
    }

    const totalLatencySum = measurements.reduce((sum, m) => sum + m.latency, 0);

    // Analyze each trace path
    for (const [traceId, traceMeasurements] of traceGroups) {
      if (traceMeasurements.length > 1) {
        // Sort by timestamp to get execution order
        const sortedMeasurements = traceMeasurements.sort((a, b) => a.timestamp - b.timestamp);
        const path = sortedMeasurements.map(m => `${m.component}:${m.operation}`);
        const totalLatency = sortedMeasurements.reduce((sum, m) => sum + m.latency, 0);
        const contribution = (totalLatency / totalLatencySum) * 100;

        if (totalLatency > this.BOTTLENECK_THRESHOLD) {
          criticalPaths.push({ path, totalLatency, contribution });
        }
      }
    }

    // Sort by total latency (descending)
    return criticalPaths.sort((a, b) => b.totalLatency - a.totalLatency).slice(0, 10);
  }

  /**
   * Calculate overall latency statistics
   */
  private calculateOverallLatency(measurements: LatencyMeasurement[]): {
    mean: number;
    p95: number;
    p99: number;
    trend: 'IMPROVING' | 'DEGRADING' | 'STABLE';
  } {
    const latencies = measurements.map(m => m.latency);
    const stats = this.calculateStatistics(latencies);
    const trend = this.calculateOverallTrend(measurements);

    return {
      mean: stats.mean,
      p95: stats.p95,
      p99: stats.p99,
      trend
    };
  }

  /**
   * Detect latency anomalies
   */
  private detectAnomalies(measurements: LatencyMeasurement[]): Array<{
    timestamp: number;
    component: string;
    operation: string;
    expectedLatency: number;
    actualLatency: number;
    deviation: number;
    possibleCauses: string[];
  }> {
    const anomalies: Array<{
      timestamp: number;
      component: string;
      operation: string;
      expectedLatency: number;
      actualLatency: number;
      deviation: number;
      possibleCauses: string[];
    }> = [];

    // Group by component and operation
    const operationGroups = new Map<string, LatencyMeasurement[]>();
    for (const measurement of measurements) {
      const key = `${measurement.component}:${measurement.operation}`;
      if (!operationGroups.has(key)) {
        operationGroups.set(key, []);
      }
      operationGroups.get(key)!.push(measurement);
    }

    // Detect anomalies within each operation group
    for (const [key, groupMeasurements] of operationGroups) {
      if (groupMeasurements.length < 10) continue; // Need minimum samples

      const [component, operation] = key.split(':');
      const latencies = groupMeasurements.map(m => m.latency);
      const stats = this.calculateStatistics(latencies);
      const threshold = stats.mean + (this.ANOMALY_THRESHOLD * stats.standardDeviation);

      for (const measurement of groupMeasurements) {
        if (measurement.latency > threshold) {
          const deviation = (measurement.latency - stats.mean) / stats.standardDeviation;
          const possibleCauses = this.identifyAnomalyCauses(measurement, stats);

          anomalies.push({
            timestamp: measurement.timestamp,
            component,
            operation,
            expectedLatency: stats.mean,
            actualLatency: measurement.latency,
            deviation,
            possibleCauses
          });
        }
      }
    }

    return anomalies.sort((a, b) => b.deviation - a.deviation);
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    bottlenecks: LatencyBottleneck[],
    criticalPaths: Array<{ path: string[]; totalLatency: number; contribution: number }>,
    anomalies: Array<{ timestamp: number; component: string; operation: string; expectedLatency: number; actualLatency: number; deviation: number; possibleCauses: string[] }>
  ): Array<{
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    action: string;
    expectedImprovement: string;
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
  }> {
    const recommendations: Array<{
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      action: string;
      expectedImprovement: string;
      effort: 'LOW' | 'MEDIUM' | 'HIGH';
    }> = [];

    // High-impact bottleneck recommendations
    const criticalBottlenecks = bottlenecks.filter(b => b.severity === 'CRITICAL' || b.severity === 'HIGH');
    for (const bottleneck of criticalBottlenecks.slice(0, 3)) {
      recommendations.push({
        priority: 'HIGH',
        action: `Optimize ${bottleneck.component}:${bottleneck.operation} - ${bottleneck.recommendations[0]}`,
        expectedImprovement: `Reduce P95 latency by ${Math.round((bottleneck.p95Latency - 100) / bottleneck.p95Latency * 100)}%`,
        effort: bottleneck.recommendations.length > 2 ? 'HIGH' : 'MEDIUM'
      });
    }

    // Critical path optimization
    const topCriticalPaths = criticalPaths.slice(0, 2);
    for (const path of topCriticalPaths) {
      recommendations.push({
        priority: 'MEDIUM',
        action: `Optimize critical path: ${path.path.join(' → ')}`,
        expectedImprovement: `Reduce end-to-end latency by ${Math.round(path.contribution)}%`,
        effort: 'MEDIUM'
      });
    }

    // Anomaly prevention
    if (anomalies.length > 10) {
      const topComponents = this.getTopAnomalyComponents(anomalies);
      recommendations.push({
        priority: 'MEDIUM',
        action: `Implement anomaly detection and circuit breakers for ${topComponents.join(', ')}`,
        expectedImprovement: 'Reduce P99 latency spikes by 40-60%',
        effort: 'HIGH'
      });
    }

    // General optimization recommendations
    if (bottlenecks.length > 5) {
      recommendations.push({
        priority: 'LOW',
        action: 'Implement global request timeout and retry policies',
        expectedImprovement: 'Improve overall system reliability by 15-25%',
        effort: 'LOW'
      });
    }

    return recommendations;
  }

  /**
   * Helper methods
   */
  private calculateStatistics(values: number[]): {
    count: number;
    mean: number;
    median: number;
    p95: number;
    p99: number;
    standardDeviation: number;
    variance: number;
  } {
    if (values.length === 0) {
      return { count: 0, mean: 0, median: 0, p95: 0, p99: 0, standardDeviation: 0, variance: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / count;
    const median = this.calculatePercentile(sorted, 50);
    const p95 = this.calculatePercentile(sorted, 95);
    const p99 = this.calculatePercentile(sorted, 99);

    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
    const standardDeviation = Math.sqrt(variance);

    return { count, mean, median, p95, p99, standardDeviation, variance };
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedValues.length - 1);
    if (Number.isInteger(index)) {
      return sortedValues[index];
    }
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  private determineSeverity(p95: number, mean: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (p95 > 1000 || mean > 500) return 'CRITICAL';
    if (p95 > 500 || mean > 300) return 'HIGH';
    if (p95 > 300 || mean > 200) return 'MEDIUM';
    return 'LOW';
  }

  private calculateImpact(occurrences: number, avgLatency: number, totalMeasurements: number): number {
    const frequency = (occurrences / totalMeasurements) * 100;
    const severity = Math.min(100, avgLatency / 10);
    return Math.min(100, (frequency * 0.4) + (severity * 0.6));
  }

  private identifyRootCauses(
    component: string,
    operation: string,
    stats: any,
    measurements: LatencyMeasurement[]
  ): string[] {
    const causes: string[] = [];

    // High variance indicates inconsistent performance
    if (stats.standardDeviation > stats.mean * 0.5) {
      causes.push('High latency variance - investigate resource contention');
    }

    // Very high P99 compared to mean indicates outliers
    if (stats.p99 > stats.mean * 3) {
      causes.push('Frequent latency spikes - implement timeout handling');
    }

    // Component-specific analysis
    if (component.includes('Princess') || component.includes('Queen')) {
      causes.push('Coordination overhead - consider agent pooling');
    }

    if (component.includes('Memory') || component.includes('Cache')) {
      causes.push('Memory allocation/GC issues - optimize memory usage');
    }

    if (component.includes('Network') || component.includes('Communication')) {
      causes.push('Network latency - implement connection pooling');
    }

    return causes.length > 0 ? causes : ['Unknown root cause - requires deeper investigation'];
  }

  private generateBottleneckRecommendations(
    component: string,
    operation: string,
    rootCauses: string[],
    stats: any
  ): string[] {
    const recommendations: string[] = [];

    for (const cause of rootCauses) {
      if (cause.includes('variance')) {
        recommendations.push('Implement request queuing and load balancing');
      } else if (cause.includes('spikes')) {
        recommendations.push('Add circuit breakers and graceful degradation');
      } else if (cause.includes('coordination')) {
        recommendations.push('Optimize agent communication protocols');
      } else if (cause.includes('memory')) {
        recommendations.push('Implement object pooling and optimize GC settings');
      } else if (cause.includes('network')) {
        recommendations.push('Enable HTTP/2 and implement connection multiplexing');
      }
    }

    return recommendations.length > 0 ? recommendations : ['Profile operation for specific optimizations'];
  }

  private calculateConfidence(sampleSize: number, standardDeviation: number): number {
    // Higher sample size and lower deviation = higher confidence
    const sizeConfidence = Math.min(1, sampleSize / 1000);
    const stabilityConfidence = Math.max(0, 1 - (standardDeviation / 200));
    return (sizeConfidence + stabilityConfidence) / 2;
  }

  private analyzeTrends(measurements: LatencyMeasurement[]): {
    direction: 'IMPROVING' | 'DEGRADING' | 'STABLE';
    rate: number;
    confidence: number;
  } {
    if (measurements.length < 10) {
      return { direction: 'STABLE', rate: 0, confidence: 0 };
    }

    // Simple linear regression to find trend
    const n = measurements.length;
    const timePoints = measurements.map((_, i) => i);
    const latencies = measurements.map(m => m.latency);

    const sumX = timePoints.reduce((sum, x) => sum + x, 0);
    const sumY = latencies.reduce((sum, y) => sum + y, 0);
    const sumXY = timePoints.reduce((sum, x, i) => sum + x * latencies[i], 0);
    const sumXX = timePoints.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const rate = slope * 3600; // Convert to per hour

    const direction = slope > 5 ? 'DEGRADING' : slope < -5 ? 'IMPROVING' : 'STABLE';
    const confidence = Math.min(1, n / 100);

    return { direction, rate, confidence };
  }

  private calculateOverallTrend(measurements: LatencyMeasurement[]): 'IMPROVING' | 'DEGRADING' | 'STABLE' {
    const windowSize = Math.floor(measurements.length / 3);
    if (windowSize < 10) return 'STABLE';

    const sortedMeasurements = measurements.sort((a, b) => a.timestamp - b.timestamp);
    const firstWindow = sortedMeasurements.slice(0, windowSize);
    const lastWindow = sortedMeasurements.slice(-windowSize);

    const firstAvg = firstWindow.reduce((sum, m) => sum + m.latency, 0) / firstWindow.length;
    const lastAvg = lastWindow.reduce((sum, m) => sum + m.latency, 0) / lastWindow.length;

    const change = ((lastAvg - firstAvg) / firstAvg) * 100;

    if (change > 10) return 'DEGRADING';
    if (change < -10) return 'IMPROVING';
    return 'STABLE';
  }

  private identifyAnomalyCauses(measurement: LatencyMeasurement, stats: any): string[] {
    const causes: string[] = [];

    // Check metadata for clues
    if (measurement.metadata.retryCount > 0) {
      causes.push('Multiple retries detected');
    }

    if (measurement.metadata.queueTime > 100) {
      causes.push('High queue waiting time');
    }

    if (measurement.metadata.memoryPressure) {
      causes.push('Memory pressure detected');
    }

    // Time-based analysis
    const hour = new Date(measurement.timestamp).getHours();
    if (hour >= 9 && hour <= 17) {
      causes.push('Peak usage hours - resource contention');
    }

    return causes.length > 0 ? causes : ['Isolated performance spike'];
  }

  private getTopAnomalyComponents(anomalies: Array<{ component: string }>): string[] {
    const componentCounts = new Map<string, number>();

    for (const anomaly of anomalies) {
      componentCounts.set(anomaly.component, (componentCounts.get(anomaly.component) || 0) + 1);
    }

    return Array.from(componentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([component]) => component);
  }

  private initializeBaselines(): void {
    // Initialize with expected baseline latencies for different components
    const baselineData = [
      { component: 'CoordinationPrincess', operation: 'processTask', baseline: 50 },
      { component: 'HivePrincess', operation: 'spawnAgent', baseline: 100 },
      { component: 'MemorySystem', operation: 'store', baseline: 10 },
      { component: 'MemorySystem', operation: 'retrieve', baseline: 5 },
      { component: 'VectorOperations', operation: 'add', baseline: 2 },
      { component: 'QualityGates', operation: 'validate', baseline: 200 }
    ];

    for (const { component, operation, baseline } of baselineData) {
      if (!this.componentBaselines.has(component)) {
        this.componentBaselines.set(component, new Map());
      }
      this.componentBaselines.get(component)!.set(operation, baseline);
    }
  }

  private updateBaseline(component: string, operation: string, latency: number): void {
    if (!this.componentBaselines.has(component)) {
      this.componentBaselines.set(component, new Map());
    }

    const componentMap = this.componentBaselines.get(component)!;
    const currentBaseline = componentMap.get(operation) || latency;

    // Exponential moving average with α = 0.1
    const newBaseline = currentBaseline * 0.9 + latency * 0.1;
    componentMap.set(operation, newBaseline);
  }

  private checkForAnomalies(measurement: LatencyMeasurement): void {
    const baseline = this.componentBaselines.get(measurement.component)?.get(measurement.operation);
    if (!baseline) return;

    const deviationFactor = measurement.latency / baseline;
    if (deviationFactor > 3) {
      this.emit('anomaly', {
        measurement,
        baseline,
        deviationFactor,
        severity: deviationFactor > 5 ? 'CRITICAL' : 'HIGH'
      });
    }
  }

  private cleanupOldMeasurements(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.measurements = this.measurements.filter(m => m.timestamp > cutoffTime);

    // Also cleanup analysis history
    if (this.analysisHistory.length > 100) {
      this.analysisHistory = this.analysisHistory.slice(-50);
    }
  }

  /**
   * Get recent analysis results
   */
  getRecentAnalysis(count: number = 5): LatencyAnalysisResult[] {
    return this.analysisHistory.slice(-count);
  }

  /**
   * Get component baseline
   */
  getBaseline(component: string, operation: string): number | undefined {
    return this.componentBaselines.get(component)?.get(operation);
  }

  /**
   * Get current measurements count
   */
  getMeasurementCount(): number {
    return this.measurements.length;
  }

  /**
   * Export measurements for analysis
   */
  exportMeasurements(startTime?: number, endTime?: number): LatencyMeasurement[] {
    let measurements = this.measurements;

    if (startTime) {
      measurements = measurements.filter(m => m.timestamp >= startTime);
    }

    if (endTime) {
      measurements = measurements.filter(m => m.timestamp <= endTime);
    }

    return measurements;
  }
}

export default LatencyAnalyzer;

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-01-27T22:15:32-05:00 | performance-benchmarker@Claude Sonnet 4 | Created comprehensive latency analyzer with bottleneck detection, anomaly identification, and optimization recommendations | LatencyAnalyzer.ts | OK | Features tracing, statistical analysis, trend detection, critical path analysis, and actionable optimization insights | 0.00 | 7c5e3a8 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: latency-analyzer-implementation-001
 * - inputs: ["Latency measurement patterns", "Bottleneck detection algorithms", "Optimization recommendation engine"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4","prompt":"latency-analyzer-comprehensive-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */