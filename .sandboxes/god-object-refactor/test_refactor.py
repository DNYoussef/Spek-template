"""
Test the refactored analyzer to ensure it maintains functionality
while eliminating the god object anti-pattern.
"""

import sys
import ast
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from refactored_analyzer import (
    AnalyzerConfiguration,
    AnalysisCache,
    DetectorManager,
    FileProcessor,
    ResultAggregator,
    RefactoredAnalyzer
)


def test_configuration_manager():
    """Test configuration manager - should have <15 methods."""
    print("TEST 1: Configuration Manager")
    print("-" * 40)

    config = AnalyzerConfiguration()

    # Count methods
    methods = [m for m in dir(config) if not m.startswith('_') and callable(getattr(config, m))]
    print(f"Public methods: {len(methods)} (MAX: 15)")
    print(f"Methods: {methods}")

    # Test functionality
    assert config.get('max_file_size') == 1_000_000
    config.set('custom_key', 'custom_value')
    assert config.get('custom_key') == 'custom_value'
    assert config.validate() == True

    print("Configuration Manager: PASS")
    return len(methods) <= 15


def test_cache_manager():
    """Test cache manager - should have <15 methods."""
    print("\nTEST 2: Cache Manager")
    print("-" * 40)

    cache = AnalysisCache(max_size=3)

    # Count methods
    methods = [m for m in dir(cache) if not m.startswith('_') and callable(getattr(cache, m))]
    print(f"Public methods: {len(methods)} (MAX: 15)")
    print(f"Methods: {methods}")

    # Test functionality
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    assert cache.get('key1') == 'value1'
    assert cache.size() == 2

    # Test eviction
    cache.set('key3', 'value3')
    cache.set('key4', 'value4')  # Should evict least used
    assert cache.size() == 3

    print("Cache Manager: PASS")
    return len(methods) <= 15


def test_detector_manager():
    """Test detector manager - should have <15 methods."""
    print("\nTEST 3: Detector Manager")
    print("-" * 40)

    detector_mgr = DetectorManager()

    # Count methods
    methods = [m for m in dir(detector_mgr) if not m.startswith('_') and callable(getattr(detector_mgr, m))]
    print(f"Public methods: {len(methods)} (MAX: 15)")
    print(f"Methods: {methods}")

    # Test functionality
    assert len(detector_mgr.get_all_detectors()) > 0
    detector_mgr.register_detector('custom', 'CustomDetector')
    assert 'custom' in detector_mgr.get_all_detectors()
    detector_mgr.unregister_detector('custom')
    assert 'custom' not in detector_mgr.get_all_detectors()

    print("Detector Manager: PASS")
    return len(methods) <= 15


def test_file_processor():
    """Test file processor - should have <15 methods."""
    print("\nTEST 4: File Processor")
    print("-" * 40)

    config = AnalyzerConfiguration()
    file_proc = FileProcessor(config)

    # Count methods
    methods = [m for m in dir(file_proc) if not m.startswith('_') and callable(getattr(file_proc, m))]
    print(f"Public methods: {len(methods)} (MAX: 15)")
    print(f"Methods: {methods}")

    # Test functionality
    test_file = Path(__file__)
    assert file_proc.should_process(test_file) == True

    # Test AST parsing
    source = "x = 42"
    tree = file_proc.parse_ast(source, "test.py")
    assert tree is not None

    print("File Processor: PASS")
    return len(methods) <= 15


def test_result_aggregator():
    """Test result aggregator - should have <15 methods."""
    print("\nTEST 5: Result Aggregator")
    print("-" * 40)

    aggregator = ResultAggregator()

    # Count methods
    methods = [m for m in dir(aggregator) if not m.startswith('_') and callable(getattr(aggregator, m))]
    print(f"Public methods: {len(methods)} (MAX: 15)")
    print(f"Methods: {methods}")

    # Test functionality
    aggregator.add_result('file1.py', [{'type': 'test'}, {'type': 'test2'}])
    aggregator.add_result('file2.py', [{'type': 'test'}])

    summary = aggregator.aggregate()
    assert summary['total_files'] == 2
    assert summary['total_violations'] == 3

    top = aggregator.get_top_violators(1)
    assert len(top) == 1
    assert top[0]['count'] == 2

    print("Result Aggregator: PASS")
    return len(methods) <= 15


def test_main_analyzer():
    """Test main analyzer - should have <15 methods."""
    print("\nTEST 6: Main Analyzer")
    print("-" * 40)

    analyzer = RefactoredAnalyzer()

    # Count methods
    methods = [m for m in dir(analyzer) if not m.startswith('_') and callable(getattr(analyzer, m))]
    print(f"Public methods: {len(methods)} (MAX: 15)")
    print(f"Methods: {methods}")

    # Test that it has the main methods
    assert hasattr(analyzer, 'analyze')
    assert hasattr(analyzer, 'get_statistics')

    print("Main Analyzer: PASS")
    return len(methods) <= 15


def count_total_methods():
    """Count methods across all classes."""
    print("\nTOTAL METHOD COUNT")
    print("-" * 40)

    classes = [
        ('AnalyzerConfiguration', AnalyzerConfiguration()),
        ('AnalysisCache', AnalysisCache()),
        ('DetectorManager', DetectorManager()),
        ('FileProcessor', FileProcessor(AnalyzerConfiguration())),
        ('ResultAggregator', ResultAggregator()),
        ('RefactoredAnalyzer', RefactoredAnalyzer())
    ]

    total_methods = 0
    for name, instance in classes:
        methods = [m for m in dir(instance) if not m.startswith('_') and callable(getattr(instance, m))]
        print(f"{name}: {len(methods)} methods")
        total_methods += len(methods)

    print(f"\nTotal methods across all classes: {total_methods}")
    print(f"Average methods per class: {total_methods / len(classes):.1f}")

    return total_methods


def main():
    """Run all tests."""
    print("=" * 50)
    print("GOD OBJECT REFACTORING TESTS")
    print("=" * 50)
    print()

    tests_passed = 0
    total_tests = 6

    if test_configuration_manager():
        tests_passed += 1

    if test_cache_manager():
        tests_passed += 1

    if test_detector_manager():
        tests_passed += 1

    if test_file_processor():
        tests_passed += 1

    if test_result_aggregator():
        tests_passed += 1

    if test_main_analyzer():
        tests_passed += 1

    # Count total methods
    total_methods = count_total_methods()

    print("\n" + "=" * 50)
    print(f"RESULTS: {tests_passed}/{total_tests} tests passed")
    print("=" * 50)

    if tests_passed == total_tests:
        print("\nREFACTORING SUCCESSFUL!")
        print("God object eliminated:")
        print("  - Original: 79 methods in 1 class")
        print(f"  - Refactored: {total_methods} methods across 6 classes")
        print("  - Each class has <15 methods (Single Responsibility)")
        print("  - Clear separation of concerns achieved")
    else:
        print("\nREFACTORING NEEDS WORK")
        print("Some tests failed.")

    return tests_passed == total_tests


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)