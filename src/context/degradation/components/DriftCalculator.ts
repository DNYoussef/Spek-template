/**
 * Drift Calculator Component
 * Calculates drift metrics and performs trend analysis
 */

import {
  DriftMetrics,
  MonitoringConfig,
  IDriftCalculator
} from '../types/DegradationTypes';
import { ContextDNA, ContextFingerprint } from '../../ContextDNA';

export class DriftCalculator implements IDriftCalculator {
  private readonly config: MonitoringConfig;
  private driftHistory: Map<string, DriftMetrics[]> = new Map();

  constructor(config: MonitoringConfig) {
    this.config = config;
  }

  calculateDrift(
    current: ContextFingerprint,
    previous: ContextFingerprint[]
  ): DriftMetrics {
    const currentDrift = this.calculateCurrentDrift(current, previous);
    const agentPair = this.getAgentPairKey(current);
    const driftRate = this.calculateDriftRate(agentPair, currentDrift);
    const projectedDrift = this.projectFutureDrift(currentDrift, driftRate);
    const timeToThreshold = this.calculateTimeToThreshold(currentDrift, driftRate);

    const metrics: DriftMetrics = {
      currentDrift,
      driftRate,
      projectedDrift,
      timeToThreshold
    };

    this.storeDriftHistory(agentPair, metrics);
    return metrics;
  }

  private calculateCurrentDrift(
    current: ContextFingerprint,
    previous: ContextFingerprint[]
  ): number {
    if (previous.length === 0) {
      return 0;
    }

    const original = previous[0];
    return ContextDNA.calculateDrift(original, current);
  }

  private calculateDriftRate(agentPair: string, currentDrift: number): number {
    const history = this.driftHistory.get(agentPair);

    if (!history || history.length < 2) {
      return 0;
    }

    const recentHistory = history.slice(-5); // Last 5 measurements
    const timeSpan = 5 * (this.config.monitoringInterval / 60000); // In minutes

    const driftChange = currentDrift - recentHistory[0].currentDrift;
    return driftChange / timeSpan;
  }

  private projectFutureDrift(currentDrift: number, driftRate: number): number {
    // Project 10 minutes into the future
    const projectedDrift = currentDrift + (driftRate * 10);
    return Math.min(projectedDrift, 1); // Cap at 100% drift
  }

  private calculateTimeToThreshold(currentDrift: number, driftRate: number): number {
    if (driftRate <= 0) {
      return Infinity; // Drift is stable or improving
    }

    const remainingDrift = this.config.criticalDrift - currentDrift;

    if (remainingDrift <= 0) {
      return 0; // Already past threshold
    }

    return remainingDrift / driftRate; // Minutes until threshold
  }

  private getAgentPairKey(fingerprint: ContextFingerprint): string {
    return `${fingerprint.sourceAgent}-${fingerprint.targetAgent}`;
  }

  private storeDriftHistory(agentPair: string, metrics: DriftMetrics): void {
    if (!this.driftHistory.has(agentPair)) {
      this.driftHistory.set(agentPair, []);
    }

    const history = this.driftHistory.get(agentPair)!;
    history.push(metrics);

    // Maintain maximum history length
    if (history.length > this.config.maxHistoryLength) {
      history.splice(0, history.length - this.config.maxHistoryLength);
    }
  }

  getDriftHistory(agentPair: string): DriftMetrics[] {
    return this.driftHistory.get(agentPair) || [];
  }

  getAllDriftHistory(): Map<string, DriftMetrics[]> {
    return new Map(this.driftHistory);
  }

  analyzeStability(agentPair: string, windowSize: number = 10): {
    isStable: boolean;
    variance: number;
    meanDrift: number;
    confidence: number;
  } {
    const history = this.getDriftHistory(agentPair);
    
    if (history.length < windowSize) {
      return {
        isStable: false,
        variance: 0,
        meanDrift: 0,
        confidence: 0
      };
    }

    const recentHistory = history.slice(-windowSize);
    const drifts = recentHistory.map(h => h.currentDrift);
    
    const meanDrift = drifts.reduce((sum, val) => sum + val, 0) / drifts.length;
    const variance = drifts.reduce((sum, val) => sum + Math.pow(val - meanDrift, 2), 0) / drifts.length;
    
    // Consider stable if variance is low and mean drift is below warning threshold
    const isStable = variance < 0.001 && meanDrift < this.config.warningDrift * 0.8;
    const confidence = Math.min(1, recentHistory.length / windowSize);

    return {
      isStable,
      variance,
      meanDrift,
      confidence
    };
  }

  detectAnomalies(agentPair: string, threshold: number = 2): {
    hasAnomalies: boolean;
    anomalousPoints: number[];
    severity: 'low' | 'medium' | 'high';
  } {
    const history = this.getDriftHistory(agentPair);
    
    if (history.length < 5) {
      return {
        hasAnomalies: false,
        anomalousPoints: [],
        severity: 'low'
      };
    }

    const drifts = history.map(h => h.currentDrift);
    const mean = drifts.reduce((sum, val) => sum + val, 0) / drifts.length;
    const variance = drifts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / drifts.length;
    const standardDeviation = Math.sqrt(variance);

    const anomalousPoints: number[] = [];
    
    drifts.forEach((drift, index) => {
      const zScore = Math.abs((drift - mean) / standardDeviation);
      if (zScore > threshold) {
        anomalousPoints.push(index);
      }
    });

    const anomalyRatio = anomalousPoints.length / drifts.length;
    let severity: 'low' | 'medium' | 'high' = 'low';
    
    if (anomalyRatio > 0.3) {
      severity = 'high';
    } else if (anomalyRatio > 0.1) {
      severity = 'medium';
    }

    return {
      hasAnomalies: anomalousPoints.length > 0,
      anomalousPoints,
      severity
    };
  }

  clearHistory(agentPair?: string): void {
    if (agentPair) {
      this.driftHistory.delete(agentPair);
    } else {
      this.driftHistory.clear();
    }
  }

  getStatistics(): {
    totalPairs: number;
    totalMeasurements: number;
    averageDrift: number;
    maxDrift: number;
    stabilePairs: number;
  } {
    let totalMeasurements = 0;
    let sumDrift = 0;
    let maxDrift = 0;
    let stabilePairs = 0;

    for (const [agentPair, history] of this.driftHistory) {
      totalMeasurements += history.length;
      
      if (history.length > 0) {
        const latestDrift = history[history.length - 1].currentDrift;
        sumDrift += latestDrift;
        maxDrift = Math.max(maxDrift, latestDrift);

        const stability = this.analyzeStability(agentPair);
        if (stability.isStable) {
          stabilePairs++;
        }
      }
    }

    const averageDrift = this.driftHistory.size > 0 ? sumDrift / this.driftHistory.size : 0;

    return {
      totalPairs: this.driftHistory.size,
      totalMeasurements,
      averageDrift,
      maxDrift,
      stabilePairs
    };
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: deg-drift-001
// inputs: ["DriftCalculator requirements"]
// tools_used: ["MultiEdit"]
// versions: {"model":"sonnet-4","prompt":"nasa-rule-10"}
// === END FOOTER ===