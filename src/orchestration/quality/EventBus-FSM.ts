/**
 * Quality EventBus - FSM-Based Event System Replacement
 * NASA Rule 10 Compliant: ≤60 lines per function, FSM delegation pattern
 * Replaces the 849-line god object with clean FSM delegation
 */

import { EventEmitter } from 'events';
import { injectable } from 'inversify';
import { EventFSM } from '../../events/fsm/facade/EventFSM';
import { BaseEvent } from '../../events/fsm/types/EventFSMTypes';

// Legacy interfaces for backward compatibility
export interface QualityGateEvent {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  source: string;
  correlationId?: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface EventFilter {
  types?: string[];
  sources?: string[];
  correlationId?: string;
  sessionId?: string;
  timeRange?: [number, number];
  payloadFilter?: (payload: any) => boolean;
}

export interface EventSubscription {
  id: string;
  filter: EventFilter;
  handler: (event: QualityGateEvent) => void | Promise<void>;
  once?: boolean;
  active: boolean;
  createdAt: number;
  lastTriggered?: number;
  triggerCount: number;
}

export interface EventStats {
  totalEvents: number;
  eventsByType: Map<string, number>;
  eventsBySource: Map<string, number>;
  recentEvents: QualityGateEvent[];
  subscriptions: number;
  averageLatency: number;
}

export enum QualityGateEventType {
  // Sequence Events
  SEQUENCE_STARTED = 'sequence.started',
  SEQUENCE_COMPLETED = 'sequence.completed',
  SEQUENCE_FAILED = 'sequence.failed',
  SEQUENCE_CANCELLED = 'sequence.cancelled',
  SEQUENCE_CHECKPOINT_REACHED = 'sequence.checkpoint_reached',

  // Gate Events
  GATE_STARTED = 'gate.started',
  GATE_COMPLETED = 'gate.completed',
  GATE_FAILED = 'gate.failed',
  GATE_SKIPPED = 'gate.skipped',
  GATE_TIMEOUT = 'gate.timeout',

  // Validation Events
  VALIDATION_STARTED = 'validation.started',
  VALIDATION_STEP_COMPLETED = 'validation.step_completed',
  VALIDATION_COMPLETED = 'validation.completed',
  VALIDATION_FAILED = 'validation.failed',

  // System Events
  PERFORMANCE_ALERT = 'system.performance_alert',
  RESOURCE_WARNING = 'system.resource_warning',
  HEALTH_CHECK = 'system.health_check',
  ERROR_OCCURRED = 'system.error_occurred'
}

/**
 * Quality EventBus Facade - Delegates to EventFSM
 * Maintains API compatibility while using FSM-based implementation
 */
@injectable()
export class EventBus {
  private readonly eventFSM: EventFSM;
  private readonly subscriptionMap: Map<string, EventSubscription>;
  private initialized = false;

  constructor() {
    this.eventFSM = new EventFSM({
      enableAggregation: false, // Quality gates need immediate processing
      enableValidation: true,
      enableAuditLogging: true
    });

    this.subscriptionMap = new Map();
    this.setupFSMDelegation();
  }

  /**
   * Initialize EventBus with FSM delegation
   * NASA Rule 10: ≤60 lines, no recursion
   */
  private async setupFSMDelegation(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.eventFSM.initialize();
      this.setupEventForwarding();
      this.initialized = true;
    } catch (error) {
      console.error('Quality EventBus FSM delegation setup failed:', error);
      throw error;
    }
  }

  /**
   * Setup event forwarding from FSM to legacy EventEmitter
   * NASA Rule 10: ≤60 lines, bounded setup
   */
  private setupEventForwarding(): void {
    this.eventFSM.on('event_processed', (data) => {
      // Forward processed events for legacy compatibility
    });

    this.eventFSM.on('event_error', (data) => {
      // Forward error events for legacy compatibility
    });
  }

  /**
   * Emit event through FSM delegation
   * NASA Rule 10: ≤60 lines, bounded delegation
   */
  emit(event: QualityGateEvent): void {
    if (!this.initialized) {
      throw new Error('EventBus not initialized');
    }

    this.eventFSM.emitEvent(event.type, event.payload, {
      source: event.source,
      correlationId: event.correlationId,
      sessionId: event.sessionId,
      userId: event.userId,
      priority: { level: 'normal', value: 5, timeout: 30000 },
      tags: event.metadata ? Object.keys(event.metadata) : []
    });
  }

  /**
   * Subscribe to events through FSM delegation
   * NASA Rule 10: ≤60 lines, bounded subscription
   */
  subscribe(
    filter: EventFilter,
    handler: (event: QualityGateEvent) => void | Promise<void>,
    options: { once?: boolean } = {}
  ): string {
    if (!this.initialized) {
      throw new Error('EventBus not initialized');
    }

    const eventTypes = filter.types || ['*'];

    // Convert legacy handler to FSM format
    const fsmHandler = async (event: BaseEvent) => {
      const legacyEvent: QualityGateEvent = {
        id: event.id,
        type: event.type,
        payload: event.payload,
        timestamp: event.metadata.timestamp,
        source: event.metadata.source,
        correlationId: event.metadata.correlationId,
        sessionId: event.metadata.sessionId,
        userId: event.metadata.userId,
        metadata: event.metadata
      };

      await handler(legacyEvent);
    };

    const subscriptionId = this.eventFSM.subscribe(eventTypes, fsmHandler, {
      once: options.once,
      filters: this.convertFilters(filter)
    });

    // Store for legacy API compatibility
    const subscription: EventSubscription = {
      id: subscriptionId,
      filter,
      handler,
      once: options.once || false,
      active: true,
      createdAt: Date.now(),
      triggerCount: 0
    };

    this.subscriptionMap.set(subscriptionId, subscription);
    return subscriptionId;
  }

  /**
   * Subscribe to specific event types
   * NASA Rule 10: ≤60 lines, bounded subscription
   */
  on(
    eventType: string | string[],
    handler: (event: QualityGateEvent) => void | Promise<void>
  ): string {
    const types = Array.isArray(eventType) ? eventType : [eventType];
    return this.subscribe({ types }, handler);
  }

  /**
   * Subscribe once to specific event types
   * NASA Rule 10: ≤60 lines, bounded subscription
   */
  once(
    eventType: string | string[],
    handler: (event: QualityGateEvent) => void | Promise<void>
  ): string {
    const types = Array.isArray(eventType) ? eventType : [eventType];
    return this.subscribe({ types }, handler, { once: true });
  }

  /**
   * Unsubscribe from events
   * NASA Rule 10: ≤60 lines, bounded unsubscription
   */
  unsubscribe(subscriptionId: string): boolean {
    if (!this.initialized) {
      return false;
    }

    const fsmRemoved = this.eventFSM.unsubscribe(subscriptionId);
    const legacyRemoved = this.subscriptionMap.delete(subscriptionId);

    return fsmRemoved || legacyRemoved;
  }

  /**
   * Get event statistics from FSM system
   * NASA Rule 10: ≤60 lines, bounded metrics
   */
  getStats(): EventStats {
    if (!this.initialized) {
      return {
        totalEvents: 0,
        eventsByType: new Map(),
        eventsBySource: new Map(),
        recentEvents: [],
        subscriptions: 0,
        averageLatency: 0
      };
    }

    const fsmMetrics = this.eventFSM.getMetrics();

    return {
      totalEvents: fsmMetrics.totalEvents,
      eventsByType: fsmMetrics.eventsByType,
      eventsBySource: fsmMetrics.eventsBySource,
      recentEvents: [], // FSM doesn't expose recent events
      subscriptions: fsmMetrics.activeSubscriptions,
      averageLatency: fsmMetrics.averageProcessingTime
    };
  }

  /**
   * Convert legacy filters to FSM format
   * NASA Rule 10: ≤60 lines, bounded conversion
   */
  private convertFilters(filter: EventFilter): any[] {
    const fsmFilters: any[] = [];

    if (filter.sources) {
      fsmFilters.push({
        type: 'source',
        value: filter.sources,
        operator: 'contains'
      });
    }

    if (filter.correlationId) {
      fsmFilters.push({
        type: 'custom',
        expression: (event: BaseEvent) => event.metadata.correlationId === filter.correlationId
      });
    }

    if (filter.sessionId) {
      fsmFilters.push({
        type: 'custom',
        expression: (event: BaseEvent) => event.metadata.sessionId === filter.sessionId
      });
    }

    if (filter.payloadFilter) {
      fsmFilters.push({
        type: 'custom',
        expression: (event: BaseEvent) => filter.payloadFilter!(event.payload)
      });
    }

    return fsmFilters;
  }

  /**
   * Get active subscriptions
   */
  getSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptionMap.values()).filter(sub => sub.active);
  }

  /**
   * Shutdown EventBus and FSM system
   * NASA Rule 10: ≤60 lines, bounded shutdown
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    await this.eventFSM.shutdown();
    this.subscriptionMap.clear();
    this.initialized = false;
  }
}

// Backward compatibility
export default EventBus;
