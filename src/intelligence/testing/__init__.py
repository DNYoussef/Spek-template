"""
A/B testing and model comparison framework for trading models.
"""

from .ab_testing import ABTestFramework, ABTest, TestVariant
from .model_comparator import ModelComparator, ComparisonResult
from .statistical_tests import StatisticalTester, SignificanceTest
from .experiment_manager import ExperimentManager, Experiment

__all__ = [
    'ABTestFramework',
    'ABTest', 
    'TestVariant',
    'ModelComparator',
    'ComparisonResult',
    'StatisticalTester',
    'SignificanceTest',
    'ExperimentManager',
    'Experiment'
]