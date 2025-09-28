/**
 * Monitoring Hub - Central FSM Orchestrator
 * Unified monitoring system with shared state machine
 */

import {
  MonitorState,
  MonitorEvent,
  MonitorContext,
  MonitorTransition,
  MonitorConfig,
  MonitorAlert,
  MonitorReport
} from './MonitoringFSMTypes';
import {
  EventCollector,
  MetricAggregator,
  ThresholdChecker,
  AlertDispatcher,
  ReportGenerator
} from './MonitoringComponents';

export abstract class MonitoringHub<TData = any, TResult = any> {
  protected state: MonitorState = MonitorState.IDLE;
  protected context: MonitorContext<TData, TResult> = {};
  protected config: MonitorConfig;

  // Shared components
  protected eventCollector: EventCollector;
  protected metricAggregator: MetricAggregator;
  protected thresholdChecker: ThresholdChecker;
  protected alertDispatcher: AlertDispatcher;
  protected reportGenerator: ReportGenerator;

  // FSM Transition Table
  private transitions: MonitorTransition<MonitorContext<TData, TResult>>[] = [
    // From IDLE
    { fromState: MonitorState.IDLE, event: MonitorEvent.START_SCAN, toState: MonitorState.SCANNING, action: this.onStartScan.bind(this) },

    // From SCANNING
    { fromState: MonitorState.SCANNING, event: MonitorEvent.SCAN_COMPLETE, toState: MonitorState.ANALYZING, action: this.onScanComplete.bind(this) },
    { fromState: MonitorState.SCANNING, event: MonitorEvent.ERROR_OCCURRED, toState: MonitorState.ERROR, action: this.onError.bind(this) },

    // From ANALYZING
    { fromState: MonitorState.ANALYZING, event: MonitorEvent.ANALYSIS_COMPLETE, toState: MonitorState.ALERTING, action: this.onAnalysisComplete.bind(this) },
    { fromState: MonitorState.ANALYZING, event: MonitorEvent.ERROR_OCCURRED, toState: MonitorState.ERROR, action: this.onError.bind(this) },

    // From ALERTING
    { fromState: MonitorState.ALERTING, event: MonitorEvent.ALERT_SENT, toState: MonitorState.REPORTING, action: this.onAlertSent.bind(this) },
    { fromState: MonitorState.ALERTING, event: MonitorEvent.ERROR_OCCURRED, toState: MonitorState.ERROR, action: this.onError.bind(this) },

    // From REPORTING
    { fromState: MonitorState.REPORTING, event: MonitorEvent.REPORT_READY, toState: MonitorState.COMPLETE, action: this.onReportReady.bind(this) },
    { fromState: MonitorState.REPORTING, event: MonitorEvent.ERROR_OCCURRED, toState: MonitorState.ERROR, action: this.onError.bind(this) },

    // From any state
    { fromState: MonitorState.COMPLETE, event: MonitorEvent.RESET, toState: MonitorState.IDLE, action: this.onReset.bind(this) },
    { fromState: MonitorState.ERROR, event: MonitorEvent.RESET, toState: MonitorState.IDLE, action: this.onReset.bind(this) }
  ];

  constructor(config: MonitorConfig) {
    this.config = config;
    this.eventCollector = new EventCollector();
    this.metricAggregator = new MetricAggregator();
    this.thresholdChecker = new ThresholdChecker(config.thresholds);
    this.alertDispatcher = new AlertDispatcher();
    this.reportGenerator = new ReportGenerator();

    this.setupDefaultAlertHandlers();
  }

  // Public API
  async startMonitoring(data?: TData): Promise<MonitorReport> {
    if (!this.config.enabled) {
      throw new Error('Monitoring is disabled');
    }

    this.context.scanData = data;
    this.context.startTime = Date.now();

    await this.handleEvent(MonitorEvent.START_SCAN);

    // Wait for completion or timeout
    return this.waitForCompletion();
  }

  getCurrentState(): MonitorState {
    return this.state;
  }

  getContext(): MonitorContext<TData, TResult> {
    return { ...this.context };
  }

  async reset(): Promise<void> {
    await this.handleEvent(MonitorEvent.RESET);
  }

  // FSM Event Handler
  private async handleEvent(event: MonitorEvent): Promise<void> {
    const transition = this.transitions.find(t =>
      t.fromState === this.state && t.event === event
    );

    if (!transition) {
      console.warn(`No transition from ${this.state} on ${event}`);
      return;
    }

    // Execute guard if present
    if (transition.guard && !transition.guard(this.context)) {
      console.warn(`Guard failed for transition ${this.state} -> ${transition.toState}`);
      return;
    }

    // Change state
    this.state = transition.toState;

    // Execute action if present
    if (transition.action) {
      try {
        await transition.action(this.context);
      } catch (error) {
        this.context.error = error as Error;
        await this.handleEvent(MonitorEvent.ERROR_OCCURRED);
      }
    }

    this.eventCollector.collect({
      type: 'STATE_TRANSITION',
      fromState: transition.fromState,
      toState: transition.toState,
      event
    });
  }

  // Abstract methods - implemented by specific monitors
  protected abstract performScan(data?: TData): Promise<any>;
  protected abstract analyzeResults(scanData: any): Promise<TResult>;

  // State Action Handlers
  private async onStartScan(context: MonitorContext<TData, TResult>): Promise<void> {
    try {
      const scanResult = await this.performScan(context.scanData);
      context.scanData = scanResult;
      await this.handleEvent(MonitorEvent.SCAN_COMPLETE);
    } catch (error) {
      context.error = error as Error;
      await this.handleEvent(MonitorEvent.ERROR_OCCURRED);
    }
  }

  private async onScanComplete(context: MonitorContext<TData, TResult>): Promise<void> {
    this.metricAggregator.addMetric('scanned', 1);
    await this.handleEvent(MonitorEvent.ANALYSIS_COMPLETE);
  }

  private async onAnalysisComplete(context: MonitorContext<TData, TResult>): Promise<void> {
    try {
      context.analysisResult = await this.analyzeResults(context.scanData);
      this.metricAggregator.addMetric('processed', 1);

      // Check thresholds and generate alerts
      const alerts = this.checkThresholds(context.analysisResult);
      context.alerts = alerts;

      await this.handleEvent(MonitorEvent.ALERT_SENT);
    } catch (error) {
      context.error = error as Error;
      await this.handleEvent(MonitorEvent.ERROR_OCCURRED);
    }
  }

  private async onAlertSent(context: MonitorContext<TData, TResult>): Promise<void> {
    if (context.alerts && context.alerts.length > 0) {
      await this.alertDispatcher.dispatchMultiple(context.alerts);
    }
    await this.handleEvent(MonitorEvent.REPORT_READY);
  }

  private async onReportReady(context: MonitorContext<TData, TResult>): Promise<void> {
    context.report = this.reportGenerator.generateReport(
      this.getMonitorType(),
      this.metricAggregator.getAllMetrics(),
      context.alerts || [],
      context.startTime || Date.now(),
      context.analysisResult
    );

    await this.handleEvent(MonitorEvent.PROCESS_COMPLETE);
  }

  private async onError(context: MonitorContext<TData, TResult>): Promise<void> {
    console.error(`Monitor error in ${this.state}:`, context.error);
    this.metricAggregator.addMetric('errors', 1);
  }

  private async onReset(context: MonitorContext<TData, TResult>): Promise<void> {
    this.context = {};
    this.metricAggregator.clear();
    this.thresholdChecker.clearViolations();
    this.alertDispatcher.clearHistory();
  }

  // Helper methods
  private checkThresholds(result: TResult): MonitorAlert[] {
    const alerts: MonitorAlert[] = [];

    // This should be overridden by specific monitors
    // Base implementation checks common metrics
    const metrics = this.metricAggregator.getAllMetrics();

    Object.entries(metrics.customMetrics || {}).forEach(([key, value]) => {
      const alert = this.thresholdChecker.checkThreshold(key, value);
      if (alert) {
        alerts.push(alert);
      }
    });

    return alerts;
  }

  private setupDefaultAlertHandlers(): void {
    this.alertDispatcher.registerHandler('default', async (alert: MonitorAlert) => {
      console.log(`ALERT [${alert.severity}]: ${alert.message}`);
    });
  }

  private async waitForCompletion(): Promise<MonitorReport> {
    const startTime = Date.now();
    const timeoutMs = this.config.timeoutMs;

    while (this.state !== MonitorState.COMPLETE && this.state !== MonitorState.ERROR) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error('Monitor timeout');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.state === MonitorState.ERROR) {
      throw this.context.error || new Error('Monitor failed');
    }

    return this.context.report!;
  }

  protected abstract getMonitorType(): string;
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T20:17:05-04:00 | agent@ModelMEGA093 | Create central MonitoringHub FSM orchestrator | MonitoringHub.ts | OK | -- | 0.00 | 9d4e7a3 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: monitor-hub-093
- inputs: ["FSM types", "components", "architecture design"]
- tools_used: ["Write"]
- versions: {"model":"MEGA093","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->