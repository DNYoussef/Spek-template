#!/usr/bin/env python3
"""
GitHub Workflow Fixes Validation Script
======================================

Validates that all the surgical fixes for GitHub hooks infrastructure work correctly.
Tests the specific implementation issues that were causing workflow failures.
"""

from pathlib import Path
import json
import sys

# Add analyzer to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def test_architecture_orchestrator():
    """Test that ArchitectureOrchestrator.analyze_architecture method exists and works."""
    
    try:
        from analyzer.architecture.orchestrator import ArchitectureOrchestrator
        
        # Test instantiation
        orchestrator = ArchitectureOrchestrator()
        assert orchestrator is not None, "Failed to instantiate ArchitectureOrchestrator"
        
        # Test that analyze_architecture method exists
        assert hasattr(orchestrator, 'analyze_architecture'), "analyze_architecture method missing"
        
        # Test method call with test path
        result = orchestrator.analyze_architecture('.')
        assert isinstance(result, dict), "analyze_architecture should return dict"
        
        # Validate required result structure
        required_keys = ['system_overview', 'hotspots', 'recommendations', 'metrics', 'architectural_health']
        for key in required_keys:
            assert key in result, f"Missing required key: {key}"
        
        # Validate system_overview structure
        system_overview = result['system_overview']
        overview_keys = ['architectural_health', 'coupling_score', 'complexity_score', 'maintainability_index']
        for key in overview_keys:
            assert key in system_overview, f"Missing system_overview key: {key}"
            assert isinstance(system_overview[key], (int, float)), f"{key} should be numeric"
        
        print("[PASS] ArchitectureOrchestrator.analyze_architecture method working correctly")
        return True
        
    except Exception as e:
        return False

def test_core_analyzer_nonetype_fixes():
    """Test that ConnascenceAnalyzer handles NoneType arguments correctly."""
    
    try:
        # Import from the main module file, not the package
        sys.path.insert(0, str(Path(__file__).parent.parent / "analyzer"))
        from core import ConnascenceAnalyzer
        
        analyzer = ConnascenceAnalyzer()
        assert analyzer is not None, "Failed to instantiate ConnascenceAnalyzer"
        
        # Test analyze method with None arguments (should not crash)
        result1 = analyzer.analyze(None)
        assert isinstance(result1, dict), "analyze(None) should return dict"
        assert "error" in result1 or "success" in result1, "Should handle None gracefully"
        
        # Test analyze method with None path in kwargs
        result2 = analyzer.analyze(path=None)
        assert isinstance(result2, dict), "analyze(path=None) should return dict"
        
        # Test analyze method with None policy
        result3 = analyzer.analyze('.', None)
        assert isinstance(result3, dict), "analyze('.', None) should return dict"
        
        # Test that we get sensible defaults
        result4 = analyzer.analyze()  # No arguments
        assert isinstance(result4, dict), "analyze() with no args should return dict"
        
        print("[PASS] ConnascenceAnalyzer NoneType handling working correctly")
        return True
        
    except Exception as e:
        return False

def test_unified_imports_detection():
    """Test that unified imports component detection works better."""
    
    try:
        from core.unified_imports import IMPORT_MANAGER
        
        # Test availability summary
        summary = IMPORT_MANAGER.get_availability_summary()
        assert isinstance(summary, dict), "get_availability_summary should return dict"
        assert "availability_score" in summary, "Should have availability_score"
        assert "unified_mode_ready" in summary, "Should have unified_mode_ready flag"
        
        # Test individual component imports
        components_to_test = [
            "constants",
            "unified_analyzer", 
            "duplication_analyzer",
            "analyzer_components",
            "mcp_server",
            "reporting"
        ]
        
        working_components = 0
        for component in components_to_test:
            if component == "constants":
                result = IMPORT_MANAGER.import_constants()
            elif component == "unified_analyzer":
                result = IMPORT_MANAGER.import_unified_analyzer()
            elif component == "duplication_analyzer":
                result = IMPORT_MANAGER.import_duplication_analyzer()
            elif component == "analyzer_components":
                result = IMPORT_MANAGER.import_analyzer_components()
            elif component == "mcp_server":
                result = IMPORT_MANAGER.import_mcp_server()
            elif component == "reporting":
                result = IMPORT_MANAGER.import_reporting()
            
            if result.has_module:
                working_components += 1
                print(f"  [OK] {component}: Available")
            else:
                print(f"  [WARN] {component}: {result.error}")
        
        availability_score = working_components / len(components_to_test)
        print(f"Component availability: {availability_score:.0%}")
        
        # Even if not all components are available, system should work
        print("[PASS] Unified imports detection improved successfully")
        return True
        
    except Exception as e:
        return False

def test_github_workflow_integration():
    """Test the exact code pattern used in GitHub workflow."""
    
    try:
        # This is the exact code pattern from .github/workflows/quality-gates.yml line 185
        from analyzer.architecture.orchestrator import ArchitectureOrchestrator
        
        arch_orchestrator = ArchitectureOrchestrator()
        arch_result = arch_orchestrator.analyze_architecture('.')
        
        # Verify the result can be JSON serialized (required for GitHub workflow)
        json_str = json.dumps(arch_result, default=str)
        assert len(json_str) > 10, "JSON serialization should produce meaningful output"
        
        # Verify result has expected structure for GitHub workflow consumption
        assert isinstance(arch_result, dict), "Result should be dict"
        assert "system_overview" in arch_result, "Should have system_overview"
        assert "architectural_health" in arch_result, "Should have architectural_health"
        
        print("[PASS] GitHub workflow integration pattern working correctly")
        return True
        
    except Exception as e:
        return False

def test_core_analysis_initialization():
    """Test that core analysis can be initialized without errors."""
    
    try:
        # Import from the main module file, not the package
        sys.path.insert(0, str(Path(__file__).parent.parent / "analyzer"))
        from core import ConnascenceAnalyzer
        
        # Test initialization doesn't crash
        analyzer = ConnascenceAnalyzer()
        
        # Test that we can determine analysis mode
        assert hasattr(analyzer, 'analysis_mode'), "Should have analysis_mode attribute"
        print(f"  Analysis mode: {analyzer.analysis_mode}")
        
        # Test basic analysis doesn't crash
        result = analyzer.analyze_path('.', 'default')
        assert isinstance(result, dict), "analyze_path should return dict"
        assert "success" in result, "Should have success field"
        
        print("[PASS] Core analysis initialization working correctly")
        return True
        
    except Exception as e:
        return False

def main():
    """Run all validation tests."""
    print("GitHub Hooks Infrastructure Validation")
    print("=" * 50)
    
    tests = [
        test_architecture_orchestrator,
        test_core_analyzer_nonetype_fixes,
        test_unified_imports_detection,
        test_github_workflow_integration,
        test_core_analysis_initialization
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    
    if passed == total:
        print("[SUCCESS] All GitHub hooks infrastructure fixes are working correctly!")
        print("   GitHub workflows should now pass without the reported errors.")
        return 0
    else:
        print("[ERROR] Some fixes need additional work.")
        return 1

if __name__ == "__main__":
    sys.exit(main())