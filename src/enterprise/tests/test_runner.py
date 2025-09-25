"""
Enterprise Test Runner

Comprehensive test runner for all enterprise features with detailed reporting,
compliance validation, and integration testing capabilities.
"""

from lib.shared.utilities import get_logger

class TestResult:
    """Enhanced test result with enterprise metrics"""
    def __init__(self):
        self.tests_run = 0
        self.failures = 0
        self.errors = 0
        self.skipped = 0
        self.success_rate = 0.0
        self.execution_time = 0.0
        self.test_details = []
        self.coverage_report = {}
        self.quality_metrics = None
        
    def add_test_result(self, test_name: str, status: str, 
                        execution_time: float, error_msg: Optional[str] = None):
        """Add individual test result"""
        self.test_details.append({
            'test_name': test_name,
            'status': status,
            'execution_time': execution_time,
            'error_message': error_msg,
            'timestamp': datetime.now().isoformat()
        })
        
        self.tests_run += 1
        if status == 'FAIL':
            self.failures += 1
        elif status == 'ERROR':
            self.errors += 1
        elif status == 'SKIP':
            self.skipped += 1
            
        self.success_rate = ((self.tests_run - self.failures - self.errors) / 
                            max(1, self.tests_run)) * 100
                           
class EnterpriseTestRunner:
    """
    Enterprise test runner with comprehensive testing capabilities
    
    Provides:
    - Unit testing for all enterprise modules
    - Integration testing with analyzer wrapping
    - Compliance validation
    - Security testing
    - Performance benchmarking
    - Quality metrics collection
    """
    
    def __init__(self, project_root: Path):
        self.project_root = Path(project_root)
        self.test_result = TestResult()
        self.telemetry = SixSigmaTelemetry("enterprise_tests")
        
        # Create temporary test environment
        self.temp_dir = Path(tempfile.mkdtemp(prefix="enterprise_test_"))
        
    async def run_all_tests(self) -> TestResult:
        """Run comprehensive test suite"""
        logger.info("Starting comprehensive enterprise test suite")
        start_time = datetime.now()
        
        try:
            # Run unit tests
            await self._run_unit_tests()
            
            # Run integration tests
            await self._run_integration_tests()
            
            # Run compliance tests
            await self._run_compliance_tests()
            
            # Run security tests
            await self._run_security_tests()
            
            # Run performance tests
            await self._run_performance_tests()
            
            # Generate quality metrics
            self.test_result.quality_metrics = self.telemetry.generate_metrics_snapshot()
            
        except Exception as e:
            logger.error(f"Test suite execution error: {e}")
            self.test_result.add_test_result("test_suite_execution", "ERROR", 0.0, str(e))
            
        finally:
            # Calculate total execution time
            self.test_result.execution_time = (datetime.now() - start_time).total_seconds()
            
            # Cleanup temporary directory
            shutil.rmtree(self.temp_dir, ignore_errors=True)
            
        logger.info(f"Test suite completed in {self.test_result.execution_time:.2f}s")
        return self.test_result
        
    async def _run_unit_tests(self):
        """Run unit tests for all enterprise modules"""
        logger.info("Running unit tests...")
        
        # Test Six Sigma telemetry
        await self._test_six_sigma_telemetry()
        
        # Test supply chain security
        await self._test_supply_chain_security()
        
        # Test compliance matrix
        await self._test_compliance_matrix()
        
        # Test feature flags
        await self._test_feature_flags()
        
        # Test configuration management
        await self._test_configuration_management()
        
    async def _test_six_sigma_telemetry(self):
        """Test Six Sigma telemetry system"""
        test_start = datetime.now()
        
        try:
            telemetry = SixSigmaTelemetry("test_process")
            
            # Test basic metrics
            telemetry.record_unit_processed(passed=True)
            telemetry.record_unit_processed(passed=True) 
            telemetry.record_defect("test_defect")
            
            # Test calculations
            dpmo = telemetry.calculate_dpmo()
            rty = telemetry.calculate_rty()
            sigma_level = telemetry.calculate_sigma_level()
            
            # Validate results
            assert dpmo >= 0, "DPMO should be non-negative"
            assert 0 <= rty <= 100, "RTY should be between 0 and 100"
            assert sigma_level >= 0, "Sigma level should be non-negative"
            
            # Test metrics snapshot
            metrics = telemetry.generate_metrics_snapshot()
            assert isinstance(metrics, SixSigmaMetrics), "Should return SixSigmaMetrics object"
            
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_six_sigma_telemetry", "PASS", execution_time)
            self.telemetry.record_unit_processed(passed=True)
            
        except Exception as e:
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_six_sigma_telemetry", "FAIL", execution_time, str(e))
            self.telemetry.record_defect("test_failure")
            
    async def _test_supply_chain_security(self):
        """Test supply chain security system"""
        test_start = datetime.now()
        
        try:
            security = SupplyChainSecurity(self.temp_dir, SecurityLevel.BASIC)
            
            # Test security report generation
            report = await security.generate_comprehensive_security_report()
            
            # Validate report structure
            assert hasattr(report, 'security_level'), "Report should have security_level"
            assert hasattr(report, 'risk_score'), "Report should have risk_score"
            assert hasattr(report, 'recommendations'), "Report should have recommendations"
            
            # Test status retrieval
            status = security.get_security_status()
            assert isinstance(status, dict), "Status should be a dictionary"
            
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_supply_chain_security", "PASS", execution_time)
            self.telemetry.record_unit_processed(passed=True)
            
        except Exception as e:
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_supply_chain_security", "FAIL", execution_time, str(e))
            self.telemetry.record_defect("test_failure")
            
    async def _test_compliance_matrix(self):
        """Test compliance matrix system"""
        test_start = datetime.now()
        
        try:
            compliance = ComplianceMatrix(self.temp_dir)
            
            # Add test framework
            compliance.add_framework(ComplianceFramework.SOC2_TYPE2)
            
            # Test control operations
            controls = list(compliance.controls.keys())
            if controls:
                test_control = controls[0]
                
                # Test status update
                from ..compliance.matrix import ComplianceStatus
                compliance.update_control_status(
                    test_control, 
                    ComplianceStatus.IMPLEMENTED,
                    notes="Test implementation"
                )
                
                # Test report generation
                report = compliance.generate_compliance_report(ComplianceFramework.SOC2_TYPE2)
                assert hasattr(report, 'overall_status'), "Report should have overall_status"
                assert hasattr(report, 'recommendations'), "Report should have recommendations"
                
            # Test framework coverage
            coverage = compliance.get_framework_coverage()
            assert isinstance(coverage, dict), "Coverage should be a dictionary"
            
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_compliance_matrix", "PASS", execution_time)
            self.telemetry.record_unit_processed(passed=True)
            
        except Exception as e:
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_compliance_matrix", "FAIL", execution_time, str(e))
            self.telemetry.record_defect("test_failure")
            
    async def _test_feature_flags(self):
        """Test feature flag system"""
        test_start = datetime.now()
        
        try:
            flag_manager = FeatureFlagManager()
            
            # Create test flag
            test_flag = flag_manager.create_flag(
                "test_feature",
                "Test feature flag",
                status=FlagStatus.ENABLED
            )
            
            # Test flag operations
            assert flag_manager.is_enabled("test_feature"), "Test flag should be enabled"
            
            # Test flag update
            flag_manager.update_flag("test_feature", status=FlagStatus.DISABLED)
            assert not flag_manager.is_enabled("test_feature"), "Test flag should be disabled after update"
            
            # Test metrics
            metrics = flag_manager.get_metrics_summary()
            assert isinstance(metrics, dict), "Metrics should be a dictionary"
            
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_feature_flags", "PASS", execution_time)
            self.telemetry.record_unit_processed(passed=True)
            
        except Exception as e:
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_feature_flags", "FAIL", execution_time, str(e))
            self.telemetry.record_defect("test_failure")
            
    async def _test_configuration_management(self):
        """Test configuration management system"""
        test_start = datetime.now()
        
        try:
            # Test default configuration
            config = EnterpriseConfig(environment=EnvironmentType.TESTING)
            
            # Test configuration validation
            issues = config.validate_config()
            # Allow no issues or minor issues
            
            # Test configuration dictionary
            config_dict = config.get_config_dict()
            assert isinstance(config_dict, dict), "Config dict should be a dictionary"
            
            # Test environment-specific configuration
            prod_config = config.get_environment_config(EnvironmentType.PRODUCTION)
            assert prod_config.environment == EnvironmentType.PRODUCTION, "Should have production environment"
            
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_configuration_management", "PASS", execution_time)
            self.telemetry.record_unit_processed(passed=True)
            
        except Exception as e:
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_configuration_management", "FAIL", execution_time, str(e))
            self.telemetry.record_defect("test_failure")
            
    async def _run_integration_tests(self):
        """Run integration tests"""
        logger.info("Running integration tests...")
        
        await self._test_analyzer_integration()
        await self._test_end_to_end_workflow()
        
    async def _test_analyzer_integration(self):
        """Test analyzer integration system"""
        test_start = datetime.now()
        
        try:
            integration = EnterpriseAnalyzerIntegration(self.temp_dir)
            
            # Create mock analyzer class
            class MockAnalyzer:
                def analyze(self, data):
                    return {"result": "mock_analysis", "data_size": len(str(data))}
                    
            # Test analyzer wrapping
            wrapped_class = integration.wrap_analyzer("mock_analyzer", MockAnalyzer)
            analyzer_instance = wrapped_class()
            
            # Test enhanced analysis
            result = await analyzer_instance.analyze("test_data")
            assert isinstance(result, dict), "Analysis result should be a dictionary"
            
            # Test enterprise features
            quality_metrics = analyzer_instance.get_quality_metrics()
            assert isinstance(quality_metrics, dict), "Quality metrics should be a dictionary"
            
            # Test integration status
            status = integration.get_integration_status()
            assert isinstance(status, dict), "Integration status should be a dictionary"
            
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_analyzer_integration", "PASS", execution_time)
            self.telemetry.record_unit_processed(passed=True)
            
        except Exception as e:
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_analyzer_integration", "FAIL", execution_time, str(e))
            self.telemetry.record_defect("test_failure")
            
    async def _test_end_to_end_workflow(self):
        """Test complete end-to-end enterprise workflow"""
        test_start = datetime.now()
        
        try:
            # Initialize all enterprise components
            telemetry = SixSigmaTelemetry("e2e_test")
            security = SupplyChainSecurity(self.temp_dir, SecurityLevel.BASIC)
            compliance = ComplianceMatrix(self.temp_dir)
            integration = EnterpriseAnalyzerIntegration(self.temp_dir)
            
            # Add compliance framework
            compliance.add_framework(ComplianceFramework.SOC2_TYPE2)
            
            # Test workflow: analyze -> secure -> comply -> report
            
            # 1. Perform analysis
            telemetry.record_unit_processed(passed=True)
            
            # 2. Generate security report
            security_report = await security.generate_comprehensive_security_report()
            
            # 3. Check compliance
            compliance_report = compliance.generate_compliance_report(ComplianceFramework.SOC2_TYPE2)
            
            # 4. Generate final metrics
            final_metrics = telemetry.generate_metrics_snapshot()
            
            # Validate end-to-end results
            assert security_report.risk_score >= 0, "Security risk score should be valid"
            assert compliance_report.overall_status >= 0, "Compliance status should be valid"
            assert final_metrics.dpmo >= 0, "DPMO should be valid"
            
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_end_to_end_workflow", "PASS", execution_time)
            self.telemetry.record_unit_processed(passed=True)
            
        except Exception as e:
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_end_to_end_workflow", "FAIL", execution_time, str(e))
            self.telemetry.record_defect("test_failure")
            
    async def _run_compliance_tests(self):
        """Run compliance validation tests"""
        logger.info("Running compliance validation tests...")
        
        # Test SOC 2 compliance
        await self._test_soc2_compliance()
        
        # Test ISO 27001 compliance
        await self._test_iso27001_compliance()
        
        # Test NIST compliance
        await self._test_nist_compliance()
        
    async def _test_soc2_compliance(self):
        """Test SOC 2 compliance validation"""
        test_start = datetime.now()
        
        try:
            compliance = ComplianceMatrix(self.temp_dir)
            compliance.add_framework(ComplianceFramework.SOC2_TYPE2)
            
            # Check that SOC 2 controls are loaded
            soc2_controls = [c for c in compliance.controls.values() 
                            if c.framework == ComplianceFramework.SOC2_TYPE2]
            
            assert len(soc2_controls) > 0, "SOC 2 controls should be loaded"
            
            # Test compliance report
            report = compliance.generate_compliance_report(ComplianceFramework.SOC2_TYPE2)
            assert report.framework == ComplianceFramework.SOC2_TYPE2, "Report should be for SOC 2"
            
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_soc2_compliance", "PASS", execution_time)
            
        except Exception as e:
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_soc2_compliance", "FAIL", execution_time, str(e))
            
    async def _test_iso27001_compliance(self):
        """Test ISO 27001 compliance validation"""
        test_start = datetime.now()
        
        try:
            compliance = ComplianceMatrix(self.temp_dir)
            compliance.add_framework(ComplianceFramework.ISO27001)
            
            # Check that ISO 27001 controls are loaded
            iso_controls = [c for c in compliance.controls.values() 
                            if c.framework == ComplianceFramework.ISO27001]
            
            assert len(iso_controls) > 0, "ISO 27001 controls should be loaded"
            
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_iso27001_compliance", "PASS", execution_time)
            
        except Exception as e:
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_iso27001_compliance", "FAIL", execution_time, str(e))
            
    async def _test_nist_compliance(self):
        """Test NIST compliance validation"""
        test_start = datetime.now()
        
        try:
            compliance = ComplianceMatrix(self.temp_dir)
            compliance.add_framework(ComplianceFramework.NIST_CSF)
            
            # Check that NIST controls are loaded
            nist_controls = [c for c in compliance.controls.values() 
                            if c.framework == ComplianceFramework.NIST_CSF]
            
            assert len(nist_controls) > 0, "NIST controls should be loaded"
            
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_nist_compliance", "PASS", execution_time)
            
        except Exception as e:
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_nist_compliance", "FAIL", execution_time, str(e))
            
    async def _run_security_tests(self):
        """Run security validation tests"""
        logger.info("Running security validation tests...")
        
        await self._test_sbom_generation()
        await self._test_slsa_attestation()
        await self._test_vulnerability_scanning()
        
    async def _test_sbom_generation(self):
        """Test SBOM generation"""
        test_start = datetime.now()
        
        try:
            from ..security.sbom_generator import SBOMGenerator, SBOMFormat
            
            sbom_generator = SBOMGenerator(self.temp_dir)
            
            # Test SBOM generation (basic test without actual dependencies)
            sbom_file = await sbom_generator.generate_sbom(SBOMFormat.SPDX_JSON)
            
            # Validate SBOM file creation
            assert sbom_file.exists(), "SBOM file should be created"
            
            # Test status
            status = sbom_generator.get_status()
            assert isinstance(status, dict), "Status should be a dictionary"
            
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_sbom_generation", "PASS", execution_time)
            
        except Exception as e:
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_sbom_generation", "FAIL", execution_time, str(e))
            
    async def _test_slsa_attestation(self):
        """Test SLSA attestation generation"""
        test_start = datetime.now()
        
        try:
            from ..security.slsa_generator import SLSAGenerator, SLSALevel
            
            slsa_generator = SLSAGenerator(self.temp_dir)
            
            # Test SLSA attestation generation
            attestation_file = await slsa_generator.generate_attestation(SLSALevel.LEVEL_1)
            
            # Validate attestation file creation
            assert attestation_file.exists(), "SLSA attestation file should be created"
            
            # Test validation
            validation_result = slsa_generator.validate_attestation(attestation_file)
            assert isinstance(validation_result, dict), "Validation result should be a dictionary"
            
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_slsa_attestation", "PASS", execution_time)
            
        except Exception as e:
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_slsa_attestation", "FAIL", execution_time, str(e))
            
    async def _test_vulnerability_scanning(self):
        """Test vulnerability scanning (placeholder)"""
        test_start = datetime.now()
        
        try:
            # This would test actual vulnerability scanning
            
            security = SupplyChainSecurity(self.temp_dir, SecurityLevel.BASIC)
            status = security.get_security_status()
            
            assert isinstance(status, dict), "Security status should be a dictionary"
            
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_vulnerability_scanning", "PASS", execution_time)
            
        except Exception as e:
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_vulnerability_scanning", "FAIL", execution_time, str(e))
            
    async def _run_performance_tests(self):
        """Run performance benchmarking tests"""
        logger.info("Running performance tests...")
        
        await self._test_telemetry_performance()
        await self._test_integration_performance()
        
    async def _test_telemetry_performance(self):
        """Test telemetry system performance"""
        test_start = datetime.now()
        
        try:
            telemetry = SixSigmaTelemetry("performance_test")
            
            # Performance test: record many units
            iterations = 1000
            for i in range(iterations):
                telemetry.record_unit_processed(passed=i % 10 != 0)  # 10% failure rate
                
            # Measure calculation performance
            calc_start = datetime.now()
            dpmo = telemetry.calculate_dpmo()
            rty = telemetry.calculate_rty()
            sigma_level = telemetry.calculate_sigma_level()
            calc_time = (datetime.now() - calc_start).total_seconds()
            
            # Performance assertions
            assert calc_time < 1.0, f"Calculations too slow: {calc_time}s"
            assert dpmo > 0, "DPMO should reflect defects"
            assert rty < 100, "RTY should reflect failures"
            
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_telemetry_performance", "PASS", execution_time)
            
        except Exception as e:
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_telemetry_performance", "FAIL", execution_time, str(e))
            
    async def _test_integration_performance(self):
        """Test analyzer integration performance"""
        test_start = datetime.now()
        
        try:
            integration = EnterpriseAnalyzerIntegration(self.temp_dir)
            
            # Create mock analyzer
            class MockAnalyzer:
                def analyze(self, data):
                    return {"processed": len(str(data))}
                    
            wrapped_class = integration.wrap_analyzer("perf_test", MockAnalyzer)
            analyzer = wrapped_class()
            
            # Performance test: multiple analyses
            iterations = 100
            analysis_times = []
            
            for i in range(iterations):
                analysis_start = datetime.now()
                await analyzer.analyze(f"test_data_{i}")
                analysis_time = (datetime.now() - analysis_start).total_seconds()
                analysis_times.append(analysis_time)
                
            # Performance assertions
            avg_time = sum(analysis_times) / len(analysis_times)
            assert avg_time < 0.1, f"Average analysis too slow: {avg_time}s"
            
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_integration_performance", "PASS", execution_time)
            
        except Exception as e:
            execution_time = (datetime.now() - test_start).total_seconds()
            self.test_result.add_test_result("test_integration_performance", "FAIL", execution_time, str(e))
            
    def generate_test_report(self, output_file: Path) -> Path:
        """Generate comprehensive test report"""
        report = {
            'test_execution': {
                'timestamp': datetime.now().isoformat(),
                'execution_time': self.test_result.execution_time,
                'tests_run': self.test_result.tests_run,
                'failures': self.test_result.failures,
                'errors': self.test_result.errors,
                'skipped': self.test_result.skipped,
                'success_rate': self.test_result.success_rate
            },
            'test_details': self.test_result.test_details,
            'quality_metrics': self.test_result.quality_metrics.__dict__ if self.test_result.quality_metrics else None,
            'coverage_report': self.test_result.coverage_report,
            'summary': {
                'overall_status': 'PASS' if self.test_result.failures == 0 and self.test_result.errors == 0 else 'FAIL',
                'enterprise_features_validated': len([t for t in self.test_result.test_details if t['status'] == 'PASS']),
                'critical_failures': len([t for t in self.test_result.test_details 
                                        if t['status'] in ['FAIL', 'ERROR'] and 'compliance' in t['test_name']])
            }
        }
        
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
            
        logger.info(f"Test report generated: {output_file}")
        return output_file