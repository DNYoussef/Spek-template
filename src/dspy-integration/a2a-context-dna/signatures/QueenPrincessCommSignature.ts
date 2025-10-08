/**
 * Queen-Princess Communication DSPy Signatures
 * NASA Rule 10 Compliant Implementation with bounded communication contracts
 */

import {
  AgentIdentity,
  AgentMessage,
  TaskContext,
  PerformanceMetrics,
  QualityMetrics
} from '../interfaces/types';

/**
 * DSPy Signature for Queen to Princess domain assignment
 * Defines contract for high-level domain coordination
 */
interface QueenDomainAssignmentSignature {
  // Input fields
  domainRequest: {
    domain: 'development' | 'testing' | 'analysis' | 'optimization' | 'coordination';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'ENTERPRISE';
    resourceRequirements: string[];
    timeConstraints: number; // milliseconds
  };

  contextData: {
    currentWorkload: number; // 0-1 scale
    availablePrincesses: AgentIdentity[];
    systemPerformance: PerformanceMetrics;
    historicalSuccess: number; // 0-1 scale
  };

  // Output fields
  assignment: {
    selectedPrincess: AgentIdentity;
    delegatedTasks: TaskContext[];
    expectedOutcome: QualityMetrics;
    coordinationInstructions: string;
    monitoringCriteria: string[];
  };

  // Validation rules
  validation: {
    princessCompatibility: number; // 0-1 scale
    workloadFeasibility: number; // 0-1 scale
    resourceAvailability: number; // 0-1 scale
    timelineRealistic: boolean;
  };
}

/**
 * DSPy Signature for Queen to Princess strategic coordination
 * Defines contract for strategic decision making
 */
interface QueenStrategicCoordinationSignature {
  // Input fields
  strategicContext: {
    overallObjective: string;
    currentPhase: 'PLANNING' | 'EXECUTION' | 'OPTIMIZATION' | 'COMPLETION';
    systemState: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'OPTIMAL';
    emergingIssues: string[];
    resourceConstraints: string[];
  };

  princessReports: {
    agentId: string;
    domain: string;
    status: 'ACTIVE' | 'IDLE' | 'OVERLOADED' | 'ERROR';
    completedTasks: number;
    qualityMetrics: QualityMetrics;
    recommendations: string[];
  }[];

  // Output fields
  strategicDirectives: {
    priorityAdjustments: { domain: string; newPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }[];
    resourceReallocations: { fromDomain: string; toDomain: string; resourceType: string }[];
    coordinationChanges: { action: 'SCALE_UP' | 'SCALE_DOWN' | 'REDISTRIBUTE' | 'OPTIMIZE'; target: string }[];
    qualityThresholds: { metric: string; threshold: number }[];
  };

  // Decision rationale
  rationale: {
    decisionFactors: string[];
    riskAssessment: { risk: string; impact: 'LOW' | 'MEDIUM' | 'HIGH'; mitigation: string }[];
    expectedOutcomes: { outcome: string; probability: number; timeframe: string }[];
  };
}

/**
 * DSPy Signature for Princess status reporting to Queen
 * Defines contract for upward communication
 */
interface PrincessStatusReportSignature {
  // Input fields
  domainStatus: {
    domain: string;
    currentTasks: TaskContext[];
    completionRate: number; // 0-1 scale
    qualityAchievement: QualityMetrics;
    resourceUtilization: number; // 0-1 scale
    blockers: string[];
  };

  droneCoordination: {
    activeDrones: number;
    droneEfficiency: number; // 0-1 scale
    taskDistribution: { droneId: string; taskCount: number; performance: number }[];
    coordinationChallenges: string[];
  };

  // Output fields
  statusReport: {
    overallHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
    achievementSummary: string;
    performanceMetrics: PerformanceMetrics;
    recommendedActions: string[];
    resourceRequests: { resource: string; justification: string; urgency: 'LOW' | 'MEDIUM' | 'HIGH' }[];
  };

  escalations: {
    issueType: 'TECHNICAL' | 'RESOURCE' | 'COORDINATION' | 'QUALITY' | 'TIMELINE';
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    description: string;
    suggestedResolution: string;
    requiredQueenIntervention: boolean;
  }[];
}

/**
 * Implementation class for Queen-Princess Communication Signatures
 * NASA Rule 10 Compliant with bounded operations
 */
export class QueenPrincessCommSignatureProcessor {
  private signatureCache: Map<string, any> = new Map();
  private processingHistory: any[] = [];
  private validationRules: Map<string, (input: any) => boolean> = new Map();

  constructor() {
    this.initializeValidationRules();
    assert(this.validationRules.size > 0, 'Validation rules must be initialized');
  }

  /**
   * Process Queen domain assignment with bounded operations
   * NASA Rule 10: Fixed bounds, explicit validation, assertions
   */
  async processQueenDomainAssignment(
    queenAgent: AgentIdentity,
    assignmentRequest: QueenDomainAssignmentSignature['domainRequest'],
    contextData: QueenDomainAssignmentSignature['contextData']
  ): Promise<QueenDomainAssignmentSignature['assignment']> {
    assert(queenAgent.type === 'QUEEN', 'Only Queen agents can make domain assignments');
    assert(assignmentRequest.domain.length > 0, 'Domain must be specified');
    assert(contextData.availablePrincesses.length > 0, 'Available princesses required');

    // Step 1: Validate input (bounded validation)
    const isValid = this.validateDomainAssignmentInput(assignmentRequest, contextData);
    assert(isValid, 'Domain assignment input must be valid');

    // Step 2: Select optimal princess (bounded selection)
    const selectedPrincess = this.selectOptimalPrincess(assignmentRequest, contextData);
    assert(selectedPrincess !== null, 'Princess selection must succeed');

    // Step 3: Generate delegated tasks (bounded task generation)
    const delegatedTasks = this.generateDelegatedTasks(assignmentRequest, selectedPrincess);
    assert(delegatedTasks.length <= 10, 'Delegated tasks must be bounded');

    // Step 4: Calculate expected outcome (bounded calculation)
    const expectedOutcome = this.calculateExpectedOutcome(assignmentRequest, selectedPrincess, delegatedTasks);
    assert(expectedOutcome.overallScore >= 0 && expectedOutcome.overallScore <= 1, 'Expected outcome must be valid');

    // Step 5: Generate coordination instructions (bounded generation)
    const coordinationInstructions = this.generateCoordinationInstructions(assignmentRequest, selectedPrincess);
    assert(coordinationInstructions.length > 0, 'Coordination instructions must be generated');

    // Step 6: Define monitoring criteria (bounded criteria)
    const monitoringCriteria = this.defineMonitoringCriteria(assignmentRequest, delegatedTasks);
    assert(monitoringCriteria.length <= 5, 'Monitoring criteria must be bounded');

    const assignment: QueenDomainAssignmentSignature['assignment'] = {
      selectedPrincess: selectedPrincess,
      delegatedTasks: delegatedTasks,
      expectedOutcome: expectedOutcome,
      coordinationInstructions: coordinationInstructions,
      monitoringCriteria: monitoringCriteria
    };

    // Cache the assignment (bounded cache)
    this.cacheAssignment(queenAgent.id, assignment);

    return assignment;
  }

  /**
   * Process Queen strategic coordination with bounded operations
   * NASA Rule 10: Fixed strategic processing bounds
   */
  async processQueenStrategicCoordination(
    queenAgent: AgentIdentity,
    strategicContext: QueenStrategicCoordinationSignature['strategicContext'],
    princessReports: QueenStrategicCoordinationSignature['princessReports']
  ): Promise<QueenStrategicCoordinationSignature['strategicDirectives']> {
    assert(queenAgent.type === 'QUEEN', 'Only Queen agents can coordinate strategically');
    assert(strategicContext.overallObjective.length > 0, 'Strategic objective required');
    assert(princessReports.length <= 20, 'Princess reports must be bounded');

    // Step 1: Analyze strategic context (bounded analysis)
    const contextAnalysis = this.analyzeStrategicContext(strategicContext);
    assert(contextAnalysis.riskLevel >= 0 && contextAnalysis.riskLevel <= 1, 'Risk level must be valid');

    // Step 2: Process princess reports (bounded processing)
    const reportAnalysis = this.processPrincessReports(princessReports);
    assert(reportAnalysis.overallPerformance >= 0, 'Overall performance must be valid');

    // Step 3: Generate priority adjustments (bounded adjustments)
    const priorityAdjustments = this.generatePriorityAdjustments(contextAnalysis, reportAnalysis);
    assert(priorityAdjustments.length <= 10, 'Priority adjustments must be bounded');

    // Step 4: Calculate resource reallocations (bounded reallocations)
    const resourceReallocations = this.calculateResourceReallocations(contextAnalysis, reportAnalysis);
    assert(resourceReallocations.length <= 5, 'Resource reallocations must be bounded');

    // Step 5: Determine coordination changes (bounded changes)
    const coordinationChanges = this.determineCoordinationChanges(contextAnalysis, reportAnalysis);
    assert(coordinationChanges.length <= 8, 'Coordination changes must be bounded');

    // Step 6: Set quality thresholds (bounded thresholds)
    const qualityThresholds = this.setQualityThresholds(strategicContext, reportAnalysis);
    assert(qualityThresholds.length <= 4, 'Quality thresholds must be bounded to metrics');

    const strategicDirectives: QueenStrategicCoordinationSignature['strategicDirectives'] = {
      priorityAdjustments: priorityAdjustments,
      resourceReallocations: resourceReallocations,
      coordinationChanges: coordinationChanges,
      qualityThresholds: qualityThresholds
    };

    return strategicDirectives;
  }

  /**
   * Process Princess status report with bounded operations
   * NASA Rule 10: Fixed status processing bounds
   */
  async processPrincessStatusReport(
    princessAgent: AgentIdentity,
    domainStatus: PrincessStatusReportSignature['domainStatus'],
    droneCoordination: PrincessStatusReportSignature['droneCoordination']
  ): Promise<PrincessStatusReportSignature['statusReport']> {
    assert(princessAgent.type === 'PRINCESS', 'Only Princess agents can submit status reports');
    assert(domainStatus.domain.length > 0, 'Domain must be specified');
    assert(droneCoordination.activeDrones >= 0, 'Active drone count must be valid');

    // Step 1: Assess overall health (bounded assessment)
    const overallHealth = this.assessOverallHealth(domainStatus, droneCoordination);
    assert(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'].includes(overallHealth), 'Health assessment must be valid');

    // Step 2: Generate achievement summary (bounded summary)
    const achievementSummary = this.generateAchievementSummary(domainStatus);
    assert(achievementSummary.length > 0 && achievementSummary.length <= 500, 'Achievement summary must be bounded');

    // Step 3: Calculate performance metrics (bounded calculation)
    const performanceMetrics = this.calculatePerformanceMetrics(domainStatus, droneCoordination);
    assert(performanceMetrics.qualityScore >= 0, 'Performance metrics must be valid');

    // Step 4: Generate recommended actions (bounded recommendations)
    const recommendedActions = this.generateRecommendedActions(domainStatus, droneCoordination);
    assert(recommendedActions.length <= 5, 'Recommended actions must be bounded');

    // Step 5: Create resource requests (bounded requests)
    const resourceRequests = this.createResourceRequests(domainStatus, droneCoordination);
    assert(resourceRequests.length <= 3, 'Resource requests must be bounded');

    const statusReport: PrincessStatusReportSignature['statusReport'] = {
      overallHealth: overallHealth,
      achievementSummary: achievementSummary,
      performanceMetrics: performanceMetrics,
      recommendedActions: recommendedActions,
      resourceRequests: resourceRequests
    };

    return statusReport;
  }

  /**
   * Initialize validation rules with bounded definitions
   * NASA Rule 10: Fixed validation rule initialization
   */
  private initializeValidationRules(): void {
    // Domain assignment validation
    this.validationRules.set('domainAssignment', (input: any) => {
      return input.domainRequest &&
             input.contextData &&
             input.domainRequest.domain &&
             input.contextData.availablePrincesses &&
             input.contextData.availablePrincesses.length > 0;
    });

    // Strategic coordination validation
    this.validationRules.set('strategicCoordination', (input: any) => {
      return input.strategicContext &&
             input.princessReports &&
             input.strategicContext.overallObjective &&
             input.princessReports.length <= 20;
    });

    // Status report validation
    this.validationRules.set('statusReport', (input: any) => {
      return input.domainStatus &&
             input.droneCoordination &&
             input.domainStatus.domain &&
             input.droneCoordination.activeDrones >= 0;
    });

    assert(this.validationRules.size === 3, 'All validation rules must be initialized');
  }

  /**
   * Helper methods with bounded operations
   */
  private validateDomainAssignmentInput(
    assignmentRequest: QueenDomainAssignmentSignature['domainRequest'],
    contextData: QueenDomainAssignmentSignature['contextData']
  ): boolean {
    const validator = this.validationRules.get('domainAssignment');
    return validator ? validator({ domainRequest: assignmentRequest, contextData }) : false;
  }

  private selectOptimalPrincess(
    assignmentRequest: QueenDomainAssignmentSignature['domainRequest'],
    contextData: QueenDomainAssignmentSignature['contextData']
  ): AgentIdentity {
    assert(contextData.availablePrincesses.length > 0, 'Available princesses required');

    // Fixed bounds: evaluate maximum 10 princesses
    const princessesToEvaluate = contextData.availablePrincesses.slice(0, 10);
    let bestPrincess = princessesToEvaluate[0];
    let bestScore = 0;

    for (let i = 0; i < princessesToEvaluate.length; i++) {
      const princess = princessesToEvaluate[i];
      const score = this.calculatePrincessScore(princess, assignmentRequest, contextData);

      if (score > bestScore) {
        bestScore = score;
        bestPrincess = princess;
      }
    }

    assert(bestPrincess !== null, 'Best princess must be selected');
    return bestPrincess;
  }

  private calculatePrincessScore(
    princess: AgentIdentity,
    request: QueenDomainAssignmentSignature['domainRequest'],
    context: QueenDomainAssignmentSignature['contextData']
  ): number {
    let score = 0.5; // Base score

    // Domain compatibility
    if (princess.domain === request.domain) {
      score += 0.3;
    }

    // Capability matching (bounded to 5 capabilities)
    const requestCapabilities = request.resourceRequirements.slice(0, 5);
    const matchingCapabilities = princess.capabilities.filter(cap =>
      requestCapabilities.includes(cap)
    ).length;
    score += (matchingCapabilities / Math.max(requestCapabilities.length, 1)) * 0.2;

    return Math.min(score, 1.0);
  }

  private generateDelegatedTasks(
    request: QueenDomainAssignmentSignature['domainRequest'],
    princess: AgentIdentity
  ): TaskContext[] {
    const tasks: TaskContext[] = [];

    // Fixed bounds: generate maximum 10 tasks
    const maxTasks = Math.min(request.resourceRequirements.length, 10);

    for (let i = 0; i < maxTasks; i++) {
      const resource = request.resourceRequirements[i];
      const task: TaskContext = {
        taskId: `task_${Date.now()}_${i}`,
        taskType: `${request.domain}_task`,
        priority: request.priority,
        dependencies: [],
        resources: [resource],
        deadline: request.timeConstraints > 0 ? Date.now() + request.timeConstraints : undefined
      };

      tasks.push(task);
    }

    assert(tasks.length <= 10, 'Generated tasks must be bounded');
    return tasks;
  }

  private calculateExpectedOutcome(
    request: QueenDomainAssignmentSignature['domainRequest'],
    princess: AgentIdentity,
    tasks: TaskContext[]
  ): QualityMetrics {
    // Base quality expectations
    let baseQuality = 0.7;

    // Adjust based on complexity
    const complexityAdjustments = {
      'SIMPLE': 0.1,
      'MODERATE': 0.0,
      'COMPLEX': -0.1,
      'ENTERPRISE': -0.2
    };
    baseQuality += complexityAdjustments[request.complexity] || 0;

    // Adjust based on princess capability match
    const capabilityMatch = princess.capabilities.length > 0 ? 0.1 : -0.1;
    baseQuality += capabilityMatch;

    const finalQuality = Math.min(Math.max(baseQuality, 0), 1);

    return {
      semanticCoherence: finalQuality,
      contextRelevance: finalQuality,
      actionClarity: finalQuality,
      completeness: finalQuality,
      overallScore: finalQuality
    };
  }

  private generateCoordinationInstructions(
    request: QueenDomainAssignmentSignature['domainRequest'],
    princess: AgentIdentity
  ): string {
    const instructions = [
      `Coordinate ${request.domain} domain with ${request.priority} priority`,
      `Utilize ${princess.capabilities.slice(0, 3).join(', ')} capabilities`,
      `Maintain quality standards for ${request.complexity} complexity level`
    ];

    return instructions.join('. ') + '.';
  }

  private defineMonitoringCriteria(
    request: QueenDomainAssignmentSignature['domainRequest'],
    tasks: TaskContext[]
  ): string[] {
    const criteria: string[] = [
      `Task completion rate >= 80%`,
      `Quality score >= 0.7`,
      `Resource utilization <= 90%`
    ];

    if (request.timeConstraints > 0) {
      criteria.push(`Timeline adherence >= 95%`);
    }

    if (tasks.length > 5) {
      criteria.push(`Parallel execution efficiency >= 75%`);
    }

    return criteria.slice(0, 5); // Bounded to 5 criteria
  }

  private cacheAssignment(queenId: string, assignment: any): void {
    const cacheKey = `${queenId}_${Date.now()}`;
    this.signatureCache.set(cacheKey, assignment);

    // Keep cache bounded to 100 entries
    if (this.signatureCache.size > 100) {
      const entries = Array.from(this.signatureCache.entries());
      const oldest = entries.sort((a, b) => a[0].localeCompare(b[0]))[0];
      this.signatureCache.delete(oldest[0]);
    }
  }

  private analyzeStrategicContext(context: QueenStrategicCoordinationSignature['strategicContext']): {
    riskLevel: number;
    urgencyScore: number;
    complexity: number;
  } {
    let riskLevel = 0.3; // Base risk

    // System state risk adjustment
    const stateRisks = { 'HEALTHY': 0, 'DEGRADED': 0.2, 'CRITICAL': 0.5, 'OPTIMAL': -0.1 };
    riskLevel += stateRisks[context.systemState] || 0;

    // Emerging issues risk
    riskLevel += Math.min(context.emergingIssues.length * 0.1, 0.3);

    return {
      riskLevel: Math.min(Math.max(riskLevel, 0), 1),
      urgencyScore: context.currentPhase === 'EXECUTION' ? 0.8 : 0.5,
      complexity: context.resourceConstraints.length > 3 ? 0.8 : 0.5
    };
  }

  private processPrincessReports(reports: QueenStrategicCoordinationSignature['princessReports']): {
    overallPerformance: number;
    criticalIssues: number;
    resourceEfficiency: number;
  } {
    if (reports.length === 0) {
      return { overallPerformance: 0.5, criticalIssues: 0, resourceEfficiency: 0.5 };
    }

    const avgQuality = reports.reduce((sum, report) => sum + report.qualityMetrics.overallScore, 0) / reports.length;
    const criticalIssues = reports.filter(report => report.status === 'ERROR').length;
    const resourceEfficiency = reports.filter(report => report.status === 'ACTIVE').length / reports.length;

    return {
      overallPerformance: avgQuality,
      criticalIssues: criticalIssues,
      resourceEfficiency: resourceEfficiency
    };
  }

  private generatePriorityAdjustments(contextAnalysis: any, reportAnalysis: any): { domain: string; newPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }[] {
    const adjustments: { domain: string; newPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }[] = [];

    if (contextAnalysis.riskLevel > 0.7) {
      adjustments.push({ domain: 'coordination', newPriority: 'CRITICAL' });
    }

    if (reportAnalysis.overallPerformance < 0.5) {
      adjustments.push({ domain: 'optimization', newPriority: 'HIGH' });
    }

    if (reportAnalysis.criticalIssues > 0) {
      adjustments.push({ domain: 'testing', newPriority: 'HIGH' });
    }

    return adjustments.slice(0, 10); // Bounded
  }

  private calculateResourceReallocations(contextAnalysis: any, reportAnalysis: any): { fromDomain: string; toDomain: string; resourceType: string }[] {
    const reallocations: { fromDomain: string; toDomain: string; resourceType: string }[] = [];

    if (reportAnalysis.resourceEfficiency < 0.6) {
      reallocations.push({
        fromDomain: 'development',
        toDomain: 'optimization',
        resourceType: 'processing_power'
      });
    }

    return reallocations.slice(0, 5); // Bounded
  }

  private determineCoordinationChanges(contextAnalysis: any, reportAnalysis: any): { action: 'SCALE_UP' | 'SCALE_DOWN' | 'REDISTRIBUTE' | 'OPTIMIZE'; target: string }[] {
    const changes: { action: 'SCALE_UP' | 'SCALE_DOWN' | 'REDISTRIBUTE' | 'OPTIMIZE'; target: string }[] = [];

    if (reportAnalysis.overallPerformance < 0.6) {
      changes.push({ action: 'SCALE_UP', target: 'processing_capacity' });
    }

    if (contextAnalysis.complexity > 0.7) {
      changes.push({ action: 'REDISTRIBUTE', target: 'task_allocation' });
    }

    return changes.slice(0, 8); // Bounded
  }

  private setQualityThresholds(context: any, analysis: any): { metric: string; threshold: number }[] {
    return [
      { metric: 'semanticCoherence', threshold: 0.8 },
      { metric: 'contextRelevance', threshold: 0.8 },
      { metric: 'actionClarity', threshold: 0.8 },
      { metric: 'completeness', threshold: 0.8 }
    ];
  }

  private assessOverallHealth(domainStatus: any, droneCoordination: any): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' {
    const healthScore = (domainStatus.completionRate + domainStatus.qualityAchievement.overallScore + droneCoordination.droneEfficiency) / 3;

    if (healthScore >= 0.9) return 'EXCELLENT';
    if (healthScore >= 0.8) return 'GOOD';
    if (healthScore >= 0.6) return 'FAIR';
    if (healthScore >= 0.4) return 'POOR';
    return 'CRITICAL';
  }

  private generateAchievementSummary(domainStatus: any): string {
    const completionPercent = Math.floor(domainStatus.completionRate * 100);
    const qualityPercent = Math.floor(domainStatus.qualityAchievement.overallScore * 100);

    return `Domain ${domainStatus.domain}: ${completionPercent}% completion rate with ${qualityPercent}% quality achievement. ${domainStatus.blockers.length} active blockers.`.slice(0, 500);
  }

  private calculatePerformanceMetrics(domainStatus: any, droneCoordination: any): PerformanceMetrics {
    return {
      communicationLatency: 100, // Default latency
      qualityScore: domainStatus.qualityAchievement.overallScore,
      taskCompletionRate: domainStatus.completionRate,
      memoryEfficiency: droneCoordination.droneEfficiency,
      errorRate: domainStatus.blockers.length > 0 ? 0.1 : 0.0
    };
  }

  private generateRecommendedActions(domainStatus: any, droneCoordination: any): string[] {
    const actions: string[] = [];

    if (domainStatus.completionRate < 0.8) {
      actions.push('Increase task execution velocity');
    }

    if (droneCoordination.droneEfficiency < 0.7) {
      actions.push('Optimize drone coordination algorithms');
    }

    if (domainStatus.blockers.length > 0) {
      actions.push('Address identified blockers');
    }

    return actions.slice(0, 5); // Bounded
  }

  private createResourceRequests(domainStatus: any, droneCoordination: any): { resource: string; justification: string; urgency: 'LOW' | 'MEDIUM' | 'HIGH' }[] {
    const requests: { resource: string; justification: string; urgency: 'LOW' | 'MEDIUM' | 'HIGH' }[] = [];

    if (domainStatus.resourceUtilization > 0.9) {
      requests.push({
        resource: 'additional_processing_capacity',
        justification: 'High resource utilization detected',
        urgency: 'HIGH'
      });
    }

    return requests.slice(0, 3); // Bounded
  }

  /**
   * Public interface methods
   */
  getSignatureStatistics(): {
    cacheSize: number;
    processingHistorySize: number;
    validationRuleCount: number;
  } {
    return {
      cacheSize: this.signatureCache.size,
      processingHistorySize: this.processingHistory.length,
      validationRuleCount: this.validationRules.size
    };
  }
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
// run_id: a2a-dspy-008
// inputs: ["types.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
// === END FOOTER ===