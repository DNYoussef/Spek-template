#!/usr/bin/env python3
"""
GitHub Workflow Integration Test
===============================

Tests the exact pattern used in the GitHub workflow to ensure it works correctly.
This directly tests the line that was failing: arch_orchestrator.analyze_architecture('.')
"""

from pathlib import Path
import json
import sys

# Add analyzer to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def test_github_workflow_pattern():
    """Test the exact GitHub workflow pattern that was failing."""
    print("arch_orchestrator.analyze_architecture('.')")
    print()
    
    try:
        # This is the exact import and call pattern from the GitHub workflow
        from analyzer.architecture.orchestrator import ArchitectureOrchestrator
        
        # Line 184: arch_orchestrator = ArchitectureOrchestrator()  
        arch_orchestrator = ArchitectureOrchestrator()
        print("[OK] ArchitectureOrchestrator instantiated successfully")
        
        # Line 185: arch_result = arch_orchestrator.analyze_architecture('.')
        arch_result = arch_orchestrator.analyze_architecture('.')
        print("[OK] analyze_architecture method called successfully")
        
        # Verify the result structure matches what the GitHub workflow expects
        print("\nValidating result structure...")
        assert isinstance(arch_result, dict), "Result must be a dictionary"
        print("[OK] Result is a dictionary")
        
        required_keys = ['system_overview', 'hotspots', 'recommendations', 'metrics']
        for key in required_keys:
            assert key in arch_result, f"Missing required key: {key}"
            print(f"[OK] Has required key: {key}")
        
        # Verify system_overview structure (used by GitHub workflow)
        system_overview = arch_result['system_overview']
        overview_keys = ['architectural_health', 'coupling_score', 'complexity_score', 'maintainability_index']
        for key in overview_keys:
            assert key in system_overview, f"Missing system_overview key: {key}"
            assert isinstance(system_overview[key], (int, float)), f"{key} must be numeric"
            print(f"[OK] system_overview.{key}: {system_overview[key]}")
        
        # Test JSON serialization (required for GitHub workflow artifact saving)
        json_str = json.dumps(arch_result, default=str)
        assert len(json_str) > 50, "JSON output too short"
        print(f"[OK] JSON serialization successful, length: {len(json_str)} chars")
        
        # Test that we can parse it back
        parsed = json.loads(json_str)
        assert parsed['system_overview']['architectural_health'] == arch_result['system_overview']['architectural_health']
        print("[OK] JSON round-trip successful")
        
        print(f"\n[SUCCESS] GitHub workflow pattern working perfectly!")
        print(f"The failing line 185 in quality-gates.yml is now fixed.")
        print(f"Expected output structure:")
        print(f"  - system_overview: {len(system_overview)} metrics")
        print(f"  - hotspots: {len(arch_result.get('hotspots', []))} identified")
        print(f"  - recommendations: {len(arch_result.get('recommendations', []))} provided")
        print(f"  - architectural_health: {system_overview['architectural_health']:.3f}")
        
        return True
        
    except Exception as e:
        print(f"[FAIL] GitHub workflow pattern failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_nonetype_resilience():
    """Test that the system handles NoneType arguments gracefully."""
    
    try:
        from analyzer.architecture.orchestrator import ArchitectureOrchestrator
        
        orchestrator = ArchitectureOrchestrator()
        
        # Test with None path (should not crash)
        try:
            result = orchestrator.analyze_architecture(None)
            print("[FAIL] Should have failed with None path")
            return False
        except AssertionError:
            print("[OK] Properly rejects None path with assertion")
        except Exception as e:
            print(f"[OK] Properly handles None path with: {e}")
        
        # Test with empty string (should work)
        result = orchestrator.analyze_architecture("")
        assert isinstance(result, dict), "Empty string should return fallback result"
        print("[OK] Handles empty string path gracefully")
        
        # Test with non-existent path (should return fallback)
        result = orchestrator.analyze_architecture("/nonexistent/path")
        assert isinstance(result, dict), "Non-existent path should return fallback result"
        assert "fallback_mode" in result or "error" in result, "Should indicate fallback or error"
        print("[OK] Handles non-existent path gracefully")
        
        print("[SUCCESS] NoneType resilience working correctly")
        return True
        
    except Exception as e:
        return False

def test_component_availability():
    """Test that components are available or gracefully degrade."""
    
    try:
        from analyzer.architecture.orchestrator import ArchitectureOrchestrator
        
        orchestrator = ArchitectureOrchestrator()
        
        # Test analyzer initialization
        analyzers = orchestrator._initialize_analyzers()
        print(f"[INFO] Initialized {len(analyzers)} analyzer components")
        
        # Even if no analyzers available, should not crash
        result = orchestrator.orchestrate_analysis_phases(
            project_path=Path('.'),
            policy_preset='service-defaults',
            analyzers={}
        )
        
        assert isinstance(result, dict), "Should return result even with no analyzers"
        print("[OK] Graceful degradation with no analyzers")
        
        print("[SUCCESS] Component availability handling working")
        return True
        
    except Exception as e:
        return False

def main():
    """Run GitHub workflow validation tests."""
    print("GitHub Workflow Surgical Fixes Validation")
    print("=" * 50)
    print("1. Missing analyze_architecture method")
    print("2. NoneType error handling") 
    print("3. Component availability detection")
    print()
    
    tests = [
        test_github_workflow_pattern,
        test_nonetype_resilience,
        test_component_availability
    ]
    
    passed = 0
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    
    if passed == len(tests):
        print("\n[SUCCESS] All GitHub workflow fixes are working!")
        print("[OK] analyze_architecture method implemented and working")
        print("[OK] NoneType errors fixed with proper validation")
        print("[OK] Component detection improved with fallback handling")
        print("[OK] GitHub workflow quality-gates.yml should now pass")
        return 0
    else:
        print("[ERROR] Some GitHub workflow issues remain")
        return 1

if __name__ == "__main__":
    sys.exit(main())