from src.constants.base import DAYS_RETENTION_PERIOD
"""

NASA POT10 Rule 7: The return value of non-void functions must be checked by the calling code.
"""

import ast
import sys
from pathlib import Path
from typing import List, Dict, Tuple, Set
from dataclasses import dataclass
"""

@dataclass
class UncheckedReturn:
    """Represents a function call with unchecked return value."""
    file_path: str
    line_number: int
    function_called: str
    context: str
    is_critical: bool

class ReturnValueChecker:
    """Analyzes return value checking compliance."""

    def __init__(self):
        self.violations: List[UncheckedReturn] = []
        # Functions that are critical to check
        self.critical_functions = {
            # External integrations
            'open', 'subprocess.run', 'subprocess.call', 'subprocess.Popen',
            'requests.get', 'requests.post', 'requests.put', 'requests.delete',
            # File operations
            'read', 'write', 'execute', 'chmod', 'mkdir', 'rmdir',
            # Database/storage
            'query', 'execute_sql', 'fetch', 'commit', 'rollback',
            # API calls
            'api_call', 'send_request', 'fetch_data', 'post_data',
            # GitHub operations
            'gh', 'git', 'create_pr', 'merge_pr', 'create_issue',
        }

    def is_return_checked(self, node: ast.Call, parent: ast.AST) -> bool:
        """
        Determine if return value is checked.

        Checked contexts:
        - Assigned to variable: result = function()
        - Used in if statement: if function(): ...
        - Used in while loop: while function(): ...
        - Part of expression: x = function() + 1
        - Passed as argument: other_func(function())
        """
        # Check if it's in an assignment
        if isinstance(parent, (ast.Assign, ast.AnnAssign, ast.NamedExpr)):
            return True

        # Check if it's used in a conditional
        if isinstance(parent, (ast.If, ast.While, ast.Assert)):
            return True

        # Check if it's part of an expression (not standalone)
        if isinstance(parent, (ast.BinOp, ast.UnaryOp, ast.Compare, ast.BoolOp)):
            return True

        # Check if it's passed as an argument
        if isinstance(parent, ast.Call):
            return True

        # Check if it's part of a return statement
        if isinstance(parent, ast.Return):
            return True

        # Standalone expression statement - NOT checked
        if isinstance(parent, ast.Expr):
            return False

        return True

    def get_function_name(self, node: ast.Call) -> str:
        """Extract function name from call node."""
        if isinstance(node.func, ast.Name):
            return node.func.id
        elif isinstance(node.func, ast.Attribute):
            parts = []
            current = node.func
            while isinstance(current, ast.Attribute):
                parts.append(current.attr)
                current = current.value
            if isinstance(current, ast.Name):
                parts.append(current.id)
            return '.'.join(reversed(parts))
        return '<unknown>'

    def is_critical_function(self, func_name: str) -> bool:
        """Check if function is critical to validate."""
        # Check exact matches
        if func_name in self.critical_functions:
            return True

        # Check partial matches (e.g., "analyze_" functions)
        critical_patterns = [
            'analyze_', 'process_', 'execute_', 'run_',
            'fetch_', 'get_', 'read_', 'write_',
            'create_', 'update_', 'delete_', 'remove_',
            'api_', 'request_', 'query_', 'call_'
        ]

        for pattern in critical_patterns:
            if func_name.startswith(pattern):
                return True

        return False

    def analyze_file(self, file_path: Path) -> List[UncheckedReturn]:
        """Analyze a file for unchecked return values."""
        try:
            code = file_path.read_text(encoding='utf-8')
            tree = ast.parse(code)
            violations = []

            # Walk the AST and find function calls
            for parent in ast.walk(tree):
                for node in ast.iter_child_nodes(parent):
                    if isinstance(node, ast.Call):
                        func_name = self.get_function_name(node)

                        # Skip void functions (print, assert, etc.)
                        void_functions = {'print', 'assert', 'pass', 'raise', 'del'}
                        if func_name in void_functions:
                            continue

                        # Check if return value is used
                        if not self.is_return_checked(node, parent):
                            is_critical = self.is_critical_function(func_name)

                            # Get context (surrounding line)
                            context_line = code.splitlines()[node.lineno - 1] if node.lineno <= len(code.splitlines()) else ""

                            violation = UncheckedReturn(
                                file_path=str(file_path),
                                line_number=node.lineno,
                                function_called=func_name,
                                context=context_line.strip(),
                                is_critical=is_critical
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

        # Sort: critical first, then by file
        self.violations.sort(key=lambda v: (not v.is_critical, v.file_path, v.line_number))

    def generate_report(self) -> str:
        """Generate human-readable report."""
        if not self.violations:
            return "No unchecked return values found. All functions meet NASA POT10 Rule DAYS_RETENTION_PERIOD!"

        critical_count = sum(1 for v in self.violations if v.is_critical)

        report = []
        report.append("=" * 80)
        report.append("PHASE 3.4: RETURN VALUE VALIDATION ANALYSIS")
        report.append("NASA POT10 Rule 7: Non-void function returns must be checked")
        report.append("=" * 80)
        report.append(f"\nTotal Violations: {len(self.violations)}")
        report.append(f"Critical Violations: {critical_count} (external/integration functions)")
        report.append(f"Non-Critical: {len(self.violations) - critical_count}")
        report.append("\n" + "-" * 80)

        # Group by file
        files = {}
        for v in self.violations:
            if v.file_path not in files:
                files[v.file_path] = []
            files[v.file_path].append(v)

        for file_path, file_violations in files.items():
            report.append(f"\n{file_path}: {len(file_violations)} violations")

            # Show critical ones first
            critical_violations = [v for v in file_violations if v.is_critical]
            if critical_violations:
                report.append(f"  CRITICAL ({len(critical_violations)}):")
                for v in critical_violations[:10]:  # Limit to 10
                    report.append(f"    Line {v.line_number}: {v.function_called}()")
                    report.append(f"      Code: {v.context}")
                    report.append(f"      Fix: result = {v.function_called}(...); if result is None: raise ValueError(...)")

        report.append("\n" + "-" * 80)
        report.append("\nRECOMMENDED FIXES:")
        report.append("  1. CRITICAL functions (MCP, GitHub, file ops):")
        report.append("     result = critical_function()")
        report.append("     if result is None:")
        report.append("         raise ValueError('Operation failed')")
        report.append("")
        report.append("  2. NON-CRITICAL functions:")
        report.append("     result = function()  # Store for later use")
        report.append("     # or use _ = function() if intentionally ignoring")
        report.append("")

        return "\n".join(report)

    def generate_fixes(self, file_path: Path) -> List[Tuple[int, str]]:
        """Generate code fixes for a file."""
        fixes = []
        file_violations = [v for v in self.violations if v.file_path == str(file_path)]

        for v in file_violations:
            if v.is_critical:
                # Generate fix code
                fix_code = f"""# NASA Rule 7 check
result = {v.function_called}(...)
if result is None:
    raise ValueError('{v.function_called} failed')"""
                fixes.append((v.line_number, fix_code))

        return fixes

def main():
    """Main entry point."""
    import argparse
    import json

    parser = argparse.ArgumentParser(
        description="Analyze return value checking (NASA POT10 Rule 7)"
    )
    parser.add_argument(
        'path',
        type=Path,
        nargs='?',
        default=Path('.'),
        help='Project path to analyze (default: current directory)'
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
        '--critical-only',
        action='store_true',
        help='Show only critical violations'
    )
    parser.add_argument(
        '--output',
        type=Path,
        help='Save report to file'
    )

    args = parser.parse_args()

    # Run analysis
    checker = ReturnValueChecker()
    checker.analyze_project(args.path, pattern=args.pattern)

    # Filter if needed
    if args.critical_only:
        checker.violations = [v for v in checker.violations if v.is_critical]

    # Generate report
    if args.json:
        report_data = {
            'total_violations': len(checker.violations),
            'critical_violations': sum(1 for v in checker.violations if v.is_critical),
            'violations': [
                {
                    'file': v.file_path,
                    'line': v.line_number,
                    'function': v.function_called,
                    'context': v.context,
                    'critical': v.is_critical
                }
                for v in checker.violations
            ]
        }
        report = json.dumps(report_data, indent=2)
    else:
        report = checker.generate_report()

    # Output report
    if args.output:
        args.output.write_text(report)
        print(f"Report saved to: {args.output}")
    else:
        print(report)

    # Exit code based on critical violations
    critical_count = sum(1 for v in checker.violations if v.is_critical)
    return 1 if critical_count > 0 else 0

if __name__ == "__main__":
    sys.exit(main())