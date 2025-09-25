#!/usr/bin/env python3
"""
Test the analyzer by directly loading the unified_analyzer module
without triggering the package __init__.py file.
"""

import sys
import os
import importlib.util

# Set up the path
sys.path.insert(0, r'C:\Users\17175\Desktop\spek template')

print("Testing direct analyzer import...")

# Load the unified_analyzer module directly
analyzer_path = r'C:\Users\17175\Desktop\spek template\analyzer\unified_analyzer.py'

try:
    # Load the module spec
    spec = importlib.util.spec_from_file_location("unified_analyzer", analyzer_path)
    if spec is None:
        print("Failed to create module spec")
        sys.exit(1)

    # Create the module
    unified_analyzer_module = importlib.util.module_from_spec(spec)

    # Add necessary path setup for imports within the module
    if 'analyzer' not in sys.modules:
        # Create a dummy analyzer package module to avoid import errors
        analyzer_package = type(sys)('analyzer')
        analyzer_package.__path__ = [os.path.dirname(analyzer_path)]
        sys.modules['analyzer'] = analyzer_package

    # Execute the module
    print("Loading unified_analyzer module...")
    spec.loader.exec_module(unified_analyzer_module)

    print("SUCCESS: unified_analyzer module loaded!")

    # Try to get the UnifiedConnascenceAnalyzer class
    if hasattr(unified_analyzer_module, 'UnifiedConnascenceAnalyzer'):
        UnifiedConnascenceAnalyzer = getattr(unified_analyzer_module, 'UnifiedConnascenceAnalyzer')
        print(f"Found UnifiedConnascenceAnalyzer: {UnifiedConnascenceAnalyzer}")

        # Try to create an instance
        print("Creating analyzer instance...")
        try:
            analyzer = UnifiedConnascenceAnalyzer()
            print(f"SUCCESS: Analyzer created! Type: {type(analyzer)}")

            # Test basic methods
            methods = [method for method in dir(analyzer) if not method.startswith('_')]
            print(f"Available methods ({len(methods)}): {methods}")

        except Exception as e:
            print(f"Failed to create analyzer instance: {e}")
    else:
        print("UnifiedConnascenceAnalyzer class not found in module")
        print(f"Available attributes: {[attr for attr in dir(unified_analyzer_module) if not attr.startswith('_')]}")

except Exception as e:
    print(f"Error loading module: {e}")
    import traceback
    traceback.print_exc()

print("Test completed.")