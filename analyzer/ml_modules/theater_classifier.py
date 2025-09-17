from lib.shared.utilities import path_exists
"""
Theater Classifier ML Module
Uses machine learning to classify and predict theater patterns.
"""

import re
import ast
import os
import json
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class TheaterType(Enum):
    """Types of theater that can be classified."""
    TEST_GAMING = "test_gaming"
    METRICS_MANIPULATION = "metrics_manipulation"
    DOCUMENTATION_FACADE = "documentation_facade"
    QUALITY_THEATER = "quality_theater"
    SECURITY_WASHING = "security_washing"
    PERFORMANCE_PRETENSE = "performance_pretense"


@dataclass
class TheaterPrediction:
    """Prediction result for theater classification."""
    theater_type: TheaterType
    probability: float
    confidence: float
    evidence_features: Dict[str, float]
    risk_factors: List[str]
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL


class TheaterClassifier:
    """ML-based theater pattern classifier."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.feature_extractors = self._initialize_feature_extractors()
        self.classification_thresholds = self._initialize_thresholds()

    def _initialize_feature_extractors(self) -> Dict[str, callable]:
        """Initialize feature extraction functions for each theater type."""
        return {
            TheaterType.TEST_GAMING: self._extract_test_gaming_features,
            TheaterType.METRICS_MANIPULATION: self._extract_metrics_manipulation_features,
            TheaterType.DOCUMENTATION_FACADE: self._extract_documentation_facade_features,
            TheaterType.QUALITY_THEATER: self._extract_quality_theater_features,
            TheaterType.SECURITY_WASHING: self._extract_security_washing_features,
            TheaterType.PERFORMANCE_PRETENSE: self._extract_performance_pretense_features,
        }

    def _initialize_thresholds(self) -> Dict[TheaterType, Dict[str, float]]:
        """Initialize classification thresholds for each theater type."""
        return {
            TheaterType.TEST_GAMING: {
                "low": 0.3,
                "medium": 0.6,
                "high": 0.8,
                "critical": 0.9
            },
            TheaterType.METRICS_MANIPULATION: {
                "low": 0.4,
                "medium": 0.7,
                "high": 0.85,
                "critical": 0.95
            },
            TheaterType.DOCUMENTATION_FACADE: {
                "low": 0.2,
                "medium": 0.5,
                "high": 0.7,
                "critical": 0.85
            },
            TheaterType.QUALITY_THEATER: {
                "low": 0.3,
                "medium": 0.6,
                "high": 0.8,
                "critical": 0.9
            },
            TheaterType.SECURITY_WASHING: {
                "low": 0.4,
                "medium": 0.7,
                "high": 0.9,
                "critical": 0.95
            },
            TheaterType.PERFORMANCE_PRETENSE: {
                "low": 0.3,
                "medium": 0.6,
                "high": 0.8,
                "critical": 0.9
            }
        }

    def _extract_test_gaming_features(self, content: str, file_path: str) -> Dict[str, float]:
        """Extract features related to test gaming."""
        features = {}

        # Parse content for test analysis
        try:
            tree = ast.parse(content)
            test_functions = [node for node in ast.walk(tree)
                            if isinstance(node, ast.FunctionDef) and node.name.startswith('test_')]

            if test_functions:
                # Empty test ratio
                empty_tests = sum(1 for func in test_functions
                                if len(func.body) == 1 and isinstance(func.body[0], ast.Pass))
                features["empty_test_ratio"] = empty_tests / len(test_functions)

                # Trivial assertion ratio
                trivial_assertions = 0
                total_assertions = 0

                for func in test_functions:
                    for node in ast.walk(func):
                        if isinstance(node, ast.Assert):
                            total_assertions += 1
                            if (isinstance(node.test, ast.Constant) and node.test.value is True) or \
                               (isinstance(node.test, ast.Compare) and
                                isinstance(node.test.left, ast.Constant) and
                                isinstance(node.test.comparators[0], ast.Constant) and
                                node.test.left.value == node.test.comparators[0].value):
                                trivial_assertions += 1

                features["trivial_assertion_ratio"] = trivial_assertions / max(1, total_assertions)
                features["no_assertion_ratio"] = sum(1 for func in test_functions
                                                   if not any(isinstance(node, ast.Assert)
                                                            for node in ast.walk(func))) / len(test_functions)
            else:
                features.update({
                    "empty_test_ratio": 0,
                    "trivial_assertion_ratio": 0,
                    "no_assertion_ratio": 0
                })

        except SyntaxError:
            # Fallback to regex analysis
            test_pattern_count = len(re.findall(r'def\s+test_\w+', content))
            empty_test_count = len(re.findall(r'def\s+test_\w+[^:]*:\s*pass', content, re.MULTILINE))
            features["empty_test_ratio"] = empty_test_count / max(1, test_pattern_count)

        # Test gaming indicators
        gaming_patterns = [
            (r'assert\s+True', "always_true_assertions"),
            (r'assert\s+1\s*==\s*1', "tautology_assertions"),
            (r'@pytest\.mark\.skip', "skipped_tests"),
            (r'# TODO.*test', "todo_tests"),
            (r'time\.sleep\(\d+\)', "sleep_in_tests")
        ]

        for pattern, feature_name in gaming_patterns:
            count = len(re.findall(pattern, content, re.IGNORECASE))
            features[feature_name] = min(1.0, count / 10)  # Normalize

        return features

    def _extract_metrics_manipulation_features(self, content: str, file_path: str) -> Dict[str, float]:
        """Extract features related to metrics manipulation."""
        features = {}

        # Hardcoded metrics patterns
        hardcoded_patterns = [
            (r'coverage\s*=\s*100', "hardcoded_coverage"),
            (r'quality\s*=\s*["\']?perfect["\']?', "hardcoded_quality"),
            (r'score\s*=\s*["\']?A\+?["\']?', "hardcoded_score"),
            (r'bugs\s*=\s*0', "hardcoded_zero_bugs"),
            (r'issues\s*=\s*\[\s*\]', "hardcoded_empty_issues"),
            (r'complexity\s*=\s*1', "hardcoded_low_complexity")
        ]

        for pattern, feature_name in hardcoded_patterns:
            count = len(re.findall(pattern, content, re.IGNORECASE))
            features[feature_name] = min(1.0, count / 5)  # Normalize

        # Metric gaming indicators
        features["perfect_values_count"] = sum(features.values())

        # Check for metric calculation bypasses
        bypass_patterns = [
            r'skip_metric_calculation',
            r'override_quality_check',
            r'force_pass\s*=\s*True',
            r'disable_quality_gate'
        ]

        bypass_count = 0
        for pattern in bypass_patterns:
            bypass_count += len(re.findall(pattern, content, re.IGNORECASE))

        features["metric_bypass_indicators"] = min(1.0, bypass_count / 3)

        return features

    def _extract_documentation_facade_features(self, content: str, file_path: str) -> Dict[str, float]:
        """Extract features related to documentation facades."""
        features = {}

        # Facade documentation patterns
        facade_patterns = [
            (r'# TODO:?\s*add\s+doc', "todo_documentation"),
            (r'# This function does something', "meaningless_comments"),
            (r'# Magic happens here', "magic_comments"),
            (r'\"\"\"TODO.*\"\"\"', "todo_docstrings"),
            (r'# Implementation details', "vague_comments"),
            (r'# Enterprise grade', "buzzword_comments")
        ]

        for pattern, feature_name in facade_patterns:
            count = len(re.findall(pattern, content, re.IGNORECASE))
            features[feature_name] = min(1.0, count / 5)

        # Comment quality analysis
        lines = content.split('\n')
        comment_lines = [line for line in lines if line.strip().startswith('#')]
        total_lines = len([line for line in lines if line.strip()])

        if comment_lines:
            # Calculate comment meaningfulness
            meaningful_comments = 0
            for comment in comment_lines:
                # Simple heuristics for meaningful comments
                words = comment.split()
                if len(words) > 5 and not any(filler in comment.lower()
                                            for filler in ['todo', 'fixme', 'magic', 'something']):
                    meaningful_comments += 1

            features["meaningful_comment_ratio"] = meaningful_comments / len(comment_lines)
            features["comment_density"] = len(comment_lines) / max(1, total_lines)
        else:
            features.update({
                "meaningful_comment_ratio": 0,
                "comment_density": 0
            })

        # Buzzword density
        buzzwords = [
            'enterprise', 'synergy', 'leverage', 'paradigm', 'holistic',
            'scalable', 'robust', 'cutting-edge', 'best-in-class', 'world-class',
            'revolutionary', 'innovative', 'next-generation', 'state-of-the-art'
        ]

        buzzword_count = 0
        for word in buzzwords:
            buzzword_count += len(re.findall(rf'\b{word}\b', content, re.IGNORECASE))

        features["buzzword_density"] = min(1.0, buzzword_count / 20)

        return features

    def _extract_quality_theater_features(self, content: str, file_path: str) -> Dict[str, float]:
        """Extract features related to quality theater."""
        features = {}

        # Quality facade patterns
        quality_patterns = [
            (r'# Quality improved', "quality_claims"),
            (r'# Fixed all issues', "fixed_all_claims"),
            (r'# Perfect code', "perfect_code_claims"),
            (r'# No bugs', "no_bug_claims"),
            (r'# 100% tested', "hundred_percent_claims"),
            (r'# Enterprise quality', "enterprise_quality_claims")
        ]

        for pattern, feature_name in quality_patterns:
            count = len(re.findall(pattern, content, re.IGNORECASE))
            features[feature_name] = min(1.0, count / 3)

        # Check for quality bypasses
        bypass_patterns = [
            r'disable_linting',
            r'# pylint: disable-all',
            r'# noqa',
            r'skip_quality_check',
            r'quality_override\s*=\s*True'
        ]

        bypass_count = 0
        for pattern in bypass_patterns:
            bypass_count += len(re.findall(pattern, content, re.IGNORECASE))

        features["quality_bypass_count"] = min(1.0, bypass_count / 5)

        # NotImplementedError as quality placeholder
        not_implemented_count = len(re.findall(r'raise\s+NotImplementedError', content))
        features["not_implemented_ratio"] = min(1.0, not_implemented_count / 10)

        return features

    def _extract_security_washing_features(self, content: str, file_path: str) -> Dict[str, float]:
        """Extract features related to security washing."""
        features = {}

        # Security washing patterns
        washing_patterns = [
            (r'# SECURITY:\s*PASSED', "fake_security_status"),
            (r'security_check\s*=\s*True', "bypassed_security"),
            (r'# Secure by design', "security_claims"),
            (r'# GDPR compliant', "compliance_claims"),
            (r'# Penetration tested', "testing_claims"),
            (r'# Zero vulnerabilities', "zero_vuln_claims")
        ]

        for pattern, feature_name in washing_patterns:
            count = len(re.findall(pattern, content, re.IGNORECASE))
            features[feature_name] = min(1.0, count / 2)

        # Actual security implementation check
        security_implementations = [
            r'validate\(',
            r'sanitize\(',
            r'escape\(',
            r'csrf_token',
            r'encrypt\(',
            r'hash\(',
            r'authenticate\('
        ]

        security_impl_count = 0
        for pattern in security_implementations:
            security_impl_count += len(re.findall(pattern, content, re.IGNORECASE))

        features["actual_security_implementation"] = min(1.0, security_impl_count / 10)

        # Security vs claims ratio
        total_claims = sum(features[key] for key in features if key != "actual_security_implementation")
        if total_claims > 0:
            features["security_implementation_ratio"] = features["actual_security_implementation"] / total_claims
        else:
            features["security_implementation_ratio"] = 1.0 if features["actual_security_implementation"] > 0 else 0.0

        return features

    def _extract_performance_pretense_features(self, content: str, file_path: str) -> Dict[str, float]:
        """Extract features related to performance pretense."""
        features = {}

        # Performance pretense patterns
        pretense_patterns = [
            (r'# Optimized for performance', "performance_claims"),
            (r'# Lightning fast', "speed_claims"),
            (r'# Zero latency', "latency_claims"),
            (r'# Blazing fast', "blazing_claims"),
            (r'# Performance improved by \d+%', "percentage_claims"),
            (r'# Microsecond response time', "micro_claims")
        ]

        for pattern, feature_name in pretense_patterns:
            count = len(re.findall(pattern, content, re.IGNORECASE))
            features[feature_name] = min(1.0, count / 2)

        # Actual performance code
        performance_implementations = [
            r'@lru_cache',
            r'@cache',
            r'memoize',
            r'profile',
            r'timeit',
            r'perf_counter',
            r'optimization',
            r'concurrent\.futures',
            r'asyncio\.',
            r'threading\.'
        ]

        perf_impl_count = 0
        for pattern in performance_implementations:
            perf_impl_count += len(re.findall(pattern, content, re.IGNORECASE))

        features["actual_performance_implementation"] = min(1.0, perf_impl_count / 5)

        # Anti-patterns that hurt performance
        anti_patterns = [
            r'time\.sleep\(',
            r'while\s+True:',
            r'for.*in.*for.*in',  # Nested loops
            r'\.sort\(\).*\.sort\(\)',  # Multiple sorts
        ]

        anti_pattern_count = 0
        for pattern in anti_patterns:
            anti_pattern_count += len(re.findall(pattern, content))

        features["performance_anti_patterns"] = min(1.0, anti_pattern_count / 3)

        return features

    def classify_theater_type(self, file_path: str, theater_type: TheaterType) -> TheaterPrediction:
        """Classify a specific type of theater in a file."""
        if not path_exists(file_path):
            return TheaterPrediction(
                theater_type=theater_type,
                probability=0.0,
                confidence=0.0,
                evidence_features={},
                risk_factors=[],
                severity="LOW"
            )

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception:
            return TheaterPrediction(
                theater_type=theater_type,
                probability=0.0,
                confidence=0.0,
                evidence_features={},
                risk_factors=[],
                severity="LOW"
            )

        # Extract features for this theater type
        extractor = self.feature_extractors[theater_type]
        features = extractor(content, file_path)

        # Calculate probability using simple weighted sum
        probability = np.mean(list(features.values())) if features else 0.0

        # Adjust probability based on feature patterns
        probability = self._adjust_probability(theater_type, features, probability)

        # Calculate confidence based on feature strength
        confidence = self._calculate_confidence(features)

        # Determine severity
        thresholds = self.classification_thresholds[theater_type]
        severity = self._determine_severity(probability, thresholds)

        # Generate risk factors
        risk_factors = self._generate_risk_factors(theater_type, features)

        return TheaterPrediction(
            theater_type=theater_type,
            probability=probability,
            confidence=confidence,
            evidence_features=features,
            risk_factors=risk_factors,
            severity=severity
        )

    def _adjust_probability(self, theater_type: TheaterType, features: Dict[str, float], base_prob: float) -> float:
        """Adjust probability based on theater type specific patterns."""
        adjusted_prob = base_prob

        if theater_type == TheaterType.TEST_GAMING:
            # High weight for empty tests and trivial assertions
            if features.get("empty_test_ratio", 0) > 0.5:
                adjusted_prob += 0.3
            if features.get("trivial_assertion_ratio", 0) > 0.3:
                adjusted_prob += 0.2

        elif theater_type == TheaterType.METRICS_MANIPULATION:
            # High weight for hardcoded perfect values
            if features.get("perfect_values_count", 0) > 0.5:
                adjusted_prob += 0.4

        elif theater_type == TheaterType.SECURITY_WASHING:
            # Penalty for actual security implementation
            impl_ratio = features.get("security_implementation_ratio", 0)
            if impl_ratio < 0.3:
                adjusted_prob += 0.2
            elif impl_ratio > 0.7:
                adjusted_prob -= 0.2

        return min(1.0, max(0.0, adjusted_prob))

    def _calculate_confidence(self, features: Dict[str, float]) -> float:
        """Calculate confidence in the classification."""
        if not features:
            return 0.0

        # Confidence based on feature variance and strength
        feature_values = list(features.values())
        feature_strength = np.mean(feature_values)
        feature_variance = np.var(feature_values) if len(feature_values) > 1 else 0

        # Higher confidence for stronger, more consistent features
        confidence = feature_strength * (1 - feature_variance * 0.5)
        return min(1.0, max(0.1, confidence))

    def _determine_severity(self, probability: float, thresholds: Dict[str, float]) -> str:
        """Determine severity level based on probability and thresholds."""
        if probability >= thresholds["critical"]:
            return "CRITICAL"
        elif probability >= thresholds["high"]:
            return "HIGH"
        elif probability >= thresholds["medium"]:
            return "MEDIUM"
        else:
            return "LOW"

    def _generate_risk_factors(self, theater_type: TheaterType, features: Dict[str, float]) -> List[str]:
        """Generate risk factors based on detected features."""
        risk_factors = []

        for feature_name, value in features.items():
            if value > 0.5:  # Significant feature
                risk_factor = self._feature_to_risk_factor(theater_type, feature_name, value)
                if risk_factor:
                    risk_factors.append(risk_factor)

        return risk_factors[:5]  # Limit to top 5 risk factors

    def _feature_to_risk_factor(self, theater_type: TheaterType, feature_name: str, value: float) -> Optional[str]:
        """Convert feature to human-readable risk factor."""
        risk_mappings = {
            "empty_test_ratio": f"High ratio of empty tests ({value:.1%})",
            "trivial_assertion_ratio": f"Many trivial assertions ({value:.1%})",
            "hardcoded_coverage": f"Hardcoded coverage values detected",
            "buzzword_density": f"High buzzword density in comments ({value:.1%})",
            "quality_bypass_count": f"Quality checks being bypassed",
            "fake_security_status": f"Hardcoded security status indicators",
            "performance_anti_patterns": f"Performance anti-patterns detected",
        }

        return risk_mappings.get(feature_name)

    def classify_all_theater_types(self, file_path: str) -> List[TheaterPrediction]:
        """Classify all theater types for a file."""
        predictions = []

        for theater_type in TheaterType:
            prediction = self.classify_theater_type(file_path, theater_type)
            predictions.append(prediction)

        # Sort by probability (highest first)
        predictions.sort(key=lambda p: p.probability, reverse=True)

        return predictions

    def analyze_directory_theater(self, directory: str) -> Dict[str, Any]:
        """Analyze theater patterns across an entire directory."""
        results = {
            "total_files": 0,
            "theater_files": 0,
            "theater_by_type": {t.value: 0 for t in TheaterType},
            "high_risk_files": [],
            "summary": {}
        }

        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith('.py'):
                    file_path = os.path.join(root, file)
                    results["total_files"] += 1

                    predictions = self.classify_all_theater_types(file_path)

                    # Check if file has significant theater patterns
                    has_theater = any(p.probability > 0.5 for p in predictions)
                    if has_theater:
                        results["theater_files"] += 1

                    # Count by type
                    for prediction in predictions:
                        if prediction.probability > 0.5:
                            results["theater_by_type"][prediction.theater_type.value] += 1

                    # Identify high-risk files
                    critical_predictions = [p for p in predictions if p.severity == "CRITICAL"]
                    if critical_predictions:
                        results["high_risk_files"].append({
                            "file": file_path,
                            "critical_theaters": [p.theater_type.value for p in critical_predictions]
                        })

        # Generate summary
        results["summary"] = {
            "theater_ratio": results["theater_files"] / max(1, results["total_files"]),
            "most_common_theater": max(results["theater_by_type"].items(), key=lambda x: x[1])[0] if any(results["theater_by_type"].values()) else None,
            "risk_level": "HIGH" if len(results["high_risk_files"]) > results["total_files"] * 0.1 else "MEDIUM" if results["theater_files"] > 0 else "LOW"
        }

        return results