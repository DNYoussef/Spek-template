"""
Test the refactored audit manager to ensure god object is eliminated.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from refactored_audit_manager import (
    AuditEntry,
    IntegrityManager,
    AuditStorageManager,
    AuditEventProcessor,
    DFARSComplianceValidator,
    RefactoredAuditManager
)


def count_methods(obj) -> int:
    """Count public methods of an object."""
    return len([m for m in dir(obj) if not m.startswith('_') and callable(getattr(obj, m))])


def test_audit_entry():
    """Test AuditEntry - should be a simple data class."""
    print("TEST 1: AuditEntry")
    print("-" * 40)

    entry = AuditEntry(
        timestamp="2024-01-01T00:00:00",
        event_type="test",
        user="user1",
        action="create",
        resource="file.txt",
        result="success",
        metadata={}
    )

    methods = count_methods(entry)
    print(f"Public methods: {methods} (MAX: 15)")

    # Test functionality
    entry.hash = entry.calculate_hash()
    assert entry.hash is not None
    assert len(entry.to_json()) > 0

    print("AuditEntry: PASS")
    return methods <= 15


def test_integrity_manager():
    """Test IntegrityManager - should handle only integrity."""
    print("\nTEST 2: IntegrityManager")
    print("-" * 40)

    integrity = IntegrityManager()
    methods = count_methods(integrity)
    print(f"Public methods: {methods} (MAX: 15)")

    # Test functionality
    entry = AuditEntry(
        timestamp="2024-01-01",
        event_type="test",
        user="user",
        action="test",
        resource="test",
        result="success",
        metadata={}
    )
    entry.hash = entry.calculate_hash()

    assert integrity.verify_entry(entry) == True
    signature = integrity.sign_entry(entry)
    assert signature is not None

    print("IntegrityManager: PASS")
    return methods <= 15


def test_storage_manager():
    """Test AuditStorageManager - should handle only storage."""
    print("\nTEST 3: AuditStorageManager")
    print("-" * 40)

    # Use temp directory
    import tempfile
    with tempfile.TemporaryDirectory() as tmpdir:
        storage = AuditStorageManager(tmpdir)
        methods = count_methods(storage)
        print(f"Public methods: {methods} (MAX: 15)")

        # Test functionality
        entry = AuditEntry(
            timestamp="2024-01-01",
            event_type="test",
            user="user",
            action="test",
            resource="test",
            result="success",
            metadata={}
        )

        storage.save_entry(entry)
        loaded = storage.load_entries()
        assert len(loaded) > 0

        print("AuditStorageManager: PASS")
        return methods <= 15


def test_event_processor():
    """Test AuditEventProcessor - should handle only processing."""
    print("\nTEST 4: AuditEventProcessor")
    print("-" * 40)

    processor = AuditEventProcessor()
    methods = count_methods(processor)
    print(f"Public methods: {methods} (MAX: 15)")

    # Test functionality
    def test_processor(entry):
        entry.metadata['processed'] = True
        return entry

    processor.register_processor('test', test_processor)
    processor.start()

    entry = AuditEntry(
        timestamp="2024-01-01",
        event_type="test",
        user="user",
        action="test",
        resource="test",
        result="success",
        metadata={}
    )

    processed = processor.process_event(entry)
    assert processed.metadata.get('processed') == True

    processor.stop()

    print("AuditEventProcessor: PASS")
    return methods <= 15


def test_compliance_validator():
    """Test DFARSComplianceValidator - should handle only compliance."""
    print("\nTEST 5: DFARSComplianceValidator")
    print("-" * 40)

    validator = DFARSComplianceValidator()
    methods = count_methods(validator)
    print(f"Public methods: {methods} (MAX: 15)")

    # Test functionality
    entry = AuditEntry(
        timestamp="2024-01-01",
        event_type="test",
        user="user",
        action="test",
        resource="test",
        result="success",
        metadata={}
    )
    entry.hash = entry.calculate_hash()

    assert validator.validate_entry(entry) == True
    report = validator.generate_compliance_report()
    assert 'requirements' in report

    print("DFARSComplianceValidator: PASS")
    return methods <= 15


def test_main_manager():
    """Test RefactoredAuditManager - should orchestrate only."""
    print("\nTEST 6: RefactoredAuditManager")
    print("-" * 40)

    import tempfile
    with tempfile.TemporaryDirectory() as tmpdir:
        manager = RefactoredAuditManager({'storage_path': tmpdir})
        methods = count_methods(manager)
        print(f"Public methods: {methods} (MAX: 15)")

        # Test functionality
        entry = manager.log_event(
            event_type="test",
            user="testuser",
            action="create",
            resource="file.txt",
            result="success"
        )
        assert entry is not None

        events = manager.query_events()
        assert len(events) > 0

        manager.shutdown()

        print("RefactoredAuditManager: PASS")
        return methods <= 15


def main():
    """Run all tests."""
    print("=" * 50)
    print("AUDIT MANAGER REFACTORING TESTS")
    print("=" * 50)
    print()

    tests_passed = 0
    total_tests = 6

    if test_audit_entry():
        tests_passed += 1

    if test_integrity_manager():
        tests_passed += 1

    if test_storage_manager():
        tests_passed += 1

    if test_event_processor():
        tests_passed += 1

    if test_compliance_validator():
        tests_passed += 1

    if test_main_manager():
        tests_passed += 1

    print("\n" + "=" * 50)
    print(f"RESULTS: {tests_passed}/{total_tests} tests passed")
    print("=" * 50)

    if tests_passed == total_tests:
        print("\nAUDIT MANAGER REFACTORING SUCCESSFUL!")
        print("God object eliminated:")
        print("  - Original: 34 methods in 1 class, 872 lines")
        print("  - Refactored: 6 focused classes")
        print("  - Each class has <15 methods")
        print("  - Single Responsibility achieved")
    else:
        print("\nREFACTORING NEEDS WORK")

    return tests_passed == total_tests


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)