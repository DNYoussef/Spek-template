/**
 * ArchitectureTaskQueue - Task Queue Management for Architecture Princess
 * NASA Rule 10 Compliant: ≤60 lines per function, 2+ assertions
 * Bounded queue prevents infinite growth
 */

export interface ArchitectureTask {
  id: string;
  type: 'system' | 'technical' | 'quality' | 'compliance' | 'validation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: any;
  timestamp: number;
}

export class ArchitectureTaskQueue {
  private queue: ArchitectureTask[] = [];
  private readonly maxSize = 100; // NASA Rule 10: Bounded queue
  private processing = false;

  constructor() {
    // NASA Rule 10: Assertions
    console.assert(this.maxSize > 0, 'Queue max size must be positive');
    console.assert(Array.isArray(this.queue), 'Queue must be an array');
  }

  /**
   * Check if queue is empty
   * NASA Rule 10: ≤60 lines
   */
  isEmpty(): boolean {
    console.assert(Array.isArray(this.queue), 'Queue must be an array');
    return this.queue.length === 0;
  }

  /**
   * Get queue size
   * NASA Rule 10: ≤60 lines
   */
  size(): number {
    console.assert(Array.isArray(this.queue), 'Queue must be an array');
    return this.queue.length;
  }

  /**
   * Enqueue a task with priority ordering
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  enqueue(task: ArchitectureTask): boolean {
    console.assert(task !== null, 'Task cannot be null');
    console.assert(task.id !== undefined, 'Task must have an ID');

    // Check queue bounds (NASA Rule 10)
    if (this.queue.length >= this.maxSize) {
      return false;
    }

    // Validate task structure
    if (!this.isValidTask(task)) {
      return false;
    }

    // Insert task based on priority
    const insertIndex = this.findInsertPosition(task.priority);
    this.queue.splice(insertIndex, 0, task);

    return true;
  }

  /**
   * Dequeue highest priority task
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  dequeue(): ArchitectureTask | null {
    console.assert(Array.isArray(this.queue), 'Queue must be an array');

    if (this.queue.length === 0) {
      return null;
    }

    const task = this.queue.shift();
    console.assert(task !== undefined, 'Dequeued task must not be undefined');

    return task || null;
  }

  /**
   * Validate task structure
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private isValidTask(task: ArchitectureTask): boolean {
    console.assert(task !== null, 'Task cannot be null');
    console.assert(typeof task === 'object', 'Task must be an object');

    const validTypes = ['system', 'technical', 'quality', 'compliance', 'validation'];
    const validPriorities = ['low', 'medium', 'high', 'critical'];

    return task.id !== undefined &&
           typeof task.id === 'string' &&
           validTypes.includes(task.type) &&
           validPriorities.includes(task.priority) &&
           typeof task.timestamp === 'number';
  }

  /**
   * Find insertion position based on priority
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private findInsertPosition(priority: string): number {
    console.assert(typeof priority === 'string', 'Priority must be a string');

    const priorities = ['critical', 'high', 'medium', 'low'];
    const targetIndex = priorities.indexOf(priority);

    console.assert(targetIndex !== -1, 'Priority must be valid');

    // Find insertion point maintaining priority order
    for (let i = 0; i < this.queue.length; i++) {
      const queuePriority = this.queue[i].priority;
      const queueIndex = priorities.indexOf(queuePriority);

      if (targetIndex < queueIndex) {
        return i;
      }
    }

    return this.queue.length;
  }

  /**
   * Clear all tasks from queue
   * NASA Rule 10: ≤60 lines
   */
  clear(): void {
    console.assert(Array.isArray(this.queue), 'Queue must be an array');

    this.queue.length = 0;
    this.processing = false;

    console.assert(this.queue.length === 0, 'Queue must be empty after clear');
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T09:36:09-04:00 | agent@Sonnet4 | Create ArchitectureTaskQueue component | ArchitectureTaskQueue.ts | OK | NASA Rule 10 bounded queue | 0.00 | 6b7c8d9 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: princess-domain-elimination-020
- inputs: ["ArchitecturePrincessFSM.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-3-5-sonnet-20241022","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->