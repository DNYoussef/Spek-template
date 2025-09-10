# SPDX-License-Identifier: MIT
"""
MECE Analysis Package

Provides import compatibility for MECE analyzer components.
"""

# Import the actual MECE analyzer from its current location
from ..dup_detection.mece_analyzer import MECEAnalyzer

# Export for compatibility
__all__ = ["MECEAnalyzer"]