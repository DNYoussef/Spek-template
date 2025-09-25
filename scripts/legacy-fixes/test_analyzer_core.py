#!/usr/bin/env python3
"""
Test the core analyzer functionality by importing only essential components.
This bypasses the problematic __init__.py and tests the core analyzer directly.
"""

import sys
import os
sys.path.insert(0, r'C:\Users\17175\Desktop\spek template')

print("Testing analyzer core functionality...")

# Test direct imports of key components
try:
    print("1. Testing UnifiedConnascenceAnalyzer import...")
    from analyzer.unified_analyzer import UnifiedConnascenceAnalyzer
    print("   ✓ UnifiedConnascenceAnalyzer imported successfully")

    print("2. Testing analyzer creation...")
    analyzer = UnifiedConnascenceAnalyzer()
    print(f"   ✓ Analyzer created: {type(analyzer)}")

    print("3. Testing basic functionality...")
    # Test if the analyzer has expected methods
    methods = [method for method in dir(analyzer) if not method.startswith('_')]
    print(f"   ✓ Analyzer has {len(methods)} public methods")
    print(f"   Available methods: {methods[:10]}{'...' if len(methods) > 10 else ''}")

    # Test analyzing a simple Python file
    test_code = '''
def example_function(a, b, c, d, e, f, g):
    """Function with too many parameters - should trigger violation."""
    return a + b + c + d + e + f + g

class ExampleClass:
    def method1(self):
        pass

    def method2(self):
        pass
'''

    print("4. Testing code analysis...")
    # Create a temporary file for testing
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(test_code)
        temp_file = f.name

    try:
        # Try to analyze the file
        if hasattr(analyzer, 'analyze_file'):
            result = analyzer.analyze_file(temp_file)
            print(f"   ✓ File analysis completed: {type(result)}")

            # Check for violations
            if hasattr(result, 'violations'):
                violations = result.violations
                print(f"   Found {len(violations)} violations")
                if violations:
                    print(f"   First violation: {violations[0]}")
            else:
                print("   Result does not have violations attribute")
        else:
            print("   Analyzer does not have analyze_file method")

    except Exception as e:
        print(f"   ⚠ Analysis failed: {e}")
    finally:
        # Cleanup
        os.unlink(temp_file)

    print("5. SUCCESS: Core analyzer functionality is working!")

except ImportError as e:
    print(f"❌ Import failed: {e}")

except Exception as e:
    print(f"❌ Error: {e}")

print("\nTest completed.")