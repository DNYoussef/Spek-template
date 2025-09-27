import { EventEmitter } from 'events';
import { SharedMemoryBus, MemoryEvent } from './SharedMemoryBus';
export interface BroadcastChannel {
  id: string;
  name: string;
  partitionIds: string[];
  priority: number;
  rateLimit?: number;
  queueSize?: number;
  enabled: boolean;
}
export interface BroadcastMessage {
  id: string;
  channelId: string;
  type: 'memory_update' | 'memory_sync' | 'memory_cleanup' | 'system_event';
  payload: any;
  priority: number;
  timestamp: number;
  expiresAt?: number;
  retryCount?: number;
  sourceNode: string;
}
export interface BroadcasterConfig {
  maxChannels: number;
  defaultQueueSize: number;
  defaultRateLimit: number;
  retryAttempts: number;
  retryDelay: number;
  enablePersistence: boolean;
  compressionEnabled: boolean;
}
export interface BroadcasterMetrics {
  totalChannels: number;
  activeChannels: number;
  totalMessages: number;
  messagesPerSecond: number;
  queuedMessages: number;
  failedDeliveries: number;
  averageLatency: number;
}
export class MemoryBroadcaster extends EventEmitter {
  private memoryBus: SharedMemoryBus;
  private channels: Map<string, BroadcastChannel> = new Map();
  private messageQueues: Map<string, BroadcastMessage[]> = new Map();
  private processingTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly config: BroadcasterConfig;
  private metrics: BroadcasterMetrics;
  private messageCounter = 0;
  private nodeId: string;
  constructor(memoryBus: SharedMemoryBus, config: Partial<BroadcasterConfig> = {}) {
    super();
    this.memoryBus = memoryBus;
    this.nodeId = this.generateNodeId();
    this.config = {
      maxChannels: 50,
      defaultQueueSize: 1000,
      defaultRateLimit: 100, // messages per second
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      enablePersistence: true,
      compressionEnabled: true,
      ...config
    };
    this.metrics = {
      totalChannels: 0,
      activeChannels: 0,
      totalMessages: 0,
      messagesPerSecond: 0,
      queuedMessages: 0,
      failedDeliveries: 0,
      averageLatency: 0
    };
    this.setupDefaultChannels();
    this.startMetricsCollection();
  }
  /**
   * Create a new broadcast channel
   */
  createChannel(channel: Omit<BroadcastChannel, 'id'>): string {
    if (this.channels.size >= this.config.maxChannels) {
      throw new Error('Maximum number of channels reached');
    }
    const channelId = this.generateChannelId();
    const fullChannel: BroadcastChannel = {
      id: channelId,
      queueSize: this.config.defaultQueueSize,
      rateLimit: this.config.defaultRateLimit,
      ...channel
    };
    this.channels.set(channelId, fullChannel);
    this.messageQueues.set(channelId, []);
    // Start processing for this channel
    this.startChannelProcessing(channelId);
    this.updateChannelMetrics();
    this.emit('channel_created', { channelId, channel: fullChannel });
    return channelId;
  }
  /**
   * Remove a broadcast channel
   */
  removeChannel(channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return false;
    }
    // Stop processing
    const timer = this.processingTimers.get(channelId);
    if (timer) {
      clearInterval(timer);
      this.processingTimers.delete(channelId);
    }
    // Clear queue
    this.messageQueues.delete(channelId);
    this.channels.delete(channelId);
    this.updateChannelMetrics();
    this.emit('channel_removed', { channelId });
    return true;
  }
  /**
   * Broadcast message to specific channel
   */
  async broadcast(channelId: string, message: Omit<BroadcastMessage, 'id' | 'channelId' | 'timestamp' | 'sourceNode'>): Promise<string> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }
    if (!channel.enabled) {
      throw new Error(`Channel ${channelId} is disabled`);
    }
    const messageId = this.generateMessageId();
    const fullMessage: BroadcastMessage = {
      id: messageId,
      channelId,
      timestamp: Date.now(),
      sourceNode: this.nodeId,
      retryCount: 0,
      ...message
    };
    // Add to queue
    const queue = this.messageQueues.get(channelId)!;
    // Check queue size limits
    if (queue.length >= (channel.queueSize || this.config.defaultQueueSize)) {
      // Remove oldest message
      const removed = queue.shift();
      if (removed) {
        this.emit('message_dropped', { messageId: removed.id, reason: 'queue_full' });
      }
    }
    queue.push(fullMessage);
    this.metrics.queuedMessages++;
    this.emit('message_queued', { messageId, channelId, queueLength: queue.length });
    return messageId;
  }
  /**
   * Broadcast to multiple channels
   */
  async broadcastToMultiple(channelIds: string[], message: Omit<BroadcastMessage, 'id' | 'channelId' | 'timestamp' | 'sourceNode'>): Promise<string[]> {
    const messageIds: string[] = [];
    for (const channelId of channelIds) {
      try {
        const messageId = await this.broadcast(channelId, message);
        messageIds.push(messageId);
      } catch (error) {
        this.emit('broadcast_error', { channelId, error, message });
      }
    }
    return messageIds;
  }
  /**
   * Broadcast memory event to relevant channels
   */
  async broadcastMemoryEvent(event: MemoryEvent): Promise<void> {
    // Find channels that should receive this memory event
    const relevantChannels = Array.from(this.channels.values())
      .filter(channel =>
        channel.enabled &&
        channel.partitionIds.includes(event.partitionId)
      );
    const message = {
      type: 'memory_update' as const,
      payload: event,
      priority: this.getEventPriority(event)
    };
    for (const channel of relevantChannels) {
      try {
        await this.broadcast(channel.id, message);
      } catch (error) {
        this.emit('memory_broadcast_error', { channelId: channel.id, event, error });
      }
    }
  }
  /**
   * Enable or disable a channel
   */
  setChannelEnabled(channelId: string, enabled: boolean): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return false;
    }
    channel.enabled = enabled;
    if (enabled) {
      this.startChannelProcessing(channelId);
    } else {
      const timer = this.processingTimers.get(channelId);
      if (timer) {
        clearInterval(timer);
        this.processingTimers.delete(channelId);
      }
    }
    this.updateChannelMetrics();
    this.emit('channel_toggled', { channelId, enabled });
    return true;
  }
  /**
   * Update channel configuration
   */
  updateChannel(channelId: string, updates: Partial<BroadcastChannel>): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return false;
    }
    Object.assign(channel, updates);
    // Restart processing if rate limit changed
    if (updates.rateLimit !== undefined) {
      const timer = this.processingTimers.get(channelId);
      if (timer) {
        clearInterval(timer);
      }
      this.startChannelProcessing(channelId);
    }
    this.emit('channel_updated', { channelId, updates });
    return true;
  }
  /**
   * Get channel information
   */
  getChannel(channelId: string): BroadcastChannel | null {
    const channel = this.channels.get(channelId);
    return channel ? { ...channel } : null;
  }
  /**
   * List all channels
   */
  listChannels(): BroadcastChannel[] {
    return Array.from(this.channels.values()).map(channel => ({ ...channel }));
  }
  /**
   * Get queue status for a channel
   */
  getQueueStatus(channelId: string) {
    const queue = this.messageQueues.get(channelId);
    const channel = this.channels.get(channelId);
    if (!queue || !channel) {
      return null;
    }
    return {\n      channelId,\n      queueLength: queue.length,\n      maxQueueSize: channel.queueSize || this.config.defaultQueueSize,\n      utilizationPercentage: (queue.length / (channel.queueSize || this.config.defaultQueueSize)) * 100,\n      oldestMessage: queue.length > 0 ? queue[0].timestamp : null,\n      newestMessage: queue.length > 0 ? queue[queue.length - 1].timestamp : null\n    };\n  }\n  /**\n   * Get broadcaster metrics\n   */\n  getMetrics(): BroadcasterMetrics {\n    this.updateQueuedMessagesCount();\n    return { ...this.metrics };\n  }\n  /**\n   * Clear all messages from a channel queue\n   */\n  clearChannelQueue(channelId: string): number {\n    const queue = this.messageQueues.get(channelId);\n    if (!queue) {\n      return 0;\n    }\n    const clearedCount = queue.length;\n    queue.length = 0;\n    this.emit('queue_cleared', { channelId, clearedCount });\n    return clearedCount;\n  }\n  /**\n   * Shutdown the broadcaster\n   */\n  async shutdown(): Promise<void> {\n    // Stop all processing timers\n    for (const timer of this.processingTimers.values()) {\n      clearInterval(timer);\n    }\n    this.processingTimers.clear();\n    // Clear all queues\n    this.messageQueues.clear();\n    this.channels.clear();\n    this.emit('shutdown');\n    this.removeAllListeners();\n  }\n  private setupDefaultChannels(): void {\n    // Create default channels for each Princess domain\n    const defaultChannels = [\n      {\n        name: 'architecture_updates',\n        partitionIds: ['architecture'],\n        priority: 1\n      },\n      {\n        name: 'development_updates',\n        partitionIds: ['development'],\n        priority: 2\n      },\n      {\n        name: 'documentation_updates',\n        partitionIds: ['documentation'],\n        priority: 4\n      },\n      {\n        name: 'infrastructure_updates',\n        partitionIds: ['infrastructure'],\n        priority: 3\n      },\n      {\n        name: 'performance_updates',\n        partitionIds: ['performance'],\n        priority: 2\n      },\n      {\n        name: 'quality_updates',\n        partitionIds: ['quality'],\n        priority: 1\n      },\n      {\n        name: 'research_updates',\n        partitionIds: ['research'],\n        priority: 3\n      },\n      {\n        name: 'security_updates',\n        partitionIds: ['security'],\n        priority: 1\n      },\n      {\n        name: 'global_updates',\n        partitionIds: ['shared', 'default'],\n        priority: 2\n      },\n      {\n        name: 'system_events',\n        partitionIds: ['default'],\n        priority: 1\n      }\n    ];\n    for (const channelConfig of defaultChannels) {\n      this.createChannel({\n        ...channelConfig,\n        enabled: true\n      });\n    }\n  }\n  private startChannelProcessing(channelId: string): void {\n    const channel = this.channels.get(channelId);\n    if (!channel || !channel.enabled) {\n      return;\n    }\n    const rateLimit = channel.rateLimit || this.config.defaultRateLimit;\n    const interval = Math.max(1000 / rateLimit, 10); // Minimum 10ms interval\n    const timer = setInterval(() => {\n      this.processChannelQueue(channelId);\n    }, interval);\n    this.processingTimers.set(channelId, timer);\n  }\n  private async processChannelQueue(channelId: string): Promise<void> {\n    const queue = this.messageQueues.get(channelId);\n    const channel = this.channels.get(channelId);\n    if (!queue || !channel || queue.length === 0) {\n      return;\n    }\n    const message = queue.shift()!;\n    this.metrics.queuedMessages--;\n    try {\n      const startTime = Date.now();\n      await this.deliverMessage(message);\n      const latency = Date.now() - startTime;\n      this.updateLatencyMetrics(latency);\n      this.metrics.totalMessages++;\n      this.emit('message_delivered', { messageId: message.id, channelId, latency });\n    } catch (error) {\n      await this.handleDeliveryError(message, error);\n    }\n  }\n  private async deliverMessage(message: BroadcastMessage): Promise<void> {\n    // Convert to memory event and broadcast via memory bus\n    if (message.type === 'memory_update') {\n      const memoryEvent = message.payload as MemoryEvent;\n      this.memoryBus.broadcast({\n        type: memoryEvent.type,\n        key: memoryEvent.key,\n        partitionId: memoryEvent.partitionId,\n        data: memoryEvent.data,\n        metadata: { ...memoryEvent.metadata, broadcasterMessage: message.id },\n        source: `broadcaster_${this.nodeId}`\n      });\n    }\n    // Emit for other message types\n    this.emit('message_processed', message);\n  }\n  private async handleDeliveryError(message: BroadcastMessage, error: any): Promise<void> {\n    message.retryCount = (message.retryCount || 0) + 1;\n    this.metrics.failedDeliveries++;\n    if (message.retryCount < this.config.retryAttempts) {\n      // Retry after delay\n      setTimeout(() => {\n        const queue = this.messageQueues.get(message.channelId);\n        if (queue) {\n          queue.unshift(message); // Add back to front of queue\n          this.metrics.queuedMessages++;\n        }\n      }, this.config.retryDelay * message.retryCount);\n      this.emit('message_retry', { messageId: message.id, retryCount: message.retryCount, error });\n    } else {\n      this.emit('message_failed', { messageId: message.id, error, message });\n    }\n  }\n  private getEventPriority(event: MemoryEvent): number {\n    switch (event.type) {\n      case 'store':\n      case 'update':\n        return 2;\n      case 'remove':\n        return 3;\n      case 'clear':\n        return 1; // Highest priority\n      default:\n        return 4;\n    }\n  }\n  private generateNodeId(): string {\n    return `broadcaster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;\n  }\n  private generateChannelId(): string {\n    return `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;\n  }\n  private generateMessageId(): string {\n    return `msg_${Date.now()}_${++this.messageCounter}_${Math.random().toString(36).substr(2, 9)}`;\n  }\n  private updateChannelMetrics(): void {\n    this.metrics.totalChannels = this.channels.size;\n    this.metrics.activeChannels = Array.from(this.channels.values())\n      .filter(channel => channel.enabled).length;\n  }\n  private updateQueuedMessagesCount(): void {\n    let total = 0;\n    for (const queue of this.messageQueues.values()) {\n      total += queue.length;\n    }\n    this.metrics.queuedMessages = total;\n  }\n  private updateLatencyMetrics(latency: number): void {\n    // Simple exponential moving average\n    const alpha = 0.1;\n    this.metrics.averageLatency = \n      this.metrics.averageLatency * (1 - alpha) + latency * alpha;\n  }\n  private startMetricsCollection(): void {\n    setInterval(() => {\n      // Calculate messages per second\n      // This is a simplified version - in production you'd want a more sophisticated approach\n      this.updateChannelMetrics();\n    }, 1000);\n  }\n}\nexport default MemoryBroadcaster;"