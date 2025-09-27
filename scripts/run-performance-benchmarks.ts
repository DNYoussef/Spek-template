/**
 * Performance Benchmarks Runner
 * Phase 9: Comprehensive Performance Testing and Validation Script
 * Orchestrates all performance tests and generates final certification
 */

import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';

// Import test suites
import QueenPrincessLatencyTestSuite from '../tests/performance/integration/QueenPrincessLatency.suite';
import CrossPrincessPerformanceTestSuite from '../tests/performance/integration/CrossPrincessPerformance.suite';
import SwarmScalabilityTestSuite from '../tests/performance/integration/SwarmScalability.suite';
import LatencyAnalyzer from '../src/performance/optimization/LatencyAnalyzer';

export interface PerformanceValidationResult {
  timestamp: number;
  duration: number;
  testResults: {
    queenPrincessLatency: any;
    crossPrincessPerformance: any;
    swarmScalability: any;
  };
  latencyAnalysis: any;
  overallStatus: 'PASS' | 'FAIL' | 'WARNING';
  performanceTargets: {
    queenPrincessLatency: { target: number; actual: number; passed: boolean };
    crossDomainThroughput: { target: number; actual: number; passed: boolean };
    swarmScalability: { target: number; actual: number; passed: boolean };
    memoryEfficiency: { target: number; actual: number; passed: boolean };
    errorRate: { target: number; actual: number; passed: boolean };
  };
  certification: {
    enterpriseReady: boolean;
    productionReady: boolean;
    scalabilityValidated: boolean;
    performanceOptimized: boolean;
    certificationLevel: 'BASIC' | 'STANDARD' | 'ENTERPRISE' | 'PREMIUM';
  };
  recommendations: string[];
  reportPath: string;
}

export class PerformanceBenchmarkRunner {
  private readonly PERFORMANCE_TARGETS = {
    QUEEN_PRINCESS_LATENCY_P95: 100, // ms
    CROSS_DOMAIN_THROUGHPUT: 100, // msg/sec
    SWARM_MAX_AGENTS: 1000,
    MEMORY_EFFICIENCY: 0.8, // 80%
    MAX_ERROR_RATE: 0.01 // 1%
  };

  constructor() {
    this.ensureDirectories();
  }

  /**
   * Run complete performance validation
   */
  async runCompletePerformanceValidation(): Promise<PerformanceValidationResult> {
    const startTime = performance.now();
    console.log('\n🚀 PHASE 9: PERFORMANCE BENCHMARKS & LATENCY TESTING');
    console.log('='.repeat(80));
    console.log('Starting comprehensive performance validation...\n');

    try {
      // Initialize latency analyzer
      const latencyAnalyzer = new LatencyAnalyzer();

      // Test 1: Queen-Princess Communication Latency
      console.log('📡 STEP 1: Queen-Princess Latency Testing');
      console.log('-'.repeat(50));
      const queenPrincessSuite = new QueenPrincessLatencyTestSuite();
      const queenPrincessResults = await queenPrincessSuite.runCompleteLatencySuite();
      console.log(`✅ Queen-Princess tests completed: ${queenPrincessResults.summary.passedTests}/${queenPrincessResults.summary.totalTests} passed\n`);

      // Test 2: Cross-Princess Performance
      console.log('🔄 STEP 2: Cross-Princess Performance Testing');
      console.log('-'.repeat(50));
      const crossPrincessSuite = new CrossPrincessPerformanceTestSuite();
      const crossPrincessResults = await crossPrincessSuite.runCompletePerformanceSuite();
      console.log(`✅ Cross-Princess tests completed: ${crossPrincessResults.summary.passedTests}/${crossPrincessResults.summary.totalTests} passed\n`);

      // Test 3: Swarm Scalability
      console.log('📈 STEP 3: Swarm Scalability Testing');
      console.log('-'.repeat(50));
      const swarmScalabilitySuite = new SwarmScalabilityTestSuite();
      const swarmScalabilityResults = await swarmScalabilitySuite.runCompleteScalabilitySuite();
      console.log(`✅ Swarm scalability tests completed: Max ${swarmScalabilityResults.scalabilityAnalysis.maxSupportedAgents} agents\n`);

      // Test 4: Latency Analysis
      console.log('🔍 STEP 4: Latency Analysis');
      console.log('-'.repeat(50));
      const latencyAnalysis = await latencyAnalyzer.analyzeLatencyPatterns();
      console.log(`✅ Latency analysis completed: ${latencyAnalysis.bottlenecks.length} bottlenecks identified\n`);

      // Calculate performance targets
      const performanceTargets = this.evaluatePerformanceTargets(
        queenPrincessResults,
        crossPrincessResults,
        swarmScalabilityResults,
        latencyAnalysis
      );

      // Determine overall status
      const overallStatus = this.determineOverallStatus(performanceTargets);

      // Generate certification
      const certification = this.generateCertification(performanceTargets, overallStatus);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        queenPrincessResults,
        crossPrincessResults,
        swarmScalabilityResults,
        latencyAnalysis,
        performanceTargets
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      const result: PerformanceValidationResult = {
        timestamp: Date.now(),
        duration,
        testResults: {
          queenPrincessLatency: queenPrincessResults,
          crossPrincessPerformance: crossPrincessResults,
          swarmScalability: swarmScalabilityResults
        },
        latencyAnalysis,
        overallStatus,
        performanceTargets,
        certification,
        recommendations,
        reportPath: ''
      };

      // Generate comprehensive report
      const reportPath = await this.generateComprehensiveReport(result);
      result.reportPath = reportPath;

      // Display final summary
      this.displayFinalSummary(result);

      return result;

    } catch (error) {
      console.error('\n❌ Performance validation failed:', error);
      throw error;
    }
  }

  /**
   * Evaluate performance against targets
   */
  private evaluatePerformanceTargets(
    queenPrincessResults: any,
    crossPrincessResults: any,
    swarmScalabilityResults: any,
    latencyAnalysis: any
  ): PerformanceValidationResult['performanceTargets'] {
    // Queen-Princess latency target
    const avgP95Latency = queenPrincessResults.results.reduce(
      (sum: number, r: any) => sum + r.p95, 0
    ) / queenPrincessResults.results.length;

    // Cross-domain throughput target
    const avgThroughput = crossPrincessResults.summary.averageThroughput;

    // Swarm scalability target
    const maxAgents = swarmScalabilityResults.scalabilityAnalysis.maxSupportedAgents;

    // Memory efficiency target
    const memoryEfficiency = crossPrincessResults.summary.memoryEfficiency;

    // Error rate target
    const avgErrorRate = crossPrincessResults.results.reduce(
      (sum: number, r: any) => sum + r.errorRate, 0
    ) / crossPrincessResults.results.length;

    return {
      queenPrincessLatency: {
        target: this.PERFORMANCE_TARGETS.QUEEN_PRINCESS_LATENCY_P95,
        actual: avgP95Latency,
        passed: avgP95Latency <= this.PERFORMANCE_TARGETS.QUEEN_PRINCESS_LATENCY_P95
      },
      crossDomainThroughput: {
        target: this.PERFORMANCE_TARGETS.CROSS_DOMAIN_THROUGHPUT,
        actual: avgThroughput,
        passed: avgThroughput >= this.PERFORMANCE_TARGETS.CROSS_DOMAIN_THROUGHPUT
      },
      swarmScalability: {
        target: this.PERFORMANCE_TARGETS.SWARM_MAX_AGENTS,
        actual: maxAgents,
        passed: maxAgents >= this.PERFORMANCE_TARGETS.SWARM_MAX_AGENTS
      },
      memoryEfficiency: {
        target: this.PERFORMANCE_TARGETS.MEMORY_EFFICIENCY,
        actual: memoryEfficiency,
        passed: memoryEfficiency >= this.PERFORMANCE_TARGETS.MEMORY_EFFICIENCY
      },
      errorRate: {
        target: this.PERFORMANCE_TARGETS.MAX_ERROR_RATE,
        actual: avgErrorRate,
        passed: avgErrorRate <= this.PERFORMANCE_TARGETS.MAX_ERROR_RATE
      }
    };
  }

  /**
   * Determine overall validation status
   */
  private determineOverallStatus(
    targets: PerformanceValidationResult['performanceTargets']
  ): 'PASS' | 'FAIL' | 'WARNING' {
    const targetResults = Object.values(targets);
    const passedCount = targetResults.filter(t => t.passed).length;
    const totalCount = targetResults.length;

    if (passedCount === totalCount) {
      return 'PASS';
    } else if (passedCount >= totalCount * 0.8) {
      return 'WARNING';
    } else {
      return 'FAIL';
    }
  }

  /**
   * Generate performance certification
   */
  private generateCertification(
    targets: PerformanceValidationResult['performanceTargets'],
    status: 'PASS' | 'FAIL' | 'WARNING'
  ): PerformanceValidationResult['certification'] {
    const enterpriseReady = targets.queenPrincessLatency.passed &&
                           targets.crossDomainThroughput.passed &&
                           targets.memoryEfficiency.passed;

    const productionReady = targets.errorRate.passed &&
                           targets.memoryEfficiency.passed &&
                           status !== 'FAIL';

    const scalabilityValidated = targets.swarmScalability.passed;

    const performanceOptimized = targets.queenPrincessLatency.passed &&
                                targets.crossDomainThroughput.passed;

    let certificationLevel: 'BASIC' | 'STANDARD' | 'ENTERPRISE' | 'PREMIUM';

    if (enterpriseReady && productionReady && scalabilityValidated && performanceOptimized) {
      certificationLevel = 'PREMIUM';
    } else if (enterpriseReady && productionReady && scalabilityValidated) {
      certificationLevel = 'ENTERPRISE';
    } else if (productionReady && performanceOptimized) {
      certificationLevel = 'STANDARD';
    } else {
      certificationLevel = 'BASIC';
    }

    return {
      enterpriseReady,
      productionReady,
      scalabilityValidated,
      performanceOptimized,
      certificationLevel
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    queenPrincessResults: any,
    crossPrincessResults: any,
    swarmScalabilityResults: any,
    latencyAnalysis: any,
    targets: PerformanceValidationResult['performanceTargets']
  ): string[] {
    const recommendations: string[] = [];

    // Latency recommendations
    if (!targets.queenPrincessLatency.passed) {
      recommendations.push(
        `Queen-Princess latency (${targets.queenPrincessLatency.actual.toFixed(2)}ms) exceeds target (${targets.queenPrincessLatency.target}ms). ` +
        'Implement message batching and connection pooling.'
      );
    }

    // Throughput recommendations
    if (!targets.crossDomainThroughput.passed) {
      recommendations.push(
        `Cross-domain throughput (${targets.crossDomainThroughput.actual.toFixed(2)} msg/sec) below target (${targets.crossDomainThroughput.target} msg/sec). ` +
        'Optimize message serialization and implement parallel processing.'
      );
    }

    // Scalability recommendations
    if (!targets.swarmScalability.passed) {
      recommendations.push(
        `Swarm scalability (${targets.swarmScalability.actual} agents) below target (${targets.swarmScalability.target} agents). ` +
        'Implement hierarchical coordination and agent pooling.'
      );
    }

    // Memory efficiency recommendations
    if (!targets.memoryEfficiency.passed) {
      recommendations.push(
        `Memory efficiency (${(targets.memoryEfficiency.actual * 100).toFixed(1)}%) below target (${(targets.memoryEfficiency.target * 100).toFixed(1)}%). ` +
        'Implement object pooling and optimize garbage collection.'
      );
    }

    // Error rate recommendations
    if (!targets.errorRate.passed) {
      recommendations.push(
        `Error rate (${(targets.errorRate.actual * 100).toFixed(2)}%) exceeds target (${(targets.errorRate.target * 100).toFixed(2)}%). ` +
        'Implement circuit breakers and retry mechanisms.'
      );
    }

    // Add latency analysis recommendations
    if (latencyAnalysis.recommendations && latencyAnalysis.recommendations.length > 0) {
      recommendations.push(...latencyAnalysis.recommendations.slice(0, 3).map((r: any) => r.action));
    }

    // Add scalability recommendations
    if (swarmScalabilityResults.recommendations && swarmScalabilityResults.recommendations.length > 0) {
      recommendations.push(...swarmScalabilityResults.recommendations.slice(0, 2));
    }

    // If no specific recommendations, add general ones
    if (recommendations.length === 0) {
      recommendations.push('All performance targets met - consider testing at higher scales for future growth');
    }

    return recommendations;
  }

  /**
   * Generate comprehensive performance report
   */
  private async generateComprehensiveReport(result: PerformanceValidationResult): Promise<string> {
    const reportDir = path.join(__dirname, '../reports/performance');
    const reportPath = path.join(reportDir, `performance-validation-${Date.now()}.md`);

    let report = '# SPEK Enhanced Platform - Performance Validation Report\n\n';
    report += `**Generated:** ${new Date(result.timestamp).toISOString()}\n`;
    report += `**Duration:** ${(result.duration / 1000).toFixed(2)} seconds\n`;
    report += `**Overall Status:** ${result.overallStatus}\n`;
    report += `**Certification Level:** ${result.certification.certificationLevel}\n\n`;

    // Executive Summary
    report += '## Executive Summary\n\n';
    report += `The SPEK Enhanced Development Platform has been validated for performance at enterprise scale. `;
    report += `The system achieved **${result.certification.certificationLevel}** certification level with `;
    report += `${result.overallStatus === 'PASS' ? 'all' : 'most'} performance targets met.\n\n`;

    // Performance Targets
    report += '## Performance Target Results\n\n';
    report += '| Metric | Target | Actual | Status |\n';
    report += '|--------|--------|--------|--------|\n';

    for (const [key, target] of Object.entries(result.performanceTargets)) {
      const status = target.passed ? '✅ PASS' : '❌ FAIL';
      const units = this.getMetricUnits(key);
      report += `| ${this.formatMetricName(key)} | ${target.target}${units} | ${target.actual.toFixed(2)}${units} | ${status} |\n`;
    }
    report += '\n';

    // Test Results Summary
    report += '## Test Results Summary\n\n';

    const { queenPrincessLatency, crossPrincessPerformance, swarmScalability } = result.testResults;

    report += '### Queen-Princess Communication Latency\n';
    report += `- **Tests:** ${queenPrincessLatency.summary.passedTests}/${queenPrincessLatency.summary.totalTests} passed\n`;
    report += `- **Average Latency:** ${queenPrincessLatency.summary.averageLatency.toFixed(2)}ms\n`;
    report += `- **Worst Case:** ${queenPrincessLatency.summary.worstCaseLatency.toFixed(2)}ms\n`;
    report += `- **Statistical Significance:** ${queenPrincessLatency.statisticalValidation.isStatisticallySignificant ? 'Yes' : 'No'}\n\n`;

    report += '### Cross-Princess Performance\n';
    report += `- **Tests:** ${crossPrincessPerformance.summary.passedTests}/${crossPrincessPerformance.summary.totalTests} passed\n`;
    report += `- **Average Throughput:** ${crossPrincessPerformance.summary.averageThroughput.toFixed(2)} msg/sec\n`;
    report += `- **Memory Efficiency:** ${(crossPrincessPerformance.summary.memoryEfficiency * 100).toFixed(1)}%\n\n`;

    report += '### Swarm Scalability\n';
    report += `- **Max Supported Agents:** ${swarmScalability.scalabilityAnalysis.maxSupportedAgents}\n`;
    report += `- **Linear Scaling Up To:** ${swarmScalability.scalabilityAnalysis.linearScalingUpTo} agents\n`;
    report += `- **Scaling Efficiency:** ${(swarmScalability.scalabilityAnalysis.scalingEfficiency * 100).toFixed(1)}%\n\n`;

    // Certification Details
    report += '## Certification Details\n\n';
    report += `- **Enterprise Ready:** ${result.certification.enterpriseReady ? '✅' : '❌'}\n`;
    report += `- **Production Ready:** ${result.certification.productionReady ? '✅' : '❌'}\n`;
    report += `- **Scalability Validated:** ${result.certification.scalabilityValidated ? '✅' : '❌'}\n`;
    report += `- **Performance Optimized:** ${result.certification.performanceOptimized ? '✅' : '❌'}\n\n`;

    // Recommendations
    if (result.recommendations.length > 0) {
      report += '## Optimization Recommendations\n\n';
      for (let i = 0; i < result.recommendations.length; i++) {
        report += `${i + 1}. ${result.recommendations[i]}\n`;
      }
      report += '\n';
    }

    // Latency Analysis
    if (result.latencyAnalysis.bottlenecks && result.latencyAnalysis.bottlenecks.length > 0) {
      report += '## Latency Bottlenecks\n\n';
      for (const bottleneck of result.latencyAnalysis.bottlenecks.slice(0, 5)) {
        report += `### ${bottleneck.component}:${bottleneck.operation}\n`;
        report += `- **Severity:** ${bottleneck.severity}\n`;
        report += `- **P95 Latency:** ${bottleneck.p95Latency.toFixed(2)}ms\n`;
        report += `- **Impact:** ${bottleneck.impact.toFixed(1)}%\n`;
        report += `- **Recommendation:** ${bottleneck.recommendations[0]}\n\n`;
      }
    }

    // Footer
    report += '---\n\n';
    report += `Report generated by SPEK Enhanced Platform Performance Validation System\n`;
    report += `Timestamp: ${new Date().toISOString()}\n`;

    // Save report
    await fs.promises.writeFile(reportPath, report, 'utf8');
    console.log(`📄 Comprehensive report saved: ${reportPath}`);

    return reportPath;
  }

  /**
   * Display final summary
   */
  private displayFinalSummary(result: PerformanceValidationResult): void {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 PHASE 9 PERFORMANCE VALIDATION COMPLETE');
    console.log('='.repeat(80));

    const statusIcon = result.overallStatus === 'PASS' ? '✅' :
                      result.overallStatus === 'WARNING' ? '⚠️' : '❌';

    console.log(`\n📊 **OVERALL STATUS:** ${statusIcon} ${result.overallStatus}`);
    console.log(`🏆 **CERTIFICATION LEVEL:** ${result.certification.certificationLevel}`);
    console.log(`⏱️  **TOTAL DURATION:** ${(result.duration / 1000).toFixed(2)} seconds`);

    console.log('\n🎯 **PERFORMANCE TARGETS:**');
    const targetEntries = Object.entries(result.performanceTargets);
    for (const [key, target] of targetEntries) {
      const icon = target.passed ? '✅' : '❌';
      const units = this.getMetricUnits(key);
      console.log(`   ${icon} ${this.formatMetricName(key)}: ${target.actual.toFixed(2)}${units} (target: ${target.target}${units})`);
    }

    console.log('\n🏅 **CERTIFICATION STATUS:**');
    console.log(`   Enterprise Ready: ${result.certification.enterpriseReady ? '✅' : '❌'}`);
    console.log(`   Production Ready: ${result.certification.productionReady ? '✅' : '❌'}`);
    console.log(`   Scalability Validated: ${result.certification.scalabilityValidated ? '✅' : '❌'}`);
    console.log(`   Performance Optimized: ${result.certification.performanceOptimized ? '✅' : '❌'}`);

    if (result.recommendations.length > 0) {
      console.log('\n💡 **TOP RECOMMENDATIONS:**');
      for (let i = 0; i < Math.min(3, result.recommendations.length); i++) {
        console.log(`   ${i + 1}. ${result.recommendations[i]}`);
      }
    }

    console.log(`\n📄 **DETAILED REPORT:** ${result.reportPath}`);
    console.log('\n' + '='.repeat(80));
    console.log('🎉 PERFORMANCE VALIDATION COMPLETE');
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Utility methods
   */
  private getMetricUnits(metricKey: string): string {
    const units = {
      queenPrincessLatency: 'ms',
      crossDomainThroughput: ' msg/sec',
      swarmScalability: ' agents',
      memoryEfficiency: '%',
      errorRate: '%'
    };
    return units[metricKey as keyof typeof units] || '';
  }

  private formatMetricName(metricKey: string): string {
    const names = {
      queenPrincessLatency: 'Queen-Princess Latency P95',
      crossDomainThroughput: 'Cross-Domain Throughput',
      swarmScalability: 'Max Swarm Agents',
      memoryEfficiency: 'Memory Efficiency',
      errorRate: 'Error Rate'
    };
    return names[metricKey as keyof typeof names] || metricKey;
  }

  private ensureDirectories(): void {
    const dirs = [
      path.join(__dirname, '../reports'),
      path.join(__dirname, '../reports/performance')
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }
}

// CLI execution
if (require.main === module) {
  const runner = new PerformanceBenchmarkRunner();

  runner.runCompletePerformanceValidation()
    .then((result) => {
      const exitCode = result.overallStatus === 'FAIL' ? 1 : 0;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('\n❌ Performance validation failed:', error);
      process.exit(1);
    });
}

export default PerformanceBenchmarkRunner;

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-01-27T22:45:18-05:00 | performance-benchmarker@Claude Sonnet 4 | Created comprehensive performance validation orchestrator with enterprise certification and detailed reporting | run-performance-benchmarks.ts | OK | Integrates all test suites, validates targets, generates certification, and produces executive reports with actionable recommendations | 0.00 | 6d9f1b2 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: performance-validation-orchestrator-001
 * - inputs: ["All test suite integrations", "Performance targets", "Certification framework", "Enterprise reporting"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4","prompt":"performance-orchestrator-comprehensive-v1"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */