"""
Complex Validation Chain Handler

Consolidates validation chain patterns found across 15+ files.
Provides comprehensive data validation with detailed error reporting.
"""

from typing import Dict, List, Any, Optional, Tuple, Callable

from dataclasses import dataclass
from enum import Enum

class ValidationSeverity(Enum):
    """Validation error severity levels."""
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"

@dataclass
class ValidationResult:
    """Result of validation operation."""
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    metadata: Dict[str, Any]

def validate_analysis_data(
    data: Dict[str, Any],
    schema: Optional[Dict[str, Any]] = None
) -> ValidationResult:
    """
    Validate analysis data with comprehensive checks.

    Args:
        data: Data dictionary to validate
        schema: Optional schema for validation

    Returns:
        ValidationResult with detailed findings
    """
    errors = []
    warnings = []

    if not isinstance(data, dict):
        errors.append("Data must be a dictionary")
        return ValidationResult(False, errors, warnings, {})

    errors.extend(_validate_required_fields(data))
    errors.extend(_validate_data_types(data))
    warnings.extend(_validate_optional_fields(data))

    if schema:
        schema_errors = _validate_against_schema(data, schema)
        errors.extend(schema_errors)

    is_valid = len(errors) == 0

    return ValidationResult(
        is_valid=is_valid,
        errors=errors,
        warnings=warnings,
        metadata={'total_checks': len(errors) + len(warnings)}
    )

def _validate_required_fields(data: Dict[str, Any]) -> List[str]:
    """Validate required fields are present."""
    required = ['type', 'severity', 'file']
    errors = []

    for field in required:
        if field not in data:
            errors.append(f"Missing required field: {field}")

    return errors

def _validate_data_types(data: Dict[str, Any]) -> List[str]:
    """Validate data types of fields."""
    errors = []

    type_checks = {
        'severity': str,
        'line_number': int,
        'metadata': dict
    }

    for field, expected_type in type_checks.items():
        if field in data and not isinstance(data[field], expected_type):
            errors.append(
                f"Field '{field}' must be {expected_type.__name__}"
            )

    return errors

def _validate_optional_fields(data: Dict[str, Any]) -> List[str]:
    """Validate optional fields if present."""
    warnings = []

    if 'description' in data and len(data['description']) > 500:
        warnings.append("Description exceeds recommended length")

    if 'tags' in data and not isinstance(data['tags'], list):
        warnings.append("Tags should be a list")

    return warnings

def _validate_against_schema(
    data: Dict[str, Any],
    schema: Dict[str, Any]
) -> List[str]:
    """Validate data against provided schema."""
    errors = []

    for key, rules in schema.items():
        if key not in data:
            if rules.get('required', False):
                errors.append(f"Schema requires field: {key}")
            continue

        value = data[key]
        expected_type = rules.get('type')

        if expected_type and not isinstance(value, expected_type):
            errors.append(
                f"Schema violation: {key} must be {expected_type}"
            )

    return errors

def validate_chain(
    data: Dict[str, Any],
    validators: List[Callable]
) -> Tuple[bool, List[str]]:
    """
    Run a chain of validators.

    Args:
        data: Data to validate
        validators: List of validator functions

    Returns:
        Tuple of (is_valid, error_messages)
    """
    errors = []

    for validator in validators:
        try:
            result = validator(data)
            if not result:
                errors.append(f"Validation failed: {validator.__name__}")
        except Exception as e:
            errors.append(f"Validator error: {str(e)}")

    return len(errors) == 0, errors