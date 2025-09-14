#!/usr/bin/env node
/**
 * Automated Compliance Remediation Engine
 * Provides intelligent remediation suggestions and automated fixes for compliance gaps
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ComplianceRemediationEngine {
  constructor(config = {}) {
    this.config = {
      autoFix: false,
      createPRs: false,
      outputDir: '.claude/.artifacts/compliance/',
      dryRun: true,
      maxAutomatedFixes: 5,
      ...config
    };

    // Remediation templates and patterns
    this.remediationTemplates = this._initializeRemediationTemplates();
    this.automatedFixes = this._initializeAutomatedFixes();
  }

  _initializeRemediationTemplates() {
    return {
      'missing_security_policy': {
        type: 'file_creation',
        template: `# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | [OK]                 |

## Reporting a Vulnerability

Please report security vulnerabilities via:
- Email: security@example.com
- Security advisory: Use GitHub Security Advisories

## Response Timeline

- Initial response: Within 48 hours
- Status update: Within 7 days
- Resolution target: 30-90 days depending on severity

## Security Measures

- All dependencies are regularly updated
- Code undergoes security review
- Automated security scanning in CI/CD
`,
        filename: 'SECURITY.md',
        frameworks: ['SOC2', 'ISO27001', 'NIST-SSDF'],
        automation_level: 'full'
      },

      'missing_code_of_conduct': {
        type: 'file_creation',
        template: `# Code of Conduct

## Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

## Our Standards

Examples of behavior that contributes to a positive environment:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

## Enforcement

Project maintainers are responsible for clarifying standards and taking corrective action.

## Contact

Report issues to: conduct@example.com
`,
        filename: 'CODE_OF_CONDUCT.md',
        frameworks: ['SOC2'],
        automation_level: 'full'
      },

      'missing_pr_template': {
        type: 'file_creation',
        template: `## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Security Considerations
- [ ] Changes reviewed for security implications
- [ ] No sensitive data exposed
- [ ] Dependencies reviewed and updated

## Testing
- [ ] Tests pass
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Security considerations addressed
`,
        filename: '.github/pull_request_template.md',
        frameworks: ['SOC2', 'NIST-SSDF'],
        automation_level: 'full'
      },

      'missing_dependabot': {
        type: 'file_creation',
        template: `version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    reviewers:
      - "security-team"
    labels:
      - "security"
      - "dependencies"
    
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
`,
        filename: '.github/dependabot.yml',
        frameworks: ['SOC2', 'ISO27001', 'NIST-SSDF'],
        automation_level: 'full'
      },

      'missing_security_workflow': {
        type: 'file_creation',
        template: `name: Security Scanning

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday

permissions:
  contents: read
  security-events: write

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript, python
          
      - name: Autobuild
        uses: github/codeql-action/autobuild@v3
        
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        
      - name: Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'compliance-automation'
          path: '.'
          format: 'SARIF'
          
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: reports/dependency-check-report.sarif
`,
        filename: '.github/workflows/security.yml',
        frameworks: ['SOC2', 'ISO27001', 'NIST-SSDF'],
        automation_level: 'full'
      }
    };
  }

  _initializeAutomatedFixes() {
    return {
      'add_package_json_security_scripts': {
        description: 'Add security scripts to package.json',
        condition: (projectFiles) => projectFiles.includes('package.json'),
        action: async (projectPath) => {
          const packageJsonPath = path.join(projectPath, 'package.json');
          const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
          
          if (!packageJson.scripts) {
            packageJson.scripts = {};
          }

          const securityScripts = {
            'security:audit': 'npm audit',
            'security:audit-fix': 'npm audit fix',
            'security:check': 'npm run security:audit && npm run test:security',
            'test:security': 'npm run lint && npm run test'
          };

          let modified = false;
          for (const [script, command] of Object.entries(securityScripts)) {
            if (!packageJson.scripts[script]) {
              packageJson.scripts[script] = command;
              modified = true;
            }
          }

          if (modified) {
            await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
            return { modified: true, changes: ['Added security scripts to package.json'] };
          }

          return { modified: false, changes: [] };
        },
        frameworks: ['SOC2', 'NIST-SSDF'],
        automation_level: 'full'
      },

      'create_basic_gitignore': {
        description: 'Create or update .gitignore with security patterns',
        condition: () => true,
        action: async (projectPath) => {
          const gitignorePath = path.join(projectPath, '.gitignore');
          
          const securityPatterns = [
            '# Security and secrets',
            '*.key',
            '*.pem',
            '*.p12',
            '.env',
            '.env.local',
            '.env.*.local',
            'secrets/',
            '*.secret',
            'private.json',
            '',
            '# Logs and artifacts',
            'logs/',
            '*.log',
            '.claude/.artifacts/*/sensitive/',
            '',
            '# OS generated files',
            '.DS_Store',
            'Thumbs.db'
          ].join('\n');

          let existingContent = '';
          try {
            existingContent = await fs.readFile(gitignorePath, 'utf8');
          } catch (error) {
            // File doesn't exist, will be created
          }

          // Check if security patterns are already present
          const hasSecurityPatterns = existingContent.includes('# Security and secrets');
          
          if (!hasSecurityPatterns) {
            const newContent = existingContent + '\n' + securityPatterns;
            await fs.writeFile(gitignorePath, newContent);
            return { modified: true, changes: ['Added security patterns to .gitignore'] };
          }

          return { modified: false, changes: [] };
        },
        frameworks: ['SOC2', 'ISO27001', 'NIST-SSDF'],
        automation_level: 'full'
      },

      'add_pre_commit_hooks': {
        description: 'Add pre-commit security hooks',
        condition: () => true,
        action: async (projectPath) => {
          const preCommitPath = path.join(projectPath, '.pre-commit-config.yaml');
          
          const preCommitConfig = `repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: check-yaml
      - id: end-of-file-fixer
      - id: trailing-whitespace
      - id: check-merge-conflict
      - id: detect-private-key
      
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        
  - repo: https://github.com/gitguardian/ggshield
    rev: v1.21.0
    hooks:
      - id: ggshield
        language: python_venv
        stages: [commit]
`;

          let exists = false;
          try {
            await fs.access(preCommitPath);
            exists = true;
          } catch (error) {
            // File doesn't exist
          }

          if (!exists) {
            await fs.writeFile(preCommitPath, preCommitConfig);
            return { modified: true, changes: ['Created pre-commit security hooks configuration'] };
          }

          return { modified: false, changes: [] };
        },
        frameworks: ['NIST-SSDF'],
        automation_level: 'partial'
      }
    };
  }

  async generateRemediationPlan(complianceResults) {
    console.log('Generating compliance remediation plan...');

    const remediationPlan = {
      timestamp: new Date().toISOString(),
      frameworks_analyzed: [],
      total_findings: 0,
      automated_fixes: [],
      manual_actions: [],
      remediation_phases: [],
      estimated_effort: {
        automated_hours: 0,
        manual_hours: 0,
        total_hours: 0
      }
    };

    // Process each framework's results
    for (const frameworkResult of complianceResults) {
      const framework = frameworkResult.framework || 'Unknown';
      remediationPlan.frameworks_analyzed.push(framework);
      remediationPlan.total_findings += frameworkResult.total_findings || 0;

      // Process findings and generate remediation actions
      await this._processFrameworkFindings(frameworkResult, remediationPlan);
    }

    // Generate remediation phases
    remediationPlan.remediation_phases = this._generateRemediationPhases(remediationPlan);

    // Calculate effort estimates
    remediationPlan.estimated_effort = this._calculateEffortEstimates(remediationPlan);

    return remediationPlan;
  }

  async _processFrameworkFindings(frameworkResult, remediationPlan) {
    const framework = frameworkResult.framework;

    // Process SOC2 findings
    if (framework === 'SOC2') {
      await this._processSOC2Findings(frameworkResult, remediationPlan);
    }
    // Process ISO27001 findings
    else if (framework === 'ISO27001') {
      await this._processISO27001Findings(frameworkResult, remediationPlan);
    }
    // Process NIST-SSDF findings
    else if (framework === 'NIST-SSDF') {
      await this._processNISTSSDF Findings(frameworkResult, remediationPlan);
    }
  }

  async _processSOC2Findings(frameworkResult, remediationPlan) {
    // Process SOC2 criteria findings
    const criteria = frameworkResult.criteria || {};
    
    for (const [criterion, details] of Object.entries(criteria)) {
      for (const finding of details.findings || []) {
        const remediationAction = this._mapFindingToRemediation(finding, 'SOC2', criterion);
        if (remediationAction) {
          if (remediationAction.automated) {
            remediationPlan.automated_fixes.push(remediationAction);
          } else {
            remediationPlan.manual_actions.push(remediationAction);
          }
        }
      }
    }
  }

  async _processISO27001Findings(frameworkResult, remediationPlan) {
    // Process ISO27001 domain findings
    const domains = frameworkResult.domains || {};
    
    for (const [domain, details] of Object.entries(domains)) {
      for (const finding of details.findings || []) {
        const remediationAction = this._mapFindingToRemediation(finding, 'ISO27001', domain);
        if (remediationAction) {
          if (remediationAction.automated) {
            remediationPlan.automated_fixes.push(remediationAction);
          } else {
            remediationPlan.manual_actions.push(remediationAction);
          }
        }
      }
    }
  }

  async _processNISTSSDF Findings(frameworkResult, remediationPlan) {
    // Process NIST-SSDF gap analysis
    const gapAnalysis = frameworkResult.gap_analysis || {};
    const detailedGaps = gapAnalysis.detailed_gaps || [];
    
    for (const gap of detailedGaps) {
      for (const finding of gap.gaps || []) {
        const remediationAction = this._mapFindingToRemediation(finding, 'NIST-SSDF', gap.practice_id);
        if (remediationAction) {
          if (remediationAction.automated) {
            remediationPlan.automated_fixes.push(remediationAction);
          } else {
            remediationPlan.manual_actions.push(remediationAction);
          }
        }
      }
    }
  }

  _mapFindingToRemediation(finding, framework, context) {
    const findingLower = finding.toLowerCase();
    
    // Map common findings to remediation templates
    const findingMappings = {
      'missing code of conduct': 'missing_code_of_conduct',
      'missing governance documentation': 'create_governance_docs',
      'missing incident response procedures': 'create_incident_response',
      'missing security policy': 'missing_security_policy',
      'missing code review process': 'missing_pr_template',
      'no security tools': 'missing_security_workflow',
      'missing dependency protection': 'missing_dependabot',
      'no vulnerability identification': 'missing_security_workflow'
    };

    for (const [pattern, templateKey] of Object.entries(findingMappings)) {
      if (findingLower.includes(pattern.toLowerCase())) {
        const template = this.remediationTemplates[templateKey];
        if (template && template.frameworks.includes(framework)) {
          return {
            finding,
            framework,
            context,
            template_key: templateKey,
            automated: template.automation_level === 'full',
            priority: this._calculateRemediationPriority(finding, framework, context),
            description: `${template.type}: ${template.filename || 'Configuration update'}`,
            effort_hours: template.automation_level === 'full' ? 0.25 : 2
          };
        }
      }
    }

    // Default manual remediation
    return {
      finding,
      framework,
      context,
      template_key: null,
      automated: false,
      priority: 'medium',
      description: `Manual remediation required for: ${finding}`,
      effort_hours: 4
    };
  }

  _calculateRemediationPriority(finding, framework, context) {
    const highPriorityPatterns = [
      'security policy',
      'incident response',
      'vulnerability',
      'access control',
      'authentication'
    ];

    const mediumPriorityPatterns = [
      'code review',
      'testing',
      'monitoring',
      'documentation'
    ];

    const findingLower = finding.toLowerCase();

    if (highPriorityPatterns.some(pattern => findingLower.includes(pattern))) {
      return 'high';
    } else if (mediumPriorityPatterns.some(pattern => findingLower.includes(pattern))) {
      return 'medium';
    }

    return 'low';
  }

  _generateRemediationPhases(remediationPlan) {
    const phases = [];

    // Phase 1: Automated fixes and quick wins
    const automatedFixes = remediationPlan.automated_fixes.filter(fix => fix.priority === 'high');
    if (automatedFixes.length > 0) {
      phases.push({
        phase: 1,
        title: 'Automated Security Fixes',
        description: 'Apply automated fixes for high-priority security gaps',
        duration_days: 1,
        actions: automatedFixes,
        prerequisites: [],
        success_criteria: 'All automated fixes applied successfully'
      });
    }

    // Phase 2: High-priority manual actions
    const highPriorityManual = remediationPlan.manual_actions.filter(action => action.priority === 'high');
    if (highPriorityManual.length > 0) {
      phases.push({
        phase: 2,
        title: 'Critical Manual Remediation',
        description: 'Address high-priority compliance gaps requiring manual intervention',
        duration_days: 7,
        actions: highPriorityManual,
        prerequisites: phases.length > 0 ? ['Phase 1 completion'] : [],
        success_criteria: 'All high-priority gaps addressed'
      });
    }

    // Phase 3: Medium-priority actions
    const mediumPriorityActions = [
      ...remediationPlan.automated_fixes.filter(fix => fix.priority === 'medium'),
      ...remediationPlan.manual_actions.filter(action => action.priority === 'medium')
    ];
    if (mediumPriorityActions.length > 0) {
      phases.push({
        phase: 3,
        title: 'Process Improvement',
        description: 'Implement medium-priority improvements and process enhancements',
        duration_days: 14,
        actions: mediumPriorityActions,
        prerequisites: phases.length > 0 ? [`Phase ${phases.length} completion`] : [],
        success_criteria: 'Process improvements implemented'
      });
    }

    // Phase 4: Low-priority and optimization
    const lowPriorityActions = [
      ...remediationPlan.automated_fixes.filter(fix => fix.priority === 'low'),
      ...remediationPlan.manual_actions.filter(action => action.priority === 'low')
    ];
    if (lowPriorityActions.length > 0) {
      phases.push({
        phase: 4,
        title: 'Optimization and Documentation',
        description: 'Complete remaining improvements and documentation updates',
        duration_days: 21,
        actions: lowPriorityActions,
        prerequisites: phases.length > 0 ? [`Phase ${phases.length} completion`] : [],
        success_criteria: 'All compliance gaps addressed'
      });
    }

    return phases;
  }

  _calculateEffortEstimates(remediationPlan) {
    const automatedHours = remediationPlan.automated_fixes.reduce((sum, fix) => sum + fix.effort_hours, 0);
    const manualHours = remediationPlan.manual_actions.reduce((sum, action) => sum + action.effort_hours, 0);

    return {
      automated_hours: automatedHours,
      manual_hours: manualHours,
      total_hours: automatedHours + manualHours,
      estimated_days: Math.ceil((automatedHours + manualHours) / 8), // 8-hour work days
      cost_estimate_usd: Math.round((manualHours * 100) + (automatedHours * 20)) // $100/hr manual, $20/hr automated
    };
  }

  async executeAutomatedFixes(remediationPlan, projectPath) {
    if (!this.config.autoFix) {
      console.log('Automated fixes disabled. Use --auto-fix to enable.');
      return { executed: 0, skipped: remediationPlan.automated_fixes.length };
    }

    console.log(`Executing automated fixes in ${this.config.dryRun ? 'DRY RUN' : 'LIVE'} mode...`);

    const results = {
      executed: 0,
      failed: 0,
      skipped: 0,
      changes: []
    };

    const maxFixes = Math.min(this.config.maxAutomatedFixes, remediationPlan.automated_fixes.length);
    
    for (let i = 0; i < maxFixes; i++) {
      const fix = remediationPlan.automated_fixes[i];
      
      try {
        if (this.config.dryRun) {
          console.log(`DRY RUN: Would execute ${fix.description}`);
          results.skipped++;
          continue;
        }

        const result = await this._executeAutomatedFix(fix, projectPath);
        if (result.modified) {
          results.executed++;
          results.changes.push(...result.changes);
          console.log(` Executed: ${fix.description}`);
        } else {
          results.skipped++;
          console.log(`- Skipped: ${fix.description} (no changes needed)`);
        }

      } catch (error) {
        results.failed++;
        console.error(` Failed: ${fix.description} - ${error.message}`);
      }
    }

    return results;
  }

  async _executeAutomatedFix(fix, projectPath) {
    if (fix.template_key && this.remediationTemplates[fix.template_key]) {
      return await this._executeTemplateBasedFix(fix.template_key, projectPath);
    }

    // Execute automated fix functions
    const automatedFix = this.automatedFixes[fix.template_key];
    if (automatedFix && automatedFix.action) {
      return await automatedFix.action(projectPath);
    }

    return { modified: false, changes: [] };
  }

  async _executeTemplateBasedFix(templateKey, projectPath) {
    const template = this.remediationTemplates[templateKey];
    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    const filePath = path.join(projectPath, template.filename);
    
    // Check if file already exists
    try {
      await fs.access(filePath);
      return { modified: false, changes: [`File already exists: ${template.filename}`] };
    } catch (error) {
      // File doesn't exist, create it
    }

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write template content
    await fs.writeFile(filePath, template.template);

    return { 
      modified: true, 
      changes: [`Created ${template.filename} from template`] 
    };
  }

  async generateRemediationReport(remediationPlan, executionResults) {
    const report = `# Compliance Remediation Report

**Generated:** ${new Date().toISOString()}
**Frameworks Analyzed:** ${remediationPlan.frameworks_analyzed.join(', ')}
**Total Findings:** ${remediationPlan.total_findings}

## Executive Summary

This remediation plan addresses compliance gaps across ${remediationPlan.frameworks_analyzed.length} framework(s).
A total of ${remediationPlan.automated_fixes.length} automated fixes and ${remediationPlan.manual_actions.length} manual actions have been identified.

## Effort Estimate

- **Automated Fixes:** ${remediationPlan.estimated_effort.automated_hours} hours
- **Manual Actions:** ${remediationPlan.estimated_effort.manual_hours} hours
- **Total Estimated Effort:** ${remediationPlan.estimated_effort.total_hours} hours (${remediationPlan.estimated_effort.estimated_days} days)
- **Estimated Cost:** $${remediationPlan.estimated_effort.cost_estimate_usd}

## Automated Fixes Status

${executionResults ? `
- **Executed:** ${executionResults.executed}
- **Failed:** ${executionResults.failed}
- **Skipped:** ${executionResults.skipped}

### Changes Made:
${executionResults.changes.map(change => `- ${change}`).join('\n')}
` : 'Automated fixes not executed yet.'}

## Remediation Phases

${remediationPlan.remediation_phases.map(phase => `
### Phase ${phase.phase}: ${phase.title}
**Duration:** ${phase.duration_days} days
**Description:** ${phase.description}
**Actions:** ${phase.actions.length}
**Prerequisites:** ${phase.prerequisites.join(', ') || 'None'}
**Success Criteria:** ${phase.success_criteria}
`).join('\n')}

## Priority Breakdown

### High Priority (${remediationPlan.automated_fixes.concat(remediationPlan.manual_actions).filter(a => a.priority === 'high').length} items)
${remediationPlan.automated_fixes.concat(remediationPlan.manual_actions)
  .filter(a => a.priority === 'high')
  .map(action => `- [${action.automated ? 'AUTO' : 'MANUAL'}] ${action.description}`)
  .join('\n')}

### Medium Priority (${remediationPlan.automated_fixes.concat(remediationPlan.manual_actions).filter(a => a.priority === 'medium').length} items)
${remediationPlan.automated_fixes.concat(remediationPlan.manual_actions)
  .filter(a => a.priority === 'medium')
  .map(action => `- [${action.automated ? 'AUTO' : 'MANUAL'}] ${action.description}`)
  .join('\n')}

### Low Priority (${remediationPlan.automated_fixes.concat(remediationPlan.manual_actions).filter(a => a.priority === 'low').length} items)
${remediationPlan.automated_fixes.concat(remediationPlan.manual_actions)
  .filter(a => a.priority === 'low')
  .map(action => `- [${action.automated ? 'AUTO' : 'MANUAL'}] ${action.description}`)
  .join('\n')}

## Next Steps

1. Review and approve this remediation plan
2. Execute automated fixes (if not already done)
3. Assign manual actions to appropriate team members
4. Track progress through remediation phases
5. Re-run compliance validation after remediation

---
*Generated by Compliance Remediation Engine*
`;

    return report;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Compliance Remediation Engine

Usage: node compliance-remediation-engine.js [options] <compliance-results-dir>

Options:
  --auto-fix           Execute automated fixes
  --create-prs         Create pull requests for fixes
  --dry-run            Show what would be done without making changes
  --max-fixes <n>      Maximum number of automated fixes to apply (default: 5)
  --output-dir <path>  Output directory for reports

Examples:
  node compliance-remediation-engine.js .claude/.artifacts/compliance/
  node compliance-remediation-engine.js --auto-fix --dry-run results/
    `);
    process.exit(0);
  }

  const config = {
    autoFix: args.includes('--auto-fix'),
    createPRs: args.includes('--create-prs'),
    dryRun: args.includes('--dry-run'),
    outputDir: args[args.indexOf('--output-dir') + 1] || '.claude/.artifacts/compliance/',
    maxAutomatedFixes: parseInt(args[args.indexOf('--max-fixes') + 1]) || 5
  };

  const complianceResultsDir = args[args.length - 1];

  try {
    const engine = new ComplianceRemediationEngine(config);
    
    // Load compliance results
    const complianceResults = [];
    const resultsDir = path.resolve(complianceResultsDir);
    
    // Load results from each framework
    const frameworks = ['SOC2', 'ISO27001', 'NIST-SSDF'];
    for (const framework of frameworks) {
      const frameworkDir = path.join(resultsDir, framework);
      const scoreFile = path.join(frameworkDir, 'compliance-score.json');
      
      try {
        const scoreData = JSON.parse(await fs.readFile(scoreFile, 'utf8'));
        complianceResults.push(scoreData);
      } catch (error) {
        console.warn(`Could not load ${framework} results: ${error.message}`);
      }
    }

    if (complianceResults.length === 0) {
      throw new Error('No compliance results found');
    }

    // Generate remediation plan
    const remediationPlan = await engine.generateRemediationPlan(complianceResults);
    
    // Execute automated fixes if requested
    let executionResults = null;
    if (config.autoFix || config.dryRun) {
      executionResults = await engine.executeAutomatedFixes(remediationPlan, process.cwd());
    }

    // Generate and save remediation report
    const report = await engine.generateRemediationReport(remediationPlan, executionResults);
    
    const reportFile = path.join(config.outputDir, `remediation-report-${Date.now()}.md`);
    await fs.mkdir(path.dirname(reportFile), { recursive: true });
    await fs.writeFile(reportFile, report);

    const planFile = path.join(config.outputDir, `remediation-plan-${Date.now()}.json`);
    await fs.writeFile(planFile, JSON.stringify(remediationPlan, null, 2));

    console.log(`\nRemediation plan generated:`);
    console.log(`- Plan: ${planFile}`);
    console.log(`- Report: ${reportFile}`);
    console.log(`- Total findings: ${remediationPlan.total_findings}`);
    console.log(`- Automated fixes: ${remediationPlan.automated_fixes.length}`);
    console.log(`- Manual actions: ${remediationPlan.manual_actions.length}`);
    console.log(`- Estimated effort: ${remediationPlan.estimated_effort.total_hours} hours`);

    if (executionResults) {
      console.log(`\nExecution results:`);
      console.log(`- Executed: ${executionResults.executed}`);
      console.log(`- Failed: ${executionResults.failed}`);
      console.log(`- Skipped: ${executionResults.skipped}`);
    }

    process.exit(0);

  } catch (error) {
    console.error('Remediation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ComplianceRemediationEngine };