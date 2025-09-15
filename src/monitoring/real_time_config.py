"""
Real-Time System Configuration for Defense Industry Monitoring

Provides optimized configuration for real-time defense systems
with deterministic performance and minimal overhead guarantees.
"""

import json
import time
import threading
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
import logging
import psutil
import platform


class RealTimeMode(Enum):
    """Real-time system operation modes."""
    SOFT_REAL_TIME = "soft_real_time"
    HARD_REAL_TIME = "hard_real_time"
    MISSION_CRITICAL = "mission_critical"
    DEVELOPMENT = "development"


class PriorityLevel(Enum):
    """System priority levels for real-time operations."""
    CRITICAL = 1
    HIGH = 2
    NORMAL = 3
    LOW = 4
    BACKGROUND = 5


@dataclass
class PerformanceConstraints:
    """Performance constraints for real-time systems."""
    max_response_time_ms: float
    max_overhead_percent: float
    max_jitter_ms: float
    min_throughput: int
    max_memory_usage_mb: float
    max_cpu_usage_percent: float
    deterministic_scheduling: bool = True
    priority_inversion_protection: bool = True


@dataclass
class ResourceLimits:
    """Resource allocation limits for monitoring components."""
    max_memory_mb: float
    max_cpu_percent: float
    max_threads: int
    max_file_handles: int
    max_network_connections: int
    buffer_size_limit: int
    cache_size_limit: int


@dataclass
class MonitoringProfile:
    """Monitoring system profile configuration."""
    name: str
    mode: RealTimeMode
    constraints: PerformanceConstraints
    resource_limits: ResourceLimits
    sampling_intervals: Dict[str, float]
    enabled_features: List[str]
    disabled_features: List[str]
    priority_overrides: Dict[str, PriorityLevel]


class SystemResourceAnalyzer:
    """Analyzes system resources for optimal real-time configuration."""

    def __init__(self):
        self.system_info = self._gather_system_info()
        self.logger = logging.getLogger('SystemResourceAnalyzer')

    def _gather_system_info(self) -> Dict[str, Any]:
        """Gather comprehensive system information."""
        try:
            cpu_count = psutil.cpu_count()
            cpu_freq = psutil.cpu_freq()
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')

            return {
                "cpu_count": cpu_count,
                "cpu_freq_mhz": cpu_freq.max if cpu_freq else 0,
                "memory_total_gb": memory.total / (1024**3),
                "memory_available_gb": memory.available / (1024**3),
                "disk_total_gb": disk.total / (1024**3),
                "disk_free_gb": disk.free / (1024**3),
                "platform": platform.system(),
                "architecture": platform.architecture()[0],
                "processor": platform.processor()
            }
        except Exception as e:
            self.logger.warning(f"Could not gather system info: {e}")
            return {}

    def analyze_real_time_capability(self) -> Dict[str, Any]:
        """Analyze system's real-time processing capability."""
        analysis = {
            "real_time_capable": False,
            "recommended_mode": RealTimeMode.DEVELOPMENT,
            "limitations": [],
            "recommendations": []
        }

        # CPU analysis
        cpu_count = self.system_info.get("cpu_count", 1)
        cpu_freq = self.system_info.get("cpu_freq_mhz", 0)

        if cpu_count < 2:
            analysis["limitations"].append("Insufficient CPU cores for real-time processing")
        elif cpu_count >= 4:
            analysis["real_time_capable"] = True

        if cpu_freq < 2000:  # Less than 2GHz
            analysis["limitations"].append("Low CPU frequency may impact real-time performance")

        # Memory analysis
        memory_gb = self.system_info.get("memory_total_gb", 0)

        if memory_gb < 4:
            analysis["limitations"].append("Insufficient memory for real-time monitoring")
        elif memory_gb >= 8:
            analysis["real_time_capable"] = True

        # Platform analysis
        platform_name = self.system_info.get("platform", "")

        if platform_name == "Linux":
            analysis["recommendations"].append("Use PREEMPT_RT kernel for hard real-time")
        elif platform_name == "Windows":
            analysis["recommendations"].append("Configure high-priority process class")

        # Determine recommended mode
        if analysis["real_time_capable"] and len(analysis["limitations"]) == 0:
            if memory_gb >= 16 and cpu_count >= 8:
                analysis["recommended_mode"] = RealTimeMode.MISSION_CRITICAL
            elif memory_gb >= 8 and cpu_count >= 4:
                analysis["recommended_mode"] = RealTimeMode.HARD_REAL_TIME
            else:
                analysis["recommended_mode"] = RealTimeMode.SOFT_REAL_TIME
        else:
            analysis["recommended_mode"] = RealTimeMode.DEVELOPMENT

        return analysis

    def calculate_optimal_resource_allocation(self, mode: RealTimeMode) -> ResourceLimits:
        """Calculate optimal resource allocation for given mode."""
        memory_gb = self.system_info.get("memory_total_gb", 4)
        cpu_count = self.system_info.get("cpu_count", 2)

        if mode == RealTimeMode.MISSION_CRITICAL:
            # Reserve maximum resources for mission-critical systems
            return ResourceLimits(
                max_memory_mb=min(2048, memory_gb * 1024 * 0.3),  # 30% of total memory
                max_cpu_percent=15.0,  # Reserve 85% for application
                max_threads=min(16, cpu_count * 2),
                max_file_handles=1000,
                max_network_connections=100,
                buffer_size_limit=10000,
                cache_size_limit=50000
            )
        elif mode == RealTimeMode.HARD_REAL_TIME:
            return ResourceLimits(
                max_memory_mb=min(1536, memory_gb * 1024 * 0.25),  # 25% of total memory
                max_cpu_percent=20.0,
                max_threads=min(12, cpu_count * 2),
                max_file_handles=500,
                max_network_connections=50,
                buffer_size_limit=8000,
                cache_size_limit=30000
            )
        elif mode == RealTimeMode.SOFT_REAL_TIME:
            return ResourceLimits(
                max_memory_mb=min(1024, memory_gb * 1024 * 0.2),  # 20% of total memory
                max_cpu_percent=25.0,
                max_threads=min(8, cpu_count * 2),
                max_file_handles=200,
                max_network_connections=25,
                buffer_size_limit=5000,
                cache_size_limit=20000
            )
        else:  # DEVELOPMENT
            return ResourceLimits(
                max_memory_mb=min(512, memory_gb * 1024 * 0.15),  # 15% of total memory
                max_cpu_percent=50.0,
                max_threads=min(4, cpu_count),
                max_file_handles=100,
                max_network_connections=10,
                buffer_size_limit=1000,
                cache_size_limit=5000
            )


class RealTimeConfigurationManager:
    """Manages real-time system configuration and optimization."""

    def __init__(self):
        self.analyzer = SystemResourceAnalyzer()
        self.current_profile: Optional[MonitoringProfile] = None
        self.active_constraints: Optional[PerformanceConstraints] = None
        self.config_lock = threading.RLock()
        self.logger = logging.getLogger('RealTimeConfigurationManager')

        # Initialize with default profile
        self._initialize_default_profile()

    def _initialize_default_profile(self):
        """Initialize with a default monitoring profile."""
        analysis = self.analyzer.analyze_real_time_capability()
        recommended_mode = analysis["recommended_mode"]

        self.current_profile = self.create_monitoring_profile(
            name="default",
            mode=recommended_mode
        )

    def create_monitoring_profile(self, name: str, mode: RealTimeMode,
                                custom_constraints: Optional[PerformanceConstraints] = None) -> MonitoringProfile:
        """Create a monitoring profile for specified real-time mode."""

        # Get optimal resource allocation
        resource_limits = self.analyzer.calculate_optimal_resource_allocation(mode)

        # Set performance constraints based on mode
        if custom_constraints:
            constraints = custom_constraints
        else:
            constraints = self._get_default_constraints(mode)

        # Set sampling intervals based on mode
        sampling_intervals = self._get_sampling_intervals(mode)

        # Configure enabled/disabled features
        enabled_features, disabled_features = self._get_feature_configuration(mode)

        # Set priority overrides
        priority_overrides = self._get_priority_overrides(mode)

        return MonitoringProfile(
            name=name,
            mode=mode,
            constraints=constraints,
            resource_limits=resource_limits,
            sampling_intervals=sampling_intervals,
            enabled_features=enabled_features,
            disabled_features=disabled_features,
            priority_overrides=priority_overrides
        )

    def _get_default_constraints(self, mode: RealTimeMode) -> PerformanceConstraints:
        """Get default performance constraints for given mode."""
        if mode == RealTimeMode.MISSION_CRITICAL:
            return PerformanceConstraints(
                max_response_time_ms=0.1,  # 100 microseconds
                max_overhead_percent=0.5,  # 0.5% overhead
                max_jitter_ms=0.01,       # 10 microseconds jitter
                min_throughput=10000,     # 10k operations/sec
                max_memory_usage_mb=512,
                max_cpu_usage_percent=5.0,
                deterministic_scheduling=True,
                priority_inversion_protection=True
            )
        elif mode == RealTimeMode.HARD_REAL_TIME:
            return PerformanceConstraints(
                max_response_time_ms=1.0,   # 1 millisecond
                max_overhead_percent=1.0,   # 1% overhead
                max_jitter_ms=0.1,         # 100 microseconds jitter
                min_throughput=5000,       # 5k operations/sec
                max_memory_usage_mb=1024,
                max_cpu_usage_percent=10.0,
                deterministic_scheduling=True,
                priority_inversion_protection=True
            )
        elif mode == RealTimeMode.SOFT_REAL_TIME:
            return PerformanceConstraints(
                max_response_time_ms=10.0,  # 10 milliseconds
                max_overhead_percent=2.0,   # 2% overhead
                max_jitter_ms=1.0,         # 1 millisecond jitter
                min_throughput=1000,       # 1k operations/sec
                max_memory_usage_mb=2048,
                max_cpu_usage_percent=20.0,
                deterministic_scheduling=False,
                priority_inversion_protection=False
            )
        else:  # DEVELOPMENT
            return PerformanceConstraints(
                max_response_time_ms=100.0, # 100 milliseconds
                max_overhead_percent=10.0,  # 10% overhead
                max_jitter_ms=10.0,        # 10 milliseconds jitter
                min_throughput=100,        # 100 operations/sec
                max_memory_usage_mb=4096,
                max_cpu_usage_percent=50.0,
                deterministic_scheduling=False,
                priority_inversion_protection=False
            )

    def _get_sampling_intervals(self, mode: RealTimeMode) -> Dict[str, float]:
        """Get optimal sampling intervals for monitoring components."""
        if mode == RealTimeMode.MISSION_CRITICAL:
            return {
                "performance_metrics": 0.001,  # 1ms
                "resource_usage": 0.1,         # 100ms
                "security_scan": 60.0,         # 1 minute
                "compliance_check": 3600.0,    # 1 hour
                "health_check": 0.01,          # 10ms
                "rollback_evaluation": 0.1     # 100ms
            }
        elif mode == RealTimeMode.HARD_REAL_TIME:
            return {
                "performance_metrics": 0.01,   # 10ms
                "resource_usage": 0.5,         # 500ms
                "security_scan": 300.0,        # 5 minutes
                "compliance_check": 3600.0,    # 1 hour
                "health_check": 0.1,           # 100ms
                "rollback_evaluation": 0.5     # 500ms
            }
        elif mode == RealTimeMode.SOFT_REAL_TIME:
            return {
                "performance_metrics": 0.1,    # 100ms
                "resource_usage": 1.0,         # 1 second
                "security_scan": 600.0,        # 10 minutes
                "compliance_check": 7200.0,    # 2 hours
                "health_check": 1.0,           # 1 second
                "rollback_evaluation": 1.0     # 1 second
            }
        else:  # DEVELOPMENT
            return {
                "performance_metrics": 1.0,    # 1 second
                "resource_usage": 5.0,         # 5 seconds
                "security_scan": 1800.0,       # 30 minutes
                "compliance_check": 14400.0,   # 4 hours
                "health_check": 5.0,           # 5 seconds
                "rollback_evaluation": 5.0     # 5 seconds
            }

    def _get_feature_configuration(self, mode: RealTimeMode) -> tuple[List[str], List[str]]:
        """Get enabled and disabled features for given mode."""
        all_features = [
            "real_time_metrics",
            "performance_profiling",
            "security_scanning",
            "compliance_validation",
            "automated_rollback",
            "detailed_logging",
            "debug_traces",
            "audit_trails",
            "statistical_analysis",
            "trend_analysis",
            "anomaly_detection",
            "predictive_analysis"
        ]

        if mode == RealTimeMode.MISSION_CRITICAL:
            enabled = [
                "real_time_metrics",
                "automated_rollback",
                "audit_trails",
                "anomaly_detection"
            ]
            disabled = [f for f in all_features if f not in enabled]

        elif mode == RealTimeMode.HARD_REAL_TIME:
            enabled = [
                "real_time_metrics",
                "performance_profiling",
                "automated_rollback",
                "audit_trails",
                "anomaly_detection"
            ]
            disabled = [
                "debug_traces",
                "detailed_logging",
                "statistical_analysis",
                "predictive_analysis"
            ]

        elif mode == RealTimeMode.SOFT_REAL_TIME:
            enabled = [
                "real_time_metrics",
                "performance_profiling",
                "security_scanning",
                "compliance_validation",
                "automated_rollback",
                "audit_trails",
                "anomaly_detection",
                "trend_analysis"
            ]
            disabled = [
                "debug_traces",
                "detailed_logging",
                "predictive_analysis"
            ]

        else:  # DEVELOPMENT
            enabled = all_features
            disabled = []

        return enabled, disabled

    def _get_priority_overrides(self, mode: RealTimeMode) -> Dict[str, PriorityLevel]:
        """Get priority overrides for different monitoring components."""
        if mode == RealTimeMode.MISSION_CRITICAL:
            return {
                "rollback_evaluation": PriorityLevel.CRITICAL,
                "anomaly_detection": PriorityLevel.CRITICAL,
                "real_time_metrics": PriorityLevel.HIGH,
                "audit_trails": PriorityLevel.HIGH,
                "performance_profiling": PriorityLevel.NORMAL,
                "security_scanning": PriorityLevel.LOW,
                "compliance_validation": PriorityLevel.LOW
            }
        elif mode == RealTimeMode.HARD_REAL_TIME:
            return {
                "rollback_evaluation": PriorityLevel.CRITICAL,
                "real_time_metrics": PriorityLevel.HIGH,
                "anomaly_detection": PriorityLevel.HIGH,
                "performance_profiling": PriorityLevel.NORMAL,
                "audit_trails": PriorityLevel.NORMAL,
                "security_scanning": PriorityLevel.LOW,
                "compliance_validation": PriorityLevel.LOW
            }
        elif mode == RealTimeMode.SOFT_REAL_TIME:
            return {
                "rollback_evaluation": PriorityLevel.HIGH,
                "real_time_metrics": PriorityLevel.HIGH,
                "anomaly_detection": PriorityLevel.NORMAL,
                "performance_profiling": PriorityLevel.NORMAL,
                "security_scanning": PriorityLevel.NORMAL,
                "compliance_validation": PriorityLevel.LOW,
                "audit_trails": PriorityLevel.LOW
            }
        else:  # DEVELOPMENT
            return {
                "rollback_evaluation": PriorityLevel.NORMAL,
                "real_time_metrics": PriorityLevel.NORMAL,
                "anomaly_detection": PriorityLevel.NORMAL,
                "performance_profiling": PriorityLevel.NORMAL,
                "security_scanning": PriorityLevel.NORMAL,
                "compliance_validation": PriorityLevel.NORMAL,
                "audit_trails": PriorityLevel.NORMAL
            }

    def apply_profile(self, profile: MonitoringProfile) -> bool:
        """Apply a monitoring profile to the system."""
        with self.config_lock:
            try:
                # Validate profile against system capabilities
                validation_result = self._validate_profile(profile)
                if not validation_result["valid"]:
                    self.logger.error(f"Profile validation failed: {validation_result['reason']}")
                    return False

                # Apply system-level optimizations
                self._apply_system_optimizations(profile)

                # Set active profile and constraints
                self.current_profile = profile
                self.active_constraints = profile.constraints

                self.logger.info(f"Applied monitoring profile '{profile.name}' (mode: {profile.mode.value})")
                return True

            except Exception as e:
                self.logger.error(f"Failed to apply profile: {e}")
                return False

    def _validate_profile(self, profile: MonitoringProfile) -> Dict[str, Any]:
        """Validate profile against system capabilities."""
        # Check if system can meet performance constraints
        system_memory = self.analyzer.system_info.get("memory_total_gb", 0) * 1024  # Convert to MB

        if profile.resource_limits.max_memory_mb > system_memory * 0.8:
            return {
                "valid": False,
                "reason": f"Memory requirement ({profile.resource_limits.max_memory_mb}MB) exceeds 80% of system memory"
            }

        # Check CPU requirements
        cpu_count = self.analyzer.system_info.get("cpu_count", 1)
        if profile.resource_limits.max_threads > cpu_count * 4:
            return {
                "valid": False,
                "reason": f"Thread requirement ({profile.resource_limits.max_threads}) exceeds 4x CPU cores"
            }

        # Check real-time constraints feasibility
        if profile.mode in [RealTimeMode.HARD_REAL_TIME, RealTimeMode.MISSION_CRITICAL]:
            if profile.constraints.max_response_time_ms < 0.1:
                platform_name = self.analyzer.system_info.get("platform", "")
                if platform_name == "Windows":
                    return {
                        "valid": False,
                        "reason": "Sub-millisecond response times not reliable on Windows"
                    }

        return {"valid": True}

    def _apply_system_optimizations(self, profile: MonitoringProfile):
        """Apply system-level optimizations for real-time performance."""
        try:
            # Set process priority (if supported)
            if profile.mode in [RealTimeMode.HARD_REAL_TIME, RealTimeMode.MISSION_CRITICAL]:
                import os
                if hasattr(os, 'nice'):
                    # Lower nice value = higher priority on Unix systems
                    os.nice(-10)
                elif platform.system() == "Windows":
                    # Set high priority on Windows
                    import subprocess
                    subprocess.run(["wmic", "process", "where", f"processid={os.getpid()}",
                                  "CALL", "setpriority", "high priority"],
                                 capture_output=True)

            # Configure thread affinity (if supported)
            if profile.constraints.deterministic_scheduling:
                self._configure_thread_affinity()

            # Configure garbage collection for real-time (Python specific)
            if profile.mode == RealTimeMode.MISSION_CRITICAL:
                import gc
                # Disable automatic garbage collection for deterministic behavior
                gc.disable()
                self.logger.info("Disabled automatic garbage collection for mission-critical mode")

        except Exception as e:
            self.logger.warning(f"Could not apply all system optimizations: {e}")

    def _configure_thread_affinity(self):
        """Configure thread affinity for deterministic scheduling."""
        try:
            cpu_count = self.analyzer.system_info.get("cpu_count", 1)
            if cpu_count > 2:
                # Reserve last CPU core for monitoring threads
                import os
                if hasattr(os, 'sched_setaffinity'):
                    monitoring_cpu = {cpu_count - 1}
                    os.sched_setaffinity(0, monitoring_cpu)
                    self.logger.info(f"Set thread affinity to CPU {cpu_count - 1}")

        except Exception as e:
            self.logger.warning(f"Could not configure thread affinity: {e}")

    def get_current_configuration(self) -> Dict[str, Any]:
        """Get current monitoring configuration."""
        with self.config_lock:
            if not self.current_profile:
                return {}

            return {
                "profile_name": self.current_profile.name,
                "mode": self.current_profile.mode.value,
                "constraints": {
                    "max_response_time_ms": self.current_profile.constraints.max_response_time_ms,
                    "max_overhead_percent": self.current_profile.constraints.max_overhead_percent,
                    "max_jitter_ms": self.current_profile.constraints.max_jitter_ms,
                    "min_throughput": self.current_profile.constraints.min_throughput,
                    "deterministic_scheduling": self.current_profile.constraints.deterministic_scheduling
                },
                "resource_limits": {
                    "max_memory_mb": self.current_profile.resource_limits.max_memory_mb,
                    "max_cpu_percent": self.current_profile.resource_limits.max_cpu_percent,
                    "max_threads": self.current_profile.resource_limits.max_threads
                },
                "sampling_intervals": self.current_profile.sampling_intervals,
                "enabled_features": self.current_profile.enabled_features,
                "disabled_features": self.current_profile.disabled_features
            }

    def is_constraint_violated(self, metric_name: str, current_value: float) -> bool:
        """Check if a performance constraint is violated."""
        if not self.active_constraints:
            return False

        constraints_map = {
            "response_time_ms": self.active_constraints.max_response_time_ms,
            "overhead_percent": self.active_constraints.max_overhead_percent,
            "jitter_ms": self.active_constraints.max_jitter_ms,
            "memory_usage_mb": self.active_constraints.max_memory_usage_mb,
            "cpu_usage_percent": self.active_constraints.max_cpu_usage_percent
        }

        if metric_name in constraints_map:
            return current_value > constraints_map[metric_name]

        return False

    def get_sampling_interval(self, component: str) -> float:
        """Get sampling interval for a specific monitoring component."""
        if not self.current_profile:
            return 1.0  # Default 1 second

        return self.current_profile.sampling_intervals.get(component, 1.0)

    def is_feature_enabled(self, feature: str) -> bool:
        """Check if a monitoring feature is enabled."""
        if not self.current_profile:
            return True  # Default to enabled

        return feature in self.current_profile.enabled_features

    def get_component_priority(self, component: str) -> PriorityLevel:
        """Get priority level for a monitoring component."""
        if not self.current_profile:
            return PriorityLevel.NORMAL

        return self.current_profile.priority_overrides.get(component, PriorityLevel.NORMAL)

    def export_configuration(self, output_path: Path):
        """Export current configuration to file."""
        config_data = {
            "export_timestamp": time.time(),
            "system_info": self.analyzer.system_info,
            "current_configuration": self.get_current_configuration(),
            "system_analysis": self.analyzer.analyze_real_time_capability()
        }

        with open(output_path, 'w') as f:
            json.dump(config_data, f, indent=2)

        self.logger.info(f"Configuration exported to {output_path}")


# Example usage and testing
if __name__ == "__main__":
    print("=== Real-Time System Configuration ===")

    # Initialize configuration manager
    config_manager = RealTimeConfigurationManager()

    # Analyze system capabilities
    analyzer = config_manager.analyzer
    system_analysis = analyzer.analyze_real_time_capability()

    print(f"System Analysis:")
    print(f"  Real-time capable: {system_analysis['real_time_capable']}")
    print(f"  Recommended mode: {system_analysis['recommended_mode'].value}")

    if system_analysis['limitations']:
        print(f"  Limitations:")
        for limitation in system_analysis['limitations']:
            print(f"    - {limitation}")

    if system_analysis['recommendations']:
        print(f"  Recommendations:")
        for rec in system_analysis['recommendations']:
            print(f"    - {rec}")

    print()

    # Display available modes and their configurations
    modes = [RealTimeMode.DEVELOPMENT, RealTimeMode.SOFT_REAL_TIME,
             RealTimeMode.HARD_REAL_TIME, RealTimeMode.MISSION_CRITICAL]

    print("Available Monitoring Profiles:")
    for mode in modes:
        profile = config_manager.create_monitoring_profile(f"{mode.value}_profile", mode)
        print(f"\\n{mode.value.upper()}:")
        print(f"  Max response time: {profile.constraints.max_response_time_ms}ms")
        print(f"  Max overhead: {profile.constraints.max_overhead_percent}%")
        print(f"  Memory limit: {profile.resource_limits.max_memory_mb}MB")
        print(f"  CPU limit: {profile.resource_limits.max_cpu_percent}%")
        print(f"  Enabled features: {len(profile.enabled_features)}")

    # Apply recommended profile
    recommended_mode = system_analysis['recommended_mode']
    recommended_profile = config_manager.create_monitoring_profile(
        "recommended", recommended_mode
    )

    print(f"\\nApplying recommended profile: {recommended_mode.value}")
    success = config_manager.apply_profile(recommended_profile)

    if success:
        print("✓ Profile applied successfully")

        # Display current configuration
        current_config = config_manager.get_current_configuration()
        print(f"\\nCurrent Configuration:")
        print(f"  Mode: {current_config['mode']}")
        print(f"  Max response time: {current_config['constraints']['max_response_time_ms']}ms")
        print(f"  Max overhead: {current_config['constraints']['max_overhead_percent']}%")

        # Test constraint checking
        print(f"\\nConstraint Checking:")
        test_metrics = {
            "response_time_ms": 5.0,
            "overhead_percent": 2.5,
            "memory_usage_mb": 500
        }

        for metric, value in test_metrics.items():
            violated = config_manager.is_constraint_violated(metric, value)
            status = "VIOLATED" if violated else "OK"
            print(f"  {metric}: {value} [{status}]")

        # Export configuration
        export_path = Path("real_time_config.json")
        config_manager.export_configuration(export_path)
        print(f"\\nConfiguration exported to {export_path}")

    else:
        print("✗ Failed to apply profile")