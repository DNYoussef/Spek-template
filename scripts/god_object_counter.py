#!/usr/bin/env python3
"""
God Object Counter - Detects files exceeding LOC thresholds
Real implementation that can actually fail based on configurable thresholds
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, List, Tuple

# Configurable thresholds
LOC_THRESHOLD = 500  # Lines of code per file
MAX_GOD_OBJECTS = 100  # Maximum allowed god objects

def count_lines(file_path: str) -> int:
    """Count non-empty, non-comment lines in a file"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            # Filter out empty lines and comment-only lines
            code_lines = [
                line for line in lines
                if line.strip() and not line.strip().startswith(('#', '//', '/*', '*', '"""', "'''"))
            ]
            return len(code_lines)
    except Exception as e:
        print(f"Error reading {file_path}: {e}", file=sys.stderr)
        return 0

def find_god_objects(root_dir: str) -> List[Dict]:
    """Find all files exceeding LOC threshold"""
    god_objects = []

    # File extensions to check
    extensions = {'.js', '.ts', '.py', '.jsx', '.tsx', '.java', '.cpp', '.c', '.go', '.rs'}

    # Directories to exclude
    exclude_dirs = {'node_modules', '.git', 'dist', 'build', 'coverage', '__pycache__', '.next', 'vendor'}

    for root, dirs, files in os.walk(root_dir):
        # Remove excluded directories from traversal
        dirs[:] = [d for d in dirs if d not in exclude_dirs]

        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)
                loc = count_lines(file_path)

                if loc > LOC_THRESHOLD:
                    relative_path = os.path.relpath(file_path, root_dir)
                    god_objects.append({
                        'file': relative_path,
                        'loc': loc,
                        'threshold': LOC_THRESHOLD,
                        'excess': loc - LOC_THRESHOLD
                    })

    return sorted(god_objects, key=lambda x: x['loc'], reverse=True)

def generate_report(god_objects: List[Dict], output_path: str = None) -> Dict:
    """Generate comprehensive god object report"""
    report = {
        'timestamp': __import__('datetime').datetime.now().isoformat(),
        'threshold': LOC_THRESHOLD,
        'max_allowed': MAX_GOD_OBJECTS,
        'total_god_objects': len(god_objects),
        'status': 'PASS' if len(god_objects) <= MAX_GOD_OBJECTS else 'FAIL',
        'god_objects': god_objects,
        'top_10_offenders': god_objects[:10] if god_objects else [],
        'metrics': {
            'total_excess_loc': sum(obj['excess'] for obj in god_objects),
            'avg_god_object_size': sum(obj['loc'] for obj in god_objects) // len(god_objects) if god_objects else 0,
            'largest_god_object': god_objects[0] if god_objects else None
        }
    }

    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"Report saved to: {output_path}")

    return report

def main():
    """Main execution"""
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # Parse arguments
    ci_mode = '--ci-mode' in sys.argv
    json_output = '--json' in sys.argv
    threshold_arg = next((arg.split('=')[1] for arg in sys.argv if arg.startswith('--threshold=')), None)

    # Update threshold if provided
    global LOC_THRESHOLD
    if threshold_arg:
        LOC_THRESHOLD = int(threshold_arg)

    # Find god objects
    god_objects = find_god_objects(root_dir)

    # Generate report
    output_path = os.path.join(root_dir, '.claude', '.artifacts', 'god-object-count.json')
    report = generate_report(god_objects, output_path)

    # Output results
    if json_output:
        print(json.dumps(report, indent=2))
    else:
        print(f"\n{'='*60}")
        print(f"GOD OBJECT ANALYSIS")
        print(f"{'='*60}")
        print(f"Threshold: {LOC_THRESHOLD} LOC")
        print(f"Maximum Allowed: {MAX_GOD_OBJECTS} god objects")
        print(f"Total Found: {len(god_objects)}")
        print(f"Status: {report['status']}")
        print(f"{'='*60}\n")

        if god_objects:
            print("Top 10 Offenders:")
            for i, obj in enumerate(report['top_10_offenders'], 1):
                print(f"  {i}. {obj['file']}: {obj['loc']} LOC (+{obj['excess']} over threshold)")
        else:
            print("✅ No god objects found!")

    # Exit with appropriate code for CI
    if ci_mode:
        sys.exit(0 if report['status'] == 'PASS' else 1)
    else:
        # Just print the count for other scripts
        print(len(god_objects))
        sys.exit(0)

if __name__ == '__main__':
    main()