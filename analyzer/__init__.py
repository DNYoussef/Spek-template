"""
Analyzer Module
Main entry point for the SPEK analyzer system
"""

# Import with fallback for missing modules
try:
    from .core import IMPORT_MANAGER, UNIFIED_IMPORTS_AVAILABLE
except ImportError:
    IMPORT_MANAGER = None
    UNIFIED_IMPORTS_AVAILABLE = False

__version__ = '1.0.0'

__all__ = [
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