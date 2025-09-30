/**
 * CODEX AGENT 008 - Dependency Validator
 * NASA Rule 10 Compliant: All functions ≤60 lines, no recursion, fixed loop bounds
 * FSM-First Design: Validator implementations with explicit state management
 */

import { EventEmitter } from 'events';
import {
  DependencyRequirement,
  DependencyGraph,
  ValidationResult,
  ValidatorConfig,
  VALIDATOR_TYPES,
  DEFAULT_CONFIG
} from './DependencyTypes';
import { delay } from './DependencyCore';

export abstract class DependencyValidator extends EventEmitter {
  protected config: ValidatorConfig;

  constructor(config: ValidatorConfig) {
    super();
    this.config = config;
  }

  // NASA Rule 10: Function ≤60 lines
  public abstract async validate(requirement: DependencyRequirement, graph: DependencyGraph): Promise<ValidationResult>;

  // NASA Rule 10: Function ≤60 lines
  protected createValidationResult(
    requirement: DependencyRequirement,
    passed: boolean,
    score: number,
    message: string,
    details?: any
  ): ValidationResult {
    return {
      validationId: `${this.config.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requirementId: requirement.requirementId,
      passed,
      score,
      message,
      timestamp: Date.now(),
      details
    };
  }
}

export class VersionValidator extends DependencyValidator {
  constructor() {
    super({
      type: VALIDATOR_TYPES.VERSION,
      timeout: 30000,
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1000,
        exponentialBackoff: true,
        retryableErrors: ['timeout', 'network_error'],
        escalationThreshold: 2
      }
    });
  }

  // NASA Rule 10: Function ≤60 lines
  public async validate(requirement: DependencyRequirement, graph: DependencyGraph): Promise<ValidationResult> {
    this.emit('validation:started', { requirementId: requirement.requirementId, type: 'version' });

    try {
      await delay(Math.min(50, this.config.timeout)); // Simulate validation work

      const isValid = await this.checkVersionCompatibility(requirement);
      const score = isValid ? 0.9 : 0.1;
      const message = isValid ? 'Version compatibility validated' : 'Version compatibility failed';

      this.emit('validation:completed', { requirementId: requirement.requirementId, passed: isValid });

      return this.createValidationResult(requirement, isValid, score, message, {
        versionChecked: requirement.criteria.value,
        operator: requirement.criteria.operator
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('validation:failed', { requirementId: requirement.requirementId, error: errorMessage });
      return this.createValidationResult(requirement, false, 0.0, `Version validation error: ${errorMessage}`);
    }
  }

  // NASA Rule 10: Function ≤60 lines
  private async checkVersionCompatibility(requirement: DependencyRequirement): Promise<boolean> {
    const { operator, value } = requirement.criteria;

    // Simulate version checking logic
    switch (operator) {
      case '==':
        return value === '1.0.0' || Math.random() > 0.1; // 90% success for equality
      case '>=':
        return typeof value === 'string' && value.localeCompare('0.5.0') >= 0;
      case '<=':
        return typeof value === 'string' && value.localeCompare('2.0.0') <= 0;
      case '>':
        return typeof value === 'string' && value.localeCompare('0.1.0') > 0;
      case '<':
        return typeof value === 'string' && value.localeCompare('3.0.0') < 0;
      case '!=':
        return value !== 'invalid_version';
      case 'regex':
        const pattern = new RegExp(value);
        return pattern.test('1.2.3'); // Test against sample version
      default:
        return Math.random() > 0.15; // 85% success for unknown operators
    }
  }
}

export class AvailabilityValidator extends DependencyValidator {
  constructor() {
    super({
      type: VALIDATOR_TYPES.AVAILABILITY,
      timeout: 10000,
      retryPolicy: {
        maxRetries: 5,
        retryDelay: 500,
        exponentialBackoff: true,
        retryableErrors: ['timeout', 'network_error', 'connection_refused'],
        escalationThreshold: 3
      }
    });
  }

  // NASA Rule 10: Function ≤60 lines
  public async validate(requirement: DependencyRequirement, graph: DependencyGraph): Promise<ValidationResult> {
    this.emit('validation:started', { requirementId: requirement.requirementId, type: 'availability' });

    try {
      await delay(Math.min(30, this.config.timeout)); // Simulate availability check

      const isAvailable = await this.checkComponentAvailability(requirement, graph);
      const score = isAvailable ? 0.95 : 0.05;
      const message = isAvailable ? 'Component availability validated' : 'Component not available';

      this.emit('validation:completed', { requirementId: requirement.requirementId, passed: isAvailable });

      return this.createValidationResult(requirement, isAvailable, score, message, {
        checkType: 'availability',
        criteria: requirement.criteria.value
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('validation:failed', { requirementId: requirement.requirementId, error: errorMessage });
      return this.createValidationResult(requirement, false, 0.0, `Availability check error: ${errorMessage}`);
    }
  }

  // NASA Rule 10: Function ≤60 lines
  private async checkComponentAvailability(requirement: DependencyRequirement, graph: DependencyGraph): Promise<boolean> {
    // Simulate availability check based on graph state
    const totalNodes = graph.nodes.size;
    const resolvedNodes = graph.statistics.resolvedNodes;
    const systemHealth = totalNodes > 0 ? resolvedNodes / totalNodes : 1.0;

    // Higher system health increases availability
    const baseAvailability = 0.95;
    const healthAdjustment = systemHealth * 0.05;
    const finalAvailability = baseAvailability + healthAdjustment;

    return Math.random() < finalAvailability;
  }
}

export class HealthValidator extends DependencyValidator {
  constructor() {
    super({
      type: VALIDATOR_TYPES.HEALTH,
      timeout: 15000,
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 2000,
        exponentialBackoff: true,
        retryableErrors: ['timeout', 'health_check_failed', 'service_degraded'],
        escalationThreshold: 2
      }
    });
  }

  // NASA Rule 10: Function ≤60 lines
  public async validate(requirement: DependencyRequirement, graph: DependencyGraph): Promise<ValidationResult> {
    this.emit('validation:started', { requirementId: requirement.requirementId, type: 'health' });

    try {
      await delay(Math.min(100, this.config.timeout)); // Simulate health check

      const isHealthy = await this.performHealthCheck(requirement, graph);
      const score = isHealthy ? 0.85 : 0.15;
      const message = isHealthy ? 'Component health validated' : 'Component health check failed';

      this.emit('validation:completed', { requirementId: requirement.requirementId, passed: isHealthy });

      return this.createValidationResult(requirement, isHealthy, score, message, {
        healthMetrics: {
          responseTime: Math.random() * 1000,
          errorRate: Math.random() * 0.1,
          uptime: 0.99 + Math.random() * 0.01
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('validation:failed', { requirementId: requirement.requirementId, error: errorMessage });
      return this.createValidationResult(requirement, false, 0.0, `Health check error: ${errorMessage}`);
    }
  }

  // NASA Rule 10: Function ≤60 lines
  private async performHealthCheck(requirement: DependencyRequirement, graph: DependencyGraph): Promise<boolean> {
    // Simulate health check based on graph statistics
    const errorRate = graph.statistics.failedNodes / Math.max(graph.statistics.totalNodes, 1);
    const successRate = graph.statistics.resolutionSuccessRate;

    // Health is good if error rate is low and success rate is high
    const healthThreshold = 0.8;
    const currentHealth = (1 - errorRate) * successRate;

    return currentHealth >= healthThreshold;
  }
}

export class CompatibilityValidator extends DependencyValidator {
  constructor() {
    super({
      type: VALIDATOR_TYPES.COMPATIBILITY,
      timeout: 20000,
      retryPolicy: {
        maxRetries: 2,
        retryDelay: 3000,
        exponentialBackoff: false,
        retryableErrors: ['timeout', 'compatibility_check_failed'],
        escalationThreshold: 1
      }
    });
  }

  // NASA Rule 10: Function ≤60 lines
  public async validate(requirement: DependencyRequirement, graph: DependencyGraph): Promise<ValidationResult> {
    this.emit('validation:started', { requirementId: requirement.requirementId, type: 'compatibility' });

    try {
      await delay(Math.min(150, this.config.timeout)); // Simulate compatibility check

      const isCompatible = await this.checkCompatibility(requirement, graph);
      const score = isCompatible ? 0.93 : 0.28;
      const message = isCompatible ? 'Component compatibility validated' : 'Compatibility issues detected';

      this.emit('validation:completed', { requirementId: requirement.requirementId, passed: isCompatible });

      return this.createValidationResult(requirement, isCompatible, score, message, {
        compatibilityMatrix: {
          apiVersion: 'v2.1',
          protocolSupport: ['http/1.1', 'http/2'],
          dataFormats: ['json', 'xml']
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('validation:failed', { requirementId: requirement.requirementId, error: errorMessage });
      return this.createValidationResult(requirement, false, 0.0, `Compatibility check error: ${errorMessage}`);
    }
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds
  private async checkCompatibility(requirement: DependencyRequirement, graph: DependencyGraph): Promise<boolean> {
    // Check for nodes with compatible interfaces
    const maxNodesToCheck = Math.min(graph.nodes.size, 100); // Fixed bound
    let compatibleNodes = 0;
    let checkedNodes = 0;

    for (const node of graph.nodes.values()) {
      if (checkedNodes >= maxNodesToCheck) break;

      // Simple compatibility logic based on component type and stability
      if (node.metadata.stability === 'stable' || node.metadata.stability === 'beta') {
        compatibleNodes++;
      }

      checkedNodes++;
    }

    const compatibilityRatio = checkedNodes > 0 ? compatibleNodes / checkedNodes : 1.0;
    return compatibilityRatio >= 0.8; // 80% compatibility threshold
  }
}

export class PerformanceValidator extends DependencyValidator {
  constructor() {
    super({
      type: VALIDATOR_TYPES.PERFORMANCE,
      timeout: 25000,
      retryPolicy: {
        maxRetries: 2,
        retryDelay: 5000,
        exponentialBackoff: true,
        retryableErrors: ['timeout', 'performance_degraded'],
        escalationThreshold: 1
      }
    });
  }

  // NASA Rule 10: Function ≤60 lines
  public async validate(requirement: DependencyRequirement, graph: DependencyGraph): Promise<ValidationResult> {
    this.emit('validation:started', { requirementId: requirement.requirementId, type: 'performance' });

    try {
      await delay(Math.min(200, this.config.timeout)); // Simulate performance test

      const performanceOk = await this.validatePerformance(requirement, graph);
      const score = performanceOk ? 0.87 : 0.32;
      const message = performanceOk ? 'Component performance validated' : 'Performance issues detected';

      this.emit('validation:completed', { requirementId: requirement.requirementId, passed: performanceOk });

      return this.createValidationResult(requirement, performanceOk, score, message, {
        performanceMetrics: {
          throughput: Math.random() * 10000,
          latency: Math.random() * 100,
          resourceUsage: Math.random() * 0.8
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('validation:failed', { requirementId: requirement.requirementId, error: errorMessage });
      return this.createValidationResult(requirement, false, 0.0, `Performance validation error: ${errorMessage}`);
    }
  }

  // NASA Rule 10: Function ≤60 lines
  private async validatePerformance(requirement: DependencyRequirement, graph: DependencyGraph): Promise<boolean> {
    // Simulate performance validation based on graph complexity
    const complexity = graph.nodes.size + graph.edges.size;
    const averageResolutionTime = graph.statistics.averageResolutionTime;

    // Performance is acceptable if resolution time is reasonable for complexity
    const maxAcceptableTime = complexity * 10 + 1000; // Base time + complexity factor
    const performanceThreshold = requirement.criteria.value || maxAcceptableTime;

    return averageResolutionTime <= performanceThreshold;
  }
}

export class SecurityValidator extends DependencyValidator {
  constructor() {
    super({
      type: VALIDATOR_TYPES.SECURITY,
      timeout: 30000,
      retryPolicy: {
        maxRetries: 1,
        retryDelay: 10000,
        exponentialBackoff: false,
        retryableErrors: ['timeout'],
        escalationThreshold: 0
      }
    });
  }

  // NASA Rule 10: Function ≤60 lines
  public async validate(requirement: DependencyRequirement, graph: DependencyGraph): Promise<ValidationResult> {
    this.emit('validation:started', { requirementId: requirement.requirementId, type: 'security' });

    try {
      await delay(Math.min(300, this.config.timeout)); // Simulate security scan

      const isSecure = await this.performSecurityCheck(requirement, graph);
      const score = isSecure ? 0.96 : 0.22;
      const message = isSecure ? 'Component security validated' : 'Security vulnerabilities found';

      this.emit('validation:completed', { requirementId: requirement.requirementId, passed: isSecure });

      return this.createValidationResult(requirement, isSecure, score, message, {
        securityScan: {
          vulnerabilities: isSecure ? 0 : Math.floor(Math.random() * 5) + 1,
          lastScanDate: new Date().toISOString(),
          riskLevel: isSecure ? 'low' : 'medium'
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('validation:failed', { requirementId: requirement.requirementId, error: errorMessage });
      return this.createValidationResult(requirement, false, 0.0, `Security validation error: ${errorMessage}`);
    }
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds
  private async performSecurityCheck(requirement: DependencyRequirement, graph: DependencyGraph): Promise<boolean> {
    // Simulate security validation based on component metadata
    const maxNodesToCheck = Math.min(graph.nodes.size, 50); // Fixed bound
    let secureNodes = 0;
    let checkedNodes = 0;

    for (const node of graph.nodes.values()) {
      if (checkedNodes >= maxNodesToCheck) break;

      // Consider enterprise and commercial support levels more secure
      if (node.metadata.supportLevel === 'enterprise' ||
          node.metadata.supportLevel === 'commercial') {
        secureNodes++;
      } else if (node.metadata.stability === 'stable') {
        secureNodes += 0.7; // Partial credit for stable components
      }

      checkedNodes++;
    }

    const securityRatio = checkedNodes > 0 ? secureNodes / checkedNodes : 1.0;
    return securityRatio >= 0.75; // 75% security threshold
  }
}

export class ValidatorRegistry {
  private validators: Map<string, DependencyValidator> = new Map();

  constructor() {
    this.initializeValidators();
  }

  // NASA Rule 10: Function ≤60 lines
  private initializeValidators(): void {
    this.validators.set(VALIDATOR_TYPES.VERSION, new VersionValidator());
    this.validators.set(VALIDATOR_TYPES.AVAILABILITY, new AvailabilityValidator());
    this.validators.set(VALIDATOR_TYPES.HEALTH, new HealthValidator());
    this.validators.set(VALIDATOR_TYPES.COMPATIBILITY, new CompatibilityValidator());
    this.validators.set(VALIDATOR_TYPES.PERFORMANCE, new PerformanceValidator());
    this.validators.set(VALIDATOR_TYPES.SECURITY, new SecurityValidator());
  }

  // NASA Rule 10: Function ≤60 lines
  public getValidator(type: string): DependencyValidator | undefined {
    return this.validators.get(type);
  }

  // NASA Rule 10: Function ≤60 lines
  public registerValidator(type: string, validator: DependencyValidator): void {
    if (this.validators.size >= 20) { // Fixed bound
      throw new Error('Maximum validator count reached');
    }

    this.validators.set(type, validator);
  }

  // NASA Rule 10: Function ≤60 lines
  public getAvailableValidators(): string[] {
    return Array.from(this.validators.keys());
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds
  public async validateAll(requirement: DependencyRequirement, graph: DependencyGraph): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const validator = this.getValidator(requirement.type);

    if (!validator) {
      throw new Error(`No validator found for type: ${requirement.type}`);
    }

    const result = await validator.validate(requirement, graph);
    results.push(result);

    return results;
  }
}

// NASA Rule 10: Function ≤60 lines
export function createValidatorRegistry(): ValidatorRegistry {
  return new ValidatorRegistry();
}

// NASA Rule 10: Function ≤60 lines
export function createVersionValidator(): VersionValidator {
  return new VersionValidator();
}

// NASA Rule 10: Function ≤60 lines
export function createAvailabilityValidator(): AvailabilityValidator {
  return new AvailabilityValidator();
}

// NASA Rule 10: Function ≤60 lines
export function createHealthValidator(): HealthValidator {
  return new HealthValidator();
}

// NASA Rule 10: Function ≤60 lines
export function createCompatibilityValidator(): CompatibilityValidator {
  return new CompatibilityValidator();
}

// NASA Rule 10: Function ≤60 lines
export function createPerformanceValidator(): PerformanceValidator {
  return new PerformanceValidator();
}

// NASA Rule 10: Function ≤60 lines
export function createSecurityValidator(): SecurityValidator {
  return new SecurityValidator();
}

