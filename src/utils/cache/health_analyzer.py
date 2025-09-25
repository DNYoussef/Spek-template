"""
Consolidates duplicate cache health analysis patterns from:
- comprehensive_cache_test.py
- comprehensive_benchmark.py

Estimated LOC consolidation: 154 lines
Estimated CoA reduction: ~112 violations
"""

from src.constants.base import THEATER_DETECTION_FAILURE_THRESHOLD

from dataclasses import dataclass
from typing import Dict, Any, List, Optional
from enum import Enum

class CacheHealthStatus(Enum):
    """Cache health status levels"""
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    CRITICAL = "critical"

@dataclass
class CacheStats:
    """Cache statistics container"""
    hits: int = 0
    misses: int = 0
    size_bytes: int = 0
    max_size_bytes: int = 0
    evictions: int = 0

@property
def hit_rate(self) -> float:
        """Calculate cache hit rate"""
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0

@property
def utilization(self) -> float:
        """Calculate cache memory utilization"""
        return self.size_bytes / self.max_size_bytes if self.max_size_bytes > 0 else 0.0

@dataclass
class CacheHealthMetrics:
    """Complete cache health analysis results"""
    combined_hit_rate: float
    combined_memory_utilization: float
    health_score: float
    health_status: CacheHealthStatus
    recommendations: List[str]
    file_cache_stats: Optional[CacheStats] = None
    incremental_cache_stats: Optional[CacheStats] = None

class CacheHealthAnalyzer:
    """Analyze cache health and performance"""

    # Health score thresholds
    EXCELLENT_THRESHOLD = 0.90
    GOOD_THRESHOLD = 0.75
    FAIR_THRESHOLD = THEATER_DETECTION_FAILURE_THRESHOLD
    POOR_THRESHOLD = 0.40

@staticmethod
def calculate_cache_health(file_cache_stats: Dict[str, Any],
                                incremental_cache_stats: Dict[str, Any],
                                file_weight: float = 0.6,
                                incremental_weight: float = 0.4) -> CacheHealthMetrics:
        """
        Calculate overall cache health from component statistics

        Args:
            file_cache_stats: Statistics for file cache
            incremental_cache_stats: Statistics for incremental cache
            file_weight: Weight for file cache (default 0.6)
            incremental_weight: Weight for incremental cache (default 0.4)

        Returns:
            CacheHealthMetrics with analysis results
        """
        # Normalize weights
        total_weight = file_weight + incremental_weight
        file_weight = file_weight / total_weight
        incremental_weight = incremental_weight / total_weight

        # Calculate combined metrics
        combined_hit_rate = (
            file_cache_stats.get("hit_rate", 0) * file_weight +
            incremental_cache_stats.get("hit_rate", 0) * incremental_weight
        )

        combined_memory_utilization = (
            file_cache_stats.get("memory_utilization", 0) * file_weight +
            incremental_cache_stats.get("memory_utilization", 0) * incremental_weight
        )

        # Calculate health score (weighted average)
        health_score = (
            combined_hit_rate * 0.7 +  # Hit rate is most important
            (1 - combined_memory_utilization) * 0.3  # Lower utilization is better
        )

        # Determine health status
        health_status = CacheHealthAnalyzer._determine_health_status(health_score)

        # Generate recommendations
        recommendations = CacheHealthAnalyzer._generate_recommendations(
            combined_hit_rate,
            combined_memory_utilization,
            file_cache_stats,
            incremental_cache_stats
        )

        return CacheHealthMetrics(
            combined_hit_rate=combined_hit_rate,
            combined_memory_utilization=combined_memory_utilization,
            health_score=health_score,
            health_status=health_status,
            recommendations=recommendations
        )

@staticmethod
def _determine_health_status(health_score: float) -> CacheHealthStatus:
        """Determine health status from score"""
        if health_score >= CacheHealthAnalyzer.EXCELLENT_THRESHOLD:
            return CacheHealthStatus.EXCELLENT
        elif health_score >= CacheHealthAnalyzer.GOOD_THRESHOLD:
            return CacheHealthStatus.GOOD
        elif health_score >= CacheHealthAnalyzer.FAIR_THRESHOLD:
            return CacheHealthStatus.FAIR
        elif health_score >= CacheHealthAnalyzer.POOR_THRESHOLD:
            return CacheHealthStatus.POOR
        else:
            return CacheHealthStatus.CRITICAL

@staticmethod
def _generate_recommendations(combined_hit_rate: float,
                                combined_memory_utilization: float,
                                file_cache_stats: Dict[str, Any],
                                incremental_cache_stats: Dict[str, Any]) -> List[str]:
        """Generate cache optimization recommendations"""
        recommendations = []

        # Hit rate recommendations
        if combined_hit_rate < 0.5:
            recommendations.append("CRITICAL: Cache hit rate below 50% - increase cache size or review caching strategy")
        elif combined_hit_rate < 0.7:
            recommendations.append("WARNING: Cache hit rate could be improved - consider increasing cache size")

        # Memory utilization recommendations
        if combined_memory_utilization > 0.9:
            recommendations.append("WARNING: Cache memory utilization above 90% - increase max cache size")
        elif combined_memory_utilization < 0.3:
            recommendations.append("INFO: Cache memory utilization low - cache size may be oversized")

        # Component-specific recommendations
        file_hit_rate = file_cache_stats.get("hit_rate", 0)
        incremental_hit_rate = incremental_cache_stats.get("hit_rate", 0)

        if file_hit_rate < incremental_hit_rate - 0.2:
            recommendations.append("File cache underperforming - review file caching patterns")
        elif incremental_hit_rate < file_hit_rate - 0.2:
            recommendations.append("Incremental cache underperforming - review incremental analysis strategy")

        # Eviction recommendations
        file_evictions = file_cache_stats.get("evictions", 0)
        incremental_evictions = incremental_cache_stats.get("evictions", 0)

        if file_evictions > 100:
            recommendations.append(f"High file cache evictions ({file_evictions}) - increase file cache size")
        if incremental_evictions > 100:
            recommendations.append(f"High incremental cache evictions ({incremental_evictions}) - increase incremental cache size")

        if not recommendations:
            recommendations.append("Cache performing optimally - no changes needed")

        return recommendations