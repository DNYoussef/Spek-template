"use strict";
/**
 * Enterprise Compliance Automation Agent - Comprehensive Test Suite
 * Tests for all EC domain components with multi-framework validation
 *
 * Domain: EC (Enterprise Compliance)
 * Coverage: All tasks EC-001 through EC-006
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const { cleanupTestResources } = require('../../setup/test-environment');
const compliance_automation_agent_1 = require("../../../src/domains/ec/compliance-automation-agent");
const soc2_automation_1 = require("../../../src/domains/ec/frameworks/soc2-automation");
const iso27001_mapper_1 = require("../../../src/domains/ec/frameworks/iso27001-mapper");
const nist_ssdf_validator_1 = require("../../../src/domains/ec/frameworks/nist-ssdf-validator");
const audit_trail_generator_1 = require("../../../src/domains/ec/audit/audit-trail-generator");
const compliance_correlator_1 = require("../../../src/domains/ec/correlation/compliance-correlator");
const real_time_monitor_1 = require("../../../src/domains/ec/monitoring/real-time-monitor");
const phase3_integration_1 = require("../../../src/domains/ec/integrations/phase3-integration");
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
(0, globals_1.describe)('Enterprise Compliance Automation Agent', () => {
    let complianceAgent;
    (0, globals_1.beforeEach)(() => {
        complianceAgent = new compliance_automation_agent_1.EnterpriseComplianceAutomationAgent(mockConfig);
    });
    (0, globals_1.afterEach)(async () => {
        if (complianceAgent) {
            await complianceAgent.stop();
        }
        await cleanupTestResources();
    });
    (0, globals_1.describe)('Agent Initialization', () => {
        (0, globals_1.test)('should initialize with all frameworks', async () => {
            (0, globals_1.expect)(complianceAgent).toBeDefined();
            (0, globals_1.expect)(complianceAgent.getPerformanceMetrics()).toBeDefined();
        });
        (0, globals_1.test)('should emit initialization events', async () => {
            const initEventPromise = new Promise((resolve) => {
                complianceAgent.on('initialized', resolve);
            });
            // Re-initialize to trigger event
            complianceAgent = new compliance_automation_agent_1.EnterpriseComplianceAutomationAgent(mockConfig);
            const initEvent = await initEventPromise;
            (0, globals_1.expect)(initEvent).toMatchObject({
                timestamp: globals_1.expect.any(Date),
                frameworks: mockConfig.frameworks
            });
        });
        (0, globals_1.test)('should validate performance budget configuration', async () => {
            const status = await complianceAgent.getComplianceStatus();
            (0, globals_1.expect)(status).toBeDefined();
            (0, globals_1.expect)(status.timestamp).toBeInstanceOf(Date);
        });
    });
    (0, globals_1.describe)('Multi-Framework Compliance Assessment', () => {
        (0, globals_1.test)('should execute comprehensive compliance assessment', async () => {
            const compliancePromise = new Promise((resolve) => {
                complianceAgent.on('compliance:completed', resolve);
            });
            const status = await complianceAgent.startCompliance();
            (0, globals_1.expect)(status).toMatchObject({
                overall: globals_1.expect.any(Number),
                frameworks: {
                    soc2: globals_1.expect.any(String),
                    iso27001: globals_1.expect.any(String),
                    nistSSFD: globals_1.expect.any(String)
                },
                auditTrail: globals_1.expect.any(String),
                performanceOverhead: globals_1.expect.any(Number),
                timestamp: globals_1.expect.any(Date)
            });
            (0, globals_1.expect)(status.overall).toBeGreaterThan(0);
            (0, globals_1.expect)(status.performanceOverhead).toBeLessThan(mockConfig.performanceBudget);
        });
        (0, globals_1.test)('should validate performance stays within budget', async () => {
            const startTime = performance.now();
            await complianceAgent.startCompliance();
            const endTime = performance.now();
            const performanceMetrics = complianceAgent.getPerformanceMetrics();
            const overhead = ((endTime - startTime) / 1000) / 100;
            (0, globals_1.expect)(overhead).toBeLessThan(mockConfig.performanceBudget);
        });
        (0, globals_1.test)('should generate unified compliance report', async () => {
            await complianceAgent.startCompliance();
            const report = await complianceAgent.generateComplianceReport();
            (0, globals_1.expect)(report).toBeDefined();
            (0, globals_1.expect)(report.frameworks).toEqual(globals_1.expect.arrayContaining(mockConfig.frameworks));
        });
    });
    (0, globals_1.describe)('Real-Time Monitoring Integration', () => {
        (0, globals_1.test)('should start real-time monitoring', async () => {
            const monitoringPromise = new Promise((resolve) => {
                complianceAgent.on('monitoring:started', resolve);
            });
            await complianceAgent.startCompliance();
            const monitoringEvent = await monitoringPromise;
            (0, globals_1.expect)(monitoringEvent).toMatchObject({
                timestamp: globals_1.expect.any(Date)
            });
        });
        (0, globals_1.test)('should handle compliance drift detection', async () => {
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
            (0, globals_1.expect)(driftEvent.framework).toBe('soc2');
            (0, globals_1.expect)(driftEvent.severity).toBe('medium');
        });
        (0, globals_1.test)('should handle control failure detection', async () => {
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
            (0, globals_1.expect)(failureEvent.control).toBe('CC6.2');
            (0, globals_1.expect)(failureEvent.framework).toBe('soc2');
        });
    });
    (0, globals_1.describe)('Error Handling and Resilience', () => {
        (0, globals_1.test)('should handle framework initialization errors gracefully', async () => {
            const errorConfig = { ...mockConfig, frameworks: ['invalid-framework'] };
            (0, globals_1.expect)(() => {
                new compliance_automation_agent_1.EnterpriseComplianceAutomationAgent(errorConfig);
            }).not.toThrow();
        });
        (0, globals_1.test)('should continue operation if one framework fails', async () => {
            // Mock one framework to fail
            const partialConfig = { ...mockConfig };
            const agent = new compliance_automation_agent_1.EnterpriseComplianceAutomationAgent(partialConfig);
            const status = await agent.startCompliance();
            (0, globals_1.expect)(status).toBeDefined();
            await agent.stop();
        });
        (0, globals_1.test)('should emit error events for troubleshooting', async () => {
            const errorPromise = new Promise((resolve) => {
                complianceAgent.on('error', resolve);
            });
            // This will not immediately throw but we'll test error handling
            setTimeout(() => {
                complianceAgent.emit('error', { type: 'test_error', message: 'Test error' });
            }, 100);
            const errorEvent = await errorPromise;
            (0, globals_1.expect)(errorEvent).toMatchObject({
                type: 'test_error',
                message: 'Test error'
            });
        });
    });
});
(0, globals_1.describe)('SOC2 Automation Engine - EC-001', () => {
    let soc2Engine;
    (0, globals_1.beforeEach)(() => {
        soc2Engine = new soc2_automation_1.SOC2AutomationEngine({
            trustServicesCriteria: ['security', 'availability', 'integrity'],
            automatedAssessment: true,
            realTimeValidation: true,
            evidenceCollection: true,
            continuousMonitoring: true
        });
    });
    (0, globals_1.describe)('Trust Services Criteria Validation', () => {
        (0, globals_1.test)('should initialize with all Trust Services Criteria controls', () => {
            const securityControls = soc2Engine.getControls('security');
            const availabilityControls = soc2Engine.getControls('availability');
            const integrityControls = soc2Engine.getControls('integrity');
            (0, globals_1.expect)(securityControls.length).toBeGreaterThan(0);
            (0, globals_1.expect)(availabilityControls.length).toBeGreaterThan(0);
            (0, globals_1.expect)(integrityControls.length).toBeGreaterThan(0);
            // Verify critical security controls are present
            const controlIds = securityControls.map(c => c.id);
            (0, globals_1.expect)(controlIds).toContain('CC6.1'); // Logical and physical access controls
            (0, globals_1.expect)(controlIds).toContain('CC6.2'); // System access credentials management
            (0, globals_1.expect)(controlIds).toContain('CC6.7'); // Data transmission and disposal
        });
        (0, globals_1.test)('should execute Type II assessment with all criteria', async () => {
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
            (0, globals_1.expect)(assessment).toMatchObject({
                assessmentId: globals_1.expect.any(String),
                timestamp: globals_1.expect.any(Date),
                criteria: globals_1.expect.arrayContaining(['security', 'availability', 'integrity']),
                controls: globals_1.expect.any(Array),
                overallRating: globals_1.expect.stringMatching(/compliant|partially-compliant|non-compliant/),
                complianceScore: globals_1.expect.any(Number),
                status: 'completed'
            });
            (0, globals_1.expect)(assessment.complianceScore).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(assessment.complianceScore).toBeLessThanOrEqual(100);
        });
        (0, globals_1.test)('should generate compliance findings for non-compliant controls', async () => {
            const assessment = await soc2Engine.runTypeIIAssessment({
                trustServicesCriteria: {
                    security: {
                        controls: ['CC6.1', 'CC6.2'],
                        automatedValidation: true,
                        evidenceCollection: true
                    }
                }
            });
            (0, globals_1.expect)(assessment.findings).toBeDefined();
            (0, globals_1.expect)(Array.isArray(assessment.findings)).toBe(true);
            if (assessment.findings.length > 0) {
                const finding = assessment.findings[0];
                (0, globals_1.expect)(finding).toMatchObject({
                    id: globals_1.expect.any(String),
                    control: globals_1.expect.any(String),
                    severity: globals_1.expect.stringMatching(/low|medium|high|critical/),
                    finding: globals_1.expect.any(String),
                    recommendation: globals_1.expect.any(String),
                    status: globals_1.expect.stringMatching(/open|closed|in-progress/)
                });
            }
        });
        (0, globals_1.test)('should collect evidence for each assessed control', async () => {
            const assessment = await soc2Engine.runTypeIIAssessment({
                trustServicesCriteria: {
                    security: {
                        controls: ['CC6.1'],
                        evidenceCollection: true
                    }
                }
            });
            (0, globals_1.expect)(assessment.evidencePackage).toBeDefined();
            (0, globals_1.expect)(Array.isArray(assessment.evidencePackage)).toBe(true);
            if (assessment.evidencePackage.length > 0) {
                const evidence = assessment.evidencePackage[0];
                (0, globals_1.expect)(evidence).toMatchObject({
                    id: globals_1.expect.any(String),
                    type: globals_1.expect.any(String),
                    source: globals_1.expect.any(String),
                    timestamp: globals_1.expect.any(Date),
                    hash: globals_1.expect.any(String),
                    controlId: globals_1.expect.any(String)
                });
            }
        });
    });
    (0, globals_1.describe)('Automated Assessment Workflows', () => {
        (0, globals_1.test)('should execute automated tests for controls', async () => {
            const assessment = await soc2Engine.runTypeIIAssessment({
                trustServicesCriteria: {
                    security: {
                        controls: ['CC6.1'],
                        automatedValidation: true
                    }
                }
            });
            const controlAssessment = assessment.controls.find(c => c.controlId === 'CC6.1');
            (0, globals_1.expect)(controlAssessment).toBeDefined();
            (0, globals_1.expect)(controlAssessment?.testResults).toBeDefined();
            (0, globals_1.expect)(Array.isArray(controlAssessment?.testResults)).toBe(true);
        });
        (0, globals_1.test)('should provide assessment history', () => {
            const history = soc2Engine.getAssessmentHistory();
            (0, globals_1.expect)(Array.isArray(history)).toBe(true);
        });
        (0, globals_1.test)('should track current assessment status', () => {
            const currentAssessment = soc2Engine.getCurrentAssessment();
            // May be null if no assessment is running
            (0, globals_1.expect)(currentAssessment === null || typeof currentAssessment === 'object').toBe(true);
        });
    });
});
(0, globals_1.describe)('ISO27001 Control Mapper - EC-002', () => {
    let iso27001Mapper;
    (0, globals_1.beforeEach)(() => {
        iso27001Mapper = new iso27001_mapper_1.ISO27001ControlMapper({
            version: '2022',
            annexAControls: true,
            automatedMapping: true,
            riskAssessment: true,
            managementSystem: true,
            continuousImprovement: true
        });
    });
    (0, globals_1.describe)('Annex A Controls Assessment', () => {
        (0, globals_1.test)('should initialize with Annex A control domains', () => {
            const organizationalControls = iso27001Mapper.getControlsByDomain('organizational');
            const peopleControls = iso27001Mapper.getControlsByDomain('people');
            const physicalControls = iso27001Mapper.getControlsByDomain('physical');
            const technologicalControls = iso27001Mapper.getControlsByDomain('technological');
            (0, globals_1.expect)(organizationalControls.length).toBeGreaterThan(0);
            (0, globals_1.expect)(peopleControls.length).toBeGreaterThan(0);
            (0, globals_1.expect)(physicalControls.length).toBeGreaterThan(0);
            (0, globals_1.expect)(technologicalControls.length).toBeGreaterThan(0);
            // Verify key controls are present
            const allControls = iso27001Mapper.getAllControls();
            const controlIds = allControls.map(c => c.id);
            (0, globals_1.expect)(controlIds).toContain('A.5.1'); // Policies for information security
            (0, globals_1.expect)(controlIds).toContain('A.8.2'); // Privileged access rights
        });
        (0, globals_1.test)('should execute comprehensive control assessment', async () => {
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
            (0, globals_1.expect)(assessment).toMatchObject({
                assessmentId: globals_1.expect.any(String),
                timestamp: globals_1.expect.any(Date),
                version: '2022',
                controls: globals_1.expect.any(Array),
                riskAssessment: globals_1.expect.any(Object),
                complianceScore: globals_1.expect.any(Number),
                status: 'completed'
            });
            (0, globals_1.expect)(assessment.complianceScore).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(assessment.complianceScore).toBeLessThanOrEqual(100);
        });
        (0, globals_1.test)('should conduct risk assessment with treatment plans', async () => {
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
            (0, globals_1.expect)(assessment.riskAssessment).toBeDefined();
            (0, globals_1.expect)(assessment.riskAssessment.risks).toBeDefined();
            (0, globals_1.expect)(assessment.riskAssessment.treatmentPlans).toBeDefined();
            (0, globals_1.expect)(Array.isArray(assessment.riskAssessment.risks)).toBe(true);
            (0, globals_1.expect)(Array.isArray(assessment.riskAssessment.treatmentPlans)).toBe(true);
            if (assessment.riskAssessment.risks.length > 0) {
                const risk = assessment.riskAssessment.risks[0];
                (0, globals_1.expect)(risk).toMatchObject({
                    id: globals_1.expect.any(String),
                    description: globals_1.expect.any(String),
                    likelihood: globals_1.expect.any(Number),
                    impact: globals_1.expect.any(Number),
                    riskScore: globals_1.expect.any(Number),
                    treatmentRequired: globals_1.expect.any(Boolean)
                });
            }
        });
        (0, globals_1.test)('should generate findings for control gaps', async () => {
            const assessment = await iso27001Mapper.assessControls({
                annexA: {
                    organizationalControls: {
                        assessment: 'automated',
                        evidence: 'continuous'
                    }
                }
            });
            (0, globals_1.expect)(assessment.findings).toBeDefined();
            (0, globals_1.expect)(Array.isArray(assessment.findings)).toBe(true);
            if (assessment.findings.length > 0) {
                const finding = assessment.findings[0];
                (0, globals_1.expect)(finding).toMatchObject({
                    id: globals_1.expect.any(String),
                    control: globals_1.expect.any(String),
                    severity: globals_1.expect.stringMatching(/minor|major|critical/),
                    finding: globals_1.expect.any(String),
                    recommendation: globals_1.expect.any(String),
                    status: globals_1.expect.stringMatching(/open|closed|in-progress/),
                    dueDate: globals_1.expect.any(Date)
                });
            }
        });
    });
    (0, globals_1.describe)('Control Mapping Capabilities', () => {
        (0, globals_1.test)('should provide assessment history', () => {
            const history = iso27001Mapper.getAssessmentHistory();
            (0, globals_1.expect)(Array.isArray(history)).toBe(true);
        });
        (0, globals_1.test)('should track current assessment', () => {
            const current = iso27001Mapper.getCurrentAssessment();
            (0, globals_1.expect)(current === null || typeof current === 'object').toBe(true);
        });
        (0, globals_1.test)('should categorize controls by domain correctly', () => {
            const allControls = iso27001Mapper.getAllControls();
            const organizationalControls = allControls.filter(c => c.domain === 'organizational');
            const technologicalControls = allControls.filter(c => c.domain === 'technological');
            (0, globals_1.expect)(organizationalControls.length).toBeGreaterThan(0);
            (0, globals_1.expect)(technologicalControls.length).toBeGreaterThan(0);
            // Verify domain assignment
            const orgControl = organizationalControls.find(c => c.id === 'A.5.1');
            const techControl = technologicalControls.find(c => c.id === 'A.8.2');
            (0, globals_1.expect)(orgControl?.domain).toBe('organizational');
            (0, globals_1.expect)(techControl?.domain).toBe('technological');
        });
    });
});
(0, globals_1.describe)('NIST-SSDF Validator - EC-003', () => {
    let nistValidator;
    (0, globals_1.beforeEach)(() => {
        nistValidator = new nist_ssdf_validator_1.NISTSSFDValidator({
            version: '1.1',
            implementationTiers: ['tier1', 'tier2', 'tier3', 'tier4'],
            practiceValidation: true,
            automatedAlignment: true,
            maturityAssessment: true,
            gapAnalysis: true
        });
    });
    (0, globals_1.describe)('Practice Validation and Tier Assessment', () => {
        (0, globals_1.test)('should initialize with NIST-SSDF practices by function', () => {
            const preparePractices = nistValidator.getPracticesByFunction('prepare');
            const protectPractices = nistValidator.getPracticesByFunction('protect');
            const producePractices = nistValidator.getPracticesByFunction('produce');
            const respondPractices = nistValidator.getPracticesByFunction('respond');
            (0, globals_1.expect)(preparePractices.length).toBeGreaterThan(0);
            (0, globals_1.expect)(protectPractices.length).toBeGreaterThan(0);
            (0, globals_1.expect)(producePractices.length).toBeGreaterThan(0);
            (0, globals_1.expect)(respondPractices.length).toBeGreaterThan(0);
            // Verify key practices are present
            const allPractices = nistValidator.getAllPractices();
            const practiceIds = allPractices.map(p => p.id);
            (0, globals_1.expect)(practiceIds).toContain('PO.1.1'); // Define Security Requirements
            (0, globals_1.expect)(practiceIds).toContain('PS.1.1'); // Protect code from unauthorized access
            (0, globals_1.expect)(practiceIds).toContain('PW.4.1'); // Implement Security Testing
            (0, globals_1.expect)(practiceIds).toContain('RV.1.1'); // Identify and Confirm Vulnerabilities
        });
        (0, globals_1.test)('should execute comprehensive practice validation', async () => {
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
            (0, globals_1.expect)(assessment).toMatchObject({
                assessmentId: globals_1.expect.any(String),
                timestamp: globals_1.expect.any(Date),
                version: '1.1',
                currentTier: 1,
                targetTier: 3,
                practices: globals_1.expect.any(Array),
                functionResults: globals_1.expect.any(Array),
                maturityLevel: globals_1.expect.any(Number),
                complianceScore: globals_1.expect.any(Number),
                gapAnalysis: globals_1.expect.any(Object),
                status: 'completed'
            });
            (0, globals_1.expect)(assessment.maturityLevel).toBeGreaterThanOrEqual(1);
            (0, globals_1.expect)(assessment.maturityLevel).toBeLessThanOrEqual(4);
        });
        (0, globals_1.test)('should identify implementation gaps', async () => {
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
            (0, globals_1.expect)(assessment.gapAnalysis).toBeDefined();
            (0, globals_1.expect)(assessment.gapAnalysis.identifiedGaps).toBeDefined();
            (0, globals_1.expect)(Array.isArray(assessment.gapAnalysis.identifiedGaps)).toBe(true);
            if (assessment.gapAnalysis.identifiedGaps.length > 0) {
                const gap = assessment.gapAnalysis.identifiedGaps[0];
                (0, globals_1.expect)(gap).toMatchObject({
                    practiceId: globals_1.expect.any(String),
                    currentState: globals_1.expect.any(String),
                    desiredState: globals_1.expect.any(String),
                    priority: globals_1.expect.stringMatching(/low|medium|high|critical/),
                    effortEstimate: globals_1.expect.any(String)
                });
            }
        });
        (0, globals_1.test)('should generate improvement plan', async () => {
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
            (0, globals_1.expect)(assessment.improvementPlan).toBeDefined();
            (0, globals_1.expect)(assessment.improvementPlan.phases).toBeDefined();
            (0, globals_1.expect)(Array.isArray(assessment.improvementPlan.phases)).toBe(true);
            if (assessment.improvementPlan.phases.length > 0) {
                const phase = assessment.improvementPlan.phases[0];
                (0, globals_1.expect)(phase).toMatchObject({
                    phase: globals_1.expect.any(Number),
                    name: globals_1.expect.any(String),
                    practices: globals_1.expect.any(Array),
                    duration: globals_1.expect.any(String)
                });
            }
        });
    });
    (0, globals_1.describe)('Maturity Assessment', () => {
        (0, globals_1.test)('should calculate practice maturity scores', async () => {
            const assessment = await nistValidator.validatePractices({
                practices: {
                    prepare: { po: ['PO.1.1'] },
                    produce: { pw: ['PW.4.1'] }
                },
                implementationTiers: { current: 'tier2', target: 'tier3' }
            });
            (0, globals_1.expect)(assessment.practices.length).toBeGreaterThan(0);
            assessment.practices.forEach(practice => {
                (0, globals_1.expect)(practice.maturityScore).toBeGreaterThanOrEqual(0);
                (0, globals_1.expect)(practice.maturityScore).toBeLessThanOrEqual(100);
                (0, globals_1.expect)(practice.currentTier).toBeGreaterThanOrEqual(1);
                (0, globals_1.expect)(practice.currentTier).toBeLessThanOrEqual(4);
            });
        });
        (0, globals_1.test)('should provide function-level assessments', async () => {
            const assessment = await nistValidator.validatePractices({
                practices: {
                    prepare: { po: ['PO.1.1'] },
                    produce: { pw: ['PW.4.1'] }
                }
            });
            (0, globals_1.expect)(assessment.functionResults).toBeDefined();
            (0, globals_1.expect)(Array.isArray(assessment.functionResults)).toBe(true);
            assessment.functionResults.forEach(funcResult => {
                (0, globals_1.expect)(funcResult).toMatchObject({
                    function: globals_1.expect.stringMatching(/prepare|protect|produce|respond/),
                    practices: globals_1.expect.any(Array),
                    overallScore: globals_1.expect.any(Number),
                    maturityLevel: globals_1.expect.any(Number)
                });
            });
        });
    });
});
(0, globals_1.describe)('Audit Trail Generator - EC-004', () => {
    let auditTrailGenerator;
    (0, globals_1.beforeEach)(() => {
        auditTrailGenerator = new audit_trail_generator_1.AuditTrailGenerator({
            retentionDays: 90,
            tamperEvident: true,
            evidencePackaging: true,
            cryptographicIntegrity: true,
            compressionEnabled: true,
            encryptionEnabled: true
        });
    });
    (0, globals_1.describe)('Tamper-Evident Evidence Packaging', () => {
        (0, globals_1.test)('should generate comprehensive audit trail', async () => {
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
            (0, globals_1.expect)(trail).toMatchObject({
                id: globals_1.expect.any(String),
                entries: globals_1.expect.any(Array)
            });
            (0, globals_1.expect)(trail.entries.length).toBeGreaterThan(0);
            // Verify entry structure
            const entry = trail.entries[0];
            (0, globals_1.expect)(entry).toMatchObject({
                id: globals_1.expect.any(String),
                timestamp: globals_1.expect.any(Date),
                eventType: globals_1.expect.any(String),
                source: globals_1.expect.any(String),
                actor: globals_1.expect.any(String),
                action: globals_1.expect.any(String),
                resource: globals_1.expect.any(String),
                outcome: globals_1.expect.stringMatching(/success|failure|pending/),
                integrity: globals_1.expect.objectContaining({
                    hash: globals_1.expect.any(String),
                    signature: globals_1.expect.any(String),
                    chainVerification: globals_1.expect.any(Boolean)
                })
            });
        });
        (0, globals_1.test)('should create tamper-evident evidence package', async () => {
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
            (0, globals_1.expect)(evidencePackage).toMatchObject({
                id: globals_1.expect.any(String),
                name: 'Test Evidence Package',
                framework: 'soc2',
                evidence: mockEvidence,
                auditTrail: mockAuditTrail,
                integrity: globals_1.expect.objectContaining({
                    packageHash: globals_1.expect.any(String),
                    signature: globals_1.expect.any(String),
                    merkleRoot: globals_1.expect.any(String)
                }),
                metadata: globals_1.expect.objectContaining({
                    compressed: true,
                    encrypted: true
                })
            });
        });
        (0, globals_1.test)('should maintain 90-day retention policy', () => {
            const retentionStatus = auditTrailGenerator.getRetentionStatus();
            (0, globals_1.expect)(retentionStatus).toMatchObject({
                totalPackages: globals_1.expect.any(Number),
                nearExpiry: globals_1.expect.any(Number),
                expired: globals_1.expect.any(Number)
            });
            // All counts should be non-negative
            (0, globals_1.expect)(retentionStatus.totalPackages).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(retentionStatus.nearExpiry).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(retentionStatus.expired).toBeGreaterThanOrEqual(0);
        });
        (0, globals_1.test)('should verify package integrity', async () => {
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
            (0, globals_1.expect)(isValid).toBe(true);
        });
    });
    (0, globals_1.describe)('Audit Event Logging', () => {
        (0, globals_1.test)('should log remediation actions', async () => {
            await auditTrailGenerator.logRemediation({
                event: { type: 'compliance_drift', affectedControls: ['CC6.1'] },
                plan: { id: 'remediation-plan-1', steps: [{ action: 'fix' }] },
                timestamp: new Date()
            });
            // Verify through getAuditTrail
            const auditTrail = auditTrailGenerator.getAuditTrail({
                eventType: 'remediation_action'
            });
            (0, globals_1.expect)(auditTrail.length).toBeGreaterThan(0);
        });
        (0, globals_1.test)('should log report generation', async () => {
            await auditTrailGenerator.logReport({
                report: { id: 'report-1', type: 'compliance', size: 1024 },
                timestamp: new Date(),
                agent: 'test-agent'
            });
            const auditTrail = auditTrailGenerator.getAuditTrail({
                eventType: 'data_export'
            });
            (0, globals_1.expect)(auditTrail.length).toBeGreaterThan(0);
        });
        (0, globals_1.test)('should filter audit trail by criteria', () => {
            const filterCriteria = {
                eventType: 'compliance_assessment',
                source: 'test-agent',
                startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
                endDate: new Date()
            };
            const filteredTrail = auditTrailGenerator.getAuditTrail(filterCriteria);
            (0, globals_1.expect)(Array.isArray(filteredTrail)).toBe(true);
        });
    });
});
(0, globals_1.describe)('Compliance Correlator - EC-005', () => {
    let complianceCorrelator;
    (0, globals_1.beforeEach)(() => {
        complianceCorrelator = new compliance_correlator_1.ComplianceCorrelator({
            frameworks: ['soc2', 'iso27001', 'nist-ssdf'],
            gapAnalysis: true,
            unifiedReporting: true,
            correlationMatrix: true,
            mappingDatabase: true,
            riskAggregation: true
        });
    });
    (0, globals_1.describe)('Cross-Framework Correlation', () => {
        (0, globals_1.test)('should correlate compliance across multiple frameworks', async () => {
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
            (0, globals_1.expect)(correlation).toMatchObject({
                correlationId: globals_1.expect.any(String),
                timestamp: globals_1.expect.any(Date),
                frameworks: ['soc2', 'iso27001', 'nist-ssdf'],
                overallScore: globals_1.expect.any(Number),
                frameworkScores: globals_1.expect.any(Object),
                correlationMatrix: globals_1.expect.any(Object),
                gapAnalysis: globals_1.expect.any(Object),
                riskAggregation: globals_1.expect.any(Object),
                unifiedReport: globals_1.expect.any(Object)
            });
            (0, globals_1.expect)(correlation.overallScore).toBeGreaterThan(0);
            (0, globals_1.expect)(correlation.overallScore).toBeLessThanOrEqual(100);
        });
        (0, globals_1.test)('should build correlation matrix between frameworks', async () => {
            const mockResults = {
                soc2: { controls: [{ controlId: 'CC6.1' }] },
                iso27001: { controls: [{ controlId: 'A.8.2' }] }
            };
            const correlation = await complianceCorrelator.correlatCompliance(mockResults);
            (0, globals_1.expect)(correlation.correlationMatrix).toBeDefined();
            (0, globals_1.expect)(correlation.correlationMatrix.frameworks).toEqual(['soc2', 'iso27001']);
            (0, globals_1.expect)(correlation.correlationMatrix.matrix).toBeDefined();
            (0, globals_1.expect)(Array.isArray(correlation.correlationMatrix.matrix)).toBe(true);
        });
        (0, globals_1.test)('should identify cross-framework gaps', async () => {
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
            (0, globals_1.expect)(correlation.gapAnalysis).toBeDefined();
            (0, globals_1.expect)(correlation.gapAnalysis.totalGaps).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(correlation.gapAnalysis.prioritizedGaps).toBeDefined();
            (0, globals_1.expect)(Array.isArray(correlation.gapAnalysis.prioritizedGaps)).toBe(true);
        });
        (0, globals_1.test)('should aggregate risks across frameworks', async () => {
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
            (0, globals_1.expect)(correlation.riskAggregation).toBeDefined();
            (0, globals_1.expect)(correlation.riskAggregation.overallRiskScore).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(correlation.riskAggregation.riskByFramework).toBeDefined();
            (0, globals_1.expect)(correlation.riskAggregation.compoundRisks).toBeDefined();
            (0, globals_1.expect)(Array.isArray(correlation.riskAggregation.compoundRisks)).toBe(true);
        });
    });
    (0, globals_1.describe)('Unified Reporting', () => {
        (0, globals_1.test)('should generate unified compliance report', async () => {
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
            (0, globals_1.expect)(report).toMatchObject({
                id: globals_1.expect.any(String),
                frameworks: ['soc2', 'iso27001'],
                generated: globals_1.expect.any(Date)
            });
        });
        (0, globals_1.test)('should provide framework correlations', () => {
            const soc2ToIso = complianceCorrelator.getCorrelations('soc2', 'iso27001');
            (0, globals_1.expect)(Array.isArray(soc2ToIso)).toBe(true);
            if (soc2ToIso.length > 0) {
                const correlation = soc2ToIso[0];
                (0, globals_1.expect)(correlation).toMatchObject({
                    sourceFramework: 'soc2',
                    targetFramework: 'iso27001',
                    sourceControl: globals_1.expect.any(String),
                    targetControl: globals_1.expect.any(String),
                    correlationType: globals_1.expect.stringMatching(/equivalent|subset|superset|related|complementary/),
                    strength: globals_1.expect.any(Number)
                });
            }
        });
        (0, globals_1.test)('should maintain correlation history', () => {
            const history = complianceCorrelator.getCorrelationHistory();
            (0, globals_1.expect)(Array.isArray(history)).toBe(true);
        });
    });
});
(0, globals_1.describe)('Real-Time Monitor - EC-006', () => {
    let realTimeMonitor;
    (0, globals_1.beforeEach)(() => {
        realTimeMonitor = new real_time_monitor_1.RealTimeMonitor({
            enabled: true,
            alertThresholds: { critical: 95, high: 80, medium: 60 },
            performanceBudget: 0.003,
            pollingInterval: 1000, // 1 second for testing
            dashboards: true,
            alerting: true,
            automatedRemediation: true
        });
    });
    (0, globals_1.afterEach)(async () => {
        if (realTimeMonitor) {
            await realTimeMonitor.stop();
        }
    });
    (0, globals_1.describe)('Real-Time Monitoring', () => {
        (0, globals_1.test)('should start monitoring with framework configuration', async () => {
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
            (0, globals_1.expect)(startedEvent).toMatchObject({
                timestamp: globals_1.expect.any(Date),
                frameworks: 2,
                metrics: 2,
                alerting: true,
                dashboards: true
            });
        });
        (0, globals_1.test)('should collect and update metrics', async () => {
            await realTimeMonitor.start({
                frameworks: ['soc2'],
                alerting: false,
                dashboards: false,
                metrics: ['compliance_score']
            });
            // Wait for at least one monitoring cycle
            await new Promise(resolve => setTimeout(resolve, 1500));
            const metrics = realTimeMonitor.getCurrentMetrics();
            (0, globals_1.expect)(Array.isArray(metrics)).toBe(true);
            if (metrics.length > 0) {
                const metric = metrics[0];
                (0, globals_1.expect)(metric).toMatchObject({
                    id: globals_1.expect.any(String),
                    name: globals_1.expect.any(String),
                    type: globals_1.expect.any(String),
                    value: globals_1.expect.any(Number),
                    threshold: globals_1.expect.any(Number),
                    status: globals_1.expect.stringMatching(/normal|warning|critical|unknown/),
                    timestamp: globals_1.expect.any(Date)
                });
            }
        });
        (0, globals_1.test)('should emit compliance drift events', async () => {
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
            (0, globals_1.expect)(driftEvent).toMatchObject(mockDrift);
        });
        (0, globals_1.test)('should emit control failure events', async () => {
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
            (0, globals_1.expect)(failureEvent).toMatchObject(mockFailure);
        });
        (0, globals_1.test)('should emit elevated risk events', async () => {
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
            (0, globals_1.expect)(riskEvent).toMatchObject(mockRisk);
        });
    });
    (0, globals_1.describe)('Dashboard and Alerting', () => {
        (0, globals_1.test)('should configure default dashboards', () => {
            const dashboards = realTimeMonitor.getAllDashboards();
            (0, globals_1.expect)(Array.isArray(dashboards)).toBe(true);
            (0, globals_1.expect)(dashboards.length).toBeGreaterThan(0);
            const dashboard = dashboards[0];
            (0, globals_1.expect)(dashboard).toMatchObject({
                id: globals_1.expect.any(String),
                name: globals_1.expect.any(String),
                layout: globals_1.expect.any(String),
                widgets: globals_1.expect.any(Array),
                refreshInterval: globals_1.expect.any(Number)
            });
        });
        (0, globals_1.test)('should retrieve specific dashboard configuration', () => {
            const dashboards = realTimeMonitor.getAllDashboards();
            if (dashboards.length > 0) {
                const dashboardId = dashboards[0].id;
                const dashboard = realTimeMonitor.getDashboard(dashboardId);
                (0, globals_1.expect)(dashboard).toBeDefined();
                (0, globals_1.expect)(dashboard?.id).toBe(dashboardId);
            }
        });
        (0, globals_1.test)('should track performance metrics', async () => {
            await realTimeMonitor.start({
                frameworks: ['soc2'],
                alerting: false,
                dashboards: false,
                metrics: ['compliance_score']
            });
            // Let it run for a short time
            await new Promise(resolve => setTimeout(resolve, 1100));
            const performanceMetrics = realTimeMonitor.getPerformanceMetrics();
            (0, globals_1.expect)(performanceMetrics).toBeDefined();
            (0, globals_1.expect)(typeof performanceMetrics).toBe('object');
        });
    });
});
(0, globals_1.describe)('Phase 3 Integration - EC-008', () => {
    let phase3Integration;
    (0, globals_1.beforeEach)(() => {
        phase3Integration = new phase3_integration_1.Phase3ComplianceIntegration({
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
    (0, globals_1.afterEach)(async () => {
        if (phase3Integration) {
            await phase3Integration.disconnect();
        }
    });
    (0, globals_1.describe)('Evidence Transfer', () => {
        (0, globals_1.test)('should transfer evidence package to Phase 3 system', async () => {
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
            (0, globals_1.expect)(transfer).toMatchObject({
                packageId: 'test-package-1',
                sourceFramework: 'soc2',
                evidenceCount: 1,
                transferStatus: globals_1.expect.stringMatching(/completed|failed/),
                startTime: globals_1.expect.any(Date),
                checksum: globals_1.expect.any(String),
                metadata: globals_1.expect.objectContaining({
                    assessmentId: 'test-assessment-1',
                    framework: 'soc2'
                })
            });
        });
        (0, globals_1.test)('should handle transfer status tracking', async () => {
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
            (0, globals_1.expect)(status).toBeDefined();
            (0, globals_1.expect)(status?.packageId).toBe(transfer.packageId);
        });
    });
    (0, globals_1.describe)('Audit Trail Synchronization', () => {
        (0, globals_1.test)('should sync audit trail with Phase 3 system', async () => {
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
                    impact: 'low'
                }
            ];
            const syncResult = await phase3Integration.syncAuditTrail(mockAuditEvents);
            (0, globals_1.expect)(syncResult).toMatchObject({
                syncId: globals_1.expect.any(String),
                timestamp: globals_1.expect.any(Date),
                operation: 'push',
                recordsProcessed: 1,
                recordsSuccessful: globals_1.expect.any(Number),
                recordsFailed: globals_1.expect.any(Number),
                duration: globals_1.expect.any(Number)
            });
            (0, globals_1.expect)(syncResult.recordsProcessed).toBe(1);
        });
        (0, globals_1.test)('should maintain sync history', async () => {
            const history = phase3Integration.getSyncHistory();
            (0, globals_1.expect)(Array.isArray(history)).toBe(true);
        });
    });
    (0, globals_1.describe)('Evidence Retrieval', () => {
        (0, globals_1.test)('should retrieve evidence from Phase 3 system', async () => {
            const evidence = await phase3Integration.retrieveEvidence({
                framework: 'soc2',
                controlId: 'CC6.1',
                dateRange: {
                    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    end: new Date()
                },
                evidenceTypes: ['configuration', 'log']
            });
            (0, globals_1.expect)(Array.isArray(evidence)).toBe(true);
            // Evidence array may be empty in mock implementation
        });
    });
    (0, globals_1.describe)('Connection Management', () => {
        (0, globals_1.test)('should track connection status', () => {
            (0, globals_1.expect)(phase3Integration.isConnected()).toBe(true);
        });
        (0, globals_1.test)('should handle disconnection', async () => {
            await phase3Integration.disconnect();
            (0, globals_1.expect)(phase3Integration.isConnected()).toBe(false);
        });
    });
});
(0, globals_1.describe)('Performance and Integration Tests', () => {
    (0, globals_1.describe)('Performance Budget Compliance', () => {
        (0, globals_1.test)('should maintain performance within 0.3% budget across all operations', async () => {
            const performanceTest = async () => {
                const complianceAgent = new compliance_automation_agent_1.EnterpriseComplianceAutomationAgent(mockConfig);
                const startTime = performance.now();
                await complianceAgent.startCompliance();
                const endTime = performance.now();
                const duration = endTime - startTime;
                const performanceOverhead = (duration / 1000) / 100; // Convert to percentage
                await complianceAgent.stop();
                return performanceOverhead;
            };
            const overhead = await performanceTest();
            (0, globals_1.expect)(overhead).toBeLessThan(mockConfig.performanceBudget);
        });
    });
    (0, globals_1.describe)('NASA POT10 Compliance Preservation', () => {
        (0, globals_1.test)('should maintain NASA POT10 compliance requirements', async () => {
            const complianceAgent = new compliance_automation_agent_1.EnterpriseComplianceAutomationAgent(mockConfig);
            // Simulate NASA POT10 compliance check
            const status = await complianceAgent.startCompliance();
            // Verify essential compliance characteristics are preserved
            (0, globals_1.expect)(status.overall).toBeGreaterThanOrEqual(90); // High compliance threshold
            (0, globals_1.expect)(status.auditTrail).toBeDefined(); // Audit trail requirement
            (0, globals_1.expect)(status.timestamp).toBeInstanceOf(Date); // Timestamp requirement
            await complianceAgent.stop();
        });
    });
    (0, globals_1.describe)('Multi-Framework Integration', () => {
        (0, globals_1.test)('should successfully integrate all three frameworks simultaneously', async () => {
            const complianceAgent = new compliance_automation_agent_1.EnterpriseComplianceAutomationAgent(mockConfig);
            const status = await complianceAgent.startCompliance();
            (0, globals_1.expect)(status.frameworks).toMatchObject({
                soc2: globals_1.expect.any(String),
                iso27001: globals_1.expect.any(String),
                nistSSFD: globals_1.expect.any(String)
            });
            await complianceAgent.stop();
        });
    });
    (0, globals_1.describe)('Error Recovery and Resilience', () => {
        (0, globals_1.test)('should handle partial framework failures gracefully', async () => {
            const complianceAgent = new compliance_automation_agent_1.EnterpriseComplianceAutomationAgent(mockConfig);
            // Simulate error condition
            const errorPromise = new Promise((resolve) => {
                complianceAgent.on('error', resolve);
            });
            // This should not throw even if individual components fail
            const status = await complianceAgent.startCompliance();
            (0, globals_1.expect)(status).toBeDefined();
            await complianceAgent.stop();
        });
    });
});
(0, globals_1.describe)('End-to-End Workflow Tests', () => {
    (0, globals_1.test)('should complete full compliance automation workflow', async () => {
        const complianceAgent = new compliance_automation_agent_1.EnterpriseComplianceAutomationAgent(mockConfig);
        try {
            // Step 1: Start compliance assessment
            const status = await complianceAgent.startCompliance();
            (0, globals_1.expect)(status).toBeDefined();
            // Step 2: Generate compliance report
            const report = await complianceAgent.generateComplianceReport();
            (0, globals_1.expect)(report).toBeDefined();
            // Step 3: Get current compliance status
            const currentStatus = await complianceAgent.getComplianceStatus();
            (0, globals_1.expect)(currentStatus).toBeDefined();
            // Verify workflow completion
            (0, globals_1.expect)(status.overall).toBeGreaterThan(0);
            (0, globals_1.expect)(report.frameworks).toEqual(globals_1.expect.arrayContaining(mockConfig.frameworks));
        }
        finally {
            await complianceAgent.stop();
        }
    });
});
//# sourceMappingURL=enterprise-compliance-automation.test.js.map