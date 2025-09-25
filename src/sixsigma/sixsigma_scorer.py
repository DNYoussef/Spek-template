from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS, MAXIMUM_NESTED_DEPTH, MAXIMUM_RETRY_ATTEMPTS

import json
import math
import statistics
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path
import yaml
import csv

@dataclass
class DefectRecord:
    """Individual defect record for DPMO calculation"""
    category: str
    severity: str
    stage: str
    timestamp: datetime
    description: str
    weight: float = 1.0
    resolved: bool = False
    resolution_time: Optional[timedelta] = None

@dataclass
class ProcessStage:
    """Process stage data for RTY calculation"""
    name: str
    opportunities: int
    defects: int
    yield_rate: float
    target_yield: float
    
@property
def meets_target(self) -> bool:
        return self.yield_rate >= self.target_yield

@dataclass
class SixSigmaMetrics:
    """Complete Six Sigma metrics package"""
    dpmo: float
    rty: float
    sigma_level: float
    process_capability: float
    defect_categories: Dict[str, int]
    stage_yields: Dict[str, float]
    improvement_opportunities: List[str]
    timestamp: datetime
    
def to_dict(self) -> Dict[str, Any]:
        result = asdict(self)
        result['timestamp'] = self.timestamp.isoformat()
        return result

class SixSigmaScorer:
    """
    Six Sigma Quality Scorer
    Calculates DPMO, RTY, and Sigma levels for theater-free quality validation
    """
    
def __init__(self, config_path: str = "config/checks.yaml"):
        """Initialize with configuration"""
        self.config = self._load_config(config_path)
        self.defect_records: List[DefectRecord] = []
        self.process_stages: List[ProcessStage] = []
        
def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            # Fallback configuration
            return {
                'quality_gates': {
                    'six_sigma': {
                        'target_sigma_level': 4.0,
                        'minimum_sigma_level': MAXIMUM_RETRY_ATTEMPTS.0,
                        'defect_categories': {
                            'critical': {'weight': MAXIMUM_FUNCTION_PARAMETERS.0, 'threshold': 0},
                            'major': {'weight': MAXIMUM_NESTED_DEPTH, 'threshold': 2},
                            'minor': {'weight': 2.0, 'threshold': MAXIMUM_FUNCTION_PARAMETERS},
                            'cosmetic': {'weight': 1.0, 'threshold': 50}
                        }
                    }
                }
            }
    
def add_defect(self, category: str, severity: str, stage: str,
                    description: str, resolved: bool = False,
                    resolution_time: Optional[timedelta] = None) -> None:
        """Add a defect record"""
        weight = self.config['quality_gates']['six_sigma']['defect_categories'].get(
            severity, {}
        ).get('weight', 1.0)
        
        defect = DefectRecord(
            category=category,
            severity=severity,
            stage=stage,
            timestamp=datetime.now(),
            description=description,
            weight=weight,
            resolved=resolved,
            resolution_time=resolution_time
        )
        
        self.defect_records.append(defect)
    
def add_process_stage(self, name: str, opportunities: int, defects: int,
                        target_yield: float = 0.95) -> None:
        """Add a process stage for RTY calculation"""
        yield_rate = max(0, 1 - (defects / opportunities)) if opportunities > 0 else 1.0
        
        stage = ProcessStage(
            name=name,
            opportunities=opportunities,
            defects=defects,
            yield_rate=yield_rate,
            target_yield=target_yield
        )
        
        self.process_stages.append(stage)
    
def calculate_dpmo(self) -> float:
        """
        Calculate Defects Per Million Opportunities (DPMO)
        DPMO = (Total Defects * 1, 000, 000) / Total Opportunities
        """
        if not self.defect_records:
            return 0.0
        
        # Calculate weighted defects
        total_weighted_defects = sum(
            defect.weight for defect in self.defect_records 
            if not defect.resolved
        )
        
        # Calculate total opportunities
        total_opportunities = sum(stage.opportunities for stage in self.process_stages)
        
        if total_opportunities == 0:
            return 0.0
        
        dpmo = (total_weighted_defects * 1_000_000) / total_opportunities
        return round(dpmo, 2)
    
def calculate_rty(self) -> float:
        """
        Calculate Rolled Throughput Yield (RTY)
        RTY = Product of all stage yields
        """
        if not self.process_stages:
            return 1.0
        
        rty = 1.0
        for stage in self.process_stages:
            rty *= stage.yield_rate
        
        return round(rty, 4)
    
def calculate_sigma_level(self, dpmo: Optional[float] = None) -> float:
        """
        Calculate Sigma Level from DPMO
        Uses the inverse normal distribution with 1.5 sigma shift
        """
        if dpmo is None:
            dpmo = self.calculate_dpmo()
        
        if dpmo <= 0:
            return 6.0  # Perfect quality
        
        if dpmo >= 1_000_000:
            return 0.0  # No quality
        
        # Convert DPMO to probability
        probability = dpmo / 1_000_000
        
        # Calculate z-score using inverse normal distribution
        try:
            # Using approximation for inverse normal
            if probability >= 0.5:
                z_score = 0.0
            else:
                # Inverse normal approximation
                t = math.sqrt(-2 * math.log(probability))
                z_score = t - (2.30753 + 0.27061 * t) / (1 + 0.99229 * t + 0.04481 * t * t)
            
            sigma_level = z_score + 1.5  # Add 1.5 sigma shift
            return max(0.0, round(sigma_level, 2))
            
        except (ValueError, ZeroDivisionError):
            return 0.0
    
def calculate_process_capability(self) -> float:
        """
        Calculate Process Capability (Cp)
        Cp = (USL - LSL) / (6 * sigma)
        Simplified using sigma level and target performance
        """
        sigma_level = self.calculate_sigma_level()
        target_sigma = self.config['quality_gates']['six_sigma']['target_sigma_level']
        
        if target_sigma == 0:
            return 1.0
        
        capability = sigma_level / target_sigma
        return round(capability, 3)
    
def analyze_defect_categories(self) -> Dict[str, int]:
        """Analyze defects by category"""
        categories = {}
        for defect in self.defect_records:
            if not defect.resolved:
                categories[defect.severity] = categories.get(defect.severity, 0) + 1
        
        return categories
    
def analyze_stage_performance(self) -> Dict[str, float]:
        """Analyze performance by process stage"""
        return {stage.name: stage.yield_rate for stage in self.process_stages}
    
def identify_improvement_opportunities(self) -> List[str]:
        """Identify areas for improvement based on metrics"""
        opportunities = []
        
        # Check sigma level
        sigma_level = self.calculate_sigma_level()
        target_sigma = self.config['quality_gates']['six_sigma']['target_sigma_level']
        
        if sigma_level < target_sigma:
            opportunities.append(f"Sigma level ({sigma_level}) below target ({target_sigma})")
        
        # Check RTY
        rty = self.calculate_rty()
        if rty < 0.95:
            opportunities.append(f"RTY ({rty:.2%}) below 95% target")
        
        # Check individual stages
        for stage in self.process_stages:
            if not stage.meets_target:
                opportunities.append(
                    f"Stage '{stage.name}' yield ({stage.yield_rate:.2%}) "
                    f"below target ({stage.target_yield:.2%})"
                )
        
        # Check defect categories
        defect_analysis = self.analyze_defect_categories()
        config_thresholds = self.config['quality_gates']['six_sigma']['defect_categories']
        
        for severity, count in defect_analysis.items():
            if severity in config_thresholds:
                threshold = config_thresholds[severity]['threshold']
                if count > threshold:
                    opportunities.append(
                        f"Too many {severity} defects: {count} > {threshold} threshold"
                    )
        
        return opportunities
    
def calculate_comprehensive_metrics(self) -> SixSigmaMetrics:
        """Calculate all Six Sigma metrics"""
        dpmo = self.calculate_dpmo()
        rty = self.calculate_rty()
        sigma_level = self.calculate_sigma_level(dpmo)
        process_capability = self.calculate_process_capability()
        defect_categories = self.analyze_defect_categories()
        stage_yields = self.analyze_stage_performance()
        improvement_opportunities = self.identify_improvement_opportunities()
        
        return SixSigmaMetrics(
            dpmo=dpmo,
            rty=rty,
            sigma_level=sigma_level,
            process_capability=process_capability,
            defect_categories=defect_categories,
            stage_yields=stage_yields,
            improvement_opportunities=improvement_opportunities,
            timestamp=datetime.now()
        )
    
def generate_report(self, output_dir: str = ".claude/.artifacts/sixsigma") -> str:
        """Generate comprehensive Six Sigma report"""
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        metrics = self.calculate_comprehensive_metrics()
        
        # Generate JSON report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = Path(output_dir) / f"sixsigma_report_{timestamp}.json"
        
        with open(report_file, 'w') as f:
            json.dump(metrics.to_dict(), f, indent=2)
        
        # Generate CSV summary
        csv_file = Path(output_dir) / f"sixsigma_summary_{timestamp}.csv"
        with open(csv_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Metric', 'Value', 'Target', 'Status'])
            writer.writerow(['DPMO', metrics.dpmo, '<6210', 'PASS' if metrics.dpmo < 6210 else 'FAIL'])
            writer.writerow(['RTY', f"{metrics.rty:.2%}", '>95%', 'PASS' if metrics.rty > 0.95 else 'FAIL'])
            writer.writerow(['Sigma Level', metrics.sigma_level, '4.0', 'PASS' if metrics.sigma_level >= 4.0 else 'FAIL'])
            writer.writerow(['Process Capability', metrics.process_capability, '>1.0', 'PASS' if metrics.process_capability > 1.0 else 'FAIL'])
        
        # Generate HTML report
        html_file = Path(output_dir) / f"sixsigma_report_{timestamp}.html"
        html_content = self._generate_html_report(metrics)
        
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return str(report_file)
    
def _generate_html_report(self, metrics: SixSigmaMetrics) -> str:
        """Generate HTML report"""
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Six Sigma Quality Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        .header {{ background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }}
        .metrics {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }}
        .metric {{ background: #f8f9fa; padding: 20px; border-radius: 5px; border-left: 4px solid #3498db; }}
        .metric h3 {{ margin-top: 0; color: #2c3e50; }}
        .metric .value {{ font-size: 2em; font-weight: bold; color: #e74c3c; }}
        .stage-analysis {{ margin: 20px 0; }}
        .stage {{ background: #ffffff; padding: 15px; margin: 10px 0; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); }}
        .opportunities {{ background: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .pass {{ color: #27ae60; }}
        .fail {{ color: #e74c3c; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Six Sigma Quality Report</h1>
        <p>Generated: {metrics.timestamp.strftime("%Y-%m-%d %H:%M:%S")}</p>
    </div>
    
    <div class="metrics">
        <div class="metric">
            <h3>DPMO (Defects Per Million Opportunities)</h3>
            <div class="value {'pass' if metrics.dpmo < 6210 else 'fail'}">{metrics.dpmo:,.0f}</div>
            <p>Target: &lt; 6, 210 (4-sigma)</p>
        </div>
        
        <div class="metric">
            <h3>RTY (Rolled Throughput Yield)</h3>
            <div class="value {'pass' if metrics.rty > 0.95 else 'fail'}">{metrics.rty:.2%}</div>
            <p>Target: &gt; 95%</p>
        </div>
        
        <div class="metric">
            <h3>Sigma Level</h3>
            <div class="value {'pass' if metrics.sigma_level >= 4.0 else 'fail'}">{metrics.sigma_level}</div>
            <p>Target: >= 4.0</p>
        </div>
        
        <div class="metric">
            <h3>Process Capability (Cp)</h3>
            <div class="value {'pass' if metrics.process_capability > 1.0 else 'fail'}">{metrics.process_capability}</div>
            <p>Target: > 1.0</p>
        </div>
    </div>
    
    <div class="stage-analysis">
        <h2>Process Stage Analysis</h2>
        """
        
        for stage_name, yield_rate in metrics.stage_yields.items():
            html += f"""
        <div class="stage">
            <h3>{stage_name}</h3>
            <p>Yield: <strong class="{'pass' if yield_rate > 0.95 else 'fail'}">{yield_rate:.2%}</strong></p>
        </div>
            """
        
        html += f"""
    </div>
    
    <div class="opportunities">
        <h2>Improvement Opportunities</h2>
        """
        
        if metrics.improvement_opportunities:
            html += "<ul>"
            for opportunity in metrics.improvement_opportunities:
                html += f"<li>{opportunity}</li>"
            html += "</ul>"
        else:
            html += "<p class='pass'>No improvement opportunities identified. Excellent quality!</p>"
        
        html += """
    </div>
    
    <div class="defect-analysis">
        <h2>Defect Analysis</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f8f9fa;">
                <th style="padding: 10px; border: 1px solid #dee2e6;">Category</th>
                <th style="padding: 10px; border: 1px solid #dee2e6;">Count</th>
            </tr>
        """
        
        for category, count in metrics.defect_categories.items():
            html += f"""
            <tr>
                <td style="padding: 10px; border: 1px solid #dee2e6;">{category.title()}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">{count}</td>
            </tr>
            """
        
        html += """
        </table>
    </div>
</body>
</html>
        """
        
        return html

def create_sample_data_scenario() -> SixSigmaScorer:
    """Create sample data scenario for testing"""
    scorer = SixSigmaScorer()
    
    # Add process stages
    scorer.add_process_stage("Specification", opportunities=100, defects=5, target_yield=0.95)
    scorer.add_process_stage("Design", opportunities=150, defects=12, target_yield=0.92)
    scorer.add_process_stage("Implementation", opportunities=500, defects=35, target_yield=0.90)
    scorer.add_process_stage("Testing", opportunities=200, defects=8, target_yield=0.95)
    scorer.add_process_stage("Deployment", opportunities=50, defects=1, target_yield=0.98)
    
    # Add defect records
    scorer.add_defect("functional_failure", "critical", "implementation", "Authentication bypass vulnerability")
    scorer.add_defect("performance_degradation", "major", "implementation", "API response time >2s")
    scorer.add_defect("ui_inconsistency", "minor", "design", "Button colors inconsistent")
    scorer.add_defect("documentation_gap", "minor", "specification", "Missing error handling docs")
    scorer.add_defect("formatting", "cosmetic", "implementation", "Inconsistent code indentation")
    
    return scorer

if __name__ == "__main__":
    # Test the Six Sigma scorer with sample data
    print("Six Sigma Quality Scorer - Theater-Free Validation")
    print("=" * 60)
    
    scorer = create_sample_data_scenario()
    metrics = scorer.calculate_comprehensive_metrics()
    
    print(f"DPMO: {metrics.dpmo:,.0f}")
    print(f"RTY: {metrics.rty:.2%}")
    print(f"Sigma Level: {metrics.sigma_level}")
    print(f"Process Capability: {metrics.process_capability}")
    
    report_file = scorer.generate_report()
    print(f"\nReport generated: {report_file}")