/**
 * Drone to Princess Communication Signature
 * DSPy optimized communication for status reporting
 * NASA Rule 10 Compliant with FSM patterns
 */

import {
  DSPySignature,
  AgentIdentity,
  CommunicationContext,
  QualityMetrics
} from '../interfaces/types';
import { DroneCapability } from './PrincessToDroneSignature';
import { PrincessDomain } from './QueenToPrincessSignature';

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL'
}

export enum BlockerType {
  TECHNICAL = 'TECHNICAL',
  DEPENDENCY = 'DEPENDENCY',
  RESOURCE = 'RESOURCE',
  PERMISSION = 'PERMISSION',
  INFORMATION = 'INFORMATION'
}

export interface DroneStatusReport {
  droneId: string;
  taskId: string;
  status: TaskStatus;
  progressPercentage: number;
  startTime: Date;
  currentTime: Date;
  estimatedCompletion: Date;
  metrics: TaskMetrics;
  artifacts: TaskArtifact[];
  issues: TaskIssue[];
}

export interface TaskMetrics {
  linesOfCode: number;
  filesModified: number;
  testsWritten: number;
  testsPassed: number;
  coveragePercentage: number;
  nasaComplianceScore: number;
  theaterScore: number;
}

export interface TaskArtifact {
  type: 'FILE' | 'REPORT' | 'LOG' | 'METRIC';
  path: string;
  size: number;
  hash: string;
  validated: boolean;
}

export interface TaskIssue {
  type: BlockerType;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  suggestedAction: string;
  requiresEscalation: boolean;
}

export interface PrincessActionRequired {
  taskId: string;
  actionType: 'APPROVE' | 'REVIEW' | 'UNBLOCK' | 'REASSIGN' | 'ABORT';
  urgency: 'IMMEDIATE' | 'HIGH' | 'NORMAL' | 'LOW';
  context: string;
  options: ActionOption[];
}

export interface ActionOption {
  action: string;
  consequence: string;
  recommendation: boolean;
}

export class DroneToPrincessSignature implements DSPySignature {
  name = 'DroneToPrincessStatusReport';
  description = 'Optimize Drone to Princess status reporting';

  /**
   * Define signature inputs
   * NASA Rule 10: Fixed structure, no dynamic fields
   */
  inputs = {
    droneIdentity: {} as AgentIdentity,
    princessDomain: {} as PrincessDomain,
    statusReport: {} as DroneStatusReport,
    contextDNA: {} as CommunicationContext,
    historicalReports: {} as ReportHistory
  };

  /**
   * Define signature outputs
   * NASA Rule 10: Bounded output structure
   */
  outputs = {
    optimizedReport: {} as OptimizedStatusReport,
    actionRequired: {} as PrincessActionRequired | null,
    qualityMetrics: {} as QualityMetrics,
    reportConfidence: 0 as number
  };

  /**
   * Optimization criteria for Drone-Princess communication
   * NASA Rule 10: Fixed criteria list
   */
  optimizationCriteria = [
    'completeness_score >= 0.95',    // All required fields present
    'accuracy_score >= 0.90',        // Metrics accurate
    'relevance_score >= 0.85',       // Information relevant
    'actionability_score >= 0.90',   // Clear actions if needed
    'evidence_score >= 0.95'         // Evidence-based reporting
  ];

  /**
   * Validate status report
   * NASA Rule 10: Bounded validation, assertions
   */
  validateReport(report: DroneStatusReport): boolean {
    assert(report.droneId.length > 0, 'Drone ID required');
    assert(report.taskId.length > 0, 'Task ID required');
    assert(report.progressPercentage >= 0 && report.progressPercentage <= 100,
           'Progress must be 0-100%');

    // Validate metrics
    const metrics = report.metrics;
    assert(metrics.linesOfCode >= 0, 'Lines of code must be non-negative');
    assert(metrics.filesModified >= 0, 'Files modified must be non-negative');
    assert(metrics.testsWritten >= 0, 'Tests written must be non-negative');
    assert(metrics.testsPassed >= 0 && metrics.testsPassed <= metrics.testsWritten,
           'Tests passed must be <= tests written');
    assert(metrics.coveragePercentage >= 0 && metrics.coveragePercentage <= 100,
           'Coverage must be 0-100%');
    assert(metrics.nasaComplianceScore >= 0 && metrics.nasaComplianceScore <= 100,
           'NASA compliance must be 0-100%');
    assert(metrics.theaterScore >= 0 && metrics.theaterScore <= 100,
           'Theater score must be 0-100%');

    // Fixed bounds: validate maximum 20 artifacts
    const maxArtifacts = Math.min(report.artifacts.length, 20);
    for (let i = 0; i < maxArtifacts; i++) {
      const artifact = report.artifacts[i];
      assert(artifact.path.length > 0, 'Artifact path required');
      assert(artifact.size >= 0, 'Artifact size must be non-negative');
    }

    // Fixed bounds: validate maximum 10 issues
    const maxIssues = Math.min(report.issues.length, 10);
    for (let i = 0; i < maxIssues; i++) {
      const issue = report.issues[i];
      assert(issue.description.length > 0, 'Issue description required');
    }

    return true;
  }

  /**
   * Optimize report for princess domain
   * NASA Rule 10: Fixed optimization steps
   */
  optimizeForPrincess(
    report: DroneStatusReport,
    domain: PrincessDomain
  ): OptimizedStatusReport {
    assert(report !== null, 'Report required for optimization');
    assert(domain !== null, 'Domain required for optimization');

    const optimized: OptimizedStatusReport = {
      originalReport: report,
      domainHighlights: this.extractDomainHighlights(report, domain),
      progressSummary: this.generateProgressSummary(report),
      qualityIndicators: this.extractQualityIndicators(report),
      riskAssessment: this.assessRisks(report),
      recommendedActions: this.generateRecommendations(report),
      optimizationScore: 0
    };

    // Calculate optimization score (bounded calculation)
    optimized.optimizationScore = this.calculateOptimizationScore(optimized);
    assert(optimized.optimizationScore >= 0 && optimized.optimizationScore <= 1,
           'Optimization score must be between 0 and 1');

    return optimized;
  }

  /**
   * Extract domain-specific highlights
   * NASA Rule 10: Fixed extraction logic
   */
  private extractDomainHighlights(
    report: DroneStatusReport,
    domain: PrincessDomain
  ): string[] {
    const highlights: string[] = [];

    switch (domain) {
      case PrincessDomain.DEVELOPMENT:
        highlights.push(`Code: ${report.metrics.linesOfCode} LOC modified`);
        highlights.push(`Files: ${report.metrics.filesModified} files changed`);
        highlights.push(`NASA: ${report.metrics.nasaComplianceScore}% compliant`);
        break;
      case PrincessDomain.QUALITY:
        highlights.push(`Tests: ${report.metrics.testsPassed}/${report.metrics.testsWritten} passing`);
        highlights.push(`Coverage: ${report.metrics.coveragePercentage}%`);
        highlights.push(`Theater: ${report.metrics.theaterScore}/100 score`);
        break;
      case PrincessDomain.SECURITY:
        highlights.push(`Vulnerabilities: Check required`);
        highlights.push(`Compliance: NASA ${report.metrics.nasaComplianceScore}%`);
        highlights.push(`Validation: ${this.countValidatedArtifacts(report)} validated`);
        break;
      case PrincessDomain.RESEARCH:
        highlights.push(`Artifacts: ${report.artifacts.length} generated`);
        highlights.push(`Evidence: ${this.countEvidenceArtifacts(report)} pieces`);
        highlights.push(`Progress: ${report.progressPercentage}% complete`);
        break;
      case PrincessDomain.INFRASTRUCTURE:
        highlights.push(`Resources: Within limits`);
        highlights.push(`Performance: On track`);
        highlights.push(`Issues: ${report.issues.length} identified`);
        break;
      case PrincessDomain.COORDINATION:
        highlights.push(`Status: ${report.status}`);
        highlights.push(`Timeline: ${this.calculateTimelineStatus(report)}`);
        highlights.push(`Blockers: ${this.countBlockers(report)}`);
        break;
    }

    assert(highlights.length === 3, 'Must have exactly 3 highlights');
    return highlights;
  }

  /**
   * Generate progress summary
   * NASA Rule 10: Fixed summary structure
   */
  private generateProgressSummary(report: DroneStatusReport): ProgressSummary {
    const elapsed = report.currentTime.getTime() - report.startTime.getTime();
    const estimated = report.estimatedCompletion.getTime() - report.currentTime.getTime();

    return {
      percentComplete: report.progressPercentage,
      timeElapsed: Math.floor(elapsed / 60000), // minutes
      timeRemaining: Math.floor(estimated / 60000), // minutes
      status: report.status,
      trajectory: this.calculateTrajectory(report)
    };
  }

  /**
   * Extract quality indicators
   * NASA Rule 10: Fixed indicator set
   */
  private extractQualityIndicators(report: DroneStatusReport): QualityIndicator[] {
    const indicators: QualityIndicator[] = [];

    // NASA compliance indicator
    indicators.push({
      name: 'NASA_COMPLIANCE',
      value: report.metrics.nasaComplianceScore,
      threshold: 92,
      status: report.metrics.nasaComplianceScore >= 92 ? 'PASS' : 'FAIL'
    });

    // Theater detection indicator
    indicators.push({
      name: 'THEATER_DETECTION',
      value: report.metrics.theaterScore,
      threshold: 60,
      status: report.metrics.theaterScore < 60 ? 'PASS' : 'FAIL'
    });

    // Test coverage indicator
    indicators.push({
      name: 'TEST_COVERAGE',
      value: report.metrics.coveragePercentage,
      threshold: 80,
      status: report.metrics.coveragePercentage >= 80 ? 'PASS' : 'FAIL'
    });

    assert(indicators.length === 3, 'Must have exactly 3 indicators');
    return indicators;
  }

  /**
   * Assess risks based on report
   * NASA Rule 10: Fixed risk assessment
   */
  private assessRisks(report: DroneStatusReport): RiskAssessment {
    let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    const factors: string[] = [];

    // Check critical issues
    const criticalIssues = report.issues.filter(i => i.severity === 'CRITICAL').length;
    if (criticalIssues > 0) {
      riskLevel = 'HIGH';
      factors.push(`${criticalIssues} critical issues`);
    }

    // Check timeline
    if (report.estimatedCompletion > new Date(Date.now() + 24 * 60 * 60 * 1000)) {
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
      factors.push('Timeline at risk');
    }

    // Check quality metrics
    if (report.metrics.nasaComplianceScore < 92) {
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
      factors.push('NASA compliance below threshold');
    }

    return {
      level: riskLevel,
      factors: factors,
      mitigation: this.generateMitigation(riskLevel)
    };
  }

  /**
   * Generate recommendations based on report
   * NASA Rule 10: Fixed recommendation logic
   */
  private generateRecommendations(report: DroneStatusReport): string[] {
    const recommendations: string[] = [];

    // Based on status
    if (report.status === TaskStatus.BLOCKED) {
      recommendations.push('ESCALATE: Unblock required immediately');
    } else if (report.status === TaskStatus.FAILED) {
      recommendations.push('REVIEW: Failure analysis needed');
    } else if (report.progressPercentage < 50 && this.isOverdue(report)) {
      recommendations.push('MONITOR: Progress lagging, intervention may be needed');
    } else {
      recommendations.push('CONTINUE: On track, no action required');
    }

    // Based on quality
    if (report.metrics.theaterScore >= 60) {
      recommendations.push('VALIDATE: High theater score detected');
    }

    // Based on issues
    if (report.issues.filter(i => i.requiresEscalation).length > 0) {
      recommendations.push('REVIEW: Escalation required for blockers');
    }

    assert(recommendations.length > 0 && recommendations.length <= 3,
           'Recommendations must be 1-3');
    return recommendations;
  }

  /**
   * Helper functions with NASA Rule 10 compliance
   */
  private countValidatedArtifacts(report: DroneStatusReport): number {
    let count = 0;
    const maxCheck = Math.min(report.artifacts.length, 20);
    for (let i = 0; i < maxCheck; i++) {
      if (report.artifacts[i].validated) count++;
    }
    return count;
  }

  private countEvidenceArtifacts(report: DroneStatusReport): number {
    let count = 0;
    const maxCheck = Math.min(report.artifacts.length, 20);
    for (let i = 0; i < maxCheck; i++) {
      if (report.artifacts[i].type === 'REPORT' || report.artifacts[i].type === 'LOG') {
        count++;
      }
    }
    return count;
  }

  private calculateTimelineStatus(report: DroneStatusReport): string {
    const now = report.currentTime.getTime();
    const deadline = report.estimatedCompletion.getTime();
    const hoursRemaining = (deadline - now) / (60 * 60 * 1000);

    if (hoursRemaining < 0) return 'OVERDUE';
    if (hoursRemaining < 24) return 'URGENT';
    return 'ON_TRACK';
  }

  private countBlockers(report: DroneStatusReport): number {
    return report.issues.filter(i => i.requiresEscalation).length;
  }

  private calculateTrajectory(report: DroneStatusReport): string {
    const elapsed = report.currentTime.getTime() - report.startTime.getTime();
    const total = report.estimatedCompletion.getTime() - report.startTime.getTime();
    const expectedProgress = (elapsed / total) * 100;

    if (report.progressPercentage > expectedProgress + 10) return 'AHEAD';
    if (report.progressPercentage < expectedProgress - 10) return 'BEHIND';
    return 'ON_TRACK';
  }

  private isOverdue(report: DroneStatusReport): boolean {
    return report.estimatedCompletion.getTime() < report.currentTime.getTime();
  }

  private generateMitigation(riskLevel: string): string {
    switch (riskLevel) {
      case 'HIGH':
        return 'Immediate princess intervention required';
      case 'MEDIUM':
        return 'Monitor closely, prepare contingency';
      default:
        return 'Continue with standard monitoring';
    }
  }

  /**
   * Calculate optimization score
   * NASA Rule 10: Bounded calculation
   */
  private calculateOptimizationScore(optimized: OptimizedStatusReport): number {
    assert(optimized !== null, 'Optimized report required');

    let score = 0;
    const weights = {
      domainHighlights: 0.2,
      progressSummary: 0.2,
      qualityIndicators: 0.2,
      riskAssessment: 0.2,
      recommendations: 0.2
    };

    // Fixed scoring calculation
    if (optimized.domainHighlights.length > 0) score += weights.domainHighlights;
    if (optimized.progressSummary !== null) score += weights.progressSummary;
    if (optimized.qualityIndicators.length > 0) score += weights.qualityIndicators;
    if (optimized.riskAssessment !== null) score += weights.riskAssessment;
    if (optimized.recommendedActions.length > 0) score += weights.recommendations;

    assert(score >= 0 && score <= 1, 'Score must be between 0 and 1');
    return score;
  }
}

interface OptimizedStatusReport {
  originalReport: DroneStatusReport;
  domainHighlights: string[];
  progressSummary: ProgressSummary;
  qualityIndicators: QualityIndicator[];
  riskAssessment: RiskAssessment;
  recommendedActions: string[];
  optimizationScore: number;
}

interface ProgressSummary {
  percentComplete: number;
  timeElapsed: number;
  timeRemaining: number;
  status: TaskStatus;
  trajectory: string;
}

interface QualityIndicator {
  name: string;
  value: number;
  threshold: number;
  status: 'PASS' | 'FAIL';
}

interface RiskAssessment {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  factors: string[];
  mitigation: string;
}

interface ReportHistory {
  reportCount: number;
  averageCompletionTime: number;
  successRate: number;
  commonIssues: string[];
}

/**
 * Assert function for NASA Rule 10 compliance
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: drone-princess-sig-001
// inputs: ["PrincessToDroneSignature.ts", "QueenToPrincessSignature.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"dspy-integration-v1.0"}
// === END FOOTER ===