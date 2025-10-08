/**
 * Drone Metrics Collector - Single Responsibility Metrics Management
 * NASA Rule 10 Compliant: ≤60 line functions, no recursion, bounded loops
 */

import { DroneWorker, DroneMetrics, DroneState } from '../fsm/DroneTypes';

export class DroneMetricsCollector {
  private metricsHistory: Map<string, DroneMetrics[]> = new Map();
  private performanceData: Map<string, number[]> = new Map();

  /**
   * Collect metrics for drone worker
   * NASA Rule 10: ≤60 lines, bounded data collection
   */
  collectMetrics(worker: DroneWorker): DroneMetrics {
    console.assert(worker && worker.id, 'Valid worker required for metrics collection');

    const currentTime = new Date();
    const metrics: DroneMetrics = {
      tasksCompleted: worker.metrics.tasksCompleted,
      averageExecutionTime: this.calculateAverageExecutionTime(worker.id),
      errorRate: this.calculateErrorRate(worker.id),
      lastActivityTime: currentTime
    };

    // Store metrics history (bounded to 100 entries)
    this.storeMetricsHistory(worker.id, metrics);

    // NASA Rule 10: Post-condition assertion
    console.assert(metrics.tasksCompleted >= 0, 'Tasks completed must be non-negative');
    console.assert(metrics.errorRate >= 0 && metrics.errorRate <= 1, 'Error rate must be 0-1');

    return metrics;
  }

  /**
   * Calculate average execution time for worker
   * NASA Rule 10: ≤60 lines, bounded calculation
   */
  private calculateAverageExecutionTime(workerId: string): number {
    const performanceData = this.performanceData.get(workerId) || [];
    if (performanceData.length === 0) {
      return 0;
    }

    // Bounded calculation (max 1000 data points)
    const dataPoints = Math.min(performanceData.length, 1000);
    let totalTime = 0;

    for (let i = 0; i < dataPoints; i++) {
      totalTime += performanceData[i];
    }

    const average = totalTime / dataPoints;

    // NASA Rule 10: Assertions
    console.assert(dataPoints <= 1000, 'Performance data bounded to 1000 points');
    console.assert(average >= 0, 'Average execution time must be non-negative');

    return average;
  }

  /**
   * Calculate error rate for worker
   * NASA Rule 10: ≤60 lines, bounded error tracking
   */
  private calculateErrorRate(workerId: string): number {
    const history = this.metricsHistory.get(workerId) || [];
    if (history.length === 0) {
      return 0;
    }

    // Bounded error rate calculation (last 100 metrics)
    const recentHistory = history.slice(-100);
    let errorCount = 0;
    const totalTasks = recentHistory.length;

    for (let i = 0; i < recentHistory.length; i++) {
      // Count metrics where error rate > 0 as error occurrences
      if (recentHistory[i].errorRate > 0) {
        errorCount++;
      }
    }

    const errorRate = totalTasks > 0 ? errorCount / totalTasks : 0;

    // NASA Rule 10: Assertions
    console.assert(errorRate >= 0 && errorRate <= 1, 'Error rate must be between 0 and 1');
    console.assert(recentHistory.length <= 100, 'History bounded to 100 entries');

    return errorRate;
  }

  /**
   * Store metrics history for worker
   * NASA Rule 10: ≤60 lines, bounded storage
   */
  private storeMetricsHistory(workerId: string, metrics: DroneMetrics): void {
    console.assert(workerId && workerId.length > 0, 'Worker ID required');
    console.assert(metrics, 'Metrics required');

    let history = this.metricsHistory.get(workerId) || [];
    history.push(metrics);

    // Keep only last 100 metrics (bounded storage)
    if (history.length > 100) {
      history = history.slice(-100);
    }

    this.metricsHistory.set(workerId, history);

    // NASA Rule 10: Post-condition assertion
    console.assert(history.length <= 100, 'Metrics history bounded to 100 entries');
  }

  /**
   * Record execution time for worker
   * NASA Rule 10: ≤60 lines
   */
  recordExecutionTime(workerId: string, executionTimeMs: number): void {
    console.assert(workerId && workerId.length > 0, 'Worker ID required');
    console.assert(executionTimeMs >= 0, 'Execution time must be non-negative');

    let performanceData = this.performanceData.get(workerId) || [];
    performanceData.push(executionTimeMs);

    // Keep only last 1000 performance data points (bounded storage)
    if (performanceData.length > 1000) {
      performanceData = performanceData.slice(-1000);
    }

    this.performanceData.set(workerId, performanceData);

    // NASA Rule 10: Post-condition assertion
    console.assert(performanceData.length <= 1000, 'Performance data bounded to 1000 entries');
  }

  /**
   * Get metrics summary for all workers
   * NASA Rule 10: ≤60 lines, bounded aggregation
   */
  getMetricsSummary(): any {
    const workerIds = Array.from(this.metricsHistory.keys());
    const maxWorkers = Math.min(workerIds.length, 1000); // Bounded to 1000 workers

    let totalTasks = 0;
    let totalErrorRate = 0;
    let totalAvgTime = 0;

    for (let i = 0; i < maxWorkers; i++) {
      const workerId = workerIds[i];
      const history = this.metricsHistory.get(workerId) || [];

      if (history.length > 0) {
        const latestMetrics = history[history.length - 1];
        totalTasks += latestMetrics.tasksCompleted;
        totalErrorRate += latestMetrics.errorRate;
        totalAvgTime += latestMetrics.averageExecutionTime;
      }
    }

    const summary = {
      totalWorkers: maxWorkers,
      totalTasksCompleted: totalTasks,
      overallErrorRate: maxWorkers > 0 ? totalErrorRate / maxWorkers : 0,
      overallAvgExecutionTime: maxWorkers > 0 ? totalAvgTime / maxWorkers : 0
    };

    // NASA Rule 10: Assertions
    console.assert(summary.totalWorkers <= 1000, 'Worker count bounded to 1000');
    console.assert(summary.overallErrorRate >= 0 && summary.overallErrorRate <= 1, 'Overall error rate must be 0-1');

    return summary;
  }

  /**
   * Clear metrics for worker
   */
  clearWorkerMetrics(workerId: string): void {
    console.assert(workerId && workerId.length > 0, 'Worker ID required');

    this.metricsHistory.delete(workerId);
    this.performanceData.delete(workerId);
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: mega-agent-096-drone-elimination
// inputs: ["DroneTypes.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"v1"}
// === END FOOTER ===