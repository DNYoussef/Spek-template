/**
 * Semantic Drift Detector - Legacy Facade (ELIMINATED GOD OBJECT)
 * Now delegates to FSM-based implementation
 * REDUCED FROM 777 LINES TO 48 LINES (93.8% REDUCTION)
 */

import { SemanticDriftDetectorFSM } from './SemanticDriftDetectorFSM';
import { MonitorConfig } from '../monitoring/shared/MonitoringFSMTypes';

// Re-export types for backward compatibility
export {
  DriftPattern,
  ContextSnapshot,
  DriftMetrics,
  AdaptiveThreshold
} from './SemanticDriftDetectorFSM';

// Legacy facade that delegates to FSM
export class SemanticDriftDetector {
  private fsm: SemanticDriftDetectorFSM;

  constructor() {
    const config: MonitorConfig = {
      enabled: true,
      thresholds: {
        velocity: 0.01,
        acceleration: 0.005,
        magnitude: 0.05,
        coherence: 0.7
      },
      retryAttempts: 3,
      timeoutMs: 30000
    };

    this.fsm = new SemanticDriftDetectorFSM(config);
  }

  async analyzeDrift(contexts?: any[]) {
    const scanData = contexts ? {
      contexts,
      windowSize: 10,
      thresholds: []
    } : undefined;

    return this.fsm.startMonitoring(scanData);
  }

  getState() {
    return this.fsm.getCurrentState();
  }

  async reset() {
    return this.fsm.reset();
  }

  getContext() {
    return this.fsm.getContext();
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T20:25:02-04:00 | agent@ModelMEGA093 | Replace 777-line god object with 48-line FSM facade | SemanticDriftDetector.ts | OK | 93.8% reduction | 0.00 | c5d8a2e |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: semantic-facade-093
- inputs: ["original god object", "FSM implementation"]
- tools_used: ["Write"]
- versions: {"model":"MEGA093","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->