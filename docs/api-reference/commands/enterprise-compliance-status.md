# /enterprise:compliance:status

## Purpose
Real-time compliance status monitoring across multiple frameworks (SOC2, ISO27001, NIST CSF, GDPR) with automated control mapping, evidence collection, and risk assessment. Provides compliance dashboard with audit trail generation and regulatory gap analysis.

## Usage
/enterprise:compliance:status [--framework=<framework>] [--controls=<control_set>] [--output=json|dashboard] [--audit-trail]

## Implementation

### 1. Compliance Framework Configuration

#### Multi-Framework Support Configuration:
```bash
# Configure compliance framework and control mappings
configure_compliance_framework() {
    local framework="$1"
    local controls="$2"
    local audit_trail="$3"

    # Supported compliance frameworks
    local supported_frameworks=("soc2" "soc2-type2" "iso27001" "nist-csf" "gdpr" "hipaa" "pci-dss" "all")

    if [[ "$framework" == "" ]]; then
        framework="soc2"
    fi

    if [[ ! " ${supported_frameworks[@]} " =~ " ${framework} " ]]; then
        echo "ERROR: Unsupported compliance framework '$framework'. Supported: ${supported_frameworks[*]}" >&2
        exit 1
    fi

    echo "Framework: $framework, Controls: ${controls:-all}, Audit Trail: ${audit_trail:-false}"

    # Set framework-specific requirements
    case "$framework" in
        "soc2"|"soc2-type2")
            COMPLIANCE_REQUIREMENTS=(
                "access_controls"
                "change_management"
                "data_classification"
                "monitoring_logging"
                "incident_response"
            )
            ;;
        "iso27001")
            COMPLIANCE_REQUIREMENTS=(
                "risk_management"
                "access_control"
                "cryptography"
                "physical_security"
                "supplier_relationships"
                "incident_management"
            )
            ;;
        "nist-csf")
            COMPLIANCE_REQUIREMENTS=(
                "identify"
                "protect"
                "detect"
                "respond"
                "recover"
            )
            ;;
        "gdpr")
            COMPLIANCE_REQUIREMENTS=(
                "data_protection"
                "consent_management"
                "breach_notification"
                "privacy_by_design"
                "data_subject_rights"
            )
            ;;
    esac

    echo "Required controls: ${COMPLIANCE_REQUIREMENTS[*]}"
}
```

#### Compliance Control Mapping:
```javascript
const COMPLIANCE_CONTROL_MAPPINGS = {
  soc2_type2: {
    framework_version: "2017 Trust Services Criteria",
    categories: {
      CC1: {
        name: "Control Environment",
        controls: [
          "CC1.1 - COSO Principles and Control Environment",
          "CC1.2 - Board Independence and Expertise",
          "CC1.3 - Management Philosophy and Operating Style",
          "CC1.4 - Organizational Structure and Authority"
        ],
        automation_mappings: {
          "CC1.1": ["code_review_process", "security_training_records"],
          "CC1.2": ["governance_documentation", "board_meeting_minutes"],
          "CC1.3": ["policy_documentation", "management_communications"]
        }
      },

      CC2: {
        name: "Communication and Information",
        controls: [
          "CC2.1 - Internal Communication",
          "CC2.2 - External Communication",
          "CC2.3 - Quality Information"
        ],
        automation_mappings: {
          "CC2.1": ["internal_policy_distribution", "security_awareness_metrics"],
          "CC2.2": ["external_security_communications", "vendor_security_requirements"],
          "CC2.3": ["monitoring_dashboards", "security_metrics_reporting"]
        }
      },

      CC3: {
        name: "Risk Assessment",
        controls: [
          "CC3.1 - Risk Identification",
          "CC3.2 - Risk Analysis",
          "CC3.3 - Fraud Risk Assessment",
          "CC3.4 - Risk Response"
        ],
        automation_mappings: {
          "CC3.1": ["vulnerability_scanning", "threat_modeling", "risk_registers"],
          "CC3.2": ["risk_analysis_reports", "impact_assessments"],
          "CC3.3": ["fraud_detection_systems", "anomaly_monitoring"],
          "CC3.4": ["remediation_tracking", "risk_mitigation_plans"]
        }
      },

      CC5: {
        name: "Control Activities",
        controls: [
          "CC5.1 - Control Activities Design",
          "CC5.2 - Control Activities Implementation",
          "CC5.3 - Segregation of Duties"
        ],
        automation_mappings: {
          "CC5.1": ["security_control_design", "policy_procedures"],
          "CC5.2": ["control_testing_results", "implementation_evidence"],
          "CC5.3": ["access_control_matrices", "role_separation_documentation"]
        }
      },

      CC6: {
        name: "Logical and Physical Access Controls",
        controls: [
          "CC6.1 - Logical Access Security Measures",
          "CC6.2 - Logical Access Requests",
          "CC6.3 - Logical Access Removal/Modification",
          "CC6.6 - Logical Access Restrictions",
          "CC6.7 - Data Transmission",
          "CC6.8 - Production Data"
        ],
        automation_mappings: {
          "CC6.1": ["mfa_enforcement", "password_policies", "access_reviews"],
          "CC6.2": ["access_request_workflows", "approval_processes"],
          "CC6.3": ["deprovisioning_processes", "access_change_logs"],
          "CC6.6": ["privilege_access_management", "least_privilege_enforcement"],
          "CC6.7": ["encryption_in_transit", "secure_communication_protocols"],
          "CC6.8": ["data_masking", "production_access_controls"]
        }
      },

      CC7: {
        name: "System Operations",
        controls: [
          "CC7.1 - System Operations Procedures",
          "CC7.2 - System Monitoring",
          "CC7.3 - System Backup and Recovery",
          "CC7.4 - System Change Management"
        ],
        automation_mappings: {
          "CC7.1": ["operational_procedures", "runbooks", "sop_documentation"],
          "CC7.2": ["system_monitoring", "alerting_systems", "log_analysis"],
          "CC7.3": ["backup_procedures", "disaster_recovery_testing"],
          "CC7.4": ["change_management_workflows", "deployment_controls"]
        }
      },

      CC8: {
        name: "Change Management",
        controls: [
          "CC8.1 - System Development Life Cycle",
          "CC8.2 - Authorization of Changes",
          "CC8.3 - System Development Standards"
        ],
        automation_mappings: {
          "CC8.1": ["sdlc_documentation", "development_standards"],
          "CC8.2": ["change_approval_workflows", "release_management"],
          "CC8.3": ["coding_standards", "security_development_practices"]
        }
      }
    }
  },

  iso27001: {
    framework_version: "ISO/IEC 27001:2013",
    categories: {
      "A.5": {
        name: "Information Security Policies",
        controls: ["A.5.1.1", "A.5.1.2"],
        automation_mappings: {
          "A.5.1.1": ["policy_management_system", "policy_approval_workflow"],
          "A.5.1.2": ["policy_review_schedule", "policy_communication_tracking"]
        }
      },
      "A.9": {
        name: "Access Control",
        controls: ["A.9.1.1", "A.9.1.2", "A.9.2.1", "A.9.2.2", "A.9.4.1"],
        automation_mappings: {
          "A.9.1.1": ["access_control_policy", "access_management_procedures"],
          "A.9.1.2": ["network_access_controls", "remote_access_policies"],
          "A.9.2.1": ["user_registration_process", "account_management"],
          "A.9.2.2": ["privileged_access_management", "admin_account_controls"],
          "A.9.4.1": ["access_restriction_procedures", "information_access_controls"]
        }
      }
    }
  },

  nist_csf: {
    framework_version: "NIST Cybersecurity Framework v1.1",
    categories: {
      "ID": {
        name: "Identify",
        controls: ["ID.AM", "ID.BE", "ID.GV", "ID.RA", "ID.RM"],
        automation_mappings: {
          "ID.AM": ["asset_inventory", "asset_management_system"],
          "ID.BE": ["business_environment_assessment", "critical_process_identification"],
          "ID.GV": ["governance_framework", "cybersecurity_policy"],
          "ID.RA": ["risk_assessment_process", "threat_intelligence"],
          "ID.RM": ["risk_management_strategy", "risk_tolerance_definition"]
        }
      },
      "PR": {
        name: "Protect",
        controls: ["PR.AC", "PR.AT", "PR.DS", "PR.IP", "PR.MA", "PR.PT"],
        automation_mappings: {
          "PR.AC": ["identity_management", "access_control_systems"],
          "PR.AT": ["security_awareness_training", "cybersecurity_workforce_development"],
          "PR.DS": ["data_security_controls", "encryption_implementation"],
          "PR.IP": ["information_protection_processes", "secure_development_lifecycle"],
          "PR.MA": ["maintenance_procedures", "system_maintenance_controls"],
          "PR.PT": ["protective_technology_deployment", "security_architecture"]
        }
      }
    }
  }
};
```

### 2. Real-time Compliance Data Collection

#### Automated Evidence Collection:
```javascript
async function collectComplianceEvidence(framework, controls) {
  const evidenceCollection = {
    framework: framework,
    collection_timestamp: new Date().toISOString(),
    evidence_sources: {},
    control_assessments: {},
    gaps_identified: [],
    recommendations: []
  };

  const controlMappings = COMPLIANCE_CONTROL_MAPPINGS[framework];
  if (!controlMappings) {
    throw new Error(`Unsupported compliance framework: ${framework}`);
  }

  // Collect evidence for each control category
  for (const [categoryId, category] of Object.entries(controlMappings.categories)) {
    evidenceCollection.evidence_sources[categoryId] = {
      category_name: category.name,
      controls_assessed: [],
      evidence_collected: {},
      automation_coverage: 0
    };

    for (const control of category.controls) {
      const controlId = control.split(' - ')[0];
      const automationMappings = category.automation_mappings[controlId] || [];

      const controlEvidence = await collectControlEvidence(controlId, automationMappings);
      evidenceCollection.evidence_sources[categoryId].controls_assessed.push({
        control_id: controlId,
        control_description: control,
        evidence_status: controlEvidence.status,
        evidence_count: controlEvidence.evidence.length,
        automated_coverage: controlEvidence.automated_coverage,
        manual_evidence_required: controlEvidence.manual_evidence_required,
        last_assessment: controlEvidence.last_assessment
      });

      evidenceCollection.evidence_sources[categoryId].evidence_collected[controlId] = controlEvidence.evidence;

      // Identify gaps
      if (controlEvidence.status === 'insufficient' || controlEvidence.gaps.length > 0) {
        evidenceCollection.gaps_identified.push({
          control_id: controlId,
          category: categoryId,
          gap_type: controlEvidence.status,
          details: controlEvidence.gaps,
          priority: calculateGapPriority(controlId, controlEvidence)
        });
      }
    }

    // Calculate automation coverage for category
    const totalControls = category.controls.length;
    const automatedControls = evidenceCollection.evidence_sources[categoryId].controls_assessed
      .filter(c => c.automated_coverage > 0.7).length;
    evidenceCollection.evidence_sources[categoryId].automation_coverage =
      automatedControls / totalControls;
  }

  return evidenceCollection;
}

async function collectControlEvidence(controlId, automationMappings) {
  const controlEvidence = {
    control_id: controlId,
    status: 'sufficient',
    evidence: [],
    automated_coverage: 0,
    manual_evidence_required: [],
    gaps: [],
    last_assessment: new Date().toISOString()
  };

  let automatedEvidenceCount = 0;

  // Collect automated evidence
  for (const mapping of automationMappings) {
    try {
      const evidence = await collectAutomatedEvidence(mapping);
      if (evidence && evidence.length > 0) {
        controlEvidence.evidence.push(...evidence);
        automatedEvidenceCount++;
      }
    } catch (error) {
      controlEvidence.gaps.push({
        type: 'automation_failure',
        mapping: mapping,
        error: error.message
      });
    }
  }

  // Calculate automation coverage
  controlEvidence.automated_coverage = automationMappings.length > 0
    ? automatedEvidenceCount / automationMappings.length
    : 0;

  // Determine if manual evidence is required
  if (controlEvidence.automated_coverage < 0.5) {
    controlEvidence.manual_evidence_required.push({
      type: 'insufficient_automation',
      required_evidence: getRequiredManualEvidence(controlId),
      priority: 'high'
    });
  }

  // Assess overall evidence sufficiency
  if (controlEvidence.evidence.length === 0) {
    controlEvidence.status = 'no_evidence';
  } else if (controlEvidence.automated_coverage < 0.3 && controlEvidence.manual_evidence_required.length > 0) {
    controlEvidence.status = 'insufficient';
  }

  return controlEvidence;
}

async function collectAutomatedEvidence(mapping) {
  const evidence = [];

  try {
    switch (mapping) {
      case 'code_review_process':
        // Collect code review evidence from Git
        const gitLogs = await collectGitReviewEvidence();
        evidence.push(...gitLogs);
        break;

      case 'vulnerability_scanning':
        // Collect security scan results
        const scanResults = await collectSecurityScanEvidence();
        evidence.push(...scanResults);
        break;

      case 'access_control_matrices':
        // Collect IAM and access control evidence
        const accessEvidence = await collectAccessControlEvidence();
        evidence.push(...accessEvidence);
        break;

      case 'monitoring_dashboards':
        // Collect monitoring and alerting evidence
        const monitoringEvidence = await collectMonitoringEvidence();
        evidence.push(...monitoringEvidence);
        break;

      case 'backup_procedures':
        // Collect backup and recovery evidence
        const backupEvidence = await collectBackupEvidence();
        evidence.push(...backupEvidence);
        break;

      default:
        console.warn(`Unknown evidence mapping: ${mapping}`);
    }
  } catch (error) {
    console.error(`Failed to collect evidence for ${mapping}:`, error);
  }

  return evidence;
}
```

### 3. Compliance Status Assessment

#### Real-time Compliance Dashboard Generation:
```bash
# Generate comprehensive compliance status assessment
generate_compliance_status() {
    local framework="$1"
    local controls="$2"
    local output_format="$3"
    local audit_trail="$4"

    echo "[SHIELD] Generating compliance status for $framework framework"

    # Create artifacts directory
    mkdir -p .claude/.artifacts/compliance

    # Generate compliance status using Python enterprise modules
    python -c "
import sys
sys.path.append('analyzer/enterprise/compliance')
from core import ComplianceStatusGenerator
from reporting import ComplianceReporter
from audit_trail import AuditTrailGenerator
import json
from datetime import datetime

# Initialize compliance generators
status_gen = ComplianceStatusGenerator()
reporter = ComplianceReporter()
audit_gen = AuditTrailGenerator() if '$audit_trail' == 'true' else None

# Configure assessment parameters
config = {
    'framework': '$framework',
    'controls': '$controls'.split(',') if '$controls' else 'all',
    'output_format': '$output_format' or 'json',
    'include_evidence': True,
    'include_recommendations': True,
    'generate_audit_trail': '$audit_trail' == 'true'
}

print(f'Assessing compliance for {config[\"framework\"]} framework...')

# Collect compliance evidence
evidence_data = status_gen.collect_compliance_evidence(config['framework'], config['controls'])
print(f'Evidence collected from {len(evidence_data[\"evidence_sources\"])} control categories')

# Perform compliance assessment
compliance_assessment = status_gen.assess_compliance_status(evidence_data, config)
print(f'Assessment completed: {compliance_assessment[\"overall_compliance_score\"]:.1%} compliant')

# Generate risk analysis
risk_analysis = status_gen.analyze_compliance_risks(compliance_assessment)
print(f'Risk analysis: {len(risk_analysis[\"high_risk_gaps\"])} high-risk gaps identified')

# Create comprehensive status report
status_report = {
    'assessment_metadata': {
        'framework': config['framework'],
        'assessment_date': datetime.utcnow().isoformat() + 'Z',
        'assessment_id': f'comp-assess-{int(datetime.utcnow().timestamp())}',
        'version': '2.0.0',
        'assessor': 'SPEK Enterprise Compliance Engine'
    },

    'executive_summary': {
        'overall_compliance_score': compliance_assessment['overall_compliance_score'],
        'compliance_level': compliance_assessment['compliance_level'],
        'total_controls_assessed': compliance_assessment['total_controls'],
        'controls_compliant': compliance_assessment['compliant_controls'],
        'controls_non_compliant': compliance_assessment['non_compliant_controls'],
        'controls_partially_compliant': compliance_assessment['partially_compliant_controls'],
        'high_priority_gaps': len([g for g in evidence_data['gaps_identified'] if g['priority'] == 'high']),
        'audit_readiness': compliance_assessment['audit_readiness']
    },

    'compliance_by_category': compliance_assessment['category_results'],
    'evidence_summary': evidence_data['evidence_sources'],
    'gaps_and_recommendations': {
        'critical_gaps': [g for g in evidence_data['gaps_identified'] if g['priority'] == 'critical'],
        'high_priority_gaps': [g for g in evidence_data['gaps_identified'] if g['priority'] == 'high'],
        'medium_priority_gaps': [g for g in evidence_data['gaps_identified'] if g['priority'] == 'medium'],
        'improvement_recommendations': compliance_assessment['recommendations']
    },
    'risk_analysis': risk_analysis,
    'automation_coverage': {
        'overall_automation_percentage': compliance_assessment['automation_coverage'],
        'fully_automated_controls': compliance_assessment['fully_automated_controls'],
        'partially_automated_controls': compliance_assessment['partially_automated_controls'],
        'manual_controls': compliance_assessment['manual_controls']
    }
}

# Generate audit trail if requested
if audit_gen:
    audit_trail = audit_gen.generate_comprehensive_audit_trail(
        status_report, evidence_data, config
    )
    status_report['audit_trail'] = audit_trail
    print('Comprehensive audit trail generated')

# Write status report
output_file = f'.claude/.artifacts/compliance/compliance_status_{config[\"framework\"]}_{int(datetime.utcnow().timestamp())}'

if config['output_format'] == 'json':
    with open(f'{output_file}.json', 'w') as f:
        json.dump(status_report, f, indent=2)
    print(f'JSON compliance status report: {output_file}.json')

elif config['output_format'] == 'dashboard':
    dashboard_html = reporter.generate_compliance_dashboard(status_report)
    with open(f'{output_file}_dashboard.html', 'w') as f:
        f.write(dashboard_html)
    print(f'Compliance dashboard: {output_file}_dashboard.html')

# Generate executive summary for quick review
exec_summary = reporter.generate_executive_summary(status_report)
with open(f'{output_file}_executive_summary.json', 'w') as f:
    json.dump(exec_summary, f, indent=2)

print(f'Executive summary: {output_file}_executive_summary.json')
    "

    return 0
}
```

### 4. Sample Compliance Status Output

Comprehensive SOC2 Type II compliance status report:

```json
{
  "assessment_metadata": {
    "framework": "soc2-type2",
    "assessment_date": "2024-09-14T17:30:00Z",
    "assessment_id": "comp-assess-1726336200",
    "version": "2.0.0",
    "assessor": "SPEK Enterprise Compliance Engine"
  },

  "executive_summary": {
    "overall_compliance_score": 0.847,
    "compliance_level": "Substantially Compliant",
    "total_controls_assessed": 47,
    "controls_compliant": 35,
    "controls_non_compliant": 4,
    "controls_partially_compliant": 8,
    "high_priority_gaps": 6,
    "audit_readiness": "Ready with Minor Remediation"
  },

  "compliance_by_category": {
    "CC1": {
      "category_name": "Control Environment",
      "total_controls": 4,
      "compliant_controls": 3,
      "compliance_percentage": 0.75,
      "status": "Mostly Compliant",
      "key_gaps": [
        {
          "control": "CC1.4",
          "issue": "Organizational authority documentation incomplete",
          "priority": "medium"
        }
      ]
    },

    "CC2": {
      "category_name": "Communication and Information",
      "total_controls": 3,
      "compliant_controls": 3,
      "compliance_percentage": 1.0,
      "status": "Fully Compliant",
      "key_gaps": []
    },

    "CC3": {
      "category_name": "Risk Assessment",
      "total_controls": 4,
      "compliant_controls": 2,
      "compliance_percentage": 0.5,
      "status": "Partially Compliant",
      "key_gaps": [
        {
          "control": "CC3.1",
          "issue": "Risk identification process lacks automation",
          "priority": "high"
        },
        {
          "control": "CC3.4",
          "issue": "Risk response procedures not documented",
          "priority": "high"
        }
      ]
    },

    "CC6": {
      "category_name": "Logical and Physical Access Controls",
      "total_controls": 8,
      "compliant_controls": 6,
      "compliance_percentage": 0.75,
      "status": "Mostly Compliant",
      "key_gaps": [
        {
          "control": "CC6.3",
          "issue": "Access removal process lacks automated workflow",
          "priority": "medium"
        },
        {
          "control": "CC6.8",
          "issue": "Production data access logging insufficient",
          "priority": "high"
        }
      ]
    },

    "CC7": {
      "category_name": "System Operations",
      "total_controls": 4,
      "compliant_controls": 4,
      "compliance_percentage": 1.0,
      "status": "Fully Compliant",
      "key_gaps": []
    },

    "CC8": {
      "category_name": "Change Management",
      "total_controls": 3,
      "compliant_controls": 2,
      "compliance_percentage": 0.67,
      "status": "Mostly Compliant",
      "key_gaps": [
        {
          "control": "CC8.2",
          "issue": "Change authorization workflow needs enhancement",
          "priority": "medium"
        }
      ]
    }
  },

  "evidence_summary": {
    "total_evidence_items": 342,
    "automated_evidence": 289,
    "manual_evidence": 53,
    "evidence_by_source": {
      "git_repository": 78,
      "security_scans": 45,
      "access_logs": 67,
      "monitoring_systems": 34,
      "policy_documents": 23,
      "training_records": 18,
      "audit_logs": 77
    },
    "evidence_freshness": {
      "last_24_hours": 156,
      "last_week": 78,
      "last_month": 108,
      "older_than_month": 0
    }
  },

  "gaps_and_recommendations": {
    "critical_gaps": [],

    "high_priority_gaps": [
      {
        "control_id": "CC3.1",
        "category": "CC3",
        "gap_type": "insufficient",
        "details": "Risk identification process lacks comprehensive automation and documentation",
        "priority": "high",
        "impact": "May fail SOC2 Type II audit requirement",
        "remediation_effort": "2-3 weeks",
        "cost_estimate": "$15,000"
      },
      {
        "control_id": "CC6.8",
        "category": "CC6",
        "gap_type": "insufficient",
        "details": "Production data access logging and monitoring needs enhancement",
        "priority": "high",
        "impact": "Potential data security compliance failure",
        "remediation_effort": "1-2 weeks",
        "cost_estimate": "$8,000"
      }
    ],

    "improvement_recommendations": [
      {
        "category": "Automation",
        "recommendation": "Implement automated risk assessment workflows",
        "controls_impacted": ["CC3.1", "CC3.2", "CC3.4"],
        "expected_improvement": "+15% compliance score",
        "timeline": "6 weeks",
        "priority": "high"
      },
      {
        "category": "Monitoring",
        "recommendation": "Deploy comprehensive access monitoring dashboard",
        "controls_impacted": ["CC6.3", "CC6.8", "CC7.2"],
        "expected_improvement": "+8% compliance score",
        "timeline": "4 weeks",
        "priority": "medium"
      }
    ]
  },

  "risk_analysis": {
    "overall_risk_score": 3.2,
    "risk_level": "Medium",
    "audit_failure_probability": 0.15,
    "regulatory_risks": [
      {
        "risk_type": "SOC2 Audit Failure",
        "probability": 0.12,
        "impact": "High",
        "mitigation_required": "Address CC3.1 and CC6.8 gaps"
      }
    ],
    "business_impact": {
      "potential_audit_costs": "$75,000",
      "remediation_timeline": "8-12 weeks",
      "customer_impact": "Low to Medium"
    }
  },

  "automation_coverage": {
    "overall_automation_percentage": 0.73,
    "fully_automated_controls": 28,
    "partially_automated_controls": 12,
    "manual_controls": 7,
    "automation_by_category": {
      "CC1": 0.5,
      "CC2": 0.8,
      "CC3": 0.4,
      "CC5": 0.9,
      "CC6": 0.85,
      "CC7": 0.95,
      "CC8": 0.7
    }
  },

  "next_steps": {
    "immediate_actions": [
      "Implement automated risk identification system (CC3.1)",
      "Enhance production data access logging (CC6.8)",
      "Document organizational authority structure (CC1.4)"
    ],
    "30_day_roadmap": [
      "Complete risk response procedure documentation",
      "Deploy access monitoring dashboard",
      "Enhance change authorization workflows"
    ],
    "90_day_roadmap": [
      "Achieve 90%+ overall compliance score",
      "Complete SOC2 Type II audit preparation",
      "Implement continuous compliance monitoring"
    ],
    "next_assessment": "2024-09-28T17:30:00Z"
  }
}
```

## Integration Points

### Used by:
- Executive compliance dashboards
- SOC2, ISO27001, GDPR audit preparations
- Regulatory reporting workflows
- Risk management assessments

### Produces:
- Real-time compliance status reports
- Evidence collection summaries
- Gap analysis and remediation roadmaps
- Audit trail documentation

### Consumes:
- System logs and access records
- Policy and procedure documentation
- Security scan results and vulnerability data
- Training records and personnel data

## Error Handling

- Graceful handling of missing evidence sources
- Fallback to manual assessment when automation fails
- Clear reporting of data collection failures
- Validation of compliance framework requirements

## Performance Requirements

- Compliance assessment completed within 5 minutes
- Memory usage under 512MB during assessment
- Support for 500+ controls across multiple frameworks
- Performance overhead <=1.2% during evidence collection

This command provides comprehensive compliance status monitoring with multi-framework support, automated evidence collection, and enterprise-grade audit trail generation for regulatory compliance management.