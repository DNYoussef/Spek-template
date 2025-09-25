"""
Shared Performance Measurement Utilities

Consolidates duplicate performance measurement patterns from:
- phase3_performance_optimization_validator.py
- comprehensive_benchmark.py
- memory_security_analysis.py

Estimated LOC consolidation: 168 lines
Estimated CoA reduction: ~125 violations
"""

from typing import Optional, Callable, Any
import time

from contextlib import contextmanager
from dataclasses import dataclass
import tracemalloc

@dataclass
class PerformanceMetrics:
    """Container for performance measurement results"""
    execution_time_ms: float
    memory_usage_mb: float
    peak_memory_mb: Optional[float] = None
    cpu_time_ms: Optional[float] = None

class PerformanceMeasurement:
    """Context manager for measuring execution performance"""

def __init__(self, track_memory: bool = True):
        self.track_memory = track_memory
        self.start_time = None
        self.end_time = None
        self.start_memory = None
        self.end_memory = None
        self.peak_memory = None

def __enter__(self):
        """Start performance measurement"""
        self.start_time = time.perf_counter()

        if self.track_memory:
            tracemalloc.start()
            self.start_memory = tracemalloc.get_traced_memory()[0]

        return self

def __exit__(self, exc_type, exc_val, exc_tb):
        """Stop performance measurement"""
        self.end_time = time.perf_counter()

        if self.track_memory:
            current, peak = tracemalloc.get_traced_memory()
            self.end_memory = current
            self.peak_memory = peak
            tracemalloc.stop()

@property
def execution_time_ms(self) -> float:
        """Get execution time in milliseconds"""
        if self.start_time is None or self.end_time is None:
            return 0.0
        return (self.end_time - self.start_time) * 1000

@property
def memory_usage_mb(self) -> float:
        """Get memory usage in megabytes"""
        if not self.track_memory or self.start_memory is None or self.end_memory is None:
            return 0.0
        return (self.end_memory - self.start_memory) / (1024 * 1024)

@property
def peak_memory_mb(self) -> Optional[float]:
        """Get peak memory usage in megabytes"""
        if not self.track_memory or self.peak_memory is None:
            return None
        return self.peak_memory / (1024 * 1024)

def get_metrics(self) -> PerformanceMetrics:
        """Get all performance metrics"""
        return PerformanceMetrics(
            execution_time_ms=self.execution_time_ms,
            memory_usage_mb=self.memory_usage_mb,
            peak_memory_mb=self.peak_memory_mb
        )

@contextmanager
def measure_performance(track_memory: bool = True):
    """
    Context manager for measuring performance

    Usage:
        with measure_performance() as perf:
            # code to measure
        metrics = perf.get_metrics()
    """
    measurement = PerformanceMeasurement(track_memory=track_memory)
    with measurement:
        yield measurement

def benchmark_function(func: Callable, *args, iterations: int = 10, **kwargs) -> PerformanceMetrics:
    """
    Benchmark a function over multiple iterations

    Args:
        func: Function to benchmark
        *args: Positional arguments for function
        iterations: Number of times to run function
        **kwargs: Keyword arguments for function

    Returns:
        Average performance metrics over all iterations
    """
    total_time = 0.0
    total_memory = 0.0
    peak_memory_max = 0.0

    for _ in range(iterations):
        with measure_performance() as perf:
            func(*args, **kwargs)

        metrics = perf.get_metrics()
        total_time += metrics.execution_time_ms
        total_memory += metrics.memory_usage_mb
        if metrics.peak_memory_mb:
            peak_memory_max = max(peak_memory_max, metrics.peak_memory_mb)

    return PerformanceMetrics(
        execution_time_ms=total_time / iterations,
        memory_usage_mb=total_memory / iterations,
        peak_memory_mb=peak_memory_max if peak_memory_max > 0 else None
    )