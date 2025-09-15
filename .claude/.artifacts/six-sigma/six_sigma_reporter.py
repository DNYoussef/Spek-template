"""
Six Sigma Reporting Pipeline - Phase 3 Artifact Generation
===========================================================

Implements comprehensive Six Sigma quality reporting for enterprise analyzer system.
Feature flag controlled with zero breaking changes to existing functionality.
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

# Feature flag for Six Sigma reporting
ENABLE_SIX_SIGMA_REPORTING = os.getenv('ENABLE_SIX_SIGMA_REPORTING', 'false').lower() == 'true'

@dataclass
class CTQMetric:
    """Critical-to-Quality metric definition"""
    name: str
    current_value: float
    target_value: float
    tolerance: float
    unit: str
    trend: List[float]
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
    
    @property
    def is_within_spec(self) -> bool:
        """Check if current value is within specification limits"""
        return abs(self.current_value - self.target_value) <= self.tolerance
    
    @property
    def sigma_level(self) -> float:
        """Calculate sigma level for this metric"""
        if self.tolerance == 0:
            return 6.0 if self.current_value == self.target_value else 0.0
        
        deviation = abs(self.current_value - self.target_value)
        sigma = deviation / (self.tolerance / 3)  # 3-sigma tolerance
        return max(0, 6 - sigma)

@dataclass 
class DPMOMetrics:
    """Defects Per Million Opportunities metrics"""
    defects: int
    opportunities: int
    dpmo: float
    sigma_level: float
    category: str
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()

class SixSigmaReporter:
    """Main Six Sigma reporting engine"""
    
    def __init__(self, output_dir: str = ".claude/.artifacts/six-sigma"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.logger = logging.getLogger(__name__)
        
        # Initialize CTQ metrics with NASA POT10 targets
        self.ctq_definitions = {
            'nasa_pot10_compliance': CTQMetric(
                name='NASA POT10 Compliance',
                current_value=0.0,
                target_value=95.0,
                tolerance=5.0,
                unit='percentage',
                trend=[]
            ),
            'code_coverage': CTQMetric(
                name='Code Coverage',
                current_value=0.0,
                target_value=85.0,
                tolerance=10.0,
                unit='percentage',
                trend=[]
            ),
            'god_object_count': CTQMetric(
                name='God Object Count',
                current_value=0.0,
                target_value=0.0,
                tolerance=2.0,
                unit='count',
                trend=[]
            ),
            'mece_score': CTQMetric(
                name='MECE Score',
                current_value=0.0,
                target_value=0.85,
                tolerance=0.10,
                unit='score',
                trend=[]
            )
        }
    
    def is_enabled(self) -> bool:
        """Check if Six Sigma reporting is enabled via feature flag"""
        return ENABLE_SIX_SIGMA_REPORTING
    
    def generate_ctq_summary(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate Critical-to-Quality summary from analysis results"""
        if not self.is_enabled():
            return {"status": "disabled", "message": "Six Sigma reporting disabled"}
        
        try:
            # Update CTQ metrics from analysis results
            self._update_ctq_metrics(analysis_results)
            
            # Generate summary
            summary = {
                "timestamp": datetime.now().isoformat(),
                "ctq_metrics": {},
                "overall_sigma_level": 0.0,
                "recommendations": []
            }
            
            total_sigma = 0.0
            for name, metric in self.ctq_definitions.items():
                summary["ctq_metrics"][name] = asdict(metric)
                total_sigma += metric.sigma_level
            
            summary["overall_sigma_level"] = total_sigma / len(self.ctq_definitions)
            summary["recommendations"] = self._generate_recommendations()
            
            # Save to artifacts
            output_file = self.output_dir / "ctq_summary.json"
            with open(output_file, 'w') as f:
                json.dump(summary, f, indent=2)
            
            self.logger.info(f"CTQ summary generated: {output_file}")
            return summary
            
        except Exception as e:
            self.logger.error(f"Error generating CTQ summary: {e}")
            return {"status": "error", "message": str(e)}
    
    def generate_spc_chart(self, historical_data: List[Dict[str, Any]]) -> str:
        """Generate Statistical Process Control chart"""
        if not self.is_enabled():
            return "Six Sigma reporting disabled"
        
        try:
            chart_path = self.output_dir / "spc_chart.png"
            
            # Create SPC chart with control limits
            fig, axes = plt.subplots(2, 2, figsize=(15, 10))
            fig.suptitle('Statistical Process Control Charts', fontsize=16)
            
            metrics = ['nasa_pot10_compliance', 'code_coverage', 'god_object_count', 'mece_score']
            
            for i, metric_name in enumerate(metrics):
                ax = axes[i//2, i%2]
                metric = self.ctq_definitions[metric_name]
                
                # Plot trend data
                if metric.trend:
                    x_vals = range(len(metric.trend))
                    ax.plot(x_vals, metric.trend, 'b-o', label='Actual')
                    
                    # Control limits (target ± 3σ)
                    ucl = metric.target_value + metric.tolerance
                    lcl = metric.target_value - metric.tolerance
                    
                    ax.axhline(y=metric.target_value, color='g', linestyle='-', label='Target')
                    ax.axhline(y=ucl, color='r', linestyle='--', label='UCL')
                    ax.axhline(y=lcl, color='r', linestyle='--', label='LCL')
                    
                    ax.fill_between(x_vals, lcl, ucl, alpha=0.2, color='green')
                
                ax.set_title(f'{metric.name} ({metric.unit})')
                ax.legend()
                ax.grid(True, alpha=0.3)
            
            plt.tight_layout()
            plt.savefig(chart_path, dpi=300, bbox_inches='tight')
            plt.close()
            
            self.logger.info(f"SPC chart generated: {chart_path}")
            return str(chart_path)
            
        except Exception as e:
            self.logger.error(f"Error generating SPC chart: {e}")
            return f"Error: {e}"
    
    def calculate_dpmo(self, defects_data: Dict[str, Any]) -> Dict[str, DPMOMetrics]:
        """Calculate Defects Per Million Opportunities"""
        if not self.is_enabled():
            return {"status": "disabled"}
        
        try:
            dpmo_metrics = {}
            
            categories = {
                'code_quality': {
                    'defects': defects_data.get('code_violations', 0),
                    'opportunities': defects_data.get('total_lines', 1000)
                },
                'security': {
                    'defects': defects_data.get('security_issues', 0),
                    'opportunities': defects_data.get('security_checks', 100)
                },
                'performance': {
                    'defects': defects_data.get('performance_issues', 0),
                    'opportunities': defects_data.get('performance_tests', 50)
                }
            }
            
            for category, data in categories.items():
                defects = data['defects']
                opportunities = data['opportunities']
                
                # Calculate DPMO
                dpmo = (defects / opportunities) * 1_000_000 if opportunities > 0 else 0
                
                # Convert DPMO to Sigma level (approximate)
                if dpmo == 0:
                    sigma_level = 6.0
                elif dpmo >= 691_462:
                    sigma_level = 1.0
                elif dpmo >= 308_538:
                    sigma_level = 2.0
                elif dpmo >= 66_807:
                    sigma_level = 3.0
                elif dpmo >= 6_210:
                    sigma_level = 4.0
                elif dpmo >= 233:
                    sigma_level = 5.0
                else:
                    sigma_level = 6.0
                
                dpmo_metrics[category] = DPMOMetrics(
                    defects=defects,
                    opportunities=opportunities,
                    dpmo=dpmo,
                    sigma_level=sigma_level,
                    category=category
                )
            
            # Save DPMO metrics
            output_file = self.output_dir / "dpmo_metrics.json"
            with open(output_file, 'w') as f:
                json.dump({k: asdict(v) for k, v in dpmo_metrics.items()}, f, indent=2)
            
            self.logger.info(f"DPMO metrics calculated: {output_file}")
            return dpmo_metrics
            
        except Exception as e:
            self.logger.error(f"Error calculating DPMO: {e}")
            return {"status": "error", "message": str(e)}
    
    def _update_ctq_metrics(self, analysis_results: Dict[str, Any]):
        """Update CTQ metrics from analysis results"""
        # Update NASA POT10 compliance
        if 'nasa_compliance_score' in analysis_results:
            self.ctq_definitions['nasa_pot10_compliance'].current_value = analysis_results['nasa_compliance_score']
            self.ctq_definitions['nasa_pot10_compliance'].trend.append(analysis_results['nasa_compliance_score'])
        
        # Update code coverage
        if 'code_coverage' in analysis_results:
            self.ctq_definitions['code_coverage'].current_value = analysis_results['code_coverage']
            self.ctq_definitions['code_coverage'].trend.append(analysis_results['code_coverage'])
        
        # Update god object count
        if 'god_objects' in analysis_results:
            count = len(analysis_results['god_objects']) if isinstance(analysis_results['god_objects'], list) else analysis_results['god_objects']
            self.ctq_definitions['god_object_count'].current_value = count
            self.ctq_definitions['god_object_count'].trend.append(count)
        
        # Update MECE score
        if 'mece_score' in analysis_results:
            self.ctq_definitions['mece_score'].current_value = analysis_results['mece_score']
            self.ctq_definitions['mece_score'].trend.append(analysis_results['mece_score'])
    
    def _generate_recommendations(self) -> List[str]:
        """Generate improvement recommendations based on CTQ metrics"""
        recommendations = []
        
        for name, metric in self.ctq_definitions.items():
            if not metric.is_within_spec:
                if metric.sigma_level < 3.0:
                    recommendations.append(f"CRITICAL: {metric.name} below 3-sigma level - immediate action required")
                elif metric.sigma_level < 4.0:
                    recommendations.append(f"WARNING: {metric.name} below 4-sigma level - improvement needed")
                else:
                    recommendations.append(f"MONITOR: {metric.name} trending toward specification limits")
        
        if not recommendations:
            recommendations.append("All CTQ metrics within specification limits - maintain current practices")
        
        return recommendations

# Integration point for existing analyzer
def generate_six_sigma_report(analysis_results: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Integration function for existing analyzer system"""
    if not ENABLE_SIX_SIGMA_REPORTING:
        return None
    
    reporter = SixSigmaReporter()
    return reporter.generate_ctq_summary(analysis_results)