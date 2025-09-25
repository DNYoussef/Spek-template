from src.constants.base import DAYS_RETENTION_PERIOD, MAXIMUM_FILE_LENGTH_LINES, MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_NESTED_DEPTH

Advanced thread contention analysis for detector pool optimization.
Provides real measurements using profiling tools to identify and resolve
thread contention issues in concurrent detector operations.

Features:
- Real-time lock contention measurement
- Thread wait time analysis
- Synchronization bottleneck detection
- Concurrent load testing capabilities
- Performance optimization recommendations
"""

import gc
import os
import threading
import time
import weakref
from collections import defaultdict, deque
from contextlib import contextmanager
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set, Tuple
import logging
logger = logging.getLogger(__name__)

@dataclass
class LockContentionStats:
    """Statistics for lock contention analysis."""
    lock_name: str
    total_acquisitions: int = 0
    total_wait_time_ms: float = 0.0
    max_wait_time_ms: float = 0.0
    average_wait_time_ms: float = 0.0
    contention_events: int = 0
    threads_blocked: Set[int] = field(default_factory=set)
    acquisition_success_rate: float = 100.0

@dataclass
class ThreadContentionSnapshot:
    """Snapshot of thread contention at a point in time."""
    timestamp: float
    active_threads: int
    waiting_threads: int
    blocked_threads: int
    lock_contentions: Dict[str, LockContentionStats]
    cpu_usage_percent: float
    memory_usage_mb: float

class ProfilingLock:
    """
    Instrumented lock wrapper for contention measurement.
    
    Provides detailed metrics on lock acquisition timing, wait times,
    and thread contention patterns for performance optimization.
    """
    
    def __init__(self, name: str, lock_type: str = "RLock"):
        """
        Initialize profiling lock.
        
        Args:
            name: Human-readable lock identifier
            lock_type: Type of lock ("Lock", "RLock", "Condition")
        """
        assert name, "Lock name cannot be empty"
        assert lock_type in ["Lock", "RLock", "Condition"], f"Unsupported lock type: {lock_type}"
        
        self.name = name
        self.lock_type = lock_type
        
        # Create the actual lock
        if lock_type == "RLock":
            self._lock = threading.RLock()
        elif lock_type == "Condition":
            self._lock = threading.Condition()
        else:
            self._lock = threading.Lock()
        
        # Profiling data
        self._stats = LockContentionStats(lock_name=name)
        self._acquisition_times: deque = deque(maxlen=1000)  # Bounded per NASA Rule 7
        self._waiting_threads: Set[int] = set()
        self._profiling_lock = threading.Lock()  # Protects profiling data
        
    def acquire(self, blocking: bool = True, timeout: float = -1) -> bool:
        """
        Acquire lock with profiling.
        
        Args:
            blocking: Whether to block if lock unavailable
            timeout: Timeout in seconds (-1 for no timeout)
            
        Returns:
            True if lock acquired successfully
        """
        thread_id = threading.get_ident()
        start_time = time.time()
        
        # Track waiting thread
        with self._profiling_lock:
            self._waiting_threads.add(thread_id)
            if len(self._waiting_threads) > 1:
                self._stats.contention_events += 1
        
        try:
            # Attempt lock acquisition
            if timeout == -1:
                acquired = self._lock.acquire(blocking)
            else:
                acquired = self._lock.acquire(blocking, timeout)
            
            acquisition_time = time.time() - start_time
            
            # Update statistics
            with self._profiling_lock:
                self._waiting_threads.discard(thread_id)
                self._stats.total_acquisitions += 1
                
                if acquired:
                    # Record successful acquisition
                    wait_time_ms = acquisition_time * 1000
                    self._stats.total_wait_time_ms += wait_time_ms
                    self._stats.max_wait_time_ms = max(self._stats.max_wait_time_ms, wait_time_ms)
                    
                    # Update average
                    self._stats.average_wait_time_ms = (
                        self._stats.total_wait_time_ms / self._stats.total_acquisitions
                    )
                    
                    # Track acquisition time
                    self._acquisition_times.append(acquisition_time)
                    
                    # Update success rate
                    self._stats.acquisition_success_rate = (
                        (self._stats.total_acquisitions - self._stats.contention_events) / 
                        self._stats.total_acquisitions * 100.0
                    )
                else:
                    # Failed acquisition
                    self._stats.threads_blocked.add(thread_id)
            
            return acquired
            
        except Exception as e:
            logger.error(f"Lock acquisition failed for {self.name}: {e}")
            with self._profiling_lock:
                self._waiting_threads.discard(thread_id)
            return False
    
    def release(self) -> None:
        """Release lock."""
        try:
            self._lock.release()
        except Exception as e:
            logger.error(f"Lock release failed for {self.name}: {e}")
    
    def __enter__(self):
        """Context manager entry."""
        success = self.acquire()
        if not success:
            raise RuntimeError(f"Failed to acquire lock {self.name}")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.release()
    
    def get_contention_stats(self) -> LockContentionStats:
        """Get current contention statistics."""
        with self._profiling_lock:
            return LockContentionStats(
                lock_name=self._stats.lock_name,
                total_acquisitions=self._stats.total_acquisitions,
                total_wait_time_ms=self._stats.total_wait_time_ms,
                max_wait_time_ms=self._stats.max_wait_time_ms,
                average_wait_time_ms=self._stats.average_wait_time_ms,
                contention_events=self._stats.contention_events,
                threads_blocked=self._stats.threads_blocked.copy(),
                acquisition_success_rate=self._stats.acquisition_success_rate
            )
    
    def reset_stats(self) -> None:
        """Reset profiling statistics."""
        with self._profiling_lock:
            self._stats = LockContentionStats(lock_name=self.name)
            self._acquisition_times.clear()
            self._waiting_threads.clear()

class ThreadContentionProfiler:
    """
    Comprehensive thread contention profiler for detector pool optimization.
    
    NASA Rule DAYS_RETENTION_PERIOD Compliant: Bounded resource usage with automatic cleanup.
    Provides real measurements and actionable optimization recommendations.
    """
    
    def __init__(self, 
                max_snapshots: int = 1000,
                profiling_interval: float = 0.5):
        """
        Initialize thread contention profiler.
        
        Args:
            max_snapshots: Maximum snapshots to retain (NASA Rule 7)
            profiling_interval: Profiling interval in seconds
        """
        assert 100 <= max_snapshots <= 10000, "max_snapshots must be 100-10000"
        assert 0.1 <= profiling_interval <= 5.0, "profiling_interval must be 0.1-5.0 seconds"
        
        self.max_snapshots = max_snapshots
        self.profiling_interval = profiling_interval
        
        # Thread-safe profiling data
        self._lock = threading.RLock()
        self._snapshots: deque = deque(maxlen=max_snapshots)
        self._instrumented_locks: Dict[str, ProfilingLock] = {}
        self._profiling_active = False
        self._profile_thread: Optional[threading.Thread] = None
        
        # Process monitoring
        self._process = psutil.Process(os.getpid())
        
        # Performance baseline
        self._baseline_snapshot: Optional[ThreadContentionSnapshot] = None
        self._baseline_established = False
        
        logger.info(f"ThreadContentionProfiler initialized with {max_snapshots} snapshot history")
    
    def create_instrumented_lock(self, name: str, lock_type: str = "RLock") -> ProfilingLock:
        """
        Create instrumented lock for contention profiling.
        
        Args:
            name: Lock identifier
            lock_type: Type of lock to create
            
        Returns:
            Instrumented profiling lock
        """
        assert name not in self._instrumented_locks, f"Lock {name} already exists"
        
        with self._lock:
            profiling_lock = ProfilingLock(name, lock_type)
            self._instrumented_locks[name] = profiling_lock
            
        logger.debug(f"Created instrumented lock: {name} ({lock_type})")
        return profiling_lock
    
    def start_profiling(self) -> None:
        """Start background thread contention profiling."""
        with self._lock:
            if self._profiling_active:
                logger.warning("Thread contention profiling already active")
                return
            
            self._profiling_active = True
            self._profile_thread = threading.Thread(
                target=self._profiling_loop,
                name="ThreadContentionProfiler",
                daemon=True
            )
            self._profile_thread.start()
            
        logger.info("Thread contention profiling started")
    
    def stop_profiling(self) -> None:
        """Stop background profiling."""
        with self._lock:
            if not self._profiling_active:
                return
            
            self._profiling_active = False
            if self._profile_thread and self._profile_thread.is_alive():
                self._profile_thread.join(timeout=MAXIMUM_NESTED_DEPTH)
        
        logger.info("Thread contention profiling stopped")
    
    def _profiling_loop(self) -> None:
        """Background profiling loop."""
        logger.info("Thread contention profiling loop started")
        
        while self._profiling_active:
            try:
                self._take_snapshot()
                time.sleep(self.profiling_interval)
            except Exception as e:
                logger.error(f"Profiling error: {e}")
                time.sleep(self.profiling_interval * 2)  # Back off on errors
        
        logger.info("Thread contention profiling loop ended")
    
    def _take_snapshot(self) -> None:
        """Take thread contention snapshot."""
        try:
            # Get thread information
            all_threads = threading.enumerate()
            active_threads = len([t for t in all_threads if t.is_alive()])
            
            # Count waiting/blocked threads (approximation)
            waiting_threads = sum(
                len(lock.get_contention_stats().threads_blocked) 
                for lock in self._instrumented_locks.values()
            )
            blocked_threads = sum(
                lock.get_contention_stats().contention_events 
                for lock in self._instrumented_locks.values()
            )
            
            # Get system metrics
            cpu_percent = self._process.cpu_percent()
            memory_info = self._process.memory_info()
            memory_mb = memory_info.rss / (1024 * 1024)
            
            # Collect lock contention statistics
            lock_contentions = {}
            with self._lock:
                for lock_name, profiling_lock in self._instrumented_locks.items():
                    lock_contentions[lock_name] = profiling_lock.get_contention_stats()
            
            # Create snapshot
            snapshot = ThreadContentionSnapshot(
                timestamp=time.time(),
                active_threads=active_threads,
                waiting_threads=waiting_threads,
                blocked_threads=blocked_threads,
                lock_contentions=lock_contentions,
                cpu_usage_percent=cpu_percent,
                memory_usage_mb=memory_mb
            )
            
            with self._lock:
                self._snapshots.append(snapshot)
                
                # Establish baseline from early samples
                if not self._baseline_established and len(self._snapshots) >= 10:
                    self._baseline_snapshot = self._snapshots[4]  # Use 5th sample as baseline
                    self._baseline_established = True
                    logger.info("Baseline thread contention metrics established")
        
        except Exception as e:
            logger.error(f"Failed to take contention snapshot: {e}")
    
    def get_contention_analysis(self) -> Dict[str, Any]:
        """
        Generate comprehensive thread contention analysis.
        
        Returns:
            Detailed analysis with measurements and recommendations
        """
        with self._lock:
            if not self._snapshots:
                return {"error": "No profiling data available"}
            
            recent_snapshots = list(self._snapshots)[-20:]  # Last 20 snapshots
            latest_snapshot = recent_snapshots[-1]
            
            analysis = {
                "profiling_summary": {
                    "snapshots_collected": len(self._snapshots),
                    "profiling_duration_minutes": (
                        (latest_snapshot.timestamp - self._snapshots[0].timestamp) / 60
                        if len(self._snapshots) > 1 else 0
                    ),
                    "instrumented_locks": len(self._instrumented_locks),
                    "baseline_established": self._baseline_established
                },
                "current_contention": {
                    "active_threads": latest_snapshot.active_threads,
                    "waiting_threads": latest_snapshot.waiting_threads,
                    "blocked_threads": latest_snapshot.blocked_threads,
                    "cpu_usage_percent": latest_snapshot.cpu_usage_percent,
                    "memory_usage_mb": latest_snapshot.memory_usage_mb
                },
                "lock_analysis": {},
                "trend_analysis": self._analyze_trends(recent_snapshots),
                "optimization_recommendations": []
            }
            
            # Analyze each instrumented lock
            for lock_name, contention_stats in latest_snapshot.lock_contentions.items():
                lock_analysis = {
                    "total_acquisitions": contention_stats.total_acquisitions,
                    "average_wait_time_ms": contention_stats.average_wait_time_ms,
                    "max_wait_time_ms": contention_stats.max_wait_time_ms,
                    "contention_events": contention_stats.contention_events,
                    "success_rate_percent": contention_stats.acquisition_success_rate,
                    "threads_affected": len(contention_stats.threads_blocked),
                    "contention_severity": self._assess_contention_severity(contention_stats)
                }
                
                analysis["lock_analysis"][lock_name] = lock_analysis
            
            # Generate optimization recommendations
            analysis["optimization_recommendations"] = self._generate_optimization_recommendations(
                latest_snapshot, recent_snapshots
            )
            
            return analysis
    
    def _analyze_trends(self, snapshots: List[ThreadContentionSnapshot]) -> Dict[str, Any]:
        """Analyze contention trends over time."""
        if len(snapshots) < 2:
            return {"insufficient_data": True}
        
        # Calculate trends
        wait_times = []
        contention_events = []
        cpu_usage = []
        
        for snapshot in snapshots:
            total_wait_time = sum(
                stats.average_wait_time_ms 
                for stats in snapshot.lock_contentions.values()
            )
            total_contentions = sum(
                stats.contention_events 
                for stats in snapshot.lock_contentions.values()
            )
            
            wait_times.append(total_wait_time)
            contention_events.append(total_contentions)
            cpu_usage.append(snapshot.cpu_usage_percent)
        
        return {
            "wait_time_trend": {
                "current": wait_times[-1],
                "average": sum(wait_times) / len(wait_times),
                "trend": "increasing" if wait_times[-1] > wait_times[0] else "decreasing"
            },
            "contention_trend": {
                "current": contention_events[-1],
                "average": sum(contention_events) / len(contention_events),
                "trend": "increasing" if contention_events[-1] > contention_events[0] else "decreasing"
            },
            "cpu_correlation": {
                "average_cpu": sum(cpu_usage) / len(cpu_usage),
                "high_contention_cpu": max(cpu_usage) if contention_events else 0
            }
        }
    
    def _assess_contention_severity(self, stats: LockContentionStats) -> str:
        """Assess contention severity level."""
        if stats.total_acquisitions == 0:
            return "none"
        
        contention_rate = stats.contention_events / stats.total_acquisitions
        
        if contention_rate > 0.3:
            return "critical"
        elif contention_rate > 0.1:
            return "high"
        elif contention_rate > 0.05:
            return "moderate"
        else:
            return "low"
    
    def _generate_optimization_recommendations(self, 
                                            latest_snapshot: ThreadContentionSnapshot,
                                            recent_snapshots: List[ThreadContentionSnapshot]) -> List[str]:
        """Generate specific optimization recommendations."""
        recommendations = []
        
        # Analyze lock contention
        for lock_name, stats in latest_snapshot.lock_contentions.items():
            severity = self._assess_contention_severity(stats)
            
            if severity == "critical":
                recommendations.append(
                    f"CRITICAL: Lock '{lock_name}' has {stats.contention_events} contention events "
                    f"({(stats.contention_events/stats.total_acquisitions*100):.1f}% contention rate). "
                    "Consider lock-free algorithms or finer-grained locking."
                )
            elif severity == "high":
                recommendations.append(
                    f"HIGH: Lock '{lock_name}' shows high contention with "
                    f"{stats.average_wait_time_ms:.1f}ms average wait time. "
                    "Consider reducing lock scope or using atomic operations."
                )
            elif severity == "moderate" and stats.average_wait_time_ms > 10.0:
                recommendations.append(
                    f"MODERATE: Lock '{lock_name}' has {stats.average_wait_time_ms:.1f}ms average wait time. "
                    "Consider optimizing critical section duration."
                )
        
        # CPU correlation analysis
        high_cpu_snapshots = [s for s in recent_snapshots if s.cpu_usage_percent > 80]
        if high_cpu_snapshots:
            avg_contentions_high_cpu = sum(
                sum(s.lock_contentions[lock].contention_events for lock in s.lock_contentions)
                for s in high_cpu_snapshots
            ) / len(high_cpu_snapshots)
            
            recommendations.append(
                f"CPU-Contention Correlation: High CPU usage correlates with "
                f"{avg_contentions_high_cpu:.1f} average contentions. "
                "Consider thread pool optimization or work distribution."
            )
        
        # Thread scaling recommendations
        if latest_snapshot.active_threads > 8:
            recommendations.append(
                f"Thread Scaling: {latest_snapshot.active_threads} active threads detected. "
                "Consider limiting thread pool size to match CPU cores."
            )
        
        # Memory pressure correlation
        if latest_snapshot.memory_usage_mb > 500:
            recommendations.append(
                f"Memory Pressure: {latest_snapshot.memory_usage_mb:.1f}MB memory usage may "
                "contribute to contention. Consider memory optimization."
            )
        
        return recommendations
    
    def run_concurrent_load_test(self, 
                                thread_count: int = 8, 
                                operations_per_thread: int = 1000,
                                test_duration_seconds: float = 30.0) -> Dict[str, Any]:
        """
        Run concurrent load test to measure contention under realistic conditions.
        
        Args:
            thread_count: Number of concurrent threads
            operations_per_thread: Operations per thread
            test_duration_seconds: Test duration
            
        Returns:
            Load test results with contention measurements
        """
        assert 1 <= thread_count <= 16, "thread_count must be 1-16"
        assert 100 <= operations_per_thread <= 10000, "operations_per_thread must be MAXIMUM_FUNCTION_LENGTH_LINES-10000"
        assert 5.0 <= test_duration_seconds <= 300.0, "test_duration must be MAXIMUM_NESTED_DEPTH-300 seconds"
        
        logger.info(f"Starting concurrent load test: {thread_count} threads, "
                    f"{operations_per_thread} ops/thread, {test_duration_seconds}s duration")
        
        # Create test lock if not exists
        test_lock_name = "load_test_lock"
        if test_lock_name not in self._instrumented_locks:
            self.create_instrumented_lock(test_lock_name, "RLock")
        
        test_lock = self._instrumented_locks[test_lock_name]
        test_lock.reset_stats()
        
        # Test state
        test_results = {
            "operations_completed": 0,
            "errors_encountered": 0,
            "start_time": time.time(),
            "thread_completion_times": [],
        }
        results_lock = threading.Lock()
        
        def load_test_worker(thread_id: int) -> None:
            """Load test worker function."""
            thread_start = time.time()
            operations_completed = 0
            errors = 0
            
            try:
                for i in range(operations_per_thread):
                    # Stop if test duration exceeded
                    if time.time() - test_results["start_time"] > test_duration_seconds:
                        break
                    
                    try:
                        # Simulate detector acquisition/release pattern
                        with test_lock:
                            # Simulate work inside critical section
                            time.sleep(0.001)  # 1ms work simulation
                            operations_completed += 1
                    except Exception as e:
                        errors += 1
                        logger.warning(f"Load test thread {thread_id} error: {e}")
            
            except Exception as e:
                logger.error(f"Load test thread {thread_id} failed: {e}")
                errors += 1
            
            finally:
                thread_end = time.time()
                with results_lock:
                    test_results["operations_completed"] += operations_completed
                    test_results["errors_encountered"] += errors
                    test_results["thread_completion_times"].append(thread_end - thread_start)
        
        # Start profiling if not already active
        was_profiling = self._profiling_active
        if not was_profiling:
            self.start_profiling()
        
        # Capture baseline before test
        baseline_stats = test_lock.get_contention_stats()
        
        # Start load test threads
        test_threads = []
        for i in range(thread_count):
            thread = threading.Thread(target=load_test_worker, args=(i,), name=f"LoadTest-{i}")
            test_threads.append(thread)
            thread.start()
        
        # Wait for completion or timeout
        test_start = time.time()
        for thread in test_threads:
            remaining_time = max(0, test_duration_seconds - (time.time() - test_start))
            thread.join(timeout=remaining_time)
        
        test_end = time.time()
        actual_duration = test_end - test_results["start_time"]
        
        # Capture final statistics
        final_stats = test_lock.get_contention_stats()
        
        # Stop profiling if we started it
        if not was_profiling:
            self.stop_profiling()
        
        # Calculate results
        load_test_results = {
            "test_configuration": {
                "thread_count": thread_count,
                "operations_per_thread": operations_per_thread,
                "planned_duration_seconds": test_duration_seconds,
                "actual_duration_seconds": actual_duration
            },
            "performance_results": {
                "total_operations_completed": test_results["operations_completed"],
                "operations_per_second": test_results["operations_completed"] / actual_duration,
                "errors_encountered": test_results["errors_encountered"],
                "error_rate_percent": (test_results["errors_encountered"] / 
                                    max(1, test_results["operations_completed"])) * 100,
                "average_thread_completion_time": (
                    sum(test_results["thread_completion_times"]) / 
                    len(test_results["thread_completion_times"])
                    if test_results["thread_completion_times"] else 0
                )
            },
            "contention_results": {
                "baseline_acquisitions": baseline_stats.total_acquisitions,
                "test_acquisitions": final_stats.total_acquisitions - baseline_stats.total_acquisitions,
                "average_wait_time_ms": final_stats.average_wait_time_ms,
                "max_wait_time_ms": final_stats.max_wait_time_ms,
                "contention_events": final_stats.contention_events - baseline_stats.contention_events,
                "success_rate_percent": final_stats.acquisition_success_rate,
                "threads_blocked": len(final_stats.threads_blocked)
            },
            "scalability_analysis": self._analyze_scalability(
                thread_count, test_results["operations_completed"], actual_duration
            )
        }
        
        logger.info(f"Load test completed: {test_results['operations_completed']} operations, "
                    f"{load_test_results['contention_results']['contention_events']} contentions")
        
        return load_test_results
    
    def _analyze_scalability(self, thread_count: int, operations_completed: int, duration: float) -> Dict[str, Any]:
        """Analyze thread scalability from load test results."""
        ops_per_second = operations_completed / duration
        theoretical_single_thread_ops = ops_per_second / thread_count
        efficiency = ops_per_second / (theoretical_single_thread_ops * thread_count)
        
        return {
            "throughput_ops_per_second": ops_per_second,
            "efficiency_percent": efficiency * 100,
            "scalability_factor": ops_per_second / theoretical_single_thread_ops if theoretical_single_thread_ops > 0 else 0,
            "recommendation": self._get_scalability_recommendation(efficiency, thread_count)
        }
    
    def _get_scalability_recommendation(self, efficiency: float, thread_count: int) -> str:
        """Get scalability recommendation based on efficiency."""
        if efficiency > 0.8:
            return f"Excellent scalability with {thread_count} threads ({efficiency*100:.1f}% efficiency)"
        elif efficiency > 0.6:
            return f"Good scalability with {thread_count} threads ({efficiency*100:.1f}% efficiency)"
        elif efficiency > 0.4:
            return f"Moderate scalability with {thread_count} threads ({efficiency*100:.1f}% efficiency) - consider lock optimization"
        else:
            return f"Poor scalability with {thread_count} threads ({efficiency*100:.1f}% efficiency) - significant lock contention detected"
    
    def __enter__(self):
        """Context manager entry."""
        self.start_profiling()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.stop_profiling()

# Global thread contention profiler
_global_contention_profiler: Optional[ThreadContentionProfiler] = None
_profiler_lock = threading.Lock()

def get_global_contention_profiler() -> ThreadContentionProfiler:
    """Get or create global thread contention profiler."""
    global _global_contention_profiler
    with _profiler_lock:
        if _global_contention_profiler is None:
            _global_contention_profiler = ThreadContentionProfiler()
        return _global_contention_profiler

def profile_detector_pool_contention() -> Dict[str, Any]:
    """Profile detector pool for thread contention issues."""
    profiler = get_global_contention_profiler()
    
    # Start profiling
    profiler.start_profiling()
    time.sleep(5.0)  # Collect baseline data
    
    # Run concurrent load test
    load_test_results = profiler.run_concurrent_load_test(
        thread_count=8,
        operations_per_thread=MAXIMUM_FILE_LENGTH_LINES,
        test_duration_seconds=30.0
    )
    
    # Get analysis
    contention_analysis = profiler.get_contention_analysis()
    
    # Stop profiling
    profiler.stop_profiling()
    
    return {
        "contention_analysis": contention_analysis,
        "load_test_results": load_test_results,
        "recommendations": _generate_detector_pool_recommendations(contention_analysis, load_test_results)
    }

def _generate_detector_pool_recommendations(contention_analysis: Dict, load_test_results: Dict) -> List[str]:
    """Generate specific detector pool optimization recommendations."""
    recommendations = []
    
    # Check scalability
    scalability = load_test_results.get("scalability_analysis", {})
    efficiency = scalability.get("efficiency_percent", 0)
    
    if efficiency < 60:
        recommendations.append(
            f"CRITICAL: Pool efficiency only {efficiency:.1f}% - implement lock-free detector management"
        )
    elif efficiency < 80:
        recommendations.append(
            f"HIGH: Pool efficiency {efficiency:.1f}% - optimize lock granularity and reduce critical section time"
        )
    
    # Check contention levels
    contention_results = load_test_results.get("contention_results", {})
    avg_wait_time = contention_results.get("average_wait_time_ms", 0)
    
    if avg_wait_time > 10:
        recommendations.append(
            f"HIGH: Average wait time {avg_wait_time:.1f}ms - implement detector pre-allocation"
        )
    elif avg_wait_time > 5:
        recommendations.append(
            f"MODERATE: Average wait time {avg_wait_time:.1f}ms - consider adaptive pool sizing"
        )
    
    # Check error rates
    error_rate = load_test_results.get("performance_results", {}).get("error_rate_percent", 0)
    if error_rate > 1:
        recommendations.append(
            f"HIGH: Error rate {error_rate:.1f}% - implement retry logic and graceful degradation"
        )
    
    return recommendations