"""
DFARSComplianceFacade - Backward compatible interface for DFARS compliance system
Maintains API compatibility while delegating to decomposed components
Part of god object decomposition (Day 4)
"""

from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
import logging

from .ComplianceChecker import (
    ComplianceChecker,
    ComplianceCheck,
    ComplianceStatus,
    ComplianceLevel
)
from .ValidationEngine import (
    ValidationEngine,
    ValidationResult
)
from .ReportGenerator import (
    ReportGenerator,
    ReportFormat
)

logger = logging.getLogger(__name__)

class DFARSComplianceValidationSystem:
    """
    Facade for DFARS Compliance Validation System.

    Original: 1, 54 LOC god object
    Refactored: ~150 LOC facade + 3 specialized components (~700 LOC total)

    Maintains 100% backward compatibility while delegating to:
    - ComplianceChecker: DFARS rule validation
    - ValidationEngine: NIST SP 800-171 control validation
    - ReportGenerator: Compliance reporting
    """

def __init__(self):
        """Initialize the DFARS compliance validation system."""
        # Initialize components
        self.compliance_checker = ComplianceChecker()
        self.validation_engine = ValidationEngine()
        self.report_generator = ReportGenerator()

        # Maintain original state for compatibility
        self.system_config: Dict[str, Any] = {}
        self.assessment_history: List[Dict[str, Any]] = []
        self.last_assessment_date: Optional[datetime] = None
        self.cmmc_level: int = 0

        logger.info("DFARS Compliance Validation System initialized")

    # Original API methods - Compliance checking
def check_compliance(self,
                        rule_id: str,
                        evidence: List[str],
                        system_data: Optional[Dict[str, Any]] = None) -> ComplianceCheck:
        """Check compliance for specific DFARS rule."""
        result = self.compliance_checker.check_compliance(rule_id, evidence, system_data)
        self._update_assessment_history("compliance_check", result)
        return result

def batch_check_compliance(self, evidence_map: Dict[str, List[str]]) -> Dict[str, ComplianceCheck]:
        """Perform batch compliance checking."""
        results = self.compliance_checker.batch_check(evidence_map)
        self._update_assessment_history("batch_compliance_check", results)
        return results

def get_compliance_score(self) -> Dict[str, Any]:
        """Get overall compliance score."""
        return self.compliance_checker.get_compliance_score()

def get_critical_gaps(self) -> List[Dict[str, Any]]:
        """Get critical compliance gaps."""
        return self.compliance_checker.get_critical_gaps()

    # Original API methods - Validation
def validate_control(self,
                        control_id: str,
                        system_config: Dict[str, Any],
                        evidence: Optional[List[str]] = None) -> ValidationResult:
        """Validate specific NIST SP 800-171 control."""
        result = self.validation_engine.validate_control(control_id, system_config, evidence)
        self._update_assessment_history("control_validation", result)
        return result

def validate_all_controls(self, system_config: Dict[str, Any]) -> List[ValidationResult]:
        """Validate all security controls."""
        results = self.validation_engine.validate_all_controls(system_config)
        self._update_assessment_history("full_validation", results)
        return results

def validate_cmmc_requirements(self,
                                    cmmc_level: int,
                                    system_config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate CMMC level requirements."""
        self.cmmc_level = cmmc_level
        results = self.validation_engine.validate_cmmc_requirements(cmmc_level, system_config)
        self._update_assessment_history("cmmc_validation", results)
        return results

def continuous_monitoring(self,
                            system_config: Dict[str, Any],
                            interval_hours: int = 24) -> List[ValidationResult]:
        """Perform continuous monitoring validation."""
        return self.validation_engine.continuous_monitoring(system_config, interval_hours)

def get_validation_summary(self) -> Dict[str, Any]:
        """Get validation summary."""
        return self.validation_engine.get_validation_summary()

def export_validation_evidence(self) -> List[Dict[str, Any]]:
        """Export validation evidence."""
        return self.validation_engine.export_validation_evidence()

    # Original API methods - Reporting
def generate_compliance_report(self,
                                    format_type: str = "json",
                                    include_evidence: bool = True,
                                    include_recommendations: bool = True) -> Dict[str, Any]:
        """Generate comprehensive compliance report."""
        # Gather data from components
        compliance_checks = list(self.compliance_checker.check_results.values())
        validation_results = self.validation_engine.validation_results

        # Create report format specification
        report_format = ReportFormat(
            type=format_type,
            include_evidence=include_evidence,
            include_recommendations=include_recommendations
        )

        # Generate report
        report = self.report_generator.generate_compliance_report(
            compliance_checks,
            validation_results,
            report_format
        )

        self.last_assessment_date = datetime.now()
        return report

def export_report(self, report_id: str, export_path: str) -> bool:
        """Export report to file."""
        return self.report_generator.export_report(report_id, export_path)

    # Original API methods - Combined assessments
def perform_full_assessment(self,
                                system_config: Dict[str, Any],
                                evidence_map: Dict[str, List[str]]) -> Dict[str, Any]:
        """Perform complete DFARS compliance assessment."""
        self.system_config = system_config

        # Perform compliance checks
        compliance_results = self.batch_check_compliance(evidence_map)

        # Perform validation
        validation_results = self.validate_all_controls(system_config)

        # Check CMMC if level specified
        cmmc_results = None
        if self.cmmc_level > 0:
            cmmc_results = self.validate_cmmc_requirements(self.cmmc_level, system_config)

        # Generate report
        report = self.generate_compliance_report()

        # Compile assessment summary
        assessment = {
            "timestamp": datetime.now().isoformat(),
            "compliance_score": self.get_compliance_score(),
            "validation_summary": self.get_validation_summary(),
            "cmmc_results": cmmc_results,
            "report": report,
            "critical_gaps": self.get_critical_gaps()
        }

        self._update_assessment_history("full_assessment", assessment)
        return assessment

def get_remediation_plan(self) -> Dict[str, Any]:
        """Generate remediation plan based on gaps."""
        gaps = self.get_critical_gaps()

        plan = {
            "priority_actions": [],
            "timeline": {},
            "resource_requirements": []
        }

        for gap in gaps:
            priority = gap.get("priority", "medium")

            action = {
                "rule": gap["rule_id"],
                "actions": gap["recommendations"],
                "priority": priority,
                "estimated_effort": self._estimate_effort(gap)
            }

            plan["priority_actions"].append(action)

            # Set timeline based on priority
            if priority == "critical":
                plan["timeline"][gap["rule_id"]] = "Immediate (0-7 days)"
            elif priority == "high":
                plan["timeline"][gap["rule_id"]] = "Short-term (7-30 days)"
            else:
                plan["timeline"][gap["rule_id"]] = "Medium-term (30-90 days)"

        return plan

def _estimate_effort(self, gap: Dict[str, Any]) -> str:
        """Estimate remediation effort."""
        gap_count = len(gap.get("gaps", []))

        if gap_count <= 2:
            return "Low (1-2 days)"
        elif gap_count <= 5:
            return "Medium (3-5 days)"
        else:
            return "High (1-2 weeks)"

def _update_assessment_history(self, assessment_type: str, data: Any) -> None:
        """Update assessment history."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": assessment_type,
            "summary": self._create_summary(data)
        }

        self.assessment_history.append(entry)

        # Keep only last 100 entries
        if len(self.assessment_history) > 100:
            self.assessment_history = self.assessment_history[-100:]

def _create_summary(self, data: Any) -> Dict[str, Any]:
        """Create summary of assessment data."""
        if isinstance(data, ComplianceCheck):
            return {
                "rule": data.rule_id,
                "status": data.status.value,
                "gaps": len(data.gaps)
            }
        elif isinstance(data, ValidationResult):
            return {
                "control": data.control_id,
                "status": data.status,
                "severity": data.severity
            }
        elif isinstance(data, dict):
            return {"items": len(data), "type": "batch_result"}
        elif isinstance(data, list):
            return {"count": len(data), "type": "list_result"}
        else:
            return {"type": str(type(data))}

    # Utility methods for backward compatibility
def get_assessment_history(self) -> List[Dict[str, Any]]:
        """Get assessment history."""
        return self.assessment_history

def get_system_config(self) -> Dict[str, Any]:
        """Get current system configuration."""
        return self.system_config

def update_system_config(self, config: Dict[str, Any]) -> None:
        """Update system configuration."""
        self.system_config.update(config)

def get_cmmc_level(self) -> int:
        """Get current CMMC level."""
        return self.cmmc_level

def set_cmmc_level(self, level: int) -> None:
        """Set CMMC level target."""
        if level not in [0, 1, 2, 3]:
            raise ValueError("CMMC level must be 0-3")
        self.cmmc_level = level