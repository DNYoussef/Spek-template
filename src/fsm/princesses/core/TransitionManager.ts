/**
 * TransitionManager - Manages FSM state transitions
 * NASA Rule 10 compliant (≤50 lines per function)
 */

import { TransitionRecord } from '../../types/FSMTypes';
import { Logger } from './Logger';

export class TransitionManager {
  private readonly logger: Logger;
  private transitionHistory: TransitionRecord[] = [];

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Record a state transition
   */
  recordTransition(from: any, to: any, event: any): void {
    const record: TransitionRecord = {
      from,
      to,
      event,
      timestamp: Date.now(),
      duration: 0,
      success: true,
      context: {}
    };

    this.transitionHistory.push(record);
    this.logger.log(`Transition recorded: ${from} -> ${to} (${event})`);
  }

  /**
   * Get transition history
   */
  getHistory(): TransitionRecord[] {
    return [...this.transitionHistory];
  }

  /**
   * Clear transition history
   */
  clearHistory(): void {
    this.transitionHistory = [];
    this.logger.log('Transition history cleared');
  }

  /**
   * Get last transition
   */
  getLastTransition(): TransitionRecord | null {
    return this.transitionHistory[this.transitionHistory.length - 1] || null;
  }
}