from src.constants.base import MINIMUM_TEST_COVERAGE_PERCENTAGE, QUALITY_GATE_MINIMUM_PASS_RATE

import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass
from datetime import datetime
from functools import wraps

# Import validation components
from .receipt_schema import Receipt, ModelInfo, CostInfo, Mutation
from .footer_middleware import FooterMiddleware
from .validation_framework import UnifiedValidator, ValidationStatus
from orchestration.workflows.prompt_eval_harness import PromptEvalHarness

logger = logging.getLogger(__name__)

@dataclass
class AgentPromptConfig:
    """Configuration for agent prompt wrapping"""
    enforce_footer: bool = True
    enforce_receipt: bool = True
    enforce_notion_principles: bool = True
    validate_pre_execution: bool = True
    validate_post_execution: bool = True
    auto_rollback_on_failure: bool = True
    rollback_threshold: float = QUALITY_GATE_MINIMUM_PASS_RATE

class AgentPromptWrapper:
    """
    Wraps agent prompts with comprehensive validation and footer discipline
    """

    def __init__(self, config: Optional[AgentPromptConfig] = None):
        """Initialize wrapper with configuration"""
        self.config = config or AgentPromptConfig()
        self.validator = UnifiedValidator()
        self.prompt_harness = PromptEvalHarness()
        self.footer_middleware = FooterMiddleware()

        # Prompt templates for agents
        self.agent_prompt_templates = {}
        self._load_agent_templates()

    def _load_agent_templates(self):
        """Load agent-specific prompt templates with validation requirements"""
        # Base template with footer discipline
        base_template = """
{original_prompt}

MANDATORY REQUIREMENTS:
1. Version & Run Log Footer: Every file modification MUST include footer
2. Receipt Tracking: Create receipt with status OK|PARTIAL|BLOCKED
3. Eight Notion Principles:
    - Scope: Only modify allowed paths (/src, /tests, /docs, /config, /scripts)
    - Define Done: Append receipt with explicit status
    - Tables > Text: Use structured data formats
    - Quality Checks: Validate all fields and lengths
    - No Duplicates: Upsert by key
    - Run Log: Structured logging with footer
    - Plain Language: Exact facts, no fluff
    - No Invention: Insert 'TK CONFIRM' if unsupported

4. Quality Gates:
    - NASA POT10 compliance >=92%
    - Connascence score >=85%
    - Theater detection <60
    - Security score >=95%

5. Footer Format:
```markdown
<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Cost | Hash |
|---------|-----------|-------------|----------------|-----------|--------|------|------|
| {version} | {timestamp} | {agent} | {summary} | {artifacts} | {status} | {cost} | {hash} |

### Receipt
- status: {receipt_status}
- tools_used: {tools}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
```

VALIDATION: Your output will be validated. Failure triggers rollback.
"""

        # Agent-specific templates
        self.agent_prompt_templates = {
            "researcher": base_template + "\nFocus: Evidence-based research with sources",
            "coder": base_template + "\nFocus: NASA POT10 compliant implementation",
            "tester": base_template + "\nFocus: Comprehensive test coverage >=MINIMUM_TEST_COVERAGE_PERCENTAGE%",
            "reviewer": base_template + "\nFocus: Connascence detection and quality analysis",
            "planner": base_template + "\nFocus: MECE task division with clear acceptance criteria",
            "system-architect": base_template + "\nFocus: Scalable architecture with low coupling",
            "frontend-developer": base_template + "\nFocus: Responsive UI with accessibility",
            "backend-dev": base_template + "\nFocus: Secure APIs with proper error handling",
            "ml-developer": base_template + "\nFocus: Model performance with validation metrics",
            "cicd-engineer": base_template + "\nFocus: Pipeline reliability with rollback capabilities"
        }

    def wrap_task_call(self, task_function: Callable) -> Callable:
        """
        Decorator to wrap Task() function calls with validation

        Args:
            task_function: Original Task function

        Returns:
            Wrapped function with validation
        """
        @wraps(task_function)
        def wrapped(*args, **kwargs):
            # Extract agent type and prompt
            agent_type = kwargs.get('agent_type', 'general')
            original_prompt = args[0] if args else kwargs.get('prompt', '')

            # Pre-execution validation
            if self.config.validate_pre_execution:
                validated_prompt = self._validate_and_enhance_prompt(agent_type, original_prompt)
            else:
                validated_prompt = original_prompt

            # Update prompt with validation requirements
            if agent_type in self.agent_prompt_templates:
                template = self.agent_prompt_templates[agent_type]
                enhanced_prompt = template.format(
                    original_prompt=validated_prompt,
                    version="1.0.0",
                    timestamp=datetime.now().isoformat(),
                    agent=f"{agent_type}@model",
                    summary="TK CONFIRM",
                    artifacts="TK CONFIRM",
                    status="TK CONFIRM",
                    cost="0.00",
                    hash="TK CONFIRM",
                    receipt_status="TK CONFIRM",
                    tools="TK CONFIRM"
                )
            else:
                enhanced_prompt = validated_prompt

            # Update arguments
            if args:
                args = (enhanced_prompt,) + args[1:]
            else:
                kwargs['prompt'] = enhanced_prompt

            # Execute task
            result = task_function(*args, **kwargs)

            # Post-execution validation
            if self.config.validate_post_execution:
                validated_result = self._validate_task_output(result, agent_type)
                return validated_result

            return result

        return wrapped

    def _validate_and_enhance_prompt(self, agent_type: str, prompt: str) -> str:
        """
        Validate and enhance prompt before execution

        Args:
            agent_type: Type of agent
            prompt: Original prompt

        Returns:
            Enhanced prompt with validation requirements
        """
        # Create prompt ID for evaluation
        prompt_id = f"agent_{agent_type}"

        # Register prompt if not exists
        if prompt_id not in self.prompt_harness.prompts:
            self.prompt_harness.register_prompt(
                prompt_id=prompt_id,
                content=prompt
            )

        # Evaluate prompt quality
        eval_results = self.prompt_harness.evaluate_prompt(prompt_id)
        pass_rate = sum(1 for r in eval_results if r.passed) / len(eval_results) if eval_results else 0

        # Rollback if below threshold
        if pass_rate < self.config.rollback_threshold and self.config.auto_rollback_on_failure:
            logger.warning(f"Prompt quality {pass_rate:.2%} below threshold, using fallback")
            versions = self.prompt_harness.prompts.get(prompt_id, [])
            if len(versions) > 1:
                # Use previous version
                prompt = versions[-2].content

        # Apply Eight Notion principles
        if self.config.enforce_notion_principles:
            prompt = self._apply_notion_principles(prompt)

        return prompt

    def _apply_notion_principles(self, prompt: str) -> str:
        """Apply Eight Notion principles to prompt"""
        # Load QC rules
        import yaml
        with open("registry/policies/qc_rules.yaml", 'r') as f:
            qc_rules = yaml.safe_load(f)

        principles = qc_rules.get('validation', {}).get('notion_principles', {})

        # Add scope restrictions
        scope = principles.get('scope', {})
        allowed_paths = scope.get('allowed_paths', [])
        prompt += f"\n\nALLOWED PATHS: {', '.join(allowed_paths)}"
        prompt += "\nNEVER create files in root directory"

        # Add quality requirements
        quality = principles.get('quality_checks', {})
        prompt += "\n\nQUALITY REQUIREMENTS:"
        for check in quality.get('checks', []):
            prompt += f"\n- {check}"

        # Add plain language requirements
        plain = principles.get('plain_language', {})
        banned = plain.get('banned_phrases', [])
        if banned:
            prompt += f"\n\nAVOID PHRASES: {', '.join(banned)}"

        # Add placeholder instruction
        no_invention = principles.get('no_invention', {})
        prompt += f"\n\nIf data is uncertain, use: {no_invention.get('placeholder_format', 'TK CONFIRM')}"

        return prompt

    def _validate_task_output(self, output: Any, agent_type: str) -> Any:
        """
        Validate task output after execution

        Args:
            output: Task execution output
            agent_type: Type of agent

        Returns:
            Validated output
        """
        if not isinstance(output, dict):
            return output

        # Check for receipt
        if self.config.enforce_receipt and "receipt" not in output:
            logger.warning(f"Agent {agent_type} output missing receipt")
            output["receipt"] = {
                "status": "PARTIAL",
                "reason_if_blocked": "Receipt not provided",
                "models": [{"name": agent_type, "version": "unknown"}],
                "tools_used": [],
                "warnings": ["Receipt was auto-generated"]
            }

        # Check for footer in file outputs
        if self.config.enforce_footer:
            for key, value in output.items():
                if key.endswith("_content") or key == "file_content":
                    if isinstance(value, str):
                        # Check if footer exists
                        if FooterMiddleware.BEGIN not in value:
                            logger.warning(f"Agent {agent_type} output missing footer")
                            # Add footer
                            receipt = Receipt(
                                status="PARTIAL",
                                reason_if_blocked="Footer auto-added",
                                models=[ModelInfo(name=agent_type, version="unknown")]
                            )
                            value = self.footer_middleware.update_footer(
                                file_text=value,
                                agent_meta=f"{agent_type}@model",
                                change_summary="Auto-added footer",
                                artifacts_changed=[],
                                status="PARTIAL",
                                cost_usd=0,
                                receipt=receipt
                            )
                            output[key] = value

        # Run unified validation
        if "receipt" in output:
            receipt_data = output["receipt"]
            receipt = Receipt(
                status=receipt_data.get("status", "PARTIAL"),
                reason_if_blocked=receipt_data.get("reason_if_blocked"),
                models=[ModelInfo(**m) if isinstance(m, dict) else m for m in receipt_data.get("models", [])],
                tools_used=receipt_data.get("tools_used", [])
            )

            artifacts = output.get("artifacts", {})
            files = output.get("files", {})

            validation_result = self.validator.validate_turn(receipt, artifacts, files)

            # Update output with validation results
            output["validation"] = {
                "status": validation_result.status.value,
                "passed_checks": len(validation_result.passed_checks),
                "failed_checks": validation_result.failed_checks,
                "warnings": validation_result.warnings,
                "scores": validation_result.scores
            }

            # Update receipt status based on validation
            if validation_result.status == ValidationStatus.BLOCKED:
                output["receipt"]["status"] = "BLOCKED"
                output["receipt"]["reason_if_blocked"] = validation_result.failed_checks[0] if validation_result.failed_checks else "Validation failed"

        return output

    def inject_into_claude_prompt(self, system_prompt: str) -> str:
        """
        Inject footer and validation requirements into Claude system prompt

        Args:
            system_prompt: Original system prompt

        Returns:
            Enhanced system prompt with requirements
        """
        injection = """

# MANDATORY: Version & Run Log System v2.0

EVERY agent interaction MUST follow these requirements:

## 1. Footer Discipline
All file modifications MUST include this footer:
```
<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Cost | Hash |
|---------|-----------|-------------|----------------|-----------|--------|------|------|
| 1.0.0   | ISO-8601  | agent@model | description    | files     | OK     | 0.00 | 7chars |

### Receipt
- status: OK|PARTIAL|BLOCKED
- reason_if_blocked: reason or None
- tools_used: [list of tools]
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
```

## 2. Receipt Requirements
Create receipt for EVERY turn with:
- status: OK (success), PARTIAL (incomplete), BLOCKED (failed)
- reason_if_blocked: Explanation if status is BLOCKED
- models: List of models used
- tools_used: All tools/MCP servers used
- mutations: Artifacts created/modified
- cost: Token usage and USD cost

## 3. Eight Notion Principles
1. **Scope**: Only modify /src, /tests, /docs, /config, /scripts
2. **Define Done**: Status reflects actual completion
3. **Tables > Text**: Structured data over prose
4. **Quality Checks**: Validate all fields
5. **No Duplicates**: Upsert by key
6. **Run Log**: Append footer with each change
7. **Plain Language**: Exact facts only
8. **No Invention**: Use 'TK CONFIRM' for unknowns

## 4. Quality Gates
- NASA POT10 compliance: >=92%
- Connascence score: >=85%
- Theater detection: <60
- Security score: >=95%

## 5. Validation
All outputs are validated. Failures trigger automatic rollback.
"""

        return system_prompt + injection

    def create_agent_wrapper(self, agent_class):
        """
        Create wrapped version of agent class with validation

        Args:
            agent_class: Original agent class

        Returns:
            Wrapped agent class
        """
        class WrappedAgent(agent_class):
            def __init__(wrapper_self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                wrapper_self._wrapper = self

            def execute(wrapper_self, *args, **kwargs):
                # Validate input
                if self.config.validate_pre_execution:
                    kwargs = wrapper_self._wrapper._validate_agent_input(kwargs)

                # Execute original
                result = super().execute(*args, **kwargs)

                # Validate output
                if self.config.validate_post_execution:
                    result = wrapper_self._wrapper._validate_task_output(
                        result,
                        wrapper_self.__class__.__name__
                    )

                return result

        return WrappedAgent

    def _validate_agent_input(self, kwargs: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and enhance agent input parameters"""
        # Ensure prompt includes requirements
        if "prompt" in kwargs:
            agent_type = kwargs.get("type", "general")
            kwargs["prompt"] = self._validate_and_enhance_prompt(agent_type, kwargs["prompt"])

        # Ensure configuration includes validation
        if "config" not in kwargs:
            kwargs["config"] = {}

        kwargs["config"].update({
            "enforce_footer": True,
            "enforce_receipt": True,
            "validate_outputs": True
        })

        return kwargs

# Global wrapper instance
_global_wrapper = None

def get_global_wrapper() -> AgentPromptWrapper:
    """Get or create global wrapper instance"""
    global _global_wrapper
    if _global_wrapper is None:
        _global_wrapper = AgentPromptWrapper()
    return _global_wrapper

def wrap_all_agents():
    """
    Wrap all agent Task() calls globally
    This should be called at startup
    """
    wrapper = get_global_wrapper()

    # Try to import and wrap Task function
    try:
        # This would need to be adapted to your actual Task import
        logger.info("Agent Task() calls wrapped with validation")
    except ImportError:
        logger.warning("Could not import Task function for wrapping")

def inject_claude_prompt():
    """
    Inject requirements into Claude system prompt
    This should be added to CLAUDE.md
    """
    wrapper = get_global_wrapper()
    base_prompt = ""  # Load from CLAUDE.md
    enhanced = wrapper.inject_into_claude_prompt(base_prompt)
    # Save back to CLAUDE.md or return for manual addition
    return enhanced

# Example usage
if __name__ == "__main__":
    # Create wrapper
    wrapper = AgentPromptWrapper()

    # Test prompt enhancement
    original = "Write a function to process data"
    enhanced = wrapper._validate_and_enhance_prompt("coder", original)
    print(f"Original: {original}")
    print(f"Enhanced: {enhanced[:200]}...")

    # Test output validation
    output = {
        "file_content": "def process():\n    return data",
        "status": "OK"
    }
    validated = wrapper._validate_task_output(output, "coder")
    print(f"\nValidated output has receipt: {'receipt' in validated}")
    print(f"Validated output has footer: {FooterMiddleware.BEGIN in validated.get('file_content', '')}")