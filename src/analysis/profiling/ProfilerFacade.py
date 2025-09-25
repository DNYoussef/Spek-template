"""
ProfilerFacade - Backward compatible interface for result aggregation profiler
Maintains API compatibility while delegating to decomposed components
Part of god object decomposition (Day 4)
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Callable
import logging

from contextlib import contextmanager

from .DataAggregator import DataAggregator, AggregationResult, TimeSeries
from .PerformanceProfiler import PerformanceProfiler, ProfileMetric, ProfileSession, PerformanceStats
from .ReportBuilder import ReportBuilder, Report, ReportTemplate, ReportSection

logger = logging.getLogger(__name__)

class ResultAggregationProfiler:
    """
    Facade for Result Aggregation and Profiling System.

    Original: 1, 16 LOC god object
    Refactored: ~150 LOC facade + 3 specialized components (~700 LOC total)

    Maintains 100% backward compatibility while delegating to:
    - DataAggregator: Data collection and aggregation
    - PerformanceProfiler: Performance metrics and profiling
    - ReportBuilder: Report generation and formatting
    """

def __init__(self):
        """Initialize result aggregation profiler."""
        # Initialize components
        self.data_aggregator = DataAggregator()
        self.performance_profiler = PerformanceProfiler()
        self.report_builder = ReportBuilder()

        # Maintain original state for compatibility
        self.active_profiling = False
        self.results_cache: Dict[str, Any] = {}
        self.current_session: Optional[str] = None

        logger.info("Result Aggregation Profiler initialized")

    # Data aggregation methods (delegated to DataAggregator)
def add_data_point(self,
                        metric_name: str,
                        value: float,
                        tags: Optional[Dict[str, str]] = None,
                        metadata: Optional[Dict[str, Any]] = None) -> None:
        """Add data point for aggregation."""
        self.data_aggregator.add_data_point(metric_name, value, tags, metadata)

def bulk_add_data(self, data_points: List[Dict[str, Any]]) -> int:
        """Add multiple data points."""
        return self.data_aggregator.bulk_add_data(data_points)

def aggregate_metric(self,
                        metric_name: str,
                        start_time: Optional[datetime] = None,
                        end_time: Optional[datetime] = None) -> Optional[AggregationResult]:
        """Aggregate metric data."""
        return self.data_aggregator.aggregate_metric(metric_name, start_time, end_time)

def create_time_series(self,
                            name: str,
                            resolution: str = 'minute',
                            aggregation_method: str = 'avg') -> TimeSeries:
        """Create time series for tracking."""
        return self.data_aggregator.create_time_series(name, resolution, aggregation_method)

def aggregate_time_series(self,
                            series_name: str,
                            window: timedelta) -> List[Dict[str, Any]]:
        """Aggregate time series data."""
        return self.data_aggregator.aggregate_time_series(series_name, window)

def correlate_metrics(self, metric1: str, metric2: str) -> float:
        """Calculate correlation between metrics."""
        return self.data_aggregator.correlate_metrics(metric1, metric2)

def detect_anomalies(self,
                        metric_name: str,
                        threshold_std: float = 3.0) -> List[Any]:
        """Detect anomalies in metric data."""
        return self.data_aggregator.detect_anomalies(metric_name, threshold_std)

    # Performance profiling methods (delegated to PerformanceProfiler)
def start_profiling_session(self, name: str) -> str:
        """Start new profiling session."""
        session_id = self.performance_profiler.start_session(name)
        self.current_session = session_id
        self.active_profiling = True
        return session_id

def end_profiling_session(self, session_id: Optional[str] = None) -> Optional[ProfileSession]:
        """End profiling session."""
        sid = session_id or self.current_session
        if sid:
            session = self.performance_profiler.end_session(sid)
            if sid == self.current_session:
                self.current_session = None
                self.active_profiling = False
            return session
        return None

def start_metric(self,
                    name: str,
                    metadata: Optional[Dict[str, Any]] = None) -> str:
        """Start timing a metric."""
        return self.performance_profiler.start_metric(
            name, self.current_session, metadata
        )

def end_metric(self, metric_id: str) -> Optional[ProfileMetric]:
        """End timing a metric."""
        return self.performance_profiler.end_metric(metric_id)

@contextmanager
def profile(self, name: str):
        """Context manager for profiling."""
        with self.performance_profiler.profile(name, self.current_session) as metric_id:
            yield metric_id

def profile_function(self, func: Callable) -> Callable:
        """Decorator for profiling functions."""
        return self.performance_profiler.profile_function(func)

def start_monitoring(self, interval: float = 1.0):
        """Start continuous monitoring."""
        self.performance_profiler.start_monitoring(interval)

def stop_monitoring(self):
        """Stop continuous monitoring."""
        self.performance_profiler.stop_monitoring()

def get_performance_stats(self) -> PerformanceStats:
        """Get performance statistics."""
        return self.performance_profiler.get_performance_stats()

    # Report generation methods (delegated to ReportBuilder)
def create_report(self,
                    title: str,
                    template_name: str = 'performance',
                    format: Optional[str] = None) -> Report:
        """Create comprehensive report."""
        # Gather data from components
        data = self._gather_report_data()

        # Create report
        report = self.report_builder.create_report(
            title, data, template_name, format
        )

        # Cache report
        self.results_cache[report.id] = report

        return report

def export_report(self,
                    report_id: str,
                    output_path: str) -> bool:
        """Export report to file."""
        return self.report_builder.export_report(report_id, output_path)

def add_report_template(self, name: str, template: ReportTemplate):
        """Add custom report template."""
        self.report_builder.add_template(name, template)

    # Combined analysis methods
def analyze_performance(self,
                            session_id: Optional[str] = None) -> Dict[str, Any]:
        """Analyze performance data."""
        # Get session data
        if session_id:
            sessions = [s for s in self.performance_profiler.completed_sessions
                        if s.id == session_id]
            if not sessions:
                return {'error': 'Session not found'}
            session = sessions[0]
        else:
            # Use most recent session
            if not self.performance_profiler.completed_sessions:
                return {'error': 'No completed sessions'}
            session = self.performance_profiler.completed_sessions[-1]

        # Analyze session data
        analysis = {
            'session_id': session.id,
            'session_name': session.name,
            'duration': (session.ended_at - session.started_at).total_seconds() if session.ended_at else 0,
            'metrics_count': len(session.metrics),
            'summary': session.summary,
            'performance_stats': self.get_performance_stats()
        }

        # Add aggregation analysis
        for metric in set(m.name for m in session.metrics):
            agg = self.data_aggregator.aggregate_metric(metric)
            if agg:
                analysis[f'{metric}_stats'] = {
                    'mean': agg.mean,
                    'median': agg.median,
                    'min': agg.min,
                    'max': agg.max,
                    'std_dev': agg.std_dev
                }

        return analysis

def get_trending_analysis(self,
                            window: timedelta = timedelta(hours=1)) -> Dict[str, Any]:
        """Get trending metrics analysis."""
        trending = self.data_aggregator.get_trending_metrics(window)

        analysis = {
            'trending_metrics': trending,
            'window': str(window),
            'analysis_time': datetime.now().isoformat()
        }

        # Add details for each trending metric
        for metric in trending:
            agg = self.data_aggregator.aggregate_metric(metric)
            if agg:
                analysis[metric] = {
                    'trend': 'increasing',
                    'current_mean': agg.mean,
                    'percentiles': agg.percentiles
                }

        return analysis

def benchmark(self,
                func: Callable,
                iterations: int = 100,
                warmup: int = 10) -> Dict[str, Any]:
        """Benchmark a function."""
        # Warmup
        for _ in range(warmup):
            func()

        # Start profiling session
        session_id = self.start_profiling_session(f"benchmark_{func.__name__}")

        # Run benchmarks
        for i in range(iterations):
            with self.profile(f"iteration_{i}"):
                func()

        # End session
        session = self.end_profiling_session(session_id)

        if not session or not session.summary:
            return {'error': 'Benchmark failed'}

        # Calculate results
        return {
            'function': func.__name__,
            'iterations': iterations,
            'warmup': warmup,
            'total_time': session.summary.get('total_duration', 0),
            'avg_time': session.summary.get('total_duration', 0) / iterations if iterations > 0 else 0,
            'memory_peak': session.summary.get('max_memory', 0),
            'session_id': session_id
        }

def _gather_report_data(self) -> Dict[str, Any]:
        """Gather data for report generation."""
        data = {
            'executive_summary': {
                'total_sessions': len(self.performance_profiler.completed_sessions),
                'active_profiling': self.active_profiling,
                'metrics_collected': len(self.data_aggregator.data_points)
            }
        }

        # Add performance metrics
        perf_stats = self.get_performance_stats()
        data['performance_metrics'] = {
            'total_time': perf_stats.total_time,
            'cpu_time': perf_stats.cpu_time,
            'memory_peak': perf_stats.memory_peak,
            'function_calls': perf_stats.function_calls
        }

        # Add resource usage
        data['resource_usage'] = {
            'memory_average': perf_stats.memory_average,
            'memory_peak': perf_stats.memory_peak
        }

        # Add detailed analysis
        if self.performance_profiler.completed_sessions:
            latest_session = self.performance_profiler.completed_sessions[-1]
            data['detailed_analysis'] = latest_session.summary or {}

        # Add recommendations
        data['recommendations'] = self._generate_recommendations(perf_stats)

        return data

def _generate_recommendations(self, stats: PerformanceStats) -> List[str]:
        """Generate performance recommendations."""
        recommendations = []

        if stats.memory_peak > 1024 * 1024 * 1024:  # > 1GB
            recommendations.append("High memory usage detected. Consider optimization.")

        if stats.slowest_operations:
            slowest = stats.slowest_operations[0]
            if slowest[1] > 1.0:  # > 1 second
                recommendations.append(f"Slow operation detected: {slowest[0]} ({slowest[1]:.2f}s)")

        if not recommendations:
            recommendations.append("Performance metrics within normal ranges.")

        return recommendations

    # Utility methods
def clear_data(self):
        """Clear all collected data."""
        self.data_aggregator._clear_cache()
        self.performance_profiler.clear_history()
        self.results_cache.clear()
        logger.info("Cleared all profiler data")

def get_summary(self) -> Dict[str, Any]:
        """Get overall summary."""
        return {
            'data_points': len(self.data_aggregator.data_points),
            'time_series': len(self.data_aggregator.time_series),
            'completed_sessions': len(self.performance_profiler.completed_sessions),
            'active_session': self.current_session,
            'reports_generated': len(self.report_builder.reports),
            'cached_results': len(self.results_cache)
        }