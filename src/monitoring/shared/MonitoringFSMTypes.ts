/**
 * Shared Monitoring FSM Types and Contracts
 * Universal state machine definitions for all monitoring systems
 */

// Universal Monitor States
export enum MonitorState {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  ALERTING = 'ALERTING',
  REPORTING = 'REPORTING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

// Universal Monitor Events
export enum MonitorEvent {
  START_SCAN = 'START_SCAN',
  SCAN_COMPLETE = 'SCAN_COMPLETE',
  ANALYSIS_COMPLETE = 'ANALYSIS_COMPLETE',
  ALERT_REQUIRED = 'ALERT_REQUIRED',
  ALERT_SENT = 'ALERT_SENT',
  REPORT_READY = 'REPORT_READY',
  PROCESS_COMPLETE = 'PROCESS_COMPLETE',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RESET = 'RESET'
}

// Monitor FSM Context (generic)
export interface MonitorContext<TData = any, TResult = any> {
  scanData?: TData;
  analysisResult?: TResult;
  alerts?: MonitorAlert[];
  report?: MonitorReport;
  error?: Error;
  startTime?: number;
  metrics?: MonitorMetrics;
}

// Universal Monitor Alert
export interface MonitorAlert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  message: string;
  timestamp: number;
  source: string;
  data?: any;
}

// Universal Monitor Report
export interface MonitorReport {
  id: string;
  type: string;
  timestamp: number;
  duration: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  summary: string;
  metrics: MonitorMetrics;
  alerts: MonitorAlert[];
  recommendations?: string[];
  data?: any;
}

// Universal Monitor Metrics
export interface MonitorMetrics {
  itemsScanned: number;
  itemsProcessed: number;
  issuesFound: number;
  criticalIssues: number;
  processingTimeMs: number;
  score?: number;
  customMetrics?: Record<string, number>;
}

// FSM Transition Contract
export interface MonitorTransition<TContext = MonitorContext> {
  fromState: MonitorState;
  event: MonitorEvent;
  toState: MonitorState;
  guard?: (context: TContext) => boolean;
  action?: (context: TContext) => Promise<void>;
}

// Monitor Configuration
export interface MonitorConfig {
  enabled: boolean;
  scanInterval?: number;
  thresholds: Record<string, number>;
  alertTargets?: string[];
  retryAttempts: number;
  timeoutMs: number;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: monitor-fsm-types-093
// inputs: ["monitoring requirements", "god object analysis"]
// tools_used: ["Write"]
// versions: {"model":"MEGA093","prompt":"v1.0"}
// === END FOOTER ===