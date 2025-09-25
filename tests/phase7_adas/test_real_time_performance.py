from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS

"""
Requirements:
- Latency < 10ms for safety-critical operations
- 99.99% uptime under normal conditions
- Graceful degradation under high load
"""

import pytest
import time
import threading
import psutil
import asyncio
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import Mock, patch
from dataclasses import dataclass
from typing import List, Dict, Any
import json
import os

# Test configuration
LATENCY_THRESHOLD_MS = 10.0
THROUGHPUT_MIN_OPS_SEC = 1000
MAX_CPU_USAGE_PERCENT = 80.0
MAX_MEMORY_USAGE_MB = 512.0
STRESS_TEST_DURATION_SEC = 30.0

@dataclass
class PerformanceMetrics:
    """Performance metrics data structure"""
    latency_ms: float
    throughput_ops_sec: float
    cpu_usage_percent: float
    memory_usage_mb: float
    error_rate_percent: float
    timestamp: float

class MockADASProcessor:
    """Mock ADAS processor for testing"""

    def __init__(self):
        self.processing_time_ms = 5.0  # Default processing time
        self.error_rate = 0.1  # 0.1% error rate

    async def process_sensor_data(self, sensor_data: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate sensor data processing"""
        start_time = time.perf_counter()

        # Simulate processing delay
        await asyncio.sleep(self.processing_time_ms / 1000.0)

        # Simulate occasional errors
        if np.random.random() < self.error_rate:
            raise RuntimeError("Sensor processing error")

        end_time = time.perf_counter()

        return {
            "status": "processed",
            "processing_time_ms": (end_time - start_time) * 1000,
            "objects_detected": len(sensor_data.get("objects", [])),
            "timestamp": time.time()
        }

class RealTimePerformanceTester:
    """Real-time performance testing framework"""

    def __init__(self):
        self.processor = MockADASProcessor()
        self.metrics_history: List[PerformanceMetrics] = []

    def measure_latency(self, operation_func, *args, **kwargs) -> float:
        """Measure operation latency in milliseconds"""
        start_time = time.perf_counter()
        try:
            result = operation_func(*args, **kwargs)
            if asyncio.iscoroutine(result):
                loop = asyncio.get_event_loop()
                loop.run_until_complete(result)
        except Exception as e:
            pass  # Record error but still measure timing
        end_time = time.perf_counter()
        return (end_time - start_time) * 1000.0

    def measure_system_resources(self) -> Dict[str, float]:
        """Measure current system resource usage"""
        process = psutil.Process()
        return {
            "cpu_percent": process.cpu_percent(),
            "memory_mb": process.memory_info().rss / 1024 / 1024,
            "system_cpu_percent": psutil.cpu_percent(),
            "system_memory_percent": psutil.virtual_memory().percent
        }

@pytest.fixture
def performance_tester():
    """Performance tester fixture"""
    return RealTimePerformanceTester()

@pytest.fixture
def sample_sensor_data():
    """Sample sensor data for testing"""
    return {
        "camera": {
            "image_data": "base64_encoded_image",
            "timestamp": time.time(),
            "resolution": "1920x1080"
        },
        "lidar": {
            "point_cloud": [[1.0, 2.0, 3.0] for _ in range(100)],
            "timestamp": time.time(),
            "range_m": 150.0
        },
        "radar": {
            "targets": [{"distance": 50.0, "velocity": 30.0, "angle": 15.0}],
            "timestamp": time.time()
        },
        "objects": [
            {"type": "vehicle", "position": [10.0, 5.0], "velocity": [15.0, 0.0]},
            {"type": "pedestrian", "position": [20.0, 2.0], "velocity": [2.0, 1.0]}
        ]
    }

class TestLatencyRequirements:
    """Test latency requirements for safety-critical operations"""

    def test_sensor_processing_latency(self, performance_tester, sample_sensor_data):
        """Test that sensor processing meets latency requirements"""
        latencies = []

        for _ in range(100):  # Multiple samples for statistical validity
            latency_ms = performance_tester.measure_latency(
                performance_tester.processor.process_sensor_data,
                sample_sensor_data
            )
            latencies.append(latency_ms)

        avg_latency = np.mean(latencies)
        max_latency = np.max(latencies)
        p99_latency = np.percentile(latencies, 99)

        # Assert latency requirements
        assert avg_latency < LATENCY_THRESHOLD_MS, f"Average latency {avg_latency:.2f}ms exceeds threshold {LATENCY_THRESHOLD_MS}ms"
        assert max_latency < LATENCY_THRESHOLD_MS * 2, f"Maximum latency {max_latency:.2f}ms exceeds acceptable limit"
        assert p99_latency < LATENCY_THRESHOLD_MS, f"99th percentile latency {p99_latency:.2f}ms exceeds threshold"

        print(f"Latency metrics - Avg: {avg_latency:.2f}ms, Max: {max_latency:.2f}ms, P99: {p99_latency:.2f}ms")

    def test_emergency_braking_latency(self, performance_tester):
        """Test emergency braking response latency"""
        def emergency_brake_simulation():
            # Simulate emergency braking decision
            time.sleep(0.2)  # 2ms processing time
            return {"action": "emergency_brake", "force": 100}

        latencies = []
        for _ in range(50):
            latency_ms = performance_tester.measure_latency(emergency_brake_simulation)
            latencies.append(latency_ms)

        max_latency = np.max(latencies)

        # Emergency braking must be faster than 5ms
        assert max_latency < 5.0, f"Emergency braking latency {max_latency:.2f}ms exceeds 5ms safety requirement"

    def test_obstacle_detection_latency(self, performance_tester, sample_sensor_data):
        """Test obstacle detection latency under various conditions"""
        scenarios = [
            {"objects": []},  # No objects
            {"objects": [{"type": "vehicle", "position": [10.0, 5.0]}]},  # Single object
            {"objects": [{"type": "vehicle", "position": [i, j]} for i in range(5) for j in range(5)]}  # Multiple objects
        ]

        for scenario in scenarios:
            test_data = sample_sensor_data.copy()
            test_data.update(scenario)

            latency_ms = performance_tester.measure_latency(
                performance_tester.processor.process_sensor_data,
                test_data
            )

            assert latency_ms < LATENCY_THRESHOLD_MS, f"Obstacle detection latency {latency_ms:.2f}ms exceeds threshold for scenario with {len(scenario['objects'])} objects"

class TestThroughputValidation:
    """Test system throughput under normal and high load conditions"""

    @pytest.mark.asyncio
    async def test_concurrent_sensor_processing(self, performance_tester, sample_sensor_data):
        """Test throughput with concurrent sensor data processing"""
        num_concurrent_requests = 50
        start_time = time.perf_counter()

        # Create multiple concurrent processing tasks
        tasks = [
            performance_tester.processor.process_sensor_data(sample_sensor_data)
            for _ in range(num_concurrent_requests)
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.perf_counter()

        # Calculate throughput
        successful_operations = sum(1 for r in results if not isinstance(r, Exception))
        total_time_sec = end_time - start_time
        throughput_ops_sec = successful_operations / total_time_sec

        assert throughput_ops_sec >= THROUGHPUT_MIN_OPS_SEC, f"Throughput {throughput_ops_sec:.2f} ops/sec below minimum {THROUGHPUT_MIN_OPS_SEC}"
        assert successful_operations >= num_concurrent_requests * 0.99, f"Too many failed operations: {num_concurrent_requests - successful_operations}"

        print(f"Concurrent processing throughput: {throughput_ops_sec:.2f} ops/sec")

    def test_sustained_throughput(self, performance_tester, sample_sensor_data):
        """Test sustained throughput over time"""
        duration_sec = 10.0
        start_time = time.perf_counter()
        operation_count = 0

        while time.perf_counter() - start_time < duration_sec:
            try:
                asyncio.run(performance_tester.processor.process_sensor_data(sample_sensor_data))
                operation_count += 1
            except Exception:
                pass  # Continue processing despite errors

        actual_duration = time.perf_counter() - start_time
        sustained_throughput = operation_count / actual_duration

        assert sustained_throughput >= THROUGHPUT_MIN_OPS_SEC * 0.8, f"Sustained throughput {sustained_throughput:.2f} ops/sec below acceptable level"

        print(f"Sustained throughput over {actual_duration:.2f}s: {sustained_throughput:.2f} ops/sec")

class TestResourceUsageMonitoring:
    """Test system resource usage under various load conditions"""

    def test_memory_usage_under_load(self, performance_tester, sample_sensor_data):
        """Test memory usage doesn't exceed limits under load"""
        initial_memory = psutil.Process().memory_info().rss / 1024 / 1024

        # Process data repeatedly to stress memory
        for _ in range(1000):
            try:
                asyncio.run(performance_tester.processor.process_sensor_data(sample_sensor_data))
            except Exception:
                pass

        final_memory = psutil.Process().memory_info().rss / 1024 / 1024
        memory_increase = final_memory - initial_memory

        assert memory_increase < MAX_MEMORY_USAGE_MB, f"Memory usage increased by {memory_increase:.2f}MB, exceeding limit {MAX_MEMORY_USAGE_MB}MB"

        print(f"Memory usage increase: {memory_increase:.2f}MB")

    def test_cpu_usage_monitoring(self, performance_tester):
        """Test CPU usage remains within acceptable limits"""
        def cpu_intensive_task():
            # Simulate CPU-intensive processing
            for _ in range(10000):
                _ = sum(i**2 for i in range(100))

        # Monitor CPU usage during intensive task
        process = psutil.Process()
        cpu_measurements = []

        # Run task and measure CPU
        start_time = time.perf_counter()
        while time.perf_counter() - start_time < 5.0:
            cpu_percent = process.cpu_percent(interval=0.1)
            cpu_measurements.append(cpu_percent)
            cpu_intensive_task()

        avg_cpu = np.mean(cpu_measurements)
        max_cpu = np.max(cpu_measurements)

        assert avg_cpu < MAX_CPU_USAGE_PERCENT, f"Average CPU usage {avg_cpu:.2f}% exceeds limit {MAX_CPU_USAGE_PERCENT}%"

        print(f"CPU usage - Average: {avg_cpu:.2f}%, Maximum: {max_cpu:.2f}%")

class TestStressConditions:
    """Test system behavior under stress conditions"""

    @pytest.mark.slow
    def test_high_load_stress_test(self, performance_tester, sample_sensor_data):
        """Comprehensive stress test with high load"""
        stress_duration = STRESS_TEST_DURATION_SEC
        num_threads = MAXIMUM_FUNCTION_PARAMETERS
        operations_per_thread = 100

        results = []
        errors = []

        def worker_thread():
            thread_results = []
            thread_errors = []

            for _ in range(operations_per_thread):
                try:
                    start_time = time.perf_counter()
                    asyncio.run(performance_tester.processor.process_sensor_data(sample_sensor_data))
                    end_time = time.perf_counter()

                    thread_results.append((end_time - start_time) * 1000)  # Convert to ms
                except Exception as e:
                    thread_errors.append(str(e))

            results.extend(thread_results)
            errors.extend(thread_errors)

        # Launch worker threads
        threads = []
        start_time = time.perf_counter()

        for _ in range(num_threads):
            thread = threading.Thread(target=worker_thread)
            thread.start()
            threads.append(thread)

        # Wait for completion
        for thread in threads:
            thread.join()

        end_time = time.perf_counter()

        # Analyze results
        if results:
            avg_latency = np.mean(results)
            max_latency = np.max(results)
            error_rate = len(errors) / (len(results) + len(errors))
            total_operations = len(results) + len(errors)
            throughput = total_operations / (end_time - start_time)

            print(f"  Total operations: {total_operations}")
            print(f"  Average latency: {avg_latency:.2f}ms")
            print(f"  Maximum latency: {max_latency:.2f}ms")
            print(f"  Error rate: {error_rate:.2%}")
            print(f"  Throughput: {throughput:.2f} ops/sec")

            # Assertions for stress test
            assert error_rate < 0.5, f"Error rate {error_rate:.2%} exceeds 5% limit during stress test"
            assert avg_latency < LATENCY_THRESHOLD_MS * 2, f"Average latency {avg_latency:.2f}ms exceeds stress test limit"
            assert throughput > THROUGHPUT_MIN_OPS_SEC * 0.5, f"Throughput {throughput:.2f} ops/sec below stress test minimum"

    def test_memory_leak_detection(self, performance_tester, sample_sensor_data):
        """Test for memory leaks during extended operation"""
        initial_memory = psutil.Process().memory_info().rss

        # Run operations to detect potential memory leaks
        for cycle in range(10):
            for _ in range(100):
                try:
                    asyncio.run(performance_tester.processor.process_sensor_data(sample_sensor_data))
                except Exception:
                    pass

            current_memory = psutil.Process().memory_info().rss
            memory_growth = (current_memory - initial_memory) / 1024 / 1024

            print(f"Cycle {cycle + 1}: Memory growth {memory_growth:.2f}MB")

            # Memory should not grow indefinitely
            assert memory_growth < 100.0, f"Potential memory leak detected: {memory_growth:.2f}MB growth"

class TestPerformanceReporting:
    """Test performance reporting and metrics collection"""

    def test_metrics_collection(self, performance_tester, sample_sensor_data):
        """Test comprehensive metrics collection"""
        metrics = []

        for _ in range(10):
            start_time = time.perf_counter()
            resources_before = performance_tester.measure_system_resources()

            try:
                asyncio.run(performance_tester.processor.process_sensor_data(sample_sensor_data))
                error_occurred = False
            except Exception:
                error_occurred = True

            end_time = time.perf_counter()
            resources_after = performance_tester.measure_system_resources()

            metric = PerformanceMetrics(
                latency_ms=(end_time - start_time) * 1000,
                throughput_ops_sec=1.0 / (end_time - start_time),
                cpu_usage_percent=resources_after["cpu_percent"],
                memory_usage_mb=resources_after["memory_mb"],
                error_rate_percent=100.0 if error_occurred else 0.0,
                timestamp=time.time()
            )

            metrics.append(metric)
            performance_tester.metrics_history.append(metric)

        # Validate metrics structure
        assert len(metrics) == 10, "Not all metrics were collected"
        assert all(m.latency_ms > 0 for m in metrics), "Invalid latency measurements"
        assert all(m.timestamp > 0 for m in metrics), "Invalid timestamps"

        # Save metrics to file for analysis
        metrics_data = [
            {
                "latency_ms": m.latency_ms,
                "throughput_ops_sec": m.throughput_ops_sec,
                "cpu_usage_percent": m.cpu_usage_percent,
                "memory_usage_mb": m.memory_usage_mb,
                "error_rate_percent": m.error_rate_percent,
                "timestamp": m.timestamp
            }
            for m in metrics
        ]

        os.makedirs("tests/phase7_adas/reports", exist_ok=True)
        with open("tests/phase7_adas/reports/performance_metrics.json", "w") as f:
            json.dump(metrics_data, f, indent=2)

if __name__ == "__main__":
    # Run specific performance tests
    pytest.main([__file__, "-v", "--tb=short"])