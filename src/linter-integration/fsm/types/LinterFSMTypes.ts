/**
 * Linter Integration FSM Types
 * Specialized FSM states and events for linter integration pipeline
 * NASA Rule 10 Compliant - All enum-based, no string literals
 */

// Linter API Server States
export enum LinterApiState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  PROCESSING_REQUEST = 'PROCESSING_REQUEST',
  AUTHENTICATING = 'AUTHENTICATING',
  RATE_LIMITING = 'RATE_LIMITING',
  EXECUTING_LINT = 'EXECUTING_LINT',
  CORRELATING_RESULTS = 'CORRELATING_RESULTS',
  SENDING_RESPONSE = 'SENDING_RESPONSE',
  ERROR = 'ERROR',
  MAINTENANCE = 'MAINTENANCE',
  SHUTDOWN = 'SHUTDOWN'
}

export enum LinterApiEvent {
  INITIALIZE = 'INITIALIZE',
  INITIALIZATION_COMPLETE = 'INITIALIZATION_COMPLETE',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  REQUEST_RECEIVED = 'REQUEST_RECEIVED',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  AUTHENTICATION_SUCCESS = 'AUTHENTICATION_SUCCESS',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  RATE_LIMIT_CHECK = 'RATE_LIMIT_CHECK',
  RATE_LIMIT_PASSED = 'RATE_LIMIT_PASSED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  LINT_EXECUTION_START = 'LINT_EXECUTION_START',
  LINT_EXECUTION_COMPLETE = 'LINT_EXECUTION_COMPLETE',
  LINT_EXECUTION_FAILED = 'LINT_EXECUTION_FAILED',
  CORRELATION_START = 'CORRELATION_START',
  CORRELATION_COMPLETE = 'CORRELATION_COMPLETE',
  CORRELATION_FAILED = 'CORRELATION_FAILED',
  RESPONSE_READY = 'RESPONSE_READY',
  RESPONSE_SENT = 'RESPONSE_SENT',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
  SHUTDOWN_REQUEST = 'SHUTDOWN_REQUEST',
  TIMEOUT = 'TIMEOUT'
}

// Linter Execution States
export enum LinterExecutionState {
  IDLE = 'IDLE',
  PREPARING = 'PREPARING',
  VALIDATING_INPUT = 'VALIDATING_INPUT',
  SELECTING_TOOLS = 'SELECTING_TOOLS',
  EXECUTING_TOOLS = 'EXECUTING_TOOLS',
  COLLECTING_RESULTS = 'COLLECTING_RESULTS',
  PROCESSING_OUTPUT = 'PROCESSING_OUTPUT',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum LinterExecutionEvent {
  START_EXECUTION = 'START_EXECUTION',
  PREPARATION_COMPLETE = 'PREPARATION_COMPLETE',
  PREPARATION_FAILED = 'PREPARATION_FAILED',
  INPUT_VALID = 'INPUT_VALID',
  INPUT_INVALID = 'INPUT_INVALID',
  TOOLS_SELECTED = 'TOOLS_SELECTED',
  TOOL_SELECTION_FAILED = 'TOOL_SELECTION_FAILED',
  TOOL_EXECUTION_START = 'TOOL_EXECUTION_START',
  TOOL_EXECUTION_COMPLETE = 'TOOL_EXECUTION_COMPLETE',
  TOOL_EXECUTION_FAILED = 'TOOL_EXECUTION_FAILED',
  RESULTS_COLLECTED = 'RESULTS_COLLECTED',
  COLLECTION_FAILED = 'COLLECTION_FAILED',
  OUTPUT_PROCESSED = 'OUTPUT_PROCESSED',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  EXECUTION_COMPLETE = 'EXECUTION_COMPLETE',
  EXECUTION_CANCELLED = 'EXECUTION_CANCELLED',
  TIMEOUT_EXCEEDED = 'TIMEOUT_EXCEEDED'
}

// Tool Management States
export enum ToolManagementState {
  UNREGISTERED = 'UNREGISTERED',
  REGISTERING = 'REGISTERING',
  REGISTERED = 'REGISTERED',
  HEALTH_CHECKING = 'HEALTH_CHECKING',
  HEALTHY = 'HEALTHY',
  UNHEALTHY = 'UNHEALTHY',
  EXECUTING = 'EXECUTING',
  MAINTENANCE = 'MAINTENANCE',
  DISABLED = 'DISABLED',
  UNREGISTERING = 'UNREGISTERING'
}

export enum ToolManagementEvent {
  REGISTER_TOOL = 'REGISTER_TOOL',
  REGISTRATION_COMPLETE = 'REGISTRATION_COMPLETE',
  REGISTRATION_FAILED = 'REGISTRATION_FAILED',
  HEALTH_CHECK_START = 'HEALTH_CHECK_START',
  HEALTH_CHECK_PASSED = 'HEALTH_CHECK_PASSED',
  HEALTH_CHECK_FAILED = 'HEALTH_CHECK_FAILED',
  EXECUTION_REQUEST = 'EXECUTION_REQUEST',
  EXECUTION_STARTED = 'EXECUTION_STARTED',
  EXECUTION_COMPLETED = 'EXECUTION_COMPLETED',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  ENTER_MAINTENANCE = 'ENTER_MAINTENANCE',
  EXIT_MAINTENANCE = 'EXIT_MAINTENANCE',
  DISABLE_TOOL = 'DISABLE_TOOL',
  ENABLE_TOOL = 'ENABLE_TOOL',
  UNREGISTER_TOOL = 'UNREGISTER_TOOL',
  UNREGISTRATION_COMPLETE = 'UNREGISTRATION_COMPLETE'
}

// Result Correlation States
export enum CorrelationState {
  IDLE = 'IDLE',
  RECEIVING_RESULTS = 'RECEIVING_RESULTS',
  ANALYZING_PATTERNS = 'ANALYZING_PATTERNS',
  CLUSTERING_VIOLATIONS = 'CLUSTERING_VIOLATIONS',
  GENERATING_INSIGHTS = 'GENERATING_INSIGHTS',
  BUILDING_REPORTS = 'BUILDING_REPORTS',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export enum CorrelationEvent {
  RESULTS_RECEIVED = 'RESULTS_RECEIVED',
  RECEPTION_COMPLETE = 'RECEPTION_COMPLETE',
  RECEPTION_FAILED = 'RECEPTION_FAILED',
  PATTERN_ANALYSIS_START = 'PATTERN_ANALYSIS_START',
  PATTERNS_IDENTIFIED = 'PATTERNS_IDENTIFIED',
  PATTERN_ANALYSIS_FAILED = 'PATTERN_ANALYSIS_FAILED',
  CLUSTERING_START = 'CLUSTERING_START',
  CLUSTERING_COMPLETE = 'CLUSTERING_COMPLETE',
  CLUSTERING_FAILED = 'CLUSTERING_FAILED',
  INSIGHT_GENERATION_START = 'INSIGHT_GENERATION_START',
  INSIGHTS_GENERATED = 'INSIGHTS_GENERATED',
  INSIGHT_GENERATION_FAILED = 'INSIGHT_GENERATION_FAILED',
  REPORT_BUILDING_START = 'REPORT_BUILDING_START',
  REPORTS_BUILT = 'REPORTS_BUILT',
  REPORT_BUILDING_FAILED = 'REPORT_BUILDING_FAILED',
  CORRELATION_COMPLETE = 'CORRELATION_COMPLETE',
  CORRELATION_ERROR = 'CORRELATION_ERROR'
}

// WebSocket Connection States
export enum WebSocketState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  AUTHENTICATING = 'AUTHENTICATING',
  AUTHENTICATED = 'AUTHENTICATED',
  SUBSCRIBING = 'SUBSCRIBING',
  SUBSCRIBED = 'SUBSCRIBED',
  STREAMING = 'STREAMING',
  ERROR = 'ERROR',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED'
}

export enum WebSocketEvent {
  CONNECT = 'CONNECT',
  CONNECTION_ESTABLISHED = 'CONNECTION_ESTABLISHED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTHENTICATE = 'AUTHENTICATE',
  AUTHENTICATION_SUCCESS = 'AUTHENTICATION_SUCCESS',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  SUBSCRIBE = 'SUBSCRIBE',
  SUBSCRIPTION_SUCCESS = 'SUBSCRIPTION_SUCCESS',
  SUBSCRIPTION_FAILED = 'SUBSCRIPTION_FAILED',
  START_STREAMING = 'START_STREAMING',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  MESSAGE_SENT = 'MESSAGE_SENT',
  PING_RECEIVED = 'PING_RECEIVED',
  PONG_SENT = 'PONG_SENT',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  CLOSE_REQUESTED = 'CLOSE_REQUESTED',
  CONNECTION_CLOSED = 'CONNECTION_CLOSED'
}

// Extended FSM Context for Linter Integration
export interface LinterFSMContext {
  currentState: any;
  previousState?: any;
  data: Record<string, any>;
  timestamp: number;
  transitionHistory: LinterTransitionRecord[];
  metadata: Record<string, any>;

  // Linter-specific context
  request?: {
    id: string;
    filePaths: string[];
    tools: string[];
    options: Record<string, any>;
    authentication?: any;
  };

  response?: {
    id: string;
    status: number;
    data?: any;
    error?: string;
    correlationId?: string;
  };

  execution?: {
    correlationId: string;
    status: string;
    startTime: number;
    endTime?: number;
    results: any[];
    errors: string[];
  };

  tools?: {
    selected: string[];
    status: Map<string, any>;
    results: Map<string, any>;
  };

  correlation?: {
    analysisId: string;
    patterns: any[];
    clusters: any[];
    insights: any[];
    reports: any[];
  };

  websocket?: {
    connectionId: string;
    subscriptions: Set<string>;
    lastPing: number;
    messageCount: number;
  };
}

export interface LinterTransitionRecord {
  from: any;
  to: any;
  event: any;
  timestamp: number;
  duration: number;
  success: boolean;
  error?: string;
  context?: LinterFSMContext;
  correlationId?: string;
  requestId?: string;
}

// Linter-specific Guards
export interface LinterTransitionGuard {
  name: string;
  condition: (context: LinterFSMContext) => boolean;
  errorMessage?: string;
  priority?: number;
}

// Linter State Definitions
export interface LinterStateDefinition {
  name: string;
  entry?: (context: LinterFSMContext) => Promise<void>;
  exit?: (context: LinterFSMContext) => Promise<void>;
  invariants?: ((context: LinterFSMContext) => boolean)[];
  timeout?: number;
  onTimeout?: string;
  validations?: ((context: LinterFSMContext) => boolean)[];
  cleanup?: (context: LinterFSMContext) => Promise<void>;
}

export interface LinterTransitionDefinition {
  from: any;
  to: any;
  event: any;
  guards?: LinterTransitionGuard[];
  actions?: ((context: LinterFSMContext) => Promise<void>)[];
  validations?: ((context: LinterFSMContext) => boolean)[];
  priority?: number;
}

// Linter FSM Configuration
export interface LinterFSMConfiguration {
  id: string;
  type: 'api' | 'execution' | 'tool' | 'correlation' | 'websocket';
  initialState: any;
  states: Map<any, LinterStateDefinition>;
  transitions: LinterTransitionDefinition[];
  globalGuards?: LinterTransitionGuard[];
  errorHandler?: (error: Error, context: LinterFSMContext) => Promise<void>;
  logger?: (level: string, message: string, context?: any) => void;
  metrics?: {
    enabled: boolean;
    collectStateMetrics: boolean;
    collectTransitionMetrics: boolean;
    collectPerformanceMetrics: boolean;
  };
}

// Linter Performance Metrics
export interface LinterFSMMetrics {
  totalTransitions: number;
  averageTransitionTime: number;
  stateDistribution: Map<any, number>;
  errorRate: number;
  performanceByState: Map<any, {
    averageDuration: number;
    successRate: number;
    entryCount: number;
    executionTime: number;
  }>;
  lastUpdated: number;

  // Linter-specific metrics
  requestMetrics: {
    totalRequests: number;
    averageProcessingTime: number;
    successRate: number;
    errorsByType: Map<string, number>;
  };

  toolMetrics: {
    executionCounts: Map<string, number>;
    averageExecutionTimes: Map<string, number>;
    successRates: Map<string, number>;
  };

  correlationMetrics: {
    analysisCount: number;
    averageAnalysisTime: number;
    patternsDetected: number;
    clustersGenerated: number;
  };
}

export interface LinterHealthStatus {
  fsmId: string;
  type: 'api' | 'execution' | 'tool' | 'correlation' | 'websocket';
  isHealthy: boolean;
  currentState: any;
  uptime: number;
  lastTransition: number;
  errorCount: number;
  warnings: string[];

  // Linter-specific health indicators
  activeConnections?: number;
  activeExecutions?: number;
  toolsHealthy?: number;
  toolsUnhealthy?: number;
  correlationQueueSize?: number;
  responseLatency?: number;
}

// Export all types
export * from './LinterFSMTypes';