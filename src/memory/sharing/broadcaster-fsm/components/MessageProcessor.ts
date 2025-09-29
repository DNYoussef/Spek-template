import { BroadcastMessage, StateContext, MessageProcessor } from '../types/BroadcasterTypes';
import { MemoryEvent, SharedMemoryBus } from '../SharedMemoryBus';

/**
 * Message processing component with NASA Rule 10 compliance
 * Functions ≤60 lines, 2+ assertions, no recursion, fixed loops
 */
export class MessageProcessorImpl implements MessageProcessor {
  private static readonly MAX_QUEUE_SIZE = 10000;
  private static readonly MIN_RETRY_DELAY = 100;
  private static readonly MAX_RETRY_DELAY = 30000;

  constructor(private memoryBus: SharedMemoryBus) {
    console.assert(memoryBus !== null, 'Memory bus is required');
  }

  /**
   * Queue message for processing
   * NASA Rule 10: ≤60 lines, 2+ assertions, fixed loop
   */
  queueMessage(context: StateContext, message: BroadcastMessage): void {
    // Assertions for NASA Rule 10 compliance
    console.assert(message !== null && typeof message === 'object', 'Invalid message');
    console.assert(typeof message.channelId === 'string', 'Invalid channel ID');

    const queue = context.messageQueues.get(message.channelId);
    const channel = context.channels.get(message.channelId);
    
    if (!queue || !channel) {
      throw new Error(`Channel ${message.channelId} not found`);
    }

    const maxSize = channel.queueSize || context.config.defaultQueueSize;
    
    // Fixed loop for queue management (NASA Rule 10)
    if (queue.length >= maxSize) {
      // Remove oldest messages until under limit
      const removeCount = Math.min(10, queue.length - maxSize + 1);
      for (let i = 0; i < removeCount; i++) {
        queue.shift();
      }
    }

    queue.push(message);
    context.metrics.queuedMessages++;
  }

  /**
   * Process single message
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async processMessage(context: StateContext, message: BroadcastMessage): Promise<void> {
    // Assertions for NASA Rule 10 compliance
    console.assert(message !== null && typeof message === 'object', 'Invalid message');
    console.assert(context.metrics !== null, 'Invalid metrics context');

    const startTime = Date.now();
    
    try {
      await this.deliverMessage(context, message);
      
      const latency = Date.now() - startTime;
      this.updateLatencyMetrics(context, latency);
      context.metrics.totalMessages++;
      
    } catch (error) {
      this.handleDeliveryError(context, message, error);
    }
  }

  /**
   * Retry failed message
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  retryMessage(context: StateContext, message: BroadcastMessage): void {
    // Assertions for NASA Rule 10 compliance
    console.assert(message !== null && typeof message === 'object', 'Invalid message');
    console.assert(message.retryCount !== undefined, 'Missing retry count');

    const queue = context.messageQueues.get(message.channelId);
    if (!queue) {
      return;
    }

    const retryDelay = Math.min(
      context.config.retryDelay * (message.retryCount || 1),
      MessageProcessorImpl.MAX_RETRY_DELAY
    );

    setTimeout(() => {
      queue.unshift(message);
      context.metrics.queuedMessages++;
    }, Math.max(retryDelay, MessageProcessorImpl.MIN_RETRY_DELAY));
  }

  /**
   * Deliver message to memory bus
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async deliverMessage(context: StateContext, message: BroadcastMessage): Promise<void> {
    // Assertions for NASA Rule 10 compliance
    console.assert(message !== null && typeof message === 'object', 'Invalid message');
    console.assert(this.memoryBus !== null, 'Memory bus not available');

    if (message.type === 'memory_update') {
      const memoryEvent = message.payload as MemoryEvent;
      
      this.memoryBus.broadcast({
        type: memoryEvent.type,
        key: memoryEvent.key,
        partitionId: memoryEvent.partitionId,
        data: memoryEvent.data,
        metadata: { 
          ...memoryEvent.metadata, 
          broadcasterMessage: message.id 
        },
        source: `broadcaster_${context.nodeId}`
      });
    }
    
    // Mark as delivered
    message.timestamp = Date.now();
  }

  /**
   * Handle delivery error
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private handleDeliveryError(context: StateContext, message: BroadcastMessage, error: any): void {
    // Assertions for NASA Rule 10 compliance
    console.assert(message !== null, 'Message is required');
    console.assert(context.metrics !== null, 'Metrics context required');

    message.retryCount = (message.retryCount || 0) + 1;
    context.metrics.failedDeliveries++;

    if (message.retryCount < context.config.retryAttempts) {
      this.retryMessage(context, message);
    } else {
      // Message permanently failed
      console.warn(`Message ${message.id} permanently failed after ${message.retryCount} retries`);
    }
  }

  /**
   * Update latency metrics
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private updateLatencyMetrics(context: StateContext, latency: number): void {
    // Assertions for NASA Rule 10 compliance
    console.assert(typeof latency === 'number' && latency >= 0, 'Invalid latency');
    console.assert(context.metrics !== null, 'Metrics context required');

    // Simple exponential moving average
    const alpha = 0.1;
    context.metrics.averageLatency = 
      context.metrics.averageLatency * (1 - alpha) + latency * alpha;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: broadcaster-fsm-decomp-003
// inputs: ["BroadcasterTypes.ts", "SharedMemoryBus.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"v1"}
// === END FOOTER ===
