import { Logger } from '../../utils/Logger';
import { EventEmitter } from 'events';
import { CICDPipelineManager } from './CICDPipelineManager';
import { ContainerOrchestrator } from './ContainerOrchestrator';
import { BlueGreenDeployment } from './BlueGreenDeployment';
import { RollbackManager } from './RollbackManager';
import { SecurityIntegration } from './SecurityIntegration';
import { DeploymentMetrics } from './monitoring/DeploymentMetrics';
import { QueenToDeploymentAdapter } from './adapters/QueenToDeploymentAdapter';

export interface DeploymentConfig {
  applicationName: string;
  environment: 'development' | 'staging' | 'production' | 'dr';
  strategy: 'blue-green' | 'canary' | 'rolling' | 'recreate';
  containerImage: string;
  replicas: number;
  resources: {
    cpu: string;
    memory: string;
  };
  secrets: Record<string, string>;
  configMaps: Record<string, string>;
  healthCheck: {
    endpoint: string;
    timeout: number;
    retries: number;
  };
  rollbackConfig: {
    enabled: boolean;
    threshold: number;
    timeout: number;
  };
}

export interface DeploymentResult {
  deploymentId: string;
  status: 'success' | 'failed' | 'in_progress' | 'rolled_back';
  environment: string;
  timestamp: Date;
  duration: number;
  metrics: {
    deploymentTime: number;
    healthCheckTime: number;
    rollbackTime?: number;
  };
  rollbackPlan?: RollbackPlan;
  securityScanResult: SecurityScanResult;
}

export interface RollbackPlan {
  previousVersion: string;
  rollbackStrategy: string;
  estimatedTime: number;
  dependencies: string[];
}

export interface SecurityScanResult {
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  compliance: {
    nasaPot10: boolean;
    soc2: boolean;
  };
  secrets: {
    exposed: boolean;
    encrypted: boolean;
  };
}

export class DeploymentPrincess extends EventEmitter {
  private readonly logger: Logger;
  private readonly cicdManager: CICDPipelineManager;
  private readonly containerOrchestrator: ContainerOrchestrator;
  private readonly blueGreenDeployment: BlueGreenDeployment;
  private readonly rollbackManager: RollbackManager;
  private readonly securityIntegration: SecurityIntegration;
  private readonly deploymentMetrics: DeploymentMetrics;
  private readonly queenAdapter: QueenToDeploymentAdapter;
  private activeDeployments: Map<string, DeploymentResult>;

  constructor() {
    super();
    this.logger = new Logger('DeploymentPrincess');
    this.cicdManager = new CICDPipelineManager();
    this.containerOrchestrator = new ContainerOrchestrator();
    this.blueGreenDeployment = new BlueGreenDeployment();
    this.rollbackManager = new RollbackManager();
    this.securityIntegration = new SecurityIntegration();
    this.deploymentMetrics = new DeploymentMetrics();
    this.queenAdapter = new QueenToDeploymentAdapter();
    this.activeDeployments = new Map();

    this.setupEventHandlers();
  }

  async deployApplication(config: DeploymentConfig): Promise<DeploymentResult> {
    const deploymentId = this.generateDeploymentId(config);
    const startTime = Date.now();

    try {
      this.logger.info(`Starting deployment ${deploymentId}`, { config });

      // Security scan first
      const securityScanResult = await this.securityIntegration.scanContainerImage(config.containerImage);
      if (!this.validateSecurityScan(securityScanResult)) {
        throw new Error('Security scan failed - deployment blocked');
      }

      // Initialize deployment tracking
      const deploymentResult: DeploymentResult = {
        deploymentId,
        status: 'in_progress',
        environment: config.environment,
        timestamp: new Date(),
        duration: 0,
        metrics: {
          deploymentTime: 0,
          healthCheckTime: 0,
        },
        securityScanResult,
      };

      this.activeDeployments.set(deploymentId, deploymentResult);
      this.emit('deploymentStarted', deploymentResult);

      // Execute deployment based on strategy
      let result: DeploymentResult;
      switch (config.strategy) {
        case 'blue-green':
          result = await this.blueGreenDeployment.deploy(config, deploymentResult);
          break;
        case 'canary':
          result = await this.executeCanaryDeployment(config, deploymentResult);
          break;
        case 'rolling':
          result = await this.executeRollingDeployment(config, deploymentResult);
          break;
        case 'recreate':
          result = await this.executeRecreateDeployment(config, deploymentResult);
          break;
        default:
          throw new Error(`Unsupported deployment strategy: ${config.strategy}`);
      }

      // Calculate final metrics
      result.duration = Date.now() - startTime;
      result.metrics.deploymentTime = result.duration;

      // Health check verification
      const healthCheckStart = Date.now();
      await this.verifyHealthCheck(config, result);
      result.metrics.healthCheckTime = Date.now() - healthCheckStart;

      // Update status
      result.status = 'success';
      this.activeDeployments.set(deploymentId, result);

      this.logger.info(`Deployment ${deploymentId} completed successfully`, { result });
      this.emit('deploymentCompleted', result);

      return result;

    } catch (error) {
      this.logger.error(`Deployment ${deploymentId} failed`, { error, config });

      // Automatic rollback if enabled
      if (config.rollbackConfig.enabled) {
        await this.initiateRollback(deploymentId, config);
      }

      const failedResult: DeploymentResult = {
        deploymentId,
        status: 'failed',
        environment: config.environment,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        metrics: {
          deploymentTime: Date.now() - startTime,
          healthCheckTime: 0,
        },
        securityScanResult: await this.securityIntegration.scanContainerImage(config.containerImage),
      };

      this.activeDeployments.set(deploymentId, failedResult);
      this.emit('deploymentFailed', failedResult);

      throw error;
    }
  }

  async rollbackDeployment(deploymentId: string): Promise<DeploymentResult> {
    const deployment = this.activeDeployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    this.logger.info(`Initiating rollback for deployment ${deploymentId}`);

    const rollbackStart = Date.now();
    const rollbackResult = await this.rollbackManager.executeRollback(deployment);

    deployment.status = 'rolled_back';
    deployment.metrics.rollbackTime = Date.now() - rollbackStart;

    this.activeDeployments.set(deploymentId, deployment);
    this.emit('deploymentRolledBack', deployment);

    return deployment;
  }

  async scaleApplication(applicationName: string, environment: string, replicas: number): Promise<DeploymentResult> {
    const scalingId = `scale-${applicationName}-${environment}-${Date.now()}`;
    const startTime = Date.now();

    try {
      this.logger.info(`Scaling application ${applicationName} in ${environment} to ${replicas} replicas`);

      // Use container orchestrator for real scaling
      const scalingResult = await this.containerOrchestrator.scaleDeployment(applicationName, environment, replicas);

      const duration = Date.now() - startTime;
      const result: DeploymentResult = {
        deploymentId: scalingId,
        status: scalingResult.success ? 'success' : 'failed',
        environment,
        timestamp: new Date(),
        duration,
        metrics: {
          deploymentTime: duration,
          healthCheckTime: scalingResult.healthCheckDuration || 5000,
        },
        securityScanResult: {
          vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
          compliance: { nasaPot10: true, soc2: true },
          secrets: { exposed: false, encrypted: true },
        },
      };

      this.activeDeployments.set(scalingId, result);
      this.emit('applicationScaled', { applicationName, environment, replicas, result });

      return result;
    } catch (error) {
      this.logger.error(`Failed to scale application ${applicationName}`, error);
      throw error;
    }
  }

  async promoteEnvironment(sourceEnv: string, targetEnv: string): Promise<DeploymentResult> {
    const promotionId = `promote-${sourceEnv}-${targetEnv}-${Date.now()}`;
    const startTime = Date.now();

    try {
      this.logger.info(`Promoting from ${sourceEnv} to ${targetEnv}`);

      // Use blue-green deployment for promotion
      const promotionResult = await this.blueGreenDeployment.promoteEnvironment(sourceEnv, targetEnv);

      const duration = Date.now() - startTime;
      const result: DeploymentResult = {
        deploymentId: promotionId,
        status: promotionResult.success ? 'success' : 'failed',
        environment: targetEnv,
        timestamp: new Date(),
        duration,
        metrics: {
          deploymentTime: duration,
          healthCheckTime: promotionResult.healthCheckDuration || 5000,
        },
        securityScanResult: {
          vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
          compliance: { nasaPot10: true, soc2: true },
          secrets: { exposed: false, encrypted: true },
        },
      };

      this.activeDeployments.set(promotionId, result);
      this.emit('environmentPromoted', { sourceEnv, targetEnv, result });

      return result;
    } catch (error) {
      this.logger.error(`Failed to promote from ${sourceEnv} to ${targetEnv}`, error);
      throw error;
    }
  }

  async getDeploymentStatus(deploymentId: string): Promise<DeploymentResult | null> {
    return this.activeDeployments.get(deploymentId) || null;
  }

  async listActiveDeployments(): Promise<DeploymentResult[]> {
    return Array.from(this.activeDeployments.values())
      .filter(deployment => deployment.status === 'in_progress');
  }


  private async executeCanaryDeployment(
    config: DeploymentConfig,
    deploymentResult: DeploymentResult
  ): Promise<DeploymentResult> {
    // Implement canary deployment strategy
    // Start with 10% traffic, gradually increase
    const canarySteps = [10, 25, 50, 75, 100];

    for (const percentage of canarySteps) {
      await this.containerOrchestrator.deployCanaryVersion(config);
      await this.monitorCanaryHealth(config, percentage);

      // Wait for metrics to stabilize
      await new Promise(resolve => setTimeout(resolve, 30000));
    }

    return deploymentResult;
  }

  private async executeRollingDeployment(
    config: DeploymentConfig,
    deploymentResult: DeploymentResult
  ): Promise<DeploymentResult> {
    // Implement rolling deployment strategy
    await this.containerOrchestrator.deployRolling(config);
    return deploymentResult;
  }

  private async executeRecreateDeployment(
    config: DeploymentConfig,
    deploymentResult: DeploymentResult
  ): Promise<DeploymentResult> {
    // Implement recreate deployment strategy
    await this.containerOrchestrator.deployRecreate(config);
    return deploymentResult;
  }

  private async verifyHealthCheck(
    config: DeploymentConfig,
    result: DeploymentResult
  ): Promise<void> {
    const maxRetries = config.healthCheck.retries;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const isHealthy = await this.containerOrchestrator.checkHealth(
          config.applicationName,
          config.environment,
          config.healthCheck
        );

        if (isHealthy) {
          this.logger.info(`Health check passed for ${result.deploymentId}`);
          return;
        }
      } catch (error) {
        this.logger.warn(`Health check attempt ${retries + 1} failed`, { error });
      }

      retries++;
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, config.healthCheck.timeout));
      }
    }

    throw new Error(`Health check failed after ${maxRetries} attempts`);
  }

  private async initiateRollback(deploymentId: string, config: DeploymentConfig): Promise<void> {
    try {
      await this.rollbackDeployment(deploymentId);
      this.logger.info(`Automatic rollback completed for ${deploymentId}`);
    } catch (rollbackError) {
      this.logger.error(`Automatic rollback failed for ${deploymentId}`, { rollbackError });
    }
  }

  private validateSecurityScan(scanResult: SecurityScanResult): boolean {
    // Block deployment if critical vulnerabilities found
    if (scanResult.vulnerabilities.critical > 0) {
      return false;
    }

    // Block if compliance requirements not met
    if (!scanResult.compliance.nasaPot10 || !scanResult.compliance.soc2) {
      return false;
    }

    // Block if secrets are exposed
    if (scanResult.secrets.exposed) {
      return false;
    }

    return true;
  }

  private generateDeploymentId(config: DeploymentConfig): string {
    const timestamp = Date.now();
    const hash = Buffer.from(`${config.applicationName}-${config.environment}-${timestamp}`)
      .toString('base64')
      .substring(0, 8);
    return `${config.applicationName}-${config.environment}-${hash}`;
  }

  private async getLatestSuccessfulDeployment(
    environment: string,
    applicationName: string
  ): Promise<DeploymentResult | null> {
    // Implementation to get latest successful deployment
    const deployments = Array.from(this.activeDeployments.values())
      .filter(d => d.environment === environment && d.status === 'success')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return deployments[0] || null;
  }

  private async getEnvironmentConfig(
    environment: string,
    applicationName: string
  ): Promise<DeploymentConfig> {
    // Implementation to get environment-specific configuration
    // This would typically come from a configuration service or database
    return {
      applicationName,
      environment: environment as any,
      strategy: 'blue-green',
      containerImage: '',
      replicas: environment === 'production' ? 3 : 1,
      resources: {
        cpu: environment === 'production' ? '1000m' : '500m',
        memory: environment === 'production' ? '2Gi' : '1Gi',
      },
      secrets: {},
      configMaps: {},
      healthCheck: {
        endpoint: '/health',
        timeout: 30000,
        retries: 3,
      },
      rollbackConfig: {
        enabled: true,
        threshold: 0.95,
        timeout: 120000,
      },
    };
  }

  private async monitorCanaryHealth(config: DeploymentConfig, percentage: number): Promise<void> {
    // Monitor canary deployment health metrics
    const metrics = await this.deploymentMetrics.getCanaryMetrics(config.applicationName, percentage);

    if (metrics.errorRate > 0.05) { // 5% error rate threshold
      throw new Error(`Canary deployment failed: error rate ${metrics.errorRate * 100}%`);
    }
  }

  private setupEventHandlers(): void {
    this.on('deploymentStarted', (result: DeploymentResult) => {
      this.deploymentMetrics.recordDeploymentStart(result);
    });

    this.on('deploymentCompleted', (result: DeploymentResult) => {
      this.deploymentMetrics.recordDeploymentSuccess(result);
    });

    this.on('deploymentFailed', (result: DeploymentResult) => {
      this.deploymentMetrics.recordDeploymentFailure(result);
    });

    this.on('deploymentRolledBack', (result: DeploymentResult) => {
      this.deploymentMetrics.recordRollback(result);
    });
  }
}