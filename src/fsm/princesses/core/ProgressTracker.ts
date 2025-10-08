/**
 * ProgressTracker - Tracks workflow progress
 * NASA Rule 10 compliant (≤50 lines per function)
 */

import { DevelopmentState, TransitionRecord } from '../../types/FSMTypes';
import { Logger } from './Logger';

export class ProgressTracker {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Calculate workflow progress
   */
  getProgress(
    currentState: any,
    transitionHistory: TransitionRecord[]
  ): {
    currentState: any;
    completedStates: any[];
    progressPercentage: number;
    estimatedTimeRemaining: number;
  } {
    const totalStates = Object.values(DevelopmentState).length;
    const completedStates = this.extractCompletedStates(transitionHistory);
    const progressPercentage = this.calculateProgressPercentage(completedStates, totalStates);
    const estimatedTimeRemaining = this.estimateTimeRemaining(transitionHistory, totalStates, completedStates.length);

    this.logger.debug(`Progress: ${progressPercentage}%, ETA: ${estimatedTimeRemaining}ms`);

    return {
      currentState,
      completedStates,
      progressPercentage,
      estimatedTimeRemaining
    };
  }

  /**
   * Extract completed states from history
   */
  private extractCompletedStates(transitionHistory: TransitionRecord[]): any[] {
    const completedStates = transitionHistory.map(r => r.to);
    return [...new Set(completedStates)];
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgressPercentage(completedStates: any[], totalStates: number): number {
    return Math.round((completedStates.length / totalStates) * 100);
  }

  /**
   * Estimate remaining time
   */
  private estimateTimeRemaining(transitionHistory: TransitionRecord[], totalStates: number, completedCount: number): number {
    const averageStateTime = this.calculateAverageStateTime(transitionHistory);
    const remainingStates = totalStates - completedCount;
    return remainingStates * averageStateTime;
  }

  /**
   * Calculate average time per state
   */
  private calculateAverageStateTime(transitionHistory: TransitionRecord[]): number {
    if (transitionHistory.length === 0) {
      return 30000; // 30 seconds default
    }
    const totalDuration = transitionHistory.reduce((sum, r) => sum + r.duration, 0);
    return totalDuration / transitionHistory.length;
  }
}