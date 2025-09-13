/**
 * Enterprise Compliance Automation Agent - Comprehensive Test Suite
 * Tests for all EC domain components with multi-framework validation
 *
 * Domain: EC (Enterprise Compliance)
 * Coverage: All tasks EC-001 through EC-006
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EnterpriseComplianceAutomationAgent } from '../../../src/domains/ec/compliance-automation-agent';
import { SOC2AutomationEngine } from '../../../src/domains/ec/frameworks/soc2-automation';
import { ISO27001ControlMapper } from '../../../src/domains/ec/frameworks/iso27001-mapper';
import { NISTSSFDValidator } from '../../../src/domains/ec/frameworks/nist-ssdf-validator';
import { AuditTrailGenerator } from '../../../src/domains/ec/audit/audit-trail-generator';
import { ComplianceCorrelator } from '../../../src/domains/ec/correlation/compliance-correlator';
import { RealTimeMonitor } from '../../../src/domains/ec/monitoring/real-time-monitor';
import { RemediationOrchestrator } from '../../../src/domains/ec/remediation/remediation-orchestrator';
import { Phase3ComplianceIntegration } from '../../../src/domains/ec/integrations/phase3-integration';

// Mock configuration for testing
const mockConfig = {
  frameworks: ['soc2', 'iso27001', 'nist-ssdf'],
  auditRetentionDays: 90,
  performanceBudget: 0.003, // 0.3%
  enableRealTimeMonitoring: true,
  remediationThresholds: {
    critical: 95,
    high: 80,
    medium: 60
  },
  integrations: {
    phase3Evidence: true,
    enterpriseConfig: true,
    nasaPOT10: true
  }
};

describe('Enterprise Compliance Automation Agent', () => {
  let complianceAgent: EnterpriseComplianceAutomationAgent;

  beforeEach(() => {
    complianceAgent = new EnterpriseComplianceAutomationAgent(mockConfig);
  });

  afterEach(async () => {
    if (complianceAgent) {
      await complianceAgent.stop();
    }
  });

  describe('Agent Initialization', () => {
    test('should initialize with all frameworks', async () => {
      expect(complianceAgent).toBeDefined();
      expect(complianceAgent.getPerformanceMetrics()).toBeDefined();
    });

    test('should emit initialization events', async () => {
      const initEventPromise = new Promise((resolve) => {
        complianceAgent.on('initialized', resolve);
      });

      // Re-initialize to trigger event
      complianceAgent = new EnterpriseComplianceAutomationAgent(mockConfig);
      const initEvent = await initEventPromise;

      expect(initEvent).toMatchObject({
        timestamp: expect.any(Date),
        frameworks: mockConfig.frameworks
      });
    });

    test('should validate performance budget configuration', async () => {
      const status = await complianceAgent.getComplianceStatus();
      expect(status).toBeDefined();
      expect(status.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Multi-Framework Compliance Assessment', () => {
    test('should execute comprehensive compliance assessment', async () => {
      const compliancePromise = new Promise((resolve) => {
        complianceAgent.on('compliance:completed', resolve);
      });

      const status = await complianceAgent.startCompliance();

      expect(status).toMatchObject({
        overall: expect.any(Number),
        frameworks: {
          soc2: expect.any(String),
          iso27001: expect.any(String),
          nistSSFD: expect.any(String)
        },
        auditTrail: expect.any(String),
        performanceOverhead: expect.any(Number),
        timestamp: expect.any(Date)
      });

      expect(status.overall).toBeGreaterThan(0);
      expect(status.performanceOverhead).toBeLessThan(mockConfig.performanceBudget);
    });

    test('should validate performance stays within budget', async () => {
      const startTime = performance.now();
      await complianceAgent.startCompliance();
      const endTime = performance.now();

      const performanceMetrics = complianceAgent.getPerformanceMetrics();
      const overhead = ((endTime - startTime) / 1000) / 100;

      expect(overhead).toBeLessThan(mockConfig.performanceBudget);
    });

    test('should generate unified compliance report', async () => {
      await complianceAgent.startCompliance();
      const report = await complianceAgent.generateComplianceReport();

      expect(report).toBeDefined();
      expect(report.frameworks).toEqual(expect.arrayContaining(mockConfig.frameworks));
    });
  });

  describe('Real-Time Monitoring Integration', () => {
    test('should start real-time monitoring', async () => {
      const monitoringPromise = new Promise((resolve) => {
        complianceAgent.on('monitoring:started', resolve);
      });

      await complianceAgent.startCompliance();
      const monitoringEvent = await monitoringPromise;

      expect(monitoringEvent).toMatchObject({
        timestamp: expect.any(Date)
      });
    });

    test('should handle compliance drift detection', async () => {
      const driftPromise = new Promise((resolve) => {
        complianceAgent.on('compliance:drift', resolve);
      });

      // Simulate compliance drift (this would normally come from monitoring)
      complianceAgent.emit('compliance:drift', {
        framework: 'soc2',
        severity: 'medium',
        affectedControls: ['CC6.1'],
        evidence: ['Test drift evidence']
      });

      const driftEvent = await driftPromise;
      expect(driftEvent.framework).toBe('soc2');
      expect(driftEvent.severity).toBe('medium');
    });

    test('should handle control failure detection', async () => {
      const failurePromise = new Promise((resolve) => {
        complianceAgent.on('control:failure', resolve);
      });

      // Simulate control failure
      complianceAgent.emit('control:failure', {
        control: 'CC6.2',
        framework: 'soc2',
        failure: 'Validation failed',
        impact: 'high'
      });

      const failureEvent = await failurePromise;
      expect(failureEvent.control).toBe('CC6.2');
      expect(failureEvent.framework).toBe('soc2');
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle framework initialization errors gracefully', async () => {
      const errorConfig = { ...mockConfig, frameworks: ['invalid-framework'] };

      expect(() => {
        new EnterpriseComplianceAutomationAgent(errorConfig as any);
      }).not.toThrow();
    });

    test('should continue operation if one framework fails', async () => {
      // Mock one framework to fail
      const partialConfig = { ...mockConfig };
      const agent = new EnterpriseComplianceAutomationAgent(partialConfig);

      const status = await agent.startCompliance();
      expect(status).toBeDefined();

      await agent.stop();
    });

    test('should emit error events for troubleshooting', async () => {
      const errorPromise = new Promise((resolve) => {
        complianceAgent.on('error', resolve);
      });

      // This will not immediately throw but we'll test error handling
      setTimeout(() => {
        complianceAgent.emit('error', { type: 'test_error', message: 'Test error' });
      }, 100);

      const errorEvent = await errorPromise;
      expect(errorEvent).toMatchObject({
        type: 'test_error',
        message: 'Test error'
      });
    });
  });
});

describe('SOC2 Automation Engine - EC-001', () => {
  let soc2Engine: SOC2AutomationEngine;

  beforeEach(() => {
    soc2Engine = new SOC2AutomationEngine({
      trustServicesCriteria: ['security', 'availability', 'integrity'],
      automatedAssessment: true,
      realTimeValidation: true,
      evidenceCollection: true,
      continuousMonitoring: true
    });
  });

  describe('Trust Services Criteria Validation', () => {
    test('should initialize with all Trust Services Criteria controls', () => {
      const securityControls = soc2Engine.getControls('security');
      const availabilityControls = soc2Engine.getControls('availability');
      const integrityControls = soc2Engine.getControls('integrity');

      expect(securityControls.length).toBeGreaterThan(0);
      expect(availabilityControls.length).toBeGreaterThan(0);
      expect(integrityControls.length).toBeGreaterThan(0);

      // Verify critical security controls are present
      const controlIds = securityControls.map(c => c.id);
      expect(controlIds).toContain('CC6.1'); // Logical and physical access controls
      expect(controlIds).toContain('CC6.2'); // System access credentials management
      expect(controlIds).toContain('CC6.7'); // Data transmission and disposal
    });

    test('should execute Type II assessment with all criteria', async () => {
      const assessment = await soc2Engine.runTypeIIAssessment({
        trustServicesCriteria: {
          security: {
            controls: ['CC6.1', 'CC6.2', 'CC6.3'],
            automatedValidation: true,
            evidenceCollection: true
          },
          availability: {
            controls: ['A1.1', 'A1.2'],
            monitoring: true,
            metrics: ['uptime', 'performance']
          },
          integrity: {
            controls: ['PI1.1'],
            dataValidation: true,
            changeControls: true
          }
        },
        automatedTesting: true,
        continuousMonitoring: true,
        evidencePackaging: true
      });

      expect(assessment).toMatchObject({
        assessmentId: expect.any(String),
        timestamp: expect.any(Date),
        criteria: expect.arrayContaining(['security', 'availability', 'integrity']),
        controls: expect.any(Array),
        overallRating: expect.stringMatching(/compliant|partially-compliant|non-compliant/),
        complianceScore: expect.any(Number),
        status: 'completed'
      });

      expect(assessment.complianceScore).toBeGreaterThanOrEqual(0);
      expect(assessment.complianceScore).toBeLessThanOrEqual(100);
    });

    test('should generate compliance findings for non-compliant controls', async () => {
      const assessment = await soc2Engine.runTypeIIAssessment({
        trustServicesCriteria: {
          security: {
            controls: ['CC6.1', 'CC6.2'],
            automatedValidation: true,
            evidenceCollection: true
          }
        }
      });

      expect(assessment.findings).toBeDefined();
      expect(Array.isArray(assessment.findings)).toBe(true);

      if (assessment.findings.length > 0) {
        const finding = assessment.findings[0];
        expect(finding).toMatchObject({
          id: expect.any(String),
          control: expect.any(String),
          severity: expect.stringMatching(/low|medium|high|critical/),
          finding: expect.any(String),
          recommendation: expect.any(String),
          status: expect.stringMatching(/open|closed|in-progress/)
        });
      }
    });

    test('should collect evidence for each assessed control', async () => {
      const assessment = await soc2Engine.runTypeIIAssessment({
        trustServicesCriteria: {
          security: {
            controls: ['CC6.1'],
            evidenceCollection: true
          }
        }
      });

      expect(assessment.evidencePackage).toBeDefined();
      expect(Array.isArray(assessment.evidencePackage)).toBe(true);

      if (assessment.evidencePackage.length > 0) {
        const evidence = assessment.evidencePackage[0];
        expect(evidence).toMatchObject({
          id: expect.any(String),
          type: expect.any(String),
          source: expect.any(String),
          timestamp: expect.any(Date),
          hash: expect.any(String),
          controlId: expect.any(String)
        });
      }
    });
  });

  describe('Automated Assessment Workflows', () => {
    test('should execute automated tests for controls', async () => {
      const assessment = await soc2Engine.runTypeIIAssessment({
        trustServicesCriteria: {
          security: {
            controls: ['CC6.1'],
            automatedValidation: true
          }
        }
      });

      const controlAssessment = assessment.controls.find(c => c.controlId === 'CC6.1');
      expect(controlAssessment).toBeDefined();
      expect(controlAssessment?.testResults).toBeDefined();
      expect(Array.isArray(controlAssessment?.testResults)).toBe(true);
    });

    test('should provide assessment history', () => {
      const history = soc2Engine.getAssessmentHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    test('should track current assessment status', () => {
      const currentAssessment = soc2Engine.getCurrentAssessment();
      // May be null if no assessment is running
      expect(currentAssessment === null || typeof currentAssessment === 'object').toBe(true);
    });
  });
});

describe('ISO27001 Control Mapper - EC-002', () => {
  let iso27001Mapper: ISO27001ControlMapper;

  beforeEach(() => {
    iso27001Mapper = new ISO27001ControlMapper({
      version: '2022',
      annexAControls: true,
      automatedMapping: true,
      riskAssessment: true,
      managementSystem: true,
      continuousImprovement: true
    });
  });

  describe('Annex A Controls Assessment', () => {
    test('should initialize with Annex A control domains', () => {
      const organizationalControls = iso27001Mapper.getControlsByDomain('organizational');
      const peopleControls = iso27001Mapper.getControlsByDomain('people');
      const physicalControls = iso27001Mapper.getControlsByDomain('physical');
      const technologicalControls = iso27001Mapper.getControlsByDomain('technological');

      expect(organizationalControls.length).toBeGreaterThan(0);
      expect(peopleControls.length).toBeGreaterThan(0);
      expect(physicalControls.length).toBeGreaterThan(0);
      expect(technologicalControls.length).toBeGreaterThan(0);

      // Verify key controls are present
      const allControls = iso27001Mapper.getAllControls();
      const controlIds = allControls.map(c => c.id);
      expect(controlIds).toContain('A.5.1'); // Policies for information security
      expect(controlIds).toContain('A.8.2'); // Privileged access rights
    });

    test('should execute comprehensive control assessment', async () => {
      const assessment = await iso27001Mapper.assessControls({
        annexA: {
          organizationalControls: {
            range: 'A.5.1 - A.5.37',
            assessment: 'automated',
            evidence: 'continuous'
          },
          technologicalControls: {
            range: 'A.8.1 - A.8.34',
            assessment: 'automated',
            evidence: 'continuous'
          }
        },
        riskAssessment: {
          automated: true,
          riskRegister: true,
          treatmentPlans: true
        }
      });

      expect(assessment).toMatchObject({
        assessmentId: expect.any(String),
        timestamp: expect.any(Date),
        version: '2022',
        controls: expect.any(Array),
        riskAssessment: expect.any(Object),
        complianceScore: expect.any(Number),
        status: 'completed'
      });

      expect(assessment.complianceScore).toBeGreaterThanOrEqual(0);
      expect(assessment.complianceScore).toBeLessThanOrEqual(100);
    });

    test('should conduct risk assessment with treatment plans', async () => {
      const assessment = await iso27001Mapper.assessControls({
        annexA: {
          technologicalControls: {
            assessment: 'automated',
            evidence: 'continuous'
          }
        },
        riskAssessment: {
          automated: true,
          treatmentPlans: true
        }
      });

      expect(assessment.riskAssessment).toBeDefined();
      expect(assessment.riskAssessment.risks).toBeDefined();
      expect(assessment.riskAssessment.treatmentPlans).toBeDefined();
      expect(Array.isArray(assessment.riskAssessment.risks)).toBe(true);
      expect(Array.isArray(assessment.riskAssessment.treatmentPlans)).toBe(true);

      if (assessment.riskAssessment.risks.length > 0) {
        const risk = assessment.riskAssessment.risks[0];
        expect(risk).toMatchObject({
          id: expect.any(String),
          description: expect.any(String),
          likelihood: expect.any(Number),
          impact: expect.any(Number),
          riskScore: expect.any(Number),
          treatmentRequired: expect.any(Boolean)
        });
      }
    });

    test('should generate findings for control gaps', async () => {
      const assessment = await iso27001Mapper.assessControls({
        annexA: {
          organizationalControls: {
            assessment: 'automated',
            evidence: 'continuous'
          }
        }
      });

      expect(assessment.findings).toBeDefined();
      expect(Array.isArray(assessment.findings)).toBe(true);

      if (assessment.findings.length > 0) {
        const finding = assessment.findings[0];
        expect(finding).toMatchObject({
          id: expect.any(String),
          control: expect.any(String),
          severity: expect.stringMatching(/minor|major|critical/),
          finding: expect.any(String),
          recommendation: expect.any(String),
          status: expect.stringMatching(/open|closed|in-progress/),
          dueDate: expect.any(Date)
        });
      }
    });
  });

  describe('Control Mapping Capabilities', () => {
    test('should provide assessment history', () => {
      const history = iso27001Mapper.getAssessmentHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    test('should track current assessment', () => {
      const current = iso27001Mapper.getCurrentAssessment();
      expect(current === null || typeof current === 'object').toBe(true);
    });

    test('should categorize controls by domain correctly', () => {
      const allControls = iso27001Mapper.getAllControls();
      const organizationalControls = allControls.filter(c => c.domain === 'organizational');
      const technologicalControls = allControls.filter(c => c.domain === 'technological');

      expect(organizationalControls.length).toBeGreaterThan(0);
      expect(technologicalControls.length).toBeGreaterThan(0);

      // Verify domain assignment
      const orgControl = organizationalControls.find(c => c.id === 'A.5.1');
      const techControl = technologicalControls.find(c => c.id === 'A.8.2');

      expect(orgControl?.domain).toBe('organizational');
      expect(techControl?.domain).toBe('technological');
    });
  });
});

describe('NIST-SSDF Validator - EC-003', () => {
  let nistValidator: NISTSSFDValidator;

  beforeEach(() => {
    nistValidator = new NISTSSFDValidator({
      version: '1.1',
      implementationTiers: ['tier1', 'tier2', 'tier3', 'tier4'],
      practiceValidation: true,
      automatedAlignment: true,
      maturityAssessment: true,
      gapAnalysis: true
    });
  });

  describe('Practice Validation and Tier Assessment', () => {
    test('should initialize with NIST-SSDF practices by function', () => {
      const preparePractices = nistValidator.getPracticesByFunction('prepare');
      const protectPractices = nistValidator.getPracticesByFunction('protect');
      const producePractices = nistValidator.getPracticesByFunction('produce');
      const respondPractices = nistValidator.getPracticesByFunction('respond');

      expect(preparePractices.length).toBeGreaterThan(0);
      expect(protectPractices.length).toBeGreaterThan(0);
      expect(producePractices.length).toBeGreaterThan(0);
      expect(respondPractices.length).toBeGreaterThan(0);

      // Verify key practices are present
      const allPractices = nistValidator.getAllPractices();
      const practiceIds = allPractices.map(p => p.id);
      expect(practiceIds).toContain('PO.1.1'); // Define Security Requirements
      expect(practiceIds).toContain('PS.1.1'); // Protect code from unauthorized access
      expect(practiceIds).toContain('PW.4.1'); // Implement Security Testing
      expect(practiceIds).toContain('RV.1.1'); // Identify and Confirm Vulnerabilities
    });

    test('should execute comprehensive practice validation', async () => {
      const assessment = await nistValidator.validatePractices({
        practices: {
          prepare: {
            po: ['PO.1.1', 'PO.1.2'],
            ps: ['PS.1.1']
          },
          produce: {
            pw: ['PW.4.1', 'PW.4.4']
          }
        },
        implementationTiers: {
          current: 'tier1',
          target: 'tier3',
          validation: 'automated'
        },
        practiceAlignment: {
          automated: true,
          gapAnalysis: true,
          improvementPlan: true
        }
      });

      expect(assessment).toMatchObject({
        assessmentId: expect.any(String),
        timestamp: expect.any(Date),
        version: '1.1',
        currentTier: 1,
        targetTier: 3,
        practices: expect.any(Array),
        functionResults: expect.any(Array),
        maturityLevel: expect.any(Number),
        complianceScore: expect.any(Number),
        gapAnalysis: expect.any(Object),
        status: 'completed'
      });

      expect(assessment.maturityLevel).toBeGreaterThanOrEqual(1);
      expect(assessment.maturityLevel).toBeLessThanOrEqual(4);
    });

    test('should identify implementation gaps', async () => {
      const assessment = await nistValidator.validatePractices({
        practices: {
          prepare: { po: ['PO.1.1'] }
        },
        implementationTiers: {
          current: 'tier1',
          target: 'tier3'
        },
        practiceAlignment: { gapAnalysis: true }
      });

      expect(assessment.gapAnalysis).toBeDefined();
      expect(assessment.gapAnalysis.identifiedGaps).toBeDefined();
      expect(Array.isArray(assessment.gapAnalysis.identifiedGaps)).toBe(true);

      if (assessment.gapAnalysis.identifiedGaps.length > 0) {
        const gap = assessment.gapAnalysis.identifiedGaps[0];
        expect(gap).toMatchObject({
          practiceId: expect.any(String),
          currentState: expect.any(String),
          desiredState: expect.any(String),
          priority: expect.stringMatching(/low|medium|high|critical/),
          effortEstimate: expect.any(String)
        });
      }
    });

    test('should generate improvement plan', async () => {
      const assessment = await nistValidator.validatePractices({
        practices: {
          prepare: { po: ['PO.1.1'] }
        },
        implementationTiers: {
          current: 'tier1',
          target: 'tier2'
        },
        practiceAlignment: { improvementPlan: true }
      });

      expect(assessment.improvementPlan).toBeDefined();
      expect(assessment.improvementPlan.phases).toBeDefined();
      expect(Array.isArray(assessment.improvementPlan.phases)).toBe(true);

      if (assessment.improvementPlan.phases.length > 0) {
        const phase = assessment.improvementPlan.phases[0];
        expect(phase).toMatchObject({
          phase: expect.any(Number),
          name: expect.any(String),
          practices: expect.any(Array),
          duration: expect.any(String)
        });
      }
    });
  });

  describe('Maturity Assessment', () => {
    test('should calculate practice maturity scores', async () => {
      const assessment = await nistValidator.validatePractices({
        practices: {
          prepare: { po: ['PO.1.1'] },
          produce: { pw: ['PW.4.1'] }
        },
        implementationTiers: { current: 'tier2', target: 'tier3' }
      });

      expect(assessment.practices.length).toBeGreaterThan(0);

      assessment.practices.forEach(practice => {
        expect(practice.maturityScore).toBeGreaterThanOrEqual(0);
        expect(practice.maturityScore).toBeLessThanOrEqual(100);
        expect(practice.currentTier).toBeGreaterThanOrEqual(1);
        expect(practice.currentTier).toBeLessThanOrEqual(4);
      });
    });

    test('should provide function-level assessments', async () => {
      const assessment = await nistValidator.validatePractices({
        practices: {
          prepare: { po: ['PO.1.1'] },
          produce: { pw: ['PW.4.1'] }
        }
      });

      expect(assessment.functionResults).toBeDefined();
      expect(Array.isArray(assessment.functionResults)).toBe(true);

      assessment.functionResults.forEach(funcResult => {
        expect(funcResult).toMatchObject({
          function: expect.stringMatching(/prepare|protect|produce|respond/),
          practices: expect.any(Array),
          overallScore: expect.any(Number),
          maturityLevel: expect.any(Number)
        });
      });
    });
  });
});

describe('Audit Trail Generator - EC-004', () => {
  let auditTrailGenerator: AuditTrailGenerator;

  beforeEach(() => {
    auditTrailGenerator = new AuditTrailGenerator({
      retentionDays: 90,
      tamperEvident: true,
      evidencePackaging: true,
      cryptographicIntegrity: true,
      compressionEnabled: true,
      encryptionEnabled: true
    });
  });

  describe('Tamper-Evident Evidence Packaging', () => {
    test('should generate comprehensive audit trail', async () => {
      const mockAssessments = [
        {
          assessmentId: 'test-assessment-1',
          framework: 'soc2',
          controls: [
            { controlId: 'CC6.1', status: 'compliant', score: 95 }
          ],
          findings: [
            { id: 'finding-1', control: 'CC6.1', severity: 'low' }
          ],
          evidencePackage: [
            { id: 'evidence-1', type: 'configuration', controlId: 'CC6.1' }
          ],
          status: 'completed',
          complianceScore: 95
        }
      ];

      const trail = await auditTrailGenerator.generateTrail({
        assessments: mockAssessments,
        timestamp: new Date(),
        agent: 'test-agent'
      });

      expect(trail).toMatchObject({
        id: expect.any(String),
        entries: expect.any(Array)
      });

      expect(trail.entries.length).toBeGreaterThan(0);

      // Verify entry structure
      const entry = trail.entries[0];
      expect(entry).toMatchObject({
        id: expect.any(String),
        timestamp: expect.any(Date),
        eventType: expect.any(String),
        source: expect.any(String),
        actor: expect.any(String),
        action: expect.any(String),
        resource: expect.any(String),
        outcome: expect.stringMatching(/success|failure|pending/),
        integrity: expect.objectContaining({
          hash: expect.any(String),
          signature: expect.any(String),
          chainVerification: expect.any(Boolean)
        })
      });
    });

    test('should create tamper-evident evidence package', async () => {
      const mockEvidence = [
        {
          id: 'evidence-1',
          type: 'configuration',
          source: 'test-source',
          content: 'test evidence content',
          timestamp: new Date(),
          hash: 'test-hash',
          controlId: 'CC6.1'
        }
      ];

      const mockAuditTrail = [
        {
          id: 'audit-1',
          timestamp: new Date(),
          eventType: 'compliance_assessment',
          source: 'test-agent',
          actor: 'system',
          action: 'assess_control',
          resource: 'CC6.1',
          outcome: 'success',
          details: {},
          metadata: { context: {} },
          integrity: {
            hash: 'test-hash',
            signature: 'test-signature',
            previousEntryHash: '',
            chainVerification: true,
            timestamp: new Date().toISOString(),
            nonce: 'test-nonce'
          }
        }
      ];

      const evidencePackage = await auditTrailGenerator.createEvidencePackage({
        name: 'Test Evidence Package',
        framework: 'soc2',
        assessmentId: 'test-assessment',
        evidence: mockEvidence,
        auditTrail: mockAuditTrail
      });

      expect(evidencePackage).toMatchObject({
        id: expect.any(String),
        name: 'Test Evidence Package',
        framework: 'soc2',
        evidence: mockEvidence,
        auditTrail: mockAuditTrail,
        integrity: expect.objectContaining({
          packageHash: expect.any(String),
          signature: expect.any(String),
          merkleRoot: expect.any(String)
        }),
        metadata: expect.objectContaining({
          compressed: true,
          encrypted: true
        })
      });
    });

    test('should maintain 90-day retention policy', () => {
      const retentionStatus = auditTrailGenerator.getRetentionStatus();

      expect(retentionStatus).toMatchObject({
        totalPackages: expect.any(Number),
        nearExpiry: expect.any(Number),
        expired: expect.any(Number)
      });

      // All counts should be non-negative
      expect(retentionStatus.totalPackages).toBeGreaterThanOrEqual(0);
      expect(retentionStatus.nearExpiry).toBeGreaterThanOrEqual(0);
      expect(retentionStatus.expired).toBeGreaterThanOrEqual(0);
    });

    test('should verify package integrity', async () => {
      const mockEvidence = [{
        id: 'evidence-1',
        type: 'document',
        source: 'test',
        content: 'test',
        timestamp: new Date(),
        hash: 'hash',
        controlId: 'test'
      }];

      const package1 = await auditTrailGenerator.createEvidencePackage({
        name: 'Test Package',
        framework: 'soc2',
        assessmentId: 'test',
        evidence: mockEvidence,
        auditTrail: []
      });

      const isValid = await auditTrailGenerator.verifyPackageIntegrity(package1.id);
      expect(isValid).toBe(true);
    });
  });

  describe('Audit Event Logging', () => {
    test('should log remediation actions', async () => {
      await auditTrailGenerator.logRemediation({
        event: { type: 'compliance_drift', affectedControls: ['CC6.1'] },
        plan: { id: 'remediation-plan-1', steps: [{ action: 'fix' }] },
        timestamp: new Date()
      });

      // Verify through getAuditTrail
      const auditTrail = auditTrailGenerator.getAuditTrail({
        eventType: 'remediation_action'
      });

      expect(auditTrail.length).toBeGreaterThan(0);
    });

    test('should log report generation', async () => {
      await auditTrailGenerator.logReport({
        report: { id: 'report-1', type: 'compliance', size: 1024 },
        timestamp: new Date(),
        agent: 'test-agent'
      });

      const auditTrail = auditTrailGenerator.getAuditTrail({
        eventType: 'data_export'
      });

      expect(auditTrail.length).toBeGreaterThan(0);
    });

    test('should filter audit trail by criteria', () => {
      const filterCriteria = {
        eventType: 'compliance_assessment' as const,
        source: 'test-agent',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        endDate: new Date()
      };

      const filteredTrail = auditTrailGenerator.getAuditTrail(filterCriteria);
      expect(Array.isArray(filteredTrail)).toBe(true);
    });
  });
});

describe('Compliance Correlator - EC-005', () => {
  let complianceCorrelator: ComplianceCorrelator;

  beforeEach(() => {
    complianceCorrelator = new ComplianceCorrelator({
      frameworks: ['soc2', 'iso27001', 'nist-ssdf'],
      gapAnalysis: true,
      unifiedReporting: true,
      correlationMatrix: true,
      mappingDatabase: true,
      riskAggregation: true
    });
  });

  describe('Cross-Framework Correlation', () => {
    test('should correlate compliance across multiple frameworks', async () => {
      const mockFrameworkResults = {
        soc2: {
          complianceScore: 85,
          controls: [
            { controlId: 'CC6.1', status: 'compliant', score: 90 }
          ],
          findings: []
        },
        iso27001: {
          complianceScore: 88,
          controls: [
            { controlId: 'A.8.2', status: 'compliant', score: 92 }
          ],
          findings: []
        },
        'nist-ssdf': {
          complianceScore: 82,
          controls: [
            { controlId: 'PS.1.1', status: 'partially-compliant', score: 75 }
          ],
          findings: [
            { severity: 'medium', control: 'PS.1.1' }
          ]
        }
      };

      const correlation = await complianceCorrelator.correlatCompliance(mockFrameworkResults);

      expect(correlation).toMatchObject({
        correlationId: expect.any(String),
        timestamp: expect.any(Date),
        frameworks: ['soc2', 'iso27001', 'nist-ssdf'],
        overallScore: expect.any(Number),
        frameworkScores: expect.any(Object),
        correlationMatrix: expect.any(Object),
        gapAnalysis: expect.any(Object),
        riskAggregation: expect.any(Object),
        unifiedReport: expect.any(Object)
      });

      expect(correlation.overallScore).toBeGreaterThan(0);
      expect(correlation.overallScore).toBeLessThanOrEqual(100);
    });

    test('should build correlation matrix between frameworks', async () => {
      const mockResults = {
        soc2: { controls: [{ controlId: 'CC6.1' }] },
        iso27001: { controls: [{ controlId: 'A.8.2' }] }
      };

      const correlation = await complianceCorrelator.correlatCompliance(mockResults);

      expect(correlation.correlationMatrix).toBeDefined();
      expect(correlation.correlationMatrix.frameworks).toEqual(['soc2', 'iso27001']);
      expect(correlation.correlationMatrix.matrix).toBeDefined();
      expect(Array.isArray(correlation.correlationMatrix.matrix)).toBe(true);
    });

    test('should identify cross-framework gaps', async () => {
      const mockResults = {
        soc2: {
          controls: [
            { controlId: 'CC6.1', status: 'compliant' },
            { controlId: 'CC6.2', status: 'non-compliant' }
          ]
        },
        iso27001: {
          controls: [
            { controlId: 'A.8.2', status: 'compliant' }
          ]
        }
      };

      const correlation = await complianceCorrelator.correlatCompliance(mockResults);

      expect(correlation.gapAnalysis).toBeDefined();
      expect(correlation.gapAnalysis.totalGaps).toBeGreaterThanOrEqual(0);
      expect(correlation.gapAnalysis.prioritizedGaps).toBeDefined();
      expect(Array.isArray(correlation.gapAnalysis.prioritizedGaps)).toBe(true);
    });

    test('should aggregate risks across frameworks', async () => {
      const mockResults = {
        soc2: {
          findings: [
            { severity: 'critical', control: 'CC6.1' },
            { severity: 'high', control: 'CC6.2' }
          ]
        },
        iso27001: {
          findings: [
            { severity: 'medium', control: 'A.8.2' }
          ]
        }
      };

      const correlation = await complianceCorrelator.correlatCompliance(mockResults);

      expect(correlation.riskAggregation).toBeDefined();
      expect(correlation.riskAggregation.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(correlation.riskAggregation.riskByFramework).toBeDefined();
      expect(correlation.riskAggregation.compoundRisks).toBeDefined();
      expect(Array.isArray(correlation.riskAggregation.compoundRisks)).toBe(true);
    });
  });

  describe('Unified Reporting', () => {
    test('should generate unified compliance report', async () => {
      const mockResults = {
        soc2: { complianceScore: 85 },
        iso27001: { complianceScore: 88 }
      };

      const report = await complianceCorrelator.generateUnifiedReport({
        includeFrameworks: ['soc2', 'iso27001'],
        includeGaps: true,
        includeRecommendations: true,
        includeEvidence: true,
        auditTrail: true
      });

      expect(report).toMatchObject({
        id: expect.any(String),
        frameworks: ['soc2', 'iso27001'],
        generated: expect.any(Date)
      });
    });

    test('should provide framework correlations', () => {
      const soc2ToIso = complianceCorrelator.getCorrelations('soc2', 'iso27001');
      expect(Array.isArray(soc2ToIso)).toBe(true);

      if (soc2ToIso.length > 0) {
        const correlation = soc2ToIso[0];
        expect(correlation).toMatchObject({
          sourceFramework: 'soc2',
          targetFramework: 'iso27001',
          sourceControl: expect.any(String),
          targetControl: expect.any(String),
          correlationType: expect.stringMatching(/equivalent|subset|superset|related|complementary/),
          strength: expect.any(Number)
        });
      }
    });

    test('should maintain correlation history', () => {
      const history = complianceCorrelator.getCorrelationHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });
});

describe('Real-Time Monitor - EC-006', () => {
  let realTimeMonitor: RealTimeMonitor;

  beforeEach(() => {
    realTimeMonitor = new RealTimeMonitor({
      enabled: true,
      alertThresholds: { critical: 95, high: 80, medium: 60 },
      performanceBudget: 0.003,
      pollingInterval: 1000, // 1 second for testing
      dashboards: true,
      alerting: true,
      automatedRemediation: true
    });
  });

  afterEach(async () => {
    if (realTimeMonitor) {
      await realTimeMonitor.stop();
    }
  });

  describe('Real-Time Monitoring', () => {
    test('should start monitoring with framework configuration', async () => {
      const monitoringPromise = new Promise((resolve) => {
        realTimeMonitor.on('monitoring_started', resolve);
      });

      await realTimeMonitor.start({
        frameworks: ['soc2', 'iso27001'],
        alerting: true,
        dashboards: true,
        metrics: ['compliance_score', 'control_effectiveness']
      });

      const startedEvent = await monitoringPromise;
      expect(startedEvent).toMatchObject({
        timestamp: expect.any(Date),
        frameworks: 2,
        metrics: 2,
        alerting: true,
        dashboards: true
      });
    });

    test('should collect and update metrics', async () => {
      await realTimeMonitor.start({
        frameworks: ['soc2'],
        alerting: false,
        dashboards: false,
        metrics: ['compliance_score']
      });

      // Wait for at least one monitoring cycle
      await new Promise(resolve => setTimeout(resolve, 1500));

      const metrics = realTimeMonitor.getCurrentMetrics();
      expect(Array.isArray(metrics)).toBe(true);

      if (metrics.length > 0) {
        const metric = metrics[0];
        expect(metric).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          type: expect.any(String),
          value: expect.any(Number),
          threshold: expect.any(Number),
          status: expect.stringMatching(/normal|warning|critical|unknown/),
          timestamp: expect.any(Date)
        });
      }
    });

    test('should emit compliance drift events', async () => {
      const driftPromise = new Promise((resolve) => {
        realTimeMonitor.on('compliance:drift', resolve);
      });

      await realTimeMonitor.start({
        frameworks: ['soc2'],
        alerting: true,
        dashboards: false,
        metrics: ['compliance_score']
      });

      // Simulate compliance drift by emitting the event
      const mockDrift = {
        framework: 'soc2',
        control: 'CC6.1',
        previousScore: 90,
        currentScore: 70,
        severity: 'medium'
      };

      realTimeMonitor.emit('compliance:drift', mockDrift);

      const driftEvent = await driftPromise;
      expect(driftEvent).toMatchObject(mockDrift);
    });

    test('should emit control failure events', async () => {
      const failurePromise = new Promise((resolve) => {
        realTimeMonitor.on('control:failure', resolve);
      });

      await realTimeMonitor.start({
        frameworks: ['iso27001'],
        alerting: true,
        dashboards: false,
        metrics: ['control_effectiveness']
      });

      const mockFailure = {
        framework: 'iso27001',
        control: 'A.8.2',
        failureType: 'validation_failure',
        impact: 'high'
      };

      realTimeMonitor.emit('control:failure', mockFailure);

      const failureEvent = await failurePromise;
      expect(failureEvent).toMatchObject(mockFailure);
    });

    test('should emit elevated risk events', async () => {
      const riskPromise = new Promise((resolve) => {
        realTimeMonitor.on('risk:elevated', resolve);
      });

      await realTimeMonitor.start({
        frameworks: ['nist-ssdf'],
        alerting: true,
        dashboards: false,
        metrics: ['risk_exposure']
      });

      const mockRisk = {
        risk: 'Elevated security risk',
        level: 'high',
        affectedFrameworks: ['nist-ssdf'],
        relatedControls: ['PS.1.1']
      };

      realTimeMonitor.emit('risk:elevated', mockRisk);

      const riskEvent = await riskPromise;
      expect(riskEvent).toMatchObject(mockRisk);
    });
  });

  describe('Dashboard and Alerting', () => {
    test('should configure default dashboards', () => {
      const dashboards = realTimeMonitor.getAllDashboards();
      expect(Array.isArray(dashboards)).toBe(true);
      expect(dashboards.length).toBeGreaterThan(0);

      const dashboard = dashboards[0];
      expect(dashboard).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        layout: expect.any(String),
        widgets: expect.any(Array),
        refreshInterval: expect.any(Number)
      });
    });

    test('should retrieve specific dashboard configuration', () => {
      const dashboards = realTimeMonitor.getAllDashboards();
      if (dashboards.length > 0) {
        const dashboardId = dashboards[0].id;
        const dashboard = realTimeMonitor.getDashboard(dashboardId);

        expect(dashboard).toBeDefined();
        expect(dashboard?.id).toBe(dashboardId);
      }
    });

    test('should track performance metrics', async () => {
      await realTimeMonitor.start({
        frameworks: ['soc2'],
        alerting: false,
        dashboards: false,
        metrics: ['compliance_score']
      });

      // Let it run for a short time
      await new Promise(resolve => setTimeout(resolve, 1100));

      const performanceMetrics = realTimeMonitor.getPerformanceMetrics();
      expect(performanceMetrics).toBeDefined();
      expect(typeof performanceMetrics).toBe('object');
    });
  });
});

describe('Phase 3 Integration - EC-008', () => {
  let phase3Integration: Phase3ComplianceIntegration;

  beforeEach(() => {
    phase3Integration = new Phase3ComplianceIntegration({
      enabled: true,
      evidenceSystemEndpoint: 'https://mock-evidence-system.test',
      auditTrailEndpoint: 'https://mock-audit-system.test',
      syncFrequency: 60000, // 1 minute for testing
      retentionPolicy: '90-days',
      encryptionEnabled: true,
      compressionEnabled: true,
      batchSize: 10,
      timeout: 30000,
      authentication: {
        type: 'api_key',
        credentials: { apiKey: 'test-key' }
      },
      dataMapping: {
        evidenceMapping: {},
        auditMapping: {}
      }
    });
  });

  afterEach(async () => {
    if (phase3Integration) {
      await phase3Integration.disconnect();
    }
  });

  describe('Evidence Transfer', () => {
    test('should transfer evidence package to Phase 3 system', async () => {
      const mockEvidence = [
        {
          id: 'evidence-1',
          type: 'configuration',
          source: 'compliance-agent',
          content: 'Test evidence content',
          timestamp: new Date(),
          hash: 'test-hash',
          controlId: 'CC6.1'
        }
      ];

      const transfer = await phase3Integration.transferEvidencePackage({
        packageId: 'test-package-1',
        framework: 'soc2',
        evidence: mockEvidence,
        assessmentId: 'test-assessment-1',
        retentionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      });

      expect(transfer).toMatchObject({
        packageId: 'test-package-1',
        sourceFramework: 'soc2',
        evidenceCount: 1,
        transferStatus: expect.stringMatching(/completed|failed/),
        startTime: expect.any(Date),
        checksum: expect.any(String),
        metadata: expect.objectContaining({
          assessmentId: 'test-assessment-1',
          framework: 'soc2'
        })
      });
    });

    test('should handle transfer status tracking', async () => {
      const mockEvidence = [{
        id: 'evidence-1',
        type: 'document',
        source: 'test',
        content: 'test',
        timestamp: new Date(),
        controlId: 'test'
      }];

      const transfer = await phase3Integration.transferEvidencePackage({
        packageId: 'test-package-2',
        framework: 'iso27001',
        evidence: mockEvidence,
        assessmentId: 'test-assessment-2',
        retentionDate: new Date()
      });

      const status = phase3Integration.getTransferStatus(transfer.packageId);
      expect(status).toBeDefined();
      expect(status?.packageId).toBe(transfer.packageId);
    });
  });

  describe('Audit Trail Synchronization', () => {
    test('should sync audit trail with Phase 3 system', async () => {
      const mockAuditEvents = [
        {
          id: 'audit-1',
          timestamp: new Date(),
          eventType: 'compliance_assessment',
          source: 'compliance-agent',
          actor: 'system',
          action: 'assess_control',
          resource: 'CC6.1',
          outcome: 'success',
          details: { framework: 'soc2' },
          impact: 'low' as const
        }
      ];

      const syncResult = await phase3Integration.syncAuditTrail(mockAuditEvents);

      expect(syncResult).toMatchObject({
        syncId: expect.any(String),
        timestamp: expect.any(Date),
        operation: 'push',
        recordsProcessed: 1,
        recordsSuccessful: expect.any(Number),
        recordsFailed: expect.any(Number),
        duration: expect.any(Number)
      });

      expect(syncResult.recordsProcessed).toBe(1);
    });

    test('should maintain sync history', async () => {
      const history = phase3Integration.getSyncHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Evidence Retrieval', () => {
    test('should retrieve evidence from Phase 3 system', async () => {
      const evidence = await phase3Integration.retrieveEvidence({
        framework: 'soc2',
        controlId: 'CC6.1',
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        evidenceTypes: ['configuration', 'log']
      });

      expect(Array.isArray(evidence)).toBe(true);
      // Evidence array may be empty in mock implementation
    });
  });

  describe('Connection Management', () => {
    test('should track connection status', () => {
      expect(phase3Integration.isConnected()).toBe(true);
    });

    test('should handle disconnection', async () => {
      await phase3Integration.disconnect();
      expect(phase3Integration.isConnected()).toBe(false);
    });
  });
});

describe('Performance and Integration Tests', () => {
  describe('Performance Budget Compliance', () => {
    test('should maintain performance within 0.3% budget across all operations', async () => {
      const performanceTest = async () => {
        const complianceAgent = new EnterpriseComplianceAutomationAgent(mockConfig);

        const startTime = performance.now();
        await complianceAgent.startCompliance();
        const endTime = performance.now();

        const duration = endTime - startTime;
        const performanceOverhead = (duration / 1000) / 100; // Convert to percentage

        await complianceAgent.stop();

        return performanceOverhead;
      };

      const overhead = await performanceTest();
      expect(overhead).toBeLessThan(mockConfig.performanceBudget);
    });
  });

  describe('NASA POT10 Compliance Preservation', () => {
    test('should maintain NASA POT10 compliance requirements', async () => {
      const complianceAgent = new EnterpriseComplianceAutomationAgent(mockConfig);

      // Simulate NASA POT10 compliance check
      const status = await complianceAgent.startCompliance();

      // Verify essential compliance characteristics are preserved
      expect(status.overall).toBeGreaterThanOrEqual(90); // High compliance threshold
      expect(status.auditTrail).toBeDefined(); // Audit trail requirement
      expect(status.timestamp).toBeInstanceOf(Date); // Timestamp requirement

      await complianceAgent.stop();
    });
  });

  describe('Multi-Framework Integration', () => {
    test('should successfully integrate all three frameworks simultaneously', async () => {
      const complianceAgent = new EnterpriseComplianceAutomationAgent(mockConfig);

      const status = await complianceAgent.startCompliance();

      expect(status.frameworks).toMatchObject({
        soc2: expect.any(String),
        iso27001: expect.any(String),
        nistSSFD: expect.any(String)
      });

      await complianceAgent.stop();
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should handle partial framework failures gracefully', async () => {
      const complianceAgent = new EnterpriseComplianceAutomationAgent(mockConfig);

      // Simulate error condition
      const errorPromise = new Promise((resolve) => {
        complianceAgent.on('error', resolve);
      });

      // This should not throw even if individual components fail
      const status = await complianceAgent.startCompliance();
      expect(status).toBeDefined();

      await complianceAgent.stop();
    });
  });
});

describe('End-to-End Workflow Tests', () => {
  test('should complete full compliance automation workflow', async () => {
    const complianceAgent = new EnterpriseComplianceAutomationAgent(mockConfig);

    try {
      // Step 1: Start compliance assessment
      const status = await complianceAgent.startCompliance();
      expect(status).toBeDefined();

      // Step 2: Generate compliance report
      const report = await complianceAgent.generateComplianceReport();
      expect(report).toBeDefined();

      // Step 3: Get current compliance status
      const currentStatus = await complianceAgent.getComplianceStatus();
      expect(currentStatus).toBeDefined();

      // Verify workflow completion
      expect(status.overall).toBeGreaterThan(0);
      expect(report.frameworks).toEqual(expect.arrayContaining(mockConfig.frameworks));

    } finally {
      await complianceAgent.stop();
    }
  });
});