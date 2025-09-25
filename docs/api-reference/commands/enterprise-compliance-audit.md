# /enterprise:compliance:audit

## Purpose
Generate comprehensive compliance audit reports with cryptographic evidence packaging, cross-framework mapping, and audit-ready documentation. Supports multiple compliance standards with automated evidence collection, gap analysis, and remediation tracking for enterprise audit preparation.

## Usage
/enterprise:compliance:audit [--framework=<framework>] [--output=<filename>] [--evidence-package] [--cross-framework] [--sign]

## Implementation

### 1. Audit Report Configuration

#### Comprehensive Audit Configuration:
```bash
# Configure comprehensive compliance audit parameters
configure_compliance_audit() {
    local framework="$1"
    local output_file="$2"
    local evidence_package="$3"
    local cross_framework="$4"
    local sign_flag="$5"

    # Supported audit frameworks
    local audit_frameworks=("soc2-type2" "iso27001" "nist-csf" "gdpr" "hipaa" "pci-dss" "cross-framework")

    if [[ "$framework" == "" ]]; then
        framework="soc2-type2"
    fi

    if [[ ! " ${audit_frameworks[@]} " =~ " ${framework} " ]]; then
        echo "ERROR: Unsupported audit framework '$framework'. Supported: ${audit_frameworks[*]}" >&2
        exit 1
    fi

    # Set default output file if not specified
    if [[ "$output_file" == "" ]]; then
        local timestamp=$(date +"%Y%m%d_%H%M%S")
        output_file=".claude/.artifacts/compliance/audit_report_${framework}_$timestamp"
    fi

    echo "Framework: $framework, Output: $output_file, Evidence Package: ${evidence_package:-false}, Cross-Framework: ${cross_framework:-false}, Sign: ${sign_flag:-false}"

    # Set framework-specific audit requirements
    case "$framework" in
        "soc2-type2")
            AUDIT_REQUIREMENTS=(
                "control_design_documentation"
                "control_operating_effectiveness"
                "evidence_of_monitoring"
                "management_assertions"
                "service_auditor_testing"
            )
            AUDIT_PERIOD="12_months"
            ;;
        "iso27001")
            AUDIT_REQUIREMENTS=(
                "isms_documentation"
                "risk_assessment_results"
                "treatment_plan_evidence"
                "internal_audit_results"
                "management_review_evidence"
                "continual_improvement_evidence"
            )
            AUDIT_PERIOD="annual_surveillance"
            ;;
        "cross-framework")
            AUDIT_REQUIREMENTS=(
                "framework_mapping_documentation"
                "control_overlap_analysis"
                "unified_evidence_collection"
                "gap_analysis_cross_reference"
                "consolidated_remediation_plan"
            )
            AUDIT_PERIOD="comprehensive"
            ;;
    esac

    echo "Audit requirements: ${AUDIT_REQUIREMENTS[*]}"
    echo "Audit period: $AUDIT_PERIOD"
}
```

#### Cross-Framework Control Mapping:
```javascript
const CROSS_FRAMEWORK_MAPPINGS = {
  access_control: {
    soc2: ["CC6.1", "CC6.2", "CC6.3", "CC6.6"],
    iso27001: ["A.9.1.1", "A.9.1.2", "A.9.2.1", "A.9.2.2"],
    nist_csf: ["PR.AC-1", "PR.AC-3", "PR.AC-4", "PR.AC-6"],
    control_family: "Access Management and Authentication"
  },

  risk_management: {
    soc2: ["CC3.1", "CC3.2", "CC3.3", "CC3.4"],
    iso27001: ["A.12.6.1", "A.16.1.1", "A.16.1.2", "A.16.1.4"],
    nist_csf: ["ID.RA-1", "ID.RA-2", "ID.RA-3", "ID.RA-5"],
    control_family: "Risk Assessment and Management"
  },

  incident_response: {
    soc2: ["CC7.1", "CC7.2"],
    iso27001: ["A.16.1.1", "A.16.1.2", "A.16.1.5", "A.16.1.6"],
    nist_csf: ["RS.RP-1", "RS.CO-1", "RS.AN-1", "RS.MI-1"],
    control_family: "Incident Response and Management"
  },

  data_protection: {
    soc2: ["CC6.7", "CC6.8"],
    iso27001: ["A.10.1.1", "A.10.1.2", "A.13.2.1"],
    nist_csf: ["PR.DS-1", "PR.DS-2", "PR.DS-5"],
    gdpr: ["Article 25", "Article 32"],
    control_family: "Data Protection and Privacy"
  },

  monitoring_logging: {
    soc2: ["CC7.2"],
    iso27001: ["A.12.4.1", "A.12.4.2", "A.12.4.3"],
    nist_csf: ["DE.CM-1", "DE.CM-3", "DE.AE-1"],
    control_family: "Monitoring and Logging"
  }
};

const AUDIT_EVIDENCE_TYPES = {
  design_evidence: {
    name: "Control Design Evidence",
    required_documents: [
      "policy_procedures",
      "process_flowcharts",
      "system_configurations",
      "role_responsibility_matrices"
    ],
    automation_sources: ["policy_management", "configuration_management"]
  },

  operating_evidence: {
    name: "Operating Effectiveness Evidence",
    required_documents: [
      "execution_logs",
      "monitoring_reports",
      "exception_reports",
      "remediation_tracking"
    ],
    automation_sources: ["system_logs", "monitoring_systems", "ticket_systems"]
  },

  testing_evidence: {
    name: "Independent Testing Evidence",
    required_documents: [
      "test_procedures",
      "test_results",
      "sampling_methodology",
      "deficiency_analysis"
    ],
    automation_sources: ["automated_testing", "compliance_testing"]
  }
};
```

### 2. Comprehensive Evidence Collection and Packaging

#### Automated Evidence Packaging:
```javascript
async function collectAndPackageAuditEvidence(framework, auditPeriod, evidencePackage) {
  const evidenceCollection = {
    audit_metadata: {
      framework: framework,
      audit_period: auditPeriod,
      collection_start: new Date().toISOString(),
      evidence_packages: {},
      cryptographic_hashes: {},
      chain_of_custody: []
    },
    control_evidence: {},
    supporting_documentation: {},
    automated_evidence: {},
    manual_evidence_required: []
  };

  // Get framework-specific control mappings
  const controlMappings = COMPLIANCE_CONTROL_MAPPINGS[framework];
  if (!controlMappings) {
    throw new Error(`Unsupported audit framework: ${framework}`);
  }

  // Collect evidence for each control category
  for (const [categoryId, category] of Object.entries(controlMappings.categories)) {
    evidenceCollection.control_evidence[categoryId] = {
      category_name: category.name,
      controls: {},
      evidence_summary: {
        total_evidence_items: 0,
        automated_items: 0,
        manual_items: 0,
        evidence_completeness: 0
      }
    };

    for (const control of category.controls) {
      const controlId = control.split(' - ')[0];
      const automationMappings = category.automation_mappings[controlId] || [];

      // Collect comprehensive evidence for this control
      const controlEvidence = await collectControlAuditEvidence(
        controlId,
        control,
        automationMappings,
        auditPeriod
      );

      evidenceCollection.control_evidence[categoryId].controls[controlId] = controlEvidence;

      // Update summary statistics
      const summary = evidenceCollection.control_evidence[categoryId].evidence_summary;
      summary.total_evidence_items += controlEvidence.evidence_items.length;
      summary.automated_items += controlEvidence.automated_evidence_count;
      summary.manual_items += controlEvidence.manual_evidence_count;
    }

    // Calculate evidence completeness for category
    const categoryEvidence = evidenceCollection.control_evidence[categoryId];
    const totalControls = category.controls.length;
    const controlsWithSufficientEvidence = Object.values(categoryEvidence.controls)
      .filter(c => c.evidence_sufficiency === 'sufficient').length;

    categoryEvidence.evidence_summary.evidence_completeness =
      controlsWithSufficientEvidence / totalControls;
  }

  // Create evidence packages if requested
  if (evidencePackage) {
    evidenceCollection.evidence_packages = await createEvidencePackages(
      evidenceCollection.control_evidence,
      framework
    );
  }

  // Generate chain of custody documentation
  evidenceCollection.chain_of_custody = generateChainOfCustody(evidenceCollection);

  return evidenceCollection;
}

async function collectControlAuditEvidence(controlId, controlDescription, automationMappings, auditPeriod) {
  const controlEvidence = {
    control_id: controlId,
    control_description: controlDescription,
    evidence_items: [],
    automated_evidence_count: 0,
    manual_evidence_count: 0,
    evidence_sufficiency: 'insufficient',
    audit_testing_results: {},
    deficiencies: [],
    remediation_status: {}
  };

  // Define audit period date range
  const auditEndDate = new Date();
  const auditStartDate = new Date();
  auditStartDate.setFullYear(auditStartDate.getFullYear() - 1); // 12-month audit period

  // Collect automated evidence
  for (const mapping of automationMappings) {
    try {
      const evidence = await collectAutomatedAuditEvidence(mapping, auditStartDate, auditEndDate);

      for (const item of evidence) {
        controlEvidence.evidence_items.push({
          evidence_id: generateEvidenceId(),
          source: mapping,
          type: 'automated',
          collection_method: 'system_automated',
          timestamp: item.timestamp,
          content: item.content,
          hash: await calculateEvidenceHash(item.content),
          attestation: item.attestation || null
        });
      }

      controlEvidence.automated_evidence_count += evidence.length;
    } catch (error) {
      console.error(`Failed to collect automated evidence for ${controlId}:${mapping}`, error);

      controlEvidence.deficiencies.push({
        type: 'evidence_collection_failure',
        source: mapping,
        error: error.message,
        impact: 'May require manual evidence collection',
        remediation: `Investigate automation failure for ${mapping}`
      });
    }
  }

  // Perform audit testing on collected evidence
  controlEvidence.audit_testing_results = await performAuditTesting(controlEvidence.evidence_items);

  // Assess evidence sufficiency for audit purposes
  controlEvidence.evidence_sufficiency = assessEvidenceSufficiency(
    controlEvidence.evidence_items,
    controlEvidence.audit_testing_results
  );

  // Identify manual evidence requirements
  if (controlEvidence.evidence_sufficiency !== 'sufficient') {
    const manualRequirements = determineManualEvidenceRequirements(controlId, controlEvidence);
    controlEvidence.manual_evidence_count = manualRequirements.length;

    // Add to overall manual evidence tracking
    evidenceCollection.manual_evidence_required.push({
      control_id: controlId,
      requirements: manualRequirements
    });
  }

  return controlEvidence;
}

async function createEvidencePackages(controlEvidence, framework) {
  const packages = {
    design_evidence: {
      package_id: `design-evidence-${framework}-${Date.now()}`,
      description: "Control Design Documentation Package",
      files: [],
      total_size: 0,
      hash: null
    },
    operating_evidence: {
      package_id: `operating-evidence-${framework}-${Date.now()}`,
      description: "Operating Effectiveness Evidence Package",
      files: [],
      total_size: 0,
      hash: null
    },
    testing_evidence: {
      package_id: `testing-evidence-${framework}-${Date.now()}`,
      description: "Independent Testing Evidence Package",
      files: [],
      total_size: 0,
      hash: null
    }
  };

  // Organize evidence into appropriate packages
  for (const [categoryId, category] of Object.entries(controlEvidence)) {
    for (const [controlId, control] of Object.entries(category.controls)) {
      for (const evidence of control.evidence_items) {
        const packageType = categorizeEvidenceForPackaging(evidence);

        if (packages[packageType]) {
          packages[packageType].files.push({
            filename: `${controlId}_${evidence.evidence_id}.json`,
            content: JSON.stringify(evidence, null, 2),
            size: JSON.stringify(evidence).length,
            hash: evidence.hash
          });
        }
      }
    }
  }

  // Create package files and calculate hashes
  for (const [packageType, packageInfo] of Object.entries(packages)) {
    if (packageInfo.files.length > 0) {
      // Create compressed package
      const packagePath = `.claude/.artifacts/compliance/evidence-packages/${packageInfo.package_id}.zip`;
      await createEvidenceZipPackage(packageInfo.files, packagePath);

      // Calculate package hash
      packageInfo.hash = await calculateFileHash(packagePath);
      packageInfo.total_size = packageInfo.files.reduce((sum, file) => sum + file.size, 0);
    }
  }

  return packages;
}
```

### 3. Comprehensive Audit Report Generation

#### Generate Audit-Ready Report:
```bash
# Generate comprehensive compliance audit report
generate_compliance_audit_report() {
    local framework="$1"
    local output_file="$2"
    local evidence_package="$3"
    local cross_framework="$4"
    local sign_flag="$5"

    echo "[SHIELD] Generating comprehensive audit report for $framework"

    # Create output directories
    mkdir -p .claude/.artifacts/compliance/{reports,evidence-packages,signatures}

    # Generate audit report using Python enterprise modules
    python -c "
import sys
sys.path.append('analyzer/enterprise/compliance')
from reporting import AuditReportGenerator
from audit_trail import ComprehensiveAuditTrail
from core import CrossFrameworkMapper
from crypto_signer import ComplianceSigner
import json
from datetime import datetime, timedelta
import uuid

# Initialize audit generators
audit_gen = AuditReportGenerator()
trail_gen = ComprehensiveAuditTrail()
mapper = CrossFrameworkMapper() if '$cross_framework' == 'true' else None
signer = ComplianceSigner() if '$sign_flag' == 'true' else None

# Configure audit report generation
config = {
    'framework': '$framework',
    'audit_period_months': 12,
    'evidence_packaging': '$evidence_package' == 'true',
    'cross_framework_analysis': '$cross_framework' == 'true',
    'cryptographic_signing': '$sign_flag' == 'true',
    'include_remediation_tracking': True,
    'include_management_assertions': True
}

print(f'Generating comprehensive audit report for {config[\"framework\"]}...')

# Collect comprehensive evidence
print('Collecting and packaging audit evidence...')
evidence_data = audit_gen.collect_and_package_audit_evidence(
    config['framework'],
    config['audit_period_months'],
    config['evidence_packaging']
)
print(f'Evidence collected: {sum(cat[\"evidence_summary\"][\"total_evidence_items\"] for cat in evidence_data[\"control_evidence\"].values())} items')

# Perform cross-framework mapping if requested
cross_framework_analysis = {}
if mapper:
    print('Performing cross-framework analysis...')
    cross_framework_analysis = mapper.analyze_cross_framework_compliance(evidence_data, config['framework'])
    print(f'Cross-framework mappings: {len(cross_framework_analysis.get(\"framework_mappings\", {}))} frameworks analyzed')

# Generate comprehensive audit trail
audit_trail = trail_gen.generate_comprehensive_audit_trail(
    evidence_data,
    config['framework'],
    config['audit_period_months']
)

# Perform audit readiness assessment
audit_readiness = audit_gen.assess_audit_readiness(evidence_data, config['framework'])
print(f'Audit readiness: {audit_readiness[\"overall_readiness_score\"]:.1%}')

# Create comprehensive audit report
audit_report = {
    'report_metadata': {
        'report_id': f'audit-{config[\"framework\"]}-{int(datetime.utcnow().timestamp())}',
        'framework': config['framework'],
        'audit_period_start': (datetime.utcnow() - timedelta(days=365)).isoformat() + 'Z',
        'audit_period_end': datetime.utcnow().isoformat() + 'Z',
        'report_generation_date': datetime.utcnow().isoformat() + 'Z',
        'report_version': '2.0.0',
        'prepared_by': 'SPEK Enterprise Compliance Engine',
        'report_type': 'comprehensive_audit_report'
    },

    'executive_summary': {
        'audit_opinion': audit_readiness['audit_opinion'],
        'overall_readiness_score': audit_readiness['overall_readiness_score'],
        'controls_fully_compliant': audit_readiness['fully_compliant_controls'],
        'controls_partially_compliant': audit_readiness['partially_compliant_controls'],
        'controls_non_compliant': audit_readiness['non_compliant_controls'],
        'material_weaknesses': audit_readiness['material_weaknesses'],
        'significant_deficiencies': audit_readiness['significant_deficiencies'],
        'management_response_required': len(audit_readiness['management_response_items']),
        'estimated_remediation_timeline': audit_readiness['estimated_remediation_timeline']
    },

    'detailed_control_assessment': evidence_data['control_evidence'],
    'evidence_summary': {
        'total_evidence_packages': len(evidence_data.get('evidence_packages', {})),
        'automated_evidence_percentage': audit_gen.calculate_automation_percentage(evidence_data),
        'evidence_retention_period': '7_years',
        'chain_of_custody': evidence_data.get('chain_of_custody', [])
    },

    'audit_testing_results': audit_gen.compile_audit_testing_results(evidence_data),

    'deficiencies_and_recommendations': {
        'material_weaknesses': audit_readiness['material_weaknesses'],
        'significant_deficiencies': audit_readiness['significant_deficiencies'],
        'control_deficiencies': audit_readiness['control_deficiencies'],
        'remediation_plan': audit_gen.generate_remediation_plan(audit_readiness),
        'management_action_plan': audit_readiness['management_action_plan']
    },

    'management_assertions': {
        'design_effectiveness': audit_gen.generate_design_assertion(evidence_data),
        'operating_effectiveness': audit_gen.generate_operating_assertion(evidence_data),
        'remediation_commitment': audit_gen.generate_remediation_assertion(audit_readiness),
        'continuous_monitoring': audit_gen.generate_monitoring_assertion(evidence_data)
    },

    'comprehensive_audit_trail': audit_trail,
    'audit_procedures_performed': audit_gen.document_audit_procedures(evidence_data),
    'sampling_methodology': audit_gen.document_sampling_methodology(evidence_data),

    'appendices': {
        'control_matrices': audit_gen.generate_control_matrices(evidence_data, config['framework']),
        'evidence_listings': audit_gen.generate_evidence_listings(evidence_data),
        'testing_documentation': audit_gen.generate_testing_documentation(evidence_data),
        'system_descriptions': audit_gen.generate_system_descriptions(evidence_data)
    }
}

# Add cross-framework analysis if performed
if cross_framework_analysis:
    audit_report['cross_framework_analysis'] = cross_framework_analysis
    audit_report['framework_gap_analysis'] = mapper.identify_framework_gaps(cross_framework_analysis)

# Write comprehensive audit report
output_path = '$output_file.json'
with open(output_path, 'w') as f:
    json.dump(audit_report, f, indent=2)

# Generate additional report formats
audit_gen.generate_executive_summary_pdf(audit_report, '$output_file_executive_summary.pdf')
audit_gen.generate_detailed_findings_csv(audit_report, '$output_file_findings.csv')

# Generate cryptographic signatures if requested
if signer:
    print('Generating cryptographic signatures for audit report...')

    # Sign main audit report
    main_signature = signer.sign_audit_report(output_path)
    with open('$output_file.sig', 'w') as f:
        f.write(main_signature)

    # Create signed attestation envelope
    signed_attestation = signer.create_audit_attestation(audit_report)
    with open('$output_file.attestation.json', 'w') as f:
        json.dump(signed_attestation, f, indent=2)

    print('Audit report cryptographically signed and attested')

print(f'Comprehensive audit report generated:')
print(f'  Main report: {output_path}')
print(f'  Executive summary: $output_file_executive_summary.pdf')
print(f'  Detailed findings: $output_file_findings.csv')

if signer:
    print(f'  Cryptographic signature: $output_file.sig')
    print(f'  Signed attestation: $output_file.attestation.json')

# Generate audit completion summary
completion_summary = {
    'audit_completion_status': 'report_generated',
    'total_controls_assessed': len([c for cat in evidence_data['control_evidence'].values() for c in cat['controls']]),
    'evidence_items_collected': sum(cat['evidence_summary']['total_evidence_items'] for cat in evidence_data['control_evidence'].values()),
    'automation_coverage': audit_gen.calculate_automation_percentage(evidence_data),
    'audit_readiness_score': audit_readiness['overall_readiness_score'],
    'next_steps': audit_readiness.get('next_steps', [])
}

with open('$output_file_completion_summary.json', 'w') as f:
    json.dump(completion_summary, f, indent=2)

print(f'Audit completion summary: $output_file_completion_summary.json')
    "

    return 0
}
```

### 4. Sample Comprehensive Audit Report Output

Executive summary of comprehensive SOC2 Type II audit report:

```json
{
  "report_metadata": {
    "report_id": "audit-soc2-type2-1726338000",
    "framework": "soc2-type2",
    "audit_period_start": "2023-09-14T18:00:00Z",
    "audit_period_end": "2024-09-14T18:00:00Z",
    "report_generation_date": "2024-09-14T18:00:00Z",
    "report_version": "2.0.0",
    "prepared_by": "SPEK Enterprise Compliance Engine",
    "report_type": "comprehensive_audit_report"
  },

  "executive_summary": {
    "audit_opinion": "Unqualified Opinion with Minor Deficiencies",
    "overall_readiness_score": 0.89,
    "controls_fully_compliant": 42,
    "controls_partially_compliant": 5,
    "controls_non_compliant": 0,
    "material_weaknesses": 0,
    "significant_deficiencies": 2,
    "management_response_required": 7,
    "estimated_remediation_timeline": "6-8 weeks"
  },

  "detailed_control_assessment": {
    "CC1": {
      "category_name": "Control Environment",
      "evidence_summary": {
        "total_evidence_items": 156,
        "automated_items": 134,
        "manual_items": 22,
        "evidence_completeness": 0.95
      }
    },
    "CC6": {
      "category_name": "Logical and Physical Access Controls",
      "evidence_summary": {
        "total_evidence_items": 289,
        "automated_items": 267,
        "manual_items": 22,
        "evidence_completeness": 0.92
      }
    }
  },

  "evidence_summary": {
    "total_evidence_packages": 3,
    "automated_evidence_percentage": 0.87,
    "evidence_retention_period": "7_years",
    "chain_of_custody": [
      {
        "evidence_id": "ev-001-cc1",
        "collection_timestamp": "2024-09-14T18:00:00Z",
        "collector": "SPEK Enterprise System",
        "hash": "sha256:a1b2c3d4...",
        "custody_transfers": []
      }
    ]
  },

  "audit_testing_results": {
    "total_tests_performed": 47,
    "tests_passed": 42,
    "tests_failed": 0,
    "tests_with_exceptions": 5,
    "testing_coverage": {
      "design_effectiveness": 1.0,
      "operating_effectiveness": 0.89,
      "continuous_monitoring": 0.92
    }
  },

  "deficiencies_and_recommendations": {
    "material_weaknesses": [],

    "significant_deficiencies": [
      {
        "control_id": "CC3.1",
        "deficiency_type": "Operating Effectiveness",
        "description": "Risk identification process lacks comprehensive documentation for 2 quarters",
        "impact": "Medium",
        "likelihood": "Low",
        "remediation_timeline": "4 weeks",
        "management_response": "Accepted - implementing enhanced documentation procedures"
      },
      {
        "control_id": "CC6.8",
        "deficiency_type": "Design Enhancement",
        "description": "Production data access monitoring could be enhanced with real-time alerting",
        "impact": "Low-Medium",
        "likelihood": "Low",
        "remediation_timeline": "3 weeks",
        "management_response": "Accepted - deploying enhanced monitoring dashboard"
      }
    ],

    "remediation_plan": {
      "phase_1": {
        "timeline": "2 weeks",
        "activities": [
          "Implement enhanced risk documentation procedures",
          "Deploy real-time access monitoring alerts"
        ],
        "responsible_party": "IT Security Team",
        "success_criteria": "Documentation coverage >95%, Real-time alerts operational"
      },

      "phase_2": {
        "timeline": "4 weeks",
        "activities": [
          "Complete quarterly risk assessment documentation",
          "Validate monitoring effectiveness"
        ],
        "responsible_party": "Risk Management Team",
        "success_criteria": "All quarters documented, Monitoring validated"
      }
    }
  },

  "management_assertions": {
    "design_effectiveness": {
      "assertion": "Management asserts that controls are suitably designed to meet Trust Services Criteria",
      "confidence_level": "High",
      "supporting_evidence": "Design testing performed on 100% of controls",
      "exceptions": "None identified"
    },

    "operating_effectiveness": {
      "assertion": "Management asserts that controls operated effectively throughout the audit period",
      "confidence_level": "High with Minor Exceptions",
      "supporting_evidence": "Operating effectiveness testing on all controls",
      "exceptions": "2 significant deficiencies noted and addressed"
    },

    "remediation_commitment": {
      "assertion": "Management commits to remediate identified deficiencies within specified timelines",
      "timeline_commitment": "6-8 weeks",
      "resource_allocation": "Dedicated security team assigned",
      "progress_reporting": "Bi-weekly status updates"
    }
  },

  "comprehensive_audit_trail": {
    "total_audit_trail_entries": 1247,
    "evidence_collection_events": 892,
    "testing_execution_events": 245,
    "management_review_events": 67,
    "remediation_tracking_events": 43,
    "trail_integrity": "Verified with cryptographic hashes",
    "retention_compliance": "7-year retention policy applied"
  },

  "cross_framework_analysis": {
    "frameworks_analyzed": ["ISO27001", "NIST-CSF"],
    "control_overlap_percentage": 0.73,
    "unified_evidence_utilization": 0.81,
    "framework_gap_analysis": {
      "iso27001_gaps": ["A.18.1.1 - Legal requirements not explicitly covered"],
      "nist_csf_gaps": ["RC.RP-1 - Recovery planning could be enhanced"]
    }
  },

  "audit_completion_metrics": {
    "total_hours_invested": 245,
    "automation_time_savings": "67%",
    "evidence_collection_efficiency": "89%",
    "audit_cost_reduction": "$47,500",
    "audit_quality_score": 0.94
  },

  "next_steps": {
    "immediate_actions": [
      "Begin Phase 1 remediation activities",
      "Implement enhanced documentation procedures",
      "Deploy real-time monitoring enhancements"
    ],
    "30_day_milestones": [
      "Complete all Phase 1 remediation",
      "Validate enhanced controls effectiveness",
      "Prepare for follow-up testing"
    ],
    "next_audit_cycle": {
      "recommended_date": "2025-09-14",
      "preparation_timeline": "6 months",
      "expected_improvements": "Full compliance with zero deficiencies"
    }
  }
}
```

## Integration Points

### Used by:
- External auditors for SOC2, ISO27001 assessments
- Internal audit teams for compliance validation
- Regulatory reporting and submission workflows
- Executive compliance reporting and board presentations

### Produces:
- Comprehensive audit-ready reports (JSON/PDF)
- Evidence packages with cryptographic integrity
- Executive summaries and management presentations
- Remediation tracking and progress reports

### Consumes:
- Real-time compliance monitoring data
- Historical audit evidence and documentation
- System logs, access records, and security data
- Management assertions and remediation commitments

## Error Handling

- Graceful handling of incomplete evidence collection
- Fallback procedures for manual evidence requirements
- Clear documentation of evidence gaps and limitations
- Validation of audit trail integrity and completeness

## Performance Requirements

- Comprehensive audit report generation within 15 minutes
- Memory usage under 1GB during evidence packaging
- Support for 12-month audit periods with full evidence retention
- Performance overhead <=1.2% during ongoing evidence collection

This command provides comprehensive audit report generation with enterprise-grade evidence packaging, cross-framework analysis, and cryptographic integrity for regulatory compliance auditing.