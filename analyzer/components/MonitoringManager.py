from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
MonitoringManager - Extracted from UnifiedConnascenceAnalyzer
Handles memory monitoring and resource management
Part of god object decomposition (Day 5)
"""

from typing import Dict, Any, Callable, Optional
import logging

import gc

logger = logging.getLogger(__name__)

class MonitoringManager:
    """
    Manages memory monitoring and resource cleanup.

    Extracted from UnifiedConnascenceAnalyzer (1, 860 LOC -> ~200 LOC component).
    Handles:
    - Memory monitoring and alerts
    - Resource management and cleanup
    - Emergency cleanup procedures
    - Periodic cache cleanup
    - Memory leak investigation
    """

    def __init__(self, memory_monitor=None, resource_manager=None, cache_manager=None):
        """
        Initialize monitoring manager.

        Args:
            memory_monitor: Memory monitor instance
            resource_manager: Resource manager instance
            cache_manager: Cache manager instance for cleanup
        """
        self.memory_monitor = memory_monitor
        self.resource_manager = resource_manager
        self.cache_manager = cache_manager

        if memory_monitor and resource_manager:
            self._setup_monitoring_and_cleanup_hooks()

    def _setup_monitoring_and_cleanup_hooks(self) -> None:
        """Setup memory monitoring and resource cleanup hooks."""
        if not (self.memory_monitor and self.resource_manager):
            return

        self.memory_monitor.add_alert_callback(self._handle_memory_alert)
        self.memory_monitor.add_emergency_cleanup_callback(self._emergency_memory_cleanup)

        self.resource_manager.add_cleanup_hook(self._cleanup_analysis_resources)
        self.resource_manager.add_emergency_hook(self._emergency_resource_cleanup)
        self.resource_manager.add_periodic_cleanup_callback(self._periodic_cache_cleanup)

        self.memory_monitor.start_monitoring()

    def _handle_memory_alert(self, alert_type: str, context: Dict[str, Any]) -> None:
        """Handle memory usage alerts."""
        logger.warning(f"Memory alert: {alert_type}")

        if alert_type == "MEMORY_WARNING":
            if self.cache_manager:
                self.cache_manager.clear_cache()
                logger.info("Cleared file cache due to memory warning")

        elif alert_type == "MEMORY_HIGH":
            self._aggressive_cleanup()

        elif alert_type == "MEMORY_CRITICAL":
            self._emergency_memory_cleanup()

        elif alert_type == "MEMORY_LEAK":
            growth_mb = context.get("growth_mb", 0)
            logger.error(f"Memory leak detected: {growth_mb:.1f}MB growth")
            self._investigate_memory_leak(context)

    def _emergency_memory_cleanup(self) -> None:
        """Emergency memory cleanup procedures."""
        logger.critical("Executing emergency memory cleanup")

        try:
            if self.cache_manager:
                self.cache_manager.clear_cache()

            for _ in range(3):
                gc.collect()

            if self.resource_manager:
                cleaned = self.resource_manager.cleanup_all()
                logger.info(f"Emergency cleanup: {cleaned} resources cleaned")

        except Exception as e:
            logger.error(f"Emergency cleanup failed: {e}")

    def _aggressive_cleanup(self) -> None:
        """Aggressive cleanup for high memory usage."""
        logger.info("Executing aggressive cleanup")

        if self.resource_manager:
            self.resource_manager.cleanup_old_resources(max_age_seconds=120.0)
            self.resource_manager.cleanup_large_resources(min_size_mb=5.0)

    def _cleanup_analysis_resources(self) -> None:
        """Cleanup analysis-specific resources."""
        try:
            if self.cache_manager:
                self.cache_manager._analysis_patterns.clear()
                self.cache_manager._file_priorities.clear()

                self.cache_manager._cache_stats = {
                    "hits": 0,
                    "misses": 0,
                    "warm_requests": 0,
                    "batch_loads": 0
                }

        except Exception as e:
            logger.error(f"Analysis resource cleanup failed: {e}")

    def _emergency_resource_cleanup(self) -> None:
        """Emergency resource cleanup procedures."""
        logger.warning("Executing emergency resource cleanup")

        try:
            self._cleanup_analysis_resources()

        except Exception as e:
            logger.error(f"Emergency resource cleanup failed: {e}")

    def _periodic_cache_cleanup(self) -> int:
        """Periodic cache cleanup callback."""
        cleaned_count = 0

        try:
            import time

            if not self.cache_manager or not self.cache_manager.file_cache:
                return 0

            if hasattr(self.cache_manager.file_cache, '_cache'):
                old_entries = []
                current_time = time.time()

                for key, entry in self.cache_manager.file_cache._cache.items():
                    if hasattr(entry, 'last_accessed') and (current_time - entry.last_accessed) > 600:
                        old_entries.append(key)

                for key in old_entries[:50]:
                    if key in self.cache_manager.file_cache._cache:
                        del self.cache_manager.file_cache._cache[key]
                        cleaned_count += 1

        except Exception as e:
            logger.error(f"Periodic cache cleanup failed: {e}")

        return cleaned_count

    def _investigate_memory_leak(self, context: Dict[str, Any]) -> None:
        """Investigate potential memory leak."""
        try:
            obj_counts = {}
            for obj in gc.get_objects()[:1000]:
                obj_type = type(obj).__name__
                obj_counts[obj_type] = obj_counts.get(obj_type, 0) + 1

            top_types = sorted(obj_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            logger.warning(f"Top object types during leak: {top_types}")

        except Exception as e:
            logger.error(f"Memory leak investigation failed: {e}")

    def log_comprehensive_monitoring_report(self) -> None:
        """Log comprehensive monitoring report."""
        try:
            logger.info("=== COMPREHENSIVE SYSTEM MONITORING REPORT ===")

            if self.memory_monitor:
                memory_report = self.memory_monitor.get_memory_report()
                logger.info(f"Memory Monitoring Summary:")
                logger.info(f"  Current Usage: {memory_report['current_memory_mb']:.1f}MB")
                logger.info(f"  Peak Usage: {memory_report['peak_memory_mb']:.1f}MB")
                logger.info(f"  Average Usage: {memory_report['average_memory_mb']:.1f}MB")
                logger.info(f"  Monitoring Duration: {memory_report['monitoring_duration_minutes']:.1f} minutes")
                logger.info(f"  Leak Detected: {memory_report['leak_detected']}")

                if memory_report.get('recommendations'):
                    logger.info("  Memory Recommendations:")
                    for rec in memory_report['recommendations']:
                        logger.info(f"    - {rec}")

            if self.resource_manager:
                resource_report = self.resource_manager.get_resource_report()
                summary = resource_report['summary']

                logger.info(f"Resource Management Summary:")
                logger.info(f"  Resources Created: {summary['resources_created']}")
                logger.info(f"  Resources Cleaned: {summary['resources_cleaned']}")
                logger.info(f"  Currently Tracked: {summary['currently_tracked']}")
                logger.info(f"  Peak Tracked: {summary['peak_tracked']}")
                logger.info(f"  Cleanup Success Rate: {summary['cleanup_success_rate']:.1%}")
                logger.info(f"  Resource Leaks: {summary['resource_leaks']}")
                logger.info(f"  Emergency Cleanups: {summary['emergency_cleanups']}")
                logger.info(f"  Total Size: {summary['total_size_mb']:.1f}MB")

                if resource_report.get('recommendations'):
                    logger.info("  Resource Recommendations:")
                    for rec in resource_report['recommendations']:
                        logger.info(f"    - {rec}")

                logger.info("  Resource Breakdown by Type:")
                for resource_type, stats in resource_report['by_type'].items():
                    logger.info(f"    {resource_type}: {stats['tracked']} tracked, "
                                f"{stats['size_mb']:.1f}MB, {stats['success_rate']:.1%} cleanup rate")

        except Exception as e:
            logger.error(f"Failed to generate comprehensive monitoring report: {e}")