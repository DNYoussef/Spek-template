from src.constants.base import TAKE_PROFIT_PERCENTAGE

Tests all functionality of the enterprise analyzer integration including:
- Non-breaking wrapper creation for existing analyzers
- Integration with Six Sigma telemetry, SBOM generation, and compliance
- Hook system and event-driven architecture
- Performance monitoring and feature flags
- End-to-end enterprise workflow integration
"""

import pytest
import asyncio
import time
import threading
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor

# Import the modules under test
import sys
sys.path.append(str(Path(__file__).parent.parent.parent.parent / 'src'))

from enterprise.integration.analyzer import EnterpriseAnalyzerIntegration
from enterprise.telemetry.six_sigma import SixSigmaTelemetry, QualityLevel
from enterprise.security.supply_chain import SupplyChainSecurity
from enterprise.compliance.matrix import ComplianceMatrix, ComplianceFramework
from enterprise.flags.feature_flags import flag_manager, FlagStatus

# Mock analyzer classes for testing
class MockSimpleAnalyzer:
    """Mock analyzer with basic analyze method"""
    
    def __init__(self, *args, **kwargs):
        self.name = "simple_analyzer"
        self.call_count = 0
        
    def analyze(self, data):
        """Simple synchronous analyze method"""
        self.call_count += 1
        return {"result": f"analyzed_{data}", "status": "success"}

class MockAsyncAnalyzer:
    """Mock analyzer with async analyze method"""
    
    def __init__(self, *args, **kwargs):
        self.name = "async_analyzer"
        self.call_count = 0
        
    async def analyze(self, data):
        """Async analyze method"""
        await asyncio.sleep(0.01)  # Simulate async work
        self.call_count += 1
        return {"result": f"async_analyzed_{data}", "status": "success"}

class MockFailingAnalyzer:
    """Mock analyzer that fails for testing error handling"""
    
    def __init__(self, *args, **kwargs):
        self.name = "failing_analyzer"
        
    def analyze(self, data):
        """Analyzer that always fails"""
        raise Exception("Simulated analysis failure")

class MockComplexAnalyzer:
    """Mock analyzer with complex functionality for comprehensive testing"""
    
    def __init__(self, *args, **kwargs):
        self.name = "complex_analyzer"
        self.call_count = 0
        self.last_analysis_time = None
        
    async def analyze(self, data, options=None):
        """Complex async analyzer with options"""
        self.last_analysis_time = datetime.now()
        await asyncio.sleep(0.05)  # Longer simulation
        self.call_count += 1
        
        if options and options.get("simulate_error"):
            raise ValueError("Requested simulation error")
            
        return {
            "result": f"complex_analyzed_{data}",
            "options": options or {},
            "timestamp": self.last_analysis_time.isoformat(),
            "complexity_score": 0.85
        }

class TestEnterpriseAnalyzerIntegration:
    """Test basic enterprise analyzer integration functionality"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.project_root = Path("/tmp/test_integration")
        self.integration = EnterpriseAnalyzerIntegration(self.project_root)
        
    def test_integration_initialization(self):
        """Test basic integration initialization"""
        assert self.integration.project_root == self.project_root
        assert isinstance(self.integration.existing_analyzers, dict)
        assert isinstance(self.integration.wrapped_analyzers, dict)
        assert isinstance(self.integration.analysis_history, list)
        assert isinstance(self.integration.hooks, dict)
        
        # Check enterprise components initialization
        assert isinstance(self.integration.telemetry, SixSigmaTelemetry)
        assert isinstance(self.integration.supply_chain, SupplyChainSecurity)
        assert isinstance(self.integration.compliance, ComplianceMatrix)
        
        # Verify compliance frameworks are loaded
        assert ComplianceFramework.SOC2_TYPE2 in self.integration.compliance.frameworks
        assert ComplianceFramework.ISO27001 in self.integration.compliance.frameworks
        assert ComplianceFramework.NIST_CSF in self.integration.compliance.frameworks
        
    def test_integration_with_existing_analyzers(self):
        """Test integration with existing analyzer instances"""
        existing_analyzers = {
            "simple": MockSimpleAnalyzer(),
            "async": MockAsyncAnalyzer()
        }
        
        integration = EnterpriseAnalyzerIntegration(
            self.project_root,
            existing_analyzers=existing_analyzers
        )
        
        assert integration.existing_analyzers == existing_analyzers
        assert "simple" in integration.existing_analyzers
        assert "async" in integration.existing_analyzers

class TestAnalyzerWrapping:
    """Test analyzer wrapping functionality"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.project_root = Path("/tmp/test_wrapping")
        self.integration = EnterpriseAnalyzerIntegration(self.project_root)
        
    def test_wrap_simple_analyzer(self):
        """Test wrapping simple synchronous analyzer"""
        wrapped_class = self.integration.wrap_analyzer("simple_test", MockSimpleAnalyzer)
        
        # Verify wrapped class
        assert "simple_test" in self.integration.wrapped_analyzers
        assert wrapped_class == self.integration.wrapped_analyzers["simple_test"]
        
        # Test instantiation
        wrapped_instance = wrapped_class()
        assert hasattr(wrapped_instance, '_enterprise_integration')
        assert hasattr(wrapped_instance, '_original_class')
        assert wrapped_instance._original_class == MockSimpleAnalyzer
        
        # Test enhanced functionality
        assert hasattr(wrapped_instance, 'get_compliance_status')
        assert hasattr(wrapped_instance, 'get_security_analysis')
        assert hasattr(wrapped_instance, 'get_quality_metrics')
        
    def test_wrap_async_analyzer(self):
        """Test wrapping asynchronous analyzer"""
        wrapped_class = self.integration.wrap_analyzer("async_test", MockAsyncAnalyzer)
        wrapped_instance = wrapped_class()
        
        # Should maintain async nature
        assert hasattr(wrapped_instance, 'analyze')
        assert asyncio.iscoroutinefunction(wrapped_instance.analyze)
        
    @pytest.mark.asyncio
    async def test_wrapped_analyzer_analyze_method(self):
        """Test wrapped analyzer analyze method functionality"""
        # Enable enterprise features
        flag_manager.create_flag("enterprise_telemetry", "Test telemetry", status=FlagStatus.ENABLED)
        
        wrapped_class = self.integration.wrap_analyzer("analyze_test", MockSimpleAnalyzer)
        wrapped_instance = wrapped_class()
        
        # Test analysis
        result = await wrapped_instance.analyze("test_data")
        
        assert result["result"] == "analyzed_test_data"
        assert result["status"] == "success"
        
        # Verify telemetry was recorded
        assert self.integration.telemetry.current_session_data['units_processed'] == 1
        assert self.integration.telemetry.current_session_data['units_passed'] == 1
        
        # Verify analysis history
        assert len(self.integration.analysis_history) == 1
        analysis_record = self.integration.analysis_history[0]
        assert analysis_record['analyzer'] == "analyze_test"
        assert analysis_record['success'] is True
        
    @pytest.mark.asyncio
    async def test_wrapped_analyzer_error_handling(self):
        """Test wrapped analyzer error handling"""
        wrapped_class = self.integration.wrap_analyzer("failing_test", MockFailingAnalyzer)
        wrapped_instance = wrapped_class()
        
        # Test that errors are properly handled
        with pytest.raises(Exception, match="Simulated analysis failure"):
            await wrapped_instance.analyze("test_data")
            
        # Verify error was recorded in telemetry
        assert self.integration.telemetry.current_session_data['defects'] == 1
        
        # Verify analysis history records error
        assert len(self.integration.analysis_history) == 1
        analysis_record = self.integration.analysis_history[0]
        assert analysis_record['success'] is False
        assert "Simulated analysis failure" in analysis_record['error']
        
    @pytest.mark.asyncio
    async def test_enterprise_feature_methods(self):
        """Test enterprise feature methods on wrapped analyzers"""
        # Enable enterprise features
        flag_manager.create_flag("enterprise_compliance", "Test compliance", status=FlagStatus.ENABLED)
        flag_manager.create_flag("enterprise_security", "Test security", status=FlagStatus.ENABLED)
        flag_manager.create_flag("enterprise_metrics", "Test metrics", status=FlagStatus.ENABLED)
        
        wrapped_class = self.integration.wrap_analyzer("enterprise_test", MockSimpleAnalyzer)
        wrapped_instance = wrapped_class()
        
        # Test compliance status
        compliance_status = await wrapped_instance.get_compliance_status()
        assert isinstance(compliance_status, dict)
        assert compliance_status['analyzer'] == "enterprise_test"
        assert 'soc2_compliance' in compliance_status
        assert 'iso27001_compliance' in compliance_status
        assert 'nist_compliance' in compliance_status
        
        # Test security analysis (mock the supply chain report)
        with patch.object(self.integration.supply_chain, 'generate_comprehensive_security_report', 
                        new_callable=AsyncMock) as mock_security:
            mock_security.return_value = Mock(
                security_level=Mock(value="high"),
                risk_score=0.2,
                vulnerabilities_found=0,
                sbom_generated=True,
                slsa_level=Mock(value="level3"),
                recommendations=["Enable additional monitoring"]
            )
            
            security_analysis = await wrapped_instance.get_security_analysis()
            assert isinstance(security_analysis, dict)
            assert security_analysis['analyzer'] == "enterprise_test"
            assert security_analysis['security_level'] == "high"
            assert security_analysis['risk_score'] == 0.2
            
        # Test quality metrics
        quality_metrics = wrapped_instance.get_quality_metrics()
        assert isinstance(quality_metrics, dict)
        assert quality_metrics['analyzer'] == "enterprise_test"
        assert 'dpmo' in quality_metrics
        assert 'rty' in quality_metrics
        assert 'sigma_level' in quality_metrics

class TestHookSystem:
    """Test the enterprise hook system"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.project_root = Path("/tmp/test_hooks")
        self.integration = EnterpriseAnalyzerIntegration(self.project_root)
        
    def test_hook_registration(self):
        """Test hook registration and management"""
        # Test hook registration
        def test_hook(*args):
            pass
            
        self.integration.register_hook('pre_analysis', test_hook)
        assert test_hook in self.integration.hooks['pre_analysis']
        
        # Test hook unregistration
        self.integration.unregister_hook('pre_analysis', test_hook)
        assert test_hook not in self.integration.hooks['pre_analysis']
        
    @pytest.mark.asyncio
    async def test_hooks_execution(self):
        """Test hook execution during analysis"""
        hook_calls = []
        
        def pre_hook(analysis_id, *args, **kwargs):
            hook_calls.append(('pre_analysis', analysis_id))
            
        async def async_post_hook(analysis_id, result):
            hook_calls.append(('post_analysis', analysis_id, result))
            
        def success_hook(analysis_id, result):
            hook_calls.append(('on_success', analysis_id))
            
        # Register hooks
        self.integration.register_hook('pre_analysis', pre_hook)
        self.integration.register_hook('post_analysis', async_post_hook)
        self.integration.register_hook('on_success', success_hook)
        
        # Wrap analyzer and run analysis
        wrapped_class = self.integration.wrap_analyzer("hook_test", MockSimpleAnalyzer)
        wrapped_instance = wrapped_class()
        
        result = await wrapped_instance.analyze("test_data")
        
        # Verify hooks were called
        assert len(hook_calls) == 3
        assert hook_calls[0][0] == 'pre_analysis'
        assert hook_calls[1][0] == 'post_analysis'
        assert hook_calls[2][0] == 'on_success'
        
        # Verify hook parameters
        assert 'hook_test_' in hook_calls[0][1]  # analysis_id contains analyzer name
        assert hook_calls[1][2] == result  # post_analysis hook gets result
        
    @pytest.mark.asyncio
    async def test_error_hooks(self):
        """Test error hook execution"""
        error_calls = []
        
        def error_hook(analysis_id, error):
            error_calls.append(('on_error', analysis_id, str(error)))
            
        self.integration.register_hook('on_error', error_hook)
        
        # Use failing analyzer
        wrapped_class = self.integration.wrap_analyzer("error_hook_test", MockFailingAnalyzer)
        wrapped_instance = wrapped_class()
        
        with pytest.raises(Exception):
            await wrapped_instance.analyze("test_data")
            
        # Verify error hook was called
        assert len(error_calls) == 1
        assert error_calls[0][0] == 'on_error'
        assert "Simulated analysis failure" in error_calls[0][2]
        
    def test_hook_error_handling(self):
        """Test that hook errors don't break analysis"""'
        def failing_hook(*args):
            raise Exception("Hook failure")
            
        self.integration.register_hook('pre_analysis', failing_hook)
        
        # Should not raise exception despite failing hook
        wrapped_class = self.integration.wrap_analyzer("hook_error_test", MockSimpleAnalyzer)
        wrapped_instance = wrapped_class()
        
        # This should complete despite the failing hook
        async def test_analysis():
            result = await wrapped_instance.analyze("test_data")
            assert result is not None
            
        asyncio.run(test_analysis())

class TestUnifiedAnalysisInterface:
    """Test the unified analysis interface"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.project_root = Path("/tmp/test_unified")
        self.integration = EnterpriseAnalyzerIntegration(self.project_root)
        
        # Enable all enterprise features
        flag_manager.create_flag("enterprise_telemetry", "Test telemetry", status=FlagStatus.ENABLED)
        flag_manager.create_flag("enterprise_security", "Test security", status=FlagStatus.ENABLED)
        flag_manager.create_flag("enterprise_compliance", "Test compliance", status=FlagStatus.ENABLED)
        flag_manager.create_flag("enterprise_metrics", "Test metrics", status=FlagStatus.ENABLED)
        
    @pytest.mark.asyncio
    async def test_analyze_with_enterprise_features(self):
        """Test unified analysis interface with all enterprise features"""
        # Wrap an analyzer
        self.integration.wrap_analyzer("unified_test", MockComplexAnalyzer)
        
        # Mock security report for security analysis
        with patch.object(self.integration.supply_chain, 'generate_comprehensive_security_report',
                        new_callable=AsyncMock) as mock_security:
            mock_security.return_value = Mock(
                security_level=Mock(value="high"),
                risk_score=TAKE_PROFIT_PERCENTAGE,
                vulnerabilities_found=0,
                sbom_generated=True,
                slsa_level=Mock(value="level3"),
                recommendations=["Continue monitoring"]
            )
            
            # Run unified analysis
            result = await self.integration.analyze_with_enterprise_features(
                "unified_test",
                "test_data",
                options={"complexity": "high"}
            )
            
        # Verify result structure
        assert isinstance(result, dict)
        assert result['analyzer'] == "unified_test"
        assert 'timestamp' in result
        assert 'analysis_result' in result
        assert 'quality_metrics' in result
        assert 'security_analysis' in result
        assert 'compliance_status' in result
        assert 'enterprise_features_enabled' in result
        
        # Verify analysis result
        analysis_result = result['analysis_result']
        assert "complex_analyzed_test_data" in analysis_result['result']
        assert analysis_result['options']['complexity'] == "high"
        
        # Verify quality metrics
        quality_metrics = result['quality_metrics']
        assert quality_metrics['analyzer'] == "unified_test"
        assert 'dpmo' in quality_metrics
        assert 'sigma_level' in quality_metrics
        
        # Verify security analysis
        security_analysis = result['security_analysis']
        assert security_analysis['security_level'] == "high"
        assert security_analysis['risk_score'] == 0.15
        
        # Verify compliance status
        compliance_status = result['compliance_status']
        assert compliance_status['analyzer'] == "unified_test"
        assert 'soc2_compliance' in compliance_status
        
        # Verify enterprise features status
        features_enabled = result['enterprise_features_enabled']
        assert features_enabled['telemetry'] is True
        assert features_enabled['security'] is True
        assert features_enabled['compliance'] is True
        assert features_enabled['metrics'] is True
        
    @pytest.mark.asyncio 
    async def test_analyze_with_disabled_features(self):
        """Test unified analysis with some features disabled"""
        # Disable some features
        flag_manager.create_flag("enterprise_security", "Security", status=FlagStatus.DISABLED)
        flag_manager.create_flag("enterprise_compliance", "Compliance", status=FlagStatus.DISABLED)
        
        self.integration.wrap_analyzer("disabled_test", MockSimpleAnalyzer)
        
        result = await self.integration.analyze_with_enterprise_features(
            "disabled_test",
            "test_data"
        )
        
        # Security and compliance should be None when disabled
        assert result['security_analysis'] is None
        assert result['compliance_status'] is None
        
        # Telemetry and metrics should still work
        assert result['quality_metrics'] is not None
        
        # Feature flags should reflect disabled state
        features_enabled = result['enterprise_features_enabled']
        assert features_enabled['security'] is False
        assert features_enabled['compliance'] is False
        assert features_enabled['telemetry'] is True
        assert features_enabled['metrics'] is True
        
    @pytest.mark.asyncio
    async def test_analyze_nonexistent_analyzer(self):
        """Test unified analysis with nonexistent analyzer"""
        with pytest.raises(ValueError, match="Analyzer nonexistent not found"):
            await self.integration.analyze_with_enterprise_features(
                "nonexistent",
                "test_data"
            )

class TestIntegrationStatus:
    """Test integration status and reporting"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.project_root = Path("/tmp/test_status")
        self.integration = EnterpriseAnalyzerIntegration(self.project_root)
        
    def test_get_integration_status_empty(self):
        """Test integration status with no analyzers"""
        status = self.integration.get_integration_status()
        
        assert isinstance(status, dict)
        assert status['project_root'] == str(self.project_root)
        assert status['wrapped_analyzers'] == []
        assert status['total_analyses'] == 0
        assert status['successful_analyses'] == 0
        assert status['failed_analyses'] == 0
        assert status['average_analysis_time'] == 0.0
        assert 'telemetry_status' in status
        assert 'security_level' in status
        assert 'compliance_frameworks' in status
        assert 'registered_hooks' in status
        
    @pytest.mark.asyncio
    async def test_get_integration_status_with_activity(self):
        """Test integration status after analyzer activity"""
        # Wrap analyzers and run some analyses
        self.integration.wrap_analyzer("status_test1", MockSimpleAnalyzer)
        self.integration.wrap_analyzer("status_test2", MockAsyncAnalyzer)
        
        # Run successful analyses
        wrapped_class1 = self.integration.wrapped_analyzers["status_test1"]
        wrapped_class2 = self.integration.wrapped_analyzers["status_test2"]
        
        instance1 = wrapped_class1()
        instance2 = wrapped_class2()
        
        await instance1.analyze("data1")
        await instance2.analyze("data2")
        await instance1.analyze("data3")
        
        # Run a failing analysis
        self.integration.wrap_analyzer("status_fail", MockFailingAnalyzer)
        instance_fail = self.integration.wrapped_analyzers["status_fail"]()
        
        try:
            await instance_fail.analyze("fail_data")
        except Exception:
            pass  # Expected failure
            
        status = self.integration.get_integration_status()
        
        assert len(status['wrapped_analyzers']) == 3
        assert status['total_analyses'] == 4
        assert status['successful_analyses'] == 3
        assert status['failed_analyses'] == 1
        assert status['average_analysis_time'] > 0
        
    def test_export_enterprise_report(self):
        """Test exporting comprehensive enterprise report"""
        import tempfile
        
        # Add some activity
        self.integration.wrap_analyzer("report_test", MockSimpleAnalyzer)
        
        # Generate sample history
        self.integration.analysis_history.extend([
            {
                'id': 'test_1',
                'analyzer': 'report_test',
                'timestamp': datetime.now(),
                'duration': 0.1,
                'success': True,
                'result_size': 100,
                'error': None
            },
            {
                'id': 'test_2', 
                'analyzer': 'report_test',
                'timestamp': datetime.now(),
                'duration': 0.2,
                'success': False,
                'result_size': 0,
                'error': "Test error"
            }
        ])
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            output_file = Path(f.name)
            
        try:
            result_file = self.integration.export_enterprise_report(output_file)
            
            assert result_file.exists()
            assert result_file == output_file
            
            # Verify report content
            import json
            with open(result_file) as f:
                report_data = json.load(f)
                
            assert 'report_timestamp' in report_data
            assert 'project_root' in report_data
            assert 'integration_status' in report_data
            assert 'quality_metrics' in report_data
            assert 'security_status' in report_data
            assert 'compliance_coverage' in report_data
            assert 'analysis_history' in report_data
            assert 'feature_flag_status' in report_data
            
            # Verify analysis history is limited to last 100
            assert len(report_data['analysis_history']) <= 100
            
        finally:
            if output_file.exists():
                output_file.unlink()

class TestNonBreakingIntegration:
    """Test non-breaking integration capabilities"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.project_root = Path("/tmp/test_nonbreaking")
        
    def test_create_non_breaking_integration(self):
        """Test creating non-breaking integration with module discovery"""
        # Create mock modules for testing
        mock_modules = ["test_module_1", "test_module_2"]
        
        with patch('builtins.__import__') as mock_import:
            # Mock module 1 with analyzer class
            mock_module1 = Mock()
            mock_module1.TestAnalyzer = MockSimpleAnalyzer
            mock_module1.UtilityClass = Mock()  # Should be ignored
            
            # Mock module 2 with different analyzer
            mock_module2 = Mock()
            mock_module2.AdvancedAnalyzer = MockAsyncAnalyzer
            mock_module2._private_class = Mock()  # Should be ignored
            
            def import_side_effect(name, fromlist=None):
                if name == "test_module_1":
                    return mock_module1
                elif name == "test_module_2":
                    return mock_module2
                raise ImportError(f"No module named {name}")
                
            mock_import.side_effect = import_side_effect
            
            # Mock dir() to return class names
            with patch('builtins.dir') as mock_dir:
                mock_dir.side_effect = lambda obj: {
                    mock_module1: ['TestAnalyzer', 'UtilityClass', '__name__'],
                    mock_module2: ['AdvancedAnalyzer', '_private_class', '__name__']
                }[obj]
                
                integration = EnterpriseAnalyzerIntegration.create_non_breaking_integration(
                    self.project_root,
                    existing_analyzer_modules=mock_modules
                )
                
        # Verify analyzers were wrapped
        assert len(integration.wrapped_analyzers) == 2
        assert "test_module_1_TestAnalyzer" in integration.wrapped_analyzers
        assert "test_module_2_AdvancedAnalyzer" in integration.wrapped_analyzers
        
    def test_create_non_breaking_integration_import_errors(self):
        """Test handling of import errors during integration"""
        mock_modules = ["nonexistent_module", "invalid_module"]
        
        with patch('builtins.__import__', side_effect=ImportError("Module not found")):
            integration = EnterpriseAnalyzerIntegration.create_non_breaking_integration(
                self.project_root,
                existing_analyzer_modules=mock_modules
            )
            
        # Should complete without crashing, but no analyzers wrapped
        assert len(integration.wrapped_analyzers) == 0

class TestPerformanceAndConcurrency:
    """Test performance and concurrency aspects"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.project_root = Path("/tmp/test_performance")
        self.integration = EnterpriseAnalyzerIntegration(self.project_root)
        
    @pytest.mark.asyncio
    async def test_concurrent_analysis_performance(self):
        """Test performance with concurrent analyses"""
        # Wrap multiple analyzers
        for i in range(5):
            self.integration.wrap_analyzer(f"perf_test_{i}", MockComplexAnalyzer)
            
        # Run concurrent analyses
        tasks = []
        start_time = time.time()
        
        for i in range(20):  # 20 concurrent analyses
            analyzer_name = f"perf_test_{i % 5}"
            wrapped_class = self.integration.wrapped_analyzers[analyzer_name]
            instance = wrapped_class()
            
            task = instance.analyze(f"data_{i}")
            tasks.append(task)
            
        results = await asyncio.gather(*tasks, return_exceptions=True)
        duration = time.time() - start_time
        
        # Verify all analyses completed
        assert len(results) == 20
        successful_results = [r for r in results if isinstance(r, dict)]
        assert len(successful_results) == 20
        
        # Should complete reasonably quickly with async execution
        assert duration < 5.0  # Should be much faster than 20 * 0.05 = 1 second
        
        # Verify analysis history
        assert len(self.integration.analysis_history) == 20
        
    def test_memory_efficiency_large_history(self):
        """Test memory efficiency with large analysis history"""
        # Generate large history
        for i in range(1500):  # More than the 1000 limit
            self.integration.analysis_history.append({
                'id': f'test_{i}',
                'analyzer': 'memory_test',
                'timestamp': datetime.now(),
                'duration': 0.1,
                'success': True,
                'result_size': 100,
                'error': None
            })
            
        # History should be limited to 1000 entries
        assert len(self.integration.analysis_history) == 1000
        
        # Should keep the most recent entries
        last_entry = self.integration.analysis_history[-1]
        assert last_entry['id'] == 'test_1499'
        
        first_entry = self.integration.analysis_history[0]
        assert first_entry['id'] == 'test_500'  # 1500 - 1000 = 500
        
    def test_telemetry_performance_impact(self):
        """Test telemetry performance impact"""
        # Time analysis without enterprise features
        flag_manager.create_flag("enterprise_telemetry", "Telemetry", status=FlagStatus.DISABLED)
        
        wrapped_class = self.integration.wrap_analyzer("no_telemetry", MockSimpleAnalyzer)
        instance = wrapped_class()
        
        start_time = time.time()
        for _ in range(100):
            asyncio.run(instance.analyze("test"))
        duration_without = time.time() - start_time
        
        # Enable telemetry
        flag_manager.update_flag("enterprise_telemetry", status=FlagStatus.ENABLED)
        
        start_time = time.time()
        for _ in range(100):
            asyncio.run(instance.analyze("test"))
        duration_with = time.time() - start_time
        
        # Telemetry should add minimal overhead
        overhead = duration_with - duration_without
        assert overhead < 0.1  # Less than 100ms overhead for 100 calls
        
    def test_concurrent_hook_execution(self):
        """Test thread safety of hook execution"""
        hook_calls = []
        hook_calls_lock = threading.Lock()
        
        def thread_safe_hook(analysis_id, *args):
            with hook_calls_lock:
                hook_calls.append(threading.current_thread().ident)
                
        self.integration.register_hook('pre_analysis', thread_safe_hook)
        
        wrapped_class = self.integration.wrap_analyzer("concurrent_hook", MockSimpleAnalyzer)
        
        async def run_analysis(i):
            instance = wrapped_class()
            await instance.analyze(f"data_{i}")
            
        # Run concurrent analyses
        async def run_concurrent_tests():
            tasks = [run_analysis(i) for i in range(50)]
            await asyncio.gather(*tasks)
            
        asyncio.run(run_concurrent_tests())
        
        # All hook calls should have completed
        assert len(hook_calls) == 50

class TestErrorHandlingAndEdgeCases:
    """Test error handling and edge cases"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.project_root = Path("/tmp/test_errors")
        self.integration = EnterpriseAnalyzerIntegration(self.project_root)
        
    def test_wrapping_invalid_analyzers(self):
        """Test wrapping classes without analyze methods"""
        class InvalidAnalyzer:
            def process(self, data):  # Wrong method name
                return "processed"
                
        # Should still wrap, but analyze method won't work as expected
        wrapped_class = self.integration.wrap_analyzer("invalid", InvalidAnalyzer)
        instance = wrapped_class()
        
        # Should have enterprise methods
        assert hasattr(instance, 'get_quality_metrics')
        
    @pytest.mark.asyncio
    async def test_analyzer_with_complex_signatures(self):
        """Test analyzers with complex method signatures"""
        class ComplexSignatureAnalyzer:
            def analyze(self, data, *args, param1=None, param2="default", **kwargs):
                return {
                    "data": data,
                    "args": args,
                    "param1": param1,
                    "param2": param2,
                    "kwargs": kwargs
                }
                
        wrapped_class = self.integration.wrap_analyzer("complex_sig", ComplexSignatureAnalyzer)
        instance = wrapped_class()
        
        # Test with various parameter combinations
        result = await instance.analyze(
            "test_data", 
            "extra_arg",
            param1="custom",
            custom_kwarg="value"
        )
        
        assert result["data"] == "test_data"
        assert result["args"] == ("extra_arg",)
        assert result["param1"] == "custom"
        assert result["param2"] == "default"
        assert result["kwargs"]["custom_kwarg"] == "value"
        
    @pytest.mark.asyncio
    async def test_hook_execution_errors(self):
        """Test hook execution with various error scenarios"""
        error_count = 0
        
        def counting_hook(*args):
            nonlocal error_count
            error_count += 1
            if error_count % 2 == 0:  # Fail every second call
                raise Exception("Hook error")
                
        self.integration.register_hook('pre_analysis', counting_hook)
        
        wrapped_class = self.integration.wrap_analyzer("hook_errors", MockSimpleAnalyzer)
        instance = wrapped_class()
        
        # Run multiple analyses - some hooks will fail
        results = []
        for i in range(5):
            try:
                result = await instance.analyze(f"data_{i}")
                results.append(result)
            except Exception as e:
                results.append(f"error: {e}")
                
        # All analyses should complete despite hook failures
        assert len(results) == 5
        successful_results = [r for r in results if isinstance(r, dict)]
        assert len(successful_results) == 5  # All analyses should succeed
        
    def test_integration_status_calculation_edge_cases(self):
        """Test integration status calculation with edge cases"""
        # Add analysis records with extreme values
        extreme_records = [
            {
                'id': 'fast',
                'analyzer': 'test',
                'timestamp': datetime.now(),
                'duration': 0.001,  # Very fast
                'success': True,
                'result_size': 0,
                'error': None
            },
            {
                'id': 'slow',
                'analyzer': 'test',
                'timestamp': datetime.now(),
                'duration': 10.0,  # Very slow
                'success': True,
                'result_size': 1000000,  # Large result
                'error': None
            },
            {
                'id': 'error',
                'analyzer': 'test',
                'timestamp': datetime.now(),
                'duration': 0.5,
                'success': False,
                'result_size': 0,
                'error': "Test error"
            }
        ]
        
        self.integration.analysis_history.extend(extreme_records)
        
        status = self.integration.get_integration_status()
        
        # Should handle extreme values gracefully
        assert isinstance(status['average_analysis_time'], float)
        assert status['average_analysis_time'] > 0
        assert status['total_analyses'] == 3
        assert status['successful_analyses'] == 2
        assert status['failed_analyses'] == 1
        
    @pytest.mark.asyncio
    async def test_feature_flag_race_conditions(self):
        """Test feature flag race conditions during analysis"""
        wrapped_class = self.integration.wrap_analyzer("race_test", MockSimpleAnalyzer)
        
        # Create a flag that will be toggled during analysis
        flag_manager.create_flag("race_flag", "Race test", status=FlagStatus.ENABLED)
        
        async def toggle_flag():
            """Toggle flag state during analysis"""
            await asyncio.sleep(0.01)
            flag_manager.update_flag("race_flag", status=FlagStatus.DISABLED)
            await asyncio.sleep(0.01)
            flag_manager.update_flag("race_flag", status=FlagStatus.ENABLED)
            
        async def run_analysis():
            """Run analysis that checks flags"""
            instance = wrapped_class()
            return await instance.analyze("test_data")
            
        # Run concurrent flag toggling and analysis
        toggle_task = asyncio.create_task(toggle_flag())
        analysis_tasks = [asyncio.create_task(run_analysis()) for _ in range(10)]
        
        # Wait for all tasks
        await toggle_task
        results = await asyncio.gather(*analysis_tasks, return_exceptions=True)
        
        # All analyses should complete successfully despite flag changes
        successful_results = [r for r in results if isinstance(r, dict)]
        assert len(successful_results) == 10

if __name__ == "__main__":
    pytest.main([__file__, "-v"])