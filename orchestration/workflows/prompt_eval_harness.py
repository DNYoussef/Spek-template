"""
Prompt Evaluation Harness - Turnkey Workflow
Evaluates prompts against gold tasks with automatic rollback on degradation
"""

import json
import hashlib
import tempfile
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field, asdict
import logging

# Import v2.0 components
from src.version_log.v2.receipt_schema import Receipt, ModelInfo, CostInfo, Mutation
from src.version_log.v2.footer_middleware import FooterMiddleware
from src.version_log.v2.validation_framework import UnifiedValidator, ValidationStatus

logger = logging.getLogger(__name__)

@dataclass
class PromptVersion:
    """Prompt version metadata"""
    prompt_id: str
    version: int
    content: str
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    pass_rate: float = 0.0
    test_count: int = 0
    rollback_to: Optional[int] = None

@dataclass
class GoldTask:
    """Gold standard test case"""
    task_id: str
    inputs: Dict[str, Any]
    expected_output: Dict[str, Any]
    required_fields: List[str]
    max_tokens: int = 1000
    timeout_s: int = 30

@dataclass
class EvalResult:
    """Single evaluation result"""
    prompt_id: str
    prompt_version: int
    task_id: str
    inputs: Dict[str, Any]
    actual_output: Dict[str, Any]
    expected_output: Dict[str, Any]
    passed: bool
    failures: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    latency_s: float = 0.0
    tokens_used: int = 0
    cost_usd: float = 0.0

class PromptEvalHarness:
    """
    Production-ready prompt evaluation harness with:
    - Version management
    - Gold task testing
    - Automatic rollback on regression
    - Footer + receipt tracking
    """

    def __init__(
        self,
        registry_path: str = "registry/prompts/",
        results_path: str = ".claude/.artifacts/prompt_evals/",
        rollback_threshold: float = 0.85
    ):
        self.registry_path = Path(registry_path)
        self.results_path = Path(results_path)
        self.rollback_threshold = rollback_threshold

        # Ensure directories exist
        self.registry_path.mkdir(parents=True, exist_ok=True)
        self.results_path.mkdir(parents=True, exist_ok=True)

        # Initialize components
        self.middleware = FooterMiddleware()
        self.validator = UnifiedValidator()

        # Prompt registry
        self.prompts: Dict[str, List[PromptVersion]] = {}
        self.gold_tasks: List[GoldTask] = []
        self._load_registry()

    def _load_registry(self):
        """Load prompt registry and gold tasks"""
        # Load prompts
        prompt_file = self.registry_path / "prompts.json"
        if prompt_file.exists():
            with open(prompt_file, 'r') as f:
                data = json.load(f)
                for prompt_id, versions in data.items():
                    self.prompts[prompt_id] = [
                        PromptVersion(**v) for v in versions
                    ]

        # Load gold tasks
        tasks_file = self.registry_path / "gold_tasks.json"
        if tasks_file.exists():
            with open(tasks_file, 'r') as f:
                data = json.load(f)
                self.gold_tasks = [GoldTask(**t) for t in data]

    def _save_registry(self):
        """Persist prompt registry"""
        prompt_file = self.registry_path / "prompts.json"
        data = {}
        for prompt_id, versions in self.prompts.items():
            data[prompt_id] = [asdict(v) for v in versions]

        with open(prompt_file, 'w') as f:
            json.dump(data, f, indent=2)

    def register_prompt(
        self,
        prompt_id: str,
        content: str,
        auto_version: bool = True
    ) -> PromptVersion:
        """
        Register a new prompt or version

        Args:
            prompt_id: Unique prompt identifier
            content: Prompt content/template
            auto_version: Automatically increment version

        Returns:
            Created PromptVersion
        """
        if prompt_id not in self.prompts:
            self.prompts[prompt_id] = []

        # Determine version
        if auto_version and self.prompts[prompt_id]:
            version = max(p.version for p in self.prompts[prompt_id]) + 1
        else:
            version = 1

        # Create version
        prompt_version = PromptVersion(
            prompt_id=prompt_id,
            version=version,
            content=content
        )

        self.prompts[prompt_id].append(prompt_version)
        self._save_registry()

        logger.info(f"Registered {prompt_id} v{version}")
        return prompt_version

    def add_gold_task(
        self,
        task_id: str,
        inputs: Dict[str, Any],
        expected_output: Dict[str, Any],
        required_fields: List[str],
        max_tokens: int = 1000
    ):
        """Add a gold standard test case"""
        task = GoldTask(
            task_id=task_id,
            inputs=inputs,
            expected_output=expected_output,
            required_fields=required_fields,
            max_tokens=max_tokens
        )

        self.gold_tasks.append(task)

        # Save tasks
        tasks_file = self.registry_path / "gold_tasks.json"
        with open(tasks_file, 'w') as f:
            json.dump([asdict(t) for t in self.gold_tasks], f, indent=2)

    def _execute_prompt(
        self,
        prompt: PromptVersion,
        task: GoldTask
    ) -> Tuple[Dict[str, Any], float, int, float]:
        """
        Execute prompt against task (simulated for testing)

        In production, this would:
        1. Template the prompt with task.inputs
        2. Call the model API
        3. Parse and validate response

        Returns:
            (output, latency_s, tokens_used, cost_usd)
        """
        import time
        import random

        # Simulate execution
        start = time.time()

        # Simulate some processing
        time.sleep(random.uniform(0.1, 0.5))

        # Generate output (in production, this would be model response)
        output = {
            field: f"Generated {field} for {task.task_id}"
            for field in task.required_fields
        }

        # Add some randomness for testing
        if random.random() > 0.9:  # 10% failure rate
            output.pop(task.required_fields[0], None)

        latency = time.time() - start
        tokens = len(json.dumps(output)) * 2  # Rough estimate
        cost = tokens * 0.00001  # Dummy cost

        return output, latency, tokens, cost

    def evaluate_prompt(
        self,
        prompt_id: str,
        version: Optional[int] = None
    ) -> List[EvalResult]:
        """
        Evaluate a prompt version against all gold tasks

        Args:
            prompt_id: Prompt to evaluate
            version: Specific version (latest if None)

        Returns:
            List of evaluation results
        """
        if prompt_id not in self.prompts:
            raise ValueError(f"Unknown prompt: {prompt_id}")

        # Get prompt version
        versions = self.prompts[prompt_id]
        if version is None:
            prompt = max(versions, key=lambda p: p.version)
        else:
            prompt = next((p for p in versions if p.version == version), None)
            if not prompt:
                raise ValueError(f"Version {version} not found for {prompt_id}")

        results = []

        for task in self.gold_tasks:
            # Execute prompt
            output, latency, tokens, cost = self._execute_prompt(prompt, task)

            # Check results
            failures = []

            # Check required fields
            for field in task.required_fields:
                if field not in output:
                    failures.append(f"Missing required field: {field}")

            # Check expected values (if exact match required)
            for key, expected_value in task.expected_output.items():
                if key in output and output[key] != expected_value:
                    failures.append(f"Mismatch in {key}: got {output[key]}, expected {expected_value}")

            # Check for placeholders
            output_str = json.dumps(output)
            if "TK CONFIRM" in output_str:
                failures.append("Contains placeholder 'TK CONFIRM'")

            # Create result
            result = EvalResult(
                prompt_id=prompt.prompt_id,
                prompt_version=prompt.version,
                task_id=task.task_id,
                inputs=task.inputs,
                actual_output=output,
                expected_output=task.expected_output,
                passed=len(failures) == 0,
                failures=failures,
                latency_s=latency,
                tokens_used=tokens,
                cost_usd=cost
            )

            results.append(result)

        return results

    def run_harness(
        self,
        prompt_id: str,
        auto_rollback: bool = True
    ) -> Dict[str, Any]:
        """
        Run full evaluation harness with rollback logic

        Args:
            prompt_id: Prompt to evaluate
            auto_rollback: Automatically rollback on regression

        Returns:
            Evaluation summary with actions taken
        """
        logger.info(f"Running harness for {prompt_id}")

        # Get current version
        versions = self.prompts[prompt_id]
        current = max(versions, key=lambda p: p.version)

        # Run evaluation
        results = self.evaluate_prompt(prompt_id)

        # Calculate metrics
        passed = sum(1 for r in results if r.passed)
        total = len(results)
        pass_rate = passed / total if total > 0 else 0.0

        # Update prompt metadata
        current.pass_rate = pass_rate
        current.test_count = total

        # Check for regression
        action = "evaluated"
        rollback_version = None

        if auto_rollback and current.version > 1:
            # Get previous version's pass rate
            prev = versions[-2] if len(versions) > 1 else None
            if prev and prev.pass_rate > pass_rate:
                # Regression detected
                degradation = prev.pass_rate - pass_rate

                if pass_rate < self.rollback_threshold:
                    # Rollback needed
                    action = "rollback"
                    rollback_version = prev.version
                    current.rollback_to = prev.version
                    logger.warning(
                        f"Rollback {prompt_id} from v{current.version} to v{prev.version} "
                        f"(pass_rate {pass_rate:.2%} < {self.rollback_threshold:.2%})"
                    )

        # Save results to file with footer
        self._save_results(prompt_id, results, action, rollback_version)

        # Save registry
        self._save_registry()

        return {
            "prompt_id": prompt_id,
            "version": current.version,
            "pass_rate": pass_rate,
            "passed": passed,
            "total": total,
            "action": action,
            "rollback_to": rollback_version,
            "results": [asdict(r) for r in results[:3]]  # First 3 for summary
        }

    def _save_results(
        self,
        prompt_id: str,
        results: List[EvalResult],
        action: str,
        rollback_version: Optional[int]
    ):
        """Save evaluation results with footer"""
        # Create results file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"eval_{prompt_id}_{timestamp}.md"
        filepath = self.results_path / filename

        # Format content
        passed = sum(1 for r in results if r.passed)
        total = len(results)
        pass_rate = passed / total if total > 0 else 0.0

        content = f"""# Prompt Evaluation Report

**Prompt ID**: {prompt_id}
**Timestamp**: {datetime.now().isoformat()}
**Pass Rate**: {pass_rate:.2%} ({passed}/{total})
**Action**: {action}
"""

        if rollback_version:
            content += f"**Rolled Back To**: v{rollback_version}\n"

        content += """
## Results

| Task ID | Passed | Failures | Latency (s) | Cost ($) |
|---------|--------|----------|-------------|----------|
"""

        for r in results:
            failures = ", ".join(r.failures[:2]) if r.failures else "--"
            content += f"| {r.task_id} | {'[PASS]' if r.passed else '[FAIL]'} | {failures} | {r.latency_s:.2f} | {r.cost_usd:.4f} |\n"

        # Create receipt
        receipt = Receipt(
            status="OK" if pass_rate >= self.rollback_threshold else "PARTIAL",
            reason_if_blocked="Pass rate below threshold" if pass_rate < 0.5 else None,
            models=[ModelInfo(name="evaluator", version="harness-v1")],
            tools_used=["prompt_eval", "validator"],
            cost=CostInfo(
                usd=sum(r.cost_usd for r in results),
                prompt_tokens=sum(r.tokens_used for r in results)
            ),
            mutations=[
                Mutation(
                    type="PromptEval",
                    id=f"eval_{prompt_id}",
                    version=len(results)
                )
            ]
        )

        # Add footer
        updated = self.middleware.update_footer(
            file_text=content,
            agent_meta="prompt-eval-harness@v1",
            change_summary=f"Evaluated {prompt_id}: {pass_rate:.1%} pass rate",
            artifacts_changed=[f"eval_{prompt_id}"],
            status=receipt.status,
            cost_usd=receipt.cost.usd if receipt.cost else 0,
            receipt=receipt,
            file_path=str(filepath)
        )

        # Write file
        with open(filepath, 'w') as f:
            f.write(updated)

        logger.info(f"Saved results to {filepath}")

# System prompt for harness usage
HARNESS_PROMPT = """
Run registered prompts (prompt_id/version) against gold tasks.
Apply validation rules from PromptEval.json schema.
If pass_rate drops below threshold vs. last snapshot:
  - Rollback prompt version
  - Restore last known good state
  - Alert on degradation

Rules:
- Each result must validate against expected_output
- Missing required fields -> failure
- Presence of 'TK CONFIRM' -> failure
- Latency > timeout -> warning
- Pass rate < 85% -> auto-rollback

Append Version & Run Log footer + Receipt to all outputs.
Track prompt versions with semantic versioning.
Maintain gold task registry for regression testing.
"""

def example_usage():
    """Example usage of the prompt evaluation harness"""

    # Initialize harness
    harness = PromptEvalHarness()

    # Register a prompt
    prompt = harness.register_prompt(
        prompt_id="prd_generator",
        content="""Transform meeting notes into PRD records.

Requirements:
- Extract goal (20-400 chars)
- Extract problem (20-600 chars)
- Generate acceptance tests (min 1)
- Set owner and status

Input: {meeting_notes}
Output: JSON matching PRD schema"""
    )

    # Add gold tasks
    harness.add_gold_task(
        task_id="test_basic_prd",
        inputs={"meeting_notes": "Discussed need for better search. Users complain about relevance."},
        expected_output={"status": "draft"},
        required_fields=["name", "goal", "problem", "acceptance_tests", "owner", "status"],
        max_tokens=2000
    )

    harness.add_gold_task(
        task_id="test_complex_prd",
        inputs={"meeting_notes": "Multiple features discussed: auth, payments, notifications..."},
        expected_output={"status": "needs_fix"},
        required_fields=["name", "goal", "problem", "acceptance_tests", "risks"],
        max_tokens=3000
    )

    # Run harness
    result = harness.run_harness("prd_generator", auto_rollback=True)

    print(f"Evaluation complete: {result['pass_rate']:.1%} pass rate")
    print(f"Action taken: {result['action']}")

    return result

if __name__ == "__main__":
    example_usage()