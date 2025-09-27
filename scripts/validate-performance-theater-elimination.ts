#!/usr/bin/env npx tsx

/**
 * Performance Theater Elimination Validator
 *
 * Comprehensive validation script to ensure ALL Math.random() instances
 * have been eliminated from performance measurement code and replaced
 * with genuine Node.js performance APIs.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { RealPerformanceBenchmarker, RealPerformanceTestSuite, runRealPerformanceBenchmarks } from '../src/performance/RealPerformanceBenchmarker';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    filesScanned: number;
    mathRandomInstances: number;
    realAPIsValidated: number;
    performanceTestsPassed: number;
  };
}

class PerformanceTheaterValidator {
  private performanceDirectory = path.join(process.cwd(), 'src', 'performance');
  private validationResults: ValidationResult = {
    passed: false,
    errors: [],
    warnings: [],
    summary: {
      filesScanned: 0,
      mathRandomInstances: 0,
      realAPIsValidated: 0,
      performanceTestsPassed: 0
    }
  };

  async validate(): Promise<ValidationResult> {
    console.log('🚨 THEATER ELIMINATION VALIDATION STARTING...');
    console.log('=' * 50);

    try {
      // Phase 1: Scan for remaining Math.random() instances
      await this.scanForMathRandom();

      // Phase 2: Validate real performance APIs are used
      await this.validateRealAPIs();

      // Phase 3: Execute real performance benchmarks
      await this.executeRealBenchmarks();

      // Phase 4: Generate final validation report
      this.generateFinalReport();

    } catch (error) {
      this.validationResults.errors.push(`Validation failed: ${error.message}`);
    }

    this.validationResults.passed =
      this.validationResults.errors.length === 0 &&
      this.validationResults.summary.mathRandomInstances === 0 &&
      this.validationResults.summary.realAPIsValidated > 0;

    return this.validationResults;
  }

  private async scanForMathRandom(): Promise<void> {
    console.log('📁 Phase 1: Scanning for Math.random() instances...');

    const files = await this.getAllTypeScriptFiles(this.performanceDirectory);
    this.validationResults.summary.filesScanned = files.length;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const mathRandomMatches = content.match(/Math\.random\s*\(/g);

      if (mathRandomMatches) {
        const count = mathRandomMatches.length;
        this.validationResults.summary.mathRandomInstances += count;
        this.validationResults.errors.push(
          `❌ THEATER DETECTED: ${file} contains ${count} Math.random() instances`
        );

        // Show specific lines with Math.random()
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('Math.random')) {
            this.validationResults.errors.push(
              `   Line ${index + 1}: ${line.trim()}`
            );
          }
        });
      }
    }

    if (this.validationResults.summary.mathRandomInstances === 0) {
      console.log('✅ NO Math.random() instances found in performance code');
    } else {
      console.log(`❌ FOUND ${this.validationResults.summary.mathRandomInstances} Math.random() instances`);
    }
  }

  private async validateRealAPIs(): Promise<void> {
    console.log('🔍 Phase 2: Validating real performance APIs...');

    const files = await this.getAllTypeScriptFiles(this.performanceDirectory);
    const realAPIPatterns = [
      /process\.hrtime\.bigint\s*\(/g,
      /process\.memoryUsage\s*\(/g,
      /process\.cpuUsage\s*\(/g,
      /performance\.now\s*\(/g,
      /performance\.mark\s*\(/g,
      /performance\.measure\s*\(/g
    ];

    let totalRealAPIs = 0;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');

      for (const pattern of realAPIPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          totalRealAPIs += matches.length;
        }
      }
    }

    this.validationResults.summary.realAPIsValidated = totalRealAPIs;

    if (totalRealAPIs > 0) {
      console.log(`✅ FOUND ${totalRealAPIs} real performance API usages`);
    } else {
      this.validationResults.warnings.push(
        '⚠️  No real performance APIs detected - performance measurement may not be implemented'
      );
    }
  }

  private async executeRealBenchmarks(): Promise<void> {
    console.log('🚀 Phase 3: Executing real performance benchmarks...');

    try {
      // Test CPU benchmark
      const cpuBenchmark = new RealPerformanceBenchmarker(
        RealPerformanceTestSuite.createCPUBenchmark()
      );

      const cpuStart = performance.now();
      const cpuResult = await cpuBenchmark.executeBenchmark();
      const cpuEnd = performance.now();

      if (cpuResult.validation.passed) {
        this.validationResults.summary.performanceTestsPassed++;
        console.log(`✅ CPU Benchmark PASSED (${(cpuEnd - cpuStart).toFixed(2)}ms, Score: ${cpuResult.validation.score})`);
      } else {
        this.validationResults.errors.push(
          `❌ CPU Benchmark FAILED: ${cpuResult.validation.failures.join(', ')}`
        );
      }

      // Test Memory benchmark
      const memoryBenchmark = new RealPerformanceBenchmarker(
        RealPerformanceTestSuite.createMemoryBenchmark()
      );

      const memoryStart = performance.now();
      const memoryResult = await memoryBenchmark.executeBenchmark();
      const memoryEnd = performance.now();

      if (memoryResult.validation.passed) {
        this.validationResults.summary.performanceTestsPassed++;
        console.log(`✅ Memory Benchmark PASSED (${(memoryEnd - memoryStart).toFixed(2)}ms, Score: ${memoryResult.validation.score})`);
      } else {
        this.validationResults.errors.push(
          `❌ Memory Benchmark FAILED: ${memoryResult.validation.failures.join(', ')}`
        );
      }

      // Validate that measurements are real (not random)
      this.validateMeasurementAuthenticity(cpuResult, memoryResult);

    } catch (error) {
      this.validationResults.errors.push(
        `❌ Benchmark execution failed: ${error.message}`
      );
    }
  }

  private validateMeasurementAuthenticity(cpuResult: any, memoryResult: any): void {
    // Verify that latency measurements are realistic and not random
    const cpuLatencies = cpuResult.metrics.realTimingData.operationTimings;
    const memoryLatencies = memoryResult.metrics.realTimingData.operationTimings;

    // Check for unrealistic patterns that suggest random data
    if (this.hasRandomPattern(cpuLatencies)) {
      this.validationResults.errors.push('❌ CPU latency measurements appear to be artificially random');
    }

    if (this.hasRandomPattern(memoryLatencies)) {
      this.validationResults.errors.push('❌ Memory latency measurements appear to be artificially random');
    }

    // Verify measurements are within realistic bounds
    const maxReasonableLatency = 10000; // 10 seconds max per operation
    const minReasonableLatency = 0.001; // 0.001ms minimum

    const allLatencies = [...cpuLatencies, ...memoryLatencies];
    for (const latency of allLatencies) {
      if (latency > maxReasonableLatency || latency < minReasonableLatency) {
        this.validationResults.warnings.push(
          `⚠️  Suspicious latency measurement: ${latency}ms (outside reasonable bounds)`
        );
      }
    }

    console.log('✅ Measurement authenticity validation completed');
  }

  private hasRandomPattern(values: number[]): boolean {
    if (values.length < 10) return false;

    // Check for perfectly uniform distribution (sign of random data)
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const range = max - min;

    if (range === 0) return true; // All identical values

    // Check for suspiciously uniform distribution
    const buckets = 10;
    const bucketSize = range / buckets;
    const bucketCounts = new Array(buckets).fill(0);

    for (const value of values) {
      const bucketIndex = Math.min(Math.floor((value - min) / bucketSize), buckets - 1);
      bucketCounts[bucketIndex]++;
    }

    // If distribution is too uniform, it might be artificial
    const expectedCount = values.length / buckets;
    const variance = bucketCounts.reduce((sum, count) =>
      sum + Math.pow(count - expectedCount, 2), 0) / buckets;

    return variance < expectedCount * 0.1; // Too uniform
  }

  private async getAllTypeScriptFiles(directory: string): Promise<string[]> {
    const files: string[] = [];

    async function scanDirectory(dir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    }

    await scanDirectory(directory);
    return files;
  }

  private generateFinalReport(): void {
    console.log('\n📋 FINAL VALIDATION REPORT');
    console.log('='.repeat(50));

    const { summary } = this.validationResults;

    console.log(`📊 SUMMARY:`);
    console.log(`   Files Scanned: ${summary.filesScanned}`);
    console.log(`   Math.random() Instances: ${summary.mathRandomInstances}`);
    console.log(`   Real APIs Validated: ${summary.realAPIsValidated}`);
    console.log(`   Performance Tests Passed: ${summary.performanceTestsPassed}`);

    if (this.validationResults.errors.length > 0) {
      console.log(`\n❌ ERRORS (${this.validationResults.errors.length}):`);
      this.validationResults.errors.forEach(error => console.log(`   ${error}`));
    }

    if (this.validationResults.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.validationResults.warnings.length}):`);
      this.validationResults.warnings.forEach(warning => console.log(`   ${warning}`));
    }

    console.log(`\n🎯 OVERALL RESULT: ${this.validationResults.passed ? '✅ PASSED' : '❌ FAILED'}`);

    if (this.validationResults.passed) {
      console.log('\n🎉 THEATER ELIMINATION SUCCESSFUL!');
      console.log('   ✅ Zero Math.random() instances found');
      console.log('   ✅ Real performance APIs validated');
      console.log('   ✅ Authentic performance measurements confirmed');
      console.log('\n🚀 PERFORMANCE SYSTEM IS PRODUCTION READY');
    } else {
      console.log('\n🚨 THEATER ELIMINATION INCOMPLETE!');
      console.log('   ❌ Performance measurement theater still detected');
      console.log('   ❌ System not ready for production use');
    }
  }
}

// Execute validation
async function main() {
  const validator = new PerformanceTheaterValidator();
  const result = await validator.validate();

  // Exit with appropriate code
  process.exit(result.passed ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  });
}

export { PerformanceTheaterValidator };

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-27T09:45:30-04:00 | claude@sonnet-4 | Created comprehensive performance theater validation script with real benchmark execution and Math.random() detection | validate-performance-theater-elimination.ts | OK | Validates complete elimination of performance measurement theater | 0.00 | c9f8e2d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: theater-validation-script-2025-09-27
- inputs: ["performance theater validation requirements", "comprehensive Math.random() elimination verification"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"theater-validation-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->