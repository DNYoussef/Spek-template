"""
Boundary Condition Handler

Handles edge cases and boundary conditions with defensive programming.
Provides safe processing for empty inputs, large files, and circular deps.
"""

from pathlib import Path
from typing import Any, List, Dict, Optional, Set
import sys

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_RECURSION_DEPTH = 100

def handle_empty_input(
    data: Any,
    default: Any = None,
    raise_error: bool = False
) -> Any:
    """
    Handle empty or None input safely.

    Args:
        data: Input data to check
        default: Default value to return if empty
        raise_error: Whether to raise error on empty input

    Returns:
        Original data or default value

    Raises:
        ValueError: If raise_error=True and data is empty
    """
    is_empty = (
        data is None or
        (isinstance(data, (list, dict, str)) and not data)
    )

    if is_empty:
        if raise_error:
            raise ValueError("Input data is empty")
        return default if default is not None else data

    return data

def handle_large_file(
    file_path: str,
    max_size: int = MAX_FILE_SIZE,
    chunk_processor: Optional[callable] = None
) -> bool:
    """
    Safely handle large file processing.

    Args:
        file_path: Path to file
        max_size: Maximum file size in bytes
        chunk_processor: Optional function to process file in chunks

    Returns:
        True if file can be processed, False otherwise
    """
    try:
        path = Path(file_path)

        if not path.exists():
            print(f"File does not exist: {file_path}")
            return False

        file_size = path.stat().st_size

        if file_size > max_size:
            print(f"File too large: {file_size} bytes (max: {max_size})")

            if chunk_processor:
                return _process_in_chunks(path, chunk_processor)

            return False

        return True

    except Exception as e:
        print(f"Error handling file {file_path}: {e}")
        return False

def _process_in_chunks(
    path: Path,
    processor: callable,
    chunk_size: int = 1024 * 1024
) -> bool:
    """Process file in chunks."""
    try:
        with path.open('r', encoding='utf-8') as f:
            while True:
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                processor(chunk)
        return True
    except Exception as e:
        print(f"Chunk processing error: {e}")
        return False

def detect_circular_dependencies(
    graph: Dict[str, List[str]],
    max_depth: int = MAX_RECURSION_DEPTH
) -> List[List[str]]:
    """
    Detect circular dependencies in directed graph.

    Args:
        graph: Adjacency list representation
        max_depth: Maximum recursion depth

    Returns:
        List of circular dependency chains
    """
    cycles = []
    visited: Set[str] = set()
    path: List[str] = []

    def dfs(node: str, depth: int = 0) -> None:
        """Depth-first search for cycles."""
        if depth > max_depth:
            return

        if node in path:
            cycle_start = path.index(node)
            cycle = path[cycle_start:] + [node]
            cycles.append(cycle)
            return

        if node in visited:
            return

        visited.add(node)
        path.append(node)

        for neighbor in graph.get(node, []):
            dfs(neighbor, depth + 1)

        path.pop()

    for node in graph:
        if node not in visited:
            dfs(node)

    return cycles

def safe_divide(
    numerator: float,
    denominator: float,
    default: float = 0.0
) -> float:
    """
    Safe division with zero handling.

    Args:
        numerator: Numerator value
        denominator: Denominator value
        default: Default value if division by zero

    Returns:
        Division result or default
    """
    try:
        if denominator == 0:
            return default
        return numerator / denominator
    except (TypeError, ValueError):
        return default

def validate_bounds(
    value: float,
    min_val: Optional[float] = None,
    max_val: Optional[float] = None,
    clamp: bool = False
) -> float:
    """
    Validate value is within bounds.

    Args:
        value: Value to validate
        min_val: Minimum allowed value
        max_val: Maximum allowed value
        clamp: Whether to clamp to bounds or raise error

    Returns:
        Validated value

    Raises:
        ValueError: If out of bounds and clamp=False
    """
    if min_val is not None and value < min_val:
        if clamp:
            return min_val
        raise ValueError(f"Value {value} below minimum {min_val}")

    if max_val is not None and value > max_val:
        if clamp:
            return max_val
        raise ValueError(f"Value {value} above maximum {max_val}")

    return value

def safe_list_access(
    lst: List[Any],
    index: int,
    default: Any = None
) -> Any:
    """Safe list access with default value."""
    try:
        return lst[index] if 0 <= index < len(lst) else default
    except (IndexError, TypeError):
        return default