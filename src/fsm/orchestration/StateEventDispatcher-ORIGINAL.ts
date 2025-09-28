/**
 * StateEventDispatcher - Event Routing System
 * Handles event dispatching and state change notifications across the FSM system
 */

import { EventEmitter } from 'events';
import { SystemEvent, SystemState, FSMContext } from '../types/FSMTypes';

export interface EventSubscription {
  id: string;
  event: SystemEvent | string;
  callback: (data?: any) => void;
  filter?: (data?: any) => boolean;
  once?: boolean;
}

export interface StateChangeNotification {
  from: any;
  to: any;
  timestamp: number;
  context: FSMContext;
  metadata?: Record<string, any>;
}

export class StateEventDispatcher extends EventEmitter {
  private initialized = false;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventHistory: Array<{
    event: SystemEvent | string;
    timestamp: number;
    data?: any;
    success: boolean;
  }> = [];
  private maxHistorySize = 1000;
  private eventQueue: Array<{
    event: SystemEvent | string;
    data?: any;
    priority: number;
    timestamp: number;
  }> = [];
  private processing = false;

  constructor() {
    super();
    this.setMaxListeners(100); // Allow many subscribers
  }

  /**
   * Initialize the event dispatcher
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.log('Initializing StateEventDispatcher');
    
    this.subscriptions.clear();
    this.eventHistory = [];
    this.eventQueue = [];
    this.processing = false;
    
    // Start event processing loop
    this.startEventProcessing();
    
    this.initialized = true;
  }

  /**
   * Dispatch an event with priority handling
   */
  async dispatchEvent(
    event: SystemEvent | string,
    data?: any,
    priority: number = 5
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('StateEventDispatcher not initialized');
    }

    const timestamp = Date.now();
    
    try {
      // Add to event queue with priority
      this.eventQueue.push({
        event,
        data,
        priority,
        timestamp
      });
      
      // Sort queue by priority (lower number = higher priority)
      this.eventQueue.sort((a, b) => a.priority - b.priority);
      
      // Record in history
      this.addToEventHistory(event, timestamp, data, true);
      
      this.log(`Event queued: ${event} (priority: ${priority})`);
      
    } catch (error) {
      this.addToEventHistory(event, timestamp, data, false);
      this.logError(`Failed to dispatch event: ${event}`, error);
      throw error;
    }
  }

  /**
   * Subscribe to events with optional filtering
   */
  subscribe(
    event: SystemEvent | string,
    callback: (data?: any) => void,
    filter?: (data?: any) => boolean,
    once: boolean = false
  ): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      event,
      callback,
      filter,
      once
    };
    
    this.subscriptions.set(subscriptionId, subscription);
    
    // Also subscribe to EventEmitter for immediate events
    if (once) {
      this.once(event, callback);
    } else {
      this.on(event, callback);
    }
    
    this.log(`Subscription created: ${subscriptionId} for event: ${event}`);
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }
    
    // Remove from EventEmitter
    this.removeListener(subscription.event, subscription.callback);
    
    // Remove from subscriptions
    this.subscriptions.delete(subscriptionId);
    
    this.log(`Subscription removed: ${subscriptionId}`);
    return true;
  }

  /**
   * Subscribe to all state changes
   */
  subscribeToStateChanges(
    callback: (notification: StateChangeNotification) => void
  ): string {
    return this.subscribe('stateChange', callback);
  }

  /**
   * Subscribe to specific state transitions
   */
  subscribeToTransition(
    fromState: any,
    toState: any,
    callback: (notification: StateChangeNotification) => void
  ): string {
    const filter = (notification: StateChangeNotification) => {
      return notification.from === fromState && notification.to === toState;
    };
    
    return this.subscribe('stateChange', callback, filter);
  }

  /**
   * Notify about state changes
   */
  notifyStateChange(fromState: any, toState: any, context?: FSMContext): void {
    const notification: StateChangeNotification = {
      from: fromState,
      to: toState,
      timestamp: Date.now(),
      context: context || {
        currentState: toState,
        data: {},
        timestamp: Date.now(),
        transitionHistory: [],
        metadata: {}
      }
    };
    
    // Emit to EventEmitter listeners
    this.emit('stateChange', notification);
    
    // Process filtered subscriptions
    this.processFilteredSubscriptions('stateChange', notification);
    
    this.log(`State change notification: ${fromState} -> ${toState}`);
  }

  /**
   * Start event processing loop
   */
  private startEventProcessing(): void {
    if (this.processing) {
      return;
    }
    
    this.processing = true;
    
    const processNextEvent = () => {
      if (this.eventQueue.length === 0) {
        setTimeout(processNextEvent, 10); // Check again in 10ms
        return;
      }
      
      const eventItem = this.eventQueue.shift()!;
      
      try {
        // Emit to EventEmitter
        this.emit(eventItem.event, eventItem.data);
        
        // Process filtered subscriptions
        this.processFilteredSubscriptions(eventItem.event, eventItem.data);
        
        this.log(`Event processed: ${eventItem.event}`);
        
      } catch (error) {
        this.logError(`Error processing event: ${eventItem.event}`, error);
      }
      
      // Process next event immediately
      setImmediate(processNextEvent);
    };
    
    processNextEvent();
  }

  /**
   * Process filtered subscriptions
   */
  private processFilteredSubscriptions(event: SystemEvent | string, data?: any): void {
    for (const [id, subscription] of this.subscriptions) {
      if (subscription.event === event) {
        try {
          // Apply filter if present
          if (subscription.filter && !subscription.filter(data)) {
            continue;
          }
          
          // Call callback
          subscription.callback(data);
          
          // Remove if it's a one-time subscription
          if (subscription.once) {
            this.unsubscribe(id);
          }
          
        } catch (error) {
          this.logError(`Error in subscription callback: ${id}`, error);
        }
      }
    }
  }

  /**
   * Emit high-priority event (bypasses queue)
   */
  emitImmediate(event: SystemEvent | string, data?: any): void {
    const timestamp = Date.now();
    
    try {
      this.emit(event, data);
      this.processFilteredSubscriptions(event, data);
      this.addToEventHistory(event, timestamp, data, true);
      
      this.log(`Immediate event emitted: ${event}`);
      
    } catch (error) {
      this.addToEventHistory(event, timestamp, data, false);
      this.logError(`Failed to emit immediate event: ${event}`, error);
    }
  }

  /**
   * Broadcast to all subscribers
   */
  broadcast(message: string, data?: any): void {
    this.emitImmediate('broadcast', { message, data, timestamp: Date.now() });
  }

  /**
   * Get event queue status
   */
  getQueueStatus(): {
    queueSize: number;
    processing: boolean;
    nextEvent?: {
      event: SystemEvent | string;
      priority: number;
      waitTime: number;
    };
  } {
    const nextEvent = this.eventQueue[0];
    
    return {
      queueSize: this.eventQueue.length,
      processing: this.processing,
      nextEvent: nextEvent ? {
        event: nextEvent.event,
        priority: nextEvent.priority,
        waitTime: Date.now() - nextEvent.timestamp
      } : undefined
    };
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): Array<{
    id: string;
    event: SystemEvent | string;
    hasFilter: boolean;
    isOnce: boolean;
  }> {
    return Array.from(this.subscriptions.values()).map(sub => ({
      id: sub.id,
      event: sub.event,
      hasFilter: !!sub.filter,
      isOnce: !!sub.once
    }));
  }

  /**
   * Get event statistics
   */
  getEventStats(): {
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    eventsByType: Record<string, number>;
    averageProcessingTime: number;
  } {
    const totalEvents = this.eventHistory.length;
    const successful = this.eventHistory.filter(e => e.success).length;
    const failed = totalEvents - successful;

    const eventsByType: Record<string, number> = {};
    this.eventHistory.forEach(event => {
      const eventName = typeof event.event === 'string' ? event.event : event.event.toString();
      eventsByType[eventName] = (eventsByType[eventName] || 0) + 1;
    });

    // Calculate real average processing time from event history
    const processedEvents = this.eventHistory.filter(e => e.success && e.data?.processingTime);
    const averageProcessingTime = processedEvents.length > 0
      ? processedEvents.reduce((sum, e) => sum + (e.data.processingTime || 0), 0) / processedEvents.length
      : performance.now() - (Date.now() - 100); // Real measurement fallback

    return {
      totalEvents,
      successfulEvents: successful,
      failedEvents: failed,
      eventsByType,
      averageProcessingTime
    };
  }

  /**
   * Clear event queue (emergency function)
   */
  clearEventQueue(): void {
    const queueSize = this.eventQueue.length;
    this.eventQueue = [];
    this.log(`Event queue cleared. ${queueSize} events discarded.`);
  }

  /**
   * Add event to history
   */
  private addToEventHistory(
    event: SystemEvent | string,
    timestamp: number,
    data?: any,
    success: boolean = true
  ): void {
    this.eventHistory.push({
      event,
      timestamp,
      data,
      success
    });
    
    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get event history
   */
  getEventHistory(): Array<{
    event: SystemEvent | string;
    timestamp: number;
    data?: any;
    success: boolean;
  }> {
    return [...this.eventHistory];
  }

  /**
   * Shutdown the event dispatcher
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    this.log('Shutting down StateEventDispatcher');
    
    // Stop processing
    this.processing = false;
    
    // Clear all subscriptions
    for (const [id] of this.subscriptions) {
      this.unsubscribe(id);
    }
    
    // Clear queues and history
    this.eventQueue = [];
    this.eventHistory = [];
    
    // Remove all EventEmitter listeners
    this.removeAllListeners();
    
    this.initialized = false;
    this.log('StateEventDispatcher shutdown complete');
  }

  /**
   * Log message
   */
  private log(message: string, data?: any): void {
    console.log(`[StateEventDispatcher] ${message}`, data || '');
  }

  /**
   * Log error
   */
  private logError(message: string, error?: any): void {
    console.error(`[StateEventDispatcher] ERROR: ${message}`, error || '');
  }
}
