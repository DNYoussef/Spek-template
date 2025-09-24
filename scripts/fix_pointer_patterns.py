#!/usr/bin/env python3
"""
NASA Rule 1 (Pointer Restrictions) Violation Detection Script
=============================================================

Detects pointer-like patterns in Python that violate NASA POT10 Rule 1:
- Direct object references passed around
- Nested attribute access (Law of Demeter violations)
- Global state mutations
- Mutable object passing

NASA POT10 Rule 1: Restrict pointer use to a single dereference level
In Python context: Avoid chained attribute access and mutable object passing
"""

import ast
import sys
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict


class PointerPatternDetector(ast.NodeVisitor):
    """Detects pointer-like violation patterns in Python AST."""

    def __init__(self, file_path: str):
        self.file_path = file_path
        self.violations: Dict[str, List[Tuple[int, str]]] = defaultdict(list)
        self.current_function = None

    def visit_FunctionDef(self, node):
        """Track current function context."""
        old_function = self.current_function
        self.current_function = node.name
        self.generic_visit(node)
        self.current_function = old_function

    def visit_Attribute(self, node):
        """Detect nested attribute access (obj.attr1.attr2.method())."""
        # Count the depth of attribute access
        depth = 0
        current = node
        chain = []

        while isinstance(current, ast.Attribute):
            chain.append(current.attr)
            depth += 1
            if hasattr(current, 'value'):
                current = current.value
            else:
                break

        # Violation if depth > 1 (more than one dot)
        if depth > 1:
            chain_str = '.'.join(reversed(chain))
            context = f"in {self.current_function}()" if self.current_function else ""
            self.violations["nested_attribute_access"].append(
                (node.lineno, f"Chain: {chain_str} (depth {depth}) {context}")
            )

        self.generic_visit(node)

    def visit_Assign(self, node):
        """Detect mutable object assignments and global mutations."""
        # Check for global keyword usage
        if isinstance(node, ast.Global):
            for name in node.names:
                self.violations["global_mutation"].append(
                    (node.lineno, f"Global variable '{name}' usage")
                )

        # Check for self.attribute = mutable_object patterns
        for target in node.targets:
            if isinstance(target, ast.Attribute):
                if isinstance(target.value, ast.Name) and target.value.id == 'self':
                    # Check if assigned value is a mutable object
                    if isinstance(node.value, (ast.List, ast.Dict, ast.Set)):
                        self.violations["mutable_attribute_storage"].append(
                            (node.lineno, f"Storing mutable object in self.{target.attr}")
                        )
                    # Check if passing object reference
                    elif isinstance(node.value, ast.Attribute):
                        chain = self._get_attribute_chain(node.value)
                        if len(chain) > 1:
                            self.violations["object_reference_passing"].append(
                                (node.lineno, f"Storing object reference: self.{target.attr} = {'.'.join(chain)}")
                            )

        self.generic_visit(node)

    def visit_Call(self, node):
        """Detect method calls with object references as arguments."""
        # Check for passing object attributes as arguments
        for arg in node.args:
            if isinstance(arg, ast.Attribute):
                chain = self._get_attribute_chain(arg)
                if len(chain) > 1:
                    self.violations["object_reference_argument"].append(
                        (node.lineno, f"Passing object reference as argument: {'.'.join(chain)}")
                    )

        self.generic_visit(node)

    def visit_Return(self, node):
        """Detect returning mutable objects or deep references."""
        if node.value:
            if isinstance(node.value, ast.Attribute):
                chain = self._get_attribute_chain(node.value)
                if len(chain) > 1:
                    self.violations["return_object_reference"].append(
                        (node.lineno, f"Returning object reference: {'.'.join(chain)}")
                    )

        self.generic_visit(node)

    def _get_attribute_chain(self, node) -> List[str]:
        """Extract attribute access chain from AST node."""
        chain = []
        current = node
        while isinstance(current, ast.Attribute):
            chain.append(current.attr)
            if hasattr(current, 'value'):
                current = current.value
            else:
                break
        if isinstance(current, ast.Name):
            chain.append(current.id)
        return list(reversed(chain))


def analyze_file(file_path: Path) -> Dict[str, List[Tuple[int, str]]]:
    """Analyze a Python file for pointer-like patterns."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            source = f.read()

        tree = ast.parse(source, filename=str(file_path))
        detector = PointerPatternDetector(str(file_path))
        detector.visit(tree)

        return detector.violations
    except SyntaxError as e:
        print(f"Syntax error in {file_path}: {e}")
        return {}
    except Exception as e:
        print(f"Error analyzing {file_path}: {e}")
        return {}


def generate_report(results: Dict[Path, Dict[str, List[Tuple[int, str]]]]) -> str:
    """Generate a comprehensive report of pointer pattern violations."""
    report_lines = [
        "=" * 80,
        "NASA POT10 Rule 1 (Pointer Restrictions) Violation Report",
        "=" * 80,
        "",
        "PATTERNS DETECTED:",
        "1. Nested attribute access (obj.attr1.attr2) - Law of Demeter violations",
        "2. Object reference passing - mutable objects passed between functions",
        "3. Global state mutations - global variable modifications",
        "4. Mutable attribute storage - storing references to mutable objects",
        "",
        "=" * 80,
        ""
    ]

    total_violations = 0
    violation_summary = defaultdict(int)

    # Summarize violations by type
    for file_path, violations in sorted(results.items()):
        file_total = sum(len(v) for v in violations.values())
        if file_total > 0:
            total_violations += file_total
            report_lines.append(f"\nFile: {file_path}")
            report_lines.append(f"Total violations: {file_total}")
            report_lines.append("-" * 80)

            for pattern_type, instances in sorted(violations.items()):
                if instances:
                    violation_summary[pattern_type] += len(instances)
                    report_lines.append(f"\n  {pattern_type.replace('_', ' ').title()}: {len(instances)} violations")
                    for line_no, message in sorted(instances)[:10]:  # Show first 10
                        report_lines.append(f"    Line {line_no}: {message}")
                    if len(instances) > 10:
                        report_lines.append(f"    ... and {len(instances) - 10} more")

    # Summary
    report_lines.extend([
        "",
        "=" * 80,
        "SUMMARY",
        "=" * 80,
        f"Total files analyzed: {len(results)}",
        f"Total violations found: {total_violations}",
        "",
        "Violations by type:"
    ])

    for pattern_type, count in sorted(violation_summary.items(), key=lambda x: x[1], reverse=True):
        report_lines.append(f"  - {pattern_type.replace('_', ' ').title()}: {count}")

    report_lines.extend([
        "",
        "=" * 80,
        "RECOMMENDATIONS",
        "=" * 80,
        "1. Replace nested attribute access with facade methods",
        "2. Use value returns instead of mutable reference passing",
        "3. Apply copy.deepcopy() for necessary object passing",
        "4. Convert global variables to class-based configuration",
        "5. Use immutable data structures (dataclasses with frozen=True)",
        "6. Add NASA Rule 1 compliance comments to justify essential patterns",
        ""
    ])

    return "\n".join(report_lines)


def main():
    """Main entry point for pointer pattern detection."""
    # Target files from the task
    target_files = [
        "analyzer/enterprise/validation/EnterprisePerformanceValidator.py",
        "analyzer/enterprise/core/performance_monitor.py",
        "analyzer/enterprise/integration/EnterpriseIntegrationFramework.py"
    ]

    project_root = Path(__file__).parent.parent
    results = {}

    print("Analyzing files for NASA Rule 1 (Pointer Restrictions) violations...")
    print("=" * 80)

    for file_path_str in target_files:
        file_path = project_root / file_path_str
        if file_path.exists():
            print(f"Analyzing: {file_path_str}")
            violations = analyze_file(file_path)
            if violations:
                results[file_path] = violations
        else:
            print(f"Warning: File not found: {file_path}")

    # Generate and save report
    report = generate_report(results)
    print("\n" + report)

    # Save report to file
    report_path = project_root / ".claude" / ".artifacts" / "nasa_rule1_pointer_violations_report.txt"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f"\nReport saved to: {report_path}")

    # Return exit code based on violations found
    total_violations = sum(sum(len(v) for v in violations.values()) for violations in results.values())
    return 0 if total_violations == 0 else 1


if __name__ == "__main__":
    sys.exit(main())