#!/usr/bin/env python3
"""
Quality Gate Checker
Enforces quality thresholds on scan results
"""

import json
import sys
from pathlib import Path

def count_god_objects():
    """Count files >500 LOC"""
    god_objects = 0
    for path in Path('.').rglob('*.py'):
        if path.stat().st_size > 0:
            try:
                with open(path, encoding='utf-8', errors='ignore') as f:
                    lines = len([l for l in f if l.strip() and not l.strip().startswith('#')])
                    if lines > 500:
                        god_objects += 1
            except Exception:
                pass  # Skip files that can't be read

    for path in Path('.').rglob('*.ts'):
        if path.stat().st_size > 0:
            try:
                with open(path, encoding='utf-8', errors='ignore') as f:
                    lines = len([l for l in f if l.strip() and not l.strip().startswith('//')])
                    if lines > 500:
                        god_objects += 1
            except Exception:
                pass  # Skip files that can't be read

    return god_objects

def check_quality_gates(scan_file):
    """Check if scan results pass quality gates"""

    with open(scan_file) as f:
        data = json.load(f)

    summary = data.get('summary', {})
    violations_by_severity = summary.get('violations_by_severity', {})

    critical = violations_by_severity.get('critical', 0)
    high = violations_by_severity.get('high', 0)
    medium = violations_by_severity.get('medium', 0)
    total = summary.get('total_violations', 0)

    god_objects = count_god_objects()

    passed = True

    print("=" * 60)
    print("QUALITY GATE CHECK")
    print("=" * 60)

    # Gate 1: No critical violations
    if critical > 0:
        print(f"X GATE 1 FAILED: {critical} critical violations (must be 0)")
        passed = False
    else:
        print(f"OK GATE 1 PASSED: 0 critical violations")

    # Gate 2: Max 100 high violations
    if high > 100:
        print(f"X GATE 2 FAILED: {high} high violations (max 100)")
        passed = False
    else:
        print(f"OK GATE 2 PASSED: {high} high violations (within limit)")

    # Gate 3: Max 100 god objects
    if god_objects > 100:
        print(f"X GATE 3 FAILED: {god_objects} god objects (max 100)")
        passed = False
    else:
        print(f"OK GATE 3 PASSED: {god_objects} god objects (within limit)")

    # Gate 4: Total violations trend
    print(f"\nMETRICS:")
    print(f"   Total Violations: {total}")
    print(f"   Medium Violations: {medium}")
    print(f"   God Objects: {god_objects}")

    print("=" * 60)

    if passed:
        print("OK ALL QUALITY GATES PASSED")
        return 0
    else:
        print("X QUALITY GATES FAILED")
        return 1

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/quality-gate-check.py <scan-file.json>")
        sys.exit(1)

    scan_file = sys.argv[1]

    if not Path(scan_file).exists():
        print(f"Error: {scan_file} not found")
        sys.exit(1)

    exit_code = check_quality_gates(scan_file)
    sys.exit(exit_code)