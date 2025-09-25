from src.constants.base import MAXIMUM_NESTED_DEPTH, MAXIMUM_RETRY_ATTEMPTS
"""

Command + Observer pattern implementation for performance monitoring,
providing real-time performance tracking with automatic response capabilities.

Refactored from real_time_monitor.py and pipeline_monitor.py
Target: 40-60% LOC reduction while maintaining functionality.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Callable, Set
from datetime import datetime
import time
import threading
import logging
from collections import deque, defaultdict
"""

from ...patterns.command_base import Command, CommandResult
from ...patterns.factory_base import Factory, get_factory_registry
"""

logger = logging.getLogger(__name__)

class MetricType(Enum):
    """Types of performance metrics."""
    MEMORY_USAGE = "memory_usage"
    CPU_USAGE = "cpu_usage"
    EXECUTION_TIME = "execution_time"
    THROUGHPUT = "throughput"
    ERROR_RATE = "error_rate"
    LATENCY = "latency"
    THREAD_COUNT = "thread_count"
    QUEUE_DEPTH = "queue_depth"

class AlertLevel(Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"

@dataclass
class PerformanceMetric:
    """Performance metric data structure."""
    metric_type: MetricType
    value: float
    timestamp: datetime
    source: str = "unknown"
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        return {
            'type': self.metric_type.value,
            'value': self.value,
            'timestamp': self.timestamp.isoformat(),
            'source': self.source,
            'metadata': self.metadata
        }

@dataclass
class PerformanceAlert:
    """Performance alert data structure."""
    alert_id: str
    level: AlertLevel
    metric_type: MetricType
    message: str
    value: float
    threshold: float
    timestamp: datetime
    source: str = "monitor"
    suggested_actions: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert alert to dictionary."""
        return {
            'alert_id': self.alert_id,
            'level': self.level.value,
            'metric_type': self.metric_type.value,
            'message': self.message,
            'value': self.value,
            'threshold': self.threshold,
            'timestamp': self.timestamp.isoformat(),
            'source': self.source,
            'suggested_actions': self.suggested_actions
        }

class PerformanceObserver(ABC):
    """Abstract base class for performance observers."""

    def __init__(self, observer_id: str):
        self.observer_id = observer_id
        self.is_active = False

    @abstractmethod
    def update(self, metric: PerformanceMetric) -> None:
        """Receive metric update from subject."""

    @abstractmethod
    def get_observer_info(self) -> Dict[str, Any]:
        """Get information about this observer."""

    def activate(self) -> None:
        """Activate observer."""
        self.is_active = True

    def deactivate(self) -> None:
        """Deactivate observer."""
        self.is_active = False

class ThresholdObserver(PerformanceObserver):
    """Observer that monitors metrics against thresholds and generates alerts."""

    def __init__(self, observer_id: str, metric_type: MetricType,
                warning_threshold: float, critical_threshold: float,
                alert_callback: Optional[Callable[[PerformanceAlert], None]] = None):
        super().__init__(observer_id)
        self.metric_type = metric_type
        self.warning_threshold = warning_threshold
        self.critical_threshold = critical_threshold
        self.alert_callback = alert_callback
        self.last_alert_time: Dict[AlertLevel, float] = {}
        self.alert_suppression_duration = 60.0  # seconds

    def update(self, metric: PerformanceMetric) -> None:
        """Check metric against thresholds and generate alerts if needed."""
        if not self.is_active or metric.metric_type != self.metric_type:
            return

        alert_level = self._determine_alert_level(metric.value)
        if alert_level and self._should_send_alert(alert_level):
            alert = self._create_alert(metric, alert_level)
            self._send_alert(alert)

    def _determine_alert_level(self, value: float) -> Optional[AlertLevel]:
        """Determine alert level based on value and thresholds."""
        if value >= self.critical_threshold:
            return AlertLevel.CRITICAL
        elif value >= self.warning_threshold:
            return AlertLevel.WARNING
        return None

    def _should_send_alert(self, alert_level: AlertLevel) -> bool:
        """Check if alert should be sent (not suppressed)."""
        current_time = time.time()
        last_time = self.last_alert_time.get(alert_level, 0)
        return current_time - last_time > self.alert_suppression_duration

    def _create_alert(self, metric: PerformanceMetric, alert_level: AlertLevel) -> PerformanceAlert:
        """Create performance alert."""
        threshold = self.critical_threshold if alert_level == AlertLevel.CRITICAL else self.warning_threshold

        alert_id = f"{self.observer_id}_{alert_level.value}_{int(time.time())}"
        message = f"{alert_level.value.upper()}: {metric.metric_type.value} = {metric.value:.2f} (threshold: {threshold:.2f})"

        suggested_actions = self._get_suggested_actions(metric.metric_type, alert_level)

        return PerformanceAlert(
            alert_id=alert_id,
            level=alert_level,
            metric_type=metric.metric_type,
            message=message,
            value=metric.value,
            threshold=threshold,
            timestamp=metric.timestamp,
            source=metric.source,
            suggested_actions=suggested_actions
        )

    def _get_suggested_actions(self, metric_type: MetricType, alert_level: AlertLevel) -> List[str]:
        """Get suggested actions based on metric type and alert level."""
        actions = []

        if metric_type == MetricType.MEMORY_USAGE:
            if alert_level == AlertLevel.CRITICAL:
                actions.extend([
                    "Immediately trigger garbage collection",
                    "Clear non-essential caches",
                    "Reduce active thread pool size"
                ])
            else:
                actions.append("Monitor memory usage trend")

        elif metric_type == MetricType.CPU_USAGE:
            if alert_level == AlertLevel.CRITICAL:
                actions.extend([
                    "Throttle analysis requests",
                    "Reduce thread pool size",
                    "Enable CPU usage optimization"
                ])
            else:
                actions.append("Monitor CPU usage trend")

        elif metric_type == MetricType.EXECUTION_TIME:
            actions.extend([
                "Analyze performance bottlenecks",
                "Consider caching strategies",
                "Review algorithm efficiency"
            ])

        return actions

    def _send_alert(self, alert: PerformanceAlert) -> None:
        """Send alert via callback and update suppression tracking."""
        self.last_alert_time[alert.level] = time.time()

        if self.alert_callback:
            try:
                self.alert_callback(alert)
            except Exception as e:
                logger.error(f"Alert callback failed: {e}")

        logger.log(
            logging.CRITICAL if alert.level == AlertLevel.CRITICAL else logging.WARNING,
            f"Performance Alert: {alert.message}",
            extra=alert.to_dict()
        )

    def get_observer_info(self) -> Dict[str, Any]:
        """Get observer information."""
        return {
            'observer_id': self.observer_id,
            'type': 'threshold_observer',
            'metric_type': self.metric_type.value,
            'warning_threshold': self.warning_threshold,
            'critical_threshold': self.critical_threshold,
            'is_active': self.is_active,
            'last_alert_times': {level.value: timestamp for level, timestamp in self.last_alert_time.items()}
        }

class TrendObserver(PerformanceObserver):
    """Observer that monitors metric trends and detects anomalies."""

    def __init__(self, observer_id: str, metric_type: MetricType,
                history_size: int = 50, trend_threshold: float = 0.2):
        super().__init__(observer_id)
        self.metric_type = metric_type
        self.history_size = history_size
        self.trend_threshold = trend_threshold
        self.metric_history: deque = deque(maxlen=history_size)
        self.baseline_established = False
        self.baseline_average = 0.0
        self.baseline_std_dev = 0.0

    def update(self, metric: PerformanceMetric) -> None:
        """Update trend analysis with new metric."""
        if not self.is_active or metric.metric_type != self.metric_type:
            return

        self.metric_history.append(metric)

        # Establish baseline if we have enough data
        if len(self.metric_history) >= 20 and not self.baseline_established:
            self._establish_baseline()

        # Analyze trend if baseline is established
        if self.baseline_established:
            self._analyze_trend()

    def _establish_baseline(self) -> None:
        """Establish baseline metrics from historical data."""
        values = [metric.value for metric in list(self.metric_history)[-20:]]
        self.baseline_average = sum(values) / len(values)

        variance = sum((x - self.baseline_average) ** 2 for x in values) / len(values)
        self.baseline_std_dev = variance ** 0.5

        self.baseline_established = True
        logger.info(f"Baseline established for {self.metric_type.value}: "
                    f"avg={self.baseline_average:.2f}, std={self.baseline_std_dev:.2f}")

    def _analyze_trend(self) -> None:
        """Analyze recent trend for anomalies."""
        if len(self.metric_history) < 10:
            return

        recent_values = [metric.value for metric in list(self.metric_history)[-10:]]
        recent_average = sum(recent_values) / len(recent_values)

        # Check for significant deviation from baseline
        deviation = abs(recent_average - self.baseline_average)
        if self.baseline_std_dev > 0:
            z_score = deviation / self.baseline_std_dev
            if z_score > 3.0:  # MAXIMUM_RETRY_ATTEMPTS sigma rule
                self._log_trend_anomaly(recent_average, deviation, z_score)

    def _log_trend_anomaly(self, recent_average: float, deviation: float, z_score: float) -> None:
        """Log trend anomaly detection."""
        logger.warning(
            f"Trend anomaly detected for {self.metric_type.value}: "
            f"recent_avg={recent_average:.2f}, "
            f"baseline={self.baseline_average:.2f}, "
            f"deviation={deviation:.2f}, "
            f"z_score={z_score:.2f}"
        )

    def get_observer_info(self) -> Dict[str, Any]:
        """Get observer information."""
        return {
            'observer_id': self.observer_id,
            'type': 'trend_observer',
            'metric_type': self.metric_type.value,
            'history_size': len(self.metric_history),
            'baseline_established': self.baseline_established,
            'baseline_average': self.baseline_average,
            'baseline_std_dev': self.baseline_std_dev,
            'is_active': self.is_active
        }

class AggregatingObserver(PerformanceObserver):
    """Observer that aggregates metrics over time windows."""

    def __init__(self, observer_id: str, metric_type: MetricType,
                window_size_seconds: int = 60):
        super().__init__(observer_id)
        self.metric_type = metric_type
        self.window_size_seconds = window_size_seconds
        self.current_window: List[PerformanceMetric] = []
        self.window_start_time: Optional[datetime] = None
        self.aggregated_results: List[Dict[str, Any]] = []
        self.max_results = 100

    def update(self, metric: PerformanceMetric) -> None:
        """Add metric to current window and process if window is complete."""
        if not self.is_active or metric.metric_type != self.metric_type:
            return

        # Initialize window if needed
        if self.window_start_time is None:
            self.window_start_time = metric.timestamp
            self.current_window = []

        # Check if window is complete
        window_duration = (metric.timestamp - self.window_start_time).total_seconds()
        if window_duration >= self.window_size_seconds:
            # Process completed window
            if self.current_window:
                aggregated = self._aggregate_window()
                self.aggregated_results.append(aggregated)

                # Maintain results limit
                if len(self.aggregated_results) > self.max_results:
                    self.aggregated_results.pop(0)

            # Start new window
            self.window_start_time = metric.timestamp
            self.current_window = [metric]
        else:
            self.current_window.append(metric)

    def _aggregate_window(self) -> Dict[str, Any]:
        """Aggregate metrics in current window."""
        values = [metric.value for metric in self.current_window]

        return {
            'window_start': self.window_start_time.isoformat(),
            'window_end': self.current_window[-1].timestamp.isoformat(),
            'metric_type': self.metric_type.value,
            'count': len(values),
            'min': min(values),
            'max': max(values),
            'avg': sum(values) / len(values),
            'sum': sum(values)
        }

    def get_recent_aggregations(self, count: int = 10) -> List[Dict[str, Any]]:
        """Get recent aggregated results."""
        return self.aggregated_results[-count:]

    def get_observer_info(self) -> Dict[str, Any]:
        """Get observer information."""
        return {
            'observer_id': self.observer_id,
            'type': 'aggregating_observer',
            'metric_type': self.metric_type.value,
            'window_size_seconds': self.window_size_seconds,
            'current_window_size': len(self.current_window),
            'total_windows_processed': len(self.aggregated_results),
            'is_active': self.is_active
        }

class PerformanceSubject:
    """Subject that notifies observers of performance metrics."""

    def __init__(self, subject_id: str):
        self.subject_id = subject_id
        self.observers: Set[PerformanceObserver] = set()
        self.metrics_sent = 0
        self.last_notification_time: Optional[datetime] = None

    def attach(self, observer: PerformanceObserver) -> None:
        """Attach observer to receive notifications."""
        self.observers.add(observer)
        logger.debug(f"Observer {observer.observer_id} attached to subject {self.subject_id}")

    def detach(self, observer: PerformanceObserver) -> None:
        """Detach observer from notifications."""
        self.observers.discard(observer)
        logger.debug(f"Observer {observer.observer_id} detached from subject {self.subject_id}")

    def notify(self, metric: PerformanceMetric) -> None:
        """Notify all observers of new metric."""
        self.metrics_sent += 1
        self.last_notification_time = metric.timestamp

        for observer in self.observers:
            try:
                observer.update(metric)
            except Exception as e:
                logger.error(f"Observer {observer.observer_id} update failed: {e}")

    def get_observer_count(self) -> int:
        """Get number of attached observers."""
        return len(self.observers)

    def get_subject_info(self) -> Dict[str, Any]:
        """Get subject information."""
        return {
            'subject_id': self.subject_id,
            'observer_count': len(self.observers),
            'metrics_sent': self.metrics_sent,
            'last_notification': self.last_notification_time.isoformat() if self.last_notification_time else None,
            'observers': [obs.observer_id for obs in self.observers]
        }

# Performance Commands
class CollectMetricCommand(Command):
    """Command to collect and publish a performance metric."""

    def __init__(self, subject: PerformanceSubject, metric_type: MetricType,
                value: float, source: str = "system", metadata: Optional[Dict[str, Any]] = None):
        super().__init__()
        self.subject = subject
        self.metric_type = metric_type
        self.value = value
        self.source = source
        self.metadata = metadata or {}

    def execute(self) -> CommandResult:
        """Execute metric collection and notification."""
        try:
            metric = PerformanceMetric(
                metric_type=self.metric_type,
                value=self.value,
                timestamp=datetime.now(),
                source=self.source,
                metadata=self.metadata
            )

            self.subject.notify(metric)

            return CommandResult(
                success=True,
                data={'metric_collected': metric.to_dict()},
                metadata={'observers_notified': self.subject.get_observer_count()}
            )

        except Exception as e:
            return CommandResult(
                success=False,
                error=f"Failed to collect metric: {str(e)}"
            )

    def get_description(self) -> str:
        return f"CollectMetricCommand({self.metric_type.value}={self.value}, source={self.source})"

class ConfigureObserverCommand(Command):
    """Command to configure observer settings."""

    def __init__(self, observer: PerformanceObserver, config: Dict[str, Any]):
        super().__init__()
        self.observer = observer
        self.config = config

    def execute(self) -> CommandResult:
        """Execute observer configuration."""
        try:
            applied_configs = []

            # Apply configuration based on observer type
            if isinstance(self.observer, ThresholdObserver):
                applied_configs.extend(self._configure_threshold_observer())
            elif isinstance(self.observer, TrendObserver):
                applied_configs.extend(self._configure_trend_observer())
            elif isinstance(self.observer, AggregatingObserver):
                applied_configs.extend(self._configure_aggregating_observer())

            return CommandResult(
                success=True,
                data={'configurations_applied': applied_configs},
                metadata={'observer_id': self.observer.observer_id}
            )

        except Exception as e:
            return CommandResult(
                success=False,
                error=f"Failed to configure observer: {str(e)}"
            )

    def _configure_threshold_observer(self) -> List[str]:
        """Configure threshold observer."""
        applied = []
        observer = self.observer

        if 'warning_threshold' in self.config:
            observer.warning_threshold = float(self.config['warning_threshold'])
            applied.append('warning_threshold')

        if 'critical_threshold' in self.config:
            observer.critical_threshold = float(self.config['critical_threshold'])
            applied.append('critical_threshold')

        if 'alert_suppression_duration' in self.config:
            observer.alert_suppression_duration = float(self.config['alert_suppression_duration'])
            applied.append('alert_suppression_duration')

        return applied

    def _configure_trend_observer(self) -> List[str]:
        """Configure trend observer."""
        applied = []
        observer = self.observer

        if 'trend_threshold' in self.config:
            observer.trend_threshold = float(self.config['trend_threshold'])
            applied.append('trend_threshold')

        return applied

    def _configure_aggregating_observer(self) -> List[str]:
        """Configure aggregating observer."""
        applied = []
        observer = self.observer

        if 'window_size_seconds' in self.config:
            observer.window_size_seconds = int(self.config['window_size_seconds'])
            applied.append('window_size_seconds')

        return applied

    def get_description(self) -> str:
        return f"ConfigureObserverCommand({self.observer.observer_id}, {list(self.config.keys())})"

# Observer Factory
class PerformanceObserverFactory(Factory):
    """Factory for creating performance observers."""

    def __init__(self):
        super().__init__("performance_observer_factory")
        self._register_observers()

    def _register_observers(self):
        """Register available observer types."""
        self.register_product("threshold", ThresholdObserver)
        self.register_product("trend", TrendObserver)
        self.register_product("aggregating", AggregatingObserver)

    def _get_base_product_type(self):
        return PerformanceObserver

# Performance Monitor using Observer pattern
class ObserverBasedPerformanceMonitor:
    """
    Performance monitor using Observer pattern for real-time monitoring
    with automatic response capabilities.
    """

    def __init__(self, monitor_id: str = "main_monitor"):
        self.monitor_id = monitor_id
        self.subject = PerformanceSubject(monitor_id)
        self.observer_factory = PerformanceObserverFactory()
        self.monitoring_active = False
        self.monitoring_thread: Optional[threading.Thread] = None
        self.monitoring_interval = 2.0  # seconds
        self._stop_event = threading.Event()

    def add_threshold_observer(self, metric_type: MetricType, warning_threshold: float,
                            critical_threshold: float, observer_id: Optional[str] = None,
                            alert_callback: Optional[Callable[[PerformanceAlert], None]] = None) -> str:
        """Add threshold observer for metric monitoring."""
        observer_id = observer_id or f"threshold_{metric_type.value}_{int(time.time())}"

        observer = ThresholdObserver(
            observer_id, metric_type, warning_threshold, critical_threshold, alert_callback
        )
        observer.activate()
        self.subject.attach(observer)

        logger.info(f"Added threshold observer: {observer_id}")
        return observer_id

    def add_trend_observer(self, metric_type: MetricType, observer_id: Optional[str] = None) -> str:
        """Add trend observer for metric monitoring."""
        observer_id = observer_id or f"trend_{metric_type.value}_{int(time.time())}"

        observer = TrendObserver(observer_id, metric_type)
        observer.activate()
        self.subject.attach(observer)

        logger.info(f"Added trend observer: {observer_id}")
        return observer_id

    def add_aggregating_observer(self, metric_type: MetricType, window_size_seconds: int = 60,
                                observer_id: Optional[str] = None) -> str:
        """Add aggregating observer for metric monitoring."""
        observer_id = observer_id or f"agg_{metric_type.value}_{int(time.time())}"

        observer = AggregatingObserver(observer_id, metric_type, window_size_seconds)
        observer.activate()
        self.subject.attach(observer)

        logger.info(f"Added aggregating observer: {observer_id}")
        return observer_id

    def collect_metric(self, metric_type: MetricType, value: float,
                        source: str = "system", metadata: Optional[Dict[str, Any]] = None) -> CommandResult:
        """Collect and publish metric."""
        command = CollectMetricCommand(self.subject, metric_type, value, source, metadata)
        return command.execute()

    def start_monitoring(self) -> None:
        """Start background monitoring."""
        if self.monitoring_active:
            logger.warning("Monitoring is already active")
            return

        self.monitoring_active = True
        self._stop_event.clear()
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitoring_thread.start()

        logger.info("Performance monitoring started")

    def stop_monitoring(self) -> None:
        """Stop background monitoring."""
        if not self.monitoring_active:
            return

        self.monitoring_active = False
        self._stop_event.set()

        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=MAXIMUM_NESTED_DEPTH.0)

        logger.info("Performance monitoring stopped")

    def _monitoring_loop(self) -> None:
        """Background monitoring loop."""
        logger.info("Performance monitoring loop started")

        while self.monitoring_active and not self._stop_event.is_set():
            try:
                # Collect system metrics
                self._collect_system_metrics()
                time.sleep(self.monitoring_interval)
            except Exception as e:
                logger.error(f"Monitoring loop error: {e}")

        logger.info("Performance monitoring loop ended")

    def _collect_system_metrics(self) -> None:
        """Collect basic system metrics."""
        try:
            # Simulate metric collection (in real implementation would use psutil, etc.)
            import random

            # Memory usage
            memory_mb = random.uniform(100, 800)
            self.collect_metric(MetricType.MEMORY_USAGE, memory_mb, "system_monitor")

            # CPU usage
            cpu_percent = random.uniform(10, 90)
            self.collect_metric(MetricType.CPU_USAGE, cpu_percent, "system_monitor")

            # Execution time
            exec_time = random.uniform(0.1, 2.0)
            self.collect_metric(MetricType.EXECUTION_TIME, exec_time, "system_monitor")

        except Exception as e:
            logger.error(f"Failed to collect system metrics: {e}")

    def get_monitor_status(self) -> Dict[str, Any]:
        """Get monitor status and statistics."""
        return {
            'monitor_id': self.monitor_id,
            'monitoring_active': self.monitoring_active,
            'monitoring_interval': self.monitoring_interval,
            'subject_info': self.subject.get_subject_info(),
            'observer_count': self.subject.get_observer_count()
        }

# Global monitor instance
_global_monitor: Optional[ObserverBasedPerformanceMonitor] = None

def get_performance_monitor() -> ObserverBasedPerformanceMonitor:
    """Get global performance monitor instance."""
    global _global_monitor
    if _global_monitor is None:
        _global_monitor = ObserverBasedPerformanceMonitor()
    return _global_monitor

# Initialize factory and register with global registry
def initialize_performance_observers():
    """Initialize performance observer factory."""
    factory = PerformanceObserverFactory()
    registry = get_factory_registry()
    registry.register_factory("performance_observers", factory)
    logger.info("Performance observer factory initialized and registered")

# Auto-initialize when module is imported
initialize_performance_observers()