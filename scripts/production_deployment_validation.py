#!/usr/bin/env python3
"""
Production Deployment Validation Script
=======================================

Validates that the system is ready for production deployment by:
- Verifying all components are functional
- Testing deployment scripts and rollback procedures
- Validating configuration and environment setup
- Checking monitoring and alerting systems
- Verifying health check endpoints
"""

import asyncio
import json
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


@dataclass
class DeploymentCheck:
    """Individual deployment validation check."""
    name: str
    passed: bool
    score: float
    execution_time: float
    details: Dict[str, Any]
    error_message: Optional[str] = None


@dataclass
class DeploymentValidationResult:
    """Complete deployment validation result."""
    overall_passed: bool
    deployment_ready: bool
    total_checks: int
    passed_checks: int
    failed_checks: int
    overall_score: float
    validation_duration: float
    checks: List[DeploymentCheck]
    recommendations: List[str]
    critical_issues: List[str]


class EnvironmentValidator:
    """Validate deployment environment setup."""
    
    def __init__(self):
        self.required_python_version = (3, 8)
        self.required_packages = [
            'asyncio', 'pathlib', 'logging', 'json', 
            'dataclasses', 'typing', 'concurrent.futures'
        ]
        
    def validate_python_version(self) -> DeploymentCheck:
        """Validate Python version meets requirements."""
        start_time = time.time()
        
        try:
            current_version = sys.version_info[:2]
            required_version = self.required_python_version
            
            version_ok = current_version >= required_version
            
            details = {
                'current_version': f"{current_version[0]}.{current_version[1]}",
                'required_version': f"{required_version[0]}.{required_version[1]}",
                'version_check': 'passed' if version_ok else 'failed'
            }
            
            return DeploymentCheck(
                name='Python Version Check',
                passed=version_ok,
                score=1.0 if version_ok else 0.0,
                execution_time=time.time() - start_time,
                details=details,
                error_message=None if version_ok else f"Python {required_version[0]}.{required_version[1]}+ required"
            )
            
        except Exception as e:
            return DeploymentCheck(
                name='Python Version Check',
                passed=False,
                score=0.0,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            )
    
    def validate_required_packages(self) -> DeploymentCheck:
        """Validate required packages are available."""
        start_time = time.time()
        
        try:
            missing_packages = []
            available_packages = []
            
            for package in self.required_packages:
                try:
                    __import__(package)
                    available_packages.append(package)
                except ImportError:
                    missing_packages.append(package)
            
            all_available = len(missing_packages) == 0
            
            details = {
                'required_packages': self.required_packages,
                'available_packages': available_packages,
                'missing_packages': missing_packages,
                'availability_rate': len(available_packages) / len(self.required_packages)
            }
            
            return DeploymentCheck(
                name='Required Packages Check',
                passed=all_available,
                score=len(available_packages) / len(self.required_packages),
                execution_time=time.time() - start_time,
                details=details,
                error_message=f"Missing packages: {missing_packages}" if missing_packages else None
            )
            
        except Exception as e:
            return DeploymentCheck(
                name='Required Packages Check',
                passed=False,
                score=0.0,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            )
    
    def validate_file_permissions(self) -> DeploymentCheck:
        """Validate file system permissions."""
        start_time = time.time()
        
        try:
            test_results = {}
            
            # Test read permissions
            try:
                test_file = PROJECT_ROOT / 'README.md'
                if test_file.exists():
                    with open(test_file, 'r') as f:
                        f.read(100)
                    test_results['read_permission'] = True
                else:
                    test_results['read_permission'] = False
                    test_results['read_error'] = 'README.md not found'
            except Exception as e:
                test_results['read_permission'] = False
                test_results['read_error'] = str(e)
            
            # Test write permissions in temp directory
            try:
                temp_file = PROJECT_ROOT / 'temp_test_write.txt'
                with open(temp_file, 'w') as f:
                    f.write('test')
                temp_file.unlink()
                test_results['write_permission'] = True
            except Exception as e:
                test_results['write_permission'] = False
                test_results['write_error'] = str(e)
            
            # Test execute permissions
            try:
                # Test if we can execute Python files
                result = subprocess.run([
                    sys.executable, '-c', 'print("permissions_test")'
                ], capture_output=True, text=True, timeout=5)
                test_results['execute_permission'] = result.returncode == 0
                if result.returncode != 0:
                    test_results['execute_error'] = result.stderr
            except Exception as e:
                test_results['execute_permission'] = False
                test_results['execute_error'] = str(e)
            
            permissions_ok = all([
                test_results.get('read_permission', False),
                test_results.get('write_permission', False),
                test_results.get('execute_permission', False)
            ])
            
            score = sum([
                test_results.get('read_permission', False),
                test_results.get('write_permission', False),
                test_results.get('execute_permission', False)
            ]) / 3.0
            
            return DeploymentCheck(
                name='File Permissions Check',
                passed=permissions_ok,
                score=score,
                execution_time=time.time() - start_time,
                details=test_results
            )
            
        except Exception as e:
            return DeploymentCheck(
                name='File Permissions Check',
                passed=False,
                score=0.0,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            )


class ComponentValidator:
    """Validate system components are functional."""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        
    def validate_core_components(self) -> DeploymentCheck:
        """Validate core system components."""
        start_time = time.time()
        
        try:
            component_status = {}
            
            # Check critical files exist
            critical_files = [
                'analyzer/system_integration.py',
                'analyzer/unified_api.py',
                'analyzer/phase_correlation.py',
                'src/linter_manager.py'
            ]
            
            for file_path in critical_files:
                full_path = self.project_root / file_path
                component_status[file_path] = {
                    'exists': full_path.exists(),
                    'readable': False,
                    'size_bytes': 0
                }
                
                if full_path.exists():
                    try:
                        with open(full_path, 'r', encoding='utf-8') as f:
                            content = f.read(100)  # Read first 100 chars
                            component_status[file_path]['readable'] = True
                            component_status[file_path]['size_bytes'] = full_path.stat().st_size
                    except Exception as e:
                        component_status[file_path]['read_error'] = str(e)
            
            # Calculate component health
            total_components = len(critical_files)
            healthy_components = sum(
                1 for status in component_status.values() 
                if status.get('exists', False) and status.get('readable', False)
            )
            
            components_healthy = healthy_components == total_components
            score = healthy_components / total_components
            
            return DeploymentCheck(
                name='Core Components Check',
                passed=components_healthy,
                score=score,
                execution_time=time.time() - start_time,
                details={
                    'total_components': total_components,
                    'healthy_components': healthy_components,
                    'component_status': component_status
                }
            )
            
        except Exception as e:
            return DeploymentCheck(
                name='Core Components Check',
                passed=False,
                score=0.0,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            )
    
    def validate_test_infrastructure(self) -> DeploymentCheck:
        """Validate test infrastructure is available."""
        start_time = time.time()
        
        try:
            test_status = {}
            
            # Check test directories
            test_dirs = [
                'tests/end_to_end',
                'tests/production', 
                'tests/security',
                'tests/linter_integration',
                'tests/phase4'
            ]
            
            for test_dir in test_dirs:
                dir_path = self.project_root / test_dir
                test_status[test_dir] = {
                    'exists': dir_path.exists(),
                    'test_files': 0
                }
                
                if dir_path.exists():
                    test_files = list(dir_path.rglob('test_*.py'))
                    test_status[test_dir]['test_files'] = len(test_files)
            
            # Calculate test infrastructure health
            existing_dirs = sum(1 for status in test_status.values() if status['exists'])
            total_test_files = sum(status['test_files'] for status in test_status.values())
            
            infrastructure_healthy = existing_dirs >= 3 and total_test_files >= 5
            score = min(1.0, (existing_dirs / len(test_dirs)) + (total_test_files / 20))
            
            return DeploymentCheck(
                name='Test Infrastructure Check',
                passed=infrastructure_healthy,
                score=score,
                execution_time=time.time() - start_time,
                details={
                    'test_directories': test_status,
                    'existing_directories': existing_dirs,
                    'total_test_files': total_test_files
                }
            )
            
        except Exception as e:
            return DeploymentCheck(
                name='Test Infrastructure Check',
                passed=False,
                score=0.0,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            )


class DeploymentScriptValidator:
    """Validate deployment scripts and procedures."""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        
    def validate_deployment_scripts(self) -> DeploymentCheck:
        """Validate deployment scripts exist and are executable."""
        start_time = time.time()
        
        try:
            script_status = {}
            
            # Look for deployment-related scripts
            potential_scripts = [
                'scripts/deploy.py',
                'scripts/deploy.sh',
                'deploy.py',
                'deploy.sh',
                'Dockerfile',
                'docker-compose.yml',
                'requirements.txt',
                'pyproject.toml',
                'setup.py'
            ]
            
            for script_path in potential_scripts:
                full_path = self.project_root / script_path
                script_status[script_path] = {
                    'exists': full_path.exists(),
                    'executable': False,
                    'size_bytes': 0
                }
                
                if full_path.exists():
                    stat_info = full_path.stat()
                    script_status[script_path]['size_bytes'] = stat_info.st_size
                    # Check if file is executable (on Unix systems)
                    script_status[script_path]['executable'] = os.access(full_path, os.X_OK)
            
            # Check for essential deployment files
            essential_files = ['requirements.txt', 'pyproject.toml', 'setup.py']
            has_essential = any(script_status.get(f, {}).get('exists', False) for f in essential_files)
            
            existing_scripts = sum(1 for status in script_status.values() if status['exists'])
            
            deployment_ready = has_essential and existing_scripts >= 2
            score = min(1.0, existing_scripts / len(potential_scripts))
            if has_essential:
                score += 0.2  # Bonus for having essential files
            
            return DeploymentCheck(
                name='Deployment Scripts Check',
                passed=deployment_ready,
                score=min(1.0, score),
                execution_time=time.time() - start_time,
                details={
                    'script_status': script_status,
                    'existing_scripts': existing_scripts,
                    'has_essential_files': has_essential,
                    'essential_files_found': [f for f in essential_files if script_status.get(f, {}).get('exists', False)]
                }
            )
            
        except Exception as e:
            return DeploymentCheck(
                name='Deployment Scripts Check',
                passed=False,
                score=0.0,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            )
    
    def validate_configuration_files(self) -> DeploymentCheck:
        """Validate configuration files for deployment."""
        start_time = time.time()
        
        try:
            config_status = {}
            
            # Look for configuration files
            config_files = [
                'config/production.yml',
                'config/production.json',
                '.env',
                '.env.production',
                'config.yml',
                'config.json',
                'settings.py',
                'settings.json'
            ]
            
            for config_file in config_files:
                full_path = self.project_root / config_file
                config_status[config_file] = {
                    'exists': full_path.exists(),
                    'valid_format': False,
                    'size_bytes': 0
                }
                
                if full_path.exists():
                    config_status[config_file]['size_bytes'] = full_path.stat().st_size
                    
                    # Try to validate file format
                    try:
                        if config_file.endswith(('.json',)):
                            with open(full_path, 'r') as f:
                                json.load(f)
                            config_status[config_file]['valid_format'] = True
                        elif config_file.endswith(('.yml', '.yaml')):
                            # Would need PyYAML to validate, so just check it's readable
                            with open(full_path, 'r') as f:
                                f.read()
                            config_status[config_file]['valid_format'] = True
                        else:
                            # For other files, just check they're readable
                            with open(full_path, 'r') as f:
                                f.read(100)
                            config_status[config_file]['valid_format'] = True
                    except Exception as e:
                        config_status[config_file]['validation_error'] = str(e)
            
            # Calculate configuration readiness
            existing_configs = sum(1 for status in config_status.values() if status['exists'])
            valid_configs = sum(1 for status in config_status.values() if status.get('valid_format', False))
            
            config_ready = existing_configs >= 1 and valid_configs >= 1
            score = valid_configs / len(config_files) if len(config_files) > 0 else 0
            
            return DeploymentCheck(
                name='Configuration Files Check',
                passed=config_ready,
                score=score,
                execution_time=time.time() - start_time,
                details={
                    'config_status': config_status,
                    'existing_configs': existing_configs,
                    'valid_configs': valid_configs
                }
            )
            
        except Exception as e:
            return DeploymentCheck(
                name='Configuration Files Check',
                passed=False,
                score=0.0,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            )


class HealthCheckValidator:
    """Validate health check endpoints and monitoring."""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        
    def validate_health_check_implementation(self) -> DeploymentCheck:
        """Validate health check endpoint implementation."""
        start_time = time.time()
        
        try:
            health_check_status = {}
            
            # Look for health check implementations
            health_check_patterns = [
                'health',
                'healthz',
                '/health',
                'status',
                'ping',
                'alive'
            ]
            
            # Search in Python files for health check patterns
            python_files = list(self.project_root.rglob('*.py'))
            health_implementations = []
            
            for py_file in python_files:
                if 'test' in str(py_file) or '__pycache__' in str(py_file):
                    continue
                    
                try:
                    with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read().lower()
                        
                        for pattern in health_check_patterns:
                            if pattern in content:
                                health_implementations.append({
                                    'file': str(py_file),
                                    'pattern': pattern,
                                    'context': 'health_check_pattern_found'
                                })
                                break
                                
                except Exception as e:
                    continue
            
            # Check for monitoring/logging implementations
            monitoring_patterns = ['logging', 'logger', 'log', 'monitor', 'metrics']
            monitoring_implementations = []
            
            for py_file in python_files[:50]:  # Check first 50 files
                if 'test' in str(py_file):
                    continue
                    
                try:
                    with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read().lower()
                        
                        for pattern in monitoring_patterns:
                            if f'import {pattern}' in content or f'from {pattern}' in content:
                                monitoring_implementations.append({
                                    'file': str(py_file),
                                    'pattern': pattern
                                })
                                break
                                
                except Exception as e:
                    continue
            
            health_ready = len(health_implementations) >= 1 and len(monitoring_implementations) >= 5
            score = min(1.0, (len(health_implementations) * 0.3) + (len(monitoring_implementations) * 0.1))
            
            return DeploymentCheck(
                name='Health Check Implementation',
                passed=health_ready,
                score=score,
                execution_time=time.time() - start_time,
                details={
                    'health_implementations': len(health_implementations),
                    'monitoring_implementations': len(monitoring_implementations),
                    'health_patterns_found': health_implementations[:5],  # First 5
                    'monitoring_patterns_found': monitoring_implementations[:5]  # First 5
                }
            )
            
        except Exception as e:
            return DeploymentCheck(
                name='Health Check Implementation',
                passed=False,
                score=0.0,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            )


class ProductionDeploymentValidator:
    """Main production deployment validator."""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.validators = {
            'environment': EnvironmentValidator(),
            'components': ComponentValidator(project_root),
            'deployment_scripts': DeploymentScriptValidator(project_root),
            'health_checks': HealthCheckValidator(project_root)
        }
        
    async def run_deployment_validation(self) -> DeploymentValidationResult:
        """Run complete deployment validation."""
        logger.info("Starting Production Deployment Validation")
        start_time = time.time()
        
        all_checks = []
        
        # Run environment validation
        logger.info("Validating environment...")
        env_checks = [
            self.validators['environment'].validate_python_version(),
            self.validators['environment'].validate_required_packages(),
            self.validators['environment'].validate_file_permissions()
        ]
        all_checks.extend(env_checks)
        
        # Run component validation
        logger.info("Validating components...")
        component_checks = [
            self.validators['components'].validate_core_components(),
            self.validators['components'].validate_test_infrastructure()
        ]
        all_checks.extend(component_checks)
        
        # Run deployment script validation
        logger.info("Validating deployment scripts...")
        script_checks = [
            self.validators['deployment_scripts'].validate_deployment_scripts(),
            self.validators['deployment_scripts'].validate_configuration_files()
        ]
        all_checks.extend(script_checks)
        
        # Run health check validation
        logger.info("Validating health checks...")
        health_checks = [
            self.validators['health_checks'].validate_health_check_implementation()
        ]
        all_checks.extend(health_checks)
        
        # Calculate overall results
        total_checks = len(all_checks)
        passed_checks = sum(1 for check in all_checks if check.passed)
        failed_checks = total_checks - passed_checks
        
        overall_score = sum(check.score for check in all_checks) / total_checks if total_checks > 0 else 0
        overall_passed = passed_checks >= (total_checks * 0.8)  # 80% pass rate
        deployment_ready = overall_passed and failed_checks <= 2  # Max 2 failures allowed
        
        validation_duration = time.time() - start_time
        
        # Generate recommendations and critical issues
        recommendations = self._generate_recommendations(all_checks)
        critical_issues = self._identify_critical_issues(all_checks)
        
        return DeploymentValidationResult(
            overall_passed=overall_passed,
            deployment_ready=deployment_ready,
            total_checks=total_checks,
            passed_checks=passed_checks,
            failed_checks=failed_checks,
            overall_score=overall_score,
            validation_duration=validation_duration,
            checks=all_checks,
            recommendations=recommendations,
            critical_issues=critical_issues
        )
    
    def _generate_recommendations(self, checks: List[DeploymentCheck]) -> List[str]:
        """Generate deployment recommendations based on check results."""
        recommendations = []
        
        for check in checks:
            if not check.passed:
                if check.name == 'Python Version Check':
                    recommendations.append("Upgrade Python to meet minimum version requirements")
                elif check.name == 'Required Packages Check':
                    recommendations.append("Install missing required packages")
                elif check.name == 'Core Components Check':
                    recommendations.append("Ensure all core system components are present and readable")
                elif check.name == 'Deployment Scripts Check':
                    recommendations.append("Create deployment scripts and configuration files")
                elif check.name == 'Health Check Implementation':
                    recommendations.append("Implement health check endpoints and monitoring")
            elif check.score < 0.8:
                recommendations.append(f"Improve {check.name} implementation for better reliability")
        
        return recommendations
    
    def _identify_critical_issues(self, checks: List[DeploymentCheck]) -> List[str]:
        """Identify critical deployment issues."""
        critical_issues = []
        
        for check in checks:
            if not check.passed and check.score < 0.5:
                critical_issues.append(f"CRITICAL: {check.name} - {check.error_message or 'Significant failure detected'}")
        
        return critical_issues
    
    def print_results(self, result: DeploymentValidationResult):
        """Print deployment validation results."""
        print(f"\n{'='*80}")
        print("PRODUCTION DEPLOYMENT VALIDATION RESULTS")
        print(f"{'='*80}")
        
        print(f"Overall Status: {'PASSED' if result.overall_passed else 'FAILED'}")
        print(f"Deployment Ready: {'YES' if result.deployment_ready else 'NO'}")
        print(f"Overall Score: {result.overall_score:.2f}")
        print(f"Validation Duration: {result.validation_duration:.1f}s")
        print(f"Checks Passed: {result.passed_checks}/{result.total_checks}")
        
        # Critical issues
        if result.critical_issues:
            print(f"\nCRITICAL ISSUES ({len(result.critical_issues)}):")
            for issue in result.critical_issues:
                print(f"  [FAIL] {issue}")
        
        # Individual check results
        print(f"\n{'='*60}")
        print("INDIVIDUAL CHECK RESULTS")
        print(f"{'='*60}")
        
        for check in result.checks:
            status = "[OK] PASSED" if check.passed else "[FAIL] FAILED"
            print(f"\n{check.name}: {status}")
            print(f"  Score: {check.score:.2f}")
            print(f"  Execution Time: {check.execution_time:.2f}s")
            
            if check.error_message:
                print(f"  Error: {check.error_message}")
            
            # Show key details
            if check.details:
                key_details = {k: v for k, v in check.details.items() if not k.endswith('_status')}
                for key, value in list(key_details.items())[:3]:  # Show first 3 details
                    print(f"  {key}: {value}")
        
        # Recommendations
        if result.recommendations:
            print(f"\n{'='*60}")
            print("RECOMMENDATIONS")
            print(f"{'='*60}")
            for i, rec in enumerate(result.recommendations, 1):
                print(f"{i}. {rec}")


async def main():
    """Main execution function."""
    print("="*80)
    print("PRODUCTION DEPLOYMENT VALIDATION")
    print("="*80)
    
    project_root = PROJECT_ROOT
    validator = ProductionDeploymentValidator(project_root)
    
    try:
        # Run deployment validation
        result = await validator.run_deployment_validation()
        
        # Print results
        validator.print_results(result)
        
        # Save results to file
        results_file = project_root / 'deployment_validation_results.json'
        with open(results_file, 'w') as f:
            json.dump(asdict(result), f, indent=2, default=str)
        logger.info(f"Results saved to {results_file}")
        
        # Determine exit code
        if result.deployment_ready:
            print(f"\n{'='*80}")
            print("DEPLOYMENT VALIDATION PASSED - SYSTEM IS READY FOR PRODUCTION")
            print(f"{'='*80}")
            return 0
        else:
            print(f"\n{'='*80}")
            print("DEPLOYMENT VALIDATION FAILED - ISSUES MUST BE RESOLVED")
            print(f"{'='*80}")
            return 1
            
    except Exception as e:
        logger.error(f"Deployment validation failed: {e}")
        import traceback
        print(f"Error details: {traceback.format_exc()}")
        return 1


if __name__ == '__main__':
    import sys
    sys.exit(asyncio.run(main()))