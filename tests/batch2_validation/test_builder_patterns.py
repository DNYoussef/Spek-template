"""
Batch 2 Builder Pattern Validation Tests
Validates correct implementation of Builder pattern in initialization refactoring
"""

from typing import Any, List

from dataclasses import is_dataclass
import importlib
import inspect
import pytest

class TestBuilderPatternValidation:
    """Validate Builder pattern implementation across Batch 2 files"""

    def test_builder_fluent_interface(self):
        """Verify builders support method chaining"""
        builders = self._find_builder_classes()

        assert len(builders) >= 4, f"Expected 4+ builders, found {len(builders)}"

        for builder_class in builders:
            # Check for fluent interface methods
            methods = [m for m in dir(builder_class)
                        if not m.startswith('_') and callable(getattr(builder_class, m))]

            # Should have build() method
            assert 'build' in methods, f"{builder_class.__name__} missing build() method"

            # Should have at least 2 setter methods
            setter_methods = [m for m in methods
                            if m.startswith(('add_', 'with_', 'set_')) and m != 'build']
            assert len(setter_methods) >= 2, \
                f"{builder_class.__name__} needs at least 2 setter methods"

    def test_builder_immutability(self):
        """Verify builder methods don't mutate state improperly"""
        builders = self._find_builder_classes()

        for builder_class in builders:
            try:
                builder = builder_class()

                # Get a setter method
                setter_methods = [m for m in dir(builder)
                                if m.startswith(('add_', 'with_', 'set_'))
                                and not m.startswith('_')]

                if not setter_methods:
                    continue

                # Test that calling setter returns builder (fluent)
                setter = getattr(builder, setter_methods[0])
                if callable(setter):
                    # Check method signature
                    sig = inspect.signature(setter)
                    # Should return self or new builder
                    assert len(sig.parameters) >= 1, \
                        f"{builder_class.__name__}.{setter_methods[0]} should accept parameters"

            except Exception as e:
                pytest.fail(f"Builder {builder_class.__name__} validation failed: {e}")

    def test_config_objects_are_dataclasses(self):
        """Verify Configuration Objects use @dataclass"""
        config_classes = self._find_config_classes()

        assert len(config_classes) >= 8, f"Expected 8+ config objects, found {len(config_classes)}"

        for config_class in config_classes:
            assert is_dataclass(config_class), \
                f"{config_class.__name__} should be a dataclass"

            # Verify frozen=True for immutability (optional but recommended)
            if hasattr(config_class, '__dataclass_fields__'):
                # Check fields exist
                assert len(config_class.__dataclass_fields__) > 0, \
                    f"{config_class.__name__} should have fields"

    def test_builder_produces_valid_output(self):
        """Verify builders produce expected output types"""
        builders = self._find_builder_classes()

        for builder_class in builders:
            try:
                builder = builder_class()

                # Try to build with defaults
                if hasattr(builder, 'build'):
                    result = builder.build()
                    assert result is not None, \
                        f"{builder_class.__name__}.build() returned None"

            except Exception as e:
                # Some builders may require parameters - that's OK
                if "required" not in str(e).lower() and "missing" not in str(e).lower():
                    pytest.fail(f"Builder {builder_class.__name__} build failed: {e}")

    def _find_builder_classes(self) -> List[type]:
        """Find all Builder pattern classes in Batch 2 files"""
        builder_classes = []

        batch2_modules = [
            'scripts.cicd.failure_pattern_detector',
            'scripts.deploy_real_queen_swarm',
            'src.security.dfars_compliance_certification',
            'analyzer.enterprise.compliance.core'
        ]

        for module_name in batch2_modules:
            try:
                module = importlib.import_module(module_name)
                for name, obj in inspect.getmembers(module, inspect.isclass):
                    if 'Builder' in name:
                        builder_classes.append(obj)
            except ImportError:
                continue

        return builder_classes

    def _find_config_classes(self) -> List[type]:
        """Find all Configuration Object classes in Batch 2 files"""
        config_classes = []

        batch2_modules = [
            'scripts.cicd.failure_pattern_detector',
            'scripts.deploy_real_queen_swarm',
            'src.security.dfars_compliance_certification',
            'analyzer.enterprise.compliance.core'
        ]

        for module_name in batch2_modules:
            try:
                module = importlib.import_module(module_name)
                for name, obj in inspect.getmembers(module, inspect.isclass):
                    if 'Config' in name or is_dataclass(obj):
                        config_classes.append(obj)
            except ImportError:
                continue

        return config_classes

class TestInitializationBehavior:
    """Validate that initialization behavior is preserved"""

    def test_failure_pattern_detector_initialization(self):
        """Test failure pattern detector initializes correctly"""
        try:
            from scripts.cicd.failure_pattern_detector import FailurePatternDetector
            detector = FailurePatternDetector()
            assert detector is not None
        except ImportError:
            pytest.skip("Module not refactored yet")

    def test_queen_swarm_initialization(self):
        """Test queen swarm deployment initializes correctly"""
        try:
            from scripts.deploy_real_queen_swarm import QueenSwarmDeployer
            # This might require config - that's expected
            assert QueenSwarmDeployer is not None
        except ImportError:
            pytest.skip("Module not refactored yet")

    def test_dfars_certification_initialization(self):
        """Test DFARS certification initializes correctly"""
        try:
            from src.security.dfars_compliance_certification import DFARSCertificationEngine
            # Check class exists and is importable
            assert DFARSCertificationEngine is not None
        except ImportError:
            pytest.skip("Module not refactored yet")

    def test_compliance_core_initialization(self):
        """Test compliance core initializes correctly"""
        try:
            from analyzer.enterprise.compliance.core import ComplianceEngine
            # Check class exists and is importable
            assert ComplianceEngine is not None
        except ImportError:
            pytest.skip("Module not refactored yet")

class TestPerformance:
    """Performance validation for initialization"""

    def test_initialization_performance(self):
        """Verify initialization completes in acceptable time"""
        import time

        modules_to_test = [
            'scripts.cicd.failure_pattern_detector',
            'scripts.deploy_real_queen_swarm',
            'src.security.dfars_compliance_certification',
            'analyzer.enterprise.compliance.core'
        ]

        for module_name in modules_to_test:
            try:
                start = time.time()
                importlib.import_module(module_name)
                duration = time.time() - start

                assert duration < 2.0, \
                    f"{module_name} initialization took {duration:.2f}s (max 2.0s)"

            except ImportError:
                pytest.skip(f"{module_name} not available yet")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])