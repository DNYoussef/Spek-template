#!/usr/bin/env python3
"""
NASA Rule 2 (Dynamic Memory Allocation) Violation Pattern Detector
===================================================================

Detects and reports dynamic memory allocation violations in Python code:
- list.append() operations (should use pre-allocation)
- dict updates with dynamic keys (should use dataclasses/NamedTuple)
- String concatenation with += (should use f-strings/format)

Usage:
    python scripts/fix_dynamic_memory.py <file_path>
    python scripts/fix_dynamic_memory.py --scan-all
"""

from collections import defaultdict
from pathlib import Path
from typing import List, Dict, Tuple
import ast
import sys

from dataclasses import dataclass

@dataclass
class Violation:
    """NASA Rule 2 violation record."""
    file_path: str
    line_number: int
    pattern_type: str
    code_snippet: str
    suggestion: str

class DynamicMemoryDetector(ast.NodeVisitor):
    """Detects NASA Rule 2 violations in Python AST."""

def __init__(self, file_path: str, source_lines: List[str]):
        self.file_path = file_path
        self.source_lines = source_lines
        self.violations: List[Violation] = []
        self.append_count = 0
        self.dict_update_count = 0
        self.string_concat_count = 0

def visit_Call(self, node: ast.Call) -> None:
        """Detect list.append() and dict.update() calls."""
        if isinstance(node.func, ast.Attribute):
            if node.func.attr == 'append':
                self.append_count += 1
                line_no = node.lineno
                code = self.source_lines[line_no - 1].strip() if line_no <= len(self.source_lines) else ""

                self.violations.append(Violation(
                    file_path=self.file_path,
                    line_number=line_no,
                    pattern_type="list.append()",
                    code_snippet=code,
                    suggestion="Pre-allocate list with known size: arr = [None] * size"
                ))

            elif node.func.attr == 'update' and self._is_dict_call(node):
                self.dict_update_count += 1
                line_no = node.lineno
                code = self.source_lines[line_no - 1].strip() if line_no <= len(self.source_lines) else ""

                self.violations.append(Violation(
                    file_path=self.file_path,
                    line_number=line_no,
                    pattern_type="dict.update()",
                    code_snippet=code,
                    suggestion="Use dataclass or NamedTuple for fixed structure"
                ))

        self.generic_visit(node)

def visit_AugAssign(self, node: ast.AugAssign) -> None:
        """Detect string concatenation with +=."""
        if isinstance(node.op, ast.Add):
            # Check if target is likely a string
            if isinstance(node.target, ast.Name):
                # String concat pattern
                self.string_concat_count += 1
                line_no = node.lineno
                code = self.source_lines[line_no - 1].strip() if line_no <= len(self.source_lines) else ""

                self.violations.append(Violation(
                    file_path=self.file_path,
                    line_number=line_no,
                    pattern_type="string +=",
                    code_snippet=code,
                    suggestion="Use f-strings, .format(), or StringIO for concatenation"
                ))

        self.generic_visit(node)

def _is_dict_call(self, node: ast.Call) -> bool:
        """Check if call is on a dict object."""
        # Simple heuristic: check variable names and common patterns
        if isinstance(node.func, ast.Attribute):
            if isinstance(node.func.value, ast.Name):
                var_name = node.func.value.id
                # Common dict variable name patterns
                dict_patterns = ['dict', 'map', 'cache', 'stats', 'metrics', 'config']
                return any(pattern in var_name.lower() for pattern in dict_patterns)
        return False

def analyze_file(file_path: Path) -> Tuple[List[Violation], Dict[str, int]]:
    """Analyze a single file for NASA Rule 2 violations."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            source = f.read()
            source_lines = source.splitlines()

        tree = ast.parse(source)
        detector = DynamicMemoryDetector(str(file_path), source_lines)
        detector.visit(tree)

        stats = {
            'append': detector.append_count,
            'dict_update': detector.dict_update_count,
            'string_concat': detector.string_concat_count,
            'total': len(detector.violations)
        }

        return detector.violations, stats

    except Exception as e:
        print(f"Error analyzing {file_path}: {e}")
        return [], {'append': 0, 'dict_update': 0, 'string_concat': 0, 'total': 0}

def scan_directory(root_path: Path, pattern: str = "*.py") -> Dict[str, Tuple[List[Violation], Dict[str, int]]]:
    """Scan directory for NASA Rule 2 violations."""
    results = {}

    for file_path in root_path.rglob(pattern):
        # Skip test files and virtual environments
        if any(skip in str(file_path) for skip in ['.venv', 'venv', '__pycache__', '.git', 'node_modules']):
            continue

        violations, stats = analyze_file(file_path)
        if violations:
            results[str(file_path)] = (violations, stats)

    return results

def generate_report(results: Dict[str, Tuple[List[Violation], Dict[str, int]]]) -> str:
    """Generate comprehensive violation report."""
    total_files = len(results)
    total_violations = sum(stats['total'] for _, stats in results.values())
    total_append = sum(stats['append'] for _, stats in results.values())
    total_dict = sum(stats['dict_update'] for _, stats in results.values())
    total_string = sum(stats['string_concat'] for _, stats in results.values())

    report = []
    report.append("=" * 80)
    report.append("NASA Rule 2 (Dynamic Memory Allocation) Violation Report")
    report.append("=" * 80)
    report.append(f"\nTotal Files Analyzed: {total_files}")
    report.append(f"Total Violations: {total_violations}")
    report.append(f"  - list.append(): {total_append}")
    report.append(f"  - dict.update(): {total_dict}")
    report.append(f"  - string +=: {total_string}")
    report.append("\n" + "=" * 80)

    # Sort files by violation count
    sorted_files = sorted(results.items(), key=lambda x: x[1][1]['total'], reverse=True)

    report.append("\nTop Violating Files:")
    report.append("-" * 80)

    for file_path, (violations, stats) in sorted_files[:10]:
        report.append(f"\n{file_path}")
        report.append(f"  Total: {stats['total']} | append: {stats['append']} | dict: {stats['dict_update']} | string: {stats['string_concat']}")

        # Show sample violations
        for violation in violations[:3]:
            report.append(f"    Line {violation.line_number}: {violation.pattern_type}")
            report.append(f"      Code: {violation.code_snippet}")
            report.append(f"      Fix: {violation.suggestion}")

    report.append("\n" + "=" * 80)
    report.append("\nRemediation Priorities:")
    report.append("-" * 80)
    report.append("1. Replace list.append() with pre-allocated arrays where size is known")
    report.append("2. Use dataclasses/NamedTuple instead of dynamic dict updates")
    report.append("3. Replace string += with f-strings or .format()")
    report.append("4. Document unavoidable dynamic allocations with NASA Rule 2 justification")

    return "\n".join(report)

def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python scripts/fix_dynamic_memory.py <file_or_directory>")
        print("       python scripts/fix_dynamic_memory.py --scan-all")
        sys.exit(1)

    target = sys.argv[1]

    if target == "--scan-all":
        # Scan specific target directories
        target_dirs = [
            Path("analyzer/enterprise/validation"),
            Path("analyzer/enterprise/core"),
            Path("analyzer/enterprise/integration")
        ]

        all_results = {}
        for target_dir in target_dirs:
            if target_dir.exists():
                results = scan_directory(target_dir)
                all_results.update(results)

        if all_results:
            report = generate_report(all_results)
            print(report)

            # Save report
            report_path = Path(".claude/.artifacts/nasa_rule2_violations_report.txt")
            report_path.parent.mkdir(parents=True, exist_ok=True)
            report_path.write_text(report)
            print(f"\nReport saved to: {report_path}")
        else:
            print("No violations found!")
    else:
        target_path = Path(target)

        if target_path.is_file():
            violations, stats = analyze_file(target_path)
            print(f"\nFile: {target_path}")
            print(f"Violations: {stats['total']}")

            for violation in violations:
                print(f"  Line {violation.line_number}: {violation.pattern_type}")
                print(f"    {violation.code_snippet}")
                print(f"    Fix: {violation.suggestion}")

        elif target_path.is_dir():
            results = scan_directory(target_path)
            report = generate_report(results)
            print(report)

        else:
            print(f"Error: {target} is not a valid file or directory")
            sys.exit(1)

if __name__ == "__main__":
    main()