from src.constants.base import API_TIMEOUT_SECONDS, REGULATORY_FACTUALITY_REQUIREMENT

import json
import re
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, field
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@dataclass
class RepairStrategy:
    """Represents a repair strategy for a specific failure."""
    strategy_name: str
    failure_pattern: str
    repair_technique: str
    success_rate: float
    template: Optional[str] = None
    required_context: List[str] = field(default_factory=list)

@dataclass
class RepairAttempt:
    """Represents an attempt to repair a failure."""
    attempt_id: str
    failure_type: str
    strategy_used: str
    files_modified: List[str]
    changes_made: Dict[str, List[str]]
    success: bool
    validation_results: Optional[Dict[str, Any]] = None
    rollback_available: bool = True

class AutoRepairEngine:
    """
    Handles automatic repair and fix generation.

    Extracted from LoopOrchestrator god object (1, 323 LOC -> ~280 LOC component).
    Handles:
    - Repair strategy selection
    - Automatic fix generation
    - Fix validation
    - Rollback management
    - Success tracking
    """

def __init__(self,
                project_root: str,
                repair_strategies_file: Optional[str] = None):
        """Initialize the auto repair engine."""
        self.project_root = Path(project_root)
        self.repair_strategies_file = repair_strategies_file

        # Repair strategies
        self.strategies: Dict[str, RepairStrategy] = {}
        self.repair_history: List[RepairAttempt] = []
        self.rollback_points: Dict[str, Dict[str, Any]] = {}

        # Load strategies
        self._load_repair_strategies()

def _load_repair_strategies(self) -> None:
        """Load repair strategies from configuration."""
        # Default strategies
        self.strategies = {
            "undefined_reference": RepairStrategy(
                strategy_name="undefined_reference",
                failure_pattern=r"(undefined|is not defined|Cannot read)",
                repair_technique="add_import",
                success_rate=0.85,
                template="import {{ module }} from '{{ path }}';",
                required_context=["imports", "dependencies"]
            ),
            "type_error": RepairStrategy(
                strategy_name="type_error",
                failure_pattern=r"(Type|type error|incompatible types)",
                repair_technique="fix_types",
                success_rate=0.75,
                required_context=["type_definitions", "interfaces"]
            ),
            "timeout": RepairStrategy(
                strategy_name="timeout",
                failure_pattern=r"(timeout|timed out|exceeded)",
                repair_technique="increase_timeout",
                success_rate=REGULATORY_FACTUALITY_REQUIREMENT,
                template="jest.setTimeout({{ new_timeout }});",
                required_context=["test_config"]
            ),
            "assertion_failure": RepairStrategy(
                strategy_name="assertion_failure",
                failure_pattern=r"(expect|assert|should)",
                repair_technique="update_expectation",
                success_rate=0.60,
                required_context=["test_data", "expected_values"]
            ),
            "missing_mock": RepairStrategy(
                strategy_name="missing_mock",
                failure_pattern=r"(mock|stub|spy)",
                repair_technique="create_mock",
                success_rate=0.80,
                template="jest.mock('{{ module }}', () => ({{ mock_implementation }}));",
                required_context=["module_structure", "dependencies"]
            )
        }

        # Load custom strategies if file provided
        if self.repair_strategies_file and Path(self.repair_strategies_file).exists():
            try:
                with open(self.repair_strategies_file, 'r') as f:
                    custom_strategies = json.load(f)
                    for name, config in custom_strategies.items():
                        self.strategies[name] = RepairStrategy(**config)
            except Exception as e:
                logger.error(f"Failed to load custom strategies: {e}")

def analyze_failure(self,
                        error_message: str,
                        file_path: Optional[str] = None,
                        context: Optional[Dict[str, Any]] = None) -> Optional[RepairStrategy]:
        """Analyze a failure and select appropriate repair strategy."""
        # Try to match error pattern to strategy
        for strategy in self.strategies.values():
            if re.search(strategy.failure_pattern, error_message, re.IGNORECASE):
                logger.info(f"Matched strategy: {strategy.strategy_name}")
                return strategy

        logger.warning("No matching repair strategy found")
        return None

def generate_fix(self,
                    strategy: RepairStrategy,
                    error_details: Dict[str, Any],
                    context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a fix based on the repair strategy."""
        fix = {
            "strategy": strategy.strategy_name,
            "files": [],
            "changes": {},
            "confidence": strategy.success_rate
        }

        # Apply repair technique
        if strategy.repair_technique == "add_import":
            fix.update(self._generate_import_fix(error_details, context))
        elif strategy.repair_technique == "fix_types":
            fix.update(self._generate_type_fix(error_details, context))
        elif strategy.repair_technique == "increase_timeout":
            fix.update(self._generate_timeout_fix(error_details, context))
        elif strategy.repair_technique == "update_expectation":
            fix.update(self._generate_assertion_fix(error_details, context))
        elif strategy.repair_technique == "create_mock":
            fix.update(self._generate_mock_fix(error_details, context))
        else:
            logger.warning(f"Unknown repair technique: {strategy.repair_technique}")

        return fix

def _generate_import_fix(self,
                            error_details: Dict[str, Any],
                            context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate fix for missing import."""
        file_path = error_details.get("file_path", "")
        undefined_var = self._extract_undefined_variable(error_details.get("message", ""))

        if not undefined_var:
            return {}

        # Find the module that exports this variable
        module_path = self._find_module_export(undefined_var, context)

        if module_path:
            import_statement = f"import {{ {undefined_var} }} from '{module_path}';"
            return {
                "files": [file_path],
                "changes": {
                    file_path: [
                        {"type": "add_line", "line": 1, "content": import_statement}
                    ]
                }
            }
        return {}

def _generate_type_fix(self,
                            error_details: Dict[str, Any],
                            context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate fix for type errors."""
        file_path = error_details.get("file_path", "")
        line_number = error_details.get("line_number", 0)

        # Analyze type mismatch
        expected_type = self._extract_expected_type(error_details.get("message", ""))
        actual_type = self._extract_actual_type(error_details.get("message", ""))

        if expected_type and actual_type:
            # Generate type conversion or annotation
            fix_content = self._generate_type_conversion(actual_type, expected_type)
            return {
                "files": [file_path],
                "changes": {
                    file_path: [
                        {"type": "replace_line", "line": line_number, "content": fix_content}
                    ]
                }
            }
        return {}

def _generate_timeout_fix(self,
                            error_details: Dict[str, Any],
                            context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate fix for timeout issues."""
        file_path = error_details.get("file_path", "")

        # Increase timeout value
        new_timeout = 30000  # API_TIMEOUT_SECONDS seconds
        timeout_statement = f"jest.setTimeout({new_timeout});"

        return {
            "files": [file_path],
            "changes": {
                file_path: [
                    {"type": "add_line", "line": 1, "content": timeout_statement}
                ]
            }
        }

def apply_fix(self,
                fix: Dict[str, Any],
                validate: bool = True) -> RepairAttempt:
        """Apply a generated fix to the codebase."""
        attempt_id = f"repair_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Create rollback point
        self._create_rollback_point(attempt_id, fix["files"])

        # Apply changes
        files_modified = []
        changes_made = {}

        for file_path, changes in fix.get("changes", {}).items():
            try:
                self._apply_file_changes(file_path, changes)
                files_modified.append(file_path)
                changes_made[file_path] = changes
            except Exception as e:
                logger.error(f"Failed to apply changes to {file_path}: {e}")
                # Rollback on failure
                self.rollback(attempt_id)
                return RepairAttempt(
                    attempt_id=attempt_id,
                    failure_type=fix.get("strategy", "unknown"),
                    strategy_used=fix.get("strategy", "unknown"),
                    files_modified=[],
                    changes_made={},
                    success=False
                )

        # Validate if requested
        validation_results = None
        success = True
        if validate:
            validation_results = self._validate_fix(files_modified)
            success = validation_results.get("success", False)

        # Create repair attempt record
        attempt = RepairAttempt(
            attempt_id=attempt_id,
            failure_type=fix.get("strategy", "unknown"),
            strategy_used=fix.get("strategy", "unknown"),
            files_modified=files_modified,
            changes_made=changes_made,
            success=success,
            validation_results=validation_results
        )

        self.repair_history.append(attempt)
        return attempt

def _apply_file_changes(self, file_path: str, changes: List[Dict[str, Any]]) -> None:
        """Apply changes to a file."""
        full_path = self.project_root / file_path

        if not full_path.exists():
            raise FileNotFoundError(f"File not found: {full_path}")

        # Read file content
        with open(full_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Apply changes
        for change in changes:
            change_type = change.get("type")
            if change_type == "add_line":
                line_num = change.get("line", 1)
                content = change.get("content", "") + "\n"
                lines.insert(line_num - 1, content)
            elif change_type == "replace_line":
                line_num = change.get("line", 1)
                content = change.get("content", "") + "\n"
                if 0 < line_num <= len(lines):
                    lines[line_num - 1] = content
            elif change_type == "delete_line":
                line_num = change.get("line", 1)
                if 0 < line_num <= len(lines):
                    del lines[line_num - 1]

        # Write back
        with open(full_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)

def _create_rollback_point(self, rollback_id: str, files: List[str]) -> None:
        """Create a rollback point for files."""
        rollback_data = {}

        for file_path in files:
            full_path = self.project_root / file_path
            if full_path.exists():
                with open(full_path, 'r', encoding='utf-8') as f:
                    rollback_data[file_path] = f.read()

        self.rollback_points[rollback_id] = {
            "timestamp": datetime.now().isoformat(),
            "files": rollback_data
        }

def rollback(self, rollback_id: str) -> bool:
        """Rollback to a previous state."""
        if rollback_id not in self.rollback_points:
            logger.error(f"Rollback point not found: {rollback_id}")
            return False

        rollback_data = self.rollback_points[rollback_id]

        try:
            for file_path, content in rollback_data["files"].items():
                full_path = self.project_root / file_path
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(content)

            logger.info(f"Successfully rolled back to {rollback_id}")
            return True

        except Exception as e:
            logger.error(f"Rollback failed: {e}")
            return False

def _validate_fix(self, files_modified: List[str]) -> Dict[str, Any]:
        """Validate that a fix resolved the issue."""
        # Run tests on modified files
        test_command = f"npm test -- {' '.join(files_modified)}"

        try:
            import shlex
            cmd_list = shlex.split(test_command)
            result = subprocess.run(
                cmd_list,
                shell=False,
                capture_output=True,
                text=True,
                cwd=self.project_root,
                timeout=60
            )

            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "errors": result.stderr
            }

        except Exception as e:
            logger.error(f"Validation failed: {e}")
            return {"success": False, "error": str(e)}

def _extract_undefined_variable(self, error_message: str) -> Optional[str]:
        """Extract undefined variable name from error message."""
        patterns = [
            r"'(\w+)' is not defined",
            r"(\w+) is undefined",
            r"Cannot find name '(\w+)'"
        ]

        for pattern in patterns:
            match = re.search(pattern, error_message)
            if match:
                return match.group(1)
        return None

def _find_module_export(self,
                            variable_name: str,
                            context: Dict[str, Any]) -> Optional[str]:
        """Find module that exports a variable."""
        # Search in known modules (simplified)
        common_modules = {
            "React": "react",
            "useState": "react",
            "useEffect": "react",
            "jest": "@types/jest",
            "expect": "@jest/globals"
        }

        return common_modules.get(variable_name)

def _extract_expected_type(self, error_message: str) -> Optional[str]:
        """Extract expected type from error message."""
        match = re.search(r"expected type[:\s]+(\w+)", error_message, re.IGNORECASE)
        if match:
            return match.group(1)
        return None

def _extract_actual_type(self, error_message: str) -> Optional[str]:
        """Extract actual type from error message."""
        match = re.search(r"actual type[:\s]+(\w+)", error_message, re.IGNORECASE)
        if match:
            return match.group(1)
        return None

def _generate_type_conversion(self, from_type: str, to_type: str) -> str:
        """Generate type conversion code."""
        conversions = {
            ("string", "number"): "Number(value)",
            ("number", "string"): "String(value)",
            ("any", "string"): "String(value)",
            ("any", "number"): "Number(value)",
            ("object", "string"): "JSON.stringify(value)"
        }

        return conversions.get((from_type.lower(), to_type.lower()), "value")

def get_repair_success_rate(self) -> float:
        """Get overall repair success rate."""
        if not self.repair_history:
            return 0.0

        successful = sum(1 for attempt in self.repair_history if attempt.success)
        return successful / len(self.repair_history)