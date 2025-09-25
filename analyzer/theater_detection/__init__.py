"""
Theater Detection Module
Detects performance theater patterns and fake work in codebases.

This module ironically was missing, creating the ultimate theater pattern!
"""

from .analyzer import TheaterAnalyzer
from .core import TheaterDetector, TheaterPattern, RealityValidationResult
from .patterns import (
    TestTheaterDetector,
    DocumentationTheaterDetector,
    MetricsTheaterDetector,
    QualityTheaterDetector
)
from .validation import RealityValidator

__all__ = [
    'TheaterDetector',
    'TheaterPattern', 
    'RealityValidationResult',
    'TestTheaterDetector',
    'DocumentationTheaterDetector',
    'MetricsTheaterDetector',
    'QualityTheaterDetector',
    'TheaterAnalyzer',
    'RealityValidator'
]