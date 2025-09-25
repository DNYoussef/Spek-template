"""
Swarm Communication Interceptor
Intercepts and validates all Queen-Princess-Drone communications
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime

# Import validation components
from src.version_log.v2.receipt_schema import Receipt, ModelInfo, CostInfo, Mutation
from src.version_log.v2.footer_middleware import FooterMiddleware
from src.version_log.v2.validation_framework import UnifiedValidator, ValidationStatus
from orchestration.workflows.prompt_eval_harness import PromptEvalHarness

logger = logging.getLogger(__name__)

@dataclass
class SwarmMessage:
    """Message between swarm entities"""
    sender: str  # e.g., "Queen", "Princess:Development", "Drone:coder-1"
    receiver: str
    message_type: str  # "order", "report", "validation", "error"
    content: Dict[str, Any]
    prompt: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    message_id: str = field(default_factory=lambda: f"msg_{datetime.now().strftime('%Y%m%d%H%M%S')}")

@dataclass
class ValidationReport:
    """Validation results for swarm message"""
    message_id: str
    passed: bool
    pass_rate: float
    validation_status: ValidationStatus
    theater_score: float
    failures: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    rollback_version: Optional[str] = None

class SwarmCommunicationInterceptor:
    """
    Intercepts and validates all swarm communications with bidirectional validation
    """

    def __init__(self):
        """Initialize interceptor with validation components"""
        self.validator = UnifiedValidator()
        self.prompt_harness = PromptEvalHarness()
        self.footer_middleware = FooterMiddleware()

        # Message history for tracing
        self.message_history: List[SwarmMessage] = []
        self.validation_reports: Dict[str, ValidationReport] = {}

        # Register default prompts for swarm entities
        self._register_default_prompts()

    def _register_default_prompts(self):
        """Register default prompts for Queen, Princess, and Drone communications"""
        # Queen to Princess prompt template
        self.prompt_harness.register_prompt(
            prompt_id="queen_to_princess",
            content="""As Queen Seraphina, I command you Princess {princess_domain} to:
{order_content}

Requirements:
- Complete with NASA POT10 compliance >=92%
- Theater detection score <60
- All drones must validate outputs
- Report back with structured evidence

Status tracking: Use receipt with status OK|PARTIAL|BLOCKED"""
        )

        # Princess to Drone prompt template
        self.prompt_harness.register_prompt(
            prompt_id="princess_to_drone",
            content="""Princess {princess_domain} assigns Drone {drone_id} task:
{task_content}

Validation requirements:
- Follow Eight Notion principles
- Append Version & Run Log footer
- Create receipt with all tool usage
- Status must reflect actual completion

No theater. Real implementation only."""
        )

        # Drone to Princess report template
        self.prompt_harness.register_prompt(
            prompt_id="drone_to_princess",
            content="""Drone {drone_id} reports to Princess {princess_domain}:
{report_content}

Evidence:
- Files modified: {files}
- Tests passed: {tests}
- Quality scores: {scores}
- Receipt status: {status}"""
        )

        # Princess to Queen report template
        self.prompt_harness.register_prompt(
            prompt_id="princess_to_queen",
            content="""Princess {princess_domain} reports to Queen Seraphina:
{report_content}

Summary:
- Drones deployed: {drone_count}
- Success rate: {success_rate}%
- Theater violations: {theater_count}
- Overall status: {overall_status}"""
        )

    def intercept_queen_to_princess(
        self,
        princess_domain: str,
        order: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], ValidationReport]:
        """
        Intercept and validate Queen's orders to Princess

        Args:
            princess_domain: Target princess domain (Development, Quality, etc.)
            order: Order content from Queen

        Returns:
            Tuple of (validated_order, validation_report)
        """
        logger.info(f"Intercepting Queen -> Princess:{princess_domain}")

        # Create message
        message = SwarmMessage(
            sender="Queen",
            receiver=f"Princess:{princess_domain}",
            message_type="order",
            content=order,
            prompt=self.prompt_harness.prompts.get("queen_to_princess", [])[0].content if self.prompt_harness.prompts.get("queen_to_princess") else ""
        )
        self.message_history.append(message)

        # Evaluate prompt quality
        eval_result = self.prompt_harness.evaluate_prompt("queen_to_princess")
        pass_rate = sum(1 for r in eval_result if r.passed) / len(eval_result) if eval_result else 0

        # Create validation report
        report = ValidationReport(
            message_id=message.message_id,
            passed=pass_rate >= 0.85,
            pass_rate=pass_rate,
            validation_status=ValidationStatus.OK if pass_rate >= 0.85 else ValidationStatus.PARTIAL,
            theater_score=0.0  # Queen orders assumed genuine
        )

        # If validation fails, get fallback version
        validated_order = order
        if not report.passed:
            logger.warning(f"Order validation failed (pass_rate: {pass_rate:.2%}), using fallback")
            # Get previous version of prompt if available
            versions = self.prompt_harness.prompts.get("queen_to_princess", [])
            if len(versions) > 1:
                report.rollback_version = f"v{versions[-2].version}"
                # Modify order to use safer version
                validated_order["validation_note"] = f"Using fallback prompt {report.rollback_version}"

        self.validation_reports[message.message_id] = report
        return validated_order, report

    def intercept_princess_to_drone(
        self,
        princess_domain: str,
        drone_id: str,
        task: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], ValidationReport]:
        """
        Intercept and validate Princess commands to Drones

        Args:
            princess_domain: Princess domain
            drone_id: Target drone identifier
            task: Task assignment

        Returns:
            Tuple of (validated_task, validation_report)
        """
        logger.info(f"Intercepting Princess:{princess_domain} -> Drone:{drone_id}")

        # Create message
        message = SwarmMessage(
            sender=f"Princess:{princess_domain}",
            receiver=f"Drone:{drone_id}",
            message_type="order",
            content=task,
            prompt=task.get("prompt", "")
        )
        self.message_history.append(message)

        # Validate with Eight Notion principles
        validation_result = self._validate_with_notion_principles(task)

        # Evaluate prompt
        eval_result = self.prompt_harness.evaluate_prompt("princess_to_drone")
        pass_rate = sum(1 for r in eval_result if r.passed) / len(eval_result) if eval_result else 0

        # Create report
        report = ValidationReport(
            message_id=message.message_id,
            passed=validation_result.status == ValidationStatus.OK and pass_rate >= 0.85,
            pass_rate=pass_rate,
            validation_status=validation_result.status,
            theater_score=0.0,
            failures=validation_result.failed_checks,
            warnings=validation_result.warnings
        )

        # Improve task if needed
        validated_task = task
        if not report.passed:
            validated_task = self._improve_task(task, validation_result)

        self.validation_reports[message.message_id] = report
        return validated_task, report

    def validate_drone_to_princess(
        self,
        drone_id: str,
        princess_domain: str,
        output: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], ValidationReport]:
        """
        Validate Drone outputs before passing to Princess

        Args:
            drone_id: Drone identifier
            princess_domain: Target princess domain
            output: Drone output/report

        Returns:
            Tuple of (validated_output, validation_report)
        """
        logger.info(f"Validating Drone:{drone_id} -> Princess:{princess_domain}")

        # Create message
        message = SwarmMessage(
            sender=f"Drone:{drone_id}",
            receiver=f"Princess:{princess_domain}",
            message_type="report",
            content=output,
            prompt=""
        )
        self.message_history.append(message)

        # Extract receipt if present
        receipt = None
        if "receipt" in output:
            receipt_data = output["receipt"]
            receipt = Receipt(
                status=receipt_data.get("status", "PARTIAL"),
                reason_if_blocked=receipt_data.get("reason_if_blocked"),
                models=[ModelInfo(**m) for m in receipt_data.get("models", [])],
                tools_used=receipt_data.get("tools_used", [])
            )

        # Validate with unified framework
        artifacts = output.get("artifacts", {})
        files = output.get("files", {})
        validation_result = self.validator.validate_turn(
            receipt or Receipt(),
            artifacts,
            files
        )

        # Theater detection
        theater_score = self._detect_theater(output)

        # Create report
        report = ValidationReport(
            message_id=message.message_id,
            passed=validation_result.status == ValidationStatus.OK and theater_score < 60,
            pass_rate=1.0 if validation_result.status == ValidationStatus.OK else 0.5,
            validation_status=validation_result.status,
            theater_score=theater_score,
            failures=validation_result.failed_checks,
            warnings=validation_result.warnings
        )

        # Debug and fix if needed
        validated_output = output
        if not report.passed:
            validated_output = self._debug_and_fix(output, validation_result, theater_score)

        self.validation_reports[message.message_id] = report
        return validated_output, report

    def validate_princess_to_queen(
        self,
        princess_domain: str,
        report: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], ValidationReport]:
        """
        Validate Princess reports before passing to Queen

        Args:
            princess_domain: Princess domain
            report: Princess report to Queen

        Returns:
            Tuple of (validated_report, validation_report)
        """
        logger.info(f"Validating Princess:{princess_domain} -> Queen")

        # Create message
        message = SwarmMessage(
            sender=f"Princess:{princess_domain}",
            receiver="Queen",
            message_type="report",
            content=report,
            prompt=""
        )
        self.message_history.append(message)

        # Aggregate drone validations
        drone_reports = report.get("drone_reports", [])
        total_drones = len(drone_reports)
        passed_drones = sum(1 for r in drone_reports if r.get("status") == "OK")
        success_rate = passed_drones / total_drones if total_drones > 0 else 0

        # Check for theater violations
        theater_violations = sum(
            1 for r in drone_reports
            if self.validation_reports.get(r.get("message_id", ""), ValidationReport("", False, 0, ValidationStatus.BLOCKED, 100)).theater_score > 60
        )

        # Overall validation
        passed = success_rate >= 0.85 and theater_violations == 0

        # Create report
        validation_report = ValidationReport(
            message_id=message.message_id,
            passed=passed,
            pass_rate=success_rate,
            validation_status=ValidationStatus.OK if passed else ValidationStatus.PARTIAL,
            theater_score=0.0,
            warnings=[f"{theater_violations} theater violations detected"] if theater_violations > 0 else []
        )

        # Enhance report with validation summary
        validated_report = report.copy()
        validated_report["validation_summary"] = {
            "success_rate": f"{success_rate:.1%}",
            "theater_violations": theater_violations,
            "overall_status": "OK" if passed else "PARTIAL"
        }

        self.validation_reports[message.message_id] = validation_report
        return validated_report, validation_report

    def _validate_with_notion_principles(self, content: Dict[str, Any]) -> Any:
        """Apply Eight Notion principles validation"""
        from src.version_log.v2.validation_framework import ValidationResult, ValidationStatus

        result = ValidationResult(status=ValidationStatus.OK)

        # Load QC rules with Notion principles
        import yaml
        with open("registry/policies/qc_rules.yaml", 'r') as f:
            qc_rules = yaml.safe_load(f)

        principles = qc_rules.get('validation', {}).get('notion_principles', {})

        # Check scope principle
        scope = principles.get('scope', {})
        if 'file_path' in content:
            path = content['file_path']
            allowed = any(path.startswith(p) for p in scope.get('allowed_paths', []))
            forbidden = any(path.startswith(p) for p in scope.get('forbidden_paths', []))
            if forbidden or not allowed:
                result.failed_checks.append(f"Path violation: {path}")
                result.status = ValidationStatus.BLOCKED

        # Check define_done principle
        if 'status' not in content or content['status'] not in ['OK', 'PARTIAL', 'BLOCKED']:
            result.warnings.append("Missing or invalid status field")
            result.status = ValidationStatus.PARTIAL

        # Check no_invention principle
        content_str = json.dumps(content)
        if 'TK CONFIRM' in content_str and content.get('status') == 'OK':
            result.failed_checks.append("Status cannot be OK with placeholders")
            result.status = ValidationStatus.PARTIAL

        return result

    def _detect_theater(self, output: Dict[str, Any]) -> float:
        """Detect performance theater in outputs"""
        theater_score = 0.0

        # Check for common theater patterns
        content_str = json.dumps(output).lower()

        # Theater indicators
        theater_patterns = [
            ("todo", 10),  # Unfinished TODOs
            ("placeholder", 15),  # Placeholder content
            ("not implemented", 20),  # Admitted non-implementation
            ("mock", 10),  # Mock data
            ("stub", 10),  # Stub functions
            ("dummy", 10),  # Dummy values
            ("fake", 15),  # Fake implementations
            ("coming soon", 20),  # Future promises
            ("will be", 10),  # Future tense
            ("would be", 10),  # Conditional implementation
        ]

        for pattern, score in theater_patterns:
            if pattern in content_str:
                theater_score += score

        # Check for actual evidence of work
        evidence_credits = [
            ("test", -10),  # Has tests
            ("passed", -10),  # Tests passed
            ("coverage", -5),  # Coverage metrics
            ("benchmark", -5),  # Performance data
            ("error", -5),  # Error handling
            ("validation", -5),  # Input validation
        ]

        for pattern, credit in evidence_credits:
            if pattern in content_str:
                theater_score += credit

        # Clamp between 0 and 100
        return max(0, min(100, theater_score))

    def _improve_task(self, task: Dict[str, Any], validation: Any) -> Dict[str, Any]:
        """Improve task based on validation feedback"""
        improved = task.copy()

        # Add validation requirements
        improved["validation_requirements"] = {
            "notion_principles": True,
            "footer_required": True,
            "receipt_required": True
        }

        # Add specific fixes for failures
        for failure in validation.failed_checks:
            if "path violation" in failure:
                improved["allowed_paths"] = ["/src", "/tests", "/docs"]
            elif "status" in failure:
                improved["required_status"] = ["OK", "PARTIAL", "BLOCKED"]

        # Add warnings as suggestions
        improved["suggestions"] = validation.warnings

        return improved

    def _debug_and_fix(
        self,
        output: Dict[str, Any],
        validation: Any,
        theater_score: float
    ) -> Dict[str, Any]:
        """Debug and fix validation issues"""
        fixed = output.copy()

        # Fix theater issues
        if theater_score > 60:
            fixed["theater_remediation"] = {
                "score": theater_score,
                "action": "Requires real implementation",
                "evidence_needed": ["tests", "benchmarks", "error_handling"]
            }

        # Fix validation failures
        for failure in validation.failed_checks:
            if "NASA" in failure:
                fixed["nasa_remediation"] = "Refactor to meet POT10 rules"
            elif "Connascence" in failure:
                fixed["connascence_remediation"] = "Reduce coupling"
            elif "secret" in failure.lower():
                fixed["security_remediation"] = "Remove hardcoded secrets"

        # Ensure receipt is present
        if "receipt" not in fixed:
            fixed["receipt"] = {
                "status": "PARTIAL",
                "reason_if_blocked": "Validation failures detected",
                "warnings": validation.warnings
            }

        return fixed

    def get_communication_trace(self, message_id: str) -> Dict[str, Any]:
        """Get full communication trace for a message"""
        # Find message
        message = next((m for m in self.message_history if m.message_id == message_id), None)
        if not message:
            return {"error": f"Message {message_id} not found"}

        # Get validation report
        report = self.validation_reports.get(message_id)

        return {
            "message": {
                "id": message.message_id,
                "sender": message.sender,
                "receiver": message.receiver,
                "type": message.message_type,
                "timestamp": message.timestamp
            },
            "validation": {
                "passed": report.passed if report else None,
                "pass_rate": report.pass_rate if report else None,
                "status": report.validation_status.value if report else None,
                "theater_score": report.theater_score if report else None,
                "failures": report.failures if report else [],
                "warnings": report.warnings if report else []
            } if report else None
        }

def integrate_with_swarm(swarm_instance):
    """
    Integrate interceptor with existing swarm deployment

    Args:
        swarm_instance: Instance of RealQueenSeraphina or similar
    """
    interceptor = SwarmCommunicationInterceptor()

    # Wrap Queen's deploy_princess method
    original_deploy = swarm_instance.deploy_princess

    def wrapped_deploy(domain, task):
        validated_task, report = interceptor.intercept_queen_to_princess(domain, task)
        if report.passed:
            return original_deploy(domain, validated_task)
        else:
            logger.warning(f"Task validation failed: {report.failures}")
            return None

    swarm_instance.deploy_princess = wrapped_deploy

    # Wrap Princess deploy_drones method
    for princess in swarm_instance.princesses.values():
        original_deploy_drones = princess.deploy_drones

        def wrapped_deploy_drones(self, agents):
            validated_agents = []
            for agent in agents:
                validated_task, report = interceptor.intercept_princess_to_drone(
                    self.domain,
                    agent.get('id', 'unknown'),
                    agent
                )
                if report.passed:
                    validated_agents.append(validated_task)
                else:
                    logger.warning(f"Drone task validation failed: {report.failures}")
            return original_deploy_drones(validated_agents)

        princess.deploy_drones = wrapped_deploy_drones

    logger.info("Swarm communication interceptor integrated")
    return interceptor

# Example usage
if __name__ == "__main__":
    # Create interceptor
    interceptor = SwarmCommunicationInterceptor()

    # Test Queen to Princess
    order = {
        "task": "Implement authentication system",
        "requirements": ["OAuth2", "JWT tokens", "Rate limiting"],
        "deadline": "2025-9-30"
    }
    validated_order, report = interceptor.intercept_queen_to_princess("Development", order)
    print(f"Queen->Princess validation: {report.passed} (pass_rate: {report.pass_rate:.2%})")

    # Test Princess to Drone
    task = {
        "command": "Create auth controller",
        "file_path": "/src/auth/controller.py",
        "prompt": "Implement OAuth2 authentication"
    }
    validated_task, report = interceptor.intercept_princess_to_drone("Development", "coder-1", task)
    print(f"Princess->Drone validation: {report.passed}")

    # Test Drone to Princess
    output = {
        "status": "OK",
        "files": ["/src/auth/controller.py"],
        "tests": ["test_auth.py"],
        "receipt": {
            "status": "OK",
            "models": [{"name": "gpt-4", "version": "latest"}],
            "tools_used": ["filesystem", "github"]
        }
    }
    validated_output, report = interceptor.validate_drone_to_princess("coder-1", "Development", output)
    print(f"Drone->Princess validation: {report.passed} (theater_score: {report.theater_score})")