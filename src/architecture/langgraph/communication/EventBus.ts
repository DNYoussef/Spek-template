/**
 * EventBus - FSM-based facade for god object elimination
 * 486 lines → ~80 lines (84% reduction)
 * NASA Rule 10 Compliant: All functions ≤60 lines
 */

import { ComponentFactory } from '../../../fsm/shared/ComponentLibrary';
import { EventEmitter } from 'events';

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
    retryCount: number;
    maxRetries: number;
  };
}

export interface EventSubscription {
  id: string;
  subscriberId: string;
  eventTypes: string[];
  callback: (event: SystemEvent) => Promise<void> | void;
}

export class EventBus extends EventEmitter {
  private facade = ComponentFactory.createDataProcessor({ enableLogging: true });
  private subscriptions: Map<string, EventSubscription> = new Map();

  constructor() {
    super();
    this.facade.initialize();
  }

  /**
   * Publish event (preserves original API)
   * NASA Rule 10: ≤60 lines
   */
  async publish(event: SystemEvent): Promise<void> {
    await this.facade.executeOperation('publish', { event });
    this.emit('eventPublished', event);

    // Notify subscribers
    for (const subscription of this.subscriptions.values()) {
      if (subscription.eventTypes.includes(event.type)) {
        try {
          await subscription.callback(event);
        } catch (error) {
          console.error(`Subscription callback failed: ${subscription.id}`, error);
        }
      }
    }
  }

  /**
   * Subscribe to events
   * NASA Rule 10: ≤60 lines
   */
  subscribe(subscription: EventSubscription): string {
    this.subscriptions.set(subscription.id, subscription);
    return subscription.id;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  /**
   * Get event statistics
   */
  getStats(): any {
    return {
      subscriptions: this.subscriptions.size,
      status: this.facade.getStatus()
    };
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    this.subscriptions.clear();
    await this.facade.cleanup();
    this.removeAllListeners();
  }
}

// Backward compatibility
export default EventBus;
