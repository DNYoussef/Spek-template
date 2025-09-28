/**
 * Alert Manager Component
 * Handles alert generation, management, and trend analysis
 */

import {
  DegradationAlert,
  DriftMetrics,
  MonitoringConfig,
  AlertLevel,
  TrendAnalysis,
  TrendType,
  IAlertManager
} from '../types/DegradationTypes';
import { ContextFingerprint } from '../../ContextDNA';

export class AlertManager implements IAlertManager {
  private alerts: DegradationAlert[] = [];
  private readonly maxAlertsHistory: number = 1000;

  generateAlert(
    metrics: DriftMetrics,
    fingerprint: ContextFingerprint,
    config: MonitoringConfig
  ): DegradationAlert | null {
    const alertData = this.analyzeMetrics(metrics, config);
    
    if (!alertData) {
      return null;
    }

    const alert: DegradationAlert = {
      level: alertData.level,
      message: alertData.message,
      affectedAgents: [fingerprint.sourceAgent, fingerprint.targetAgent],
      metrics,
      recommendedAction: alertData.recommendedAction,
      timestamp: Date.now()
    };

    this.storeAlert(alert);
    return alert;
  }

  private analyzeMetrics(
    metrics: DriftMetrics,
    config: MonitoringConfig
  ): { level: AlertLevel; message: string; recommendedAction: string } | null {
    // Critical drift threshold exceeded
    if (metrics.currentDrift >= config.criticalDrift) {
      return {
        level: AlertLevel.CRITICAL,
        message: `Critical degradation detected: ${this.formatPercentage(metrics.currentDrift)}`,
        recommendedAction: 'Immediate rollback or reconstruction required'
      };
    }

    // Warning drift threshold exceeded
    if (metrics.currentDrift >= config.warningDrift) {
      return {
        level: AlertLevel.WARNING,
        message: `Warning: Degradation approaching threshold: ${this.formatPercentage(metrics.currentDrift)}`,
        recommendedAction: 'Prepare recovery checkpoint and monitor closely'
      };
    }

    // Projected to exceed critical threshold
    if (metrics.projectedDrift >= config.criticalDrift) {
      return {
        level: AlertLevel.WARNING,
        message: `Projected to exceed threshold in ${this.formatMinutes(metrics.timeToThreshold)}`,
        recommendedAction: 'Preemptive intervention recommended'
      };
    }

    // High drift rate detected
    if (metrics.driftRate > 0.01) { // More than 1% per minute
      return {
        level: AlertLevel.INFO,
        message: `Drift rate elevated: ${this.formatPercentage(metrics.driftRate)} per minute`,
        recommendedAction: 'Continue monitoring'
      };
    }

    return null;
  }

  private storeAlert(alert: DegradationAlert): void {
    this.alerts.push(alert);
    
    // Maintain maximum history
    if (this.alerts.length > this.maxAlertsHistory) {
      this.alerts = this.alerts.slice(-this.maxAlertsHistory);
    }
  }

  getRecentAlerts(limit: number = 10): DegradationAlert[] {
    return this.alerts.slice(-limit);
  }

  getAlertsByLevel(level: AlertLevel, limit?: number): DegradationAlert[] {
    const filtered = this.alerts.filter(alert => alert.level === level);
    return limit ? filtered.slice(-limit) : filtered;
  }

  getAlertsForAgent(agent: string, limit?: number): DegradationAlert[] {
    const filtered = this.alerts.filter(alert => 
      alert.affectedAgents.includes(agent)
    );
    return limit ? filtered.slice(-limit) : filtered;
  }

  analyzeTrend(agentPair: string, driftHistory: DriftMetrics[]): TrendAnalysis {
    if (driftHistory.length < 2) {
      return {
        trend: 'stable',
        confidence: 0,
        dataPoints: driftHistory.length
      };
    }

    const trend = this.calculateTrend(driftHistory);
    const confidence = this.calculateTrendConfidence(driftHistory, trend);

    return {
      trend,
      confidence,
      dataPoints: driftHistory.length
    };
  }

  private calculateTrend(history: DriftMetrics[]): TrendType {
    if (history.length < 2) return 'stable';

    const drifts = history.map(h => h.currentDrift);
    const rates = history.map(h => h.driftRate);

    // Check if drift is increasing
    const driftIncreasing = drifts[drifts.length - 1] > drifts[0];

    // Check if rate is increasing (acceleration)
    const rateIncreasing = rates[rates.length - 1] > rates[0];

    if (rateIncreasing && driftIncreasing) {
      return 'accelerating';
    } else if (driftIncreasing) {
      return 'degrading';
    } else if (drifts[drifts.length - 1] < drifts[0]) {
      return 'improving';
    } else {
      return 'stable';
    }
  }

  private calculateTrendConfidence(history: DriftMetrics[], trend: TrendType): number {
    if (history.length < 3) return 0.5;

    const drifts = history.map(h => h.currentDrift);
    
    // Calculate variance to determine confidence
    const mean = drifts.reduce((sum, val) => sum + val, 0) / drifts.length;
    const variance = drifts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / drifts.length;
    const standardDeviation = Math.sqrt(variance);

    // Lower variance = higher confidence
    const varianceConfidence = Math.max(0, 1 - (standardDeviation * 2));

    // More data points = higher confidence
    const dataConfidence = Math.min(1, history.length / 10);

    // Combine confidence factors
    return (varianceConfidence + dataConfidence) / 2;
  }

  getStatistics(): {
    total: number;
    critical: number;
    warning: number;
    info: number;
    recentActivity: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    return {
      total: this.alerts.length,
      critical: this.getAlertsByLevel(AlertLevel.CRITICAL).length,
      warning: this.getAlertsByLevel(AlertLevel.WARNING).length,
      info: this.getAlertsByLevel(AlertLevel.INFO).length,
      recentActivity: this.alerts.filter(a => a.timestamp > oneHourAgo).length
    };
  }

  clearAlerts(): void {
    this.alerts = [];
  }

  clearOldAlerts(maxAge: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    const originalCount = this.alerts.length;
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
    return originalCount - this.alerts.length;
  }

  private formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  private formatMinutes(minutes: number): string {
    if (minutes === Infinity) return 'stable';
    if (minutes < 1) return '<1 minute';
    if (minutes < 60) return `${minutes.toFixed(1)} minutes`;
    return `${(minutes / 60).toFixed(1)} hours`;
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T15:50:02-04:00 | codex@sonnet-4 | Create AlertManager component | AlertManager.ts | OK | Alert generation, trend analysis, statistics | 0.02 | 2d4f8a9 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: deg-alert-001
- inputs: ["AlertManager requirements"]
- tools_used: ["MultiEdit"]
- versions: {"model":"sonnet-4","prompt":"nasa-rule-10"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->