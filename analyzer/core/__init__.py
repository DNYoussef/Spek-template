# Core module initialization - simplified to avoid circular imports
from .unified_imports import IMPORT_MANAGER

# For validation tests that need ConnascenceAnalyzer, expose it through lazy import
def _get_connascence_analyzer():
    """Lazy import of ConnascenceAnalyzer to avoid circular imports."""
    try:
        import sys
        from pathlib import Path
        
        # Get the path to analyzer directory (parent of core directory)
        analyzer_path = Path(__file__).parent.parent
        core_py_path = analyzer_path / "core.py"
        
        if not core_py_path.exists():
            return None
            
        # Add analyzer directory to path
        if str(analyzer_path) not in sys.path:
            sys.path.insert(0, str(analyzer_path))
        
        # Import the main ConnascenceAnalyzer class from core.py
        import core as core_module
        return getattr(core_module, 'ConnascenceAnalyzer', None)
        
    except (ImportError, AttributeError) as e:
        return None

# Make ConnascenceAnalyzer available through lazy import
ConnascenceAnalyzer = _get_connascence_analyzer()

__all__ = ["IMPORT_MANAGER"]
if ConnascenceAnalyzer:
    __all__.append("ConnascenceAnalyzer")