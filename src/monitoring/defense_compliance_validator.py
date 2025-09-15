"""
Defense Industry Compliance Validator

Provides comprehensive compliance validation for defense industry
standards including NASA POT10, DFARS, FISMA, NIST, and ITAR requirements.
"""

import json
import time
import hashlib
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum
import logging
import re
from datetime import datetime, timedelta


class ComplianceLevel(Enum):
    """Defense compliance classification levels."""
    UNCLASSIFIED = "unclassified"
    CONFIDENTIAL = "confidential"
    SECRET = "secret"
    TOP_SECRET = "top_secret"
    SCI = "sci"  # Sensitive Compartmented Information


class ComplianceFramework(Enum):
    """Supported compliance frameworks."""
    NASA_POT10 = "nasa_pot10"
    DFARS = "dfars"
    FISMA = "fisma"
    NIST_CSF = "nist_csf"
    ITAR = "itar"
    CMMC = "cmmc"  # Cybersecurity Maturity Model Certification
    FedRAMP = "fedramp"


@dataclass
class ComplianceRequirement:
    """Individual compliance requirement."""
    id: str
    framework: ComplianceFramework
    title: str
    description: str
    classification_level: ComplianceLevel
    mandatory: bool
    weight: float = 1.0
    validation_method: str = "automated"
    acceptance_criteria: List[str] = field(default_factory=list)
    references: List[str] = field(default_factory=list)


@dataclass
class ComplianceViolation:
    """Compliance violation record."""
    requirement_id: str
    severity: str  # critical, high, medium, low
    description: str
    location: Optional[str] = None
    recommendation: Optional[str] = None
    remediation_time: Optional[int] = None  # estimated hours
    evidence: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ComplianceReport:
    """Comprehensive compliance assessment report."""
    assessment_id: str
    timestamp: float
    classification_level: ComplianceLevel
    frameworks: List[ComplianceFramework]
    overall_score: float
    framework_scores: Dict[ComplianceFramework, float]
    violations: List[ComplianceViolation]
    requirements_passed: int
    requirements_failed: int
    requirements_total: int
    defense_ready: bool
    recommendations: List[str]
    next_assessment_due: float


class NASAPot10Validator:
    """NASA POT10 (Product of Ten) safety requirements validator."""

    def __init__(self):
        self.requirements = self._initialize_pot10_requirements()
        self.logger = logging.getLogger('NASAPot10Validator')

    def _initialize_pot10_requirements(self) -> List[ComplianceRequirement]:
        """Initialize NASA POT10 requirements."""
        return [
            ComplianceRequirement(
                id="POT10-1",
                framework=ComplianceFramework.NASA_POT10,
                title="Error Handling and Recovery",
                description="All error conditions must be explicitly handled with appropriate recovery mechanisms",
                classification_level=ComplianceLevel.UNCLASSIFIED,
                mandatory=True,
                weight=2.0,
                acceptance_criteria=[
                    "100% of functions have error handling",
                    "All exceptions are caught and logged",
                    "System maintains safe state during errors",
                    "Recovery procedures are documented"
                ]
            ),
            ComplianceRequirement(
                id="POT10-2",
                framework=ComplianceFramework.NASA_POT10,
                title="Resource Management",
                description="All system resources must be explicitly managed and released",
                classification_level=ComplianceLevel.UNCLASSIFIED,
                mandatory=True,
                weight=1.5,
                acceptance_criteria=[
                    "No memory leaks detected",
                    "All file handles are properly closed",
                    "Database connections are managed",
                    "Thread pools are properly sized"
                ]
            ),
            ComplianceRequirement(
                id="POT10-3",
                framework=ComplianceFramework.NASA_POT10,
                title="Interface Validation",
                description="All system interfaces must validate inputs and outputs",
                classification_level=ComplianceLevel.UNCLASSIFIED,
                mandatory=True,
                weight=1.8,
                acceptance_criteria=[
                    "Input validation on all entry points",
                    "Output sanitization implemented",
                    "Type checking enforced",
                    "Boundary conditions tested"
                ]
            ),
            ComplianceRequirement(
                id="POT10-4",
                framework=ComplianceFramework.NASA_POT10,
                title="Fault Tolerance",
                description="System must gracefully handle component failures",
                classification_level=ComplianceLevel.UNCLASSIFIED,
                mandatory=True,
                weight=2.0,
                acceptance_criteria=[
                    "Redundant systems available",
                    "Failover mechanisms tested",
                    "Data integrity maintained during failures",
                    "Service degradation is graceful"
                ]
            ),
            ComplianceRequirement(
                id="POT10-5",
                framework=ComplianceFramework.NASA_POT10,
                title="Documentation and Traceability",
                description="Complete documentation and requirement traceability",
                classification_level=ComplianceLevel.UNCLASSIFIED,
                mandatory=True,
                weight=1.0,
                acceptance_criteria=[
                    "All requirements traceable to code",
                    "API documentation complete",
                    "Architecture documentation current",
                    "Change management procedures followed"
                ]
            )
        ]

    def validate(self, source_path: Path, context: Dict[str, Any]) -> Tuple[float, List[ComplianceViolation]]:
        """Validate NASA POT10 compliance."""
        violations = []
        total_score = 0.0
        total_weight = sum(req.weight for req in self.requirements)

        for requirement in self.requirements:
            req_score, req_violations = self._validate_requirement(requirement, source_path, context)
            total_score += req_score * requirement.weight
            violations.extend(req_violations)

        final_score = (total_score / total_weight) * 100 if total_weight > 0 else 0.0

        return final_score, violations

    def _validate_requirement(self, requirement: ComplianceRequirement,
                            source_path: Path, context: Dict[str, Any]) -> Tuple[float, List[ComplianceViolation]]:
        """Validate a specific NASA POT10 requirement."""
        if requirement.id == "POT10-1":
            return self._validate_error_handling(source_path)
        elif requirement.id == "POT10-2":
            return self._validate_resource_management(source_path)
        elif requirement.id == "POT10-3":
            return self._validate_interface_validation(source_path)
        elif requirement.id == "POT10-4":
            return self._validate_fault_tolerance(source_path, context)
        elif requirement.id == "POT10-5":
            return self._validate_documentation(source_path)
        else:
            return 0.0, []

    def _validate_error_handling(self, source_path: Path) -> Tuple[float, List[ComplianceViolation]]:
        """Validate error handling implementation."""
        violations = []
        python_files = list(source_path.rglob("*.py"))

        if not python_files:
            return 100.0, violations  # No Python files to check

        total_functions = 0
        functions_with_error_handling = 0

        for file_path in python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Count functions and methods
                function_patterns = [
                    r'def\s+\w+\s*\(',
                    r'async\s+def\s+\w+\s*\('
                ]

                for pattern in function_patterns:
                    functions = re.findall(pattern, content)
                    total_functions += len(functions)

                    # Check for try-except blocks near function definitions
                    try_except_count = len(re.findall(r'try\s*:', content))
                    functions_with_error_handling += min(len(functions), try_except_count)

            except Exception as e:
                violations.append(ComplianceViolation(
                    requirement_id="POT10-1",
                    severity="medium",
                    description=f"Could not analyze file {file_path}: {e}",
                    location=str(file_path)
                ))

        if total_functions == 0:
            error_handling_ratio = 1.0
        else:
            error_handling_ratio = functions_with_error_handling / total_functions

        # Require at least 90% of functions to have error handling
        if error_handling_ratio < 0.9:
            violations.append(ComplianceViolation(
                requirement_id="POT10-1",
                severity="high",
                description=f"Only {error_handling_ratio:.1%} of functions have error handling (required: 90%)",
                recommendation="Add try-except blocks to handle exceptions in all functions",
                remediation_time=8
            ))

        score = error_handling_ratio * 100
        return score, violations

    def _validate_resource_management(self, source_path: Path) -> Tuple[float, List[ComplianceViolation]]:
        """Validate resource management practices."""
        violations = []
        python_files = list(source_path.rglob("*.py"))

        resource_issues = 0
        total_checks = 0

        for file_path in python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Check for common resource management issues
                checks = [
                    (r'open\s*\(.*\)', r'with\s+open\s*\(.*\):', "File handles should use 'with' statement"),
                    (r'\.connect\s*\(', r'with.*\.connect\s*\(', "Database connections should use context managers"),
                    (r'threading\.Thread\s*\(', r'ThreadPoolExecutor|concurrent\.futures', "Use thread pools instead of raw threads")
                ]

                for bad_pattern, good_pattern, message in checks:
                    bad_matches = len(re.findall(bad_pattern, content))
                    good_matches = len(re.findall(good_pattern, content))

                    total_checks += bad_matches

                    # If we have bad patterns without corresponding good patterns
                    if bad_matches > good_matches:
                        resource_issues += (bad_matches - good_matches)
                        violations.append(ComplianceViolation(
                            requirement_id="POT10-2",
                            severity="medium",
                            description=f"{message} in {file_path}",
                            location=str(file_path),
                            recommendation=message
                        ))

            except Exception as e:
                violations.append(ComplianceViolation(
                    requirement_id="POT10-2",
                    severity="low",
                    description=f"Could not analyze file {file_path}: {e}",
                    location=str(file_path)
                ))

        if total_checks == 0:
            score = 100.0
        else:
            resource_management_ratio = 1.0 - (resource_issues / total_checks)
            score = max(0, resource_management_ratio * 100)

        return score, violations

    def _validate_interface_validation(self, source_path: Path) -> Tuple[float, List[ComplianceViolation]]:
        """Validate input/output validation implementation."""
        violations = []
        python_files = list(source_path.rglob("*.py"))

        validation_score = 0.0
        file_count = 0

        for file_path in python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                file_count += 1
                file_score = 0.0

                # Check for validation patterns
                validation_patterns = [
                    r'isinstance\s*\(',
                    r'assert\s+',
                    r'if.*is\s+None',
                    r'validate\w*\s*\(',
                    r'@.*validator',
                    r'pydantic',
                    r'marshmallow'
                ]

                validation_count = 0
                for pattern in validation_patterns:
                    validation_count += len(re.findall(pattern, content, re.IGNORECASE))

                # Score based on validation density
                lines_of_code = len([line for line in content.split('\n') if line.strip() and not line.strip().startswith('#')])

                if lines_of_code > 0:
                    validation_density = validation_count / lines_of_code
                    file_score = min(100, validation_density * 1000)  # Scale factor

                validation_score += file_score

                # Flag files with very low validation
                if file_score < 10 and lines_of_code > 50:
                    violations.append(ComplianceViolation(
                        requirement_id="POT10-3",
                        severity="medium",
                        description=f"Low input validation density in {file_path}",
                        location=str(file_path),
                        recommendation="Add input validation checks for function parameters and user inputs"
                    ))

            except Exception as e:
                violations.append(ComplianceViolation(
                    requirement_id="POT10-3",
                    severity="low",
                    description=f"Could not analyze file {file_path}: {e}",
                    location=str(file_path)
                ))

        final_score = (validation_score / file_count) if file_count > 0 else 100.0
        return min(100.0, final_score), violations

    def _validate_fault_tolerance(self, source_path: Path, context: Dict[str, Any]) -> Tuple[float, List[ComplianceViolation]]:
        """Validate fault tolerance mechanisms."""
        violations = []

        # Check for fault tolerance patterns in code
        fault_tolerance_indicators = [
            "retry",
            "fallback",
            "circuit_breaker",
            "redundant",
            "backup",
            "failover"
        ]

        indicator_count = 0
        python_files = list(source_path.rglob("*.py"))

        for file_path in python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().lower()

                for indicator in fault_tolerance_indicators:
                    indicator_count += content.count(indicator)

            except Exception:
                pass

        # Check configuration files for fault tolerance settings
        config_files = list(source_path.rglob("*.yaml")) + list(source_path.rglob("*.yml")) + list(source_path.rglob("*.json"))

        for config_file in config_files:
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    content = f.read().lower()

                for indicator in fault_tolerance_indicators:
                    indicator_count += content.count(indicator)

            except Exception:
                pass

        # Score based on fault tolerance indicators
        if indicator_count >= 10:
            score = 100.0
        elif indicator_count >= 5:
            score = 80.0
        elif indicator_count >= 2:
            score = 60.0
        else:
            score = 30.0
            violations.append(ComplianceViolation(
                requirement_id="POT10-4",
                severity="high",
                description="Insufficient fault tolerance mechanisms detected",
                recommendation="Implement retry logic, fallback mechanisms, and redundant systems",
                remediation_time=16
            ))

        return score, violations

    def _validate_documentation(self, source_path: Path) -> Tuple[float, List[ComplianceViolation]]:
        """Validate documentation completeness."""
        violations = []

        # Check for documentation files
        doc_files = []
        doc_patterns = ["README*", "*.md", "docs/**/*", "doc/**/*"]

        for pattern in doc_patterns:
            doc_files.extend(source_path.rglob(pattern))

        documentation_score = 0.0

        # Basic documentation presence
        required_docs = ["README", "API", "ARCHITECTURE", "CHANGELOG"]
        found_docs = 0

        for doc_file in doc_files:
            content = doc_file.name.upper()
            for required in required_docs:
                if required in content:
                    found_docs += 1
                    break

        documentation_score += (found_docs / len(required_docs)) * 40  # 40% for basic docs

        # Code documentation (docstrings)
        python_files = list(source_path.rglob("*.py"))
        total_functions = 0
        documented_functions = 0

        for file_path in python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Count functions
                functions = re.findall(r'def\s+\w+\s*\(', content)
                total_functions += len(functions)

                # Count docstrings (simplified check)
                docstrings = re.findall(r'""".*?"""', content, re.DOTALL)
                docstrings += re.findall(r"'''.*?'''", content, re.DOTALL)
                documented_functions += min(len(functions), len(docstrings))

            except Exception:
                pass

        if total_functions > 0:
            docstring_ratio = documented_functions / total_functions
            documentation_score += docstring_ratio * 60  # 60% for code documentation
        else:
            documentation_score += 60  # No functions to document

        # Check for insufficient documentation
        if documentation_score < 70:
            violations.append(ComplianceViolation(
                requirement_id="POT10-5",
                severity="medium",
                description=f"Documentation completeness is {documentation_score:.1f}% (required: 70%)",
                recommendation="Add missing documentation files and function docstrings",
                remediation_time=12
            ))

        return documentation_score, violations


class DFARSValidator:
    """DFARS (Defense Federal Acquisition Regulation Supplement) validator."""

    def __init__(self):
        self.logger = logging.getLogger('DFARSValidator')

    def validate(self, source_path: Path, context: Dict[str, Any]) -> Tuple[float, List[ComplianceViolation]]:
        """Validate DFARS compliance requirements."""
        violations = []
        classification = context.get('classification_level', ComplianceLevel.UNCLASSIFIED)

        # DFARS compliance checks
        supply_chain_score = self._validate_supply_chain_security(source_path)
        data_protection_score = self._validate_data_protection(source_path, classification)
        access_control_score = self._validate_access_controls(source_path)

        # Weight scores based on classification level
        if classification in [ComplianceLevel.SECRET, ComplianceLevel.TOP_SECRET]:
            weights = {"supply_chain": 0.4, "data_protection": 0.4, "access_control": 0.2}
            required_minimum = 95.0
        elif classification == ComplianceLevel.CONFIDENTIAL:
            weights = {"supply_chain": 0.3, "data_protection": 0.4, "access_control": 0.3}
            required_minimum = 90.0
        else:
            weights = {"supply_chain": 0.3, "data_protection": 0.3, "access_control": 0.4}
            required_minimum = 85.0

        overall_score = (
            supply_chain_score * weights["supply_chain"] +
            data_protection_score * weights["data_protection"] +
            access_control_score * weights["access_control"]
        )

        if overall_score < required_minimum:
            violations.append(ComplianceViolation(
                requirement_id="DFARS-OVERALL",
                severity="critical",
                description=f"DFARS compliance score {overall_score:.1f}% below required {required_minimum}%",
                recommendation=f"Improve supply chain security, data protection, and access controls for {classification.value} systems"
            ))

        return overall_score, violations

    def _validate_supply_chain_security(self, source_path: Path) -> float:
        """Validate supply chain security measures."""
        # Check for dependency scanning and SBOM generation
        score = 80.0  # Base score

        # Look for security scanning configurations
        security_files = list(source_path.rglob("*.security")) + list(source_path.rglob("security.*"))
        if security_files:
            score += 10.0

        # Check for SBOM files
        sbom_files = list(source_path.rglob("*sbom*")) + list(source_path.rglob("*SBOM*"))
        if sbom_files:
            score += 10.0

        return min(100.0, score)

    def _validate_data_protection(self, source_path: Path, classification: ComplianceLevel) -> float:
        """Validate data protection measures."""
        score = 70.0  # Base score

        # Check for encryption implementations
        python_files = list(source_path.rglob("*.py"))
        encryption_indicators = 0

        for file_path in python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().lower()

                encryption_terms = ["encrypt", "decrypt", "aes", "rsa", "cryptography", "cipher"]
                for term in encryption_terms:
                    if term in content:
                        encryption_indicators += 1
                        break

            except Exception:
                pass

        if encryption_indicators > 0:
            score += 20.0

        # Higher requirements for classified data
        if classification in [ComplianceLevel.SECRET, ComplianceLevel.TOP_SECRET]:
            score *= 0.9  # Stricter requirements

        return min(100.0, score)

    def _validate_access_controls(self, source_path: Path) -> float:
        """Validate access control implementations."""
        score = 75.0  # Base score

        # Check for authentication and authorization code
        python_files = list(source_path.rglob("*.py"))
        auth_indicators = 0

        for file_path in python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().lower()

                auth_terms = ["authenticate", "authorize", "permission", "role", "jwt", "oauth", "rbac"]
                for term in auth_terms:
                    if term in content:
                        auth_indicators += 1
                        break

            except Exception:
                pass

        if auth_indicators > 0:
            score += 25.0

        return min(100.0, score)


class DefenseComplianceValidator:
    """Main defense industry compliance validator."""

    def __init__(self, classification_level: ComplianceLevel = ComplianceLevel.UNCLASSIFIED):
        self.classification_level = classification_level
        self.validators = {
            ComplianceFramework.NASA_POT10: NASAPot10Validator(),
            ComplianceFramework.DFARS: DFARSValidator()
        }
        self.logger = logging.getLogger('DefenseComplianceValidator')

    def validate_all_frameworks(self, source_path: Path,
                              frameworks: List[ComplianceFramework] = None,
                              context: Dict[str, Any] = None) -> ComplianceReport:
        """Validate compliance across all specified frameworks."""

        if frameworks is None:
            frameworks = [ComplianceFramework.NASA_POT10, ComplianceFramework.DFARS]

        if context is None:
            context = {}

        context['classification_level'] = self.classification_level

        # Generate assessment ID
        assessment_id = self._generate_assessment_id()

        framework_scores = {}
        all_violations = []
        total_requirements = 0
        requirements_passed = 0
        requirements_failed = 0

        # Validate each framework
        for framework in frameworks:
            if framework in self.validators:
                self.logger.info(f"Validating {framework.value} compliance")

                try:
                    score, violations = self.validators[framework].validate(source_path, context)
                    framework_scores[framework] = score
                    all_violations.extend(violations)

                    # Count requirements (simplified)
                    framework_requirements = len(violations) + 5  # Assume 5 base requirements per framework
                    total_requirements += framework_requirements

                    if score >= 90.0:
                        requirements_passed += framework_requirements
                    else:
                        requirements_failed += len(violations)
                        requirements_passed += framework_requirements - len(violations)

                except Exception as e:
                    self.logger.error(f"Failed to validate {framework.value}: {e}")
                    framework_scores[framework] = 0.0
                    all_violations.append(ComplianceViolation(
                        requirement_id=f"{framework.value.upper()}-ERROR",
                        severity="critical",
                        description=f"Validation failed: {e}"
                    ))
            else:
                self.logger.warning(f"No validator available for {framework.value}")
                framework_scores[framework] = 0.0

        # Calculate overall score
        if framework_scores:
            overall_score = sum(framework_scores.values()) / len(framework_scores)
        else:
            overall_score = 0.0

        # Determine defense readiness
        defense_ready = (
            overall_score >= 90.0 and
            len([v for v in all_violations if v.severity == "critical"]) == 0 and
            self.classification_level in [ComplianceLevel.UNCLASSIFIED, ComplianceLevel.CONFIDENTIAL] or overall_score >= 95.0
        )

        # Generate recommendations
        recommendations = self._generate_recommendations(all_violations, framework_scores)

        # Calculate next assessment due date (6 months for high classification, 1 year for lower)
        if self.classification_level in [ComplianceLevel.SECRET, ComplianceLevel.TOP_SECRET]:
            next_assessment = time.time() + (6 * 30 * 24 * 3600)  # 6 months
        else:
            next_assessment = time.time() + (12 * 30 * 24 * 3600)  # 12 months

        return ComplianceReport(
            assessment_id=assessment_id,
            timestamp=time.time(),
            classification_level=self.classification_level,
            frameworks=frameworks,
            overall_score=overall_score,
            framework_scores=framework_scores,
            violations=all_violations,
            requirements_passed=requirements_passed,
            requirements_failed=requirements_failed,
            requirements_total=total_requirements,
            defense_ready=defense_ready,
            recommendations=recommendations,
            next_assessment_due=next_assessment
        )

    def _generate_assessment_id(self) -> str:
        """Generate unique assessment ID."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        hash_input = f"{timestamp}_{self.classification_level.value}"
        hash_suffix = hashlib.md5(hash_input.encode()).hexdigest()[:8]
        return f"DEFENSE_ASSESS_{timestamp}_{hash_suffix}"

    def _generate_recommendations(self, violations: List[ComplianceViolation],
                                framework_scores: Dict[ComplianceFramework, float]) -> List[str]:
        """Generate prioritized recommendations based on violations and scores."""
        recommendations = []

        # Critical violations first
        critical_violations = [v for v in violations if v.severity == "critical"]
        if critical_violations:
            recommendations.append(
                f"CRITICAL: Address {len(critical_violations)} critical compliance violations immediately"
            )

        # Framework-specific recommendations
        for framework, score in framework_scores.items():
            if score < 70.0:
                recommendations.append(
                    f"Significant improvement needed in {framework.value} compliance (current: {score:.1f}%)"
                )
            elif score < 90.0:
                recommendations.append(
                    f"Minor improvements needed in {framework.value} compliance (current: {score:.1f}%)"
                )

        # Classification-specific recommendations
        if self.classification_level in [ComplianceLevel.SECRET, ComplianceLevel.TOP_SECRET]:
            if any(score < 95.0 for score in framework_scores.values()):
                recommendations.append(
                    "Classified systems require 95% compliance across all frameworks"
                )

        # General recommendations
        high_violations = [v for v in violations if v.severity == "high"]
        if len(high_violations) > 5:
            recommendations.append(
                f"Address {len(high_violations)} high-severity violations to improve overall compliance"
            )

        return recommendations[:10]  # Limit to top 10 recommendations

    def export_report(self, report: ComplianceReport, output_path: Path, format: str = "json"):
        """Export compliance report to file."""

        if format == "json":
            report_data = {
                "assessment_id": report.assessment_id,
                "timestamp": report.timestamp,
                "assessment_date": datetime.fromtimestamp(report.timestamp).isoformat(),
                "classification_level": report.classification_level.value,
                "frameworks": [f.value for f in report.frameworks],
                "overall_score": report.overall_score,
                "framework_scores": {f.value: score for f, score in report.framework_scores.items()},
                "violations": [
                    {
                        "requirement_id": v.requirement_id,
                        "severity": v.severity,
                        "description": v.description,
                        "location": v.location,
                        "recommendation": v.recommendation,
                        "remediation_time": v.remediation_time
                    }
                    for v in report.violations
                ],
                "requirements_summary": {
                    "passed": report.requirements_passed,
                    "failed": report.requirements_failed,
                    "total": report.requirements_total,
                    "pass_rate": (report.requirements_passed / report.requirements_total * 100) if report.requirements_total > 0 else 0
                },
                "defense_ready": report.defense_ready,
                "recommendations": report.recommendations,
                "next_assessment_due": datetime.fromtimestamp(report.next_assessment_due).isoformat()
            }

            with open(output_path, 'w') as f:
                json.dump(report_data, f, indent=2)

        self.logger.info(f"Compliance report exported to {output_path}")

    def is_defense_ready(self, report: ComplianceReport) -> bool:
        """Determine if system is ready for defense industry deployment."""
        return report.defense_ready


# Example usage
if __name__ == "__main__":
    # Initialize validator for SECRET classification
    validator = DefenseComplianceValidator(ComplianceLevel.SECRET)

    # Set source path (use current directory for demo)
    source_path = Path(".")

    # Run compliance validation
    print("=== Defense Industry Compliance Validation ===")
    print(f"Classification Level: {validator.classification_level.value.upper()}")
    print()

    frameworks = [ComplianceFramework.NASA_POT10, ComplianceFramework.DFARS]

    report = validator.validate_all_frameworks(
        source_path=source_path,
        frameworks=frameworks,
        context={"environment": "production", "region": "US"}
    )

    # Display results
    print(f"Assessment ID: {report.assessment_id}")
    print(f"Overall Compliance Score: {report.overall_score:.1f}%")
    print(f"Defense Ready: {'YES' if report.defense_ready else 'NO'}")
    print()

    print("Framework Scores:")
    for framework, score in report.framework_scores.items():
        status = "PASS" if score >= 90.0 else "FAIL"
        print(f"  {framework.value}: {score:.1f}% [{status}]")
    print()

    print(f"Requirements: {report.requirements_passed}/{report.requirements_total} passed")
    print(f"Violations: {len(report.violations)} total")

    if report.violations:
        print("\\nTop Violations:")
        critical_violations = [v for v in report.violations if v.severity == "critical"][:3]
        high_violations = [v for v in report.violations if v.severity == "high"][:3]

        for violation in critical_violations + high_violations:
            print(f"  [{violation.severity.upper()}] {violation.requirement_id}: {violation.description}")

    if report.recommendations:
        print("\\nTop Recommendations:")
        for i, rec in enumerate(report.recommendations[:5], 1):
            print(f"  {i}. {rec}")

    # Export report
    output_path = Path("defense_compliance_report.json")
    validator.export_report(report, output_path)
    print(f"\\nReport exported to {output_path}")