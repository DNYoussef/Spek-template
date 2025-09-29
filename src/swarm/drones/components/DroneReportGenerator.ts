/**
 * Drone Report Generator - Single Responsibility Report Generation
 * NASA Rule 10 Compliant: ≤60 line functions, no recursion, bounded loops
 */

import { DroneWorker, DroneTask, DroneMetrics, DroneState } from '../fsm/DroneTypes';

export interface DroneReport {
  workerId: string;
  timestamp: Date;
  taskId: string;
  status: 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'ERROR';
  executionTimeMs: number;
  details: any;
  metrics: DroneMetrics;
}

export class DroneReportGenerator {
  private reports: Map<string, DroneReport[]> = new Map();

  /**
   * Generate report for completed drone task
   * NASA Rule 10: ≤60 lines, bounded report generation
   */
  generateReport(worker: DroneWorker, task: DroneTask, executionTimeMs: number, status: 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'ERROR', details?: any): DroneReport {
    console.assert(worker && worker.id, 'Valid worker required for report generation');
    console.assert(task && task.id, 'Valid task required for report generation');
    console.assert(executionTimeMs >= 0, 'Execution time must be non-negative');

    const report: DroneReport = {
      workerId: worker.id,
      timestamp: new Date(),
      taskId: task.id,
      status,
      executionTimeMs,
      details: details || {},
      metrics: worker.metrics
    };

    // Store report (bounded to 100 reports per worker)
    this.storeReport(worker.id, report);

    // NASA Rule 10: Post-condition assertions
    console.assert(report.workerId === worker.id, 'Report worker ID must match');
    console.assert(report.taskId === task.id, 'Report task ID must match');

    return report;
  }

  /**
   * Store report for worker with bounded storage
   * NASA Rule 10: ≤60 lines, bounded storage
   */
  private storeReport(workerId: string, report: DroneReport): void {
    console.assert(workerId && workerId.length > 0, 'Worker ID required');
    console.assert(report, 'Report required');

    let workerReports = this.reports.get(workerId) || [];
    workerReports.push(report);

    // Keep only last 100 reports per worker (bounded storage)
    if (workerReports.length > 100) {
      workerReports = workerReports.slice(-100);
    }

    this.reports.set(workerId, workerReports);

    // NASA Rule 10: Post-condition assertion
    console.assert(workerReports.length <= 100, 'Reports bounded to 100 per worker');
  }

  /**
   * Generate summary report for worker
   * NASA Rule 10: ≤60 lines, bounded summarization
   */
  generateWorkerSummary(workerId: string): any {
    console.assert(workerId && workerId.length > 0, 'Worker ID required');

    const workerReports = this.reports.get(workerId) || [];
    if (workerReports.length === 0) {
      return {
        workerId,
        totalReports: 0,
        successRate: 0,
        averageExecutionTime: 0,
        lastActivity: null
      };
    }

    // Bounded summary calculation (max 100 reports)
    const recentReports = workerReports.slice(-100);
    let successCount = 0;
    let totalExecutionTime = 0;

    for (let i = 0; i < recentReports.length; i++) {
      const report = recentReports[i];
      if (report.status === 'SUCCESS') {
        successCount++;
      }
      totalExecutionTime += report.executionTimeMs;
    }

    const summary = {
      workerId,
      totalReports: recentReports.length,
      successRate: recentReports.length > 0 ? successCount / recentReports.length : 0,
      averageExecutionTime: recentReports.length > 0 ? totalExecutionTime / recentReports.length : 0,
      lastActivity: recentReports.length > 0 ? recentReports[recentReports.length - 1].timestamp : null
    };

    // NASA Rule 10: Assertions
    console.assert(summary.successRate >= 0 && summary.successRate <= 1, 'Success rate must be 0-1');
    console.assert(summary.averageExecutionTime >= 0, 'Average execution time must be non-negative');

    return summary;
  }

  /**
   * Generate aggregate report for all workers
   * NASA Rule 10: ≤60 lines, bounded aggregation
   */
  generateAggregateReport(): any {
    const workerIds = Array.from(this.reports.keys());
    const maxWorkers = Math.min(workerIds.length, 1000); // Bounded to 1000 workers

    let totalReports = 0;
    let totalSuccesses = 0;
    let totalExecutionTime = 0;
    let totalWorkers = 0;

    for (let i = 0; i < maxWorkers; i++) {
      const workerId = workerIds[i];
      const workerReports = this.reports.get(workerId) || [];

      if (workerReports.length > 0) {
        totalWorkers++;
        totalReports += workerReports.length;

        // Count successes and execution time (bounded loop)
        for (let j = 0; j < Math.min(workerReports.length, 100); j++) {
          const report = workerReports[j];
          if (report.status === 'SUCCESS') {
            totalSuccesses++;
          }
          totalExecutionTime += report.executionTimeMs;
        }
      }
    }

    const aggregateReport = {
      totalWorkers,
      totalReports,
      overallSuccessRate: totalReports > 0 ? totalSuccesses / totalReports : 0,
      averageExecutionTime: totalReports > 0 ? totalExecutionTime / totalReports : 0,
      generatedAt: new Date()
    };

    // NASA Rule 10: Assertions
    console.assert(aggregateReport.totalWorkers <= 1000, 'Worker count bounded to 1000');
    console.assert(aggregateReport.overallSuccessRate >= 0 && aggregateReport.overallSuccessRate <= 1, 'Success rate must be 0-1');

    return aggregateReport;
  }

  /**
   * Get recent reports for worker
   * NASA Rule 10: ≤60 lines, bounded retrieval
   */
  getRecentReports(workerId: string, count: number = 10): DroneReport[] {
    console.assert(workerId && workerId.length > 0, 'Worker ID required');
    console.assert(count > 0 && count <= 100, 'Count must be 1-100');

    const workerReports = this.reports.get(workerId) || [];
    const boundedCount = Math.min(count, 100); // Bounded to max 100 reports

    const recentReports = workerReports.slice(-boundedCount);

    // NASA Rule 10: Post-condition assertion
    console.assert(recentReports.length <= boundedCount, 'Returned reports bounded correctly');

    return recentReports;
  }

  /**
   * Clear reports for worker
   */
  clearWorkerReports(workerId: string): void {
    console.assert(workerId && workerId.length > 0, 'Worker ID required');
    this.reports.delete(workerId);
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