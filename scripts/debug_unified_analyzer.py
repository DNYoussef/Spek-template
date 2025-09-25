#!/usr/bin/env python3
"""
Debug script to trace where violations are being lost in the unified analyzer
"""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

def debug_unified_analyzer():
    """Debug the unified analyzer to find where violations disappear."""

    from analyzer.unified_analyzer import UnifiedConnascenceAnalyzer

    # Create analyzer
    analyzer = UnifiedConnascenceAnalyzer()

    # Test the AST analyzer directly
    ast_results = analyzer.ast_analyzer.analyze_directory('src/adapters')
    print(f"   AST analyzer found: {len(ast_results)} violations")

    # Test the _run_ast_analysis method
    project_path = Path('src/adapters')
    ast_analysis_results = analyzer._run_ast_analysis(project_path)
    print(f"   _run_ast_analysis returned: {len(ast_analysis_results)} violations")

    # Test the full analyze_project method
    result = analyzer.analyze_project('src/adapters', policy_preset='lenient')

    if hasattr(result, 'violations'):
        print(f"   analyze_project returned: {len(result.violations)} violations")
    else:
        print(f"   analyze_project result type: {type(result)}")
        print(f"   Result attributes: {dir(result)}")

    # Check if violations are in a different attribute
    print("\n4. Checking result structure:")
    if hasattr(result, '__dict__'):
        for key, value in result.__dict__.items():
            if isinstance(value, list):
                print(f"   {key}: list with {len(value)} items")
            else:
                print(f"   {key}: {type(value).__name__}")

    # Check for errors
    if hasattr(result, 'errors'):
        print(f"\n5. Errors in result: {result.errors}")

    # Direct check of violations
    print("\n6. Attempting direct violation extraction:")
    if hasattr(result, 'violations'):
        print(f"   Found {len(result.violations)} violations")
        if result.violations:
            print("   First violation:", result.violations[0])
    elif hasattr(result, 'all_violations'):
        print(f"   Found {len(result.all_violations)} in all_violations")
    elif hasattr(result, 'results'):
        print(f"   Found results attribute: {type(result.results)}")

    return result

if __name__ == "__main__":
    result = debug_unified_analyzer()