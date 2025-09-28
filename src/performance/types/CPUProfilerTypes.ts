/**
 * CPU Profiler Types - Core type definitions for FSM architecture
 */

export enum CPUProfilerStates {
  IDLE = 'idle',
  PROFILING = 'profiling',
  ANALYZING = 'analyzing',
  REPORTING = 'reporting',
  ERROR = 'error'
}

export enum CPUProfilerEvents {
  START_PROFILING = 'start_profiling',
  STOP_PROFILING = 'stop_profiling',
  ANALYSIS_COMPLETE = 'analysis_complete',
  REPORT_COMPLETE = 'report_complete',
  ERROR = 'error',
  RESET = 'reset'
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
  utilizationRate: number;
  efficiency: number;
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
  efficiencyScore: number;
  threadsAnalysis: ThreadAnalysis;
  resourceContention: ResourceContention[];
}

export interface PerformanceBottleneck {
  type: 'cpu-bound' | 'io-wait' | 'lock-contention' | 'gc-pressure' | 'memory-bound';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: number;
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
  contentionLevel: number;
  waitTime: number;
  affectedFunctions: string[];
  recommendation: string;
}

export interface CPUProfilerContext {
  outputDir: string;
  isProfileActive: boolean;
  samples: CPUSample[];
  startTime: number;
  sampleInterval: NodeJS.Timeout | null;
  baselineCPU: NodeJS.CpuUsage | null;
  v8ProfilePath: string | null;
  profile: CPUProfile | null;
  lastError?: Error;
}