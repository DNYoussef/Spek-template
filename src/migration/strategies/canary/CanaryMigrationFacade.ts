/**
 * Canary Migration Facade
 * Main entry point for FSM-based canary protocol migration
 * Replaces the monolithic CanaryProtocolMigration class
 */

import { EventEmitter } from 'events';
import { Logger } from '../../../utils/Logger';
import { CanaryMigrationStateMachine } from './CanaryMigrationStateMachine';
import {
  CanaryMigrationStates,
  CanaryMigrationEvents,
  CanaryMigrationContext
} from './CanaryMigrationStates';
import { CanaryDeploymentHandler } from './handlers/CanaryDeploymentHandler';
import { CanaryTrafficHandler } from './handlers/CanaryTrafficHandler';
import { CanaryValidationHandler } from './handlers/CanaryValidationHandler';
import { CanaryRollbackHandler } from './handlers/CanaryRollbackHandler';

export interface CanaryConfig {
  canaryEnvironment: any;
  productionEnvironment: any;
  trafficSplitting: any;
  progressionStages: any[];
  validationRules: any[];
  rollbackPolicy: any;
  observabilityConfig: any;
}

export interface CanaryResult {
  success: boolean;
  completedStages: number;
  totalStages: number;
  finalTrafficPercentage: number;
  migrationTime: number;
  rollbackExecuted: boolean;
  stageResults: any[];
  metrics: any;
  insights: any[];
}

export class CanaryMigrationFacade extends EventEmitter {
  private logger: Logger;
  private config: CanaryConfig;
  private stateMachine: CanaryMigrationStateMachine;
  private deploymentHandler: CanaryDeploymentHandler;
  private trafficHandler: CanaryTrafficHandler;
  private validationHandler: CanaryValidationHandler;
  private rollbackHandler: CanaryRollbackHandler;

  constructor(config: CanaryConfig) {
    super();
    this.logger = new Logger('CanaryMigrationFacade');
    this.config = config;
    this.initializeHandlers();
    this.initializeStateMachine();
  }

  async executeMigration(
    sourceVersion: string,
    targetVersion: string,
    migrationPlan: any
  ): Promise<CanaryResult> {
    const startTime = Date.now();
    const deploymentId = this.generateDeploymentId();

    this.logger.info('Starting canary migration', {
      deploymentId,
      sourceVersion,
      targetVersion
    });

    const context: CanaryMigrationContext = {
      deploymentId,
      sourceVersion,
      targetVersion,
      currentStage: 0,
      totalStages: this.config.progressionStages.length,
      trafficPercentage: 0,
      config: this.config,
      stageResults: [],
      metrics: {}
    };

    this.stateMachine.updateContext(context);

    try {
      await this.stateMachine.processEvent(CanaryMigrationEvents.START_MIGRATION);
      await this.executeMigrationPipeline();
      
      const result = this.buildSuccessResult(startTime);
      this.emit('canaryCompleted', result);
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Migration failed', { error: errorMessage });
      const result = await this.handleMigrationFailure(error, startTime);
      this.emit('canaryFailed', result, error);
      return result;
    }
  }

  async getCurrentState(): Promise<any> {
    const state = this.stateMachine.getCurrentState();
    const context = this.stateMachine.getContext();
    
    return {
      state,
      currentStage: context.currentStage,
      totalStages: context.totalStages,
      trafficPercentage: context.trafficPercentage,
      deploymentId: context.deploymentId
    };
  }

  async pauseRollout(): Promise<void> {
    this.logger.info('Pausing canary rollout');
    await this.stateMachine.processEvent(CanaryMigrationEvents.PAUSE_REQUESTED);
    this.emit('rolloutPaused', await this.getCurrentState());
  }

  async resumeRollout(): Promise<void> {
    this.logger.info('Resuming canary rollout');
    await this.stateMachine.processEvent(CanaryMigrationEvents.RESUME_REQUESTED);
    this.emit('rolloutResumed', await this.getCurrentState());
  }

  private initializeHandlers(): void {
    this.deploymentHandler = new CanaryDeploymentHandler();
    this.trafficHandler = new CanaryTrafficHandler();
    this.validationHandler = new CanaryValidationHandler();
    this.rollbackHandler = new CanaryRollbackHandler();
  }

  private initializeStateMachine(): void {
    this.stateMachine = new CanaryMigrationStateMachine({});
    
    // Subscribe to state machine events
    this.stateMachine.on('stateChanged', (event) => {
      this.logger.debug('State machine transition', event);
      this.emit('stateChanged', event);
    });
  }

  private async executeMigrationPipeline(): Promise<void> {
    // Deploy to canary
    await this.executeDeploymentPhase();
    
    // Initialize traffic splitting
    await this.executeTrafficInitializationPhase();
    
    // Progressive rollout
    await this.executeProgressiveRolloutPhase();
    
    // Final rollout
    await this.executeFinalRolloutPhase();
  }

  private async executeDeploymentPhase(): Promise<void> {
    const context = this.stateMachine.getContext();
    
    const deploymentConfig = {
      environment: this.config.canaryEnvironment,
      version: context.targetVersion,
      migrationPlan: {},
      healthCheckConfig: {
        endpoints: ['health'],
        timeout: 30000,
        retries: 3,
        intervalMs: 5000
      }
    };
    
    const result = await this.deploymentHandler.deployToCanary(
      deploymentConfig,
      context
    );
    
    if (result.success) {
      await this.stateMachine.processEvent(CanaryMigrationEvents.CANARY_DEPLOYED);
    } else {
      throw new Error('Canary deployment failed');
    }
  }

  private async executeTrafficInitializationPhase(): Promise<void> {
    const context = this.stateMachine.getContext();
    
    await this.trafficHandler.initializeTrafficSplitting(
      this.config.trafficSplitting,
      context
    );
    
    await this.stateMachine.processEvent(CanaryMigrationEvents.TRAFFIC_INITIALIZED);
  }

  private async executeProgressiveRolloutPhase(): Promise<void> {
    for (const stage of this.config.progressionStages) {
      await this.executeStage(stage);
    }
  }

  private async executeStage(stage: any): Promise<void> {
    const context = this.stateMachine.getContext();
    
    await this.stateMachine.processEvent(CanaryMigrationEvents.STAGE_STARTED);
    
    // Progress traffic
    await this.trafficHandler.progressToPercentage(
      stage.trafficPercentage,
      this.config.trafficSplitting
    );
    
    // Validate stage
    const validationResults = await this.validationHandler.validateStage(
      stage,
      context
    );
    
    const stageSuccess = await this.validationHandler.evaluateStageSuccess(
      stage,
      validationResults
    );
    
    if (stageSuccess) {
      await this.stateMachine.processEvent(CanaryMigrationEvents.STAGE_PASSED);
    } else {
      await this.stateMachine.processEvent(CanaryMigrationEvents.STAGE_FAILED);
      throw new Error(`Stage ${stage.stage} failed validation`);
    }
    
    // Update context
    context.currentStage++;
    context.trafficPercentage = stage.trafficPercentage;
    this.stateMachine.updateContext(context);
  }

  private async executeFinalRolloutPhase(): Promise<void> {
    await this.stateMachine.processEvent(CanaryMigrationEvents.FINAL_ROLLOUT_READY);
    
    // Progress to 100%
    await this.trafficHandler.progressToPercentage(
      100,
      this.config.trafficSplitting
    );
    
    // Run comprehensive validation
    const validation = await this.validationHandler.runComprehensiveValidation();
    
    if (validation.passed) {
      await this.stateMachine.processEvent(CanaryMigrationEvents.PROMOTION_COMPLETED);
      await this.stateMachine.processEvent(CanaryMigrationEvents.MIGRATION_COMPLETED);
    } else {
      throw new Error(`Final validation failed: ${validation.reason}`);
    }
  }

  private async handleMigrationFailure(
    error: Error,
    startTime: number
  ): Promise<CanaryResult> {
    const context = this.stateMachine.getContext();
    
    await this.stateMachine.processEvent(
      CanaryMigrationEvents.ROLLBACK_TRIGGERED,
      { error }
    );
    
    const rollbackResult = await this.rollbackHandler.executeRollback(
      context.deploymentId,
      error,
      this.config.rollbackPolicy,
      context
    );
    
    if (rollbackResult.success) {
      await this.stateMachine.processEvent(CanaryMigrationEvents.ROLLBACK_COMPLETED);
    } else {
      await this.stateMachine.processEvent(CanaryMigrationEvents.ROLLBACK_FAILED);
    }
    
    return {
      success: false,
      completedStages: context.currentStage,
      totalStages: context.totalStages,
      finalTrafficPercentage: context.trafficPercentage,
      migrationTime: Date.now() - startTime,
      rollbackExecuted: rollbackResult.success,
      stageResults: context.stageResults,
      metrics: context.metrics,
      insights: []
    };
  }

  private buildSuccessResult(startTime: number): CanaryResult {
    const context = this.stateMachine.getContext();
    
    return {
      success: true,
      completedStages: context.totalStages,
      totalStages: context.totalStages,
      finalTrafficPercentage: 100,
      migrationTime: Date.now() - startTime,
      rollbackExecuted: false,
      stageResults: context.stageResults,
      metrics: context.metrics,
      insights: []
    };
  }

  private generateDeploymentId(): string {
    return `canary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: codex-agent-048-migration-facade
// inputs: ["none"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"codex-048-v1"}
// === END FOOTER ===