/**
 * Production Logger - Real logging infrastructure
 * Replaces console.log statements with proper structured logging
 */

import * as winston from 'winston';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogContext {
  readonly component: string;
  readonly operation?: string;
  readonly metadata?: Record<string, unknown>;
  readonly timestamp?: number;
}

export class Logger {
  private readonly winston: winston.Logger;
  private readonly component: string;

  constructor(component: string) {
    this.component = component;
    this.winston = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  error(message: string, context?: Partial<LogContext>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context?: Partial<LogContext>): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Partial<LogContext>): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Partial<LogContext>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Partial<LogContext>,
    error?: Error
  ): void {
    const logEntry = {
      level,
      message,
      component: this.component,
      operation: context?.operation,
      metadata: context?.metadata,
      timestamp: Date.now(),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    };

    this.winston.log(level, logEntry);
  }
}

// Factory for creating component-specific loggers
export class LoggerFactory {
  private static loggers = new Map<string, Logger>();

  static getLogger(component: string): Logger {
    if (!this.loggers.has(component)) {
      this.loggers.set(component, new Logger(component));
    }
    return this.loggers.get(component)!;
  }
}