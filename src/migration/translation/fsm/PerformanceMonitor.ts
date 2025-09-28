/**
 * Performance Monitor - FSM component for performance tracking
 * NASA Rule 10 Compliant: Fixed bounds and non-recursive operations
 */

import { PerformanceData } from './MessageFormatTypes';
import { Logger } from '../../../utils/Logger';

export class PerformanceMonitor {
  private logger: Logger;
  private activeMonitors: Map<string, PerformanceData>;

  constructor() {
    this.logger = new Logger('PerformanceMonitor');
    this.activeMonitors = new Map();
  }

  /**
   * Start performance monitoring - NASA Rule 10: Single responsibility
   */
  start(id: string): void {
    // Assertion 1: Valid ID parameter
    console.assert(typeof id === 'string' && id.length > 0, 'Valid monitoring ID required');
    // Assertion 2: Monitor not already active
    console.assert(!this.activeMonitors.has(id), `Monitor ${id} is already active`);

    this.activeMonitors.set(id, {
      startTime: Date.now(),
      startMemory: this.getCurrentMemoryUsage(),
      memoryUsage: 0,
      cpuUsage: 0
    });

    this.logger.debug('Performance monitoring started', { id });
  }

  /**
   * Stop performance monitoring - NASA Rule 10: Single responsibility
   */
  stop(id: string): PerformanceData {
    // Assertion 1: Valid ID parameter
    console.assert(typeof id === 'string' && id.length > 0, 'Valid monitoring ID required');
    // Assertion 2: Monitor exists
    const monitor = this.activeMonitors.get(id);
    console.assert(monitor !== undefined, `Monitor ${id} not found`);

    if (!monitor) {
      return { memoryUsage: 0, cpuUsage: 0 };
    }

    const endMemory = this.getCurrentMemoryUsage();
    const duration = Date.now() - (monitor.startTime || Date.now());

    this.activeMonitors.delete(id);

    const result: PerformanceData = {
      memoryUsage: Math.max(0, endMemory - (monitor.startMemory || 0)),
      cpuUsage: duration // Simplified CPU usage calculation
    };

    this.logger.debug('Performance monitoring stopped', {
      id,
      duration,
      memoryUsage: result.memoryUsage
    });

    return result;
  }

  /**
   * Get current memory usage - NASA Rule 10: Single responsibility
   */
  private getCurrentMemoryUsage(): number {
    // Assertion 1: Environment check
    console.assert(typeof process !== 'undefined' || typeof performance !== 'undefined', 'Memory monitoring capability required');

    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        return process.memoryUsage().heapUsed;
      } else if (typeof performance !== 'undefined' && (performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize || 0;
      } else {
        return 0; // Fallback for environments without memory monitoring
      }
    } catch (error) {
      this.logger.warn('Failed to get memory usage', { error: error.message });
      return 0;
    }
  }

  /**
   * Get active monitor count - NASA Rule 10: Single responsibility
   */
  getActiveMonitorCount(): number {
    // Assertion 1: Monitor map exists
    console.assert(this.activeMonitors instanceof Map, 'Active monitors must be Map instance');

    return this.activeMonitors.size;
  }

  /**
   * Cleanup inactive monitors - NASA Rule 10: Fixed bounds
   */
  cleanup(): void {
    // Assertion 1: Monitor map exists
    console.assert(this.activeMonitors instanceof Map, 'Active monitors must be Map instance');

    const maxAge = 300000; // 5 minutes
    const currentTime = Date.now();
    const monitorsToRemove: string[] = [];
    const maxCleanupCheck = 100; // NASA Rule 10: Fixed bound

    let checkCount = 0;
    for (const [id, monitor] of this.activeMonitors) {
      if (monitor.startTime && (currentTime - monitor.startTime) > maxAge) {
        monitorsToRemove.push(id);
      }

      checkCount++;
      if (checkCount >= maxCleanupCheck) {
        break;
      }
    }

    // NASA Rule 10: Fixed cleanup loop
    for (let i = 0; i < Math.min(monitorsToRemove.length, 50); i++) {
      const id = monitorsToRemove[i];
      this.activeMonitors.delete(id);
      this.logger.debug('Cleaned up inactive monitor', { id });
    }
  }
}