"""Security Validation and Sanitization Utilities

Consolidates common security patterns including input validation,
path sanitization, and security checks.
Extracted from: src/security/path_validator.py, src/security/enhanced_incident_response_system.py
"""

from pathlib import Path
from typing import List, Optional, Dict, Any, Set
import hashlib
import os
import re

from urllib.parse import unquote

class InputValidator:
    """Validate and sanitize user inputs."""

    # Common dangerous patterns
    SQL_INJECTION_PATTERNS = [
        r"('|(\-\-)|(;)|(\|\|)|(\*))",
        r"(\b(SELECT|UNION|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)"
    ]
    
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"onerror\s*=",
        r"onload\s*="
    ]

@classmethod
def sanitize_input(cls, value: str, allow_html: bool = False) -> str:
        """Sanitize user input."""
        if not isinstance(value, str):
            return str(value)
        
        # Remove null bytes
        value = value.replace('\x00', '')
        
        # Check for SQL injection
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValueError(f"Potential SQL injection detected: {pattern}")
        
        # Check for XSS if HTML not allowed
        if not allow_html:
            for pattern in cls.XSS_PATTERNS:
                if re.search(pattern, value, re.IGNORECASE):
                    raise ValueError(f"Potential XSS detected: {pattern}")
        
        return value.strip()

@classmethod
def validate_email(cls, email: str) -> bool:
        """Validate email format."""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

@classmethod
def validate_alphanumeric(cls, value: str, allow_underscore: bool = True) -> bool:
        """Validate alphanumeric input."""
        pattern = r'^[a-zA-Z0-9_]+$' if allow_underscore else r'^[a-zA-Z0-9]+$'
        return bool(re.match(pattern, value))

class PathSecurityUtils:
    """Path security validation utilities."""

    DANGEROUS_PATTERNS = [
        r'\.\.\/',     # Directory traversal
        r'\.\.\.',     # Multiple dots
        r'%2e%2e',      # URL encoded dots
        r'%2f',         # URL encoded slash
        r'%5c',         # URL encoded backslash
        r'\x00',        # Null bytes
        r'[<>"|*?]',   # Invalid chars
    ]

    SYSTEM_DIRS = {
        '/etc', '/proc', '/sys', '/dev', '/var/log',
        'C:\\Windows', 'C:\\Program Files', 'C:\\System32',
    }

@classmethod
def normalize_path(cls, path: str) -> Path:
        """Normalize and decode path."""
        # Decode URL encoding
        decoded = unquote(path)
        # Resolve to absolute path
        return Path(decoded).resolve()

@classmethod
def check_dangerous_patterns(cls, path: str) -> List[str]:
        """Check for dangerous path patterns."""
        violations = []
        for pattern in cls.DANGEROUS_PATTERNS:
            if re.search(pattern, path, re.IGNORECASE):
                violations.append(f"Dangerous pattern: {pattern}")
        return violations

@classmethod
def is_within_allowed_paths(
        cls,
        path: Path,
        allowed_paths: List[Path]
    ) -> bool:
        """Check if path is within allowed directories."""
        path_resolved = path.resolve()
        return any(
            path_resolved.is_relative_to(allowed)
            for allowed in allowed_paths
        )

@classmethod
def validate_path(
        cls,
        path: str,
        allowed_base_paths: List[str]
    ) -> Dict[str, Any]:
        """Validate path for security."""
        result = {
            'valid': False,
            'path': path,
            'violations': [],
            'normalized': None
        }

        # Normalize path
        normalized = cls.normalize_path(path)
        result['normalized'] = str(normalized)

        # Check dangerous patterns
        violations = cls.check_dangerous_patterns(path)
        if violations:
            result['violations'].extend(violations)
            return result

        # Check allowed paths
        allowed = [Path(p).resolve() for p in allowed_base_paths]
        if not cls.is_within_allowed_paths(normalized, allowed):
            result['violations'].append('Path outside allowed directories')
            return result

        result['valid'] = True
        return result

class CryptoUtils:
    """Cryptographic utilities."""

@staticmethod
def calculate_hash(data: str, algorithm: str = 'sha256') -> str:
        """Calculate hash of data."""
        hasher = hashlib.new(algorithm)
        hasher.update(data.encode())
        return hasher.hexdigest()

@staticmethod
def verify_hash(data: str, expected_hash: str, algorithm: str = 'sha256') -> bool:
        """Verify data against hash."""
        actual_hash = CryptoUtils.calculate_hash(data, algorithm)
        return actual_hash == expected_hash

class SecurityChecker:
    """Common security checks."""

@staticmethod
def check_permissions(path: Path, required_mode: int) -> bool:
        """Check file permissions."""
        if not path.exists():
            return False
        return (path.stat().st_mode & required_mode) == required_mode

@staticmethod
def is_safe_filename(filename: str) -> bool:
        """Check if filename is safe."""
        # No path separators
        if '/' in filename or '\\' in filename:
            return False
        # No hidden files
        if filename.startswith('.'):
            return False
        # No dangerous extensions
        dangerous_exts = {'.exe', '.bat', '.cmd', '.sh', '.ps1'}
        if Path(filename).suffix.lower() in dangerous_exts:
            return False
        return True
