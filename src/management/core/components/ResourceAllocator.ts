/**
 * Resource Allocator - Shared Resource Management Component
 * NASA Rule 10 Compliant: ≤60 line functions, bounded loops
 */

import { EventEmitter } from 'events';
import { ResourceInfo } from '../types/ManagementTypes';

export class ResourceAllocator extends EventEmitter {
  private resources: Map<string, ResourceInfo> = new Map();
  private allocations: Map<string, string[]> = new Map();
  private config: any;

  constructor(config: any) {
    super();
    console.assert(config !== null, 'ResourceAllocator config required');
    this.config = config;
  }

  /**
   * Start resource allocator
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async start(): Promise<void> {
    console.assert(this.config !== null, 'Config must be set');

    // Initialize resource pool
    for (let i = 0; i < this.config.resourcePoolSize; i++) {
      const resource: ResourceInfo = {
        id: `resource_${i}`,
        type: 'compute',
        capacity: 100,
        allocated: 0,
        available: 100,
        state: 'available'
      };
      this.resources.set(resource.id, resource);
    }

    this.emit('allocator-started', { poolSize: this.resources.size });
    console.assert(this.resources.size > 0, 'Resource pool initialized');
  }

  /**
   * Allocate resources for a task
   * NASA Rule 10: ≤60 lines, bounded allocation
   */
  async allocate(taskId: string, requirements: any): Promise<boolean> {
    console.assert(taskId !== null && taskId !== '', 'TaskId required');

    const requiredCapacity = requirements.capacity || 10;
    const availableResources = Array.from(this.resources.values())
      .filter(r => r.available >= requiredCapacity)
      .slice(0, 5); // Bounded to max 5 resources

    if (availableResources.length === 0) {
      return false;
    }

    // Allocate first available resource
    const resource = availableResources[0];
    resource.allocated += requiredCapacity;
    resource.available -= requiredCapacity;

    // Track allocation
    if (!this.allocations.has(taskId)) {
      this.allocations.set(taskId, []);
    }
    this.allocations.get(taskId)!.push(resource.id);

    this.emit('resource-allocated', { taskId, resourceId: resource.id, capacity: requiredCapacity });
    console.assert(resource.allocated <= resource.capacity, 'Resource allocation valid');
    return true;
  }

  /**
   * Deallocate resources for a task
   * NASA Rule 10: ≤60 lines, bounded deallocation
   */
  async deallocate(taskId: string): Promise<void> {
    console.assert(taskId !== null, 'TaskId required');

    const allocatedResources = this.allocations.get(taskId);
    if (!allocatedResources) {
      return;
    }

    // Release all allocated resources
    for (const resourceId of allocatedResources) {
      const resource = this.resources.get(resourceId);
      if (resource) {
        const allocatedCapacity = resource.allocated;
        resource.allocated = 0;
        resource.available = resource.capacity;
        this.emit('resource-deallocated', { taskId, resourceId, capacity: allocatedCapacity });
      }
    }

    this.allocations.delete(taskId);
    console.assert(!this.allocations.has(taskId), 'Resources deallocated');
  }

  /**
   * Get resource usage metrics
   */
  getUsage(): any {
    const totalCapacity = Array.from(this.resources.values())
      .reduce((sum, r) => sum + r.capacity, 0);
    const totalAllocated = Array.from(this.resources.values())
      .reduce((sum, r) => sum + r.allocated, 0);

    return {
      totalCapacity,
      totalAllocated,
      utilizationRate: totalCapacity > 0 ? totalAllocated / totalCapacity : 0,
      activeAllocations: this.allocations.size
    };
  }

  async shutdown(): Promise<void> {
    this.resources.clear();
    this.allocations.clear();
    this.emit('allocator-shutdown');
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T11:45:34-04:00 | agent@claude-sonnet-4 | Created ResourceAllocator shared component | ResourceAllocator.ts | OK | Shared resource management with NASA compliance | 0.00 | a3b4c5d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: mega-agent-094-resource-allocator
- inputs: ["ManagementHub architecture"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->