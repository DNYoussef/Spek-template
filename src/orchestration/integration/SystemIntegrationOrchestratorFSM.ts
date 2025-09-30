/**
 * SystemIntegrationOrchestratorFSM - FSM-First Refactored Version
 * Master controller using FSM components for integration orchestration
 * NASA Rule 10 Compliant - Under 500 lines with backward compatibility
 */

import { EventEmitter } from 'events';
import { ComponentDependencyResolver } from './ComponentDependencyResolver';
import { IntegrationSequencer } from './IntegrationSequencer';
import { ConflictResolutionEngine } from './ConflictResolutionEngine';
import { IntegrationValidator } from './IntegrationValidator';

// FSM Components
import { TransitionHub } from './fsm/TransitionHub';
import { IntegrationPlanManager } from './fsm/components/IntegrationPlanManager';
import { IntegrationExecutor } from './fsm/components/IntegrationExecutor';
import { IntegrationValidatorFSM } from './fsm/components/IntegrationValidatorFSM';
import { IntegrationMonitor } from './fsm/components/IntegrationMonitor';
import { ComponentIntegrator } from './fsm/components/ComponentIntegrator';
import { RollbackManager } from './fsm/components/RollbackManager';

// Types
import {
  IntegrationState,
  IntegrationEvent,
  IntegrationFSMContext,
  IntegrationPlan,
  IntegrationExecution,
  IntegrationOptions,
  ValidationResult,
  RollbackResult
} from './fsm/types/IntegrationFSMTypes';

export class SystemIntegrationOrchestratorFSM extends EventEmitter {
  // FSM Core
  private transitionHub: TransitionHub;
  private context: IntegrationFSMContext;

  // FSM Components
  private planManager: IntegrationPlanManager;
  private executor: IntegrationExecutor;
  private validator: IntegrationValidatorFSM;
  private monitor: IntegrationMonitor;
  private componentIntegrator: ComponentIntegrator;
  private rollbackManager: RollbackManager;

  // Legacy components for backward compatibility
  private dependencyResolver: ComponentDependencyResolver;
  private sequencer: IntegrationSequencer;
  private conflictEngine: ConflictResolutionEngine;
  private legacyValidator: IntegrationValidator;

  // Execution tracking
  private integrationPlans: Map<string, IntegrationPlan> = new Map();
  private activeExecutions: Map<string, IntegrationExecution> = new Map();
  private executionHistory: IntegrationExecution[] = [];

  // Configuration
  private readonly MAX_CONCURRENT_INTEGRATIONS = 3;

  constructor(
    dependencyResolver: ComponentDependencyResolver,
    sequencer: IntegrationSequencer,
    conflictEngine: ConflictResolutionEngine,
    validator: IntegrationValidator
  ) {
    super();

    // Store legacy components
    this.dependencyResolver = dependencyResolver;
    this.sequencer = sequencer;
    this.conflictEngine = conflictEngine;
    this.legacyValidator = validator;

    // Initialize FSM components
    this.planManager = new IntegrationPlanManager(dependencyResolver, conflictEngine);
    this.executor = new IntegrationExecutor();
    this.validator = new IntegrationValidatorFSM(validator);
    this.monitor = new IntegrationMonitor();
    this.componentIntegrator = new ComponentIntegrator();
    this.rollbackManager = new RollbackManager();

    // Initialize FSM context
    this.context = {
      currentExecution: null,
      currentPlan: null,
      currentPhase: null,
      currentPhaseIndex: 0,
      totalPhases: 0,
      activeExecutions: this.activeExecutions,
      planValidated: false,
      qualityGatesPassed: false,
      rollbackInProgress: false,
      cancellationFlag: false,
      healthScore: 1.0,
      validationResult: null,
      rollbackResult: null,
      cleanupResult: null,
      errorLogged: false,
      allPhasesCompleted: false
    };

    // Initialize FSM TransitionHub
    this.transitionHub = new TransitionHub(this.context);

    this.initializeComponents();
    this.setupEventHandlers();
  }

  /**
   * Execute integration plan - Main public API (backward compatible)
   */
  async executeIntegrationPlan(
    planId: string,
    options: IntegrationOptions = {}
  ): Promise<IntegrationExecution> {
    // Update context with active executions
    this.transitionHub.updateContext({ activeExecutions: this.activeExecutions });

    // Check if we can start integration
    if (!this.transitionHub.canProcessEvent(IntegrationEvent.START_INTEGRATION)) {
      throw new Error(`Cannot start integration: maximum concurrent integrations reached (${this.MAX_CONCURRENT_INTEGRATIONS})`);
    }

    const executionId = this.generateExecutionId();
    const plan = this.planManager.getPlan(planId);
    if (!plan) {
      throw new Error(`Integration plan not found: ${planId}`);
    }

    // Create execution
    const execution: IntegrationExecution = {
      executionId,
      planId,
      startTime: Date.now(),
      status: 'planning',
      phaseExecutions: new Map(),
      integrationResults: [],
      conflicts: [],
      qualityMetrics: this.initializeQualityMetrics(),
      logs: []
    };

    this.activeExecutions.set(executionId, execution);

    // Update context
    this.transitionHub.updateContext({
      currentExecution: execution,
      currentPlan: plan,
      totalPhases: plan.phases.length
    });

    try {
      // Start FSM execution
      await this.transitionHub.processEvent(IntegrationEvent.START_INTEGRATION, {
        planId,
        options
      });

      // Execute through FSM states
      await this.executeThroughFSM(execution, plan, options);

      execution.endTime = Date.now();
      execution.status = 'completed';

      this.emit('integration:completed', {
        execution,
        plan,
        success: true
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      execution.status = 'failed';
      execution.endTime = Date.now();

      // Attempt rollback through FSM
      await this.executeRollbackThroughFSM(execution, plan, errorMessage);

      this.emit('integration:completed', {
        execution,
        plan,
        success: false,
        error: errorMessage
      });

    } finally {
      // Move to history and cleanup
      this.activeExecutions.delete(executionId);
      this.executionHistory.push(execution);

      // Reset FSM to idle
      this.transitionHub.updateContext({
        currentExecution: null,
        currentPlan: null,
        currentPhase: null
      });
    }

    return execution;
  }

  /**
   * Get integration plans - Backward compatible API
   */
  getIntegrationPlans(): IntegrationPlan[] {
    return this.planManager.getAllPlans();
  }

  /**
   * Get active executions - Backward compatible API
   */
  getActiveExecutions(): IntegrationExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Get execution history - Backward compatible API
   */
  getExecutionHistory(): IntegrationExecution[] {
    return [...this.executionHistory];
  }

  /**
   * Get integration status - Backward compatible API
   */
  async getIntegrationStatus(executionId: string): Promise<IntegrationExecution | null> {
    return this.activeExecutions.get(executionId) ||
           this.executionHistory.find(e => e.executionId === executionId) ||
           null;
  }

  /**
   * Cancel integration - Backward compatible API
   */
  async cancelIntegration(executionId: string, reason: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return false;

    // Signal cancellation through FSM
    this.transitionHub.updateContext({ cancellationFlag: true });
    await this.transitionHub.processEvent(IntegrationEvent.CANCEL_INTEGRATION, { reason });

    return true;
  }

  /**
   * Get integration metrics - Backward compatible API
   */
  getIntegrationMetrics(): any {
    return {
      activeIntegrations: this.activeExecutions.size,
      totalExecutions: this.executionHistory.length,
      successRate: this.calculateSuccessRate(),
      averageExecutionTime: this.calculateAverageExecutionTime(),
      currentFSMState: this.transitionHub.getCurrentState()
    };
  }

  private async initializeComponents(): Promise<void> {
    // Initialize all FSM components
    await Promise.all([
      this.planManager.init(),
      this.executor.init(),
      this.validator.init(),
      this.monitor.init(),
      this.componentIntegrator.init(),
      this.rollbackManager.init()
    ]);

    this.emit('orchestrator:components-initialized');
  }

  private setupEventHandlers(): void {
    // TransitionHub events
    this.transitionHub.on('transition:completed', (data) => {
      this.emit('fsm:transition', data);
      this.updateComponentsWithContext();
    });

    this.transitionHub.on('transition:failed', (data) => {
      this.emit('fsm:transition-failed', data);
    });

    // Component events
    this.planManager.on('plan:created', (data) => this.emit('integration:plan_created', data));
    this.executor.on('execution:started', (data) => this.emit('integration:execution_started', data));
    this.monitor.on('monitor:health-critical', (data) => this.handleHealthCritical(data));
    this.rollbackManager.on('rollback:completed', (data) => this.handleRollbackCompleted(data));

    // Legacy component events
    this.dependencyResolver.on('dependency:resolved', (data) => {
      this.emit('integration:dependency_resolved', data);
    });

    this.conflictEngine.on('conflict:detected', (conflict) => {
      this.handleConflictDetected(conflict);
    });
  }

  private async executeThroughFSM(
    execution: IntegrationExecution,
    plan: IntegrationPlan,
    options: IntegrationOptions
  ): Promise<void> {
    // Planning phase
    await this.transitionHub.processEvent(IntegrationEvent.PLAN_CREATED);

    // Validation phase
    const validationResult = await this.validator.validatePlan(plan.planId, this.transitionHub.getContext());
    this.transitionHub.updateContext({ validationResult });

    if (validationResult.passed) {
      await this.transitionHub.processEvent(IntegrationEvent.PLAN_VALIDATED, { validationResult });
    } else {
      await this.transitionHub.processEvent(IntegrationEvent.PLAN_VALIDATION_FAILED, {
        errors: validationResult.criticalErrors
      });
      throw new Error('Plan validation failed');
    }

    // Execution phase
    await this.transitionHub.processEvent(IntegrationEvent.EXECUTION_STARTED);

    // Execute phases
    for (let i = 0; i < plan.phases.length; i++) {
      const phase = plan.phases[i];
      this.transitionHub.updateContext({
        currentPhase: phase,
        currentPhaseIndex: i
      });

      const phaseResult = await this.executor.executePhase(phase, execution, options);

      if (phaseResult.success) {
        if (i < plan.phases.length - 1) {
          await this.transitionHub.processEvent(IntegrationEvent.PHASE_COMPLETED, {
            phaseId: phase.phaseId,
            result: phaseResult
          });
        } else {
          // Last phase completed
          this.transitionHub.updateContext({ allPhasesCompleted: true });
          await this.transitionHub.processEvent(IntegrationEvent.PHASE_COMPLETED, {
            phaseId: phase.phaseId,
            result: phaseResult
          });
        }
      } else {
        await this.transitionHub.processEvent(IntegrationEvent.PHASE_FAILED, {
          phaseId: phase.phaseId,
          error: {
            code: 'PHASE_FAILED',
            message: 'Phase execution failed',
            severity: 'critical',
            blocking: true
          }
        });
        throw new Error(`Phase failed: ${phase.phaseName}`);
      }
    }

    // Final validation
    const finalResult = await this.validator.validateFinalResults(execution);
    this.transitionHub.updateContext({ qualityGatesPassed: finalResult.passed });

    if (finalResult.passed) {
      await this.transitionHub.processEvent(IntegrationEvent.QUALITY_GATE_PASSED, {
        gateId: 'final-validation',
        score: finalResult.score
      });
    } else {
      await this.transitionHub.processEvent(IntegrationEvent.QUALITY_GATE_FAILED, {
        gateId: 'final-validation',
        failure: {
          gateId: 'final-validation',
          criteriaId: 'overall-quality',
          expectedValue: 80,
          actualValue: finalResult.score,
          message: 'Final quality validation failed'
        }
      });
      throw new Error('Final quality validation failed');
    }
  }

  private async executeRollbackThroughFSM(
    execution: IntegrationExecution,
    plan: IntegrationPlan,
    reason: string
  ): Promise<void> {
    try {
      const rollbackResult = await this.rollbackManager.executeRollback(execution, plan, reason);
      this.transitionHub.updateContext({ rollbackResult });

      await this.transitionHub.processEvent(IntegrationEvent.ROLLBACK_COMPLETED, { rollbackResult });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Rollback failed:', errorMessage);
    }
  }

  private async updateComponentsWithContext(): Promise<void> {
    const context = this.transitionHub.getContext();

    await Promise.all([
      this.planManager.update(context),
      this.executor.update(context),
      this.validator.update(context),
      this.monitor.update(context),
      this.componentIntegrator.update(context),
      this.rollbackManager.update(context)
    ]);
  }

  private async handleHealthCritical(data: any): Promise<void> {
    await this.transitionHub.processEvent(IntegrationEvent.HEALTH_DEGRADED, {
      healthScore: data.healthScore
    });
  }

  private async handleRollbackCompleted(data: any): Promise<void> {
    await this.transitionHub.processEvent(IntegrationEvent.ROLLBACK_COMPLETED, {
      rollbackResult: data.result
    });
  }

  private handleConflictDetected(conflict: any): Promise<void> {
    return this.transitionHub.processEvent(IntegrationEvent.CONFLICT_DETECTED, { conflict });
  }

  private generateExecutionId(): string {
    return `integration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeQualityMetrics(): any {
    return {
      overallIntegration: 0,
      componentIntegration: new Map(),
      integrationReliability: 0,
      performanceScore: 0,
      securityScore: 0,
      maintainabilityScore: 0,
      errorRate: 0,
      averageLatency: 0
    };
  }

  private calculateSuccessRate(): number {
    const completedExecutions = this.executionHistory.filter(e => e.status === 'completed');
    return this.executionHistory.length > 0
      ? completedExecutions.length / this.executionHistory.length
      : 1.0;
  }

  private calculateAverageExecutionTime(): number {
    const completedExecutions = this.executionHistory.filter(e => e.endTime);
    if (completedExecutions.length === 0) return 0;

    const totalTime = completedExecutions.reduce((sum, e) => sum + (e.endTime! - e.startTime), 0);
    return totalTime / completedExecutions.length;
  }
}

// Export for backward compatibility
export default SystemIntegrationOrchestratorFSM;

// Re-export original class for gradual migration
export { SystemIntegrationOrchestrator } from './SystemIntegrationOrchestrator';

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: fsm-orchestrator-main-001
// inputs: ["All FSM components", "original SystemIntegrationOrchestrator.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"fsm-first-refactor-v1"}
// === END FOOTER ===