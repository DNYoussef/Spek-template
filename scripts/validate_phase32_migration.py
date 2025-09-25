#!/usr/bin/env python3
"""
Phase 3.2 Migration Validation
Validates that the god object elimination was successful.
"""

from pathlib import Path
import sys

import importlib.util

def check_file_sizes():
    """Check that god object was successfully reduced."""
    print("File Size Validation")
    print("=" * 60)

    new_file = Path("analyzer/unified_analyzer.py")
    backup_file = Path("analyzer/unified_analyzer_god_object_backup.py")

    if new_file.exists() and backup_file.exists():
        new_lines = len(new_file.read_text().splitlines())
        old_lines = len(backup_file.read_text().splitlines())
        reduction = ((old_lines - new_lines) / old_lines) * 100

        print(f"Old god object: {old_lines} LOC")
        print(f"New delegation: {new_lines} LOC")
        print(f"Reduction: {reduction:.1f}%")
        print(f"Status: {'PASS' if reduction > 85 else 'FAIL'} (target: >85%)")
        return reduction > 85
    return False

def test_imports():
    """Test that all imports still work."""
    print("\nImport Validation")
    print("=" * 60)

    test_cases = [
        ("analyzer.unified_analyzer", "UnifiedConnascenceAnalyzer"),
        ("analyzer.unified_analyzer", "get_analyzer"),
    ]

    all_passed = True
    for module_name, class_name in test_cases:
        try:
            module = importlib.import_module(module_name)
            if hasattr(module, class_name):
                print(f"PASS: {module_name}.{class_name}")
            else:
                print(f"FAIL: {module_name}.{class_name} not found")
                all_passed = False
        except Exception as e:
            print(f"FAIL: {module_name}.{class_name} - {e}")
            all_passed = False

    return all_passed

def test_analyzer_functionality():
    """Test that analyzer still functions."""
    print("\nFunctionality Validation")
    print("=" * 60)

    try:
        from analyzer.unified_analyzer import UnifiedConnascenceAnalyzer

        analyzer = UnifiedConnascenceAnalyzer()

        checks = [
            ("Analyzer creation", analyzer is not None),
            ("Has orchestrator", hasattr(analyzer, 'orchestrator')),
            ("Has detector", hasattr(analyzer, 'detector')),
            ("Has classifier", hasattr(analyzer, 'classifier')),
            ("Has reporter", hasattr(analyzer, 'reporter')),
            ("Has metrics_calculator", hasattr(analyzer, 'metrics_calculator')),
            ("Has analyze_project", hasattr(analyzer, 'analyze_project')),
            ("Has analyze_file", hasattr(analyzer, 'analyze_file')),
            ("Architecture available", hasattr(analyzer, '_analyzer') and analyzer._analyzer is not None),
        ]

        all_passed = True
        for check_name, result in checks:
            status = "PASS" if result else "FAIL"
            print(f"{status}: {check_name}")
            if not result:
                all_passed = False

        return all_passed
    except Exception as e:
        return False

def test_delegation():
    """Test that delegation to refactored architecture works."""
    print("\nDelegation Validation")
    print("=" * 60)

    try:
        from analyzer.unified_analyzer import UnifiedConnascenceAnalyzer

        analyzer = UnifiedConnascenceAnalyzer()

        methods_to_test = [
            'analyze_project',
            'analyze_file',
            'get_component_status',
            'get_architecture_components',
            'validateSafetyCompliance',
            'generateConnascenceReport',
        ]

        all_passed = True
        for method in methods_to_test:
            has_method = hasattr(analyzer, method)
            is_callable = callable(getattr(analyzer, method, None))
            status = "PASS" if (has_method and is_callable) else "FAIL"
            print(f"{status}: {method} - callable={is_callable}")
            if not (has_method and is_callable):
                all_passed = False

        return all_passed
    except Exception as e:
        return False

def validate_architecture():
    """Validate refactored architecture exists."""
    print("\nArchitecture Validation")
    print("=" * 60)

    architecture_files = [
        "analyzer/architecture/refactored_unified_analyzer.py",
        "analyzer/architecture/connascence_orchestrator.py",
        "analyzer/architecture/connascence_detector.py",
        "analyzer/architecture/connascence_classifier.py",
        "analyzer/architecture/connascence_reporter.py",
        "analyzer/architecture/connascence_metrics.py",
        "analyzer/architecture/connascence_fixer.py",
        "analyzer/architecture/connascence_cache.py",
    ]

    all_exist = True
    for file_path in architecture_files:
        exists = Path(file_path).exists()
        status = "PASS" if exists else "FAIL"
        print(f"{status}: {Path(file_path).name}")
        if not exists:
            all_exist = False

    return all_exist

def main():
    """Run all validation checks."""
    print("\n" + "=" * 60)
    print("PHASE 3.2 MIGRATION VALIDATION")
    print("God Object Elimination - Delegation Architecture")
    print("=" * 60 + "\n")

    results = []

    results.append(("File Size Reduction", check_file_sizes()))
    results.append(("Import Compatibility", test_imports()))
    results.append(("Analyzer Functionality", test_analyzer_functionality()))
    results.append(("Method Delegation", test_delegation()))
    results.append(("Architecture Files", validate_architecture()))

    print("\n" + "=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)

    for test_name, passed in results:
        status = "PASS" if passed else "FAIL"

    all_passed = all(passed for _, passed in results)

    print("\n" + "=" * 60)
    if all_passed:
        print("STATUS: ALL CHECKS PASSED")
        print("Phase 3.2 migration successful!")
        print("=" * 60)
        return 0
    else:
        print("STATUS: SOME CHECKS FAILED")
        print("Please review failures above")
        print("=" * 60)
        return 1

if __name__ == "__main__":
    sys.exit(main())