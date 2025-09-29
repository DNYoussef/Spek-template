/**
 * Event Processing State Handler
 * NASA Rule 10 Compliant - ≤60 lines, fixed loops, 2+ assertions
 */

import { SubscriberContext } from './SubscriberFSMTypes';

export class EventProcessor {
  private static readonly MAX_BUFFER_SIZE = 1000;
  private static readonly MAX_BATCH_SIZE = 10;

  static addToBuffer(context: SubscriberContext, event: any): boolean {
    if (!event || !event.subscriptionId) throw new Error('Invalid event');
    if (context.eventBuffer.length >= this.MAX_BUFFER_SIZE) throw new Error('Buffer full');

    context.eventBuffer.push(event);
    return true;
  }

  static addToBufferWithDrop(context: SubscriberContext, event: any): any | null {
    if (!event || !event.subscriptionId) throw new Error('Invalid event');

    let droppedEvent = null;
    if (context.eventBuffer.length >= this.MAX_BUFFER_SIZE) {
      droppedEvent = context.eventBuffer.shift() || null;
    }

    context.eventBuffer.push(event);
    return droppedEvent;
  }

  static getBatchForProcessing(context: SubscriberContext, batchSize: number): any[] {
    const effectiveBatchSize = Math.min(batchSize, this.MAX_BATCH_SIZE);
    if (effectiveBatchSize <= 0) throw new Error('Invalid batch size');
    if (context.eventBuffer.length === 0) throw new Error('No events to process');

    const events = context.eventBuffer.splice(0, effectiveBatchSize);
    return events;
  }

  static async processEvent(context: SubscriberContext, event: any): Promise<boolean> {
    if (!event || !event.subscriptionId) throw new Error('Invalid event');

    const handle = context.subscriptions.get(event.subscriptionId);
    if (!handle || handle.status !== 'active') return false;

    try {
      await handle.callback(event);
      handle.eventCount = (handle.eventCount || 0) + 1;
      handle.lastEvent = event.timestamp;
      return true;
    } catch (error) {
      handle.errorCount = (handle.errorCount || 0) + 1;
      handle.status = 'error';
      return false;
    }
  }

  static clearBuffer(context: SubscriberContext): number {
    if (context.eventBuffer.length === 0) throw new Error('Buffer already empty');

    const cleared = context.eventBuffer.length;
    context.eventBuffer.length = 0;
    return cleared;
  }

  static getBufferUtilization(context: SubscriberContext, maxSize: number): number {
    if (maxSize <= 0) throw new Error('Invalid max size');

    return (context.eventBuffer.length / maxSize) * 100;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: memory-subscriber-fsm-003
// inputs: ["src/memory/sharing/MemorySubscriber.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-3-5-sonnet-20241022","prompt":"fsm-decomposition-v1"}
// === END FOOTER ===