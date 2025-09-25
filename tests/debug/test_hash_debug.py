import tempfile
from pathlib import Path
import sys
sys.path.insert(0, str(Path.cwd()))

from src.version_log import VersionLogManager, ContentHasher

with tempfile.TemporaryDirectory() as tmpdir:
    manager = VersionLogManager(artifacts_dir=tmpdir)
    hasher = ContentHasher()

    # Create test file
    test_file = Path(tmpdir) / "test_file.py"
    original_content = """def hello():
    print("Hello, World!")
"""
    test_file.write_text(original_content)

    print("Original content repr:")
    print(repr(original_content))
    print("Original content hash:", hasher.compute_hash(original_content))

    # Update file with footer
    updated = manager.update_file(
        file_path=str(test_file),
        agent_meta="test@Python",
        change_summary="Added hello function",
        artifacts_changed=["test_file.py"],
        status="OK",
        cost_usd=0.5,
    )

    # Read back the file
    with open(test_file, 'r') as f:
        file_content = f.read()

    # Strip footer and check hash
    body_after_strip = hasher.strip_footer(file_content)
    print("\nBody after stripping footer repr:")
    print(repr(body_after_strip))
    print("Body after strip hash:", hasher.compute_hash(body_after_strip))

    print("\nOriginal vs stripped:")
    print("Same?", original_content == body_after_strip)
    print("Same rstripped?", original_content.rstrip() == body_after_strip)

    # Validate
    validation = manager.validate_footer(str(test_file))
    print("\nValidation result:", validation)