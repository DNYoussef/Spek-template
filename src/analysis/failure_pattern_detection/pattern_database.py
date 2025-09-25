"""
Pattern Database Management Module
Handles loading, saving, and managing failure pattern databases.
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field

from ..failure_pattern_detector import FailureSignature

logger = logging.getLogger(__name__)


@dataclass
class PatternDatabaseConfig:
    """Configuration for pattern database."""
    error_patterns_path: str = ".claude/.artifacts/error_patterns.json"
    fix_strategies_path: str = ".claude/.artifacts/fix_strategies.json"
    historical_patterns_path: str = ".claude/.artifacts/failure_patterns.json"
    auto_save: bool = True


class PatternDatabase:
    """Manages failure pattern databases and historical learning."""

    def __init__(self, config: PatternDatabaseConfig = None):
        self.config = config or PatternDatabaseConfig()
        self.error_patterns = self._load_error_patterns()
        self.fix_strategies = self._load_fix_strategies()
        self.historical_patterns: Dict[str, FailureSignature] = {}

        # Load historical data
        self._load_historical_patterns()

    def _load_error_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Load known error patterns and their characteristics."""
        return {
            # Build/Compilation Errors
            "syntax_error": {
                "patterns": [
                    r"SyntaxError:",
                    r"ParseError:",
                    r"Unexpected token",
                    r"Missing semicolon",
                    r"Unclosed bracket"
                ],
                "category": "build",
                "fix_difficulty": "low",
                "typical_files": ["*.js", "*.ts", "*.py", "*.java"],
                "fix_strategy": "syntax_correction"
            },

            "dependency_missing": {
                "patterns": [
                    r"ModuleNotFoundError:",
                    r"Cannot find module",
                    r"ImportError:",
                    r"Package .* not found",
                    r"No such file or directory"
                ],
                "category": "build",
                "fix_difficulty": "low",
                "typical_files": ["package.json", "requirements.txt", "Cargo.toml"],
                "fix_strategy": "dependency_installation"
            },

            "version_conflict": {
                "patterns": [
                    r"version conflict",
                    r"incompatible versions",
                    r"peer dependency",
                    r"ERESOLVE unable to resolve dependency tree"
                ],
                "category": "build",
                "fix_difficulty": "medium",
                "typical_files": ["package.json", "yarn.lock", "package-lock.json"],
                "fix_strategy": "dependency_resolution"
            },

            # Test Failures
            "test_assertion_failure": {
                "patterns": [
                    r"AssertionError:",
                    r"Expected .* but got",
                    r"Test failed:",
                    r"assertion failed"
                ],
                "category": "testing",
                "fix_difficulty": "medium",
                "typical_files": ["test/**/*", "spec/**/*", "__tests__/**/*"],
                "fix_strategy": "test_logic_correction"
            },

            "test_timeout": {
                "patterns": [
                    r"Timeout of \d+ms exceeded",
                    r"Test timeout",
                    r"Operation timed out"
                ],
                "category": "testing",
                "fix_difficulty": "medium",
                "typical_files": ["test/**/*", "jest.config.js", "mocha.opts"],
                "fix_strategy": "timeout_adjustment"
            },

            # Security Issues
            "vulnerability_detected": {
                "patterns": [
                    r"High severity vulnerability",
                    r"Security alert",
                    r"CVE-\d{4}-\d{4,}",
                    r"Vulnerable dependency"
                ],
                "category": "security",
                "fix_difficulty": "high",
                "typical_files": ["package.json", "requirements.txt"],
                "fix_strategy": "security_patch"
            },

            # Quality Issues
            "code_complexity": {
                "patterns": [
                    r"Complexity of \d+ exceeds threshold",
                    r"Function too complex",
                    r"Cognitive complexity"
                ],
                "category": "quality",
                "fix_difficulty": "medium",
                "typical_files": ["src/**/*"],
                "fix_strategy": "refactoring"
            },

            # Infrastructure Issues
            "docker_build_failure": {
                "patterns": [
                    r"Docker build failed",
                    r"Unable to locate package",
                    r"COPY failed",
                    r"RUN command failed"
                ],
                "category": "deployment",
                "fix_difficulty": "medium",
                "typical_files": ["Dockerfile", "docker-compose.yml"],
                "fix_strategy": "docker_configuration"
            }
        }

    def _load_fix_strategies(self) -> Dict[str, Dict[str, Any]]:
        """Load fix strategies for different problem types."""
        return {
            "syntax_correction": {
                "description": "Fix syntax errors in source code",
                "tools": ["eslint --fix", "autopep8", "prettier"],
                "validation": "compile_check",
                "effort_hours": 1,
                "success_rate": 0.95
            },

            "dependency_installation": {
                "description": "Install missing dependencies",
                "tools": ["npm install", "pip install", "cargo build"],
                "validation": "dependency_check",
                "effort_hours": 1,
                "success_rate": 0.90
            },

            "dependency_resolution": {
                "description": "Resolve dependency version conflicts",
                "tools": ["npm audit fix", "pip-audit --fix", "yarn resolutions"],
                "validation": "conflict_resolution_check",
                "effort_hours": 3,
                "success_rate": 0.75
            },

            "test_logic_correction": {
                "description": "Fix test assertion logic",
                "tools": ["test_analyzer", "manual_review"],
                "validation": "test_execution",
                "effort_hours": 2,
                "success_rate": 0.8
            },

            "security_patch": {
                "description": "Apply security patches and updates",
                "tools": ["npm audit fix", "safety --fix", "bandit"],
                "validation": "security_scan",
                "effort_hours": 2,
                "success_rate": 0.85
            },

            "refactoring": {
                "description": "Refactor complex code to reduce complexity",
                "tools": ["complexity_analyzer", "refactoring_tools"],
                "validation": "complexity_check",
                "effort_hours": 8,
                "success_rate": 0.70
            },

            "docker_configuration": {
                "description": "Fix Docker configuration issues",
                "tools": ["docker build", "hadolint"],
                "validation": "docker_build_test",
                "effort_hours": 3,
                "success_rate": 0.80
            }
        }

    def _load_historical_patterns(self):
        """Load historical failure patterns for enhanced detection."""
        pattern_file = Path(self.config.historical_patterns_path)
        if not pattern_file.exists():
            logger.info("No historical patterns file found")
            return

        try:
            with open(pattern_file, 'r') as f:
                historical_data = json.load(f)

            for pattern_id, pattern_data in historical_data.get("patterns", {}).items():
                signature = FailureSignature(
                    category=pattern_data["category"],
                    step_name=pattern_data["step_name"],
                    error_pattern=pattern_data["error_pattern"],
                    frequency=pattern_data["frequency"],
                    confidence_score=pattern_data["confidence_score"],
                    affected_files=pattern_data.get("affected_files", []),
                    context_hash=pattern_data.get("context_hash", ""),
                    root_cause_hypothesis=pattern_data.get("root_cause_hypothesis", ""),
                    fix_difficulty=pattern_data.get("fix_difficulty", "medium")
                )
                self.historical_patterns[pattern_id] = signature

            logger.info(f"Loaded {len(self.historical_patterns)} historical patterns")
        except Exception as e:
            logger.warning(f"Could not load historical patterns: {e}")

    def get_pattern_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get error patterns by category."""
        patterns = []
        for pattern_name, pattern_info in self.error_patterns.items():
            if pattern_info.get("category") == category:
                patterns.append({
                    "name": pattern_name,
                    "info": pattern_info
                })
        return patterns

    def get_fix_strategy(self, strategy_name: str) -> Optional[Dict[str, Any]]:
        """Get fix strategy by name."""
        return self.fix_strategies.get(strategy_name)

    def update_pattern_confidence(self, pattern_id: str, success: bool):
        """Update pattern confidence based on fix success."""
        if pattern_id in self.historical_patterns:
            signature = self.historical_patterns[pattern_id]
            if success:
                signature.confidence_score = min(1.0, signature.confidence_score + 0.1)
            else:
                signature.confidence_score = max(0.1, signature.confidence_score - 0.0o5)

            if self.config.auto_save:
                self.save_patterns()

    def update_strategy_success_rate(self, strategy: str, success: bool):
        """Update success rate for fix strategies."""
        if strategy in self.fix_strategies:
            current_rate = self.fix_strategies[strategy]["success_rate"]
            # Update using exponential moving average
            new_rate = 0.9 * current_rate + 0.1 * (1.0 if success else 0.0)
            self.fix_strategies[strategy]["success_rate"] = new_rate

            if self.config.auto_save:
                self.save_strategies()

    def add_new_pattern(self, pattern_id: str, signature: FailureSignature):
        """Add new failure pattern to database."""
        self.historical_patterns[pattern_id] = signature

        if self.config.auto_save:
            self.save_patterns()

    def save_patterns(self) -> Path:
        """Save pattern database to file."""
        pattern_data = {
            "timestamp": "2025-9-24T15:12:0o3-0o4:0o0",
            "patterns": {}
        }

        for pattern_id, signature in self.historical_patterns.items():
            pattern_data["patterns"][pattern_id] = {
                "category": signature.category,
                "step_name": signature.step_name,
                "error_pattern": signature.error_pattern,
                "frequency": signature.frequency,
                "confidence_score": signature.confidence_score,
                "affected_files": signature.affected_files,
                "context_hash": signature.context_hash,
                "root_cause_hypothesis": signature.root_cause_hypothesis,
                "fix_difficulty": signature.fix_difficulty,
                "similar_patterns": signature.similar_patterns
            }

        pattern_file = Path(self.config.historical_patterns_path)
        pattern_file.parent.mkdir(parents=True, exist_ok=True)

        with open(pattern_file, 'w') as f:
            json.dump(pattern_data, f, indent=2)

        logger.info(f"Pattern database saved to {pattern_file}")
        return pattern_file

    def save_strategies(self) -> Path:
        """Save fix strategies to file."""
        strategy_file = Path(self.config.fix_strategies_path)
        strategy_file.parent.mkdir(parents=True, exist_ok=True)

        with open(strategy_file, 'w') as f:
            json.dump({
                "timestamp": "2025-9-24T15:12:0o3-0o4:0o0",
                "fix_strategies": self.fix_strategies
            }, f, indent=2)

        logger.info(f"Fix strategies saved to {strategy_file}")
        return strategy_file

    def get_statistics(self) -> Dict[str, Any]:
        """Get database statistics."""
        category_counts = {}
        for signature in self.historical_patterns.values():
            category = signature.category
            category_counts[category] = category_counts.get(category, 0) + 1

        return {
            "total_patterns": len(self.historical_patterns),
            "error_pattern_types": len(self.error_patterns),
            "fix_strategies": len(self.fix_strategies),
            "category_distribution": category_counts,
            "average_confidence": sum(s.confidence_score for s in self.historical_patterns.values()) / len(self.historical_patterns) if self.historical_patterns else 0
        }


<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-9-24T15:12:0o3-0o4:0o0 | coder@Sonnet-4 | Created pattern database management module | pattern_database.py | OK | Extracted from god object | 0.10 | a7c3f9d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: phase3-pattern-db-0o1
- inputs: ["failure_pattern_detector.py"]
- tools_used: ["Write"]
- versions: {"model":"Sonnet-4","prompt":"v1.0.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->