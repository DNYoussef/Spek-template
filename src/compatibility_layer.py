#!/usr/bin/env python3
"""
Backward Compatibility Layer for Naming Standardization
Provides compatibility aliases for renamed functions and methods
"""

from typing import Any, Dict, List, Optional
import functools

import warnings

class DeprecationHelper:
    """Helper class to provide deprecation warnings for renamed methods"""

    def __init__(self, target_object: Any, old_name: str, new_name: str):
        self.target_object = target_object
        self.old_name = old_name
        self.new_name = new_name

    def __call__(self, *args, **kwargs):
        warnings.warn(
            f"{self.old_name} is deprecated. Use {self.new_name} instead.",
            DeprecationWarning,
            stacklevel=2
        )

        # Get the new method and call it
        new_method = getattr(self.target_object, self.new_name)
        return new_method(*args, **kwargs)

def deprecated_alias(old_name: str):
    """Decorator to create deprecated aliases for renamed methods"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            warnings.warn(
                f"{old_name} is deprecated. Use {func.__name__} instead.",
                DeprecationWarning,
                stacklevel=2
            )
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Compatibility mappings for renamed functions
DEPRECATED_FUNCTION_MAPPINGS = {
    'generateConnascenceReport': 'generate_connascence_report',
    'validateSafetyCompliance': 'validate_safety_compliance',
    'getRefactoringSuggestions': 'get_refactoring_suggestions',
    'getAutomatedFixes': 'get_automated_fixes'
}

class CompatibilityMixin:
    """Mixin class to add backward compatibility for renamed methods"""

    def __getattr__(self, name: str) -> Any:
        """Provide backward compatibility for renamed methods"""
        if name in DEPRECATED_FUNCTION_MAPPINGS:
            new_name = DEPRECATED_FUNCTION_MAPPINGS[name]
            if hasattr(self, new_name):
                return DeprecationHelper(self, name, new_name)

        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")

# Legacy module-level functions for backward compatibility
def generateConnascenceReport(*args, **kwargs):
    """
    DEPRECATED: Use generate_connascence_report instead.
    Legacy function maintained for backward compatibility.
    """
    warnings.warn(
        "generateConnascenceReport is deprecated. Use generate_connascence_report instead.",
        DeprecationWarning,
        stacklevel=2
    )

    # Import the analyzer and call the new method
    from analyzer.unified_analyzer import UnifiedAnalyzer
    analyzer = UnifiedAnalyzer()
    return analyzer.generate_connascence_report(*args, **kwargs)

def validateSafetyCompliance(*args, **kwargs):
    """
    DEPRECATED: Use validate_safety_compliance instead.
    Legacy function maintained for backward compatibility.
    """
    warnings.warn(
        "validateSafetyCompliance is deprecated. Use validate_safety_compliance instead.",
        DeprecationWarning,
        stacklevel=2
    )

    # Import the analyzer and call the new method
    from analyzer.unified_analyzer import UnifiedAnalyzer
    analyzer = UnifiedAnalyzer()
    return analyzer.validate_safety_compliance(*args, **kwargs)

def getRefactoringSuggestions(*args, **kwargs):
    """
    DEPRECATED: Use get_refactoring_suggestions instead.
    Legacy function maintained for backward compatibility.
    """
    warnings.warn(
        "getRefactoringSuggestions is deprecated. Use get_refactoring_suggestions instead.",
        DeprecationWarning,
        stacklevel=2
    )

    # Import the analyzer and call the new method
    from analyzer.unified_analyzer import UnifiedAnalyzer
    analyzer = UnifiedAnalyzer()
    return analyzer.get_refactoring_suggestions(*args, **kwargs)

def getAutomatedFixes(*args, **kwargs):
    """
    DEPRECATED: Use get_automated_fixes instead.
    Legacy function maintained for backward compatibility.
    """
    warnings.warn(
        "getAutomatedFixes is deprecated. Use get_automated_fixes instead.",
        DeprecationWarning,
        stacklevel=2
    )

    # Import the analyzer and call the new method
    from analyzer.unified_analyzer import UnifiedAnalyzer
    analyzer = UnifiedAnalyzer()
    return analyzer.get_automated_fixes(*args, **kwargs)

# Export legacy names for backward compatibility
__all__ = [
    'CompatibilityMixin',
    'deprecated_alias',
    'DeprecationHelper',
    'generateConnascenceReport',
    'validateSafetyCompliance',
    'getRefactoringSuggestions',
    'getAutomatedFixes',
    'DEPRECATED_FUNCTION_MAPPINGS'
]