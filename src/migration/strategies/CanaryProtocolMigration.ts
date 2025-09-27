import { EventEmitter } from 'events';
import { Logger } from '../../utils/Logger';

export interface CanaryConfig {
  canaryEnvironment: EnvironmentConfig;
  productionEnvironment: EnvironmentConfig;
  trafficSplitting: TrafficSplittingConfig;
  progressionStages: ProgressionStage[];
  validationRules: CanaryValidationRule[];
  rollbackPolicy: CanaryRollbackPolicy;
  observabilityConfig: ObservabilityConfig;
}

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

export interface CanaryValidationRule {
  name: string;
  type: 'sli' | 'error_budget' | 'custom';
  metric: string;
  target: number;
  tolerance: number;
  evaluationWindow: number;
  weight: number;
}

export interface CanaryResult {
  success: boolean;
  completedStages: number;
  totalStages: number;
  finalTrafficPercentage: number;
  migrationTime: number;
  rollbackExecuted: boolean;
  stageResults: StageResult[];
  metrics: CanaryMetrics;
  insights: CanaryInsight[];
}

export interface StageResult {
  stage: number;
  name: string;
  success: boolean;
  trafficPercentage: number;
  duration: number;
  validationResults: ValidationResult[];
  metrics: StageMetrics;
  rollbackReason?: string;
}

export interface CanaryMetrics {
  totalDuration: number;
  trafficProgression: TrafficProgressionMetric[];
  errorRateComparison: ErrorRateComparison;
  latencyComparison: LatencyComparison;
  throughputComparison: ThroughputComparison;
  businessMetrics: BusinessMetric[];
  resourceUtilization: ResourceUtilization;
}

export interface CanaryInsight {
  type: 'performance' | 'reliability' | 'cost' | 'user_experience';
  message: string;
  confidence: number;
  recommendation?: string;
  evidence: InsightEvidence[];
}

export class CanaryProtocolMigration extends EventEmitter {
  private logger: Logger;
  private config: CanaryConfig;
  private currentState: CanaryState;
  private currentStage: number;
  private trafficPercentage: number;
  private deploymentHistory: CanaryDeployment[];
  private metricsCollector: CanaryMetricsCollector;
  private progressionTimer: NodeJS.Timeout | null;

  constructor(config: CanaryConfig) {
    super();
    this.logger = new Logger('CanaryProtocolMigration');
    this.config = config;
    this.currentState = 'idle';
    this.currentStage = 0;
    this.trafficPercentage = 0;
    this.deploymentHistory = [];
    this.metricsCollector = new CanaryMetricsCollector(config.observabilityConfig);
    this.progressionTimer = null;
  }

  async executeMigration(
    sourceVersion: string,
    targetVersion: string,
    migrationPlan: MigrationPlan
  ): Promise<CanaryResult> {
    const startTime = Date.now();
    const deploymentId = this.generateDeploymentId();

    this.logger.info('Starting Canary migration', {
      deploymentId,
      sourceVersion,
      targetVersion,
      stages: this.config.progressionStages.length
    });

    this.currentState = 'preparing';
    this.emit('canaryStarted', { deploymentId, sourceVersion, targetVersion });

    try {
      // Phase 1: Deploy to Canary Environment
      await this.deployToCanary(targetVersion, migrationPlan);

      // Phase 2: Initialize Traffic Splitting
      await this.initializeTrafficSplitting();

      // Phase 3: Progressive Rollout
      const stageResults = await this.executeProgressiveRollout();

      // Phase 4: Final Validation and Full Rollout
      const finalResult = await this.executeFinalRollout();

      // Phase 5: Cleanup
      await this.cleanupCanaryEnvironment();

      const totalDuration = Date.now() - startTime;

      const result: CanaryResult = {
        success: true,
        completedStages: this.config.progressionStages.length,
        totalStages: this.config.progressionStages.length,
        finalTrafficPercentage: 100,
        migrationTime: totalDuration,
        rollbackExecuted: false,
        stageResults,
        metrics: await this.generateCanaryMetrics(stageResults, totalDuration),
        insights: await this.generateCanaryInsights(stageResults)
      };

      this.recordDeployment({
        id: deploymentId,
        sourceVersion,
        targetVersion,
        result,
        timestamp: new Date()
      });

      this.currentState = 'completed';
      this.emit('canaryCompleted', result);

      return result;

    } catch (error) {
      this.logger.error('Canary migration failed', {
        deploymentId,
        stage: this.currentStage,
        trafficPercentage: this.trafficPercentage,
        error: error.message
      });

      // Execute rollback
      const rollbackResult = await this.executeRollback(deploymentId, error);

      const result: CanaryResult = {
        success: false,
        completedStages: this.currentStage,
        totalStages: this.config.progressionStages.length,
        finalTrafficPercentage: this.trafficPercentage,
        migrationTime: Date.now() - startTime,
        rollbackExecuted: rollbackResult.success,
        stageResults: [],
        metrics: await this.generateCanaryMetrics([], Date.now() - startTime),
        insights: []
      };

      this.currentState = 'failed';
      this.emit('canaryFailed', result, error);

      return result;
    }
  }

  async deployToCanary(
    targetVersion: string,
    migrationPlan: MigrationPlan
  ): Promise<void> {
    this.logger.info('Deploying to canary environment', { targetVersion });
    this.currentState = 'deploying_canary';

    // Scale canary environment to handle initial traffic
    await this.scaleCanaryEnvironment(this.config.trafficSplitting.initialPercentage);

    // Deploy application to canary
    const deploymentResult = await this.deployApplication(
      this.config.canaryEnvironment,
      targetVersion,
      migrationPlan
    );

    // Warm up canary environment
    await this.warmupCanaryEnvironment();

    // Run canary health checks
    await this.runCanaryHealthChecks();

    this.emit('canaryDeployed', {
      environment: this.config.canaryEnvironment,
      version: targetVersion,
      healthStatus: 'healthy'
    });
  }

  async initializeTrafficSplitting(): Promise<void> {
    this.logger.info('Initializing traffic splitting');
    this.currentState = 'initializing_traffic';

    // Configure traffic splitting infrastructure
    await this.configureTrafficSplitting();

    // Start with 0% traffic to canary
    await this.setTrafficPercentage(0);

    // Initialize metrics collection
    await this.metricsCollector.start();

    this.emit('trafficSplittingInitialized', {
      method: this.config.trafficSplitting.method,
      initialPercentage: 0
    });
  }

  async executeProgressiveRollout(): Promise<StageResult[]> {
    this.logger.info('Starting progressive rollout');
    this.currentState = 'progressive_rollout';

    const stageResults: StageResult[] = [];

    for (let i = 0; i < this.config.progressionStages.length; i++) {
      const stage = this.config.progressionStages[i];
      this.currentStage = i + 1;

      this.logger.info('Executing canary stage', {
        stage: stage.stage,
        name: stage.name,
        trafficPercentage: stage.trafficPercentage
      });

      try {
        const stageResult = await this.executeStage(stage);
        stageResults.push(stageResult);

        if (!stageResult.success) {
          throw new Error(`Stage ${stage.stage} failed: ${stageResult.rollbackReason}`);
        }

        // Wait for manual approval if required
        if (stage.manualApprovalRequired) {
          await this.waitForManualApproval(stage);
        }

      } catch (error) {
        const failedStageResult: StageResult = {
          stage: stage.stage,
          name: stage.name,
          success: false,
          trafficPercentage: this.trafficPercentage,
          duration: 0,
          validationResults: [],
          metrics: await this.collectStageMetrics(),
          rollbackReason: error.message
        };

        stageResults.push(failedStageResult);
        throw error;
      }
    }

    return stageResults;
  }

  async executeStage(stage: ProgressionStage): Promise<StageResult> {
    const stageStartTime = Date.now();

    this.emit('stageStarted', {
      stage: stage.stage,
      name: stage.name,
      trafficPercentage: stage.trafficPercentage
    });

    // Gradually increase traffic to target percentage
    await this.progressToTrafficPercentage(stage.trafficPercentage);

    // Monitor stage for specified duration
    const validationResults = await this.monitorStage(stage);

    // Evaluate success criteria
    const stageSuccess = this.evaluateStageSuccess(stage, validationResults);

    const stageDuration = Date.now() - stageStartTime;

    const stageResult: StageResult = {
      stage: stage.stage,
      name: stage.name,
      success: stageSuccess,
      trafficPercentage: stage.trafficPercentage,
      duration: stageDuration,
      validationResults,
      metrics: await this.collectStageMetrics()
    };

    if (!stageSuccess) {
      // Check rollback triggers
      const rollbackTrigger = this.checkRollbackTriggers(stage, validationResults);
      if (rollbackTrigger) {
        stageResult.rollbackReason = rollbackTrigger.condition;

        if (rollbackTrigger.automatic) {
          throw new Error(`Automatic rollback triggered: ${rollbackTrigger.condition}`);
        }
      }
    }

    this.emit('stageCompleted', stageResult);
    return stageResult;
  }

  async progressToTrafficPercentage(targetPercentage: number): Promise<void> {
    const currentPercentage = this.trafficPercentage;
    const steps = this.calculateProgressionSteps(currentPercentage, targetPercentage);

    for (const step of steps) {
      await this.setTrafficPercentage(step.percentage);
      await new Promise(resolve => setTimeout(resolve, step.duration));

      // Monitor for immediate issues
      const quickValidation = await this.runQuickValidation();
      if (!quickValidation.passed) {
        throw new Error(`Quick validation failed at ${step.percentage}%: ${quickValidation.reason}`);
      }
    }

    this.trafficPercentage = targetPercentage;
  }

  async monitorStage(stage: ProgressionStage): Promise<ValidationResult[]> {
    const monitoringStart = Date.now();
    const validationResults: ValidationResult[] = [];

    // Set up continuous monitoring
    const monitoringInterval = setInterval(async () => {
      for (const criteria of stage.successCriteria) {
        try {
          const result = await this.validateCriteria(criteria);
          validationResults.push(result);

          // Check for immediate rollback triggers
          if (this.shouldTriggerImmediateRollback(result, stage.rollbackTriggers)) {
            clearInterval(monitoringInterval);
            throw new Error(`Immediate rollback triggered: ${result.name}`);
          }

        } catch (error) {
          const failedResult: ValidationResult = {
            name: criteria.metric,
            type: 'criteria_validation',
            passed: false,
            value: null,
            threshold: criteria.threshold,
            message: error.message,
            timestamp: new Date()
          };
          validationResults.push(failedResult);
        }
      }
    }, 30000); // Check every 30 seconds

    // Wait for stage duration
    await new Promise(resolve => setTimeout(resolve, stage.duration));
    clearInterval(monitoringInterval);

    // Run final validation
    const finalValidationResults = await this.runFinalStageValidation(stage);
    validationResults.push(...finalValidationResults);

    return validationResults;
  }

  async executeFinalRollout(): Promise<FinalRolloutResult> {
    this.logger.info('Executing final rollout to 100%');
    this.currentState = 'final_rollout';

    // Gradually move to 100% canary traffic
    await this.progressToTrafficPercentage(100);

    // Run comprehensive validation
    const finalValidation = await this.runComprehensiveValidation();

    if (!finalValidation.passed) {
      throw new Error(`Final validation failed: ${finalValidation.reason}`);
    }

    // Update production environment to canary version
    await this.promoteCanaryToProduction();

    this.emit('finalRolloutCompleted', {
      trafficPercentage: 100,
      validationPassed: true
    });

    return {
      success: true,
      finalTrafficPercentage: 100,
      validationResults: finalValidation.results
    };
  }

  async executeRollback(
    deploymentId: string,
    reason: Error
  ): Promise<CanaryRollbackResult> {
    this.logger.warn('Executing canary rollback', {
      deploymentId,
      stage: this.currentStage,
      trafficPercentage: this.trafficPercentage,
      reason: reason.message
    });

    this.currentState = 'rolling_back';
    this.emit('rollbackStarted', { deploymentId, reason: reason.message });

    const rollbackStart = Date.now();

    try {
      // Immediately redirect traffic back to production
      await this.setTrafficPercentage(0);

      // Stop metrics collection
      await this.metricsCollector.stop();

      // Clean up canary environment
      await this.cleanupCanaryEnvironment();

      // Validate production stability
      await this.validateProductionStability();

      const rollbackDuration = Date.now() - rollbackStart;

      this.currentState = 'rolled_back';
      this.emit('rollbackCompleted', {
        deploymentId,
        rollbackDuration,
        success: true
      });

      return {
        success: true,
        rollbackDuration,
        trafficRedirected: true,
        cleanupCompleted: true
      };

    } catch (rollbackError) {
      this.logger.error('Rollback failed', {
        deploymentId,
        originalError: reason.message,
        rollbackError: rollbackError.message
      });

      this.currentState = 'rollback_failed';
      this.emit('rollbackFailed', {
        deploymentId,
        originalError: reason.message,
        rollbackError: rollbackError.message
      });

      return {
        success: false,
        rollbackDuration: Date.now() - rollbackStart,
        trafficRedirected: false,
        cleanupCompleted: false
      };
    }
  }

  async getCurrentState(): Promise<CanaryStatus> {
    return {
      state: this.currentState,
      currentStage: this.currentStage,
      totalStages: this.config.progressionStages.length,
      trafficPercentage: this.trafficPercentage,
      canaryEnvironment: await this.getEnvironmentStatus(this.config.canaryEnvironment),
      productionEnvironment: await this.getEnvironmentStatus(this.config.productionEnvironment),
      metrics: await this.metricsCollector.getCurrentMetrics(),
      lastDeployment: this.getLastDeployment()
    };
  }

  async pauseRollout(): Promise<void> {
    this.logger.info('Pausing canary rollout');
    this.currentState = 'paused';

    if (this.progressionTimer) {
      clearTimeout(this.progressionTimer);
      this.progressionTimer = null;
    }

    this.emit('rolloutPaused', {
      stage: this.currentStage,
      trafficPercentage: this.trafficPercentage
    });
  }

  async resumeRollout(): Promise<void> {
    this.logger.info('Resuming canary rollout');
    this.currentState = 'progressive_rollout';

    this.emit('rolloutResumed', {
      stage: this.currentStage,
      trafficPercentage: this.trafficPercentage
    });
  }

  // Private helper methods
  private async scaleCanaryEnvironment(trafficPercentage: number): Promise<void> {
    // Calculate required capacity based on traffic percentage
    const requiredCapacity = Math.max(1, Math.ceil(trafficPercentage / 10));
    this.logger.debug('Scaling canary environment', { requiredCapacity });
  }

  private async deployApplication(
    environment: EnvironmentConfig,
    version: string,
    migrationPlan: MigrationPlan
  ): Promise<DeploymentResult> {
    // Implementation for application deployment
    return {
      success: true,
      artifacts: [],
      version
    };
  }

  private async warmupCanaryEnvironment(): Promise<void> {
    // Implementation for warming up canary environment
    this.logger.debug('Warming up canary environment');
  }

  private async runCanaryHealthChecks(): Promise<void> {
    // Implementation for canary health checks
    this.logger.debug('Running canary health checks');
  }

  private async configureTrafficSplitting(): Promise<void> {
    // Implementation for traffic splitting configuration
    this.logger.debug('Configuring traffic splitting');
  }

  private async setTrafficPercentage(percentage: number): Promise<void> {
    // Implementation for setting traffic percentage
    this.logger.debug('Setting traffic percentage', { percentage });
    this.trafficPercentage = percentage;
  }

  private calculateProgressionSteps(
    currentPercentage: number,
    targetPercentage: number
  ): ProgressionStep[] {
    const steps: ProgressionStep[] = [];
    const stepSize = 5; // 5% increments
    const stepDuration = 30000; // 30 seconds per step

    for (let p = currentPercentage + stepSize; p <= targetPercentage; p += stepSize) {
      steps.push({
        percentage: Math.min(p, targetPercentage),
        duration: stepDuration
      });
    }

    return steps;
  }

  private async runQuickValidation(): Promise<QuickValidationResult> {
    // Implementation for quick validation
    return {
      passed: true,
      reason: 'All checks passed'
    };
  }

  private async validateCriteria(criteria: SuccessCriteria): Promise<ValidationResult> {
    // Implementation for criteria validation
    return {
      name: criteria.metric,
      type: 'success_criteria',
      passed: true,
      value: 100,
      threshold: criteria.threshold,
      message: 'Criteria met',
      timestamp: new Date()
    };
  }

  private shouldTriggerImmediateRollback(
    result: ValidationResult,
    triggers: RollbackTrigger[]
  ): boolean {
    // Implementation for immediate rollback trigger checking
    return false;
  }

  private async runFinalStageValidation(stage: ProgressionStage): Promise<ValidationResult[]> {
    // Implementation for final stage validation
    return [];
  }

  private evaluateStageSuccess(
    stage: ProgressionStage,
    validationResults: ValidationResult[]
  ): boolean {
    // Implementation for stage success evaluation
    const passedCriteria = validationResults.filter(r => r.passed).length;
    const mandatoryCriteria = stage.successCriteria.filter(c => c.mandatory).length;
    const passedMandatory = validationResults.filter(r =>
      r.passed && stage.successCriteria.find(c => c.metric === r.name)?.mandatory
    ).length;

    return passedMandatory === mandatoryCriteria &&
           passedCriteria >= stage.successCriteria.length * 0.8;
  }

  private checkRollbackTriggers(
    stage: ProgressionStage,
    validationResults: ValidationResult[]
  ): RollbackTrigger | null {
    // Implementation for rollback trigger checking
    return null;
  }

  private async collectStageMetrics(): Promise<StageMetrics> {
    // Implementation for stage metrics collection
    return {
      errorRate: 0.1,
      latency: 100,
      throughput: 1000,
      cpuUsage: 50,
      memoryUsage: 60
    };
  }

  private async waitForManualApproval(stage: ProgressionStage): Promise<void> {
    // Implementation for manual approval waiting
    this.logger.info('Waiting for manual approval', { stage: stage.stage });
  }

  private async runComprehensiveValidation(): Promise<ComprehensiveValidationResult> {
    // Implementation for comprehensive validation
    return {
      passed: true,
      reason: 'All validations passed',
      results: []
    };
  }

  private async promoteCanaryToProduction(): Promise<void> {
    // Implementation for promoting canary to production
    this.logger.debug('Promoting canary to production');
  }

  private async cleanupCanaryEnvironment(): Promise<void> {
    // Implementation for canary environment cleanup
    this.logger.debug('Cleaning up canary environment');
  }

  private async validateProductionStability(): Promise<void> {
    // Implementation for production stability validation
    this.logger.debug('Validating production stability');
  }

  private async getEnvironmentStatus(environment: EnvironmentConfig): Promise<EnvironmentStatus> {
    // Implementation for getting environment status
    return {
      id: environment.id,
      name: environment.name,
      status: 'healthy',
      version: '1.0.0',
      uptime: 99.9,
      lastHealthCheck: new Date()
    };
  }

  private async generateCanaryMetrics(
    stageResults: StageResult[],
    totalDuration: number
  ): Promise<CanaryMetrics> {
    // Implementation for generating canary metrics
    return {
      totalDuration,
      trafficProgression: [],
      errorRateComparison: { canary: 0.1, production: 0.1, difference: 0 },
      latencyComparison: { canary: 100, production: 100, difference: 0 },
      throughputComparison: { canary: 1000, production: 1000, difference: 0 },
      businessMetrics: [],
      resourceUtilization: { cpu: 50, memory: 60, network: 40 }
    };
  }

  private async generateCanaryInsights(stageResults: StageResult[]): Promise<CanaryInsight[]> {
    // Implementation for generating canary insights
    return [];
  }

  private generateDeploymentId(): string {
    return `canary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private recordDeployment(deployment: CanaryDeployment): void {
    this.deploymentHistory.push(deployment);
    // Keep only last 100 deployments
    if (this.deploymentHistory.length > 100) {
      this.deploymentHistory = this.deploymentHistory.slice(-100);
    }
  }

  private getLastDeployment(): CanaryDeployment | undefined {
    return this.deploymentHistory[this.deploymentHistory.length - 1];
  }
}

// Supporting classes and interfaces
class CanaryMetricsCollector {
  constructor(private config: ObservabilityConfig) {}

  async start(): Promise<void> {
    // Implementation for starting metrics collection
  }

  async stop(): Promise<void> {
    // Implementation for stopping metrics collection
  }

  async getCurrentMetrics(): Promise<CurrentMetrics> {
    // Implementation for getting current metrics
    return {
      canaryMetrics: {},
      productionMetrics: {},
      comparison: {}
    };
  }
}

// Supporting interfaces
interface MigrationPlan {
  configuration: any;
  databaseMigrations?: any[];
}

interface EnvironmentConfig {
  id: string;
  name: string;
  endpoint: string;
  capacity: any;
}

interface CanaryRollbackPolicy {
  automaticRollback: boolean;
  rollbackTimeout: number;
  preserveData: boolean;
}

interface ObservabilityConfig {
  metricsEndpoints: string[];
  alertingRules: AlertingRule[];
  dashboards: DashboardConfig[];
}

interface AlertingRule {
  name: string;
  condition: string;
  severity: 'warning' | 'critical';
}

interface DashboardConfig {
  name: string;
  panels: PanelConfig[];
}

interface PanelConfig {
  title: string;
  query: string;
  visualization: string;
}

interface ValidationResult {
  name: string;
  type: string;
  passed: boolean;
  value: any;
  threshold: number;
  message: string;
  timestamp: Date;
}

interface StageMetrics {
  errorRate: number;
  latency: number;
  throughput: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface ProgressionStep {
  percentage: number;
  duration: number;
}

interface QuickValidationResult {
  passed: boolean;
  reason: string;
}

interface FinalRolloutResult {
  success: boolean;
  finalTrafficPercentage: number;
  validationResults: ValidationResult[];
}

interface CanaryRollbackResult {
  success: boolean;
  rollbackDuration: number;
  trafficRedirected: boolean;
  cleanupCompleted: boolean;
}

interface ComprehensiveValidationResult {
  passed: boolean;
  reason: string;
  results: ValidationResult[];
}

interface CanaryStatus {
  state: CanaryState;
  currentStage: number;
  totalStages: number;
  trafficPercentage: number;
  canaryEnvironment: EnvironmentStatus;
  productionEnvironment: EnvironmentStatus;
  metrics: CurrentMetrics;
  lastDeployment?: CanaryDeployment;
}

interface EnvironmentStatus {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  lastHealthCheck: Date;
}

interface CurrentMetrics {
  canaryMetrics: Record<string, any>;
  productionMetrics: Record<string, any>;
  comparison: Record<string, any>;
}

interface CanaryDeployment {
  id: string;
  sourceVersion: string;
  targetVersion: string;
  result: CanaryResult;
  timestamp: Date;
}

interface TrafficProgressionMetric {
  timestamp: Date;
  percentage: number;
  metrics: Record<string, number>;
}

interface ErrorRateComparison {
  canary: number;
  production: number;
  difference: number;
}

interface LatencyComparison {
  canary: number;
  production: number;
  difference: number;
}

interface ThroughputComparison {
  canary: number;
  production: number;
  difference: number;
}

interface BusinessMetric {
  name: string;
  canaryValue: number;
  productionValue: number;
  difference: number;
  impact: 'positive' | 'negative' | 'neutral';
}

interface ResourceUtilization {
  cpu: number;
  memory: number;
  network: number;
}

interface InsightEvidence {
  metric: string;
  value: number;
  comparison: number;
  significance: number;
}

interface DeploymentResult {
  success: boolean;
  artifacts: any[];
  version: string;
}

type CanaryState =
  | 'idle'
  | 'preparing'
  | 'deploying_canary'
  | 'initializing_traffic'
  | 'progressive_rollout'
  | 'final_rollout'
  | 'completed'
  | 'paused'
  | 'rolling_back'
  | 'rolled_back'
  | 'rollback_failed'
  | 'failed';

export default CanaryProtocolMigration;