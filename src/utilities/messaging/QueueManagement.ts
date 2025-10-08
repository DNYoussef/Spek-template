import { CrossDomainMessage } from './MessageValidation';
import { PrincessDomain } from '../../coordinator/MemoryCoordinator';

/**
 * Queue management utilities for message processing
 */
export class QueueManagementUtils {
  private static readonly PRIORITY_ORDER = { 'critical': 0, 'high': 1, 'normal': 2, 'low': 3 };

  /**
   * Find optimal insertion index for priority-based queue
   */
  static findInsertIndex(queue: CrossDomainMessage[], message: CrossDomainMessage): number {
    const messagePriority = this.PRIORITY_ORDER[message.priority];

    for (let i = 0; i < queue.length; i++) {
      const queuePriority = this.PRIORITY_ORDER[queue[i].priority];
      if (messagePriority < queuePriority) {
        return i;
      }
    }

    return queue.length;
  }

  /**
   * Remove expired messages from queue
   */
  static removeExpiredMessages(queue: CrossDomainMessage[]): {
    validMessages: CrossDomainMessage[];
    expiredCount: number;
  } {
    const now = new Date();
    const validMessages = queue.filter(message => {
      return !message.expiresAt || message.expiresAt > now;
    });

    return {
      validMessages,
      expiredCount: queue.length - validMessages.length
    };
  }

  /**
   * Clean up queue by removing low-priority messages when full
   */
  static cleanupQueue(
    queue: CrossDomainMessage[],
    maxSize: number
  ): { updatedQueue: CrossDomainMessage[]; removedCount: number } {
    if (queue.length <= maxSize) {
      return { updatedQueue: [...queue], removedCount: 0 };
    }

    // Sort by priority (low priority first for removal)
    const sortedQueue = [...queue].sort((a, b) => {
      const aPriority = this.PRIORITY_ORDER[a.priority];
      const bPriority = this.PRIORITY_ORDER[b.priority];
      return bPriority - aPriority; // Reverse order for removal
    });

    // Keep only the highest priority messages
    const updatedQueue = sortedQueue.slice(0, maxSize);

    return {
      updatedQueue,
      removedCount: queue.length - updatedQueue.length
    };
  }

  /**
   * Get queue statistics
   */
  static getQueueStats(queue: CrossDomainMessage[]): {
    total: number;
    byPriority: Record<string, number>;
    averageAge: number;
    oldestMessage: Date | null;
    newestMessage: Date | null;
  } {
    if (queue.length === 0) {
      return {
        total: 0,
        byPriority: { critical: 0, high: 0, normal: 0, low: 0 },
        averageAge: 0,
        oldestMessage: null,
        newestMessage: null
      };
    }

    const now = new Date().getTime();
    const byPriority = { critical: 0, high: 0, normal: 0, low: 0 };
    let totalAge = 0;
    let oldestMessage = queue[0].timestamp;
    let newestMessage = queue[0].timestamp;

    for (const message of queue) {
      byPriority[message.priority]++;

      const age = now - message.timestamp.getTime();
      totalAge += age;

      if (message.timestamp < oldestMessage) {
        oldestMessage = message.timestamp;
      }

      if (message.timestamp > newestMessage) {
        newestMessage = message.timestamp;
      }
    }

    return {
      total: queue.length,
      byPriority,
      averageAge: totalAge / queue.length,
      oldestMessage,
      newestMessage
    };
  }

  /**
   * Partition messages by domain
   */
  static partitionMessagesByDomain(
    messages: CrossDomainMessage[]
  ): Map<PrincessDomain, CrossDomainMessage[]> {
    const partitions = new Map<PrincessDomain, CrossDomainMessage[]>();

    for (const message of messages) {
      if (!partitions.has(message.toDomain)) {
        partitions.set(message.toDomain, []);
      }
      partitions.get(message.toDomain)!.push(message);
    }

    return partitions;
  }

  /**
   * Batch messages for efficient processing
   */
  static batchMessages(
    messages: CrossDomainMessage[],
    batchSize: number = 10
  ): CrossDomainMessage[][] {
    const batches: CrossDomainMessage[][] = [];

    for (let i = 0; i < messages.length; i += batchSize) {
      batches.push(messages.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Filter messages by criteria
   */
  static filterMessages(
    messages: CrossDomainMessage[],
    criteria: {
      fromDomain?: PrincessDomain;
      toDomain?: PrincessDomain;
      messageType?: string;
      priority?: string;
      maxAge?: number;
    }
  ): CrossDomainMessage[] {
    return messages.filter(message => {
      if (criteria.fromDomain && message.fromDomain !== criteria.fromDomain) {
        return false;
      }

      if (criteria.toDomain && message.toDomain !== criteria.toDomain) {
        return false;
      }

      if (criteria.messageType && message.messageType !== criteria.messageType) {
        return false;
      }

      if (criteria.priority && message.priority !== criteria.priority) {
        return false;
      }

      if (criteria.maxAge) {
        const age = Date.now() - message.timestamp.getTime();
        if (age > criteria.maxAge) {
          return false;
        }
      }

      return true;
    });
  }
}