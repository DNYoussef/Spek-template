from src.constants.base import CONNASCENCE_ANALYSIS_THRESHOLD, MAXIMUM_RETRY_ATTEMPTS

import re
import json
from typing import Dict, Any, List
from pathlib import Path
import logging

from src.utils.validation.validation_framework import ValidationStrategy, ValidationResult

logger = logging.getLogger(__name__)

class AccessControlValidationStrategy(ValidationStrategy):
    """Validates access control implementation per DFARS."""

    ACCESS_CONTROL_PATTERNS = [
        'PathSecurityValidator',
        'authenticate',
        'authorize',
        'permission',
        'access_control',
        'security_check'
    ]

    def validate(self, data: Any) -> ValidationResult:
        """Validate access control mechanisms."""
        if isinstance(data, str):
            # String input - check for access control patterns
            content = data
        elif isinstance(data, dict):
            # Dict input - check system configuration
            return self._validate_config(data)
        else:
            return ValidationResult(
                is_valid=False,
                errors=["Input must be string (code) or dict (config)"]
            )

        errors = []
        warnings = []
        score = 0.0

        patterns_found = 0
        for pattern in self.ACCESS_CONTROL_PATTERNS:
            if pattern in content:
                patterns_found += 1

        if patterns_found == 0:
            errors.append("No access control mechanisms found")
        elif patterns_found < 3:
            warnings.append(f"Limited access control patterns: {patterns_found}/6")
            score = patterns_found / len(self.ACCESS_CONTROL_PATTERNS)
        else:
            score = 1.0

        # Check for specific DFARS requirements
        if 'DFARS' not in content:
            warnings.append("No explicit DFARS compliance markers")
            score -= 0.1

        if 'path_traversal' in content.lower():
            score += 0.2  # Bonus for path traversal protection

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=max(0.0, min(1.0, score)),
            metadata={"patterns_found": patterns_found, "total_patterns": len(self.ACCESS_CONTROL_PATTERNS)}
        )

    def _validate_config(self, config: Dict) -> ValidationResult:
        """Validate access control configuration."""
        errors = []
        warnings = []

        required_fields = ['authentication_method', 'authorization_levels', 'session_timeout']
        for field in required_fields:
            if field not in config:
                errors.append(f"Missing required access control field: {field}")

        if config.get('session_timeout', 0) > 3600:  # 1 hour max
            warnings.append("Session timeout exceeds recommended 1 hour")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=1.0 - (len(errors) * 0.2)
        )

class AuditValidationStrategy(ValidationStrategy):
    """Validates audit trail implementation per DFARS."""

    AUDIT_REQUIREMENTS = [
        'audit_trail',
        'log_retention',
        'tamper_detection',
        'integrity_hash',
        'audit_event',
        '2555'  # 7-year retention code
    ]

    def validate(self, data: Any) -> ValidationResult:
        """Validate audit trail implementation."""
        if isinstance(data, str):
            content = data
        elif isinstance(data, dict):
            return self._validate_audit_config(data)
        else:
            return ValidationResult(
                is_valid=False,
                errors=["Input must be string (code) or dict (audit data)"]
            )

        errors = []
        warnings = []
        score = 0.0

        requirements_met = 0
        for requirement in self.AUDIT_REQUIREMENTS:
            if requirement in content:
                requirements_met += 1

        if requirements_met < MAXIMUM_RETRY_ATTEMPTS:
            errors.append(f"Insufficient audit controls: {requirements_met}/{len(self.AUDIT_REQUIREMENTS)}")
        else:
            score = requirements_met / len(self.AUDIT_REQUIREMENTS)

        # Check for specific DFARS audit requirements
        if 'DFARSAuditTrailManager' in content:
            score += 0.2

        if '7-year' in content or '2555' in content:
            score += 0.2
        else:
            warnings.append("No 7-year retention policy found")

        if 'integrity_hash' not in content:
            warnings.append("No tamper detection mechanism found")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=max(0.0, min(1.0, score)),
            metadata={"requirements_met": requirements_met, "total_requirements": len(self.AUDIT_REQUIREMENTS)}
        )

    def _validate_audit_config(self, audit_data: Dict) -> ValidationResult:
        """Validate audit configuration data."""
        errors = []
        warnings = []

        retention_days = audit_data.get('retention_days', 0)
        if retention_days < 2555:  # 7 years
            errors.append(f"Retention period too short: {retention_days} days (required: 2555)")

        if not audit_data.get('tamper_detection', False):
            errors.append("Tamper detection not enabled")

        if not audit_data.get('encryption_enabled', False):
            warnings.append("Audit logs not encrypted")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=1.0 - (len(errors) * 0.3) - (len(warnings) * 0.1)
        )

class EncryptionValidationStrategy(ValidationStrategy):
    """Validates encryption implementation per DFARS."""

    APPROVED_ALGORITHMS = ['SHA256', 'SHA512', 'AES-256', 'RSA-2048', 'ECDSA']
    DEPRECATED_ALGORITHMS = ['SHA1', 'MD5', 'DES', 'RC4']

    def validate(self, data: Any) -> ValidationResult:
        """Validate cryptographic implementation."""
        if isinstance(data, str):
            content = data
        elif isinstance(data, dict):
            return self._validate_crypto_config(data)
        else:
            return ValidationResult(
                is_valid=False,
                errors=["Input must be string (code) or dict (crypto config)"]
            )

        errors = []
        warnings = []
        score = 1.0

        # Check for deprecated algorithms
        for deprecated in self.DEPRECATED_ALGORITHMS:
            if deprecated.lower() in content.lower():
                if 'allow_legacy' in content and deprecated.lower() in content.lower():
                    warnings.append(f"Legacy algorithm {deprecated} present but controlled")
                    score -= 0.1
                else:
                    errors.append(f"Deprecated algorithm found: {deprecated}")
                    score -= 0.2

        # Check for approved algorithms
        approved_count = 0
        for approved in self.APPROVED_ALGORITHMS:
            if approved in content:
                approved_count += 1

        if approved_count == 0:
            warnings.append("No approved cryptographic algorithms found")
            score -= 0.2

        # Check for FIPS compliance indicators
        if 'FIPS' in content:
            score += 0.1
        else:
            warnings.append("No FIPS compliance indicators")

        # Check TLS version
        if 'TLSv1_3' in content:
            score += 0.1
        elif 'TLS' in content:
            warnings.append("TLS version should be 1.3 for DFARS compliance")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=max(0.0, score),
            metadata={"approved_algorithms_found": approved_count, "deprecated_found": len([d for d in self.DEPRECATED_ALGORITHMS if d.lower() in content.lower()])}
        )

    def _validate_crypto_config(self, crypto_config: Dict) -> ValidationResult:
        """Validate cryptographic configuration."""
        errors = []
        warnings = []

        allowed_algorithms = crypto_config.get('allowed_algorithms', [])
        for deprecated in self.DEPRECATED_ALGORITHMS:
            if any(deprecated.lower() in alg.lower() for alg in allowed_algorithms):
                errors.append(f"Deprecated algorithm in config: {deprecated}")

        min_key_size = crypto_config.get('min_key_size', 0)
        if min_key_size < 2048:
            errors.append(f"Minimum key size too small: {min_key_size} (required: 2048)")

        if not crypto_config.get('require_certificate_validation', True):
            errors.append("Certificate validation not required")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=1.0 - (len(errors) * 0.25)
        )

class DataProtectionValidationStrategy(ValidationStrategy):
    """Validates data protection implementation per DFARS."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate data protection mechanisms."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing data protection config"]
            )

        errors = []
        warnings = []
        score = 1.0

        # Check encryption at rest
        if not data.get('encryption_at_rest', False):
            errors.append("Data encryption at rest not enabled")
            score -= 0.3

        # Check encryption in transit
        if not data.get('encryption_in_transit', False):
            errors.append("Data encryption in transit not enabled")
            score -= 0.2

        # Check data classification
        classification = data.get('data_classification')
        if not classification:
            warnings.append("No data classification specified")
            score -= 0.1
        elif classification not in ['public', 'internal', 'confidential', 'restricted']:
            warnings.append(f"Invalid data classification: {classification}")

        # Check backup encryption
        if not data.get('backup_encryption', False):
            warnings.append("Backup encryption not specified")
            score -= 0.1

        # Check data sanitization
        if not data.get('sanitization_procedures', False):
            warnings.append("No data sanitization procedures")
            score -= 0.1

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=max(0.0, score),
            metadata={"protection_mechanisms": len([k for k, v in data.items() if v and k.endswith('_encryption')])}
        )

class ComplianceReportingStrategy(ValidationStrategy):
    """Validates DFARS compliance reporting."""

    REQUIRED_REPORT_SECTIONS = [
        'compliance_score',
        'security_enhancements',
        'dfars_version',
        'assessment_date',
        'certification_ready'
    ]

    def validate(self, data: Any) -> ValidationResult:
        """Validate compliance report structure."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing compliance report"]
            )

        errors = []
        warnings = []
        score = 1.0

        # Check required sections
        missing_sections = []
        for section in self.REQUIRED_REPORT_SECTIONS:
            if section not in data:
                missing_sections.append(section)

        if missing_sections:
            errors.append(f"Missing report sections: {', '.join(missing_sections)}")
            score -= len(missing_sections) * 0.2

        # Validate compliance score
        compliance_score = data.get('compliance_score', 0)
        if not isinstance(compliance_score, (int, float)):
            errors.append("Compliance score must be numeric")
        elif compliance_score < CONNASCENCE_ANALYSIS_THRESHOLD:  # 88% minimum
            warnings.append(f"Compliance score below recommended 88%: {compliance_score}")

        # Check DFARS version
        dfars_version = data.get('dfars_version')
        if dfars_version != '252.204-7012':
            warnings.append(f"DFARS version may be outdated: {dfars_version}")

        # Check certification readiness
        if not data.get('certification_ready', False):
            warnings.append("System not marked as certification ready")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=max(0.0, score),
            metadata={"sections_present": len(self.REQUIRED_REPORT_SECTIONS) - len(missing_sections), "total_sections": len(self.REQUIRED_REPORT_SECTIONS)}
        )