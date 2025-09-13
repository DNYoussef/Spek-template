/**
 * Six Sigma Telemetry Engine - Real Mathematical Calculations
 * Implements DPMO, RTY, Sigma Level calculations with actual formulas
 */

class SixSigmaTelemetry {
  constructor() {
    this.data = {
      defects: 0,
      opportunities: 0,
      units: 0,
      processes: []
    };
  }

  /**
   * Calculate Defects Per Million Opportunities (DPMO)
   * Formula: DPMO = (Defects / (Units * Opportunities)) * 1,000,000
   */
  calculateDPMO(defects, units, opportunities) {
    if (units === 0 || opportunities === 0) {
      throw new Error('Units and opportunities must be greater than 0');
    }
    
    const dpmo = (defects / (units * opportunities)) * 1000000;
    return Math.round(dpmo);
  }

  /**
   * Calculate Rolled Throughput Yield (RTY)
   * Formula: RTY = Product of all individual process yields
   */
  calculateRTY(processYields) {
    if (!Array.isArray(processYields) || processYields.length === 0) {
      throw new Error('Process yields must be a non-empty array');
    }
    
    const rty = processYields.reduce((product, yield_val) => {
      if (yield_val < 0 || yield_val > 1) {
        throw new Error('Yield values must be between 0 and 1');
      }
      return product * yield_val;
    }, 1);
    
    return Math.round(rty * 10000) / 10000; // 4 decimal places
  }

  /**
   * Calculate Sigma Level from DPMO
   * Uses approximation formula: Sigma = 29.37 - 2.221 * ln(DPMO)
   */
  calculateSigmaLevel(dpmo) {
    if (dpmo <= 0) {
      return 6; // Perfect quality
    }
    
    if (dpmo >= 933193) {
      return 0; // Very poor quality
    }
    
    const sigma = 29.37 - 2.221 * Math.log(dpmo);
    return Math.round(sigma * 100) / 100; // 2 decimal places
  }

  /**
   * Calculate Process Capability Index (Cpk)
   * Formula: Cpk = min((USL - mean) / (3 * std), (mean - LSL) / (3 * std))
   */
  calculateCpk(mean, standardDeviation, upperLimit, lowerLimit) {
    if (standardDeviation <= 0) {
      throw new Error('Standard deviation must be greater than 0');
    }
    
    const cpkUpper = (upperLimit - mean) / (3 * standardDeviation);
    const cpkLower = (mean - lowerLimit) / (3 * standardDeviation);
    
    const cpk = Math.min(cpkUpper, cpkLower);
    return Math.round(cpk * 1000) / 1000; // 3 decimal places
  }

  /**
   * Calculate First Time Yield (FTY)
   * Formula: FTY = (Units - Defects) / Units
   */
  calculateFTY(units, defects) {
    if (units === 0) {
      throw new Error('Units must be greater than 0');
    }
    
    const fty = (units - defects) / units;
    return Math.max(0, Math.round(fty * 10000) / 10000); // 4 decimal places, min 0
  }

  /**
   * Add process data for comprehensive analysis
   */
  addProcessData(processName, defects, units, opportunities) {
    const dpmo = this.calculateDPMO(defects, units, opportunities);
    const sigmaLevel = this.calculateSigmaLevel(dpmo);
    const fty = this.calculateFTY(units, defects);
    
    const processData = {
      name: processName,
      defects,
      units,
      opportunities,
      dpmo,
      sigmaLevel,
      fty,
      timestamp: new Date().toISOString()
    };
    
    this.data.processes.push(processData);
    return processData;
  }

  /**
   * Generate comprehensive Six Sigma report
   */
  generateReport() {
    if (this.data.processes.length === 0) {
      return {
        error: 'No process data available',
        processes: []
      };
    }

    const totalDefects = this.data.processes.reduce((sum, p) => sum + p.defects, 0);
    const totalUnits = this.data.processes.reduce((sum, p) => sum + p.units, 0);
    const totalOpportunities = this.data.processes.reduce((sum, p) => sum + p.opportunities, 0);
    
    const overallDPMO = this.calculateDPMO(totalDefects, totalUnits, totalOpportunities);
    const overallSigmaLevel = this.calculateSigmaLevel(overallDPMO);
    const processYields = this.data.processes.map(p => p.fty);
    const overallRTY = this.calculateRTY(processYields);

    return {
      summary: {
        totalProcesses: this.data.processes.length,
        totalDefects,
        totalUnits,
        totalOpportunities,
        overallDPMO,
        overallSigmaLevel,
        overallRTY,
        averageFTY: Math.round((processYields.reduce((a, b) => a + b, 0) / processYields.length) * 10000) / 10000
      },
      processes: this.data.processes,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Real-time telemetry data point
   */
  collectTelemetryPoint(processName, defects, units, opportunities, additionalMetrics = {}) {
    const processData = this.addProcessData(processName, defects, units, opportunities);
    
    return {
      ...processData,
      ...additionalMetrics,
      telemetryId: `sixsigma_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
}

module.exports = SixSigmaTelemetry;