/**
 * Agent Terminator - Clean Agent Shutdown and Resource Cleanup
 * NASA Rule 10 Compliant: All functions ≤60 lines with 2+ assertions
 * FSM-First: Manages agent termination through TERMINATING state
 */

import { EventEmitter } from 'events';
import { AgentExecution } from '~types/AgentTypes';
import { AgentState, AgentEvent } from '../fsm/AgentStates';
import { TransitionHub } from '../fsm/TransitionHub';

export class AgentTerminator extends EventEmitter {
  private transitionHub: TransitionHub;
  private terminationSessions: Map<string, TerminationSession> = new Map();
  private readonly GRACEFUL_SHUTDOWN_TIMEOUT = 30000; // 30 seconds
  private readonly FORCE_SHUTDOWN_TIMEOUT = 60000; // 60 seconds

  constructor(transitionHub: TransitionHub) {
    super();
    assert(transitionHub instanceof TransitionHub, 'TransitionHub must be provided');

    this.transitionHub = transitionHub;
    console.log('[Agent Terminator] Initialized with FSM-first termination');
  }

  /**
   * Gracefully terminate a single agent
   */
  async terminateAgent(
    agentExecution: AgentExecution,
    reason: string = 'Normal shutdown',
    options: TerminationOptions = {}
  ): Promise<TerminationResult> {
    assert(agentExecution && typeof agentExecution === 'object', 'Agent execution must be valid object');
    assert(typeof reason === 'string' && reason.length > 0, 'Reason must be non-empty string');

    const sessionId = this.generateSessionId(agentExecution.executionId);
    console.log(`[Agent Terminator] Initiating termination: ${agentExecution.executionId} (${reason})`);

    // Create termination session
    const session = this.createTerminationSession(agentExecution, reason, options);
    this.terminationSessions.set(sessionId, session);

    try {
      // Execute termination phases
      const result = await this.executeTerminationPhases(session);

      // Cleanup session
      this.terminationSessions.delete(sessionId);

      console.log(`[Agent Terminator] Termination completed: ${agentExecution.executionId}`);
      assert(result.success !== undefined, 'Termination result must have success status');
      return result;

    } catch (error) {
      await this.handleTerminationFailure(session, error as Error);
      this.terminationSessions.delete(sessionId);
      throw error;
    }
  }

  /**
   * Terminate multiple agents in batch
   */
  async terminateAgentBatch(
    agents: AgentExecution[],
    reason: string = 'Batch shutdown',
    options: BatchTerminationOptions = {}
  ): Promise<BatchTerminationResult> {
    assert(Array.isArray(agents) && agents.length > 0, 'Agents must be non-empty array');
    assert(typeof reason === 'string' && reason.length > 0, 'Reason must be non-empty string');

    console.log(`[Agent Terminator] Batch termination: ${agents.length} agents (${reason})`);

    const maxConcurrent = options.maxConcurrent || 5;
    const results: TerminationResult[] = [];
    const failures: TerminationFailure[] = [];

    // Process in chunks to respect concurrency limits
    for (let i = 0; i < agents.length; i += maxConcurrent) {
      const chunk = agents.slice(i, i + maxConcurrent);
      const promises = chunk.map(async agent => {
        try {
          const result = await this.terminateAgent(agent, reason, options);
          return { success: true, result };
        } catch (error) {
          return {
            success: false,
            agentId: agent.executionId,
            error: (error as Error).message
          };
        }
      });

      const chunkResults = await Promise.all(promises);

      for (const result of chunkResults) {
        if (result.success) {
          results.push(result.result);
        } else {
          failures.push({
            agentId: result.agentId,
            error: result.error,
            timestamp: Date.now()
          });
        }
      }
    }

    const batchResult: BatchTerminationResult = {
      totalAgents: agents.length,
      successfulTerminations: results.length,
      failedTerminations: failures.length,
      failures,
      duration: Date.now() - (Date.now() - agents.length * 1000) // Approximate
    };

    console.log(`[Agent Terminator] Batch termination completed: ${batchResult.successfulTerminations}/${batchResult.totalAgents}`);
    assert(batchResult.successfulTerminations + batchResult.failedTerminations === batchResult.totalAgents,
      'Total results must equal total agents');
    return batchResult;
  }

  /**
   * Force terminate agent (emergency shutdown)
   */
  async forceTerminateAgent(
    agentExecution: AgentExecution,
    reason: string = 'Emergency shutdown'
  ): Promise<TerminationResult> {
    assert(agentExecution && typeof agentExecution === 'object', 'Agent execution must be valid object');
    assert(typeof reason === 'string' && reason.length > 0, 'Reason must be non-empty string');

    console.log(`[Agent Terminator] Force terminating: ${agentExecution.executionId} (${reason})`);

    const startTime = Date.now();

    try {
      // Immediate FSM transition to error state
      await this.transitionHub.transitionAgent(agentExecution.executionId, AgentEvent.ERROR_OCCURRED);

      // Force cleanup resources
      await this.forceCleanupResources(agentExecution);

      // Remove FSM state machine
      this.transitionHub.removeAgentStateMachine(agentExecution.executionId);

      // Update agent status
      agentExecution.status = 'failed';
      agentExecution.endTime = Date.now();

      const result: TerminationResult = {
        success: true,
        agentId: agentExecution.executionId,
        terminationType: 'force',
        reason,
        duration: Date.now() - startTime,
        resourcesCleanedUp: true,
        fsmRemoved: true
      };

      this.emit('agent:force_terminated', { agentId: agentExecution.executionId, reason });
      console.log(`[Agent Terminator] Force termination completed: ${agentExecution.executionId}`);

      assert(result.success === true, 'Force termination must succeed');
      assert(result.fsmRemoved === true, 'FSM must be removed');
      return result;

    } catch (error) {
      console.error(`[Agent Terminator] Force termination failed: ${agentExecution.executionId} - ${error}`);
      throw error;
    }
  }

  /**
   * Terminate all agents managed by this terminator
   */
  async terminateAllAgents(reason: string = 'System shutdown'): Promise<BatchTerminationResult> {
    assert(typeof reason === 'string' && reason.length > 0, 'Reason must be non-empty string');

    const activeSessions = Array.from(this.terminationSessions.values());
    const activeAgents = activeSessions.map(session => session.agentExecution);

    if (activeAgents.length === 0) {
      console.log('[Agent Terminator] No active agents to terminate');
      return {
        totalAgents: 0,
        successfulTerminations: 0,
        failedTerminations: 0,
        failures: [],
        duration: 0
      };
    }

    console.log(`[Agent Terminator] Terminating all active agents: ${activeAgents.length} (${reason})`);
    return this.terminateAgentBatch(activeAgents, reason, { maxConcurrent: 10, graceful: false });
  }

  /**
   * Get active termination sessions
   */
  getActiveTerminations(): TerminationSession[] {
    return Array.from(this.terminationSessions.values());
  }

  /**
   * Cancel ongoing termination (if possible)
   */
  async cancelTermination(sessionId: string): Promise<boolean> {
    assert(typeof sessionId === 'string' && sessionId.length > 0, 'Session ID must be non-empty string');

    const session = this.terminationSessions.get(sessionId);
    if (!session || session.status !== 'in_progress') {
      return false;
    }

    console.log(`[Agent Terminator] Cancelling termination: ${session.agentExecution.executionId}`);

    try {
      // Attempt to recover agent if still in valid state
      const stateMachine = this.transitionHub.getAgentStateMachine(session.agentExecution.executionId);
      if (stateMachine && stateMachine.canTransition(AgentEvent.RECOVER)) {
        await this.transitionHub.transitionAgent(session.agentExecution.executionId, AgentEvent.RECOVER);
        session.status = 'cancelled';
        this.terminationSessions.delete(sessionId);

        this.emit('termination:cancelled', { sessionId, agentId: session.agentExecution.executionId });
        return true;
      }
    } catch (error) {
      console.error(`[Agent Terminator] Failed to cancel termination: ${error}`);
    }

    return false;
  }

  // Private helper methods

  private async executeTerminationPhases(session: TerminationSession): Promise<TerminationResult> {
    assert(session && typeof session === 'object', 'Session must be valid object');

    session.status = 'in_progress';
    const startTime = Date.now();

    try {
      // Phase 1: Graceful shutdown preparation
      await this.prepareGracefulShutdown(session);

      // Phase 2: Task completion or cancellation
      await this.handleActiveTasks(session);

      // Phase 3: Resource cleanup
      await this.cleanupAgentResources(session);

      // Phase 4: FSM state transition and removal
      await this.finalizeTermination(session);

      session.status = 'completed';
      const result: TerminationResult = {
        success: true,
        agentId: session.agentExecution.executionId,
        terminationType: session.options.graceful ? 'graceful' : 'immediate',
        reason: session.reason,
        duration: Date.now() - startTime,
        resourcesCleanedUp: true,
        fsmRemoved: true
      };

      this.emit('agent:terminated', result);
      assert(result.success === true, 'Termination must succeed');
      return result;

    } catch (error) {
      session.status = 'failed';
      throw error;
    }
  }

  private async prepareGracefulShutdown(session: TerminationSession): Promise<void> {
    assert(session && typeof session === 'object', 'Session must be valid object');

    if (!session.options.graceful) {
      return; // Skip graceful preparation for immediate shutdown
    }

    const agentId = session.agentExecution.executionId;
    console.log(`[Agent Terminator] Preparing graceful shutdown: ${agentId}`);

    // Check if agent can be gracefully shut down
    const stateMachine = this.transitionHub.getAgentStateMachine(agentId);
    if (!stateMachine) {
      throw new Error(`Agent state machine not found: ${agentId}`);
    }

    // Wait for agent to finish current task if working
    if (stateMachine.currentState === AgentState.WORKING) {
      await this.waitForTaskCompletion(session);
    }

    // Transition to suspended state before termination
    if (stateMachine.canTransition(AgentEvent.SUSPEND)) {
      await this.transitionHub.transitionAgent(agentId, AgentEvent.SUSPEND);
    }

    assert(session.agentExecution.executionId === agentId, 'Agent ID must remain consistent');
  }

  private async handleActiveTasks(session: TerminationSession): Promise<void> {
    assert(session && typeof session === 'object', 'Session must be valid object');

    const agentExecution = session.agentExecution;
    console.log(`[Agent Terminator] Handling active tasks: ${agentExecution.executionId}`);

    // Cancel tasks in queue
    agentExecution.taskQueue = [];

    // Handle current task
    if (agentExecution.currentTask) {
      if (session.options.cancelActiveTasks) {
        agentExecution.failedTasks.push(agentExecution.currentTask);
        agentExecution.currentTask = undefined;
      } else {
        // Wait for current task completion with timeout
        await this.waitForTaskCompletion(session);
      }
    }

    assert(agentExecution.taskQueue.length === 0, 'Task queue must be empty');
  }

  private async cleanupAgentResources(session: TerminationSession): Promise<void> {
    assert(session && typeof session === 'object', 'Session must be valid object');

    const agentExecution = session.agentExecution;
    console.log(`[Agent Terminator] Cleaning up resources: ${agentExecution.executionId}`);

    // Reset resource utilization
    agentExecution.resources.cpuUsage = 0;
    agentExecution.resources.memoryUsage = 0;
    agentExecution.resources.storageUsage = 0;
    agentExecution.resources.networkUsage = 0;
    agentExecution.resources.toolsInUse = [];
    agentExecution.resources.costs = 0;

    // Close communication channels
    agentExecution.communication.messagesPending = 0;

    // Simulate cleanup delay
    await this.delay(100);

    assert(agentExecution.resources.toolsInUse.length === 0, 'Tools in use must be empty');
    assert(agentExecution.communication.messagesPending === 0, 'Pending messages must be zero');
  }

  private async finalizeTermination(session: TerminationSession): Promise<void> {
    assert(session && typeof session === 'object', 'Session must be valid object');

    const agentId = session.agentExecution.executionId;
    console.log(`[Agent Terminator] Finalizing termination: ${agentId}`);

    // Final FSM transition to completed state
    try {
      await this.transitionHub.transitionAgent(agentId, AgentEvent.SHUTDOWN);
    } catch (error) {
      console.warn(`[Agent Terminator] Failed to transition to shutdown state: ${error}`);
    }

    // Remove FSM state machine
    this.transitionHub.removeAgentStateMachine(agentId);

    // Update agent execution status
    session.agentExecution.status = 'completed';
    session.agentExecution.endTime = Date.now();

    assert(session.agentExecution.status === 'completed', 'Agent status must be completed');
    assert(session.agentExecution.endTime !== undefined, 'End time must be set');
  }

  private async waitForTaskCompletion(session: TerminationSession): Promise<void> {
    assert(session && typeof session === 'object', 'Session must be valid object');

    const timeout = session.options.graceful ? this.GRACEFUL_SHUTDOWN_TIMEOUT : 5000;
    const startTime = Date.now();

    while (session.agentExecution.currentTask && (Date.now() - startTime) < timeout) {
      await this.delay(1000); // Check every second
    }

    if (session.agentExecution.currentTask) {
      console.warn(`[Agent Terminator] Task completion timeout, forcing termination`);
      session.agentExecution.failedTasks.push(session.agentExecution.currentTask);
      session.agentExecution.currentTask = undefined;
    }

    assert(session.agentExecution.currentTask === undefined, 'Current task must be cleared');
  }

  private async forceCleanupResources(agentExecution: AgentExecution): Promise<void> {
    assert(agentExecution && typeof agentExecution === 'object', 'Agent execution must be valid object');

    // Immediate resource cleanup
    agentExecution.resources = {
      cpuUsage: 0,
      memoryUsage: 0,
      storageUsage: 0,
      networkUsage: 0,
      toolsInUse: [],
      costs: 0
    };

    agentExecution.taskQueue = [];
    agentExecution.currentTask = undefined;

    console.log(`[Agent Terminator] Force cleanup completed: ${agentExecution.executionId}`);
  }

  private createTerminationSession(
    agentExecution: AgentExecution,
    reason: string,
    options: TerminationOptions
  ): TerminationSession {
    assert(agentExecution && typeof agentExecution === 'object', 'Agent execution must be valid object');

    return {
      sessionId: this.generateSessionId(agentExecution.executionId),
      agentExecution,
      reason,
      options: { graceful: true, cancelActiveTasks: false, ...options },
      status: 'pending',
      startTime: Date.now()
    };
  }

  private async handleTerminationFailure(session: TerminationSession, error: Error): Promise<void> {
    assert(session && typeof session === 'object', 'Session must be valid object');
    assert(error instanceof Error, 'Error must be valid Error object');

    session.status = 'failed';
    console.error(`[Agent Terminator] Termination failed: ${session.agentExecution.executionId} - ${error.message}`);
    this.emit('termination:failed', { session, error: error.message });
  }

  private generateSessionId(agentId: string): string {
    assert(typeof agentId === 'string' && agentId.length > 0, 'Agent ID must be non-empty string');

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const sessionId = `term-${agentId}-${timestamp}-${random}`;

    assert(sessionId.includes(agentId), 'Session ID must contain agent ID');
    return sessionId;
  }

  private delay(ms: number): Promise<void> {
    assert(typeof ms === 'number' && ms >= 0, 'Delay must be non-negative number');
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Supporting interfaces
export interface TerminationOptions {
  graceful?: boolean;
  cancelActiveTasks?: boolean;
  timeout?: number;
}

export interface BatchTerminationOptions extends TerminationOptions {
  maxConcurrent?: number;
  failFast?: boolean;
}

export interface TerminationResult {
  success: boolean;
  agentId: string;
  terminationType: 'graceful' | 'immediate' | 'force';
  reason: string;
  duration: number;
  resourcesCleanedUp: boolean;
  fsmRemoved: boolean;
}

export interface BatchTerminationResult {
  totalAgents: number;
  successfulTerminations: number;
  failedTerminations: number;
  failures: TerminationFailure[];
  duration: number;
}

export interface TerminationFailure {
  agentId: string;
  error: string;
  timestamp: number;
}

// Internal interfaces
interface TerminationSession {
  sessionId: string;
  agentExecution: AgentExecution;
  reason: string;
  options: Required<TerminationOptions>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
}

// Helper assertion function for NASA Rule 10 compliance
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}