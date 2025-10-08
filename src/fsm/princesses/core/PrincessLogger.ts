/**
 * PrincessLogger - Shared Logging for Princess FSMs
 * NASA Rule 10 Compliant: Centralized logging with Princess-specific formatting
 * Used by all Princess implementations for consistent logging
 */

export class PrincessLogger {
  private principessType: string;
  private startTime: number;

  constructor(principessType: string) {
    this.principessType = principessType;
    this.startTime = Date.now();
  }

  /**
   * Log informational message
   */
  log(message: string, data?: any): void {
    const timestamp = this.getTimestamp();
    const prefix = `[${this.principessType.toUpperCase()}Princess]`;

    if (data) {
      console.log(`${timestamp} ${prefix} ${message}`, data);
    } else {
      console.log(`${timestamp} ${prefix} ${message}`);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    const timestamp = this.getTimestamp();
    const prefix = `[${this.principessType.toUpperCase()}Princess]`;

    if (data) {
      console.warn(`${timestamp} ${prefix} WARNING: ${message}`, data);
    } else {
      console.warn(`${timestamp} ${prefix} WARNING: ${message}`);
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: any): void {
    const timestamp = this.getTimestamp();
    const prefix = `[${this.principessType.toUpperCase()}Princess]`;

    if (error) {
      console.error(`${timestamp} ${prefix} ERROR: ${message}`, error);
    } else {
      console.error(`${timestamp} ${prefix} ERROR: ${message}`);
    }
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = this.getTimestamp();
      const prefix = `[${this.principessType.toUpperCase()}Princess]`;

      if (data) {
        console.debug(`${timestamp} ${prefix} DEBUG: ${message}`, data);
      } else {
        console.debug(`${timestamp} ${prefix} DEBUG: ${message}`);
      }
    }
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, data?: any): void {
    const timestamp = this.getTimestamp();
    const prefix = `[${this.principessType.toUpperCase()}Princess]`;

    const perfData = {
      operation,
      duration: `${duration}ms`,
      ...data
    };

    console.log(`${timestamp} ${prefix} PERF: ${operation}`, perfData);
  }

  /**
   * Log state transition
   */
  transition(from: string, to: string, event: string, duration?: number): void {
    const timestamp = this.getTimestamp();
    const prefix = `[${this.principessType.toUpperCase()}Princess]`;

    const transitionData = {
      from,
      to,
      event,
      ...(duration && { duration: `${duration}ms` })
    };

    console.log(`${timestamp} ${prefix} TRANSITION:`, transitionData);
  }

  /**
   * Log workflow milestone
   */
  milestone(milestone: string, data?: any): void {
    const timestamp = this.getTimestamp();
    const prefix = `[${this.principessType.toUpperCase()}Princess]`;
    const elapsed = Date.now() - this.startTime;

    const milestoneData = {
      milestone,
      elapsed: `${elapsed}ms`,
      ...data
    };

    console.log(`${timestamp} ${prefix} MILESTONE:`, milestoneData);
  }

  /**
   * Log workflow completion
   */
  complete(success: boolean, summary?: any): void {
    const timestamp = this.getTimestamp();
    const prefix = `[${this.principessType.toUpperCase()}Princess]`;
    const totalDuration = Date.now() - this.startTime;

    const completionData = {
      success,
      totalDuration: `${totalDuration}ms`,
      ...summary
    };

    if (success) {
      console.log(`${timestamp} ${prefix} COMPLETED SUCCESSFULLY:`, completionData);
    } else {
      console.error(`${timestamp} ${prefix} COMPLETED WITH FAILURE:`, completionData);
    }
  }

  /**
   * Get formatted timestamp
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Create child logger for sub-components
   */
  createChildLogger(component: string): PrincessLogger {
    return new PrincessChildLogger(this.principessType, component);
  }
}

/**
 * Child logger for Princess sub-components
 */
class PrincessChildLogger extends PrincessLogger {
  private component: string;

  constructor(principessType: string, component: string) {
    super(principessType);
    this.component = component;
  }

  /**
   * Override log method to include component
   */
  log(message: string, data?: any): void {
    const timestamp = this.getTimestamp();
    const prefix = `[${this.principessType.toUpperCase()}Princess:${this.component}]`;

    if (data) {
      console.log(`${timestamp} ${prefix} ${message}`, data);
    } else {
      console.log(`${timestamp} ${prefix} ${message}`);
    }
  }

  /**
   * Override error method to include component
   */
  error(message: string, error?: any): void {
    const timestamp = this.getTimestamp();
    const prefix = `[${this.principessType.toUpperCase()}Princess:${this.component}]`;

    if (error) {
      console.error(`${timestamp} ${prefix} ERROR: ${message}`, error);
    } else {
      console.error(`${timestamp} ${prefix} ERROR: ${message}`);
    }
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }
}