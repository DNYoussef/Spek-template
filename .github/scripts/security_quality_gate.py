#!/usr/bin/env python3
"""
Security Quality Gate - REAL Security Gate Enforcement
======================================================

Implements ACTUAL security quality gate enforcement with real blocking.
No simulation - functional security gate validation that blocks deployment.

Part of Agent Delta Mission: Fix security validation theater.
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any


class SecurityQualityGate:
    """Real security quality gate with actual blocking enforcement."""
    
    def __init__(self):
        """Initialize security quality gate."""
        self.artifacts_dir = Path(".claude/.artifacts/security")
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)
        
        # REAL quality gate thresholds - ZERO TOLERANCE for production
        self.quality_gates = {
            "critical_vulnerabilities": {"threshold": 0, "blocking": True},
            "high_vulnerabilities": {"threshold": 0, "blocking": True},
            "medium_vulnerabilities": {"threshold": 10, "blocking": False},
            "secrets_detected": {"threshold": 0, "blocking": True},
            "critical_dependencies": {"threshold": 0, "blocking": True},
            "high_dependencies": {"threshold": 2, "blocking": True}
        }
        
        self.results = {}
        self.all_findings = []
    
    def load_security_results(self) -> Dict[str, Any]:
        """Load REAL security scan results from artifacts."""
        print("Loading security scan results...")
        
        results = {
            "sast": None,
            "supply_chain": None,
            "secrets": None
        }
        
        # Load SAST results
        sast_file = self.artifacts_dir / "sast_analysis.json"
        if sast_file.exists():
            with open(sast_file, 'r') as f:
                results["sast"] = json.load(f)
            print(" Loaded SAST analysis results")
        else:
            print(" SAST analysis results not found")
        
        # Load supply chain results
        supply_chain_file = self.artifacts_dir / "supply_chain_analysis.json"
        if supply_chain_file.exists():
            with open(supply_chain_file, 'r') as f:
                results["supply_chain"] = json.load(f)
            print(" Loaded supply chain analysis results")
        else:
            print(" Supply chain analysis results not found")
        
        # Load secrets results
        secrets_file = self.artifacts_dir / "secrets_analysis.json"
        if secrets_file.exists():
            with open(secrets_file, 'r') as f:
                results["secrets"] = json.load(f)
            print(" Loaded secrets analysis results")
        else:
            print(" Secrets analysis results not found")
        
        return results
    
    def extract_findings(self, security_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract all security findings from scan results."""
        findings = []
        
        # Extract SAST findings
        if security_results.get("sast"):
            sast_data = security_results["sast"]
            
            for severity in ["critical", "high", "medium", "low"]:
                for finding in sast_data.get("findings", {}).get(severity, []):
                    findings.append({
                        "type": "sast",
                        "tool": finding.get("tool", "unknown"),
                        "severity": severity,
                        "title": finding.get("description", "Unknown"),
                        "file": finding.get("file", ""),
                        "line": finding.get("line", 0),
                        "description": finding.get("description", "")
                    })
        
        # Extract supply chain findings
        if security_results.get("supply_chain"):
            supply_data = security_results["supply_chain"]
            
            for severity in ["critical", "high", "medium", "low"]:
                for vuln in supply_data.get("vulnerabilities", {}).get(severity, []):
                    findings.append({
                        "type": "supply_chain",
                        "tool": vuln.get("tool", "unknown"),
                        "severity": severity,
                        "title": f"Vulnerable dependency: {vuln.get('package', 'unknown')}",
                        "package": vuln.get("package", ""),
                        "version": vuln.get("version", ""),
                        "description": vuln.get("description", "")
                    })
        
        # Extract secrets findings
        if security_results.get("secrets"):
            secrets_data = security_results["secrets"]
            
            for secret in secrets_data.get("secrets", []):
                findings.append({
                    "type": "secrets",
                    "tool": "secrets_scanner",
                    "severity": "critical",
                    "title": f"Secret detected: {secret.get('type', 'unknown')}",
                    "file": secret.get("file", ""),
                    "line": secret.get("line", 0),
                    "description": f"Found {secret.get('type', 'secret')} in code"
                })
        
        return findings
    
    def evaluate_quality_gates(self, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Evaluate REAL security quality gates with actual counts."""
        print("Evaluating security quality gates...")
        
        # Count findings by type and severity
        counts = {
            "critical_vulnerabilities": 0,
            "high_vulnerabilities": 0,
            "medium_vulnerabilities": 0,
            "secrets_detected": 0,
            "critical_dependencies": 0,
            "high_dependencies": 0
        }
        
        for finding in findings:
            severity = finding["severity"]
            finding_type = finding["type"]
            
            if severity == "critical":
                if finding_type == "supply_chain":
                    counts["critical_dependencies"] += 1
                else:
                    counts["critical_vulnerabilities"] += 1
                    
            elif severity == "high":
                if finding_type == "supply_chain":
                    counts["high_dependencies"] += 1
                else:
                    counts["high_vulnerabilities"] += 1
                    
            elif severity == "medium":
                counts["medium_vulnerabilities"] += 1
            
            if finding_type == "secrets":
                counts["secrets_detected"] += 1
        
        # Evaluate each gate
        gate_results = {}
        blocking_failures = 0
        
        for gate_name, gate_config in self.quality_gates.items():
            threshold = gate_config["threshold"]
            blocking = gate_config["blocking"]
            actual_count = counts.get(gate_name, 0)
            
            passed = actual_count <= threshold
            
            if not passed and blocking:
                blocking_failures += 1
            
            gate_results[gate_name] = {
                "passed": passed,
                "blocking": blocking,
                "threshold": threshold,
                "actual_count": actual_count,
                "status": "PASS" if passed else ("FAIL" if blocking else "WARNING")
            }
            
            status_symbol = "" if passed else ""
            block_text = " (BLOCKING)" if blocking and not passed else ""
            print(f"  {status_symbol} {gate_name}: {actual_count}/{threshold}{block_text}")
        
        overall_passed = blocking_failures == 0
        
        return {
            "gates": gate_results,
            "overall_passed": overall_passed,
            "blocking_failures": blocking_failures,
            "total_gates": len(self.quality_gates),
            "gates_passed": sum(1 for g in gate_results.values() if g["passed"]),
            "gates_failed": sum(1 for g in gate_results.values() if not g["passed"])
        }
    
    def generate_sarif_output(self, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate SARIF format output for GitHub Security integration."""
        print("Generating SARIF output for GitHub Security...")
        
        sarif_output = {
            "version": "2.1.0",
            "runs": [
                {
                    "tool": {
                        "driver": {
                            "name": "SPEK Security Scanner",
                            "version": "1.0.0",
                            "informationUri": "https://github.com/spek-ai/security-scanner",
                            "rules": []
                        }
                    },
                    "results": []
                }
            ]
        }
        
        # Add rules and results
        rules_added = set()
        
        for finding in findings:
            rule_id = f"{finding['tool']}_{finding['type']}"
            
            # Add rule if not already added
            if rule_id not in rules_added:
                rule = {
                    "id": rule_id,
                    "name": finding["title"],
                    "shortDescription": {"text": finding["title"]},
                    "fullDescription": {"text": finding["description"]},
                    "defaultConfiguration": {
                        "level": self._map_severity_to_sarif_level(finding["severity"])
                    }
                }
                
                sarif_output["runs"][0]["tool"]["driver"]["rules"].append(rule)
                rules_added.add(rule_id)
            
            # Add result
            result = {
                "ruleId": rule_id,
                "level": self._map_severity_to_sarif_level(finding["severity"]),
                "message": {"text": finding["description"]},
                "locations": []
            }
            
            # Add location if file information is available
            if finding.get("file"):
                result["locations"].append({
                    "physicalLocation": {
                        "artifactLocation": {"uri": finding["file"]},
                        "region": {"startLine": finding.get("line", 1)}
                    }
                })
            
            sarif_output["runs"][0]["results"].append(result)
        
        # Save SARIF output
        sarif_file = self.artifacts_dir / "security_consolidated.sarif"
        with open(sarif_file, 'w') as f:
            json.dump(sarif_output, f, indent=2)
        
        print(f"SARIF output saved: {sarif_file}")
        return sarif_output
    
    def _map_severity_to_sarif_level(self, severity: str) -> str:
        """Map severity to SARIF level."""
        mapping = {
            "critical": "error",
            "high": "error",
            "medium": "warning", 
            "low": "note"
        }
        return mapping.get(severity, "note")
    
    def generate_quality_gate_report(
        self, 
        security_results: Dict[str, Any],
        findings: List[Dict[str, Any]],
        gate_evaluation: Dict[str, Any],
        sarif_output: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate comprehensive quality gate report."""
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "execution_environment": {
                "runner_os": os.environ.get("RUNNER_OS", "unknown"),
                "github_repository": os.environ.get("GITHUB_REPOSITORY", "unknown"),
                "github_ref": os.environ.get("GITHUB_REF", "unknown")
            },
            "executive_summary": {
                "overall_status": "PASS" if gate_evaluation["overall_passed"] else "FAIL",
                "total_findings": len(findings),
                "critical_findings": len([f for f in findings if f["severity"] == "critical"]),
                "high_findings": len([f for f in findings if f["severity"] == "high"]),
                "blocking_failures": gate_evaluation["blocking_failures"],
                "deployment_blocked": not gate_evaluation["overall_passed"]
            },
            "security_analysis_coverage": {
                "sast_available": security_results.get("sast") is not None,
                "supply_chain_available": security_results.get("supply_chain") is not None,
                "secrets_available": security_results.get("secrets") is not None,
                "coverage_percentage": sum([
                    security_results.get("sast") is not None,
                    security_results.get("supply_chain") is not None,
                    security_results.get("secrets") is not None
                ]) / 3 * 100
            },
            "quality_gates": gate_evaluation,
            "findings_by_type": {
                "sast": len([f for f in findings if f["type"] == "sast"]),
                "supply_chain": len([f for f in findings if f["type"] == "supply_chain"]),
                "secrets": len([f for f in findings if f["type"] == "secrets"])
            },
            "findings_by_severity": {
                "critical": len([f for f in findings if f["severity"] == "critical"]),
                "high": len([f for f in findings if f["severity"] == "high"]),
                "medium": len([f for f in findings if f["severity"] == "medium"]),
                "low": len([f for f in findings if f["severity"] == "low"])
            },
            "critical_findings": [f for f in findings if f["severity"] == "critical"][:10],
            "high_findings": [f for f in findings if f["severity"] == "high"][:10],
            "compliance_status": {
                "production_ready": gate_evaluation["overall_passed"],
                "zero_critical_compliant": len([f for f in findings if f["severity"] == "critical"]) == 0,
                "zero_high_compliant": len([f for f in findings if f["severity"] == "high"]) == 0,
                "secrets_free": len([f for f in findings if f["type"] == "secrets"]) == 0
            },
            "recommendations": self._generate_recommendations(findings, gate_evaluation),
            "artifacts": {
                "sarif_file": str(self.artifacts_dir / "security_consolidated.sarif"),
                "gate_report": str(self.artifacts_dir / "security_gates_report.json")
            }
        }
        
        # Save gate report
        report_file = self.artifacts_dir / "security_gates_report.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        return report
    
    def _generate_recommendations(self, findings: List[Dict[str, Any]], gate_evaluation: Dict[str, Any]) -> List[str]:
        """Generate actionable security recommendations."""
        recommendations = []
        
        critical_count = len([f for f in findings if f["severity"] == "critical"])
        high_count = len([f for f in findings if f["severity"] == "high"])
        secrets_count = len([f for f in findings if f["type"] == "secrets"])
        
        if critical_count > 0:
            recommendations.append(f"URGENT: Fix {critical_count} critical security vulnerabilities before deployment")
        
        if high_count > 0:
            recommendations.append(f"HIGH PRIORITY: Address {high_count} high-severity security findings")
        
        if secrets_count > 0:
            recommendations.append(f"SECURITY BREACH: Remove {secrets_count} exposed secrets from codebase")
        
        if gate_evaluation["blocking_failures"] > 0:
            recommendations.append(f"DEPLOYMENT BLOCKED: Resolve {gate_evaluation['blocking_failures']} blocking security gate failures")
        
        # Tool-specific recommendations
        sast_findings = [f for f in findings if f["type"] == "sast"]
        if len(sast_findings) > 20:
            recommendations.append("Consider reviewing SAST rules configuration - high number of findings detected")
        
        supply_findings = [f for f in findings if f["type"] == "supply_chain"]
        if len(supply_findings) > 10:
            recommendations.append("Review and update vulnerable dependencies")
        
        if not recommendations:
            recommendations.append("Security posture is excellent - maintain current security practices")
        
        return recommendations
    
    def run_quality_gate_evaluation(self) -> int:
        """Run complete security quality gate evaluation."""
        print("Security Quality Gate Evaluation - REAL Enforcement")
        print("=" * 60)
        
        try:
            # Step 1: Load security scan results
            security_results = self.load_security_results()
            
            if not any(security_results.values()):
                print("FATAL: No security scan results found")
                return 1
            
            # Step 2: Extract all findings
            findings = self.extract_findings(security_results)
            print(f"\nTotal security findings: {len(findings)}")
            
            # Step 3: Evaluate quality gates
            gate_evaluation = self.evaluate_quality_gates(findings)
            
            # Step 4: Generate SARIF output
            sarif_output = self.generate_sarif_output(findings)
            
            # Step 5: Generate comprehensive report
            report = self.generate_quality_gate_report(
                security_results, findings, gate_evaluation, sarif_output
            )
            
            # Step 6: Print summary and make decision
            print("\n" + "=" * 60)
            print("SECURITY QUALITY GATE SUMMARY")
            print("=" * 60)
            
            summary = report["executive_summary"]
            print(f"Overall Status: {summary['overall_status']}")
            print(f"Total Findings: {summary['total_findings']}")
            print(f"Critical: {summary['critical_findings']}")
            print(f"High: {summary['high_findings']}")
            print(f"Blocking Failures: {summary['blocking_failures']}")
            print(f"Deployment Blocked: {'YES' if summary['deployment_blocked'] else 'NO'}")
            
            if report["recommendations"]:
                print("\nTop Recommendations:")
                for i, rec in enumerate(report["recommendations"][:3], 1):
                    print(f"  {i}. {rec}")
            
            print(f"\nArtifacts saved:")
            print(f"  - Report: {report['artifacts']['gate_report']}")
            print(f"  - SARIF: {report['artifacts']['sarif_file']}")
            
            # REAL quality gate decision - BLOCK if failures
            if gate_evaluation["blocking_failures"] > 0:
                print("\n DEPLOYMENT BLOCKED - Security quality gates failed")
                return 1
            else:
                print("\n[OK] DEPLOYMENT APPROVED - Security quality gates passed")
                return 0
            
        except Exception as e:
            print(f"FATAL: Security quality gate evaluation failed: {e}")
            return 1


def main():
    """Main execution for security quality gate."""
    gate = SecurityQualityGate()
    exit_code = gate.run_quality_gate_evaluation()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()