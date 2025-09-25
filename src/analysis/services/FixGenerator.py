"""
FixGenerator - Extracted from FailurePatternDetector
Generates fix strategies for identified failures
Part of god object decomposition (Day 3-5)
"""

from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
import json
import logging

from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

@dataclass
class FixStrategy:
    """Represents a fix strategy for a failure."""
    strategy_name: str
    strategy_type: str
    steps: List[str]
    estimated_hours: int
    success_probability: float
    required_expertise: str
    verification_method: str
    rollback_plan: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)

class FixGenerator:
    """
    Generates fix strategies for failures.

    Extracted from FailurePatternDetector god object (1, 281 LOC -> ~200 LOC component).
    Handles:
    - Fix strategy generation
    - Multi-step fix planning
    - Verification method selection
    - Rollback planning
    """

    def __init__(self):
        """Initialize the fix generator."""
        self.fix_templates: Dict[str, FixStrategy] = {}
        self.generated_fixes: List[Dict[str, Any]] = []

        # Load fix templates
        self._load_fix_templates()

    def _load_fix_templates(self) -> None:
        """Load common fix strategy templates."""
        templates = {
            "dependency_update": FixStrategy(
                strategy_name="dependency_update",
                strategy_type="automated",
                steps=[
                    "Run npm outdated to check versions",
                    "Update package.json with compatible versions",
                    "Run npm install",
                    "Run npm dedupe to resolve duplicates",
                    "Run tests to verify"
                ],
                estimated_hours=1,
                success_probability=0.85,
                required_expertise="junior",
                verification_method="test_suite",
                rollback_plan=["Restore package-lock.json", "Run npm ci"]
            ),
            "environment_fix": FixStrategy(
                strategy_name="environment_fix",
                strategy_type="configuration",
                steps=[
                    "Compare local and CI environment variables",
                    "Update .env files",
                    "Update CI configuration",
                    "Test in both environments"
                ],
                estimated_hours=2,
                success_probability=0.75,
                required_expertise="intermediate",
                verification_method="environment_test"
            ),
            "async_fix": FixStrategy(
                strategy_name="async_fix",
                strategy_type="code_change",
                steps=[
                    "Identify missing await statements",
                    "Add proper async/await",
                    "Handle promise rejections",
                    "Add timeout configurations",
                    "Test async flows"
                ],
                estimated_hours=3,
                success_probability=0.70,
                required_expertise="intermediate",
                verification_method="integration_test"
            ),
            "memory_optimization": FixStrategy(
                strategy_name="memory_optimization",
                strategy_type="performance",
                steps=[
                    "Profile memory usage",
                    "Identify memory leaks",
                    "Optimize data structures",
                    "Add garbage collection hints",
                    "Increase heap limits if needed"
                ],
                estimated_hours=4,
                success_probability=0.65,
                required_expertise="senior",
                verification_method="performance_test"
            ),
            "test_isolation": FixStrategy(
                strategy_name="test_isolation",
                strategy_type="test_fix",
                steps=[
                    "Identify test dependencies",
                    "Add proper setup/teardown",
                    "Mock external dependencies",
                    "Ensure test order independence",
                    "Add retry mechanism for flaky tests"
                ],
                estimated_hours=2,
                success_probability=0.80,
                required_expertise="intermediate",
                verification_method="test_suite"
            )
        }

        self.fix_templates = templates

    def generate_strategy(self,
                        cause_type: str,
                        evidence: List[str]) -> Optional[FixStrategy]:
        """Generate a fix strategy based on root cause."""
        # Map cause types to fix strategies
        cause_to_strategy = {
            "dependency_conflict": "dependency_update",
            "environment_mismatch": "environment_fix",
            "race_condition": "async_fix",
            "resource_exhaustion": "memory_optimization",
            "test_flakiness": "test_isolation"
        }

        strategy_name = cause_to_strategy.get(cause_type)
        if strategy_name and strategy_name in self.fix_templates:
            strategy = self.fix_templates[strategy_name]

            # Adjust strategy based on evidence
            strategy = self._customize_strategy(strategy, evidence)

            return strategy

        return None

    def _customize_strategy(self,
                            base_strategy: FixStrategy,
                            evidence: List[str]) -> FixStrategy:
        """Customize strategy based on specific evidence."""
        # Create a copy
        import copy
        strategy = copy.deepcopy(base_strategy)

        evidence_text = " ".join(evidence).lower()

        # Customize based on evidence
        if "timeout" in evidence_text:
            strategy.steps.append("Increase timeout values")
            strategy.estimated_hours += 1

        if "permission" in evidence_text:
            strategy.steps.append("Check file/directory permissions")
            strategy.required_expertise = "senior"

        if "large" in evidence_text or "scale" in evidence_text:
            strategy.steps.append("Consider pagination or chunking")
            strategy.estimated_hours += 2

        return strategy

    def generate_comprehensive_fix(self,
                                    cause_type: str,
                                    affected_components: List[str],
                                    context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate a comprehensive fix plan."""
        # Get primary strategy
        primary_strategy = self.generate_strategy(cause_type, [])

        if not primary_strategy:
            primary_strategy = self._create_manual_strategy(cause_type)

        # Generate fallback strategies
        fallback_strategies = self._generate_fallback_strategies(cause_type)

        # Build comprehensive fix plan
        fix_plan = {
            "primary_strategy": primary_strategy.strategy_name,
            "strategy_type": primary_strategy.strategy_type,
            "steps": primary_strategy.steps,
            "estimated_hours": primary_strategy.estimated_hours,
            "success_probability": primary_strategy.success_probability,
            "required_expertise": primary_strategy.required_expertise,
            "verification_method": primary_strategy.verification_method,
            "rollback_plan": primary_strategy.rollback_plan,
            "affected_components": affected_components,
            "fallback_strategies": fallback_strategies,
            "parallel_execution": self._can_parallelize(primary_strategy),
            "automation_level": self._calculate_automation_level(primary_strategy)
        }

        # Store generated fix
        self.generated_fixes.append({
            "timestamp": datetime.now().isoformat(),
            "cause_type": cause_type,
            "fix_plan": fix_plan
        })

        return fix_plan

    def _create_manual_strategy(self, cause_type: str) -> FixStrategy:
        """Create a manual fix strategy for unknown causes."""
        return FixStrategy(
            strategy_name="manual_investigation",
            strategy_type="manual",
            steps=[
                f"Investigate {cause_type} issue",
                "Review error logs and stack traces",
                "Check recent code changes",
                "Consult team members",
                "Document findings",
                "Implement fix",
                "Test thoroughly"
            ],
            estimated_hours=8,
            success_probability=0.50,
            required_expertise="senior",
            verification_method="manual_test",
            rollback_plan=["Revert changes if needed"]
        )

    def _generate_fallback_strategies(self, cause_type: str) -> List[str]:
        """Generate fallback strategies if primary fails."""
        fallbacks = []

        # Common fallbacks
        fallbacks.append("rollback_to_previous_version")
        fallbacks.append("disable_failing_feature")

        # Specific fallbacks
        if "dependency" in cause_type:
            fallbacks.append("pin_all_dependencies")
            fallbacks.append("use_alternative_package")

        if "performance" in cause_type or "resource" in cause_type:
            fallbacks.append("scale_infrastructure")
            fallbacks.append("implement_caching")

        if "test" in cause_type:
            fallbacks.append("skip_flaky_tests")
            fallbacks.append("increase_test_timeout")

        return fallbacks

    def _can_parallelize(self, strategy: FixStrategy) -> bool:
        """Determine if fix steps can be parallelized."""
        # Automated and test fixes can often be parallelized
        return strategy.strategy_type in ["automated", "test_fix"]

    def _calculate_automation_level(self, strategy: FixStrategy) -> str:
        """Calculate automation level of the fix."""
        if strategy.strategy_type == "automated":
            return "full"
        elif strategy.strategy_type in ["configuration", "test_fix"]:
            return "partial"
        else:
            return "manual"

    def validate_fix(self,
                    fix_plan: Dict[str, Any],
                    test_results: Dict[str, Any]) -> Dict[str, Any]:
        """Validate that a fix resolved the issue."""
        validation_result = {
            "validated": False,
            "validation_method": fix_plan.get("verification_method", "unknown"),
            "test_results": test_results,
            "confidence": 0.0
        }

        # Check test results
        if test_results.get("all_passed", False):
            validation_result["validated"] = True
            validation_result["confidence"] = 0.95
        elif test_results.get("improvement_rate", 0) > 0.5:
            validation_result["validated"] = True
            validation_result["confidence"] = 0.70
        else:
            validation_result["validated"] = False
            validation_result["confidence"] = 0.30

        return validation_result

    def get_fix_history(self) -> List[Dict[str, Any]]:
        """Get history of generated fixes."""
        return self.generated_fixes

    def get_success_rate(self) -> float:
        """Calculate overall success rate of fixes."""
        if not self.generated_fixes:
            return 0.0

        # This would need actual validation data in production
        total_probability = sum(
            fix["fix_plan"].get("success_probability", 0.5)
            for fix in self.generated_fixes
        )

        return total_probability / len(self.generated_fixes)

    def export_templates(self) -> Dict[str, Any]:
        """Export fix templates for persistence."""
        return {
            template_name: {
                "strategy_type": template.strategy_type,
                "steps": template.steps,
                "estimated_hours": template.estimated_hours,
                "success_probability": template.success_probability,
                "required_expertise": template.required_expertise
            }
            for template_name, template in self.fix_templates.items()
        }