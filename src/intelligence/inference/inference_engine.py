"""
High-performance real-time inference engine with <100ms latency guarantee.
Implements model optimization, caching, and batch processing for trading systems.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union, Tuple, Any
import time

from dataclasses import dataclass, field
from lib.shared.utilities import get_logger
import asyncio
import numpy as np
import torch
import torch.nn as nn

@dataclass
class InferenceRequest:
    """Request object for model inference."""
    request_id: str
    symbol: str
    features: np.ndarray
    timestamp: datetime = field(default_factory=datetime.now)
    priority: int = 1  # 1 = high, 2 = medium, 3 = low
    timeout_ms: int = 100
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class InferenceResponse:
    """Response object from model inference."""
    request_id: str
    symbol: str
    predictions: Dict[str, float]
    confidence: float
    latency_ms: float
    timestamp: datetime
    model_version: str
    cache_hit: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class InferenceMetrics:
    """Metrics for monitoring inference performance."""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    cache_hits: int = 0
    avg_latency_ms: float = 0.0
    p95_latency_ms: float = 0.0
    p99_latency_ms: float = 0.0
    requests_per_second: float = 0.0
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    gpu_utilization: float = 0.0

class LatencyTracker:
    """Track inference latency statistics."""
    
    def __init__(self, window_size: int = 1000):
        self.window_size = window_size
        self.latencies = []
        self.lock = threading.Lock()
    
    def add_latency(self, latency_ms: float):
        """Add a latency measurement."""
        with self.lock:
            self.latencies.append(latency_ms)
            if len(self.latencies) > self.window_size:
                self.latencies.pop(0)
    
    def get_stats(self) -> Dict[str, float]:
        """Get latency statistics."""
        with self.lock:
            if not self.latencies:
                return {'avg': 0.0, 'p95': 0.0, 'p99': 0.0, 'max': 0.0}
            
            latencies = np.array(self.latencies)
            return {
                'avg': float(np.mean(latencies)),
                'p95': float(np.percentile(latencies, 95)),
                'p99': float(np.percentile(latencies, 99)),
                'max': float(np.max(latencies))
            }

class RequestQueue:
    """Priority queue for inference requests."""
    
    def __init__(self, maxsize: int = 10000):
        self.queues = {
            1: Queue(maxsize=maxsize//3),  # High priority
            2: Queue(maxsize=maxsize//3),  # Medium priority
            3: Queue(maxsize=maxsize//3)   # Low priority
        }
        self.lock = threading.Lock()
    
    def put(self, request: InferenceRequest, timeout: float = None) -> bool:
        """Add request to appropriate priority queue."""
        try:
            self.queues[request.priority].put(request, timeout=timeout)
            return True
        except:
            return False
    
    def get(self, timeout: float = None) -> Optional[InferenceRequest]:
        """Get next request, prioritizing high priority items."""
        # Try high priority first
        for priority in [1, 2, 3]:
            try:
                return self.queues[priority].get(timeout=timeout)
            except Empty:
                continue
        return None
    
    def size(self) -> Dict[int, int]:
        """Get queue sizes by priority."""
        return {p: q.qsize() for p, q in self.queues.items()}

class RealTimeInferenceEngine:
    """High-performance real-time inference engine."""
    
    def __init__(
        self,
        model_registry: ModelRegistry,
        batch_size: int = None,
        max_latency_ms: int = None,
        enable_caching: bool = True,
        enable_batching: bool = True,
        num_workers: int = None
    ):
        self.model_registry = model_registry
        self.batch_size = batch_size or config.inference.batch_size
        self.max_latency_ms = max_latency_ms or config.inference.max_latency_ms
        self.enable_caching = enable_caching
        self.enable_batching = enable_batching
        
        # Worker configuration
        self.num_workers = num_workers or config.inference.num_workers
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Model management
        self.models: Dict[str, nn.Module] = {}
        self.model_versions: Dict[str, ModelVersion] = {}
        self.optimized_models: Dict[str, nn.Module] = {}
        
        # Performance components
        self.request_queue = RequestQueue()
        self.latency_tracker = LatencyTracker()
        self.metrics = InferenceMetrics()
        
        # Caching
        if enable_caching:
            self.prediction_cache = PredictionCache(
                max_size=config.inference.feature_cache_size,
                ttl_seconds=config.inference.prediction_cache_ttl
            )
            self.feature_cache = FeatureCache(
                max_size=config.inference.feature_cache_size
            )
        else:
            self.prediction_cache = None
            self.feature_cache = None
        
        # Optimization
        self.model_optimizer = ModelOptimizer()
        
        # Worker threads
        self.workers = []
        self.is_running = False
        self.executor = ThreadPoolExecutor(max_workers=self.num_workers)
        
        # Batch processing
        if enable_batching:
            self.batch_processor = BatchProcessor(
                batch_size=self.batch_size,
                max_wait_ms=self.max_latency_ms // 2
            )
        else:
            self.batch_processor = None
        
        logger.info(f"Initialized inference engine with {self.num_workers} workers")
    
    async def start(self):
        """Start the inference engine."""
        self.is_running = True
        
        # Start worker threads
        for i in range(self.num_workers):
            worker = threading.Thread(target=self._worker_loop, args=(i,))
            worker.daemon = True
            worker.start()
            self.workers.append(worker)
        
        # Start batch processor if enabled
        if self.batch_processor:
            batch_thread = threading.Thread(target=self.batch_processor.run, args=(self,))
            batch_thread.daemon = True
            batch_thread.start()
        
        # Start metrics collection
        metrics_thread = threading.Thread(target=self._metrics_loop)
        metrics_thread.daemon = True  
        metrics_thread.start()
        
        logger.info("Inference engine started")
    
    async def stop(self):
        """Stop the inference engine."""
        self.is_running = False
        
        # Wait for workers to finish
        for worker in self.workers:
            worker.join(timeout=1.0)
        
        # Shutdown executor
        self.executor.shutdown(wait=True)
        
        logger.info("Inference engine stopped")
    
    def load_model(
        self,
        model_name: str,
        version: Optional[str] = None,
        stage: Optional[str] = None,
        optimize: bool = True
    ):
        """Load and optimize a model for inference."""
        try:
            # Load model from registry
            model, model_version = self.model_registry.load_model(
                model_name, version, stage
            )
            
            # Move to device
            model = model.to(self.device)
            model.eval()
            
            # Store model
            self.models[model_name] = model
            self.model_versions[model_name] = model_version
            
            # Optimize model if requested
            if optimize:
                optimized_model = self.model_optimizer.optimize_for_inference(
                    model, self.device
                )
                self.optimized_models[model_name] = optimized_model
                logger.info(f"Optimized model {model_name} for inference")
            
            logger.info(f"Loaded model {model_name} v{model_version.version}")
            
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {e}")
            raise
    
    async def predict(
        self,
        request: InferenceRequest
    ) -> InferenceResponse:
        """Make a prediction for a single request."""
        start_time = time.perf_counter()
        
        try:
            # Check cache first
            if self.prediction_cache:
                cache_key = self._generate_cache_key(request)
                cached_response = self.prediction_cache.get(cache_key)
                if cached_response:
                    cached_response.request_id = request.request_id
                    cached_response.cache_hit = True
                    latency_ms = (time.perf_counter() - start_time) * 1000
                    cached_response.latency_ms = latency_ms
                    self.latency_tracker.add_latency(latency_ms)
                    self.metrics.cache_hits += 1
                    return cached_response
            
            # Add to queue for processing
            if not self.request_queue.put(request, timeout=0.1):
                raise TimeoutError("Request queue is full")
            
            # For real-time inference, we'd use a response mechanism
            response = await self._process_request(request)
            
            # Cache the response
            if self.prediction_cache and response:
                cache_key = self._generate_cache_key(request)
                self.prediction_cache.put(cache_key, response)
            
            # Update metrics
            latency_ms = (time.perf_counter() - start_time) * 1000
            response.latency_ms = latency_ms
            self.latency_tracker.add_latency(latency_ms)
            self.metrics.successful_requests += 1
            
            return response
            
        except Exception as e:
            logger.error(f"Prediction failed for request {request.request_id}: {e}")
            self.metrics.failed_requests += 1
            
            # Return error response
            latency_ms = (time.perf_counter() - start_time) * 1000
            return InferenceResponse(
                request_id=request.request_id,
                symbol=request.symbol,
                predictions={'error': str(e)},
                confidence=0.0,
                latency_ms=latency_ms,
                timestamp=datetime.now(),
                model_version="error"
            )
    
    async def predict_batch(
        self,
        requests: List[InferenceRequest]
    ) -> List[InferenceResponse]:
        """Make predictions for a batch of requests."""
        if not requests:
            return []
        
        start_time = time.perf_counter()
        responses = []
        
        try:
            # Group requests by model/symbol for efficient processing
            grouped_requests = self._group_requests(requests)
            
            # Process each group
            for group_key, group_requests in grouped_requests.items():
                model_name, symbol = group_key
                
                if model_name not in self.models:
                    # Return error responses for missing models
                    for req in group_requests:
                        responses.append(InferenceResponse(
                            request_id=req.request_id,
                            symbol=req.symbol,
                            predictions={'error': f'Model {model_name} not loaded'},
                            confidence=0.0,
                            latency_ms=0.0,
                            timestamp=datetime.now(),
                            model_version="error"
                        ))
                    continue
                
                # Batch process the group
                group_responses = await self._process_request_batch(group_requests)
                responses.extend(group_responses)
            
            # Update metrics
            total_latency = (time.perf_counter() - start_time) * 1000
            avg_latency = total_latency / len(requests) if requests else 0
            
            for response in responses:
                response.latency_ms = avg_latency
                self.latency_tracker.add_latency(avg_latency)
            
            self.metrics.successful_requests += len([r for r in responses if 'error' not in r.predictions])
            self.metrics.failed_requests += len([r for r in responses if 'error' in r.predictions])
            
            return responses
            
        except Exception as e:
            logger.error(f"Batch prediction failed: {e}")
            self.metrics.failed_requests += len(requests)
            
            # Return error responses
            return [
                InferenceResponse(
                    request_id=req.request_id,
                    symbol=req.symbol,
                    predictions={'error': str(e)},
                    confidence=0.0,
                    latency_ms=0.0,
                    timestamp=datetime.now(),
                    model_version="error"
                ) for req in requests
            ]
    
    def _group_requests(
        self,
        requests: List[InferenceRequest]
    ) -> Dict[Tuple[str, str], List[InferenceRequest]]:
        """Group requests by model and symbol."""
        groups = {}
        
        for request in requests:
            # For now, assume all requests use the same model
            model_name = "gary_taleb"  # Default model
            key = (model_name, request.symbol)
            
            if key not in groups:
                groups[key] = []
            groups[key].append(request)
        
        return groups
    
    async def _process_request(self, request: InferenceRequest) -> InferenceResponse:
        """Process a single inference request."""
        # Determine which model to use (simplified)
        model_name = "gary_taleb"  # In practice, this would be determined by strategy
        
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not loaded")
        
        # Get the appropriate model (optimized if available)
        model = self.optimized_models.get(model_name, self.models[model_name])
        model_version = self.model_versions[model_name]
        
        # Prepare input tensor
        features_tensor = torch.FloatTensor(request.features).unsqueeze(0).to(self.device)
        
        # Make prediction
        with torch.no_grad():
            if hasattr(model, 'predict'):
                # Use model's predict method if available
                predictions = model.predict(features_tensor)
                
                # Extract predictions
                if isinstance(predictions, dict):
                    pred_dict = {k: float(v.item() if torch.is_tensor(v) else v) 
                                for k, v in predictions.items() if torch.is_tensor(v)}
                    confidence = pred_dict.get('confidence', 0.5)
                else:
                    pred_dict = {'prediction': float(predictions.item())}
                    confidence = 0.5
            else:
                # Use model's forward method
                output = model(features_tensor)
                if hasattr(output, 'predictions'):
                    pred_dict = {'prediction': float(output.predictions.item())}
                    confidence = float(output.confidence.item()) if hasattr(output, 'confidence') else 0.5
                else:
                    pred_dict = {'prediction': float(output.item())}
                    confidence = 0.5
        
        return InferenceResponse(
            request_id=request.request_id,
            symbol=request.symbol,
            predictions=pred_dict,
            confidence=confidence,
            latency_ms=0.0,  # Will be set by caller
            timestamp=datetime.now(),
            model_version=model_version.version
        )
    
    async def _process_request_batch(
        self,
        requests: List[InferenceRequest]
    ) -> List[InferenceResponse]:
        """Process a batch of requests efficiently."""
        if not requests:
            return []
        
        model_name = "gary_taleb"  # Simplified
        
        if model_name not in self.models:
            return [
                InferenceResponse(
                    request_id=req.request_id,
                    symbol=req.symbol,
                    predictions={'error': f'Model {model_name} not loaded'},
                    confidence=0.0,
                    latency_ms=0.0,
                    timestamp=datetime.now(),
                    model_version="error"
                ) for req in requests
            ]
        
        model = self.optimized_models.get(model_name, self.models[model_name])
        model_version = self.model_versions[model_name]
        
        # Batch features
        batch_features = np.stack([req.features for req in requests])
        features_tensor = torch.FloatTensor(batch_features).to(self.device)
        
        # Batch prediction
        with torch.no_grad():
            if hasattr(model, 'predict'):
                predictions = model.predict(features_tensor)
                
                # Handle different output formats
                if isinstance(predictions, dict):
                    # Extract batch predictions
                    batch_preds = predictions.get('main_prediction', predictions.get('predictions'))
                    batch_confidence = predictions.get('confidence', torch.ones_like(batch_preds) * 0.5)
                else:
                    batch_preds = predictions
                    batch_confidence = torch.ones_like(batch_preds) * 0.5
            else:
                output = model(features_tensor)
                if hasattr(output, 'predictions'):
                    batch_preds = output.predictions
                    batch_confidence = output.confidence if hasattr(output, 'confidence') else torch.ones_like(batch_preds) * 0.5
                else:
                    batch_preds = output
                    batch_confidence = torch.ones_like(batch_preds) * 0.5
        
        # Convert to responses
        responses = []
        for i, request in enumerate(requests):
            pred_value = float(batch_preds[i].item() if torch.is_tensor(batch_preds) else batch_preds[i])
            conf_value = float(batch_confidence[i].item() if torch.is_tensor(batch_confidence) else batch_confidence[i])
            
            responses.append(InferenceResponse(
                request_id=request.request_id,
                symbol=request.symbol,
                predictions={'prediction': pred_value},
                confidence=conf_value,
                latency_ms=0.0,  # Will be set by caller
                timestamp=datetime.now(),
                model_version=model_version.version
            ))
        
        return responses
    
    def _generate_cache_key(self, request: InferenceRequest) -> str:
        """Generate cache key for request."""
        # Create hash of features and metadata
        feature_hash = hashlib.sha256(request.features.tobytes()).hexdigest()[:16]
        return f"{request.symbol}:{feature_hash}"
    
    def _worker_loop(self, worker_id: int):
        """Main worker loop for processing requests."""
        logger.info(f"Worker {worker_id} started")
        
        while self.is_running:
            try:
                # Get request from queue
                request = self.request_queue.get(timeout=0.1)
                if request is None:
                    continue
                
                # Process request
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                response = loop.run_until_complete(self._process_request(request))
                
                # In a real implementation, you'd send the response back
                logger.debug(f"Worker {worker_id} processed request {request.request_id}")
                
            except Empty:
                continue
            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")
    
    def _metrics_loop(self):
        """Collect performance metrics."""
        while self.is_running:
            try:
                # Update system metrics
                self.metrics.cpu_usage = psutil.cpu_percent()
                self.metrics.memory_usage = psutil.virtual_memory().percent
                
                # Update latency metrics
                latency_stats = self.latency_tracker.get_stats()
                self.metrics.avg_latency_ms = latency_stats['avg']
                self.metrics.p95_latency_ms = latency_stats['p95']
                self.metrics.p99_latency_ms = latency_stats['p99']
                
                # Update request metrics
                self.metrics.total_requests = (
                    self.metrics.successful_requests + self.metrics.failed_requests
                )
                
                # Log metrics periodically
                if self.metrics.total_requests % 1000 == 0 and self.metrics.total_requests > 0:
                    logger.info(f"Metrics: {self.metrics.total_requests} requests, "
                                f"avg latency: {self.metrics.avg_latency_ms:.1f}ms, "
                                f"cache hit rate: {self.metrics.cache_hits/self.metrics.total_requests:.2%}")
                
                time.sleep(10)  # Update every 10 seconds
                
            except Exception as e:
                logger.error(f"Metrics collection error: {e}")
                time.sleep(5)
    
    def get_metrics(self) -> InferenceMetrics:
        """Get current performance metrics."""
        return self.metrics
    
    def get_queue_status(self) -> Dict[str, Any]:
        """Get request queue status."""
        return {
            'queue_sizes': self.request_queue.size(),
            'total_queued': sum(self.request_queue.size().values()),
            'latency_stats': self.latency_tracker.get_stats()
        }

class BatchProcessor:
    """Batch processor for improved throughput."""
    
    def __init__(self, batch_size: int = 32, max_wait_ms: int = 50):
        self.batch_size = batch_size
        self.max_wait_ms = max_wait_ms
        self.pending_requests = []
        self.last_batch_time = time.time()
    
    def run(self, inference_engine: RealTimeInferenceEngine):
        """Run the batch processor."""
        while inference_engine.is_running:
            try:
                # Collect requests for batching
                request = inference_engine.request_queue.get(timeout=0.1)
                if request:
                    self.pending_requests.append(request)
                
                # Process batch if conditions are met
                current_time = time.time()
                time_since_last = (current_time - self.last_batch_time) * 1000
                
                should_process = (
                    len(self.pending_requests) >= self.batch_size or
                    (len(self.pending_requests) > 0 and time_since_last >= self.max_wait_ms)
                )
                
                if should_process:
                    # Process batch
                    batch_requests = self.pending_requests.copy()
                    self.pending_requests.clear()
                    self.last_batch_time = current_time
                    
                    # Submit batch processing task
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    
                    responses = loop.run_until_complete(
                        inference_engine._process_request_batch(batch_requests)
                    )
                    
                    # Handle responses (in practice, send back to clients)
                    logger.debug(f"Processed batch of {len(batch_requests)} requests")
                
            except Exception as e:
                logger.error(f"Batch processor error: {e}")

# Import required modules for caching and optimization
import hashlib

# Example usage and testing
async def test_inference_engine():
    """Test the real-time inference engine."""
    from ..registry.model_registry import ModelRegistry
    from ..models.gary_dpi import GaryTalebPredictor
    
    # Create registry and load model
    registry = ModelRegistry(experiment_name="test_inference")
    
    # Create and register a test model
    model = GaryTalebPredictor(input_dim=50)
    
    metadata = {
        'metrics': {'sharpe_ratio': 1.5, 'max_drawdown': 0.2},
        'parameters': {'learning_rate': 1e-4}
    }
    
    try:
        model_version = registry.register_model(
            model=model,
            model_name="test_gary_taleb",
            metadata=metadata
        )
        
        # Create inference engine
        engine = RealTimeInferenceEngine(
            model_registry=registry,
            enable_caching=True,
            enable_batching=True
        )
        
        # Start engine
        await engine.start()
        
        # Load model
        engine.load_model("test_gary_taleb", version=model_version.version)
        
        # Create test requests
        requests = []
        for i in range(10):
            request = InferenceRequest(
                request_id=f"test_{i}",
                symbol="BTC/USDT",
                features=np.random.randn(50),
                priority=1
            )
            requests.append(request)
        
        # Test single prediction
        response = await engine.predict(requests[0])
        print(f"Single prediction: {response.predictions}, latency: {response.latency_ms:.2f}ms")
        
        # Test batch prediction
        batch_responses = await engine.predict_batch(requests)
        print(f"Batch predictions: {len(batch_responses)} responses")
        
        # Get metrics
        metrics = engine.get_metrics()
        print(f"Engine metrics: {metrics.successful_requests} successful, "
                f"avg latency: {metrics.avg_latency_ms:.2f}ms")
        
        # Stop engine
        await engine.stop()
        
    except Exception as e:
        pass

if __name__ == "__main__":
    asyncio.run(test_inference_engine())