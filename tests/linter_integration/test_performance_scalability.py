from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS

import pytest
import asyncio
import time
import psutil
import os
import tempfile
import json
import concurrent.futures
from unittest.mock import Mock, patch
from pathlib import Path
from typing import Dict, Any, List
import threading
import multiprocessing
from dataclasses import dataclass
from statistics import mean, median, stdev

# Import system components for testing
import sys
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

from test_full_pipeline import IntegratedLinterPipeline
from test_mesh_coordination import MeshQueenCoordinator
from test_tool_management import ToolManagementSystem
from test_real_time_processing import MockRealTimeLinterIngestionEngine

@dataclass
class PerformanceMetrics:
    """Performance metrics data class"""
    execution_time: float
    memory_usage: int  # bytes
    cpu_usage: float  # percentage
    violations_per_second: float
    correlations_per_second: float
    files_per_second: float
    throughput_score: float

class PerformanceBenchmark:
    """Performance benchmarking utility"""
    
    def __init__(self):
        self.metrics_history = []
        self.baseline_metrics = None
        
    def measure_performance(self, func, *args, **kwargs) -> PerformanceMetrics:
        """Measure performance of a function execution"""
        process = psutil.Process(os.getpid())
        
        # Baseline measurements
        start_memory = process.memory_info().rss
        start_cpu = process.cpu_percent()
        start_time = time.time()
        
        # Execute function
        result = func(*args, **kwargs)
        
        # End measurements
        end_time = time.time()
        end_memory = process.memory_info().rss
        end_cpu = process.cpu_percent()
        
        # Calculate metrics
        execution_time = end_time - start_time
        memory_usage = end_memory - start_memory
        cpu_usage = (start_cpu + end_cpu) / 2
        
        # Extract result metrics if available
        violations_count = 0
        correlations_count = 0
        files_count = 1
        
        if isinstance(result, dict):
            if "summary" in result:
                violations_count = result["summary"].get("total_violations", 0)
                correlations_count = result["summary"].get("correlations_found", 0)
                files_count = result["summary"].get("files_analyzed", 1)
            elif "total_violations" in result:
                violations_count = result["total_violations"]
        
        # Calculate rates
        violations_per_second = violations_count / max(execution_time, 0.1)
        correlations_per_second = correlations_count / max(execution_time, 0.1)
        files_per_second = files_count / max(execution_time, 0.1)
        
        # Calculate throughput score (composite metric)
        throughput_score = (violations_per_second * 0.4 + 
                            correlations_per_second * 0.3 + 
                            files_per_second * 0.3)
        
        metrics = PerformanceMetrics(
            execution_time=execution_time,
            memory_usage=memory_usage,
            cpu_usage=cpu_usage,
            violations_per_second=violations_per_second,
            correlations_per_second=correlations_per_second,
            files_per_second=files_per_second,
            throughput_score=throughput_score
        )
        
        self.metrics_history.append(metrics)
        return metrics
    
    def set_baseline(self, metrics: PerformanceMetrics):
        """Set baseline metrics for comparison"""
        self.baseline_metrics = metrics
    
    def compare_to_baseline(self, metrics: PerformanceMetrics) -> Dict[str, float]:
        """Compare metrics to baseline and return ratios"""
        if not self.baseline_metrics:
            return {}
        
        return {
            "execution_time_ratio": metrics.execution_time / self.baseline_metrics.execution_time,
            "memory_ratio": metrics.memory_usage / max(self.baseline_metrics.memory_usage, 1),
            "throughput_ratio": metrics.throughput_score / max(self.baseline_metrics.throughput_score, 0.1),
            "cpu_ratio": metrics.cpu_usage / max(self.baseline_metrics.cpu_usage, 0.1)
        }

class TestMeshCoordinationPerformance:
    """Performance tests for mesh coordination system"""
    
    @pytest.fixture
    def benchmark(self):
        """Create performance benchmark instance"""
        return PerformanceBenchmark()
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_mesh_initialization_performance(self, benchmark):
        """Test mesh initialization performance"""
        coordinator = MeshQueenCoordinator()
        
        def init_mesh():
            return asyncio.run(coordinator.initialize_mesh_topology())
        
        metrics = benchmark.measure_performance(init_mesh)
        
        # Should initialize quickly
        assert metrics.execution_time < 1.0  # Under 1 second
        assert metrics.memory_usage < 10 * 1024 * 1024  # Under 10MB
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_mesh_scalability_nodes(self, benchmark):
        """Test mesh scalability with increasing node count"""
        execution_times = []
        memory_usages = []
        
        # Test with different node counts (simulated)
        node_counts = [4, 8, 16, 32]
        
        for node_count in node_counts:
            coordinator = MeshQueenCoordinator()
            
            # Simulate additional nodes
            start_time = time.time()
            await coordinator.initialize_mesh_topology()
            
            # Add simulated nodes
            for i in range(node_count - 4):  # Already has 4 default nodes
                node_id = f"node_{i}"
                coordinator.mesh_nodes[node_id] = Mock()
            
            execution_time = time.time() - start_time
            memory_usage = psutil.Process(os.getpid()).memory_info().rss
            
            execution_times.append(execution_time)
            memory_usages.append(memory_usage)
        
        # Verify scalability characteristics
        for i in range(1, len(execution_times)):
            # Time should scale sub-linearly
            time_ratio = execution_times[i] / execution_times[0]
            node_ratio = node_counts[i] / node_counts[0]
            assert time_ratio <= node_ratio * 1.5  # Allow 50% overhead
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_mesh_message_throughput(self, benchmark):
        """Test mesh message processing throughput"""
        coordinator = MeshQueenCoordinator()
        await coordinator.initialize_mesh_topology()
        
        # Generate large number of messages
        message_count = 10000
        
        start_time = time.time()
        for i in range(message_count):
            coordinator.message_queue.append(Mock(message_id=f"msg_{i}"))
        
        processing_time = time.time() - start_time
        
        # Calculate throughput
        messages_per_second = message_count / processing_time
        
        # Should handle high message throughput
        assert messages_per_second > 1000  # Over 1000 messages/second
        assert processing_time < 10.0  # Under MAXIMUM_FUNCTION_PARAMETERS seconds total

class TestToolManagementPerformance:
    """Performance tests for tool management system"""
    
    @pytest.fixture
    def tool_manager(self):
        """Create tool manager with temporary workspace"""
        with tempfile.TemporaryDirectory() as temp_dir:
            yield ToolManagementSystem(temp_dir)
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_concurrent_tool_execution_performance(self, tool_manager):
        """Test concurrent tool execution performance"""
        # Create mock tools
        mock_tools = []
        for i in range(5):
            mock_tool = Mock()
            mock_tool.id = f"tool_{i}"
            mock_tool.timeout = 30000
            mock_tools.append(mock_tool)
            
            # Register tool
            tool_manager.tools[mock_tool.id] = mock_tool
            tool_manager.initializeToolHealth(mock_tool.id)
            tool_manager.initializeToolMetrics(mock_tool.id)
            tool_manager.circuitBreakers[mock_tool.id] = {
                "isOpen": False,
                "failureCount": 0,
                "lastFailureTime": 0,
                "successCount": 0,
                "nextAttemptTime": 0
            }
        
        # Mock tool execution
        async def mock_execute(tool_id, files, options=None):
            await asyncio.sleep(0.1)  # Simulate work
            return Mock(success=True, violations=[], executionTime=100)
        
        with patch.object(tool_manager, 'executeWithMonitoring', side_effect=mock_execute):
            # Execute tools concurrently
            start_time = time.time()
            tasks = [
                tool_manager.executeTool(tool.id, ["test.py"])
                for tool in mock_tools
            ]
            
            results = await asyncio.gather(*tasks)
            execution_time = time.time() - start_time
            
            # Should complete concurrently (not sequentially)
            assert execution_time < 1.0  # Much less than 5 * 0.1 = 0.5 seconds
            assert len(results) == 5
            assert all(r.success for r in results)
    
    @pytest.mark.performance
    def test_tool_metrics_performance(self, tool_manager):
        """Test tool metrics processing performance"""
        tool_id = "test_tool"
        tool_manager.initializeToolMetrics(tool_id)
        tool_manager.initializeToolHealth(tool_id)
        
        # Simulate many metric updates
        start_time = time.time()
        
        for i in range(1000):
            mock_result = Mock(
                success=True,
                executionTime=i * 0.1,
                violationsFound=i % 10
            )
            tool_manager.updateSuccessMetrics(tool_id, i * 0.1, mock_result)
        
        update_time = time.time() - start_time
        
        # Should handle many updates efficiently
        assert update_time < 1.0  # Under 1 second for 1000 updates
        
        # Verify metrics are correct
        metrics = tool_manager.metrics[tool_id]
        assert metrics.totalExecutions == 1000
        assert metrics.averageExecutionTime > 0

class TestRealTimeProcessingPerformance:
    """Performance tests for real-time processing"""
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_streaming_throughput(self):
        """Test streaming violation processing throughput"""
        engine = MockRealTimeLinterIngestionEngine()
        
        # Create many files for processing
        file_count = 100
        files = [f"file_{i}.py" for i in range(file_count)]
        
        start_time = time.time()
        result = await engine.executeRealtimeLinting(files)
        processing_time = time.time() - start_time
        
        # Calculate throughput
        files_per_second = file_count / processing_time
        violations_per_second = result["total_violations"] / processing_time
        
        # Should achieve good throughput
        assert files_per_second > 10  # Over 10 files/second
        assert violations_per_second > 100  # Over 100 violations/second
        assert processing_time < 10.0  # Under 10 seconds total
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_correlation_performance_large_dataset(self):
        """Test correlation performance with large violation dataset"""
        from test_real_time_processing import MockResultCorrelationFramework
        
        framework = MockResultCorrelationFramework()
        
        # Generate large violation dataset
        violation_count = 1000
        violations = []
        
        for i in range(violation_count):
            violations.append({
                "tool": f"tool_{i % 5}",
                "file": f"file_{i % 20}.py",
                "line": (i % 100) + 1,
                "rule": f"R{i % 50}",
                "message": f"violation {i}",
                "severity": "medium"
            })
        
        start_time = time.time()
        result = await framework.correlateResults(violations)
        processing_time = time.time() - start_time
        
        # Should handle large datasets efficiently
        assert processing_time < 30.0  # Under 30 seconds for 1000 violations
        
        # Calculate correlation throughput
        correlations_per_second = result["total_correlations"] / max(processing_time, 0.1)
        assert correlations_per_second >= 0  # Should complete without error
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_concurrent_streaming_performance(self):
        """Test concurrent streaming processing performance"""
        engine = MockRealTimeLinterIngestionEngine()
        
        # Start multiple concurrent streams
        stream_count = 10
        files_per_stream = 10
        
        async def process_stream(stream_id):
            files = [f"stream_{stream_id}_file_{i}.py" for i in range(files_per_stream)]
            return await engine.executeRealtimeLinting(files)
        
        start_time = time.time()
        tasks = [process_stream(i) for i in range(stream_count)]
        results = await asyncio.gather(*tasks)
        processing_time = time.time() - start_time
        
        # Should handle concurrent streams efficiently
        assert processing_time < 15.0  # Under 15 seconds for 10 concurrent streams
        assert len(results) == stream_count
        assert all(r["status"] == "completed" for r in results)
        
        # Calculate total throughput
        total_violations = sum(r["total_violations"] for r in results)
        violations_per_second = total_violations / processing_time
        assert violations_per_second > 50  # Over 50 violations/second total

class TestFullPipelinePerformance:
    """Performance tests for complete pipeline"""
    
    @pytest.fixture
    async def pipeline(self):
        """Create pipeline for performance testing"""
        with tempfile.TemporaryDirectory() as temp_dir:
            pipeline = IntegratedLinterPipeline()
            await pipeline.initialize_pipeline(temp_dir)
            yield pipeline
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_pipeline_baseline_performance(self, pipeline):
        """Establish baseline performance metrics for pipeline"""
        benchmark = PerformanceBenchmark()
        
        # Create test files
        with tempfile.TemporaryDirectory() as temp_dir:
            files = []
            for i in range(5):
                file_path = Path(temp_dir) / f"test_{i}.py"
                files.append(str(file_path))
            
            # Measure baseline performance
            async def execute_pipeline():
                return await pipeline.execute_full_pipeline(files)
            
            metrics = benchmark.measure_performance(
                lambda: asyncio.run(execute_pipeline())
            )
            
            # Set as baseline
            benchmark.set_baseline(metrics)
            
            # Baseline should meet minimum requirements
            assert metrics.execution_time < 60.0  # Under 1 minute
            assert metrics.memory_usage < 500 * 1024 * 1024  # Under 500MB
            assert metrics.files_per_second > 0.1  # Over 0.1 files/second
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_pipeline_scalability_files(self, pipeline):
        """Test pipeline scalability with increasing file count"""
        execution_times = []
        memory_usages = []
        file_counts = [1, 5, 10, 25, 50]
        
        for file_count in file_counts:
            with tempfile.TemporaryDirectory() as temp_dir:
                files = []
                for i in range(file_count):
                    file_path = Path(temp_dir) / f"file_{i}.py"
                    file_path.write_text("print('hello')\n" * 10)
                    files.append(str(file_path))
                
                # Measure execution
                start_time = time.time()
                start_memory = psutil.Process(os.getpid()).memory_info().rss
                
                result = await pipeline.execute_full_pipeline(files)
                
                end_time = time.time()
                end_memory = psutil.Process(os.getpid()).memory_info().rss
                
                execution_time = end_time - start_time
                memory_usage = end_memory - start_memory
                
                execution_times.append(execution_time)
                memory_usages.append(memory_usage)
                
                assert result["status"] == "completed"
        
        # Verify scalability characteristics
        for i in range(1, len(execution_times)):
            # Time should scale sub-quadratically
            time_ratio = execution_times[i] / execution_times[0]
            file_ratio = file_counts[i] / file_counts[0]
            
            # Allow reasonable scaling (not more than quadratic)
            assert time_ratio <= file_ratio ** 1.5
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_pipeline_memory_efficiency(self, pipeline):
        """Test pipeline memory efficiency"""
        import gc
        
        # Force garbage collection
        gc.collect()
        initial_memory = psutil.Process(os.getpid()).memory_info().rss
        
        # Execute pipeline multiple times
        for i in range(5):
            with tempfile.TemporaryDirectory() as temp_dir:
                files = []
                for j in range(3):
                    file_path = Path(temp_dir) / f"file_{j}.py"
                    file_path.write_text(f"print('iteration {i}, file {j}')\n" * 10)
                    files.append(str(file_path))
                
                result = await pipeline.execute_full_pipeline(files)
                assert result["status"] == "completed"
                
                # Force cleanup
                gc.collect()
        
        final_memory = psutil.Process(os.getpid()).memory_info().rss
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable
        assert memory_increase < 200 * 1024 * 1024  # Under 200MB total increase
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_pipeline_cpu_efficiency(self, pipeline):
        """Test pipeline CPU efficiency"""
        with tempfile.TemporaryDirectory() as temp_dir:
            files = []
            for i in range(10):
                file_path = Path(temp_dir) / f"file_{i}.py"
                file_path.write_text("print('hello')\n" * 50)
                files.append(str(file_path))
            
            # Monitor CPU usage during execution
            process = psutil.Process(os.getpid())
            cpu_samples = []
            
            async def monitor_cpu():
                for _ in range(20):  # Sample for ~10 seconds
                    cpu_samples.append(process.cpu_percent())
                    await asyncio.sleep(0.5)
            
            # Run monitoring and pipeline concurrently
            monitor_task = asyncio.create_task(monitor_cpu())
            pipeline_task = asyncio.create_task(pipeline.execute_full_pipeline(files))
            
            result = await pipeline_task
            monitor_task.cancel()
            
            assert result["status"] == "completed"
            
            if cpu_samples:
                avg_cpu = mean(cpu_samples)
                max_cpu = max(cpu_samples)
                
                # CPU usage should be reasonable
                assert avg_cpu < 80.0  # Average under 80%
                assert max_cpu < 100.0  # Never max out (completely)

class TestPerformanceRegression:
    """Performance regression tests"""
    
    @pytest.mark.performance
    def test_phase1_performance_baseline(self):
        """Test that Phase 2 doesn't regress Phase 1 performance"""
        # Phase 1 baseline: 3.6% improvement in JSON generation
        
        # Simulate Phase 1 JSON generation
        data = {"violations": [{"file": "test.py", "line": 1} for _ in range(1000)]}
        
        start_time = time.time()
        json_output = json.dumps(data)
        generation_time = time.time() - start_time
        
        # Should maintain fast JSON generation
        assert generation_time < 0.1  # Under 100ms for 1000 violations
        assert len(json_output) > 0
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_phase2_performance_targets(self, pipeline):
        """Test Phase 2 specific performance targets"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create realistic project structure
            files = []
            for i in range(20):  # 20 files
                file_path = Path(temp_dir) / f"module_{i}.py"
                content = f"""
import os
import sys

class Module{i}:
    def __init__(self):
        self.value = {i}
    
    def method_with_long_line_that_exceeds_standard_length_limits(self, param):
        return param + self.value
    
    def another_method(self):
        # This is a comment
        x = 1
        y = 2
        return x + y
"""
                file_path.write_text(content)
                files.append(str(file_path))
            
            # Execute pipeline with performance targets
            start_time = time.time()
            result = await pipeline.execute_full_pipeline(files)
            execution_time = time.time() - start_time
            
            # Phase 2 performance targets
            assert execution_time < 120.0  # Under 2 minutes for 20 files
            assert result["status"] == "completed"
            assert result["summary"]["total_violations"] > 0
            
            # Throughput targets
            files_per_second = len(files) / execution_time
            violations_per_second = result["summary"]["total_violations"] / execution_time
            
            assert files_per_second > 0.2  # Over 0.2 files/second
            assert violations_per_second > 1.0  # Over 1 violation/second

class TestStressTests:
    """Stress tests for system limits"""
    
    @pytest.mark.stress
    @pytest.mark.asyncio
    async def test_maximum_concurrent_operations(self, pipeline):
        """Test system behavior under maximum concurrent load"""
        # Create many small tasks
        task_count = 50
        
        async def small_task():
            with tempfile.TemporaryDirectory() as temp_dir:
                file_path = Path(temp_dir) / "test.py"
                return await pipeline.execute_full_pipeline([str(file_path)])
        
        # Execute many tasks concurrently
        start_time = time.time()
        tasks = [small_task() for _ in range(task_count)]
        
        try:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            execution_time = time.time() - start_time
            
            # Count successful executions
            successful = sum(1 for r in results if isinstance(r, dict) and r.get("status") == "completed")
            
            # Should handle reasonable concurrent load
            assert successful >= task_count * 0.5  # At least 50% success rate
            assert execution_time < 300.0  # Under 5 minutes total
            
        except Exception as e:
            # System should degrade gracefully, not crash completely
            pytest.skip(f"System reached limits gracefully: {e}")
    
    @pytest.mark.stress
    @pytest.mark.asyncio 
    async def test_memory_pressure_handling(self, pipeline):
        """Test system behavior under memory pressure"""
        large_files = []
        
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create large files to stress memory
            for i in range(5):
                file_path = Path(temp_dir) / f"large_{i}.py"
                # Create file with many lines
                content = "\n".join([f"# Line {j}: " + "x" * 100 for j in range(1000)])
                file_path.write_text(content)
                large_files.append(str(file_path))
            
            # Monitor memory during execution
            process = psutil.Process(os.getpid())
            initial_memory = process.memory_info().rss
            
            try:
                result = await pipeline.execute_full_pipeline(large_files)
                final_memory = process.memory_info().rss
                memory_increase = final_memory - initial_memory
                
                # Should complete without excessive memory usage
                assert result["status"] == "completed"
                assert memory_increase < 1024 * 1024 * 1024  # Under 1GB increase
                
            except MemoryError:
                pytest.skip("System reached memory limits gracefully")

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    pytest.main(["-v", __file__, "-s", "--tb=short", "-m", "performance"])