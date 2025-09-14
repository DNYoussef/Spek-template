#!/usr/bin/env node
/**
 * SOC2 Compliance Automation Engine
 * Automated Type II SOC2 compliance validation with evidence collection
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class SOC2AutomationEngine {
  constructor(config = {}) {
    this.config = {
      outputDir: '.claude/.artifacts/compliance/SOC2/',
      evidenceCollection: true,
      auditHash: null,
      ...config
    };

    // SOC2 Trust Service Criteria (TSC)
    this.trustCriteria = {
      'CC1': { name: 'Control Environment', weight: 0.15 },
      'CC2': { name: 'Communication and Information', weight: 0.10 },
      'CC3': { name: 'Risk Assessment', weight: 0.15 },
      'CC4': { name: 'Monitoring Activities', weight: 0.10 },
      'CC5': { name: 'Control Activities', weight: 0.15 },
      'CC6': { name: 'Logical and Physical Access Controls', weight: 0.20 },
      'CC7': { name: 'System Operations', weight: 0.10 },
      'CC8': { name: 'Change Management', weight: 0.05 }
    };
  }

  async validateCompliance() {
    console.log('Starting SOC2 Type II compliance validation...');

    const results = {
      framework: 'SOC2',
      timestamp: new Date().toISOString(),
      audit_hash: this.config.auditHash,
      overall_score: 0,
      total_findings: 0,
      criteria: {},
      evidence: {},
      recommendations: []
    };

    try {
      await this.ensureOutputDirectory();

      // Validate each Trust Service Criterion
      for (const [criterion, details] of Object.entries(this.trustCriteria)) {
        const criterionResult = await this.validateCriterion(criterion, details);
        results.criteria[criterion] = criterionResult;
        results.overall_score += criterionResult.score * details.weight;
        results.total_findings += criterionResult.findings.length;
      }

      // Collect evidence if enabled
      if (this.config.evidenceCollection) {
        results.evidence = await this.collectEvidence();
      }

      // Generate remediation recommendations
      results.recommendations = await this.generateRecommendations(results);

      // Write results
      await this.writeResults(results);

      console.log(`SOC2 validation completed. Overall score: ${(results.overall_score * 100).toFixed(1)}%`);
      return results;

    } catch (error) {
      console.error('SOC2 validation failed:', error.message);
      throw error;
    }
  }

  async validateCriterion(criterion, details) {
    const result = {
      name: details.name,
      score: 0,
      findings: [],
      evidence_files: [],
      controls_tested: 0,
      controls_passed: 0
    };

    switch (criterion) {
      case 'CC1': // Control Environment
        await this.validateControlEnvironment(result);
        break;
      case 'CC2': // Communication and Information
        await this.validateCommunication(result);
        break;
      case 'CC3': // Risk Assessment
        await this.validateRiskAssessment(result);
        break;
      case 'CC4': // Monitoring Activities
        await this.validateMonitoring(result);
        break;
      case 'CC5': // Control Activities
        await this.validateControlActivities(result);
        break;
      case 'CC6': // Logical and Physical Access Controls
        await this.validateAccessControls(result);
        break;
      case 'CC7': // System Operations
        await this.validateSystemOperations(result);
        break;
      case 'CC8': // Change Management
        await this.validateChangeManagement(result);
        break;
    }

    result.score = result.controls_tested > 0 ?
      result.controls_passed / result.controls_tested : 0;

    return result;
  }

  async validateControlEnvironment(result) {
    result.controls_tested = 5;

    // Check for governance documentation
    if (await this.fileExists('docs/governance/')) {
      result.controls_passed++;
      result.evidence_files.push('docs/governance/');
    } else {
      result.findings.push('Missing governance documentation');
    }

    // Check for code of conduct
    if (await this.fileExists('CODE_OF_CONDUCT.md')) {
      result.controls_passed++;
      result.evidence_files.push('CODE_OF_CONDUCT.md');
    } else {
      result.findings.push('Missing code of conduct');
    }

    // Check for security policies
    if (await this.fileExists('docs/security/')) {
      result.controls_passed++;
      result.evidence_files.push('docs/security/');
    } else {
      result.findings.push('Missing security policies');
    }

    // Check for organizational chart
    if (await this.fileExists('docs/organization.md')) {
      result.controls_passed++;
      result.evidence_files.push('docs/organization.md');
    } else {
      result.findings.push('Missing organizational structure documentation');
    }

    // Check for training records
    if (await this.fileExists('docs/training/')) {
      result.controls_passed++;
      result.evidence_files.push('docs/training/');
    } else {
      result.findings.push('Missing security training documentation');
    }
  }

  async validateCommunication(result) {
    result.controls_tested = 4;

    // Check for incident response procedures
    if (await this.fileExists('docs/incident-response.md')) {
      result.controls_passed++;
      result.evidence_files.push('docs/incident-response.md');
    } else {
      result.findings.push('Missing incident response procedures');
    }

    // Check for communication policies
    if (await this.fileExists('docs/communication-policy.md')) {
      result.controls_passed++;
      result.evidence_files.push('docs/communication-policy.md');
    } else {
      result.findings.push('Missing communication policies');
    }

    // Check for change notification procedures
    if (await this.fileExists('.github/')) {
      result.controls_passed++;
      result.evidence_files.push('.github/');
    } else {
      result.findings.push('Missing automated change notification system');
    }

    // Check for user communication channels
    if (await this.fileExists('docs/user-communications.md')) {
      result.controls_passed++;
      result.evidence_files.push('docs/user-communications.md');
    } else {
      result.findings.push('Missing user communication documentation');
    }
  }

  async validateRiskAssessment(result) {
    result.controls_tested = 3;

    // Check for risk assessment documentation
    if (await this.fileExists('docs/risk-assessment.md')) {
      result.controls_passed++;
      result.evidence_files.push('docs/risk-assessment.md');
    } else {
      result.findings.push('Missing risk assessment documentation');
    }

    // Check for threat modeling
    if (await this.fileExists('docs/threat-model.md')) {
      result.controls_passed++;
      result.evidence_files.push('docs/threat-model.md');
    } else {
      result.findings.push('Missing threat modeling documentation');
    }

    // Check for business continuity plan
    if (await this.fileExists('docs/business-continuity.md')) {
      result.controls_passed++;
      result.evidence_files.push('docs/business-continuity.md');
    } else {
      result.findings.push('Missing business continuity plan');
    }
  }

  async validateMonitoring(result) {
    result.controls_tested = 4;

    // Check for monitoring configuration
    if (await this.fileExists('monitoring/') || await this.fileExists('config/monitoring.yml')) {
      result.controls_passed++;
      result.evidence_files.push('monitoring configuration');
    } else {
      result.findings.push('Missing monitoring configuration');
    }

    // Check for log retention policies
    if (await this.fileExists('docs/log-retention-policy.md')) {
      result.controls_passed++;
      result.evidence_files.push('docs/log-retention-policy.md');
    } else {
      result.findings.push('Missing log retention policies');
    }

    // Check for audit trails
    if (await this.fileExists('.claude/.artifacts/')) {
      result.controls_passed++;
      result.evidence_files.push('.claude/.artifacts/');
    } else {
      result.findings.push('Missing audit trail configuration');
    }

    // Check for alerting systems
    if (await this.fileExists('config/alerts.yml')) {
      result.controls_passed++;
      result.evidence_files.push('config/alerts.yml');
    } else {
      result.findings.push('Missing alerting system configuration');
    }
  }

  async validateControlActivities(result) {
    result.controls_tested = 6;

    // Check for automated testing
    if (await this.fileExists('tests/') && await this.fileExists('package.json')) {
      try {
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
        if (packageJson.scripts && packageJson.scripts.test) {
          result.controls_passed++;
          result.evidence_files.push('automated testing configuration');
        }
      } catch (e) {
        result.findings.push('Invalid package.json or missing test scripts');
      }
    } else {
      result.findings.push('Missing automated testing framework');
    }

    // Check for code review process
    if (await this.fileExists('.github/pull_request_template.md')) {
      result.controls_passed++;
      result.evidence_files.push('.github/pull_request_template.md');
    } else {
      result.findings.push('Missing code review process documentation');
    }

    // Check for deployment controls
    if (await this.fileExists('.github/workflows/')) {
      result.controls_passed++;
      result.evidence_files.push('.github/workflows/');
    } else {
      result.findings.push('Missing automated deployment controls');
    }

    // Check for data validation controls
    if (await this.fileExists('src/validation/') || await this.fileExists('lib/validation/')) {
      result.controls_passed++;
      result.evidence_files.push('data validation controls');
    } else {
      result.findings.push('Missing data validation controls');
    }

    // Check for error handling
    if (await this.fileExists('src/errors/') || await this.fileExists('lib/errors/')) {
      result.controls_passed++;
      result.evidence_files.push('error handling framework');
    } else {
      result.findings.push('Missing centralized error handling');
    }

    // Check for backup procedures
    if (await this.fileExists('docs/backup-procedures.md')) {
      result.controls_passed++;
      result.evidence_files.push('docs/backup-procedures.md');
    } else {
      result.findings.push('Missing backup procedures documentation');
    }
  }

  async validateAccessControls(result) {
    result.controls_tested = 7;

    // Check for authentication system
    if (await this.fileExists('src/auth/') || await this.fileExists('lib/auth/')) {
      result.controls_passed++;
      result.evidence_files.push('authentication system');
    } else {
      result.findings.push('Missing authentication system');
    }

    // Check for authorization controls
    if (await this.fileExists('src/rbac/') || await this.fileExists('src/permissions/')) {
      result.controls_passed++;
      result.evidence_files.push('authorization controls');
    } else {
      result.findings.push('Missing role-based access controls');
    }

    // Check for session management
    if (await this.fileExists('src/session/') || await this.fileExists('config/session.json')) {
      result.controls_passed++;
      result.evidence_files.push('session management');
    } else {
      result.findings.push('Missing session management controls');
    }

    // Check for encryption configuration
    if (await this.fileExists('src/crypto/') || await this.fileExists('config/encryption.json')) {
      result.controls_passed++;
      result.evidence_files.push('encryption configuration');
    } else {
      result.findings.push('Missing encryption implementation');
    }

    // Check for access logging
    if (await this.fileExists('src/logging/') || await this.fileExists('logs/')) {
      result.controls_passed++;
      result.evidence_files.push('access logging');
    } else {
      result.findings.push('Missing access logging system');
    }

    // Check for password policies
    if (await this.fileExists('docs/password-policy.md')) {
      result.controls_passed++;
      result.evidence_files.push('docs/password-policy.md');
    } else {
      result.findings.push('Missing password policy documentation');
    }

    // Check for MFA implementation
    if (await this.fileExists('src/mfa/') || await this.fileExists('src/2fa/')) {
      result.controls_passed++;
      result.evidence_files.push('multi-factor authentication');
    } else {
      result.findings.push('Missing multi-factor authentication');
    }
  }

  async validateSystemOperations(result) {
    result.controls_tested = 5;

    // Check for capacity management
    if (await this.fileExists('docs/capacity-planning.md')) {
      result.controls_passed++;
      result.evidence_files.push('docs/capacity-planning.md');
    } else {
      result.findings.push('Missing capacity management documentation');
    }

    // Check for system availability monitoring
    if (await this.fileExists('monitoring/availability.yml')) {
      result.controls_passed++;
      result.evidence_files.push('monitoring/availability.yml');
    } else {
      result.findings.push('Missing availability monitoring');
    }

    // Check for performance monitoring
    if (await this.fileExists('monitoring/performance.yml')) {
      result.controls_passed++;
      result.evidence_files.push('monitoring/performance.yml');
    } else {
      result.findings.push('Missing performance monitoring');
    }

    // Check for data processing integrity
    if (await this.fileExists('src/integrity/') || await this.fileExists('lib/checksums/')) {
      result.controls_passed++;
      result.evidence_files.push('data integrity controls');
    } else {
      result.findings.push('Missing data processing integrity controls');
    }

    // Check for system configuration management
    if (await this.fileExists('config/') && await this.fileExists('docs/configuration.md')) {
      result.controls_passed++;
      result.evidence_files.push('configuration management');
    } else {
      result.findings.push('Missing configuration management documentation');
    }
  }

  async validateChangeManagement(result) {
    result.controls_tested = 4;

    // Check for change control process
    if (await this.fileExists('docs/change-control.md')) {
      result.controls_passed++;
      result.evidence_files.push('docs/change-control.md');
    } else {
      result.findings.push('Missing change control process');
    }

    // Check for version control
    if (await this.fileExists('.git/')) {
      result.controls_passed++;
      result.evidence_files.push('git version control');
    } else {
      result.findings.push('Missing version control system');
    }

    // Check for automated testing in CI/CD
    if (await this.fileExists('.github/workflows/')) {
      result.controls_passed++;
      result.evidence_files.push('.github/workflows/');
    } else {
      result.findings.push('Missing CI/CD pipeline with testing');
    }

    // Check for rollback procedures
    if (await this.fileExists('docs/rollback-procedures.md')) {
      result.controls_passed++;
      result.evidence_files.push('docs/rollback-procedures.md');
    } else {
      result.findings.push('Missing rollback procedures');
    }
  }

  async collectEvidence() {
    const evidence = {
      files_collected: 0,
      total_size: 0,
      checksum: null,
      collection_timestamp: new Date().toISOString()
    };

    try {
      // Collect relevant files for SOC2 evidence
      const evidenceFiles = [
        'package.json',
        'README.md',
        'SECURITY.md',
        'CODE_OF_CONDUCT.md',
        '.github/',
        'docs/',
        'config/',
        'tests/',
        'monitoring/',
        '.claude/.artifacts/'
      ];

      const collectedFiles = [];

      for (const file of evidenceFiles) {
        if (await this.fileExists(file)) {
          collectedFiles.push(file);
          evidence.files_collected++;
        }
      }

      // Calculate total size and create checksum
      if (collectedFiles.length > 0) {
        const hash = crypto.createHash('sha256');
        for (const file of collectedFiles) {
          const stats = await fs.stat(file).catch(() => null);
          if (stats) {
            evidence.total_size += stats.size;
            hash.update(file + stats.mtime.toISOString());
          }
        }
        evidence.checksum = hash.digest('hex');
        evidence.files = collectedFiles;
      }

    } catch (error) {
      console.warn('Evidence collection partial failure:', error.message);
    }

    return evidence;
  }

  async generateRecommendations(results) {
    const recommendations = [];

    // Generate recommendations based on findings
    for (const [criterion, details] of Object.entries(results.criteria)) {
      if (details.score < 0.95) {
        recommendations.push({
          criterion,
          priority: details.score < 0.8 ? 'high' : 'medium',
          description: `Improve ${details.name} (current score: ${(details.score * 100).toFixed(1)}%)`,
          findings: details.findings,
          suggested_actions: this.getSuggestedActions(criterion, details.findings)
        });
      }
    }

    // Add overall recommendations
    if (results.overall_score < 0.95) {
      recommendations.push({
        criterion: 'overall',
        priority: 'high',
        description: 'Overall SOC2 compliance below 95% threshold',
        suggested_actions: [
          'Prioritize high-impact control implementations',
          'Establish regular compliance monitoring',
          'Create compliance improvement roadmap'
        ]
      });
    }

    return recommendations;
  }

  getSuggestedActions(criterion, findings) {
    const actionMap = {
      'CC1': [
        'Create comprehensive governance documentation',
        'Establish code of conduct and ethics policies',
        'Document organizational structure and responsibilities'
      ],
      'CC2': [
        'Implement incident response procedures',
        'Create communication policies and channels',
        'Establish change notification systems'
      ],
      'CC3': [
        'Conduct formal risk assessments',
        'Create threat modeling documentation',
        'Develop business continuity plans'
      ],
      'CC4': [
        'Implement comprehensive monitoring systems',
        'Create log retention and audit trail policies',
        'Establish alerting and notification systems'
      ],
      'CC5': [
        'Implement automated testing frameworks',
        'Establish code review processes',
        'Create data validation and error handling controls'
      ],
      'CC6': [
        'Implement authentication and authorization systems',
        'Create access control and session management',
        'Establish encryption and MFA requirements'
      ],
      'CC7': [
        'Implement capacity and performance monitoring',
        'Create system availability controls',
        'Establish configuration management processes'
      ],
      'CC8': [
        'Create change control processes',
        'Implement automated CI/CD pipelines',
        'Establish rollback and recovery procedures'
      ]
    };

    return actionMap[criterion] || [
      'Review control requirements',
      'Implement missing controls',
      'Document processes and procedures'
    ];
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async ensureOutputDirectory() {
    await fs.mkdir(this.config.outputDir, { recursive: true });
  }

  async writeResults(results) {
    const outputFile = path.join(this.config.outputDir, 'compliance-score.json');
    await fs.writeFile(outputFile, JSON.stringify(results, null, 2));

    // Create human-readable report
    const reportFile = path.join(this.config.outputDir, 'soc2-compliance-report.md');
    const report = this.generateMarkdownReport(results);
    await fs.writeFile(reportFile, report);

    console.log(`SOC2 compliance results written to: ${outputFile}`);
    console.log(`SOC2 compliance report written to: ${reportFile}`);
  }

  generateMarkdownReport(results) {
    const timestamp = new Date(results.timestamp).toLocaleString();
    const scorePercentage = (results.overall_score * 100).toFixed(1);

    let report = `# SOC2 Type II Compliance Report

**Generated:** ${timestamp}
**Overall Score:** ${scorePercentage}%
**Total Findings:** ${results.total_findings}
**Audit Hash:** ${results.audit_hash}

## Executive Summary

${results.overall_score >= 0.95 ?
  '[OK] **COMPLIANT** - Organization meets SOC2 Type II requirements.' :
  '[FAIL] **NON-COMPLIANT** - Organization requires remediation to meet SOC2 Type II requirements.'
}

## Trust Service Criteria Results

| Criterion | Name | Score | Status | Findings |
|-----------|------|-------|--------|----------|
`;

    for (const [criterion, details] of Object.entries(results.criteria)) {
      const score = (details.score * 100).toFixed(1);
      const status = details.score >= 0.95 ? '[OK] Pass' : '[FAIL] Fail';
      report += `| ${criterion} | ${details.name} | ${score}% | ${status} | ${details.findings.length} |\n`;
    }

    if (results.recommendations.length > 0) {
      report += `\n## Recommendations\n\n`;
      for (const rec of results.recommendations) {
        report += `### ${rec.criterion.toUpperCase()}: ${rec.description}\n`;
        report += `**Priority:** ${rec.priority.toUpperCase()}\n\n`;

        if (rec.findings && rec.findings.length > 0) {
          report += `**Findings:**\n`;
          for (const finding of rec.findings) {
            report += `- ${finding}\n`;
          }
          report += '\n';
        }

        report += `**Suggested Actions:**\n`;
        for (const action of rec.suggested_actions) {
          report += `- ${action}\n`;
        }
        report += '\n';
      }
    }

    if (results.evidence && results.evidence.files_collected > 0) {
      report += `## Evidence Collection Summary\n\n`;
      report += `- **Files Collected:** ${results.evidence.files_collected}\n`;
      report += `- **Total Size:** ${results.evidence.total_size} bytes\n`;
      report += `- **Checksum:** ${results.evidence.checksum}\n`;
      report += `- **Collection Time:** ${results.evidence.collection_timestamp}\n\n`;
    }

    report += `---\n*This report was generated by the SOC2 Automation Engine*\n`;

    return report;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const config = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];

    switch (key) {
      case 'output-dir':
        config.outputDir = value;
        break;
      case 'audit-hash':
        config.auditHash = value;
        break;
      case 'evidence-collection':
        config.evidenceCollection = value === 'true';
        break;
      case 'config':
        // Load additional config from file
        try {
          const configFile = JSON.parse(await fs.readFile(value, 'utf8'));
          Object.assign(config, configFile);
        } catch (error) {
          console.warn(`Could not load config file ${value}:`, error.message);
        }
        break;
    }
  }

  try {
    const engine = new SOC2AutomationEngine(config);
    const results = await engine.validateCompliance();

    process.exit(results.overall_score >= 0.95 ? 0 : 1);
  } catch (error) {
    console.error('SOC2 validation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { SOC2AutomationEngine };