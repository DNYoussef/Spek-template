"""
ADAS Phase 7 Test Configuration
Shared fixtures and configuration for ADAS testing suite.
"""

from typing import Dict, Any, List
import json
import os
import shutil
import tempfile

import asyncio
import numpy as np
import pytest

# Test configuration
pytest_plugins = ["pytest_asyncio"]

def pytest_configure(config):
    """Configure pytest for ADAS testing"""
    # Add custom markers
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (may take several minutes)"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "safety_critical: marks tests as safety-critical"
    )
    config.addinivalue_line(
        "markers", "performance: marks tests as performance tests"
    )
    config.addinivalue_line(
        "markers", "simulation: marks tests as simulation-based"
    )

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
def test_data_dir():
    """Create temporary directory for test data"""
    temp_dir = tempfile.mkdtemp(prefix="adas_test_")
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)

@pytest.fixture(scope="session")
def adas_test_config():
    """ADAS testing configuration"""
    return {
        "performance": {
            "latency_threshold_ms": 10.0,
            "throughput_min_ops_sec": 1000,
            "max_cpu_usage_percent": 80.0,
            "max_memory_usage_mb": 512.0,
            "stress_test_duration_sec": 30.0
        },
        "safety": {
            "asil_level": "D",
            "availability_percent": 99.99,
            "fault_detection_time_ms": 50,
            "fail_safe_activation_time_ms": 100,
            "redundancy_coverage_percent": 95.0
        },
        "sensor_fusion": {
            "sync_tolerance_ms": 1.0,
            "fusion_accuracy_threshold": 95.0,
            "min_sensors_for_fusion": 2,
            "calibration_drift_threshold": 0.5,
            "max_sensor_age_ms": 100.0
        },
        "perception": {
            "map_threshold": 85.0,
            "tracking_consistency": 90.0,
            "false_positive_rate_max": 5.0,
            "false_negative_rate_max": 10.0,
            "detection_confidence_min": 0.7,
            "min_detection_size_pixels": 20,
            "max_detection_latency_ms": 50.0
        },
        "simulation": {
            "time_step_ms": 50,
            "simulation_duration_s": 60.0,
            "max_vehicles": 10,
            "max_pedestrians": 5
        }
    }

@pytest.fixture
def mock_image_data():
    """Generate mock image data for testing"""
    return np.random.randint(0, 255, (1080, 1920, 3), dtype=np.uint8)

@pytest.fixture
def sample_objects():
    """Sample objects for testing"""
    return [
        {
            "type": "vehicle",
            "position": [20.0, 2.0, 0.0],
            "velocity": [15.0, 0.0, 0.0],
            "dimensions": [4.5, 1.8, 1.5]
        },
        {
            "type": "pedestrian",
            "position": [10.0, -3.0, 0.0],
            "velocity": [1.5, 0.5, 0.0],
            "dimensions": [0.6, 0.4, 1.7]
        },
        {
            "type": "cyclist",
            "position": [30.0, 1.0, 0.0],
            "velocity": [8.0, -1.0, 0.0],
            "dimensions": [1.8, 0.6, 1.2]
        }
    ]

@pytest.fixture
def performance_baseline():
    """Performance baseline metrics"""
    return {
        "latency_ms": {
            "p50": 5.0,
            "p95": 8.0,
            "p99": 9.5,
            "max": 10.0
        },
        "throughput_ops_sec": {
            "min": 1000,
            "avg": 1200,
            "burst": 1500
        },
        "resource_usage": {
            "cpu_percent": 60.0,
            "memory_mb": 256.0,
            "disk_io_mbps": 10.0
        }
    }

@pytest.fixture
def safety_test_scenarios():
    """Safety test scenarios"""
    return [
        {
            "name": "sensor_failure_camera",
            "fault_type": "sensor_failure",
            "affected_component": "camera_front",
            "expected_response": "activate_backup_sensors"
        },
        {
            "name": "communication_loss_lidar",
            "fault_type": "communication_loss",
            "affected_component": "lidar_system",
            "expected_response": "degrade_gracefully"
        },
        {
            "name": "processing_error_perception",
            "fault_type": "processing_error",
            "affected_component": "perception_module",
            "expected_response": "enter_safe_mode"
        },
        {
            "name": "power_loss_radar",
            "fault_type": "power_loss",
            "affected_component": "radar_array",
            "expected_response": "activate_redundancy"
        }
    ]

@pytest.fixture
def weather_test_conditions():
    """Weather test conditions"""
    return [
        {"condition": "clear", "visibility_factor": 1.0, "detection_factor": 1.0},
        {"condition": "rain", "visibility_factor": 0.8, "detection_factor": 0.85},
        {"condition": "fog", "visibility_factor": 0.4, "detection_factor": 0.6},
        {"condition": "snow", "visibility_factor": 0.6, "detection_factor": 0.7},
        {"condition": "night", "visibility_factor": 0.7, "detection_factor": 0.75}
    ]

@pytest.fixture(scope="function")
def test_report_manager(test_data_dir):
    """Test report manager for collecting test results"""
    class TestReportManager:
        def __init__(self, base_dir):
            self.base_dir = base_dir
            self.reports_dir = os.path.join(base_dir, "reports")
            os.makedirs(self.reports_dir, exist_ok=True)
            self.test_results = []

        def add_test_result(self, test_name: str, result: Dict[str, Any]):
            """Add test result to collection"""
            self.test_results.append({
                "test_name": test_name,
                "result": result,
                "timestamp": time.time()
            })

        def save_report(self, report_name: str, data: Dict[str, Any]):
            """Save report to file"""
            report_path = os.path.join(self.reports_dir, f"{report_name}.json")
            with open(report_path, 'w') as f:
                json.dump(data, f, indent=2)
            return report_path

        def generate_summary_report(self) -> Dict[str, Any]:
            """Generate summary report of all tests"""
            if not self.test_results:
                return {"message": "No test results available"}

            passed_tests = [r for r in self.test_results if r["result"].get("passed", False)]
            failed_tests = [r for r in self.test_results if not r["result"].get("passed", True)]

            summary = {
                "total_tests": len(self.test_results),
                "passed_tests": len(passed_tests),
                "failed_tests": len(failed_tests),
                "pass_rate": len(passed_tests) / len(self.test_results) * 100 if self.test_results else 0,
                "test_results": self.test_results
            }

            # Save summary report
            self.save_report("test_summary", summary)
            return summary

    return TestReportManager(test_data_dir)

@pytest.fixture
def sensor_configurations():
    """Standard sensor configurations for testing"""
    return {
        "minimal": [
            {"type": "camera", "id": "camera_front", "position": [0.0, 0.0, 1.5]},
            {"type": "radar", "id": "radar_front", "position": [2.0, 0.0, 0.5]}
        ],
        "standard": [
            {"type": "camera", "id": "camera_front", "position": [0.0, 0.0, 1.5]},
            {"type": "lidar", "id": "lidar_roof", "position": [0.0, 0.0, 2.0]},
            {"type": "radar", "id": "radar_front", "position": [2.0, 0.0, 0.5]},
            {"type": "radar", "id": "radar_rear", "position": [-2.0, 0.0, 0.5]}
        ],
        "comprehensive": [
            {"type": "camera", "id": "camera_front", "position": [0.0, 0.0, 1.5]},
            {"type": "camera", "id": "camera_rear", "position": [-2.0, 0.0, 1.5]},
            {"type": "lidar", "id": "lidar_roof", "position": [0.0, 0.0, 2.0]},
            {"type": "radar", "id": "radar_front", "position": [2.0, 0.0, 0.5]},
            {"type": "radar", "id": "radar_rear", "position": [-2.0, 0.0, 0.5]},
            {"type": "radar", "id": "radar_left", "position": [0.0, 1.0, 0.5]},
            {"type": "radar", "id": "radar_right", "position": [0.0, -1.0, 0.5]},
            {"type": "ultrasonic", "id": "ultrasonic_fl", "position": [1.5, 0.8, 0.3]},
            {"type": "ultrasonic", "id": "ultrasonic_fr", "position": [1.5, -0.8, 0.3]},
            {"type": "ultrasonic", "id": "ultrasonic_rl", "position": [-1.5, 0.8, 0.3]},
            {"type": "ultrasonic", "id": "ultrasonic_rr", "position": [-1.5, -0.8, 0.3]}
        ]
    }

def pytest_collection_modifyitems(config, items):
    """Modify test collection to add appropriate markers"""
    for item in items:
        # Mark slow tests
        if "stress" in item.name or "load" in item.name or "endurance" in item.name:
            item.add_marker(pytest.mark.slow)

        # Mark safety critical tests
        if any(keyword in item.name for keyword in ["safety", "compliance", "emergency", "fail_safe"]):
            item.add_marker(pytest.mark.safety_critical)

        # Mark performance tests
        if any(keyword in item.name for keyword in ["performance", "latency", "throughput", "benchmark"]):
            item.add_marker(pytest.mark.performance)

        # Mark simulation tests
        if any(keyword in item.name for keyword in ["simulation", "scenario", "weather", "driving"]):
            item.add_marker(pytest.mark.simulation)

def pytest_runtest_setup(item):
    """Setup for each test"""
    # Skip slow tests unless explicitly requested
    if "slow" in item.keywords and not item.config.getoption("--run-slow", default=False):
        pytest.skip("Slow test skipped (use --run-slow to run)")

def pytest_addoption(parser):
    """Add custom command line options"""
    parser.addoption(
        "--run-slow",
        action="store_true",
        default=False,
        help="Run slow tests"
    )
    parser.addoption(
        "--safety-only",
        action="store_true",
        default=False,
        help="Run only safety-critical tests"
    )
    parser.addoption(
        "--performance-only",
        action="store_true",
        default=False,
        help="Run only performance tests"
    )

def pytest_runtest_teardown(item):
    """Teardown for each test"""
    # Clean up any temporary resources

@pytest.fixture(autouse=True)
def setup_test_environment():
    """Automatically setup test environment for all tests"""
    # Ensure reports directory exists
    os.makedirs("tests/phase7_adas/reports", exist_ok=True)

    # Set numpy random seed for reproducible tests
    np.random.seed(42)

    yield

    # Cleanup after test

# Test data generators
def generate_test_vehicle_data(count: int = 5) -> List[Dict[str, Any]]:
    """Generate test vehicle data"""
    vehicles = []
    for i in range(count):
        vehicles.append({
            "id": f"vehicle_{i}",
            "position": [i * 10.0, 50.0 + i * 20.0, 0.0],
            "velocity": [0.0, 15.0 + np.random.uniform(-5, 5), 0.0],
            "dimensions": [4.5, 1.8, 1.5],
            "type": "vehicle"
        })
    return vehicles

def generate_test_pedestrian_data(count: int = 3) -> List[Dict[str, Any]]:
    """Generate test pedestrian data"""
    pedestrians = []
    for i in range(count):
        pedestrians.append({
            "id": f"pedestrian_{i}",
            "position": [5.0 + i * 3.0, 10.0 + i * 5.0, 0.0],
            "velocity": [1.0, 0.5, 0.0],
            "dimensions": [0.6, 0.4, 1.7],
            "type": "pedestrian"
        })
    return pedestrians

def generate_fault_scenarios() -> List[Dict[str, Any]]:
    """Generate fault injection scenarios"""
    return [
        {
            "name": "camera_degradation",
            "component": "camera_front",
            "fault_type": "degraded_performance",
            "severity": "medium",
            "duration_s": 10.0
        },
        {
            "name": "lidar_intermittent",
            "component": "lidar_roof",
            "fault_type": "intermittent_failure",
            "severity": "high",
            "duration_s": 5.0
        },
        {
            "name": "radar_noise",
            "component": "radar_front",
            "fault_type": "noisy_data",
            "severity": "low",
            "duration_s": 15.0
        },
        {
            "name": "system_overload",
            "component": "processing_unit",
            "fault_type": "resource_exhaustion",
            "severity": "critical",
            "duration_s": 3.0
        }
    ]

# Performance test utilities
class PerformanceMonitor:
    """Performance monitoring utility for tests"""

    def __init__(self):
        self.start_time = None
        self.metrics = []

    def start(self):
        """Start performance monitoring"""
        self.start_time = time.perf_counter()

    def record_metric(self, name: str, value: float, unit: str = ""):
        """Record a performance metric"""
        timestamp = time.perf_counter() - (self.start_time or 0)
        self.metrics.append({
            "name": name,
            "value": value,
            "unit": unit,
            "timestamp": timestamp
        })

    def get_summary(self) -> Dict[str, Any]:
        """Get performance summary"""
        if not self.metrics:
            return {}

        latency_metrics = [m for m in self.metrics if "latency" in m["name"]]

        summary = {
            "total_metrics": len(self.metrics),
            "duration_s": max(m["timestamp"] for m in self.metrics) if self.metrics else 0,
            "metrics": self.metrics
        }

        if latency_metrics:
            latencies = [m["value"] for m in latency_metrics]
            summary["latency_summary"] = {
                "min": min(latencies),
                "max": max(latencies),
                "avg": sum(latencies) / len(latencies),
                "p95": np.percentile(latencies, 95),
                "p99": np.percentile(latencies, 99)
            }

        return summary

@pytest.fixture
def performance_monitor():
    """Performance monitor fixture"""
    return PerformanceMonitor()

# Validation utilities
def validate_adas_response(response: Dict[str, Any], expected: Dict[str, Any]) -> bool:
    """Validate ADAS system response"""
    required_fields = ["decision", "confidence", "timestamp"]

    # Check required fields
    if not all(field in response for field in required_fields):
        return False

    # Check decision validity
    valid_decisions = ["maintain", "brake", "emergency_brake", "steer", "stop"]
    if response["decision"] not in valid_decisions:
        return False

    # Check confidence range
    if not 0.0 <= response["confidence"] <= 1.0:
        return False

    # Check against expected values if provided
    if expected:
        if "min_confidence" in expected:
            if response["confidence"] < expected["min_confidence"]:
                return False

        if "expected_decision" in expected:
            if response["decision"] != expected["expected_decision"]:
                return False

    return True

def validate_sensor_data(sensor_data: Dict[str, Any]) -> bool:
    """Validate sensor data structure"""
    required_fields = ["sensor_id", "timestamp", "data", "confidence"]

    if not all(field in sensor_data for field in required_fields):
        return False

    # Check timestamp is recent
    current_time = time.time()
    if abs(sensor_data["timestamp"] - current_time) > 1.0:  # 1 second tolerance
        return False

    # Check confidence range
    if not 0.0 <= sensor_data["confidence"] <= 1.0:
        return False

    return True

# Import time for fixtures that need it
import time