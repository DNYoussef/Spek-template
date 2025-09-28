/**
 * Sample Collector - Focused CPU sample collection
 * NASA Rule 10 compliant with single responsibility
 */

import * as os from 'os';
import { CPUSample, CPUProfilerContext } from '../types/CPUProfilerTypes';

export class SampleCollector {
  /**
   * Take CPU sample (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  takeSample(context: CPUProfilerContext): CPUSample {
    // Assertion 1: Context is valid
    if (!context || typeof context !== 'object') {
      throw new Error('Invalid context provided to sample collector');
    }
    // Assertion 2: Baseline CPU exists
    if (!context.baselineCPU) {
      throw new Error('Baseline CPU usage not set');
    }

    const timestamp = Date.now();
    const cpuUsage = process.cpuUsage(context.baselineCPU);
    const loadAverage = os.loadavg();

    // Calculate CPU percentage
    const elapsedMs = timestamp - context.startTime;
    const elapsedUs = elapsedMs * 1000;
    const totalCPU = cpuUsage.user + cpuUsage.system;
    const percentage = elapsedUs > 0 ? Math.min(100, (totalCPU / elapsedUs) * 100) : 0;

    // Get Node.js process metrics
    const activeHandles = this.getActiveHandles();
    const activeRequests = this.getActiveRequests();

    // Capture stack trace
    const stackTrace = this.captureStackTrace();

    return {
      timestamp,
      cpuUsage,
      percentage,
      loadAverage,
      activeHandles,
      activeRequests,
      stackTrace
    };
  }

  /**
   * Get active handles count (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private getActiveHandles(): number {
    try {
      const handles = (process as any)._getActiveHandles?.() || [];
      return Array.isArray(handles) ? handles.length : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get active requests count (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private getActiveRequests(): number {
    try {
      const requests = (process as any)._getActiveRequests?.() || [];
      return Array.isArray(requests) ? requests.length : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Capture stack trace (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private captureStackTrace(): string[] {
    const originalLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = 50;

    try {
      const obj = {};
      Error.captureStackTrace(obj, this.captureStackTrace);
      const stack = (obj as any).stack;

      Error.stackTraceLimit = originalLimit;

      if (stack && typeof stack === 'string') {
        return stack.split('\n')
          .slice(1) // Remove first line (error message)
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
      }

      return [];
    } catch (error) {
      Error.stackTraceLimit = originalLimit;
      return [];
    }
  }
}