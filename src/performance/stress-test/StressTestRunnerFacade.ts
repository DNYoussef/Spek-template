/**
 * Stress Test Runner Facade
 * Backward compatibility wrapper for the original StressTestRunner API
 * Delegates to FSM-based StressTestOrchestrator internally
 * NASA Rule 10 compliant: Fixed bounds maintained
 */

import { EventEmitter } from 'events';
import { StressTestOrchestrator } from './core/StressTestOrchestrator';
import {
  StressTestConfig,
  StressTestResult,
  SystemHealthSnapshot,
  Alert,
  StressFailure,
  RecoveryAttempt
} from './types/StressTestTypes';

/**
 * Facade class that maintains API compatibility with original StressTestRunner
 * while using the new FSM-based implementation internally
 */
export class StressTestRunnerFacade extends EventEmitter {
  private orchestrator: StressTestOrchestrator;
  private lastResult: StressTestResult | null = null;

  constructor() {
    super();
    this.orchestrator = new StressTestOrchestrator();
    this.setupEventForwarding();
  }

  /**
   * Forward events from orchestrator to maintain compatibility
   */
  private setupEventForwarding(): void {
    // Forward all events with the same names
    const events = [
      'test-start',
      'test-complete',
      'test-error',
      'phase-start',
      'phase-complete',
      'state-changed',
      'progress',
      'alert',
      'failure',
      'recovery-start',
      'recovery-success',
      'recovery-failed',
      'monitoring-start',
      'load-start'
    ];

    events.forEach(eventName => {
      this.orchestrator.on(eventName, (...args) => {
        this.emit(eventName, ...args);
      });
    });

    // Map specific events for backward compatibility
    this.orchestrator.on('phase-start', (event) => {
      this.emit('phase-start', event);
    });

    this.orchestrator.on('progress', (progress) => {
      this.emit('worker-progress', progress);
    });

    this.orchestrator.on('load-start', (config) => {
      this.emit('load-start', config);
    });

    this.orchestrator.on('alert', (alert) => {
      this.emit('metrics-update', { alert });
    });
  }

  /**
   * Run stress test - main API method
   * Delegates to FSM-based orchestrator
   */
  async runStressTest(config: StressTestConfig): Promise<StressTestResult> {
    try {
      const result = await this.orchestrator.runStressTest(config);
      this.lastResult = result;
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Stop stress test
   */
  async stopStressTest(): Promise<void> {
    await this.orchestrator.stopStressTest();
  }

  /**
   * Check if test is running
   */
  isRunning(): boolean {
    return this.orchestrator.isRunning();
  }

  /**
   * Get system health snapshots
   * Returns data from last test result
   */
  getSystemHealth(): SystemHealthSnapshot[] {
    return this.lastResult?.systemHealth || [];
  }

  /**
   * Get current alerts
   * Returns alerts from last test result
   */
  getCurrentAlerts(): Alert[] {
    if (!this.lastResult) return [];

    // Return recent alerts (last 100)
    const allAlerts: Alert[] = [];
    this.lastResult.phases.forEach(phase => {
      allAlerts.push(...phase.alerts);
    });

    return allAlerts.slice(-100); // NASA Rule 10: Fixed bound
  }

  /**
   * Get failures
   * Returns failures from last test result
   */
  getFailures(): StressFailure[] {
    return this.lastResult?.failures || [];
  }

  /**
   * Get recovery attempts
   * Returns recovery attempts from last test result
   */
  getRecoveryAttempts(): RecoveryAttempt[] {
    return this.lastResult?.recovery || [];
  }

  /**
   * Get current state
   */
  getCurrentState(): string {
    return this.orchestrator.getCurrentState();
  }

  /**
   * Get last test result
   */
  getLastResult(): StressTestResult | null {
    return this.lastResult;
  }

  /**
   * Clear cached result
   */
  clearResult(): void {
    this.lastResult = null;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: stress_test_refactor_008
// inputs: ["StressTestOrchestrator.ts", "StressTestTypes.ts"]
// tools_used: ["Write"]
// versions: {"model":"Sonnet 4","prompt":"v1.0"}
// === END FOOTER ===