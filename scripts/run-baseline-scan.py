#!/usr/bin/env python3
"""
Baseline Scanner - Post-Phase 0 Analysis
Runs comprehensive analyzer scan and saves results
"""
import sys
import os
import json
from pathlib import Path

# Add analyzer to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'analyzer'))

from real_unified_analyzer import RealUnifiedAnalyzer

def run_baseline_scan(project_path: str, output_path: str):
    """Run comprehensive baseline scan"""
    print(f"Running baseline scan on: {project_path}")
    print(f"Output will be saved to: {output_path}")

    # Initialize analyzer
    analyzer = RealUnifiedAnalyzer(project_path)

    # Run analysis
    print("\nAnalyzing codebase...")
    result = analyzer.analyze()

    # Convert result to dict
    if hasattr(result, 'to_dict'):
        result_dict = result.to_dict()
    elif hasattr(result, '__dict__'):
        result_dict = result.__dict__
    else:
        result_dict = {
            'violations': result.violations if hasattr(result, 'violations') else [],
            'summary': result.summary if hasattr(result, 'summary') else {},
            'metadata': result.metadata if hasattr(result, 'metadata') else {}
        }

    # Save results
    print(f"\nSaving results to: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result_dict, f, indent=2, ensure_ascii=False)

    # Print summary
    summary = result_dict.get('summary', {})
    violations = result_dict.get('violations', [])

    print("\n" + "="*60)
    print("BASELINE SCAN COMPLETE")
    print("="*60)
    print(f"Total Violations: {len(violations)}")

    # Count by severity
    critical = sum(1 for v in violations if v.get('severity') == 'critical')
    high = sum(1 for v in violations if v.get('severity') == 'high')
    medium = sum(1 for v in violations if v.get('severity') == 'medium')

    print(f"Critical (CoA): {critical}")
    print(f"High (CoP): {high}")
    print(f"Medium (CoM): {medium}")

    # Count god objects
    file_stats = result_dict.get('file_stats', {})
    god_objects = sum(1 for file, stats in file_stats.items() if stats.get('lines_of_code', 0) > 500)
    print(f"God Objects (>500 LOC): {god_objects}")
    print("="*60)

    return result_dict

if __name__ == '__main__':
    project_path = sys.argv[1] if len(sys.argv) > 1 else '.'
    output_path = sys.argv[2] if len(sys.argv) > 2 else '.claude/.artifacts/baseline-post-phase0.json'

    try:
        run_baseline_scan(project_path, output_path)
        print("\nScan completed successfully!")
        sys.exit(0)
    except Exception as e:
        print(f"\nError during scan: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)