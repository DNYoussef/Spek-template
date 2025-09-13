/**
 * Performance Tracker Utility
 * 
 * Monitors and tracks performance overhead of quality validation operations
 * to ensure <1.1% performance impact on system operations.
 */

class PerformanceTracker {
  constructor(overheadLimit = 1.1) {
    this.overheadLimit = overheadLimit; // 1.1% default
    this.metrics = new Map();
    this.sessions = new Map();
    this.baselineMetrics = null;
    this.alertThreshold = overheadLimit * 0.8; // Alert at 80% of limit
    this.measurements = {
      operations: new Map(),
      timings: new Map(),
      memory: new Map(),
      cpu: new Map()
    };
  }

  start(operationName) {
    const startTime = process.hrtime.bigint();
    const sessionId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session = {
      operationName,
      startTime,
      startMemory: this.getMemoryUsage(),
      startCpu: this.getCpuUsage(),
      sessionId
    };

    this.sessions.set(sessionId, session);
    
    return sessionId;
  }

  end(operationName, sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`Performance tracking session not found: ${sessionId}`);
      return null;
    }

    const endTime = process.hrtime.bigint();
    const endMemory = this.getMemoryUsage();
    const endCpu = this.getCpuUsage();

    const metrics = {
      operationName,
      sessionId,
      duration: Number(endTime - session.startTime) / 1000000, // Convert to milliseconds
      memoryDelta: endMemory - session.startMemory,
      cpuDelta: endCpu - session.startCpu,
      startTime: session.startTime,
      endTime,
      timestamp: new Date().toISOString()
    };

    // Store metrics
    this.storeMetrics(metrics);
    
    // Clean up session
    this.sessions.delete(sessionId);

    // Check for performance alerts
    this.checkPerformanceAlerts(metrics);

    return metrics;
  }

  storeMetrics(metrics) {
    const { operationName } = metrics;
    
    // Store in operation-specific metrics
    if (!this.measurements.operations.has(operationName)) {
      this.measurements.operations.set(operationName, []);
    }
    this.measurements.operations.get(operationName).push(metrics);

    // Store in timing metrics
    if (!this.measurements.timings.has(operationName)) {
      this.measurements.timings.set(operationName, {
        total: 0,
        count: 0,
        average: 0,
        min: Infinity,
        max: 0
      });
    }

    const timingStats = this.measurements.timings.get(operationName);
    timingStats.total += metrics.duration;
    timingStats.count += 1;
    timingStats.average = timingStats.total / timingStats.count;
    timingStats.min = Math.min(timingStats.min, metrics.duration);
    timingStats.max = Math.max(timingStats.max, metrics.duration);

    // Store memory metrics
    if (!this.measurements.memory.has(operationName)) {
      this.measurements.memory.set(operationName, {
        totalDelta: 0,
        count: 0,
        average: 0,
        peak: 0
      });
    }

    const memoryStats = this.measurements.memory.get(operationName);
    memoryStats.totalDelta += Math.abs(metrics.memoryDelta);
    memoryStats.count += 1;
    memoryStats.average = memoryStats.totalDelta / memoryStats.count;
    memoryStats.peak = Math.max(memoryStats.peak, Math.abs(metrics.memoryDelta));

    // Maintain rolling window of recent metrics
    this.maintainRollingWindow(operationName);
  }

  maintainRollingWindow(operationName, windowSize = 100) {
    const operations = this.measurements.operations.get(operationName);
    if (operations && operations.length > windowSize) {
      operations.splice(0, operations.length - windowSize);
    }
  }

  getOverheadPercentage() {
    if (!this.baselineMetrics) {
      // If no baseline, estimate overhead based on recent measurements
      return this.estimateOverhead();
    }

    const currentMetrics = this.getCurrentMetrics();
    const overhead = this.calculateOverhead(this.baselineMetrics, currentMetrics);
    
    return overhead;
  }

  calculateOverhead(baseline, current) {
    if (!baseline || !current) return 0;

    // Calculate overhead as percentage of baseline performance
    const timingOverhead = ((current.averageTime - baseline.averageTime) / baseline.averageTime) * 100;
    const memoryOverhead = ((current.averageMemory - baseline.averageMemory) / baseline.averageMemory) * 100;
    const cpuOverhead = ((current.averageCpu - baseline.averageCpu) / baseline.averageCpu) * 100;

    // Weighted average of different overhead types
    const overallOverhead = (timingOverhead * 0.5) + (memoryOverhead * 0.3) + (cpuOverhead * 0.2);
    
    return Math.max(0, overallOverhead);
  }

  estimateOverhead() {
    // Estimate overhead based on quality validation operations
    const qualityOperations = [
      'theater-detection',
      'reality-validation', 
      'quality-gates',
      'nasa-compliance',
      'dashboard-generation'
    ];

    let totalOverhead = 0;
    let operationCount = 0;

    for (const operation of qualityOperations) {
      const timingStats = this.measurements.timings.get(operation);
      if (timingStats && timingStats.count > 0) {
        // Estimate overhead based on operation frequency and duration
        const estimatedOverhead = (timingStats.average * timingStats.count) / 1000; // Convert to seconds
        totalOverhead += estimatedOverhead;
        operationCount++;
      }
    }

    if (operationCount === 0) return 0;

    // Convert to percentage (very rough estimate)
    return Math.min(totalOverhead * 0.01, 5.0); // Cap at 5%
  }

  getCurrentMetrics() {
    const allTimings = Array.from(this.measurements.timings.values());
    const allMemory = Array.from(this.measurements.memory.values());

    if (allTimings.length === 0) return null;

    return {
      averageTime: allTimings.reduce((sum, t) => sum + t.average, 0) / allTimings.length,
      averageMemory: allMemory.reduce((sum, m) => sum + m.average, 0) / allMemory.length,
      averageCpu: 0, // CPU tracking would need more sophisticated implementation
      operationCount: allTimings.reduce((sum, t) => sum + t.count, 0)
    };
  }

  setBaseline() {
    this.baselineMetrics = this.getCurrentMetrics();
    console.log('Performance baseline established:', this.baselineMetrics);
  }

  checkPerformanceAlerts(metrics) {
    const currentOverhead = this.getOverheadPercentage();
    
    if (currentOverhead > this.overheadLimit) {
      this.emitPerformanceAlert('OVERHEAD_EXCEEDED', {
        currentOverhead,
        limit: this.overheadLimit,
        operation: metrics.operationName,
        metrics
      });
    } else if (currentOverhead > this.alertThreshold) {
      this.emitPerformanceAlert('OVERHEAD_WARNING', {
        currentOverhead,
        threshold: this.alertThreshold,
        limit: this.overheadLimit,
        operation: metrics.operationName
      });
    }

    // Check for unusually slow operations
    const timingStats = this.measurements.timings.get(metrics.operationName);
    if (timingStats && metrics.duration > timingStats.average * 3) {
      this.emitPerformanceAlert('SLOW_OPERATION', {
        operation: metrics.operationName,
        duration: metrics.duration,
        average: timingStats.average,
        threshold: timingStats.average * 3
      });
    }
  }

  emitPerformanceAlert(alertType, data) {
    console.warn(`[PERFORMANCE ALERT] ${alertType}:`, data);
    
    // In a real implementation, this would integrate with the quality alerting system
    if (typeof process !== 'undefined' && process.emit) {
      process.emit('performance-alert', { type: alertType, data });
    }
  }

  getMetrics() {
    const summary = {
      overheadPercentage: this.getOverheadPercentage(),
      totalOperations: this.getTotalOperationCount(),
      operationBreakdown: this.getOperationBreakdown(),
      performanceProfile: this.getPerformanceProfile(),
      alerts: this.getPerformanceAlerts()
    };

    return summary;
  }

  getTotalOperationCount() {
    return Array.from(this.measurements.timings.values())
      .reduce((total, stats) => total + stats.count, 0);
  }

  getOperationBreakdown() {
    const breakdown = {};
    
    for (const [operation, stats] of this.measurements.timings) {
      breakdown[operation] = {
        count: stats.count,
        averageDuration: stats.average,
        totalDuration: stats.total,
        minDuration: stats.min,
        maxDuration: stats.max,
        overhead: this.calculateOperationOverhead(operation)
      };
    }

    return breakdown;
  }

  calculateOperationOverhead(operation) {
    const timingStats = this.measurements.timings.get(operation);
    const memoryStats = this.measurements.memory.get(operation);
    
    if (!timingStats) return 0;

    // Simplified overhead calculation for individual operation
    const timeWeight = timingStats.average * timingStats.count;
    const memoryWeight = memoryStats ? memoryStats.average * memoryStats.count : 0;
    
    return (timeWeight * 0.001) + (memoryWeight * 0.000001); // Convert to percentage estimate
  }

  getPerformanceProfile() {
    const profile = {
      mostExpensiveOperations: this.getMostExpensiveOperations(),
      memoryIntensiveOperations: this.getMemoryIntensiveOperations(),
      frequentOperations: this.getMostFrequentOperations(),
      systemResourceUsage: this.getSystemResourceUsage()
    };

    return profile;
  }

  getMostExpensiveOperations(limit = 5) {
    return Array.from(this.measurements.timings.entries())
      .map(([operation, stats]) => ({
        operation,
        totalTime: stats.total,
        averageTime: stats.average,
        count: stats.count
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, limit);
  }

  getMemoryIntensiveOperations(limit = 5) {
    return Array.from(this.measurements.memory.entries())
      .map(([operation, stats]) => ({
        operation,
        averageMemoryDelta: stats.average,
        peakMemoryDelta: stats.peak,
        count: stats.count
      }))
      .sort((a, b) => b.averageMemoryDelta - a.averageMemoryDelta)
      .slice(0, limit);
  }

  getMostFrequentOperations(limit = 5) {
    return Array.from(this.measurements.timings.entries())
      .map(([operation, stats]) => ({
        operation,
        count: stats.count,
        averageTime: stats.average,
        totalTime: stats.total
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getSystemResourceUsage() {
    return {
      currentMemory: this.getMemoryUsage(),
      currentCpu: this.getCpuUsage(),
      activeSessions: this.sessions.size,
      trackingOverhead: this.getTrackingOverhead()
    };
  }

  getTrackingOverhead() {
    // Estimate the overhead of the tracking itself
    const trackingData = {
      sessionsCount: this.sessions.size,
      metricsCount: Array.from(this.measurements.operations.values())
        .reduce((total, ops) => total + ops.length, 0),
      memoryFootprint: this.estimateMemoryFootprint()
    };

    return trackingData;
  }

  estimateMemoryFootprint() {
    // Rough estimate of memory used by tracking data
    const metricsCount = Array.from(this.measurements.operations.values())
      .reduce((total, ops) => total + ops.length, 0);
    
    // Estimate ~1KB per metric entry
    return metricsCount * 1024;
  }

  getPerformanceAlerts() {
    const alerts = [];
    const currentOverhead = this.getOverheadPercentage();

    if (currentOverhead > this.overheadLimit) {
      alerts.push({
        type: 'OVERHEAD_EXCEEDED',
        severity: 'CRITICAL',
        value: currentOverhead,
        threshold: this.overheadLimit
      });
    } else if (currentOverhead > this.alertThreshold) {
      alerts.push({
        type: 'OVERHEAD_WARNING', 
        severity: 'WARNING',
        value: currentOverhead,
        threshold: this.alertThreshold
      });
    }

    return alerts;
  }

  getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return usage.heapUsed;
    }
    return 0;
  }

  getCpuUsage() {
    if (typeof process !== 'undefined' && process.cpuUsage) {
      const usage = process.cpuUsage();
      return usage.user + usage.system;
    }
    return 0;
  }

  reset() {
    this.measurements.operations.clear();
    this.measurements.timings.clear();
    this.measurements.memory.clear();
    this.measurements.cpu.clear();
    this.sessions.clear();
    this.baselineMetrics = null;
    
    console.log('Performance tracker reset');
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        overheadPercentage: this.getOverheadPercentage(),
        totalOperations: this.getTotalOperationCount(),
        activeSessions: this.sessions.size,
        trackingEnabled: true
      },
      metrics: this.getMetrics(),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    const currentOverhead = this.getOverheadPercentage();

    if (currentOverhead > this.overheadLimit) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Performance',
        description: 'Performance overhead exceeds acceptable limit',
        actions: [
          'Reduce monitoring frequency',
          'Optimize expensive operations',
          'Consider asynchronous processing'
        ]
      });
    }

    const expensiveOps = this.getMostExpensiveOperations(3);
    if (expensiveOps.length > 0 && expensiveOps[0].averageTime > 1000) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Optimization',
        description: `Operation '${expensiveOps[0].operation}' is taking too long`,
        actions: [
          'Profile the operation for bottlenecks',
          'Implement caching if applicable',
          'Consider breaking into smaller operations'
        ]
      });
    }

    return recommendations;
  }
}

module.exports = PerformanceTracker;