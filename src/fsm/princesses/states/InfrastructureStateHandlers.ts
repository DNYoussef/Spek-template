/**
 * InfrastructureStateHandlers - Isolated State Handlers for Infrastructure Princess
 * NASA Rule 10 Compliant: Each state handler ≤60 lines
 * Extracted from InfrastructurePrincessFSM (564 lines)
 */

import { InfrastructureContext } from '../InfrastructurePrincessFSM';
import { InfrastructureState, InfrastructureEvent, PrincessState } from '../../types/FSMTypes';

export class ResourcePlanningHandler {
  /**
   * Handle resource planning state
   */
  static createState() {
    return {
      entry: 'logEntry',
      on: {
        [InfrastructureEvent.RESOURCES_PLANNED]: {
          target: InfrastructureState.PROVISIONING,
          guard: 'planningComplete',
          actions: 'recordPlanning'
        }
      },
      invoke: {
        src: 'planResources',
        onDone: {
          target: InfrastructureState.PROVISIONING,
          actions: 'handlePlanningComplete'
        },
        onError: {
          target: PrincessState.FAILED,
          actions: 'handlePlanningError'
        }
      }
    };
  }

  /**
   * Execute resource planning
   */
  static async execute(context: InfrastructureContext): Promise<void> {
    if (!context.resources) {
      context.resources = {
        compute: {
          instances: 3,
          cpu: 8,
          memory: 32,
          provisioned: false
        },
        storage: {
          volumes: 2,
          capacity: 1000,
          configured: false
        },
        network: {
          vpcs: 1,
          subnets: 3,
          loadBalancers: 1,
          configured: false
        }
      };
    }

    context.data.resourcePlan = { complete: true };
  }

  /**
   * Validate resource planning
   */
  static validate(context: InfrastructureContext): boolean {
    return context.data.resourcePlan?.complete === true;
  }
}

export class ProvisioningHandler {
  /**
   * Handle provisioning state
   */
  static createState() {
    return {
      entry: 'logEntry',
      on: {
        [InfrastructureEvent.RESOURCES_PROVISIONED]: {
          target: InfrastructureState.CONFIGURATION,
          guard: 'provisioningComplete',
          actions: 'recordProvisioning'
        }
      },
      invoke: {
        src: 'provisionResources',
        onDone: {
          target: InfrastructureState.CONFIGURATION,
          actions: 'handleProvisioningComplete'
        },
        onError: {
          target: InfrastructureState.RESOURCE_PLANNING,
          actions: 'handleProvisioningError'
        }
      }
    };
  }

  /**
   * Execute resource provisioning
   */
  static async execute(context: InfrastructureContext): Promise<void> {
    if (context.resources) {
      context.resources.compute.provisioned = true;
      context.resources.storage.configured = true;
      context.resources.network.configured = true;
    }
  }

  /**
   * Validate provisioning
   */
  static validate(context: InfrastructureContext): boolean {
    return !!(
      context.resources?.compute?.provisioned &&
      context.resources?.storage?.configured &&
      context.resources?.network?.configured
    );
  }
}

export class ConfigurationHandler {
  /**
   * Handle configuration state
   */
  static createState() {
    return {
      entry: 'logEntry',
      on: {
        [InfrastructureEvent.CONFIGURATION_COMPLETE]: {
          target: InfrastructureState.DEPLOYMENT,
          guard: 'configurationValid',
          actions: 'recordConfiguration'
        }
      },
      invoke: {
        src: 'configureInfrastructure',
        onDone: {
          target: InfrastructureState.DEPLOYMENT,
          actions: 'handleConfigurationComplete'
        },
        onError: {
          target: InfrastructureState.PROVISIONING,
          actions: 'handleConfigurationError'
        }
      }
    };
  }

  /**
   * Execute infrastructure configuration
   */
  static async execute(context: InfrastructureContext): Promise<void> {
    if (!context.configuration) {
      context.configuration = {
        environment: 'development',
        scalingPolicy: 'auto',
        backupPolicy: 'daily',
        monitoringEnabled: true,
        validated: false
      };
    }

    context.configuration.validated = true;
  }

  /**
   * Validate configuration
   */
  static validate(context: InfrastructureContext): boolean {
    return context.configuration?.validated === true;
  }
}

export class DeploymentHandler {
  /**
   * Handle deployment state
   */
  static createState() {
    return {
      entry: 'logEntry',
      on: {
        [InfrastructureEvent.DEPLOYMENT_SUCCESSFUL]: {
          target: InfrastructureState.MONITORING_SETUP,
          guard: 'deploymentHealthy',
          actions: 'recordDeployment'
        }
      },
      invoke: {
        src: 'deployServices',
        onDone: {
          target: InfrastructureState.MONITORING_SETUP,
          actions: 'handleDeploymentComplete'
        },
        onError: {
          target: InfrastructureState.CONFIGURATION,
          actions: 'handleDeploymentError'
        }
      }
    };
  }

  /**
   * Execute service deployment
   */
  static async execute(context: InfrastructureContext): Promise<void> {
    if (!context.deployment) {
      context.deployment = {
        strategy: 'kubernetes',
        platform: 'aws',
        containerized: true,
        orchestration: 'k8s',
        healthy: false
      };
    }

    context.deployment.healthy = true;
  }

  /**
   * Validate deployment
   */
  static validate(context: InfrastructureContext): boolean {
    return context.deployment?.healthy === true;
  }
}

export class MonitoringSetupHandler {
  /**
   * Handle monitoring setup state
   */
  static createState() {
    return {
      entry: 'logEntry',
      on: {
        [InfrastructureEvent.MONITORING_CONFIGURED]: {
          target: PrincessState.COMPLETE,
          guard: 'monitoringActive',
          actions: 'recordMonitoring'
        }
      },
      invoke: {
        src: 'setupMonitoring',
        onDone: {
          target: PrincessState.COMPLETE,
          actions: 'handleMonitoringComplete'
        },
        onError: {
          target: PrincessState.FAILED,
          actions: 'handleMonitoringError'
        }
      }
    };
  }

  /**
   * Execute monitoring setup
   */
  static async execute(context: InfrastructureContext): Promise<void> {
    if (!context.monitoring) {
      context.monitoring = {
        metricsCollected: false,
        alertsConfigured: false,
        dashboardDeployed: false,
        healthChecks: false
      };
    }

    context.monitoring.healthChecks = true;
    context.monitoring.metricsCollected = true;
    context.monitoring.alertsConfigured = true;
    context.monitoring.dashboardDeployed = true;
  }

  /**
   * Validate monitoring
   */
  static validate(context: InfrastructureContext): boolean {
    return context.monitoring?.healthChecks === true;
  }
}