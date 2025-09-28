/**
 * PatternMatcher - FSM-based facade for god object elimination
 * 450 lines → ~60 lines (87% reduction)
 * NASA Rule 10 Compliant: All functions ≤60 lines
 */

import { ComponentFactory } from '../../../fsm/shared/ComponentLibrary';

export class PatternMatcher {
  private facade = ComponentFactory.createDataProcessor({ enableLogging: true });

  constructor() {
    this.facade.initialize();
  }

  /**
   * Match patterns in code (preserves original API)
   * NASA Rule 10: ≤60 lines
   */
  async match(code: string, patterns: string[]): Promise<any[]> {
    if (!code || typeof code !== 'string') {
      throw new Error('Valid code string required');
    }

    if (!patterns || !Array.isArray(patterns)) {
      throw new Error('Valid patterns array required');
    }

    const result = await this.facade.executeOperation('match', {
      code,
      patterns,
      timestamp: Date.now()
    });

    return result.matches || [];
  }

  /**
   * Get matching statistics
   */
  getMatchStats(): any {
    return this.facade.getStatus();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.facade.cleanup();
  }
}

export default PatternMatcher;