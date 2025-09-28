/**
 * Dashboard Facade - Unified interface for dashboard operations
 * NASA Rule 10 Compliant: Coordinates between FSM, Core, and Components
 */

import { EventEmitter } from 'events';
import { DashboardCore } from '../core/DashboardCore';
import { DashboardStateMachine } from '../fsm/DashboardStateMachine';
import { DashboardTypes } from '../types/DashboardTypes';
import { WidgetRenderer } from '../renderers/WidgetRenderer';
import { DashboardDataAggregator } from '../aggregators/DashboardDataAggregator';
import { DashboardExporter } from '../exporters/DashboardExporter';
import { MigrationMonitor } from '../../monitoring/MigrationMonitor';
import { AlertManager } from '../../alerting/AlertManager';

export class DashboardFacade extends EventEmitter {
  private core: DashboardCore;
  private fsm: DashboardStateMachine;
  private renderer: WidgetRenderer;
  private aggregator: DashboardDataAggregator;
  private exporter: DashboardExporter;

  constructor(
    monitor: MigrationMonitor,
    alertManager: AlertManager,
    configuration: DashboardTypes.DashboardConfiguration
  ) {
    super();
    this.core = new DashboardCore(monitor, alertManager, configuration);
    this.fsm = new DashboardStateMachine({ configuration });
    this.renderer = new WidgetRenderer();
    this.aggregator = new DashboardDataAggregator();
    this.exporter = new DashboardExporter();

    this.initializeFacade();
  }

  private initializeFacade(): void {
    this.setupCoreEventForwarding();
    this.initializeDashboard();
  }

  private setupCoreEventForwarding(): void {
    this.core.on('dashboardDataUpdated', this.handleDataUpdated.bind(this));
    this.core.on('healthStatusUpdated', this.handleHealthUpdate.bind(this));
    this.core.on('alertCreated', this.handleAlertCreated.bind(this));
    this.core.on('alertResolved', this.handleAlertResolved.bind(this));
    this.core.on('layoutCreated', this.handleLayoutCreated.bind(this));
    this.core.on('layoutUpdated', this.handleLayoutUpdated.bind(this));
    this.core.on('layoutDeleted', this.handleLayoutDeleted.bind(this));
    this.core.on('activeLayoutChanged', this.handleActiveLayoutChanged.bind(this));
    this.core.on('configurationUpdated', this.handleConfigurationUpdated.bind(this));
    this.core.on('autoRefresh', this.handleAutoRefresh.bind(this));
  }

  private initializeDashboard(): void {
    this.fsm.transition(DashboardTypes.DashboardEvent.INITIALIZE);
    this.loadInitialData();
  }

  private loadInitialData(): void {
    try {
      this.fsm.transition(DashboardTypes.DashboardEvent.LOAD_DATA);
      this.updateFSMContext();
      this.fsm.transition(DashboardTypes.DashboardEvent.DATA_LOADED);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private updateFSMContext(): void {
    const layouts = this.core.getLayouts();
    const activeLayout = this.core.getActiveLayout();
    const configuration = this.core.getConfiguration();

    this.fsm.updateContext({
      currentLayout: activeLayout,
      activeWidgets: activeLayout?.widgets || [],
      configuration
    });
  }

  // Event Handlers
  private handleDataUpdated(event: { migrationId: string; data: DashboardTypes.DashboardData }): void {
    this.updateDataCache(event.migrationId, event.data);
    this.emit('dashboardDataUpdated', event);

    if (this.fsm.isInState(DashboardTypes.DashboardState.REFRESHING)) {
      this.fsm.transition(DashboardTypes.DashboardEvent.DATA_LOADED);
    }
  }

  private updateDataCache(migrationId: string, data: DashboardTypes.DashboardData): void {
    const context = this.fsm.getContext();
    const existingData = context.dataCache.get(migrationId) || [];
    existingData.push(data);
    context.dataCache.set(migrationId, existingData);
  }

  private handleHealthUpdate(event: any): void {
    this.emit('healthStatusUpdated', event);
  }

  private handleAlertCreated(alert: any): void {
    this.emit('alertCreated', alert);
  }

  private handleAlertResolved(alert: any): void {
    this.emit('alertResolved', alert);
  }

  private handleLayoutCreated(layout: DashboardTypes.DashboardLayout): void {
    this.updateFSMContext();
    this.emit('layoutCreated', layout);
  }

  private handleLayoutUpdated(layout: DashboardTypes.DashboardLayout): void {
    this.updateFSMContext();
    this.emit('layoutUpdated', layout);
  }

  private handleLayoutDeleted(event: { layoutId: string }): void {
    this.updateFSMContext();
    this.emit('layoutDeleted', event);
  }

  private handleActiveLayoutChanged(layout: DashboardTypes.DashboardLayout): void {
    this.updateFSMContext();
    this.emit('activeLayoutChanged', layout);
  }

  private handleConfigurationUpdated(configuration: DashboardTypes.DashboardConfiguration): void {
    this.fsm.updateContext({ configuration });
    this.emit('configurationUpdated', configuration);
  }

  private handleAutoRefresh(): void {
    if (this.fsm.canTransition(DashboardTypes.DashboardEvent.REFRESH)) {
      this.fsm.transition(DashboardTypes.DashboardEvent.REFRESH);
      this.refreshDashboardData();
    }
  }

  private refreshDashboardData(): void {
    try {
      // Refresh logic here
      this.fsm.transition(DashboardTypes.DashboardEvent.DATA_LOADED);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private handleError(error: Error): void {
    this.fsm.setError(error);
    this.emit('error', error);
  }

  // Public API - FSM State Management
  getCurrentState(): string {
    return this.fsm.getCurrentState();
  }

  getViewState(): string {
    return this.fsm.getViewState();
  }

  setViewState(viewState: DashboardTypes.ViewState): void {
    this.fsm.setViewState(viewState);
  }

  transitTo(state: string, event?: string): boolean {
    if (event) {
      const dashboardEvent = event as DashboardTypes.DashboardEvent;
      return this.fsm.transition(dashboardEvent);
    }
    return false;
  }

  canTransition(event: string): boolean {
    const dashboardEvent = event as DashboardTypes.DashboardEvent;
    return this.fsm.canTransition(dashboardEvent);
  }

  getValidEvents(): string[] {
    return this.fsm.getValidEvents().map(e => e.toString());
  }

  // Public API - Layout Management
  createLayout(layout: Omit<DashboardTypes.DashboardLayout, 'id' | 'createdAt' | 'lastModified'>): string {
    if (!this.validateLayoutOperation()) return '';
    return this.core.createLayout(layout);
  }

  updateLayout(layoutId: string, updates: Partial<DashboardTypes.DashboardLayout>): boolean {
    if (!this.validateLayoutOperation()) return false;
    return this.core.updateLayout(layoutId, updates);
  }

  deleteLayout(layoutId: string): boolean {
    if (!this.validateLayoutOperation()) return false;
    return this.core.deleteLayout(layoutId);
  }

  setActiveLayout(layoutId: string): boolean {
    const result = this.core.setActiveLayout(layoutId);
    if (result) {
      this.updateFSMContext();
    }
    return result;
  }

  private validateLayoutOperation(): boolean {
    return !this.fsm.isInState(DashboardTypes.DashboardState.ERROR) &&
           !this.fsm.isInState(DashboardTypes.DashboardState.CLEANUP);
  }

  // Public API - Widget Management
  addWidget(layoutId: string, widget: DashboardTypes.DashboardWidget): boolean {
    const layout = this.core.getLayouts().find(l => l.id === layoutId);
    if (!layout) return false;

    layout.widgets.push(widget);
    return this.core.updateLayout(layoutId, layout);
  }

  updateWidget(layoutId: string, widgetId: string, updates: Partial<DashboardTypes.DashboardWidget>): boolean {
    const layout = this.core.getLayouts().find(l => l.id === layoutId);
    if (!layout) return false;

    const widgetIndex = layout.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) return false;

    layout.widgets[widgetIndex] = { ...layout.widgets[widgetIndex], ...updates };
    return this.core.updateLayout(layoutId, layout);
  }

  removeWidget(layoutId: string, widgetId: string): boolean {
    const layout = this.core.getLayouts().find(l => l.id === layoutId);
    if (!layout) return false;

    const initialLength = layout.widgets.length;
    layout.widgets = layout.widgets.filter(w => w.id !== widgetId);

    if (layout.widgets.length === initialLength) return false;
    return this.core.updateLayout(layoutId, layout);
  }

  renderWidget(widgetId: string, migrationId?: string): any {
    if (!this.fsm.isInState(DashboardTypes.DashboardState.DISPLAYING)) {
      return { error: 'Dashboard not in displaying state' };
    }

    const activeLayout = this.core.getActiveLayout();
    if (!activeLayout) return null;

    const widget = activeLayout.widgets.find(w => w.id === widgetId);
    if (!widget || !widget.enabled) return null;

    const data = this.getLatestDashboardData(migrationId);
    if (!data) return null;

    return this.renderWidgetByType(widget, data);
  }

  private getLatestDashboardData(migrationId?: string): DashboardTypes.DashboardData | null {
    if (migrationId) {
      const data = this.core.getDashboardData(migrationId);
      return data.length > 0 ? data[data.length - 1] : null;
    }

    const allData = this.core.getAllDashboardData();
    return allData.length > 0 ? allData[allData.length - 1] : null;
  }

  private renderWidgetByType(widget: DashboardTypes.DashboardWidget, data: DashboardTypes.DashboardData): any {
    switch (widget.type) {
      case 'metrics_chart':
        return this.renderer.renderMetricsChart(widget, data);
      case 'health_status':
        return this.renderer.renderHealthStatus(widget, data);
      case 'alert_summary':
        return this.renderer.renderAlertSummary(widget, data);
      case 'migration_progress':
        return this.renderer.renderMigrationProgress(widget, data);
      case 'system_overview':
        return this.renderer.renderSystemOverview(widget, data);
      case 'throughput_gauge':
        return this.renderer.renderThroughputGauge(widget, data);
      default:
        return { error: `Unknown widget type: ${widget.type}` };
    }
  }

  // Public API - Data Management
  getDashboardData(migrationId: string, filter?: DashboardTypes.FilterCriteria): DashboardTypes.DashboardData[] {
    let data = this.core.getDashboardData(migrationId);
    return filter ? this.applyFilter(data, filter) : data;
  }

  getAllDashboardData(filter?: DashboardTypes.FilterCriteria): DashboardTypes.DashboardData[] {
    let data = this.core.getAllDashboardData();
    return filter ? this.applyFilter(data, filter) : data;
  }

  private applyFilter(data: DashboardTypes.DashboardData[], filter: DashboardTypes.FilterCriteria): DashboardTypes.DashboardData[] {
    let filtered = data;

    if (filter.migrationIds) {
      filtered = this.aggregator.filterDataByMigration(filtered, filter.migrationIds);
    }

    if (filter.timeRange) {
      filtered = this.aggregator.filterDataByTimeRange(filtered, filter.timeRange.start, filter.timeRange.end);
    }

    if (filter.severity) {
      filtered = filtered.filter(d =>
        d.alerts.some(a => filter.severity!.includes(a.severity))
      );
    }

    if (filter.alertTypes) {
      filtered = filtered.filter(d =>
        d.alerts.some(a => filter.alertTypes!.includes(a.type))
      );
    }

    if (filter.healthStatus) {
      filtered = filtered.filter(d =>
        d.healthChecks.some(h => filter.healthStatus!.includes(h.status))
      );
    }

    return filtered;
  }

  // Public API - Export and Configuration
  exportData(format: 'csv' | 'json' | 'report', migrationId?: string): string {
    if (!this.fsm.canTransition(DashboardTypes.DashboardEvent.EXPORT)) {
      throw new Error('Cannot export in current state');
    }

    this.fsm.transition(DashboardTypes.DashboardEvent.EXPORT);

    try {
      const data = migrationId ?
        this.core.getDashboardData(migrationId) :
        this.core.getAllDashboardData();

      const result = this.performExport(format, data);
      this.fsm.transition(DashboardTypes.DashboardEvent.LOAD_DATA);
      return result;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  private performExport(format: 'csv' | 'json' | 'report', data: DashboardTypes.DashboardData[]): string {
    switch (format) {
      case 'csv':
        return this.exporter.exportToCsv(data);
      case 'json':
        return this.exporter.exportToJson(data);
      case 'report':
        return this.exporter.exportToReport(data, []);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  getLayouts(): DashboardTypes.DashboardLayout[] {
    return this.core.getLayouts();
  }

  getActiveLayout(): DashboardTypes.DashboardLayout | null {
    return this.core.getActiveLayout();
  }

  getConfiguration(): DashboardTypes.DashboardConfiguration {
    return this.core.getConfiguration();
  }

  updateConfiguration(updates: Partial<DashboardTypes.DashboardConfiguration>): void {
    if (this.fsm.canTransition(DashboardTypes.DashboardEvent.CONFIGURE)) {
      this.fsm.transition(DashboardTypes.DashboardEvent.CONFIGURE);
      this.core.updateConfiguration(updates);
      this.fsm.transition(DashboardTypes.DashboardEvent.LOAD_DATA);
    }
  }

  startAutoRefresh(): void {
    this.core.startAutoRefresh();
  }

  stopAutoRefresh(): void {
    this.core.stopAutoRefresh();
  }

  cleanup(): void {
    this.fsm.transition(DashboardTypes.DashboardEvent.CLEANUP_REQUESTED);
    this.core.cleanup();
    this.removeAllListeners();
  }
}