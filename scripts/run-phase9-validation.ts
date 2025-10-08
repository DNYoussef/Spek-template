#!/usr/bin/env node
/**
 * Phase 9 Comprehensive Validation Runner
 * Executes complete production readiness validation
 */

import { join } from 'path';
import { ValidationRunner } from '../src/validation/ValidationRunner';

async function main() {
  const projectRoot = process.cwd();

  console.log('🚀 PHASE 9: COMPREHENSIVE PRODUCTION VALIDATION');
  console.log('='.repeat(80));
  console.log(`📍 Project Root: ${projectRoot}`);
  console.log(`⏰ Started: ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  try {
    const runner = new ValidationRunner(projectRoot);
    const result = await runner.runCompleteValidation();

    console.log('\n🎯 VALIDATION COMPLETE!');
    console.log('='.repeat(80));

    // Summary output
    console.log(`📊 Overall Score: ${result.gateResult.overallScore}/100`);
    console.log(`✅ Production Ready: ${result.gateResult.passed ? 'YES' : 'NO'}`);
    console.log(`🏭 Production Readiness: ${result.metrics.productionReadiness}`);
    console.log(`🛡️ NASA POT10 Compliance: ${result.metrics.nasaCompliance}%`);
    console.log(`🎭 Theater Score: ${result.metrics.theaterScore}/100`);
    console.log(`🧪 Test Coverage: ${result.metrics.testCoverage}%`);
    console.log(`📦 Compilation: ${result.metrics.compilationStatus}`);

    console.log('\n📋 Top Recommendations:');
    result.recommendations.slice(0, 5).forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });

    console.log('\n📁 Generated Reports:');
    console.log(`  Executive: ${result.reportPaths.executive}`);
    console.log(`  Detailed: ${result.reportPaths.detailed}`);
    console.log(`  Compliance: ${result.reportPaths.compliance}`);

    console.log('\n' + '='.repeat(80));
    console.log(result.gateResult.passed ?
      '🎉 SYSTEM IS PRODUCTION READY!' :
      '⚠️ SYSTEM REQUIRES FIXES BEFORE PRODUCTION'
    );
    console.log('='.repeat(80));

    // Exit with appropriate code
    process.exit(result.gateResult.passed ? 0 : 1);

  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };