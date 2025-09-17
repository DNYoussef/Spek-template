# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Connascence Safety Analyzer Contributors
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.

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
