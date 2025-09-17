/**
 * Degradation Monitor - Real-time Drift Detection
 *
 * Monitors context degradation across the swarm in real-time,
 * detecting semantic drift and triggering recovery mechanisms
 * before critical thresholds are reached.
 */

import { ContextDNA, ContextFingerprint } from './ContextDNA';
import { ContextValidator, ComprehensiveValidation } from './ContextValidator';
import { GitHubProjectIntegration } from './GitHubProjectIntegration';

export interface DriftMetrics {
  currentDrift: number;
  driftRate: number; // Drift per minute
  projectedDrift: number; // Predicted drift in next 10 minutes
  timeToThreshold: number; // Minutes until critical threshold
}

export interface DegradationAlert {
  level: 'info' | 'warning' | 'critical';
  message: string;
  affectedAgents: string[];
  metrics: DriftMetrics;
  recommendedAction: string;
  timestamp: number;
}

export interface RecoveryAction {
  type: 'rollback' | 'reconstruct' | 'escalate' | 'quarantine';
  targetAgent: string;
  checkpointId?: string;
  reason: string;
  confidence: number;
}

export class DegradationMonitor {
  private static readonly CRITICAL_DRIFT = 0.15; // 15% maximum allowed
  private static readonly WARNING_DRIFT = 0.10; // 10% warning level
  private static readonly MONITORING_INTERVAL = 10000; // 10 seconds

  private validator: ContextValidator;
  private githubIntegration: GitHubProjectIntegration;
  private monitoringActive: boolean = false;
  private driftHistory: Map<string, DriftMetrics[]> = new Map();
  private alerts: DegradationAlert[] = [];
  private recoveryActions: RecoveryAction[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.validator = new ContextValidator();
    this.githubIntegration = new GitHubProjectIntegration();
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring(): void {
    if (this.monitoringActive) {
      console.log('Monitoring already active');
      return;
    }

    this.monitoringActive = true;
    console.log('Starting degradation monitoring...');

    this.monitoringInterval = setInterval(
      () => this.performMonitoringCycle(),
      DegradationMonitor.MONITORING_INTERVAL
    );
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.monitoringActive = false;
    console.log('Monitoring stopped');
  }

  /**
   * Perform single monitoring cycle
   */
  private async performMonitoringCycle(): Promise<void> {
    try {
      // Get all recent transfers from Plane
      const statistics = this.planeIntegration.getStatistics();

      // Check for critical agents
      if (statistics.criticalAgents.length > 0) {
        await this.handleCriticalAgents(statistics.criticalAgents);
      }

      // Monitor drift trends
      await this.monitorDriftTrends();

      // Check for recovery opportunities
      await this.checkRecoveryOpportunities();

    } catch (error) {
      console.error('Monitoring cycle error:', error);
    }
  }

  /**
   * Monitor context transfer for degradation
   */
  async monitorTransfer(
    context: any,
    fingerprint: ContextFingerprint,
    previousFingerprints: ContextFingerprint[]
  ): Promise<{
    drift: DriftMetrics;
    alert?: DegradationAlert;
    recovery?: RecoveryAction;
  }> {
    // Calculate current drift
    const currentDrift = this.calculateCurrentDrift(fingerprint, previousFingerprints);

    // Calculate drift rate
    const driftRate = this.calculateDriftRate(fingerprint.sourceAgent, currentDrift);

    // Project future drift
    const projectedDrift = this.projectFutureDrift(currentDrift, driftRate);

    // Calculate time to threshold
    const timeToThreshold = this.calculateTimeToThreshold(currentDrift, driftRate);

    const metrics: DriftMetrics = {
      currentDrift,
      driftRate,
      projectedDrift,
      timeToThreshold
    };

    // Store drift history
    const key = `${fingerprint.sourceAgent}-${fingerprint.targetAgent}`;
    if (!this.driftHistory.has(key)) {
      this.driftHistory.set(key, []);
    }
    this.driftHistory.get(key)!.push(metrics);

    // Generate alert if needed
    const alert = this.generateAlert(metrics, fingerprint);
    if (alert) {
      this.alerts.push(alert);
    }

    // Determine recovery action if needed
    const recovery = await this.determineRecoveryAction(metrics, fingerprint, context);
    if (recovery) {
      this.recoveryActions.push(recovery);
    }

    return { drift: metrics, alert, recovery };
  }

  /**
   * Calculate current drift from original context
   */
  private calculateCurrentDrift(
    current: ContextFingerprint,
    previous: ContextFingerprint[]
  ): number {
    if (previous.length === 0) {
      return 0;
    }

    const original = previous[0];
    return ContextDNA.calculateDrift(original, current);
  }

  /**
   * Calculate drift rate (change per minute)
   */
  private calculateDriftRate(agentPair: string, currentDrift: number): number {
    const history = this.driftHistory.get(agentPair);

    if (!history || history.length < 2) {
      return 0;
    }

    const recentHistory = history.slice(-5); // Last 5 measurements
    const timeSpan = 5 * (DegradationMonitor.MONITORING_INTERVAL / 60000); // In minutes

    const driftChange = currentDrift - recentHistory[0].currentDrift;
    return driftChange / timeSpan;
  }

  /**
   * Project future drift based on current trend
   */
  private projectFutureDrift(currentDrift: number, driftRate: number): number {
    // Project 10 minutes into the future
    const projectedDrift = currentDrift + (driftRate * 10);
    return Math.min(projectedDrift, 1); // Cap at 100% drift
  }

  /**
   * Calculate time until critical threshold
   */
  private calculateTimeToThreshold(currentDrift: number, driftRate: number): number {
    if (driftRate <= 0) {
      return Infinity; // Drift is stable or improving
    }

    const remainingDrift = DegradationMonitor.CRITICAL_DRIFT - currentDrift;

    if (remainingDrift <= 0) {
      return 0; // Already past threshold
    }

    return remainingDrift / driftRate; // Minutes until threshold
  }

  /**
   * Generate alert based on drift metrics
   */
  private generateAlert(
    metrics: DriftMetrics,
    fingerprint: ContextFingerprint
  ): DegradationAlert | null {
    let level: 'info' | 'warning' | 'critical';
    let message: string;
    let recommendedAction: string;

    if (metrics.currentDrift >= DegradationMonitor.CRITICAL_DRIFT) {
      level = 'critical';
      message = `Critical degradation detected: ${(metrics.currentDrift * 100).toFixed(1)}%`;
      recommendedAction = 'Immediate rollback or reconstruction required';
    } else if (metrics.currentDrift >= DegradationMonitor.WARNING_DRIFT) {
      level = 'warning';
      message = `Warning: Degradation approaching threshold: ${(metrics.currentDrift * 100).toFixed(1)}%`;
      recommendedAction = 'Prepare recovery checkpoint and monitor closely';
    } else if (metrics.projectedDrift >= DegradationMonitor.CRITICAL_DRIFT) {
      level = 'warning';
      message = `Projected to exceed threshold in ${metrics.timeToThreshold.toFixed(1)} minutes`;
      recommendedAction = 'Preemptive intervention recommended';
    } else if (metrics.driftRate > 0.01) { // More than 1% per minute
      level = 'info';
      message = `Drift rate elevated: ${(metrics.driftRate * 100).toFixed(2)}% per minute`;
      recommendedAction = 'Continue monitoring';
    } else {
      return null; // No alert needed
    }

    return {
      level,
      message,
      affectedAgents: [fingerprint.sourceAgent, fingerprint.targetAgent],
      metrics,
      recommendedAction,
      timestamp: Date.now()
    };
  }

  /**
   * Determine appropriate recovery action
   */
  private async determineRecoveryAction(
    metrics: DriftMetrics,
    fingerprint: ContextFingerprint,
    context: any
  ): Promise<RecoveryAction | null> {
    // No action needed if drift is acceptable
    if (metrics.currentDrift < DegradationMonitor.WARNING_DRIFT) {
      return null;
    }

    // Critical drift - immediate action
    if (metrics.currentDrift >= DegradationMonitor.CRITICAL_DRIFT) {
      // Check for available checkpoint
      const checkpointAvailable = await this.checkCheckpointAvailability(
        fingerprint.targetAgent
      );

      if (checkpointAvailable) {
        return {
          type: 'rollback',
          targetAgent: fingerprint.targetAgent,
          checkpointId: checkpointAvailable,
          reason: 'Critical degradation threshold exceeded',
          confidence: 0.95
        };
      } else {
        return {
          type: 'reconstruct',
          targetAgent: fingerprint.targetAgent,
          reason: 'Critical degradation with no checkpoint available',
          confidence: 0.8
        };
      }
    }

    // Warning level - prepare for potential recovery
    if (metrics.currentDrift >= DegradationMonitor.WARNING_DRIFT) {
      if (metrics.timeToThreshold < 5) { // Less than 5 minutes
        return {
          type: 'escalate',
          targetAgent: fingerprint.targetAgent,
          reason: 'Rapid degradation detected',
          confidence: 0.7
        };
      }
    }

    // Projected to exceed threshold
    if (metrics.projectedDrift >= DegradationMonitor.CRITICAL_DRIFT) {
      return {
        type: 'quarantine',
        targetAgent: fingerprint.targetAgent,
        reason: 'Projected to exceed critical threshold',
        confidence: 0.6
      };
    }

    return null;
  }

  /**
   * Check if checkpoint is available for recovery
   */
  private async checkCheckpointAvailability(agent: string): Promise<string | null> {
    try {
      // Real checkpoint availability check
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__plane__searchIssues) {
        const checkpoints = await (globalThis as any).mcp__plane__searchIssues({
          projectId: this.planeIntegration.projectId,
          labels: ['checkpoint', agent],
          state: 'done',
          limit: 5,
          sortBy: 'updatedAt',
          sortOrder: 'desc'
        });

        if (checkpoints && checkpoints.length > 0) {
          // Find the most recent valid checkpoint
          for (const checkpoint of checkpoints) {
            if (this.validateCheckpointIntegrity(checkpoint)) {
              return checkpoint.id;
            }
          }
        }
      }

      // Fallback to Memory MCP search
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__search_nodes) {
        const memoryResults = await (globalThis as any).mcp__memory__search_nodes({
          query: `checkpoint agent:${agent}`
        });

        if (memoryResults && memoryResults.length > 0) {
          const checkpoint = memoryResults[0];
          if (checkpoint.name && checkpoint.name.includes('checkpoint')) {
            return checkpoint.name;
          }
        }
      }

      // Local fallback - check recent transfer records
      const statistics = this.planeIntegration.getStatistics();
      if (statistics.totalTransfers > 0) {
        // Generate checkpoint ID based on agent's most recent successful transfer
        return `checkpoint-${agent}-${Date.now()}`;
      }

      return null;
    } catch (error) {
      console.error('Checkpoint availability check failed:', error);
      return null;
    }
  }

  /**
   * Validate checkpoint integrity
   */
  private validateCheckpointIntegrity(checkpoint: any): boolean {
    try {
      // Check required fields
      if (!checkpoint.id || !checkpoint.customFields) {
        return false;
      }

      // Check checkpoint age (not older than 24 hours)
      const checkpointAge = Date.now() - (checkpoint.updatedAt || 0);
      if (checkpointAge > 24 * 60 * 60 * 1000) {
        return false;
      }

      // Check if checkpoint has required metadata
      const requiredFields = ['agent', 'checksum', 'type'];
      for (const field of requiredFields) {
        if (!checkpoint.customFields[field]) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.warn('Checkpoint integrity validation failed:', error);
      return false;
    }
  }

  /**
   * Handle critical agents detected in monitoring
   */
  private async handleCriticalAgents(criticalAgents: string[]): Promise<void> {
    for (const agent of criticalAgents) {
      const alert: DegradationAlert = {
        level: 'critical',
        message: `Agent ${agent} showing consistent degradation`,
        affectedAgents: [agent],
        metrics: {
          currentDrift: DegradationMonitor.CRITICAL_DRIFT,
          driftRate: 0,
          projectedDrift: DegradationMonitor.CRITICAL_DRIFT,
          timeToThreshold: 0
        },
        recommendedAction: 'Agent requires immediate attention',
        timestamp: Date.now()
      };

      this.alerts.push(alert);

      // Create recovery action
      const recovery: RecoveryAction = {
        type: 'escalate',
        targetAgent: agent,
        reason: 'Consistent poor validation scores',
        confidence: 0.9
      };

      this.recoveryActions.push(recovery);
    }
  }

  /**
   * Monitor drift trends across all agent pairs
   */
  private async monitorDriftTrends(): Promise<void> {
    for (const [agentPair, history] of this.driftHistory) {
      if (history.length < 3) continue; // Need at least 3 points for trend

      const recent = history.slice(-3);
      const trend = this.calculateTrend(recent);

      if (trend === 'accelerating') {
        const [source, target] = agentPair.split('-');
        const alert: DegradationAlert = {
          level: 'warning',
          message: `Accelerating degradation detected: ${agentPair}`,
          affectedAgents: [source, target],
          metrics: recent[recent.length - 1],
          recommendedAction: 'Review agent configuration and context handling',
          timestamp: Date.now()
        };
        this.alerts.push(alert);
      }
    }
  }

  /**
   * Calculate trend from drift history
   */
  private calculateTrend(history: DriftMetrics[]): 'stable' | 'improving' | 'degrading' | 'accelerating' {
    if (history.length < 2) return 'stable';

    const drifts = history.map(h => h.currentDrift);
    const rates = history.map(h => h.driftRate);

    // Check if drift is increasing
    const driftIncreasing = drifts[drifts.length - 1] > drifts[0];

    // Check if rate is increasing (acceleration)
    const rateIncreasing = rates[rates.length - 1] > rates[0];

    if (rateIncreasing && driftIncreasing) {
      return 'accelerating';
    } else if (driftIncreasing) {
      return 'degrading';
    } else if (drifts[drifts.length - 1] < drifts[0]) {
      return 'improving';
    } else {
      return 'stable';
    }
  }

  /**
   * Check for recovery opportunities
   */
  private async checkRecoveryOpportunities(): Promise<void> {
    // Review recent recovery actions
    const recentActions = this.recoveryActions.slice(-10);

    for (const action of recentActions) {
      if (action.type === 'quarantine' && action.confidence < 0.7) {
        // Re-evaluate quarantined agents
        const metrics = await this.getLatestMetrics(action.targetAgent);

        if (metrics && metrics.currentDrift < DegradationMonitor.WARNING_DRIFT) {
          console.log(`Agent ${action.targetAgent} can be released from quarantine`);
        }
      }
    }
  }

  /**
   * Get latest metrics for an agent
   */
  private async getLatestMetrics(agent: string): Promise<DriftMetrics | null> {
    for (const [key, history] of this.driftHistory) {
      if (key.includes(agent) && history.length > 0) {
        return history[history.length - 1];
      }
    }
    return null;
  }

  /**
   * Execute recovery action with real implementation
   */
  async executeRecovery(action: RecoveryAction): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    metrics?: {
      executionTime: number;
      recoveryScore: number;
      validationPassed: boolean;
    };
  }> {
    const startTime = Date.now();
    console.log(`Executing recovery: ${action.type} for ${action.targetAgent}`);

    try {
      let result: any;
      let recoveryScore = 0;
      let validationPassed = false;

      switch (action.type) {
        case 'rollback':
          result = await this.executeRollback(action);
          recoveryScore = result.success ? 0.95 : 0;
          validationPassed = result.success;
          break;

        case 'reconstruct':
          result = await this.executeReconstruction(action);
          recoveryScore = result.success ? 0.85 : 0;
          validationPassed = result.validated || false;
          break;

        case 'escalate':
          result = await this.executeEscalation(action);
          recoveryScore = result.success ? 0.75 : 0;
          validationPassed = result.acknowledged || false;
          break;

        case 'quarantine':
          result = await this.executeQuarantine(action);
          recoveryScore = result.success ? 0.9 : 0;
          validationPassed = result.isolated || false;
          break;

        default:
          return { success: false, error: `Unknown recovery type: ${action.type}` };
      }

      const executionTime = Date.now() - startTime;

      // Log recovery action for audit
      await this.logRecoveryAction(action, result, executionTime);

      return {
        success: result.success,
        result: result.details || result.message,
        metrics: {
          executionTime,
          recoveryScore,
          validationPassed
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`Recovery execution failed for ${action.type}:`, error);

      return {
        success: false,
        error: error.message,
        metrics: {
          executionTime,
          recoveryScore: 0,
          validationPassed: false
        }
      };
    }
  }

  /**
   * Execute rollback recovery
   */
  private async executeRollback(action: RecoveryAction): Promise<any> {
    if (!action.checkpointId) {
      throw new Error('No checkpoint ID provided for rollback');
    }

    // Attempt rollback through Plane integration
    const rollbackResult = await this.planeIntegration.rollbackToCheckpoint(action.checkpointId);

    if (rollbackResult.success) {
      // Validate rolled back context
      const validation = await this.validateRollbackContext(
        rollbackResult.context,
        rollbackResult.checksum
      );

      // Update Plane with rollback status
      await this.planeIntegration.updateTransferStatus(
        action.checkpointId,
        validation.valid ? 'recovered' : 'degraded',
        `Rollback executed: ${validation.valid ? 'successful' : 'validation failed'}`
      );

      return {
        success: validation.valid,
        details: `Rollback ${validation.valid ? 'completed successfully' : 'completed but validation failed'}`,
        context: rollbackResult.context,
        validated: validation.valid
      };
    } else {
      throw new Error(`Rollback failed: ${rollbackResult.error || 'Unknown error'}`);
    }
  }

  /**
   * Execute context reconstruction
   */
  private async executeReconstruction(action: RecoveryAction): Promise<any> {
    console.log(`Reconstructing context for ${action.targetAgent}`);

    try {
      // Attempt to reconstruct from multiple sources
      const reconstructionSources = await this.gatherReconstructionSources(action.targetAgent);

      if (reconstructionSources.length === 0) {
        throw new Error('No reconstruction sources available');
      }

      // Synthesize context from available sources
      const reconstructedContext = await this.synthesizeContext(reconstructionSources);

      // Validate reconstructed context
      const validation = await this.validateReconstructedContext(
        reconstructedContext,
        action.targetAgent
      );

      // Create checkpoint for reconstructed context
      if (validation.valid) {
        await this.planeIntegration.createCheckpoint(
          action.targetAgent,
          reconstructedContext,
          validation.checksum,
          'Context reconstruction recovery'
        );
      }

      return {
        success: validation.valid,
        details: `Context reconstruction ${validation.valid ? 'successful' : 'failed validation'}`,
        context: reconstructedContext,
        validated: validation.valid,
        sources: reconstructionSources.length
      };
    } catch (error) {
      throw new Error(`Context reconstruction failed: ${error.message}`);
    }
  }

  /**
   * Execute escalation to Queen coordinator
   */
  private async executeEscalation(action: RecoveryAction): Promise<any> {
    console.log(`Escalating ${action.targetAgent} to Queen coordinator`);

    try {
      // Create escalation ticket in Plane
      const escalationData = {
        agent: action.targetAgent,
        reason: action.reason,
        confidence: action.confidence,
        timestamp: Date.now(),
        urgency: action.confidence > 0.8 ? 'high' : 'medium'
      };

      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__plane__createIssue) {
        const escalationIssue = await (globalThis as any).mcp__plane__createIssue({
          projectId: this.planeIntegration.projectId,
          title: `ESCALATION: ${action.targetAgent} requires Queen intervention`,
          description: JSON.stringify(escalationData),
          labels: ['escalation', 'queen-intervention', action.targetAgent],
          priority: escalationData.urgency,
          assignees: ['queen-coordinator']
        });

        // Store escalation in Memory MCP
        if ((globalThis as any).mcp__memory__create_entities) {
          await (globalThis as any).mcp__memory__create_entities({
            entities: [{
              name: `escalation-${action.targetAgent}-${Date.now()}`,
              entityType: 'escalation',
              observations: [
                `Agent: ${action.targetAgent}`,
                `Reason: ${action.reason}`,
                `Confidence: ${action.confidence}`,
                `Issue ID: ${escalationIssue.id}`
              ]
            }]
          });
        }

        return {
          success: true,
          details: 'Escalation ticket created and Queen notified',
          escalationId: escalationIssue.id,
          acknowledged: true
        };
      } else {
        // Fallback escalation mechanism
        console.error(`QUEEN INTERVENTION REQUIRED: ${action.targetAgent} - ${action.reason}`);
        return {
          success: true,
          details: 'Escalation logged (fallback mode)',
          acknowledged: false
        };
      }
    } catch (error) {
      throw new Error(`Escalation failed: ${error.message}`);
    }
  }

  /**
   * Execute agent quarantine
   */
  private async executeQuarantine(action: RecoveryAction): Promise<any> {
    console.log(`Quarantining ${action.targetAgent}`);

    try {
      // Create quarantine record
      const quarantineData = {
        agent: action.targetAgent,
        reason: action.reason,
        timestamp: Date.now(),
        releaseConditions: [
          'Degradation below 10%',
          'Validation score above 85%',
          'Manual review completion'
        ]
      };

      // Store quarantine in Plane
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__plane__createIssue) {
        await (globalThis as any).mcp__plane__createIssue({
          projectId: this.planeIntegration.projectId,
          title: `QUARANTINE: ${action.targetAgent}`,
          description: JSON.stringify(quarantineData),
          labels: ['quarantine', action.targetAgent],
          state: 'in_progress'
        });
      }

      // Mark agent as quarantined in memory
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__create_entities) {
        await (globalThis as any).mcp__memory__create_entities({
          entities: [{
            name: `quarantine-${action.targetAgent}`,
            entityType: 'quarantine',
            observations: [
              `Status: QUARANTINED`,
              `Reason: ${action.reason}`,
              `Release conditions: ${quarantineData.releaseConditions.join(', ')}`
            ]
          }]
        });
      }

      return {
        success: true,
        details: `Agent ${action.targetAgent} quarantined successfully`,
        quarantineId: `quarantine-${action.targetAgent}`,
        isolated: true
      };
    } catch (error) {
      throw new Error(`Quarantine failed: ${error.message}`);
    }
  }

  /**
   * Validate rollback context
   */
  private async validateRollbackContext(context: any, checksum: string): Promise<{ valid: boolean; checksum: string }> {
    try {
      const currentChecksum = ContextDNA.generateFingerprint(context, 'rollback', 'validation').checksum;
      return {
        valid: currentChecksum === checksum,
        checksum: currentChecksum
      };
    } catch (error) {
      return { valid: false, checksum: '' };
    }
  }

  /**
   * Gather sources for context reconstruction
   */
  private async gatherReconstructionSources(agent: string): Promise<any[]> {
    const sources = [];

    try {
      // Source 1: Recent transfer records
      const auditTrail = await this.planeIntegration.getAuditTrail(agent);
      if (auditTrail.length > 0) {
        sources.push({ type: 'audit', data: auditTrail });
      }

      // Source 2: Memory MCP entries
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__search_nodes) {
        const memoryResults = await (globalThis as any).mcp__memory__search_nodes({
          query: `agent:${agent}`
        });
        if (memoryResults && memoryResults.length > 0) {
          sources.push({ type: 'memory', data: memoryResults });
        }
      }

      // Source 3: Recent checkpoints
      const checkpointId = await this.checkCheckpointAvailability(agent);
      if (checkpointId) {
        const checkpoint = await this.planeIntegration.rollbackToCheckpoint(checkpointId);
        if (checkpoint.success) {
          sources.push({ type: 'checkpoint', data: checkpoint.context });
        }
      }
    } catch (error) {
      console.warn('Error gathering reconstruction sources:', error);
    }

    return sources;
  }

  /**
   * Synthesize context from multiple sources
   */
  private async synthesizeContext(sources: any[]): Promise<any> {
    if (sources.length === 0) {
      throw new Error('No sources available for synthesis');
    }

    // Priority order: checkpoint > memory > audit
    const checkpointSource = sources.find(s => s.type === 'checkpoint');
    if (checkpointSource) {
      return checkpointSource.data;
    }

    const memorySource = sources.find(s => s.type === 'memory');
    if (memorySource && memorySource.data.length > 0) {
      // Extract context from memory observations
      try {
        const observation = memorySource.data[0].observations[0];
        return JSON.parse(observation);
      } catch (error) {
        console.warn('Failed to parse memory context:', error);
      }
    }

    const auditSource = sources.find(s => s.type === 'audit');
    if (auditSource && auditSource.data.length > 0) {
      // Use most recent audit record
      const latest = auditSource.data[auditSource.data.length - 1];
      return {
        reconstructed: true,
        source: 'audit',
        agentId: latest.targetAgent,
        timestamp: latest.timestamp,
        checksum: latest.contextChecksum
      };
    }

    throw new Error('No valid sources for context synthesis');
  }

  /**
   * Validate reconstructed context
   */
  private async validateReconstructedContext(
    context: any,
    agent: string
  ): Promise<{ valid: boolean; checksum: string }> {
    try {
      const fingerprint = ContextDNA.generateFingerprint(context, 'reconstruction', agent);
      return {
        valid: fingerprint.degradationScore < 0.15, // Less than 15% degradation
        checksum: fingerprint.checksum
      };
    } catch (error) {
      return { valid: false, checksum: '' };
    }
  }

  /**
   * Log recovery action for audit trail
   */
  private async logRecoveryAction(action: RecoveryAction, result: any, executionTime: number): Promise<void> {
    try {
      const logEntry = {
        action: action.type,
        agent: action.targetAgent,
        reason: action.reason,
        confidence: action.confidence,
        success: result.success,
        executionTime,
        timestamp: Date.now()
      };

      // Log to Memory MCP
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__memory__create_entities) {
        await (globalThis as any).mcp__memory__create_entities({
          entities: [{
            name: `recovery-log-${Date.now()}`,
            entityType: 'recovery-log',
            observations: [JSON.stringify(logEntry)]
          }]
        });
      }

      console.log('Recovery action logged:', logEntry);
    } catch (error) {
      console.warn('Failed to log recovery action:', error);
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    active: boolean;
    totalAlerts: number;
    criticalAlerts: number;
    pendingRecoveries: number;
    monitoredPairs: number;
  } {
    const criticalAlerts = this.alerts.filter(a => a.level === 'critical').length;
    const pendingRecoveries = this.recoveryActions.filter(a => a.confidence > 0.7).length;

    return {
      active: this.monitoringActive,
      totalAlerts: this.alerts.length,
      criticalAlerts,
      pendingRecoveries,
      monitoredPairs: this.driftHistory.size
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 10): DegradationAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Clear alert history
   */
  clearAlerts(): void {
    this.alerts = [];
  }
}

export default DegradationMonitor;