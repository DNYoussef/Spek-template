from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
Quality Predictor ML Module
Predicts code quality using machine learning techniques.
"""

from typing import List, Dict, Any, Optional, Tuple
import ast
import json
import os
import re

from dataclasses import dataclass
from enum import Enum
import numpy as np

class QualityMetric(Enum):
    """Quality metrics that can be predicted."""
    MAINTAINABILITY = "maintainability"
    RELIABILITY = "reliability"
    SECURITY = "security"
    PERFORMANCE = "performance"
    TESTABILITY = "testability"
    OVERALL = "overall"

@dataclass
class QualityPrediction:
    """Prediction result for code quality."""
    metric: QualityMetric
    predicted_score: float
    confidence: float
    contributing_factors: Dict[str, float]
    recommendations: List[str]

class QualityPredictor:
    """ML-based code quality predictor."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.feature_weights = self._initialize_feature_weights()

    def _initialize_feature_weights(self) -> Dict[str, Dict[str, float]]:
        """Initialize feature weights for different quality metrics."""
        return {
            "maintainability": {
                "avg_function_length": -0.3,
                "cyclomatic_complexity": -0.4,
                "comment_density": 0.2,
                "variable_naming_quality": 0.3,
                "function_naming_quality": 0.2,
                "class_cohesion": 0.3,
                "duplicate_code_ratio": -0.4
            },
            "reliability": {
                "error_handling_coverage": 0.4,
                "test_coverage": 0.3,
                "assertion_density": 0.2,
                "null_check_coverage": 0.3,
                "exception_specificity": 0.2
            },
            "security": {
                "input_validation_coverage": 0.4,
                "hardcoded_secrets": -0.5,
                "sql_injection_risk": -0.4,
                "xss_risk": -0.3,
                "path_traversal_risk": -0.3
            },
            "performance": {
                "algorithmic_complexity": -0.4,
                "database_query_efficiency": 0.3,
                "memory_usage_patterns": 0.2,
                "loop_optimization": 0.3,
                "caching_usage": 0.2
            },
            "testability": {
                "dependency_injection_usage": 0.3,
                "method_parameter_count": -0.2,
                "static_method_ratio": 0.1,
                "mock_friendly_design": 0.4,
                "test_isolation": 0.3
            }
        }

    def extract_features(self, file_path: str) -> Dict[str, float]:
        """Extract features from code file for ML prediction."""
        if not path_exists(file_path):
            return {}

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception:
            return {}

        features = {}

        # Basic metrics
        features.update(self._extract_basic_metrics(content))

        # AST-based features
        try:
            tree = ast.parse(content)
            features.update(self._extract_ast_features(tree))
        except SyntaxError:
            # Use regex-based fallback
            features.update(self._extract_regex_features(content))

        # Security features
        features.update(self._extract_security_features(content))

        # Performance features
        features.update(self._extract_performance_features(content))

        return features

    def _extract_basic_metrics(self, content: str) -> Dict[str, float]:
        """Extract basic code metrics."""
        lines = content.split('\n')
        non_empty_lines = [line for line in lines if line.strip()]
        comment_lines = [line for line in lines if line.strip().startswith('#')]

        return {
            "total_lines": len(lines),
            "code_lines": len(non_empty_lines),
            "comment_lines": len(comment_lines),
            "comment_density": len(comment_lines) / max(1, len(non_empty_lines)),
            "avg_line_length": np.mean([len(line) for line in non_empty_lines]) if non_empty_lines else 0
        }

    def _extract_ast_features(self, tree: ast.AST) -> Dict[str, float]:
        """Extract features using AST analysis."""
        features = {}

        # Function analysis
        functions = [node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
        classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]

        if functions:
            function_lengths = [len(func.body) for func in functions]
            features["avg_function_length"] = np.mean(function_lengths)
            features["max_function_length"] = max(function_lengths)
            features["function_count"] = len(functions)

            # Function naming quality (simple heuristic)
            good_names = sum(1 for func in functions if self._is_good_function_name(func.name))
            features["function_naming_quality"] = good_names / len(functions)

            # Parameter count analysis
            param_counts = [len(func.args.args) for func in functions]
            features["avg_parameter_count"] = np.mean(param_counts)
            features["max_parameter_count"] = max(param_counts) if param_counts else 0

        else:
            features.update({
                "avg_function_length": 0,
                "max_function_length": 0,
                "function_count": 0,
                "function_naming_quality": 0,
                "avg_parameter_count": 0,
                "max_parameter_count": 0
            })

        # Class analysis
        if classes:
            class_methods = []
            for cls in classes:
                methods = [node for node in cls.body if isinstance(node, ast.FunctionDef)]
                class_methods.append(len(methods))

            features["class_count"] = len(classes)
            features["avg_methods_per_class"] = np.mean(class_methods)
        else:
            features.update({
                "class_count": 0,
                "avg_methods_per_class": 0
            })

        # Complexity indicators
        features["nested_loops"] = self._count_nested_loops(tree)
        features["conditional_complexity"] = self._count_conditionals(tree)
        features["exception_handlers"] = len([node for node in ast.walk(tree) if isinstance(node, ast.ExceptHandler)])

        return features

    def _extract_regex_features(self, content: str) -> Dict[str, float]:
        """Extract features using regex patterns (fallback)."""
        features = {}

        # Function patterns
        function_matches = re.findall(r'def\s+\w+\s*\([^)]*\):', content)
        features["function_count"] = len(function_matches)

        # Class patterns
        class_matches = re.findall(r'class\s+\w+', content)
        features["class_count"] = len(class_matches)

        # Complexity patterns
        if_matches = re.findall(r'\bif\b', content)
        for_matches = re.findall(r'\bfor\b', content)
        while_matches = re.findall(r'\bwhile\b', content)

        features["conditional_complexity"] = len(if_matches)
        features["loop_count"] = len(for_matches) + len(while_matches)

        return features

    def _extract_security_features(self, content: str) -> Dict[str, float]:
        """Extract security-related features."""
        features = {}

        # Input validation patterns
        validation_patterns = [
            r'validate\(',
            r'sanitize\(',
            r'escape\(',
            r'isinstance\(',
            r'len\(',
        ]

        validation_count = 0
        for pattern in validation_patterns:
            validation_count += len(re.findall(pattern, content, re.IGNORECASE))

        features["input_validation_coverage"] = min(1.0, validation_count / 10)  # Normalize

        # Security risks
        features["hardcoded_secrets"] = len(re.findall(r'password\s*=\s*["\'][^"\']+["\']', content, re.IGNORECASE))
        features["sql_injection_risk"] = len(re.findall(r'execute\s*\([^)]*\%', content, re.IGNORECASE))
        features["xss_risk"] = len(re.findall(r'innerHTML|document\.write', content, re.IGNORECASE))
        features["path_traversal_risk"] = len(re.findall(r'\.\./', content))

        return features

    def _extract_performance_features(self, content: str) -> Dict[str, float]:
        """Extract performance-related features."""
        features = {}

        # Loop optimization indicators
        nested_loop_count = len(re.findall(r'for.*:\s*\n\s*for', content, re.MULTILINE))
        features["nested_loops"] = nested_loop_count

        # Database query patterns
        db_patterns = [
            r'SELECT.*FROM',
            r'\.query\(',
            r'\.execute\(',
            r'\.fetchall\(',
        ]

        db_query_count = 0
        for pattern in db_patterns:
            db_query_count += len(re.findall(pattern, content, re.IGNORECASE))

        features["database_queries"] = db_query_count

        # Caching patterns
        cache_patterns = [
            r'@cache',
            r'@lru_cache',
            r'cache\.',
            r'memoize',
        ]

        cache_usage = 0
        for pattern in cache_patterns:
            cache_usage += len(re.findall(pattern, content, re.IGNORECASE))

        features["caching_usage"] = min(1.0, cache_usage / 5)  # Normalize

        return features

    def _is_good_function_name(self, name: str) -> bool:
        """Check if function name follows good practices."""
        # Simple heuristics for good naming
        if len(name) < 3:
            return False
        if name.startswith('_') and not name.startswith('__'):
            return True  # Private method
        if any(char.isupper() for char in name):
            return False  # Should be snake_case
        if any(word in name for word in ['get', 'set', 'create', 'update', 'delete', 'process', 'handle']):
            return True
        return len(name) >= 5  # Descriptive length

    def _count_nested_loops(self, tree: ast.AST) -> int:
        """Count nested loops in AST."""
        nested_count = 0

        for node in ast.walk(tree):
            if isinstance(node, (ast.For, ast.While)):
                for child in ast.walk(node):
                    if child != node and isinstance(child, (ast.For, ast.While)):
                        nested_count += 1

        return nested_count

    def _count_conditionals(self, tree: ast.AST) -> int:
        """Count conditional statements."""
        return len([node for node in ast.walk(tree)
                    if isinstance(node, (ast.If, ast.IfExp))])

    def predict_quality(self, file_path: str, metric: QualityMetric) -> QualityPrediction:
        """Predict quality metric for a file."""
        features = self.extract_features(file_path)

        if not features:
            return QualityPrediction(
                metric=metric,
                predicted_score=0.0,
                confidence=0.0,
                contributing_factors={},
                recommendations=["Could not analyze file"]
            )

        # Get weights for the specific metric
        weights = self.feature_weights.get(metric.value, {})

        # Calculate weighted score
        score = 50.0  # Base score
        contributing_factors = {}

        for feature_name, weight in weights.items():
            if feature_name in features:
                feature_value = features[feature_name]
                contribution = feature_value * weight * 50  # Scale contribution
                score += contribution
                contributing_factors[feature_name] = contribution

        # Normalize score to 0-100
        predicted_score = max(0.0, min(100.0, score))

        # Calculate confidence based on feature coverage
        feature_coverage = len([f for f in weights.keys() if f in features]) / max(1, len(weights))
        confidence = feature_coverage * 0.8 + 0.2  # Base confidence of 0.2

        # Generate recommendations
        recommendations = self._generate_recommendations(metric, features, contributing_factors)

        return QualityPrediction(
            metric=metric,
            predicted_score=predicted_score,
            confidence=confidence,
            contributing_factors=contributing_factors,
            recommendations=recommendations
        )

    def _generate_recommendations(self,
                                metric: QualityMetric,
                                features: Dict[str, float],
                                factors: Dict[str, float]) -> List[str]:
        """Generate recommendations based on prediction results."""
        recommendations = []

        if metric == QualityMetric.MAINTAINABILITY:
            if features.get("avg_function_length", 0) > 20:
                recommendations.append("Break down large functions into smaller, focused functions")
            if features.get("comment_density", 0) < 0.1:
                recommendations.append("Add more comments to explain complex logic")
            if features.get("function_naming_quality", 1) < 0.7:
                recommendations.append("Improve function naming to be more descriptive")

        elif metric == QualityMetric.RELIABILITY:
            if features.get("exception_handlers", 0) == 0:
                recommendations.append("Add proper error handling and exception management")
            if features.get("input_validation_coverage", 0) < 0.5:
                recommendations.append("Increase input validation coverage")

        elif metric == QualityMetric.SECURITY:
            if features.get("hardcoded_secrets", 0) > 0:
                recommendations.append("Remove hardcoded secrets and use environment variables")
            if features.get("sql_injection_risk", 0) > 0:
                recommendations.append("Use parameterized queries to prevent SQL injection")
            if features.get("input_validation_coverage", 0) < 0.7:
                recommendations.append("Implement comprehensive input validation")

        elif metric == QualityMetric.PERFORMANCE:
            if features.get("nested_loops", 0) > 2:
                recommendations.append("Optimize nested loops or consider alternative algorithms")
            if features.get("caching_usage", 0) < 0.3:
                recommendations.append("Consider adding caching for expensive operations")

        elif metric == QualityMetric.TESTABILITY:
            if features.get("avg_parameter_count", 0) > 5:
                recommendations.append("Reduce function parameter counts for better testability")
            if features.get("class_count", 0) > 0 and features.get("function_count", 1) / features.get("class_count", 1) > 10:
                recommendations.append("Consider breaking down large classes")

        # Default recommendation if none specific
        if not recommendations:
            recommendations.append("Code quality appears good, continue current practices")

        return recommendations[:3]  # Limit to top 3 recommendations

    def predict_all_metrics(self, file_path: str) -> List[QualityPrediction]:
        """Predict all quality metrics for a file."""
        predictions = []

        for metric in QualityMetric:
            if metric != QualityMetric.OVERALL:
                prediction = self.predict_quality(file_path, metric)
                predictions.append(prediction)

        # Calculate overall quality
        if predictions:
            overall_score = np.mean([p.predicted_score for p in predictions])
            overall_confidence = np.mean([p.confidence for p in predictions])

            all_factors = {}
            for p in predictions:
                for factor, value in p.contributing_factors.items():
                    all_factors[factor] = all_factors.get(factor, 0) + value

            all_recommendations = []
            for p in predictions:
                all_recommendations.extend(p.recommendations)

            # Remove duplicates while preserving order
            unique_recommendations = []
            for rec in all_recommendations:
                if rec not in unique_recommendations:
                    unique_recommendations.append(rec)

            overall_prediction = QualityPrediction(
                metric=QualityMetric.OVERALL,
                predicted_score=overall_score,
                confidence=overall_confidence,
                contributing_factors=all_factors,
                recommendations=unique_recommendations[:5]  # Top 5 overall recommendations
            )

            predictions.append(overall_prediction)

        return predictions