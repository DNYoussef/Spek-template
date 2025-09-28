/**
 * Unified Controller Logger
 * Reusable logging component for all controllers
 */

import {
  UnifiedControllerState,
  UnifiedControllerEvent,
  ControllerRequest,
  ControllerResponse,
  ControllerError,
  ControllerLogger
} from '../core/ControllerFSMTypes';

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  requestId?: string;
  controllerId?: string;
}

export class UnifiedControllerLogger implements ControllerLogger {
  private logs: LogEntry[] = [];
  private maxLogEntries = 10000;
  private controllerId: string;

  constructor(controllerId: string) {
    this.controllerId = controllerId;
  }

  /**
   * Log state transition
   */
  logStateTransition(
    from: UnifiedControllerState,
    to: UnifiedControllerState,
    event: UnifiedControllerEvent
  ): void {
    this.log('info', `State transition: ${from} -> ${to} (event: ${event})`, {
      from,
      to,
      event,
      type: 'stateTransition'
    });
  }

  /**
   * Log incoming request
   */
  logRequest(request: ControllerRequest): void {
    this.log('info', `Incoming request: ${request.type}`, {
      requestId: request.id,
      requestType: request.type,
      timestamp: request.timestamp,
      type: 'request'
    }, request.id);
  }

  /**
   * Log outgoing response
   */
  logResponse(response: ControllerResponse): void {
    this.log('info', `Outgoing response: ${response.status}`, {
      responseId: response.id,
      requestId: response.requestId,
      status: response.status,
      timestamp: response.timestamp,
      type: 'response'
    }, response.requestId);
  }

  /**
   * Log error
   */
  logError(error: ControllerError): void {
    this.log('error', `Error: ${error.message}`, {
      code: error.code,
      message: error.message,
      details: error.details,
      stack: error.stack,
      type: 'error'
    });
  }

  /**
   * Log debug information
   */
  logDebug(message: string, data?: any, requestId?: string): void {
    this.log('debug', message, { ...data, type: 'debug' }, requestId);
  }

  /**
   * Log warning
   */
  logWarning(message: string, data?: any, requestId?: string): void {
    this.log('warn', message, { ...data, type: 'warning' }, requestId);
  }

  /**
   * Log info
   */
  logInfo(message: string, data?: any, requestId?: string): void {
    this.log('info', message, { ...data, type: 'info' }, requestId);
  }

  /**
   * Get logs for a specific request
   */
  getRequestLogs(requestId: string): LogEntry[] {
    return this.logs.filter(log => log.requestId === requestId);
  }

  /**
   * Get all logs
   */
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: 'debug' | 'info' | 'warn' | 'error'): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogsAsJson(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs in structured format for monitoring
   */
  exportStructuredLogs(): any[] {
    return this.logs.map(log => ({
      '@timestamp': log.timestamp.toISOString(),
      level: log.level,
      message: log.message,
      controller: this.controllerId,
      request_id: log.requestId,
      data: log.data
    }));
  }

  /**
   * Get performance metrics from logs
   */
  getPerformanceMetrics(): {
    requestsPerMinute: number;
    errorsPerMinute: number;
    averageRequestDuration: number;
  } {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    const recentLogs = this.logs.filter(log => log.timestamp >= oneMinuteAgo);
    const requestLogs = recentLogs.filter(log => log.data?.type === 'request');
    const errorLogs = recentLogs.filter(log => log.level === 'error');

    // Calculate average request duration
    const requestDurations: number[] = [];
    const requestGroups = new Map<string, { start?: Date; end?: Date }>();

    recentLogs.forEach(log => {
      if (log.requestId) {
        if (!requestGroups.has(log.requestId)) {
          requestGroups.set(log.requestId, {});
        }
        const group = requestGroups.get(log.requestId)!;

        if (log.data?.type === 'request') {
          group.start = log.timestamp;
        } else if (log.data?.type === 'response') {
          group.end = log.timestamp;
        }
      }
    });

    requestGroups.forEach(group => {
      if (group.start && group.end) {
        requestDurations.push(group.end.getTime() - group.start.getTime());
      }
    });

    const averageDuration = requestDurations.length > 0
      ? requestDurations.reduce((sum, duration) => sum + duration, 0) / requestDurations.length
      : 0;

    return {
      requestsPerMinute: requestLogs.length,
      errorsPerMinute: errorLogs.length,
      averageRequestDuration: averageDuration
    };
  }

  /**
   * Core logging method
   */
  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: any,
    requestId?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      requestId,
      controllerId: this.controllerId
    };

    this.logs.push(entry);

    // Trim logs if too many
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const logMethod = console[level] || console.log;
      logMethod(`[${this.controllerId}] ${message}`, data);
    }
  }
}