"""CNN Chart Pattern Recognition Module

ResNet-based CNN for identifying 20+ chart patterns in candlestick data.
Optimized for real-time pattern detection with sub-100ms inference.
"""

from .pattern_definitions import CHART_PATTERNS
from .pattern_recognizer import ChartPatternCNN
from .resnet_backbone import FinancialResNet

__all__ = ['ChartPatternCNN', 'FinancialResNet', 'CHART_PATTERNS']