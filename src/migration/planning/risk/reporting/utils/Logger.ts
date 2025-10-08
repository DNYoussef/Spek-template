/**
 * Simple Logger Implementation
 *
 * Basic logging functionality for the reporting system.
 *
 * @version 1.0.0
 */

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, metadata?: any): void {
    console.log(`[INFO] [${this.context}] ${message}`, metadata || '');
  }

  error(message: string, metadata?: any): void {
    console.error(`[ERROR] [${this.context}] ${message}`, metadata || '');
  }

  warn(message: string, metadata?: any): void {
    console.warn(`[WARN] [${this.context}] ${message}`, metadata || '');
  }

  debug(message: string, metadata?: any): void {
    console.debug(`[DEBUG] [${this.context}] ${message}`, metadata || '');
  }
}