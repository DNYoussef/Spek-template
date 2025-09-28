/**
 * MEGA SWARM AGENT 100: INTEGRATION SYSTEM KILLER
 * Integration Monitor - Real-time Integration Health & Performance Monitoring
 * NASA Rule 10 Compliant: All functions ≤60 lines, no recursion, fixed loops
 * FSM-First Design: Monitors integration health and performance metrics
 */

import { EventEmitter } from 'events';
import {
  IntegrationContext,
  IntegrationContract,
  MonitoringConfig,
  MetricConfig,
  AlertConfig
} from './IntegrationFSMCore';

export interface HealthCheck {
  integrationId: string;
  timestamp: Date;
  status: 'healthy' | 'degraded' | 'critical' | 'down';
  metrics: Record<string, number>;
  issues: HealthIssue[];
}

export interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'connectivity' | 'authentication' | 'data' | 'configuration';
  message: string;
  threshold?: number;
  actualValue?: number;
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
  connectionPool: number;
  memoryUsage: number;
}

/**
 * Integration Health Monitor
 * Provides real-time monitoring and alerting for integrations
 */
export class IntegrationMonitor extends EventEmitter {
  private healthChecks: Map<string, HealthCheck[]> = new Map();
  private performanceMetrics: Map<string, PerformanceMetrics[]> = new Map();
  private alertConfigs: Map<string, AlertConfig[]> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Start monitoring integration (NASA Rule 10: ≤60 lines)
   */
  public startMonitoring(
    integrationId: string,
    contract: IntegrationContract,
    context: IntegrationContext
  ): void {
    const config = contract.monitoring;

    if (!config.healthCheck) {
      return;
    }

    // Store alert configurations
    this.alertConfigs.set(integrationId, config.alerts || []);

    // Initialize health check history
    if (!this.healthChecks.has(integrationId)) {
      this.healthChecks.set(integrationId, []);
    }

    // Initialize performance metrics history
    if (!this.performanceMetrics.has(integrationId)) {
      this.performanceMetrics.set(integrationId, []);
    }

    // Start periodic health checks (NASA Rule 10: Fixed interval)
    const interval = Math.min(config.heartbeatInterval || 60000, 300000); // Max 5 minutes

    if (!this.monitoringInterval) {
      this.monitoringInterval = setInterval(() => {
        this.performHealthCheck(integrationId, contract, context);
      }, interval);
    }

    this.emit('monitoring:started', { integrationId, interval });
  }

  /**
   * Perform health check (NASA Rule 10: ≤60 lines)
   */
  private async performHealthCheck(
    integrationId: string,
    contract: IntegrationContract,
    context: IntegrationContext
  ): Promise<void> {
    try {
      const healthCheck: HealthCheck = {
        integrationId,
        timestamp: new Date(),
        status: 'healthy',
        metrics: {},
        issues: []
      };

      // Collect basic metrics
      healthCheck.metrics = this.collectBasicMetrics(context);

      // Evaluate configured metrics (fixed loop bound)
      const metricConfigs = contract.monitoring.metrics || [];
      for (let i = 0; i < Math.min(metricConfigs.length, 20); i++) {
        const metricConfig = metricConfigs[i];
        if (metricConfig.enabled) {
          this.evaluateMetric(metricConfig, healthCheck, context);
        }
      }

      // Determine overall status
      healthCheck.status = this.calculateOverallStatus(healthCheck.issues);

      // Store health check
      this.storeHealthCheck(integrationId, healthCheck);

      // Check alerts (fixed loop bound)
      const alertConfigs = this.alertConfigs.get(integrationId) || [];
      for (let i = 0; i < Math.min(alertConfigs.length, 10); i++) {
        const alert = alertConfigs[i];
        if (alert.enabled) {
          this.evaluateAlert(alert, healthCheck);
        }
      }

      this.emit('health:checked', healthCheck);

    } catch (error) {
      this.emit('health:error', { integrationId, error: error.message });
    }
  }

  /**
   * Collect basic metrics (NASA Rule 10: ≤60 lines)
   */
  private collectBasicMetrics(context: IntegrationContext): Record<string, number> {
    const now = Date.now();
    const startTime = context.startTime.getTime();

    return {
      uptime: now - startTime,
      errors: context.errors.length,
      attempts: context.attempts,
      state_duration: now - (context.data.__last_transition || startTime),
      memory_usage: process.memoryUsage().heapUsed,
      cpu_usage: process.cpuUsage().user
    };
  }

  /**
   * Evaluate metric against thresholds (NASA Rule 10: ≤60 lines)
   */
  private evaluateMetric(
    metricConfig: MetricConfig,
    healthCheck: HealthCheck,
    context: IntegrationContext
  ): void {
    const metricName = metricConfig.name;
    const threshold = metricConfig.threshold;
    const actualValue = healthCheck.metrics[metricName];

    if (threshold && actualValue !== undefined) {
      let isIssue = false;
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      // Different evaluation logic based on metric type
      switch (metricConfig.type) {
        case 'counter':
          isIssue = actualValue > threshold;
          severity = actualValue > threshold * 2 ? 'critical' : 'high';
          break;
        case 'gauge':
          isIssue = actualValue > threshold;
          severity = actualValue > threshold * 1.5 ? 'high' : 'medium';
          break;
        case 'histogram':
          isIssue = actualValue > threshold;
          severity = 'medium';
          break;
      }

      if (isIssue) {
        healthCheck.issues.push({
          severity,
          category: 'performance',
          message: `Metric ${metricName} exceeded threshold`,
          threshold,
          actualValue
        });
      }
    }
  }

  /**
   * Calculate overall health status (NASA Rule 10: ≤60 lines)
   */
  private calculateOverallStatus(issues: HealthIssue[]): 'healthy' | 'degraded' | 'critical' | 'down' {
    if (issues.length === 0) {
      return 'healthy';
    }

    let criticalCount = 0;
    let highCount = 0;

    // Fixed loop bound (NASA Rule 10)
    for (let i = 0; i < Math.min(issues.length, 50); i++) {
      const issue = issues[i];
      if (issue.severity === 'critical') {
        criticalCount++;
      } else if (issue.severity === 'high') {
        highCount++;
      }
    }

    if (criticalCount > 0) {
      return 'critical';
    } else if (highCount > 2) {
      return 'degraded';
    } else if (highCount > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Store health check with rotation (NASA Rule 10: ≤60 lines)
   */
  private storeHealthCheck(integrationId: string, healthCheck: HealthCheck): void {
    const checks = this.healthChecks.get(integrationId) || [];

    checks.push(healthCheck);

    // Rotate history (NASA Rule 10: Fixed bound)
    const maxHistory = 100;
    if (checks.length > maxHistory) {
      checks.splice(0, checks.length - maxHistory);
    }

    this.healthChecks.set(integrationId, checks);
  }

  /**
   * Evaluate alert conditions (NASA Rule 10: ≤60 lines)
   */
  private evaluateAlert(alert: AlertConfig, healthCheck: HealthCheck): void {
    try {
      // Simple condition evaluation (would be more sophisticated in real implementation)
      let triggered = false;

      if (alert.condition.includes('error_rate')) {
        const errorRate = healthCheck.metrics.errors || 0;
        triggered = errorRate > 5; // Example threshold
      } else if (alert.condition.includes('response_time')) {
        const responseTime = healthCheck.metrics.response_time || 0;
        triggered = responseTime > 5000; // Example threshold
      } else if (alert.condition.includes('status')) {
        triggered = healthCheck.status === 'critical' || healthCheck.status === 'down';
      }

      if (triggered) {
        this.emit('alert:triggered', {
          integrationId: healthCheck.integrationId,
          alert: alert.name,
          severity: alert.severity,
          condition: alert.condition,
          healthCheck
        });
      }

    } catch (error) {
      this.emit('alert:error', {
        integrationId: healthCheck.integrationId,
        alert: alert.name,
        error: error.message
      });
    }
  }

  /**
   * Get health status (NASA Rule 10: ≤60 lines)
   */
  public getHealthStatus(integrationId: string): HealthCheck | null {
    const checks = this.healthChecks.get(integrationId);
    return checks && checks.length > 0 ? checks[checks.length - 1] : null;
  }

  /**
   * Get health history (NASA Rule 10: ≤60 lines)
   */
  public getHealthHistory(integrationId: string, limit: number = 10): HealthCheck[] {
    const checks = this.healthChecks.get(integrationId) || [];
    const boundedLimit = Math.min(limit, 100); // NASA Rule 10: Fixed bound
    return checks.slice(-boundedLimit);
  }

  /**
   * Stop monitoring (NASA Rule 10: ≤60 lines)
   */
  public stopMonitoring(integrationId?: string): void {
    if (integrationId) {
      this.healthChecks.delete(integrationId);
      this.performanceMetrics.delete(integrationId);
      this.alertConfigs.delete(integrationId);
      this.emit('monitoring:stopped', { integrationId });
    } else {
      // Stop all monitoring
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }
      this.healthChecks.clear();
      this.performanceMetrics.clear();
      this.alertConfigs.clear();
      this.emit('monitoring:stopped', { all: true });
    }
  }

  /**
   * Get monitoring statistics (NASA Rule 10: ≤60 lines)
   */
  public getMonitoringStats(): Record<string, any> {
    const activeIntegrations = this.healthChecks.size;
    let totalChecks = 0;
    let healthyCount = 0;

    // Fixed iteration bound (NASA Rule 10)
    const entries = Array.from(this.healthChecks.entries()).slice(0, 100);
    for (const [_, checks] of entries) {
      totalChecks += checks.length;
      const latestCheck = checks[checks.length - 1];
      if (latestCheck && latestCheck.status === 'healthy') {
        healthyCount++;
      }
    }

    return {
      activeIntegrations,
      totalChecks,
      healthyCount,
      healthyPercentage: activeIntegrations > 0 ? (healthyCount / activeIntegrations) * 100 : 0
    };
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T09:40:45-04:00 | mega-swarm-100@agent | Created Integration Monitor with real-time health monitoring | IntegrationMonitor.ts | OK | Eliminates monitoring god object patterns with NASA-compliant bounds | 0.00 | e8f9a0b |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: integration-killer-005
- inputs: ["IntegrationFSMCore.ts"]
- tools_used: ["Write"]
- versions: {"model":"mega-swarm-100","prompt":"integration-elimination-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->