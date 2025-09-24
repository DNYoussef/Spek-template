"""
Specialized Connascence Detectors

This package contains focused detector classes that implement the Single Responsibility Principle.
Each detector handles one specific type of connascence violation.
"""

from .base import DetectorBase
from .position_detector import PositionDetector
from .magic_literal_detector import MagicLiteralDetector
from .algorithm_detector import AlgorithmDetector
from .god_object_detector import GodObjectDetector
from .timing_detector import TimingDetector
from .convention_detector import ConventionDetector
from .values_detector import ValuesDetector
from .execution_detector import ExecutionDetector
from .enhanced_algorithm_detector import detect_algorithm_violations
from .enhanced_execution_detector import detect_execution_violations
from .enhanced_timing_detector import detect_timing_violations

__all__ = [
    "DetectorBase",
    "PositionDetector",
    "MagicLiteralDetector",
    "AlgorithmDetector",
    "GodObjectDetector",
    "TimingDetector",
    "ConventionDetector",
    "ValuesDetector",
    "ExecutionDetector",
    "detect_algorithm_violations",
    "detect_execution_violations",
    "detect_timing_violations"
]
