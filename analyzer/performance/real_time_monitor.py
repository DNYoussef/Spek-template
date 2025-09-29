import json
import psutil
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

from src.constants.base import MAXIMUM_NESTED_DEPTH

Advanced real-time monitoring system for detector pool performance with
automatic bottleneck detection, alert generation, and adaptive optimization
triggers. Integrates with thread contention profiler and memory coordinator.

Features:
- Real-time performance metric collection and analysis
- Automatic bottleneck detection with severity classification
- Alert generation and notification system
- Adaptive optimization trigger system
- Historical trend analysis and predictive alerts
- Integration with existing performance monitoring components
"""

import asyncio
import gc
import os
import threading
import time
import warnings
from collections import defaultdict, deque
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union
import logging
logger = logging.getLogger(__name__)

class AlertSeverity(Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning" 
    CRITICAL = "critical"
    EMERGENCY = "emergency"

class BottleneckType(Enum):
    """Types of performance bottlenecks."""
    THREAD_CONTENTION = "thread_contention"
    MEMORY_PRESSURE = "memory_pressure"
    DETECTOR_STARVATION = "detector_starvation"
    POOL_EXHAUSTION = "pool_exhaustion"
    GC_PRESSURE = "garbage_collection"
    RESOURCE_LEAK = "resource_leak"
    CPU_SATURATION = "cpu_saturation"
    IO_BOTTLENECK = "io_bottleneck"

@dataclass
class PerformanceAlert:
    """Performance alert data structure."""
    alert_id: str
    timestamp: float
    severity: AlertSeverity
    bottleneck_type: BottleneckType
    message: str
    metrics: Dict[str, Any]
    suggested_actions: List[str] = field(default_factory=list)
    auto_resolution_attempted: bool = False
    resolution_successful: bool = False

@dataclass
class RealTimeMetrics:
    """Real-time performance metrics snapshot."""
    timestamp: float
    
    # Thread contention metrics
    active_threads: int = 0
    waiting_threads: int = 0
    average_wait_time_ms: float = 0.0
    lock_contention_rate: float = 0.0
    
    # Memory metrics
    memory_usage_mb: float = 0.0
    memory_growth_rate_mb_s: float = 0.0
    gc_collections_per_minute: int = 0
    
    # Detector pool metrics
    pool_size: int = 0
    active_detectors: int = 0
    queue_depth: int = 0
    acquisition_rate_per_second: float = 0.0
    
    # System metrics
    cpu_usage_percent: float = 0.0
    disk_io_rate_mb_s: float = 0.0
    network_io_rate_mb_s: float = 0.0
    
    # Performance indicators
    throughput_ops_per_second: float = 0.0
    latency_p95_ms: float = 0.0
    error_rate_percent: float = 0.0

class BottleneckDetector:
    """
    Advanced bottleneck detection system with machine learning-inspired
    pattern recognition for performance anomaly detection.
    """
    
    def __init__(self,
                sensitivity: float = 1.0,
                history_window: int = 100):
        """
        Initialize bottleneck detector.
        
        Args:
            sensitivity: Detection sensitivity (0.5-2.0)
            history_window: Historical data window size
        """
        assert 0.5 <= sensitivity <= 2.0, "sensitivity must be 0.5-2.0"
        assert 50 <= history_window <= 1000, "history_window must be 50-1000"
        
        self.sensitivity = sensitivity
        self.history_window = history_window
        
        # Detection thresholds (adaptive based on historical data)
        self.thresholds = {
            BottleneckType.THREAD_CONTENTION: {
                "warning": 10.0 / sensitivity,    # 10ms wait time
                "critical": 25.0 / sensitivity,   # 25ms wait time
                "emergency": 50.0 / sensitivity   # 50ms wait time
            },
            BottleneckType.MEMORY_PRESSURE: {
                "warning": 500.0 * sensitivity,   # 500MB usage
                "critical": 800.0 * sensitivity,  # 800MB usage
                "emergency": 1200.0 * sensitivity # 1.2GB usage
            },
            BottleneckType.DETECTOR_STARVATION: {
                "warning": 0.7 / sensitivity,     # 70% pool utilization
                "critical": 0.9 / sensitivity,    # 90% pool utilization
                "emergency": 0.98 / sensitivity   # 98% pool utilization
            },
            BottleneckType.GC_PRESSURE: {
                "warning": 30 * sensitivity,      # 30 GC/min
                "critical": 60 * sensitivity,     # 60 GC/min
                "emergency": 120 * sensitivity    # 120 GC/min
            }
        }
        
        # Historical data for baseline establishment
        self.metrics_history: deque = deque(maxlen=history_window)
        self.baseline_established = False
        self.baseline_metrics: Optional[Dict[str, float]] = None
        
        # Pattern recognition
        self.anomaly_patterns: Dict[BottleneckType, List[float]] = defaultdict(list)
        self.trend_analysis: Dict[str, float] = {}
        
        logger.info(f"BottleneckDetector initialized with {sensitivity} sensitivity")
    
    def analyze_metrics(self, metrics: RealTimeMetrics) -> List[PerformanceAlert]:
        """
        Analyze metrics for performance bottlenecks.
        
        Args:
            metrics: Current performance metrics
            
        Returns:
            List of detected performance alerts
        """
        alerts = []
        
        # Store metrics for historical analysis
        self.metrics_history.append(metrics)
        
        # Establish baseline if needed
        if not self.baseline_established and len(self.metrics_history) >= 20:
            self._establish_baseline()
        
        # Detect various bottleneck types
        alerts.extend(self._detect_thread_contention(metrics))
        alerts.extend(self._detect_memory_pressure(metrics))
        alerts.extend(self._detect_detector_starvation(metrics))
        alerts.extend(self._detect_gc_pressure(metrics))
        alerts.extend(self._detect_cpu_saturation(metrics))
        alerts.extend(self._detect_performance_degradation(metrics))
        
        # Pattern-based anomaly detection
        alerts.extend(self._detect_anomaly_patterns(metrics))
        
        return alerts
    
    def _establish_baseline(self) -> None:
        """Establish performance baseline from historical data."""
        if len(self.metrics_history) < 20:
            return
        
        # Calculate baseline averages
        recent_metrics = list(self.metrics_history)[-20:]
        
        self.baseline_metrics = {
            "wait_time_ms": sum(m.average_wait_time_ms for m in recent_metrics) / len(recent_metrics),
            "memory_mb": sum(m.memory_usage_mb for m in recent_metrics) / len(recent_metrics),
            "cpu_percent": sum(m.cpu_usage_percent for m in recent_metrics) / len(recent_metrics),
            "throughput_ops": sum(m.throughput_ops_per_second for m in recent_metrics) / len(recent_metrics),
            "latency_ms": sum(m.latency_p95_ms for m in recent_metrics) / len(recent_metrics)
        }
        
        self.baseline_established = True
        logger.info("Performance baseline established", extra=self.baseline_metrics)
    
    def _detect_thread_contention(self, metrics: RealTimeMetrics) -> List[PerformanceAlert]:
        """Detect thread contention bottlenecks."""
        alerts = []
        thresholds = self.thresholds[BottleneckType.THREAD_CONTENTION]
        
        wait_time = metrics.average_wait_time_ms
        contention_rate = metrics.lock_contention_rate
        
        if wait_time > thresholds["emergency"]:
            alerts.append(PerformanceAlert(
                alert_id=f"thread_contention_{int(time.time())}",
                timestamp=metrics.timestamp,
                severity=AlertSeverity.EMERGENCY,
                bottleneck_type=BottleneckType.THREAD_CONTENTION,
                message=f"EMERGENCY: Severe thread contention detected - {wait_time:.1f}ms average wait time",
                metrics={
                    "wait_time_ms": wait_time,
                    "contention_rate": contention_rate,
                    "active_threads": metrics.active_threads,
                    "waiting_threads": metrics.waiting_threads
                },
                suggested_actions=[
                    "Immediately reduce thread pool size",
                    "Enable emergency lock-free mode",
                    "Trigger detector pool expansion",
                    "Alert operations team for manual intervention"
                ]
            ))
        elif wait_time > thresholds["critical"]:
            alerts.append(PerformanceAlert(
                alert_id=f"thread_contention_{int(time.time())}",
                timestamp=metrics.timestamp,
                severity=AlertSeverity.CRITICAL,
                bottleneck_type=BottleneckType.THREAD_CONTENTION,
                message=f"CRITICAL: High thread contention - {wait_time:.1f}ms average wait time",
                metrics={
                    "wait_time_ms": wait_time,
                    "contention_rate": contention_rate
                },
                suggested_actions=[
                    "Expand detector pool capacity",
                    "Optimize lock granularity", 
                    "Consider lock-free algorithms"
                ]
            ))
        elif wait_time > thresholds["warning"]:
            alerts.append(PerformanceAlert(
                alert_id=f"thread_contention_{int(time.time())}",
                timestamp=metrics.timestamp,
                severity=AlertSeverity.WARNING,
                bottleneck_type=BottleneckType.THREAD_CONTENTION,
                message=f"WARNING: Elevated thread contention - {wait_time:.1f}ms average wait time",
                metrics={"wait_time_ms": wait_time},
                suggested_actions=["Monitor for escalation", "Consider pool optimization"]
            ))
        
        return alerts
    
    def _detect_memory_pressure(self, metrics: RealTimeMetrics) -> List[PerformanceAlert]:
        """Detect memory pressure bottlenecks."""
        alerts = []
        thresholds = self.thresholds[BottleneckType.MEMORY_PRESSURE]
        
        memory_mb = metrics.memory_usage_mb
        growth_rate = metrics.memory_growth_rate_mb_s
        
        if memory_mb > thresholds["emergency"]:
            alerts.append(PerformanceAlert(
                alert_id=f"memory_pressure_{int(time.time())}",
                timestamp=metrics.timestamp,
                severity=AlertSeverity.EMERGENCY,
                bottleneck_type=BottleneckType.MEMORY_PRESSURE,
                message=f"EMERGENCY: Critical memory usage - {memory_mb:.1f}MB",
                metrics={
                    "memory_mb": memory_mb,
                    "growth_rate_mb_s": growth_rate,
                    "gc_collections": metrics.gc_collections_per_minute
                },
                suggested_actions=[
                    "Trigger emergency memory cleanup",
                    "Force aggressive garbage collection",
                    "Reduce detector pool size",
                    "Clear all non-essential caches"
                ]
            ))
        elif memory_mb > thresholds["critical"]:
            alerts.append(PerformanceAlert(
                alert_id=f"memory_pressure_{int(time.time())}",
                timestamp=metrics.timestamp,
                severity=AlertSeverity.CRITICAL,
                bottleneck_type=BottleneckType.MEMORY_PRESSURE,
                message=f"CRITICAL: High memory usage - {memory_mb:.1f}MB",
                metrics={"memory_mb": memory_mb, "growth_rate_mb_s": growth_rate},
                suggested_actions=[
                    "Initiate memory cleanup procedures",
                    "Optimize memory allocation patterns",
                    "Review cache sizes"
                ]
            ))
        
        # Check for memory leaks (sustained growth)
        if growth_rate > 5.0:  # 5MB/s sustained growth
            alerts.append(PerformanceAlert(
                alert_id=f"memory_leak_{int(time.time())}",
                timestamp=metrics.timestamp,
                severity=AlertSeverity.CRITICAL,
                bottleneck_type=BottleneckType.RESOURCE_LEAK,
                message=f"CRITICAL: Potential memory leak - {growth_rate:.1f}MB/s growth rate",
                metrics={"growth_rate_mb_s": growth_rate, "memory_mb": memory_mb},
                suggested_actions=[
                    "Investigate memory leak sources",
                    "Enable detailed memory tracking",
                    "Review object lifecycle management"
                ]
            ))
        
        return alerts
    
    def _detect_detector_starvation(self, metrics: RealTimeMetrics) -> List[PerformanceAlert]:
        """Detect detector pool starvation."""
        alerts = []
        
        if metrics.pool_size == 0:
            return alerts  # No pool data available
        
        pool_utilization = metrics.active_detectors / metrics.pool_size
        thresholds = self.thresholds[BottleneckType.DETECTOR_STARVATION]
        
        if pool_utilization > thresholds["emergency"]:
            alerts.append(PerformanceAlert(
                alert_id=f"detector_starvation_{int(time.time())}",
                timestamp=metrics.timestamp,
                severity=AlertSeverity.EMERGENCY,
                bottleneck_type=BottleneckType.DETECTOR_STARVATION,
                message=f"EMERGENCY: Detector pool near exhaustion - {pool_utilization:.1%} utilization",
                metrics={
                    "pool_utilization": pool_utilization,
                    "active_detectors": metrics.active_detectors,
                    "pool_size": metrics.pool_size,
                    "queue_depth": metrics.queue_depth
                },
                suggested_actions=[
                    "Immediately expand detector pool",
                    "Prioritize detector release operations",
                    "Enable emergency detector creation",
                    "Throttle incoming analysis requests"
                ]
            ))
        elif pool_utilization > thresholds["critical"]:
            alerts.append(PerformanceAlert(
                alert_id=f"detector_starvation_{int(time.time())}",
                timestamp=metrics.timestamp,
                severity=AlertSeverity.CRITICAL,
                bottleneck_type=BottleneckType.DETECTOR_STARVATION,
                message=f"CRITICAL: High detector pool utilization - {pool_utilization:.1%}",
                metrics={
                    "pool_utilization": pool_utilization,
                    "queue_depth": metrics.queue_depth
                },
                suggested_actions=[
                    "Expand detector pool capacity",
                    "Optimize detector acquisition patterns",
                    "Review pool sizing configuration"
                ]
            ))
        
        return alerts
    
    def _detect_gc_pressure(self, metrics: RealTimeMetrics) -> List[PerformanceAlert]:
        """Detect garbage collection pressure."""
        alerts = []
        thresholds = self.thresholds[BottleneckType.GC_PRESSURE]
        
        gc_rate = metrics.gc_collections_per_minute
        
        if gc_rate > thresholds["critical"]:
            alerts.append(PerformanceAlert(
                alert_id=f"gc_pressure_{int(time.time())}",
                timestamp=metrics.timestamp,
                severity=AlertSeverity.CRITICAL,
                bottleneck_type=BottleneckType.GC_PRESSURE,
                message=f"CRITICAL: Excessive garbage collection - {gc_rate} collections/minute",
                metrics={
                    "gc_collections_per_minute": gc_rate,
                    "memory_mb": metrics.memory_usage_mb
                },
                suggested_actions=[
                    "Optimize object lifecycle management",
                    "Reduce object allocation rate",
                    "Review memory pooling strategies",
                    "Consider generational GC tuning"
                ]
            ))
        
        return alerts
    
    def _detect_cpu_saturation(self, metrics: RealTimeMetrics) -> List[PerformanceAlert]:
        """Detect CPU saturation bottlenecks."""
        alerts = []
        
        if metrics.cpu_usage_percent > 95.0:
            alerts.append(PerformanceAlert(
                alert_id=f"cpu_saturation_{int(time.time())}",
                timestamp=metrics.timestamp,
                severity=AlertSeverity.CRITICAL,
                bottleneck_type=BottleneckType.CPU_SATURATION,
                message=f"CRITICAL: CPU saturation - {metrics.cpu_usage_percent:.1f}% usage",
                metrics={
                    "cpu_usage_percent": metrics.cpu_usage_percent,
                    "active_threads": metrics.active_threads
                },
                suggested_actions=[
                    "Reduce thread pool size",
                    "Throttle analysis requests",
                    "Optimize CPU-intensive operations",
                    "Consider load balancing"
                ]
            ))
        elif metrics.cpu_usage_percent > 80.0 and metrics.active_threads > 8:
            alerts.append(PerformanceAlert(
                alert_id=f"cpu_pressure_{int(time.time())}",
                timestamp=metrics.timestamp,
                severity=AlertSeverity.WARNING,
                bottleneck_type=BottleneckType.CPU_SATURATION,
                message=f"WARNING: High CPU usage with many threads - {metrics.cpu_usage_percent:.1f}%",
                metrics={
                    "cpu_usage_percent": metrics.cpu_usage_percent,
                    "active_threads": metrics.active_threads
                },
                suggested_actions=[
                    "Monitor thread scaling",
                    "Consider thread pool optimization"
                ]
            ))
        
        return alerts
    
    def _detect_performance_degradation(self, metrics: RealTimeMetrics) -> List[PerformanceAlert]:
        """Detect overall performance degradation."""
        alerts = []
        
        if not self.baseline_established or not self.baseline_metrics:
            return alerts
        
        # Check throughput degradation
        baseline_throughput = self.baseline_metrics.get("throughput_ops", 0)
        if baseline_throughput > 0:
            throughput_ratio = metrics.throughput_ops_per_second / baseline_throughput
            if throughput_ratio < 0.7:  # 30% degradation
                alerts.append(PerformanceAlert(
                    alert_id=f"performance_degradation_{int(time.time())}",
                    timestamp=metrics.timestamp,
                    severity=AlertSeverity.WARNING,
                    bottleneck_type=BottleneckType.DETECTOR_STARVATION,
                    message=f"WARNING: Throughput degraded to {throughput_ratio:.1%} of baseline",
                    metrics={
                        "current_throughput": metrics.throughput_ops_per_second,
                        "baseline_throughput": baseline_throughput,
                        "degradation_ratio": throughput_ratio
                    },
                    suggested_actions=[
                        "Investigate performance regression causes",
                        "Check for resource bottlenecks",
                        "Review recent configuration changes"
                    ]
                ))
        
        # Check latency increase
        baseline_latency = self.baseline_metrics.get("latency_ms", 0)
        if baseline_latency > 0:
            latency_ratio = metrics.latency_p95_ms / baseline_latency
            if latency_ratio > 2.0:  # 100% increase
                alerts.append(PerformanceAlert(
                    alert_id=f"latency_degradation_{int(time.time())}",
                    timestamp=metrics.timestamp,
                    severity=AlertSeverity.WARNING,
                    bottleneck_type=BottleneckType.THREAD_CONTENTION,
                    message=f"WARNING: Latency increased to {latency_ratio:.1f}x baseline",
                    metrics={
                        "current_latency_ms": metrics.latency_p95_ms,
                        "baseline_latency_ms": baseline_latency,
                        "increase_ratio": latency_ratio
                    },
                    suggested_actions=[
                        "Investigate latency increase causes",
                        "Check thread contention levels",
                        "Review system resource usage"
                    ]
                ))
        
        return alerts
    
    def _detect_anomaly_patterns(self, metrics: RealTimeMetrics) -> List[PerformanceAlert]:
        """Detect anomaly patterns using statistical analysis."""
        alerts = []
        
        if len(self.metrics_history) < 30:
            return alerts  # Need more data for pattern analysis
        
        recent_metrics = list(self.metrics_history)[-30:]
        
        # Analyze wait time pattern
        wait_times = [m.average_wait_time_ms for m in recent_metrics]
        wait_time_avg = sum(wait_times) / len(wait_times)
        wait_time_std = (sum((x - wait_time_avg) ** 2 for x in wait_times) / len(wait_times)) ** 0.5
        
        current_wait_time = metrics.average_wait_time_ms
        if wait_time_std > 0 and abs(current_wait_time - wait_time_avg) > 3 * wait_time_std:
            alerts.append(PerformanceAlert(
                alert_id=f"wait_time_anomaly_{int(time.time())}",
                timestamp=metrics.timestamp,
                severity=AlertSeverity.WARNING,
                bottleneck_type=BottleneckType.THREAD_CONTENTION,
                message=f"WARNING: Wait time anomaly detected - {current_wait_time:.1f}ms (avg: {wait_time_avg:.1f}ms)",
                metrics={
                    "current_wait_time_ms": current_wait_time,
                    "average_wait_time_ms": wait_time_avg,
                    "standard_deviation": wait_time_std
                },
                suggested_actions=[
                    "Investigate sudden wait time change",
                    "Check for resource contention",
                    "Review recent system changes"
                ]
            ))
        
        return alerts

class RealTimePerformanceMonitor:
    """
    Comprehensive real-time performance monitor with bottleneck detection,
    alert generation, and adaptive optimization capabilities.
    """
    
    def __init__(self,
                monitoring_interval: float = 2.0,
                alert_callback: Optional[Callable[[PerformanceAlert], None]] = None):
        """
        Initialize real-time performance monitor.
        
        Args:
            monitoring_interval: Monitoring frequency in seconds
            alert_callback: Callback function for alert notifications
        """
        assert 0.5 <= monitoring_interval <= 60.0, "monitoring_interval must be 0.5-60 seconds"
        
        self.monitoring_interval = monitoring_interval
        self.alert_callback = alert_callback
        
        # Core components
        self.bottleneck_detector = BottleneckDetector()
        
        # Monitoring state
        self.monitoring_active = False
        self.monitor_thread: Optional[threading.Thread] = None
        
        # Alert management
        self.active_alerts: Dict[str, PerformanceAlert] = {}
        self.alert_history: deque = deque(maxlen=1000)
        self.alert_suppression: Dict[Tuple[BottleneckType, AlertSeverity], float] = {}
        
        # Metrics collection
        self.metrics_collectors: List[Callable[[], RealTimeMetrics]] = []
        self.last_metrics: Optional[RealTimeMetrics] = None
        
        # Auto-resolution
        self.auto_resolution_enabled = True
        self.resolution_callbacks: Dict[BottleneckType, List[Callable[[PerformanceAlert], bool]]] = defaultdict(list)
        
        # Thread safety
        self._lock = RLock()
        
        logger.info(f"RealTimePerformanceMonitor initialized with {monitoring_interval}s interval")
    
    def add_metrics_collector(self, collector: Callable[[], RealTimeMetrics]) -> None:
        """Add metrics collector function."""
        assert callable(collector), "collector must be callable"
        self.metrics_collectors.append(collector)
    
    def add_resolution_callback(self, bottleneck_type: BottleneckType, callback: Callable[[PerformanceAlert], bool]) -> None:
        """Add auto-resolution callback for bottleneck type."""
        assert callable(callback), "callback must be callable"
        self.resolution_callbacks[bottleneck_type].append(callback)
    
    def start_monitoring(self) -> None:
        """Start real-time performance monitoring."""
        with self._lock:
            if self.monitoring_active:
                logger.warning("Real-time monitoring already active")
                return
            
            self.monitoring_active = True
            self.monitor_thread = threading.Thread(
                target=self._monitoring_loop,
                name="RealTimePerformanceMonitor",
                daemon=True
            )
            self.monitor_thread.start()
            
        logger.info("Real-time performance monitoring started")
    
    def stop_monitoring(self) -> None:
        """Stop real-time performance monitoring."""
        with self._lock:
            if not self.monitoring_active:
                return
            
            self.monitoring_active = False
            if self.monitor_thread and self.monitor_thread.is_alive():
                self.monitor_thread.join(timeout=MAXIMUM_NESTED_DEPTH)
        
        logger.info("Real-time performance monitoring stopped")
    
    def _monitoring_loop(self) -> None:
        """Main monitoring loop."""
        logger.info("Real-time monitoring loop started")
        
        while self.monitoring_active:
            try:
                self._collect_and_analyze_metrics()
                time.sleep(self.monitoring_interval)
            except Exception as e:
                logger.error(f"Monitoring loop error: {e}")
                time.sleep(self.monitoring_interval * 2)
        
        logger.info("Real-time monitoring loop ended")
    
    def _collect_and_analyze_metrics(self) -> None:
        """Collect metrics and analyze for bottlenecks."""
        try:
            # Collect metrics from all collectors
            current_metrics = self._collect_metrics()
            if not current_metrics:
                return
            
            self.last_metrics = current_metrics
            
            # Analyze for bottlenecks
            alerts = self.bottleneck_detector.analyze_metrics(current_metrics)
            
            # Process alerts
            for alert in alerts:
                self._process_alert(alert)
                
        except Exception as e:
            logger.error(f"Failed to collect and analyze metrics: {e}")
    
    def _collect_metrics(self) -> Optional[RealTimeMetrics]:
        """Collect metrics from all registered collectors."""
        if not self.metrics_collectors:
            # Fallback to basic system metrics
            return self._collect_basic_system_metrics()
        
        # Aggregate metrics from all collectors
        aggregated_metrics = None
        for collector in self.metrics_collectors:
            try:
                metrics = collector()
                if aggregated_metrics is None:
                    aggregated_metrics = metrics
                else:
                    # Merge metrics (simplified aggregation)
                    aggregated_metrics = self._merge_metrics(aggregated_metrics, metrics)
            except Exception as e:
                logger.error(f"Metrics collector failed: {e}")
        
        return aggregated_metrics
    
    def _collect_basic_system_metrics(self) -> RealTimeMetrics:
        """Collect basic system metrics as fallback."""
        try:
            process = psutil.Process()
            memory_info = process.memory_info()
            cpu_percent = process.cpu_percent()
            
            # Get thread count (approximation)
            thread_count = process.num_threads()
            
            return RealTimeMetrics(
                timestamp=time.time(),
                memory_usage_mb=memory_info.rss / (1024 * 1024),
                cpu_usage_percent=cpu_percent,
                active_threads=thread_count,
                # Other metrics would be 0/default without specific collectors
            )
            
        except Exception as e:
            logger.error(f"Failed to collect basic system metrics: {e}")
            return RealTimeMetrics(timestamp=time.time())
    
    def _merge_metrics(self, metrics1: RealTimeMetrics, metrics2: RealTimeMetrics) -> RealTimeMetrics:
        """Merge metrics from multiple collectors."""
        # Simplified merge - in practice this would be more sophisticated
        return RealTimeMetrics(
            timestamp=max(metrics1.timestamp, metrics2.timestamp),
            active_threads=max(metrics1.active_threads, metrics2.active_threads),
            waiting_threads=max(metrics1.waiting_threads, metrics2.waiting_threads),
            average_wait_time_ms=max(metrics1.average_wait_time_ms, metrics2.average_wait_time_ms),
            memory_usage_mb=max(metrics1.memory_usage_mb, metrics2.memory_usage_mb),
            cpu_usage_percent=max(metrics1.cpu_usage_percent, metrics2.cpu_usage_percent),
            pool_size=max(metrics1.pool_size, metrics2.pool_size),
            active_detectors=max(metrics1.active_detectors, metrics2.active_detectors),
            throughput_ops_per_second=max(metrics1.throughput_ops_per_second, metrics2.throughput_ops_per_second)
        )
    
    def _process_alert(self, alert: PerformanceAlert) -> None:
        """Process performance alert."""
        with self._lock:
            # Check alert suppression
            suppression_key = (alert.bottleneck_type, alert.severity)
            if self._is_alert_suppressed(suppression_key):
                return
            
            # Store alert
            self.active_alerts[alert.alert_id] = alert
            self.alert_history.append(alert)
            
            # Attempt auto-resolution
            if self.auto_resolution_enabled and alert.severity != AlertSeverity.EMERGENCY:
                resolution_successful = self._attempt_auto_resolution(alert)
                alert.auto_resolution_attempted = True
                alert.resolution_successful = resolution_successful
            
            # Send alert notification
            if self.alert_callback:
                try:
                    self.alert_callback(alert)
                except Exception as e:
                    logger.error(f"Alert callback failed: {e}")
            
            # Log alert
            self._log_alert(alert)
            
            # Set suppression to prevent spam
            self._set_alert_suppression(suppression_key)
    
    def _is_alert_suppressed(self, suppression_key: Tuple[BottleneckType, AlertSeverity]) -> bool:
        """Check if alert type is suppressed."""
        last_alert_time = self.alert_suppression.get(suppression_key, 0)
        suppression_duration = self._get_suppression_duration(suppression_key[1])
        
        return time.time() - last_alert_time < suppression_duration
    
    def _get_suppression_duration(self, severity: AlertSeverity) -> float:
        """Get suppression duration based on severity."""
        durations = {
            AlertSeverity.INFO: 300.0,      # 5 minutes
            AlertSeverity.WARNING: 120.0,   # 2 minutes
            AlertSeverity.CRITICAL: 60.0,   # 1 minute
            AlertSeverity.EMERGENCY: 0.0    # No suppression
        }
        return durations.get(severity, 120.0)
    
    def _set_alert_suppression(self, suppression_key: Tuple[BottleneckType, AlertSeverity]) -> None:
        """Set alert suppression timestamp."""
        self.alert_suppression[suppression_key] = time.time()
    
    def _attempt_auto_resolution(self, alert: PerformanceAlert) -> bool:
        """Attempt automatic resolution of performance alert."""
        callbacks = self.resolution_callbacks.get(alert.bottleneck_type, [])
        
        for callback in callbacks:
            try:
                if callback(alert):
                    logger.info(f"Auto-resolved alert: {alert.alert_id}")
                    return True
            except Exception as e:
                logger.error(f"Auto-resolution callback failed: {e}")
        
        return False
    
    def _log_alert(self, alert: PerformanceAlert) -> None:
        """Log performance alert."""
        log_level = {
            AlertSeverity.INFO: logging.INFO,
            AlertSeverity.WARNING: logging.WARNING,
            AlertSeverity.CRITICAL: logging.ERROR,
            AlertSeverity.EMERGENCY: logging.CRITICAL
        }.get(alert.severity, logging.WARNING)
        
        logger.log(log_level, f"Performance Alert: {alert.message}", extra={
            "alert_id": alert.alert_id,
            "bottleneck_type": alert.bottleneck_type.value,
            "severity": alert.severity.value,
            "metrics": alert.metrics
        })
    
    def get_monitoring_report(self) -> Dict[str, Any]:
        """Generate comprehensive monitoring report."""
        with self._lock:
            # Alert statistics
            alert_counts = defaultdict(int)
            severity_counts = defaultdict(int)
            
            for alert in self.alert_history:
                alert_counts[alert.bottleneck_type] += 1
                severity_counts[alert.severity] += 1
            
            return {
                "monitoring_status": {
                    "active": self.monitoring_active,
                    "monitoring_interval_seconds": self.monitoring_interval,
                    "collectors_registered": len(self.metrics_collectors),
                    "auto_resolution_enabled": self.auto_resolution_enabled
                },
                "current_metrics": self.last_metrics.__dict__ if self.last_metrics else {},
                "alert_summary": {
                    "active_alerts": len(self.active_alerts),
                    "total_alerts": len(self.alert_history),
                    "alerts_by_type": {bt.value: count for bt, count in alert_counts.items()},
                    "alerts_by_severity": {sev.value: count for sev, count in severity_counts.items()}
                },
                "bottleneck_detection": {
                    "baseline_established": self.bottleneck_detector.baseline_established,
                    "sensitivity": self.bottleneck_detector.sensitivity,
                    "metrics_history_size": len(self.bottleneck_detector.metrics_history)
                },
                "performance_recommendations": self._generate_performance_recommendations()
            }
    
    def _generate_performance_recommendations(self) -> List[str]:
        """Generate performance recommendations based on alert history."""
        recommendations = []
        
        if not self.alert_history:
            return ["No performance issues detected"]
        
        # Analyze alert patterns
        recent_alerts = [alert for alert in self.alert_history if time.time() - alert.timestamp < 3600]  # Last hour
        
        bottleneck_counts = defaultdict(int)
        for alert in recent_alerts:
            bottleneck_counts[alert.bottleneck_type] += 1
        
        # Generate recommendations based on most common issues
        for bottleneck_type, count in bottleneck_counts.items():
            if count >= 5:  # Recurring issue
                if bottleneck_type == BottleneckType.THREAD_CONTENTION:
                    recommendations.append(
                        f"HIGH PRIORITY: Thread contention detected {count}x in last hour - "
                        "implement lock-free detector queue"
                    )
                elif bottleneck_type == BottleneckType.MEMORY_PRESSURE:
                    recommendations.append(
                        f"HIGH PRIORITY: Memory pressure detected {count}x in last hour - "
                        "enable aggressive memory cleanup"
                    )
                elif bottleneck_type == BottleneckType.DETECTOR_STARVATION:
                    recommendations.append(
                        f"MEDIUM PRIORITY: Detector starvation detected {count}x in last hour - "
                        "expand detector pool capacity"
                    )
        
        if not recommendations:
            recommendations.append("System performance is stable - no immediate actions required")
        
        return recommendations
    
    def __enter__(self):
        """Context manager entry."""
        self.start_monitoring()
        return self
    
    def begin_analysis(self, target: str):
        """Mark beginning of analysis operation."""
        # Use existing basic metric collection
        self._analysis_start_time = time.time()
        self._files_analyzed = 0
        self._violations_found = 0
        logger.info(f"Analysis started for: {target}")

    def end_analysis(self) -> Dict[str, Any]:
        """Mark end of analysis and return final metrics."""
        if hasattr(self, '_analysis_start_time'):
            analysis_duration = time.time() - self._analysis_start_time
        else:
            analysis_duration = 0

        files_analyzed = getattr(self, '_files_analyzed', 0)
        violations_found = getattr(self, '_violations_found', 0)

        # Get basic system metrics
        current_metrics = self._collect_basic_system_metrics()
        peak_memory = current_metrics.memory_usage_mb

        final_metrics = {
            "analysis_duration_s": analysis_duration,
            "files_analyzed": files_analyzed,
            "violations_found": violations_found,
            "peak_memory_mb": peak_memory,
            "avg_cpu_percent": current_metrics.cpu_usage_percent,
            "throughput_files_per_sec": files_analyzed / max(analysis_duration, 0.001)
        }

        logger.info(f"Analysis completed: {final_metrics}")
        return final_metrics

    def record_file_analyzed(self, violation_count: int = 0):
        """Record that a file was analyzed."""
        if not hasattr(self, '_files_analyzed'):
            self._files_analyzed = 0
            self._violations_found = 0

        self._files_analyzed += 1
        self._violations_found += violation_count

    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics in expected format."""
        if hasattr(self, 'last_metrics') and self.last_metrics:
            return {
                "memory_mb": self.last_metrics.memory_usage_mb,
                "cpu_percent": self.last_metrics.cpu_usage_percent,
                "files_analyzed": getattr(self, '_files_analyzed', 0),
                "violations_found": getattr(self, '_violations_found', 0)
            }
        else:
            current = self._collect_basic_system_metrics()
            return {
                "memory_mb": current.memory_usage_mb,
                "cpu_percent": current.cpu_usage_percent,
                "files_analyzed": getattr(self, '_files_analyzed', 0),
                "violations_found": getattr(self, '_violations_found', 0)
            }

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.stop_monitoring()

# Global real-time monitor instance
_global_real_time_monitor: Optional[RealTimePerformanceMonitor] = None
_monitor_lock = threading.Lock()

def get_global_real_time_monitor() -> RealTimePerformanceMonitor:
    """Get or create global real-time performance monitor."""
    global _global_real_time_monitor
    with _monitor_lock:
        if _global_real_time_monitor is None:
            _global_real_time_monitor = RealTimePerformanceMonitor()
        return _global_real_time_monitor

def start_real_time_monitoring(alert_callback: Optional[Callable[[PerformanceAlert], None]] = None) -> None:
    """Start global real-time performance monitoring."""
    monitor = get_global_real_time_monitor()
    if alert_callback:
        monitor.alert_callback = alert_callback
    monitor.start_monitoring()

def stop_real_time_monitoring() -> None:
    """Stop global real-time performance monitoring."""
    global _global_real_time_monitor
    with _monitor_lock:
        if _global_real_time_monitor:
            _global_real_time_monitor.stop_monitoring()

def get_real_time_monitoring_report() -> Dict[str, Any]:
    """Get comprehensive real-time monitoring report."""
    monitor = get_global_real_time_monitor()
    return monitor.get_monitoring_report()

# Example alert handler
def example_alert_handler(alert: PerformanceAlert) -> None:
    """Example alert handler for demonstration."""
    print(f"[ALERT] {alert.severity.value.upper()}: {alert.message}")
    if alert.suggested_actions:
        print("   Suggested actions:")
        for action in alert.suggested_actions:
            print(f"   - {action}")

if __name__ == "__main__":
    # Demonstration of real-time monitoring
    print("Starting real-time performance monitoring demonstration...")
    
    # Create monitor with alert handler
    monitor = RealTimePerformanceMonitor(
        monitoring_interval=1.0,
        alert_callback=example_alert_handler
    )
    
    # Start monitoring
    monitor.start_monitoring()
    
    try:
        # Let it run for 10 seconds
        time.sleep(10)
        
        # Get report
        report = monitor.get_monitoring_report()
        print(f"\nMonitoring Report:")
        print(json.dumps(report, indent=2, default=str))
        
    finally:
        monitor.stop_monitoring()
        print("\nReal-time monitoring demonstration completed.")