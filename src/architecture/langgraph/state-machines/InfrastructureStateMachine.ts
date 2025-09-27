/**
 * InfrastructureStateMachine - Infrastructure Princess State Management

 * Manages the state machine for infrastructure operations including provisioning,
 * monitoring, scaling, and maintenance of system resources.
 */

import PrincessStateMachine, {
  PrincessConfiguration,
  TaskDefinition,
  StateTransitionRule,
  PrincessCapability
} from './PrincessStateMachine';
import { StateNode, StateTransition } from '../StateGraph';

export interface InfrastructureContext {
  activeResources: string[];
  resourceUtilization: Record<string, number>;
  provisioningQueue: string[];
  maintenanceSchedule: Date[];
  scalingMetrics: {
    cpu: number;
    memory: number;
    network: number;
    storage: number;
  };
  alerts: {
    level: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: Date;
  }[];
}

export interface InfrastructureTask extends TaskDefinition {
  type: 'provision' | 'monitor' | 'scale' | 'maintain' | 'backup' | 'optimize';
  payload: {
    resourceType?: 'compute' | 'storage' | 'network' | 'database';
    specifications?: Record<string, any>;
    region?: string;
    environment?: 'dev' | 'staging' | 'prod';
    scalingPolicy?: {
      minInstances: number;
      maxInstances: number;
      targetUtilization: number;
    };
  };
}

export class InfrastructureStateMachine extends PrincessStateMachine {
  private infrastructureContext: InfrastructureContext;
  private resourceMonitors: Map<string, NodeJS.Timeout>;
  private scalingPolicies: Map<string, any>;

  constructor() {
    const configuration: PrincessConfiguration = {
      princessId: 'infrastructure-princess',
      domain: 'infrastructure',
      capabilities: InfrastructureStateMachine.getDefaultCapabilities(),
      stateDefinition: {
        states: InfrastructureStateMachine.getStateNodes(),
        transitions: InfrastructureStateMachine.getStateTransitions(),
        initialState: 'idle',
        finalStates: ['shutdown']
      },
      policies: {
        maxConcurrentTasks: 10,
        taskTimeout: 300000, // 5 minutes
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          baseDelay: 2000
        },
        resourceLimits: {
          cpu: 80,
          memory: 85,
          storage: 90,
          network: 75
        }
      }
    };

    super(configuration);

    this.infrastructureContext = {
      activeResources: [],
      resourceUtilization: {},
      provisioningQueue: [],
      maintenanceSchedule: [],
      scalingMetrics: {
        cpu: 0,
        memory: 0,
        network: 0,
        storage: 0
      },
      alerts: []
    };

    this.resourceMonitors = new Map();
    this.scalingPolicies = new Map();

    this.initializeMonitoring();
  }

  /**
   * Perform infrastructure-specific tasks
   */
  protected async performTask(task: TaskDefinition, context: any): Promise<any> {
    const infraTask = task as InfrastructureTask;

    switch (infraTask.type) {
      case 'provision':
        return await this.provisionResource(infraTask, context);
      case 'monitor':
        return await this.monitorResources(infraTask, context);
      case 'scale':
        return await this.scaleResources(infraTask, context);
      case 'maintain':
        return await this.performMaintenance(infraTask, context);
      case 'backup':
        return await this.performBackup(infraTask, context);
      case 'optimize':
        return await this.optimizeResources(infraTask, context);
      default:
        throw new Error(`Unknown infrastructure task type: ${infraTask.type}`);
    }
  }

  /**
   * Check if the current state can handle the given task
   */
  protected canHandleTask(task: TaskDefinition): boolean {
    const infraTask = task as InfrastructureTask;
    const currentState = this.getCurrentState().name;

    // Define state-task compatibility matrix
    const compatibility: Record<string, string[]> = {
      'idle': ['provision', 'monitor', 'scale', 'backup', 'optimize'],
      'provisioning': ['monitor'],
      'monitoring': ['provision', 'scale', 'maintain', 'backup', 'optimize'],
      'scaling': ['monitor'],
      'maintenance': ['monitor'],
      'error': []
    };

    return compatibility[currentState]?.includes(infraTask.type) || false;
  }

  /**
   * Get current resource usage
   */
  protected async getResourceUsage(): Promise<Record<string, number>> {
    return {
      cpu: this.infrastructureContext.scalingMetrics.cpu,
      memory: this.infrastructureContext.scalingMetrics.memory,
      network: this.infrastructureContext.scalingMetrics.network,
      storage: this.infrastructureContext.scalingMetrics.storage,
      activeResources: this.infrastructureContext.activeResources.length,
      queuedTasks: this.infrastructureContext.provisioningQueue.length
    };
  }

  /**
   * Perform recovery from errors
   */
  protected async performRecovery(error: Error): Promise<void> {
    console.log('Infrastructure Princess performing recovery:', error.message);

    // Specific recovery strategies for infrastructure
    if (error.message.includes('provision')) {
      await this.rollbackFailedProvision();
    } else if (error.message.includes('scale')) {
      await this.revertScalingAction();
    } else {
      // Generic recovery - restart monitoring
      await this.restartMonitoring();
    }

    // Transition back to monitoring state
    await this.transition('recover', { recoveryReason: error.message });
  }

  /**
   * Initialize state transition rules
   */
  protected initializeTransitionRules(): void {
    const rules: StateTransitionRule[] = [
      {
        fromState: 'idle',
        toState: 'provisioning',
        trigger: 'startProvisioning',
        condition: (context) => context.resourceType !== undefined,
        action: this.prepareProvisioning.bind(this)
      },
      {
        fromState: 'idle',
        toState: 'monitoring',
        trigger: 'startMonitoring',
        action: this.initializeMonitoring.bind(this)
      },
      {
        fromState: 'provisioning',
        toState: 'monitoring',
        trigger: 'provisioningComplete',
        action: this.finalizeProvisioning.bind(this)
      },
      {
        fromState: 'monitoring',
        toState: 'scaling',
        trigger: 'scaleRequired',
        condition: (context) => this.shouldScale(context),
        action: this.prepareScaling.bind(this)
      },
      {
        fromState: 'scaling',
        toState: 'monitoring',
        trigger: 'scalingComplete',
        action: this.finalizeScaling.bind(this)
      },
      {
        fromState: 'monitoring',
        toState: 'maintenance',
        trigger: 'maintenanceRequired',
        condition: (context) => this.isMaintenanceTime(context),
        action: this.prepareMaintenance.bind(this)
      },
      {
        fromState: 'maintenance',
        toState: 'monitoring',
        trigger: 'maintenanceComplete',
        action: this.finalizeMaintenance.bind(this)
      },
      {
        fromState: '*',
        toState: 'error',
        trigger: 'error',
        action: this.handleError.bind(this)
      },
      {
        fromState: 'error',
        toState: 'monitoring',
        trigger: 'recover',
        action: this.initializeMonitoring.bind(this)
      }
    ];

    rules.forEach(rule => {
      const key = `${rule.fromState}:${rule.trigger}`;
      this.transitionRules.set(key, rule);
    });
  }

  /**
   * Task implementation methods
   */
  private async provisionResource(task: InfrastructureTask, context: any): Promise<any> {
    const { resourceType, specifications, region, environment } = task.payload;

    // Transition to provisioning state
    await this.transition('startProvisioning', {
      resourceType,
      specifications,
      region,
      environment
    });

    // Simulate resource provisioning
    const resourceId = `${resourceType}-${Date.now()}`;
    this.infrastructureContext.provisioningQueue.push(resourceId);

    // Simulate provisioning delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Add to active resources
    this.infrastructureContext.activeResources.push(resourceId);
    this.infrastructureContext.provisioningQueue = 
      this.infrastructureContext.provisioningQueue.filter(id => id !== resourceId);

    // Start monitoring the new resource
    this.startResourceMonitoring(resourceId);

    await this.transition('provisioningComplete', { resourceId });

    return {
      resourceId,
      status: 'provisioned',
      region,
      environment,
      specifications
    };
  }

  private async monitorResources(task: InfrastructureTask, context: any): Promise<any> {
    await this.transition('startMonitoring', context);

    // Collect metrics from all active resources
    const metrics = await this.collectResourceMetrics();

    // Update scaling metrics
    this.infrastructureContext.scalingMetrics = metrics;

    // Check for alerts
    await this.checkAlerts(metrics);

    return {
      metrics,
      activeResources: this.infrastructureContext.activeResources.length,
      alerts: this.infrastructureContext.alerts.slice(-10) // Last 10 alerts
    };
  }

  private async scaleResources(task: InfrastructureTask, context: any): Promise<any> {
    const { scalingPolicy } = task.payload;

    await this.transition('scaleRequired', { scalingPolicy });

    // Determine scaling action
    const currentInstances = this.infrastructureContext.activeResources.length;
    const targetInstances = this.calculateTargetInstances(scalingPolicy);

    let scalingAction: 'scale-up' | 'scale-down' | 'no-change';
    if (targetInstances > currentInstances) {
      scalingAction = 'scale-up';
      // Add new resources
      for (let i = 0; i < targetInstances - currentInstances; i++) {
        const resourceId = `scaled-${Date.now()}-${i}`;
        this.infrastructureContext.activeResources.push(resourceId);
        this.startResourceMonitoring(resourceId);
      }
    } else if (targetInstances < currentInstances) {
      scalingAction = 'scale-down';
      // Remove excess resources
      const resourcesToRemove = this.infrastructureContext.activeResources.slice(targetInstances);
      resourcesToRemove.forEach(resourceId => {
        this.stopResourceMonitoring(resourceId);
      });
      this.infrastructureContext.activeResources = 
        this.infrastructureContext.activeResources.slice(0, targetInstances);
    } else {
      scalingAction = 'no-change';
    }

    await this.transition('scalingComplete', {
      action: scalingAction,
      previousInstances: currentInstances,
      newInstances: targetInstances
    });

    return {
      action: scalingAction,
      previousInstances: currentInstances,
      newInstances: targetInstances,
      activeResources: this.infrastructureContext.activeResources
    };
  }

  private async performMaintenance(task: InfrastructureTask, context: any): Promise<any> {
    await this.transition('maintenanceRequired', context);

    // Simulate maintenance operations
    const maintenanceOperations = [
      'updateSecurityPatches',
      'optimizeStoragePools',
      'cleanupTemporaryFiles',
      'validateBackups',
      'updateConfigurations'
    ];

    const results: Record<string, boolean> = {};

    for (const operation of maintenanceOperations) {
      // Simulate operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      results[operation] = Math.random() > 0.1; // 90% success rate
    }

    await this.transition('maintenanceComplete', { results });

    return {
      maintenanceOperations: results,
      completedAt: new Date(),
      nextMaintenanceScheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
    };
  }

  private async performBackup(task: InfrastructureTask, context: any): Promise<any> {
    // Simulate backup operations
    const backupTargets = this.infrastructureContext.activeResources;
    const backupResults: Record<string, { success: boolean; size: number; duration: number }> = {};

    for (const resourceId of backupTargets) {
      const startTime = Date.now();
      // Simulate backup
      await new Promise(resolve => setTimeout(resolve, 500));
      const endTime = Date.now();

      backupResults[resourceId] = {
        success: Math.random() > 0.05, // 95% success rate
        size: Math.floor(Math.random() * 1000) + 100, // 100-1100 MB
        duration: endTime - startTime
      };
    }

    return {
      backupResults,
      totalResources: backupTargets.length,
      successfulBackups: Object.values(backupResults).filter(r => r.success).length,
      totalSize: Object.values(backupResults).reduce((sum, r) => sum + r.size, 0)
    };
  }

  private async optimizeResources(task: InfrastructureTask, context: any): Promise<any> {
    // Analyze current resource utilization
    const metrics = await this.collectResourceMetrics();
    
    const optimizations = {
      rightsizing: this.analyzeRightsizing(metrics),
      loadBalancing: this.optimizeLoadBalancing(metrics),
      costOptimization: this.identifyCostOptimizations(metrics),
      performanceOptimization: this.identifyPerformanceOptimizations(metrics)
    };

    // Apply optimizations
    const appliedOptimizations: string[] = [];
    
    if (optimizations.rightsizing.recommended) {
      appliedOptimizations.push('rightsizing');
    }
    
    if (optimizations.loadBalancing.recommended) {
      appliedOptimizations.push('loadBalancing');
    }

    return {
      optimizations,
      appliedOptimizations,
      projectedSavings: this.calculateProjectedSavings(optimizations),
      performanceImpact: this.calculatePerformanceImpact(optimizations)
    };
  }

  /**
   * Helper methods
   */
  private async prepareProvisioning(context: any): Promise<any> {
    return { provisioningPrepared: true, context };
  }

  private async finalizeProvisioning(context: any): Promise<any> {
    return { provisioningFinalized: true, context };
  }

  private async prepareScaling(context: any): Promise<any> {
    return { scalingPrepared: true, context };
  }

  private async finalizeScaling(context: any): Promise<any> {
    return { scalingFinalized: true, context };
  }

  private async prepareMaintenance(context: any): Promise<any> {
    return { maintenancePrepared: true, context };
  }

  private async finalizeMaintenance(context: any): Promise<any> {
    return { maintenanceFinalized: true, context };
  }

  private async handleError(context: any): Promise<any> {
    this.infrastructureContext.alerts.push({
      level: 'critical',
      message: `Error occurred: ${context.error}`,
      timestamp: new Date()
    });
    return { errorHandled: true, context };
  }

  private shouldScale(context: any): boolean {
    const metrics = this.infrastructureContext.scalingMetrics;
    return metrics.cpu > 70 || metrics.memory > 80 || metrics.network > 85;
  }

  private isMaintenanceTime(context: any): boolean {
    const now = new Date();
    return this.infrastructureContext.maintenanceSchedule.some(
      schedule => Math.abs(schedule.getTime() - now.getTime()) < 3600000 // Within 1 hour
    );
  }

  private async initializeMonitoring(): Promise<any> {
    // Start monitoring all active resources
    this.infrastructureContext.activeResources.forEach(resourceId => {
      this.startResourceMonitoring(resourceId);
    });
    return { monitoringInitialized: true };
  }

  private startResourceMonitoring(resourceId: string): void {
    if (this.resourceMonitors.has(resourceId)) {
      return; // Already monitoring
    }

    const monitor = setInterval(() => {
      // Simulate metric collection
      this.infrastructureContext.resourceUtilization[resourceId] = {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        network: Math.random() * 100,
        storage: Math.random() * 100
      };
    }, 10000); // Every 10 seconds

    this.resourceMonitors.set(resourceId, monitor);
  }

  private stopResourceMonitoring(resourceId: string): void {
    const monitor = this.resourceMonitors.get(resourceId);
    if (monitor) {
      clearInterval(monitor);
      this.resourceMonitors.delete(resourceId);
      delete this.infrastructureContext.resourceUtilization[resourceId];
    }
  }

  private async collectResourceMetrics(): Promise<any> {
    const allMetrics = Object.values(this.infrastructureContext.resourceUtilization);
    
    if (allMetrics.length === 0) {
      return { cpu: 0, memory: 0, network: 0, storage: 0 };
    }

    return {
      cpu: allMetrics.reduce((sum, m) => sum + m.cpu, 0) / allMetrics.length,
      memory: allMetrics.reduce((sum, m) => sum + m.memory, 0) / allMetrics.length,
      network: allMetrics.reduce((sum, m) => sum + m.network, 0) / allMetrics.length,
      storage: allMetrics.reduce((sum, m) => sum + m.storage, 0) / allMetrics.length
    };
  }

  private async checkAlerts(metrics: any): Promise<void> {
    const alerts = [];

    if (metrics.cpu > 85) {
      alerts.push({ level: 'critical' as const, message: 'High CPU utilization', timestamp: new Date() });
    }
    if (metrics.memory > 90) {
      alerts.push({ level: 'critical' as const, message: 'High memory utilization', timestamp: new Date() });
    }
    if (metrics.storage > 95) {
      alerts.push({ level: 'critical' as const, message: 'Storage almost full', timestamp: new Date() });
    }

    this.infrastructureContext.alerts.push(...alerts);

    // Keep only last 100 alerts
    if (this.infrastructureContext.alerts.length > 100) {
      this.infrastructureContext.alerts = this.infrastructureContext.alerts.slice(-100);
    }
  }

  private calculateTargetInstances(scalingPolicy: any): number {
    const currentUtilization = this.infrastructureContext.scalingMetrics.cpu;
    const targetUtilization = scalingPolicy.targetUtilization || 70;
    const currentInstances = this.infrastructureContext.activeResources.length;
    
    const targetInstances = Math.ceil((currentUtilization / targetUtilization) * currentInstances);
    
    return Math.max(
      scalingPolicy.minInstances || 1,
      Math.min(scalingPolicy.maxInstances || 10, targetInstances)
    );
  }

  private analyzeRightsizing(metrics: any): any {
    return {
      recommended: metrics.cpu < 30 && metrics.memory < 40,
      currentSize: 'medium',
      recommendedSize: 'small',
      potentialSavings: 0.3
    };
  }

  private optimizeLoadBalancing(metrics: any): any {
    return {
      recommended: metrics.network > 70,
      currentDistribution: 'uneven',
      recommendedDistribution: 'even',
      performanceGain: 0.15
    };
  }

  private identifyCostOptimizations(metrics: any): any {
    return {
      spotInstances: { savings: 0.4, feasible: true },
      reservedInstances: { savings: 0.2, feasible: true },
      scheduledShutdown: { savings: 0.1, feasible: false }
    };
  }

  private identifyPerformanceOptimizations(metrics: any): any {
    return {
      caching: { improvement: 0.3, complexity: 'medium' },
      compression: { improvement: 0.1, complexity: 'low' },
      indexing: { improvement: 0.2, complexity: 'high' }
    };
  }

  private calculateProjectedSavings(optimizations: any): number {
    return Object.values(optimizations.costOptimization)
      .reduce((sum: number, opt: any) => sum + (opt.feasible ? opt.savings : 0), 0);
  }

  private calculatePerformanceImpact(optimizations: any): number {
    return Object.values(optimizations.performanceOptimization)
      .reduce((sum: number, opt: any) => sum + opt.improvement, 0);
  }

  private async rollbackFailedProvision(): Promise<void> {
    // Remove any partially provisioned resources
    this.infrastructureContext.provisioningQueue = [];
  }

  private async revertScalingAction(): Promise<void> {
    // Implement scaling rollback logic
    console.log('Reverting scaling action...');
  }

  private async restartMonitoring(): Promise<void> {
    // Clear existing monitors
    this.resourceMonitors.forEach(monitor => clearInterval(monitor));
    this.resourceMonitors.clear();
    
    // Restart monitoring
    await this.initializeMonitoring();
  }

  /**
   * Static configuration methods
   */
  private static getDefaultCapabilities(): PrincessCapability[] {
    return [
      {
        id: 'resource-provisioning',
        name: 'Resource Provisioning',
        type: 'core',
        version: '1.0.0',
        enabled: true,
        configuration: {
          supportedResourceTypes: ['compute', 'storage', 'network', 'database'],
          supportedRegions: ['us-east-1', 'us-west-2', 'eu-west-1'],
          supportedEnvironments: ['dev', 'staging', 'prod']
        }
      },
      {
        id: 'resource-monitoring',
        name: 'Resource Monitoring',
        type: 'core',
        version: '1.0.0',
        enabled: true,
        configuration: {
          metricsCollection: true,
          alerting: true,
          dashboards: true
        }
      },
      {
        id: 'auto-scaling',
        name: 'Auto Scaling',
        type: 'enhanced',
        version: '1.0.0',
        enabled: true,
        configuration: {
          scalingPolicies: true,
          predictiveScaling: false,
          customMetrics: true
        }
      },
      {
        id: 'maintenance-automation',
        name: 'Maintenance Automation',
        type: 'enhanced',
        version: '1.0.0',
        enabled: true,
        configuration: {
          scheduledMaintenance: true,
          patchManagement: true,
          backupAutomation: true
        }
      },
      {
        id: 'cost-optimization',
        name: 'Cost Optimization',
        type: 'specialized',
        version: '1.0.0',
        enabled: true,
        configuration: {
          rightsizing: true,
          spotInstances: true,
          reservedInstances: true
        }
      }
    ];
  }

  private static getStateNodes(): StateNode[] {
    return [
      {
        id: 'idle',
        name: 'idle',
        type: 'initial',
        metadata: {
          description: 'Infrastructure Princess is idle and ready for tasks',
          timeout: 0
        }
      },
      {
        id: 'provisioning',
        name: 'provisioning',
        type: 'intermediate',
        metadata: {
          description: 'Provisioning new infrastructure resources',
          timeout: 300000 // 5 minutes
        }
      },
      {
        id: 'monitoring',
        name: 'monitoring',
        type: 'intermediate',
        metadata: {
          description: 'Monitoring infrastructure resources',
          timeout: 0 // Continuous
        }
      },
      {
        id: 'scaling',
        name: 'scaling',
        type: 'intermediate',
        metadata: {
          description: 'Scaling infrastructure resources',
          timeout: 180000 // 3 minutes
        }
      },
      {
        id: 'maintenance',
        name: 'maintenance',
        type: 'intermediate',
        metadata: {
          description: 'Performing infrastructure maintenance',
          timeout: 600000 // 10 minutes
        }
      },
      {
        id: 'error',
        name: 'error',
        type: 'error',
        metadata: {
          description: 'Error state requiring intervention',
          timeout: 0
        }
      },
      {
        id: 'shutdown',
        name: 'shutdown',
        type: 'final',
        metadata: {
          description: 'Infrastructure Princess shutdown state',
          timeout: 0
        }
      }
    ];
  }

  private static getStateTransitions(): StateTransition[] {
    return [
      {
        id: 'idle-to-provisioning',
        fromState: 'idle',
        toState: 'provisioning',
        event: 'startProvisioning',
        metadata: {
          description: 'Start provisioning resources'
        }
      },
      {
        id: 'idle-to-monitoring',
        fromState: 'idle',
        toState: 'monitoring',
        event: 'startMonitoring',
        metadata: {
          description: 'Start monitoring resources'
        }
      },
      {
        id: 'provisioning-to-monitoring',
        fromState: 'provisioning',
        toState: 'monitoring',
        event: 'provisioningComplete',
        metadata: {
          description: 'Provisioning completed, start monitoring'
        }
      },
      {
        id: 'monitoring-to-scaling',
        fromState: 'monitoring',
        toState: 'scaling',
        event: 'scaleRequired',
        metadata: {
          description: 'Scaling required based on metrics'
        }
      },
      {
        id: 'scaling-to-monitoring',
        fromState: 'scaling',
        toState: 'monitoring',
        event: 'scalingComplete',
        metadata: {
          description: 'Scaling completed, resume monitoring'
        }
      },
      {
        id: 'monitoring-to-maintenance',
        fromState: 'monitoring',
        toState: 'maintenance',
        event: 'maintenanceRequired',
        metadata: {
          description: 'Scheduled maintenance required'
        }
      },
      {
        id: 'maintenance-to-monitoring',
        fromState: 'maintenance',
        toState: 'monitoring',
        event: 'maintenanceComplete',
        metadata: {
          description: 'Maintenance completed, resume monitoring'
        }
      },
      {
        id: 'any-to-error',
        fromState: '*',
        toState: 'error',
        event: 'error',
        metadata: {
          description: 'Error occurred, transition to error state'
        }
      },
      {
        id: 'error-to-monitoring',
        fromState: 'error',
        toState: 'monitoring',
        event: 'recover',
        metadata: {
          description: 'Recovery completed, resume monitoring'
        }
      },
      {
        id: 'any-to-shutdown',
        fromState: '*',
        toState: 'shutdown',
        event: 'shutdown',
        metadata: {
          description: 'Shutdown Infrastructure Princess'
        }
      }
    ];
  }
}

export default InfrastructureStateMachine;