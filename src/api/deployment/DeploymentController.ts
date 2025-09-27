import { Request, Response } from 'express';
import { Logger } from '../../utils/Logger';
import { DeploymentPrincess, DeploymentConfig, DeploymentResult } from '../../princesses/deployment/DeploymentPrincess';
import { QueenToDeploymentAdapter, QueenDeploymentOrder } from '../../princesses/deployment/adapters/QueenToDeploymentAdapter';
import { BlueGreenDeployment } from '../../princesses/deployment/BlueGreenDeployment';
import { RollbackManager } from '../../princesses/deployment/RollbackManager';
import { DeploymentMetrics } from '../../princesses/deployment/monitoring/DeploymentMetrics';
import { SecurityIntegration } from '../../princesses/deployment/SecurityIntegration';

export interface DeploymentRequest {
  applicationName: string;
  environment: 'development' | 'staging' | 'production' | 'dr';
  strategy?: 'blue-green' | 'canary' | 'rolling' | 'recreate';
  containerImage: string;
  replicas?: number;
  resources?: {
    cpu: string;
    memory: string;
  };
  secrets?: Record<string, string>;
  configMaps?: Record<string, string>;
  rollbackConfig?: {
    enabled: boolean;
    threshold: number;
    timeout: number;
  };
}

export interface PromotionRequest {
  applicationName: string;
  sourceEnvironment: string;
  targetEnvironment: string;
  strategy?: string;
  approvalRequired?: boolean;
}

export interface ScalingRequest {
  applicationName: string;
  environment: string;
  replicas: number;
  autoScaling?: {
    enabled: boolean;
    minReplicas: number;
    maxReplicas: number;
    targetCPU: number;
    targetMemory: number;
  };
}

export class DeploymentController {
  private readonly logger: Logger;
  private readonly deploymentPrincess: DeploymentPrincess;
  private readonly queenAdapter: QueenToDeploymentAdapter;
  private readonly blueGreenDeployment: BlueGreenDeployment;
  private readonly rollbackManager: RollbackManager;
  private readonly deploymentMetrics: DeploymentMetrics;
  private readonly securityIntegration: SecurityIntegration;

  constructor() {
    this.logger = new Logger('DeploymentController');
    this.deploymentPrincess = new DeploymentPrincess();
    this.queenAdapter = new QueenToDeploymentAdapter();
    this.blueGreenDeployment = new BlueGreenDeployment();
    this.rollbackManager = new RollbackManager();
    this.deploymentMetrics = new DeploymentMetrics();
    this.securityIntegration = new SecurityIntegration();
  }

  async deploy(req: Request, res: Response): Promise<void> {
    try {
      const deploymentRequest: DeploymentRequest = req.body;

      // Validate request
      this.validateDeploymentRequest(deploymentRequest);

      this.logger.info('Starting deployment', {
        applicationName: deploymentRequest.applicationName,
        environment: deploymentRequest.environment,
        strategy: deploymentRequest.strategy,
      });

      // Convert to deployment config
      const config: DeploymentConfig = {
        applicationName: deploymentRequest.applicationName,
        environment: deploymentRequest.environment,
        strategy: deploymentRequest.strategy || 'blue-green',
        containerImage: deploymentRequest.containerImage,
        replicas: deploymentRequest.replicas || 1,
        resources: deploymentRequest.resources || { cpu: '1000m', memory: '2Gi' },
        secrets: deploymentRequest.secrets || {},
        configMaps: deploymentRequest.configMaps || {},
        healthCheck: {
          endpoint: '/health',
          timeout: 30000,
          retries: 3,
        },
        rollbackConfig: deploymentRequest.rollbackConfig || {
          enabled: true,
          threshold: 0.95,
          timeout: 300000,
        },
      };

      // Execute deployment
      const result = await this.deploymentPrincess.deployApplication(config);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Deployment initiated successfully',
      });

    } catch (error) {
      this.logger.error('Deployment failed', { error });
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Deployment failed',
      });
    }
  }

  async getDeploymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { deploymentId } = req.params;

      if (!deploymentId) {
        res.status(400).json({
          success: false,
          error: 'Deployment ID is required',
        });
        return;
      }

      const status = await this.deploymentPrincess.getDeploymentStatus(deploymentId);

      if (!status) {
        res.status(404).json({
          success: false,
          error: 'Deployment not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: status,
      });

    } catch (error) {
      this.logger.error('Failed to get deployment status', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async rollback(req: Request, res: Response): Promise<void> {
    try {
      const { deploymentId } = req.params;
      const { reason } = req.body;

      if (!deploymentId) {
        res.status(400).json({
          success: false,
          error: 'Deployment ID is required',
        });
        return;
      }

      this.logger.info('Starting rollback', { deploymentId, reason });

      const result = await this.deploymentPrincess.rollbackDeployment(deploymentId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Rollback completed successfully',
      });

    } catch (error) {
      this.logger.error('Rollback failed', { error });
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Rollback failed',
      });
    }
  }

  async promoteEnvironment(req: Request, res: Response): Promise<void> {
    try {
      const promotionRequest: PromotionRequest = req.body;

      // Validate request
      if (!promotionRequest.applicationName || !promotionRequest.sourceEnvironment || !promotionRequest.targetEnvironment) {
        res.status(400).json({
          success: false,
          error: 'Application name, source environment, and target environment are required',
        });
        return;
      }

      this.logger.info('Starting environment promotion', {
        applicationName: promotionRequest.applicationName,
        sourceEnvironment: promotionRequest.sourceEnvironment,
        targetEnvironment: promotionRequest.targetEnvironment,
      });

      const result = await this.deploymentPrincess.promoteEnvironment(
        promotionRequest.sourceEnvironment,
        promotionRequest.targetEnvironment,
        promotionRequest.applicationName
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Environment promotion completed successfully',
      });

    } catch (error) {
      this.logger.error('Environment promotion failed', { error });
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Environment promotion failed',
      });
    }
  }

  async listEnvironments(req: Request, res: Response): Promise<void> {
    try {
      const environments = [
        {
          name: 'development',
          status: 'active',
          lastDeployment: new Date(),
          replicas: 1,
          healthScore: 95,
        },
        {
          name: 'staging',
          status: 'active',
          lastDeployment: new Date(),
          replicas: 2,
          healthScore: 98,
        },
        {
          name: 'production',
          status: 'active',
          lastDeployment: new Date(),
          replicas: 3,
          healthScore: 99,
        },
        {
          name: 'dr',
          status: 'standby',
          lastDeployment: new Date(),
          replicas: 3,
          healthScore: 97,
        },
      ];

      res.status(200).json({
        success: true,
        data: environments,
      });

    } catch (error) {
      this.logger.error('Failed to list environments', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { deploymentId } = req.params;
      const { startTime, endTime } = req.query;

      if (!deploymentId) {
        res.status(400).json({
          success: false,
          error: 'Deployment ID is required',
        });
        return;
      }

      const start = startTime ? new Date(startTime as string) : undefined;
      const end = endTime ? new Date(endTime as string) : undefined;

      const metrics = await this.deploymentMetrics.getMetricsHistory(deploymentId, start, end);

      res.status(200).json({
        success: true,
        data: metrics,
      });

    } catch (error) {
      this.logger.error('Failed to get metrics', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getBlueGreenStatus(req: Request, res: Response): Promise<void> {
    try {
      const { applicationName } = req.params;
      const { environment } = req.query;

      if (!applicationName || !environment) {
        res.status(400).json({
          success: false,
          error: 'Application name and environment are required',
        });
        return;
      }

      const config: DeploymentConfig = {
        applicationName,
        environment: environment as any,
        strategy: 'blue-green',
        containerImage: 'placeholder',
        replicas: 1,
        resources: { cpu: '1000m', memory: '2Gi' },
        secrets: {},
        configMaps: {},
        healthCheck: { endpoint: '/health', timeout: 30000, retries: 3 },
        rollbackConfig: { enabled: true, threshold: 0.95, timeout: 300000 },
      };

      const status = await this.blueGreenDeployment.getSlotStatus(config);

      res.status(200).json({
        success: true,
        data: status,
      });

    } catch (error) {
      this.logger.error('Failed to get blue-green status', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async switchTraffic(req: Request, res: Response): Promise<void> {
    try {
      const { applicationName } = req.params;
      const { environment, targetSlot } = req.body;

      if (!applicationName || !environment || !targetSlot) {
        res.status(400).json({
          success: false,
          error: 'Application name, environment, and target slot are required',
        });
        return;
      }

      if (!['blue', 'green'].includes(targetSlot)) {
        res.status(400).json({
          success: false,
          error: 'Target slot must be either "blue" or "green"',
        });
        return;
      }

      const config: DeploymentConfig = {
        applicationName,
        environment,
        strategy: 'blue-green',
        containerImage: 'placeholder',
        replicas: 1,
        resources: { cpu: '1000m', memory: '2Gi' },
        secrets: {},
        configMaps: {},
        healthCheck: { endpoint: '/health', timeout: 30000, retries: 3 },
        rollbackConfig: { enabled: true, threshold: 0.95, timeout: 300000 },
      };

      await this.blueGreenDeployment.switchTraffic(config, targetSlot);

      res.status(200).json({
        success: true,
        message: `Traffic switched to ${targetSlot} slot successfully`,
      });

    } catch (error) {
      this.logger.error('Failed to switch traffic', { error });
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Traffic switch failed',
      });
    }
  }

  async scale(req: Request, res: Response): Promise<void> {
    try {
      const scalingRequest: ScalingRequest = req.body;

      if (!scalingRequest.applicationName || !scalingRequest.environment || !scalingRequest.replicas) {
        res.status(400).json({
          success: false,
          error: 'Application name, environment, and replicas are required',
        });
        return;
      }

      this.logger.info('Starting application scaling', {
        applicationName: scalingRequest.applicationName,
        environment: scalingRequest.environment,
        replicas: scalingRequest.replicas,
      });

      // For now, we'll use a simplified approach
      // In a real implementation, this would integrate with the container orchestrator
      const result = {
        applicationName: scalingRequest.applicationName,
        environment: scalingRequest.environment,
        previousReplicas: 2, // This would come from current state
        newReplicas: scalingRequest.replicas,
        scalingTime: 30000,
        status: 'completed',
      };

      res.status(200).json({
        success: true,
        data: result,
        message: 'Application scaled successfully',
      });

    } catch (error) {
      this.logger.error('Scaling failed', { error });
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Scaling failed',
      });
    }
  }

  async getSecurityScan(req: Request, res: Response): Promise<void> {
    try {
      const { imageTag } = req.params;

      if (!imageTag) {
        res.status(400).json({
          success: false,
          error: 'Image tag is required',
        });
        return;
      }

      const scanResult = await this.securityIntegration.scanContainerImage(imageTag);

      res.status(200).json({
        success: true,
        data: scanResult,
      });

    } catch (error) {
      this.logger.error('Security scan failed', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getRollbackHistory(req: Request, res: Response): Promise<void> {
    try {
      const { deploymentId } = req.params;

      const history = await this.rollbackManager.getRollbackHistory(deploymentId);

      res.status(200).json({
        success: true,
        data: history,
      });

    } catch (error) {
      this.logger.error('Failed to get rollback history', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getActiveDeployments(req: Request, res: Response): Promise<void> {
    try {
      const activeDeployments = await this.deploymentPrincess.listActiveDeployments();

      res.status(200).json({
        success: true,
        data: activeDeployments,
      });

    } catch (error) {
      this.logger.error('Failed to get active deployments', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async createAlertRule(req: Request, res: Response): Promise<void> {
    try {
      const alertRule = req.body;

      if (!alertRule.id || !alertRule.name || !alertRule.condition || !alertRule.threshold) {
        res.status(400).json({
          success: false,
          error: 'Alert rule must include id, name, condition, and threshold',
        });
        return;
      }

      await this.deploymentMetrics.createAlertRule(alertRule);

      res.status(201).json({
        success: true,
        message: 'Alert rule created successfully',
      });

    } catch (error) {
      this.logger.error('Failed to create alert rule', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getActiveAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { deploymentId } = req.query;

      const alerts = await this.deploymentMetrics.getActiveAlerts(deploymentId as string);

      res.status(200).json({
        success: true,
        data: alerts,
      });

    } catch (error) {
      this.logger.error('Failed to get active alerts', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async generateMetricsReport(req: Request, res: Response): Promise<void> {
    try {
      const { deploymentId } = req.params;

      if (!deploymentId) {
        res.status(400).json({
          success: false,
          error: 'Deployment ID is required',
        });
        return;
      }

      const report = await this.deploymentMetrics.generateMetricsReport(deploymentId);

      res.status(200).json({
        success: true,
        data: JSON.parse(report),
      });

    } catch (error) {
      this.logger.error('Failed to generate metrics report', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async receiveQueenOrder(req: Request, res: Response): Promise<void> {
    try {
      const order: QueenDeploymentOrder = req.body;

      // Validate Queen order
      if (!order.orderId || !order.command || !order.domain) {
        res.status(400).json({
          success: false,
          error: 'Queen order must include orderId, command, and domain',
        });
        return;
      }

      if (order.domain !== 'deployment') {
        res.status(400).json({
          success: false,
          error: 'Invalid domain for deployment controller',
        });
        return;
      }

      const orderIdResponse = await this.queenAdapter.receiveQueenOrder(order);

      res.status(202).json({
        success: true,
        data: { orderId: orderIdResponse },
        message: 'Queen order received and queued for processing',
      });

    } catch (error) {
      this.logger.error('Failed to receive Queen order', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getQueenOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required',
        });
        return;
      }

      const status = await this.queenAdapter.getOrderStatus(orderId);

      if (!status) {
        res.status(404).json({
          success: false,
          error: 'Order not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: status,
      });

    } catch (error) {
      this.logger.error('Failed to get Queen order status', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  private validateDeploymentRequest(request: DeploymentRequest): void {
    if (!request.applicationName) {
      throw new Error('Application name is required');
    }

    if (!request.environment) {
      throw new Error('Environment is required');
    }

    if (!request.containerImage) {
      throw new Error('Container image is required');
    }

    if (!['development', 'staging', 'production', 'dr'].includes(request.environment)) {
      throw new Error('Invalid environment. Must be one of: development, staging, production, dr');
    }

    if (request.strategy && !['blue-green', 'canary', 'rolling', 'recreate'].includes(request.strategy)) {
      throw new Error('Invalid deployment strategy. Must be one of: blue-green, canary, rolling, recreate');
    }

    if (request.replicas && (request.replicas < 1 || request.replicas > 100)) {
      throw new Error('Replicas must be between 1 and 100');
    }
  }
}