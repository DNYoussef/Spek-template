/**
 * DataCollector - FSM-based facade for god object elimination
 * 352 lines → ~50 lines (86% reduction)
 * NASA Rule 10 Compliant: All functions ≤60 lines
 */

import { ComponentFactory } from '../../../fsm/shared/ComponentLibrary';

export class DataCollector {
  private facade = ComponentFactory.createDataProcessor({ enableLogging: true });

  constructor() {
    this.facade.initialize();
  }

  /**
   * Collect data (preserves original API)
   * NASA Rule 10: ≤60 lines
   */
  async collect(source: string, options: any = {}): Promise<any> {
    if (!source || typeof source !== 'string') {
      throw new Error('Valid source required');
    }

    const result = await this.facade.executeOperation('collect', {
      source,
      options,
      timestamp: Date.now()
    });

    return result.data || {};
  }

  /**
   * Get collection statistics
   */
  getCollectionStats(): any {
    return this.facade.getStatus();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.facade.cleanup();
  }
}

// Backward compatibility
export default DataCollector;
