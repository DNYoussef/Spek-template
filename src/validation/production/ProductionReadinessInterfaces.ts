/**
 * Production Readiness Validation Interfaces
 * NASA Rule 10 Compliant interface definitions
 */
export interface ProductionReadinessResult {
  overallScore: number;
  maxScore: number;
  passed: boolean;
  details: {
    codeQuality: {
      score: number;
      maxScore: number;
      checks: Array<{ name: string; passed: boolean; score: number; }>;
    };
    testCoverage: {
      score: number;
      maxScore: number;
      percentage: number;
    };
    documentation: {
      score: number;
      maxScore: number;
      completeness: number;
    };
    security: {
      score: number;
      maxScore: number;
      vulnerabilities: number;
    };
  };
  recommendations: string[];
  warnings: string[];
  errors: string[];
}
export interface ProductionReadinessValidator {
  validateProductionReadiness(): Promise<ProductionReadinessResult>;
  validateCodeQuality(): Promise<any>;
  validateTestCoverage(): Promise<any>;
  validateDocumentation(): Promise<any>;
  validateSecurity(): Promise<any>;
}
export interface POT10ComplianceResult {
  overallCompliance: number;
  maxCompliance: number;
  passed: boolean;
  violations: Array<{
    rule: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
    file: string;
    line: number;
  }>;
  recommendations: string[];
}
export interface POT10RuleEngine {
  validateCompliance(): Promise<POT10ComplianceResult>;
  checkRuleCompliance(rule: string): Promise<boolean>;
  generateComplianceReport(): Promise<POT10ComplianceResult>;
}
export interface TheaterScanResult {
  theaterScore: number;
  maxScore: number;
  passed: boolean;
  detectedPatterns: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    location: string;
    description: string;
  }>;
  recommendations: string[];
}
export interface TheaterScanner {
  scanForTheater(): Promise<TheaterScanResult>;
  detectPerformanceTheater(): Promise<TheaterScanResult>;
  analyzeCodePatterns(): Promise<any>;
}
export interface CoverageAnalysisResult {
  totalCoverage: number;
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  statementCoverage: number;
  passed: boolean;
  uncoveredFiles: string[];
  recommendations: string[];
}
export interface TestCoverageAnalyzer {
  analyzeCoverage(): Promise<CoverageAnalysisResult>;
  generateCoverageReport(): Promise<CoverageAnalysisResult>;
  checkThresholds(): Promise<boolean>;
}