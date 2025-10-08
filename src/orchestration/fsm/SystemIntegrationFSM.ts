/**
 * System Integration FSM Implementation
 * Replaces the 1687-line SystemIntegrationOrchestrator with FSM architecture
 */

import { OrchestratorBase, OrchestratorConfig } from './OrchestratorBase';
import { OrchestratorTransitionHub } from './OrchestratorTransitionHub';
import { OrchestratorEvent } from './OrchestratorStates';

export interface IntegrationRequest {
  readonly planId: string;
  readonly components: string[];
  readonly dependencies: string[];
  readonly validationRules: string[];
  readonly timeline: number;
}

export interface IntegrationResult {
  readonly planId: string;
  readonly status: 'success' | 'failed' | 'partial';
  readonly completedComponents: string[];
  readonly failedComponents: string[];
  readonly validationResults: Record<string, boolean>;
  readonly duration: number;
}

export class SystemIntegrationFSM extends OrchestratorBase {
  private currentPlan?: IntegrationRequest;
  private integrationResult?: IntegrationResult;

  constructor(transitionHub: OrchestratorTransitionHub) {
    const config: OrchestratorConfig = {
      orchestratorId: 'system-integration',
      orchestrationType: 'SystemIntegration',
      maxConcurrentTasks: 10,
      taskTimeout: 300000,
      retryAttempts: 3,
      validationEnabled: true
    };
    super(config, transitionHub);
  }

  public async start(input: IntegrationRequest): Promise<void> {
    this.currentPlan = input;
    await this.transitionTo(OrchestratorEvent.START_ORCHESTRATION);
  }

  public async cancel(): Promise<void> {
    await this.transitionTo(OrchestratorEvent.CANCEL_REQUESTED);
  }

  public async getStatus(): Promise<any> {
    return {
      currentState: this.getCurrentState(),
      plan: this.currentPlan,
      result: this.integrationResult,
      metrics: this.getMetrics(),
      errors: this.getErrors()
    };
  }

  protected async onPlanningEntered(): Promise<void> {
    if (!this.currentPlan) {
      this.addError('planning', 'No integration plan provided');
      return;
    }

    // Plan validation and dependency resolution
    for (const component of this.currentPlan.components) {
      this.addTask({
        taskId: `plan-${component}`,
        type: 'planning',
        status: 'pending',
        progress: 0
      });
    }

    await this.transitionTo(OrchestratorEvent.PLANNING_COMPLETE);
  }

  protected async onAllocatingEntered(): Promise<void> {
    if (!this.currentPlan) return;

    // Resource allocation for integration
    for (const component of this.currentPlan.components) {
      this.allocateResource({
        resourceId: `resource-${component}`,
        type: 'integration',
        allocated: true,
        capacity: 1,
        usage: 0
      });

      this.updateTask(`plan-${component}`, { status: 'running', progress: 25 });
    }

    await this.transitionTo(OrchestratorEvent.ALLOCATION_COMPLETE);
  }

  protected async onExecutingEntered(): Promise<void> {
    if (!this.currentPlan) return;

    // Execute integration for each component
    const results: Record<string, boolean> = {};
    const completed: string[] = [];
    const failed: string[] = [];

    for (const component of this.currentPlan.components) {
      try {
        // Simulate integration execution
        const success = await this.integrateComponent(component);
        results[component] = success;

        if (success) {
          completed.push(component);
          this.updateTask(`plan-${component}`, {
            status: 'completed',
            progress: 100,
            endTime: Date.now()
          });
        } else {
          failed.push(component);
          this.updateTask(`plan-${component}`, {
            status: 'failed',
            progress: 50
          });
        }
      } catch (error) {
        failed.push(component);
        this.addError('execution', `Component ${component} failed: ${error}`);
      }
    }

    this.integrationResult = {
      planId: this.currentPlan.planId,
      status: failed.length === 0 ? 'success' : completed.length > 0 ? 'partial' : 'failed',
      completedComponents: completed,
      failedComponents: failed,
      validationResults: results,
      duration: Date.now() - this.context.startTime
    };

    if (this.config.validationEnabled) {
      await this.transitionTo(OrchestratorEvent.VALIDATION_REQUIRED);
    } else {
      await this.transitionTo(OrchestratorEvent.EXECUTION_COMPLETE);
    }
  }

  protected async onMonitoringEntered(): Promise<void> {
    // Monitor integration health
    if (this.integrationResult) {
      for (const component of this.integrationResult.completedComponents) {
        const health = await this.checkComponentHealth(component);
        if (!health) {
          this.addError('monitoring', `Component ${component} health check failed`);
        }
      }
    }
  }

  protected async onValidatingEntered(): Promise<void> {
    if (!this.currentPlan || !this.integrationResult) return;

    let allValidationsPassed = true;

    // Run validation rules
    for (const rule of this.currentPlan.validationRules) {
      const passed = await this.validateRule(rule);
      if (!passed) {
        allValidationsPassed = false;
        this.addError('validation', `Validation rule failed: ${rule}`);
      }
    }

    if (allValidationsPassed) {
      await this.transitionTo(OrchestratorEvent.VALIDATION_PASSED);
    } else {
      await this.transitionTo(OrchestratorEvent.VALIDATION_FAILED);
    }
  }

  protected async onCompletingEntered(): Promise<void> {
    // Clean up resources
    if (this.currentPlan) {
      for (const component of this.currentPlan.components) {
        this.releaseResource(`resource-${component}`);
      }
    }

    this.emit('integrationCompleted', this.integrationResult);
    await this.transitionTo(OrchestratorEvent.RESET);
  }

  protected async onErrorEntered(): Promise<void> {
    this.emit('integrationFailed', {
      plan: this.currentPlan,
      errors: this.getErrors(),
      partialResult: this.integrationResult
    });

    // Clean up on error
    if (this.currentPlan) {
      for (const component of this.currentPlan.components) {
        this.releaseResource(`resource-${component}`);
      }
    }
  }

  private async integrateComponent(component: string): Promise<boolean> {
    // Simulate component integration
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.1); // 90% success rate
      }, 100);
    });
  }

  private async checkComponentHealth(component: string): Promise<boolean> {
    // Simulate health check
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.05); // 95% health rate
      }, 50);
    });
  }

  private async validateRule(rule: string): Promise<boolean> {
    // Simulate validation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.2); // 80% validation rate
      }, 50);
    });
  }
}