#!/usr/bin/env python3
"""
File-level Analyzer Wrapper
Provides CLI interface to RealUnifiedAnalyzer
"""
from pathlib import Path
import json
import sys

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from analyzer.real_unified_analyzer import RealUnifiedAnalyzer

def main():
    if len(sys.argv) < 2:
        print("Usage: analyze_file.py <file-path>")
        sys.exit(1)

    file_path = sys.argv[1]
    output_file = f".claude/.artifacts/post-edit-scan-{Path(file_path).name}.json"

    if not Path(file_path).exists():
        print(f"Error: File not found: {file_path}")
        sys.exit(1)

    try:
        analyzer = RealUnifiedAnalyzer()
        result = analyzer.analyze_file(file_path)

        # Save full results
        result_dict = result.to_dict() if hasattr(result, 'to_dict') else result
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result_dict, f, indent=2)

        # Get violations count
        if isinstance(result, dict):
            total_violations = result.get('total_violations', 0)
        else:
            total_violations = result.total_violations

        # Report to user
        if total_violations > 0:
            print(f"X {total_violations} violations found in {file_path}")

            # Show top violations
            if isinstance(result, dict):
                all_violations = result.get('connascence_violations', []) + result.get('nasa_violations', [])
            else:
                all_violations = result.connascence_violations + result.nasa_violations

            for v in all_violations[:5]:
                if isinstance(v, dict):
                    severity = v.get('severity', 'UNKNOWN').upper()
                    desc = v.get('description', str(v))
                    line = v.get('line_number', 0)
                else:
                    severity = v.severity.upper() if hasattr(v, 'severity') else 'UNKNOWN'
                    desc = v.description if hasattr(v, 'description') else str(v)
                    line = v.line_number if hasattr(v, 'line_number') else 0
                print(f"  {severity} at line {line}: {desc}")

            if len(all_violations) > 5:
                print(f"  ... and {len(all_violations) - 5} more violations")

            print(f"\nFull report: {output_file}")
            sys.exit(1)
        else:
            print(f"OK {file_path} passes validation")
            sys.exit(0)

    except Exception as e:
        print(f"X Analysis failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()