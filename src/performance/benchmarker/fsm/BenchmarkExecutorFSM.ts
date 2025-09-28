/**
 * Benchmark Executor Finite State Machine
 * FSM-based architecture for performance benchmark execution
 */

export enum BenchmarkState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  EXECUTING = 'executing',
  MONITORING = 'monitoring',
  ANALYZING = 'analyzing',
  REPORTING = 'reporting',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum BenchmarkEvent {
  START = 'start',
  INITIALIZE = 'initialize',
  EXECUTE = 'execute',
  MONITOR = 'monitor',
  ANALYZE = 'analyze',
  REPORT = 'report',
  COMPLETE = 'complete',
  FAIL = 'fail',
  RESET = 'reset'
}

export interface BenchmarkContext {
  config: ExecutionConfig;
  results: BenchmarkResults[];
  metrics: PerformanceMetrics;
  errors: Error[];
  currentSuite: string;
  startTime: Date;
}

export interface ExecutionConfig {
  domains: CICDDomain[];
  testSuites: TestSuite[];
  constraints: PerformanceConstraints;
  monitoring: MonitoringConfig;
  reporting: ReportingConfig;
}

export interface BenchmarkResults {
  suiteId: string;
  startTime: Date;
  endTime: Date;
  passed: boolean;
  metrics: PerformanceMetrics;
  violations: ConstraintViolation[];
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T14:48:00-04:00 | agent@God-Object-Terminator | Created FSM architecture for BenchmarkExecutor | BenchmarkExecutorFSM.ts | OK | FSM states and events defined | 0.00 | b4e7a2f |
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->