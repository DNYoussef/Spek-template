#!/usr/bin/env ts-node

/**
 * Performance Theater Detection Runner
 *
 * Comprehensive scan for Math.random() theater and fake performance measurements
 * across the entire SPEK Enhanced Development Platform codebase.
 */

import { PerformanceTheaterDetector } from '../src/performance/cli/PerformanceTheaterDetector';
import * as path from 'path';

async function runTheaterDetection() {
  console.log('🎭 STARTING PERFORMANCE THEATER DETECTION');
  console.log('==========================================\n');

  const detector = new PerformanceTheaterDetector({
    performanceDirectories: [
      'tests/performance',
      'src/performance',
      'benchmarks',
      'test/performance'
    ],
    filePatterns: [
      '**/*.test.ts',
      '**/*.test.js',
      '**/*.bench.ts',
      '**/*.bench.js',
      '**/*performance*.ts',
      '**/*benchmark*.ts',
      '**/*load*.ts',
      '**/*perf*.ts'
    ]
  });

  try {
    const { analysis, summary } = await detector.detectPerformanceTheater();

    // Generate and display report
    const report = detector.generateTheaterReport(analysis, summary);
    console.log(report);

    // Export detailed violations
    const exportPath = path.join(process.cwd(), '.claude', '.artifacts', 'theater-violations.json');
    await detector.exportTheaterViolations(analysis, exportPath);

    console.log(`\n📊 Detailed violations exported to: ${exportPath}`);

    // Exit with appropriate code
    if (summary.criticalViolations > 0 || summary.avgReliabilityScore < 95) {
      console.log('\n❌ THEATER DETECTION FAILED - Remediation required');
      process.exit(1);
    } else {
      console.log('\n✅ THEATER DETECTION PASSED - Zero tolerance achieved');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Theater detection failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (require.main === module) {
  runTheaterDetection().catch(console.error);
}

export { runTheaterDetection };