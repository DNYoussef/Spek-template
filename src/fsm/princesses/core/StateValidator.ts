/**
 * StateValidator - Validates FSM state conditions
 * NASA Rule 10 compliant (≤50 lines per function)
 */

import { DevelopmentContext } from '../DevelopmentPrincessFSM';
import { Logger } from './Logger';

export class StateValidator {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Check if requirements analysis is complete
   */
  isRequirementsComplete(context: DevelopmentContext): boolean {
    const isComplete = context.requirements?.analyzed === true;
    this.logger.debug(`Requirements complete check: ${isComplete}`);
    return isComplete;
  }

  /**
   * Check if design is valid
   */
  isDesignValid(context: DevelopmentContext): boolean {
    const isValid = context.design?.approved === true;
    this.logger.debug(`Design valid check: ${isValid}`);
    return isValid;
  }

  /**
   * Check if code implementation is complete
   */
  isCodeComplete(context: DevelopmentContext): boolean {
    const isComplete = (context.implementation?.linesOfCode || 0) > 0;
    this.logger.debug(`Code complete check: ${isComplete}`);
    return isComplete;
  }

  /**
   * Check if tests are successful
   */
  areTestsSuccessful(context: DevelopmentContext): boolean {
    const passed = context.testing?.passed === true;
    const coverage = (context.testing?.coverage || 0) >= 80;
    const isSuccessful = passed && coverage;
    this.logger.debug(`Tests successful check: ${isSuccessful} (passed: ${passed}, coverage: ${coverage})`);
    return isSuccessful;
  }

  /**
   * Check if code review is approved
   */
  isReviewApproved(context: DevelopmentContext): boolean {
    const isApproved = context.codeReview?.status === 'approved';
    this.logger.debug(`Review approved check: ${isApproved}`);
    return isApproved;
  }
}