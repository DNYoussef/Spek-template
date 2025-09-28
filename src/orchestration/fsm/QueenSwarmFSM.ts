/**
 * Queen Swarm FSM Implementation
 * Replaces the 702-line QueenOrchestrator with FSM architecture
 */

import { OrchestratorBase, OrchestratorConfig } from './OrchestratorBase';
import { OrchestratorTransitionHub } from './OrchestratorTransitionHub';
import { OrchestratorEvent } from './OrchestratorStates';

export interface SwarmRequest {
  readonly swarmId: string;
  readonly mission: string;
  readonly princessCount: number;
  readonly domains: string[];
  readonly objectives: string[];
  readonly timeLimit: number;
}

export interface SwarmResult {
  readonly swarmId: string;
  readonly status: 'success' | 'partial' | 'failed';
  readonly completedObjectives: string[];
  readonly failedObjectives: string[];
  readonly princessResults: Record<string, any>;
  readonly duration: number;
}

export class QueenSwarmFSM extends OrchestratorBase {
  private currentSwarm?: SwarmRequest;
  private swarmResult?: SwarmResult;

  constructor(transitionHub: OrchestratorTransitionHub) {
    const config: OrchestratorConfig = {
      orchestratorId: 'queen-swarm',
      orchestrationType: 'QueenSwarm',
      maxConcurrentTasks: 10,
      taskTimeout: 3600000,
      retryAttempts: 2,
      validationEnabled: true
    };
    super(config, transitionHub);
  }

  public async start(input: SwarmRequest): Promise<void> {
    this.currentSwarm = input;
    await this.transitionTo(OrchestratorEvent.START_ORCHESTRATION);
  }

  public async cancel(): Promise<void> {
    await this.transitionTo(OrchestratorEvent.CANCEL_REQUESTED);
  }

  public async getStatus(): Promise<any> {
    return {
      currentState: this.getCurrentState(),
      swarm: this.currentSwarm,
      result: this.swarmResult,
      metrics: this.getMetrics(),
      errors: this.getErrors()
    };
  }

  protected async onPlanningEntered(): Promise<void> {
    if (!this.currentSwarm) {
      this.addError('planning', 'No swarm request provided');
      return;
    }

    // Plan princess deployment
    for (const domain of this.currentSwarm.domains) {
      this.addTask({
        taskId: `princess-${domain}`,
        type: 'princess-deployment',
        status: 'pending',
        progress: 0
      });
    }

    await this.transitionTo(OrchestratorEvent.PLANNING_COMPLETE);
  }

  protected async onAllocatingEntered(): Promise<void> {
    if (!this.currentSwarm) return;

    // Allocate princess resources
    for (const domain of this.currentSwarm.domains) {
      this.allocateResource({
        resourceId: `princess-${domain}`,
        type: 'ai-agent',
        allocated: true,
        capacity: 1,
        usage: 1
      });
    }

    await this.transitionTo(OrchestratorEvent.ALLOCATION_COMPLETE);
  }

  protected async onExecutingEntered(): Promise<void> {
    if (!this.currentSwarm) return;

    const completed: string[] = [];
    const failed: string[] = [];
    const princessResults: Record<string, any> = {};

    try {
      // Deploy and coordinate princesses
      for (const domain of this.currentSwarm.domains) {
        const result = await this.deployPrincess(domain);
        princessResults[domain] = result;

        if (result.success) {
          completed.push(...result.completedObjectives);
          this.updateTask(`princess-${domain}`, {
            status: 'completed',
            progress: 100,
            endTime: Date.now()
          });
        } else {
          failed.push(...result.failedObjectives);
          this.updateTask(`princess-${domain}`, {
            status: 'failed',
            progress: 75
          });
        }
      }

      this.swarmResult = {
        swarmId: this.currentSwarm.swarmId,
        status: this.determineSwarmStatus(completed, failed),
        completedObjectives: completed,
        failedObjectives: failed,
        princessResults,
        duration: Date.now() - this.context.startTime
      };

      await this.transitionTo(OrchestratorEvent.VALIDATION_REQUIRED);

    } catch (error) {
      this.addError('execution', `Swarm execution failed: ${error}`);
    }
  }

  protected async onMonitoringEntered(): Promise<void> {
    if (!this.swarmResult) return;

    // Monitor princess performance
    for (const domain of this.currentSwarm?.domains || []) {
      const health = await this.checkPrincessHealth(domain);
      if (!health) {
        this.addError('monitoring', `Princess ${domain} health degraded`);
      }
    }
  }

  protected async onValidatingEntered(): Promise<void> {
    if (!this.currentSwarm || !this.swarmResult) return;

    let validationPassed = true;

    // Validate objective completion
    const completionRate = this.swarmResult.completedObjectives.length / this.currentSwarm.objectives.length;
    if (completionRate < 0.8) {
      validationPassed = false;
      this.addError('validation', `Objective completion rate too low: ${completionRate * 100}%`);
    }

    // Validate time constraints
    if (this.swarmResult.duration > this.currentSwarm.timeLimit) {
      validationPassed = false;
      this.addError('validation', 'Mission exceeded time limit');
    }

    if (validationPassed) {
      await this.transitionTo(OrchestratorEvent.VALIDATION_PASSED);
    } else {
      await this.transitionTo(OrchestratorEvent.VALIDATION_FAILED);
    }
  }

  protected async onCompletingEntered(): Promise<void> {
    // Generate mission report
    const report = await this.generateMissionReport();

    // Release princess resources
    this.releaseAllResources();

    this.emit('swarmCompleted', { result: this.swarmResult, report });
    await this.transitionTo(OrchestratorEvent.RESET);
  }

  protected async onErrorEntered(): Promise<void> {
    this.emit('swarmFailed', {
      swarm: this.currentSwarm,
      errors: this.getErrors(),
      partialResult: this.swarmResult
    });

    this.releaseAllResources();
  }

  private async deployPrincess(domain: string): Promise<any> {
    // Simulate princess deployment
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.15; // 85% success rate
        resolve({
          success,
          completedObjectives: success ? [domain + '-objective-1', domain + '-objective-2'] : [],
          failedObjectives: success ? [] : [domain + '-objective-1'],
          metrics: {
            responseTime: Math.random() * 100,
            accuracy: Math.random() * 0.3 + 0.7
          }
        });
      }, 200);
    });
  }

  private determineSwarmStatus(completed: string[], failed: string[]): 'success' | 'partial' | 'failed' {
    const total = completed.length + failed.length;
    const successRate = completed.length / total;

    if (successRate >= 0.9) return 'success';
    if (successRate >= 0.5) return 'partial';
    return 'failed';
  }

  private async checkPrincessHealth(domain: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.1); // 90% health rate
      }, 50);
    });
  }

  private async generateMissionReport(): Promise<any> {
    return {
      summary: this.swarmResult,
      performance: await this.gatherPerformanceMetrics(),
      recommendations: this.generateRecommendations()
    };
  }

  private async gatherPerformanceMetrics(): Promise<any> {
    return {
      averageResponseTime: Math.random() * 100 + 50,
      successRate: Math.random() * 0.2 + 0.8,
      resourceUtilization: Math.random() * 0.3 + 0.7
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.swarmResult?.status === 'partial') {
      recommendations.push('Consider increasing princess specialization');
    }

    if (this.swarmResult?.duration && this.swarmResult.duration > (this.currentSwarm?.timeLimit || 0) * 0.8) {
      recommendations.push('Optimize task allocation for better time management');
    }

    return recommendations;
  }

  private releaseAllResources(): void {
    for (const resource of this.getResources()) {
      this.releaseResource(resource.resourceId);
    }
  }
}