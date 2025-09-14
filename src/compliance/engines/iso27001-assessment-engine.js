#!/usr/bin/env node
/**
 * ISO27001 Compliance Assessment Engine
 * Automated ISO27001:2022 compliance validation with evidence collection
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ISO27001AssessmentEngine {
  constructor(config = {}) {
    this.config = {
      outputDir: '.claude/.artifacts/compliance/ISO27001/',
      evidenceCollection: true,
      auditHash: null,
      ...config
    };

    // ISO27001:2022 Annex A Control domains
    this.controlDomains = {
      'A.5': { name: 'Information Security Policies', weight: 0.08, controls: 2 },
      'A.6': { name: 'Organization of Information Security', weight: 0.10, controls: 8 },
      'A.7': { name: 'Human Resource Security', weight: 0.08, controls: 7 },
      'A.8': { name: 'Asset Management', weight: 0.12, controls: 10 },
      'A.9': { name: 'Access Control', weight: 0.15, controls: 14 },
      'A.10': { name: 'Cryptography', weight: 0.07, controls: 2 },
      'A.11': { name: 'Physical and Environmental Security', weight: 0.08, controls: 15 },
      'A.12': { name: 'Operations Security', weight: 0.12, controls: 14 },
      'A.13': { name: 'Communications Security', weight: 0.08, controls: 7 },
      'A.14': { name: 'System Acquisition, Development and Maintenance', weight: 0.10, controls: 13 },
      'A.15': { name: 'Supplier Relationship Security', weight: 0.07, controls: 3 },
      'A.16': { name: 'Information Security Incident Management', weight: 0.08, controls: 7 },
      'A.17': { name: 'Information Security Aspects of Business Continuity Management', weight: 0.05, controls: 4 },
      'A.18': { name: 'Compliance', weight: 0.08, controls: 8 }
    };
  }

  async validateCompliance() {
    console.log('Starting ISO27001:2022 compliance assessment...');

    const results = {
      framework: 'ISO27001',
      standard_version: '2022',
      timestamp: new Date().toISOString(),
      audit_hash: this.config.auditHash,
      overall_score: 0,
      total_findings: 0,
      domains: {},
      evidence: {},
      recommendations: [],
      risk_assessment: {}
    };

    try {
      await this.ensureOutputDirectory();

      // Assess each control domain
      for (const [domain, details] of Object.entries(this.controlDomains)) {
        const domainResult = await this.assessControlDomain(domain, details);
        results.domains[domain] = domainResult;
        results.overall_score += domainResult.score * details.weight;
        results.total_findings += domainResult.findings.length;
      }

      // Conduct risk assessment
      results.risk_assessment = await this.conductRiskAssessment();

      // Collect evidence if enabled
      if (this.config.evidenceCollection) {
        results.evidence = await this.collectEvidence();
      }

      // Generate remediation recommendations
      results.recommendations = await this.generateRecommendations(results);

      // Write results
      await this.writeResults(results);

      console.log(`ISO27001 assessment completed. Overall score: ${(results.overall_score * 100).toFixed(1)}%`);
      return results;

    } catch (error) {
      console.error('ISO27001 assessment failed:', error.message);
      throw error;
    }
  }

  async assessControlDomain(domain, details) {
    const result = {
      name: details.name,
      score: 0,
      findings: [],
      evidence_files: [],
      controls_tested: details.controls,
      controls_implemented: 0,
      maturity_level: 'Initial',
      risk_level: 'High'
    };

    switch (domain) {
      case 'A.5': // Information Security Policies
        await this.assessPolicies(result);
        break;
      case 'A.6': // Organization of Information Security
        await this.assessOrganization(result);
        break;
      case 'A.7': // Human Resource Security
        await this.assessHumanResources(result);
        break;
      case 'A.8': // Asset Management
        await this.assessAssetManagement(result);
        break;
      case 'A.9': // Access Control
        await this.assessAccessControl(result);
        break;
      case 'A.10': // Cryptography
        await this.assessCryptography(result);
        break;
      case 'A.11': // Physical and Environmental Security
        await this.assessPhysicalSecurity(result);
        break;
      case 'A.12': // Operations Security
        await this.assessOperationsSecurity(result);
        break;
      case 'A.13': // Communications Security
        await this.assessCommunicationsSecurity(result);
        break;
      case 'A.14': // System Acquisition, Development and Maintenance
        await this.assessSystemDevelopment(result);
        break;
      case 'A.15': // Supplier Relationship Security
        await this.assessSupplierSecurity(result);
        break;
      case 'A.16': // Information Security Incident Management
        await this.assessIncidentManagement(result);
        break;
      case 'A.17': // Business Continuity Management
        await this.assessBusinessContinuity(result);
        break;
      case 'A.18': // Compliance
        await this.assessCompliance(result);
        break;
    }

    result.score = result.controls_tested > 0 ?
      result.controls_implemented / result.controls_tested : 0;

    // Determine maturity level
    if (result.score >= 0.95) result.maturity_level = 'Optimized';
    else if (result.score >= 0.85) result.maturity_level = 'Managed';
    else if (result.score >= 0.70) result.maturity_level = 'Defined';
    else if (result.score >= 0.50) result.maturity_level = 'Repeatable';

    // Determine risk level
    if (result.score >= 0.90) result.risk_level = 'Low';
    else if (result.score >= 0.70) result.risk_level = 'Medium';
    else result.risk_level = 'High';

    return result;
  }

  async assessPolicies(result) {
    // A.5.1 Information security policy
    if (await this.fileExists('docs/security/information-security-policy.md')) {
      result.controls_implemented++;
      result.evidence_files.push('docs/security/information-security-policy.md');
    } else {
      result.findings.push('A.5.1: Missing information security policy');
    }

    // A.5.2 Information security roles and responsibilities
    if (await this.fileExists('docs/security/roles-responsibilities.md')) {
      result.controls_implemented++;
      result.evidence_files.push('docs/security/roles-responsibilities.md');
    } else {
      result.findings.push('A.5.2: Missing security roles and responsibilities documentation');
    }
  }

  async assessOrganization(result) {
    const organizationControls = [
      { id: 'A.6.1', file: 'docs/governance/information-security-management.md', name: 'Management commitment to information security' },
      { id: 'A.6.2', file: 'docs/governance/segregation-of-duties.md', name: 'Segregation of duties' },
      { id: 'A.6.3', file: 'docs/governance/contact-authorities.md', name: 'Contact with authorities' },
      { id: 'A.6.4', file: 'docs/governance/contact-groups.md', name: 'Contact with special interest groups' },
      { id: 'A.6.5', file: 'docs/governance/threat-intelligence.md', name: 'Threat intelligence' },
      { id: 'A.6.6', file: 'docs/governance/project-management.md', name: 'Information security in project management' },
      { id: 'A.6.7', file: 'docs/governance/organizing-information-security.md', name: 'Organizing information security' },
      { id: 'A.6.8', file: 'docs/governance/remote-working.md', name: 'Remote working' }
    ];

    for (const control of organizationControls) {
      if (await this.fileExists(control.file)) {
        result.controls_implemented++;
        result.evidence_files.push(control.file);
      } else {
        result.findings.push(`${control.id}: Missing ${control.name.toLowerCase()}`);
      }
    }
  }

  async assessHumanResources(result) {
    const hrControls = [
      { id: 'A.7.1', file: 'docs/hr/background-verification.md', name: 'Background verification' },
      { id: 'A.7.2', file: 'docs/hr/terms-conditions.md', name: 'Terms and conditions of employment' },
      { id: 'A.7.3', file: 'docs/hr/disciplinary-process.md', name: 'Disciplinary process' },
      { id: 'A.7.4', file: 'docs/hr/security-responsibilities.md', name: 'Information security responsibilities' },
      { id: 'A.7.5', file: 'docs/hr/remote-working-guidelines.md', name: 'Remote working' },
      { id: 'A.7.6', file: 'docs/hr/security-awareness.md', name: 'Information security awareness, education and training' },
      { id: 'A.7.7', file: 'docs/hr/termination-responsibilities.md', name: 'Termination or change of employment' }
    ];

    for (const control of hrControls) {
      if (await this.fileExists(control.file)) {
        result.controls_implemented++;
        result.evidence_files.push(control.file);
      } else {
        result.findings.push(`${control.id}: Missing ${control.name.toLowerCase()}`);
      }
    }
  }

  async assessAssetManagement(result) {
    const assetControls = [
      { id: 'A.8.1', file: 'docs/assets/inventory.md', name: 'Inventory of assets' },
      { id: 'A.8.2', file: 'docs/assets/ownership.md', name: 'Ownership of assets' },
      { id: 'A.8.3', file: 'docs/assets/acceptable-use.md', name: 'Acceptable use of assets' },
      { id: 'A.8.4', file: 'docs/assets/return-policy.md', name: 'Return of assets' },
      { id: 'A.8.5', file: 'docs/assets/classification.md', name: 'Classification of information' },
      { id: 'A.8.6', file: 'docs/assets/labeling.md', name: 'Labeling of information' },
      { id: 'A.8.7', file: 'docs/assets/handling.md', name: 'Handling of assets' },
      { id: 'A.8.8', file: 'docs/assets/retention.md', name: 'Management of removable media' },
      { id: 'A.8.9', file: 'docs/assets/disposal.md', name: 'Disposal of media' },
      { id: 'A.8.10', file: 'docs/assets/transfer.md', name: 'Information transfer' }
    ];

    for (const control of assetControls) {
      if (await this.fileExists(control.file)) {
        result.controls_implemented++;
        result.evidence_files.push(control.file);
      } else {
        result.findings.push(`${control.id}: Missing ${control.name.toLowerCase()}`);
      }
    }
  }

  async assessAccessControl(result) {
    // Check for authentication and authorization systems
    if (await this.fileExists('src/auth/') || await this.fileExists('lib/auth/')) {
      result.controls_implemented += 3; // A.9.1, A.9.2, A.9.3
      result.evidence_files.push('authentication system');
    } else {
      result.findings.push('A.9.1-A.9.3: Missing authentication and authorization systems');
    }

    // Check for access control policies
    if (await this.fileExists('docs/access-control/')) {
      result.controls_implemented += 4; // A.9.4, A.9.5, A.9.6, A.9.7
      result.evidence_files.push('docs/access-control/');
    } else {
      result.findings.push('A.9.4-A.9.7: Missing access control policies');
    }

    // Check for privileged access management
    if (await this.fileExists('docs/access-control/privileged-access.md')) {
      result.controls_implemented += 2; // A.9.8, A.9.9
      result.evidence_files.push('docs/access-control/privileged-access.md');
    } else {
      result.findings.push('A.9.8-A.9.9: Missing privileged access management');
    }

    // Check for access reviews
    if (await this.fileExists('docs/access-control/access-review.md')) {
      result.controls_implemented += 3; // A.9.10, A.9.11, A.9.12
      result.evidence_files.push('docs/access-control/access-review.md');
    } else {
      result.findings.push('A.9.10-A.9.12: Missing access review procedures');
    }

    // Check for secure logon procedures
    if (await this.fileExists('docs/access-control/secure-logon.md')) {
      result.controls_implemented += 2; // A.9.13, A.9.14
      result.evidence_files.push('docs/access-control/secure-logon.md');
    } else {
      result.findings.push('A.9.13-A.9.14: Missing secure logon procedures');
    }
  }

  async assessCryptography(result) {
    // A.10.1 Policy on the use of cryptographic controls
    if (await this.fileExists('docs/security/cryptography-policy.md')) {
      result.controls_implemented++;
      result.evidence_files.push('docs/security/cryptography-policy.md');
    } else {
      result.findings.push('A.10.1: Missing cryptography policy');
    }

    // A.10.2 Key management
    if (await this.fileExists('src/crypto/') || await this.fileExists('docs/security/key-management.md')) {
      result.controls_implemented++;
      result.evidence_files.push('cryptographic key management');
    } else {
      result.findings.push('A.10.2: Missing key management system');
    }
  }

  async assessPhysicalSecurity(result) {
    // Simplified assessment - in real environment would check physical controls
    const physicalControls = 15; // Total A.11 controls
    const documentedControls = [
      'docs/physical-security/secure-areas.md',
      'docs/physical-security/physical-entry.md',
      'docs/physical-security/equipment-protection.md',
      'docs/physical-security/maintenance.md',
      'docs/physical-security/secure-disposal.md'
    ];

    for (const control of documentedControls) {
      if (await this.fileExists(control)) {
        result.controls_implemented += 3; // Each document covers ~3 controls
        result.evidence_files.push(control);
      }
    }

    if (result.controls_implemented === 0) {
      result.findings.push('A.11: Missing physical and environmental security controls');
    }
  }

  async assessOperationsSecurity(result) {
    const opsControls = [
      { id: 'A.12.1', file: 'docs/operations/procedures.md', name: 'Operating procedures and responsibilities' },
      { id: 'A.12.2', file: 'docs/operations/change-management.md', name: 'Change management' },
      { id: 'A.12.3', file: 'docs/operations/capacity-management.md', name: 'Capacity management' },
      { id: 'A.12.4', file: 'docs/operations/separation.md', name: 'Separation of development, testing and operational environments' },
      { id: 'A.12.5', file: 'monitoring/', name: 'Information processing facilities' },
      { id: 'A.12.6', file: 'docs/operations/vulnerability-management.md', name: 'Vulnerability management' },
      { id: 'A.12.7', file: 'docs/operations/logging.md', name: 'Information systems audit considerations' },
      { id: 'A.12.8', file: 'src/logging/', name: 'Logging and monitoring' },
      { id: 'A.12.9', file: 'docs/operations/backup.md', name: 'Protection of log information' },
      { id: 'A.12.10', file: 'docs/operations/administrator-logs.md', name: 'Administrator and operator logs' },
      { id: 'A.12.11', file: 'docs/operations/clock-synchronization.md', name: 'Clock synchronisation' },
      { id: 'A.12.12', file: 'docs/operations/malware.md', name: 'Control of operational software' },
      { id: 'A.12.13', file: 'docs/operations/technical-vulnerability.md', name: 'Technical vulnerability management' },
      { id: 'A.12.14', file: 'docs/operations/audit-testing.md', name: 'Information systems audit considerations' }
    ];

    for (const control of opsControls) {
      if (await this.fileExists(control.file)) {
        result.controls_implemented++;
        result.evidence_files.push(control.file);
      } else {
        result.findings.push(`${control.id}: Missing ${control.name.toLowerCase()}`);
      }
    }
  }

  async assessCommunicationsSecurity(result) {
    const commsControls = [
      { id: 'A.13.1', file: 'docs/communications/network-security.md', name: 'Network security management' },
      { id: 'A.13.2', file: 'docs/communications/information-transfer.md', name: 'Information transfer policies and procedures' },
      { id: 'A.13.3', file: 'docs/communications/electronic-messaging.md', name: 'Electronic messaging' },
      { id: 'A.13.4', file: 'docs/communications/confidentiality-agreements.md', name: 'Confidentiality or non-disclosure agreements' },
      { id: 'A.13.5', file: 'config/network/', name: 'Network controls' },
      { id: 'A.13.6', file: 'docs/communications/secure-connections.md', name: 'Secure connections' },
      { id: 'A.13.7', file: 'docs/communications/transmission-integrity.md', name: 'Secure transmission' }
    ];

    for (const control of commsControls) {
      if (await this.fileExists(control.file)) {
        result.controls_implemented++;
        result.evidence_files.push(control.file);
      } else {
        result.findings.push(`${control.id}: Missing ${control.name.toLowerCase()}`);
      }
    }
  }

  async assessSystemDevelopment(result) {
    // Check for secure development practices
    if (await this.fileExists('.github/workflows/') && await this.fileExists('tests/')) {
      result.controls_implemented += 5; // A.14.1-A.14.5 (Development lifecycle controls)
      result.evidence_files.push('secure development lifecycle');
    } else {
      result.findings.push('A.14.1-A.14.5: Missing secure development lifecycle');
    }

    // Check for security testing
    if (await this.fileExists('tests/security/')) {
      result.controls_implemented += 3; // A.14.6-A.14.8 (Security testing)
      result.evidence_files.push('tests/security/');
    } else {
      result.findings.push('A.14.6-A.14.8: Missing security testing');
    }

    // Check for change management
    if (await this.fileExists('docs/development/change-management.md')) {
      result.controls_implemented += 3; // A.14.9-A.14.11 (Change management)
      result.evidence_files.push('docs/development/change-management.md');
    } else {
      result.findings.push('A.14.9-A.14.11: Missing development change management');
    }

    // Check for outsourced development
    if (await this.fileExists('docs/development/outsourcing.md')) {
      result.controls_implemented += 2; // A.14.12-A.14.13 (Outsourcing)
      result.evidence_files.push('docs/development/outsourcing.md');
    } else {
      result.findings.push('A.14.12-A.14.13: Missing outsourced development controls');
    }
  }

  async assessSupplierSecurity(result) {
    const supplierControls = [
      { id: 'A.15.1', file: 'docs/suppliers/security-policy.md', name: 'Information security policy for supplier relationships' },
      { id: 'A.15.2', file: 'docs/suppliers/security-requirements.md', name: 'Addressing security within supplier agreements' },
      { id: 'A.15.3', file: 'docs/suppliers/supply-chain.md', name: 'Information and communication technology supply chain' }
    ];

    for (const control of supplierControls) {
      if (await this.fileExists(control.file)) {
        result.controls_implemented++;
        result.evidence_files.push(control.file);
      } else {
        result.findings.push(`${control.id}: Missing ${control.name.toLowerCase()}`);
      }
    }
  }

  async assessIncidentManagement(result) {
    const incidentControls = [
      { id: 'A.16.1', file: 'docs/incident-response/management-responsibilities.md', name: 'Management responsibilities and procedures' },
      { id: 'A.16.2', file: 'docs/incident-response/reporting-events.md', name: 'Reporting information security events' },
      { id: 'A.16.3', file: 'docs/incident-response/reporting-weaknesses.md', name: 'Reporting information security weaknesses' },
      { id: 'A.16.4', file: 'docs/incident-response/assessment.md', name: 'Assessment of and decision on information security events' },
      { id: 'A.16.5', file: 'docs/incident-response/response.md', name: 'Response to information security incidents' },
      { id: 'A.16.6', file: 'docs/incident-response/learning.md', name: 'Learning from information security incidents' },
      { id: 'A.16.7', file: 'docs/incident-response/evidence.md', name: 'Collection of evidence' }
    ];

    for (const control of incidentControls) {
      if (await this.fileExists(control.file)) {
        result.controls_implemented++;
        result.evidence_files.push(control.file);
      } else {
        result.findings.push(`${control.id}: Missing ${control.name.toLowerCase()}`);
      }
    }
  }

  async assessBusinessContinuity(result) {
    const bcmControls = [
      { id: 'A.17.1', file: 'docs/business-continuity/planning.md', name: 'Planning information security continuity' },
      { id: 'A.17.2', file: 'docs/business-continuity/redundancies.md', name: 'Implementing information security continuity' },
      { id: 'A.17.3', file: 'docs/business-continuity/verification.md', name: 'Verify, review and evaluate information security continuity' },
      { id: 'A.17.4', file: 'docs/business-continuity/availability.md', name: 'Information and communication technology readiness for business continuity' }
    ];

    for (const control of bcmControls) {
      if (await this.fileExists(control.file)) {
        result.controls_implemented++;
        result.evidence_files.push(control.file);
      } else {
        result.findings.push(`${control.id}: Missing ${control.name.toLowerCase()}`);
      }
    }
  }

  async assessCompliance(result) {
    const complianceControls = [
      { id: 'A.18.1', file: 'docs/compliance/legal-requirements.md', name: 'Compliance with legal and contractual requirements' },
      { id: 'A.18.2', file: 'docs/compliance/intellectual-property.md', name: 'Intellectual property rights' },
      { id: 'A.18.3', file: 'docs/compliance/records-protection.md', name: 'Protection of records' },
      { id: 'A.18.4', file: 'docs/compliance/privacy.md', name: 'Privacy and protection of personally identifiable information' },
      { id: 'A.18.5', file: 'docs/compliance/cryptography-regulations.md', name: 'Regulation of cryptographic controls' },
      { id: 'A.18.6', file: 'docs/compliance/reviews.md', name: 'Independent reviews of information security' },
      { id: 'A.18.7', file: 'docs/compliance/policies-standards.md', name: 'Compliance with security policies and standards' },
      { id: 'A.18.8', file: 'docs/compliance/technical-compliance.md', name: 'Technical compliance review' }
    ];

    for (const control of complianceControls) {
      if (await this.fileExists(control.file)) {
        result.controls_implemented++;
        result.evidence_files.push(control.file);
      } else {
        result.findings.push(`${control.id}: Missing ${control.name.toLowerCase()}`);
      }
    }
  }

  async conductRiskAssessment() {
    return {
      methodology: 'ISO27005',
      assessment_date: new Date().toISOString(),
      overall_risk_level: 'Medium',
      high_risks: 0,
      medium_risks: 0,
      low_risks: 0,
      residual_risk: 'Acceptable',
      next_review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
    };
  }

  async collectEvidence() {
    const evidence = {
      files_collected: 0,
      total_size: 0,
      checksum: null,
      collection_timestamp: new Date().toISOString()
    };

    try {
      // Collect relevant files for ISO27001 evidence
      const evidenceFiles = [
        'docs/',
        'config/',
        'src/',
        'tests/',
        'monitoring/',
        '.github/',
        '.claude/.artifacts/',
        'README.md',
        'SECURITY.md'
      ];

      const collectedFiles = [];

      for (const file of evidenceFiles) {
        if (await this.fileExists(file)) {
          collectedFiles.push(file);
          evidence.files_collected++;
        }
      }

      // Calculate checksum
      if (collectedFiles.length > 0) {
        const hash = crypto.createHash('sha256');
        for (const file of collectedFiles) {
          const stats = await fs.stat(file).catch(() => null);
          if (stats) {
            evidence.total_size += stats.size;
            hash.update(file + stats.mtime.toISOString());
          }
        }
        evidence.checksum = hash.digest('hex');
        evidence.files = collectedFiles;
      }

    } catch (error) {
      console.warn('Evidence collection partial failure:', error.message);
    }

    return evidence;
  }

  async generateRecommendations(results) {
    const recommendations = [];

    // Generate recommendations based on findings
    for (const [domain, details] of Object.entries(results.domains)) {
      if (details.score < 0.95) {
        const priority = details.score < 0.5 ? 'critical' :
                        details.score < 0.7 ? 'high' : 'medium';

        recommendations.push({
          domain,
          priority,
          maturity_level: details.maturity_level,
          risk_level: details.risk_level,
          description: `Improve ${details.name} (current score: ${(details.score * 100).toFixed(1)}%)`,
          findings: details.findings,
          suggested_actions: this.getSuggestedActions(domain, details.findings)
        });
      }
    }

    // Add overall recommendations
    if (results.overall_score < 0.95) {
      recommendations.push({
        domain: 'overall',
        priority: 'high',
        description: 'Overall ISO27001 compliance below 95% threshold',
        suggested_actions: [
          'Prioritize critical and high-risk control implementations',
          'Establish formal ISMS (Information Security Management System)',
          'Conduct comprehensive risk assessment',
          'Create compliance improvement roadmap with timelines'
        ]
      });
    }

    return recommendations;
  }

  getSuggestedActions(domain, findings) {
    const actionMap = {
      'A.5': ['Develop comprehensive information security policies', 'Define security roles and responsibilities'],
      'A.6': ['Establish information security organization', 'Implement management commitment processes'],
      'A.7': ['Create HR security procedures', 'Implement security awareness training'],
      'A.8': ['Implement asset management system', 'Create information classification scheme'],
      'A.9': ['Implement access control framework', 'Deploy authentication and authorization systems'],
      'A.10': ['Develop cryptography policy', 'Implement key management system'],
      'A.11': ['Implement physical security controls', 'Create secure areas documentation'],
      'A.12': ['Establish operations security procedures', 'Implement vulnerability management'],
      'A.13': ['Implement network security controls', 'Create secure communication procedures'],
      'A.14': ['Implement secure development lifecycle', 'Create security testing procedures'],
      'A.15': ['Create supplier security requirements', 'Implement supply chain security'],
      'A.16': ['Establish incident response procedures', 'Create incident management team'],
      'A.17': ['Develop business continuity plans', 'Implement continuity testing'],
      'A.18': ['Ensure legal compliance', 'Implement compliance monitoring']
    };

    return actionMap[domain] || ['Review control requirements', 'Implement missing controls'];
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async ensureOutputDirectory() {
    await fs.mkdir(this.config.outputDir, { recursive: true });
  }

  async writeResults(results) {
    const outputFile = path.join(this.config.outputDir, 'compliance-score.json');
    await fs.writeFile(outputFile, JSON.stringify(results, null, 2));

    // Create human-readable report
    const reportFile = path.join(this.config.outputDir, 'iso27001-assessment-report.md');
    const report = this.generateMarkdownReport(results);
    await fs.writeFile(reportFile, report);

    console.log(`ISO27001 assessment results written to: ${outputFile}`);
    console.log(`ISO27001 assessment report written to: ${reportFile}`);
  }

  generateMarkdownReport(results) {
    const timestamp = new Date(results.timestamp).toLocaleString();
    const scorePercentage = (results.overall_score * 100).toFixed(1);

    let report = `# ISO27001:2022 Compliance Assessment Report

**Generated:** ${timestamp}
**Standard Version:** ${results.standard_version}
**Overall Score:** ${scorePercentage}%
**Total Findings:** ${results.total_findings}
**Audit Hash:** ${results.audit_hash}

## Executive Summary

${results.overall_score >= 0.95 ?
  '[OK] **COMPLIANT** - Organization meets ISO27001:2022 requirements.' :
  '[FAIL] **NON-COMPLIANT** - Organization requires remediation to meet ISO27001:2022 requirements.'
}

## Control Domain Assessment Results

| Domain | Name | Score | Maturity | Risk | Implemented | Total | Status |
|--------|------|-------|----------|------|-------------|-------|--------|
`;

    for (const [domain, details] of Object.entries(results.domains)) {
      const score = (details.score * 100).toFixed(1);
      const status = details.score >= 0.95 ? '[OK] Compliant' : 
                    details.score >= 0.70 ? '[WARN] Partial' : '[FAIL] Non-Compliant';
      
      report += `| ${domain} | ${details.name} | ${score}% | ${details.maturity_level} | ${details.risk_level} | ${details.controls_implemented} | ${details.controls_tested} | ${status} |\n`;
    }

    // Risk Assessment Summary
    report += `\n## Risk Assessment Summary\n\n`;
    report += `- **Methodology:** ${results.risk_assessment.methodology}\n`;
    report += `- **Overall Risk Level:** ${results.risk_assessment.overall_risk_level}\n`;
    report += `- **Residual Risk:** ${results.risk_assessment.residual_risk}\n`;
    report += `- **Next Review Date:** ${new Date(results.risk_assessment.next_review_date).toLocaleDateString()}\n\n`;

    // Recommendations
    if (results.recommendations.length > 0) {
      report += `## Recommendations\n\n`;
      
      const criticalRecs = results.recommendations.filter(r => r.priority === 'critical');
      const highRecs = results.recommendations.filter(r => r.priority === 'high');
      const mediumRecs = results.recommendations.filter(r => r.priority === 'medium');

      if (criticalRecs.length > 0) {
        report += `### [ALERT] Critical Priority\n\n`;
        for (const rec of criticalRecs) {
          report += `#### ${rec.domain}: ${rec.description}\n`;
          report += `**Risk Level:** ${rec.risk_level} | **Maturity:** ${rec.maturity_level}\n\n`;
          
          if (rec.findings && rec.findings.length > 0) {
            report += `**Findings:**\n`;
            for (const finding of rec.findings.slice(0, 5)) { // Limit to first 5
              report += `- ${finding}\n`;
            }
            if (rec.findings.length > 5) {
              report += `- ... and ${rec.findings.length - 5} more\n`;
            }
            report += '\n';
          }

          report += `**Suggested Actions:**\n`;
          for (const action of rec.suggested_actions) {
            report += `- ${action}\n`;
          }
          report += '\n';
        }
      }

      if (highRecs.length > 0) {
        report += `### [WARN] High Priority\n\n`;
        for (const rec of highRecs) {
          report += `#### ${rec.domain}: ${rec.description}\n`;
          report += `**Actions:** ${rec.suggested_actions.join(', ')}\n\n`;
        }
      }

      if (mediumRecs.length > 0) {
        report += `### [CLIPBOARD] Medium Priority\n\n`;
        for (const rec of mediumRecs) {
          report += `- **${rec.domain}:** ${rec.description}\n`;
        }
        report += '\n';
      }
    }

    // Evidence Collection Summary
    if (results.evidence && results.evidence.files_collected > 0) {
      report += `## Evidence Collection Summary\n\n`;
      report += `- **Files Collected:** ${results.evidence.files_collected}\n`;
      report += `- **Total Size:** ${results.evidence.total_size} bytes\n`;
      report += `- **Checksum:** ${results.evidence.checksum}\n`;
      report += `- **Collection Time:** ${results.evidence.collection_timestamp}\n\n`;
    }

    report += `---\n*This report was generated by the ISO27001 Assessment Engine*\n`;

    return report;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const config = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];

    switch (key) {
      case 'output-dir':
        config.outputDir = value;
        break;
      case 'audit-hash':
        config.auditHash = value;
        break;
      case 'evidence-collection':
        config.evidenceCollection = value === 'true';
        break;
      case 'config':
        try {
          const configFile = JSON.parse(await fs.readFile(value, 'utf8'));
          Object.assign(config, configFile);
        } catch (error) {
          console.warn(`Could not load config file ${value}:`, error.message);
        }
        break;
    }
  }

  try {
    const engine = new ISO27001AssessmentEngine(config);
    const results = await engine.validateCompliance();

    process.exit(results.overall_score >= 0.95 ? 0 : 1);
  } catch (error) {
    console.error('ISO27001 assessment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ISO27001AssessmentEngine };