from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

from src.constants.base import SESSION_TIMEOUT_SECONDS

Advanced performance analysis and optimization system for all caching layers
in the analyzer system. Provides detailed profiling, intelligent warming,
and adaptive optimization strategies.

Features:
- Multi-layer cache performance profiling
- Hit/miss ratio analysis across different usage patterns  
- Intelligent warming with predictive algorithms
- Cache coherence optimization across cache types
- Memory efficiency optimization with detailed metrics
- Real-time performance monitoring and alerting
"""

import asyncio
import time
import threading
import statistics
from collections import defaultdict, deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Union, Tuple, Callable
import logging

# Import cache types - with fallbacks for missing imports
try:
    from ..optimization.file_cache import FileContentCache
except ImportError:
    FileContentCache = None

try:
    from ..caching.ast_cache import ASTCache
except ImportError:
    ASTCache = None

try:
    from ..streaming.incremental_cache import IncrementalCache
except ImportError:
    IncrementalCache = None

logger = logging.getLogger(__name__)

@dataclass
class CacheMetrics:
    """Detailed cache performance metrics."""
    cache_name: str
    hit_count: int = 0
    miss_count: int = 0
    eviction_count: int = 0
    memory_bytes: int = 0
    max_memory_bytes: int = 0
    entry_count: int = 0
    max_entry_count: int = 0
    avg_access_time_ms: float = 0.0
    avg_retrieval_time_ms: float = 0.0
    warm_up_time_ms: float = 0.0
    timestamp: float = field(default_factory=time.time)
    
    @property
    def hit_rate(self) -> float:
        """Calculate hit rate percentage."""
        total = self.hit_count + self.miss_count
        return (self.hit_count / total * 100) if total > 0 else 0.0
    
    @property
    def memory_utilization(self) -> float:
        """Calculate memory utilization percentage."""
        return (self.memory_bytes / self.max_memory_bytes * 100) if self.max_memory_bytes > 0 else 0.0
    
    @property
    def entry_utilization(self) -> float:
        """Calculate entry count utilization percentage."""
        return (self.entry_count / self.max_entry_count * 100) if self.max_entry_count > 0 else 0.0

@dataclass 
class WarmingStrategy:
    """Configuration for cache warming strategy."""
    name: str
    priority_files: List[str] = field(default_factory=list)
    dependency_depth: int = 2  # How deep to follow dependencies
    parallel_workers: int = 4
    batch_size: int = 50
    predictive_prefetch: bool = True
    access_pattern_learning: bool = True
    memory_pressure_threshold: float = 0.8  # Stop warming at 80% memory
    
    def __post_init__(self):
        """Validate warming strategy parameters."""
        assert 1 <= self.dependency_depth <= 5, "dependency_depth must be 1-5"
        assert 1 <= self.parallel_workers <= 16, "parallel_workers must be 1-16"
        assert 10 <= self.batch_size <= 1000, "batch_size must be 10-1000"
        assert 0.1 <= self.memory_pressure_threshold <= 1.0, "memory_pressure_threshold must be 0.1-1.0"

@dataclass
class AccessPattern:
    """Tracks file access patterns for predictive caching."""
    file_path: str
    access_frequency: int = 0
    last_access_time: float = field(default_factory=time.time)
    access_times: deque = field(default_factory=lambda: deque(maxlen=50))
    co_accessed_files: Dict[str, int] = field(default_factory=dict)  # Files accessed together
    seasonal_patterns: Dict[str, int] = field(default_factory=dict)  # Hour-of-day patterns
    
    def record_access(self, timestamp: Optional[float] = None) -> None:
        """Record an access to this file."""
        timestamp = timestamp or time.time()
        self.access_frequency += 1
        self.last_access_time = timestamp
        self.access_times.append(timestamp)
        
        # Track seasonal patterns (hour of day)
        hour = int(timestamp % 86400 // 3600)  # Hour of day
        self.seasonal_patterns[str(hour)] = self.seasonal_patterns.get(str(hour), 0) + 1
    
    def predict_next_access(self) -> Optional[float]:
        """Predict when this file might be accessed next."""
        if len(self.access_times) < 3:
            return None
            
        # Calculate average interval between accesses
        intervals = []
        for i in range(1, len(self.access_times)):
            intervals.append(self.access_times[i] - self.access_times[i-1])
        
        if intervals:
            avg_interval = statistics.mean(intervals)
            return self.last_access_time + avg_interval
        
        return None

class CacheCoherenceManager:
    """Manages coherence across different cache layers."""
    
    def __init__(self):
        """Initialize cache coherence manager."""
        self.cache_dependencies: Dict[str, Set[str]] = defaultdict(set)
        self.invalidation_listeners: Dict[str, List[Callable]] = defaultdict(list)
        self.coherence_stats = {
            "invalidations_propagated": 0,
            "coherence_violations": 0,
            "sync_operations": 0
        }
        self._lock = threading.RLock()
    
    def register_cache_dependency(self, parent_cache: str, child_cache: str) -> None:
        """Register dependency between cache layers."""
        with self._lock:
            self.cache_dependencies[parent_cache].add(child_cache)
            logger.debug(f"Registered cache dependency: {parent_cache} -> {child_cache}")
    
    def add_invalidation_listener(self, cache_name: str, listener: Callable[[str], None]) -> None:
        """Add listener for cache invalidation events."""
        with self._lock:
            self.invalidation_listeners[cache_name].append(listener)
    
    def invalidate_entry(self, cache_name: str, entry_key: str) -> None:
        """Invalidate entry across all dependent caches."""
        with self._lock:
            # Notify direct listeners
            for listener in self.invalidation_listeners[cache_name]:
                try:
                    listener(entry_key)
                except Exception as e:
                    logger.error(f"Cache invalidation listener failed: {e}")
            
            # Propagate to dependent caches
            for dependent_cache in self.cache_dependencies[cache_name]:
                self.invalidate_entry(dependent_cache, entry_key)
            
            self.coherence_stats["invalidations_propagated"] += 1
    
    def sync_cache_states(self, primary_cache: str, secondary_caches: List[str]) -> int:
        """Synchronize cache states to maintain coherence."""
        sync_count = 0
        
        with self._lock:
            # Implementation would sync cache states
            self.coherence_stats["sync_operations"] += 1
            sync_count = len(secondary_caches)
        
        return sync_count

class IntelligentCacheWarmer:
    """Intelligent cache warming with predictive algorithms."""

    def __init__(self,
                file_cache: Optional[Any] = None,  # FileContentCache when available
                ast_cache: Optional[Any] = None,  # ASTCache when available
                incremental_cache: Optional[Any] = None):  # IncrementalCache when available
        """Initialize intelligent cache warmer."""
        self.file_cache = file_cache
        self.ast_cache = ast_cache
        self.incremental_cache = incremental_cache
        
        # Access pattern tracking
        self.access_patterns: Dict[str, AccessPattern] = {}
        self.pattern_lock = threading.RLock()
        
        # Warming statistics
        self.warming_stats = {
            "files_warmed": 0,
            "total_warming_time_ms": 0,
            "cache_misses_prevented": 0,
            "warming_sessions": 0,
            "predictive_hits": 0,
            "predictive_misses": 0
        }
        
        # Machine learning features (simplified)
        self.ml_features = {
            "file_correlations": defaultdict(dict),
            "temporal_patterns": defaultdict(list),
            "usage_clusters": []
        }
    
    def track_access(self, file_path: str, co_accessed_files: Optional[Set[str]] = None) -> None:
        """Track file access for pattern learning."""
        with self.pattern_lock:
            file_path = str(file_path)
            
            if file_path not in self.access_patterns:
                self.access_patterns[file_path] = AccessPattern(file_path=file_path)
            
            pattern = self.access_patterns[file_path]
            pattern.record_access()
            
            # Track co-access patterns
            if co_accessed_files:
                for co_file in co_accessed_files:
                    co_file = str(co_file)
                    pattern.co_accessed_files[co_file] = pattern.co_accessed_files.get(co_file, 0) + 1
    
    async def warm_cache_intelligently(self, 
                                    strategy: WarmingStrategy,
                                    progress_callback: Optional[Callable[[int, int], None]] = None) -> Dict[str, Any]:
        """Execute intelligent cache warming strategy."""
        start_time = time.time()
        logger.info(f"Starting intelligent cache warming with strategy: {strategy.name}")
        
        # Step 1: Identify files to warm
        files_to_warm = await self._identify_warming_candidates(strategy)
        logger.info(f"Identified {len(files_to_warm)} files for warming")
        
        # Step 2: Prioritize files based on access patterns
        prioritized_files = self._prioritize_files_for_warming(files_to_warm, strategy)
        
        # Step 3: Execute warming in batches with dependency awareness
        warming_results = await self._execute_warming_batches(
            prioritized_files, strategy, progress_callback
        )
        
        # Step 4: Update statistics and patterns
        warming_time_ms = int((time.time() - start_time) * 1000)
        self.warming_stats["total_warming_time_ms"] += warming_time_ms
        self.warming_stats["warming_sessions"] += 1
        
        logger.info(f"Cache warming completed in {warming_time_ms}ms")
        
        return {
            "strategy_name": strategy.name,
            "files_warmed": warming_results["files_warmed"],
            "files_failed": warming_results["files_failed"], 
            "warming_time_ms": warming_time_ms,
            "memory_used_mb": warming_results["memory_used_mb"],
            "predictive_accuracy": self._calculate_predictive_accuracy()
        }
    
    async def _identify_warming_candidates(self, strategy: WarmingStrategy) -> List[str]:
        """Identify files that should be warmed based on strategy."""
        candidates = set(strategy.priority_files)
        
        # Add files based on access patterns
        with self.pattern_lock:
            # High-frequency files
            for file_path, pattern in self.access_patterns.items():
                if pattern.access_frequency > 5:  # Threshold for frequent access
                    candidates.add(file_path)
            
            # Files likely to be accessed soon based on predictions
            current_time = time.time()
            for file_path, pattern in self.access_patterns.items():
                next_access = pattern.predict_next_access()
                if next_access and (next_access - current_time) < 3600:  # Within 1 hour
                    candidates.add(file_path)
        
        # Add dependency files
        if strategy.dependency_depth > 0:
            dependency_files = await self._discover_dependencies(
                list(candidates), strategy.dependency_depth
            )
            candidates.update(dependency_files)
        
        return list(candidates)
    
    def _prioritize_files_for_warming(self, files: List[str], strategy: WarmingStrategy) -> List[str]:
        """Prioritize files for warming based on access patterns and strategy."""
        file_scores = {}
        
        with self.pattern_lock:
            for file_path in files:
                score = 0.0
                
                # Priority files get highest score
                if file_path in strategy.priority_files:
                    score += 1000.0
                
                # Access frequency scoring
                if file_path in self.access_patterns:
                    pattern = self.access_patterns[file_path]
                    score += pattern.access_frequency * 10.0
                    
                    # Recent access bonus
                    time_since_access = time.time() - pattern.last_access_time
                    if time_since_access < SESSION_TIMEOUT_SECONDS:  # Within 1 hour
                        score += 100.0 / (time_since_access / 60 + 1)  # Decay over time
                    
                    # Predictive access bonus
                    next_access = pattern.predict_next_access()
                    if next_access:
                        time_until_access = next_access - time.time()
                        if 0 < time_until_access < 7200:  # Within 2 hours
                            score += 50.0 / (time_until_access / SESSION_TIMEOUT_SECONDS + 1)
                
                file_scores[file_path] = score
        
        # Sort by score (highest first)
        return sorted(files, key=lambda f: file_scores.get(f, 0.0), reverse=True)
    
    async def _execute_warming_batches(self,
                                    files: List[str], 
                                    strategy: WarmingStrategy,
                                    progress_callback: Optional[Callable[[int, int], None]] = None) -> Dict[str, Any]:
        """Execute cache warming in parallel batches."""
        files_warmed = 0
        files_failed = 0
        total_memory_used = 0
        
        # Process files in batches
        for i in range(0, len(files), strategy.batch_size):
            batch = files[i:i + strategy.batch_size]
            
            # Check memory pressure before each batch
            if self._check_memory_pressure() > strategy.memory_pressure_threshold:
                logger.warning("Memory pressure too high, stopping cache warming")
                break
            
            # Warm batch in parallel
            batch_results = await self._warm_file_batch(batch, strategy.parallel_workers)
            
            files_warmed += batch_results["warmed"]
            files_failed += batch_results["failed"]
            total_memory_used += batch_results["memory_used"]
            
            # Update progress
            if progress_callback:
                progress_callback(i + len(batch), len(files))
            
            # Brief pause between batches to prevent overwhelming the system
            await asyncio.sleep(0.01)
        
        return {
            "files_warmed": files_warmed,
            "files_failed": files_failed,
            "memory_used_mb": total_memory_used / (1024 * 1024)
        }
    
    async def _warm_file_batch(self, files: List[str], max_workers: int) -> Dict[str, Any]:
        """Warm a batch of files in parallel."""
        semaphore = asyncio.Semaphore(max_workers)
        
        async def warm_single_file(file_path: str) -> Tuple[bool, int]:
            async with semaphore:
                return await self._warm_single_file(file_path)
        
        # Execute all warming tasks
        tasks = [warm_single_file(file_path) for file_path in files]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        warmed_count = 0
        failed_count = 0
        total_memory = 0
        
        for result in results:
            if isinstance(result, Exception):
                failed_count += 1
            else:
                success, memory_used = result
                if success:
                    warmed_count += 1
                    total_memory += memory_used
                else:
                    failed_count += 1
        
        return {
            "warmed": warmed_count,
            "failed": failed_count,
            "memory_used": total_memory
        }
    
    async def _warm_single_file(self, file_path: str) -> Tuple[bool, int]:
        """Warm caches for a single file."""
        try:
            file_path = str(file_path)
            memory_used = 0
            
            # Check if file exists
            if not path_exists(file_path):
                return False, 0
            
            # Warm file content cache
            if self.file_cache:
                content = self.file_cache.get_file_content(file_path)
                if content:
                    memory_used += len(content.encode('utf-8'))
            
            # Warm AST cache
            if self.ast_cache and file_path.endswith('.py'):
                ast_tree = self.ast_cache.get_ast(file_path)
                if ast_tree:
                    memory_used += 1024  # Rough estimate for AST tree size
            
            # Update warming statistics
            self.warming_stats["files_warmed"] += 1
            
            return True, memory_used
            
        except Exception as e:
            logger.debug(f"Failed to warm {file_path}: {e}")
            return False, 0
    
    async def _discover_dependencies(self, files: List[str], depth: int) -> Set[str]:
        """Discover file dependencies up to specified depth."""
        dependencies = set()
        
        if depth <= 0:
            return dependencies
        
        # For each file, analyze imports and add to dependencies
        for file_path in files:
            try:
                if Path(file_path).suffix == '.py':
                    file_deps = await self._extract_python_imports(file_path)
                    dependencies.update(file_deps)
            except Exception as e:
                logger.debug(f"Failed to extract dependencies from {file_path}: {e}")
        
        # Recursively discover dependencies
        if depth > 1:
            next_level_deps = await self._discover_dependencies(list(dependencies), depth - 1)
            dependencies.update(next_level_deps)
        
        return dependencies
    
    async def _extract_python_imports(self, file_path: str) -> Set[str]:
        """Extract imported file paths from Python file."""
        dependencies = set()
        
        try:
            # Get file content
            if self.file_cache:
                content = self.file_cache.get_file_content(file_path)
            else:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            
            if not content:
                return dependencies
            
            # Parse imports (simplified - would use AST in production)
            import ast
            tree = ast.parse(content)
            
            base_dir = Path(file_path).parent
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        # Convert module name to file path
                        module_path = self._resolve_module_path(alias.name, base_dir)
                        if module_path:
                            dependencies.add(str(module_path))
                
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        module_path = self._resolve_module_path(node.module, base_dir)
                        if module_path:
                            dependencies.add(str(module_path))
        
        except Exception as e:
            logger.debug(f"Failed to extract imports from {file_path}: {e}")
        
        return dependencies
    
    def _resolve_module_path(self, module_name: str, base_dir: Path) -> Optional[Path]:
        """Resolve module name to file path."""
        # Handle relative imports
        if module_name.startswith('.'):
            # Relative import - resolve relative to current file
            parts = module_name.lstrip('.').split('.')
            if parts and parts[0]:
                potential_path = base_dir / '/'.join(parts) / '__init__.py'
                if potential_path.exists():
                    return potential_path
                potential_path = base_dir / f"{'/'.join(parts)}.py"
                if potential_path.exists():
                    return potential_path
        else:
            # Absolute import - try to resolve
            parts = module_name.split('.')
            
            # Look for package in common locations
            for search_dir in [base_dir, base_dir.parent, Path.cwd()]:
                potential_path = search_dir / f"{'/'.join(parts)}.py"
                if potential_path.exists():
                    return potential_path
                
                potential_path = search_dir / '/'.join(parts) / '__init__.py'
                if potential_path.exists():
                    return potential_path
        
        return None
    
    def _check_memory_pressure(self) -> float:
        """Check current memory pressure across all caches."""
        total_used = 0
        total_max = 0
        
        # Check file cache memory
        if self.file_cache:
            memory_info = self.file_cache.get_memory_usage()
            total_used += memory_info.get('file_cache_bytes', 0)
            total_max += memory_info.get('max_memory_bytes', 0)
        
        # Estimate AST cache memory (simplified)
        if self.ast_cache:
            stats = self.ast_cache.get_cache_statistics()
            total_used += stats.get('memory_usage_mb', 0) * 1024 * 1024
            total_max += stats.get('memory_limit_mb', 0) * 1024 * 1024
        
        return total_used / total_max if total_max > 0 else 0.0
    
    def _calculate_predictive_accuracy(self) -> float:
        """Calculate accuracy of predictive warming."""
        total_predictions = self.warming_stats["predictive_hits"] + self.warming_stats["predictive_misses"]
        return self.warming_stats["predictive_hits"] / total_predictions if total_predictions > 0 else 0.0

class CachePerformanceProfiler:
    """Comprehensive cache performance profiler and optimizer."""
    
    def __init__(self):
        """Initialize cache performance profiler."""
        self.file_cache = None
        self.ast_cache = None
        self.incremental_cache = None
        
        # Initialize cache system integration
        if CACHE_INTEGRATION_AVAILABLE:
            try:
                self.file_cache = get_global_cache()
                self.ast_cache = global_ast_cache
                self.incremental_cache = get_global_incremental_cache()
            except Exception as e:
                logger.warning(f"Failed to initialize cache integration: {e}")
        
        # Performance monitoring
        self.metrics_history: Dict[str, List[CacheMetrics]] = defaultdict(list)
        self.monitoring_active = False
        self.monitoring_interval = 60.0  # seconds
        self.monitoring_task: Optional[asyncio.Task] = None
        
        # Cache coherence management
        self.coherence_manager = CacheCoherenceManager()
        self._setup_coherence_dependencies()
        
        # Intelligent warming
        self.cache_warmer = IntelligentCacheWarmer(
            self.file_cache, self.ast_cache, self.incremental_cache
        )
        
        # Performance alerts
        self.alert_thresholds = {
            "min_hit_rate": 75.0,  # Minimum hit rate percentage
            "max_memory_usage": 90.0,  # Maximum memory usage percentage
            "max_avg_access_time": 100.0,  # Maximum average access time in ms
        }
        self.alert_callbacks: List[Callable[[str, Dict[str, Any]], None]] = []
    
    def _setup_coherence_dependencies(self) -> None:
        """Setup cache coherence dependencies."""
        if not all([self.file_cache, self.ast_cache, self.incremental_cache]):
            return
        
        # File cache is the base layer
        self.coherence_manager.register_cache_dependency("file_cache", "ast_cache")
        self.coherence_manager.register_cache_dependency("file_cache", "incremental_cache")
        self.coherence_manager.register_cache_dependency("ast_cache", "incremental_cache")
    
    async def start_monitoring(self, interval_seconds: float = 60.0) -> None:
        """Start continuous performance monitoring."""
        if self.monitoring_active:
            logger.warning("Cache monitoring already active")
            return
        
        self.monitoring_active = True
        self.monitoring_interval = interval_seconds
        
        self.monitoring_task = asyncio.create_task(self._monitoring_loop())
        logger.info(f"Started cache performance monitoring with {interval_seconds}s interval")
    
    async def stop_monitoring(self) -> None:
        """Stop continuous performance monitoring."""
        self.monitoring_active = False
        
        if self.monitoring_task:
            self.monitoring_task.cancel()
            try:
                await self.monitoring_task
            except asyncio.CancelledError:
                pass
            self.monitoring_task = None
        
        logger.info("Stopped cache performance monitoring")
    
    async def _monitoring_loop(self) -> None:
        """Main monitoring loop."""
        while self.monitoring_active:
            try:
                # Collect metrics from all cache layers
                await self._collect_performance_metrics()
                
                # Check for performance alerts
                await self._check_performance_alerts()
                
                # Wait for next monitoring cycle
                await asyncio.sleep(self.monitoring_interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cache monitoring loop: {e}")
                await asyncio.sleep(self.monitoring_interval)
    
    async def _collect_performance_metrics(self) -> None:
        """Collect performance metrics from all cache layers."""
        timestamp = time.time()
        
        # File cache metrics
        if self.file_cache:
            file_stats = self.file_cache.get_cache_stats()
            memory_usage = self.file_cache.get_memory_usage()
            
            file_metrics = CacheMetrics(
                cache_name="file_cache",
                hit_count=file_stats.hits,
                miss_count=file_stats.misses,
                eviction_count=file_stats.evictions,
                memory_bytes=memory_usage.get('file_cache_bytes', 0),
                max_memory_bytes=memory_usage.get('max_memory_bytes', 0),
                entry_count=memory_usage.get('file_cache_count', 0),
                timestamp=timestamp
            )
            
            self.metrics_history["file_cache"].append(file_metrics)
        
        # AST cache metrics
        if self.ast_cache:
            ast_stats = self.ast_cache.get_cache_statistics()
            
            ast_metrics = CacheMetrics(
                cache_name="ast_cache",
                hit_count=ast_stats.get("cache_hits", 0),
                miss_count=ast_stats.get("cache_misses", 0),
                eviction_count=ast_stats.get("evictions", 0),
                memory_bytes=int(ast_stats.get("memory_usage_mb", 0) * 1024 * 1024),
                max_memory_bytes=int(ast_stats.get("memory_limit_mb", 0) * 1024 * 1024),
                entry_count=ast_stats.get("entries_count", 0),
                avg_access_time_ms=ast_stats.get("avg_analysis_time_ms", 0),
                timestamp=timestamp
            )
            
            self.metrics_history["ast_cache"].append(ast_metrics)
        
        # Incremental cache metrics
        if self.incremental_cache:
            inc_stats = self.incremental_cache.get_cache_stats()
            
            inc_metrics = CacheMetrics(
                cache_name="incremental_cache",
                hit_count=inc_stats.get("cache_hits", 0),
                miss_count=inc_stats.get("cache_misses", 0),
                entry_count=inc_stats.get("partial_results_cached", 0),
                timestamp=timestamp
            )
            
            self.metrics_history["incremental_cache"].append(inc_metrics)
        
        # Limit metrics history size (NASA Rule 7: bounded memory)
        for cache_name in self.metrics_history:
            if len(self.metrics_history[cache_name]) > 1000:
                self.metrics_history[cache_name] = self.metrics_history[cache_name][-500:]
    
    async def _check_performance_alerts(self) -> None:
        """Check for performance issues and trigger alerts."""
        for cache_name, metrics_list in self.metrics_history.items():
            if not metrics_list:
                continue
                
            latest_metrics = metrics_list[-1]
            
            # Check hit rate
            if latest_metrics.hit_rate < self.alert_thresholds["min_hit_rate"]:
                await self._trigger_alert("low_hit_rate", {
                    "cache_name": cache_name,
                    "hit_rate": latest_metrics.hit_rate,
                    "threshold": self.alert_thresholds["min_hit_rate"]
                })
            
            # Check memory usage
            if latest_metrics.memory_utilization > self.alert_thresholds["max_memory_usage"]:
                await self._trigger_alert("high_memory_usage", {
                    "cache_name": cache_name,
                    "memory_utilization": latest_metrics.memory_utilization,
                    "threshold": self.alert_thresholds["max_memory_usage"]
                })
            
            # Check access time
            if latest_metrics.avg_access_time_ms > self.alert_thresholds["max_avg_access_time"]:
                await self._trigger_alert("slow_access_time", {
                    "cache_name": cache_name,
                    "avg_access_time_ms": latest_metrics.avg_access_time_ms,
                    "threshold": self.alert_thresholds["max_avg_access_time"]
                })
    
    async def _trigger_alert(self, alert_type: str, alert_data: Dict[str, Any]) -> None:
        """Trigger performance alert."""
        logger.warning(f"Cache performance alert: {alert_type} - {alert_data}")
        
        for callback in self.alert_callbacks:
            try:
                callback(alert_type, alert_data)
            except Exception as e:
                logger.error(f"Alert callback failed: {e}")
    
    def add_alert_callback(self, callback: Callable[[str, Dict[str, Any]], None]) -> None:
        """Add callback for performance alerts."""
        self.alert_callbacks.append(callback)
    
    async def run_performance_benchmark(self, 
                                        test_files: List[str],
                                        benchmark_config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Run comprehensive performance benchmark."""
        config = benchmark_config or {
            "iterations": 100,
            "clear_cache_between_runs": True,
            "measure_warming": True,
            "test_concurrent_access": True
        }
        
        logger.info(f"Starting cache performance benchmark with {len(test_files)} files")
        benchmark_start = time.time()
        
        results = {
            "benchmark_config": config,
            "test_files": len(test_files),
            "cache_layers_tested": [],
            "performance_results": {},
            "optimization_recommendations": []
        }
        
        # Test each cache layer
        if self.file_cache:
            results["cache_layers_tested"].append("file_cache")
            file_cache_results = await self._benchmark_file_cache(test_files, config)
            results["performance_results"]["file_cache"] = file_cache_results
        
        if self.ast_cache:
            results["cache_layers_tested"].append("ast_cache")
            ast_cache_results = await self._benchmark_ast_cache(test_files, config)
            results["performance_results"]["ast_cache"] = ast_cache_results
        
        if self.incremental_cache:
            results["cache_layers_tested"].append("incremental_cache")
            inc_cache_results = await self._benchmark_incremental_cache(test_files, config)
            results["performance_results"]["incremental_cache"] = inc_cache_results
        
        # Test cache warming performance
        if config.get("measure_warming", False):
            warming_results = await self._benchmark_cache_warming(test_files)
            results["warming_performance"] = warming_results
        
        # Generate optimization recommendations
        results["optimization_recommendations"] = self._generate_optimization_recommendations(
            results["performance_results"]
        )
        
        benchmark_time = time.time() - benchmark_start
        results["total_benchmark_time_ms"] = int(benchmark_time * 1000)
        
        logger.info(f"Cache performance benchmark completed in {benchmark_time:.2f}s")
        return results
    
    async def _benchmark_file_cache(self, test_files: List[str], config: Dict[str, Any]) -> Dict[str, Any]:
        """Benchmark file cache performance."""
        if not self.file_cache:
            return {}
        
        iterations = config.get("iterations", 100)
        access_times = []
        hit_rates = []
        
        for iteration in range(iterations):
            if config.get("clear_cache_between_runs", False):
                self.file_cache.clear_cache()
            
            # Measure access times
            start_time = time.time()
            initial_stats = self.file_cache.get_cache_stats()
            
            # Access test files
            for file_path in test_files[:50]:  # Limit to first 50 files
                content = self.file_cache.get_file_content(file_path)
            
            access_time_ms = (time.time() - start_time) * 1000
            final_stats = self.file_cache.get_cache_stats()
            
            access_times.append(access_time_ms)
            
            # Calculate hit rate for this iteration
            hits = final_stats.hits - initial_stats.hits
            misses = final_stats.misses - initial_stats.misses
            hit_rate = hits / (hits + misses) if (hits + misses) > 0 else 0
            hit_rates.append(hit_rate * 100)
        
        return {
            "avg_access_time_ms": statistics.mean(access_times),
            "min_access_time_ms": min(access_times),
            "max_access_time_ms": max(access_times),
            "avg_hit_rate_percent": statistics.mean(hit_rates),
            "hit_rate_std_dev": statistics.stdev(hit_rates) if len(hit_rates) > 1 else 0,
            "iterations": iterations
        }
    
    async def _benchmark_ast_cache(self, test_files: List[str], config: Dict[str, Any]) -> Dict[str, Any]:
        """Benchmark AST cache performance."""
        if not self.ast_cache:
            return {}
        
        iterations = config.get("iterations", 50)  # Fewer iterations for AST parsing
        parse_times = []
        hit_rates = []
        
        # Filter to Python files only
        python_files = [f for f in test_files if f.endswith('.py')][:25]
        
        for iteration in range(iterations):
            if config.get("clear_cache_between_runs", False):
                self.ast_cache.clear_cache()
            
            start_time = time.time()
            initial_stats = self.ast_cache.get_cache_statistics()
            
            # Parse AST for test files
            for file_path in python_files:
                ast_tree = self.ast_cache.get_ast(file_path)
            
            parse_time_ms = (time.time() - start_time) * 1000
            final_stats = self.ast_cache.get_cache_statistics()
            
            parse_times.append(parse_time_ms)
            
            # Calculate hit rate
            hits = final_stats["cache_hits"] - initial_stats["cache_hits"]
            misses = final_stats["cache_misses"] - initial_stats["cache_misses"]
            hit_rate = hits / (hits + misses) if (hits + misses) > 0 else 0
            hit_rates.append(hit_rate * 100)
        
        return {
            "avg_parse_time_ms": statistics.mean(parse_times),
            "min_parse_time_ms": min(parse_times),
            "max_parse_time_ms": max(parse_times),
            "avg_hit_rate_percent": statistics.mean(hit_rates),
            "files_tested": len(python_files),
            "iterations": iterations
        }
    
    async def _benchmark_incremental_cache(self, test_files: List[str], config: Dict[str, Any]) -> Dict[str, Any]:
        """Benchmark incremental cache performance."""
        if not self.incremental_cache:
            return {}
        
        # Simplified benchmark for incremental cache
        start_time = time.time()
        
        # Test delta tracking performance
        delta_count = 0
        for file_path in test_files[:10]:  # Test with subset
            if path_exists(file_path):
                delta = self.incremental_cache.track_file_change(file_path)
                if delta:
                    delta_count += 1
        
        delta_time_ms = (time.time() - start_time) * 1000
        
        # Get cache statistics
        stats = self.incremental_cache.get_cache_stats()
        
        return {
            "delta_tracking_time_ms": delta_time_ms,
            "deltas_processed": delta_count,
            "cache_hit_rate_percent": stats.get("cache_hit_rate", 0) * 100,
            "partial_results_cached": stats.get("partial_results_cached", 0),
            "dependency_invalidations": stats.get("dependency_invalidations", 0)
        }
    
    async def _benchmark_cache_warming(self, test_files: List[str]) -> Dict[str, Any]:
        """Benchmark cache warming performance."""
        warming_strategy = WarmingStrategy(
            name="benchmark_warming",
            priority_files=test_files[:20],  # Prioritize first 20 files
            parallel_workers=4,
            batch_size=10,
            predictive_prefetch=True
        )
        
        # Clear all caches before warming
        if self.file_cache:
            self.file_cache.clear_cache()
        if self.ast_cache:
            self.ast_cache.clear_cache()
        
        # Execute warming
        warming_results = await self.cache_warmer.warm_cache_intelligently(warming_strategy)
        
        return warming_results
    
    def _generate_optimization_recommendations(self, performance_results: Dict[str, Any]) -> List[str]:
        """Generate optimization recommendations based on benchmark results."""
        recommendations = []
        
        # File cache recommendations
        if "file_cache" in performance_results:
            file_results = performance_results["file_cache"]
            
            if file_results.get("avg_hit_rate_percent", 100) < 80:
                recommendations.append(
                    "File cache hit rate is low (<80%). Consider increasing cache size or "
                    "implementing better cache warming strategies."
                )
            
            if file_results.get("avg_access_time_ms", 0) > 50:
                recommendations.append(
                    "File cache access time is high (>50ms). Consider optimizing file I/O "
                    "operations or reducing cache eviction frequency."
                )
        
        # AST cache recommendations  
        if "ast_cache" in performance_results:
            ast_results = performance_results["ast_cache"]
            
            if ast_results.get("avg_hit_rate_percent", 100) < 70:
                recommendations.append(
                    "AST cache hit rate is low (<70%). Consider implementing predictive "
                    "caching for frequently analyzed files."
                )
            
            if ast_results.get("avg_parse_time_ms", 0) > 500:
                recommendations.append(
                    "AST parsing time is high (>500ms). Consider parallel parsing or "
                    "incremental AST diff analysis."
                )
        
        # General recommendations
        if len(performance_results) > 1:
            recommendations.append(
                "Multiple cache layers detected. Implement cache coherence optimization "
                "to prevent redundant operations across layers."
            )
        
        if not recommendations:
            recommendations.append("Cache performance is within acceptable parameters.")
        
        return recommendations
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get comprehensive performance summary."""
        summary = {
            "cache_layers": [],
            "overall_metrics": {},
            "recent_trends": {},
            "warming_stats": {},
            "coherence_stats": {}
        }
        
        # Collect recent metrics for each cache
        for cache_name, metrics_list in self.metrics_history.items():
            if not metrics_list:
                continue
            
            summary["cache_layers"].append(cache_name)
            latest_metrics = metrics_list[-1]
            
            summary["overall_metrics"][cache_name] = {
                "hit_rate_percent": latest_metrics.hit_rate,
                "memory_utilization_percent": latest_metrics.memory_utilization,
                "entry_count": latest_metrics.entry_count,
                "avg_access_time_ms": latest_metrics.avg_access_time_ms
            }
            
            # Calculate trends (if we have enough data points)
            if len(metrics_list) >= 10:
                recent_hit_rates = [m.hit_rate for m in metrics_list[-10:]]
                trend = "improving" if recent_hit_rates[-1] > recent_hit_rates[0] else "declining"
                summary["recent_trends"][cache_name] = {
                    "hit_rate_trend": trend,
                    "hit_rate_change": recent_hit_rates[-1] - recent_hit_rates[0]
                }
        
        # Add warming statistics
        summary["warming_stats"] = self.cache_warmer.warming_stats.copy()
        
        # Add coherence statistics
        summary["coherence_stats"] = self.coherence_manager.coherence_stats.copy()
        
        return summary
    
    def measure_cache_hit_rate(self) -> float:
        """Measure current cache hit rate across all cache layers.
        
        Returns:
            float: Average hit rate percentage (0-100)
        """
        total_hit_rate = 0.0
        active_caches = 0
        
        # Calculate hit rate for each active cache layer
        for cache_name, metrics_list in self.metrics_history.items():
            if metrics_list:
                latest_metrics = metrics_list[-1]
                total_hit_rate += latest_metrics.hit_rate
                active_caches += 1
        
        # Return average hit rate across all active caches
        return total_hit_rate / active_caches if active_caches > 0 else 0.0

# Global profiler instance
_global_profiler: Optional[CachePerformanceProfiler] = None
_profiler_lock = threading.Lock()

def get_global_profiler() -> CachePerformanceProfiler:
    """Get or create global cache performance profiler."""
    global _global_profiler
    
    with _profiler_lock:
        if _global_profiler is None:
            _global_profiler = CachePerformanceProfiler()
    
    return _global_profiler

async def run_cache_optimization(test_files: Optional[List[str]] = None,
                                warming_strategy: Optional[WarmingStrategy] = None) -> Dict[str, Any]:
    """High-level function to run complete cache optimization."""
    profiler = get_global_profiler()
    
    # Default test files if not provided
    if test_files is None:
        test_files = []
        # Discover Python files in current directory
        for py_file in Path.cwd().rglob("*.py"):
            if py_file.is_file() and not str(py_file).startswith('.'):
                test_files.append(str(py_file))
        test_files = test_files[:100]  # Limit to 100 files
    
    # Run performance benchmark
    benchmark_results = await profiler.run_performance_benchmark(test_files)
    
    # Execute intelligent cache warming if strategy provided
    warming_results = None
    if warming_strategy:
        warming_results = await profiler.cache_warmer.warm_cache_intelligently(warming_strategy)
    
    # Get performance summary
    performance_summary = profiler.get_performance_summary()
    
    return {
        "benchmark_results": benchmark_results,
        "warming_results": warming_results,
        "performance_summary": performance_summary,
        "optimization_timestamp": time.time()
    }