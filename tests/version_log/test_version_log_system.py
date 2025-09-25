"""
Comprehensive test suite for the Version Log System
Tests all components: ContentHasher, SemverManager, FooterRenderer, VersionLogManager
"""

from datetime import datetime
from pathlib import Path
import json
import os
import sys
import tempfile

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.version_log import (
    VersionLogManager,
    ContentHasher,
    SemverManager,
    ChangeType,
    FooterRenderer
)

def test_content_hasher():
    """Test ContentHasher functionality"""
    hasher = ContentHasher()

    # Test basic hashing
    content = "This is test content\nWith multiple lines\n"
    hash1 = hasher.compute_hash(content)
    assert len(hash1) == 7, f"Hash should be 7 chars, got {len(hash1)}"

    # Test hash consistency
    hash2 = hasher.compute_hash(content)
    assert hash1 == hash2, "Same content should produce same hash"

    # Test different content produces different hash
    different_content = "Different content"
    hash3 = hasher.compute_hash(different_content)
    assert hash1 != hash3, "Different content should produce different hash"

    # Test footer stripping
    content_with_footer = content + """
<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-9-24T15:12:3 | test@Model | Test | -- | OK | -- | 0.00 | abcdefg |
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->"""

    stripped = hasher.strip_footer(content_with_footer)
    assert stripped == content.rstrip(), "Footer should be stripped correctly"

    # Test hash verification
    assert hasher.verify_hash(content, hash1), "Hash verification should pass"
    assert not hasher.verify_hash(content, "wrong"), "Wrong hash should fail verification"

def test_semver_manager():
    """Test SemverManager functionality"""
    manager = SemverManager()

    # Test version parsing
    parsed = manager.parse_version("1.2.3")
    assert parsed == (1, 2, 3, None), "Should parse version correctly"

    parsed_with_pre = manager.parse_version("1.2.3-beta")
    assert parsed_with_pre == (1, 2, 3, "beta"), "Should parse prerelease version"

    # Test version formatting
    formatted = manager.format_version(2, 3, 4, "alpha")
    assert formatted == "2.3.4-alpha", "Should format version correctly"

    # Test version bumping
    new_version = manager.bump_version("1.2.3", ChangeType.PATCH)
    assert new_version == "1.2.4", "Patch bump should increment patch"

    new_version = manager.bump_version("1.2.3", ChangeType.MINOR)
    assert new_version == "1.3.0", "Minor bump should increment minor and reset patch"

    new_version = manager.bump_version("1.2.3", ChangeType.MAJOR)
    assert new_version == "2.0.0", "Major bump should increment major and reset others"

    new_version = manager.bump_version("1.2.3", ChangeType.NO_CHANGE)
    assert new_version == "1.2.3", "No change should keep same version"

    # Test version comparison
    assert manager.compare_versions("1.2.3", "1.2.4") == -1, "1.2.3 < 1.2.4"
    assert manager.compare_versions("2.0.0", "1.9.9") == 1, "2.0.0 > 1.9.9"
    assert manager.compare_versions("1.2.3", "1.2.3") == 0, "Same versions are equal"

def test_footer_renderer():
    """Test FooterRenderer functionality"""
    renderer = FooterRenderer()

    # Test comment style detection
    style = renderer.get_comment_style("test.py")
    assert style['style'] == 'hash', "Python files should use hash comments"

    style = renderer.get_comment_style("test.js")
    assert style['style'] == 'block', "JavaScript files should use block comments"

    style = renderer.get_comment_style("test.md")
    assert style['style'] == 'html', "Markdown files should use HTML comments"

    # Test footer rendering
    rows = [{
        'version': '1.0.0',
        'timestamp': '2025-9-24T15:12:3',
        'agent_model': 'test@Model',
        'change_summary': 'Initial test',
        'artifacts_changed': ['file1.py'],
        'status': 'OK',
        'warnings_notes': '--',
        'cost_usd': 0.12,
        'content_hash': 'abc1234'
    }]

    receipt = {
        'status': 'OK',
        'reason_if_blocked': '--',
        'run_id': 'test123',
        'inputs': ['input.txt'],
        'tools_used': ['tool1', 'tool2'],
        'versions': {'model': 'v1', 'prompt': 'v2'}
    }

    footer = renderer.render_footer('test.py', rows, receipt)
    assert '# =====' in footer, "Python footer should have hash markers"
    assert '1.0.0' in footer, "Footer should contain version"
    assert 'test@Model' in footer, "Footer should contain agent"
    assert 'test123' in footer, "Footer should contain run_id"

    # Test footer parsing
    parsed = renderer.parse_existing_footer(footer, 'test.py')
    assert parsed is not None, "Should parse footer successfully"
    assert len(parsed['rows']) == 1, "Should have one row"
    assert parsed['rows'][0]['version'] == '1.0.0', "Should parse version correctly"

def test_version_log_manager():
    """Test VersionLogManager functionality"""

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

        assert "AGENT FOOTER BEGIN" in updated, "Updated content should have footer"
        assert "1.0.0" in updated, "Should have initial version"
        assert "test@Python" in updated, "Should have agent meta"

        # Validate footer
        validation = manager.validate_footer(str(test_file))
        assert validation['valid'], f"Footer should be valid: {validation}"

        # Test idempotency - update with same content
        updated2 = manager.update_file(
            file_path=str(test_file),
            agent_meta="test2@Python",
            change_summary="No changes",
            status="OK"
        )

        assert "no-op (idempotent)" in updated2, "Should detect idempotent operation"

        # Get file history
        history = manager.get_file_history(str(test_file))
        assert history is not None, "Should get file history"
        assert len(history) == 2, "Should have 2 history entries"

        # Test sidecar log
        sidecar_file = Path(tmpdir) / "run_logs.jsonl"
        assert sidecar_file.exists(), "Sidecar log should exist"

        with open(sidecar_file, 'r') as f:
            lines = f.readlines()
            assert len(lines) == 2, "Should have 2 log entries"
            entry = json.loads(lines[0])
            assert entry['agent'] == "test@Python", "Log should have correct agent"

def test_integration():
    """Test full integration of the system"""

    with tempfile.TemporaryDirectory() as tmpdir:
        # Simulate a multi-file project
        project_dir = Path(tmpdir) / "project"
        project_dir.mkdir()

        # Create files of different types
        files = {
            "main.py": "def main():\n    pass\n",
            "README.md": "# Test Project\n\nDescription here.\n",
            "config.yaml": "version: 1.0\nname: test\n",
            "script.sh": "#!/bin/bash\necho 'Hello'\n"
        }

        manager = VersionLogManager(artifacts_dir=str(project_dir / ".artifacts"))

        # Create and update files
        for filename, content in files.items():
            file_path = project_dir / filename
            file_path.write_text(content)

            # Update with footer
            manager.update_file(
                file_path=str(file_path),
                agent_meta=f"creator@{filename.split('.')[-1].upper()}",
                change_summary=f"Created {filename}",
                status="OK",
                cost_usd=0.1
            )

        # Validate all files
        for filename in files.keys():
            file_path = project_dir / filename
            validation = manager.validate_footer(str(file_path))
            assert validation['valid'], f"{filename} should have valid footer"

            # Check appropriate comment style
            content = file_path.read_text()
            if filename.endswith('.py'):
                assert '# =====' in content, "Python should have hash comments"
            elif filename.endswith('.md'):
                assert '<!--' in content, "Markdown should have HTML comments"
            elif filename.endswith('.yaml'):
                assert '# =====' in content, "YAML should have hash comments"
            elif filename.endswith('.sh'):
                assert '# =====' in content, "Shell should have hash comments"

        # Check sidecar log
        sidecar = project_dir / ".artifacts" / "run_logs.jsonl"
        assert sidecar.exists(), "Sidecar log should exist"

        with open(sidecar, 'r') as f:
            entries = [json.loads(line) for line in f]
            assert len(entries) == len(files), "Should have entry for each file"

def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("=" * 60)

    try:
        test_content_hasher()
        test_semver_manager()
        test_footer_renderer()
        test_version_log_manager()
        test_integration()

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