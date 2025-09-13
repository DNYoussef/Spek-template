# Core module initialization with enhanced CI/CD support
from .unified_imports import IMPORT_MANAGER

# Enhanced imports with lazy loading for CI compatibility
def _lazy_import_from_core():
    """Lazy import of enhanced functions from core.py."""
    try:
        import sys
        from pathlib import Path
        
        # Get the path to analyzer directory (parent of core directory)
        analyzer_path = Path(__file__).parent.parent
        core_py_path = analyzer_path / "core.py"
        
        if not core_py_path.exists():
            return {}
            
        # Add analyzer directory to path
        if str(analyzer_path) not in sys.path:
            sys.path.insert(0, str(analyzer_path))
        
        # Import enhanced functions from core.py (import as analyzer.core module)
        import analyzer.core as analyzer_core_module
        
        # Now import the actual core.py file by adding the analyzer path and importing
        import importlib.util
        spec = importlib.util.spec_from_file_location("core_module", str(core_py_path))
        core_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(core_module)
        return {
            'ConnascenceAnalyzer': getattr(core_module, 'ConnascenceAnalyzer', None),
            'validate_critical_dependencies': getattr(core_module, 'validate_critical_dependencies', None),
            'create_enhanced_mock_import_manager': getattr(core_module, 'create_enhanced_mock_import_manager', None),
            'get_core_analyzer': getattr(core_module, 'get_core_analyzer', None),
            'main': getattr(core_module, 'main', None)
        }
        
    except Exception as e:
        return {}

# Load enhanced functions
_enhanced_functions = _lazy_import_from_core()

# Export enhanced functions
ConnascenceAnalyzer = _enhanced_functions.get('ConnascenceAnalyzer')
validate_critical_dependencies = _enhanced_functions.get('validate_critical_dependencies')
create_enhanced_mock_import_manager = _enhanced_functions.get('create_enhanced_mock_import_manager')
get_core_analyzer = _enhanced_functions.get('get_core_analyzer')
main = _enhanced_functions.get('main')

# Build __all__ dynamically
__all__ = ["IMPORT_MANAGER"]
for name, func in _enhanced_functions.items():
    if func is not None:
        __all__.append(name)