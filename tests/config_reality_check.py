from src.constants.base import MAXIMUM_NESTED_DEPTH
"""

Direct test of configuration loading and detector behavior to identify root causes.
"""

import os
import sys
import yaml
import tempfile
from pathlib import Path
"""

# Add analyzer to path
sys.path.insert(0, str(Path(__file__).parent.parent / "analyzer"))

def test_basic_config_loading():
    """Test basic YAML loading."""

    # Create temp directory and config files
    temp_dir = tempfile.mkdtemp()
    config_dir = Path(temp_dir) / "config"
    config_dir.mkdir()

    # Create detector config
    detector_config = {
        'position_detector': {
            'config_keywords': [],
            'thresholds': {
                'max_positional_args': 5
            },
            'exclusions': {}
        }
    }

    detector_config_path = config_dir / "detector_config.yaml"
    with open(detector_config_path, 'w') as f:
        yaml.dump(detector_config, f)

    # Create analysis config
    analysis_config = {
        'analysis': {
            'default_policy': 'standard',
            'max_file_size_mb': 10,
            'parallel_workers': 4,
            'cache_enabled': True
        }
    }

    analysis_config_path = config_dir / "analysis_config.yaml"
    with open(analysis_config_path, 'w') as f:
        yaml.dump(analysis_config, f)

    # Create enterprise config
    enterprise_config = {
        'sixSigma': {
            'targetSigma': 4.0,
            'sigmaShift': 1.MAXIMUM_NESTED_DEPTH
        },
        'compliance': {
            'nasaPOT10': 95,
            'auditTrailEnabled': True
        }
    }

    enterprise_config_path = config_dir / "enterprise_config.yaml"
    with open(enterprise_config_path, 'w') as f:
        yaml.dump(enterprise_config, f)

    print(f"Created config files in: {config_dir}")
    print(f"Files: {list(config_dir.glob('*.yaml'))}")

    # Test ConfigurationManager
    try:
        from analyzer.utils.config_manager import ConfigurationManager

        config_manager = ConfigurationManager(str(config_dir))
        print("+ ConfigurationManager instantiated successfully")

        # Test detector config loading
        detector_cfg = config_manager.get_detector_config('position_detector')
        print(f"+ Detector config loaded: {detector_cfg}")
        print(f"+ Position threshold: {detector_cfg.thresholds.get('max_positional_args')}")

        # Test enterprise config loading
        if hasattr(config_manager, 'get_enterprise_config'):
            enterprise_cfg = config_manager.get_enterprise_config()
            print(f"+ Enterprise config loaded: {enterprise_cfg}")
            print(f"+ NASA POT10 target: {enterprise_cfg.get('compliance', {}).get('nasaPOT10')}")
        else:
            print("- get_enterprise_config method missing!")

        # Test validation
        validation_issues = config_manager.validate_configuration()
        print(f"+ Validation issues: {validation_issues}")

        return True

    except Exception as e:
        print(f"- ConfigurationManager failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Cleanup
        import shutil
        shutil.rmtree(temp_dir)

def test_detector_with_config():
    """Test detector using configuration."""

    try:
        # Test the position detector directly
        from analyzer.detectors.position_detector import PositionDetector
        from analyzer.utils.config_manager import ConfigurationManager, initialize_config_manager

        # Create temporary config
        temp_dir = tempfile.mkdtemp()
        config_dir = Path(temp_dir) / "config"
        config_dir.mkdir()

        # Create detector config with known threshold
        detector_config = {
            'position_detector': {
                'config_keywords': [],
                'thresholds': {
                    'max_positional_args': 5  # Specific threshold
                },
                'exclusions': {}
            }
        }

        detector_config_path = config_dir / "detector_config.yaml"
        with open(detector_config_path, 'w') as f:
            yaml.dump(detector_config, f)

        # Initialize global config manager
        initialize_config_manager(str(config_dir))

        # Create detector instance
        detector = PositionDetector("test.py", ["def test(a, b, c, d, e, f, g): pass"])

        print(f"+ Detector class name: {detector.__class__.__name__}")
        print(f"+ Detector name computed: {detector._detector_name}")
        print(f"+ Detector max_positional_params: {detector.max_positional_params}")

        # Try to get config directly
        try:
            config = detector.get_config()
            print(f"+ Detector config: {config}")
            threshold = detector.get_threshold('max_positional_args', 999)
            print(f"+ Threshold from get_threshold: {threshold}")
        except Exception as e:
            print(f"- Error getting detector config: {e}")

        if detector.max_positional_params == 5:
            print("+ Detector is using configuration: REAL")
            return True
        else:
            print(f"- Detector using hardcoded value {detector.max_positional_params}, not config value 5: THEATER")
            return False

    except Exception as e:
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Cleanup
        import shutil
        shutil.rmtree(temp_dir)

def main():
    """Run reality checks."""
    print("PHASE 4 CONFIGURATION SYSTEM REALITY CHECK")
    print("="*50)

    tests_passed = 0
    total_tests = 2

    if test_basic_config_loading():
        tests_passed += 1
        print("+ Basic config loading: PASS")
    else:
        print("- Basic config loading: FAIL")

    if test_detector_with_config():
        tests_passed += 1
        print("+ Detector configuration: PASS")
    else:
        print("- Detector configuration: FAIL")

    reality_score = (tests_passed / total_tests) * 100
    print(f"\nREALITY SCORE: {reality_score:.1f}%")

    if reality_score >= 50:
        print("STATUS: Configuration system has some real functionality")
    else:
        print("STATUS: Configuration system is mostly theater")

if __name__ == '__main__':
    main()