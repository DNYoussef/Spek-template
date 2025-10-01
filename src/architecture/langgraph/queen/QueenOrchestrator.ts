/**
 * QueenOrchestrator - NASA Rule 10 Compliant Queen-Level Workflow Orchestration
 * Provides high-level orchestration for Princess state machines with FSM hierarchy management,
 * task delegation, resource allocation, and strategic decision-making capabilities.
 *
 * NASA Rule 10: Loop bounds must be fixed and deterministic
 * FSM: Finite State Machine architecture for predictable behavior
 */

import { EventEmitter } from 'events';
import LangGraphEngine from '../LangGraphEngine';
import WorkflowOrchestrator from '../workflows/WorkflowOrchestrator';
import MessageRouter from '../communication/MessageRouter';
import EventBus from '../communication/EventBus';
import PrincessStateMachine from '../state-machines/PrincessStateMachine';
import { WorkflowDefinition, ExecutionContext } from '../types/workflow.types';
import { QueenFSMStates, QueenFSMEvents } from './types/QueenFSMTypes';
import { QueenConfiguration, StrategicObjective, ExecutionPlan, ResourceAllocation,
         DecisionContext, DecisionResult, QueenMetrics } from './types/QueenTypes';
import { NASACompliantLoopHandler } from './utils/NASACompliantLoopHandler';
import { QueenDecisionEngine } from './engines/QueenDecisionEngine';
import { ResourceManager } from './managers/ResourceManager';
import { ObjectiveManager } from './managers/ObjectiveManager';
import { ExecutionManager } from './managers/ExecutionManager';
import { QueenCoordinator } from './core/QueenCoordinator';

// All type definitions moved to ./types/QueenTypes.ts for better organization

export class QueenOrchestrator extends EventEmitter {
  // NASA Rule 10: Fixed loop bounds configuration
  private static readonly MAX_PRINCESS_COUNT = 10;
  private static readonly MAX_OBJECTIVE_COUNT = 100;
  private static readonly MAX_EXECUTION_PHASES = 20;
  private static readonly MAX_DECISION_OPTIONS = 5;
  private static readonly MAX_ESCALATION_RETRIES = 3;
  private static readonly MAX_WORKFLOW_ITERATIONS = 50;

  // FSM State Management
  private currentState: QueenFSMStates;
  private fsm: QueenFSMStates;
  private stateHistory: QueenFSMStates[];

  // Core Dependencies
  private config: QueenConfiguration;
  private engine: LangGraphEngine;
  private workflowOrchestrator: WorkflowOrchestrator;
  private messageRouter: MessageRouter;
  private eventBus: EventBus;

  // Decomposed Managers (NASA Rule 10 compliant)
  private queenCoordinator: QueenCoordinator;
  private resourceManager: ResourceManager;
  private objectiveManager: ObjectiveManager;
  private executionManager: ExecutionManager;
  private decisionEngine: QueenDecisionEngine;
  private loopHandler: NASACompliantLoopHandler;

  // Bounded Collections
  private princesses: Map<string, PrincessStateMachine>;
  private metrics: QueenMetrics;

  constructor(
    config: QueenConfiguration,
    engine: LangGraphEngine,
    workflowOrchestrator: WorkflowOrchestrator,
    messageRouter: MessageRouter,
    eventBus: EventBus
  ) {
    super();

    // Core dependencies
    this.config = config;
    this.engine = engine;
    this.workflowOrchestrator = workflowOrchestrator;
    this.messageRouter = messageRouter;
    this.eventBus = eventBus;

    // FSM State initialization
    this.currentState = QueenFSMStates.INITIALIZING;
    this.fsm = QueenFSMStates.INITIALIZING;
    this.stateHistory = [];

    // NASA Rule 10 compliant managers
    this.loopHandler = new NASACompliantLoopHandler({
      maxPrincessCount: QueenOrchestrator.MAX_PRINCESS_COUNT,
      maxObjectiveCount: QueenOrchestrator.MAX_OBJECTIVE_COUNT,
      maxExecutionPhases: QueenOrchestrator.MAX_EXECUTION_PHASES,
      maxDecisionOptions: QueenOrchestrator.MAX_DECISION_OPTIONS,
      maxEscalationRetries: QueenOrchestrator.MAX_ESCALATION_RETRIES,
      maxWorkflowIterations: QueenOrchestrator.MAX_WORKFLOW_ITERATIONS
    });

    this.resourceManager = new ResourceManager(this.loopHandler);
    this.objectiveManager = new ObjectiveManager(this.loopHandler);
    this.executionManager = new ExecutionManager(this.loopHandler);
    this.decisionEngine = new QueenDecisionEngine(config, this.loopHandler);
    this.queenCoordinator = new QueenCoordinator(config, this.resourceManager);

    // Bounded collections
    this.princesses = new Map();

    this.metrics = {
      activeObjectives: 0,
      completedObjectives: 0,
      successRate: 0,
      averageExecutionTime: 0,
      resourceUtilization: {},
      decisionAccuracy: 0,
      learningProgress: 0,
      autonomyLevel: config.autonomyLevel,
      systemHealth: {
        overall: 'good',
        components: {}
      }
    };

    this.initializeQueenOrchestration();
  }

  /**
   * Register a Princess state machine with the Queen (NASA Rule 10 compliant)
   */
  async registerPrincess(princessId: string, stateMachine: PrincessStateMachine): Promise<void> {
    // FSM State transition
    this.transitionToState(QueenFSMStates.REGISTERING_PRINCESS);

    try {
      // Delegate to QueenCoordinator
      await this.queenCoordinator.registerPrincess(princessId, stateMachine);
      this.princesses.set(princessId, stateMachine);

      this.transitionToState(QueenFSMStates.ACTIVE);
      this.emit('princessRegistered', princessId);
    } catch (error) {
      this.transitionToState(QueenFSMStates.ERROR);
      throw error;
    }
  }

  /**
   * Define a strategic objective (NASA Rule 10 compliant)
   */
  async defineObjective(objective: Omit<StrategicObjective, 'id' | 'status' | 'metadata'>): Promise<string> {
    // FSM State transition
    this.transitionToState(QueenFSMStates.DEFINING_OBJECTIVE);

    try {
      // Delegate to ObjectiveManager with bounded collection
      const objectiveId = await this.objectiveManager.defineObjective(objective);

      this.transitionToState(QueenFSMStates.ACTIVE);
      this.updateMetrics();
      this.emit('objectiveDefined', objectiveId);

      return objectiveId;
    } catch (error) {
      this.transitionToState(QueenFSMStates.ERROR);
      throw error;
    }
  }

  /**
   * Plan execution for an objective (NASA Rule 10 compliant)
   */
  async planExecution(objectiveId: string): Promise<string> {
    // FSM State transition
    this.transitionToState(QueenFSMStates.PLANNING_EXECUTION);

    try {
      // Delegate to ObjectiveManager and ExecutionManager
      const objective = await this.objectiveManager.getObjective(objectiveId);
      if (!objective) {
        throw new Error(`Objective not found: ${objectiveId}`);
      }

      // Update objective status
      await this.objectiveManager.updateObjectiveStatus(objectiveId, 'planning');

      // Generate execution plan with bounded phases
      const planId = await this.executionManager.generateExecutionPlan(
        objective,
        this.resourceManager,
        QueenOrchestrator.MAX_EXECUTION_PHASES
      );

      this.transitionToState(QueenFSMStates.ACTIVE);
      this.emit('executionPlanned', planId);

      return planId;
    } catch (error) {
      this.transitionToState(QueenFSMStates.ERROR);
      throw error;
    }
  }

  /**
   * Execute a strategic objective (NASA Rule 10 compliant)
   */
  async executeObjective(objectiveId: string, planId?: string): Promise<string> {
    // FSM State transition
    this.transitionToState(QueenFSMStates.EXECUTING_OBJECTIVE);

    try {
      // Delegate to ExecutionManager with bounded execution
      const executionId = await this.executionManager.executeObjective(
        objectiveId,
        planId,
        this.objectiveManager,
        this.workflowOrchestrator,
        QueenOrchestrator.MAX_WORKFLOW_ITERATIONS
      );

      this.transitionToState(QueenFSMStates.ACTIVE);
      this.emit('objectiveExecutionStarted', executionId);

      return executionId;
    } catch (error) {
      this.transitionToState(QueenFSMStates.ERROR);
      throw error;
    }
  }

  /**
   * Make strategic decisions (NASA Rule 10 compliant)
   */
  async makeDecision(context: DecisionContext): Promise<DecisionResult> {
    // FSM State transition
    this.transitionToState(QueenFSMStates.MAKING_DECISION);

    try {
      // NASA Rule 10: Limit decision options to bounded set
      if (context.options.length > QueenOrchestrator.MAX_DECISION_OPTIONS) {
        context.options = context.options.slice(0, QueenOrchestrator.MAX_DECISION_OPTIONS);
      }

      // Delegate to DecisionEngine
      const decision = await this.decisionEngine.processDecision(context);

      this.transitionToState(QueenFSMStates.ACTIVE);
      this.emit('decisionMade', context, decision);

      return decision;
    } catch (error) {
      this.transitionToState(QueenFSMStates.ERROR);
      throw error;
    }
  }

  /**
   * Delegate tasks to appropriate Princesses (NASA Rule 10 compliant)
   */
  async delegateTask(
    task: any,
    requirements: string[] = [],
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<{ princessId: string; taskId: string }> {
    // FSM State transition
    this.transitionToState(QueenFSMStates.DELEGATING_TASK);

    try {
      // Delegate to QueenCoordinator
      const result = await this.queenCoordinator.delegateTask(task, requirements, priority);

      this.transitionToState(QueenFSMStates.ACTIVE);
      this.emit('taskDelegated', result.princessId, result.taskId, task);

      return result;
    } catch (error) {
      this.transitionToState(QueenFSMStates.ERROR);
      throw error;
    }
  }

  /**
   * Monitor execution progress (NASA Rule 10 compliant)
   */
  getExecutionProgress(executionId: string): any {
    return this.executionManager.getExecutionProgress(executionId);
  }

  /**
   * Get Queen metrics and status
   */
  getQueenMetrics(): QueenMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get resource status across all Princesses
   */
  getResourceStatus(): Record<string, any> {
    return this.queenCoordinator.getCoordinationStatus();
  }

  /**
   * Handle escalations from Princesses (NASA Rule 10 compliant)
   */
  async handleEscalation(
    princessId: string,
    issue: any,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<any> {
    // FSM State transition
    this.transitionToState(QueenFSMStates.HANDLING_ESCALATION);

    try {
      // NASA Rule 10: Bounded escalation options
      const escalationOptions = await this.decisionEngine.generateEscalationOptions(
        princessId,
        issue,
        QueenOrchestrator.MAX_ESCALATION_RETRIES
      );

      const escalationContext: DecisionContext = {
        objectiveId: 'escalation',
        situation: `Escalation from ${princessId}: ${issue.description}`,
        options: escalationOptions.slice(0, QueenOrchestrator.MAX_DECISION_OPTIONS),
        constraints: [],
        timeConstraint: severity === 'critical' ? 300000 : 1800000,
        requiredConfidence: 0.8,
        stakeholders: [princessId]
      };

      const decision = await this.makeDecision(escalationContext);
      await this.decisionEngine.implementEscalationDecision(princessId, issue, decision);

      this.transitionToState(QueenFSMStates.ACTIVE);
      this.emit('escalationHandled', princessId, issue, decision);

      return decision;
    } catch (error) {
      this.transitionToState(QueenFSMStates.ERROR);
      throw error;
    }
  }

  // All method implementations delegated to specialized managers
  // QueenCoordinator: Princess registration, task delegation, monitoring
  // ResourceManager: Resource allocation, error handling, metrics
  // ObjectiveManager: Objective definition, status tracking, metrics
  // ExecutionManager: Execution planning, workflow management, monitoring
  // DecisionEngine: Strategic decision making, escalation handling
  // This eliminates god object pattern through manager pattern delegation

  /**
   * FSM State Transition - Private method for state management
   * NASA Rule 10: Simple state transition with bounded history
   */
  private transitionToState(newState: QueenFSMStates): void {
    const oldState = this.currentState;
    this.currentState = newState;
    this.fsm = newState;

    // NASA Rule 10: Bounded state history (max 100 entries)
    this.stateHistory.push(newState);
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift();
    }

    this.emit('stateTransition', { from: oldState, to: newState, timestamp: Date.now() });
  }

  /**
   * Initialize Queen Orchestration - Private initialization method
   * NASA Rule 10: Simple initialization with fixed bounds
   */
  private initializeQueenOrchestration(): void {
    this.transitionToState(QueenFSMStates.ACTIVE);
    this.emit('queenInitialized', { timestamp: Date.now(), config: this.config });
  }

  /**
   * Update Metrics - Private method for metric updates
   * NASA Rule 10: Simple metric calculation with bounded loops
   */
  private updateMetrics(): void {
    this.metrics.activeObjectives = this.objectiveManager.getActiveCount();
    this.metrics.completedObjectives = this.objectiveManager.getCompletedCount();
    this.metrics.successRate = this.objectiveManager.getSuccessRate();
    this.metrics.resourceUtilization = this.resourceManager.getUtilization();
    this.metrics.decisionAccuracy = this.decisionEngine.getAccuracy();
  }

}

export default QueenOrchestrator;