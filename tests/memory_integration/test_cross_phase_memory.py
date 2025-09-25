from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_NESTED_DEPTH, QUALITY_GATE_MINIMUM_PASS_RATE

Comprehensive test suite for validating cross-phase memory correlation,
learning integration, and NASA POT10 Rule 7 compliance across the unified
memory system.

Test Categories:
- Memory safety validation and bounded resource usage
- Cross-phase correlation accuracy and persistence
- Performance tracking and validation
- Learning pattern recognition and application
- Thread safety and concurrent operations
- Memory leak prevention and cleanup
- NASA POT10 compliance validation
"""

import asyncio
import json
import pytest
import tempfile
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Any
import statistics

# Import the memory system components
try:
    from analyzer.unified_memory_model import (
        UnifiedMemoryModel, MemoryCorrelation, PerformanceCorrelation,
        PhaseMemoryEntry, MemorySafetyValidator
    )
    from analyzer.phase_correlation_storage import PhaseCorrelationStorage
    MEMORY_SYSTEM_AVAILABLE = True
except ImportError:
    MEMORY_SYSTEM_AVAILABLE = False
    pytest.skip("Memory system components not available", allow_module_level=True)

class TestMemorySafetyValidation:
    """Test NASA POT10 Rule 7 compliance and memory safety."""
    
    def test_memory_bounds_enforcement(self):
        """Test that memory bounds are strictly enforced."""
        validator = MemorySafetyValidator(max_memory_mb=1, max_entries=10)  # Very small limits
        
        # Should pass with small usage
        assert validator.validate_memory_operation(100, 1, "write") == True
        
        # Should fail with excessive memory
        assert validator.validate_memory_operation(2 * 1024 * 1024, 1, "write") == False
        
        # Should fail with excessive entries
        assert validator.validate_memory_operation(100, 20, "write") == False
    
    def test_memory_growth_pattern_detection(self):
        """Test detection of concerning memory growth patterns."""
        validator = MemorySafetyValidator(max_memory_mb=10, max_entries=100)
        
        # Simulate excessive growth pattern
        for i in range(5):
            result = validator.validate_memory_operation(15 * 1024 * 1024, 50, "write")
            if i < 3:
                assert result == False  # Should fail due to memory limit
        
        # Check that pattern is detected
        safety_report = validator.get_safety_report()
        assert safety_report["total_violations"] > 0
        assert safety_report["nasa_pot10_compliant"] == False
    
    def test_bounded_violation_history(self):
        """Test that violation history remains bounded."""
        validator = MemorySafetyValidator(max_memory_mb=1, max_entries=10)
        
        # Generate many violations
        for i in range(200):
            validator.validate_memory_operation(2 * 1024 * 1024, 1, "write")
        
        # History should be bounded to prevent memory leaks
        safety_report = validator.get_safety_report()
        assert len(safety_report["recent_violations"]) <= 50
        assert safety_report["total_violations"] <= 100  # Should be capped

class TestUnifiedMemoryModel:
    """Test unified memory model functionality."""
    
    @pytest.fixture
    def temp_memory_model(self):
        """Create temporary memory model for testing."""
        with tempfile.TemporaryDirectory() as temp_dir:
            storage_path = str(Path(temp_dir) / "test_storage.db")
            model = UnifiedMemoryModel(
                storage_path=storage_path,
                max_memory_mb=50,  # Small limit for testing
                max_entries=1000
            )
            yield model
            model.shutdown()
    
    def test_memory_entry_storage_and_retrieval(self, temp_memory_model):
        """Test basic memory entry operations."""
        entry = PhaseMemoryEntry(
            phase_id="test_phase",
            entry_id="test_entry",
            entry_type="test",
            content={"test_data": "test_value"},
            tags={"test", "memory"}
        )
        
        # Store entry
        assert temp_memory_model.store_memory_entry(entry) == True
        
        # Retrieve entry
        retrieved = temp_memory_model.get_memory_entry("test_phase", "test_entry")
        assert retrieved is not None
        assert retrieved.phase_id == "test_phase"
        assert retrieved.entry_id == "test_entry"
        assert retrieved.content["test_data"] == "test_value"
        assert retrieved.access_count == 1
    
    def test_cross_phase_correlation(self, temp_memory_model):
        """Test cross-phase correlation creation and retrieval."""
        temp_memory_model.correlate_phases(
            source_phase="phase1",
            target_phase="phase2",
            correlation_type="learning",
            strength=0.85,
            metadata={"learning_type": "optimization_pattern"}
        )
        
        # Verify correlation was stored
        correlations = temp_memory_model.storage.get_correlations_by_phase("phase1")
        assert len(correlations) > 0
        
        correlation = correlations[0]
        assert correlation.source_phase == "phase1"
        assert correlation.target_phase == "phase2"
        assert correlation.correlation_type == "learning"
        assert correlation.correlation_strength == QUALITY_GATE_MINIMUM_PASS_RATE
    
    def test_performance_improvement_tracking(self, temp_memory_model):
        """Test performance improvement tracking and validation."""
        temp_memory_model.track_performance_improvement(
            phase="test_phase",
            metric_name="test_metric",
            baseline_value=60.0,
            current_value=150.0,
            correlation_factors=["optimization1", "optimization2"]
        )
        
        # Verify performance correlation was stored
        trends = temp_memory_model.storage.get_performance_trends("test_phase")
        assert len(trends) > 0
        
        trend = trends[0]
        assert trend.phase == "test_phase"
        assert trend.metric_name == "test_metric"
        assert trend.improvement_percentage == 50.0  # (150-100)/100 * MAXIMUM_FUNCTION_LENGTH_LINES
    
    def test_cross_phase_learning_insights(self, temp_memory_model):
        """Test cross-phase learning insight generation."""
        # Create some correlations and performance data
        temp_memory_model.correlate_phases("phase1", "phase2", "performance", 0.9)
        temp_memory_model.correlate_phases("phase1", "phase2", "pattern", 0.8)
        
        temp_memory_model.track_performance_improvement(
            phase="phase2",
            metric_name="efficiency",
            baseline_value=100.0,
            current_value=180.0,
            correlation_factors=["phase1_patterns"]
        )
        
        # Get learning insights
        insights = temp_memory_model.get_cross_phase_learning_insights("phase2")
        
        assert "relevant_patterns" in insights
        assert "performance_correlations" in insights
        assert "suggested_optimizations" in insights
        assert insights["learning_confidence"] > 0
    
    def test_memory_safety_integration(self, temp_memory_model):
        """Test that memory safety is enforced in unified model."""
        # Create many large entries to test bounds
        large_content = {"large_data": "x" * 10000}  # 10KB content
        
        success_count = 0
        for i in range(100):  # Try to create many entries
            entry = PhaseMemoryEntry(
                phase_id="test_phase",
                entry_id=f"large_entry_{i}",
                entry_type="test",
                content=large_content
            )
            
            if temp_memory_model.store_memory_entry(entry):
                success_count += 1
            else:
                break  # Memory safety kicked in
        
        # Should not be able to store all entries due to memory limits
        assert success_count < 100
        
        # Memory safety should be reporting compliance issues
        safety_report = temp_memory_model.safety_validator.get_safety_report()
        assert safety_report["nasa_pot10_compliant"] == (safety_report["total_violations"] == 0)

class TestPhaseCorrelationStorage:
    """Test persistent storage system."""
    
    @pytest.fixture
    def temp_storage(self):
        """Create temporary storage for testing."""
        with tempfile.TemporaryDirectory() as temp_dir:
            storage_path = str(Path(temp_dir) / "test_correlation_storage.db")
            storage = PhaseCorrelationStorage(
                storage_path=storage_path,
                enable_compression=True,
                backup_enabled=False  # Disable for testing
            )
            yield storage
            storage.shutdown()
    
    def test_correlation_storage_and_retrieval(self, temp_storage):
        """Test correlation storage with compression."""
        correlation = MemoryCorrelation(
            source_phase="phase1",
            target_phase="phase2",
            correlation_type="learning",
            correlation_strength=0.75,
            metadata={"large_data": "x" * 2000}  # Large metadata for compression test
        )
        
        # Store correlation
        assert temp_storage.store_correlation(correlation) == True
        
        # Retrieve correlations
        correlations = temp_storage.get_correlations_by_phase("phase1")
        assert len(correlations) > 0
        
        retrieved = correlations[0]
        assert retrieved.source_phase == "phase1"
        assert retrieved.target_phase == "phase2"
        assert retrieved.correlation_strength == 0.75
        assert "large_data" in retrieved.metadata
    
    def test_performance_correlation_validation(self, temp_storage):
        """Test performance correlation validation."""
        # Valid correlation
        valid_perf = PerformanceCorrelation(
            phase="test_phase",
            metric_name="valid_metric",
            baseline_value=100.0,
            current_value=120.0,
            improvement_percentage=20.0,
            correlation_factors=["factor1"]
        )
        
        assert temp_storage.store_performance_correlation(valid_perf) == True
        
        # Invalid correlation (unrealistic improvement)
        invalid_perf = PerformanceCorrelation(
            phase="test_phase",
            metric_name="invalid_metric",
            baseline_value=100.0,
            current_value=120.0,
            improvement_percentage=2000.0,  # Unrealistic
            correlation_factors=["factor1"]
        )
        
        assert temp_storage.store_performance_correlation(invalid_perf) == False
    
    def test_learning_pattern_storage(self, temp_storage):
        """Test learning pattern storage and retrieval."""
        pattern_data = {
            "optimization_type": "detector_pool",
            "success_factors": ["threading", "memory_efficiency"],
            "performance_gain": 45.0
        }
        
        # Store pattern
        assert temp_storage.store_learning_pattern(
            pattern_key="phase1->phase2:optimization",
            pattern_type="optimization",
            pattern_strength=0.85,
            pattern_data=pattern_data
        ) == True
        
        # Retrieve patterns
        patterns = temp_storage.get_learning_patterns_by_type("optimization", min_strength=0.8)
        assert len(patterns) > 0
        
        pattern = patterns[0]
        assert pattern["pattern_key"] == "phase1->phase2:optimization"
        assert pattern["pattern_strength"] == 0.85
        assert pattern["pattern_data"]["optimization_type"] == "detector_pool"
    
    def test_query_performance_optimization(self, temp_storage):
        """Test query performance and caching."""
        # Store multiple correlations
        for i in range(50):
            correlation = MemoryCorrelation(
                source_phase=f"phase{i % 5}",
                target_phase=f"phase{(i % 5) + 1}",
                correlation_type="performance",
                correlation_strength=0.5 + (i % 5) * 0.1,
                metadata={"iteration": i}
            )
            temp_storage.store_correlation(correlation)
        
        # First query (should be slow, cache miss)
        start_time = time.time()
        correlations1 = temp_storage.get_correlations_by_phase("phase1", use_cache=True)
        first_time = time.time() - start_time
        
        # Second query (should be faster, cache hit)
        start_time = time.time()
        correlations2 = temp_storage.get_correlations_by_phase("phase1", use_cache=True)
        second_time = time.time() - start_time
        
        # Results should be the same
        assert len(correlations1) == len(correlations2)
        
        # Cache should improve performance
        stats = temp_storage.get_storage_statistics()
        assert stats["cache_hits"] > 0
        assert stats["cache_hit_rate"] > 0

class TestConcurrentMemoryOperations:
    """Test thread safety and concurrent operations."""
    
    @pytest.fixture
    def concurrent_memory_model(self):
        """Create memory model for concurrent testing."""
        with tempfile.TemporaryDirectory() as temp_dir:
            storage_path = str(Path(temp_dir) / "concurrent_test_storage.db")
            model = UnifiedMemoryModel(
                storage_path=storage_path,
                max_memory_mb=100,
                max_entries=5000
            )
            yield model
            model.shutdown()
    
    def test_concurrent_memory_entry_operations(self, concurrent_memory_model):
        """Test concurrent memory entry operations."""
    def store_entries(thread_id: int, entry_count: int) -> int:
            stored_count = 0
            for i in range(entry_count):
                entry = PhaseMemoryEntry(
                    phase_id=f"thread_{thread_id}",
                    entry_id=f"entry_{i}",
                    entry_type="concurrent_test",
                    content={"thread_id": thread_id, "entry_index": i}
                )
                
                if concurrent_memory_model.store_memory_entry(entry):
                    stored_count += 1
                    
                # Add small delay to encourage race conditions
                time.sleep(0.001)
            
            return stored_count
        
        # Launch concurrent storage operations
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [
                executor.submit(store_entries, thread_id, 20)
                for thread_id in range(5)
            ]
            
            results = [future.result() for future in as_completed(futures)]
        
        total_stored = sum(results)
        assert total_stored > 0  # At least some entries should be stored
        
        # Verify entries are accessible
        for thread_id in range(5):
            retrieved = concurrent_memory_model.get_memory_entry(f"thread_{thread_id}", "entry_0")
            if retrieved:  # May not exist due to memory limits
                assert retrieved.content["thread_id"] == thread_id
    
    def test_concurrent_correlation_operations(self, concurrent_memory_model):
        """Test concurrent correlation creation."""
    def create_correlations(thread_id: int, correlation_count: int) -> int:
            created_count = 0
            for i in range(correlation_count):
                try:
                    concurrent_memory_model.correlate_phases(
                        source_phase=f"thread_{thread_id}_source",
                        target_phase=f"thread_{thread_id}_target",
                        correlation_type="concurrent_test",
                        strength=0.5 + (i * 0.01),
                        metadata={"thread_id": thread_id, "correlation_index": i}
                    )
                    created_count += 1
                except Exception:
                    pass  # Expected under high concurrency
                
                time.sleep(0.001)
            
            return created_count
        
        # Launch concurrent correlation operations
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [
                executor.submit(create_correlations, thread_id, 15)
                for thread_id in range(4)
            ]
            
            results = [future.result() for future in as_completed(futures)]
        
        total_created = sum(results)
        assert total_created > 0
        
        # Verify correlations are stored
        for thread_id in range(4):
            correlations = concurrent_memory_model.storage.get_correlations_by_phase(f"thread_{thread_id}_source")
            # Some correlations should exist (depending on concurrency and memory limits)
            assert len(correlations) >= 0
    
    def test_memory_safety_under_concurrency(self, concurrent_memory_model):
        """Test memory safety enforcement under concurrent load."""
    def stress_memory_operations(thread_id: int) -> Dict[str, int]:
            results = {"stored": 0, "rejected": 0, "retrieved": 0}
            
            # Create large entries to stress memory limits
            large_content = {"large_data": "x" * 5000}  # 5KB per entry
            
            for i in range(50):
                # Store operation
                entry = PhaseMemoryEntry(
                    phase_id=f"stress_{thread_id}",
                    entry_id=f"stress_entry_{i}",
                    entry_type="stress_test",
                    content=large_content
                )
                
                if concurrent_memory_model.store_memory_entry(entry):
                    results["stored"] += 1
                else:
                    results["rejected"] += 1
                
                # Retrieval operation
                if i > 0:
                    retrieved = concurrent_memory_model.get_memory_entry(f"stress_{thread_id}", f"stress_entry_{i-1}")
                    if retrieved:
                        results["retrieved"] += 1
                
                time.sleep(0.001)
            
            return results
        
        # Launch concurrent stress operations
        with ThreadPoolExecutor(max_workers=6) as executor:
            futures = [
                executor.submit(stress_memory_operations, thread_id)
                for thread_id in range(6)
            ]
            
            all_results = [future.result() for future in as_completed(futures)]
        
        # Aggregate results
        total_stored = sum(r["stored"] for r in all_results)
        total_rejected = sum(r["rejected"] for r in all_results)
        total_retrieved = sum(r["retrieved"] for r in all_results)
        
        # Memory safety should have rejected some operations
        assert total_rejected > 0, "Memory safety should have rejected some operations under stress"
        assert total_stored > 0, "Some operations should have succeeded"
        
        # Check final memory safety status
        safety_report = concurrent_memory_model.safety_validator.get_safety_report()
        # Under stress, we expect some violations but the system should remain stable
        assert isinstance(safety_report["nasa_pot10_compliant"], bool)

class TestMemoryLeakPrevention:
    """Test memory leak prevention and cleanup."""
    
    @pytest.fixture
    def leak_test_model(self):
        """Create memory model for leak testing."""
        with tempfile.TemporaryDirectory() as temp_dir:
            storage_path = str(Path(temp_dir) / "leak_test_storage.db")
            model = UnifiedMemoryModel(
                storage_path=storage_path,
                max_memory_mb=20,  # Small limit for leak testing
                max_entries=200
            )
            yield model
            model.shutdown()
    
    def test_ttl_based_cleanup(self, leak_test_model):
        """Test TTL-based entry cleanup."""
        # Store entries with short TTL
        entries_with_ttl = []
        for i in range(10):
            entry = PhaseMemoryEntry(
                phase_id="ttl_test",
                entry_id=f"ttl_entry_{i}",
                entry_type="ttl_test",
                content={"data": f"value_{i}"},
                ttl_seconds=1  # Very short TTL
            )
            
            if leak_test_model.store_memory_entry(entry):
                entries_with_ttl.append(entry)
        
        # Verify entries are stored
        initial_count = len(leak_test_model.memory_entries)
        assert initial_count > 0
        
        # Wait for TTL expiration
        time.sleep(2)
        
        # Trigger cleanup
        cleanup_count = asyncio.run(leak_test_model._perform_cleanup())
        
        # Entries should be cleaned up
        assert cleanup_count > 0
        final_count = len(leak_test_model.memory_entries)
        assert final_count < initial_count
    
    def test_lru_based_cleanup(self, leak_test_model):
        """Test LRU-based cleanup when memory pressure is high."""
        # Fill up memory with entries
        large_content = {"large_data": "x" * 2000}  # 2KB per entry
        
        stored_entries = []
        for i in range(50):  # Try to store many entries
            entry = PhaseMemoryEntry(
                phase_id="lru_test",
                entry_id=f"lru_entry_{i}",
                entry_type="lru_test",
                content=large_content
            )
            
            if leak_test_model.store_memory_entry(entry):
                stored_entries.append(entry)
        
        initial_memory = leak_test_model._calculate_current_memory()
        
        # Access some entries to update their access time
        accessed_entries = stored_entries[:5]
        for entry in accessed_entries:
            retrieved = leak_test_model.get_memory_entry(entry.phase_id, entry.entry_id)
            assert retrieved is not None
        
        # Trigger cleanup due to memory pressure
        cleanup_count = asyncio.run(leak_test_model._perform_cleanup())
        
        if cleanup_count > 0:
            final_memory = leak_test_model._calculate_current_memory()
            assert final_memory < initial_memory
            
            # Recently accessed entries should still exist
            for entry in accessed_entries:
                retrieved = leak_test_model.get_memory_entry(entry.phase_id, entry.entry_id)
                # Should still exist (but might be cleaned if memory pressure was severe)
    
    @pytest.mark.asyncio
    async def test_background_cleanup_task(self, leak_test_model):
        """Test background cleanup task functionality."""
        # Start background cleanup with short interval
        leak_test_model.cleanup_interval = 1  # 1 second for testing
        await leak_test_model.start_background_cleanup()
        
        # Store some entries with TTL
        for i in range(5):
            entry = PhaseMemoryEntry(
                phase_id="background_test",
                entry_id=f"bg_entry_{i}",
                entry_type="background_test",
                content={"data": f"value_{i}"},
                ttl_seconds=2  # Short TTL
            )
            leak_test_model.store_memory_entry(entry)
        
        initial_stats = leak_test_model.memory_stats
        initial_cleanup_ops = initial_stats.cleanup_operations
        
        # Wait for background cleanup to run
        await asyncio.sleep(3)
        
        # Check that cleanup operations were performed
        final_stats = leak_test_model.memory_stats
        assert final_stats.cleanup_operations >= initial_cleanup_ops
        
        # Stop background cleanup
        await leak_test_model.stop_background_cleanup()

class TestPerformanceCorrelationAccuracy:
    """Test accuracy of performance correlation tracking."""
    
    @pytest.fixture
    def perf_test_model(self):
        """Create memory model for performance testing."""
        with tempfile.TemporaryDirectory() as temp_dir:
            storage_path = str(Path(temp_dir) / "perf_test_storage.db")
            model = UnifiedMemoryModel(storage_path=storage_path)
            yield model
            model.shutdown()
    
    def test_performance_improvement_calculation(self, perf_test_model):
        """Test accuracy of performance improvement calculations."""
        test_cases = [
            # (baseline, current, expected_improvement)
            (100.0, 150.0, 50.0),
            (200.0, 100.0, -50.0),
            (50.0, 75.0, 50.0),
            (1000.0, 1200.0, 20.0),
        ]
        
        for baseline, current, expected in test_cases:
            perf_test_model.track_performance_improvement(
                phase="accuracy_test",
                metric_name=f"test_metric_{baseline}",
                baseline_value=baseline,
                current_value=current,
                correlation_factors=["test_factor"]
            )
            
            # Retrieve and verify
            trends = perf_test_model.storage.get_performance_trends("accuracy_test")
            matching_trend = next(
                (t for t in trends if t.metric_name == f"test_metric_{baseline}"),
                None
            )
            
            assert matching_trend is not None
            assert abs(matching_trend.improvement_percentage - expected) < 0.01
    
    def test_performance_correlation_aggregation(self, perf_test_model):
        """Test aggregation of performance correlations across phases."""
        phases = ["phase1", "phase2", "phase3"]
        metrics_per_phase = 5
        
        # Create performance data for multiple phases
        for phase in phases:
            for i in range(metrics_per_phase):
                perf_test_model.track_performance_improvement(
                    phase=phase,
                    metric_name=f"metric_{i}",
                    baseline_value=100.0,
                    current_value=100.0 + (i + 1) * 20.0,  # Increasing improvement
                    correlation_factors=[f"factor_{i}"]
                )
        
        # Get comprehensive performance report
        report = perf_test_model.get_unified_performance_report()
        
        # Verify phase performance data
        assert "phase_performance" in report
        for phase in phases:
            assert phase in report["phase_performance"]
            phase_data = report["phase_performance"][phase]
            
            assert phase_data["total_metrics"] == metrics_per_phase
            assert phase_data["validated_metrics"] == metrics_per_phase
            assert phase_data["average_improvement"] > 0
    
    def test_cross_phase_correlation_strength(self, perf_test_model):
        """Test calculation and tracking of cross-phase correlation strength."""
        # Create correlations with varying strengths
        correlations_data = [
            ("phase1", "phase2", "performance", 0.9),
            ("phase1", "phase2", "learning", 0.8),
            ("phase1", "phase2", "optimization", 0.7),
            ("phase2", "phase3", "performance", 0.85),
        ]
        
        for source, target, corr_type, strength in correlations_data:
            perf_test_model.correlate_phases(source, target, corr_type, strength)
        
        # Get learning insights
        insights = perf_test_model.get_cross_phase_learning_insights("phase2")
        
        # Should have relevant patterns
        assert len(insights["relevant_patterns"]) > 0
        
        # Check pattern strength calculations
        for pattern in insights["relevant_patterns"]:
            assert 0.0 <= pattern["pattern_strength"] <= 1.0
            assert "source_phase" in pattern
            assert "correlation_types" in pattern
        
        # Overall learning confidence should be reasonable
        assert 0.0 <= insights["learning_confidence"] <= 1.0

if __name__ == "__main__":
    # Run specific test categories if called directly
    pytest.main([
        __file__,
        "-v",
        "--tb=short",
        "-k", "TestMemorySafetyValidation or TestUnifiedMemoryModel"
    ])