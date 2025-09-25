from src.constants.base import NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD

import json
import yaml
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import logging

# Import existing analyzers
try:
    from analyzer.nasa_engine.nasa_analyzer import NASAAnalyzer
    NASA_AVAILABLE = True
except ImportError:
    NASA_AVAILABLE = False

try:
    from analyzer.connascence_analyzer import ConnascenceAnalyzer
    CONNASCENCE_AVAILABLE = True
except ImportError:
    CONNASCENCE_AVAILABLE = False

try:
    from analyzer.enterprise.compliance.core import ComplianceOrchestrator
    ENTERPRISE_AVAILABLE = True
except ImportError:
    ENTERPRISE_AVAILABLE = False

try:
    from src.security.continuous_theater_monitor import TheaterDetector
    THEATER_AVAILABLE = True
except ImportError:
    THEATER_AVAILABLE = False

from .receipt_schema import Receipt

logger = logging.getLogger(__name__)

class ValidationStatus(Enum):
    """Validation result status"""
    OK = "OK"
    PARTIAL = "PARTIAL"
    BLOCKED = "BLOCKED"

@dataclass
class ValidationResult:
    """Complete validation result"""
    status: ValidationStatus
    passed_checks: List[str] = field(default_factory=list)
    failed_checks: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    placeholders_inserted: List[str] = field(default_factory=list)
    scores: Dict[str, float] = field(default_factory=dict)

    def to_receipt_update(self, receipt: Receipt) -> None:
        """Update receipt based on validation results"""
        receipt.status = self.status.value
        receipt.warnings = self.warnings

        if self.status == ValidationStatus.BLOCKED:
            receipt.reason_if_blocked = self.failed_checks[0] if self.failed_checks else "Validation failed"

        # Add validation scores to receipt
        if self.scores:
            receipt.versions['validation_scores'] = self.scores

class UnifiedValidator:
    """
    Unified validation framework that integrates all analyzers
    """

    def __init__(self, config_path: str = "registry/policies/qc_rules.yaml"):
        """Initialize with QC rules configuration"""
        self.config = self._load_config(config_path)
        self.analyzers = self._initialize_analyzers()

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load QC rules configuration"""
        path = Path(config_path)
        if not path.exists():
            logger.warning(f"QC rules not found at {config_path}, using defaults")
            return self._get_default_config()

        with open(path, 'r') as f:
            return yaml.safe_load(f)

    def _get_default_config(self) -> Dict[str, Any]:
        """Return minimal default configuration"""
        return {
            'validation': {
                'placeholder': 'TK CONFIRM',
                'banned_words': [],
                'length_limits': {},
                'required_fields': {}
            },
            'nasa_pot10': {'enabled': False},
            'connascence': {'enabled': False},
            'enterprise': {'enabled': False},
            'quality_gates': {
                'pass_thresholds': {
                    'schema_compliance': 1.0,
                    'nasa_compliance': NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD,
                    'connascence_score': 0.85,
                    'security_score': 0.95
                }
            }
        }

    def _initialize_analyzers(self) -> Dict[str, Any]:
        """Initialize available analyzers"""
        analyzers = {}

        if NASA_AVAILABLE and self.config.get('nasa_pot10', {}).get('enabled'):
            try:
                analyzers['nasa'] = NASAAnalyzer()
                logger.info("NASA POT10 analyzer initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize NASA analyzer: {e}")

        if CONNASCENCE_AVAILABLE and self.config.get('connascence', {}).get('enabled'):
            try:
                analyzers['connascence'] = ConnascenceAnalyzer()
                logger.info("Connascence analyzer initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Connascence analyzer: {e}")

        if ENTERPRISE_AVAILABLE and self.config.get('enterprise', {}).get('enabled'):
            try:
                from analyzer.enterprise.config.enterprise_config import EnterpriseConfig
                config = EnterpriseConfig()
                analyzers['enterprise'] = ComplianceOrchestrator(config)
                logger.info("Enterprise compliance orchestrator initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Enterprise analyzer: {e}")

        if THEATER_AVAILABLE:
            try:
                analyzers['theater'] = TheaterDetector()
                logger.info("Theater detector initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Theater detector: {e}")

        return analyzers

    def validate_schema(self, data: Dict[str, Any], schema_type: str) -> ValidationResult:
        """
        Validate data against schema with QC rules
        """
        result = ValidationResult(status=ValidationStatus.OK)

        # Get validation rules
        rules = self.config.get('validation', {})
        required_fields = rules.get('required_fields', {}).get(schema_type, [])
        length_limits = rules.get('length_limits', {})
        banned_words = rules.get('banned_words', [])
        placeholder = rules.get('placeholder', 'TK CONFIRM')

        # Check required fields
        for field in required_fields:
            if field not in data or data[field] is None:
                result.failed_checks.append(f"Missing required field: {field}")
                result.placeholders_inserted.append(field)
                data[field] = placeholder
                result.status = ValidationStatus.PARTIAL

        # Check field lengths
        for field, limits in length_limits.items():
            if field in data and isinstance(data[field], str):
                length = len(data[field])
                if 'min' in limits and length < limits['min']:
                    result.warnings.append(f"{field} too short: {length} < {limits['min']}")
                    result.suggestions.append(f"Expand {field} to at least {limits['min']} characters")
                    result.status = ValidationStatus.PARTIAL
                if 'max' in limits and length > limits['max']:
                    result.warnings.append(f"{field} too long: {length} > {limits['max']}")
                    result.suggestions.append(f"Truncate {field} to {limits['max']} characters")
                    data[field] = data[field][:limits['max']]

        # Check for banned words
        text_fields = [v for v in data.values() if isinstance(v, str)]
        text_content = ' '.join(text_fields).lower()

        for banned_word in banned_words:
            if banned_word.lower() in text_content:
                result.warnings.append(f"Banned word detected: '{banned_word}'")
                result.suggestions.append(f"Remove or replace '{banned_word}'")

        # Check for placeholders in OK status
        if placeholder in text_content and result.status == ValidationStatus.OK:
            result.status = ValidationStatus.PARTIAL
            result.warnings.append(f"Placeholder '{placeholder}' found - cannot be OK status")

        result.passed_checks.append(f"Schema validation: {schema_type}")
        return result

    def validate_code_quality(self, file_path: str, content: str) -> ValidationResult:
        """
        Run code quality validation using integrated analyzers
        """
        result = ValidationResult(status=ValidationStatus.OK)

        # NASA POT10 validation
        if 'nasa' in self.analyzers:
            try:
                violations = self.analyzers['nasa'].analyze_file(file_path, content)
                nasa_score = 1.0 - (len(violations) / 100.0)  # Simple scoring
                result.scores['nasa_compliance'] = nasa_score

                threshold = self.config['quality_gates']['pass_thresholds']['nasa_compliance']
                if nasa_score < threshold:
                    result.status = ValidationStatus.PARTIAL
                    result.failed_checks.append(f"NASA compliance {nasa_score:.2f} < {threshold}")
                    for v in violations[:3]:  # First 3 violations
                        result.warnings.append(f"NASA POT10: {v.type} at line {v.line}")
                else:
                    result.passed_checks.append(f"NASA POT10 compliance: {nasa_score:.2f}")
            except Exception as e:
                logger.warning(f"NASA validation failed: {e}")

        # Connascence validation
        if 'connascence' in self.analyzers:
            try:
                analysis = self.analyzers['connascence'].analyze_file(file_path)
                if 'connascence_score' in analysis:
                    conn_score = analysis['connascence_score']
                    result.scores['connascence'] = conn_score

                    threshold = self.config['quality_gates']['pass_thresholds']['connascence_score']
                    if conn_score < threshold:
                        result.warnings.append(f"High connascence: {conn_score:.2f} < {threshold}")
                        result.suggestions.append("Consider refactoring to reduce coupling")
                    else:
                        result.passed_checks.append(f"Connascence score: {conn_score:.2f}")
            except Exception as e:
                logger.warning(f"Connascence validation failed: {e}")

        # Theater detection
        if 'theater' in self.analyzers:
            try:
                theater_score = self.analyzers['theater'].detect_theater(content)
                result.scores['theater'] = theater_score

                threshold = self.config.get('analyzer_integration', {}).get('theater_detector', {}).get('threshold', 60)
                if theater_score > threshold:
                    result.status = ValidationStatus.PARTIAL
                    result.warnings.append(f"Performance theater detected: score {theater_score} > {threshold}")
                    result.suggestions.append("Add real implementation instead of placeholder code")
                else:
                    result.passed_checks.append(f"Theater detection passed: {theater_score}")
            except Exception as e:
                logger.warning(f"Theater detection failed: {e}")

        return result

    def validate_security(self, file_path: str, content: str) -> ValidationResult:
        """
        Run security validation checks
        """
        result = ValidationResult(status=ValidationStatus.OK)

        # Check for hardcoded secrets
        secret_patterns = [
            r'api[_-]?key\s*=\s*["\'][^"\']+["\']',
            r'password\s*=\s*["\'][^"\']+["\']',
            r'secret\s*=\s*["\'][^"\']+["\']',
            r'token\s*=\s*["\'][^"\']+["\']',
            r'AWS_[A-Z_]+\s*=\s*["\'][^"\']+["\']'
        ]

        for pattern in secret_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                result.status = ValidationStatus.BLOCKED
                result.failed_checks.append("Hardcoded secret detected")
                result.warnings.append("Remove hardcoded credentials immediately")
                return result

        # Enterprise compliance if available
        if 'enterprise' in self.analyzers:
            try:
                import asyncio
                evidence = asyncio.run(
                    self.analyzers['enterprise'].collect_all_evidence(file_path)
                )
                if evidence.get('compliance_score', 0) < 0.95:
                    result.warnings.append("Enterprise compliance issues detected")
                    result.status = ValidationStatus.PARTIAL
            except Exception as e:
                logger.warning(f"Enterprise validation failed: {e}")

        result.passed_checks.append("Security validation passed")
        return result

    def validate_turn(
        self,
        receipt: Receipt,
        artifacts: Dict[str, Any],
        file_contents: Optional[Dict[str, str]] = None
    ) -> ValidationResult:
        """
        Complete turn validation including all checks
        """
        result = ValidationResult(status=ValidationStatus.OK)

        # Validate receipt completeness
        receipt_issues = receipt.validate()
        if receipt_issues:
            result.warnings.extend(receipt_issues)
            result.status = ValidationStatus.PARTIAL

        # Validate each artifact schema
        for artifact_id, artifact_data in artifacts.items():
            if 'type' in artifact_data:
                schema_result = self.validate_schema(
                    artifact_data['data'],
                    artifact_data['type']
                )
                result.warnings.extend(schema_result.warnings)
                result.suggestions.extend(schema_result.suggestions)
                result.placeholders_inserted.extend(schema_result.placeholders_inserted)

                if schema_result.status == ValidationStatus.BLOCKED:
                    result.status = ValidationStatus.BLOCKED
                elif schema_result.status == ValidationStatus.PARTIAL and result.status != ValidationStatus.BLOCKED:
                    result.status = ValidationStatus.PARTIAL

        # Validate file contents if provided
        if file_contents:
            for file_path, content in file_contents.items():
                # Code quality checks
                code_result = self.validate_code_quality(file_path, content)
                result.scores.update(code_result.scores)
                result.warnings.extend(code_result.warnings)
                result.suggestions.extend(code_result.suggestions)

                # Security checks
                security_result = self.validate_security(file_path, content)
                if security_result.status == ValidationStatus.BLOCKED:
                    result.status = ValidationStatus.BLOCKED
                    result.failed_checks.extend(security_result.failed_checks)
                    break

        # Apply quality gates
        gates = self.config.get('quality_gates', {}).get('pass_thresholds', {})
        for metric, threshold in gates.items():
            if metric in result.scores:
                if result.scores[metric] < threshold:
                    result.failed_checks.append(f"{metric}: {result.scores[metric]:.2f} < {threshold}")
                    if result.status == ValidationStatus.OK:
                        result.status = ValidationStatus.PARTIAL

        # Update receipt with validation results
        result.to_receipt_update(receipt)

        return result

    def get_health_status(self) -> Dict[str, str]:
        """
        Get health status of all analyzers
        """
        status = {}

        status['VALIDATOR'] = 'OK'
        status['NASA'] = 'OK' if 'nasa' in self.analyzers else 'DISABLED'
        status['CONNASCENCE'] = 'OK' if 'connascence' in self.analyzers else 'DISABLED'
        status['ENTERPRISE'] = 'OK' if 'enterprise' in self.analyzers else 'DISABLED'
        status['THEATER'] = 'OK' if 'theater' in self.analyzers else 'DISABLED'

        return status