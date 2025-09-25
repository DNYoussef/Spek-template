/**
 * Production Validation Runner - Real Theater Elimination Validation
 * Executes complete validation workflow with evidence generation
 */

const TheaterEliminationDemo = require('./theater-elimination-demo');
const EvidenceGenerator = require('./evidence-generator');
const path = require('path');
const fs = require('fs').promises;

class ProductionValidationRunner {
  constructor() {
    this.demo = new TheaterEliminationDemo();
    this.evidenceGenerator = new EvidenceGenerator();
    this.validationResults = new Map();
    this.currentValidation = null;
  }

  /**
   * Run complete production validation workflow
   */
  async runProductionValidation(targetFiles = []) {
    const validation = {
      id: `prod-validation-${Date.now()}`,
      startTime: new Date().toISOString(),
      targetFiles: targetFiles.length > 0 ? targetFiles : await this.getDefaultTargetFiles(),
      phases: {},
      evidence: null,
      certification: null,
      success: false
    };

    console.log('\n PRODUCTION VALIDATION RUNNER');
    console.log('===============================');
    console.log(`Validation ID: ${validation.id}`);
    console.log(`Target Files: ${validation.targetFiles.length}`);
    console.log('===============================\n');

    try {
      this.currentValidation = validation;

      // Phase 1: Execute theater elimination demonstration
      console.log(' Phase 1: Theater Elimination Demonstration');
      validation.phases.demonstration = await this.demo.executeDemonstration(validation.targetFiles);
      console.log(`   Demo Success: ${validation.phases.demonstration.success ? 'YES' : 'NO'}\n`);

      // Phase 2: Generate comprehensive evidence
      console.log(' Phase 2: Evidence Generation');
      validation.phases.evidenceGeneration = await this.evidenceGenerator.generateEvidencePackage(
        validation.phases.demonstration,
        validation.targetFiles
      );
      console.log(`   Evidence Success: ${validation.phases.evidenceGeneration.success ? 'YES' : 'NO'}\n`);

      // Phase 3: Production readiness assessment
      console.log(' Phase 3: Production Readiness Assessment');
      validation.phases.productionAssessment = await this.assessProductionReadiness(validation);
      console.log(`   Production Ready: ${validation.phases.productionAssessment.ready ? 'YES' : 'NO'}\n`);

      // Phase 4: Generate final certification
      console.log(' Phase 4: Final Certification');
      validation.phases.certification = await this.generateFinalCertification(validation);
      console.log(`   Certification: ${validation.phases.certification.status}\n`);

      // Determine overall success
      validation.success = this.evaluateValidationSuccess(validation);
      validation.endTime = new Date().toISOString();

      // Store results
      this.validationResults.set(validation.id, validation);

      // Generate final report
      const report = await this.generateValidationReport(validation);
      validation.report = report;

      this.displayFinalResults(validation);

      return validation;
    } catch (error) {
      validation.error = error.message;
      validation.endTime = new Date().toISOString();
      console.log(`\n VALIDATION FAILED: ${error.message}\n`);
      return validation;
    } finally {
      this.currentValidation = null;
    }
  }

  /**
   * Get default target files for validation
   */
  async getDefaultTargetFiles() {
    const defaultFiles = [
      path.join(__dirname, 'real-swarm-orchestrator.js'),
      path.join(__dirname, 'authentic-princess-system.js'),
      path.join(__dirname, 'nine-stage-implementation.js'),
      path.join(__dirname, 'sandbox-validation-engine.js'),
      path.join(__dirname, 'theater-elimination-demo.js')
    ];

    // Filter to existing files
    const existingFiles = [];
    for (const file of defaultFiles) {
      try {
        await fs.access(file);
        existingFiles.push(file);
      } catch (error) {
        // File doesn't exist, skip
      }
    }

    return existingFiles;
  }

  /**
   * Assess production readiness
   */
  async assessProductionReadiness(validation) {
    const assessment = {
      ready: false,
      score: 0,
      criteria: {},
      blockers: [],
      recommendations: []
    };

    try {
      // Criteria 1: Demonstration success
      assessment.criteria.demonstrationSuccess = validation.phases.demonstration?.success || false;

      // Criteria 2: Evidence quality
      assessment.criteria.evidenceQuality = validation.phases.evidenceGeneration?.success || false;

      // Criteria 3: Theater score
      const theaterScore = validation.phases.demonstration?.evidence?.theaterElimination?.finalScore || 0;
      assessment.criteria.theaterScore = theaterScore >= 60;

      // Criteria 4: Functional verification
      const functionalVerified = validation.phases.evidenceGeneration?.evidence?.functional?.summary?.functionalityVerified || false;
      assessment.criteria.functionalVerification = functionalVerified;

      // Criteria 5: Sandbox validation
      const sandboxValidated = validation.phases.demonstration?.phases?.sandbox?.success || false;
      assessment.criteria.sandboxValidation = sandboxValidated;

      // Criteria 6: Princess deployment
      const princessDeployed = validation.phases.demonstration?.phases?.princesses?.success || false;
      assessment.criteria.princessDeployment = princessDeployed;

      // Criteria 7: Nine-stage completion
      const nineStageCompleted = validation.phases.demonstration?.phases?.nineStage?.success || false;
      assessment.criteria.nineStageCompletion = nineStageCompleted;

      // Criteria 8: Compliance evidence
      const complianceEvidence = validation.phases.evidenceGeneration?.evidence?.compliance?.summary?.certified || false;
      assessment.criteria.complianceEvidence = complianceEvidence;

      // Calculate score
      const criteriaCount = Object.values(assessment.criteria).filter(Boolean).length;
      const totalCriteria = Object.keys(assessment.criteria).length;
      assessment.score = Math.round((criteriaCount / totalCriteria) * 100);

      // Determine readiness
      assessment.ready = assessment.score >= 80; // 80% threshold

      // Generate blockers
      for (const [criterion, passed] of Object.entries(assessment.criteria)) {
        if (!passed) {
          assessment.blockers.push(this.getCriterionBlocker(criterion));
        }
      }

      // Generate recommendations
      assessment.recommendations = this.generateProductionRecommendations(assessment);

      return assessment;
    } catch (error) {
      assessment.error = error.message;
      return assessment;
    }
  }

  /**
   * Get criterion blocker description
   */
  getCriterionBlocker(criterion) {
    const blockers = {
      demonstrationSuccess: 'Theater elimination demonstration must complete successfully',
      evidenceQuality: 'Evidence generation must produce valid evidence package',
      theaterScore: 'Theater score must reach 60/100 or higher',
      functionalVerification: 'All functional verification tests must pass',
      sandboxValidation: 'Sandbox environment validation must succeed',
      princessDeployment: 'Princess agent deployment must be successful',
      nineStageCompletion: 'Nine-stage elimination process must complete',
      complianceEvidence: 'Compliance certification must be achieved'
    };

    return blockers[criterion] || `${criterion} requirement must be met`;
  }

  /**
   * Generate production recommendations
   */
  generateProductionRecommendations(assessment) {
    const recommendations = [];

    if (assessment.ready) {
      recommendations.push('System is production-ready and can be deployed');
      recommendations.push('Continue monitoring theater patterns in production');
      recommendations.push('Implement regular theater elimination audits');
    } else {
      recommendations.push('Address blocking issues before production deployment');

      if (assessment.score < 60) {
        recommendations.push('Significant improvements needed - consider redesign');
      } else if (assessment.score < 80) {
        recommendations.push('Minor improvements needed for production readiness');
      }

      if (assessment.blockers.length > 0) {
        recommendations.push(`Focus on resolving ${assessment.blockers.length} blocking issues`);
      }
    }

    return recommendations;
  }

  /**
   * Generate final certification
   */
  async generateFinalCertification(validation) {
    const certification = {
      id: `final-cert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      validationId: validation.id,
      status: 'PENDING',
      level: 'NONE',
      authority: 'Production Validation System',
      validity: '6 months',
      criteria: {},
      evidence: {},
      restrictions: []
    };

    try {
      // Aggregate criteria from production assessment
      const productionAssessment = validation.phases.productionAssessment;
      certification.criteria = productionAssessment?.criteria || {};

      // Evidence summary
      certification.evidence = {
        demonstrationEvidence: validation.phases.demonstration?.success || false,
        evidencePackage: validation.phases.evidenceGeneration?.success || false,
        productionAssessment: productionAssessment?.ready || false,
        theaterScore: validation.phases.demonstration?.evidence?.theaterElimination?.finalScore || 0,
        functionalTests: validation.phases.evidenceGeneration?.evidence?.functional?.summary?.testsPassed || 0
      };

      // Determine certification level
      const overallScore = productionAssessment?.score || 0;

      if (overallScore >= 95) {
        certification.status = 'CERTIFIED';
        certification.level = 'PRODUCTION_EXCELLENCE';
      } else if (overallScore >= 80) {
        certification.status = 'CERTIFIED';
        certification.level = 'PRODUCTION_READY';
      } else if (overallScore >= 60) {
        certification.status = 'CONDITIONALLY_CERTIFIED';
        certification.level = 'STAGING_READY';
        certification.restrictions.push('Requires additional theater elimination before production');
      } else {
        certification.status = 'NOT_CERTIFIED';
        certification.level = 'DEVELOPMENT_ONLY';
        certification.restrictions.push('Not suitable for production deployment');
        certification.restrictions.push('Significant theater elimination required');
      }

      return certification;
    } catch (error) {
      certification.error = error.message;
      certification.status = 'ERROR';
      return certification;
    }
  }

  /**
   * Evaluate validation success
   */
  evaluateValidationSuccess(validation) {
    try {
      return validation.phases.demonstration?.success &&
             validation.phases.evidenceGeneration?.success &&
             validation.phases.productionAssessment?.ready &&
             validation.phases.certification?.status === 'CERTIFIED';
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate validation report
   */
  async generateValidationReport(validation) {
    const report = {
      id: `report-${validation.id}`,
      timestamp: new Date().toISOString(),
      validation: validation.id,
      summary: {},
      details: {},
      recommendations: [],
      attachments: []
    };

    try {
      // Summary
      report.summary = {
        validationSuccess: validation.success,
        duration: this.calculateDuration(validation.startTime, validation.endTime),
        targetFiles: validation.targetFiles.length,
        theaterScore: validation.phases.demonstration?.evidence?.theaterElimination?.finalScore || 0,
        productionReady: validation.phases.productionAssessment?.ready || false,
        certification: validation.phases.certification?.status || 'UNKNOWN'
      };

      // Details
      report.details = {
        phases: this.summarizePhases(validation.phases),
        evidence: this.summarizeEvidence(validation.phases.evidenceGeneration),
        blockers: validation.phases.productionAssessment?.blockers || [],
        criteriaScore: validation.phases.productionAssessment?.score || 0
      };

      // Recommendations
      report.recommendations = [
        ...(validation.phases.productionAssessment?.recommendations || []),
        ...(validation.phases.demonstration?.evidence?.productionReadiness?.recommendations || [])
      ];

      // Save report to file
      const reportPath = await this.saveValidationReport(report, validation);
      report.attachments.push(reportPath);

      return report;
    } catch (error) {
      report.error = error.message;
      return report;
    }
  }

  /**
   * Calculate duration
   */
  calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    return Math.round((new Date(endTime) - new Date(startTime)) / 1000);
  }

  /**
   * Summarize phases
   */
  summarizePhases(phases) {
    const summary = {};
    for (const [phaseName, phaseResult] of Object.entries(phases)) {
      summary[phaseName] = {
        success: phaseResult.success,
        error: phaseResult.error || null
      };
    }
    return summary;
  }

  /**
   * Summarize evidence
   */
  summarizeEvidence(evidencePhase) {
    if (!evidencePhase?.evidence) return {};

    return {
      beforeAfter: evidencePhase.evidence.beforeAfter?.summary || {},
      functional: evidencePhase.evidence.functional?.summary || {},
      sandbox: evidencePhase.evidence.sandbox?.summary || {},
      quality: evidencePhase.evidence.quality?.summary || {},
      compliance: evidencePhase.evidence.compliance?.summary || {}
    };
  }

  /**
   * Save validation report
   */
  async saveValidationReport(report, validation) {
    try {
      const reportsDir = path.join(process.cwd(), '.claude', '.artifacts', 'validation-reports');
      await fs.mkdir(reportsDir, { recursive: true });

      // Save JSON report
      const jsonFilename = `validation-report-${validation.id}.json`;
      const jsonPath = path.join(reportsDir, jsonFilename);
      await fs.writeFile(jsonPath, JSON.stringify({ report, validation }, null, 2));

      // Save markdown summary
      const mdFilename = `validation-summary-${validation.id}.md`;
      const mdPath = path.join(reportsDir, mdFilename);
      const mdContent = this.generateMarkdownReport(report, validation);
      await fs.writeFile(mdPath, mdContent);

      return {
        jsonReport: jsonPath,
        markdownSummary: mdPath
      };
    } catch (error) {
      throw new Error(`Failed to save validation report: ${error.message}`);
    }
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report, validation) {
    return `# Production Validation Report

## Validation Summary
- **Validation ID:** ${validation.id}
- **Timestamp:** ${validation.startTime}
- **Duration:** ${report.summary.duration} seconds
- **Target Files:** ${report.summary.targetFiles}
- **Overall Success:** ${validation.success ? 'YES' : 'NO'}

## Theater Elimination Results
- **Theater Score:** ${report.summary.theaterScore}/100
- **Production Ready:** ${report.summary.productionReady ? 'YES' : 'NO'}
- **Certification:** ${report.summary.certification}

## Phase Results
${Object.entries(report.details.phases).map(([phase, result]) =>
  `- **${phase}:** ${result.success ? 'SUCCESS' : 'FAILED'}${result.error ? ` (${result.error})` : ''}`
).join('\n')}

## Criteria Score
**Overall Score:** ${report.details.criteriaScore}%

## Blocking Issues
${report.details.blockers.length > 0 ?
  report.details.blockers.map(blocker => `- ${blocker}`).join('\n') :
  'No blocking issues identified'
}

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Evidence Summary
- **Before/After Analysis:** ${report.details.evidence.beforeAfter ? 'AVAILABLE' : 'MISSING'}
- **Functional Verification:** ${report.details.evidence.functional ? 'AVAILABLE' : 'MISSING'}
- **Sandbox Testing:** ${report.details.evidence.sandbox ? 'AVAILABLE' : 'MISSING'}
- **Quality Metrics:** ${report.details.evidence.quality ? 'AVAILABLE' : 'MISSING'}
- **Compliance Evidence:** ${report.details.evidence.compliance ? 'AVAILABLE' : 'MISSING'}

---
*Generated by Production Validation Runner*
*Validation System Version: 2.0.0*
`;
  }

  /**
   * Display final results
   */
  displayFinalResults(validation) {
    console.log(' PRODUCTION VALIDATION COMPLETE');
    console.log('=================================');
    console.log(`Validation ID: ${validation.id}`);
    console.log(`Duration: ${this.calculateDuration(validation.startTime, validation.endTime)} seconds`);
    console.log(`Overall Success: ${validation.success ? 'YES' : 'NO'}`);
    console.log('=================================\n');

    console.log(' RESULTS SUMMARY:');
    console.log(`   Theater Score: ${validation.phases.demonstration?.evidence?.theaterElimination?.finalScore || 0}/100`);
    console.log(`   Production Ready: ${validation.phases.productionAssessment?.ready ? 'YES' : 'NO'}`);
    console.log(`   Certification: ${validation.phases.certification?.status || 'UNKNOWN'}`);
    console.log(`   Evidence Package: ${validation.phases.evidenceGeneration?.success ? 'COMPLETE' : 'INCOMPLETE'}`);

    if (validation.phases.productionAssessment?.blockers?.length > 0) {
      console.log('\n BLOCKING ISSUES:');
      validation.phases.productionAssessment.blockers.forEach(blocker => {
        console.log(`    ${blocker}`);
      });
    }

    if (validation.phases.productionAssessment?.recommendations?.length > 0) {
      console.log('\n RECOMMENDATIONS:');
      validation.phases.productionAssessment.recommendations.forEach(rec => {
        console.log(`    ${rec}`);
      });
    }

    console.log('\n VALIDATION COMPLETE');
    console.log('=====================\n');
  }

  /**
   * Get validation status
   */
  getStatus() {
    return {
      currentValidation: this.currentValidation?.id || null,
      completedValidations: this.validationResults.size,
      demoStatus: this.demo.getStatus(),
      evidenceStats: this.evidenceGenerator.getStatistics()
    };
  }

  /**
   * Get validation results
   */
  getValidationResults(validationId = null) {
    if (validationId) {
      return this.validationResults.get(validationId) || { error: 'Validation not found' };
    }
    return Array.from(this.validationResults.values());
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    const cleanup = {
      demo: await this.demo.cleanup(),
      validationResults: this.validationResults.size
    };

    this.validationResults.clear();
    this.currentValidation = null;

    return cleanup;
  }
}

module.exports = ProductionValidationRunner;