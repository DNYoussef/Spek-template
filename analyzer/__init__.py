"""
Analyzer Module
Main entry point for the SPEK analyzer system
"""

# Core types and classes for Phase 1 implementation
try:
    from .utils.types import ConnascenceViolation, ConnascenceType, SeverityLevel, AnalysisResult
    from .detectors import DetectorBase, MagicLiteralDetector
    from .integrations.github_bridge import GitHubBridge, GitHubConfig
    CORE_IMPORTS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Core imports failed: {e}")
    CORE_IMPORTS_AVAILABLE = False

# Import with fallback for missing modules
try:
    from .core import IMPORT_MANAGER, UNIFIED_IMPORTS_AVAILABLE
except ImportError:
    IMPORT_MANAGER = None
    UNIFIED_IMPORTS_AVAILABLE = False

__version__ = '1.0.0'

__all__ = [
    'ConnascenceViolation', 'ConnascenceType', 'SeverityLevel', 'AnalysisResult',
    'DetectorBase', 'MagicLiteralDetector', 'GitHubBridge', 'GitHubConfig',
    'connascence_scanner',
    'architecture_analyzer',
    'quality_metrics',
    'compliance_manager',
    'quality_validation',
    'risk_assessment',
    'real_time_monitor',
    'performance_tracker',
    'cache_manager',
    'performance_optimizer',
    'semgrep_scanner',
    'vulnerability_analyzer'
]