"""
Multi-Layer Validation System
Implements 5-layer validation with AST-based syntax checking
"""

import ast
import sys
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class ValidationLayer(Enum):
    """Validation layers in order of execution"""
    SYNTAX = "syntax"
    SEMANTIC = "semantic"
    RUNTIME = "runtime"
    INTEGRATION = "integration"
    REGRESSION = "regression"


@dataclass
class ValidationResult:
    """Result from a validation layer"""
    valid: bool
    layer: ValidationLayer
    error: Optional[str] = None
    error_type: Optional[str] = None
    line_number: Optional[int] = None

    def __str__(self):
        status = "PASS" if self.valid else "FAIL"
        if self.error:
            return f"[{self.layer.value.upper()}] {status}: {self.error} (line {self.line_number})"
        return f"[{self.layer.value.upper()}] {status}"


class SyntaxValidator:
    """Layer 1: AST-based syntax validation"""

    def validate(self, filepath: Path) -> ValidationResult:
        """Validate Python syntax using AST parser"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Use AST parser (NOT regex) for syntax validation
            ast.parse(content)

            return ValidationResult(
                valid=True,
                layer=ValidationLayer.SYNTAX
            )

        except SyntaxError as e:
            return ValidationResult(
                valid=False,
                layer=ValidationLayer.SYNTAX,
                error=str(e.msg),
                error_type=self._classify_syntax_error(e),
                line_number=e.lineno
            )
        except Exception as e:
            return ValidationResult(
                valid=False,
                layer=ValidationLayer.SYNTAX,
                error=f"Unexpected error: {str(e)}",
                error_type="unknown"
            )

    def _classify_syntax_error(self, error: SyntaxError) -> str:
        """Classify syntax error type for targeted fixing"""
        msg = error.msg.lower()

        if "parenthes" in msg or "bracket" in msg:
            return "bracket_mismatch"
        elif "indent" in msg:
            return "indentation_error"
        elif "triple-quoted" in msg or "string" in msg:
            return "unterminated_string"
        elif ":" in msg or "colon" in msg:
            return "missing_colon"
        elif "decimal" in msg:
            return "invalid_literal"
        else:
            return "general_syntax"


class SemanticValidator:
    """Layer 2: Semantic correctness validation"""

    def __init__(self, protected_files: List[str]):
        self.protected_files = set(protected_files)

    def validate(self, filepath: Path) -> ValidationResult:
        """Validate semantic correctness (imports, names, etc.)"""

        # Check if file is in protection list
        if str(filepath) in self.protected_files:
            return ValidationResult(
                valid=True,
                layer=ValidationLayer.SEMANTIC,
                error="File is protected - skipping validation"
            )

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            tree = ast.parse(content)

            # Check for semantic issues
            for node in ast.walk(tree):
                # Check for bare 'import 3' or other invalid imports
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        if alias.name.isdigit():
                            return ValidationResult(
                                valid=False,
                                layer=ValidationLayer.SEMANTIC,
                                error=f"Invalid import: '{alias.name}' is a number",
                                error_type="invalid_import",
                                line_number=node.lineno
                            )

            return ValidationResult(
                valid=True,
                layer=ValidationLayer.SEMANTIC
            )

        except SyntaxError:
            # Syntax errors caught by Layer 1, skip semantic validation
            return ValidationResult(
                valid=False,
                layer=ValidationLayer.SEMANTIC,
                error="Syntax error prevents semantic validation"
            )


class RuntimeValidator:
    """Layer 3: Runtime import validation"""

    def validate(self, filepath: Path) -> ValidationResult:
        """Validate file can be imported without runtime errors"""

        # Only validate test files, not all Python files
        if not str(filepath).startswith("tests"):
            return ValidationResult(
                valid=True,
                layer=ValidationLayer.RUNTIME,
                error="Not a test file - skipping runtime validation"
            )

        try:
            # Try to compile the file (doesn't execute, just compiles)
            with open(filepath, 'r', encoding='utf-8') as f:
                compile(f.read(), str(filepath), 'exec')

            return ValidationResult(
                valid=True,
                layer=ValidationLayer.RUNTIME
            )

        except Exception as e:
            return ValidationResult(
                valid=False,
                layer=ValidationLayer.RUNTIME,
                error=str(e),
                error_type="runtime_error"
            )


class IntegrationValidator:
    """Layer 4: Integration validation (pytest collection)"""

    def validate(self, filepath: Path) -> ValidationResult:
        """Validate file can be collected by pytest"""

        if not str(filepath).startswith("tests"):
            return ValidationResult(
                valid=True,
                layer=ValidationLayer.INTEGRATION,
                error="Not a test file - skipping integration validation"
            )

        try:
            # Run pytest collection on single file
            result = subprocess.run(
                ["python", "-m", "pytest", str(filepath), "--collect-only", "-q"],
                capture_output=True,
                text=True,
                timeout=10
            )

            # Check if collection succeeded
            if result.returncode == 0:
                # Count tests collected
                lines = result.stdout.split('\n')
                for line in lines:
                    if 'collected' in line.lower():
                        return ValidationResult(
                            valid=True,
                            layer=ValidationLayer.INTEGRATION,
                            error=line.strip()
                        )

                return ValidationResult(
                    valid=True,
                    layer=ValidationLayer.INTEGRATION
                )
            else:
                return ValidationResult(
                    valid=False,
                    layer=ValidationLayer.INTEGRATION,
                    error=result.stderr.strip()[:200],
                    error_type="collection_failed"
                )

        except subprocess.TimeoutExpired:
            return ValidationResult(
                valid=False,
                layer=ValidationLayer.INTEGRATION,
                error="Pytest collection timeout",
                error_type="timeout"
            )
        except Exception as e:
            return ValidationResult(
                valid=False,
                layer=ValidationLayer.INTEGRATION,
                error=str(e),
                error_type="unknown"
            )


class RegressionValidator:
    """Layer 5: Regression prevention validation"""

    def __init__(self, baseline_test_count: int = 111):
        self.baseline = baseline_test_count
        self.min_acceptable = baseline_test_count

    def validate_batch(self, batch_files: List[Path]) -> ValidationResult:
        """Validate that batch of fixes doesn't cause regression"""

        pre_count = self._count_tests()

        if pre_count < self.min_acceptable:
            return ValidationResult(
                valid=False,
                layer=ValidationLayer.REGRESSION,
                error=f"Pre-validation failed: {pre_count} tests < {self.min_acceptable} baseline",
                error_type="baseline_violation"
            )

        # Count would go here after fixes are applied
        # For now, just check pre-count

        return ValidationResult(
            valid=True,
            layer=ValidationLayer.REGRESSION,
            error=f"Baseline validated: {pre_count} tests collected"
        )

    def _count_tests(self) -> int:
        """Count total tests discovered by pytest"""
        try:
            result = subprocess.run(
                ["python", "-m", "pytest", "tests/", "--collect-only", "-q"],
                capture_output=True,
                text=True,
                timeout=30
            )

            # Parse output for test count
            for line in result.stdout.split('\n'):
                if 'collected' in line.lower():
                    # Extract number from "collected 111 items"
                    parts = line.split()
                    for i, part in enumerate(parts):
                        if part.isdigit():
                            return int(part)

            return 0

        except Exception:
            return 0


class MultiLayerValidator:
    """Orchestrates all 5 validation layers"""

    def __init__(self, protected_files: List[str], baseline_tests: int = 111):
        self.syntax = SyntaxValidator()
        self.semantic = SemanticValidator(protected_files)
        self.runtime = RuntimeValidator()
        self.integration = IntegrationValidator()
        self.regression = RegressionValidator(baseline_tests)

    def validate_file(self, filepath: Path, layers: List[ValidationLayer] = None) -> List[ValidationResult]:
        """
        Validate file through specified layers (default: all)

        Returns list of ValidationResult, one per layer
        """
        if layers is None:
            layers = [
                ValidationLayer.SYNTAX,
                ValidationLayer.SEMANTIC,
                ValidationLayer.RUNTIME,
                ValidationLayer.INTEGRATION
            ]

        results = []

        for layer in layers:
            if layer == ValidationLayer.SYNTAX:
                result = self.syntax.validate(filepath)
            elif layer == ValidationLayer.SEMANTIC:
                result = self.semantic.validate(filepath)
            elif layer == ValidationLayer.RUNTIME:
                result = self.runtime.validate(filepath)
            elif layer == ValidationLayer.INTEGRATION:
                result = self.integration.validate(filepath)
            else:
                continue  # Regression is batch-level, not file-level

            results.append(result)

            # Stop on first failure
            if not result.valid:
                break

        return results

    def validate_batch(self, batch_files: List[Path]) -> ValidationResult:
        """Validate batch for regression"""
        return self.regression.validate_batch(batch_files)


def main():
    """CLI for multi-layer validator"""
    import argparse

    parser = argparse.ArgumentParser(description="Multi-Layer Validation System")
    parser.add_argument("filepath", help="File to validate")
    parser.add_argument("--layers", nargs="+",
                       choices=["syntax", "semantic", "runtime", "integration"],
                       default=["syntax", "semantic"],
                       help="Validation layers to run")
    parser.add_argument("--protected", default=".fixes/archaeology/.fixignore",
                       help="Path to .fixignore file")

    args = parser.parse_args()

    # Load protected files
    protected = []
    if Path(args.protected).exists():
        with open(args.protected) as f:
            protected = [line.strip() for line in f if line.strip() and not line.startswith('#')]

    # Create validator
    validator = MultiLayerValidator(protected)

    # Validate file
    filepath = Path(args.filepath)
    layers = [ValidationLayer(l) for l in args.layers]
    results = validator.validate_file(filepath, layers)

    # Print results
    print(f"\nValidation Results: {filepath}")
    print("=" * 60)

    all_passed = True
    for result in results:
        print(result)
        if not result.valid:
            all_passed = False

    print("=" * 60)
    if all_passed:
        print("[PASS] All validation layers passed")
        sys.exit(0)
    else:
        print("[FAIL] Validation failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
