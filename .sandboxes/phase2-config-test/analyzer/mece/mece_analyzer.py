# SPDX-License-Identifier: MIT
"""
MECE Analyzer Compatibility Module

Re-exports the MECEAnalyzer from its actual location to maintain
backward compatibility with import paths expected by workflows.
"""

# Import from the actual location
from ..dup_detection.mece_analyzer import MECEAnalyzer

# Re-export for compatibility
__all__ = ["MECEAnalyzer"]