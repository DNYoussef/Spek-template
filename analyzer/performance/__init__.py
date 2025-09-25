# SPDX-License-Identifier: MIT

"""
Performance enhancement module.
"""

from .parallel_analyzer import ParallelAnalysisConfig, ParallelAnalysisResult, ParallelConnascenceAnalyzer

# Import missing performance modules with fallback
try:
    from .real_time_monitor import RealTimeMonitor
    REAL_TIME_MONITOR_AVAILABLE = True
except ImportError:
    RealTimeMonitor = None
    REAL_TIME_MONITOR_AVAILABLE = False

try:
    from .cache_performance_profiler import CachePerformanceProfiler
    CACHE_PROFILER_AVAILABLE = True
except ImportError:
    CachePerformanceProfiler = None
    CACHE_PROFILER_AVAILABLE = False

__all__ = [
    "ParallelConnascenceAnalyzer",
    "ParallelAnalysisConfig",
    "ParallelAnalysisResult",
    "RealTimeMonitor",
    "CachePerformanceProfiler"
]
