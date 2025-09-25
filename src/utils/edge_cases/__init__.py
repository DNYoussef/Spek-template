"""Edge case and boundary condition handlers."""

from .boundary_handler import (
    handle_empty_input,
    handle_large_file,
    detect_circular_dependencies,
    safe_divide,
    validate_bounds,
    safe_list_access
)

__all__ = [
    'handle_empty_input',
    'handle_large_file',
    'detect_circular_dependencies',
    'safe_divide',
    'validate_bounds',
    'safe_list_access'
]