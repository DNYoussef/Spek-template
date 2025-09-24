/**
 * SwarmMetrics - Performance tracking, resource monitoring, and audit trail
 * Centralizes all metrics collection and reporting for the swarm
 */

import { EventEmitter } from 'events';

interface QueenMetrics {
  totalPrincesses: number;
  activePrincesses: number;
  totalAgents: number;
  contextIntegrity: number;
  consensusSuccess: number;
  degradationRate: number;
  byzantineNodes: number;
  crossHiveMessages: number;
}

interface PerformanceMetrics {
  taskExecutionTime: number[];
  consensusTime: number[];
  messageLatency: number[];
  averageExecutionTime: number;
  averageConsensusTime: number;
  averageMessageLatency: number;
}

interface ResourceMetrics {
  memoryUsage: number;
  cpuUsage: number;
  contextUsage: number;
  networkBandwidth: number;
}

export class SwarmMetrics extends EventEmitter {
  private queenMetrics: QueenMetrics = {
    totalPrincesses: 0,
    activePrincesses: 0,
    totalAgents: 0,
    contextIntegrity: 0,
    consensusSuccess: 0,
    degradationRate: 0,
    byzantineNodes: 0,
    crossHiveMessages: 0
  };

  private performanceMetrics: PerformanceMetrics = {
    taskExecutionTime: [],
    consensusTime: [],
    messageLatency: [],
    averageExecutionTime: 0,
    averageConsensusTime: 0,
    averageMessageLatency: 0
  };

  private resourceMetrics: ResourceMetrics = {
    memoryUsage: 0,
    cpuUsage: 0,
    contextUsage: 0,
    networkBandwidth: 0
  };

  private auditTrail: Array<{
    timestamp: number;
    event: string;
    details: any;
  }> = [];

  constructor() {
    super();
  }

  /**
   * Update queen-level metrics
   */
  updateQueenMetrics(updates: Partial<QueenMetrics>): void {
    this.queenMetrics = {
      ...this.queenMetrics,
      ...updates
    };

    this.emit('metrics:updated', this.queenMetrics);
  }

  /**
   * Record task execution time
   */
  recordTaskExecution(executionTime: number): void {
    this.performanceMetrics.taskExecutionTime.push(executionTime);
    this.updateAverageExecutionTime();

    this.auditTrail.push({
      timestamp: Date.now(),
      event: 'task_executed',
      details: { executionTime }
    });
  }

  /**
   * Record consensus time
   */
  recordConsensusTime(consensusTime: number): void {
    this.performanceMetrics.consensusTime.push(consensusTime);
    this.updateAverageConsensusTime();

    this.auditTrail.push({
      timestamp: Date.now(),
      event: 'consensus_completed',
      details: { consensusTime }
    });
  }

  /**
   * Record message latency
   */
  recordMessageLatency(latency: number): void {
    this.performanceMetrics.messageLatency.push(latency);
    this.updateAverageMessageLatency();
  }

  /**
   * Update resource metrics
   */
  updateResourceMetrics(updates: Partial<ResourceMetrics>): void {
    this.resourceMetrics = {
      ...this.resourceMetrics,
      ...updates
    };

    this.emit('resources:updated', this.resourceMetrics);
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics(): QueenMetrics {
    return { ...this.queenMetrics };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get resource metrics
   */
  getResourceMetrics(): ResourceMetrics {
    return { ...this.resourceMetrics };
  }

  /**
   * Get audit trail
   */
  getAuditTrail(limit?: number): Array<{ timestamp: number; event: string; details: any }> {
    if (limit) {
      return this.auditTrail.slice(-limit);
    }
    return [...this.auditTrail];
  }

  /**
   * Add audit entry
   */
  addAuditEntry(event: string, details: any): void {
    this.auditTrail.push({
      timestamp: Date.now(),
      event,
      details
    });

    // Limit audit trail size
    if (this.auditTrail.length > 10000) {
      this.auditTrail = this.auditTrail.slice(-5000);
    }
  }

  /**
   * Update average execution time
   */
  private updateAverageExecutionTime(): void {
    const times = this.performanceMetrics.taskExecutionTime;
    this.performanceMetrics.averageExecutionTime =
      times.reduce((sum, t) => sum + t, 0) / times.length;
  }

  /**
   * Update average consensus time
   */
  private updateAverageConsensusTime(): void {
    const times = this.performanceMetrics.consensusTime;
    this.performanceMetrics.averageConsensusTime =
      times.reduce((sum, t) => sum + t, 0) / times.length;
  }

  /**
   * Update average message latency
   */
  private updateAverageMessageLatency(): void {
    const latencies = this.performanceMetrics.messageLatency;
    this.performanceMetrics.averageMessageLatency =
      latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
  }

  /**
   * Generate metrics report
   */
  generateReport(): {
    queen: QueenMetrics;
    performance: PerformanceMetrics;
    resources: ResourceMetrics;
    recentAudit: Array<{ timestamp: number; event: string; details: any }>;
  } {
    return {
      queen: this.getMetrics(),
      performance: this.getPerformanceMetrics(),
      resources: this.getResourceMetrics(),
      recentAudit: this.getAuditTrail(100)
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.queenMetrics = {
      totalPrincesses: 0,
      activePrincesses: 0,
      totalAgents: 0,
      contextIntegrity: 0,
      consensusSuccess: 0,
      degradationRate: 0,
      byzantineNodes: 0,
      crossHiveMessages: 0
    };

    this.performanceMetrics = {
      taskExecutionTime: [],
      consensusTime: [],
      messageLatency: [],
      averageExecutionTime: 0,
      averageConsensusTime: 0,
      averageMessageLatency: 0
    };

    this.resourceMetrics = {
      memoryUsage: 0,
      cpuUsage: 0,
      contextUsage: 0,
      networkBandwidth: 0
    };

    this.auditTrail = [];
  }
}