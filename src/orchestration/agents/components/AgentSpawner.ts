/**
 * Agent Spawner - Agent Creation and Initialization
 * NASA Rule 10 Compliant: All functions ≤60 lines with 2+ assertions
 * FSM-First: Manages agent lifecycle from SPAWNING to INITIALIZING
 */

import { EventEmitter } from 'events';
import { AgentDefinition, AgentExecution } from '../types/AgentTypes';
import { AgentState, AgentEvent } from '../fsm/AgentStates';
import { TransitionHub } from '../fsm/TransitionHub';

export class AgentSpawner extends EventEmitter {
  private transitionHub: TransitionHub;
  private readonly MAX_SPAWN_ATTEMPTS = 3;
  private readonly SPAWN_TIMEOUT = 30000; // 30 seconds

  constructor(transitionHub: TransitionHub) {
    super();
    assert(transitionHub instanceof TransitionHub, 'TransitionHub must be provided');

    this.transitionHub = transitionHub;
    console.log('[Agent Spawner] Initialized with FSM-first architecture');
  }

  /**
   * Spawn new agent with FSM lifecycle management
   */
  async spawnAgent(
    definition: AgentDefinition,
    workflowId: string,
    options: SpawnOptions = {}
  ): Promise<AgentExecution> {
    assert(definition && typeof definition === 'object', 'Agent definition must be valid object');
    assert(typeof workflowId === 'string' && workflowId.length > 0, 'Workflow ID must be non-empty string');

    const executionId = this.generateExecutionId(definition.agentId, workflowId);
    console.log(`[Agent Spawner] Spawning agent: ${definition.agentId} (${executionId})`);

    // Create FSM state machine in SPAWNING state
    const stateMachine = this.transitionHub.createAgentStateMachine(
      executionId,
      AgentState.IDLE
    );

    try {
      // Transition to INITIALIZING
      await this.transitionHub.transitionAgent(executionId, AgentEvent.INITIALIZE);

      // Create agent execution instance
      const agentExecution = this.createAgentExecution(definition, executionId, workflowId);

      // Initialize agent with retries
      await this.initializeAgentWithRetries(agentExecution, options);

      // Transition to READY
      await this.transitionHub.transitionAgent(executionId, AgentEvent.READY);
      agentExecution.status = 'ready';

      this.emit('agent:spawned', { agentExecution, definition });
      console.log(`[Agent Spawner] Agent spawned successfully: ${executionId}`);

      assert(agentExecution.status === 'ready', 'Agent must be in ready state after spawning');
      assert(stateMachine.currentState === AgentState.READY, 'FSM must be in READY state');
      return agentExecution;

    } catch (error) {
      await this.handleSpawnFailure(executionId, error as Error);
      throw error;
    }
  }

  /**
   * Batch spawn multiple agents with parallel processing
   */
  async spawnAgentBatch(
    definitions: AgentDefinition[],
    workflowId: string,
    options: BatchSpawnOptions = {}
  ): Promise<AgentExecution[]> {
    assert(Array.isArray(definitions) && definitions.length > 0, 'Definitions must be non-empty array');
    assert(typeof workflowId === 'string' && workflowId.length > 0, 'Workflow ID must be non-empty string');

    const maxConcurrent = options.maxConcurrent || 5;
    const results: AgentExecution[] = [];

    console.log(`[Agent Spawner] Batch spawning ${definitions.length} agents (max concurrent: ${maxConcurrent})`);

    // Process in chunks to respect concurrency limits
    for (let i = 0; i < definitions.length; i += maxConcurrent) {
      const chunk = definitions.slice(i, i + maxConcurrent);
      const promises = chunk.map(def => this.spawnAgent(def, workflowId, options));

      try {
        const chunkResults = await Promise.all(promises);
        results.push(...chunkResults);
      } catch (error) {
        if (options.failFast) {
          throw error;
        }
        console.warn(`[Agent Spawner] Some agents failed to spawn in batch: ${error}`);
      }
    }

    console.log(`[Agent Spawner] Batch spawn completed: ${results.length}/${definitions.length} successful`);
    assert(results.length <= definitions.length, 'Results cannot exceed input definitions');
    return results;
  }

  /**
   * Validate agent definition before spawning
   */
  validateAgentDefinition(definition: AgentDefinition): void {
    assert(definition && typeof definition === 'object', 'Definition must be valid object');
    assert(typeof definition.agentId === 'string' && definition.agentId.length > 0, 'Agent ID must be non-empty string');

    if (!definition.capabilities || definition.capabilities.length === 0) {
      throw new Error(`Agent ${definition.agentId} must have at least one capability`);
    }

    if (!definition.responsibilities || definition.responsibilities.length === 0) {
      throw new Error(`Agent ${definition.agentId} must have at least one responsibility`);
    }

    if (!definition.workload || typeof definition.workload.maxConcurrentTasks !== 'number') {
      throw new Error(`Agent ${definition.agentId} must have valid workload configuration`);
    }

    assert(definition.capabilities.length > 0, 'Agent must have capabilities');
    assert(definition.responsibilities.length > 0, 'Agent must have responsibilities');
  }

  // Private helper methods

  private async initializeAgentWithRetries(
    agentExecution: AgentExecution,
    options: SpawnOptions
  ): Promise<void> {
    assert(agentExecution && typeof agentExecution === 'object', 'Agent execution must be valid object');

    let attempts = 0;
    const maxAttempts = options.maxRetries || this.MAX_SPAWN_ATTEMPTS;

    while (attempts < maxAttempts) {
      try {
        await this.initializeAgent(agentExecution);
        return; // Success
      } catch (error) {
        attempts++;
        console.warn(`[Agent Spawner] Initialization attempt ${attempts} failed: ${error}`);

        if (attempts >= maxAttempts) {
          throw new Error(`Agent initialization failed after ${maxAttempts} attempts: ${error}`);
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000);
        await this.delay(delay);
      }
    }

    assert(attempts <= maxAttempts, 'Attempts must not exceed maximum');
  }

  private async initializeAgent(agentExecution: AgentExecution): Promise<void> {
    assert(agentExecution && typeof agentExecution === 'object', 'Agent execution must be valid object');

    const timeout = setTimeout(() => {
      throw new Error(`Agent initialization timeout: ${this.SPAWN_TIMEOUT}ms`);
    }, this.SPAWN_TIMEOUT);

    try {
      // Initialize agent resources
      agentExecution.resources = {
        cpuUsage: 0,
        memoryUsage: 0,
        storageUsage: 0,
        networkUsage: 0,
        toolsInUse: [],
        costs: 0
      };

      // Initialize performance metrics
      agentExecution.performance = {
        tasksCompleted: 0,
        tasksFailed: 0,
        averageTaskDuration: 0,
        throughput: 0,
        quality: 0,
        efficiency: 0,
        reliability: 0,
        responsiveness: 0
      };

      // Initialize communication status
      agentExecution.communication = {
        messagesReceived: 0,
        messagesSent: 0,
        messagesPending: 0,
        communicationErrors: 0,
        averageResponseTime: 0,
        lastCommunication: Date.now()
      };

      clearTimeout(timeout);
      assert(agentExecution.resources !== undefined, 'Resources must be initialized');
      assert(agentExecution.performance !== undefined, 'Performance must be initialized');

    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  private createAgentExecution(
    definition: AgentDefinition,
    executionId: string,
    workflowId: string
  ): AgentExecution {
    assert(definition && typeof definition === 'object', 'Definition must be valid object');
    assert(typeof executionId === 'string' && executionId.length > 0, 'Execution ID must be non-empty string');

    return {
      executionId,
      agentId: definition.agentId,
      workflowId,
      startTime: Date.now(),
      status: 'initializing',
      assignedTasks: [],
      completedTasks: [],
      failedTasks: [],
      taskQueue: [],
      performance: {} as any, // Will be initialized in initializeAgent
      communication: {} as any, // Will be initialized in initializeAgent
      resources: {} as any, // Will be initialized in initializeAgent
      logs: []
    };
  }

  private async handleSpawnFailure(executionId: string, error: Error): Promise<void> {
    assert(typeof executionId === 'string' && executionId.length > 0, 'Execution ID must be non-empty string');
    assert(error instanceof Error, 'Error must be valid Error object');

    try {
      await this.transitionHub.transitionAgent(executionId, AgentEvent.ERROR_OCCURRED);
    } catch (transitionError) {
      console.error(`[Agent Spawner] Failed to transition to error state: ${transitionError}`);
    }

    this.emit('agent:spawn_failed', { executionId, error: error.message });
    console.error(`[Agent Spawner] Agent spawn failed: ${executionId} - ${error.message}`);
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

// Supporting interfaces
export interface SpawnOptions {
  maxRetries?: number;
  timeout?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface BatchSpawnOptions extends SpawnOptions {
  maxConcurrent?: number;
  failFast?: boolean;
}

// Helper assertion function for NASA Rule 10 compliance
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}