# Cache Strategy Optimization Guide

## Executive Summary

This guide provides comprehensive strategies for optimizing the multi-level caching system within the SPEK Enhanced Development Platform. The cache architecture consists of four integrated layers designed for maximum performance while maintaining memory efficiency and thread safety.

## Multi-Level Cache Architecture

### 1. File Content Cache (Level 1)

**Purpose**: Primary file content storage with LRU eviction  
**Location**: `analyzer/optimization/file_cache.py`  
**Memory Limit**: 50-100MB (configurable)  
**Thread Safety**: Full RLock protection

**Key Features**:
- Content hash-based AST caching
- File modification time validation  
- Memory pressure handling (80%/90% thresholds)
- Thread-safe OrderedDict implementation
- Automatic cleanup with weak references

**Optimization Strategies**:

```python
# Optimal configuration for different environments
CACHE_CONFIGS = {
    'development': {
        'max_memory': 75 * 1024 * 1024,  # 75MB
        'memory_pressure_threshold': 0.8,
        'aggressive_cleanup_threshold': 0.9
    },
    'production': {
        'max_memory': 100 * 1024 * 1024,  # 100MB
        'memory_pressure_threshold': 0.7,  # More conservative
        'aggressive_cleanup_threshold': 0.85
    },
    'ci_cd': {
        'max_memory': 50 * 1024 * 1024,   # 50MB (limited resources)
        'memory_pressure_threshold': 0.6,
        'aggressive_cleanup_threshold': 0.75
    }
}
```

### 2. AST Cache (Level 2) 

**Purpose**: Parsed AST tree storage with persistence  
**Location**: `analyzer/caching/ast_cache.py`  
**Memory Limit**: 500MB default (adjustable)  
**Persistence**: Disk-based with compression

**Advanced Features**:
- Gzip compression for storage efficiency
- File validation with stat() checks
- Parallel warming with ThreadPoolExecutor
- LRU eviction based on access patterns

**Performance Tuning**:

```python
# AST cache optimization parameters
AST_CACHE_OPTIMIZATION = {
    'cache_size_mb': 750,  # Increased from 500MB
    'max_entries': 15000,  # Increased from 10K
    'enable_compression': True,
    'parallel_workers': 6,  # Match CPU cores
    'cache_validation_interval': 3600,  # 1 hour
    'aggressive_eviction_threshold': 0.9
}

# Configure for optimal performance
ast_cache = ASTCache(
    max_size_mb=AST_CACHE_OPTIMIZATION['cache_size_mb'],
    max_entries=AST_CACHE_OPTIMIZATION['max_entries'],
    enable_compression=AST_CACHE_OPTIMIZATION['enable_compression']
)
```

### 3. Incremental Cache (Level 3)

**Purpose**: Delta-based caching for streaming workflows  
**Location**: `analyzer/streaming/incremental_cache.py`  
**Memory Management**: Bounded collections with cleanup

**Core Capabilities**:
- Delta tracking with content hashing
- Dependency graph maintenance
- Cross-session result persistence
- Intelligent invalidation cascading

**Optimization Configuration**:

```python
# Incremental cache tuning for different workloads
INCREMENTAL_CONFIGS = {
    'heavy_analysis': {
        'max_partial_results': 7500,
        'max_dependency_nodes': 15000,
        'cache_retention_hours': 48.0,
        'cleanup_frequency_minutes': 30
    },
    'interactive_development': {
        'max_partial_results': 3000,
        'max_dependency_nodes': 8000,
        'cache_retention_hours': 12.0,
        'cleanup_frequency_minutes': 15
    },
    'ci_pipeline': {
        'max_partial_results': 2000,
        'max_dependency_nodes': 5000,
        'cache_retention_hours': 2.0,  # Short-lived
        'cleanup_frequency_minutes': 5
    }
}
```

### 4. Stream Processor Cache (Level 4)

**Purpose**: Real-time streaming analysis caching  
**Location**: `analyzer/streaming/stream_processor.py`  
**Specialization**: Event-driven invalidation

**Real-time Features**:
- Backpressure handling with bounded queues
- Event-driven cache invalidation
- Cross-stream result sharing
- Memory pressure monitoring

## Cache Coherence Management

### 1. Multi-Level Coordination

The `CacheCoherenceManager` ensures consistency across all cache levels:

```python
class CacheCoherenceManager:
    def __init__(self):
        """Initialize cache coherence with dependency mapping."""
        self.cache_dependencies = {
            "file_cache": ["ast_cache", "incremental_cache", "stream_cache"],
            "ast_cache": ["incremental_cache"],
            "incremental_cache": ["stream_cache"]
        }
    
    def invalidate_cascade(self, cache_name: str, entry_key: str):
        """Cascade invalidation through dependent caches."""
        # Invalidate in current cache
        self._invalidate_local(cache_name, entry_key)
        
        # Propagate to dependent caches
        for dependent in self.cache_dependencies.get(cache_name, []):
            self.invalidate_cascade(dependent, entry_key)
```

### 2. Shared Key Management

**Content Hash Coordination**:
```python
def generate_unified_cache_key(file_path: str, content: str) -> str:
    """Generate consistent cache key across all levels."""
    content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()[:16]
    path_hash = hashlib.md5(str(file_path).encode('utf-8')).hexdigest()[:8]
    return f"{path_hash}_{content_hash}"
```

**Cross-Cache Validation**:
```python
def validate_cache_consistency():
    """Validate consistency across cache levels."""
    file_cache = get_global_cache()
    ast_cache = global_ast_cache
    incremental_cache = get_global_incremental_cache()
    
    inconsistencies = []
    
    # Check file cache vs AST cache consistency
    for file_path in file_cache._cache.keys():
        file_hash = file_cache._cache[file_path].content_hash
        ast_entry = ast_cache.get_ast(file_path)
        
        if ast_entry and not ast_cache._validate_hash(file_path, file_hash):
            inconsistencies.append(f"Hash mismatch: {file_path}")
    
    return inconsistencies
```

## Intelligent Warming Strategies

### 1. Predictive Warming Algorithm

The intelligent warming system uses machine learning to optimize cache pre-loading:

**Access Pattern Learning**:
```python
class AccessPatternAnalyzer:
    def __init__(self):
        self.file_access_history = defaultdict(list)
        self.correlation_matrix = defaultdict(dict)
        self.temporal_patterns = defaultdict(list)
    
    def learn_access_pattern(self, file_path: str, context_files: Set[str]):
        """Learn file access patterns for predictive warming."""
        timestamp = time.time()
        
        # Record access
        self.file_access_history[file_path].append(timestamp)
        
        # Update correlations
        for context_file in context_files:
            self.correlation_matrix[file_path][context_file] = (
                self.correlation_matrix[file_path].get(context_file, 0) + 1
            )
        
        # Temporal pattern (hour of day)
        hour = datetime.fromtimestamp(timestamp).hour
        self.temporal_patterns[file_path].append(hour)
    
    def predict_next_access(self, file_path: str) -> Optional[float]:
        """Predict when file will be accessed next."""
        history = self.file_access_history[file_path]
        
        if len(history) < 3:
            return None
        
        # Calculate access intervals
        intervals = [history[i] - history[i-1] for i in range(1, len(history))]
        avg_interval = statistics.mean(intervals[-5:])  # Last 5 intervals
        
        return history[-1] + avg_interval
```

### 2. Dependency-Based Warming

**Smart Dependency Resolution**:
```python
class DependencyWarmer:
    def __init__(self, max_depth: int = 3):
        self.max_depth = max_depth
        self.import_cache = {}  # Cache import parsing
    
    async def warm_dependency_tree(self, root_files: List[str]) -> Dict[str, Any]:
        """Warm cache for file and all dependencies."""
        warmed_files = set()
        failed_files = set()
        
        for root_file in root_files:
            await self._warm_recursive(root_file, 0, warmed_files, failed_files)
        
        return {
            'warmed_count': len(warmed_files),
            'failed_count': len(failed_files),
            'dependency_depth_reached': self.max_depth
        }
    
    async def _warm_recursive(self, file_path: str, depth: int, 
                             warmed: Set[str], failed: Set[str]):
        """Recursively warm file and dependencies."""
        if depth > self.max_depth or file_path in warmed:
            return
        
        try:
            # Warm current file
            await self._warm_single_file(file_path)
            warmed.add(file_path)
            
            # Get dependencies
            dependencies = await self._get_file_dependencies(file_path)
            
            # Warm dependencies
            for dep_file in dependencies:
                await self._warm_recursive(dep_file, depth + 1, warmed, failed)
                
        except Exception as e:
            logger.warning(f"Failed to warm {file_path}: {e}")
            failed.add(file_path)
```

### 3. Memory-Aware Warming

**Adaptive Memory Management**:
```python
class MemoryAwareWarmer:
    def __init__(self, memory_limit_mb: int = 200):
        self.memory_limit_bytes = memory_limit_mb * 1024 * 1024
        self.process = psutil.Process()
    
    async def warm_with_memory_monitoring(self, files: List[str]) -> Dict[str, Any]:
        """Warm files while monitoring memory usage."""
        warmed_files = []
        memory_exceeded = False
        
        for file_path in files:
            # Check memory before warming
            current_memory = self.process.memory_info().rss
            
            if current_memory > self.memory_limit_bytes:
                logger.warning(f"Memory limit reached: {current_memory / 1024 / 1024:.1f}MB")
                memory_exceeded = True
                break
            
            # Warm file
            try:
                await self._warm_file(file_path)
                warmed_files.append(file_path)
            except Exception as e:
                logger.error(f"Warming failed for {file_path}: {e}")
        
        return {
            'files_warmed': len(warmed_files),
            'memory_limit_reached': memory_exceeded,
            'final_memory_mb': self.process.memory_info().rss / 1024 / 1024
        }
```

## Performance Optimization Techniques

### 1. Parallel Cache Operations

**Concurrent File Loading**:
```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

class ParallelCacheLoader:
    def __init__(self, max_workers: int = 8):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
    
    async def parallel_cache_load(self, file_paths: List[str]) -> Dict[str, Any]:
        """Load multiple files in parallel across cache levels."""
        
        # Create tasks for each cache level
        file_tasks = [
            asyncio.create_task(self._load_file_level(path)) 
            for path in file_paths
        ]
        
        ast_tasks = [
            asyncio.create_task(self._load_ast_level(path))
            for path in file_paths if path.endswith('.py')
        ]
        
        # Execute all tasks concurrently
        file_results = await asyncio.gather(*file_tasks, return_exceptions=True)
        ast_results = await asyncio.gather(*ast_tasks, return_exceptions=True)
        
        # Process results
        successful_loads = sum(1 for r in file_results if not isinstance(r, Exception))
        successful_ast = sum(1 for r in ast_results if not isinstance(r, Exception))
        
        return {
            'files_loaded': successful_loads,
            'asts_cached': successful_ast,
            'total_files': len(file_paths)
        }
```

### 2. Cache Hit Ratio Optimization

**Dynamic Cache Sizing**:
```python
class AdaptiveCacheManager:
    def __init__(self):
        self.performance_history = deque(maxlen=100)
        self.adjustment_threshold = 0.1  # 10% change threshold
    
    def optimize_cache_sizes(self) -> Dict[str, Any]:
        """Dynamically adjust cache sizes based on performance."""
        file_cache = get_global_cache()
        ast_cache = global_ast_cache
        
        # Get current performance metrics
        file_stats = file_cache.get_cache_stats()
        ast_stats = ast_cache.get_cache_statistics()
        
        current_performance = {
            'file_hit_rate': file_stats.hit_rate(),
            'ast_hit_rate': ast_stats['hit_rate_percent'] / 100,
            'timestamp': time.time()
        }
        
        self.performance_history.append(current_performance)
        
        adjustments = {}
        
        # Analyze trends
        if len(self.performance_history) >= 10:
            recent_avg = statistics.mean([
                p['file_hit_rate'] for p in list(self.performance_history)[-10:]
            ])
            
            older_avg = statistics.mean([
                p['file_hit_rate'] for p in list(self.performance_history)[-20:-10]
            ])
            
            # If hit rate is declining, increase cache size
            if older_avg - recent_avg > self.adjustment_threshold:
                new_size = min(file_cache.max_memory * 1.2, 150 * 1024 * 1024)
                adjustments['file_cache_size'] = new_size
            
            # If hit rate is stable and high, consider reducing size
            elif recent_avg > 0.95 and recent_avg - older_avg < 0.01:
                new_size = max(file_cache.max_memory * 0.9, 25 * 1024 * 1024)
                adjustments['file_cache_size'] = new_size
        
        return adjustments
```

### 3. Cache Performance Monitoring

**Real-time Performance Dashboard**:
```python
class CachePerformanceDashboard:
    def __init__(self):
        self.metrics_collector = MetricsCollector()
        self.alert_thresholds = {
            'min_hit_rate': 0.8,
            'max_memory_usage': 0.9,
            'max_eviction_rate': 0.1
        }
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get comprehensive cache performance summary."""
        file_cache = get_global_cache()
        ast_cache = global_ast_cache
        
        # Collect metrics from all cache levels
        metrics = {
            'file_cache': {
                'hit_rate': file_cache.get_cache_stats().hit_rate(),
                'memory_usage': file_cache.get_memory_usage(),
                'eviction_rate': self._calculate_eviction_rate(file_cache)
            },
            'ast_cache': {
                'hit_rate': ast_cache.get_cache_statistics()['hit_rate_percent'] / 100,
                'memory_usage_mb': ast_cache.get_cache_statistics()['memory_usage_mb'],
                'entry_count': ast_cache.get_cache_statistics()['entries_count']
            },
            'overall': {
                'combined_hit_rate': self._calculate_combined_hit_rate(),
                'memory_efficiency': self._calculate_memory_efficiency(),
                'performance_score': self._calculate_performance_score()
            }
        }
        
        # Check for performance alerts
        alerts = self._check_performance_alerts(metrics)
        metrics['alerts'] = alerts
        
        return metrics
    
    def _calculate_combined_hit_rate(self) -> float:
        """Calculate weighted average hit rate across all caches."""
        file_cache = get_global_cache()
        ast_cache = global_ast_cache
        
        file_stats = file_cache.get_cache_stats()
        ast_stats = ast_cache.get_cache_statistics()
        
        total_requests = (file_stats.hits + file_stats.misses + 
                         ast_stats['cache_hits'] + ast_stats['cache_misses'])
        
        if total_requests == 0:
            return 0.0
        
        total_hits = file_stats.hits + ast_stats['cache_hits']
        return total_hits / total_requests
```

## Environment-Specific Configurations

### 1. Development Environment

**Interactive Development Optimization**:
```python
DEVELOPMENT_CONFIG = {
    'file_cache': {
        'max_memory_mb': 75,
        'prefetch_dependencies': True,
        'aggressive_warming': True
    },
    'ast_cache': {
        'max_size_mb': 500,
        'enable_persistence': True,  # For fast restarts
        'warm_on_startup': True
    },
    'incremental_cache': {
        'retention_hours': 12,
        'max_results': 5000,
        'real_time_updates': True
    },
    'warming_strategy': {
        'dependency_depth': 3,
        'parallel_workers': 4,
        'predictive_prefetch': True
    }
}
```

### 2. Production Environment

**High-Performance Production Setup**:
```python
PRODUCTION_CONFIG = {
    'file_cache': {
        'max_memory_mb': 150,  # Higher limits for performance
        'memory_pressure_threshold': 0.7,  # Conservative
        'enable_monitoring': True
    },
    'ast_cache': {
        'max_size_mb': 1000,  # Large cache for production
        'enable_compression': True,
        'persistence_location': '/var/cache/analyzer',
        'backup_interval_hours': 6
    },
    'incremental_cache': {
        'retention_hours': 48,  # Longer retention
        'max_results': 10000,
        'enable_analytics': True
    },
    'monitoring': {
        'metrics_collection_interval': 60,
        'performance_alerting': True,
        'auto_optimization': True
    }
}
```

### 3. CI/CD Environment

**Resource-Constrained CI Optimization**:
```python
CI_CD_CONFIG = {
    'file_cache': {
        'max_memory_mb': 50,  # Limited resources
        'memory_pressure_threshold': 0.6,
        'quick_eviction': True
    },
    'ast_cache': {
        'max_size_mb': 200,
        'disable_persistence': True,  # Temporary environment
        'fast_startup': True
    },
    'incremental_cache': {
        'retention_hours': 2,  # Short pipeline duration
        'max_results': 1000,
        'focus_on_changes': True
    },
    'warming_strategy': {
        'changed_files_only': True,
        'dependency_depth': 1,  # Immediate deps only
        'time_limit_seconds': 300  # 5 minute timeout
    }
}
```

## Troubleshooting Common Issues

### 1. High Memory Usage

**Diagnostic Steps**:
```python
def diagnose_memory_issues():
    """Comprehensive memory usage analysis."""
    file_cache = get_global_cache()
    ast_cache = global_ast_cache
    
    # Collect memory metrics
    file_memory = file_cache.get_memory_usage()
    ast_memory = ast_cache.get_cache_statistics()
    
    # System memory
    process = psutil.Process()
    system_memory = process.memory_info()
    
    diagnosis = {
        'file_cache_mb': file_memory['file_cache_bytes'] / 1024 / 1024,
        'ast_cache_mb': ast_memory['memory_usage_mb'],
        'total_system_mb': system_memory.rss / 1024 / 1024,
        'cache_overhead_percent': (
            (file_memory['file_cache_bytes'] + ast_memory['memory_usage_mb'] * 1024 * 1024) /
            system_memory.rss * 100
        )
    }
    
    # Recommendations
    recommendations = []
    if diagnosis['cache_overhead_percent'] > 50:
        recommendations.append("Cache using >50% of memory - consider reducing cache sizes")
    
    if diagnosis['file_cache_mb'] > 100:
        recommendations.append("File cache exceeding 100MB - enable more aggressive eviction")
    
    diagnosis['recommendations'] = recommendations
    return diagnosis
```

### 2. Poor Hit Rates

**Hit Rate Analysis and Improvement**:
```python
def analyze_hit_rates():
    """Analyze and improve cache hit rates."""
    file_cache = get_global_cache()
    ast_cache = global_ast_cache
    
    # Get detailed statistics
    file_stats = file_cache.get_cache_stats()
    ast_stats = ast_cache.get_cache_statistics()
    
    analysis = {
        'file_cache_hit_rate': file_stats.hit_rate(),
        'ast_cache_hit_rate': ast_stats['hit_rate_percent'] / 100,
        'improvement_opportunities': []
    }
    
    # Identify improvement opportunities
    if analysis['file_cache_hit_rate'] < 0.9:
        analysis['improvement_opportunities'].append({
            'issue': 'Low file cache hit rate',
            'suggestions': [
                'Increase cache memory limit',
                'Implement intelligent prefetching',
                'Reduce eviction pressure'
            ]
        })
    
    if analysis['ast_cache_hit_rate'] < 0.8:
        analysis['improvement_opportunities'].append({
            'issue': 'Low AST cache hit rate',
            'suggestions': [
                'Enable cache warming on startup',
                'Increase AST cache size',
                'Improve cache invalidation strategy'
            ]
        })
    
    return analysis
```

### 3. Cache Coherence Issues

**Consistency Validation and Repair**:
```python
def validate_and_repair_cache_consistency():
    """Validate cache consistency and repair issues."""
    file_cache = get_global_cache()
    ast_cache = global_ast_cache
    incremental_cache = get_global_incremental_cache()
    
    issues = []
    repairs = []
    
    # Check file vs AST cache consistency
    for file_path in file_cache._cache.keys():
        file_entry = file_cache._cache[file_path]
        ast_exists = ast_cache.get_ast(file_path) is not None
        
        if ast_exists:
            # Validate content hash consistency
            ast_key = ast_cache._generate_cache_key(Path(file_path), "ast")
            if ast_key in ast_cache.memory_cache:
                ast_entry = ast_cache.memory_cache[ast_key]
                
                # Check if file modification invalidates AST
                if not ast_entry.is_valid():
                    issues.append(f"Stale AST cache for {file_path}")
                    ast_cache.invalidate_file(file_path)
                    repairs.append(f"Invalidated stale AST for {file_path}")
    
    return {
        'issues_found': len(issues),
        'repairs_made': len(repairs),
        'details': {
            'issues': issues,
            'repairs': repairs
        }
    }
```

## Performance Benchmarking

### 1. Cache Performance Testing

**Comprehensive Benchmark Suite**:
```python
class CacheBenchmarkSuite:
    def __init__(self):
        self.test_files = self._discover_test_files()
        self.baseline_metrics = {}
    
    async def run_full_benchmark(self) -> Dict[str, Any]:
        """Run comprehensive cache performance benchmark."""
        
        # Test 1: Cold start performance
        cold_start_results = await self._benchmark_cold_start()
        
        # Test 2: Warm cache performance  
        warm_cache_results = await self._benchmark_warm_cache()
        
        # Test 3: Memory pressure handling
        memory_pressure_results = await self._benchmark_memory_pressure()
        
        # Test 4: Concurrent access performance
        concurrency_results = await self._benchmark_concurrency()
        
        # Test 5: Cache warming effectiveness
        warming_results = await self._benchmark_cache_warming()
        
        return {
            'cold_start': cold_start_results,
            'warm_cache': warm_cache_results,
            'memory_pressure': memory_pressure_results,
            'concurrency': concurrency_results,
            'cache_warming': warming_results,
            'overall_score': self._calculate_overall_score([
                cold_start_results, warm_cache_results, memory_pressure_results,
                concurrency_results, warming_results
            ])
        }
```

## Best Practices Summary

### 1. Configuration Guidelines

- **Memory Allocation**: Allocate 10-15% of available RAM to caching
- **Cache Sizing**: File cache: 50-150MB, AST cache: 500-1000MB
- **Eviction Thresholds**: Conservative (70-80%) for production
- **Monitoring**: Enable performance metrics collection

### 2. Development Workflow Integration

- **Startup Warming**: Warm frequently accessed files on application start
- **Dependency Tracking**: Use AST analysis for intelligent dependency caching
- **Incremental Updates**: Leverage delta caching for iterative development
- **Cross-Session Persistence**: Enable for faster development cycles

### 3. Production Deployment

- **Resource Monitoring**: Track memory usage and hit rates
- **Adaptive Sizing**: Automatically adjust cache sizes based on usage
- **Failsafe Mechanisms**: Graceful degradation under memory pressure
- **Performance Alerting**: Monitor for cache performance degradation

---

This guide provides a comprehensive foundation for optimizing cache performance across all use cases while maintaining system stability and resource efficiency.