/**
 * MEGA SWARM AGENT 100: INTEGRATION SYSTEM KILLER
 * Integration Validator - Contract-Based Validation Engine
 * NASA Rule 10 Compliant: All functions ≤60 lines, no recursion, fixed loops
 * FSM-First Design: Validates integration contracts before execution
 */

import {
  IntegrationContract,
  ContractRequirement,
  ValidationRule,
  ValidationResult,
  IntegrationContext
} from './IntegrationFSMCore';

/**
 * Integration Contract Validator
 * Ensures all integration requirements are met before execution
 */
export class IntegrationValidator {
  private validationCache: Map<string, ValidationResult> = new Map();

  /**
   * Validate integration contract (NASA Rule 10: ≤60 lines)
   */
  public async validateContract(contract: IntegrationContract, context: IntegrationContext): Promise<ValidationResult> {
    const cacheKey = this.generateCacheKey(contract, context);
    const cached = this.validationCache.get(cacheKey);

    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    const result: ValidationResult = {
      passed: true,
      errors: [],
      warnings: [],
      metadata: {
        contractId: contract.id,
        contractType: contract.type,
        validatedAt: new Date().toISOString()
      }
    };

    // Validate requirements (fixed loop bound)
    for (let i = 0; i < Math.min(contract.requirements.length, 50); i++) {
      const requirement = contract.requirements[i];
      const reqResult = await this.validateRequirement(requirement, context);

      if (!reqResult.passed) {
        result.passed = false;
        result.errors.push(...reqResult.errors);
      }
      result.warnings.push(...reqResult.warnings);
    }

    // Validate rules (fixed loop bound)
    for (let i = 0; i < Math.min(contract.validation.length, 20); i++) {
      const rule = contract.validation[i];
      const ruleResult = await this.validateRule(rule, context);

      if (!ruleResult.passed) {
        result.passed = false;
        result.errors.push(...ruleResult.errors);
      }
      result.warnings.push(...ruleResult.warnings);
    }

    this.validationCache.set(cacheKey, result);
    return result;
  }

  /**
   * Validate single requirement (NASA Rule 10: ≤60 lines)
   */
  private async validateRequirement(requirement: ContractRequirement, context: IntegrationContext): Promise<ValidationResult> {
    const result: ValidationResult = {
      passed: true,
      errors: [],
      warnings: []
    };

    try {
      const value = context.data[requirement.name];

      // Check if mandatory requirement is missing
      if (requirement.mandatory && (value === undefined || value === null)) {
        result.passed = false;
        result.errors.push(`Mandatory requirement missing: ${requirement.name}`);
        return result;
      }

      // Skip validation if optional and not provided
      if (!requirement.mandatory && (value === undefined || value === null)) {
        return result;
      }

      // Run custom validation
      const isValid = requirement.validation(value);
      if (!isValid) {
        result.passed = false;
        result.errors.push(`Validation failed for requirement: ${requirement.name}`);
      }

    } catch (error) {
      result.passed = false;
      result.errors.push(`Requirement validation error: ${requirement.name} - ${error.message}`);
    }

    return result;
  }

  /**
   * Validate single rule (NASA Rule 10: ≤60 lines)
   */
  private async validateRule(rule: ValidationRule, context: IntegrationContext): Promise<ValidationResult> {
    try {
      // Respect retry bounds (NASA Rule 10)
      let attempts = 0;
      let lastError: Error | null = null;

      while (attempts < Math.min(rule.retryCount, 3)) {
        try {
          const result = await rule.validator(context.data);
          return result;
        } catch (error) {
          lastError = error;
          attempts++;

          if (attempts < Math.min(rule.retryCount, 3)) {
            await this.delay(1000 * attempts); // Exponential backoff
          }
        }
      }

      // All retries failed
      return {
        passed: false,
        errors: [`Rule validation failed after ${attempts} attempts: ${rule.name} - ${lastError?.message}`],
        warnings: []
      };

    } catch (error) {
      return {
        passed: false,
        errors: [`Rule validation error: ${rule.name} - ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate connection requirements (NASA Rule 10: ≤60 lines)
   */
  public async validateConnection(contract: IntegrationContract): Promise<ValidationResult> {
    const result: ValidationResult = {
      passed: true,
      errors: [],
      warnings: []
    };

    try {
      const adapter = contract.adapter;

      // Basic connectivity checks
      if (!adapter.endpoint) {
        result.passed = false;
        result.errors.push('Adapter endpoint is required');
      }

      if (!adapter.authentication || !adapter.authentication.type) {
        result.passed = false;
        result.errors.push('Authentication configuration is required');
      }

      // Validate timeout bounds (NASA Rule 10)
      if (adapter.timeout && (adapter.timeout < 1000 || adapter.timeout > 300000)) {
        result.warnings.push('Timeout should be between 1-300 seconds');
      }

      // Validate retry bounds (NASA Rule 10)
      if (adapter.retryAttempts && adapter.retryAttempts > 3) {
        result.errors.push('Retry attempts must not exceed 3 (NASA Rule 10)');
        result.passed = false;
      }

      // Validate batch size bounds
      if (adapter.batchSize && (adapter.batchSize < 1 || adapter.batchSize > 1000)) {
        result.warnings.push('Batch size should be between 1-1000');
      }

    } catch (error) {
      result.passed = false;
      result.errors.push(`Connection validation error: ${error.message}`);
    }

    return result;
  }

  /**
   * Generate validation cache key (NASA Rule 10: ≤60 lines)
   */
  private generateCacheKey(contract: IntegrationContract, context: IntegrationContext): string {
    const contractHash = this.hashObject({
      id: contract.id,
      type: contract.type,
      requirements: contract.requirements.map(r => ({ name: r.name, type: r.type, mandatory: r.mandatory })),
      validation: contract.validation.map(v => ({ id: v.id, type: v.type }))
    });

    const contextHash = this.hashObject({
      data: Object.keys(context.data).sort(),
      state: context.currentState
    });

    return `${contractHash}_${contextHash}`;
  }

  /**
   * Hash object for cache key (NASA Rule 10: ≤60 lines)
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;

    // Simple hash function with fixed bounds
    for (let i = 0; i < Math.min(str.length, 1000); i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(36);
  }

  /**
   * Check if cached result is still valid (NASA Rule 10: ≤60 lines)
   */
  private isCacheValid(result: ValidationResult): boolean {
    if (!result.metadata || !result.metadata.validatedAt) {
      return false;
    }

    const validatedAt = new Date(result.metadata.validatedAt);
    const now = new Date();
    const ageMs = now.getTime() - validatedAt.getTime();

    // Cache valid for 5 minutes
    return ageMs < 300000;
  }

  /**
   * Delay helper for retries (NASA Rule 10: ≤60 lines)
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, Math.min(ms, 10000)));
  }

  /**
   * Clear validation cache (NASA Rule 10: ≤60 lines)
   */
  public clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * Get cache statistics (NASA Rule 10: ≤60 lines)
   */
  public getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.validationCache.size,
      hitRate: 0 // Would need hit/miss tracking for real implementation
    };
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T09:39:45-04:00 | mega-swarm-100@agent | Created Integration Validator with contract-based validation engine | IntegrationValidator.ts | OK | Eliminates validation god object patterns with NASA compliance | 0.00 | c2d3f4e |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: integration-killer-003
- inputs: ["IntegrationFSMCore.ts", "IntegrationHub.ts"]
- tools_used: ["Write"]
- versions: {"model":"mega-swarm-100","prompt":"integration-elimination-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->