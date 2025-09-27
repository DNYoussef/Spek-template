import { EventEmitter } from 'events';
import { LangroidMemoryManager, MemoryEntry } from '../langroid/LangroidMemoryManager';
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
export interface BusConfig {
  maxEventHistory: number;
  eventTTL: number;
  maxSubscribers: number;
  enableEventPersistence: boolean;
  conflictResolution: 'last-write-wins' | 'version-vector' | 'merge';
}
export interface BusMetrics {
  totalEvents: number;
  eventsPerSecond: number;
  activeSubscriptions: number;
  eventHistory: number;
  busLoad: number;
  lastEventTime: number;
}
export class SharedMemoryBus extends EventEmitter {
  private memoryManager: LangroidMemoryManager;
  private subscriptions: Map<string, BusSubscription> = new Map();
  private eventHistory: MemoryEvent[] = [];
  private readonly config: BusConfig;
  private metrics: BusMetrics;
  private eventCounter = 0;
  private lastMetricsReset = Date.now();
  constructor(memoryManager: LangroidMemoryManager, config: Partial<BusConfig> = {}) {
    super();
    this.memoryManager = memoryManager;
    this.config = {
      maxEventHistory: 1000,
      eventTTL: 300000, // 5 minutes
      maxSubscribers: 100,
      enableEventPersistence: true,
      conflictResolution: 'version-vector',
      ...config
    };
    this.metrics = {
      totalEvents: 0,
      eventsPerSecond: 0,
      activeSubscriptions: 0,
      eventHistory: 0,
      busLoad: 0,
      lastEventTime: 0
    };
    this.setupMemoryEventListeners();
    this.startMetricsCollection();
  }
  /**
   * Subscribe to memory events
   */
  subscribe(subscription: Omit<BusSubscription, 'id'>): string {
    if (this.subscriptions.size >= this.config.maxSubscribers) {
      throw new Error('Maximum number of subscribers reached');
    }
    const subscriptionId = this.generateSubscriptionId();
    const fullSubscription: BusSubscription = {
      id: subscriptionId,
      ...subscription
    };
    this.subscriptions.set(subscriptionId, fullSubscription);
    this.metrics.activeSubscriptions = this.subscriptions.size;
    this.emit('subscription_added', { subscriptionId, subscription: fullSubscription });
    return subscriptionId;
  }
  /**
   * Unsubscribe from memory events
   */
  unsubscribe(subscriptionId: string): boolean {
    const removed = this.subscriptions.delete(subscriptionId);
    this.metrics.activeSubscriptions = this.subscriptions.size;
    if (removed) {
      this.emit('subscription_removed', { subscriptionId });
    }
    return removed;
  }
  /**
   * Broadcast memory event to all relevant subscribers
   */
  broadcast(event: Omit<MemoryEvent, 'timestamp' | 'version'>): void {
    const fullEvent: MemoryEvent = {
      ...event,
      timestamp: Date.now(),
      version: this.generateEventVersion()
    };
    // Add to event history
    this.addToEventHistory(fullEvent);
    // Persist event if enabled
    if (this.config.enableEventPersistence) {
      this.persistEvent(fullEvent);
    }
    // Broadcast to subscribers
    this.notifySubscribers(fullEvent);
    // Update metrics
    this.updateMetrics(fullEvent);
    this.emit('event_broadcast', fullEvent);
  }
  /**
   * Get event history for a partition
   */
  getEventHistory(partitionId?: string, limit?: number): MemoryEvent[] {
    let events = this.eventHistory;
    if (partitionId) {
      events = events.filter(event => event.partitionId === partitionId);
    }
    if (limit) {
      events = events.slice(-limit);
    }
    return events.map(event => ({ ...event })); // Return copies
  }
  /**
   * Replay events for a new subscriber
   */
  replayEvents(subscriptionId: string, fromTimestamp?: number): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }
    const relevantEvents = this.eventHistory.filter(event => {
      // Filter by timestamp
      if (fromTimestamp && event.timestamp < fromTimestamp) {
        return false;
      }
      // Filter by partition
      if (subscription.partitionId && event.partitionId !== subscription.partitionId) {
        return false;
      }
      // Filter by event types
      if (subscription.eventTypes && !subscription.eventTypes.includes(event.type)) {
        return false;
      }
      // Apply custom filter
      if (subscription.filter && !subscription.filter(event)) {
        return false;
      }
      return true;
    });
    // Replay events to subscriber
    for (const event of relevantEvents) {
      try {
        subscription.callback(event);
      } catch (error) {
        this.emit('subscriber_error', { subscriptionId, error, event });
      }
    }
    this.emit('events_replayed', { subscriptionId, eventCount: relevantEvents.length });
  }
  /**
   * Synchronize memory state across partitions
   */
  async synchronizePartitions(sourcePartitionId: string, targetPartitionId: string): Promise<void> {
    const sourceKeys = this.memoryManager.listKeys(sourcePartitionId);
    const syncEvents: MemoryEvent[] = [];
    for (const key of sourceKeys) {
      const data = await this.memoryManager.retrieve(key);
      if (data !== null) {
        // Store in target partition
        await this.memoryManager.store(key, data, targetPartitionId);
        // Create sync event
        const syncEvent: MemoryEvent = {
          type: 'store',
          key,
          partitionId: targetPartitionId,
          data,
          metadata: { syncedFrom: sourcePartitionId },
          timestamp: Date.now(),
          source: 'sync',
          version: this.generateEventVersion()
        };
        syncEvents.push(syncEvent);
        this.addToEventHistory(syncEvent);
      }
    }
    // Broadcast sync completion
    this.emit('partitions_synchronized', {
      sourcePartitionId,
      targetPartitionId,
      syncedKeys: sourceKeys.length,
      events: syncEvents
    });
  }
  /**
   * Handle memory conflicts using configured resolution strategy
   */
  async resolveConflict(
    key: string,
    currentVersion: MemoryEntry,
    newVersion: MemoryEntry
  ): Promise<MemoryEntry> {
    switch (this.config.conflictResolution) {
      case 'last-write-wins':
        return newVersion.timestamp > currentVersion.timestamp ? newVersion : currentVersion;
      case 'version-vector':
        return newVersion.version > currentVersion.version ? newVersion : currentVersion;
      case 'merge':
        return await this.mergeEntries(currentVersion, newVersion);
      default:
        return newVersion;
    }
  }
  /**
   * Get bus performance metrics
   */
  getMetrics(): BusMetrics {
    this.updateEventsPerSecond();
    return { ...this.metrics };
  }
  /**
   * Get subscription information
   */
  getSubscriptionInfo(subscriptionId: string): BusSubscription | null {
    const subscription = this.subscriptions.get(subscriptionId);
    return subscription ? { ...subscription } : null;
  }
  /**
   * List all active subscriptions
   */
  listSubscriptions(): BusSubscription[] {
    return Array.from(this.subscriptions.values()).map(sub => ({ ...sub }));
  }
  /**
   * Clear event history
   */
  clearEventHistory(): void {
    this.eventHistory.length = 0;
    this.metrics.eventHistory = 0;
  }
  /**
   * Shutdown the memory bus
   */
  async shutdown(): Promise<void> {
    // Clear all subscriptions
    this.subscriptions.clear();
    // Clear event history
    this.clearEventHistory();
    // Emit shutdown event
    this.emit('shutdown');
    // Remove all listeners
    this.removeAllListeners();
  }
  private setupMemoryEventListeners(): void {
    this.memoryManager.on('stored', (data) => {
      this.broadcast({
        type: 'store',
        key: data.key,
        partitionId: data.partitionId,
        data: null, // Don't include actual data for performance
        metadata: { size: data.size },
        source: 'memory_manager'
      });
    });
    this.memoryManager.on('retrieved', (data) => {
      // Don't broadcast retrieval events to reduce noise
    });
    this.memoryManager.on('removed', (data) => {
      this.broadcast({
        type: 'remove',
        key: data.key,
        partitionId: 'unknown', // Memory manager doesn't provide partition info here
        metadata: { size: data.size },
        source: 'memory_manager'
      });
    });
    this.memoryManager.on('evicted', (data) => {
      this.broadcast({
        type: 'remove',
        key: data.key,
        partitionId: 'unknown',
        metadata: { size: data.size, reason: data.reason },
        source: 'memory_manager'
      });
    });
  }
  private notifySubscribers(event: MemoryEvent): void {
    for (const [subscriptionId, subscription] of this.subscriptions.entries()) {
      try {
        // Check if subscriber is interested in this event
        if (!this.shouldNotifySubscriber(subscription, event)) {
          continue;
        }
        // Notify subscriber
        subscription.callback(event);
      } catch (error) {
        this.emit('subscriber_error', { subscriptionId, error, event });
      }
    }
  }
  private shouldNotifySubscriber(subscription: BusSubscription, event: MemoryEvent): boolean {
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
  private addToEventHistory(event: MemoryEvent): void {
    this.eventHistory.push(event);
    // Maintain history size limit
    if (this.eventHistory.length > this.config.maxEventHistory) {
      this.eventHistory.shift();
    }
    // Remove expired events
    const now = Date.now();
    this.eventHistory = this.eventHistory.filter(
      e => now - e.timestamp < this.config.eventTTL
    );
    this.metrics.eventHistory = this.eventHistory.length;
  }
  private async persistEvent(event: MemoryEvent): Promise<void> {
    try {
      const eventKey = `bus_event_${event.timestamp}_${event.version}`;
      await this.memoryManager.store(eventKey, event, 'bus_events', this.config.eventTTL);
    } catch (error) {
      this.emit('persistence_error', { event, error });
    }
  }
  private async mergeEntries(current: MemoryEntry, incoming: MemoryEntry): Promise<MemoryEntry> {
    // Simple merge strategy - prefer the newer entry but combine metadata
    const merged: MemoryEntry = {
      ...incoming,
      accessCount: Math.max(current.accessCount, incoming.accessCount),
      version: Math.max(current.version, incoming.version) + 1
    };
    return merged;
  }
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  private generateEventVersion(): number {
    return ++this.eventCounter;
  }
  private updateMetrics(event: MemoryEvent): void {
    this.metrics.totalEvents++;
    this.metrics.lastEventTime = event.timestamp;
    this.updateBusLoad();
  }
  private updateEventsPerSecond(): void {
    const now = Date.now();
    const timeDiff = (now - this.lastMetricsReset) / 1000;
    if (timeDiff >= 1) {
      this.metrics.eventsPerSecond = this.eventCounter / timeDiff;
      this.lastMetricsReset = now;
      this.eventCounter = 0;
    }
  }
  private updateBusLoad(): void {
    // Calculate bus load based on events per second and active subscriptions
    const baseLoad = Math.min(this.metrics.eventsPerSecond / 100, 1); // Normalize to 0-1
    const subscriptionLoad = Math.min(this.metrics.activeSubscriptions / this.config.maxSubscribers, 1);
    this.metrics.busLoad = (baseLoad + subscriptionLoad) / 2;
  }
  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateEventsPerSecond();
    }, 1000);
  }
}
export default SharedMemoryBus;