#!/usr/bin/env python3
"""
Import Fix Validation Test
Tests that all previously failing imports now work correctly.
"""

from pathlib import Path
import sys

# Add src to path for imports
project_root = Path(__file__).parent.parent
src_path = project_root / 'src'
sys.path.insert(0, str(src_path))

def test_dpi_import():
    """Test DPI calculator import that was previously failing."""
    try:
        from strategies.dpi_calculator import DistributionalPressureIndex
        print(" DistributionalPressureIndex import successful")

        # Test instantiation
        dpi = DistributionalPressureIndex()
        print(" DPI instantiation successful")

        # Test calculation
        dpi_value, components = dpi.calculate_dpi("TEST")
        print(f" DPI calculation successful: {dpi_value:.4f}")

        return True
    except Exception as e:
        print(f" DPI import failed: {e}")
        return False

def test_kelly_import():
    """Test Kelly criterion import."""
    try:
        from risk.kelly_criterion import KellyCriterionCalculator, KellyInputs
        print(" Kelly imports successful")

        # Test with DPI integration (the failing import)
        from strategies.dpi_calculator import DistributionalPressureIndex

        dpi_calc = DistributionalPressureIndex()
        kelly_calc = KellyCriterionCalculator(dpi_calc)
        print(" Kelly + DPI integration successful")

        return True
    except Exception as e:
        print(f" Kelly import failed: {e}")
        return False

def test_position_sizing_import():
    """Test dynamic position sizing import."""
    try:
        from risk.dynamic_position_sizing import DynamicPositionSizer, RiskLevel
        print(" Position sizing imports successful")

        # Test with dependencies
        from strategies.dpi_calculator import DistributionalPressureIndex
        from risk.kelly_criterion import KellyCriterionCalculator

        dpi_calc = DistributionalPressureIndex()
        kelly_calc = KellyCriterionCalculator(dpi_calc)
        sizer = DynamicPositionSizer(
            config=None,  # Will use defaults
            kelly_calculator=kelly_calc,
            dpi_calculator=dpi_calc
        )
        print(" Full integration chain successful")

        return True
    except Exception as e:
        print(f" Position sizing import failed: {e}")
        return False

def test_reality_checker_compatibility():
    """Test that the reality checker can now import the fixed modules."""
    try:
        # Simulate the imports that were failing in reality_check_test.py

        # This was the failing line: from src.strategies.dpi_calculator import DistributionalPressureIndex
        from strategies.dpi_calculator import DistributionalPressureIndex

        # Test Kelly system that was partially working
        from risk.kelly_criterion import create_kelly_calculator, KellyInputs
        from decimal import Decimal

        # Test the workflow that was broken
        inputs = KellyInputs(
            symbol="REALITY_TEST",
            win_rate=0.55,
            average_win=0.2,
            average_loss=0.15,
            current_capital=Decimal('100000'),
            max_position_size=0.1
        )

        kelly_calc = create_kelly_calculator()
        result = kelly_calc.calculate_kelly_position(inputs)

        print(f" Reality checker compatibility confirmed")
        print(f"  Kelly fraction: {result.kelly_fraction:.4f}")
        print(f"  DPI adjusted: {result.dpi_adjusted_fraction:.4f}")
        print(f"  Position: ${result.recommended_position_size}")

        return True
    except Exception as e:
        print(f" Reality checker compatibility failed: {e}")
        return False

def main():
    """Run all import fix tests."""
    print("IMPORT FIX VALIDATION")
    print("=" * 50)

    tests = [
        test_dpi_import,
        test_kelly_import,
        test_position_sizing_import,
        test_reality_checker_compatibility
    ]

    results = []
    for test in tests:
        results.append(test())

    print("\n" + "=" * 50)
    print("IMPORT FIX SUMMARY")
    print("=" * 50)

    passed = sum(results)
    total = len(results)

    if passed == total:
        print(" ALL IMPORT FAILURES FIXED")
        print(" System fully operational")
        return 0
    else:
        print(" Some import failures remain")
        return 1

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)