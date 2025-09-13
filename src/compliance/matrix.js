/**
 * Compliance Matrix - Working SOC2/ISO27001 Mappings
 * Real compliance control mappings with validation logic
 */

class ComplianceMatrix {
  constructor() {
    this.controls = new Map();
    this.evidence = new Map();
    this.assessments = [];
    this.initializeControlMappings();
  }

  /**
   * Initialize SOC2 and ISO27001 control mappings
   */
  initializeControlMappings() {
    // SOC2 Type II Controls
    const soc2Controls = [
      {
        id: 'CC1.1',
        category: 'Control Environment',
        title: 'Organization Structure and Reporting Lines',
        description: 'The entity demonstrates a commitment to integrity and ethical values',
        riskLevel: 'High',
        frequency: 'Annual',
        iso27001Mapping: ['A.7.1.1', 'A.7.2.1'],
        requirements: [
          'Code of conduct exists and is communicated',
          'Organizational structure is documented',
          'Reporting lines are clearly defined'
        ]
      },
      {
        id: 'CC2.1',
        category: 'Communication and Information',
        title: 'Information Quality and Communication',
        description: 'The entity obtains or generates relevant, quality information',
        riskLevel: 'Medium',
        frequency: 'Quarterly',
        iso27001Mapping: ['A.13.2.1', 'A.16.1.2'],
        requirements: [
          'Information systems provide relevant data',
          'Communication processes are established',
          'Information quality is monitored'
        ]
      },
      {
        id: 'CC3.1',
        category: 'Risk Assessment',
        title: 'Risk Identification and Assessment',
        description: 'The entity specifies objectives with sufficient clarity',
        riskLevel: 'High',
        frequency: 'Semi-Annual',
        iso27001Mapping: ['A.12.6.1', 'A.18.1.4'],
        requirements: [
          'Risk assessment process is documented',
          'Risk tolerance levels are defined',
          'Regular risk assessments are conducted'
        ]
      },
      {
        id: 'CC4.1',
        category: 'Monitoring Activities',
        title: 'Control Monitoring and Evaluation',
        description: 'The entity selects, develops, and performs ongoing evaluations',
        riskLevel: 'Medium',
        frequency: 'Monthly',
        iso27001Mapping: ['A.18.2.2', 'A.18.2.3'],
        requirements: [
          'Monitoring procedures are established',
          'Control effectiveness is evaluated',
          'Deficiencies are reported and addressed'
        ]
      },
      {
        id: 'CC5.1',
        category: 'Control Activities',
        title: 'Logical and Physical Access Controls',
        description: 'The entity selects and develops control activities',
        riskLevel: 'Critical',
        frequency: 'Continuous',
        iso27001Mapping: ['A.9.1.1', 'A.9.2.1', 'A.11.1.1'],
        requirements: [
          'Access control policies exist',
          'Physical security controls are implemented',
          'Logical access is monitored'
        ]
      }
    ];

    // ISO 27001 Controls
    const iso27001Controls = [
      {
        id: 'A.9.1.1',
        category: 'Access Control',
        title: 'Access Control Policy',
        description: 'An access control policy should be established',
        riskLevel: 'Critical',
        frequency: 'Annual',
        soc2Mapping: ['CC5.1', 'CC6.1'],
        requirements: [
          'Access control policy is documented',
          'Policy is approved by management',
          'Policy is communicated to users'
        ]
      },
      {
        id: 'A.12.6.1',
        category: 'Operations Security',
        title: 'Management of Technical Vulnerabilities',
        description: 'Information about technical vulnerabilities should be obtained',
        riskLevel: 'High',
        frequency: 'Monthly',
        soc2Mapping: ['CC3.1', 'CC7.1'],
        requirements: [
          'Vulnerability assessment process exists',
          'Timely patching procedures are established',
          'Vulnerability remediation is tracked'
        ]
      },
      {
        id: 'A.18.1.4',
        category: 'Compliance',
        title: 'Privacy and Protection of PII',
        description: 'Privacy and protection of personally identifiable information',
        riskLevel: 'Critical',
        frequency: 'Continuous',
        soc2Mapping: ['CC3.1', 'P1.1'],
        requirements: [
          'Privacy policy is established',
          'PII handling procedures are documented',
          'Data subject rights are supported'
        ]
      }
    ];

    // Add all controls to the map
    [...soc2Controls, ...iso27001Controls].forEach(control => {
      this.controls.set(control.id, {
        ...control,
        status: 'Not Assessed',
        lastAssessment: null,
        nextAssessment: null,
        evidenceRequired: true,
        evidenceCount: 0
      });
    });
  }

  /**
   * Add evidence for a specific control
   */
  addEvidence(controlId, evidence) {
    if (!this.controls.has(controlId)) {
      throw new Error(`Control ${controlId} not found`);
    }

    const evidenceId = `${controlId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const evidenceRecord = {
      id: evidenceId,
      controlId,
      type: evidence.type,
      title: evidence.title,
      description: evidence.description,
      documentPath: evidence.documentPath || null,
      collectedBy: evidence.collectedBy,
      collectedAt: new Date().toISOString(),
      validFrom: evidence.validFrom || new Date().toISOString(),
      validUntil: evidence.validUntil || null,
      status: 'Active'
    };

    this.evidence.set(evidenceId, evidenceRecord);
    
    // Update control evidence count
    const control = this.controls.get(controlId);
    control.evidenceCount++;
    this.controls.set(controlId, control);

    return evidenceId;
  }

  /**
   * Assess a control's compliance status
   */
  assessControl(controlId, assessment) {
    if (!this.controls.has(controlId)) {
      throw new Error(`Control ${controlId} not found`);
    }

    const control = this.controls.get(controlId);
    
    // Validate assessment data
    const validStatuses = ['Compliant', 'Non-Compliant', 'Partially Compliant', 'Not Applicable'];
    if (!validStatuses.includes(assessment.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const assessmentRecord = {
      id: `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      controlId,
      status: assessment.status,
      assessor: assessment.assessor,
      assessmentDate: new Date().toISOString(),
      findings: assessment.findings || [],
      remediation: assessment.remediation || [],
      riskRating: assessment.riskRating || 'Medium',
      dueDate: assessment.dueDate || null,
      notes: assessment.notes || ''
    };

    this.assessments.push(assessmentRecord);

    // Update control status and dates
    control.status = assessment.status;
    control.lastAssessment = assessmentRecord.assessmentDate;
    control.nextAssessment = this.calculateNextAssessmentDate(control.frequency);
    
    this.controls.set(controlId, control);

    return assessmentRecord.id;
  }

  /**
   * Calculate next assessment date based on frequency
   */
  calculateNextAssessmentDate(frequency) {
    const now = new Date();
    const nextDate = new Date(now);

    switch (frequency.toLowerCase()) {
      case 'continuous':
        return null; // No specific next date for continuous monitoring
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'semi-annual':
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 'annual':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 3); // Default to quarterly
    }

    return nextDate.toISOString();
  }

  /**
   * Get control mapping between SOC2 and ISO27001
   */
  getControlMapping(controlId) {
    const control = this.controls.get(controlId);
    if (!control) {
      throw new Error(`Control ${controlId} not found`);
    }

    const mappings = [];
    
    if (control.iso27001Mapping) {
      control.iso27001Mapping.forEach(mappedId => {
        const mappedControl = this.controls.get(mappedId);
        if (mappedControl) {
          mappings.push({
            framework: 'ISO27001',
            controlId: mappedId,
            title: mappedControl.title,
            category: mappedControl.category
          });
        }
      });
    }

    if (control.soc2Mapping) {
      control.soc2Mapping.forEach(mappedId => {
        const mappedControl = this.controls.get(mappedId);
        if (mappedControl) {
          mappings.push({
            framework: 'SOC2',
            controlId: mappedId,
            title: mappedControl.title,
            category: mappedControl.category
          });
        }
      });
    }

    return {
      control,
      mappedControls: mappings
    };
  }

  /**
   * Generate compliance dashboard with real metrics
   */
  generateComplianceReport() {
    const controlsArray = Array.from(this.controls.values());
    const evidenceArray = Array.from(this.evidence.values());

    const stats = {
      totalControls: controlsArray.length,
      compliantControls: controlsArray.filter(c => c.status === 'Compliant').length,
      nonCompliantControls: controlsArray.filter(c => c.status === 'Non-Compliant').length,
      partiallyCompliantControls: controlsArray.filter(c => c.status === 'Partially Compliant').length,
      notAssessedControls: controlsArray.filter(c => c.status === 'Not Assessed').length,
      totalEvidence: evidenceArray.length,
      activeEvidence: evidenceArray.filter(e => e.status === 'Active').length
    };

    const compliancePercentage = stats.totalControls > 0 
      ? Math.round((stats.compliantControls / stats.totalControls) * 100)
      : 0;

    const riskBreakdown = {
      critical: controlsArray.filter(c => c.riskLevel === 'Critical' && c.status !== 'Compliant').length,
      high: controlsArray.filter(c => c.riskLevel === 'High' && c.status !== 'Compliant').length,
      medium: controlsArray.filter(c => c.riskLevel === 'Medium' && c.status !== 'Compliant').length,
      low: controlsArray.filter(c => c.riskLevel === 'Low' && c.status !== 'Compliant').length
    };

    const overdueAssessments = controlsArray.filter(control => {
      if (!control.nextAssessment) return false;
      return new Date(control.nextAssessment) < new Date();
    });

    return {
      summary: {
        compliancePercentage,
        ...stats,
        riskScore: this.calculateRiskScore(riskBreakdown),
        lastUpdated: new Date().toISOString()
      },
      riskBreakdown,
      overdueAssessments: overdueAssessments.map(c => ({
        controlId: c.id,
        title: c.title,
        category: c.category,
        riskLevel: c.riskLevel,
        daysOverdue: Math.floor((new Date() - new Date(c.nextAssessment)) / (1000 * 60 * 60 * 24))
      })),
      recentAssessments: this.assessments
        .sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate))
        .slice(0, 10),
      frameworkCoverage: {
        soc2: {
          total: controlsArray.filter(c => c.id.startsWith('CC')).length,
          compliant: controlsArray.filter(c => c.id.startsWith('CC') && c.status === 'Compliant').length
        },
        iso27001: {
          total: controlsArray.filter(c => c.id.startsWith('A.')).length,
          compliant: controlsArray.filter(c => c.id.startsWith('A.') && c.status === 'Compliant').length
        }
      }
    };
  }

  /**
   * Calculate risk score based on non-compliant controls
   */
  calculateRiskScore(riskBreakdown) {
    const weights = { critical: 4, high: 3, medium: 2, low: 1 };
    const totalRisk = Object.entries(riskBreakdown).reduce((sum, [level, count]) => {
      return sum + (weights[level] * count);
    }, 0);
    
    return Math.min(100, Math.round(totalRisk * 2.5)); // Scale to 0-100
  }

  /**
   * Export compliance matrix to various formats
   */
  exportMatrix(format = 'json') {
    const data = {
      controls: Object.fromEntries(this.controls),
      evidence: Object.fromEntries(this.evidence),
      assessments: this.assessments,
      report: this.generateComplianceReport(),
      exportedAt: new Date().toISOString()
    };

    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.generateCSVExport(data);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate CSV export of controls
   */
  generateCSVExport(data) {
    const headers = [
      'Control ID', 'Framework', 'Category', 'Title', 'Risk Level',
      'Status', 'Last Assessment', 'Evidence Count', 'Frequency'
    ];

    const rows = Array.from(this.controls.values()).map(control => [
      control.id,
      control.id.startsWith('CC') ? 'SOC2' : 'ISO27001',
      control.category,
      control.title,
      control.riskLevel,
      control.status,
      control.lastAssessment || 'Never',
      control.evidenceCount,
      control.frequency
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

module.exports = ComplianceMatrix;