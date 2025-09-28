/**
 * PrincessTransitionHub - Centralized State Transition Management
 * NASA Rule 10 Compliant: Manages all Princess FSM transitions
 * Shared across all 5+ Princess implementations
 */

import { TransitionRecord, FSMContext } from '../../types/FSMTypes';
import { PrincessLogger } from './PrincessLogger';

export class PrincessTransitionHub {
  private transitionHistory: TransitionRecord[] = [];
  private maxHistorySize = 1000;

  constructor(private logger: PrincessLogger) {}

  /**
   * Record a state transition
   */
  recordTransition(
    from: any,
    to: any,
    event: any,
    context: FSMContext,
    duration: number = 0
  ): void {
    const record = this.createTransitionRecord(from, to, event, context, duration);
    this.addToHistory(record);
    this.logTransition(record);
  }

  /**
   * Create transition record
   */
  private createTransitionRecord(
    from: any,
    to: any,
    event: any,
    context: FSMContext,
    duration: number
  ): TransitionRecord {
    return {
      from,
      to,
      event,
      timestamp: Date.now(),
      duration,
      success: true,
      context: { ...context }
    };
  }

  /**
   * Add record to history with size management
   */
  private addToHistory(record: TransitionRecord): void {
    this.transitionHistory.push(record);

    if (this.transitionHistory.length > this.maxHistorySize) {
      this.transitionHistory = this.transitionHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Log transition details
   */
  private logTransition(record: TransitionRecord): void {
    this.logger.log(
      `Transition: ${record.from} -> ${record.to} (${record.event})`,
      { duration: record.duration }
    );
  }

  /**
   * Get transition history
   */
  getHistory(): TransitionRecord[] {
    return [...this.transitionHistory];
  }

  /**
   * Get recent transitions
   */
  getRecentTransitions(count: number = 10): TransitionRecord[] {
    return this.transitionHistory.slice(-count);
  }

  /**
   * Find transitions by pattern
   */
  findTransitions(pattern: { from?: any; to?: any; event?: any }): TransitionRecord[] {
    return this.transitionHistory.filter(record => {
      if (pattern.from && record.from !== pattern.from) return false;
      if (pattern.to && record.to !== pattern.to) return false;
      if (pattern.event && record.event !== pattern.event) return false;
      return true;
    });
  }

  /**
   * Get transition metrics
   */
  getMetrics(): {
    totalTransitions: number;
    averageDuration: number;
    successRate: number;
    mostCommonTransitions: Array<{ from: any; to: any; count: number }>;
  } {
    const total = this.transitionHistory.length;
    const successful = this.transitionHistory.filter(r => r.success).length;
    const avgDuration = this.transitionHistory.reduce((sum, r) => sum + r.duration, 0) / total;

    // Count transition patterns
    const transitionCounts = new Map<string, number>();
    this.transitionHistory.forEach(record => {
      const key = `${record.from}->${record.to}`;
      transitionCounts.set(key, (transitionCounts.get(key) || 0) + 1);
    });

    const mostCommon = Array.from(transitionCounts.entries())
      .map(([key, count]) => {
        const [from, to] = key.split('->');
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalTransitions: total,
      averageDuration: avgDuration,
      successRate: total > 0 ? successful / total : 0,
      mostCommonTransitions: mostCommon
    };
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.transitionHistory = [];
    this.logger.log('Transition history cleared');
  }

  /**
   * Export history for analysis
   */
  exportHistory(): any[] {
    return this.transitionHistory.map(record => ({
      from: record.from,
      to: record.to,
      event: record.event,
      timestamp: new Date(record.timestamp).toISOString(),
      duration: record.duration,
      success: record.success,
      workflowId: record.context.metadata?.workflowId
    }));
  }
}