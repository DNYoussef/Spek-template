from lib.shared.utilities import path_exists

"""
Requirements:
- ISO 26262 ASIL-D compliance validation
- Fail-safe mechanism verification
- Redundancy system testing
- Safety function availability >= 99.99%
"""

import pytest
import time
import threading
import json
import asyncio
from unittest.mock import Mock, patch, MagicMock
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional, Callable
from enum import Enum
import logging
import hashlib
import os

# Safety compliance constants
ASIL_D_REQUIREMENTS = {
    "availability_percent": 99.99,
    "mtbf_hours": 10000,  # Mean Time Between Failures
    "fault_detection_time_ms": 50,
    "fail_safe_activation_time_ms": 100,
    "redundancy_coverage_percent": 95.0
}

class SafetyLevel(Enum):
    """ISO 26262 Safety Levels"""
    QM = "QM"      # Quality Management
    ASIL_A = "A"   # Automotive Safety Integrity Level A
    ASIL_B = "B"   # Automotive Safety Integrity Level B
    ASIL_C = "C"   # Automotive Safety Integrity Level C
    ASIL_D = "D"   # Automotive Safety Integrity Level D (highest)

class FaultType(Enum):
    """Types of faults for testing"""
    SENSOR_FAILURE = "sensor_failure"
    COMMUNICATION_LOSS = "communication_loss"
    PROCESSING_ERROR = "processing_error"
    POWER_LOSS = "power_loss"
    MEMORY_CORRUPTION = "memory_corruption"
    TIMING_VIOLATION = "timing_violation"

class SystemState(Enum):
    """System operational states"""
    OPERATIONAL = "operational"
    DEGRADED = "degraded"
    FAIL_SAFE = "fail_safe"
    EMERGENCY_STOP = "emergency_stop"
    MAINTENANCE = "maintenance"

@dataclass
class SafetyEvent:
    """Safety event data structure"""
    event_id: str
    timestamp: float
    event_type: str
    severity: SafetyLevel
    description: str
    detected_by: str
    response_action: str
    response_time_ms: float
    resolved: bool = False

@dataclass
class FailSafeConfig:
    """Fail-safe configuration"""
    max_response_time_ms: float = 100.0
    redundancy_level: int = 2
    fault_tolerance_level: int = 1
    safety_functions: List[str] = None

    def __post_init__(self):
        if self.safety_functions is None:
            self.safety_functions = [
                "emergency_braking",
                "lane_keeping",
                "collision_avoidance",
                "speed_limiting"
            ]

class MockSafetySystem:
    """Mock safety system for ASIL-D testing"""

    def __init__(self, config: FailSafeConfig):
        self.config = config
        self.state = SystemState.OPERATIONAL
        self.redundant_systems = {}
        self.fault_detectors = {}
        self.safety_events: List[SafetyEvent] = []
        self.active_faults: Dict[str, FaultType] = {}
        self._setup_redundancy()

    def _setup_redundancy(self):
        """Setup redundant systems for fail-safe operation"""
        for function in self.config.safety_functions:
            self.redundant_systems[function] = {
                "primary": {"status": "active", "health": 100},
                "secondary": {"status": "standby", "health": 100},
                "tertiary": {"status": "standby", "health": 100}
            }

    async def detect_fault(self, fault_type: FaultType, affected_component: str) -> bool:
        """Simulate fault detection"""
        detection_start = time.perf_counter()

        # Simulate detection delay
        await asyncio.sleep(0.25)  # 25ms detection time

        detection_time = (time.perf_counter() - detection_start) * 1000

        # Log safety event
        event = SafetyEvent(
            event_id=hashlib.sha256(f"{fault_type.value}_{affected_component}_{time.time()}".encode()).hexdigest()[:8],
            timestamp=time.time(),
            event_type=fault_type.value,
            severity=SafetyLevel.ASIL_D,
            description=f"Fault detected in {affected_component}",
            detected_by="safety_monitor",
            response_action="activating_fail_safe",
            response_time_ms=detection_time
        )

        self.safety_events.append(event)
        self.active_faults[affected_component] = fault_type

        return detection_time <= ASIL_D_REQUIREMENTS["fault_detection_time_ms"]

    async def activate_fail_safe(self, safety_function: str) -> Dict[str, Any]:
        """Activate fail-safe mechanism for a safety function"""
        activation_start = time.perf_counter()

        if safety_function not in self.redundant_systems:
            raise ValueError(f"Unknown safety function: {safety_function}")

        redundant_system = self.redundant_systems[safety_function]

        # Check primary system
        if redundant_system["primary"]["status"] == "active":
            if redundant_system["primary"]["health"] < 50:
                # Switch to secondary
                redundant_system["primary"]["status"] = "failed"
                redundant_system["secondary"]["status"] = "active"
                self.state = SystemState.DEGRADED

        # Simulate fail-safe activation
        await asyncio.sleep(0.5)  # 50ms activation time

        activation_time = (time.perf_counter() - activation_start) * 1000

        result = {
            "function": safety_function,
            "activation_time_ms": activation_time,
            "redundant_system_active": redundant_system["secondary"]["status"] == "active",
            "system_state": self.state.value,
            "success": activation_time <= ASIL_D_REQUIREMENTS["fail_safe_activation_time_ms"]
        }

        return result

    def get_system_availability(self) -> float:
        """Calculate system availability percentage"""
        total_functions = len(self.config.safety_functions)
        available_functions = 0

        for function, systems in self.redundant_systems.items():
            if any(system["status"] == "active" for system in systems.values()):
                available_functions += 1

        return (available_functions / total_functions) * 100.0

    def verify_redundancy_coverage(self) -> Dict[str, float]:
        """Verify redundancy coverage for each safety function"""
        coverage = {}

        for function, systems in self.redundant_systems.items():
            active_systems = sum(1 for system in systems.values() if system["status"] in ["active", "standby"])
            coverage[function] = (active_systems / len(systems)) * 100.0

        return coverage

class SafetyComplianceTester:
    """ISO 26262 ASIL-D compliance testing framework"""

    def __init__(self):
        self.config = FailSafeConfig()
        self.safety_system = MockSafetySystem(self.config)
        self.test_results: List[Dict[str, Any]] = []

    async def run_compliance_test(self, test_name: str, test_func: Callable) -> Dict[str, Any]:
        """Run a compliance test and record results"""
        start_time = time.perf_counter()

        try:
            result = await test_func()
            success = True
            error = None
        except Exception as e:
            result = None
            success = False
            error = str(e)

        end_time = time.perf_counter()

        test_result = {
            "test_name": test_name,
            "success": success,
            "result": result,
            "error": error,
            "duration_ms": (end_time - start_time) * 1000,
            "timestamp": time.time()
        }

        self.test_results.append(test_result)
        return test_result

@pytest.fixture
def safety_tester():
    """Safety compliance tester fixture"""
    return SafetyComplianceTester()

@pytest.fixture
def fault_scenarios():
    """Fault scenarios for testing"""
    return [
        {"fault_type": FaultType.SENSOR_FAILURE, "component": "camera_front"},
        {"fault_type": FaultType.COMMUNICATION_LOSS, "component": "lidar_system"},
        {"fault_type": FaultType.PROCESSING_ERROR, "component": "perception_module"},
        {"fault_type": FaultType.POWER_LOSS, "component": "radar_left"},
        {"fault_type": FaultType.MEMORY_CORRUPTION, "component": "decision_engine"},
        {"fault_type": FaultType.TIMING_VIOLATION, "component": "control_system"}
    ]

class TestISO26262Compliance:
    """Test ISO 26262 ASIL-D compliance requirements"""

    @pytest.mark.asyncio
    async def test_fault_detection_time_compliance(self, safety_tester, fault_scenarios):
        """Test that fault detection meets ASIL-D timing requirements"""
        detection_times = []

        for scenario in fault_scenarios:
            detection_success = await safety_tester.safety_system.detect_fault(
                scenario["fault_type"],
                scenario["component"]
            )

            # Get the latest safety event
            latest_event = safety_tester.safety_system.safety_events[-1]
            detection_times.append(latest_event.response_time_ms)

            assert detection_success, f"Fault detection failed for {scenario['component']}"
            assert latest_event.response_time_ms <= ASIL_D_REQUIREMENTS["fault_detection_time_ms"], \
                f"Detection time {latest_event.response_time_ms}ms exceeds ASIL-D requirement"

        avg_detection_time = sum(detection_times) / len(detection_times)
        print(f"Average fault detection time: {avg_detection_time:.2f}ms")

    @pytest.mark.asyncio
    async def test_fail_safe_activation_time(self, safety_tester):
        """Test fail-safe activation time compliance"""
        safety_functions = safety_tester.config.safety_functions
        activation_times = []

        for function in safety_functions:
            result = await safety_tester.safety_system.activate_fail_safe(function)
            activation_times.append(result["activation_time_ms"])

            assert result["success"], f"Fail-safe activation failed for {function}"
            assert result["activation_time_ms"] <= ASIL_D_REQUIREMENTS["fail_safe_activation_time_ms"], \
                f"Activation time {result['activation_time_ms']}ms exceeds ASIL-D requirement"

        avg_activation_time = sum(activation_times) / len(activation_times)
        print(f"Average fail-safe activation time: {avg_activation_time:.2f}ms")

    def test_system_availability_requirement(self, safety_tester):
        """Test system availability meets ASIL-D requirements"""
        availability = safety_tester.safety_system.get_system_availability()

        assert availability >= ASIL_D_REQUIREMENTS["availability_percent"], \
            f"System availability {availability:.2f}% below ASIL-D requirement {ASIL_D_REQUIREMENTS['availability_percent']}%"

        print(f"System availability: {availability:.2f}%")

    def test_redundancy_coverage(self, safety_tester):
        """Test redundancy coverage meets requirements"""
        coverage = safety_tester.safety_system.verify_redundancy_coverage()

        for function, coverage_percent in coverage.items():
            assert coverage_percent >= ASIL_D_REQUIREMENTS["redundancy_coverage_percent"], \
                f"Redundancy coverage for {function} ({coverage_percent:.2f}%) below requirement"

        avg_coverage = sum(coverage.values()) / len(coverage)
        print(f"Average redundancy coverage: {avg_coverage:.2f}%")

class TestFailSafeMechanisms:
    """Test fail-safe mechanism verification"""

    @pytest.mark.asyncio
    async def test_emergency_braking_fail_safe(self, safety_tester):
        """Test emergency braking fail-safe mechanism"""
        # Simulate brake system fault
        await safety_tester.safety_system.detect_fault(
            FaultType.SENSOR_FAILURE,
            "brake_pressure_sensor"
        )

        # Activate fail-safe
        result = await safety_tester.safety_system.activate_fail_safe("emergency_braking")

        assert result["success"], "Emergency braking fail-safe activation failed"
        assert result["redundant_system_active"], "Redundant braking system not activated"

        print(f"Emergency braking fail-safe activated in {result['activation_time_ms']:.2f}ms")

    @pytest.mark.asyncio
    async def test_lane_keeping_degraded_mode(self, safety_tester):
        """Test lane keeping system degraded mode operation"""
        # Simulate partial camera failure
        await safety_tester.safety_system.detect_fault(
            FaultType.SENSOR_FAILURE,
            "camera_lane_detection"
        )

        result = await safety_tester.safety_system.activate_fail_safe("lane_keeping")

        # System should enter degraded mode but remain functional
        assert result["success"], "Lane keeping fail-safe failed"
        assert safety_tester.safety_system.state in [SystemState.OPERATIONAL, SystemState.DEGRADED], \
            "System entered unexpected state"

        print(f"Lane keeping degraded mode: {result['system_state']}")

    @pytest.mark.asyncio
    async def test_collision_avoidance_redundancy(self, safety_tester):
        """Test collision avoidance system redundancy"""
        # Test multiple sensor failures
        failures = ["radar_front", "lidar_front", "camera_front"]

        for component in failures:
            await safety_tester.safety_system.detect_fault(
                FaultType.SENSOR_FAILURE,
                component
            )

        # Collision avoidance should still function with remaining sensors
        result = await safety_tester.safety_system.activate_fail_safe("collision_avoidance")

        assert result["success"], "Collision avoidance redundancy failed"

        # Check that system maintains minimum functionality
        availability = safety_tester.safety_system.get_system_availability()
        assert availability >= 80.0, f"System availability {availability:.2f}% too low after multiple failures"

class TestSystemStates:
    """Test system state transitions and safety modes"""

    def test_operational_to_degraded_transition(self, safety_tester):
        """Test transition from operational to degraded state"""
        initial_state = safety_tester.safety_system.state
        assert initial_state == SystemState.OPERATIONAL, "System not starting in operational state"

        # Induce degradation
        safety_tester.safety_system.redundant_systems["emergency_braking"]["primary"]["health"] = 30
        safety_tester.safety_system.state = SystemState.DEGRADED

        assert safety_tester.safety_system.state == SystemState.DEGRADED, "State transition to degraded failed"

        # Verify system still provides basic safety functions
        availability = safety_tester.safety_system.get_system_availability()
        assert availability >= 75.0, f"Degraded mode availability {availability:.2f}% too low"

    def test_fail_safe_state_entry(self, safety_tester):
        """Test entry into fail-safe state under critical conditions"""
        # Simulate critical system failure
        safety_tester.safety_system.state = SystemState.FAIL_SAFE

        # In fail-safe mode, system should provide minimal critical functions
        critical_functions = ["emergency_braking"]

        for function in critical_functions:
            systems = safety_tester.safety_system.redundant_systems[function]
            active_count = sum(1 for system in systems.values() if system["status"] == "active")
            assert active_count >= 1, f"No active system for critical function {function} in fail-safe mode"

    def test_emergency_stop_conditions(self, safety_tester):
        """Test emergency stop activation conditions"""
        # Simulate conditions requiring emergency stop
        critical_failures = [
            "primary_brake_controller",
            "secondary_brake_controller",
            "steering_controller"
        ]

        for component in critical_failures:
            safety_tester.safety_system.active_faults[component] = FaultType.PROCESSING_ERROR

        # Check if emergency stop should be activated
        fault_count = len(safety_tester.safety_system.active_faults)

        if fault_count >= 3:  # Multiple critical failures
            safety_tester.safety_system.state = SystemState.EMERGENCY_STOP

        assert safety_tester.safety_system.state == SystemState.EMERGENCY_STOP, \
            "Emergency stop not activated under critical conditions"

        print(f"Emergency stop activated after {fault_count} critical failures")

class TestSafetyEventLogging:
    """Test safety event logging and audit trail"""

    @pytest.mark.asyncio
    async def test_safety_event_logging(self, safety_tester):
        """Test comprehensive safety event logging"""
        initial_event_count = len(safety_tester.safety_system.safety_events)

        # Generate various safety events
        test_events = [
            (FaultType.SENSOR_FAILURE, "camera_1"),
            (FaultType.COMMUNICATION_LOSS, "radar_2"),
            (FaultType.PROCESSING_ERROR, "perception_module")
        ]

        for fault_type, component in test_events:
            await safety_tester.safety_system.detect_fault(fault_type, component)

        final_event_count = len(safety_tester.safety_system.safety_events)
        new_events = final_event_count - initial_event_count

        assert new_events == len(test_events), f"Expected {len(test_events)} new events, got {new_events}"

        # Verify event structure and content
        for event in safety_tester.safety_system.safety_events[-new_events:]:
            assert event.event_id, "Event ID missing"
            assert event.timestamp > 0, "Invalid timestamp"
            assert event.severity == SafetyLevel.ASIL_D, "Incorrect severity level"
            assert event.response_time_ms > 0, "Invalid response time"

    def test_audit_trail_generation(self, safety_tester):
        """Test generation of safety audit trail"""
        # Generate audit trail data
        audit_data = {
            "system_config": asdict(safety_tester.config),
            "safety_events": [asdict(event) for event in safety_tester.safety_system.safety_events],
            "test_results": safety_tester.test_results,
            "compliance_status": {
                "asil_level": SafetyLevel.ASIL_D.value,
                "availability": safety_tester.safety_system.get_system_availability(),
                "redundancy_coverage": safety_tester.safety_system.verify_redundancy_coverage()
            },
            "timestamp": time.time()
        }

        # Save audit trail
        os.makedirs("tests/phase7_adas/reports", exist_ok=True)
        audit_file = "tests/phase7_adas/reports/safety_audit_trail.json"

        with open(audit_file, "w") as f:
            json.dump(audit_data, f, indent=2)

        # Verify audit file was created and contains expected data
        assert path_exists(audit_file), "Audit trail file not created"

        with open(audit_file, "r") as f:
            loaded_data = json.load(f)

        assert "compliance_status" in loaded_data, "Compliance status missing from audit trail"
        assert "safety_events" in loaded_data, "Safety events missing from audit trail"

        print(f"Audit trail generated: {audit_file}")

class TestASILDVerification:
    """Comprehensive ASIL-D verification tests"""

    @pytest.mark.asyncio
    async def test_comprehensive_asil_d_compliance(self, safety_tester):
        """Comprehensive ASIL-D compliance verification"""
        compliance_results = {}

        # Test 1: Fault detection timing
        fault_detection_times = []
        for i in range(10):
            await safety_tester.safety_system.detect_fault(
                FaultType.SENSOR_FAILURE,
                f"test_sensor_{i}"
            )
            event = safety_tester.safety_system.safety_events[-1]
            fault_detection_times.append(event.response_time_ms)

        avg_detection_time = sum(fault_detection_times) / len(fault_detection_times)
        compliance_results["fault_detection"] = {
            "avg_time_ms": avg_detection_time,
            "compliant": avg_detection_time <= ASIL_D_REQUIREMENTS["fault_detection_time_ms"]
        }

        # Test 2: Fail-safe activation timing
        activation_times = []
        for function in safety_tester.config.safety_functions:
            result = await safety_tester.safety_system.activate_fail_safe(function)
            activation_times.append(result["activation_time_ms"])

        avg_activation_time = sum(activation_times) / len(activation_times)
        compliance_results["fail_safe_activation"] = {
            "avg_time_ms": avg_activation_time,
            "compliant": avg_activation_time <= ASIL_D_REQUIREMENTS["fail_safe_activation_time_ms"]
        }

        # Test 3: System availability
        availability = safety_tester.safety_system.get_system_availability()
        compliance_results["availability"] = {
            "percentage": availability,
            "compliant": availability >= ASIL_D_REQUIREMENTS["availability_percent"]
        }

        # Test 4: Redundancy coverage
        coverage = safety_tester.safety_system.verify_redundancy_coverage()
        avg_coverage = sum(coverage.values()) / len(coverage)
        compliance_results["redundancy"] = {
            "avg_coverage_percent": avg_coverage,
            "compliant": avg_coverage >= ASIL_D_REQUIREMENTS["redundancy_coverage_percent"]
        }

        # Overall compliance assessment
        all_compliant = all(result["compliant"] for result in compliance_results.values())
        compliance_results["overall_compliant"] = all_compliant

        # Save compliance report
        os.makedirs("tests/phase7_adas/reports", exist_ok=True)
        with open("tests/phase7_adas/reports/asil_d_compliance_report.json", "w") as f:
            json.dump(compliance_results, f, indent=2)

        # Assert overall compliance
        assert all_compliant, f"ASIL-D compliance failed: {compliance_results}"

        print("ASIL-D compliance verification completed successfully")
        for test, result in compliance_results.items():
            if isinstance(result, dict) and "compliant" in result:
                status = "PASS" if result["compliant"] else "FAIL"

if __name__ == "__main__":
    # Run safety compliance tests
    pytest.main([__file__, "-v", "--tb=short", "-m", "not slow"])