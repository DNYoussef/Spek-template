/**
 * CodeQualityState.ts - Code quality validation state handler
 * 
 * Handles code quality validation including TypeScript compilation,
 * ESLint compliance, complexity checks, and type coverage.
 */

import {
  StateHandler,
  ReadinessContext,
  CategoryReadiness,
  CheckConfig
} from '~types/ReadinessTypes';
import { BaseValidator } from '../validators/BaseValidator';

/**
 * Validator for code quality checks
 */
class CodeQualityValidator extends BaseValidator {
  
  /**
   * Run all code quality validation checks
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async validateCodeQuality(context: ReadinessContext): Promise<CategoryReadiness> {
    console.assert(context !== undefined, 'Context must be provided');
    console.assert(context.options !== undefined, 'Options must be defined');
    
    const category: CategoryReadiness = {
      categoryId: 'code-quality',
      name: 'Code Quality & Compilation',
      ready: false,
      score: 0,
      minimumScore: 90,
      checks: [],
      criticalIssues: 0,
      warningIssues: 0,
      lastValidated: Date.now()
    };

    // Define checks
    const checks: CheckConfig[] = [
      {
        checkId: 'typescript-compilation',
        name: 'TypeScript Compilation',
        description: 'All TypeScript files compile without errors',
        category: 'code-quality',
        command: 'npx tsc --noEmit',
        required: true,
        scoreWeight: 40
      },
      {
        checkId: 'eslint-compliance',
        name: 'ESLint Compliance',
        description: 'All files pass ESLint validation',
        category: 'code-quality',
        command: 'npx eslint src/ --ext .ts,.js --max-warnings 0',
        required: true,
        scoreWeight: 30
      },
      {
        checkId: 'code-complexity',
        name: 'Code Complexity',
        description: 'Code complexity within acceptable limits',
        category: 'code-quality',
        command: 'node scripts/check-complexity.js',
        required: false,
        scoreWeight: 20
      },
      {
        checkId: 'type-coverage',
        name: 'Type Coverage',
        description: 'TypeScript type coverage above threshold',
        category: 'code-quality',
        command: 'npx type-coverage --at-least 90',
        required: false,
        scoreWeight: 10
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
    
    category.ready = category.score >= category.minimumScore && category.criticalIssues === 0;
  }
}

/**
 * Handler for the VALIDATING_CODE_QUALITY state
 */
export class CodeQualityState implements StateHandler {
  private validator: CodeQualityValidator;

  constructor() {
    // Validator will be initialized in enter() with proper projectRoot
    this.validator = null as any;
  }

  /**
   * Enter code quality validation state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async enter(context: ReadinessContext): Promise<ReadinessContext> {
    console.assert(context !== undefined, 'Context must be provided');
    console.assert(context.projectRoot, 'Project root must be set');
    
    this.validator = new CodeQualityValidator(context.projectRoot);
    
    console.log('Starting code quality validation...');
    
    try {
      const categoryResult = await this.validator.validateCodeQuality(context);
      context.validation.categories.push(categoryResult);
      
      // Add blockers for critical failures
      this.addBlockersFromCategory(context, categoryResult);
      
      console.log(`Code quality validation completed. Score: ${categoryResult.score}/${categoryResult.minimumScore}`);
      
    } catch (error) {
      context.error = error;
      throw error;
    }
    
    return context;
  }

  /**
   * Exit code quality validation state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async exit(context: ReadinessContext): Promise<ReadinessContext> {
    console.assert(context !== undefined, 'Context must be provided');
    
    const codeQualityCategory = context.validation.categories.find(
      cat => cat.categoryId === 'code-quality'
    );
    
    console.assert(codeQualityCategory !== undefined, 'Code quality category must exist');
    
    console.log('Code quality validation phase completed');
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
    
    // After execution, should have code quality category
    const hasCodeQuality = context.validation.categories.some(
      cat => cat.categoryId === 'code-quality'
    );
    
    return hasCodeQuality || context.error !== undefined;
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
          title: `Failed Required Check: ${check.name}`,
          description: check.description,
          impact: 'Blocks deployment to target environment',
          remediation: check.recommendations.join('; ') || 'Fix the underlying issue',
          estimatedResolution: 4, // hours
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
// run_id: readiness-code-007
// inputs: ["BaseValidator.ts"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"fsm-refactor-v2"}
// === END FOOTER ===

// Backward compatibility
export default CodeQualityState;
