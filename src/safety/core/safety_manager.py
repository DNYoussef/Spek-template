"""
SafetyManager - Central Safety System Orchestration
===================================================

Coordinates all safety subsystems to ensure 99.9% availability with <60s recovery.
Implements comprehensive monitoring, failover orchestration, and recovery validation.
"""

from datetime import datetime, timedelta
from typing import Dict, Callable, Any
import logging

from dataclasses import dataclass
from enum import Enum
import threading

logger = logging.getLogger(__name__)

class SafetyState(Enum):
    """Safety system states."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    CRITICAL = "critical"
    OFFLINE = "offline"

class SystemComponent(Enum):
    """System component identifiers."""
    DATABASE = "database"
    BROKER = "broker"
    AUTHENTICATION = "authentication"
    MONITORING = "monitoring"
    KILL_SWITCH = "kill_switch"

@dataclass
class SafetyMetrics:
    """Safety system metrics."""
    uptime_seconds: float = 0.0
    failures_count: int = 0
    recovery_time_seconds: float = 0.0
    health_check_success_rate: float = 100.0

class SafetyManager:
    """Central safety system orchestration."""

def __init__(self, config: Dict[str, Any] = None):
        """Initialize safety manager."""
        self.config = config or {}

        # Safety state management
        self._state = SafetyState.HEALTHY
        self._state_lock = threading.RLock()
        self._startup_time = datetime.utcnow()

        self._state_lock = threading.RLock()
        self._startup_time = datetime.utcnow()

        # Metrics and monitoring
        self.metrics = SafetyMetrics()
        self._component_health: Dict[SystemComponent, bool] = {}
        self._component_last_check: Dict[SystemComponent, datetime] = {}

        # Health check callbacks
        self._health_checks: Dict[SystemComponent, Callable[[], bool]] = {}

        # Subsystem references (initialized later)
        self.failover_manager = None
        self.recovery_system = None
        self.availability_monitor = None
        self.redundancy_validator = None

        logger.info("Safety manager initialized")

def get_health_status(self) -> Dict[str, Any]:
        """Get current health status."""
        return {
            "state": self._state.value,
            "uptime": (datetime.utcnow() - self._startup_time).total_seconds(),
            "components": {comp.value: health for comp, health in self._component_health.items()}
        }

def is_healthy(self) -> bool:
        """Check if system is healthy."""
        return self._state == SafetyState.HEALTHY

        # Control threads
        self._monitoring_thread: Optional[threading.Thread] = None
        self._shutdown_event = threading.Event()
        self._is_running = False

        # Performance tracking
        self._downtime_start: Optional[datetime] = None
        self._total_downtime = timedelta()

        self.logger.info("SafetyManager initialized with config: %s", self.config)

def initialize_subsystems(self, failover_manager, recovery_system,
                            availability_monitor, redundancy_validator):
        """Initialize references to safety subsystems."""
        self.failover_manager = failover_manager
        self.recovery_system = recovery_system
        self.availability_monitor = availability_monitor
        self.redundancy_validator = redundancy_validator

        # Initialize component health status
        for component in SystemComponent:
            self._component_health[component] = False
            self._component_last_check[component] = datetime.utcnow()

def start(self):
        """Start the safety system monitoring and management."""
        if self._is_running:
            self.logger.warning("SafetyManager already running")
            return

        self._is_running = True
        self._shutdown_event.clear()

        # Start monitoring thread
        self._monitoring_thread = threading.Thread(
            target=self._monitoring_loop,
            name="SafetyManager-Monitor",
            daemon=True
        )
        self._monitoring_thread.start()

        self.logger.info("SafetyManager started successfully")

def stop(self):
        """Stop the safety system."""
        if not self._is_running:
            return

        self._shutdown_event.set()
        self._is_running = False

        if self._monitoring_thread and self._monitoring_thread.is_alive():
            self._monitoring_thread.join(timeout=5.0)

        self.logger.info("SafetyManager stopped")

def register_health_check(self, component: SystemComponent,
                            health_check_func: Callable[[], bool]):
        """Register a health check function for a component."""
        self._health_checks[component] = health_check_func
        self.logger.info("Health check registered for %s", component.value)

def get_system_state(self) -> SafetyState:
        """Get current system safety state."""
        with self._state_lock:
            return self._state

def get_metrics(self) -> SafetyMetrics:
        """Get current safety metrics."""
        # Update calculated metrics
        self._update_metrics()
        return self.metrics

def trigger_failover(self, component: SystemComponent, reason: str) -> bool:
        """
        Trigger failover for a specific component.

        Args:
            component: Component requiring failover
            reason: Reason for failover

        Returns:
            bool: True if failover successful
        """
        self.logger.warning("Triggering failover for %s: %s", component.value, reason)

        if not self.failover_manager:
            self.logger.error("FailoverManager not initialized")
            return False

        start_time = time.time()

        # Update state to recovering
        with self._state_lock:
            self._state = SafetyState.RECOVERING
            if self._downtime_start is None:
                self._downtime_start = datetime.utcnow()

        try:
            # Execute failover
            success = self.failover_manager.execute_failover(component, reason)

            recovery_time = time.time() - start_time
            self.metrics.recovery_times.append(recovery_time)

            if success:
                self.logger.info("Failover successful for %s in %.2fs",
                                component.value, recovery_time)

                # Validate recovery meets <60s requirement
                if recovery_time > self.config.get('max_recovery_time_seconds', 60):
                    self.logger.error(
                        "Recovery time %.2fs exceeds %ds limit",
                        recovery_time,
                        self.config.get('max_recovery_time_seconds', 60)
                    )
                    return False

                self._end_downtime()
                self.metrics.failover_count += 1

                with self._state_lock:
                    self._state = SafetyState.HEALTHY

                return True
            else:
                self.logger.error("Failover failed for %s", component.value)
                with self._state_lock:
                    self._state = SafetyState.FAILED
                return False

        except Exception as e:
            self.logger.error("Failover error for %s: %s", component.value, e)
            with self._state_lock:
                self._state = SafetyState.FAILED
            return False

def validate_availability_sla(self) -> Dict[str, Any]:
        """
        Validate that 99.9% availability SLA is being met.

        Returns:
            dict: SLA validation results
        """
        uptime_percentage = self._calculate_uptime_percentage()
        target = self.config.get('availability_target', 0.999)

        sla_met = uptime_percentage >= target

        result = {
            'sla_met': sla_met,
            'current_availability': uptime_percentage,
            'target_availability': target,
            'total_uptime': self._calculate_total_uptime(),
            'total_downtime': self._total_downtime.total_seconds(),
            'downtime_budget_remaining': self._calculate_downtime_budget_remaining()
        }

        self.metrics.uptime_percentage = uptime_percentage
        self.metrics.availability_sla_met = sla_met

        if not sla_met:
            self.logger.warning(
                "Availability SLA breach: %.4f%% < %.4f%%",
                uptime_percentage * 100,
                target * 100
            )

        return result

def _monitoring_loop(self):
        """Main monitoring loop running in separate thread."""
        interval = self.config.get('health_check_interval_seconds', 5)

        while not self._shutdown_event.wait(interval):
            try:
                self._perform_health_checks()
                self._assess_system_state()

                # Log system status periodically
                if int(time.time()) % 60 == 0:  # Every minute
                    self._log_system_status()

            except Exception as e:
                self.logger.error("Error in monitoring loop: %s", e)

def _perform_health_checks(self):
        """Perform health checks on all registered components."""
        for component, health_check in self._health_checks.items():
            try:
                is_healthy = health_check()
                previous_health = self._component_health.get(component, True)

                self._component_health[component] = is_healthy
                self._component_last_check[component] = datetime.utcnow()

                if is_healthy:
                    self.metrics.health_checks_passed += 1
                    if not previous_health:
                        self.logger.info("Component %s recovered", component.value)
                else:
                    self.metrics.health_checks_failed += 1
                    if previous_health:
                        self.logger.warning("Component %s health check failed", component.value)
                        # Trigger failover if configured
                        if self.config.get('auto_failover_enabled', True):
                            self.trigger_failover(component, "Health check failure")

            except Exception as e:
                self.logger.error("Health check error for %s: %s", component.value, e)
                self._component_health[component] = False
                self.metrics.health_checks_failed += 1

def _assess_system_state(self):
        """Assess overall system state based on component health."""
        healthy_components = sum(1 for health in self._component_health.values() if health)
        total_components = len(self._component_health)

        if total_components == 0:
            return  # No components registered yet

        health_ratio = healthy_components / total_components

        with self._state_lock:
            if health_ratio >= self.config.get('failover_trigger_threshold', 0.95):
                if self._state in [SafetyState.DEGRADED, SafetyState.CRITICAL, SafetyState.RECOVERING]:
                    self._state = SafetyState.HEALTHY
                    self._end_downtime()
            elif health_ratio >= 0.5:
                if self._state == SafetyState.HEALTHY:
                    self._state = SafetyState.DEGRADED
                    self._start_downtime()
            else:
                if self._state != SafetyState.FAILED:
                    self._state = SafetyState.CRITICAL
                    self._start_downtime()

def _start_downtime(self):
        """Mark the start of system downtime."""
        if self._downtime_start is None:
            self._downtime_start = datetime.utcnow()
            self.logger.warning("System downtime started at %s", self._downtime_start)

def _end_downtime(self):
        """Mark the end of system downtime."""
        if self._downtime_start:
            downtime_duration = datetime.utcnow() - self._downtime_start
            self._total_downtime += downtime_duration
            self.logger.info("System downtime ended. Duration: %s", downtime_duration)
            self._downtime_start = None

def _calculate_uptime_percentage(self) -> float:
        """Calculate current uptime percentage."""
        total_runtime = datetime.utcnow() - self._startup_time
        if total_runtime.total_seconds() == 0:
            return 1.0

        current_downtime = self._total_downtime
        if self._downtime_start:  # Currently in downtime
            current_downtime += datetime.utcnow() - self._downtime_start

        uptime = total_runtime - current_downtime
        return max(0.0, min(1.0, uptime.total_seconds() / total_runtime.total_seconds()))

def _calculate_total_uptime(self) -> timedelta:
        """Calculate total uptime duration."""
        total_runtime = datetime.utcnow() - self._startup_time
        current_downtime = self._total_downtime

        if self._downtime_start:
            current_downtime += datetime.utcnow() - self._downtime_start

        return total_runtime - current_downtime

def _calculate_downtime_budget_remaining(self) -> float:
        """Calculate remaining downtime budget for 99.9% SLA."""
        total_runtime = datetime.utcnow() - self._startup_time
        target_availability = self.config.get('availability_target', 0.999)

        allowed_downtime = total_runtime * (1 - target_availability)
        current_downtime = self._total_downtime

        if self._downtime_start:
            current_downtime += datetime.utcnow() - self._downtime_start

        return max(0.0, (allowed_downtime - current_downtime).total_seconds())

def _update_metrics(self):
        """Update calculated metrics."""
        if self.metrics.recovery_times:
            self.metrics.mean_recovery_time = sum(self.metrics.recovery_times) / len(self.metrics.recovery_times)

        # Count incidents in last 24 hours
        if self.metrics.last_incident:
            if datetime.utcnow() - self.metrics.last_incident < timedelta(hours=24):
                self.metrics.incidents_24h += 1

def _log_system_status(self):
        """Log current system status for monitoring."""
        metrics = self.get_metrics()
        sla_status = self.validate_availability_sla()

        self.logger.info(
            "Safety Status: state=%s, availability=%.4f%%, recovery_time_avg=%.2fs, "
            "failovers=%d, sla_met=%s",
            self._state.value,
            metrics.uptime_percentage * 100,
            metrics.mean_recovery_time,
            metrics.failover_count,
            sla_status['sla_met']
        )