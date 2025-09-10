#!/usr/bin/env python3
"""Security Quality Gate Decision Script"""

import json
import sys


def main():
    """Main security gate decision execution"""
    print("=== Security Quality Gate Decision ===")
    
    # Load consolidated security report
    try:
        with open(".claude/.artifacts/security/security_gates_report.json", "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("FAILED: Security gates report not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"FAILED: Invalid security gates report JSON: {e}")
        sys.exit(1)
    
    security_score = data.get("overall_security_score", 0)
    critical_issues = len(data.get("critical_security_issues", []))
    gates = data.get("quality_gates", {})
    nasa_compliance = data.get("nasa_compliance_status", {})
    
    print(f"Overall Security Score: {security_score:.2%}")
    print(f"Critical Security Issues: {critical_issues}")
    print(f"Quality Gates: {gates.get('gates_passed', 0)}/{gates.get('total_gates', 0)} passed")
    print(f"NASA Compliance: {nasa_compliance.get('overall_compliance_score', 0):.2%}")
    
    # Security gate thresholds
    min_security_score = 0.80
    max_critical_issues = 0
    min_gate_pass_rate = 100
    min_nasa_compliance = 0.92
    
    failed = False
    
    # Check security score threshold
    if security_score < min_security_score:
        print(f"FAILED: Security score: {security_score:.2%} < {min_security_score:.2%}")
        failed = True
    else:
        print(f"SUCCESS: Security score: {security_score:.2%} >= {min_security_score:.2%}")
    
    # Check critical issues
    sast_critical = data.get("security_summary", {}).get("sast", {}).get("critical_findings", 0)
    supply_critical = data.get("security_summary", {}).get("supply_chain", {}).get("critical_vulnerabilities", 0)
    secrets_found = data.get("security_summary", {}).get("secrets", {}).get("secrets_found", 0)
    total_critical = sast_critical + supply_critical + secrets_found
    
    if total_critical > max_critical_issues:
        print(f"FAILED: Critical security issues: {total_critical} > {max_critical_issues}")
        failed = True
    else:
        print(f"SUCCESS: Critical security issues: {total_critical} <= {max_critical_issues}")
    
    # Check gate pass rate
    pass_rate = gates.get("pass_rate", 0)
    if pass_rate < min_gate_pass_rate:
        print(f"FAILED: Gate pass rate: {pass_rate:.1f}% < {min_gate_pass_rate}%")
        failed = True
    else:
        print(f"SUCCESS: Gate pass rate: {pass_rate:.1f}% >= {min_gate_pass_rate}%")
    
    # Check NASA compliance
    compliance_score = nasa_compliance.get("overall_compliance_score", 0)
    if compliance_score < min_nasa_compliance:
        print(f"FAILED: NASA compliance: {compliance_score:.2%} < {min_nasa_compliance:.2%}")
        failed = True
    else:
        print(f"SUCCESS: NASA compliance: {compliance_score:.2%} >= {min_nasa_compliance:.2%}")
    
    # Final decision
    if failed:
        print("\nSECURITY QUALITY GATE FAILED")
        print("Security issues must be resolved before deployment")
        sys.exit(1)
    else:
        print("\nSECURITY QUALITY GATE PASSED")
        print("Security hardening successful!")


if __name__ == "__main__":
    main()