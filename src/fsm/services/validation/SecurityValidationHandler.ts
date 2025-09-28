/**
 * SecurityValidationHandler
 * FSM-based security validation service handler (NASA Rule 10 compliant)
 */

import { RequestHandler } from '../RequestHandler';
import { ServiceContext, ServiceRequest } from '../ServiceFSMTypes';
import { PenetrationTester } from './PenetrationTester';
import { ComplianceValidator } from './ComplianceValidator';

export class SecurityValidationHandler extends RequestHandler {
  readonly priority = 85;
  private penetrationTester: PenetrationTester;
  private complianceValidator: ComplianceValidator;

  constructor() {
    super();
    this.penetrationTester = new PenetrationTester();
    this.complianceValidator = new ComplianceValidator();
  }

  /**
   * Check if can handle security validation requests (≤60 lines)
   */
  canHandle(request: ServiceRequest): boolean {
    return request.type === 'security_validation' && this.validateRequest(request);
  }

  /**
   * Process security validation request (≤60 lines)
   */
  async process(context: ServiceContext): Promise<any> {
    const { request } = context;
    context.processing = {
      startTime: Date.now(),
      stage: 'validation',
      progress: 0
    };

    try {
      const securityContext = request.payload;

      const penetrationTest = await this.runPenetrationTest(securityContext);
      context.processing.progress = 25;

      const complianceValidation = await this.complianceValidator.validateCompliance(securityContext);
      context.processing.progress = 50;

      const vulnerabilityAssessment = await this.complianceValidator.assessVulnerabilities(securityContext);
      context.processing.progress = 75;

      const configurationReview = await this.complianceValidator.reviewSecurityConfiguration(securityContext);
      context.processing.progress = 90;

      const overallAssessment = await this.calculateOverallScore(
        penetrationTest,
        complianceValidation,
        vulnerabilityAssessment,
        configurationReview
      );
      context.processing.progress = 100;

      const validationResult = {
        penetrationTestPassed: penetrationTest.passed,
        complianceVerified: complianceValidation.verified,
        vulnerabilitiesAddressed: vulnerabilityAssessment.addressed,
        configurationSecure: configurationReview.secure,
        overallScore: overallAssessment.score,
        securityLevel: overallAssessment.level,
        recommendations: overallAssessment.recommendations,
        lastValidation: new Date().toISOString()
      };

      return this.createResponse(request.id, true, validationResult);
    } catch (error) {
      return this.createResponse(request.id, false, null, error.message);
    }
  }

  /**
   * Run penetration testing simulation (≤60 lines)
   */
  private async runPenetrationTest(context: any): Promise<{
    passed: boolean;
    testsRun: string[];
    vulnerabilitiesFound: number;
    criticalFindings: string[];
    score: number;
  }> {
    const testsRun: string[] = [];
    const criticalFindings: string[] = [];
    let vulnerabilitiesFound = 0;
    let score = 100;

    try {
      const projectPath = context.metadata?.projectPath || process.cwd();

      // Simulate common penetration tests
      const tests = [
        { name: 'SQL Injection Test', critical: true, method: 'testSQLInjection' },
        { name: 'XSS Vulnerability Test', critical: true, method: 'testXSSVulnerability' },
        { name: 'CSRF Protection Test', critical: false, method: 'testCSRFProtection' },
        { name: 'Authentication Bypass Test', critical: true, method: 'testAuthenticationBypass' }
      ];

      for (const test of tests) {
        const result = await this.simulatePenTest(test.method, projectPath);
        testsRun.push(test.name);

        if (!result.passed) {
          vulnerabilitiesFound++;
          if (test.critical) {
            criticalFindings.push(test.name);
            score -= 15;
          } else {
            score -= 5;
          }
        }
      }

      score = Math.max(0, score);
    } catch (error) {
      criticalFindings.push('Penetration test execution failed');
      score = 0;
    }

    return {
      passed: score >= 80 && criticalFindings.length === 0,
      testsRun,
      vulnerabilitiesFound,
      criticalFindings,
      score
    };
  }

  /**
   * Simulate individual penetration test (≤60 lines)
   */
  private async simulatePenTest(method: string, projectPath: string): Promise<{ passed: boolean; details: string }> {
    try {
      switch (method) {
        case 'testSQLInjection':
          return await this.penetrationTester.testSQLInjection(projectPath);

        case 'testXSSVulnerability':
          return await this.penetrationTester.testXSSVulnerability(projectPath);

        case 'testCSRFProtection':
          return await this.penetrationTester.testCSRFProtection(projectPath);

        case 'testAuthenticationBypass':
          return await this.penetrationTester.testAuthenticationBypass(projectPath);

        default:
          return { passed: true, details: 'Test not implemented' };
      }
    } catch (error) {
      return { passed: false, details: `Test failed: ${error.message}` };
    }
  }

  /**
   * Calculate overall security score (≤60 lines)
   */
  private async calculateOverallScore(
    penetrationTest: any,
    complianceValidation: any,
    vulnerabilityAssessment: any,
    configurationReview: any
  ): Promise<{
    score: number;
    level: 'critical' | 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    const recommendations: string[] = [];

    // Weighted scoring
    const penTestScore = penetrationTest.score * 0.3;
    const complianceScore = complianceValidation.complianceScore * 0.3;
    const vulnScore = (vulnerabilityAssessment.addressed ? 100 :
      Math.max(0, 100 - (vulnerabilityAssessment.criticalRemaining * 20))) * 0.25;
    const configScore = configurationReview.configurationScore * 0.15;

    const overallScore = Math.round(penTestScore + complianceScore + vulnScore + configScore);

    // Collect recommendations
    if (!penetrationTest.passed) {
      recommendations.push('Address penetration test failures');
    }
    if (!complianceValidation.verified) {
      recommendations.push('Improve compliance posture');
    }
    if (!vulnerabilityAssessment.addressed) {
      recommendations.push('Remediate critical vulnerabilities');
    }
    recommendations.push(...configurationReview.recommendations);

    // Determine security level
    let level: 'critical' | 'low' | 'medium' | 'high';
    if (overallScore >= 90) {
      level = 'high';
    } else if (overallScore >= 70) {
      level = 'medium';
    } else if (overallScore >= 50) {
      level = 'low';
    } else {
      level = 'critical';
    }

    return {
      score: overallScore,
      level,
      recommendations: [...new Set(recommendations)] // Remove duplicates
    };
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T12:56:35-04:00 | AGENT104@sonnet-4 | Create FSM-based SecurityValidationHandler | SecurityValidationHandler.ts | OK | 561→180 lines, FSM integration, <60 lines per function | 0.00 | a3e7f1d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: agent104-security-validation-handler
- inputs: ["SecurityValidationService.ts", "PenetrationTester.ts", "ComplianceValidator.ts"]
- tools_used: ["Write"]
- versions: {"model":"sonnet-4","prompt":"service-fsm-elimination"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->