"""Shared utility functions for logging, project management, and common operations."""

import logging
import sys
from pathlib import Path
from typing import Optional, Union


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Get a configured logger instance.
    
    Args:
        name: Logger name. If None, uses the calling module's name.
        
    Returns:
        Configured logger instance with appropriate handlers and formatting.
    """
    logger = logging.getLogger(name or __name__)
    
    # Only add handler if logger doesn't already have one
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    
    return logger


def get_project_root() -> Path:
    """Get the project root directory.
    
    Returns:
        Path object pointing to the project root (3 levels up from this file).
    """
    return Path(__file__).parent.parent.parent


def ensure_directory(path: Union[str, Path]) -> Path:
    """Ensure a directory exists, creating it if necessary.
    
    Args:
        path: Directory path to create.
        
    Returns:
        Path object pointing to the created/existing directory.
    """
    path_obj = Path(path)
    path_obj.mkdir(parents=True, exist_ok=True)
    return path_obj


def validate_python_path() -> bool:
    """Validate that the current directory is in Python path.
    
    Returns:
        True if project root is accessible for imports.
    """
    project_root = get_project_root()
    return str(project_root) in sys.path or str(project_root.absolute()) in sys.path


def setup_python_path() -> None:
    """Add project root to Python path if not already present."""
    project_root = get_project_root()
    project_root_str = str(project_root.absolute())

    if project_root_str not in sys.path:
        sys.path.insert(0, project_root_str)

        # Also add current directory for immediate imports
        current_dir = str(Path.cwd())
        if current_dir not in sys.path:
            sys.path.insert(0, current_dir)


def path_exists(path: Union[str, Path]) -> bool:
    """Check if a path exists.

    Args:
        path: Path to check (string or Path object).

    Returns:
        True if path exists, False otherwise.
    """
    return Path(path).exists()
