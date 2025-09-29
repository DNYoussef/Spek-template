/**
 * performance-types - Performance and metrics const type definitions
 * NASA Rule 10 Compliant
 */
/**
 * NASA Metrics for compliance tracking
 */
export interface NASAMetrics {
  functionLength: number;
  assertionCount: number;
  recursionDetected: boolean;
  loopBounds: boolean;
  memoryBounds: boolean;
  complianceScore: number;
}
/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  throughput: number;
  latency: number;
  errorRate: number;
}
/**
 * Security metrics
 */
export interface SecurityMetrics {
  vulnerabilitiesFound: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  lastScanTime: number;
  complianceLevel: number;
}
/**
 * Gate metrics for quality gates
 */
export interface GateMetrics {
  passed: boolean;
  score: number;
  thresholds: Record<string, number>;
  violations: string[];
}
/**
 * Trend metrics
 */
export interface TrendMetrics {
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  changeRate: number;
}
/**
 * Decision matrix for automated decisions
 */
export interface DecisionMatrix {
  criteria: string[];
  weights: number[];
  scores: number[][];
  recommendation: string;
  confidence: number;
}
/**
 * Remediation action
 */
export interface RemediationAction {
  id: string;
  type: 'fix' | 'patch' | 'rollback' | 'restart' | 'scale';
  description: string;
  automated: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: number;
}
/**
 * Test result
 */
export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  coverage?: number;
}