"""
Batch Fix Orchestrator
Executes systematic fixes on 93 syntax error files with full safety
"""

import json
import sys
from pathlib import Path
from typing import List, Dict, Any
from dataclasses import dataclass

# Import our tools
from multi_layer_validator import MultiLayerValidator, ValidationLayer
from regression_guard import RegressionGuard
from ast_syntax_fixer import ASTSyntaxFixer


@dataclass
class BatchResult:
    """Result from fixing a batch of files"""
    batch_number: int
    files_attempted: List[str]
    files_fixed: int
    files_skipped: int
    files_failed: int
    test_count_before: int
    test_count_after: int
    checkpoint_hash: str
    regression: bool


class BatchFixOrchestrator:
    """
    Orchestrates systematic fixing of 93 syntax error files

    Safety Features:
    - Batch size of 10 files
    - Checkpoint before each batch
    - Regression validation after each batch
    - Automatic rollback on regression
    - Protected files enforced
    """

    def __init__(
        self,
        tier1_files: List[str],
        protected_files: List[str],
        baseline_tests: int = 111,
        batch_size: int = 10
    ):
        self.tier1_files = tier1_files
        self.batch_size = batch_size

        # Initialize tools
        self.validator = MultiLayerValidator(protected_files, baseline_tests)
        self.regression_guard = RegressionGuard(baseline_tests)
        self.fixer = ASTSyntaxFixer(protected_files)

        # Track progress
        self.batches_completed = 0
        self.total_fixed = 0
        self.total_skipped = 0
        self.total_failed = 0
        self.batch_results: List[BatchResult] = []

    def execute_all_batches(self) -> Dict[str, Any]:
        """
        Execute fixes on all Tier 1 files in batches

        Returns summary of all batch executions
        """
        print(f"\n{'='*60}")
        print(f"BATCH FIX ORCHESTRATOR - STARTING")
        print(f"{'='*60}")
        print(f"Total files to fix: {len(self.tier1_files)}")
        print(f"Batch size: {self.batch_size}")
        print(f"Protected files: {len(self.fixer.protected_files)}")
        print(f"Baseline tests: {self.regression_guard.baseline}")
        print(f"{'='*60}\n")

        # Split into batches
        batches = self._create_batches()

        for batch_num, batch_files in enumerate(batches, start=1):
            print(f"\n[BATCH {batch_num}/{len(batches)}] Processing {len(batch_files)} files...")

            result = self._execute_batch(batch_num, batch_files)
            self.batch_results.append(result)

            # Check for regression
            if result.regression:
                print(f"\n[STOP] Regression detected in batch {batch_num}")
                print(f"  Rollback executed successfully")
                print(f"  Stopping batch processing")
                break

            # Update totals
            self.batches_completed += 1
            self.total_fixed += result.files_fixed
            self.total_skipped += result.files_skipped
            self.total_failed += result.files_failed

            print(f"\n[BATCH {batch_num}] Summary:")
            print(f"  Fixed: {result.files_fixed}")
            print(f"  Skipped: {result.files_skipped}")
            print(f"  Failed: {result.files_failed}")
            print(f"  Tests: {result.test_count_before} -> {result.test_count_after}")

        # Final summary
        return self._generate_summary()

    def _create_batches(self) -> List[List[str]]:
        """Split files into batches"""
        batches = []
        for i in range(0, len(self.tier1_files), self.batch_size):
            batch = self.tier1_files[i:i+self.batch_size]
            batches.append(batch)
        return batches

    def _execute_batch(self, batch_num: int, batch_files: List[str]) -> BatchResult:
        """
        Execute fixes on single batch with full safety

        1. Create checkpoint
        2. Fix each file
        3. Validate batch (regression check)
        4. Rollback if regression detected
        """
        # STEP 1: Create checkpoint
        checkpoint = self.regression_guard.create_checkpoint(
            description=f"Batch {batch_num} - {len(batch_files)} files",
            files=batch_files
        )

        test_count_before = checkpoint.test_count

        # STEP 2: Fix each file in batch
        fixed_count = 0
        skipped_count = 0
        failed_count = 0

        for filepath in batch_files:
            print(f"  Fixing: {filepath}...", end=" ")

            results = self.fixer.fix_file(Path(filepath))

            # Check result
            if any(r.fixed for r in results):
                print("[FIXED]")
                fixed_count += 1
            elif any(r.skipped for r in results):
                print("[SKIP]")
                skipped_count += 1
            else:
                print("[FAIL]")
                failed_count += 1

        # STEP 3: Validate batch
        regression_detected = not self.regression_guard.validate_batch(
            batch_files,
            checkpoint
        )

        test_count_after = self.regression_guard.current_count

        return BatchResult(
            batch_number=batch_num,
            files_attempted=batch_files,
            files_fixed=fixed_count,
            files_skipped=skipped_count,
            files_failed=failed_count,
            test_count_before=test_count_before,
            test_count_after=test_count_after,
            checkpoint_hash=checkpoint.git_hash,
            regression=regression_detected
        )

    def _generate_summary(self) -> Dict[str, Any]:
        """Generate final summary"""
        summary = {
            "batches_completed": self.batches_completed,
            "total_files_attempted": len(self.tier1_files),
            "total_fixed": self.total_fixed,
            "total_skipped": self.total_skipped,
            "total_failed": self.total_failed,
            "final_test_count": self.regression_guard.current_count,
            "baseline_maintained": self.regression_guard.current_count >= self.regression_guard.baseline,
            "batch_results": [
                {
                    "batch": r.batch_number,
                    "fixed": r.files_fixed,
                    "skipped": r.files_skipped,
                    "failed": r.files_failed,
                    "tests_before": r.test_count_before,
                    "tests_after": r.test_count_after,
                    "regression": r.regression
                }
                for r in self.batch_results
            ]
        }

        return summary


def load_tier1_files() -> List[str]:
    """Load Tier 1 files from dependency analysis"""
    dep_report = Path(".fixes/archaeology/FINAL-DEPENDENCY-REPORT.json")

    if not dep_report.exists():
        print(f"[ERROR] Dependency report not found: {dep_report}")
        sys.exit(1)

    with open(dep_report) as f:
        data = json.load(f)

    # Extract Tier 1 files (syntax errors)
    tier1 = data.get("priority_queue", {}).get("tier_1_critical", {})
    files = [item["file"] for item in tier1.get("files", [])]

    # Convert Windows paths to Unix format if needed
    files = [f.replace("\\", "/") for f in files]

    return files


def load_protected_files() -> List[str]:
    """Load protected files from .fixignore"""
    fixignore = Path(".fixes/archaeology/.fixignore")

    if not fixignore.exists():
        print(f"[WARN] .fixignore not found - no files protected")
        return []

    with open(fixignore) as f:
        protected = [
            line.strip()
            for line in f
            if line.strip() and not line.startswith('#')
        ]

    # Convert to Unix format
    protected = [p.replace("\\", "/") for p in protected]

    return protected


def main():
    """CLI for batch fix orchestrator"""
    import argparse

    parser = argparse.ArgumentParser(description="Batch Fix Orchestrator")
    parser.add_argument("--batch-size", type=int, default=10,
                       help="Number of files per batch (default: 10)")
    parser.add_argument("--baseline", type=int, default=111,
                       help="Baseline test count (default: 111)")
    parser.add_argument("--dry-run", action="store_true",
                       help="Show what would be fixed without actually fixing")

    args = parser.parse_args()

    # Load files
    tier1_files = load_tier1_files()
    protected_files = load_protected_files()

    print(f"\n[INIT] Loaded configuration:")
    print(f"  Tier 1 files: {len(tier1_files)}")
    print(f"  Protected files: {len(protected_files)}")
    print(f"  Batch size: {args.batch_size}")
    print(f"  Baseline tests: {args.baseline}")

    if args.dry_run:
        print(f"\n[DRY RUN] Would fix these files:")
        for i, f in enumerate(tier1_files[:20], start=1):
            print(f"  {i}. {f}")
        if len(tier1_files) > 20:
            print(f"  ... and {len(tier1_files) - 20} more")
        sys.exit(0)

    # Create orchestrator
    orchestrator = BatchFixOrchestrator(
        tier1_files=tier1_files,
        protected_files=protected_files,
        baseline_tests=args.baseline,
        batch_size=args.batch_size
    )

    # Execute all batches
    summary = orchestrator.execute_all_batches()

    # Print final summary
    print(f"\n{'='*60}")
    print(f"BATCH FIX ORCHESTRATOR - COMPLETE")
    print(f"{'='*60}")
    print(f"Batches completed: {summary['batches_completed']}")
    print(f"Files fixed: {summary['total_fixed']}")
    print(f"Files skipped: {summary['total_skipped']}")
    print(f"Files failed: {summary['total_failed']}")
    print(f"Final test count: {summary['final_test_count']}")
    print(f"Baseline maintained: {summary['baseline_maintained']}")
    print(f"{'='*60}\n")

    # Save summary
    summary_path = Path(".fixes/archaeology/batch-fix-summary.json")
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)

    print(f"[SAVE] Summary saved to: {summary_path}")

    # Exit with appropriate code
    if summary['baseline_maintained']:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
