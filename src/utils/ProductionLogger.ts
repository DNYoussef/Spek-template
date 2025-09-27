/**
 * Production Logger - Structured Logging System
 * Replaces console.log statements in production code
 */

export interface LogContext {
  component?: string;
  operation?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  error?: string;
  title?: string;
  issueNumber?: number;
  metrics?: any;
  projectId?: number;
  context?: string;
  [key: string]: any; // Allow additional properties for flexibility
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
}

export class ProductionLogger {
  private static instance: ProductionLogger;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  static getInstance(): ProductionLogger {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger();
    }
    return ProductionLogger.instance;
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  critical(message: string, error?: Error, context?: LogContext): void {
    this.log('critical', message, context, error);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } as Error : undefined
    };

    if (this.isProduction) {
      // In production, use structured JSON logging
      console.log(JSON.stringify(entry));
    } else {
      // In development, use readable format
      const contextStr = context ? ` [${context.component || 'UNKNOWN'}]` : '';
      const errorStr = error ? ` ERROR: ${error.message}` : '';
      console.log(`[${entry.timestamp}] ${level.toUpperCase()}${contextStr}: ${message}${errorStr}`);
    }
  }
}

// Export singleton instance
export const logger = ProductionLogger.getInstance();

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-27T02:35:00-04:00 | production-validator@claude-sonnet-4 | Create production logging system to replace console.log | ProductionLogger.ts | OK | Structured logging with JSON output for production | 0.00 | def5678 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: theater-remediation-002
 * - inputs: ["production-requirements"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4","prompt":"production-validation"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */