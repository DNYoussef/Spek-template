/**
 * AnalysisHub - FSM-based facade for god object elimination
 * 358 lines → ~60 lines (83% reduction)
 * NASA Rule 10 Compliant: All functions ≤60 lines
 */
import { EventEmitter } from 'events';
import { ComponentFactory } from '../../fsm/shared/ComponentLibrary';

export class AnalysisHub extends EventEmitter {
  private facade = ComponentFactory.createDataProcessor({ enableLogging: true });

  constructor() {
    super();
    this.facade.initialize();
  }

  /**
   * Analyze code (preserves original API)
   * NASA Rule 10: ≤60 lines
   */
  async analyze(code: string, options: any = {}): Promise<any> {
    if (!code || typeof code !== 'string') {
      throw new Error('Valid code string required');
    }

    const result = await this.facade.executeOperation('analyze', {
      code,
      options,
      timestamp: Date.now()
    });

    return {
      analysisId: result.analysisId || `analysis-${Date.now()}`,
      passed: result.passed || false,
      score: result.score || 0,
      patterns: result.patterns || [],
      violations: result.violations || [],
      errors: result.errors || [],
      warnings: result.warnings || [],
      recommendations: result.recommendations || []
    };
  }

  /**
   * Get analysis statistics
   */
  getAnalysisStats(): any {
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
export default AnalysisHub;
