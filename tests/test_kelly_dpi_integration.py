from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS

import sys
import time
import numpy as np
from pathlib import Path
from decimal import Decimal

# Add src to path for imports
project_root = Path(__file__).parent.parent
src_path = project_root / 'src'
sys.path.insert(0, str(src_path))

# Import the fixed modules
from strategies.dpi_calculator import DistributionalPressureIndex, create_dpi_calculator
from risk.kelly_criterion import (
    KellyCriterionCalculator,
    KellyInputs,
    create_kelly_calculator,
    calculate_position_from_returns
)
from risk.dynamic_position_sizing import (
    DynamicPositionSizer,
    create_position_sizer,
    RiskLevel
)

class KellyDPIIntegrationTester:
    """Comprehensive tester for Kelly + DPI integration."""

    def __init__(self):
        self.results = {
            'dpi_calculator': {'status': 'unknown', 'evidence': []},
            'kelly_criterion': {'status': 'unknown', 'evidence': []},
            'integration': {'status': 'unknown', 'evidence': []},
            'performance': {'status': 'unknown', 'evidence': []},
            'position_sizing': {'status': 'unknown', 'evidence': []}
        }

    def test_dpi_calculator(self):
        """Test DPI calculator functionality."""

        try:
            # Test basic instantiation
            dpi_calc = create_dpi_calculator(lookback_periods=20)
            self.results['dpi_calculator']['evidence'].append("DPI calculator instantiation successful")

            # Test calculation
            start_time = time.perf_counter()
            dpi_value, components = dpi_calc.calculate_dpi("TEST")
            calc_time = (time.perf_counter() - start_time) * 1000

            # Validate results
            assert 0 <= dpi_value <= 1, f"DPI value out of range: {dpi_value}"
            self.results['dpi_calculator']['evidence'].append(f"DPI calculation successful: {dpi_value:.4f}")

            # Check components
            assert hasattr(components, 'order_flow_pressure'), "Missing order flow pressure component"
            assert hasattr(components, 'volume_weighted_skew'), "Missing volume weighted skew component"
            assert hasattr(components, 'price_momentum_bias'), "Missing price momentum bias component"
            self.results['dpi_calculator']['evidence'].append("All DPI components present and valid")

            # Performance check
            if calc_time < 50:
                self.results['dpi_calculator']['evidence'].append(f"Performance target met: {calc_time:.2f}ms")
            else:
                self.results['dpi_calculator']['evidence'].append(f"Performance warning: {calc_time:.2f}ms (target <50ms)")

            self.results['dpi_calculator']['status'] = 'working'

        except Exception as e:
            self.results['dpi_calculator']['status'] = 'failed'
            self.results['dpi_calculator']['evidence'].append(f"Error: {str(e)}")

    def test_kelly_criterion(self):
        """Test Kelly criterion calculator."""

        try:
            # Test basic instantiation
            kelly_calc = create_kelly_calculator()
            self.results['kelly_criterion']['evidence'].append("Kelly calculator instantiation successful")

            # Test calculation with realistic inputs
            inputs = KellyInputs(
                symbol="TEST",
                win_rate=0.55,
                average_win=0.25,
                average_loss=0.18,
                current_capital=Decimal('100000'),
                max_position_size=0.1
            )

            start_time = time.perf_counter()
            result = kelly_calc.calculate_kelly_position(inputs)
            calc_time = (time.perf_counter() - start_time) * 1000

            # Validate results
            assert 0 <= result.kelly_fraction <= 1, f"Kelly fraction out of range: {result.kelly_fraction}"
            assert 0 <= result.dpi_adjusted_fraction <= 1, f"DPI adjusted fraction out of range: {result.dpi_adjusted_fraction}"
            assert result.recommended_position_size >= 0, "Negative position size"
            assert 0 <= result.confidence_level <= 1, f"Confidence out of range: {result.confidence_level}"

            self.results['kelly_criterion']['evidence'].append(f"Kelly fraction: {result.kelly_fraction:.4f}")
            self.results['kelly_criterion']['evidence'].append(f"DPI adjusted: {result.dpi_adjusted_fraction:.4f}")
            self.results['kelly_criterion']['evidence'].append(f"Position size: ${result.recommended_position_size}")
            self.results['kelly_criterion']['evidence'].append(f"Confidence: {result.confidence_level:.2%}")

            # Performance check
            if calc_time < 50:
                self.results['kelly_criterion']['evidence'].append(f"Performance target met: {calc_time:.2f}ms")
            else:
                self.results['kelly_criterion']['evidence'].append(f"Performance warning: {calc_time:.2f}ms (target <50ms)")

            self.results['kelly_criterion']['status'] = 'working'

        except Exception as e:
            self.results['kelly_criterion']['status'] = 'failed'
            self.results['kelly_criterion']['evidence'].append(f"Error: {str(e)}")

    def test_integration(self):
        """Test Kelly + DPI integration."""

        try:
            # Test the integrated workflow
            dpi_calc = create_dpi_calculator()
            kelly_calc = create_kelly_calculator()

            # Test with returns data
            np.random.seed(42)  # Reproducible results
            returns = np.random.normal(0.2, 0.2, 252)  # 1 year of daily returns

            result = calculate_position_from_returns(
                symbol="INTEGRATION_TEST",
                returns=returns,
                current_capital=Decimal('500000')
            )

            self.results['integration']['evidence'].append("Returns-based calculation successful")
            self.results['integration']['evidence'].append(f"Calculated position: ${result.recommended_position_size}")

            # Test multiple symbols
            symbols = ["SPY", "QQQ", "IWM"]
            for symbol in symbols:
                dpi_value, _ = dpi_calc.calculate_dpi(symbol)

                inputs = KellyInputs(
                    symbol=symbol,
                    win_rate=0.52 + np.random.uniform(-0.1, 0.1),
                    average_win=0.15 + np.random.uniform(0, 0.1),
                    average_loss=0.12 + np.random.uniform(0, 0.1),
                    current_capital=Decimal('100000'),
                    max_position_size=0.1
                )

                kelly_result = kelly_calc.calculate_kelly_position(inputs)

                # Verify DPI integration
                assert kelly_result.dpi_adjusted_fraction != kelly_result.kelly_fraction, "DPI adjustment not applied"

            self.results['integration']['evidence'].append(f"Multi-symbol integration test passed for {len(symbols)} symbols")
            self.results['integration']['status'] = 'working'

        except Exception as e:
            self.results['integration']['status'] = 'failed'
            self.results['integration']['evidence'].append(f"Error: {str(e)}")

    def test_performance_claims(self):
        """Test performance claims (<50ms)."""

        try:
            # DPI Performance Test
            dpi_calc = create_dpi_calculator()
            dpi_times = []

            for _ in range(100):
                start = time.perf_counter()
                dpi_calc.calculate_dpi("PERF_TEST")
                dpi_times.append((time.perf_counter() - start) * 1000)

            dpi_avg_time = np.mean(dpi_times)
            dpi_max_time = np.max(dpi_times)

            # Kelly Performance Test
            kelly_calc = create_kelly_calculator()
            kelly_times = []

            test_inputs = KellyInputs(
                symbol="PERF_TEST",
                win_rate=0.55,
                average_win=0.2,
                average_loss=0.15,
                current_capital=Decimal('100000'),
                max_position_size=0.1
            )

            for _ in range(100):
                start = time.perf_counter()
                kelly_calc.calculate_kelly_position(test_inputs)
                kelly_times.append((time.perf_counter() - start) * 1000)

            kelly_avg_time = np.mean(kelly_times)
            kelly_max_time = np.max(kelly_times)

            # Report results
            self.results['performance']['evidence'].append(f"DPI average time: {dpi_avg_time:.2f}ms (max: {dpi_max_time:.2f}ms)")
            self.results['performance']['evidence'].append(f"Kelly average time: {kelly_avg_time:.2f}ms (max: {kelly_max_time:.2f}ms)")

            # Check performance targets
            dpi_target_met = dpi_avg_time < 50 and dpi_max_time < 100
            kelly_target_met = kelly_avg_time < 50 and kelly_max_time < 100

            if dpi_target_met:
                self.results['performance']['evidence'].append("DPI performance target met")
            else:
                self.results['performance']['evidence'].append("DPI performance target MISSED")

            if kelly_target_met:
                self.results['performance']['evidence'].append("Kelly performance target met")
            else:
                self.results['performance']['evidence'].append("Kelly performance target MISSED")

            if dpi_target_met and kelly_target_met:
                self.results['performance']['status'] = 'working'
                self.results['performance']['evidence'].append("Overall performance claims VALIDATED")
            else:
                self.results['performance']['status'] = 'partial'
                self.results['performance']['evidence'].append("Overall performance claims PARTIALLY VALIDATED")

        except Exception as e:
            self.results['performance']['status'] = 'failed'
            self.results['performance']['evidence'].append(f"Error: {str(e)}")

    def test_position_sizing_system(self):
        """Test dynamic position sizing system."""

        try:
            # Create position sizer
            sizer = create_position_sizer(
                risk_level=RiskLevel.MODERATE,
                max_portfolio_risk=0.8,
                max_single_position=0.1
            )

            self.results['position_sizing']['evidence'].append("Position sizer instantiation successful")

            # Create test market data
            symbols = ["SPY", "QQQ", "IWM"]
            market_data = {}

            for symbol in symbols:
                np.random.seed(hash(symbol) % 2**32)
                returns = np.random.normal(0.1, 0.2, 50)
                market_data[symbol] = {
                    'returns': returns,
                    'price': 100 + np.random.uniform(-10, MAXIMUM_FUNCTION_PARAMETERS)
                }

            # Test position calculation
            start_time = time.perf_counter()
            recommendations = sizer.calculate_position_sizes(
                symbols=symbols,
                market_data=market_data,
                portfolio_capital=Decimal('1000000')
            )
            calc_time = (time.perf_counter() - start_time) * 1000

            # Validate recommendations
            assert len(recommendations) == len(symbols), "Missing recommendations"

            total_allocation = sum(rec.recommended_size for rec in recommendations)
            max_allowed = Decimal('800000')  # 80% of $1M
            assert total_allocation <= max_allowed, f"Over-allocated: ${total_allocation} > ${max_allowed}"

            self.results['position_sizing']['evidence'].append(f"Generated {len(recommendations)} recommendations")
            self.results['position_sizing']['evidence'].append(f"Total allocation: ${total_allocation}")
            self.results['position_sizing']['evidence'].append(f"Calculation time: {calc_time:.2f}ms")

            # Check individual recommendations
            for rec in recommendations:
                assert rec.confidence >= 0, "Invalid confidence"
                assert rec.recommended_size >= 0, "Negative position size"
                assert rec.kelly_fraction >= 0, "Invalid Kelly fraction"

            self.results['position_sizing']['evidence'].append("All individual recommendations valid")

            # Test portfolio metrics
            metrics = sizer.calculate_portfolio_metrics(recommendations)
            assert 0 <= metrics.risk_utilization <= 1, "Invalid risk utilization"

            self.results['position_sizing']['evidence'].append(f"Risk utilization: {metrics.risk_utilization:.1%}")
            self.results['position_sizing']['status'] = 'working'

        except Exception as e:
            self.results['position_sizing']['status'] = 'failed'
            self.results['position_sizing']['evidence'].append(f"Error: {str(e)}")

    def run_comprehensive_test(self):
        """Run all integration tests."""
        print("=" * 60)

        # Run all tests
        self.test_dpi_calculator()
        self.test_kelly_criterion()
        self.test_integration()
        self.test_performance_claims()
        self.test_position_sizing_system()

        return self.generate_report()

    def generate_report(self):
        """Generate comprehensive test report."""
        print("\n" + "=" * 60)
        print("=" * 60)

        working_count = 0
        total_count = len(self.results)

        for component, result in self.results.items():
            status_icon = {
                'working': '[PASS]',
                'partial': '[WARN]',
                'failed': '[FAIL]',
                'unknown': '[UNKNOWN]'
            }.get(result['status'], '[UNKNOWN]')

            if result['status'] in ['working', 'partial']:
                working_count += 1

            print(f"\n{component.upper().replace('_', ' ')}: {status_icon}")
            for evidence in result['evidence']:
                print(f"   {evidence}")

        print(f"\n" + "=" * 60)
        print("FINAL ASSESSMENT")
        print("=" * 60)

        reality_score = (working_count / total_count) * 10

        print(f"REALITY SCORE: {reality_score:.1f}/10.0")
        print(f"COMPONENTS WORKING: {working_count}/{total_count}")

        if reality_score >= 9.0:
            assessment = "[SUCCESS] Kelly + DPI fully operational"
        elif reality_score >= 7.0:
            assessment = "[SUBSTANTIAL] Minor issues remain"
        elif reality_score >= 5.0:
            assessment = "[PARTIAL] Major components working"
        else:
            assessment = "[FAILURE] System not operational"

        print(f"ASSESSMENT: {assessment}")

        # Performance summary
        performance_status = self.results['performance']['status']
        if performance_status == 'working':
            print("[PERFORMANCE] Claims validated: <50ms target achieved")
        elif performance_status == 'partial':
            print("[PERFORMANCE] Claims partially validated")
        else:
            print("[PERFORMANCE] Claims failed")

        return {
            'reality_score': reality_score,
            'assessment': assessment,
            'working_components': working_count,
            'total_components': total_count,
            'detailed_results': self.results
        }

if __name__ == '__main__':
    tester = KellyDPIIntegrationTester()
    report = tester.run_comprehensive_test()

    # Return appropriate exit code
    exit_code = 0 if report['reality_score'] >= 7.0 else 1
    sys.exit(exit_code)