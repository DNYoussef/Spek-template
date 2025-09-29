/**
 * Quality Gate Domain Types for Enterprise Quality Management
 */
import { UUID, Timestamp, Percentage, Score } from '../base/primitives';
import { BaseResult, BaseConfig, BaseOrchestrator } from '../base/common';
// Quality Gate Core Types
export interface QualityGateConfig extends BaseConfig {
  thresholds: QualityThresholds;
  gateRules: QualityGateRule[];
  enforcement: EnforcementLevel;
}
export interface QualityThresholds {
  nasaCompliance: Percentage;
  testCoverage: Percentage;
  codeQuality: Score;
  securityScore: Score;
  performanceScore: Score;
  theaterScore: Score;
}
export interface QualityGateRule {
  id: UUID;
  name: string;
  category: 'compliance' | 'testing' | 'security' | 'performance';
  condition: string;
  threshold: number;
  severity: 'warning' | 'error' | 'critical';
}
export enum EnforcementLevel {
  ADVISORY  =  'advisory',
  WARNING  =  'warning',
  BLOCKING  =  'blocking',
  STRICT  =  'strict'
}
// Quality Gate Results
export interface QualityGateResult extends BaseResult {
  gateId: UUID;
  overallScore: Score;
  passed: boolean;
  metrics: QualityMetrics;
  violations: QualityViolation[];
  recommendations: string[];
}
export interface QualityMetrics {
  nasaCompliance: Percentage;
  testCoverage: Percentage;
  codeQuality: Score;
  securityScore: Score;
  performanceMetrics: PerformanceMetrics;
  artifactQuality: ArtifactQualityMetrics;
}
export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUtilization: Percentage;
  throughput: number;
}
export interface ArtifactQualityMetrics {
  completeness: Percentage;
  accuracy: Percentage;
  consistency: Score;
  maintainability: Score;
}
export interface QualityViolation {
  ruleId: UUID;
  severity: 'warning' | 'error' | 'critical';
  message: string;
  location: string;
  suggestedFix?: string;
}
// Quality Gate Engine
export interface QualityGateEngine {
  config: QualityGateConfig;
  evaluate(artifacts: unknown[]): Promise<QualityGateResult>;
  validateThresholds(metrics: QualityMetrics): boolean;
  generateReport(result: QualityGateResult): Promise<string>;
}
// Quality Dashboard
export interface QualityDashboard {
  metrics: DashboardMetrics;
  refresh(): Promise<void>;
  exportReport(format: 'json' | 'html' | 'pdf'): Promise<string>;
}
export interface DashboardMetrics {
  totalGates: number;
  passedGates: number;
  failedGates: number;
  averageScore: Score;
  trendData: TrendDataPoint[];
}
export interface TrendDataPoint {
  timestamp: Timestamp;
  score: Score;
  gatesPassed: number;
  gatesFailed: number;
}
// Quality Gate Orchestrator
export interface QualityGateOrchestrator extends BaseOrchestrator {
  config: QualityGateConfig;
  engine: QualityGateEngine;
  dashboard: QualityDashboard;
}
// Enterprise Configuration
export interface EnterpriseConfiguration extends BaseConfig {
  complianceStandards: ComplianceStandard[];
  qualityPolicies: QualityPolicy[];
  reportingRequirements: ReportingRequirement[];
}
export interface EnterpriseQualityConfig extends EnterpriseConfiguration {
  gateConfigurations: QualityGateConfig[];
  globalThresholds: QualityThresholds;
}
export interface ComplianceStandard {
  name: string;
  version: string;
  requirements: ComplianceRequirement[];
}
export interface ComplianceRequirement {
  id: string;
  description: string;
  mandatory: boolean;
  validationRule: string;
}
export interface QualityPolicy {
  id: UUID;
  name: string;
  scope: 'project' | 'organization' | 'global';
  rules: PolicyRule[];
}
export interface PolicyRule {
  condition: string;
  action: 'warn' | 'block' | 'approve';  parameters: Record<string, unknown>;
}
export interface ReportingRequirement {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  format: 'summary' | 'detailed' | 'executive';
  includeMetrics: string[];
}
// Integration Types
export interface ArtifactSystemIntegration {
  validateArtifacts(artifacts: unknown[]): Promise<ValidationResult>;
  generateQualityReport(artifacts: unknown[]): Promise<ArtifactQualityReport>;
}
export interface ArtifactQualityReport {
  artifactCount: number;
  qualityMetrics: ArtifactQualityMetrics;
  issues: QualityIssue[];
  recommendations: string[];
}
export interface QualityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  affectedArtifacts: string[];
}
export interface CICDIntegration {
  integrateWithPipeline(pipelineId: string): Promise<boolean>;
  configureQualityGates(gates: QualityGateConfig[]): Promise<void>;
}
export interface PerformanceOverheadValidator {
  validateOverhead(metrics: PerformanceMetrics): Promise<OverheadReport>;
  optimizePerformance(config: QualityGateConfig): Promise<QualityGateConfig>;
}
export interface OverheadReport {
  overheadPercentage: Percentage;
  bottlenecks: string[];
  optimizationSuggestions: string[];
}
interface ValidationResult {
  valid: boolean;
  score: Score;
  violations: string[];
}
// NASA Rule 10 compliant validation functions
export function isValidQualityGateConfig(config: unknown): config is QualityGateConfig {
    console.assert(config !== null, 'QualityGateConfig cannot be null');
    console.assert(typeof config === 'object', 'QualityGateConfig must be object');
  const c  =  config as QualityGateConfig;
  return typeof c.thresholds === 'object' && Array.isArray(c.gateRules);
}
export function isValidQualityMetrics(metrics: unknown): metrics is QualityMetrics {
    console.assert(metrics !== null, 'QualityMetrics cannot be null');
    console.assert(typeof metrics === 'object', 'QualityMetrics must be object');
  const m  =  metrics as QualityMetrics;
  return typeof m.nasaCompliance === 'number' && typeof m.testCoverage === 'number';
}
/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/* Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-29T20:45:15-04:00 | backend-dev@claude-sonnet-4 | Create quality gate domain types | quality-gate-types.ts | OK | Created comprehensive quality gate types including QualityGateEngine, Dashboard, Orchestrator | 0.00 | e3f7b9a |
| 1.0.1   | 2025-09-29T21:12:30-04:00 | coder@sonnet | Fix footer syntax for TS compliance | quality-gate-types.ts | OK | Converted HTML footer const to TS comments | 0.00 | f4d8c2e |
Receipt
- status: OK
- reason_if_blocked: --
- run_id: footer-syntax-fix
- inputs: ["quality-gate-types.ts"]
- tools_used: ["Edit"]
- versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */