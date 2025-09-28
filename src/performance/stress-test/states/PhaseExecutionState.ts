/**
 * Phase Execution State Implementation
 * Handles stress test phase execution with performance monitoring
 * NASA Rule 10 compliant: Fixed bounds for all operations
 */

import { EventEmitter } from 'events';
import { LoadGenerator, LoadConfig } from '../../LoadGenerator';
import { MetricsCollector } from '../../MetricsCollector';
import { MemoryProfiler } from '../../MemoryProfiler';
import { CPUProfiler } from '../../CPUProfiler';
import {
  StressTestContext,
  StressPhase,
  PhaseResult,
  Alert,
  ThresholdViolation,
  FailureThresholds
} from '../types/StressTestTypes';

export class PhaseExecutionState extends EventEmitter {
  private loadGenerator: LoadGenerator;
  private metricsCollector: MetricsCollector;
  private memoryProfiler: MemoryProfiler;
  private cpuProfiler: CPUProfiler;
  private readonly MAX_ALERTS_PER_PHASE = 50; // NASA Rule 10: Fixed bound
  private readonly MAX_VIOLATIONS_PER_PHASE = 20; // NASA Rule 10: Fixed bound
  private readonly MAX_METRICS_SNAPSHOTS = 1000; // NASA Rule 10: Fixed bound

  constructor(
    loadGenerator: LoadGenerator,
    metricsCollector: MetricsCollector,
    memoryProfiler: MemoryProfiler,
    cpuProfiler: CPUProfiler
  ) {
    super();
    this.loadGenerator = loadGenerator;
    this.metricsCollector = metricsCollector;
    this.memoryProfiler = memoryProfiler;
    this.cpuProfiler = cpuProfiler;
  }

  /**
   * Execute a stress test phase
   * NASA Rule 10: Fixed bounds for phase execution
   */
  async executePhase(context: StressTestContext): Promise<PhaseResult> {
    const phase = context.config.phases[context.currentPhaseIndex];
    if (!phase) {
      throw new Error('Invalid phase index');
    }

    this.emit('phase-start', { phase: phase.name, index: context.currentPhaseIndex });

    const phaseStartTime = Date.now();
    const alerts: Alert[] = [];
    const thresholdViolations: ThresholdViolation[] = [];
    const systemMetricsSnapshot: any[] = [];

    let memoryProfile: any = null;
    let cpuProfile: any = null;

    try {
      // Start profiling if enabled
      await this.startProfiling(context, phase);

      // Configure and run load generation
      const loadConfig = this.createLoadConfig(phase, context);
      const loadResult = await this.executeLoadGeneration(loadConfig);

      // Stop profiling and collect profiles
      ({ memoryProfile, cpuProfile } = await this.stopProfiling(context));

      // Collect final metrics
      this.collectFinalMetrics(systemMetricsSnapshot);

      // Analyze results
      this.analyzePhaseResults(phase, loadResult, context.config.failureThresholds, alerts);
      this.checkThresholdViolations(phase, loadResult, context.config.failureThresholds, thresholdViolations);

      const success = this.evaluatePhaseSuccess(thresholdViolations);

      const result: PhaseResult = {
        phaseName: phase.name,
        loadResult,
        systemMetrics: systemMetricsSnapshot,
        memoryProfile,
        cpuProfile,
        alerts: alerts.slice(0, this.MAX_ALERTS_PER_PHASE), // NASA Rule 10: Bounded
        thresholdViolations: thresholdViolations.slice(0, this.MAX_VIOLATIONS_PER_PHASE), // NASA Rule 10: Bounded
        success
      };

      this.emit('phase-complete', { phase: phase.name, result, duration: Date.now() - phaseStartTime });
      return result;

    } catch (error) {
      // Ensure cleanup on error
      await this.emergencyCleanup(context);
      this.emit('phase-error', { phase: phase.name, error });
      throw error;
    }
  }

  /**
   * Start profiling based on monitoring configuration
   */
  private async startProfiling(context: StressTestContext, phase: StressPhase): Promise<void> {
    const monitoring = context.config.monitoring;

    if (monitoring.collectMemoryProfile) {
      await this.memoryProfiler.startProfiling();
      this.emit('profiling-started', { type: 'memory', phase: phase.name });
    }

    if (monitoring.collectCPUProfile) {
      await this.cpuProfiler.startProfiling();
      this.emit('profiling-started', { type: 'cpu', phase: phase.name });
    }
  }

  /**
   * Create load configuration for phase
   */
  private createLoadConfig(phase: StressPhase, context: StressTestContext): LoadConfig {
    return {
      concurrency: phase.concurrency,
      duration: phase.duration,
      rampUpTime: phase.rampUpTime || 0,
      rampDownTime: phase.rampDownTime || 0,
      requestsPerSecond: phase.requestsPerSecond,
      distributionPattern: phase.distributionPattern,
      targetFunction: context.config.targets.targetFunction,
      targetModule: context.config.targets.targetModule,
      payload: context.config.targets.payload,
      timeout: context.config.failureThresholds.maxResponseTime
    };
  }

  /**
   * Execute load generation with monitoring
   */
  private async executeLoadGeneration(loadConfig: LoadConfig): Promise<any> {
    this.emit('load-start', loadConfig);

    const result = await this.loadGenerator.generateLoad(loadConfig);

    this.emit('load-complete', {
      totalRequests: result.totalRequests,
      successRate: result.successfulRequests / result.totalRequests,
      avgResponseTime: result.averageResponseTime
    });

    return result;
  }

  /**
   * Stop profiling and collect profiles
   */
  private async stopProfiling(context: StressTestContext): Promise<{
    memoryProfile: any;
    cpuProfile: any;
  }> {
    let memoryProfile: any = null;
    let cpuProfile: any = null;

    if (context.config.monitoring.collectMemoryProfile) {
      try {
        memoryProfile = await this.memoryProfiler.stopProfiling();
        this.emit('profiling-stopped', { type: 'memory', success: true });
      } catch (error) {
        this.emit('profiling-error', { type: 'memory', error });
      }
    }

    if (context.config.monitoring.collectCPUProfile) {
      try {
        cpuProfile = await this.cpuProfiler.stopProfiling();
        this.emit('profiling-stopped', { type: 'cpu', success: true });
      } catch (error) {
        this.emit('profiling-error', { type: 'cpu', error });
      }
    }

    return { memoryProfile, cpuProfile };
  }

  /**
   * Collect final system metrics
   * NASA Rule 10: Bounded collection
   */
  private collectFinalMetrics(systemMetricsSnapshot: any[]): void {
    const finalMetrics = this.metricsCollector.collectSystemMetrics();
    systemMetricsSnapshot.push(finalMetrics);

    // Ensure we don't exceed bounds
    if (systemMetricsSnapshot.length > this.MAX_METRICS_SNAPSHOTS) {
      systemMetricsSnapshot.splice(0, systemMetricsSnapshot.length - this.MAX_METRICS_SNAPSHOTS);
    }
  }

  /**
   * Analyze phase results and generate alerts
   * NASA Rule 10: Fixed bounds for analysis
   */
  private analyzePhaseResults(
    phase: StressPhase,
    loadResult: any,
    thresholds: FailureThresholds,
    alerts: Alert[]
  ): void {
    const MAX_ANALYSIS_CHECKS = 10; // NASA Rule 10: Fixed bound

    const checks = [
      () => this.checkResponseTimeAlert(loadResult, thresholds, alerts),
      () => this.checkSuccessRateAlert(loadResult, thresholds, alerts),
      () => this.checkMemoryAlert(loadResult, thresholds, alerts),
      () => this.checkCPUAlert(loadResult, thresholds, alerts),
      () => this.checkThroughputAlert(loadResult, thresholds, alerts)
    ];

    // NASA Rule 10: Process with fixed bound
    for (let i = 0; i < Math.min(checks.length, MAX_ANALYSIS_CHECKS); i++) {
      try {
        checks[i]();
      } catch (error) {
        this.emit('analysis-error', { check: i, error });
      }
    }
  }

  /**
   * Response time alert check
   */
  private checkResponseTimeAlert(loadResult: any, thresholds: FailureThresholds, alerts: Alert[]): void {
    if (loadResult.averageResponseTime > thresholds.maxResponseTime * 0.8) {
      alerts.push({
        timestamp: Date.now(),
        type: 'performance',
        level: 'warning',
        message: `Average response time approaching threshold: ${loadResult.averageResponseTime}ms`,
        metrics: {
          responseTime: loadResult.averageResponseTime,
          threshold: thresholds.maxResponseTime
        }
      });
    }
  }

  /**
   * Success rate alert check
   */
  private checkSuccessRateAlert(loadResult: any, thresholds: FailureThresholds, alerts: Alert[]): void {
    const successRate = loadResult.successfulRequests / loadResult.totalRequests;
    if (successRate < thresholds.minSuccessRate + 0.1) {
      alerts.push({
        timestamp: Date.now(),
        type: 'error',
        level: 'warning',
        message: `Success rate approaching threshold: ${(successRate * 100).toFixed(2)}%`,
        metrics: { successRate, threshold: thresholds.minSuccessRate }
      });
    }
  }

  /**
   * Memory usage alert check
   */
  private checkMemoryAlert(loadResult: any, thresholds: FailureThresholds, alerts: Alert[]): void {
    if (loadResult.memoryUsage && loadResult.memoryUsage.length > 0) {
      const avgMemoryMB = loadResult.memoryUsage.reduce((sum: number, m: any) =>
        sum + m.usage.heapUsed, 0) / loadResult.memoryUsage.length / 1024 / 1024;

      if (avgMemoryMB > thresholds.maxMemoryMB * 0.9) {
        alerts.push({
          timestamp: Date.now(),
          type: 'resource',
          level: 'warning',
          message: `Memory usage high: ${avgMemoryMB.toFixed(2)}MB`,
          metrics: { memoryMB: avgMemoryMB, threshold: thresholds.maxMemoryMB }
        });
      }
    }
  }

  /**
   * CPU usage alert check
   */
  private checkCPUAlert(loadResult: any, thresholds: FailureThresholds, alerts: Alert[]): void {
    if (loadResult.cpuUsage && loadResult.cpuUsage.length > 0) {
      const avgCPUPercent = loadResult.cpuUsage.reduce((sum: number, c: any) =>
        sum + (c.usage.user + c.usage.system) / 1000, 0) / loadResult.cpuUsage.length;

      if (avgCPUPercent > thresholds.maxCPUPercent * 0.9) {
        alerts.push({
          timestamp: Date.now(),
          type: 'resource',
          level: 'warning',
          message: `CPU usage high: ${avgCPUPercent.toFixed(2)}%`,
          metrics: { cpuPercent: avgCPUPercent, threshold: thresholds.maxCPUPercent }
        });
      }
    }
  }

  /**
   * Throughput alert check
   */
  private checkThroughputAlert(loadResult: any, thresholds: FailureThresholds, alerts: Alert[]): void {
    const expectedThroughput = loadResult.requestsPerSecond;
    const actualThroughput = loadResult.totalRequests / (loadResult.duration / 1000);

    if (actualThroughput < expectedThroughput * 0.8) {
      alerts.push({
        timestamp: Date.now(),
        type: 'performance',
        level: 'warning',
        message: `Throughput below expected: ${actualThroughput.toFixed(2)} RPS`,
        metrics: {
          actualThroughput,
          expectedThroughput
        }
      });
    }
  }

  /**
   * Check threshold violations
   * NASA Rule 10: Fixed bounds for violation checks
   */
  private checkThresholdViolations(
    phase: StressPhase,
    loadResult: any,
    thresholds: FailureThresholds,
    violations: ThresholdViolation[]
  ): void {
    // Response time violation
    if (loadResult.maxResponseTime > thresholds.maxResponseTime) {
      violations.push({
        timestamp: Date.now(),
        threshold: 'maxResponseTime',
        expected: thresholds.maxResponseTime,
        actual: loadResult.maxResponseTime,
        severity: 'major',
        duration: phase.duration
      });
    }

    // Success rate violation
    const successRate = loadResult.successfulRequests / loadResult.totalRequests;
    if (successRate < thresholds.minSuccessRate) {
      violations.push({
        timestamp: Date.now(),
        threshold: 'minSuccessRate',
        expected: thresholds.minSuccessRate,
        actual: successRate,
        severity: 'critical',
        duration: phase.duration
      });
    }

    // Error rate violation
    const errorRate = loadResult.failedRequests / loadResult.totalRequests;
    if (errorRate > thresholds.maxErrorRate) {
      violations.push({
        timestamp: Date.now(),
        threshold: 'maxErrorRate',
        expected: thresholds.maxErrorRate,
        actual: errorRate,
        severity: 'major',
        duration: phase.duration
      });
    }
  }

  /**
   * Evaluate phase success based on violations
   * NASA Rule 10: Fixed evaluation criteria
   */
  private evaluatePhaseSuccess(violations: ThresholdViolation[]): boolean {
    const criticalViolations = violations.filter(v => v.severity === 'critical').length;
    const majorViolations = violations.filter(v => v.severity === 'major').length;

    // NASA Rule 10: Fixed success criteria
    const MAX_CRITICAL_VIOLATIONS = 0;
    const MAX_MAJOR_VIOLATIONS = 2;

    return criticalViolations <= MAX_CRITICAL_VIOLATIONS &&
           majorViolations <= MAX_MAJOR_VIOLATIONS;
  }

  /**
   * Emergency cleanup on errors
   */
  private async emergencyCleanup(context: StressTestContext): Promise<void> {
    const cleanupTasks = [
      () => this.memoryProfiler.stopProfiling().catch(() => {}),
      () => this.cpuProfiler.stopProfiling().catch(() => {}),
      () => this.loadGenerator.stopLoadGeneration().catch(() => {})
    ];

    // NASA Rule 10: Fixed cleanup bound
    const MAX_CLEANUP_TASKS = 5;

    for (let i = 0; i < Math.min(cleanupTasks.length, MAX_CLEANUP_TASKS); i++) {
      try {
        await cleanupTasks[i]();
      } catch (error) {
        this.emit('cleanup-error', { task: i, error });
      }
    }
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T16:31:29-04:00 | coder@Sonnet | Create phase execution state with NASA Rule 10 compliance | PhaseExecutionState.ts | OK | Fixed bounds for alerts, violations, and metrics collection | 0.00 | ghi789h |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: stress_test_refactor_003
- inputs: ["StressTestTypes.ts", "StressTestStateMachine.ts"]
- tools_used: ["Write"]
- versions: {"model":"Sonnet 4","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->