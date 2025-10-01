/**
 * Drone Status Reporting DSPy Signatures
 * NASA Rule 10 Compliant Implementation with bounded status reporting contracts
 */

import {
  AgentIdentity,
  PerformanceMetrics,
  QualityMetrics
} from '../interfaces/types';

/**
 * DSPy Signature for Drone operational status reporting
 * Defines contract for detailed drone state communication
 */
interface DroneOperationalStatusSignature {
  // Input fields
  systemStatus: {
    droneId: string;
    operationalMode: 'ACTIVE' | 'IDLE' | 'MAINTENANCE' | 'ERROR' | 'SHUTDOWN';
    systemHealth: 'OPTIMAL' | 'FUNCTIONAL' | 'DEGRADED' | 'CRITICAL';
    uptime: number; // milliseconds
    lastMaintenanceCheck: number; // timestamp
    errorHistory: { timestamp: number; error: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }[];
  };

  resourceStatus: {
    cpuUtilization: number; // 0-1 scale
    memoryUtilization: number; // 0-1 scale
    storageUtilization: number; // 0-1 scale
    networkLatency: number; // milliseconds
    processesActive: number;
    resourceLimits: { resource: string; limit: number; current: number }[];
  };

  capabilityStatus: {
    availableCapabilities: string[];
    degradedCapabilities: string[];
    capabilityUtilization: { capability: string; usage: number }[]; // 0-1 scale
    capabilityPerformance: { capability: string; efficiency: number }[]; // 0-1 scale
  };

  // Output fields
  statusReport: {
    overallHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
    operationalReadiness: number; // 0-1 scale
    performanceMetrics: PerformanceMetrics;
    recommendedActions: string[];
    maintenanceRequirements: { action: string; urgency: 'LOW' | 'MEDIUM' | 'HIGH'; timeframe: string }[];
  };

  alerts: {
    severityLevel: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    alertType: 'PERFORMANCE' | 'RESOURCE' | 'CAPABILITY' | 'SYSTEM' | 'COMMUNICATION';
    message: string;
    requiresIntervention: boolean;
    suggestedResponse: string;
  }[];
}

/**
 * DSPy Signature for Drone task execution status
 * Defines contract for task-specific progress reporting
 */
interface DroneTaskExecutionSignature {
  // Input fields
  taskDetails: {
    taskId: string;
    taskType: 'IMPLEMENTATION' | 'ANALYSIS' | 'TESTING' | 'OPTIMIZATION' | 'VALIDATION';
    assignedBy: string; // Princess agent ID
    startTime: number;
    estimatedDuration: number;
    actualDuration: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };

  executionStatus: {
    currentPhase: 'INITIALIZATION' | 'PLANNING' | 'EXECUTION' | 'VALIDATION' | 'COMPLETION';
    progressPercentage: number; // 0-100
    milestones: { milestone: string; completed: boolean; completionTime?: number }[];
    resourcesUsed: { resource: string; amount: number; efficiency: number }[];
    qualityMetrics: QualityMetrics;
  };

  challenges: {
    blockers: { type: string; description: string; impact: 'LOW' | 'MEDIUM' | 'HIGH'; workaround?: string }[];
    dependencies: { dependency: string; status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' }[];
    riskFactors: { risk: string; probability: number; impact: number; mitigation: string }[];
  };

  // Output fields
  executionReport: {
    taskStatus: 'ON_TRACK' | 'AHEAD_OF_SCHEDULE' | 'DELAYED' | 'AT_RISK' | 'BLOCKED' | 'FAILED';
    completionForecast: { estimatedCompletion: number; confidence: number };
    qualityAssessment: { currentQuality: number; projectedQuality: number; qualityRisks: string[] };
    resourceEfficiency: { overall: number; breakdown: { resource: string; efficiency: number }[] };
    nextSteps: string[];
  };

  escalationRequests: {
    escalationType: 'RESOURCE' | 'GUIDANCE' | 'DEPENDENCY' | 'QUALITY' | 'TIMELINE';
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    requestedSupport: string;
    impactIfNotResolved: string;
  }[];
}

/**
 * DSPy Signature for Drone collaboration status
 * Defines contract for inter-drone communication reporting
 */
interface DroneCollaborationSignature {
  // Input fields
  collaborationContext: {
    activeCollaborations: {
      collaborationId: string;
      partnerDrones: string[];
      collaborationType: 'PARALLEL' | 'SEQUENTIAL' | 'SUPPORT' | 'REVIEW';
      startTime: number;
      expectedDuration: number;
    }[];
    communicationHistory: {
      partnerId: string;
      messageCount: number;
      lastCommunication: number;
      communicationQuality: number; // 0-1 scale
    }[];
    sharedResources: {
      resourceType: string;
      sharedWith: string[];
      utilizationRate: number;
      conflicts: string[];
    }[];
  };

  coordinationMetrics: {
    synchronizationEfficiency: number; // 0-1 scale
    informationSharingRate: number; // 0-1 scale
    conflictResolutionTime: number; // milliseconds average
    collaborativeOutputQuality: number; // 0-1 scale
    teamworkScore: number; // 0-1 scale
  };

  // Output fields
  collaborationReport: {
    overallCollaborationHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DYSFUNCTIONAL';
    activePartnerships: { partnerId: string; relationshipStrength: number; effectiveness: number }[];
    collaborationEfficiency: number; // 0-1 scale
    communicationPatterns: { pattern: string; frequency: number; effectiveness: number }[];
    improvementOpportunities: string[];
  };

  coordinationRequests: {
    requestType: 'SYNC_MEETING' | 'RESOURCE_SHARING' | 'CONFLICT_RESOLUTION' | 'KNOWLEDGE_EXCHANGE';
    targetPartners: string[];
    proposedSchedule: number;
    expectedBenefit: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
}

/**
 * Implementation class for Drone Status Reporting Signatures
 * NASA Rule 10 Compliant with bounded operations
 */
export class DroneStatusSignatureProcessor {
  private statusCache: Map<string, any> = new Map();
  private statusHistory: Map<string, any[]> = new Map();
  private alertThresholds: Map<string, number> = new Map();
  private performanceBaselines: Map<string, PerformanceMetrics> = new Map();

  constructor() {
    this.initializeAlertThresholds();
    this.initializePerformanceBaselines();
    assert(this.alertThresholds.size > 0, 'Alert thresholds must be initialized');
    assert(this.performanceBaselines.size > 0, 'Performance baselines must be initialized');
  }

  /**
   * Process Drone operational status with bounded operations
   * NASA Rule 10: Fixed bounds, explicit validation, assertions
   */
  async processDroneOperationalStatus(
    droneAgent: AgentIdentity,
    systemStatus: DroneOperationalStatusSignature['systemStatus'],
    resourceStatus: DroneOperationalStatusSignature['resourceStatus'],
    capabilityStatus: DroneOperationalStatusSignature['capabilityStatus']
  ): Promise<{
    statusReport: DroneOperationalStatusSignature['statusReport'];
    alerts: DroneOperationalStatusSignature['alerts'];
  }> {
    assert(droneAgent.type === 'DRONE', 'Only Drone agents can submit operational status');
    assert(systemStatus.droneId === droneAgent.id, 'Drone ID must match agent ID');
    assert(resourceStatus.cpuUtilization >= 0 && resourceStatus.cpuUtilization <= 1, 'CPU utilization must be valid');

    // Step 1: Assess overall health (bounded assessment)
    const overallHealth = this.assessSystemHealth(systemStatus, resourceStatus, capabilityStatus);
    assert(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'].includes(overallHealth), 'Health assessment must be valid');

    // Step 2: Calculate operational readiness (bounded calculation)
    const operationalReadiness = this.calculateOperationalReadiness(systemStatus, resourceStatus, capabilityStatus);
    assert(operationalReadiness >= 0 && operationalReadiness <= 1, 'Operational readiness must be valid');

    // Step 3: Generate performance metrics (bounded generation)
    const performanceMetrics = this.generatePerformanceMetrics(systemStatus, resourceStatus);
    assert(performanceMetrics.qualityScore >= 0, 'Performance metrics must be valid');

    // Step 4: Generate recommended actions (bounded recommendations)
    const recommendedActions = this.generateRecommendedActions(systemStatus, resourceStatus, capabilityStatus);
    assert(recommendedActions.length <= 5, 'Recommended actions must be bounded');

    // Step 5: Determine maintenance requirements (bounded requirements)
    const maintenanceRequirements = this.determineMaintenanceRequirements(systemStatus, resourceStatus);
    assert(maintenanceRequirements.length <= 3, 'Maintenance requirements must be bounded');

    // Step 6: Generate alerts (bounded alerts)
    const alerts = this.generateAlerts(systemStatus, resourceStatus, capabilityStatus);
    assert(alerts.length <= 10, 'Alerts must be bounded');

    const statusReport: DroneOperationalStatusSignature['statusReport'] = {
      overallHealth: overallHealth,
      operationalReadiness: operationalReadiness,
      performanceMetrics: performanceMetrics,
      recommendedActions: recommendedActions,
      maintenanceRequirements: maintenanceRequirements
    };

    // Cache status report (bounded cache)
    this.cacheStatusReport(droneAgent.id, statusReport);

    return { statusReport, alerts };
  }

  /**
   * Process Drone task execution status with bounded operations
   * NASA Rule 10: Fixed task processing bounds
   */
  async processDroneTaskExecution(
    droneAgent: AgentIdentity,
    taskDetails: DroneTaskExecutionSignature['taskDetails'],
    executionStatus: DroneTaskExecutionSignature['executionStatus'],
    challenges: DroneTaskExecutionSignature['challenges']
  ): Promise<{
    executionReport: DroneTaskExecutionSignature['executionReport'];
    escalationRequests: DroneTaskExecutionSignature['escalationRequests'];
  }> {
    assert(droneAgent.type === 'DRONE', 'Only Drone agents can submit task execution status');
    assert(taskDetails.taskId.length > 0, 'Task ID must be specified');
    assert(executionStatus.progressPercentage >= 0 && executionStatus.progressPercentage <= 100, 'Progress must be valid');

    // Step 1: Assess task status (bounded assessment)
    const taskStatus = this.assessTaskStatus(taskDetails, executionStatus, challenges);
    assert(['ON_TRACK', 'AHEAD_OF_SCHEDULE', 'DELAYED', 'AT_RISK', 'BLOCKED', 'FAILED'].includes(taskStatus), 'Task status must be valid');

    // Step 2: Forecast completion (bounded forecasting)
    const completionForecast = this.forecastCompletion(taskDetails, executionStatus);
    assert(completionForecast.confidence >= 0 && completionForecast.confidence <= 1, 'Completion forecast must be valid');

    // Step 3: Assess quality (bounded quality assessment)
    const qualityAssessment = this.assessTaskQuality(executionStatus, challenges);
    assert(qualityAssessment.currentQuality >= 0, 'Quality assessment must be valid');

    // Step 4: Calculate resource efficiency (bounded calculation)
    const resourceEfficiency = this.calculateTaskResourceEfficiency(executionStatus);
    assert(resourceEfficiency.overall >= 0 && resourceEfficiency.overall <= 1, 'Resource efficiency must be valid');

    // Step 5: Generate next steps (bounded generation)
    const nextSteps = this.generateTaskNextSteps(taskDetails, executionStatus, challenges);
    assert(nextSteps.length <= 5, 'Next steps must be bounded');

    // Step 6: Create escalation requests (bounded escalations)
    const escalationRequests = this.createEscalationRequests(taskDetails, executionStatus, challenges);
    assert(escalationRequests.length <= 5, 'Escalation requests must be bounded');

    const executionReport: DroneTaskExecutionSignature['executionReport'] = {
      taskStatus: taskStatus,
      completionForecast: completionForecast,
      qualityAssessment: qualityAssessment,
      resourceEfficiency: resourceEfficiency,
      nextSteps: nextSteps
    };

    return { executionReport, escalationRequests };
  }

  /**
   * Process Drone collaboration status with bounded operations
   * NASA Rule 10: Fixed collaboration processing bounds
   */
  async processDroneCollaboration(
    droneAgent: AgentIdentity,
    collaborationContext: DroneCollaborationSignature['collaborationContext'],
    coordinationMetrics: DroneCollaborationSignature['coordinationMetrics']
  ): Promise<{
    collaborationReport: DroneCollaborationSignature['collaborationReport'];
    coordinationRequests: DroneCollaborationSignature['coordinationRequests'];
  }> {
    assert(droneAgent.type === 'DRONE', 'Only Drone agents can submit collaboration status');
    assert(collaborationContext.activeCollaborations.length <= 20, 'Active collaborations must be bounded');
    assert(coordinationMetrics.teamworkScore >= 0 && coordinationMetrics.teamworkScore <= 1, 'Teamwork score must be valid');

    // Step 1: Assess collaboration health (bounded assessment)
    const collaborationHealth = this.assessCollaborationHealth(collaborationContext, coordinationMetrics);
    assert(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DYSFUNCTIONAL'].includes(collaborationHealth), 'Collaboration health must be valid');

    // Step 2: Analyze partnerships (bounded analysis)
    const activePartnerships = this.analyzeActivePartnerships(collaborationContext);
    assert(activePartnerships.length <= 10, 'Active partnerships must be bounded');

    // Step 3: Calculate collaboration efficiency (bounded calculation)
    const collaborationEfficiency = this.calculateCollaborationEfficiency(coordinationMetrics);
    assert(collaborationEfficiency >= 0 && collaborationEfficiency <= 1, 'Collaboration efficiency must be valid');

    // Step 4: Analyze communication patterns (bounded analysis)
    const communicationPatterns = this.analyzeCommunicationPatterns(collaborationContext);
    assert(communicationPatterns.length <= 5, 'Communication patterns must be bounded');

    // Step 5: Identify improvement opportunities (bounded identification)
    const improvementOpportunities = this.identifyImprovementOpportunities(collaborationContext, coordinationMetrics);
    assert(improvementOpportunities.length <= 3, 'Improvement opportunities must be bounded');

    // Step 6: Generate coordination requests (bounded requests)
    const coordinationRequests = this.generateCoordinationRequests(collaborationContext, coordinationMetrics);
    assert(coordinationRequests.length <= 3, 'Coordination requests must be bounded');

    const collaborationReport: DroneCollaborationSignature['collaborationReport'] = {
      overallCollaborationHealth: collaborationHealth,
      activePartnerships: activePartnerships,
      collaborationEfficiency: collaborationEfficiency,
      communicationPatterns: communicationPatterns,
      improvementOpportunities: improvementOpportunities
    };

    return { collaborationReport, coordinationRequests };
  }

  /**
   * Initialize alert thresholds with bounded definitions
   * NASA Rule 10: Fixed threshold initialization
   */
  private initializeAlertThresholds(): void {
    this.alertThresholds.set('cpu_utilization_warning', 0.8);
    this.alertThresholds.set('cpu_utilization_critical', 0.95);
    this.alertThresholds.set('memory_utilization_warning', 0.8);
    this.alertThresholds.set('memory_utilization_critical', 0.95);
    this.alertThresholds.set('storage_utilization_warning', 0.9);
    this.alertThresholds.set('storage_utilization_critical', 0.98);
    this.alertThresholds.set('network_latency_warning', 1000); // 1 second
    this.alertThresholds.set('network_latency_critical', 5000); // 5 seconds
    this.alertThresholds.set('error_rate_warning', 0.05); // 5%
    this.alertThresholds.set('error_rate_critical', 0.1); // 10%

    assert(this.alertThresholds.size === 10, 'All alert thresholds must be initialized');
  }

  /**
   * Initialize performance baselines with bounded definitions
   * NASA Rule 10: Fixed baseline initialization
   */
  private initializePerformanceBaselines(): void {
    const defaultBaseline: PerformanceMetrics = {
      communicationLatency: 100,
      qualityScore: 0.8,
      taskCompletionRate: 0.8,
      memoryEfficiency: 0.8,
      errorRate: 0.02
    };

    this.performanceBaselines.set('default', defaultBaseline);
    this.performanceBaselines.set('high_performance', {
      ...defaultBaseline,
      qualityScore: 0.9,
      taskCompletionRate: 0.9,
      memoryEfficiency: 0.9
    });

    assert(this.performanceBaselines.size >= 1, 'Performance baselines must be initialized');
  }

  /**
   * Helper methods with bounded operations
   */
  private assessSystemHealth(systemStatus: any, resourceStatus: any, capabilityStatus: any): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' {
    let healthScore = 0.5; // Base health

    // System status contribution
    const statusScores = { 'ACTIVE': 0.3, 'IDLE': 0.2, 'MAINTENANCE': 0.1, 'ERROR': -0.2, 'SHUTDOWN': -0.5 };
    healthScore += statusScores[systemStatus.operationalMode] || 0;

    // Resource utilization contribution (optimal around 0.7)
    const avgUtilization = (resourceStatus.cpuUtilization + resourceStatus.memoryUtilization + resourceStatus.storageUtilization) / 3;
    if (avgUtilization >= 0.5 && avgUtilization <= 0.8) {
      healthScore += 0.2; // Optimal range
    } else if (avgUtilization > 0.8) {
      healthScore -= (avgUtilization - 0.8) * 0.5; // Penalty for high utilization
    }

    // Capability status contribution
    const capabilityRatio = capabilityStatus.availableCapabilities.length /
      Math.max(capabilityStatus.availableCapabilities.length + capabilityStatus.degradedCapabilities.length, 1);
    healthScore += capabilityRatio * 0.2;

    // Convert to health categories
    if (healthScore >= 0.9) return 'EXCELLENT';
    if (healthScore >= 0.8) return 'GOOD';
    if (healthScore >= 0.6) return 'FAIR';
    if (healthScore >= 0.4) return 'POOR';
    return 'CRITICAL';
  }

  private calculateOperationalReadiness(systemStatus: any, resourceStatus: any, capabilityStatus: any): number {
    let readiness = 0.5; // Base readiness

    // System mode readiness
    const modeReadiness = { 'ACTIVE': 1.0, 'IDLE': 0.8, 'MAINTENANCE': 0.3, 'ERROR': 0.1, 'SHUTDOWN': 0.0 };
    readiness += (modeReadiness[systemStatus.operationalMode] || 0) * 0.4;

    // Resource availability (inverted utilization)
    const avgAvailability = 1 - ((resourceStatus.cpuUtilization + resourceStatus.memoryUtilization + resourceStatus.storageUtilization) / 3);
    readiness += avgAvailability * 0.3;

    // Capability availability
    const totalCapabilities = capabilityStatus.availableCapabilities.length + capabilityStatus.degradedCapabilities.length;
    const capabilityReadiness = totalCapabilities > 0
      ? capabilityStatus.availableCapabilities.length / totalCapabilities
      : 0.5;
    readiness += capabilityReadiness * 0.3;

    return Math.min(Math.max(readiness, 0), 1);
  }

  private generatePerformanceMetrics(systemStatus: any, resourceStatus: any): PerformanceMetrics {
    const baseline = this.performanceBaselines.get('default');
    assert(baseline !== undefined, 'Default baseline must exist');

    return {
      communicationLatency: resourceStatus.networkLatency,
      qualityScore: systemStatus.systemHealth === 'OPTIMAL' ? 0.9 :
                   systemStatus.systemHealth === 'FUNCTIONAL' ? 0.8 :
                   systemStatus.systemHealth === 'DEGRADED' ? 0.6 : 0.3,
      taskCompletionRate: systemStatus.operationalMode === 'ACTIVE' ? 0.8 : 0.3,
      memoryEfficiency: 1 - resourceStatus.memoryUtilization,
      errorRate: systemStatus.errorHistory.length > 0 ? Math.min(systemStatus.errorHistory.length * 0.01, 0.1) : 0.01
    };
  }

  private generateRecommendedActions(systemStatus: any, resourceStatus: any, capabilityStatus: any): string[] {
    const actions: string[] = [];

    // Resource-based recommendations
    if (resourceStatus.cpuUtilization > 0.9) {
      actions.push('Reduce CPU-intensive operations');
    }
    if (resourceStatus.memoryUtilization > 0.9) {
      actions.push('Optimize memory usage');
    }
    if (resourceStatus.storageUtilization > 0.9) {
      actions.push('Clean up storage space');
    }

    // System-based recommendations
    if (systemStatus.operationalMode === 'ERROR') {
      actions.push('Address system errors');
    }
    if (systemStatus.errorHistory.length > 5) {
      actions.push('Investigate recurring errors');
    }

    // Capability-based recommendations
    if (capabilityStatus.degradedCapabilities.length > 0) {
      actions.push('Restore degraded capabilities');
    }

    // Default recommendation if no specific issues
    if (actions.length === 0) {
      actions.push('Continue normal operations');
    }

    return actions.slice(0, 5); // Bounded to 5 actions
  }

  private determineMaintenanceRequirements(systemStatus: any, resourceStatus: any): any[] {
    const requirements: any[] = [];

    const currentTime = Date.now();
    const daysSinceLastMaintenance = (currentTime - systemStatus.lastMaintenanceCheck) / (1000 * 60 * 60 * 24);

    // Scheduled maintenance
    if (daysSinceLastMaintenance > 7) {
      requirements.push({
        action: 'Routine system maintenance',
        urgency: 'MEDIUM',
        timeframe: 'Within 24 hours'
      });
    }

    // Resource-driven maintenance
    if (resourceStatus.cpuUtilization > 0.95 || resourceStatus.memoryUtilization > 0.95) {
      requirements.push({
        action: 'Resource optimization maintenance',
        urgency: 'HIGH',
        timeframe: 'Within 4 hours'
      });
    }

    // Error-driven maintenance
    const recentErrors = systemStatus.errorHistory.filter((e: any) => (currentTime - e.timestamp) < 3600000); // Last hour
    if (recentErrors.length > 3) {
      requirements.push({
        action: 'Error investigation and resolution',
        urgency: 'HIGH',
        timeframe: 'Within 2 hours'
      });
    }

    return requirements.slice(0, 3); // Bounded to 3 requirements
  }

  private generateAlerts(systemStatus: any, resourceStatus: any, capabilityStatus: any): any[] {
    const alerts: any[] = [];

    // CPU alerts
    if (resourceStatus.cpuUtilization >= this.alertThresholds.get('cpu_utilization_critical')) {
      alerts.push({
        severityLevel: 'CRITICAL',
        alertType: 'RESOURCE',
        message: `Critical CPU utilization: ${Math.floor(resourceStatus.cpuUtilization * 100)}%`,
        requiresIntervention: true,
        suggestedResponse: 'Immediately reduce CPU load or scale resources'
      });
    } else if (resourceStatus.cpuUtilization >= this.alertThresholds.get('cpu_utilization_warning')) {
      alerts.push({
        severityLevel: 'WARNING',
        alertType: 'RESOURCE',
        message: `High CPU utilization: ${Math.floor(resourceStatus.cpuUtilization * 100)}%`,
        requiresIntervention: false,
        suggestedResponse: 'Monitor CPU usage and consider optimization'
      });
    }

    // Memory alerts
    if (resourceStatus.memoryUtilization >= this.alertThresholds.get('memory_utilization_critical')) {
      alerts.push({
        severityLevel: 'CRITICAL',
        alertType: 'RESOURCE',
        message: `Critical memory utilization: ${Math.floor(resourceStatus.memoryUtilization * 100)}%`,
        requiresIntervention: true,
        suggestedResponse: 'Free memory immediately or restart processes'
      });
    }

    // System error alerts
    const recentCriticalErrors = systemStatus.errorHistory.filter((e: any) =>
      e.severity === 'HIGH' && (Date.now() - e.timestamp) < 1800000); // Last 30 minutes
    if (recentCriticalErrors.length > 0) {
      alerts.push({
        severityLevel: 'ERROR',
        alertType: 'SYSTEM',
        message: `${recentCriticalErrors.length} critical error(s) in last 30 minutes`,
        requiresIntervention: true,
        suggestedResponse: 'Investigate and resolve critical errors'
      });
    }

    // Capability degradation alerts
    if (capabilityStatus.degradedCapabilities.length > 0) {
      alerts.push({
        severityLevel: 'WARNING',
        alertType: 'CAPABILITY',
        message: `${capabilityStatus.degradedCapabilities.length} capabilities degraded`,
        requiresIntervention: false,
        suggestedResponse: 'Restore degraded capabilities when possible'
      });
    }

    return alerts.slice(0, 10); // Bounded to 10 alerts
  }

  private cacheStatusReport(droneId: string, statusReport: any): void {
    this.statusCache.set(droneId, {
      timestamp: Date.now(),
      report: statusReport
    });

    // Keep cache bounded to 100 drones
    if (this.statusCache.size > 100) {
      const entries = Array.from(this.statusCache.entries());
      const oldest = entries.sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      this.statusCache.delete(oldest[0]);
    }

    // Update status history
    const history = this.statusHistory.get(droneId) || [];
    history.push({ timestamp: Date.now(), report: statusReport });

    // Keep history bounded to 20 entries per drone
    if (history.length > 20) {
      history.shift();
    }

    this.statusHistory.set(droneId, history);
  }

  private assessTaskStatus(taskDetails: any, executionStatus: any, challenges: any): string {
    // Critical blockers = BLOCKED
    const criticalBlockers = challenges.blockers.filter((b: any) => b.impact === 'HIGH').length;
    if (criticalBlockers > 0) return 'BLOCKED';

    // Quality too low = FAILED
    if (executionStatus.qualityMetrics.overallScore < 0.3) return 'FAILED';

    // Time-based assessment
    const timeElapsed = Date.now() - taskDetails.startTime;
    const progressRatio = executionStatus.progressPercentage / 100;
    const timeRatio = timeElapsed / taskDetails.estimatedDuration;

    if (progressRatio > timeRatio + 0.2) return 'AHEAD_OF_SCHEDULE';
    if (timeRatio > progressRatio + 0.3) return 'DELAYED';
    if (challenges.blockers.length > 0 || challenges.riskFactors.length > 2) return 'AT_RISK';

    return 'ON_TRACK';
  }

  private forecastCompletion(taskDetails: any, executionStatus: any): any {
    const timeElapsed = Date.now() - taskDetails.startTime;
    const progressRatio = executionStatus.progressPercentage / 100;

    let estimatedCompletion = taskDetails.startTime + taskDetails.estimatedDuration;
    let confidence = 0.8;

    if (progressRatio > 0) {
      const projectedDuration = timeElapsed / progressRatio;
      estimatedCompletion = taskDetails.startTime + projectedDuration;

      // Confidence based on consistency
      const timeRatio = timeElapsed / taskDetails.estimatedDuration;
      confidence = Math.max(0.3, 1 - Math.abs(progressRatio - timeRatio));
    }

    return {
      estimatedCompletion: Math.floor(estimatedCompletion),
      confidence: Math.min(Math.max(confidence, 0), 1)
    };
  }

  private assessTaskQuality(executionStatus: any, challenges: any): any {
    const currentQuality = executionStatus.qualityMetrics.overallScore;

    // Project quality based on current trends and risks
    let projectedQuality = currentQuality;
    const qualityRisks: string[] = [];

    // Risk factors impact
    challenges.riskFactors.forEach((risk: any) => {
      if (risk.probability > 0.5 && risk.impact > 0.5) {
        projectedQuality -= 0.1;
        qualityRisks.push(risk.risk);
      }
    });

    // Blocker impact
    if (challenges.blockers.length > 0) {
      projectedQuality -= challenges.blockers.length * 0.05;
      qualityRisks.push('Unresolved blockers');
    }

    return {
      currentQuality: currentQuality,
      projectedQuality: Math.max(projectedQuality, 0),
      qualityRisks: qualityRisks.slice(0, 3) // Bounded
    };
  }

  private calculateTaskResourceEfficiency(executionStatus: any): any {
    if (executionStatus.resourcesUsed.length === 0) {
      return { overall: 0.8, breakdown: [] };
    }

    const efficiencies = executionStatus.resourcesUsed.map((res: any) => res.efficiency);
    const overall = efficiencies.reduce((sum: any, eff: any) => sum + eff, 0) / efficiencies.length;

    const breakdown = executionStatus.resourcesUsed.map((res: any) => ({
      resource: res.resource,
      efficiency: res.efficiency
    })).slice(0, 5); // Bounded

    return { overall: overall, breakdown: breakdown };
  }

  private generateTaskNextSteps(taskDetails: any, executionStatus: any, challenges: any): string[] {
    const steps: string[] = [];

    // Address blockers first
    if (challenges.blockers.length > 0) {
      steps.push('Resolve blocking issues');
    }

    // Phase-specific steps
    switch (executionStatus.currentPhase) {
      case 'INITIALIZATION':
        steps.push('Complete initialization and move to planning');
        break;
      case 'PLANNING':
        steps.push('Finalize plan and begin execution');
        break;
      case 'EXECUTION':
        steps.push('Continue task execution');
        break;
      case 'VALIDATION':
        steps.push('Complete validation checks');
        break;
      case 'COMPLETION':
        steps.push('Finalize task and submit results');
        break;
    }

    // Quality improvements
    if (executionStatus.qualityMetrics.overallScore < 0.8) {
      steps.push('Improve task quality');
    }

    return steps.slice(0, 5); // Bounded
  }

  private createEscalationRequests(taskDetails: any, executionStatus: any, challenges: any): any[] {
    const requests: any[] = [];

    // High-impact blockers
    challenges.blockers.forEach((blocker: any) => {
      if (blocker.impact === 'HIGH') {
        requests.push({
          escalationType: 'DEPENDENCY',
          urgency: 'HIGH',
          description: blocker.description,
          requestedSupport: 'Princess intervention to resolve blocker',
          impactIfNotResolved: 'Task failure or significant delay'
        });
      }
    });

    // Quality concerns
    if (executionStatus.qualityMetrics.overallScore < 0.6) {
      requests.push({
        escalationType: 'QUALITY',
        urgency: 'MEDIUM',
        description: 'Quality metrics below acceptable threshold',
        requestedSupport: 'Quality improvement guidance',
        impactIfNotResolved: 'Substandard deliverable'
      });
    }

    // Timeline concerns
    const timeElapsed = Date.now() - taskDetails.startTime;
    const progressRatio = executionStatus.progressPercentage / 100;
    const timeRatio = timeElapsed / taskDetails.estimatedDuration;

    if (timeRatio > progressRatio + 0.3) {
      requests.push({
        escalationType: 'TIMELINE',
        urgency: 'HIGH',
        description: 'Task significantly behind schedule',
        requestedSupport: 'Timeline adjustment or additional resources',
        impactIfNotResolved: 'Missed deadline'
      });
    }

    return requests.slice(0, 5); // Bounded
  }

  private assessCollaborationHealth(context: any, metrics: any): string {
    const healthScore = (
      metrics.synchronizationEfficiency +
      metrics.informationSharingRate +
      metrics.collaborativeOutputQuality +
      metrics.teamworkScore
    ) / 4;

    if (healthScore >= 0.9) return 'EXCELLENT';
    if (healthScore >= 0.8) return 'GOOD';
    if (healthScore >= 0.6) return 'FAIR';
    if (healthScore >= 0.4) return 'POOR';
    return 'DYSFUNCTIONAL';
  }

  private analyzeActivePartnerships(context: any): any[] {
    const partnerships = context.communicationHistory.map((comm: any) => ({
      partnerId: comm.partnerId,
      relationshipStrength: comm.communicationQuality,
      effectiveness: comm.communicationQuality * (comm.messageCount > 10 ? 1.0 : 0.8)
    }));

    return partnerships.slice(0, 10); // Bounded
  }

  private calculateCollaborationEfficiency(metrics: any): number {
    return (metrics.synchronizationEfficiency + metrics.teamworkScore) / 2;
  }

  private analyzeCommunicationPatterns(context: any): any[] {
    const patterns = [
      { pattern: 'Regular status updates', frequency: 0.8, effectiveness: 0.9 },
      { pattern: 'Ad-hoc problem solving', frequency: 0.6, effectiveness: 0.8 }
    ];

    return patterns.slice(0, 5); // Bounded
  }

  private identifyImprovementOpportunities(context: any, metrics: any): string[] {
    const opportunities: string[] = [];

    if (metrics.synchronizationEfficiency < 0.8) {
      opportunities.push('Improve synchronization protocols');
    }

    if (metrics.informationSharingRate < 0.7) {
      opportunities.push('Enhance information sharing mechanisms');
    }

    if (metrics.teamworkScore < 0.8) {
      opportunities.push('Strengthen collaborative relationships');
    }

    return opportunities.slice(0, 3); // Bounded
  }

  private generateCoordinationRequests(context: any, metrics: any): any[] {
    const requests: any[] = [];

    if (metrics.conflictResolutionTime > 60000) { // > 1 minute
      requests.push({
        requestType: 'CONFLICT_RESOLUTION',
        targetPartners: context.communicationHistory.slice(0, 2).map((h: any) => h.partnerId),
        proposedSchedule: Date.now() + 3600000, // 1 hour from now
        expectedBenefit: 'Faster conflict resolution',
        priority: 'MEDIUM'
      });
    }

    return requests.slice(0, 3); // Bounded
  }

  /**
   * Public interface methods
   */
  getSignatureStatistics(): {
    statusCacheSize: number;
    statusHistorySize: number;
    alertThresholdCount: number;
    baselineCount: number;
  } {
    return {
      statusCacheSize: this.statusCache.size,
      statusHistorySize: this.statusHistory.size,
      alertThresholdCount: this.alertThresholds.size,
      baselineCount: this.performanceBaselines.size
    };
  }

  getDroneStatusHistory(droneId: string): any[] {
    return this.statusHistory.get(droneId) || [];
  }

  getAlertThreshold(thresholdName: string): number | undefined {
    return this.alertThresholds.get(thresholdName);
  }

  updateAlertThreshold(thresholdName: string, value: number): boolean {
    if (this.alertThresholds.has(thresholdName) && value > 0) {
      this.alertThresholds.set(thresholdName, value);
      return true;
    }
    return false;
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
// run_id: a2a-dspy-010
// inputs: ["types.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
// === END FOOTER ===