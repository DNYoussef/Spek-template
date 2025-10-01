from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
Report Templates Module
Manages report templates and formatting for various compliance frameworks.
"""

import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ReportTemplate:
    """Report template definition."""
    template_id: str
    name: str
    description: str
    format_type: str  # "markdown", "html", "json", "yaml"
    framework_support: List[str]
    template_content: str
    required_fields: List[str]
    optional_fields: List[str] = None


class ComplianceReportTemplateManager:
    """Manages compliance report templates for different frameworks and formats."""

    def __init__(self):
        self.templates = self._initialize_templates()
        logger.info(f"Initialized {len(self.templates)} report templates")

    def _initialize_templates(self) -> Dict[str, ReportTemplate]:
        """Initialize report templates for different formats and frameworks."""
        templates = {}

        # Executive Summary Template
        exec_template = ReportTemplate(
            template_id="executive_summary",
            name="Executive Summary Report",
            description="High-level compliance summary for executive stakeholders",
            format_type="markdown",
            framework_support=["ISO27001", "SOC2", "NIST-SSDF"],
            template_content="""# Compliance Assessment Executive Summary

**Assessment Date**: {{ assessment_date }}
**Organization**: {{ organization_name }}
**Reporting Period**: {{ reporting_period }}

## Overall Compliance Posture

{% for framework in scorecards %}
### {{ framework.framework }}
- **Compliance Score**: {{ framework.overall_score }}% ({{ framework.compliance_level }})
- **Controls Implemented**: {{ framework.implemented_controls }}/{{ framework.total_controls }}
- **High-Risk Gaps**: {{ framework.high_risk_gaps }}
- **Automation Level**: {{ framework.automation_percentage }}%

{% endfor %}

## Key Findings

{% for finding in key_findings %}
- **{{ finding.severity }}**: {{ finding.description }}
{% endfor %}

## Recommendations

{% for recommendation in recommendations %}
{{ loop.index }}. **{{ recommendation.priority }}**: {{ recommendation.title }}
   - Effort: {{ recommendation.effort }}
   - Timeline: {{ recommendation.timeline }}
   - Impact: {{ recommendation.impact }}

{% endfor %}

## Risk Summary

**Overall Risk Level**: {{ overall_risk_level }}

| Risk Level | Count | Percentage |
|------------|-------|------------|
{% for risk_level, count in risk_distribution.items() %}
| {{ risk_level|title }} | {{ count }} | {{ (count/total_controls*100)|round(1) }}% |
{% endfor %}

## Next Steps

1. **Immediate Actions**: Address {{ critical_issues }} critical findings
2. **30-Day Plan**: Implement {{ high_priority_actions }} high-priority controls
3. **90-Day Plan**: Complete {{ medium_priority_actions }} medium-priority improvements
4. **Long-term**: Establish continuous monitoring and improvement processes
""",
            required_fields=["assessment_date", "organization_name", "scorecards", "key_findings", "recommendations"],
            optional_fields=["reporting_period", "overall_risk_level", "risk_distribution"]
        )
        templates[exec_template.template_id] = exec_template

        # Technical Assessment Template
        tech_template = ReportTemplate(
            template_id="technical_assessment",
            name="Technical Assessment Report",
            description="Detailed technical compliance assessment",
            format_type="json",
            framework_support=["ISO27001", "SOC2", "NIST-SSDF"],
            template_content="""
{
  "assessment_metadata": {
    "assessment_id": "{{ assessment_id }}",
    "framework": "{{ framework }}",
    "assessment_timestamp": "{{ assessment_timestamp }}",
    "assessor": "{{ assessor }}",
    "scope": {{ scope|tojson }}
  },
  "compliance_summary": {
    "overall_score": {{ compliance_score }},
    "compliance_level": "{{ compliance_level }}",
    "total_controls": {{ total_controls }},
    "implementation_status": {
      "implemented": {{ implemented_controls }},
      "partially_implemented": {{ partially_implemented_controls }},
      "not_implemented": {{ not_implemented_controls }}
    }
  },
  "risk_assessment": {
    "overall_risk_level": "{{ overall_risk_level }}",
    "risk_distribution": {{ risk_distribution|tojson }},
    "high_risk_controls": {{ high_risk_controls|tojson }}
  },
  "gap_analysis": {
    "total_gaps": {{ total_gaps }},
    "critical_gaps": {{ critical_gaps }},
    "remediation_priority": {{ remediation_priority|tojson }},
    "estimated_effort": {
      "total_days": {{ total_effort_days }},
      "total_cost": "{{ estimated_cost }}"
    }
  },
  "control_assessments": {{ control_assessments|tojson }},
  "recommendations": {{ recommendations|tojson }},
  "evidence_summary": {{ evidence_summary|tojson }}
}
            """,
            required_fields=["framework", "compliance_score", "total_controls", "control_assessments"],
            optional_fields=["assessor", "scope", "evidence_summary"]
        )
        templates[tech_template.template_id] = tech_template

        # Gap Analysis Template
        gap_template = ReportTemplate(
            template_id="gap_analysis",
            name="Gap Analysis Report",
            description="Detailed gap analysis with remediation roadmap",
            format_type="markdown",
            framework_support=["ISO27001", "SOC2", "NIST-SSDF"],
            template_content="""# Gap Analysis Report

**Framework**: {{ framework }}
**Assessment Date**: {{ assessment_date }}
**Total Gaps Identified**: {{ total_gaps }}

## Gap Summary

| Priority | Count | Estimated Effort |
|----------|-------|------------------|
{% for priority, data in gaps_by_priority.items() %}
| {{ priority|title }} | {{ data.count }} | {{ data.effort_days }} days |
{% endfor %}

## High Priority Gaps

{% for gap in high_priority_gaps %}
### {{ gap.control_id }}: {{ gap.control_title }}

**Current Status**: {{ gap.current_status }}
**Risk Level**: {{ gap.risk_level }}
**Estimated Effort**: {{ gap.effort_days }} days

**Identified Gaps**:
{% for issue in gap.issues %}
- {{ issue }}
{% endfor %}

**Remediation Steps**:
{% for step in gap.remediation_steps %}
{{ loop.index }}. {{ step }}
{% endfor %}

**Success Criteria**:
{% for criteria in gap.success_criteria %}
- {{ criteria }}
{% endfor %}

---
{% endfor %}

## Implementation Roadmap

### Phase 1: Critical Issues ({{ phase1_duration }} days)
{% for gap in phase1_gaps %}
- **{{ gap.control_id }}**: {{ gap.control_title }} ({{ gap.effort_days }} days)
{% endfor %}

### Phase 2: High Priority ({{ phase2_duration }} days)
{% for gap in phase2_gaps %}
- **{{ gap.control_id }}**: {{ gap.control_title }} ({{ gap.effort_days }} days)
{% endfor %}

### Phase 3: Medium Priority ({{ phase3_duration }} days)
{% for gap in phase3_gaps %}
- **{{ gap.control_id }}**: {{ gap.control_title }} ({{ gap.effort_days }} days)
{% endfor %}

## Resource Requirements

**Total Effort**: {{ total_effort_days }} days ({{ total_effort_weeks }} weeks)
**Estimated Cost**: {{ estimated_cost_range }}
**Key Resources Needed**:
{% for resource in required_resources %}
- {{ resource }}
{% endfor %}
""",
            required_fields=["framework", "total_gaps", "gaps_by_priority", "high_priority_gaps"],
            optional_fields=["phase1_gaps", "phase2_gaps", "phase3_gaps", "required_resources"]
        )
        templates[gap_template.template_id] = gap_template

        # Audit Package Template
        audit_template = ReportTemplate(
            template_id="audit_package",
            name="Audit Package Manifest",
            description="Structured audit package with evidence documentation",
            format_type="json",
            framework_support=["ISO27001", "SOC2", "NIST-SSDF"],
            template_content="""
{
  "audit_package": {
    "package_id": "{{ package_id }}",
    "generation_timestamp": "{{ generation_timestamp }}",
    "framework": "{{ framework }}",
    "organization": "{{ organization }}",
    "assessment_period": {
      "start_date": "{{ start_date }}",
      "end_date": "{{ end_date }}"
    }
  },
  "package_structure": {
    "executive_summary": {
      "file": "executive_summary.md",
      "description": "Executive summary for stakeholders"
    },
    "technical_assessment": {
      "file": "technical_assessment.json",
      "description": "Detailed technical findings and metrics"
    },
    "evidence_packages": {
      "directory": "evidence/",
      "description": "Evidence artifacts organized by control",
      "contents": {{ evidence_manifest|tojson }}
    },
    "audit_trails": {
      "directory": "audit_trails/",
      "description": "Audit logs and chain of custody records",
      "contents": {{ audit_trail_manifest|tojson }}
    },
    "gap_analysis": {
      "file": "gap_analysis.md",
      "description": "Gap analysis and remediation roadmap"
    },
    "cross_framework_mapping": {
      "file": "cross_framework_mapping.json",
      "description": "Framework correlation and mapping analysis"
    }
  },
  "validation": {
    "package_integrity": "{{ package_hash }}",
    "evidence_count": {{ evidence_count }},
    "completeness_score": {{ completeness_score }},
    "validation_timestamp": "{{ validation_timestamp }}"
  },
  "retention": {
    "retention_period": "{{ retention_period }}",
    "retention_until": "{{ retention_until }}",
    "disposal_method": "{{ disposal_method }}"
  }
}
            """,
            required_fields=["package_id", "framework", "organization", "evidence_manifest"],
            optional_fields=["audit_trail_manifest", "package_hash", "retention_period"]
        )
        templates[audit_template.template_id] = audit_template

        # Cross-Framework Mapping Template
        mapping_template = ReportTemplate(
            template_id="cross_framework_mapping",
            name="Cross-Framework Mapping Report",
            description="Analysis of control mappings across compliance frameworks",
            format_type="json",
            framework_support=["ISO27001", "SOC2", "NIST-SSDF"],
            template_content="""
{
  "mapping_metadata": {
    "mapping_id": "{{ mapping_id }}",
    "generation_timestamp": "{{ generation_timestamp }}",
    "primary_framework": "{{ primary_framework }}",
    "mapped_frameworks": {{ mapped_frameworks|tojson }}
  },
  "framework_coverage": {
    {% for framework in mapped_frameworks %}
    "{{ framework }}": {
      "total_controls": {{ framework_stats[framework].total_controls }},
      "mapped_controls": {{ framework_stats[framework].mapped_controls }},
      "coverage_percentage": {{ framework_stats[framework].coverage_percentage }},
      "unique_controls": {{ framework_stats[framework].unique_controls }}
    }{% if not loop.last %},{% endif %}
    {% endfor %}
  },
  "control_mappings": [
    {% for mapping in control_mappings %}
    {
      "primary_control": {
        "framework": "{{ mapping.primary_framework }}",
        "control_id": "{{ mapping.primary_control_id }}",
        "title": "{{ mapping.primary_control_title }}"
      },
      "mapped_controls": [
        {% for mapped in mapping.mapped_controls %}
        {
          "framework": "{{ mapped.framework }}",
          "control_id": "{{ mapped.control_id }}",
          "title": "{{ mapped.title }}",
          "mapping_confidence": {{ mapped.confidence }},
          "mapping_type": "{{ mapped.mapping_type }}"
        }{% if not loop.last %},{% endif %}
        {% endfor %}
      ],
      "gap_analysis": {
        "coverage_gaps": {{ mapping.coverage_gaps|tojson }},
        "additional_requirements": {{ mapping.additional_requirements|tojson }}
      }
    }{% if not loop.last %},{% endif %}
    {% endfor %}
  ],
  "optimization_recommendations": {{ optimization_recommendations|tojson }}
}
            """,
            required_fields=["primary_framework", "mapped_frameworks", "control_mappings"],
            optional_fields=["framework_stats", "optimization_recommendations"]
        )
        templates[mapping_template.template_id] = mapping_template

        return templates

    def get_template(self, template_id: str) -> Optional[ReportTemplate]:
        """Get specific template by ID."""
        return self.templates.get(template_id)

    def get_templates_by_format(self, format_type: str) -> List[ReportTemplate]:
        """Get templates by format type."""
        return [template for template in self.templates.values()
                if template.format_type == format_type]

    def get_templates_by_framework(self, framework: str) -> List[ReportTemplate]:
        """Get templates supporting specific framework."""
        return [template for template in self.templates.values()
                if framework in template.framework_support]

    def validate_template_data(self, template_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate data against template requirements."""
        template = self.get_template(template_id)
        if not template:
            return {"valid": False, "error": f"Template {template_id} not found"}

        validation_result = {
            "valid": True,
            "missing_required": [],
            "unused_optional": [],
            "data_quality": {}
        }

        # Check required fields
        for required_field in template.required_fields:
            if required_field not in data:
                validation_result["missing_required"].append(required_field)
                validation_result["valid"] = False

        # Check optional fields usage
        optional_fields = template.optional_fields or []
        all_template_fields = set(template.required_fields + optional_fields)
        provided_fields = set(data.keys())

        unused_fields = provided_fields - all_template_fields
        if unused_fields:
            validation_result["unused_optional"] = list(unused_fields)

        # Basic data quality checks
        for field, value in data.items():
            if value is None:
                validation_result["data_quality"][field] = "null_value"
            elif isinstance(value, str) and not value.strip():
                validation_result["data_quality"][field] = "empty_string"
            elif isinstance(value, (list, dict)) and len(value) == 0:
                validation_result["data_quality"][field] = "empty_collection"

        return validation_result

    def get_template_statistics(self) -> Dict[str, Any]:
        """Get statistics about available templates."""
        format_counts = {}
        framework_support = {}

        for template in self.templates.values():
            # Count by format
            format_counts[template.format_type] = format_counts.get(template.format_type, 0) + 1

            # Count framework support
            for framework in template.framework_support:
                framework_support[framework] = framework_support.get(framework, 0) + 1

        return {
            "total_templates": len(self.templates),
            "by_format": format_counts,
            "framework_support": framework_support,
            "available_templates": list(self.templates.keys())
        }

    def render_template_preview(self, template_id: str, sample_data: Dict[str, Any] = None) -> Optional[str]:
        """Render template with sample data for preview."""
        template = self.get_template(template_id)
        if not template:
            return None

        # Use minimal sample data if none provided
        if sample_data is None:
            sample_data = self._generate_sample_data(template)

        try:
            # Simple template rendering (in production, use proper template engine)
            rendered = template.template_content
            for field, value in sample_data.items():
                placeholder = "{{ " + field + " }}"
                rendered = rendered.replace(placeholder, str(value))

            return rendered
        except Exception as e:
            logger.error(f"Error rendering template {template_id}: {e}")
            return None

    def _generate_sample_data(self, template: ReportTemplate) -> Dict[str, Any]:
        """Generate sample data for template preview."""
        sample_data = {}

        # Common sample values
        sample_values = {
            "assessment_date": "2025-9-24",
            "organization_name": "Sample Organization",
            "framework": "ISO27001",
            "compliance_score": 85.5,
            "total_controls": 93,
            "assessment_timestamp": "2025-9-24T15:12:03-04:00",
            "overall_risk_level": "Medium"
        }

        for field in template.required_fields:
            if field in sample_values:
                sample_data[field] = sample_values[field]
            else:
                sample_data[field] = f"Sample {field}"

        return sample_data


"""
<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-9-24T15:12:03-04:00 | coder@Sonnet-4 | Created comprehensive report templates module | report_templates.py | OK | Extracted from corrupted reporting.py | 0.00 | b4c7e9d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: phase3-reporting-templates-01
- inputs: ["reporting.py"]
- tools_used: ["Write"]
- versions: {"model":"Sonnet-4","prompt":"v1.0.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
"""