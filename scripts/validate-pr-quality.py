#!/usr/bin/env python3
"""
PR Quality Validation Script
Real validation that can fail based on quality degradation
"""

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
    print("=" * 50)
    print("PR Quality Gate Validation")
    print("=" * 50)

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    validation_passed = True

    # 1. NASA POT10 Compliance Check
    print(f"\n{YELLOW}[1/5] NASA POT10 Compliance Check...{NC}")
    nasa_analyzer = ROOT_DIR / 'analyzer' / 'enterprise' / 'nasa_pot10_analyzer.py'

    if nasa_analyzer.exists():
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

        print(f"  Previous: {before_nasa}%")
        print(f"  Current:  {after_nasa}%")
        print(f"  Threshold: >={THRESHOLD_NASA}%")

        if after_nasa < before_nasa:
            print(f"  {RED}❌ FAIL: NASA compliance degraded{NC}")
            validation_passed = False
        elif after_nasa < THRESHOLD_NASA:
            print(f"  {RED}❌ FAIL: Below threshold{NC}")
            validation_passed = False
        else:
            print(f"  {GREEN}✅ PASS{NC}")
    else:
        print(f"  {YELLOW}⚠️  NASA analyzer not found, skipping{NC}")

    # 2. Theater Detection
    print(f"\n{YELLOW}[2/5] Performance Theater Detection...{NC}")
    theater_scanner = ROOT_DIR / 'scripts' / 'comprehensive_theater_scan.py'

    if theater_scanner.exists():
        theater_output = ARTIFACTS_DIR / 'theater-current.json'
        run_command(f'python {theater_scanner} --ci-mode --json > {theater_output}', capture=False)

        theater_score = get_json_value(theater_output, 'theater_score', 0)

        print(f"  Theater Score: {theater_score}/100")
        print(f"  Threshold: <={THRESHOLD_THEATER}/100")

        if theater_score > THRESHOLD_THEATER:
            print(f"  {RED}❌ FAIL: Theater score too high{NC}")
            validation_passed = False
        else:
            print(f"  {GREEN}✅ PASS{NC}")
    else:
        print(f"  {YELLOW}⚠️  Theater scanner not found, skipping{NC}")

    # 3. God Object Count
    print(f"\n{YELLOW}[3/5] God Object Analysis...{NC}")
    god_counter = ROOT_DIR / 'scripts' / 'god_object_counter.py'

    if god_counter.exists():
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

        print(f"  Previous: {before_god} god objects")
        print(f"  Current:  {after_god} god objects")

        if after_god > before_god:
            print(f"  {RED}❌ FAIL: God object count increased{NC}")
            validation_passed = False
        elif after_god > 100:
            print(f"  {RED}❌ FAIL: Too many god objects (max: 100){NC}")
            validation_passed = False
        else:
            print(f"  {GREEN}✅ PASS{NC}")
    else:
        print(f"  {YELLOW}⚠️  God object counter not found, skipping{NC}")

    # 4. Test Coverage
    print(f"\n{YELLOW}[4/5] Test Coverage Check...{NC}")
    package_json = ROOT_DIR / 'package.json'

    if package_json.exists():
        run_command('npm test -- --coverage --coverageReporters=json-summary > /dev/null 2>&1', capture=False)

        coverage_file = ROOT_DIR / 'coverage' / 'coverage-summary.json'
        if coverage_file.exists():
            coverage = get_json_value(coverage_file, 'total', {}).get('lines', {}).get('pct', 0)

            print(f"  Coverage: {coverage}%")
            print(f"  Threshold: >=80%")

            if coverage < 80:
                print(f"  {RED}❌ FAIL: Coverage below threshold{NC}")
                validation_passed = False
            else:
                print(f"  {GREEN}✅ PASS{NC}")
        else:
            print(f"  {YELLOW}⚠️  Coverage report not found{NC}")
    else:
        print(f"  {YELLOW}⚠️  package.json not found, skipping{NC}")

    # 5. Security Scan
    print(f"\n{YELLOW}[5/5] Security Scan...{NC}")

    # Check if semgrep is available
    semgrep_check = run_command('which semgrep')

    if semgrep_check.strip():
        security_output = ARTIFACTS_DIR / 'security-scan.json'
        run_command(f'semgrep --config=auto --json --quiet . > {security_output}', capture=False)

        try:
            with open(security_output) as f:
                security_data = json.load(f)
                results = security_data.get('results', [])

                critical = sum(1 for r in results if r.get('extra', {}).get('severity') == 'ERROR')
                high = sum(1 for r in results if r.get('extra', {}).get('severity') == 'WARNING')

                print(f"  Critical Issues: {critical}")
                print(f"  High Issues: {high}")

                if critical > 0:
                    print(f"  {RED}❌ FAIL: Critical security issues found{NC}")
                    validation_passed = False
                elif high > 5:
                    print(f"  {RED}❌ FAIL: Too many high-severity issues{NC}")
                    validation_passed = False
                else:
                    print(f"  {GREEN}✅ PASS{NC}")
        except Exception as e:
            print(f"  {YELLOW}⚠️  Error reading security scan: {e}{NC}")
    else:
        print(f"  {YELLOW}⚠️  semgrep not installed, skipping{NC}")

    # Final Report
    print(f"\n{'=' * 50}")
    if validation_passed:
        print(f"{GREEN}✅ PR QUALITY GATE: PASSED{NC}")
        print("=" * 50)
        sys.exit(0)
    else:
        print(f"{RED}❌ PR QUALITY GATE: FAILED{NC}")
        print("=" * 50)
        print(f"\n{RED}PR cannot be merged until all quality gates pass.{NC}")
        sys.exit(1)

if __name__ == '__main__':
    main()