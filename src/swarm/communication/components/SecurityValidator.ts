/**
 * Security Validator Component
 * Handles security validation for Princess communication
 * NASA Rule 10 Compliant with bounded validation checks
 */

import { EventEmitter } from 'events';
import { PrincessMessage, SecurityValidation } from '~types/CommunicationTypes';
import { ContextFingerprint } from '../../../context/ContextDNA';

export class SecurityValidator extends EventEmitter {
  private validationCache: Map<string, SecurityValidation> = new Map();
  private suspiciousPatterns: Set<string> = new Set();

  private readonly MAX_CACHE_SIZE = 1000; // NASA Rule 10: bounded cache
  private readonly VALIDATION_TIMEOUT = 5000; // 5 seconds max validation time
  private readonly MAX_VALIDATION_CHECKS = 10; // Max checks per message

  constructor() {
    super();
    this.initializeSuspiciousPatterns();
  }

  public async validateMessage(message: PrincessMessage): Promise<SecurityValidation> {
    const validationId = `${message.messageId}_${Date.now()}`;

    const validation: SecurityValidation = {
      messageId: message.messageId,
      integrityCheck: false,
      authenticationCheck: false,
      authorizationCheck: false,
      contextValidation: false,
      timestamp: Date.now(),
      violations: []
    };

    try {
      // Run validation checks with timeout
      await Promise.race([
        this.performValidationChecks(message, validation),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Validation timeout')), this.VALIDATION_TIMEOUT)
        )
      ]);

      // Cache validation result
      this.cacheValidation(validationId, validation);

    } catch (error) {
      validation.violations.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return validation;
  }

  private async performValidationChecks(message: PrincessMessage, validation: SecurityValidation): Promise<void> {
    let checkCount = 0;

    // Integrity Check
    if (checkCount < this.MAX_VALIDATION_CHECKS) {
      validation.integrityCheck = this.validateMessageIntegrity(message);
      if (!validation.integrityCheck) {
        validation.violations.push('Message integrity check failed');
      }
      checkCount++;
    }

    // Authentication Check
    if (checkCount < this.MAX_VALIDATION_CHECKS) {
      validation.authenticationCheck = this.validateAuthentication(message);
      if (!validation.authenticationCheck) {
        validation.violations.push('Authentication check failed');
      }
      checkCount++;
    }

    // Authorization Check
    if (checkCount < this.MAX_VALIDATION_CHECKS) {
      validation.authorizationCheck = this.validateAuthorization(message);
      if (!validation.authorizationCheck) {
        validation.violations.push('Authorization check failed');
      }
      checkCount++;
    }

    // Context Validation
    if (checkCount < this.MAX_VALIDATION_CHECKS) {
      validation.contextValidation = this.validateContext(message);
      if (!validation.contextValidation) {
        validation.violations.push('Context validation failed');
      }
      checkCount++;
    }

    // Suspicious Pattern Check
    if (checkCount < this.MAX_VALIDATION_CHECKS) {
      const suspiciousCheck = this.checkSuspiciousPatterns(message);
      if (!suspiciousCheck) {
        validation.violations.push('Suspicious pattern detected');
      }
      checkCount++;
    }
  }

  private validateMessageIntegrity(message: PrincessMessage): boolean {
    try {
      // Basic integrity checks
      if (!message.messageId || !message.fromPrincess || !message.toPrincess) {
        return false;
      }

      if (!message.messageType || !message.priority) {
        return false;
      }

      if (message.timestamp && Math.abs(Date.now() - message.timestamp) > 300000) { // 5 minutes
        return false;
      }

      if (message.expiresAt && message.expiresAt < Date.now()) {
        return false;
      }

      if (message.retryCount < 0 || message.retryCount > 10) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private validateAuthentication(message: PrincessMessage): boolean {
    try {
      // Validate sender identity
      if (!this.isValidPrincessId(message.fromPrincess)) {
        return false;
      }

      // Validate message signature/context fingerprint
      if (!message.contextFingerprint) {
        return false;
      }

      return this.validateContextFingerprint(message.contextFingerprint);
    } catch {
      return false;
    }
  }

  private validateAuthorization(message: PrincessMessage): boolean {
    try {
      // Check if sender is authorized to send this type of message
      const authorizedMessageTypes = this.getAuthorizedMessageTypes(message.fromPrincess);

      if (!authorizedMessageTypes.includes(message.messageType)) {
        return false;
      }

      // Check priority authorization
      if (message.priority === 'emergency' && !this.isEmergencyAuthorized(message.fromPrincess)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private validateContext(message: PrincessMessage): boolean {
    try {
      if (!message.contextFingerprint) {
        return false;
      }

      // Validate context fingerprint structure
      const requiredFields = ['contextId', 'timestamp', 'checksum'];
      return requiredFields.every(field => field in message.contextFingerprint);
    } catch {
      return false;
    }
  }

  private checkSuspiciousPatterns(message: PrincessMessage): boolean {
    try {
      const messageString = JSON.stringify(message).toLowerCase();

      for (const pattern of this.suspiciousPatterns) {
        if (messageString.includes(pattern)) {
          this.emit('suspicious_pattern_detected', {
            messageId: message.messageId,
            pattern,
            sender: message.fromPrincess
          });
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  private isValidPrincessId(princessId: string): boolean {
    // Validate princess ID format and existence
    const validFormat = /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(princessId);
    const validLength = princessId.length >= 3 && princessId.length <= 50;

    return validFormat && validLength;
  }

  private validateContextFingerprint(fingerprint: ContextFingerprint): boolean {
    try {
      // Basic structure validation
      if (!fingerprint.contextId || !fingerprint.timestamp || !fingerprint.checksum) {
        return false;
      }

      // Timestamp validation
      const age = Date.now() - fingerprint.timestamp;
      if (age < 0 || age > 3600000) { // Max 1 hour old
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private getAuthorizedMessageTypes(princessId: string): string[] {
    // Return authorized message types for the princess
    // This would typically come from a configuration or database
    return [
      'task_handoff',
      'status_update',
      'escalation',
      'resource_request',
      'coordination_sync'
    ];
  }

  private isEmergencyAuthorized(princessId: string): boolean {
    // Check if princess is authorized for emergency messages
    const emergencyAuthorized = [
      'security_princess',
      'infrastructure_princess',
      'quality_princess'
    ];

    return emergencyAuthorized.includes(princessId);
  }

  private initializeSuspiciousPatterns(): void {
    this.suspiciousPatterns.add('eval(');
    this.suspiciousPatterns.add('function(');
    this.suspiciousPatterns.add('script');
    this.suspiciousPatterns.add('javascript:');
    this.suspiciousPatterns.add('data:text/html');
    this.suspiciousPatterns.add('vbscript:');
    this.suspiciousPatterns.add('onload=');
    this.suspiciousPatterns.add('onerror=');
    this.suspiciousPatterns.add('<script');
    this.suspiciousPatterns.add('</script>');
  }

  private cacheValidation(validationId: string, validation: SecurityValidation): void {
    // Maintain bounded cache size
    if (this.validationCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.validationCache.keys().next().value;
      this.validationCache.delete(oldestKey);
    }

    this.validationCache.set(validationId, validation);
  }

  public getValidationMetrics(): any {
    const totalValidations = this.validationCache.size;
    const validations = Array.from(this.validationCache.values());

    const passedValidations = validations.filter(v =>
      v.integrityCheck && v.authenticationCheck && v.authorizationCheck && v.contextValidation
    ).length;

    const violationCounts = validations.reduce((acc, v) => {
      acc.total += v.violations.length;
      v.violations.forEach(violation => {
        acc.byType[violation] = (acc.byType[violation] || 0) + 1;
      });
      return acc;
    }, { total: 0, byType: {} as Record<string, number> });

    return {
      totalValidations,
      passRate: totalValidations > 0 ? passedValidations / totalValidations : 0,
      violationRate: totalValidations > 0 ? violationCounts.total / totalValidations : 0,
      commonViolations: Object.entries(violationCounts.byType)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
    };
  }

  public clearCache(): void {
    this.validationCache.clear();
  }
}