import { EventEmitter } from 'events';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    processes: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    cached: number;
    available: number;
    usagePercent: number;
  };
  disk: {
    reads: number;
    writes: number;
    readBytes: number;
    writeBytes: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
    packetsReceived: number;
    packetsSent: number;
  };
  process: {
    pid: number;
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    uptime: number;
    handles: number;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  duration: number; // How long condition must persist (ms)
  enabled: boolean;
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'log' | 'email' | 'webhook' | 'slack';
  config: any;
}

export interface Alert {
  id: string;
  ruleId: string;
  timestamp: number;
  metric: string;
  value: number;
  threshold: number;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved?: boolean;
  resolvedAt?: number;
}

export class RealTimeMonitor extends EventEmitter {
  private isMonitoring = false;
  private monitoringInterval = 1000; // 1 second
  private intervalId?: NodeJS.Timeout;
  private metrics: SystemMetrics[] = [];
  private maxMetricsHistory = 1000;
  private alertRules: AlertRule[] = [];
  private activeAlerts: Map<string, Alert> = new Map();
  private alertCounters: Map<string, number> = new Map();
  private lastCpuUsage?: NodeJS.CpuUsage;
  private lastDiskStats?: any;
  private lastNetworkStats?: any;

  constructor(interval = 1000) {
    super();
    this.monitoringInterval = interval;
    this.initializeDefaultAlertRules();
  }

  private initializeDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'high-cpu',
        name: 'High CPU Usage',
        metric: 'cpu.usage',
        threshold: 80,
        operator: 'gt',
        duration: 5000,
        enabled: true,
        actions: [{ type: 'log', config: {} }]
      },
      {
        id: 'high-memory',
        name: 'High Memory Usage',
        metric: 'memory.usagePercent',
        threshold: 85,
        operator: 'gt',
        duration: 10000,
        enabled: true,
        actions: [{ type: 'log', config: {} }]
      },
      {
        id: 'low-memory',
        name: 'Low Available Memory',
        metric: 'memory.available',
        threshold: 500 * 1024 * 1024, // 500MB
        operator: 'lt',
        duration: 15000,
        enabled: true,
        actions: [{ type: 'log', config: {} }]
      }
    ];
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      throw new Error('Monitoring is already active');
    }

    this.isMonitoring = true;
    this.lastCpuUsage = process.cpuUsage();

    this.emit('monitoringStarted', {
      interval: this.monitoringInterval,
      timestamp: Date.now()
    });

    this.intervalId = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.metrics.push(metrics);

        // Maintain history size
        if (this.metrics.length > this.maxMetricsHistory) {
          this.metrics.shift();
        }

        this.emit('metrics', metrics);
        await this.checkAlerts(metrics);
      } catch (error) {
        this.emit('error', error);
      }
    }, this.monitoringInterval);
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.emit('monitoringStopped', {
      timestamp: Date.now(),
      totalMetrics: this.metrics.length
    });
  }

  private async collectMetrics(): Promise<SystemMetrics> {
    const timestamp = Date.now();

    // CPU metrics
    const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);
    const cpuPercent = ((currentCpuUsage.user + currentCpuUsage.system) / 1000000) * 100 / (this.monitoringInterval / 1000);
    this.lastCpuUsage = process.cpuUsage();

    // Memory metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const processMemory = process.memoryUsage();

    // Disk metrics (simplified - in a real implementation, you'd use platform-specific APIs)
    const diskStats = await this.getDiskStats();

    // Network metrics (simplified - in a real implementation, you'd use platform-specific APIs)
    const networkStats = await this.getNetworkStats();

    const metrics: SystemMetrics = {
      timestamp,
      cpu: {
        usage: Math.min(Math.max(cpuPercent, 0), 100),
        loadAverage: os.loadavg(),
        processes: 0 // Would need platform-specific implementation
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        cached: 0, // Would need platform-specific implementation
        available: freeMemory,
        usagePercent: (usedMemory / totalMemory) * 100
      },
      disk: diskStats,
      network: networkStats,
      process: {
        pid: process.pid,
        memory: processMemory,
        cpu: currentCpuUsage,
        uptime: process.uptime(),
        handles: (process as any)._getActiveHandles?.()?.length || 0
      }
    };

    return metrics;
  }

  private async getDiskStats(): Promise<any> {
    // Simplified disk stats - in production, use platform-specific APIs
    const stats = {
      reads: 0,
      writes: 0,
      readBytes: 0,
      writeBytes: 0
    };

    try {
      if (process.platform === 'linux') {
        // Read /proc/diskstats on Linux
        const diskstats = await fs.readFile('/proc/diskstats', 'utf-8').catch(() => '');
        // Parse diskstats... (simplified)
      } else if (process.platform === 'win32') {
        // Use Windows performance counters... (simplified)
      } else if (process.platform === 'darwin') {
        // Use macOS system APIs... (simplified)
      }
    } catch (error) {
      // Fallback to zeros if platform-specific implementation fails
    }

    return stats;
  }

  private async getNetworkStats(): Promise<any> {
    // Simplified network stats - in production, use platform-specific APIs
    const stats = {
      bytesReceived: 0,
      bytesSent: 0,
      packetsReceived: 0,
      packetsSent: 0
    };

    try {
      if (process.platform === 'linux') {
        // Read /proc/net/dev on Linux
        const netdev = await fs.readFile('/proc/net/dev', 'utf-8').catch(() => '');
        // Parse network device stats... (simplified)
      } else if (process.platform === 'win32') {
        // Use Windows network performance counters... (simplified)
      } else if (process.platform === 'darwin') {
        // Use macOS network APIs... (simplified)
      }
    } catch (error) {
      // Fallback to zeros if platform-specific implementation fails
    }

    return stats;
  }

  private async checkAlerts(metrics: SystemMetrics): Promise<void> {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      const value = this.getMetricValue(metrics, rule.metric);
      if (value === undefined) continue;

      const conditionMet = this.evaluateCondition(value, rule.threshold, rule.operator);

      if (conditionMet) {
        const countKey = rule.id;
        const currentCount = this.alertCounters.get(countKey) || 0;
        this.alertCounters.set(countKey, currentCount + this.monitoringInterval);

        if (currentCount >= rule.duration && !this.activeAlerts.has(rule.id)) {
          await this.triggerAlert(rule, value, metrics);
        }
      } else {
        // Reset counter if condition is not met
        this.alertCounters.set(rule.id, 0);

        // Resolve active alert if exists
        const activeAlert = this.activeAlerts.get(rule.id);
        if (activeAlert) {
          await this.resolveAlert(activeAlert);
        }
      }
    }
  }

  private getMetricValue(metrics: SystemMetrics, metricPath: string): number | undefined {
    const parts = metricPath.split('.');
    let value: any = metrics;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return typeof value === 'number' ? value : undefined;
  }

  private evaluateCondition(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }

  private async triggerAlert(rule: AlertRule, value: number, metrics: SystemMetrics): Promise<void> {
    const alert: Alert = {
      id: `${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      timestamp: Date.now(),
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      message: `${rule.name}: ${rule.metric} is ${value.toFixed(2)} (threshold: ${rule.threshold})`,
      severity: this.calculateSeverity(value, rule.threshold, rule.operator)
    };

    this.activeAlerts.set(rule.id, alert);
    this.emit('alert', alert);

    // Execute alert actions
    for (const action of rule.actions) {
      await this.executeAlertAction(action, alert, metrics);
    }
  }

  private async resolveAlert(alert: Alert): Promise<void> {
    alert.resolved = true;
    alert.resolvedAt = Date.now();
    this.activeAlerts.delete(alert.ruleId);
    this.emit('alertResolved', alert);
  }

  private calculateSeverity(value: number, threshold: number, operator: string): Alert['severity'] {
    const ratio = Math.abs(value - threshold) / threshold;

    if (ratio > 0.5) return 'critical';
    if (ratio > 0.3) return 'high';
    if (ratio > 0.1) return 'medium';
    return 'low';
  }

  private async executeAlertAction(action: AlertAction, alert: Alert, metrics: SystemMetrics): Promise<void> {
    try {
      switch (action.type) {
        case 'log':
          console.log(`[ALERT] ${alert.message}`);
          break;
        case 'webhook':
          // Implement webhook notification
          break;
        case 'email':
          // Implement email notification
          break;
        case 'slack':
          // Implement Slack notification
          break;
      }
    } catch (error) {
      this.emit('actionError', { action, alert, error });
    }
  }

  getMetrics(limit?: number): SystemMetrics[] {
    if (limit) {
      return this.metrics.slice(-limit);
    }
    return [...this.metrics];
  }

  getCurrentMetrics(): SystemMetrics | undefined {
    return this.metrics[this.metrics.length - 1];
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
    this.emit('alertRuleAdded', rule);
  }

  removeAlertRule(ruleId: string): boolean {
    const index = this.alertRules.findIndex(rule => rule.id === ruleId);
    if (index !== -1) {
      const rule = this.alertRules.splice(index, 1)[0];
      this.emit('alertRuleRemoved', rule);
      return true;
    }
    return false;
  }

  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
      this.emit('alertRuleUpdated', rule);
      return true;
    }
    return false;
  }

  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  async saveMetrics(filePath: string): Promise<void> {
    const data = {
      timestamp: Date.now(),
      monitoringInterval: this.monitoringInterval,
      metrics: this.metrics,
      alertRules: this.alertRules
    };

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    this.emit('metricsSaved', { filePath, count: this.metrics.length });
  }

  async loadMetrics(filePath: string): Promise<void> {
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    this.metrics = data.metrics || [];
    this.alertRules = data.alertRules || this.alertRules;
    this.emit('metricsLoaded', { filePath, count: this.metrics.length });
  }

  clearMetrics(): void {
    this.metrics = [];
    this.activeAlerts.clear();
    this.alertCounters.clear();
    this.emit('metricsCleared');
  }

  generateMetricsReport(timeRange?: { start: number; end: number }): string {
    let filteredMetrics = this.metrics;

    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filteredMetrics.length === 0) {
      return 'No metrics data available for the specified time range.';
    }

    const startTime = new Date(filteredMetrics[0].timestamp);
    const endTime = new Date(filteredMetrics[filteredMetrics.length - 1].timestamp);

    let report = `System Performance Report\n`;
    report += `Period: ${startTime.toISOString()} to ${endTime.toISOString()}\n`;
    report += `Duration: ${((endTime.getTime() - startTime.getTime()) / 1000 / 60).toFixed(2)} minutes\n`;
    report += `Data Points: ${filteredMetrics.length}\n\n`;

    // CPU statistics
    const cpuUsages = filteredMetrics.map(m => m.cpu.usage);
    report += `CPU Usage:\n`;
    report += `  Average: ${(cpuUsages.reduce((sum, cpu) => sum + cpu, 0) / cpuUsages.length).toFixed(2)}%\n`;
    report += `  Maximum: ${Math.max(...cpuUsages).toFixed(2)}%\n`;
    report += `  Minimum: ${Math.min(...cpuUsages).toFixed(2)}%\n\n`;

    // Memory statistics
    const memoryUsages = filteredMetrics.map(m => m.memory.usagePercent);
    report += `Memory Usage:\n`;
    report += `  Average: ${(memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length).toFixed(2)}%\n`;
    report += `  Maximum: ${Math.max(...memoryUsages).toFixed(2)}%\n`;
    report += `  Minimum: ${Math.min(...memoryUsages).toFixed(2)}%\n\n`;

    // Process statistics
    const processMemories = filteredMetrics.map(m => m.process.memory.heapUsed);
    report += `Process Memory (Heap Used):\n`;
    report += `  Average: ${(processMemories.reduce((sum, mem) => sum + mem, 0) / processMemories.length / 1024 / 1024).toFixed(2)} MB\n`;
    report += `  Maximum: ${(Math.max(...processMemories) / 1024 / 1024).toFixed(2)} MB\n`;
    report += `  Minimum: ${(Math.min(...processMemories) / 1024 / 1024).toFixed(2)} MB\n\n`;

    return report;
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  getMonitoringInterval(): number {
    return this.monitoringInterval;
  }

  setMonitoringInterval(interval: number): void {
    this.monitoringInterval = interval;
    if (this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }
}