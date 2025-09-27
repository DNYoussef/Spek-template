/**
 * StateMonitoringDashboard - Real-Time State Visualization
 * Provides comprehensive real-time monitoring and visualization for Princess
 * state machines, workflows, and system health with interactive dashboards.
 */

import { EventEmitter } from 'events';
import LangGraphEngine from '../LangGraphEngine';
import QueenOrchestrator from '../queen/QueenOrchestrator';
import MessageRouter from '../communication/MessageRouter';
import EventBus from '../communication/EventBus';
import PrincessStateMachine from '../state-machines/PrincessStateMachine';

export interface DashboardConfig {
  refreshInterval: number;
  maxDataPoints: number;
  alertThresholds: AlertThresholds;
  visualizationSettings: VisualizationSettings;
  exportFormats: string[];
  realTimeEnabled: boolean;
  historicalDataEnabled: boolean;
}

export interface AlertThresholds {
  errorRate: number;
  responseTime: number;
  resourceUtilization: number;
  queueLength: number;
  stateTransitionFailures: number;
}

export interface VisualizationSettings {
  theme: 'light' | 'dark' | 'auto';
  chartTypes: string[];
  defaultTimeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  autoRefresh: boolean;
  animationsEnabled: boolean;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'graph' | 'table' | 'alert' | 'log';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  dataSource: string;
  configuration: any;
  refreshRate: number;
  visible: boolean;
}

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  unit: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  tags: string[];
  calculator: (data: any) => number;
  thresholds: {
    warning: number;
    critical: number;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  notifications: NotificationChannel[];
  cooldown: number;
  lastTriggered?: Date;
}

export interface NotificationChannel {
  type: 'email' | 'webhook' | 'console' | 'dashboard';
  configuration: any;
  enabled: boolean;
}

export interface DashboardMetrics {
  system: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    networkIO: { in: number; out: number };
  };
  princesses: Record<string, {
    state: string;
    utilization: number;
    taskCount: number;
    errorRate: number;
    responseTime: number;
    availability: number;
  }>;
  workflows: {
    active: number;
    completed: number;
    failed: number;
    averageExecutionTime: number;
    throughput: number;
  };
  communication: {
    messagesPerSecond: number;
    queueLengths: Record<string, number>;
    averageLatency: number;
    errorRate: number;
  };
  queen: {
    activeObjectives: number;
    decisionsPerMinute: number;
    successRate: number;
    autonomyLevel: number;
  };
}

export interface StateVisualization {
  nodes: StateNode[];
  edges: StateEdge[];
  clusters: StateCluster[];
  layout: 'hierarchical' | 'circular' | 'force' | 'grid';
  metadata: {
    totalStates: number;
    activeTransitions: number;
    errorStates: number;
    lastUpdated: Date;
  };
}

export interface StateNode {
  id: string;
  label: string;
  type: 'princess' | 'workflow' | 'queen' | 'system';
  status: 'active' | 'idle' | 'error' | 'maintenance';
  metrics: {
    utilization: number;
    throughput: number;
    errorCount: number;
    lastActivity: Date;
  };
  position: { x: number; y: number };
  style: {
    color: string;
    size: number;
    shape: string;
    borderColor: string;
  };
}

export interface StateEdge {
  id: string;
  source: string;
  target: string;
  type: 'message' | 'workflow' | 'state_transition' | 'dependency';
  weight: number;
  status: 'active' | 'idle' | 'error';
  metrics: {
    messageCount: number;
    averageLatency: number;
    errorRate: number;
  };
  style: {
    color: string;
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
    animated: boolean;
  };
}

export interface StateCluster {
  id: string;
  label: string;
  nodes: string[];
  type: 'domain' | 'workflow' | 'functional';
  style: {
    backgroundColor: string;
    borderColor: string;
    borderStyle: string;
  };
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  metadata?: any;
}

export interface DashboardExport {
  format: 'json' | 'csv' | 'pdf' | 'png' | 'svg';
  timeRange: { start: Date; end: Date };
  metrics: string[];
  configuration: any;
}

export class StateMonitoringDashboard extends EventEmitter {
  private config: DashboardConfig;
  private engine: LangGraphEngine;
  private queen: QueenOrchestrator;
  private messageRouter: MessageRouter;
  private eventBus: EventBus;
  private princesses: Map<string, PrincessStateMachine>;
  private widgets: Map<string, DashboardWidget>;
  private metrics: Map<string, MetricDefinition>;
  private alertRules: Map<string, AlertRule>;
  private timeSeriesData: Map<string, TimeSeriesData[]>;
  private currentMetrics: DashboardMetrics;
  private alertHistory: any[];
  private monitoringActive: boolean;
  private dataCollectionTimers: Map<string, NodeJS.Timeout>;

  constructor(
    config: DashboardConfig,
    engine: LangGraphEngine,
    queen: QueenOrchestrator,
    messageRouter: MessageRouter,
    eventBus: EventBus
  ) {
    super();

    this.config = config;
    this.engine = engine;
    this.queen = queen;
    this.messageRouter = messageRouter;
    this.eventBus = eventBus;
    this.princesses = new Map();
    this.widgets = new Map();
    this.metrics = new Map();
    this.alertRules = new Map();
    this.timeSeriesData = new Map();
    this.alertHistory = [];
    this.monitoringActive = false;
    this.dataCollectionTimers = new Map();

    this.currentMetrics = {
      system: {
        uptime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        diskUsage: 0,
        networkIO: { in: 0, out: 0 }
      },
      princesses: {},
      workflows: {
        active: 0,
        completed: 0,
        failed: 0,
        averageExecutionTime: 0,
        throughput: 0
      },
      communication: {
        messagesPerSecond: 0,
        queueLengths: {},
        averageLatency: 0,
        errorRate: 0
      },
      queen: {
        activeObjectives: 0,
        decisionsPerMinute: 0,
        successRate: 0,
        autonomyLevel: 0
      }
    };

    this.initializeDashboard();
  }

  /**
   * Start monitoring and data collection
   */
  async startMonitoring(): Promise<void> {
    if (this.monitoringActive) {
      return;
    }

    this.monitoringActive = true;
    
    // Start data collection timers
    this.startDataCollection();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize widgets
    await this.initializeWidgets();
    
    this.emit('monitoringStarted');
  }

  /**
   * Stop monitoring and cleanup
   */
  async stopMonitoring(): Promise<void> {
    this.monitoringActive = false;
    
    // Clear all timers
    for (const timer of this.dataCollectionTimers.values()) {
      clearInterval(timer);
    }
    this.dataCollectionTimers.clear();
    
    this.emit('monitoringStopped');
  }

  /**
   * Register a Princess for monitoring
   */
  registerPrincess(princessId: string, stateMachine: PrincessStateMachine): void {
    this.princesses.set(princessId, stateMachine);
    
    // Initialize Princess metrics
    this.currentMetrics.princesses[princessId] = {
      state: stateMachine.getCurrentState().name,
      utilization: 0,
      taskCount: 0,
      errorRate: 0,
      responseTime: 0,
      availability: 1.0
    };
    
    // Setup Princess-specific monitoring
    this.setupPrincessMonitoring(princessId, stateMachine);
    
    this.emit('princessRegistered', princessId);
  }

  /**
   * Add a dashboard widget
   */
  addWidget(widget: DashboardWidget): void {
    this.widgets.set(widget.id, widget);
    
    if (this.monitoringActive) {
      this.initializeWidget(widget);
    }
    
    this.emit('widgetAdded', widget.id);
  }

  /**
   * Remove a dashboard widget
   */
  removeWidget(widgetId: string): void {
    const removed = this.widgets.delete(widgetId);
    if (removed) {
      this.emit('widgetRemoved', widgetId);
    }
  }

  /**
   * Add a custom metric definition
   */
  addMetric(metric: MetricDefinition): void {
    this.metrics.set(metric.id, metric);
    
    // Initialize time series data for the metric
    this.timeSeriesData.set(metric.id, []);
    
    this.emit('metricAdded', metric.id);
  }

  /**
   * Add an alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.emit('alertRuleAdded', rule.id);
  }

  /**
   * Get current dashboard metrics
   */
  getCurrentMetrics(): DashboardMetrics {
    return JSON.parse(JSON.stringify(this.currentMetrics));
  }

  /**
   * Get time series data for a metric
   */
  getTimeSeriesData(
    metricId: string,
    timeRange?: { start: Date; end: Date }
  ): TimeSeriesData[] {
    const data = this.timeSeriesData.get(metricId) || [];
    
    if (!timeRange) {
      return data.slice(-this.config.maxDataPoints);
    }
    
    return data.filter(point => 
      point.timestamp >= timeRange.start && 
      point.timestamp <= timeRange.end
    );
  }

  /**
   * Get state visualization data
   */
  getStateVisualization(): StateVisualization {
    const nodes: StateNode[] = [];
    const edges: StateEdge[] = [];
    const clusters: StateCluster[] = [];

    // Add Princess nodes
    for (const [princessId, stateMachine] of this.princesses) {
      const state = stateMachine.getCurrentState();
      const metrics = this.currentMetrics.princesses[princessId];
      
      nodes.push({
        id: princessId,
        label: princessId,
        type: 'princess',
        status: this.mapStateToStatus(state.name),
        metrics: {
          utilization: metrics.utilization,
          throughput: 0, // Would be calculated from performance metrics
          errorCount: 0,
          lastActivity: state.metadata.enteredAt
        },
        position: this.calculateNodePosition(princessId),
        style: this.getNodeStyle('princess', this.mapStateToStatus(state.name))
      });
    }

    // Add Queen node
    const queenMetrics = this.queen.getQueenMetrics();
    nodes.push({
      id: 'queen',
      label: 'Queen Orchestrator',
      type: 'queen',
      status: 'active',
      metrics: {
        utilization: queenMetrics.activeObjectives / 10, // Normalize
        throughput: queenMetrics.decisionsPerMinute,
        errorCount: 0,
        lastActivity: new Date()
      },
      position: { x: 0, y: 0 }, // Central position
      style: this.getNodeStyle('queen', 'active')
    });

    // Add communication edges
    const communicationMetrics = this.messageRouter.getRoutingMetrics();
    for (const connection of communicationMetrics.networkTopology.connections) {
      edges.push({
        id: `${connection.from}-${connection.to}`,
        source: connection.from,
        target: connection.to,
        type: 'message',
        weight: connection.weight,
        status: 'active',
        metrics: {
          messageCount: connection.weight,
          averageLatency: communicationMetrics.averageLatency,
          errorRate: communicationMetrics.errorRate
        },
        style: this.getEdgeStyle('message', 'active', connection.weight)
      });
    }

    // Create domain clusters
    const domainClusters = this.createDomainClusters(nodes);
    clusters.push(...domainClusters);

    return {
      nodes,
      edges,
      clusters,
      layout: 'force',
      metadata: {
        totalStates: nodes.length,
        activeTransitions: edges.filter(e => e.status === 'active').length,
        errorStates: nodes.filter(n => n.status === 'error').length,
        lastUpdated: new Date()
      }
    };
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): any[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Export dashboard data
   */
  async exportData(exportConfig: DashboardExport): Promise<any> {
    const data = {
      metadata: {
        exportTime: new Date(),
        timeRange: exportConfig.timeRange,
        format: exportConfig.format
      },
      metrics: {},
      currentState: this.getCurrentMetrics(),
      configuration: exportConfig.configuration
    };

    // Collect time series data for requested metrics
    for (const metricId of exportConfig.metrics) {
      data.metrics[metricId] = this.getTimeSeriesData(metricId, exportConfig.timeRange);
    }

    switch (exportConfig.format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data);
      case 'pdf':
        return await this.generatePDF(data);
      default:
        return data;
    }
  }

  /**
   * Update dashboard configuration
   */
  updateConfiguration(newConfig: Partial<DashboardConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.monitoringActive) {
      this.restartDataCollection();
    }
    
    this.emit('configurationUpdated', this.config);
  }

  /**
   * Private methods
   */
  private initializeDashboard(): void {
    // Initialize built-in metrics
    this.initializeBuiltInMetrics();
    
    // Initialize default widgets
    this.initializeDefaultWidgets();
    
    // Initialize default alert rules
    this.initializeDefaultAlertRules();
  }

  private initializeBuiltInMetrics(): void {
    const builtInMetrics: MetricDefinition[] = [
      {
        id: 'system.memory_usage',
        name: 'Memory Usage',
        description: 'System memory utilization percentage',
        unit: '%',
        type: 'gauge',
        tags: ['system', 'resource'],
        calculator: () => this.currentMetrics.system.memoryUsage,
        thresholds: { warning: 80, critical: 95 }
      },
      {
        id: 'system.cpu_usage',
        name: 'CPU Usage',
        description: 'System CPU utilization percentage',
        unit: '%',
        type: 'gauge',
        tags: ['system', 'resource'],
        calculator: () => this.currentMetrics.system.cpuUsage,
        thresholds: { warning: 70, critical: 90 }
      },
      {
        id: 'workflows.throughput',
        name: 'Workflow Throughput',
        description: 'Number of workflows completed per minute',
        unit: 'workflows/min',
        type: 'gauge',
        tags: ['workflow', 'performance'],
        calculator: () => this.currentMetrics.workflows.throughput,
        thresholds: { warning: 5, critical: 2 }
      },
      {
        id: 'communication.message_rate',
        name: 'Message Rate',
        description: 'Messages processed per second',
        unit: 'msg/sec',
        type: 'gauge',
        tags: ['communication', 'performance'],
        calculator: () => this.currentMetrics.communication.messagesPerSecond,
        thresholds: { warning: 100, critical: 500 }
      },
      {
        id: 'queen.autonomy_level',
        name: 'Queen Autonomy Level',
        description: 'Current autonomy level of Queen Orchestrator',
        unit: 'ratio',
        type: 'gauge',
        tags: ['queen', 'autonomy'],
        calculator: () => this.currentMetrics.queen.autonomyLevel,
        thresholds: { warning: 0.3, critical: 0.1 }
      }
    ];

    builtInMetrics.forEach(metric => this.addMetric(metric));
  }

  private initializeDefaultWidgets(): void {
    const defaultWidgets: DashboardWidget[] = [
      {
        id: 'system-overview',
        type: 'metric',
        title: 'System Overview',
        position: { x: 0, y: 0, width: 4, height: 2 },
        dataSource: 'system',
        configuration: {
          metrics: ['system.memory_usage', 'system.cpu_usage'],
          displayType: 'cards'
        },
        refreshRate: 5000,
        visible: true
      },
      {
        id: 'princess-states',
        type: 'graph',
        title: 'Princess State Network',
        position: { x: 4, y: 0, width: 8, height: 6 },
        dataSource: 'state_visualization',
        configuration: {
          layout: 'force',
          showLabels: true,
          animateTransitions: true
        },
        refreshRate: 2000,
        visible: true
      },
      {
        id: 'workflow-metrics',
        type: 'chart',
        title: 'Workflow Performance',
        position: { x: 0, y: 2, width: 4, height: 4 },
        dataSource: 'workflows',
        configuration: {
          chartType: 'line',
          metrics: ['workflows.throughput', 'workflows.averageExecutionTime'],
          timeRange: '1h'
        },
        refreshRate: 10000,
        visible: true
      },
      {
        id: 'communication-metrics',
        type: 'chart',
        title: 'Communication Metrics',
        position: { x: 0, y: 6, width: 6, height: 3 },
        dataSource: 'communication',
        configuration: {
          chartType: 'area',
          metrics: ['communication.message_rate', 'communication.averageLatency'],
          timeRange: '1h'
        },
        refreshRate: 5000,
        visible: true
      },
      {
        id: 'queen-dashboard',
        type: 'metric',
        title: 'Queen Orchestrator',
        position: { x: 6, y: 6, width: 6, height: 3 },
        dataSource: 'queen',
        configuration: {
          metrics: ['queen.activeObjectives', 'queen.autonomy_level', 'queen.successRate'],
          displayType: 'gauges'
        },
        refreshRate: 10000,
        visible: true
      },
      {
        id: 'alert-panel',
        type: 'alert',
        title: 'Active Alerts',
        position: { x: 0, y: 9, width: 12, height: 2 },
        dataSource: 'alerts',
        configuration: {
          maxAlerts: 10,
          showHistory: true
        },
        refreshRate: 1000,
        visible: true
      }
    ];

    defaultWidgets.forEach(widget => this.addWidget(widget));
  }

  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        condition: 'system.memory_usage > 90',
        severity: 'critical',
        enabled: true,
        notifications: [{ type: 'dashboard', configuration: {}, enabled: true }],
        cooldown: 300000 // 5 minutes
      },
      {
        id: 'princess-error-state',
        name: 'Princess in Error State',
        condition: 'princess.state == \"error\"',
        severity: 'critical',
        enabled: true,
        notifications: [{ type: 'dashboard', configuration: {}, enabled: true }],
        cooldown: 60000 // 1 minute
      },
      {
        id: 'low-workflow-throughput',
        name: 'Low Workflow Throughput',
        condition: 'workflows.throughput < 2',
        severity: 'warning',
        enabled: true,
        notifications: [{ type: 'dashboard', configuration: {}, enabled: true }],
        cooldown: 600000 // 10 minutes
      },
      {
        id: 'high-communication-latency',
        name: 'High Communication Latency',
        condition: 'communication.averageLatency > 1000',
        severity: 'warning',
        enabled: true,
        notifications: [{ type: 'dashboard', configuration: {}, enabled: true }],
        cooldown: 300000 // 5 minutes
      },
      {
        id: 'queen-low-autonomy',
        name: 'Queen Low Autonomy Level',
        condition: 'queen.autonomy_level < 0.2',
        severity: 'warning',
        enabled: true,
        notifications: [{ type: 'dashboard', configuration: {}, enabled: true }],
        cooldown: 1800000 // 30 minutes
      }
    ];

    defaultRules.forEach(rule => this.addAlertRule(rule));
  }

  private startDataCollection(): void {
    // System metrics collection
    const systemTimer = setInterval(() => {
      this.collectSystemMetrics();
    }, 5000);
    this.dataCollectionTimers.set('system', systemTimer);

    // Princess metrics collection
    const princessTimer = setInterval(() => {
      this.collectPrincessMetrics();
    }, 2000);
    this.dataCollectionTimers.set('princess', princessTimer);

    // Workflow metrics collection
    const workflowTimer = setInterval(() => {
      this.collectWorkflowMetrics();
    }, 10000);
    this.dataCollectionTimers.set('workflow', workflowTimer);

    // Communication metrics collection
    const communicationTimer = setInterval(() => {
      this.collectCommunicationMetrics();
    }, 5000);
    this.dataCollectionTimers.set('communication', communicationTimer);

    // Queen metrics collection
    const queenTimer = setInterval(() => {
      this.collectQueenMetrics();
    }, 10000);
    this.dataCollectionTimers.set('queen', queenTimer);

    // Custom metrics collection
    const customTimer = setInterval(() => {
      this.collectCustomMetrics();
    }, this.config.refreshInterval);
    this.dataCollectionTimers.set('custom', customTimer);

    // Alert evaluation
    const alertTimer = setInterval(() => {
      this.evaluateAlerts();
    }, 1000);
    this.dataCollectionTimers.set('alerts', alertTimer);
  }

  private restartDataCollection(): void {
    // Clear existing timers
    for (const timer of this.dataCollectionTimers.values()) {
      clearInterval(timer);
    }
    this.dataCollectionTimers.clear();

    // Start new timers with updated configuration
    this.startDataCollection();
  }

  private setupEventListeners(): void {
    // Listen to event bus events
    this.eventBus.subscribe('dashboard', ['*'], (event) => {
      this.handleSystemEvent(event);
    });

    // Listen to engine events
    this.engine.on('workflowStarted', (workflowId) => {
      this.currentMetrics.workflows.active++;
    });

    this.engine.on('workflowCompleted', (workflowId) => {
      this.currentMetrics.workflows.active--;
      this.currentMetrics.workflows.completed++;
    });

    this.engine.on('workflowFailed', (workflowId) => {
      this.currentMetrics.workflows.active--;
      this.currentMetrics.workflows.failed++;
    });
  }

  private setupPrincessMonitoring(princessId: string, stateMachine: PrincessStateMachine): void {
    stateMachine.on('stateChanged', (oldState, newState) => {
      this.currentMetrics.princesses[princessId].state = newState;
      this.emit('princessStateChanged', princessId, oldState, newState);
    });

    stateMachine.on('taskCompleted', (taskId, result) => {
      this.currentMetrics.princesses[princessId].taskCount++;
      this.emit('princessTaskCompleted', princessId, taskId);
    });

    stateMachine.on('error', (error) => {
      this.currentMetrics.princesses[princessId].errorRate += 0.1;
      this.emit('princessError', princessId, error);
    });
  }

  private async initializeWidgets(): Promise<void> {
    for (const widget of this.widgets.values()) {
      await this.initializeWidget(widget);
    }
  }

  private async initializeWidget(widget: DashboardWidget): Promise<void> {
    // Setup widget-specific data collection
    const widgetTimer = setInterval(() => {
      this.updateWidgetData(widget);
    }, widget.refreshRate);
    
    this.dataCollectionTimers.set(`widget_${widget.id}`, widgetTimer);
    
    this.emit('widgetInitialized', widget.id);
  }

  private updateWidgetData(widget: DashboardWidget): void {
    let data: any;
    
    switch (widget.dataSource) {
      case 'system':
        data = this.currentMetrics.system;
        break;
      case 'princesses':
        data = this.currentMetrics.princesses;
        break;
      case 'workflows':
        data = this.currentMetrics.workflows;
        break;
      case 'communication':
        data = this.currentMetrics.communication;
        break;
      case 'queen':
        data = this.currentMetrics.queen;
        break;
      case 'state_visualization':
        data = this.getStateVisualization();
        break;
      case 'alerts':
        data = this.getAlertHistory(10);
        break;
      default:
        data = {};
    }
    
    this.emit('widgetDataUpdated', widget.id, data);
  }

  private collectSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    
    this.currentMetrics.system = {
      uptime: process.uptime(),
      memoryUsage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to percentage approximation
      diskUsage: 0, // Would need OS-specific implementation
      networkIO: { in: 0, out: 0 } // Would need network monitoring
    };
  }

  private collectPrincessMetrics(): void {
    for (const [princessId, stateMachine] of this.princesses) {
      const performance = stateMachine.getPerformanceMetrics();
      
      this.currentMetrics.princesses[princessId] = {
        ...this.currentMetrics.princesses[princessId],
        utilization: performance.currentLoad,
        responseTime: performance.averageExecutionTime || 0,
        availability: performance.uptime > 0 ? 1.0 : 0.0
      };
    }
  }

  private collectWorkflowMetrics(): void {
    const runningWorkflows = this.engine.getRunningWorkflows();
    
    this.currentMetrics.workflows.active = runningWorkflows.length;
    
    // Calculate throughput (simplified)
    const completedInLastMinute = this.currentMetrics.workflows.completed; // Would need time-based calculation
    this.currentMetrics.workflows.throughput = completedInLastMinute;
  }

  private collectCommunicationMetrics(): void {
    const routingMetrics = this.messageRouter.getRoutingMetrics();
    
    this.currentMetrics.communication = {
      messagesPerSecond: routingMetrics.throughput,
      queueLengths: this.messageRouter.getQueueStatus(),
      averageLatency: routingMetrics.averageLatency,
      errorRate: routingMetrics.errorRate
    };
  }

  private collectQueenMetrics(): void {
    const queenMetrics = this.queen.getQueenMetrics();
    
    this.currentMetrics.queen = {
      activeObjectives: queenMetrics.activeObjectives,
      decisionsPerMinute: queenMetrics.decisionsPerMinute || 0,
      successRate: queenMetrics.successRate,
      autonomyLevel: queenMetrics.autonomyLevel
    };
  }

  private collectCustomMetrics(): void {
    const now = new Date();
    
    for (const [metricId, metric] of this.metrics) {
      try {
        const value = metric.calculator(this.currentMetrics);
        const dataPoint: TimeSeriesData = {
          timestamp: now,
          value,
          metadata: { metricId }
        };
        
        let timeSeries = this.timeSeriesData.get(metricId) || [];
        timeSeries.push(dataPoint);
        
        // Limit data points
        if (timeSeries.length > this.config.maxDataPoints) {
          timeSeries = timeSeries.slice(-this.config.maxDataPoints);
        }
        
        this.timeSeriesData.set(metricId, timeSeries);
        
      } catch (error) {
        console.error(`Error collecting metric ${metricId}:`, error);
      }
    }
  }

  private evaluateAlerts(): void {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;
      
      // Check cooldown
      if (rule.lastTriggered && 
          Date.now() - rule.lastTriggered.getTime() < rule.cooldown) {
        continue;
      }
      
      try {
        const triggered = this.evaluateAlertCondition(rule.condition);
        
        if (triggered) {
          this.triggerAlert(rule);
        }
        
      } catch (error) {
        console.error(`Error evaluating alert rule ${ruleId}:`, error);
      }
    }
  }

  private evaluateAlertCondition(condition: string): boolean {
    // Simple condition evaluation - in production, use a proper expression evaluator
    try {
      // Replace metric names with actual values
      let evaluatedCondition = condition;
      
      // System metrics
      evaluatedCondition = evaluatedCondition.replace(
        /system\\.(\\w+)/g,
        (match, metric) => this.currentMetrics.system[metric] || 0
      );
      
      // Princess metrics (simplified - would need more sophisticated parsing)
      evaluatedCondition = evaluatedCondition.replace(
        /princess\\.state/g,
        '\"active\"' // Simplified
      );
      
      // Other metrics
      evaluatedCondition = evaluatedCondition.replace(
        /(\\w+)\\.(\\w+)/g,
        (match, category, metric) => {
          const categoryData = this.currentMetrics[category];
          return categoryData ? (categoryData[metric] || 0) : 0;
        }
      );
      
      // Evaluate the condition
      const func = new Function(`return ${evaluatedCondition}`);
      return func();
      
    } catch (error) {
      console.error('Error evaluating condition:', condition, error);
      return false;
    }
  }

  private triggerAlert(rule: AlertRule): void {
    const alert = {
      id: `alert_${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: `Alert triggered: ${rule.name}`,
      timestamp: new Date(),
      acknowledged: false
    };
    
    this.alertHistory.push(alert);
    
    // Limit alert history
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }
    
    rule.lastTriggered = new Date();
    
    // Send notifications
    for (const notification of rule.notifications) {
      if (notification.enabled) {
        this.sendNotification(notification, alert);
      }
    }
    
    this.emit('alertTriggered', alert);
  }

  private sendNotification(channel: NotificationChannel, alert: any): void {
    switch (channel.type) {
      case 'dashboard':
        this.emit('dashboardAlert', alert);
        break;
      case 'console':
        console.warn(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
        break;
      case 'webhook':
        // Would implement webhook notification
        break;
      case 'email':
        // Would implement email notification
        break;
    }
  }

  private handleSystemEvent(event: any): void {
    // Handle system events that might affect metrics
    switch (event.type) {
      case 'princess.state.changed':
        // Already handled by Princess monitoring
        break;
      case 'workflow.completed':
        // Already handled by engine events
        break;
    }
  }

  private mapStateToStatus(stateName: string): StateNode['status'] {
    switch (stateName) {
      case 'error':
        return 'error';
      case 'maintenance':
        return 'maintenance';
      case 'idle':
        return 'idle';
      default:
        return 'active';
    }
  }

  private calculateNodePosition(nodeId: string): { x: number; y: number } {
    // Simple positioning algorithm - in production, use proper layout algorithms
    const hash = nodeId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return {
      x: (hash % 800) - 400,
      y: ((hash >> 8) % 600) - 300
    };
  }

  private getNodeStyle(type: string, status: string): StateNode['style'] {
    const colors = {
      princess: {
        active: '#4CAF50',
        idle: '#FFC107',
        error: '#F44336',
        maintenance: '#FF9800'
      },
      queen: {
        active: '#9C27B0'
      },
      workflow: {
        active: '#2196F3'
      },
      system: {
        active: '#607D8B'
      }
    };
    
    return {
      color: colors[type]?.[status] || '#9E9E9E',
      size: type === 'queen' ? 40 : 30,
      shape: type === 'queen' ? 'diamond' : 'circle',
      borderColor: status === 'error' ? '#D32F2F' : '#E0E0E0'
    };
  }

  private getEdgeStyle(
    type: string,
    status: string,
    weight: number
  ): StateEdge['style'] {
    return {
      color: status === 'error' ? '#F44336' : '#2196F3',
      width: Math.max(1, Math.min(5, weight / 10)),
      style: status === 'error' ? 'dashed' : 'solid',
      animated: weight > 50
    };
  }

  private createDomainClusters(nodes: StateNode[]): StateCluster[] {
    const clusters: StateCluster[] = [];
    
    // Group Princess nodes by domain (simplified)
    const princessNodes = nodes.filter(n => n.type === 'princess');
    if (princessNodes.length > 0) {
      clusters.push({
        id: 'princesses',
        label: 'Princess Domain',
        nodes: princessNodes.map(n => n.id),
        type: 'domain',
        style: {
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderColor: '#4CAF50',
          borderStyle: 'dashed'
        }
      });
    }
    
    return clusters;
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - would need more sophisticated implementation
    const headers = ['timestamp', 'metric', 'value'];
    const rows = [];
    
    for (const [metricId, timeSeries] of Object.entries(data.metrics)) {
      for (const point of timeSeries as TimeSeriesData[]) {
        rows.push([
          point.timestamp.toISOString(),
          metricId,
          point.value
        ]);
      }
    }
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\
*');
  }

  private async generatePDF(data: any): Promise<Buffer> {
    // Would implement PDF generation using a library like puppeteer or pdf-lib
    throw new Error('PDF export not implemented');
  }
}

export default StateMonitoringDashboard;