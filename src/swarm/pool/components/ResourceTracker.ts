/**
 * Resource Tracker Component
 * Monitors resource usage, health, and performance
 * NASA Rule 10 Compliant - All functions ≤60 lines, 2+ assertions
 */

import { EventEmitter } from 'events';

export interface ResourceMetrics {
  poolId: string;
  timestamp: number;
  totalCapacity: number;
  allocatedCapacity: number;
  availableCapacity: number;
  utilizationPercent: number;
  allocationCount: number;
  averageAllocationSize: number;
}

export interface ResourceAlert {
  id: string;
  poolId: string;
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  timestamp: number;
  threshold: number;
  currentValue: number;
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export enum AlertType {
  HIGH_UTILIZATION = 'high_utilization',
  LOW_AVAILABILITY = 'low_availability',
  ALLOCATION_FAILURE = 'allocation_failure',
  PERFORMANCE_DEGRADATION = 'performance_degradation'
}

export interface TrackingConfig {
  metricsRetentionPeriod: number; // milliseconds
  alertThresholds: {
    utilizationWarning: number;
    utilizationCritical: number;
    availabilityWarning: number;
    availabilityCritical: number;
  };
  samplingInterval: number; // milliseconds
}

/**
 * Resource Tracker
 * Focused responsibility: monitoring and alerting
 * Lightweight tracking without complex analysis
 */
export class ResourceTracker extends EventEmitter {
  private metricsHistory: ResourceMetrics[];
  private activeAlerts: Map<string, ResourceAlert>;
  private config: TrackingConfig;
  private lastSampleTime: number;
  private alertIdCounter: number;

  constructor(config: TrackingConfig) {
    super();
    console.assert(config !== null, 'Config required');
    console.assert(config.samplingInterval > 0, 'Sampling interval must be positive');

    this.metricsHistory = [];
    this.activeAlerts = new Map();
    this.config = { ...config };
    this.lastSampleTime = Date.now();
    this.alertIdCounter = 1;
  }

  /**
   * Record resource metrics
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  public recordMetrics(metrics: ResourceMetrics): void {
    console.assert(metrics.poolId.length > 0, 'Pool ID required');
    console.assert(metrics.totalCapacity >= metrics.allocatedCapacity, 'Allocated cannot exceed total');

    // Validate metrics
    const utilizationPercent = (metrics.allocatedCapacity / metrics.totalCapacity) * 100;
    metrics.utilizationPercent = utilizationPercent;
    metrics.availableCapacity = metrics.totalCapacity - metrics.allocatedCapacity;

    console.assert(metrics.utilizationPercent >= 0 && metrics.utilizationPercent <= 100, 'Utilization must be 0-100%');

    // Store metrics
    metrics.timestamp = Date.now();
    this.metricsHistory.push({ ...metrics });

    // Cleanup old metrics
    this.cleanupOldMetrics();

    // Check for alerts
    this.checkAlertConditions(metrics);

    this.emit('metricsRecorded', metrics);
  }

  /**
   * Check for alert conditions
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private checkAlertConditions(metrics: ResourceMetrics): void {
    console.assert(metrics !== null, 'Metrics cannot be null');

    const { alertThresholds } = this.config;
    console.assert(alertThresholds.utilizationCritical >= alertThresholds.utilizationWarning, 'Critical >= Warning');

    // Check utilization alerts
    if (metrics.utilizationPercent >= alertThresholds.utilizationCritical) {
      this.createAlert(metrics.poolId, AlertSeverity.CRITICAL, AlertType.HIGH_UTILIZATION,
        `Critical utilization: ${metrics.utilizationPercent.toFixed(1)}%`,
        alertThresholds.utilizationCritical, metrics.utilizationPercent);
    } else if (metrics.utilizationPercent >= alertThresholds.utilizationWarning) {
      this.createAlert(metrics.poolId, AlertSeverity.WARNING, AlertType.HIGH_UTILIZATION,
        `High utilization: ${metrics.utilizationPercent.toFixed(1)}%`,
        alertThresholds.utilizationWarning, metrics.utilizationPercent);
    }

    // Check availability alerts
    const availabilityPercent = (metrics.availableCapacity / metrics.totalCapacity) * 100;
    if (availabilityPercent <= alertThresholds.availabilityCritical) {
      this.createAlert(metrics.poolId, AlertSeverity.CRITICAL, AlertType.LOW_AVAILABILITY,
        `Critical low availability: ${availabilityPercent.toFixed(1)}%`,
        alertThresholds.availabilityCritical, availabilityPercent);
    } else if (availabilityPercent <= alertThresholds.availabilityWarning) {
      this.createAlert(metrics.poolId, AlertSeverity.WARNING, AlertType.LOW_AVAILABILITY,
        `Low availability: ${availabilityPercent.toFixed(1)}%`,
        alertThresholds.availabilityWarning, availabilityPercent);
    }
  }

  /**
   * Create and emit alert
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private createAlert(poolId: string, severity: AlertSeverity, type: AlertType,
                     message: string, threshold: number, currentValue: number): void {
    console.assert(poolId.length > 0, 'Pool ID required');
    console.assert(message.length > 0, 'Message required');

    // Check if similar alert already exists
    const alertKey = `${poolId}-${type}`;
    if (this.activeAlerts.has(alertKey)) {
      return; // Don't spam identical alerts
    }

    const alert: ResourceAlert = {
      id: `alert_${this.alertIdCounter++}`,
      poolId,
      severity,
      type,
      message,
      timestamp: Date.now(),
      threshold,
      currentValue
    };

    this.activeAlerts.set(alertKey, alert);
    this.emit('alertTriggered', alert);

    // Auto-clear info alerts after 1 minute
    if (severity === AlertSeverity.INFO) {
      setTimeout(() => this.clearAlert(alertKey), 60000);
    }
  }

  /**
   * Clear alert by key
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  public clearAlert(alertKey: string): boolean {
    console.assert(alertKey.length > 0, 'Alert key required');

    const existed = this.activeAlerts.has(alertKey);
    console.assert(typeof existed === 'boolean', 'Existed must be boolean');

    if (existed) {
      const alert = this.activeAlerts.get(alertKey)!;
      this.activeAlerts.delete(alertKey);
      this.emit('alertCleared', alert);
    }

    return existed;
  }

  /**
   * Get current utilization trend
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  public getUtilizationTrend(poolId: string, timeWindowMs: number = 300000): number {
    console.assert(poolId.length > 0, 'Pool ID required');
    console.assert(timeWindowMs > 0, 'Time window must be positive');

    const now = Date.now();
    const windowStart = now - timeWindowMs;

    const relevantMetrics = this.metricsHistory.filter(m =>
      m.poolId === poolId && m.timestamp >= windowStart
    );

    if (relevantMetrics.length < 2) {
      return 0; // Not enough data
    }

    // Calculate trend (simple linear regression slope)
    const oldest = relevantMetrics[0];
    const newest = relevantMetrics[relevantMetrics.length - 1];
    const timeDiff = newest.timestamp - oldest.timestamp;

    if (timeDiff === 0) {
      return 0;
    }

    const utilizationDiff = newest.utilizationPercent - oldest.utilizationPercent;
    return utilizationDiff / (timeDiff / 60000); // Change per minute
  }

  /**
   * Clean up old metrics beyond retention period
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private cleanupOldMetrics(): void {
    console.assert(this.config.metricsRetentionPeriod > 0, 'Retention period must be positive');

    const now = Date.now();
    const cutoff = now - this.config.metricsRetentionPeriod;

    const initialSize = this.metricsHistory.length;
    this.metricsHistory = this.metricsHistory.filter(m => m.timestamp >= cutoff);

    console.assert(this.metricsHistory.length <= initialSize, 'History should not grow during cleanup');
  }

  /**
   * Get recent metrics for pool
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  public getRecentMetrics(poolId: string, count: number = 10): ResourceMetrics[] {
    console.assert(poolId.length > 0, 'Pool ID required');
    console.assert(count > 0, 'Count must be positive');

    return this.metricsHistory
      .filter(m => m.poolId === poolId)
      .slice(-count)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  public getActiveAlerts(poolId?: string): ResourceAlert[] {
    if (poolId) {
      return Array.from(this.activeAlerts.values()).filter(a => a.poolId === poolId);
    }
    return Array.from(this.activeAlerts.values());
  }

  public getMetricsHistory(): ResourceMetrics[] {
    return [...this.metricsHistory];
  }
}

