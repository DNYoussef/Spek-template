/**
 * Compliance Matrix - Working Example
 * Demonstrates working SOC2/ISO27001 mappings and compliance management
 */

const fs = require('fs');
const path = require('path');
const ComplianceMatrix = require('../src/compliance/matrix');

async function demonstrateCompliance() {
  console.log('=== Compliance Matrix Demonstration ===\n');
  
  const matrix = new ComplianceMatrix();
  
  // Example 1: View Initial Control Framework
  console.log('1. Initial Compliance Framework:');
  console.log('-------------------------------');
  
  const totalControls = matrix.controls.size;
  const soc2Controls = Array.from(matrix.controls.keys()).filter(id => id.startsWith('CC')).length;
  const iso27001Controls = Array.from(matrix.controls.keys()).filter(id => id.startsWith('A.')).length;
  
  console.log(`Total Controls Loaded: ${totalControls}`);
  console.log(`SOC2 Type II Controls: ${soc2Controls}`);
  console.log(`ISO 27001 Controls: ${iso27001Controls}`);
  
  // Show sample controls
  console.log('\nSample SOC2 Controls:');
  Array.from(matrix.controls.entries())
    .filter(([id]) => id.startsWith('CC'))
    .slice(0, 3)
    .forEach(([id, control]) => {
      console.log(`  ${id}: ${control.title} (${control.riskLevel} Risk)`);
    });
  
  console.log('\nSample ISO 27001 Controls:');
  Array.from(matrix.controls.entries())
    .filter(([id]) => id.startsWith('A.'))
    .slice(0, 3)
    .forEach(([id, control]) => {
      console.log(`  ${id}: ${control.title} (${control.riskLevel} Risk)`);
    });
  
  console.log('');
  
  // Example 2: Add Evidence to Controls
  console.log('2. Adding Evidence to Controls:');
  console.log('------------------------------');
  
  // Add evidence for access control policy
  const accessControlEvidence = [
    {
      type: 'Policy Document',
      title: 'Information Security Policy v2.1',
      description: 'Corporate information security policy covering access controls, data classification, and incident response',
      collectedBy: 'Security Officer',
      validFrom: '2024-01-01T00:00:00.000Z',
      validUntil: '2024-12-31T23:59:59.000Z',
      documentPath: '/policies/info-security-policy-v2.1.pdf'
    },
    {
      type: 'Procedure Document',
      title: 'Access Control Procedures',
      description: 'Detailed procedures for user access provisioning, review, and deprovisioning',
      collectedBy: 'IT Manager',
      validFrom: '2024-02-01T00:00:00.000Z'
    },
    {
      type: 'Technical Configuration',
      title: 'Active Directory Configuration',
      description: 'Screenshots and configuration exports showing access control implementation',
      collectedBy: 'System Administrator'
    }
  ];
  
  accessControlEvidence.forEach(evidence => {
    const evidenceId = matrix.addEvidence('A.9.1.1', evidence);
    console.log(`Added evidence: ${evidence.title} (ID: ${evidenceId})`);
  });
  
  // Add evidence for vulnerability management
  const vulnMgmtEvidence = [
    {
      type: 'Scan Results',
      title: 'Monthly Vulnerability Scan Report',
      description: 'Automated vulnerability scan results and remediation tracking',
      collectedBy: 'Security Analyst'
    },
    {
      type: 'Patch Management Log',
      title: 'System Patching Records',
      description: 'Log of security patches applied across infrastructure',
      collectedBy: 'Operations Team'
    }
  ];
  
  vulnMgmtEvidence.forEach(evidence => {
    const evidenceId = matrix.addEvidence('A.12.6.1', evidence);
    console.log(`Added evidence: ${evidence.title} (ID: ${evidenceId})`);
  });
  
  console.log(`\nTotal evidence items: ${matrix.evidence.size}\n`);
  
  // Example 3: Perform Control Assessments
  console.log('3. Control Assessments:');
  console.log('----------------------');
  
  // Assess multiple controls with different outcomes
  const assessments = [
    {
      controlId: 'CC1.1',
      status: 'Compliant',
      assessor: 'Senior Auditor',
      findings: [
        'Code of conduct exists and is properly communicated',
        'Organizational structure is well-documented',
        'Clear reporting lines established'
      ],
      remediation: [],
      riskRating: 'Low',
      notes: 'Control operating effectively with strong governance framework'
    },
    {
      controlId: 'CC5.1',
      status: 'Partially Compliant',
      assessor: 'Security Auditor',
      findings: [
        'Access control policies exist and are documented',
        'Technical controls implemented but missing some monitoring',
        'Physical security adequate but needs improvement'
      ],
      remediation: [
        'Implement comprehensive access logging and monitoring',
        'Enhance physical security controls at data center',
        'Conduct quarterly access reviews'
      ],
      riskRating: 'Medium',
      dueDate: '2024-06-30T23:59:59.000Z',
      notes: 'Good foundation but needs enhancement in monitoring and physical controls'
    },
    {
      controlId: 'A.9.1.1',
      status: 'Compliant',
      assessor: 'ISO 27001 Lead Auditor',
      findings: [
        'Access control policy comprehensively covers all requirements',
        'Policy approved by senior management and regularly reviewed',
        'Effective communication to all staff members'
      ],
      remediation: [],
      riskRating: 'Low',
      notes: 'Excellent implementation of access control policy framework'
    },
    {
      controlId: 'A.12.6.1',
      status: 'Non-Compliant',
      assessor: 'Technical Security Auditor',
      findings: [
        'Vulnerability scanning not performed regularly',
        'Patch management process inconsistent',
        'No formal vulnerability assessment program'
      ],
      remediation: [
        'Implement automated monthly vulnerability scanning',
        'Establish formal patch management procedures',
        'Create vulnerability assessment and remediation workflow',
        'Assign dedicated security analyst for vulnerability management'
      ],
      riskRating: 'High',
      dueDate: '2024-04-30T23:59:59.000Z',
      notes: 'Critical gap in vulnerability management requires immediate attention'
    },
    {
      controlId: 'A.18.1.4',
      status: 'Compliant',
      assessor: 'Privacy Officer',
      findings: [
        'Privacy policy comprehensive and up-to-date',
        'PII handling procedures well-documented',
        'Data subject rights properly supported'
      ],
      remediation: [],
      riskRating: 'Low',
      notes: 'Strong privacy and PII protection framework in place'
    }
  ];
  
  assessments.forEach(assessment => {
    const assessmentId = matrix.assessControl(assessment.controlId, assessment);
    const control = matrix.controls.get(assessment.controlId);
    
    console.log(`${assessment.controlId} (${control.title}):`);
    console.log(`  Status: ${assessment.status}`);
    console.log(`  Risk Rating: ${assessment.riskRating}`);
    console.log(`  Assessor: ${assessment.assessor}`);
    console.log(`  Findings: ${assessment.findings.length}`);
    console.log(`  Remediation Items: ${assessment.remediation.length}`);
    if (assessment.dueDate) {
      console.log(`  Due Date: ${new Date(assessment.dueDate).toLocaleDateString()}`);
    }
    console.log(`  Assessment ID: ${assessmentId}`);
    console.log('');
  });
  
  // Example 4: Control Mapping Analysis
  console.log('4. Control Mapping Analysis:');
  console.log('---------------------------');
  
  // Analyze mappings between frameworks
  const mappingExamples = ['CC5.1', 'A.9.1.1'];
  
  mappingExamples.forEach(controlId => {
    const mapping = matrix.getControlMapping(controlId);
    const framework = controlId.startsWith('CC') ? 'SOC2' : 'ISO 27001';
    const targetFramework = controlId.startsWith('CC') ? 'ISO 27001' : 'SOC2';
    
    console.log(`${framework} Control: ${mapping.control.id} - ${mapping.control.title}`);
    console.log(`Category: ${mapping.control.category}`);
    console.log(`Risk Level: ${mapping.control.riskLevel}`);
    console.log(`Status: ${mapping.control.status}`);
    
    const targetMappings = mapping.mappedControls.filter(m => m.framework === targetFramework);
    if (targetMappings.length > 0) {
      console.log(`${targetFramework} Mappings:`);
      targetMappings.forEach(mapped => {
        console.log(`  - ${mapped.controlId}: ${mapped.title}`);
      });
    }
    console.log('');
  });
  
  // Example 5: Comprehensive Compliance Report
  console.log('5. Compliance Dashboard Report:');
  console.log('------------------------------');
  
  const report = matrix.generateComplianceReport();
  
  console.log('COMPLIANCE SUMMARY:');
  console.log(`  Overall Compliance: ${report.summary.compliancePercentage}%`);
  console.log(`  Risk Score: ${report.summary.riskScore}/100`);
  console.log(`  Total Controls: ${report.summary.totalControls}`);
  console.log(`  Compliant: ${report.summary.compliantControls}`);
  console.log(`  Non-Compliant: ${report.summary.nonCompliantControls}`);
  console.log(`  Partially Compliant: ${report.summary.partiallyCompliantControls}`);
  console.log(`  Not Assessed: ${report.summary.notAssessedControls}`);
  console.log(`  Evidence Items: ${report.summary.totalEvidence}`);
  console.log('');
  
  console.log('RISK BREAKDOWN:');
  console.log(`  Critical Risk Issues: ${report.riskBreakdown.critical}`);
  console.log(`  High Risk Issues: ${report.riskBreakdown.high}`);
  console.log(`  Medium Risk Issues: ${report.riskBreakdown.medium}`);
  console.log(`  Low Risk Issues: ${report.riskBreakdown.low}`);
  console.log('');
  
  console.log('FRAMEWORK COVERAGE:');
  console.log(`  SOC2: ${report.frameworkCoverage.soc2.compliant}/${report.frameworkCoverage.soc2.total} compliant (${Math.round(report.frameworkCoverage.soc2.compliant / report.frameworkCoverage.soc2.total * 100)}%)`);
  console.log(`  ISO 27001: ${report.frameworkCoverage.iso27001.compliant}/${report.frameworkCoverage.iso27001.total} compliant (${Math.round(report.frameworkCoverage.iso27001.compliant / report.frameworkCoverage.iso27001.total * 100)}%)`);
  console.log('');
  
  if (report.overdueAssessments.length > 0) {
    console.log(`OVERDUE ASSESSMENTS (${report.overdueAssessments.length}):`);
    report.overdueAssessments.slice(0, 5).forEach(overdue => {
      console.log(`  - ${overdue.controlId}: ${overdue.title} (${overdue.daysOverdue} days overdue)`);
    });
    console.log('');
  }
  
  console.log('RECENT ASSESSMENTS:');
  report.recentAssessments.slice(0, 5).forEach(assessment => {
    const assessmentDate = new Date(assessment.assessmentDate).toLocaleDateString();
    console.log(`  - ${assessment.controlId}: ${assessment.status} (${assessmentDate}) by ${assessment.assessor}`);
  });
  console.log('');
  
  // Example 6: Export Compliance Data
  console.log('6. Export Compliance Data:');
  console.log('-------------------------');
  
  // Create output directory
  const outputDir = path.join(__dirname, 'compliance-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // Export as JSON
    const jsonExport = matrix.exportMatrix('json');
    const jsonPath = path.join(outputDir, 'compliance-matrix.json');
    fs.writeFileSync(jsonPath, jsonExport);
    console.log(`JSON export saved: ${jsonPath}`);
    console.log(`  File size: ${fs.statSync(jsonPath).size} bytes`);
    
    // Export as CSV
    const csvExport = matrix.exportMatrix('csv');
    const csvPath = path.join(outputDir, 'compliance-matrix.csv');
    fs.writeFileSync(csvPath, csvExport);
    console.log(`CSV export saved: ${csvPath}`);
    console.log(`  File size: ${fs.statSync(csvPath).size} bytes`);
    
    // Export detailed report
    const reportPath = path.join(outputDir, 'compliance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Detailed report saved: ${reportPath}`);
    
    console.log(`\nAll compliance data exported to: ${outputDir}`);
    
  } catch (error) {
    console.error(`Export error: ${error.message}`);
  }
  
  // Example 7: Compliance Trend Analysis
  console.log('\n7. Compliance Progress Simulation:');
  console.log('---------------------------------');
  
  console.log('Simulating compliance improvement over time...\n');
  
  // Simulate follow-up assessments showing improvement
  const followUpAssessments = [
    {
      controlId: 'CC5.1',
      status: 'Compliant',
      assessor: 'Follow-up Auditor',
      findings: [
        'Access logging and monitoring implemented successfully',
        'Physical security controls enhanced',
        'Quarterly access reviews established'
      ],
      remediation: [],
      riskRating: 'Low',
      notes: 'All remediation items completed successfully'
    },
    {
      controlId: 'A.12.6.1',
      status: 'Partially Compliant',
      assessor: 'Technical Security Auditor',
      findings: [
        'Automated vulnerability scanning implemented',
        'Patch management procedures documented',
        'Security analyst assigned but workflow needs refinement'
      ],
      remediation: [
        'Finalize vulnerability assessment workflow',
        'Complete staff training on new procedures'
      ],
      riskRating: 'Medium',
      notes: 'Significant progress made, minor refinements needed'
    }
  ];
  
  followUpAssessments.forEach(assessment => {
    matrix.assessControl(assessment.controlId, assessment);
    console.log(`Updated ${assessment.controlId}: ${assessment.status}`);
  });
  
  // Generate updated report
  const updatedReport = matrix.generateComplianceReport();
  
  console.log('\nUPDATED COMPLIANCE SUMMARY:');
  console.log(`  Overall Compliance: ${updatedReport.summary.compliancePercentage}% (was ${report.summary.compliancePercentage}%)`);
  console.log(`  Risk Score: ${updatedReport.summary.riskScore}/100 (was ${report.summary.riskScore}/100)`);
  console.log(`  Compliant Controls: ${updatedReport.summary.compliantControls} (was ${report.summary.compliantControls})`);
  console.log(`  Non-Compliant Controls: ${updatedReport.summary.nonCompliantControls} (was ${report.summary.nonCompliantControls})`);
  
  const improvement = updatedReport.summary.compliancePercentage - report.summary.compliancePercentage;
  const riskReduction = report.summary.riskScore - updatedReport.summary.riskScore;
  
  console.log(`\nIMPROVEMENT METRICS:`);
  console.log(`  Compliance Improvement: +${improvement.toFixed(1)}%`);
  console.log(`  Risk Score Reduction: -${riskReduction} points`);
  console.log(`  Total Assessments: ${matrix.assessments.length}`);
  
  console.log('\n=== Compliance Demonstration Complete ===');
  console.log(`\nAll compliance data and reports available in: ${outputDir}`);
  console.log('The system demonstrates working SOC2/ISO27001 control mappings with real compliance tracking.');
}

// Run the demonstration
if (require.main === module) {
  demonstrateCompliance().catch(console.error);
}

module.exports = { demonstrateCompliance };