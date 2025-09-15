"""
Enterprise Detector Modules
Specialized detector modules for all enterprise components.
"""

import ast
import re
import json
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any, Set
from dataclasses import dataclass
from pathlib import Path
import logging

@dataclass
class DetectorResult:
    """Result from a detector module."""
    detector_name: str
    theater_detected: bool
    confidence: float  # 0.0 to 1.0
    evidence: List[str]
    severity: str  # 'low', 'medium', 'high', 'critical'
    recommendations: List[str]
    metadata: Dict[str, Any]

class BaseDetectorModule:
    """Base class for all detector modules."""

    def __init__(self, name: str, config: Optional[Dict] = None):
        self.name = name
        self.config = config or {}
        self.logger = logging.getLogger(f'Detector.{name}')

    def detect(self, code_data: Dict[str, Any], metrics_data: Dict[str, Any]) -> DetectorResult:
        """Abstract method for detection logic."""
        raise NotImplementedError("Subclasses must implement detect method")

    def _calculate_confidence(self, indicators: List[float]) -> float:
        """Calculate confidence score from indicators."""
        if not indicators:
            return 0.0
        return min(np.mean(indicators), 1.0)

    def _determine_severity(self, confidence: float, impact_score: float) -> str:
        """Determine severity based on confidence and impact."""
        combined_score = confidence * impact_score

        if combined_score >= 0.8:
            return 'critical'
        elif combined_score >= 0.6:
            return 'high'
        elif combined_score >= 0.4:
            return 'medium'
        else:
            return 'low'

class CommentInflationDetector(BaseDetectorModule):
    """Detects artificial comment inflation without meaningful code changes."""

    def __init__(self, config: Optional[Dict] = None):
        super().__init__('CommentInflation', config)
        self.thresholds = {
            'comment_ratio_threshold': 0.7,
            'code_change_threshold': 0.1,
            'min_files_threshold': 3
        }

    def detect(self, code_data: Dict[str, Any], metrics_data: Dict[str, Any]) -> DetectorResult:
        """Detect comment inflation patterns."""

        evidence = []
        indicators = []

        files_changed = code_data.get('files_changed', [])
        if not files_changed:
            return DetectorResult(
                detector_name=self.name,
                theater_detected=False,
                confidence=0.0,
                evidence=[],
                severity='low',
                recommendations=[],
                metadata={}
            )

        comment_heavy_files = 0
        total_files = len(files_changed)

        for file_data in files_changed:
            diff_content = file_data.get('diff', '')

            # Analyze diff for comment vs code ratio
            comment_lines, code_lines = self._analyze_diff_content(diff_content)

            if comment_lines + code_lines > 0:
                comment_ratio = comment_lines / (comment_lines + code_lines)

                if comment_ratio > self.thresholds['comment_ratio_threshold']:
                    comment_heavy_files += 1
                    evidence.append(f"File {file_data.get('file_path', 'unknown')}: {comment_ratio:.1%} comments")
                    indicators.append(comment_ratio)

        # Calculate overall comment inflation score
        if total_files > 0:
            comment_file_ratio = comment_heavy_files / total_files
            indicators.append(comment_file_ratio)

            if comment_file_ratio > 0.5 and total_files >= self.thresholds['min_files_threshold']:
                evidence.append(f"{comment_heavy_files}/{total_files} files are comment-heavy")
                theater_detected = True
            else:
                theater_detected = False
        else:
            theater_detected = False

        confidence = self._calculate_confidence(indicators)
        severity = self._determine_severity(confidence, comment_file_ratio if total_files > 0 else 0)

        recommendations = []
        if theater_detected:
            recommendations.extend([
                "Balance comment additions with substantive code improvements",
                "Focus on meaningful code changes rather than documentation padding",
                "Ensure comments add value beyond obvious code explanation"
            ])

        return DetectorResult(
            detector_name=self.name,
            theater_detected=theater_detected,
            confidence=confidence,
            evidence=evidence,
            severity=severity,
            recommendations=recommendations,
            metadata={
                'comment_heavy_files': comment_heavy_files,
                'total_files': total_files,
                'comment_file_ratio': comment_file_ratio if total_files > 0 else 0
            }
        )

    def _analyze_diff_content(self, diff_content: str) -> Tuple[int, int]:
        """Analyze diff content for comment vs code lines."""
        comment_lines = 0
        code_lines = 0

        for line in diff_content.split('\n'):
            if line.startswith(('+', '-')) and len(line.strip()) > 1:
                line_content = line[1:].strip()

                if self._is_comment_line(line_content):
                    comment_lines += 1
                elif line_content and not line_content.isspace():
                    code_lines += 1

        return comment_lines, code_lines

    def _is_comment_line(self, line: str) -> bool:
        """Check if a line is primarily a comment."""
        line = line.strip()

        # Python comments
        if line.startswith('#'):
            return True

        # Docstring lines
        if '"""' in line or "'''" in line:
            return True

        # Other comment patterns
        comment_patterns = [
            r'^\s*//',  # JavaScript/C++ style
            r'^\s*/\*',  # C style
            r'^\s*\*',   # C style continuation
        ]

        for pattern in comment_patterns:
            if re.match(pattern, line):
                return True

        return False

class VariableRenamingDetector(BaseDetectorModule):
    """Detects excessive variable renaming without functional changes."""

    def __init__(self, config: Optional[Dict] = None):
        super().__init__('VariableRenaming', config)
        self.thresholds = {
            'rename_ratio_threshold': 0.6,
            'min_renames_threshold': 5,
            'functional_change_threshold': 0.2
        }

    def detect(self, code_data: Dict[str, Any], metrics_data: Dict[str, Any]) -> DetectorResult:
        """Detect variable renaming patterns."""

        evidence = []
        indicators = []

        files_changed = code_data.get('files_changed', [])
        if not files_changed:
            return self._empty_result()

        total_renames = 0
        total_changes = 0
        rename_files = []

        for file_data in files_changed:
            diff_content = file_data.get('diff', '')
            file_path = file_data.get('file_path', 'unknown')

            renames, changes = self._analyze_renaming_patterns(diff_content)
            total_renames += renames
            total_changes += changes

            if changes > 0 and renames / changes > self.thresholds['rename_ratio_threshold']:
                rename_files.append(file_path)
                evidence.append(f"File {file_path}: {renames} renames out of {changes} changes")
                indicators.append(renames / changes)

        # Overall analysis
        if total_changes > 0:
            overall_rename_ratio = total_renames / total_changes
            indicators.append(overall_rename_ratio)

            theater_detected = (
                overall_rename_ratio > self.thresholds['rename_ratio_threshold'] and
                total_renames >= self.thresholds['min_renames_threshold'] and
                len(rename_files) >= 2
            )

            if theater_detected:
                evidence.append(f"Overall rename ratio: {overall_rename_ratio:.1%}")
                evidence.append(f"Total renames: {total_renames} across {len(rename_files)} files")
        else:
            theater_detected = False

        confidence = self._calculate_confidence(indicators)
        severity = self._determine_severity(confidence, overall_rename_ratio if total_changes > 0 else 0)

        recommendations = []
        if theater_detected:
            recommendations.extend([
                "Focus on functional improvements rather than cosmetic renaming",
                "Ensure variable renames improve code clarity significantly",
                "Balance renaming with structural code improvements"
            ])

        return DetectorResult(
            detector_name=self.name,
            theater_detected=theater_detected,
            confidence=confidence,
            evidence=evidence,
            severity=severity,
            recommendations=recommendations,
            metadata={
                'total_renames': total_renames,
                'total_changes': total_changes,
                'rename_ratio': overall_rename_ratio if total_changes > 0 else 0,
                'rename_files': rename_files
            }
        )

    def _analyze_renaming_patterns(self, diff_content: str) -> Tuple[int, int]:
        """Analyze diff for variable/function renaming patterns."""

        rename_patterns = [
            r'[-+]\s*(\w+)\s*=',  # Variable assignments
            r'[-+]\s*def\s+(\w+)',  # Function definitions
            r'[-+]\s*class\s+(\w+)',  # Class definitions
            r'[-+]\s*(\w+)\s*\(',  # Function calls
        ]

        old_names = set()
        new_names = set()
        total_changes = 0

        lines = diff_content.split('\n')

        for line in lines:
            if line.startswith(('+', '-')):
                total_changes += 1

                for pattern in rename_patterns:
                    matches = re.findall(pattern, line)
                    for match in matches:
                        if line.startswith('-'):
                            old_names.add(match)
                        else:
                            new_names.add(match)

        # Estimate renames (simplified heuristic)
        potential_renames = min(len(old_names), len(new_names))

        return potential_renames, total_changes

    def _empty_result(self) -> DetectorResult:
        """Return empty result when no data available."""
        return DetectorResult(
            detector_name=self.name,
            theater_detected=False,
            confidence=0.0,
            evidence=[],
            severity='low',
            recommendations=[],
            metadata={}
        )

class TestPaddingDetector(BaseDetectorModule):
    """Detects test padding to inflate coverage without meaningful validation."""

    def __init__(self, config: Optional[Dict] = None):
        super().__init__('TestPadding', config)
        self.thresholds = {
            'trivial_test_ratio_threshold': 0.6,
            'coverage_improvement_threshold': 0.15,
            'assertion_density_threshold': 0.3
        }

    def detect(self, code_data: Dict[str, Any], metrics_data: Dict[str, Any]) -> DetectorResult:
        """Detect test padding patterns."""

        evidence = []
        indicators = []

        # Analyze test file changes
        test_files = [f for f in code_data.get('files_changed', [])
                     if self._is_test_file(f.get('file_path', ''))]

        if not test_files:
            return self._empty_result()

        trivial_tests = 0
        total_tests = 0
        low_assertion_tests = 0

        for test_file in test_files:
            diff_content = test_file.get('diff', '')
            file_path = test_file.get('file_path', 'unknown')

            # Analyze test functions in diff
            test_analysis = self._analyze_test_functions(diff_content)

            trivial_tests += test_analysis['trivial_count']
            total_tests += test_analysis['total_count']
            low_assertion_tests += test_analysis['low_assertion_count']

            if test_analysis['total_count'] > 0:
                trivial_ratio = test_analysis['trivial_count'] / test_analysis['total_count']
                if trivial_ratio > self.thresholds['trivial_test_ratio_threshold']:
                    evidence.append(f"File {file_path}: {trivial_ratio:.1%} trivial tests")
                    indicators.append(trivial_ratio)

        # Check coverage improvement patterns
        coverage_before = metrics_data.get('coverage_before', 0)
        coverage_after = metrics_data.get('coverage_after', 0)
        coverage_improvement = coverage_after - coverage_before

        if total_tests > 0:
            overall_trivial_ratio = trivial_tests / total_tests
            assertion_density = 1 - (low_assertion_tests / total_tests)

            indicators.extend([overall_trivial_ratio, assertion_density])

            # Detection logic
            theater_detected = (
                overall_trivial_ratio > self.thresholds['trivial_test_ratio_threshold'] and
                coverage_improvement > self.thresholds['coverage_improvement_threshold'] and
                assertion_density < self.thresholds['assertion_density_threshold']
            )

            if theater_detected:
                evidence.extend([
                    f"Overall trivial test ratio: {overall_trivial_ratio:.1%}",
                    f"Coverage improvement: {coverage_improvement:.1%}",
                    f"Low assertion density: {1-assertion_density:.1%}"
                ])
        else:
            theater_detected = False

        confidence = self._calculate_confidence(indicators)
        impact_score = coverage_improvement if total_tests > 0 else 0
        severity = self._determine_severity(confidence, impact_score)

        recommendations = []
        if theater_detected:
            recommendations.extend([
                "Add meaningful assertions to test functions",
                "Focus on testing edge cases and error conditions",
                "Ensure tests validate actual functionality, not just execution paths",
                "Review test quality, not just quantity"
            ])

        return DetectorResult(
            detector_name=self.name,
            theater_detected=theater_detected,
            confidence=confidence,
            evidence=evidence,
            severity=severity,
            recommendations=recommendations,
            metadata={
                'trivial_tests': trivial_tests,
                'total_tests': total_tests,
                'coverage_improvement': coverage_improvement,
                'test_files_analyzed': len(test_files)
            }
        )

    def _is_test_file(self, file_path: str) -> bool:
        """Check if file is a test file."""
        test_indicators = [
            'test_', '_test.', 'tests/', '/test/', 'spec_', '_spec.'
        ]

        file_path_lower = file_path.lower()
        return any(indicator in file_path_lower for indicator in test_indicators)

    def _analyze_test_functions(self, diff_content: str) -> Dict[str, int]:
        """Analyze test functions in diff content."""

        test_function_pattern = r'def\s+(test_\w+|.*_test)\s*\('
        assertion_patterns = [
            r'assert\s+',
            r'assertEqual',
            r'assertTrue',
            r'assertFalse',
            r'expect\(',
            r'\.to\.',
        ]

        lines = diff_content.split('\n')
        added_lines = [line[1:] for line in lines if line.startswith('+')]

        # Find test functions
        test_functions = []
        current_function = None
        function_lines = []

        for line in added_lines:
            if re.search(test_function_pattern, line):
                if current_function:
                    test_functions.append({
                        'name': current_function,
                        'lines': function_lines.copy()
                    })
                current_function = re.search(test_function_pattern, line).group(1)
                function_lines = [line]
            elif current_function and (line.startswith('    ') or line.startswith('\t')):
                function_lines.append(line)
            elif current_function and not line.strip():
                continue
            else:
                if current_function:
                    test_functions.append({
                        'name': current_function,
                        'lines': function_lines.copy()
                    })
                current_function = None
                function_lines = []

        # Add last function if exists
        if current_function:
            test_functions.append({
                'name': current_function,
                'lines': function_lines.copy()
            })

        # Analyze each test function
        trivial_count = 0
        low_assertion_count = 0

        for func in test_functions:
            assertion_count = 0
            line_count = len(func['lines'])

            for line in func['lines']:
                for pattern in assertion_patterns:
                    if re.search(pattern, line):
                        assertion_count += 1
                        break

            # Check if trivial (few lines, no/minimal assertions)
            if line_count <= 3 or assertion_count == 0:
                trivial_count += 1

            # Check assertion density
            if line_count > 0 and assertion_count / line_count < 0.2:
                low_assertion_count += 1

        return {
            'total_count': len(test_functions),
            'trivial_count': trivial_count,
            'low_assertion_count': low_assertion_count
        }

class MicroOptimizationDetector(BaseDetectorModule):
    """Detects micro-optimizations that don't significantly impact performance."""

    def __init__(self, config: Optional[Dict] = None):
        super().__init__('MicroOptimization', config)
        self.thresholds = {
            'micro_optimization_ratio_threshold': 0.7,
            'performance_improvement_threshold': 0.05,
            'optimization_significance_threshold': 0.1
        }

    def detect(self, code_data: Dict[str, Any], metrics_data: Dict[str, Any]) -> DetectorResult:
        """Detect micro-optimization patterns."""

        evidence = []
        indicators = []

        files_changed = code_data.get('files_changed', [])
        if not files_changed:
            return self._empty_result()

        micro_optimizations = 0
        total_optimizations = 0

        for file_data in files_changed:
            diff_content = file_data.get('diff', '')
            file_path = file_data.get('file_path', 'unknown')

            # Analyze optimization patterns
            optimizations = self._identify_optimization_patterns(diff_content)

            file_micro_count = len([opt for opt in optimizations if opt['is_micro']])
            file_total_count = len(optimizations)

            micro_optimizations += file_micro_count
            total_optimizations += file_total_count

            if file_total_count > 0:
                micro_ratio = file_micro_count / file_total_count
                if micro_ratio > self.thresholds['micro_optimization_ratio_threshold']:
                    evidence.append(f"File {file_path}: {micro_ratio:.1%} micro-optimizations")
                    indicators.append(micro_ratio)

        # Check performance impact
        perf_before = metrics_data.get('performance_before', {})
        perf_after = metrics_data.get('performance_after', {})
        perf_improvement = self._calculate_performance_improvement(perf_before, perf_after)

        # Detection logic
        if total_optimizations > 0:
            overall_micro_ratio = micro_optimizations / total_optimizations
            indicators.append(overall_micro_ratio)

            theater_detected = (
                overall_micro_ratio > self.thresholds['micro_optimization_ratio_threshold'] and
                perf_improvement < self.thresholds['performance_improvement_threshold'] and
                total_optimizations >= 3
            )

            if theater_detected:
                evidence.extend([
                    f"Micro-optimization ratio: {overall_micro_ratio:.1%}",
                    f"Performance improvement: {perf_improvement:.1%}",
                    f"Total optimizations: {total_optimizations}"
                ])
        else:
            theater_detected = False

        confidence = self._calculate_confidence(indicators)
        severity = self._determine_severity(confidence, overall_micro_ratio if total_optimizations > 0 else 0)

        recommendations = []
        if theater_detected:
            recommendations.extend([
                "Focus on algorithmic improvements with measurable impact",
                "Profile code to identify actual performance bottlenecks",
                "Prioritize optimizations that provide significant gains",
                "Consider maintainability vs. minimal performance gains"
            ])

        return DetectorResult(
            detector_name=self.name,
            theater_detected=theater_detected,
            confidence=confidence,
            evidence=evidence,
            severity=severity,
            recommendations=recommendations,
            metadata={
                'micro_optimizations': micro_optimizations,
                'total_optimizations': total_optimizations,
                'performance_improvement': perf_improvement
            }
        )

    def _identify_optimization_patterns(self, diff_content: str) -> List[Dict[str, Any]]:
        """Identify optimization patterns in diff content."""

        optimizations = []

        # Micro-optimization patterns
        micro_patterns = [
            (r'range\(len\(', r'enumerate\(', 'enumerate_usage'),
            (r'\+\s*""', r'join\(', 'string_concatenation'),
            (r'if\s+(\w+)\s+is\s+not\s+None:', r'if\s+\1:', 'none_check'),
            (r'\.keys\(\)', r'', 'dict_iteration'),
            (r'list\(.*\.keys\(\)\)', r'.*\.keys\(\)', 'list_keys_removal'),
        ]

        # Algorithmic patterns (more significant)
        algorithmic_patterns = [
            (r'for.*for.*in', r'list comprehension', 'comprehension_usage'),
            (r'sort\(\)', r'sorted\(', 'sorting_improvement'),
            (r'O\(n\^2\)', r'O\(n\)', 'complexity_improvement'),
        ]

        lines = diff_content.split('\n')

        for line in lines:
            if line.startswith(('+', '-')):
                # Check for micro-optimizations
                for old_pattern, new_pattern, opt_type in micro_patterns:
                    if re.search(old_pattern, line) or re.search(new_pattern, line):
                        optimizations.append({
                            'type': opt_type,
                            'is_micro': True,
                            'line': line.strip(),
                            'significance': 0.1
                        })
                        break

                # Check for algorithmic improvements
                for old_pattern, new_pattern, opt_type in algorithmic_patterns:
                    if re.search(old_pattern, line) or re.search(new_pattern, line):
                        optimizations.append({
                            'type': opt_type,
                            'is_micro': False,
                            'line': line.strip(),
                            'significance': 0.8
                        })
                        break

        return optimizations

    def _calculate_performance_improvement(self, before: Dict, after: Dict) -> float:
        """Calculate overall performance improvement."""

        if not before or not after:
            return 0.0

        improvements = []

        # Common performance metrics
        metrics = ['execution_time', 'memory_usage', 'cpu_usage', 'response_time']

        for metric in metrics:
            if metric in before and metric in after:
                try:
                    before_val = float(before[metric])
                    after_val = float(after[metric])

                    if before_val > 0:
                        # For time/usage metrics, lower is better
                        improvement = (before_val - after_val) / before_val
                        improvements.append(improvement)
                except (ValueError, TypeError):
                    continue

        return np.mean(improvements) if improvements else 0.0

class ComplexityHidingDetector(BaseDetectorModule):
    """Detects attempts to hide complexity without reducing it."""

    def __init__(self, config: Optional[Dict] = None):
        super().__init__('ComplexityHiding', config)
        self.thresholds = {
            'complexity_reduction_threshold': 0.2,
            'function_split_threshold': 3,
            'delegation_ratio_threshold': 0.7
        }

    def detect(self, code_data: Dict[str, Any], metrics_data: Dict[str, Any]) -> DetectorResult:
        """Detect complexity hiding patterns."""

        evidence = []
        indicators = []

        # Analyze complexity metrics
        complexity_before = metrics_data.get('complexity_before', 0)
        complexity_after = metrics_data.get('complexity_after', 0)

        if complexity_before == 0:
            return self._empty_result()

        complexity_reduction = (complexity_before - complexity_after) / complexity_before

        # Analyze code structure changes
        files_changed = code_data.get('files_changed', [])
        structure_changes = self._analyze_structure_changes(files_changed)

        # Detection patterns
        function_splits = structure_changes['function_splits']
        delegation_patterns = structure_changes['delegation_patterns']
        total_structural_changes = structure_changes['total_changes']

        # Calculate delegation ratio
        if total_structural_changes > 0:
            delegation_ratio = delegation_patterns / total_structural_changes
            indicators.append(delegation_ratio)
        else:
            delegation_ratio = 0.0

        # Theater detection logic
        theater_detected = (
            complexity_reduction > self.thresholds['complexity_reduction_threshold'] and
            function_splits >= self.thresholds['function_split_threshold'] and
            delegation_ratio > self.thresholds['delegation_ratio_threshold']
        )

        if theater_detected:
            evidence.extend([
                f"Complexity reduction: {complexity_reduction:.1%}",
                f"Function splits: {function_splits}",
                f"Delegation ratio: {delegation_ratio:.1%}",
                f"Potential complexity hiding through delegation"
            ])

        indicators.extend([complexity_reduction, function_splits / 10.0])  # Normalize function splits

        confidence = self._calculate_confidence(indicators)
        severity = self._determine_severity(confidence, complexity_reduction)

        recommendations = []
        if theater_detected:
            recommendations.extend([
                "Ensure complexity reduction is genuine, not just moved elsewhere",
                "Focus on simplifying algorithms rather than splitting functions",
                "Verify that delegated complexity is actually simplified",
                "Consider the overall system complexity, not just local metrics"
            ])

        return DetectorResult(
            detector_name=self.name,
            theater_detected=theater_detected,
            confidence=confidence,
            evidence=evidence,
            severity=severity,
            recommendations=recommendations,
            metadata={
                'complexity_reduction': complexity_reduction,
                'function_splits': function_splits,
                'delegation_ratio': delegation_ratio,
                'structure_changes': structure_changes
            }
        )

    def _analyze_structure_changes(self, files_changed: List[Dict]) -> Dict[str, int]:
        """Analyze structural changes in code."""

        function_splits = 0
        delegation_patterns = 0
        total_changes = 0

        for file_data in files_changed:
            diff_content = file_data.get('diff', '')

            # Look for function extraction patterns
            function_definitions = len(re.findall(r'\+\s*def\s+\w+', diff_content))
            function_calls = len(re.findall(r'\+.*\w+\(.*\)', diff_content))

            # Heuristic: new small functions that are immediately called
            if function_definitions > 0 and function_calls > function_definitions:
                function_splits += function_definitions
                delegation_patterns += min(function_definitions, function_calls - function_definitions)

            total_changes += function_definitions + function_calls

        return {
            'function_splits': function_splits,
            'delegation_patterns': delegation_patterns,
            'total_changes': total_changes
        }

class EnterpriseDetectorOrchestrator:
    """Orchestrates all detector modules for comprehensive theater detection."""

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.logger = logging.getLogger('EnterpriseDetectorOrchestrator')

        # Initialize all detector modules
        self.detectors = [
            CommentInflationDetector(config),
            VariableRenamingDetector(config),
            TestPaddingDetector(config),
            MicroOptimizationDetector(config),
            ComplexityHidingDetector(config)
        ]

    def run_all_detectors(self,
                         code_data: Dict[str, Any],
                         metrics_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run all detector modules and aggregate results."""

        detector_results = []

        for detector in self.detectors:
            try:
                result = detector.detect(code_data, metrics_data)
                detector_results.append(result)

                self.logger.info(
                    f"Detector {detector.name}: "
                    f"Theater={'Yes' if result.theater_detected else 'No'}, "
                    f"Confidence={result.confidence:.2f}, "
                    f"Severity={result.severity}"
                )

            except Exception as e:
                self.logger.error(f"Detector {detector.name} failed: {e}")
                continue

        # Aggregate results
        aggregated_results = self._aggregate_results(detector_results)

        return aggregated_results

    def _aggregate_results(self, results: List[DetectorResult]) -> Dict[str, Any]:
        """Aggregate results from all detectors."""

        if not results:
            return {
                'overall_theater_detected': False,
                'overall_confidence': 0.0,
                'overall_severity': 'low',
                'detector_results': [],
                'summary': 'No detector results available'
            }

        # Calculate overall metrics
        theater_detectors = [r for r in results if r.theater_detected]
        theater_detected = len(theater_detectors) > 0

        # Weighted confidence (higher weight for detectors that found theater)
        if theater_detectors:
            overall_confidence = np.mean([r.confidence for r in theater_detectors])
        else:
            overall_confidence = np.mean([r.confidence for r in results])

        # Overall severity (highest severity wins)
        severity_levels = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
        max_severity = max(results, key=lambda r: severity_levels.get(r.severity, 1)).severity

        # Collect all evidence and recommendations
        all_evidence = []
        all_recommendations = set()

        for result in results:
            if result.theater_detected:
                all_evidence.extend([f"[{result.detector_name}] {e}" for e in result.evidence])
                all_recommendations.update(result.recommendations)

        # Generate summary
        if theater_detected:
            summary = f"Theater detected by {len(theater_detectors)}/{len(results)} detectors"
        else:
            summary = "No theater patterns detected"

        return {
            'overall_theater_detected': theater_detected,
            'overall_confidence': overall_confidence,
            'overall_severity': max_severity,
            'detectors_triggered': len(theater_detectors),
            'total_detectors': len(results),
            'detector_results': [
                {
                    'detector_name': r.detector_name,
                    'theater_detected': r.theater_detected,
                    'confidence': r.confidence,
                    'severity': r.severity,
                    'evidence_count': len(r.evidence),
                    'metadata': r.metadata
                } for r in results
            ],
            'aggregated_evidence': all_evidence,
            'aggregated_recommendations': list(all_recommendations),
            'summary': summary,
            'analysis_timestamp': datetime.now().isoformat()
        }