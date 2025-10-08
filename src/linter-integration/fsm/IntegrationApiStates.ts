/**
 * FSM State Definitions for Linter Integration API
 * Defines all possible states and events for the API system
 */

// Core API States
export enum ApiServerState {
  INITIALIZING = 'INITIALIZING',
  IDLE = 'IDLE',
  PROCESSING_REQUEST = 'PROCESSING_REQUEST',
  HANDLING_WEBSOCKET = 'HANDLING_WEBSOCKET',
  RATE_LIMITED = 'RATE_LIMITED',
  ERROR = 'ERROR',
  SHUTTING_DOWN = 'SHUTTING_DOWN',
  STOPPED = 'STOPPED'
}

// Request Processing States
export enum RequestState {
  RECEIVED = 'RECEIVED',
  AUTHENTICATING = 'AUTHENTICATING',
  AUTHORIZED = 'AUTHORIZED',
  ROUTING = 'ROUTING',
  EXECUTING = 'EXECUTING',
  RESPONDING = 'RESPONDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// WebSocket Connection States
export enum WebSocketState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  SUBSCRIBED = 'SUBSCRIBED',
  ACTIVE = 'ACTIVE',
  DISCONNECTING = 'DISCONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR'
}

// Authentication States
export enum AuthState {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  VALIDATING = 'VALIDATING',
  AUTHENTICATED = 'AUTHENTICATED',
  EXPIRED = 'EXPIRED',
  INVALID = 'INVALID'
}

// Rate Limiting States
export enum RateLimitState {
  AVAILABLE = 'AVAILABLE',
  LIMITED = 'LIMITED',
  BLOCKED = 'BLOCKED',
  RESET = 'RESET'
}

// API Events
export enum ApiEvent {
  START_SERVER = 'START_SERVER',
  STOP_SERVER = 'STOP_SERVER',
  REQUEST_RECEIVED = 'REQUEST_RECEIVED',
  WEBSOCKET_CONNECT = 'WEBSOCKET_CONNECT',
  WEBSOCKET_DISCONNECT = 'WEBSOCKET_DISCONNECT',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_FAILURE = 'AUTH_FAILURE',
  RATE_LIMIT_HIT = 'RATE_LIMIT_HIT',
  RATE_LIMIT_RESET = 'RATE_LIMIT_RESET',
  EXECUTION_COMPLETE = 'EXECUTION_COMPLETE',
  EXECUTION_ERROR = 'EXECUTION_ERROR',
  RESPONSE_SENT = 'RESPONSE_SENT',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RECOVERY_INITIATED = 'RECOVERY_INITIATED'
}

// State Context Interfaces
export interface ApiContext {
  serverId: string;
  port: number;
  version: string;
  startTime: number;
  activeConnections: number;
  totalRequests: number;
  errorCount: number;
}

export interface RequestContext {
  requestId: string;
  method: string;
  path: string;
  startTime: number;
  authContext?: AuthenticationContext;
  rateLimitInfo?: RateLimitInfo;
  error?: string;
}

export interface WebSocketContext {
  connectionId: string;
  connectTime: number;
  subscriptions: string[];
  messageCount: number;
  lastActivity: number;
}

export interface AuthenticationContext {
  apiKey: string;
  userId?: string;
  permissions: string[];
  rateLimit: number;
  quotaUsed: number;
  expiresAt: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  windowStart: number;
}

// Transition Guards
export interface StateGuard<T = any> {
  canTransition(fromState: string, toState: string, context: T): boolean;
  validateContext(context: T): boolean;
}

// State Handler Interface
export interface StateHandler<TContext = any, TEvent = any> {
  onEnter?(context: TContext, event?: TEvent): Promise<void>;
  onExit?(context: TContext, event?: TEvent): Promise<void>;
  handleEvent?(event: TEvent, context: TContext): Promise<string | null>;
  validateInvariants?(context: TContext): boolean;
}

// FSM Configuration
export interface StateMachineConfig<TState, TEvent, TContext> {
  initialState: TState;
  states: Record<string, StateHandler<TContext, TEvent>>;
  transitions: Record<string, Record<string, string>>;
  guards?: Record<string, StateGuard<TContext>>;
  context: TContext;
}

// Error Recovery Configuration
export interface ErrorRecoveryConfig {
  maxRetries: number;
  retryDelay: number;
  fallbackState: string;
  enableCircuitBreaker: boolean;
  recoveryActions: string[];
}

// Metrics Collection
export interface StateMetrics {
  stateName: string;
  enterCount: number;
  exitCount: number;
  totalTimeMs: number;
  averageTimeMs: number;
  errorCount: number;
  lastEntered?: number;
  lastExited?: number;
}

export interface TransitionMetrics {
  fromState: string;
  toState: string;
  event: string;
  count: number;
  successCount: number;
  failureCount: number;
  averageDurationMs: number;
  lastTransition?: number;
}

// Type Guards
export function isApiServerState(state: any): state is ApiServerState {
  return Object.values(ApiServerState).includes(state);
}

export function isRequestState(state: any): state is RequestState {
  return Object.values(RequestState).includes(state);
}

export function isWebSocketState(state: any): state is WebSocketState {
  return Object.values(WebSocketState).includes(state);
}

export function isAuthState(state: any): state is AuthState {
  return Object.values(AuthState).includes(state);
}

export function isRateLimitState(state: any): state is RateLimitState {
  return Object.values(RateLimitState).includes(state);
}

export function isApiEvent(event: any): event is ApiEvent {
  return Object.values(ApiEvent).includes(event);
}

/*
 * CODEX AGENT 036 - FSM State Definitions
 * Status: OK | NASA Rule 10 Compliant
 * Run ID: integration-api-fsm-states-001
 * Created: 2025-09-28T11:45:23-04:00
 */