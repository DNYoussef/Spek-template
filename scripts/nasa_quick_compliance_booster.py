#!/usr/bin/env python3
"""
Quick NASA POT10 Compliance Booster
Targets easy wins for Rule 2 (long functions) and Rule 3 (nesting depth).
"""

import json
import sys
from pathlib import Path
from typing import List, Dict, Any

def load_violations(json_path: str) -> List[Dict[str, Any]]:
    """Load NASA violations from analyzer output."""
    with open(json_path, 'r') as f:
        data = json.load(f)
    return data.get('nasa_compliance', {}).get('violations', [])

def group_violations_by_file(violations: List[Dict]) -> Dict[str, List[Dict]]:
    """Group violations by file path."""
    by_file = {}
    for v in violations:
        file_path = v['file_path']
        if file_path not in by_file:
            by_file[file_path] = []
        by_file[file_path].append(v)
    return by_file

def analyze_long_functions(violations: List[Dict]) -> Dict[str, Any]:
    """Analyze Rule 2 violations (functions >60 LOC)."""
    rule2 = [v for v in violations if v['rule_id'] == 'NASA_POT10_RULE_2']

    by_file = {}
    for v in rule2:
        file_path = v['file_path']
        if file_path not in by_file:
            by_file[file_path] = []
        by_file[file_path].append({
            'line': v['line_number'],
            'description': v['description'],
            'severity': v['severity']
        })

    return {
        'total': len(rule2),
        'files': by_file,
        'top_offenders': sorted(
            [(f, len(viols)) for f, viols in by_file.items()],
            key=lambda x: x[1],
            reverse=True
        )[:10]
    }

def analyze_nesting_depth(violations: List[Dict]) -> Dict[str, Any]:
    """Analyze Rule 3 violations (nesting depth >4)."""
    rule3 = [v for v in violations if v['rule_id'] == 'NASA_POT10_RULE_3']

    by_file = {}
    for v in rule3:
        file_path = v['file_path']
        if file_path not in by_file:
            by_file[file_path] = []
        by_file[file_path].append({
            'line': v['line_number'],
            'description': v['description'],
            'severity': v['severity']
        })

    return {
        'total': len(rule3),
        'files': by_file,
        'top_offenders': sorted(
            [(f, len(viols)) for f, viols in by_file.items()],
            key=lambda x: x[1],
            reverse=True
        )[:10]
    }

def generate_fix_recommendations(analysis: Dict[str, Any]) -> str:
    """Generate actionable fix recommendations."""
    report = []
    report.append("=" * 80)
    report.append("NASA POT10 COMPLIANCE BOOST RECOMMENDATIONS")
    report.append("=" * 80)
    report.append("")

    report.append(f"RULE 2: Long Functions (>60 LOC) - {analysis['rule2']['total']} violations")
    report.append("-" * 80)
    report.append("Top 10 files to fix:")
    for file_path, count in analysis['rule2']['top_offenders']:
        report.append(f"  {count:2d} violations: {file_path}")
    report.append("")
    report.append("Quick fixes:")
    report.append("  1. Extract helper functions for complex logic blocks")
    report.append("  2. Move validation logic to separate functions")
    report.append("  3. Extract loop bodies into dedicated functions")
    report.append("")

    report.append(f"RULE 3: Nesting Depth (>4) - {analysis['rule3']['total']} violations")
    report.append("-" * 80)
    report.append("Top 10 files to fix:")
    for file_path, count in analysis['rule3']['top_offenders']:
        report.append(f"  {count:2d} violations: {file_path}")
    report.append("")
    report.append("Quick fixes:")
    report.append("  1. Use early returns (guard clauses) to reduce nesting")
    report.append("  2. Extract nested blocks into helper functions")
    report.append("  3. Invert conditions to flatten code structure")
    report.append("")

    total_violations = analysis['rule2']['total'] + analysis['rule3']['total']
    current_score = analysis.get('current_score', 0)
    target_score = 0.70

    violations_to_fix = int((target_score - current_score) * 216 * 15)  # Approximate

    report.append("=" * 80)
    report.append("COMPLIANCE TARGET")
    report.append("-" * 80)
    report.append(f"Current Score: {current_score*100:.1f}%")
    report.append(f"Target Score: {target_score*100:.1f}%")
    report.append(f"Total Violations: {total_violations}")
    report.append(f"Violations to Fix: ~{violations_to_fix}")
    report.append("")
    report.append("PRIORITY:")
    report.append("  1. Fix top 3 files with Rule 2 violations (easy wins)")
    report.append("  2. Fix top 3 files with Rule 3 violations (bigger impact)")
    report.append("  3. Re-run analyzer to measure progress")
    report.append("=" * 80)

    return "\n".join(report)

def main():
    if len(sys.argv) < 2:
        print("Usage: python nasa_quick_compliance_booster.py <violations.json>")
        print("Example: python nasa_quick_compliance_booster.py .claude/.artifacts/test-json-fix-v2.json")
        sys.exit(1)

    violations_file = sys.argv[1]

    if not Path(violations_file).exists():
        print(f"Error: File not found: {violations_file}")
        sys.exit(1)

    violations = load_violations(violations_file)

    analysis = {
        'rule2': analyze_long_functions(violations),
        'rule3': analyze_nesting_depth(violations),
        'current_score': 0.4719  # From analyzer output
    }

    report = generate_fix_recommendations(analysis)

    print(report)

    output_file = Path(".claude/.artifacts/nasa-compliance-boost-plan.txt")
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(report)
    print(f"\nReport saved to: {output_file}")

if __name__ == "__main__":
    main()