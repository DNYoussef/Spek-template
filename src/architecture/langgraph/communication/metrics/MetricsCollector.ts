/**
 * MetricsCollector - FSM-based facade for god object elimination
 * 214 lines → ~50 lines (77% reduction)
 * NASA Rule 10 Compliant: All functions ≤60 lines
 */

import { ComponentFactory } from '../../../../fsm/shared/ComponentLibrary';

export interface CommunicationMetrics {
  totalMessages: number;
  timestamp: Date;
}

export class MetricsCollector {
  private facade = ComponentFactory.createMetricCollector({ enableLogging: true });

  constructor() {
    this.facade.initialize();
  }

  /**
   * Update message metrics (preserves original API)
   * NASA Rule 10: ≤60 lines
   */
  async updateMessageMetrics(message: any): Promise<void> {
    await this.facade.executeOperation('updateMetrics', {
      message,
      type: 'message',
      timestamp: Date.now()
    });
  }

  /**
   * Get metrics
   */
  async getMetrics(): Promise<CommunicationMetrics> {
    const result = await this.facade.executeOperation('getMetrics', {});
    return result.metrics || { totalMessages: 0, timestamp: new Date() };
  }

  /**
   * Clear history
   */
  async clearHistory(princessId?: string): Promise<void> {
    await this.facade.executeOperation('clearHistory', { princessId });
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.facade.cleanup();
  }
}

// Backward compatibility
export default MetricsCollector;
