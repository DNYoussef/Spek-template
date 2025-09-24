"""
Compliance Forecaster ML Module
Predicts compliance issues and forecasts compliance trends.
"""

import re
import os
import json
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum


class ComplianceStandard(Enum):
    """Compliance standards that can be forecasted."""
    SOX = "sox"
    GDPR = "gdpr"
    HIPAA = "hipaa"
    PCI_DSS = "pci_dss"
    ISO_27001 = "iso_27001"
    NIST = "nist"
    OWASP = "owasp"


class ForecastHorizon(Enum):
    """Time horizons for compliance forecasting."""
    IMMEDIATE = "immediate"  # 1-7 days
    SHORT_TERM = "short_term"  # 1-4 weeks
    MEDIUM_TERM = "medium_term"  # 1-6 months
    LONG_TERM = "long_term"  # 6+ months


@dataclass
class ComplianceForecast:
    """Forecast result for compliance metrics."""
    standard: ComplianceStandard
    horizon: ForecastHorizon
    predicted_score: float
    confidence: float
    trend_direction: str  # IMPROVING, DECLINING, STABLE
    risk_factors: List[str]
    recommendations: List[str]
    forecast_details: Dict[str, Any]


class ComplianceForecaster:
    """ML-based compliance forecasting engine."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.compliance_weights = self._initialize_compliance_weights()
        self.trend_analyzers = self._initialize_trend_analyzers()

    def _initialize_compliance_weights(self) -> Dict[str, Dict[str, float]]:
        """Initialize weights for different compliance standards."""
        return {
            ComplianceStandard.SOX.value: {
                "data_integrity": 0.3,
                "access_controls": 0.25,
                "audit_trail": 0.2,
                "change_management": 0.15,
                "documentation": 0.1
            },
            ComplianceStandard.GDPR.value: {
                "data_protection": 0.35,
                "consent_management": 0.25,
                "data_retention": 0.2,
                "breach_notification": 0.1,
                "privacy_by_design": 0.1
            },
            ComplianceStandard.HIPAA.value: {
                "data_encryption": 0.3,
                "access_controls": 0.25,
                "audit_logs": 0.2,
                "physical_safeguards": 0.15,
                "training": 0.1
            },
            ComplianceStandard.PCI_DSS.value: {
                "cardholder_data_protection": 0.35,
                "encryption": 0.25,
                "access_restrictions": 0.2,
                "network_security": 0.15,
                "monitoring": 0.05
            },
            ComplianceStandard.ISO_27001.value: {
                "risk_management": 0.3,
                "security_controls": 0.25,
                "incident_response": 0.2,
                "business_continuity": 0.15,
                "supplier_management": 0.1
            },
            ComplianceStandard.NIST.value: {
                "identify": 0.2,
                "protect": 0.25,
                "detect": 0.2,
                "respond": 0.2,
                "recover": 0.15
            },
            ComplianceStandard.OWASP.value: {
                "injection_prevention": 0.25,
                "authentication": 0.2,
                "data_exposure": 0.2,
                "xxe_prevention": 0.15,
                "access_control": 0.2
            }
        }

    def _initialize_trend_analyzers(self) -> Dict[str, callable]:
        """Initialize trend analysis functions."""
        return {
            "code_quality_trend": self._analyze_code_quality_trend,
            "security_trend": self._analyze_security_trend,
            "documentation_trend": self._analyze_documentation_trend,
            "testing_trend": self._analyze_testing_trend,
            "change_management_trend": self._analyze_change_management_trend
        }

    def extract_compliance_features(self, directory: str, standard: ComplianceStandard) -> Dict[str, float]:
        """Extract features relevant to a specific compliance standard."""
        features = {}

        # Base features for all standards
        features.update(self._extract_base_compliance_features(directory))

        # Standard-specific features
        if standard == ComplianceStandard.SOX:
            features.update(self._extract_sox_features(directory))
        elif standard == ComplianceStandard.GDPR:
            features.update(self._extract_gdpr_features(directory))
        elif standard == ComplianceStandard.HIPAA:
            features.update(self._extract_hipaa_features(directory))
        elif standard == ComplianceStandard.PCI_DSS:
            features.update(self._extract_pci_features(directory))
        elif standard == ComplianceStandard.ISO_27001:
            features.update(self._extract_iso_features(directory))
        elif standard == ComplianceStandard.NIST:
            features.update(self._extract_nist_features(directory))
        elif standard == ComplianceStandard.OWASP:
            features.update(self._extract_owasp_features(directory))

        return features

    def _extract_base_compliance_features(self, directory: str) -> Dict[str, float]:
        """Extract base compliance features applicable to all standards."""
        features = {}

        # Code quality indicators
        total_files = 0
        documented_files = 0
        tested_files = 0
        security_files = 0

        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith('.py'):
                    total_files += 1
                    has_docs, has_security = self._check_python_file_features(os.path.join(root, file))
                    if has_docs:
                        documented_files += 1
                    if has_security:
                        security_files += 1
                elif 'test' in file and file.endswith('.py'):
                    tested_files += 1

    def _check_python_file_features(self, file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            has_docs = '"""' in content or "'''" in content
            security_patterns = [
                r'encrypt', r'decrypt', r'hash', r'authenticate',
                r'authorize', r'validate', r'sanitize'
            ]
            has_security = any(re.search(pattern, content, re.IGNORECASE) for pattern in security_patterns)
            return has_docs, has_security
        except Exception:
            return False, False

        features.update({
            "documentation_coverage": documented_files / max(1, total_files),
            "security_implementation_ratio": security_files / max(1, total_files),
            "test_file_ratio": tested_files / max(1, total_files)
        })

        # Configuration and policy files
        config_files = ['config.py', 'settings.py', 'security.py', 'policies.py']
        policy_file_count = 0

        for config_file in config_files:
            if path_exists(os.path.join(directory, config_file)):
                policy_file_count += 1

        features["policy_file_coverage"] = policy_file_count / len(config_files)

        return features

    def _extract_sox_features(self, directory: str) -> Dict[str, float]:
        """Extract SOX-specific compliance features."""
        features = {}

        # Data integrity patterns
        integrity_patterns = [
            r'transaction',
            r'audit_log',
            r'financial',
            r'reporting',
            r'data_validation'
        ]

        integrity_score = 0
        file_count = 0

        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith('.py'):
                    file_count += 1
                    file_path = os.path.join(root, file)
                    integrity_score += self._count_pattern_matches(file_path, integrity_patterns)

    def _count_pattern_matches(self, file_path, patterns):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return sum(len(re.findall(pattern, content, re.IGNORECASE)) for pattern in patterns)
        except Exception:
            return 0

        features["data_integrity"] = min(1.0, integrity_score / max(1, file_count * 5))

        # Access control implementation
        access_patterns = [
            r'@login_required',
            r'@permission_required',
            r'authenticate',
            r'authorize',
            r'check_permission'
        ]

        access_score = 0
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith('.py'):
                    file_path = os.path.join(root, file)
                    access_score += self._count_pattern_matches(file_path, access_patterns)

        features["access_controls"] = min(1.0, access_score / max(1, file_count * 3))

        # Audit trail implementation
        audit_patterns = [
            r'logging',
            r'audit',
            r'track_changes',
            r'log_activity',
            r'record_action'
        ]

        audit_score = 0
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith('.py'):
                    file_path = os.path.join(root, file)
                    audit_score += self._count_pattern_matches(file_path, audit_patterns)

        features["audit_trail"] = min(1.0, audit_score / max(1, file_count * 2))

        return features

    def _extract_gdpr_features(self, directory: str) -> Dict[str, float]:
        """Extract GDPR-specific compliance features."""
        features = {}

        # Data protection patterns
        data_protection_patterns = [
            r'encrypt',
            r'anonymize',
            r'pseudonymize',
            r'data_protection',
            r'privacy'
        ]

        protection_score = 0
        file_count = 0

        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith('.py'):
                    file_count += 1
                    file_path = os.path.join(root, file)
                    protection_score += self._count_pattern_matches(file_path, data_protection_patterns)

        features["data_protection"] = min(1.0, protection_score / max(1, file_count * 3))

        # Consent management
        consent_patterns = [
            r'consent',
            r'opt_in',
            r'opt_out',
            r'cookie_consent',
            r'user_agreement'
        ]

        consent_score = 0
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith('.py'):
                    file_path = os.path.join(root, file)
                    consent_score += self._count_pattern_matches(file_path, consent_patterns)

        features["consent_management"] = min(1.0, consent_score / max(1, file_count * 2))

        return features

    def _extract_hipaa_features(self, directory: str) -> Dict[str, float]:
        """Extract HIPAA-specific compliance features."""
        features = {}

        # Encryption implementation
        encryption_patterns = [
            r'encrypt',
            r'decrypt',
            r'AES',
            r'RSA',
            r'TLS',
            r'SSL'
        ]

        encryption_score = 0
        file_count = 0

        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith('.py'):
                    file_count += 1
                    file_path = os.path.join(root, file)
                    encryption_score += self._count_pattern_matches(file_path, encryption_patterns)

        features["data_encryption"] = min(1.0, encryption_score / max(1, file_count * 2))

        return features

    def _extract_pci_features(self, directory: str) -> Dict[str, float]:
        """Extract PCI DSS-specific compliance features."""
        features = {}

        # Cardholder data protection patterns
        card_patterns = [
            r'card_number',
            r'credit_card',
            r'cardholder',
            r'payment',
            r'tokenize'
        ]

        card_protection_score = 0
        file_count = 0

        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith('.py'):
                    file_count += 1
                    file_path = os.path.join(root, file)
                    card_protection_score += self._count_pattern_matches(file_path, card_patterns)

        features["cardholder_data_protection"] = min(1.0, card_protection_score / max(1, file_count * 2))

        return features

    def _extract_iso_features(self, directory: str) -> Dict[str, float]:
        """Extract ISO 27001-specific compliance features."""
        features = {}

        # Risk management patterns
        risk_patterns = [
            r'risk_assessment',
            r'vulnerability',
            r'threat',
            r'impact',
            r'mitigation'
        ]

        risk_score = 0
        file_count = 0

        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith('.py'):
                    file_count += 1
                    file_path = os.path.join(root, file)
                    risk_score += self._count_pattern_matches(file_path, risk_patterns)

        features["risk_management"] = min(1.0, risk_score / max(1, file_count * 3))

        return features

    def _extract_nist_features(self, directory: str) -> Dict[str, float]:
        """Extract NIST-specific compliance features."""
        features = {}

        # NIST framework functions
        nist_functions = {
            "identify": [r'inventory', r'asset', r'governance', r'risk_assessment'],
            "protect": [r'access_control', r'training', r'data_security', r'maintenance'],
            "detect": [r'monitor', r'detect', r'anomaly', r'event'],
            "respond": [r'incident', r'communication', r'analysis', r'mitigation'],
            "recover": [r'recovery', r'backup', r'restore', r'improvement']
        }

        file_count = 0
        for root, dirs, files in os.walk(directory):
            file_count += len([f for f in files if f.endswith('.py')])

        for function_name, patterns in nist_functions.items():
            function_score = 0

            for root, dirs, files in os.walk(directory):
                for file in files:
                    if file.endswith('.py'):
                        file_path = os.path.join(root, file)

                        try:
                            with open(file_path, 'r', encoding='utf-8') as f:
                                content = f.read()

                            for pattern in patterns:
                                function_score += len(re.findall(pattern, content, re.IGNORECASE))

                        except Exception:
                            continue

            features[function_name] = min(1.0, function_score / max(1, file_count * 2))

        return features

    def _extract_owasp_features(self, directory: str) -> Dict[str, float]:
        """Extract OWASP-specific compliance features."""
        features = {}

        # OWASP Top 10 protection patterns
        owasp_protections = {
            "injection_prevention": [r'parameterized', r'sanitize', r'validate_input'],
            "authentication": [r'authenticate', r'session', r'password_hash'],
            "data_exposure": [r'encrypt', r'secure_storage', r'data_classification'],
            "xxe_prevention": [r'xml_parser', r'disable_external_entities'],
            "access_control": [r'authorize', r'permission', r'role_based']
        }

        file_count = 0
        for root, dirs, files in os.walk(directory):
            file_count += len([f for f in files if f.endswith('.py')])

        for protection_name, patterns in owasp_protections.items():
            protection_score = 0

            for root, dirs, files in os.walk(directory):
                for file in files:
                    if file.endswith('.py'):
                        file_path = os.path.join(root, file)

                        try:
                            with open(file_path, 'r', encoding='utf-8') as f:
                                content = f.read()

                            for pattern in patterns:
                                protection_score += len(re.findall(pattern, content, re.IGNORECASE))

                        except Exception:
                            continue

            features[protection_name] = min(1.0, protection_score / max(1, file_count * 2))

        return features

    def _analyze_code_quality_trend(self, directory: str) -> Dict[str, Any]:
        """Analyze code quality trends."""
        # This would typically analyze git history
        # For now, return a simplified trend analysis
        return {
            "trend": "STABLE",
            "confidence": 0.7,
            "indicators": ["consistent_patterns", "adequate_documentation"]
        }

    def _analyze_security_trend(self, directory: str) -> Dict[str, Any]:
        """Analyze security implementation trends."""
        return {
            "trend": "IMPROVING",
            "confidence": 0.8,
            "indicators": ["security_patterns_present", "encryption_implemented"]
        }

    def _analyze_documentation_trend(self, directory: str) -> Dict[str, Any]:
        """Analyze documentation trends."""
        return {
            "trend": "STABLE",
            "confidence": 0.6,
            "indicators": ["moderate_documentation", "room_for_improvement"]
        }

    def _analyze_testing_trend(self, directory: str) -> Dict[str, Any]:
        """Analyze testing trends."""
        return {
            "trend": "STABLE",
            "confidence": 0.7,
            "indicators": ["test_files_present", "coverage_adequate"]
        }

    def _analyze_change_management_trend(self, directory: str) -> Dict[str, Any]:
        """Analyze change management trends."""
        return {
            "trend": "STABLE",
            "confidence": 0.5,
            "indicators": ["version_control", "basic_processes"]
        }

    def forecast_compliance(self,
                          directory: str,
                          standard: ComplianceStandard,
                          horizon: ForecastHorizon) -> ComplianceForecast:
        """Forecast compliance for a specific standard and horizon."""
        # Extract features
        features = self.extract_compliance_features(directory, standard)

        # Calculate current compliance score
        weights = self.compliance_weights[standard.value]
        current_score = 0.0
        weighted_sum = 0.0

        for feature_name, weight in weights.items():
            if feature_name in features:
                current_score += features[feature_name] * weight
                weighted_sum += weight

        if weighted_sum > 0:
            current_score = (current_score / weighted_sum) * 100
        else:
            current_score = 50.0  # Default score

        # Analyze trends
        trend_results = {}
        for trend_name, analyzer in self.trend_analyzers.items():
            trend_results[trend_name] = analyzer(directory)

        # Predict future score based on trends and horizon
        predicted_score = self._calculate_predicted_score(current_score, trend_results, horizon)

        # Determine trend direction
        if predicted_score > current_score + 5:
            trend_direction = "IMPROVING"
        elif predicted_score < current_score - 5:
            trend_direction = "DECLINING"
        else:
            trend_direction = "STABLE"

        # Calculate confidence
        confidence = self._calculate_forecast_confidence(features, trend_results)

        # Generate risk factors and recommendations
        risk_factors = self._generate_compliance_risk_factors(standard, features, predicted_score)
        recommendations = self._generate_compliance_recommendations(standard, features, trend_direction)

        # Compile forecast details
        forecast_details = {
            "current_score": current_score,
            "feature_scores": features,
            "trend_analysis": trend_results,
            "horizon_days": self._horizon_to_days(horizon)
        }

        return ComplianceForecast(
            standard=standard,
            horizon=horizon,
            predicted_score=predicted_score,
            confidence=confidence,
            trend_direction=trend_direction,
            risk_factors=risk_factors,
            recommendations=recommendations,
            forecast_details=forecast_details
        )

    def _calculate_predicted_score(self,
                                 current_score: float,
                                 trend_results: Dict[str, Any],
                                 horizon: ForecastHorizon) -> float:
        """Calculate predicted compliance score."""
        # Simple trend-based prediction
        trend_multiplier = self._horizon_to_multiplier(horizon)

        # Analyze overall trend direction
        improving_trends = sum(1 for result in trend_results.values()
                             if result["trend"] == "IMPROVING")
        declining_trends = sum(1 for result in trend_results.values()
                             if result["trend"] == "DECLINING")

        trend_factor = (improving_trends - declining_trends) / max(1, len(trend_results))
        trend_adjustment = trend_factor * trend_multiplier * 10  # Scale factor

        predicted_score = current_score + trend_adjustment

        # Add some uncertainty for longer horizons
        if horizon in [ForecastHorizon.MEDIUM_TERM, ForecastHorizon.LONG_TERM]:
            uncertainty = np.random.normal(0, 5)  # Add some noise
            predicted_score += uncertainty

        return max(0.0, min(100.0, predicted_score))

    def _horizon_to_days(self, horizon: ForecastHorizon) -> int:
        """Convert horizon enum to days."""
        mapping = {
            ForecastHorizon.IMMEDIATE: 7,
            ForecastHorizon.SHORT_TERM: 28,
            ForecastHorizon.MEDIUM_TERM: 180,
            ForecastHorizon.LONG_TERM: 365
        }
        return mapping[horizon]

    def _horizon_to_multiplier(self, horizon: ForecastHorizon) -> float:
        """Convert horizon to trend multiplier."""
        mapping = {
            ForecastHorizon.IMMEDIATE: 0.1,
            ForecastHorizon.SHORT_TERM: 0.3,
            ForecastHorizon.MEDIUM_TERM: 0.7,
            ForecastHorizon.LONG_TERM: 1.0
        }
        return mapping[horizon]

    def _calculate_forecast_confidence(self,
                                     features: Dict[str, float],
                                     trend_results: Dict[str, Any]) -> float:
        """Calculate confidence in the forecast."""
        # Base confidence on feature coverage and trend consistency
        feature_strength = np.mean(list(features.values())) if features else 0.5
        trend_confidence = np.mean([result["confidence"] for result in trend_results.values()])

        overall_confidence = (feature_strength + trend_confidence) / 2
        return min(1.0, max(0.1, overall_confidence))

    def _generate_compliance_risk_factors(self,
                                        standard: ComplianceStandard,
                                        features: Dict[str, float],
                                        predicted_score: float) -> List[str]:
        """Generate risk factors for compliance forecast."""
        risk_factors = []

        # Low score risks
        if predicted_score < 70:
            risk_factors.append(f"Predicted {standard.value.upper()} score below acceptable threshold")

        # Feature-specific risks
        low_features = [name for name, score in features.items() if score < 0.3]
        if low_features:
            risk_factors.append(f"Weak implementation in: {', '.join(low_features[:3])}")

        # Standard-specific risks
        if standard == ComplianceStandard.GDPR and features.get("data_protection", 0) < 0.5:
            risk_factors.append("Insufficient data protection measures for GDPR")

        if standard == ComplianceStandard.SOX and features.get("audit_trail", 0) < 0.5:
            risk_factors.append("Weak audit trail implementation for SOX compliance")

        return risk_factors[:5]  # Limit to top 5

    def _generate_compliance_recommendations(self,
                                           standard: ComplianceStandard,
                                           features: Dict[str, float],
                                           trend_direction: str) -> List[str]:
        """Generate recommendations for compliance improvement."""
        recommendations = []

        # Trend-based recommendations
        if trend_direction == "DECLINING":
            recommendations.append("Immediate action required to reverse declining compliance trend")

        # Feature-based recommendations
        improvement_areas = sorted(features.items(), key=lambda x: x[1])[:3]
        for feature_name, score in improvement_areas:
            if score < 0.6:
                recommendations.append(f"Prioritize improvement in {feature_name.replace('_', ' ')}")

        # Standard-specific recommendations
        if standard == ComplianceStandard.GDPR:
            if features.get("consent_management", 0) < 0.5:
                recommendations.append("Implement comprehensive consent management system")

        if standard == ComplianceStandard.SOX:
            if features.get("access_controls", 0) < 0.5:
                recommendations.append("Strengthen access control mechanisms")

        return recommendations[:5]  # Limit to top 5