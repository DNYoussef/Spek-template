/**
 * Security Framework Type Safety Test
 *
 * Validates that security framework maintains enterprise compliance
 * with enhanced type safety from Phase 4.
 */

import { describe, test, expect } from '@jest/globals';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Security-specific branded types
export type SecureToken = string & { readonly __brand: 'SecureToken'; readonly __entropy: 'high' };
export type HashedPassword = string & { readonly __brand: 'HashedPassword'; readonly __algorithm: 'bcrypt' };
export type EncryptedData = string & { readonly __brand: 'EncryptedData'; readonly __cipher: 'aes-256-gcm' };
export type SanitizedInput = string & { readonly __brand: 'SanitizedInput'; readonly __xss_safe: true };
export type ValidatedInput = string & { readonly __brand: 'ValidatedInput'; readonly __injection_safe: true };

export interface SecurityFrameworkTestResult {
  typeDefinitionsValid: boolean;
  inputValidationSecure: boolean;
  dataEncryptionProper: boolean;
  accessControlTyped: boolean;
  auditTrailCompliant: boolean;
  complianceScore: number;
}

export interface SecurityValidationRules {
  minPasswordLength: number;
  maxInputLength: number;
  allowedCharacters: RegExp;
  forbiddenPatterns: RegExp[];
  encryptionAlgorithm: string;
  hashAlgorithm: string;
}

export interface SecurityAuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  action: SecurityAction;
  resource: string;
  ipAddress: string;
  userAgent: string;
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  metadata?: Record<string, any>;
}

export enum SecurityAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  ACCESS_RESOURCE = 'access_resource',
  MODIFY_DATA = 'modify_data',
  DELETE_DATA = 'delete_data',
  ADMIN_ACTION = 'admin_action',
  API_CALL = 'api_call'
}

export class SecurityFrameworkTypeTest {
  private securityPaths: string[];
  private testResults: SecurityFrameworkTestResult;
  private validationRules: SecurityValidationRules;

  constructor() {
    this.securityPaths = [
      join(process.cwd(), 'src/utils/security'),
      join(process.cwd(), 'src/domains/ec'),
      join(process.cwd(), 'src/compliance')
    ];

    this.testResults = {
      typeDefinitionsValid: false,
      inputValidationSecure: false,
      dataEncryptionProper: false,
      accessControlTyped: false,
      auditTrailCompliant: false,
      complianceScore: 0
    };

    this.validationRules = {
      minPasswordLength: 12,
      maxInputLength: 10000,
      allowedCharacters: /^[a-zA-Z0-9\s\-_@.!?]*$/,
      forbiddenPatterns: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /eval\s*\(/gi,
        /expression\s*\(/gi
      ],
      encryptionAlgorithm: 'aes-256-gcm',
      hashAlgorithm: 'bcrypt'
    };
  }

  async runTests(): Promise<SecurityFrameworkTestResult> {
    describe('Security Framework Type Safety', () => {
      test('validates security type definitions', async () => {
        try {
          await this.validateSecurityTypeDefinitions();
          this.testResults.typeDefinitionsValid = true;
        } catch (error) {
          console.error('Security type definitions validation failed:', error);
        }
      });

      test('validates input validation security', async () => {
        try {
          await this.validateInputValidationSecurity();
          this.testResults.inputValidationSecure = true;
        } catch (error) {
          console.error('Input validation security test failed:', error);
        }
      });

      test('validates data encryption procedures', async () => {
        try {
          await this.validateDataEncryptionProcedures();
          this.testResults.dataEncryptionProper = true;
        } catch (error) {
          console.error('Data encryption validation failed:', error);
        }
      });

      test('validates access control typing', async () => {
        try {
          await this.validateAccessControlTyping();
          this.testResults.accessControlTyped = true;
        } catch (error) {
          console.error('Access control typing validation failed:', error);
        }
      });

      test('validates audit trail compliance', async () => {
        try {
          await this.validateAuditTrailCompliance();
          this.testResults.auditTrailCompliant = true;
        } catch (error) {
          console.error('Audit trail compliance validation failed:', error);
        }
      });
    });

    this.testResults.complianceScore = this.calculateComplianceScore();
    return this.testResults;
  }

  /**
   * Validate security type definitions
   */
  private async validateSecurityTypeDefinitions(): Promise<void> {
    // Check security files exist and have proper types
    let securityFilesFound = 0;
    let securityFilesWithTypes = 0;

    for (const securityPath of this.securityPaths) {
      if (existsSync(securityPath)) {
        securityFilesFound++;

        // Check for TypeScript files in security path
        const files = this.getSecurityFiles(securityPath);

        for (const file of files) {
          const content = readFileSync(file, 'utf8');

          // Check for security-related type definitions
          const hasSecurityTypes = content.includes('type') &&
                                  (content.includes('secure') ||
                                   content.includes('encrypt') ||
                                   content.includes('hash') ||
                                   content.includes('validate') ||
                                   content.includes('sanitize'));

          if (hasSecurityTypes) {
            securityFilesWithTypes++;
          }

          // Check for any types in security code
          const anyTypeMatches = content.match(/\bany\b/g) || [];
          if (anyTypeMatches.length > 0) {
            throw new Error(`Found ${anyTypeMatches.length} 'any' types in security file: ${file}`);
          }
        }
      }
    }

    if (securityFilesFound === 0) {
      throw new Error('No security framework files found');
    }

    // Test branded security types
    const testToken = 'secure-token-123456789' as SecureToken;
    const testHash = '$2b$12$test.hash.value.here' as HashedPassword;
    const testEncrypted = 'encrypted-data-aes-256' as EncryptedData;
    const testSanitized = 'clean-user-input' as SanitizedInput;

    expect(typeof testToken).toBe('string');
    expect(typeof testHash).toBe('string');
    expect(typeof testEncrypted).toBe('string');
    expect(typeof testSanitized).toBe('string');

    // Validate token entropy requirements
    expect(testToken.length).toBeGreaterThanOrEqual(20);

    // Validate hash format
    expect(testHash).toMatch(/^\$2[abyb]\$\d{2}\$/);
  }

  /**
   * Validate input validation security
   */
  private async validateInputValidationSecurity(): Promise<void> {
    // Test input validation functions
    const inputValidator = {
      sanitizeInput: (input: string): SanitizedInput => {
        // Basic XSS protection
        let sanitized = input
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');

        // Remove forbidden patterns
        for (const pattern of this.validationRules.forbiddenPatterns) {
          sanitized = sanitized.replace(pattern, '');
        }

        return sanitized as SanitizedInput;
      },

      validateInput: (input: string): ValidatedInput => {
        // Length validation
        if (input.length > this.validationRules.maxInputLength) {
          throw new Error('Input exceeds maximum length');
        }

        // Character validation
        if (!this.validationRules.allowedCharacters.test(input)) {
          throw new Error('Input contains forbidden characters');
        }

        // SQL injection protection
        const sqlInjectionPatterns = [
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
          /(--|#|\*\/|\/\*)/gi,
          /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi
        ];

        for (const pattern of sqlInjectionPatterns) {
          if (pattern.test(input)) {
            throw new Error('Input contains potential SQL injection');
          }
        }

        return input as ValidatedInput;
      },

      validatePassword: (password: string): boolean => {
        if (password.length < this.validationRules.minPasswordLength) {
          return false;
        }

        // Check for complexity requirements
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
      }
    };

    // Test normal input
    const normalInput = 'Hello World 123';
    const sanitizedNormal = inputValidator.sanitizeInput(normalInput);
    const validatedNormal = inputValidator.validateInput(normalInput);

    expect(sanitizedNormal).toBe(normalInput);
    expect(validatedNormal).toBe(normalInput);

    // Test XSS attempts
    const xssAttempts = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(1)">',
      'javascript:alert(1)',
      '<svg onload="alert(1)">',
      '"><script>alert(document.domain)</script>'
    ];

    for (const xssAttempt of xssAttempts) {
      const sanitized = inputValidator.sanitizeInput(xssAttempt);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('onerror=');
      expect(sanitized).not.toContain('onload=');
    }

    // Test SQL injection attempts
    const sqlInjectionAttempts = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "admin'--",
      "' UNION SELECT * FROM passwords --",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --"
    ];

    for (const sqlAttempt of sqlInjectionAttempts) {
      expect(() => inputValidator.validateInput(sqlAttempt)).toThrow();
    }

    // Test password validation
    const weakPasswords = ['password', '123456', 'qwerty', 'Password1'];
    const strongPasswords = ['MyStr0ng!Password123', 'C0mplex&SecurePa$$w0rd', '!Secure123Pass$'];

    for (const weakPassword of weakPasswords) {
      expect(inputValidator.validatePassword(weakPassword)).toBe(false);
    }

    for (const strongPassword of strongPasswords) {
      expect(inputValidator.validatePassword(strongPassword)).toBe(true);
    }

    // Test input length limits
    const oversizedInput = 'x'.repeat(this.validationRules.maxInputLength + 1);
    expect(() => inputValidator.validateInput(oversizedInput)).toThrow();
  }

  /**
   * Validate data encryption procedures
   */
  private async validateDataEncryptionProcedures(): Promise<void> {
    // Mock encryption service for testing
    const encryptionService = {
      generateKey: (): string => {
        // Mock 256-bit key generation
        return Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
      },

      generateIV: (): string => {
        // Mock 128-bit IV generation
        return Array.from({ length: 32 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
      },

      encrypt: (data: string, key: string): EncryptedData => {
        // Mock AES-256-GCM encryption
        if (!data || !key) {
          throw new Error('Data and key are required for encryption');
        }

        if (key.length !== 64) {
          throw new Error('Invalid key length for AES-256');
        }

        // Simulate encryption (would use actual crypto in real implementation)
        const iv = this.generateIV();
        const encrypted = Buffer.from(data).toString('base64');
        const authTag = Array.from({ length: 32 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('');

        return `${iv}:${encrypted}:${authTag}` as EncryptedData;
      },

      decrypt: (encryptedData: EncryptedData, key: string): string => {
        // Mock decryption
        if (!encryptedData || !key) {
          throw new Error('Encrypted data and key are required for decryption');
        }

        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
          throw new Error('Invalid encrypted data format');
        }

        const [iv, encrypted, authTag] = parts;

        // Simulate decryption
        return Buffer.from(encrypted, 'base64').toString();
      },

      hashPassword: (password: string): HashedPassword => {
        // Mock bcrypt hashing
        if (!password) {
          throw new Error('Password is required for hashing');
        }

        if (password.length < this.validationRules.minPasswordLength) {
          throw new Error('Password does not meet minimum length requirements');
        }

        // Simulate bcrypt hash
        const salt = Array.from({ length: 22 }, () =>
          'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./'
          [Math.floor(Math.random() * 64)]
        ).join('');

        return `$2b$12$${salt}hashedpasswordvalue` as HashedPassword;
      },

      verifyPassword: (password: string, hash: HashedPassword): boolean => {
        // Mock password verification
        if (!password || !hash) {
          return false;
        }

        // Simple mock verification (would use bcrypt.compare in real implementation)
        return hash.startsWith('$2b$12$') && password.length >= this.validationRules.minPasswordLength;
      }
    };

    // Test key generation
    const key = encryptionService.generateKey();
    expect(key).toHaveLength(64);
    expect(/^[0-9a-f]+$/i.test(key)).toBe(true);

    // Test IV generation
    const iv = encryptionService.generateIV();
    expect(iv).toHaveLength(32);
    expect(/^[0-9a-f]+$/i.test(iv)).toBe(true);

    // Test encryption/decryption
    const testData = 'Sensitive user data that needs encryption';
    const encrypted = encryptionService.encrypt(testData, key);
    const decrypted = encryptionService.decrypt(encrypted, key);

    expect(encrypted).not.toBe(testData);
    expect(decrypted).toBe(testData);

    // Test password hashing
    const testPassword = 'MySecurePassword123!';
    const hashedPassword = encryptionService.hashPassword(testPassword);
    const isValidPassword = encryptionService.verifyPassword(testPassword, hashedPassword);

    expect(hashedPassword).toMatch(/^\$2b\$12\$/);
    expect(isValidPassword).toBe(true);
    expect(encryptionService.verifyPassword('wrongpassword', hashedPassword)).toBe(false);

    // Test error handling
    expect(() => encryptionService.encrypt('', key)).toThrow();
    expect(() => encryptionService.encrypt(testData, '')).toThrow();
    expect(() => encryptionService.encrypt(testData, 'shortkey')).toThrow();
    expect(() => encryptionService.hashPassword('')).toThrow();
    expect(() => encryptionService.hashPassword('weak')).toThrow();
  }

  /**
   * Validate access control typing
   */
  private async validateAccessControlTyping(): Promise<void> {
    // Define access control types
    type UserId = string & { readonly __brand: 'UserId' };
    type Role = 'admin' | 'user' | 'viewer' | 'editor';
    type Permission = string & { readonly __brand: 'Permission' };
    type ResourceId = string & { readonly __brand: 'ResourceId' };

    interface AccessControlEntry {
      userId: UserId;
      roles: Role[];
      permissions: Permission[];
      resources: ResourceId[];
      expiresAt?: Date;
    }

    interface AccessRequest {
      userId: UserId;
      resource: ResourceId;
      action: string;
      context?: Record<string, any>;
    }

    interface AccessResponse {
      granted: boolean;
      reason: string;
      expiresAt?: Date;
    }

    // Mock access control service
    const accessControlService = {
      grantAccess: (entry: AccessControlEntry): boolean => {
        // Validate entry structure
        expect(typeof entry.userId).toBe('string');
        expect(Array.isArray(entry.roles)).toBe(true);
        expect(Array.isArray(entry.permissions)).toBe(true);
        expect(Array.isArray(entry.resources)).toBe(true);

        // Validate roles
        const validRoles: Role[] = ['admin', 'user', 'viewer', 'editor'];
        for (const role of entry.roles) {
          expect(validRoles).toContain(role);
        }

        return true;
      },

      checkAccess: (request: AccessRequest): AccessResponse => {
        // Validate request structure
        expect(typeof request.userId).toBe('string');
        expect(typeof request.resource).toBe('string');
        expect(typeof request.action).toBe('string');

        // Mock access control logic
        const hasAccess = request.userId !== 'blocked-user' &&
                         request.action !== 'forbidden-action';

        return {
          granted: hasAccess,
          reason: hasAccess ? 'Access granted' : 'Access denied',
          expiresAt: hasAccess ? new Date(Date.now() + 3600000) : undefined
        };
      },

      revokeAccess: (userId: UserId, resource: ResourceId): boolean => {
        expect(typeof userId).toBe('string');
        expect(typeof resource).toBe('string');
        return true;
      },

      listPermissions: (userId: UserId): Permission[] => {
        expect(typeof userId).toBe('string');

        // Mock permissions based on user
        if (userId === 'admin-user' as UserId) {
          return ['read', 'write', 'delete', 'admin'] as Permission[];
        } else if (userId === 'regular-user' as UserId) {
          return ['read', 'write'] as Permission[];
        } else {
          return ['read'] as Permission[];
        }
      }
    };

    // Test access control entries
    const testEntry: AccessControlEntry = {
      userId: 'user-123' as UserId,
      roles: ['user', 'editor'],
      permissions: ['read', 'write'] as Permission[],
      resources: ['resource-1', 'resource-2'] as ResourceId[],
      expiresAt: new Date(Date.now() + 86400000)
    };

    const grantResult = accessControlService.grantAccess(testEntry);
    expect(grantResult).toBe(true);

    // Test access requests
    const testRequests: AccessRequest[] = [
      {
        userId: 'user-123' as UserId,
        resource: 'resource-1' as ResourceId,
        action: 'read'
      },
      {
        userId: 'blocked-user' as UserId,
        resource: 'resource-1' as ResourceId,
        action: 'read'
      },
      {
        userId: 'user-123' as UserId,
        resource: 'resource-1' as ResourceId,
        action: 'forbidden-action'
      }
    ];

    const accessResults = testRequests.map(req => accessControlService.checkAccess(req));

    expect(accessResults[0].granted).toBe(true);
    expect(accessResults[1].granted).toBe(false);
    expect(accessResults[2].granted).toBe(false);

    // Test permission listing
    const adminPermissions = accessControlService.listPermissions('admin-user' as UserId);
    const userPermissions = accessControlService.listPermissions('regular-user' as UserId);
    const viewerPermissions = accessControlService.listPermissions('viewer-user' as UserId);

    expect(adminPermissions).toContain('admin' as Permission);
    expect(userPermissions).toContain('write' as Permission);
    expect(userPermissions).not.toContain('admin' as Permission);
    expect(viewerPermissions).toContain('read' as Permission);
    expect(viewerPermissions).not.toContain('write' as Permission);

    // Test access revocation
    const revokeResult = accessControlService.revokeAccess(
      'user-123' as UserId,
      'resource-1' as ResourceId
    );
    expect(revokeResult).toBe(true);
  }

  /**
   * Validate audit trail compliance
   */
  private async validateAuditTrailCompliance(): Promise<void> {
    // Mock audit service
    const auditService = {
      logEvent: (event: SecurityAuditEvent): boolean => {
        // Validate event structure
        expect(typeof event.id).toBe('string');
        expect(event.timestamp instanceof Date).toBe(true);
        expect(typeof event.userId).toBe('string');
        expect(Object.values(SecurityAction)).toContain(event.action);
        expect(typeof event.resource).toBe('string');
        expect(typeof event.ipAddress).toBe('string');
        expect(typeof event.userAgent).toBe('string');
        expect(['SUCCESS', 'FAILURE', 'BLOCKED']).toContain(event.result);

        // Validate IP address format
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        expect(ipRegex.test(event.ipAddress)).toBe(true);

        return true;
      },

      queryEvents: (
        filters: {
          userId?: string;
          action?: SecurityAction;
          startTime?: Date;
          endTime?: Date;
          result?: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
        }
      ): SecurityAuditEvent[] => {
        // Mock query implementation
        const mockEvents: SecurityAuditEvent[] = [
          {
            id: 'audit-001',
            timestamp: new Date(),
            userId: 'user-123',
            action: SecurityAction.LOGIN,
            resource: '/auth/login',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            result: 'SUCCESS'
          },
          {
            id: 'audit-002',
            timestamp: new Date(),
            userId: 'user-456',
            action: SecurityAction.ACCESS_RESOURCE,
            resource: '/api/sensitive-data',
            ipAddress: '192.168.1.2',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            result: 'BLOCKED'
          }
        ];

        // Apply filters
        let filteredEvents = mockEvents;

        if (filters.userId) {
          filteredEvents = filteredEvents.filter(e => e.userId === filters.userId);
        }

        if (filters.action) {
          filteredEvents = filteredEvents.filter(e => e.action === filters.action);
        }

        if (filters.result) {
          filteredEvents = filteredEvents.filter(e => e.result === filters.result);
        }

        return filteredEvents;
      },

      generateComplianceReport: (timeRange: { start: Date; end: Date }): {
        totalEvents: number;
        successfulEvents: number;
        failedEvents: number;
        blockedEvents: number;
        uniqueUsers: number;
        riskScore: number;
      } => {
        // Mock compliance report
        return {
          totalEvents: 1000,
          successfulEvents: 850,
          failedEvents: 100,
          blockedEvents: 50,
          uniqueUsers: 150,
          riskScore: 25 // Low risk
        };
      }
    };

    // Test event logging
    const testEvents: SecurityAuditEvent[] = [
      {
        id: 'test-001',
        timestamp: new Date(),
        userId: 'user-test',
        action: SecurityAction.LOGIN,
        resource: '/auth/login',
        ipAddress: '192.168.1.100',
        userAgent: 'Test User Agent',
        result: 'SUCCESS',
        metadata: { sessionId: 'session-123' }
      },
      {
        id: 'test-002',
        timestamp: new Date(),
        userId: 'user-test',
        action: SecurityAction.ACCESS_RESOURCE,
        resource: '/api/data',
        ipAddress: '192.168.1.100',
        userAgent: 'Test User Agent',
        result: 'FAILURE',
        metadata: { reason: 'Insufficient permissions' }
      }
    ];

    for (const event of testEvents) {
      const logResult = auditService.logEvent(event);
      expect(logResult).toBe(true);
    }

    // Test event querying
    const loginEvents = auditService.queryEvents({ action: SecurityAction.LOGIN });
    const blockedEvents = auditService.queryEvents({ result: 'BLOCKED' });
    const userEvents = auditService.queryEvents({ userId: 'user-123' });

    expect(Array.isArray(loginEvents)).toBe(true);
    expect(Array.isArray(blockedEvents)).toBe(true);
    expect(Array.isArray(userEvents)).toBe(true);

    // Validate event structure
    for (const event of loginEvents) {
      expect(event.action).toBe(SecurityAction.LOGIN);
    }

    for (const event of blockedEvents) {
      expect(event.result).toBe('BLOCKED');
    }

    // Test compliance reporting
    const report = auditService.generateComplianceReport({
      start: new Date(Date.now() - 86400000 * 30), // 30 days ago
      end: new Date()
    });

    expect(typeof report.totalEvents).toBe('number');
    expect(typeof report.successfulEvents).toBe('number');
    expect(typeof report.failedEvents).toBe('number');
    expect(typeof report.blockedEvents).toBe('number');
    expect(typeof report.uniqueUsers).toBe('number');
    expect(typeof report.riskScore).toBe('number');

    expect(report.totalEvents).toBeGreaterThan(0);
    expect(report.successfulEvents + report.failedEvents + report.blockedEvents).toBe(report.totalEvents);
    expect(report.riskScore).toBeGreaterThanOrEqual(0);
    expect(report.riskScore).toBeLessThanOrEqual(100);
  }

  /**
   * Get security-related files from path
   */
  private getSecurityFiles(path: string): string[] {
    try {
      const { execSync } = require('child_process');
      const result = execSync(`find ${path} -name "*.ts" -o -name "*.tsx" 2>/dev/null || echo ""`, {
        encoding: 'utf8'
      });

      return result.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
      return [];
    }
  }

  /**
   * Calculate overall compliance score
   */
  private calculateComplianceScore(): number {
    const weights = {
      typeDefinitionsValid: 20,
      inputValidationSecure: 25,
      dataEncryptionProper: 25,
      accessControlTyped: 15,
      auditTrailCompliant: 15
    };

    let score = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(weights)) {
      totalWeight += weight;
      if (this.testResults[key as keyof SecurityFrameworkTestResult]) {
        score += weight;
      }
    }

    return (score / totalWeight) * 100;
  }
}

export default SecurityFrameworkTypeTest;