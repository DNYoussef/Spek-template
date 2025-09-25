#!/usr/bin/env python3
"""
Performance Measurement Service
Extracted from Phase3PerformanceValidator (2,007 LOC -> 250 LOC)

Delegation Pattern: Handles all performance measurement and metrics collection.
"""

import time
import gc
import psutil
from contextlib import contextmanager
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional

@dataclass
class PerformanceMetrics:
    """Container for performance measurement results."""
    execution_time_ms: float
    memory_usage_mb: float
    peak_memory_mb: float
    throughput: Optional[float] = None
    hit_rate: Optional[float] = None
    efficiency_improvement: Optional[float] = None
    additional_metrics: Dict[str, Any] = field(default_factory=dict)

class PerformanceMeasurementService:
    """Service for accurate performance measurements with NASA-grade precision."""
    
    def __init__(self):
        """Initialize performance measurement service."""
        self.process = psutil.Process()
        self.measurement_history: List[PerformanceMetrics] = []
        
        # Performance targets from Phase 3 analysis
        self.targets = {
            'cache_hit_rate': 96.7,
            'aggregation_throughput': 36953,
            'ast_traversal_reduction': 54.55,
            'memory_efficiency_improvement': 43.0,
            'cumulative_improvement': 58.3,
            'thread_contention_reduction': 73.0
        }
    
    @contextmanager
    def measure_execution(self):
        """Context manager for measuring execution time and memory with high precision."""
        gc.collect()  # Clean garbage before measurement for accuracy
        
        start_time = time.perf_counter()
        try:
            start_memory = self.process.memory_info().rss / 1024 / 1024
        except:
            start_memory = 0.0
        
        metrics = PerformanceMetrics(0.0, 0.0, 0.0)
        
        try:
            yield metrics
        finally:
            end_time = time.perf_counter()
            try:
                end_memory = self.process.memory_info().rss / 1024 / 1024
            except:
                end_memory = start_memory
            
            metrics.execution_time_ms = (end_time - start_time) * 1000
            metrics.memory_usage_mb = end_memory - start_memory
            metrics.peak_memory_mb = max(start_memory, end_memory)
            
            self.measurement_history.append(metrics)
    
    def measure_cache_performance(self, cache_instance) -> PerformanceMetrics:
        """Measure cache hit rate and efficiency."""
        with self.measure_execution() as metrics:
            # Simulate cache operations
            hits = 0
            total = 100
            
            for i in range(total):
                result = cache_instance.get_file_content(f"file_{i % 20}.py")
                if result is not None:
                    hits += 1
            
            metrics.hit_rate = (hits / total) * 100
            metrics.efficiency_improvement = max(0, 
                (metrics.hit_rate - self.targets['cache_hit_rate']) / self.targets['cache_hit_rate'] * 100
            )
        
        return metrics
    
    def measure_aggregation_throughput(self, aggregator) -> PerformanceMetrics:
        """Measure result aggregation throughput."""
        with self.measure_execution() as metrics:
            violations_processed = 0
            test_violations = [f"violation_{i}" for i in range(1000)]
            
            start = time.perf_counter()
            for violation in test_violations:
                aggregator.process_violation(violation)
                violations_processed += 1
            end = time.perf_counter()
            
            processing_time = end - start
            metrics.throughput = violations_processed / processing_time if processing_time > 0 else 0
            
        return metrics
    
    def measure_ast_traversal_efficiency(self, visitor_instance) -> PerformanceMetrics:
        """Measure AST traversal reduction efficiency."""
        with self.measure_execution() as metrics:
            # Simulate AST traversal operations
            nodes_visited = visitor_instance.traverse_sample_ast()
            baseline_nodes = 10000  # Baseline expectation
            
            reduction_percentage = ((baseline_nodes - nodes_visited) / baseline_nodes) * 100
            metrics.efficiency_improvement = reduction_percentage
            
        return metrics
    
    def calculate_cumulative_improvement(self) -> float:
        """Calculate cumulative performance improvement across all measured components."""
        if not self.measurement_history:
            return 0.0
        
        improvements = []
        for metrics in self.measurement_history[-10:]:  # Last 10 measurements
            if metrics.efficiency_improvement is not None:
                improvements.append(metrics.efficiency_improvement)
        
        return sum(improvements) / len(improvements) if improvements else 0.0
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get comprehensive performance summary."""
        if not self.measurement_history:
            return {"status": "no_measurements", "summary": {}}
        
        recent_metrics = self.measurement_history[-1]
        
        return {
            "status": "active",
            "total_measurements": len(self.measurement_history),
            "latest_metrics": {
                "execution_time_ms": recent_metrics.execution_time_ms,
                "memory_usage_mb": recent_metrics.memory_usage_mb,
                "peak_memory_mb": recent_metrics.peak_memory_mb,
                "throughput": recent_metrics.throughput,
                "hit_rate": recent_metrics.hit_rate,
                "efficiency_improvement": recent_metrics.efficiency_improvement
            },
            "cumulative_improvement": self.calculate_cumulative_improvement(),
            "targets_met": self._check_targets_compliance(recent_metrics)
        }
    
    def _check_targets_compliance(self, metrics: PerformanceMetrics) -> Dict[str, bool]:
        """Check if performance metrics meet NASA-grade targets."""
        compliance = {}
        
        if metrics.hit_rate is not None:
            compliance['cache_hit_rate'] = metrics.hit_rate >= self.targets['cache_hit_rate']
        
        if metrics.throughput is not None:
            compliance['aggregation_throughput'] = metrics.throughput >= self.targets['aggregation_throughput']
        
        if metrics.efficiency_improvement is not None:
            compliance['ast_efficiency'] = metrics.efficiency_improvement >= self.targets['ast_traversal_reduction']
        
        return compliance
    
    def export_measurements(self, format_type: str = "json") -> str:
        """Export measurement data for analysis."""
        if format_type == "json":
            import json
            data = {
                "measurement_count": len(self.measurement_history),
                "performance_targets": self.targets,
                "measurements": [
                    {
                        "execution_time_ms": m.execution_time_ms,
                        "memory_usage_mb": m.memory_usage_mb,
                        "peak_memory_mb": m.peak_memory_mb,
                        "throughput": m.throughput,
                        "hit_rate": m.hit_rate,
                        "efficiency_improvement": m.efficiency_improvement
                    } for m in self.measurement_history
                ]
            }
            return json.dumps(data, indent=2)
        
        return "Format not supported"

# Version & Run Log Footer
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-24T15:35:00-04:00 | coder@Sonnet | Extracted performance measurement service from god object | performance_measurement_service.py | OK | Delegation pattern 250 LOC | 0.03 | f1e2d3c |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: phase2-perf-measurement
- inputs: ["Phase3PerformanceValidator"]
- tools_used: ["delegation_pattern", "ast_analysis"]
- versions: {"model":"sonnet-4","prompt":"phase2-decomp-v1"}
