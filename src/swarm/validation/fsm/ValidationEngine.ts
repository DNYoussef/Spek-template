/**
 * Validation Engine - Core FSM component for MECE validation orchestration
 * NASA Rule 10 Compliant: Fixed bounds and non-recursive operations
 */

import {
  DomainBoundary,
  MECEValidationResult,
  MECEViolation,
  ValidationState,
  ValidationEvent,
  MECE_COMPLIANCE_THRESHOLD,
  MAX_DOMAINS,
  MAX_VIOLATIONS
} from './MECEValidationTypes';
import { Logger } from '../../../utils/Logger';

export class ValidationEngine {
  private logger: Logger;
  private currentState: ValidationState;
  private validationStartTime: number;

  constructor() {
    this.logger = new Logger('ValidationEngine');
    this.currentState = ValidationState.IDLE;
    this.validationStartTime = 0;
  }

  /**
   * Execute MECE validation - NASA Rule 10: ≤60 lines
   */
  async executeValidation(
    domains: DomainBoundary[],
    validationId: string
  ): Promise<MECEValidationResult> {
    // Assertion 1: Valid domains array
    console.assert(Array.isArray(domains), 'Domains array required');
    // Assertion 2: Valid validation ID
    console.assert(typeof validationId === 'string' && validationId.length > 0, 'Valid validation ID required');

    this.validationStartTime = Date.now();
    this.currentState = ValidationState.INITIALIZING;

    this.logger.info('Starting MECE validation', {
      validationId,
      domainCount: domains.length
    });

    try {
      // NASA Rule 10: Enforce domain limits
      const validDomains = domains.slice(0, MAX_DOMAINS);
      const violations: MECEViolation[] = [];
      
      this.currentState = ValidationState.VALIDATING_EXCLUSIVITY;
      const exclusivityViolations = await this.validateExclusivity(validDomains);
      violations.push(...exclusivityViolations.slice(0, MAX_VIOLATIONS));

      this.currentState = ValidationState.VALIDATING_EXHAUSTIVENESS;
      const exhaustivenessViolations = await this.validateExhaustiveness(validDomains);
      violations.push(...exhaustivenessViolations.slice(0, MAX_VIOLATIONS - violations.length));

      this.currentState = ValidationState.PROCESSING_VIOLATIONS;
      const finalViolations = violations.slice(0, MAX_VIOLATIONS);
      
      const result = this.generateValidationResult(
        validationId,
        validDomains,
        finalViolations
      );

      this.currentState = ValidationState.COMPLETED;
      return result;

    } catch (error) {
      this.currentState = ValidationState.ERROR;
      this.logger.error('Validation failed', { error: error.message, validationId });
      
      return this.generateErrorResult(validationId, error);
    }
  }

  /**
   * Validate mutual exclusivity - NASA Rule 10: Single responsibility
   */
  private async validateExclusivity(domains: DomainBoundary[]): Promise<MECEViolation[]> {
    // Assertion 1: Valid domains
    console.assert(Array.isArray(domains), 'Domains required for exclusivity validation');
    // Assertion 2: Domain count within bounds
    console.assert(domains.length <= MAX_DOMAINS, 'Domain count within limits');

    const violations: MECEViolation[] = [];
    const maxChecks = Math.min(domains.length * domains.length, 400); // NASA Rule 10: Fixed bound
    let checkCount = 0;

    // NASA Rule 10: Fixed nested loop bounds
    for (let i = 0; i < Math.min(domains.length, MAX_DOMAINS); i++) {
      for (let j = i + 1; j < Math.min(domains.length, MAX_DOMAINS); j++) {
        if (checkCount >= maxChecks) break;
        
        const overlap = this.checkDomainOverlap(domains[i], domains[j]);
        if (overlap.length > 0) {
          violations.push({
            violationType: 'overlap',
            severity: 'high',
            description: `Domains ${domains[i].domainName} and ${domains[j].domainName} have overlapping responsibilities`,
            affectedDomains: [domains[i].domainName, domains[j].domainName],
            conflictingElements: overlap,
            resolutionRequired: true,
            suggestedFix: 'Redistribute overlapping responsibilities'
          });
        }
        checkCount++;
      }
    }

    return violations.slice(0, MAX_VIOLATIONS);
  }

  /**
   * Check domain overlap - NASA Rule 10: Single responsibility
   */
  private checkDomainOverlap(domain1: DomainBoundary, domain2: DomainBoundary): string[] {
    // Assertion 1: Valid domains
    console.assert(domain1 && domain2, 'Both domains required for overlap check');
    // Assertion 2: Domain names differ
    console.assert(domain1.domainName !== domain2.domainName, 'Domains must be different');

    const overlaps: string[] = [];
    const maxOverlapChecks = 50; // NASA Rule 10: Fixed bound

    // Check responsibility overlaps
    let checkCount = 0;
    for (const resp1 of domain1.principalResponsibilities) {
      if (checkCount >= maxOverlapChecks) break;
      
      for (const resp2 of domain2.principalResponsibilities) {
        if (checkCount >= maxOverlapChecks) break;
        
        if (this.responsibilitiesOverlap(resp1, resp2)) {
          overlaps.push(`Responsibility: ${resp1} / ${resp2}`);
        }
        checkCount++;
      }
    }

    return overlaps.slice(0, 20); // NASA Rule 10: Fixed return limit
  }

  /**
   * Check responsibility overlap - NASA Rule 10: Single responsibility
   */
  private responsibilitiesOverlap(resp1: string, resp2: string): boolean {
    // Assertion 1: Valid responsibilities
    console.assert(typeof resp1 === 'string' && typeof resp2 === 'string', 'String responsibilities required');
    // Assertion 2: Non-empty responsibilities
    console.assert(resp1.length > 0 && resp2.length > 0, 'Non-empty responsibilities required');

    // Simplified overlap detection - could be enhanced with NLP
    const words1 = resp1.toLowerCase().split(/\s+/).slice(0, 10); // NASA Rule 10: Fixed bound
    const words2 = resp2.toLowerCase().split(/\s+/).slice(0, 10); // NASA Rule 10: Fixed bound
    
    let commonWords = 0;
    const maxWordChecks = 100; // NASA Rule 10: Fixed bound
    let checkCount = 0;

    for (const word1 of words1) {
      if (checkCount >= maxWordChecks) break;
      
      for (const word2 of words2) {
        if (checkCount >= maxWordChecks) break;
        
        if (word1 === word2 && word1.length > 3) {
          commonWords++;
        }
        checkCount++;
      }
    }

    return commonWords >= 2; // Threshold for overlap
  }

  /**
   * Validate collective exhaustiveness - NASA Rule 10: Single responsibility
   */
  private async validateExhaustiveness(domains: DomainBoundary[]): Promise<MECEViolation[]> {
    // Assertion 1: Valid domains
    console.assert(Array.isArray(domains), 'Domains required for exhaustiveness validation');
    // Assertion 2: Domain count within bounds
    console.assert(domains.length <= MAX_DOMAINS, 'Domain count within limits');

    const violations: MECEViolation[] = [];
    const allResponsibilities = new Set<string>();
    const maxResponsibilityChecks = 200; // NASA Rule 10: Fixed bound
    let checkCount = 0;

    // Collect all responsibilities
    for (const domain of domains.slice(0, MAX_DOMAINS)) {
      for (const resp of domain.principalResponsibilities.slice(0, 20)) {
        if (checkCount >= maxResponsibilityChecks) break;
        
        allResponsibilities.add(resp.toLowerCase());
        checkCount++;
      }
    }

    // Check for gaps (simplified - would need domain knowledge)
    const expectedResponsibilities = [
      'data management', 'user interface', 'business logic',
      'integration', 'security', 'monitoring'
    ];

    for (const expected of expectedResponsibilities) {
      if (!this.hasResponsibilityArea(allResponsibilities, expected)) {
        violations.push({
          violationType: 'gap',
          severity: 'medium',
          description: `Missing coverage for ${expected}`,
          affectedDomains: [],
          conflictingElements: [expected],
          resolutionRequired: true,
          suggestedFix: `Add domain or responsibility for ${expected}`
        });
      }
    }

    return violations.slice(0, MAX_VIOLATIONS);
  }

  /**
   * Check if responsibility area is covered - NASA Rule 10: Single responsibility
   */
  private hasResponsibilityArea(responsibilities: Set<string>, area: string): boolean {
    // Assertion 1: Valid parameters
    console.assert(responsibilities instanceof Set, 'Responsibilities set required');
    // Assertion 2: Valid area
    console.assert(typeof area === 'string' && area.length > 0, 'Valid area required');

    const areaWords = area.toLowerCase().split(/\s+/);
    let matchCount = 0;
    const maxResponsibilityChecks = 100; // NASA Rule 10: Fixed bound
    let checkCount = 0;

    for (const resp of responsibilities) {
      if (checkCount >= maxResponsibilityChecks) break;
      
      for (const word of areaWords) {
        if (resp.includes(word)) {
          matchCount++;
          break;
        }
      }
      checkCount++;
    }

    return matchCount > 0;
  }

  /**
   * Generate validation result - NASA Rule 10: Single responsibility
   */
  private generateValidationResult(
    validationId: string,
    domains: DomainBoundary[],
    violations: MECEViolation[]
  ): MECEValidationResult {
    // Assertion 1: Valid parameters
    console.assert(validationId && Array.isArray(domains) && Array.isArray(violations), 'Valid parameters required');
    // Assertion 2: Violation count within bounds
    console.assert(violations.length <= MAX_VIOLATIONS, 'Violation count within limits');

    const criticalViolations = violations.filter(v => v.severity === 'critical').length;
    const highViolations = violations.filter(v => v.severity === 'high').length;
    
    const compliance = Math.max(0, 1 - (criticalViolations * 0.2 + highViolations * 0.1));
    const domainCoverage = new Map<string, number>();
    
    // Calculate domain coverage
    for (const domain of domains.slice(0, MAX_DOMAINS)) {
      const domainViolations = violations.filter(v => 
        v.affectedDomains.includes(domain.domainName)
      ).length;
      
      const coverage = Math.max(0, 1 - (domainViolations * 0.1));
      domainCoverage.set(domain.domainName, coverage);
    }

    return {
      validationId,
      timestamp: Date.now(),
      overallCompliance: compliance,
      mutuallyExclusive: violations.filter(v => v.violationType === 'overlap').length === 0,
      collectivelyExhaustive: violations.filter(v => v.violationType === 'gap').length === 0,
      violations: violations.slice(0, MAX_VIOLATIONS),
      domainCoverage,
      recommendedActions: this.generateRecommendations(violations.slice(0, 10))
    };
  }

  /**
   * Generate error result - NASA Rule 10: Single responsibility
   */
  private generateErrorResult(validationId: string, error: Error): MECEValidationResult {
    // Assertion 1: Valid parameters
    console.assert(validationId && error, 'Valid validation ID and error required');
    // Assertion 2: Error has message
    console.assert(error.message && error.message.length > 0, 'Error must have message');

    return {
      validationId,
      timestamp: Date.now(),
      overallCompliance: 0,
      mutuallyExclusive: false,
      collectivelyExhaustive: false,
      violations: [{
        violationType: 'dependency_conflict',
        severity: 'critical',
        description: `Validation failed: ${error.message}`,
        affectedDomains: [],
        conflictingElements: [],
        resolutionRequired: true,
        suggestedFix: 'Review validation configuration and domain definitions'
      }],
      domainCoverage: new Map(),
      recommendedActions: ['Fix validation configuration', 'Check domain definitions']
    };
  }

  /**
   * Generate recommendations - NASA Rule 10: Single responsibility
   */
  private generateRecommendations(violations: MECEViolation[]): string[] {
    // Assertion 1: Valid violations
    console.assert(Array.isArray(violations), 'Violations array required');
    // Assertion 2: Violation count within bounds
    console.assert(violations.length <= 10, 'Violation count within processing limits');

    const recommendations: string[] = [];
    const maxRecommendations = 5; // NASA Rule 10: Fixed bound

    // NASA Rule 10: Fixed processing loop
    for (let i = 0; i < Math.min(violations.length, maxRecommendations); i++) {
      const violation = violations[i];
      if (violation.suggestedFix && !recommendations.includes(violation.suggestedFix)) {
        recommendations.push(violation.suggestedFix);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Review domain boundaries and responsibilities');
    }

    return recommendations.slice(0, maxRecommendations);
  }

  /**
   * Get current validation state - NASA Rule 10: Single responsibility
   */
  getCurrentState(): ValidationState {
    // Assertion 1: State is valid
    console.assert(Object.values(ValidationState).includes(this.currentState), 'Current state must be valid');
    // Assertion 2: State machine integrity
    console.assert(this.currentState !== undefined, 'Current state must be defined');

    return this.currentState;
  }
}
