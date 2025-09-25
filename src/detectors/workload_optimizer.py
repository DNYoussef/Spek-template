"""
Dynamic Workload Optimization and Resource Allocation System

This module provides advanced workload pattern analysis and dynamic resource
allocation capabilities for the enterprise detector pool. It analyzes historical
execution patterns, predicts resource needs, and optimizes allocation strategies
to maintain <1% overhead while maximizing throughput.

Key Features:
- ML-based workload prediction using historical patterns
- Dynamic thread pool sizing based on system load
- Intelligent detector scheduling with priority queuing
- Resource contention detection and mitigation
- Adaptive concurrency control with feedback loops
"""

from collections import defaultdict, deque
from pathlib import Path
from typing import Dict, List, Set, Optional, Any, Tuple, Callable
import json
import logging
import time

from contextlib import contextmanager
from dataclasses import dataclass, field
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import asyncio
import math
import numpy as np
import pickle
import psutil
import sqlite3
import threading

@dataclass
class WorkloadMetrics:
    """Comprehensive workload metrics for analysis."""
    timestamp: float
    detector_name: str
    execution_time: float
    cpu_usage: float
    memory_usage: float
    queue_depth: int
    concurrency_level: int
    system_load: float
    cache_hit_rate: float
    error_occurred: bool = False

@dataclass
class ResourceAllocation:
    """Resource allocation decision for optimal performance."""
    max_threads: int
    max_concurrent_detectors: int
    cache_size: int
    priority_weights: Dict[str, float]
    estimated_overhead: float
    confidence_score: float

@dataclass
class PredictionModel:
    """Machine learning model for workload prediction."""
    model: Any = None
    scaler: StandardScaler = field(default_factory=StandardScaler)
    feature_names: List[str] = field(default_factory=list)
    last_trained: Optional[float] = None
    accuracy_score: float = 0.0

class WorkloadPredictor:
    """ML-based workload prediction system."""

def __init__(self, history_size: int = 10000):
        self.history_size = history_size
        self.metrics_history: deque = deque(maxlen=history_size)
        self.execution_time_model = PredictionModel()
        self.resource_usage_model = PredictionModel()
        self.retrain_threshold = 0.8  # Retrain if accuracy drops below 80%
        self.min_samples_for_training = 100

def record_metrics(self, metrics: WorkloadMetrics) -> None:
        """Record workload metrics for analysis."""
        self.metrics_history.append(metrics)

        # Trigger retraining if needed
        if (len(self.metrics_history) % 500 == 0 and
            len(self.metrics_history) >= self.min_samples_for_training):
            self._retrain_models()

def _extract_features(self, metrics: WorkloadMetrics) -> List[float]:
        """Extract features for ML models."""
        return [
            metrics.queue_depth,
            metrics.concurrency_level,
            metrics.system_load,
            metrics.cache_hit_rate,
            float(metrics.error_occurred),
            # Time-based features
            time.time() % 3600,  # Hour of day
            time.time() % 86400,  # Time of day
        ]

def _prepare_training_data(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Prepare training data from metrics history."""
        if len(self.metrics_history) < self.min_samples_for_training:
            return None, None, None

        features = []
        execution_times = []
        resource_usage = []

        for metrics in self.metrics_history:
            if not metrics.error_occurred:  # Only use successful executions
                features.append(self._extract_features(metrics))
                execution_times.append(metrics.execution_time)
                resource_usage.append(metrics.cpu_usage + metrics.memory_usage)

        if len(features) < self.min_samples_for_training:
            return None, None, None

        return np.array(features), np.array(execution_times), np.array(resource_usage)

def _retrain_models(self) -> None:
        """Retrain ML models with latest data."""
        try:
            features, execution_times, resource_usage = self._prepare_training_data()

            if features is None:
                logging.warning("Insufficient data for model retraining")
                return

            # Train execution time model
            self.execution_time_model.scaler.fit(features)
            scaled_features = self.execution_time_model.scaler.transform(features)

            self.execution_time_model.model = RandomForestRegressor(
                n_estimators=50,
                max_depth=10,
                random_state=42
            )
            self.execution_time_model.model.fit(scaled_features, execution_times)
            self.execution_time_model.last_trained = time.time()

            # Calculate accuracy (R0 score)
            predictions = self.execution_time_model.model.predict(scaled_features)
            self.execution_time_model.accuracy_score = self.execution_time_model.model.score(
                scaled_features, execution_times
            )

            # Train resource usage model
            self.resource_usage_model.scaler.fit(features)
            scaled_features_resource = self.resource_usage_model.scaler.transform(features)

            self.resource_usage_model.model = RandomForestRegressor(
                n_estimators=50,
                max_depth=10,
                random_state=42
            )
            self.resource_usage_model.model.fit(scaled_features_resource, resource_usage)
            self.resource_usage_model.last_trained = time.time()

            self.resource_usage_model.accuracy_score = self.resource_usage_model.model.score(
                scaled_features_resource, resource_usage
            )

            logging.info(f"Models retrained - Execution time R: {self.execution_time_model.accuracy_score:.3f}, "
                        f"Resource usage R: {self.resource_usage_model.accuracy_score:.3f}")

        except Exception as e:
            logging.error(f"Model retraining failed: {e}")

def predict_execution_time(self,
                            queue_depth: int,
                            concurrency_level: int,
                            system_load: float,
                            cache_hit_rate: float) -> float:
        """Predict execution time for given conditions."""
        if (self.execution_time_model.model is None or
            self.execution_time_model.accuracy_score < self.retrain_threshold):
            return 1.0  # Default fallback

        try:
            features = np.array([[
                queue_depth,
                concurrency_level,
                system_load,
                cache_hit_rate,
                0.0,  # No error assumed
                time.time() % 3600,
                time.time() % 86400
            ]])

            scaled_features = self.execution_time_model.scaler.transform(features)
            prediction = self.execution_time_model.model.predict(scaled_features)[0]

            return max(0.1, prediction)  # Ensure positive prediction

        except Exception as e:
            logging.warning(f"Execution time prediction failed: {e}")
            return 1.0

def predict_resource_usage(self,
                                queue_depth: int,
                                concurrency_level: int,
                                system_load: float,
                                cache_hit_rate: float) -> float:
        """Predict resource usage for given conditions."""
        if (self.resource_usage_model.model is None or
            self.resource_usage_model.accuracy_score < self.retrain_threshold):
            return 0.5  # Default fallback

        try:
            features = np.array([[
                queue_depth,
                concurrency_level,
                system_load,
                cache_hit_rate,
                0.0,  # No error assumed
                time.time() % 3600,
                time.time() % 86400
            ]])

            scaled_features = self.resource_usage_model.scaler.transform(features)
            prediction = self.resource_usage_model.model.predict(scaled_features)[0]

            return max(0.1, min(2.0, prediction))  # Clamp between reasonable bounds

        except Exception as e:
            logging.warning(f"Resource usage prediction failed: {e}")
            return 0.5

class AdaptiveConcurrencyController:
    """Adaptive concurrency control with feedback loops."""

def __init__(self, initial_concurrency: int = 4):
        self.current_concurrency = initial_concurrency
        self.min_concurrency = 1
        self.max_concurrency = min(32, psutil.cpu_count() * 2)

        # Control parameters
        self.target_overhead = 0.1  # 1% target overhead
        self.overhead_tolerance = 0.5  # 0.5% tolerance
        self.adjustment_factor = 0.2  # How aggressively to adjust

        # Feedback tracking
        self.recent_overheads: deque = deque(maxlen=10)
        self.recent_throughputs: deque = deque(maxlen=10)
        self.last_adjustment = 0
        self.adjustment_cooldown = 30.0  # 30 seconds between adjustments

def record_performance(self, overhead: float, throughput: float) -> None:
        """Record performance metrics for feedback control."""
        self.recent_overheads.append(overhead)
        self.recent_throughputs.append(throughput)

def should_adjust(self) -> bool:
        """Determine if concurrency adjustment is needed."""
        if time.time() - self.last_adjustment < self.adjustment_cooldown:
            return False

        if len(self.recent_overheads) < 3:
            return False

        avg_overhead = sum(self.recent_overheads) / len(self.recent_overheads)
        return abs(avg_overhead - self.target_overhead) > self.overhead_tolerance

def adjust_concurrency(self) -> int:
        """Adjust concurrency based on recent performance."""
        if not self.should_adjust():
            return self.current_concurrency

        avg_overhead = sum(self.recent_overheads) / len(self.recent_overheads)
        avg_throughput = sum(self.recent_throughputs) / len(self.recent_throughputs)

        # Calculate adjustment direction and magnitude
        overhead_error = avg_overhead - self.target_overhead

        if overhead_error > self.overhead_tolerance:
            # Overhead too high, reduce concurrency
            adjustment = -max(1, int(self.current_concurrency * self.adjustment_factor))
        elif overhead_error < -self.overhead_tolerance:
            # Overhead too low, can increase concurrency for better throughput
            adjustment = max(1, int(self.current_concurrency * self.adjustment_factor))
        else:
            adjustment = 0

        # Apply adjustment with bounds checking
        new_concurrency = max(
            self.min_concurrency,
            min(self.max_concurrency, self.current_concurrency + adjustment)
        )

        if new_concurrency != self.current_concurrency:
            logging.info(f"Adjusting concurrency: {self.current_concurrency} -> {new_concurrency} "
                        f"(overhead: {avg_overhead:.3f}, target: {self.target_overhead:.3f})")

            self.current_concurrency = new_concurrency
            self.last_adjustment = time.time()

        return self.current_concurrency

def get_optimal_concurrency(self,
                                queue_size: int,
                                system_load: float,
                                predicted_execution_time: float) -> int:
        """Calculate optimal concurrency for current conditions."""
        # Base concurrency on queue size and predicted execution time
        base_concurrency = min(queue_size, self.current_concurrency)

        # Adjust for system load
        if system_load > 0.8:
            base_concurrency = max(1, int(base_concurrency * 0.5))
        elif system_load < 0.3:
            base_concurrency = min(self.max_concurrency, int(base_concurrency * 1.5))

        # Adjust for predicted execution time
        if predicted_execution_time > 5.0:  # Long-running tasks
            base_concurrency = max(1, int(base_concurrency * 0.7))
        elif predicted_execution_time < 0.1:  # Very fast tasks
            base_concurrency = min(self.max_concurrency, int(base_concurrency * 1.3))

        return max(self.min_concurrency, min(self.max_concurrency, base_concurrency))

class PriorityScheduler:
    """Intelligent detector scheduling with priority queuing."""

def __init__(self):
        self.priority_queues: Dict[int, deque] = defaultdict(deque)
        self.detector_priorities: Dict[str, int] = {}
        self.detector_weights: Dict[str, float] = {}
        self.execution_counts: Dict[str, int] = defaultdict(int)
        self.last_execution: Dict[str, float] = {}

def set_detector_priority(self, detector_name: str, priority: int, weight: float = 1.0) -> None:
        """Set priority and weight for a detector."""
        self.detector_priorities[detector_name] = priority
        self.detector_weights[detector_name] = weight

def enqueue_task(self, detector_name: str, args: tuple, kwargs: dict) -> None:
        """Enqueue a task with priority-based scheduling."""
        priority = self.detector_priorities.get(detector_name, 5)  # Default priority
        task = (detector_name, args, kwargs, time.time())
        self.priority_queues[priority].append(task)

def dequeue_batch(self, batch_size: int) -> List[Tuple[str, tuple, dict]]:
        """Dequeue a batch of tasks with optimal scheduling."""
        batch = []

        # Process queues in priority order (higher number = higher priority)
        for priority in sorted(self.priority_queues.keys(), reverse=True):
            queue = self.priority_queues[priority]

            while queue and len(batch) < batch_size:
                detector_name, args, kwargs, enqueue_time = queue.popleft()

                # Apply fairness - don't let high-frequency detectors dominate
                if self._should_schedule(detector_name):
                    batch.append((detector_name, args, kwargs))
                    self.execution_counts[detector_name] += 1
                    self.last_execution[detector_name] = time.time()
                else:
                    # Re-enqueue with lower effective priority
                    queue.append((detector_name, args, kwargs, enqueue_time))

        return batch

def _should_schedule(self, detector_name: str) -> bool:
        """Determine if detector should be scheduled based on fairness."""
        current_time = time.time()
        last_exec = self.last_execution.get(detector_name, 0)
        exec_count = self.execution_counts.get(detector_name, 0)

        # Apply backoff for frequently executed detectors
        min_interval = math.log(exec_count + 1) * 0.1  # Logarithmic backoff

        return current_time - last_exec >= min_interval

def get_queue_stats(self) -> Dict[str, Any]:
        """Get current queue statistics."""
        total_queued = sum(len(queue) for queue in self.priority_queues.values())
        queue_sizes = {priority: len(queue) for priority, queue in self.priority_queues.items()}

        return {
            'total_queued': total_queued,
            'queue_sizes': queue_sizes,
            'execution_counts': dict(self.execution_counts),
            'detector_priorities': dict(self.detector_priorities)
        }

class ResourceContentionDetector:
    """Detect and mitigate resource contention issues."""

def __init__(self):
        self.cpu_usage_history: deque = deque(maxlen=60)  # 1 minute of data
        self.memory_usage_history: deque = deque(maxlen=60)
        self.io_wait_history: deque = deque(maxlen=60)
        self.contention_threshold = 0.85
        self.contention_events: List[Dict] = []

def record_system_metrics(self) -> None:
        """Record current system metrics."""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            io_counters = psutil.disk_io_counters()

            self.cpu_usage_history.append(cpu_percent / 100.0)
            self.memory_usage_history.append(memory.percent / 100.0)

            # Simplified I/O wait calculation
            io_wait = 0.0  # Would need more sophisticated calculation in production
            self.io_wait_history.append(io_wait)

        except Exception as e:
            logging.warning(f"Failed to record system metrics: {e}")

def detect_contention(self) -> Dict[str, Any]:
        """Detect resource contention and return mitigation suggestions."""
        if not self.cpu_usage_history:
            return {'contention_detected': False}

        # Calculate recent averages
        recent_cpu = sum(list(self.cpu_usage_history)[-10:]) / min(10, len(self.cpu_usage_history))
        recent_memory = sum(list(self.memory_usage_history)[-10:]) / min(10, len(self.memory_usage_history))
        recent_io = sum(list(self.io_wait_history)[-10:]) / min(10, len(self.io_wait_history))

        contention_info = {
            'contention_detected': False,
            'cpu_contention': recent_cpu > self.contention_threshold,
            'memory_contention': recent_memory > self.contention_threshold,
            'io_contention': recent_io > self.contention_threshold,
            'suggested_actions': []
        }

        if recent_cpu > self.contention_threshold:
            contention_info['contention_detected'] = True
            contention_info['suggested_actions'].append('reduce_concurrency')

        if recent_memory > self.contention_threshold:
            contention_info['contention_detected'] = True
            contention_info['suggested_actions'].append('clear_caches')
            contention_info['suggested_actions'].append('reduce_cache_size')

        if recent_io > self.contention_threshold:
            contention_info['contention_detected'] = True
            contention_info['suggested_actions'].append('batch_io_operations')

        # Log contention event
        if contention_info['contention_detected']:
            event = {
                'timestamp': time.time(),
                'cpu_usage': recent_cpu,
                'memory_usage': recent_memory,
                'io_usage': recent_io,
                'actions': contention_info['suggested_actions']
            }
            self.contention_events.append(event)

        return contention_info

class WorkloadOptimizer:
    """Main workload optimization coordinator."""

def __init__(self):
        self.predictor = WorkloadPredictor()
        self.concurrency_controller = AdaptiveConcurrencyController()
        self.scheduler = PriorityScheduler()
        self.contention_detector = ResourceContentionDetector()

        self.optimization_enabled = True
        self.last_optimization = 0
        self.optimization_interval = 60.0  # Optimize every minute

        # Performance tracking
        self.optimization_history: List[Dict] = []

def register_detector(self,
                        detector_name: str,
                        priority: int = 5,
                        weight: float = 1.0,
                        complexity_score: float = 1.0) -> None:
        """Register detector with optimization system."""
        self.scheduler.set_detector_priority(detector_name, priority, weight)

def record_execution_metrics(self, metrics: WorkloadMetrics) -> None:
        """Record execution metrics for optimization."""
        self.predictor.record_metrics(metrics)

        # Record performance for concurrency control
        overhead = max(0, metrics.execution_time - 0.1) / max(0.1, metrics.execution_time)
        throughput = 1.0 / max(0.1, metrics.execution_time)

        self.concurrency_controller.record_performance(overhead, throughput)

def optimize_allocation(self,
                            pending_tasks: List[Tuple[str, tuple, dict]],
                            current_system_load: float) -> ResourceAllocation:
        """Optimize resource allocation for pending tasks."""
        if not self.optimization_enabled:
            return self._get_default_allocation()

        # Check for resource contention
        self.contention_detector.record_system_metrics()
        contention_info = self.contention_detector.detect_contention()

        # Predict workload characteristics
        queue_depth = len(pending_tasks)
        cache_hit_rate = 0.7  # Would get from actual cache metrics

        predicted_execution_time = self.predictor.predict_execution_time(
            queue_depth, self.concurrency_controller.current_concurrency,
            current_system_load, cache_hit_rate
        )

        predicted_resource_usage = self.predictor.predict_resource_usage(
            queue_depth, self.concurrency_controller.current_concurrency,
            current_system_load, cache_hit_rate
        )

        # Calculate optimal concurrency
        optimal_concurrency = self.concurrency_controller.get_optimal_concurrency(
            queue_depth, current_system_load, predicted_execution_time
        )

        # Apply contention mitigation
        if contention_info['contention_detected']:
            if 'reduce_concurrency' in contention_info['suggested_actions']:
                optimal_concurrency = max(1, int(optimal_concurrency * 0.5))

        # Calculate cache size based on memory pressure
        base_cache_size = 10000
        if contention_info.get('memory_contention', False):
            cache_size = max(1000, int(base_cache_size * 0.5))
        else:
            cache_size = base_cache_size

        # Generate priority weights
        priority_weights = {}
        for detector_name, _, _ in pending_tasks:
            base_weight = self.scheduler.detector_weights.get(detector_name, 1.0)
            exec_count = self.scheduler.execution_counts.get(detector_name, 0)

            # Apply fairness adjustment
            fairness_factor = 1.0 / (1.0 + exec_count * 0.1)
            priority_weights[detector_name] = base_weight * fairness_factor

        # Estimate overhead
        base_overhead = 0.5  # 0.5% base overhead
        complexity_factor = sum(
            self.scheduler.detector_weights.get(name, 1.0)
            for name, _, _ in pending_tasks
        ) / max(1, len(pending_tasks))

        estimated_overhead = base_overhead * complexity_factor

        # Calculate confidence score
        model_confidence = (
            self.predictor.execution_time_model.accuracy_score +
            self.predictor.resource_usage_model.accuracy_score
        ) / 2.0

        data_confidence = min(1.0, len(self.predictor.metrics_history) / 1000.0)
        confidence_score = (model_confidence + data_confidence) / 2.0

        allocation = ResourceAllocation(
            max_threads=optimal_concurrency,
            max_concurrent_detectors=optimal_concurrency,
            cache_size=cache_size,
            priority_weights=priority_weights,
            estimated_overhead=estimated_overhead,
            confidence_score=confidence_score
        )

        # Record optimization decision
        optimization_record = {
            'timestamp': time.time(),
            'allocation': allocation,
            'contention_info': contention_info,
            'predicted_execution_time': predicted_execution_time,
            'predicted_resource_usage': predicted_resource_usage,
            'queue_depth': queue_depth
        }
        self.optimization_history.append(optimization_record)

        logging.info(f"Workload optimization: concurrency={optimal_concurrency}, "
                    f"cache_size={cache_size}, estimated_overhead={estimated_overhead:.3f}, "
                    f"confidence={confidence_score:.3f}")

        return allocation

def _get_default_allocation(self) -> ResourceAllocation:
        """Get default resource allocation when optimization is disabled."""
        return ResourceAllocation(
            max_threads=4,
            max_concurrent_detectors=4,
            cache_size=10000,
            priority_weights={},
            estimated_overhead=0.1,
            confidence_score=0.5
        )

def get_optimization_stats(self) -> Dict[str, Any]:
        """Get optimization statistics and performance metrics."""
        if not self.optimization_history:
            return {'status': 'no_data'}

        recent_optimizations = self.optimization_history[-10:]

        avg_overhead = sum(opt['allocation'].estimated_overhead for opt in recent_optimizations) / len(recent_optimizations)
        avg_confidence = sum(opt['allocation'].confidence_score for opt in recent_optimizations) / len(recent_optimizations)

        contention_events = sum(
            1 for opt in recent_optimizations
            if opt['contention_info']['contention_detected']
        )

        return {
            'status': 'active',
            'total_optimizations': len(self.optimization_history),
            'recent_avg_overhead': avg_overhead,
            'recent_avg_confidence': avg_confidence,
            'recent_contention_events': contention_events,
            'current_concurrency': self.concurrency_controller.current_concurrency,
            'queue_stats': self.scheduler.get_queue_stats(),
            'model_accuracy': {
                'execution_time': self.predictor.execution_time_model.accuracy_score,
                'resource_usage': self.predictor.resource_usage_model.accuracy_score
            }
        }

def enable_optimization(self) -> None:
        """Enable workload optimization."""
        self.optimization_enabled = True
        logging.info("Workload optimization enabled")

def disable_optimization(self) -> None:
        """Disable workload optimization."""
        self.optimization_enabled = False
        logging.info("Workload optimization disabled")

def save_state(self, filepath: str) -> None:
        """Save optimizer state for persistence."""
        state = {
            'optimization_history': self.optimization_history,
            'metrics_history': list(self.predictor.metrics_history),
            'execution_counts': dict(self.scheduler.execution_counts),
            'detector_priorities': dict(self.scheduler.detector_priorities),
            'contention_events': self.contention_detector.contention_events
        }

        with open(filepath, 'wb') as f:
            pickle.dump(state, f)

def load_state(self, filepath: str) -> None:
        """Load optimizer state for persistence."""
        try:
            with open(filepath, 'rb') as f:
                state = pickle.load(f)

            self.optimization_history = state.get('optimization_history', [])

            # Restore metrics history
            for metrics_dict in state.get('metrics_history', []):
                if isinstance(metrics_dict, dict):
                    metrics = WorkloadMetrics(**metrics_dict)
                    self.predictor.metrics_history.append(metrics)

            # Restore scheduler state
            self.scheduler.execution_counts.update(state.get('execution_counts', {}))
            self.scheduler.detector_priorities.update(state.get('detector_priorities', {}))

            # Restore contention events
            self.contention_detector.contention_events = state.get('contention_events', [])

            logging.info(f"Optimizer state loaded from {filepath}")

        except Exception as e:
            logging.error(f"Failed to load optimizer state: {e}")

# Example usage and testing
if __name__ == "__main__":
    # Create workload optimizer
    optimizer = WorkloadOptimizer()

    # Register some detectors
    optimizer.register_detector("critical_detector", priority=10, weight=2.0, complexity_score=3.0)
    optimizer.register_detector("standard_detector", priority=5, weight=1.0, complexity_score=1.5)
    optimizer.register_detector("background_detector", priority=1, weight=0.5, complexity_score=0.8)

    # Simulate some workload
    pending_tasks = [
        ("critical_detector", (), {}),
        ("standard_detector", (), {}),
        ("background_detector", (), {}),
        ("standard_detector", (), {})
    ]

    # Optimize allocation
    allocation = optimizer.optimize_allocation(pending_tasks, current_system_load=0.3)
    print(f"Optimized allocation: {allocation}")

    # Get stats
    stats = optimizer.get_optimization_stats()
    print(f"Optimization stats: {stats}")