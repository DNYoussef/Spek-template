"""
PerformanceProfiler - Extracted from result_aggregation_profiler
Handles performance profiling and metrics
Part of god object decomposition (Day 4)
"""

from datetime import datetime
from typing import Dict, List, Optional, Any, Callable
import logging
import time

from contextlib import contextmanager
from dataclasses import dataclass, field
import psutil
import threading

logger = logging.getLogger(__name__)

@dataclass
class ProfileMetric:
    """Performance metric measurement."""
    name: str
    start_time: float
    end_time: Optional[float]
    duration: Optional[float]
    memory_start: int
    memory_end: Optional[int]
    memory_delta: Optional[int]
    cpu_percent: Optional[float]
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ProfileSession:
    """Profiling session information."""
    id: str
    name: str
    started_at: datetime
    ended_at: Optional[datetime]
    metrics: List[ProfileMetric]
    summary: Optional[Dict[str, Any]]

@dataclass
class PerformanceStats:
    """Performance statistics."""
    total_time: float
    cpu_time: float
    memory_peak: int
    memory_average: float
    function_calls: Dict[str, int]
    slowest_operations: List[Tuple[str, float]]

class PerformanceProfiler:
    """
    Handles performance profiling and metrics.

    Extracted from result_aggregation_profiler (1, 16 LOC -> ~250 LOC component).
    Handles:
    - Performance timing
    - Memory profiling
    - CPU usage tracking
    - Function call profiling
    - Resource monitoring
    """

    def __init__(self):
        """Initialize performance profiler."""
        self.active_sessions: Dict[str, ProfileSession] = {}
        self.completed_sessions: List[ProfileSession] = []
        self.active_metrics: Dict[str, ProfileMetric] = {}
        self.function_call_counts: Dict[str, int] = {}
        self.monitoring_thread: Optional[threading.Thread] = None
        self.monitoring_active = False

    def start_session(self, name: str) -> str:
        """Start new profiling session."""
        session_id = f"session-{int(time.time())}-{name}"

        session = ProfileSession(
            id=session_id,
            name=name,
            started_at=datetime.now(),
            ended_at=None,
            metrics=[],
            summary=None
        )

        self.active_sessions[session_id] = session
        logger.info(f"Started profiling session: {session_id}")
        return session_id

    def end_session(self, session_id: str) -> Optional[ProfileSession]:
        """End profiling session and return results."""
        if session_id not in self.active_sessions:
            logger.warning(f"Session not found: {session_id}")
            return None

        session = self.active_sessions.pop(session_id)
        session.ended_at = datetime.now()

        # Generate summary
        session.summary = self._generate_session_summary(session)

        self.completed_sessions.append(session)
        logger.info(f"Ended profiling session: {session_id}")
        return session

    def start_metric(self,
                    name: str,
                    session_id: Optional[str] = None,
                    metadata: Optional[Dict[str, Any]] = None) -> str:
        """Start timing a metric."""
        metric_id = f"{name}-{int(time.time() * 1000000)}"

        # Get current memory usage
        process = psutil.Process()
        memory_info = process.memory_info()

        metric = ProfileMetric(
            name=name,
            start_time=time.perf_counter(),
            end_time=None,
            duration=None,
            memory_start=memory_info.rss,
            memory_end=None,
            memory_delta=None,
            cpu_percent=None,
            metadata=metadata or {}
        )

        self.active_metrics[metric_id] = metric

        # Add to session if specified
        if session_id and session_id in self.active_sessions:
            self.active_sessions[session_id].metrics.append(metric)

        return metric_id

    def end_metric(self, metric_id: str) -> Optional[ProfileMetric]:
        """End timing a metric."""
        if metric_id not in self.active_metrics:
            logger.warning(f"Metric not found: {metric_id}")
            return None

        metric = self.active_metrics.pop(metric_id)

        # Calculate duration
        metric.end_time = time.perf_counter()
        metric.duration = metric.end_time - metric.start_time

        # Get final memory usage
        process = psutil.Process()
        memory_info = process.memory_info()
        metric.memory_end = memory_info.rss
        metric.memory_delta = metric.memory_end - metric.memory_start

        # Get CPU usage
        metric.cpu_percent = process.cpu_percent(interval=0.1)

        # Track function calls
        self.function_call_counts[metric.name] = self.function_call_counts.get(metric.name, 0) + 1

        return metric

    @contextmanager
    def profile(self, name: str, session_id: Optional[str] = None):
        """Context manager for profiling code blocks."""
        metric_id = self.start_metric(name, session_id)
        try:
            yield metric_id
        finally:
            self.end_metric(metric_id)

    def profile_function(self, func: Callable) -> Callable:
        """Decorator for profiling functions."""
        def wrapper(*args, **kwargs):
            with self.profile(func.__name__):
                return func(*args, **kwargs)
        return wrapper

    def start_monitoring(self, interval: float = 1.0):
        """Start continuous resource monitoring."""
        if self.monitoring_active:
            return

        self.monitoring_active = True

        def monitor():
            while self.monitoring_active:
                self._collect_system_metrics()
                time.sleep(interval)

        self.monitoring_thread = threading.Thread(target=monitor, daemon=True)
        self.monitoring_thread.start()
        logger.info("Started resource monitoring")

    def stop_monitoring(self):
        """Stop continuous resource monitoring."""
        self.monitoring_active = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=2)
        logger.info("Stopped resource monitoring")

    def _collect_system_metrics(self):
        """Collect current system metrics."""
        try:
            process = psutil.Process()

            # CPU metrics
            cpu_percent = process.cpu_percent(interval=0.1)
            cpu_times = process.cpu_times()

            # Memory metrics
            memory_info = process.memory_info()
            memory_percent = process.memory_percent()

            # I/O metrics (if available)
            try:
                io_counters = process.io_counters()
                io_stats = {
                    'read_bytes': io_counters.read_bytes,
                    'write_bytes': io_counters.write_bytes
                }
            except:
                io_stats = {}

            # Store metrics (simplified - would typically go to time series)
            system_metric = {
                'timestamp': datetime.now(),
                'cpu_percent': cpu_percent,
                'cpu_user': cpu_times.user,
                'cpu_system': cpu_times.system,
                'memory_rss': memory_info.rss,
                'memory_vms': memory_info.vms,
                'memory_percent': memory_percent,
                'io': io_stats
            }

            # Add to active sessions
            for session in self.active_sessions.values():
                session.metrics.append(self._create_system_metric(system_metric))

        except Exception as e:
            logger.error(f"Failed to collect system metrics: {e}")

    def _create_system_metric(self, data: Dict[str, Any]) -> ProfileMetric:
        """Create ProfileMetric from system data."""
        return ProfileMetric(
            name='system',
            start_time=time.perf_counter(),
            end_time=time.perf_counter(),
            duration=0,
            memory_start=data.get('memory_rss', 0),
            memory_end=data.get('memory_rss', 0),
            memory_delta=0,
            cpu_percent=data.get('cpu_percent', 0),
            metadata=data
        )

    def _generate_session_summary(self, session: ProfileSession) -> Dict[str, Any]:
        """Generate summary statistics for session."""
        if not session.metrics:
            return {'status': 'no_metrics'}

        # Calculate totals
        total_duration = sum(m.duration for m in session.metrics if m.duration)
        max_memory = max((m.memory_end or 0) for m in session.metrics)
        total_memory_delta = sum(m.memory_delta for m in session.metrics if m.memory_delta)

        # Find slowest operations
        timed_metrics = [m for m in session.metrics if m.duration]
        slowest = sorted(timed_metrics, key=lambda x: x.duration or 0, reverse=True)[:10]

        # Group by metric name
        metric_groups = {}
        for metric in session.metrics:
            if metric.name not in metric_groups:
                metric_groups[metric.name] = []
            metric_groups[metric.name].append(metric)

        # Calculate per-group statistics
        group_stats = {}
        for name, metrics in metric_groups.items():
            durations = [m.duration for m in metrics if m.duration]
            if durations:
                group_stats[name] = {
                    'count': len(metrics),
                    'total_time': sum(durations),
                    'avg_time': sum(durations) / len(durations),
                    'min_time': min(durations),
                    'max_time': max(durations)
                }

        return {
            'total_duration': total_duration,
            'max_memory': max_memory,
            'total_memory_delta': total_memory_delta,
            'metric_count': len(session.metrics),
            'unique_metrics': len(metric_groups),
            'slowest_operations': [
                {'name': m.name, 'duration': m.duration}
                for m in slowest
            ],
            'group_statistics': group_stats,
            'session_duration': (session.ended_at - session.started_at).total_seconds() if session.ended_at else None
        }

    def get_performance_stats(self) -> PerformanceStats:
        """Get overall performance statistics."""
        all_metrics = []

        # Collect from all sessions
        for session in self.completed_sessions:
            all_metrics.extend(session.metrics)

        if not all_metrics:
            return PerformanceStats(
                total_time=0,
                cpu_time=0,
                memory_peak=0,
                memory_average=0,
                function_calls={},
                slowest_operations=[]
            )

        # Calculate statistics
        total_time = sum(m.duration for m in all_metrics if m.duration)
        cpu_time = sum(m.cpu_percent or 0 for m in all_metrics) / 100
        memory_values = [m.memory_end for m in all_metrics if m.memory_end]
        memory_peak = max(memory_values) if memory_values else 0
        memory_average = sum(memory_values) / len(memory_values) if memory_values else 0

        # Find slowest operations
        timed_metrics = [(m.name, m.duration) for m in all_metrics if m.duration]
        slowest = sorted(timed_metrics, key=lambda x: x[1], reverse=True)[:10]

        return PerformanceStats(
            total_time=total_time,
            cpu_time=cpu_time,
            memory_peak=memory_peak,
            memory_average=memory_average,
            function_calls=self.function_call_counts.copy(),
            slowest_operations=slowest
        )

    def compare_sessions(self,
                        session_id1: str,
                        session_id2: str) -> Dict[str, Any]:
        """Compare two profiling sessions."""
        session1 = next((s for s in self.completed_sessions if s.id == session_id1), None)
        session2 = next((s for s in self.completed_sessions if s.id == session_id2), None)

        if not session1 or not session2:
            return {'error': 'Sessions not found'}

        return {
            'session1': session1.summary,
            'session2': session2.summary,
            'comparison': {
                'duration_diff': (session1.summary.get('total_duration', 0) -
                                session2.summary.get('total_duration', 0)),
                'memory_diff': (session1.summary.get('max_memory', 0) -
                                session2.summary.get('max_memory', 0)),
                'metric_count_diff': (session1.summary.get('metric_count', 0) -
                                    session2.summary.get('metric_count', 0))
            }
        }

    def clear_history(self):
        """Clear profiling history."""
        self.completed_sessions.clear()
        self.function_call_counts.clear()
        logger.info("Cleared profiling history")