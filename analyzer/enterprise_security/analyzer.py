from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
Security Analyzer
Orchestrates comprehensive security analysis.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
import json
import os

from .scanner import SecurityScanner, SecurityVulnerability
from .vulnerability_scanner import VulnerabilityScanner
from .compliance import ComplianceChecker, SecurityStandard, ComplianceViolation

class SecurityAnalyzer:
    """Main security analysis orchestrator."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.security_scanner = SecurityScanner(config)
        self.vulnerability_scanner = VulnerabilityScanner(config)
        self.compliance_checker = ComplianceChecker(config)

    def analyze_file(self, file_path: str) -> Dict[str, Any]:
        """Perform comprehensive security analysis on a file."""
        results = {
            "file_path": file_path,
            "timestamp": datetime.now().isoformat(),
            "vulnerabilities": [],
            "compliance_violations": [],
            "summary": {}
        }

        # Security vulnerability scan
        vulns = self.security_scanner.scan_file(file_path)
        ast_vulns = self.vulnerability_scanner.comprehensive_scan(file_path)

        all_vulns = vulns + ast_vulns
        results["vulnerabilities"] = [
            {
                "type": v.vuln_type.value,
                "severity": v.severity.value,
                "file": v.file_path,
                "line": v.line_number,
                "description": v.description,
                "evidence": v.evidence,
                "recommendation": v.recommendation,
                "cwe_id": v.cwe_id,
                "confidence": v.confidence
            }
            for v in all_vulns
        ]

        # Compliance check
        violations = self.compliance_checker.check_compliance(file_path)
        results["compliance_violations"] = [
            {
                "rule_id": v.rule.rule_id,
                "standard": v.rule.standard.value,
                "title": v.rule.title,
                "severity": v.rule.severity.value,
                "file": v.file_path,
                "line": v.line_number,
                "description": v.description,
                "evidence": v.evidence,
                "recommendation": v.recommendation
            }
            for v in violations
        ]

        # Generate summary
        results["summary"] = self._generate_file_summary(all_vulns, violations)

        return results

    def analyze_directory(self, directory: str) -> Dict[str, Any]:
        """Perform comprehensive security analysis on a directory."""
        results = {
            "directory": directory,
            "timestamp": datetime.now().isoformat(),
            "vulnerabilities": [],
            "compliance_violations": [],
            "summary": {},
            "file_reports": {}
        }

        all_vulnerabilities = []
        all_violations = []

        # Scan all files
        for root, dirs, files in os.walk(directory):
            # Skip common non-source directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['__pycache__', 'node_modules']]

            for file in files:
                if file.endswith(('.py', '.js', '.php', '.java', '.cpp', '.c')):
                    file_path = os.path.join(root, file)
                    file_results = self.analyze_file(file_path)

                    results["file_reports"][file_path] = file_results

                    # Aggregate vulnerabilities
                    file_vulns = self._parse_vulnerabilities_from_results(file_results)
                    all_vulnerabilities.extend(file_vulns)

                    # Aggregate violations
                    file_violations = self._parse_violations_from_results(file_results)
                    all_violations.extend(file_violations)

        # Security scan at directory level
        dir_vulns = self.security_scanner.scan_directory(directory)
        all_vulnerabilities.extend(dir_vulns)

        # Dependency vulnerability scan
        dep_vulns = self.vulnerability_scanner.scan_dependency_vulnerabilities(directory)
        all_vulnerabilities.extend(dep_vulns)

        # Generate aggregated results
        results["vulnerabilities"] = [
            {
                "type": v.vuln_type.value,
                "severity": v.severity.value,
                "file": v.file_path,
                "line": v.line_number,
                "description": v.description,
                "evidence": v.evidence,
                "recommendation": v.recommendation,
                "cwe_id": v.cwe_id,
                "confidence": v.confidence
            }
            for v in all_vulnerabilities
        ]

        results["compliance_violations"] = [
            {
                "rule_id": v.rule.rule_id,
                "standard": v.rule.standard.value,
                "title": v.rule.title,
                "severity": v.rule.severity.value,
                "file": v.file_path,
                "line": v.line_number,
                "description": v.description,
                "evidence": v.evidence,
                "recommendation": v.recommendation
            }
            for v in all_violations
        ]

        # Generate comprehensive summary
        results["summary"] = self._generate_directory_summary(all_vulnerabilities, all_violations, directory)

        return results

    def _parse_vulnerabilities_from_results(self, results: Dict[str, Any]) -> List[SecurityVulnerability]:
        """Parse vulnerabilities from analysis results."""
        vulnerabilities = []

        for vuln_data in results.get("vulnerabilities", []):
            # Create SecurityVulnerability objects from dict data
            pass  # Implementation would recreate objects

        return vulnerabilities

    def _parse_violations_from_results(self, results: Dict[str, Any]) -> List[ComplianceViolation]:
        """Parse compliance violations from analysis results."""
        violations = []

        for violation_data in results.get("compliance_violations", []):
            # Create ComplianceViolation objects from dict data
            pass  # Implementation would recreate objects

        return violations

    def _generate_file_summary(self, vulnerabilities: List[SecurityVulnerability], violations: List[ComplianceViolation]) -> Dict[str, Any]:
        """Generate summary for a single file."""
        vuln_severity_counts = {}
        violation_severity_counts = {}

        for vuln in vulnerabilities:
            severity = vuln.severity.value
            vuln_severity_counts[severity] = vuln_severity_counts.get(severity, 0) + 1

        for violation in violations:
            severity = violation.rule.severity.value
            violation_severity_counts[severity] = violation_severity_counts.get(severity, 0) + 1

        # Calculate security score (0-100, higher is better)
        total_issues = len(vulnerabilities) + len(violations)
        critical_issues = vuln_severity_counts.get('critical', 0) + violation_severity_counts.get('critical', 0)
        high_issues = vuln_severity_counts.get('high', 0) + violation_severity_counts.get('high', 0)

        security_score = max(0, 100 - (critical_issues * 25) - (high_issues * 15) - (total_issues * 5))

        return {
            "total_vulnerabilities": len(vulnerabilities),
            "total_violations": len(violations),
            "total_issues": total_issues,
            "security_score": security_score,
            "vulnerability_severity": vuln_severity_counts,
            "violation_severity": violation_severity_counts,
            "risk_level": self._calculate_risk_level(security_score)
        }

    def _generate_directory_summary(self, vulnerabilities: List[SecurityVulnerability], violations: List[ComplianceViolation], directory: str) -> Dict[str, Any]:
        """Generate summary for entire directory."""
        file_counts = {}
        vuln_type_counts = {}
        standard_counts = {}

        for vuln in vulnerabilities:
            file_counts[vuln.file_path] = file_counts.get(vuln.file_path, 0) + 1
            vuln_type = vuln.vuln_type.value
            vuln_type_counts[vuln_type] = vuln_type_counts.get(vuln_type, 0) + 1

        for violation in violations:
            file_counts[violation.file_path] = file_counts.get(violation.file_path, 0) + 1
            standard = violation.rule.standard.value
            standard_counts[standard] = standard_counts.get(standard, 0) + 1

        # Calculate overall security metrics
        total_files_scanned = len(file_counts)
        files_with_issues = len([f for f, count in file_counts.items() if count > 0])

        total_issues = len(vulnerabilities) + len(violations)
        critical_issues = sum(1 for v in vulnerabilities if v.severity.value == 'critical')
        critical_issues += sum(1 for v in violations if v.rule.severity.value == 'critical')

        overall_score = max(0, 100 - (critical_issues * 20) - (total_issues * 2))

        return {
            "total_files_scanned": total_files_scanned,
            "files_with_issues": files_with_issues,
            "total_vulnerabilities": len(vulnerabilities),
            "total_violations": len(violations),
            "total_issues": total_issues,
            "overall_security_score": overall_score,
            "vulnerability_types": vuln_type_counts,
            "standards_violated": standard_counts,
            "top_problematic_files": sorted(file_counts.items(), key=lambda x: x[1], reverse=True)[:10],
            "risk_assessment": self._assess_directory_risk(overall_score, critical_issues, total_issues)
        }

    def _calculate_risk_level(self, security_score: float) -> str:
        """Calculate risk level based on security score."""
        if security_score >= 90:
            return "LOW"
        elif security_score >= 70:
            return "MEDIUM"
        elif security_score >= 50:
            return "HIGH"
        else:
            return "CRITICAL"

    def _assess_directory_risk(self, overall_score: float, critical_issues: int, total_issues: int) -> Dict[str, Any]:
        """Assess overall risk for directory."""
        risk_level = self._calculate_risk_level(overall_score)

        recommendations = []
        if critical_issues > 0:
            recommendations.append("Address critical security issues immediately")
        if total_issues > 50:
            recommendations.append("Implement comprehensive security review process")
        if overall_score < 70:
            recommendations.append("Consider security training for development team")

        return {
            "risk_level": risk_level,
            "critical_issues_count": critical_issues,
            "total_issues_count": total_issues,
            "security_score": overall_score,
            "recommendations": recommendations,
            "requires_immediate_attention": critical_issues > 0 or overall_score < 50
        }

    def save_report(self, results: Dict[str, Any], output_path: str) -> None:
        """Save security analysis report to file."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

    def analyze_and_report(self, target_path: str, output_path: Optional[str] = None) -> Dict[str, Any]:
        """Complete security analysis workflow with report generation."""
        if validate_file(target_path):
            results = self.analyze_file(target_path)
        else:
            results = self.analyze_directory(target_path)

        if output_path:
            self.save_report(results, output_path)

        return results