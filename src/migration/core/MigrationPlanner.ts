import { EventEmitter } from 'events';
import { Logger } from '../../utils/Logger';
import { ProtocolVersionManager } from './ProtocolVersionManager';
import { FallbackChainManager } from './FallbackChainManager';
import { MigrationOrchestrator } from './MigrationOrchestrator';
import { CompatibilityMatrix } from './CompatibilityMatrix';

export interface MigrationPlan {
  id: string;
  name: string;
  sourceVersion: string;
  targetVersion: string;
  strategy: MigrationStrategy;
  phases: MigrationPhase[];
  rollbackStrategy: RollbackStrategy;
  validationRules: ValidationRule[];
  timeline: MigrationTimeline;
  riskAssessment: RiskAssessment;
  fallbackChain: FallbackProtocol[];
  dependencies: MigrationDependency[];
}

export interface MigrationPhase {
  id: string;
  name: string;
  order: number;
  type: 'preparation' | 'execution' | 'validation' | 'cleanup';
  steps: MigrationStep[];
  prerequisites: string[];
  rollbackPoint: boolean;
  estimatedDuration: number;
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface MigrationStep {
  id: string;
  name: string;
  action: string;
  parameters: Record<string, any>;
  timeout: number;
  retryPolicy: RetryPolicy;
  validationChecks: ValidationCheck[];
  rollbackAction?: string;
}

export interface MigrationResult {
  success: boolean;
  executionId: string;
  completedPhases: string[];
  failurePoint?: string;
  rollbackExecuted: boolean;
  metrics: MigrationMetrics;
  artifacts: MigrationArtifact[];
  timestamp: Date;
}

export interface MigrationStrategy {
  type: 'bluegreen' | 'canary' | 'rolling' | 'bigbang' | 'parallel';
  configuration: Record<string, any>;
  trafficSplitRatio?: number;
  validationGates: ValidationGate[];
  rollbackTriggers: RollbackTrigger[];
}

export interface ValidationRule {
  id: string;
  name: string;
  type: 'functional' | 'performance' | 'security' | 'compatibility';
  criteria: ValidationCriteria;
  mandatory: boolean;
  weight: number;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  mitigations: RiskMitigation[];
  contingencyPlans: ContingencyPlan[];
  businessImpact: BusinessImpact;
}

export interface MigrationMetrics {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  downtime: number;
  successRate: number;
  performance: PerformanceMetrics;
  errors: ErrorMetric[];
  trafficMetrics: TrafficMetrics;
}

export class MigrationPlanner extends EventEmitter {
  private logger: Logger;
  private versionManager: ProtocolVersionManager;
  private fallbackManager: FallbackChainManager;
  private orchestrator: MigrationOrchestrator;
  private compatibility: CompatibilityMatrix;
  private activeMigrations: Map<string, MigrationExecution>;

  constructor() {
    super();
    this.logger = new Logger('MigrationPlanner');
    this.versionManager = new ProtocolVersionManager();
    this.fallbackManager = new FallbackChainManager();
    this.orchestrator = new MigrationOrchestrator();
    this.compatibility = new CompatibilityMatrix();
    this.activeMigrations = new Map();
  }

  async createMigrationPlan(
    sourceVersion: string,
    targetVersion: string,
    options: MigrationPlanOptions = {}
  ): Promise<MigrationPlan> {
    this.logger.info('Creating migration plan', { sourceVersion, targetVersion });

    const compatibilityCheck = await this.compatibility.validateMigrationPath(
      sourceVersion,
      targetVersion
    );

    if (!compatibilityCheck.compatible) {
      throw new Error(`Migration path not compatible: ${compatibilityCheck.reason}`);
    }

    const riskAssessment = await this.assessMigrationRisks(
      sourceVersion,
      targetVersion,
      options
    );

    const strategy = await this.selectOptimalStrategy(
      sourceVersion,
      targetVersion,
      riskAssessment,
      options
    );

    const phases = await this.generateMigrationPhases(
      sourceVersion,
      targetVersion,
      strategy,
      options
    );

    const fallbackChain = await this.fallbackManager.buildFallbackChain(
      sourceVersion,
      targetVersion,
      strategy
    );

    const plan: MigrationPlan = {
      id: this.generateMigrationId(),
      name: options.name || `Migration_${sourceVersion}_to_${targetVersion}`,
      sourceVersion,
      targetVersion,
      strategy,
      phases,
      rollbackStrategy: await this.createRollbackStrategy(phases, strategy),
      validationRules: await this.generateValidationRules(sourceVersion, targetVersion),
      timeline: await this.calculateTimeline(phases, strategy),
      riskAssessment,
      fallbackChain,
      dependencies: await this.analyzeDependencies(sourceVersion, targetVersion)
    };

    await this.validateMigrationPlan(plan);
    this.emit('planCreated', plan);

    return plan;
  }

  async executeMigrationPlan(
    plan: MigrationPlan,
    options: ExecutionOptions = {}
  ): Promise<MigrationResult> {
    const executionId = this.generateExecutionId();
    this.logger.info('Executing migration plan', { planId: plan.id, executionId });

    const execution: MigrationExecution = {
      id: executionId,
      plan,
      status: 'running',
      startTime: new Date(),
      currentPhase: 0,
      metrics: this.initializeMetrics(),
      context: new Map()
    };

    this.activeMigrations.set(executionId, execution);
    this.emit('executionStarted', execution);

    try {
      // Pre-execution validation
      await this.validatePreExecution(plan);

      // Execute migration phases
      const result = await this.orchestrator.executePhases(
        plan.phases,
        execution,
        {
          onPhaseComplete: (phase, result) => this.handlePhaseComplete(execution, phase, result),
          onPhaseError: (phase, error) => this.handlePhaseError(execution, phase, error)
        }
      );

      // Post-execution validation
      await this.validatePostExecution(plan, result);

      execution.status = 'completed';
      execution.endTime = new Date();
      this.emit('executionCompleted', execution);

      return {
        success: true,
        executionId,
        completedPhases: result.completedPhases,
        rollbackExecuted: false,
        metrics: execution.metrics,
        artifacts: result.artifacts,
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error('Migration execution failed', {
        executionId,
        error: error.message,
        currentPhase: execution.currentPhase
      });

      const rollbackResult = await this.executeRollback(execution, error);
      execution.status = 'failed';
      execution.endTime = new Date();
      this.emit('executionFailed', execution, error);

      return {
        success: false,
        executionId,
        completedPhases: execution.completedPhases || [],
        failurePoint: execution.currentPhase.toString(),
        rollbackExecuted: rollbackResult.success,
        metrics: execution.metrics,
        artifacts: rollbackResult.artifacts,
        timestamp: new Date()
      };
    } finally {
      this.activeMigrations.delete(executionId);
    }
  }

  async rollbackMigration(
    executionId: string,
    options: RollbackOptions = {}
  ): Promise<RollbackResult> {
    const execution = this.activeMigrations.get(executionId);
    if (!execution) {
      throw new Error(`Migration execution not found: ${executionId}`);
    }

    this.logger.info('Initiating migration rollback', { executionId });
    return await this.executeRollback(execution, new Error('Manual rollback requested'), options);
  }

  async validateMigrationPath(
    sourceVersion: string,
    targetVersion: string
  ): Promise<ValidationResult> {
    return await this.compatibility.validateMigrationPath(sourceVersion, targetVersion);
  }

  async getActiveMigrations(): Promise<MigrationExecution[]> {
    return Array.from(this.activeMigrations.values());
  }

  async getMigrationStatus(executionId: string): Promise<MigrationStatus> {
    const execution = this.activeMigrations.get(executionId);
    if (!execution) {
      throw new Error(`Migration execution not found: ${executionId}`);
    }

    return {
      executionId,
      status: execution.status,
      currentPhase: execution.currentPhase,
      totalPhases: execution.plan.phases.length,
      progress: this.calculateProgress(execution),
      metrics: execution.metrics,
      estimatedCompletion: this.estimateCompletion(execution)
    };
  }

  private async assessMigrationRisks(
    sourceVersion: string,
    targetVersion: string,
    options: MigrationPlanOptions
  ): Promise<RiskAssessment> {
    const riskFactors: RiskFactor[] = [];

    // Version compatibility risk
    const versionDelta = await this.versionManager.calculateVersionDelta(
      sourceVersion,
      targetVersion
    );
    if (versionDelta.major > 0) {
      riskFactors.push({
        type: 'compatibility',
        level: 'high',
        description: 'Major version change detected',
        impact: 'Breaking changes possible'
      });
    }

    // Traffic load risk
    if (options.trafficLoad && options.trafficLoad > 80) {
      riskFactors.push({
        type: 'performance',
        level: 'medium',
        description: 'High traffic load during migration',
        impact: 'Performance degradation possible'
      });
    }

    // Dependency risk
    const dependencies = await this.analyzeDependencies(sourceVersion, targetVersion);
    if (dependencies.length > 10) {
      riskFactors.push({
        type: 'dependency',
        level: 'medium',
        description: 'High number of dependencies',
        impact: 'Complex rollback scenarios'
      });
    }

    const overallRisk = this.calculateOverallRisk(riskFactors);

    return {
      overallRisk,
      riskFactors,
      mitigations: await this.generateMitigations(riskFactors),
      contingencyPlans: await this.generateContingencyPlans(riskFactors),
      businessImpact: await this.assessBusinessImpact(sourceVersion, targetVersion)
    };
  }

  private async selectOptimalStrategy(
    sourceVersion: string,
    targetVersion: string,
    riskAssessment: RiskAssessment,
    options: MigrationPlanOptions
  ): Promise<MigrationStrategy> {
    // Select strategy based on risk level and requirements
    let strategyType: MigrationStrategy['type'];

    if (riskAssessment.overallRisk === 'critical') {
      strategyType = 'bluegreen'; // Safest option
    } else if (riskAssessment.overallRisk === 'high') {
      strategyType = 'canary'; // Gradual rollout
    } else if (options.requireZeroDowntime) {
      strategyType = 'rolling'; // Zero downtime
    } else {
      strategyType = 'bigbang'; // Fast migration
    }

    return {
      type: strategyType,
      configuration: await this.getStrategyConfiguration(strategyType, options),
      trafficSplitRatio: this.calculateTrafficSplitRatio(strategyType, riskAssessment),
      validationGates: await this.generateValidationGates(strategyType, riskAssessment),
      rollbackTriggers: await this.generateRollbackTriggers(strategyType, riskAssessment)
    };
  }

  private async generateMigrationPhases(
    sourceVersion: string,
    targetVersion: string,
    strategy: MigrationStrategy,
    options: MigrationPlanOptions
  ): Promise<MigrationPhase[]> {
    const phases: MigrationPhase[] = [];

    // Phase 1: Preparation
    phases.push({
      id: 'preparation',
      name: 'Migration Preparation',
      order: 1,
      type: 'preparation',
      steps: [
        {
          id: 'backup',
          name: 'Create System Backup',
          action: 'backup.create',
          parameters: { version: sourceVersion },
          timeout: 300000, // 5 minutes
          retryPolicy: { maxRetries: 3, backoffMs: 5000 },
          validationChecks: [
            { type: 'backup.integrity', threshold: 100 },
            { type: 'backup.completeness', threshold: 100 }
          ]
        },
        {
          id: 'validate_target',
          name: 'Validate Target Version',
          action: 'version.validate',
          parameters: { version: targetVersion },
          timeout: 60000,
          retryPolicy: { maxRetries: 2, backoffMs: 2000 },
          validationChecks: [
            { type: 'version.availability', threshold: 100 },
            { type: 'version.integrity', threshold: 100 }
          ]
        }
      ],
      prerequisites: [],
      rollbackPoint: true,
      estimatedDuration: 360000, // 6 minutes
      criticalityLevel: 'critical'
    });

    // Phase 2: Execution (strategy-specific)
    phases.push(await this.generateExecutionPhase(strategy, sourceVersion, targetVersion));

    // Phase 3: Validation
    phases.push({
      id: 'validation',
      name: 'Migration Validation',
      order: 3,
      type: 'validation',
      steps: [
        {
          id: 'functional_test',
          name: 'Functional Testing',
          action: 'test.functional',
          parameters: { comprehensive: true },
          timeout: 600000, // 10 minutes
          retryPolicy: { maxRetries: 1, backoffMs: 10000 },
          validationChecks: [
            { type: 'test.success_rate', threshold: 95 },
            { type: 'test.coverage', threshold: 80 }
          ]
        },
        {
          id: 'performance_test',
          name: 'Performance Testing',
          action: 'test.performance',
          parameters: { duration: 300000 }, // 5 minutes
          timeout: 360000,
          retryPolicy: { maxRetries: 1, backoffMs: 5000 },
          validationChecks: [
            { type: 'performance.latency', threshold: 200 },
            { type: 'performance.throughput', threshold: 90 }
          ]
        }
      ],
      prerequisites: ['preparation'],
      rollbackPoint: true,
      estimatedDuration: 960000, // 16 minutes
      criticalityLevel: 'high'
    });

    // Phase 4: Cleanup
    phases.push({
      id: 'cleanup',
      name: 'Migration Cleanup',
      order: 4,
      type: 'cleanup',
      steps: [
        {
          id: 'remove_old_version',
          name: 'Remove Old Version',
          action: 'version.cleanup',
          parameters: { version: sourceVersion, keepBackup: true },
          timeout: 120000,
          retryPolicy: { maxRetries: 2, backoffMs: 5000 },
          validationChecks: [
            { type: 'cleanup.completeness', threshold: 90 }
          ]
        }
      ],
      prerequisites: ['validation'],
      rollbackPoint: false,
      estimatedDuration: 120000, // 2 minutes
      criticalityLevel: 'low'
    });

    return phases;
  }

  private async generateExecutionPhase(
    strategy: MigrationStrategy,
    sourceVersion: string,
    targetVersion: string
  ): Promise<MigrationPhase> {
    const basePhase: MigrationPhase = {
      id: 'execution',
      name: 'Migration Execution',
      order: 2,
      type: 'execution',
      steps: [],
      prerequisites: ['preparation'],
      rollbackPoint: true,
      estimatedDuration: 0,
      criticalityLevel: 'critical'
    };

    switch (strategy.type) {
      case 'bluegreen':
        basePhase.steps = [
          {
            id: 'deploy_green',
            name: 'Deploy Green Environment',
            action: 'deploy.green',
            parameters: { version: targetVersion },
            timeout: 600000, // 10 minutes
            retryPolicy: { maxRetries: 2, backoffMs: 10000 },
            validationChecks: [
              { type: 'deployment.success', threshold: 100 },
              { type: 'health.check', threshold: 100 }
            ]
          },
          {
            id: 'cutover_traffic',
            name: 'Cutover Traffic',
            action: 'traffic.cutover',
            parameters: { from: 'blue', to: 'green' },
            timeout: 60000,
            retryPolicy: { maxRetries: 1, backoffMs: 5000 },
            validationChecks: [
              { type: 'traffic.distribution', threshold: 95 }
            ]
          }
        ];
        basePhase.estimatedDuration = 660000; // 11 minutes
        break;

      case 'canary':
        basePhase.steps = [
          {
            id: 'deploy_canary',
            name: 'Deploy Canary',
            action: 'deploy.canary',
            parameters: {
              version: targetVersion,
              trafficRatio: strategy.trafficSplitRatio || 10
            },
            timeout: 300000, // 5 minutes
            retryPolicy: { maxRetries: 2, backoffMs: 5000 },
            validationChecks: [
              { type: 'deployment.success', threshold: 100 },
              { type: 'canary.health', threshold: 100 }
            ]
          },
          {
            id: 'monitor_canary',
            name: 'Monitor Canary',
            action: 'monitor.canary',
            parameters: { duration: 600000 }, // 10 minutes
            timeout: 660000,
            retryPolicy: { maxRetries: 0 },
            validationChecks: [
              { type: 'canary.error_rate', threshold: 1 },
              { type: 'canary.performance', threshold: 95 }
            ]
          },
          {
            id: 'promote_canary',
            name: 'Promote Canary',
            action: 'canary.promote',
            parameters: {},
            timeout: 180000, // 3 minutes
            retryPolicy: { maxRetries: 1, backoffMs: 5000 },
            validationChecks: [
              { type: 'promotion.success', threshold: 100 }
            ]
          }
        ];
        basePhase.estimatedDuration = 1140000; // 19 minutes
        break;

      case 'rolling':
        basePhase.steps = [
          {
            id: 'rolling_update',
            name: 'Rolling Update',
            action: 'deploy.rolling',
            parameters: {
              version: targetVersion,
              batchSize: strategy.configuration.batchSize || 1
            },
            timeout: 900000, // 15 minutes
            retryPolicy: { maxRetries: 1, backoffMs: 10000 },
            validationChecks: [
              { type: 'rolling.progress', threshold: 100 },
              { type: 'rolling.health', threshold: 95 }
            ]
          }
        ];
        basePhase.estimatedDuration = 900000; // 15 minutes
        break;

      default:
        basePhase.steps = [
          {
            id: 'deploy_new_version',
            name: 'Deploy New Version',
            action: 'deploy.replace',
            parameters: { version: targetVersion },
            timeout: 300000, // 5 minutes
            retryPolicy: { maxRetries: 2, backoffMs: 5000 },
            validationChecks: [
              { type: 'deployment.success', threshold: 100 }
            ]
          }
        ];
        basePhase.estimatedDuration = 300000; // 5 minutes
    }

    return basePhase;
  }

  private async executeRollback(
    execution: MigrationExecution,
    error: Error,
    options: RollbackOptions = {}
  ): Promise<RollbackResult> {
    this.logger.warn('Executing migration rollback', {
      executionId: execution.id,
      reason: error.message
    });

    this.emit('rollbackStarted', execution, error);

    try {
      const rollbackResult = await this.orchestrator.executeRollback(
        execution.plan.rollbackStrategy,
        execution,
        error
      );

      this.emit('rollbackCompleted', execution, rollbackResult);
      return rollbackResult;
    } catch (rollbackError) {
      this.logger.error('Rollback failed', {
        executionId: execution.id,
        originalError: error.message,
        rollbackError: rollbackError.message
      });

      this.emit('rollbackFailed', execution, rollbackError);
      throw rollbackError;
    }
  }

  private generateMigrationId(): string {
    return `migration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMetrics(): MigrationMetrics {
    return {
      startTime: new Date(),
      downtime: 0,
      successRate: 0,
      performance: {
        latency: 0,
        throughput: 0,
        errorRate: 0
      },
      errors: [],
      trafficMetrics: {
        requestsPerSecond: 0,
        responseTime: 0,
        successRate: 0
      }
    };
  }

  private calculateProgress(execution: MigrationExecution): number {
    return (execution.currentPhase / execution.plan.phases.length) * 100;
  }

  private estimateCompletion(execution: MigrationExecution): Date {
    const elapsed = Date.now() - execution.startTime.getTime();
    const progress = this.calculateProgress(execution);
    const totalEstimate = (elapsed / progress) * 100;
    return new Date(execution.startTime.getTime() + totalEstimate);
  }

  private async handlePhaseComplete(
    execution: MigrationExecution,
    phase: MigrationPhase,
    result: PhaseResult
  ): Promise<void> {
    execution.currentPhase++;
    execution.completedPhases = execution.completedPhases || [];
    execution.completedPhases.push(phase.id);

    this.emit('phaseCompleted', execution, phase, result);
  }

  private async handlePhaseError(
    execution: MigrationExecution,
    phase: MigrationPhase,
    error: Error
  ): Promise<void> {
    this.logger.error('Migration phase failed', {
      executionId: execution.id,
      phaseId: phase.id,
      error: error.message
    });

    this.emit('phaseError', execution, phase, error);
  }
}

// Supporting interfaces and types
interface MigrationPlanOptions {
  name?: string;
  requireZeroDowntime?: boolean;
  maxDowntime?: number;
  trafficLoad?: number;
  customValidation?: ValidationRule[];
}

interface ExecutionOptions {
  dryRun?: boolean;
  skipValidation?: boolean;
  customTimeout?: number;
}

interface RollbackOptions {
  targetPhase?: string;
  preserveData?: boolean;
  notifyUsers?: boolean;
}

interface MigrationExecution {
  id: string;
  plan: MigrationPlan;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolling_back';
  startTime: Date;
  endTime?: Date;
  currentPhase: number;
  completedPhases?: string[];
  metrics: MigrationMetrics;
  context: Map<string, any>;
}

interface ValidationResult {
  compatible: boolean;
  reason?: string;
  warnings?: string[];
  recommendations?: string[];
}

interface MigrationStatus {
  executionId: string;
  status: string;
  currentPhase: number;
  totalPhases: number;
  progress: number;
  metrics: MigrationMetrics;
  estimatedCompletion: Date;
}

interface RollbackResult {
  success: boolean;
  artifacts: MigrationArtifact[];
  restoredState: string;
  timestamp: Date;
}

interface PhaseResult {
  success: boolean;
  artifacts: MigrationArtifact[];
  metrics: Record<string, any>;
}

interface RiskFactor {
  type: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
}

interface RiskMitigation {
  riskType: string;
  strategy: string;
  implementation: string;
}

interface ContingencyPlan {
  trigger: string;
  actions: string[];
  contacts: string[];
}

interface BusinessImpact {
  downtime: number;
  affectedUsers: number;
  revenue: number;
  criticalSystems: string[];
}

interface ValidationCriteria {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number | string;
}

interface ValidationGate {
  id: string;
  name: string;
  criteria: ValidationCriteria[];
  mandatory: boolean;
}

interface RollbackTrigger {
  condition: string;
  threshold: number;
  action: 'automatic' | 'manual';
}

interface MigrationTimeline {
  totalDuration: number;
  phases: { id: string; duration: number; startOffset: number }[];
  criticalPath: string[];
}

interface RollbackStrategy {
  type: 'automatic' | 'manual' | 'hybrid';
  triggers: RollbackTrigger[];
  steps: MigrationStep[];
  maxRollbackTime: number;
}

interface MigrationDependency {
  id: string;
  type: 'service' | 'database' | 'configuration' | 'external';
  name: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  migrationRequired: boolean;
}

interface FallbackProtocol {
  id: string;
  name: string;
  priority: number;
  activationCriteria: string[];
  configuration: Record<string, any>;
}

interface MigrationArtifact {
  type: string;
  name: string;
  path: string;
  checksum: string;
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

interface PerformanceMetrics {
  latency: number;
  throughput: number;
  errorRate: number;
}

interface ErrorMetric {
  type: string;
  count: number;
  lastOccurrence: Date;
}

interface TrafficMetrics {
  requestsPerSecond: number;
  responseTime: number;
  successRate: number;
}

export default MigrationPlanner;