"""
Machine Learning Modules
ML capabilities for code analysis and quality prediction.
"""

from .quality_predictor import QualityPredictor, QualityPrediction
from .theater_classifier import TheaterClassifier, TheaterPrediction
from .compliance_forecaster import ComplianceForecaster, ComplianceForecast
from .pattern_detector import PatternDetector, CodePattern

__all__ = [
    'QualityPredictor',
    'QualityPrediction',
    'TheaterClassifier',
    'TheaterPrediction',
    'ComplianceForecaster',
    'ComplianceForecast',
    'PatternDetector',
    'CodePattern'
]