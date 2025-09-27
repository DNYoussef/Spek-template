/**
 * StateTransitionMonitor - Real-time FSM Transition Monitoring
 * Provides real-time monitoring and analytics for all state transitions
 */

import { EventEmitter } from 'events';
import {
  TransitionRecord,
  FSMContext,
  FSMMetrics,
  FSMHealthStatus,
  StateChangeEvent
} from '../types/FSMTypes';
import { TransitionHub } from '../TransitionHub';

export interface MonitoringConfig {
  enableRealTimeTracking: boolean;
  metricsInterval: number;
  alertThresholds: {
    errorRate: number;
    avgTransitionTime: number;
    queueSize: number;
  };
  retentionPeriod: number;
  enablePerformanceAnalysis: boolean;
}

export interface PerformanceAlert {
  id: string;
  type: 'error_rate' | 'slow_transition' | 'queue_overflow' | 'fsm_unhealthy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  fsmId?: string;
  timestamp: number;
  metrics: Record<string, number>;
}

export interface RealTimeMetrics {
  timestamp: number;
  activeTransitions: number;
  transitionsPerSecond: number;
  averageTransitionTime: number;
  errorRate: number;
  queueLength: number;
  fsmHealthScores: Map<string, number>;
  performanceScore: number;
}

export class StateTransitionMonitor extends EventEmitter {
  private initialized = false;
  private config: MonitoringConfig;
  private transitionHub: TransitionHub | null = null;
  private metricsHistory: RealTimeMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private fsmHealthStatus: Map<string, FSMHealthStatus> = new Map();
  private transitionCounts: Map<string, number> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastMetricsTime = 0;
  private transitionBuffer: StateChangeEvent[] = [];

  constructor(config: Partial<MonitoringConfig> = {}) {
    super();
    
    this.config = {
      enableRealTimeTracking: true,
      metricsInterval: 5000, // 5 seconds
      alertThresholds: {
        errorRate: 0.05, // 5%
        avgTransitionTime: 10000, // 10 seconds
        queueSize: 100
      },
      retentionPeriod: 3600000, // 1 hour
      enablePerformanceAnalysis: true,
      ...config
    };
  }

  /**
   * Initialize the monitor
   */
  async initialize(transitionHub?: TransitionHub): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.log('Initializing StateTransitionMonitor');
    
    this.transitionHub = transitionHub || null;
    
    // Subscribe to transition hub events if available
    if (this.transitionHub) {
      this.subscribeToHubEvents();
    }
    
    // Clear data structures
    this.metricsHistory = [];
    this.alerts = [];
    this.fsmHealthStatus.clear();
    this.transitionCounts.clear();
    this.errorCounts.clear();
    this.transitionBuffer = [];
    
    // Start monitoring
    if (this.config.enableRealTimeTracking) {
      this.startRealTimeMonitoring();
    }
    
    this.initialized = true;
    this.log('StateTransitionMonitor initialized successfully');
  }

  /**
   * Subscribe to TransitionHub events
   */
  private subscribeToHubEvents(): void {
    if (!this.transitionHub) {
      return;
    }

    this.transitionHub.on('fsmStateChange', (data) => {
      this.handleStateChange(data);
    });
    
    this.transitionHub.on('fsmTransitionComplete', (data) => {
      this.handleTransitionComplete(data);
    });
    
    this.transitionHub.on('fsmError', (data) => {
      this.handleFSMError(data);
    });
    
    this.transitionHub.on('fsmInactive', (data) => {
      this.handleFSMInactive(data);
    });
    
    this.log('Subscribed to TransitionHub events');
  }

  /**
   * Start real-time monitoring
   */
  private startRealTimeMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
      this.cleanupOldData();
    }, this.config.metricsInterval);
    
    this.log('Real-time monitoring started');
  }

  /**
   * Record a state transition
   */
  recordTransition(fsmId: string, transition: TransitionRecord): void {
    const event: StateChangeEvent = {
      fsmId,
      from: transition.from,
      to: transition.to,
      event: transition.event,
      timestamp: transition.timestamp,
      duration: transition.duration,
      success: transition.success,
      context: transition.context || {
        currentState: transition.to,
        data: {},
        timestamp: transition.timestamp,
        transitionHistory: [],
        metadata: {}
      }
    };
    
    this.transitionBuffer.push(event);
    
    // Update counters
    const currentCount = this.transitionCounts.get(fsmId) || 0;
    this.transitionCounts.set(fsmId, currentCount + 1);
    
    if (!transition.success) {
      const errorCount = this.errorCounts.get(fsmId) || 0;
      this.errorCounts.set(fsmId, errorCount + 1);
    }
    
    // Emit real-time event
    this.emit('transitionRecorded', event);
    
    // Check for immediate alerts
    this.checkTransitionAlerts(fsmId, transition);
  }

  /**
   * Update FSM health status
   */
  updateFSMHealth(fsmId: string, health: FSMHealthStatus): void {
    this.fsmHealthStatus.set(fsmId, health);
    
    // Check health alerts
    if (!health.isHealthy) {
      this.createAlert({
        type: 'fsm_unhealthy',
        severity: 'high',
        message: `FSM ${fsmId} is unhealthy`,
        fsmId,
        metrics: {
          uptime: health.uptime,
          errorCount: health.errorCount,
          lastTransition: health.lastTransition
        }
      });
    }
    
    this.emit('fsmHealthUpdated', { fsmId, health });
  }

  /**
   * Collect current metrics
   */
  private collectMetrics(): void {
    const now = Date.now();
    const timeDelta = now - this.lastMetricsTime;
    
    if (timeDelta === 0) {
      return;
    }
    
    // Calculate transitions per second
    const recentTransitions = this.transitionBuffer.filter(
      t => t.timestamp > now - this.config.metricsInterval
    );
    
    const transitionsPerSecond = (recentTransitions.length / timeDelta) * 1000;
    
    // Calculate average transition time
    const successfulTransitions = recentTransitions.filter(t => t.success);
    const avgTransitionTime = successfulTransitions.length > 0
      ? successfulTransitions.reduce((sum, t) => sum + t.duration, 0) / successfulTransitions.length
      : 0;
    
    // Calculate error rate
    const errorRate = recentTransitions.length > 0
      ? (recentTransitions.length - successfulTransitions.length) / recentTransitions.length
      : 0;
    
    // Get queue length from hub
    const queueLength = this.transitionHub ? this.transitionHub.getStatus().queueLength : 0;
    const activeTransitions = this.transitionHub ? this.transitionHub.getStatus().activeTransitions : 0;
    
    // Calculate FSM health scores
    const fsmHealthScores = new Map<string, number>();
    for (const [fsmId, health] of this.fsmHealthStatus) {
      const score = this.calculateHealthScore(health);
      fsmHealthScores.set(fsmId, score);
    }
    
    // Calculate overall performance score
    const performanceScore = this.calculatePerformanceScore({
      errorRate,
      avgTransitionTime,
      queueLength,
      fsmHealthScores
    });
    
    const metrics: RealTimeMetrics = {
      timestamp: now,
      activeTransitions,
      transitionsPerSecond,
      averageTransitionTime: avgTransitionTime,
      errorRate,
      queueLength,
      fsmHealthScores,
      performanceScore
    };
    
    this.metricsHistory.push(metrics);
    this.lastMetricsTime = now;
    
    // Emit metrics event
    this.emit('metricsCollected', metrics);
    
    this.log(`Metrics collected: TPS=${transitionsPerSecond.toFixed(2)}, ` +
             `AvgTime=${avgTransitionTime.toFixed(2)}ms, ` +
             `ErrorRate=${(errorRate * 100).toFixed(2)}%, ` +
             `Performance=${performanceScore.toFixed(2)}`);
  }

  /**
   * Analyze performance and create alerts
   */
  private analyzePerformance(): void {
    if (this.metricsHistory.length === 0) {
      return;
    }
    
    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    
    // Check error rate threshold
    if (latest.errorRate > this.config.alertThresholds.errorRate) {
      this.createAlert({
        type: 'error_rate',
        severity: latest.errorRate > 0.1 ? 'critical' : 'high',
        message: `High error rate detected: ${(latest.errorRate * 100).toFixed(2)}%`,
        metrics: { errorRate: latest.errorRate }
      });
    }
    
    // Check average transition time
    if (latest.averageTransitionTime > this.config.alertThresholds.avgTransitionTime) {
      this.createAlert({
        type: 'slow_transition',
        severity: latest.averageTransitionTime > 20000 ? 'critical' : 'medium',
        message: `Slow transitions detected: ${latest.averageTransitionTime.toFixed(0)}ms average`,
        metrics: { averageTransitionTime: latest.averageTransitionTime }
      });
    }
    
    // Check queue size
    if (latest.queueLength > this.config.alertThresholds.queueSize) {
      this.createAlert({
        type: 'queue_overflow',
        severity: latest.queueLength > 500 ? 'critical' : 'high',
        message: `Large transition queue: ${latest.queueLength} pending`,
        metrics: { queueLength: latest.queueLength }
      });
    }
  }

  /**
   * Check for transition-specific alerts
   */
  private checkTransitionAlerts(fsmId: string, transition: TransitionRecord): void {
    // Check for slow individual transitions
    if (transition.duration > this.config.alertThresholds.avgTransitionTime * 2) {
      this.createAlert({
        type: 'slow_transition',
        severity: 'medium',
        message: `Very slow transition in ${fsmId}: ${transition.duration}ms`,
        fsmId,
        metrics: { transitionTime: transition.duration }
      });
    }
  }

  /**
   * Create an alert
   */
  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp'>): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      ...alertData
    };
    
    this.alerts.push(alert);
    
    // Emit alert
    this.emit('alert', alert);
    
    this.log(`Alert created: ${alert.type} - ${alert.message}`);
  }

  /**
   * Calculate health score for an FSM
   */
  private calculateHealthScore(health: FSMHealthStatus): number {
    let score = 100;
    
    if (!health.isHealthy) {
      score -= 50;
    }
    
    // Deduct points for errors
    score -= Math.min(health.errorCount * 2, 30);
    
    // Deduct points for old transitions
    const timeSinceLastTransition = Date.now() - health.lastTransition;
    if (timeSinceLastTransition > 300000) { // 5 minutes
      score -= 20;
    }
    
    // Deduct points for warnings
    score -= health.warnings.length * 5;
    
    return Math.max(score, 0);
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(data: {
    errorRate: number;
    avgTransitionTime: number;
    queueLength: number;
    fsmHealthScores: Map<string, number>;
  }): number {
    let score = 100;
    
    // Error rate impact (0-40 points)
    score -= data.errorRate * 40;
    
    // Transition time impact (0-30 points)
    const timeImpact = Math.min((data.avgTransitionTime / 10000) * 30, 30);
    score -= timeImpact;
    
    // Queue length impact (0-20 points)
    const queueImpact = Math.min((data.queueLength / 100) * 20, 20);
    score -= queueImpact;
    
    // FSM health impact (0-10 points)
    if (data.fsmHealthScores.size > 0) {
      const avgHealthScore = Array.from(data.fsmHealthScores.values())
        .reduce((sum, score) => sum + score, 0) / data.fsmHealthScores.size;
      score -= (100 - avgHealthScore) * 0.1;
    }
    
    return Math.max(score, 0);
  }

  /**
   * Handle state change events
   */
  private handleStateChange(data: any): void {
    this.log(`State change detected: ${data.fsmId}`);
    // Update health status if needed
    this.updateHeartbeat(data.fsmId);
  }

  /**
   * Handle transition completion
   */
  private handleTransitionComplete(data: any): void {
    this.log(`Transition completed: ${data.fsmId}`);
    this.updateHeartbeat(data.fsmId);
  }

  /**
   * Handle FSM errors
   */
  private handleFSMError(data: any): void {
    this.logError(`FSM error: ${data.fsmId}`, data.error);
    
    // Update error count
    const errorCount = this.errorCounts.get(data.fsmId) || 0;
    this.errorCounts.set(data.fsmId, errorCount + 1);
    
    // Create alert
    this.createAlert({
      type: 'fsm_unhealthy',
      severity: 'high',
      message: `FSM error: ${data.fsmId}`,
      fsmId: data.fsmId,
      metrics: { errorCount: errorCount + 1 }
    });
  }

  /**
   * Handle FSM becoming inactive
   */
  private handleFSMInactive(data: any): void {
    this.log(`FSM inactive: ${data.fsmId}`);
    
    // Update health status
    const health = this.fsmHealthStatus.get(data.fsmId);
    if (health) {
      health.isHealthy = false;
      health.warnings.push('FSM inactive');
      this.updateFSMHealth(data.fsmId, health);
    }
  }

  /**
   * Update heartbeat for an FSM
   */
  private updateHeartbeat(fsmId: string): void {
    const health = this.fsmHealthStatus.get(fsmId);
    if (health) {
      health.lastTransition = Date.now();
      health.isHealthy = true;
      this.fsmHealthStatus.set(fsmId, health);
    }
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const cutoffTime = Date.now() - this.config.retentionPeriod;
    
    // Clean up metrics history
    this.metricsHistory = this.metricsHistory.filter(m => m.timestamp > cutoffTime);
    
    // Clean up transition buffer
    this.transitionBuffer = this.transitionBuffer.filter(t => t.timestamp > cutoffTime);
    
    // Clean up old alerts
    this.alerts = this.alerts.filter(a => a.timestamp > cutoffTime);
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): RealTimeMetrics | null {
    return this.metricsHistory.length > 0 
      ? this.metricsHistory[this.metricsHistory.length - 1] 
      : null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(timeRange?: { start: number; end: number }): RealTimeMetrics[] {
    if (!timeRange) {
      return [...this.metricsHistory];
    }
    
    return this.metricsHistory.filter(m => 
      m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Get FSM health statuses
   */
  getFSMHealthStatuses(): Map<string, FSMHealthStatus> {
    return new Map(this.fsmHealthStatus);
  }

  /**
   * Generate monitoring report
   */
  generateReport(): {
    summary: {
      totalFSMs: number;
      healthyFSMs: number;
      totalTransitions: number;
      totalErrors: number;
      averagePerformanceScore: number;
    };
    alerts: PerformanceAlert[];
    topPerformers: Array<{ fsmId: string; score: number }>;
    topErrors: Array<{ fsmId: string; errors: number }>;
  } {
    const totalFSMs = this.fsmHealthStatus.size;
    const healthyFSMs = Array.from(this.fsmHealthStatus.values())
      .filter(h => h.isHealthy).length;
    
    const totalTransitions = Array.from(this.transitionCounts.values())
      .reduce((sum, count) => sum + count, 0);
    
    const totalErrors = Array.from(this.errorCounts.values())
      .reduce((sum, count) => sum + count, 0);
    
    const recentMetrics = this.metricsHistory.slice(-10);
    const averagePerformanceScore = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.performanceScore, 0) / recentMetrics.length
      : 0;
    
    // Top performers
    const latest = this.getCurrentMetrics();
    const topPerformers = latest ? Array.from(latest.fsmHealthScores.entries())
      .map(([fsmId, score]) => ({ fsmId, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) : [];
    
    // Top error producers
    const topErrors = Array.from(this.errorCounts.entries())
      .map(([fsmId, errors]) => ({ fsmId, errors }))
      .sort((a, b) => b.errors - a.errors)
      .slice(0, 5);
    
    return {
      summary: {
        totalFSMs,
        healthyFSMs,
        totalTransitions,
        totalErrors,
        averagePerformanceScore
      },
      alerts: this.getActiveAlerts(),
      topPerformers,
      topErrors
    };
  }

  /**
   * Shutdown the monitor
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    this.log('Shutting down StateTransitionMonitor');
    
    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    // Unsubscribe from hub events
    if (this.transitionHub) {
      this.transitionHub.removeAllListeners();
    }
    
    // Clear data
    this.metricsHistory = [];
    this.alerts = [];
    this.fsmHealthStatus.clear();
    this.transitionCounts.clear();
    this.errorCounts.clear();
    this.transitionBuffer = [];
    
    // Remove all listeners
    this.removeAllListeners();
    
    this.initialized = false;
    this.log('StateTransitionMonitor shutdown complete');
  }

  /**
   * Log message
   */
  private log(message: string, data?: any): void {
    console.log(`[StateTransitionMonitor] ${message}`, data || '');
  }

  /**
   * Log error
   */
  private logError(message: string, error?: any): void {
    console.error(`[StateTransitionMonitor] ERROR: ${message}`, error || '');
  }
}
