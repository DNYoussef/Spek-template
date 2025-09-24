/**
 * Unit Tests for Six Sigma Telemetry Engine
 * Tests all mathematical calculations and functionality
 */

const SixSigmaTelemetry = require('../src/telemetry/six-sigma');
const { cleanupTestResources } = require('./setup/test-environment');

describe('SixSigmaTelemetry', () => {
  let telemetry;

  beforeEach(() => {
    telemetry = new SixSigmaTelemetry();
  });

  afterEach(async () => {
    await cleanupTestResources();
  });

  describe('DPMO Calculations', () => {
    test('should calculate DPMO correctly', () => {
      const dpmo = telemetry.calculateDPMO(5, 100, 3);
      expect(dpmo).toBe(16667); // (5 / (100 * 3)) * 1,000,000
    });

    test('should handle zero defects', () => {
      const dpmo = telemetry.calculateDPMO(0, 100, 3);
      expect(dpmo).toBe(0);
    });

    test('should throw error for zero units', () => {
      expect(() => telemetry.calculateDPMO(5, 0, 3)).toThrow('Units and opportunities must be greater than 0');
    });

    test('should throw error for zero opportunities', () => {
      expect(() => telemetry.calculateDPMO(5, 100, 0)).toThrow('Units and opportunities must be greater than 0');
    });

    test('should round DPMO to nearest integer', () => {
      const dpmo = telemetry.calculateDPMO(1, 300, 1);
      expect(dpmo).toBe(3333); // 3333.333... rounded
    });
  });

  describe('RTY Calculations', () => {
    test('should calculate RTY correctly for multiple processes', () => {
      const rty = telemetry.calculateRTY([0.95, 0.98, 0.92]);
      expect(rty).toBe(0.8573); // 0.95 * 0.98 * 0.92 = 0.857364, rounded to 4 decimals
    });

    test('should handle single process', () => {
      const rty = telemetry.calculateRTY([0.95]);
      expect(rty).toBe(0.95);
    });

    test('should throw error for empty array', () => {
      expect(() => telemetry.calculateRTY([])).toThrow('Process yields must be a non-empty array');
    });

    test('should throw error for non-array input', () => {
      expect(() => telemetry.calculateRTY(0.95)).toThrow('Process yields must be a non-empty array');
    });

    test('should throw error for invalid yield values', () => {
      expect(() => telemetry.calculateRTY([0.95, 1.5])).toThrow('Yield values must be between 0 and 1');
      expect(() => telemetry.calculateRTY([0.95, -0.1])).toThrow('Yield values must be between 0 and 1');
    });
  });

  describe('Sigma Level Calculations', () => {
    test('should calculate sigma level from DPMO', () => {
      const sigma = telemetry.calculateSigmaLevel(233);
      expect(sigma).toBeGreaterThan(4.5);
      expect(sigma).toBeLessThan(5.0);
    });

    test('should return 6 for zero DPMO (perfect quality)', () => {
      const sigma = telemetry.calculateSigmaLevel(0);
      expect(sigma).toBe(6);
    });

    test('should handle very high DPMO', () => {
      const sigma = telemetry.calculateSigmaLevel(933193);
      expect(sigma).toBe(0);
    });

    test('should handle negative DPMO', () => {
      const sigma = telemetry.calculateSigmaLevel(-100);
      expect(sigma).toBe(6);
    });
  });

  describe('Cpk Calculations', () => {
    test('should calculate Cpk correctly', () => {
      const cpk = telemetry.calculateCpk(50, 5, 65, 35);
      expect(cpk).toBe(1); // min((65-50)/(3*5), (50-35)/(3*5)) = min(1, 1) = 1
    });

    test('should return lower Cpk when process is off-center', () => {
      const cpk = telemetry.calculateCpk(55, 5, 65, 35);
      expect(cpk).toBe(0.667); // min((65-55)/(3*5), (55-35)/(3*5)) = min(0.667, 1.333) = 0.667
    });

    test('should throw error for zero or negative standard deviation', () => {
      expect(() => telemetry.calculateCpk(50, 0, 65, 35)).toThrow('Standard deviation must be greater than 0');
      expect(() => telemetry.calculateCpk(50, -1, 65, 35)).toThrow('Standard deviation must be greater than 0');
    });
  });

  describe('FTY Calculations', () => {
    test('should calculate FTY correctly', () => {
      const fty = telemetry.calculateFTY(100, 5);
      expect(fty).toBe(0.95);
    });

    test('should handle zero defects', () => {
      const fty = telemetry.calculateFTY(100, 0);
      expect(fty).toBe(1);
    });

    test('should handle all units defective', () => {
      const fty = telemetry.calculateFTY(100, 100);
      expect(fty).toBe(0);
    });

    test('should not go below zero', () => {
      const fty = telemetry.calculateFTY(100, 150);
      expect(fty).toBe(0);
    });

    test('should throw error for zero units', () => {
      expect(() => telemetry.calculateFTY(0, 5)).toThrow('Units must be greater than 0');
    });
  });

  describe('Process Data Management', () => {
    test('should add process data correctly', () => {
      const processData = telemetry.addProcessData('Assembly', 3, 100, 2);
      
      expect(processData.name).toBe('Assembly');
      expect(processData.defects).toBe(3);
      expect(processData.units).toBe(100);
      expect(processData.opportunities).toBe(2);
      expect(processData.dpmo).toBe(15000);
      expect(processData.sigmaLevel).toBeGreaterThan(3);
      expect(processData.fty).toBe(0.97);
      expect(processData.timestamp).toBeDefined();
    });

    test('should store multiple processes', () => {
      telemetry.addProcessData('Process A', 2, 100, 1);
      telemetry.addProcessData('Process B', 1, 50, 2);
      
      expect(telemetry.data.processes.length).toBe(2);
    });
  });

  describe('Report Generation', () => {
    test('should generate empty report when no data', () => {
      const report = telemetry.generateReport();
      
      expect(report.error).toBe('No process data available');
      expect(report.processes).toEqual([]);
    });

    test('should generate comprehensive report with data', () => {
      telemetry.addProcessData('Process A', 2, 100, 1);
      telemetry.addProcessData('Process B', 1, 50, 2);
      
      const report = telemetry.generateReport();
      
      expect(report.summary.totalProcesses).toBe(2);
      expect(report.summary.totalDefects).toBe(3);
      expect(report.summary.totalUnits).toBe(150);
      expect(report.summary.totalOpportunities).toBe(3);
      expect(report.summary.overallDPMO).toBe(20000);
      expect(report.summary.overallSigmaLevel).toBeGreaterThan(3);
      expect(report.summary.overallRTY).toBeLessThan(1);
      expect(report.processes.length).toBe(2);
      expect(report.generatedAt).toBeDefined();
    });
  });

  describe('Telemetry Point Collection', () => {
    test('should collect telemetry point with additional metrics', () => {
      const point = telemetry.collectTelemetryPoint('Test Process', 1, 100, 1, {
        operator: 'John Doe',
        shift: 'Day',
        temperature: 72
      });
      
      expect(point.name).toBe('Test Process');
      expect(point.operator).toBe('John Doe');
      expect(point.shift).toBe('Day');
      expect(point.temperature).toBe(72);
      expect(point.telemetryId).toBeDefined();
      expect(point.telemetryId).toMatch(/^sixsigma_\d+_[a-z0-9]+$/);
    });
  });

  describe('Real World Scenarios', () => {
    test('should handle manufacturing process with realistic data', () => {
      // Simulate a week of manufacturing data
      const processes = [
        { name: 'Welding', defects: 2, units: 500, opportunities: 4 },
        { name: 'Painting', defects: 1, units: 500, opportunities: 3 },
        { name: 'Assembly', defects: 3, units: 500, opportunities: 5 },
        { name: 'Testing', defects: 0, units: 500, opportunities: 2 },
        { name: 'Packaging', defects: 1, units: 500, opportunities: 1 }
      ];

      processes.forEach(p => telemetry.addProcessData(p.name, p.defects, p.units, p.opportunities));
      
      const report = telemetry.generateReport();
      
      expect(report.summary.totalProcesses).toBe(5);
      expect(report.summary.totalDefects).toBe(7);
      expect(report.summary.totalUnits).toBe(2500);
      expect(report.summary.overallSigmaLevel).toBeGreaterThan(4);
      expect(report.summary.overallRTY).toBeGreaterThan(0.9);
    });

    test('should handle service process with quality metrics', () => {
      // Customer service process
      telemetry.addProcessData('Call Handling', 5, 1000, 1); // 5 dropped calls out of 1000
      telemetry.addProcessData('Issue Resolution', 15, 800, 1); // 15 unresolved issues out of 800
      
      const report = telemetry.generateReport();
      
      expect(report.summary.overallDPMO).toBeGreaterThan(0);
      expect(report.summary.overallSigmaLevel).toBeGreaterThan(3);
    });
  });
});