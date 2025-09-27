import { performance } from 'perf_hooks';
import * as v8 from 'v8';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
  heapSpaceUsed: HeapSpaceUsage[];
  v8HeapStats?: v8.HeapStatistics;
}

export interface HeapSpaceUsage {
  spaceName: string;
  spaceSize: number;
  spaceUsedSize: number;
  spaceAvailableSize: number;
  physicalSpaceSize: number;
}

export interface MemoryProfile {
  startTime: number;
  endTime: number;
  duration: number;
  snapshots: MemorySnapshot[];
  heapDumps: string[];
  analysis: MemoryAnalysis;
  leakDetection: LeakDetectionResult;
  gcEvents: GCEvent[];
  memoryTrend: MemoryTrend;
}

export interface MemoryAnalysis {
  totalAllocated: number;
  totalFreed: number;
  netGrowth: number;
  peakUsage: number;
  averageUsage: number;
  allocationRate: number; // bytes per second
  deallocationRate: number; // bytes per second
  fragmentationScore: number; // 0-1, higher means more fragmented
  efficiencyScore: number; // 0-1, higher means more efficient
}

export interface LeakDetectionResult {
  suspectedLeaks: MemoryLeak[];
  confidenceScore: number; // 0-1
  growthRate: number; // bytes per second
  recommendation: string;
  patterns: LeakPattern[];
}

export interface MemoryLeak {
  type: 'heap-growth' | 'external-growth' | 'buffer-leak' | 'closure-leak';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  startTime: number;
  endTime: number;
  growthRate: number;
  totalGrowth: number;
  evidence: any[];
}

export interface LeakPattern {
  pattern: string;
  occurrences: number;
  averageSize: number;
  totalSize: number;
  confidence: number;
}

export interface GCEvent {
  timestamp: number;
  type: 'scavenge' | 'mark-sweep' | 'incremental' | 'weak-callback';
  duration: number;
  heapBefore: number;
  heapAfter: number;
  freed: number;
  efficiency: number;
}

export interface MemoryTrend {
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  slope: number; // bytes per second
  correlation: number; // -1 to 1
  volatility: number; // 0-1, higher means more volatile
  cyclical: boolean;
  periods: TrendPeriod[];
}

export interface TrendPeriod {
  startTime: number;
  endTime: number;
  type: 'growth' | 'shrink' | 'stable';
  rate: number;
  significance: number;
}

export class MemoryProfiler extends EventEmitter {
  private isProfileActive = false;
  private snapshots: MemorySnapshot[] = [];
  private heapDumps: string[] = [];
  private gcEvents: GCEvent[] = [];
  private snapshotInterval: NodeJS.Timeout | null = null;
  private startTime = 0;
  private outputDir = '';
  private originalGC: any = null;
  private performanceObserver: any = null;

  constructor(outputDir: string = './memory-profiles') {
    super();
    this.outputDir = outputDir;
    this.ensureOutputDir();
    this.setupGCMonitoring();
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private setupGCMonitoring(): void {
    // Setup GC tracking if available
    if (global.gc) {
      this.originalGC = global.gc;

      // Wrap GC to track events
      global.gc = () => {
        const beforeHeap = process.memoryUsage().heapUsed;
        const startTime = performance.now();

        this.originalGC();

        const endTime = performance.now();
        const afterHeap = process.memoryUsage().heapUsed;
        const duration = endTime - startTime;
        const freed = beforeHeap - afterHeap;

        const gcEvent: GCEvent = {
          timestamp: Date.now(),
          type: 'mark-sweep', // Simplified - actual type detection would be more complex
          duration,
          heapBefore: beforeHeap,
          heapAfter: afterHeap,
          freed,
          efficiency: freed > 0 ? freed / beforeHeap : 0
        };

        this.gcEvents.push(gcEvent);
        this.emit('gc-event', gcEvent);
      };
    }

    // Setup V8 GC monitoring if available
    try {
      if (v8.getHeapStatistics) {
        // Monitor V8 GC events through heap statistics changes
        setInterval(() => {
          if (this.isProfileActive) {
            this.detectGCFromHeapStats();
          }
        }, 100);
      }
    } catch (error) {
      console.warn('V8 GC monitoring not available:', error);
    }
  }

  private detectGCFromHeapStats(): void {
    // This is a simplified GC detection based on heap changes
    // Real implementation would use V8's internal GC callbacks
    const currentHeap = process.memoryUsage().heapUsed;

    if (this.snapshots.length > 0) {
      const lastSnapshot = this.snapshots[this.snapshots.length - 1];
      const heapDiff = lastSnapshot.heapUsed - currentHeap;

      // If heap decreased significantly, assume GC occurred
      if (heapDiff > 1024 * 1024) { // 1MB threshold
        const gcEvent: GCEvent = {
          timestamp: Date.now(),
          type: 'scavenge',
          duration: 0, // Unknown
          heapBefore: lastSnapshot.heapUsed,
          heapAfter: currentHeap,
          freed: heapDiff,
          efficiency: heapDiff / lastSnapshot.heapUsed
        };

        this.gcEvents.push(gcEvent);
        this.emit('gc-event', gcEvent);
      }
    }
  }

  async startProfiling(intervalMs: number = 1000): Promise<void> {
    if (this.isProfileActive) {
      throw new Error('Memory profiling already active');
    }

    console.log('Starting memory profiling...');
    this.isProfileActive = true;
    this.startTime = Date.now();
    this.snapshots = [];
    this.heapDumps = [];
    this.gcEvents = [];

    // Take initial snapshot
    await this.takeSnapshot();

    // Setup continuous snapshots
    this.snapshotInterval = setInterval(async () => {
      if (this.isProfileActive) {
        await this.takeSnapshot();
      }
    }, intervalMs);

    this.emit('profiling-started', { startTime: this.startTime, interval: intervalMs });
  }

  async stopProfiling(): Promise<MemoryProfile> {
    if (!this.isProfileActive) {
      throw new Error('Memory profiling not active');
    }

    console.log('Stopping memory profiling...');
    this.isProfileActive = false;

    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
    }

    // Take final snapshot
    await this.takeSnapshot();

    const endTime = Date.now();
    const duration = endTime - this.startTime;

    // Analyze collected data
    const analysis = this.analyzeMemoryUsage();
    const leakDetection = this.detectMemoryLeaks();
    const memoryTrend = this.analyzeMemoryTrend();

    const profile: MemoryProfile = {
      startTime: this.startTime,
      endTime,
      duration,
      snapshots: [...this.snapshots],
      heapDumps: [...this.heapDumps],
      analysis,
      leakDetection,
      gcEvents: [...this.gcEvents],
      memoryTrend
    };

    this.emit('profiling-stopped', profile);
    return profile;
  }

  private async takeSnapshot(): Promise<MemorySnapshot> {
    const memUsage = process.memoryUsage();
    const heapSpaces = this.getHeapSpaceUsage();
    let v8Stats: v8.HeapStatistics | undefined;

    try {
      v8Stats = v8.getHeapStatistics();
    } catch (error) {
      // V8 heap statistics not available
    }

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      arrayBuffers: memUsage.arrayBuffers,
      heapSpaceUsed: heapSpaces,
      v8HeapStats: v8Stats
    };

    this.snapshots.push(snapshot);
    this.emit('snapshot-taken', snapshot);

    return snapshot;
  }

  private getHeapSpaceUsage(): HeapSpaceUsage[] {
    try {
      const heapSpaces = v8.getHeapSpaceStatistics();
      return heapSpaces.map(space => ({
        spaceName: space.space_name,
        spaceSize: space.space_size,
        spaceUsedSize: space.space_used_size,
        spaceAvailableSize: space.space_available_size,
        physicalSpaceSize: space.physical_space_size
      }));
    } catch (error) {
      return [];
    }
  }

  private analyzeMemoryUsage(): MemoryAnalysis {
    if (this.snapshots.length < 2) {
      return this.createEmptyAnalysis();
    }

    const firstSnapshot = this.snapshots[0];
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];
    const duration = lastSnapshot.timestamp - firstSnapshot.timestamp;

    // Calculate memory metrics
    const totalAllocated = this.calculateTotalAllocated();
    const totalFreed = this.calculateTotalFreed();
    const netGrowth = lastSnapshot.heapUsed - firstSnapshot.heapUsed;
    const peakUsage = Math.max(...this.snapshots.map(s => s.heapUsed));
    const averageUsage = this.snapshots.reduce((sum, s) => sum + s.heapUsed, 0) / this.snapshots.length;

    // Calculate rates (bytes per second)
    const allocationRate = totalAllocated / (duration / 1000);
    const deallocationRate = totalFreed / (duration / 1000);

    // Calculate efficiency metrics
    const fragmentationScore = this.calculateFragmentationScore();
    const efficiencyScore = this.calculateEfficiencyScore();

    return {
      totalAllocated,
      totalFreed,
      netGrowth,
      peakUsage,
      averageUsage,
      allocationRate,
      deallocationRate,
      fragmentationScore,
      efficiencyScore
    };
  }

  private calculateTotalAllocated(): number {
    let totalAllocated = 0;

    for (let i = 1; i < this.snapshots.length; i++) {
      const current = this.snapshots[i];
      const previous = this.snapshots[i - 1];
      const growth = current.heapUsed - previous.heapUsed;

      if (growth > 0) {
        totalAllocated += growth;
      }
    }

    return totalAllocated;
  }

  private calculateTotalFreed(): number {
    let totalFreed = 0;

    for (let i = 1; i < this.snapshots.length; i++) {
      const current = this.snapshots[i];
      const previous = this.snapshots[i - 1];
      const shrinkage = previous.heapUsed - current.heapUsed;

      if (shrinkage > 0) {
        totalFreed += shrinkage;
      }
    }

    return totalFreed;
  }

  private calculateFragmentationScore(): number {
    // Simplified fragmentation calculation based on heap total vs used ratio
    if (this.snapshots.length === 0) return 0;

    const fragmentationScores = this.snapshots.map(snapshot => {
      if (snapshot.heapTotal === 0) return 0;
      return 1 - (snapshot.heapUsed / snapshot.heapTotal);
    });

    return fragmentationScores.reduce((sum, score) => sum + score, 0) / fragmentationScores.length;
  }

  private calculateEfficiencyScore(): number {
    // Memory efficiency based on allocation vs actual usage patterns
    const analysis = this.analyzeMemoryUsage();
    if (analysis.totalAllocated === 0) return 1;

    const utilizationRatio = analysis.averageUsage / analysis.peakUsage;
    const growthEfficiency = analysis.totalAllocated > 0 ?
      1 - (Math.abs(analysis.netGrowth) / analysis.totalAllocated) : 1;

    return (utilizationRatio + growthEfficiency) / 2;
  }

  private detectMemoryLeaks(): LeakDetectionResult {
    const suspectedLeaks: MemoryLeak[] = [];
    const patterns: LeakPattern[] = [];

    // Detect heap growth leak
    const heapGrowthLeak = this.detectHeapGrowthLeak();
    if (heapGrowthLeak) {
      suspectedLeaks.push(heapGrowthLeak);
    }

    // Detect external memory leak
    const externalLeak = this.detectExternalLeak();
    if (externalLeak) {
      suspectedLeaks.push(externalLeak);
    }

    // Detect buffer leak
    const bufferLeak = this.detectBufferLeak();
    if (bufferLeak) {
      suspectedLeaks.push(bufferLeak);
    }

    // Calculate overall confidence and growth rate
    const growthRate = this.calculateGrowthRate();
    const confidenceScore = this.calculateLeakConfidence(suspectedLeaks);

    let recommendation = 'No memory leaks detected';
    if (suspectedLeaks.length > 0) {
      const severity = Math.max(...suspectedLeaks.map(leak =>
        leak.severity === 'critical' ? 4 :
        leak.severity === 'high' ? 3 :
        leak.severity === 'medium' ? 2 : 1
      ));

      if (severity >= 3) {
        recommendation = 'Critical memory leak detected - immediate action required';
      } else if (severity >= 2) {
        recommendation = 'Memory leak suspected - monitor and investigate';
      } else {
        recommendation = 'Minor memory issues detected - consider optimization';
      }
    }

    return {
      suspectedLeaks,
      confidenceScore,
      growthRate,
      recommendation,
      patterns
    };
  }

  private detectHeapGrowthLeak(): MemoryLeak | null {
    if (this.snapshots.length < 5) return null;

    const recentSnapshots = this.snapshots.slice(-5);
    const growthRates = [];

    for (let i = 1; i < recentSnapshots.length; i++) {
      const current = recentSnapshots[i];
      const previous = recentSnapshots[i - 1];
      const timeDiff = current.timestamp - previous.timestamp;
      const heapDiff = current.heapUsed - previous.heapUsed;

      if (timeDiff > 0) {
        growthRates.push(heapDiff / (timeDiff / 1000)); // bytes per second
      }
    }

    const averageGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;

    // Consider it a leak if consistently growing > 1KB/s
    if (averageGrowthRate > 1024 && growthRates.every(rate => rate > 0)) {
      const firstSnapshot = this.snapshots[0];
      const lastSnapshot = this.snapshots[this.snapshots.length - 1];

      return {
        type: 'heap-growth',
        severity: averageGrowthRate > 10 * 1024 * 1024 ? 'critical' :
                 averageGrowthRate > 1024 * 1024 ? 'high' : 'medium',
        description: `Consistent heap growth detected: ${(averageGrowthRate / 1024).toFixed(2)} KB/s`,
        startTime: firstSnapshot.timestamp,
        endTime: lastSnapshot.timestamp,
        growthRate: averageGrowthRate,
        totalGrowth: lastSnapshot.heapUsed - firstSnapshot.heapUsed,
        evidence: recentSnapshots
      };
    }

    return null;
  }

  private detectExternalLeak(): MemoryLeak | null {
    if (this.snapshots.length < 3) return null;

    const firstSnapshot = this.snapshots[0];
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];
    const externalGrowth = lastSnapshot.external - firstSnapshot.external;
    const duration = lastSnapshot.timestamp - firstSnapshot.timestamp;
    const growthRate = externalGrowth / (duration / 1000);

    // External memory growing > 500KB/s is suspicious
    if (growthRate > 500 * 1024) {
      return {
        type: 'external-growth',
        severity: growthRate > 5 * 1024 * 1024 ? 'high' : 'medium',
        description: `External memory growth: ${(growthRate / 1024).toFixed(2)} KB/s`,
        startTime: firstSnapshot.timestamp,
        endTime: lastSnapshot.timestamp,
        growthRate,
        totalGrowth: externalGrowth,
        evidence: this.snapshots.filter((_, i) => i % 5 === 0) // Sample snapshots
      };
    }

    return null;
  }

  private detectBufferLeak(): MemoryLeak | null {
    if (this.snapshots.length < 3) return null;

    const firstSnapshot = this.snapshots[0];
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];
    const bufferGrowth = lastSnapshot.arrayBuffers - firstSnapshot.arrayBuffers;
    const duration = lastSnapshot.timestamp - firstSnapshot.timestamp;
    const growthRate = bufferGrowth / (duration / 1000);

    // ArrayBuffer growing > 1MB/s is suspicious
    if (growthRate > 1024 * 1024) {
      return {
        type: 'buffer-leak',
        severity: growthRate > 10 * 1024 * 1024 ? 'high' : 'medium',
        description: `ArrayBuffer growth: ${(growthRate / 1024 / 1024).toFixed(2)} MB/s`,
        startTime: firstSnapshot.timestamp,
        endTime: lastSnapshot.timestamp,
        growthRate,
        totalGrowth: bufferGrowth,
        evidence: this.snapshots.filter((_, i) => i % 3 === 0)
      };
    }

    return null;
  }

  private calculateGrowthRate(): number {
    if (this.snapshots.length < 2) return 0;

    const firstSnapshot = this.snapshots[0];
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];
    const duration = lastSnapshot.timestamp - firstSnapshot.timestamp;
    const growth = lastSnapshot.heapUsed - firstSnapshot.heapUsed;

    return growth / (duration / 1000); // bytes per second
  }

  private calculateLeakConfidence(leaks: MemoryLeak[]): number {
    if (leaks.length === 0) return 0;

    let totalConfidence = 0;
    let weightSum = 0;

    leaks.forEach(leak => {
      const weight = leak.severity === 'critical' ? 4 :
                    leak.severity === 'high' ? 3 :
                    leak.severity === 'medium' ? 2 : 1;

      // Base confidence on consistency and magnitude
      let confidence = 0.5; // Base confidence

      if (leak.growthRate > 1024 * 1024) confidence += 0.3; // > 1MB/s
      if (leak.totalGrowth > 10 * 1024 * 1024) confidence += 0.2; // > 10MB total

      confidence = Math.min(1, confidence);

      totalConfidence += confidence * weight;
      weightSum += weight;
    });

    return weightSum > 0 ? totalConfidence / weightSum : 0;
  }

  private analyzeMemoryTrend(): MemoryTrend {
    if (this.snapshots.length < 3) {
      return {
        direction: 'stable',
        slope: 0,
        correlation: 0,
        volatility: 0,
        cyclical: false,
        periods: []
      };
    }

    const heapValues = this.snapshots.map(s => s.heapUsed);
    const timeValues = this.snapshots.map(s => s.timestamp);

    // Calculate linear regression for trend
    const { slope, correlation } = this.calculateLinearRegression(timeValues, heapValues);

    // Determine direction
    let direction: 'increasing' | 'decreasing' | 'stable' | 'volatile' = 'stable';
    if (Math.abs(slope) > 1000) { // > 1KB/s change
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    // Calculate volatility
    const volatility = this.calculateVolatility(heapValues);
    if (volatility > 0.1) {
      direction = 'volatile';
    }

    // Detect periods and cycles
    const periods = this.detectTrendPeriods();
    const cyclical = this.detectCyclicalPattern();

    return {
      direction,
      slope: slope / 1000, // Convert to bytes per second
      correlation,
      volatility,
      cyclical,
      periods
    };
  }

  private calculateLinearRegression(x: number[], y: number[]): { slope: number; correlation: number } {
    const n = x.length;
    if (n < 2) return { slope: 0, correlation: 0 };

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const correlation = (n * sumXY - sumX * sumY) /
                       Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return { slope: isNaN(slope) ? 0 : slope, correlation: isNaN(correlation) ? 0 : correlation };
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return mean > 0 ? stdDev / mean : 0; // Coefficient of variation
  }

  private detectTrendPeriods(): TrendPeriod[] {
    const periods: TrendPeriod[] = [];
    if (this.snapshots.length < 5) return periods;

    // Simple period detection based on growth/shrink phases
    let currentPeriodStart = 0;
    let currentType: 'growth' | 'shrink' | 'stable' = 'stable';

    for (let i = 1; i < this.snapshots.length; i++) {
      const current = this.snapshots[i];
      const previous = this.snapshots[i - 1];
      const diff = current.heapUsed - previous.heapUsed;

      let newType: 'growth' | 'shrink' | 'stable' = 'stable';
      if (diff > 1024 * 10) newType = 'growth'; // > 10KB
      else if (diff < -1024 * 10) newType = 'shrink'; // < -10KB

      if (newType !== currentType && i - currentPeriodStart > 2) {
        // End current period
        periods.push({
          startTime: this.snapshots[currentPeriodStart].timestamp,
          endTime: this.snapshots[i - 1].timestamp,
          type: currentType,
          rate: this.calculatePeriodRate(currentPeriodStart, i - 1),
          significance: this.calculatePeriodSignificance(currentPeriodStart, i - 1)
        });

        currentPeriodStart = i - 1;
        currentType = newType;
      }
    }

    // Add final period
    if (this.snapshots.length - currentPeriodStart > 2) {
      periods.push({
        startTime: this.snapshots[currentPeriodStart].timestamp,
        endTime: this.snapshots[this.snapshots.length - 1].timestamp,
        type: currentType,
        rate: this.calculatePeriodRate(currentPeriodStart, this.snapshots.length - 1),
        significance: this.calculatePeriodSignificance(currentPeriodStart, this.snapshots.length - 1)
      });
    }

    return periods;
  }

  private calculatePeriodRate(startIndex: number, endIndex: number): number {
    if (startIndex >= endIndex) return 0;

    const startSnapshot = this.snapshots[startIndex];
    const endSnapshot = this.snapshots[endIndex];
    const timeDiff = endSnapshot.timestamp - startSnapshot.timestamp;
    const memDiff = endSnapshot.heapUsed - startSnapshot.heapUsed;

    return timeDiff > 0 ? memDiff / (timeDiff / 1000) : 0; // bytes per second
  }

  private calculatePeriodSignificance(startIndex: number, endIndex: number): number {
    if (startIndex >= endIndex) return 0;

    const startSnapshot = this.snapshots[startIndex];
    const endSnapshot = this.snapshots[endIndex];
    const memDiff = Math.abs(endSnapshot.heapUsed - startSnapshot.heapUsed);
    const avgMemory = (startSnapshot.heapUsed + endSnapshot.heapUsed) / 2;

    return avgMemory > 0 ? memDiff / avgMemory : 0; // Relative change
  }

  private detectCyclicalPattern(): boolean {
    if (this.snapshots.length < 10) return false;

    // Simple cycle detection - look for repeating patterns in memory usage
    const heapValues = this.snapshots.map(s => s.heapUsed);

    // Check for patterns of length 3-10
    for (let patternLength = 3; patternLength <= Math.min(10, Math.floor(heapValues.length / 3)); patternLength++) {
      let matches = 0;

      for (let i = 0; i <= heapValues.length - patternLength * 2; i++) {
        const pattern1 = heapValues.slice(i, i + patternLength);
        const pattern2 = heapValues.slice(i + patternLength, i + patternLength * 2);

        if (this.patternsMatch(pattern1, pattern2, 0.1)) { // 10% tolerance
          matches++;
        }
      }

      // If we find multiple matching patterns, consider it cyclical
      if (matches > 2) {
        return true;
      }
    }

    return false;
  }

  private patternsMatch(pattern1: number[], pattern2: number[], tolerance: number): boolean {
    if (pattern1.length !== pattern2.length) return false;

    for (let i = 0; i < pattern1.length; i++) {
      const diff = Math.abs(pattern1[i] - pattern2[i]);
      const avg = (pattern1[i] + pattern2[i]) / 2;

      if (avg > 0 && diff / avg > tolerance) {
        return false;
      }
    }

    return true;
  }

  async takeHeapSnapshot(filename?: string): Promise<string> {
    if (!v8.writeHeapSnapshot) {
      throw new Error('Heap snapshots not supported in this Node.js version');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotFile = filename || `heap-snapshot-${timestamp}.heapsnapshot`;
    const fullPath = path.join(this.outputDir, snapshotFile);

    try {
      v8.writeHeapSnapshot(fullPath);
      this.heapDumps.push(fullPath);

      console.log(`Heap snapshot saved: ${fullPath}`);
      this.emit('heap-snapshot', { path: fullPath, timestamp: Date.now() });

      return fullPath;
    } catch (error) {
      console.error('Failed to take heap snapshot:', error);
      throw error;
    }
  }

  private createEmptyAnalysis(): MemoryAnalysis {
    return {
      totalAllocated: 0,
      totalFreed: 0,
      netGrowth: 0,
      peakUsage: 0,
      averageUsage: 0,
      allocationRate: 0,
      deallocationRate: 0,
      fragmentationScore: 0,
      efficiencyScore: 1
    };
  }

  getCurrentSnapshot(): MemorySnapshot | null {
    return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
  }

  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  getGCEvents(): GCEvent[] {
    return [...this.gcEvents];
  }

  isActive(): boolean {
    return this.isProfileActive;
  }

  clearSnapshots(): void {
    this.snapshots = [];
    this.gcEvents = [];
  }

  destroy(): void {
    if (this.isProfileActive) {
      this.stopProfiling();
    }

    // Restore original GC if we wrapped it
    if (this.originalGC && global.gc) {
      global.gc = this.originalGC;
    }

    this.removeAllListeners();
  }
}

export default MemoryProfiler;