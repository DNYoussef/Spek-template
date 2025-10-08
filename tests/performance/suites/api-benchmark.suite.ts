/**
 * API Performance Benchmark Suite
 *
 * Comprehensive API endpoint testing including:
 * - REST API response times
 * - GraphQL query performance
 * - WebSocket connection latency
 * - Authentication overhead
 * - Rate limiting behavior
 * - Concurrent request handling
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { PerformanceBenchmarker } from '../../../src/performance/PerformanceBenchmarker';
import { BenchmarkSuite, BenchmarkTest, BenchmarkConfig, BenchmarkResult } from '../../../src/performance/types';

export interface APIEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | object;
  expectedStatusCodes: number[];
  timeout: number;
}

export interface APIBenchmarkConfig extends BenchmarkConfig {
  endpoints: APIEndpoint[];
  concurrentUsers: number[];
  rampUpDuration: number;
  sustainDuration: number;
  rampDownDuration: number;
  authToken?: string;
  retryAttempts: number;
  maxLatency: number;
  minThroughput: number;
}

export interface APIMetrics {
  endpoint: string;
  responseTime: number;
  statusCode: number;
  contentLength: number;
  dnsLookup: number;
  tcpConnection: number;
  tlsHandshake: number;
  firstByte: number;
  contentTransfer: number;
  totalTime: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

export class APIBenchmarkSuite extends EventEmitter implements BenchmarkSuite {
  public readonly name = 'API Performance Benchmark';
  public readonly description = 'Comprehensive API endpoint performance testing';
  public readonly version = '1.0.0';

  private config: APIBenchmarkConfig;
  private activeRequests = new Map<string, number>();
  private metrics: APIMetrics[] = [];
  private workers: Worker[] = [];

  constructor(config: APIBenchmarkConfig) {
    super();
    this.config = config;
  }

  public getTests(): BenchmarkTest[] {
    return [
      {
        name: 'Single User Response Time',
        description: 'Measure baseline response times with single user',
        category: 'latency',
        setup: () => this.setupSingleUser(),
        execute: () => this.executeSingleUserTest(),
        teardown: () => this.teardownTest(),
        timeout: 30000
      },
      {
        name: 'Load Test - Concurrent Users',
        description: 'Test API performance under concurrent load',
        category: 'throughput',
        setup: () => this.setupLoadTest(),
        execute: () => this.executeLoadTest(),
        teardown: () => this.teardownTest(),
        timeout: 180000
      },
      {
        name: 'Stress Test - Peak Load',
        description: 'Test API behavior at maximum capacity',
        category: 'stress',
        setup: () => this.setupStressTest(),
        execute: () => this.executeStressTest(),
        teardown: () => this.teardownTest(),
        timeout: 300000
      },
      {
        name: 'Authentication Overhead',
        description: 'Measure authentication impact on performance',
        category: 'security',
        setup: () => this.setupAuthTest(),
        execute: () => this.executeAuthTest(),
        teardown: () => this.teardownTest(),
        timeout: 60000
      },
      {
        name: 'Rate Limiting Behavior',
        description: 'Test API rate limiting and throttling',
        category: 'reliability',
        setup: () => this.setupRateLimitTest(),
        execute: () => this.executeRateLimitTest(),
        teardown: () => this.teardownTest(),
        timeout: 120000
      },
      {
        name: 'Error Handling Performance',
        description: 'Test API error response performance',
        category: 'reliability',
        setup: () => this.setupErrorTest(),
        execute: () => this.executeErrorTest(),
        teardown: () => this.teardownTest(),
        timeout: 60000
      }
    ];
  }

  private async setupSingleUser(): Promise<void> {
    this.metrics = [];
    this.emit('setup', { test: 'Single User Response Time' });
  }

  private async executeSingleUserTest(): Promise<BenchmarkResult> {
    const results: APIMetrics[] = [];

    for (const endpoint of this.config.endpoints) {
      for (let i = 0; i < this.config.iterations; i++) {
        const metric = await this.makeRequest(endpoint);
        results.push(metric);
        this.emit('progress', {
          test: 'Single User Response Time',
          progress: ((i + 1) / this.config.iterations) * 100,
          metric
        });

        // Small delay between requests
        await this.sleep(100);
      }
    }

    return this.analyzeResults(results, 'Single User Response Time');
  }

  private async setupLoadTest(): Promise<void> {
    this.metrics = [];
    this.workers = [];
    this.emit('setup', { test: 'Load Test - Concurrent Users' });
  }

  private async executeLoadTest(): Promise<BenchmarkResult> {
    const results: APIMetrics[] = [];

    for (const userCount of this.config.concurrentUsers) {
      this.emit('progress', {
        test: 'Load Test - Concurrent Users',
        message: `Testing with ${userCount} concurrent users`
      });

      const userResults = await this.runConcurrentUsers(userCount);
      results.push(...userResults);

      // Cool-down period between load levels
      await this.sleep(5000);
    }

    return this.analyzeResults(results, 'Load Test - Concurrent Users');
  }

  private async runConcurrentUsers(userCount: number): Promise<APIMetrics[]> {
    return new Promise((resolve, reject) => {
      const results: APIMetrics[] = [];
      const workers: Worker[] = [];
      let completedWorkers = 0;

      for (let i = 0; i < userCount; i++) {
        const worker = new Worker(__filename, {
          workerData: {
            endpoints: this.config.endpoints,
            iterations: Math.floor(this.config.iterations / userCount),
            workerId: i
          }
        });

        worker.on('message', (data) => {
          if (data.type === 'metrics') {
            results.push(...data.metrics);
          } else if (data.type === 'completed') {
            completedWorkers++;
            if (completedWorkers === userCount) {
              workers.forEach(w => w.terminate());
              resolve(results);
            }
          }
        });

        worker.on('error', reject);
        workers.push(worker);
      }

      // Timeout fallback
      setTimeout(() => {
        workers.forEach(w => w.terminate());
        resolve(results);
      }, this.config.sustainDuration);
    });
  }

  private async setupStressTest(): Promise<void> {
    this.metrics = [];
    this.emit('setup', { test: 'Stress Test - Peak Load' });
  }

  private async executeStressTest(): Promise<BenchmarkResult> {
    const maxUsers = Math.max(...this.config.concurrentUsers) * 2;
    const results: APIMetrics[] = [];

    // Ramp up phase
    this.emit('progress', {
      test: 'Stress Test - Peak Load',
      phase: 'ramp-up',
      message: `Ramping up to ${maxUsers} users`
    });

    const rampUpResults = await this.rampUpLoad(maxUsers);
    results.push(...rampUpResults);

    // Sustain phase
    this.emit('progress', {
      test: 'Stress Test - Peak Load',
      phase: 'sustain',
      message: `Sustaining ${maxUsers} users`
    });

    const sustainResults = await this.runConcurrentUsers(maxUsers);
    results.push(...sustainResults);

    return this.analyzeResults(results, 'Stress Test - Peak Load');
  }

  private async rampUpLoad(targetUsers: number): Promise<APIMetrics[]> {
    const results: APIMetrics[] = [];
    const stepSize = Math.ceil(targetUsers / 10);
    const stepDuration = this.config.rampUpDuration / 10;

    for (let users = stepSize; users <= targetUsers; users += stepSize) {
      const stepResults = await this.runConcurrentUsers(Math.min(users, targetUsers));
      results.push(...stepResults);

      if (users < targetUsers) {
        await this.sleep(stepDuration);
      }
    }

    return results;
  }

  private async setupAuthTest(): Promise<void> {
    this.metrics = [];
    this.emit('setup', { test: 'Authentication Overhead' });
  }

  private async executeAuthTest(): Promise<BenchmarkResult> {
    const results: APIMetrics[] = [];

    // Test without authentication
    for (const endpoint of this.config.endpoints) {
      const endpointWithoutAuth = { ...endpoint };
      delete endpointWithoutAuth.headers?.['Authorization'];

      for (let i = 0; i < this.config.iterations; i++) {
        const metric = await this.makeRequest(endpointWithoutAuth);
        metric.endpoint += '_no_auth';
        results.push(metric);
      }
    }

    // Test with authentication
    for (const endpoint of this.config.endpoints) {
      const endpointWithAuth = {
        ...endpoint,
        headers: {
          ...endpoint.headers,
          'Authorization': this.config.authToken || 'Bearer test-token'
        }
      };

      for (let i = 0; i < this.config.iterations; i++) {
        const metric = await this.makeRequest(endpointWithAuth);
        metric.endpoint += '_with_auth';
        results.push(metric);
      }
    }

    return this.analyzeResults(results, 'Authentication Overhead');
  }

  private async setupRateLimitTest(): Promise<void> {
    this.metrics = [];
    this.emit('setup', { test: 'Rate Limiting Behavior' });
  }

  private async executeRateLimitTest(): Promise<BenchmarkResult> {
    const results: APIMetrics[] = [];
    const burstSize = 100; // Rapid burst of requests

    for (const endpoint of this.config.endpoints) {
      // Send burst of requests to trigger rate limiting
      const promises: Promise<APIMetrics>[] = [];

      for (let i = 0; i < burstSize; i++) {
        promises.push(this.makeRequest(endpoint));
      }

      const burstResults = await Promise.allSettled(promises);

      burstResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          result.value.endpoint += `_burst_${index}`;
          results.push(result.value);
        }
      });

      // Wait before next endpoint
      await this.sleep(2000);
    }

    return this.analyzeResults(results, 'Rate Limiting Behavior');
  }

  private async setupErrorTest(): Promise<void> {
    this.metrics = [];
    this.emit('setup', { test: 'Error Handling Performance' });
  }

  private async executeErrorTest(): Promise<BenchmarkResult> {
    const results: APIMetrics[] = [];

    // Test 404 errors
    const notFoundEndpoint: APIEndpoint = {
      name: '404_test',
      url: this.config.endpoints[0].url + '/nonexistent',
      method: 'GET',
      expectedStatusCodes: [404],
      timeout: 5000
    };

    for (let i = 0; i < this.config.iterations; i++) {
      const metric = await this.makeRequest(notFoundEndpoint);
      results.push(metric);
    }

    // Test 500 errors (if endpoint supports it)
    const errorEndpoint: APIEndpoint = {
      name: '500_test',
      url: this.config.endpoints[0].url + '/error',
      method: 'GET',
      expectedStatusCodes: [500],
      timeout: 5000
    };

    for (let i = 0; i < this.config.iterations; i++) {
      const metric = await this.makeRequest(errorEndpoint);
      results.push(metric);
    }

    return this.analyzeResults(results, 'Error Handling Performance');
  }

  private async makeRequest(endpoint: APIEndpoint): Promise<APIMetrics> {
    const startTime = performance.now();
    const url = new URL(endpoint.url);
    const isHttps = url.protocol === 'https:';

    let dnsStart = 0;
    let dnsEnd = 0;
    let connectStart = 0;
    let connectEnd = 0;
    let tlsStart = 0;
    let tlsEnd = 0;
    let firstByteStart = 0;
    let firstByteEnd = 0;

    return new Promise((resolve) => {
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: endpoint.method,
        headers: {
          'User-Agent': 'API-Benchmark-Suite/1.0',
          ...endpoint.headers
        },
        timeout: endpoint.timeout
      };

      dnsStart = performance.now();

      const req = (isHttps ? https : http).request(options, (res) => {
        firstByteStart = performance.now();

        let data = '';
        let firstByte = true;

        res.on('data', (chunk) => {
          if (firstByte) {
            firstByteEnd = performance.now();
            firstByte = false;
          }
          data += chunk;
        });

        res.on('end', () => {
          const endTime = performance.now();

          const metric: APIMetrics = {
            endpoint: endpoint.name,
            responseTime: endTime - startTime,
            statusCode: res.statusCode || 0,
            contentLength: Buffer.byteLength(data),
            dnsLookup: dnsEnd - dnsStart,
            tcpConnection: connectEnd - connectStart,
            tlsHandshake: tlsEnd - tlsStart,
            firstByte: firstByteEnd - firstByteStart,
            contentTransfer: endTime - firstByteEnd,
            totalTime: endTime - startTime,
            success: endpoint.expectedStatusCodes.includes(res.statusCode || 0),
            timestamp: Date.now()
          };

          resolve(metric);
        });
      });

      req.on('socket', (socket) => {
        socket.on('lookup', () => {
          dnsEnd = performance.now();
          connectStart = performance.now();
        });

        socket.on('connect', () => {
          connectEnd = performance.now();
          if (isHttps) {
            tlsStart = performance.now();
          }
        });

        socket.on('secureConnect', () => {
          tlsEnd = performance.now();
        });
      });

      req.on('error', (error) => {
        const endTime = performance.now();

        const metric: APIMetrics = {
          endpoint: endpoint.name,
          responseTime: endTime - startTime,
          statusCode: 0,
          contentLength: 0,
          dnsLookup: dnsEnd - dnsStart,
          tcpConnection: connectEnd - connectStart,
          tlsHandshake: tlsEnd - tlsStart,
          firstByte: 0,
          contentTransfer: 0,
          totalTime: endTime - startTime,
          success: false,
          error: error.message,
          timestamp: Date.now()
        };

        resolve(metric);
      });

      req.on('timeout', () => {
        req.destroy();
        const endTime = performance.now();

        const metric: APIMetrics = {
          endpoint: endpoint.name,
          responseTime: endTime - startTime,
          statusCode: 0,
          contentLength: 0,
          dnsLookup: dnsEnd - dnsStart,
          tcpConnection: connectEnd - connectStart,
          tlsHandshake: tlsEnd - tlsStart,
          firstByte: 0,
          contentTransfer: 0,
          totalTime: endTime - startTime,
          success: false,
          error: 'Request timeout',
          timestamp: Date.now()
        };

        resolve(metric);
      });

      if (endpoint.body) {
        const body = typeof endpoint.body === 'string'
          ? endpoint.body
          : JSON.stringify(endpoint.body);
        req.write(body);
      }

      req.end();
    });
  }

  private analyzeResults(metrics: APIMetrics[], testName: string): BenchmarkResult {
    const responseTimes = metrics.map(m => m.responseTime);
    const successfulRequests = metrics.filter(m => m.success);
    const failedRequests = metrics.filter(m => !m.success);

    const throughput = successfulRequests.length / (this.config.sustainDuration / 1000);
    const errorRate = (failedRequests.length / metrics.length) * 100;

    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);

    // Calculate status code distribution
    const statusCodes = metrics.reduce((acc, metric) => {
      acc[metric.statusCode] = (acc[metric.statusCode] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      testName,
      timestamp: Date.now(),
      duration: this.config.sustainDuration,
      iterations: metrics.length,
      metrics: {
        throughput: {
          value: throughput,
          unit: 'requests/second'
        },
        responseTime: {
          avg: avgResponseTime,
          min: minResponseTime,
          max: maxResponseTime,
          p50,
          p95,
          p99,
          unit: 'milliseconds'
        },
        errorRate: {
          value: errorRate,
          unit: 'percentage'
        },
        successRate: {
          value: 100 - errorRate,
          unit: 'percentage'
        }
      },
      details: {
        totalRequests: metrics.length,
        successfulRequests: successfulRequests.length,
        failedRequests: failedRequests.length,
        statusCodes,
        endpoints: this.groupMetricsByEndpoint(metrics),
        timingBreakdown: this.calculateTimingBreakdown(successfulRequests)
      },
      passed: errorRate < 5 && avgResponseTime < this.config.maxLatency && throughput > this.config.minThroughput
    };
  }

  private groupMetricsByEndpoint(metrics: APIMetrics[]): Record<string, any> {
    const grouped = metrics.reduce((acc, metric) => {
      if (!acc[metric.endpoint]) {
        acc[metric.endpoint] = [];
      }
      acc[metric.endpoint].push(metric);
      return acc;
    }, {} as Record<string, APIMetrics[]>);

    const result: Record<string, any> = {};

    Object.entries(grouped).forEach(([endpoint, endpointMetrics]) => {
      const responseTimes = endpointMetrics.map(m => m.responseTime);
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const successRate = (endpointMetrics.filter(m => m.success).length / endpointMetrics.length) * 100;

      result[endpoint] = {
        requests: endpointMetrics.length,
        avgResponseTime,
        successRate,
        minResponseTime: Math.min(...responseTimes),
        maxResponseTime: Math.max(...responseTimes)
      };
    });

    return result;
  }

  private calculateTimingBreakdown(metrics: APIMetrics[]): Record<string, number> {
    const breakdown = {
      dnsLookup: 0,
      tcpConnection: 0,
      tlsHandshake: 0,
      firstByte: 0,
      contentTransfer: 0
    };

    if (metrics.length === 0) return breakdown;

    metrics.forEach(metric => {
      breakdown.dnsLookup += metric.dnsLookup;
      breakdown.tcpConnection += metric.tcpConnection;
      breakdown.tlsHandshake += metric.tlsHandshake;
      breakdown.firstByte += metric.firstByte;
      breakdown.contentTransfer += metric.contentTransfer;
    });

    // Calculate averages
    Object.keys(breakdown).forEach(key => {
      breakdown[key as keyof typeof breakdown] /= metrics.length;
    });

    return breakdown;
  }

  private async teardownTest(): Promise<void> {
    // Terminate any active workers
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.activeRequests.clear();
    this.emit('teardown');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Worker thread code for concurrent requests
if (!isMainThread && parentPort) {
  const { endpoints, iterations, workerId } = workerData;

  async function runWorkerRequests() {
    const metrics: APIMetrics[] = [];

    for (let i = 0; i < iterations; i++) {
      for (const endpoint of endpoints) {
        try {
          const suite = new APIBenchmarkSuite({
            endpoints: [endpoint],
            concurrentUsers: [1],
            rampUpDuration: 0,
            sustainDuration: 1000,
            rampDownDuration: 0,
            iterations: 1,
            retryAttempts: 0,
            maxLatency: 5000,
            minThroughput: 1
          });

          const metric = await (suite as any).makeRequest(endpoint);
          metrics.push(metric);

        } catch (error) {
          // Handle worker errors silently
        }
      }
    }

    parentPort?.postMessage({ type: 'metrics', metrics });
    parentPort?.postMessage({ type: 'completed', workerId });
  }

  runWorkerRequests().catch(() => {
    parentPort?.postMessage({ type: 'completed', workerId });
  });
}

// Example usage and configuration
export const defaultAPIBenchmarkConfig: APIBenchmarkConfig = {
  endpoints: [
    {
      name: 'health_check',
      url: 'http://localhost:3000/health',
      method: 'GET',
      expectedStatusCodes: [200],
      timeout: 5000
    },
    {
      name: 'api_list',
      url: 'http://localhost:3000/api/items',
      method: 'GET',
      expectedStatusCodes: [200],
      timeout: 10000
    },
    {
      name: 'api_create',
      url: 'http://localhost:3000/api/items',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: { name: 'test item', value: 123 },
      expectedStatusCodes: [201],
      timeout: 10000
    }
  ],
  concurrentUsers: [1, 5, 10, 25, 50],
  rampUpDuration: 30000,
  sustainDuration: 60000,
  rampDownDuration: 30000,
  iterations: 100,
  retryAttempts: 3,
  maxLatency: 2000,
  minThroughput: 10
};

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-27T08:00:15-04:00 | claude@sonnet-4 | Created comprehensive API performance benchmark suite with real HTTP/HTTPS request testing, concurrent user simulation, authentication overhead testing, rate limiting analysis, and detailed timing breakdowns | api-benchmark.suite.ts | OK | -- | 0.00 | a7f2e9c |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: api-benchmark-creation-001
- inputs: ["API benchmark requirements", "Node.js performance APIs", "HTTP/HTTPS testing patterns"]
- tools_used: ["Write", "performance", "http", "https", "worker_threads"]
- versions: {"model":"claude-sonnet-4","prompt":"api-benchmark-v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->