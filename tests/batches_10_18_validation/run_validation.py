from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MINIMUM_TEST_COVERAGE_PERCENTAGE

import sys
import asyncio
import logging
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from tests.batches_10_18_validation.test_suite_orchestrator import Batches10to18TestSuite
from tests.batches_10_18_validation.batch_pattern_validators import BatchPatternValidatorFactory

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('batches_validation.log')
    ]
)
logger = logging.getLogger(__name__)

async def main():
    """Main execution function."""
    try:
        print("="*80)
        print("BATCHES 10-18 COMPREHENSIVE VALIDATION")
        print()

        # Initialize test suite
        logger.info("Initializing test suite...")
        test_suite = Batches10to18TestSuite()

        # Run comprehensive validation
        logger.info("Starting comprehensive validation...")
        validation_report = await test_suite.run_comprehensive_validation()

        # Print detailed results
        print("\nDETAILED BATCH RESULTS:")
        print("-" * 80)

        for batch_id, result in validation_report.batch_results.items():
            status_symbol = "[PASS]" if result.overall_status == "PASS" else "[PARTIAL]" if result.overall_status == "PARTIAL" else "[FAIL]"
            print(f"\n{status_symbol} BATCH {batch_id}: {result.batch_name}")
            print(f"   Status: {result.overall_status}")
            print(f"   Quality Score: {result.quality_score:.1f}/100")
            print(f"   Pattern Compliance: {result.pattern_compliance_score*MAXIMUM_FUNCTION_LENGTH_LINES:.1f}%")
            print(f"   Patterns Implemented: {', '.join(result.patterns_implemented) if result.patterns_implemented else 'None'}")

            if result.patterns_missing:
                print(f"   Missing Patterns: {', '.join(result.patterns_missing)}")

            print(f"   CoP Reduction: {result.cop_reduction_percentage:.1f}%")

            if result.performance_regression:
                print(f"   [WARNING] Performance Regression Detected")

            if result.critical_issues:
                print(f"   [CRITICAL] Issues: {len(result.critical_issues)}")
                for issue in result.critical_issues[:3]:  # Show first 3 issues
                    print(f"      - {issue}")

            if result.warnings:
                print(f"   [WARNING] Count: {len(result.warnings)}")
                for warning in result.warnings[:2]:  # Show first 2 warnings
                    print(f"      - {warning}")

        # Print executive summary
        print("\n" + "="*80)
        print("EXECUTIVE SUMMARY")
        print("="*80)
        print(validation_report.executive_summary)

        # Print next steps if any
        if validation_report.next_steps:
            print("\nNEXT STEPS:")
            for i, step in enumerate(validation_report.next_steps, 1):
                print(f"{i}. {step}")

        print("\n" + "="*80)
        print(f"VALIDATION COMPLETE - {validation_report.production_readiness}")
        print("="*80)

        # Return appropriate exit code
        if validation_report.production_readiness == "READY":
            print("[SUCCESS] All batches are production ready!")
            return 0
        elif validation_report.production_readiness == "CONDITIONAL":
            print("[WARNING] Some batches require attention before production")
            return 1
        else:
            print("[CRITICAL] Critical issues must be resolved before production")
            return 2

    except Exception as e:
        logger.error(f"Validation failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return 3

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))