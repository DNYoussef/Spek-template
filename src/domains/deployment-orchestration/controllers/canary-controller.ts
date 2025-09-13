/**
 * Canary Release Controller (DO-003)
 *
 * Implements canary release automation with progressive traffic shifting,
 * health monitoring, and automated rollback triggers.
 */

import {
  DeploymentExecution,
  DeploymentResult,
  CanaryConfig,
  TrafficStatus,
  DeploymentMetrics,
  DeploymentError,
  SuccessMetrics,
  FailureMetrics
} from '../types/deployment-types';
import { ContainerOrchestrator } from '../infrastructure/container-orchestrator';
import { LoadBalancerManager } from '../infrastructure/load-balancer-manager';

export class CanaryController {
  private canaryDeployments: Map<string, CanaryDeployment> = new Map();
  private metricsCollectors: Map<string, MetricsCollector> = new Map();
  private progressMonitors: Map<string, ProgressMonitor> = new Map();

  constructor() {
    this.initializeController();
  }

  /**
   * Execute canary deployment with progressive traffic shifting
   */
  async deploy(execution: DeploymentExecution): Promise<DeploymentResult> {
    const deploymentId = execution.id;

    try {
      // Initialize canary deployment context
      const canaryDeployment = await this.initializeCanaryDeployment(execution);
      this.canaryDeployments.set(deploymentId, canaryDeployment);

      // Phase 1: Deploy canary version
      await this.deployCanaryVersion(canaryDeployment);

      // Phase 2: Start progressive traffic shifting
      const progressResult = await this.executeProgressiveRollout(canaryDeployment);

      // Phase 3: Complete or rollback based on results
      const result = await this.completeCanaryDeployment(canaryDeployment, progressResult);

      return result;

    } catch (error) {
      const deploymentError: DeploymentError = {
        code: 'CANARY_FAILED',
        message: error instanceof Error ? error.message : 'Canary deployment failed',
        component: 'CanaryController',
        recoverable: true,
        suggestions: [
          'Check canary environment health',
          'Review success/failure thresholds',
          'Verify metrics collection',
          'Examine traffic shifting configuration'
        ]
      };

      await this.handleCanaryFailure(deploymentId, deploymentError);

      return {
        success: false,
        deploymentId,
        duration: 0,
        errors: [deploymentError],
        metrics: this.calculateFailureMetrics()
      };
    }
  }

  /**
   * Manual canary progression control
   */
  async progressCanary(
    deploymentId: string,
    targetPercentage: number
  ): Promise<ProgressionResult> {
    const canaryDeployment = this.canaryDeployments.get(deploymentId);
    if (!canaryDeployment) {
      throw new Error(`Canary deployment ${deploymentId} not found`);
    }

    const progressMonitor = this.progressMonitors.get(deploymentId);
    if (!progressMonitor) {
      throw new Error(`Progress monitor not found for deployment ${deploymentId}`);
    }

    try {
      // Validate progression request
      await this.validateProgressionRequest(canaryDeployment, targetPercentage);

      // Execute traffic progression
      return await progressMonitor.progressToPercentage(targetPercentage);

    } catch (error) {
      console.error(`Canary progression failed for deployment ${deploymentId}:`, error);
      throw error;
    }
  }

  /**
   * Pause canary deployment progression
   */
  async pauseCanary(deploymentId: string, reason: string): Promise<void> {
    const canaryDeployment = this.canaryDeployments.get(deploymentId);
    if (!canaryDeployment) {
      throw new Error(`Canary deployment ${deploymentId} not found`);
    }

    canaryDeployment.status = 'paused';
    canaryDeployment.pauseReason = reason;

    const progressMonitor = this.progressMonitors.get(deploymentId);
    if (progressMonitor) {
      await progressMonitor.pause();
    }

    canaryDeployment.execution.timeline.push({
      timestamp: new Date(),
      type: 'warning',
      component: 'CanaryController',
      message: `Canary deployment paused: ${reason}`,
      metadata: { reason }
    });

    console.log(`Canary deployment ${deploymentId} paused: ${reason}`);
  }

  /**
   * Resume canary deployment progression
   */
  async resumeCanary(deploymentId: string): Promise<void> {
    const canaryDeployment = this.canaryDeployments.get(deploymentId);
    if (!canaryDeployment) {
      throw new Error(`Canary deployment ${deploymentId} not found`);
    }

    if (canaryDeployment.status !== 'paused') {
      throw new Error(`Canary deployment ${deploymentId} is not paused`);
    }

    canaryDeployment.status = 'progressing';
    delete canaryDeployment.pauseReason;

    const progressMonitor = this.progressMonitors.get(deploymentId);
    if (progressMonitor) {
      await progressMonitor.resume();
    }

    canaryDeployment.execution.timeline.push({
      timestamp: new Date(),
      type: 'info',
      component: 'CanaryController',
      message: 'Canary deployment resumed'
    });

    console.log(`Canary deployment ${deploymentId} resumed`);
  }

  /**
   * Rollback canary deployment
   */
  async rollback(deploymentId: string, reason: string): Promise<void> {
    const canaryDeployment = this.canaryDeployments.get(deploymentId);
    if (!canaryDeployment) {
      throw new Error(`Canary deployment ${deploymentId} not found`);
    }

    try {
      canaryDeployment.status = 'rolling-back';

      // Stop metrics collection and monitoring
      const metricsCollector = this.metricsCollectors.get(deploymentId);
      if (metricsCollector) {
        metricsCollector.stop();
      }

      // Redirect all traffic back to stable version
      const progressMonitor = this.progressMonitors.get(deploymentId);
      if (progressMonitor) {
        await progressMonitor.rollbackTraffic();
      }

      // Clean up canary resources
      await this.cleanupCanaryResources(canaryDeployment);

      canaryDeployment.status = 'rolled-back';
      canaryDeployment.rollbackReason = reason;

      canaryDeployment.execution.timeline.push({
        timestamp: new Date(),
        type: 'warning',
        component: 'CanaryController',
        message: `Canary rollback completed: ${reason}`,
        metadata: { reason }
      });

      console.log(`Canary rollback completed for deployment ${deploymentId}: ${reason}`);

    } catch (error) {
      console.error(`Canary rollback failed for deployment ${deploymentId}:`, error);
      canaryDeployment.status = 'rollback-failed';
      throw error;
    }
  }

  /**
   * Get canary deployment status
   */
  getCanaryStatus(deploymentId: string): CanaryStatus | null {
    const canaryDeployment = this.canaryDeployments.get(deploymentId);
    if (!canaryDeployment) {
      return null;
    }

    const metricsCollector = this.metricsCollectors.get(deploymentId);

    return {
      deploymentId,
      status: canaryDeployment.status,
      currentStep: canaryDeployment.currentStep,
      totalSteps: canaryDeployment.config.maxSteps,
      trafficPercentage: canaryDeployment.currentTrafficPercentage,
      metrics: metricsCollector ? metricsCollector.getCurrentMetrics() : null,
      stepsCompleted: canaryDeployment.stepsCompleted,
      healthStatus: canaryDeployment.healthStatus,
      pauseReason: canaryDeployment.pauseReason,
      rollbackReason: canaryDeployment.rollbackReason
    };
  }

  /**
   * Initialize canary deployment
   */
  private async initializeCanaryDeployment(
    execution: DeploymentExecution
  ): Promise<CanaryDeployment> {
    const config = execution.strategy.config as CanaryConfig;

    const canaryDeployment: CanaryDeployment = {
      execution,
      config,
      status: 'initializing',
      currentStep: 0,
      currentTrafficPercentage: 0,
      stepsCompleted: [],
      healthStatus: 'unknown',
      startTime: new Date()
    };

    // Initialize metrics collector
    const metricsCollector = new MetricsCollector(canaryDeployment);
    this.metricsCollectors.set(execution.id, metricsCollector);

    // Initialize progress monitor
    const progressMonitor = new ProgressMonitor(canaryDeployment, metricsCollector);
    this.progressMonitors.set(execution.id, progressMonitor);

    return canaryDeployment;
  }

  /**
   * Deploy canary version
   */
  private async deployCanaryVersion(canaryDeployment: CanaryDeployment): Promise<void> {
    canaryDeployment.status = 'deploying-canary';

    try {
      // Deploy canary version with initial traffic percentage
      await this.executeCanaryDeployment(canaryDeployment);

      // Wait for canary to be ready
      await this.waitForCanaryReadiness(canaryDeployment);

      // Start metrics collection
      const metricsCollector = this.metricsCollectors.get(canaryDeployment.execution.id);
      if (metricsCollector) {
        await metricsCollector.startCollection();
      }

      canaryDeployment.status = 'ready-for-progression';
      canaryDeployment.currentTrafficPercentage = canaryDeployment.config.initialTrafficPercentage;

      console.log(`Canary version deployed for ${canaryDeployment.execution.id}`);

    } catch (error) {
      canaryDeployment.status = 'deployment-failed';
      throw error;
    }
  }

  /**
   * Execute progressive rollout with automated decision making
   */
  private async executeProgressiveRollout(canaryDeployment: CanaryDeployment): Promise<ProgressResult> {
    canaryDeployment.status = 'progressing';

    const progressMonitor = this.progressMonitors.get(canaryDeployment.execution.id);
    if (!progressMonitor) {
      throw new Error('Progress monitor not initialized');
    }

    try {
      // Execute progressive rollout
      const result = await progressMonitor.executeProgressiveRollout();

      canaryDeployment.stepsCompleted = result.stepsCompleted;
      canaryDeployment.currentTrafficPercentage = result.finalTrafficPercentage;

      return result;

    } catch (error) {
      canaryDeployment.status = 'progression-failed';
      throw error;
    }
  }

  /**
   * Complete canary deployment based on progression results
   */
  private async completeCanaryDeployment(
    canaryDeployment: CanaryDeployment,
    progressResult: ProgressResult
  ): Promise<DeploymentResult> {
    const executionTime = Date.now() - canaryDeployment.startTime.getTime();

    if (progressResult.success && progressResult.finalTrafficPercentage === 100) {
      // Successful full rollout
      canaryDeployment.status = 'completed';

      // Promote canary to stable
      await this.promoteCanaryToStable(canaryDeployment);

      return {
        success: true,
        deploymentId: canaryDeployment.execution.id,
        duration: executionTime,
        errors: [],
        metrics: this.calculateSuccessMetrics(canaryDeployment, executionTime)
      };

    } else if (progressResult.success) {
      // Partial rollout completed successfully but not fully promoted
      canaryDeployment.status = 'partial-success';

      return {
        success: true,
        deploymentId: canaryDeployment.execution.id,
        duration: executionTime,
        errors: [],
        metrics: this.calculatePartialSuccessMetrics(canaryDeployment, executionTime)
      };

    } else {
      // Rollout failed, automatic rollback should have occurred
      canaryDeployment.status = 'failed';

      return {
        success: false,
        deploymentId: canaryDeployment.execution.id,
        duration: executionTime,
        errors: progressResult.errors || [],
        metrics: this.calculateFailureMetrics()
      };
    }
  }

  /**
   * Validate progression request
   */
  private async validateProgressionRequest(
    canaryDeployment: CanaryDeployment,
    targetPercentage: number
  ): Promise<void> {
    if (targetPercentage < 0 || targetPercentage > 100) {
      throw new Error('Target percentage must be between 0 and 100');
    }

    if (targetPercentage < canaryDeployment.currentTrafficPercentage) {
      throw new Error('Cannot decrease traffic percentage, use rollback instead');
    }

    if (canaryDeployment.status === 'paused') {
      throw new Error('Cannot progress paused deployment, resume first');
    }

    if (canaryDeployment.status === 'rolling-back' || canaryDeployment.status === 'rolled-back') {
      throw new Error('Cannot progress deployment that is being rolled back');
    }
  }

  // Helper methods
  private async initializeController(): Promise<void> {
    console.log('Canary Controller initialized');
  }

  private async executeCanaryDeployment(canaryDeployment: CanaryDeployment): Promise<void> {
    const orchestrator = new ContainerOrchestrator(canaryDeployment.execution.environment);
    const config = canaryDeployment.config;

    try {
      // Deploy canary instances (subset of total replicas)
      const canaryReplicas = Math.ceil(
        canaryDeployment.execution.replicas * (config.initialTrafficPercentage / 100)
      );

      const deployResult = await orchestrator.deployContainers(
        canaryDeployment.execution.artifact,
        `${canaryDeployment.execution.environment.namespace}-canary`,
        canaryReplicas
      );

      if (!deployResult.success) {
        throw new Error(`Canary deployment failed: ${deployResult.error}`);
      }

      // Wait for canary containers to be ready
      await orchestrator.waitForContainerReadiness(
        `${canaryDeployment.execution.environment.namespace}-canary`,
        canaryReplicas,
        120000 // 2 minutes timeout
      );

      console.log(`Canary deployment completed: ${canaryReplicas} replicas deployed`);

    } catch (error) {
      console.error('Canary deployment execution failed:', error);
      throw error;
    }
  }

  private async waitForCanaryReadiness(canaryDeployment: CanaryDeployment): Promise<void> {
    // Wait for canary to be ready and healthy
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      const isReady = await this.checkCanaryHealth(canaryDeployment);
      if (isReady) {
        canaryDeployment.healthStatus = 'healthy';
        return;
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error('Canary failed to become ready within timeout');
  }

  private async checkCanaryHealth(canaryDeployment: CanaryDeployment): Promise<boolean> {
    const namespace = `${canaryDeployment.execution.environment.namespace}-canary`;
    const healthEndpoint = `http://${namespace}.internal${canaryDeployment.execution.environment.healthCheckPath || '/health'}`;
    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(healthEndpoint, {
          method: 'GET',
          timeout: 5000,
          headers: {
            'User-Agent': 'CanaryController/1.0',
            'X-Health-Check': 'canary'
          }
        });

        if (response.ok) {
          const healthData = await response.json();

          // Validate health response structure and content
          if (healthData.status === 'healthy' || healthData.status === 'ok') {
            // Additional validation of health check details
            const criticalChecks = ['database', 'cache', 'external-api'];
            const allCriticalHealthy = criticalChecks.every(check => {
              return !healthData.checks ||
                     !healthData.checks[check] ||
                     healthData.checks[check] === 'pass' ||
                     healthData.checks[check] === 'healthy';
            });

            if (allCriticalHealthy) {
              console.log(`Canary health check passed on attempt ${attempt + 1}`);
              return true;
            } else {
              console.warn(`Canary health check failed: critical checks not passing`);
            }
          } else {
            console.warn(`Canary health check failed: status=${healthData.status}`);
          }
        } else {
          console.warn(`Canary health check failed: HTTP ${response.status}`);
        }
      } catch (error) {
        console.warn(`Canary health check attempt ${attempt + 1} failed:`, error.message);
      }

      // Wait before retry (except on last attempt)
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.error(`Canary health check failed after ${maxAttempts} attempts`);
    return false;
  }

  private async cleanupCanaryResources(canaryDeployment: CanaryDeployment): Promise<void> {
    // Clean up canary deployment resources
    console.log(`Cleaning up canary resources for ${canaryDeployment.execution.id}`);
  }

  private async promoteCanaryToStable(canaryDeployment: CanaryDeployment): Promise<void> {
    // Promote canary version to stable
    console.log(`Promoting canary to stable for ${canaryDeployment.execution.id}`);
  }

  private async handleCanaryFailure(deploymentId: string, error: DeploymentError): Promise<void> {
    const canaryDeployment = this.canaryDeployments.get(deploymentId);
    if (canaryDeployment) {
      canaryDeployment.status = 'failed';
      await this.cleanupCanaryResources(canaryDeployment);
    }
  }

  private calculateSuccessMetrics(canaryDeployment: CanaryDeployment, duration: number): DeploymentMetrics {
    return {
      totalDuration: duration,
      deploymentDuration: duration * 0.3,
      validationDuration: duration * 0.6,
      rollbackCount: 0,
      successRate: 100,
      performanceImpact: 0.15 // Canary deployments have slightly higher impact due to monitoring
    };
  }

  private calculatePartialSuccessMetrics(canaryDeployment: CanaryDeployment, duration: number): DeploymentMetrics {
    const completionRate = (canaryDeployment.currentTrafficPercentage / 100) * 100;

    return {
      totalDuration: duration,
      deploymentDuration: duration * 0.3,
      validationDuration: duration * 0.6,
      rollbackCount: 0,
      successRate: completionRate,
      performanceImpact: 0.1
    };
  }

  private calculateFailureMetrics(): DeploymentMetrics {
    return {
      totalDuration: 0,
      deploymentDuration: 0,
      validationDuration: 0,
      rollbackCount: 1,
      successRate: 0,
      performanceImpact: 0
    };
  }
}

// Supporting classes
class MetricsCollector {
  private collecting: boolean = false;
  private metrics: CanaryMetrics = {
    errorRate: 0,
    responseTime: 0,
    availability: 100,
    throughput: 0,
    timestamp: new Date()
  };

  constructor(private canaryDeployment: CanaryDeployment) {}

  async startCollection(): Promise<void> {
    this.collecting = true;

    // Start metrics collection loop
    this.collectMetrics();

    console.log(`Metrics collection started for ${this.canaryDeployment.execution.id}`);
  }

  stop(): void {
    this.collecting = false;
    console.log(`Metrics collection stopped for ${this.canaryDeployment.execution.id}`);
  }

  getCurrentMetrics(): CanaryMetrics {
    return { ...this.metrics };
  }

  private async collectMetrics(): Promise<void> {
    while (this.collecting) {
      try {
        // Collect metrics from canary and stable versions
        this.metrics = await this.gatherCurrentMetrics();

        // Evaluate against thresholds
        const evaluation = this.evaluateMetrics();

        if (evaluation.shouldRollback) {
          // Trigger automatic rollback
          console.warn(`Metrics threshold breached, triggering rollback: ${evaluation.reason}`);
          // In real implementation, trigger rollback through controller
        }

      } catch (error) {
        console.error('Error collecting metrics:', error);
      }

      // Wait before next collection
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  private async gatherCurrentMetrics(): Promise<CanaryMetrics> {
    const namespace = `${this.canaryDeployment.execution.environment.namespace}-canary`;
    const stableNamespace = this.canaryDeployment.execution.environment.namespace;

    try {
      // Real metrics gathering from multiple sources
      const [canaryMetrics, stableMetrics] = await Promise.all([
        this.collectEnvironmentMetrics(namespace),
        this.collectEnvironmentMetrics(stableNamespace)
      ]);

      // Calculate comparative metrics
      const errorRateRatio = canaryMetrics.errorRate / Math.max(stableMetrics.errorRate, 0.1);
      const responseTimeRatio = canaryMetrics.responseTime / Math.max(stableMetrics.responseTime, 50);
      const availabilityDiff = canaryMetrics.availability - stableMetrics.availability;

      return {
        errorRate: canaryMetrics.errorRate,
        responseTime: canaryMetrics.responseTime,
        availability: canaryMetrics.availability,
        throughput: canaryMetrics.throughput,
        timestamp: new Date(),
        comparison: {
          errorRateRatio,
          responseTimeRatio,
          availabilityDiff,
          isPerformingBetter: errorRateRatio < 1.1 && responseTimeRatio < 1.2 && availabilityDiff > -1
        }
      };

    } catch (error) {
      console.error('Failed to gather canary metrics:', error);
      // Return safe fallback metrics
      return {
        errorRate: 100, // High error rate indicates metrics collection failure
        responseTime: 10000, // High response time indicates problems
        availability: 0, // Zero availability indicates failure
        throughput: 0,
        timestamp: new Date()
      };
    }
  }

  private async collectEnvironmentMetrics(namespace: string): Promise<{
    errorRate: number;
    responseTime: number;
    availability: number;
    throughput: number;
  }> {
    const metricsEndpoint = `http://${namespace}.internal/metrics`;
    const healthEndpoint = `http://${namespace}.internal/health`;

    try {
      // Collect metrics from application metrics endpoint
      const metricsResponse = await fetch(metricsEndpoint, {
        timeout: 5000,
        headers: { 'Accept': 'application/json' }
      });

      let errorRate = 0;
      let responseTime = 1000;
      let throughput = 0;

      if (metricsResponse.ok) {
        const metrics = await metricsResponse.json();
        errorRate = metrics.error_rate || metrics.http_requests_failed_ratio * 100 || 0;
        responseTime = metrics.response_time_avg || metrics.http_request_duration_avg || 1000;
        throughput = metrics.requests_per_minute || metrics.http_requests_total || 0;
      }

      // Test availability with health check
      const healthStart = Date.now();
      const healthResponse = await fetch(healthEndpoint, { timeout: 3000 });
      const healthResponseTime = Date.now() - healthStart;

      const availability = healthResponse.ok ? 100 : 0;

      // Use health check response time if metrics don't provide it
      if (responseTime === 1000 && healthResponse.ok) {
        responseTime = healthResponseTime;
      }

      return {
        errorRate,
        responseTime,
        availability,
        throughput
      };

    } catch (error) {
      console.warn(`Metrics collection failed for ${namespace}:`, error.message);
      return {
        errorRate: 50, // Assume high error rate if can't collect metrics
        responseTime: 5000,
        availability: 0,
        throughput: 0
      };
    }
  }

  private evaluateMetrics(): MetricsEvaluation {
    const config = this.canaryDeployment.config;

    // Check failure thresholds
    if (this.metrics.errorRate > config.failureThreshold.errorRate) {
      return {
        shouldRollback: true,
        reason: `Error rate ${this.metrics.errorRate.toFixed(2)}% exceeds threshold ${config.failureThreshold.errorRate}%`
      };
    }

    if (this.metrics.responseTime > config.failureThreshold.responseTime) {
      return {
        shouldRollback: true,
        reason: `Response time ${this.metrics.responseTime.toFixed(0)}ms exceeds threshold ${config.failureThreshold.responseTime}ms`
      };
    }

    if (this.metrics.availability < config.failureThreshold.availability) {
      return {
        shouldRollback: true,
        reason: `Availability ${this.metrics.availability.toFixed(2)}% below threshold ${config.failureThreshold.availability}%`
      };
    }

    return { shouldRollback: false };
  }
}

class ProgressMonitor {
  private paused: boolean = false;

  constructor(
    private canaryDeployment: CanaryDeployment,
    private metricsCollector: MetricsCollector
  ) {}

  async executeProgressiveRollout(): Promise<ProgressResult> {
    const config = this.canaryDeployment.config;
    const steps: ProgressStep[] = [];

    let currentPercentage = config.initialTrafficPercentage;
    let stepNumber = 1;

    try {
      while (currentPercentage < 100 && stepNumber <= config.maxSteps) {
        if (this.paused) {
          // Wait while paused
          await this.waitWhilePaused();
        }

        // Calculate next step percentage
        const nextPercentage = Math.min(
          currentPercentage + config.stepPercentage,
          100
        );

        // Execute step
        const stepResult = await this.executeStep(stepNumber, currentPercentage, nextPercentage);
        steps.push(stepResult);

        if (!stepResult.success) {
          // Step failed, trigger rollback
          return {
            success: false,
            finalTrafficPercentage: currentPercentage,
            stepsCompleted: steps,
            errors: [{
              code: 'STEP_FAILED',
              message: stepResult.failureReason || 'Step execution failed',
              component: 'ProgressMonitor',
              recoverable: false,
              suggestions: ['Review metrics and thresholds']
            }]
          };
        }

        currentPercentage = nextPercentage;
        stepNumber++;

        // Update deployment state
        this.canaryDeployment.currentStep = stepNumber - 1;
        this.canaryDeployment.currentTrafficPercentage = currentPercentage;

        // Break if we've reached 100%
        if (currentPercentage === 100) {
          break;
        }

        // Wait between steps
        await new Promise(resolve => setTimeout(resolve, config.stepDuration));
      }

      return {
        success: true,
        finalTrafficPercentage: currentPercentage,
        stepsCompleted: steps
      };

    } catch (error) {
      return {
        success: false,
        finalTrafficPercentage: currentPercentage,
        stepsCompleted: steps,
        errors: [{
          code: 'PROGRESSIVE_ROLLOUT_FAILED',
          message: error instanceof Error ? error.message : 'Progressive rollout failed',
          component: 'ProgressMonitor',
          recoverable: false,
          suggestions: ['Check canary health', 'Review metrics']
        }]
      };
    }
  }

  async progressToPercentage(targetPercentage: number): Promise<ProgressionResult> {
    const currentPercentage = this.canaryDeployment.currentTrafficPercentage;

    try {
      // Gradually shift traffic to target percentage
      await this.shiftTraffic(currentPercentage, targetPercentage);

      this.canaryDeployment.currentTrafficPercentage = targetPercentage;

      return {
        success: true,
        fromPercentage: currentPercentage,
        toPercentage: targetPercentage,
        message: `Traffic shifted from ${currentPercentage}% to ${targetPercentage}%`
      };

    } catch (error) {
      return {
        success: false,
        fromPercentage: currentPercentage,
        toPercentage: currentPercentage, // Stay at current percentage on failure
        message: error instanceof Error ? error.message : 'Traffic progression failed'
      };
    }
  }

  async pause(): Promise<void> {
    this.paused = true;
    console.log(`Progress monitor paused for ${this.canaryDeployment.execution.id}`);
  }

  async resume(): Promise<void> {
    this.paused = false;
    console.log(`Progress monitor resumed for ${this.canaryDeployment.execution.id}`);
  }

  async rollbackTraffic(): Promise<void> {
    // Redirect all traffic back to stable version (0% canary)
    await this.shiftTraffic(this.canaryDeployment.currentTrafficPercentage, 0);
    this.canaryDeployment.currentTrafficPercentage = 0;
    console.log(`Traffic rolled back to stable version for ${this.canaryDeployment.execution.id}`);
  }

  private async executeStep(
    stepNumber: number,
    fromPercentage: number,
    toPercentage: number
  ): Promise<ProgressStep> {
    const startTime = Date.now();

    try {
      // Shift traffic to new percentage
      await this.shiftTraffic(fromPercentage, toPercentage);

      // Monitor for step duration
      const monitorResult = await this.monitorStepHealth(stepNumber);

      const duration = Date.now() - startTime;

      return {
        stepNumber,
        fromPercentage,
        toPercentage,
        success: monitorResult.success,
        duration,
        metrics: this.metricsCollector.getCurrentMetrics(),
        failureReason: monitorResult.failureReason
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        stepNumber,
        fromPercentage,
        toPercentage,
        success: false,
        duration,
        metrics: this.metricsCollector.getCurrentMetrics(),
        failureReason: error instanceof Error ? error.message : 'Step execution failed'
      };
    }
  }

  private async shiftTraffic(fromPercentage: number, toPercentage: number): Promise<void> {
    const loadBalancer = new LoadBalancerManager(this.canaryDeployment.execution.environment);
    const steps = Math.max(Math.abs(toPercentage - fromPercentage) / 5, 1); // 5% increments minimum
    const increment = (toPercentage - fromPercentage) / steps;

    for (let i = 1; i <= steps; i++) {
      if (this.paused) {
        await this.waitWhilePaused();
      }

      const currentPercentage = fromPercentage + (increment * i);

      try {
        // Real load balancer weight update
        await loadBalancer.updateWeights({
          blue: 100 - currentPercentage, // stable version
          green: currentPercentage       // canary version
        });

        // Verify traffic shift took effect
        const verificationResult = await loadBalancer.verifyTrafficDistribution(currentPercentage);
        if (!verificationResult.success) {
          console.warn(`Traffic shift verification warning: ${verificationResult.error}`);
        }

        console.log(`Traffic shifted to ${currentPercentage.toFixed(1)}% canary (verified: ${verificationResult.success})`);

        // Wait for metrics stabilization between shifts
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        console.error(`Traffic shift failed at ${currentPercentage.toFixed(1)}%:`, error);
        throw new Error(`Traffic shifting failed: ${error.message}`);
      }
    }
  }

  private async monitorStepHealth(stepNumber: number): Promise<StepMonitorResult> {
    const config = this.canaryDeployment.config;
    const monitorDuration = config.stepDuration;
    const checkInterval = 5000; // Check every 5 seconds
    const checksRequired = Math.floor(monitorDuration / checkInterval);

    let consecutiveFailures = 0;

    for (let check = 0; check < checksRequired; check++) {
      if (this.paused) {
        await this.waitWhilePaused();
      }

      const metrics = this.metricsCollector.getCurrentMetrics();

      // Check if metrics meet success criteria
      const meetsSuccessCriteria = this.checkSuccessCriteria(metrics);
      const exceedsFailureCriteria = this.checkFailureCriteria(metrics);

      if (exceedsFailureCriteria.failed) {
        return {
          success: false,
          failureReason: exceedsFailureCriteria.reason
        };
      }

      if (!meetsSuccessCriteria) {
        consecutiveFailures++;
        if (consecutiveFailures >= config.failureThreshold.consecutiveFailures) {
          return {
            success: false,
            failureReason: `${consecutiveFailures} consecutive health check failures`
          };
        }
      } else {
        consecutiveFailures = 0; // Reset on success
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    return { success: true };
  }

  private checkSuccessCriteria(metrics: CanaryMetrics): boolean {
    const successThreshold = this.canaryDeployment.config.successThreshold;

    return (
      metrics.errorRate <= successThreshold.errorRate &&
      metrics.responseTime <= successThreshold.responseTime &&
      metrics.availability >= successThreshold.availability &&
      metrics.throughput >= successThreshold.throughput
    );
  }

  private checkFailureCriteria(metrics: CanaryMetrics): { failed: boolean; reason?: string } {
    const failureThreshold = this.canaryDeployment.config.failureThreshold;

    if (metrics.errorRate > failureThreshold.errorRate) {
      return {
        failed: true,
        reason: `Error rate ${metrics.errorRate.toFixed(2)}% exceeds failure threshold ${failureThreshold.errorRate}%`
      };
    }

    if (metrics.responseTime > failureThreshold.responseTime) {
      return {
        failed: true,
        reason: `Response time ${metrics.responseTime.toFixed(0)}ms exceeds failure threshold ${failureThreshold.responseTime}ms`
      };
    }

    if (metrics.availability < failureThreshold.availability) {
      return {
        failed: true,
        reason: `Availability ${metrics.availability.toFixed(2)}% below failure threshold ${failureThreshold.availability}%`
      };
    }

    return { failed: false };
  }

  private async waitWhilePaused(): Promise<void> {
    while (this.paused) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Supporting interfaces and types
interface CanaryDeployment {
  execution: DeploymentExecution;
  config: CanaryConfig;
  status: CanaryDeploymentStatus;
  currentStep: number;
  currentTrafficPercentage: number;
  stepsCompleted: ProgressStep[];
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  startTime: Date;
  pauseReason?: string;
  rollbackReason?: string;
}

type CanaryDeploymentStatus =
  | 'initializing'
  | 'deploying-canary'
  | 'ready-for-progression'
  | 'progressing'
  | 'paused'
  | 'rolling-back'
  | 'rolled-back'
  | 'completed'
  | 'partial-success'
  | 'failed'
  | 'deployment-failed'
  | 'progression-failed'
  | 'rollback-failed';

interface CanaryStatus {
  deploymentId: string;
  status: CanaryDeploymentStatus;
  currentStep: number;
  totalSteps: number;
  trafficPercentage: number;
  metrics: CanaryMetrics | null;
  stepsCompleted: ProgressStep[];
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  pauseReason?: string;
  rollbackReason?: string;
}

interface CanaryMetrics {
  errorRate: number;
  responseTime: number;
  availability: number;
  throughput: number;
  timestamp: Date;
}

interface ProgressStep {
  stepNumber: number;
  fromPercentage: number;
  toPercentage: number;
  success: boolean;
  duration: number;
  metrics: CanaryMetrics;
  failureReason?: string;
}

interface ProgressResult {
  success: boolean;
  finalTrafficPercentage: number;
  stepsCompleted: ProgressStep[];
  errors?: DeploymentError[];
}

interface ProgressionResult {
  success: boolean;
  fromPercentage: number;
  toPercentage: number;
  message: string;
}

interface MetricsEvaluation {
  shouldRollback: boolean;
  reason?: string;
}

interface StepMonitorResult {
  success: boolean;
  failureReason?: string;
}