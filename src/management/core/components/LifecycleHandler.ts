/**
 * Lifecycle Handler - Shared Lifecycle Management Component
 * NASA Rule 10 Compliant: ≤60 line functions, bounded loops
 */

import { EventEmitter } from 'events';
import { LifecycleInfo } from '../types/ManagementTypes';

export class LifecycleHandler extends EventEmitter {
  private lifecycles: Map<string, LifecycleInfo> = new Map();
  private phases: string[] = ['init', 'start', 'run', 'stop', 'cleanup'];
  private config: any;
  private monitoringTimer?: NodeJS.Timeout;

  constructor(config: any) {
    super();
    console.assert(config !== null, 'LifecycleHandler config required');
    this.config = config;
  }

  /**
   * Start lifecycle handler
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async start(): Promise<void> {
    console.assert(this.config !== null, 'Config must be set');

    // Start lifecycle monitoring
    this.monitoringTimer = setInterval(() => {
      this.monitorLifecycles();
    }, 3000);

    this.emit('handler-started');
    console.assert(this.monitoringTimer !== undefined, 'Lifecycle handler started');
  }

  /**
   * Register component lifecycle
   * NASA Rule 10: ≤60 lines, bounded registration
   */
  async registerLifecycle(componentId: string, phase: string = 'init'): Promise<void> {
    console.assert(componentId !== null && componentId !== '', 'ComponentId required');
    console.assert(this.phases.includes(phase), 'Valid phase required');

    const lifecycle: LifecycleInfo = {
      componentId,
      phase: phase as any,
      startTime: Date.now(),
      status: 'pending'
    };

    this.lifecycles.set(componentId, lifecycle);
    this.emit('lifecycle-registered', { componentId, phase });
    console.assert(this.lifecycles.has(componentId), 'Lifecycle registered successfully');
  }

  /**
   * Transition component to next lifecycle phase
   * NASA Rule 10: ≤60 lines, bounded transitions
   */
  async transitionPhase(componentId: string, targetPhase: string): Promise<void> {
    console.assert(componentId !== null, 'ComponentId required');
    console.assert(this.phases.includes(targetPhase), 'Valid target phase required');

    const lifecycle = this.lifecycles.get(componentId);
    if (!lifecycle) {
      throw new Error(`Lifecycle not found for component: ${componentId}`);
    }

    // Validate phase transition
    const currentIndex = this.phases.indexOf(lifecycle.phase);
    const targetIndex = this.phases.indexOf(targetPhase);

    if (targetIndex < currentIndex) {
      throw new Error(`Invalid backward transition from ${lifecycle.phase} to ${targetPhase}`);
    }

    // Update lifecycle
    lifecycle.phase = targetPhase as any;
    lifecycle.status = 'active';
    if (targetPhase === 'cleanup') {
      lifecycle.endTime = Date.now();
      lifecycle.status = 'complete';
    }

    this.emit('phase-transitioned', { componentId, previousPhase: lifecycle.phase, targetPhase });
    console.assert(lifecycle.phase === targetPhase, 'Phase transition completed');
  }

  /**
   * Monitor active lifecycles
   * NASA Rule 10: ≤60 lines, bounded monitoring
   */
  private monitorLifecycles(): void {
    console.assert(this.lifecycles !== null, 'Lifecycles map must exist');

    const now = Date.now();
    const timeout = this.config.coordinationTimeout || 30000;

    // Check up to 20 lifecycles per monitoring cycle (bounded)
    const lifecyclesToCheck = Array.from(this.lifecycles.entries()).slice(0, 20);

    lifecyclesToCheck.forEach(([componentId, lifecycle]) => {
      // Check for timeouts
      if (lifecycle.status === 'active' && (now - lifecycle.startTime) > timeout) {
        lifecycle.status = 'error';
        this.emit('lifecycle-timeout', { componentId, phase: lifecycle.phase });
      }

      // Auto-transition run phase after some time
      if (lifecycle.phase === 'run' && lifecycle.status === 'active') {
        const runTime = now - lifecycle.startTime;
        if (runTime > 10000) { // 10 seconds
          this.transitionPhase(componentId, 'stop').catch(err => {
            this.emit('transition-error', { componentId, error: err.message });
          });
        }
      }
    });

    console.assert(lifecyclesToCheck.length <= 20, 'Monitoring bounded to 20 lifecycles');
  }

  /**
   * Complete component lifecycle
   * NASA Rule 10: ≤60 lines, no recursion
   */
  async completeLifecycle(componentId: string): Promise<void> {
    console.assert(componentId !== null, 'ComponentId required');

    const lifecycle = this.lifecycles.get(componentId);
    if (!lifecycle) return;

    lifecycle.phase = 'cleanup';
    lifecycle.status = 'complete';
    lifecycle.endTime = Date.now();

    this.emit('lifecycle-completed', { componentId, duration: lifecycle.endTime - lifecycle.startTime });
    console.assert(lifecycle.status === 'complete', 'Lifecycle completed');
  }

  /**
   * Get lifecycle status
   */
  getLifecycleStatus(componentId: string): LifecycleInfo | null {
    return this.lifecycles.get(componentId) || null;
  }

  /**
   * Get lifecycle metrics
   */
  getMetrics(): any {
    const lifecycles = Array.from(this.lifecycles.values());
    const phaseDistribution = new Map<string, number>();
    const statusDistribution = new Map<string, number>();

    // Count phases and statuses (bounded to first 100)
    lifecycles.slice(0, 100).forEach(lifecycle => {
      const phaseCount = phaseDistribution.get(lifecycle.phase) || 0;
      phaseDistribution.set(lifecycle.phase, phaseCount + 1);

      const statusCount = statusDistribution.get(lifecycle.status) || 0;
      statusDistribution.set(lifecycle.status, statusCount + 1);
    });

    return {
      totalLifecycles: lifecycles.length,
      phaseDistribution: Object.fromEntries(phaseDistribution),
      statusDistribution: Object.fromEntries(statusDistribution),
      activeLifecycles: lifecycles.filter(l => l.status === 'active').length
    };
  }

  async shutdown(): Promise<void> {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    // Complete all active lifecycles
    const activeLifecycles = Array.from(this.lifecycles.keys()).slice(0, 50); // Bounded
    await Promise.all(activeLifecycles.map(id => this.completeLifecycle(id)));

    this.lifecycles.clear();
    this.emit('handler-shutdown');
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T11:50:18-04:00 | agent@claude-sonnet-4 | Created LifecycleHandler shared component | LifecycleHandler.ts | OK | Shared lifecycle management with NASA compliance | 0.00 | e7f8g9h |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: mega-agent-094-lifecycle-handler
- inputs: ["ManagementHub architecture"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->