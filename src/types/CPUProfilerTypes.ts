/**
 * CPUProfilerTypes.ts - CPU Profiler Type Definitions
 * @stub true
 * @architecture CPU profiling and performance monitoring type system
 */

// CPU profiler states
export enum CPUProfilerStates {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  PROFILING = 'PROFILING',
  ANALYZING = 'ANALYZING',
  REPORTING = 'REPORTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// CPU profiler events
export enum CPUProfilerEvents {
  START_PROFILING = 'START_PROFILING',
  SAMPLE_COLLECTED = 'SAMPLE_COLLECTED',
  ANALYSIS_STARTED = 'ANALYSIS_STARTED',
  ANALYSIS_COMPLETED = 'ANALYSIS_COMPLETED',
  REPORT_GENERATED = 'REPORT_GENERATED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RESET = 'RESET'
}

// CPU sample
export interface CPUSample {
  readonly timestamp: number;
  readonly cpuUsage: number; // 0-100 percentage
  readonly memoryUsage: number; // bytes
  readonly activeThreads: number;
  readonly functionName?: string;
  readonly stackTrace?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

// CPU profiler context
export interface CPUProfilerContext {
  readonly sessionId: string;
  readonly currentState: CPUProfilerStates;
  readonly samples: readonly CPUSample[];
  readonly startTime: number;
  readonly endTime?: number;
  readonly config: ProfilerConfig;
  readonly errors: readonly string[];
  readonly isProfileActive?: boolean;
  readonly sampleInterval?: number;
  readonly baselineCPU?: number;
  readonly v8ProfilePath?: string;
  readonly profile?: unknown;
  readonly outputDir?: string;
  readonly lastError?: Error | string;
}

// Profiler configuration
export interface ProfilerConfig {
  readonly sampleRate: number; // Hz
  readonly duration: number; // milliseconds
  readonly captureStackTraces: boolean;
  readonly aggregationInterval: number; // milliseconds
  readonly thresholds: ProfilerThresholds;
}

// Profiler thresholds
export interface ProfilerThresholds {
  readonly cpuWarning: number; // percentage
  readonly cpuCritical: number; // percentage
  readonly memoryWarning: number; // bytes
  readonly memoryCritical: number; // bytes
}

// Profiler report
export interface ProfilerReport {
  readonly sessionId: string;
  readonly duration: number;
  readonly totalSamples: number;
  readonly averageCPU: number;
  readonly peakCPU: number;
  readonly averageMemory: number;
  readonly peakMemory: number;
  readonly hotspots: readonly Hotspot[];
  readonly recommendations: readonly string[];
}

// Performance hotspot
export interface Hotspot {
  readonly functionName: string;
  readonly cpuTime: number; // milliseconds
  readonly callCount: number;
  readonly averageTime: number;
  readonly percentOfTotal: number;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0
// === END FOOTER ===
