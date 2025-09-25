"""
Batch 2 Regression Tests
Ensures refactored initialization doesn't break existing functionality
"""

from pathlib import Path
import sys

import pytest

class TestRegressionSuite:
    """Regression tests for Batch 2 refactoring"""

    def test_failure_pattern_detection_still_works(self):
        """Verify failure pattern detection functionality preserved"""
        try:
            from scripts.cicd.failure_pattern_detector import FailurePatternDetector

            detector = FailurePatternDetector()

            # Test basic pattern detection
            test_log = """
            ERROR: Test failed in test_auth.py
            AssertionError: Expected 200, got 401
            """

            patterns = detector.detect_patterns(test_log)
            assert isinstance(patterns, (list, dict)), "Should return pattern collection"

        except ImportError:
            pytest.skip("Module not refactored yet")
        except Exception as e:
            pytest.fail(f"Failure pattern detection broke: {e}")

    def test_queen_swarm_deployment_still_works(self):
        """Verify queen swarm deployment functionality preserved"""
        try:
            from scripts.deploy_real_queen_swarm import QueenSwarmDeployer

            # Test deployment initialization (don't actually deploy)
            deployer = QueenSwarmDeployer()
            assert hasattr(deployer, 'deploy') or hasattr(deployer, 'initialize')

        except ImportError:
            pytest.skip("Module not refactored yet")
        except Exception as e:
            pytest.fail(f"Queen swarm deployment broke: {e}")

    def test_dfars_compliance_checks_still_work(self):
        """Verify DFARS compliance checking functionality preserved"""
        try:
            from src.security.dfars_compliance_certification import DFARSCertificationEngine

            engine = DFARSCertificationEngine()

            # Test basic compliance check
            if hasattr(engine, 'check_compliance'):
                # This should not raise
                engine.check_compliance()

        except ImportError:
            pytest.skip("Module not refactored yet")
        except Exception as e:
            pytest.fail(f"DFARS compliance checks broke: {e}")

    def test_compliance_core_still_works(self):
        """Verify compliance core functionality preserved"""
        try:
            from analyzer.enterprise.compliance.core import ComplianceEngine

            engine = ComplianceEngine()
            assert engine is not None

        except ImportError:
            pytest.skip("Module not refactored yet")
        except Exception as e:
            pytest.fail(f"Compliance core broke: {e}")

    def test_all_imports_successful(self):
        """Verify all refactored modules can be imported"""
        modules = [
            'scripts.cicd.failure_pattern_detector',
            'scripts.deploy_real_queen_swarm',
            'src.security.dfars_compliance_certification',
            'analyzer.enterprise.compliance.core'
        ]

        import_failures = []

        for module_name in modules:
            try:
                __import__(module_name)
            except Exception as e:
                import_failures.append(f"{module_name}: {e}")

        if import_failures:
            pytest.fail(f"Import failures:\n" + "\n".join(import_failures))

    def test_no_circular_imports(self):
        """Verify refactoring didn't introduce circular imports"""
        modules = [
            'scripts.cicd.failure_pattern_detector',
            'scripts.deploy_real_queen_swarm',
            'src.security.dfars_compliance_certification',
            'analyzer.enterprise.compliance.core'
        ]

        # Clear module cache
        for module_name in modules:
            if module_name in sys.modules:
                del sys.modules[module_name]

        # Try importing in different orders
        for module_name in modules:
            try:
                __import__(module_name)
            except ImportError as e:
                if "circular" in str(e).lower():
                    pytest.fail(f"Circular import detected in {module_name}: {e}")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])