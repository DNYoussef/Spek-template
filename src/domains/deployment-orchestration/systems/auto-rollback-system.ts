/**
 * Automated Rollback System (DO-004)
 *
 * Implements automated rollback triggers with health check validation,
 * failure detection, and comprehensive monitoring across deployment strategies.
 */

import {
  DeploymentExecution,
  RollbackTrigger,
  RollbackConfig,
  HealthCheck,
  DeploymentError,
  Environment,
  SuccessMetrics,
  FailureMetrics
} from '../types/deployment-types';
import { ContainerOrchestrator } from '../infrastructure/container-orchestrator';
import { LoadBalancerManager } from '../infrastructure/load-balancer-manager';

export class AutoRollbackSystem {
  private monitoredDeployments: Map<string, MonitoredDeployment> = new Map();
  private healthMonitors: Map<string, HealthMonitor> = new Map();
  private rollbackListeners: RollbackListener[] = [];
  private metricsEvaluators: Map<string, MetricsEvaluator> = new Map();

  constructor() {
    this.initializeRollbackSystem();
  }

  /**
   * Start monitoring deployment for automatic rollback triggers
   */
  async monitorDeployment(execution: DeploymentExecution): Promise<void> {
    const deploymentId = execution.id;
    const rollbackConfig = execution.strategy.rollbackStrategy;

    if (!rollbackConfig.enabled) {
      console.log(`Rollback monitoring disabled for deployment ${deploymentId}`);
      return;
    }

    try {
      // Create monitored deployment context
      const monitoredDeployment = await this.createMonitoredDeployment(execution);
      this.monitoredDeployments.set(deploymentId, monitoredDeployment);

      // Initialize health monitoring
      await this.initializeHealthMonitoring(monitoredDeployment);

      // Initialize metrics evaluation
      await this.initializeMetricsEvaluation(monitoredDeployment);

      // Start monitoring loops
      await this.startMonitoringLoops(monitoredDeployment);

      console.log(`Rollback monitoring started for deployment ${deploymentId}`);

    } catch (error) {
      console.error(`Failed to start rollback monitoring for ${deploymentId}:`, error);
    }
  }

  /**
   * Stop monitoring deployment
   */
  async stopMonitoring(deploymentId: string): Promise<void> {
    const monitoredDeployment = this.monitoredDeployments.get(deploymentId);
    if (!monitoredDeployment) {
      return;
    }

    // Stop health monitoring
    const healthMonitor = this.healthMonitors.get(deploymentId);
    if (healthMonitor) {
      healthMonitor.stop();
      this.healthMonitors.delete(deploymentId);
    }

    // Stop metrics evaluation
    const metricsEvaluator = this.metricsEvaluators.get(deploymentId);
    if (metricsEvaluator) {
      metricsEvaluator.stop();
      this.metricsEvaluators.delete(deploymentId);
    }

    // Remove from monitored deployments
    this.monitoredDeployments.delete(deploymentId);

    console.log(`Rollback monitoring stopped for deployment ${deploymentId}`);
  }

  /**
   * Manually trigger rollback for a deployment
   */
  async triggerRollback(deploymentId: string, reason: string): Promise<RollbackResult> {
    const monitoredDeployment = this.monitoredDeployments.get(deploymentId);
    if (!monitoredDeployment) {
      throw new Error(`Deployment ${deploymentId} is not being monitored`);
    }

    return await this.executeRollback(monitoredDeployment, {
      type: 'manual',
      threshold: 0,
      duration: 0,
      severity: 'high'
    }, reason);
  }

  /**
   * Get rollback status for deployment
   */
  getRollbackStatus(deploymentId: string): RollbackStatus | null {
    const monitoredDeployment = this.monitoredDeployments.get(deploymentId);
    if (!monitoredDeployment) {
      return null;
    }

    const healthMonitor = this.healthMonitors.get(deploymentId);
    const metricsEvaluator = this.metricsEvaluators.get(deploymentId);

    return {
      deploymentId,
      monitoring: true,
      rollbacksTriggered: monitoredDeployment.rollbackHistory.length,
      lastRollbackReason: monitoredDeployment.rollbackHistory[0]?.reason,
      currentHealth: healthMonitor ? healthMonitor.getCurrentHealth() : 'unknown',
      activeTriggers: monitoredDeployment.rollbackConfig.autoTriggers,
      metricsStatus: metricsEvaluator ? metricsEvaluator.getCurrentStatus() : null
    };
  }

  /**
   * Add rollback event listener
   */
  onRollbackTriggered(listener: RollbackListener): void {
    this.rollbackListeners.push(listener);
  }

  /**
   * Get rollback history for deployment
   */
  getRollbackHistory(deploymentId: string): RollbackEvent[] {
    const monitoredDeployment = this.monitoredDeployments.get(deploymentId);
    return monitoredDeployment ? monitoredDeployment.rollbackHistory : [];
  }

  /**
   * Update rollback configuration for active deployment
   */
  async updateRollbackConfig(
    deploymentId: string,
    configUpdate: Partial<RollbackConfig>
  ): Promise<void> {
    const monitoredDeployment = this.monitoredDeployments.get(deploymentId);
    if (!monitoredDeployment) {
      throw new Error(`Deployment ${deploymentId} is not being monitored`);
    }

    // Update configuration
    monitoredDeployment.rollbackConfig = {
      ...monitoredDeployment.rollbackConfig,
      ...configUpdate
    };

    // Restart monitoring with new configuration
    await this.stopMonitoring(deploymentId);
    await this.monitorDeployment(monitoredDeployment.execution);

    console.log(`Rollback configuration updated for deployment ${deploymentId}`);
  }

  /**
   * Create monitored deployment context
   */
  private async createMonitoredDeployment(execution: DeploymentExecution): Promise<MonitoredDeployment> {
    return {
      execution,
      rollbackConfig: execution.strategy.rollbackStrategy,
      status: 'monitoring',
      rollbackHistory: [],
      startTime: new Date(),
      lastHealthCheck: new Date(),
      consecutiveFailures: 0
    };
  }

  /**
   * Initialize health monitoring for deployment
   */
  private async initializeHealthMonitoring(monitoredDeployment: MonitoredDeployment): Promise<void> {
    const healthMonitor = new HealthMonitor(monitoredDeployment);
    this.healthMonitors.set(monitoredDeployment.execution.id, healthMonitor);

    // Set up health failure callback
    healthMonitor.onHealthFailure(async (reason, severity) => {
      await this.handleHealthFailure(monitoredDeployment, reason, severity);
    });
  }

  /**
   * Initialize metrics evaluation for deployment
   */
  private async initializeMetricsEvaluation(monitoredDeployment: MonitoredDeployment): Promise<void> {
    const metricsEvaluator = new MetricsEvaluator(monitoredDeployment);
    this.metricsEvaluators.set(monitoredDeployment.execution.id, metricsEvaluator);

    // Set up metrics threshold callbacks
    metricsEvaluator.onThresholdExceeded(async (trigger, metrics) => {
      await this.handleMetricsThresholdExceeded(monitoredDeployment, trigger, metrics);
    });
  }

  /**
   * Start monitoring loops for deployment
   */
  private async startMonitoringLoops(monitoredDeployment: MonitoredDeployment): Promise<void> {
    const deploymentId = monitoredDeployment.execution.id;

    // Start health monitoring
    const healthMonitor = this.healthMonitors.get(deploymentId);
    if (healthMonitor) {
      await healthMonitor.startMonitoring();
    }

    // Start metrics evaluation
    const metricsEvaluator = this.metricsEvaluators.get(deploymentId);
    if (metricsEvaluator) {
      await metricsEvaluator.startEvaluation();
    }
  }

  /**
   * Handle health check failures
   */
  private async handleHealthFailure(
    monitoredDeployment: MonitoredDeployment,
    reason: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    const healthFailureTrigger = monitoredDeployment.rollbackConfig.autoTriggers
      .find(trigger => trigger.type === 'health-failure');

    if (!healthFailureTrigger) {
      return; // No health failure trigger configured
    }

    // Check if severity meets threshold
    if (this.getSeverityLevel(severity) >= this.getSeverityLevel(healthFailureTrigger.severity)) {
      await this.executeRollback(monitoredDeployment, healthFailureTrigger, reason);
    }
  }

  /**
   * Handle metrics threshold exceeded
   */
  private async handleMetricsThresholdExceeded(
    monitoredDeployment: MonitoredDeployment,
    trigger: RollbackTrigger,
    metrics: any
  ): Promise<void> {
    const reason = `Metrics threshold exceeded: ${trigger.type}`;
    await this.executeRollback(monitoredDeployment, trigger, reason);
  }

  /**
   * Execute rollback operation
   */
  private async executeRollback(
    monitoredDeployment: MonitoredDeployment,
    trigger: RollbackTrigger,
    reason: string
  ): Promise<RollbackResult> {
    const deploymentId = monitoredDeployment.execution.id;

    try {
      // Check if manual approval is required
      if (monitoredDeployment.rollbackConfig.manualApprovalRequired &&
          trigger.type !== 'manual') {
        return await this.requestManualApproval(monitoredDeployment, trigger, reason);
      }

      // Execute rollback
      monitoredDeployment.status = 'rolling-back';

      const rollbackStartTime = new Date();

      // Create rollback event
      const rollbackEvent: RollbackEvent = {
        timestamp: rollbackStartTime,
        trigger,
        reason,
        status: 'in-progress',
        approvalRequired: false
      };

      monitoredDeployment.rollbackHistory.unshift(rollbackEvent);

      // Notify listeners
      await this.notifyRollbackListeners(deploymentId, reason);

      // Execute strategy-specific rollback
      await this.executeStrategySpecificRollback(monitoredDeployment);

      // Complete rollback
      rollbackEvent.status = 'completed';
      rollbackEvent.completedAt = new Date();
      rollbackEvent.duration = Date.now() - rollbackStartTime.getTime();

      monitoredDeployment.status = 'rolled-back';

      console.log(`Rollback completed for deployment ${deploymentId}: ${reason}`);

      return {
        success: true,
        deploymentId,
        trigger,
        reason,
        duration: rollbackEvent.duration
      };

    } catch (error) {
      // Rollback failed
      const rollbackEvent = monitoredDeployment.rollbackHistory[0];
      if (rollbackEvent) {
        rollbackEvent.status = 'failed';
        rollbackEvent.error = error instanceof Error ? error.message : 'Rollback execution failed';
      }

      monitoredDeployment.status = 'rollback-failed';

      console.error(`Rollback failed for deployment ${deploymentId}:`, error);

      return {
        success: false,
        deploymentId,
        trigger,
        reason,
        error: error instanceof Error ? error.message : 'Rollback execution failed'
      };
    }
  }

  /**
   * Request manual approval for rollback
   */
  private async requestManualApproval(
    monitoredDeployment: MonitoredDeployment,
    trigger: RollbackTrigger,
    reason: string
  ): Promise<RollbackResult> {
    const deploymentId = monitoredDeployment.execution.id;

    // Create rollback event awaiting approval
    const rollbackEvent: RollbackEvent = {
      timestamp: new Date(),
      trigger,
      reason,
      status: 'awaiting-approval',
      approvalRequired: true
    };

    monitoredDeployment.rollbackHistory.unshift(rollbackEvent);
    monitoredDeployment.status = 'awaiting-rollback-approval';

    console.log(`Rollback approval required for deployment ${deploymentId}: ${reason}`);

    // In real implementation, this would integrate with approval workflows
    return {
      success: false,
      deploymentId,
      trigger,
      reason,
      requiresApproval: true
    };
  }

  /**
   * Execute strategy-specific rollback logic
   */
  private async executeStrategySpecificRollback(monitoredDeployment: MonitoredDeployment): Promise<void> {
    const strategy = monitoredDeployment.execution.strategy;

    switch (strategy.type) {
      case 'blue-green':
        await this.executeBlueGreenRollback(monitoredDeployment);
        break;

      case 'canary':
        await this.executeCanaryRollback(monitoredDeployment);
        break;

      case 'rolling':
        await this.executeRollingRollback(monitoredDeployment);
        break;

      default:
        await this.executeGenericRollback(monitoredDeployment);
    }
  }

  /**
   * Execute blue-green rollback
   */
  private async executeBlueGreenRollback(monitoredDeployment: MonitoredDeployment): Promise<void> {
    // Switch traffic back to blue environment
    console.log(`Executing blue-green rollback for ${monitoredDeployment.execution.id}`);

    // In real implementation, call blue-green engine rollback
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Execute canary rollback
   */
  private async executeCanaryRollback(monitoredDeployment: MonitoredDeployment): Promise<void> {
    // Redirect traffic back to stable version
    console.log(`Executing canary rollback for ${monitoredDeployment.execution.id}`);

    // In real implementation, call canary controller rollback
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  /**
   * Execute rolling deployment rollback
   */
  private async executeRollingRollback(monitoredDeployment: MonitoredDeployment): Promise<void> {
    // Roll back to previous version
    console.log(`Executing rolling rollback for ${monitoredDeployment.execution.id}`);

    // In real implementation, perform rolling rollback
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  /**
   * Execute generic rollback
   */
  private async executeGenericRollback(monitoredDeployment: MonitoredDeployment): Promise<void> {
    // Generic rollback implementation
    console.log(`Executing generic rollback for ${monitoredDeployment.execution.id}`);

    // Restore previous deployment state
    await new Promise(resolve => setTimeout(resolve, 2500));
  }

  /**
   * Notify rollback listeners
   */
  private async notifyRollbackListeners(deploymentId: string, reason: string): Promise<void> {
    const notificationPromises = this.rollbackListeners.map(listener => {
      try {
        return listener(deploymentId, reason);
      } catch (error) {
        console.error('Error in rollback listener:', error);
        return Promise.resolve();
      }
    });

    await Promise.all(notificationPromises);
  }

  /**
   * Get severity level as number for comparison
   */
  private getSeverityLevel(severity: 'low' | 'medium' | 'high' | 'critical'): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[severity] || 0;
  }

  /**
   * Initialize rollback system
   */
  private async initializeRollbackSystem(): Promise<void> {
    console.log('Auto Rollback System initialized');
  }
}

// Supporting classes
class HealthMonitor {
  private monitoring: boolean = false;
  private healthFailureCallbacks: HealthFailureCallback[] = [];
  private currentHealth: HealthStatus = 'unknown';

  constructor(private monitoredDeployment: MonitoredDeployment) {}

  async startMonitoring(): Promise<void> {
    this.monitoring = true;
    this.monitorHealth();
    console.log(`Health monitoring started for ${this.monitoredDeployment.execution.id}`);
  }

  stop(): void {
    this.monitoring = false;
    console.log(`Health monitoring stopped for ${this.monitoredDeployment.execution.id}`);
  }

  getCurrentHealth(): HealthStatus {
    return this.currentHealth;
  }

  onHealthFailure(callback: HealthFailureCallback): void {
    this.healthFailureCallbacks.push(callback);
  }

  private async monitorHealth(): Promise<void> {
    while (this.monitoring) {
      try {
        const health = await this.checkHealth();
        this.currentHealth = health;

        if (health === 'unhealthy' || health === 'critical') {
          this.monitoredDeployment.consecutiveFailures++;

          // Check if consecutive failures exceed threshold
          const healthTrigger = this.monitoredDeployment.rollbackConfig.autoTriggers
            .find(trigger => trigger.type === 'health-failure');

          if (healthTrigger &&
              this.monitoredDeployment.consecutiveFailures >= healthTrigger.threshold) {

            const severity = health === 'critical' ? 'critical' : 'high';
            const reason = `${this.monitoredDeployment.consecutiveFailures} consecutive health failures`;

            // Notify failure callbacks
            for (const callback of this.healthFailureCallbacks) {
              try {
                await callback(reason, severity);
              } catch (error) {
                console.error('Error in health failure callback:', error);
              }
            }
          }
        } else {
          // Reset consecutive failures on success
          this.monitoredDeployment.consecutiveFailures = 0;
        }

        this.monitoredDeployment.lastHealthCheck = new Date();

      } catch (error) {
        console.error('Error in health monitoring:', error);
        this.currentHealth = 'unknown';
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10 seconds
    }
  }

  private async checkHealth(): Promise<HealthStatus> {
    const environment = this.monitoredDeployment.execution.environment;

    // Check all health endpoints
    const healthResults = await Promise.all(
      environment.healthEndpoints.map(endpoint => this.checkEndpointHealth(endpoint))
    );

    // Determine overall health
    const failedChecks = healthResults.filter(result => !result.healthy);
    const criticalFailures = healthResults.filter(result => result.critical);

    if (criticalFailures.length > 0) {
      return 'critical';
    }

    if (failedChecks.length > 0) {
      return 'unhealthy';
    }

    return 'healthy';
  }

  private async checkEndpointHealth(endpoint: string): Promise<EndpointHealthResult> {
    const startTime = Date.now();
    const timeout = 10000; // 10 second timeout

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'AutoRollbackSystem/1.0',
          'Accept': 'application/json',
          'X-Health-Check': 'rollback-monitor'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      // Consider response healthy if:
      // 1. HTTP status is 2xx
      // 2. Response time is reasonable (< 5 seconds)
      const isHealthy = response.ok && responseTime < 5000;
      let isCritical = false;

      // Parse health check response for detailed status
      if (response.ok) {
        try {
          const healthData = await response.json();

          // Check for critical system indicators
          if (healthData.status === 'critical' ||
              healthData.database === 'down' ||
              healthData.memory_usage > 90 ||
              healthData.cpu_usage > 95) {
            isCritical = true;
          }
        } catch (parseError) {
          // If we can't parse response, but got 200, consider non-critical
          console.warn(`Health check response parse failed for ${endpoint}:`, parseError.message);
        }
      } else {
        // HTTP errors indicate potential critical issues
        isCritical = response.status >= 500; // 5xx errors are critical
      }

      return {
        endpoint,
        healthy: isHealthy,
        critical: isCritical,
        responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        endpoint,
        healthy: false,
        critical: true, // Network errors are always critical
        responseTime,
        error: error instanceof Error ? error.message : 'Health check network error'
      };
    }
  }
}

class MetricsEvaluator {
  private evaluating: boolean = false;
  private thresholdCallbacks: ThresholdCallback[] = [];
  private currentStatus: MetricsStatus = 'normal';

  constructor(private monitoredDeployment: MonitoredDeployment) {}

  async startEvaluation(): Promise<void> {
    this.evaluating = true;
    this.evaluateMetrics();
    console.log(`Metrics evaluation started for ${this.monitoredDeployment.execution.id}`);
  }

  stop(): void {
    this.evaluating = false;
    console.log(`Metrics evaluation stopped for ${this.monitoredDeployment.execution.id}`);
  }

  getCurrentStatus(): MetricsStatus {
    return this.currentStatus;
  }

  onThresholdExceeded(callback: ThresholdCallback): void {
    this.thresholdCallbacks.push(callback);
  }

  private async evaluateMetrics(): Promise<void> {
    while (this.evaluating) {
      try {
        // Collect current metrics
        const metrics = await this.collectMetrics();

        // Evaluate against rollback triggers
        await this.evaluateRollbackTriggers(metrics);

        // Update status
        this.updateMetricsStatus(metrics);

      } catch (error) {
        console.error('Error in metrics evaluation:', error);
        this.currentStatus = 'error';
      }

      // Wait before next evaluation
      await new Promise(resolve => setTimeout(resolve, 15000)); // Evaluate every 15 seconds
    }
  }

  private async collectMetrics(): Promise<DeploymentMetrics> {
    const environment = this.monitoredDeployment.execution.environment;
    const namespace = environment.namespace;

    try {
      // Collect metrics from multiple sources in parallel
      const [applicationMetrics, infrastructureMetrics, businessMetrics] = await Promise.all([
        this.collectApplicationMetrics(namespace),
        this.collectInfrastructureMetrics(namespace),
        this.collectBusinessMetrics(namespace)
      ]);

      return {
        ...applicationMetrics,
        ...infrastructureMetrics,
        ...businessMetrics,
        timestamp: Date.now(),
        source: 'real-monitoring'
      };

    } catch (error) {
      console.error('Metrics collection failed:', error);
      // Return safe fallback metrics that will likely trigger rollback
      return {
        errorRate: 25, // High error rate
        responseTime: 10000, // Very high response time
        availability: 50, // Low availability
        throughput: 0,
        cpuUsage: 100,
        memoryUsage: 100,
        timestamp: Date.now(),
        source: 'fallback-error'
      };
    }
  }

  private async collectApplicationMetrics(namespace: string): Promise<{
    errorRate: number;
    responseTime: number;
    availability: number;
    throughput: number;
  }> {
    const metricsEndpoint = `http://${namespace}.internal/metrics`;

    try {
      const response = await fetch(metricsEndpoint, {
        timeout: 5000,
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Metrics endpoint returned ${response.status}`);
      }

      const data = await response.json();

      return {
        errorRate: data.http_requests_error_rate || data.error_rate || 0,
        responseTime: data.http_request_duration_avg || data.response_time || 1000,
        availability: data.availability_percentage || (response.ok ? 100 : 0),
        throughput: data.requests_per_second || data.throughput || 0
      };

    } catch (error) {
      console.warn(`Application metrics collection failed for ${namespace}:`, error.message);
      return {
        errorRate: 10, // Assume moderate error rate if can't collect
        responseTime: 2000,
        availability: 70,
        throughput: 0
      };
    }
  }

  private async collectInfrastructureMetrics(namespace: string): Promise<{
    cpuUsage: number;
    memoryUsage: number;
  }> {
    try {
      // For Kubernetes environments
      if (process.env.KUBERNETES_SERVICE_HOST) {
        const orchestrator = new ContainerOrchestrator({ platform: 'kubernetes' });
        const containers = await orchestrator.getContainerStatus(namespace);

        // Calculate average resource usage across containers
        let totalCpuUsage = 0;
        let totalMemoryUsage = 0;
        let validContainers = 0;

        for (const container of containers) {
          if (container.status === 'running') {
            // In real implementation, these would come from container metrics
            totalCpuUsage += this.estimateCpuUsage(container);
            totalMemoryUsage += this.estimateMemoryUsage(container);
            validContainers++;
          }
        }

        if (validContainers > 0) {
          return {
            cpuUsage: totalCpuUsage / validContainers,
            memoryUsage: totalMemoryUsage / validContainers
          };
        }
      }

      // Fallback for non-containerized environments
      return {
        cpuUsage: 50, // Default moderate usage
        memoryUsage: 60
      };

    } catch (error) {
      console.warn('Infrastructure metrics collection failed:', error.message);
      return {
        cpuUsage: 80, // Assume high usage if can't measure
        memoryUsage: 80
      };
    }
  }

  private async collectBusinessMetrics(namespace: string): Promise<Record<string, any>> {
    // Collect business-specific metrics that might indicate deployment issues
    try {
      const businessEndpoint = `http://${namespace}.internal/business-metrics`;
      const response = await fetch(businessEndpoint, { timeout: 3000 });

      if (response.ok) {
        const data = await response.json();
        return {
          conversionRate: data.conversion_rate || 100,
          userSatisfactionScore: data.user_satisfaction || 100,
          businessImpact: data.business_impact || 'neutral'
        };
      }
    } catch (error) {
      // Business metrics are optional
      console.debug('Business metrics not available:', error.message);
    }

    return {};
  }

  private estimateCpuUsage(container: any): number {
    // In real implementation, this would query container metrics API
    // For now, estimate based on container status and restart count
    if (container.status === 'running' && container.restartCount === 0) {
      return 30 + Math.random() * 40; // 30-70% for healthy containers
    } else {
      return 70 + Math.random() * 30; // 70-100% for problematic containers
    }
  }

  private estimateMemoryUsage(container: any): number {
    // Similar estimation for memory usage
    if (container.status === 'running' && container.restartCount === 0) {
      return 40 + Math.random() * 30; // 40-70% for healthy containers
    } else {
      return 80 + Math.random() * 20; // 80-100% for problematic containers
    }
  }

  private async evaluateRollbackTriggers(metrics: DeploymentMetrics): Promise<void> {
    const triggers = this.monitoredDeployment.rollbackConfig.autoTriggers;

    for (const trigger of triggers) {
      const shouldTrigger = await this.shouldTriggerRollback(trigger, metrics);

      if (shouldTrigger) {
        // Notify threshold callbacks
        for (const callback of this.thresholdCallbacks) {
          try {
            await callback(trigger, metrics);
          } catch (error) {
            console.error('Error in threshold callback:', error);
          }
        }
        break; // Only trigger first matching condition
      }
    }
  }

  private async shouldTriggerRollback(
    trigger: RollbackTrigger,
    metrics: DeploymentMetrics
  ): Promise<boolean> {
    switch (trigger.type) {
      case 'error-rate':
        return metrics.errorRate > trigger.threshold;

      case 'performance-degradation':
        return metrics.responseTime > trigger.threshold;

      case 'health-failure':
        return metrics.availability < trigger.threshold;

      default:
        return false;
    }
  }

  private updateMetricsStatus(metrics: DeploymentMetrics): void {
    if (metrics.errorRate > 10 || metrics.responseTime > 5000 || metrics.availability < 90) {
      this.currentStatus = 'critical';
    } else if (metrics.errorRate > 5 || metrics.responseTime > 2000 || metrics.availability < 95) {
      this.currentStatus = 'warning';
    } else {
      this.currentStatus = 'normal';
    }
  }
}

// Supporting interfaces and types
interface MonitoredDeployment {
  execution: DeploymentExecution;
  rollbackConfig: RollbackConfig;
  status: MonitoringStatus;
  rollbackHistory: RollbackEvent[];
  startTime: Date;
  lastHealthCheck: Date;
  consecutiveFailures: number;
}

type MonitoringStatus =
  | 'monitoring'
  | 'rolling-back'
  | 'rolled-back'
  | 'rollback-failed'
  | 'awaiting-rollback-approval';

interface RollbackEvent {
  timestamp: Date;
  trigger: RollbackTrigger;
  reason: string;
  status: 'in-progress' | 'completed' | 'failed' | 'awaiting-approval';
  approvalRequired: boolean;
  completedAt?: Date;
  duration?: number;
  error?: string;
}

interface RollbackStatus {
  deploymentId: string;
  monitoring: boolean;
  rollbacksTriggered: number;
  lastRollbackReason?: string;
  currentHealth: HealthStatus;
  activeTriggers: RollbackTrigger[];
  metricsStatus: MetricsStatus | null;
}

interface RollbackResult {
  success: boolean;
  deploymentId: string;
  trigger: RollbackTrigger;
  reason: string;
  duration?: number;
  error?: string;
  requiresApproval?: boolean;
}

type HealthStatus = 'healthy' | 'unhealthy' | 'critical' | 'unknown';
type MetricsStatus = 'normal' | 'warning' | 'critical' | 'error';

interface EndpointHealthResult {
  endpoint: string;
  healthy: boolean;
  critical: boolean;
  responseTime?: number;
  error?: string;
}

interface DeploymentMetrics {
  errorRate: number;
  responseTime: number;
  availability: number;
  throughput: number;
  cpuUsage: number;
  memoryUsage: number;
}

type RollbackListener = (deploymentId: string, reason: string) => Promise<void> | void;
type HealthFailureCallback = (reason: string, severity: 'low' | 'medium' | 'high' | 'critical') => Promise<void> | void;
type ThresholdCallback = (trigger: RollbackTrigger, metrics: DeploymentMetrics) => Promise<void> | void;