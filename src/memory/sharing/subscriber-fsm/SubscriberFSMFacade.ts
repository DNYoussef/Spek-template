/**
 * Memory Subscriber FSM Facade
 * NASA Rule 10 Compliant - Main coordinator ≤60 lines
 */

import { EventEmitter } from 'events';
import { SubscriberStates, SubscriberEvents, SubscriberContext } from './SubscriberFSMTypes';
import { SubscriberTransitionHub } from './SubscriberTransitionHub';
import { SubscriberCore } from './SubscriberCore';
import { EventProcessor } from './EventProcessor';
import { FilterEngine, SubscriptionFilter } from './FilterEngine';
import { MetricsCollector, SubscriberMetrics } from './MetricsCollector';
import { TimerManager } from './TimerManager';

export class SubscriberFSMFacade extends EventEmitter {
  private currentState: SubscriberStates = SubscriberStates.INIT;
  private context: SubscriberContext;
  private memoryBus: any;

  constructor(memoryBus: any, config: any = {}) {
    super();
    if (!memoryBus) throw new Error('Memory bus required');

    this.memoryBus = memoryBus;
    this.context = {
      subscriptions: new Map(),
      eventBuffer: [],
      metrics: MetricsCollector.initializeMetrics(),
      config: { maxSubscriptions: 50, bufferSize: 1000, ...config },
      isProcessing: false,
      timers: {}
    };

    this.initialize();
  }

  private initialize(): void {
    if (this.currentState !== SubscriberStates.INIT) throw new Error('Already initialized');

    SubscriberCore.initializeSubscriber(this.context);
    this.transition(SubscriberEvents.START);
  }

  subscribe(filter: SubscriptionFilter, callback: (event: any) => void): string {
    if (this.currentState !== SubscriberStates.LISTENING) throw new Error('Not in listening state');

    this.transition(SubscriberEvents.SUBSCRIBE_REQUEST);

    const handle = {
      id: SubscriberCore.generateId(),
      filter,
      callback,
      status: 'active',
      eventCount: 0,
      errorCount: 0,
      createdAt: Date.now()
    };

    SubscriberCore.createSubscription(this.context, handle);
    this.transition(SubscriberEvents.SUBSCRIPTION_CREATED);

    return handle.id;
  }

  unsubscribe(id: string): boolean {
    const result = SubscriberCore.removeSubscription(this.context, id);
    MetricsCollector.updateSubscriptionMetrics(this.context.metrics, this.context.subscriptions);
    return result;
  }

  getMetrics(): SubscriberMetrics {
    MetricsCollector.updateSubscriptionMetrics(this.context.metrics, this.context.subscriptions);
    return { ...this.context.metrics };
  }

  private transition(event: SubscriberEvents, payload?: any): void {
    const newState = SubscriberTransitionHub.executeTransition(
      this.currentState, event, this.context, payload
    );
    this.currentState = newState;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: memory-subscriber-fsm-008
// inputs: ["src/memory/sharing/MemorySubscriber.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-3-5-sonnet-20241022","prompt":"fsm-decomposition-v1"}
// === END FOOTER ===