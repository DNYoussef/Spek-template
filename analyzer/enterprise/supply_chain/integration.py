from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional, Callable
import time

from .config_loader import SupplyChainConfigLoader
from .supply_chain_analyzer import SupplyChainAnalyzer

class SupplyChainIntegration:
    """Integration layer for supply chain security with existing analyzer."""
    
def __init__(self,
                analyzer_instance: Optional[Any] = None,
                config_path: Optional[str] = None):
        
        self.config_loader = SupplyChainConfigLoader(config_path)
        self.config = self.config_loader.load_config()
        self.analyzer_instance = analyzer_instance
        
        # Integration settings
        self.integration_config = self.config.get('integration', {})
        self.non_breaking = self.integration_config.get('non_breaking', True)
        self.priority = self.integration_config.get('priority', 'normal')
        
        # Performance monitoring
        self.perf_config = self.integration_config.get('performance_monitoring', {})
        self.baseline_duration = self.perf_config.get('baseline_duration', MAXIMUM_FUNCTION_PARAMETERS.0)
        self.alert_threshold = self.perf_config.get('alert_threshold', 2.0)
        
        # Quality gates
        self.quality_gates = self.integration_config.get('quality_gates', {})
        
        # Supply chain analyzer
        sc_config = self.config_loader.create_component_config('supply_chain')
        self.sc_analyzer = SupplyChainAnalyzer(sc_config)
        
        # Integration state
        self.integration_enabled = self.config.get('supply_chain', {}).get('enabled', True)
        self.output_dir = Path(sc_config.get('output_dir', '.claude/.artifacts/supply_chain'))
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
def integrate_with_analyzer(self,
                                analysis_callback: Optional[Callable] = None,
                                project_path: str = ".") -> Dict[str, Any]:
        """Integrate supply chain analysis with existing analyzer workflow."""
        
        integration_result = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'integration_enabled': self.integration_enabled,
            'non_breaking_mode': self.non_breaking,
            'priority': self.priority,
            'supply_chain_analysis': {},
            'performance_impact': {},
            'quality_gate_results': {},
            'integration_status': 'SUCCESS',
            'warnings': [],
            'errors': []
        }
        
        if not self.integration_enabled:
            integration_result['integration_status'] = 'DISABLED'
            integration_result['warnings'].append('Supply chain security integration is disabled')
            return integration_result
        
        try:
            # Pre-integration hooks
            self._pre_integration_hooks(integration_result)
            
            # Execute existing analyzer callback if provided
            if analysis_callback and self.analyzer_instance:
                existing_analysis_start = time.time()
                existing_results = analysis_callback(self.analyzer_instance, project_path)
                existing_analysis_duration = time.time() - existing_analysis_start
                
                integration_result['existing_analysis'] = {
                    'duration': existing_analysis_duration,
                    'results_available': bool(existing_results)
                }
            
            # Execute supply chain analysis
            sc_analysis_start = time.time()
            sc_results = asyncio.run(self.sc_analyzer.analyze_supply_chain(project_path))
            sc_analysis_duration = time.time() - sc_analysis_start
            
            integration_result['supply_chain_analysis'] = sc_results
            
            # Calculate performance impact
            performance_impact = self._calculate_performance_impact(
                sc_analysis_duration, 
                integration_result.get('existing_analysis', {}).get('duration', 0)
            )
            integration_result['performance_impact'] = performance_impact
            
            # Apply quality gates
            if self.quality_gates.get('enabled', True):
                gate_results = self._apply_quality_gates(sc_results)
                integration_result['quality_gate_results'] = gate_results
                
                # Check if quality gates failed and should block
                if gate_results.get('blocking_failures'):
                    integration_result['integration_status'] = 'QUALITY_GATE_FAILED'
                    integration_result['errors'].extend(gate_results.get('failures', []))
            
            # Post-integration hooks
            self._post_integration_hooks(integration_result, sc_results)
            
        except Exception as e:
            integration_result['integration_status'] = 'ERROR'
            integration_result['errors'].append(str(e))
            
            if not self.non_breaking:
                raise
            else:
                integration_result['warnings'].append(f'Supply chain analysis failed but continuing due to non-breaking mode: {str(e)}')
        
        # Save integration results
        self._save_integration_results(integration_result)
        
        return integration_result
    
def _pre_integration_hooks(self, integration_result: Dict[str, Any]):
        """Execute pre-integration hooks."""
        
        # Validate configuration
        config_validation = self.config_loader.validate_config()
        if not config_validation.get('valid', False):
            integration_result['warnings'].extend(config_validation.get('warnings', []))
            integration_result['errors'].extend(config_validation.get('errors', []))
        
        # Check analyzer dependencies
        analyzer_validation = self.sc_analyzer.validate_configuration()
        if not analyzer_validation.get('valid', False):
            integration_result['warnings'].extend(analyzer_validation.get('warnings', []))
            integration_result['errors'].extend(analyzer_validation.get('checks_failed', []))
        
        # Prepare output directories
        try:
            self.output_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            integration_result['warnings'].append(f'Could not create output directory: {e}')
    
def _post_integration_hooks(self,
                                integration_result: Dict[str, Any],
                                sc_results: Dict[str, Any]):
        """Execute post-integration hooks."""
        
        # Generate performance report
        if self.perf_config.get('enabled', True):
            perf_report = self.sc_analyzer.generate_performance_report()
            self._save_performance_report(perf_report)
            
            # Check performance thresholds
            overhead = perf_report.get('actual_overhead', '0%')
            if overhead.replace('%', '').replace('.', '').isdigit():
                overhead_value = float(overhead.replace('%', ''))
                if overhead_value > self.alert_threshold:
                    integration_result['warnings'].append(
                        f'Supply chain analysis overhead ({overhead}) exceeds alert threshold ({self.alert_threshold}%)'
                    )
        
        # Update existing analyzer with supply chain data
        if self.analyzer_instance and hasattr(self.analyzer_instance, 'add_supply_chain_data'):
            try:
                self.analyzer_instance.add_supply_chain_data(sc_results)
            except Exception as e:
                integration_result['warnings'].append(f'Could not update analyzer with supply chain data: {e}')
        
        # Trigger notifications if configured
        self._trigger_notifications(integration_result, sc_results)
    
def _calculate_performance_impact(self,
                                    sc_duration: float,
                                    existing_duration: float) -> Dict[str, Any]:
        """Calculate performance impact of supply chain analysis."""
        
        total_duration = existing_duration + sc_duration
        baseline = max(self.baseline_duration, existing_duration or self.baseline_duration)
        
        overhead_percentage = (sc_duration / baseline) * 100
        total_overhead_percentage = ((total_duration - baseline) / baseline) * 100
        
        return {
            'supply_chain_duration_seconds': sc_duration,
            'existing_analysis_duration_seconds': existing_duration,
            'total_duration_seconds': total_duration,
            'baseline_duration_seconds': baseline,
            'supply_chain_overhead_percentage': round(overhead_percentage, 2),
            'total_overhead_percentage': round(total_overhead_percentage, 2),
            'performance_target_met': overhead_percentage <= self.sc_analyzer.performance_target,
            'alert_threshold_exceeded': overhead_percentage > self.alert_threshold
        }
    
def _apply_quality_gates(self, sc_results: Dict[str, Any]) -> Dict[str, Any]:
        """Apply quality gates to supply chain analysis results."""
        
        gate_results = {
            'enabled': True,
            'gates_evaluated': [],
            'gates_passed': [],
            'gates_failed': [],
            'blocking_failures': [],
            'warnings': [],
            'overall_status': 'PASS'
        }
        
        # Critical vulnerabilities gate
        if self.quality_gates.get('fail_on_critical_vulnerabilities', True):
            gate_name = 'critical_vulnerabilities'
            gate_results['gates_evaluated'].append(gate_name)
            
            vuln_summary = sc_results.get('vulnerabilities', {}).get('summary', {})
            critical_count = vuln_summary.get('critical', 0)
            max_allowed = self.quality_gates.get('max_critical_vulnerabilities', 0)
            
            if critical_count <= max_allowed:
                gate_results['gates_passed'].append(gate_name)
            else:
                gate_results['gates_failed'].append(gate_name)
                gate_results['blocking_failures'].append(
                    f'Critical vulnerabilities ({critical_count}) exceed limit ({max_allowed})'
                )
        
        # High vulnerabilities gate
        max_high = self.quality_gates.get('max_high_vulnerabilities', 5)
        if max_high >= 0:
            gate_name = 'high_vulnerabilities'
            gate_results['gates_evaluated'].append(gate_name)
            
            vuln_summary = sc_results.get('vulnerabilities', {}).get('summary', {})
            high_count = vuln_summary.get('high', 0)
            
            if high_count <= max_high:
                gate_results['gates_passed'].append(gate_name)
            else:
                gate_results['gates_failed'].append(gate_name)
                gate_results['warnings'].append(
                    f'High vulnerabilities ({high_count}) exceed recommended limit ({max_high})'
                )
        
        # Prohibited licenses gate
        if self.quality_gates.get('fail_on_prohibited_licenses', True):
            gate_name = 'prohibited_licenses'
            gate_results['gates_evaluated'].append(gate_name)
            
            license_compliance = sc_results.get('vulnerabilities', {}).get('license_compliance', {})
            violations = license_compliance.get('violations', [])
            prohibited_violations = [v for v in violations if v.get('violation_type') == 'prohibited']
            
            if not prohibited_violations:
                gate_results['gates_passed'].append(gate_name)
            else:
                gate_results['gates_failed'].append(gate_name)
                gate_results['blocking_failures'].append(
                    f'Prohibited license violations detected: {len(prohibited_violations)}'
                )
        
        # Signing failures gate
        if self.quality_gates.get('fail_on_signing_failures', True):
            gate_name = 'cryptographic_signing'
            gate_results['gates_evaluated'].append(gate_name)
            
            signing_results = sc_results.get('signatures', {})
            signing_errors = signing_results.get('errors', [])
            
            if not signing_errors:
                gate_results['gates_passed'].append(gate_name)
            else:
                gate_results['gates_failed'].append(gate_name)
                gate_results['blocking_failures'].append(
                    f'Cryptographic signing failures detected: {len(signing_errors)}'
                )
        
        # Determine overall status
        if gate_results['blocking_failures']:
            gate_results['overall_status'] = 'FAIL'
        elif gate_results['gates_failed']:
            gate_results['overall_status'] = 'WARN'
        else:
            gate_results['overall_status'] = 'PASS'
        
        return gate_results
    
def _trigger_notifications(self,
                                integration_result: Dict[str, Any],
                                sc_results: Dict[str, Any]):
        """Trigger notifications based on results."""
        
        notifications_config = self.config.get('notifications', {})
        if not notifications_config.get('enabled', False):
            return
        
        alert_conditions = notifications_config.get('alert_on', [])
        
        # Check alert conditions
        should_alert = False
        alert_reasons = []
        
        if 'critical_vulnerabilities' in alert_conditions:
            vuln_summary = sc_results.get('vulnerabilities', {}).get('summary', {})
            if vuln_summary.get('critical', 0) > 0:
                should_alert = True
                alert_reasons.append(f"Critical vulnerabilities found: {vuln_summary['critical']}")
        
        if 'prohibited_licenses' in alert_conditions:
            license_compliance = sc_results.get('vulnerabilities', {}).get('license_compliance', {})
            violations = license_compliance.get('violations', [])
            prohibited = [v for v in violations if v.get('violation_type') == 'prohibited']
            if prohibited:
                should_alert = True
                alert_reasons.append(f"Prohibited license violations: {len(prohibited)}")
        
        if 'signing_failures' in alert_conditions:
            signing_errors = sc_results.get('signatures', {}).get('errors', [])
            if signing_errors:
                should_alert = True
                alert_reasons.append(f"Signing failures: {len(signing_errors)}")
        
        if 'compliance_failures' in alert_conditions:
            compliance = sc_results.get('compliance_status', {})
            if compliance.get('overall_grade') == 'F':
                should_alert = True
                alert_reasons.append("Compliance requirements not met")
        
        if 'performance_degradation' in alert_conditions:
            perf_impact = integration_result.get('performance_impact', {})
            if perf_impact.get('alert_threshold_exceeded', False):
                should_alert = True
                alert_reasons.append(f"Performance overhead exceeded: {perf_impact.get('supply_chain_overhead_percentage', 0)}%")
        
        # Send alerts if needed
        if should_alert and alert_reasons:
            alert_data = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'alert_type': 'supply_chain_security',
                'severity': 'high' if integration_result.get('quality_gate_results', {}).get('blocking_failures') else 'medium',
                'reasons': alert_reasons,
                'project_path': sc_results.get('project_path', 'unknown'),
                'analysis_id': sc_results.get('analysis_id', 'unknown')
            }
            
            self._send_notifications(alert_data, notifications_config)
    
def _send_notifications(self, alert_data: Dict[str, Any], config: Dict[str, Any]):
        """Send notifications via configured channels."""
        
        # Save alert for audit trail
        alert_path = self.output_dir / f"alert-{int(time.time())}.json"
        with open(alert_path, 'w', encoding='utf-8') as f:
            json.dump(alert_data, f, indent=2, ensure_ascii=False)
        
        # Note: In a production implementation, this would integrate with:
        
        print(f"SUPPLY CHAIN SECURITY ALERT: {', '.join(alert_data['reasons'])}")
    
def _save_integration_results(self, integration_result: Dict[str, Any]):
        """Save integration results for audit and monitoring."""
        
        results_path = self.output_dir / f"integration-{int(time.time())}.json"
        with open(results_path, 'w', encoding='utf-8') as f:
            json.dump(integration_result, f, indent=2, ensure_ascii=False)
    
def _save_performance_report(self, perf_report: Dict[str, Any]):
        """Save performance report."""
        
        perf_path = self.output_dir / f"performance-{int(time.time())}.json"
        with open(perf_path, 'w', encoding='utf-8') as f:
            json.dump(perf_report, f, indent=2, ensure_ascii=False)
    
def get_integration_status(self) -> Dict[str, Any]:
        """Get current integration status and health."""
        
        status = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'integration_enabled': self.integration_enabled,
            'configuration_valid': True,
            'output_directory_accessible': self.output_dir.exists(),
            'supply_chain_analyzer_ready': bool(self.sc_analyzer),
            'quality_gates_enabled': self.quality_gates.get('enabled', True),
            'notifications_enabled': self.config.get('notifications', {}).get('enabled', False),
            'performance_monitoring_enabled': self.perf_config.get('enabled', True),
            'non_breaking_mode': self.non_breaking,
            'priority_level': self.priority
        }
        
        # Check configuration validity
        config_validation = self.config_loader.validate_config()
        status['configuration_valid'] = config_validation.get('valid', False)
        status['configuration_warnings'] = config_validation.get('warnings', [])
        status['configuration_errors'] = config_validation.get('errors', [])
        
        # Check analyzer readiness
        if self.sc_analyzer:
            analyzer_validation = self.sc_analyzer.validate_configuration()
            status['analyzer_validation'] = analyzer_validation
        
        # Overall health check
        health_checks = [
            status['integration_enabled'],
            status['configuration_valid'],
            status['output_directory_accessible'],
            status['supply_chain_analyzer_ready']
        ]
        
        status['overall_health'] = 'HEALTHY' if all(health_checks) else 'DEGRADED'
        
        return status
    
def create_integration_adapter(self) -> 'SupplyChainAdapter':
        """Create adapter for easier integration with existing code."""
        
        return SupplyChainAdapter(self)

class SupplyChainAdapter:
    """Adapter class for easier integration with existing analyzer code."""
    
def __init__(self, integration: SupplyChainIntegration):
        self.integration = integration
    
def __call__(self, project_path: str = ".") -> Dict[str, Any]:
        """Make the adapter callable for easy integration."""
        
        return self.integration.integrate_with_analyzer(
            analysis_callback=None,
            project_path=project_path
        )
    
def analyze(self, project_path: str = ".") -> Dict[str, Any]:
        """Analyze project with supply chain security."""
        
        return self(project_path)
    
def with_existing_analyzer(self,
                                analyzer_callback: Callable,
                                project_path: str = ".") -> Dict[str, Any]:
        """Integrate with existing analyzer callback."""
        
        return self.integration.integrate_with_analyzer(
            analysis_callback=analyzer_callback,
            project_path=project_path
        )
    
def get_results_summary(self) -> Dict[str, Any]:
        """Get summary of recent analysis results."""
        
        output_dir = self.integration.output_dir
        results_files = list(output_dir.glob("integration-*.json"))
        
        if not results_files:
            return {'status': 'no_results', 'message': 'No analysis results found'}
        
        # Get the most recent results
        latest_file = max(results_files, key=lambda f: f.stat().st_mtime)
        
        try:
            with open(latest_file, 'r', encoding='utf-8') as f:
                results = json.load(f)
            
            return {
                'status': 'success',
                'timestamp': results.get('timestamp'),
                'integration_status': results.get('integration_status'),
                'performance_impact': results.get('performance_impact', {}),
                'quality_gates': results.get('quality_gate_results', {}),
                'supply_chain_summary': results.get('supply_chain_analysis', {}).get('summary', {}),
                'file_path': str(latest_file)
            }
            
        except Exception as e:
            return {'status': 'error', 'message': f'Could not read results: {e}'}
    
def is_healthy(self) -> bool:
        """Check if supply chain integration is healthy."""
        
        status = self.integration.get_integration_status()
        return status.get('overall_health') == 'HEALTHY'
    
def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics for supply chain analysis."""
        
        if hasattr(self.integration.sc_analyzer, 'performance_metrics'):
            return self.integration.sc_analyzer.performance_metrics.copy()
        
        return {'status': 'no_metrics_available'}