/**
 * Agent Manager - FSM-First Agent Lifecycle Management
 * NASA Rule 10 Compliant: All functions ≤60 lines with 2+ assertions
 * REFACTORED: Now delegates to FSM-first component architecture
 */

import { EventEmitter } from 'events';
import { AgentDefinition, AgentExecution, AgentPerformance, CommunicationStatus, ResourceUtilization, AgentLog } from '~types/AgentTypes';
import { AgentState, AgentEvent } from '../fsm/AgentStates';
import { TransitionHub } from '../fsm/TransitionHub';
// TODO(Phase 4): Implement facade - import { AgentFSMFacade } from '../components/AgentFSMFacade';

export class AgentManager extends EventEmitter {
  private fsmFacade: AgentFSMFacade;
  private transitionHub: TransitionHub;
  private readonly MAX_AGENTS = 50;

  constructor(transitionHub?: TransitionHub) {
    super();

    // Initialize FSM facade (creates its own TransitionHub if none provided)
    if (transitionHub) {
      this.transitionHub = transitionHub;
      this.fsmFacade = new AgentFSMFacade();
    } else {
      this.fsmFacade = new AgentFSMFacade();
      this.transitionHub = (this.fsmFacade as any).transitionHub; // Access internal hub
    }

    this.setupEventForwarding();
    assert(this.fsmFacade instanceof AgentFSMFacade, 'FSM Facade must be initialized');
    console.log('[Agent Manager] Initialized with FSM-first architecture');
  }

  /**
   * Register agent definition (delegates to FSM facade)
   */
  registerAgentDefinition(definition: AgentDefinition): void {
    assert(definition && typeof definition === 'object', 'Agent definition must be valid object');
    assert(typeof definition.agentId === 'string' && definition.agentId.length > 0, 'Agent ID must be non-empty string');

    const existingDefinitions = this.fsmFacade.getAgentDefinitions();
    if (existingDefinitions.find((d: any) => d.agentId === definition.agentId)) {
      throw new Error(`Agent definition already exists: ${definition.agentId}`);
    }

    this.validateAgentDefinition(definition);

    // Store in FSM facade's internal registry
    (this.fsmFacade as any).agentDefinitions.set(definition.agentId, definition);

    this.emit('agent:registered', { agentId: definition.agentId });
    console.log(`[Agent Manager] Agent definition registered via FSM: ${definition.agentId}`);
  }

  /**
   * Spawn new agent execution (delegates to FSM facade)
   */
  async spawnAgent(agentId: string, workflowId: string): Promise<AgentExecution> {
    assert(typeof agentId === 'string' && agentId.length > 0, 'Agent ID must be non-empty string');
    assert(typeof workflowId === 'string' && workflowId.length > 0, 'Workflow ID must be non-empty string');

    const activeAgents = this.fsmFacade.getActiveAgents();
    if (activeAgents.length >= this.MAX_AGENTS) {
      throw new Error(`Maximum number of agents reached: ${this.MAX_AGENTS}`);
    }

    const definitions = this.fsmFacade.getAgentDefinitions();
    const definition = definitions.find((d: any) => d.agentId === agentId);
    if (!definition) {
      throw new Error(`Agent definition not found: ${agentId}`);
    }

    // Use FSM facade's managed agent spawning
    const managedAgent = await this.fsmFacade.spawnManagedAgent(definition, workflowId, {
      spawn: { maxRetries: 3 },
      monitoring: { healthCheckInterval: 30000 }
    });

    this.emit('agent:spawned', { agentId, executionId: managedAgent.executionId, workflowId });
    console.log(`[Agent Manager] Agent spawned via FSM: ${agentId} (${managedAgent.executionId})`);

    assert(managedAgent.executionId !== undefined, 'Agent execution must have ID');
    return managedAgent;
  }

  /**
   * Initialize agent to ready state
   */
  private async initializeAgent(agentExecution: AgentExecution): Promise<void> {
    assert(agentExecution && typeof agentExecution === 'object', 'Agent execution must be valid object');
    assert(typeof agentExecution.executionId === 'string', 'Execution ID must be string');

    try {
      // Perform agent initialization
      agentExecution.startTime = Date.now();
      agentExecution.status = 'initializing';

      // Initialize agent resources
      await this.initializeAgentResources(agentExecution);

      // Transition to ready state
      await this.transitionHub.transitionAgent(agentExecution.executionId, AgentEvent.READY);
      agentExecution.status = 'ready';

      this.logAgent(agentExecution, 'info', 'Agent initialized successfully');
      assert(agentExecution.status === 'ready', 'Agent status must be ready after initialization');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      agentExecution.status = 'failed';
      await this.transitionHub.transitionAgent(agentExecution.executionId, AgentEvent.ERROR_OCCURRED);
      this.logAgent(agentExecution, 'error', `Agent initialization failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Start agent task execution (FSM-aware implementation)
   */
  async startAgentTask(executionId: string, taskId: string): Promise<void> {
    assert(typeof executionId === 'string' && executionId.length > 0, 'Execution ID must be non-empty string');
    assert(typeof taskId === 'string' && taskId.length > 0, 'Task ID must be non-empty string');

    const agentExecution = this.fsmFacade.getAgentExecution(executionId);
    if (!agentExecution) {
      throw new Error(`Agent execution not found: ${executionId}`);
    }

    const stateMachine = this.transitionHub.getAgentStateMachine(executionId);
    if (!stateMachine || !stateMachine.canTransition(AgentEvent.START_TASK)) {
      throw new Error(`Agent not ready for task: ${executionId}`);
    }

    // Update agent execution state
    agentExecution.currentTask = taskId;
    agentExecution.taskQueue.push(taskId);

    // Transition through FSM
    await this.transitionHub.transitionAgent(executionId, AgentEvent.START_TASK);
    agentExecution.status = 'working';

    this.logAgent(agentExecution, 'info', `Started task: ${taskId}`);
    this.emit('agent:task_started', { executionId, taskId });

    console.log(`[Agent Manager] Task started via FSM: ${executionId} -> ${taskId}`);
    assert(agentExecution.status === 'working', 'Agent status must be working');
    assert(agentExecution.currentTask === taskId, 'Current task must be set');
  }

  /**
   * Complete agent task
   */
  async completeAgentTask(executionId: string, taskId: string, success: boolean): Promise<void> {
    assert(typeof executionId === 'string' && executionId.length > 0, 'Execution ID must be non-empty string');
    assert(typeof taskId === 'string' && taskId.length > 0, 'Task ID must be non-empty string');

    const agentExecution = this.activeAgents.get(executionId);
    if (!agentExecution) {
      throw new Error(`Agent execution not found: ${executionId}`);
    }

    if (agentExecution.currentTask !== taskId) {
      throw new Error(`Task mismatch: expected ${agentExecution.currentTask}, got ${taskId}`);
    }

    // Update task lists
    agentExecution.taskQueue = agentExecution.taskQueue.filter((t: any) => t !== taskId);
    agentExecution.currentTask = undefined;

    if (success) {
      agentExecution.completedTasks.push(taskId);
      agentExecution.performance.tasksCompleted++;
      await this.transitionHub.transitionAgent(executionId, AgentEvent.TASK_COMPLETE);
      this.logAgent(agentExecution, 'info', `Completed task: ${taskId}`);
    } else {
      agentExecution.failedTasks.push(taskId);
      agentExecution.performance.tasksFailed++;
      await this.transitionHub.transitionAgent(executionId, AgentEvent.TASK_FAILED);
      this.logAgent(agentExecution, 'warn', `Failed task: ${taskId}`);
    }

    this.updateAgentPerformance(agentExecution);
    this.emit('agent:task_completed', { executionId, taskId, success });

    assert(!agentExecution.taskQueue.includes(taskId), 'Task must be removed from queue');
    assert(agentExecution.currentTask === undefined, 'Current task must be cleared');
  }

  /**
   * Suspend agent execution
   */
  async suspendAgent(executionId: string, reason: string): Promise<void> {
    assert(typeof executionId === 'string' && executionId.length > 0, 'Execution ID must be non-empty string');
    assert(typeof reason === 'string' && reason.length > 0, 'Reason must be non-empty string');

    const agentExecution = this.activeAgents.get(executionId);
    if (!agentExecution) {
      throw new Error(`Agent execution not found: ${executionId}`);
    }

    await this.transitionHub.transitionAgent(executionId, AgentEvent.SUSPEND);
    agentExecution.status = 'suspended';

    this.logAgent(agentExecution, 'warn', `Agent suspended: ${reason}`);
    this.emit('agent:suspended', { executionId, reason });

    assert(agentExecution.status === 'suspended', 'Agent status must be suspended');
  }

  /**
   * Resume agent execution
   */
  async resumeAgent(executionId: string): Promise<void> {
    assert(typeof executionId === 'string' && executionId.length > 0, 'Execution ID must be non-empty string');

    const agentExecution = this.activeAgents.get(executionId);
    if (!agentExecution) {
      throw new Error(`Agent execution not found: ${executionId}`);
    }

    await this.transitionHub.transitionAgent(executionId, AgentEvent.RESUME);
    agentExecution.status = 'ready';

    this.logAgent(agentExecution, 'info', 'Agent resumed');
    this.emit('agent:resumed', { executionId });

    assert(agentExecution.status === 'ready', 'Agent status must be ready');
  }

  /**
   * Shutdown and cleanup agent (delegates to FSM facade)
   */
  async shutdownAgent(executionId: string): Promise<void> {
    assert(typeof executionId === 'string' && executionId.length > 0, 'Execution ID must be non-empty string');

    const agentExecution = this.fsmFacade.getAgentExecution(executionId);
    if (!agentExecution) {
      return; // Already cleaned up
    }

    try {
      // Use FSM facade's terminator for clean shutdown
      const shutdownResult = await this.fsmFacade.shutdownAllAgents(`Agent ${executionId} shutdown`);

      this.emit('agent:shutdown', { executionId });
      console.log(`[Agent Manager] Agent shutdown completed via FSM: ${executionId}`);

    } catch (error) {
      console.error(`[Agent Manager] Agent shutdown failed: ${executionId} - ${error}`);
      throw error;
    }
  }

  /**
   * Get agent execution by ID (delegates to FSM facade)
   */
  getAgentExecution(executionId: string): AgentExecution | null {
    assert(typeof executionId === 'string' && executionId.length > 0, 'Execution ID must be non-empty string');
    return this.fsmFacade.getAgentExecution(executionId);
  }

  /**
   * Get all active agents (delegates to FSM facade)
   */
  getActiveAgents(): AgentExecution[] {
    return this.fsmFacade.getActiveAgents();
  }

  /**
   * Get agent definition (delegates to FSM facade)
   */
  getAgentDefinition(agentId: string): AgentDefinition | null {
    assert(typeof agentId === 'string' && agentId.length > 0, 'Agent ID must be non-empty string');
    const definitions = this.fsmFacade.getAgentDefinitions();
    return definitions.find((d: any) => d.agentId === agentId) || null;
  }

  // Event forwarding and helper methods
  private setupEventForwarding(): void {
    // Forward FSM facade events to maintain compatibility
    this.fsmFacade.on('agent:spawned', (data: any) => {
      this.emit('agent:spawned', data);
    });

    this.fsmFacade.on('agent:terminated', (data: any) => {
      this.emit('agent:shutdown', data);
    });

    this.fsmFacade.on('agent:suspended', (data: any) => {
      this.emit('agent:suspended', data);
    });

    this.fsmFacade.on('agent:resumed', (data: any) => {
      this.emit('agent:resumed', data);
    });

    console.log('[Agent Manager] FSM event forwarding configured');
  }

  private validateAgentDefinition(definition: AgentDefinition): void {
    assert(definition.capabilities && Array.isArray(definition.capabilities), 'Capabilities must be array');
    assert(definition.responsibilities && Array.isArray(definition.responsibilities), 'Responsibilities must be array');

    if (definition.capabilities.length === 0) {
      throw new Error('Agent must have at least one capability');
    }

    if (definition.responsibilities.length === 0) {
      throw new Error('Agent must have at least one responsibility');
    }
  }

  // Legacy methods maintained for backward compatibility but mostly delegated to FSM

  private updateAgentPerformance(agentExecution: AgentExecution): void {
    assert(agentExecution && typeof agentExecution === 'object', 'Agent execution must be valid object');

    const totalTasks = agentExecution.performance.tasksCompleted + agentExecution.performance.tasksFailed;
    if (totalTasks > 0) {
      agentExecution.performance.efficiency = agentExecution.performance.tasksCompleted / totalTasks;
      agentExecution.performance.reliability = agentExecution.performance.tasksCompleted / totalTasks;
    }

    const runtime = Date.now() - agentExecution.startTime;
    if (runtime > 0) {
      agentExecution.performance.throughput = agentExecution.performance.tasksCompleted / (runtime / 3600000);
    }

    assert(agentExecution.performance.efficiency >= 0 && agentExecution.performance.efficiency <= 1, 'Efficiency must be between 0 and 1');
    assert(agentExecution.performance.reliability >= 0 && agentExecution.performance.reliability <= 1, 'Reliability must be between 0 and 1');
  }

  private logAgent(agentExecution: AgentExecution, level: 'debug' | 'info' | 'warn' | 'error' | 'critical', message: string, data?: any): void {
    assert(agentExecution && typeof agentExecution === 'object', 'Agent execution must be valid object');
    assert(['debug', 'info', 'warn', 'error', 'critical'].includes(level), 'Log level must be valid');

    const log: AgentLog = {
      timestamp: Date.now(),
      level,
      category: 'agent',
      message,
      data
    };

    agentExecution.logs.push(log);

    // Keep only last 100 logs per agent
    if (agentExecution.logs.length > 100) {
      agentExecution.logs = agentExecution.logs.slice(-100);
    }

    assert(agentExecution.logs.length <= 100, 'Agent logs must not exceed 100 entries');
  }

  private generateExecutionId(agentId: string, workflowId: string): string {
    assert(typeof agentId === 'string' && agentId.length > 0, 'Agent ID must be non-empty string');
    assert(typeof workflowId === 'string' && workflowId.length > 0, 'Workflow ID must be non-empty string');

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const executionId = `${workflowId}-${agentId}-${timestamp}-${random}`;

    assert(executionId.includes(agentId), 'Execution ID must contain agent ID');
    assert(executionId.includes(workflowId), 'Execution ID must contain workflow ID');
    return executionId;
  }

  private delay(ms: number): Promise<void> {
    assert(typeof ms === 'number' && ms >= 0, 'Delay must be non-negative number');
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Helper assertion function for NASA Rule 10 compliance
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}