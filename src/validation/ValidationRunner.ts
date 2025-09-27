/**
 * Comprehensive Validation Runner
 * Orchestrates all validation processes for Phase 9 production readiness
 */

import { join } from 'path';
import { writeFileSync } from 'fs';
import { ProductionGate, ProductionGateResult } from './gates/ProductionGate';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ValidationRunResult {
  timestamp: string;
  projectPath: string;
  gateResult: ProductionGateResult;
  metrics: {
    productionReadiness: number;
    theaterScore: number;
    nasaCompliance: number;
    testCoverage: number;
    compilationStatus: 'PASS' | 'FAIL';
    typeScriptErrors: number;
  };
  recommendations: string[];
  nextSteps: string[];
  reportPaths: {
    executive: string;
    detailed: string;
    compliance: string;
  };
}

export class ValidationRunner {
  private projectRoot: string;
  private outputDir: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.outputDir = join(projectRoot, '.claude', '.artifacts');
  }

  async runCompleteValidation(): Promise<ValidationRunResult> {
    console.log('🚀 Starting Phase 9 Comprehensive Validation...');
    console.log(`📍 Project: ${this.projectRoot}`);

    // Pre-validation checks
    await this.performPreValidationChecks();

    // Run production gate validation
    const productionGate = new ProductionGate(this.projectRoot, {
      thresholds: {
        productionReadiness: 80,
        nasaCompliance: 92,
        theaterScore: 60,
        testCoverage: 95,
        compilationErrors: 0,
        securityIssues: 0
      },
      enforceBlocking: true
    });

    const gateResult = await productionGate.validateProduction();

    // Compile metrics
    const metrics = this.compileMetrics(gateResult);

    // Generate reports
    const reportPaths = await this.generateReports(gateResult, productionGate);

    // Generate recommendations and next steps
    const recommendations = this.generateFinalRecommendations(gateResult, metrics);
    const nextSteps = this.generateNextSteps(gateResult, metrics);

    const result: ValidationRunResult = {
      timestamp: new Date().toISOString(),
      projectPath: this.projectRoot,
      gateResult,
      metrics,
      recommendations,
      nextSteps,
      reportPaths
    };

    // Generate final summary
    await this.generateFinalSummary(result);

    return result;
  }

  private async performPreValidationChecks(): Promise<void> {
    console.log('🔍 Performing pre-validation checks...');

    // Check TypeScript compilation
    try {
      const { stdout, stderr } = await execAsync('npx tsc --noEmit --pretty', {
        cwd: this.projectRoot
      });

      if (stderr) {
        console.warn('⚠️ TypeScript compilation issues detected');
        const errorCount = (stderr.match(/error TS\d+/g) || []).length;
        console.log(`📊 TypeScript errors: ${errorCount}`);
      } else {
        console.log('✅ TypeScript compilation passed');
      }
    } catch (error) {
      console.warn('⚠️ TypeScript compilation check failed');
    }

    // Check Node modules
    try {
      await execAsync('npm ls --depth=0', { cwd: this.projectRoot });
      console.log('✅ Dependencies check passed');
    } catch (error) {
      console.warn('⚠️ Dependencies issues detected');
    }

    console.log('📝 Pre-validation checks completed');
  }

  private compileMetrics(gateResult: ProductionGateResult) {
    return {
      productionReadiness: gateResult.gateResults.productionReadiness.score,
      theaterScore: gateResult.gateResults.theaterDetection.score,
      nasaCompliance: gateResult.gateResults.nasaCompliance.score,
      testCoverage: gateResult.gateResults.testCoverage.score,
      compilationStatus: gateResult.gateResults.compilationCheck.passed ? 'PASS' as const : 'FAIL' as const,
      typeScriptErrors: 0 // Would be populated from actual compilation check
    };
  }

  private async generateReports(
    gateResult: ProductionGateResult,
    productionGate: ProductionGate
  ): Promise<{ executive: string; detailed: string; compliance: string }> {
    console.log('📊 Generating comprehensive reports...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Executive Summary Report
    const executivePath = join(this.outputDir, `phase9-executive-summary-${timestamp}.md`);
    const executiveReport = productionGate.generateExecutiveSummary(gateResult);
    writeFileSync(executivePath, executiveReport, 'utf8');

    // Detailed Technical Report
    const detailedPath = join(this.outputDir, `phase9-detailed-report-${timestamp}.md`);
    const detailedReport = this.generateDetailedTechnicalReport(gateResult);
    writeFileSync(detailedPath, detailedReport, 'utf8');

    // Compliance Report
    const compliancePath = join(this.outputDir, `phase9-compliance-report-${timestamp}.md`);
    const complianceReport = this.generateComplianceReport(gateResult);
    writeFileSync(compliancePath, complianceReport, 'utf8');

    console.log(`📁 Reports generated:`);
    console.log(`  Executive: ${executivePath}`);
    console.log(`  Detailed: ${detailedPath}`);
    console.log(`  Compliance: ${compliancePath}`);

    return {
      executive: executivePath,
      detailed: detailedPath,
      compliance: compliancePath
    };
  }

  private generateDetailedTechnicalReport(gateResult: ProductionGateResult): string {
    return `
# Phase 9 Comprehensive Validation Report

**Generated:** ${new Date().toISOString()}
**Project:** ${this.projectRoot}

## Executive Summary

**Overall Status:** ${gateResult.passed ? '✅ PRODUCTION READY' : '❌ NOT PRODUCTION READY'}
**Overall Score:** ${gateResult.overallScore}/100

### Critical Metrics Achievement

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Production Readiness | ${gateResult.gateResults.productionReadiness.score} | ${gateResult.gateResults.productionReadiness.threshold} | ${gateResult.gateResults.productionReadiness.status} |
| NASA POT10 Compliance | ${gateResult.gateResults.nasaCompliance.score}% | ${gateResult.gateResults.nasaCompliance.threshold}% | ${gateResult.gateResults.nasaCompliance.status} |
| Theater Detection | ${gateResult.gateResults.theaterDetection.score}/100 | ${gateResult.gateResults.theaterDetection.threshold}/100 | ${gateResult.gateResults.theaterDetection.status} |
| Test Coverage | ${gateResult.gateResults.testCoverage.score}% | ${gateResult.gateResults.testCoverage.threshold}% | ${gateResult.gateResults.testCoverage.status} |

## Detailed Quality Gate Analysis

### 1. Production Readiness Assessment
**Score:** ${gateResult.gateResults.productionReadiness.score}/${gateResult.gateResults.productionReadiness.threshold}
**Status:** ${gateResult.gateResults.productionReadiness.status}

**Details:**
${gateResult.gateResults.productionReadiness.details.map(d => `- ${d}`).join('\n')}

### 2. NASA POT10 Compliance
**Score:** ${gateResult.gateResults.nasaCompliance.score}%
**Status:** ${gateResult.gateResults.nasaCompliance.status}

**Details:**
${gateResult.gateResults.nasaCompliance.details.map(d => `- ${d}`).join('\n')}

### 3. Theater Detection & Elimination
**Score:** ${gateResult.gateResults.theaterDetection.score}/100
**Status:** ${gateResult.gateResults.theaterDetection.status}

**Details:**
${gateResult.gateResults.theaterDetection.details.map(d => `- ${d}`).join('\n')}

### 4. Test Coverage Analysis
**Score:** ${gateResult.gateResults.testCoverage.score}%
**Status:** ${gateResult.gateResults.testCoverage.status}

**Details:**
${gateResult.gateResults.testCoverage.details.map(d => `- ${d}`).join('\n')}

### 5. Compilation & Type Safety
**Status:** ${gateResult.gateResults.compilationCheck.status}

**Details:**
${gateResult.gateResults.compilationCheck.details.map(d => `- ${d}`).join('\n')}

### 6. Security Assessment
**Status:** ${gateResult.gateResults.securityCheck.status}

**Details:**
${gateResult.gateResults.securityCheck.details.map(d => `- ${d}`).join('\n')}

## Issues Requiring Attention

### Blocking Issues
${gateResult.blockingIssues.length === 0 ?
  '✅ No blocking issues detected' :
  gateResult.blockingIssues.map(issue => `❌ ${issue}`).join('\n')}

### Warnings
${gateResult.warnings.length === 0 ?
  '✅ No warnings' :
  gateResult.warnings.map(warning => `⚠️ ${warning}`).join('\n')}

## Recommendations
${gateResult.recommendations.map(rec => `📋 ${rec}`).join('\n')}

## System Readiness Assessment

### Current State vs Target Metrics

| Component | Current | Target | Gap | Priority |
|-----------|---------|--------|-----|----------|
| Production Score | ${gateResult.gateResults.productionReadiness.score} | 80+ | ${Math.max(0, 80 - gateResult.gateResults.productionReadiness.score)} | ${gateResult.gateResults.productionReadiness.score < 80 ? 'HIGH' : 'LOW'} |
| NASA Compliance | ${gateResult.gateResults.nasaCompliance.score}% | 92%+ | ${Math.max(0, 92 - gateResult.gateResults.nasaCompliance.score)}% | ${gateResult.gateResults.nasaCompliance.score < 92 ? 'CRITICAL' : 'LOW'} |
| Theater Score | ${gateResult.gateResults.theaterDetection.score} | 60+ | ${Math.max(0, 60 - gateResult.gateResults.theaterDetection.score)} | ${gateResult.gateResults.theaterDetection.score < 60 ? 'HIGH' : 'LOW'} |
| Test Coverage | ${gateResult.gateResults.testCoverage.score}% | 95%+ | ${Math.max(0, 95 - gateResult.gateResults.testCoverage.score)}% | ${gateResult.gateResults.testCoverage.score < 95 ? 'HIGH' : 'LOW'} |

## Conclusion

${gateResult.passed ?
  `✅ **SYSTEM IS PRODUCTION READY**\n\nThe system has successfully passed all critical quality gates and meets the requirements for production deployment. All metrics are within acceptable ranges and no blocking issues were identified.` :
  `❌ **SYSTEM IS NOT PRODUCTION READY**\n\nThe system has ${gateResult.blockingIssues.length} blocking issues and ${gateResult.warnings.length} warnings that must be addressed before production deployment. Focus on the high-priority recommendations listed above.`}

**Assessment completed at:** ${new Date().toISOString()}
`;
  }

  private generateComplianceReport(gateResult: ProductionGateResult): string {
    return `
# NASA POT10 Compliance Report

**Assessment Date:** ${new Date().toISOString()}
**Project:** ${this.projectRoot}

## Compliance Summary

**Overall Compliance:** ${gateResult.gateResults.nasaCompliance.score}%
**Target Compliance:** ${gateResult.gateResults.nasaCompliance.threshold}%
**Status:** ${gateResult.gateResults.nasaCompliance.status}

## NASA Power of Ten Rules Assessment

${gateResult.detailedResults.nasa ? `
### Rule Compliance Breakdown

${gateResult.detailedResults.nasa.ruleResults.map(rule => `
#### Rule ${rule.ruleNumber}: ${rule.ruleName}
**Description:** ${rule.description}
**Compliance:** ${rule.compliance}%
**Status:** ${rule.status}
**Violations:** ${rule.violations.length}

${rule.violations.length > 0 ? `
**Violations:**
${rule.violations.map(v => `- ${v.file}:${v.line} - ${v.message} (${v.severity})`).join('\n')}
` : '✅ No violations detected'}
`).join('\n')}

### Critical Violations Requiring Immediate Attention

${gateResult.detailedResults.nasa.criticalViolations.length === 0 ?
  '✅ No critical violations detected' :
  gateResult.detailedResults.nasa.criticalViolations.map(v =>
    `❌ **Rule ${v.ruleNumber}** - ${v.file}:${v.line}\n   ${v.message}`
  ).join('\n\n')}

### Compliance Recommendations

${gateResult.detailedResults.nasa.recommendations.map(rec => `📋 ${rec}`).join('\n')}
` : 'NASA compliance data not available'}

## Defense Industry Readiness

Based on this assessment, the system is ${
  gateResult.gateResults.nasaCompliance.score >= 92 ?
  '✅ **READY for defense industry deployment**' :
  '❌ **NOT READY for defense industry deployment**'
}.

${gateResult.gateResults.nasaCompliance.score >= 92 ?
  'All critical safety and reliability requirements have been met.' :
  'Additional work is required to meet defense industry standards.'
}

**Report Generated:** ${new Date().toISOString()}
`;
  }

  private generateFinalRecommendations(
    gateResult: ProductionGateResult,
    metrics: any
  ): string[] {
    const recommendations: string[] = [];

    // High-level strategic recommendations
    if (!gateResult.passed) {
      recommendations.push('🚨 CRITICAL: System is not production ready - address blocking issues immediately');
    }

    // Specific metric-based recommendations
    if (metrics.productionReadiness < 80) {
      recommendations.push('📈 PRIORITY: Increase production readiness score to 80+ (currently ' + metrics.productionReadiness + ')');
    }

    if (metrics.nasaCompliance < 92) {
      recommendations.push('🛡️ CRITICAL: Achieve 92%+ NASA POT10 compliance (currently ' + metrics.nasaCompliance + '%)');
    }

    if (metrics.theaterScore < 60) {
      recommendations.push('🎭 HIGH: Eliminate performance theater patterns (current score: ' + metrics.theaterScore + ')');
    }

    if (metrics.testCoverage < 95) {
      recommendations.push('🧪 HIGH: Increase test coverage to 95%+ (currently ' + metrics.testCoverage + '%)');
    }

    // Add existing gate recommendations
    recommendations.push(...gateResult.recommendations);

    return recommendations;
  }

  private generateNextSteps(
    gateResult: ProductionGateResult,
    metrics: any
  ): string[] {
    const steps: string[] = [];

    if (gateResult.passed) {
      steps.push('✅ System is production ready - proceed with deployment');
      steps.push('📊 Monitor metrics in production environment');
      steps.push('🔄 Schedule regular compliance reviews');
      steps.push('📝 Update deployment documentation');
    } else {
      steps.push('🔧 Address all blocking issues identified in the report');
      steps.push('🧪 Re-run validation after fixes are implemented');
      steps.push('📋 Create tickets for each recommendation');
      steps.push('🎯 Focus on highest priority items first');

      // Specific next steps based on failures
      if (metrics.nasaCompliance < 92) {
        steps.push('🛡️ IMMEDIATE: Fix NASA POT10 compliance violations');
      }

      if (metrics.testCoverage < 95) {
        steps.push('🧪 HIGH: Implement missing tests to reach 95% coverage');
      }

      if (metrics.theaterScore < 60) {
        steps.push('🎭 HIGH: Remove console.log statements and TODO comments');
      }
    }

    return steps;
  }

  private async generateFinalSummary(result: ValidationRunResult): Promise<void> {
    const summaryPath = join(this.outputDir, 'phase9-final-validation-summary.md');

    const summary = `
# Phase 9 Final Validation Summary

**Status:** ${result.gateResult.passed ? '✅ PRODUCTION READY' : '❌ NOT PRODUCTION READY'}
**Overall Score:** ${result.gateResult.overallScore}/100
**Assessment Date:** ${result.timestamp}

## Key Metrics Achieved

- **Production Readiness:** ${result.metrics.productionReadiness}/80 (${result.metrics.productionReadiness >= 80 ? '✅' : '❌'})
- **NASA POT10 Compliance:** ${result.metrics.nasaCompliance}/92 (${result.metrics.nasaCompliance >= 92 ? '✅' : '❌'})
- **Theater Score:** ${result.metrics.theaterScore}/60 (${result.metrics.theaterScore >= 60 ? '✅' : '❌'})
- **Test Coverage:** ${result.metrics.testCoverage}/95 (${result.metrics.testCoverage >= 95 ? '✅' : '❌'})
- **Compilation:** ${result.metrics.compilationStatus} (${result.metrics.compilationStatus === 'PASS' ? '✅' : '❌'})

## Critical Actions Required

${result.recommendations.slice(0, 5).map(rec => `- ${rec}`).join('\n')}

## Next Steps

${result.nextSteps.slice(0, 5).map(step => `${step}`).join('\n')}

## Generated Reports

- **Executive Summary:** ${result.reportPaths.executive}
- **Detailed Technical:** ${result.reportPaths.detailed}
- **Compliance Report:** ${result.reportPaths.compliance}

---

**Phase 9 Validation Completed:** ${new Date().toISOString()}
`;

    writeFileSync(summaryPath, summary, 'utf8');

    console.log('\n' + '='.repeat(80));
    console.log('🎯 PHASE 9 VALIDATION COMPLETE');
    console.log('='.repeat(80));
    console.log(summary);
    console.log('='.repeat(80));
  }
}