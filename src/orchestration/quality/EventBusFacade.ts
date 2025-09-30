/**
 * EventBusFacade.ts
 * Simplified facade for EventBus god object
 * Delegates to specialized FSM components using RepositoryBaseFSM
 */

import { EventEmitter } from 'events';
import { RepositoryBaseFSM, RepositoryConfig } from '../../repository/RepositoryBaseFSM';

export interface EventMetadata {
  eventId: string;
  timestamp: number;
  source: string;
  version: string;
}

export interface EventSubscription {
  id: string;
  eventType: string;
  handler: (event: any) => void;
  filter?: (event: any) => boolean;
}

export interface EventStats {
  totalEvents: number;
  eventsPerSecond: number;
  activeSubscriptions: number;
  processingErrors: number;
}

/**
 * Simplified Event Bus Facade
 * Delegates event operations to FSM-based repository
 */
export class EventBusFacade extends EventEmitter {
  private repository: RepositoryBaseFSM;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventHistory: any[] = [];
  private stats: EventStats = {
    totalEvents: 0,
    eventsPerSecond: 0,
    activeSubscriptions: 0,
    processingErrors: 0
  };

  constructor() {
    super();

    const repositoryConfig: RepositoryConfig = {
      dataSource: {
        type: 'memory',
        options: { persistent: false }
      },
      cache: {
        maxSize: 10000,
        maxAge: 3600000, // 1 hour
        evictionPolicy: 'LRU'
      },
      enableMetrics: true
    };

    this.repository = new RepositoryBaseFSM(repositoryConfig);
    this.setupEventHandlers();
    this.startMetricsCollection();
  }

  private setupEventHandlers(): void {
    this.repository.on('error', (error) => {
      this.stats.processingErrors++;
      this.emit('processingError', { error, timestamp: Date.now() });
    });

    this.repository.on('queryExecuted', (event) => {
      this.emit('eventProcessed', { result: event.result, timestamp: Date.now() });
    });
  }

  async initializeComponent(): Promise<void> {
    await this.repository.initialize();
    this.emit('eventBusInitialized');
  }

  async publish(eventType: string, data: any, metadata?: Partial<EventMetadata>): Promise<string> {
    const eventId = this.generateEventId();
    const event = {
      id: eventId,
      type: eventType,
      data,
      metadata: {
        eventId,
        timestamp: Date.now(),
        source: 'EventBusFacade',
        version: '1.0',
        ...metadata
      }
    };

    try {
      // Store event in repository
      await this.repository.write(event, { eventType, eventId });

      // Add to history
      this.eventHistory.push(event);
      if (this.eventHistory.length > 1000) {
        this.eventHistory = this.eventHistory.slice(-1000); // Keep last 1000 events
      }

      // Process subscriptions
      await this.processSubscriptions(event);

      this.stats.totalEvents++;
      this.emit('eventPublished', { eventId, eventType, timestamp: event.metadata.timestamp });

      return eventId;
    } catch (error) {
      this.stats.processingErrors++;
      throw error;
    }
  }

  subscribe(eventType: string, handler: (event: any) => void, filter?: (event: any) => boolean): string {
    const subscriptionId = this.generateSubscriptionId();
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      handler,
      filter
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.stats.activeSubscriptions = this.subscriptions.size;

    this.emit('subscriptionAdded', { subscriptionId, eventType });
    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): boolean {
    const removed = this.subscriptions.delete(subscriptionId);
    if (removed) {
      this.stats.activeSubscriptions = this.subscriptions.size;
      this.emit('subscriptionRemoved', { subscriptionId });
    }
    return removed;
  }

  async getEventHistory(eventType?: string, limit: number = 100): Promise<any[]> {
    const events = eventType
      ? this.eventHistory.filter(event => event.type === eventType)
      : this.eventHistory;

    return events.slice(-limit);
  }

  async getEventById(eventId: string): Promise<any | null> {
    try {
      const results = await this.repository.read('event', [eventId]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      return null;
    }
  }

  getSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  getStats(): EventStats {
    return { ...this.stats };
  }

  async clearHistory(olderThan?: number): Promise<number> {
    const cutoff = olderThan || (Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const initialLength = this.eventHistory.length;

    this.eventHistory = this.eventHistory.filter(
      event => event.metadata.timestamp > cutoff
    );

    const cleared = initialLength - this.eventHistory.length;
    if (cleared > 0) {
      this.emit('historyCleared', { eventsCleared: cleared });
    }

    return cleared;
  }

  private async processSubscriptions(event: any): Promise<void> {
    const matchingSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.eventType === event.type || sub.eventType === '*')
      .filter(sub => !sub.filter || sub.filter(event));

    const promises = matchingSubscriptions.map(async (subscription) => {
      try {
        await subscription.handler(event);
      } catch (error) {
        this.stats.processingErrors++;
        this.emit('subscriptionError', {
          subscriptionId: subscription.id,
          eventId: event.id,
          error
        });
      }
    });

    await Promise.allSettled(promises);
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startMetricsCollection(): void {
    let lastEventCount = 0;

    setInterval(() => {
      const currentEventCount = this.stats.totalEvents;
      this.stats.eventsPerSecond = currentEventCount - lastEventCount;
      lastEventCount = currentEventCount;
    }, 1000);
  }

  async healthCheck(): Promise<{ status: string; details: any }> {
    const repoHealth = await this.repository.healthCheck();

    return {
      status: repoHealth.status,
      details: {
        repository: repoHealth.components,
        subscriptions: this.stats.activeSubscriptions,
        eventHistory: this.eventHistory.length,
        stats: this.stats
      }
    };
  }

  async destroy(): Promise<void> {
    this.subscriptions.clear();
    this.eventHistory = [];
    await this.repository.destroy();
    this.removeAllListeners();
  }
}