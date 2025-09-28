/**
 * Recovery Executor Component
 * Handles execution of recovery actions and context reconstruction
 */

import {
  RecoveryAction,
  RecoveryResult,
  RecoveryType,
  DriftMetrics,
  MonitoringConfig,
  IRecoveryExecutor
} from '../types/DegradationTypes';
import { ContextFingerprint } from '../../ContextDNA';
import { ValidationEngine } from './ValidationEngine';
import { GitHubProjectIntegration } from '../../GitHubProjectIntegration';

export class RecoveryExecutor implements IRecoveryExecutor {
  private validationEngine: ValidationEngine;
  private githubIntegration: GitHubProjectIntegration;

  constructor() {
    this.validationEngine = new ValidationEngine();
    this.githubIntegration = new GitHubProjectIntegration();
  }

  async executeRecovery(action: RecoveryAction): Promise<RecoveryResult> {
    const startTime = Date.now();
    console.log(`Executing recovery: ${action.type} for ${action.targetAgent}`);

    try {
      let result: any;
      let recoveryScore = 0;
      let validationPassed = false;

      switch (action.type) {
        case RecoveryType.ROLLBACK:
          result = await this.executeRollback(action);
          recoveryScore = result.success ? 0.95 : 0;
          validationPassed = result.success;
          break;

        case RecoveryType.RECONSTRUCT:
          result = await this.executeReconstruction(action);
          recoveryScore = result.success ? 0.85 : 0;
          validationPassed = result.validated || false;
          break;

        case RecoveryType.ESCALATE:
          result = await this.executeEscalation(action);
          recoveryScore = result.success ? 0.75 : 0;
          validationPassed = result.acknowledged || false;
          break;

        case RecoveryType.QUARANTINE:
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

  async determineRecoveryAction(
    metrics: DriftMetrics,
    fingerprint: ContextFingerprint,
    context: any,
    config: MonitoringConfig
  ): Promise<RecoveryAction | null> {
    // No action needed if drift is acceptable
    if (metrics.currentDrift < config.warningDrift) {
      return null;
    }

    // Critical drift - immediate action required
    if (metrics.currentDrift >= config.criticalDrift) {
      return await this.selectCriticalRecoveryAction(fingerprint, metrics);
    }

    // Warning level - prepare for potential recovery
    if (metrics.currentDrift >= config.warningDrift) {
      return await this.selectWarningRecoveryAction(fingerprint, metrics);
    }

    // Projected to exceed threshold
    if (metrics.projectedDrift >= config.criticalDrift) {
      return {
        type: RecoveryType.QUARANTINE,
        targetAgent: fingerprint.targetAgent,
        reason: 'Projected to exceed critical threshold',
        confidence: 0.6
      };
    }

    return null;
  }

  private async selectCriticalRecoveryAction(
    fingerprint: ContextFingerprint,
    metrics: DriftMetrics
  ): Promise<RecoveryAction> {
    // Check for available checkpoint
    const checkpointId = await this.validationEngine.checkCheckpointAvailability(
      fingerprint.targetAgent
    );

    if (checkpointId) {
      return {
        type: RecoveryType.ROLLBACK,
        targetAgent: fingerprint.targetAgent,
        checkpointId,
        reason: 'Critical degradation threshold exceeded',
        confidence: 0.95
      };
    } else {
      return {
        type: RecoveryType.RECONSTRUCT,
        targetAgent: fingerprint.targetAgent,
        reason: 'Critical degradation with no checkpoint available',
        confidence: 0.8
      };
    }
  }

  private async selectWarningRecoveryAction(
    fingerprint: ContextFingerprint,
    metrics: DriftMetrics
  ): Promise<RecoveryAction | null> {
    if (metrics.timeToThreshold < 5) { // Less than 5 minutes
      return {
        type: RecoveryType.ESCALATE,
        targetAgent: fingerprint.targetAgent,
        reason: 'Rapid degradation detected',
        confidence: 0.7
      };
    }
    return null;
  }

  private async executeRollback(action: RecoveryAction): Promise<any> {
    if (!action.checkpointId) {
      throw new Error('No checkpoint ID provided for rollback');
    }

    try {
      // Attempt rollback through GitHub integration
      const rollbackResult = await this.githubIntegration.rollbackToCheckpoint(
        action.checkpointId
      );

      if (rollbackResult.success) {
        // Validate rolled back context
        const validation = await this.validationEngine.validateRollback(
          rollbackResult.context,
          rollbackResult.checksum
        );

        // Update status
        await this.githubIntegration.updateTransferStatus(
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
    } catch (error) {
      throw new Error(`Rollback execution failed: ${error.message}`);
    }
  }

  private async executeReconstruction(action: RecoveryAction): Promise<any> {
    console.log(`Reconstructing context for ${action.targetAgent}`);

    try {
      // Gather reconstruction sources
      const sources = await this.gatherReconstructionSources(action.targetAgent);

      if (sources.length === 0) {
        throw new Error('No reconstruction sources available');
      }

      // Synthesize context from available sources
      const reconstructedContext = await this.synthesizeContext(sources);

      // Validate reconstructed context
      const validation = await this.validationEngine.validateReconstruction(
        reconstructedContext,
        action.targetAgent
      );

      // Create checkpoint for reconstructed context if valid
      if (validation.valid) {
        await this.githubIntegration.createCheckpoint(
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
        sources: sources.length
      };
    } catch (error) {
      throw new Error(`Context reconstruction failed: ${error.message}`);
    }
  }

  private async executeEscalation(action: RecoveryAction): Promise<any> {
    console.log(`Escalating ${action.targetAgent} to Queen coordinator`);

    try {
      const escalationData = {
        agent: action.targetAgent,
        reason: action.reason,
        confidence: action.confidence,
        timestamp: Date.now(),
        urgency: action.confidence > 0.8 ? 'high' : 'medium'
      };

      // Create escalation in Plane if available
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__plane__createIssue) {
        const escalationIssue = await (globalThis as any).mcp__plane__createIssue({
          projectId: this.githubIntegration.projectId,
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

  private async executeQuarantine(action: RecoveryAction): Promise<any> {
    console.log(`Quarantining ${action.targetAgent}`);

    try {
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

      // Store quarantine in Plane if available
      if (typeof globalThis !== 'undefined' && (globalThis as any).mcp__plane__createIssue) {
        await (globalThis as any).mcp__plane__createIssue({
          projectId: this.githubIntegration.projectId,
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

  private async gatherReconstructionSources(agent: string): Promise<any[]> {
    const sources = [];

    try {
      // Source 1: Recent transfer records
      const auditTrail = await this.githubIntegration.getAuditTrail(agent);
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
      const checkpointId = await this.validationEngine.checkCheckpointAvailability(agent);
      if (checkpointId) {
        const checkpoint = await this.githubIntegration.rollbackToCheckpoint(checkpointId);
        if (checkpoint.success) {
          sources.push({ type: 'checkpoint', data: checkpoint.context });
        }
      }
    } catch (error) {
      console.warn('Error gathering reconstruction sources:', error);
    }

    return sources;
  }

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
      try {
        const observation = memorySource.data[0].observations[0];
        return JSON.parse(observation);
      } catch (error) {
        console.warn('Failed to parse memory context:', error);
      }
    }

    const auditSource = sources.find(s => s.type === 'audit');
    if (auditSource && auditSource.data.length > 0) {
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

  private async logRecoveryAction(
    action: RecoveryAction,
    result: any,
    executionTime: number
  ): Promise<void> {
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
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T15:53:52-04:00 | codex@sonnet-4 | Create RecoveryExecutor component | RecoveryExecutor.ts | OK | Recovery action execution, context reconstruction, escalation | 0.03 | 5e8b9c2 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: deg-recovery-001
- inputs: ["RecoveryExecutor requirements"]
- tools_used: ["MultiEdit"]
- versions: {"model":"sonnet-4","prompt":"nasa-rule-10"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->