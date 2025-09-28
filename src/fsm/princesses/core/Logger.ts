/**
 * Logger - Centralized logging for FSM components
 * NASA Rule 10 compliant (≤50 lines per function)
 */

export class Logger {
  private readonly component: string;

  constructor(component: string) {
    this.component = component;
  }

  /**
   * Log informational message
   */
  log(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.component}] ${message}`, data || '');
  }

  /**
   * Log error message
   */
  error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${this.component}] ERROR: ${message}`, error || '');
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [${this.component}] WARNING: ${message}`, data || '');
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] [${this.component}] DEBUG: ${message}`, data || '');
  }
}