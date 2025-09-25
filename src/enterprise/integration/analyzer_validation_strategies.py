"""
Analyzer Validation Strategies
Strategy pattern implementation for enterprise analyzer validation.
"""

from pathlib import Path
from typing import Dict, Any, List
import ast
import logging
import re

from src.utils.validation.validation_framework import ValidationStrategy, ValidationResult

logger = logging.getLogger(__name__)

class SyntaxValidationStrategy(ValidationStrategy):
    """Validates Python syntax in analyzed code."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate syntax of code string."""
        if not isinstance(data, str):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be a string for syntax validation"]
            )

        errors = []
        warnings = []

        try:
            ast.parse(data)
        except SyntaxError as e:
            errors.append(f"Syntax error at line {e.lineno}: {e.msg}")
        except Exception as e:
            errors.append(f"Unexpected parsing error: {str(e)}")

        # Check for common issues
        if "exec(" in data or "eval(" in data:
            warnings.append("Use of exec/eval detected - potential security risk")

        if len(data.split('\n')) > 1000:
            warnings.append("Large code file - consider splitting")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=1.0 if len(errors) == 0 else 0.0
        )

class SecurityValidationStrategy(ValidationStrategy):
    """Validates code for security issues."""

    SECURITY_PATTERNS = [
        (r'subprocess\.call\([^)]*shell=True', 'Shell injection risk'),
        (r'eval\s*\(', 'Use of eval() function'),
        (r'exec\s*\(', 'Use of exec() function'),
        (r'import\s+pickle', 'Pickle usage - deserialization risk'),
        (r'__import__\s*\(', 'Dynamic import usage'),
        (r'open\s*\([^)]*["\']w["\']', 'File write operations'),
        (r'os\.system\s*\(', 'System command execution'),
        (r'password\s*=\s*["\'][^"\']+["\']', 'Hardcoded password'),
        (r'api_key\s*=\s*["\'][^"\']+["\']', 'Hardcoded API key'),
    ]

    def validate(self, data: Any) -> ValidationResult:
        """Validate code for security issues."""
        if not isinstance(data, str):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be a string for security validation"]
            )

        errors = []
        warnings = []
        security_score = 1.0

        for pattern, message in self.SECURITY_PATTERNS:
            matches = re.findall(pattern, data, re.IGNORECASE)
            if matches:
                severity = self._get_pattern_severity(pattern)
                if severity == "error":
                    errors.append(f"Security issue: {message}")
                    security_score -= 0.2
                else:
                    warnings.append(f"Security concern: {message}")
                    security_score -= 0.1

        # Additional checks
        if 'import requests' in data and 'verify=False' in data:
            warnings.append("SSL verification disabled in requests")
            security_score -= 0.1

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=max(0.0, security_score),
            metadata={"security_patterns_checked": len(self.SECURITY_PATTERNS)}
        )

    def _get_pattern_severity(self, pattern: str) -> str:
        """Determine severity based on pattern."""
        high_risk = ['eval', 'exec', 'shell=True', 'password', 'api_key']
        return "error" if any(risk in pattern for risk in high_risk) else "warning"

class PerformanceValidationStrategy(ValidationStrategy):
    """Validates performance characteristics of analyzed code."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate performance metrics."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be a dictionary containing performance metrics"]
            )

        errors = []
        warnings = []
        performance_score = 1.0

        # Check execution time
        exec_time = data.get('execution_time_ms', 0)
        if exec_time > 5000:  # 5 seconds
            errors.append(f"Execution time too high: {exec_time}ms")
            performance_score -= 0.3
        elif exec_time > 2000:  # 2 seconds
            warnings.append(f"Execution time concerning: {exec_time}ms")
            performance_score -= 0.1

        # Check memory usage
        memory_mb = data.get('memory_usage_mb', 0)
        if memory_mb > 500:  # 500 MB
            errors.append(f"Memory usage too high: {memory_mb}MB")
            performance_score -= 0.3
        elif memory_mb > 200:  # 200 MB
            warnings.append(f"Memory usage concerning: {memory_mb}MB")
            performance_score -= 0.1

        # Check complexity metrics
        complexity = data.get('cyclomatic_complexity', 0)
        if complexity > 15:
            warnings.append(f"High cyclomatic complexity: {complexity}")
            performance_score -= 0.2

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=max(0.0, performance_score),
            metadata={"metrics_validated": len([k for k in data.keys() if k.endswith('_time_ms') or k.endswith('_mb')])}
        )

class ComplianceValidationStrategy(ValidationStrategy):
    """Validates compliance with enterprise standards."""

    REQUIRED_HEADERS = ['SPDX-License-Identifier', 'SPDX-FileCopyrightText']

    def validate(self, data: Any) -> ValidationResult:
        """Validate compliance requirements."""
        if not isinstance(data, str):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be a string for compliance validation"]
            )

        errors = []
        warnings = []
        compliance_score = 1.0

        # Check for required headers
        missing_headers = []
        for header in self.REQUIRED_HEADERS:
            if header not in data:
                missing_headers.append(header)

        if missing_headers:
            warnings.append(f"Missing compliance headers: {', '.join(missing_headers)}")
            compliance_score -= 0.2 * len(missing_headers)

        # Check for docstrings
        lines = data.split('\n')
        if not any('"""' in line or "'''" in line for line in lines[:10]):
            warnings.append("No module docstring found")
            compliance_score -= 0.1

        # Check function documentation
        func_pattern = r'def\s+\w+\s*\([^)]*\):'
        func_matches = re.findall(func_pattern, data)
        if len(func_matches) > 3:  # Only check if multiple functions
            documented_funcs = len(re.findall(r'def\s+\w+\s*\([^)]*\):\s*\n\s*"""', data))
            doc_ratio = documented_funcs / len(func_matches) if func_matches else 1
            if doc_ratio < 0.5:
                warnings.append(f"Low documentation ratio: {doc_ratio:.1%}")
                compliance_score -= 0.2

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=max(0.0, compliance_score),
            metadata={"headers_checked": len(self.REQUIRED_HEADERS), "functions_found": len(func_matches)}
        )

class IntegrationValidationStrategy(ValidationStrategy):
    """Validates integration compatibility."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate integration requirements."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be a dictionary containing integration data"]
            )

        errors = []
        warnings = []

        # Check API compatibility
        api_version = data.get('api_version')
        if not api_version:
            warnings.append("No API version specified")
        elif not re.match(r'^\d+\.\d+\.\d+$', str(api_version)):
            warnings.append("API version format invalid")

        # Check dependencies
        dependencies = data.get('dependencies', [])
        if not dependencies:
            warnings.append("No dependencies specified")
        else:
            for dep in dependencies:
                if not isinstance(dep, dict) or 'name' not in dep:
                    errors.append(f"Invalid dependency format: {dep}")

        # Check backward compatibility
        breaking_changes = data.get('breaking_changes', [])
        if breaking_changes:
            warnings.append(f"Breaking changes detected: {len(breaking_changes)}")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=1.0 - (len(breaking_changes) * 0.1),
            metadata={"dependencies_count": len(dependencies), "breaking_changes": len(breaking_changes)}
        )