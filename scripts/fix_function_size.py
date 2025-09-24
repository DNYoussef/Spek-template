#!/usr/bin/env python3
"""
NASA Rule 3 Function Size Analyzer and Reporter
Detects functions over 60 lines and generates fix recommendations.
"""

import re
from pathlib import Path
from typing import List, Dict, Tuple
import json

def analyze_function_sizes(filepath: str) -> List[Dict]:
    """Analyze function sizes in a Python file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    oversized_functions = []
    current_function = None
    indent_stack = []

    for i, line in enumerate(lines, 1):
        # Detect function definition
        func_match = re.match(r'^(\s*)(async\s+)?def\s+(\w+)', line)
        if func_match:
            indent = len(func_match.group(1))
            func_name = func_match.group(3)

            # Close previous function if any
            if current_function and i > current_function['start']:
                current_function['end'] = i - 1
                current_function['size'] = current_function['end'] - current_function['start'] + 1

                if current_function['size'] > 60:
                    oversized_functions.append(current_function)

            # Start new function
            current_function = {
                'name': func_name,
                'start': i,
                'end': i,
                'size': 1,
                'indent': indent
            }
            indent_stack = [indent]

        elif current_function:
            # Check if we're still in the function
            stripped = line.lstrip()
            if stripped and not stripped.startswith('#'):
                current_indent = len(line) - len(stripped)

                # If dedented to or beyond function level, function ends
                if current_indent <= current_function['indent'] and i > current_function['start']:
                    current_function['end'] = i - 1
                    current_function['size'] = current_function['end'] - current_function['start'] + 1

                    if current_function['size'] > 60:
                        oversized_functions.append(current_function)

                    current_function = None
                    indent_stack = []

    # Close last function if any
    if current_function:
        current_function['end'] = len(lines)
        current_function['size'] = current_function['end'] - current_function['start'] + 1
        if current_function['size'] > 60:
            oversized_functions.append(current_function)

    return oversized_functions

def generate_report(files: List[str]) -> Dict:
    """Generate comprehensive report of oversized functions."""
    report = {
        'timestamp': '2025-09-23T00:00:00Z',
        'nasa_rule': 'Rule 3: Function Size <= 60 lines',
        'files_analyzed': len(files),
        'total_violations': 0,
        'files': {}
    }

    for filepath in files:
        oversized = analyze_function_sizes(filepath)
        if oversized:
            report['files'][filepath] = {
                'violation_count': len(oversized),
                'functions': sorted(oversized, key=lambda x: x['size'], reverse=True)
            }
            report['total_violations'] += len(oversized)

    return report

def main():
    """Main execution."""
    files = [
        'analyzer/enterprise/validation/EnterprisePerformanceValidator.py',
        'analyzer/enterprise/integration/EnterpriseIntegrationFramework.py',
        'analyzer/enterprise/supply_chain/evidence_packager.py'
    ]

    print("NASA Rule 3 (Function Size) Violation Detector")
    print("=" * 60)
    print()

    report = generate_report(files)

    # Print summary
    print(f"Files Analyzed: {report['files_analyzed']}")
    print(f"Total Violations: {report['total_violations']}")
    print()

    # Print detailed violations
    for filepath, data in report['files'].items():
        print(f"\n{filepath}:")
        print(f"  Violations: {data['violation_count']}")
        print()
        for func in data['functions']:
            print(f"  - {func['name']}: lines {func['start']}-{func['end']} ({func['size']} lines)")
            violation = func['size'] - 60
            print(f"    VIOLATION: {violation} lines over limit")

    # Save report
    output_file = Path('.claude/.artifacts/nasa_rule3_violations.json')
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n\nDetailed report saved to: {output_file}")

    return 0 if report['total_violations'] == 0 else 1

if __name__ == '__main__':
    exit(main())