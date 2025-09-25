"""
ReportGenerator - Extracted from dfars_compliance_validation_system
Generates comprehensive DFARS compliance reports
Part of god object decomposition (Day 4)
"""

from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import json
import os

from dataclasses import dataclass

from .ComplianceChecker import ComplianceCheck, ComplianceStatus
from .ValidationEngine import ValidationResult

@dataclass
class ReportFormat:
    """Defines report output format."""
    type: str  # html, json, pdf, markdown
    template: Optional[str] = None
    include_evidence: bool = True
    include_recommendations: bool = True

class ReportGenerator:
    """
    Generates comprehensive DFARS compliance reports.

    Extracted from dfars_compliance_validation_system (1, 54 LOC -> ~200 LOC component).
    Handles:
    - Report generation
    - Evidence packaging
    - Executive summaries
    - Audit trails
    - Export to multiple formats
    """

    def __init__(self):
        """Initialize the report generator."""
        self.report_cache: Dict[str, Any] = {}
        self.report_history: List[Dict[str, Any]] = []
        self.template_dir = Path(__file__).parent / "templates"

    def generate_compliance_report(self,
                                    compliance_checks: List[ComplianceCheck],
                                    validation_results: List[ValidationResult],
                                    report_format: ReportFormat) -> Dict[str, Any]:
        """Generate comprehensive compliance report."""
        # Create report structure
        report = {
            "metadata": self._generate_metadata(),
            "executive_summary": self._generate_executive_summary(
                compliance_checks, validation_results
            ),
            "compliance_status": self._analyze_compliance_status(compliance_checks),
            "validation_details": self._format_validation_results(validation_results),
            "evidence_summary": self._compile_evidence(
                compliance_checks, report_format.include_evidence
            ),
            "gaps_and_recommendations": self._compile_gaps_and_recommendations(
                compliance_checks, report_format.include_recommendations
            ),
            "audit_trail": self._generate_audit_trail(compliance_checks, validation_results)
        }

        # Format report based on requested type
        formatted_report = self._format_report(report, report_format)

        # Cache report
        report_id = f"report-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        self.report_cache[report_id] = formatted_report
        self.report_history.append({"id": report_id, "timestamp": datetime.now()})

        return formatted_report

    def _generate_metadata(self) -> Dict[str, Any]:
        """Generate report metadata."""
        return {
            "report_type": "DFARS Compliance Assessment",
            "generated_at": datetime.now().isoformat(),
            "generator_version": "1.0.0",
            "compliance_framework": "DFARS 252.204-7012",
            "assessment_standard": "NIST SP 800-171"
        }

    def _generate_executive_summary(self,
                                    compliance_checks: List[ComplianceCheck],
                                    validation_results: List[ValidationResult]) -> Dict[str, Any]:
        """Generate executive summary."""
        total_checks = len(compliance_checks)
        compliant = sum(1 for c in compliance_checks if c.status == ComplianceStatus.COMPLIANT)
        partial = sum(1 for c in compliance_checks if c.status == ComplianceStatus.PARTIAL)
        non_compliant = sum(1 for c in compliance_checks if c.status == ComplianceStatus.NON_COMPLIANT)

        critical_issues = [v for v in validation_results if v.severity == "critical"]
        high_issues = [v for v in validation_results if v.severity == "high"]

        compliance_percentage = (compliant / total_checks * 100) if total_checks > 0 else 0

        return {
            "compliance_score": compliance_percentage,
            "total_requirements": total_checks,
            "fully_compliant": compliant,
            "partially_compliant": partial,
            "non_compliant": non_compliant,
            "critical_issues": len(critical_issues),
            "high_priority_issues": len(high_issues),
            "overall_status": self._determine_overall_status(compliance_percentage),
            "key_findings": self._extract_key_findings(compliance_checks, validation_results),
            "immediate_actions_required": self._identify_immediate_actions(
                critical_issues, high_issues
            )
        }

    def _determine_overall_status(self, compliance_percentage: float) -> str:
        """Determine overall compliance status."""
        if compliance_percentage >= 95:
            return "Fully Compliant"
        elif compliance_percentage >= 80:
            return "Substantially Compliant"
        elif compliance_percentage >= 60:
            return "Partially Compliant"
        else:
            return "Non-Compliant - Immediate Action Required"

    def _extract_key_findings(self,
                            compliance_checks: List[ComplianceCheck],
                            validation_results: List[ValidationResult]) -> List[str]:
        """Extract key findings from assessments."""
        findings = []

        # Critical compliance failures
        critical_failures = [
            c for c in compliance_checks
            if c.status == ComplianceStatus.NON_COMPLIANT and len(c.gaps) > 3
        ]
        if critical_failures:
            findings.append(f"Critical: {len(critical_failures)} major compliance gaps identified")

        # Security control failures
        failed_controls = [
            v for v in validation_results
            if v.status == "failed" and v.severity in ["critical", "high"]
        ]
        if failed_controls:
            findings.append(f"Security: {len(failed_controls)} high-priority control failures")

        # Positive findings
        strong_areas = [
            c for c in compliance_checks
            if c.status == ComplianceStatus.COMPLIANT and c.confidence > 0.9
        ]
        if strong_areas:
            findings.append(f"Strength: {len(strong_areas)} areas with strong compliance")

        return findings

    def _identify_immediate_actions(self,
                                    critical_issues: List[ValidationResult],
                                    high_issues: List[ValidationResult]) -> List[str]:
        """Identify immediate actions required."""
        actions = []

        if critical_issues:
            actions.append("Address critical security control failures immediately")
            for issue in critical_issues[:3]:  # Top 3 critical
                actions.append(f"Fix: {issue.control_name} - {issue.details}")

        if high_issues:
            actions.append("Remediate high-priority findings within 30 days")

        return actions

    def _analyze_compliance_status(self, compliance_checks: List[ComplianceCheck]) -> Dict[str, Any]:
        """Analyze detailed compliance status."""
        by_category = {}

        for check in compliance_checks:
            rule_category = check.rule_id.split('-')[1]  # Extract category from rule ID
            if rule_category not in by_category:
                by_category[rule_category] = {"compliant": 0, "partial": 0, "non_compliant": 0}

            if check.status == ComplianceStatus.COMPLIANT:
                by_category[rule_category]["compliant"] += 1
            elif check.status == ComplianceStatus.PARTIAL:
                by_category[rule_category]["partial"] += 1
            else:
                by_category[rule_category]["non_compliant"] += 1

        return {
            "by_category": by_category,
            "trend": "improving" if len(self.report_history) > 1 else "baseline",
            "maturity_level": self._calculate_maturity_level(compliance_checks)
        }

    def _calculate_maturity_level(self, compliance_checks: List[ComplianceCheck]) -> int:
        """Calculate CMMC maturity level based on compliance."""
        compliant_count = sum(1 for c in compliance_checks if c.status == ComplianceStatus.COMPLIANT)
        total = len(compliance_checks)

        if total == 0:
            return 0

        percentage = compliant_count / total

        if percentage >= 0.95:
            return 3  # Advanced
        elif percentage >= 0.80:
            return 2  # Managed
        elif percentage >= 0.60:
            return 1  # Basic
        else:
            return 0  # Non-compliant

    def _format_validation_results(self, validation_results: List[ValidationResult]) -> List[Dict[str, Any]]:
        """Format validation results for report."""
        return [
            {
                "control_id": v.control_id,
                "control_name": v.control_name,
                "status": v.status,
                "severity": v.severity,
                "details": v.details,
                "evidence_count": len(v.evidence),
                "timestamp": v.timestamp.isoformat()
            }
            for v in validation_results
        ]

    def _compile_evidence(self,
                        compliance_checks: List[ComplianceCheck],
                        include_evidence: bool) -> Dict[str, Any]:
        """Compile evidence summary."""
        if not include_evidence:
            return {"included": False}

        evidence_by_type = {}
        total_evidence = 0

        for check in compliance_checks:
            for evidence_item in check.evidence:
                evidence_type = "documented" if "document" in evidence_item.lower() else "technical"
                if evidence_type not in evidence_by_type:
                    evidence_by_type[evidence_type] = []
                evidence_by_type[evidence_type].append({
                    "rule": check.rule_id,
                    "evidence": evidence_item
                })
                total_evidence += 1

        return {
            "included": True,
            "total_items": total_evidence,
            "by_type": evidence_by_type
        }

    def _compile_gaps_and_recommendations(self,
                                        compliance_checks: List[ComplianceCheck],
                                        include_recommendations: bool) -> List[Dict[str, Any]]:
        """Compile gaps and recommendations."""
        gaps_and_recs = []

        for check in compliance_checks:
            if check.gaps:
                gap_entry = {
                    "rule": check.rule_id,
                    "gaps": check.gaps
                }

                if include_recommendations:
                    gap_entry["recommendations"] = check.recommendations

                gaps_and_recs.append(gap_entry)

        return gaps_and_recs

    def _generate_audit_trail(self,
                            compliance_checks: List[ComplianceCheck],
                            validation_results: List[ValidationResult]) -> List[Dict[str, Any]]:
        """Generate audit trail for assessment."""
        trail = []

        # Add compliance check events
        for check in compliance_checks:
            trail.append({
                "timestamp": check.checked_at.isoformat(),
                "event": "compliance_check",
                "target": check.rule_id,
                "result": check.status.value,
                "confidence": check.confidence
            })

        # Add validation events
        for validation in validation_results:
            trail.append({
                "timestamp": validation.timestamp.isoformat(),
                "event": "control_validation",
                "target": validation.control_id,
                "result": validation.status,
                "severity": validation.severity
            })

        return sorted(trail, key=lambda x: x["timestamp"])

    def _format_report(self, report: Dict[str, Any], format_spec: ReportFormat) -> Dict[str, Any]:
        """Format report based on specification."""
        if format_spec.type == "json":
            return report
        elif format_spec.type == "html":
            return self._generate_html_report(report)
        elif format_spec.type == "markdown":
            return self._generate_markdown_report(report)
        else:
            return report

    def _generate_html_report(self, report: Dict[str, Any]) -> Dict[str, Any]:
        """Generate HTML formatted report."""
        # Simplified HTML generation
        return {
            "type": "html",
            "content": f"<html><body><h1>DFARS Compliance Report</h1>{json.dumps(report)}</body></html>",
            "data": report
        }

    def _generate_markdown_report(self, report: Dict[str, Any]) -> Dict[str, Any]:
        """Generate Markdown formatted report."""
        md_content = f"""# DFARS Compliance Report

## Executive Summary
- Compliance Score: {report['executive_summary']['compliance_score']:.1f}%
- Status: {report['executive_summary']['overall_status']}

## Key Findings
{chr(10).join('- ' + f for f in report['executive_summary']['key_findings'])}

## Immediate Actions
{chr(10).join('- ' + a for a in report['executive_summary']['immediate_actions_required'])}
"""
        return {"type": "markdown", "content": md_content, "data": report}

    def export_report(self, report_id: str, export_path: str) -> bool:
        """Export report to file."""
        if report_id not in self.report_cache:
            return False

        report = self.report_cache[report_id]

        with open(export_path, 'w') as f:
            if isinstance(report, dict):
                json.dump(report, f, indent=2, default=str)
            else:
                f.write(str(report))

        return True