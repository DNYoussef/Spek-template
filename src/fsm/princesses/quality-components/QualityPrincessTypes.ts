/**
 * Quality Princess Types - Core Type Definitions
 * Part of QualityPrincessFSM decomposition
 * NASA Rule 10 compliant - focused type definitions
 */

import { FSMContext, TransitionRecord } from '../../types/FSMTypes';

export interface QualityContext extends FSMContext {
  testPlan?: {
    created: boolean;
    approved: boolean;
    coverage: number;
    testCases: number;
    automationLevel: number;
    testFiles?: number;
    sourceFiles?: number;
    recommendations?: string[];
    lastUpdated?: string;
    error?: string;
  };
  unitTests?: {
    executed: boolean;
    passed: number;
    failed: number;
    skipped?: number;
    coverage: number;
    duration: number;
    totalFiles?: number;
    testResults?: any[];
    lastRun?: string;
    fallbackUsed?: boolean;
    error?: string;
  };
  integrationTests?: {
    executed: boolean;
    passed: number;
    failed: number;
    skipped?: number;
    coverage: number;
    duration: number;
    testFiles?: number;
    testDetails?: Array<{file: string; status: string; duration: number}>;
    lastRun?: string;
    message?: string;
    error?: string;
  };
  e2eTests?: {
    executed: boolean;
    passed: number;
    failed: number;
    scenarios: number;
    duration: number;
    skipped?: number;
    testDetails?: any[];
    lastRun?: string;
    error?: string;
  };
  performanceTests?: {
    executed: boolean;
    responseTime: number;
    throughput: number;
    resourceUsage: number;
    acceptable: boolean;
    benchmarkResults?: any;
    lastRun?: string;
    error?: string;
  };
  securityTests?: {
    executed: boolean;
    vulnerabilities: number;
    criticalIssues: number;
    passed: boolean;
    scanResults?: any[];
    toolsUsed?: string[];
    lastScan?: string;
    highIssues?: number;
    error?: string;
  };
  codeQuality?: {
    analyzed: boolean;
    maintainabilityIndex: number;
    technicalDebt: number;
    complexityScore: number;
    duplication: number;
  };
  compliance?: {
    checked: boolean;
    standards: string[];
    score: number;
    violations: number;
  };
  testing?: {
    coverage: number;
  };
  security?: {
    overallScore: number;
  };
  performance?: {
    score: number;
  };
}

export interface TestMetrics {
  coverage: number;
  totalTests: number;
  automationLevel: number;
  recommendations: string[];
}

export interface TestResult {
  status: 'passed' | 'failed' | 'skipped';
  coverage?: {
    lines: {
      total: number;
      covered: number;
    };
  };
}

export interface IntegrationTestResult {
  passed: number;
  failed: number;
  skipped?: number;
  coverage: number;
  details?: Array<{file: string; status: string; duration: number}>;
}

export interface E2ETestResult {
  passed: number;
  failed: number;
  skipped?: number;
  totalScenarios: number;
  duration: number;
  tool?: string;
  details?: any[];
}

export interface PerformanceBenchmarkResult {
  responseTime: number;
  throughput: number;
  resourceUsage: number;
  benchmarks?: number;
}

export interface SecurityScanResult {
  totalVulnerabilities: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  results: SecurityVulnerability[];
  tools: string[];
}

export interface SecurityVulnerability {
  tool: string;
  severity: string;
  rule?: string;
  package?: string;
  title?: string;
  file?: string;
  line?: number;
}

export interface QualityReportData {
  testCoverage: number;
  securityScore: number;
  performanceScore: number;
  codeQualityScore: number;
  complianceScore: number;
  overallScore?: number;
  recommendations?: string[];
  generated?: boolean;
}

export interface SandboxConfig {
  isolationLevel: 'full' | 'partial' | 'none';
  resourceLimits: {
    memory: number;
    cpu: number;
    timeout: number;
  };
}

export interface TestSuiteOptions {
  framework: 'jest' | 'mocha' | 'jasmine';
  timeout: number;
}

export interface TestFilePattern {
  pattern: string;
  description: string;
}

export interface AnalysisConfig {
  projectPath?: string;
  includePaths?: string[];
  excludePaths?: string[];
  timeout?: number;
}

export interface QualityMachineConfig {
  id: string;
  initial: string;
  context: QualityContext;
  states: Record<string, any>;
  actions: Record<string, Function>;
  guards: Record<string, Function>;
  services: Record<string, Function>;
}

export interface QualityPrincessOptions {
  projectPath?: string;
  enableRealTesting?: boolean;
  testTimeout?: number;
  securityScanners?: string[];
  performanceBenchmarks?: boolean;
}

export interface QualityWorkflowState {
  currentPhase: string;
  progress: number;
  startTime: number;
  errors: string[];
  warnings: string[];
}

export interface QualityGateConfig {
  testCoverageThreshold: number;
  securityScoreThreshold: number;
  performanceThreshold: number;
  codeQualityThreshold: number;
  complianceThreshold: number;
}

export interface QualityValidationResult {
  passed: boolean;
  score: number;
  details: Record<string, any>;
  recommendations: string[];
}

// Event and State enums (imported from FSMTypes)
export enum QualityState {
  TEST_PLANNING = 'TEST_PLANNING',
  UNIT_TESTING = 'UNIT_TESTING',
  INTEGRATION_TESTING = 'INTEGRATION_TESTING',
  E2E_TESTING = 'E2E_TESTING',
  PERFORMANCE_TESTING = 'PERFORMANCE_TESTING',
  SECURITY_TESTING = 'SECURITY_TESTING',
  CODE_QUALITY_ANALYSIS = 'CODE_QUALITY_ANALYSIS',
  COMPLIANCE_CHECK = 'COMPLIANCE_CHECK',
  QUALITY_REPORTING = 'QUALITY_REPORTING'
}

export enum QualityEvent {
  TEST_PLAN_APPROVED = 'TEST_PLAN_APPROVED',
  TEST_PLAN_REJECTED = 'TEST_PLAN_REJECTED',
  UNIT_TESTS_PASSED = 'UNIT_TESTS_PASSED',
  UNIT_TESTS_FAILED = 'UNIT_TESTS_FAILED',
  INTEGRATION_TESTS_PASSED = 'INTEGRATION_TESTS_PASSED',
  INTEGRATION_TESTS_FAILED = 'INTEGRATION_TESTS_FAILED',
  E2E_TESTS_PASSED = 'E2E_TESTS_PASSED',
  E2E_TESTS_FAILED = 'E2E_TESTS_FAILED',
  PERFORMANCE_TESTS_PASSED = 'PERFORMANCE_TESTS_PASSED',
  PERFORMANCE_TESTS_FAILED = 'PERFORMANCE_TESTS_FAILED',
  SECURITY_TESTS_PASSED = 'SECURITY_TESTS_PASSED',
  SECURITY_TESTS_FAILED = 'SECURITY_TESTS_FAILED',
  CODE_QUALITY_ACCEPTABLE = 'CODE_QUALITY_ACCEPTABLE',
  CODE_QUALITY_POOR = 'CODE_QUALITY_POOR',
  COMPLIANCE_PASSED = 'COMPLIANCE_PASSED',
  COMPLIANCE_FAILED = 'COMPLIANCE_FAILED',
  REPORT_GENERATED = 'REPORT_GENERATED'
}

export enum PrincessState {
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED'
}

export enum PrincessEvent {
  TASK_FAILED = 'TASK_FAILED',
  ROLLBACK = 'ROLLBACK'
}

// Type guards and validation functions
export function isQualityContext(obj: any): obj is QualityContext {
  return obj && typeof obj === 'object' && 'currentState' in obj;
}

export function isValidTestMetrics(metrics: any): metrics is TestMetrics {
  return metrics &&
    typeof metrics.coverage === 'number' &&
    typeof metrics.totalTests === 'number' &&
    typeof metrics.automationLevel === 'number' &&
    Array.isArray(metrics.recommendations);
}

export function isValidSecurityResult(result: any): result is SecurityScanResult {
  return result &&
    typeof result.totalVulnerabilities === 'number' &&
    typeof result.criticalIssues === 'number' &&
    Array.isArray(result.results) &&
    Array.isArray(result.tools);
}

// Utility types
export type QualityEventType = QualityEvent | PrincessEvent;
export type QualityStateType = QualityState | PrincessState;
export type TestExecutionResult = TestResult | IntegrationTestResult | E2ETestResult;
export type QualityPhase = 'planning' | 'testing' | 'analysis' | 'reporting' | 'complete';

// Configuration constants
export const DEFAULT_QUALITY_GATES: QualityGateConfig = {
  testCoverageThreshold: 80,
  securityScoreThreshold: 95,
  performanceThreshold: 500, // ms
  codeQualityThreshold: 70,
  complianceThreshold: 85
};

export const TEST_FILE_PATTERNS: TestFilePattern[] = [
  { pattern: '**/*.test.{js,ts,jsx,tsx}', description: 'Jest/Mocha test files' },
  { pattern: '**/*.spec.{js,ts,jsx,tsx}', description: 'Spec test files' },
  { pattern: '**/test/**/*.{js,ts,jsx,tsx}', description: 'Test directory files' },
  { pattern: '**/tests/**/*.{js,ts,jsx,tsx}', description: 'Tests directory files' },
  { pattern: '**/__tests__/**/*.{js,ts,jsx,tsx}', description: 'Jest tests directory' }
];

export const INTEGRATION_TEST_PATTERNS: TestFilePattern[] = [
  { pattern: '**/integration/**/*.{test,spec}.{js,ts,jsx,tsx}', description: 'Integration test directory' },
  { pattern: '**/*.integration.{test,spec}.{js,ts,jsx,tsx}', description: 'Integration test files' },
  { pattern: '**/e2e/**/*.{test,spec}.{js,ts,jsx,tsx}', description: 'E2E test directory' },
  { pattern: '**/*.e2e.{test,spec}.{js,ts,jsx,tsx}', description: 'E2E test files' }
];

export const PERFORMANCE_TEST_PATTERNS: TestFilePattern[] = [
  { pattern: '**/{perf,performance,benchmark}/**/*.{js,ts}', description: 'Performance test files' }
];

export const SECURITY_TOOLS = [
  'semgrep',
  'eslint-security',
  'npm-audit',
  'bandit'
] as const;

export type SecurityTool = typeof SECURITY_TOOLS[number];

// Error types
export class QualityPrincessError extends Error {
  constructor(message: string, public code: string, public context?: any) {
    super(message);
    this.name = 'QualityPrincessError';
  }
}

export class TestExecutionError extends QualityPrincessError {
  constructor(message: string, public testType: string, context?: any) {
    super(message, 'TEST_EXECUTION_ERROR', context);
  }
}

export class SecurityScanError extends QualityPrincessError {
  constructor(message: string, public tool: string, context?: any) {
    super(message, 'SECURITY_SCAN_ERROR', context);
  }
}

export class AnalysisError extends QualityPrincessError {
  constructor(message: string, public analysisType: string, context?: any) {
    super(message, 'ANALYSIS_ERROR', context);
  }
}