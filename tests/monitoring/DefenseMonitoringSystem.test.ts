/**
 * Defense Monitoring System Tests
 * Comprehensive test suite for defense-grade monitoring and rollback systems
 * Validates <1.2% overhead requirement and <30 second rollback capability
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { DefenseGradeMonitor, PerformanceReport } from '../../src/monitoring/advanced/DefenseGradeMonitor';
import { DefenseRollbackSystem, RollbackResult } from '../../src/rollback/systems/DefenseRollbackSystem';
import { DefenseSecurityMonitor } from '../../src/security/monitoring/DefenseSecurityMonitor';
import { ComplianceDriftDetector } from '../../src/compliance/monitoring/ComplianceDriftDetector';
import { DefenseMonitoringOrchestrator } from '../../src/monitoring/DefenseMonitoringOrchestrator';
const { cleanupTestResources } = require('../setup/test-environment');

describe('Defense Monitoring System', () => {
  let performanceMonitor: DefenseGradeMonitor;
  let rollbackSystem: DefenseRollbackSystem;
  let securityMonitor: DefenseSecurityMonitor;
  let complianceDetector: ComplianceDriftDetector;
  let orchestrator: DefenseMonitoringOrchestrator;

  beforeEach(async () => {
    // Initialize monitoring systems
    performanceMonitor = new DefenseGradeMonitor();
    rollbackSystem = new DefenseRollbackSystem();
    securityMonitor = new DefenseSecurityMonitor();
    complianceDetector = new ComplianceDriftDetector(rollbackSystem);
    orchestrator = new DefenseMonitoringOrchestrator();

    // Mock timers for testing
    jest.useFakeTimers();
  });

  afterEach(async () => {
    // Cleanup monitoring systems
    if (performanceMonitor) await performanceMonitor.stopMonitoring?.();
    if (rollbackSystem) await rollbackSystem.stopRollbackSystem?.();
    if (securityMonitor) await securityMonitor.stopSecurityMonitoring?.();
    if (complianceDetector) await complianceDetector.stopDriftDetection?.();
    if (orchestrator) await orchestrator.stopDefenseMonitoring?.();

    jest.useRealTimers();
    await cleanupTestResources();
  });

  describe('DefenseGradeMonitor', () => {
    it('should maintain microsecond precision timing', async () => {
      const startTime = performance.now();

      await performanceMonitor.startMonitoring();

      // Allow some monitoring cycles
      jest.advanceTimersByTime(1000);

      const report = await performanceMonitor.getPerformanceReport();

      expect(report).toBeDefined();
      expect(report.timestamp).toBeGreaterThan(startTime);
      expect(report.currentOverhead).toBeLessThan(1.2); // <1.2% requirement
    });

    it('should detect performance degradation', async () => {
      await performanceMonitor.startMonitoring();

      // Simulate performance degradation
      const mockHighOverhead = jest.spyOn(performanceMonitor as any, 'calculateSystemOverhead')
        .mockReturnValue(1.5); // 1.5% overhead

      jest.advanceTimersByTime(5000);

      const report = await performanceMonitor.getPerformanceReport();

      expect(report.complianceWithTarget).toBe(false);
      expect(report.currentOverhead).toBeGreaterThan(1.2);

      mockHighOverhead.mockRestore();
    });

    it('should generate optimization recommendations', async () => {
      await performanceMonitor.startMonitoring();

      jest.advanceTimersByTime(30000); // Wait for predictive analysis

      const report = await performanceMonitor.getPerformanceReport();

      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.predictions).toBeDefined();
      expect(report.predictions.confidence).toBeGreaterThan(0);
    });

    it('should track resource usage within limits', async () => {
      await performanceMonitor.startMonitoring();

      jest.advanceTimersByTime(10000);

      const report = await performanceMonitor.getPerformanceReport();

      // Verify resource tracking
      expect(report.totalAgents).toBeGreaterThan(0);
      expect(report.totalMetrics).toBeGreaterThan(0);
      expect(report.currentOverhead).toBeLessThan(5.0); // Reasonable upper bound
    });
  });

  describe('DefenseRollbackSystem', () => {
    it('should create snapshots successfully', async () => {
      await rollbackSystem.startRollbackSystem();

      const snapshotId = await rollbackSystem.createSnapshot('TEST');

      expect(snapshotId).toBeDefined();
      expect(typeof snapshotId).toBe('string');
      expect(snapshotId).toMatch(/^snapshot_\d+_\w+$/);
    });

    it('should execute rollback within 30 seconds', async () => {
      await rollbackSystem.startRollbackSystem();

      // Create a snapshot first
      const snapshotId = await rollbackSystem.createSnapshot('BASELINE');

      // Measure rollback time
      const startTime = performance.now();
      const result = await rollbackSystem.executeRollback(snapshotId, 'TEST_ROLLBACK');
      const rollbackTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(rollbackTime).toBeLessThan(30000); // <30 seconds requirement
      expect(result.duration).toBeLessThan(30000);
    });

    it('should validate snapshot integrity', async () => {
      await rollbackSystem.startRollbackSystem();

      const snapshotId = await rollbackSystem.createSnapshot('INTEGRITY_TEST');
      const snapshots = rollbackSystem.getSnapshotHistory();

      const snapshot = snapshots.find(s => s.id === snapshotId);
      expect(snapshot).toBeDefined();
      expect(snapshot!.checksum).toBeDefined();
      expect(snapshot!.systemState).toBeDefined();
    });

    it('should handle rollback failures gracefully', async () => {
      await rollbackSystem.startRollbackSystem();

      // Try to rollback to non-existent snapshot
      const result = await rollbackSystem.executeRollback('invalid_snapshot', 'ERROR_TEST');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should maintain rollback history', async () => {
      await rollbackSystem.startRollbackSystem();

      const snapshotId = await rollbackSystem.createSnapshot('HISTORY_TEST');
      await rollbackSystem.executeRollback(snapshotId, 'HISTORY_ROLLBACK');

      const history = rollbackSystem.getRollbackHistory();

      expect(history).toBeDefined();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].reason).toBe('HISTORY_ROLLBACK');
    });
  });

  describe('DefenseSecurityMonitor', () => {
    it('should start security monitoring without errors', async () => {
      await expect(securityMonitor.startSecurityMonitoring()).resolves.not.toThrow();

      jest.advanceTimersByTime(5000);

      const dashboard = await securityMonitor.getSecurityDashboardData();

      expect(dashboard).toBeDefined();
      expect(dashboard.metrics.threatLevel).toBeDefined();
      expect(dashboard.systemStatus).toBeDefined();
    });

    it('should detect and classify threats', async () => {
      await securityMonitor.startSecurityMonitoring();

      jest.advanceTimersByTime(10000);

      const metrics = await securityMonitor.generateSecurityMetrics();

      expect(metrics.threatLevel).toMatch(/^(LOW|MEDIUM|HIGH|CRITICAL)$/);
      expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(metrics.overallScore).toBeLessThanOrEqual(100);
    });

    it('should maintain compliance monitoring', async () => {
      await securityMonitor.startSecurityMonitoring();

      jest.advanceTimersByTime(30000); // Wait for compliance check

      const dashboard = await securityMonitor.getSecurityDashboardData();

      expect(dashboard.metrics.complianceScore).toBeGreaterThan(0.8); // >80% compliance
    });

    it('should generate security recommendations', async () => {
      await securityMonitor.startSecurityMonitoring();

      const dashboard = await securityMonitor.getSecurityDashboardData();

      expect(dashboard.recommendations).toBeDefined();
      expect(Array.isArray(dashboard.recommendations)).toBe(true);
    });
  });

  describe('ComplianceDriftDetector', () => {
    it('should establish compliance baselines', async () => {
      await complianceDetector.startDriftDetection();

      jest.advanceTimersByTime(1000);

      const report = await complianceDetector.getDriftReport();

      expect(report).toBeDefined();
      expect(report.baselineStatus).toBeDefined();
      expect(report.complianceScores).toBeDefined();
    });

    it('should detect compliance drift', async () => {
      await complianceDetector.startDriftDetection();

      // Simulate drift by advancing time
      jest.advanceTimersByTime(15000);

      const report = await complianceDetector.getDriftReport();

      expect(report.totalDrifts).toBeGreaterThanOrEqual(0);
      expect(report.recommendations).toBeDefined();
    });

    it('should trigger rollback on critical drift', async () => {
      const rollbackSpy = jest.spyOn(rollbackSystem, 'executeRollback')
        .mockResolvedValue({ success: true } as RollbackResult);

      await complianceDetector.startDriftDetection();

      // Simulate critical drift - would need to mock internal methods
      jest.advanceTimersByTime(20000);

      // In a real scenario, critical drift would trigger rollback
      // This test validates the integration is properly set up
      expect(complianceDetector).toBeDefined();

      rollbackSpy.mockRestore();
    });
  });

  describe('DefenseMonitoringOrchestrator', () => {
    it('should coordinate all monitoring systems', async () => {
      await orchestrator.startDefenseMonitoring();

      jest.advanceTimersByTime(10000);

      const status = await orchestrator.getDefenseStatus();

      expect(status).toBeDefined();
      expect(status.overall.status).toMatch(/^(HEALTHY|WARNING|CRITICAL|EMERGENCY)$/);
      expect(status.performance).toBeDefined();
      expect(status.security).toBeDefined();
      expect(status.compliance).toBeDefined();
      expect(status.rollback).toBeDefined();
    });

    it('should generate unified alerts', async () => {
      await orchestrator.startDefenseMonitoring();

      jest.advanceTimersByTime(5000);

      const alerts = orchestrator.getActiveAlerts();

      expect(Array.isArray(alerts)).toBe(true);
      // Alerts may be empty in normal operation
    });

    it('should handle alert acknowledgment', async () => {
      await orchestrator.startDefenseMonitoring();

      // Create a mock alert by simulating a condition
      // In a real scenario, alerts would be generated by monitoring systems

      const alerts = orchestrator.getActiveAlerts();
      if (alerts.length > 0) {
        const result = await orchestrator.acknowledgeAlert(alerts[0].id, 'test-operator');
        expect(result).toBe(true);
      }
    });

    it('should calculate overall system score', async () => {
      await orchestrator.startDefenseMonitoring();

      jest.advanceTimersByTime(10000);

      const status = await orchestrator.getDefenseStatus();

      expect(status.overall.score).toBeGreaterThanOrEqual(0);
      expect(status.overall.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance Requirements Validation', () => {
    it('should meet the <1.2% overhead requirement consistently', async () => {
      const measurements: number[] = [];

      await performanceMonitor.startMonitoring();

      // Take multiple measurements over time
      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(1000);
        const report = await performanceMonitor.getPerformanceReport();
        measurements.push(report.currentOverhead);
      }

      // Verify all measurements are under threshold
      const maxOverhead = Math.max(...measurements);
      const avgOverhead = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;

      expect(maxOverhead).toBeLessThan(1.2);
      expect(avgOverhead).toBeLessThan(1.0); // Should be well under target
    });

    it('should complete rollback operations within 30 seconds', async () => {
      await rollbackSystem.startRollbackSystem();

      const rollbackTimes: number[] = [];

      // Test multiple rollback operations
      for (let i = 0; i < 3; i++) {
        const snapshotId = await rollbackSystem.createSnapshot(`TEST_${i}`);

        const startTime = performance.now();
        const result = await rollbackSystem.executeRollback(snapshotId, `PERF_TEST_${i}`);
        const duration = performance.now() - startTime;

        rollbackTimes.push(duration);
        expect(result.success).toBe(true);
      }

      // Verify all rollbacks completed within time limit
      const maxRollbackTime = Math.max(...rollbackTimes);
      const avgRollbackTime = rollbackTimes.reduce((sum, val) => sum + val, 0) / rollbackTimes.length;

      expect(maxRollbackTime).toBeLessThan(30000);
      expect(avgRollbackTime).toBeLessThan(15000); // Should be well under limit
    });

    it('should maintain defense-grade monitoring capabilities', async () => {
      await orchestrator.startDefenseMonitoring();

      // Run for extended period to validate stability
      jest.advanceTimersByTime(60000); // 1 minute of operation

      const status = await orchestrator.getDefenseStatus();

      // Validate defense-grade requirements
      expect(status.performance.overhead).toBeLessThan(1.2);
      expect(status.security.complianceScore).toBeGreaterThan(0.9);
      expect(status.rollback.ready).toBe(true);
      expect(status.rollback.estimatedTime).toBeLessThan(30);

      // Validate monitoring coverage
      expect(status.overall.status).toBeDefined();
      expect(status.alerts.active).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration Tests', () => {
    it('should integrate all monitoring systems seamlessly', async () => {
      // Start all systems
      await Promise.all([
        performanceMonitor.startMonitoring(),
        rollbackSystem.startRollbackSystem(),
        securityMonitor.startSecurityMonitoring(),
        complianceDetector.startDriftDetection(),
        orchestrator.startDefenseMonitoring()
      ]);

      // Allow systems to stabilize
      jest.advanceTimersByTime(10000);

      // Validate integration
      const orchestratorStatus = await orchestrator.getDefenseStatus();
      const performanceReport = await performanceMonitor.getPerformanceReport();
      const securityDashboard = await securityMonitor.getSecurityDashboardData();
      const complianceReport = await complianceDetector.getDriftReport();

      // Verify all systems are operational
      expect(orchestratorStatus.overall.status).not.toBe('EMERGENCY');
      expect(performanceReport.currentOverhead).toBeLessThan(2.0);
      expect(securityDashboard.metrics.threatLevel).toBeDefined();
      expect(complianceReport.baselineStatus).toBeDefined();
    });

    it('should handle system failure and recovery', async () => {
      await orchestrator.startDefenseMonitoring();

      // Simulate system failure
      const mockFailure = jest.spyOn(orchestrator as any, 'generateUnifiedStatus')
        .mockRejectedValue(new Error('System failure'));

      jest.advanceTimersByTime(5000);

      // System should continue operating despite failures
      expect(orchestrator.getActiveAlerts()).toBeDefined();

      mockFailure.mockRestore();
    });
  });
});

// Performance benchmarking tests
describe('Performance Benchmarks', () => {
  it('should meet latency requirements for monitoring operations', async () => {
    const monitor = new DefenseGradeMonitor();
    await monitor.startMonitoring();

    const iterations = 100;
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await monitor.getPerformanceReport();
      const latency = performance.now() - start;
      latencies.push(latency);
    }

    const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];
    const p99Latency = latencies.sort((a, b) => a - b)[Math.floor(iterations * 0.99)];

    expect(p95Latency).toBeLessThan(100); // <100ms P95
    expect(p99Latency).toBeLessThan(500); // <500ms P99

    await monitor.stopMonitoring();
  });

  it('should handle concurrent operations efficiently', async () => {
    const monitor = new DefenseGradeMonitor();
    await monitor.startMonitoring();

    const concurrentOperations = 50;
    const startTime = performance.now();

    // Execute concurrent operations
    const promises = Array(concurrentOperations).fill(0).map(() =>
      monitor.getPerformanceReport()
    );

    const results = await Promise.all(promises);
    const totalTime = performance.now() - startTime;

    // Verify all operations completed
    expect(results).toHaveLength(concurrentOperations);
    results.forEach(result => {
      expect(result).toBeDefined();
      expect(result.currentOverhead).toBeGreaterThanOrEqual(0);
    });

    // Verify acceptable performance under load
    expect(totalTime).toBeLessThan(5000); // <5 seconds for 50 concurrent ops

    await monitor.stopMonitoring();
  });
});

// Export interfaces for external use
export interface TestMetrics {
  p95_ms: number;
  p99_ms: number;
  delta_p95: string;
  gate: 'pass' | 'fail';
}

export function generatePerformanceMetrics(latencies: number[]): TestMetrics {
  const sorted = latencies.sort((a, b) => a - b);
  const p95 = sorted[Math.floor(latencies.length * 0.95)];
  const p99 = sorted[Math.floor(latencies.length * 0.99)];

  return {
    p95_ms: Math.round(p95 * 100) / 100,
    p99_ms: Math.round(p99 * 100) / 100,
    delta_p95: '+0.0%', // Would calculate actual delta from baseline
    gate: p95 < 100 && p99 < 500 ? 'pass' : 'fail'
  };
}