#!/usr/bin/env python3
"""
Test Real Security Validation - Agent Delta Mission Validation
==============================================================

Tests the REAL security scanning implementation to ensure it actually
executes security tools and finds vulnerabilities, not simulation data.

Validates the fix for security validation theater.
"""

import asyncio
import json
import logging
import os
import sys
import tempfile
from pathlib import Path
from typing import Dict, Any

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from security.real_security_scanner import RealSecurityScanner

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class SecurityValidationTester:
    """Test REAL security validation implementation."""
    
    def __init__(self):
        """Initialize security validation tester."""
        self.test_dir = Path(__file__).parent.parent
        self.results = {}
    
    async def test_tool_availability(self) -> Dict[str, Any]:
        """Test security tool availability."""
        print("Testing security tool availability...")
        
        scanner = RealSecurityScanner(str(self.test_dir))
        availability = await scanner.verify_tools_available()
        
        test_results = {
            "test_name": "tool_availability",
            "passed": any(availability.values()),
            "details": availability,
            "available_tools": [tool for tool, available in availability.items() if available],
            "missing_tools": [tool for tool, available in availability.items() if not available]
        }
        
        if test_results["passed"]:
            print(f"[PASS] Tool availability test PASSED - {len(test_results['available_tools'])} tools available")
        else:
            print("[FAIL] Tool availability test FAILED - no security tools available")
        
        return test_results
    
    async def test_real_semgrep_execution(self) -> Dict[str, Any]:
        """Test REAL Semgrep execution with OWASP rules."""
        print("Testing real Semgrep execution...")
        
        # Create test file with security vulnerability
        test_file = self.test_dir / "test_vuln.py"
        try:
            with open(test_file, 'w') as f:
                f.write("""
# Test file with security vulnerabilities
import subprocess
import pickle

# Dangerous subprocess usage
def run_command(user_input):
    subprocess.call(user_input, shell=True)  # Command injection vulnerability

# Unsafe pickle usage
def load_data(data):
    return pickle.loads(data)  # Unsafe deserialization

# SQL injection vulnerability  
def get_user(username):
    query = f"SELECT * FROM users WHERE name = '{username}'"  # SQL injection
    return query

# Hardcoded password
PASSWORD = "hardcoded_secret_123"
""")
            
            scanner = RealSecurityScanner(str(self.test_dir))
            
            # Run actual Semgrep scan
            scan_results = await scanner.run_comprehensive_scan()
            
            test_results = {
                "test_name": "semgrep_execution",
                "passed": False,
                "findings_found": 0,
                "expected_vulnerabilities": ["command_injection", "unsafe_deserialization", "sql_injection", "hardcoded_secret"],
                "actual_findings": []
            }
            
            if "semgrep" in scan_results:
                semgrep_result = scan_results["semgrep"]
                test_results["findings_found"] = len(semgrep_result.findings)
                test_results["actual_findings"] = [
                    {
                        "rule_id": f.rule_id,
                        "severity": f.severity,
                        "file": f.file_path,
                        "line": f.line_number
                    } for f in semgrep_result.findings[:5]  # Limit for output
                ]
                
                # Test passes if we find at least some security vulnerabilities
                test_results["passed"] = test_results["findings_found"] > 0
            
            if test_results["passed"]:
                print(f"[PASS] Semgrep execution test PASSED - {test_results['findings_found']} vulnerabilities found")
            else:
                print("[FAIL] Semgrep execution test FAILED - no vulnerabilities detected")
            
            return test_results
            
        finally:
            # Clean up test file
            if test_file.exists():
                test_file.unlink()
    
    async def test_security_gates_enforcement(self) -> Dict[str, Any]:
        """Test REAL security gates enforcement."""
        print("Testing security gates enforcement...")
        
        # Create test findings with critical vulnerabilities
        test_findings = [
            {
                "tool": "semgrep",
                "severity": "critical", 
                "rule_id": "test_critical_1",
                "title": "Critical Test Vulnerability",
                "description": "Test critical security vulnerability",
                "file_path": "test.py",
                "line_number": 10
            },
            {
                "tool": "bandit",
                "severity": "high",
                "rule_id": "test_high_1", 
                "title": "High Test Vulnerability",
                "description": "Test high security vulnerability",
                "file_path": "test.py",
                "line_number": 20
            }
        ]
        
        scanner = RealSecurityScanner(str(self.test_dir))
        from security.real_security_scanner import SecurityFinding
        scanner.all_findings = [
            SecurityFinding(
                tool=f["tool"],
                severity=f["severity"],
                rule_id=f["rule_id"],
                title=f["title"],
                description=f["description"],
                file_path=f["file_path"],
                line_number=f["line_number"]
            ) for f in test_findings
        ]
        
        # Evaluate security gates
        gate_results = await scanner.evaluate_security_gates()
        
        test_results = {
            "test_name": "security_gates_enforcement",
            "passed": False,
            "gate_results": {},
            "blocking_failures": 0
        }
        
        # Check that gates properly detect violations
        critical_gate = gate_results.get("critical_vulnerabilities")
        high_gate = gate_results.get("high_vulnerabilities")
        
        if critical_gate and high_gate:
            test_results["gate_results"] = {
                "critical_gate_passed": critical_gate.passed,
                "critical_gate_count": critical_gate.actual_count,
                "high_gate_passed": high_gate.passed,
                "high_gate_count": high_gate.actual_count
            }
            
            # Test passes if gates properly fail with violations
            critical_blocked = not critical_gate.passed and critical_gate.blocking
            high_blocked = not high_gate.passed and high_gate.blocking
            
            test_results["passed"] = critical_blocked or high_blocked
            test_results["blocking_failures"] = sum(1 for gate in gate_results.values() if gate.blocking and not gate.passed)
        
        if test_results["passed"]:
            print(f"[PASS] Security gates enforcement test PASSED - gates properly block violations")
        else:
            print("[FAIL] Security gates enforcement test FAILED - gates do not block violations")
        
        return test_results
    
    async def test_sarif_output_generation(self) -> Dict[str, Any]:
        """Test REAL SARIF output generation."""
        print("Testing SARIF output generation...")
        
        scanner = RealSecurityScanner(str(self.test_dir))
        
        # Create test scan result
        from security.real_security_scanner import SecurityFinding, SecurityScanResult
        test_finding = SecurityFinding(
            tool="test_tool",
            severity="high",
            rule_id="test_rule_1",
            title="Test Security Finding", 
            description="Test security vulnerability for SARIF generation",
            file_path="test.py",
            line_number=15
        )
        
        scanner.scan_results["test_tool"] = SecurityScanResult(
            tool_name="test_tool",
            execution_time=1.0,
            exit_code=0,
            findings=[test_finding],
            total_files_scanned=1,
            command_executed="test command",
            stdout="test output",
            stderr=""
        )
        
        # Generate SARIF report
        sarif_report = await scanner.generate_sarif_report()
        
        test_results = {
            "test_name": "sarif_generation",
            "passed": False,
            "sarif_valid": False,
            "runs_count": 0,
            "results_count": 0
        }
        
        # Validate SARIF structure
        if sarif_report and "version" in sarif_report and "runs" in sarif_report:
            test_results["sarif_valid"] = True
            test_results["runs_count"] = len(sarif_report.get("runs", []))
            
            if test_results["runs_count"] > 0:
                first_run = sarif_report["runs"][0]
                test_results["results_count"] = len(first_run.get("results", []))
                
                # Test passes if SARIF contains our test finding
                test_results["passed"] = test_results["results_count"] > 0
        
        if test_results["passed"]:
            print(f"[PASS] SARIF generation test PASSED - valid SARIF with {test_results['results_count']} results")
        else:
            print("[FAIL] SARIF generation test FAILED - invalid or empty SARIF")
        
        return test_results
    
    async def test_github_security_integration(self) -> Dict[str, Any]:
        """Test GitHub Security tab integration readiness."""
        print("Testing GitHub Security integration...")
        
        scanner = RealSecurityScanner(str(self.test_dir))
        
        # Generate sample SARIF report
        sarif_report = await scanner.generate_sarif_report()
        
        test_results = {
            "test_name": "github_security_integration",
            "passed": False,
            "sarif_file_exists": False,
            "sarif_file_valid": False,
            "github_compatible": False
        }
        
        # Check if SARIF file was created
        sarif_file = scanner.artifacts_dir / "consolidated_security_results.sarif"
        test_results["sarif_file_exists"] = sarif_file.exists()
        
        if test_results["sarif_file_exists"]:
            try:
                # Validate SARIF format for GitHub Security
                with open(sarif_file, 'r') as f:
                    sarif_data = json.load(f)
                
                # Check SARIF 2.1.0 compliance
                if (sarif_data.get("version") == "2.1.0" and 
                    "runs" in sarif_data and 
                    len(sarif_data["runs"]) > 0):
                    
                    test_results["sarif_file_valid"] = True
                    
                    # Check GitHub Security compatibility
                    first_run = sarif_data["runs"][0]
                    if ("tool" in first_run and 
                        "driver" in first_run["tool"] and
                        "name" in first_run["tool"]["driver"]):
                        
                        test_results["github_compatible"] = True
                        test_results["passed"] = True
                
            except Exception as e:
                logger.error(f"SARIF validation failed: {e}")
        
        if test_results["passed"]:
            print("[PASS] GitHub Security integration test PASSED - SARIF ready for upload")
        else:
            print("[FAIL] GitHub Security integration test FAILED - SARIF not GitHub compatible")
        
        return test_results
    
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all security validation tests."""
        print("Real Security Validation Test Suite - Agent Delta Mission")
        print("=" * 70)
        print(f"Testing directory: {self.test_dir}")
        print("")
        
        test_results = {
            "test_suite": "real_security_validation",
            "timestamp": os.environ.get("GITHUB_RUN_ID", "local"),
            "total_tests": 5,
            "passed_tests": 0,
            "failed_tests": 0,
            "tests": {}
        }
        
        # Run individual tests
        tests = [
            self.test_tool_availability(),
            self.test_real_semgrep_execution(),
            self.test_security_gates_enforcement(),
            self.test_sarif_output_generation(),
            self.test_github_security_integration()
        ]
        
        for test_coro in tests:
            try:
                result = await test_coro
                test_name = result["test_name"]
                test_results["tests"][test_name] = result
                
                if result["passed"]:
                    test_results["passed_tests"] += 1
                else:
                    test_results["failed_tests"] += 1
                    
            except Exception as e:
                logger.error(f"Test failed with exception: {e}")
                test_results["failed_tests"] += 1
        
        # Generate summary
        print("\n" + "=" * 70)
        print("REAL SECURITY VALIDATION TEST SUMMARY")
        print("=" * 70)
        
        print(f"Total Tests: {test_results['total_tests']}")
        print(f"Passed: {test_results['passed_tests']}")
        print(f"Failed: {test_results['failed_tests']}")
        
        overall_passed = test_results["failed_tests"] == 0
        test_results["overall_passed"] = overall_passed
        
        if overall_passed:
            print("\n[SUCCESS] ALL TESTS PASSED - Real security validation is working")
        else:
            print(f"\n[FAILURE] {test_results['failed_tests']} TESTS FAILED - Security validation needs fixes")
        
        # Save test results
        results_file = self.test_dir / ".claude" / ".artifacts" / "security" / "validation_test_results.json"
        results_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(results_file, 'w') as f:
            json.dump(test_results, f, indent=2, default=str)
        
        print(f"\nTest results saved: {results_file}")
        
        return test_results


async def main():
    """Main execution for security validation testing."""
    try:
        tester = SecurityValidationTester()
        results = await tester.run_all_tests()
        
        # Exit with error if any tests failed
        if not results["overall_passed"]:
            sys.exit(1)
        
        print("\n[VICTORY] Security validation implementation verified - Theater detection DEFEATED!")
        sys.exit(0)
        
    except Exception as e:
        print(f"FATAL: Security validation testing failed: {e}")
        logger.exception("Security validation testing failed")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())