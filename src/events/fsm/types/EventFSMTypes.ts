import { ValidationResult } from '../../../types/validation-types';

/**
 * Event FSM Types - Core Type Definitions for Event System
 * Provides comprehensive type safety for FSM-based event handling
 */

export enum EventStates {
  IDLE = 'idle',
  LISTENING = 'listening',
  VALIDATING = 'validating',
  ROUTING = 'routing',
  PROCESSING = 'processing',
  RESPONDING = 'responding',
  ERROR = 'error',
  SHUTDOWN = 'shutdown'
}

export enum EventEvents {
  START_LISTENING = 'start_listening',
  EVENT_RECEIVED = 'event_received',
  VALIDATION_COMPLETE = 'validation_complete',
  VALIDATION_FAILED = 'validation_failed',
  ROUTING_COMPLETE = 'routing_complete',
  ROUTING_FAILED = 'routing_failed',
  PROCESSING_COMPLETE = 'processing_complete',
  PROCESSING_FAILED = 'processing_failed',
  RESPONSE_SENT = 'response_sent',
  ERROR_OCCURRED = 'error_occurred',
  SHUTDOWN_REQUESTED = 'shutdown_requested',
  RESET = 'reset'
}

export interface EventPriority {
  level: 'low' | 'normal' | 'high' | 'critical';
  value: number;
  timeout: number;
}

export interface EventMetadata {
  eventId: string;
  timestamp: number;
  source: string;
  correlationId?: string;
  sessionId?: string;
  userId?: string;
  retryCount: number;
  maxRetries: number;
  ttl: number;
  priority: EventPriority;
  tags: string[];
  processingTime?: number;
}

export interface BaseEvent {
  id: string;
  type: string;
  payload: any;
  metadata: EventMetadata;
  filters?: EventFilter[];
}

export interface EventFilter {
  type: 'source' | 'type' | 'priority' | 'tags' | 'custom';
  value: any;
  operator: 'equals' | 'not_equals' | 'contains' | 'regex' | 'function';
  expression?: string | Function;
}

export interface EventSubscription {
  id: string;
  subscriberId: string;
  eventTypes: string[];
  filters: EventFilter[];
  priority: number;
  callback: (event: BaseEvent) => Promise<void> | void;
  metadata: SubscriptionMetadata;
  config: SubscriptionConfig;
}

export interface SubscriptionMetadata {
  created: Date;
  lastTriggered?: Date;
  triggerCount: number;
  errorCount: number;
  active: boolean;
}

export interface SubscriptionConfig {
  once?: boolean;
  retryPolicy?: RetryPolicy;
  deadLetterQueue?: boolean;
  timeout?: number;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  retryableErrors: string[];
}

export interface EventRoute {
  id: string;
  pattern: string;
  target: string;
  priority: number;
  conditions: RouteCondition[];
  transformation?: (event: BaseEvent) => BaseEvent;
}

export interface RouteCondition {
  type: 'source' | 'event_type' | 'payload' | 'metadata';
  field: string;
  operator: 'equals' | 'contains' | 'matches' | 'exists';
  value: any;
}

export interface EventProcessingContext {
  currentState: EventStates;
  event?: BaseEvent;
  subscriptions: EventSubscription[];
  routes: EventRoute[];
  processingStart: number;
  validationResults: ValidationResult[];
  routingResults: RoutingResult[];
  processingResults: ProcessingResult[];
  errors: EventError[];
  metadata: Record<string, any>;
}


export interface RoutingResult {
  routeId: string;
  target: string;
  matched: boolean;
  duration: number;
  error?: string;
}

export interface ProcessingResult {
  subscriptionId: string;
  status: 'success' | 'error' | 'timeout';
  duration: number;
  result?: any;
  error?: string;
}

export interface EventError {
  type: string;
  message: string;
  stack?: string;
  timestamp: number;
  context?: any;
}

export interface EventTransition {
  from: EventStates;
  to: EventStates;
  event: EventEvents;
  guard?: (context: EventProcessingContext) => boolean;
  action?: (context: EventProcessingContext) => Promise<void>;
}

export interface EventStateMachineConfig {
  initialState: EventStates;
  transitions: EventTransition[];
  maxConcurrentEvents: number;
  defaultTimeout: number;
  retryPolicy: RetryPolicy;
  enableMetrics: boolean;
  enableAuditLog: boolean;
}

export interface EventMetrics {
  totalEvents: number;
  eventsByType: Map<string, number>;
  eventsBySource: Map<string, number>;
  eventsByPriority: Map<string, number>;
  averageProcessingTime: number;
  errorRate: number;
  throughputPerSecond: number;
  activeSubscriptions: number;
  queueLength: number;
  memoryUsage: number;
}

export interface EventAuditEntry {
  id: string;
  timestamp: number;
  state: EventStates;
  event: EventEvents;
  eventData?: BaseEvent;
  context: Partial<EventProcessingContext>;
  duration?: number;
  result?: any;
  error?: string;
}

export interface EventPattern {
  id: string;
  name: string;
  description: string;
  sequence: string[];
  timeWindow: number;
  minOccurrences: number;
  maxOccurrences?: number;
  action: PatternAction;
  enabled: boolean;
}

export interface PatternAction {
  type: 'emit' | 'notify' | 'execute' | 'transition';
  target?: string;
  payload?: any;
  callback?: (events: BaseEvent[]) => void;
}

export interface EventStore {
  store(event: BaseEvent): Promise<void>;
  retrieve(filters: EventStoreFilter): Promise<BaseEvent[]>;
  count(filters: EventStoreFilter): Promise<number>;
  cleanup(olderThan: number): Promise<number>;
}

export interface EventStoreFilter {
  eventTypes?: string[];
  sources?: string[];
  timeRange?: { start: number; end: number };
  tags?: string[];
  priority?: string[];
  limit?: number;
  offset?: number;
}

export interface EventMiddleware {
  name: string;
  priority: number;
  preProcess?: (event: BaseEvent) => Promise<BaseEvent | null>;
  postProcess?: (event: BaseEvent, result: any) => Promise<void>;
  onError?: (event: BaseEvent, error: Error) => Promise<void>;
}

export interface EventQueueItem {
  event: BaseEvent;
  priority: number;
  timestamp: number;
  retryCount: number;
  deadline: number;
}

export const EVENT_PRIORITIES: Record<string, EventPriority> = {
  LOW: { level: 'low', value: 1, timeout: 60000 },
  NORMAL: { level: 'normal', value: 5, timeout: 30000 },
  HIGH: { level: 'high', value: 8, timeout: 15000 },
  CRITICAL: { level: 'critical', value: 10, timeout: 5000 }
};

export const DEFAULT_EVENT_CONFIG: EventStateMachineConfig = {
  initialState: EventStates.IDLE,
  transitions: [], // Will be populated by TransitionHub
  maxConcurrentEvents: 1000,
  defaultTimeout: 30000,
  retryPolicy: {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
    retryableErrors: ['timeout', 'network_error', 'temporary_failure']
  },
  enableMetrics: true,
  enableAuditLog: true
};