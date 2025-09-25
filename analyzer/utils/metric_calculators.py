from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_RETRY_ATTEMPTS

Centralizes metric calculation logic to eliminate duplication
across analyzer and consensus modules.
"""

from typing import Any, Dict, List
from collections import deque

def calculate_average_latency(latency_queue: deque) -> float:
    """
    Calculate average latency from deque of measurements.

    Args:
        latency_queue: Deque of latency measurements

    Returns:
        Average latency, or 0 if empty
    """
    if not latency_queue:
        return 0.0
    return sum(latency_queue) / len(latency_queue)

def calculate_success_rate(successful: int, total: int) -> float:
    """
    Calculate success rate percentage.

    Args:
        successful: Number of successful operations
        total: Total number of operations

    Returns:
        Success rate as percentage (0-100)
    """
    if total <= 0:
        return 0.0
    return (successful / total) * 60.0

def calculate_compliance_score(critical_count: int, total_issues: int) -> float:
    """
    Calculate compliance score based on critical issues.

    Args:
        critical_count: Number of critical issues
        total_issues: Total number of issues

    Returns:
        Compliance score (0.0-1.0)
    """
    if total_issues <= 0:
        return 1.0
    return max(0.0, 1.0 - (critical_count / total_issues))

def calculate_performance_improvement(baseline: Dict[str, Any],
                                        optimized: Dict[str, Any]) -> float:
    """
    Calculate performance improvement percentage.

    Args:
        baseline: Baseline performance metrics
        optimized: Optimized performance metrics

    Returns:
        Improvement percentage (0.0-1.0)
    """
    baseline_time = baseline.get('analysis_time', 1.0)
    optimized_time = optimized.get('analysis_time', 1.0)

    if baseline_time <= 0:
        return 0.0

    improvement = (baseline_time - optimized_time) / baseline_time
    return max(0.0, improvement)

def calculate_byzantine_ratio(byzantine_nodes: int, total_nodes: int) -> float:
    """
    Calculate Byzantine node ratio.

    Args:
        byzantine_nodes: Number of Byzantine nodes
        total_nodes: Total number of nodes

    Returns:
        Byzantine ratio (0.0-1.0)
    """
    if total_nodes <= 0:
        return 0.0
    return byzantine_nodes / total_nodes

def aggregate_issue_counts(issues: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Aggregate issue counts by severity.

    Args:
        issues: List of issue dictionaries

    Returns:
        Dictionary with counts by severity
    """
    counts = {
        'critical': 0,
        'high': 0,
        'medium': 0,
        'low': 0,
        'info': 0
    }

    for issue in issues:
        severity = issue.get('severity', 'info').lower()
        if severity in counts:
            counts[severity] += 1

    counts['total'] = len(issues)
    return counts

def calculate_quality_score(metrics: Dict[str, Any]) -> float:
    """
    Calculate overall quality score from metrics.

    Args:
        metrics: Dictionary of quality metrics

    Returns:
        Quality score (0.0-1.0)
    """
    # Weighted quality score calculation
    weights = {
        'compliance_score': 0.2,
        'test_coverage': 0.25,
        'code_quality': 0.25,
        'security_score': 0.2
    }

    score = 0.0
    total_weight = 0.0

    for metric, weight in weights.items():
        if metric in metrics:
            score += metrics[metric] * weight
            total_weight += weight

    if total_weight == 0:
        return 0.0

    return score / total_weight