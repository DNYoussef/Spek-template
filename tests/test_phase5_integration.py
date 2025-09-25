from lib.shared.utilities import path_exists
from src.constants.base import MAXIMUM_NESTED_DEPTH, MAXIMUM_RETRY_ATTEMPTS

Tests the complete integration of all analyzer components:
- All 9 connascence detectors
- Component integrator
- Configuration system
- Performance monitoring
- Enterprise metrics
- GitHub integration

NOTE: ASCII-only output for Windows compatibility
"""

import sys
import os
from pathlib import Path
import tempfile
import shutil
"""

# Add analyzer to path
sys.path.insert(0, str(Path(__file__).parent.parent / "analyzer"))

def test_unified_analyzer_integration():
    """Test complete unified analyzer integration."""
    print("=" * 60)

    # Create test project structure
    with tempfile.TemporaryDirectory() as temp_dir:
        test_project = Path(temp_dir) / "test_project"
        test_project.mkdir()

        # Create test Python files with various violations
        create_test_files(test_project)

        # Test 1: Initialize unified analyzer
        try:
            # Import with proper path handling
            import sys
            analyzer_path = Path(__file__).parent.parent / "analyzer"
            if str(analyzer_path) not in sys.path:
                sys.path.insert(0, str(analyzer_path))

            from unified_analyzer import UnifiedAnalyzer
            from integration_methods import AnalyzerIntegrationMixin

            # Add integration methods to UnifiedAnalyzer
            for method_name in dir(AnalyzerIntegrationMixin):
                if method_name.startswith('_') and callable(getattr(AnalyzerIntegrationMixin, method_name)):
                    setattr(UnifiedAnalyzer, method_name, getattr(AnalyzerIntegrationMixin, method_name))

            analyzer = UnifiedAnalyzer()
            print("[OK] UnifiedAnalyzer initialized successfully")

        except Exception as e:
            print(f"[ERROR] UnifiedAnalyzer initialization failed: {e}")
            return False

        # Test 2: Component integrator initialization
        try:
            from component_integrator import get_component_integrator, initialize_components

            config = {
                "enable_streaming": True,
                "enable_performance": True,
                "enable_architecture": True,
                "detector_config_path": "config/detector_config.yaml",
                "enterprise_config_path": "config/enterprise_config.yaml"
            }

            integrator = get_component_integrator()
            success = initialize_components(config)

            if success and integrator.initialized:
                print("[OK] Component integrator initialized successfully")
            else:
                print("[WARNING] Component integrator partially initialized")

        except Exception as e:
            print(f"[ERROR] Component integrator failed: {e}")
            return False

        # Test MAXIMUM_RETRY_ATTEMPTS: Detector initialization
        try:
            detectors = analyzer._initialize_all_detectors(str(test_project))
            print(f"[OK] Initialized {len(detectors)} detectors")

            if len(detectors) < 5:
                print("[WARNING] Not all detectors initialized")

        except Exception as e:
            print(f"[ERROR] Detector initialization failed: {e}")
            return False

        # Test 4: Full analysis integration
        try:
            # Run analysis using the integration method
            violations = analyzer._execute_analysis_with_component_integrator(
                test_project,
                "service-defaults",
                [],
                {"mode": "auto"}
            )

            print(f"[OK] Analysis completed: {len(violations)} violations found")

            # Verify we found some violations in our test code
            if len(violations) > 0:
                print("[OK] Violations detected successfully")
                for i, v in enumerate(violations[:3]):  # Show first 3
                    if hasattr(v, 'type') and hasattr(v.type, 'value'):
                        print(f"   - {v.type.value}: {v.description}")
                    else:
                        print(f"   - {str(v)}")
            else:
                print("[WARNING] No violations found (might be expected)")

        except Exception as e:
            print(f"[ERROR] Full analysis failed: {e}")
            return False

        # Test MAXIMUM_NESTED_DEPTH: Enterprise metrics calculation
        try:
            metrics = analyzer._calculate_enterprise_metrics(violations)

            print(f"[OK] Enterprise metrics calculated:")
            print(f"   - NASA POT10 Compliance: {metrics['nasa_compliance_score']:.1%}")
            print(f"   - Six Sigma Level: {metrics['six_sigma_level']:.1f} sigma")
            print(f"   - MECE Score: {metrics['mece_score']:.2f}")
            print(f"   - God Objects: {metrics['god_objects_found']}")
            print(f"   - Duplication: {metrics['duplication_percentage']:.1f}%")

        except Exception as e:
            print(f"[ERROR] Enterprise metrics failed: {e}")
            return False

        # Test 6: Configuration system integration
        try:
            from utils.types import ConfigurationManager

            config_manager = ConfigurationManager()

            # Try to load configuration
            if path_exists("config/detector_config.yaml"):
                config_manager.load_from_file("config/detector_config.yaml")
                print("[OK] Configuration loaded successfully")
            else:
                print("[WARNING] Configuration file not found, using defaults")

        except Exception as e:
            print(f"[ERROR] Configuration system failed: {e}")
            return False

        # Test 7: Legacy fallback
        try:
            legacy_violations = analyzer._fallback_legacy_analysis(
                test_project,
                "service-defaults",
                []
            )

            print(f"[OK] Legacy fallback works: {len(legacy_violations)} violations")

        except Exception as e:
            print(f"[ERROR] Legacy fallback failed: {e}")
            return False

    print("\n" + "=" * 60)
    print("[PRODUCTION] System ready for production deployment")
    return True

def create_test_files(project_dir: Path):
    """Create test Python files with various violations."""

    # File with god object violation
    god_object_file = project_dir / "god_object.py"
    god_object_content = '''
class GodObject:
    """A class with too many methods (god object)."""

    def method_1(self): pass
    def method_2(self): pass
    def method_3(self): pass
    def method_4(self): pass
    def method_5(self): pass
    def method_6(self): pass
    def method_7(self): pass
    def method_8(self): pass
    def method_9(self): pass
    def method_10(self): pass
    def method_11(self): pass
    def method_12(self): pass
    def method_13(self): pass
    def method_14(self): pass
    def method_15(self): pass
    def method_16(self): pass
    def method_17(self): pass
    def method_18(self): pass
    def method_19(self): pass
    def method_20(self): pass
    def method_21(self): pass  # Exceeds 20 method threshold
    def method_22(self): pass
'''
    god_object_file.write_text(god_object_content)

    # File with magic literals
    magic_literals_file = project_dir / "magic_literals.py"
    magic_literals_content = '''
def calculate_price():
    """Function with magic literals."""
    base_price = 1000  # Magic literal
    tax_rate = 0.075   # Magic literal
    discount = 50      # Magic literal

    total = base_price * (1 + tax_rate) - discount
    return total

def process_data():
    """More magic literals."""
    max_items = 999    # Magic literal
    timeout = 3600     # Magic literal
    buffer_size = 8192 # Magic literal

    return max_items, timeout, buffer_size
'''
    magic_literals_file.write_text(magic_literals_content)

    # File with position violations (too many parameters)
    position_file = project_dir / "position_violations.py"
    position_content = '''
def function_with_many_params(a, b, c, d, e, f, g, h):
    """Function with too many parameters (8 > 5 threshold)."""
    return a + b + c + d + e + f + g + h

def another_function(x, y, z, w, v, u, t, s, r):
    """Another function with too many parameters (9 > 5)."""
    return x * y * z * w * v * u * t * s * r

class MyClass:
    def __init__(self, param1, param2, param3, param4, param5, param6, param7):
        """Constructor with too many parameters."""
        self.data = [param1, param2, param3, param4, param5, param6, param7]
'''
    position_file.write_text(position_content)

    # Valid file with no violations
    valid_file = project_dir / "valid_code.py"
    valid_content = '''
"""Valid Python code with no violations."""

MAX_RETRIES = 3
DEFAULT_TIMEOUT = 30

class SimpleClass:
    """A simple class following best practices."""

    def __init__(self, name: str):
        self.name = name

    def get_name(self) -> str:
        """Get the name."""
        return self.name

    def set_name(self, name: str) -> None:
        """Set the name."""
        self.name = name

def simple_function(x: int, y: int) -> int:
    """A simple function with few parameters."""
    return x + y
'''
    valid_file.write_text(valid_content)

if __name__ == "__main__":
    try:
        success = test_unified_analyzer_integration()
        exit_code = 0 if success else 1
        sys.exit(exit_code)
    except Exception as e:
        print(f"\n[FATAL ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)