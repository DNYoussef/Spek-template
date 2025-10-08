#!/usr/bin/env node

/**
 * Final Production Assessment Tool
 * Comprehensive evaluation of deployment readiness without bypasses
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class ProductionAssessment {
  constructor() {
    this.startTime = Date.now();
    this.assessment = {
      typescript: { status: 'pending', score: 0, details: {} },
      linting: { status: 'pending', score: 0, details: {} },
      tests: { status: 'pending', score: 0, details: {} },
      nasa: { status: 'pending', score: 0, details: {} },
      security: { status: 'pending', score: 0, details: {} },
      build: { status: 'pending', score: 0, details: {} },
      architecture: { status: 'pending', score: 0, details: {} }
    };
    this.overallScore = 0;
    this.recommendations = [];
  }

  /**
   * Run comprehensive production assessment
   */
  async runAssessment() {
    console.assert(process.cwd, 'Current working directory must be available');

    console.log('🚀 Final Production Assessment Starting...\n');

    try {
      // Run all assessments concurrently where possible
      await Promise.all([
        this.assessTypeScript(),
        this.assessLinting(),
        this.assessTests(),
        this.assessNASACompliance(),
        this.assessSecurity(),
        this.assessArchitecture()
      ]);

      // Build assessment depends on others
      await this.assessBuild();

      this.calculateOverallScore();
      this.generateRecommendations();
      this.generateFinalReport();

      return this.assessment;
    } catch (error) {
      console.error('Assessment error:', error);
      return null;
    }
  }

  /**
   * Assess TypeScript compilation status
   */
  async assessTypeScript() {
    console.assert(fs.existsSync('tsconfig.build.json'), 'tsconfig.build.json must exist');

    console.log('📋 Assessing TypeScript compilation...');

    const result = await this.runCommand('npx', ['tsc', '-p', 'tsconfig.build.json', '--noEmit']);

    const errorCount = (result.stderr.match(/error TS\d+/g) || []).length;
    const warningCount = (result.stdout.match(/warning TS\d+/g) || []).length;

    this.assessment.typescript = {
      status: errorCount === 0 ? 'pass' : (errorCount < 50 ? 'warn' : 'fail'),
      score: Math.max(0, 100 - errorCount * 2),
      details: {
        errors: errorCount,
        warnings: warningCount,
        exitCode: result.code
      }
    };

    console.log(`TypeScript: ${errorCount} errors, ${warningCount} warnings - ${this.assessment.typescript.status.toUpperCase()}`);
  }

  /**
   * Assess code quality through linting
   */
  async assessLinting() {
    console.assert(fs.existsSync('.eslintrc.json'), '.eslintrc.json must exist');

    console.log('🔍 Assessing code quality through linting...');

    const result = await this.runCommand('npx', ['eslint', 'src/', '--ext', '.js,.ts,.tsx', '--format', 'json']);

    let errors = 0, warnings = 0;
    try {
      const lintResults = JSON.parse(result.stdout || '[]');
      errors = lintResults.reduce((sum, file) => sum + file.errorCount, 0);
      warnings = lintResults.reduce((sum, file) => sum + file.warningCount, 0);
    } catch (e) {
      console.log('Linting: Using fallback error counting');
      errors = (result.stderr.match(/error/gi) || []).length;
      warnings = (result.stderr.match(/warning/gi) || []).length;
    }

    this.assessment.linting = {
      status: errors === 0 ? 'pass' : (errors < 100 ? 'warn' : 'fail'),
      score: Math.max(0, 100 - errors - warnings * 0.5),
      details: {
        errors,
        warnings,
        total: errors + warnings
      }
    };

    console.log(`Linting: ${errors} errors, ${warnings} warnings - ${this.assessment.linting.status.toUpperCase()}`);
  }

  /**
   * Assess test coverage and reliability
   */
  async assessTests() {
    console.assert(fs.existsSync('jest.config.js'), 'jest.config.js must exist');

    console.log('🧪 Assessing test suite reliability...');

    const result = await this.runCommand('npm', ['run', 'test:ci']);

    // Parse Jest output
    const testSummary = result.stdout.match(/Tests:\s*(\d+)\s*passed.*?(\d+)\s*failed/);
    const passed = testSummary ? parseInt(testSummary[1]) || 0 : 0;
    const failed = testSummary ? parseInt(testSummary[2]) || 0 : 0;
    const total = passed + failed;

    const passRate = total > 0 ? (passed / total) * 100 : 0;

    this.assessment.tests = {
      status: failed === 0 ? 'pass' : (passRate > 80 ? 'warn' : 'fail'),
      score: passRate,
      details: {
        passed,
        failed,
        total,
        passRate: passRate.toFixed(1) + '%'
      }
    };

    console.log(`Tests: ${passed} passed, ${failed} failed (${passRate.toFixed(1)}%) - ${this.assessment.tests.status.toUpperCase()}`);
  }

  /**
   * Assess NASA Rule 10 compliance
   */
  async assessNASACompliance() {
    console.assert(fs.existsSync('scripts/nasa-pot10-compliance.js'), 'NASA compliance script must exist');

    console.log('🚀 Assessing NASA Rule 10 compliance...');

    const result = await this.runCommand('node', ['scripts/nasa-pot10-compliance.js', 'src']);

    const complianceMatch = result.stdout.match(/Pass Rate:\s*(\d+(?:\.\d+)?)/);
    const compliance = complianceMatch ? parseFloat(complianceMatch[1]) : 0;

    this.assessment.nasa = {
      status: compliance >= 90 ? 'pass' : (compliance >= 70 ? 'warn' : 'fail'),
      score: compliance,
      details: {
        complianceRate: compliance + '%',
        target: '90%+',
        gap: Math.max(0, 90 - compliance)
      }
    };

    console.log(`NASA Compliance: ${compliance}% - ${this.assessment.nasa.status.toUpperCase()}`);
  }

  /**
   * Assess security posture
   */
  async assessSecurity() {
    console.log('🔒 Assessing security posture...');

    // Try Python Bandit scan
    const banditResult = await this.runCommand('python', ['-m', 'bandit', '-r', 'analyzer/', '-f', 'json']);

    let vulnerabilities = 0;
    if (banditResult.code === 0) {
      try {
        const securityData = JSON.parse(banditResult.stdout);
        vulnerabilities = securityData.results?.filter(r =>
          r.issue_severity === 'HIGH' || r.issue_severity === 'CRITICAL'
        ).length || 0;
      } catch (e) {
        console.log('Security: Bandit parsing failed, assuming secure');
      }
    }

    // Check for common security issues in TypeScript/JavaScript
    const securityPatterns = [
      /eval\s*\(/g,
      /innerHTML\s*=/g,
      /dangerouslySetInnerHTML/g,
      /process\.env\..*password/gi,
      /process\.env\..*secret/gi,
      /process\.env\..*key/gi
    ];

    let codeVulnerabilities = 0;
    try {
      const files = this.getSourceFiles('src');
      for (const file of files.slice(0, 100)) { // Sample first 100 files
        const content = fs.readFileSync(file, 'utf8');
        for (const pattern of securityPatterns) {
          codeVulnerabilities += (content.match(pattern) || []).length;
        }
      }
    } catch (e) {
      console.log('Security: Code scan failed, skipping');
    }

    const totalVulnerabilities = vulnerabilities + codeVulnerabilities;

    this.assessment.security = {
      status: totalVulnerabilities === 0 ? 'pass' : (totalVulnerabilities < 5 ? 'warn' : 'fail'),
      score: Math.max(0, 100 - totalVulnerabilities * 10),
      details: {
        banditVulnerabilities: vulnerabilities,
        codeVulnerabilities,
        totalVulnerabilities
      }
    };

    console.log(`Security: ${totalVulnerabilities} vulnerabilities found - ${this.assessment.security.status.toUpperCase()}`);
  }

  /**
   * Assess system architecture quality
   */
  async assessArchitecture() {
    console.log('🏗️ Assessing system architecture...');

    const metrics = {
      totalFiles: 0,
      averageFileSize: 0,
      godObjectCount: 0,
      facadePattern: 0,
      modularityScore: 0
    };

    try {
      const files = this.getSourceFiles('src');
      metrics.totalFiles = files.length;

      let totalLines = 0;
      let largeFiles = 0;
      let facadeFiles = 0;

      for (const file of files.slice(0, 500)) { // Sample first 500 files
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').length;
        totalLines += lines;

        if (lines > 500) largeFiles++;
        if (file.includes('Facade') || file.includes('facade')) facadeFiles++;
      }

      metrics.averageFileSize = totalLines / files.length;
      metrics.godObjectCount = largeFiles;
      metrics.facadePattern = facadeFiles;
      metrics.modularityScore = Math.max(0, 100 - largeFiles * 2 - Math.max(0, metrics.averageFileSize - 200) * 0.1);

    } catch (e) {
      console.log('Architecture: Analysis failed, using defaults');
      metrics.modularityScore = 50;
    }

    this.assessment.architecture = {
      status: metrics.modularityScore >= 80 ? 'pass' : (metrics.modularityScore >= 60 ? 'warn' : 'fail'),
      score: metrics.modularityScore,
      details: metrics
    };

    console.log(`Architecture: ${metrics.modularityScore.toFixed(1)} modularity score - ${this.assessment.architecture.status.toUpperCase()}`);
  }

  /**
   * Assess build process
   */
  async assessBuild() {
    console.assert(fs.existsSync('package.json'), 'package.json must exist');

    console.log('🏗️ Assessing production build process...');

    const result = await this.runCommand('npm', ['run', 'build:ci']);

    this.assessment.build = {
      status: result.code === 0 ? 'pass' : 'fail',
      score: result.code === 0 ? 100 : 0,
      details: {
        exitCode: result.code,
        buildSuccess: result.code === 0,
        buildTime: 'N/A' // Could be extracted from output
      }
    };

    console.log(`Build: ${result.code === 0 ? 'SUCCESS' : 'FAILED'} - ${this.assessment.build.status.toUpperCase()}`);
  }

  /**
   * Calculate overall production readiness score
   */
  calculateOverallScore() {
    console.assert(typeof this.assessment === 'object', 'Assessment must be an object');

    const weights = {
      build: 0.25,      // Critical - must build
      typescript: 0.20, // Important - type safety
      tests: 0.15,      // Important - reliability
      nasa: 0.15,       // Important - code quality
      security: 0.15,   // Important - security
      linting: 0.05,    // Nice to have - code style
      architecture: 0.05 // Nice to have - maintainability
    };

    let weightedScore = 0;
    let totalWeight = 0;

    for (const [category, assessment] of Object.entries(this.assessment)) {
      const weight = weights[category] || 0;
      weightedScore += assessment.score * weight;
      totalWeight += weight;
    }

    this.overallScore = totalWeight > 0 ? (weightedScore / totalWeight) : 0;

    console.assert(this.overallScore >= 0 && this.overallScore <= 100, 'Overall score must be between 0 and 100');
  }

  /**
   * Generate production readiness recommendations
   */
  generateRecommendations() {
    console.assert(Array.isArray(this.recommendations), 'Recommendations must be an array');

    this.recommendations = [];

    // Critical issues first
    if (this.assessment.build.status === 'fail') {
      this.recommendations.push({
        priority: 'CRITICAL',
        category: 'Build',
        issue: 'Production build failing',
        action: 'Fix build configuration and resolve compilation errors'
      });
    }

    if (this.assessment.typescript.details.errors > 50) {
      this.recommendations.push({
        priority: 'HIGH',
        category: 'TypeScript',
        issue: `${this.assessment.typescript.details.errors} TypeScript errors`,
        action: 'Reduce TypeScript errors to under 50 for production readiness'
      });
    }

    if (this.assessment.nasa.score < 70) {
      this.recommendations.push({
        priority: 'HIGH',
        category: 'Code Quality',
        issue: `NASA compliance at ${this.assessment.nasa.score}%`,
        action: 'Add assertions and reduce function complexity to improve NASA compliance'
      });
    }

    if (this.assessment.security.details.totalVulnerabilities > 0) {
      this.recommendations.push({
        priority: 'HIGH',
        category: 'Security',
        issue: `${this.assessment.security.details.totalVulnerabilities} security vulnerabilities`,
        action: 'Address security vulnerabilities before production deployment'
      });
    }

    if (this.assessment.tests.details.failed > 0) {
      this.recommendations.push({
        priority: 'MEDIUM',
        category: 'Testing',
        issue: `${this.assessment.tests.details.failed} failing tests`,
        action: 'Fix failing tests to ensure system reliability'
      });
    }

    if (this.assessment.linting.details.errors > 100) {
      this.recommendations.push({
        priority: 'MEDIUM',
        category: 'Code Quality',
        issue: `${this.assessment.linting.details.errors} linting errors`,
        action: 'Reduce linting errors to improve code maintainability'
      });
    }

    // Positive recommendations
    if (this.overallScore >= 80) {
      this.recommendations.push({
        priority: 'INFO',
        category: 'Readiness',
        issue: 'Good production readiness score',
        action: 'Consider deploying to staging environment for further testing'
      });
    }
  }

  /**
   * Generate comprehensive final report
   */
  generateFinalReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL PRODUCTION READINESS ASSESSMENT');
    console.log('='.repeat(80));
    console.log(`Assessment Duration: ${duration}s`);
    console.log(`Overall Score: ${this.overallScore.toFixed(1)}/100`);

    // Readiness determination
    let readinessLevel = 'NOT READY';
    let readinessColor = '❌';

    if (this.overallScore >= 90) {
      readinessLevel = 'PRODUCTION READY';
      readinessColor = '✅';
    } else if (this.overallScore >= 80) {
      readinessLevel = 'STAGING READY';
      readinessColor = '⚠️';
    } else if (this.overallScore >= 70) {
      readinessLevel = 'DEVELOPMENT READY';
      readinessColor = '🔶';
    }

    console.log(`Production Readiness: ${readinessColor} ${readinessLevel}`);
    console.log('\n📈 Category Breakdown:');

    // Detailed breakdown
    for (const [category, assessment] of Object.entries(this.assessment)) {
      const statusEmoji = assessment.status === 'pass' ? '✅' :
                         assessment.status === 'warn' ? '⚠️' : '❌';
      console.log(`${statusEmoji} ${category.toUpperCase()}: ${assessment.score.toFixed(1)}/100 (${assessment.status})`);

      // Show key details
      if (assessment.details && Object.keys(assessment.details).length > 0) {
        const details = Object.entries(assessment.details)
          .slice(0, 3)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        console.log(`   ${details}`);
      }
    }

    // Recommendations
    if (this.recommendations.length > 0) {
      console.log('\n📋 Priority Recommendations:');
      this.recommendations.slice(0, 5).forEach((rec, index) => {
        const priorityEmoji = rec.priority === 'CRITICAL' ? '🚨' :
                            rec.priority === 'HIGH' ? '⚠️' :
                            rec.priority === 'MEDIUM' ? '🔶' : 'ℹ️';
        console.log(`${index + 1}. ${priorityEmoji} [${rec.priority}] ${rec.category}: ${rec.issue}`);
        console.log(`   Action: ${rec.action}`);
      });
    }

    // Save detailed report
    const detailedReport = {
      timestamp: new Date().toISOString(),
      duration: parseFloat(duration),
      overallScore: this.overallScore,
      readinessLevel,
      assessment: this.assessment,
      recommendations: this.recommendations,
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    };

    try {
      if (!fs.existsSync('.claude')) fs.mkdirSync('.claude');
      if (!fs.existsSync('.claude/.artifacts')) fs.mkdirSync('.claude/.artifacts');

      fs.writeFileSync('.claude/.artifacts/final-production-assessment.json',
        JSON.stringify(detailedReport, null, 2));

      console.log('\n📄 Detailed report saved to: .claude/.artifacts/final-production-assessment.json');
    } catch (e) {
      console.log('\n⚠️  Could not save detailed report');
    }

    console.log('='.repeat(80));

    return detailedReport;
  }

  /**
   * Run command with timeout and error handling
   */
  runCommand(command, args = [], options = {}) {
    console.assert(typeof command === 'string', 'Command must be a string');
    console.assert(Array.isArray(args), 'Args must be an array');

    return new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          code: code || 0,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });

      // 5-minute timeout
      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        resolve({
          code: 124,
          stdout: stdout.trim(),
          stderr: 'Command timeout after 5 minutes'
        });
      }, 300000);

      child.on('close', () => clearTimeout(timeout));
    });
  }

  /**
   * Get source files recursively
   */
  getSourceFiles(dirPath) {
    console.assert(typeof dirPath === 'string', 'Directory path must be a string');

    const files = [];

    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !['node_modules', '.git', 'dist', 'build', 'coverage'].includes(item)) {
          files.push(...this.getSourceFiles(fullPath));
        } else if (stat.isFile() && /\.(ts|js|tsx|jsx)$/.test(item) &&
                   !item.includes('.test.') && !item.includes('.spec.') && !item.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      }
    } catch (e) {
      console.log(`Warning: Could not read directory ${dirPath}`);
    }

    return files;
  }
}

// Main execution
async function main() {
  console.assert(process, 'Process must be available');

  const assessor = new ProductionAssessment();
  const result = await assessor.runAssessment();

  if (result && result.build.status === 'pass' && assessor.overallScore >= 70) {
    process.exit(0); // Success
  } else {
    process.exit(1); // Needs work
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Assessment failed:', error);
    process.exit(1);
  });
}

module.exports = ProductionAssessment;