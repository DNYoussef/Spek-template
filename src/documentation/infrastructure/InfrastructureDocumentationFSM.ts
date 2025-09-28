/**
 * Infrastructure Documentation State Machine - FSM Controller
 * NASA Rule 10 compliant with API documentation lifecycle management
 */

import { EventEmitter } from 'events';
import { DocStates, DocEvents, DocContext } from './types/InfrastructureDocTypes';
import { TemplateLoadingStateHandler } from './states/TemplateLoadingStateHandler';
import { GeneratingStateHandler } from './states/GeneratingStateHandler';
import { DeployingStateHandler } from './states/DeployingStateHandler';
import { MonitoringStateHandler } from './states/MonitoringStateHandler';
import { DocErrorHandler } from './core/DocErrorHandler';
import { DocTransitionGuard } from './core/DocTransitionGuard';

export class InfrastructureDocumentationFSM extends EventEmitter {
  private currentState: DocStates = DocStates.IDLE;
  private context: DocContext;
  private stateHandlers: Map<DocStates, any> = new Map();
  private errorHandler: DocErrorHandler;
  private transitionGuard: DocTransitionGuard;

  constructor() {
    super();

    this.context = {
      patternEngine: null,
      templateGenerator: null,
      documentationStore: null,
      infrastructureEndpoints: new Map(),
      deploymentConfigs: new Map(),
      componentDocs: new Map(),
      currentTemplate: null,
      generatedDocs: null,
      deploymentResult: null,
      monitoringData: null
    };

    this.initializeStateHandlers();
    this.errorHandler = new DocErrorHandler();
    this.transitionGuard = new DocTransitionGuard();
  }

  /**
   * Initialize state handlers (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private initializeStateHandlers(): void {
    // Assertion 1: State handlers map exists
    if (!(this.stateHandlers instanceof Map)) {
      throw new Error('State handlers map must be initialized');
    }

    this.stateHandlers.set(DocStates.IDLE, null);
    this.stateHandlers.set(DocStates.TEMPLATE_LOADING, new TemplateLoadingStateHandler());
    this.stateHandlers.set(DocStates.GENERATING, new GeneratingStateHandler());
    this.stateHandlers.set(DocStates.DEPLOYING, new DeployingStateHandler());
    this.stateHandlers.set(DocStates.MONITORING, new MonitoringStateHandler());
    this.stateHandlers.set(DocStates.ERROR, this.errorHandler);

    // Assertion 2: All required states have handlers or null (idle states)
    const requiredStates = Object.values(DocStates);
    for (const state of requiredStates) {
      if (!this.stateHandlers.has(state)) {
        throw new Error(`Missing state handler for ${state}`);
      }
    }
  }

  /**
   * Transition to new state (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  async transition(event: DocEvents, data?: any): Promise<boolean> {
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
  private getTargetState(currentState: DocStates, event: DocEvents): DocStates | null {
    // Assertion 1: Valid current state
    if (!currentState || typeof currentState !== 'string') {
      throw new Error('Invalid current state provided');
    }

    const transitions: Record<DocStates, Partial<Record<DocEvents, DocStates>>> = {
      [DocStates.IDLE]: {
        [DocEvents.GENERATE_API_DOCS]: DocStates.TEMPLATE_LOADING,
        [DocEvents.GENERATE_DEPLOYMENT_DOCS]: DocStates.TEMPLATE_LOADING,
        [DocEvents.MONITOR_DOCS]: DocStates.MONITORING
      },
      [DocStates.TEMPLATE_LOADING]: {
        [DocEvents.TEMPLATE_LOADED]: DocStates.GENERATING,
        [DocEvents.ERROR]: DocStates.ERROR
      },
      [DocStates.GENERATING]: {
        [DocEvents.GENERATION_COMPLETE]: DocStates.DEPLOYING,
        [DocEvents.ERROR]: DocStates.ERROR
      },
      [DocStates.DEPLOYING]: {
        [DocEvents.DEPLOYMENT_COMPLETE]: DocStates.MONITORING,
        [DocEvents.ERROR]: DocStates.ERROR
      },
      [DocStates.MONITORING]: {
        [DocEvents.MONITORING_COMPLETE]: DocStates.IDLE,
        [DocEvents.UPDATE_DOCS]: DocStates.GENERATING,
        [DocEvents.ERROR]: DocStates.ERROR
      },
      [DocStates.ERROR]: {
        [DocEvents.RESET]: DocStates.IDLE,
        [DocEvents.RETRY]: DocStates.TEMPLATE_LOADING
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
  async generateAPIDocumentation(endpoints: any[]): Promise<any> {
    const success = await this.transition(DocEvents.GENERATE_API_DOCS, { endpoints });
    return this.context.generatedDocs;
  }

  async generateDeploymentDocumentation(deploymentConfig: any): Promise<any> {
    const success = await this.transition(DocEvents.GENERATE_DEPLOYMENT_DOCS, { deploymentConfig });
    return this.context.generatedDocs;
  }

  async generateMonitoringDocumentation(components: any[]): Promise<any> {
    const success = await this.transition(DocEvents.GENERATE_MONITORING_DOCS, { components });
    return this.context.generatedDocs;
  }

  async updatePatterns(changes: any[]): Promise<any> {
    const success = await this.transition(DocEvents.UPDATE_DOCS, { changes });
    return this.context.generatedDocs;
  }

  getCurrentState(): DocStates {
    return this.currentState;
  }

  getContext(): DocContext {
    return { ...this.context };
  }

  // State management helpers
  private async exitState(state: DocStates): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.exit) {
      await handler.exit(this.context);
    }
  }

  private async enterState(state: DocStates, data?: any): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.enter) {
      await handler.enter(this.context, data);
    }
  }

  private async handleTransitionError(error: Error, event: DocEvents, data?: any): Promise<void> {
    this.context.lastError = error;
    this.currentState = DocStates.ERROR;
    await this.enterState(DocStates.ERROR, { error, event, data });
  }
}