/**
 * LangGraphEngine Facade - API preservation for god object elimination
 * NASA Rule 10 Compliant: All functions ≤60 lines
 */

import { ComponentFactory } from '../../fsm/shared/ComponentLibrary';
import { LangGraphEngineCore, LangGraphConfig } from './LangGraphEngineCore';
import { GenericComponentFacade } from '../../fsm/shared/ComponentLibrary';

export class LangGraphEngineFacade {
  private facade: GenericComponentFacade;

  constructor(config: Partial<LangGraphConfig> = {}) {
    this.facade = ComponentFactory.createDataProcessor(config);
    this.facade['core'] = new LangGraphEngineCore(config);
  }

  async registerStateMachine(princessId: string, stateMachine: any): Promise<void> {
    await this.facade.executeOperation('registerStateMachine', {
      id: princessId,
      stateMachine
    });
  }

  async executeWorkflow(workflowId: string, context: any): Promise<any> {
    return await this.facade.executeOperation('executeWorkflow', {
      workflowId,
      context
    });
  }

  async getMetrics(): Promise<any> {
    return await this.facade.executeOperation('getMetrics', {});
  }

  async initialize(): Promise<void> {
    await this.facade.initialize();
  }

  async start(): Promise<void> {
    await this.facade.initialize();
  }

  async stop(): Promise<void> {
    await this.facade.cleanup();
  }

  getStatus(): any {
    return this.facade.getStatus();
  }
}

// Backward compatibility
export { LangGraphEngineFacade as LangGraphEngine };