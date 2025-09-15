"""
Feature Extraction Utilities for ML Models

This module provides comprehensive feature extraction capabilities for
quality validation, theater detection, and compliance forecasting.
Optimized for code analysis and pattern recognition.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any, Union
import logging
import ast
import re
from pathlib import Path
from collections import Counter, defaultdict
import hashlib

# AST analysis imports
import astunparse
from radon.complexity import cc_visit
from radon.metrics import h_visit, mi_visit

class FeatureExtractor:
    """
    Comprehensive feature extraction for ML models.

    Features:
    - Static code analysis (AST-based)
    - Dynamic metrics from execution
    - Historical pattern analysis
    - Change impact assessment
    - Quality trend extraction
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.logger = self._setup_logging()

        # Feature extractors by category
        self.extractors = {
            'static': self._extract_static_features,
            'dynamic': self._extract_dynamic_features,
            'historical': self._extract_historical_features,
            'change': self._extract_change_features,
            'quality': self._extract_quality_features,
            'behavioral': self._extract_behavioral_features,
            'semantic': self._extract_semantic_features
        }

    def _setup_logging(self) -> logging.Logger:
        """Setup logging for feature extraction."""
        logger = logging.getLogger('feature_extractor')
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def extract_comprehensive_features(self, code_data: Dict[str, Any],
                                     feature_categories: List[str] = None) -> Dict[str, Any]:
        """
        Extract comprehensive features from code data.

        Args:
            code_data: Dictionary containing code content and metadata
            feature_categories: List of feature categories to extract

        Returns:
            Dictionary of extracted features organized by category
        """
        if feature_categories is None:
            feature_categories = list(self.extractors.keys())

        features = {}

        for category in feature_categories:
            if category in self.extractors:
                try:
                    category_features = self.extractors[category](code_data)
                    features[category] = category_features
                    self.logger.debug(f"Extracted {len(category_features)} {category} features")
                except Exception as e:
                    self.logger.error(f"Failed to extract {category} features: {e}")
                    features[category] = {}

        # Flatten features for ML models
        flattened_features = self._flatten_features(features)

        return {
            'categorized': features,
            'flattened': flattened_features,
            'feature_count': len(flattened_features),
            'categories': list(features.keys())
        }

    def _extract_static_features(self, code_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract static code analysis features."""
        features = {}

        code_content = code_data.get('code_content', '')
        file_path = code_data.get('file_path', '')

        if not code_content:
            return features

        try:
            # Parse AST
            tree = ast.parse(code_content)

            # Basic metrics
            features.update(self._extract_ast_metrics(tree))

            # Complexity metrics
            features.update(self._extract_complexity_metrics(code_content))

            # Structure metrics
            features.update(self._extract_structure_metrics(tree))

            # Naming metrics
            features.update(self._extract_naming_metrics(tree))

            # Documentation metrics
            features.update(self._extract_documentation_metrics(tree, code_content))

        except SyntaxError as e:
            self.logger.warning(f"Syntax error in code: {e}")
            features['syntax_error'] = 1.0
        except Exception as e:
            self.logger.error(f"Error in static analysis: {e}")

        return features

    def _extract_ast_metrics(self, tree: ast.AST) -> Dict[str, float]:
        """Extract AST-based metrics."""
        features = {}

        # Count different node types
        node_counts = defaultdict(int)
        for node in ast.walk(tree):
            node_counts[type(node).__name__] += 1

        # Basic counts
        features.update({
            'total_nodes': float(sum(node_counts.values())),
            'classes': float(node_counts.get('ClassDef', 0)),
            'functions': float(node_counts.get('FunctionDef', 0)),
            'async_functions': float(node_counts.get('AsyncFunctionDef', 0)),
            'if_statements': float(node_counts.get('If', 0)),
            'for_loops': float(node_counts.get('For', 0)),
            'while_loops': float(node_counts.get('While', 0)),
            'try_statements': float(node_counts.get('Try', 0)),
            'with_statements': float(node_counts.get('With', 0)),
            'imports': float(node_counts.get('Import', 0) + node_counts.get('ImportFrom', 0)),
            'assignments': float(node_counts.get('Assign', 0)),
            'calls': float(node_counts.get('Call', 0))
        })

        # Ratios and derived metrics
        total_statements = max(sum(node_counts.values()), 1)
        features.update({
            'control_flow_ratio': (
                features['if_statements'] + features['for_loops'] +
                features['while_loops']
            ) / total_statements,
            'exception_handling_ratio': features['try_statements'] / total_statements,
            'function_density': features['functions'] / max(features['classes'], 1)
        })

        return features

    def _extract_complexity_metrics(self, code_content: str) -> Dict[str, float]:
        """Extract complexity metrics using radon."""
        features = {}

        try:
            # Cyclomatic complexity
            cc_results = cc_visit(code_content)
            if cc_results:
                complexities = [result.complexity for result in cc_results]
                features.update({
                    'avg_cyclomatic_complexity': float(np.mean(complexities)),
                    'max_cyclomatic_complexity': float(np.max(complexities)),
                    'total_cyclomatic_complexity': float(np.sum(complexities))
                })
            else:
                features.update({
                    'avg_cyclomatic_complexity': 0.0,
                    'max_cyclomatic_complexity': 0.0,
                    'total_cyclomatic_complexity': 0.0
                })

            # Halstead metrics
            h_results = h_visit(code_content)
            if h_results:
                features.update({
                    'halstead_volume': float(h_results.total.volume or 0),
                    'halstead_difficulty': float(h_results.total.difficulty or 0),
                    'halstead_effort': float(h_results.total.effort or 0),
                    'halstead_bugs': float(h_results.total.bugs or 0)
                })

            # Maintainability Index
            mi_results = mi_visit(code_content, multi=True)
            if mi_results:
                mi_values = [result.mi for result in mi_results]
                features['maintainability_index'] = float(np.mean(mi_values))

        except Exception as e:
            self.logger.warning(f"Error extracting complexity metrics: {e}")

        return features

    def _extract_structure_metrics(self, tree: ast.AST) -> Dict[str, float]:
        """Extract code structure metrics."""
        features = {}

        # Nesting depth analysis
        max_depth = 0
        total_depth = 0
        depth_count = 0

        def analyze_depth(node, current_depth=0):
            nonlocal max_depth, total_depth, depth_count

            max_depth = max(max_depth, current_depth)
            total_depth += current_depth
            depth_count += 1

            for child in ast.iter_child_nodes(node):
                if isinstance(child, (ast.If, ast.For, ast.While, ast.With,
                                    ast.Try, ast.FunctionDef, ast.ClassDef)):
                    analyze_depth(child, current_depth + 1)
                else:
                    analyze_depth(child, current_depth)

        analyze_depth(tree)

        features.update({
            'max_nesting_depth': float(max_depth),
            'avg_nesting_depth': float(total_depth / max(depth_count, 1))
        })

        # Method and class analysis
        methods_per_class = []
        parameters_per_method = []

        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                method_count = len([n for n in node.body if isinstance(n, ast.FunctionDef)])
                methods_per_class.append(method_count)

            elif isinstance(node, ast.FunctionDef):
                param_count = len(node.args.args)
                parameters_per_method.append(param_count)

        if methods_per_class:
            features.update({
                'avg_methods_per_class': float(np.mean(methods_per_class)),
                'max_methods_per_class': float(np.max(methods_per_class))
            })

        if parameters_per_method:
            features.update({
                'avg_parameters_per_method': float(np.mean(parameters_per_method)),
                'max_parameters_per_method': float(np.max(parameters_per_method))
            })

        return features

    def _extract_naming_metrics(self, tree: ast.AST) -> Dict[str, float]:
        """Extract naming convention and quality metrics."""
        features = {}

        names = []
        for node in ast.walk(tree):
            if hasattr(node, 'name'):
                names.append(node.name)
            elif hasattr(node, 'id'):
                names.append(node.id)
            elif isinstance(node, ast.arg):
                names.append(node.arg)

        if names:
            # Name length statistics
            name_lengths = [len(name) for name in names]
            features.update({
                'avg_name_length': float(np.mean(name_lengths)),
                'max_name_length': float(np.max(name_lengths)),
                'min_name_length': float(np.min(name_lengths))
            })

            # Naming convention analysis
            snake_case_count = sum(1 for name in names if '_' in name and name.islower())
            camel_case_count = sum(1 for name in names if any(c.isupper() for c in name[1:]))

            features.update({
                'snake_case_ratio': float(snake_case_count / len(names)),
                'camel_case_ratio': float(camel_case_count / len(names))
            })

            # Name descriptiveness (approximated by length and vowel ratio)
            vowel_ratios = []
            for name in names:
                vowels = sum(1 for c in name.lower() if c in 'aeiou')
                vowel_ratios.append(vowels / max(len(name), 1))

            features['avg_name_vowel_ratio'] = float(np.mean(vowel_ratios))

        return features

    def _extract_documentation_metrics(self, tree: ast.AST, code_content: str) -> Dict[str, float]:
        """Extract documentation-related metrics."""
        features = {}

        # Count docstrings
        docstring_count = 0
        total_functions_classes = 0

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                total_functions_classes += 1
                if (node.body and isinstance(node.body[0], ast.Expr) and
                    isinstance(node.body[0].value, ast.Str)):
                    docstring_count += 1

        # Count comments
        comment_lines = len([line for line in code_content.split('\n')
                           if line.strip().startswith('#')])
        total_lines = len(code_content.split('\n'))

        features.update({
            'docstring_coverage': float(docstring_count / max(total_functions_classes, 1)),
            'comment_ratio': float(comment_lines / max(total_lines, 1)),
            'total_comments': float(comment_lines),
            'documented_functions': float(docstring_count)
        })

        return features

    def _extract_dynamic_features(self, code_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract dynamic execution-based features."""
        features = {}

        # Runtime metrics
        execution_metrics = code_data.get('execution_metrics', {})
        features.update({
            'execution_time': float(execution_metrics.get('execution_time', 0)),
            'memory_usage': float(execution_metrics.get('memory_usage', 0)),
            'cpu_usage': float(execution_metrics.get('cpu_usage', 0)),
            'io_operations': float(execution_metrics.get('io_operations', 0))
        })

        # Test coverage metrics
        coverage_data = code_data.get('coverage', {})
        features.update({
            'line_coverage': float(coverage_data.get('line_coverage', 0)),
            'branch_coverage': float(coverage_data.get('branch_coverage', 0)),
            'function_coverage': float(coverage_data.get('function_coverage', 0)),
            'uncovered_lines': float(coverage_data.get('uncovered_lines', 0))
        })

        # Error and warning metrics
        analysis_results = code_data.get('static_analysis', {})
        features.update({
            'lint_errors': float(analysis_results.get('errors', 0)),
            'lint_warnings': float(analysis_results.get('warnings', 0)),
            'security_issues': float(analysis_results.get('security_issues', 0)),
            'performance_warnings': float(analysis_results.get('performance_warnings', 0))
        })

        return features

    def _extract_historical_features(self, code_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract historical pattern features."""
        features = {}

        history = code_data.get('history', [])
        if not history:
            return features

        # Convert to DataFrame for easier analysis
        df = pd.DataFrame(history)

        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('timestamp')

        # Change frequency analysis
        if len(history) > 1:
            time_diffs = df['timestamp'].diff().dt.total_seconds() / 3600  # hours
            features.update({
                'avg_change_interval_hours': float(time_diffs.mean()),
                'min_change_interval_hours': float(time_diffs.min()),
                'change_frequency_score': float(24 / max(time_diffs.mean(), 1))  # changes per day
            })

        # Quality trend analysis
        if 'quality_score' in df.columns:
            quality_scores = df['quality_score'].values
            if len(quality_scores) > 2:
                # Linear trend
                x = np.arange(len(quality_scores))
                slope, intercept = np.polyfit(x, quality_scores, 1)
                features.update({
                    'quality_trend_slope': float(slope),
                    'quality_volatility': float(np.std(quality_scores)),
                    'quality_improvement': float(quality_scores[-1] - quality_scores[0])
                })

        # Author analysis
        if 'author' in df.columns:
            author_counts = df['author'].value_counts()
            features.update({
                'unique_authors': float(len(author_counts)),
                'primary_author_ratio': float(author_counts.iloc[0] / len(df) if len(author_counts) > 0 else 0),
                'author_diversity': float(1 - (author_counts.iloc[0] / len(df)) if len(author_counts) > 0 else 0)
            })

        # Change impact analysis
        if 'lines_changed' in df.columns:
            lines_changed = df['lines_changed'].values
            features.update({
                'avg_change_size': float(np.mean(lines_changed)),
                'max_change_size': float(np.max(lines_changed)),
                'change_size_volatility': float(np.std(lines_changed))
            })

        return features

    def _extract_change_features(self, code_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract change-specific features."""
        features = {}

        change_info = code_data.get('change_info', {})

        # Basic change metrics
        features.update({
            'lines_added': float(change_info.get('lines_added', 0)),
            'lines_deleted': float(change_info.get('lines_deleted', 0)),
            'files_modified': float(change_info.get('files_modified', 0)),
            'functions_added': float(change_info.get('functions_added', 0)),
            'functions_modified': float(change_info.get('functions_modified', 0)),
            'functions_deleted': float(change_info.get('functions_deleted', 0)),
            'classes_added': float(change_info.get('classes_added', 0)),
            'classes_modified': float(change_info.get('classes_modified', 0))
        })

        # Derived change metrics
        total_lines_changed = features['lines_added'] + features['lines_deleted']
        total_functions = (features['functions_added'] + features['functions_modified'] +
                          features['functions_deleted'])

        features.update({
            'total_lines_changed': total_lines_changed,
            'change_ratio': float(features['lines_added'] / max(total_lines_changed, 1)),
            'deletion_ratio': float(features['lines_deleted'] / max(total_lines_changed, 1)),
            'function_impact_ratio': float(total_functions / max(features['files_modified'], 1))
        })

        # Change type analysis
        change_types = change_info.get('change_types', {})
        total_changes = sum(change_types.values()) or 1

        for change_type, count in change_types.items():
            features[f'{change_type}_change_ratio'] = float(count / total_changes)

        # Diff analysis
        diff_content = change_info.get('diff_content', '')
        if diff_content:
            features.update(self._analyze_diff_patterns(diff_content))

        return features

    def _analyze_diff_patterns(self, diff_content: str) -> Dict[str, float]:
        """Analyze patterns in diff content."""
        features = {}

        lines = diff_content.split('\n')

        # Count different types of changes
        additions = len([line for line in lines if line.startswith('+')])
        deletions = len([line for line in lines if line.startswith('-')])
        context_lines = len([line for line in lines if line.startswith(' ')])

        # Pattern analysis
        import_changes = len([line for line in lines if 'import' in line and (line.startswith('+') or line.startswith('-'))])
        comment_changes = len([line for line in lines if '#' in line and (line.startswith('+') or line.startswith('-'))])
        whitespace_only = len([line for line in lines if line.strip() in ['+', '-']])

        features.update({
            'diff_additions': float(additions),
            'diff_deletions': float(deletions),
            'diff_context_lines': float(context_lines),
            'import_changes': float(import_changes),
            'comment_changes': float(comment_changes),
            'whitespace_only_changes': float(whitespace_only),
            'substantive_changes': float(additions + deletions - comment_changes - whitespace_only)
        })

        return features

    def _extract_quality_features(self, code_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract quality-related features."""
        features = {}

        quality_metrics = code_data.get('quality_metrics', {})

        # Quality scores
        features.update({
            'overall_quality_score': float(quality_metrics.get('overall_score', 0)),
            'maintainability_score': float(quality_metrics.get('maintainability', 0)),
            'reliability_score': float(quality_metrics.get('reliability', 0)),
            'security_score': float(quality_metrics.get('security', 0)),
            'performance_score': float(quality_metrics.get('performance', 0))
        })

        # Code smells and issues
        code_smells = quality_metrics.get('code_smells', {})
        features.update({
            'god_class_indicators': float(code_smells.get('god_class', 0)),
            'long_method_indicators': float(code_smells.get('long_method', 0)),
            'feature_envy_indicators': float(code_smells.get('feature_envy', 0)),
            'data_clump_indicators': float(code_smells.get('data_clump', 0)),
            'duplicate_code_ratio': float(code_smells.get('duplication', 0))
        })

        # Technical debt
        tech_debt = quality_metrics.get('technical_debt', {})
        features.update({
            'tech_debt_ratio': float(tech_debt.get('ratio', 0)),
            'debt_remediation_effort': float(tech_debt.get('remediation_effort', 0)),
            'todo_comments': float(tech_debt.get('todo_count', 0)),
            'fixme_comments': float(tech_debt.get('fixme_count', 0))
        })

        return features

    def _extract_behavioral_features(self, code_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract behavioral pattern features."""
        features = {}

        behavioral_data = code_data.get('behavioral_patterns', {})

        # Development patterns
        dev_patterns = behavioral_data.get('development', {})
        features.update({
            'weekend_commits': float(dev_patterns.get('weekend_work', 0)),
            'late_night_commits': float(dev_patterns.get('late_night_work', 0)),
            'commit_message_quality': float(dev_patterns.get('commit_message_score', 0)),
            'branch_naming_score': float(dev_patterns.get('branch_naming_score', 0))
        })

        # Review patterns
        review_patterns = behavioral_data.get('review', {})
        features.update({
            'review_participation': float(review_patterns.get('participation_score', 0)),
            'review_thoroughness': float(review_patterns.get('thoroughness_score', 0)),
            'approval_speed': float(review_patterns.get('approval_speed', 0)),
            'feedback_quality': float(review_patterns.get('feedback_quality', 0))
        })

        # Testing patterns
        testing_patterns = behavioral_data.get('testing', {})
        features.update({
            'test_first_development': float(testing_patterns.get('tdd_score', 0)),
            'test_quality_score': float(testing_patterns.get('test_quality', 0)),
            'assertion_density': float(testing_patterns.get('assertion_density', 0)),
            'mock_usage_ratio': float(testing_patterns.get('mock_ratio', 0))
        })

        return features

    def _extract_semantic_features(self, code_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract semantic and contextual features."""
        features = {}

        # Domain-specific analysis
        domain_info = code_data.get('domain_context', {})
        features.update({
            'domain_complexity': float(domain_info.get('complexity_score', 0)),
            'api_usage_score': float(domain_info.get('api_usage', 0)),
            'framework_adherence': float(domain_info.get('framework_score', 0)),
            'design_pattern_usage': float(domain_info.get('pattern_score', 0))
        })

        # Dependencies and coupling
        dependency_info = code_data.get('dependencies', {})
        features.update({
            'coupling_score': float(dependency_info.get('coupling', 0)),
            'cohesion_score': float(dependency_info.get('cohesion', 0)),
            'external_dependencies': float(dependency_info.get('external_count', 0)),
            'circular_dependencies': float(dependency_info.get('circular_count', 0))
        })

        # Architecture adherence
        architecture_info = code_data.get('architecture', {})
        features.update({
            'layering_violation_score': float(architecture_info.get('layering_violations', 0)),
            'separation_of_concerns': float(architecture_info.get('soc_score', 0)),
            'interface_segregation': float(architecture_info.get('isp_score', 0)),
            'dependency_inversion': float(architecture_info.get('dip_score', 0))
        })

        return features

    def _flatten_features(self, categorized_features: Dict[str, Dict[str, float]]) -> Dict[str, float]:
        """Flatten categorized features into a single dictionary."""
        flattened = {}

        for category, features in categorized_features.items():
            for feature_name, value in features.items():
                # Ensure feature name is unique across categories
                flattened_name = f"{category}_{feature_name}"
                flattened[flattened_name] = float(value)

        return flattened

    def create_feature_vector(self, features: Dict[str, float],
                            feature_names: List[str] = None) -> np.ndarray:
        """Create a feature vector from feature dictionary."""
        if feature_names is None:
            feature_names = sorted(features.keys())

        vector = np.array([features.get(name, 0.0) for name in feature_names])
        return vector

    def get_feature_importance_analysis(self, features: Dict[str, float],
                                      model_importance: Dict[str, float] = None) -> Dict[str, Any]:
        """Analyze feature importance and provide insights."""
        analysis = {
            'total_features': len(features),
            'non_zero_features': sum(1 for v in features.values() if v != 0),
            'feature_statistics': {
                'mean': float(np.mean(list(features.values()))),
                'std': float(np.std(list(features.values()))),
                'min': float(np.min(list(features.values()))),
                'max': float(np.max(list(features.values())))
            }
        }

        # Top features by value
        sorted_features = sorted(features.items(), key=lambda x: abs(x[1]), reverse=True)
        analysis['top_features_by_value'] = sorted_features[:10]

        # Feature importance if provided
        if model_importance:
            common_features = set(features.keys()) & set(model_importance.keys())
            importance_analysis = {
                name: {
                    'value': features[name],
                    'importance': model_importance[name],
                    'impact': features[name] * model_importance[name]
                }
                for name in common_features
            }

            sorted_importance = sorted(
                importance_analysis.items(),
                key=lambda x: x[1]['impact'],
                reverse=True
            )

            analysis['importance_analysis'] = dict(sorted_importance[:10])

        return analysis

# Example usage
if __name__ == "__main__":
    # Initialize feature extractor
    extractor = FeatureExtractor()

    # Example code data
    sample_code_data = {
        'code_content': '''
def example_function(param1, param2):
    """This is an example function."""
    if param1 > 0:
        for i in range(param2):
            print(f"Iteration {i}")
    return param1 + param2

class ExampleClass:
    def __init__(self, value):
        self.value = value

    def method(self):
        return self.value * 2
        ''',
        'file_path': 'example.py',
        'change_info': {
            'lines_added': 10,
            'lines_deleted': 2,
            'files_modified': 1
        },
        'quality_metrics': {
            'overall_score': 0.85,
            'maintainability': 0.8,
            'security': 0.9
        },
        'history': [
            {'timestamp': '2024-01-01T10:00:00Z', 'quality_score': 0.8, 'author': 'dev1'},
            {'timestamp': '2024-01-02T14:00:00Z', 'quality_score': 0.85, 'author': 'dev1'}
        ]
    }

    # Extract comprehensive features
    result = extractor.extract_comprehensive_features(sample_code_data)

    print(f"Extracted {result['feature_count']} features across {len(result['categories'])} categories")
    print(f"Categories: {result['categories']}")

    # Analyze feature importance
    importance_analysis = extractor.get_feature_importance_analysis(result['flattened'])
    print(f"\nFeature analysis: {importance_analysis['feature_statistics']}")