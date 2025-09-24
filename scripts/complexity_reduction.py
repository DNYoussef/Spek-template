#!/usr/bin/env python3
"""
Phase 3.3: Complexity Reduction Script
Identifies and suggests fixes for high cyclomatic complexity violations (NASA Rule 1).

NASA POT10 Rule 1: All functions must have cyclomatic complexity <= 10
"""

import ast
import sys
from pathlib import Path
from typing import List, Dict, Tuple, Any
from dataclasses import dataclass


@dataclass
class ComplexityViolation:
    """Represents a function with excessive complexity."""
    file_path: str
    function_name: str
    line_number: int
    complexity: int
    suggestions: List[str]


class ComplexityAnalyzer:
    """Analyzes cyclomatic complexity and suggests refactoring."""

    def __init__(self, threshold: int = 10):
        self.threshold = threshold
        self.violations: List[ComplexityViolation] = []

    def calculate_complexity(self, node: ast.FunctionDef) -> int:
        """
        Calculate McCabe cyclomatic complexity.

        Counts decision points:
        - if, elif, else (each branch point)
        - for, while loops
        - except handlers
        - with statements
        - boolean operators (and, or)
        """
        complexity = 1  # Base complexity

        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.ExceptHandler, ast.With)):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                # Each boolean operator adds complexity
                complexity += len(child.values) - 1

        return complexity

    def generate_suggestions(self, node: ast.FunctionDef, complexity: int) -> List[str]:
        """Generate refactoring suggestions based on code patterns."""
        suggestions = []

        # Count different complexity sources
        if_count = sum(1 for n in ast.walk(node) if isinstance(n, ast.If))
        loop_count = sum(1 for n in ast.walk(node) if isinstance(n, (ast.For, ast.While)))
        try_count = sum(1 for n in ast.walk(node) if isinstance(n, ast.ExceptHandler))

        if if_count > 3:
            suggestions.append(
                f"Extract method: {if_count} if statements - consider extracting validation logic to separate methods"
            )

        if loop_count > 1:
            suggestions.append(
                f"Extract loops: {loop_count} loops - consider extracting loop bodies to helper methods"
            )

        if try_count > 2:
            suggestions.append(
                f"Error handling: {try_count} try/except blocks - consider using error handler class"
            )

        # Check for deep nesting
        max_depth = self._get_max_nesting_depth(node)
        if max_depth > 3:
            suggestions.append(
                f"Reduce nesting: max depth {max_depth} - use guard clauses (early returns) to reduce nesting"
            )

        # Generic suggestions
        suggestions.append(
            "Apply Extract Method refactoring: Break into smaller functions (<= 10 complexity each)"
        )

        if complexity > 15:
            suggestions.append(
                "Consider Strategy Pattern: Use polymorphism to replace complex conditionals"
            )

        return suggestions

    def _get_max_nesting_depth(self, node: ast.AST, current_depth: int = 0) -> int:
        """Calculate maximum nesting depth of control structures."""
        max_depth = current_depth

        for child in ast.iter_child_nodes(node):
            if isinstance(child, (ast.If, ast.For, ast.While, ast.With, ast.Try)):
                child_depth = self._get_max_nesting_depth(child, current_depth + 1)
                max_depth = max(max_depth, child_depth)
            else:
                child_depth = self._get_max_nesting_depth(child, current_depth)
                max_depth = max(max_depth, child_depth)

        return max_depth

    def analyze_file(self, file_path: Path) -> List[ComplexityViolation]:
        """Analyze a single file for complexity violations."""
        try:
            code = file_path.read_text(encoding='utf-8')
            tree = ast.parse(code)
            violations = []

            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    complexity = self.calculate_complexity(node)

                    if complexity > self.threshold:
                        suggestions = self.generate_suggestions(node, complexity)
                        violation = ComplexityViolation(
                            file_path=str(file_path),
                            function_name=node.name,
                            line_number=node.lineno,
                            complexity=complexity,
                            suggestions=suggestions
                        )
                        violations.append(violation)

            return violations

        except Exception as e:
            print(f"Error analyzing {file_path}: {e}", file=sys.stderr)
            return []

    def analyze_project(self, project_path: Path, pattern: str = "**/*.py") -> None:
        """Analyze all Python files in project."""
        for file_path in project_path.glob(pattern):
            if '__pycache__' in str(file_path) or '.git' in str(file_path):
                continue

            violations = self.analyze_file(file_path)
            self.violations.extend(violations)

        # Sort by complexity (highest first)
        self.violations.sort(key=lambda v: v.complexity, reverse=True)

    def generate_report(self) -> str:
        """Generate human-readable report."""
        if not self.violations:
            return "No complexity violations found. All functions meet NASA POT10 Rule 1!"

        report = []
        report.append("=" * 80)
        report.append("PHASE 3.3: COMPLEXITY REDUCTION ANALYSIS")
        report.append("NASA POT10 Rule 1: Cyclomatic Complexity <= 10")
        report.append("=" * 80)
        report.append(f"\nTotal Violations: {len(self.violations)}")
        report.append(f"Complexity Threshold: {self.threshold}")
        report.append("\n" + "-" * 80)

        for i, violation in enumerate(self.violations, 1):
            report.append(f"\nViolation #{i}")
            report.append(f"  File: {violation.file_path}:{violation.line_number}")
            report.append(f"  Function: {violation.function_name}()")
            report.append(f"  Complexity: {violation.complexity} (exceeds {self.threshold} by {violation.complexity - self.threshold})")
            report.append(f"\n  Refactoring Suggestions:")
            for suggestion in violation.suggestions:
                report.append(f"    - {suggestion}")
            report.append("")

        report.append("-" * 80)
        report.append("\nRECOMMENDED REFACTORING PRIORITY:")
        report.append("  1. Functions with complexity > 15 (Strategy Pattern)")
        report.append("  2. Functions with complexity 11-15 (Extract Method)")
        report.append("  3. Functions with deep nesting > 3 (Guard Clauses)")
        report.append("")

        return "\n".join(report)

    def generate_json_report(self) -> Dict[str, Any]:
        """Generate JSON report for programmatic processing."""
        return {
            'threshold': self.threshold,
            'total_violations': len(self.violations),
            'violations': [
                {
                    'file': v.file_path,
                    'function': v.function_name,
                    'line': v.line_number,
                    'complexity': v.complexity,
                    'excess': v.complexity - self.threshold,
                    'suggestions': v.suggestions
                }
                for v in self.violations
            ]
        }


def main():
    """Main entry point."""
    import argparse
    import json

    parser = argparse.ArgumentParser(
        description="Analyze cyclomatic complexity (NASA POT10 Rule 1)"
    )
    parser.add_argument(
        'path',
        type=Path,
        nargs='?',
        default=Path('.'),
        help='Project path to analyze (default: current directory)'
    )
    parser.add_argument(
        '--threshold',
        type=int,
        default=10,
        help='Complexity threshold (default: 10)'
    )
    parser.add_argument(
        '--pattern',
        default='**/*.py',
        help='File pattern to match (default: **/*.py)'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output JSON format'
    )
    parser.add_argument(
        '--output',
        type=Path,
        help='Save report to file'
    )

    args = parser.parse_args()

    # Run analysis
    analyzer = ComplexityAnalyzer(threshold=args.threshold)
    analyzer.analyze_project(args.path, pattern=args.pattern)

    # Generate report
    if args.json:
        report_data = analyzer.generate_json_report()
        report = json.dumps(report_data, indent=2)
    else:
        report = analyzer.generate_report()

    # Output report
    if args.output:
        args.output.write_text(report)
        print(f"Report saved to: {args.output}")
    else:
        print(report)

    # Exit code based on violations
    return 1 if analyzer.violations else 0


if __name__ == "__main__":
    sys.exit(main())