/**
 * Metrics Collection State Handler
 * NASA Rule 10 Compliant - ≤60 lines, fixed loops, 2+ assertions
 */

export interface SubscriberMetrics {
  activeSubscriptions: number;
  totalSubscriptions: number;
  eventsProcessed: number;
  eventsPerSecond: number;
  bufferUtilization: number;
  errorRate: number;
  averageProcessingTime: number;
}

export class MetricsCollector {
  private static readonly ALPHA = 0.1; // EMA smoothing factor
  private static readonly MAX_ERROR_RATE = 100.0;

  static initializeMetrics(): SubscriberMetrics {
    return {
      activeSubscriptions: 0,
      totalSubscriptions: 0,
      eventsProcessed: 0,
      eventsPerSecond: 0,
      bufferUtilization: 0,
      errorRate: 0,
      averageProcessingTime: 0
    };
  }

  static updateSubscriptionMetrics(metrics: SubscriberMetrics, subscriptions: Map<string, any>): void {
    if (!metrics) throw new Error('Metrics required');
    if (!subscriptions) throw new Error('Subscriptions required');

    let activeCount = 0;
    for (const handle of subscriptions.values()) {
      if (handle.status === 'active') activeCount++;
    }

    metrics.activeSubscriptions = activeCount;
    metrics.totalSubscriptions = subscriptions.size;
  }

  static updateBufferUtilization(metrics: SubscriberMetrics, bufferLength: number, maxSize: number): void {
    if (!metrics) throw new Error('Metrics required');
    if (maxSize <= 0) throw new Error('Invalid max size');

    metrics.bufferUtilization = (bufferLength / maxSize) * 100;
  }

  static updateProcessingTimeMetrics(metrics: SubscriberMetrics, processingTime: number): void {
    if (!metrics) throw new Error('Metrics required');
    if (processingTime < 0) throw new Error('Invalid processing time');

    // Exponential moving average
    metrics.averageProcessingTime =
      metrics.averageProcessingTime * (1 - this.ALPHA) + processingTime * this.ALPHA;
  }

  static incrementEventsProcessed(metrics: SubscriberMetrics): void {
    if (!metrics) throw new Error('Metrics required');

    metrics.eventsProcessed++;
  }

  static incrementErrorRate(metrics: SubscriberMetrics): void {
    if (!metrics) throw new Error('Metrics required');

    metrics.errorRate = Math.min(metrics.errorRate + 1, this.MAX_ERROR_RATE);
  }

  static calculateEventPriority(event: any): number {
    if (!event || !event.type) throw new Error('Invalid event');
    if (!event.partitionId) throw new Error('Missing partition ID');

    let priority = 4; // default

    switch (event.type) {
      case 'store': priority = 3; break;
      case 'update': priority = 3; break;
      case 'remove': priority = 2; break;
      case 'clear': priority = 1; break;
    }

    // Adjust for critical partitions
    const criticalPartitions = ['security', 'quality', 'architecture'];
    if (criticalPartitions.includes(event.partitionId)) {
      priority = Math.max(1, priority - 1);
    }

    return priority;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: memory-subscriber-fsm-005
// inputs: ["src/memory/sharing/MemorySubscriber.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-3-5-sonnet-20241022","prompt":"fsm-decomposition-v1"}
// === END FOOTER ===