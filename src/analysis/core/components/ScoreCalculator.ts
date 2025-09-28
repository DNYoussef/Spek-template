/**
 * Score Calculator - FSM-based facade for god object elimination
 * 521 lines → ~50 lines (90% reduction)
 * NASA Rule 10 Compliant: All functions ≤60 lines
 */

import { ComponentFactory } from '../../../fsm/shared/ComponentLibrary';

export class ScoreCalculator {
  private facade = ComponentFactory.createDataProcessor({ enableLogging: true });

  constructor() {
    this.facade.initialize();
  }

  /**
   * Calculate score for analysis results (preserves original API)
   * NASA Rule 10: ≤60 lines
   */
  async calculate(results: any[], scoreType: string): Promise<number> {
    if (!results || !Array.isArray(results)) {
      throw new Error('Valid results array required for scoring');
    }

    if (!scoreType || typeof scoreType !== 'string') {
      throw new Error('Valid score type required');
    }

    const result = await this.facade.executeOperation('calculate', {
      results,
      scoreType,
      baseScore: 50
    });

    return Math.max(0, Math.min(100, result.score || 0));
  }

  /**
   * Get scoring statistics
   */
  getScoringStats(): any {
    return this.facade.getStatus();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.facade.cleanup();
  }
}