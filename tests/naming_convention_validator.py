#!/usr/bin/env python3
"""
Naming Convention Validation Suite
==================================

Comprehensive test suite for validating Python PEP 8 and JavaScript naming conventions
across the entire codebase. Tests for compliance, consistency, and preservation of semantics.
"""

from pathlib import Path
from typing import List, Dict, Set, Tuple, Any
import ast
import json
import os
import re
import sys

from dataclasses import dataclass
from enum import Enum

class ConventionViolationType(Enum):
    CLASS_NOT_PASCAL_CASE = "class_not_pascal_case"
    FUNCTION_NOT_SNAKE_CASE = "function_not_snake_case"
    CONSTANT_NOT_UPPER_SNAKE = "constant_not_upper_snake"
    PRIVATE_NO_UNDERSCORE = "private_no_underscore"
    MODULE_NOT_LOWERCASE = "module_not_lowercase"
    JS_CLASS_NOT_PASCAL = "js_class_not_pascal"
    JS_FUNCTION_NOT_CAMEL = "js_function_not_camel"
    JS_CONST_NOT_UPPER = "js_const_not_upper"
    INCONSISTENT_ABBREVIATION = "inconsistent_abbreviation"
    SEMANTIC_LOSS = "semantic_loss"

@dataclass
class ConventionViolation:
    file_path: str
    line_number: int
    violation_type: ConventionViolationType
    identifier: str
    suggested_fix: str
    context: str
    severity: str  # HIGH, MEDIUM, LOW

class PythonConventionValidator:
    """Validates Python PEP 8 naming conventions."""

    def __init__(self):
        self.violations = []
        self.class_pattern = re.compile(r'^[A-Z][a-zA-Z0-9]*$')
        self.function_pattern = re.compile(r'^[a-z_][a-z0-9_]*$')
        self.constant_pattern = re.compile(r'^[A-Z_][A-Z0-9_]*$')
        self.private_pattern = re.compile(r'^_[a-zA-Z0-9_]*$')

    def validate_file(self, file_path: str) -> List[ConventionViolation]:
        """Validate a single Python file for naming conventions."""
        violations = []

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Parse AST
            tree = ast.parse(content, filename=file_path)

            # Validate module name
            module_name = Path(file_path).stem
            if not self._is_valid_module_name(module_name):
                violations.append(ConventionViolation(
                    file_path=file_path,
                    line_number=1,
                    violation_type=ConventionViolationType.MODULE_NOT_LOWERCASE,
                    identifier=module_name,
                    suggested_fix=self._to_snake_case(module_name),
                    context=f"Module: {module_name}",
                    severity="HIGH"
                ))

            # Walk AST for naming violations
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    if not self.class_pattern.match(node.name):
                        violations.append(ConventionViolation(
                            file_path=file_path,
                            line_number=node.lineno,
                            violation_type=ConventionViolationType.CLASS_NOT_PASCAL_CASE,
                            identifier=node.name,
                            suggested_fix=self._to_pascal_case(node.name),
                            context=f"class {node.name}",
                            severity="HIGH"
                        ))

                elif isinstance(node, ast.FunctionDef):
                    if not self.function_pattern.match(node.name) and not node.name.startswith('_'):
                        violations.append(ConventionViolation(
                            file_path=file_path,
                            line_number=node.lineno,
                            violation_type=ConventionViolationType.FUNCTION_NOT_SNAKE_CASE,
                            identifier=node.name,
                            suggested_fix=self._to_snake_case(node.name),
                            context=f"def {node.name}",
                            severity="MEDIUM"
                        ))

                elif isinstance(node, ast.Assign):
                    # Check for constants (uppercase assignments at module level)
                    for target in node.targets:
                        if isinstance(target, ast.Name) and self._is_constant_context(tree, node):
                            if not self.constant_pattern.match(target.id):
                                violations.append(ConventionViolation(
                                    file_path=file_path,
                                    line_number=node.lineno,
                                    violation_type=ConventionViolationType.CONSTANT_NOT_UPPER_SNAKE,
                                    identifier=target.id,
                                    suggested_fix=self._to_upper_snake_case(target.id),
                                    context=f"{target.id} = ...",
                                    severity="MEDIUM"
                                ))

        except Exception as e:
            print(f"Error parsing {file_path}: {e}")

        return violations

    def _is_valid_module_name(self, name: str) -> bool:
        """Check if module name follows lowercase_with_underscores."""
        return re.match(r'^[a-z_][a-z0-9_]*$', name) is not None

    def _is_constant_context(self, tree: ast.AST, node: ast.Assign) -> bool:
        """Determine if assignment is at module level (likely constant)."""
        # Simplified check - real implementation would be more sophisticated
        return any(isinstance(parent, ast.Module) for parent in ast.walk(tree)
                    if hasattr(parent, 'body') and node in getattr(parent, 'body', []))

    def _to_pascal_case(self, name: str) -> str:
        """Convert to PascalCase."""
        return ''.join(word.capitalize() for word in re.split(r'[_\s-]+', name))

    def _to_snake_case(self, name: str) -> str:
        """Convert to snake_case."""
        # Insert underscore before capitals, then lowercase
        s1 = re.sub('([a-z0-9])([A-Z])', r'\1_\2', name)
        return s1.lower()

    def _to_upper_snake_case(self, name: str) -> str:
        """Convert to UPPER_SNAKE_CASE."""
        return self._to_snake_case(name).upper()

class JavaScriptConventionValidator:
    """Validates JavaScript/TypeScript naming conventions."""

    def __init__(self):
        self.violations = []
        self.class_pattern = re.compile(r'^[A-Z][a-zA-Z0-9]*$')
        self.function_pattern = re.compile(r'^[a-z][a-zA-Z0-9]*$')
        self.const_pattern = re.compile(r'^[A-Z_][A-Z0-9_]*$')

    def validate_file(self, file_path: str) -> List[ConventionViolation]:
        """Validate JavaScript/TypeScript file for naming conventions."""
        violations = []

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            lines = content.split('\n')

            # Simple regex-based parsing for JavaScript constructs
            for i, line in enumerate(lines, 1):
                line = line.strip()

                # Class declarations
                class_match = re.search(r'class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)', line)
                if class_match:
                    class_name = class_match.group(1)
                    if not self.class_pattern.match(class_name):
                        violations.append(ConventionViolation(
                            file_path=file_path,
                            line_number=i,
                            violation_type=ConventionViolationType.JS_CLASS_NOT_PASCAL,
                            identifier=class_name,
                            suggested_fix=self._to_pascal_case(class_name),
                            context=line[:60],
                            severity="HIGH"
                        ))

                # Function declarations
                func_match = re.search(r'function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)', line)
                if func_match:
                    func_name = func_match.group(1)
                    if not self.function_pattern.match(func_name):
                        violations.append(ConventionViolation(
                            file_path=file_path,
                            line_number=i,
                            violation_type=ConventionViolationType.JS_FUNCTION_NOT_CAMEL,
                            identifier=func_name,
                            suggested_fix=self._to_camel_case(func_name),
                            context=line[:60],
                            severity="MEDIUM"
                        ))

                # Const declarations
                const_match = re.search(r'const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)', line)
                if const_match and self._looks_like_constant(line):
                    const_name = const_match.group(1)
                    if not self.const_pattern.match(const_name):
                        violations.append(ConventionViolation(
                            file_path=file_path,
                            line_number=i,
                            violation_type=ConventionViolationType.JS_CONST_NOT_UPPER,
                            identifier=const_name,
                            suggested_fix=self._to_upper_snake_case(const_name),
                            context=line[:60],
                            severity="MEDIUM"
                        ))

        except Exception as e:
            print(f"Error parsing {file_path}: {e}")

        return violations

    def _looks_like_constant(self, line: str) -> bool:
        """Heuristic to determine if const declaration is a true constant."""
        # Look for patterns that suggest constants vs regular variables
        const_indicators = [
            r'=\s*["\']',  # String literals
            r'=\s*\d+',    # Numeric literals
            r'=\s*\{',     # Object literals (config)
            r'=\s*\[',     # Array literals
        ]
        return any(re.search(pattern, line) for pattern in const_indicators)

    def _to_pascal_case(self, name: str) -> str:
        """Convert to PascalCase."""
        return ''.join(word.capitalize() for word in re.split(r'[_\s-]+', name))

    def _to_camel_case(self, name: str) -> str:
        """Convert to camelCase."""
        words = re.split(r'[_\s-]+', name)
        return words[0].lower() + ''.join(word.capitalize() for word in words[1:])

    def _to_upper_snake_case(self, name: str) -> str:
        """Convert to UPPER_SNAKE_CASE."""
        s1 = re.sub('([a-z0-9])([A-Z])', r'\1_\2', name)
        return s1.upper()

class ConsistencyValidator:
    """Validates naming consistency across the codebase."""

    def __init__(self):
        self.abbreviation_usages = {}
        self.semantic_changes = []

    def validate_consistency(self, all_violations: List[ConventionViolation]) -> List[ConventionViolation]:
        """Check for consistency violations across all files."""
        consistency_violations = []

        # Track abbreviation usage patterns
        abbreviations = {}
        for violation in all_violations:
            words = re.findall(r'\b\w+\b', violation.identifier.lower())
            for word in words:
                if self._is_abbreviation(word):
                    if word not in abbreviations:
                        abbreviations[word] = []
                    abbreviations[word].append((violation.file_path, violation.identifier))

        # Check for inconsistent abbreviation usage
        for abbrev, usages in abbreviations.items():
            if len(set(usage[1] for usage in usages)) > 1:
                # Multiple forms of same abbreviation found
                consistency_violations.append(ConventionViolation(
                    file_path="MULTIPLE_FILES",
                    line_number=0,
                    violation_type=ConventionViolationType.INCONSISTENT_ABBREVIATION,
                    identifier=abbrev,
                    suggested_fix=f"Standardize to single form",
                    context=f"Found in: {', '.join(set(usage[0] for usage in usages[:3]))}",
                    severity="LOW"
                ))

        return consistency_violations

    def _is_abbreviation(self, word: str) -> bool:
        """Check if word is likely an abbreviation."""
        common_abbreviations = {
            'cfg', 'config', 'mgr', 'manager', 'impl', 'implementation',
            'util', 'utils', 'lib', 'library', 'auth', 'authentication'
        }
        return word in common_abbreviations or (len(word) <= 4 and word.isalpha())

class BackwardCompatibilityValidator:
    """Validates that naming changes don't break backward compatibility."""

    def __init__(self):
        self.public_api_changes = []

    def validate_compatibility(self, violations: List[ConventionViolation]) -> List[ConventionViolation]:
        """Check for potential backward compatibility issues."""
        compatibility_violations = []

        for violation in violations:
            # Check if this is likely a public API
            if self._is_likely_public_api(violation):
                compatibility_violations.append(ConventionViolation(
                    file_path=violation.file_path,
                    line_number=violation.line_number,
                    violation_type=ConventionViolationType.SEMANTIC_LOSS,
                    identifier=violation.identifier,
                    suggested_fix=f"Add deprecation warning for {violation.identifier}",
                    context=violation.context,
                    severity="HIGH"
                ))

        return compatibility_violations

    def _is_likely_public_api(self, violation: ConventionViolation) -> bool:
        """Heuristic to determine if identifier is part of public API."""
        # Check if in main modules or exposed classes
        public_indicators = [
            '__init__.py' in violation.file_path,
            'main.py' in violation.file_path,
            violation.violation_type == ConventionViolationType.CLASS_NOT_PASCAL_CASE,
            not violation.identifier.startswith('_')
        ]
        return any(public_indicators)

class NamingConventionTestSuite:
    """Main test suite for naming convention validation."""

    def __init__(self, root_dir: str = "."):
        self.root_dir = Path(root_dir)
        self.python_validator = PythonConventionValidator()
        self.js_validator = JavaScriptConventionValidator()
        self.consistency_validator = ConsistencyValidator()
        self.compatibility_validator = BackwardCompatibilityValidator()

        self.all_violations = []
        self.test_results = {}

    def run_all_tests(self) -> Dict[str, Any]:
        """Run comprehensive naming convention tests."""
        print("Running Naming Convention Validation Suite...")

        # Collect all relevant files
        python_files = list(self.root_dir.rglob("*.py"))
        js_files = list(self.root_dir.rglob("*.js")) + list(self.root_dir.rglob("*.ts"))

        # Filter out generated/cache files
        python_files = self._filter_files(python_files)
        js_files = self._filter_files(js_files)

        print(f"Analyzing {len(python_files)} Python files and {len(js_files)} JS/TS files...")

        # Test Python conventions
        python_violations = self._test_python_conventions(python_files)

        # Test JavaScript conventions
        js_violations = self._test_javascript_conventions(js_files)

        # Test consistency
        all_violations = python_violations + js_violations
        consistency_violations = self.consistency_validator.validate_consistency(all_violations)

        # Test backward compatibility
        compatibility_violations = self.compatibility_validator.validate_compatibility(all_violations)

        # Compile results
        self.all_violations = all_violations + consistency_violations + compatibility_violations

        return self._compile_test_results()

    def _test_python_conventions(self, files: List[Path]) -> List[ConventionViolation]:
        """Test Python PEP 8 conventions."""
        violations = []

        for file_path in files:
            file_violations = self.python_validator.validate_file(str(file_path))
            violations.extend(file_violations)

        print(f"Python violations found: {len(violations)}")
        return violations

    def _test_javascript_conventions(self, files: List[Path]) -> List[ConventionViolation]:
        """Test JavaScript/TypeScript conventions."""
        violations = []

        for file_path in files:
            file_violations = self.js_validator.validate_file(str(file_path))
            violations.extend(file_violations)

        print(f"JavaScript violations found: {len(violations)}")
        return violations

    def _filter_files(self, files: List[Path]) -> List[Path]:
        """Filter out generated, cache, and test files for convention testing."""
        exclude_patterns = [
            '__pycache__', '.git', 'node_modules', '.claude',
            'dist', 'build', '.artifacts', '--output-dir'
        ]

        return [f for f in files if not any(pattern in str(f) for pattern in exclude_patterns)]

    def _compile_test_results(self) -> Dict[str, Any]:
        """Compile comprehensive test results."""
        violation_counts = {}
        for violation_type in ConventionViolationType:
            violation_counts[violation_type.value] = len([
                v for v in self.all_violations if v.violation_type == violation_type
            ])

        severity_counts = {
            "HIGH": len([v for v in self.all_violations if v.severity == "HIGH"]),
            "MEDIUM": len([v for v in self.all_violations if v.severity == "MEDIUM"]),
            "LOW": len([v for v in self.all_violations if v.severity == "LOW"])
        }

        results = {
            "test_summary": {
                "total_violations": len(self.all_violations),
                "python_violations": len([v for v in self.all_violations if 'js_' not in v.violation_type.value]),
                "javascript_violations": len([v for v in self.all_violations if 'js_' in v.violation_type.value]),
                "consistency_violations": len([v for v in self.all_violations if v.violation_type == ConventionViolationType.INCONSISTENT_ABBREVIATION]),
                "compatibility_violations": len([v for v in self.all_violations if v.violation_type == ConventionViolationType.SEMANTIC_LOSS])
            },
            "by_violation_type": violation_counts,
            "by_severity": severity_counts,
            "critical_violations": [
                {
                    "file": v.file_path,
                    "line": v.line_number,
                    "type": v.violation_type.value,
                    "identifier": v.identifier,
                    "suggested_fix": v.suggested_fix,
                    "severity": v.severity
                }
                for v in self.all_violations if v.severity == "HIGH"
            ],
            "pass_fail_status": {
                "python_pep8_compliance": severity_counts["HIGH"] == 0,
                "javascript_compliance": len([v for v in self.all_violations if 'js_' in v.violation_type.value and v.severity == "HIGH"]) == 0,
                "consistency_check": len([v for v in self.all_violations if v.violation_type == ConventionViolationType.INCONSISTENT_ABBREVIATION]) == 0,
                "backward_compatibility": len([v for v in self.all_violations if v.violation_type == ConventionViolationType.SEMANTIC_LOSS]) == 0,
                "overall_pass": severity_counts["HIGH"] == 0
            }
        }

        return results

    def generate_report(self) -> str:
        """Generate human-readable test report."""
        results = self.test_results or self.run_all_tests()

        report = []
        report.append("=" * 60)
        report.append("NAMING CONVENTION VALIDATION REPORT")
        report.append("=" * 60)

        # Summary
        summary = results["test_summary"]
        report.append(f"SUMMARY:")
        report.append(f"  Total violations: {summary['total_violations']}")
        report.append(f"  Python violations: {summary['python_violations']}")
        report.append(f"  JavaScript violations: {summary['javascript_violations']}")
        report.append(f"  Consistency issues: {summary['consistency_violations']}")
        report.append(f"  Compatibility risks: {summary['compatibility_violations']}")

        # Pass/Fail Status
        report.append(f"\nQUALITY GATES:")
        status = results["pass_fail_status"]
        for gate, passed in status.items():
            status_icon = "[PASS]" if passed else "[FAIL]"
            report.append(f"  {gate.replace('_', ' ').title()}: {status_icon}")

        # Severity breakdown
        report.append(f"\nBY SEVERITY:")
        severity = results["by_severity"]
        report.append(f"  HIGH:   {severity['HIGH']:3d}")
        report.append(f"  MEDIUM: {severity['MEDIUM']:3d}")
        report.append(f"  LOW:    {severity['LOW']:3d}")

        # Critical violations
        if results["critical_violations"]:
            report.append(f"\nCRITICAL VIOLATIONS (TOP 10):")
            for i, violation in enumerate(results["critical_violations"][:10], 1):
                report.append(f"  {i:2d}. {violation['identifier']} -> {violation['suggested_fix']}")
                report.append(f"      File: {violation['file']}:{violation['line']}")
                report.append(f"      Type: {violation['type']}")

        return "\n".join(report)

def main():
    """Run the naming convention test suite."""
    root_dir = sys.argv[1] if len(sys.argv) > 1 else "."

    # Run test suite
    test_suite = NamingConventionTestSuite(root_dir)
    test_suite.test_results = test_suite.run_all_tests()

    # Generate and display report

    # Save detailed results
    output_dir = Path("tests") / "naming_validation"
    output_dir.mkdir(parents=True, exist_ok=True)

    results_file = output_dir / "naming_convention_validation_report.json"
    with open(results_file, 'w') as f:
        json.dump(test_suite.test_results, f, indent=2)

    print(f"\nDetailed results saved to: {results_file}")

    # Return appropriate exit code
    overall_pass = test_suite.test_results["pass_fail_status"]["overall_pass"]
    return 0 if overall_pass else 1

if __name__ == "__main__":
    sys.exit(main())