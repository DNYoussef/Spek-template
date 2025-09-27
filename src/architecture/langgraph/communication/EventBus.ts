/**
 * EventBus - Event-Driven Communication with State Change Notifications
 * Provides a centralized event bus for Princess state machines with support for
 * event filtering, priority handling, and automatic state synchronization.
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import PrincessStateMachine from '../state-machines/PrincessStateMachine';

export interface SystemEvent {
  id: string;
  type: string;
  source: string;
  target?: string | string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: any;
  metadata: {
    timestamp: Date;
    correlationId?: string;
    causedBy?: string;
    ttl?: number;
    retryCount: number;
    maxRetries: number;
  };
  filters?: EventFilter[];
}

export interface EventFilter {
  type: 'source' | 'target' | 'event_type' | 'payload_contains' | 'custom';
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
  callback: (event: SystemEvent) => Promise<void> | void;
  metadata: {
    created: Date;
    lastTriggered?: Date;
    triggerCount: number;
    errorCount: number;
  };
}

export interface EventMiddleware {
  name: string;
  priority: number;
  preProcess?: (event: SystemEvent) => Promise<SystemEvent | null>;
  postProcess?: (event: SystemEvent, result: any) => Promise<void>;
  onError?: (event: SystemEvent, error: Error) => Promise<void>;
}

export interface EventMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySource: Record<string, number>;
  averageProcessingTime: number;
  errorRate: number;
  subscriptionCount: number;
  activeSubscriptions: number;
  queueLength: number;
}

export interface EventPattern {
  id: string;
  name: string;
  description: string;
  pattern: {
    sequence: string[];
    timeWindow: number;
    minOccurrences: number;
    maxOccurrences?: number;
  };
  action: {
    type: 'emit' | 'notify' | 'execute' | 'transition';
    target?: string;
    payload?: any;
  };
  enabled: boolean;
}

export class EventBus extends EventEmitter {
  private subscriptions: Map<string, EventSubscription>;
  private eventQueue: SystemEvent[];
  private middleware: EventMiddleware[];
  private patterns: Map<string, EventPattern>;
  private eventHistory: SystemEvent[];
  private metrics: EventMetrics;
  private processingActive: boolean;
  private eventCounter: number;
  private patternMatching: boolean;
  private recentEvents: Map<string, SystemEvent[]>; // For pattern matching

  constructor() {
    super();
    
    this.subscriptions = new Map();
    this.eventQueue = [];
    this.middleware = [];
    this.patterns = new Map();
    this.eventHistory = [];
    this.recentEvents = new Map();
    this.processingActive = false;
    this.eventCounter = 0;
    this.patternMatching = true;

    this.metrics = {
      totalEvents: 0,
      eventsByType: {},
      eventsBySource: {},
      averageProcessingTime: 0,
      errorRate: 0,
      subscriptionCount: 0,
      activeSubscriptions: 0,
      queueLength: 0
    };

    this.initializeEventProcessing();
    this.initializeBuiltInPatterns();
  }

  /**
   * Emit an event to the event bus
   */
  async emitEvent(
    type: string,
    source: string,
    payload: any = {},
    options: Partial<SystemEvent> = {}
  ): Promise<void> {
    const event: SystemEvent = {
      id: this.generateEventId(),
      type,
      source,
      target: options.target,
      priority: options.priority || 'medium',
      payload,
      metadata: {
        timestamp: new Date(),
        correlationId: options.metadata?.correlationId,
        causedBy: options.metadata?.causedBy,
        ttl: options.metadata?.ttl || 300000, // 5 minutes default
        retryCount: 0,
        maxRetries: options.metadata?.maxRetries || 3
      },
      filters: options.filters
    };

    await this.queueEvent(event);
  }

  /**
   * Subscribe to events with filters
   */
  subscribe(
    subscriberId: string,
    eventTypes: string | string[],
    callback: (event: SystemEvent) => Promise<void> | void,
    filters: EventFilter[] = [],
    priority: number = 100
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    const eventTypeArray = Array.isArray(eventTypes) ? eventTypes : [eventTypes];

    const subscription: EventSubscription = {
      id: subscriptionId,
      subscriberId,
      eventTypes: eventTypeArray,
      filters,
      priority,
      callback,
      metadata: {
        created: new Date(),
        triggerCount: 0,
        errorCount: 0
      }
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.updateSubscriptionMetrics();

    this.emit('subscriptionAdded', subscription);
    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    const removed = this.subscriptions.delete(subscriptionId);
    if (removed) {
      this.updateSubscriptionMetrics();
      this.emit('subscriptionRemoved', subscriptionId);
    }
    return removed;
  }

  /**
   * Add middleware for event processing
   */
  addMiddleware(middleware: EventMiddleware): void {
    this.middleware.push(middleware);
    this.middleware.sort((a, b) => b.priority - a.priority);
    this.emit('middlewareAdded', middleware);
  }

  /**
   * Remove middleware
   */
  removeMiddleware(name: string): boolean {
    const index = this.middleware.findIndex(m => m.name === name);
    if (index >= 0) {
      this.middleware.splice(index, 1);
      this.emit('middlewareRemoved', name);
      return true;
    }
    return false;
  }

  /**
   * Add event pattern for complex event processing
   */
  addPattern(pattern: EventPattern): void {
    this.patterns.set(pattern.id, pattern);
    this.emit('patternAdded', pattern);
  }

  /**
   * Remove event pattern
   */
  removePattern(patternId: string): boolean {
    const removed = this.patterns.delete(patternId);
    if (removed) {
      this.emit('patternRemoved', patternId);
    }
    return removed;
  }

  /**
   * Get event metrics
   */
  getMetrics(): EventMetrics {
    this.metrics.queueLength = this.eventQueue.length;
    return { ...this.metrics };
  }

  /**
   * Get event history
   */
  getEventHistory(limit: number = 100, filters?: EventFilter[]): SystemEvent[] {
    let history = this.eventHistory.slice(-limit);

    if (filters && filters.length > 0) {
      history = history.filter(event => this.matchesFilters(event, filters));
    }

    return history;
  }

  /**
   * Get active subscriptions
   */
  getSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
    this.recentEvents.clear();
  }

  /**
   * Enable/disable pattern matching
   */
  setPatternMatching(enabled: boolean): void {
    this.patternMatching = enabled;
  }

  /**
   * Register a Princess state machine for automatic event handling
   */
  registerPrincess(princessId: string, stateMachine: PrincessStateMachine): void {
    // Subscribe to state changes
    stateMachine.on('stateChanged', (oldState, newState) => {
      this.emitEvent('princess.state.changed', princessId, {
        oldState,
        newState,
        timestamp: new Date()
      });
    });

    // Subscribe to task events
    stateMachine.on('taskCompleted', (taskId, result) => {
      this.emitEvent('princess.task.completed', princessId, {
        taskId,
        result,
        timestamp: new Date()
      });
    });

    stateMachine.on('taskFailed', (taskId, error) => {
      this.emitEvent('princess.task.failed', princessId, {
        taskId,
        error: error.message,
        timestamp: new Date()
      });
    });

    // Subscribe to error events
    stateMachine.on('error', (error) => {
      this.emitEvent('princess.error', princessId, {
        error: error.message,
        stack: error.stack,
        timestamp: new Date()
      }, { priority: 'high' });
    });

    this.emit('princessRegistered', princessId);
  }

  /**
   * Private methods
   */
  private async queueEvent(event: SystemEvent): Promise<void> {
    // Apply preprocessing middleware
    let processedEvent = event;
    for (const middleware of this.middleware) {
      if (middleware.preProcess) {
        try {
          const result = await middleware.preProcess(processedEvent);
          if (result === null) {
            // Event was filtered out by middleware
            return;
          }
          processedEvent = result;
        } catch (error) {
          if (middleware.onError) {
            await middleware.onError(processedEvent, error);
          }
        }
      }
    }

    // Add to queue based on priority
    this.insertEventByPriority(processedEvent);
    
    // Update metrics
    this.updateEventMetrics(processedEvent);

    // Store in history
    this.eventHistory.push(processedEvent);
    if (this.eventHistory.length > 10000) {
      this.eventHistory.shift(); // Keep only last 10k events
    }

    // Store for pattern matching
    if (this.patternMatching) {
      this.storeForPatternMatching(processedEvent);
    }

    this.emit('eventQueued', processedEvent);
  }

  private insertEventByPriority(event: SystemEvent): void {
    const priorityValues = { critical: 4, high: 3, medium: 2, low: 1 };
    const eventPriority = priorityValues[event.priority] || 1;

    let insertIndex = 0;
    for (let i = 0; i < this.eventQueue.length; i++) {
      const queuedPriority = priorityValues[this.eventQueue[i].priority] || 1;
      if (eventPriority > queuedPriority) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }

    this.eventQueue.splice(insertIndex, 0, event);
  }

  private initializeEventProcessing(): void {
    // Process events every 10ms
    setInterval(() => {
      if (!this.processingActive && this.eventQueue.length > 0) {
        this.processEvents();
      }
    }, 10);

    // Clean up expired events every minute
    setInterval(() => {
      this.cleanupExpiredEvents();
    }, 60000);

    // Update metrics every 5 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 5000);

    // Check patterns every 100ms
    setInterval(() => {
      if (this.patternMatching) {
        this.checkPatterns();
      }
    }, 100);
  }

  private async processEvents(): Promise<void> {
    if (this.processingActive) return;
    
    this.processingActive = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.processEvent(event);
      }
    } catch (error) {
      console.error('Error processing events:', error);
    } finally {
      this.processingActive = false;
    }
  }

  private async processEvent(event: SystemEvent): Promise<void> {
    const startTime = Date.now();

    try {
      // Check if event has expired
      if (this.isEventExpired(event)) {
        return;
      }

      // Find matching subscriptions
      const matchingSubscriptions = this.findMatchingSubscriptions(event);

      // Process subscriptions in priority order
      matchingSubscriptions.sort((a, b) => b.priority - a.priority);

      const promises = matchingSubscriptions.map(async (subscription) => {
        try {
          await subscription.callback(event);
          subscription.metadata.lastTriggered = new Date();
          subscription.metadata.triggerCount++;
        } catch (error) {
          subscription.metadata.errorCount++;
          this.handleSubscriptionError(subscription, event, error);
        }
      });

      await Promise.all(promises);

      // Apply postprocessing middleware
      for (const middleware of this.middleware) {
        if (middleware.postProcess) {
          try {
            await middleware.postProcess(event, null);
          } catch (error) {
            if (middleware.onError) {
              await middleware.onError(event, error);
            }
          }
        }
      }

      // Update processing time metrics
      const processingTime = Date.now() - startTime;
      this.updateProcessingTimeMetrics(processingTime);

      this.emit('eventProcessed', event, processingTime);

    } catch (error) {
      this.handleEventError(event, error);
    }
  }

  private findMatchingSubscriptions(event: SystemEvent): EventSubscription[] {
    const matching: EventSubscription[] = [];

    for (const subscription of this.subscriptions.values()) {
      // Check event type match
      if (!subscription.eventTypes.includes('*') && 
          !subscription.eventTypes.includes(event.type)) {
        continue;
      }

      // Check target match (if specified)
      if (event.target && !this.matchesTarget(event.target, subscription.subscriberId)) {
        continue;
      }

      // Check filters
      if (subscription.filters.length > 0 && !this.matchesFilters(event, subscription.filters)) {
        continue;
      }

      matching.push(subscription);
    }

    return matching;
  }

  private matchesTarget(target: string | string[], subscriberId: string): boolean {
    if (Array.isArray(target)) {
      return target.includes(subscriberId);
    }
    return target === subscriberId || target === '*';
  }

  private matchesFilters(event: SystemEvent, filters: EventFilter[]): boolean {
    for (const filter of filters) {
      if (!this.matchesFilter(event, filter)) {
        return false;
      }
    }
    return true;
  }

  private matchesFilter(event: SystemEvent, filter: EventFilter): boolean {
    let value: any;

    switch (filter.type) {
      case 'source':
        value = event.source;
        break;
      case 'target':
        value = event.target;
        break;
      case 'event_type':
        value = event.type;
        break;
      case 'payload_contains':
        value = JSON.stringify(event.payload);
        break;
      case 'custom':
        if (filter.expression && typeof filter.expression === 'function') {
          return filter.expression(event);
        }
        return true;
      default:
        return true;
    }

    switch (filter.operator) {
      case 'equals':
        return value === filter.value;
      case 'not_equals':
        return value !== filter.value;
      case 'contains':
        return String(value).includes(String(filter.value));
      case 'regex':
        const regex = new RegExp(filter.value);
        return regex.test(String(value));
      case 'function':
        if (typeof filter.expression === 'function') {
          return filter.expression(value, filter.value, event);
        }
        return true;
      default:
        return true;
    }
  }

  private isEventExpired(event: SystemEvent): boolean {
    if (!event.metadata.ttl) return false;
    
    const now = Date.now();
    const eventTime = event.metadata.timestamp.getTime();
    return (now - eventTime) > event.metadata.ttl;
  }

  private storeForPatternMatching(event: SystemEvent): void {
    const eventType = event.type;
    
    if (!this.recentEvents.has(eventType)) {
      this.recentEvents.set(eventType, []);
    }

    const events = this.recentEvents.get(eventType)!;
    events.push(event);

    // Keep only recent events (last 1000 per type)
    if (events.length > 1000) {
      events.shift();
    }
  }

  private checkPatterns(): void {
    for (const pattern of this.patterns.values()) {
      if (pattern.enabled) {
        this.checkPattern(pattern);
      }
    }
  }

  private checkPattern(pattern: EventPattern): void {
    const sequence = pattern.pattern.sequence;
    const timeWindow = pattern.pattern.timeWindow;
    const now = Date.now();

    // Check if we have all required event types
    let hasAllTypes = true;
    const eventSequence: SystemEvent[] = [];

    for (const eventType of sequence) {
      const events = this.recentEvents.get(eventType) || [];
      const recentEvents = events.filter(
        event => (now - event.metadata.timestamp.getTime()) <= timeWindow
      );

      if (recentEvents.length === 0) {
        hasAllTypes = false;
        break;
      }

      // Take the most recent event of this type
      eventSequence.push(recentEvents[recentEvents.length - 1]);
    }

    if (hasAllTypes) {
      // Check if events occurred in sequence within time window
      const isSequential = this.isSequentialPattern(eventSequence, timeWindow);
      
      if (isSequential) {
        // Count occurrences
        const occurrences = this.countPatternOccurrences(pattern, timeWindow);
        
        if (occurrences >= pattern.pattern.minOccurrences &&
            (!pattern.pattern.maxOccurrences || occurrences <= pattern.pattern.maxOccurrences)) {
          
          this.executePatternAction(pattern, eventSequence);
        }
      }
    }
  }

  private isSequentialPattern(events: SystemEvent[], timeWindow: number): boolean {
    if (events.length < 2) return true;

    // Sort events by timestamp
    const sortedEvents = [...events].sort(
      (a, b) => a.metadata.timestamp.getTime() - b.metadata.timestamp.getTime()
    );

    // Check if all events fall within the time window
    const firstTime = sortedEvents[0].metadata.timestamp.getTime();
    const lastTime = sortedEvents[sortedEvents.length - 1].metadata.timestamp.getTime();

    return (lastTime - firstTime) <= timeWindow;
  }

  private countPatternOccurrences(pattern: EventPattern, timeWindow: number): number {
    // Simplified counting - in production, would use sliding window
    const now = Date.now();
    const sequence = pattern.pattern.sequence;
    
    let minCount = Infinity;
    
    for (const eventType of sequence) {
      const events = this.recentEvents.get(eventType) || [];
      const recentCount = events.filter(
        event => (now - event.metadata.timestamp.getTime()) <= timeWindow
      ).length;
      
      minCount = Math.min(minCount, recentCount);
    }

    return minCount === Infinity ? 0 : minCount;
  }

  private async executePatternAction(pattern: EventPattern, triggerEvents: SystemEvent[]): Promise<void> {
    try {
      switch (pattern.action.type) {
        case 'emit':
          await this.emitEvent(
            `pattern.${pattern.id}`,
            'event-bus',
            {
              patternId: pattern.id,
              patternName: pattern.name,
              triggerEvents: triggerEvents.map(e => ({ id: e.id, type: e.type, source: e.source })),
              ...pattern.action.payload
            },
            { priority: 'high' }
          );
          break;

        case 'notify':
          if (pattern.action.target) {
            await this.emitEvent(
              'pattern.notification',
              'event-bus',
              {
                patternId: pattern.id,
                patternName: pattern.name,
                message: `Pattern ${pattern.name} detected`,
                triggerEvents
              },
              { target: pattern.action.target, priority: 'medium' }
            );
          }
          break;

        case 'execute':
          // Would execute custom logic here
          this.emit('patternExecute', pattern, triggerEvents);
          break;

        case 'transition':
          if (pattern.action.target) {
            await this.emitEvent(
              'princess.transition.request',
              'event-bus',
              {
                princessId: pattern.action.target,
                trigger: 'pattern_detected',
                context: {
                  patternId: pattern.id,
                  triggerEvents
                }
              },
              { target: pattern.action.target, priority: 'high' }
            );
          }
          break;
      }

      this.emit('patternTriggered', pattern, triggerEvents);

    } catch (error) {
      console.error(`Error executing pattern action for ${pattern.id}:`, error);
    }
  }

  private handleSubscriptionError(
    subscription: EventSubscription,
    event: SystemEvent,
    error: Error
  ): void {
    this.emit('subscriptionError', subscription, event, error);
    
    // Could implement automatic retry logic here
    if (subscription.metadata.errorCount > 10) {
      // Temporarily disable problematic subscription
      this.emit('subscriptionDisabled', subscription.id, 'Too many errors');
    }
  }

  private handleEventError(event: SystemEvent, error: Error): void {
    this.emit('eventError', event, error);
    
    // Retry logic for failed events
    if (event.metadata.retryCount < event.metadata.maxRetries) {
      event.metadata.retryCount++;
      
      // Re-queue with delay
      setTimeout(() => {
        this.eventQueue.unshift(event);
      }, 1000 * Math.pow(2, event.metadata.retryCount)); // Exponential backoff
    }
  }

  private cleanupExpiredEvents(): void {
    const now = Date.now();
    
    // Remove expired events from queue
    this.eventQueue = this.eventQueue.filter(event => !this.isEventExpired(event));
    
    // Clean up recent events for pattern matching
    for (const [eventType, events] of this.recentEvents) {
      const filtered = events.filter(
        event => (now - event.metadata.timestamp.getTime()) <= 300000 // 5 minutes
      );
      this.recentEvents.set(eventType, filtered);
    }
  }

  private updateEventMetrics(event: SystemEvent): void {
    this.metrics.totalEvents++;
    this.metrics.eventsByType[event.type] = (this.metrics.eventsByType[event.type] || 0) + 1;
    this.metrics.eventsBySource[event.source] = (this.metrics.eventsBySource[event.source] || 0) + 1;
  }

  private updateProcessingTimeMetrics(processingTime: number): void {
    // Calculate rolling average
    const alpha = 0.1; // Smoothing factor
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (1 - alpha)) + (processingTime * alpha);
  }

  private updateSubscriptionMetrics(): void {
    this.metrics.subscriptionCount = this.subscriptions.size;
    this.metrics.activeSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.metadata.triggerCount > 0).length;
  }

  private updateMetrics(): void {
    this.updateSubscriptionMetrics();
    
    // Calculate error rate
    const totalErrors = Array.from(this.subscriptions.values())
      .reduce((sum, sub) => sum + sub.metadata.errorCount, 0);
    const totalTriggers = Array.from(this.subscriptions.values())
      .reduce((sum, sub) => sum + sub.metadata.triggerCount, 0);
    
    this.metrics.errorRate = totalTriggers > 0 ? totalErrors / totalTriggers : 0;
  }

  private initializeBuiltInPatterns(): void {
    // Princess coordination patterns
    this.addPattern({
      id: 'princess-cascade-failure',
      name: 'Princess Cascade Failure',
      description: 'Detect when multiple Princesses enter error state',
      pattern: {
        sequence: ['princess.error', 'princess.error'],
        timeWindow: 60000, // 1 minute
        minOccurrences: 2
      },
      action: {
        type: 'emit',
        payload: {
          alert: 'cascade_failure',
          severity: 'critical'
        }
      },
      enabled: true
    });

    this.addPattern({
      id: 'workflow-completion-sequence',
      name: 'Workflow Completion Sequence',
      description: 'Detect successful workflow completion across domains',
      pattern: {
        sequence: [
          'princess.task.completed',
          'princess.state.changed',
          'princess.task.completed'
        ],
        timeWindow: 300000, // 5 minutes
        minOccurrences: 1
      },
      action: {
        type: 'emit',
        payload: {
          workflow_status: 'completed',
          notification: 'Cross-domain workflow completed successfully'
        }
      },
      enabled: true
    });

    this.addPattern({
      id: 'high-error-rate',
      name: 'High Error Rate',
      description: 'Detect unusually high error rate from any Princess',
      pattern: {
        sequence: ['princess.error'],
        timeWindow: 60000, // 1 minute
        minOccurrences: 5
      },
      action: {
        type: 'notify',
        target: 'queen',
        payload: {
          alert: 'high_error_rate',
          action_required: 'investigation'
        }
      },
      enabled: true
    });
  }

  private generateEventId(): string {
    return `evt_${++this.eventCounter}_${Date.now()}_${randomUUID()}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${randomUUID()}`;
  }
}

export default EventBus;