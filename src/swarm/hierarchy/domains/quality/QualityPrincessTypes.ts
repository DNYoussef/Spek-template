/**
 * Quality Princess Types - Interface and Type Definitions
 * NASA Rule 10 Compliant: Clear type separation and contracts
 */

export enum QualityState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  ANALYZING = 'ANALYZING',
  VALIDATING = 'VALIDATING',
  COORDINATING = 'COORDINATING',
  REPORTING = 'REPORTING',
  ERROR = 'ERROR'
}

export enum QualityEvent {
  INITIALIZE = 'INITIALIZE',
  ANALYZE_TASK = 'ANALYZE_TASK',
  BEGIN_VALIDATION = 'BEGIN_VALIDATION',
  COORDINATE_AGENTS = 'COORDINATE_AGENTS',
  GENERATE_REPORT = 'GENERATE_REPORT',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RESET = 'RESET'
}

export interface QualityConfig {
  theaterThreshold: number;
  realityThreshold: number;
  maxRetries: number;
  timeoutMs: number;
}

export interface QualityTask {
  id: string;
  description: string;
  files?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'unit' | 'integration' | 'e2e' | 'security' | 'performance';
}

export interface QualityValidation {
  taskId: string;
  testsPassed: boolean;
  coverage: number;
  lintScore: number;
  securityScore: number;
  performanceScore: number;
  edgeCasesTested: boolean;
  errorHandlingTested: boolean;
  theaterScore: number;
  realityScore: number;
  guidance: string;
  agentDistribution: [string, any][];
  kingLogicApplied: boolean;
}

export interface QualityReport {
  overallScore: number;
  realityScore: number;
  theaterScore: number;
  passedGates: string[];
  failedGates: string[];
  theaterPatternsDetected: number;
  recommendations: string[];
  realityValidated: boolean;
}

export interface QualityPattern {
  id: string;
  content: string;
  metadata: {
    testType: string;
    framework: string;
    coverage: number;
    successRate: number;
    theaterScore?: number;
    realityScore?: number;
    effectiveness: number;
    tags: string[];
  };
}

export interface QualityContext {
  currentState: QualityState;
  task?: QualityTask;
  validations: QualityValidation[];
  agents: string[];
  patterns: QualityPattern[];
  errorCount: number;
  lastError?: Error;
}

export interface QualityMetrics {
  totalTasks: number;
  passedTasks: number;
  failedTasks: number;
  avgTheaterScore: number;
  avgRealityScore: number;
  theaterDetections: number;
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-27T17:31:45-04:00 | coder@sonnet-4 | Created QualityPrincessTypes.ts with comprehensive type definitions | quality-types | OK | Types for FSM-first design | 0.00 | a7f4b2c |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: quality-princess-fsm-refactor-001
- inputs: ["QualityPrincess.ts"]
- tools_used: ["claude-code", "filesystem"]
- versions: {"model":"sonnet-4","prompt":"quality-fsm-refactor-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->