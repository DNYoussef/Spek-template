import { EventEmitter } from 'events';
import { LoadGenerator, LoadConfig, LoadResult } from './LoadGenerator';
import { MetricsCollector, SystemMetrics } from './MetricsCollector';
import { MemoryProfiler } from './MemoryProfiler';
import { CPUProfiler } from './CPUProfiler';
import * as os from 'os';
import * as process from 'process';

export interface StressTestConfig {
  name: string;
  description?: string;
  phases: StressPhase[];
  maxDuration: number; // milliseconds
  failureThresholds: FailureThresholds;
  monitoring: MonitoringConfig;
  recovery: RecoveryConfig;
  targets: TestTargets;
}

export interface StressPhase {
  name: string;
  duration: number;
  concurrency: number;
  requestsPerSecond: number;
  rampUpTime?: number;
  rampDownTime?: number;
  distributionPattern: 'constant' | 'ramp' | 'spike' | 'burst' | 'wave';
  expectedBehavior?: {
    maxResponseTime?: number;
    minSuccessRate?: number;
    maxMemoryMB?: number;
    maxCPUPercent?: number;
  };
}

export interface FailureThresholds {
  maxResponseTime: number; // milliseconds
  minSuccessRate: number; // percentage (0-1)
  maxMemoryMB: number;
  maxCPUPercent: number;
  maxErrorRate: number; // percentage (0-1)
  systemFailure: {
    maxLoadAverage: number;
    minFreeMemoryMB: number;
    maxDiskUsagePercent: number;
  };
}

export interface MonitoringConfig {
  collectSystemMetrics: boolean;
  collectMemoryProfile: boolean;
  collectCPUProfile: boolean;
  metricsInterval: number; // milliseconds
  alertThresholds: AlertThresholds;
}

export interface AlertThresholds {
  responseTimeWarning: number;
  memoryWarningMB: number;
  cpuWarningPercent: number;
  errorRateWarning: number;
}

export interface RecoveryConfig {
  enableAutoRecovery: boolean;
  maxRecoveryAttempts: number;
  recoveryDelay: number; // milliseconds
  gracefulShutdown: boolean;
  cleanupTimeout: number; // milliseconds
}

export interface TestTargets {
  targetFunction?: string;
  targetModule?: string;
  payload?: any;
  setupFunction?: string;
  teardownFunction?: string;
}

export interface StressTestResult {
  testName: string;
  startTime: number;
  endTime: number;
  totalDuration: number;
  phases: PhaseResult[];
  overallMetrics: OverallMetrics;
  systemHealth: SystemHealthSnapshot[];
  failures: StressFailure[];
  recovery: RecoveryAttempt[];
  success: boolean;
  summary: TestSummary;
}

export interface PhaseResult {
  phaseName: string;
  loadResult: LoadResult;
  systemMetrics: SystemMetrics[];
  memoryProfile?: any;
  cpuProfile?: any;
  alerts: Alert[];
  thresholdViolations: ThresholdViolation[];
  success: boolean;
}

export interface OverallMetrics {
  totalRequests: number;
  totalSuccesses: number;
  totalFailures: number;
  overallSuccessRate: number;
  averageResponseTime: number;
  peakResponseTime: number;
  peakConcurrency: number;
  peakMemoryMB: number;
  peakCPUPercent: number;
  throughputPeakRPS: number;
  systemStability: number; // 0-1 score
}

export interface SystemHealthSnapshot {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    temperature?: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    cached: number;
    swap: number;
  };
  disk: {
    usage: number;
    readIOPS: number;
    writeIOPS: number;
  };
  network: {
    connectionsActive: number;
    throughputMbps: number;
    packetLoss: number;
  };
  process: {
    handles: number;
    threads: number;
    uptime: number;
  };
}

export interface StressFailure {
  timestamp: number;
  type: 'threshold' | 'system' | 'application' | 'timeout';
  phase: string;
  severity: 'warning' | 'error' | 'critical';
  description: string;
  metrics: any;
  recoverable: boolean;
}

export interface RecoveryAttempt {
  timestamp: number;
  reason: string;
  action: string;
  success: boolean;
  duration: number;
  resultingState: any;
}

export interface Alert {
  timestamp: number;
  type: 'performance' | 'resource' | 'error' | 'system';
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metrics: any;
}

export interface ThresholdViolation {
  timestamp: number;
  threshold: string;
  expected: number;
  actual: number;
  severity: 'minor' | 'major' | 'critical';
  duration: number;
}

export interface TestSummary {
  passedPhases: number;
  failedPhases: number;
  totalAlerts: number;
  criticalIssues: number;
  recoveryAttempts: number;
  maxSystemStress: number;
  recommendedActions: string[];
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export class StressTestRunner extends EventEmitter {
  private loadGenerator: LoadGenerator;
  private metricsCollector: MetricsCollector;
  private memoryProfiler: MemoryProfiler;
  private cpuProfiler: CPUProfiler;
  private isRunning = false;
  private currentTest: StressTestConfig | null = null;
  private systemHealthHistory: SystemHealthSnapshot[] = [];
  private alerts: Alert[] = [];
  private failures: StressFailure[] = [];
  private recoveryAttempts: RecoveryAttempt[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.loadGenerator = new LoadGenerator();
    this.metricsCollector = new MetricsCollector();
    this.memoryProfiler = new MemoryProfiler();
    this.cpuProfiler = new CPUProfiler();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.loadGenerator.on('load-start', (config) => {
      this.emit('phase-start', config);
    });

    this.loadGenerator.on('worker-progress', (progress) => {
      this.emit('progress', progress);
    });

    this.loadGenerator.on('load-error', (error) => {
      this.recordFailure('application', 'error', `Load generation error: ${error.message}`, error);
    });

    this.metricsCollector.on('metrics-collected', (metrics) => {
      this.processSystemMetrics(metrics);
    });
  }

  async runStressTest(config: StressTestConfig): Promise<StressTestResult> {
    if (this.isRunning) {
      throw new Error('Stress test already running');
    }

    console.log(`Starting stress test: ${config.name}`);
    this.emit('test-start', config);

    this.isRunning = true;
    this.currentTest = config;
    this.clearState();

    const startTime = Date.now();
    let endTime = startTime;

    try {
      // Setup monitoring
      await this.startMonitoring(config.monitoring);

      // Setup test environment
      if (config.targets.setupFunction && config.targets.targetModule) {
        await this.executeSetup(config.targets);
      }

      // Run test phases
      const phaseResults = await this.runTestPhases(config);

      endTime = Date.now();

      // Teardown test environment
      if (config.targets.teardownFunction && config.targets.targetModule) {
        await this.executeTeardown(config.targets);
      }

      // Generate results
      const result = this.generateTestResult(config, startTime, endTime, phaseResults);

      this.emit('test-complete', result);
      return result;

    } catch (error) {
      endTime = Date.now();
      console.error('Stress test failed:', error);

      this.recordFailure('system', 'critical', `Test execution failed: ${error.message}`, error);

      const result = this.generateFailedTestResult(config, startTime, endTime, error);
      this.emit('test-error', { config, error, result });

      return result;

    } finally {
      await this.cleanup(config.recovery);
      this.isRunning = false;
      this.currentTest = null;
    }
  }

  private async runTestPhases(config: StressTestConfig): Promise<PhaseResult[]> {
    const phaseResults: PhaseResult[] = [];

    for (let i = 0; i < config.phases.length; i++) {
      const phase = config.phases[i];
      console.log(`Running phase ${i + 1}/${config.phases.length}: ${phase.name}`);

      this.emit('phase-start', { phase: phase.name, index: i + 1, total: config.phases.length });

      try {
        const phaseResult = await this.runSinglePhase(phase, config);
        phaseResults.push(phaseResult);

        this.emit('phase-complete', { phase: phase.name, result: phaseResult });

        // Check if we should continue based on failure thresholds
        if (!phaseResult.success && !this.shouldContinueAfterFailure(config, phaseResult)) {
          console.log(`Stopping test after phase ${phase.name} due to critical failure`);
          break;
        }

        // Inter-phase recovery if needed
        if (config.recovery.enableAutoRecovery && phaseResult.thresholdViolations.length > 0) {
          await this.attemptRecovery(config.recovery, `Phase ${phase.name} threshold violations`);
        }

      } catch (error) {
        console.error(`Phase ${phase.name} failed:`, error);

        const failedPhaseResult: PhaseResult = {
          phaseName: phase.name,
          loadResult: this.createEmptyLoadResult(),
          systemMetrics: [],
          alerts: [],
          thresholdViolations: [{
            timestamp: Date.now(),
            threshold: 'phase-execution',
            expected: 1,
            actual: 0,
            severity: 'critical',
            duration: 0
          }],
          success: false
        };

        phaseResults.push(failedPhaseResult);
        this.recordFailure('application', 'critical', `Phase execution failed: ${error.message}`, error);

        if (!config.recovery.enableAutoRecovery) {
          break;
        }
      }
    }

    return phaseResults;
  }

  private async runSinglePhase(phase: StressPhase, config: StressTestConfig): Promise<PhaseResult> {
    const phaseStartTime = Date.now();
    const alerts: Alert[] = [];
    const thresholdViolations: ThresholdViolation[] = [];
    const systemMetricsSnapshot: SystemMetrics[] = [];

    // Start profiling if enabled
    let memoryProfile: any = null;
    let cpuProfile: any = null;

    if (config.monitoring.collectMemoryProfile) {
      await this.memoryProfiler.startProfiling();
    }

    if (config.monitoring.collectCPUProfile) {
      await this.cpuProfiler.startProfiling();
    }

    // Configure load generation for this phase
    const loadConfig: LoadConfig = {
      concurrency: phase.concurrency,
      duration: phase.duration,
      rampUpTime: phase.rampUpTime || 0,
      rampDownTime: phase.rampDownTime || 0,
      requestsPerSecond: phase.requestsPerSecond,
      distributionPattern: phase.distributionPattern,
      targetFunction: config.targets.targetFunction,
      targetModule: config.targets.targetModule,
      payload: config.targets.payload,
      timeout: config.failureThresholds.maxResponseTime
    };

    try {
      // Run the load test
      const loadResult = await this.loadGenerator.generateLoad(loadConfig);

      // Stop profiling
      if (config.monitoring.collectMemoryProfile) {
        memoryProfile = await this.memoryProfiler.stopProfiling();
      }

      if (config.monitoring.collectCPUProfile) {
        cpuProfile = await this.cpuProfiler.stopProfiling();
      }

      // Collect final system metrics for this phase
      const finalMetrics = this.metricsCollector.collectSystemMetrics();
      systemMetricsSnapshot.push(finalMetrics);

      // Analyze phase results against thresholds
      const phaseAlerts = this.analyzePhaseResults(phase, loadResult, config.failureThresholds);
      alerts.push(...phaseAlerts);

      const violations = this.checkThresholdViolations(phase, loadResult, config.failureThresholds);
      thresholdViolations.push(...violations);

      const success = violations.filter(v => v.severity === 'critical').length === 0;

      return {
        phaseName: phase.name,
        loadResult,
        systemMetrics: systemMetricsSnapshot,
        memoryProfile,
        cpuProfile,
        alerts,
        thresholdViolations,
        success
      };

    } catch (error) {
      // Ensure profiling is stopped even if phase fails
      if (config.monitoring.collectMemoryProfile) {
        try { await this.memoryProfiler.stopProfiling(); } catch {}
      }
      if (config.monitoring.collectCPUProfile) {
        try { await this.cpuProfiler.stopProfiling(); } catch {}
      }

      throw error;
    }
  }

  private analyzePhaseResults(
    phase: StressPhase,
    loadResult: LoadResult,
    thresholds: FailureThresholds
  ): Alert[] {
    const alerts: Alert[] = [];

    // Response time analysis
    if (loadResult.averageResponseTime > thresholds.maxResponseTime * 0.8) {
      alerts.push({
        timestamp: Date.now(),
        type: 'performance',
        level: 'warning',
        message: `Average response time approaching threshold: ${loadResult.averageResponseTime}ms`,
        metrics: { responseTime: loadResult.averageResponseTime, threshold: thresholds.maxResponseTime }
      });
    }

    // Success rate analysis
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

    // Memory analysis
    const avgMemoryMB = loadResult.memoryUsage.reduce((sum, m) => sum + m.usage.heapUsed, 0) /
                       loadResult.memoryUsage.length / 1024 / 1024;
    if (avgMemoryMB > thresholds.maxMemoryMB * 0.9) {
      alerts.push({
        timestamp: Date.now(),
        type: 'resource',
        level: 'warning',
        message: `Memory usage high: ${avgMemoryMB.toFixed(2)}MB`,
        metrics: { memoryMB: avgMemoryMB, threshold: thresholds.maxMemoryMB }
      });
    }

    return alerts;
  }

  private checkThresholdViolations(
    phase: StressPhase,
    loadResult: LoadResult,
    thresholds: FailureThresholds
  ): ThresholdViolation[] {
    const violations: ThresholdViolation[] = [];

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

    return violations;
  }

  private async startMonitoring(config: MonitoringConfig): Promise<void> {
    if (config.collectSystemMetrics) {
      this.metricsCollector.startContinuousCollection(config.metricsInterval);
    }

    // Start system health monitoring
    this.monitoringInterval = setInterval(() => {
      const healthSnapshot = this.captureSystemHealth();
      this.systemHealthHistory.push(healthSnapshot);

      // Check for system-level alerts
      this.checkSystemAlerts(healthSnapshot, config.alertThresholds);

    }, config.metricsInterval);
  }

  private captureSystemHealth(): SystemHealthSnapshot {
    const systemMetrics = this.metricsCollector.collectSystemMetrics();

    return {
      timestamp: Date.now(),
      cpu: {
        usage: systemMetrics.cpu.percentage,
        loadAverage: systemMetrics.cpu.loadAvg,
        temperature: undefined // Would need platform-specific implementation
      },
      memory: {
        total: systemMetrics.memory.total,
        free: systemMetrics.memory.free,
        used: systemMetrics.memory.used,
        cached: 0, // Would need platform-specific implementation
        swap: 0    // Would need platform-specific implementation
      },
      disk: {
        usage: 0,     // Would need platform-specific implementation
        readIOPS: 0,  // Would need platform-specific implementation
        writeIOPS: 0  // Would need platform-specific implementation
      },
      network: {
        connectionsActive: 0, // Would need platform-specific implementation
        throughputMbps: 0,    // Would need platform-specific implementation
        packetLoss: 0         // Would need platform-specific implementation
      },
      process: {
        handles: 0,                    // Would need platform-specific implementation
        threads: 0,                    // Would need platform-specific implementation
        uptime: systemMetrics.process.uptime
      }
    };
  }

  private checkSystemAlerts(health: SystemHealthSnapshot, thresholds: AlertThresholds): void {
    // CPU warning
    if (health.cpu.usage > thresholds.cpuWarningPercent) {
      this.alerts.push({
        timestamp: Date.now(),
        type: 'system',
        level: 'warning',
        message: `High CPU usage: ${health.cpu.usage.toFixed(2)}%`,
        metrics: health.cpu
      });
    }

    // Memory warning
    const memoryUsedMB = health.memory.used / 1024 / 1024;
    if (memoryUsedMB > thresholds.memoryWarningMB) {
      this.alerts.push({
        timestamp: Date.now(),
        type: 'resource',
        level: 'warning',
        message: `High memory usage: ${memoryUsedMB.toFixed(2)}MB`,
        metrics: health.memory
      });
    }
  }

  private processSystemMetrics(metrics: any): void {
    // Process collected metrics and check for issues
    this.emit('metrics-update', metrics);
  }

  private shouldContinueAfterFailure(config: StressTestConfig, phaseResult: PhaseResult): boolean {
    const criticalViolations = phaseResult.thresholdViolations.filter(v => v.severity === 'critical');
    return criticalViolations.length === 0 || config.recovery.enableAutoRecovery;
  }

  private async attemptRecovery(config: RecoveryConfig, reason: string): Promise<void> {
    if (this.recoveryAttempts.length >= config.maxRecoveryAttempts) {
      console.log('Maximum recovery attempts reached');
      return;
    }

    console.log(`Attempting recovery: ${reason}`);
    const startTime = Date.now();

    try {
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }

      // Wait for recovery delay
      await this.sleep(config.recoveryDelay);

      const endTime = Date.now();
      const duration = endTime - startTime;

      this.recoveryAttempts.push({
        timestamp: startTime,
        reason,
        action: 'garbage-collection-and-delay',
        success: true,
        duration,
        resultingState: this.metricsCollector.collectSystemMetrics()
      });

      console.log(`Recovery successful in ${duration}ms`);

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      this.recoveryAttempts.push({
        timestamp: startTime,
        reason,
        action: 'attempted-gc-and-delay',
        success: false,
        duration,
        resultingState: { error: error.message }
      });

      console.error('Recovery failed:', error);
    }
  }

  private async executeSetup(targets: TestTargets): Promise<void> {
    if (!targets.setupFunction || !targets.targetModule) return;

    try {
      const module = require(targets.targetModule);
      const setupFn = module[targets.setupFunction];

      if (typeof setupFn === 'function') {
        await setupFn();
        console.log('Test setup completed');
      }
    } catch (error) {
      console.error('Test setup failed:', error);
      throw error;
    }
  }

  private async executeTeardown(targets: TestTargets): Promise<void> {
    if (!targets.teardownFunction || !targets.targetModule) return;

    try {
      const module = require(targets.targetModule);
      const teardownFn = module[targets.teardownFunction];

      if (typeof teardownFn === 'function') {
        await teardownFn();
        console.log('Test teardown completed');
      }
    } catch (error) {
      console.warn('Test teardown failed:', error);
    }
  }

  private generateTestResult(
    config: StressTestConfig,
    startTime: number,
    endTime: number,
    phaseResults: PhaseResult[]
  ): StressTestResult {
    const overallMetrics = this.calculateOverallMetrics(phaseResults);
    const summary = this.generateTestSummary(phaseResults, this.alerts, this.failures);

    return {
      testName: config.name,
      startTime,
      endTime,
      totalDuration: endTime - startTime,
      phases: phaseResults,
      overallMetrics,
      systemHealth: this.systemHealthHistory,
      failures: this.failures,
      recovery: this.recoveryAttempts,
      success: phaseResults.every(p => p.success) && this.failures.filter(f => f.severity === 'critical').length === 0,
      summary
    };
  }

  private generateFailedTestResult(
    config: StressTestConfig,
    startTime: number,
    endTime: number,
    error: any
  ): StressTestResult {
    return {
      testName: config.name,
      startTime,
      endTime,
      totalDuration: endTime - startTime,
      phases: [],
      overallMetrics: this.createEmptyOverallMetrics(),
      systemHealth: this.systemHealthHistory,
      failures: this.failures,
      recovery: this.recoveryAttempts,
      success: false,
      summary: {
        passedPhases: 0,
        failedPhases: 1,
        totalAlerts: this.alerts.length,
        criticalIssues: this.failures.filter(f => f.severity === 'critical').length,
        recoveryAttempts: this.recoveryAttempts.length,
        maxSystemStress: 0,
        recommendedActions: ['Fix test configuration', 'Check system resources'],
        performanceGrade: 'F'
      }
    };
  }

  private calculateOverallMetrics(phaseResults: PhaseResult[]): OverallMetrics {
    let totalRequests = 0;
    let totalSuccesses = 0;
    let totalFailures = 0;
    let maxResponseTime = 0;
    let avgResponseTimes: number[] = [];
    let maxConcurrency = 0;
    let maxMemoryMB = 0;
    let maxCPUPercent = 0;
    let maxThroughput = 0;

    phaseResults.forEach(phase => {
      const result = phase.loadResult;
      totalRequests += result.totalRequests;
      totalSuccesses += result.successfulRequests;
      totalFailures += result.failedRequests;
      maxResponseTime = Math.max(maxResponseTime, result.maxResponseTime);
      avgResponseTimes.push(result.averageResponseTime);
      maxConcurrency = Math.max(maxConcurrency, result.concurrency);
      maxThroughput = Math.max(maxThroughput, result.requestsPerSecond);

      // Memory and CPU peaks
      if (result.memoryUsage.length > 0) {
        const memPeak = Math.max(...result.memoryUsage.map(m => m.usage.heapUsed)) / 1024 / 1024;
        maxMemoryMB = Math.max(maxMemoryMB, memPeak);
      }

      if (result.cpuUsage.length > 0) {
        const cpuPeak = Math.max(...result.cpuUsage.map(c => (c.usage.user + c.usage.system) / 1000));
        maxCPUPercent = Math.max(maxCPUPercent, cpuPeak);
      }
    });

    const overallSuccessRate = totalRequests > 0 ? totalSuccesses / totalRequests : 0;
    const avgResponseTime = avgResponseTimes.length > 0 ?
      avgResponseTimes.reduce((sum, avg) => sum + avg, 0) / avgResponseTimes.length : 0;

    return {
      totalRequests,
      totalSuccesses,
      totalFailures,
      overallSuccessRate,
      averageResponseTime: avgResponseTime,
      peakResponseTime: maxResponseTime,
      peakConcurrency: maxConcurrency,
      peakMemoryMB: maxMemoryMB,
      peakCPUPercent: maxCPUPercent,
      throughputPeakRPS: maxThroughput,
      systemStability: this.calculateSystemStability(phaseResults)
    };
  }

  private calculateSystemStability(phaseResults: PhaseResult[]): number {
    // Simple stability calculation based on success rates and threshold violations
    if (phaseResults.length === 0) return 0;

    let stabilitySum = 0;
    phaseResults.forEach(phase => {
      const successRate = phase.loadResult.successfulRequests / phase.loadResult.totalRequests;
      const violationPenalty = phase.thresholdViolations.length * 0.1;
      const phaseStability = Math.max(0, successRate - violationPenalty);
      stabilitySum += phaseStability;
    });

    return stabilitySum / phaseResults.length;
  }

  private generateTestSummary(
    phaseResults: PhaseResult[],
    alerts: Alert[],
    failures: StressFailure[]
  ): TestSummary {
    const passedPhases = phaseResults.filter(p => p.success).length;
    const failedPhases = phaseResults.length - passedPhases;
    const criticalIssues = failures.filter(f => f.severity === 'critical').length;

    // Performance grading
    let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    const successRate = phaseResults.length > 0 ? passedPhases / phaseResults.length : 0;

    if (successRate >= 0.95 && criticalIssues === 0) grade = 'A';
    else if (successRate >= 0.85 && criticalIssues <= 1) grade = 'B';
    else if (successRate >= 0.70 && criticalIssues <= 2) grade = 'C';
    else if (successRate >= 0.50) grade = 'D';

    const recommendedActions: string[] = [];
    if (failedPhases > 0) recommendedActions.push('Review failed phases and optimize performance');
    if (criticalIssues > 0) recommendedActions.push('Address critical system issues');
    if (alerts.length > 10) recommendedActions.push('Investigate frequent alerts');

    return {
      passedPhases,
      failedPhases,
      totalAlerts: alerts.length,
      criticalIssues,
      recoveryAttempts: this.recoveryAttempts.length,
      maxSystemStress: this.calculateMaxSystemStress(),
      recommendedActions,
      performanceGrade: grade
    };
  }

  private calculateMaxSystemStress(): number {
    if (this.systemHealthHistory.length === 0) return 0;

    let maxStress = 0;
    this.systemHealthHistory.forEach(health => {
      const cpuStress = health.cpu.usage / 100;
      const memoryStress = health.memory.used / health.memory.total;
      const overallStress = (cpuStress + memoryStress) / 2;
      maxStress = Math.max(maxStress, overallStress);
    });

    return maxStress;
  }

  private recordFailure(
    type: 'threshold' | 'system' | 'application' | 'timeout',
    severity: 'warning' | 'error' | 'critical',
    description: string,
    metrics?: any
  ): void {
    this.failures.push({
      timestamp: Date.now(),
      type,
      phase: this.currentTest?.phases[0]?.name || 'unknown',
      severity,
      description,
      metrics,
      recoverable: severity !== 'critical'
    });

    this.emit('failure', this.failures[this.failures.length - 1]);
  }

  private createEmptyLoadResult(): LoadResult {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      requestsPerSecond: 0,
      errors: [],
      throughput: 0,
      concurrency: 0,
      duration: 0,
      timestamps: [],
      responseTimes: [],
      memoryUsage: [],
      cpuUsage: []
    };
  }

  private createEmptyOverallMetrics(): OverallMetrics {
    return {
      totalRequests: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      overallSuccessRate: 0,
      averageResponseTime: 0,
      peakResponseTime: 0,
      peakConcurrency: 0,
      peakMemoryMB: 0,
      peakCPUPercent: 0,
      throughputPeakRPS: 0,
      systemStability: 0
    };
  }

  private clearState(): void {
    this.systemHealthHistory = [];
    this.alerts = [];
    this.failures = [];
    this.recoveryAttempts = [];
  }

  private async cleanup(config: RecoveryConfig): Promise<void> {
    console.log('Cleaning up stress test...');

    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.metricsCollector.stopContinuousCollection();

    // Stop load generation
    if (this.loadGenerator.isGeneratingLoad()) {
      await this.loadGenerator.stopLoadGeneration();
    }

    // Stop profiling
    try {
      await this.memoryProfiler.stopProfiling();
      await this.cpuProfiler.stopProfiling();
    } catch (error) {
      console.warn('Error stopping profilers:', error);
    }

    // Graceful shutdown delay
    if (config.gracefulShutdown) {
      await this.sleep(1000);
    }

    console.log('Stress test cleanup completed');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isRunning(): boolean {
    return this.isRunning;
  }

  async stopStressTest(): Promise<void> {
    if (!this.isRunning) {
      console.log('No stress test running');
      return;
    }

    console.log('Stopping stress test...');
    this.isRunning = false;

    await this.loadGenerator.stopLoadGeneration();

    if (this.currentTest?.recovery) {
      await this.cleanup(this.currentTest.recovery);
    }
  }

  getSystemHealth(): SystemHealthSnapshot[] {
    return [...this.systemHealthHistory];
  }

  getCurrentAlerts(): Alert[] {
    return [...this.alerts];
  }

  getFailures(): StressFailure[] {
    return [...this.failures];
  }

  getRecoveryAttempts(): RecoveryAttempt[] {
    return [...this.recoveryAttempts];
  }
}

export default StressTestRunner;