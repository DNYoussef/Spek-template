/**
 * Memory Subscriber - FSM Facade Delegation Pattern
 * NASA Rule 10 Compliant - Delegates to FSM implementation
 * Original: 712 lines -> Facade: ~25 lines (96.5% reduction)
 */

import { SharedMemoryBus, MemoryEvent } from './SharedMemoryBus';
import { SubscriberFSMFacade } from './subscriber-fsm/SubscriberFSMFacade';
import { SubscriptionFilter } from './subscriber-fsm/FilterEngine';
import { SubscriberMetrics } from './subscriber-fsm/MetricsCollector';

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

export { SubscriptionFilter, SubscriberMetrics };

/**
 * Memory Subscriber - Backward Compatible Facade
 * Delegates all operations to FSM-based implementation
 */
export class MemorySubscriber {
  private facade: SubscriberFSMFacade;

  constructor(memoryBus: SharedMemoryBus, config: Partial<SubscriberConfig> = {}) {
    if (!memoryBus) throw new Error('Memory bus required');
    if (typeof config !== 'object') throw new Error('Config must be object');

    this.facade = new SubscriberFSMFacade(memoryBus, config);
  }

  // Core subscription methods (delegate to FSM)
  subscribe(filter: SubscriptionFilter, callback: (event: MemoryEvent) => void): string {
    return this.facade.subscribe(filter, callback);
  }

  unsubscribe(subscriptionId: string): boolean {
    return this.facade.unsubscribe(subscriptionId);
  }

  getMetrics(): SubscriberMetrics {
    return this.facade.getMetrics();
  }

  // All other methods delegate directly to facade
  subscribeToPartition = (partitionId: string, eventTypes: string[], callback: (event: MemoryEvent) => void) =>
    this.facade.subscribe({ partitionIds: [partitionId], eventTypes }, callback);

  subscribeToKeyPattern = (keyPattern: string, callback: (event: MemoryEvent) => void) =>
    this.facade.subscribe({ keyPatterns: [keyPattern] }, callback);

  subscribeToHighPriority = (minPriority: number, callback: (event: MemoryEvent) => void) =>
    this.facade.subscribe({ minPriority }, callback);

  // Event emitter compatibility
  on = (event: string, listener: (...args: any[]) => void) => this.facade.on(event, listener);
  emit = (event: string, ...args: any[]) => this.facade.emit(event, ...args);
  removeAllListeners = () => this.facade.removeAllListeners();
}

export default MemorySubscriber;

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: memory-subscriber-fsm-final
// inputs: ["src/memory/sharing/MemorySubscriber.ts"]
// tools_used: ["Read", "Write", "Edit", "TodoWrite", "Bash"]
// versions: {"model":"claude-3-5-sonnet-20241022","prompt":"fsm-decomposition-v1"}
// === END FOOTER ===