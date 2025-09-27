import { performance, PerformanceObserver } from 'perf_hooks';
import * as os from 'os';
import * as process from 'process';
import { EventEmitter } from 'events';

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: NodeJS.CpuUsage;
    loadAvg: number[];
    cores: os.CpuInfo[];
    percentage: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    heap: NodeJS.MemoryUsage;
    rss: number;
    external: number;
    arrayBuffers: number;
  };
  process: {
    pid: number;
    ppid: number;
    uptime: number;
    platform: string;
    arch: string;
    version: string;
    title: string;
  };
  system: {
    hostname: string;
    type: string;
    release: string;
    uptime: number;
    networkInterfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>;
  };
  gc?: {
    collections: number;
    totalTime: number;
    lastCollection: number;
  };
}

export interface PerformanceMetrics {
  marks: PerformanceEntry[];
  measures: PerformanceEntry[];
  functions: PerformanceEntry[];
  resources: PerformanceEntry[];
  navigation: PerformanceEntry[];
  custom: any[];
}

export interface ResourceUsage {
  cpu: {
    user: number;
    system: number;
    total: number;
  };
  memory: {
    peak: number;
    current: number;
    allocated: number;
    freed: number;
  };
  io: {
    reads: number;
    writes: number;
    bytesRead: number;
    bytesWritten: number;
  };
  handles: {
    open: number;
    peak: number;
  };
}

export class MetricsCollector extends EventEmitter {
  private performanceObserver: PerformanceObserver;
  private performanceEntries: PerformanceEntry[] = [];
  private gcStats: any = { collections: 0, totalTime: 0, lastCollection: 0 };
  private resourceBaseline: ResourceUsage | null = null;
  private isCollecting = false;
  private collectionInterval: NodeJS.Timeout | null = null;
  private customMetrics: Map<string, any> = new Map();

  constructor() {
    super();
    this.setupPerformanceObserver();
    this.setupGCTracking();
  }

  private setupPerformanceObserver(): void {
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      this.performanceEntries.push(...entries);

      entries.forEach(entry => {
        this.emit('performance-entry', entry);
      });
    });

    // Observer all entry types
    try {
      this.performanceObserver.observe({
        entryTypes: ['mark', 'measure', 'function', 'navigation', 'resource']
      });
    } catch (error) {
      console.warn('Some performance entry types not supported:', error);
      // Fallback to basic types
      this.performanceObserver.observe({ entryTypes: ['mark', 'measure'] });
    }
  }

  private setupGCTracking(): void {
    // Enable GC tracking if available
    if (global.gc && process.env.NODE_ENV === 'development') {
      const originalGC = global.gc;
      global.gc = () => {
        const start = performance.now();
        originalGC();
        const duration = performance.now() - start;

        this.gcStats.collections++;
        this.gcStats.totalTime += duration;
        this.gcStats.lastCollection = Date.now();

        this.emit('gc-collection', {
          duration,
          collections: this.gcStats.collections,
          totalTime: this.gcStats.totalTime
        });
      };
    }
  }

  collectSystemMetrics(): SystemMetrics {
    const timestamp = performance.now();
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const cpuCores = os.cpus();

    // Calculate CPU percentage
    const cpuPercentage = this.calculateCPUPercentage(cpuUsage, cpuCores.length);

    const metrics: SystemMetrics = {
      timestamp,
      cpu: {
        usage: cpuUsage,
        loadAvg: os.loadavg(),
        cores: cpuCores,
        percentage: cpuPercentage
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        heap: memUsage,
        rss: memUsage.rss,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers
      },
      process: {
        pid: process.pid,
        ppid: process.ppid || 0,
        uptime: process.uptime(),
        platform: process.platform,
        arch: process.arch,
        version: process.version,
        title: process.title
      },
      system: {
        hostname: os.hostname(),
        type: os.type(),
        release: os.release(),
        uptime: os.uptime(),
        networkInterfaces: os.networkInterfaces()
      }
    };

    // Add GC stats if available
    if (this.gcStats.collections > 0) {
      metrics.gc = { ...this.gcStats };
    }

    return metrics;
  }

  private calculateCPUPercentage(cpuUsage: NodeJS.CpuUsage, cpuCount: number): number {
    // Simple CPU percentage calculation
    // Note: This is a basic implementation; more sophisticated tracking would require historical data
    const totalUsage = cpuUsage.user + cpuUsage.system;
    const uptimeMs = process.uptime() * 1000 * 1000; // Convert to microseconds

    if (uptimeMs > 0) {
      return Math.min(100, (totalUsage / uptimeMs) * 100);
    }

    return 0;
  }

  collectPerformanceMetrics(): PerformanceMetrics {
    const allEntries = performance.getEntries();

    const metrics: PerformanceMetrics = {
      marks: allEntries.filter(entry => entry.entryType === 'mark'),
      measures: allEntries.filter(entry => entry.entryType === 'measure'),
      functions: allEntries.filter(entry => entry.entryType === 'function'),
      resources: allEntries.filter(entry => entry.entryType === 'resource'),
      navigation: allEntries.filter(entry => entry.entryType === 'navigation'),
      custom: Array.from(this.customMetrics.values())
    };

    return metrics;
  }

  startContinuousCollection(intervalMs: number = 1000): void {
    if (this.isCollecting) {
      console.warn('Metrics collection already started');
      return;
    }

    this.isCollecting = true;
    this.resourceBaseline = this.collectResourceUsage();

    this.collectionInterval = setInterval(() => {
      const systemMetrics = this.collectSystemMetrics();
      const performanceMetrics = this.collectPerformanceMetrics();
      const resourceUsage = this.collectResourceUsage();

      this.emit('metrics-collected', {
        system: systemMetrics,
        performance: performanceMetrics,
        resources: resourceUsage,
        timestamp: Date.now()
      });
    }, intervalMs);

    console.log(`Started continuous metrics collection (interval: ${intervalMs}ms)`);
  }

  stopContinuousCollection(): void {
    if (!this.isCollecting) {
      console.warn('Metrics collection not started');
      return;
    }

    this.isCollecting = false;

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    console.log('Stopped continuous metrics collection');
  }

  collectResourceUsage(): ResourceUsage {
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();

    const usage: ResourceUsage = {
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        total: cpuUsage.user + cpuUsage.system
      },
      memory: {
        peak: memUsage.rss,
        current: memUsage.heapUsed,
        allocated: memUsage.heapTotal,
        freed: memUsage.heapTotal - memUsage.heapUsed
      },
      io: {
        reads: 0, // Node.js doesn't expose this directly
        writes: 0,
        bytesRead: 0,
        bytesWritten: 0
      },
      handles: {
        open: 0, // Would need platform-specific implementation
        peak: 0
      }
    };

    return usage;
  }

  addCustomMetric(name: string, value: any, metadata?: any): void {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      metadata: metadata || {}
    };

    this.customMetrics.set(name, metric);
    this.emit('custom-metric', metric);
  }

  getCustomMetric(name: string): any {
    return this.customMetrics.get(name);
  }

  getAllCustomMetrics(): Map<string, any> {
    return new Map(this.customMetrics);
  }

  clearCustomMetrics(): void {
    this.customMetrics.clear();
  }

  markPerformancePoint(name: string): void {
    performance.mark(name);
  }

  measurePerformanceBetween(name: string, startMark: string, endMark?: string): PerformanceEntry {
    if (endMark) {
      performance.measure(name, startMark, endMark);
    } else {
      performance.measure(name, startMark);
    }

    // Return the created measure
    const measures = performance.getEntriesByName(name, 'measure');
    return measures[measures.length - 1];
  }

  profileFunction<T>(fn: () => T, name?: string): { result: T; duration: number; metrics: any } {
    const profileName = name || `function-${Date.now()}`;
    const startMark = `${profileName}-start`;
    const endMark = `${profileName}-end`;

    // Collect baseline metrics
    const beforeMetrics = this.collectSystemMetrics();

    performance.mark(startMark);
    const startTime = performance.now();

    try {
      const result = fn();

      const endTime = performance.now();
      performance.mark(endMark);

      // Measure performance
      const measure = this.measurePerformanceBetween(profileName, startMark, endMark);

      // Collect post-execution metrics
      const afterMetrics = this.collectSystemMetrics();

      return {
        result,
        duration: endTime - startTime,
        metrics: {
          measure,
          before: beforeMetrics,
          after: afterMetrics,
          delta: {
            memory: afterMetrics.memory.heap.heapUsed - beforeMetrics.memory.heap.heapUsed,
            cpu: {
              user: afterMetrics.cpu.usage.user - beforeMetrics.cpu.usage.user,
              system: afterMetrics.cpu.usage.system - beforeMetrics.cpu.usage.system
            }
          }
        }
      };
    } catch (error) {
      performance.mark(endMark);
      throw error;
    }
  }

  async profileAsyncFunction<T>(
    fn: () => Promise<T>,
    name?: string
  ): Promise<{ result: T; duration: number; metrics: any }> {
    const profileName = name || `async-function-${Date.now()}`;
    const startMark = `${profileName}-start`;
    const endMark = `${profileName}-end`;

    // Collect baseline metrics
    const beforeMetrics = this.collectSystemMetrics();

    performance.mark(startMark);
    const startTime = performance.now();

    try {
      const result = await fn();

      const endTime = performance.now();
      performance.mark(endMark);

      // Measure performance
      const measure = this.measurePerformanceBetween(profileName, startMark, endMark);

      // Collect post-execution metrics
      const afterMetrics = this.collectSystemMetrics();

      return {
        result,
        duration: endTime - startTime,
        metrics: {
          measure,
          before: beforeMetrics,
          after: afterMetrics,
          delta: {
            memory: afterMetrics.memory.heap.heapUsed - beforeMetrics.memory.heap.heapUsed,
            cpu: {
              user: afterMetrics.cpu.usage.user - beforeMetrics.cpu.usage.user,
              system: afterMetrics.cpu.usage.system - beforeMetrics.cpu.usage.system
            }
          }
        }
      };
    } catch (error) {
      performance.mark(endMark);
      throw error;
    }
  }

  getPerformanceEntries(type?: string): PerformanceEntry[] {
    if (type) {
      return this.performanceEntries.filter(entry => entry.entryType === type);
    }
    return [...this.performanceEntries];
  }

  clearPerformanceEntries(): void {
    this.performanceEntries = [];
    performance.clearMarks();
    performance.clearMeasures();
  }

  getResourceDelta(): ResourceUsage | null {
    if (!this.resourceBaseline) {
      return null;
    }

    const current = this.collectResourceUsage();

    return {
      cpu: {
        user: current.cpu.user - this.resourceBaseline.cpu.user,
        system: current.cpu.system - this.resourceBaseline.cpu.system,
        total: current.cpu.total - this.resourceBaseline.cpu.total
      },
      memory: {
        peak: Math.max(current.memory.peak, this.resourceBaseline.memory.peak),
        current: current.memory.current - this.resourceBaseline.memory.current,
        allocated: current.memory.allocated - this.resourceBaseline.memory.allocated,
        freed: current.memory.freed - this.resourceBaseline.memory.freed
      },
      io: {
        reads: current.io.reads - this.resourceBaseline.io.reads,
        writes: current.io.writes - this.resourceBaseline.io.writes,
        bytesRead: current.io.bytesRead - this.resourceBaseline.io.bytesRead,
        bytesWritten: current.io.bytesWritten - this.resourceBaseline.io.bytesWritten
      },
      handles: {
        open: current.handles.open - this.resourceBaseline.handles.open,
        peak: Math.max(current.handles.peak, this.resourceBaseline.handles.peak)
      }
    };
  }

  generateMetricsSummary(): any {
    const systemMetrics = this.collectSystemMetrics();
    const performanceMetrics = this.collectPerformanceMetrics();
    const resourceDelta = this.getResourceDelta();

    return {
      timestamp: Date.now(),
      system: systemMetrics,
      performance: {
        totalMarks: performanceMetrics.marks.length,
        totalMeasures: performanceMetrics.measures.length,
        totalFunctions: performanceMetrics.functions.length,
        totalResources: performanceMetrics.resources.length,
        customMetrics: this.customMetrics.size
      },
      resources: resourceDelta,
      gc: this.gcStats,
      isCollecting: this.isCollecting
    };
  }

  destroy(): void {
    this.stopContinuousCollection();
    this.performanceObserver.disconnect();
    this.clearPerformanceEntries();
    this.clearCustomMetrics();
    this.removeAllListeners();
  }
}

export default MetricsCollector;