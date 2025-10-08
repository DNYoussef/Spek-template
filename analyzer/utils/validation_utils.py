# SPDX-License-Identifier: MIT
"""
Validation Utilities - Common validation patterns across analyzers
================================================================

Centralizes input validation, type checking, and assertion logic
to eliminate duplication across analyzer modules.
"""
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set


from pathlib import Path
from typing import Any, Dict, List, Optional, Union

def validate_string_input(value: Any, param_name: str, allow_empty: bool = False) -> None:
    """
    Validate string input parameter.

    Args:
        value: Value to validate
        param_name: Parameter name for error messages
        allow_empty: Whether empty strings are allowed

    Raises:
        AssertionError: If validation fails
    """
    assert isinstance(value, str), f"{param_name} must be string"
    if not allow_empty:
        assert len(value.strip()) > 0, f"{param_name} cannot be empty"

def validate_dict_input(value: Any, param_name: str) -> None:
    """
    Validate dictionary input parameter.

    Args:
        value: Value to validate
        param_name: Parameter name for error messages

    Raises:
        AssertionError: If validation fails
    """
    assert isinstance(value, dict), f"{param_name} must be dictionary"

def validate_list_input(value: Any, param_name: str, min_length: int = 0) -> None:
    """
    Validate list input parameter.

    Args:
        value: Value to validate
        param_name: Parameter name for error messages
        min_length: Minimum required length

    Raises:
        AssertionError: If validation fails
    """
    assert isinstance(value, list), f"{param_name} must be list"
    assert len(value) >= min_length, f"{param_name} must have at least {min_length} items"

def validate_path_exists(path: Union[str, Path], param_name: str = "path") -> Path:
    """
    Validate that path exists and return Path object.

    Args:
        path: Path to validate
        param_name: Parameter name for error messages

    Returns:
        Validated Path object

    Raises:
        AssertionError: If path does not exist
    """
    path_obj = Path(path) if isinstance(path, str) else path
    assert isinstance(path_obj, Path), f"{param_name} must be Path object"
    assert path_obj.exists(), f"{param_name} does not exist: {path_obj}"
    return path_obj

def validate_output_format(format_str: str, supported_formats: List[str]) -> None:
    """
    Validate output format against supported formats.

    Args:
        format_str: Format string to validate
        supported_formats: List of supported format strings

    Raises:
        AssertionError: If format not supported
    """
    assert isinstance(format_str, str), "output_format must be string"
    assert format_str in supported_formats, \
        f"Unsupported format: {format_str}. Supported: {supported_formats}"

def validate_threshold(value: float, min_val: float = 0.0, max_val: float = 1.0,
                        param_name: str = "threshold") -> None:
    """
    Validate threshold value is within range.

    Args:
        value: Threshold value to validate
        min_val: Minimum allowed value
        max_val: Maximum allowed value
        param_name: Parameter name for error messages

    Raises:
        AssertionError: If value out of range
    """
    assert isinstance(value, (int, float)), f"{param_name} must be numeric"
    assert min_val <= value <= max_val, \
        f"{param_name} must be between {min_val} and {max_val}"

def validate_node_count(total_nodes: int, min_nodes: int = 3, max_nodes: int = 21) -> None:
    """
    Validate Byzantine consensus node count.

    Args:
        total_nodes: Total number of nodes
        min_nodes: Minimum required nodes
        max_nodes: Maximum allowed nodes

    Raises:
        AssertionError: If node count invalid
    """
    assert isinstance(total_nodes, int), "total_nodes must be integer"
    assert min_nodes <= total_nodes <= max_nodes, \
        f"total_nodes must be {min_nodes}-{max_nodes} for practical PBFT"

def validate_source_code(source_code: str, language: str = "python") -> None:
    """
    Validate source code input for analysis.

    Args:
        source_code: Source code string
        language: Programming language

    Raises:
        AssertionError: If source code invalid
    """
    validate_string_input(source_code, "source_code")
    validate_string_input(language, "language")
    assert len(source_code.strip()) > 0, "source_code cannot be empty"