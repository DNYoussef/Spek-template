#!/usr/bin/env python3
"""
Performance Regression Detection System
Phase 3: Monitors and detects performance regressions from Phase 2 optimizations
Target: Maintain 38.9% execution time reduction and detect >10% regressions
"""

import json
import time
import subprocess
import sys
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import statistics
import matplotlib.pyplot as plt
import pandas as pd


class PerformanceRegressionDetector:
    """Detects performance regressions in CI/CD pipeline execution."""
    
    def __init__(self):
        self.phase2_baselines = self._load_phase2_baselines()
        self.regression_thresholds = {
            'execution_time_regression': 0.10,  # 10% regression threshold
            'memory_efficiency_regression': 0.05,  # 5% regression threshold
            'success_rate_regression': 0.05,    # 5% regression threshold
            'cost_increase_threshold': 0.15,    # 15% cost increase threshold
            'minimum_data_points': 5            # Minimum runs to analyze
        }
        
        self.detection_results = {
            'timestamp': datetime.now().isoformat(),
            'detection_type': 'performance_regression_analysis',
            'baselines': self.phase2_baselines,
            'current_metrics': {},
            'regression_analysis': {},
            'alerts': [],
            'recommendations': [],
            'overall_status': 'healthy'
        }
    
    def _load_phase2_baselines(self) -> Dict[str, Any]:
        """Load Phase 2 performance baselines for comparison."""
        baseline_files = [
            '.claude/.artifacts/phase2_validation_report.json',
            '.claude/.artifacts/monitoring/workflow_health_dashboard.json'
        ]
        
        baselines = {
            'execution_time_minutes': 55.0,     # Phase 2 target
            'memory_efficiency_score': 0.85,    # Phase 2 achieved
            'success_rate': 0.85,               # Phase 3 target
            'security_scan_time_minutes': 25.0, # Phase 2 target
            'cost_reduction_percent': 35.0,     # Phase 2 achieved
            'parallel_speedup_factor': 3.77     # Phase 2 measured
        }
        
        # Try to load actual baselines from artifacts
        for baseline_file in baseline_files:
            baseline_path = Path(baseline_file)
            if baseline_path.exists():
                try:
                    with open(baseline_path, 'r') as f:
                        baseline_data = json.load(f)
                    
                    # Extract Phase 2 performance data
                    if 'comparisons' in baseline_data:
                        improvements = baseline_data['comparisons'].get('improvements', {})
                        if 'execution_time' in improvements:
                            baselines['execution_time_minutes'] = improvements['execution_time']['phase2_minutes']
                        if 'memory_efficiency' in improvements:
                            baselines['memory_efficiency_score'] = improvements['memory_efficiency']['phase2_score']
                    
                    if 'performance_metrics' in baseline_data:
                        perf_metrics = baseline_data['performance_metrics']
                        baselines['success_rate'] = perf_metrics.get('overall_success_rate', baselines['success_rate'])
                        baselines['execution_time_minutes'] = perf_metrics.get('avg_execution_time_minutes', baselines['execution_time_minutes'])
                    
                    break  # Use first successful load
                    
                except Exception as e:
                    print(f'Warning: Could not load baseline from {baseline_file}: {e}')
        
        return baselines
    
    def collect_current_performance_metrics(self) -> Dict[str, Any]:
        """Collect current performance metrics from recent workflow runs."""
        print("Collecting current performance metrics...")
        
        current_metrics = {
            'data_collection_timestamp': datetime.now().isoformat(),
            'workflow_metrics': {},
            'system_metrics': {},
            'trend_analysis': {}
        }
        
        try:
            # Get recent workflow runs (last 20 runs)
            result = subprocess.run(
                ['gh', 'run', 'list', '--limit', '20', '--json', 
                 'status,conclusion,name,createdAt,runStartedAt,updatedAt,workflowName'],
                capture_output=True, text=True, timeout=60
            )
            
            if result.returncode == 0:
                runs = json.loads(result.stdout)
                
                # Group runs by workflow
                workflow_runs = {}
                for run in runs:
                    workflow_name = run.get('workflowName', run.get('name', 'unknown'))
                    
                    if workflow_name not in workflow_runs:
                        workflow_runs[workflow_name] = []
                    
                    # Calculate execution time if available
                    execution_time = None
                    if run.get('runStartedAt') and run.get('updatedAt'):
                        try:
                            start_time = datetime.fromisoformat(run['runStartedAt'].replace('Z', '+00:00'))
                            end_time = datetime.fromisoformat(run['updatedAt'].replace('Z', '+00:00'))
                            execution_time = (end_time - start_time).total_seconds() / 60  # minutes
                        except:
                            pass
                    
                    workflow_runs[workflow_name].append({
                        'status': run.get('status'),
                        'conclusion': run.get('conclusion'),
                        'created_at': run.get('createdAt'),
                        'execution_time_minutes': execution_time
                    })
                
                # Analyze metrics per workflow
                for workflow_name, runs_data in workflow_runs.items():
                    if len(runs_data) < self.regression_thresholds['minimum_data_points']:
                        continue
                    
                    # Calculate success rate
                    successful_runs = sum(1 for run in runs_data if run.get('conclusion') == 'success')
                    success_rate = successful_runs / len(runs_data)
                    
                    # Calculate execution time statistics
                    execution_times = [run['execution_time_minutes'] for run in runs_data 
                                     if run['execution_time_minutes'] is not None]
                    
                    exec_time_stats = {}
                    if execution_times:
                        exec_time_stats = {
                            'mean': statistics.mean(execution_times),
                            'median': statistics.median(execution_times),
                            'std_dev': statistics.stdev(execution_times) if len(execution_times) > 1 else 0,
                            'min': min(execution_times),
                            'max': max(execution_times),
                            'p95': sorted(execution_times)[int(len(execution_times) * 0.95)] if len(execution_times) > 1 else execution_times[0]
                        }
                    
                    current_metrics['workflow_metrics'][workflow_name] = {
                        'success_rate': success_rate,
                        'total_runs': len(runs_data),
                        'successful_runs': successful_runs,
                        'execution_time_stats': exec_time_stats,
                        'data_points': len(execution_times)
                    }
                
                # Calculate system-wide metrics
                all_execution_times = []
                total_successful = 0
                total_runs = 0
                
                for workflow_metrics in current_metrics['workflow_metrics'].values():
                    total_successful += workflow_metrics['successful_runs']
                    total_runs += workflow_metrics['total_runs']
                    
                    exec_stats = workflow_metrics.get('execution_time_stats', {})
                    if 'mean' in exec_stats:
                        all_execution_times.append(exec_stats['mean'])
                
                current_metrics['system_metrics'] = {
                    'overall_success_rate': total_successful / total_runs if total_runs > 0 else 0,
                    'avg_execution_time_minutes': statistics.mean(all_execution_times) if all_execution_times else 0,
                    'total_workflows_analyzed': len(current_metrics['workflow_metrics']),
                    'total_runs_analyzed': total_runs
                }
                
        except Exception as e:
            print(f'Warning: Could not collect GitHub metrics: {e}')
            # Fallback to monitoring data if available
            current_metrics = self._get_fallback_metrics()
        
        self.detection_results['current_metrics'] = current_metrics
        return current_metrics
    
    def _get_fallback_metrics(self) -> Dict[str, Any]:
        """Fallback metrics collection from monitoring data."""
        monitoring_file = Path('.claude/.artifacts/monitoring/workflow_health_dashboard.json')
        
        if monitoring_file.exists():
            try:
                with open(monitoring_file, 'r') as f:
                    monitoring_data = json.load(f)
                
                # Convert monitoring data to current metrics format
                workflow_metrics = {}
                for workflow_name, workflow_data in monitoring_data.get('workflow_status', {}).items():
                    workflow_metrics[workflow_name] = {
                        'success_rate': workflow_data.get('success_rate', 0.8),
                        'total_runs': workflow_data.get('total_runs', 5),
                        'successful_runs': workflow_data.get('successful_runs', 4),
                        'execution_time_stats': {
                            'mean': workflow_data.get('avg_execution_time_minutes', 50.0),
                            'median': workflow_data.get('avg_execution_time_minutes', 50.0),
                            'std_dev': 5.0,  # Estimated
                            'data_points': workflow_data.get('total_runs', 5)
                        }
                    }
                
                # System metrics from monitoring data
                perf_metrics = monitoring_data.get('performance_metrics', {})
                system_metrics = {
                    'overall_success_rate': perf_metrics.get('overall_success_rate', 0.8),
                    'avg_execution_time_minutes': perf_metrics.get('avg_execution_time_minutes', 50.0),
                    'total_workflows_analyzed': len(workflow_metrics),
                    'data_source': 'monitoring_fallback'
                }
                
                return {
                    'data_collection_timestamp': datetime.now().isoformat(),
                    'workflow_metrics': workflow_metrics,
                    'system_metrics': system_metrics,
                    'trend_analysis': {}
                }
                
            except Exception as e:
                print(f'Warning: Could not load monitoring fallback: {e}')
        
        # Ultimate fallback with estimated current performance
        return {
            'data_collection_timestamp': datetime.now().isoformat(),
            'workflow_metrics': {},
            'system_metrics': {
                'overall_success_rate': 0.75,  # Conservative estimate
                'avg_execution_time_minutes': 60.0,  # Slightly worse than Phase 2
                'total_workflows_analyzed': 0,
                'data_source': 'estimated'
            },
            'trend_analysis': {}
        }
    
    def detect_performance_regressions(self, current_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Detect performance regressions against Phase 2 baselines."""
        print("Analyzing performance regressions...")
        
        regression_analysis = {
            'execution_time_regression': self._analyze_execution_time_regression(current_metrics),
            'success_rate_regression': self._analyze_success_rate_regression(current_metrics),
            'memory_efficiency_regression': self._analyze_memory_efficiency_regression(current_metrics),
            'cost_regression': self._analyze_cost_regression(current_metrics),
            'overall_regression_detected': False,
            'regression_severity': 'none'
        }
        
        # Determine overall regression status
        regression_indicators = []
        for analysis_type, analysis_data in regression_analysis.items():
            if isinstance(analysis_data, dict) and analysis_data.get('regression_detected', False):
                regression_indicators.append(analysis_type)
                
                severity = analysis_data.get('severity', 'low')
                if severity == 'critical' and regression_analysis['regression_severity'] not in ['critical']:
                    regression_analysis['regression_severity'] = 'critical'
                elif severity == 'high' and regression_analysis['regression_severity'] not in ['critical', 'high']:
                    regression_analysis['regression_severity'] = 'high'
                elif severity == 'medium' and regression_analysis['regression_severity'] == 'none':
                    regression_analysis['regression_severity'] = 'medium'
        
        regression_analysis['overall_regression_detected'] = len(regression_indicators) > 0
        regression_analysis['regression_types'] = regression_indicators
        
        self.detection_results['regression_analysis'] = regression_analysis
        return regression_analysis
    
    def _analyze_execution_time_regression(self, current_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze execution time regression."""
        baseline_exec_time = self.phase2_baselines['execution_time_minutes']
        current_exec_time = current_metrics['system_metrics']['avg_execution_time_minutes']
        
        if current_exec_time == 0:  # No data available
            return {
                'regression_detected': False,
                'reason': 'insufficient_data',
                'severity': 'none'
            }
        
        # Calculate regression percentage
        regression_percent = (current_exec_time - baseline_exec_time) / baseline_exec_time
        regression_threshold = self.regression_thresholds['execution_time_regression']
        
        regression_detected = regression_percent > regression_threshold
        
        # Determine severity
        severity = 'none'
        if regression_percent > 0.25:  # 25% regression
            severity = 'critical'
        elif regression_percent > 0.15:  # 15% regression
            severity = 'high'
        elif regression_percent > regression_threshold:
            severity = 'medium'
        
        return {
            'regression_detected': regression_detected,
            'baseline_minutes': baseline_exec_time,
            'current_minutes': current_exec_time,
            'regression_percent': regression_percent,
            'regression_threshold': regression_threshold,
            'time_delta_minutes': current_exec_time - baseline_exec_time,
            'severity': severity,
            'phase2_target_met': current_exec_time <= baseline_exec_time * 1.1  # Within 10% of target
        }
    
    def _analyze_success_rate_regression(self, current_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze success rate regression."""
        baseline_success_rate = self.phase2_baselines['success_rate']
        current_success_rate = current_metrics['system_metrics']['overall_success_rate']
        
        if current_success_rate == 0:  # No data available
            return {
                'regression_detected': False,
                'reason': 'insufficient_data',
                'severity': 'none'
            }
        
        # Calculate regression (negative change for success rate)
        regression_percent = (baseline_success_rate - current_success_rate) / baseline_success_rate
        regression_threshold = self.regression_thresholds['success_rate_regression']
        
        regression_detected = regression_percent > regression_threshold
        
        # Determine severity
        severity = 'none'
        if current_success_rate < 0.5:  # Below 50% success rate
            severity = 'critical'
        elif current_success_rate < 0.7:  # Below 70% success rate
            severity = 'high'
        elif regression_percent > regression_threshold:
            severity = 'medium'
        
        return {
            'regression_detected': regression_detected,
            'baseline_success_rate': baseline_success_rate,
            'current_success_rate': current_success_rate,
            'regression_percent': regression_percent,
            'regression_threshold': regression_threshold,
            'success_rate_delta': current_success_rate - baseline_success_rate,
            'severity': severity,
            'phase3_target_met': current_success_rate >= 0.85  # Phase 3 target
        }
    
    def _analyze_memory_efficiency_regression(self, current_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze memory efficiency regression (estimated)."""
        baseline_memory_efficiency = self.phase2_baselines['memory_efficiency_score']
        
        # Estimate current memory efficiency based on execution time and success rate
        current_exec_time = current_metrics['system_metrics']['avg_execution_time_minutes']
        current_success_rate = current_metrics['system_metrics']['overall_success_rate']
        
        # Heuristic: memory efficiency correlates with execution time and success rate
        baseline_exec_time = self.phase2_baselines['execution_time_minutes']
        
        if current_exec_time > 0 and baseline_exec_time > 0:
            # Estimate memory efficiency inversely related to execution time ratio
            exec_time_ratio = baseline_exec_time / current_exec_time
            success_factor = current_success_rate / self.phase2_baselines['success_rate']
            
            estimated_memory_efficiency = baseline_memory_efficiency * exec_time_ratio * success_factor
            estimated_memory_efficiency = min(1.0, max(0.0, estimated_memory_efficiency))  # Clamp to [0,1]
        else:
            estimated_memory_efficiency = baseline_memory_efficiency * 0.9  # Conservative estimate
        
        # Calculate regression
        regression_percent = (baseline_memory_efficiency - estimated_memory_efficiency) / baseline_memory_efficiency
        regression_threshold = self.regression_thresholds['memory_efficiency_regression']
        
        regression_detected = regression_percent > regression_threshold
        
        # Determine severity
        severity = 'none'
        if estimated_memory_efficiency < 0.6:  # Below 60% efficiency
            severity = 'high'
        elif regression_percent > regression_threshold * 2:  # Double threshold
            severity = 'medium'
        elif regression_percent > regression_threshold:
            severity = 'low'
        
        return {
            'regression_detected': regression_detected,
            'baseline_memory_efficiency': baseline_memory_efficiency,
            'estimated_current_efficiency': estimated_memory_efficiency,
            'regression_percent': regression_percent,
            'regression_threshold': regression_threshold,
            'efficiency_delta': estimated_memory_efficiency - baseline_memory_efficiency,
            'severity': severity,
            'estimation_method': 'execution_time_correlation'
        }
    
    def _analyze_cost_regression(self, current_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze cost regression based on execution time and resource usage."""
        baseline_cost_reduction = self.phase2_baselines['cost_reduction_percent'] / 100  # Convert to decimal
        
        # Estimate current cost based on execution time regression
        exec_time_analysis = self.detection_results['regression_analysis'].get('execution_time_regression', {})
        
        if 'regression_percent' in exec_time_analysis:
            # Cost increases roughly linearly with execution time
            exec_time_regression = exec_time_analysis['regression_percent']
            estimated_cost_increase = exec_time_regression
            
            # Current cost reduction compared to Phase 1
            estimated_current_cost_reduction = baseline_cost_reduction - estimated_cost_increase
            
            # Cost regression detection
            cost_increase_threshold = self.regression_thresholds['cost_increase_threshold']
            regression_detected = estimated_cost_increase > cost_increase_threshold
            
            # Severity assessment
            severity = 'none'
            if estimated_cost_increase > 0.3:  # 30% cost increase
                severity = 'critical'
            elif estimated_cost_increase > 0.2:  # 20% cost increase
                severity = 'high'
            elif estimated_cost_increase > cost_increase_threshold:
                severity = 'medium'
            
            return {
                'regression_detected': regression_detected,
                'baseline_cost_reduction_percent': baseline_cost_reduction * 100,
                'estimated_current_cost_reduction_percent': estimated_current_cost_reduction * 100,
                'estimated_cost_increase_percent': estimated_cost_increase * 100,
                'cost_increase_threshold_percent': cost_increase_threshold * 100,
                'severity': severity,
                'estimation_method': 'execution_time_correlation'
            }
        
        # Fallback when no execution time data
        return {
            'regression_detected': False,
            'reason': 'insufficient_execution_time_data',
            'severity': 'none'
        }
    
    def generate_performance_alerts(self, regression_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate performance alerts based on regression analysis."""
        alerts = []
        
        for analysis_type, analysis_data in regression_analysis.items():
            if not isinstance(analysis_data, dict) or not analysis_data.get('regression_detected', False):
                continue
            
            severity = analysis_data.get('severity', 'low')
            
            if analysis_type == 'execution_time_regression':
                regression_percent = analysis_data.get('regression_percent', 0) * 100
                current_minutes = analysis_data.get('current_minutes', 0)
                baseline_minutes = analysis_data.get('baseline_minutes', 0)
                
                alerts.append({
                    'type': 'execution_time_regression',
                    'severity': severity,
                    'message': f'Execution time regression detected: {regression_percent:.1f}% increase',
                    'details': f'Current: {current_minutes:.1f}min, Baseline: {baseline_minutes:.1f}min',
                    'action': 'investigate_performance_bottlenecks',
                    'priority': 'high' if severity in ['critical', 'high'] else 'medium'
                })
            
            elif analysis_type == 'success_rate_regression':
                current_rate = analysis_data.get('current_success_rate', 0) * 100
                baseline_rate = analysis_data.get('baseline_success_rate', 0) * 100
                
                alerts.append({
                    'type': 'success_rate_regression',
                    'severity': severity,
                    'message': f'Success rate regression detected: {current_rate:.1f}% vs {baseline_rate:.1f}% baseline',
                    'details': f'Success rate dropped by {baseline_rate - current_rate:.1f} percentage points',
                    'action': 'investigate_workflow_failures',
                    'priority': 'critical' if severity == 'critical' else 'high'
                })
            
            elif analysis_type == 'memory_efficiency_regression':
                current_efficiency = analysis_data.get('estimated_current_efficiency', 0) * 100
                baseline_efficiency = analysis_data.get('baseline_memory_efficiency', 0) * 100
                
                alerts.append({
                    'type': 'memory_efficiency_regression',
                    'severity': severity,
                    'message': f'Memory efficiency regression detected: {current_efficiency:.1f}% vs {baseline_efficiency:.1f}% baseline',
                    'details': 'Estimated based on execution time correlation',
                    'action': 'review_memory_optimization',
                    'priority': 'medium'
                })
            
            elif analysis_type == 'cost_regression':
                cost_increase = analysis_data.get('estimated_cost_increase_percent', 0)
                
                alerts.append({
                    'type': 'cost_regression',
                    'severity': severity,
                    'message': f'Cost regression detected: {cost_increase:.1f}% increase over Phase 2 baselines',
                    'details': 'Estimated based on execution time and resource usage',
                    'action': 'optimize_resource_allocation',
                    'priority': 'high' if severity in ['critical', 'high'] else 'medium'
                })
        
        self.detection_results['alerts'] = alerts
        return alerts
    
    def generate_recommendations(self, regression_analysis: Dict[str, Any], alerts: List[Dict[str, Any]]) -> List[str]:
        """Generate actionable recommendations based on regression analysis."""
        recommendations = []
        
        # Overall status assessment
        if regression_analysis['overall_regression_detected']:
            severity = regression_analysis['regression_severity']
            
            if severity == 'critical':
                recommendations.append('CRITICAL: Immediate performance intervention required - multiple severe regressions detected')
                recommendations.append('Consider activating circuit breaker and automated rollback mechanisms')
            elif severity == 'high':
                recommendations.append('HIGH PRIORITY: Significant performance regressions detected - investigate immediately')
            else:
                recommendations.append('Performance regressions detected - schedule optimization review')
        
        # Specific recommendations by alert type
        alert_types = [alert['type'] for alert in alerts]
        
        if 'execution_time_regression' in alert_types:
            recommendations.append('Review parallel execution efficiency and runner resource allocation')
            recommendations.append('Analyze workflow execution bottlenecks and optimize critical path')
        
        if 'success_rate_regression' in alert_types:
            recommendations.append('Investigate recent workflow failures and fix unstable components')
            recommendations.append('Review error handling and retry mechanisms')
        
        if 'memory_efficiency_regression' in alert_types:
            recommendations.append('Review Phase 2 memory optimizations - check cache hit rates and memory pressure')
            recommendations.append('Monitor actual memory usage patterns in production workflows')
        
        if 'cost_regression' in alert_types:
            recommendations.append('Optimize tiered runner allocation - ensure appropriate resource sizing')
            recommendations.append('Review workflow parallelization efficiency')
        
        # Preventive recommendations
        if not regression_analysis['overall_regression_detected']:
            recommendations.append('Performance monitoring healthy - continue baseline tracking')
            recommendations.append('Consider proactive optimization opportunities')
        
        # Data quality recommendations
        current_metrics = self.detection_results.get('current_metrics', {})
        total_runs = current_metrics.get('system_metrics', {}).get('total_runs_analyzed', 0)
        
        if total_runs < 10:
            recommendations.append('Increase monitoring data collection - more runs needed for accurate regression detection')
        
        self.detection_results['recommendations'] = recommendations
        return recommendations
    
    def create_performance_trend_visualization(self, current_metrics: Dict[str, Any]) -> bool:
        """Create performance trend visualization (if matplotlib available)."""
        try:
            # Create a simple performance trend chart
            metrics_over_time = []
            
            # Use workflow metrics to simulate time series
            workflow_metrics = current_metrics.get('workflow_metrics', {})
            
            if not workflow_metrics:
                return False
            
            # Create performance summary chart
            fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 8))
            fig.suptitle('Performance Regression Analysis Dashboard', fontsize=16)
            
            # 1. Execution Time Comparison
            baselines = [self.phase2_baselines['execution_time_minutes']]
            current_times = [current_metrics['system_metrics']['avg_execution_time_minutes']]
            
            ax1.bar(['Phase 2 Baseline', 'Current'], baselines + current_times, 
                   color=['green', 'red' if current_times[0] > baselines[0] else 'blue'])
            ax1.set_ylabel('Execution Time (minutes)')
            ax1.set_title('Execution Time Comparison')
            
            # 2. Success Rate Comparison
            baseline_success = [self.phase2_baselines['success_rate'] * 100]
            current_success = [current_metrics['system_metrics']['overall_success_rate'] * 100]
            
            ax2.bar(['Phase 2 Baseline', 'Current'], baseline_success + current_success,
                   color=['green', 'red' if current_success[0] < baseline_success[0] else 'blue'])
            ax2.set_ylabel('Success Rate (%)')
            ax2.set_title('Success Rate Comparison')
            
            # 3. Workflow Success Rates
            workflow_names = list(workflow_metrics.keys())[:5]  # Top 5 workflows
            success_rates = [workflow_metrics[name]['success_rate'] * 100 for name in workflow_names]
            
            ax3.barh(workflow_names, success_rates)
            ax3.set_xlabel('Success Rate (%)')
            ax3.set_title('Workflow Success Rates')
            
            # 4. Performance Regression Summary
            regression_analysis = self.detection_results.get('regression_analysis', {})
            regression_types = []
            regression_values = []
            
            for reg_type, reg_data in regression_analysis.items():
                if isinstance(reg_data, dict) and reg_data.get('regression_detected', False):
                    regression_types.append(reg_type.replace('_', ' ').title())
                    
                    if 'regression_percent' in reg_data:
                        regression_values.append(reg_data['regression_percent'] * 100)
                    else:
                        regression_values.append(5.0)  # Default value
            
            if regression_types:
                ax4.bar(regression_types, regression_values, color='red')
                ax4.set_ylabel('Regression (%)')
                ax4.set_title('Detected Regressions')
                ax4.tick_params(axis='x', rotation=45)
            else:
                ax4.text(0.5, 0.5, 'No Regressions\\nDetected', ha='center', va='center', 
                        fontsize=14, color='green')
                ax4.set_title('Regression Status')
            
            plt.tight_layout()
            
            # Save chart
            chart_path = Path('.claude/.artifacts/monitoring/performance_regression_chart.png')
            chart_path.parent.mkdir(exist_ok=True, parents=True)
            
            plt.savefig(chart_path, dpi=150, bbox_inches='tight')
            plt.close()
            
            return True
            
        except Exception as e:
            print(f'Warning: Could not create performance visualization: {e}')
            return False
    
    def run_regression_detection(self) -> Dict[str, Any]:
        """Run complete performance regression detection analysis."""
        print("Starting Performance Regression Detection")
        print("=" * 50)
        
        # Collect current metrics
        current_metrics = self.collect_current_performance_metrics()
        
        # Detect regressions
        regression_analysis = self.detect_performance_regressions(current_metrics)
        
        # Generate alerts
        alerts = self.generate_performance_alerts(regression_analysis)
        
        # Generate recommendations  
        recommendations = self.generate_recommendations(regression_analysis, alerts)
        
        # Create visualization
        self.create_performance_trend_visualization(current_metrics)
        
        # Determine overall status
        if regression_analysis['regression_severity'] == 'critical':
            self.detection_results['overall_status'] = 'critical'
        elif regression_analysis['regression_severity'] in ['high', 'medium']:
            self.detection_results['overall_status'] = 'warning'
        else:
            self.detection_results['overall_status'] = 'healthy'
        
        return self.detection_results


def main():
    """Main regression detection execution."""
    print("Phase 3: Performance Regression Detection")
    print("=" * 50)
    
    detector = PerformanceRegressionDetector()
    results = detector.run_regression_detection()
    
    # Save results
    artifacts_dir = Path('.claude/.artifacts/monitoring')
    artifacts_dir.mkdir(exist_ok=True, parents=True)
    
    results_file = artifacts_dir / 'performance_regression_report.json'
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    # Print summary
    print("\n" + "=" * 50)
    print("PERFORMANCE REGRESSION DETECTION SUMMARY")
    print("=" * 50)
    
    print(f"Overall Status: {results['overall_status'].upper()}")
    print(f"Regression Detected: {results['regression_analysis']['overall_regression_detected']}")
    print(f"Regression Severity: {results['regression_analysis']['regression_severity'].upper()}")
    print(f"Active Alerts: {len(results['alerts'])}")
    
    # Show key metrics comparison
    current_metrics = results['current_metrics']['system_metrics']
    baselines = results['baselines']
    
    print("\nKey Metrics Comparison:")
    print(f"  Execution Time: {current_metrics.get('avg_execution_time_minutes', 0):.1f}min vs {baselines['execution_time_minutes']:.1f}min baseline")
    print(f"  Success Rate: {current_metrics.get('overall_success_rate', 0):.1%} vs {baselines['success_rate']:.1%} baseline")
    print(f"  Workflows Analyzed: {current_metrics.get('total_workflows_analyzed', 0)}")
    
    # Show alerts
    if results['alerts']:
        print("\nActive Alerts:")
        for alert in results['alerts'][:3]:  # Top 3 alerts
            print(f"  - {alert['severity'].upper()}: {alert['message']}")
    
    # Show recommendations
    if results['recommendations']:
        print("\nTop Recommendations:")
        for i, rec in enumerate(results['recommendations'][:3], 1):
            print(f"  {i}. {rec}")
    
    print(f"\nDetailed report saved to: {results_file}")
    
    # Exit with status code based on overall status
    if results['overall_status'] == 'critical':
        sys.exit(2)  # Critical status
    elif results['overall_status'] == 'warning':
        sys.exit(1)  # Warning status
    else:
        sys.exit(0)  # Healthy status


if __name__ == '__main__':
    main()