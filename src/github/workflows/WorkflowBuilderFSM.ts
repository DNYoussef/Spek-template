/**
 * Real Action Workflow Builder State Machine - GitHub Actions FSM Controller
 * NASA Rule 10 compliant with workflow creation and management lifecycle
 */

import { EventEmitter } from 'events';
import { WorkflowStates, WorkflowEvents, WorkflowContext } from '~types/WorkflowBuilderTypes';
import { TemplateStateHandler } from './states/TemplateStateHandler';
import { BuildingStateHandler } from './states/BuildingStateHandler';
import { DeploymentStateHandler } from './states/DeploymentStateHandler';
import { MonitoringStateHandler } from './states/MonitoringStateHandler';
import { WorkflowErrorHandler } from './core/WorkflowErrorHandler';
import { WorkflowTransitionGuard } from './core/WorkflowTransitionGuard';

export class WorkflowBuilderFSM extends EventEmitter {
  private currentState: WorkflowStates = WorkflowStates.IDLE;
  private context: WorkflowContext;
  private stateHandlers: Map<WorkflowStates, any> = new Map();
  private errorHandler: WorkflowErrorHandler;
  private transitionGuard: WorkflowTransitionGuard;

  constructor(authManager: any) {
    super();

    this.context = {
      authManager,
      octokit: authManager?.getAuthenticatedOctokit(),
      logger: null, // Will be initialized in state handlers
      currentTemplate: null,
      currentWorkflow: null,
      deploymentResult: null,
      monitoringData: null,
      workflowRuns: []
    };

    this.initializeStateHandlers();
    this.errorHandler = new WorkflowErrorHandler();
    this.transitionGuard = new WorkflowTransitionGuard();
  }

  /**
   * Initialize state handlers (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private initializeStateHandlers(): void {
    // Assertion 1: State handlers map exists
    if (!(this.stateHandlers instanceof Map)) {
      throw new Error('State handlers map must be initialized');
    }

    this.stateHandlers.set(WorkflowStates.IDLE, null);
    this.stateHandlers.set(WorkflowStates.TEMPLATE_LOADING, new TemplateStateHandler());
    this.stateHandlers.set(WorkflowStates.BUILDING, new BuildingStateHandler());
    this.stateHandlers.set(WorkflowStates.DEPLOYING, new DeploymentStateHandler());
    this.stateHandlers.set(WorkflowStates.MONITORING, new MonitoringStateHandler());
    this.stateHandlers.set(WorkflowStates.ERROR, this.errorHandler);

    // Assertion 2: All required states have handlers or null (idle states)
    const requiredStates = Object.values(WorkflowStates);
    for (const state of requiredStates) {
      if (!this.stateHandlers.has(state)) {
        throw new Error(`Missing state handler for ${state}`);
      }
    }
  }

  /**
   * Transition to new state (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  async transition(event: WorkflowEvents, data?: any): Promise<boolean> {
    // Assertion 1: Valid event provided
    if (!event || typeof event !== 'string') {
      throw new Error('Invalid event provided for transition');
    }

    const targetState = this.getTargetState(this.currentState, event);

    if (!targetState) {
      this.emit('transition:invalid', { from: this.currentState, event });
      return false;
    }

    // Assertion 2: Transition guard allows transition
    if (!this.transitionGuard.canTransition(this.currentState, targetState, this.context)) {
      this.emit('transition:blocked', { from: this.currentState, to: targetState, event });
      return false;
    }

    try {
      // Exit current state
      await this.exitState(this.currentState);

      // Transition
      const previousState = this.currentState;
      this.currentState = targetState;

      // Enter new state
      await this.enterState(targetState, data);

      this.emit('transition:completed', { from: previousState, to: targetState, event });
      return true;

    } catch (error) {
      await this.handleTransitionError(error, event, data);
      return false;
    }
  }

  /**
   * Get target state for event (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private getTargetState(currentState: WorkflowStates, event: WorkflowEvents): WorkflowStates | null {
    // Assertion 1: Valid current state
    if (!currentState || typeof currentState !== 'string') {
      throw new Error('Invalid current state provided');
    }

    const transitions: Record<WorkflowStates, Partial<Record<WorkflowEvents, WorkflowStates>>> = {
      [WorkflowStates.IDLE]: {
        [WorkflowEvents.CREATE_WORKFLOW]: WorkflowStates.TEMPLATE_LOADING,
        [WorkflowEvents.MONITOR_WORKFLOW]: WorkflowStates.MONITORING
      },
      [WorkflowStates.TEMPLATE_LOADING]: {
        [WorkflowEvents.TEMPLATE_LOADED]: WorkflowStates.BUILDING,
        [WorkflowEvents.ERROR]: WorkflowStates.ERROR
      },
      [WorkflowStates.BUILDING]: {
        [WorkflowEvents.BUILD_COMPLETE]: WorkflowStates.DEPLOYING,
        [WorkflowEvents.ERROR]: WorkflowStates.ERROR
      },
      [WorkflowStates.DEPLOYING]: {
        [WorkflowEvents.DEPLOYMENT_COMPLETE]: WorkflowStates.MONITORING,
        [WorkflowEvents.ERROR]: WorkflowStates.ERROR
      },
      [WorkflowStates.MONITORING]: {
        [WorkflowEvents.MONITORING_COMPLETE]: WorkflowStates.IDLE,
        [WorkflowEvents.TRIGGER_WORKFLOW]: WorkflowStates.MONITORING, // Self-transition
        [WorkflowEvents.ERROR]: WorkflowStates.ERROR
      },
      [WorkflowStates.ERROR]: {
        [WorkflowEvents.RESET]: WorkflowStates.IDLE,
        [WorkflowEvents.RETRY]: WorkflowStates.TEMPLATE_LOADING
      }
    };

    // Assertion 2: Transitions exist for current state
    const stateTransitions = transitions[currentState];
    if (!stateTransitions) {
      return null;
    }

    return stateTransitions[event] || null;
  }

  /**
   * Public API methods
   */
  async createWorkflow(owner: string, repo: string, template: any, filename?: string): Promise<any> {
    const success = await this.transition(WorkflowEvents.CREATE_WORKFLOW, {
      owner,
      repo,
      template,
      filename
    });
    return this.context.deploymentResult;
  }

  async triggerWorkflow(owner: string, repo: string, workflowId: number, ref: string, inputs?: any): Promise<void> {
    await this.transition(WorkflowEvents.TRIGGER_WORKFLOW, {
      owner,
      repo,
      workflowId,
      ref,
      inputs
    });
  }

  async monitorWorkflow(owner: string, repo: string, workflowId: number): Promise<any> {
    const success = await this.transition(WorkflowEvents.MONITOR_WORKFLOW, {
      owner,
      repo,
      workflowId
    });
    return this.context.monitoringData;
  }

  getCurrentState(): WorkflowStates {
    return this.currentState;
  }

  getContext(): WorkflowContext {
    return { ...this.context };
  }

  // State management helpers
  private async exitState(state: WorkflowStates): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.exit) {
      await handler.exit(this.context);
    }
  }

  private async enterState(state: WorkflowStates, data?: any): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.enter) {
      await handler.enter(this.context, data);
    }
  }

  private async handleTransitionError(error: Error, event: WorkflowEvents, data?: any): Promise<void> {
    this.context.lastError = error;
    this.currentState = WorkflowStates.ERROR;
    await this.enterState(WorkflowStates.ERROR, { error, event, data });
  }
}