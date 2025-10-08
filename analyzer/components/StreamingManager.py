from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
StreamingManager - Extracted from UnifiedConnascenceAnalyzer
Handles streaming analysis and real-time file watching
Part of god object decomposition (Day 5)
"""

from pathlib import Path
from typing import List, Union, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

# Import streaming components if available
try:
    from ..streaming import (
        StreamProcessor,
        IncrementalCache,
        get_global_incremental_cache,
        create_stream_processor
    )
    STREAMING_AVAILABLE = True
except ImportError:
    STREAMING_AVAILABLE = False
    StreamProcessor = None
    IncrementalCache = None

class StreamingManager:
    """
    Manages streaming analysis and real-time file watching.

    Extracted from UnifiedConnascenceAnalyzer (1, 860 LOC -> ~150 LOC component).
    Handles:
    - Streaming component initialization
    - Real-time file watching
    - Incremental cache management
    - Streaming callbacks and event handling
    """

    def __init__(self, streaming_config: Optional[Dict[str, Any]] = None):
        """
        Initialize streaming manager.

        Args:
            streaming_config: Configuration for streaming mode
        """
        self.streaming_config = streaming_config or {}
        self.stream_processor: Optional[StreamProcessor] = None
        self.incremental_cache: Optional[IncrementalCache] = None

        self.streaming_available = STREAMING_AVAILABLE

    def initialize_streaming_components(self, analyzer_factory) -> bool:
        """
        Initialize streaming analysis components.

        Args:
            analyzer_factory: Factory function to create analyzer instances

        Returns:
            True if initialization successful, False otherwise
        """
        if not STREAMING_AVAILABLE:
            logger.warning("Streaming components not available")
            return False

        try:
            self.incremental_cache = get_global_incremental_cache()

            stream_config = {
                "max_queue_size": self.streaming_config.get("max_queue_size", 1000),
                "max_workers": self.streaming_config.get("max_workers", 4),
                "cache_size": self.streaming_config.get("cache_size", 10000)
            }

            self.stream_processor = create_stream_processor(
                analyzer_factory=analyzer_factory,
                **stream_config
            )

            if "result_callback" in self.streaming_config:
                self.stream_processor.add_result_callback(
                    self.streaming_config["result_callback"]
                )

            if "batch_callback" in self.streaming_config:
                self.stream_processor.add_batch_callback(
                    self.streaming_config["batch_callback"]
                )

            logger.info(f"Streaming components initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize streaming components: {e}")
            self.stream_processor = None
            self.incremental_cache = None
            return False

    def start_streaming_analysis(self, directories: List[Union[str, Path]]) -> bool:
        """
        Start streaming analysis for specified directories.

        Args:
            directories: Directories to watch for changes

        Returns:
            True if streaming started successfully
        """
        if not self.stream_processor:
            logger.error("Streaming not available - initialize first")
            return False

        try:
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            async def start_streaming():
                await self.stream_processor.start()
                self.stream_processor.start_watching(directories)
                logger.info(f"Started streaming analysis for {len(directories)} directories")

            loop.run_until_complete(start_streaming())
            return True

        except Exception as e:
            logger.error(f"Failed to start streaming analysis: {e}")
            return False

    async def stop_streaming_analysis(self) -> None:
        """Stop streaming analysis."""
        if self.stream_processor:
            try:
                self.stream_processor.stop_watching()
                await self.stream_processor.stop()
                logger.info("Streaming analysis stopped")
            except Exception as e:
                logger.error(f"Failed to stop streaming analysis: {e}")

    def watch_directory(self, directory: str) -> None:
        """Watch a directory for changes."""
        if self.stream_processor and self.stream_processor.is_running:
            self.stream_processor.watch_directory(directory)

    def is_streaming_running(self) -> bool:
        """Check if streaming is currently running."""
        return self.stream_processor and self.stream_processor.is_running

    def get_streaming_stats(self) -> Dict[str, Any]:
        """Get streaming performance statistics."""
        stats = {"streaming_available": STREAMING_AVAILABLE}

        if self.stream_processor:
            stats.update(self.stream_processor.get_stats())

        if self.incremental_cache:
            stats.update(self.incremental_cache.get_cache_stats())

        return stats