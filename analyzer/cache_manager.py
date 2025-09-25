from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES

"""
Analysis Cache Manager - Extracted from UnifiedConnascenceAnalyzer
================================================================

Manages file caching, cache statistics, and intelligent warming.
NASA Rule 2 Compliant: All methods under 60 lines.
NASA Rule 4 Compliant: Single responsibility pattern.
"""

import logging
logger = logging.getLogger(__name__)

# Import optimization components with fallback
try:
    from .optimization.file_cache import (
        FileContentCache, cached_python_files, cached_file_content,
        cached_ast_tree, cached_file_lines, get_global_cache
    )
    CACHE_AVAILABLE = True
except ImportError:
    CACHE_AVAILABLE = False
    logger.warning("Cache optimization not available")

class AnalysisCacheManager:
    """
    Manages caching for analysis operations.
    
    Single Responsibility: File and analysis result caching.
    NASA Rule 4 Compliant: Focused, bounded cache operations.
    """
    
    def __init__(self, max_memory_mb: int = 100):
        """Initialize cache manager (NASA Rule 2: <=60 LOC)."""
        self.max_memory_mb = max_memory_mb
        self.file_cache = None
        self._cache_stats = {"hits": 0, "misses": 0, "warm_requests": 0, "batch_loads": 0}
        self._analysis_patterns = {}  # Track file access patterns for intelligent caching
        self._file_priorities = {}  # Cache file priority scores for better eviction
        
        if CACHE_AVAILABLE:
            self.file_cache = FileContentCache(max_memory=max_memory_mb * 1024 * 1024)
            logger.info(f"Cache initialized with {max_memory_mb}MB limit")
        else:
            logger.warning("Cache initialization skipped - optimization not available")
    
    def is_cache_available(self) -> bool:
        """Check if cache is available (NASA Rule 2: <=60 LOC)."""
        return CACHE_AVAILABLE and self.file_cache is not None
    
    def warm_cache_intelligently(self, project_path: Path) -> None:
        """Intelligently warm cache based on project structure (NASA Rule 2: <=60 LOC)."""
        if not self.is_cache_available():
            return
            
        try:
            # Find Python files to prioritize
            python_files = list(project_path.glob("**/*.py"))
            if not python_files:
                logger.debug("No Python files found for cache warming")
                return
                
            # Sort by likely importance (size, modification time, etc.)
            prioritized_files = self._prioritize_files_for_caching(python_files)
            
            # Warm cache with top priority files
            self._cache_stats["warm_requests"] += 1
            cache_batch = prioritized_files[:min(20, len(prioritized_files))]  # Limit to 20 files
            
            for file_path in cache_batch:
                self._warm_single_file(file_path)
                
            logger.debug(f"Cache warmed with {len(cache_batch)} files")
            
        except Exception as e:
            logger.warning(f"Cache warming failed: {e}")
    
    def _prioritize_files_for_caching(self, files: List[Path]) -> List[Path]:
        """Prioritize files for caching (NASA Rule 2: <=60 LOC)."""
        def priority_score(file_path: Path) -> float:
            try:
                stat = file_path.stat()
                size_score = min(stat.st_size / 1024, MAXIMUM_FUNCTION_LENGTH_LINES)  # Size in KB, cap at 100
                # Prefer recently modified files
                age_score = 100 - min((stat.st_mtime % 86400) / 864, MAXIMUM_FUNCTION_LENGTH_LINES)  # Recent = higher
                return size_score + age_score
            except (OSError, AttributeError):
                return 0.0
        
        return sorted(files, key=priority_score, reverse=True)
    
    def _warm_single_file(self, file_path: Path) -> None:
        """Warm cache for a single file (NASA Rule 2: <=60 LOC)."""
        if not self.is_cache_available():
            return
            
        try:
            # Pre-load file content
            if hasattr(self.file_cache, 'get_file_content'):
                self.file_cache.get_file_content(str(file_path))
            
            # Track file for priority scoring
            self._file_priorities[str(file_path)] = self._file_priorities.get(str(file_path), 0) + 1
            
        except Exception as e:
            logger.debug(f"Failed to warm cache for {file_path}: {e}")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get current cache statistics (NASA Rule 2: <=60 LOC)."""
        stats = self._cache_stats.copy()
        
        if self.is_cache_available() and hasattr(self.file_cache, 'get_stats'):
            cache_internal_stats = self.file_cache.get_stats()
            stats.update(cache_internal_stats)
        
        stats["cache_available"] = self.is_cache_available()
        stats["max_memory_mb"] = self.max_memory_mb
        
        return stats
    
    def clear_cache(self) -> None:
        """Clear all cache data (NASA Rule 2: <=60 LOC)."""
        if self.is_cache_available() and hasattr(self.file_cache, 'clear'):
            self.file_cache.clear()
            
        self._cache_stats = {"hits": 0, "misses": 0, "warm_requests": 0, "batch_loads": 0}
        self._analysis_patterns.clear()
        self._file_priorities.clear()
        
        logger.info("Cache cleared")
    
    def update_access_pattern(self, file_path: str, access_type: str = "read") -> None:
        """Update file access patterns for better caching (NASA Rule 2: <=60 LOC)."""
        if file_path not in self._analysis_patterns:
            self._analysis_patterns[file_path] = {"reads": 0, "writes": 0, "last_access": 0}
        
        self._analysis_patterns[file_path][f"{access_type}s"] += 1
        self._analysis_patterns[file_path]["last_access"] = self._get_timestamp()
    
    def _get_timestamp(self) -> int:
        """Get current timestamp (NASA Rule 2: <=60 LOC)."""
        import time
        return int(time.time())