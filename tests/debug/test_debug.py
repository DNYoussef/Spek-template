import tempfile
from pathlib import Path
import sys
sys.path.insert(0, str(Path.cwd()))

from src.version_log import VersionLogManager

with tempfile.TemporaryDirectory() as tmpdir:
    manager = VersionLogManager(artifacts_dir=tmpdir)

    # Create test file
    test_file = Path(tmpdir) / "test_file.py"
    test_content = """def hello():
    print("Hello, World!")
"""
    test_file.write_text(test_content)

    # Update file with footer
    updated = manager.update_file(
        file_path=str(test_file),
        agent_meta="test@Python",
        change_summary="Added hello function",
        artifacts_changed=["test_file.py"],
        status="OK",
        cost_usd=0.5,
        versions={"python": "3.9", "model": "test-v1"},
        inputs=["spec.md"],
        tools_used=["editor", "linter"]
    )

    print("Updated content:")
    print(updated)
    print("\nLooking for '1.0.0':", "1.0.0" in updated)