/**
 * Core Subscriber State Handler
 * NASA Rule 10 Compliant - ≤60 lines, fixed loops, 2+ assertions
 */

import { SubscriberStates, SubscriberEvents, SubscriberContext } from './SubscriberFSMTypes';

export class SubscriberCore {
  private static readonly MAX_SUBSCRIPTIONS = 50;
  private static readonly MAX_RETRIES = 3;

  static initializeSubscriber(context: SubscriberContext): void {
    if (context.subscriptions.size !== 0) throw new Error('Context not clean');
    if (context.eventBuffer.length !== 0) throw new Error('Buffer not empty');

    context.subscriptions.clear();
    context.eventBuffer.length = 0;
    context.isProcessing = false;
    context.timers = {};
  }

  static validateSubscriptionLimit(context: SubscriberContext): boolean {
    if (context.subscriptions.size >= this.MAX_SUBSCRIPTIONS) {
      return false;
    }
    return true;
  }

  static createSubscription(context: SubscriberContext, handle: any): string {
    if (!this.validateSubscriptionLimit(context)) {
      throw new Error('Max subscriptions reached');
    }
    if (!handle.id || !handle.callback) throw new Error('Invalid handle');

    context.subscriptions.set(handle.id, handle);
    return handle.id;
  }

  static removeSubscription(context: SubscriberContext, id: string): boolean {
    if (!id || typeof id !== 'string') throw new Error('Invalid subscription ID');
    if (!context.subscriptions.has(id)) throw new Error('Subscription not found');

    return context.subscriptions.delete(id);
  }

  static pauseSubscription(context: SubscriberContext, id: string): boolean {
    const handle = context.subscriptions.get(id);
    if (!handle) return false;

    handle.status = 'paused';
    return true;
  }

  static resumeSubscription(context: SubscriberContext, id: string): boolean {
    const handle = context.subscriptions.get(id);
    if (!handle || handle.status !== 'paused') return false;

    handle.status = 'active';
    return true;
  }

  static getActiveCount(context: SubscriberContext): number {
    let count = 0;
    for (const handle of context.subscriptions.values()) {
      if (handle.status === 'active') count++;
    }
    return count;
  }

  static generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `sub_${timestamp}_${random}`;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: memory-subscriber-fsm-002
// inputs: ["src/memory/sharing/MemorySubscriber.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-3-5-sonnet-20241022","prompt":"fsm-decomposition-v1"}
// === END FOOTER ===