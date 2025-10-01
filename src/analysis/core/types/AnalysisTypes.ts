/**
 * Unified Analysis Types - Shared across all analyzer/validator components
 * NASA Rule 10 Compliant: Centralized type definitions for FSM architecture
 */

/**
 * Analysis state machine states
 */
export enum AnalysisState {
  IDLE = 'IDLE',
  COLLECTING = 'COLLECTING',
  ANALYZING = 'ANALYZING',
  VALIDATING = 'VALIDATING',
  SCORING = 'SCORING',
  REPORTING = 'REPORTING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  FAILED = 'FAILED',
  INITIALIZED = 'INITIALIZED',
  PLANNING = 'PLANNING',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  DEPENDENCY_MAPPING = 'DEPENDENCY_MAPPING'
}

/**
 * Analysis state machine events
 */
export enum AnalysisEvent {
  START_ANALYSIS = 'START_ANALYSIS',
  DATA_COLLECTED = 'DATA_COLLECTED',
  ANALYSIS_COMPLETE = 'ANALYSIS_COMPLETE',
  VALIDATION_COMPLETE = 'VALIDATION_COMPLETE',
  SCORING_COMPLETE = 'SCORING_COMPLETE',
  REPORT_GENERATED = 'REPORT_GENERATED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RESET = 'RESET',
  CANCEL_ANALYSIS = 'CANCEL_ANALYSIS',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  DEPENDENCY_MAPPING = 'DEPENDENCY_MAPPING',
  PLANNING = 'PLANNING',
  VALIDATION_FAILED = 'VALIDATION_FAILED'
}

/**
 * Analysis context for FSM execution
 */
export interface AnalysisContext {
  analysisId?: string;
  analysisType: string;
  sources: string[];
  rules?: AnalysisRule[];
  options?: AnalysisOptions;
  scoreThreshold?: number;
  startTime?: number;
  metadata?: Record<string, any>;
  readonly systemAnalysis?: SystemAnalysisResult | null;
  readonly riskAnalysis?: RiskAnalysisResult | null;
  readonly migrationPlan?: MigrationPlan | null;
  readonly validationResults?: ValidationResult[];
  readonly retryCount?: number;
  readonly request?: AnalysisRequest;
  readonly dependencyAnalysis?: DependencyAnalysisResult | null;
  readonly errors?: Error[];
  readonly phaseTimings?: Record<string, number>;
}

/**
 * Analysis options for customization
 */
export interface AnalysisOptions {
  strict?: boolean;
  autoFix?: boolean;
  includeWarnings?: boolean;
  patterns?: string[];
  excludePatterns?: string[];
  timeout?: number;
  maxResults?: number;
}

/**
 * Analysis rule definition
 */
export interface AnalysisRule {
  id: string;
  name: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  pattern?: string;
  condition?: (data: any) => boolean;
  message?: string;
  autoFixable?: boolean;
}

/**
 * Analysis result
 */
export interface AnalysisResult {
  analysisId: string;
  analysisType: string;
  passed: boolean;
  score: number;
  errors: string[];
  warnings: string[];
  patterns: AnalysisPattern[];
  violations: AnalysisViolation[];
  recommendations: string[];
  executionTime: number;
  timestamp: number;
  data?: any;
  metadata?: Record<string, any>;
}

/**
 * Analysis pattern detected
 */
export interface AnalysisPattern {
  type: string;
  name: string;
  file?: string;
  line?: number;
  column?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion?: string;
  positive?: boolean; // True for good patterns, false for problematic ones
  autoFixable?: boolean;
  confidence?: number; // 0-1
  metadata?: Record<string, any>;
}

/**
 * Analysis violation
 */
export interface AnalysisViolation {
  ruleId: string;
  ruleName: string;
  file?: string;
  line?: number;
  column?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actualValue?: any;
  expectedValue?: any;
  suggestion?: string;
  autoFixable?: boolean;
  impact?: string;
  effort?: string;
}

/**
 * Theater-specific types
 */
export interface TheaterPattern extends AnalysisPattern {
  theaterType: 'console_log' | 'todo_comment' | 'fake_implementation' | 'mock_function' |
               'placeholder_code' | 'hardcoded_values' | 'dead_code' | 'unused_imports' |
               'empty_functions' | 'commented_out_code' | 'debug_code' | 'test_data_in_prod';
  content: string;
}

export interface TheaterScanResult extends AnalysisResult {
  theaterScore: number; // 0-100, where 100 = no theater
  theaterPatterns: TheaterPattern[];
  summary: {
    totalFiles: number;
    theaterFiles: number;
    patternCount: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  autoFixable: TheaterPattern[];
}

/**
 * Security-specific types
 */
export interface SecurityPattern extends AnalysisPattern {
  securityType: 'sql_injection' | 'xss' | 'hardcoded_secret' | 'weak_crypto' |
                'insecure_random' | 'path_traversal' | 'command_injection' | 'xxe' |
                'csrf' | 'ssrf' | 'deserialization' | 'buffer_overflow';
  cveReferences?: string[];
  exploitability?: 'low' | 'medium' | 'high';
  remediationEffort?: 'low' | 'medium' | 'high';
}

export interface SecurityScanResult extends AnalysisResult {
  securityScore: number; // 0-100, where 100 = secure
  securityPatterns: SecurityPattern[];
  vulnerabilities: SecurityViolation[];
  complianceStatus: {
    owasp: boolean;
    sans: boolean;
    nist: boolean;
  };
}

export interface SecurityViolation extends AnalysisViolation {
  securityRule: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  attackVector?: string;
  dataAtRisk?: string[];
  mitigationSteps?: string[];
}

/**
 * Performance-specific types
 */
export interface PerformancePattern extends AnalysisPattern {
  performanceType: 'memory_leak' | 'slow_query' | 'inefficient_loop' | 'large_object' |
                   'excessive_io' | 'blocking_operation' | 'resource_contention' |
                   'cache_miss' | 'n_plus_one' | 'deadlock_risk';
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  measurementUnit?: string;
  baseline?: number;
  current?: number;
  threshold?: number;
}

export interface PerformanceAnalysisResult extends AnalysisResult {
  performanceScore: number; // 0-100, where 100 = optimal
  performancePatterns: PerformancePattern[];
  metrics: {
    executionTime: number;
    memoryUsage: number;
    cpuUsage: number;
    diskIo: number;
    networkIo: number;
  };
  benchmarks: PerformanceBenchmark[];
}

export interface PerformanceBenchmark {
  name: string;
  metric: string;
  value: number;
  unit: string;
  baseline?: number;
  target?: number;
  passed: boolean;
}

/**
 * Compliance-specific types
 */
export interface CompliancePattern extends AnalysisPattern {
  complianceType: 'nasa_rule_violation' | 'dfars_non_compliance' | 'pci_violation' |
                  'gdpr_violation' | 'sox_violation' | 'hipaa_violation' |
                  'iso27001_violation' | 'nist_violation';
  standard: string;
  requirement: string;
  controlId?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplianceAnalysisResult extends AnalysisResult {
  complianceScore: number; // 0-100, where 100 = fully compliant
  compliancePatterns: CompliancePattern[];
  standardResults: Map<string, StandardComplianceResult>;
  overallStatus: 'compliant' | 'non_compliant' | 'partial_compliance';
}

export interface StandardComplianceResult {
  standard: string;
  version: string;
  score: number;
  status: 'compliant' | 'non_compliant' | 'partial_compliance';
  requirements: RequirementResult[];
  lastAssessed: number;
}

export interface RequirementResult {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'partial' | 'not_applicable';
  evidence?: string[];
  gaps?: string[];
  recommendations?: string[];
}

/**
 * Sandbox validation types
 */
export interface SandboxPattern extends AnalysisPattern {
  sandboxType: 'compilation_error' | 'test_failure' | 'runtime_error' | 'lint_violation' |
               'type_error' | 'import_error' | 'dependency_issue' | 'build_failure' |
               'integration_failure' | 'performance_issue';
  testName?: string;
  stackTrace?: string;
  expectedOutput?: any;
  actualOutput?: any;
}

export interface SandboxValidationResult extends AnalysisResult {
  sandboxId: string;
  validationScore: number; // 0-100, where 100 = all tests pass
  compiled: boolean;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  allTestsPassed: boolean;
  compilationErrors: string[];
  runtimeErrors: string[];
  performanceMetrics: {
    executionTime: number;
    memoryUsage: number;
    cpuUsage?: number;
  };
  coverage?: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
}

/**
 * Data collection types
 */
export interface DataSource {
  type: 'file' | 'directory' | 'git' | 'api' | 'database' | 'stream';
  path: string;
  options?: DataSourceOptions;
}

export interface DataSourceOptions {
  encoding?: string;
  recursive?: boolean;
  pattern?: string;
  excludePattern?: string;
  maxSize?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface CollectedData {
  source: DataSource;
  timestamp: number;
  size: number;
  checksum?: string;
  data: any;
  errors?: string[];
  warnings?: string[];
}

/**
 * Report types
 */
export interface AnalysisReport {
  id: string;
  analysisId: string;
  format: 'json' | 'html' | 'markdown' | 'pdf' | 'csv' | 'xml';
  content: any;
  summary: ReportSummary;
  sections: ReportSection[];
  metadata: ReportMetadata;
  createdAt: number;
}

export interface ReportSummary {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  overallScore: number;
  status: 'pass' | 'fail' | 'warning';
  recommendations: string[];
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'details' | 'chart' | 'table' | 'list' | 'code';
  content: any;
  order: number;
}

export interface ReportMetadata {
  generator: string;
  version: string;
  template?: string;
  options?: Record<string, any>;
  executionTime: number;
  size: number;
}

/**
 * Statistics and metrics types
 */
export interface AnalysisStatistics {
  totalAnalyses: number;
  successRate: number;
  averageExecutionTime: number;
  averageScore: number;
  analysisTypeBreakdown: Map<string, TypeStatistics>;
  trendData: TrendDataPoint[];
  lastUpdated: number;
}

export interface TypeStatistics {
  type: string;
  count: number;
  successRate: number;
  averageScore: number;
  averageExecutionTime: number;
  commonPatterns: string[];
  commonViolations: string[];
}

export interface TrendDataPoint {
  timestamp: number;
  analysisType: string;
  score: number;
  issueCount: number;
  executionTime: number;
}

/**
 * Configuration types
 */
export interface AnalysisConfiguration {
  analysisTypes: string[];
  defaultOptions: AnalysisOptions;
  rulesets: Map<string, AnalysisRule[]>;
  thresholds: AnalysisThresholds;
  outputFormats: string[];
  integrations: IntegrationConfiguration[];
}

export interface AnalysisThresholds {
  passScore: number;
  warningScore: number;
  criticalScore: number;
  maxExecutionTime: number;
  maxResults: number;
}

export interface IntegrationConfiguration {
  name: string;
  type: 'webhook' | 'file' | 'database' | 'api';
  endpoint?: string;
  credentials?: Record<string, string>;
  options?: Record<string, any>;
}

/**
 * Error types
 */
export interface AnalysisError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  recoverable: boolean;
  suggestions?: string[];
}

export interface ValidationError extends AnalysisError {
  field?: string;
  value?: any;
  constraint?: string;
}

export interface ProcessingError extends AnalysisError {
  step: string;
  data?: any;
  stackTrace?: string;
}

/**
 * Additional context types for Phase 3B compliance
 */
export interface SystemAnalysisResult {
  readonly dependencies: DependencyInfo[];
  readonly architecture: ArchitectureInfo;
  readonly performance: PerformanceMetrics;
  readonly security: SecurityMetrics;
  readonly timestamp: number;
}

export interface DependencyInfo {
  readonly name: string;
  readonly version: string;
  readonly required: boolean;
  readonly vulnerabilities: number;
}

export interface ArchitectureInfo {
  readonly pattern: string;
  readonly layers: string[];
  readonly modules: number;
  readonly complexity: number;
}

export interface PerformanceMetrics {
  readonly executionTime: number;
  readonly memoryUsage: number;
  readonly cpuUtilization: number;
}

export interface SecurityMetrics {
  readonly vulnerabilities: number;
  readonly riskScore: number;
  readonly complianceLevel: number;
}

export interface RiskAnalysisResult {
  readonly risks: RiskItem[];
  readonly overallRisk: string;
  readonly mitigations: MitigationItem[];
  readonly timestamp: number;
}

export interface RiskItem {
  readonly id: string;
  readonly description: string;
  readonly probability: number;
  readonly impact: number;
  readonly severity: string;
}

export interface MitigationItem {
  readonly riskId: string;
  readonly strategy: string;
  readonly cost: number;
  readonly effectiveness: number;
}

export interface MigrationPlan {
  readonly phases: MigrationPhase[];
  readonly totalSteps: number;
  readonly estimatedDuration: number;
  readonly dependencies: string[];
  readonly rollbackStrategy: string;
}

export interface MigrationPhase {
  readonly id: string;
  readonly name: string;
  readonly steps: string[];
  readonly duration: number;
  readonly prerequisites: string[];
}

export interface ValidationResult {
  readonly passed: boolean;
  readonly errors: string[];
  readonly warnings: string[];
  readonly timestamp: number;
}

export interface AnalysisRequest {
  readonly requestId: string;
  readonly analysisType: string;
  readonly sources: string[];
  readonly options: AnalysisOptions;
  readonly priority: string;
  readonly timestamp: number;
  readonly sourceSystem: string;
}

export interface DependencyAnalysisResult {
  readonly dependencies: DependencyInfo[];
  readonly conflicts: string[];
  readonly recommendations: string[];
  readonly timestamp: number;
}// APPEND TO END of src/analysis/core/types/AnalysisTypes.ts
// Additional types for migration planning FSM

// State machine configuration
export interface StateMachineConfig {
  initialState: string;
  states: Map<string, StateHandler>;
  transitions: StateTransition[];
  context: unknown;
  guards?: Map<string, TransitionGuard>;
  actions?: Map<string, TransitionAction>;
}

// State handler interface (already partially defined, this extends it)
export interface StateHandler {
  name: string;
  onEnter?(context: unknown): Promise<void>;
  onExit?(context: unknown): Promise<void>;
  tick?(context: unknown): Promise<string | null>;
  canExit?(context: unknown): boolean;
  checkInvariants?(context: unknown): boolean;
}

// State transition definition
export interface StateTransition {
  from: string;
  to: string;
  event: string;
  guard?: TransitionGuard;
  action?: TransitionAction;
}

// State transition record for history
export interface StateTransitionRecord {
  from: string;
  to: string;
  event: string;
  timestamp: Date;
  context?: unknown;
  success: boolean;
  error?: string;
}

// Transition guard function
export interface TransitionGuard {
  check: (context: unknown, event: unknown) => boolean;
  errorMessage?: string;
}

// Transition action function
export interface TransitionAction {
  execute: (context: unknown, event: unknown) => Promise<void>;
  rollback?: (context: unknown) => Promise<void>;
}

// Comprehensive migration plan
export interface ComprehensiveMigrationPlan {
  planId: string;
  name: string;
  description: string;
  phases: MigrationPhase[];
  riskAssessment: RiskAnalysisResult;
  dependencyAnalysis: DependencyAnalysisResult;
  validationChecks: ValidationCheck[];
  estimatedDuration: number;
  resources: ResourceRequirement[];
  rollbackPlan: RollbackPlan;
  approvals: Approval[];
  createdAt: Date;
  updatedAt: Date;
}

// Validation check definition
export interface ValidationCheck {
  id: string;
  name: string;
  type: 'prerequisite' | 'runtime' | 'postcheck';
  check: (context: unknown) => Promise<boolean>;
  errorMessage: string;
  blocking: boolean;
  retryable: boolean;
}

// Supporting types referenced above
// MigrationPhase already defined at line 536 with readonly modifiers

export interface ResourceRequirement {
  type: string;
  amount: number;
  unit: string;
}

export interface RollbackPlan {
  steps: string[];
  estimatedTime: number;
  automatable: boolean;
}

export interface Approval {
  approver: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp?: Date;
}
