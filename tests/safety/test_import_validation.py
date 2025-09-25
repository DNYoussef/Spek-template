"""
Safety System Import Validation Tests
=====================================

Validates that all safety system components can be imported and initialized
without errors. This addresses the critical theater detection findings.
"""

from pathlib import Path
import os
import sys

import importlib
import pytest

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

class TestSafetySystemImports:
    """Test all safety system imports work correctly."""

    def test_main_safety_module_import(self):
        """Test main safety module can be imported."""
        try:
            import safety
            assert safety is not None

            # Test version and metadata
            assert hasattr(safety, '__version__')
            assert hasattr(safety, '__all__')
            assert len(safety.__all__) > 0

        except ImportError as e:
            pytest.fail(f"Failed to import safety module: {e}")

    def test_safety_manager_import(self):
        """Test SafetyManager can be imported and instantiated."""
        try:
            from safety.core.safety_manager import SafetyManager

            config = {
                'availability_target': 0.999,
                'max_recovery_time_seconds': 60,
                'redundancy_levels': 3
            }

            manager = SafetyManager(config)
            assert manager is not None
            assert manager.config == config

        except ImportError as e:
            pytest.fail(f"Failed to import SafetyManager: {e}")
        except Exception as e:
            pytest.fail(f"Failed to instantiate SafetyManager: {e}")

    def test_failover_manager_import(self):
        """Test FailoverManager can be imported and instantiated."""
        try:
            from safety.core.failover_manager import FailoverManager

            config = {
                'max_concurrent_failovers': 5,
                'default_timeout': 60
            }

            manager = FailoverManager(config)
            assert manager is not None
            assert manager.config == config

        except ImportError as e:
            pytest.fail(f"Failed to import FailoverManager: {e}")
        except Exception as e:
            pytest.fail(f"Failed to instantiate FailoverManager: {e}")

    def test_recovery_system_import(self):
        """Test RecoverySystem can be imported and instantiated."""
        try:
            from safety.recovery.recovery_system import RecoverySystem

            config = {
                'max_concurrent_recoveries': 10,
                'default_timeout': 60
            }

            system = RecoverySystem(config)
            assert system is not None
            assert system.config == config

        except ImportError as e:
            pytest.fail(f"Failed to import RecoverySystem: {e}")
        except Exception as e:
            pytest.fail(f"Failed to instantiate RecoverySystem: {e}")

    def test_availability_monitor_import(self):
        """Test AvailabilityMonitor can be imported and instantiated."""
        try:
            from safety.monitoring.availability_monitor import AvailabilityMonitor

            config = {
                'sla_target': 0.999,
                'measurement_window_hours': 24,
                'check_interval_seconds': 5
            }

            monitor = AvailabilityMonitor(config)
            assert monitor is not None
            assert monitor.config == config

        except ImportError as e:
            pytest.fail(f"Failed to import AvailabilityMonitor: {e}")
        except Exception as e:
            pytest.fail(f"Failed to instantiate AvailabilityMonitor: {e}")

    def test_redundancy_validator_import(self):
        """Test RedundancyValidator can be imported and instantiated."""
        try:
            from safety.monitoring.redundancy_validator import RedundancyValidator

            config = {
                'max_concurrent_validations': 5,
                'validation_timeout_seconds': 300
            }

            validator = RedundancyValidator(config)
            assert validator is not None
            assert validator.config == config

        except ImportError as e:
            pytest.fail(f"Failed to import RedundancyValidator: {e}")
        except Exception as e:
            pytest.fail(f"Failed to instantiate RedundancyValidator: {e}")

    def test_trading_safety_bridge_import(self):
        """Test TradingSafetyBridge can be imported and instantiated."""
        try:
            from safety.integration.trading_safety_bridge import TradingSafetyBridge

            config = {
                'high_exposure_threshold': 1000000,
                'high_loss_threshold': 50000
            }

            bridge = TradingSafetyBridge(config)
            assert bridge is not None
            assert bridge.config == config

        except ImportError as e:
            pytest.fail(f"Failed to import TradingSafetyBridge: {e}")
        except Exception as e:
            pytest.fail(f"Failed to instantiate TradingSafetyBridge: {e}")

    def test_factory_function_import(self):
        """Test factory function can be imported and used."""
        try:
            from safety import create_safety_system

            safety_system = create_safety_system()
            assert safety_system is not None

            # Test with custom config
            custom_config = {
                'availability_target': 0.995,
                'max_recovery_time_seconds': 30
            }

            custom_system = create_safety_system(custom_config)
            assert custom_system is not None
            assert custom_system.config['availability_target'] == 0.995

        except ImportError as e:
            pytest.fail(f"Failed to import create_safety_system: {e}")
        except Exception as e:
            pytest.fail(f"Failed to use create_safety_system: {e}")

    def test_all_enum_imports(self):
        """Test all enums can be imported."""
        try:
            from safety.core.safety_manager import SafetyState, SystemComponent
            from safety.core.failover_manager import FailoverStrategy, FailoverState
            from safety.recovery.recovery_system import RecoveryStrategy, RecoveryState
            from safety.monitoring.availability_monitor import AvailabilityState, SLAThreshold
            from safety.monitoring.redundancy_validator import RedundancyLevel, RedundancyType
            from safety.integration.trading_safety_bridge import TradingState, RiskLevel

            # Test enum values exist
            assert SafetyState.HEALTHY is not None
            assert SystemComponent.TRADING_ENGINE is not None
            assert FailoverStrategy.ACTIVE_PASSIVE is not None
            assert RecoveryStrategy.RESTART_SERVICE is not None
            assert AvailabilityState.AVAILABLE is not None
            assert RedundancyLevel.TRIPLE is not None
            assert TradingState.ACTIVE is not None

        except ImportError as e:
            pytest.fail(f"Failed to import enums: {e}")

    def test_dataclass_imports(self):
        """Test all dataclasses can be imported and instantiated."""
        try:
            from safety.core.failover_manager import FailoverInstance
            from safety.recovery.recovery_system import RecoveryAction, RecoveryPlan
            from safety.monitoring.availability_monitor import AvailabilityIncident
            from safety.monitoring.redundancy_validator import RedundantNode, RedundancyGroup
            from safety.integration.trading_safety_bridge import CircuitBreakerConfig, PositionLimit

            # Test dataclass instantiation
            instance = FailoverInstance(
                primary_endpoint="http://test:8080",
                backup_endpoints=["http://backup:8080"]
            )
            assert instance.primary_endpoint == "http://test:8080"

            action = RecoveryAction(
                name="test_action",
                strategy="restart_service"
            )
            assert action.name == "test_action"

        except ImportError as e:
            pytest.fail(f"Failed to import dataclasses: {e}")
        except Exception as e:
            pytest.fail(f"Failed to instantiate dataclasses: {e}")

class TestModuleStructure:
    """Test the module structure is correct."""

    def test_package_structure(self):
        """Test that all expected packages exist."""
        src_path = Path(__file__).parent.parent.parent / "src"
        safety_path = src_path / "safety"

        # Test main package exists
        assert safety_path.exists(), "safety package directory not found"
        assert (safety_path / "__init__.py").exists(), "safety __init__.py not found"

        # Test subpackages exist
        expected_subpackages = ["core", "monitoring", "recovery", "integration"]
        for subpackage in expected_subpackages:
            subpackage_path = safety_path / subpackage
            assert subpackage_path.exists(), f"{subpackage} subpackage not found"
            assert (subpackage_path / "__init__.py").exists(), f"{subpackage} __init__.py not found"

    def test_core_module_files(self):
        """Test core module files exist."""
        src_path = Path(__file__).parent.parent.parent / "src"
        core_path = src_path / "safety" / "core"

        expected_files = ["safety_manager.py", "failover_manager.py"]
        for file_name in expected_files:
            file_path = core_path / file_name
            assert file_path.exists(), f"Core module file {file_name} not found"

    def test_monitoring_module_files(self):
        """Test monitoring module files exist."""
        src_path = Path(__file__).parent.parent.parent / "src"
        monitoring_path = src_path / "safety" / "monitoring"

        expected_files = ["availability_monitor.py", "redundancy_validator.py"]
        for file_name in expected_files:
            file_path = monitoring_path / file_name
            assert file_path.exists(), f"Monitoring module file {file_name} not found"

    def test_recovery_module_files(self):
        """Test recovery module files exist."""
        src_path = Path(__file__).parent.parent.parent / "src"
        recovery_path = src_path / "safety" / "recovery"

        expected_files = ["recovery_system.py"]
        for file_name in expected_files:
            file_path = recovery_path / file_name
            assert file_path.exists(), f"Recovery module file {file_name} not found"

    def test_integration_module_files(self):
        """Test integration module files exist."""
        src_path = Path(__file__).parent.parent.parent / "src"
        integration_path = src_path / "safety" / "integration"

        expected_files = ["trading_safety_bridge.py"]
        for file_name in expected_files:
            file_path = integration_path / file_name
            assert file_path.exists(), f"Integration module file {file_name} not found"

class TestSystemInitialization:
    """Test complete system initialization."""

    def test_complete_system_initialization(self):
        """Test that a complete safety system can be initialized."""
        try:
            from safety import create_safety_system
            from safety.core.failover_manager import FailoverManager
            from safety.recovery.recovery_system import RecoverySystem
            from safety.monitoring.availability_monitor import AvailabilityMonitor
            from safety.monitoring.redundancy_validator import RedundancyValidator

            # Create main system
            safety_system = create_safety_system()

            # Create subsystems
            failover_manager = FailoverManager({})
            recovery_system = RecoverySystem({})
            availability_monitor = AvailabilityMonitor({})
            redundancy_validator = RedundancyValidator({})

            # Initialize complete system
            safety_system.initialize_subsystems(
                failover_manager,
                recovery_system,
                availability_monitor,
                redundancy_validator
            )

            # Test system is properly initialized
            assert safety_system.failover_manager is not None
            assert safety_system.recovery_system is not None
            assert safety_system.availability_monitor is not None
            assert safety_system.redundancy_validator is not None

        except Exception as e:
            pytest.fail(f"Failed to initialize complete system: {e}")

    def test_system_can_start_and_stop(self):
        """Test that the system can be started and stopped."""
        try:
            from safety import create_safety_system

            safety_system = create_safety_system()

            # System should start without errors
            safety_system.start()
            assert safety_system._is_running is True

            # System should stop without errors
            safety_system.stop()
            assert safety_system._is_running is False

        except Exception as e:
            pytest.fail(f"Failed to start/stop system: {e}")

    def test_system_metrics_accessible(self):
        """Test that system metrics are accessible."""
        try:
            from safety import create_safety_system

            safety_system = create_safety_system()

            # Should be able to get metrics without errors
            metrics = safety_system.get_metrics()
            assert metrics is not None

            # Should be able to validate SLA
            sla_result = safety_system.validate_availability_sla()
            assert sla_result is not None
            assert 'sla_met' in sla_result

        except Exception as e:
            pytest.fail(f"Failed to access system metrics: {e}")

if __name__ == "__main__":
    # Run the import validation tests
    pytest.main([__file__, "-v", "--tb=short"])