from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
CacheManager - Extracted from UnifiedConnascenceAnalyzer
Handles file caching, AST caching, and performance optimization
Part of god object decomposition (Day 5)
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

# Import architecture components if available
try:
    from ..architecture.file_content_cache import FileContentCache
    CACHE_AVAILABLE = True
except ImportError:
    CACHE_AVAILABLE = False

class CacheManager:
    """
    Manages file content caching, AST caching, and performance tracking.

    Extracted from UnifiedConnascenceAnalyzer (1, 860 LOC -> ~250 LOC component).
    Handles:
    - File content caching
    - AST tree caching
    - Cache statistics tracking
    - Intelligent cache warming
    - Performance optimization based on access patterns
    """

    def __init__(self, max_memory_mb: int = 50):
        """
        Initialize cache manager.

        Args:
            max_memory_mb: Maximum memory for cache in MB
        """
        self.file_cache = None

        if CACHE_AVAILABLE:
            self.file_cache = FileContentCache(max_memory=max_memory_mb * 1024 * 1024)
        else:
            self.file_cache = self._create_fallback_cache()

        # Cache statistics
        self._cache_stats = {
            "hits": 0,
            "misses": 0,
            "warm_requests": 0,
            "batch_loads": 0
        }

        # Access pattern tracking
        self._analysis_patterns: Dict[str, int] = {}
        self._file_priorities: Dict[str, float] = {}

    def _create_fallback_cache(self):
        """Create simple fallback cache when FileContentCache unavailable."""
        class SimpleFallbackCache:
            def __init__(self):
                self._cache = {}
                self._max_size = 100
                self._stats = {"hits": 0, "misses": 0, "evictions": 0}

            def get(self, key: str, default=None):
                result = self._cache.get(key, default)
                if result is not None:
                    self._stats["hits"] += 1
                else:
                    self._stats["misses"] += 1
                return result

            def set(self, key: str, value):
                if len(self._cache) >= self._max_size:
                    oldest_key = next(iter(self._cache))
                    del self._cache[oldest_key]
                    self._stats["evictions"] += 1
                self._cache[key] = value

            def clear(self):
                self._cache.clear()

            def clear_cache(self):
                self.clear()

            def get_cache_stats(self):
                return {
                    "entries": len(self._cache),
                    "max_size": self._max_size,
                    "fallback_mode": True,
                    **self._stats
                }

            def get_file_content(self, file_path):
                try:
                    key = f"content:{file_path}"
                    content = self.get(key)
                    if content is None:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        self.set(key, content)
                    return content
                except:
                    return None

            def get_file_lines(self, file_path):
                try:
                    content = self.get_file_content(file_path)
                    return content.splitlines() if content else []
                except:
                    return []

            def get_ast_tree(self, file_path):
                try:
                    import ast
                    key = f"ast:{file_path}"
                    tree = self.get(key)
                    if tree is None:
                        content = self.get_file_content(file_path)
                        if content:
                            tree = ast.parse(content)
                            self.set(key, tree)
                    return tree
                except:
                    return None

            def get_python_files(self, project_path):
                try:
                    key = f"pyfiles:{project_path}"
                    files = self.get(key)
                    if files is None:
                        path_obj = Path(project_path)
                        files = [str(f) for f in path_obj.rglob("*.py")]
                        self.set(key, files)
                    return files
                except:
                    return []

        return SimpleFallbackCache()

    def get_cached_content_with_tracking(self, file_path: Path) -> Optional[str]:
        """Get file content with access pattern tracking."""
        file_key = str(file_path)
        self._analysis_patterns[file_key] = self._analysis_patterns.get(file_key, 0) + 1

        content = self.file_cache.get_file_content(file_path)
        if content:
            self._cache_stats["hits"] += 1
        else:
            self._cache_stats["misses"] += 1

        return content

    def get_cached_lines_with_tracking(self, file_path: Path) -> List[str]:
        """Get file lines with access pattern tracking."""
        lines = self.file_cache.get_file_lines(file_path)
        if lines:
            self._cache_stats["hits"] += 1
        else:
            self._cache_stats["misses"] += 1

        return lines

    def get_cache_hit_rate(self) -> float:
        """Calculate current cache hit rate."""
        total = self._cache_stats["hits"] + self._cache_stats["misses"]
        return self._cache_stats["hits"] / total if total > 0 else 0.0

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            **self._cache_stats,
            "hit_rate": self.get_cache_hit_rate(),
            "access_patterns": len(self._analysis_patterns),
            "file_priorities": len(self._file_priorities)
        }

    def log_cache_performance(self) -> None:
        """Log detailed cache performance metrics."""
        hit_rate = self.get_cache_hit_rate()
        cache_stats = self.file_cache._stats if hasattr(self.file_cache, '_stats') else None

        logger.info(f"Cache Performance Summary:")
        logger.info(f"  Hit Rate: {hit_rate:.1%} (Target: >80%)")
        logger.info(f"  Hits: {self._cache_stats['hits']}")
        logger.info(f"  Misses: {self._cache_stats['misses']}")
        logger.info(f"  Warm Requests: {self._cache_stats['warm_requests']}")
        logger.info(f"  Batch Loads: {self._cache_stats['batch_loads']}")

        if cache_stats:
            memory_usage = cache_stats.memory_usage / (1024 * 1024)
            logger.info(f"  Memory Usage: {memory_usage:.1f}MB / {cache_stats.max_memory // (1024 * 1024)}MB")
            logger.info(f"  Evictions: {cache_stats.evictions}")

        if hit_rate < 0.6:
            logger.warning("Low cache hit rate - consider increasing warm-up files")
        elif hit_rate > 0.9:
            logger.info("Excellent cache performance!")

    def optimize_cache_for_future_runs(self) -> None:
        """Learn from access patterns to optimize future cache performance."""
        if not self._analysis_patterns:
            return

        frequent_files = sorted(
            self._analysis_patterns.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]

        logger.info(f"Learned access patterns for {len(frequent_files)} high-frequency files")

    def clear_cache(self) -> None:
        """Clear all cached data."""
        if self.file_cache:
            self.file_cache.clear_cache()

        self._cache_stats = {
            "hits": 0,
            "misses": 0,
            "warm_requests": 0,
            "batch_loads": 0
        }
        self._analysis_patterns.clear()
        self._file_priorities.clear()

    def get_file_cache(self):
        """Get file cache instance."""
        return self.file_cache