"""
Caching systems for high-performance inference.
Implements prediction and feature caching with TTL and LRU eviction.
"""

from collections import OrderedDict
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
import hashlib
import time

from dataclasses import dataclass, field
from lib.shared.utilities import get_logger
import numpy as np
import pickle
import threading

@dataclass
class CacheEntry:
    """Cache entry with metadata."""
    value: Any
    timestamp: float
    access_count: int = 0
    last_access: float = field(default_factory=time.time)
    ttl: Optional[float] = None

class LRUCache:
    """Thread-safe LRU cache with TTL support."""
    
    def __init__(self, max_size: int = 1000, default_ttl: Optional[float] = None):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self.lock = threading.RLock()
        self.hits = 0
        self.misses = 0
        
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        with self.lock:
            if key not in self.cache:
                self.misses += 1
                return None
            
            entry = self.cache[key]
            
            # Check TTL expiration
            if self._is_expired(entry):
                del self.cache[key]
                self.misses += 1
                return None
            
            # Update access statistics
            entry.access_count += 1
            entry.last_access = time.time()
            
            # Move to end (most recently used)
            self.cache.move_to_end(key)
            
            self.hits += 1
            return entry.value
    
    def put(self, key: str, value: Any, ttl: Optional[float] = None):
        """Put value in cache."""
        with self.lock:
            ttl = ttl or self.default_ttl
            
            entry = CacheEntry(
                value=value,
                timestamp=time.time(),
                ttl=ttl
            )
            
            # Remove existing entry if present
            if key in self.cache:
                del self.cache[key]
            
            # Add new entry
            self.cache[key] = entry
            
            # Evict oldest entries if over capacity
            while len(self.cache) > self.max_size:
                oldest_key = next(iter(self.cache))
                del self.cache[oldest_key]
    
    def _is_expired(self, entry: CacheEntry) -> bool:
        """Check if entry is expired."""
        if entry.ttl is None:
            return False
        return time.time() - entry.timestamp > entry.ttl
    
    def clear(self):
        """Clear all cache entries."""
        with self.lock:
            self.cache.clear()
            self.hits = 0
            self.misses = 0
    
    def size(self) -> int:
        """Get current cache size."""
        with self.lock:
            return len(self.cache)
    
    def hit_rate(self) -> float:
        """Get cache hit rate."""
        with self.lock:
            total = self.hits + self.misses
            return self.hits / total if total > 0 else 0.0
    
    def cleanup_expired(self):
        """Remove expired entries."""
        with self.lock:
            expired_keys = [
                key for key, entry in self.cache.items()
                if self._is_expired(entry)
            ]
            
            for key in expired_keys:
                del self.cache[key]
            
            return len(expired_keys)

class PredictionCache:
    """Specialized cache for model predictions."""
    
    def __init__(self, max_size: int = 10000, ttl_seconds: int = 300):
        self.cache = LRUCache(max_size=max_size, default_ttl=ttl_seconds)
        self.cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self.cleanup_interval = 60  # seconds
        self.running = True
        self.cleanup_thread.start()
        
    def get(self, cache_key: str) -> Optional[Any]:
        """Get prediction from cache."""
        return self.cache.get(cache_key)
    
    def put(self, cache_key: str, prediction: Any, ttl: Optional[float] = None):
        """Store prediction in cache."""
        self.cache.put(cache_key, prediction, ttl)
    
    def generate_key(
        self,
        symbol: str,
        features_hash: str,
        model_version: str
    ) -> str:
        """Generate cache key for predictions."""
        return f"pred:{symbol}:{model_version}:{features_hash}"
    
    def _cleanup_loop(self):
        """Background cleanup of expired entries."""
        while self.running:
            try:
                expired_count = self.cache.cleanup_expired()
                if expired_count > 0:
                    logger.debug(f"Cleaned up {expired_count} expired prediction cache entries")
                
                time.sleep(self.cleanup_interval)
                
            except Exception as e:
                logger.error(f"Prediction cache cleanup error: {e}")
                time.sleep(self.cleanup_interval)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            'size': self.cache.size(),
            'max_size': self.cache.max_size,
            'hit_rate': self.cache.hit_rate(),
            'hits': self.cache.hits,
            'misses': self.cache.misses
        }
    
    def stop(self):
        """Stop the cache cleanup thread."""
        self.running = False

class FeatureCache:
    """Cache for preprocessed features."""
    
    def __init__(self, max_size: int = 5000, ttl_seconds: int = 60):
        self.cache = LRUCache(max_size=max_size, default_ttl=ttl_seconds)
        self.feature_hasher = FeatureHasher()
        
    def get(self, symbol: str, timestamp: datetime, window_size: int) -> Optional[np.ndarray]:
        """Get cached features."""
        cache_key = self._generate_key(symbol, timestamp, window_size)
        return self.cache.get(cache_key)
    
    def put(
        self,
        symbol: str,
        timestamp: datetime,
        window_size: int,
        features: np.ndarray
    ):
        """Store features in cache."""
        cache_key = self._generate_key(symbol, timestamp, window_size)
        self.cache.put(cache_key, features)
    
    def _generate_key(self, symbol: str, timestamp: datetime, window_size: int) -> str:
        """Generate cache key for features."""
        timestamp_str = timestamp.strftime('%Y%m%d_%H%M')
        return f"feat:{symbol}:{timestamp_str}:{window_size}"
    
    def hash_features(self, features: np.ndarray) -> str:
        """Generate hash of feature array."""
        return self.feature_hasher.hash_array(features)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            'size': self.cache.size(),
            'max_size': self.cache.max_size,
            'hit_rate': self.cache.hit_rate(),
            'hits': self.cache.hits,
            'misses': self.cache.misses
        }

class FeatureHasher:
    """Generate consistent hashes for feature arrays."""
    
    def __init__(self, precision: int = 6):
        self.precision = precision
    
    def hash_array(self, array: np.ndarray) -> str:
        """Generate hash for numpy array."""
        # Round to specified precision for consistent hashing
        rounded = np.round(array, decimals=self.precision)
        
        # Create hash
        array_bytes = rounded.tobytes()
        return hashlib.sha256(array_bytes).hexdigest()[:16]
    
    def hash_dict(self, data: Dict[str, Any]) -> str:
        """Generate hash for dictionary data."""
        # Sort keys for consistent hashing
        sorted_items = sorted(data.items())
        data_str = str(sorted_items)
        return hashlib.sha256(data_str.encode()).hexdigest()[:16]

class ModelCache:
    """Cache for loaded models and their components."""
    
    def __init__(self, max_models: int = 10):
        self.max_models = max_models
        self.models: OrderedDict[str, Any] = OrderedDict()
        self.model_metadata: Dict[str, Dict] = {}
        self.lock = threading.RLock()
        
    def get_model(self, model_key: str) -> Optional[Any]:
        """Get cached model."""
        with self.lock:
            if model_key not in self.models:
                return None
            
            # Move to end (most recently used)
            self.models.move_to_end(model_key)
            return self.models[model_key]
    
    def put_model(self, model_key: str, model: Any, metadata: Dict = None):
        """Cache a model."""
        with self.lock:
            # Remove existing if present
            if model_key in self.models:
                del self.models[model_key]
            
            # Add new model
            self.models[model_key] = model
            self.model_metadata[model_key] = metadata or {}
            
            # Evict oldest if over capacity
            while len(self.models) > self.max_models:
                oldest_key = next(iter(self.models))
                del self.models[oldest_key]
                self.model_metadata.pop(oldest_key, None)
    
    def get_metadata(self, model_key: str) -> Dict:
        """Get model metadata."""
        with self.lock:
            return self.model_metadata.get(model_key, {})
    
    def list_cached_models(self) -> List[str]:
        """List all cached model keys."""
        with self.lock:
            return list(self.models.keys())
    
    def clear(self):
        """Clear all cached models."""
        with self.lock:
            self.models.clear()
            self.model_metadata.clear()

class MultiLevelCache:
    """Multi-level caching system with L1 (memory) and L2 (disk) caches."""
    
    def __init__(
        self,
        l1_size: int = 1000,
        l2_size: int = 10000,
        cache_dir: str = "./cache"
    ):
        # L1 cache (memory)
        self.l1_cache = LRUCache(max_size=l1_size, default_ttl=300)  # 5 min TTL
        
        # L2 cache (disk-based, simplified for this example)
        self.l2_cache = LRUCache(max_size=l2_size, default_ttl=3600)  # 1 hour TTL
        
        # Cache directory for persistent storage
        import os
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)
        
    def get(self, key: str) -> Optional[Any]:
        """Get value from multi-level cache."""
        # Try L1 first
        value = self.l1_cache.get(key)
        if value is not None:
            return value
        
        # Try L2
        value = self.l2_cache.get(key)
        if value is not None:
            # Promote to L1
            self.l1_cache.put(key, value)
            return value
        
        return None
    
    def put(self, key: str, value: Any):
        """Put value in multi-level cache."""
        # Store in both levels
        self.l1_cache.put(key, value)
        self.l2_cache.put(key, value)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics for both levels."""
        return {
            'l1': {
                'size': self.l1_cache.size(),
                'hit_rate': self.l1_cache.hit_rate(),
                'hits': self.l1_cache.hits,
                'misses': self.l1_cache.misses
            },
            'l2': {
                'size': self.l2_cache.size(),
                'hit_rate': self.l2_cache.hit_rate(), 
                'hits': self.l2_cache.hits,
                'misses': self.l2_cache.misses
            }
        }

class CacheManager:
    """Central manager for all caching systems."""
    
    def __init__(self, config: Dict[str, Any] = None):
        config = config or {}
        
        # Initialize different cache types
        self.prediction_cache = PredictionCache(
            max_size=config.get('prediction_cache_size', 10000),
            ttl_seconds=config.get('prediction_cache_ttl', 300)
        )
        
        self.feature_cache = FeatureCache(
            max_size=config.get('feature_cache_size', 5000),
            ttl_seconds=config.get('feature_cache_ttl', 60)
        )
        
        self.model_cache = ModelCache(
            max_models=config.get('model_cache_size', 10)
        )
        
        # Metrics tracking
        self.start_time = time.time()
        
    def get_overall_stats(self) -> Dict[str, Any]:
        """Get statistics for all caches."""
        return {
            'uptime_seconds': time.time() - self.start_time,
            'prediction_cache': self.prediction_cache.get_stats(),
            'feature_cache': self.feature_cache.get_stats(),
            'model_cache': {
                'cached_models': len(self.model_cache.list_cached_models()),
                'model_list': self.model_cache.list_cached_models()
            }
        }
    
    def clear_all(self):
        """Clear all caches."""
        self.prediction_cache.cache.clear()
        self.feature_cache.cache.clear()
        self.model_cache.clear()
        logger.info("All caches cleared")
    
    def cleanup_all(self):
        """Cleanup expired entries in all caches."""
        pred_cleaned = self.prediction_cache.cache.cleanup_expired()
        feat_cleaned = self.feature_cache.cache.cleanup_expired()
        
        total_cleaned = pred_cleaned + feat_cleaned
        if total_cleaned > 0:
            logger.info(f"Cleaned up {total_cleaned} expired cache entries")
    
    def stop(self):
        """Stop all cache background processes."""
        self.prediction_cache.stop()

# Example usage and testing
def test_caching_systems():
    """Test caching functionality."""
    print("=" * 40)
    
    # Test LRU Cache
    lru = LRUCache(max_size=3, default_ttl=2.0)
    
    # Add entries
    lru.put("key1", "value1")
    lru.put("key2", "value2") 
    lru.put("key3", "value3")
    
    print(f"Cache size: {lru.size()}")
    print(f"Get key1: {lru.get('key1')}")
    print(f"Hit rate: {lru.hit_rate():.2%}")
    
    # Add one more (should evict oldest)
    lru.put("key4", "value4")
    print(f"After adding key4, cache size: {lru.size()}")
    print(f"Get key2 (should be evicted): {lru.get('key2')}")
    
    # Test TTL expiration
    time.sleep(2.1)  # Wait for TTL expiration
    print(f"After TTL expiration, get key1: {lru.get('key1')}")
    
    # Test Prediction Cache
    pred_cache = PredictionCache(max_size=100, ttl_seconds=1)
    
    # Generate test prediction
    test_prediction = {"prediction": 0.75, "confidence": 0.8}
    cache_key = pred_cache.generate_key("BTC/USDT", "hash123", "v1.0")
    
    pred_cache.put(cache_key, test_prediction)
    result = pred_cache.get(cache_key)
    print(f"Cached prediction: {result}")
    
    # Test Feature Cache
    feat_cache = FeatureCache(max_size=100)
    
    test_features = np.random.randn(50)
    feature_hash = feat_cache.hash_features(test_features)
    print(f"Feature hash: {feature_hash}")
    
    feat_cache.put("BTC/USDT", datetime.now(), 60, test_features)
    cached_features = feat_cache.get("BTC/USDT", datetime.now(), 60)
    print(f"Features cached: {cached_features is not None}")
    
    # Test Cache Manager
    cache_manager = CacheManager()
    
    stats = cache_manager.get_overall_stats()
    print(f"Overall cache stats:")
    for cache_type, cache_stats in stats.items():
        if isinstance(cache_stats, dict):
            print(f"  {cache_type}: {cache_stats}")
    
    # Cleanup
    pred_cache.stop()
    cache_manager.stop()
    
if __name__ == "__main__":
    test_caching_systems()