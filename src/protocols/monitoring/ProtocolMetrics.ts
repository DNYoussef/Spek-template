import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';
import { A2AMessage, AgentIdentifier } from '../a2a/A2AProtocolEngine';

export interface MetricEvent {
  timestamp: Date;
  type: 'message_sent' | 'message_received' | 'protocol_error' | 'connection_established' | 'connection_closed';
  data: any;
}

export interface PerformanceMetrics {
  totalMessages: number;
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number; // messages per second
  errorRate: number; // percentage
  availabilityRate: number; // percentage
}

export interface IProtocolMetrics {
  protocolName: string;
  performance: PerformanceMetrics;
  connections: {
    active: number;
    total: number;
    failed: number;
  };
  bandwidth: {
    bytesIn: number;
    bytesOut: number;
    averageBytesPerMessage: number;
  };
  timeSeries: TimeSeriesData[];
}

export interface AgentMetrics {
  agentId: string;
  messagesSent: number;
  messagesReceived: number;
  averageLatency: number;
  errorCount: number;
  lastActivity: Date;
  protocols: Record<string, PerformanceMetrics>;
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  metric: string;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  threshold: number;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  duration: number; // milliseconds
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
}

export interface Alert {
  id: string;
  ruleId: string;
  timestamp: Date;
  message: string;
  severity: AlertRule['severity'];
  value: number;
  threshold: number;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface MetricsConfig {
  retentionPeriod: number; // milliseconds
  aggregationInterval: number; // milliseconds
  enableRealTimeMonitoring: boolean;
  maxTimeSeriesPoints: number;
  alertingEnabled: boolean;
  enableDetailedLogging: boolean;
}

export class ProtocolMetrics extends EventEmitter {
  private logger = new Logger('ProtocolMetrics');
  private config: MetricsConfig;
  private protocolMetrics = new Map<string, IProtocolMetrics>();
  private agentMetrics = new Map<string, AgentMetrics>();
  private alertRules = new Map<string, AlertRule>();
  private activeAlerts = new Map<string, Alert>();
  private latencyHistory = new Map<string, number[]>();
  private metricEvents: MetricEvent[] = [];
  private aggregationTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;
  private startTime = Date.now();

  constructor(config?: Partial<MetricsConfig>) {
    super();
    
    this.config = {
      retentionPeriod: 86400000, // 24 hours
      aggregationInterval: 60000, // 1 minute
      enableRealTimeMonitoring: true,
      maxTimeSeriesPoints: 1440, // 24 hours at 1-minute intervals
      alertingEnabled: true,
      enableDetailedLogging: false,
      ...config
    };

    this.initializeDefaultAlerts();
    this.startAggregation();
    this.startCleanup();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Protocol Metrics', {
      retentionPeriod: this.config.retentionPeriod,
      aggregationInterval: this.config.aggregationInterval,
      alertingEnabled: this.config.alertingEnabled
    });
    
    this.emit('initialized');
  }

  recordMessageSent(data: {
    messageId: string;
    protocol: string;
    agentId?: string;
    latency: number;
    size: number;
  }): void {
    const timestamp = new Date();
    
    // Record metric event
    this.recordMetricEvent({
      timestamp,
      type: 'message_sent',
      data
    });

    // Update protocol metrics
    this.updateProtocolMetrics(data.protocol, 'sent', data.latency, data.size);
    
    // Update agent metrics
    if (data.agentId) {
      this.updateAgentMetrics(data.agentId, 'sent', data.latency, data.protocol);
    }

    // Record latency for percentile calculations
    this.recordLatency(data.protocol, data.latency);

    if (this.config.enableDetailedLogging) {
      this.logger.debug('Message sent recorded', {
        messageId: data.messageId,
        protocol: data.protocol,
        latency: data.latency,
        size: data.size
      });
    }
  }

  recordMessageReceived(data: {
    messageId: string;
    protocol: string;
    agentId?: string;
    size: number;
  }): void {
    const timestamp = new Date();
    
    this.recordMetricEvent({
      timestamp,
      type: 'message_received',
      data
    });

    this.updateProtocolMetrics(data.protocol, 'received', 0, data.size);
    
    if (data.agentId) {
      this.updateAgentMetrics(data.agentId, 'received', 0, data.protocol);
    }

    if (this.config.enableDetailedLogging) {
      this.logger.debug('Message received recorded', {
        messageId: data.messageId,
        protocol: data.protocol,
        size: data.size
      });
    }
  }

  recordProtocolError(data: {
    protocol: string;
    agentId?: string;
    error: string;
    severity: 'low' | 'medium' | 'high';
  }): void {
    const timestamp = new Date();
    
    this.recordMetricEvent({
      timestamp,
      type: 'protocol_error',
      data
    });

    // Update error counts
    const protocolMetrics = this.getOrCreateProtocolMetrics(data.protocol);
    protocolMetrics.performance.errors++;
    
    if (data.agentId) {
      const agentMetrics = this.getOrCreateAgentMetrics(data.agentId);
      agentMetrics.errorCount++;
    }

    this.logger.warn('Protocol error recorded', {
      protocol: data.protocol,
      agentId: data.agentId,
      error: data.error,
      severity: data.severity
    });

    this.emit('protocolError', {
      timestamp,
      protocol: data.protocol,
      agentId: data.agentId,
      error: data.error,
      severity: data.severity
    });
  }

  recordConnectionEvent(data: {
    protocol: string;
    agentId: string;
    event: 'established' | 'closed' | 'failed';
    metadata?: any;
  }): void {
    const timestamp = new Date();
    const eventType = data.event === 'established' ? 'connection_established' : 'connection_closed';
    
    this.recordMetricEvent({
      timestamp,
      type: eventType,
      data
    });

    const protocolMetrics = this.getOrCreateProtocolMetrics(data.protocol);
    
    switch (data.event) {
      case 'established':
        protocolMetrics.connections.active++;
        protocolMetrics.connections.total++;
        break;
      case 'closed':
        protocolMetrics.connections.active = Math.max(0, protocolMetrics.connections.active - 1);
        break;
      case 'failed':
        protocolMetrics.connections.failed++;
        break;
    }

    this.logger.debug('Connection event recorded', {
      protocol: data.protocol,
      agentId: data.agentId,
      event: data.event
    });
  }

  getProtocolMetrics(protocolName: string): IProtocolMetrics | null {
    return this.protocolMetrics.get(protocolName) || null;
  }

  getAgentMetrics(agentId: string): AgentMetrics | null {
    return this.agentMetrics.get(agentId) || null;
  }

  getAllProtocolMetrics(): Map<string, IProtocolMetrics> {
    return new Map(this.protocolMetrics);
  }

  getAllAgentMetrics(): Map<string, AgentMetrics> {
    return new Map(this.agentMetrics);
  }

  getSystemMetrics(): {
    uptime: number;
    totalProtocols: number;
    totalAgents: number;
    totalMessages: number;
    totalErrors: number;
    overallAvailability: number;
  } {
    const uptime = Date.now() - this.startTime;
    const totalProtocols = this.protocolMetrics.size;
    const totalAgents = this.agentMetrics.size;
    
    let totalMessages = 0;
    let totalErrors = 0;
    
    for (const metrics of Array.from(this.protocolMetrics.values())) {
      totalMessages += metrics.performance.totalMessages;
      totalErrors += metrics.performance.errors;
    }
    
    const overallAvailability = totalMessages > 0 
      ? ((totalMessages - totalErrors) / totalMessages) * 100
      : 100;

    return {
      uptime,
      totalProtocols,
      totalAgents,
      totalMessages,
      totalErrors,
      overallAvailability
    };
  }

  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    
    this.logger.info('Alert rule added', {
      ruleId: rule.id,
      name: rule.name,
      metric: rule.metric,
      threshold: rule.threshold,
      severity: rule.severity
    });
    
    this.emit('alertRuleAdded', rule);
  }

  removeAlertRule(ruleId: string): void {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      this.alertRules.delete(ruleId);
      
      // Resolve any active alerts for this rule
      for (const [alertId, alert] of Array.from(this.activeAlerts.entries())) {
        if (alert.ruleId === ruleId) {
          this.resolveAlert(alertId);
        }
      }
      
      this.logger.info('Alert rule removed', { ruleId, name: rule.name });
      this.emit('alertRuleRemoved', rule);
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  getAlertHistory(limit = 100): Alert[] {
    return Array.from(this.activeAlerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      
      this.logger.info('Alert resolved', {
        alertId,
        ruleId: alert.ruleId,
        duration: alert.resolvedAt.getTime() - alert.timestamp.getTime()
      });
      
      this.emit('alertResolved', alert);
    }
  }

  getMetrics() {
    return {
      protocols: Object.fromEntries(this.protocolMetrics),
      agents: Object.fromEntries(this.agentMetrics),
      system: this.getSystemMetrics(),
      alerts: {
        active: this.getActiveAlerts().length,
        total: this.activeAlerts.size,
        rules: this.alertRules.size
      },
      events: {
        total: this.metricEvents.length,
        recent: this.metricEvents.filter(e => 
          Date.now() - e.timestamp.getTime() < 3600000 // Last hour
        ).length
      }
    };
  }

  exportMetrics(format: 'json' | 'prometheus' | 'csv'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.getMetrics(), null, 2);
      case 'prometheus':
        return this.exportPrometheusMetrics();
      case 'csv':
        return this.exportCSVMetrics();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Protocol Metrics');
    
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.emit('shutdown');
  }

  private recordMetricEvent(event: MetricEvent): void {
    this.metricEvents.push(event);
    
    // Keep only recent events to prevent memory issues
    if (this.metricEvents.length > 10000) {
      this.metricEvents.splice(0, 5000);
    }
    
    if (this.config.enableRealTimeMonitoring) {
      this.emit('metricEvent', event);
    }
  }

  private updateProtocolMetrics(protocol: string, direction: 'sent' | 'received', latency: number, size: number): void {
    const metrics = this.getOrCreateProtocolMetrics(protocol);
    
    metrics.performance.totalMessages++;
    
    if (direction === 'sent') {
      metrics.performance.messagesSent++;
      
      if (latency > 0) {
        const currentAvg = metrics.performance.averageLatency;
        const totalSent = metrics.performance.messagesSent;
        metrics.performance.averageLatency = ((currentAvg * (totalSent - 1)) + latency) / totalSent;
      }
      
      metrics.bandwidth.bytesOut += size;
    } else {
      metrics.performance.messagesReceived++;
      metrics.bandwidth.bytesIn += size;
    }
    
    // Update average bytes per message
    const totalBytes = metrics.bandwidth.bytesIn + metrics.bandwidth.bytesOut;
    metrics.bandwidth.averageBytesPerMessage = totalBytes / metrics.performance.totalMessages;
    
    // Calculate throughput (messages per second over last minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentEvents = this.metricEvents.filter(e => 
      e.timestamp.getTime() > oneMinuteAgo && 
      (e.type === 'message_sent' || e.type === 'message_received') &&
      e.data.protocol === protocol
    );
    metrics.performance.throughput = recentEvents.length;
    
    // Calculate error rate
    const totalEvents = metrics.performance.totalMessages;
    const errors = metrics.performance.errors;
    metrics.performance.errorRate = totalEvents > 0 ? (errors / totalEvents) * 100 : 0;
    
    // Calculate availability rate
    metrics.performance.availabilityRate = 100 - metrics.performance.errorRate;
  }

  private updateAgentMetrics(agentId: string, direction: 'sent' | 'received', latency: number, protocol: string): void {
    const metrics = this.getOrCreateAgentMetrics(agentId);
    
    if (direction === 'sent') {
      metrics.messagesSent++;
      
      if (latency > 0) {
        const currentAvg = metrics.averageLatency;
        const totalSent = metrics.messagesSent;
        metrics.averageLatency = ((currentAvg * (totalSent - 1)) + latency) / totalSent;
      }
    } else {
      metrics.messagesReceived++;
    }
    
    metrics.lastActivity = new Date();
    
    // Update protocol-specific metrics
    if (!metrics.protocols[protocol]) {
      metrics.protocols[protocol] = this.createEmptyPerformanceMetrics();
    }
    
    const protocolMetrics = metrics.protocols[protocol];
    protocolMetrics.totalMessages++;
    
    if (direction === 'sent') {
      protocolMetrics.messagesSent++;
      if (latency > 0) {
        const currentAvg = protocolMetrics.averageLatency;
        const totalSent = protocolMetrics.messagesSent;
        protocolMetrics.averageLatency = ((currentAvg * (totalSent - 1)) + latency) / totalSent;
      }
    } else {
      protocolMetrics.messagesReceived++;
    }
  }

  private recordLatency(protocol: string, latency: number): void {
    if (!this.latencyHistory.has(protocol)) {
      this.latencyHistory.set(protocol, []);
    }
    
    const history = this.latencyHistory.get(protocol)!;
    history.push(latency);
    
    // Keep only recent latencies for percentile calculations
    if (history.length > 1000) {
      history.splice(0, 500);
    }
    
    // Update percentile metrics
    const metrics = this.getOrCreateProtocolMetrics(protocol);
    const sortedLatencies = [...history].sort((a, b) => a - b);
    
    if (sortedLatencies.length > 0) {
      const p95Index = Math.ceil(sortedLatencies.length * 0.95) - 1;
      const p99Index = Math.ceil(sortedLatencies.length * 0.99) - 1;
      
      metrics.performance.p95Latency = sortedLatencies[p95Index] || 0;
      metrics.performance.p99Latency = sortedLatencies[p99Index] || 0;
    }
  }

  private getOrCreateProtocolMetrics(protocolName: string): IProtocolMetrics {
    if (!this.protocolMetrics.has(protocolName)) {
      const metrics: IProtocolMetrics = {
        protocolName,
        performance: this.createEmptyPerformanceMetrics(),
        connections: {
          active: 0,
          total: 0,
          failed: 0
        },
        bandwidth: {
          bytesIn: 0,
          bytesOut: 0,
          averageBytesPerMessage: 0
        },
        timeSeries: []
      };
      
      this.protocolMetrics.set(protocolName, metrics);
    }
    
    return this.protocolMetrics.get(protocolName)!;
  }

  private getOrCreateAgentMetrics(agentId: string): AgentMetrics {
    if (!this.agentMetrics.has(agentId)) {
      const metrics: AgentMetrics = {
        agentId,
        messagesSent: 0,
        messagesReceived: 0,
        averageLatency: 0,
        errorCount: 0,
        lastActivity: new Date(),
        protocols: {}
      };
      
      this.agentMetrics.set(agentId, metrics);
    }
    
    return this.agentMetrics.get(agentId)!;
  }

  private createEmptyPerformanceMetrics(): PerformanceMetrics {
    return {
      totalMessages: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      throughput: 0,
      errorRate: 0,
      availabilityRate: 100
    };
  }

  private initializeDefaultAlerts(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        metric: 'errorRate',
        threshold: 5,
        operator: '>',
        duration: 300000, // 5 minutes
        severity: 'warning',
        enabled: true
      },
      {
        id: 'high_latency',
        name: 'High Latency',
        metric: 'p95Latency',
        threshold: 5000, // 5 seconds
        operator: '>',
        duration: 120000, // 2 minutes
        severity: 'warning',
        enabled: true
      },
      {
        id: 'low_availability',
        name: 'Low Availability',
        metric: 'availabilityRate',
        threshold: 95,
        operator: '<',
        duration: 600000, // 10 minutes
        severity: 'error',
        enabled: true
      }
    ];
    
    for (const rule of defaultRules) {
      this.alertRules.set(rule.id, rule);
    }
  }

  private startAggregation(): void {
    this.aggregationTimer = setInterval(() => {
      this.aggregateMetrics();
    }, this.config.aggregationInterval);
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldData();
    }, 3600000); // Every hour
  }

  private aggregateMetrics(): void {
    const timestamp = new Date();
    
    // Add time series data points for all protocols
    for (const [protocolName, metrics] of Array.from(this.protocolMetrics.entries())) {
      const timeSeriesPoint: TimeSeriesData = {
        timestamp,
        value: metrics.performance.throughput,
        metric: 'throughput'
      };
      
      metrics.timeSeries.push(timeSeriesPoint);
      
      // Keep only recent time series data
      if (metrics.timeSeries.length > this.config.maxTimeSeriesPoints) {
        metrics.timeSeries.splice(0, metrics.timeSeries.length - this.config.maxTimeSeriesPoints);
      }
    }
    
    // Check alert rules
    if (this.config.alertingEnabled) {
      this.checkAlertRules();
    }
    
    this.emit('metricsAggregated', {
      timestamp,
      protocolCount: this.protocolMetrics.size,
      agentCount: this.agentMetrics.size
    });
  }

  private cleanupOldData(): void {
    const cutoffTime = Date.now() - this.config.retentionPeriod;
    
    // Clean up old metric events
    this.metricEvents = this.metricEvents.filter(e => 
      e.timestamp.getTime() > cutoffTime
    );
    
    // Clean up old latency history
    for (const [protocol, history] of Array.from(this.latencyHistory.entries())) {
      // Keep reasonable amount of recent data for percentile calculations
      if (history.length > 1000) {
        history.splice(0, history.length - 1000);
      }
    }
    
    this.logger.debug('Old metrics data cleaned up', {
      cutoffTime: new Date(cutoffTime),
      remainingEvents: this.metricEvents.length
    });
  }

  private checkAlertRules(): void {
    for (const rule of Array.from(this.alertRules.values())) {
      if (!rule.enabled) continue;
      
      for (const [protocolName, metrics] of Array.from(this.protocolMetrics.entries())) {
        const metricValue = this.getMetricValue(metrics.performance, rule.metric);
        
        if (this.evaluateAlertCondition(metricValue, rule.threshold, rule.operator)) {
          this.triggerAlert(rule, protocolName, metricValue);
        }
      }
    }
  }

  private getMetricValue(performance: PerformanceMetrics, metricName: string): number {
    switch (metricName) {
      case 'errorRate': return performance.errorRate;
      case 'averageLatency': return performance.averageLatency;
      case 'p95Latency': return performance.p95Latency;
      case 'p99Latency': return performance.p99Latency;
      case 'throughput': return performance.throughput;
      case 'availabilityRate': return performance.availabilityRate;
      default: return 0;
    }
  }

  private evaluateAlertCondition(value: number, threshold: number, operator: AlertRule['operator']): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      case '!=': return value !== threshold;
      default: return false;
    }
  }

  private triggerAlert(rule: AlertRule, protocolName: string, value: number): void {
    const alertId = `${rule.id}_${protocolName}_${Date.now()}`;
    
    // Check if there's already an active alert for this rule and protocol
    const existingAlert = Array.from(this.activeAlerts.values())
      .find(alert => 
        alert.ruleId === rule.id && 
        !alert.resolved && 
        alert.message.includes(protocolName)
      );
    
    if (existingAlert) {
      return; // Don't create duplicate alerts
    }
    
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      timestamp: new Date(),
      message: `${rule.name}: ${protocolName} protocol ${rule.metric} is ${value} (threshold: ${rule.threshold})`,
      severity: rule.severity,
      value,
      threshold: rule.threshold,
      resolved: false
    };
    
    this.activeAlerts.set(alertId, alert);
    
    this.logger.warn('Alert triggered', {
      alertId,
      ruleName: rule.name,
      protocol: protocolName,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      severity: rule.severity
    });
    
    this.emit('alertTriggered', alert);
  }

  private exportPrometheusMetrics(): string {
    let output = '';
    
    for (const [protocolName, metrics] of Array.from(this.protocolMetrics.entries())) {
      const labels = `{protocol="${protocolName}"}`;
      
      output += `# HELP a2a_messages_total Total number of messages\n`;
      output += `# TYPE a2a_messages_total counter\n`;
      output += `a2a_messages_total${labels} ${metrics.performance.totalMessages}\n\n`;
      
      output += `# HELP a2a_latency_average Average message latency in milliseconds\n`;
      output += `# TYPE a2a_latency_average gauge\n`;
      output += `a2a_latency_average${labels} ${metrics.performance.averageLatency}\n\n`;
      
      output += `# HELP a2a_error_rate Error rate percentage\n`;
      output += `# TYPE a2a_error_rate gauge\n`;
      output += `a2a_error_rate${labels} ${metrics.performance.errorRate}\n\n`;
    }
    
    return output;
  }

  private exportCSVMetrics(): string {
    const headers = 'Timestamp,Protocol,Messages,Errors,AvgLatency,P95Latency,Throughput,ErrorRate\n';
    
    let rows = '';
    const timestamp = new Date().toISOString();
    
    for (const [protocolName, metrics] of Array.from(this.protocolMetrics.entries())) {
      rows += `${timestamp},${protocolName},${metrics.performance.totalMessages},${metrics.performance.errors},${metrics.performance.averageLatency},${metrics.performance.p95Latency},${metrics.performance.throughput},${metrics.performance.errorRate}\n`;
    }
    
    return headers + rows;
  }
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-01-27T14:45:38-05:00 | agent@claude-3-5-sonnet-20241022 | Created Protocol Metrics with real-time monitoring and alerting | ProtocolMetrics.ts | OK | Comprehensive metrics system with time series, alerts, and multi-format export | 0.00 | a8d5c3f |

 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: a2a-protocol-phase8-010
 * - inputs: ["Protocol Metrics requirements"]
 * - tools_used: ["MultiEdit"]
 * - versions: {"model":"claude-3-5-sonnet-20241022","prompt":"phase8-metrics"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */