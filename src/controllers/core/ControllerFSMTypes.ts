/**
 * Unified Controller FSM Types
 * Shared types for all FSM-based controllers
 *
 * Eliminates god objects by providing common state management,
 * event handling, and transition patterns for all controllers
 */

// Unified Controller States (all controllers flow through these)
export enum UnifiedControllerState {
  IDLE = 'idle',
  VALIDATING = 'validating',
  PROCESSING = 'processing',
  RESPONDING = 'responding',
  LOGGING = 'logging',
  COMPLETE = 'complete',
  ERROR = 'error',
  RECOVERING = 'recovering'
}

// Unified Controller Events
export enum UnifiedControllerEvent {
  START = 'start',
  VALIDATE = 'validate',
  PROCESS = 'process',
  RESPOND = 'respond',
  LOG = 'log',
  COMPLETE = 'complete',
  ERROR = 'error',
  RECOVER = 'recover',
  RESET = 'reset'
}

// Base request/response types
export interface ControllerRequest {
  id: string;
  type: string;
  payload: Record<string, any>;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ControllerResponse {
  id: string;
  requestId: string;
  status: 'success' | 'error' | 'partial';
  data?: any;
  error?: ControllerError;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ControllerError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

// FSM Context shared across all controllers
export interface ControllerContext {
  requestId: string;
  currentState: UnifiedControllerState;
  previousState?: UnifiedControllerState;
  request?: ControllerRequest;
  response?: ControllerResponse;
  errors: ControllerError[];
  startTime: Date;
  metadata: Record<string, any>;
}

// Transition definition
export interface StateTransition {
  from: UnifiedControllerState;
  to: UnifiedControllerState;
  event: UnifiedControllerEvent;
  guard?: (context: ControllerContext) => boolean;
  action?: (context: ControllerContext) => Promise<void>;
}

// State handler interface
export interface StateHandler {
  state: UnifiedControllerState;
  onEntry?: (context: ControllerContext) => Promise<void>;
  onExit?: (context: ControllerContext) => Promise<void>;
  handleEvent: (event: UnifiedControllerEvent, context: ControllerContext) => Promise<UnifiedControllerState>;
}

// Component interfaces for composition
export interface RequestValidator {
  validate(request: ControllerRequest): Promise<boolean>;
  getValidationErrors(): ControllerError[];
}

export interface RequestProcessor {
  process(request: ControllerRequest, context: ControllerContext): Promise<any>;
}

export interface ResponseBuilder {
  buildSuccess(data: any, requestId: string): ControllerResponse;
  buildError(error: ControllerError, requestId: string): ControllerResponse;
  buildPartial(data: any, error: ControllerError, requestId: string): ControllerResponse;
}

export interface MetricsCollector {
  recordRequest(request: ControllerRequest): void;
  recordResponse(response: ControllerResponse): void;
  recordError(error: ControllerError): void;
  recordDuration(requestId: string, duration: number): void;
}

export interface ControllerLogger {
  logStateTransition(from: UnifiedControllerState, to: UnifiedControllerState, event: UnifiedControllerEvent): void;
  logRequest(request: ControllerRequest): void;
  logResponse(response: ControllerResponse): void;
  logError(error: ControllerError): void;
}

// Specialized controller types
export interface CanaryControllerContext extends ControllerContext {
  deploymentId?: string;
  canaryConfig?: any;
  trafficStatus?: any;
}

export interface DebugControllerContext extends ControllerContext {
  errorReports?: any[];
  analysis?: any;
  assignments?: any[];
}

export interface DevelopmentControllerContext extends ControllerContext {
  specDocument?: any;
  planDocument?: any;
  phases?: any[];
}

export interface CycleControllerContext extends ControllerContext {
  iteration?: number;
  maxIterations?: number;
  errors?: string[];
}