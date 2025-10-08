/**
 * QueenCoordinator - Core Queen-Level Coordination
 * NASA Rule 10 Compliant - Single responsibility for princess coordination
 * Extracted from QueenOrchestrator to eliminate god object pattern
 */

import { EventEmitter } from 'events';
import { PrincessStateMachineFacade as PrincessStateMachine } from '../../state-machines/PrincessStateMachineFacade';
import { QueenFSMStates, QueenFSMEvents } from '~types/QueenFSMTypes';
import { QueenConfiguration } from '~types/QueenTypes';
import { ResourceManager } from '../managers/ResourceManager';

export class QueenCoordinator extends EventEmitter {
  // NASA Rule 10: Fixed loop bounds
  private static readonly MAX_PRINCESS_COUNT = 10;
  private static readonly MAX_DELEGATION_RETRIES = 3;

  private config: QueenConfiguration;
  private resourceManager: ResourceManager;
  private princesses: Map<string, PrincessStateMachine>;
  private currentState: QueenFSMStates;

  constructor(config: QueenConfiguration, resourceManager: ResourceManager) {
    super();

    if (!config) {
      throw new Error('Configuration required for QueenCoordinator');
    }
    if (!resourceManager) {
      throw new Error('ResourceManager required for QueenCoordinator');
    }

    this.config = config;
    this.resourceManager = resourceManager;
    this.princesses = new Map();
    this.currentState = QueenFSMStates.INITIALIZING;
  }

  /**
   * Register princess with bounded collection
   * NASA Rule 10: ≤60 lines, single responsibility
   */
  async registerPrincess(princessId: string, stateMachine: PrincessStateMachine): Promise<void> {
    if (!princessId || typeof princessId !== 'string') {
      throw new Error('Princess ID must be a non-empty string');
    }
    if (!stateMachine) {
      throw new Error('Princess state machine is required');
    }

    // NASA Rule 10: Fixed bound check
    if (this.princesses.size >= QueenCoordinator.MAX_PRINCESS_COUNT) {
      throw new Error(`Cannot register more than ${QueenCoordinator.MAX_PRINCESS_COUNT} Princesses`);
    }

    this.princesses.set(princessId, stateMachine);
    await this.resourceManager.initializePrincessResources(princessId, stateMachine);
    this.setupPrincessMonitoring(princessId, stateMachine);

    this.emit('princessRegistered', princessId);
  }

  /**
   * Delegate task to optimal princess
   * NASA Rule 10: ≤60 lines, bounded operations
   */
  async delegateTask(
    task: any,
    requirements: string[] = [],
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<{ princessId: string; taskId: string }> {
    if (!task) {
      throw new Error('Task is required for delegation');
    }

    const bestPrincess = await this.resourceManager.selectOptimalPrincess(
      task,
      requirements,
      Array.from(this.princesses.keys()),
      QueenCoordinator.MAX_PRINCESS_COUNT
    );

    if (!bestPrincess) {
      throw new Error('No suitable Princess available for task delegation');
    }

    const princess = this.princesses.get(bestPrincess);
    if (!princess) {
      throw new Error(`Princess ${bestPrincess} not found`);
    }

    // Execute delegation with retry logic
    const taskId = await this.executeTaskDelegation(princess, task, priority);
    await this.resourceManager.updateResourceUtilization(bestPrincess, 'allocate');

    this.emit('taskDelegated', bestPrincess, taskId, task);
    return { princessId: bestPrincess, taskId };
  }

  /**
   * Get coordination status
   * NASA Rule 10: ≤60 lines, simple status aggregation
   */
  getCoordinationStatus(): Record<string, any> {
    const princessStatuses = new Map<string, string>();

    // Iterative status collection (NASA Rule 10 - no recursion)
    for (const [princessId, princess] of this.princesses) {
      try {
        princessStatuses.set(princessId, princess.getCurrentState().toString());
      } catch (error) {
        princessStatuses.set(princessId, 'error');
      }
    }

    return {
      currentState: this.currentState,
      registeredPrincesses: this.princesses.size,
      maxPrincesses: QueenCoordinator.MAX_PRINCESS_COUNT,
      princessStatuses: Object.fromEntries(princessStatuses),
      resourceUtilization: this.resourceManager.getUtilizationSummary()
    };
  }

  /**
   * Execute task delegation with bounded retries
   * NASA Rule 10: ≤60 lines, bounded retry logic
   */
  private async executeTaskDelegation(
    princess: PrincessStateMachine,
    task: any,
    priority: string
  ): Promise<string> {
    let lastError: Error | null = null;

    // NASA Rule 10: Fixed loop bounds
    for (let attempt = 1; attempt <= QueenCoordinator.MAX_DELEGATION_RETRIES; attempt++) {
      try {
        const result = await princess.executeTask({ task, priority });
        return result.taskId || `task-${Date.now()}`;
      } catch (error) {
        lastError = error as Error;

        if (attempt < QueenCoordinator.MAX_DELEGATION_RETRIES) {
          // Exponential backoff
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Task delegation failed after ${QueenCoordinator.MAX_DELEGATION_RETRIES} attempts: ${lastError?.message}`);
  }

  /**
   * Setup princess monitoring with bounded event handling
   * NASA Rule 10: ≤60 lines, bounded monitoring setup
   */
  private setupPrincessMonitoring(princessId: string, stateMachine: PrincessStateMachine): void {
    if (!princessId || !stateMachine) {
      throw new Error('Princess ID and state machine required for monitoring setup');
    }

    stateMachine.on('stateChanged', (oldState: any, newState: any) => {
      this.handlePrincessStateChange(princessId, oldState, newState);
    });

    stateMachine.on('taskCompleted', (taskId: any, result: any) => {
      this.handlePrincessTaskCompletion(princessId, taskId, result);
    });

    stateMachine.on('error', (error: any) => {
      this.handlePrincessError(princessId, error);
    });
  }

  /**
   * Handle princess state changes
   * NASA Rule 10: ≤60 lines, single responsibility
   */
  private handlePrincessStateChange(princessId: string, oldState: string, newState: string): void {
    this.resourceManager.updatePrincessAvailability(princessId, newState);

    if (newState === 'error') {
      this.handlePrincessError(princessId, new Error('Princess entered error state'));
    }

    this.emit('princessStateChanged', princessId, oldState, newState);
  }

  /**
   * Handle princess task completion
   * NASA Rule 10: ≤60 lines, completion processing
   */
  private handlePrincessTaskCompletion(princessId: string, taskId: string, result: any): void {
    this.resourceManager.updateResourceUtilization(princessId, 'release');
    this.resourceManager.updatePrincessPerformanceMetrics(princessId, result);
    this.emit('princessTaskCompleted', princessId, taskId, result);
  }

  /**
   * Handle princess errors
   * NASA Rule 10: ≤60 lines, error handling
   */
  private handlePrincessError(princessId: string, error: Error): void {
    const shouldEscalate = this.resourceManager.handlePrincessError(
      princessId,
      error,
      this.config.escalationThresholds
    );

    if (shouldEscalate.needed) {
      this.emit('escalationNeeded', princessId, shouldEscalate.issue, shouldEscalate.severity);
    }

    this.emit('princessError', princessId, error);
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0
// Receipt: status=OK | run_id=agent077-queen-coordinator-decomposition
// inputs: ["src/architecture/langgraph/queen/QueenOrchestrator.ts"]
// tools_used: ["Read", "Write", "Bash"]
// versions: {"model":"sonnet-4","fsm-design":"1.0.0"}
// === END FOOTER ===

// Backward compatibility

// Backward compatibility
export default QueenCoordinator;
