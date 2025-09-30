/**
 * Drone Base FSM - Shared Foundation for All Drone Components
 * NASA Rule 10 Compliant: ≤60 line functions, no recursion, bounded loops
 */

import { EventEmitter } from 'events';
import { DroneState, DroneEvent, DroneWorker, DroneTask } from './DroneTypes';
import { DroneTransitionHub } from './DroneTransitionHub';
import { DroneTaskExecutor } from '../components/DroneTaskExecutor';
import { DroneMetricsCollector } from '../components/DroneMetricsCollector';
import { DroneReportGenerator } from '../components/DroneReportGenerator';

export class DroneBaseFSM extends EventEmitter {
  protected transitionHub: DroneTransitionHub;
  protected taskExecutor: DroneTaskExecutor;
  protected metricsCollector: DroneMetricsCollector;
  protected reportGenerator: DroneReportGenerator;
  protected workers: Map<string, DroneWorker> = new Map();

  constructor() {
    super();
    this.initializeComponents();
  }

  /**
   * Initialize all drone FSM components
   * NASA Rule 10: ≤60 lines, no recursion
   */
  private initializeComponents(): void {
    this.transitionHub = new DroneTransitionHub();
    this.taskExecutor = new DroneTaskExecutor(this.transitionHub);
    this.metricsCollector = new DroneMetricsCollector();
    this.reportGenerator = new DroneReportGenerator();

    // NASA Rule 10: Post-condition assertions
    console.assert(this.transitionHub, 'Transition hub must be initialized');
    console.assert(this.taskExecutor, 'Task executor must be initialized');
    console.assert(this.metricsCollector, 'Metrics collector must be initialized');
    console.assert(this.reportGenerator, 'Report generator must be initialized');
  }

  /**
   * Register new drone worker
   * NASA Rule 10: ≤60 lines, bounded registration
   */
  async registerWorker(worker: DroneWorker): Promise<void> {
    console.assert(worker && worker.id, 'Valid worker required');
    console.assert(!this.workers.has(worker.id), 'Worker ID must be unique');

    // Set initial state
    worker.status = DroneState.IDLE;

    // Register with transition hub
    this.transitionHub.registerWorker(worker);

    // Store worker
    this.workers.set(worker.id, worker);

    // Emit registration event
    this.emit('worker-registered', { workerId: worker.id, specialty: worker.specialty });

    // NASA Rule 10: Post-condition assertions
    console.assert(this.workers.has(worker.id), 'Worker must be stored');
    console.assert(worker.status === DroneState.IDLE, 'Worker must start in IDLE state');
  }

  /**
   * Assign task to drone worker
   * NASA Rule 10: ≤60 lines, bounded task assignment
   */
  async assignTask(workerId: string, task: DroneTask): Promise<boolean> {
    console.assert(workerId && workerId.length > 0, 'Worker ID required');
    console.assert(task && task.id, 'Valid task required');

    const worker = this.workers.get(workerId);
    if (!worker) {
      console.assert(false, `Worker ${workerId} not found`);
      return false;
    }

    if (worker.status !== DroneState.IDLE) {
      console.assert(false, `Worker ${workerId} not available for task assignment`);
      return false;
    }

    // Assign task to worker
    worker.currentTask = task;
    this.workers.set(workerId, worker);

    // Transition to ASSIGNED state
    const transitionSuccess = await this.transitionHub.transition(workerId, DroneEvent.ASSIGN_TASK);

    if (transitionSuccess) {
      this.emit('task-assigned', { workerId, taskId: task.id });
    }

    // NASA Rule 10: Post-condition assertion
    console.assert(worker.currentTask === task, 'Task must be assigned to worker');

    return transitionSuccess;
  }

  /**
   * Execute task for drone worker
   * NASA Rule 10: ≤60 lines, bounded execution
   */
  async executeTask(workerId: string): Promise<boolean> {
    console.assert(workerId && workerId.length > 0, 'Worker ID required');

    const worker = this.workers.get(workerId);
    if (!worker || !worker.currentTask) {
      console.assert(false, `Worker ${workerId} has no assigned task`);
      return false;
    }

    const startTime = Date.now();

    try {
      // Execute task using task executor
      const success = await this.taskExecutor.executeTask(workerId, worker.currentTask);

      const executionTime = Date.now() - startTime;

      // Record metrics
      this.metricsCollector.recordExecutionTime(workerId, executionTime);

      // Generate report
      const status = success ? 'SUCCESS' : 'FAILURE';
      this.reportGenerator.generateReport(worker, worker.currentTask, executionTime, status);

      // Update worker metrics
      worker.metrics.tasksCompleted += success ? 1 : 0;
      worker.metrics.lastActivityTime = new Date();

      // Emit execution completed event
      this.emit('task-executed', { workerId, taskId: worker.currentTask.id, success, executionTime });

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const executionTime = Date.now() - startTime;
      this.reportGenerator.generateReport(worker, worker.currentTask, executionTime, 'ERROR', { error: errorMessage });
      return false;
    }
  }

  /**
   * Complete task and transition worker to IDLE
   * NASA Rule 10: ≤60 lines
   */
  async completeTask(workerId: string): Promise<boolean> {
    console.assert(workerId && workerId.length > 0, 'Worker ID required');

    const worker = this.workers.get(workerId);
    if (!worker) {
      return false;
    }

    // Transition through REPORTING to COMPLETE to IDLE
    await this.transitionHub.transition(workerId, DroneEvent.GENERATE_REPORT);
    await this.transitionHub.transition(workerId, DroneEvent.FINISH);

    // Clear current task
    worker.currentTask = undefined;
    this.workers.set(workerId, worker);

    // Emit completion event
    this.emit('task-completed', { workerId });

    // NASA Rule 10: Post-condition assertion
    const finalState = this.transitionHub.getWorkerState(workerId);
    console.assert(finalState === DroneState.IDLE, 'Worker must return to IDLE state');

    return true;
  }

  /**
   * Get worker by ID
   */
  getWorker(workerId: string): DroneWorker | null {
    return this.workers.get(workerId) || null;
  }

  /**
   * Get all workers in specific state
   */
  getWorkersByState(state: DroneState): DroneWorker[] {
    return this.transitionHub.getWorkersByState(state);
  }

  /**
   * Shutdown all workers and cleanup
   * NASA Rule 10: ≤60 lines, bounded cleanup
   */
  async shutdown(): Promise<void> {
    const workerIds = Array.from(this.workers.keys());
    const maxWorkers = Math.min(workerIds.length, 1000); // Bounded to 1000 workers

    for (let i = 0; i < maxWorkers; i++) {
      const workerId = workerIds[i];
      await this.transitionHub.transition(workerId, DroneEvent.RESET);
    }

    this.workers.clear();
    this.emit('shutdown-complete');

    // NASA Rule 10: Post-condition assertion
    console.assert(this.workers.size === 0, 'All workers must be cleared');
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: mega-agent-096-drone-elimination
// inputs: ["DroneTypes.ts", "DroneTransitionHub.ts", "DroneTaskExecutor.ts", "DroneMetricsCollector.ts", "DroneReportGenerator.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"v1"}
// === END FOOTER ===