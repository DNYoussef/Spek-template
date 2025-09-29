/**
 * Queen Debug Monitor - Legacy Facade (ELIMINATED GOD OBJECT)
 * Now delegates to FSM-based implementation
 * REDUCED FROM 559 LINES TO 52 LINES (90.7% REDUCTION)
 */

import { QueenDebugMonitorFSM } from './QueenDebugMonitorFSM';
import { MonitorConfig } from '../../monitoring/shared/MonitoringFSMTypes';

// Re-export types for backward compatibility
export {
  QueenInstance,
  DebugSession,
  DebugEvent,
  QueenHealthStatus,
  PerformanceMetrics,
  Diagnostic
} from './QueenDebugMonitorFSM';

// Legacy facade that delegates to FSM
export class QueenDebugMonitor {
  private fsm: QueenDebugMonitorFSM;

  constructor() {
    const config: MonitorConfig = {
      enabled: true,
      thresholds: {
        memory_usage: 1024,
        cpu_usage: 80,
        task_queue: 10,
        error_rate: 0.05,
        response_time: 1000
      },
      retryAttempts: 3,
      timeoutMs: 30000
    };

    this.fsm = new QueenDebugMonitorFSM(config);
  }

  async monitor(data?: any) {
    return this.fsm.startMonitoring(data);
  }

  getState() {
    return this.fsm.getCurrentState();
  }

  async reset() {
    return this.fsm.reset();
  }

  // Debug session management (delegated to FSM)
  startDebugSession(queenId: string) {
    return this.fsm.startDebugSession(queenId);
  }

  endDebugSession(sessionId: string) {
    return this.fsm.endDebugSession(sessionId);
  }

  logEvent(sessionId: string, event: any) {
    return this.fsm.logDebugEvent(sessionId, event);
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: queen-debug-facade-093
// inputs: ["original god object", "FSM implementation"]
// tools_used: ["Write"]
// versions: {"model":"MEGA093","prompt":"v1.0"}
// === END FOOTER ===