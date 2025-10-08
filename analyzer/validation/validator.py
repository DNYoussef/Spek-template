from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
Input Validation Engine
Comprehensive input validation and sanitization.
"""

from typing import Any, Dict, List, Optional, Union, Callable
import json
import re

from dataclasses import dataclass
from enum import Enum
import html
from pathlib import Path

class ValidationType(Enum):
    """Types of validation."""
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    EMAIL = "email"
    URL = "url"
    PATH = "path"
    SQL = "sql"
    REGEX = "regex"
    CUSTOM = "custom"

@dataclass
class ValidationRule:
    """Represents a validation rule."""
    field_name: str
    validation_type: ValidationType
    required: bool = True
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    pattern: Optional[str] = None
    custom_validator: Optional[Callable] = None
    error_message: Optional[str] = None

class ValidationError(Exception):
    """Validation error exception."""

    def __init__(self, field: str, message: str, value: Any = None):
        self.field = field
        self.message = message
        self.value = value
        super().__init__(f"Validation error in field '{field}': {message}")

class InputValidator:
    """Main input validation engine."""

    def __init__(self):
        self.rules = {}

    def add_rule(self, rule: ValidationRule) -> None:
        """Add a validation rule."""
        self.rules[rule.field_name] = rule

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate data against all rules."""
        errors = []
        validated_data = {}

        for field_name, rule in self.rules.items():
            try:
                value = data.get(field_name)
                validated_value = self._validate_field(field_name, value, rule)
                validated_data[field_name] = validated_value
            except ValidationError as e:
                errors.append(e)

        if errors:
            raise ValidationError("multiple", f"Validation failed: {len(errors)} errors", errors)

        return validated_data

    def _validate_field(self, field_name: str, value: Any, rule: ValidationRule) -> Any:
        """Validate a single field."""
        # Check if required
        if rule.required and (value is None or value == ""):
            raise ValidationError(
                field_name,
                rule.error_message or f"Field '{field_name}' is required"
            )

        # If value is None/empty and not required, return None
        if not rule.required and (value is None or value == ""):
            return None

        # Type-specific validation
        if rule.validation_type == ValidationType.STRING:
            return self._validate_string(field_name, value, rule)
        elif rule.validation_type == ValidationType.INTEGER:
            return self._validate_integer(field_name, value, rule)
        elif rule.validation_type == ValidationType.FLOAT:
            return self._validate_float(field_name, value, rule)
        elif rule.validation_type == ValidationType.EMAIL:
            return self._validate_email(field_name, value, rule)
        elif rule.validation_type == ValidationType.URL:
            return self._validate_url(field_name, value, rule)
        elif rule.validation_type == ValidationType.PATH:
            return self._validate_path(field_name, value, rule)
        elif rule.validation_type == ValidationType.SQL:
            return self._validate_sql(field_name, value, rule)
        elif rule.validation_type == ValidationType.REGEX:
            return self._validate_regex(field_name, value, rule)
        elif rule.validation_type == ValidationType.CUSTOM:
            return self._validate_custom(field_name, value, rule)
        else:
            return value

    def _validate_string(self, field_name: str, value: Any, rule: ValidationRule) -> str:
        """Validate string value."""
        if not isinstance(value, str):
            try:
                value = str(value)
            except:
                raise ValidationError(field_name, "Value must be a string")

        # Length validation
        if rule.min_length is not None and len(value) < rule.min_length:
            raise ValidationError(
                field_name,
                f"String must be at least {rule.min_length} characters long"
            )

        if rule.max_length is not None and len(value) > rule.max_length:
            raise ValidationError(
                field_name,
                f"String must be no more than {rule.max_length} characters long"
            )

        # Pattern validation
        if rule.pattern and not re.match(rule.pattern, value):
            raise ValidationError(
                field_name,
                f"String does not match required pattern"
            )

        # Check for potential injection attacks
        if self._contains_injection_patterns(value):
            raise ValidationError(
                field_name,
                "String contains potentially dangerous content"
            )

        return value

    def _validate_integer(self, field_name: str, value: Any, rule: ValidationRule) -> int:
        """Validate integer value."""
        try:
            if isinstance(value, str):
                # Check for obvious non-integers
                if not value.lstrip('-').isdigit():
                    raise ValueError()
            return int(value)
        except (ValueError, TypeError):
            raise ValidationError(field_name, "Value must be an integer")

    def _validate_float(self, field_name: str, value: Any, rule: ValidationRule) -> float:
        """Validate float value."""
        try:
            return float(value)
        except (ValueError, TypeError):
            raise ValidationError(field_name, "Value must be a number")

    def _validate_email(self, field_name: str, value: Any, rule: ValidationRule) -> str:
        """Validate email address."""
        if not isinstance(value, str):
            raise ValidationError(field_name, "Email must be a string")

        # Basic email regex
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, value):
            raise ValidationError(field_name, "Invalid email format")

        return value.lower().strip()

    def _validate_url(self, field_name: str, value: Any, rule: ValidationRule) -> str:
        """Validate URL."""
        if not isinstance(value, str):
            raise ValidationError(field_name, "URL must be a string")

        # Basic URL validation
        url_pattern = r'^https?://[^\s/$.?#].[^\s]*$'
        if not re.match(url_pattern, value, re.IGNORECASE):
            raise ValidationError(field_name, "Invalid URL format")

        # Check for suspicious URLs
        if self._is_suspicious_url(value):
            raise ValidationError(field_name, "URL appears to be malicious")

        return value.strip()

    def _validate_path(self, field_name: str, value: Any, rule: ValidationRule) -> str:
        """Validate file path."""
        if not isinstance(value, str):
            raise ValidationError(field_name, "Path must be a string")

        # Check for path traversal attacks
        if '../' in value or '..\\' in value:
            raise ValidationError(field_name, "Path contains directory traversal")

        # Check for null bytes
        if '\x00' in value:
            raise ValidationError(field_name, "Path contains null bytes")

        return value.strip()

    def _validate_sql(self, field_name: str, value: Any, rule: ValidationRule) -> str:
        """Validate SQL input for injection attempts."""
        if not isinstance(value, str):
            value = str(value)

        # Check for SQL injection patterns
        sql_injection_patterns = [
            r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)",
            r"(-{2,}|/\*|\*/)",  # Comments
            r"(;|\|)",  # Statement separators
            r"(\b(OR|AND)\s+\d+\s*=\s*\d+)",  # Tautologies
            r"(\'\s*(OR|AND|SELECT))",  # Quote injection
        ]

        for pattern in sql_injection_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValidationError(field_name, "Input contains potential SQL injection")

        return value

    def _validate_regex(self, field_name: str, value: Any, rule: ValidationRule) -> str:
        """Validate using custom regex pattern."""
        if not isinstance(value, str):
            value = str(value)

        if rule.pattern and not re.match(rule.pattern, value):
            raise ValidationError(
                field_name,
                rule.error_message or f"Value does not match required pattern"
            )

        return value

    def _validate_custom(self, field_name: str, value: Any, rule: ValidationRule) -> Any:
        """Validate using custom validator function."""
        if rule.custom_validator:
            try:
                return rule.custom_validator(value)
            except Exception as e:
                raise ValidationError(
                    field_name,
                    rule.error_message or f"Custom validation failed: {str(e)}"
                )

        return value

    def _contains_injection_patterns(self, value: str) -> bool:
        """Check for common injection patterns."""
        dangerous_patterns = [
            r'<script[^>]*>',  # XSS
            r'javascript:',  # JavaScript protocol
            r'vbscript:',  # VBScript protocol
            r'on\w+\s*=',  # Event handlers
            r'eval\s*\(',  # Code evaluation
            r'exec\s*\(',  # Code execution
            r'system\s*\(',  # System calls
        ]

        for pattern in dangerous_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                return True

        return False

    def _is_suspicious_url(self, url: str) -> bool:
        """Check if URL appears malicious."""
        suspicious_patterns = [
            r'javascript:',
            r'data:text/html',
            r'vbscript:',
            r'file://',
            r'\\\\',  # UNC paths
        ]

        for pattern in suspicious_patterns:
            if re.search(pattern, url, re.IGNORECASE):
                return True

        return False

    def sanitize_html(self, html_string: str) -> str:
        """Sanitize HTML content."""
        # Basic HTML escaping
        sanitized = html.escape(html_string)

        # Remove potentially dangerous tags
        dangerous_tags = [
            r'<script[^>]*>.*?</script>',
            r'<iframe[^>]*>.*?</iframe>',
            r'<object[^>]*>.*?</object>',
            r'<embed[^>]*>.*?</embed>',
            r'<form[^>]*>.*?</form>',
        ]

        for pattern in dangerous_tags:
            sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE | re.DOTALL)

        return sanitized

    def validate_json(self, json_string: str) -> Dict[str, Any]:
        """Validate and parse JSON safely."""
        try:
            # Limit JSON size to prevent DoS
            if len(json_string) > 1024 * 1024:  # 1MB limit
                raise ValidationError("json", "JSON too large")

            data = json.loads(json_string)

            # Check for deeply nested structures
            if self._get_json_depth(data) > 20:
                raise ValidationError("json", "JSON structure too deeply nested")

            return data

        except json.JSONDecodeError as e:
            raise ValidationError("json", f"Invalid JSON: {str(e)}")

    def _get_json_depth(self, obj: Any, depth: int = 0) -> int:
        """Calculate JSON object depth."""
        if depth > 50:  # Prevent infinite recursion
            return depth

        if isinstance(obj, dict):
            return max([self._get_json_depth(v, depth + 1) for v in obj.values()], default=depth)
        elif isinstance(obj, list):
            return max([self._get_json_depth(item, depth + 1) for item in obj], default=depth)
        else:
            return depth

    def create_rule_set(self, schema: Dict[str, Any]) -> None:
        """Create validation rules from a schema definition."""
        for field_name, field_config in schema.items():
            rule = ValidationRule(
                field_name=field_name,
                validation_type=ValidationType(field_config.get('type', 'string')),
                required=field_config.get('required', True),
                min_length=field_config.get('min_length'),
                max_length=field_config.get('max_length'),
                pattern=field_config.get('pattern'),
                error_message=field_config.get('error_message')
            )
            self.add_rule(rule)