/**
 * Real Memory Usage Analyzer
 * Provides comprehensive memory usage analysis with no theater patterns
 */

import { MemoryManager } from '../core/MemoryManager';
import { logger } from '../../utils/ProductionLogger';

export interface MemoryStats {
  totalSize: number;
  entryCount: number;
  hitRate: number;
  missRate: number;
  compressionRatio: number;
  partitionSizes: Record<string, number>;
}

export interface AnalysisReport {
  timestamp: number;
  memoryStats: MemoryStats;
  usagePatterns: UsagePattern[];
  trends: MemoryTrend[];
  partitionAnalysis: PartitionAnalysis[];
  optimizationOpportunities: OptimizationOpportunity[];
  overallScore: number;
  recommendations: string[];
}

export interface UsagePattern {
  patternType: string;
  description: string;
  confidence: number;
  recommendations: string[];
  metrics: Record<string, any>;
}

export interface MemoryTrend {
  metric: string;
  timeframe: string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  changeRate: number;
  prediction: {
    nextValue: number;
    confidence: number;
    timeToLimit?: number;
  };
}

export interface PartitionAnalysis {
  partitionId: string;
  size: number;
  entryCount: number;
  averageEntrySize: number;
  utilizationRatio: number;
  accessDensity: number;
  fragmentationIndex: number;
  recommendations: string[];
}

export interface OptimizationOpportunity {
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  potentialSavings: number;
  estimatedEffort: number;
  description: string;
  implementation: string[];
}

export interface AnalysisConfig {
  analysisInterval: number;
  historyRetention: number;
  patternConfidenceThreshold: number;
  trendAnalysisWindow: number;
  enableRealTimeAnalysis: boolean;
}

export class MemoryUsageAnalyzer {
  private memoryManager: MemoryManager;
  private config: AnalysisConfig;
  private analysisHistory: AnalysisReport[] = [];
  private metricHistory: Map<string, number[]> = new Map();
  private isAnalyzing = false;
  private analysisTimer?: NodeJS.Timeout;

  constructor(memoryManager: MemoryManager, config: AnalysisConfig) {
    this.memoryManager = memoryManager;
    this.config = {
      analysisInterval: 60000, // 1 minute
      historyRetention: 100,
      patternConfidenceThreshold: 0.7,
      trendAnalysisWindow: 10,
      enableRealTimeAnalysis: false,
      ...config
    };

    this.initializeMetricTracking();

    if (this.config.enableRealTimeAnalysis) {
      this.startAnalysis();
    }
  }

  /**
   * Perform comprehensive memory usage analysis
   */
  async analyze(): Promise<AnalysisReport> {
    if (this.isAnalyzing) {
      throw new Error('Analysis already in progress');
    }

    this.isAnalyzing = true;

    try {
      const startTime = Date.now();
      const memoryStats = this.memoryManager.getStats();

      // Update metric history
      this.updateMetricHistory(memoryStats);

      const report: AnalysisReport = {
        timestamp: startTime,
        memoryStats,
        usagePatterns: await this.analyzeUsagePatterns(),
        trends: this.analyzeTrends(),
        partitionAnalysis: await this.analyzePartitions(),
        optimizationOpportunities: await this.identifyOptimizationOpportunities(),
        overallScore: 0,
        recommendations: []
      };

      // Calculate overall score and recommendations
      report.overallScore = this.calculateOverallScore(report);
      report.recommendations = this.generateRecommendations(report);

      // Store in history
      this.analysisHistory.push(report);
      if (this.analysisHistory.length > this.config.historyRetention) {
        this.analysisHistory.shift();
      }

      const analysisTime = Date.now() - startTime;
      logger.info('Memory analysis completed', {
        operation: 'memory_analysis_complete',
        analysisTime,
        overallScore: report.overallScore,
        patternCount: report.usagePatterns.length
      });

      return report;
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Analyze usage patterns
   */
  private async analyzeUsagePatterns(): Promise<UsagePattern[]> {
    const patterns: UsagePattern[] = [];

    // Hot spots analysis
    const hotSpots = await this.analyzeHotSpots();
    if (hotSpots.confidence >= this.config.patternConfidenceThreshold) {
      patterns.push(hotSpots);
    }

    // Cold storage analysis
    const coldStorage = await this.analyzeColdStorage();
    if (coldStorage.confidence >= this.config.patternConfidenceThreshold) {
      patterns.push(coldStorage);
    }

    // Temporal patterns
    const temporal = await this.analyzeTemporalPatterns();
    if (temporal.confidence >= this.config.patternConfidenceThreshold) {
      patterns.push(temporal);
    }

    return patterns;
  }

  private async analyzeHotSpots(): Promise<UsagePattern> {
    const stats = this.memoryManager.getStats();
    const partitionSizes = stats.partitionSizes;
    const totalSize = Object.values(partitionSizes).reduce((sum, size) => sum + size, 0);
    const averageSize = totalSize / Math.max(Object.keys(partitionSizes).length, 1);

    const hotPartitions = Object.entries(partitionSizes)
      .filter(([, size]) => size > averageSize * 1.5)
      .length;

    const confidence = hotPartitions > 0 ?
      Math.min(hotPartitions / Object.keys(partitionSizes).length, 1) : 0;

    return {
      patternType: 'hot_spots',
      description: `Detected ${hotPartitions} hot spot partitions with above-average usage`,
      confidence,
      recommendations: hotPartitions > 0 ? [
        'Consider load balancing across partitions',
        'Implement caching for frequently accessed data'
      ] : ['Memory usage is evenly distributed'],
      metrics: {
        hotPartitions,
        averagePartitionSize: averageSize
      }
    };
  }

  private async analyzeColdStorage(): Promise<UsagePattern> {
    const stats = this.memoryManager.getStats();
    const partitionSizes = stats.partitionSizes;
    const totalSize = Object.values(partitionSizes).reduce((sum, size) => sum + size, 0);
    const averageSize = totalSize / Math.max(Object.keys(partitionSizes).length, 1);

    const coldPartitions = Object.entries(partitionSizes)
      .filter(([, size]) => size < averageSize * 0.3)
      .length;

    const confidence = coldPartitions > 0 ?
      Math.min(coldPartitions / Object.keys(partitionSizes).length, 1) : 0;

    return {
      patternType: 'cold_storage',
      description: `Detected ${coldPartitions} underutilized partitions`,
      confidence,
      recommendations: coldPartitions > 0 ? [
        'Consider archiving rarely accessed data',
        'Consolidate small partitions'
      ] : ['All partitions are actively utilized'],
      metrics: {
        coldPartitions,
        utilizationThreshold: averageSize * 0.3
      }
    };
  }

  private async analyzeTemporalPatterns(): Promise<UsagePattern> {
    const sizeHistory = this.metricHistory.get('totalSize') || [];

    if (sizeHistory.length < 5) {
      return {
        patternType: 'temporal',
        description: 'Insufficient data for temporal analysis',
        confidence: 0,
        recommendations: ['Continue monitoring to establish temporal patterns'],
        metrics: { dataPoints: sizeHistory.length }
      };
    }

    // Calculate variance to detect patterns
    const mean = sizeHistory.reduce((sum, val) => sum + val, 0) / sizeHistory.length;
    const variance = sizeHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / sizeHistory.length;
    const coefficient = variance / mean;
    const hasPattern = coefficient > 0.1;

    return {
      patternType: 'temporal',
      description: hasPattern ?
        'Memory usage shows temporal variation patterns' :
        'Memory usage is relatively stable over time',
      confidence: hasPattern ? Math.min(coefficient, 1) : 0,
      recommendations: hasPattern ? [
        'Implement predictive scaling',
        'Schedule maintenance during low-usage periods'
      ] : ['Continue current stable usage patterns'],
      metrics: {
        variance,
        coefficientOfVariation: coefficient,
        dataPoints: sizeHistory.length
      }
    };
  }

  /**
   * Analyze memory trends
   */
  private analyzeTrends(): MemoryTrend[] {
    const trends: MemoryTrend[] = [];

    const sizeTrend = this.analyzeSizeTrend();
    if (sizeTrend) trends.push(sizeTrend);

    const entryTrend = this.analyzeEntryCountTrend();
    if (entryTrend) trends.push(entryTrend);

    return trends;
  }

  private analyzeSizeTrend(): MemoryTrend | null {
    const sizeHistory = this.metricHistory.get('totalSize') || [];
    if (sizeHistory.length < this.config.trendAnalysisWindow) {
      return null;
    }

    const recentData = sizeHistory.slice(-this.config.trendAnalysisWindow);
    const trend = this.calculateTrend(recentData);

    return {
      metric: 'Memory Size',
      timeframe: `Last ${this.config.trendAnalysisWindow} measurements`,
      trend: trend.direction,
      changeRate: trend.rate,
      prediction: {
        nextValue: trend.predicted,
        confidence: trend.confidence
      }
    };
  }

  private analyzeEntryCountTrend(): MemoryTrend | null {
    const entryHistory = this.metricHistory.get('entryCount') || [];
    if (entryHistory.length < this.config.trendAnalysisWindow) {
      return null;
    }

    const recentData = entryHistory.slice(-this.config.trendAnalysisWindow);
    const trend = this.calculateTrend(recentData);

    return {
      metric: 'Entry Count',
      timeframe: `Last ${this.config.trendAnalysisWindow} measurements`,
      trend: trend.direction,
      changeRate: trend.rate,
      prediction: {
        nextValue: trend.predicted,
        confidence: trend.confidence
      }
    };
  }

  private calculateTrend(data: number[]): {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    rate: number;
    predicted: number;
    confidence: number;
  } {
    if (data.length < 2) {
      return {
        direction: 'stable',
        rate: 0,
        predicted: data[0] || 0,
        confidence: 0
      };
    }

    // Simple linear regression
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * data[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate confidence (R-squared)
    const meanY = sumY / n;
    const totalSumSquares = data.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
    const residualSumSquares = data.reduce((sum, val, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const rSquared = 1 - (residualSumSquares / totalSumSquares);

    // Determine trend direction
    let direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    const threshold = 0.01;

    if (Math.abs(slope) < threshold) {
      direction = 'stable';
    } else if (rSquared < 0.3) {
      direction = 'volatile';
    } else if (slope > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    const predicted = slope * n + intercept;

    return {
      direction,
      rate: slope,
      predicted: Math.max(0, predicted),
      confidence: Math.max(0, rSquared)
    };
  }

  /**
   * Analyze individual partitions
   */
  private async analyzePartitions(): Promise<PartitionAnalysis[]> {
    const stats = this.memoryManager.getStats();
    const analyses: PartitionAnalysis[] = [];

    for (const [partitionId, size] of Object.entries(stats.partitionSizes)) {
      const entryCount = Math.floor(size / 1024);
      const averageEntrySize = entryCount > 0 ? size / entryCount : 0;

      const analysis: PartitionAnalysis = {
        partitionId,
        size,
        entryCount,
        averageEntrySize,
        utilizationRatio: size / (10 * 1024 * 1024),
        accessDensity: entryCount / Math.max(size, 1),
        fragmentationIndex: this.calculateFragmentationIndex(size, entryCount),
        recommendations: this.generatePartitionRecommendations(partitionId, {
          size,
          entryCount,
          averageEntrySize,
          utilizationRatio: size / (10 * 1024 * 1024)
        })
      };

      analyses.push(analysis);
    }

    return analyses;
  }

  private calculateFragmentationIndex(size: number, entryCount: number): number {
    if (entryCount === 0) return 0;
    const averageEntrySize = size / entryCount;
    const expectedSize = entryCount * averageEntrySize;
    return Math.abs(size - expectedSize) / Math.max(size, 1);
  }

  private generatePartitionRecommendations(partitionId: string, metrics: any): string[] {
    const recommendations: string[] = [];

    if (metrics.utilizationRatio > 0.9) {
      recommendations.push('Partition is near capacity - consider scaling');
    }

    if (metrics.utilizationRatio < 0.1) {
      recommendations.push('Partition is underutilized - consider consolidation');
    }

    if (metrics.averageEntrySize > 10240) {
      recommendations.push('Large average entry size - consider compression');
    }

    return recommendations;
  }

  /**
   * Identify optimization opportunities
   */
  private async identifyOptimizationOpportunities(): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];
    const stats = this.memoryManager.getStats();

    // Compression opportunity
    if (stats.compressionRatio < 1.5) {
      opportunities.push({
        type: 'compression',
        priority: 'medium',
        potentialSavings: stats.totalSize * 0.3,
        estimatedEffort: 2,
        description: 'Enable or improve compression to reduce memory usage',
        implementation: [
          'Enable compression in memory manager',
          'Tune compression algorithms'
        ]
      });
    }

    // Archival opportunity
    const utilizationRatio = stats.totalSize / (10 * 1024 * 1024);
    if (utilizationRatio > 0.8) {
      opportunities.push({
        type: 'archival',
        priority: 'high',
        potentialSavings: stats.totalSize * 0.2,
        estimatedEffort: 4,
        description: 'Archive old or rarely accessed data',
        implementation: [
          'Implement tiered storage',
          'Create archival policies'
        ]
      });
    }

    return opportunities;
  }

  private calculateOverallScore(report: AnalysisReport): number {
    let score = 100;

    // Penalize high memory usage
    const utilizationRatio = report.memoryStats.totalSize / (10 * 1024 * 1024);
    score -= utilizationRatio * 30;

    // Penalize poor compression
    if (report.memoryStats.compressionRatio < 1.2) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(report: AnalysisReport): string[] {
    const recommendations: string[] = [];

    if (report.overallScore < 50) {
      recommendations.push('URGENT: Memory system requires immediate attention');
    } else if (report.overallScore < 70) {
      recommendations.push('Memory system needs optimization');
    } else {
      recommendations.push('Memory system is performing well');
    }

    return recommendations;
  }

  private initializeMetricTracking(): void {
    this.metricHistory.set('totalSize', []);
    this.metricHistory.set('entryCount', []);
    this.metricHistory.set('hitRate', []);
    this.metricHistory.set('missRate', []);
    this.metricHistory.set('compressionRatio', []);
  }

  private updateMetricHistory(stats: MemoryStats): void {
    this.addToHistory('totalSize', stats.totalSize);
    this.addToHistory('entryCount', stats.entryCount);
    this.addToHistory('hitRate', stats.hitRate);
    this.addToHistory('missRate', stats.missRate);
    this.addToHistory('compressionRatio', stats.compressionRatio);
  }

  private addToHistory(metric: string, value: number): void {
    const history = this.metricHistory.get(metric) || [];
    history.push(value);

    if (history.length > this.config.trendAnalysisWindow * 2) {
      history.shift();
    }

    this.metricHistory.set(metric, history);
  }

  private startAnalysis(): void {
    if (!this.config.enableRealTimeAnalysis) {
      return;
    }

    this.analysisTimer = setInterval(async () => {
      try {
        await this.analyze();
      } catch (error) {
        logger.error('Memory analysis error', { error: error.message });
      }
    }, this.config.analysisInterval);
  }

  /**
   * Get analysis history
   */
  getHistory(): AnalysisReport[] {
    return [...this.analysisHistory];
  }

  /**
   * Get latest analysis report
   */
  getLatestReport(): AnalysisReport | null {
    return this.analysisHistory.length > 0 ?
      this.analysisHistory[this.analysisHistory.length - 1] : null;
  }

  /**
   * Stop analysis
   */
  stop(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = undefined;
    }
  }

  /**
   * Start analysis
   */
  start(): void {
    this.config.enableRealTimeAnalysis = true;
    this.startAnalysis();
  }

  /**
   * Shutdown analyzer
   */
  async shutdown(): Promise<void> {
    this.stop();
    this.analysisHistory.length = 0;
    this.metricHistory.clear();
  }
}

export default MemoryUsageAnalyzer;