"""
Regression Guard System
Prevents ANY regression in test discovery with automatic rollback
"""

import subprocess
import json
from pathlib import Path
from typing import List, Dict, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import sys


@dataclass
class RegressionCheckpoint:
    """Checkpoint state for rollback"""
    timestamp: str
    test_count: int
    files_modified: List[str]
    git_hash: str
    description: str


class RegressionError(Exception):
    """Raised when regression is detected"""
    pass


class RegressionGuard:
    """
    Zero-Tolerance Regression Prevention System

    Enforces baseline test count with automatic rollback on violation
    """

    def __init__(self, baseline: int = 111, checkpoint_dir: str = ".fixes/checkpoints"):
        self.baseline = baseline
        self.min_acceptable = baseline  # Never go below this
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)

        # Track current state
        self.current_count = self._count_tests()
        self.checkpoints: List[RegressionCheckpoint] = []

    def create_checkpoint(self, description: str, files: List[str]) -> RegressionCheckpoint:
        """
        Create git checkpoint before applying fixes

        Returns checkpoint object for rollback if needed
        """
        # Count tests before checkpoint
        pre_count = self._count_tests()

        # Create git commit
        git_hash = self._create_git_checkpoint(description, files)

        checkpoint = RegressionCheckpoint(
            timestamp=datetime.now().isoformat(),
            test_count=pre_count,
            files_modified=files,
            git_hash=git_hash,
            description=description
        )

        # Save checkpoint to disk
        self._save_checkpoint(checkpoint)
        self.checkpoints.append(checkpoint)

        print(f"\n[CHECKPOINT] Created: {description}")
        print(f"  Git Hash: {git_hash[:8]}")
        print(f"  Tests: {pre_count}")
        print(f"  Files: {len(files)}")

        return checkpoint

    def validate_batch(self, batch_files: List[str], checkpoint: RegressionCheckpoint) -> bool:
        """
        Validate that batch of fixes didn't cause regression

        Automatically rolls back to checkpoint if test count decreases

        Returns:
            True if validation passed
            False if regression detected (and rollback executed)
        """
        post_count = self._count_tests()

        print(f"\n[VALIDATION] Checking regression...")
        print(f"  Baseline: {self.min_acceptable} tests (minimum)")
        print(f"  Pre-batch: {checkpoint.test_count} tests")
        print(f"  Post-batch: {post_count} tests")

        # Check for regression
        if post_count < self.min_acceptable:
            print(f"\n[FAIL] [REGRESSION DETECTED]")
            print(f"  Tests decreased: {checkpoint.test_count} -> {post_count}")
            print(f"  Below baseline: {post_count} < {self.min_acceptable}")
            print(f"  Files affected: {batch_files}")

            # Automatic rollback
            print(f"\n[ROLLBACK] Reverting to checkpoint: {checkpoint.git_hash[:8]}")
            self._rollback_to_checkpoint(checkpoint)

            # Verify rollback
            verify_count = self._count_tests()
            print(f"  Verification: {verify_count} tests after rollback")

            if verify_count >= self.min_acceptable:
                print(f"[OK] [ROLLBACK SUCCESS] Restored {verify_count} tests")
            else:
                print(f"[WARN] [ROLLBACK WARNING] Still below baseline: {verify_count} < {self.min_acceptable}")

            return False

        # Check for improvement or maintenance
        if post_count > checkpoint.test_count:
            print(f"[OK] [IMPROVEMENT] Tests increased: {checkpoint.test_count} -> {post_count} (+{post_count - checkpoint.test_count})")
        elif post_count == checkpoint.test_count:
            print(f"[OK] [MAINTAINED] Tests unchanged: {post_count}")

        # Update current count
        self.current_count = post_count

        return True

    def _count_tests(self) -> int:
        """Count total tests discovered by pytest"""
        try:
            result = subprocess.run(
                ["python", "-m", "pytest", "tests/", "--collect-only", "-q"],
                capture_output=True,
                text=True,
                timeout=30
            )

            # Parse output for test count
            for line in result.stdout.split('\n'):
                if 'collected' in line.lower():
                    # Extract number from "collected 111 items"
                    parts = line.split()
                    for i, part in enumerate(parts):
                        if part.isdigit():
                            return int(part)

            # If no tests found, return 0
            return 0

        except Exception as e:
            print(f"[WARN] Warning: Could not count tests: {e}")
            return 0

    def _create_git_checkpoint(self, description: str, files: List[str]) -> str:
        """Create git commit as checkpoint"""
        try:
            # Stage files
            for f in files:
                subprocess.run(["git", "add", f], check=True, capture_output=True)

            # Create commit
            commit_msg = f"[CHECKPOINT] {description}\n\nFiles: {', '.join(files[:5])}"
            if len(files) > 5:
                commit_msg += f" (+{len(files)-5} more)"

            subprocess.run(
                ["git", "commit", "-m", commit_msg],
                check=True,
                capture_output=True
            )

            # Get commit hash
            result = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                capture_output=True,
                text=True,
                check=True
            )

            return result.stdout.strip()

        except subprocess.CalledProcessError as e:
            print(f"[WARN] Warning: Git checkpoint failed: {e}")
            return "no-git-checkpoint"

    def _rollback_to_checkpoint(self, checkpoint: RegressionCheckpoint):
        """Rollback to specific checkpoint"""
        try:
            # Hard reset to checkpoint
            subprocess.run(
                ["git", "reset", "--hard", checkpoint.git_hash],
                check=True,
                capture_output=True
            )

            print(f"[OK] Rolled back to: {checkpoint.git_hash[:8]}")

        except subprocess.CalledProcessError as e:
            print(f"[FAIL] Rollback failed: {e}")
            raise RegressionError(f"Could not rollback to {checkpoint.git_hash}")

    def _save_checkpoint(self, checkpoint: RegressionCheckpoint):
        """Save checkpoint to disk"""
        filename = self.checkpoint_dir / f"checkpoint_{checkpoint.timestamp.replace(':', '-')}.json"

        with open(filename, 'w') as f:
            json.dump(asdict(checkpoint), f, indent=2)

    def load_checkpoints(self) -> List[RegressionCheckpoint]:
        """Load all checkpoints from disk"""
        checkpoints = []

        for file in sorted(self.checkpoint_dir.glob("checkpoint_*.json")):
            with open(file) as f:
                data = json.load(f)
                checkpoints.append(RegressionCheckpoint(**data))

        return checkpoints

    def get_status(self) -> Dict[str, Any]:
        """Get current regression guard status"""
        return {
            "baseline": self.baseline,
            "min_acceptable": self.min_acceptable,
            "current_count": self.current_count,
            "checkpoints_created": len(self.checkpoints),
            "status": "HEALTHY" if self.current_count >= self.min_acceptable else "DEGRADED"
        }


def main():
    """CLI for regression guard"""
    import argparse

    parser = argparse.ArgumentParser(description="Regression Guard System")
    parser.add_argument("--baseline", type=int, default=111,
                       help="Baseline test count (default: 111)")
    parser.add_argument("--status", action="store_true",
                       help="Show current status")
    parser.add_argument("--validate", action="store_true",
                       help="Validate current test count")

    args = parser.parse_args()

    guard = RegressionGuard(baseline=args.baseline)

    if args.status:
        status = guard.get_status()
        print("\n[REGRESSION GUARD STATUS]")
        print("=" * 60)
        print(f"  Baseline: {status['baseline']} tests")
        print(f"  Min Acceptable: {status['min_acceptable']} tests")
        print(f"  Current Count: {status['current_count']} tests")
        print(f"  Checkpoints: {status['checkpoints_created']}")
        print(f"  Status: {status['status']}")
        print("=" * 60)

        if status['status'] == "HEALTHY":
            print("[OK] No regression detected")
            sys.exit(0)
        else:
            print("[FAIL] Regression detected - below baseline")
            sys.exit(1)

    elif args.validate:
        current = guard._count_tests()
        print(f"\n[VALIDATION] Current test count: {current}")

        if current >= guard.min_acceptable:
            print(f"[PASS] {current} >= {guard.min_acceptable} baseline")
            sys.exit(0)
        else:
            print(f"[FAIL] {current} < {guard.min_acceptable} baseline")
            sys.exit(1)


if __name__ == "__main__":
    main()
