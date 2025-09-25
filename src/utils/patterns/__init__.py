"""Pattern processing utilities."""

from .nested_loops import (
    ViolationContext,
    process_violations_with_rules,
    aggregate_by_file,
    aggregate_by_severity,
    filter_by_severity
)

__all__ = [
    'ViolationContext',
    'process_violations_with_rules',
    'aggregate_by_file',
    'aggregate_by_severity',
    'filter_by_severity'
]