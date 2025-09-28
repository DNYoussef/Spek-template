/**
 * Unified Metrics Collector
 * Reusable metrics collection component for all controllers
 */

import {
  ControllerRequest,
  ControllerResponse,
  ControllerError,
  MetricsCollector
} from '../core/ControllerFSMTypes';

export interface Metrics {
  requestsTotal: number;
  requestsSuccessful: number;
  requestsErrors: number;
  requestsPartial: number;
  averageResponseTime: number;
  errorsByCode: Map<string, number>;
  requestsByType: Map<string, number>;
  lastRequestTime: Date | null;
  lastErrorTime: Date | null;
}

export class UnifiedMetricsCollector implements MetricsCollector {
  private metrics: Metrics = {
    requestsTotal: 0,
    requestsSuccessful: 0,
    requestsErrors: 0,
    requestsPartial: 0,
    averageResponseTime: 0,
    errorsByCode: new Map(),
    requestsByType: new Map(),
    lastRequestTime: null,
    lastErrorTime: null
  };

  private requestTimes: Map<string, number> = new Map();
  private responseTimes: number[] = [];
  private maxResponseTimeHistory = 1000; // Keep last 1000 response times

  /**
   * Record an incoming request
   */
  recordRequest(request: ControllerRequest): void {
    this.metrics.requestsTotal++;
    this.metrics.lastRequestTime = new Date();

    // Track request type
    const currentCount = this.metrics.requestsByType.get(request.type) || 0;
    this.metrics.requestsByType.set(request.type, currentCount + 1);

    // Record request start time
    this.requestTimes.set(request.id, Date.now());
  }

  /**
   * Record a response
   */
  recordResponse(response: ControllerResponse): void {
    // Update response counts
    switch (response.status) {
      case 'success':
        this.metrics.requestsSuccessful++;
        break;
      case 'error':
        this.metrics.requestsErrors++;
        if (response.error) {
          this.recordError(response.error);
        }
        break;
      case 'partial':
        this.metrics.requestsPartial++;
        if (response.error) {
          this.recordError(response.error);
        }
        break;
    }

    // Calculate and record response time
    const startTime = this.requestTimes.get(response.requestId);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.recordDuration(response.requestId, duration);
      this.requestTimes.delete(response.requestId);
    }
  }

  /**
   * Record an error
   */
  recordError(error: ControllerError): void {
    this.metrics.lastErrorTime = new Date();

    // Track errors by code
    const currentCount = this.metrics.errorsByCode.get(error.code) || 0;
    this.metrics.errorsByCode.set(error.code, currentCount + 1);
  }

  /**
   * Record request duration
   */
  recordDuration(requestId: string, duration: number): void {
    this.responseTimes.push(duration);

    // Keep only recent response times
    if (this.responseTimes.length > this.maxResponseTimeHistory) {
      this.responseTimes.shift();
    }

    // Update average response time
    this.updateAverageResponseTime();
  }

  /**
   * Get current metrics
   */
  getMetrics(): Metrics {
    return {
      ...this.metrics,
      errorsByCode: new Map(this.metrics.errorsByCode),
      requestsByType: new Map(this.metrics.requestsByType)
    };
  }

  /**
   * Get response time percentiles
   */
  getResponseTimePercentiles(): { p50: number; p90: number; p95: number; p99: number } {
    if (this.responseTimes.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const length = sorted.length;

    return {
      p50: this.getPercentile(sorted, 0.5),
      p90: this.getPercentile(sorted, 0.9),
      p95: this.getPercentile(sorted, 0.95),
      p99: this.getPercentile(sorted, 0.99)
    };
  }

  /**
   * Get error rate (percentage)
   */
  getErrorRate(): number {
    if (this.metrics.requestsTotal === 0) return 0;
    return (this.metrics.requestsErrors / this.metrics.requestsTotal) * 100;
  }

  /**
   * Get success rate (percentage)
   */
  getSuccessRate(): number {
    if (this.metrics.requestsTotal === 0) return 0;
    return (this.metrics.requestsSuccessful / this.metrics.requestsTotal) * 100;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      requestsTotal: 0,
      requestsSuccessful: 0,
      requestsErrors: 0,
      requestsPartial: 0,
      averageResponseTime: 0,
      errorsByCode: new Map(),
      requestsByType: new Map(),
      lastRequestTime: null,
      lastErrorTime: null
    };
    this.requestTimes.clear();
    this.responseTimes = [];
  }

  /**
   * Export metrics for monitoring systems
   */
  exportPrometheusMetrics(): string {
    const metrics = this.getMetrics();
    const percentiles = this.getResponseTimePercentiles();

    let output = '';
    output += `# HELP controller_requests_total Total number of requests\n`;
    output += `# TYPE controller_requests_total counter\n`;
    output += `controller_requests_total ${metrics.requestsTotal}\n\n`;

    output += `# HELP controller_requests_successful_total Total number of successful requests\n`;
    output += `# TYPE controller_requests_successful_total counter\n`;
    output += `controller_requests_successful_total ${metrics.requestsSuccessful}\n\n`;

    output += `# HELP controller_requests_errors_total Total number of error requests\n`;
    output += `# TYPE controller_requests_errors_total counter\n`;
    output += `controller_requests_errors_total ${metrics.requestsErrors}\n\n`;

    output += `# HELP controller_response_time_milliseconds Response time percentiles\n`;
    output += `# TYPE controller_response_time_milliseconds histogram\n`;
    output += `controller_response_time_milliseconds{quantile="0.5"} ${percentiles.p50}\n`;
    output += `controller_response_time_milliseconds{quantile="0.9"} ${percentiles.p90}\n`;
    output += `controller_response_time_milliseconds{quantile="0.95"} ${percentiles.p95}\n`;
    output += `controller_response_time_milliseconds{quantile="0.99"} ${percentiles.p99}\n\n`;

    return output;
  }

  private updateAverageResponseTime(): void {
    if (this.responseTimes.length === 0) {
      this.metrics.averageResponseTime = 0;
    } else {
      const sum = this.responseTimes.reduce((acc, time) => acc + time, 0);
      this.metrics.averageResponseTime = sum / this.responseTimes.length;
    }
  }

  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)];
  }
}