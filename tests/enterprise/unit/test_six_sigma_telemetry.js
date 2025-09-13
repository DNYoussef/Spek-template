/**
 * Unit Tests for Six Sigma Telemetry Engine
 * 
 * Tests comprehensive Six Sigma calculations with real mathematical formulas
 */

const SixSigmaTelemetry = require('../../../src/telemetry/six-sigma.js');

describe('SixSigmaTelemetry', () => {
  let telemetry;

  beforeEach(() => {
    telemetry = new SixSigmaTelemetry();
  });

  describe('DPMO Calculations', () => {
    test('should calculate DPMO correctly with basic values', () => {
      // Test case: 5 defects, 100 units, 10 opportunities per unit
      const dpmo = telemetry.calculateDPMO(5, 100, 10);
      // Expected: (5 / (100 * 10)) * 1,000,000 = 5,000 DPMO
      expect(dpmo).toBe(5000);
    });

    test('should calculate DPMO with decimal precision', () => {
      // Test case: 3 defects, 500 units, 12 opportunities per unit
      const dpmo = telemetry.calculateDPMO(3, 500, 12);
      // Expected: (3 / (500 * 12)) * 1,000,000 = 500 DPMO
      expect(dpmo).toBe(500);
    });

    test('should handle zero defects', () => {
      const dpmo = telemetry.calculateDPMO(0, 1000, 5);
      expect(dpmo).toBe(0);
    });

    test('should throw error for zero units', () => {
      expect(() => {
        telemetry.calculateDPMO(5, 0, 10);
      }).toThrow('Units and opportunities must be greater than 0');
    });

    test('should throw error for zero opportunities', () => {
      expect(() => {
        telemetry.calculateDPMO(5, 100, 0);
      }).toThrow('Units and opportunities must be greater than 0');
    });

    test('should handle high defect scenarios', () => {
      // Test edge case with many defects
      const dpmo = telemetry.calculateDPMO(500, 1000, 1);
      // Expected: (500 / 1000) * 1,000,000 = 500,000 DPMO
      expect(dpmo).toBe(500000);
    });
  });

  describe('RTY (Rolled Throughput Yield) Calculations', () => {
    test('should calculate RTY correctly with multiple processes', () => {
      const processYields = [0.95, 0.98, 0.96, 0.99];
      const rty = telemetry.calculateRTY(processYields);
      // Expected: 0.95 * 0.98 * 0.96 * 0.99 = 0.8849
      expect(rty).toBeCloseTo(0.8849, 4);
    });

    test('should handle perfect yields', () => {
      const processYields = [1.0, 1.0, 1.0];
      const rty = telemetry.calculateRTY(processYields);
      expect(rty).toBe(1.0);
    });

    test('should handle single process', () => {
      const processYields = [0.85];
      const rty = telemetry.calculateRTY(processYields);
      expect(rty).toBe(0.85);
    });

    test('should throw error for empty array', () => {
      expect(() => {
        telemetry.calculateRTY([]);
      }).toThrow('Process yields must be a non-empty array');
    });

    test('should throw error for invalid yield values', () => {
      expect(() => {
        telemetry.calculateRTY([0.95, 1.2, 0.8]);
      }).toThrow('Yield values must be between 0 and 1');

      expect(() => {
        telemetry.calculateRTY([0.95, -0.1, 0.8]);
      }).toThrow('Yield values must be between 0 and 1');
    });

    test('should handle very low yields', () => {
      const processYields = [0.1, 0.2, 0.3];
      const rty = telemetry.calculateRTY(processYields);
      // Expected: 0.1 * 0.2 * 0.3 = 0.006
      expect(rty).toBeCloseTo(0.006, 4);
    });
  });

  describe('Sigma Level Calculations', () => {
    test('should calculate sigma level for perfect quality', () => {
      const sigmaLevel = telemetry.calculateSigmaLevel(0);
      expect(sigmaLevel).toBe(6);
    });

    test('should calculate sigma level for typical Six Sigma quality', () => {
      // 3.4 DPMO should yield ~6 sigma
      const sigmaLevel = telemetry.calculateSigmaLevel(3.4);
      expect(sigmaLevel).toBeGreaterThan(5.9);
      expect(sigmaLevel).toBeLessThanOrEqual(6.0);
    });

    test('should calculate sigma level for Four Sigma quality', () => {
      // ~6210 DPMO should yield ~4 sigma
      const sigmaLevel = telemetry.calculateSigmaLevel(6210);
      expect(sigmaLevel).toBeGreaterThan(3.8);
      expect(sigmaLevel).toBeLessThan(4.2);
    });

    test('should calculate sigma level for Three Sigma quality', () => {
      // ~66807 DPMO should yield ~3 sigma
      const sigmaLevel = telemetry.calculateSigmaLevel(66807);
      expect(sigmaLevel).toBeGreaterThan(2.8);
      expect(sigmaLevel).toBeLessThan(3.2);
    });

    test('should handle very poor quality', () => {
      const sigmaLevel = telemetry.calculateSigmaLevel(933193);
      expect(sigmaLevel).toBe(0);
    });
  });

  describe('Cpk (Process Capability) Calculations', () => {
    test('should calculate Cpk correctly for centered process', () => {
      // Mean = 10, std = 1, limits = 7 to 13
      const cpk = telemetry.calculateCpk(10, 1, 13, 7);
      // Cpk = min((13-10)/(3*1), (10-7)/(3*1)) = min(1, 1) = 1
      expect(cpk).toBe(1);
    });

    test('should calculate Cpk for off-center process', () => {
      // Mean = 11, std = 1, limits = 7 to 13
      const cpk = telemetry.calculateCpk(11, 1, 13, 7);
      // Cpk = min((13-11)/(3*1), (11-7)/(3*1)) = min(0.667, 1.333) = 0.667
      expect(cpk).toBeCloseTo(0.667, 3);
    });

    test('should handle very capable process', () => {
      // Mean = 10, std = 0.5, limits = 7 to 13
      const cpk = telemetry.calculateCpk(10, 0.5, 13, 7);
      // Cpk = min((13-10)/(3*0.5), (10-7)/(3*0.5)) = min(2, 2) = 2
      expect(cpk).toBe(2);
    });

    test('should throw error for zero standard deviation', () => {
      expect(() => {
        telemetry.calculateCpk(10, 0, 13, 7);
      }).toThrow('Standard deviation must be greater than 0');
    });

    test('should handle negative Cpk values', () => {
      // Process mean outside specification limits
      const cpk = telemetry.calculateCpk(5, 1, 13, 7);
      expect(cpk).toBeLessThan(0);
    });
  });

  describe('FTY (First Time Yield) Calculations', () => {
    test('should calculate FTY correctly with defects', () => {
      const fty = telemetry.calculateFTY(1000, 50);
      // (1000 - 50) / 1000 = 0.95
      expect(fty).toBe(0.95);
    });

    test('should calculate perfect FTY', () => {
      const fty = telemetry.calculateFTY(500, 0);
      expect(fty).toBe(1.0);
    });

    test('should handle all defects scenario', () => {
      const fty = telemetry.calculateFTY(100, 100);
      expect(fty).toBe(0);
    });

    test('should throw error for zero units', () => {
      expect(() => {
        telemetry.calculateFTY(0, 5);
      }).toThrow('Units must be greater than 0');
    });

    test('should handle more defects than units gracefully', () => {
      const fty = telemetry.calculateFTY(100, 150);
      expect(fty).toBe(0); // Minimum value enforced
    });
  });

  describe('Process Data Management', () => {
    test('should add process data correctly', () => {
      const processData = telemetry.addProcessData('Testing', 10, 1000, 5);
      
      expect(processData.name).toBe('Testing');
      expect(processData.defects).toBe(10);
      expect(processData.units).toBe(1000);
      expect(processData.opportunities).toBe(5);
      expect(processData.dpmo).toBe(2000); // (10 / (1000 * 5)) * 1,000,000
      expect(processData.fty).toBe(0.99); // (1000 - 10) / 1000
      expect(processData.sigmaLevel).toBeGreaterThan(0);
      expect(processData.timestamp).toBeDefined();
    });

    test('should track multiple processes', () => {
      telemetry.addProcessData('Process A', 5, 500, 3);
      telemetry.addProcessData('Process B', 2, 300, 4);
      
      expect(telemetry.data.processes).toHaveLength(2);
      expect(telemetry.data.processes[0].name).toBe('Process A');
      expect(telemetry.data.processes[1].name).toBe('Process B');
    });
  });

  describe('Comprehensive Reporting', () => {
    test('should generate empty report with no data', () => {
      const report = telemetry.generateReport();
      
      expect(report.error).toBe('No process data available');
      expect(report.processes).toHaveLength(0);
    });

    test('should generate comprehensive report with data', () => {
      // Add multiple processes
      telemetry.addProcessData('Development', 5, 1000, 4);
      telemetry.addProcessData('Testing', 3, 800, 6);
      telemetry.addProcessData('Deployment', 1, 200, 2);
      
      const report = telemetry.generateReport();
      
      expect(report.summary.totalProcesses).toBe(3);
      expect(report.summary.totalDefects).toBe(9);
      expect(report.summary.totalUnits).toBe(2000);
      expect(report.summary.totalOpportunities).toBe(12);
      expect(report.summary.overallDPMO).toBeGreaterThan(0);
      expect(report.summary.overallSigmaLevel).toBeGreaterThan(0);
      expect(report.summary.overallRTY).toBeGreaterThan(0);
      expect(report.summary.averageFTY).toBeGreaterThan(0);
      expect(report.processes).toHaveLength(3);
      expect(report.generatedAt).toBeDefined();
    });

    test('should calculate correct aggregated metrics', () => {
      telemetry.addProcessData('Process A', 10, 1000, 5); // DPMO = 2000
      telemetry.addProcessData('Process B', 5, 500, 4);   // DPMO = 2500
      
      const report = telemetry.generateReport();
      
      // Overall DPMO should be (15 / (1500 * 9)) * 1,000,000 = 1111.11
      expect(report.summary.overallDPMO).toBeCloseTo(1111, 0);
      
      // RTY should be product of individual FTYs
      const expectedRTY = 0.99 * 0.99; // Both processes have 99% FTY
      expect(report.summary.overallRTY).toBeCloseTo(expectedRTY, 4);
    });
  });

  describe('Real-time Telemetry', () => {
    test('should collect telemetry point with additional metrics', () => {
      const additionalMetrics = {
        environmentId: 'production',
        userId: 'admin',
        buildVersion: '1.2.3'
      };
      
      const telemetryPoint = telemetry.collectTelemetryPoint(
        'API Endpoint',
        2,
        500,
        3,
        additionalMetrics
      );
      
      expect(telemetryPoint.name).toBe('API Endpoint');
      expect(telemetryPoint.defects).toBe(2);
      expect(telemetryPoint.units).toBe(500);
      expect(telemetryPoint.opportunities).toBe(3);
      expect(telemetryPoint.environmentId).toBe('production');
      expect(telemetryPoint.userId).toBe('admin');
      expect(telemetryPoint.buildVersion).toBe('1.2.3');
      expect(telemetryPoint.telemetryId).toBeDefined();
      expect(telemetryPoint.telemetryId).toMatch(/^sixsigma_\d+_[a-z0-9]{9}$/);
    });

    test('should generate unique telemetry IDs', () => {
      const point1 = telemetry.collectTelemetryPoint('Test1', 1, 100, 1);
      const point2 = telemetry.collectTelemetryPoint('Test2', 1, 100, 1);
      
      expect(point1.telemetryId).not.toBe(point2.telemetryId);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle very large numbers', () => {
      const largeValue = 1000000;
      const dpmo = telemetry.calculateDPMO(largeValue, largeValue, 1);
      expect(dpmo).toBe(1000000); // 100% defect rate
    });

    test('should handle very small numbers', () => {
      const dpmo = telemetry.calculateDPMO(1, 1000000, 1);
      expect(dpmo).toBe(1); // Very low defect rate
    });

    test('should maintain precision with floating point calculations', () => {
      // Test precise calculations that might suffer from floating point errors
      const rty = telemetry.calculateRTY([0.999999, 0.999999, 0.999999]);
      expect(rty).toBeCloseTo(0.999997, 6);
    });

    test('should handle extreme sigma calculations', () => {
      // Test with very high and very low DPMO values
      expect(telemetry.calculateSigmaLevel(1)).toBeGreaterThan(4);
      expect(telemetry.calculateSigmaLevel(1000000)).toBeLessThan(1);
    });
  });

  describe('Data Validation and Error Handling', () => {
    test('should validate input types in calculateDPMO', () => {
      expect(() => {
        telemetry.calculateDPMO('5', 100, 10);
      }).not.toThrow(); // Should handle string numbers
      
      expect(() => {
        telemetry.calculateDPMO(5, '100', 10);
      }).not.toThrow(); // Should handle string numbers
    });

    test('should handle NaN and Infinity gracefully', () => {
      // These should not crash the system
      const cpk = telemetry.calculateCpk(NaN, 1, 10, 0);
      expect(isNaN(cpk)).toBe(true);
    });

    test('should validate process data inputs', () => {
      expect(() => {
        telemetry.addProcessData('', 10, 100, 5);
      }).not.toThrow(); // Empty process name should be allowed
      
      expect(() => {
        telemetry.addProcessData('Valid Process', -1, 100, 5);
      }).not.toThrow(); // Negative defects might be input error but shouldn't crash
    });
  });

  describe('Performance and Memory', () => {
    test('should handle large datasets efficiently', () => {
      const start = Date.now();
      
      // Add many process data points
      for (let i = 0; i < 1000; i++) {
        telemetry.addProcessData(`Process${i}`, i % 10, 1000, 5);
      }
      
      const report = telemetry.generateReport();
      const duration = Date.now() - start;
      
      expect(report.summary.totalProcesses).toBe(1000);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should not leak memory with repeated operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many calculations
      for (let i = 0; i < 10000; i++) {
        telemetry.calculateDPMO(i % 100, 1000, 5);
        telemetry.calculateRTY([0.95, 0.98, 0.96]);
        telemetry.calculateSigmaLevel(i * 10);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});