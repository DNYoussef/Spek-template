from src.constants.base import MAXIMUM_RETRY_ATTEMPTS

import sys
import json
import tempfile
from pathlib import Path
from datetime import datetime

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.version_log.v2.receipt_schema import Receipt, ModelInfo, CostInfo, Mutation
from src.version_log.v2.footer_middleware import FooterMiddleware
from src.version_log.v2.validation_framework import UnifiedValidator, ValidationStatus

def test_schema_validation():
    """Test schema validation with QC rules"""

    validator = UnifiedValidator()

    # Test PRD validation
    prd_data = {
        "name": "AI",  # Too short (min 3)
        "goal": "Make AI better",  # Too short (min 20)
        "problem": "Current AI systems have limitations in understanding context",
        "acceptance_tests": [],  # Missing required items
        "owner": "team@example.com",
        "version": 1,
        "status": "draft"
    }

    result = validator.validate_schema(prd_data, "prd")

    print(f"Status: {result.status.value}")
    print(f"Warnings: {result.warnings}")
    print(f"Suggestions: {result.suggestions}")
    print(f"Placeholders: {result.placeholders_inserted}")

    assert result.status == ValidationStatus.PARTIAL
    assert len(result.warnings) > 0
    assert "TK CONFIRM" in str(prd_data)  # Placeholder inserted

def test_footer_integration():
    """Test footer middleware with validation"""

    middleware = FooterMiddleware()

    # Create receipt
    receipt = Receipt(
        status="OK",
        models=[ModelInfo(name="planner@gemini", version="v18")],
        tools_used=["analyzer", "validator"],
        cost=CostInfo(usd=0.43, prompt_tokens=1200, completion_tokens=800),
        mutations=[Mutation(type="PRD", id="prd_123", version=2)]
    )

    # Test file content
    original = """def process_data():
    # Process important data
    return {"status": "complete"}
"""

    # Update with footer
    updated = middleware.update_footer(
        file_text=original,
        agent_meta="validator@opus",
        change_summary="Added data processing function",
        artifacts_changed=["prd_123", "task_456"],
        status="OK",
        cost_usd=0.43,
        receipt=receipt,
        file_path="processor.py"
    )

    print("Updated content:")
    print(updated)

    # Validate footer
    validation = middleware.validate_footer(updated, "processor.py")
    print(f"\nFooter validation: {validation}")

    assert validation['valid']
    assert validation['version'] == "1.0.0"
    assert "AGENT FOOTER BEGIN" in updated

def test_code_quality_validation():
    """Test integration with NASA and Connascence analyzers"""

    validator = UnifiedValidator()

    # Sample code with quality issues
    code_content = """
def process_all_data(data, flag1, flag2, flag3, flag4, flag5):
    '''Function with too many parameters (connascence of position)'''

    # Magic number (NASA POT10 violation)
    if len(data) > 1000:
        for i in range(len(data)):
            for j in range(len(data[i])):
                for k in range(len(data[i][j])):
                    # Deep nesting (NASA violation)
                    if data[i][j][k] == 42:  # Magic literal
                        process_item(i, j, k, flag1, flag2, flag3)

    # Hardcoded configuration (connascence of meaning)
    timeout = 30
    retries = MAXIMUM_RETRY_ATTEMPTS

    return {"processed": True}

def process_item(i, j, k, f1, f2, f3):
    # Another function with position coupling
"""

    with tempfile.NamedTemporaryFile(suffix=".py", mode='w', delete=False) as f:
        f.write(code_content)
        temp_path = f.name

    result = validator.validate_code_quality(temp_path, code_content)

    print(f"Status: {result.status.value}")
    print(f"Scores: {result.scores}")
    print(f"Passed checks: {result.passed_checks}")
    print(f"Failed checks: {result.failed_checks}")
    print(f"Warnings: {result.warnings[:3]}")  # First 3 warnings

    # Cleanup
    Path(temp_path).unlink()

def test_security_validation():
    """Test security validation checks"""

    validator = UnifiedValidator()

    # Code with security issue
    bad_code = """
import os

# SECURITY VIOLATION: Hardcoded secret
API_KEY = "sk-1234567890abcdef"
password = "admin123"

def connect():
    return {"key": API_KEY}
"""

    result = validator.validate_security("config.py", bad_code)

    print(f"Status: {result.status.value}")
    print(f"Failed checks: {result.failed_checks}")
    print(f"Warnings: {result.warnings}")

    assert result.status == ValidationStatus.BLOCKED
    assert "secret" in str(result.failed_checks).lower()

def test_complete_turn_validation():
    """Test complete turn validation with all components"""

    validator = UnifiedValidator()
    middleware = FooterMiddleware()

    # Create turn receipt
    receipt = Receipt(
        status="OK",
        models=[
            ModelInfo(name="planner@gemini", version="v18"),
            ModelInfo(name="critic@opus", version="v4.1")
        ],
        tools_used=["analyzer", "validator", "formatter"],
        cost=CostInfo(usd=0.87, prompt_tokens=4500, completion_tokens=2100),
        inputs=["spec.md", "requirements.yaml"],
        versions={"router": "v7", "policy": "2025-9-24"}
    )

    # Artifacts created in this turn
    artifacts = {
        "prd_123": {
            "type": "prd",
            "data": {
                "name": "Enhanced Validation System",
                "goal": "Implement comprehensive validation framework integrating NASA POT10, Connascence detection, and enterprise compliance",
                "problem": "Current validation is fragmented across multiple systems without unified quality gates",
                "acceptance_tests": [
                    "All NASA POT10 rules enforced with configurable thresholds",
                    "Connascence detection integrated with god object limits",
                    "Enterprise compliance frameworks (SOC2, ISO27001, NIST) enabled"
                ],
                "owner": "platform-team@example.com",
                "version": 1,
                "status": "ready"
            }
        },
        "task_456": {
            "type": "task",
            "data": {
                "title": "Implement unified validator class",
                "team": "backend",
                "linked_prd": "prd_123",
                "status": "in_progress",
                "priority": "p0",
                "version": 1,
                "assignee": "alice@example.com"
            }
        }
    }

    # File contents modified
    file_contents = {
        "validator.py": """
class UnifiedValidator:
    def __init__(self):
        self.analyzers = {}

    def validate(self, data):
        # Simple validation logic
        return {"valid": True}
""",
        "test_validator.py": """
def test_validation():
    validator = UnifiedValidator()
    assert validator.validate({})["valid"]
"""
    }

    # Run complete validation
    result = validator.validate_turn(receipt, artifacts, file_contents)

    print(f"\nTurn validation status: {result.status.value}")
    print(f"Passed checks: {len(result.passed_checks)}")
    print(f"Warnings: {len(result.warnings)}")
    print(f"Scores: {result.scores}")

    # Update file with footer based on validation
    for file_path, content in file_contents.items():
        updated = middleware.update_footer(
            file_text=content,
            agent_meta="validator@opus",
            change_summary=f"Updated {file_path}",
            artifacts_changed=list(artifacts.keys()),
            status=result.status.value,
            cost_usd=receipt.cost.usd if receipt.cost else 0,
            receipt=receipt,
            file_path=file_path
        )
        print(f"\nFile: {file_path}")
        print(f"Footer added with status: {result.status.value}")

def test_health_monitoring():
    """Test health status monitoring"""

    validator = UnifiedValidator()
    health = validator.get_health_status()

    print("Component Health Status:")
    for component, status in health.items():
        print(f"  {component}: {status}")

    assert health['VALIDATOR'] == 'OK'

def run_all_tests():
    """Run all integration tests"""
    print("=" * 60)
    print("=" * 60)

    try:
        test_schema_validation()
        test_footer_integration()
        test_code_quality_validation()
        test_security_validation()
        test_complete_turn_validation()
        test_health_monitoring()

        print("\n" + "=" * 60)
        print("=" * 60)
        return 0

    except AssertionError as e:
        return 1
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 2

if __name__ == "__main__":
    sys.exit(run_all_tests())