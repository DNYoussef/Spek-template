# SPDX-License-Identifier: MIT
"""
Connascence Cache - High-Performance Caching Layer
================================================

Intelligent caching system implementing 8 methods for optimal performance.
NASA Power of Ten compliant with comprehensive cache management.
"""
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set


from collections import OrderedDict
from pathlib import Path
from typing import Any, Optional, Dict, List, Tuple
import hashlib
import json
import logging
import time

import threading

from .interfaces import ConnascenceCacheInterface, ConfigurationProvider

logger = logging.getLogger(__name__)

class ConnascenceCache(ConnascenceCacheInterface):
    """
    High-performance cache with intelligent eviction and persistence.

    NASA Rule 4 Compliant: 8 focused methods for cache operations.
    Implements LRU eviction, TTL expiration, and optional persistence.
    """

    def __init__(self, config_provider: Optional[ConfigurationProvider] = None):
        """
        Initialize cache with configuration and performance settings.

        NASA Rule 2 Compliant: Constructor <= 60 LOC
        """
        self.config_provider = config_provider
        self.cache_name = "HighPerformanceConnascenceCache"

        # Cache configuration
        self.max_size = self._get_config('cache_max_size', 1000)
        self.default_ttl = self._get_config('cache_default_ttl', 3600)  # 1 hour
        self.enable_persistence = self._get_config('cache_enable_persistence', False)
        self.persistence_path = Path(self._get_config('cache_persistence_path', '.connascence_cache'))

        # Cache storage using OrderedDict for LRU behavior
        self._cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._lock = threading.RLock()  # Thread-safe operations

        # Performance statistics
        self._stats = {
            'hits': 0,
            'misses': 0,
            'evictions': 0,
            'expired': 0,
            'size': 0
        }

        # Initialize persistence directory
        if self.enable_persistence:
            self._initialize_persistence()

    def get(self, key: str) -> Optional[Any]:
        """
        Get cached value with TTL and LRU update.

        NASA Rule 2 Compliant: <= 60 LOC with performance optimization
        """
        with self._lock:
            try:
                if key not in self._cache:
                    self._stats['misses'] += 1
                    return None

                entry = self._cache[key]
                current_time = time.time()

                # Check TTL expiration
                if entry['expires_at'] <= current_time:
                    del self._cache[key]
                    self._stats['expired'] += 1
                    self._stats['misses'] += 1
                    return None

                # Update LRU order
                self._cache.move_to_end(key)

                # Update access statistics
                entry['access_count'] += 1
                entry['last_accessed'] = current_time

                self._stats['hits'] += 1
                return entry['value']

            except Exception as e:
                logger.error(f"Cache get failed for key {key}: {e}")
                self._stats['misses'] += 1
                return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """
        Set cached value with TTL and size management.

        NASA Rule 2 Compliant: <= 60 LOC with eviction logic
        """
        with self._lock:
            try:
                current_time = time.time()
                ttl = ttl or self.default_ttl

                # Create cache entry
                entry = {
                    'value': value,
                    'created_at': current_time,
                    'last_accessed': current_time,
                    'expires_at': current_time + ttl,
                    'access_count': 0,
                    'size': self._calculate_entry_size(value)
                }

                # Handle cache size limits
                if key in self._cache:
                    # Update existing entry
                    self._cache[key] = entry
                    self._cache.move_to_end(key)
                else:
                    # Add new entry with size management
                    self._ensure_cache_space()
                    self._cache[key] = entry

                self._stats['size'] = len(self._cache)

                # Persist if enabled
                if self.enable_persistence:
                    self._persist_entry(key, entry)

            except Exception as e:
                logger.error(f"Cache set failed for key {key}: {e}")

    def clear(self) -> None:
        """
        Clear all cache entries and reset statistics.
        """
        with self._lock:
            try:
                self._cache.clear()
                self._stats = {
                    'hits': 0,
                    'misses': 0,
                    'evictions': 0,
                    'expired': 0,
                    'size': 0
                }

                # Clear persistence if enabled
                if self.enable_persistence:
                    self._clear_persistence()

            except Exception as e:
                logger.error(f"Cache clear failed: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive cache statistics and performance metrics.
        """
        with self._lock:
            total_requests = self._stats['hits'] + self._stats['misses']
            hit_rate = self._stats['hits'] / max(total_requests, 1)

            return {
                'hits': self._stats['hits'],
                'misses': self._stats['misses'],
                'hit_rate': hit_rate,
                'evictions': self._stats['evictions'],
                'expired_entries': self._stats['expired'],
                'current_size': len(self._cache),
                'max_size': self.max_size,
                'memory_usage': self._calculate_memory_usage(),
                'cache_efficiency': self._calculate_cache_efficiency(),
                'average_access_count': self._calculate_average_access_count()
            }

    def _ensure_cache_space(self) -> None:
        """
        Ensure cache has space for new entries using LRU eviction.
        """
        while len(self._cache) >= self.max_size:
            # Evict least recently used entry
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]
            self._stats['evictions'] += 1

    def _calculate_entry_size(self, value: Any) -> int:
        """
        Calculate approximate size of cache entry in bytes.
        """
        try:
            return len(json.dumps(value).encode())
        except Exception:
            # Fallback size estimate
            return len(str(value)) * 2  # Rough Unicode character estimate

    def _calculate_memory_usage(self) -> Dict[str, int]:
        """
        Calculate detailed memory usage statistics.
        """
        total_size = 0
        max_entry_size = 0
        min_entry_size = float('inf')

        for entry in self._cache.values():
            size = entry['size']
            total_size += size
            max_entry_size = max(max_entry_size, size)
            min_entry_size = min(min_entry_size, size)

        if not self._cache:
            min_entry_size = 0

        return {
            'total_bytes': total_size,
            'average_entry_size': total_size // max(len(self._cache), 1),
            'max_entry_size': max_entry_size,
            'min_entry_size': min_entry_size
        }

    def _calculate_cache_efficiency(self) -> float:
        """
        Calculate cache efficiency score based on hit rate and access patterns.
        """
        total_requests = self._stats['hits'] + self._stats['misses']
        if total_requests == 0:
            return 0.0

        hit_rate = self._stats['hits'] / total_requests
        eviction_rate = self._stats['evictions'] / max(total_requests, 1)

        # Efficiency decreases with high eviction rate
        efficiency = hit_rate * (1 - min(eviction_rate, 0.5))
        return round(efficiency, 3)

    def _calculate_average_access_count(self) -> float:
        """
        Calculate average access count across all cached entries.
        """
        if not self._cache:
            return 0.0

        total_accesses = sum(entry['access_count'] for entry in self._cache.values())
        return round(total_accesses / len(self._cache), 2)

    def _initialize_persistence(self) -> None:
        """
        Initialize persistence directory and load existing cache.
        """
        try:
            self.persistence_path.mkdir(exist_ok=True)

            # Load existing cache entries
            cache_file = self.persistence_path / 'cache.pkl'
            if cache_file.exists():
                with open(cache_file, 'rb') as f:
                    persisted_cache = json.load(f)

                # Validate and load non-expired entries
                current_time = time.time()
                for key, entry in persisted_cache.items():
                    if entry['expires_at'] > current_time:
                        self._cache[key] = entry

        except Exception as e:
            logger.warning(f"Cache persistence initialization failed: {e}")

    def _persist_entry(self, key: str, entry: Dict[str, Any]) -> None:
        """
        Persist single cache entry to disk.
        """
        try:
            # For production, would implement incremental persistence
            if len(self._cache) % 10 == 0:  # Persist every 10 updates
                self._persist_cache()

        except Exception as e:
            logger.warning(f"Entry persistence failed: {e}")

    def _persist_cache(self) -> None:
        """
        Persist entire cache to disk.
        """
        try:
            cache_file = self.persistence_path / 'cache.pkl'
            with open(cache_file, 'wb') as f:
                json.dump(dict(self._cache), f)

        except Exception as e:
            logger.warning(f"Cache persistence failed: {e}")

    def _clear_persistence(self) -> None:
        """
        Clear persisted cache data.
        """
        try:
            cache_file = self.persistence_path / 'cache.pkl'
            if cache_file.exists():
                cache_file.unlink()

        except Exception as e:
            logger.warning(f"Persistence clear failed: {e}")

    def _get_config(self, key: str, default: Any) -> Any:
        """Get configuration value with fallback."""
        if self.config_provider:
            return self.config_provider.get_config(key, default)
        return default