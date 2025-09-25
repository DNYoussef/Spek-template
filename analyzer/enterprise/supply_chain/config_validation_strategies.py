from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS, MAXIMUM_RETRY_ATTEMPTS

import re
import os
from typing import Dict, Any, List
from pathlib import Path
import logging

from src.utils.validation.validation_framework import ValidationStrategy, ValidationResult, ValidationRule, RuleEngine

logger = logging.getLogger(__name__)

class PathSecurityStrategy(ValidationStrategy):
    """Validates path security configuration."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate path security settings."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing path config"]
            )

        errors = []
        warnings = []

        path_validation_enabled = data.get('path_validation_enabled', False)
        if not path_validation_enabled:
            warnings.append("Path validation is disabled")

        allowed_paths = data.get('allowed_paths', [])
        if not allowed_paths:
            errors.append("No allowed paths configured")

        # Check for insecure path patterns
        for path in allowed_paths:
            if '../' in path or '..\\' in path:
                errors.append(f"Insecure path pattern detected: {path}")

        score = 1.0 if path_validation_enabled and allowed_paths else 0.5

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=score,
            metadata={"allowed_paths_count": len(allowed_paths)}
        )

class CryptographicStrategy(ValidationStrategy):
    """Validates cryptographic configuration."""

    WEAK_ALGORITHMS = ['sha1', 'md5', 'des', 'rc4']
    STRONG_ALGORITHMS = ['sha256', 'sha512', 'aes-256', 'rsa-2048', 'ecdsa']

    def validate(self, data: Any) -> ValidationResult:
        """Validate cryptographic settings."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing crypto config"]
            )

        errors = []
        warnings = []

        crypto_config = data.get('cryptographic_signing', {})
        if not crypto_config:
            warnings.append("No cryptographic configuration found")
            return ValidationResult(is_valid=True, warnings=warnings, score=0.5)

        # Check enabled status
        if not crypto_config.get('enabled', False):
            warnings.append("Cryptographic signing is disabled")

        # Validate algorithms
        allowed_algorithms = crypto_config.get('allowed_algorithms', [])
        weak_algorithms_found = []
        strong_algorithms_found = []

        for alg in allowed_algorithms:
            alg_lower = alg.lower()
            if any(weak in alg_lower for weak in self.WEAK_ALGORITHMS):
                weak_algorithms_found.append(alg)
            elif any(strong in alg_lower for strong in self.STRONG_ALGORITHMS):
                strong_algorithms_found.append(alg)

        if weak_algorithms_found:
            errors.append(f"Weak algorithms found: {', '.join(weak_algorithms_found)}")

        if not strong_algorithms_found:
            warnings.append("No strong algorithms configured")

        # Check key size
        min_key_size = crypto_config.get('min_key_size', 0)
        if min_key_size < 2048:
            errors.append(f"Minimum key size too small: {min_key_size} (required: 2048)")

        score = len(strong_algorithms_found) / max(1, len(allowed_algorithms)) if allowed_algorithms else 0

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=score,
            metadata={"weak_algorithms": len(weak_algorithms_found), "strong_algorithms": len(strong_algorithms_found)}
        )

class ComplianceFrameworkStrategy(ValidationStrategy):
    """Validates compliance framework configuration."""

    REQUIRED_FRAMEWORKS = ['soc2', 'iso27001', 'dfars']

    def validate(self, data: Any) -> ValidationResult:
        """Validate compliance framework settings."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing compliance config"]
            )

        errors = []
        warnings = []

        # Check security level
        security_level = data.get('security_level', '')
        if 'dfars' not in security_level.lower():
            warnings.append("DFARS compliance not explicitly configured")

        # Check audit trail
        if not data.get('audit_trail_enabled', False):
            errors.append("Audit trail not enabled")

        # Check TLS version
        tls_version = data.get('tls_min_version', '')
        if tls_version != '1.3':
            warnings.append(f"TLS version should be 1.3, found: {tls_version}")

        # Check data protection level
        protection_level = data.get('data_protection_level', '')
        if 'defense' not in protection_level.lower():
            warnings.append("Defense-grade data protection not configured")

        score = 1.0
        if errors:
            score -= len(errors) * 0.3
        if warnings:
            score -= len(warnings) * 0.1

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=max(0.0, score),
            metadata={"security_level": security_level, "tls_version": tls_version}
        )

class EnvironmentVariableStrategy(ValidationStrategy):
    """Validates environment variable configuration."""

    SENSITIVE_PATTERNS = ['password', 'secret', 'key', 'token']

    def validate(self, data: Any) -> ValidationResult:
        """Validate environment variable usage."""
        if not isinstance(data, str):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be string containing configuration content"]
            )

        errors = []
        warnings = []

        # Check for hardcoded sensitive data
        for pattern in self.SENSITIVE_PATTERNS:
            # Look for patterns like password="hardcoded_value"
            regex_pattern = rf'{pattern}\s*[:=]\s*["\'][^"\']+["\']'
            matches = re.findall(regex_pattern, data, re.IGNORECASE)
            if matches:
                errors.append(f"Hardcoded {pattern} detected")

        # Check for proper environment variable substitution
        env_var_pattern = r'\$\{([A-Z_][A-Z0-9_]*)\}'
        env_vars = re.findall(env_var_pattern, data)

        if not env_vars:
            warnings.append("No environment variables found - consider using env vars for sensitive data")

        # Check if required environment variables exist
        missing_env_vars = []
        for var in env_vars:
            if not os.environ.get(var):
                missing_env_vars.append(var)

        if missing_env_vars:
            warnings.append(f"Missing environment variables: {', '.join(missing_env_vars)}")

        score = max(0.0, 1.0 - (len(errors) * 0.5) - (len(missing_env_vars) * 0.1))

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=score,
            metadata={"env_vars_found": len(env_vars), "missing_env_vars": len(missing_env_vars)}
        )

class ConfigStructureStrategy(ValidationStrategy):
    """Validates configuration file structure."""

    REQUIRED_SECTIONS = ['supply_chain', 'integration']
    REQUIRED_SUPPLY_CHAIN_KEYS = ['enabled', 'output_dir', 'sbom', 'slsa', 'vulnerability_scanning']

    def validate(self, data: Any) -> ValidationResult:
        """Validate configuration structure."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing configuration"]
            )

        errors = []
        warnings = []

        # Check required sections
        missing_sections = []
        for section in self.REQUIRED_SECTIONS:
            if section not in data:
                missing_sections.append(section)

        if missing_sections:
            errors.append(f"Missing configuration sections: {', '.join(missing_sections)}")

        # Check supply chain configuration
        if 'supply_chain' in data:
            sc_config = data['supply_chain']
            missing_keys = []
            for key in self.REQUIRED_SUPPLY_CHAIN_KEYS:
                if key not in sc_config:
                    missing_keys.append(key)

            if missing_keys:
                warnings.append(f"Missing supply chain keys: {', '.join(missing_keys)}")

            # Check if supply chain is enabled
            if not sc_config.get('enabled', True):
                warnings.append("Supply chain features are disabled")

        # Check output directory
        output_dir = data.get('supply_chain', {}).get('output_dir')
        if output_dir:
            try:
                Path(output_dir).mkdir(parents=True, exist_ok=True)
            except Exception as e:
                errors.append(f"Cannot create output directory {output_dir}: {e}")

        score = max(0.0, 1.0 - (len(missing_sections) * 0.3) - (len(errors) * 0.2))

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=score,
            metadata={"sections_present": len(self.REQUIRED_SECTIONS) - len(missing_sections)}
        )

class SecurityRuleEngine(RuleEngine):
    """Rule engine for security validation."""

    def __init__(self):
        super().__init__()
        self._initialize_security_rules()

    def _initialize_security_rules(self):
        """Initialize security validation rules."""

        # DFARS compliance rules
        self.add_rule(ValidationRule(
            name="dfars_compliance_enabled",
            condition=lambda data: data.get('supply_chain', {}).get('security_level') == 'dfars_compliant',
            error_message="DFARS compliance not enabled",
            severity="error"
        ))

        self.add_rule(ValidationRule(
            name="audit_trail_required",
            condition=lambda data: data.get('supply_chain', {}).get('audit_trail_enabled', False),
            error_message="Audit trail must be enabled for DFARS compliance",
            severity="error"
        ))

        self.add_rule(ValidationRule(
            name="tls_13_required",
            condition=lambda data: data.get('supply_chain', {}).get('tls_min_version') == '1.3',
            error_message="TLS 1.MAXIMUM_RETRY_ATTEMPTS required for DFARS compliance",
            severity="warning"
        ))

        # Cryptographic rules
        self.add_rule(ValidationRule(
            name="crypto_validation_required",
            condition=lambda data: data.get('supply_chain', {}).get('require_crypto_validation', False),
            error_message="Cryptographic validation must be enabled",
            severity="error"
        ))

        self.add_rule(ValidationRule(
            name="min_key_size_2048",
            condition=lambda data: data.get('supply_chain', {}).get('cryptographic_signing', {}).get('min_key_size', 0) >= 2048,
            error_message="Minimum key size must be 2048 bits or higher",
            severity="error"
        ))

        # Path security rules
        self.add_rule(ValidationRule(
            name="path_validation_enabled",
            condition=lambda data: data.get('supply_chain', {}).get('path_validation_enabled', False),
            error_message="Path validation should be enabled for security",
            severity="warning"
        ))

class PerformanceValidationStrategy(ValidationStrategy):
    """Validates performance-related configuration."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate performance settings."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing performance config"]
            )

        errors = []
        warnings = []

        sc_config = data.get('supply_chain', {})

        # Check performance targets
        overhead_target = sc_config.get('performance_overhead_target', 2.0)
        if overhead_target > 3.0:
            warnings.append(f"High performance overhead target: {overhead_target}")

        # Check parallel processing
        parallel_enabled = sc_config.get('enable_parallel_processing', True)
        if not parallel_enabled:
            warnings.append("Parallel processing is disabled - may impact performance")

        # Check worker count
        max_workers = sc_config.get('max_workers', 4)
        if max_workers > 16:
            warnings.append(f"High worker count may cause resource contention: {max_workers}")
        elif max_workers < 2:
            warnings.append(f"Low worker count may impact performance: {max_workers}")

        # Check timeout
        timeout = sc_config.get('timeout_seconds', 300)
        if timeout > 600:  # MAXIMUM_FUNCTION_PARAMETERS minutes
            warnings.append(f"Long timeout may indicate performance issues: {timeout}s")

        score = max(0.0, 1.0 - (len(warnings) * 0.1))

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=score,
            metadata={"overhead_target": overhead_target, "max_workers": max_workers, "timeout": timeout}
        )