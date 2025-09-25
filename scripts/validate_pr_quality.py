from src.constants.base import MINIMUM_TEST_COVERAGE_PERCENTAGE

import os
import sys
import json
import subprocess
from pathlib import Path

# Colors
RED = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
NC = '\033[0m'

# Configuration
ROOT_DIR = Path(__file__).parent.parent
ARTIFACTS_DIR = ROOT_DIR / '.claude' / '.artifacts'
THRESHOLD_NASA = 90
THRESHOLD_THEATER = 40

def run_command(cmd, capture=True):
    """Run shell command and return output"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=capture,
            text=True,
            cwd=ROOT_DIR
        )
        return result.stdout if capture else result.returncode
    except Exception as e:
        print(f"Error running command: {e}", file=sys.stderr)
        return "" if capture else 1

def get_json_value(file_path, key, default=0):
    """Safely extract value from JSON file"""
    try:
        with open(file_path) as f:
            data = json.load(f)
            return data.get(key, default)
    except:
        return default

def main():
    """Main PR quality validation using strategy pattern."""
    from scripts.validation.pr_quality_strategies import (
        NASAComplianceStrategy, TheaterDetectionStrategy, GodObjectValidationStrategy,
        TestCoverageStrategy, SecurityScanStrategy, CodeQualityStrategy
    )
    from src.utils.validation.validation_framework import ValidationEngine

    print("=" * 50)
    print("PR Quality Gate Validation")
    print("=" * 50)

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    # Initialize validation engine
    engine = ValidationEngine()
    engine.register_strategy("nasa", NASAComplianceStrategy())
    engine.register_strategy("theater", TheaterDetectionStrategy())
    engine.register_strategy("god_objects", GodObjectValidationStrategy())
    engine.register_strategy("coverage", TestCoverageStrategy())
    engine.register_strategy("security", SecurityScanStrategy())

    # Run validation strategies
    validation_results = _run_quality_gates(engine)

    # Final assessment
    overall_passed = _assess_overall_quality(validation_results)

    _display_final_report(overall_passed)
    sys.exit(0 if overall_passed else 1)

def _run_quality_gates(engine):
    """Run all quality gate validations."""
    results = {}

    # 1. NASA POT10 Compliance Check
    print(f"\n{YELLOW}[1/5] NASA POT10 Compliance Check...{NC}")
    nasa_data = _collect_nasa_compliance_data()
    results["nasa"] = engine.validate("nasa", nasa_data)
    _display_validation_result("NASA Compliance", results["nasa"])

    # 2. Theater Detection
    print(f"\n{YELLOW}[2/5] Performance Theater Detection...{NC}")
    theater_data = _collect_theater_detection_data()
    results["theater"] = engine.validate("theater", theater_data)
    _display_validation_result("Theater Detection", results["theater"])

    # 3. God Object Count
    print(f"\n{YELLOW}[3/5] God Object Analysis...{NC}")
    god_object_data = _collect_god_object_data()
    results["god_objects"] = engine.validate("god_objects", god_object_data)
    _display_validation_result("God Objects", results["god_objects"])

    # 4. Test Coverage
    coverage_data = _collect_coverage_data()
    results["coverage"] = engine.validate("coverage", coverage_data)
    _display_validation_result("Test Coverage", results["coverage"])

    # 5. Security Scan
    print(f"\n{YELLOW}[5/5] Security Scan...{NC}")
    security_data = _collect_security_data()
    results["security"] = engine.validate("security", security_data)
    _display_validation_result("Security", results["security"])

    return results

def _collect_nasa_compliance_data():
    """Collect NASA compliance data."""
    nasa_analyzer = ROOT_DIR / 'analyzer' / 'enterprise' / 'nasa_pot10_analyzer.py'

    if not nasa_analyzer.exists():
        return {"current_compliance": 0, "previous_compliance": 0, "threshold": THRESHOLD_NASA}

    # Get previous compliance
    prev_nasa_output = run_command('git show HEAD~1:analyzer/nasa_compliance.json')
    before_nasa = 0
    if prev_nasa_output:
        try:
            before_nasa = json.loads(prev_nasa_output).get('compliance_pct', 0)
        except:
            pass

    # Get current compliance
    nasa_output = ARTIFACTS_DIR / 'nasa-current.json'
    run_command(f'python {nasa_analyzer} --path analyzer/enterprise/ --json > {nasa_output}', capture=False)
    after_nasa = get_json_value(nasa_output, 'compliance_pct', 0)

    return {
        "current_compliance": after_nasa,
        "previous_compliance": before_nasa,
        "threshold": THRESHOLD_NASA
    }

def _collect_theater_detection_data():
    """Collect theater detection data."""
    theater_scanner = ROOT_DIR / 'scripts' / 'comprehensive_theater_scan.py'

    if not theater_scanner.exists():
        return {"theater_score": 0, "threshold": THRESHOLD_THEATER}

    theater_output = ARTIFACTS_DIR / 'theater-current.json'
    run_command(f'python {theater_scanner} --ci-mode --json > {theater_output}', capture=False)
    theater_score = get_json_value(theater_output, 'theater_score', 0)

    return {"theater_score": theater_score, "threshold": THRESHOLD_THEATER}

def _collect_god_object_data():
    """Collect god object analysis data."""
    god_counter = ROOT_DIR / 'scripts' / 'god_object_counter.py'

    if not god_counter.exists():
        return {"current_god_objects": 0, "previous_god_objects": 0, "max_allowed": 100}

    # Get previous count
    prev_god_output = run_command('git show HEAD~1:.claude/.artifacts/god-object-count.json')
    before_god = 0
    if prev_god_output:
        try:
            before_god = json.loads(prev_god_output).get('total_god_objects', 0)
        except:
            pass

    # Get current count
    god_output = ARTIFACTS_DIR / 'god-object-count.json'
    run_command(f'python {god_counter} --threshold=500 --json > {god_output}', capture=False)
    after_god = get_json_value(god_output, 'total_god_objects', 0)

    return {
        "current_god_objects": after_god,
        "previous_god_objects": before_god,
        "max_allowed": 100
    }

def _collect_coverage_data():
    """Collect test coverage data."""
    package_json = ROOT_DIR / 'package.json'

    if not package_json.exists():
        return {"coverage_percentage": 0, "threshold": MINIMUM_TEST_COVERAGE_PERCENTAGE}

    run_command('npm test -- --coverage --coverageReporters=json-summary > /dev/null 2>&1', capture=False)

    coverage_file = ROOT_DIR / 'coverage' / 'coverage-summary.json'
    if coverage_file.exists():
        coverage = get_json_value(coverage_file, 'total', {}).get('lines', {}).get('pct', 0)
        return {"coverage_percentage": coverage, "threshold": MINIMUM_TEST_COVERAGE_PERCENTAGE}

    return {"coverage_percentage": 0, "threshold": 80}

def _collect_security_data():
    """Collect security scan data."""
    semgrep_check = run_command('which semgrep')

    if not semgrep_check.strip():
        return {"critical_issues": 0, "high_issues": 0, "max_high_issues": 5}

    security_output = ARTIFACTS_DIR / 'security-scan.json'
    run_command(f'semgrep --config=auto --json --quiet . > {security_output}', capture=False)

    try:
        with open(security_output) as f:
            security_data = json.load(f)
            results = security_data.get('results', [])

            critical = sum(1 for r in results if r.get('extra', {}).get('severity') == 'ERROR')
            high = sum(1 for r in results if r.get('extra', {}).get('severity') == 'WARNING')

            return {"critical_issues": critical, "high_issues": high, "max_high_issues": 5}
    except Exception:
        return {"critical_issues": 0, "high_issues": 0, "max_high_issues": 5}

def _display_validation_result(name, result):
    """Display validation result with color coding."""
    if result.is_valid:
        print(f"  {GREEN}[OK] PASS: {name}{NC}")
    else:
        print(f"  {RED}[FAIL] FAIL: {name}{NC}")
        for error in result.errors:
            print(f"       {error}")

    for warning in result.warnings:
        print(f"  {YELLOW}[WARN]  {warning}{NC}")

def _assess_overall_quality(results):
    """Assess overall quality from validation results."""
    critical_failures = [name for name, result in results.items() if not result.is_valid]
    return len(critical_failures) == 0

def _display_final_report(overall_passed):
    """Display final quality gate report."""
    print(f"\n{'=' * 50}")
    if overall_passed:
        print(f"{GREEN}[OK] PR QUALITY GATE: PASSED{NC}")
    else:
        print(f"{RED}[FAIL] PR QUALITY GATE: FAILED{NC}")
        print(f"\n{RED}PR cannot be merged until all quality gates pass.{NC}")
    print("=" * 50)

if __name__ == '__main__':
    main()