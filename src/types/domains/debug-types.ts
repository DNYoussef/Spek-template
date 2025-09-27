/**
 * Debug System Type Definitions
 * Comprehensive types for Queen Debug Orchestrator and debugging workflows
 */

import { DebugSessionId, StackTrace, ErrorCode, Timestamp, Duration, FilePath } from '../base/primitives';
import { Result, ResultMetadata } from '../base/common';

// Debug context types - replaces 'any' context
export interface DebugContext {
  readonly sessionId: DebugSessionId;
  readonly environment: DebugEnvironment;
  readonly state: DebugState;
  readonly metadata: DebugMetadata;
  readonly artifacts: DebugArtifact[];
}

export interface DebugEnvironment {
  readonly nodeVersion: string;
  readonly platform: string;
  readonly workingDirectory: FilePath;
  readonly environmentVariables: Record<string, string>;
  readonly installedPackages: PackageInfo[];
}

export interface DebugState {
  readonly variables: Record<string, DebugVariable>;
  readonly callStack: CallStackFrame[];
  readonly memoryUsage: MemorySnapshot;
  readonly activeConnections: ConnectionInfo[];
}

export interface DebugVariable {
  readonly name: string;
  readonly type: string;
  readonly value: DebugValue;
  readonly scope: 'global' | 'local' | 'closure' | 'module';
  readonly mutable: boolean;
}

export type DebugValue =
  | { type: 'primitive'; value: string | number | boolean | null | undefined }
  | { type: 'object'; properties: Record<string, DebugValue>; prototype?: string }
  | { type: 'array'; elements: DebugValue[]; length: number }
  | { type: 'function'; name: string; arity: number; source?: string }
  | { type: 'symbol'; description: string }
  | { type: 'reference'; id: string; target: string };

export interface CallStackFrame {
  readonly functionName: string;
  readonly fileName: FilePath;
  readonly lineNumber: number;
  readonly columnNumber: number;
  readonly locals: Record<string, DebugValue>;
  readonly this?: DebugValue;
}

// Debug evidence types - replaces 'any' evidence
export interface DebugEvidence {
  readonly beforeState: SystemState;
  readonly afterState: SystemState;
  readonly testResults: TestResult[];
  readonly validationProof: ValidationProof;
  readonly githubArtifacts: GitHubArtifact[];
  readonly performanceMetrics: PerformanceSnapshot;
}

export interface SystemState {
  readonly timestamp: Timestamp;
  readonly processInfo: ProcessInfo;
  readonly fileSystemState: FileSystemSnapshot;
  readonly networkState: NetworkSnapshot;
  readonly configurationState: ConfigurationSnapshot;
  readonly errorLogs: ErrorLog[];
}

export interface ProcessInfo {
  readonly pid: number;
  readonly memory: MemorySnapshot;
  readonly cpu: CpuSnapshot;
  readonly handles: number;
  readonly threads: number;
}

export interface MemorySnapshot {
  readonly used: number;
  readonly total: number;
  readonly free: number;
  readonly heapUsed: number;
  readonly heapTotal: number;
  readonly external: number;
}

export interface TestResult {
  readonly testName: string;
  readonly status: 'passed' | 'failed' | 'skipped' | 'timeout';
  readonly duration: Duration;
  readonly output: TestOutput;
  readonly assertions: TestAssertion[];
}

export interface TestOutput {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
  readonly coverage?: CoverageInfo;
}

export interface TestAssertion {
  readonly description: string;
  readonly status: 'passed' | 'failed';
  readonly expected?: DebugValue;
  readonly actual?: DebugValue;
  readonly diff?: string;
}

export interface ValidationProof {
  readonly validator: string;
  readonly timestamp: Timestamp;
  readonly checksum: string;
  readonly rules: ValidationRule[];
  readonly results: ValidationRuleResult[];
}

export interface ValidationRule {
  readonly id: string;
  readonly name: string;
  readonly type: 'syntax' | 'semantic' | 'runtime' | 'integration';
  readonly severity: 'error' | 'warning' | 'info';
  readonly condition: RuleCondition;
}

export interface RuleCondition {
  readonly expression: string;
  readonly context: Record<string, DebugValue>;
  readonly timeout?: Duration;
}

export interface ValidationRuleResult {
  readonly ruleId: string;
  readonly status: 'pass' | 'fail' | 'skip' | 'error';
  readonly message: string;
  readonly evidence?: DebugValue;
  readonly timestamp: Timestamp;
}

export interface GitHubArtifact {
  readonly type: 'commit' | 'diff' | 'pr' | 'issue' | 'workflow';
  readonly id: string;
  readonly url: string;
  readonly content: ArtifactContent;
  readonly metadata: ArtifactMetadata;
}

export interface ArtifactContent {
  readonly raw: string;
  readonly parsed?: ParsedContent;
  readonly binary?: boolean;
  readonly encoding?: string;
}

export interface ParsedContent {
  readonly format: 'json' | 'yaml' | 'markdown' | 'typescript' | 'javascript';
  readonly structure: DebugValue;
  readonly errors: string[];
}

export interface ArtifactMetadata {
  readonly created: Timestamp;
  readonly author: string;
  readonly size: number;
  readonly hash: string;
  readonly tags: string[];
}

// Debug strategy types - replaces 'any' strategy returns
export interface DebugStrategy {
  readonly name: string;
  readonly type: 'manual' | 'automated' | 'hybrid';
  readonly steps: DebugStep[];
  readonly conditions: StrategyCondition[];
  readonly expected_outcome: DebugOutcome;
}

export interface DebugStep {
  readonly id: string;
  readonly description: string;
  readonly action: DebugAction;
  readonly validation: StepValidation;
  readonly retry_policy: RetryPolicy;
}

export interface DebugAction {
  readonly type: 'inspect' | 'modify' | 'test' | 'rollback' | 'escalate';
  readonly target: ActionTarget;
  readonly parameters: Record<string, DebugValue>;
  readonly timeout: Duration;
}

export interface ActionTarget {
  readonly scope: 'file' | 'function' | 'variable' | 'process' | 'system';
  readonly identifier: string;
  readonly location?: FileLocation;
}

export interface FileLocation {
  readonly file: FilePath;
  readonly line?: number;
  readonly column?: number;
  readonly range?: { start: number; end: number };
}

// Additional utility types
export interface DebugMetadata {
  readonly sessionId: DebugSessionId;
  readonly startTime: Timestamp;
  readonly endTime?: Timestamp;
  readonly totalDuration?: Duration;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
  readonly tags: string[];
  readonly assignee?: string;
}

export interface PackageInfo {
  readonly name: string;
  readonly version: string;
  readonly type: 'dependency' | 'devDependency' | 'peerDependency';
  readonly location: FilePath;
}

export interface ConnectionInfo {
  readonly type: 'http' | 'websocket' | 'database' | 'file' | 'process';
  readonly target: string;
  readonly status: 'connected' | 'disconnected' | 'error';
  readonly lastActivity: Timestamp;
}

export interface PerformanceSnapshot {
  readonly timestamp: Timestamp;
  readonly metrics: PerformanceMetric[];
  readonly benchmarks: BenchmarkResult[];
  readonly profiling?: ProfilingData;
}

export interface PerformanceMetric {
  readonly name: string;
  readonly value: number;
  readonly unit: string;
  readonly baseline?: number;
  readonly threshold?: number;
}

export interface BenchmarkResult {
  readonly name: string;
  readonly iterations: number;
  readonly average: Duration;
  readonly median: Duration;
  readonly min: Duration;
  readonly max: Duration;
}

export interface ProfilingData {
  readonly method: 'sampling' | 'instrumentation';
  readonly duration: Duration;
  readonly samples: ProfileSample[];
  readonly hotspots: Hotspot[];
}

export interface ProfileSample {
  readonly timestamp: Timestamp;
  readonly stackTrace: StackTrace;
  readonly cpu: number;
  readonly memory: number;
}

export interface Hotspot {
  readonly function: string;
  readonly file: FilePath;
  readonly line: number;
  readonly percentage: number;
  readonly calls: number;
}

// Type guards and utility functions
export const isDebugValue = (value: unknown): value is DebugValue => {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.type === 'string' &&
         ['primitive', 'object', 'array', 'function', 'symbol', 'reference'].includes(obj.type);
};

export const createDebugContext = (sessionId: DebugSessionId): DebugContext => ({
  sessionId,
  environment: {
    nodeVersion: process.version,
    platform: process.platform,
    workingDirectory: process.cwd() as FilePath,
    environmentVariables: process.env as Record<string, string>,
    installedPackages: []
  },
  state: {
    variables: {},
    callStack: [],
    memoryUsage: {
      used: 0,
      total: 0,
      free: 0,
      heapUsed: 0,
      heapTotal: 0,
      external: 0
    },
    activeConnections: []
  },
  metadata: {
    sessionId,
    startTime: Date.now() as Timestamp,
    priority: 'medium',
    tags: []
  },
  artifacts: []
});

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-26T23:09:25-04:00 | coder@claude-sonnet-4 | Create comprehensive debug types replacing 'any' in QueenDebugOrchestrator | debug-types.ts | OK | -- | 0.00 | 2c5a7f3 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: phase4-week10-type-elimination-003
- inputs: ["primitives.ts", "common.ts", "QueenDebugOrchestrator.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"phase4-week10-implementation"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->