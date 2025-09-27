import { EventEmitter } from 'events';
import { MemoryAllocationRequest, MemoryBlock, PrincessDomain, MemoryPriority } from '../coordinator/MemoryCoordinator';
export interface MemoryMetric {
  timestamp: Date;
  metricType: string;
  value: number;
  domain?: PrincessDomain;
  blockId?: string;
  metadata?: Record<string, any>;
}
export interface AllocationMetric extends MemoryMetric {
  metricType: 'allocation';
  size: number;
  priority: MemoryPriority;
  ttl: number;
  success: boolean;
}
export interface DeallocationMetric extends MemoryMetric {
  metricType: 'deallocation';
  size: number;
  lifetime: number; // How long the block existed
  accessCount: number;
}
export interface PerformanceMetric extends MemoryMetric {
  metricType: 'performance';
  operation: 'read' | 'write' | 'allocation' | 'deallocation' | 'optimization';
  duration: number;
  success: boolean;
}
export interface UtilizationMetric extends MemoryMetric {
  metricType: 'utilization';
  totalMemory: number;
  usedMemory: number;
  availableMemory: number;
  fragmentation: number;
  efficiency: number;
}
export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: MemoryMetric[]) => boolean;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownPeriod: number; // Milliseconds between alerts
  enabled: boolean;
  lastTriggered?: Date;
}
export interface MemoryAlert {
  id: string;
  ruleId: string;
  severity: AlertRule['severity'];
  message: string;
  timestamp: Date;
  metrics: MemoryMetric[];
  acknowledged: boolean;
  resolvedAt?: Date;
}
export interface DashboardMetrics {
  overview: {
    totalMemory: number;
    usedMemory: number;
    availableMemory: number;
    efficiency: number;
    fragmentation: number;
    activeBlocks: number;
  };
  domainDistribution: Record<PrincessDomain, {
    allocated: number;
    percentage: number;
    blockCount: number;
    averageBlockSize: number;
  }>;
  performance: {
    averageAllocationTime: number;
    averageReadTime: number;
    averageWriteTime: number;
    allocationSuccessRate: number;
    optimizationFrequency: number;
  };
  trends: {
    memoryUsageHistory: Array<{ timestamp: Date; usage: number }>;
    allocationRateHistory: Array<{ timestamp: Date; rate: number }>;
    errorRateHistory: Array<{ timestamp: Date; rate: number }>;
  };
  alerts: {
    active: MemoryAlert[];
    recentResolved: MemoryAlert[];
    summary: Record<AlertRule['severity'], number>;
  };
}
/**
 * Memory Metrics and Analytics System
 * Provides comprehensive monitoring, alerting, and dashboard
 * capabilities for memory coordination system.
 */
export class MemoryMetrics extends EventEmitter {
  private metrics: MemoryMetric[] = [];
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, MemoryAlert> = new Map();
  private resolvedAlerts: MemoryAlert[] = [];
  private readonly MAX_METRICS_HISTORY = 10000;
  private readonly MAX_RESOLVED_ALERTS = 100;
  private readonly METRIC_AGGREGATION_INTERVAL = 60000; // 1 minute
  private readonly DASHBOARD_UPDATE_INTERVAL = 5000; // 5 seconds
  private aggregationTimer: NodeJS.Timeout | null = null;
  private dashboardTimer: NodeJS.Timeout | null = null;
  private currentDashboardMetrics: DashboardMetrics | null = null;
  constructor() {
    super();
    this.initializeDefaultAlertRules();
    this.startMetricAggregation();
    this.startDashboardUpdates();
  }
  private initializeDefaultAlertRules(): void {
    // High memory utilization alert
    this.alertRules.set('high-memory-utilization', {
      id: 'high-memory-utilization',
      name: 'High Memory Utilization',
      condition: (metrics) => {
        const recent = metrics.filter(m =>
          m.metricType === 'utilization' &&
          Date.now() - m.timestamp.getTime() < 300000 // Last 5 minutes
        ) as UtilizationMetric[];
        if (recent.length === 0) return false;
        const avgUtilization = recent.reduce((sum, m) => sum + (m.usedMemory / m.totalMemory), 0) / recent.length;
        return avgUtilization > 0.85; // 85% utilization
      },
      threshold: 0.85,
      severity: 'high',
      cooldownPeriod: 300000, // 5 minutes
      enabled: true
    });
    // High fragmentation alert
    this.alertRules.set('high-fragmentation', {
      id: 'high-fragmentation',
      name: 'High Memory Fragmentation',
      condition: (metrics) => {
        const recent = metrics.filter(m =>
          m.metricType === 'utilization' &&
          Date.now() - m.timestamp.getTime() < 300000
        ) as UtilizationMetric[];
        if (recent.length === 0) return false;
        const avgFragmentation = recent.reduce((sum, m) => sum + m.fragmentation, 0) / recent.length;
        return avgFragmentation > 0.4; // 40% fragmentation
      },
      threshold: 0.4,
      severity: 'medium',
      cooldownPeriod: 600000, // 10 minutes
      enabled: true
    });
    // Low allocation success rate alert
    this.alertRules.set('low-allocation-success', {
      id: 'low-allocation-success',
      name: 'Low Allocation Success Rate',
      condition: (metrics) => {
        const recent = metrics.filter(m =>
          m.metricType === 'allocation' &&
          Date.now() - m.timestamp.getTime() < 600000 // Last 10 minutes
        ) as AllocationMetric[];
        if (recent.length < 10) return false; // Need at least 10 allocations
        const successRate = recent.filter(m => m.success).length / recent.length;
        return successRate < 0.8; // 80% success rate
      },
      threshold: 0.8,
      severity: 'high',
      cooldownPeriod: 300000,
      enabled: true
    });
    // Performance degradation alert
    this.alertRules.set('performance-degradation', {
      id: 'performance-degradation',
      name: 'Performance Degradation',
      condition: (metrics) => {
        const recent = metrics.filter(m =>
          m.metricType === 'performance' &&
          Date.now() - m.timestamp.getTime() < 300000
        ) as PerformanceMetric[];
        if (recent.length < 5) return false;
        const avgDuration = recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
        return avgDuration > 100; // 100ms average response time
      },
      threshold: 100,
      severity: 'medium',
      cooldownPeriod: 300000,
      enabled: true
    });
    // Critical memory exhaustion alert
    this.alertRules.set('memory-exhaustion', {
      id: 'memory-exhaustion',
      name: 'Critical Memory Exhaustion',
      condition: (metrics) => {
        const recent = metrics.filter(m =>
          m.metricType === 'utilization' &&
          Date.now() - m.timestamp.getTime() < 60000 // Last minute
        ) as UtilizationMetric[];
        if (recent.length === 0) return false;
        const maxUtilization = Math.max(...recent.map(m => m.usedMemory / m.totalMemory));
        return maxUtilization > 0.95; // 95% utilization
      },
      threshold: 0.95,
      severity: 'critical',
      cooldownPeriod: 60000, // 1 minute
      enabled: true
    });
  }
  /**
   * Record memory allocation event
   */
  public recordAllocation(blockId: string, request: MemoryAllocationRequest, success: boolean = true): void {
    const metric: AllocationMetric = {
      timestamp: new Date(),
      metricType: 'allocation',
      value: request.size,
      domain: request.domain,
      blockId,
      size: request.size,
      priority: request.priority,
      ttl: request.ttl || 0,
      success,
      metadata: request.metadata
    };
    this.addMetric(metric);
    this.emit('allocation-recorded', { blockId, request, success });
  }
  /**
   * Record memory deallocation event
   */
  public recordDeallocation(blockId: string, block: MemoryBlock): void {
    const lifetime = Date.now() - block.createdAt.getTime();
    const accessCount = block.metadata?.accessCount || 0;
    const metric: DeallocationMetric = {
      timestamp: new Date(),
      metricType: 'deallocation',
      value: block.size,
      domain: block.owner,
      blockId,
      size: block.size,
      lifetime,
      accessCount,
      metadata: {
        priority: block.priority,
        wasCompressed: block.compressed,
        wasEncrypted: block.encrypted
      }
    };
    this.addMetric(metric);
    this.emit('deallocation-recorded', { blockId, block, lifetime });
  }
  /**
   * Record performance metric
   */
  public recordPerformance(
    operation: PerformanceMetric['operation'],
    duration: number,
    success: boolean = true,
    metadata: Record<string, any> = {}
  ): void {
    const metric: PerformanceMetric = {
      timestamp: new Date(),
      metricType: 'performance',
      value: duration,
      operation,
      duration,
      success,
      metadata
    };
    this.addMetric(metric);
    this.emit('performance-recorded', { operation, duration, success });
  }
  /**
   * Record memory utilization snapshot
   */
  public recordUtilization(
    totalMemory: number,
    usedMemory: number,
    availableMemory: number,
    fragmentation: number,
    efficiency: number
  ): void {
    const metric: UtilizationMetric = {
      timestamp: new Date(),
      metricType: 'utilization',
      value: usedMemory / totalMemory,
      totalMemory,
      usedMemory,
      availableMemory,
      fragmentation,
      efficiency
    };
    this.addMetric(metric);
    this.checkAlerts();
    this.emit('utilization-recorded', {
      utilization: usedMemory / totalMemory,
      fragmentation,
      efficiency
    });
  }
  /**
   * Get metrics by type and time range
   */
  public getMetrics(
    type?: string,
    domain?: PrincessDomain,
    timeRange?: { start: Date; end: Date },
    limit?: number
  ): MemoryMetric[] {
    let filtered = this.metrics;
    if (type) {
      filtered = filtered.filter(m => m.metricType === type);
    }
    if (domain) {
      filtered = filtered.filter(m => m.domain === domain);
    }
    if (timeRange) {
      filtered = filtered.filter(m =>
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    if (limit) {
      filtered = filtered.slice(0, limit);
    }
    return filtered;
  }
  /**
   * Get aggregated statistics
   */
  public getStatistics(timeRange?: { start: Date; end: Date }): {
    allocations: { total: number; successful: number; failed: number; averageSize: number };
    deallocations: { total: number; averageLifetime: number; averageAccessCount: number };
    performance: { averageDuration: number; successRate: number; operationCounts: Record<string, number> };
    utilization: { current: number; average: number; peak: number; fragmentation: number };
    domainStats: Record<PrincessDomain, { allocations: number; totalSize: number; averageSize: number }>;
  } {
    const filteredMetrics = timeRange ?
      this.metrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end) :
      this.metrics;
    const allocations = filteredMetrics.filter(m => m.metricType === 'allocation') as AllocationMetric[];
    const deallocations = filteredMetrics.filter(m => m.metricType === 'deallocation') as DeallocationMetric[];
    const performance = filteredMetrics.filter(m => m.metricType === 'performance') as PerformanceMetric[];
    const utilization = filteredMetrics.filter(m => m.metricType === 'utilization') as UtilizationMetric[];
    // Allocation statistics
    const allocationStats = {
      total: allocations.length,
      successful: allocations.filter(a => a.success).length,
      failed: allocations.filter(a => !a.success).length,
      averageSize: allocations.length > 0 ?
        allocations.reduce((sum, a) => sum + a.size, 0) / allocations.length : 0
    };
    // Deallocation statistics
    const deallocationStats = {
      total: deallocations.length,
      averageLifetime: deallocations.length > 0 ?
        deallocations.reduce((sum, d) => sum + d.lifetime, 0) / deallocations.length : 0,
      averageAccessCount: deallocations.length > 0 ?
        deallocations.reduce((sum, d) => sum + d.accessCount, 0) / deallocations.length : 0
    };
    // Performance statistics
    const performanceStats = {
      averageDuration: performance.length > 0 ?
        performance.reduce((sum, p) => sum + p.duration, 0) / performance.length : 0,
      successRate: performance.length > 0 ?
        performance.filter(p => p.success).length / performance.length : 0,
      operationCounts: performance.reduce((counts, p) => {
        counts[p.operation] = (counts[p.operation] || 0) + 1;
        return counts;
      }, {} as Record<string, number>)
    };
    // Utilization statistics
    const utilizationStats = {
      current: utilization.length > 0 ? utilization[utilization.length - 1].value : 0,
      average: utilization.length > 0 ?
        utilization.reduce((sum, u) => sum + u.value, 0) / utilization.length : 0,
      peak: utilization.length > 0 ? Math.max(...utilization.map(u => u.value)) : 0,
      fragmentation: utilization.length > 0 ? utilization[utilization.length - 1].fragmentation : 0
    };
    // Domain statistics
    const domainStats: Record<PrincessDomain, { allocations: number; totalSize: number; averageSize: number }> =
      {} as any;
    for (const domain of Object.values(PrincessDomain)) {
      const domainAllocations = allocations.filter(a => a.domain === domain);
      domainStats[domain] = {
        allocations: domainAllocations.length,
        totalSize: domainAllocations.reduce((sum, a) => sum + a.size, 0),
        averageSize: domainAllocations.length > 0 ?
          domainAllocations.reduce((sum, a) => sum + a.size, 0) / domainAllocations.length : 0
      };
    }
    return {
      allocations: allocationStats,
      deallocations: deallocationStats,
      performance: performanceStats,
      utilization: utilizationStats,
      domainStats
    };
  }
  /**
   * Get current dashboard metrics
   */
  public getDashboardMetrics(): DashboardMetrics | null {
    return this.currentDashboardMetrics;
  }
  /**
   * Add custom alert rule
   */
  public addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.emit('alert-rule-added', { ruleId: rule.id, rule });
  }
  /**
   * Update alert rule
   */
  public updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.get(ruleId);
    if (!rule) {
      return false;
    }
    const updatedRule = { ...rule, ...updates };
    this.alertRules.set(ruleId, updatedRule);
    this.emit('alert-rule-updated', { ruleId, rule: updatedRule });
    return true;
  }
  /**
   * Remove alert rule
   */
  public removeAlertRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    if (removed) {
      this.emit('alert-rule-removed', { ruleId });
    }
    return removed;
  }
  /**
   * Acknowledge alert
   */
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }
    alert.acknowledged = true;
    this.emit('alert-acknowledged', { alertId, alert });
    return true;
  }
  /**
   * Resolve alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }
    alert.resolvedAt = new Date();
    this.activeAlerts.delete(alertId);
    // Add to resolved alerts
    this.resolvedAlerts.unshift(alert);
    if (this.resolvedAlerts.length > this.MAX_RESOLVED_ALERTS) {
      this.resolvedAlerts.splice(this.MAX_RESOLVED_ALERTS);
    }
    this.emit('alert-resolved', { alertId, alert });
    return true;
  }
  /**
   * Get active alerts
   */
  public getActiveAlerts(): MemoryAlert[] {
    return Array.from(this.activeAlerts.values());
  }
  /**
   * Get resolved alerts
   */
  public getResolvedAlerts(limit: number = 50): MemoryAlert[] {
    return this.resolvedAlerts.slice(0, limit);
  }
  private addMetric(metric: MemoryMetric): void {
    this.metrics.push(metric);
    // Trim old metrics
    if (this.metrics.length > this.MAX_METRICS_HISTORY) {
      this.metrics.splice(0, this.metrics.length - this.MAX_METRICS_HISTORY);
    }
    this.emit('metric-added', { metric });
  }
  private checkAlerts(): void {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;
      // Check cooldown period
      if (rule.lastTriggered &&
          Date.now() - rule.lastTriggered.getTime() < rule.cooldownPeriod) {
        continue;
      }
      // Check if condition is met
      if (rule.condition(this.metrics)) {
        this.triggerAlert(rule);
      }
    }
  }
  private triggerAlert(rule: AlertRule): void {
    const alertId = `${rule.id}_${Date.now()}`;
    const relatedMetrics = this.metrics.filter(m =>
      Date.now() - m.timestamp.getTime() < 300000 // Last 5 minutes
    );
    const alert: MemoryAlert = {
      id: alertId,
      ruleId: rule.id,
      severity: rule.severity,
      message: `${rule.name}: Threshold ${rule.threshold} exceeded`,
      timestamp: new Date(),
      metrics: relatedMetrics,
      acknowledged: false
    };
    this.activeAlerts.set(alertId, alert);
    rule.lastTriggered = new Date();
    this.emit('alert-triggered', { alert, rule });
  }
  private startMetricAggregation(): void {
    this.aggregationTimer = setInterval(() => {
      this.aggregateMetrics();
    }, this.METRIC_AGGREGATION_INTERVAL);
  }
  private startDashboardUpdates(): void {
    this.dashboardTimer = setInterval(() => {
      this.updateDashboardMetrics();
    }, this.DASHBOARD_UPDATE_INTERVAL);
  }
  private aggregateMetrics(): void {
    // This would aggregate metrics for long-term storage
    // For now, just emit an event
    this.emit('metrics-aggregated', {
      metricCount: this.metrics.length,
      timestamp: new Date()
    });
  }
  private updateDashboardMetrics(): void {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 300000);
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const recentMetrics = this.getMetrics(undefined, undefined, { start: fiveMinutesAgo, end: now });
    const hourlyMetrics = this.getMetrics(undefined, undefined, { start: oneHourAgo, end: now });
    const stats = this.getStatistics({ start: fiveMinutesAgo, end: now });
    // Get latest utilization
    const latestUtilization = this.getMetrics('utilization', undefined, undefined, 1)[0] as UtilizationMetric;
    if (!latestUtilization) {
      return;
    }
    this.currentDashboardMetrics = {
      overview: {
        totalMemory: latestUtilization.totalMemory,
        usedMemory: latestUtilization.usedMemory,
        availableMemory: latestUtilization.availableMemory,
        efficiency: latestUtilization.efficiency,
        fragmentation: latestUtilization.fragmentation,
        activeBlocks: this.getMetrics('allocation').length - this.getMetrics('deallocation').length
      },
      domainDistribution: Object.fromEntries(
        Object.entries(stats.domainStats).map(([domain, domainStats]) => [
          domain,
          {
            allocated: domainStats.totalSize,
            percentage: (domainStats.totalSize / latestUtilization.totalMemory) * 100,
            blockCount: domainStats.allocations,
            averageBlockSize: domainStats.averageSize
          }
        ])
      ) as any,
      performance: {
        averageAllocationTime: this.getAverageOperationTime('allocation'),
        averageReadTime: this.getAverageOperationTime('read'),
        averageWriteTime: this.getAverageOperationTime('write'),
        allocationSuccessRate: stats.allocations.total > 0 ?
          stats.allocations.successful / stats.allocations.total : 1,
        optimizationFrequency: this.getOptimizationFrequency()
      },
      trends: {
        memoryUsageHistory: this.getUsageHistory(oneHourAgo, now),
        allocationRateHistory: this.getAllocationRateHistory(oneHourAgo, now),
        errorRateHistory: this.getErrorRateHistory(oneHourAgo, now)
      },
      alerts: {
        active: this.getActiveAlerts(),
        recentResolved: this.getResolvedAlerts(10),
        summary: this.getAlertSummary()
      }
    };
    this.emit('dashboard-updated', { metrics: this.currentDashboardMetrics });
  }
  private getAverageOperationTime(operation: string): number {
    const performanceMetrics = this.getMetrics('performance', undefined, undefined, 100) as PerformanceMetric[];
    const operationMetrics = performanceMetrics.filter(m => m.operation === operation);
    if (operationMetrics.length === 0) return 0;
    return operationMetrics.reduce((sum, m) => sum + m.duration, 0) / operationMetrics.length;
  }
  private getOptimizationFrequency(): number {
    const hourAgo = new Date(Date.now() - 3600000);
    const optimizations = this.getMetrics('performance', undefined, { start: hourAgo, end: new Date() })
      .filter(m => (m as PerformanceMetric).operation === 'optimization');
    return optimizations.length;
  }
  private getUsageHistory(start: Date, end: Date): Array<{ timestamp: Date; usage: number }> {
    const utilizationMetrics = this.getMetrics('utilization', undefined, { start, end }) as UtilizationMetric[];
    return utilizationMetrics.map(m => ({
      timestamp: m.timestamp,
      usage: m.value
    }));
  }
  private getAllocationRateHistory(start: Date, end: Date): Array<{ timestamp: Date; rate: number }> {
    // Calculate allocation rate in 5-minute windows
    const windowSize = 300000; // 5 minutes
    const windows: Array<{ timestamp: Date; rate: number }> = [];
    let currentTime = start.getTime();
    while (currentTime < end.getTime()) {
      const windowStart = new Date(currentTime);
      const windowEnd = new Date(currentTime + windowSize);
      const allocations = this.getMetrics('allocation', undefined, { start: windowStart, end: windowEnd });
      const rate = allocations.length / (windowSize / 60000); // Per minute
      windows.push({ timestamp: windowStart, rate });
      currentTime += windowSize;
    }
    return windows;
  }
  private getErrorRateHistory(start: Date, end: Date): Array<{ timestamp: Date; rate: number }> {
    // Calculate error rate in 5-minute windows
    const windowSize = 300000; // 5 minutes
    const windows: Array<{ timestamp: Date; rate: number }> = [];
    let currentTime = start.getTime();
    while (currentTime < end.getTime()) {
      const windowStart = new Date(currentTime);
      const windowEnd = new Date(currentTime + windowSize);
      const allocations = this.getMetrics('allocation', undefined, { start: windowStart, end: windowEnd }) as AllocationMetric[];
      const failures = allocations.filter(a => !a.success);
      const rate = allocations.length > 0 ? failures.length / allocations.length : 0;
      windows.push({ timestamp: windowStart, rate });
      currentTime += windowSize;
    }
    return windows;
  }
  private getAlertSummary(): Record<AlertRule['severity'], number> {
    const summary = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const alert of this.activeAlerts.values()) {
      summary[alert.severity]++;
    }
    return summary;
  }
  /**
   * Export metrics for external analysis
   */
  public exportMetrics(format: 'json' | 'csv' = 'json', timeRange?: { start: Date; end: Date }): string {
    const metrics = timeRange ?
      this.getMetrics(undefined, undefined, timeRange) :
      this.metrics;
    if (format === 'csv') {
      return this.convertMetricsToCSV(metrics);
    }
    return JSON.stringify(metrics, null, 2);
  }
  private convertMetricsToCSV(metrics: MemoryMetric[]): string {
    const headers = ['timestamp', 'metricType', 'value', 'domain', 'blockId', 'metadata'];
    const rows = metrics.map(m => [
      m.timestamp.toISOString(),
      m.metricType,
      m.value.toString(),
      m.domain || '',
      m.blockId || '',
      JSON.stringify(m.metadata || {})
    ]);
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
  /**
   * Shutdown metrics system
   */
  public shutdown(): void {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
      this.aggregationTimer = null;
    }
    if (this.dashboardTimer) {
      clearInterval(this.dashboardTimer);
      this.dashboardTimer = null;
    }
    this.metrics.length = 0;
    this.alertRules.clear();
    this.activeAlerts.clear();
    this.resolvedAlerts.length = 0;
    this.currentDashboardMetrics = null;
    this.emit('shutdown');
  }
}
export default MemoryMetrics;