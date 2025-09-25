"""
AvailabilityMonitor - 99.9% SLA Monitoring and Validation
=========================================================

Monitors system availability in real-time with 99.9% SLA validation.
Provides comprehensive uptime tracking, SLA breach detection, and reporting.
"""

from collections import deque, defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
import time

from dataclasses import dataclass
from enum import Enum
from lib.shared.utilities import get_logger
import statistics
import threading

logger = get_logger(__name__)

class AvailabilityState(Enum):
    """Component availability states."""
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    UNKNOWN = "unknown"

@dataclass
class AvailabilityIncident:
    """Availability incident tracking."""
    component: str
    start_time: datetime
    end_time: Optional[datetime] = None
    state: AvailabilityState = AvailabilityState.UNAVAILABLE
    mttr_seconds: Optional[float] = None
    resolution_actions: List[str] = None

def __post_init__(self):
        if self.resolution_actions is None:
            self.resolution_actions = []

@dataclass
class SLAMetrics:
    """SLA calculation results."""
    availability_percentage: float = 0.0
    uptime_seconds: float = 0.0
    downtime_seconds: float = 0.0
    total_incidents: int = 0
    mttr_average: float = 0.0
    mtbf_average: float = 0.0
    sla_target: float = 0.999
    sla_met: bool = False
    downtime_budget_used: float = 0.0
    downtime_budget_remaining: float = 0.0

class AvailabilityMonitor:
    """99.9% SLA Monitoring and Validation System."""

def __init__(self, config: Optional[Dict] = None):
        """Initialize the availability monitor.

        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        self.logger = get_logger(__name__)

        # SLA configuration
        self.sla_target = self.config.get('sla_target', 0.999)  # 99.9% default
        self.measurement_window_hours = self.config.get('measurement_window_hours', 24)
        self.check_interval_seconds = self.config.get('check_interval_seconds', 5)

        # Component tracking
        self._component_states: Dict[str, AvailabilityState] = {}
        self._component_last_check: Dict[str, datetime] = {}
        self._health_checkers: Dict[str, callable] = {}

        # Incident tracking
        self._active_incidents: Dict[str, AvailabilityIncident] = {}
        self._incident_history: List[AvailabilityIncident] = []

        # Metrics storage
        self._availability_samples: Dict[str, deque] = defaultdict(
            lambda: deque(maxlen=self.config.get('max_samples', 17280))  # 24h at 5s intervals
        )
        self._metrics_cache: Dict[str, SLAMetrics] = {}

        # Threading
        self._monitoring_thread: Optional[threading.Thread] = None
        self._shutdown_event = threading.Event()
        self._is_running = False
        self._metrics_lock = threading.RLock()

        # System start time
        self._system_start_time = datetime.utcnow()

        self.logger.info("AvailabilityMonitor initialized with %.3f%% SLA target",
                        self.sla_target * 100)

def register_component(self, component_name: str, health_checker: callable):
        """
        Register a component for availability monitoring.

        Args:
            component_name: Name of the component
            health_checker: Function that returns True if component is healthy
        """
        self._health_checkers[component_name] = health_checker
        self._component_states[component_name] = AvailabilityState.UNKNOWN
        self._component_last_check[component_name] = datetime.utcnow()

        self.logger.info("Registered component for monitoring: %s", component_name)

def start_monitoring(self):
        """Start availability monitoring."""
        if self._is_running:
            self.logger.warning("AvailabilityMonitor already running")
            return

        self._is_running = True
        self._shutdown_event.clear()

        # Start monitoring thread
        self._monitoring_thread = threading.Thread(
            target=self._monitoring_loop,
            name="AvailabilityMonitor",
            daemon=True
        )
        self._monitoring_thread.start()

        self.logger.info("AvailabilityMonitor started")

def stop_monitoring(self):
        """Stop availability monitoring."""
        if not self._is_running:
            return

        self._shutdown_event.set()
        self._is_running = False

        if self._monitoring_thread and self._monitoring_thread.is_alive():
            self._monitoring_thread.join(timeout=10)

        # Close any active incidents
        for component, incident in self._active_incidents.items():
            self._close_incident(component, incident, "Monitor shutdown")

        self.logger.info("AvailabilityMonitor stopped")

def get_sla_metrics(self, component_name: Optional[str] = None) -> Union[SLAMetrics, Dict[str, SLAMetrics]]:
        """
        Get SLA metrics for a component or all components.

        Args:
            component_name: Specific component name, or None for all

        Returns:
            SLA metrics for the component(s)
        """
        with self._metrics_lock:
            if component_name:
                return self._calculate_sla_metrics(component_name)
            else:
                return {name: self._calculate_sla_metrics(name)
                        for name in self._health_checkers.keys()}

def get_availability_status(self) -> Dict[str, Any]:
        """
        Get current availability status for all components.

        Returns:
            dict: Current status including states, incidents, and SLA compliance
        """
        status = {
            'timestamp': datetime.utcnow(),
            'components': {},
            'overall_sla_met': True,
            'active_incidents': len(self._active_incidents),
            'total_incidents_24h': 0
        }

        cutoff_time = datetime.utcnow() - timedelta(hours=24)

        for component_name in self._health_checkers.keys():
            metrics = self.get_sla_metrics(component_name)
            component_status = {
                'state': self._component_states.get(component_name, AvailabilityState.UNKNOWN).value,
                'last_check': self._component_last_check.get(component_name),
                'availability_percentage': metrics.availability_percentage,
                'sla_met': metrics.sla_met,
                'active_incident': component_name in self._active_incidents,
                'downtime_budget_remaining': metrics.downtime_budget_remaining
            }

            status['components'][component_name] = component_status

            if not metrics.sla_met:
                status['overall_sla_met'] = False

        # Count recent incidents
        status['total_incidents_24h'] = len([
            incident for incident in self._incident_history
            if incident.start_time >= cutoff_time
        ])

        return status

def validate_sla_compliance(self) -> Dict[str, Any]:
        """
        Validate SLA compliance across all components.

        Returns:
            dict: Comprehensive SLA compliance report
        """
        compliance_report = {
            'timestamp': datetime.utcnow(),
            'overall_compliance': True,
            'components': {},
            'violations': [],
            'summary': {
                'total_components': len(self._health_checkers),
                'compliant_components': 0,
                'violated_components': 0,
                'average_availability': 0.0,
                'total_downtime_budget_used': 0.0
            }
        }

        total_availability = 0.0
        total_downtime_budget_used = 0.0

        for component_name in self._health_checkers.keys():
            metrics = self.get_sla_metrics(component_name)

            component_compliance = {
                'sla_met': metrics.sla_met,
                'availability_percentage': metrics.availability_percentage,
                'target_percentage': self.sla_target,
                'downtime_seconds': metrics.downtime_seconds,
                'downtime_budget_used': metrics.downtime_budget_used,
                'incidents_count': metrics.total_incidents,
                'mttr_seconds': metrics.mttr_average
            }

            compliance_report['components'][component_name] = component_compliance
            total_availability += metrics.availability_percentage
            total_downtime_budget_used += metrics.downtime_budget_used

            if metrics.sla_met:
                compliance_report['summary']['compliant_components'] += 1
            else:
                compliance_report['summary']['violated_components'] += 1
                compliance_report['overall_compliance'] = False
                compliance_report['violations'].append({
                    'component': component_name,
                    'availability': metrics.availability_percentage,
                    'target': self.sla_target,
                    'deficit': self.sla_target - metrics.availability_percentage
                })

        # Calculate summary statistics
        if compliance_report['summary']['total_components'] > 0:
            compliance_report['summary']['average_availability'] = (
                total_availability / compliance_report['summary']['total_components']
            )
            compliance_report['summary']['total_downtime_budget_used'] = (
                total_downtime_budget_used / compliance_report['summary']['total_components']
            )

        return compliance_report

def _monitoring_loop(self):
        """Main monitoring loop."""
        while not self._shutdown_event.wait(self.check_interval_seconds):
            try:
                self._perform_health_checks()
                self._update_availability_samples()
                self._check_sla_violations()

                # Log status periodically
                if int(time.time()) % 300 == 0:  # Every 5 minutes
                    self._log_monitoring_status()

            except Exception as e:
                self.logger.error("Error in monitoring loop: %s", e)

def _perform_health_checks(self):
        """Perform health checks on all registered components."""
        check_time = datetime.utcnow()

        for component_name, health_checker in self._health_checkers.items():
            try:
                is_healthy = health_checker()
                previous_state = self._component_states.get(component_name, AvailabilityState.UNKNOWN)

                # Determine new state
                if is_healthy:
                    new_state = AvailabilityState.AVAILABLE
                else:
                    new_state = AvailabilityState.UNAVAILABLE

                # Update state and check time
                self._component_states[component_name] = new_state
                self._component_last_check[component_name] = check_time

                # Handle state transitions
                self._handle_state_transition(component_name, previous_state, new_state, check_time)

            except Exception as e:
                self.logger.error("Health check error for %s: %s", component_name, e)
                self._component_states[component_name] = AvailabilityState.UNKNOWN
                self._component_last_check[component_name] = check_time

def _handle_state_transition(self, component_name: str,
                                previous_state: AvailabilityState,
                                new_state: AvailabilityState,
                                timestamp: datetime):
        """Handle state transitions and incident management."""
        if previous_state == new_state:
            return

        # Transition to unavailable - start incident
        if new_state == AvailabilityState.UNAVAILABLE and component_name not in self._active_incidents:
            incident = AvailabilityIncident(
                component=component_name,
                start_time=timestamp,
                state=new_state
            )
            self._active_incidents[component_name] = incident
            self.logger.warning("Availability incident started for %s", component_name)

        # Transition to available - end incident
        elif new_state == AvailabilityState.AVAILABLE and component_name in self._active_incidents:
            incident = self._active_incidents[component_name]
            self._close_incident(component_name, incident, "Component recovered")
            self.logger.info("Availability incident resolved for %s", component_name)

def _close_incident(self, component_name: str, incident: AvailabilityIncident, resolution: str):
        """Close an active incident."""
        incident.end_time = datetime.utcnow()
        incident.mttr_seconds = (incident.end_time - incident.start_time).total_seconds()
        incident.resolution_actions.append(resolution)

        # Move to history
        self._incident_history.append(incident)
        self._active_incidents.pop(component_name, None)

        self.logger.info(
            "Incident closed for %s - Duration: %.2fs",
            component_name, incident.mttr_seconds
        )

def _update_availability_samples(self):
        """Update availability samples for metrics calculation."""
        timestamp = datetime.utcnow()

        for component_name in self._health_checkers.keys():
            state = self._component_states.get(component_name, AvailabilityState.UNKNOWN)
            is_available = state == AvailabilityState.AVAILABLE

            sample = {
                'timestamp': timestamp,
                'available': is_available,
                'state': state.value
            }

            self._availability_samples[component_name].append(sample)

def _calculate_sla_metrics(self, component_name: str) -> SLAMetrics:
        """Calculate SLA metrics for a component."""
        samples = list(self._availability_samples[component_name])

        if not samples:
            return SLAMetrics(sla_target=self.sla_target)

        # Calculate time window
        latest_time = samples[-1]['timestamp']
        window_start = latest_time - timedelta(hours=self.measurement_window_hours)

        # Filter samples to measurement window
        window_samples = [s for s in samples if s['timestamp'] >= window_start]

        if not window_samples:
            return SLAMetrics(sla_target=self.sla_target)

        # Calculate uptime/downtime
        total_samples = len(window_samples)
        available_samples = sum(1 for s in window_samples if s['available'])
        unavailable_samples = total_samples - available_samples

        # Calculate availability percentage
        availability_percentage = available_samples / total_samples if total_samples > 0 else 0.0

        # Calculate time-based metrics
        sample_duration = self.check_interval_seconds
        uptime_seconds = available_samples * sample_duration
        downtime_seconds = unavailable_samples * sample_duration
        total_time_seconds = total_samples * sample_duration

        # Calculate MTTR and MTBF
        component_incidents = [i for i in self._incident_history
                            if i.component == component_name and
                            i.start_time >= window_start and i.mttr_seconds is not None]

        mttr_average = 0.0
        if component_incidents:
            mttr_values = [i.mttr_seconds for i in component_incidents]
            mttr_average = statistics.mean(mttr_values)

        mtbf_average = 0.0
        if len(component_incidents) > 1:
            # Time between incident starts
            incident_times = [i.start_time for i in component_incidents]
            incident_times.sort()
            intervals = [(incident_times[i+1] - incident_times[i]).total_seconds()
                        for i in range(len(incident_times) - 1)]
            mtbf_average = statistics.mean(intervals) if intervals else 0.0

        # Calculate downtime budget
        allowed_downtime = total_time_seconds * (1 - self.sla_target)
        downtime_budget_used = downtime_seconds / allowed_downtime if allowed_downtime > 0 else 0.0
        downtime_budget_remaining = max(0, allowed_downtime - downtime_seconds)

        return SLAMetrics(
            availability_percentage=availability_percentage,
            uptime_seconds=uptime_seconds,
            downtime_seconds=downtime_seconds,
            total_incidents=len(component_incidents),
            mttr_average=mttr_average,
            mtbf_average=mtbf_average,
            sla_target=self.sla_target,
            sla_met=availability_percentage >= self.sla_target,
            downtime_budget_used=downtime_budget_used,
            downtime_budget_remaining=downtime_budget_remaining
        )

def _check_sla_violations(self):
        """Check for SLA violations and log warnings."""
        for component_name in self._health_checkers.keys():
            metrics = self._calculate_sla_metrics(component_name)

            if not metrics.sla_met:
                self.logger.warning(
                    "SLA violation for %s: %.4f%% < %.4f%% (downtime budget: %.1f%% used)",
                    component_name,
                    metrics.availability_percentage * 100,
                    self.sla_target * 100,
                    metrics.downtime_budget_used * 100
                )

def _log_monitoring_status(self):
        """Log current monitoring status."""
        status = self.get_availability_status()

        self.logger.info(
            "Availability Status - Components: %d, Active incidents: %d, Overall SLA met: %s",
            len(status['components']),
            status['active_incidents'],
            status['overall_sla_met']
        )

        for component_name, component_status in status['components'].items():
            if not component_status['sla_met']:
                self.logger.warning(
                    "Component %s: %.4f%% availability (SLA violation)",
                    component_name,
                    component_status['availability_percentage'] * 100
                )