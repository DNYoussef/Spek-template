"""
DFARS Path Security Validator
Implements comprehensive path traversal prevention and validation.
"""

from pathlib import Path
from typing import List, Set, Optional, Dict, Any
import os
import re

from lib.shared.utilities import get_logger
from urllib.parse import unquote

class PathSecurityValidator:
    """
    Defense-grade path security validator for DFARS compliance.
    Prevents path traversal attacks and validates file access patterns.
    """

    # DFARS-compliant path patterns
    DANGEROUS_PATTERNS = [
        r'\.\./',     # Directory traversal
        r'\.\.\.',    # Multiple dots
        r'%2e%2e',    # URL encoded dots
        r'%2f',       # URL encoded slash
        r'%5c',       # URL encoded backslash
        r'\x00',      # Null bytes
        r'[<>"|*?]',  # Windows invalid chars
    ]

    SYSTEM_DIRECTORIES = {
        '/etc', '/proc', '/sys', '/dev', '/var/log',
        'C:\\Windows', 'C:\\Program Files', 'C:\\System32',
        '/root', '/home/*/.*', '~/.ssh', '~/.aws'
    }

    def __init__(self, allowed_base_paths: List[str],
                denied_patterns: Optional[List[str]] = None):
        """
        Initialize path validator with allowed base paths.

        Args:
            allowed_base_paths: List of allowed base directory paths
            denied_patterns: Additional patterns to deny
        """
        self.allowed_base_paths = [Path(p).resolve() for p in allowed_base_paths]
        self.denied_patterns = self.DANGEROUS_PATTERNS + (denied_patterns or [])
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE)
                                for pattern in self.denied_patterns]

    def validate_path(self, path: str, operation: str = 'read') -> Dict[str, Any]:
        """
        Validate path for security compliance.

        Args:
            path: Path to validate
            operation: Operation type (read, write, execute)

        Returns:
            Validation result with security assessment
        """
        result = {
            'valid': False,
            'path': path,
            'operation': operation,
            'security_violations': [],
            'normalized_path': None,
            'dfars_compliant': False
        }

        try:
            # Step 1: Normalize and decode the path
            normalized = self._normalize_path(path)
            result['normalized_path'] = str(normalized)

            # Step 2: Check for dangerous patterns
            violations = self._check_dangerous_patterns(path)
            if violations:
                result['security_violations'].extend(violations)
                return result

            # Step 3: Validate against allowed base paths
            if not self._is_within_allowed_paths(normalized):
                result['security_violations'].append(
                    f'Path outside allowed directories: {normalized}'
                )
                return result

            # Step 4: Check system directory access
            if self._accesses_system_directories(normalized):
                result['security_violations'].append(
                    f'Attempted access to system directory: {normalized}'
                )
                return result

            # Step 5: Operation-specific checks
            op_violations = self._validate_operation(normalized, operation)
            if op_violations:
                result['security_violations'].extend(op_violations)
                return result

            # All checks passed
            result['valid'] = True
            result['dfars_compliant'] = True

        except Exception as e:
            result['security_violations'].append(f'Path validation error: {str(e)}')
            logger.error(f"Path validation failed for {path}: {e}")

        return result

    def _normalize_path(self, path: str) -> Path:
        """Normalize path handling URL encoding and relative paths."""
        # URL decode
        decoded = unquote(path)

        # Remove null bytes and control characters
        cleaned = ''.join(char for char in decoded if ord(char) > 31)

        # Convert to Path and resolve
        path_obj = Path(cleaned)

        # Resolve to absolute path
        if not path_obj.is_absolute():
            # Make relative to first allowed base path
            if self.allowed_base_paths:
                path_obj = self.allowed_base_paths[0] / path_obj

        return path_obj.resolve()

    def _check_dangerous_patterns(self, path: str) -> List[str]:
        """Check for dangerous path patterns."""
        violations = []

        for pattern in self.compiled_patterns:
            if pattern.search(path):
                violations.append(f'Dangerous pattern detected: {pattern.pattern}')

        return violations

    def _is_within_allowed_paths(self, path: Path) -> bool:
        """Check if path is within allowed base paths."""
        try:
            for allowed_base in self.allowed_base_paths:
                if path.is_relative_to(allowed_base):
                    return True
        except (ValueError, OSError):
            return False

        return False

    def _accesses_system_directories(self, path: Path) -> bool:
        """Check if path accesses system directories."""
        path_str = str(path).lower()

        for system_dir in self.SYSTEM_DIRECTORIES:
            if path_str.startswith(system_dir.lower()):
                return True

        return False

    def _validate_operation(self, path: Path, operation: str) -> List[str]:
        """Validate operation-specific requirements."""
        violations = []

        if operation == 'write':
            # Check write permissions on parent directory
            parent = path.parent
            if parent.exists() and not os.access(parent, os.W_OK):
                violations.append(f'No write permission for directory: {parent}')

        elif operation == 'execute':
            # Prevent execution of files in data directories
            if any(data_dir in str(path).lower()
                    for data_dir in ['data', 'uploads', 'temp', 'cache']):
                violations.append('Execution blocked in data directory')

        return violations

    def sanitize_filename(self, filename: str) -> str:
        """Sanitize filename for DFARS compliance."""
        # Remove dangerous characters
        sanitized = re.sub(r'[<>:"|*?\\/]', '_', filename)

        # Remove leading/trailing dots and spaces
        sanitized = sanitized.strip('. ')

        # Limit length
        if len(sanitized) > 255:
            name, ext = os.path.splitext(sanitized)
            sanitized = name[:251-len(ext)] + ext

        # Ensure not empty
        if not sanitized:
            sanitized = 'unnamed_file'

        return sanitized

    def validate_file_upload(self, filename: str, content_type: str = None) -> Dict[str, Any]:
        """Validate file upload for security compliance."""
        result = {
            'valid': False,
            'filename': filename,
            'sanitized_filename': None,
            'security_violations': [],
            'dfars_compliant': False
        }

        # Sanitize filename
        sanitized = self.sanitize_filename(filename)
        result['sanitized_filename'] = sanitized

        # Check for executable extensions
        dangerous_extensions = [
            '.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js',
            '.jar', '.sh', '.ps1', '.php', '.asp', '.jsp'
        ]

        ext = Path(sanitized).suffix.lower()
        if ext in dangerous_extensions:
            result['security_violations'].append(f'Dangerous file extension: {ext}')
            return result

        # Validate content type if provided
        if content_type:
            if not self._validate_content_type(content_type, ext):
                result['security_violations'].append(
                    f'Content type mismatch: {content_type} for {ext}'
                )
                return result

        result['valid'] = True
        result['dfars_compliant'] = True
        return result

    def _validate_content_type(self, content_type: str, extension: str) -> bool:
        """Validate content type matches extension."""
        content_type_mapping = {
            '.txt': 'text/plain',
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.zip': 'application/zip',
            '.json': 'application/json',
            '.xml': 'application/xml',
            '.csv': 'text/csv'
        }

        expected = content_type_mapping.get(extension)
        if expected and content_type.startswith(expected):
            return True

        # Allow generic types for unknown extensions
        return content_type.startswith(('text/', 'application/', 'image/'))

class ConfigurationPathValidator:
    """Specialized path validator for configuration files."""

    def __init__(self, config_base_path: str):
        self.config_base = Path(config_base_path).resolve()
        self.validator = PathSecurityValidator([str(self.config_base)])

    def validate_config_path(self, path: str) -> Dict[str, Any]:
        """Validate configuration file path."""
        result = self.validator.validate_path(path, 'read')

        # Additional config-specific checks
        if result['valid']:
            path_obj = Path(result['normalized_path'])

            # Ensure it's a config file
            if path_obj.suffix not in ['.yaml', '.yml', '.json', '.toml', '.ini']:
                result['valid'] = False
                result['security_violations'].append(
                    f'Invalid configuration file type: {path_obj.suffix}'
                )

        return result

    def load_secure_config(self, path: str) -> Dict[str, Any]:
        """Load configuration with path validation."""
        validation = self.validate_config_path(path)

        if not validation['valid']:
            raise SecurityError(
                f"Configuration path validation failed: {validation['security_violations']}"
            )

        # Load configuration safely
        config_path = Path(validation['normalized_path'])

        if config_path.suffix in ['.yaml', '.yml']:
            import yaml
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        elif config_path.suffix == '.json':
            import json
            with open(config_path, 'r') as f:
                return json.load(f)
        else:
            raise ValueError(f"Unsupported config format: {config_path.suffix}")

class SecurityError(Exception):
    """Security validation error."""

# Example usage and testing
def create_dfars_path_validator() -> PathSecurityValidator:
    """Create DFARS-compliant path validator."""
    allowed_paths = [
        str(Path.cwd()),  # Current working directory
        str(Path.home() / 'projects'),  # User projects
        '/tmp',  # Temp directory (Linux)
        str(Path.home() / 'AppData' / 'Local' / 'Temp')  # Temp (Windows)
    ]

    return PathSecurityValidator(allowed_paths)

if __name__ == "__main__":
    # Test the validator
    validator = create_dfars_path_validator()

    test_paths = [
        "normal_file.txt",
        "../../../etc/passwd",
        "uploads/document.pdf",
        "%2e%2e/system32/cmd.exe",
        "data/report.json"
    ]

    for test_path in test_paths:
        result = validator.validate_path(test_path)
        print(f"Valid: {result['valid']}")
        print(f"DFARS Compliant: {result['dfars_compliant']}")
        if result['security_violations']:
            print(f"Violations: {result['security_violations']}")
        print("-" * 50)