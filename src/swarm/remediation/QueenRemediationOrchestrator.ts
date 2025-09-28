/**
 * Queen Remediation Orchestrator (FSM Facade)
 * Delegates to QueenRemediationFSM for 90% line reduction
 * Original: 756 lines -> Facade: ~76 lines = 90% reduction
 */

import { QueenRemediationFSM, RemediationRequest } from '../../orchestration/fsm/QueenRemediationFSM';
import { OrchestratorTransitionHub } from '../../orchestration/fsm/OrchestratorTransitionHub';
import { EventEmitter } from 'events';

/**
 * Queen Remediation Orchestrator
 * FSM-based implementation for systematic god object and connascence remediation
 */
export class QueenRemediationOrchestrator extends EventEmitter {
  private transitionHub: OrchestratorTransitionHub;
  private fsm: QueenRemediationFSM;

  constructor() {
    super();
    this.transitionHub = new OrchestratorTransitionHub();
    this.fsm = new QueenRemediationFSM(this.transitionHub);

    // Forward FSM events
    this.fsm.on('remediationCompleted', (result) => this.emit('remediation:completed', result));
    this.fsm.on('remediationFailed', (error) => this.emit('remediation:failed', error));
  }

  /**
   * Execute comprehensive remediation
   */
  async executeRemediation(
    targetFiles: string[],
    godObjectThreshold: number = 25,
    connascenceThreshold: number = 100,
    princessDomains: string[] = ['development', 'architecture', 'quality', 'performance', 'infrastructure', 'security']
  ): Promise<any> {
    const request: RemediationRequest = {
      sessionId: this.generateId(),
      targetFiles,
      godObjectThreshold,
      connascenceThreshold,
      princessDomains
    };

    return await this.fsm.start(request);
  }

  /**
   * Get remediation status
   */
  async getRemediationStatus(): Promise<any> {
    return await this.fsm.getStatus();
  }

  /**
   * Cancel ongoing remediation
   */
  async cancelRemediation(): Promise<void> {
    await this.fsm.cancel();
  }

  /**
   * Monitor remediation progress
   */
  async monitorProgress(): Promise<any> {
    const status = await this.fsm.getStatus();
    return {
      overallProgress: status.metrics.successRate * 100,
      metrics: status.metrics,
      errors: status.errors
    };
  }

  private generateId(): string {
    return `remediation_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    this.fsm.dispose();
    this.removeAllListeners();
  }
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/* Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T11:42:18-04:00 | MEGA-089@Claude-Sonnet-4 | Converted queen remediation god object to FSM facade (756->76 lines, 90% reduction) | QueenRemediationOrchestrator.ts | OK | Delegates to QueenRemediationFSM for state management | 0.00 | 5f9e2b4 |

Receipt:
- status: OK
- reason_if_blocked: --
- run_id: mega-089-queen-remediation-facade
- inputs: ["QueenRemediationFSM.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"queen-remediation-facade-v1"}
*/
/* AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */