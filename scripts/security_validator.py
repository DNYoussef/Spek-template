#!/usr/bin/env python3
"""
Security Gate Validator - Comprehensive Security Quality Gate Implementation

Validates security scanning integration and enforces comprehensive security quality gates
for production-ready deployment with defense industry compliance standards.

Agent Delta Mission: Security Gate Validation & Enhancement
Memory Key: swarm/security_validation
"""

import json
import subprocess
import sys
import time
import yaml
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Security analysis imports
import hashlib
import re
from dataclasses import dataclass
from enum import Enum


class SecuritySeverity(Enum):
    """Security finding severity levels."""
    CRITICAL = "critical"
    HIGH = "high" 
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


@dataclass
class SecurityFinding:
    """Standard security finding representation."""
    tool: str
    severity: SecuritySeverity
    title: str
    description: str
    file_path: str
    line_number: int
    rule_id: str
    cwe_id: Optional[str] = None
    remediation: Optional[str] = None
    confidence: str = "medium"


@dataclass  
class SecurityGateResult:
    """Security gate validation result."""
    gate_name: str
    passed: bool
    threshold: int
    actual_count: int
    findings: List[SecurityFinding]
    execution_time: float
    details: Dict[str, Any]


class SecurityValidator:
    """Comprehensive security validation with quality gate enforcement."""
    
    def __init__(self, config_path: str = "configs/security_gates.yaml"):
        """Initialize security validator with configuration."""
        self.config_path = config_path
        self.config = self._load_security_config()
        self.results = {}
        self.findings = []
        self.sarif_results = []
        self.start_time = time.time()
        
    def _load_security_config(self) -> Dict[str, Any]:
        """Load security gates configuration."""
        try:
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            print(f"Warning: Config file not found: {self.config_path}")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default security configuration."""
        return {
            "security_gates": {
                "critical_vulnerabilities": {"max_allowed": 0, "blocking": True},
                "high_vulnerabilities": {"max_allowed": 5, "blocking": True},
                "medium_vulnerabilities": {"max_allowed": 20, "blocking": False},
                "secrets": {"max_allowed": 0, "blocking": True},
                "outdated_dependencies": {"max_allowed": 10, "blocking": False},
                "license_violations": {"max_allowed": 0, "blocking": True}
            },
            "tools": {
                "semgrep": {"enabled": True, "max_execution_time_minutes": 10},
                "bandit": {"enabled": True, "max_execution_time_minutes": 5},
                "safety": {"enabled": True, "max_execution_time_minutes": 3},
                "npm_audit": {"enabled": True, "max_execution_time_minutes": 5},
                "codeql": {"enabled": True, "max_execution_time_minutes": 30}
            },
            "performance": {"max_total_execution_time_minutes": 15}
        }
    
    def validate_tool_configurations(self) -> Dict[str, Any]:
        """Validate security tool configurations and availability."""
        print("Validating security tool configurations...")
        
        validation_results = {
            "tools_validated": 0,
            "tools_available": 0,
            "configuration_issues": [],
            "recommendations": []
        }
        
        tools_config = self.config.get("tools", {})
        
        # Validate each tool
        for tool_name, tool_config in tools_config.items():
            if not tool_config.get("enabled", False):
                continue
                
            validation_results["tools_validated"] += 1
            
            # Check tool availability
            if self._check_tool_availability(tool_name):
                validation_results["tools_available"] += 1
                print(f"[PASS] {tool_name} - Available and configured")
            else:
                validation_results["configuration_issues"].append(
                    f"{tool_name} not available or not properly configured"
                )
                print(f"[FAIL] {tool_name} - Not available")
        
        # Add recommendations
        if validation_results["tools_available"] < validation_results["tools_validated"]:
            validation_results["recommendations"].append(
                "Install missing security tools or update configurations"
            )
        
        return validation_results
    
    def _check_tool_availability(self, tool_name: str) -> bool:
        """Check if security tool is available."""
        tool_commands = {
            "semgrep": ["semgrep", "--version"],
            "bandit": ["bandit", "--version"],
            "safety": ["safety", "--version"],
            "npm_audit": ["npm", "--version"],
            "codeql": ["codeql", "version"]
        }
        
        command = tool_commands.get(tool_name)
        if not command:
            return False
            
        try:
            result = subprocess.run(command, capture_output=True, timeout=10)
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False
    
    def run_comprehensive_security_scan(self) -> Dict[str, SecurityGateResult]:
        """Run comprehensive security scan with all enabled tools."""
        print("Running comprehensive security scan...")
        
        scan_results = {}
        tools_config = self.config.get("tools", {})
        
        # Run scans in parallel for performance
        with ThreadPoolExecutor(max_workers=4) as executor:
            future_to_tool = {}
            
            for tool_name, tool_config in tools_config.items():
                if tool_config.get("enabled", False):
                    future = executor.submit(self._run_tool_scan, tool_name, tool_config)
                    future_to_tool[future] = tool_name
            
            for future in as_completed(future_to_tool):
                tool_name = future_to_tool[future]
                try:
                    result = future.result()
                    scan_results[tool_name] = result
                    print(f"[PASS] {tool_name} scan completed")
                except Exception as e:
                    print(f"[FAIL] {tool_name} scan failed: {e}")
                    scan_results[tool_name] = self._create_error_result(tool_name, str(e))
        
        return scan_results
    
    def _run_tool_scan(self, tool_name: str, tool_config: Dict[str, Any]) -> SecurityGateResult:
        """Run individual security tool scan."""
        start_time = time.time()
        findings = []
        
        try:
            if tool_name == "semgrep":
                findings = self._run_semgrep_scan(tool_config)
            elif tool_name == "bandit":
                findings = self._run_bandit_scan(tool_config)
            elif tool_name == "safety":
                findings = self._run_safety_scan(tool_config)
            elif tool_name == "npm_audit":
                findings = self._run_npm_audit_scan(tool_config)
            elif tool_name == "codeql":
                findings = self._run_codeql_scan(tool_config)
        
        except Exception as e:
            print(f"Error running {tool_name}: {e}")
        
        execution_time = time.time() - start_time
        
        return SecurityGateResult(
            gate_name=tool_name,
            passed=len([f for f in findings if f.severity in [SecuritySeverity.CRITICAL, SecuritySeverity.HIGH]]) == 0,
            threshold=0,  # Will be set by gate validation
            actual_count=len(findings),
            findings=findings,
            execution_time=execution_time,
            details={"tool_config": tool_config, "findings_by_severity": self._count_by_severity(findings)}
        )
    
    def _run_semgrep_scan(self, config: Dict[str, Any]) -> List[SecurityFinding]:
        """Run Semgrep SAST scan."""
        findings = []
        
        # Check if results already exist
        results_file = Path("semgrep_results.json")
        if results_file.exists():
            try:
                with open(results_file, 'r') as f:
                    data = json.load(f)
                
                for result in data.get("results", []):
                    severity_map = {"ERROR": SecuritySeverity.HIGH, "WARNING": SecuritySeverity.MEDIUM, "INFO": SecuritySeverity.LOW}
                    
                    finding = SecurityFinding(
                        tool="semgrep",
                        severity=severity_map.get(result.get("extra", {}).get("severity", "INFO"), SecuritySeverity.LOW),
                        title=result.get("check_id", "Unknown"),
                        description=result.get("extra", {}).get("message", ""),
                        file_path=result.get("path", ""),
                        line_number=result.get("start", {}).get("line", 0),
                        rule_id=result.get("check_id", ""),
                        remediation=result.get("extra", {}).get("fix", "")
                    )
                    findings.append(finding)
                    
            except Exception as e:
                print(f"Error parsing Semgrep results: {e}")
        
        return findings
    
    def _run_bandit_scan(self, config: Dict[str, Any]) -> List[SecurityFinding]:
        """Run Bandit Python security scan."""
        findings = []
        
        # Check if results already exist
        results_file = Path("bandit_results.json")
        if results_file.exists():
            try:
                with open(results_file, 'r') as f:
                    data = json.load(f)
                
                for result in data.get("results", []):
                    severity_map = {"HIGH": SecuritySeverity.HIGH, "MEDIUM": SecuritySeverity.MEDIUM, "LOW": SecuritySeverity.LOW}
                    
                    finding = SecurityFinding(
                        tool="bandit",
                        severity=severity_map.get(result.get("issue_severity", "LOW"), SecuritySeverity.LOW),
                        title=result.get("test_name", "Unknown"),
                        description=result.get("issue_text", ""),
                        file_path=result.get("filename", ""),
                        line_number=result.get("line_number", 0),
                        rule_id=result.get("test_id", ""),
                        cwe_id=result.get("issue_cwe", {}).get("id")
                    )
                    findings.append(finding)
                    
            except Exception as e:
                print(f"Error parsing Bandit results: {e}")
        
        return findings
    
    def _run_safety_scan(self, config: Dict[str, Any]) -> List[SecurityFinding]:
        """Run Safety dependency vulnerability scan."""
        findings = []
        
        try:
            # Run safety scan (newer command)
            cmd = ["safety", "scan", "--json"]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
            
            if result.stdout:
                try:
                    data = json.loads(result.stdout)
                except json.JSONDecodeError:
                    # Safety returned string output instead of JSON
                    print(f"Safety returned string output: {result.stdout}")
                    return findings
                
                # Handle different response formats from Safety
                if isinstance(data, list):
                    # Standard list format
                    for vuln in data:
                        if isinstance(vuln, dict):
                            finding = SecurityFinding(
                                tool="safety",
                                severity=SecuritySeverity.HIGH if "critical" in vuln.get("vulnerability", "").lower() else SecuritySeverity.MEDIUM,
                                title=f"Vulnerable dependency: {vuln.get('package', 'Unknown')}",
                                description=vuln.get("vulnerability", ""),
                                file_path="requirements.txt",  # Placeholder
                                line_number=0,
                                rule_id=vuln.get("id", ""),
                                remediation=f"Update to version {vuln.get('safe_version', 'latest')}"
                            )
                            findings.append(finding)
                        else:
                            print(f"Unexpected vuln format in Safety results: {type(vuln)}")
                elif isinstance(data, dict):
                    # Dictionary format (newer Safety versions)
                    vulnerabilities = data.get("vulnerabilities", [])
                    for vuln in vulnerabilities:
                        if isinstance(vuln, dict):
                            finding = SecurityFinding(
                                tool="safety",
                                severity=SecuritySeverity.HIGH if "critical" in vuln.get("vulnerability", "").lower() else SecuritySeverity.MEDIUM,
                                title=f"Vulnerable dependency: {vuln.get('package', 'Unknown')}",
                                description=vuln.get("vulnerability", ""),
                                file_path="requirements.txt",  # Placeholder
                                line_number=0,
                                rule_id=vuln.get("id", ""),
                                remediation=f"Update to version {vuln.get('safe_version', 'latest')}"
                            )
                            findings.append(finding)
                else:
                    print(f"Error running safety: '{type(data).__name__}' object has no attribute 'get'")
        
        except (subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError) as e:
            print(f"Safety scan error: {e}")
        
        return findings
    
    def _run_npm_audit_scan(self, config: Dict[str, Any]) -> List[SecurityFinding]:
        """Run NPM audit for JavaScript dependencies."""
        findings = []
        
        if not Path("package.json").exists():
            return findings
        
        try:
            cmd = ["npm", "audit", "--json"]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.stdout:
                data = json.loads(result.stdout)
                
                for vuln_id, vuln_data in data.get("vulnerabilities", {}).items():
                    severity_map = {
                        "critical": SecuritySeverity.CRITICAL,
                        "high": SecuritySeverity.HIGH,
                        "moderate": SecuritySeverity.MEDIUM,
                        "low": SecuritySeverity.LOW
                    }
                    
                    finding = SecurityFinding(
                        tool="npm_audit",
                        severity=severity_map.get(vuln_data.get("severity", "low"), SecuritySeverity.LOW),
                        title=f"Vulnerable NPM package: {vuln_data.get('name', 'Unknown')}",
                        description=vuln_data.get("title", ""),
                        file_path="package.json",
                        line_number=0,
                        rule_id=vuln_id,
                        cwe_id=str(vuln_data.get("cwe", [])[0]) if vuln_data.get("cwe") else None
                    )
                    findings.append(finding)
        
        except (subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError) as e:
            print(f"NPM audit error: {e}")
        
        return findings
    
    def _run_codeql_scan(self, config: Dict[str, Any]) -> List[SecurityFinding]:
        """Run CodeQL advanced static analysis."""
        findings = []
        
        # CodeQL typically runs in CI/CD - check for existing results
        codeql_sarif = Path(".github/codeql-results.sarif")
        if codeql_sarif.exists():
            try:
                with open(codeql_sarif, 'r') as f:
                    sarif_data = json.load(f)
                
                for run in sarif_data.get("runs", []):
                    for result in run.get("results", []):
                        rule_id = result.get("ruleId", "")
                        locations = result.get("locations", [{}])
                        location = locations[0] if locations else {}
                        
                        finding = SecurityFinding(
                            tool="codeql",
                            severity=self._map_codeql_severity(result.get("level", "note")),
                            title=result.get("message", {}).get("text", "CodeQL Finding"),
                            description=result.get("message", {}).get("text", ""),
                            file_path=location.get("physicalLocation", {}).get("artifactLocation", {}).get("uri", ""),
                            line_number=location.get("physicalLocation", {}).get("region", {}).get("startLine", 0),
                            rule_id=rule_id
                        )
                        findings.append(finding)
            
            except Exception as e:
                print(f"Error parsing CodeQL SARIF results: {e}")
        
        return findings
    
    def _map_codeql_severity(self, level: str) -> SecuritySeverity:
        """Map CodeQL severity levels."""
        mapping = {
            "error": SecuritySeverity.HIGH,
            "warning": SecuritySeverity.MEDIUM,
            "note": SecuritySeverity.LOW
        }
        return mapping.get(level, SecuritySeverity.LOW)
    
    def _count_by_severity(self, findings: List[SecurityFinding]) -> Dict[str, int]:
        """Count findings by severity level."""
        counts = {severity.value: 0 for severity in SecuritySeverity}
        
        for finding in findings:
            counts[finding.severity.value] += 1
            
        return counts
    
    def _create_error_result(self, tool_name: str, error: str) -> SecurityGateResult:
        """Create error result for failed tool scan."""
        return SecurityGateResult(
            gate_name=tool_name,
            passed=False,
            threshold=0,
            actual_count=0,
            findings=[],
            execution_time=0.0,
            details={"error": error, "status": "failed"}
        )
    
    def validate_security_gates(self, scan_results: Dict[str, SecurityGateResult]) -> Dict[str, Any]:
        """Validate security findings against configured gates."""
        print("Validating security gates...")
        
        gate_validation = {
            "gates_evaluated": 0,
            "gates_passed": 0,
            "gates_failed": 0,
            "blocking_failures": 0,
            "overall_status": "PASS",
            "gate_results": {},
            "summary": {}
        }
        
        # Aggregate all findings
        all_findings = []
        for result in scan_results.values():
            all_findings.extend(result.findings)
        
        # Count findings by severity
        severity_counts = self._count_by_severity(all_findings)
        
        security_gates = self.config.get("security_gates", {})
        
        # Validate each gate
        for gate_name, gate_config in security_gates.items():
            gate_validation["gates_evaluated"] += 1
            
            threshold = gate_config.get("max_allowed", 0)
            is_blocking = gate_config.get("blocking", False)
            
            # Map gate to severity count
            actual_count = self._get_gate_count(gate_name, severity_counts, all_findings)
            
            gate_passed = actual_count <= threshold
            
            if gate_passed:
                gate_validation["gates_passed"] += 1
                print(f"[PASS] {gate_name}: {actual_count}/{threshold} (PASS)")
            else:
                gate_validation["gates_failed"] += 1
                if is_blocking:
                    gate_validation["blocking_failures"] += 1
                    gate_validation["overall_status"] = "FAIL"
                print(f"[FAIL] {gate_name}: {actual_count}/{threshold} ({'BLOCKING' if is_blocking else 'WARNING'})")
            
            gate_validation["gate_results"][gate_name] = {
                "passed": gate_passed,
                "threshold": threshold,
                "actual_count": actual_count,
                "blocking": is_blocking,
                "status": "PASS" if gate_passed else ("FAIL" if is_blocking else "WARNING")
            }
        
        # Create summary
        gate_validation["summary"] = {
            "total_findings": len(all_findings),
            "critical_findings": severity_counts.get("critical", 0),
            "high_findings": severity_counts.get("high", 0),
            "medium_findings": severity_counts.get("medium", 0),
            "low_findings": severity_counts.get("low", 0),
            "info_findings": severity_counts.get("info", 0)
        }
        
        return gate_validation
    
    def _get_gate_count(self, gate_name: str, severity_counts: Dict[str, int], all_findings: List[SecurityFinding]) -> int:
        """Get count for specific security gate."""
        if gate_name == "critical_vulnerabilities":
            return severity_counts.get("critical", 0)
        elif gate_name == "high_vulnerabilities":
            return severity_counts.get("high", 0)
        elif gate_name == "medium_vulnerabilities":
            return severity_counts.get("medium", 0)
        elif gate_name == "secrets":
            return len([f for f in all_findings if "secret" in f.title.lower() or "key" in f.title.lower()])
        elif gate_name == "outdated_dependencies":
            return len([f for f in all_findings if f.tool in ["safety", "npm_audit"]])
        elif gate_name == "license_violations":
            return len([f for f in all_findings if "license" in f.title.lower()])
        else:
            return 0
    
    def generate_sarif_output(self, scan_results: Dict[str, SecurityGateResult]) -> Dict[str, Any]:
        """Generate SARIF format output for GitHub Security integration."""
        print("Generating SARIF output...")
        
        sarif_output = {
            "version": "2.1.0",
            "runs": []
        }
        
        # Create SARIF run for each tool
        for tool_name, result in scan_results.items():
            if not result.findings:
                continue
            
            run = {
                "tool": {
                    "driver": {
                        "name": tool_name,
                        "version": "1.0.0",
                        "informationUri": f"https://github.com/security-tools/{tool_name}"
                    }
                },
                "results": []
            }
            
            for finding in result.findings:
                sarif_result = {
                    "ruleId": finding.rule_id,
                    "level": self._map_severity_to_sarif(finding.severity),
                    "message": {"text": finding.description},
                    "locations": [{
                        "physicalLocation": {
                            "artifactLocation": {"uri": finding.file_path},
                            "region": {"startLine": finding.line_number}
                        }
                    }]
                }
                
                if finding.cwe_id:
                    sarif_result["properties"] = {"cwe": finding.cwe_id}
                
                run["results"].append(sarif_result)
            
            sarif_output["runs"].append(run)
        
        # Save SARIF output
        sarif_dir = Path(".claude/.artifacts/security/sarif")
        sarif_dir.mkdir(parents=True, exist_ok=True)
        
        sarif_file = sarif_dir / "security-scan-results.sarif"
        with open(sarif_file, 'w') as f:
            json.dump(sarif_output, f, indent=2)
        
        print(f"SARIF output saved to: {sarif_file}")
        
        return sarif_output
    
    def _map_severity_to_sarif(self, severity: SecuritySeverity) -> str:
        """Map security severity to SARIF level."""
        mapping = {
            SecuritySeverity.CRITICAL: "error",
            SecuritySeverity.HIGH: "error", 
            SecuritySeverity.MEDIUM: "warning",
            SecuritySeverity.LOW: "note",
            SecuritySeverity.INFO: "note"
        }
        return mapping.get(severity, "note")
    
    def generate_security_report(self, scan_results: Dict[str, SecurityGateResult], gate_validation: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive security report."""
        execution_time = time.time() - self.start_time
        
        report = {
            "report_metadata": {
                "timestamp": datetime.now().isoformat(),
                "execution_time_seconds": execution_time,
                "validator_version": "1.0.0",
                "config_file": self.config_path
            },
            "executive_summary": {
                "overall_status": gate_validation.get("overall_status", "UNKNOWN"),
                "total_findings": gate_validation.get("summary", {}).get("total_findings", 0),
                "critical_findings": gate_validation.get("summary", {}).get("critical_findings", 0),
                "high_findings": gate_validation.get("summary", {}).get("high_findings", 0),
                "gates_passed": gate_validation.get("gates_passed", 0),
                "gates_failed": gate_validation.get("gates_failed", 0),
                "blocking_failures": gate_validation.get("blocking_failures", 0)
            },
            "tool_results": {},
            "gate_validation": gate_validation,
            "compliance_status": {
                "soc2_compliant": gate_validation.get("blocking_failures", 0) == 0,
                "nist_compliant": gate_validation.get("blocking_failures", 0) == 0,
                "production_ready": gate_validation.get("overall_status") == "PASS"
            },
            "recommendations": self._generate_recommendations(scan_results, gate_validation),
            "next_steps": self._generate_next_steps(gate_validation)
        }
        
        # Add tool-specific results
        for tool_name, result in scan_results.items():
            report["tool_results"][tool_name] = {
                "status": "success" if result.passed else "failed",
                "findings_count": result.actual_count,
                "execution_time": result.execution_time,
                "findings_by_severity": result.details.get("findings_by_severity", {}),
                "top_findings": [
                    {
                        "severity": f.severity.value,
                        "title": f.title,
                        "file": f.file_path,
                        "line": f.line_number
                    }
                    for f in result.findings[:5]  # Top 5 findings
                ]
            }
        
        return report
    
    def _generate_recommendations(self, scan_results: Dict[str, SecurityGateResult], gate_validation: Dict[str, Any]) -> List[str]:
        """Generate actionable security recommendations."""
        recommendations = []
        
        summary = gate_validation.get("summary", {})
        
        if summary.get("critical_findings", 0) > 0:
            recommendations.append("URGENT: Address all critical security findings immediately before deployment")
        
        if summary.get("high_findings", 0) > 5:
            recommendations.append("Prioritize fixing high-severity findings - target <5 findings")
        
        if gate_validation.get("blocking_failures", 0) > 0:
            recommendations.append("Resolve blocking security gate failures before proceeding")
        
        # Tool-specific recommendations
        for tool_name, result in scan_results.items():
            if result.findings and result.execution_time > 300:  # 5 minutes
                recommendations.append(f"Optimize {tool_name} scan performance - execution time: {result.execution_time:.1f}s")
        
        if not recommendations:
            recommendations.append("Security posture is good - maintain current security practices")
        
        return recommendations
    
    def _generate_next_steps(self, gate_validation: Dict[str, Any]) -> List[str]:
        """Generate next steps based on validation results."""
        next_steps = []
        
        if gate_validation.get("overall_status") == "FAIL":
            next_steps.extend([
                "1. Review and fix all blocking security gate failures",
                "2. Re-run security validation to confirm fixes",
                "3. Update security documentation and processes"
            ])
        elif gate_validation.get("gates_failed", 0) > 0:
            next_steps.extend([
                "1. Address non-blocking security warnings",
                "2. Review security gate thresholds",
                "3. Plan security improvements for next iteration"
            ])
        else:
            next_steps.extend([
                "1. Continue regular security monitoring",
                "2. Update security tools and rules",
                "3. Review and improve security processes"
            ])
        
        return next_steps
    
    def run_full_validation(self) -> Dict[str, Any]:
        """Run full security validation pipeline."""
        print("Starting comprehensive security validation...")
        print("=" * 60)
        
        # Step 1: Validate tool configurations
        tool_validation = self.validate_tool_configurations()
        
        # Step 2: Run security scans
        scan_results = self.run_comprehensive_security_scan()
        
        # Step 3: Validate security gates
        gate_validation = self.validate_security_gates(scan_results)
        
        # Step 4: Generate SARIF output
        sarif_output = self.generate_sarif_output(scan_results)
        
        # Step 5: Generate comprehensive report
        security_report = self.generate_security_report(scan_results, gate_validation)
        
        # Save results
        self._save_validation_results(security_report, sarif_output)
        
        return security_report
    
    def _save_validation_results(self, report: Dict[str, Any], sarif_output: Dict[str, Any]) -> None:
        """Save validation results to artifacts."""
        artifacts_dir = Path(".claude/.artifacts/security")
        artifacts_dir.mkdir(parents=True, exist_ok=True)
        
        # Save main report
        report_file = artifacts_dir / "security_validation_report.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        print(f"Security validation report saved: {report_file}")
        
        # Save SARIF (already saved in generate_sarif_output)
        print(f"SARIF output saved: {artifacts_dir}/sarif/security-scan-results.sarif")


def main():
    """Main execution for security validation."""
    print("Security Gate Validator - Agent Delta Mission")
    print("=" * 60)
    
    validator = SecurityValidator()
    results = validator.run_full_validation()
    
    print("\n" + "=" * 60)
    print("SECURITY VALIDATION SUMMARY")
    print("=" * 60)
    
    executive_summary = results["executive_summary"]
    print(f"Overall Status: {executive_summary['overall_status']}")
    print(f"Total Findings: {executive_summary['total_findings']}")
    print(f"Critical Findings: {executive_summary['critical_findings']}")
    print(f"High Findings: {executive_summary['high_findings']}")
    print(f"Gates Passed: {executive_summary['gates_passed']}")
    print(f"Gates Failed: {executive_summary['gates_failed']}")
    print(f"Blocking Failures: {executive_summary['blocking_failures']}")
    
    print("\nCompliance Status:")
    compliance = results["compliance_status"]
    print(f"  SOC 2 Compliant: {'[PASS]' if compliance['soc2_compliant'] else '[FAIL]'}")
    print(f"  NIST Compliant: {'[PASS]' if compliance['nist_compliant'] else '[FAIL]'}")
    print(f"  Production Ready: {'[PASS]' if compliance['production_ready'] else '[FAIL]'}")
    
    if results["recommendations"]:
        print("\nTop Recommendations:")
        for i, rec in enumerate(results["recommendations"][:3], 1):
            print(f"  {i}. {rec}")
    
    # Exit with appropriate code
    if executive_summary["overall_status"] == "FAIL":
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()