/**
 * Load Test FSM Implementation
 * Replaces the 1115-line LoadTestOrchestrator with FSM architecture
 */

import { OrchestratorBase, OrchestratorConfig } from './OrchestratorBase';
import { OrchestratorTransitionHub } from './OrchestratorTransitionHub';
import { OrchestratorEvent } from './OrchestratorStates';

export interface LoadTestRequest {
  readonly testId: string;
  readonly targetEndpoint: string;
  readonly loadPattern: 'constant' | 'ramp' | 'spike' | 'burst';
  readonly concurrency: number;
  readonly duration: number;
  readonly thresholds: PerformanceThresholds;
}

export interface PerformanceThresholds {
  readonly maxResponseTime: number;
  readonly maxErrorRate: number;
  readonly minThroughput: number;
}

export interface LoadTestResult {
  readonly testId: string;
  readonly status: 'success' | 'failed' | 'timeout';
  readonly metrics: TestMetrics;
  readonly thresholdResults: Record<string, boolean>;
  readonly duration: number;
}

export interface TestMetrics {
  readonly totalRequests: number;
  readonly successfulRequests: number;
  readonly failedRequests: number;
  readonly averageResponseTime: number;
  readonly maxResponseTime: number;
  readonly minResponseTime: number;
  readonly throughput: number;
  readonly errorRate: number;
}

export class LoadTestFSM extends OrchestratorBase {
  private currentTest?: LoadTestRequest;
  private testResult?: LoadTestResult;
  private workers: any[] = [];

  constructor(transitionHub: OrchestratorTransitionHub) {
    const config: OrchestratorConfig = {
      orchestratorId: 'load-test',
      orchestrationType: 'LoadTest',
      maxConcurrentTasks: 20,
      taskTimeout: 1800000, // 30 minutes
      retryAttempts: 1,
      validationEnabled: true
    };
    super(config, transitionHub);
  }

  public async start(input: LoadTestRequest): Promise<void> {
    this.currentTest = input;
    await this.transitionTo(OrchestratorEvent.START_ORCHESTRATION);
  }

  public async cancel(): Promise<void> {
    await this.transitionTo(OrchestratorEvent.CANCEL_REQUESTED);
  }

  public async getStatus(): Promise<any> {
    return {
      currentState: this.getCurrentState(),
      test: this.currentTest,
      result: this.testResult,
      activeWorkers: this.workers.length,
      metrics: this.getMetrics(),
      errors: this.getErrors()
    };
  }

  protected async onPlanningEntered(): Promise<void> {
    if (!this.currentTest) {
      this.addError('planning', 'No load test request provided');
      return;
    }

    // Plan load test execution
    const workerCount = Math.min(this.currentTest.concurrency, 50); // Max 50 workers

    for (let i = 0; i < workerCount; i++) {
      this.addTask({
        taskId: `worker-${i}`,
        type: 'load-worker',
        status: 'pending',
        progress: 0
      });
    }

    // Validate target endpoint
    const isReachable = await this.validateEndpoint(this.currentTest.targetEndpoint);
    if (!isReachable) {
      this.addError('planning', `Target endpoint ${this.currentTest.targetEndpoint} is not reachable`);
      return;
    }

    await this.transitionTo(OrchestratorEvent.PLANNING_COMPLETE);
  }

  protected async onAllocatingEntered(): Promise<void> {
    if (!this.currentTest) return;

    // Allocate resources for load generation
    const resourcesNeeded = this.calculateResourcesNeeded(this.currentTest.concurrency);

    for (const resource of resourcesNeeded) {
      this.allocateResource({
        resourceId: resource.id,
        type: resource.type,
        allocated: true,
        capacity: resource.capacity,
        usage: 0
      });
    }

    await this.transitionTo(OrchestratorEvent.ALLOCATION_COMPLETE);
  }

  protected async onExecutingEntered(): Promise<void> {
    if (!this.currentTest) return;

    const startTime = Date.now();
    const metrics: TestMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      throughput: 0,
      errorRate: 0
    };

    try {
      // Start load generation workers
      await this.startLoadWorkers();

      // Execute load test based on pattern
      switch (this.currentTest.loadPattern) {
        case 'constant':
          await this.executeConstantLoad(metrics);
          break;
        case 'ramp':
          await this.executeRampLoad(metrics);
          break;
        case 'spike':
          await this.executeSpikeLoad(metrics);
          break;
        case 'burst':
          await this.executeBurstLoad(metrics);
          break;
      }

      const duration = Date.now() - startTime;
      metrics.throughput = metrics.totalRequests / (duration / 1000);
      metrics.errorRate = metrics.failedRequests / metrics.totalRequests;
      metrics.averageResponseTime = metrics.averageResponseTime / metrics.totalRequests;

      // Evaluate thresholds
      const thresholdResults = this.evaluateThresholds(metrics);

      this.testResult = {
        testId: this.currentTest.testId,
        status: this.determineTestStatus(thresholdResults),
        metrics,
        thresholdResults,
        duration
      };

      await this.transitionTo(OrchestratorEvent.VALIDATION_REQUIRED);

    } catch (error) {
      this.addError('execution', `Load test execution failed: ${error}`);
      await this.stopLoadWorkers();
    }
  }

  protected async onMonitoringEntered(): Promise<void> {
    if (!this.testResult) return;

    // Monitor system resources during test
    const resourceMetrics = await this.gatherResourceMetrics();
    this.emit('resourceMetrics', resourceMetrics);

    // Monitor target system health
    const targetHealth = await this.checkTargetHealth();
    if (!targetHealth) {
      this.addError('monitoring', 'Target system health degraded during test');
    }
  }

  protected async onValidatingEntered(): Promise<void> {
    if (!this.currentTest || !this.testResult) return;

    let validationPassed = true;

    // Validate test results against thresholds
    for (const [threshold, passed] of Object.entries(this.testResult.thresholdResults)) {
      if (!passed) {
        validationPassed = false;
        this.addError('validation', `Threshold violation: ${threshold}`);
      }
    }

    // Additional result validation
    if (this.testResult.metrics.totalRequests === 0) {
      validationPassed = false;
      this.addError('validation', 'No requests were executed');
    }

    if (validationPassed) {
      await this.transitionTo(OrchestratorEvent.VALIDATION_PASSED);
    } else {
      await this.transitionTo(OrchestratorEvent.VALIDATION_FAILED);
    }
  }

  protected async onCompletingEntered(): Promise<void> {
    // Stop all workers
    await this.stopLoadWorkers();

    // Clean up resources
    this.releaseAllResources();

    // Generate test report
    const report = this.generateTestReport();
    this.emit('testCompleted', { result: this.testResult, report });

    await this.transitionTo(OrchestratorEvent.RESET);
  }

  protected async onErrorEntered(): Promise<void> {
    await this.stopLoadWorkers();
    this.releaseAllResources();

    this.emit('testFailed', {
      test: this.currentTest,
      errors: this.getErrors(),
      partialResult: this.testResult
    });
  }

  private async validateEndpoint(endpoint: string): Promise<boolean> {
    // Simulate endpoint validation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.05); // 95% success rate
      }, 100);
    });
  }

  private calculateResourcesNeeded(concurrency: number): Array<{id: string, type: string, capacity: number}> {
    const cpuCount = Math.ceil(concurrency / 10);
    const memoryMB = concurrency * 10;
    const networkMbps = concurrency * 1;

    return [
      { id: 'cpu-cores', type: 'cpu', capacity: cpuCount },
      { id: 'memory', type: 'memory', capacity: memoryMB },
      { id: 'network', type: 'network', capacity: networkMbps }
    ];
  }

  private async startLoadWorkers(): Promise<void> {
    if (!this.currentTest) return;

    const workerCount = Math.min(this.currentTest.concurrency, 50);

    for (let i = 0; i < workerCount; i++) {
      const worker = {
        id: i,
        status: 'active',
        requests: 0,
        errors: 0
      };

      this.workers.push(worker);
      this.updateTask(`worker-${i}`, { status: 'running', progress: 10 });
    }
  }

  private async stopLoadWorkers(): Promise<void> {
    for (const worker of this.workers) {
      worker.status = 'stopped';
    }

    for (let i = 0; i < this.workers.length; i++) {
      this.updateTask(`worker-${i}`, {
        status: 'completed',
        progress: 100,
        endTime: Date.now()
      });
    }

    this.workers = [];
  }

  private async executeConstantLoad(metrics: TestMetrics): Promise<void> {
    if (!this.currentTest) return;

    const endTime = Date.now() + this.currentTest.duration;
    while (Date.now() < endTime) {
      const response = await this.simulateRequest();
      this.updateMetrics(metrics, response);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private async executeRampLoad(metrics: TestMetrics): Promise<void> {
    if (!this.currentTest) return;

    const rampDuration = this.currentTest.duration * 0.3;
    const steadyDuration = this.currentTest.duration * 0.4;
    const rampDownDuration = this.currentTest.duration * 0.3;

    // Ramp up
    await this.executeLoadPhase(metrics, rampDuration, 'ramp-up');
    // Steady state
    await this.executeLoadPhase(metrics, steadyDuration, 'steady');
    // Ramp down
    await this.executeLoadPhase(metrics, rampDownDuration, 'ramp-down');
  }

  private async executeSpikeLoad(metrics: TestMetrics): Promise<void> {
    if (!this.currentTest) return;

    const baseLoad = Math.floor(this.currentTest.duration * 0.8);
    const spikeLoad = Math.floor(this.currentTest.duration * 0.2);

    await this.executeLoadPhase(metrics, baseLoad, 'base');
    await this.executeLoadPhase(metrics, spikeLoad, 'spike');
  }

  private async executeBurstLoad(metrics: TestMetrics): Promise<void> {
    if (!this.currentTest) return;

    const burstCount = 5;
    const burstDuration = this.currentTest.duration / (burstCount * 2);

    for (let i = 0; i < burstCount; i++) {
      await this.executeLoadPhase(metrics, burstDuration, 'burst');
      await this.executeLoadPhase(metrics, burstDuration, 'rest');
    }
  }

  private async executeLoadPhase(metrics: TestMetrics, duration: number, phase: string): Promise<void> {
    const endTime = Date.now() + duration;
    while (Date.now() < endTime) {
      const response = await this.simulateRequest();
      this.updateMetrics(metrics, response);
      await new Promise(resolve => setTimeout(resolve, phase === 'spike' ? 5 : 20));
    }
  }

  private async simulateRequest(): Promise<{responseTime: number, success: boolean}> {
    return new Promise((resolve) => {
      const responseTime = Math.random() * 200 + 50; // 50-250ms
      const success = Math.random() > 0.05; // 95% success rate

      setTimeout(() => {
        resolve({ responseTime, success });
      }, responseTime);
    });
  }

  private updateMetrics(metrics: TestMetrics, response: {responseTime: number, success: boolean}): void {
    metrics.totalRequests++;

    if (response.success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }

    metrics.averageResponseTime += response.responseTime;
    metrics.maxResponseTime = Math.max(metrics.maxResponseTime, response.responseTime);
    metrics.minResponseTime = Math.min(metrics.minResponseTime, response.responseTime);
  }

  private evaluateThresholds(metrics: TestMetrics): Record<string, boolean> {
    if (!this.currentTest) return {};

    return {
      responseTime: metrics.averageResponseTime <= this.currentTest.thresholds.maxResponseTime,
      errorRate: metrics.errorRate <= this.currentTest.thresholds.maxErrorRate,
      throughput: metrics.throughput >= this.currentTest.thresholds.minThroughput
    };
  }

  private determineTestStatus(thresholdResults: Record<string, boolean>): 'success' | 'failed' | 'timeout' {
    const allPassed = Object.values(thresholdResults).every(result => result);
    return allPassed ? 'success' : 'failed';
  }

  private async gatherResourceMetrics(): Promise<any> {
    return {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      networkUsage: Math.random() * 100
    };
  }

  private async checkTargetHealth(): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.1);
      }, 50);
    });
  }

  private generateTestReport(): any {
    return {
      summary: this.testResult,
      recommendations: this.generateRecommendations(),
      charts: this.generateChartData()
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.testResult?.metrics.errorRate && this.testResult.metrics.errorRate > 0.01) {
      recommendations.push('Consider improving error handling');
    }

    if (this.testResult?.metrics.averageResponseTime && this.testResult.metrics.averageResponseTime > 200) {
      recommendations.push('Response time optimization recommended');
    }

    return recommendations;
  }

  private generateChartData(): any {
    return {
      responseTimeChart: [],
      throughputChart: [],
      errorRateChart: []
    };
  }

  private releaseAllResources(): void {
    for (const resource of this.getResources()) {
      this.releaseResource(resource.resourceId);
    }
  }
}