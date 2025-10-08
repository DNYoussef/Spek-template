/**
 * Dashboard Types - Centralized type definitions
 * NASA Rule 10 Compliant: Focused type definitions
 */

import { MigrationMetrics, MigrationHealthCheck, AggregatedMetrics } from '../../monitoring/MigrationMonitor';
import { Alert } from '../../alerting/AlertManager';

export namespace DashboardTypes {

  export interface DashboardWidget {
    id: string;
    type: WidgetType;
    title: string;
    position: { x: number; y: number; width: number; height: number };
    configuration: Record<string, any>;
    refreshIntervalMs: number;
    enabled: boolean;
    permissions: string[];
  }

  export type WidgetType =
    | 'metrics_chart'
    | 'health_status'
    | 'alert_summary'
    | 'migration_progress'
    | 'system_overview'
    | 'throughput_gauge'
    | 'error_rate_chart'
    | 'latency_histogram'
    | 'resource_utilization'
    | 'custom_metric'
    | 'log_viewer'
    | 'escalation_matrix';

  export interface DashboardLayout {
    id: string;
    name: string;
    description: string;
    widgets: DashboardWidget[];
    defaultLayout: boolean;
    createdBy: string;
    createdAt: Date;
    lastModified: Date;
    tags: string[];
  }

  export interface DashboardData {
    timestamp: Date;
    migrationId: string;
    metrics: MigrationMetrics;
    healthChecks: MigrationHealthCheck[];
    alerts: Alert[];
    aggregatedMetrics: Record<string, AggregatedMetrics>;
    customData: Record<string, any>;
  }

  export interface ChartDataPoint {
    timestamp: Date;
    value: number;
    label?: string;
    metadata?: Record<string, any>;
  }

  export interface ChartConfiguration {
    type: 'line' | 'bar' | 'area' | 'pie' | 'gauge' | 'heatmap';
    xAxis: string;
    yAxis: string[];
    timeRange: string;
    aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
    refreshRate: number;
    colorScheme: string;
    showLegend: boolean;
    showTooltips: boolean;
  }

  export interface FilterCriteria {
    migrationIds?: string[];
    timeRange?: { start: Date; end: Date };
    severity?: string[];
    alertTypes?: string[];
    healthStatus?: string[];
    tags?: string[];
  }

  export interface DashboardConfiguration {
    title: string;
    description: string;
    autoRefresh: boolean;
    refreshIntervalMs: number;
    theme: 'light' | 'dark' | 'auto';
    timezone: string;
    dateFormat: string;
    numberFormat: string;
    enableNotifications: boolean;
    enableExport: boolean;
    maxDataPoints: number;
    retentionDays: number;
  }

  // FSM Dashboard States
  export enum DashboardState {
    INITIALIZING = 'INITIALIZING',
    LOADING = 'LOADING',
    DISPLAYING = 'DISPLAYING',
    REFRESHING = 'REFRESHING',
    CONFIGURING = 'CONFIGURING',
    EXPORTING = 'EXPORTING',
    ERROR = 'ERROR',
    CLEANUP = 'CLEANUP'
  }

  // FSM Dashboard Events
  export enum DashboardEvent {
    INITIALIZE = 'INITIALIZE',
    LOAD_DATA = 'LOAD_DATA',
    DATA_LOADED = 'DATA_LOADED',
    REFRESH = 'REFRESH',
    CONFIGURE = 'CONFIGURE',
    EXPORT = 'EXPORT',
    ERROR_OCCURRED = 'ERROR_OCCURRED',
    RECOVERY = 'RECOVERY',
    CLEANUP_REQUESTED = 'CLEANUP_REQUESTED'
  }

  // View States for Dashboard UI
  export enum ViewState {
    OVERVIEW = 'OVERVIEW',
    DETAILED = 'DETAILED',
    WIDGET_CONFIG = 'WIDGET_CONFIG',
    LAYOUT_EDIT = 'LAYOUT_EDIT',
    DATA_FILTER = 'DATA_FILTER',
    EXPORT_PREVIEW = 'EXPORT_PREVIEW'
  }

  // FSM Context for Dashboard
  export interface DashboardContext {
    currentLayout: DashboardLayout | null;
    activeWidgets: DashboardWidget[];
    dataCache: Map<string, DashboardData[]>;
    configuration: DashboardConfiguration;
    refreshTimers: Map<string, NodeJS.Timer>;
    lastError: Error | null;
    viewState: ViewState;
    selectedMigrationId?: string;
    filterCriteria?: FilterCriteria;
  }

  // State Machine Configuration
  export interface DashboardFSMConfig {
    initialState: DashboardState;
    states: Record<DashboardState, DashboardStateConfig>;
    transitions: DashboardTransition[];
    guards: Record<string, (context: DashboardContext) => boolean>;
  }

  export interface DashboardStateConfig {
    onEntry?: (context: DashboardContext) => void;
    onExit?: (context: DashboardContext) => void;
    validEvents: DashboardEvent[];
    timeoutMs?: number;
    retryCount?: number;
  }

  export interface DashboardTransition {
    from: DashboardState;
    to: DashboardState;
    event: DashboardEvent;
    guard?: string;
    action?: (context: DashboardContext) => void;
  }

  // Widget specific types
  export interface WidgetRenderResult {
    widgetId: string;
    type: WidgetType;
    data: any;
    timestamp: Date;
    status: 'success' | 'error' | 'loading';
    error?: string;
  }

  export interface LayoutOperation {
    type: 'create' | 'update' | 'delete';
    layoutId: string;
    changes?: Partial<DashboardLayout>;
    timestamp: Date;
  }

  export interface DashboardMetrics {
    totalLayouts: number;
    totalWidgets: number;
    activeMigrations: number;
    dataPoints: number;
    refreshRate: number;
    errorRate: number;
    avgRenderTime: number;
  }

}