from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
Data Sanitization Engine
Sanitizes and cleans input data for security.
"""

from typing import Any, Dict, List, Optional, Union
import re

from dataclasses import dataclass
from enum import Enum
import html
import urllib.parse
from pathlib import Path

class SanitizationType(Enum):
    """Types of sanitization."""
    HTML_ESCAPE = "html_escape"
    URL_ENCODE = "url_encode"
    SQL_ESCAPE = "sql_escape"
    REMOVE_SCRIPTS = "remove_scripts"
    REMOVE_HTML = "remove_html"
    NORMALIZE_WHITESPACE = "normalize_whitespace"
    REMOVE_CONTROL_CHARS = "remove_control_chars"

@dataclass
class SanitizationResult:
    """Result of sanitization operation."""
    original_value: Any
    sanitized_value: Any
    sanitization_applied: List[str]
    warnings: List[str]

class DataSanitizer:
    """Main data sanitization engine."""

    def __init__(self):
        self.default_sanitizations = [
            SanitizationType.REMOVE_CONTROL_CHARS,
            SanitizationType.NORMALIZE_WHITESPACE
        ]

    def sanitize(self,
                value: Any,
                sanitizations: Optional[List[SanitizationType]] = None) -> SanitizationResult:
        """Sanitize a value using specified sanitization methods."""
        if sanitizations is None:
            sanitizations = self.default_sanitizations

        original_value = value
        current_value = value
        applied_sanitizations = []
        warnings = []

        # Convert to string if needed
        if not isinstance(current_value, str):
            current_value = str(current_value)

        for sanitization in sanitizations:
            try:
                if sanitization == SanitizationType.HTML_ESCAPE:
                    current_value = self._html_escape(current_value)
                    applied_sanitizations.append("html_escape")

                elif sanitization == SanitizationType.URL_ENCODE:
                    current_value = self._url_encode(current_value)
                    applied_sanitizations.append("url_encode")

                elif sanitization == SanitizationType.SQL_ESCAPE:
                    current_value = self._sql_escape(current_value)
                    applied_sanitizations.append("sql_escape")

                elif sanitization == SanitizationType.REMOVE_SCRIPTS:
                    current_value, script_warnings = self._remove_scripts(current_value)
                    warnings.extend(script_warnings)
                    applied_sanitizations.append("remove_scripts")

                elif sanitization == SanitizationType.REMOVE_HTML:
                    current_value = self._remove_html(current_value)
                    applied_sanitizations.append("remove_html")

                elif sanitization == SanitizationType.NORMALIZE_WHITESPACE:
                    current_value = self._normalize_whitespace(current_value)
                    applied_sanitizations.append("normalize_whitespace")

                elif sanitization == SanitizationType.REMOVE_CONTROL_CHARS:
                    current_value = self._remove_control_chars(current_value)
                    applied_sanitizations.append("remove_control_chars")

            except Exception as e:
                warnings.append(f"Error during {sanitization.value}: {str(e)}")

        return SanitizationResult(
            original_value=original_value,
            sanitized_value=current_value,
            sanitization_applied=applied_sanitizations,
            warnings=warnings
        )

    def _html_escape(self, value: str) -> str:
        """Escape HTML special characters."""
        return html.escape(value, quote=True)

    def _url_encode(self, value: str) -> str:
        """URL encode the value."""
        return urllib.parse.quote(value, safe='')

    def _sql_escape(self, value: str) -> str:
        """Escape SQL special characters."""
        # Basic SQL escaping - replace single quotes
        return value.replace("'", "''")

    def _remove_scripts(self, value: str) -> tuple[str, List[str]]:
        """Remove script tags and JavaScript."""
        warnings = []

        # Remove script tags
        script_pattern = r'<script[^>]*>.*?</script>'
        if re.search(script_pattern, value, re.IGNORECASE | re.DOTALL):
            warnings.append("Removed script tags")
            value = re.sub(script_pattern, '', value, flags=re.IGNORECASE | re.DOTALL)

        # Remove JavaScript event handlers
        js_events = [
            r'on\w+\s*=\s*["\'][^"\']*["\']',
            r'javascript:',
            r'vbscript:',
        ]

        for pattern in js_events:
            if re.search(pattern, value, re.IGNORECASE):
                warnings.append(f"Removed JavaScript pattern: {pattern}")
                value = re.sub(pattern, '', value, flags=re.IGNORECASE)

        return value, warnings

    def _remove_html(self, value: str) -> str:
        """Remove all HTML tags."""
        # Remove HTML tags
        clean_text = re.sub(r'<[^>]+>', '', value)

        # Decode HTML entities
        clean_text = html.unescape(clean_text)

        return clean_text

    def _normalize_whitespace(self, value: str) -> str:
        """Normalize whitespace characters."""
        # Replace multiple whitespace with single space
        normalized = re.sub(r'\s+', ' ', value)

        # Strip leading/trailing whitespace
        normalized = normalized.strip()

        return normalized

    def _remove_control_chars(self, value: str) -> str:
        """Remove control characters."""
        # Remove non-printable characters except common whitespace
        cleaned = ''.join(char for char in value
                        if ord(char) >= 32 or char in '\t\n\r')

        # Remove null bytes
        cleaned = cleaned.replace('\x00', '')

        return cleaned

    def sanitize_filename(self, filename: str) -> str:
        """Sanitize filename for safe storage."""
        # Remove path separators and dangerous characters
        dangerous_chars = r'[<>:"/\\|?*\x00-\x1f]'
        clean_name = re.sub(dangerous_chars, '_', filename)

        # Remove leading dots (hidden files)
        clean_name = clean_name.lstrip('.')

        # Limit length
        if len(clean_name) > 255:
            name, ext = clean_name.rsplit('.', 1) if '.' in clean_name else (clean_name, '')
            clean_name = name[:250] + ('.' + ext if ext else '')

        return clean_name or 'sanitized_file'

    def sanitize_json_keys(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize JSON object keys."""
        sanitized = {}

        for key, value in data.items():
            # Sanitize key
            clean_key = self._sanitize_json_key(key)

            # Recursively sanitize nested objects
            if isinstance(value, dict):
                sanitized[clean_key] = self.sanitize_json_keys(value)
            elif isinstance(value, list):
                sanitized[clean_key] = [
                    self.sanitize_json_keys(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                sanitized[clean_key] = value

        return sanitized

    def _sanitize_json_key(self, key: str) -> str:
        """Sanitize a JSON key."""
        # Remove dangerous characters from keys
        clean_key = re.sub(r'[^\w\-_]', '_', key)

        # Ensure key doesn't start with number
        if clean_key and clean_key[0].isdigit():
            clean_key = 'key_' + clean_key

        return clean_key or 'sanitized_key'

    def detect_malicious_patterns(self, value: str) -> List[str]:
        """Detect potentially malicious patterns in input."""
        threats = []

        # XSS patterns
        xss_patterns = [
            r'<script[^>]*>',
            r'javascript:',
            r'vbscript:',
            r'on\w+\s*=',
            r'eval\s*\(',
            r'document\.cookie',
            r'window\.location',
        ]

        for pattern in xss_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                threats.append(f"XSS pattern detected: {pattern}")

        # SQL injection patterns
        sql_patterns = [
            r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)",
            r"(-{2,}|/\*|\*/)",
            r"(\'\s*(OR|AND|SELECT))",
            r"(\b(OR|AND)\s+\d+\s*=\s*\d+)",
        ]

        for pattern in sql_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                threats.append(f"SQL injection pattern detected: {pattern}")

        # Command injection patterns
        cmd_patterns = [
            r'[;&|`$\(\)]',
            r'\.\./|\.\.\\',
            r'/etc/passwd',
            r'cmd\.exe',
            r'powershell',
        ]

        for pattern in cmd_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                threats.append(f"Command injection pattern detected: {pattern}")

        # Path traversal
        if '../' in value or '..\\'  in value:
            threats.append("Path traversal pattern detected")

        return threats

    def comprehensive_sanitize(self,
                            value: Any,
                            context: str = "general") -> SanitizationResult:
        """Perform comprehensive sanitization based on context."""
        sanitizations = []

        if context == "html":
            sanitizations = [
                SanitizationType.REMOVE_CONTROL_CHARS,
                SanitizationType.REMOVE_SCRIPTS,
                SanitizationType.HTML_ESCAPE,
                SanitizationType.NORMALIZE_WHITESPACE
            ]
        elif context == "sql":
            sanitizations = [
                SanitizationType.REMOVE_CONTROL_CHARS,
                SanitizationType.SQL_ESCAPE,
                SanitizationType.NORMALIZE_WHITESPACE
            ]
        elif context == "url":
            sanitizations = [
                SanitizationType.REMOVE_CONTROL_CHARS,
                SanitizationType.URL_ENCODE
            ]
        elif context == "filename":
            # Special handling for filenames
            if isinstance(value, str):
                sanitized_filename = self.sanitize_filename(value)
                return SanitizationResult(
                    original_value=value,
                    sanitized_value=sanitized_filename,
                    sanitization_applied=["filename_sanitization"],
                    warnings=[]
                )
        else:  # general
            sanitizations = [
                SanitizationType.REMOVE_CONTROL_CHARS,
                SanitizationType.NORMALIZE_WHITESPACE
            ]

        result = self.sanitize(value, sanitizations)

        # Add threat detection warnings
        if isinstance(result.sanitized_value, str):
            threats = self.detect_malicious_patterns(result.sanitized_value)
            result.warnings.extend(threats)

        return result