import { EventEmitter } from 'events';
import { SharedMemoryBus, MemoryEvent, BusSubscription } from './SharedMemoryBus';
export interface SubscriptionFilter {
  partitionIds?: string[];
  eventTypes?: string[];
  keyPatterns?: string[];
  sources?: string[];
  customFilter?: (event: MemoryEvent) => boolean;
  minPriority?: number;
  maxAge?: number;
}
export interface SubscriberConfig {
  maxSubscriptions: number;
  bufferSize: number;
  processingDelay: number;
  autoReconnect: boolean;
  reconnectDelay: number;
  enableBatching: boolean;
  batchSize: number;
  batchTimeout: number;
}
export interface SubscriptionHandle {
  id: string;
  filter: SubscriptionFilter;
  callback: (event: MemoryEvent) => void;
  status: 'active' | 'paused' | 'error' | 'reconnecting';
  eventCount: number;
  lastEvent?: number;
  errorCount: number;
  createdAt: number;
}
export interface SubscriberMetrics {
  activeSubscriptions: number;
  totalSubscriptions: number;
  eventsProcessed: number;
  eventsPerSecond: number;
  bufferUtilization: number;
  errorRate: number;
  averageProcessingTime: number;
}
export class MemorySubscriber extends EventEmitter {
  private memoryBus: SharedMemoryBus;
  private subscriptions: Map<string, SubscriptionHandle> = new Map();
  private eventBuffer: MemoryEvent[] = [];
  private processingTimer?: NodeJS.Timeout;
  private batchTimer?: NodeJS.Timeout;
  private readonly config: SubscriberConfig;
  private metrics: SubscriberMetrics;
  private isProcessing = false;
  constructor(memoryBus: SharedMemoryBus, config: Partial<SubscriberConfig> = {}) {
    super();
    this.memoryBus = memoryBus;
    this.config = {
      maxSubscriptions: 50,
      bufferSize: 1000,
      processingDelay: 10, // 10ms between batch processing
      autoReconnect: true,
      reconnectDelay: 5000, // 5 seconds
      enableBatching: true,
      batchSize: 10,
      batchTimeout: 100, // 100ms
      ...config
    };
    this.metrics = {
      activeSubscriptions: 0,
      totalSubscriptions: 0,
      eventsProcessed: 0,
      eventsPerSecond: 0,
      bufferUtilization: 0,
      errorRate: 0,
      averageProcessingTime: 0
    };
    this.startProcessing();
    this.startMetricsCollection();
  }
  /**
   * Subscribe to memory events with filtering
   */
  subscribe(filter: SubscriptionFilter, callback: (event: MemoryEvent) => void): string {
    if (this.subscriptions.size >= this.config.maxSubscriptions) {
      throw new Error('Maximum number of subscriptions reached');
    }
    const subscriptionId = this.generateSubscriptionId();
    const handle: SubscriptionHandle = {
      id: subscriptionId,
      filter,
      callback,
      status: 'active',
      eventCount: 0,
      errorCount: 0,
      createdAt: Date.now()
    };
    this.subscriptions.set(subscriptionId, handle);
    // Create bus subscription
    const busSubscription = this.memoryBus.subscribe({
      partitionId: filter.partitionIds?.[0], // Use first partition for bus subscription
      eventTypes: filter.eventTypes,
      callback: (event) => this.handleEvent(subscriptionId, event),
      filter: (event) => this.applyFilter(filter, event)
    });
    // Store bus subscription ID for cleanup
    (handle as any).busSubscriptionId = busSubscription;
    this.updateSubscriptionMetrics();
    this.emit('subscription_created', { subscriptionId, filter });
    return subscriptionId;
  }
  /**
   * Subscribe to specific partition with event type filtering
   */
  subscribeToPartition(\n    partitionId: string,\n    eventTypes: string[],\n    callback: (event: MemoryEvent) => void\n  ): string {\n    return this.subscribe({\n      partitionIds: [partitionId],\n      eventTypes\n    }, callback);\n  }\n  /**\n   * Subscribe to all partitions with key pattern matching\n   */\n  subscribeToKeyPattern(\n    keyPattern: string,\n    callback: (event: MemoryEvent) => void\n  ): string {\n    return this.subscribe({\n      keyPatterns: [keyPattern]\n    }, callback);\n  }\n  /**\n   * Subscribe to high-priority events only\n   */\n  subscribeToHighPriority(\n    minPriority: number,\n    callback: (event: MemoryEvent) => void\n  ): string {\n    return this.subscribe({\n      minPriority,\n      customFilter: (event) => this.calculateEventPriority(event) >= minPriority\n    }, callback);\n  }\n  /**\n   * Unsubscribe from events\n   */\n  unsubscribe(subscriptionId: string): boolean {\n    const handle = this.subscriptions.get(subscriptionId);\n    if (!handle) {\n      return false;\n    }\n    // Remove bus subscription\n    const busSubscriptionId = (handle as any).busSubscriptionId;\n    if (busSubscriptionId) {\n      this.memoryBus.unsubscribe(busSubscriptionId);\n    }\n    this.subscriptions.delete(subscriptionId);\n    this.updateSubscriptionMetrics();\n    this.emit('subscription_removed', { subscriptionId });\n    return true;\n  }\n  /**\n   * Pause a subscription\n   */\n  pauseSubscription(subscriptionId: string): boolean {\n    const handle = this.subscriptions.get(subscriptionId);\n    if (!handle) {\n      return false;\n    }\n    handle.status = 'paused';\n    this.emit('subscription_paused', { subscriptionId });\n    return true;\n  }\n  /**\n   * Resume a paused subscription\n   */\n  resumeSubscription(subscriptionId: string): boolean {\n    const handle = this.subscriptions.get(subscriptionId);\n    if (!handle || handle.status !== 'paused') {\n      return false;\n    }\n    handle.status = 'active';\n    this.emit('subscription_resumed', { subscriptionId });\n    return true;\n  }\n  /**\n   * Update subscription filter\n   */\n  updateSubscriptionFilter(subscriptionId: string, newFilter: Partial<SubscriptionFilter>): boolean {\n    const handle = this.subscriptions.get(subscriptionId);\n    if (!handle) {\n      return false;\n    }\n    handle.filter = { ...handle.filter, ...newFilter };\n    this.emit('subscription_updated', { subscriptionId, newFilter });\n    return true;\n  }\n  /**\n   * Get subscription information\n   */\n  getSubscription(subscriptionId: string): SubscriptionHandle | null {\n    const handle = this.subscriptions.get(subscriptionId);\n    return handle ? { ...handle } : null;\n  }\n  /**\n   * List all subscriptions\n   */\n  listSubscriptions(): SubscriptionHandle[] {\n    return Array.from(this.subscriptions.values()).map(handle => ({ ...handle }));\n  }\n  /**\n   * Get subscriber metrics\n   */\n  getMetrics(): SubscriberMetrics {\n    this.updateBufferUtilization();\n    return { ...this.metrics };\n  }\n  /**\n   * Clear event buffer\n   */\n  clearBuffer(): number {\n    const cleared = this.eventBuffer.length;\n    this.eventBuffer.length = 0;\n    this.emit('buffer_cleared', { cleared });\n    return cleared;\n  }\n  /**\n   * Replay events for a subscription from history\n   */\n  async replayEvents(subscriptionId: string, fromTimestamp?: number): Promise<void> {\n    const handle = this.subscriptions.get(subscriptionId);\n    if (!handle) {\n      throw new Error(`Subscription ${subscriptionId} not found`);\n    }\n    const busSubscriptionId = (handle as any).busSubscriptionId;\n    if (busSubscriptionId) {\n      this.memoryBus.replayEvents(busSubscriptionId, fromTimestamp);\n    }\n    this.emit('events_replayed', { subscriptionId, fromTimestamp });\n  }\n  /**\n   * Batch process events for better performance\n   */\n  enableBatchProcessing(batchSize?: number, timeout?: number): void {\n    this.config.enableBatching = true;\n    if (batchSize) this.config.batchSize = batchSize;\n    if (timeout) this.config.batchTimeout = timeout;\n    this.startBatchProcessing();\n  }\n  /**\n   * Disable batch processing\n   */\n  disableBatchProcessing(): void {\n    this.config.enableBatching = false;\n    if (this.batchTimer) {\n      clearTimeout(this.batchTimer);\n      this.batchTimer = undefined;\n    }\n  }\n  /**\n   * Shutdown the subscriber\n   */\n  async shutdown(): Promise<void> {\n    // Stop processing\n    if (this.processingTimer) {\n      clearInterval(this.processingTimer);\n    }\n    if (this.batchTimer) {\n      clearTimeout(this.batchTimer);\n    }\n    // Unsubscribe all\n    const subscriptionIds = Array.from(this.subscriptions.keys());\n    for (const id of subscriptionIds) {\n      this.unsubscribe(id);\n    }\n    // Clear buffer\n    this.clearBuffer();\n    this.emit('shutdown');\n    this.removeAllListeners();\n  }\n  private handleEvent(subscriptionId: string, event: MemoryEvent): void {\n    const handle = this.subscriptions.get(subscriptionId);\n    if (!handle || handle.status !== 'active') {\n      return;\n    }\n    // Add to buffer for processing\n    if (this.eventBuffer.length < this.config.bufferSize) {\n      this.eventBuffer.push({ ...event, subscriptionId } as any);\n    } else {\n      // Buffer full, drop oldest event\n      this.eventBuffer.shift();\n      this.eventBuffer.push({ ...event, subscriptionId } as any);\n      this.emit('buffer_overflow', { subscriptionId, droppedEvent: event });\n    }\n  }\n  private applyFilter(filter: SubscriptionFilter, event: MemoryEvent): boolean {\n    // Check partition filter\n    if (filter.partitionIds && !filter.partitionIds.includes(event.partitionId)) {\n      return false;\n    }\n    // Check event type filter\n    if (filter.eventTypes && !filter.eventTypes.includes(event.type)) {\n      return false;\n    }\n    // Check key pattern filter\n    if (filter.keyPatterns) {\n      const matches = filter.keyPatterns.some(pattern => {\n        const regex = new RegExp(pattern);\n        return regex.test(event.key);\n      });\n      if (!matches) return false;\n    }\n    // Check source filter\n    if (filter.sources && !filter.sources.includes(event.source)) {\n      return false;\n    }\n    // Check age filter\n    if (filter.maxAge) {\n      const age = Date.now() - event.timestamp;\n      if (age > filter.maxAge) {\n        return false;\n      }\n    }\n    // Apply custom filter\n    if (filter.customFilter && !filter.customFilter(event)) {\n      return false;\n    }\n    return true;\n  }\n  private startProcessing(): void {\n    this.processingTimer = setInterval(() => {\n      if (!this.isProcessing && this.eventBuffer.length > 0) {\n        this.processEventBuffer();\n      }\n    }, this.config.processingDelay);\n  }\n  private async processEventBuffer(): Promise<void> {\n    if (this.isProcessing || this.eventBuffer.length === 0) {\n      return;\n    }\n    this.isProcessing = true;\n    try {\n      const batchSize = this.config.enableBatching ? \n        Math.min(this.config.batchSize, this.eventBuffer.length) : 1;\n      const eventsToProcess = this.eventBuffer.splice(0, batchSize);\n      for (const event of eventsToProcess) {\n        await this.processEvent(event as any);\n      }\n    } finally {\n      this.isProcessing = false;\n    }\n  }\n  private async processEvent(event: MemoryEvent & { subscriptionId: string }): Promise<void> {\n    const handle = this.subscriptions.get(event.subscriptionId);\n    if (!handle || handle.status !== 'active') {\n      return;\n    }\n    const startTime = Date.now();\n    try {\n      await handle.callback(event);\n      handle.eventCount++;\n      handle.lastEvent = event.timestamp;\n      this.metrics.eventsProcessed++;\n      const processingTime = Date.now() - startTime;\n      this.updateProcessingTimeMetrics(processingTime);\n      this.emit('event_processed', { subscriptionId: event.subscriptionId, event, processingTime });\n    } catch (error) {\n      handle.errorCount++;\n      handle.status = 'error';\n      this.metrics.errorRate++;\n      this.emit('event_error', { subscriptionId: event.subscriptionId, event, error });\n      // Auto-reconnect if enabled\n      if (this.config.autoReconnect) {\n        setTimeout(() => {\n          this.attemptReconnect(event.subscriptionId);\n        }, this.config.reconnectDelay);\n      }\n    }\n  }\n  private attemptReconnect(subscriptionId: string): void {\n    const handle = this.subscriptions.get(subscriptionId);\n    if (!handle) {\n      return;\n    }\n    handle.status = 'reconnecting';\n    // Reset error state after a delay\n    setTimeout(() => {\n      if (handle.status === 'reconnecting') {\n        handle.status = 'active';\n        this.emit('subscription_reconnected', { subscriptionId });\n      }\n    }, 1000);\n  }\n  private startBatchProcessing(): void {\n    if (!this.config.enableBatching) {\n      return;\n    }\n    this.batchTimer = setTimeout(() => {\n      if (this.eventBuffer.length > 0) {\n        this.processEventBuffer();\n      }\n      this.startBatchProcessing(); // Reschedule\n    }, this.config.batchTimeout);\n  }\n  private calculateEventPriority(event: MemoryEvent): number {\n    // Calculate priority based on event type and metadata\n    let priority = 0;\n    switch (event.type) {\n      case 'store': priority = 3; break;\n      case 'update': priority = 3; break;\n      case 'remove': priority = 2; break;\n      case 'clear': priority = 1; break;\n      default: priority = 4;\n    }\n    // Adjust based on partition importance\n    if (['security', 'quality', 'architecture'].includes(event.partitionId)) {\n      priority = Math.max(1, priority - 1);\n    }\n    return priority;\n  }\n  private generateSubscriptionId(): string {\n    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;\n  }\n  private updateSubscriptionMetrics(): void {\n    this.metrics.activeSubscriptions = Array.from(this.subscriptions.values())\n      .filter(handle => handle.status === 'active').length;\n    this.metrics.totalSubscriptions = this.subscriptions.size;\n  }\n  private updateBufferUtilization(): void {\n    this.metrics.bufferUtilization = \n      (this.eventBuffer.length / this.config.bufferSize) * 100;\n  }\n  private updateProcessingTimeMetrics(processingTime: number): void {\n    // Simple exponential moving average\n    const alpha = 0.1;\n    this.metrics.averageProcessingTime = \n      this.metrics.averageProcessingTime * (1 - alpha) + processingTime * alpha;\n  }\n  private startMetricsCollection(): void {\n    setInterval(() => {\n      // Calculate events per second\n      // This is simplified - in production you'd want a more sophisticated approach\n      this.updateSubscriptionMetrics();\n      this.updateBufferUtilization();\n    }, 1000);\n  }\n}\nexport default MemorySubscriber;"