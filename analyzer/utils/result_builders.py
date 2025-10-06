# SPDX-License-Identifier: MIT
"""
Result Builders - Standardized result/response creation utilities
================================================================

Centralizes dictionary/result creation patterns to eliminate duplication
and ensure consistent response formats across all analyzer modules.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set


from datetime import datetime
from typing import Any, Dict, List, Optional
from pathlib import Path

def build_error_result(error_msg: str, execution_time: float = 0.0,
                        **kwargs) -> Dict[str, Any]:
    """
    Build standardized error result dictionary.

    Args:
        error_msg: Error message
        execution_time: Execution time in seconds
        **kwargs: Additional fields to include

    Returns:
        Standardized error result dictionary
    """
    result = {
        'success': False,
        'error': error_msg,
        'execution_time': execution_time,
        'timestamp': datetime.now().isoformat()
    }
    result.update(kwargs)
    return result

def build_success_result(data: Dict[str, Any], execution_time: float = 0.0,
                        **kwargs) -> Dict[str, Any]:
    """
    Build standardized success result dictionary.

    Args:
        data: Result data to include
        execution_time: Execution time in seconds
        **kwargs: Additional fields to include

    Returns:
        Standardized success result dictionary
    """
    result = {
        'success': True,
        'execution_time': execution_time,
        'timestamp': datetime.now().isoformat()
    }
    result.update(data)
    result.update(kwargs)
    return result

def build_fallback_result(path: str, message: str = 'Refactored architecture not available') -> Dict[str, Any]:
    """
    Build fallback result when primary system unavailable.

    Args:
        path: Path being analyzed
        message: Fallback message

    Returns:
        Fallback result dictionary
    """
    return {
        'status': 'fallback',
        'message': message,
        'path': path,
        'violations': [],
        'metrics': {},
        'recommendations': []
    }

def build_validation_result(validation_id: str, success: bool, **kwargs) -> Dict[str, Any]:
    """
    Build validation result dictionary.

    Args:
        validation_id: Unique validation identifier
        success: Whether validation succeeded
        **kwargs: Additional validation fields

    Returns:
        Validation result dictionary
    """
    result = {
        'validation_id': validation_id,
        'success': success,
        'timestamp': datetime.now().isoformat()
    }
    result.update(kwargs)
    return result

def build_consensus_result(validation_id: str, consensus_achieved: bool,
                            byzantine_nodes: List[str],
                            violations: List[str],
                            **kwargs) -> Dict[str, Any]:
    """
    Build Byzantine consensus result dictionary.

    Args:
        validation_id: Validation identifier
        consensus_achieved: Whether consensus was achieved
        byzantine_nodes: List of detected Byzantine nodes
        violations: List of thread safety violations
        **kwargs: Additional consensus fields

    Returns:
        Consensus result dictionary
    """
    result = {
        'validation_id': validation_id,
        'success': consensus_achieved,
        'consensus_achieved': consensus_achieved,
        'byzantine_fault_tolerance': True,
        'byzantine_nodes_detected': byzantine_nodes,
        'thread_safety_violations': violations,
        'timestamp': datetime.now().isoformat()
    }
    result.update(kwargs)
    return result

def build_analysis_result(success: bool, syntax_issues: List[Dict[str, Any]],
                            execution_time: float, **kwargs) -> Dict[str, Any]:
    """
    Build comprehensive analysis result.

    Args:
        success: Analysis success status
        syntax_issues: List of syntax issues found
        execution_time: Analysis execution time
        **kwargs: Additional analysis fields

    Returns:
        Analysis result dictionary
    """
    result = {
        'success': success,
        'syntax_issues': syntax_issues,
        'total_issues': len(syntax_issues),
        'critical_issues': len([i for i in syntax_issues if i.get('severity') == 'critical']),
        'execution_time': execution_time,
        'analysis_timestamp': datetime.now().isoformat()
    }
    result.update(kwargs)
    return result

def build_compliance_result(overall_score: float, standards: List[str],
                            individual_scores: Dict[str, Any],
                            execution_time: float) -> Dict[str, Any]:
    """
    Build compliance validation result.

    Args:
        overall_score: Overall compliance score
        standards: Standards validated
        individual_scores: Individual standard scores
        execution_time: Validation execution time

    Returns:
        Compliance result dictionary
    """
    recommendations = []
    for standard, result in individual_scores.items():
        if not result.get('passed', True):
            recommendations.append(f"Address {standard} compliance violations")

    return {
        'success': True,
        'overall_compliance_score': overall_score,
        'standards_validated': standards,
        'individual_scores': individual_scores,
        'validation_timestamp': datetime.now().isoformat(),
        'execution_time': execution_time,
        'recommendations': recommendations
    }

def build_performance_result(baseline_metrics: Dict[str, Any],
                            optimized_metrics: Dict[str, Any],
                            improvement: float,
                            optimizations: List[Dict[str, Any]],
                            execution_time: float) -> Dict[str, Any]:
    """
    Build performance optimization result.

    Args:
        baseline_metrics: Baseline performance metrics
        optimized_metrics: Optimized performance metrics
        improvement: Performance improvement percentage
        optimizations: List of applied optimizations
        execution_time: Optimization execution time

    Returns:
        Performance result dictionary
    """
    recommendations = []
    for opt in optimizations:
        recommendations.append(f"Apply {opt['type']} optimization for {opt['impact']} impact")

    return {
        'success': True,
        'baseline_metrics': baseline_metrics,
        'optimized_metrics': optimized_metrics,
        'performance_improvement': improvement,
        'optimizations_applied': len(optimizations),
        'optimization_details': optimizations,
        'execution_time': execution_time,
        'recommendations': recommendations,
        'timestamp': datetime.now().isoformat()
    }

def create_integration_error(error_type: str, message: str, severity: str = "MEDIUM",
                            context: Optional[Dict[str, Any]] = None,
                            file_path: Optional[str] = None,
                            line_number: Optional[int] = None,
                            suggestions: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Create standardized integration error response.

    Args:
        error_type: Type of error
        message: Error message
        severity: Error severity level
        context: Additional error context
        file_path: File path where error occurred
        line_number: Line number where error occurred
        suggestions: Suggested fixes

    Returns:
        Standardized error dictionary
    """
    return {
        'code': f"ERR_{error_type}",
        'message': message,
        'severity': severity,
        'timestamp': datetime.now().isoformat(),
        'context': context or {},
        'file_path': file_path,
        'line_number': line_number,
        'suggestions': suggestions or []
    }