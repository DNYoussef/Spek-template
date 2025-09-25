"""
Shared utilities for SPEK Enhanced Development Platform.
Provides common functionality used across multiple modules.
"""

import logging
import sys
from typing import Optional

def get_logger(name: str, level: int = logging.INFO) -> logging.Logger:
    """
    Get a configured logger instance.

    Args:
        name: Logger name (typically __name__)
        level: Logging level

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)

    # Only configure if no handlers exist (avoid duplicate handlers)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(level)

        # Prevent propagation to avoid duplicate messages
        logger.propagate = False

    return logger

def format_timestamp(timestamp: Optional[float] = None) -> str:
    """
    Format a timestamp for display.

    Args:
        timestamp: Unix timestamp (uses current time if None)

    Returns:
        Formatted timestamp string
    """
    import time
    if timestamp is None:
        timestamp = time.time()
    return time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(timestamp))

def ensure_directory(path: str) -> bool:
    """
    Ensure a directory exists, creating it if necessary.

    Args:
        path: Directory path

    Returns:
        True if directory exists/was created successfully
    """
    from pathlib import Path
    try:
        Path(path).mkdir(parents=True, exist_ok=True)
        return True
    except Exception as e:
        logger = get_logger(__name__)
        logger.error(f"Failed to create directory {path}: {e}")
        return False

def path_exists(path: str) -> bool:
    """
    Check if a path exists.

    Args:
        path: File or directory path

    Returns:
        True if path exists
    """
    from pathlib import Path
    return Path(path).exists()
