import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';

export interface LoadConfig {
  concurrency: number;
  duration: number; // milliseconds
  rampUpTime: number; // milliseconds
  rampDownTime: number; // milliseconds
  requestsPerSecond?: number;
  maxRequests?: number;
  payload?: any;
  targetFunction?: string;
  targetModule?: string;
  warmupRequests?: number;
  cooldownTime?: number;
  distributionPattern: 'constant' | 'ramp' | 'spike' | 'burst' | 'wave';
  timeout?: number;
}

export interface LoadResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errors: LoadError[];
  throughput: number;
  concurrency: number;
  duration: number;
  timestamps: number[];
  responseTimes: number[];
  memoryUsage: any[];
  cpuUsage: any[];
}

export interface LoadError {
  timestamp: number;
  error: string;
  workerId?: number;
  requestId?: string;
}

export interface WorkerResult {
  workerId: number;
  requests: number;
  successes: number;
  failures: number;
  responseTimes: number[];
  errors: LoadError[];
  memorySnapshots: any[];
  cpuSnapshots: any[];
}

export class LoadGenerator extends EventEmitter {
  private workers: Worker[] = [];
  private results: WorkerResult[] = [];
  private isRunning = false;
  private startTime = 0;
  private endTime = 0;

  constructor() {
    super();
  }

  async generateLoad(config: LoadConfig): Promise<LoadResult> {
    if (this.isRunning) {
      throw new Error('Load generation already in progress');
    }

    console.log(`Starting load generation with ${config.concurrency} workers`);
    this.emit('load-start', config);

    this.isRunning = true;
    this.startTime = Date.now();
    this.results = [];

    try {
      // Warmup phase if specified
      if (config.warmupRequests && config.warmupRequests > 0) {
        await this.runWarmup(config);
      }

      // Main load generation
      const workerPromises = await this.spawnWorkers(config);
      const workerResults = await Promise.all(workerPromises);

      this.endTime = Date.now();
      this.results = workerResults;

      // Cooldown if specified
      if (config.cooldownTime && config.cooldownTime > 0) {
        await this.sleep(config.cooldownTime);
      }

      const aggregatedResults = this.aggregateResults(config);

      this.emit('load-complete', aggregatedResults);
      return aggregatedResults;

    } catch (error) {
      this.emit('load-error', error);
      throw error;
    } finally {
      this.cleanup();
      this.isRunning = false;
    }
  }

  private async runWarmup(config: LoadConfig): Promise<void> {
    console.log(`Running warmup with ${config.warmupRequests} requests`);

    const warmupConfig: LoadConfig = {
      ...config,
      duration: 10000, // 10 seconds max
      concurrency: Math.min(config.concurrency, 2),
      maxRequests: config.warmupRequests
    };

    // Run simplified warmup
    const worker = await this.createWorker(0, warmupConfig, true);
    await new Promise((resolve, reject) => {
      worker.on('message', (result) => {
        resolve(result);
      });
      worker.on('error', reject);
    });

    await this.terminateWorker(worker);
  }

  private async spawnWorkers(config: LoadConfig): Promise<Promise<WorkerResult>[]> {
    const workerPromises: Promise<WorkerResult>[] = [];

    for (let i = 0; i < config.concurrency; i++) {
      const workerPromise = this.createAndRunWorker(i, config);
      workerPromises.push(workerPromise);

      // Stagger worker startup to implement ramp-up
      if (config.rampUpTime > 0 && i > 0) {
        const delay = (config.rampUpTime / config.concurrency) * i;
        await this.sleep(delay);
      }
    }

    return workerPromises;
  }

  private async createAndRunWorker(workerId: number, config: LoadConfig): Promise<WorkerResult> {
    const worker = await this.createWorker(workerId, config);
    this.workers.push(worker);

    return new Promise((resolve, reject) => {
      worker.on('message', (result: WorkerResult) => {
        this.emit('worker-complete', { workerId, result });
        resolve(result);
      });

      worker.on('error', (error) => {
        this.emit('worker-error', { workerId, error });
        reject(error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker ${workerId} exited with code ${code}`));
        }
      });

      // Handle worker progress updates
      worker.on('message', (message) => {
        if (message.type === 'progress') {
          this.emit('worker-progress', { workerId, ...message.data });
        }
      });
    });
  }

  private async createWorker(workerId: number, config: LoadConfig, isWarmup = false): Promise<Worker> {
    // Create worker script if it doesn't exist
    const workerScript = await this.createWorkerScript();

    const worker = new Worker(workerScript, {
      workerData: {
        workerId,
        config,
        isWarmup
      }
    });

    return worker;
  }

  private async createWorkerScript(): Promise<string> {
    const workerScriptPath = path.join(__dirname, 'load-worker.js');

    if (!fs.existsSync(workerScriptPath)) {
      const workerCode = this.generateWorkerCode();
      fs.writeFileSync(workerScriptPath, workerCode);
    }

    return workerScriptPath;
  }

  private generateWorkerCode(): string {
    return `
const { parentPort, workerData } = require('worker_threads');
const { performance } = require('perf_hooks');

class LoadWorker {
  constructor(workerId, config, isWarmup = false) {
    this.workerId = workerId;
    this.config = config;
    this.isWarmup = isWarmup;
    this.requests = 0;
    this.successes = 0;
    this.failures = 0;
    this.responseTimes = [];
    this.errors = [];
    this.memorySnapshots = [];
    this.cpuSnapshots = [];
    this.startTime = 0;
    this.shouldStop = false;
  }

  async run() {
    this.startTime = Date.now();
    const endTime = this.startTime + this.config.duration;

    // Calculate request interval
    const targetRPS = this.config.requestsPerSecond || 10;
    const requestInterval = 1000 / (targetRPS / this.config.concurrency);

    console.log(\`Worker \${this.workerId} starting load generation\`);

    while (Date.now() < endTime && !this.shouldStop) {
      if (this.config.maxRequests && this.requests >= this.config.maxRequests) {
        break;
      }

      await this.executeRequest();

      // Apply distribution pattern delay
      const delay = this.calculateDelay(requestInterval);
      if (delay > 0) {
        await this.sleep(delay);
      }

      // Send progress update every 100 requests
      if (this.requests % 100 === 0) {
        parentPort.postMessage({
          type: 'progress',
          data: {
            requests: this.requests,
            successes: this.successes,
            failures: this.failures
          }
        });
      }
    }

    // Send final result
    parentPort.postMessage({
      workerId: this.workerId,
      requests: this.requests,
      successes: this.successes,
      failures: this.failures,
      responseTimes: this.responseTimes,
      errors: this.errors,
      memorySnapshots: this.memorySnapshots,
      cpuSnapshots: this.cpuSnapshots
    });
  }

  async executeRequest() {
    const requestId = \`\${this.workerId}-\${this.requests}\`;
    const startTime = performance.now();

    try {
      // Capture memory before request
      this.memorySnapshots.push({
        timestamp: Date.now(),
        usage: process.memoryUsage()
      });

      // Capture CPU before request
      const cpuBefore = process.cpuUsage();

      // Execute the actual work
      await this.performWork();

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      this.responseTimes.push(responseTime);
      this.successes++;

      // Capture CPU after request
      const cpuAfter = process.cpuUsage(cpuBefore);
      this.cpuSnapshots.push({
        timestamp: Date.now(),
        usage: cpuAfter
      });

    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      this.errors.push({
        timestamp: Date.now(),
        error: error.message,
        workerId: this.workerId,
        requestId
      });

      this.failures++;
    }

    this.requests++;
  }

  async performWork() {
    // Default work simulation - CPU intensive task
    if (this.config.targetFunction && this.config.targetModule) {
      // Load and execute custom function
      const module = require(this.config.targetModule);
      const fn = module[this.config.targetFunction];

      if (typeof fn === 'function') {
        return await fn(this.config.payload);
      }
    }

    // Default CPU-intensive work
    await this.simulateCPUWork();
  }

  async performRealCPUWork(operationId: number = 0) {
    // Real CPU-intensive work with deterministic complexity
    let sum = 0;
    const iterations = 1000 + (operationId % 9000); // Deterministic iterations based on operationId

    for (let i = 0; i < iterations; i++) {
      sum += Math.sqrt(i) * Math.sin(i);
    }

    // Real async I/O with deterministic timing
    const ioDelay = 5 + (operationId % 10); // Variable but deterministic delay
    await this.sleep(ioDelay);

    return sum;
  }

  calculateDelay(baseInterval) {
    const elapsed = Date.now() - this.startTime;
    const progress = elapsed / this.config.duration;

    switch (this.config.distributionPattern) {
      case 'constant':
        return baseInterval;

      case 'ramp':
        // Gradually increase load
        return baseInterval * (2 - progress);

      case 'spike':
        // Sudden spike in the middle
        const spikePoint = 0.5;
        const spikeWidth = 0.1;
        if (Math.abs(progress - spikePoint) < spikeWidth) {
          return baseInterval * 0.1; // 10x faster
        }
        return baseInterval;

      case 'burst':
        // Periodic bursts
        const burstFreq = 0.1; // 10% of time is burst
        if ((elapsed % 10000) < (10000 * burstFreq)) {
          return baseInterval * 0.2; // 5x faster during burst
        }
        return baseInterval * 2; // Slower between bursts

      case 'wave':
        // Sine wave pattern
        const amplitude = 0.8;
        const frequency = 2;
        const multiplier = 1 + amplitude * Math.sin(frequency * Math.PI * progress);
        return baseInterval * multiplier;

      default:
        return baseInterval;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Worker entry point
if (workerData) {
  const worker = new LoadWorker(
    workerData.workerId,
    workerData.config,
    workerData.isWarmup
  );

  worker.run().catch(error => {
    console.error(\`Worker \${workerData.workerId} error:\`, error);
    process.exit(1);
  });
}
`;
  }

  private aggregateResults(config: LoadConfig): LoadResult {
    const allResponseTimes: number[] = [];
    const allTimestamps: number[] = [];
    const allErrors: LoadError[] = [];
    const allMemoryUsage: any[] = [];
    const allCpuUsage: any[] = [];

    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;

    this.results.forEach(result => {
      totalRequests += result.requests;
      successfulRequests += result.successes;
      failedRequests += result.failures;
      allResponseTimes.push(...result.responseTimes);
      allErrors.push(...result.errors);
      allMemoryUsage.push(...result.memorySnapshots);
      allCpuUsage.push(...result.cpuSnapshots);
    });

    // Calculate statistics
    const sortedResponseTimes = allResponseTimes.sort((a, b) => a - b);
    const actualDuration = this.endTime - this.startTime;

    const result: LoadResult = {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: this.calculateMean(allResponseTimes),
      minResponseTime: Math.min(...allResponseTimes),
      maxResponseTime: Math.max(...allResponseTimes),
      p50ResponseTime: this.calculatePercentile(sortedResponseTimes, 50),
      p95ResponseTime: this.calculatePercentile(sortedResponseTimes, 95),
      p99ResponseTime: this.calculatePercentile(sortedResponseTimes, 99),
      requestsPerSecond: (totalRequests / actualDuration) * 1000,
      errors: allErrors,
      throughput: (successfulRequests / actualDuration) * 1000,
      concurrency: config.concurrency,
      duration: actualDuration,
      timestamps: allTimestamps,
      responseTimes: allResponseTimes,
      memoryUsage: allMemoryUsage,
      cpuUsage: allCpuUsage
    };

    return result;
  }

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  private async terminateWorker(worker: Worker): Promise<void> {
    return new Promise((resolve) => {
      worker.terminate().then(() => {
        resolve();
      }).catch(() => {
        // Force termination
        resolve();
      });
    });
  }

  private async cleanup(): Promise<void> {
    const terminationPromises = this.workers.map(worker => this.terminateWorker(worker));
    await Promise.all(terminationPromises);
    this.workers = [];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateConstantLoad(config: Omit<LoadConfig, 'distributionPattern'>): Promise<LoadResult> {
    return this.generateLoad({ ...config, distributionPattern: 'constant' });
  }

  async generateRampLoad(config: Omit<LoadConfig, 'distributionPattern'>): Promise<LoadResult> {
    return this.generateLoad({ ...config, distributionPattern: 'ramp' });
  }

  async generateSpikeLoad(config: Omit<LoadConfig, 'distributionPattern'>): Promise<LoadResult> {
    return this.generateLoad({ ...config, distributionPattern: 'spike' });
  }

  async generateBurstLoad(config: Omit<LoadConfig, 'distributionPattern'>): Promise<LoadResult> {
    return this.generateLoad({ ...config, distributionPattern: 'burst' });
  }

  async generateWaveLoad(config: Omit<LoadConfig, 'distributionPattern'>): Promise<LoadResult> {
    return this.generateLoad({ ...config, distributionPattern: 'wave' });
  }

  isGeneratingLoad(): boolean {
    return this.isRunning;
  }

  async stopLoadGeneration(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping load generation...');
    this.isRunning = false;

    // Signal workers to stop
    this.workers.forEach(worker => {
      worker.postMessage({ type: 'stop' });
    });

    // Wait a bit for graceful shutdown
    await this.sleep(1000);

    // Force cleanup
    await this.cleanup();
  }

  getActiveWorkerCount(): number {
    return this.workers.length;
  }

  getCurrentResults(): WorkerResult[] {
    return [...this.results];
  }
}

export default LoadGenerator;