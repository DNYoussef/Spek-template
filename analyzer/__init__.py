# SPDX-License-Identifier: MIT
# Analyzer module main exports for workflow compatibility

# Import canonical ConnascenceViolation from single source of truth
from .utils.types import ConnascenceViolation

# Import key analyzers for workflow compatibility
try:
    from .connascence_analyzer import ConnascenceAnalyzer
except ImportError:
    ConnascenceAnalyzer = None

try:
    from .analysis_orchestrator import AnalysisOrchestrator
except ImportError:
    AnalysisOrchestrator = None

__all__ = [
    "ConnascenceViolation", 
    "ConnascenceAnalyzer",
    "AnalysisOrchestrator"
]
