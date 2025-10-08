import { Logger } from '../../utils/Logger';
import { ContainerOrchestrator } from './ContainerOrchestrator';
import { DeploymentConfig, DeploymentResult } from './DeploymentPrincess';
import { DeploymentMetrics } from './monitoring/DeploymentMetrics';

export interface BlueGreenConfig {
  warmupTime: number; // Time to wait before switching traffic
  testDuration: number; // Time to test new version before full switch
  rollbackThreshold: number; // Error rate threshold for automatic rollback
  healthCheckInterval: number; // How often to check health
}

export interface SlotStatus {
  slot: 'blue' | 'green';
  isActive: boolean;
  version: string;
  health: {
    healthy: boolean;
    errorRate: number;
    responseTime: number;
    lastCheck: Date;
  };
  traffic: {
    percentage: number;
    requestCount: number;
  };
}

export class BlueGreenDeployment {
  private readonly logger: Logger;
  private readonly containerOrchestrator: ContainerOrchestrator;
  private readonly deploymentMetrics: DeploymentMetrics;
  private readonly defaultConfig: BlueGreenConfig;

  constructor() {
    this.logger = new Logger('BlueGreenDeployment');
    this.containerOrchestrator = new ContainerOrchestrator();
    this.deploymentMetrics = new DeploymentMetrics();

    this.defaultConfig = {
      warmupTime: 30000, // 30 seconds
      testDuration: 120000, // 2 minutes
      rollbackThreshold: 0.05, // 5% error rate
      healthCheckInterval: 10000, // 10 seconds
    };
  }

  async deploy(
    config: DeploymentConfig,
    deploymentResult: DeploymentResult,
    blueGreenConfig?: Partial<BlueGreenConfig>
  ): Promise<DeploymentResult> {
    const bgConfig = { ...this.defaultConfig, ...blueGreenConfig };
    const startTime = Date.now();

    try {
      this.logger.info(`Starting blue-green deployment for ${config.applicationName}`, { config });

      // Determine current active slot and target slot
      const currentSlot = await this.getCurrentActiveSlot(config);
      const targetSlot = this.getTargetSlot(currentSlot);

      this.logger.info(`Deploying to ${targetSlot} slot (current active: ${currentSlot})`);

      // Phase 1: Deploy to inactive slot
      await this.deployToSlot(config, targetSlot);

      // Phase 2: Warmup period
      this.logger.info(`Warming up ${targetSlot} slot for ${bgConfig.warmupTime}ms`);
      await new Promise(resolve => setTimeout(resolve, bgConfig.warmupTime));

      // Phase 3: Health verification
      await this.verifySlotHealth(config, targetSlot, bgConfig);

      // Phase 4: Gradual traffic switch with monitoring
      await this.performGradualTrafficSwitch(config, currentSlot, targetSlot, bgConfig);

      // Phase 5: Final verification and cleanup
      await this.finalizeDeployment(config, currentSlot, targetSlot, bgConfig);

      deploymentResult.metrics.deploymentTime = Date.now() - startTime;
      deploymentResult.status = 'success';

      this.logger.info(`Blue-green deployment completed successfully`, {
        deploymentId: deploymentResult.deploymentId,
        duration: deploymentResult.metrics.deploymentTime,
      });

      return deploymentResult;

    } catch (error) {
      this.logger.error(`Blue-green deployment failed`, { error });

      // Attempt automatic rollback
      try {
        await this.rollbackTraffic(config);
        deploymentResult.status = 'rolled_back';
      } catch (rollbackError) {
        this.logger.error(`Rollback also failed`, { rollbackError });
        deploymentResult.status = 'failed';
      }

      throw error;
    }
  }

  async getSlotStatus(config: DeploymentConfig): Promise<SlotStatus[]> {
    const slots: ('blue' | 'green')[] = ['blue', 'green'];
    const statuses: SlotStatus[] = [];

    for (const slot of slots) {
      try {
        const health = await this.containerOrchestrator.checkHealth(
          `${config.applicationName}-${slot}`,
          config.environment,
          config.healthCheck
        );

        const metrics = await this.containerOrchestrator.getContainerMetrics(
          `${config.applicationName}-${slot}`,
          config.environment
        );

        const isActive = await this.isSlotActive(config, slot);

        statuses.push({
          slot,
          isActive,
          version: 'latest', // This would come from deployment metadata
          health: {
            healthy: health,
            errorRate: metrics.errorRate,
            responseTime: metrics.responseTime,
            lastCheck: new Date(),
          },
          traffic: {
            percentage: isActive ? 100 : 0,
            requestCount: 0, // This would come from ingress metrics
          },
        });

      } catch (error) {
        this.logger.warn(`Failed to get status for ${slot} slot`, { error });
        statuses.push({
          slot,
          isActive: false,
          version: 'unknown',
          health: {
            healthy: false,
            errorRate: 1.0,
            responseTime: 0,
            lastCheck: new Date(),
          },
          traffic: {
            percentage: 0,
            requestCount: 0,
          },
        });
      }
    }

    return statuses;
  }

  async switchTraffic(
    config: DeploymentConfig,
    targetSlot: 'blue' | 'green'
  ): Promise<void> {
    try {
      this.logger.info(`Switching all traffic to ${targetSlot} slot`);

      await this.containerOrchestrator.switchTraffic(
        config,
        this.getOppositeSlot(targetSlot),
        targetSlot
      );

      // Verify traffic switch was successful
      await new Promise(resolve => setTimeout(resolve, 5000));
      const isActive = await this.isSlotActive(config, targetSlot);

      if (!isActive) {
        throw new Error(`Traffic switch to ${targetSlot} was not successful`);
      }

      this.logger.info(`Traffic successfully switched to ${targetSlot} slot`);

    } catch (error) {
      this.logger.error(`Failed to switch traffic to ${targetSlot}`, { error });
      throw error;
    }
  }

  async rollbackTraffic(config: DeploymentConfig): Promise<void> {
    try {
      const currentActive = await this.getCurrentActiveSlot(config);
      const rollbackTarget = this.getOppositeSlot(currentActive);

      this.logger.info(`Rolling back traffic from ${currentActive} to ${rollbackTarget}`);

      // Verify rollback target is healthy
      const health = await this.containerOrchestrator.checkHealth(
        `${config.applicationName}-${rollbackTarget}`,
        config.environment,
        config.healthCheck
      );

      if (!health) {
        throw new Error(`Rollback target ${rollbackTarget} is not healthy`);
      }

      await this.switchTraffic(config, rollbackTarget);

      this.logger.info(`Traffic successfully rolled back to ${rollbackTarget} slot`);

    } catch (error) {
      this.logger.error(`Failed to rollback traffic`, { error });
      throw error;
    }
  }

  async promoteEnvironment(sourceEnv: string, targetEnv: string): Promise<{ success: boolean; healthCheckDuration?: number }> {
    const startTime = Date.now();

    try {
      this.logger.info(`Promoting environment from ${sourceEnv} to ${targetEnv}`);

      // Simulate environment promotion logic
      // In real implementation, this would involve:
      // 1. Copy configurations from source to target
      // 2. Deploy the same image/version to target environment
      // 3. Run health checks on target environment
      // 4. Verify data migrations if needed

      // Simulate promotion time
      await new Promise(resolve => setTimeout(resolve, 5000));

      const healthCheckDuration = Date.now() - startTime;

      this.logger.info(`Environment promotion completed from ${sourceEnv} to ${targetEnv}`);

      return {
        success: true,
        healthCheckDuration
      };
    } catch (error) {
      this.logger.error(`Failed to promote environment from ${sourceEnv} to ${targetEnv}`, error);
      return {
        success: false,
        healthCheckDuration: Date.now() - startTime
      };
    }
  }

  async cleanupInactiveSlot(config: DeploymentConfig): Promise<void> {
    try {
      const currentActive = await this.getCurrentActiveSlot(config);
      const inactiveSlot = this.getOppositeSlot(currentActive);
      const inactiveDeploymentName = `${config.applicationName}-${inactiveSlot}`;

      this.logger.info(`Cleaning up inactive ${inactiveSlot} slot`);

      // Scale down inactive deployment to save resources
      await this.containerOrchestrator.scaleApplication(
        inactiveDeploymentName,
        config.environment,
        0
      );

      this.logger.info(`Inactive ${inactiveSlot} slot cleaned up`);

    } catch (error) {
      this.logger.error(`Failed to cleanup inactive slot`, { error });
      // Don't throw error for cleanup failures
    }
  }

  private async deployToSlot(
    config: DeploymentConfig,
    slot: 'blue' | 'green'
  ): Promise<void> {
    try {
      this.logger.info(`Deploying application to ${slot} slot`);

      await this.containerOrchestrator.deployBlueGreen(config, slot);

      // Wait for deployment to be ready
      const maxWaitTime = 300000; // 5 minutes
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        const health = await this.containerOrchestrator.checkHealth(
          `${config.applicationName}-${slot}`,
          config.environment,
          config.healthCheck
        );

        if (health) {
          this.logger.info(`${slot} slot deployment is ready`);
          return;
        }

        this.logger.info(`Waiting for ${slot} slot to become ready...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }

      throw new Error(`${slot} slot failed to become ready within timeout`);

    } catch (error) {
      this.logger.error(`Failed to deploy to ${slot} slot`, { error });
      throw error;
    }
  }

  private async verifySlotHealth(
    config: DeploymentConfig,
    slot: 'blue' | 'green',
    bgConfig: BlueGreenConfig
  ): Promise<void> {
    const deploymentName = `${config.applicationName}-${slot}`;
    const checkCount = Math.ceil(bgConfig.testDuration / bgConfig.healthCheckInterval);
    let successfulChecks = 0;

    this.logger.info(`Verifying ${slot} slot health over ${bgConfig.testDuration}ms`);

    for (let i = 0; i < checkCount; i++) {
      try {
        const health = await this.containerOrchestrator.checkHealth(
          deploymentName,
          config.environment,
          config.healthCheck
        );

        const metrics = await this.containerOrchestrator.getContainerMetrics(
          deploymentName,
          config.environment
        );

        if (health && metrics.errorRate < bgConfig.rollbackThreshold) {
          successfulChecks++;
        } else {
          this.logger.warn(`Health check failed for ${slot} slot`, {
            health,
            errorRate: metrics.errorRate,
            threshold: bgConfig.rollbackThreshold,
          });
        }

        if (i < checkCount - 1) {
          await new Promise(resolve => setTimeout(resolve, bgConfig.healthCheckInterval));
        }

      } catch (error) {
        this.logger.warn(`Health check error for ${slot} slot`, { error });
      }
    }

    const successRate = successfulChecks / checkCount;
    if (successRate < 0.8) { // Require 80% success rate
      throw new Error(`${slot} slot health verification failed (${successRate * 100}% success rate)`);
    }

    this.logger.info(`${slot} slot health verification passed (${successRate * 100}% success rate)`);
  }

  private async performGradualTrafficSwitch(
    config: DeploymentConfig,
    fromSlot: 'blue' | 'green',
    toSlot: 'blue' | 'green',
    bgConfig: BlueGreenConfig
  ): Promise<void> {
    // For simplicity, we'll do an immediate switch
    // In a production environment, you might want to implement gradual traffic shifting
    // using a service mesh like Istio or an ingress controller that supports weighted routing

    this.logger.info(`Switching traffic from ${fromSlot} to ${toSlot}`);

    await this.containerOrchestrator.switchTraffic(config, fromSlot, toSlot);

    // Monitor for a period after switching
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

    // Verify the switch was successful
    const metrics = await this.containerOrchestrator.getContainerMetrics(
      `${config.applicationName}-${toSlot}`,
      config.environment
    );

    if (metrics.errorRate > bgConfig.rollbackThreshold) {
      throw new Error(`High error rate detected after traffic switch: ${metrics.errorRate * 100}%`);
    }

    this.logger.info(`Traffic switch completed successfully`);
  }

  private async finalizeDeployment(
    config: DeploymentConfig,
    oldSlot: 'blue' | 'green',
    newSlot: 'blue' | 'green',
    bgConfig: BlueGreenConfig
  ): Promise<void> {
    // Final health check
    const health = await this.containerOrchestrator.checkHealth(
      `${config.applicationName}-${newSlot}`,
      config.environment,
      config.healthCheck
    );

    if (!health) {
      throw new Error(`Final health check failed for ${newSlot} slot`);
    }

    // Keep the old slot running for a grace period before cleanup
    // This allows for quick rollback if issues are discovered
    setTimeout(async () => {
      try {
        await this.cleanupInactiveSlot(config);
      } catch (error) {
        this.logger.warn(`Delayed cleanup failed`, { error });
      }
    }, 300000); // 5 minutes

    this.logger.info(`Blue-green deployment finalized successfully`);
  }

  private async getCurrentActiveSlot(config: DeploymentConfig): Promise<'blue' | 'green'> {
    // Check which slot is currently receiving traffic
    const blueActive = await this.isSlotActive(config, 'blue');

    if (blueActive) {
      return 'blue';
    } else {
      return 'green';
    }
  }

  private async isSlotActive(config: DeploymentConfig, slot: 'blue' | 'green'): Promise<boolean> {
    try {
      // This is a simplified check - in reality, you'd check the service selector
      // or ingress configuration to see which slot is receiving traffic
      const health = await this.containerOrchestrator.checkHealth(
        `${config.applicationName}-${slot}`,
        config.environment,
        config.healthCheck
      );

      // For simplicity, we assume the healthy slot is active
      // In a real implementation, you'd check the actual traffic routing
      return health;

    } catch (error) {
      return false;
    }
  }

  private getTargetSlot(currentSlot: 'blue' | 'green'): 'blue' | 'green' {
    return currentSlot === 'blue' ? 'green' : 'blue';
  }

  private getOppositeSlot(slot: 'blue' | 'green'): 'blue' | 'green' {
    return slot === 'blue' ? 'green' : 'blue';
  }
}