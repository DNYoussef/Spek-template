/**
 * Enterprise Security Framework Compliance Validation Tests
 * Validates security framework meets enterprise compliance requirements
 */

import { SecurityGateValidator } from '../../src/domains/quality-gates/compliance/SecurityGateValidator';
import { ComplianceGateManager } from '../../src/domains/quality-gates/compliance/ComplianceGateManager';
import { EnterpriseConfiguration } from '../../src/domains/quality-gates/config/EnterpriseConfiguration';
import { SecurityPrincess } from '../../src/swarm/hierarchy/domains/SecurityPrincess';
import { Task, TaskPriority } from '../../src/swarm/types/task.types';
import { PrincessDomain } from '../../src/swarm/hierarchy/types';

describe('Enterprise Security Framework Compliance', () => {
  let securityGateValidator: SecurityGateValidator;
  let complianceGateManager: ComplianceGateManager;
  let enterpriseConfig: EnterpriseConfiguration;
  let securityPrincess: SecurityPrincess;

  beforeEach(() => {
    enterpriseConfig = new EnterpriseConfiguration();
    securityGateValidator = new SecurityGateValidator(enterpriseConfig);
    complianceGateManager = new ComplianceGateManager(enterpriseConfig);
    securityPrincess = new SecurityPrincess();

    // Mock global MCP functions
    (globalThis as any).mcp__claude_flow__agent_spawn = jest.fn().mockResolvedValue({
      agentId: 'security-agent-' + Math.random().toString(36).substr(2, 9)
    });
  });

  afterEach(() => {
    delete (globalThis as any).mcp__claude_flow__agent_spawn;
  });

  describe('Security Gate Validation', () => {
    it('should validate authentication implementation against enterprise standards', async () => {
      const authenticationCode = `
        import bcrypt from 'bcrypt';
        import jwt from 'jsonwebtoken';

        export class AuthenticationService {
          private readonly saltRounds = 12;
          private readonly jwtSecret = process.env.JWT_SECRET;

          async hashPassword(password: string): Promise<string> {
            if (!password || password.length < 8) {
              throw new Error('Password must be at least 8 characters');
            }
            return bcrypt.hash(password, this.saltRounds);
          }

          async validatePassword(password: string, hash: string): Promise<boolean> {
            return bcrypt.compare(password, hash);
          }

          generateJWT(userId: string): string {
            if (!this.jwtSecret) {
              throw new Error('JWT_SECRET not configured');
            }

            return jwt.sign(
              { userId, iat: Date.now() },
              this.jwtSecret,
              { expiresIn: '1h' }
            );
          }
        }
      `;

      const validationResult = await securityGateValidator.validateCode(authenticationCode, {
        checkPasswordPolicies: true,
        validateJWTImplementation: true,
        requireSecretManagement: true,
        enforceInputValidation: true
      });

      expect(validationResult.passed).toBe(true);
      expect(validationResult.securityScore).toBeGreaterThanOrEqual(85);
      expect(validationResult.issues).toHaveLength(0);
      expect(validationResult.compliantFeatures).toContain('password-hashing');
      expect(validationResult.compliantFeatures).toContain('jwt-implementation');
      expect(validationResult.compliantFeatures).toContain('input-validation');
    });

    it('should detect security vulnerabilities in code', async () => {
      const vulnerableCode = `
        import express from 'express';
        import { exec } from 'child_process';

        const app = express();

        app.get('/execute', (req, res) => {
          const command = req.query.cmd; // SQL injection risk
          exec(command, (error, stdout) => { // Command injection
            res.send(stdout);
          });
        });

        app.post('/login', (req, res) => {
          const { username, password } = req.body;
          const query = \`SELECT * FROM users WHERE username = '\${username}' AND password = '\${password}'\`; // SQL injection
          // ... database query
        });
      `;

      const validationResult = await securityGateValidator.validateCode(vulnerableCode, {
        checkSQLInjection: true,
        checkCommandInjection: true,
        validateInputSanitization: true,
        requireParameterizedQueries: true
      });

      expect(validationResult.passed).toBe(false);
      expect(validationResult.securityScore).toBeLessThan(50);
      expect(validationResult.issues.length).toBeGreaterThan(0);

      const issueTypes = validationResult.issues.map(issue => issue.type);
      expect(issueTypes).toContain('COMMAND_INJECTION');
      expect(issueTypes).toContain('SQL_INJECTION');
      expect(issueTypes).toContain('UNSANITIZED_INPUT');
    });

    it('should validate HTTPS and encryption requirements', async () => {
      const secureServerCode = `
        import https from 'https';
        import fs from 'fs';
        import express from 'express';
        import helmet from 'helmet';

        const app = express();

        // Security middleware
        app.use(helmet({
          hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
          },
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"]
            }
          }
        }));

        const httpsOptions = {
          key: fs.readFileSync(process.env.SSL_PRIVATE_KEY_PATH),
          cert: fs.readFileSync(process.env.SSL_CERTIFICATE_PATH)
        };

        https.createServer(httpsOptions, app).listen(443, () => {
          console.log('HTTPS Server running on port 443');
        });
      `;

      const validationResult = await securityGateValidator.validateCode(secureServerCode, {
        requireHTTPS: true,
        validateSSLConfiguration: true,
        checkSecurityHeaders: true,
        requireCSP: true
      });

      expect(validationResult.passed).toBe(true);
      expect(validationResult.securityScore).toBeGreaterThanOrEqual(90);
      expect(validationResult.compliantFeatures).toContain('https-enforcement');
      expect(validationResult.compliantFeatures).toContain('security-headers');
      expect(validationResult.compliantFeatures).toContain('csp-implementation');
    });

    it('should enforce data encryption standards', async () => {
      const encryptionCode = `
        import crypto from 'crypto';

        export class DataEncryption {
          private readonly algorithm = 'aes-256-gcm';
          private readonly keyLength = 32;
          private readonly ivLength = 16;

          encrypt(text: string, key: Buffer): { encrypted: string; authTag: string; iv: string } {
            if (key.length !== this.keyLength) {
              throw new Error('Invalid key length');
            }

            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipher(this.algorithm, key, iv);

            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag();

            return {
              encrypted,
              authTag: authTag.toString('hex'),
              iv: iv.toString('hex')
            };
          }

          decrypt(encryptedData: { encrypted: string; authTag: string; iv: string }, key: Buffer): string {
            const decipher = crypto.createDecipher(
              this.algorithm,
              key,
              Buffer.from(encryptedData.iv, 'hex')
            );

            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
          }
        }
      `;

      const validationResult = await securityGateValidator.validateCode(encryptionCode, {
        requireStrongEncryption: true,
        validateKeyManagement: true,
        checkEncryptionAlgorithms: true,
        requireAuthenticatedEncryption: true
      });

      expect(validationResult.passed).toBe(true);
      expect(validationResult.securityScore).toBeGreaterThanOrEqual(85);
      expect(validationResult.compliantFeatures).toContain('strong-encryption');
      expect(validationResult.compliantFeatures).toContain('authenticated-encryption');
      expect(validationResult.compliantFeatures).toContain('proper-key-handling');
    });
  });

  describe('Compliance Gate Management', () => {
    it('should enforce SOC 2 compliance requirements', async () => {
      const complianceCheck = await complianceGateManager.validateSOC2Compliance({
        accessControls: {
          multiFactorAuthentication: true,
          roleBasedAccess: true,
          privilegedAccessManagement: true,
          userAccessReview: true
        },
        dataProtection: {
          dataEncryption: true,
          backupEncryption: true,
          dataRetentionPolicies: true,
          dataClassification: true
        },
        monitoring: {
          securityEventLogging: true,
          logIntegrityProtection: true,
          incidentResponsePlan: true,
          vulnerabilityManagement: true
        },
        systemOperations: {
          changeManagement: true,
          systemMonitoring: true,
          capacityManagement: true,
          systemBackups: true
        }
      });

      expect(complianceCheck.compliant).toBe(true);
      expect(complianceCheck.score).toBeGreaterThanOrEqual(90);
      expect(complianceCheck.passedCriteria.length).toBeGreaterThanOrEqual(15);
      expect(complianceCheck.failedCriteria).toHaveLength(0);
    });

    it('should validate ISO 27001 security controls', async () => {
      const iso27001Check = await complianceGateManager.validateISO27001Compliance({
        informationSecurityPolicies: true,
        riskManagement: true,
        assetManagement: true,
        humanResourceSecurity: true,
        physicalSecurity: true,
        communicationsAndOpsManagement: true,
        accessControl: true,
        systemsDevelopment: true,
        incidentManagement: true,
        businessContinuity: true,
        complianceMonitoring: true
      });

      expect(iso27001Check.compliant).toBe(true);
      expect(iso27001Check.score).toBeGreaterThanOrEqual(85);
      expect(iso27001Check.implementedControls.length).toBeGreaterThanOrEqual(10);
    });

    it('should enforce GDPR data protection requirements', async () => {
      const gdprCheck = await complianceGateManager.validateGDPRCompliance({
        dataProcessingLawfulness: true,
        consentManagement: true,
        dataSubjectRights: true,
        dataProtectionByDesign: true,
        dataBreachNotification: true,
        dataProtectionOfficer: true,
        dataProtectionImpactAssessment: true,
        crossBorderDataTransfers: true,
        recordsOfProcessing: true
      });

      expect(gdprCheck.compliant).toBe(true);
      expect(gdprCheck.score).toBeGreaterThanOrEqual(90);
      expect(gdprCheck.implementedRequirements).toContain('consent-management');
      expect(gdprCheck.implementedRequirements).toContain('data-subject-rights');
      expect(gdprCheck.implementedRequirements).toContain('privacy-by-design');
    });
  });

  describe('Security Princess Integration', () => {
    it('should execute comprehensive security audit workflow', async () => {
      const securityAuditTask: Task = {
        id: 'security-audit-001',
        name: 'Comprehensive Security Audit',
        description: 'Full security audit of authentication and authorization systems',
        domain: PrincessDomain.SECURITY,
        priority: TaskPriority.CRITICAL,
        files: [
          'src/auth/authentication.service.ts',
          'src/auth/authorization.middleware.ts',
          'src/security/encryption.service.ts',
          'src/security/security-headers.middleware.ts'
        ],
        dependencies: ['security-policies', 'compliance-frameworks'],
        estimatedLOC: 800
      };

      const auditResult = await securityPrincess.executeTask(securityAuditTask);

      expect(auditResult.result).toBe('security-complete');
      expect(auditResult.securityScore).toBeGreaterThanOrEqual(85);
      expect(auditResult.complianceValidated).toBe(true);
      expect(auditResult.vulnerabilitiesFound).toBeDefined();
      expect(auditResult.recommendations).toBeDefined();
      expect(auditResult.remediationSteps).toBeDefined();
    });

    it('should validate secure coding practices', async () => {
      const secureCodeReviewTask: Task = {
        id: 'secure-code-review-001',
        name: 'Secure Code Review',
        description: 'Review code for security vulnerabilities and compliance',
        domain: PrincessDomain.SECURITY,
        priority: TaskPriority.HIGH,
        files: [
          'src/api/user.controller.ts',
          'src/services/payment.service.ts',
          'src/utils/validation.utils.ts'
        ],
        dependencies: ['security-standards'],
        estimatedLOC: 500
      };

      const reviewResult = await securityPrincess.executeTask(secureCodeReviewTask);

      expect(reviewResult.result).toBe('security-complete');
      expect(reviewResult.codeQualityScore).toBeGreaterThanOrEqual(80);
      expect(reviewResult.securityPatterns).toBeDefined();
      expect(reviewResult.bestPracticesApplied).toBeDefined();
    });

    it('should enforce enterprise security policies', async () => {
      const policyEnforcementTask: Task = {
        id: 'policy-enforcement-001',
        name: 'Enterprise Security Policy Enforcement',
        description: 'Validate implementation against enterprise security policies',
        domain: PrincessDomain.SECURITY,
        priority: TaskPriority.CRITICAL,
        files: [
          'src/policies/security.policy.ts',
          'src/middleware/policy-enforcement.middleware.ts',
          'src/config/security.config.ts'
        ],
        dependencies: ['enterprise-policies', 'compliance-frameworks'],
        estimatedLOC: 400
      };

      const enforcementResult = await securityPrincess.executeTask(policyEnforcementTask);

      expect(enforcementResult.result).toBe('security-complete');
      expect(enforcementResult.policyCompliance).toBeGreaterThanOrEqual(95);
      expect(enforcementResult.violationsFound).toHaveLength(0);
      expect(enforcementResult.policiesValidated).toBeDefined();
    });
  });

  describe('Real-World Security Scenarios', () => {
    it('should handle financial services compliance (PCI DSS)', async () => {
      const pciComplianceCheck = await complianceGateManager.validatePCIDSSCompliance({
        networkSecurity: {
          firewallConfiguration: true,
          networkSegmentation: true,
          encryptedTransmission: true
        },
        dataProtection: {
          cardholderDataProtection: true,
          encryptedStorage: true,
          dataRetentionCompliance: true
        },
        vulnerabilityManagement: {
          securityTestingProgram: true,
          vulnerabilityScanning: true,
          penetrationTesting: true
        },
        accessControl: {
          restrictedAccess: true,
          uniqueUserIds: true,
          strongAuthentication: true
        },
        monitoring: {
          networkMonitoring: true,
          fileIntegrityMonitoring: true,
          logManagement: true
        }
      });

      expect(pciComplianceCheck.compliant).toBe(true);
      expect(pciComplianceCheck.score).toBeGreaterThanOrEqual(90);
      expect(pciComplianceCheck.level).toBe('Level 1'); // Highest compliance level
    });

    it('should validate healthcare compliance (HIPAA)', async () => {
      const hipaaComplianceCheck = await complianceGateManager.validateHIPAACompliance({
        safeguards: {
          administrativeSafeguards: true,
          physicalSafeguards: true,
          technicalSafeguards: true
        },
        dataProtection: {
          dataEncryption: true,
          accessLogging: true,
          dataBackupRecovery: true,
          dataIntegrityControls: true
        },
        accessControls: {
          minimumNecessaryRule: true,
          roleBasedAccess: true,
          userAuthentication: true,
          automaticLogoff: true
        },
        auditControls: {
          auditLogGeneration: true,
          auditLogReview: true,
          auditLogProtection: true
        }
      });

      expect(hipaaComplianceCheck.compliant).toBe(true);
      expect(hipaaComplianceCheck.score).toBeGreaterThanOrEqual(85);
      expect(hipaaComplianceCheck.safeguardsImplemented).toHaveLength(3);
    });

    it('should handle government security requirements (FedRAMP)', async () => {
      const fedrampCheck = await complianceGateManager.validateFedRAMPCompliance({
        securityControlFamilies: {
          accessControl: true,
          awarenessAndTraining: true,
          auditAndAccountability: true,
          configurationManagement: true,
          contingencyPlanning: true,
          identificationAndAuthentication: true,
          incidentResponse: true,
          maintenance: true,
          mediaProtection: true,
          physicalProtection: true,
          planningAndProcedures: true,
          riskAssessment: true,
          systemAndCommunicationsProtection: true,
          systemAndInformationIntegrity: true
        },
        authorizationLevel: 'Low', // or 'Moderate', 'High'
        continuousMonitoring: true
      });

      expect(fedrampCheck.compliant).toBe(true);
      expect(fedrampCheck.score).toBeGreaterThanOrEqual(90);
      expect(fedrampCheck.authorizationStatus).toBe('Authorized');
    });
  });

  describe('Security Performance and Scalability', () => {
    it('should handle large-scale security validations efficiently', async () => {
      const largeCodebase = Array.from({ length: 100 }, (_, i) => `
        // File ${i}
        export class SecurityValidationTest${i} {
          private encryptionKey = process.env.ENCRYPTION_KEY_${i};

          validateInput(input: string): boolean {
            return input.length > 0 && input.length < 1000;
          }

          sanitizeInput(input: string): string {
            return input.replace(/[<>]/g, '');
          }
        }
      `).join('\n');

      const startTime = Date.now();
      const validationResult = await securityGateValidator.validateCode(largeCodebase, {
        checkAllSecurityPatterns: true,
        performanceMode: 'comprehensive'
      });
      const validationTime = Date.now() - startTime;

      expect(validationTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(validationResult.securityScore).toBeGreaterThan(0);
      expect(validationResult.validatedFiles).toBe(100);
    });

    it('should maintain security validation consistency under load', async () => {
      const testCode = `
        export class LoadTestSecurity {
          authenticate(token: string): boolean {
            return jwt.verify(token, process.env.JWT_SECRET);
          }
        }
      `;

      const validationPromises = Array.from({ length: 20 }, () =>
        securityGateValidator.validateCode(testCode, {
          requireJWTValidation: true,
          checkEnvironmentVariables: true
        })
      );

      const results = await Promise.all(validationPromises);

      // All results should be consistent
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.passed).toBe(firstResult.passed);
        expect(result.securityScore).toBeCloseTo(firstResult.securityScore, 1);
      });
    });
  });

  describe('Compliance Reporting and Documentation', () => {
    it('should generate comprehensive compliance reports', async () => {
      const complianceReport = await complianceGateManager.generateComplianceReport({
        frameworks: ['SOC2', 'ISO27001', 'GDPR'],
        includeEvidence: true,
        includeRecommendations: true,
        reportFormat: 'comprehensive'
      });

      expect(complianceReport.summary).toBeDefined();
      expect(complianceReport.frameworkResults).toBeDefined();
      expect(complianceReport.overallScore).toBeGreaterThanOrEqual(85);
      expect(complianceReport.evidence).toBeDefined();
      expect(complianceReport.recommendations).toBeDefined();
      expect(complianceReport.generatedAt).toBeInstanceOf(Date);
    });

    it('should track compliance history and trends', async () => {
      // Simulate multiple compliance checks over time
      const checks = [
        { framework: 'SOC2', score: 85, date: new Date('2024-01-01') },
        { framework: 'SOC2', score: 88, date: new Date('2024-02-01') },
        { framework: 'SOC2', score: 92, date: new Date('2024-03-01') }
      ];

      const trendAnalysis = await complianceGateManager.analyzeComplianceTrends(checks);

      expect(trendAnalysis.trend).toBe('improving');
      expect(trendAnalysis.averageScore).toBeCloseTo(88.33, 1);
      expect(trendAnalysis.scoreImprovement).toBeCloseTo(7, 1);
      expect(trendAnalysis.recommendations).toBeDefined();
    });
  });
});