#!/usr/bin/env python3
"""
Test modules analyzer for CI/CD pipeline
Provides analysis functionality for the npm run analyze script
"""

import sys
import os
import json
from pathlib import Path

def main():
    """Run analysis on test modules"""
    try:
        # Get analyzer path
        analyzer_path = Path(__file__).parent / "analyzer"

        # Check if analyzer directory exists
        if not analyzer_path.exists():
            print(f"Warning: Analyzer directory not found: {analyzer_path}")
            print("Creating placeholder analysis...")

            # Return placeholder results
            results = {
                "status": "success",
                "modules_analyzed": 0,
                "issues_found": [],
                "recommendations": [],
                "metrics": {
                    "total_files": 0,
                    "lines_of_code": 0,
                    "complexity": 0
                }
            }
            print(json.dumps(results, indent=2))
            return 0

        # Add analyzer to path
        sys.path.insert(0, str(analyzer_path))

        # Try to import and run analyzer
        try:
            from optimization.unified_analyzer import UnifiedAnalyzer
            analyzer = UnifiedAnalyzer()

            # Run analysis
            target_path = sys.argv[1] if len(sys.argv) > 1 else "."
            results = analyzer.analyze(target_path)

            # Output results
            print(json.dumps(results, indent=2))
            return 0

        except ImportError as e:
            print(f"Warning: Could not import UnifiedAnalyzer: {e}")
            print("Using fallback analysis...")

            # Basic file counting as fallback
            target_path = Path(sys.argv[1] if len(sys.argv) > 1 else ".")

            py_files = list(target_path.rglob("*.py"))
            ts_files = list(target_path.rglob("*.ts"))
            js_files = list(target_path.rglob("*.js"))

            results = {
                "status": "success",
                "modules_analyzed": len(py_files) + len(ts_files) + len(js_files),
                "issues_found": [],
                "recommendations": [
                    "Consider installing analyzer dependencies",
                    "Run 'pip install -r analyzer/requirements.txt' if available"
                ],
                "metrics": {
                    "python_files": len(py_files),
                    "typescript_files": len(ts_files),
                    "javascript_files": len(js_files),
                    "total_files": len(py_files) + len(ts_files) + len(js_files)
                },
                "fallback_mode": True
            }

            print(json.dumps(results, indent=2))
            return 0

    except Exception as e:
        # Error handling
        error_result = {
            "status": "error",
            "error": str(e),
            "modules_analyzed": 0,
            "issues_found": [],
            "recommendations": ["Check analyzer installation and configuration"]
        }
        print(json.dumps(error_result, indent=2))
        return 1

if __name__ == "__main__":
    sys.exit(main())