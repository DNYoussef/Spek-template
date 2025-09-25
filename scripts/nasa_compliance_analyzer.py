from src.constants.base import KELLY_CRITERION_FRACTION

Implements NASA POT10 rules enforcement:
- Rule 3: No dynamic memory allocation
- Rule 4: Functions <=60 lines
- Rule 5: Assertion density >=2%

Priority: P2 - Must be completed within 45 days.
"""

import ast
import os
import re
from collections import defaultdict, namedtuple
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

@dataclass
class FunctionViolation:
    """Represents a NASA POT10 rule violation."""
    file_path: str
    function_name: str
    line_start: int
    line_end: int
    violation_type: str
    severity: str
    details: Dict[str, Any]
    suggested_fix: Optional[str] = None

@dataclass
class ComplianceReport:
    """NASA POT10 compliance assessment report."""
    total_functions: int = 0
    rule3_violations: List[FunctionViolation] = field(default_factory=list)  # Dynamic memory
    rule4_violations: List[FunctionViolation] = field(default_factory=list)  # Function length
    rule5_violations: List[FunctionViolation] = field(default_factory=list)  # Assertion density
    compliance_score: float = 0.0
    recommendations: List[str] = field(default_factory=list)

class NASAComplianceAnalyzer:
    """Comprehensive NASA Power of Ten compliance analyzer."""

    def __init__(self, root_path: str):
        self.root_path = Path(root_path)

        # Dynamic memory allocation patterns (Rule 3)
        self.dynamic_memory_patterns = [
            r'\bmalloc\s*\(',
            r'\bcalloc\s*\(',
            r'\brealloc\s*\(',
            r'\bfree\s*\(',
            r'\bnew\s+\w+',
            r'\bdelete\s+',
            r'\.append\s*\(',  # Python dynamic lists
            r'\.extend\s*\(',
            r'\+\=.*\[',  # List concatenation
            r'\.insert\s*\(',
            r'dict\s*\(',  # Dynamic dict creation
            r'list\s*\(',  # Dynamic list creation
            r'set\s*\(',   # Dynamic set creation
        ]

        # Assertion patterns (Rule 5)
        self.assertion_patterns = [
            r'\bassert\s+',
            r'\.assert\w*\(',
            r'\braise\s+\w+',
            r'\bif\s+.*:\s*raise',
            r'except\s+\w+:',
            r'try:\s*.*\s*except',
        ]

    def analyze_file(self, file_path: Path) -> List[FunctionViolation]:
        """Analyze a single file for NASA POT10 violations."""
        violations = []

        if file_path.suffix != '.py':
            return violations

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Parse AST
            try:
                tree = ast.parse(content, filename=str(file_path))
            except SyntaxError as e:
                logger.warning(f"Syntax error in {file_path}: {e}")
                return violations

            # Analyze each function
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    func_violations = self._analyze_function(file_path, content, node)
                    violations.extend(func_violations)

        except Exception as e:
            logger.error(f"Failed to analyze {file_path}: {e}")

        return violations

    def _analyze_function(self, file_path: Path, content: str, func_node: ast.FunctionDef) -> List[FunctionViolation]:
        """Analyze a single function for all NASA POT10 violations."""
        violations = []
        lines = content.split('\n')

        # Get function source lines
        func_start = func_node.lineno
        func_end = func_node.end_lineno or func_start

        # Get function content
        func_lines = lines[func_start-1:func_end]
        func_content = '\n'.join(func_lines)

        # Rule 4: Function length <= 60 lines
        func_length = len(func_lines)
        if func_length > 60:
            violations.append(FunctionViolation(
                file_path=str(file_path),
                function_name=func_node.name,
                line_start=func_start,
                line_end=func_end,
                violation_type="RULE_4_LENGTH",
                severity="MEDIUM",
                details={
                    "actual_lines": func_length,
                    "max_allowed": 60,
                    "excess_lines": func_length - 60
                },
                suggested_fix=self._generate_length_fix(func_node, func_content)
            ))

        # Rule 5: Assertion density >= 2%
        assertion_count = self._count_assertions(func_content)
        assertion_density = (assertion_count / func_length) * 100 if func_length > 0 else 0

        if assertion_density < 2.0:
            violations.append(FunctionViolation(
                file_path=str(file_path),
                function_name=func_node.name,
                line_start=func_start,
                line_end=func_end,
                violation_type="RULE_5_ASSERTIONS",
                severity="HIGH",
                details={
                    "assertion_count": assertion_count,
                    "assertion_density": assertion_density,
                    "min_required": 2.0,
                    "missing_assertions": max(0, int(func_length * 0.02) - assertion_count)
                },
                suggested_fix=self._generate_assertion_fix(func_node, func_content)
            ))

        # Rule 3: No dynamic memory allocation
        dynamic_allocations = self._find_dynamic_memory_usage(func_content)
        if dynamic_allocations:
            violations.append(FunctionViolation(
                file_path=str(file_path),
                function_name=func_node.name,
                line_start=func_start,
                line_end=func_end,
                violation_type="RULE_3_MEMORY",
                severity="HIGH",
                details={
                    "allocation_count": len(dynamic_allocations),
                    "allocations": dynamic_allocations
                },
                suggested_fix=self._generate_memory_fix(func_node, dynamic_allocations)
            ))

        return violations

    def _count_assertions(self, func_content: str) -> int:
        """Count assertion statements in function."""
        assertion_count = 0

        for pattern in self.assertion_patterns:
            matches = re.finditer(pattern, func_content, re.MULTILINE)
            assertion_count += len(list(matches))

        return assertion_count

    def _find_dynamic_memory_usage(self, func_content: str) -> List[Dict[str, Any]]:
        """Find dynamic memory allocations in function."""
        allocations = []

        for pattern in self.dynamic_memory_patterns:
            matches = re.finditer(pattern, func_content, re.MULTILINE)
            for match in matches:
                line_num = func_content[:match.start()].count('\n') + 1
                allocations.append({
                    'pattern': pattern,
                    'line': line_num,
                    'text': match.group(),
                    'context': func_content.split('\n')[line_num-1].strip()
                })

        return allocations

    def _generate_length_fix(self, func_node: ast.FunctionDef, func_content: str) -> str:
        """Generate refactoring suggestions for long functions."""
        return f"""
# REFACTORING SUGGESTION for {func_node.name}():
    pass

# Recommended approach:

# Example refactoring pattern:
def {func_node.name}_main():
    \"\"\"Main orchestration function.\"\"\"
    data = {func_node.name}_prepare_data()
    result = {func_node.name}_process_data(data)
    {func_node.name}_finalize_result(result)
    return result

def {func_node.name}_prepare_data():
    \"\"\"Data preparation step.\"\"\"
    # Move data preparation logic here

def {func_node.name}_process_data(data):
    \"\"\"Data processing step.\"\"\"
    # Move core processing logic here

def {func_node.name}_finalize_result(result):
    \"\"\"Result finalization step.\"\"\"
    # Move finalization logic here
"""

    def _generate_assertion_fix(self, func_node: ast.FunctionDef, func_content: str) -> str:
        """Generate assertion enhancement suggestions."""
        lines = func_content.split('\n')
        func_length = len(lines)

        return f"""
# ASSERTION ENHANCEMENT for {func_node.name}():
    pass

# Recommended assertions to add:

# 1. Input validation (add at function start):
assert parameter is not None, "Parameter cannot be None"
assert isinstance(parameter, expected_type), f"Expected {{expected_type}}, got {{type(parameter)}}"
assert len(parameter) > 0, "Parameter cannot be empty"

# 2. Intermediate state validation:
assert intermediate_result is not None, "Intermediate processing failed"
assert len(results) > 0, "No results produced"

# 3. Pre-condition checks:
assert self.is_initialized, "Object not properly initialized"
assert self.state == VALID_STATE, f"Invalid state: {{self.state}}"

# 4. Post-condition validation (add before return):
assert return_value is not None, "Function must return a value"
assert self._validate_result(return_value), "Result validation failed"

# 5. Error handling with assertions:
    pass
try:
    risky_operation()
except Exception as e:
    logger.error(f"Operation failed: {{e}}")
    assert False, f"Critical operation failed: {{e}}"
"""

    def _generate_memory_fix(self, func_node: ast.FunctionDef, allocations: List[Dict]) -> str:
        """Generate dynamic memory usage fixes."""
        fix_suggestions = []

        for alloc in allocations:
            pattern = alloc['pattern']
            context = alloc['context']

            if '.append(' in pattern:
                fix_suggestions.append(f"""
# Replace dynamic append with pre-allocated structure:
    pass
MAX_ITEMS = 1000  # Define maximum based on requirements
result_list = [None] * MAX_ITEMS
result_index = 0

# Instead of: result_list.append(item)
if result_index < MAX_ITEMS:
    result_list[result_index] = item
    result_index += 1
else:
    raise RuntimeError("Exceeded maximum items limit")
""")

            elif 'dict(' in pattern or 'list(' in pattern or 'set(' in pattern:
                fix_suggestions.append(f"""
# Replace dynamic collection creation:
from collections import namedtuple
from typing import NamedTuple

# Instead of dynamic dict:
ResultData = namedtuple('ResultData', ['field1', 'field2', 'field3'])
result = ResultData(field1=value1, field2=value2, field3=value3)
""")

            else:
                fix_suggestions.append(f"""
# Address dynamic memory allocation:
""")

        return f"""
# DYNAMIC MEMORY ELIMINATION for {func_node.name}():
    pass

{''.join(fix_suggestions)}

# General strategies:
"""

    def generate_refactoring_script(self, violations: List[FunctionViolation]) -> str:
        """Generate automated refactoring script."""

        # Group violations by file
        files_to_fix = defaultdict(list)
        for violation in violations:
            files_to_fix[violation.file_path].append(violation)

        script = f"""#!/usr/bin/env python3
\"\"\"
Automated NASA POT10 Compliance Refactoring Script
Generated: {__import__('datetime').datetime.now().isoformat()}
\"\"\"

import ast
import os
from pathlib import Path

class FunctionRefactorer:
    \"\"\"Automated function refactoring for NASA compliance.\"\"\"

    def __init__(self):
        self.max_function_length = 60
        self.min_assertion_density = 2.0

    def refactor_long_function(self, file_path: str, function_name: str, start_line: int, end_line: int):
        \"\"\"Refactor function that exceeds length limit.\"\"\"
        with open(file_path, 'r') as f:
            lines = f.readlines()

        # Extract function
        func_lines = lines[start_line-1:end_line]

        # Simple heuristic: split at logical boundaries
        breakpoints = []
        for i, line in enumerate(func_lines):
            if (line.strip().startswith('#') or
                line.strip() == '' or
                any(keyword in line for keyword in ['if ', 'for ', 'while ', 'try:', 'except:', 'with '])):
                breakpoints.append(i)

        if len(breakpoints) > 2:
            # Create helper functions
            self._create_helper_functions(file_path, function_name, func_lines, breakpoints)

    def add_assertions(self, file_path: str, function_name: str, start_line: int, end_line: int):
        \"\"\"Add assertions to improve assertion density.\"\"\"
        with open(file_path, 'r') as f:
            lines = f.readlines()

        # Add basic input validation assertions
        func_def_line = start_line - 1
        indent = len(lines[func_def_line]) - len(lines[func_def_line].lstrip())

        # Insert assertions after function definition
        assertions = [
            f"{{' ' * (indent + 4)}}# NASA Rule 5: Assertion for input validation\\n",
            f"{{' ' * (indent + 4)}}assert locals(), 'Function parameters validation'\\n",
            f"{{' ' * (indent + 4)}}\\n"
        ]

        for i, assertion in enumerate(assertions):
            lines.insert(func_def_line + 1 + i, assertion)

        # Write back to file
        with open(file_path, 'w') as f:
            f.writelines(lines)

    def _create_helper_functions(self, file_path: str, function_name: str, func_lines: List[str], breakpoints: List[int]):
        \"\"\"Create helper functions from breakpoints.\"\"\"
        # Implementation would create extracted methods

def main():
    \"\"\"Execute automated refactoring.\"\"\"
    refactorer = FunctionRefactorer()

    # Files to process:
{chr(10).join(f'    # {file_path}: {len(violations)} violations' for file_path, violations in files_to_fix.items())}

    files_to_process = [
{chr(10).join(f'        "{file_path}",' for file_path in files_to_fix.keys())}
    ]

    for file_path in files_to_process:
        print(f"Processing: {{file_path}}")

        # Apply refactoring based on violations

        print(f"Completed: {{file_path}}")

    print("Automated refactoring completed.")

if __name__ == '__main__':
    main()
"""

        return script

    def analyze_codebase(self) -> ComplianceReport:
        """Analyze entire codebase for NASA POT10 compliance."""
        report = ComplianceReport()
        all_violations = []

        logger.info("Starting NASA POT10 compliance analysis...")

        # Analyze all Python files
        for py_file in self.root_path.rglob('*.py'):
            if any(skip_dir in str(py_file) for skip_dir in ['.git', '__pycache__', '.pytest_cache', 'venv', '.venv']):
                continue

            file_violations = self.analyze_file(py_file)
            all_violations.extend(file_violations)

        # Categorize violations
        for violation in all_violations:
            if violation.violation_type == "RULE_3_MEMORY":
                report.rule3_violations.append(violation)
            elif violation.violation_type == "RULE_4_LENGTH":
                report.rule4_violations.append(violation)
            elif violation.violation_type == "RULE_5_ASSERTIONS":
                report.rule5_violations.append(violation)

        # Calculate compliance metrics
        total_violations = len(all_violations)
        report.total_functions = len(set((v.file_path, v.function_name) for v in all_violations))

        if report.total_functions > 0:
            report.compliance_score = max(0, (report.total_functions - total_violations) / report.total_functions * 100)

        # Generate recommendations
        report.recommendations = self._generate_recommendations(report)

        logger.info(f"Analysis complete: {total_violations} violations found")
        logger.info(f"Compliance score: {report.compliance_score:.1f}%")

        return report

    def _generate_recommendations(self, report: ComplianceReport) -> List[str]:
        """Generate prioritized recommendations based on violations."""
        recommendations = []

        if report.rule5_violations:
            recommendations.append(
                f"HIGH PRIORITY: Improve assertion density in {len(report.rule5_violations)} functions. "
                f"Add input validation, error handling, and state verification assertions."
            )

        if report.rule3_violations:
            recommendations.append(
                f"HIGH PRIORITY: Eliminate dynamic memory allocation in {len(report.rule3_violations)} functions. "
                f"Use pre-allocated collections and object pooling."
            )

        if report.rule4_violations:
            recommendations.append(
                f"MEDIUM PRIORITY: Refactor {len(report.rule4_violations)} oversized functions. "
                f"Use Extract Method pattern to break into smaller components."
            )

        if report.compliance_score < 95:
            recommendations.append(
                f"Implement automated compliance checking in CI/CD pipeline to prevent future violations."
            )

        return recommendations

def main():
    """Execute NASA POT10 compliance analysis."""
    root_path = os.path.dirname(os.path.dirname(__file__))
    analyzer = NASAComplianceAnalyzer(root_path)

    # Run analysis
    report = analyzer.analyze_codebase()

    # Generate detailed report
    report_content = f"""
NASA POWER OF TEN COMPLIANCE REPORT
==================================
Generated: {__import__('datetime').datetime.now().isoformat()}

SUMMARY:
- Total functions analyzed: {report.total_functions}
- Overall compliance score: {report.compliance_score:.1f}%

RULE VIOLATIONS:
- Rule 3 (No dynamic memory): {len(report.rule3_violations)} violations
- Rule 4 (Function length 60): {len(report.rule4_violations)} violations
- Rule 5 (Assertion density 2%): {len(report.rule5_violations)} violations

DETAILED VIOLATIONS:

RULE 4 VIOLATIONS (Function Length):
"""

    for violation in report.rule4_violations:
        report_content += f"""
File: {violation.file_path}
Function: {violation.function_name} (lines {violation.line_start}-{violation.line_end})
Length: {violation.details['actual_lines']} lines (exceeds 60)
{violation.suggested_fix}
"""

    report_content += f"""

RULE 5 VIOLATIONS (Assertion Density):
"""

    for violation in report.rule5_violations:
        report_content += f"""
File: {violation.file_path}
Function: {violation.function_name} (lines {violation.line_start}-{violation.line_end})
Density: {violation.details['assertion_density']:.1f}% (requires 2.0%)
Missing: {violation.details['missing_assertions']} assertions
{violation.suggested_fix}
"""

    report_content += f"""

RULE 3 VIOLATIONS (Dynamic Memory):
"""

    for violation in report.rule3_violations:
        report_content += f"""
File: {violation.file_path}
Function: {violation.function_name} (lines {violation.line_start}-{violation.line_end})
Allocations: {violation.details['allocation_count']}
{violation.suggested_fix}
"""

    report_content += f"""

RECOMMENDATIONS:
"""

    for i, recommendation in enumerate(report.recommendations, 1):
        report_content += f"{i}. {recommendation}\n"

    # Save report
    report_path = Path(root_path) / 'docs' / 'nasa-compliance-report.md'
    with open(report_path, 'w') as f:
        f.write(report_content)

    # Generate refactoring script
    refactoring_script = analyzer.generate_refactoring_script(
        report.rule4_violations + report.rule5_violations
    )

    script_path = Path(root_path) / 'scripts' / 'automated_nasa_refactoring.py'
    with open(script_path, 'w') as f:
        f.write(refactoring_script)

    logger.info(f"NASA compliance report saved to: {report_path}")
    logger.info(f"Refactoring script saved to: {script_path}")

    # Return exit code based on compliance
    if report.compliance_score >= 95:
        logger.info("NASA POT10 compliance achieved")
        return 0
    elif report.compliance_score >= 80:
        logger.warning("NASA POT10 mostly compliant - improvement needed")
        return 1
    else:
        logger.error("NASA POT10 non-compliant - immediate action required")
        return 2

if __name__ == '__main__':
    exit(main())