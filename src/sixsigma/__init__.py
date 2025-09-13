"""
Six Sigma Integration Package
Theater-Free Quality Validation with DPMO/RTY Calculations
"""

from .sixsigma_scorer import SixSigmaScorer, SixSigmaMetrics, DefectRecord, ProcessStage
from .telemetry_config import TelemetryCollector, SixSigmaTelemetryManager, TelemetryDataPoint

__version__ = "1.0.0"
__author__ = "SPEK Enhanced Development Platform"

__all__ = [
    'SixSigmaScorer',
    'SixSigmaMetrics', 
    'DefectRecord',
    'ProcessStage',
    'TelemetryCollector',
    'SixSigmaTelemetryManager',
    'TelemetryDataPoint'
]