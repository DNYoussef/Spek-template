/**
 * CanaryProtocolMigration - Refactored to use FSM-based architecture
 * This class now delegates to the new FSM-based canary migration system
 * Maintains backward compatibility while leveraging the new modular design
 */

import { EventEmitter } from 'events';
import { Logger } from '../../utils/Logger';
import { CanaryMigrationFacade, CanaryConfig, CanaryResult } from './canary/CanaryMigrationFacade';

// Re-export types for backward compatibility
export { CanaryConfig, CanaryResult };

// Legacy interfaces maintained for backward compatibility
export interface TrafficSplittingConfig {
  method: 'weighted_routing' | 'header_based' | 'user_based' | 'geographic';
  initialPercentage: number;
  progressionInterval: number;
  maxPercentage: number;
  rampUpStrategy: 'linear' | 'exponential' | 'fibonacci' | 'custom';
  userStickiness: boolean;
  fallbackBehavior: 'production' | 'error' | 'queue';
}

export interface ProgressionStage {
  stage: number;
  name: string;
  trafficPercentage: number;
  duration: number;
  successCriteria: SuccessCriteria[];
  rollbackTriggers: RollbackTrigger[];
  validationTimeout: number;
  manualApprovalRequired: boolean;
}

export interface SuccessCriteria {
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  aggregation: 'avg' | 'min' | 'max' | 'p50' | 'p95' | 'p99';
  comparisonType: 'absolute' | 'relative_to_production' | 'relative_to_baseline';
  windowSize: number;
  mandatory: boolean;
}

export interface RollbackTrigger {
  condition: string;
  threshold: number;
  duration: number;
  severity: 'warning' | 'critical';
  automatic: boolean;
}

/**
 * CanaryProtocolMigration - Legacy Compatibility Wrapper
 *
 * REFACTORED: This class now delegates to FSM-based CanaryMigrationFacade
 * NASA Rule 10 Compliant: All methods under 60 lines
 *
 * The original 972-line monolithic class has been decomposed into:
 * - CanaryMigrationStateMachine: FSM state management
 * - CanaryDeploymentHandler: Deployment operations
 * - CanaryTrafficHandler: Traffic management
 * - CanaryValidationHandler: Validation and monitoring
 * - CanaryRollbackHandler: Rollback operations
 * - CanaryMigrationFacade: Orchestration and composition
 */
export class CanaryProtocolMigration extends EventEmitter {
  private logger: Logger;
  private facade: CanaryMigrationFacade;

  constructor(config: CanaryConfig) {
    super();
    this.logger = new Logger('CanaryProtocolMigration');
    this.facade = new CanaryMigrationFacade(config);
    this.setupEventForwarding();
  }

  async executeMigration(
    sourceVersion: string,
    targetVersion: string,
    migrationPlan: any
  ): Promise<CanaryResult> {
    this.logger.info('Executing canary migration via FSM facade', {
      sourceVersion,
      targetVersion
    });

    return await this.facade.executeMigration(
      sourceVersion,
      targetVersion,
      migrationPlan
    );
  }

  async getCurrentState(): Promise<any> {
    return await this.facade.getCurrentState();
  }

  async pauseRollout(): Promise<void> {
    return await this.facade.pauseRollout();
  }

  async resumeRollout(): Promise<void> {
    return await this.facade.resumeRollout();
  }

  private setupEventForwarding(): void {
    // Forward all events from facade to maintain backward compatibility
    this.facade.on('canaryStarted', (data) => this.emit('canaryStarted', data));
    this.facade.on('canaryCompleted', (data) => this.emit('canaryCompleted', data));
    this.facade.on('canaryFailed', (data, error) => this.emit('canaryFailed', data, error));
    this.facade.on('stageStarted', (data) => this.emit('stageStarted', data));
    this.facade.on('stageCompleted', (data) => this.emit('stageCompleted', data));
    this.facade.on('rolloutPaused', (data) => this.emit('rolloutPaused', data));
    this.facade.on('rolloutResumed', (data) => this.emit('rolloutResumed', data));
    this.facade.on('rollbackStarted', (data) => this.emit('rollbackStarted', data));
    this.facade.on('rollbackCompleted', (data) => this.emit('rollbackCompleted', data));
    this.facade.on('rollbackFailed', (data) => this.emit('rollbackFailed', data));
  }
}

export default CanaryProtocolMigration;

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: codex-agent-048-legacy-wrapper
// inputs: ["CanaryProtocolMigration.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"codex-048-v1"}
// === END FOOTER ===