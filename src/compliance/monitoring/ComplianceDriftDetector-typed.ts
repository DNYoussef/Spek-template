/**
 * Compliance Drift Detector - Legacy Facade (ELIMINATED GOD OBJECT)
 * Now delegates to FSM-based implementation
 * REDUCED FROM 1138 LINES TO 52 LINES (95.4% REDUCTION)
 */

import { ComplianceDriftDetectorFSM } from './ComplianceDriftDetectorFSM';
import { MonitorConfig } from '../../monitoring/shared/MonitoringFSMTypes';

// Legacy facade that delegates to FSM
export class ComplianceDriftDetector {
  private fsm: ComplianceDriftDetectorFSM;

  constructor(config?: Partial<MonitorConfig>) {
    const defaultConfig: MonitorConfig = {
      enabled: true,
      thresholds: {
        drift_score: 60,
        critical_violations: 0,
        high_violations: 5
      },
      retryAttempts: 3,
      timeoutMs: 30000
    };

    this.fsm = new ComplianceDriftDetectorFSM({
      ...defaultConfig,
      ...config
    });
  }

  async scan(data?: any) {
    return this.fsm.startMonitoring(data);
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

// Re-export main class for compatibility
export default ComplianceDriftDetector;

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: compliance-facade-093
// inputs: ["original god object", "FSM implementation"]
// tools_used: ["Write"]
// versions: {"model":"MEGA093","prompt":"v1.0"}
// === END FOOTER ===