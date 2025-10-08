import { EventEmitter } from 'events';

export interface MemoryEvent {
  type: 'store' | 'update' | 'remove' | 'clear';
  key: string;
  partitionId: string;
  data?: any;
  metadata?: Record<string, any>;
  timestamp: number;
  source: string;
  version: number;
}

export interface BusSubscription {
  id: string;
  partitionId?: string;
  eventTypes?: string[];
  callback: (event: MemoryEvent) => void;
  filter?: (event: MemoryEvent) => boolean;
}

export interface BusMetrics {
  totalEvents: number;
  eventsPerSecond: number;
  activeSubscriptions: number;
  eventHistory: number;
  busLoad: number;
  lastEventTime: number;
}

/**
 * Event utilities for memory bus operations
 */
export class MemoryEventUtils {
  /**
   * Create a memory event with default values
   */
  static createEvent(
    type: MemoryEvent['type'],
    key: string,
    partitionId: string,
    source: string,
    data?: any,
    metadata?: Record<string, any>
  ): MemoryEvent {
    return {
      type,
      key,
      partitionId,
      data,
      metadata,
      timestamp: Date.now(),
      source,
      version: 1
    };
  }

  /**
   * Check if event matches subscription criteria
   */
  static matchesSubscription(event: MemoryEvent, subscription: BusSubscription): boolean {
    // Check partition filter
    if (subscription.partitionId && event.partitionId !== subscription.partitionId) {
      return false;
    }

    // Check event type filter
    if (subscription.eventTypes && !subscription.eventTypes.includes(event.type)) {
      return false;
    }

    // Apply custom filter
    if (subscription.filter && !subscription.filter(event)) {
      return false;
    }

    return true;
  }

  /**
   * Filter events by criteria
   */
  static filterEvents(
    events: MemoryEvent[],
    criteria: {
      partitionId?: string;
      eventType?: string;
      maxAge?: number;
      source?: string;
    }
  ): MemoryEvent[] {
    return events.filter(event => {
      if (criteria.partitionId && event.partitionId !== criteria.partitionId) {
        return false;
      }

      if (criteria.eventType && event.type !== criteria.eventType) {
        return false;
      }

      if (criteria.source && event.source !== criteria.source) {
        return false;
      }

      if (criteria.maxAge) {
        const age = Date.now() - event.timestamp;
        if (age > criteria.maxAge) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sort events by timestamp
   */
  static sortByTimestamp(events: MemoryEvent[], ascending = true): MemoryEvent[] {
    return [...events].sort((a, b) => {
      const diff = a.timestamp - b.timestamp;
      return ascending ? diff : -diff;
    });
  }

  /**
   * Group events by partition
   */
  static groupByPartition(events: MemoryEvent[]): Map<string, MemoryEvent[]> {
    const groups = new Map<string, MemoryEvent[]>();

    for (const event of events) {
      if (!groups.has(event.partitionId)) {
        groups.set(event.partitionId, []);
      }
      groups.get(event.partitionId)!.push(event);
    }

    return groups;
  }

  /**
   * Calculate event statistics
   */
  static calculateStats(events: MemoryEvent[]): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByPartition: Record<string, number>;
    timeRange: { oldest: number; newest: number };
    averageAge: number;
  } {
    if (events.length === 0) {
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsByPartition: {},
        timeRange: { oldest: 0, newest: 0 },
        averageAge: 0
      };
    }

    const eventsByType: Record<string, number> = {};
    const eventsByPartition: Record<string, number> = {};
    let oldest = events[0].timestamp;
    let newest = events[0].timestamp;
    let totalAge = 0;

    for (const event of events) {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;

      // Count by partition
      eventsByPartition[event.partitionId] = (eventsByPartition[event.partitionId] || 0) + 1;

      // Track time range
      if (event.timestamp < oldest) oldest = event.timestamp;
      if (event.timestamp > newest) newest = event.timestamp;

      // Calculate age
      totalAge += Date.now() - event.timestamp;
    }

    return {
      totalEvents: events.length,
      eventsByType,
      eventsByPartition,
      timeRange: { oldest, newest },
      averageAge: totalAge / events.length
    };
  }
}

/**
 * Subscription management utilities
 */
export class SubscriptionUtils {
  /**
   * Generate unique subscription ID
   */
  static generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate subscription configuration
   */
  static validateSubscription(subscription: Omit<BusSubscription, 'id'>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (typeof subscription.callback !== 'function') {
      errors.push('Callback must be a function');
    }

    if (subscription.eventTypes && !Array.isArray(subscription.eventTypes)) {
      errors.push('Event types must be an array');
    }

    if (subscription.filter && typeof subscription.filter !== 'function') {
      errors.push('Filter must be a function');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Check if subscription is still active (hasn't thrown errors recently)
   */
  static isSubscriptionHealthy(
    subscription: BusSubscription,
    errorHistory: Array<{ subscriptionId: string; timestamp: number }>
  ): boolean {
    const recentErrors = errorHistory.filter(
      error => error.subscriptionId === subscription.id &&
      Date.now() - error.timestamp < 300000 // 5 minutes
    );

    return recentErrors.length < 5; // Less than 5 errors in 5 minutes
  }
}

/**
 * Event bus metrics utilities
 */
export class EventBusMetrics {
  private static readonly METRICS_WINDOW = 60000; // 1 minute

  /**
   * Calculate events per second
   */
  static calculateEventsPerSecond(
    eventTimestamps: number[],
    windowMs: number = this.METRICS_WINDOW
  ): number {
    const now = Date.now();
    const recentEvents = eventTimestamps.filter(timestamp => now - timestamp < windowMs);
    return recentEvents.length / (windowMs / 1000);
  }

  /**
   * Calculate bus load based on events and subscriptions
   */
  static calculateBusLoad(
    eventsPerSecond: number,
    activeSubscriptions: number,
    maxSubscribers: number
  ): number {
    const eventLoad = Math.min(eventsPerSecond / 100, 1); // Normalize to 0-1
    const subscriptionLoad = Math.min(activeSubscriptions / maxSubscribers, 1);
    return (eventLoad + subscriptionLoad) / 2;
  }

  /**
   * Update metrics with new event
   */
  static updateMetrics(
    currentMetrics: BusMetrics,
    event: MemoryEvent,
    activeSubscriptions: number
  ): BusMetrics {
    return {
      ...currentMetrics,
      totalEvents: currentMetrics.totalEvents + 1,
      lastEventTime: event.timestamp,
      activeSubscriptions
    };
  }
}