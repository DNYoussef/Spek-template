/**
 * LangGraph Controller - API Layer for LangGraph State Machine Management
 * RESTful API endpoints for managing Princess state machines, workflows,
 * and monitoring in the LangGraph integration system.
 */

import { Request, Response } from 'express';
import LangGraphEngine from '../../architecture/langgraph/LangGraphEngine';
import WorkflowOrchestrator from '../../architecture/langgraph/workflows/WorkflowOrchestrator';
import StateStore from '../../architecture/langgraph/StateStore';
import PrincessStateMachine from '../../architecture/langgraph/state-machines/PrincessStateMachine';
import InfrastructureStateMachine from '../../architecture/langgraph/state-machines/InfrastructureStateMachine';
import ResearchStateMachine from '../../architecture/langgraph/state-machines/ResearchStateMachine';
import { WorkflowDefinition, ExecutionContext } from '../../architecture/langgraph/types/workflow.types';

export interface LangGraphControllerConfig {
  engine: LangGraphEngine;
  orchestrator: WorkflowOrchestrator;
  stateStore: StateStore;
  enableAnalytics: boolean;
  enableDebugMode: boolean;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export class LangGraphController {
  private engine: LangGraphEngine;
  private orchestrator: WorkflowOrchestrator;
  private stateStore: StateStore;
  private stateMachines: Map<string, PrincessStateMachine>;
  private config: LangGraphControllerConfig;

  constructor(config: LangGraphControllerConfig) {
    this.config = config;
    this.engine = config.engine;
    this.orchestrator = config.orchestrator;
    this.stateStore = config.stateStore;
    this.stateMachines = new Map();

    this.initializePrincessStateMachines();
  }

  /**
   * GET /langgraph/states
   * Get current state of all Princess state machines
   */
  async getStates(req: Request, res: Response): Promise<void> {
    try {
      const { princessId, format = 'summary' } = req.query;

      if (princessId) {
        // Get specific Princess state
        const state = await this.stateStore.getCurrentState(princessId as string);
        if (!state) {
          res.status(404).json({
            error: 'Princess not found',
            message: `No state found for Princess: ${princessId}`
          });
          return;
        }

        res.json({
          princessId,
          state: format === 'detailed' ? state : {
            name: state.state,
            timestamp: state.timestamp,
            version: state.version
          }
        });
      } else {
        // Get all Princess states
        const allStates = await this.stateStore.getAllStates();
        const statesSummary = {};

        for (const [id, state] of allStates) {
          statesSummary[id] = format === 'detailed' ? state : {
            name: state.state,
            timestamp: state.timestamp,
            version: state.version
          };
        }

        res.json({
          totalPrincesses: allStates.size,
          states: statesSummary,
          timestamp: new Date()
        });
      }
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve states');
    }
  }

  /**
   * POST /langgraph/workflow
   * Create and execute new workflows
   */
  async createWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { type, template, definition, variables = {}, context = {} } = req.body;

      let workflowDefinition: WorkflowDefinition;

      switch (type) {
        case 'template':
          if (!template) {
            res.status(400).json({
              error: 'Template required',
              message: 'Template ID must be provided for template-based workflows'
            });
            return;
          }
          workflowDefinition = await this.orchestrator.createWorkflowFromTemplate(
            template,
            variables,
            context
          );
          break;

        case 'natural':
          if (!req.body.description) {
            res.status(400).json({
              error: 'Description required',
              message: 'Natural language description must be provided'
            });
            return;
          }
          workflowDefinition = await this.orchestrator.createWorkflowFromDescription(
            req.body.description,
            context
          );
          break;

        case 'composite':
          if (!req.body.domains || !Array.isArray(req.body.domains)) {
            res.status(400).json({
              error: 'Domains required',
              message: 'Array of Princess domains must be provided'
            });
            return;
          }
          workflowDefinition = await this.orchestrator.createCompositeWorkflow(
            req.body.domains,
            req.body.coordination || 'sequential',
            context
          );
          break;

        case 'custom':
          if (!definition) {
            res.status(400).json({
              error: 'Definition required',
              message: 'Workflow definition must be provided for custom workflows'
            });
            return;
          }
          workflowDefinition = definition;
          break;

        default:
          res.status(400).json({
            error: 'Invalid workflow type',
            message: 'Type must be one of: template, natural, composite, custom'
          });
          return;
      }

      // Execute the workflow
      const workflowId = await this.orchestrator.executeWorkflow(workflowDefinition, context);

      res.status(201).json({
        workflowId,
        definition: workflowDefinition,
        status: 'created',
        message: 'Workflow created and execution started'
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to create workflow');
    }
  }

  /**
   * GET /langgraph/workflow/:workflowId
   * Get workflow status and details
   */
  async getWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.params;
      const { includeMetrics = false, includeHistory = false } = req.query;

      const execution = this.orchestrator.getWorkflowStatus(workflowId);
      if (!execution) {
        res.status(404).json({
          error: 'Workflow not found',
          message: `No workflow found with ID: ${workflowId}`
        });
        return;
      }

      const response: any = {
        workflowId,
        status: execution.status,
        currentState: execution.currentState,
        startTime: execution.startTime,
        endTime: execution.endTime,
        duration: execution.endTime
          ? execution.endTime.getTime() - execution.startTime.getTime()
          : Date.now() - execution.startTime.getTime()
      };

      if (includeMetrics === 'true') {
        const metrics = this.orchestrator.getWorkflowMetrics(workflowId);
        response.metrics = metrics;
      }

      if (includeHistory === 'true') {
        response.stateHistory = execution.stateHistory;
      }

      if (execution.error) {
        response.error = {
          message: execution.error.message,
          stack: this.config.enableDebugMode ? execution.error.stack : undefined
        };
      }

      res.json(response);

    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve workflow');
    }
  }

  /**
   * PUT /langgraph/transition
   * Force state transitions (admin only)
   */
  async forceTransition(req: Request, res: Response): Promise<void> {
    try {
      const { princessId, trigger, context = {} } = req.body;

      if (!princessId || !trigger) {
        res.status(400).json({
          error: 'Missing parameters',
          message: 'princessId and trigger are required'
        });
        return;
      }

      const stateMachine = this.stateMachines.get(princessId);
      if (!stateMachine) {
        res.status(404).json({
          error: 'Princess not found',
          message: `No state machine found for Princess: ${princessId}`
        });
        return;
      }

      const previousState = stateMachine.getCurrentState();
      await stateMachine.transition(trigger, context);
      const newState = stateMachine.getCurrentState();

      res.json({
        princessId,
        transition: {
          from: previousState.name,
          to: newState.name,
          trigger,
          timestamp: new Date()
        },
        message: 'State transition completed successfully'
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to execute state transition');
    }
  }

  /**
   * GET /langgraph/analytics
   * Get state machine performance analytics
   */
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const {
        princessId,
        timeRange = '24h',
        metrics = 'all',
        format = 'summary'
      } = req.query;

      if (!this.config.enableAnalytics) {
        res.status(403).json({
          error: 'Analytics disabled',
          message: 'Analytics feature is not enabled'
        });
        return;
      }

      const analytics = await this.generateAnalytics({
        princessId: princessId as string,
        timeRange: timeRange as string,
        metrics: metrics as string,
        format: format as string
      });

      res.json(analytics);

    } catch (error) {
      this.handleError(res, error, 'Failed to generate analytics');
    }
  }

  /**
   * POST /langgraph/recovery
   * Trigger state recovery procedures
   */
  async triggerRecovery(req: Request, res: Response): Promise<void> {
    try {
      const { princessId, type = 'auto', context = {} } = req.body;

      if (!princessId) {
        res.status(400).json({
          error: 'Missing princessId',
          message: 'princessId is required for recovery operations'
        });
        return;
      }

      const stateMachine = this.stateMachines.get(princessId);
      if (!stateMachine) {
        res.status(404).json({
          error: 'Princess not found',
          message: `No state machine found for Princess: ${princessId}`
        });
        return;
      }

      let recoveryResult;

      switch (type) {
        case 'auto':
          // Automatic recovery based on current state
          recoveryResult = await this.performAutoRecovery(stateMachine, context);
          break;

        case 'manual':
          // Manual recovery with specific instructions
          if (!context.recoveryPlan) {
            res.status(400).json({
              error: 'Recovery plan required',
              message: 'Manual recovery requires a recovery plan in context'
            });
            return;
          }
          recoveryResult = await this.performManualRecovery(stateMachine, context.recoveryPlan);
          break;

        case 'rollback':
          // Rollback to previous state
          recoveryResult = await this.performRollbackRecovery(stateMachine);
          break;

        default:
          res.status(400).json({
            error: 'Invalid recovery type',
            message: 'Recovery type must be one of: auto, manual, rollback'
          });
          return;
      }

      res.json({
        princessId,
        recoveryType: type,
        result: recoveryResult,
        timestamp: new Date(),
        message: 'Recovery procedure completed'
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to execute recovery procedure');
    }
  }

  /**
   * GET /langgraph/templates
   * List available workflow templates
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { category, complexity, search } = req.query;

      let templates = this.orchestrator.getAvailableTemplates();

      // Apply filters
      if (category) {
        templates = templates.filter(t => t.category === category);
      }

      if (complexity) {
        templates = templates.filter(t => t.metadata.complexity === complexity);
      }

      if (search) {
        const searchTerm = (search as string).toLowerCase();
        templates = templates.filter(t =>
          t.name.toLowerCase().includes(searchTerm) ||
          t.description.toLowerCase().includes(searchTerm)
        );
      }

      res.json({
        totalTemplates: templates.length,
        templates: templates.map(template => ({
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          complexity: template.metadata.complexity,
          estimatedDuration: template.metadata.estimatedDuration,
          variables: template.variables.map(v => ({
            name: v.name,
            type: v.type,
            required: v.required,
            description: v.description || `${v.name} parameter`
          }))
        }))
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve templates');
    }
  }

  /**
   * GET /langgraph/health
   * System health and status check
   */
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = await this.performHealthCheck();

      const statusCode = healthStatus.overall === 'healthy' ? 200 :
                        healthStatus.overall === 'degraded' ? 200 : 503;

      res.status(statusCode).json(healthStatus);

    } catch (error) {
      res.status(503).json({
        overall: 'unhealthy',
        timestamp: new Date(),
        error: error.message
      });
    }
  }

  /**
   * DELETE /langgraph/workflow/:workflowId
   * Cancel a running workflow
   */
  async cancelWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.params;

      await this.orchestrator.cancelWorkflow(workflowId);

      res.json({
        workflowId,
        status: 'cancelled',
        timestamp: new Date(),
        message: 'Workflow cancelled successfully'
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to cancel workflow');
    }
  }

  /**
   * GET /langgraph/optimization/:workflowId
   * Get optimization suggestions for a workflow
   */
  async getOptimizations(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.params;

      const suggestions = await this.orchestrator.getOptimizationSuggestions(workflowId);

      res.json({
        workflowId,
        suggestions,
        totalSuggestions: suggestions.length,
        timestamp: new Date()
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to generate optimization suggestions');
    }
  }

  /**
   * Private helper methods
   */
  private async initializePrincessStateMachines(): Promise<void> {
    // Initialize Infrastructure Princess
    const infrastructurePrincess = new InfrastructureStateMachine();
    await this.engine.registerStateMachine('infrastructure', infrastructurePrincess);
    this.stateMachines.set('infrastructure', infrastructurePrincess);

    // Initialize Research Princess
    const researchPrincess = new ResearchStateMachine();
    await this.engine.registerStateMachine('research', researchPrincess);
    this.stateMachines.set('research', researchPrincess);

    // Add more Princess state machines as they're implemented
    // TODO: Add Development, Security, Deployment Princesses
  }

  private async generateAnalytics(params: {
    princessId?: string;
    timeRange: string;
    metrics: string;
    format: string;
  }): Promise<any> {
    const analytics = {
      timeRange: params.timeRange,
      generatedAt: new Date(),
      data: {}
    };

    if (params.princessId) {
      // Generate analytics for specific Princess
      const stateMachine = this.stateMachines.get(params.princessId);
      if (stateMachine) {
        analytics.data[params.princessId] = {
          currentState: stateMachine.getCurrentState(),
          performance: stateMachine.getPerformanceMetrics(),
          capabilities: stateMachine.getCapabilities(),
          taskHistory: stateMachine.getTaskHistory(20)
        };
      }
    } else {
      // Generate analytics for all Princesses
      for (const [princessId, stateMachine] of this.stateMachines) {
        analytics.data[princessId] = {
          currentState: stateMachine.getCurrentState(),
          performance: stateMachine.getPerformanceMetrics(),
          capabilities: stateMachine.getCapabilities().length,
          taskHistory: stateMachine.getTaskHistory(10).length
        };
      }
    }

    // Add system-wide metrics
    if (params.metrics === 'all' || params.metrics.includes('system')) {
      analytics.data.system = {
        runningWorkflows: this.engine.getRunningWorkflows().length,
        stateStoreStats: await this.stateStore.getStorageStats(),
        engineMetrics: this.getEngineMetrics()
      };
    }

    return analytics;
  }

  private async performAutoRecovery(
    stateMachine: PrincessStateMachine,
    context: any
  ): Promise<any> {
    const currentState = stateMachine.getCurrentState();

    try {
      // Attempt automatic recovery based on state machine's recovery logic
      await stateMachine.recoverFromError(new Error('Manual recovery triggered'));

      return {
        type: 'auto',
        success: true,
        previousState: currentState.name,
        newState: stateMachine.getCurrentState().name,
        actions: ['automatic_recovery_executed']
      };
    } catch (error) {
      return {
        type: 'auto',
        success: false,
        error: error.message,
        actions: ['recovery_failed']
      };
    }
  }

  private async performManualRecovery(
    stateMachine: PrincessStateMachine,
    recoveryPlan: any
  ): Promise<any> {
    // Implement manual recovery based on provided plan
    const actions = [];

    try {
      if (recoveryPlan.setState) {
        await stateMachine.setState(recoveryPlan.setState);
        actions.push(`set_state_to_${recoveryPlan.setState}`);
      }

      if (recoveryPlan.resetContext) {
        // Reset context (implementation depends on state machine design)
        actions.push('reset_context');
      }

      return {
        type: 'manual',
        success: true,
        actions,
        plan: recoveryPlan
      };
    } catch (error) {
      return {
        type: 'manual',
        success: false,
        error: error.message,
        actions
      };
    }
  }

  private async performRollbackRecovery(
    stateMachine: PrincessStateMachine
  ): Promise<any> {
    try {
      const currentState = stateMachine.getCurrentState();
      const previousState = await this.stateStore.getPreviousState(currentState.princessId);

      if (previousState) {
        await stateMachine.setState(previousState);
        return {
          type: 'rollback',
          success: true,
          previousState: currentState.name,
          rolledBackTo: previousState,
          actions: ['state_rollback']
        };
      } else {
        return {
          type: 'rollback',
          success: false,
          error: 'No previous state available for rollback',
          actions: []
        };
      }
    } catch (error) {
      return {
        type: 'rollback',
        success: false,
        error: error.message,
        actions: []
      };
    }
  }

  private async performHealthCheck(): Promise<any> {
    const health = {
      overall: 'healthy',
      timestamp: new Date(),
      components: {
        engine: 'unknown',
        stateStore: 'unknown',
        orchestrator: 'unknown',
        stateMachines: {}
      },
      metrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        runningWorkflows: 0,
        activePrincesses: 0
      }
    };

    try {
      // Check Engine health
      const runningWorkflows = this.engine.getRunningWorkflows();
      health.metrics.runningWorkflows = runningWorkflows.length;
      health.components.engine = 'healthy';
    } catch (error) {
      health.components.engine = 'unhealthy';
      health.overall = 'degraded';
    }

    try {
      // Check StateStore health
      await this.stateStore.getStorageStats();
      health.components.stateStore = 'healthy';
    } catch (error) {
      health.components.stateStore = 'unhealthy';
      health.overall = 'degraded';
    }

    try {
      // Check Orchestrator health
      this.orchestrator.getAvailableTemplates();
      health.components.orchestrator = 'healthy';
    } catch (error) {
      health.components.orchestrator = 'unhealthy';
      health.overall = 'degraded';
    }

    // Check individual Princess state machines
    let activePrincesses = 0;
    for (const [princessId, stateMachine] of this.stateMachines) {
      try {
        const state = stateMachine.getCurrentState();
        health.components.stateMachines[princessId] = {
          status: 'healthy',
          currentState: state.name,
          lastUpdated: state.metadata.enteredAt
        };
        activePrincesses++;
      } catch (error) {
        health.components.stateMachines[princessId] = {
          status: 'unhealthy',
          error: error.message
        };
        health.overall = 'degraded';
      }
    }

    health.metrics.activePrincesses = activePrincesses;

    return health;
  }

  private getEngineMetrics(): any {
    return {
      runningWorkflows: this.engine.getRunningWorkflows().length,
      totalWorkflowsExecuted: 'not_implemented', // Would track this in production
      averageExecutionTime: 'not_implemented',
      errorRate: 'not_implemented'
    };
  }

  private handleError(res: Response, error: any, message: string): void {
    console.error(`LangGraph API Error: ${message}`, error);

    const statusCode = error.statusCode || 500;
    const response: any = {
      error: message,
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date()
    };

    if (this.config.enableDebugMode) {
      response.stack = error.stack;
      response.details = error.details || {};
    }

    res.status(statusCode).json(response);
  }
}

export default LangGraphController;