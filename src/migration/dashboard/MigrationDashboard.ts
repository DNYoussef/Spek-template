import { DashboardStateMachine } from './fsm/DashboardStateMachine';
// TODO(Phase 4): Implement core module - import { DashboardCore } from './core/DashboardCore';
// TODO(Phase 4): Implement facade - import { DashboardFacade } from './facade/DashboardFacade';
import { DashboardTypes } from '~types/DashboardTypes';
export * from '~types/DashboardTypes';
export * from './core/DashboardCore';
export * from './facade/DashboardFacade';
export * from './fsm/DashboardStateMachine';

// Legacy exports for backward compatibility
import { EventEmitter } from 'events';
import { MigrationMonitor, MigrationMetrics, MigrationHealthCheck, AggregatedMetrics } from '../monitoring/MigrationMonitor';
import { AlertManager, Alert } from '../alerting/AlertManager';
import { WidgetRenderer } from './renderers/WidgetRenderer';
import { DashboardDataAggregator } from './aggregators/DashboardDataAggregator';
import { DashboardExporter } from './exporters/DashboardExporter';

// Re-export types from DashboardTypes
export {
  DashboardTypes
} from '~types/DashboardTypes';

// Individual type exports for backward compatibility
export type DashboardWidget = DashboardTypes.DashboardWidget;
export type WidgetType = DashboardTypes.WidgetType;
export type DashboardLayout = DashboardTypes.DashboardLayout;
export type DashboardData = DashboardTypes.DashboardData;
export type ChartDataPoint = DashboardTypes.ChartDataPoint;
export type ChartConfiguration = DashboardTypes.ChartConfiguration;
export type FilterCriteria = DashboardTypes.FilterCriteria;
export type DashboardConfiguration = DashboardTypes.DashboardConfiguration;

// Legacy classes moved to separate files for NASA Rule 10 compliance
// See: ./renderers/WidgetRenderer.ts
// See: ./aggregators/DashboardDataAggregator.ts
// See: ./exporters/DashboardExporter.ts

/**
 * FSM-Based Migration Dashboard - Main Entry Point
 * Follows NASA Rule 10 - Decomposed into focused components
 */
export class MigrationDashboard {
  private facade: DashboardFacade;

  constructor(
    monitor: MigrationMonitor,
    alertManager: AlertManager,
    configuration: DashboardTypes.DashboardConfiguration
  ) {
    this.facade = new DashboardFacade(monitor, alertManager, configuration);
  }

  // Delegate all operations to facade
  getCurrentState(): string {
    return this.facade.getCurrentState();
  }

  transitTo(state: string, event?: string): boolean {
    return this.facade.transitTo(state, event);
  }

  createLayout(layout: Omit<DashboardTypes.DashboardLayout, 'id' | 'createdAt' | 'lastModified'>): string {
    return this.facade.createLayout(layout);
  }

  updateLayout(layoutId: string, updates: Partial<DashboardTypes.DashboardLayout>): boolean {
    return this.facade.updateLayout(layoutId, updates);
  }

  deleteLayout(layoutId: string): boolean {
    return this.facade.deleteLayout(layoutId);
  }

  setActiveLayout(layoutId: string): boolean {
    return this.facade.setActiveLayout(layoutId);
  }

  addWidget(layoutId: string, widget: DashboardTypes.DashboardWidget): boolean {
    return this.facade.addWidget(layoutId, widget);
  }

  updateWidget(layoutId: string, widgetId: string, updates: Partial<DashboardTypes.DashboardWidget>): boolean {
    return this.facade.updateWidget(layoutId, widgetId, updates);
  }

  removeWidget(layoutId: string, widgetId: string): boolean {
    return this.facade.removeWidget(layoutId, widgetId);
  }

  renderWidget(widgetId: string, migrationId?: string): any {
    return this.facade.renderWidget(widgetId, migrationId);
  }

  getDashboardData(migrationId: string, filter?: DashboardTypes.FilterCriteria): DashboardTypes.DashboardData[] {
    return this.facade.getDashboardData(migrationId, filter);
  }

  getAllDashboardData(filter?: DashboardTypes.FilterCriteria): DashboardTypes.DashboardData[] {
    return this.facade.getAllDashboardData(filter);
  }

  getLayouts(): DashboardTypes.DashboardLayout[] {
    return this.facade.getLayouts();
  }

  getActiveLayout(): DashboardTypes.DashboardLayout | null {
    return this.facade.getActiveLayout();
  }

  exportData(format: 'csv' | 'json' | 'report', migrationId?: string): string {
    return this.facade.exportData(format, migrationId);
  }

  startAutoRefresh(): void {
    this.facade.startAutoRefresh();
  }

  stopAutoRefresh(): void {
    this.facade.stopAutoRefresh();
  }

  updateConfiguration(updates: Partial<DashboardTypes.DashboardConfiguration>): void {
    this.facade.updateConfiguration(updates);
  }

  getConfiguration(): DashboardTypes.DashboardConfiguration {
    return this.facade.getConfiguration();
  }

  cleanup(): void {
    this.facade.cleanup();
  }

  // Event emitter compatibility
  on(event: string, listener: (...args: any[]) => void): void {
    this.facade.on(event, listener);
  }

  emit(event: string, ...args: any[]): boolean {
    return this.facade.emit(event, ...args);
  }

  removeAllListeners(): void {
    this.facade.removeAllListeners();
  }
}

// Legacy exports for backward compatibility
export { WidgetRenderer };
export { DashboardDataAggregator };
export { DashboardExporter };