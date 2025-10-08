/**
 * Princess to Queen Communication Signature
 * DSPy optimized communication for executive summaries
 * NASA Rule 10 Compliant with FSM patterns
 */

import {
  DSPySignature,
  AgentIdentity,
  CommunicationContext,
  QualityMetrics
} from '../interfaces/types';
import { PrincessDomain, QueenDirective } from './QueenToPrincessSignature';

export enum DomainStatus {
  GREEN = 'GREEN',      // All systems operational
  YELLOW = 'YELLOW',    // Minor issues, monitoring
  ORANGE = 'ORANGE',    // Significant issues, intervention needed
  RED = 'RED'          // Critical issues, immediate action required
}

export interface DomainSummary {
  domain: PrincessDomain;
  status: DomainStatus;
  directivesReceived: number;
  directivesCompleted: number;
  directivesInProgress: number;
  directivesBlocked: number;
  overallProgress: number;
  healthMetrics: DomainHealthMetrics;
  keyAchievements: Achievement[];
  criticalIssues: CriticalIssue[];
}

export interface DomainHealthMetrics {
  droneUtilization: number;      // 0-100%
  taskCompletionRate: number;    // 0-100%
  qualityScore: number;          // 0-100%
  nasaCompliance: number;        // 0-100%
  theaterScore: number;          // 0-100 (lower is better)
  resourceEfficiency: number;    // 0-100%
}

export interface Achievement {
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  metrics: string;
  evidence: string[];
}

export interface CriticalIssue {
  issueId: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  impactedDirectives: string[];
  proposedSolution: string;
  resourcesNeeded: string[];
  estimatedResolution: Date;
}

export interface ExecutiveSummary {
  reportingPeriod: {
    start: Date;
    end: Date;
  };
  domainStatus: DomainStatus;
  executiveBrief: string;
  strategicAlignment: StrategicAlignment;
  resourceStatus: ResourceStatus;
  recommendedActions: StrategicRecommendation[];
  nextPeriodFocus: string[];
}

export interface StrategicAlignment {
  alignmentScore: number;        // 0-100%
  completedObjectives: string[];
  pendingObjectives: string[];
  atRiskObjectives: string[];
}

export interface ResourceStatus {
  droneCapacity: number;         // 0-100%
  budgetUtilization: number;     // 0-100%
  criticalResources: string[];
  bottlenecks: string[];
}

export interface StrategicRecommendation {
  action: string;
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  expectedOutcome: string;
  requiredResources: string[];
  timeline: string;
}

export class PrincessToQueenSignature implements DSPySignature {
  name = 'PrincessToQueenExecutiveSummary';
  description = 'Optimize Princess to Queen executive communication';

  /**
   * Define signature inputs
   * NASA Rule 10: Fixed structure, no dynamic fields
   */
  inputs = {
    princessIdentity: {} as AgentIdentity,
    princessDomain: {} as PrincessDomain,
    domainSummary: {} as DomainSummary,
    contextDNA: {} as CommunicationContext,
    historicalPerformance: {} as DomainPerformanceHistory
  };

  /**
   * Define signature outputs
   * NASA Rule 10: Bounded output structure
   */
  outputs = {
    executiveSummary: {} as ExecutiveSummary,
    optimizationMetrics: {} as QualityMetrics,
    communicationEfficiency: 0 as number,
    actionPriority: {} as ActionPriorityMatrix
  };

  /**
   * Optimization criteria for Princess-Queen communication
   * NASA Rule 10: Fixed criteria list
   */
  optimizationCriteria = [
    'conciseness_score >= 0.90',     // Executive brevity
    'actionability_score >= 0.95',   // Clear action items
    'strategic_relevance >= 0.90',   // Strategic alignment
    'evidence_quality >= 0.85',      // Data-backed claims
    'decision_readiness >= 0.95'     // Ready for Queen decision
  ];

  /**
   * Validate domain summary
   * NASA Rule 10: Bounded validation, assertions
   */
  validateSummary(summary: DomainSummary): boolean {
    assert(summary.domain !== null, 'Domain required');
    assert(summary.overallProgress >= 0 && summary.overallProgress <= 100,
           'Progress must be 0-100%');

    // Validate directive counts
    const totalDirectives = summary.directivesCompleted +
                          summary.directivesInProgress +
                          summary.directivesBlocked;
    assert(totalDirectives <= summary.directivesReceived,
           'Directive counts must be consistent');

    // Validate health metrics
    const metrics = summary.healthMetrics;
    assert(metrics.droneUtilization >= 0 && metrics.droneUtilization <= 100,
           'Drone utilization must be 0-100%');
    assert(metrics.taskCompletionRate >= 0 && metrics.taskCompletionRate <= 100,
           'Task completion must be 0-100%');
    assert(metrics.qualityScore >= 0 && metrics.qualityScore <= 100,
           'Quality score must be 0-100%');
    assert(metrics.nasaCompliance >= 0 && metrics.nasaCompliance <= 100,
           'NASA compliance must be 0-100%');
    assert(metrics.theaterScore >= 0 && metrics.theaterScore <= 100,
           'Theater score must be 0-100');

    // Fixed bounds: validate maximum 10 achievements
    const maxAchievements = Math.min(summary.keyAchievements.length, 10);
    for (let i = 0; i < maxAchievements; i++) {
      const achievement = summary.keyAchievements[i];
      assert(achievement.description.length > 0, 'Achievement description required');
      assert(achievement.evidence.length > 0, 'Achievement evidence required');
    }

    // Fixed bounds: validate maximum 5 critical issues
    const maxIssues = Math.min(summary.criticalIssues.length, 5);
    for (let i = 0; i < maxIssues; i++) {
      const issue = summary.criticalIssues[i];
      assert(issue.description.length > 0, 'Issue description required');
      assert(issue.proposedSolution.length > 0, 'Solution required for critical issue');
    }

    return true;
  }

  /**
   * Generate executive summary for Queen
   * NASA Rule 10: Fixed generation steps
   */
  generateExecutiveSummary(
    summary: DomainSummary,
    period: { start: Date; end: Date }
  ): ExecutiveSummary {
    assert(summary !== null, 'Summary required for generation');
    assert(period.start < period.end, 'Valid period required');

    const executiveSummary: ExecutiveSummary = {
      reportingPeriod: period,
      domainStatus: this.calculateDomainStatus(summary),
      executiveBrief: this.generateExecutiveBrief(summary),
      strategicAlignment: this.assessStrategicAlignment(summary),
      resourceStatus: this.assessResourceStatus(summary),
      recommendedActions: this.generateRecommendations(summary),
      nextPeriodFocus: this.identifyNextFocus(summary)
    };

    assert(executiveSummary.recommendedActions.length > 0,
           'At least one recommendation required');
    assert(executiveSummary.nextPeriodFocus.length > 0,
           'Next period focus required');

    return executiveSummary;
  }

  /**
   * Calculate overall domain status
   * NASA Rule 10: Fixed status calculation
   */
  private calculateDomainStatus(summary: DomainSummary): DomainStatus {
    const metrics = summary.healthMetrics;

    // Critical thresholds
    if (summary.criticalIssues.filter(i => i.severity === 'CRITICAL').length > 0) {
      return DomainStatus.RED;
    }

    // Quality thresholds
    if (metrics.nasaCompliance < 90 || metrics.theaterScore > 60) {
      return DomainStatus.ORANGE;
    }

    // Performance thresholds
    if (metrics.taskCompletionRate < 70 || metrics.qualityScore < 70) {
      return DomainStatus.YELLOW;
    }

    // Resource thresholds
    if (metrics.droneUtilization > 90 || metrics.resourceEfficiency < 60) {
      return DomainStatus.YELLOW;
    }

    return DomainStatus.GREEN;
  }

  /**
   * Generate executive brief
   * NASA Rule 10: Bounded brief generation
   */
  private generateExecutiveBrief(summary: DomainSummary): string {
    const status = this.calculateDomainStatus(summary);
    const completion = Math.round(summary.overallProgress);
    const blocked = summary.directivesBlocked;

    let brief = `${summary.domain} domain: ${status} status. `;
    brief += `${completion}% overall progress. `;
    brief += `${summary.directivesCompleted}/${summary.directivesReceived} directives completed. `;

    if (blocked > 0) {
      brief += `${blocked} directives blocked requiring intervention. `;
    }

    if (summary.criticalIssues.length > 0) {
      brief += `${summary.criticalIssues.length} critical issues identified. `;
    }

    const topAchievement = summary.keyAchievements[0];
    if (topAchievement) {
      brief += `Key achievement: ${topAchievement.description}. `;
    }

    assert(brief.length > 0 && brief.length < 500,
           'Executive brief must be 1-500 characters');

    return brief;
  }

  /**
   * Assess strategic alignment
   * NASA Rule 10: Fixed assessment structure
   */
  private assessStrategicAlignment(summary: DomainSummary): StrategicAlignment {
    const completed: string[] = [];
    const pending: string[] = [];
    const atRisk: string[] = [];

    // Categorize objectives (maximum 5 each)
    const maxObjectives = 5;

    for (let i = 0; i < Math.min(summary.directivesCompleted, maxObjectives); i++) {
      completed.push(`Objective-${i + 1}: Completed`);
    }

    for (let i = 0; i < Math.min(summary.directivesInProgress, maxObjectives); i++) {
      pending.push(`Objective-${i + 1}: In Progress`);
    }

    for (let i = 0; i < Math.min(summary.directivesBlocked, maxObjectives); i++) {
      atRisk.push(`Objective-${i + 1}: Blocked`);
    }

    // Calculate alignment score
    const totalDirectives = summary.directivesReceived || 1;
    const completionRate = summary.directivesCompleted / totalDirectives;
    const blockageRate = summary.directivesBlocked / totalDirectives;
    const alignmentScore = Math.round((completionRate * 100) * (1 - blockageRate * 0.5));

    return {
      alignmentScore: Math.min(100, Math.max(0, alignmentScore)),
      completedObjectives: completed,
      pendingObjectives: pending,
      atRiskObjectives: atRisk
    };
  }

  /**
   * Assess resource status
   * NASA Rule 10: Fixed resource assessment
   */
  private assessResourceStatus(summary: DomainSummary): ResourceStatus {
    const metrics = summary.healthMetrics;
    const bottlenecks: string[] = [];
    const critical: string[] = [];

    // Identify bottlenecks
    if (metrics.droneUtilization > 85) {
      bottlenecks.push('Drone capacity near limit');
    }
    if (metrics.resourceEfficiency < 70) {
      bottlenecks.push('Resource efficiency below target');
    }
    if (summary.directivesBlocked > 2) {
      bottlenecks.push('Multiple blocked directives');
    }

    // Identify critical resources
    if (metrics.droneUtilization > 90) {
      critical.push('Additional drones required');
    }
    if (metrics.qualityScore < 70) {
      critical.push('Quality expertise needed');
    }
    if (metrics.nasaCompliance < 92) {
      critical.push('Compliance specialists required');
    }

    return {
      droneCapacity: metrics.droneUtilization,
      budgetUtilization: Math.min(95, metrics.resourceEfficiency),
      criticalResources: critical.slice(0, 3), // Maximum 3
      bottlenecks: bottlenecks.slice(0, 3)     // Maximum 3
    };
  }

  /**
   * Generate strategic recommendations
   * NASA Rule 10: Fixed recommendation generation
   */
  private generateRecommendations(summary: DomainSummary): StrategicRecommendation[] {
    const recommendations: StrategicRecommendation[] = [];

    // Priority 1: Critical issues
    if (summary.criticalIssues.length > 0) {
      const issue = summary.criticalIssues[0];
      recommendations.push({
        action: `Resolve: ${issue.description}`,
        priority: 'IMMEDIATE',
        expectedOutcome: 'Unblock critical path',
        requiredResources: issue.resourcesNeeded.slice(0, 3),
        timeline: '24 hours'
      });
    }

    // Priority 2: Performance issues
    if (summary.healthMetrics.taskCompletionRate < 80) {
      recommendations.push({
        action: 'Improve task completion rate',
        priority: 'HIGH',
        expectedOutcome: 'Increase completion to >80%',
        requiredResources: ['Additional drones', 'Process optimization'],
        timeline: '1 week'
      });
    }

    // Priority 3: Quality issues
    if (summary.healthMetrics.nasaCompliance < 92) {
      recommendations.push({
        action: 'Enhance NASA Rule 10 compliance',
        priority: 'MEDIUM',
        expectedOutcome: 'Achieve 95% compliance',
        requiredResources: ['Training', 'Code review'],
        timeline: '2 weeks'
      });
    }

    // Ensure at least one recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        action: 'Maintain current performance',
        priority: 'LOW',
        expectedOutcome: 'Sustain operational excellence',
        requiredResources: ['Monitoring'],
        timeline: 'Ongoing'
      });
    }

    assert(recommendations.length > 0 && recommendations.length <= 5,
           'Recommendations must be 1-5');
    return recommendations.slice(0, 3); // Maximum 3 recommendations
  }

  /**
   * Identify next period focus areas
   * NASA Rule 10: Fixed focus identification
   */
  private identifyNextFocus(summary: DomainSummary): string[] {
    const focus: string[] = [];

    // Based on current status
    const status = this.calculateDomainStatus(summary);
    switch (status) {
      case DomainStatus.RED:
        focus.push('Crisis resolution and stabilization');
        break;
      case DomainStatus.ORANGE:
        focus.push('Issue mitigation and prevention');
        break;
      case DomainStatus.YELLOW:
        focus.push('Performance optimization');
        break;
      case DomainStatus.GREEN:
        focus.push('Innovation and scaling');
        break;
    }

    // Based on metrics
    if (summary.healthMetrics.theaterScore > 40) {
      focus.push('Theater reduction and authenticity');
    }
    if (summary.overallProgress < 70) {
      focus.push('Acceleration of directive completion');
    }

    assert(focus.length > 0 && focus.length <= 3, 'Focus areas must be 1-3');
    return focus.slice(0, 3); // Maximum 3 focus areas
  }

  /**
   * Generate action priority matrix
   * NASA Rule 10: Fixed matrix generation
   */
  generateActionPriority(summary: DomainSummary): ActionPriorityMatrix {
    const matrix: ActionPriorityMatrix = {
      immediate: [],
      thisWeek: [],
      thisSprint: [],
      nextSprint: []
    };

    // Immediate actions (maximum 3)
    summary.criticalIssues
      .filter(i => i.severity === 'CRITICAL')
      .slice(0, 3)
      .forEach(issue => {
        matrix.immediate.push({
          action: `Fix: ${issue.description}`,
          owner: 'Princess',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      });

    // This week actions (maximum 3)
    if (summary.directivesBlocked > 0) {
      matrix.thisWeek.push({
        action: `Unblock ${summary.directivesBlocked} directives`,
        owner: 'Princess',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    }

    // This sprint actions (maximum 3)
    if (summary.healthMetrics.nasaCompliance < 92) {
      matrix.thisSprint.push({
        action: 'Improve NASA compliance to 95%',
        owner: 'Development Princess',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      });
    }

    // Next sprint actions (maximum 3)
    matrix.nextSprint.push({
      action: 'Strategic planning for next quarter',
      owner: 'All Princesses',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    return matrix;
  }
}

interface ActionPriorityMatrix {
  immediate: PriorityAction[];
  thisWeek: PriorityAction[];
  thisSprint: PriorityAction[];
  nextSprint: PriorityAction[];
}

interface PriorityAction {
  action: string;
  owner: string;
  deadline: Date;
}

interface DomainPerformanceHistory {
  averageCompletionRate: number;
  averageQualityScore: number;
  historicalIssues: string[];
  successPatterns: string[];
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
// run_id: princess-queen-sig-001
// inputs: ["QueenToPrincessSignature.ts", "DroneToPrincessSignature.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"dspy-integration-v1.0"}
// === END FOOTER ===