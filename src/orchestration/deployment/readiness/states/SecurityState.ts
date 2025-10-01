/**
 * SecurityState.ts - Security validation state handler
 * 
 * Handles security validation including vulnerability scanning,
 * secret detection, and NASA POT10 compliance.
 */

import {
  StateHandler,
  ReadinessContext,
  CategoryReadiness,
  CheckConfig
} from '~types/ReadinessTypes';
import { BaseValidator } from '../validators/BaseValidator';

/**
 * Validator for security checks
 */
class SecurityValidator extends BaseValidator {
  
  /**
   * Run all security validation checks
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async validateSecurity(context: ReadinessContext): Promise<CategoryReadiness> {
    console.assert(context !== undefined, 'Context must be provided');
    console.assert(context.options !== undefined, 'Options must be defined');
    
    const category: CategoryReadiness = {
      categoryId: 'security',
      name: 'Security & Compliance',
      ready: false,
      score: 0,
      minimumScore: 100, // Security requires perfect score
      checks: [],
      criticalIssues: 0,
      warningIssues: 0,
      lastValidated: Date.now()
    };

    // Define security checks
    const checks: CheckConfig[] = [
      {
        checkId: 'vulnerability-scan',
        name: 'Security Vulnerability Scan',
        description: 'No high or critical vulnerabilities',
        category: 'security',
        command: 'npm audit --audit-level=high',
        required: true,
        scoreWeight: 40
      },
      {
        checkId: 'secret-detection',
        name: 'Secret Detection',
        description: 'No secrets in source code',
        category: 'security',
        command: 'git secrets --scan',
        required: true,
        scoreWeight: 30
      },
      {
        checkId: 'nasa-compliance',
        name: 'NASA POT10 Compliance',
        description: 'Full NASA POT10 standard compliance',
        category: 'security',
        command: 'node scripts/nasa-compliance-check.js',
        required: context.options.environmentTarget === 'production',
        scoreWeight: 30
      }
    ];

    // Execute all checks
    for (const checkConfig of checks) {
      const check = await this.runCheck(checkConfig, context.options);
      category.checks.push(check);
    }

    this.calculateCategoryScore(category);
    return category;
  }

  /**
   * Calculate category readiness score
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private calculateCategoryScore(category: CategoryReadiness): void {
    console.assert(category !== undefined, 'Category must be provided');
    console.assert(category.checks.length > 0, 'Category must have checks');
    
    const totalScore = category.checks.reduce((sum, check) => sum + check.score, 0);
    category.score = Math.round(totalScore / category.checks.length);
    
    category.criticalIssues = category.checks.filter(
      check => check.status === 'failed' && check.required
    ).length;
    
    category.warningIssues = category.checks.filter(
      check => check.status === 'failed' && !check.required
    ).length;
    
    // Security requires perfect score for readiness
    category.ready = category.score >= category.minimumScore && category.criticalIssues === 0;
  }
}

/**
 * Handler for the VALIDATING_SECURITY state
 */
export class SecurityState implements StateHandler {
  private validator: SecurityValidator;

  constructor() {
    // Validator will be initialized in enter() with proper projectRoot
    this.validator = null as any;
  }

  /**
   * Enter security validation state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async enter(context: ReadinessContext): Promise<ReadinessContext> {
    console.assert(context !== undefined, 'Context must be provided');
    console.assert(context.projectRoot, 'Project root must be set');
    
    this.validator = new SecurityValidator(context.projectRoot);
    
    console.log('Starting security validation...');
    
    try {
      const categoryResult = await this.validator.validateSecurity(context);
      context.validation.categories.push(categoryResult);
      
      // Add blockers for critical failures
      this.addBlockersFromCategory(context, categoryResult);
      
      console.log(`Security validation completed. Score: ${categoryResult.score}/${categoryResult.minimumScore}`);
      
    } catch (error) {
      context.error = error;
      throw error;
    }
    
    return context;
  }

  /**
   * Exit security validation state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async exit(context: ReadinessContext): Promise<ReadinessContext> {
    console.assert(context !== undefined, 'Context must be provided');
    
    const securityCategory = context.validation.categories.find(
      cat => cat.categoryId === 'security'
    );
    
    console.assert(securityCategory !== undefined, 'Security category must exist');
    
    console.log('Security validation phase completed');
    return context;
  }

  /**
   * Check state invariants
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  checkInvariants(context: ReadinessContext): boolean {
    console.assert(context !== undefined, 'Context must be provided');
    
    if (!context.validation || !context.projectRoot) {
      return false;
    }
    
    // After execution, should have security category
    const hasSecurity = context.validation.categories.some(
      cat => cat.categoryId === 'security'
    );
    
    return hasSecurity || context.error !== undefined;
  }

  /**
   * Add blockers from failed critical checks
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private addBlockersFromCategory(context: ReadinessContext, category: CategoryReadiness): void {
    console.assert(context !== undefined, 'Context must be provided');
    console.assert(category !== undefined, 'Category must be provided');
    
    for (const check of category.checks) {
      if (check.status === 'failed' && check.required) {
        context.validation.blockers.push({
          blockerId: `blocker-${check.checkId}`,
          category: category.categoryId,
          severity: 'critical',
          title: `Security Issue: ${check.name}`,
          description: check.description,
          impact: 'CRITICAL: Blocks all deployments due to security risk',
          remediation: check.recommendations.join('; ') || 'Address security vulnerability immediately',
          estimatedResolution: 8, // hours - security issues take longer
          blocksDeployment: true
        });
      }
    }
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: readiness-security-008
// inputs: ["CodeQualityState.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"fsm-refactor-v2"}
// === END FOOTER ===

// Backward compatibility
export default SecurityState;
