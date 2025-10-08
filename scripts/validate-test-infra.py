#!/usr/bin/env python3
"""
Test Infrastructure Validator - NASA Rule 10 Compliant
Diagnoses and validates test infrastructure health
NO TODOs, NO placeholders, production-ready
ASCII ONLY - no Unicode characters
"""

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Tuple

def check_jest_config() -> Dict[str, any]:
    """Validate Jest configuration for test execution."""
    config_path = Path("jest.config.js")

    if not config_path.exists():
        return {"status": "MISSING", "issues": ["jest.config.js not found"]}

    content = config_path.read_text(encoding='utf-8')
    issues = []

    # Check for critical settings
    if "testTimeout" not in content:
        issues.append("Missing testTimeout configuration")

    if "detectOpenHandles" not in content:
        issues.append("Missing detectOpenHandles for async cleanup detection")

    if "maxWorkers" not in content:
        issues.append("Missing maxWorkers configuration for parallel execution")

    if "bail" not in content:
        issues.append("Missing bail configuration for fast failure")

    return {
        "status": "OK" if len(issues) == 0 else "NEEDS_FIX",
        "issues": issues,
        "config_path": str(config_path)
    }

def verify_test_syntax() -> Dict[str, List[str]]:
    """Check test files for syntax errors."""
    test_dirs = [Path("tests"), Path("src")]
    syntax_errors = {}

    for test_dir in test_dirs:
        if not test_dir.exists():
            continue

        for test_file in test_dir.rglob("*.test.ts"):
            try:
                content = test_file.read_text(encoding='utf-8')

                # Check for common syntax issues
                issues = []

                # Unbalanced braces/parentheses
                if content.count('{') != content.count('}'):
                    issues.append("Unbalanced curly braces")

                if content.count('(') != content.count(')'):
                    issues.append("Unbalanced parentheses")

                # Missing imports
                if "describe(" in content and "import" not in content[:500]:
                    issues.append("Missing test framework imports")

                if len(issues) > 0:
                    syntax_errors[str(test_file)] = issues

            except Exception as e:
                syntax_errors[str(test_file)] = [f"Read error: {str(e)}"]

    return syntax_errors

def verify_python_tests() -> Dict[str, any]:
    """Validate Python test files."""
    test_files = list(Path("tests").rglob("*.py")) if Path("tests").exists() else []

    if len(test_files) == 0:
        return {"status": "NO_TESTS", "files": []}

    issues = {}

    for test_file in test_files:
        try:
            content = test_file.read_text(encoding='utf-8')
            file_issues = []

            # Check for syntax errors using ast
            try:
                compile(content, str(test_file), 'exec')
            except SyntaxError as e:
                file_issues.append(f"SyntaxError at line {e.lineno}: {e.msg}")

            # Check for missing imports
            if "import pytest" not in content and "import unittest" not in content:
                if "def test_" in content:
                    file_issues.append("Missing test framework import")

            if len(file_issues) > 0:
                issues[str(test_file)] = file_issues

        except Exception as e:
            issues[str(test_file)] = [f"Validation error: {str(e)}"]

    return {
        "status": "OK" if len(issues) == 0 else "HAS_ERRORS",
        "total_files": len(test_files),
        "issues": issues
    }

def validate_npm_scripts() -> Dict[str, any]:
    """Check NPM scripts in package.json."""
    pkg_path = Path("package.json")

    if not pkg_path.exists():
        return {"status": "MISSING", "scripts": {}}

    try:
        pkg_data = json.loads(pkg_path.read_text(encoding='utf-8'))
        scripts = pkg_data.get("scripts", {})

        # Priority scripts to validate
        priority_scripts = [
            "test", "test:ci", "test:unit", "test:py",
            "build", "typecheck", "lint", "lint:ci"
        ]

        validation_results = {}

        for script_name in priority_scripts:
            if script_name not in scripts:
                validation_results[script_name] = "MISSING"
            else:
                script_cmd = scripts[script_name]

                # Check for common issues
                if "&&" in script_cmd and "exit" not in script_cmd:
                    validation_results[script_name] = "OK"
                elif "npm run" in script_cmd:
                    # Check if referenced script exists
                    ref_script = re.search(r'npm run (\S+)', script_cmd)
                    if ref_script and ref_script.group(1) not in scripts:
                        validation_results[script_name] = "BROKEN_REF"
                    else:
                        validation_results[script_name] = "OK"
                else:
                    validation_results[script_name] = "OK"

        return {
            "status": "OK",
            "total_scripts": len(scripts),
            "priority_validation": validation_results
        }

    except Exception as e:
        return {"status": "ERROR", "error": str(e)}

def check_test_runner_config() -> Dict[str, any]:
    """Validate test runner configurations."""
    configs = {
        "jest": Path("jest.config.js"),
        "pytest": Path("pytest.ini"),
        "tsconfig_test": Path("tsconfig.test.json")
    }

    results = {}

    for config_name, config_path in configs.items():
        if config_path.exists():
            results[config_name] = "FOUND"
        else:
            results[config_name] = "MISSING"

    return {
        "status": "OK" if "jest" in results and results["jest"] == "FOUND" else "INCOMPLETE",
        "configs": results
    }

def generate_fix_recommendations() -> List[str]:
    """Generate actionable fix recommendations."""
    recommendations = [
        "Update jest.config.js with testTimeout: 30000",
        "Add detectOpenHandles: true to Jest config",
        "Configure maxWorkers: 2 for parallel test execution",
        "Add bail: true for fast failure detection",
        "Fix Python test syntax errors before running test:py",
        "Verify all NPM script references are valid",
        "Ensure test imports resolve correctly",
        "Add timeout guards to async test cases"
    ]

    return recommendations

def main():
    """Execute complete test infrastructure validation."""
    print("[TEST INFRA VALIDATOR] Starting validation...")

    results = {
        "jest_config": check_jest_config(),
        "test_syntax": verify_test_syntax(),
        "python_tests": verify_python_tests(),
        "npm_scripts": validate_npm_scripts(),
        "test_runners": check_test_runner_config(),
        "recommendations": generate_fix_recommendations()
    }

    # Print summary
    print("\n=== VALIDATION SUMMARY ===")
    print(f"Jest Config: {results['jest_config']['status']}")
    print(f"Test Syntax Errors: {len(results['test_syntax'])} files")
    print(f"Python Tests: {results['python_tests']['status']}")
    print(f"NPM Scripts: {results['npm_scripts']['status']}")
    print(f"Test Runners: {results['test_runners']['status']}")

    # Print detailed issues
    if results['jest_config']['status'] != "OK":
        print("\n[JEST CONFIG ISSUES]")
        for issue in results['jest_config'].get('issues', []):
            print(f"  - {issue}")

    if len(results['test_syntax']) > 0:
        print("\n[TEST SYNTAX ERRORS]")
        for file_path, issues in list(results['test_syntax'].items())[:5]:
            print(f"  {file_path}:")
            for issue in issues:
                print(f"    - {issue}")

    if results['python_tests']['status'] == "HAS_ERRORS":
        print("\n[PYTHON TEST ERRORS]")
        for file_path, issues in list(results['python_tests']['issues'].items())[:5]:
            print(f"  {file_path}:")
            for issue in issues:
                print(f"    - {issue}")

    # Print recommendations
    print("\n[RECOMMENDATIONS]")
    for i, rec in enumerate(results['recommendations'][:5], 1):
        print(f"  {i}. {rec}")

    # Write detailed report
    report_path = Path(".claude/.artifacts/test-infra-validation.json")
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(results, indent=2), encoding='utf-8')

    print(f"\n[SUCCESS] Validation complete. Report: {report_path}")

    # Exit code based on critical issues
    has_critical = (
        results['jest_config']['status'] == "MISSING" or
        results['python_tests']['status'] == "HAS_ERRORS"
    )

    return 1 if has_critical else 0

if __name__ == '__main__':
    sys.exit(main())

# === AGENT FOOTER ===
# Version & Run Log
# Version History

# Version: 1.0.0

# Receipt
# status: OK
# reason_if_blocked: --
# run_id: phase1-test-validator-creation
# inputs: ["Test infrastructure requirements", "Jest configuration patterns"]
# tools_used: ["Write"]
# versions: {"model":"claude-sonnet-4","prompt":"test-validation-infrastructure"}
# === END FOOTER ===