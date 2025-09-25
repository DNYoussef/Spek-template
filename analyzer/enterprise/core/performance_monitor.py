from src.constants.base import MAXIMUM_NESTED_DEPTH

Zero-overhead performance monitoring for enterprise features.
Ensures enterprise modules have no performance impact when disabled
and provides detailed metrics when enabled.

NASA Rule 4 Compliant: All methods under 60 lines.
NASA Rule MAXIMUM_NESTED_DEPTH Compliant: Comprehensive defensive assertions.
"""

import time
import logging
from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from contextlib import contextmanager
# from lib.shared.utilities.logging_setup import get_performance_logger

# Use specialized performance logging
logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetric:
    """Performance metric data point."""
    feature_name: str
    execution_time: float  # seconds
    memory_delta: int      # bytes
    timestamp: float
    success: bool
    error_message: Optional[str] = None

@dataclass
class PerformanceAlert:
    """Performance alert definition."""
    alert_type: str  # "execution_time" | "memory_usage" | "error_rate"
    threshold: float
    current_value: float
    feature_name: str
    timestamp: float
    message: str

class EnterprisePerformanceMonitor:
    """
    Monitor performance impact of enterprise features with zero overhead
    when monitoring is disabled.
    
    NASA Rule 4 Compliant: All methods under 60 lines.
    """
    
    def __init__(self, config_manager=None, enabled: bool = True):
        """Initialize performance monitor."""
        # NASA Rule 1 & 4: Input validation, avoid pointer-like references
        assert isinstance(enabled, bool), f"NASA Rule 4: enabled must be bool, got {type(enabled).__name__}"
        # NASA Rule 5: Input validation
        self.enabled = enabled
        # NASA Rule 1: Store config values, not manager reference
        self._perf_max_exec_time = 0.5  # Default
        self._perf_max_memory_mb = 50  # Default
        self.metrics: List[PerformanceMetric] = []
        self.alerts: List[PerformanceAlert] = []
        self._feature_stats = {}  # Aggregated statistics per feature

        # Load performance configuration
        if config_manager:
            self._load_config_values(config_manager)
        
        if enabled:
            logger.info("Enterprise performance monitoring enabled")
        else:
            logger.debug("Enterprise performance monitoring disabled - zero overhead")
    
    @contextmanager
    def measure_enterprise_impact(self, feature_name: str):
        """
        Measure performance impact of enterprise feature.
        
        Args:
            feature_name: Name of the enterprise feature
            
        Yields:
            Context manager for performance measurement
        """
        # Early return if monitoring disabled (zero overhead)
        if not self.enabled:
            yield
            return
        
        # NASA Rule 5: Input validation
        assert feature_name is not None, "feature_name cannot be None"
        assert isinstance(feature_name, str), "feature_name must be a string"
        
        start_time = time.perf_counter()
        start_memory = self._get_memory_usage()
        error_occurred = False
        error_message = None
        
        try:
            yield
            
        except Exception as e:
            error_occurred = True
            error_message = str(e)
            raise  # Re-raise the exception
            
        finally:
            # Record metrics even if error occurred
            if self.enabled:  # Double-check in case it was disabled during execution
                end_time = time.perf_counter()
                end_memory = self._get_memory_usage()
                
                execution_time = end_time - start_time
                memory_delta = end_memory - start_memory
                
                # Record metric
                metric = PerformanceMetric(
                    feature_name=feature_name,
                    execution_time=execution_time,
                    memory_delta=memory_delta,
                    timestamp=time.time(),
                    success=not error_occurred,
                    error_message=error_message
                )
                
                self._record_metric(metric)
                self._check_performance_alerts(metric)
    
    def get_performance_report(self) -> Dict[str, Any]:
        """
        Get comprehensive performance report.

        Returns:
            Performance report dictionary
        """
        # NASA Rule 4: State validation
        assert hasattr(self, 'enabled'), "NASA Rule 4: Object not properly initialized"

        if not self.enabled or not self.metrics:
            return {
                "monitoring_enabled": self.enabled,
                "total_measurements": 0,
                "features_measured": [],
                "overall_impact": "none",
                "recommendations": ["No performance data available"]
            }
        
        # Calculate aggregate statistics
        total_measurements = len(self.metrics)
        features_measured = list(self._feature_stats.keys())
        
        # Calculate overall performance impact
        avg_execution_time = sum(m.execution_time for m in self.metrics) / total_measurements
        total_memory_impact = sum(m.memory_delta for m in self.metrics)
        success_rate = sum(1 for m in self.metrics if m.success) / total_measurements
        
        # Determine impact level
        overall_impact = self._calculate_overall_impact(avg_execution_time, total_memory_impact)
        
        return {
            "monitoring_enabled": self.enabled,
            "total_measurements": total_measurements,
            "features_measured": features_measured,
            "overall_impact": overall_impact,
            "average_execution_time": avg_execution_time,
            "total_memory_impact_mb": total_memory_impact / (1024 * 1024),
            "success_rate": success_rate,
            "feature_statistics": self._feature_stats.copy(),
            "recent_alerts": self.alerts[-10:] if self.alerts else [],
            "recommendations": self._generate_recommendations()
        }
    
    def get_feature_metrics(self, feature_name: str) -> Dict[str, Any]:
        """
        Get performance metrics for a specific feature.

        Args:
            feature_name: Name of the enterprise feature

        Returns:
            Feature-specific performance metrics
        """
        # NASA Rule 4: Input validation
        assert feature_name is not None, "NASA Rule 4: feature_name cannot be None"
        assert isinstance(feature_name, str), f"NASA Rule 4: Expected str, got {type(feature_name).__name__}"
        # NASA Rule 5: Input validation
        assert feature_name is not None, "feature_name cannot be None"
        
        if not self.enabled or feature_name not in self._feature_stats:
            return {
                "feature_name": feature_name,
                "measurements": 0,
                "average_time": 0.0,
                "total_memory_mb": 0.0,
                "success_rate": 1.0,
                "status": "no_data"
            }
        
        stats = self._feature_stats[feature_name]
        return {
            "feature_name": feature_name,
            "measurements": stats['call_count'],
            "average_time": stats['total_time'] / stats['call_count'],
            "max_time": stats['max_time'],
            "min_time": stats['min_time'],
            "total_memory_mb": stats['total_memory'] / (1024 * 1024),
            "success_rate": stats['success_count'] / stats['call_count'],
            "error_count": stats['error_count'],
            "status": self._get_feature_status(stats)
        }
    
    def clear_metrics(self) -> None:
        """Clear all performance metrics (useful for testing)."""
        # NASA Rule 4: State validation
        assert hasattr(self, 'metrics'), "NASA Rule 4: metrics not initialized"

        self.metrics.clear()
        self.alerts.clear()
        self._feature_stats.clear()
        logger.debug("Performance metrics cleared")
    
    def set_enabled(self, enabled: bool) -> None:
        """Enable or disable performance monitoring."""
        # NASA Rule 4: Input validation
        assert isinstance(enabled, bool), f"NASA Rule 4: enabled must be bool, got {type(enabled).__name__}"

        old_status = self.enabled
        self.enabled = enabled
        
        if old_status != enabled:
            logger.info(f"Performance monitoring {'enabled' if enabled else 'disabled'}")
    
    def _record_metric(self, metric: PerformanceMetric) -> None:
        """Record a performance metric."""
        # NASA Rule 4: Input validation
        assert metric is not None, "NASA Rule 4: metric cannot be None"

        # Add to metrics list (keep last 1000 entries)
        self.metrics.append(metric)
        if len(self.metrics) > 1000:
            self.metrics = self.metrics[-1000:]
        
        # Update feature statistics
        if metric.feature_name not in self._feature_stats:
            self._feature_stats[metric.feature_name] = {
                'call_count': 0,
                'total_time': 0.0,
                'max_time': 0.0,
                'min_time': float('inf'),
                'total_memory': 0,
                'success_count': 0,
                'error_count': 0
            }
        
        stats = self._feature_stats[metric.feature_name]
        stats['call_count'] += 1
        stats['total_time'] += metric.execution_time
        stats['max_time'] = max(stats['max_time'], metric.execution_time)
        stats['min_time'] = min(stats['min_time'], metric.execution_time)
        stats['total_memory'] += metric.memory_delta
        
        if metric.success:
            stats['success_count'] += 1
        else:
            stats['error_count'] += 1
    
    def _check_performance_alerts(self, metric: PerformanceMetric) -> None:
        """Check if metric triggers any performance alerts."""
        # NASA Rule 1 & 4: Input validation, use local values
        assert metric is not None, "NASA Rule 4: metric cannot be None"

        # NASA Rule 1: Use stored values, not config reference chain
        max_time = self._perf_max_exec_time

        # Execution time alert
        if metric.execution_time > max_time:
            alert = PerformanceAlert(
                alert_type="execution_time",
                threshold=max_time,
                current_value=metric.execution_time,
                feature_name=metric.feature_name,
                timestamp=metric.timestamp,
                message=f"Feature {metric.feature_name} execution time {metric.execution_time:.3f}s exceeds threshold {max_time}s"
            )
            self.alerts.append(alert)
            logger.warning(alert.message)
        
        # NASA Rule 1: Memory usage alert with local value
        max_memory_mb = self._perf_max_memory_mb
        memory_mb = metric.memory_delta / (1024 * 1024)
        if memory_mb > max_memory_mb:
            alert = PerformanceAlert(
                alert_type="memory_usage",
                threshold=max_memory_mb,
                current_value=memory_mb,
                feature_name=metric.feature_name,
                timestamp=metric.timestamp,
                message=f"Feature {metric.feature_name} memory usage {memory_mb:.1f}MB exceeds threshold {max_memory_mb}MB"
            )
            self.alerts.append(alert)
            logger.warning(alert.message)
    
    def _get_memory_usage(self) -> int:
        """Get current memory usage in bytes."""
        # NASA Rule 4: State validation
        assert hasattr(self, 'enabled'), "NASA Rule 4: Monitor not initialized"

        try:
            import psutil
            return psutil.Process().memory_info().rss
        except ImportError:
            # Return 0 if psutil not available (graceful degradation)
            return 0
    
    def _load_config_values(self, config_manager) -> None:
        """Load performance configuration values (NASA Rule 1 compliant)."""
        # NASA Rule 1: Extract values, don't store reference
        try:
            enterprise_config = config_manager.get_enterprise_config()
            perf_config = enterprise_config.get('performance', {})
            alerts_config = perf_config.get('performance_alerts', {})

            self._perf_max_exec_time = alerts_config.get('max_execution_time', 0.5)
            self._perf_max_memory_mb = alerts_config.get('max_memory_increase', 50)
        except Exception:
            # Use defaults on error
            self._perf_max_exec_time = 0.5
            self._perf_max_memory_mb = 50
    
    def _calculate_overall_impact(self, avg_time: float, total_memory: int) -> str:
        """Calculate overall performance impact level."""
        # NASA Rule 4: Input validation
        assert avg_time >= 0, "NASA Rule 4: avg_time must be non-negative"
        assert isinstance(total_memory, int), f"NASA Rule 4: Expected int, got {type(total_memory).__name__}"

        memory_mb = total_memory / (1024 * 1024)
        
        if avg_time > 0.5 or memory_mb > 100:
            return "high"
        elif avg_time > 0.1 or memory_mb > 20:
            return "medium"
        elif avg_time > 0.01 or memory_mb > 5:
            return "low"
        else:
            return "none"
    
    def _get_feature_status(self, stats: Dict[str, Any]) -> str:
        """Get status classification for a feature."""
        # NASA Rule 4: Input validation
        assert stats is not None, "NASA Rule 4: stats cannot be None"
        assert stats['call_count'] > 0, "NASA Rule 4: call_count must be positive"

        success_rate = stats['success_count'] / stats['call_count']
        avg_time = stats['total_time'] / stats['call_count']
        
        if success_rate < 0.95:
            return "error_prone"
        elif avg_time > 0.5:
            return "slow"
        elif avg_time > 0.1:
            return "moderate"
        else:
            return "fast"
    
    def _generate_recommendations(self) -> List[str]:
        """Generate performance optimization recommendations."""
        recommendations = []
        
        if not self.metrics:
            recommendations.append("No performance data available")
            return recommendations
        
        # Analyze patterns and generate recommendations
        slow_features = [
            name for name, stats in self._feature_stats.items()
            if stats['total_time'] / stats['call_count'] > 0.1
        ]
        
        if slow_features:
            recommendations.append(f"Consider optimization for slow features: {', '.join(slow_features)}")
        
        high_memory_features = [
            name for name, stats in self._feature_stats.items()
            if stats['total_memory'] / (1024 * 1024) > 20  # >20MB
        ]
        
        if high_memory_features:
            recommendations.append(f"Monitor memory usage for: {', '.join(high_memory_features)}")
        
        if len(self.alerts) > 10:
            recommendations.append("High number of performance alerts - consider disabling some features")
        
        if not recommendations:
            recommendations.append("Performance is within acceptable parameters")
        
        return recommendations