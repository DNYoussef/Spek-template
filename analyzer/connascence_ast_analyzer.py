#!/usr/bin/env python3
"""
Connascence AST Analyzer Wrapper
================================

Backward compatibility wrapper for connascence_ast_analyzer.
Redirects to the main ConnascenceAnalyzer class.
"""

# Import the main analyzer
from .connascence_analyzer import ConnascenceAnalyzer

# For backward compatibility, expose the same interface
__all__ = ['ConnascenceAnalyzer']

# Allow this module to be run directly
if __name__ == "__main__":
    import sys
    import json

    # Create analyzer instance
    analyzer = ConnascenceAnalyzer()

    # Run analysis on provided path or current directory
    path = sys.argv[1] if len(sys.argv) > 1 else "."
    result = analyzer.analyze_path(path)

    # Output results as JSON
    print(json.dumps(result, indent=2, default=str))