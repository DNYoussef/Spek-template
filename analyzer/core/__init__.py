# SPDX-License-Identifier: MIT

"""
Analyzer Core Package
====================

Core functionality for the connascence analyzer system including:
- Unified import management
- Central orchestration components
- Configuration and dependency injection

This package provides the foundational infrastructure for all analyzer operations.
"""

# Import core components with proper error handling
try:
    from .unified_imports import IMPORT_MANAGER, ImportResult, UnifiedImportManager
except ImportError:
    # Create fallback implementation
    class UnifiedImportManager:
        def __init__(self):
            self.import_stats = {}
            self.failed_imports = {}

        def get_stats(self):
            return {"fallback_mode": True}

    IMPORT_MANAGER = UnifiedImportManager()
    ImportResult = None

# Lazy import UnifiedAnalyzer to avoid circular dependency
UnifiedAnalyzer = None
UNIFIED_ANALYZER_AVAILABLE = False

def get_unified_analyzer():
    """Lazy loader for UnifiedAnalyzer to avoid circular imports."""
    global UnifiedAnalyzer, UNIFIED_ANALYZER_AVAILABLE
    if UnifiedAnalyzer is None:
        try:
            from ..unified_api import UnifiedAnalyzer as _UnifiedAnalyzer
            UnifiedAnalyzer = _UnifiedAnalyzer
            UNIFIED_ANALYZER_AVAILABLE = True
        except ImportError:
            # Create fallback stub
            class UnifiedAnalyzer:
                def __init__(self):
                    pass
            UNIFIED_ANALYZER_AVAILABLE = False
    return UnifiedAnalyzer

# Import core functions from the main core.py module
try:
    import sys
    from pathlib import Path

    # Add parent directory to path to import from core.py
    analyzer_path = Path(__file__).parent.parent
    if str(analyzer_path) not in sys.path:
        sys.path.insert(0, str(analyzer_path))

    # Import functions from core.py
    import importlib.util
    core_py_path = analyzer_path / "core.py"

    if core_py_path.exists():
        spec = importlib.util.spec_from_file_location("core_module", str(core_py_path))
        core_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(core_module)

        # Import the required functions
        main = getattr(core_module, 'main', None)
        get_core_analyzer = getattr(core_module, 'get_core_analyzer', None)
        validate_critical_dependencies = getattr(core_module, 'validate_critical_dependencies', None)
        create_enhanced_mock_import_manager = getattr(core_module, 'create_enhanced_mock_import_manager', None)

        CORE_FUNCTIONS_AVAILABLE = True
    else:
        main = None
        get_core_analyzer = None
        validate_critical_dependencies = None
        create_enhanced_mock_import_manager = None
        CORE_FUNCTIONS_AVAILABLE = False

except Exception as e:
    main = None
    get_core_analyzer = None
    validate_critical_dependencies = None
    create_enhanced_mock_import_manager = None
    CORE_FUNCTIONS_AVAILABLE = False

# Add UNIFIED_IMPORTS_AVAILABLE flag
UNIFIED_IMPORTS_AVAILABLE = True

# Export main components
__all__ = [
    "IMPORT_MANAGER",
    "ImportResult",
    "UnifiedImportManager",
    "UNIFIED_IMPORTS_AVAILABLE",
    "get_unified_analyzer",
    "UNIFIED_ANALYZER_AVAILABLE",
    "main",
    "get_core_analyzer",
    "validate_critical_dependencies",
    "create_enhanced_mock_import_manager",
    "CORE_FUNCTIONS_AVAILABLE"
]

# Support direct import via lazy loading
def __getattr__(name):
    """Lazy attribute lookup for UnifiedAnalyzer."""
    if name == "UnifiedAnalyzer":
        return get_unified_analyzer()
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

# Package metadata
__version__ = "2.0.0"
__author__ = "Connascence Safety Analyzer Contributors"