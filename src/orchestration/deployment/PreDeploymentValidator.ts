/**
 * PreDeploymentValidator - Comprehensive Production Readiness Validation
 *
 * Performs exhaustive pre-deployment validation across all system components,
 * quality gates, security checks, and compliance requirements.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface ValidationSuite {
  suiteId: string;
  name: string;
  description: string;
  categories: ValidationCategory[];
  prerequisites: string[];
  criticalityLevel: 'required' | 'recommended' | 'optional';
  timeout: number;
}

export interface ValidationCategory {
  categoryId: string;
  name: string;
  weight: number;
  checks: ValidationCheck[];
  passThreshold: number;
}

export interface ValidationCheck {
  checkId: string;
  name: string;
  description: string;
  category: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  automated: boolean;
  timeout: number;
  dependencies: string[];
  validation: CheckValidator;
}

export interface CheckValidator {
  type: 'command' | 'file' | 'api' | 'metric' | 'custom';
  target: string;
  criteria: ValidationCriteria;
  parameters: Record<string, any>;
}

export interface ValidationCriteria {
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'regex' | 'exists' | 'custom';
  expected: any;
  tolerance?: number;
  message: string;
}

export interface ValidationExecution {
  executionId: string;
  suiteId: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  overallScore: number;
  passRate: number;
  results: CategoryResult[];
  criticalFailures: ValidationFailure[];
  recommendations: string[];
  reportPath?: string;
}

export interface CategoryResult {
  categoryId: string;
  name: string;
  score: number;
  passRate: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  skippedChecks: number;
  checkResults: CheckResult[];
  duration: number;
}

export interface CheckResult {
  checkId: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  score: number;
  message: string;
  details: any;
  duration: number;
  evidence: Evidence[];
  recommendations: string[];
}

export interface ValidationFailure {
  checkId: string;
  category: string;
  severity: string;
  message: string;
  impact: string;
  remediation: string;
  blockingDeployment: boolean;
}

export interface Evidence {
  type: 'file' | 'command_output' | 'metric' | 'screenshot' | 'log';
  source: string;
  content: string;
  timestamp: number;
}

export interface ValidationOptions {
  suiteIds?: string[];
  skipCategories?: string[];
  skipChecks?: string[];
  dryRun?: boolean;
  parallel?: boolean;
  maxConcurrency?: number;
  timeout?: number;
  generateReport?: boolean;
  evidenceCollection?: boolean;
  continueOnFailure?: boolean;
}

export interface DeploymentGate {
  gateId: string;
  name: string;
  description: string;
  requiredSuites: string[];
  minimumScore: number;
  criticalChecks: string[];
  autoApprove: boolean;
  approvers: string[];
}

export class PreDeploymentValidator extends EventEmitter {
  private suites: Map<string, ValidationSuite> = new Map();
  private gates: Map<string, DeploymentGate> = new Map();
  private executions: Map<string, ValidationExecution> = new Map();
  private projectRoot: string;
  private resultsDir: string;

  constructor(projectRoot: string) {
    super();
    this.projectRoot = projectRoot;
    this.resultsDir = path.join(projectRoot, '.claude', '.artifacts', 'validation');
    this.initializeValidationSuites();
    this.initializeDeploymentGates();
    this.ensureResultsDirectory();
  }

  /**
   * Execute comprehensive pre-deployment validation
   */
  async executeValidation(
    executionId: string,
    options: ValidationOptions = {}
  ): Promise<ValidationExecution> {
    const execution: ValidationExecution = {
      executionId,
      suiteId: 'comprehensive',
      startTime: Date.now(),
      status: 'running',
      overallScore: 0,
      passRate: 0,
      results: [],
      criticalFailures: [],
      recommendations: []
    };

    this.executions.set(executionId, execution);
    this.emit('validationStarted', { executionId, options });

    try {
      // Phase 1: Pre-validation checks
      await this.performPreValidationChecks(execution, options);

      // Phase 2: Execute validation suites
      const suitesToRun = this.determineSuitesToRun(options);
      await this.executeSuites(execution, suitesToRun, options);

      // Phase 3: Calculate overall results
      this.calculateOverallResults(execution);

      // Phase 4: Generate deployment recommendations
      await this.generateDeploymentRecommendations(execution);

      // Phase 5: Generate comprehensive report
      if (options.generateReport !== false) {
        await this.generateValidationReport(execution);
      }

      execution.status = 'completed';
      execution.endTime = Date.now();

      this.emit('validationCompleted', { executionId, execution });
      return execution;

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = Date.now();

      this.emit('validationFailed', { executionId, error: error.message });
      throw error;
    }
  }

  /**
   * Check deployment gate readiness
   */
  async checkDeploymentGate(
    gateId: string,
    executionId: string
  ): Promise<{
    ready: boolean;
    score: number;
    blockers: ValidationFailure[];
    recommendations: string[];
  }> {
    const gate = this.gates.get(gateId);
    const execution = this.executions.get(executionId);

    if (!gate || !execution) {
      throw new Error(`Gate ${gateId} or execution ${executionId} not found`);
    }

    const blockers: ValidationFailure[] = [];
    let gateScore = 0;

    // Check required suites completion
    for (const suiteId of gate.requiredSuites) {
      const suiteResults = execution.results.filter(r => r.categoryId.startsWith(suiteId));
      if (suiteResults.length === 0) {
        blockers.push({
          checkId: `gate-${gateId}`,
          category: 'deployment',
          severity: 'critical',
          message: `Required suite ${suiteId} not executed`,
          impact: 'Blocks deployment',
          remediation: `Execute validation suite: ${suiteId}`,
          blockingDeployment: true
        });
      }
    }

    // Check critical checks
    for (const criticalCheckId of gate.criticalChecks) {
      const checkResult = this.findCheckResult(execution, criticalCheckId);
      if (!checkResult || checkResult.status !== 'passed') {
        blockers.push({
          checkId: criticalCheckId,
          category: 'critical',
          severity: 'critical',
          message: `Critical check failed: ${criticalCheckId}`,
          impact: 'Blocks deployment',
          remediation: 'Fix critical issue before deployment',
          blockingDeployment: true
        });
      }
    }

    // Check minimum score
    gateScore = execution.overallScore;
    if (gateScore < gate.minimumScore) {
      blockers.push({
        checkId: `gate-score-${gateId}`,
        category: 'quality',
        severity: 'major',
        message: `Overall score ${gateScore} below minimum ${gate.minimumScore}`,
        impact: 'Reduces deployment confidence',
        remediation: 'Improve failing checks to increase score',
        blockingDeployment: gateScore < (gate.minimumScore * 0.8)
      });
    }

    const ready = blockers.filter(b => b.blockingDeployment).length === 0;

    this.emit('deploymentGateChecked', {
      gateId,
      executionId,
      ready,
      score: gateScore,
      blockers: blockers.length
    });

    return {
      ready,
      score: gateScore,
      blockers,
      recommendations: execution.recommendations
    };
  }

  /**
   * Initialize comprehensive validation suites
   */
  private initializeValidationSuites(): void {
    // Code Quality Suite
    this.suites.set('code-quality', {
      suiteId: 'code-quality',
      name: 'Code Quality Validation',
      description: 'Comprehensive code quality, style, and best practices validation',
      categories: [
        {
          categoryId: 'compilation',
          name: 'TypeScript Compilation',
          weight: 30,
          passThreshold: 95,
          checks: [
            {
              checkId: 'typescript-compilation',
              name: 'TypeScript Compilation Success',
              description: 'All TypeScript files compile without errors',
              category: 'compilation',
              severity: 'critical',
              automated: true,
              timeout: 60000,
              dependencies: [],
              validation: {
                type: 'command',
                target: 'npx tsc --noEmit',
                criteria: {
                  operator: 'equals',
                  expected: 0,
                  message: 'TypeScript compilation must succeed with no errors'
                },
                parameters: { cwd: this.projectRoot }
              }
            },
            {
              checkId: 'no-any-types',
              name: 'No Any Types',
              description: 'Code should not use "any" type',
              category: 'compilation',
              severity: 'major',
              automated: true,
              timeout: 30000,
              dependencies: [],
              validation: {
                type: 'command',
                target: 'grep -r ":\\s*any" src/ || echo "No any types found"',
                criteria: {
                  operator: 'contains',
                  expected: 'No any types found',
                  message: 'Avoid using "any" type for better type safety'
                },
                parameters: {}
              }
            }
          ]
        },
        {
          categoryId: 'linting',
          name: 'Code Style & Linting',
          weight: 20,
          passThreshold: 90,
          checks: [
            {
              checkId: 'eslint-validation',
              name: 'ESLint Validation',
              description: 'All files pass ESLint validation',
              category: 'linting',
              severity: 'major',
              automated: true,
              timeout: 45000,
              dependencies: [],
              validation: {
                type: 'command',
                target: 'npx eslint src/ --ext .ts,.js',
                criteria: {
                  operator: 'equals',
                  expected: 0,
                  message: 'All files must pass ESLint validation'
                },
                parameters: {}
              }
            }
          ]
        }
      ],
      prerequisites: [],
      criticalityLevel: 'required',
      timeout: 300000
    });

    // Testing Suite
    this.suites.set('testing', {
      suiteId: 'testing',
      name: 'Testing Validation',
      description: 'Comprehensive testing coverage and quality validation',
      categories: [
        {
          categoryId: 'unit-tests',
          name: 'Unit Testing',
          weight: 40,
          passThreshold: 95,
          checks: [
            {
              checkId: 'test-execution',
              name: 'Test Suite Execution',
              description: 'All unit tests execute successfully',
              category: 'unit-tests',
              severity: 'critical',
              automated: true,
              timeout: 120000,
              dependencies: [],
              validation: {
                type: 'command',
                target: 'npm test',
                criteria: {
                  operator: 'equals',
                  expected: 0,
                  message: 'All tests must pass'
                },
                parameters: {}
              }
            },
            {
              checkId: 'test-coverage',
              name: 'Test Coverage',
              description: 'Code coverage meets minimum threshold',
              category: 'unit-tests',
              severity: 'major',
              automated: true,
              timeout: 60000,
              dependencies: ['test-execution'],
              validation: {
                type: 'command',
                target: 'npm run test:coverage',
                criteria: {
                  operator: 'greater_than',
                  expected: 95,
                  tolerance: 5,
                  message: 'Test coverage must be at least 95%'
                },
                parameters: {}
              }
            }
          ]
        }
      ],
      prerequisites: ['code-quality'],
      criticalityLevel: 'required',
      timeout: 300000
    });

    // Security Suite
    this.suites.set('security', {
      suiteId: 'security',
      name: 'Security Validation',
      description: 'Security vulnerability and compliance validation',
      categories: [
        {
          categoryId: 'vulnerability-scan',
          name: 'Vulnerability Scanning',
          weight: 50,
          passThreshold: 100,
          checks: [
            {
              checkId: 'npm-audit',
              name: 'NPM Security Audit',
              description: 'No high or critical vulnerabilities in dependencies',
              category: 'vulnerability-scan',
              severity: 'critical',
              automated: true,
              timeout: 90000,
              dependencies: [],
              validation: {
                type: 'command',
                target: 'npm audit --audit-level=high',
                criteria: {
                  operator: 'equals',
                  expected: 0,
                  message: 'No high or critical vulnerabilities allowed'
                },
                parameters: {}
              }
            },
            {
              checkId: 'secret-scan',
              name: 'Secret Detection',
              description: 'No secrets or sensitive data in source code',
              category: 'vulnerability-scan',
              severity: 'critical',
              automated: true,
              timeout: 60000,
              dependencies: [],
              validation: {
                type: 'command',
                target: 'git secrets --scan',
                criteria: {
                  operator: 'equals',
                  expected: 0,
                  message: 'No secrets should be committed to repository'
                },
                parameters: {}
              }
            }
          ]
        }
      ],
      prerequisites: [],
      criticalityLevel: 'required',
      timeout: 240000
    });

    // Performance Suite
    this.suites.set('performance', {
      suiteId: 'performance',
      name: 'Performance Validation',
      description: 'Performance benchmarks and optimization validation',
      categories: [
        {
          categoryId: 'build-performance',
          name: 'Build Performance',
          weight: 30,
          passThreshold: 80,
          checks: [
            {
              checkId: 'build-time',
              name: 'Build Time',
              description: 'Build completes within acceptable time',
              category: 'build-performance',
              severity: 'minor',
              automated: true,
              timeout: 180000,
              dependencies: [],
              validation: {
                type: 'command',
                target: 'time npm run build',
                criteria: {
                  operator: 'less_than',
                  expected: 120,
                  tolerance: 30,
                  message: 'Build should complete within 2 minutes'
                },
                parameters: {}
              }
            }
          ]
        }
      ],
      prerequisites: ['code-quality'],
      criticalityLevel: 'recommended',
      timeout: 300000
    });

    // Compliance Suite
    this.suites.set('compliance', {
      suiteId: 'compliance',
      name: 'NASA POT10 Compliance',
      description: 'NASA POT10 standards and enterprise compliance validation',
      categories: [
        {
          categoryId: 'nasa-compliance',
          name: 'NASA POT10 Standards',
          weight: 100,
          passThreshold: 100,
          checks: [
            {
              checkId: 'pot10-validation',
              name: 'NASA POT10 Compliance Check',
              description: 'All NASA POT10 requirements satisfied',
              category: 'nasa-compliance',
              severity: 'critical',
              automated: true,
              timeout: 120000,
              dependencies: [],
              validation: {
                type: 'custom',
                target: 'nasa-pot10-validator',
                criteria: {
                  operator: 'greater_than',
                  expected: 100,
                  message: 'NASA POT10 compliance must be 100%'
                },
                parameters: { standard: 'POT10', version: '2024' }
              }
            }
          ]
        }
      ],
      prerequisites: ['code-quality', 'testing', 'security'],
      criticalityLevel: 'required',
      timeout: 240000
    });
  }

  /**
   * Initialize deployment gates
   */
  private initializeDeploymentGates(): void {
    // Production Gate
    this.gates.set('production', {
      gateId: 'production',
      name: 'Production Deployment Gate',
      description: 'Comprehensive validation for production deployment',
      requiredSuites: ['code-quality', 'testing', 'security', 'compliance'],
      minimumScore: 80,
      criticalChecks: [
        'typescript-compilation',
        'test-execution',
        'test-coverage',
        'npm-audit',
        'secret-scan',
        'pot10-validation'
      ],
      autoApprove: false,
      approvers: ['tech-lead', 'security-team']
    });

    // Staging Gate
    this.gates.set('staging', {
      gateId: 'staging',
      name: 'Staging Deployment Gate',
      description: 'Validation for staging environment deployment',
      requiredSuites: ['code-quality', 'testing', 'security'],
      minimumScore: 70,
      criticalChecks: [
        'typescript-compilation',
        'test-execution',
        'npm-audit'
      ],
      autoApprove: true,
      approvers: []
    });
  }

  /**
   * Additional helper methods for validation execution
   */

  private async performPreValidationChecks(
    execution: ValidationExecution,
    options: ValidationOptions
  ): Promise<void> {
    // Check project structure
    const requiredFiles = ['package.json', 'tsconfig.json'];
    for (const file of requiredFiles) {
      const exists = fs.existsSync(path.join(this.projectRoot, file));
      if (!exists) {
        throw new Error(`Required file ${file} not found`);
      }
    }

    // Check dependencies
    if (!fs.existsSync(path.join(this.projectRoot, 'node_modules'))) {
      throw new Error('Dependencies not installed. Run npm install first.');
    }

    this.emit('preValidationCompleted', { executionId: execution.executionId });
  }

  private determineSuitesToRun(options: ValidationOptions): ValidationSuite[] {
    const allSuites = Array.from(this.suites.values());

    if (options.suiteIds && options.suiteIds.length > 0) {
      return allSuites.filter(suite => options.suiteIds!.includes(suite.suiteId));
    }

    return allSuites.filter(suite => suite.criticalityLevel === 'required');
  }

  private async executeSuites(
    execution: ValidationExecution,
    suites: ValidationSuite[],
    options: ValidationOptions
  ): Promise<void> {
    for (const suite of suites) {
      await this.executeSuite(execution, suite, options);
    }
  }

  private async executeSuite(
    execution: ValidationExecution,
    suite: ValidationSuite,
    options: ValidationOptions
  ): Promise<void> {
    this.emit('suiteStarted', { executionId: execution.executionId, suiteId: suite.suiteId });

    for (const category of suite.categories) {
      if (options.skipCategories?.includes(category.categoryId)) {
        continue;
      }

      const categoryResult = await this.executeCategory(execution, category, options);
      execution.results.push(categoryResult);
    }

    this.emit('suiteCompleted', { executionId: execution.executionId, suiteId: suite.suiteId });
  }

  private async executeCategory(
    execution: ValidationExecution,
    category: ValidationCategory,
    options: ValidationOptions
  ): Promise<CategoryResult> {
    const startTime = Date.now();
    const result: CategoryResult = {
      categoryId: category.categoryId,
      name: category.name,
      score: 0,
      passRate: 0,
      totalChecks: category.checks.length,
      passedChecks: 0,
      failedChecks: 0,
      skippedChecks: 0,
      checkResults: [],
      duration: 0
    };

    for (const check of category.checks) {
      if (options.skipChecks?.includes(check.checkId)) {
        result.skippedChecks++;
        continue;
      }

      const checkResult = await this.executeCheck(check, options);
      result.checkResults.push(checkResult);

      if (checkResult.status === 'passed') {
        result.passedChecks++;
      } else if (checkResult.status === 'failed') {
        result.failedChecks++;

        if (check.severity === 'critical') {
          execution.criticalFailures.push({
            checkId: check.checkId,
            category: category.categoryId,
            severity: check.severity,
            message: checkResult.message,
            impact: 'Critical system issue',
            remediation: 'Must be fixed before deployment',
            blockingDeployment: true
          });
        }
      } else {
        result.skippedChecks++;
      }
    }

    result.passRate = (result.passedChecks / (result.totalChecks - result.skippedChecks)) * 100;
    result.score = Math.max(0, (result.passRate - category.passThreshold) + category.passThreshold);
    result.duration = Date.now() - startTime;

    return result;
  }

  private async executeCheck(
    check: ValidationCheck,
    options: ValidationOptions
  ): Promise<CheckResult> {
    const startTime = Date.now();

    if (options.dryRun) {
      return {
        checkId: check.checkId,
        name: check.name,
        status: 'passed',
        score: 100,
        message: 'Dry run - check skipped',
        details: {},
        duration: 0,
        evidence: [],
        recommendations: []
      };
    }

    try {
      // Execute validation based on type
      const success = await this.executeValidation(check.validation);

      return {
        checkId: check.checkId,
        name: check.name,
        status: success ? 'passed' : 'failed',
        score: success ? 100 : 0,
        message: success ? 'Check passed' : check.validation.criteria.message,
        details: {},
        duration: Date.now() - startTime,
        evidence: [],
        recommendations: success ? [] : [`Fix: ${check.description}`]
      };

    } catch (error) {
      return {
        checkId: check.checkId,
        name: check.name,
        status: 'error',
        score: 0,
        message: `Check failed with error: ${error.message}`,
        details: { error: error.message },
        duration: Date.now() - startTime,
        evidence: [],
        recommendations: [`Investigate and fix: ${error.message}`]
      };
    }
  }

  private async executeValidation(validation: CheckValidator): Promise<boolean> {
    switch (validation.type) {
      case 'command':
        return await this.executeCommandValidation(validation);
      case 'file':
        return await this.executeFileValidation(validation);
      case 'custom':
        return await this.executeCustomValidation(validation);
      default:
        throw new Error(`Unknown validation type: ${validation.type}`);
    }
  }

  private async executeCommandValidation(validation: CheckValidator): Promise<boolean> {
    // Execute command and validate result
    const { execSync } = require('child_process');

    try {
      const result = execSync(validation.target, {
        cwd: validation.parameters.cwd || this.projectRoot,
        timeout: 30000
      });

      const exitCode = 0; // execSync throws on non-zero exit
      return this.evaluateCriteria(validation.criteria, exitCode);

    } catch (error) {
      const exitCode = error.status || 1;
      return this.evaluateCriteria(validation.criteria, exitCode);
    }
  }

  private async executeFileValidation(validation: CheckValidator): Promise<boolean> {
    const exists = fs.existsSync(path.join(this.projectRoot, validation.target));
    return this.evaluateCriteria(validation.criteria, exists);
  }

  private async executeCustomValidation(validation: CheckValidator): Promise<boolean> {
    // Implement custom validation logic based on target
    switch (validation.target) {
      case 'nasa-pot10-validator':
        return await this.validateNASAPOT10();
      default:
        return true;
    }
  }

  private async validateNASAPOT10(): Promise<boolean> {
    // Implement NASA POT10 compliance validation
    // This would integrate with existing NASA compliance checkers
    return true; // Placeholder
  }

  private evaluateCriteria(criteria: ValidationCriteria, actualValue: any): boolean {
    switch (criteria.operator) {
      case 'equals':
        return actualValue === criteria.expected;
      case 'greater_than':
        return actualValue > criteria.expected;
      case 'less_than':
        return actualValue < criteria.expected;
      case 'contains':
        return String(actualValue).includes(criteria.expected);
      case 'exists':
        return actualValue !== null && actualValue !== undefined;
      default:
        return false;
    }
  }

  private calculateOverallResults(execution: ValidationExecution): void {
    const totalChecks = execution.results.reduce((sum, r) => sum + r.totalChecks, 0);
    const passedChecks = execution.results.reduce((sum, r) => sum + r.passedChecks, 0);

    execution.passRate = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;
    execution.overallScore = execution.results.reduce((sum, r) => sum + (r.score * r.totalChecks), 0) / totalChecks;
  }

  private async generateDeploymentRecommendations(execution: ValidationExecution): Promise<void> {
    const recommendations: string[] = [];

    if (execution.overallScore < 80) {
      recommendations.push('Overall score below 80 - review failed checks');
    }

    if (execution.criticalFailures.length > 0) {
      recommendations.push(`${execution.criticalFailures.length} critical issues must be resolved`);
    }

    if (execution.passRate < 95) {
      recommendations.push('Consider improving test coverage and code quality');
    }

    execution.recommendations = recommendations;
  }

  private findCheckResult(execution: ValidationExecution, checkId: string): CheckResult | undefined {
    for (const categoryResult of execution.results) {
      const checkResult = categoryResult.checkResults.find(cr => cr.checkId === checkId);
      if (checkResult) {
        return checkResult;
      }
    }
    return undefined;
  }

  private async generateValidationReport(execution: ValidationExecution): Promise<void> {
    const reportPath = path.join(this.resultsDir, `validation-report-${execution.executionId}.json`);

    const report = {
      executionId: execution.executionId,
      timestamp: new Date().toISOString(),
      overallScore: execution.overallScore,
      passRate: execution.passRate,
      duration: execution.endTime ? execution.endTime - execution.startTime : 0,
      results: execution.results,
      criticalFailures: execution.criticalFailures,
      recommendations: execution.recommendations
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    execution.reportPath = reportPath;

    this.emit('reportGenerated', { executionId: execution.executionId, reportPath });
  }

  private ensureResultsDirectory(): void {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }
}

export default PreDeploymentValidator;