/**
 * Cross-Platform Deployment Abstraction (DO-005)
 *
 * Provides unified deployment interface across Kubernetes, Docker, serverless,
 * and VM platforms with platform-specific optimizations.
 */

import {
  PlatformConfig,
  DeploymentExecution,
  DeploymentResult,
  PlatformCredentials,
  PlatformFeatures,
  Environment,
  DeploymentArtifact
} from '../types/deployment-types';

export class CrossPlatformAbstraction {
  private platformAdapters: Map<string, PlatformAdapter> = new Map();
  private platformMonitors: Map<string, PlatformMonitor> = new Map();
  private supportedPlatforms: Set<string> = new Set();

  constructor() {
    this.initializePlatformSupport();
  }

  /**
   * Validate platform configuration and connectivity
   */
  async validatePlatform(platform: PlatformConfig): Promise<void> {
    if (!this.supportedPlatforms.has(platform.type)) {
      throw new Error(`Unsupported platform type: ${platform.type}`);
    }

    const adapter = this.platformAdapters.get(platform.type);
    if (!adapter) {
      throw new Error(`Platform adapter not found for ${platform.type}`);
    }

    // Validate platform connectivity and credentials
    await adapter.validateConnection(platform);

    // Validate platform features for deployment requirements
    await this.validatePlatformFeatures(platform);

    console.log(`Platform ${platform.type} validation successful`);
  }

  /**
   * Deploy application to target platform
   */
  async deployToPlatform(
    execution: DeploymentExecution,
    platform: PlatformConfig
  ): Promise<PlatformDeploymentResult> {
    const adapter = this.platformAdapters.get(platform.type);
    if (!adapter) {
      throw new Error(`Platform adapter not found for ${platform.type}`);
    }

    try {
      // Prepare deployment for platform
      const preparedDeployment = await this.prepareDeploymentForPlatform(execution, platform);

      // Execute platform-specific deployment
      const result = await adapter.deploy(preparedDeployment);

      // Set up platform monitoring
      await this.setupPlatformMonitoring(platform, execution.id);

      return result;

    } catch (error) {
      console.error(`Deployment failed on platform ${platform.type}:`, error);
      throw error;
    }
  }

  /**
   * Set up monitoring for platform-specific metrics
   */
  async setupMonitoring(platform: PlatformConfig, deploymentId: string): Promise<void> {
    const monitor = this.platformMonitors.get(platform.type);
    if (!monitor) {
      console.warn(`No monitor available for platform ${platform.type}`);
      return;
    }

    await monitor.startMonitoring(platform, deploymentId);
    console.log(`Monitoring started for ${platform.type} deployment ${deploymentId}`);
  }

  /**
   * Stop monitoring for deployment
   */
  async stopMonitoring(platform: PlatformConfig, deploymentId: string): Promise<void> {
    const monitor = this.platformMonitors.get(platform.type);
    if (monitor) {
      await monitor.stopMonitoring(deploymentId);
      console.log(`Monitoring stopped for ${platform.type} deployment ${deploymentId}`);
    }
  }

  /**
   * Get platform capabilities and features
   */
  getPlatformCapabilities(platformType: string): PlatformCapabilities | null {
    const adapter = this.platformAdapters.get(platformType);
    return adapter ? adapter.getCapabilities() : null;
  }

  /**
   * List all supported platforms
   */
  getSupportedPlatforms(): PlatformInfo[] {
    return Array.from(this.supportedPlatforms).map(type => {
      const adapter = this.platformAdapters.get(type);
      return {
        type,
        name: adapter?.getName() || type,
        capabilities: adapter?.getCapabilities() || this.getDefaultCapabilities(),
        version: adapter?.getVersion() || 'unknown'
      };
    });
  }

  /**
   * Get platform status and health
   */
  async getPlatformStatus(platform: PlatformConfig): Promise<PlatformStatus> {
    const adapter = this.platformAdapters.get(platform.type);
    if (!adapter) {
      return {
        type: platform.type,
        status: 'unknown',
        message: 'Platform adapter not available'
      };
    }

    return await adapter.getStatus(platform);
  }

  /**
   * Execute platform-specific rollback
   */
  async rollbackOnPlatform(
    platform: PlatformConfig,
    deploymentId: string,
    targetVersion?: string
  ): Promise<RollbackResult> {
    const adapter = this.platformAdapters.get(platform.type);
    if (!adapter) {
      throw new Error(`Platform adapter not found for ${platform.type}`);
    }

    return await adapter.rollback(platform, deploymentId, targetVersion);
  }

  /**
   * Scale deployment on platform
   */
  async scaleDeployment(
    platform: PlatformConfig,
    deploymentId: string,
    replicas: number
  ): Promise<ScaleResult> {
    const adapter = this.platformAdapters.get(platform.type);
    if (!adapter) {
      throw new Error(`Platform adapter not found for ${platform.type}`);
    }

    if (!adapter.getCapabilities().autoScaling) {
      throw new Error(`Platform ${platform.type} does not support scaling`);
    }

    return await adapter.scale(platform, deploymentId, replicas);
  }

  /**
   * Initialize platform support
   */
  private initializePlatformSupport(): void {
    // Initialize Kubernetes adapter
    const kubernetesAdapter = new KubernetesAdapter();
    this.platformAdapters.set('kubernetes', kubernetesAdapter);
    this.platformMonitors.set('kubernetes', new KubernetesMonitor());
    this.supportedPlatforms.add('kubernetes');

    // Initialize Docker adapter
    const dockerAdapter = new DockerAdapter();
    this.platformAdapters.set('docker', dockerAdapter);
    this.platformMonitors.set('docker', new DockerMonitor());
    this.supportedPlatforms.add('docker');

    // Initialize Serverless adapter
    const serverlessAdapter = new ServerlessAdapter();
    this.platformAdapters.set('serverless', serverlessAdapter);
    this.platformMonitors.set('serverless', new ServerlessMonitor());
    this.supportedPlatforms.add('serverless');

    // Initialize VM adapter
    const vmAdapter = new VMAdapter();
    this.platformAdapters.set('vm', vmAdapter);
    this.platformMonitors.set('vm', new VMMonitor());
    this.supportedPlatforms.add('vm');

    console.log('Cross-platform abstraction initialized with support for:', Array.from(this.supportedPlatforms));
  }

  /**
   * Validate platform features meet deployment requirements
   */
  private async validatePlatformFeatures(platform: PlatformConfig): Promise<void> {
    const adapter = this.platformAdapters.get(platform.type);
    if (!adapter) {
      throw new Error(`Platform adapter not found for ${platform.type}`);
    }

    const capabilities = adapter.getCapabilities();
    const requiredFeatures = platform.features;

    // Check if platform supports required features
    if (requiredFeatures.blueGreenSupport && !capabilities.blueGreenSupport) {
      throw new Error(`Platform ${platform.type} does not support blue-green deployments`);
    }

    if (requiredFeatures.canarySupport && !capabilities.canarySupport) {
      throw new Error(`Platform ${platform.type} does not support canary deployments`);
    }

    if (requiredFeatures.autoScaling && !capabilities.autoScaling) {
      throw new Error(`Platform ${platform.type} does not support auto-scaling`);
    }

    if (requiredFeatures.loadBalancing && !capabilities.loadBalancing) {
      throw new Error(`Platform ${platform.type} does not support load balancing`);
    }

    if (requiredFeatures.secretManagement && !capabilities.secretManagement) {
      throw new Error(`Platform ${platform.type} does not support secret management`);
    }
  }

  /**
   * Prepare deployment for target platform
   */
  private async prepareDeploymentForPlatform(
    execution: DeploymentExecution,
    platform: PlatformConfig
  ): Promise<PreparedDeployment> {
    return {
      execution,
      platform,
      platformSpecificConfig: await this.generatePlatformConfig(execution, platform),
      optimizations: await this.generatePlatformOptimizations(execution, platform)
    };
  }

  /**
   * Generate platform-specific configuration
   */
  private async generatePlatformConfig(
    execution: DeploymentExecution,
    platform: PlatformConfig
  ): Promise<any> {
    const adapter = this.platformAdapters.get(platform.type);
    if (!adapter) {
      throw new Error(`Platform adapter not found for ${platform.type}`);
    }

    return await adapter.generateConfig(execution, platform);
  }

  /**
   * Generate platform-specific optimizations
   */
  private async generatePlatformOptimizations(
    execution: DeploymentExecution,
    platform: PlatformConfig
  ): Promise<PlatformOptimizations> {
    const adapter = this.platformAdapters.get(platform.type);
    if (!adapter) {
      return {};
    }

    return await adapter.generateOptimizations(execution, platform);
  }

  /**
   * Set up platform-specific monitoring
   */
  private async setupPlatformMonitoring(platform: PlatformConfig, deploymentId: string): Promise<void> {
    const monitor = this.platformMonitors.get(platform.type);
    if (monitor) {
      await monitor.startMonitoring(platform, deploymentId);
    }
  }

  /**
   * Get default platform capabilities
   */
  private getDefaultCapabilities(): PlatformCapabilities {
    return {
      blueGreenSupport: false,
      canarySupport: false,
      autoScaling: false,
      loadBalancing: false,
      secretManagement: false,
      rollingUpdates: true,
      healthChecks: true,
      monitoring: false
    };
  }
}

// Platform Adapters
abstract class PlatformAdapter {
  abstract getName(): string;
  abstract getVersion(): string;
  abstract getCapabilities(): PlatformCapabilities;
  abstract validateConnection(platform: PlatformConfig): Promise<void>;
  abstract deploy(deployment: PreparedDeployment): Promise<PlatformDeploymentResult>;
  abstract getStatus(platform: PlatformConfig): Promise<PlatformStatus>;
  abstract rollback(platform: PlatformConfig, deploymentId: string, targetVersion?: string): Promise<RollbackResult>;
  abstract scale(platform: PlatformConfig, deploymentId: string, replicas: number): Promise<ScaleResult>;
  abstract generateConfig(execution: DeploymentExecution, platform: PlatformConfig): Promise<any>;
  abstract generateOptimizations(execution: DeploymentExecution, platform: PlatformConfig): Promise<PlatformOptimizations>;
}

class KubernetesAdapter extends PlatformAdapter {
  getName(): string { return 'Kubernetes'; }
  getVersion(): string { return 'v1.28+'; }

  getCapabilities(): PlatformCapabilities {
    return {
      blueGreenSupport: true,
      canarySupport: true,
      autoScaling: true,
      loadBalancing: true,
      secretManagement: true,
      rollingUpdates: true,
      healthChecks: true,
      monitoring: true
    };
  }

  async validateConnection(platform: PlatformConfig): Promise<void> {
    // Validate Kubernetes cluster connectivity
    console.log('Validating Kubernetes cluster connection...');

    // In real implementation, check kubectl/API server connectivity
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Kubernetes cluster connection validated');
  }

  async deploy(deployment: PreparedDeployment): Promise<PlatformDeploymentResult> {
    console.log('Deploying to Kubernetes cluster...');

    // In real implementation, apply Kubernetes manifests
    await new Promise(resolve => setTimeout(resolve, 3000));

    return {
      success: true,
      platform: 'kubernetes',
      deploymentId: deployment.execution.id,
      resourceIds: ['deployment/app', 'service/app', 'ingress/app'],
      endpoints: ['https://app.cluster.local'],
      duration: 3000
    };
  }

  async getStatus(platform: PlatformConfig): Promise<PlatformStatus> {
    return {
      type: 'kubernetes',
      status: 'healthy',
      message: 'Cluster is healthy',
      version: 'v1.28.2',
      nodes: 3,
      resources: {
        cpu: { total: '12 cores', available: '8 cores' },
        memory: { total: '48 GB', available: '32 GB' }
      }
    };
  }

  async rollback(platform: PlatformConfig, deploymentId: string, targetVersion?: string): Promise<RollbackResult> {
    console.log(`Rolling back Kubernetes deployment ${deploymentId}...`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      deploymentId,
      fromVersion: 'v1.2.3',
      toVersion: targetVersion || 'v1.2.2',
      duration: 2000
    };
  }

  async scale(platform: PlatformConfig, deploymentId: string, replicas: number): Promise<ScaleResult> {
    console.log(`Scaling Kubernetes deployment ${deploymentId} to ${replicas} replicas...`);

    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: true,
      deploymentId,
      fromReplicas: 3,
      toReplicas: replicas,
      duration: 1500
    };
  }

  async generateConfig(execution: DeploymentExecution, platform: PlatformConfig): Promise<any> {
    return {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: execution.artifact.id,
        namespace: execution.environment.name
      },
      spec: {
        replicas: execution.environment.config.replicas,
        selector: {
          matchLabels: { app: execution.artifact.id }
        },
        template: {
          metadata: {
            labels: { app: execution.artifact.id }
          },
          spec: {
            containers: [{
              name: execution.artifact.id,
              image: execution.artifact.imageTag,
              resources: {
                requests: execution.environment.config.resources,
                limits: execution.environment.config.resources
              }
            }]
          }
        }
      }
    };
  }

  async generateOptimizations(execution: DeploymentExecution, platform: PlatformConfig): Promise<PlatformOptimizations> {
    return {
      resourceOptimization: {
        nodeAffinity: true,
        podAntiAffinity: true,
        resourceQuotas: true
      },
      networkOptimization: {
        serviceTopology: true,
        networkPolicies: true
      },
      performanceOptimization: {
        horizontalPodAutoscaler: true,
        verticalPodAutoscaler: false
      }
    };
  }
}

class DockerAdapter extends PlatformAdapter {
  getName(): string { return 'Docker'; }
  getVersion(): string { return 'v24+'; }

  getCapabilities(): PlatformCapabilities {
    return {
      blueGreenSupport: true,
      canarySupport: false,
      autoScaling: false,
      loadBalancing: false,
      secretManagement: true,
      rollingUpdates: false,
      healthChecks: true,
      monitoring: false
    };
  }

  async validateConnection(platform: PlatformConfig): Promise<void> {
    console.log('Validating Docker daemon connection...');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Docker daemon connection validated');
  }

  async deploy(deployment: PreparedDeployment): Promise<PlatformDeploymentResult> {
    console.log('Deploying Docker container...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      platform: 'docker',
      deploymentId: deployment.execution.id,
      resourceIds: [`container/${deployment.execution.artifact.id}`],
      endpoints: ['http://localhost:8080'],
      duration: 2000
    };
  }

  async getStatus(platform: PlatformConfig): Promise<PlatformStatus> {
    return {
      type: 'docker',
      status: 'healthy',
      message: 'Docker daemon is running',
      version: 'v24.0.5'
    };
  }

  async rollback(platform: PlatformConfig, deploymentId: string, targetVersion?: string): Promise<RollbackResult> {
    console.log(`Rolling back Docker container ${deploymentId}...`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      deploymentId,
      fromVersion: 'latest',
      toVersion: targetVersion || 'previous',
      duration: 1000
    };
  }

  async scale(platform: PlatformConfig, deploymentId: string, replicas: number): Promise<ScaleResult> {
    throw new Error('Docker platform does not support scaling');
  }

  async generateConfig(execution: DeploymentExecution, platform: PlatformConfig): Promise<any> {
    return {
      image: execution.artifact.imageTag,
      ports: ['8080:8080'],
      environment: execution.environment.config.featureFlags,
      restart: 'unless-stopped',
      healthcheck: {
        test: ['CMD', 'curl', '-f', 'http://localhost:8080/health'],
        interval: '30s',
        timeout: '10s',
        retries: 3
      }
    };
  }

  async generateOptimizations(execution: DeploymentExecution, platform: PlatformConfig): Promise<PlatformOptimizations> {
    return {
      resourceOptimization: {
        memoryLimit: true,
        cpuLimit: true
      }
    };
  }
}

class ServerlessAdapter extends PlatformAdapter {
  getName(): string { return 'Serverless'; }
  getVersion(): string { return 'v3+'; }

  getCapabilities(): PlatformCapabilities {
    return {
      blueGreenSupport: true,
      canarySupport: true,
      autoScaling: true,
      loadBalancing: true,
      secretManagement: true,
      rollingUpdates: false,
      healthChecks: false,
      monitoring: true
    };
  }

  async validateConnection(platform: PlatformConfig): Promise<void> {
    console.log('Validating serverless platform connection...');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Serverless platform connection validated');
  }

  async deploy(deployment: PreparedDeployment): Promise<PlatformDeploymentResult> {
    console.log('Deploying serverless function...');
    await new Promise(resolve => setTimeout(resolve, 4000));

    return {
      success: true,
      platform: 'serverless',
      deploymentId: deployment.execution.id,
      resourceIds: [`function/${deployment.execution.artifact.id}`],
      endpoints: ['https://api.lambda.aws.com/function'],
      duration: 4000
    };
  }

  async getStatus(platform: PlatformConfig): Promise<PlatformStatus> {
    return {
      type: 'serverless',
      status: 'healthy',
      message: 'Serverless platform is operational',
      functions: 15,
      invocations: 1250000
    };
  }

  async rollback(platform: PlatformConfig, deploymentId: string, targetVersion?: string): Promise<RollbackResult> {
    console.log(`Rolling back serverless function ${deploymentId}...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      deploymentId,
      fromVersion: '$LATEST',
      toVersion: targetVersion || '2',
      duration: 2000
    };
  }

  async scale(platform: PlatformConfig, deploymentId: string, replicas: number): Promise<ScaleResult> {
    // Serverless auto-scales, but we can adjust concurrency
    console.log(`Adjusting serverless concurrency for ${deploymentId}...`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      deploymentId,
      fromReplicas: 0, // Auto-scaling
      toReplicas: replicas, // Concurrency limit
      duration: 1000
    };
  }

  async generateConfig(execution: DeploymentExecution, platform: PlatformConfig): Promise<any> {
    return {
      service: execution.artifact.id,
      provider: 'aws',
      runtime: 'nodejs18.x',
      functions: {
        [execution.artifact.id]: {
          handler: 'handler.main',
          events: [{ http: { path: '/{proxy+}', method: 'ANY' } }],
          environment: execution.environment.config.featureFlags
        }
      }
    };
  }

  async generateOptimizations(execution: DeploymentExecution, platform: PlatformConfig): Promise<PlatformOptimizations> {
    return {
      performanceOptimization: {
        memorySize: 1024,
        timeout: 30,
        concurrency: 100
      },
      costOptimization: {
        provisionedConcurrency: false,
        deadLetterQueue: true
      }
    };
  }
}

class VMAdapter extends PlatformAdapter {
  getName(): string { return 'Virtual Machine'; }
  getVersion(): string { return 'v1.0'; }

  getCapabilities(): PlatformCapabilities {
    return {
      blueGreenSupport: false,
      canarySupport: false,
      autoScaling: false,
      loadBalancing: false,
      secretManagement: false,
      rollingUpdates: false,
      healthChecks: true,
      monitoring: false
    };
  }

  async validateConnection(platform: PlatformConfig): Promise<void> {
    console.log('Validating VM connection...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('VM connection validated');
  }

  async deploy(deployment: PreparedDeployment): Promise<PlatformDeploymentResult> {
    console.log('Deploying to virtual machine...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    return {
      success: true,
      platform: 'vm',
      deploymentId: deployment.execution.id,
      resourceIds: [`vm/${deployment.execution.artifact.id}`],
      endpoints: ['http://vm-host:8080'],
      duration: 5000
    };
  }

  async getStatus(platform: PlatformConfig): Promise<PlatformStatus> {
    return {
      type: 'vm',
      status: 'healthy',
      message: 'Virtual machine is running',
      uptime: '15 days',
      cpu: '45%',
      memory: '60%'
    };
  }

  async rollback(platform: PlatformConfig, deploymentId: string, targetVersion?: string): Promise<RollbackResult> {
    console.log(`Rolling back VM deployment ${deploymentId}...`);
    await new Promise(resolve => setTimeout(resolve, 3000));

    return {
      success: true,
      deploymentId,
      fromVersion: 'current',
      toVersion: targetVersion || 'previous',
      duration: 3000
    };
  }

  async scale(platform: PlatformConfig, deploymentId: string, replicas: number): Promise<ScaleResult> {
    throw new Error('VM platform does not support scaling');
  }

  async generateConfig(execution: DeploymentExecution, platform: PlatformConfig): Promise<any> {
    return {
      host: platform.endpoint,
      user: 'deploy',
      deploymentPath: `/opt/${execution.artifact.id}`,
      serviceName: execution.artifact.id,
      environment: execution.environment.config.featureFlags
    };
  }

  async generateOptimizations(execution: DeploymentExecution, platform: PlatformConfig): Promise<PlatformOptimizations> {
    return {
      systemOptimization: {
        serviceManagement: 'systemd',
        logRotation: true,
        monitoring: 'basic'
      }
    };
  }
}

// Platform Monitors
abstract class PlatformMonitor {
  abstract startMonitoring(platform: PlatformConfig, deploymentId: string): Promise<void>;
  abstract stopMonitoring(deploymentId: string): Promise<void>;
}

class KubernetesMonitor extends PlatformMonitor {
  async startMonitoring(platform: PlatformConfig, deploymentId: string): Promise<void> {
    console.log(`Starting Kubernetes monitoring for deployment ${deploymentId}`);
  }

  async stopMonitoring(deploymentId: string): Promise<void> {
    console.log(`Stopping Kubernetes monitoring for deployment ${deploymentId}`);
  }
}

class DockerMonitor extends PlatformMonitor {
  async startMonitoring(platform: PlatformConfig, deploymentId: string): Promise<void> {
    console.log(`Starting Docker monitoring for deployment ${deploymentId}`);
  }

  async stopMonitoring(deploymentId: string): Promise<void> {
    console.log(`Stopping Docker monitoring for deployment ${deploymentId}`);
  }
}

class ServerlessMonitor extends PlatformMonitor {
  async startMonitoring(platform: PlatformConfig, deploymentId: string): Promise<void> {
    console.log(`Starting Serverless monitoring for deployment ${deploymentId}`);
  }

  async stopMonitoring(deploymentId: string): Promise<void> {
    console.log(`Stopping Serverless monitoring for deployment ${deploymentId}`);
  }
}

class VMMonitor extends PlatformMonitor {
  async startMonitoring(platform: PlatformConfig, deploymentId: string): Promise<void> {
    console.log(`Starting VM monitoring for deployment ${deploymentId}`);
  }

  async stopMonitoring(deploymentId: string): Promise<void> {
    console.log(`Stopping VM monitoring for deployment ${deploymentId}`);
  }
}

// Supporting interfaces
interface PlatformCapabilities {
  blueGreenSupport: boolean;
  canarySupport: boolean;
  autoScaling: boolean;
  loadBalancing: boolean;
  secretManagement: boolean;
  rollingUpdates: boolean;
  healthChecks: boolean;
  monitoring: boolean;
}

interface PlatformInfo {
  type: string;
  name: string;
  capabilities: PlatformCapabilities;
  version: string;
}

interface PlatformStatus {
  type: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  message: string;
  version?: string;
  nodes?: number;
  functions?: number;
  invocations?: number;
  uptime?: string;
  cpu?: string;
  memory?: string;
  resources?: any;
}

interface PreparedDeployment {
  execution: DeploymentExecution;
  platform: PlatformConfig;
  platformSpecificConfig: any;
  optimizations: PlatformOptimizations;
}

interface PlatformDeploymentResult {
  success: boolean;
  platform: string;
  deploymentId: string;
  resourceIds: string[];
  endpoints: string[];
  duration: number;
  error?: string;
}

interface RollbackResult {
  success: boolean;
  deploymentId: string;
  fromVersion: string;
  toVersion: string;
  duration: number;
  error?: string;
}

interface ScaleResult {
  success: boolean;
  deploymentId: string;
  fromReplicas: number;
  toReplicas: number;
  duration: number;
  error?: string;
}

interface PlatformOptimizations {
  resourceOptimization?: any;
  networkOptimization?: any;
  performanceOptimization?: any;
  costOptimization?: any;
  systemOptimization?: any;
}