import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import * as os from 'os';

export interface CPUProfile {
  startTime: number;
  endTime: number;
  duration: number;
  samples: CPUSample[];
  aggregatedStats: CPUStats;
  hotspots: CPUHotspot[];
  functions: FunctionProfile[];
  callTree: CallTreeNode;
  analysis: CPUAnalysis;
}

export interface CPUSample {
  timestamp: number;
  cpuUsage: NodeJS.CpuUsage;
  percentage: number;
  loadAverage: number[];
  activeHandles: number;
  activeRequests: number;
  stackTrace?: string[];
}

export interface CPUStats {
  averageUsage: number;
  peakUsage: number;
  userTime: number;
  systemTime: number;
  totalTime: number;
  utilizationRate: number; // 0-1
  efficiency: number; // 0-1
  samples: number;
}

export interface CPUHotspot {
  functionName: string;
  fileName: string;
  lineNumber: number;
  samples: number;
  selfTime: number;
  totalTime: number;
  percentage: number;
  calls: number;
}

export interface FunctionProfile {
  name: string;
  file: string;
  line: number;
  calls: number;
  selfTime: number;
  totalTime: number;
  averageTime: number;
  children: FunctionProfile[];
}

export interface CallTreeNode {
  functionName: string;
  fileName: string;
  lineNumber: number;
  selfTime: number;
  totalTime: number;
  calls: number;
  children: CallTreeNode[];
  parent?: CallTreeNode;
}

export interface CPUAnalysis {
  topCPUConsumers: CPUHotspot[];
  performanceBottlenecks: PerformanceBottleneck[];
  optimizationSuggestions: OptimizationSuggestion[];
  efficiencyScore: number; // 0-1
  threadsAnalysis: ThreadAnalysis;
  resourceContention: ResourceContention[];
}

export interface PerformanceBottleneck {
  type: 'cpu-bound' | 'io-wait' | 'lock-contention' | 'gc-pressure' | 'memory-bound';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: number; // 0-1
  location: {
    function: string;
    file: string;
    line: number;
  };
  evidence: any[];
  recommendation: string;
}

export interface OptimizationSuggestion {
  type: 'algorithmic' | 'caching' | 'parallelization' | 'memory' | 'io';
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedImprovement: string;
  effort: 'low' | 'medium' | 'high';
  target: {
    function: string;
    file: string;
    line?: number;
  };
}

export interface ThreadAnalysis {
  mainThreadUsage: number;
  workerThreadsUsage: number;
  threadPool: {
    size: number;
    utilization: number;
    queueLength: number;
  };
  parallelizationOpportunities: string[];
}

export interface ResourceContention {
  resource: string;
  contentionLevel: number; // 0-1
  waitTime: number;
  affectedFunctions: string[];
  recommendation: string;
}

export class CPUProfiler extends EventEmitter {
  private isProfileActive = false;
  private samples: CPUSample[] = [];
  private startTime = 0;
  private outputDir = '';
  private sampleInterval: NodeJS.Timeout | null = null;
  private baselineCPU: NodeJS.CpuUsage | null = null;
  private v8ProfilePath: string | null = null;

  constructor(outputDir: string = './cpu-profiles') {
    super();
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async startProfiling(intervalMs: number = 100): Promise<void> {
    if (this.isProfileActive) {
      throw new Error('CPU profiling already active');
    }

    console.log('Starting CPU profiling...');
    this.isProfileActive = true;
    this.startTime = Date.now();
    this.samples = [];
    this.baselineCPU = process.cpuUsage();

    // Start V8 CPU profiler if available
    await this.startV8Profiler();

    // Start sampling
    this.sampleInterval = setInterval(() => {
      if (this.isProfileActive) {
        this.takeCPUSample();
      }
    }, intervalMs);

    this.emit('profiling-started', { startTime: this.startTime, interval: intervalMs });
  }

  async stopProfiling(): Promise<CPUProfile> {
    if (!this.isProfileActive) {
      throw new Error('CPU profiling not active');
    }

    console.log('Stopping CPU profiling...');
    this.isProfileActive = false;

    if (this.sampleInterval) {
      clearInterval(this.sampleInterval);
      this.sampleInterval = null;
    }

    // Take final sample
    this.takeCPUSample();

    // Stop V8 profiler
    await this.stopV8Profiler();

    const endTime = Date.now();
    const duration = endTime - this.startTime;

    // Analyze collected data
    const aggregatedStats = this.calculateAggregatedStats();
    const hotspots = this.identifyHotspots();
    const functions = this.analyzeFunctions();
    const callTree = this.buildCallTree();
    const analysis = this.analyzeCPUUsage();

    const profile: CPUProfile = {
      startTime: this.startTime,
      endTime,
      duration,
      samples: [...this.samples],
      aggregatedStats,
      hotspots,
      functions,
      callTree,
      analysis
    };

    this.emit('profiling-stopped', profile);
    return profile;
  }

  private async startV8Profiler(): Promise<void> {
    try {
      // Try to start V8 CPU profiler using inspector
      const inspector = require('inspector');
      const session = new inspector.Session();

      session.connect();
      await new Promise((resolve, reject) => {
        session.post('Profiler.enable', (err) => {
          if (err) reject(err);
          else resolve(undefined);
        });
      });

      await new Promise((resolve, reject) => {
        session.post('Profiler.start', (err) => {
          if (err) reject(err);
          else resolve(undefined);
        });
      });

      // Store session for later cleanup
      (this as any).v8Session = session;

      console.log('V8 CPU profiler started');
    } catch (error) {
      console.warn('V8 CPU profiler not available:', error.message);
    }
  }

  private async stopV8Profiler(): Promise<void> {
    try {
      const session = (this as any).v8Session;
      if (!session) return;

      const profile = await new Promise((resolve, reject) => {
        session.post('Profiler.stop', (err, { profile }) => {
          if (err) reject(err);
          else resolve(profile);
        });
      });

      // Save V8 profile to file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.v8ProfilePath = path.join(this.outputDir, `cpu-profile-${timestamp}.cpuprofile`);
      fs.writeFileSync(this.v8ProfilePath, JSON.stringify(profile, null, 2));

      session.disconnect();
      delete (this as any).v8Session;

      console.log(`V8 CPU profile saved: ${this.v8ProfilePath}`);
      this.emit('v8-profile-saved', { path: this.v8ProfilePath });

    } catch (error) {
      console.warn('Failed to stop V8 profiler:', error);
    }
  }

  private takeCPUSample(): void {
    const timestamp = Date.now();
    const cpuUsage = process.cpuUsage(this.baselineCPU);
    const loadAverage = os.loadavg();

    // Calculate CPU percentage (simplified)
    const elapsedMs = timestamp - this.startTime;
    const elapsedUs = elapsedMs * 1000;
    const totalCPU = cpuUsage.user + cpuUsage.system;
    const percentage = elapsedUs > 0 ? Math.min(100, (totalCPU / elapsedUs) * 100) : 0;

    // Get Node.js process metrics
    const activeHandles = (process as any)._getActiveHandles?.() || [];
    const activeRequests = (process as any)._getActiveRequests?.() || [];

    // Capture stack trace for hotspot analysis
    const stackTrace = this.captureStackTrace();

    const sample: CPUSample = {
      timestamp,
      cpuUsage,
      percentage,
      loadAverage,
      activeHandles: activeHandles.length,
      activeRequests: activeRequests.length,
      stackTrace
    };

    this.samples.push(sample);
    this.emit('sample-taken', sample);
  }

  private captureStackTrace(): string[] {
    const originalLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = 50;

    const obj = {};
    Error.captureStackTrace(obj, this.captureStackTrace);
    const stack = (obj as any).stack;

    Error.stackTraceLimit = originalLimit;

    if (stack) {
      return stack.split('\n')
        .slice(1) // Remove first line (error message)
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);
    }

    return [];
  }

  private calculateAggregatedStats(): CPUStats {
    if (this.samples.length === 0) {
      return {
        averageUsage: 0,
        peakUsage: 0,
        userTime: 0,
        systemTime: 0,
        totalTime: 0,
        utilizationRate: 0,
        efficiency: 0,
        samples: 0
      };
    }

    const percentages = this.samples.map(s => s.percentage);
    const averageUsage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const peakUsage = Math.max(...percentages);

    const lastSample = this.samples[this.samples.length - 1];
    const userTime = lastSample.cpuUsage.user;
    const systemTime = lastSample.cpuUsage.system;
    const totalTime = userTime + systemTime;

    const duration = lastSample.timestamp - this.startTime;
    const utilizationRate = duration > 0 ? totalTime / (duration * 1000) : 0; // Convert to microseconds

    // Calculate efficiency (how well CPU time is used)
    const efficiency = this.calculateCPUEfficiency();

    return {
      averageUsage,
      peakUsage,
      userTime,
      systemTime,
      totalTime,
      utilizationRate: Math.min(1, utilizationRate),
      efficiency,
      samples: this.samples.length
    };
  }

  private calculateCPUEfficiency(): number {
    // CPU efficiency based on consistent utilization vs spikes
    if (this.samples.length < 5) return 1;

    const percentages = this.samples.map(s => s.percentage);
    const mean = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const variance = percentages.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / percentages.length;
    const stdDev = Math.sqrt(variance);

    // Lower variance (more consistent) = higher efficiency
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;
    return Math.max(0, 1 - coefficientOfVariation);
  }

  private identifyHotspots(): CPUHotspot[] {
    const functionCounts = new Map<string, {
      samples: number;
      totalTime: number;
      calls: number;
      file: string;
      line: number;
    }>();

    // Analyze stack traces to find hotspots
    this.samples.forEach((sample, index) => {
      if (sample.stackTrace) {
        sample.stackTrace.forEach(frame => {
          const parsed = this.parseStackFrame(frame);
          if (parsed) {
            const key = `${parsed.function}@${parsed.file}:${parsed.line}`;
            const existing = functionCounts.get(key) || {
              samples: 0,
              totalTime: 0,
              calls: 0,
              file: parsed.file,
              line: parsed.line
            };

            existing.samples++;
            existing.totalTime += sample.cpuUsage.user + sample.cpuUsage.system;
            existing.calls++;

            functionCounts.set(key, existing);
          }
        });
      }
    });

    // Convert to hotspots and sort by samples
    const hotspots: CPUHotspot[] = [];
    const totalSamples = this.samples.length;

    functionCounts.forEach((data, key) => {
      const [functionName] = key.split('@');
      const percentage = totalSamples > 0 ? (data.samples / totalSamples) * 100 : 0;

      hotspots.push({
        functionName,
        fileName: data.file,
        lineNumber: data.line,
        samples: data.samples,
        selfTime: data.totalTime,
        totalTime: data.totalTime, // Simplified - would need call graph for accurate total
        percentage,
        calls: data.calls
      });
    });

    // Sort by percentage (most time consuming first)
    return hotspots
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 20); // Top 20 hotspots
  }

  private parseStackFrame(frame: string): { function: string; file: string; line: number } | null {
    // Parse Node.js stack frame format
    // Examples:
    // "    at functionName (/path/to/file.js:123:45)"
    // "    at /path/to/file.js:123:45"

    const match = frame.match(/at\s+(?:([^(]+)\s+\()?([^:)]+):(\d+):\d+\)?/);
    if (match) {
      const functionName = match[1] || '<anonymous>';
      const file = match[2] || '<unknown>';
      const line = parseInt(match[3]) || 0;

      return {
        function: functionName.trim(),
        file: path.basename(file),
        line
      };
    }

    return null;
  }

  private analyzeFunctions(): FunctionProfile[] {
    // Simplified function analysis based on hotspots
    const hotspots = this.identifyHotspots();

    return hotspots.map(hotspot => ({
      name: hotspot.functionName,
      file: hotspot.fileName,
      line: hotspot.lineNumber,
      calls: hotspot.calls,
      selfTime: hotspot.selfTime,
      totalTime: hotspot.totalTime,
      averageTime: hotspot.calls > 0 ? hotspot.totalTime / hotspot.calls : 0,
      children: [] // Would need call graph analysis for accurate children
    }));
  }

  private buildCallTree(): CallTreeNode {
    // Build a simplified call tree from stack traces
    const root: CallTreeNode = {
      functionName: '<root>',
      fileName: '',
      lineNumber: 0,
      selfTime: 0,
      totalTime: 0,
      calls: 0,
      children: []
    };

    this.samples.forEach(sample => {
      if (sample.stackTrace && sample.stackTrace.length > 0) {
        let currentNode = root;
        const sampleTime = sample.cpuUsage.user + sample.cpuUsage.system;

        // Walk down the stack trace
        for (let i = sample.stackTrace.length - 1; i >= 0; i--) {
          const frame = sample.stackTrace[i];
          const parsed = this.parseStackFrame(frame);

          if (parsed) {
            let childNode = currentNode.children.find(child =>
              child.functionName === parsed.function &&
              child.fileName === parsed.file &&
              child.lineNumber === parsed.line
            );

            if (!childNode) {
              childNode = {
                functionName: parsed.function,
                fileName: parsed.file,
                lineNumber: parsed.line,
                selfTime: 0,
                totalTime: 0,
                calls: 0,
                children: [],
                parent: currentNode
              };
              currentNode.children.push(childNode);
            }

            childNode.calls++;
            childNode.totalTime += sampleTime;

            // Self time only for leaf nodes
            if (i === 0) {
              childNode.selfTime += sampleTime;
            }

            currentNode = childNode;
          }
        }
      }
    });

    return root;
  }

  private analyzeCPUUsage(): CPUAnalysis {
    const hotspots = this.identifyHotspots();
    const topCPUConsumers = hotspots.slice(0, 10);

    const bottlenecks = this.identifyBottlenecks();
    const suggestions = this.generateOptimizationSuggestions(hotspots);
    const efficiencyScore = this.calculateCPUEfficiency();
    const threadsAnalysis = this.analyzeThreadUsage();
    const resourceContention = this.detectResourceContention();

    return {
      topCPUConsumers,
      performanceBottlenecks: bottlenecks,
      optimizationSuggestions: suggestions,
      efficiencyScore,
      threadsAnalysis,
      resourceContention
    };
  }

  private identifyBottlenecks(): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];
    const stats = this.calculateAggregatedStats();

    // High CPU usage bottleneck
    if (stats.averageUsage > 80) {
      const topHotspot = this.identifyHotspots()[0];
      if (topHotspot) {
        bottlenecks.push({
          type: 'cpu-bound',
          severity: stats.averageUsage > 95 ? 'critical' : 'high',
          description: `High CPU usage: ${stats.averageUsage.toFixed(1)}%`,
          impact: stats.averageUsage / 100,
          location: {
            function: topHotspot.functionName,
            file: topHotspot.fileName,
            line: topHotspot.lineNumber
          },
          evidence: [{ averageUsage: stats.averageUsage, peakUsage: stats.peakUsage }],
          recommendation: 'Optimize the most CPU-intensive functions or consider parallelization'
        });
      }
    }

    // IO wait detection (simplified)
    const ioWaitRatio = this.calculateIOWaitRatio();
    if (ioWaitRatio > 0.3) {
      bottlenecks.push({
        type: 'io-wait',
        severity: ioWaitRatio > 0.6 ? 'high' : 'medium',
        description: `High I/O wait time: ${(ioWaitRatio * 100).toFixed(1)}%`,
        impact: ioWaitRatio,
        location: {
          function: '<system>',
          file: '<io>',
          line: 0
        },
        evidence: [{ ioWaitRatio }],
        recommendation: 'Optimize I/O operations or implement asynchronous processing'
      });
    }

    return bottlenecks;
  }

  private calculateIOWaitRatio(): number {
    // Simplified I/O wait calculation
    // In reality, this would require platform-specific monitoring
    const samples = this.samples;
    if (samples.length < 2) return 0;

    let totalIOWait = 0;
    let totalTime = 0;

    for (let i = 1; i < samples.length; i++) {
      const current = samples[i];
      const previous = samples[i - 1];

      const timeDiff = current.timestamp - previous.timestamp;
      const cpuDiff = (current.cpuUsage.user + current.cpuUsage.system) -
                     (previous.cpuUsage.user + previous.cpuUsage.system);

      // If CPU usage is low but time passed, assume I/O wait
      const expectedCPU = timeDiff * 1000; // microseconds
      const ioWait = Math.max(0, expectedCPU - cpuDiff);

      totalIOWait += ioWait;
      totalTime += expectedCPU;
    }

    return totalTime > 0 ? totalIOWait / totalTime : 0;
  }

  private generateOptimizationSuggestions(hotspots: CPUHotspot[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Suggest optimizations for top hotspots
    hotspots.slice(0, 5).forEach(hotspot => {
      if (hotspot.percentage > 10) {
        // High CPU usage function
        suggestions.push({
          type: 'algorithmic',
          priority: hotspot.percentage > 30 ? 'high' : 'medium',
          description: `Optimize ${hotspot.functionName} - consumes ${hotspot.percentage.toFixed(1)}% of CPU`,
          expectedImprovement: `${(hotspot.percentage * 0.3).toFixed(1)}% CPU reduction`,
          effort: hotspot.percentage > 50 ? 'high' : 'medium',
          target: {
            function: hotspot.functionName,
            file: hotspot.fileName,
            line: hotspot.lineNumber
          }
        });
      }

      if (hotspot.calls > 1000) {
        // Frequently called function
        suggestions.push({
          type: 'caching',
          priority: 'medium',
          description: `Consider caching for ${hotspot.functionName} - called ${hotspot.calls} times`,
          expectedImprovement: `${Math.min(50, hotspot.calls / 100).toFixed(0)}% call reduction`,
          effort: 'low',
          target: {
            function: hotspot.functionName,
            file: hotspot.fileName,
            line: hotspot.lineNumber
          }
        });
      }
    });

    // Parallelization suggestions
    const stats = this.calculateAggregatedStats();
    if (stats.averageUsage > 70 && os.cpus().length > 1) {
      suggestions.push({
        type: 'parallelization',
        priority: 'high',
        description: 'Consider parallelizing CPU-intensive work across multiple cores',
        expectedImprovement: `Up to ${Math.min(stats.averageUsage * 0.5, 40).toFixed(0)}% performance improvement`,
        effort: 'high',
        target: {
          function: '<application>',
          file: '<architecture>',
          line: 0
        }
      });
    }

    return suggestions;
  }

  private analyzeThreadUsage(): ThreadAnalysis {
    // Simplified thread analysis
    // In a real implementation, this would monitor actual thread pools

    const stats = this.calculateAggregatedStats();
    const cpuCount = os.cpus().length;

    return {
      mainThreadUsage: stats.averageUsage,
      workerThreadsUsage: 0, // Would need actual worker thread monitoring
      threadPool: {
        size: cpuCount,
        utilization: stats.utilizationRate,
        queueLength: 0 // Would need actual queue monitoring
      },
      parallelizationOpportunities: stats.averageUsage > 60 ? [
        'CPU-intensive computations',
        'Data processing pipelines',
        'Independent calculations'
      ] : []
    };
  }

  private detectResourceContention(): ResourceContention[] {
    const contention: ResourceContention[] = [];

    // Detect potential lock contention based on CPU spikes
    const spikes = this.detectCPUSpikes();
    if (spikes.length > 5) {
      contention.push({
        resource: 'locks/synchronization',
        contentionLevel: Math.min(1, spikes.length / 20),
        waitTime: 0, // Would need actual wait time measurement
        affectedFunctions: ['<multiple>'],
        recommendation: 'Review synchronization mechanisms and consider lock-free alternatives'
      });
    }

    return contention;
  }

  private detectCPUSpikes(): number[] {
    const spikes: number[] = [];
    const threshold = 20; // 20% spike threshold

    for (let i = 1; i < this.samples.length; i++) {
      const current = this.samples[i].percentage;
      const previous = this.samples[i - 1].percentage;

      if (current - previous > threshold) {
        spikes.push(current);
      }
    }

    return spikes;
  }

  getCurrentSample(): CPUSample | null {
    return this.samples.length > 0 ? this.samples[this.samples.length - 1] : null;
  }

  getSamples(): CPUSample[] {
    return [...this.samples];
  }

  isActive(): boolean {
    return this.isProfileActive;
  }

  clearSamples(): void {
    this.samples = [];
  }

  async generateFlameGraph(outputPath?: string): Promise<string | null> {
    if (!this.v8ProfilePath) {
      console.warn('No V8 profile available for flame graph generation');
      return null;
    }

    try {
      // Generate flame graph using external tools (simplified)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const flamegraphPath = outputPath || path.join(this.outputDir, `flamegraph-${timestamp}.svg`);

      // This would require external flame graph tools
      console.log(`Flame graph would be generated at: ${flamegraphPath}`);
      this.emit('flamegraph-generated', { path: flamegraphPath, source: this.v8ProfilePath });

      return flamegraphPath;
    } catch (error) {
      console.error('Failed to generate flame graph:', error);
      return null;
    }
  }

  destroy(): void {
    if (this.isProfileActive) {
      this.stopProfiling();
    }

    this.removeAllListeners();
  }
}

export default CPUProfiler;