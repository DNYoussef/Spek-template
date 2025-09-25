"""
This module provides testing frameworks for:
- Real-time performance validation
- ISO 26262 ASIL-D safety compliance
- Multi-sensor fusion accuracy
- Perception system validation

Requirements:
- Real-time latency < 10ms
- 99.99% system availability
- ASIL-D compliance validation
- Multi-sensor fusion accuracy > 95%
- Object detection mAP > 85%
"""

from src.constants.base import MINIMUM_TRADE_THRESHOLD

__version__ = "1.0.0"
__author__ = "ADAS Testing Team"

from .test_real_time_performance import (
    RealTimePerformanceTester,
    PerformanceMetrics,
    MockADASProcessor
)

from .test_safety_compliance import (
    SafetyComplianceTester,
    SafetyEvent,
    FailSafeConfig,
    SafetyLevel,
    FaultType,
    SystemState
)

from .test_sensor_fusion import (
    SensorFusionTester,
    SensorFusionEngine,
    MockSensor,
    SensorType,
    SensorStatus,
    FusedObject
)

from .test_perception_accuracy import (
    PerceptionAccuracyTester,
    MockPerceptionSystem,
    ObjectType,
    WeatherCondition,
    ScenarioType,
    DetectionMetrics,
    TrackingMetrics
)

__all__ = [
    # Performance Testing
    "RealTimePerformanceTester",
    "PerformanceMetrics",
    "MockADASProcessor",

    # Safety Compliance
    "SafetyComplianceTester",
    "SafetyEvent",
    "FailSafeConfig",
    "SafetyLevel",
    "FaultType",
    "SystemState",

    # Sensor Fusion
    "SensorFusionTester",
    "SensorFusionEngine",
    "MockSensor",
    "SensorType",
    "SensorStatus",
    "FusedObject",

    # Perception Accuracy
    "PerceptionAccuracyTester",
    "MockPerceptionSystem",
    "ObjectType",
    "WeatherCondition",
    "ScenarioType",
    "DetectionMetrics",
    "TrackingMetrics"
]

# Test configuration constants
ADAS_TEST_CONFIG = {
    "performance": {
        "latency_threshold_ms": 10.0,
        "throughput_min_ops_sec": 1000,
        "max_cpu_usage_percent": 80.0,
        "max_memory_usage_mb": 512.0
    },
    "safety": {
        "asil_level": "D",
        "availability_percent": 99.99,
        "fault_detection_time_ms": 50,
        "fail_safe_activation_time_ms": 100
    },
    "sensor_fusion": {
        "sync_tolerance_ms": 1.0,
        "fusion_accuracy_threshold": 95.0,
        "min_sensors_for_fusion": 2,
        "calibration_drift_threshold": MINIMUM_TRADE_THRESHOLD
    },
    "perception": {
        "map_threshold": 85.0,
        "tracking_consistency": 90.0,
        "false_positive_rate_max": 5.0,
        "false_negative_rate_max": 10.0
    }
}

def get_test_config():
    """Get ADAS testing configuration"""
    return ADAS_TEST_CONFIG.copy()

def validate_system_requirements():
    """Validate that system meets ADAS testing requirements"""
    import psutil
    import platform

    requirements = {
        "python_version": "3.8+",
        "memory_gb": 8,
        "cpu_cores": 4,
        "disk_space_gb": 10
    }

    # Check Python version
    python_version = platform.python_version()
    major, minor = map(int, python_version.split('.')[:2])
    python_ok = major >= 3 and minor >= 8

    # Check system resources
    memory_gb = psutil.virtual_memory().total / (1024**3)
    cpu_cores = psutil.cpu_count()
    disk_space_gb = psutil.disk_usage('/').free / (1024**3)

    results = {
        "python_version": {
            "required": requirements["python_version"],
            "actual": python_version,
            "passed": python_ok
        },
        "memory_gb": {
            "required": requirements["memory_gb"],
            "actual": round(memory_gb, 1),
            "passed": memory_gb >= requirements["memory_gb"]
        },
        "cpu_cores": {
            "required": requirements["cpu_cores"],
            "actual": cpu_cores,
            "passed": cpu_cores >= requirements["cpu_cores"]
        },
        "disk_space_gb": {
            "required": requirements["disk_space_gb"],
            "actual": round(disk_space_gb, 1),
            "passed": disk_space_gb >= requirements["disk_space_gb"]
        }
    }

    all_passed = all(result["passed"] for result in results.values())

    return {
        "overall_passed": all_passed,
        "details": results
    }