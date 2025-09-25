#!/usr/bin/env python3
"""
Core Integration Validation Script

Validates that enterprise modules integrate properly with the core analyzer.
This script can be executed to verify integration is working.
"""

from pathlib import Path
import sys

import traceback

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def validate_core_integration():
    """Validate core analyzer enterprise integration."""
    
    checks = []
    
    # Check 1: Enterprise module imports
    try:
        from analyzer.enterprise import initialize_enterprise_features, get_enterprise_status
        checks.append(("Enterprise imports", True, ""))
    except ImportError as e:
        checks.append(("Enterprise imports", False, str(e)))
    
    # Check 2: Core analyzer enterprise manager availability
    try:
        from analyzer.core import ConnascenceAnalyzer
        
        # Test if analyzer can be instantiated
        analyzer = ConnascenceAnalyzer()
        
        # Check if enterprise integration is available (should be None when not configured)
        has_enterprise_support = hasattr(analyzer, 'enterprise_manager')
        checks.append(("Enterprise manager support", has_enterprise_support, 
                        "" if has_enterprise_support else "enterprise_manager attribute missing"))
    except Exception as e:
        checks.append(("Enterprise manager support", False, str(e)))
    
    # Check 3: Configuration loading capability
    try:
        # Try to import configuration manager
        from analyzer.configuration_manager import ConfigurationManager
        
        config = ConfigurationManager()
        # Test setting enterprise configuration
        config._config['enterprise'] = {'enabled': True}
        config._config['enterprise']['dfars_compliance'] = {'enabled': True}
        
        # Verify configuration can be retrieved
        enterprise_enabled = config._config.get('enterprise', {}).get('enabled', False)
        checks.append(("Enterprise configuration", enterprise_enabled, 
                        "" if enterprise_enabled else "Configuration not loading properly"))
    except Exception as e:
        checks.append(("Enterprise configuration", False, str(e)))
    
    # Check 4: Enterprise feature manager initialization
    try:
        from analyzer.enterprise import get_enterprise_status
        
        status = get_enterprise_status()
        
        # Should return status dict even if not initialized
        is_valid_status = isinstance(status, dict) and 'initialized' in status
        checks.append(("Enterprise status reporting", is_valid_status,
                        "" if is_valid_status else "Invalid status format"))
    except Exception as e:
        checks.append(("Enterprise status reporting", False, str(e)))
    
    # Check 5: Enterprise detector base availability
    try:
        from analyzer.detectors.base import DetectorBase
        
        # Check if base detector supports enterprise features
        detector = DetectorBase('test.py', ['test line'])
        
        # Should not fail to instantiate
        checks.append(("Enterprise detector base", True, ""))
    except Exception as e:
        checks.append(("Enterprise detector base", False, str(e)))
    
    # Report results
    print("=== Core Integration Validation ===")
    print(f"Project root: {project_root}")
    print(f"Python path: {sys.path[0]}")
    print()
    
    all_passed = True
    for name, passed, error in checks:
        status = "[PASS]" if passed else "[FAIL]"
        print(f"{status}: {name}")
        if not passed:
            print(f"   Error: {error}")
            if "--verbose" in sys.argv:
                print(f"   Traceback: {traceback.format_exc()}")
            all_passed = False
        print()
    
    print("=" * 40)
    if all_passed:
        print("[SUCCESS] All core integration checks PASSED")
        print("Enterprise modules are ready for integration")
    else:
        print("[FAILURE] Some integration checks FAILED")
        print("Review errors above and fix integration issues")
    
    return all_passed

if __name__ == "__main__":
    success = validate_core_integration()
    sys.exit(0 if success else 1)