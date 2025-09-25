"""
ValidationEngine - Extracted from dfars_compliance_validation_system
Performs DFARS-specific validation and verification
Part of god object decomposition (Day 4)
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Set
import hashlib
import json
import logging

from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

@dataclass
class ValidationResult:
    """Result of a validation check."""
    control_id: str
    control_name: str
    status: str  # passed, failed, warning, skipped
    details: str
    evidence: List[str]
    timestamp: datetime
    severity: str  # critical, high, medium, low

@dataclass
class SecurityControl:
    """Represents a NIST SP 800-171 security control."""
    control_id: str
    family: str
    title: str
    description: str
    implementation_guidance: str
    validation_criteria: List[str]

class ValidationEngine:
    """
    Performs DFARS-specific validation and verification.

    Extracted from dfars_compliance_validation_system (1, 54 LOC -> ~250 LOC component).
    Handles:
    - NIST SP 800-171 control validation
    - Technical security validation
    - Configuration verification
    - Continuous monitoring
    - Evidence validation
    """

def __init__(self):
        """Initialize the validation engine."""
        self.security_controls: Dict[str, SecurityControl] = {}
        self.validation_results: List[ValidationResult] = []
        self.validation_cache: Dict[str, ValidationResult] = {}

        # Load NIST SP 800-171 controls
        self._load_nist_controls()

def _load_nist_controls(self) -> None:
        """Load NIST SP 800-171 security controls."""
        # Key NIST SP 800-171 controls for DFARS compliance
        controls = [
            SecurityControl(
                control_id="3.1.1",
                family="Access Control",
                title="Limit System Access",
                description="Limit information system access to authorized users",
                implementation_guidance="Implement identity management and access controls",
                validation_criteria=[
                    "User authentication configured",
                    "Access control lists defined",
                    "Privileged accounts managed"
                ]
            ),
            SecurityControl(
                control_id="3.1.2",
                family="Access Control",
                title="Control CUI Flow",
                description="Limit information system access to types of transactions and functions",
                implementation_guidance="Implement role-based access control",
                validation_criteria=[
                    "RBAC implemented",
                    "Transaction limits defined",
                    "Function restrictions enforced"
                ]
            ),
            SecurityControl(
                control_id="3.3.1",
                family="Audit and Accountability",
                title="System Auditing",
                description="Create, protect, and retain system audit records",
                implementation_guidance="Enable comprehensive audit logging",
                validation_criteria=[
                    "Audit logging enabled",
                    "Log protection configured",
                    "Log retention policy implemented"
                ]
            ),
            SecurityControl(
                control_id="3.4.1",
                family="Configuration Management",
                title="Baseline Configurations",
                description="Establish and maintain baseline configurations",
                implementation_guidance="Document and maintain system baselines",
                validation_criteria=[
                    "Baseline documented",
                    "Configuration management process",
                    "Change control implemented"
                ]
            ),
            SecurityControl(
                control_id="3.11.1",
                family="Risk Assessment",
                title="Risk Assessments",
                description="Periodically assess risk to operations and assets",
                implementation_guidance="Conduct regular risk assessments",
                validation_criteria=[
                    "Risk assessment conducted",
                    "Vulnerabilities identified",
                    "Risk mitigation planned"
                ]
            ),
            SecurityControl(
                control_id="3.13.1",
                family="System and Communications Protection",
                title="Boundary Protection",
                description="Monitor, control, and protect communications at boundaries",
                implementation_guidance="Implement firewalls and network segmentation",
                validation_criteria=[
                    "Firewalls configured",
                    "Network segmentation implemented",
                    "Boundary monitoring active"
                ]
            )
        ]

        for control in controls:
            self.security_controls[control.control_id] = control

def validate_control(self,
                        control_id: str,
                        system_config: Dict[str, Any],
                        evidence: Optional[List[str]] = None) -> ValidationResult:
        """Validate a specific security control."""
        control = self.security_controls.get(control_id)
        if not control:
            return ValidationResult(
                control_id=control_id,
                control_name="Unknown Control",
                status="skipped",
                details=f"Control {control_id} not found in validation engine",
                evidence=[],
                timestamp=datetime.now(),
                severity="low"
            )

        # Check cache
        cache_key = self._get_cache_key(control_id, system_config)
        if cache_key in self.validation_cache:
            cached_result = self.validation_cache[cache_key]
            if self._is_cache_valid(cached_result):
                return cached_result

        # Perform validation
        status, details, validation_evidence = self._perform_validation(
            control, system_config, evidence
        )

        # Determine severity
        severity = self._determine_severity(control, status)

        # Create result
        result = ValidationResult(
            control_id=control_id,
            control_name=control.title,
            status=status,
            details=details,
            evidence=validation_evidence,
            timestamp=datetime.now(),
            severity=severity
        )

        # Cache result
        self.validation_cache[cache_key] = result
        self.validation_results.append(result)

        return result

def _perform_validation(self,
                            control: SecurityControl,
                            system_config: Dict[str, Any],
                            evidence: Optional[List[str]]) -> Tuple[str, str, List[str]]:
        """Perform actual validation of a control."""
        validation_evidence = evidence or []
        passed_criteria = 0
        failed_criteria = []

        for criterion in control.validation_criteria:
            if self._check_criterion(criterion, system_config):
                passed_criteria += 1
                validation_evidence.append(f"[PASS] {criterion}")
            else:
                failed_criteria.append(criterion)
                validation_evidence.append(f"[FAIL] {criterion}")

        # Determine status
        total_criteria = len(control.validation_criteria)
        if passed_criteria == total_criteria:
            status = "passed"
            details = f"All {total_criteria} validation criteria met"
        elif passed_criteria > 0:
            status = "warning"
            details = f"Partially compliant: {passed_criteria}/{total_criteria} criteria met"
        else:
            status = "failed"
            details = f"Non-compliant: 0/{total_criteria} criteria met"

        return status, details, validation_evidence

def _check_criterion(self, criterion: str, system_config: Dict[str, Any]) -> bool:
        """Check if a specific validation criterion is met."""
        criterion_lower = criterion.lower()

        # Check for specific configurations
        if "authentication" in criterion_lower:
            return system_config.get("authentication_enabled", False)
        elif "audit logging" in criterion_lower:
            return system_config.get("audit_logging", False)
        elif "rbac" in criterion_lower or "role-based" in criterion_lower:
            return system_config.get("rbac_enabled", False)
        elif "firewall" in criterion_lower:
            return system_config.get("firewall_configured", False)
        elif "baseline" in criterion_lower:
            return system_config.get("baseline_documented", False)
        elif "risk assessment" in criterion_lower:
            return system_config.get("risk_assessment_completed", False)
        elif "encryption" in criterion_lower:
            return system_config.get("encryption_enabled", False)

        # Default check
        return False

def _determine_severity(self, control: SecurityControl, status: str) -> str:
        """Determine severity of validation result."""
        if status == "passed":
            return "low"

        # Critical families
        critical_families = ["Access Control", "System and Communications Protection"]
        high_families = ["Audit and Accountability", "Risk Assessment"]

        if control.family in critical_families:
            return "critical" if status == "failed" else "high"
        elif control.family in high_families:
            return "high" if status == "failed" else "medium"
        else:
            return "medium" if status == "failed" else "low"

def validate_all_controls(self,
                            system_config: Dict[str, Any]) -> List[ValidationResult]:
        """Validate all security controls."""
        results = []

        for control_id in self.security_controls:
            result = self.validate_control(control_id, system_config)
            results.append(result)

        return results

def validate_cmmc_requirements(self,
                                    cmmc_level: int,
                                    system_config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate CMMC level requirements."""
        cmmc_controls = {
            1: ["3.1.1", "3.1.2"],  # Basic cyber hygiene
            2: ["3.1.1", "3.1.2", "3.3.1", "3.4.1"],  # Intermediate
            3: ["3.1.1", "3.1.2", "3.3.1", "3.4.1", "3.11.1", "3.13.1"]  # Advanced
        }

        required_controls = cmmc_controls.get(cmmc_level, [])
        results = []
        compliant = True

        for control_id in required_controls:
            result = self.validate_control(control_id, system_config)
            results.append(result)
            if result.status == "failed":
                compliant = False

        return {
            "cmmc_level": cmmc_level,
            "compliant": compliant,
            "validation_results": results,
            "required_controls": len(required_controls),
            "passed_controls": sum(1 for r in results if r.status == "passed")
        }

def continuous_monitoring(self,
                            system_config: Dict[str, Any],
                            interval_hours: int = 24) -> List[ValidationResult]:
        """Perform continuous monitoring validation."""
        # Check if monitoring is due
        last_check = system_config.get("last_monitoring_check")
        if last_check:
            last_time = datetime.fromisoformat(last_check)
            if datetime.now() - last_time < timedelta(hours=interval_hours):
                return []  # Not due yet

        # Perform critical control checks
        critical_controls = ["3.1.1", "3.3.1", "3.13.1"]  # Access, Audit, Protection
        results = []

        for control_id in critical_controls:
            result = self.validate_control(control_id, system_config)
            results.append(result)

            # Alert on failures
            if result.status == "failed" and result.severity in ["critical", "high"]:
                logger.warning(f"Critical control {control_id} failed validation")

        return results

def _get_cache_key(self, control_id: str, system_config: Dict[str, Any]) -> str:
        """Generate cache key for validation results."""
        config_str = json.dumps(system_config, sort_keys=True)
        return hashlib.sha256(f"{control_id}:{config_str}".encode()).hexdigest()

def _is_cache_valid(self, result: ValidationResult) -> bool:
        """Check if cached result is still valid."""
        # Cache valid for 1 hour
        return datetime.now() - result.timestamp < timedelta(hours=1)

def get_validation_summary(self) -> Dict[str, Any]:
        """Get summary of all validation results."""
        if not self.validation_results:
            return {"status": "no_validations_performed"}

        passed = sum(1 for r in self.validation_results if r.status == "passed")
        failed = sum(1 for r in self.validation_results if r.status == "failed")
        warnings = sum(1 for r in self.validation_results if r.status == "warning")

        critical_failures = [
            r for r in self.validation_results
            if r.status == "failed" and r.severity == "critical"
        ]

        return {
            "total_validations": len(self.validation_results),
            "passed": passed,
            "failed": failed,
            "warnings": warnings,
            "compliance_percentage": (passed / len(self.validation_results)) * 100,
            "critical_failures": len(critical_failures),
            "last_validation": self.validation_results[-1].timestamp.isoformat() if self.validation_results else None
        }

def export_validation_evidence(self) -> List[Dict[str, Any]]:
        """Export validation evidence for audit purposes."""
        return [
            {
                "control_id": r.control_id,
                "control_name": r.control_name,
                "status": r.status,
                "timestamp": r.timestamp.isoformat(),
                "evidence": r.evidence,
                "severity": r.severity
            }
            for r in self.validation_results
        ]