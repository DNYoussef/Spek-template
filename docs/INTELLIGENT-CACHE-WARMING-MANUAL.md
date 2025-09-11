# Intelligent Cache Warming Manual

## Overview

The Intelligent Cache Warming system provides predictive, machine learning-driven cache optimization that adapts to access patterns and maximizes cache hit rates through strategic pre-loading of frequently accessed files and their dependencies.

## Architecture Components

### 1. Access Pattern Tracking

**Pattern Recognition Engine**:
```python
@dataclass
class AccessPattern:
    file_path: str
    access_frequency: int = 0
    last_access_time: float = field(default_factory=time.time)
    access_times: deque = field(default_factory=lambda: deque(maxlen=50))
    co_accessed_files: Dict[str, int] = field(default_factory=dict)
    seasonal_patterns: Dict[str, int] = field(default_factory=dict)
    
    def predict_next_access(self) -> Optional[float]:
        # Calculate average interval between accesses
        intervals = []
        for i in range(1, len(self.access_times)):
            intervals.append(self.access_times[i] - self.access_times[i-1])
        
        if intervals:
            avg_interval = statistics.mean(intervals)
            return self.last_access_time + avg_interval
```

**Key Features**:
- **Frequency Tracking**: Records access count and timing patterns
- **Co-access Analysis**: Identifies files accessed together
- **Seasonal Patterns**: Hour-of-day usage pattern recognition
- **Predictive Modeling**: Next access time estimation

### 2. Dependency Graph Analysis

**Import Resolution Engine**:
```python
async def _extract_python_imports(self, file_path: str) -> Set[str]:
    """Extract imported file paths from Python file."""
    dependencies = set()
    
    # Parse AST for import statements
    tree = ast.parse(content)
    base_dir = Path(file_path).parent
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                module_path = self._resolve_module_path(alias.name, base_dir)
                if module_path:
                    dependencies.add(str(module_path))
        
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                module_path = self._resolve_module_path(node.module, base_dir)
                if module_path:
                    dependencies.add(str(module_path))
    
    return dependencies
```

**Dependency Features**:
- **Static Analysis**: AST-based import extraction
- **Module Resolution**: Handles relative and absolute imports
- **Circular Detection**: Prevents infinite dependency loops
- **Configurable Depth**: 1-5 levels of dependency following

### 3. Warming Strategy Configuration

**Strategy Parameters**:
```python
@dataclass 
class WarmingStrategy:
    name: str
    priority_files: List[str] = field(default_factory=list)
    dependency_depth: int = 2  # How deep to follow dependencies
    parallel_workers: int = 4
    batch_size: int = 50
    predictive_prefetch: bool = True
    access_pattern_learning: bool = True
    memory_pressure_threshold: float = 0.8  # Stop warming at 80% memory
```

**Configuration Guidelines**:
- **dependency_depth**: Higher values increase thoroughness but consume more memory
- **parallel_workers**: Match to available CPU cores (1-16)
- **batch_size**: Larger batches improve efficiency but increase memory usage
- **memory_pressure_threshold**: Conservative values prevent memory issues

## Implementation Guide

### 1. Basic Warming Setup

```python
from analyzer.performance.cache_performance_profiler import (
    IntelligentCacheWarmer, WarmingStrategy
)

# Initialize cache warmer
cache_warmer = IntelligentCacheWarmer(
    file_cache=get_global_cache(),
    ast_cache=global_ast_cache,
    incremental_cache=get_global_incremental_cache()
)

# Define warming strategy
strategy = WarmingStrategy(
    name="development_warming",
    priority_files=["src/main.py", "src/core/*.py"],
    dependency_depth=3,
    parallel_workers=6,
    predictive_prefetch=True
)

# Execute warming
results = await cache_warmer.warm_cache_intelligently(strategy)
```

### 2. Access Pattern Learning

**Track File Access**:
```python
# Track access for pattern learning
cache_warmer.track_access(
    file_path="src/analyzer.py",
    co_accessed_files={"src/detector.py", "src/utils.py"}
)

# Access patterns are automatically learned and used for prediction
```

**Pattern Analysis**:
```python
# Get access patterns for analysis
patterns = cache_warmer.access_patterns

for file_path, pattern in patterns.items():
    next_access = pattern.predict_next_access()
    if next_access and (next_access - time.time()) < 3600:  # Within 1 hour
        print(f"File {file_path} likely to be accessed soon")
```

### 3. Advanced Warming Strategies

**Production Warming Strategy**:
```python
production_strategy = WarmingStrategy(
    name="production_high_performance",
    priority_files=get_most_accessed_files(),  # From access logs
    dependency_depth=2,  # Balanced performance/memory
    parallel_workers=8,
    batch_size=100,
    predictive_prefetch=True,
    memory_pressure_threshold=0.7  # Conservative for production
)
```

**Development Warming Strategy**:
```python
development_strategy = WarmingStrategy(
    name="development_fast_iteration",
    priority_files=["tests/*.py", "src/*.py"],
    dependency_depth=3,  # Include test dependencies
    parallel_workers=4,
    batch_size=25,  # Smaller batches for responsiveness
    predictive_prefetch=True,
    memory_pressure_threshold=0.8
)
```

## Performance Tuning

### 1. Memory Optimization

**Monitor Memory Usage**:
```python
# Check memory pressure during warming
memory_pressure = cache_warmer._check_memory_pressure()
print(f"Current memory pressure: {memory_pressure:.1%}")

if memory_pressure > 0.8:
    print("Warning: High memory pressure, consider reducing batch size")
```

**Adaptive Batch Sizing**:
```python
# Adjust batch size based on memory pressure
def adaptive_batch_size(base_size: int, memory_pressure: float) -> int:
    if memory_pressure > 0.8:
        return base_size // 2
    elif memory_pressure < 0.5:
        return min(base_size * 2, 200)  # Cap at 200
    return base_size
```

### 2. Performance Monitoring

**Warming Progress Tracking**:
```python
def warming_progress_callback(current: int, total: int):
    percent = (current / total) * 100
    print(f"Cache warming progress: {current}/{total} ({percent:.1f}%)")
    
    # Log performance metrics
    logger.info(f"Warming progress: {percent:.1f}% complete")

# Use callback in warming
results = await cache_warmer.warm_cache_intelligently(
    strategy, 
    progress_callback=warming_progress_callback
)
```

**Performance Metrics Analysis**:
```python
# Analyze warming results
print(f"Files warmed: {results['files_warmed']}")
print(f"Warming time: {results['warming_time_ms']}ms")
print(f"Memory used: {results['memory_used_mb']:.1f}MB")
print(f"Predictive accuracy: {results['predictive_accuracy']:.1%}")
```

### 3. Cache Hit Rate Optimization

**Before/After Analysis**:
```python
# Measure cache performance before warming
initial_stats = file_cache.get_cache_stats()
initial_hit_rate = initial_stats.hit_rate()

# Perform warming
await cache_warmer.warm_cache_intelligently(strategy)

# Measure improvement
final_stats = file_cache.get_cache_stats()
final_hit_rate = final_stats.hit_rate()

improvement = final_hit_rate - initial_hit_rate
print(f"Cache hit rate improvement: {improvement:.1%}")
```

## Integration Patterns

### 1. Startup Warming

**Application Initialization**:
```python
async def initialize_application():
    # Initialize cache systems
    file_cache = get_global_cache()
    ast_cache = global_ast_cache
    
    # Create intelligent warmer
    cache_warmer = IntelligentCacheWarmer(file_cache, ast_cache)
    
    # Warm critical paths
    startup_strategy = WarmingStrategy(
        name="application_startup",
        priority_files=get_critical_files(),
        dependency_depth=2,
        parallel_workers=4
    )
    
    # Execute warming in background
    asyncio.create_task(
        cache_warmer.warm_cache_intelligently(startup_strategy)
    )
```

### 2. Continuous Learning Integration

**Access Pattern Collection**:
```python
class AnalyzerWithLearning:
    def __init__(self):
        self.cache_warmer = IntelligentCacheWarmer()
        self.current_session_files = set()
    
    def analyze_file(self, file_path: str):
        # Track access for learning
        self.cache_warmer.track_access(
            file_path, 
            co_accessed_files=self.current_session_files
        )
        
        self.current_session_files.add(file_path)
        
        # Perform analysis
        return self._do_analysis(file_path)
```

### 3. CI/CD Integration

**Pipeline Warming**:
```python
# CI/CD cache warming script
async def ci_cache_warming():
    # Load changed files from git
    changed_files = get_git_changed_files()
    
    # Create targeted warming strategy
    ci_strategy = WarmingStrategy(
        name="ci_pipeline_warming",
        priority_files=changed_files,
        dependency_depth=2,  # Include immediate dependencies
        parallel_workers=min(8, cpu_count()),
        memory_pressure_threshold=0.6  # Conservative for CI
    )
    
    # Warm caches for faster analysis
    results = await cache_warmer.warm_cache_intelligently(ci_strategy)
    
    print(f"CI cache warming completed: {results['files_warmed']} files")
```

## Machine Learning Features

### 1. Access Correlation Analysis

**File Correlation Detection**:
```python
def analyze_file_correlations():
    correlations = {}
    
    for file_path, pattern in cache_warmer.access_patterns.items():
        # Find files frequently accessed together
        for co_file, count in pattern.co_accessed_files.items():
            if count >= 5:  # Threshold for strong correlation
                correlation_strength = count / pattern.access_frequency
                correlations[(file_path, co_file)] = correlation_strength
    
    return correlations
```

**Predictive Warming Based on Correlations**:
```python
def predictive_warming(recently_accessed_file: str):
    correlations = analyze_file_correlations()
    
    # Find files likely to be accessed next
    candidates = []
    for (file1, file2), strength in correlations.items():
        if file1 == recently_accessed_file and strength > 0.5:
            candidates.append((file2, strength))
    
    # Sort by correlation strength and warm top candidates
    candidates.sort(key=lambda x: x[1], reverse=True)
    
    for file_path, strength in candidates[:10]:  # Top 10
        # Warm file if not already cached
        if not cache_warmer.file_cache.get_file_content(file_path):
            cache_warmer.file_cache.get_file_content(file_path)
```

### 2. Temporal Pattern Recognition

**Seasonal Pattern Analysis**:
```python
def analyze_seasonal_patterns():
    hourly_patterns = defaultdict(list)
    
    for file_path, pattern in cache_warmer.access_patterns.items():
        for hour, count in pattern.seasonal_patterns.items():
            hourly_patterns[int(hour)].append((file_path, count))
    
    # Identify peak hours for different files
    current_hour = datetime.now().hour
    peak_files = hourly_patterns.get(current_hour, [])
    
    # Sort by access frequency during this hour
    peak_files.sort(key=lambda x: x[1], reverse=True)
    
    return peak_files[:20]  # Top 20 files for current hour
```

## Troubleshooting Guide

### 1. Common Issues

**High Memory Usage**:
```python
# Diagnose memory issues
memory_usage = cache_warmer.file_cache.get_memory_usage()
print(f"Cache memory: {memory_usage['file_cache_bytes'] / 1024 / 1024:.1f}MB")
print(f"Utilization: {memory_usage['utilization_percent']:.1f}%")

# Reduce memory pressure
if memory_usage['utilization_percent'] > 90:
    # Reduce batch size or dependency depth
    strategy.batch_size = min(strategy.batch_size, 25)
    strategy.dependency_depth = min(strategy.dependency_depth, 2)
```

**Slow Warming Performance**:
```python
# Profile warming bottlenecks
warming_stats = cache_warmer.warming_stats
print(f"Average warming time: {warming_stats['total_warming_time_ms'] / warming_stats['warming_sessions']:.1f}ms")

# Optimize parallel workers
optimal_workers = min(8, multiprocessing.cpu_count())
strategy.parallel_workers = optimal_workers
```

**Low Predictive Accuracy**:
```python
# Check access pattern quality
total_predictions = (
    cache_warmer.warming_stats["predictive_hits"] + 
    cache_warmer.warming_stats["predictive_misses"]
)

if total_predictions > 0:
    accuracy = cache_warmer.warming_stats["predictive_hits"] / total_predictions
    print(f"Predictive accuracy: {accuracy:.1%}")
    
    if accuracy < 0.7:
        # Need more learning data or pattern refinement
        print("Consider running longer learning periods")
```

### 2. Performance Debugging

**Detailed Timing Analysis**:
```python
import cProfile
import pstats

def profile_warming():
    profiler = cProfile.Profile()
    profiler.enable()
    
    # Execute warming
    results = await cache_warmer.warm_cache_intelligently(strategy)
    
    profiler.disable()
    stats = pstats.Stats(profiler)
    stats.sort_stats('cumulative').print_stats(20)
    
    return results
```

**Memory Leak Detection**:
```python
import tracemalloc

def detect_memory_leaks():
    tracemalloc.start()
    
    # Run multiple warming cycles
    for i in range(10):
        await cache_warmer.warm_cache_intelligently(strategy)
        cache_warmer.file_cache.clear_cache()  # Reset between runs
        
        current, peak = tracemalloc.get_traced_memory()
        print(f"Cycle {i}: Current={current / 1024 / 1024:.1f}MB, Peak={peak / 1024 / 1024:.1f}MB")
    
    tracemalloc.stop()
```

## Best Practices

### 1. Strategy Selection

**Development Environment**:
- Higher dependency depth (3-4) for comprehensive warming
- Smaller batch sizes (25-50) for responsiveness
- More parallel workers if sufficient resources

**Production Environment**:
- Conservative memory thresholds (0.6-0.7)
- Larger batch sizes (75-100) for efficiency
- Monitor and adjust based on usage patterns

**CI/CD Environment**:
- Focus on changed files and immediate dependencies
- Time-bounded warming with timeouts
- Minimal memory footprint

### 2. Monitoring and Alerting

**Key Metrics to Monitor**:
```python
def monitoring_dashboard():
    stats = cache_warmer.warming_stats
    
    metrics = {
        'files_warmed_per_session': stats['files_warmed'] / max(stats['warming_sessions'], 1),
        'average_warming_time_ms': stats['total_warming_time_ms'] / max(stats['warming_sessions'], 1),
        'cache_misses_prevented': stats['cache_misses_prevented'],
        'predictive_accuracy': cache_warmer._calculate_predictive_accuracy()
    }
    
    # Alert if metrics degrade
    if metrics['predictive_accuracy'] < 0.7:
        logger.warning(f"Low predictive accuracy: {metrics['predictive_accuracy']:.1%}")
    
    return metrics
```

### 3. Configuration Management

**Environment-Specific Configs**:
```python
WARMING_CONFIGS = {
    'development': {
        'dependency_depth': 3,
        'parallel_workers': 4,
        'batch_size': 25,
        'memory_threshold': 0.8
    },
    'staging': {
        'dependency_depth': 2,
        'parallel_workers': 6,
        'batch_size': 50,
        'memory_threshold': 0.7
    },
    'production': {
        'dependency_depth': 2,
        'parallel_workers': 8,
        'batch_size': 75,
        'memory_threshold': 0.6
    }
}

def create_environment_strategy(env: str) -> WarmingStrategy:
    config = WARMING_CONFIGS[env]
    
    return WarmingStrategy(
        name=f"{env}_warming",
        dependency_depth=config['dependency_depth'],
        parallel_workers=config['parallel_workers'],
        batch_size=config['batch_size'],
        memory_pressure_threshold=config['memory_threshold']
    )
```

---

This manual provides comprehensive guidance for implementing and optimizing intelligent cache warming. The system adapts to usage patterns and provides significant performance improvements through predictive cache optimization.