/**
 * security-types - Type definitions
 * Auto-generated and extended by fix-missing-type-definitions.js
 */
export interface SecurityMetrics {
  vulnerabilities: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  lastScanTime?: number;
}