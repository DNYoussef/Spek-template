/**
 * Monitoring Orchestrator
 * Main facade for degradation monitoring system with dependency injection
 * Replaces the monolithic DegradationMonitor with FSM-based architecture
 */

import {
  DriftMetrics,
  DegradationAlert,
  RecoveryAction,
  RecoveryResult,
  MonitoringConfig,
  MonitoringContext,
  MonitoringState,
  MonitoringEvent,
  DEFAULT_CONFIG
} from './types/DegradationTypes';
import { ContextFingerprint } from '../ContextDNA';
import { DegradationMonitorFSM } from './fsm/DegradationMonitorFSM';
import { AlertManager } from './components/AlertManager';
import { DriftCalculator } from './components/DriftCalculator';
import { ValidationEngine } from './components/ValidationEngine';
import { RecoveryExecutor } from './components/RecoveryExecutor';

/**
 * Main orchestrator for degradation monitoring
 * Coordinates FSM states and component interactions
 */
export class MonitoringOrchestrator {
  private fsm: DegradationMonitorFSM;
  private alertManager: AlertManager;
  private driftCalculator: DriftCalculator;
  private validationEngine: ValidationEngine;
  private recoveryExecutor: RecoveryExecutor;
  private context: MonitoringContext;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<MonitoringConfig> = {}) {
    // Initialize configuration
    const fullConfig: MonitoringConfig = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize context
    this.context = {
      config: fullConfig,
      driftHistory: new Map(),
      alerts: [],
      recoveryActions: []
    };

    // Initialize components
    this.alertManager = new AlertManager();
    this.driftCalculator = new DriftCalculator(fullConfig);
    this.validationEngine = new ValidationEngine();
    this.recoveryExecutor = new RecoveryExecutor();
    
    // Initialize FSM
    this.fsm = new DegradationMonitorFSM(this.context);
  }

  /**
   * Start degradation monitoring
   */
  async startMonitoring(): Promise<boolean> {
    try {
      const success = await this.fsm.processEvent(MonitoringEvent.START_MONITORING);
      
      if (success) {
        // Start FSM update loop
        this.updateInterval = setInterval(
          () => this.updateFSM(),
          this.context.config.monitoringInterval
        );
        
        console.log('Degradation monitoring started successfully');
      }
      
      return success;
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      this.context.error = error;
      await this.fsm.processEvent(MonitoringEvent.ERROR_OCCURRED);
      return false;
    }
  }

  /**
   * Stop degradation monitoring
   */
  async stopMonitoring(): Promise<void> {
    try {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
      
      await this.fsm.processEvent(MonitoringEvent.STOP_MONITORING);
      console.log('Degradation monitoring stopped');
    } catch (error) {
      console.error('Error stopping monitoring:', error);
    }
  }

  /**
   * Monitor a context transfer for degradation
   */
  async monitorTransfer(
    context: any,
    fingerprint: ContextFingerprint,
    previousFingerprints: ContextFingerprint[] = []
  ): Promise<{
    drift: DriftMetrics;
    alert?: DegradationAlert;
    recovery?: RecoveryAction;
  }> {
    try {
      // Set current transfer in context
      this.context.currentTransfer = {
        context,
        fingerprint,
        previousFingerprints
      };

      // Calculate drift metrics
      const drift = this.driftCalculator.calculateDrift(fingerprint, previousFingerprints);
      
      // Update drift history
      const agentPair = `${fingerprint.sourceAgent}-${fingerprint.targetAgent}`;
      const history = this.context.driftHistory.get(agentPair) || [];
      history.push(drift);
      this.context.driftHistory.set(agentPair, history);

      // Generate alert if needed
      const alert = this.alertManager.generateAlert(drift, fingerprint, this.context.config);
      if (alert) {
        this.context.alerts.push(alert);
        await this.fsm.processEvent(MonitoringEvent.ALERT_TRIGGERED);
      }

      // Determine recovery action if needed
      const recovery = await this.recoveryExecutor.determineRecoveryAction(
        drift,
        fingerprint,
        context,
        this.context.config
      );
      
      if (recovery) {
        this.context.recoveryActions.push(recovery);
        await this.fsm.processEvent(MonitoringEvent.RECOVERY_INITIATED);
      }

      // Trigger drift detection event if critical
      if (drift.currentDrift >= this.context.config.criticalDrift) {
        await this.fsm.processEvent(MonitoringEvent.DRIFT_DETECTED);
      }

      return { drift, alert, recovery };
    } catch (error) {
      console.error('Transfer monitoring failed:', error);
      this.context.error = error;
      await this.fsm.processEvent(MonitoringEvent.ERROR_OCCURRED);
      
      // Return empty metrics on error
      return {
        drift: {
          currentDrift: 0,
          driftRate: 0,
          projectedDrift: 0,
          timeToThreshold: Infinity
        }
      };
    }
  }

  /**
   * Execute a recovery action
   */
  async executeRecovery(action: RecoveryAction): Promise<RecoveryResult> {
    try {
      const result = await this.recoveryExecutor.executeRecovery(action);
      
      if (result.success) {
        await this.fsm.processEvent(MonitoringEvent.RECOVERY_COMPLETED);
      } else {
        await this.fsm.processEvent(MonitoringEvent.ERROR_OCCURRED);
      }
      
      return result;
    } catch (error) {
      console.error('Recovery execution failed:', error);
      this.context.error = error;
      await this.fsm.processEvent(MonitoringEvent.ERROR_OCCURRED);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current monitoring status
   */
  getStatus(): {
    state: MonitoringState;
    active: boolean;
    totalAlerts: number;
    criticalAlerts: number;
    pendingRecoveries: number;
    monitoredPairs: number;
    statistics: any;
  } {
    const alertStats = this.alertManager.getStatistics();
    const driftStats = this.driftCalculator.getStatistics();
    const pendingRecoveries = this.context.recoveryActions.filter(a => a.confidence > 0.7).length;

    return {
      state: this.fsm.getCurrentState(),
      active: this.fsm.isActive(),
      totalAlerts: alertStats.total,
      criticalAlerts: alertStats.critical,
      pendingRecoveries,
      monitoredPairs: driftStats.totalPairs,
      statistics: {
        alerts: alertStats,
        drift: driftStats
      }
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 10): DegradationAlert[] {
    return this.alertManager.getRecentAlerts(limit);
  }

  /**
   * Clear alert history
   */
  clearAlerts(): void {
    this.alertManager.clearAlerts();
    this.context.alerts = [];
  }

  /**
   * Reset monitoring system
   */
  async reset(): Promise<void> {
    try {
      // Stop monitoring if active
      if (this.fsm.isActive()) {
        await this.stopMonitoring();
      }
      
      // Reset FSM
      await this.fsm.processEvent(MonitoringEvent.RESET);
      
      // Clear all data
      this.context.driftHistory.clear();
      this.context.alerts = [];
      this.context.recoveryActions = [];
      this.context.currentTransfer = undefined;
      this.context.error = undefined;
      
      // Clear component data
      this.alertManager.clearAlerts();
      this.driftCalculator.clearHistory();
      
      console.log('Monitoring system reset complete');
    } catch (error) {
      console.error('Reset failed:', error);
    }
  }

  /**
   * Update FSM state machine
   */
  private async updateFSM(): Promise<void> {
    try {
      await this.fsm.update();
    } catch (error) {
      console.error('FSM update error:', error);
      this.context.error = error;
      await this.fsm.processEvent(MonitoringEvent.ERROR_OCCURRED);
    }
  }

  /**
   * Get drift history for agent pair
   */
  getDriftHistory(sourceAgent: string, targetAgent: string): DriftMetrics[] {
    const agentPair = `${sourceAgent}-${targetAgent}`;
    return this.driftCalculator.getDriftHistory(agentPair);
  }

  /**
   * Analyze trend for agent pair
   */
  analyzeTrend(sourceAgent: string, targetAgent: string) {
    const agentPair = `${sourceAgent}-${targetAgent}`;
    const history = this.driftCalculator.getDriftHistory(agentPair);
    return this.alertManager.analyzeTrend(agentPair, history);
  }

  /**
   * Check agent capability
   */
  async checkAgentCapability(agent: string) {
    return await this.validationEngine.validateAgentCapability(agent);
  }

  /**
   * Get configuration
   */
  getConfig(): MonitoringConfig {
    return { ...this.context.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.context.config = { ...this.context.config, ...newConfig };
    
    // Update components that depend on config
    this.driftCalculator = new DriftCalculator(this.context.config);
  }
}

// Export for backward compatibility
export { MonitoringOrchestrator as DegradationMonitor };
export default MonitoringOrchestrator;

// Re-export types for convenience
export * from './types/DegradationTypes';

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T15:55:08-04:00 | codex@sonnet-4 | Create MonitoringOrchestrator facade | MonitoringOrchestrator.ts | OK | Main facade with dependency injection, FSM coordination, backward compatibility | 0.03 | 4a7b2d8 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: deg-orchestrator-001
- inputs: ["MonitoringOrchestrator requirements"]
- tools_used: ["MultiEdit"]
- versions: {"model":"sonnet-4","prompt":"nasa-rule-10"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->