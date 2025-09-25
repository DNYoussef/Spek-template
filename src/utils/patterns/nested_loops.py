"""
Nested Loop Pattern Processor

Consolidates nested loop patterns found across 20+ files.
Provides standardized iteration with violation processing.
"""

from typing import Dict, List, Any, Optional, Callable

from dataclasses import dataclass

@dataclass
class ViolationContext:
    """Context for violation processing."""
    file_path: str
    rule_id: str
    severity: str
    line_number: int
    metadata: Dict[str, Any]

def process_violations_with_rules(
    files: List[str],
    rules: List[Dict[str, Any]],
    processor: Optional[Callable] = None
) -> List[ViolationContext]:
    """
    Process violations with rules using standardized nested loop.

    Args:
        files: List of file paths to process
        rules: List of rule dictionaries
        processor: Optional custom processor function

    Returns:
        List of ViolationContext objects
    """
    violations = []

    for file_path in files:
        if not file_path or not isinstance(file_path, str):
            continue

        for rule in rules:
            if not rule or not isinstance(rule, dict):
                continue

            try:
                violation = _process_single_violation(
                    file_path,
                    rule,
                    processor
                )
                if violation:
                    violations.append(violation)
            except Exception as e:
                print(f"Error processing {file_path} with rule "
                        f"{rule.get('id', 'unknown')}: {e}")

    return violations

def _process_single_violation(
    file_path: str,
    rule: Dict[str, Any],
    processor: Optional[Callable]
) -> Optional[ViolationContext]:
    """Process a single file-rule combination."""
    if processor:
        return processor(file_path, rule)

    return ViolationContext(
        file_path=file_path,
        rule_id=rule.get('id', 'unknown'),
        severity=rule.get('severity', 'medium'),
        line_number=0,
        metadata=rule.get('metadata', {})
    )

def aggregate_by_file(
    violations: List[ViolationContext]
) -> Dict[str, List[ViolationContext]]:
    """Aggregate violations by file path."""
    result: Dict[str, List[ViolationContext]] = {}

    for violation in violations:
        if violation.file_path not in result:
            result[violation.file_path] = []
        result[violation.file_path].append(violation)

    return result

def aggregate_by_severity(
    violations: List[ViolationContext]
) -> Dict[str, List[ViolationContext]]:
    """Aggregate violations by severity."""
    result: Dict[str, List[ViolationContext]] = {}

    for violation in violations:
        if violation.severity not in result:
            result[violation.severity] = []
        result[violation.severity].append(violation)

    return result

def filter_by_severity(
    violations: List[ViolationContext],
    min_severity: str = 'medium'
) -> List[ViolationContext]:
    """Filter violations by minimum severity."""
    severity_order = {'low': 0, 'medium': 1, 'high': 2, 'critical': 3}
    min_level = severity_order.get(min_severity, 1)

    return [
        v for v in violations
        if severity_order.get(v.severity, 1) >= min_level
    ]