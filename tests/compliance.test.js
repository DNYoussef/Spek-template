/**
 * Unit Tests for Compliance Matrix
 * Tests SOC2/ISO27001 mappings and compliance functionality
 */

const ComplianceMatrix = require('../src/compliance/matrix');

describe('ComplianceMatrix', () => {
  let matrix;

  beforeEach(() => {
    matrix = new ComplianceMatrix();
  });

  describe('Control Initialization', () => {
    test('should initialize with predefined controls', () => {
      expect(matrix.controls.size).toBeGreaterThan(0);
      
      // Check SOC2 controls
      expect(matrix.controls.has('CC1.1')).toBe(true);
      expect(matrix.controls.has('CC2.1')).toBe(true);
      expect(matrix.controls.has('CC3.1')).toBe(true);
      
      // Check ISO27001 controls
      expect(matrix.controls.has('A.9.1.1')).toBe(true);
      expect(matrix.controls.has('A.12.6.1')).toBe(true);
      expect(matrix.controls.has('A.18.1.4')).toBe(true);
    });

    test('should have proper control mappings between frameworks', () => {
      const soc2Control = matrix.controls.get('CC5.1');
      expect(soc2Control.iso27001Mapping).toContain('A.9.1.1');
      
      const iso27001Control = matrix.controls.get('A.9.1.1');
      expect(iso27001Control.soc2Mapping).toContain('CC5.1');
    });

    test('should initialize controls with proper default values', () => {
      const control = matrix.controls.get('CC1.1');
      
      expect(control.status).toBe('Not Assessed');
      expect(control.lastAssessment).toBeNull();
      expect(control.nextAssessment).toBeNull();
      expect(control.evidenceRequired).toBe(true);
      expect(control.evidenceCount).toBe(0);
      expect(control.riskLevel).toBeDefined();
      expect(control.frequency).toBeDefined();
      expect(control.requirements).toBeDefined();
      expect(Array.isArray(control.requirements)).toBe(true);
    });
  });

  describe('Evidence Management', () => {
    test('should add evidence to control', () => {
      const evidence = {
        type: 'Policy Document',
        title: 'Information Security Policy',
        description: 'Corporate information security policy document',
        collectedBy: 'Auditor Name',
        validFrom: '2024-01-01T00:00:00.000Z',
        validUntil: '2024-12-31T23:59:59.000Z'
      };

      const evidenceId = matrix.addEvidence('A.9.1.1', evidence);
      
      expect(evidenceId).toBeDefined();
      expect(evidenceId).toMatch(/^A\.9\.1\.1_\d+_[a-z0-9]+$/);
      expect(matrix.evidence.has(evidenceId)).toBe(true);
      
      const storedEvidence = matrix.evidence.get(evidenceId);
      expect(storedEvidence.controlId).toBe('A.9.1.1');
      expect(storedEvidence.type).toBe('Policy Document');
      expect(storedEvidence.title).toBe('Information Security Policy');
      expect(storedEvidence.collectedBy).toBe('Auditor Name');
      expect(storedEvidence.status).toBe('Active');
      
      // Check that control evidence count is updated
      const control = matrix.controls.get('A.9.1.1');
      expect(control.evidenceCount).toBe(1);
    });

    test('should throw error for non-existent control', () => {
      const evidence = {
        type: 'Document',
        title: 'Test Document',
        description: 'Test description',
        collectedBy: 'Test User'
      };

      expect(() => matrix.addEvidence('INVALID.CONTROL', evidence)).toThrow('Control INVALID.CONTROL not found');
    });

    test('should handle multiple evidence items for same control', () => {
      const evidence1 = {
        type: 'Policy',
        title: 'Security Policy',
        description: 'Main security policy',
        collectedBy: 'Auditor 1'
      };
      
      const evidence2 = {
        type: 'Procedure',
        title: 'Access Control Procedure',
        description: 'Detailed access control procedure',
        collectedBy: 'Auditor 2'
      };

      matrix.addEvidence('CC5.1', evidence1);
      matrix.addEvidence('CC5.1', evidence2);
      
      const control = matrix.controls.get('CC5.1');
      expect(control.evidenceCount).toBe(2);
    });
  });

  describe('Control Assessment', () => {
    test('should assess control compliance', () => {
      const assessment = {
        status: 'Compliant',
        assessor: 'Jane Doe',
        findings: ['All requirements met'],
        remediation: [],
        riskRating: 'Low',
        notes: 'Control operating effectively'
      };

      const assessmentId = matrix.assessControl('CC1.1', assessment);
      
      expect(assessmentId).toBeDefined();
      expect(matrix.assessments.length).toBe(1);
      
      const storedAssessment = matrix.assessments[0];
      expect(storedAssessment.controlId).toBe('CC1.1');
      expect(storedAssessment.status).toBe('Compliant');
      expect(storedAssessment.assessor).toBe('Jane Doe');
      expect(storedAssessment.assessmentDate).toBeDefined();
      
      // Check control status is updated
      const control = matrix.controls.get('CC1.1');
      expect(control.status).toBe('Compliant');
      expect(control.lastAssessment).toBeDefined();
      expect(control.nextAssessment).toBeDefined();
    });

    test('should validate assessment status', () => {
      const invalidAssessment = {
        status: 'Invalid Status',
        assessor: 'Test Assessor'
      };

      expect(() => matrix.assessControl('CC1.1', invalidAssessment)).toThrow('Invalid status. Must be one of: Compliant, Non-Compliant, Partially Compliant, Not Applicable');
    });

    test('should throw error for non-existent control', () => {
      const assessment = {
        status: 'Compliant',
        assessor: 'Test Assessor'
      };

      expect(() => matrix.assessControl('INVALID.CONTROL', assessment)).toThrow('Control INVALID.CONTROL not found');
    });

    test('should handle non-compliant assessment with remediation', () => {
      const assessment = {
        status: 'Non-Compliant',
        assessor: 'Security Auditor',
        findings: ['Missing documentation', 'Inadequate controls'],
        remediation: ['Create policy document', 'Implement technical controls'],
        riskRating: 'High',
        dueDate: '2024-12-31T23:59:59.000Z'
      };

      matrix.assessControl('A.12.6.1', assessment);
      
      const control = matrix.controls.get('A.12.6.1');
      expect(control.status).toBe('Non-Compliant');
      
      const storedAssessment = matrix.assessments[0];
      expect(storedAssessment.findings).toHaveLength(2);
      expect(storedAssessment.remediation).toHaveLength(2);
      expect(storedAssessment.riskRating).toBe('High');
      expect(storedAssessment.dueDate).toBe('2024-12-31T23:59:59.000Z');
    });
  });

  describe('Next Assessment Date Calculation', () => {
    test('should calculate next assessment dates correctly', () => {
      const now = new Date();
      
      // Test monthly frequency
      const monthlyNext = matrix.calculateNextAssessmentDate('Monthly');
      const expectedMonthly = new Date(now);
      expectedMonthly.setMonth(expectedMonthly.getMonth() + 1);
      expect(new Date(monthlyNext).getMonth()).toBe(expectedMonthly.getMonth());
      
      // Test quarterly frequency
      const quarterlyNext = matrix.calculateNextAssessmentDate('Quarterly');
      const expectedQuarterly = new Date(now);
      expectedQuarterly.setMonth(expectedQuarterly.getMonth() + 3);
      expect(new Date(quarterlyNext).getMonth()).toBe(expectedQuarterly.getMonth());
      
      // Test annual frequency
      const annualNext = matrix.calculateNextAssessmentDate('Annual');
      const expectedAnnual = new Date(now);
      expectedAnnual.setFullYear(expectedAnnual.getFullYear() + 1);
      expect(new Date(annualNext).getFullYear()).toBe(expectedAnnual.getFullYear());
      
      // Test continuous frequency
      const continuousNext = matrix.calculateNextAssessmentDate('Continuous');
      expect(continuousNext).toBeNull();
    });
  });

  describe('Control Mapping', () => {
    test('should get control mappings between frameworks', () => {
      const mapping = matrix.getControlMapping('CC5.1');
      
      expect(mapping.control).toBeDefined();
      expect(mapping.control.id).toBe('CC5.1');
      expect(mapping.mappedControls).toBeDefined();
      expect(Array.isArray(mapping.mappedControls)).toBe(true);
      
      const iso27001Mappings = mapping.mappedControls.filter(m => m.framework === 'ISO27001');
      expect(iso27001Mappings.length).toBeGreaterThan(0);
      expect(iso27001Mappings[0].controlId).toBe('A.9.1.1');
    });

    test('should handle reverse mapping from ISO27001 to SOC2', () => {
      const mapping = matrix.getControlMapping('A.9.1.1');
      
      const soc2Mappings = mapping.mappedControls.filter(m => m.framework === 'SOC2');
      expect(soc2Mappings.length).toBeGreaterThan(0);
      expect(soc2Mappings.some(m => m.controlId === 'CC5.1')).toBe(true);
    });

    test('should throw error for non-existent control', () => {
      expect(() => matrix.getControlMapping('INVALID.CONTROL')).toThrow('Control INVALID.CONTROL not found');
    });
  });

  describe('Compliance Reporting', () => {
    test('should generate empty compliance report', () => {
      const report = matrix.generateComplianceReport();
      
      expect(report.summary.compliancePercentage).toBe(0);
      expect(report.summary.totalControls).toBeGreaterThan(0);
      expect(report.summary.compliantControls).toBe(0);
      expect(report.summary.notAssessedControls).toBe(report.summary.totalControls);
      expect(report.riskBreakdown).toBeDefined();
      expect(report.overdueAssessments).toEqual([]);
      expect(report.frameworkCoverage.soc2).toBeDefined();
      expect(report.frameworkCoverage.iso27001).toBeDefined();
    });

    test('should generate comprehensive compliance report with data', () => {
      // Add some assessments
      matrix.assessControl('CC1.1', { status: 'Compliant', assessor: 'Auditor 1' });
      matrix.assessControl('CC2.1', { status: 'Non-Compliant', assessor: 'Auditor 2' });
      matrix.assessControl('A.9.1.1', { status: 'Partially Compliant', assessor: 'Auditor 3' });
      
      // Add some evidence
      matrix.addEvidence('CC1.1', {
        type: 'Policy',
        title: 'Test Policy',
        description: 'Test evidence',
        collectedBy: 'Collector'
      });

      const report = matrix.generateComplianceReport();
      
      expect(report.summary.totalControls).toBeGreaterThan(3);
      expect(report.summary.compliantControls).toBe(1);
      expect(report.summary.nonCompliantControls).toBe(1);
      expect(report.summary.partiallyCompliantControls).toBe(1);
      expect(report.summary.compliancePercentage).toBeGreaterThan(0);
      expect(report.summary.totalEvidence).toBe(1);
      expect(report.summary.activeEvidence).toBe(1);
      expect(report.summary.riskScore).toBeGreaterThan(0);
      expect(report.recentAssessments).toHaveLength(3);
      
      // Check framework-specific coverage
      expect(report.frameworkCoverage.soc2.total).toBeGreaterThan(0);
      expect(report.frameworkCoverage.soc2.compliant).toBe(1);
      expect(report.frameworkCoverage.iso27001.total).toBeGreaterThan(0);
      expect(report.frameworkCoverage.iso27001.compliant).toBe(0);
    });

    test('should identify overdue assessments', () => {
      // Manually set a control with overdue assessment
      const control = matrix.controls.get('CC1.1');
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30); // 30 days ago
      control.nextAssessment = pastDate.toISOString();
      matrix.controls.set('CC1.1', control);

      const report = matrix.generateComplianceReport();
      
      expect(report.overdueAssessments.length).toBe(1);
      expect(report.overdueAssessments[0].controlId).toBe('CC1.1');
      expect(report.overdueAssessments[0].daysOverdue).toBe(30);
    });
  });

  describe('Risk Score Calculation', () => {
    test('should calculate risk score correctly', () => {
      const riskBreakdown = {
        critical: 2,
        high: 3,
        medium: 1,
        low: 0
      };
      
      const riskScore = matrix.calculateRiskScore(riskBreakdown);
      
      // (2*4 + 3*3 + 1*2 + 0*1) * 2.5 = (8 + 9 + 2 + 0) * 2.5 = 47.5 rounded to 48
      expect(riskScore).toBe(48);
    });

    test('should cap risk score at 100', () => {
      const highRiskBreakdown = {
        critical: 20,
        high: 20,
        medium: 20,
        low: 20
      };
      
      const riskScore = matrix.calculateRiskScore(highRiskBreakdown);
      expect(riskScore).toBe(100);
    });
  });

  describe('Export Functionality', () => {
    test('should export matrix as JSON', () => {
      matrix.assessControl('CC1.1', { status: 'Compliant', assessor: 'Test Auditor' });
      matrix.addEvidence('CC1.1', {
        type: 'Policy',
        title: 'Test Policy',
        description: 'Test evidence',
        collectedBy: 'Test Collector'
      });

      const jsonExport = matrix.exportMatrix('json');
      const parsedExport = JSON.parse(jsonExport);
      
      expect(parsedExport.controls).toBeDefined();
      expect(parsedExport.evidence).toBeDefined();
      expect(parsedExport.assessments).toBeDefined();
      expect(parsedExport.report).toBeDefined();
      expect(parsedExport.exportedAt).toBeDefined();
    });

    test('should export matrix as CSV', () => {
      const csvExport = matrix.exportMatrix('csv');
      const lines = csvExport.split('\n');
      
      expect(lines[0]).toContain('Control ID,Framework,Category,Title,Risk Level,Status,Last Assessment,Evidence Count,Frequency');
      expect(lines.length).toBeGreaterThan(1);
      expect(lines[1]).toContain('CC1.1,SOC2');
    });

    test('should throw error for unsupported export format', () => {
      expect(() => matrix.exportMatrix('xml')).toThrow('Unsupported export format: xml');
    });
  });

  describe('Real World Compliance Scenarios', () => {
    test('should handle comprehensive compliance assessment', () => {
      // Simulate a full compliance assessment
      const assessments = [
        { controlId: 'CC1.1', status: 'Compliant', assessor: 'Senior Auditor' },
        { controlId: 'CC2.1', status: 'Compliant', assessor: 'Senior Auditor' },
        { controlId: 'CC3.1', status: 'Non-Compliant', assessor: 'Senior Auditor' },
        { controlId: 'CC4.1', status: 'Partially Compliant', assessor: 'Senior Auditor' },
        { controlId: 'A.9.1.1', status: 'Compliant', assessor: 'Security Specialist' },
        { controlId: 'A.12.6.1', status: 'Non-Compliant', assessor: 'Security Specialist' }
      ];

      assessments.forEach(assessment => {
        matrix.assessControl(assessment.controlId, {
          status: assessment.status,
          assessor: assessment.assessor,
          findings: assessment.status === 'Compliant' ? [] : ['Issues identified'],
          remediation: assessment.status === 'Compliant' ? [] : ['Remediation required']
        });
      });

      // Add evidence for compliant controls
      const compliantControls = assessments.filter(a => a.status === 'Compliant');
      compliantControls.forEach(control => {
        matrix.addEvidence(control.controlId, {
          type: 'Assessment Report',
          title: `Evidence for ${control.controlId}`,
          description: 'Supporting evidence document',
          collectedBy: control.assessor
        });
      });

      const report = matrix.generateComplianceReport();
      
      expect(report.summary.compliancePercentage).toBeGreaterThan(0);
      expect(report.summary.compliancePercentage).toBeLessThan(100);
      expect(report.summary.riskScore).toBeGreaterThan(0);
      expect(report.riskBreakdown.high).toBeGreaterThan(0); // Should have high-risk non-compliant controls
    });

    test('should track compliance progress over time', () => {
      // Initial non-compliant assessment
      matrix.assessControl('CC3.1', {
        status: 'Non-Compliant',
        assessor: 'Initial Auditor',
        findings: ['Control not implemented']
      });

      const initialReport = matrix.generateComplianceReport();
      expect(initialReport.summary.nonCompliantControls).toBe(1);

      // Follow-up compliant assessment
      matrix.assessControl('CC3.1', {
        status: 'Compliant',
        assessor: 'Follow-up Auditor',
        findings: ['Control now operating effectively']
      });

      const followupReport = matrix.generateComplianceReport();
      expect(followupReport.summary.compliantControls).toBe(1);
      expect(followupReport.summary.nonCompliantControls).toBe(0);
      expect(followupReport.recentAssessments.length).toBe(2);
    });
  });
});