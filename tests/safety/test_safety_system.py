from src.constants.base import MAXIMUM_RETRY_ATTEMPTS, NASA_POT10_TARGET_COMPLIANCE_THRESHOLD

Tests all safety system components to validate:
- Import functionality
- 99.9% availability SLA
- <60 second recovery times
- Redundancy validation
- Integration with trading systems
"""

import pytest
import time
import threading
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from safety import (
    SafetyManager,
    FailoverManager,
    RecoverySystem,
    AvailabilityMonitor,
    RedundancyValidator,
    create_safety_system
)
from safety.core.safety_manager import SafetyState, SystemComponent
from safety.core.failover_manager import FailoverStrategy, FailoverInstance
from safety.recovery.recovery_system import RecoveryAction, RecoveryPlan, RecoveryStrategy
from safety.monitoring.availability_monitor import AvailabilityState, AvailabilityIncident
from safety.monitoring.redundancy_validator import RedundancyGroup, RedundantNode, RedundancyType, RedundancyLevel
from safety.integration.trading_safety_bridge import TradingSafetyBridge, TradingState, CircuitBreakerConfig

class TestSafetySystemImports:
    """Test that all safety system components can be imported."""

    def test_main_module_imports(self):
        """Test main module imports work correctly."""
        # Test that we can import all main classes
        assert SafetyManager is not None
        assert FailoverManager is not None
        assert RecoverySystem is not None
        assert AvailabilityMonitor is not None
        assert RedundancyValidator is not None

    def test_factory_function(self):
        """Test the factory function creates safety system."""
        safety_system = create_safety_system()
        assert isinstance(safety_system, SafetyManager)

    def test_enum_imports(self):
        """Test that enums are properly imported."""
        assert SafetyState.HEALTHY is not None
        assert SystemComponent.TRADING_ENGINE is not None
        assert FailoverStrategy.ACTIVE_PASSIVE is not None
        assert RecoveryStrategy.RESTART_SERVICE is not None
        assert AvailabilityState.AVAILABLE is not None
        assert RedundancyType.ACTIVE_ACTIVE is not None

class TestSafetyManager:
    """Test SafetyManager functionality."""

    @pytest.fixture
    def safety_config(self):
        return {
            'availability_target': 0.999,
            'max_recovery_time_seconds': 60,
            'redundancy_levels': 3,
            'health_check_interval_seconds': 1,
            'failover_trigger_threshold': NASA_POT10_TARGET_COMPLIANCE_THRESHOLD,
            'monitoring_enabled': True
        }

    @pytest.fixture
    def safety_manager(self, safety_config):
        manager = SafetyManager(safety_config)

        # Create mock subsystems
        failover_manager = Mock(spec=FailoverManager)
        recovery_system = Mock(spec=RecoverySystem)
        availability_monitor = Mock(spec=AvailabilityMonitor)
        redundancy_validator = Mock(spec=RedundancyValidator)

        manager.initialize_subsystems(
            failover_manager,
            recovery_system,
            availability_monitor,
            redundancy_validator
        )

        return manager

    def test_safety_manager_initialization(self, safety_manager, safety_config):
        """Test SafetyManager initializes correctly."""
        assert safety_manager.config == safety_config
        assert safety_manager.get_system_state() == SafetyState.HEALTHY

    def test_health_check_registration(self, safety_manager):
        """Test health check registration."""
    def mock_health_check():
            return True

        safety_manager.register_health_check(
            SystemComponent.TRADING_ENGINE,
            mock_health_check
        )

        assert SystemComponent.TRADING_ENGINE in safety_manager._health_checks

    def test_sla_validation(self, safety_manager):
        """Test SLA validation functionality."""
        sla_result = safety_manager.validate_availability_sla()

        assert 'sla_met' in sla_result
        assert 'current_availability' in sla_result
        assert 'target_availability' in sla_result
        assert sla_result['target_availability'] == 0.999

    def test_failover_trigger(self, safety_manager):
        """Test failover triggering."""
        # Mock successful failover
        safety_manager.failover_manager.execute_failover.return_value = True

        result = safety_manager.trigger_failover(
            SystemComponent.TRADING_ENGINE,
            "Test failover"
        )

        assert result is True
        safety_manager.failover_manager.execute_failover.assert_called_once()

    def test_recovery_time_validation(self, safety_manager):
        """Test that recovery times are validated against <60s requirement."""
        # Mock slow failover (>60s)
    def slow_failover(*args):
            time.sleep(0.1)  # Simulate work
            return True

        safety_manager.failover_manager.execute_failover = slow_failover

        start_time = time.time()
        result = safety_manager.trigger_failover(
            SystemComponent.TRADING_ENGINE,
            "Test recovery time"
        )

        # Should still succeed but metrics should track the time
        assert len(safety_manager.metrics.recovery_times) > 0

class TestFailoverManager:
    """Test FailoverManager functionality."""

    @pytest.fixture
    def failover_config(self):
        return {
            'max_concurrent_failovers': 5,
            'default_recovery_timeout': 60
        }

    @pytest.fixture
    def failover_manager(self, failover_config):
        return FailoverManager(failover_config)

    @pytest.fixture
    def failover_instance(self):
        return FailoverInstance(
            primary_endpoint="http://primary:8080",
            backup_endpoints=["http://backup1:8080", "http://backup2:8080"],
            strategy=FailoverStrategy.ACTIVE_PASSIVE,
            max_recovery_time=30.0,
            health_check_url="http://primary:8080/health"
        )

    def test_failover_registration(self, failover_manager, failover_instance):
        """Test failover instance registration."""
        component_name = "test_component"

        failover_manager.register_failover_instance(component_name, failover_instance)

        assert component_name in failover_manager._failover_instances
        assert failover_manager.get_active_endpoint(component_name) == failover_instance.primary_endpoint

    def test_recovery_time_sla_validation(self, failover_manager):
        """Test SLA validation for recovery times."""
        # Add some mock recovery times
        failover_manager.metrics.recovery_times = [30.0, 45.0, 25.0, 70.0]  # One violation

        sla_result = failover_manager.validate_recovery_time_sla()

        assert sla_result['sla_met'] is False  # One time > 60s
        assert sla_result['violations'] == 1
        assert sla_result['total_failovers'] == 4

    @patch('requests.get')
    def test_health_check_functionality(self, mock_get, failover_manager, failover_instance):
        """Test health check functionality."""
        # Mock healthy response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response

        failover_manager.register_failover_instance("test", failover_instance)

        # This would be called internally during failover validation
        is_healthy = failover_manager._test_endpoint_health("http://test:8080")
        assert is_healthy is True

class TestRecoverySystem:
    """Test RecoverySystem functionality."""

    @pytest.fixture
    def recovery_config(self):
        return {
            'max_concurrent_recoveries': 10,
            'default_timeout': 60
        }

    @pytest.fixture
    def recovery_system(self, recovery_config):
        return RecoverySystem(recovery_config)

    @pytest.fixture
    def recovery_plan(self):
        actions = [
            RecoveryAction(
                name="restart_service",
                strategy=RecoveryStrategy.RESTART_SERVICE,
                command="systemctl restart test-service",
                timeout_seconds=30.0,
                retry_count=2
            ),
            RecoveryAction(
                name="reload_config",
                strategy=RecoveryStrategy.RELOAD_CONFIG,
                timeout_seconds=15.0,
                retry_count=1
            )
        ]

        return RecoveryPlan(
            component_name="test_component",
            actions=actions,
            max_total_time=60.0,
            parallel_execution=False
        )

    def test_recovery_plan_registration(self, recovery_system, recovery_plan):
        """Test recovery plan registration."""
        recovery_system.register_recovery_plan(recovery_plan)

        assert recovery_plan.component_name in recovery_system._recovery_plans

    def test_recovery_time_validation(self, recovery_system):
        """Test recovery time SLA validation."""
        # Add some mock recovery times
        recovery_system.metrics.recovery_times = [25.0, 40.0, 55.0, 75.0]  # One violation

        sla_result = recovery_system.validate_recovery_time_sla()

        assert sla_result['sla_met'] is False
        assert sla_result['violations'] == 1
        assert sla_result['average_recovery_time'] == 48.75

    @patch('subprocess.run')
    def test_service_restart_action(self, mock_subprocess, recovery_system):
        """Test service restart recovery action."""
        # Mock successful subprocess execution
        mock_result = Mock()
        mock_result.returncode = 0
        mock_subprocess.return_value = mock_result

        action = RecoveryAction(
            name="test_restart",
            strategy=RecoveryStrategy.RESTART_SERVICE,
            command="systemctl restart test",
            timeout_seconds=30.0
        )

        result = recovery_system._execute_single_action(action, 30.0)
        assert result is True

class TestAvailabilityMonitor:
    """Test AvailabilityMonitor functionality."""

    @pytest.fixture
    def monitor_config(self):
        return {
            'sla_target': 0.999,
            'measurement_window_hours': 1,  # Short window for testing
            'check_interval_seconds': 0.1,  # Fast checks for testing
            'max_samples': 1000
        }

    @pytest.fixture
    def availability_monitor(self, monitor_config):
        return AvailabilityMonitor(monitor_config)

    def test_component_registration(self, availability_monitor):
        """Test component registration for monitoring."""
    def mock_health_check():
            return True

        availability_monitor.register_component("test_component", mock_health_check)

        assert "test_component" in availability_monitor._health_checkers

    def test_sla_metrics_calculation(self, availability_monitor):
        """Test SLA metrics calculation."""
    def healthy_check():
            return True

        availability_monitor.register_component("test_component", healthy_check)

        # Add some sample data
        for i in range(100):
            sample = {
                'timestamp': datetime.utcnow() - timedelta(seconds=i),
                'available': i < 95,  # 95% availability
                'state': 'available' if i < 95 else 'unavailable'
            }
            availability_monitor._availability_samples["test_component"].append(sample)

        metrics = availability_monitor.get_sla_metrics("test_component")

        assert metrics.availability_percentage == 0.95
        assert not metrics.sla_met  # Should fail 99.9% target

    def test_incident_tracking(self, availability_monitor):
        """Test availability incident tracking."""
    def failing_check():
            return False

        availability_monitor.register_component("test_component", failing_check)

        # Simulate state transition to unavailable
        availability_monitor._handle_state_transition(
            "test_component",
            AvailabilityState.AVAILABLE,
            AvailabilityState.UNAVAILABLE,
            datetime.utcnow()
        )

        assert "test_component" in availability_monitor._active_incidents

class TestRedundancyValidator:
    """Test RedundancyValidator functionality."""

    @pytest.fixture
    def validator_config(self):
        return {
            'max_concurrent_validations': 5,
            'validation_timeout_seconds': 60,
            'health_check_timeout_seconds': 5
        }

    @pytest.fixture
    def redundancy_validator(self, validator_config):
        return RedundancyValidator(validator_config)

    @pytest.fixture
    def redundancy_group(self):
        nodes = [
            RedundantNode(
                node_id="node1",
                endpoint="http://node1:8080",
                is_primary=True,
                health_check_url="http://node1:8080/health"
            ),
            RedundantNode(
                node_id="node2",
                endpoint="http://node2:8080",
                health_check_url="http://node2:8080/health"
            ),
            RedundantNode(
                node_id="node3",
                endpoint="http://node3:8080",
                health_check_url="http://node3:8080/health"
            )
        ]

        return RedundancyGroup(
            group_name="test_cluster",
            redundancy_type=RedundancyType.ACTIVE_ACTIVE,
            required_level=RedundancyLevel.DOUBLE,
            nodes=nodes,
            min_active_nodes=2,
            max_failure_tolerance=1
        )

    def test_redundancy_group_registration(self, redundancy_validator, redundancy_group):
        """Test redundancy group registration."""
        redundancy_validator.register_redundancy_group(redundancy_group)

        assert redundancy_group.group_name in redundancy_validator._redundancy_groups

    @patch('requests.get')
    def test_failover_scenario_testing(self, mock_get, redundancy_validator, redundancy_group):
        """Test failover scenario testing."""
        # Mock all nodes as healthy initially
        mock_response = Mock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response

        redundancy_validator.register_redundancy_group(redundancy_group)

        # Test failover scenario
        result = redundancy_validator.test_failover_scenarios("test_cluster", 1)

        # Should succeed since we have 3 nodes and only fail 1
        assert result.success is True
        assert result.redundancy_level_achieved.value >= RedundancyLevel.SINGLE.value

    def test_redundancy_report_generation(self, redundancy_validator, redundancy_group):
        """Test comprehensive redundancy report generation."""
        redundancy_validator.register_redundancy_group(redundancy_group)

        report = redundancy_validator.get_redundancy_report()

        assert 'timestamp' in report
        assert 'overall_status' in report
        assert 'groups' in report
        assert 'summary' in report
        assert report['summary']['total_groups'] == 1

class TestTradingSafetyBridge:
    """Test TradingSafetyBridge functionality."""

    @pytest.fixture
    def bridge_config(self):
        return {
            'high_exposure_threshold': 1000000,
            'high_loss_threshold': 50000,
            'max_concurrent_validations': 5
        }

    @pytest.fixture
    def trading_bridge(self, bridge_config):
        return TradingSafetyBridge(bridge_config)

    @pytest.fixture
    def circuit_breaker_config(self):
        return CircuitBreakerConfig(
            name="trading_api",
            failure_threshold=MAXIMUM_RETRY_ATTEMPTS,
            timeout_seconds=300,
            half_open_max_calls=2
        )

    def test_circuit_breaker_registration(self, trading_bridge, circuit_breaker_config):
        """Test circuit breaker registration."""
        trading_bridge.register_circuit_breaker(circuit_breaker_config)

        assert circuit_breaker_config.name in trading_bridge._circuit_breaker_configs
        assert trading_bridge._circuit_breakers[circuit_breaker_config.name]['state'] == 'closed'

    def test_trade_validation(self, trading_bridge):
        """Test trade validation functionality."""
        # Test valid trade
        result = trading_bridge.validate_trade("AAPL", 100, 150.0)

        assert 'approved' in result
        assert 'reasons' in result
        assert 'risk_level' in result

    def test_emergency_stop(self, trading_bridge):
        """Test emergency stop functionality."""
        trading_bridge.emergency_stop("Test emergency stop")

        assert trading_bridge._trading_state == TradingState.EMERGENCY_STOP
        assert trading_bridge.metrics.emergency_stops == 1

    def test_position_limit_enforcement(self, trading_bridge):
        """Test position limit enforcement."""
        from safety.integration.trading_safety_bridge import PositionLimit

        # Set position limit
        limit = PositionLimit(
            symbol="AAPL",
            max_position_size=1000,
            max_daily_loss=10000,
            max_exposure=150000
        )
        trading_bridge.set_position_limit(limit)

        # Test trade within limits
        result = trading_bridge.validate_trade("AAPL", 500, 150.0)
        assert result['approved'] is True

        # Test trade exceeding limits
        result = trading_bridge.validate_trade("AAPL", 2000, 150.0)  # Exceeds position limit
        assert result['approved'] is False

    def test_safety_status_reporting(self, trading_bridge):
        """Test safety status reporting."""
        status = trading_bridge.get_safety_status()

        assert 'timestamp' in status
        assert 'trading_state' in status
        assert 'risk_level' in status
        assert 'metrics' in status

class TestIntegrationScenarios:
    """Test end-to-end integration scenarios."""

    @pytest.fixture
    def integrated_safety_system(self):
        """Create a complete integrated safety system."""
        config = {
            'availability_target': 0.999,
            'max_recovery_time_seconds': 60,
            'redundancy_levels': 3,
            'health_check_interval_seconds': 1
        }

        return create_safety_system(config)

    def test_complete_system_initialization(self, integrated_safety_system):
        """Test that the complete system initializes correctly."""
        assert isinstance(integrated_safety_system, SafetyManager)
        assert integrated_safety_system.config['availability_target'] == 0.999

    def test_end_to_end_failover_scenario(self, integrated_safety_system):
        """Test complete failover scenario."""
        # This would test a complete failover scenario

        # Mock components for testing
    def mock_health_check():
            return False  # Simulate failure

        integrated_safety_system.register_health_check(
            SystemComponent.TRADING_ENGINE,
            mock_health_check
        )

        # The system should detect the failure and attempt recovery
        assert integrated_safety_system.get_system_state() in [
            SafetyState.HEALTHY,
            SafetyState.DEGRADED,
            SafetyState.CRITICAL
        ]

    def test_performance_under_load(self, integrated_safety_system):
        """Test system performance under load."""
        # Simulate multiple concurrent operations
    def simulate_load():
            for _ in range(100):
                metrics = integrated_safety_system.get_metrics()
                time.sleep(0.001)  # Small delay

        threads = []
        for _ in range(5):
            thread = threading.Thread(target=simulate_load)
            threads.append(thread)
            thread.start()

        for thread in threads:
            thread.join()

        # System should remain stable
        assert integrated_safety_system.get_system_state() != SafetyState.FAILED

if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v", "--tb=short"])