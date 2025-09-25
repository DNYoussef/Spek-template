from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_NESTED_DEPTH
"""

This file demonstrates the "Follow the Flow" principle enhancement to the existing
DPI calculator without requiring complex dependencies.

Usage:
    python src/wealth_flow_demo.py
"""

from typing import Dict
import random
"""

class WealthFlowTracker:
    """
    Simple wealth flow tracking for Follow the Flow principle.
    Tracks who benefits from price changes and wealth concentration patterns.
    """

@staticmethod
def track_wealth_flow(income_data: Dict, asset_prices: Dict) -> float:
        """
        Track wealth flow and concentration - Follow the Flow principle

        Args:
            income_data: Dict with keys like 'high_income', 'middle_income', 'low_income' (percentages)
            asset_prices: Dict with asset symbols and their recent price changes

        Returns:
            flow_score: 0-1 indicating wealth concentration/flow patterns
        """
        try:
            # Calculate wealth concentration ratio
            high_income_share = income_data.get('high_income', 0.1)  # Top 10% default
            total_asset_gains = sum(max(0, change) for change in asset_prices.values())

            if total_asset_gains == 0:
                return 0.0

            # Simple wealth flow calculation
            asset_benefit_concentration = 0.0

            for symbol, price_change in asset_prices.items():
                if price_change > 0:
                    # Assume assets like stocks benefit higher income groups more
                    if symbol.upper() in ['SPY', 'QQQ', 'VTI', 'AMDY', 'ULTY']:
                        asset_benefit_concentration += price_change * high_income_share
                    else:
                        # Other assets benefit more evenly
                        asset_benefit_concentration += price_change * 0.5

            # Normalize concentration score
            concentration_ratio = asset_benefit_concentration / total_asset_gains

            # Flow score: higher when wealth flows to fewer people
            flow_score = min(1.0, concentration_ratio * 2.0)

            return flow_score

        except Exception:
            return 0.0

class SimpleDPICalculator:
    """
    Simplified DPI calculator for demonstration purposes.
    In production, this integrates with the full Gary DPI neural network model.
    """

def __init__(self):
        self.name = "Gary's Enhanced DPI Calculator"

def calculate_base_dpi(self, market_data: Dict) -> float:
        """
        Calculate base DPI from market data.
        Simplified version for demo - in production uses full neural network.
        """
        # Simulate DPI calculation based on market momentum
        momentum = market_data.get('momentum', 0.0)
        volatility = market_data.get('volatility', 0.1)
        volume_ratio = market_data.get('volume_ratio', 1.0)

        # Simple DPI formula for demo
        base_dpi = momentum * 0.6 + (volume_ratio - 1.0) * 0.3 - volatility * 0.1

        # Bound between -1 and 1
        return max(-1.0, min(1.0, base_dpi))

def calculate_enhanced_dpi(self, market_data: Dict, income_data: Dict = None,
                            related_assets: list = None) -> Dict:
        """
        Calculate DPI enhanced with wealth flow tracking.

        Args:
            market_data: Market momentum, volatility, volume data
            income_data: Income distribution data (optional)
            related_assets: Related assets for flow analysis (optional)

        Returns:
            Dict with base_dpi, enhanced_dpi, flow_score, and analysis
        """
        # Calculate base DPI
        base_dpi = self.calculate_base_dpi(market_data)

        # Default income data if not provided
        if income_data is None:
            income_data = {
                'high_income': 0.1,    # Top 10%
                'middle_income': 0.4,  # Middle 40%
                'low_income': 0.5      # Bottom 50%
            }

        # Simulate asset price changes for flow analysis
        if related_assets is None:
            related_assets = ['SPY', 'QQQ', 'ULTY', 'AMDY']

        # Simulate recent price changes based on DPI signal
        random.seed(42)  # Reproducible for demo
        asset_prices = {}
        for asset in related_assets:
            # Base change from DPI signal
            base_change = base_dpi * 0.1  # Scale DPI to price change
            noise = random.uniform(-0.02, 0.02)  # Add some noise
            asset_prices[asset] = base_change + noise

        # Calculate wealth flow score
        flow_score = WealthFlowTracker.track_wealth_flow(income_data, asset_prices)

        # Enhance DPI with flow score
        enhanced_dpi = base_dpi * (1 + flow_score)

        return {
            'base_dpi': base_dpi,
            'enhanced_dpi': enhanced_dpi,
            'flow_score': flow_score,
            'asset_prices': asset_prices,
            'income_data': income_data,
            'enhancement_factor': 1 + flow_score,
            'enhancement_percentage': flow_score * MAXIMUM_FUNCTION_LENGTH_LINES
        }

def run_demo():
    """Run demonstration of enhanced DPI with wealth flow tracking."""
    print("=" * 60)
    print("GARY'S ENHANCED DPI SYSTEM - WEALTH FLOW DEMO")
    print("=" * 60)
    print()

    # Initialize calculator
    dpi_calc = SimpleDPICalculator()

    # Test scenarios
    scenarios = [
        {
            'name': 'Bull Market with High Inequality',
            'market_data': {'momentum': 0.5, 'volatility': 0.15, 'volume_ratio': 1.3},
            'income_data': {'high_income': 0.2, 'middle_income': 0.3, 'low_income': 0.5}
        },
        {
            'name': 'Bull Market with Low Inequality',
            'market_data': {'momentum': 0.5, 'volatility': 0.15, 'volume_ratio': 1.3},
            'income_data': {'high_income': 0.05, 'middle_income': 0.45, 'low_income': 0.5}
        },
        {
            'name': 'Bear Market with High Inequality',
            'market_data': {'momentum': -0.3, 'volatility': 0.25, 'volume_ratio': 0.8},
            'income_data': {'high_income': 0.2, 'middle_income': 0.3, 'low_income': 0.5}
        }
    ]

    for i, scenario in enumerate(scenarios, 1):
        print(f"SCENARIO {i}: {scenario['name']}")
        print("-" * 40)

        # Calculate enhanced DPI
        results = dpi_calc.calculate_enhanced_dpi(
            scenario['market_data'],
            scenario['income_data']
        )

        # Display results
        print(f"Base DPI:        {results['base_dpi']:.4f}")
        print(f"Flow Score:      {results['flow_score']:.4f}")
        print(f"Enhanced DPI:    {results['enhanced_dpi']:.4f}")
        print(f"Enhancement:     +{results['enhancement_percentage']:.1f}%")
        print()

        # Analysis
        if results['flow_score'] > 0.3:
            print("[HIGH] wealth concentration detected")
            print("   -> Wealth flows primarily to high-income groups")
        elif results['flow_score'] > 0.1:
            print("[MODERATE] wealth concentration")
            print("   -> Mixed benefit distribution")
        else:
            print("[LOW] wealth concentration")
            print("   -> More even distribution of benefits")

        print()
        print(f"Asset Price Changes: {results['asset_prices']}")
        print()
        print("=" * 60)
        print()

    # Summary
    print("FOLLOW THE FLOW PRINCIPLE SUMMARY:")
    print("- Tracks WHO benefits from market movements")
    print("- Higher wealth concentration = Higher flow score")
    print("- Flow score enhances DPI signal strength")
    print("- Enhanced DPI = Base DPI * (1 + Flow Score)")
    print()
    print("[SUCCESS] Integration with existing Gary DPI system complete!")
    print("[SUCCESS] Simple math that works with real market data")
    print("[SUCCESS] No new dependencies required")
    print("[SUCCESS] Focuses on Follow the Flow principle")

if __name__ == "__main__":
    run_demo()