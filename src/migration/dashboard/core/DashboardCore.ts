/**
 * Dashboard Core - Core business logic
 * NASA Rule 10 Compliant: <50 lines per function
 */

import { EventEmitter } from 'events';
import { DashboardTypes } from '~types/DashboardTypes';
import { MigrationMonitor, MigrationMetrics, MigrationHealthCheck } from '../../monitoring/MigrationMonitor';
import { AlertManager, Alert } from '../../alerting/AlertManager';

export class DashboardCore extends EventEmitter {
  private monitor: MigrationMonitor;
  private alertManager: AlertManager;
  private configuration: DashboardTypes.DashboardConfiguration;
  private layouts = new Map<string, DashboardTypes.DashboardLayout>();
  private activeLayout: DashboardTypes.DashboardLayout | null = null;
  private dashboardData = new Map<string, DashboardTypes.DashboardData[]>();
  private refreshTimers = new Map<string, NodeJS.Timer>();

  constructor(
    monitor: MigrationMonitor,
    alertManager: AlertManager,
    configuration: DashboardTypes.DashboardConfiguration
  ) {
    super();
    this.monitor = monitor;
    this.alertManager = alertManager;
    this.configuration = configuration;
    this.initializeEventListeners();
    this.createDefaultLayout();
  }

  private initializeEventListeners(): void {
    this.monitor.on('metricsCollected', this.handleMetricsCollected.bind(this));
    this.monitor.on('healthChecksCompleted', this.handleHealthChecks.bind(this));
    this.alertManager.on('alertCreated', this.handleAlertCreated.bind(this));
    this.alertManager.on('alertResolved', this.handleAlertResolved.bind(this));
  }

  private handleMetricsCollected(event: { migrationId: string; metrics: MigrationMetrics }): void {
    const healthChecks = this.monitor.getHealthStatus(event.migrationId);
    const alerts = this.alertManager.getAlertsByMigration(event.migrationId);

    const dashboardData: DashboardTypes.DashboardData = {
      timestamp: new Date(),
      migrationId: event.migrationId,
      metrics: event.metrics,
      healthChecks,
      alerts,
      aggregatedMetrics: {},
      customData: {}
    };

    this.storeDashboardData(event.migrationId, dashboardData);
    this.emit('dashboardDataUpdated', { migrationId: event.migrationId, data: dashboardData });
  }

  private handleHealthChecks(event: { migrationId: string; healthChecks: MigrationHealthCheck[] }): void {
    this.emit('healthStatusUpdated', event);
  }

  private handleAlertCreated(alert: Alert): void {
    this.emit('alertCreated', alert);
  }

  private handleAlertResolved(event: { alert: Alert }): void {
    this.emit('alertResolved', event.alert);
  }

  private createDefaultLayout(): void {
    const defaultLayout = this.buildDefaultLayout();
    this.layouts.set(defaultLayout.id, defaultLayout);
    this.activeLayout = defaultLayout;
  }

  private buildDefaultLayout(): DashboardTypes.DashboardLayout {
    return {
      id: 'default',
      name: 'Default Layout',
      description: 'Standard migration monitoring layout',
      widgets: this.createDefaultWidgets(),
      defaultLayout: true,
      createdBy: 'system',
      createdAt: new Date(),
      lastModified: new Date(),
      tags: ['default', 'monitoring']
    };
  }

  private createDefaultWidgets(): DashboardTypes.DashboardWidget[] {
    return [
      this.createProgressWidget(),
      this.createSystemOverviewWidget(),
      this.createAlertSummaryWidget(),
      this.createHealthStatusWidget(),
      this.createThroughputWidget()
    ];
  }

  private createProgressWidget(): DashboardTypes.DashboardWidget {
    return {
      id: 'migration_progress',
      type: 'migration_progress',
      title: 'Migration Progress',
      position: { x: 0, y: 0, width: 6, height: 4 },
      configuration: {},
      refreshIntervalMs: 5000,
      enabled: true,
      permissions: ['read']
    };
  }

  private createSystemOverviewWidget(): DashboardTypes.DashboardWidget {
    return {
      id: 'system_overview',
      type: 'system_overview',
      title: 'System Overview',
      position: { x: 6, y: 0, width: 6, height: 4 },
      configuration: {},
      refreshIntervalMs: 10000,
      enabled: true,
      permissions: ['read']
    };
  }

  private createAlertSummaryWidget(): DashboardTypes.DashboardWidget {
    return {
      id: 'alert_summary',
      type: 'alert_summary',
      title: 'Alert Summary',
      position: { x: 0, y: 4, width: 4, height: 4 },
      configuration: {},
      refreshIntervalMs: 15000,
      enabled: true,
      permissions: ['read']
    };
  }

  private createHealthStatusWidget(): DashboardTypes.DashboardWidget {
    return {
      id: 'health_status',
      type: 'health_status',
      title: 'Health Status',
      position: { x: 4, y: 4, width: 4, height: 4 },
      configuration: {},
      refreshIntervalMs: 10000,
      enabled: true,
      permissions: ['read']
    };
  }

  private createThroughputWidget(): DashboardTypes.DashboardWidget {
    return {
      id: 'throughput_gauge',
      type: 'throughput_gauge',
      title: 'Throughput',
      position: { x: 8, y: 4, width: 4, height: 4 },
      configuration: { maxThroughput: 1000 },
      refreshIntervalMs: 5000,
      enabled: true,
      permissions: ['read']
    };
  }

  private storeDashboardData(migrationId: string, data: DashboardTypes.DashboardData): void {
    this.ensureDataArray(migrationId);
    const dataArray = this.dashboardData.get(migrationId)!;
    dataArray.push(data);
    this.enforceDataRetention(migrationId, dataArray);
  }

  private ensureDataArray(migrationId: string): void {
    if (!this.dashboardData.has(migrationId)) {
      this.dashboardData.set(migrationId, []);
    }
  }

  private enforceDataRetention(migrationId: string, dataArray: DashboardTypes.DashboardData[]): void {
    const retentionTimestamp = this.calculateRetentionTimestamp();
    const filteredData = dataArray.filter(d => d.timestamp >= retentionTimestamp);

    if (filteredData.length > this.configuration.maxDataPoints) {
      filteredData.splice(0, filteredData.length - this.configuration.maxDataPoints);
    }

    this.dashboardData.set(migrationId, filteredData);
  }

  private calculateRetentionTimestamp(): Date {
    const retentionMs = this.configuration.retentionDays * 24 * 60 * 60 * 1000;
    return new Date(Date.now() - retentionMs);
  }

  // Public API
  createLayout(layout: Omit<DashboardTypes.DashboardLayout, 'id' | 'createdAt' | 'lastModified'>): string {
    const id = this.generateLayoutId();
    const newLayout = this.buildNewLayout(layout, id);
    this.layouts.set(id, newLayout);
    this.emit('layoutCreated', newLayout);
    return id;
  }

  private generateLayoutId(): string {
    return `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private buildNewLayout(
    layout: Omit<DashboardTypes.DashboardLayout, 'id' | 'createdAt' | 'lastModified'>,
    id: string
  ): DashboardTypes.DashboardLayout {
    return {
      ...layout,
      id,
      createdAt: new Date(),
      lastModified: new Date()
    };
  }

  updateLayout(layoutId: string, updates: Partial<DashboardTypes.DashboardLayout>): boolean {
    const layout = this.layouts.get(layoutId);
    if (!layout) return false;

    const updatedLayout = this.mergeLayoutUpdates(layout, updates);
    this.layouts.set(layoutId, updatedLayout);
    this.updateActiveLayoutIfCurrent(layoutId, updatedLayout);
    this.emit('layoutUpdated', updatedLayout);
    return true;
  }

  private mergeLayoutUpdates(
    layout: DashboardTypes.DashboardLayout,
    updates: Partial<DashboardTypes.DashboardLayout>
  ): DashboardTypes.DashboardLayout {
    return {
      ...layout,
      ...updates,
      lastModified: new Date()
    };
  }

  private updateActiveLayoutIfCurrent(layoutId: string, updatedLayout: DashboardTypes.DashboardLayout): void {
    if (this.activeLayout?.id === layoutId) {
      this.activeLayout = updatedLayout;
    }
  }

  deleteLayout(layoutId: string): boolean {
    const layout = this.layouts.get(layoutId);
    if (!layout || layout.defaultLayout) return false;

    this.layouts.delete(layoutId);
    this.resetActiveLayoutIfDeleted(layoutId);
    this.emit('layoutDeleted', { layoutId });
    return true;
  }

  private resetActiveLayoutIfDeleted(layoutId: string): void {
    if (this.activeLayout?.id === layoutId) {
      this.activeLayout = this.layouts.get('default') || null;
    }
  }

  setActiveLayout(layoutId: string): boolean {
    const layout = this.layouts.get(layoutId);
    if (!layout) return false;

    this.activeLayout = layout;
    this.emit('activeLayoutChanged', layout);
    return true;
  }

  getLayouts(): DashboardTypes.DashboardLayout[] {
    return Array.from(this.layouts.values());
  }

  getActiveLayout(): DashboardTypes.DashboardLayout | null {
    return this.activeLayout;
  }

  getDashboardData(migrationId: string): DashboardTypes.DashboardData[] {
    return this.dashboardData.get(migrationId) || [];
  }

  getAllDashboardData(): DashboardTypes.DashboardData[] {
    const allData: DashboardTypes.DashboardData[] = [];
    for (const data of this.dashboardData.values()) {
      allData.push(...data);
    }
    return allData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  getConfiguration(): DashboardTypes.DashboardConfiguration {
    return { ...this.configuration };
  }

  updateConfiguration(updates: Partial<DashboardTypes.DashboardConfiguration>): void {
    this.configuration = { ...this.configuration, ...updates };
    this.emit('configurationUpdated', this.configuration);
  }

  startAutoRefresh(): void {
    if (!this.configuration.autoRefresh) return;

    const timer = setInterval(() => {
      this.emit('autoRefresh');
    }, this.configuration.refreshIntervalMs);

    this.refreshTimers.set('global', timer);
  }

  stopAutoRefresh(): void {
    const timer = this.refreshTimers.get('global');
    if (timer) {
      clearInterval(timer);
      this.refreshTimers.delete('global');
    }
  }

  destroy(): void {
    this.clearAllTimers();
    this.clearAllData();
    this.removeAllListeners();
  }

  private clearAllTimers(): void {
    for (const timer of this.refreshTimers.values()) {
      clearInterval(timer);
    }
    this.refreshTimers.clear();
  }

  private clearAllData(): void {
    this.dashboardData.clear();
    this.layouts.clear();
    this.activeLayout = null;
  }
}