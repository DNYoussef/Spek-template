# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Connascence Safety Analyzer Contributors

"""
Core analyzer package initialization.
"""

# The core.py module contains the main ConnascenceAnalyzer class
# We need to import from the parent directory since core.py is a sibling file
import sys
from pathlib import Path

# Add parent directory to path to import core module
parent_dir = Path(__file__).parent.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

try:
    # Import from the core.py file in the analyzer directory
    from core import ConnascenceAnalyzer, main
    from .unified_imports import IMPORT_MANAGER, ImportResult, UnifiedImportManager
    __all__ = ["ConnascenceAnalyzer", "main", "IMPORT_MANAGER", "ImportResult", "UnifiedImportManager"]
except ImportError as e:
    # Fallback if imports fail
    print(f"Warning: Core analyzer import failed: {e}")
    try:
        from .unified_imports import IMPORT_MANAGER, ImportResult, UnifiedImportManager
        __all__ = ["IMPORT_MANAGER", "ImportResult", "UnifiedImportManager"]
    except ImportError:
        __all__ = []