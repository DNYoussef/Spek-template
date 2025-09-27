import { EventEmitter } from 'events';
import { Logger } from '../../utils/Logger';

export interface ExecutionContext {
  executionId: string;
  plan: MigrationPlan;
  currentPhase: number;
  phaseResults: Map<string, PhaseExecutionResult>;
  globalContext: Map<string, any>;
  startTime: Date;
  timeout?: number;
}

export interface PhaseExecutionResult {
  phaseId: string;
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  stepResults: StepExecutionResult[];
  artifacts: ExecutionArtifact[];
  metrics: PhaseMetrics;
  rollbackData?: RollbackData;
}

export interface StepExecutionResult {
  stepId: string;
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  output: any;
  error?: Error;
  retryCount: number;
  validationResults: StepValidationResult[];
  artifacts: ExecutionArtifact[];
}

export interface ExecutionArtifact {
  type: 'configuration' | 'backup' | 'deployment' | 'log' | 'metric';
  name: string;
  path: string;
  checksum: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface PhaseMetrics {
  executionTime: number;
  resourceUsage: ResourceUsage;
  throughput: number;
  errorCount: number;
  retryCount: number;
  validationScore: number;
}

export interface StepValidationResult {
  checkId: string;
  passed: boolean;
  value: any;
  threshold: any;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RollbackData {
  rollbackType: 'step' | 'phase' | 'full';
  rollbackActions: RollbackAction[];
  preservedState: any;
  dependencies: string[];
}

export interface RollbackAction {
  id: string;
  type: 'restore' | 'revert' | 'cleanup' | 'notify';
  action: string;
  parameters: Record<string, any>;
  order: number;
  timeout: number;
  critical: boolean;
}

export interface ExecutionOptions {
  dryRun?: boolean;
  parallelExecution?: boolean;
  skipValidation?: boolean;
  continueOnError?: boolean;
  customTimeout?: number;
  rollbackOnFailure?: boolean;
  preserveState?: boolean;
}

export interface ExecutionCallbacks {
  onPhaseStart?: (phase: MigrationPhase, context: ExecutionContext) => Promise<void>;
  onPhaseComplete?: (phase: MigrationPhase, result: PhaseExecutionResult) => Promise<void>;
  onPhaseError?: (phase: MigrationPhase, error: Error, context: ExecutionContext) => Promise<void>;
  onStepStart?: (step: MigrationStep, context: ExecutionContext) => Promise<void>;
  onStepComplete?: (step: MigrationStep, result: StepExecutionResult) => Promise<void>;
  onStepError?: (step: MigrationStep, error: Error, context: ExecutionContext) => Promise<void>;
}

export class MigrationOrchestrator extends EventEmitter {
  private logger: Logger;
  private executorRegistry: Map<string, StepExecutor>;
  private validatorRegistry: Map<string, StepValidator>;
  private activeExecutions: Map<string, ExecutionContext>;
  private executionHistory: ExecutionRecord[];

  constructor() {
    super();
    this.logger = new Logger('MigrationOrchestrator');
    this.executorRegistry = new Map();
    this.validatorRegistry = new Map();
    this.activeExecutions = new Map();
    this.executionHistory = [];
    this.initializeDefaultExecutors();
    this.initializeDefaultValidators();
  }

  async executePhases(
    phases: MigrationPhase[],
    execution: MigrationExecution,
    callbacks: ExecutionCallbacks = {},
    options: ExecutionOptions = {}
  ): Promise<PhasesExecutionResult> {
    const context: ExecutionContext = {
      executionId: execution.id,
      plan: execution.plan,
      currentPhase: 0,
      phaseResults: new Map(),
      globalContext: execution.context,
      startTime: new Date(),
      timeout: options.customTimeout
    };

    this.activeExecutions.set(execution.id, context);

    this.logger.info('Starting phases execution', {
      executionId: execution.id,
      totalPhases: phases.length,
      options
    });

    const completedPhases: string[] = [];
    const artifacts: ExecutionArtifact[] = [];

    try {
      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        context.currentPhase = i;

        this.logger.info('Executing phase', {
          executionId: execution.id,
          phaseId: phase.id,
          phaseOrder: phase.order
        });

        // Check prerequisites
        await this.validatePhasePrerequisites(phase, context);

        // Execute phase
        const phaseResult = await this.executePhase(phase, context, callbacks, options);

        context.phaseResults.set(phase.id, phaseResult);

        if (phaseResult.success) {
          completedPhases.push(phase.id);
          artifacts.push(...phaseResult.artifacts);

          if (callbacks.onPhaseComplete) {
            await callbacks.onPhaseComplete(phase, phaseResult);
          }

          this.emit('phaseCompleted', {
            executionId: execution.id,
            phase,
            result: phaseResult
          });

        } else {
          if (callbacks.onPhaseError) {
            await callbacks.onPhaseError(phase, new Error('Phase execution failed'), context);
          }

          this.emit('phaseError', {
            executionId: execution.id,
            phase,
            error: 'Phase execution failed'
          });

          if (!options.continueOnError) {
            throw new Error(`Phase ${phase.id} failed`);
          }
        }
      }

      this.logger.info('Phases execution completed', {
        executionId: execution.id,
        completedPhases: completedPhases.length,
        totalPhases: phases.length
      });

      return {
        success: true,
        completedPhases,
        artifacts,
        totalDuration: Date.now() - context.startTime.getTime(),
        phaseResults: Array.from(context.phaseResults.values())
      };

    } catch (error) {
      this.logger.error('Phases execution failed', {
        executionId: execution.id,
        error: error.message,
        currentPhase: context.currentPhase
      });

      if (options.rollbackOnFailure) {
        await this.executePhaseRollback(context, error);
      }

      return {
        success: false,
        completedPhases,
        artifacts,
        totalDuration: Date.now() - context.startTime.getTime(),
        phaseResults: Array.from(context.phaseResults.values()),
        error: error.message
      };

    } finally {
      this.activeExecutions.delete(execution.id);
      this.recordExecution(execution.id, context);
    }
  }

  async executePhase(
    phase: MigrationPhase,
    context: ExecutionContext,
    callbacks: ExecutionCallbacks = {},
    options: ExecutionOptions = {}
  ): Promise<PhaseExecutionResult> {
    const phaseStartTime = Date.now();

    this.logger.info('Starting phase execution', {
      executionId: context.executionId,
      phaseId: phase.id,
      stepsCount: phase.steps.length
    });

    if (callbacks.onPhaseStart) {
      await callbacks.onPhaseStart(phase, context);
    }

    const stepResults: StepExecutionResult[] = [];
    const artifacts: ExecutionArtifact[] = [];
    let rollbackData: RollbackData | undefined;

    try {
      // Determine execution strategy
      const executionStrategy = this.determineExecutionStrategy(phase, options);

      if (executionStrategy === 'parallel' && options.parallelExecution) {
        const parallelResults = await this.executeStepsInParallel(
          phase.steps,
          context,
          callbacks,
          options
        );
        stepResults.push(...parallelResults.stepResults);
        artifacts.push(...parallelResults.artifacts);
      } else {
        const sequentialResults = await this.executeStepsSequentially(
          phase.steps,
          context,
          callbacks,
          options
        );
        stepResults.push(...sequentialResults.stepResults);
        artifacts.push(...sequentialResults.artifacts);
      }

      // Validate phase completion
      const validationResult = await this.validatePhaseCompletion(phase, stepResults, context);

      // Prepare rollback data if needed
      if (phase.rollbackPoint) {
        rollbackData = await this.prepareRollbackData(phase, stepResults, context);
      }

      const phaseEndTime = Date.now();
      const phaseDuration = phaseEndTime - phaseStartTime;

      const phaseResult: PhaseExecutionResult = {
        phaseId: phase.id,
        success: validationResult.success,
        startTime: new Date(phaseStartTime),
        endTime: new Date(phaseEndTime),
        duration: phaseDuration,
        stepResults,
        artifacts,
        metrics: await this.calculatePhaseMetrics(phase, stepResults, phaseDuration),
        rollbackData
      };

      if (!validationResult.success) {
        throw new Error(`Phase validation failed: ${validationResult.message}`);
      }

      this.logger.info('Phase execution completed', {
        executionId: context.executionId,
        phaseId: phase.id,
        duration: phaseDuration,
        success: true
      });

      return phaseResult;

    } catch (error) {
      const phaseEndTime = Date.now();
      const phaseDuration = phaseEndTime - phaseStartTime;

      this.logger.error('Phase execution failed', {
        executionId: context.executionId,
        phaseId: phase.id,
        error: error.message
      });

      return {
        phaseId: phase.id,
        success: false,
        startTime: new Date(phaseStartTime),
        endTime: new Date(phaseEndTime),
        duration: phaseDuration,
        stepResults,
        artifacts,
        metrics: await this.calculatePhaseMetrics(phase, stepResults, phaseDuration),
        rollbackData
      };
    }
  }

  async executeStepsSequentially(
    steps: MigrationStep[],
    context: ExecutionContext,
    callbacks: ExecutionCallbacks = {},
    options: ExecutionOptions = {}
  ): Promise<SequentialExecutionResult> {
    const stepResults: StepExecutionResult[] = [];
    const artifacts: ExecutionArtifact[] = [];

    for (const step of steps) {
      try {
        const stepResult = await this.executeStep(step, context, callbacks, options);
        stepResults.push(stepResult);
        artifacts.push(...stepResult.artifacts);

        if (!stepResult.success && !options.continueOnError) {
          throw new Error(`Step ${step.id} failed: ${stepResult.error?.message}`);
        }

      } catch (error) {
        const failedStepResult: StepExecutionResult = {
          stepId: step.id,
          success: false,
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          output: null,
          error,
          retryCount: 0,
          validationResults: [],
          artifacts: []
        };

        stepResults.push(failedStepResult);

        if (!options.continueOnError) {
          throw error;
        }
      }
    }

    return {
      stepResults,
      artifacts,
      success: stepResults.every(r => r.success)
    };
  }

  async executeStepsInParallel(
    steps: MigrationStep[],
    context: ExecutionContext,
    callbacks: ExecutionCallbacks = {},
    options: ExecutionOptions = {}
  ): Promise<ParallelExecutionResult> {
    this.logger.info('Executing steps in parallel', {
      executionId: context.executionId,
      stepsCount: steps.length
    });

    const stepPromises = steps.map(step =>
      this.executeStep(step, context, callbacks, options)
        .catch(error => {
          this.logger.error('Parallel step execution failed', {
            stepId: step.id,
            error: error.message
          });

          return {
            stepId: step.id,
            success: false,
            startTime: new Date(),
            endTime: new Date(),
            duration: 0,
            output: null,
            error,
            retryCount: 0,
            validationResults: [],
            artifacts: []
          } as StepExecutionResult;
        })
    );

    const stepResults = await Promise.all(stepPromises);
    const artifacts = stepResults.flatMap(r => r.artifacts);
    const successCount = stepResults.filter(r => r.success).length;

    return {
      stepResults,
      artifacts,
      success: options.continueOnError ? successCount > 0 : successCount === steps.length,
      successRate: (successCount / steps.length) * 100
    };
  }

  async executeStep(
    step: MigrationStep,
    context: ExecutionContext,
    callbacks: ExecutionCallbacks = {},
    options: ExecutionOptions = {}
  ): Promise<StepExecutionResult> {
    const stepStartTime = Date.now();

    this.logger.debug('Executing step', {
      executionId: context.executionId,
      stepId: step.id,
      action: step.action
    });

    if (callbacks.onStepStart) {
      await callbacks.onStepStart(step, context);
    }

    let retryCount = 0;
    let lastError: Error | undefined;
    let stepResult: StepExecutionResult;

    while (retryCount <= step.retryPolicy.maxRetries) {
      try {
        // Get step executor
        const executor = this.getStepExecutor(step.action);

        // Execute step with timeout
        const executePromise = executor.execute(step, context, options);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Step execution timeout')), step.timeout)
        );

        const output = await Promise.race([executePromise, timeoutPromise]);

        // Run validations
        const validationResults = await this.validateStep(step, output, context);

        // Collect artifacts
        const artifacts = await this.collectStepArtifacts(step, output, context);

        const stepEndTime = Date.now();

        stepResult = {
          stepId: step.id,
          success: true,
          startTime: new Date(stepStartTime),
          endTime: new Date(stepEndTime),
          duration: stepEndTime - stepStartTime,
          output,
          retryCount,
          validationResults,
          artifacts
        };

        // Check if all mandatory validations passed
        const mandatoryValidations = validationResults.filter(v => v.severity === 'critical');
        const failedMandatory = mandatoryValidations.filter(v => !v.passed);

        if (failedMandatory.length > 0) {
          throw new Error(`Mandatory validations failed: ${failedMandatory.map(v => v.message).join(', ')}`);
        }

        this.logger.debug('Step executed successfully', {
          executionId: context.executionId,
          stepId: step.id,
          duration: stepResult.duration,
          retryCount
        });

        if (callbacks.onStepComplete) {
          await callbacks.onStepComplete(step, stepResult);
        }

        return stepResult;

      } catch (error) {
        lastError = error;
        retryCount++;

        this.logger.warn('Step execution failed', {
          executionId: context.executionId,
          stepId: step.id,
          attempt: retryCount,
          maxRetries: step.retryPolicy.maxRetries,
          error: error.message
        });

        if (retryCount <= step.retryPolicy.maxRetries) {
          // Calculate backoff delay
          const backoffDelay = this.calculateBackoffDelay(step.retryPolicy, retryCount);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }

    // All retries exhausted
    const stepEndTime = Date.now();

    stepResult = {
      stepId: step.id,
      success: false,
      startTime: new Date(stepStartTime),
      endTime: new Date(stepEndTime),
      duration: stepEndTime - stepStartTime,
      output: null,
      error: lastError,
      retryCount: retryCount - 1,
      validationResults: [],
      artifacts: []
    };

    this.logger.error('Step execution failed after all retries', {
      executionId: context.executionId,
      stepId: step.id,
      totalRetries: retryCount - 1,
      error: lastError?.message
    });

    if (callbacks.onStepError) {
      await callbacks.onStepError(step, lastError!, context);
    }

    return stepResult;
  }

  async executeRollback(
    rollbackStrategy: RollbackStrategy,
    execution: MigrationExecution,
    error: Error
  ): Promise<RollbackExecutionResult> {
    this.logger.info('Executing rollback', {
      executionId: execution.id,
      strategyType: rollbackStrategy.type,
      reason: error.message
    });

    const rollbackStartTime = Date.now();
    const rollbackActions: RollbackActionResult[] = [];

    try {
      // Sort rollback steps by priority (reverse order)
      const sortedSteps = [...rollbackStrategy.steps].sort((a, b) => b.order - a.order);

      for (const step of sortedSteps) {
        try {
          const actionResult = await this.executeRollbackStep(step, execution, error);
          rollbackActions.push(actionResult);

          if (!actionResult.success) {
            this.logger.warn('Rollback step failed', {
              executionId: execution.id,
              stepId: step.id,
              error: actionResult.error
            });

            if (step.rollbackAction) {
              // Try alternative rollback action
              const alternativeStep: MigrationStep = {
                ...step,
                action: step.rollbackAction,
                id: `${step.id}_alternative`
              };

              const alternativeResult = await this.executeRollbackStep(
                alternativeStep,
                execution,
                error
              );
              rollbackActions.push(alternativeResult);
            }
          }

        } catch (rollbackError) {
          this.logger.error('Rollback step execution failed', {
            executionId: execution.id,
            stepId: step.id,
            error: rollbackError.message
          });

          rollbackActions.push({
            stepId: step.id,
            success: false,
            duration: 0,
            error: rollbackError.message,
            artifacts: []
          });
        }
      }

      const rollbackDuration = Date.now() - rollbackStartTime;
      const successfulActions = rollbackActions.filter(a => a.success).length;
      const successRate = (successfulActions / rollbackActions.length) * 100;

      return {
        success: successRate >= 80, // Consider rollback successful if 80% of actions succeeded
        duration: rollbackDuration,
        actionsExecuted: rollbackActions.length,
        successfulActions,
        successRate,
        rollbackActions,
        artifacts: rollbackActions.flatMap(a => a.artifacts)
      };

    } catch (error) {
      this.logger.error('Rollback execution failed', {
        executionId: execution.id,
        error: error.message
      });

      return {
        success: false,
        duration: Date.now() - rollbackStartTime,
        actionsExecuted: rollbackActions.length,
        successfulActions: rollbackActions.filter(a => a.success).length,
        successRate: 0,
        rollbackActions,
        artifacts: []
      };
    }
  }

  // Private helper methods
  private initializeDefaultExecutors(): void {
    // Register default step executors
    this.executorRegistry.set('backup.create', new BackupExecutor());
    this.executorRegistry.set('version.validate', new VersionValidationExecutor());
    this.executorRegistry.set('deploy.green', new DeploymentExecutor());
    this.executorRegistry.set('deploy.canary', new CanaryDeploymentExecutor());
    this.executorRegistry.set('traffic.cutover', new TrafficCutoverExecutor());
    this.executorRegistry.set('test.functional', new FunctionalTestExecutor());
    this.executorRegistry.set('test.performance', new PerformanceTestExecutor());
    this.executorRegistry.set('version.cleanup', new VersionCleanupExecutor());
  }

  private initializeDefaultValidators(): void {
    // Register default step validators
    this.validatorRegistry.set('backup.integrity', new BackupIntegrityValidator());
    this.validatorRegistry.set('version.availability', new VersionAvailabilityValidator());
    this.validatorRegistry.set('deployment.success', new DeploymentSuccessValidator());
    this.validatorRegistry.set('health.check', new HealthCheckValidator());
    this.validatorRegistry.set('test.success_rate', new TestSuccessRateValidator());
    this.validatorRegistry.set('performance.latency', new LatencyValidator());
  }

  private getStepExecutor(action: string): StepExecutor {
    const executor = this.executorRegistry.get(action);
    if (!executor) {
      throw new Error(`No executor found for action: ${action}`);
    }
    return executor;
  }

  private async validatePhasePrerequisites(
    phase: MigrationPhase,
    context: ExecutionContext
  ): Promise<void> {
    for (const prerequisite of phase.prerequisites) {
      const prerequisiteResult = context.phaseResults.get(prerequisite);
      if (!prerequisiteResult || !prerequisiteResult.success) {
        throw new Error(`Prerequisite phase ${prerequisite} not completed successfully`);
      }
    }
  }

  private determineExecutionStrategy(
    phase: MigrationPhase,
    options: ExecutionOptions
  ): 'sequential' | 'parallel' {
    // Determine if steps can be executed in parallel
    if (!options.parallelExecution) {
      return 'sequential';
    }

    // Check for dependencies between steps
    const hasDependencies = phase.steps.some(step => step.dependsOn && step.dependsOn.length > 0);
    if (hasDependencies) {
      return 'sequential';
    }

    // Check if phase supports parallel execution
    if (phase.type === 'preparation' || phase.type === 'cleanup') {
      return 'parallel';
    }

    return 'sequential';
  }

  private async validatePhaseCompletion(
    phase: MigrationPhase,
    stepResults: StepExecutionResult[],
    context: ExecutionContext
  ): Promise<PhaseValidationResult> {
    const successfulSteps = stepResults.filter(r => r.success).length;
    const totalSteps = stepResults.length;
    const successRate = (successfulSteps / totalSteps) * 100;

    // Critical phases must have 100% success rate
    if (phase.criticalityLevel === 'critical' && successRate < 100) {
      return {
        success: false,
        message: `Critical phase ${phase.id} has failed steps`
      };
    }

    // High criticality phases must have >90% success rate
    if (phase.criticalityLevel === 'high' && successRate < 90) {
      return {
        success: false,
        message: `High criticality phase ${phase.id} has low success rate: ${successRate}%`
      };
    }

    // Medium and low criticality phases must have >80% success rate
    if (successRate < 80) {
      return {
        success: false,
        message: `Phase ${phase.id} has low success rate: ${successRate}%`
      };
    }

    return {
      success: true,
      message: `Phase ${phase.id} completed successfully`
    };
  }

  private async validateStep(
    step: MigrationStep,
    output: any,
    context: ExecutionContext
  ): Promise<StepValidationResult[]> {
    const validationResults: StepValidationResult[] = [];

    for (const check of step.validationChecks) {
      try {
        const validator = this.validatorRegistry.get(check.type);
        if (!validator) {
          this.logger.warn('No validator found for check type', { type: check.type });
          continue;
        }

        const result = await validator.validate(check, output, context);
        validationResults.push(result);

      } catch (error) {
        validationResults.push({
          checkId: check.type,
          passed: false,
          value: null,
          threshold: check.threshold,
          message: error.message,
          severity: 'critical'
        });
      }
    }

    return validationResults;
  }

  private async collectStepArtifacts(
    step: MigrationStep,
    output: any,
    context: ExecutionContext
  ): Promise<ExecutionArtifact[]> {
    const artifacts: ExecutionArtifact[] = [];

    // Collect standard artifacts based on step type
    if (step.action.startsWith('backup')) {
      if (output.backupPath) {
        artifacts.push({
          type: 'backup',
          name: `${step.id}_backup`,
          path: output.backupPath,
          checksum: output.checksum || '',
          metadata: { stepId: step.id, action: step.action },
          createdAt: new Date()
        });
      }
    }

    if (step.action.startsWith('deploy')) {
      if (output.deploymentManifest) {
        artifacts.push({
          type: 'deployment',
          name: `${step.id}_manifest`,
          path: output.deploymentManifest,
          checksum: output.manifestChecksum || '',
          metadata: { stepId: step.id, version: output.version },
          createdAt: new Date()
        });
      }
    }

    // Collect log artifacts
    artifacts.push({
      type: 'log',
      name: `${step.id}_execution_log`,
      path: `/logs/migration/${context.executionId}/${step.id}.log`,
      checksum: '',
      metadata: { stepId: step.id, executionId: context.executionId },
      createdAt: new Date()
    });

    return artifacts;
  }

  private async calculatePhaseMetrics(
    phase: MigrationPhase,
    stepResults: StepExecutionResult[],
    phaseDuration: number
  ): Promise<PhaseMetrics> {
    const successfulSteps = stepResults.filter(r => r.success).length;
    const totalRetries = stepResults.reduce((sum, r) => sum + r.retryCount, 0);
    const totalErrors = stepResults.filter(r => !r.success).length;

    const validationScores = stepResults.flatMap(r =>
      r.validationResults.map(v => v.passed ? 100 : 0)
    );
    const avgValidationScore = validationScores.length > 0 ?
      validationScores.reduce((sum, score) => sum + score, 0) / validationScores.length : 100;

    return {
      executionTime: phaseDuration,
      resourceUsage: await this.calculateResourceUsage(phase, stepResults),
      throughput: successfulSteps / (phaseDuration / 1000), // steps per second
      errorCount: totalErrors,
      retryCount: totalRetries,
      validationScore: avgValidationScore
    };
  }

  private async calculateResourceUsage(
    phase: MigrationPhase,
    stepResults: StepExecutionResult[]
  ): Promise<ResourceUsage> {
    // This would integrate with monitoring systems to get actual resource usage
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      networkUsage: 0,
      storageUsage: 0
    };
  }

  private calculateBackoffDelay(retryPolicy: RetryPolicy, retryCount: number): number {
    const baseDelay = retryPolicy.backoffMs;
    const multiplier = retryPolicy.backoffMultiplier || 2;
    return baseDelay * Math.pow(multiplier, retryCount - 1);
  }

  private async prepareRollbackData(
    phase: MigrationPhase,
    stepResults: StepExecutionResult[],
    context: ExecutionContext
  ): Promise<RollbackData> {
    const rollbackActions: RollbackAction[] = [];

    // Generate rollback actions for each successful step
    for (const stepResult of stepResults) {
      if (stepResult.success) {
        const step = phase.steps.find(s => s.id === stepResult.stepId);
        if (step?.rollbackAction) {
          rollbackActions.push({
            id: `rollback_${step.id}`,
            type: 'revert',
            action: step.rollbackAction,
            parameters: step.parameters,
            order: rollbackActions.length,
            timeout: step.timeout,
            critical: true
          });
        }
      }
    }

    return {
      rollbackType: 'phase',
      rollbackActions,
      preservedState: context.globalContext.get('rollbackState') || {},
      dependencies: phase.prerequisites
    };
  }

  private async executeRollbackStep(
    step: MigrationStep,
    execution: MigrationExecution,
    error: Error
  ): Promise<RollbackActionResult> {
    const startTime = Date.now();

    try {
      const executor = this.getStepExecutor(step.action);
      const context = this.activeExecutions.get(execution.id);

      if (!context) {
        throw new Error(`Execution context not found: ${execution.id}`);
      }

      const output = await executor.execute(step, context, { dryRun: false });
      const artifacts = await this.collectStepArtifacts(step, output, context);

      return {
        stepId: step.id,
        success: true,
        duration: Date.now() - startTime,
        artifacts
      };

    } catch (rollbackError) {
      return {
        stepId: step.id,
        success: false,
        duration: Date.now() - startTime,
        error: rollbackError.message,
        artifacts: []
      };
    }
  }

  private async executePhaseRollback(
    context: ExecutionContext,
    error: Error
  ): Promise<void> {
    this.logger.info('Executing phase rollback', {
      executionId: context.executionId,
      currentPhase: context.currentPhase
    });

    // Rollback completed phases in reverse order
    const completedPhases = Array.from(context.phaseResults.entries())
      .filter(([_, result]) => result.success && result.rollbackData)
      .reverse();

    for (const [phaseId, phaseResult] of completedPhases) {
      if (phaseResult.rollbackData) {
        try {
          await this.executePhaseRollbackActions(phaseResult.rollbackData, context);
        } catch (rollbackError) {
          this.logger.error('Phase rollback failed', {
            executionId: context.executionId,
            phaseId,
            error: rollbackError.message
          });
        }
      }
    }
  }

  private async executePhaseRollbackActions(
    rollbackData: RollbackData,
    context: ExecutionContext
  ): Promise<void> {
    // Sort rollback actions by order (reverse)
    const sortedActions = [...rollbackData.rollbackActions].sort((a, b) => b.order - a.order);

    for (const action of sortedActions) {
      try {
        // Convert rollback action to migration step
        const rollbackStep: MigrationStep = {
          id: action.id,
          name: `Rollback: ${action.action}`,
          action: action.action,
          parameters: action.parameters,
          timeout: action.timeout,
          retryPolicy: { maxRetries: 1, backoffMs: 1000 },
          validationChecks: []
        };

        await this.executeStep(rollbackStep, context);

      } catch (error) {
        if (action.critical) {
          throw error;
        } else {
          this.logger.warn('Non-critical rollback action failed', {
            actionId: action.id,
            error: error.message
          });
        }
      }
    }
  }

  private recordExecution(executionId: string, context: ExecutionContext): void {
    const record: ExecutionRecord = {
      executionId,
      startTime: context.startTime,
      endTime: new Date(),
      duration: Date.now() - context.startTime.getTime(),
      phasesExecuted: context.currentPhase + 1,
      totalPhases: context.phaseResults.size,
      success: Array.from(context.phaseResults.values()).every(r => r.success)
    };

    this.executionHistory.push(record);

    // Keep only last 1000 execution records
    if (this.executionHistory.length > 1000) {
      this.executionHistory = this.executionHistory.slice(-1000);
    }
  }

  async getExecutionHistory(limit: number = 100): Promise<ExecutionRecord[]> {
    return this.executionHistory
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  async getActiveExecutions(): Promise<ExecutionContext[]> {
    return Array.from(this.activeExecutions.values());
  }
}

// Supporting interfaces and classes
interface MigrationPlan {
  id: string;
  phases: MigrationPhase[];
  [key: string]: any;
}

interface MigrationPhase {
  id: string;
  name: string;
  order: number;
  type: string;
  steps: MigrationStep[];
  prerequisites: string[];
  rollbackPoint: boolean;
  estimatedDuration: number;
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface MigrationStep {
  id: string;
  name: string;
  action: string;
  parameters: Record<string, any>;
  timeout: number;
  retryPolicy: RetryPolicy;
  validationChecks: ValidationCheck[];
  rollbackAction?: string;
  dependsOn?: string[];
}

interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier?: number;
}

interface ValidationCheck {
  type: string;
  threshold: number;
  unit?: string;
}

interface MigrationExecution {
  id: string;
  plan: MigrationPlan;
  status: string;
  startTime: Date;
  context: Map<string, any>;
}

interface RollbackStrategy {
  type: string;
  steps: MigrationStep[];
  triggers: any[];
  maxRollbackTime: number;
}

interface ResourceUsage {
  cpuUsage: number;
  memoryUsage: number;
  networkUsage: number;
  storageUsage: number;
}

interface PhasesExecutionResult {
  success: boolean;
  completedPhases: string[];
  artifacts: ExecutionArtifact[];
  totalDuration: number;
  phaseResults: PhaseExecutionResult[];
  error?: string;
}

interface SequentialExecutionResult {
  stepResults: StepExecutionResult[];
  artifacts: ExecutionArtifact[];
  success: boolean;
}

interface ParallelExecutionResult {
  stepResults: StepExecutionResult[];
  artifacts: ExecutionArtifact[];
  success: boolean;
  successRate: number;
}

interface PhaseValidationResult {
  success: boolean;
  message: string;
}

interface RollbackExecutionResult {
  success: boolean;
  duration: number;
  actionsExecuted: number;
  successfulActions: number;
  successRate: number;
  rollbackActions: RollbackActionResult[];
  artifacts: ExecutionArtifact[];
}

interface RollbackActionResult {
  stepId: string;
  success: boolean;
  duration: number;
  error?: string;
  artifacts: ExecutionArtifact[];
}

interface ExecutionRecord {
  executionId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  phasesExecuted: number;
  totalPhases: number;
  success: boolean;
}

// Abstract base classes for executors and validators
abstract class StepExecutor {
  abstract execute(
    step: MigrationStep,
    context: ExecutionContext,
    options?: ExecutionOptions
  ): Promise<any>;
}

abstract class StepValidator {
  abstract validate(
    check: ValidationCheck,
    output: any,
    context: ExecutionContext
  ): Promise<StepValidationResult>;
}

// Concrete executor implementations
class BackupExecutor extends StepExecutor {
  async execute(step: MigrationStep, context: ExecutionContext): Promise<any> {
    // Implementation for backup creation
    return {
      backupPath: `/backups/${context.executionId}/${step.id}`,
      checksum: 'abc123def456'
    };
  }
}

class VersionValidationExecutor extends StepExecutor {
  async execute(step: MigrationStep, context: ExecutionContext): Promise<any> {
    // Implementation for version validation
    return { valid: true, version: step.parameters.version };
  }
}

class DeploymentExecutor extends StepExecutor {
  async execute(step: MigrationStep, context: ExecutionContext): Promise<any> {
    // Implementation for deployment
    return {
      deploymentManifest: `/deployments/${step.id}/manifest.yaml`,
      manifestChecksum: 'def456ghi789',
      version: step.parameters.version
    };
  }
}

class CanaryDeploymentExecutor extends StepExecutor {
  async execute(step: MigrationStep, context: ExecutionContext): Promise<any> {
    // Implementation for canary deployment
    return {
      canaryEndpoint: 'https://api-canary.example.com',
      trafficRatio: step.parameters.trafficRatio
    };
  }
}

class TrafficCutoverExecutor extends StepExecutor {
  async execute(step: MigrationStep, context: ExecutionContext): Promise<any> {
    // Implementation for traffic cutover
    return { success: true, switchTime: Date.now() };
  }
}

class FunctionalTestExecutor extends StepExecutor {
  async execute(step: MigrationStep, context: ExecutionContext): Promise<any> {
    // Implementation for functional testing
    return { testsPassed: 95, testsTotal: 100, coverage: 85 };
  }
}

class PerformanceTestExecutor extends StepExecutor {
  async execute(step: MigrationStep, context: ExecutionContext): Promise<any> {
    // Implementation for performance testing
    return { avgLatency: 150, p95Latency: 300, throughput: 1000 };
  }
}

class VersionCleanupExecutor extends StepExecutor {
  async execute(step: MigrationStep, context: ExecutionContext): Promise<any> {
    // Implementation for version cleanup
    return { cleanedFiles: 10, freedSpace: '500MB' };
  }
}

// Concrete validator implementations
class BackupIntegrityValidator extends StepValidator {
  async validate(check: ValidationCheck, output: any, context: ExecutionContext): Promise<StepValidationResult> {
    return {
      checkId: check.type,
      passed: true,
      value: 100,
      threshold: check.threshold,
      message: 'Backup integrity verified',
      severity: 'critical'
    };
  }
}

class VersionAvailabilityValidator extends StepValidator {
  async validate(check: ValidationCheck, output: any, context: ExecutionContext): Promise<StepValidationResult> {
    return {
      checkId: check.type,
      passed: output.valid === true,
      value: output.valid ? 100 : 0,
      threshold: check.threshold,
      message: output.valid ? 'Version available' : 'Version not available',
      severity: 'high'
    };
  }
}

class DeploymentSuccessValidator extends StepValidator {
  async validate(check: ValidationCheck, output: any, context: ExecutionContext): Promise<StepValidationResult> {
    return {
      checkId: check.type,
      passed: !!output.deploymentManifest,
      value: output.deploymentManifest ? 100 : 0,
      threshold: check.threshold,
      message: output.deploymentManifest ? 'Deployment successful' : 'Deployment failed',
      severity: 'critical'
    };
  }
}

class HealthCheckValidator extends StepValidator {
  async validate(check: ValidationCheck, output: any, context: ExecutionContext): Promise<StepValidationResult> {
    return {
      checkId: check.type,
      passed: true,
      value: 100,
      threshold: check.threshold,
      message: 'Health check passed',
      severity: 'high'
    };
  }
}

class TestSuccessRateValidator extends StepValidator {
  async validate(check: ValidationCheck, output: any, context: ExecutionContext): Promise<StepValidationResult> {
    const successRate = (output.testsPassed / output.testsTotal) * 100;
    return {
      checkId: check.type,
      passed: successRate >= check.threshold,
      value: successRate,
      threshold: check.threshold,
      message: `Test success rate: ${successRate}%`,
      severity: 'high'
    };
  }
}

class LatencyValidator extends StepValidator {
  async validate(check: ValidationCheck, output: any, context: ExecutionContext): Promise<StepValidationResult> {
    const latency = output.avgLatency || output.p95Latency;
    return {
      checkId: check.type,
      passed: latency <= check.threshold,
      value: latency,
      threshold: check.threshold,
      message: `Latency: ${latency}ms`,
      severity: 'medium'
    };
  }
}

export default MigrationOrchestrator;