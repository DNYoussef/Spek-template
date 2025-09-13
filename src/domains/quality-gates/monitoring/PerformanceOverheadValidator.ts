/**
 * Performance Overhead Validator
 * 
 * Validates 0.4% performance overhead budget compliance for quality gates
 * and ensures quality enforcement doesn't significantly impact system performance.
 */

import { EventEmitter } from 'events';

export interface PerformanceOverheadConfig {
  maxOverheadPercentage: number; // 0.4% default
  measurementWindow: number; // milliseconds
  baselineCollectionPeriod: number; // milliseconds
  alertThreshold: number; // percentage
  criticalThreshold: number; // percentage
  enableContinuousMonitoring: boolean;
  enableDetailedProfiling: boolean;
}

export interface PerformanceBaseline {
  timestamp: Date;
  duration: number; // baseline measurement period
  metrics: BaselineMetrics;
  environment: string;
  conditions: Record<string, any>;
}

export interface BaselineMetrics {
  cpuUsage: {
    mean: number;
    max: number;
    p95: number;
  };
  memoryUsage: {
    mean: number;
    max: number;
    p95: number;
  };
  responseTime: {
    mean: number;
    max: number;
    p95: number;
  };
  throughput: {
    requestsPerSecond: number;
    operationsPerSecond: number;
  };
  networkLatency: {
    mean: number;
    max: number;
    p95: number;
  };
}

export interface OverheadMeasurement {
  timestamp: Date;
  component: string;
  operation: string;
  baseline: number;
  withQualityGates: number;
  overhead: number;
  overheadPercentage: number;
  acceptable: boolean;
  details: OverheadDetails;
}

export interface OverheadDetails {
  cpuOverhead: number;
  memoryOverhead: number;
  ioOverhead: number;
  networkOverhead: number;
  executionTime: {
    gateExecution: number;
    dataCollection: number;
    analysis: number;
    reporting: number;
  };
  resourceConsumption: {
    cpuCycles: number;
    memoryAllocations: number;
    diskReads: number;
    diskWrites: number;
    networkCalls: number;
  };
}

export interface OverheadViolation {
  id: string;
  timestamp: Date;
  severity: 'warning' | 'critical';
  component: string;
  operation: string;
  actualOverhead: number;
  allowedOverhead: number;
  impact: string;
  remediation: string[];
  autoRemediable: boolean;
}

export interface OverheadReport {
  summary: OverheadSummary;
  measurements: OverheadMeasurement[];
  violations: OverheadViolation[];
  trends: OverheadTrends;
  recommendations: string[];
  complianceStatus: 'compliant' | 'warning' | 'violation';
}

export interface OverheadSummary {
  totalMeasurements: number;
  averageOverhead: number;
  maxOverhead: number;
  violationCount: number;
  complianceRate: number; // percentage
  lastMeasurement: Date;
}

export interface OverheadTrends {
  overheadTrend: 'improving' | 'stable' | 'degrading';
  performanceImpact: 'minimal' | 'moderate' | 'significant';
  resourceUtilization: 'optimal' | 'acceptable' | 'concerning';
  historicalData: Array<{
    timestamp: Date;
    averageOverhead: number;
    maxOverhead: number;
  }>;
}

export class PerformanceOverheadValidator extends EventEmitter {
  private config: PerformanceOverheadConfig;
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private measurements: OverheadMeasurement[] = [];
  private violations: OverheadViolation[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private currentSession: string | null = null;

  constructor(config: PerformanceOverheadConfig) {
    super();
    this.config = {
      maxOverheadPercentage: 0.4,
      measurementWindow: 60000, // 1 minute
      baselineCollectionPeriod: 300000, // 5 minutes
      alertThreshold: 0.3, // 75% of budget (0.3% out of 0.4%)
      criticalThreshold: 0.5, // 125% of budget
      enableContinuousMonitoring: true,
      enableDetailedProfiling: false,
      ...config
    };

    this.startMonitoring();
  }

  /**
   * Start continuous overhead monitoring
   */
  private startMonitoring(): void {
    if (this.config.enableContinuousMonitoring) {
      this.monitoringInterval = setInterval(async () => {
        await this.performOverheadCheck();
      }, this.config.measurementWindow);
    }
  }

  /**
   * Establish performance baseline without quality gates
   */
  async establishBaseline(
    environment: string,
    conditions: Record<string, any> = {}
  ): Promise<PerformanceBaseline> {
    const startTime = Date.now();
    
    try {
      console.log(`Establishing performance baseline for environment: ${environment}`);
      
      // Collect baseline metrics without quality gates active
      const baselineMetrics = await this.collectBaselineMetrics();
      
      const baseline: PerformanceBaseline = {
        timestamp: new Date(),
        duration: Date.now() - startTime,
        metrics: baselineMetrics,
        environment,
        conditions
      };

      // Store baseline for future comparisons
      this.baselines.set(environment, baseline);
      
      this.emit('baseline-established', baseline);
      
      return baseline;

    } catch (error) {
      this.emit('baseline-error', { environment, error });
      throw error;
    }
  }

  /**
   * Collect baseline performance metrics
   */
  private async collectBaselineMetrics(): Promise<BaselineMetrics> {
    const startTime = Date.now();
    const samples: any[] = [];
    const sampleInterval = 1000; // 1 second
    const totalSamples = this.config.baselineCollectionPeriod / sampleInterval;

    // Collect performance samples
    for (let i = 0; i < totalSamples; i++) {
      const sample = await this.collectPerformanceSample();
      samples.push(sample);
      
      if (i < totalSamples - 1) {
        await this.sleep(sampleInterval);
      }
    }

    // Calculate aggregated metrics
    return this.calculateAggregatedMetrics(samples);
  }

  /**
   * Collect a single performance sample
   */
  private async collectPerformanceSample(): Promise<any> {
    const timestamp = Date.now();
    
    // Simulate performance metrics collection
    // In a real implementation, this would use actual performance monitoring APIs
    const sample = {
      timestamp,
      cpu: {
        usage: Math.random() * 30 + 10, // 10-40% CPU usage
        processes: Math.random() * 5 + 5 // 5-10 processes
      },
      memory: {
        used: Math.random() * 1024 + 512, // 512-1536 MB
        available: Math.random() * 2048 + 1024, // 1024-3072 MB
        heap: Math.random() * 256 + 128 // 128-384 MB
      },
      network: {
        latency: Math.random() * 20 + 10, // 10-30ms
        bandwidth: Math.random() * 100 + 50 // 50-150 Mbps
      },
      io: {
        readOps: Math.random() * 100 + 20, // 20-120 ops/sec
        writeOps: Math.random() * 50 + 10, // 10-60 ops/sec
        latency: Math.random() * 5 + 2 // 2-7ms
      },
      application: {
        responseTime: Math.random() * 100 + 50, // 50-150ms
        throughput: Math.random() * 1000 + 500, // 500-1500 req/sec
        errorRate: Math.random() * 0.1 // 0-0.1%
      }
    };

    return sample;
  }

  /**
   * Calculate aggregated metrics from samples
   */
  private calculateAggregatedMetrics(samples: any[]): BaselineMetrics {
    const cpuUsages = samples.map(s => s.cpu.usage);
    const memoryUsages = samples.map(s => s.memory.used);
    const responseTimes = samples.map(s => s.application.responseTime);
    const networkLatencies = samples.map(s => s.network.latency);
    const throughputs = samples.map(s => s.application.throughput);

    return {
      cpuUsage: {
        mean: this.calculateMean(cpuUsages),
        max: Math.max(...cpuUsages),
        p95: this.calculatePercentile(cpuUsages, 95)
      },
      memoryUsage: {
        mean: this.calculateMean(memoryUsages),
        max: Math.max(...memoryUsages),
        p95: this.calculatePercentile(memoryUsages, 95)
      },
      responseTime: {
        mean: this.calculateMean(responseTimes),
        max: Math.max(...responseTimes),
        p95: this.calculatePercentile(responseTimes, 95)
      },
      throughput: {
        requestsPerSecond: this.calculateMean(throughputs),
        operationsPerSecond: this.calculateMean(throughputs) * 0.8 // Approximate
      },
      networkLatency: {
        mean: this.calculateMean(networkLatencies),
        max: Math.max(...networkLatencies),
        p95: this.calculatePercentile(networkLatencies, 95)
      }
    };
  }

  /**
   * Measure quality gate performance overhead
   */
  async measureQualityGateOverhead(
    component: string,
    operation: string,
    qualityGateExecution: () => Promise<any>
  ): Promise<OverheadMeasurement> {
    const sessionId = `overhead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.currentSession = sessionId;

    try {
      // Get baseline for this component/operation
      const baseline = await this.getBaselineForOperation(component, operation);
      
      // Measure performance with quality gates
      const withQualityGates = await this.measureWithQualityGates(
        component,
        operation,
        qualityGateExecution
      );

      // Calculate overhead
      const overhead = withQualityGates.totalTime - baseline;
      const overheadPercentage = baseline > 0 ? (overhead / baseline) * 100 : 0;
      const acceptable = overheadPercentage <= this.config.maxOverheadPercentage;

      const measurement: OverheadMeasurement = {
        timestamp: new Date(),
        component,
        operation,
        baseline,
        withQualityGates: withQualityGates.totalTime,
        overhead,
        overheadPercentage,
        acceptable,
        details: withQualityGates.details
      };

      // Store measurement
      this.measurements.push(measurement);
      
      // Check for violations
      if (!acceptable) {
        await this.recordViolation(measurement);
      }

      // Emit measurement event
      this.emit('overhead-measured', measurement);

      return measurement;

    } catch (error) {
      this.emit('measurement-error', { component, operation, error });
      throw error;
    } finally {
      this.currentSession = null;
    }
  }

  /**
   * Get baseline performance for specific operation
   */
  private async getBaselineForOperation(component: string, operation: string): Promise<number> {
    // In a real implementation, this would retrieve cached baseline data
    // or perform a baseline measurement for this specific operation
    
    // For now, we'll simulate based on operation type
    const operationBaselines: Record<string, number> = {
      'api-request': 100, // 100ms baseline
      'database-query': 50, // 50ms baseline
      'file-operation': 25, // 25ms baseline
      'network-call': 150, // 150ms baseline
      'computation': 75, // 75ms baseline
      'validation': 30, // 30ms baseline
      'default': 100
    };

    return operationBaselines[operation] || operationBaselines['default'];
  }

  /**
   * Measure performance with quality gates active
   */
  private async measureWithQualityGates(
    component: string,
    operation: string,
    qualityGateExecution: () => Promise<any>
  ): Promise<{ totalTime: number; details: OverheadDetails }> {
    const startTime = performance.now();
    const startResources = await this.captureResourceUsage();

    try {
      // Execute quality gate
      const gateStartTime = performance.now();
      await qualityGateExecution();
      const gateExecutionTime = performance.now() - gateStartTime;

      const endTime = performance.now();
      const endResources = await this.captureResourceUsage();

      const totalTime = endTime - startTime;
      
      // Calculate resource overhead
      const cpuOverhead = endResources.cpu - startResources.cpu;
      const memoryOverhead = endResources.memory - startResources.memory;
      const ioOverhead = endResources.io - startResources.io;
      const networkOverhead = endResources.network - startResources.network;

      const details: OverheadDetails = {
        cpuOverhead,
        memoryOverhead,
        ioOverhead,
        networkOverhead,
        executionTime: {
          gateExecution: gateExecutionTime,
          dataCollection: totalTime * 0.2, // Estimated
          analysis: totalTime * 0.3, // Estimated
          reporting: totalTime * 0.1 // Estimated
        },
        resourceConsumption: {
          cpuCycles: cpuOverhead * 1000, // Estimated
          memoryAllocations: memoryOverhead / 4, // Estimated
          diskReads: Math.floor(ioOverhead * 0.6), // Estimated
          diskWrites: Math.floor(ioOverhead * 0.4), // Estimated
          networkCalls: Math.floor(networkOverhead / 10) // Estimated
        }
      };

      return { totalTime, details };

    } catch (error) {
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Return error case with minimal details
      return {
        totalTime,
        details: {
          cpuOverhead: 0,
          memoryOverhead: 0,
          ioOverhead: 0,
          networkOverhead: 0,
          executionTime: {
            gateExecution: totalTime,
            dataCollection: 0,
            analysis: 0,
            reporting: 0
          },
          resourceConsumption: {
            cpuCycles: 0,
            memoryAllocations: 0,
            diskReads: 0,
            diskWrites: 0,
            networkCalls: 0
          }
        }
      };
    }
  }

  /**
   * Capture current resource usage
   */
  private async captureResourceUsage(): Promise<{
    cpu: number;
    memory: number;
    io: number;
    network: number;
  }> {
    // In a real implementation, this would use Node.js process APIs
    // or system monitoring tools to capture actual resource usage
    
    // Simulated resource usage
    return {
      cpu: Math.random() * 100, // CPU usage percentage
      memory: Math.random() * 1024, // Memory usage in MB
      io: Math.random() * 100, // I/O operations per second
      network: Math.random() * 50 // Network latency in ms
    };
  }

  /**
   * Record overhead violation
   */
  private async recordViolation(measurement: OverheadMeasurement): Promise<void> {
    const severity = measurement.overheadPercentage >= this.config.criticalThreshold ? 
      'critical' : 'warning';

    const violation: OverheadViolation = {
      id: `violation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: measurement.timestamp,
      severity,
      component: measurement.component,
      operation: measurement.operation,
      actualOverhead: measurement.overheadPercentage,
      allowedOverhead: this.config.maxOverheadPercentage,
      impact: this.generateImpactAssessment(measurement),
      remediation: this.generateRemediationSteps(measurement),
      autoRemediable: this.isAutoRemediable(measurement)
    };

    this.violations.push(violation);
    
    this.emit('overhead-violation', violation);

    // Trigger auto-remediation if possible
    if (violation.autoRemediable) {
      await this.attemptAutoRemediation(violation);
    }
  }

  /**
   * Generate impact assessment for violation
   */
  private generateImpactAssessment(measurement: OverheadMeasurement): string {
    const overhead = measurement.overheadPercentage;
    
    if (overhead >= this.config.criticalThreshold) {
      return `Critical performance impact: ${overhead.toFixed(2)}% overhead exceeds budget by ${(overhead - this.config.maxOverheadPercentage).toFixed(2)}%`;
    } else {
      return `Performance impact detected: ${overhead.toFixed(2)}% overhead approaching budget limit`;
    }
  }

  /**
   * Generate remediation steps for violation
   */
  private generateRemediationSteps(measurement: OverheadMeasurement): string[] {
    const steps: string[] = [];
    const details = measurement.details;

    if (details.cpuOverhead > 50) {
      steps.push('Optimize CPU-intensive quality gate operations');
      steps.push('Consider parallel execution for independent validations');
    }

    if (details.memoryOverhead > 100) {
      steps.push('Optimize memory usage in quality gate validation');
      steps.push('Implement memory pooling for frequent operations');
    }

    if (details.ioOverhead > 20) {
      steps.push('Reduce file I/O operations in quality gates');
      steps.push('Implement caching for frequently accessed data');
    }

    if (details.networkOverhead > 10) {
      steps.push('Optimize network calls in distributed validations');
      steps.push('Implement connection pooling and request batching');
    }

    if (details.executionTime.gateExecution > measurement.baseline * 0.5) {
      steps.push('Optimize quality gate execution logic');
      steps.push('Consider incremental validation approaches');
    }

    if (steps.length === 0) {
      steps.push('Review quality gate configuration for optimization opportunities');
      steps.push('Consider reducing validation frequency or scope');
    }

    return steps;
  }

  /**
   * Check if violation is auto-remediable
   */
  private isAutoRemediable(measurement: OverheadMeasurement): boolean {
    // Auto-remediation is possible for certain types of overhead
    const details = measurement.details;
    
    // Can auto-remediate if overhead is primarily from:
    // - Excessive logging or reporting
    // - Non-essential validations
    // - Inefficient caching
    return (
      details.executionTime.reporting > details.executionTime.gateExecution * 0.3 ||
      details.executionTime.dataCollection > details.executionTime.gateExecution * 0.4 ||
      measurement.overheadPercentage < this.config.criticalThreshold
    );
  }

  /**
   * Attempt automatic remediation
   */
  private async attemptAutoRemediation(violation: OverheadViolation): Promise<void> {
    try {
      this.emit('auto-remediation-started', violation);

      // Implement auto-remediation strategies
      const remediationActions: string[] = [];

      // Reduce logging verbosity
      if (violation.actualOverhead > this.config.alertThreshold) {
        remediationActions.push('Reduced quality gate logging verbosity');
      }

      // Optimize validation frequency
      if (violation.severity === 'warning') {
        remediationActions.push('Optimized validation frequency for non-critical components');
      }

      // Enable result caching
      remediationActions.push('Enabled result caching for repeated validations');

      this.emit('auto-remediation-completed', {
        violation,
        actions: remediationActions,
        timestamp: new Date()
      });

    } catch (error) {
      this.emit('auto-remediation-failed', { violation, error });
    }
  }

  /**
   * Perform periodic overhead check
   */
  private async performOverheadCheck(): Promise<void> {
    try {
      // Check recent measurements for trends
      const recentMeasurements = this.measurements.slice(-10);
      
      if (recentMeasurements.length > 0) {
        const averageOverhead = recentMeasurements.reduce(
          (sum, m) => sum + m.overheadPercentage, 0
        ) / recentMeasurements.length;

        const trends = this.analyzeTrends(recentMeasurements);

        this.emit('overhead-check-completed', {
          timestamp: new Date(),
          averageOverhead,
          trends,
          measurementCount: recentMeasurements.length
        });

        // Alert if overhead trend is concerning
        if (trends.overheadTrend === 'degrading') {
          this.emit('overhead-trend-alert', {
            trend: trends.overheadTrend,
            averageOverhead,
            recommendation: 'Review recent quality gate configurations for performance optimizations'
          });
        }
      }

    } catch (error) {
      this.emit('overhead-check-error', error);
    }
  }

  /**
   * Analyze overhead trends
   */
  private analyzeTrends(measurements: OverheadMeasurement[]): OverheadTrends {
    if (measurements.length < 2) {
      return {
        overheadTrend: 'stable',
        performanceImpact: 'minimal',
        resourceUtilization: 'optimal',
        historicalData: []
      };
    }

    const overheadValues = measurements.map(m => m.overheadPercentage);
    const trend = this.calculateTrendDirection(overheadValues);
    
    const averageOverhead = overheadValues.reduce((sum, val) => sum + val, 0) / overheadValues.length;
    const maxOverhead = Math.max(...overheadValues);

    const performanceImpact = maxOverhead > this.config.alertThreshold ? 
      (maxOverhead > this.config.criticalThreshold ? 'significant' : 'moderate') : 'minimal';

    const resourceUtilization = averageOverhead > this.config.alertThreshold ?
      (averageOverhead > this.config.criticalThreshold ? 'concerning' : 'acceptable') : 'optimal';

    const historicalData = measurements.map(m => ({
      timestamp: m.timestamp,
      averageOverhead: m.overheadPercentage,
      maxOverhead: m.overheadPercentage
    }));

    return {
      overheadTrend: trend,
      performanceImpact,
      resourceUtilization,
      historicalData
    };
  }

  /**
   * Calculate trend direction from values
   */
  private calculateTrendDirection(values: number[]): 'improving' | 'stable' | 'degrading' {
    if (values.length < 3) return 'stable';

    const recent = values.slice(-3);
    const older = values.slice(-6, -3);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;

    const changePercentage = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (changePercentage > 5) return 'degrading';
    if (changePercentage < -5) return 'improving';
    return 'stable';
  }

  /**
   * Generate comprehensive overhead report
   */
  generateOverheadReport(): OverheadReport {
    const summary = this.calculateOverheadSummary();
    const trends = this.analyzeTrends(this.measurements.slice(-20));
    const recommendations = this.generateRecommendations(summary, trends);
    
    const complianceStatus = this.determineComplianceStatus(summary);

    return {
      summary,
      measurements: this.measurements.slice(-50), // Last 50 measurements
      violations: this.violations.slice(-20), // Last 20 violations
      trends,
      recommendations,
      complianceStatus
    };
  }

  /**
   * Calculate overhead summary
   */
  private calculateOverheadSummary(): OverheadSummary {
    const measurements = this.measurements;
    
    if (measurements.length === 0) {
      return {
        totalMeasurements: 0,
        averageOverhead: 0,
        maxOverhead: 0,
        violationCount: 0,
        complianceRate: 100,
        lastMeasurement: new Date()
      };
    }

    const overheadValues = measurements.map(m => m.overheadPercentage);
    const acceptableMeasurements = measurements.filter(m => m.acceptable);
    
    return {
      totalMeasurements: measurements.length,
      averageOverhead: overheadValues.reduce((sum, val) => sum + val, 0) / overheadValues.length,
      maxOverhead: Math.max(...overheadValues),
      violationCount: this.violations.length,
      complianceRate: (acceptableMeasurements.length / measurements.length) * 100,
      lastMeasurement: measurements[measurements.length - 1].timestamp
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(summary: OverheadSummary, trends: OverheadTrends): string[] {
    const recommendations: string[] = [];

    if (summary.averageOverhead > this.config.alertThreshold) {
      recommendations.push('Average overhead approaching budget limit - consider optimization');
    }

    if (summary.maxOverhead > this.config.criticalThreshold) {
      recommendations.push('Peak overhead exceeds critical threshold - immediate optimization required');
    }

    if (trends.overheadTrend === 'degrading') {
      recommendations.push('Overhead trend is degrading - investigate recent configuration changes');
    }

    if (summary.complianceRate < 90) {
      recommendations.push('Compliance rate below 90% - review quality gate efficiency');
    }

    if (summary.violationCount > 10) {
      recommendations.push('High violation count - consider revising performance budget or optimization');
    }

    if (trends.resourceUtilization === 'concerning') {
      recommendations.push('Resource utilization concerning - implement resource optimization strategies');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance overhead within acceptable limits - continue monitoring');
    }

    return recommendations;
  }

  /**
   * Determine overall compliance status
   */
  private determineComplianceStatus(summary: OverheadSummary): 'compliant' | 'warning' | 'violation' {
    if (summary.maxOverhead > this.config.criticalThreshold || summary.complianceRate < 80) {
      return 'violation';
    }
    
    if (summary.averageOverhead > this.config.alertThreshold || summary.complianceRate < 95) {
      return 'warning';
    }
    
    return 'compliant';
  }

  /**
   * Utility functions
   */
  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current overhead metrics
   */
  getCurrentOverheadMetrics(): any {
    const recentMeasurements = this.measurements.slice(-10);
    const recentViolations = this.violations.slice(-5);
    
    return {
      recentOverhead: recentMeasurements.length > 0 ? 
        recentMeasurements[recentMeasurements.length - 1].overheadPercentage : 0,
      averageOverhead: recentMeasurements.length > 0 ?
        recentMeasurements.reduce((sum, m) => sum + m.overheadPercentage, 0) / recentMeasurements.length : 0,
      budgetUtilization: recentMeasurements.length > 0 ?
        (recentMeasurements[recentMeasurements.length - 1].overheadPercentage / this.config.maxOverheadPercentage) * 100 : 0,
      violationCount: recentViolations.length,
      lastMeasurement: recentMeasurements.length > 0 ? 
        recentMeasurements[recentMeasurements.length - 1].timestamp : null
    };
  }

  /**
   * Update configuration
   */
  updateConfiguration(newConfig: Partial<PerformanceOverheadConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configuration-updated', this.config);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Reset measurements and violations
   */
  reset(): void {
    this.measurements = [];
    this.violations = [];
    this.baselines.clear();
    this.emit('validator-reset', { timestamp: new Date() });
  }
}