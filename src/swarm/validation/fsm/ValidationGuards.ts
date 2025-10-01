/**
 * FSM Guards and Validation Logic for MECE Protocol
 * Focused guard functions following NASA Rule 10
 */

import { ValidationStateContext } from './ValidationStates';
import { MECEViolation } from '../MECEValidationProtocol';

export interface GuardResult {
  passed: boolean;
  reason?: string;
  data?: any;
}

export interface ValidationGuards {
  canStartValidation(context: ValidationStateContext): GuardResult;
  canProcessViolations(context: ValidationStateContext): GuardResult;
  canExecuteHandoff(context: ValidationStateContext): GuardResult;
  canCompleteValidation(context: ValidationStateContext): GuardResult;
  hasValidDomainBoundaries(domains: Map<string, any>): GuardResult;
  hasMinimumCompliance(score: number, threshold: number): GuardResult;
}

/**
 * Core validation guard implementations
 */
export class MECEValidationGuards implements ValidationGuards {
  private readonly MIN_COMPLIANCE_THRESHOLD = 0.85;
  private readonly MAX_CRITICAL_VIOLATIONS = 0;
  
  /**
   * Guard: Can start new validation - NASA Rule 10: ≤60 lines
   */
  canStartValidation(context: ValidationStateContext): GuardResult {
    // Assertion 1: Context exists
    console.assert(context !== null, 'Context must exist for validation start');
    // Assertion 2: No active validation
    console.assert(!context.validationId || context.validationId === '', 'No active validation allowed');
    
    if (!context) {
      return { passed: false, reason: 'Invalid context' };
    }
    
    if (context.validationId && context.validationId.length > 0) {
      return { 
        passed: false, 
        reason: 'Validation already in progress',
        data: { activeValidation: context.validationId }
      };
    }
    
    if (context.handoffInProgress) {
      return {
        passed: false,
        reason: 'Cannot start validation during handoff',
        data: { handoffActive: true }
      };
    }
    
    return { passed: true };
  }
  
  /**
   * Guard: Can process violations - NASA Rule 10: ≤60 lines
   */
  canProcessViolations(context: ValidationStateContext): GuardResult {
    // Assertion 1: Valid context state
    console.assert(context !== null, 'Context required for violation processing');
    // Assertion 2: Violations array exists
    console.assert(Array.isArray(context.allViolations), 'Violations array must exist');
    
    if (!context || !Array.isArray(context.allViolations)) {
      return { passed: false, reason: 'Invalid context or violations array' };
    }
    
    // Must have completed all validation stages
    const requiredResults = [
      'exclusivityResult',
      'exhaustivenessResult', 
      'boundaryResult',
      'dependencyResult'
    ];
    
    const missingResults = requiredResults.filter(result => !context[result]);
    if (missingResults.length > 0) {
      return {
        passed: false,
        reason: 'Incomplete validation stages',
        data: { missing: missingResults }
      };
    }
    
    return { passed: true };
  }
  
  /**
   * Guard: Can execute handoff - NASA Rule 10: ≤60 lines
   */
  canExecuteHandoff(context: ValidationStateContext): GuardResult {
    // Assertion 1: Context validation
    console.assert(context !== null, 'Context required for handoff');
    // Assertion 2: No concurrent handoff
    console.assert(!context.handoffInProgress, 'No concurrent handoff allowed');
    
    if (!context) {
      return { passed: false, reason: 'Invalid context' };
    }
    
    if (context.handoffInProgress) {
      return {
        passed: false,
        reason: 'Handoff already in progress',
        data: { handoffActive: true }
      };
    }
    
    // Check if system is in stable state
    const criticalViolations = context.allViolations.filter(
      (v: MECEViolation) => v.severity === 'critical'
    );
    
    if (criticalViolations.length > this.MAX_CRITICAL_VIOLATIONS) {
      return {
        passed: false,
        reason: 'Cannot execute handoff with critical violations',
        data: { criticalCount: criticalViolations.length }
      };
    }
    
    return { passed: true };
  }
  
  /**
   * Guard: Can complete validation - NASA Rule 10: ≤60 lines
   */
  canCompleteValidation(context: ValidationStateContext): GuardResult {
    // Assertion 1: Valid completion context
    console.assert(context !== null, 'Context required for completion');
    // Assertion 2: Compliance score calculated
    console.assert(typeof context.complianceScore === 'number', 'Compliance score must be calculated');
    
    if (!context) {
      return { passed: false, reason: 'Invalid context' };
    }
    
    if (typeof context.complianceScore !== 'number') {
      return {
        passed: false,
        reason: 'Compliance score not calculated',
        data: { scoreType: typeof context.complianceScore }
      };
    }
    
    if (context.complianceScore < 0 || context.complianceScore > 1) {
      return {
        passed: false,
        reason: 'Invalid compliance score range',
        data: { score: context.complianceScore }
      };
    }
    
    // Check minimum compliance threshold
    if (context.complianceScore < this.MIN_COMPLIANCE_THRESHOLD) {
      return {
        passed: false,
        reason: 'Compliance below minimum threshold',
        data: { 
          score: context.complianceScore,
          threshold: this.MIN_COMPLIANCE_THRESHOLD
        }
      };
    }
    
    return { passed: true };
  }
  
  /**
   * Guard: Has valid domain boundaries - NASA Rule 10: ≤60 lines
   */
  hasValidDomainBoundaries(domains: Map<string, any>): GuardResult {
    // Assertion 1: Domains exist
    console.assert(domains instanceof Map, 'Domains must be Map instance');
    // Assertion 2: Minimum domain count
    console.assert(domains.size > 0, 'Must have at least one domain');
    
    if (!(domains instanceof Map)) {
      return { passed: false, reason: 'Invalid domains structure' };
    }
    
    if (domains.size === 0) {
      return { 
        passed: false, 
        reason: 'No domains defined',
        data: { domainCount: 0 }
      };
    }
    
    // Validate each domain has required properties
    const requiredProperties = [
      'domainName',
      'principalResponsibilities',
      'criticalKeys',
      'managedAgentTypes'
    ];
    
    for (const [name, boundary] of domains) {
      const missingProperties = requiredProperties.filter(prop => !boundary[prop]);
      if (missingProperties.length > 0) {
        return {
          passed: false,
          reason: `Domain ${name} missing required properties`,
          data: { domain: name, missing: missingProperties }
        };
      }
    }
    
    return { passed: true };
  }
  
  /**
   * Guard: Has minimum compliance score - NASA Rule 10: Single responsibility
   */
  hasMinimumCompliance(score: number, threshold: number): GuardResult {
    // Assertion 1: Valid score range
    console.assert(typeof score === 'number' && score >= 0 && score <= 1, 'Score must be 0-1 range');
    // Assertion 2: Valid threshold
    console.assert(typeof threshold === 'number' && threshold >= 0 && threshold <= 1, 'Threshold must be 0-1 range');
    
    if (typeof score !== 'number' || score < 0 || score > 1) {
      return {
        passed: false,
        reason: 'Invalid compliance score',
        data: { score, validRange: '0-1' }
      };
    }
    
    if (typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
      return {
        passed: false,
        reason: 'Invalid threshold',
        data: { threshold, validRange: '0-1' }
      };
    }
    
    const passed = score >= threshold;
    return {
      passed,
      reason: passed ? undefined : 'Compliance below threshold',
      data: { score, threshold, difference: score - threshold }
    };
  }
}

/**
 * Domain-specific validation guards
 */
export class DomainValidationGuards {
  /**
   * Guard: Domain has no overlapping responsibilities - NASA Rule 10: ≤60 lines
   */
  static hasNoOverlappingResponsibilities(
    domain1: any, 
    domain2: any
  ): GuardResult {
    // Assertion 1: Valid domain objects
    console.assert(domain1 && domain2, 'Both domains must be provided');
    // Assertion 2: Responsibility arrays exist
    console.assert(
      Array.isArray(domain1.principalResponsibilities) && 
      Array.isArray(domain2.principalResponsibilities),
      'Responsibility arrays required'
    );
    
    if (!domain1 || !domain2) {
      return { passed: false, reason: 'Invalid domain objects' };
    }
    
    const resp1 = domain1.principalResponsibilities || [];
    const resp2 = domain2.principalResponsibilities || [];
    
    if (!Array.isArray(resp1) || !Array.isArray(resp2)) {
      return { passed: false, reason: 'Invalid responsibility arrays' };
    }
    
    const overlaps = resp1.filter(r => resp2.includes(r));
    
    return {
      passed: overlaps.length === 0,
      reason: overlaps.length > 0 ? 'Responsibility overlaps detected' : undefined,
      data: {
        domain1: domain1.domainName,
        domain2: domain2.domainName,
        overlaps
      }
    };
  }
  
  /**
   * Guard: Domain covers required functions - NASA Rule 10: ≤60 lines
   */
  static coversRequiredFunctions(
    domains: Map<string, any>,
    requiredFunctions: string[]
  ): GuardResult {
    // Assertion 1: Valid inputs
    console.assert(domains instanceof Map, 'Domains must be Map');
    // Assertion 2: Functions array provided
    console.assert(Array.isArray(requiredFunctions), 'Required functions must be array');
    
    if (!(domains instanceof Map)) {
      return { passed: false, reason: 'Invalid domains structure' };
    }
    
    if (!Array.isArray(requiredFunctions)) {
      return { passed: false, reason: 'Invalid required functions array' };
    }
    
    const uncoveredFunctions: string[] = [];
    
    for (const func of requiredFunctions) {
      let covered = false;
      
      for (const [, boundary] of domains) {
        const responsibilities = boundary.principalResponsibilities || [];
        if (responsibilities.some(resp => 
          resp.includes(func.replace('_', ' ')) ||
          func.includes(resp.replace(' ', '_'))
        )) {
          covered = true;
          break;
        }
      }
      
      if (!covered) {
        uncoveredFunctions.push(func);
      }
    }
    
    return {
      passed: uncoveredFunctions.length === 0,
      reason: uncoveredFunctions.length > 0 ? 'Uncovered functions detected' : undefined,
      data: {
        totalFunctions: requiredFunctions.length,
        uncovered: uncoveredFunctions,
        coveragePercentage: ((requiredFunctions.length - uncoveredFunctions.length) / requiredFunctions.length) * 100
      }
    };
  }
  
  /**
   * Guard: Agent assignment is valid - NASA Rule 10: Single responsibility
   */
  static isValidAgentAssignment(
    domain: any,
    agentType: string
  ): GuardResult {
    // Assertion 1: Valid domain
    console.assert(domain && domain.managedAgentTypes, 'Domain with agent types required');
    // Assertion 2: Valid agent type
    console.assert(typeof agentType === 'string' && agentType.length > 0, 'Valid agent type required');
    
    if (!domain || !domain.managedAgentTypes) {
      return { passed: false, reason: 'Invalid domain structure' };
    }
    
    if (typeof agentType !== 'string' || agentType.length === 0) {
      return { passed: false, reason: 'Invalid agent type' };
    }
    
    const validAssignment = domain.managedAgentTypes.includes(agentType);
    
    return {
      passed: validAssignment,
      reason: validAssignment ? undefined : 'Agent type not managed by domain',
      data: {
        domain: domain.domainName,
        agentType,
        managedTypes: domain.managedAgentTypes
      }
    };
  }
}

// Backward compatibility
export default MECEValidationGuards;
