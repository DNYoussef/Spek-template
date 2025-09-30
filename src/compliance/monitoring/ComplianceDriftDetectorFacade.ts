/**
 * ComplianceDriftDetectorFacade - Compliance Drift Detection
 * NASA Rule 10 Compliant
 */
export interface DriftResult {
  hasDrift: boolean;
  driftPercentage: number;
  violations: string[];
}
export class ComplianceDriftDetector {
  private baseline: Record<string, any>  =  {};
  private thresholds: Record<string, number>  =  {};
  /**
   * Set compliance baseline
   */
  setBaseline(baseline: Record<string, any>): void {
    this.baseline  =  { ...baseline };
  }
  /**
   * Set drift thresholds
   */
  setThresholds(thresholds: Record<string, number>): void {
    this.thresholds  =  { ...thresholds };
  }
  /**
   * Detect drift from baseline
   */
  detectDrift(current: Record<string, any>): DriftResult {
    const violations: string[]  =  [];
    let totalMetrics  =  0;
    let driftedMetrics  =  0;
    for (const [key, baseValue] of Object.entries(this.baseline)) {
      totalMetrics++;
      const currentValue  =  current[key];
      const threshold  =  this.thresholds[key] || 0.1; // Default 10% threshold
      if (typeof baseValue === 'number' && typeof currentValue === 'number') {
        const drift  =  Math.abs((currentValue - baseValue) / baseValue);
        if (drift > threshold) {
          driftedMetrics++;
          violations.push(`${key}: ${(drift * 100).toFixed(2)}% drift`);
        }
      } else if (baseValue !== currentValue) {
        driftedMetrics++;
        violations.push(`${key}: value changed`);
      }
    }
    return {
      hasDrift: violations.length > 0,
      driftPercentage: totalMetrics > 0 ? (driftedMetrics / totalMetrics) * 100 : 0,
      violations
    };
  }
  /**
   * Clear baseline
   */
  clear(): void {
    this.baseline  =  {};
    this.thresholds  =  {};
  }
}
export default ComplianceDriftDetector;