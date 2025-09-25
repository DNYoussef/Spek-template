"""
A/B testing and model comparison framework for trading models.
"""

from .ab_testing import ABTestFramework, ABTest, TestVariant
from .experiment_manager import ExperimentManager, Experiment
from .model_comparator import ModelComparator, ComparisonResult
from .statistical_tests import StatisticalTester, SignificanceTest

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