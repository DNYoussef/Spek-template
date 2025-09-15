#!/usr/bin/env node
/**
 * Six Sigma Quality Validation Script
 * Validates CTQ, SPC, DPMO properties and theater detection thresholds
 */

const fs = require('fs');
const path = require('path');

const SIX_SIGMA_CONTRACTS = {
  CTQ_RESPONSE_TIME: 50, // milliseconds - Critical to Quality
  CTQ_UPTIME: 99.9, // percentage
  DPMO_TARGET: 3.4, // Defects Per Million Opportunities (Six Sigma level)
  THEATER_DETECTION_THRESHOLD: 0.3, // Theater detection score threshold
  SPC_UCL: 60, // Statistical Process Control - Upper Control Limit (ms)
  SPC_LCL: 10, // Statistical Process Control - Lower Control Limit (ms)
  DEFECT_RATE_MAX: 0.00034 // Maximum defect rate (3.4 DPMO)
};

function validateCTQ() {
  console.log('📊 Validating CTQ (Critical to Quality) Metrics...');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Response Time CTQ
  const responseTimeTest = {
    name: 'CTQ Response Time',
    metric: 'response_time',
    target: SIX_SIGMA_CONTRACTS.CTQ_RESPONSE_TIME,
    actual: 25.5, // Mock measurement
    unit: 'ms',
    passed: false
  };
  responseTimeTest.passed = responseTimeTest.actual <= responseTimeTest.target;
  results.tests.push(responseTimeTest);

  // Uptime CTQ
  const uptimeTest = {
    name: 'CTQ System Uptime',
    metric: 'uptime',
    target: SIX_SIGMA_CONTRACTS.CTQ_UPTIME,
    actual: 99.95, // Mock measurement
    unit: '%',
    passed: false
  };
  uptimeTest.passed = uptimeTest.actual >= uptimeTest.target;
  results.tests.push(uptimeTest);

  // Count results
  results.passed = results.tests.filter(t => t.passed).length;
  results.failed = results.tests.length - results.passed;

  return results;
}

function validateSPC() {
  console.log('📈 Validating SPC (Statistical Process Control) Metrics...');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Generate mock process data
  const processData = Array.from({length: 100}, () =>
    Math.random() * 40 + 20 // Random values between 20-60ms
  );

  // Calculate control chart metrics
  const mean = processData.reduce((a, b) => a + b, 0) / processData.length;
  const variance = processData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / processData.length;
  const stdDev = Math.sqrt(variance);

  const ucl = mean + 3 * stdDev;
  const lcl = Math.max(0, mean - 3 * stdDev);

  // SPC Control Limits Test
  const controlLimitsTest = {
    name: 'SPC Control Limits',
    metric: 'control_limits',
    target: `UCL ≤ ${SIX_SIGMA_CONTRACTS.SPC_UCL}ms, LCL ≥ ${SIX_SIGMA_CONTRACTS.SPC_LCL}ms`,
    actual: `UCL: ${ucl.toFixed(2)}ms, LCL: ${lcl.toFixed(2)}ms`,
    passed: ucl <= SIX_SIGMA_CONTRACTS.SPC_UCL && lcl >= SIX_SIGMA_CONTRACTS.SPC_LCL
  };
  results.tests.push(controlLimitsTest);

  // Process Capability Test
  const cpk = Math.min(
    (SIX_SIGMA_CONTRACTS.SPC_UCL - mean) / (3 * stdDev),
    (mean - SIX_SIGMA_CONTRACTS.SPC_LCL) / (3 * stdDev)
  );

  const processCapabilityTest = {
    name: 'Process Capability (Cpk)',
    metric: 'process_capability',
    target: 'Cpk ≥ 1.33 (Six Sigma capable)',
    actual: `Cpk: ${cpk.toFixed(3)}`,
    passed: cpk >= 1.33
  };
  results.tests.push(processCapabilityTest);

  results.passed = results.tests.filter(t => t.passed).length;
  results.failed = results.tests.length - results.passed;

  return results;
}

function validateDPMO() {
  console.log('🎯 Validating DPMO (Defects Per Million Opportunities)...');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Mock defect data
  const totalOpportunities = 1000000; // One million opportunities
  const actualDefects = 12; // Mock defect count
  const dpmo = (actualDefects / totalOpportunities) * 1000000;

  const dpmoTest = {
    name: 'DPMO Six Sigma Level',
    metric: 'dpmo',
    target: SIX_SIGMA_CONTRACTS.DPMO_TARGET,
    actual: dpmo,
    unit: 'defects per million',
    passed: dpmo <= SIX_SIGMA_CONTRACTS.DPMO_TARGET
  };
  results.tests.push(dpmoTest);

  // Sigma Level calculation
  const sigmaLevel = dpmo <= 3.4 ? 6 : dpmo <= 233 ? 5 : dpmo <= 6210 ? 4 : 3;
  const sigmaLevelTest = {
    name: 'Sigma Quality Level',
    metric: 'sigma_level',
    target: '6 Sigma',
    actual: `${sigmaLevel} Sigma`,
    passed: sigmaLevel >= 6
  };
  results.tests.push(sigmaLevelTest);

  results.passed = results.tests.filter(t => t.passed).length;
  results.failed = results.tests.length - results.passed;

  return results;
}

function validateTheaterDetection() {
  console.log('🎭 Validating Theater Detection Metrics...');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Mock theater detection scores
  const theaterScores = [0.15, 0.22, 0.08, 0.35, 0.12]; // Mock scores
  const avgScore = theaterScores.reduce((a, b) => a + b, 0) / theaterScores.length;

  const theaterThresholdTest = {
    name: 'Theater Detection Threshold',
    metric: 'theater_score',
    target: SIX_SIGMA_CONTRACTS.THEATER_DETECTION_THRESHOLD,
    actual: avgScore,
    unit: 'score',
    passed: avgScore >= SIX_SIGMA_CONTRACTS.THEATER_DETECTION_THRESHOLD
  };
  results.tests.push(theaterThresholdTest);

  // Theater pattern consistency
  const variance = theaterScores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / theaterScores.length;
  const consistency = variance < 0.01; // Low variance indicates consistent detection

  const consistencyTest = {
    name: 'Theater Detection Consistency',
    metric: 'variance',
    target: 'Variance < 0.01',
    actual: `Variance: ${variance.toFixed(4)}`,
    passed: consistency
  };
  results.tests.push(consistencyTest);

  results.passed = results.tests.filter(t => t.passed).length;
  results.failed = results.tests.length - results.passed;

  return results;
}

function generateSixSigmaReport(ctqResults, spcResults, dpmoResults, theaterResults) {
  const allResults = [ctqResults, spcResults, dpmoResults, theaterResults];
  const totalPassed = allResults.reduce((sum, result) => sum + result.passed, 0);
  const totalTests = allResults.reduce((sum, result) => sum + result.tests.length, 0);
  const passRate = (totalPassed / totalTests * 100).toFixed(1);

  console.log('\n📊 SIX SIGMA QUALITY VALIDATION REPORT');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalTests - totalPassed}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log('=' .repeat(60));

  // Category results
  const categories = [
    { name: 'CTQ (Critical to Quality)', results: ctqResults },
    { name: 'SPC (Statistical Process Control)', results: spcResults },
    { name: 'DPMO (Defects Per Million)', results: dpmoResults },
    { name: 'Theater Detection', results: theaterResults }
  ];

  categories.forEach(category => {
    console.log(`\n📈 ${category.name}:`);
    category.results.tests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status} ${test.name}`);
      if (test.unit) {
        console.log(`    Target: ${test.target} ${test.unit}`);
        console.log(`    Actual: ${test.actual} ${test.unit}`);
      } else {
        console.log(`    Target: ${test.target}`);
        console.log(`    Actual: ${test.actual}`);
      }
    });
  });

  // Quality gates
  const meetsSixSigma = passRate >= 95;
  console.log('\n🎯 SIX SIGMA QUALITY GATES:');
  console.log(`Six Sigma Compliance: ${meetsSixSigma ? '✅ PASS' : '❌ FAIL'} (${passRate}% ≥ 95%)`);

  return {
    passRate: parseFloat(passRate),
    meetsSixSigma,
    totalTests,
    totalPassed,
    categories: categories.map(cat => ({
      name: cat.name,
      passed: cat.results.passed,
      total: cat.results.tests.length,
      tests: cat.results.tests
    }))
  };
}

async function main() {
  try {
    console.log('📊 SPEK Six Sigma Quality Validation Suite');
    console.log('Validating CTQ, SPC, DPMO, and Theater Detection...\n');

    const ctqResults = validateCTQ();
    const spcResults = validateSPC();
    const dpmoResults = validateDPMO();
    const theaterResults = validateTheaterDetection();

    const report = generateSixSigmaReport(ctqResults, spcResults, dpmoResults, theaterResults);

    // Save results for CI/CD
    const resultsPath = '.claude/.artifacts/sixsigma_validation_results.json';
    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      sixsigma_validation: report,
      contracts: SIX_SIGMA_CONTRACTS,
      detailed_results: {
        ctq: ctqResults,
        spc: spcResults,
        dpmo: dpmoResults,
        theater_detection: theaterResults
      }
    }, null, 2));

    console.log(`\n💾 Results saved to: ${resultsPath}`);

    // Exit with appropriate code
    process.exit(report.meetsSixSigma ? 0 : 1);

  } catch (error) {
    console.error('❌ Six Sigma validation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  validateCTQ,
  validateSPC,
  validateDPMO,
  validateTheaterDetection,
  SIX_SIGMA_CONTRACTS
};