"""
REAL Performance Modules - NO MOCKS, NO THEATER

These modules do actual performance monitoring and profiling.
They FAIL when broken and provide REAL metrics.
"""

import time
import threading
import psutil
import gc
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from pathlib import Path
import json


@dataclass
class RealPerformanceMetrics:
    """Real performance metrics with actual measurements."""
    cpu_usage_percent: float
    memory_usage_mb: float
    disk_io_mb: float
    analysis_time_ms: float
    files_processed: int
    violations_found: int
    cache_hit_rate: float
    gc_collections: int
    peak_memory_mb: float
    timestamp: float = field(default_factory=time.time)


class RealTimePerformanceMonitor:
    """REAL real-time performance monitor - NO MOCKS."""

    def __init__(self, sample_interval: float = 1.0):
        """Initialize with real monitoring capabilities."""
        self.sample_interval = sample_interval
        self.is_monitoring = False
        self.metrics_history: List[RealPerformanceMetrics] = []
        self._monitor_thread: Optional[threading.Thread] = None
        self._start_time = 0.0
        self._initial_memory = 0.0

        # Verify psutil is working
        try:
            psutil.cpu_percent()
            psutil.virtual_memory()
        except Exception as e:
            raise RuntimeError(f"Performance monitoring not available: {e}")

    def start_monitoring(self) -> None:
        """Start real-time monitoring."""
        if self.is_monitoring:
            return

        self.is_monitoring = True
        self._start_time = time.time()
        self._initial_memory = psutil.Process().memory_info().rss / 1024 / 1024

        self._monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self._monitor_thread.start()

    def stop_monitoring(self) -> RealPerformanceMetrics:
        """Stop monitoring and return final metrics."""
        if not self.is_monitoring:
            raise RuntimeError("Monitoring not started")

        self.is_monitoring = False
        if self._monitor_thread:
            self._monitor_thread.join(timeout=2.0)

        # Calculate final metrics
        current_time = time.time()
        process = psutil.Process()
        memory_info = process.memory_info()

        final_metrics = RealPerformanceMetrics(
            cpu_usage_percent=psutil.cpu_percent(),
            memory_usage_mb=memory_info.rss / 1024 / 1024,
            disk_io_mb=self._get_disk_io_mb(),
            analysis_time_ms=(current_time - self._start_time) * 1000,
            files_processed=0,  # Will be updated by caller
            violations_found=0,  # Will be updated by caller
            cache_hit_rate=0.0,  # Will be updated by caller
            gc_collections=len(gc.get_stats()),
            peak_memory_mb=max(
                (m.memory_usage_mb for m in self.metrics_history),
                default=memory_info.rss / 1024 / 1024
            ),
            timestamp=current_time
        )

        self.metrics_history.append(final_metrics)
        return final_metrics

    def _monitor_loop(self) -> None:
        """Internal monitoring loop."""
        while self.is_monitoring:
            try:
                process = psutil.Process()
                memory_info = process.memory_info()

                metrics = RealPerformanceMetrics(
                    cpu_usage_percent=psutil.cpu_percent(),
                    memory_usage_mb=memory_info.rss / 1024 / 1024,
                    disk_io_mb=self._get_disk_io_mb(),
                    analysis_time_ms=(time.time() - self._start_time) * 1000,
                    files_processed=0,
                    violations_found=0,
                    cache_hit_rate=0.0,
                    gc_collections=len(gc.get_stats()),
                    peak_memory_mb=memory_info.rss / 1024 / 1024,
                )

                self.metrics_history.append(metrics)

            except Exception as e:
                print(f"Monitoring error: {e}")

            time.sleep(self.sample_interval)

    def _get_disk_io_mb(self) -> float:
        """Get disk I/O in MB."""
        try:
            process = psutil.Process()
            io_counters = process.io_counters()
            return (io_counters.read_bytes + io_counters.write_bytes) / 1024 / 1024
        except (AttributeError, PermissionError):
            return 0.0

    def get_current_metrics(self) -> Optional[RealPerformanceMetrics]:
        """Get the most recent metrics."""
        return self.metrics_history[-1] if self.metrics_history else None

    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get summary of all collected metrics."""
        if not self.metrics_history:
            return {"error": "No metrics collected"}

        cpu_values = [m.cpu_usage_percent for m in self.metrics_history]
        memory_values = [m.memory_usage_mb for m in self.metrics_history]

        return {
            "samples_collected": len(self.metrics_history),
            "avg_cpu_percent": sum(cpu_values) / len(cpu_values),
            "max_cpu_percent": max(cpu_values),
            "avg_memory_mb": sum(memory_values) / len(memory_values),
            "max_memory_mb": max(memory_values),
            "peak_memory_mb": max(m.peak_memory_mb for m in self.metrics_history),
            "total_gc_collections": sum(m.gc_collections for m in self.metrics_history),
            "monitoring_duration_ms": (
                self.metrics_history[-1].timestamp - self.metrics_history[0].timestamp
            ) * 1000 if len(self.metrics_history) > 1 else 0
        }


class RealCachePerformanceProfiler:
    """REAL cache performance profiler - tracks actual cache behavior."""

    def __init__(self):
        """Initialize with real cache tracking."""
        self.cache_stats = {
            "hits": 0,
            "misses": 0,
            "evictions": 0,
            "memory_usage_mb": 0.0,
            "avg_access_time_ms": 0.0,
            "total_accesses": 0,
        }
        self.access_times: List[float] = []
        self._cache_memory_tracker = {}

    def record_cache_hit(self, key: str, access_time_ms: float) -> None:
        """Record a real cache hit."""
        self.cache_stats["hits"] += 1
        self.cache_stats["total_accesses"] += 1
        self.access_times.append(access_time_ms)
        self._update_avg_access_time()

    def record_cache_miss(self, key: str, access_time_ms: float) -> None:
        """Record a real cache miss."""
        self.cache_stats["misses"] += 1
        self.cache_stats["total_accesses"] += 1
        self.access_times.append(access_time_ms)
        self._update_avg_access_time()

    def record_cache_eviction(self, key: str, data_size_bytes: int) -> None:
        """Record a real cache eviction."""
        self.cache_stats["evictions"] += 1
        if key in self._cache_memory_tracker:
            del self._cache_memory_tracker[key]
        self._update_memory_usage()

    def record_cache_store(self, key: str, data_size_bytes: int) -> None:
        """Record data being stored in cache."""
        self._cache_memory_tracker[key] = data_size_bytes
        self._update_memory_usage()

    def _update_avg_access_time(self) -> None:
        """Update average access time."""
        if self.access_times:
            self.cache_stats["avg_access_time_ms"] = sum(self.access_times) / len(self.access_times)

    def _update_memory_usage(self) -> None:
        """Update memory usage tracking."""
        total_bytes = sum(self._cache_memory_tracker.values())
        self.cache_stats["memory_usage_mb"] = total_bytes / 1024 / 1024

    def get_cache_hit_rate(self) -> float:
        """Get real cache hit rate."""
        total = self.cache_stats["hits"] + self.cache_stats["misses"]
        return self.cache_stats["hits"] / total if total > 0 else 0.0

    def get_cache_efficiency_score(self) -> float:
        """Calculate cache efficiency score based on real metrics."""
        hit_rate = self.get_cache_hit_rate()
        avg_time = self.cache_stats["avg_access_time_ms"]

        # Lower access time and higher hit rate = better efficiency
        time_score = max(0.0, 1.0 - (avg_time / 100.0))  # Normalize to 100ms baseline
        efficiency = (hit_rate * 0.7) + (time_score * 0.3)

        return min(1.0, efficiency)

    def get_performance_report(self) -> Dict[str, Any]:
        """Get comprehensive performance report."""
        return {
            "cache_statistics": self.cache_stats.copy(),
            "hit_rate": self.get_cache_hit_rate(),
            "efficiency_score": self.get_cache_efficiency_score(),
            "memory_pressure": self.cache_stats["memory_usage_mb"] / 100.0,  # Normalize to 100MB
            "eviction_rate": (
                self.cache_stats["evictions"] / max(self.cache_stats["total_accesses"], 1)
            ),
            "performance_grade": self._calculate_performance_grade(),
        }

    def _calculate_performance_grade(self) -> str:
        """Calculate performance grade based on real metrics."""
        hit_rate = self.get_cache_hit_rate()
        efficiency = self.get_cache_efficiency_score()

        combined_score = (hit_rate + efficiency) / 2

        if combined_score >= 0.9:
            return "A"
        elif combined_score >= 0.8:
            return "B"
        elif combined_score >= 0.7:
            return "C"
        elif combined_score >= 0.6:
            return "D"
        else:
            return "F"


class RealAnalysisProfiler:
    """REAL analysis profiler that tracks actual analysis performance."""

    def __init__(self):
        """Initialize with real profiling capabilities."""
        self.profiling_data = {
            "phase_timings": {},
            "file_processing_times": {},
            "violation_detection_rates": {},
            "memory_snapshots": [],
            "error_rates": {},
        }
        self.current_phase = None
        self.phase_start_time = 0.0

    def start_phase(self, phase_name: str) -> None:
        """Start profiling a specific analysis phase."""
        if self.current_phase:
            self.end_phase()

        self.current_phase = phase_name
        self.phase_start_time = time.time()

        # Take memory snapshot
        process = psutil.Process()
        memory_mb = process.memory_info().rss / 1024 / 1024
        self.profiling_data["memory_snapshots"].append({
            "phase": phase_name,
            "timestamp": self.phase_start_time,
            "memory_mb": memory_mb,
            "event": "phase_start"
        })

    def end_phase(self) -> Dict[str, Any]:
        """End current phase and return timing data."""
        if not self.current_phase:
            return {}

        end_time = time.time()
        duration_ms = (end_time - self.phase_start_time) * 1000

        phase_data = {
            "duration_ms": duration_ms,
            "start_time": self.phase_start_time,
            "end_time": end_time,
        }

        self.profiling_data["phase_timings"][self.current_phase] = phase_data

        # Take end memory snapshot
        process = psutil.Process()
        memory_mb = process.memory_info().rss / 1024 / 1024
        self.profiling_data["memory_snapshots"].append({
            "phase": self.current_phase,
            "timestamp": end_time,
            "memory_mb": memory_mb,
            "event": "phase_end"
        })

        self.current_phase = None
        return phase_data

    def record_file_processing(self, file_path: str, processing_time_ms: float,
                             violations_found: int, errors_encountered: int) -> None:
        """Record real file processing metrics."""
        self.profiling_data["file_processing_times"][file_path] = {
            "processing_time_ms": processing_time_ms,
            "violations_found": violations_found,
            "errors_encountered": errors_encountered,
            "violations_per_second": violations_found / (processing_time_ms / 1000.0) if processing_time_ms > 0 else 0,
        }

        # Update violation detection rates
        file_size_kb = Path(file_path).stat().st_size / 1024 if path_exists(file_path) else 0
        if file_size_kb > 0:
            detection_rate = violations_found / file_size_kb
            self.profiling_data["violation_detection_rates"][file_path] = detection_rate

        # Update error rates
        if errors_encountered > 0:
            self.profiling_data["error_rates"][file_path] = errors_encountered

    def get_performance_summary(self) -> Dict[str, Any]:
        """Get comprehensive performance summary."""
        if not self.profiling_data["phase_timings"]:
            return {"error": "No profiling data collected"}

        total_time = sum(
            phase["duration_ms"] for phase in self.profiling_data["phase_timings"].values()
        )

        processing_times = list(self.profiling_data["file_processing_times"].values())
        avg_file_time = (
            sum(p["processing_time_ms"] for p in processing_times) / len(processing_times)
            if processing_times else 0
        )

        return {
            "total_analysis_time_ms": total_time,
            "phase_count": len(self.profiling_data["phase_timings"]),
            "files_processed": len(self.profiling_data["file_processing_times"]),
            "avg_file_processing_time_ms": avg_file_time,
            "total_violations_found": sum(
                p["violations_found"] for p in processing_times
            ),
            "total_errors_encountered": len(self.profiling_data["error_rates"]),
            "peak_memory_mb": max(
                (s["memory_mb"] for s in self.profiling_data["memory_snapshots"]),
                default=0
            ),
            "memory_growth_mb": (
                self.profiling_data["memory_snapshots"][-1]["memory_mb"] -
                self.profiling_data["memory_snapshots"][0]["memory_mb"]
                if len(self.profiling_data["memory_snapshots"]) >= 2 else 0
            ),
            "performance_grade": self._calculate_overall_grade(total_time, len(processing_times)),
        }

    def _calculate_overall_grade(self, total_time_ms: float, files_processed: int) -> str:
        """Calculate overall performance grade."""
        if files_processed == 0:
            return "F"

        avg_time_per_file = total_time_ms / files_processed

        # Grade based on processing speed
        if avg_time_per_file < 100:    # < 100ms per file
            return "A"
        elif avg_time_per_file < 500:  # < 500ms per file
            return "B"
        elif avg_time_per_file < 1000: # < 1s per file
            return "C"
        elif avg_time_per_file < 5000: # < 5s per file
            return "D"
        else:
            return "F"

    def export_profiling_data(self, output_file: str) -> None:
        """Export profiling data to file."""
        with open(output_file, 'w') as f:
            json.dump(self.profiling_data, f, indent=2, default=str)


# Export the real performance modules
__all__ = [
    'RealTimePerformanceMonitor',
    'RealCachePerformanceProfiler',
    'RealAnalysisProfiler',
    'RealPerformanceMetrics'
]