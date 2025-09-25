"""Quality gate criteria for code analysis and validation.

This module defines critical quality thresholds used throughout the
system for code quality validation, testing requirements, and
architectural constraints.

All thresholds are derived from:
- Industry best practices for enterprise software
- NASA POT10 structural requirements
- Defense industry code quality standards
"""

# Test Coverage Requirements
MINIMUM_TEST_COVERAGE_PERCENTAGE = 80
"""Minimum test coverage percentage required for code quality validation.

Based on defense industry standards requiring comprehensive test coverage
for mission-critical systems. Code below this threshold fails quality gates.
"""

TARGET_TEST_COVERAGE_PERCENTAGE = 90
"""Target test coverage percentage for optimal code quality.

Represents best practice threshold for enterprise-grade test coverage,
ensuring robust validation of all critical code paths.
"""

# Architectural Constraints
MAXIMUM_GOD_OBJECTS_ALLOWED = 25
"""Maximum number of god objects permitted in the codebase.

God objects (classes with excessive responsibilities) violate
single responsibility principle and create maintenance risks.
Exceeding this threshold triggers architectural review.
"""

MAXIMUM_FUNCTION_LENGTH_LINES = 100
"""Maximum lines of code allowed in a single function.

Based on cognitive load research and maintainability studies.
Functions exceeding this length are difficult to understand,
test, and maintain effectively.
"""

MAXIMUM_FILE_LENGTH_LINES = 500
"""Maximum lines of code allowed in a single file.

Ensures files remain manageable and focused on specific
responsibilities. Large files indicate potential architectural
issues and violation of separation of concerns.
"""

MAXIMUM_FUNCTION_PARAMETERS = 10
"""Maximum number of parameters allowed for a single function.

Functions with excessive parameters indicate poor design
and high coupling. This threshold enforces better parameter
object design and function decomposition.
"""

MAXIMUM_NESTED_DEPTH = 5
"""Maximum nesting depth allowed in code structures.

Deeply nested code is difficult to understand and test.
This threshold enforces better code organization and
reduces cognitive complexity.
"""

# Code Quality Metrics
MINIMUM_CODE_QUALITY_SCORE = 0.80
"""Minimum overall code quality score for acceptance.

Composite metric based on complexity, maintainability,
and structural analysis. Code below this threshold
requires refactoring before approval.
"""

MAXIMUM_CYCLOMATIC_COMPLEXITY = 15
"""Maximum cyclomatic complexity allowed for functions.

Based on software engineering research showing increased
defect rates in functions exceeding this complexity threshold.
"""

MINIMUM_MAINTAINABILITY_INDEX = 70
"""Minimum maintainability index required for code acceptance.

Composite metric considering complexity, volume, and documentation.
Code below this threshold is considered difficult to maintain.
"""
