from src.constants.base import MAXIMUM_FILE_LENGTH_LINES, MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_GOD_OBJECTS_ALLOWED, MAXIMUM_NESTED_DEPTH

Tests the complete weekly siphon system integration to address theater detection
findings. Validates that all imports work and automation can execute successfully.

Test Coverage:
- Import validation for all components
- WeeklyCycle integration with dependencies
- Siphon automation execution
- Profit calculation accuracy
- Scheduling system functionality

Security:
- Tests run in isolated environment
- No real trading or financial operations
- Mock data and simulation mode only
"""

import unittest
import sys
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import json

# Add source paths for import testing
src_path = Path(__file__).parent.parent.parent / 'src'
sys.path.insert(0, str(src_path))

class TestImportValidation(unittest.TestCase):
    """Test that all imports work correctly - addresses theater detection findings."""
    
    def test_weekly_cycle_import(self):
        """Test WeeklyCycle can be imported successfully."""
        try:
            from cycles.weekly_cycle import WeeklyCycle, CycleConfig, CyclePhase
            self.assertIsNotNone(WeeklyCycle)
            self.assertIsNotNone(CycleConfig)
            self.assertIsNotNone(CyclePhase)
        except ImportError as e:
            self.fail(f"Failed to import WeeklyCycle: {e}")
    
    def test_siphon_automator_import(self):
        """Test WeeklySiphonAutomator can be imported successfully."""
        try:
            from cycles.weekly_siphon_automator import WeeklySiphonAutomator, SiphonAutomatorConfig
            self.assertIsNotNone(WeeklySiphonAutomator)
            self.assertIsNotNone(SiphonAutomatorConfig)
        except ImportError as e:
            self.fail(f"Failed to import WeeklySiphonAutomator: {e}")
    
    def test_profit_calculator_import(self):
        """Test ProfitCalculator can be imported successfully."""
        try:
            from cycles.profit_calculator import ProfitCalculator, ProfitSplitConfig, CalculationMethod
            self.assertIsNotNone(ProfitCalculator)
            self.assertIsNotNone(ProfitSplitConfig)
            self.assertIsNotNone(CalculationMethod)
        except ImportError as e:
            self.fail(f"Failed to import ProfitCalculator: {e}")
    
    def test_trading_dependencies_import(self):
        """Test all trading dependencies can be imported."""
        try:
            from trading.portfolio_manager import PortfolioManager, PortfolioState
            from trading.trade_executor import TradeExecutor, OrderType, OrderStatus
            from trading.market_data_provider import MarketDataProvider, MarketConditions
            
            self.assertIsNotNone(PortfolioManager)
            self.assertIsNotNone(PortfolioState)
            self.assertIsNotNone(TradeExecutor)
            self.assertIsNotNone(OrderType)
            self.assertIsNotNone(OrderStatus)
            self.assertIsNotNone(MarketDataProvider)
            self.assertIsNotNone(MarketConditions)
        except ImportError as e:
            self.fail(f"Failed to import trading dependencies: {e}")
    
    def test_scheduler_import(self):
        """Test scheduler can be imported successfully."""
        try:
            from cycles.scheduler import WeeklyScheduler, SchedulerConfig
            self.assertIsNotNone(WeeklyScheduler)
            self.assertIsNotNone(SchedulerConfig)
        except ImportError as e:
            self.fail(f"Failed to import scheduler: {e}")

class TestWeeklyCycleIntegration(unittest.TestCase):
    """Test WeeklyCycle integration with dependencies."""
    
    def setUp(self):
        """Setup test environment."""
        # Import required modules
        from cycles.weekly_cycle import WeeklyCycle, CycleConfig
        from trading.portfolio_manager import PortfolioManager
        from trading.trade_executor import TradeExecutor
        from trading.market_data_provider import MarketDataProvider
        
        # Create test configuration
        self.config = CycleConfig()
        self.config.MIN_PROFIT_THRESHOLD = 60.0
        self.config.PROFIT_SPLIT_RATIO = 0.50
        
        # Create dependencies
        self.portfolio_manager = PortfolioManager(initial_cash=10000.0)
        self.trade_executor = TradeExecutor(simulation_mode=True)
        self.market_data = MarketDataProvider(simulation_mode=True)
        
        # Create WeeklyCycle with dependencies
        self.weekly_cycle = WeeklyCycle(
            portfolio_manager=self.portfolio_manager,
            trade_executor=self.trade_executor,
            market_data=self.market_data,
            config=self.config
        )
    
    def test_weekly_cycle_initialization(self):
        """Test WeeklyCycle initializes correctly with dependencies."""
        self.assertIsNotNone(self.weekly_cycle)
        self.assertEqual(self.weekly_cycle.config.PROFIT_SPLIT_RATIO, 0.50)
        self.assertIsNotNone(self.weekly_cycle.portfolio_manager)
        self.assertIsNotNone(self.weekly_cycle.trade_executor)
        self.assertIsNotNone(self.weekly_cycle.market_data)
    
    def test_manual_cycle_execution(self):
        """Test manual execution of complete weekly cycle."""
        # Execute manual cycle
        results = self.weekly_cycle.execute_manual_cycle()
        
        # Validate results structure
        self.assertIn('analysis', results)
        self.assertIn('siphon', results)
        self.assertIn('execution_time', results)
        self.assertIn('status', results)
        
        # Check that both phases completed
        self.assertEqual(results['status'], 'completed')
        self.assertIsNotNone(results['analysis'])
        self.assertIsNotNone(results['siphon'])
    
    def test_get_status(self):
        """Test status reporting functionality."""
        status = self.weekly_cycle.get_status()
        
        # Validate status structure
        self.assertIn('current_phase', status)
        self.assertIn('dependencies', status)
        self.assertIn('metrics', status)
        
        # Check dependency status
        deps = status['dependencies']
        self.assertTrue(deps['portfolio_manager'])
        self.assertTrue(deps['trade_executor'])
        self.assertTrue(deps['market_data'])

class TestSiphonAutomatorIntegration(unittest.TestCase):
    """Test WeeklySiphonAutomator integration and execution."""
    
    def setUp(self):
        """Setup test environment."""
        from cycles.weekly_siphon_automator import WeeklySiphonAutomator, SiphonAutomatorConfig
        from cycles.profit_calculator import ProfitCalculator, ProfitSplitConfig
        
        # Create test configurations
        self.siphon_config = SiphonAutomatorConfig()
        self.siphon_config.dry_run = True  # Ensure no real operations
        self.siphon_config.profit_split_ratio = 0.50
        self.siphon_config.min_profit_threshold = 60.0
        
        # Create profit calculator
        self.profit_calculator = ProfitCalculator(
            ProfitSplitConfig(split_ratio=0.50, min_threshold=60.0)
        )
        
        # Create siphon automator
        self.siphon_automator = WeeklySiphonAutomator(
            profit_calculator=self.profit_calculator,
            config=self.siphon_config
        )
    
    def test_siphon_automator_initialization(self):
        """Test siphon automator initializes correctly."""
        self.assertIsNotNone(self.siphon_automator)
        self.assertIsNotNone(self.siphon_automator.weekly_cycle)
        self.assertIsNotNone(self.siphon_automator.profit_calculator)
        self.assertTrue(self.siphon_automator.config.dry_run)
    
    def test_manual_siphon_execution(self):
        """Test manual siphon execution."""
        # Execute manual siphon
        results = self.siphon_automator.execute_manual_siphon()
        
        # Validate results structure
        self.assertIn('execution_id', results)
        self.assertIn('status', results)
        self.assertIn('timestamp', results)
        
        # Should complete successfully in dry-run mode
        self.assertIn(results['status'], ['completed', 'skipped'])
    
    def test_get_status(self):
        """Test status reporting."""
        status = self.siphon_automator.get_status()
        
        # Validate status structure
        self.assertIn('automation_enabled', status)
        self.assertIn('configuration', status)
        self.assertIn('weekly_cycle_status', status)
        
        # Check configuration
        config = status['configuration']
        self.assertEqual(config['profit_split_ratio'], 0.50)
        self.assertTrue(config['dry_run'])

class TestProfitCalculatorIntegration(unittest.TestCase):
    """Test profit calculation accuracy and 50/50 splitting logic."""
    
    def setUp(self):
        """Setup test environment."""
        from cycles.profit_calculator import ProfitCalculator, ProfitSplitConfig
        
        self.config = ProfitSplitConfig(
            split_ratio=0.50,
            min_threshold=100.0,
            max_siphon_amount=10000.0
        )
        
        self.calculator = ProfitCalculator(self.config)
    
    def test_exact_50_50_split(self):
        """Test exact 50/50 split calculation."""
        # Test data with $MAXIMUM_FILE_LENGTH_LINES profit
        profit_data = {
            'net_profit': 500.0,
            'gross_profit': 525.0,
            'fees': MAXIMUM_GOD_OBJECTS_ALLOWED.0,
            'calculation_method': 'test'
        }
        
        results = self.calculator.calculate_split(profit_data)
        
        # Verify split results
        self.assertEqual(results['split_results']['siphon_amount'], 250.0)
        self.assertEqual(results['split_results']['remaining_amount'], 250.0)
        self.assertTrue(results['split_results']['threshold_met'])
        self.assertEqual(results['split_results']['split_ratio_applied'], 0.50)
    
    def test_below_threshold_no_split(self):
        """Test no split when below threshold."""
        # Test data with $50 profit (below $MAXIMUM_FUNCTION_LENGTH_LINES threshold)
        profit_data = {
            'net_profit': 50.0,
            'gross_profit': 55.0,
            'fees': MAXIMUM_NESTED_DEPTH,
            'calculation_method': 'test'
        }
        
        results = self.calculator.calculate_split(profit_data)
        
        # Verify no split
        self.assertEqual(results['split_results']['siphon_amount'], 0.0)
        self.assertEqual(results['split_results']['remaining_amount'], 50.0)
        self.assertFalse(results['split_results']['threshold_met'])
    
    def test_max_siphon_limit(self):
        """Test maximum siphon amount limit."""
        # Test data with $MAXIMUM_GOD_OBJECTS_ALLOWED, 000 profit (would siphon $12, 500, but limit is $10, 000)
        profit_data = {
            'net_profit': 25000.0,
            'gross_profit': 25100.0,
            'fees': 60.0,
            'calculation_method': 'test'
        }
        
        results = self.calculator.calculate_split(profit_data)
        
        # Verify limit applied
        self.assertEqual(results['split_results']['siphon_amount'], 10000.0)
        self.assertEqual(results['split_results']['remaining_amount'], 15000.0)
        self.assertTrue(results['split_results']['max_limit_applied'])
    
    def test_calculation_verification(self):
        """Test calculation verification functionality."""
        profit_data = {
            'net_profit': 1000.0,
            'gross_profit': 1050.0,
            'fees': 50.0,
            'calculation_method': 'test'
        }
        
        results = self.calculator.calculate_split(profit_data)
        verification = self.calculator.verify_calculation(results)
        
        # Should pass all verification checks
        self.assertTrue(verification['passed'])
        self.assertEqual(verification['checks_passed'], verification['total_checks'])
        self.assertEqual(len(verification['issues']), 0)
    
    def test_simple_split_method(self):
        """Test simple split calculation method."""
        siphon_amount, remaining_amount = self.calculator.calculate_simple_split(600.0)
        
        self.assertEqual(siphon_amount, 300.0)
        self.assertEqual(remaining_amount, 300.0)
        
        # Test below threshold
        siphon_amount, remaining_amount = self.calculator.calculate_simple_split(50.0)
        
        self.assertEqual(siphon_amount, 0.0)
        self.assertEqual(remaining_amount, 50.0)

class TestSchedulerIntegration(unittest.TestCase):
    """Test scheduler integration and functionality."""
    
    def setUp(self):
        """Setup test environment."""
        from cycles.scheduler import WeeklyScheduler, SchedulerConfig
        
        # Create test configuration
        self.scheduler_config = SchedulerConfig()
        self.scheduler_config.execution_day = 'friday'
        self.scheduler_config.execution_time = '18:00'
        
        # Create scheduler
        self.scheduler = WeeklyScheduler(config=self.scheduler_config)
    
    def test_scheduler_initialization(self):
        """Test scheduler initializes correctly."""
        self.assertIsNotNone(self.scheduler)
        self.assertIsNotNone(self.scheduler.automator)
        self.assertEqual(self.scheduler.config.execution_day, 'friday')
        self.assertEqual(self.scheduler.config.execution_time, '18:00')
    
    @patch('cycles.scheduler.subprocess.run')
    def test_cron_time_conversion(self, mock_subprocess):
        """Test cron time format conversion."""
        # Test private method through public interface
        cron_time = self.scheduler._convert_to_cron_time()
        
        # Should be "0 18 * * 5" for Friday 6:00pm
        self.assertEqual(cron_time, "0 18 * * MAXIMUM_NESTED_DEPTH")
    
    def test_get_scheduler_status(self):
        """Test scheduler status reporting."""
        status = self.scheduler.get_scheduler_status()
        
        # Validate status structure
        self.assertIn('is_running', status)
        self.assertIn('configuration', status)
        self.assertIn('execution_count', status)
        
        # Check configuration
        config = status['configuration']
        self.assertEqual(config['execution_day'], 'friday')
        self.assertEqual(config['execution_time'], '18:00')

class TestCompleteSystemIntegration(unittest.TestCase):
    """Test complete system integration - end-to-end validation."""
    
    def test_complete_import_chain(self):
        """Test that the complete import chain works without errors."""
        try:
            # Import the main automator
            from cycles.weekly_siphon_automator import WeeklySiphonAutomator
            
            # This should successfully import WeeklyCycle
            automator = WeeklySiphonAutomator()
            
            # Verify the chain is complete
            self.assertIsNotNone(automator.weekly_cycle)
            self.assertIsNotNone(automator.weekly_cycle.portfolio_manager)
            self.assertIsNotNone(automator.weekly_cycle.trade_executor)
            self.assertIsNotNone(automator.weekly_cycle.market_data)
            
        except ImportError as e:
            self.fail(f"Complete import chain failed: {e}")
    
    def test_end_to_end_execution(self):
        """Test end-to-end execution without errors."""
        from cycles.weekly_siphon_automator import WeeklySiphonAutomator, SiphonAutomatorConfig
        
        # Create automator with safe configuration
        config = SiphonAutomatorConfig()
        config.dry_run = True
        config.profit_split_ratio = 0.50
        config.min_profit_threshold = 100.0
        
        automator = WeeklySiphonAutomator(config=config)
        
        # Execute complete cycle
        results = automator.execute_manual_siphon()
        
        # Should complete without errors
        self.assertIn('execution_id', results)
        self.assertIn('status', results)
        
        # In dry-run mode, should complete or be skipped
        self.assertIn(results['status'], ['completed', 'skipped', 'dry_run'])
    
    def test_friday_automation_schedule_validation(self):
        """Test that Friday 6:00pm scheduling is correctly configured."""
        from cycles.scheduler import WeeklyScheduler
        
        scheduler = WeeklyScheduler()
        
        # Verify Friday scheduling configuration
        self.assertEqual(scheduler.config.execution_day, 'friday')
        self.assertEqual(scheduler.config.execution_time, '18:00')  # 6:00pm
        
        # Verify cron format
        cron_format = scheduler._convert_to_cron_time()
        self.assertEqual(cron_format, "0 18 * * 5")  # Friday 6:00pm in cron format

def run_integration_tests():
    """Run all integration tests and return results."""
    # Create test suite
    test_suite = unittest.TestSuite()
    
    # Add all test classes
    test_classes = [
        TestImportValidation,
        TestWeeklyCycleIntegration,
        TestSiphonAutomatorIntegration,
        TestProfitCalculatorIntegration,
        TestSchedulerIntegration,
        TestCompleteSystemIntegration
    ]
    
    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        test_suite.addTests(tests)
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Return summary
    return {
        'tests_run': result.testsRun,
        'failures': len(result.failures),
        'errors': len(result.errors),
        'success_rate': ((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100) if result.testsRun > 0 else 0,
        'passed': len(result.failures) == 0 and len(result.errors) == 0
    }

if __name__ == '__main__':
    print("===========================================")
    
    # Run tests
    results = run_integration_tests()
    
    print(f"Failures: {results['failures']}")
    print(f"Errors: {results['errors']}")
    print(f"Success Rate: {results['success_rate']:.1f}%")
    print(f"Overall Status: {'PASS' if results['passed'] else 'FAIL'}")
    
    # Exit with appropriate code
    sys.exit(0 if results['passed'] else 1)

# Export for import validation
__all__ = [
    'TestImportValidation',
    'TestWeeklyCycleIntegration', 
    'TestSiphonAutomatorIntegration',
    'TestProfitCalculatorIntegration',
    'TestSchedulerIntegration',
    'TestCompleteSystemIntegration',
    'run_integration_tests'
]