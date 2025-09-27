/**
 * Continuous Monitoring Framework for Ongoing Phase 7 Validation
 * Provides real-time monitoring and validation of Phase 7 Princess systems including:
 * - Real-time Health Checks for all Princess systems
 * - Performance Alerts for degradation detection
 * - Error Detection with proactive notification
 * - Capacity Planning based on usage patterns
 * - Trend Analysis for long-term system optimization
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/testing-library/jest-dom';
import { InfrastructurePrincess } from '../../src/swarm/hierarchy/domains/InfrastructurePrincess';
import { ResearchPrincess } from '../../src/swarm/hierarchy/domains/ResearchPrincess';
import { QualityPrincess } from '../../src/swarm/hierarchy/domains/QualityPrincess';
import { DocumentationPrincess } from '../../src/swarm/hierarchy/domains/DocumentationPrincess';
import { MemoryCoordinator } from '../../src/swarm/memory/MemoryCoordinator';
import { LangGraphStateManager } from '../../src/swarm/state/LangGraphStateManager';
import { SwarmQueen } from '../../src/swarm/hierarchy/SwarmQueen';
import { PerformanceMonitor } from '../../src/utils/PerformanceMonitor';
import { AlertManager } from '../../src/utils/AlertManager';
import { MetricsCollector } from '../../src/utils/MetricsCollector';

interface MonitoringMetrics {
  timestamp: number;
  systemHealth: number;
  performanceScore: number;
  errorRate: number;
  capacityUtilization: number;
  responseTime: number;
  throughput: number;
  memoryEfficiency: number;
  stateConsistency: number;
}

interface AlertThreshold {
  metric: string;
  warningLevel: number;
  criticalLevel: number;
  timeWindow: number; // in milliseconds
  consecutiveFailures: number;
}

interface TrendData {
  metric: string;
  values: number[];
  timestamps: number[];
  trend: 'improving' | 'stable' | 'degrading';
  projection: number;
}

export class ContinuousMonitoringFramework {
  private infrastructurePrincess: InfrastructurePrincess;
  private researchPrincess: ResearchPrincess;
  private qualityPrincess: QualityPrincess;
  private documentationPrincess: DocumentationPrincess;
  private memoryCoordinator: MemoryCoordinator;
  private stateManager: LangGraphStateManager;
  private swarmQueen: SwarmQueen;
  private performanceMonitor: PerformanceMonitor;
  private alertManager: AlertManager;
  private metricsCollector: MetricsCollector;

  private monitoringActive: boolean = false;
  private monitoringInterval: number = 30000; // 30 seconds
  private metricsHistory: MonitoringMetrics[] = [];
  private alertThresholds: AlertThreshold[] = [];
  private trendData: Map<string, TrendData> = new Map();

  constructor() {
    this.infrastructurePrincess = new InfrastructurePrincess();
    this.researchPrincess = new ResearchPrincess();
    this.qualityPrincess = new QualityPrincess();
    this.documentationPrincess = new DocumentationPrincess();
    this.memoryCoordinator = new MemoryCoordinator();
    this.stateManager = new LangGraphStateManager();
    this.swarmQueen = new SwarmQueen();
    this.performanceMonitor = new PerformanceMonitor();
    this.alertManager = new AlertManager();
    this.metricsCollector = new MetricsCollector();

    this.initializeAlertThresholds();
  }

  /**
   * Initialize the continuous monitoring framework
   */
  async initializeMonitoring(): Promise<{
    success: boolean;
    monitoringId: string;
    startTime: number;
    configuration: any;
  }> {
    console.log('[Continuous Monitoring] Initializing monitoring framework...');

    try {
      // Initialize all monitoring components
      await this.performanceMonitor.initialize();
      await this.alertManager.initialize();
      await this.metricsCollector.initialize();

      // Setup monitoring configuration
      const configuration = {
        interval: this.monitoringInterval,
        alertThresholds: this.alertThresholds.length,
        metricsCollected: this.getMetricsList().length,
        components: [
          'InfrastructurePrincess',
          'ResearchPrincess',
          'QualityPrincess',
          'DocumentationPrincess',
          'MemoryCoordinator',
          'LangGraphStateManager',
          'SwarmQueen'
        ]
      };

      const monitoringId = `monitoring-${Date.now()}`;
      const startTime = Date.now();

      console.log(`[Continuous Monitoring] Framework initialized with ID: ${monitoringId}`);

      return {
        success: true,
        monitoringId,
        startTime,
        configuration
      };
    } catch (error) {
      console.error('[Continuous Monitoring] Initialization failed:', error);
      return {
        success: false,
        monitoringId: '',
        startTime: 0,
        configuration: null
      };
    }
  }

  /**
   * Start continuous monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.monitoringActive) {
      console.warn('[Continuous Monitoring] Monitoring already active');
      return;
    }

    console.log('[Continuous Monitoring] Starting continuous monitoring...');
    this.monitoringActive = true;

    // Start monitoring loop
    this.runMonitoringLoop();

    // Start trend analysis
    this.startTrendAnalysis();

    // Start capacity planning
    this.startCapacityPlanning();
  }

  /**
   * Stop continuous monitoring
   */
  async stopMonitoring(): Promise<{
    success: boolean;
    duration: number;
    metricsCollected: number;
    alertsGenerated: number;
  }> {
    if (!this.monitoringActive) {
      console.warn('[Continuous Monitoring] Monitoring not active');
      return { success: false, duration: 0, metricsCollected: 0, alertsGenerated: 0 };
    }

    console.log('[Continuous Monitoring] Stopping continuous monitoring...');
    this.monitoringActive = false;

    const metricsCollected = this.metricsHistory.length;
    const alertsGenerated = await this.alertManager.getAlertCount();
    const duration = this.metricsHistory.length > 0 ?
      Date.now() - this.metricsHistory[0].timestamp : 0;

    return {
      success: true,
      duration,
      metricsCollected,
      alertsGenerated
    };
  }

  /**
   * Run the main monitoring loop
   */
  private async runMonitoringLoop(): Promise<void> {
    while (this.monitoringActive) {
      try {
        // Collect current metrics
        const metrics = await this.collectSystemMetrics();

        // Store metrics history
        this.metricsHistory.push(metrics);

        // Keep only last 1000 metrics (about 8 hours at 30s intervals)
        if (this.metricsHistory.length > 1000) {
          this.metricsHistory.shift();
        }

        // Check alert thresholds
        await this.checkAlertThresholds(metrics);

        // Update trend data
        this.updateTrendData(metrics);

        // Log current status
        this.logMonitoringStatus(metrics);

      } catch (error) {
        console.error('[Continuous Monitoring] Error in monitoring loop:', error);
        await this.alertManager.sendAlert({
          severity: 'critical',
          message: 'Monitoring loop error',
          details: error.message,
          timestamp: Date.now()
        });
      }

      // Wait for next monitoring interval
      await new Promise(resolve => setTimeout(resolve, this.monitoringInterval));
    }
  }

  /**
   * Collect comprehensive system metrics
   */
  private async collectSystemMetrics(): Promise<MonitoringMetrics> {
    const timestamp = Date.now();

    // Princess health checks
    const infrastructureHealth = await this.checkPrincessHealth('infrastructure');
    const researchHealth = await this.checkPrincessHealth('research');
    const qualityHealth = await this.checkPrincessHealth('quality');
    const documentationHealth = await this.checkPrincessHealth('documentation');

    // Memory coordinator metrics
    const memoryMetrics = await this.collectMemoryMetrics();

    // State manager metrics
    const stateMetrics = await this.collectStateMetrics();

    // Performance metrics
    const performanceMetrics = await this.collectPerformanceMetrics();

    // Calculate overall system health
    const systemHealth = this.calculateSystemHealth([
      infrastructureHealth,
      researchHealth,
      qualityHealth,
      documentationHealth,
      memoryMetrics.health,
      stateMetrics.health
    ]);

    return {
      timestamp,
      systemHealth,
      performanceScore: performanceMetrics.score,
      errorRate: performanceMetrics.errorRate,
      capacityUtilization: performanceMetrics.capacityUtilization,
      responseTime: performanceMetrics.averageResponseTime,
      throughput: performanceMetrics.throughput,
      memoryEfficiency: memoryMetrics.efficiency,
      stateConsistency: stateMetrics.consistency
    };
  }

  /**
   * Check individual Princess health
   */
  private async checkPrincessHealth(princessType: string): Promise<number> {
    try {
      const princess = this.getPrincessByType(princessType);

      // Perform health check task
      const healthCheckTask = {
        id: `health-check-${princessType}-${Date.now()}`,
        type: 'health_check',
        priority: 'high',
        timeout: 5000 // 5 second timeout
      };

      const startTime = Date.now();
      const result = await princess.executeTask(healthCheckTask);
      const responseTime = Date.now() - startTime;

      // Calculate health score based on success and response time
      if (result.success) {
        if (responseTime < 1000) return 100; // Excellent
        if (responseTime < 2000) return 90;  // Good
        if (responseTime < 5000) return 75;  // Fair
        return 60; // Poor but functional
      } else {
        return 0; // Failed
      }
    } catch (error) {
      console.error(`[Monitoring] Health check failed for ${princessType}:`, error);
      return 0;
    }
  }

  /**
   * Collect memory coordinator metrics
   */
  private async collectMemoryMetrics(): Promise<any> {
    try {
      const memoryStatus = await this.memoryCoordinator.getStatus();
      const poolInfo = await this.memoryCoordinator.getPoolInfo();

      const efficiency = ((poolInfo.totalSize - poolInfo.usedSize) / poolInfo.totalSize) * 100;
      const fragmentationScore = Math.max(0, 100 - poolInfo.fragmentation);
      const health = Math.min(efficiency, fragmentationScore);

      return {
        efficiency,
        fragmentation: poolInfo.fragmentation,
        health,
        usedMemory: poolInfo.usedSize,
        availableMemory: poolInfo.freeSize
      };
    } catch (error) {
      console.error('[Monitoring] Memory metrics collection failed:', error);
      return { efficiency: 0, fragmentation: 100, health: 0, usedMemory: 0, availableMemory: 0 };
    }
  }

  /**
   * Collect state manager metrics
   */
  private async collectStateMetrics(): Promise<any> {
    try {
      const stateStatus = await this.stateManager.getStatus();
      const consistencyCheck = await this.stateManager.checkGlobalConsistency();

      const health = consistencyCheck.consistent ? 100 : 50;
      const activeStates = stateStatus.activeMachines || 0;

      return {
        consistency: consistencyCheck.score || 100,
        health,
        activeStateMachines: activeStates,
        transitionsPerSecond: stateStatus.transitionsPerSecond || 0
      };
    } catch (error) {
      console.error('[Monitoring] State metrics collection failed:', error);
      return { consistency: 0, health: 0, activeStateMachines: 0, transitionsPerSecond: 0 };
    }
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(): Promise<any> {
    try {
      // Get system performance data
      const cpuUsage = process.cpuUsage();
      const memoryUsage = process.memoryUsage();

      // Calculate performance metrics
      const cpuScore = Math.max(0, 100 - ((cpuUsage.user + cpuUsage.system) / 1000000 / 10));
      const memoryScore = Math.max(0, 100 - (memoryUsage.heapUsed / memoryUsage.heapTotal * 100));

      // API performance testing
      const apiPerformance = await this.testAPIPerformance();

      const performanceScore = (cpuScore + memoryScore + apiPerformance.score) / 3;

      return {
        score: performanceScore,
        errorRate: apiPerformance.errorRate,
        capacityUtilization: Math.max(
          (memoryUsage.heapUsed / memoryUsage.heapTotal * 100),
          (100 - cpuScore)
        ),
        averageResponseTime: apiPerformance.averageResponseTime,
        throughput: apiPerformance.throughput
      };
    } catch (error) {
      console.error('[Monitoring] Performance metrics collection failed:', error);
      return { score: 0, errorRate: 100, capacityUtilization: 100, averageResponseTime: 5000, throughput: 0 };
    }
  }

  /**
   * Test API performance across all Princesses
   */
  private async testAPIPerformance(): Promise<any> {
    const princesses = [
      { name: 'infrastructure', instance: this.infrastructurePrincess },
      { name: 'research', instance: this.researchPrincess },
      { name: 'quality', instance: this.qualityPrincess },
      { name: 'documentation', instance: this.documentationPrincess }
    ];

    let totalResponseTime = 0;
    let successfulRequests = 0;
    let totalRequests = 0;

    for (const princess of princesses) {
      try {
        const startTime = Date.now();

        const result = await princess.instance.executeTask({
          id: `perf-test-${princess.name}-${Date.now()}`,
          type: 'performance_test',
          priority: 'low',
          timeout: 2000
        });

        const responseTime = Date.now() - startTime;
        totalResponseTime += responseTime;

        if (result.success) {
          successfulRequests++;
        }

        totalRequests++;
      } catch (error) {
        totalRequests++;
        totalResponseTime += 2000; // Assume timeout
      }
    }

    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 5000;
    const errorRate = totalRequests > 0 ? ((totalRequests - successfulRequests) / totalRequests) * 100 : 100;
    const throughput = totalRequests > 0 ? (successfulRequests / (totalResponseTime / 1000)) : 0;

    // Calculate performance score
    let score = 100;
    if (averageResponseTime > 200) score -= 20;
    if (averageResponseTime > 500) score -= 30;
    if (errorRate > 5) score -= 25;
    if (errorRate > 10) score -= 25;

    return {
      averageResponseTime,
      errorRate,
      throughput,
      score: Math.max(0, score)
    };
  }

  /**
   * Check alert thresholds and send notifications
   */
  private async checkAlertThresholds(metrics: MonitoringMetrics): Promise<void> {
    for (const threshold of this.alertThresholds) {
      const metricValue = this.getMetricValue(metrics, threshold.metric);

      if (metricValue <= threshold.criticalLevel) {
        await this.alertManager.sendAlert({
          severity: 'critical',
          metric: threshold.metric,
          value: metricValue,
          threshold: threshold.criticalLevel,
          message: `Critical threshold exceeded for ${threshold.metric}`,
          timestamp: metrics.timestamp,
          details: { metrics, threshold }
        });
      } else if (metricValue <= threshold.warningLevel) {
        await this.alertManager.sendAlert({
          severity: 'warning',
          metric: threshold.metric,
          value: metricValue,
          threshold: threshold.warningLevel,
          message: `Warning threshold exceeded for ${threshold.metric}`,
          timestamp: metrics.timestamp,
          details: { metrics, threshold }
        });
      }
    }
  }

  /**
   * Update trend analysis data
   */
  private updateTrendData(metrics: MonitoringMetrics): void {
    const metricsList = this.getMetricsList();

    for (const metricName of metricsList) {
      const value = this.getMetricValue(metrics, metricName);

      if (!this.trendData.has(metricName)) {
        this.trendData.set(metricName, {
          metric: metricName,
          values: [],
          timestamps: [],
          trend: 'stable',
          projection: value
        });
      }

      const trendData = this.trendData.get(metricName)!;
      trendData.values.push(value);
      trendData.timestamps.push(metrics.timestamp);

      // Keep only last 100 data points for trend analysis
      if (trendData.values.length > 100) {
        trendData.values.shift();
        trendData.timestamps.shift();
      }

      // Calculate trend
      if (trendData.values.length >= 10) {
        trendData.trend = this.calculateTrend(trendData.values);
        trendData.projection = this.projectFutureValue(trendData.values);
      }
    }
  }

  /**
   * Start trend analysis monitoring
   */
  private async startTrendAnalysis(): Promise<void> {
    setInterval(() => {
      if (!this.monitoringActive) return;

      this.analyzeTrends();
    }, 300000); // Every 5 minutes
  }

  /**
   * Analyze trends and generate insights
   */
  private analyzeTrends(): void {
    console.log('[Trend Analysis] Running trend analysis...');

    for (const [metricName, trendData] of this.trendData) {
      if (trendData.trend === 'degrading') {
        this.alertManager.sendAlert({
          severity: 'warning',
          metric: metricName,
          message: `Degrading trend detected for ${metricName}`,
          timestamp: Date.now(),
          details: {
            trend: trendData.trend,
            projection: trendData.projection,
            currentValue: trendData.values[trendData.values.length - 1]
          }
        });
      }
    }
  }

  /**
   * Start capacity planning monitoring
   */
  private async startCapacityPlanning(): Promise<void> {
    setInterval(() => {
      if (!this.monitoringActive) return;

      this.performCapacityPlanning();
    }, 900000); // Every 15 minutes
  }

  /**
   * Perform capacity planning analysis
   */
  private performCapacityPlanning(): void {
    console.log('[Capacity Planning] Analyzing capacity requirements...');

    if (this.metricsHistory.length < 10) return; // Need sufficient data

    const recentMetrics = this.metricsHistory.slice(-20); // Last 20 data points

    // Analyze capacity utilization trends
    const avgCapacityUtilization = recentMetrics.reduce((sum, m) => sum + m.capacityUtilization, 0) / recentMetrics.length;
    const maxCapacityUtilization = Math.max(...recentMetrics.map(m => m.capacityUtilization));

    // Generate capacity alerts
    if (avgCapacityUtilization > 80) {
      this.alertManager.sendAlert({
        severity: 'warning',
        metric: 'capacity_utilization',
        message: 'High average capacity utilization detected',
        timestamp: Date.now(),
        details: {
          averageUtilization: avgCapacityUtilization,
          maxUtilization: maxCapacityUtilization,
          recommendation: 'Consider scaling resources'
        }
      });
    }

    if (maxCapacityUtilization > 95) {
      this.alertManager.sendAlert({
        severity: 'critical',
        metric: 'capacity_utilization',
        message: 'Critical capacity utilization reached',
        timestamp: Date.now(),
        details: {
          maxUtilization: maxCapacityUtilization,
          recommendation: 'Immediate scaling required'
        }
      });
    }
  }

  /**
   * Generate monitoring report
   */
  async generateMonitoringReport(): Promise<{
    summary: any;
    currentMetrics: MonitoringMetrics | null;
    trendAnalysis: any;
    alerts: any;
    recommendations: string[];
  }> {
    const currentMetrics = this.metricsHistory.length > 0 ?
      this.metricsHistory[this.metricsHistory.length - 1] : null;

    const summary = this.generateSummary();
    const trendAnalysis = this.generateTrendAnalysis();
    const alerts = await this.alertManager.getRecentAlerts(24); // Last 24 hours
    const recommendations = this.generateRecommendations();

    return {
      summary,
      currentMetrics,
      trendAnalysis,
      alerts,
      recommendations
    };
  }

  /**
   * Helper Methods
   */
  private initializeAlertThresholds(): void {
    this.alertThresholds = [
      { metric: 'systemHealth', warningLevel: 80, criticalLevel: 70, timeWindow: 300000, consecutiveFailures: 2 },
      { metric: 'performanceScore', warningLevel: 70, criticalLevel: 50, timeWindow: 300000, consecutiveFailures: 3 },
      { metric: 'errorRate', warningLevel: 5, criticalLevel: 10, timeWindow: 300000, consecutiveFailures: 2 },
      { metric: 'responseTime', warningLevel: 500, criticalLevel: 1000, timeWindow: 300000, consecutiveFailures: 3 },
      { metric: 'memoryEfficiency', warningLevel: 90, criticalLevel: 85, timeWindow: 300000, consecutiveFailures: 2 },
      { metric: 'capacityUtilization', warningLevel: 80, criticalLevel: 95, timeWindow: 300000, consecutiveFailures: 2 }
    ];
  }

  private getPrincessByType(type: string): any {
    switch (type) {
      case 'infrastructure': return this.infrastructurePrincess;
      case 'research': return this.researchPrincess;
      case 'quality': return this.qualityPrincess;
      case 'documentation': return this.documentationPrincess;
      default: throw new Error(`Unknown princess type: ${type}`);
    }
  }

  private calculateSystemHealth(healthScores: number[]): number {
    return healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;
  }

  private getMetricsList(): string[] {
    return [
      'systemHealth',
      'performanceScore',
      'errorRate',
      'capacityUtilization',
      'responseTime',
      'throughput',
      'memoryEfficiency',
      'stateConsistency'
    ];
  }

  private getMetricValue(metrics: MonitoringMetrics, metricName: string): number {
    switch (metricName) {
      case 'systemHealth': return metrics.systemHealth;
      case 'performanceScore': return metrics.performanceScore;
      case 'errorRate': return metrics.errorRate;
      case 'capacityUtilization': return metrics.capacityUtilization;
      case 'responseTime': return metrics.responseTime;
      case 'throughput': return metrics.throughput;
      case 'memoryEfficiency': return metrics.memoryEfficiency;
      case 'stateConsistency': return metrics.stateConsistency;
      default: return 0;
    }
  }

  private calculateTrend(values: number[]): 'improving' | 'stable' | 'degrading' {
    if (values.length < 5) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (changePercent > 5) return 'improving';
    if (changePercent < -5) return 'degrading';
    return 'stable';
  }

  private projectFutureValue(values: number[]): number {
    if (values.length < 3) return values[values.length - 1];

    // Simple linear projection
    const recentValues = values.slice(-5);
    const trend = (recentValues[recentValues.length - 1] - recentValues[0]) / recentValues.length;

    return recentValues[recentValues.length - 1] + (trend * 3); // Project 3 periods ahead
  }

  private generateSummary(): any {
    if (this.metricsHistory.length === 0) {
      return { status: 'No data available' };
    }

    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    const dataPoints = this.metricsHistory.length;
    const timeSpan = dataPoints > 1 ?
      latest.timestamp - this.metricsHistory[0].timestamp : 0;

    return {
      status: 'Active',
      dataPoints,
      timeSpan: Math.round(timeSpan / 1000 / 60), // minutes
      currentHealth: latest.systemHealth,
      averagePerformance: this.metricsHistory.reduce((sum, m) => sum + m.performanceScore, 0) / dataPoints
    };
  }

  private generateTrendAnalysis(): any {
    const trends: any = {};

    for (const [metricName, trendData] of this.trendData) {
      trends[metricName] = {
        trend: trendData.trend,
        projection: trendData.projection,
        currentValue: trendData.values[trendData.values.length - 1] || 0
      };
    }

    return trends;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metricsHistory.length === 0) {
      return ['Insufficient data for recommendations'];
    }

    const latest = this.metricsHistory[this.metricsHistory.length - 1];

    if (latest.systemHealth < 80) {
      recommendations.push('System health is below optimal - investigate Princess performance');
    }

    if (latest.errorRate > 5) {
      recommendations.push('Error rate is elevated - review error logs and Princess stability');
    }

    if (latest.responseTime > 500) {
      recommendations.push('Response times are slow - consider performance optimization');
    }

    if (latest.capacityUtilization > 80) {
      recommendations.push('Capacity utilization is high - consider scaling resources');
    }

    if (latest.memoryEfficiency < 90) {
      recommendations.push('Memory efficiency is suboptimal - review memory allocation patterns');
    }

    if (recommendations.length === 0) {
      recommendations.push('System is operating within optimal parameters');
    }

    return recommendations;
  }

  private logMonitoringStatus(metrics: MonitoringMetrics): void {
    console.log(`[Monitoring Status] Health: ${metrics.systemHealth.toFixed(1)}% | ` +
                `Performance: ${metrics.performanceScore.toFixed(1)}% | ` +
                `Response: ${metrics.responseTime.toFixed(0)}ms | ` +
                `Memory: ${metrics.memoryEfficiency.toFixed(1)}%`);
  }
}

// Export for use in production monitoring
export default ContinuousMonitoringFramework;

// Jest test suite
describe('Continuous Monitoring Framework', () => {
  let monitoringFramework: ContinuousMonitoringFramework;

  beforeAll(async () => {
    monitoringFramework = new ContinuousMonitoringFramework();
  });

  test('Monitoring Framework Initialization', async () => {
    const result = await monitoringFramework.initializeMonitoring();

    expect(result.success).toBe(true);
    expect(result.monitoringId).toBeDefined();
    expect(result.configuration).toBeDefined();
    expect(result.configuration.components.length).toBe(7);
  });

  test('Start and Stop Monitoring', async () => {
    await monitoringFramework.startMonitoring();

    // Let monitoring run for a short period
    await new Promise(resolve => setTimeout(resolve, 5000));

    const stopResult = await monitoringFramework.stopMonitoring();

    expect(stopResult.success).toBe(true);
    expect(stopResult.metricsCollected).toBeGreaterThan(0);
  });

  test('Generate Monitoring Report', async () => {
    const report = await monitoringFramework.generateMonitoringReport();

    expect(report.summary).toBeDefined();
    expect(report.trendAnalysis).toBeDefined();
    expect(report.recommendations).toBeDefined();
    expect(Array.isArray(report.recommendations)).toBe(true);
  });
}, 30000); // 30 second timeout for monitoring tests