"""
Comprehensive Validation Reporting System
========================================

Advanced reporting system for NASA POT10 compliance and defense certification:
- Multi-format report generation (JSON, HTML, PDF, XML)
- Real-time compliance dashboards
- Trend analysis and historical tracking
- Integration with CI/CD pipelines
- Executive summary generation
- Automated remediation tracking

Target: Comprehensive compliance visibility and tracking.
"""

import json
import logging
import subprocess
import sys
from collections import defaultdict, Counter
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Set, Tuple
import base64
import hashlib

from .nasa_pot10_analyzer import NASAPowerOfTenAnalyzer, ComplianceMetrics, NASAViolation
from .defense_certification_tool import DefenseCertificationTool, DefenseCertificationReport

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ComplianceTrend:
    """Tracks compliance trends over time."""
    timestamp: datetime
    nasa_score: float
    dfars_score: float
    nist_score: float
    dod_score: float
    overall_score: float
    violations_count: int
    fixed_violations: int

@dataclass
class RiskAssessment:
    """Security and compliance risk assessment."""
    risk_level: str  # critical, high, medium, low
    risk_category: str  # security, compliance, operational
    description: str
    impact: str
    likelihood: str
    mitigation_priority: int
    estimated_effort: str
    business_impact: str

@dataclass
class ValidationMetrics:
    """Comprehensive validation metrics."""
    total_files_analyzed: int = 0
    total_functions_analyzed: int = 0
    total_lines_of_code: int = 0
    analysis_duration: float = 0.0
    nasa_violations_by_severity: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    compliance_trends: List[ComplianceTrend] = field(default_factory=list)
    risk_assessments: List[RiskAssessment] = field(default_factory=list)
    remediation_progress: Dict[str, float] = field(default_factory=dict)
    certification_timeline: Dict[str, datetime] = field(default_factory=dict)

class HTMLReportGenerator:
    """Generates comprehensive HTML compliance reports."""

    def __init__(self):
        self.html_template = self._get_html_template()

    def generate_html_report(self, cert_report: DefenseCertificationReport,
                           metrics: ValidationMetrics, output_path: Path) -> None:
        """Generate comprehensive HTML report."""

        # Prepare data for template
        template_data = {
            'project_name': cert_report.project_name,
            'timestamp': cert_report.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'overall_score': cert_report.overall_certification_score,
            'nasa_score': cert_report.nasa_pot10_score,
            'dfars_score': cert_report.dfars_compliance_score,
            'nist_score': cert_report.nist_compliance_score,
            'dod_score': cert_report.dod_compliance_score,
            'certification_status': cert_report.certification_status,
            'total_violations': len(cert_report.violations),
            'critical_violations': len([v for v in cert_report.violations if v.severity == 'critical']),
            'high_violations': len([v for v in cert_report.violations if v.severity == 'high']),
            'medium_violations': len([v for v in cert_report.violations if v.severity == 'medium']),
            'low_violations': len([v for v in cert_report.violations if v.severity == 'low']),
            'auto_fixable_violations': len([v for v in cert_report.violations if v.auto_fixable]),
            'violations_by_rule': self._group_violations_by_rule(cert_report.violations),
            'security_requirements': cert_report.security_requirements,
            'remediation_plan': cert_report.remediation_plan,
            'compliance_trends': self._format_trends_for_chart(metrics.compliance_trends),
            'risk_assessments': metrics.risk_assessments,
            'total_files': metrics.total_files_analyzed,
            'total_functions': metrics.total_functions_analyzed,
            'total_loc': metrics.total_lines_of_code,
            'analysis_duration': metrics.analysis_duration
        }

        # Generate charts and visualizations
        charts_js = self._generate_charts_javascript(template_data)

        # Fill template
        html_content = self.html_template.format(
            **template_data,
            charts_javascript=charts_js
        )

        # Write HTML file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

        logger.info(f"HTML report generated: {output_path}")

    def _group_violations_by_rule(self, violations: List[NASAViolation]) -> Dict[int, List[Dict]]:
        """Group violations by NASA rule number."""
        grouped = defaultdict(list)

        for violation in violations:
            grouped[violation.rule_number].append({
                'file': violation.file_path,
                'line': violation.line_number,
                'function': violation.function_name,
                'severity': violation.severity,
                'description': violation.description,
                'auto_fixable': violation.auto_fixable
            })

        return dict(grouped)

    def _format_trends_for_chart(self, trends: List[ComplianceTrend]) -> List[Dict]:
        """Format compliance trends for chart visualization."""
        return [
            {
                'timestamp': trend.timestamp.strftime('%Y-%m-%d'),
                'nasa_score': trend.nasa_score,
                'dfars_score': trend.dfars_score,
                'nist_score': trend.nist_score,
                'dod_score': trend.dod_score,
                'overall_score': trend.overall_score
            }
            for trend in trends[-30:]  # Last 30 data points
        ]

    def _generate_charts_javascript(self, data: Dict) -> str:
        """Generate JavaScript for charts and visualizations."""
        return f"""
        // Compliance Scores Chart
        const scoresCtx = document.getElementById('complianceScoresChart').getContext('2d');
        new Chart(scoresCtx, {{
            type: 'doughnut',
            data: {{
                labels: ['NASA POT10', 'DFARS', 'NIST', 'DoD'],
                datasets: [{{
                    data: [{data['nasa_score']}, {data['dfars_score']}, {data['nist_score']}, {data['dod_score']}],
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
                }}]
            }},
            options: {{
                responsive: true,
                plugins: {{
                    legend: {{
                        position: 'bottom'
                    }}
                }}
            }}
        }});

        // Violations by Severity Chart
        const violationsCtx = document.getElementById('violationsSeverityChart').getContext('2d');
        new Chart(violationsCtx, {{
            type: 'bar',
            data: {{
                labels: ['Critical', 'High', 'Medium', 'Low'],
                datasets: [{{
                    label: 'Violations Count',
                    data: [{data['critical_violations']}, {data['high_violations']}, {data['medium_violations']}, {data['low_violations']}],
                    backgroundColor: ['#FF4444', '#FF8800', '#FFAA00', '#88DD88']
                }}]
            }},
            options: {{
                responsive: true,
                scales: {{
                    y: {{
                        beginAtZero: true
                    }}
                }}
            }}
        }});

        // Compliance Trends Chart
        const trendsData = {json.dumps(data['compliance_trends'])};
        if (trendsData.length > 0) {{
            const trendsCtx = document.getElementById('complianceTrendsChart').getContext('2d');
            new Chart(trendsCtx, {{
                type: 'line',
                data: {{
                    labels: trendsData.map(d => d.timestamp),
                    datasets: [{{
                        label: 'Overall Score',
                        data: trendsData.map(d => d.overall_score),
                        borderColor: '#36A2EB',
                        fill: false
                    }}, {{
                        label: 'NASA POT10',
                        data: trendsData.map(d => d.nasa_score),
                        borderColor: '#FF6384',
                        fill: false
                    }}]
                }},
                options: {{
                    responsive: true,
                    scales: {{
                        y: {{
                            beginAtZero: true,
                            max: 100
                        }}
                    }}
                }}
            }});
        }}
        """

    def _get_html_template(self) -> str:
        """Get HTML template for compliance report."""
        return """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defense Certification Compliance Report - {project_name}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .status-badge {{
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            margin-top: 10px;
        }}
        .status-certified {{ background-color: #4CAF50; }}
        .status-conditional {{ background-color: #FF9800; }}
        .status-remediation {{ background-color: #FF5722; }}
        .status-non-compliant {{ background-color: #F44336; }}
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 30px;
        }}
        .metric-card {{
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            border-radius: 4px;
        }}
        .metric-value {{
            font-size: 2em;
            font-weight: bold;
            color: #333;
        }}
        .metric-label {{
            color: #666;
            margin-top: 5px;
        }}
        .chart-container {{
            padding: 30px;
            border-top: 1px solid #eee;
        }}
        .chart-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
        }}
        .chart-box {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            height: 300px;
        }}
        .violations-table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }}
        .violations-table th,
        .violations-table td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        .violations-table th {{
            background-color: #f2f2f2;
            font-weight: bold;
        }}
        .severity-critical {{ color: #F44336; font-weight: bold; }}
        .severity-high {{ color: #FF5722; font-weight: bold; }}
        .severity-medium {{ color: #FF9800; }}
        .severity-low {{ color: #4CAF50; }}
        .remediation-plan {{
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 20px;
            margin: 20px 30px;
        }}
        .remediation-plan h3 {{
            margin-top: 0;
            color: #856404;
        }}
        .remediation-plan ol {{
            margin: 0;
            padding-left: 20px;
        }}
        .section {{
            padding: 30px;
            border-top: 1px solid #eee;
        }}
        .section h2 {{
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Defense Certification Compliance Report</h1>
            <h2>{project_name}</h2>
            <p>Generated: {timestamp}</p>
            <div class="status-badge status-{certification_status}">
                {certification_status.upper().replace('_', ' ')}
            </div>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">{overall_score:.1f}%</div>
                <div class="metric-label">Overall Compliance Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{nasa_score:.1f}%</div>
                <div class="metric-label">NASA POT10 Compliance</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{dfars_score:.1f}%</div>
                <div class="metric-label">DFARS Compliance</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{total_violations}</div>
                <div class="metric-label">Total Violations</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{auto_fixable_violations}</div>
                <div class="metric-label">Auto-Fixable Violations</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{total_files}</div>
                <div class="metric-label">Files Analyzed</div>
            </div>
        </div>

        <div class="chart-container">
            <h2>Compliance Overview</h2>
            <div class="chart-grid">
                <div class="chart-box">
                    <h3>Compliance Scores by Standard</h3>
                    <canvas id="complianceScoresChart"></canvas>
                </div>
                <div class="chart-box">
                    <h3>Violations by Severity</h3>
                    <canvas id="violationsSeverityChart"></canvas>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Compliance Trends</h2>
            <div class="chart-box" style="height: 400px;">
                <canvas id="complianceTrendsChart"></canvas>
            </div>
        </div>

        <div class="remediation-plan">
            <h3>Remediation Plan</h3>
            <ol>
                {remediation_items}
            </ol>
        </div>

        <div class="section">
            <h2>Violation Details</h2>
            <table class="violations-table">
                <thead>
                    <tr>
                        <th>Rule</th>
                        <th>File</th>
                        <th>Line</th>
                        <th>Function</th>
                        <th>Severity</th>
                        <th>Description</th>
                        <th>Auto-Fix</th>
                    </tr>
                </thead>
                <tbody>
                    {violation_rows}
                </tbody>
            </table>
        </div>
    </div>

    <script>
        {charts_javascript}
    </script>
</body>
</html>"""

class PDFReportGenerator:
    """Generates PDF compliance reports using HTML to PDF conversion."""

    def __init__(self):
        self.html_generator = HTMLReportGenerator()

    def generate_pdf_report(self, cert_report: DefenseCertificationReport,
                          metrics: ValidationMetrics, output_path: Path) -> None:
        """Generate PDF report from HTML."""
        # Generate HTML first
        html_path = output_path.with_suffix('.html')
        self.html_generator.generate_html_report(cert_report, metrics, html_path)

        try:
            # Convert HTML to PDF using weasyprint (if available)
            import weasyprint
            html_doc = weasyprint.HTML(filename=str(html_path))
            html_doc.write_pdf(str(output_path))
            logger.info(f"PDF report generated: {output_path}")

            # Clean up temporary HTML file
            html_path.unlink()

        except ImportError:
            logger.warning("weasyprint not available, falling back to HTML report")
            logger.info(f"HTML report available at: {html_path}")

class ComplianceDashboard:
    """Real-time compliance monitoring dashboard."""

    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.data_dir.mkdir(exist_ok=True)
        self.metrics_file = self.data_dir / "compliance_metrics.json"
        self.trends_file = self.data_dir / "compliance_trends.json"

    def update_metrics(self, cert_report: DefenseCertificationReport,
                      metrics: ValidationMetrics) -> None:
        """Update dashboard metrics."""
        # Store current metrics
        current_metrics = {
            'timestamp': cert_report.timestamp.isoformat(),
            'overall_score': cert_report.overall_certification_score,
            'nasa_score': cert_report.nasa_pot10_score,
            'dfars_score': cert_report.dfars_compliance_score,
            'nist_score': cert_report.nist_compliance_score,
            'dod_score': cert_report.dod_compliance_score,
            'total_violations': len(cert_report.violations),
            'certification_status': cert_report.certification_status
        }

        # Update trends
        self._update_trends(current_metrics)

        # Save current metrics
        with open(self.metrics_file, 'w') as f:
            json.dump(current_metrics, f, indent=2)

    def _update_trends(self, current_metrics: Dict) -> None:
        """Update compliance trends data."""
        # Load existing trends
        trends = []
        if self.trends_file.exists():
            with open(self.trends_file, 'r') as f:
                trends = json.load(f)

        # Add current metrics to trends
        trends.append(current_metrics)

        # Keep only last 90 days of data
        cutoff_date = datetime.now() - timedelta(days=90)
        trends = [
            t for t in trends
            if datetime.fromisoformat(t['timestamp']) > cutoff_date
        ]

        # Save updated trends
        with open(self.trends_file, 'w') as f:
            json.dump(trends, f, indent=2)

    def generate_dashboard_data(self) -> Dict:
        """Generate data for dashboard visualization."""
        dashboard_data = {
            'current_metrics': {},
            'trends': [],
            'alerts': [],
            'recommendations': []
        }

        # Load current metrics
        if self.metrics_file.exists():
            with open(self.metrics_file, 'r') as f:
                dashboard_data['current_metrics'] = json.load(f)

        # Load trends
        if self.trends_file.exists():
            with open(self.trends_file, 'r') as f:
                dashboard_data['trends'] = json.load(f)

        # Generate alerts
        dashboard_data['alerts'] = self._generate_alerts(dashboard_data['current_metrics'])

        return dashboard_data

    def _generate_alerts(self, metrics: Dict) -> List[Dict]:
        """Generate compliance alerts."""
        alerts = []

        if metrics.get('overall_score', 0) < 90:
            alerts.append({
                'level': 'warning',
                'message': f"Overall compliance below 90%: {metrics.get('overall_score', 0):.1f}%",
                'action': 'Review and address high-priority violations'
            })

        if metrics.get('nasa_score', 0) < 95:
            alerts.append({
                'level': 'critical',
                'message': f"NASA POT10 compliance below 95%: {metrics.get('nasa_score', 0):.1f}%",
                'action': 'Immediate NASA compliance remediation required'
            })

        if metrics.get('total_violations', 0) > 100:
            alerts.append({
                'level': 'warning',
                'message': f"High violation count: {metrics.get('total_violations', 0)}",
                'action': 'Implement automated fixes and review code quality'
            })

        return alerts

class ValidationReportingSystem:
    """Comprehensive validation reporting system coordinator."""

    def __init__(self, project_name: str, output_dir: Path):
        self.project_name = project_name
        self.output_dir = output_dir
        self.output_dir.mkdir(exist_ok=True)

        # Initialize report generators
        self.html_generator = HTMLReportGenerator()
        self.pdf_generator = PDFReportGenerator()
        self.dashboard = ComplianceDashboard(self.output_dir / "dashboard")

    def generate_comprehensive_report(self, codebase_path: Path) -> Dict[str, Any]:
        """Generate comprehensive validation and compliance report."""
        logger.info("Starting comprehensive validation reporting...")

        start_time = datetime.now()

        # Run defense certification analysis
        cert_tool = DefenseCertificationTool(self.project_name)
        cert_report = cert_tool.run_comprehensive_certification(codebase_path)

        # Collect additional metrics
        metrics = self._collect_validation_metrics(codebase_path, cert_report)
        metrics.analysis_duration = (datetime.now() - start_time).total_seconds()

        # Perform risk assessment
        metrics.risk_assessments = self._perform_risk_assessment(cert_report)

        # Generate reports in multiple formats
        report_files = {}

        # JSON Report
        json_path = self.output_dir / f"{self.project_name}_compliance_report.json"
        cert_tool.export_certification_report(cert_report, json_path)
        report_files['json'] = json_path

        # HTML Report
        html_path = self.output_dir / f"{self.project_name}_compliance_report.html"
        self.html_generator.generate_html_report(cert_report, metrics, html_path)
        report_files['html'] = html_path

        # PDF Report (if possible)
        pdf_path = self.output_dir / f"{self.project_name}_compliance_report.pdf"
        self.pdf_generator.generate_pdf_report(cert_report, metrics, pdf_path)
        if pdf_path.exists():
            report_files['pdf'] = pdf_path

        # Update dashboard
        self.dashboard.update_metrics(cert_report, metrics)

        # Generate executive summary
        exec_summary = self._generate_executive_summary(cert_report, metrics)
        exec_path = self.output_dir / f"{self.project_name}_executive_summary.md"
        with open(exec_path, 'w') as f:
            f.write(exec_summary)
        report_files['executive_summary'] = exec_path

        # Generate CI/CD integration script
        ci_script = self._generate_ci_integration_script(cert_report)
        ci_path = self.output_dir / "compliance_check.sh"
        with open(ci_path, 'w') as f:
            f.write(ci_script)
        report_files['ci_script'] = ci_path

        end_time = datetime.now()
        logger.info(f"Comprehensive reporting completed in {(end_time - start_time).total_seconds():.1f}s")

        return {
            'certification_report': cert_report,
            'validation_metrics': metrics,
            'report_files': report_files,
            'dashboard_data': self.dashboard.generate_dashboard_data()
        }

    def _collect_validation_metrics(self, codebase_path: Path,
                                  cert_report: DefenseCertificationReport) -> ValidationMetrics:
        """Collect comprehensive validation metrics."""
        metrics = ValidationMetrics()

        # Count files and LOC
        python_files = list(codebase_path.rglob("*.py"))
        metrics.total_files_analyzed = len(python_files)

        total_loc = 0
        total_functions = 0

        for py_file in python_files:
            try:
                with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    total_loc += len(content.split('\n'))

                # Count functions (simplified)
                import ast
                try:
                    tree = ast.parse(content)
                    for node in ast.walk(tree):
                        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                            total_functions += 1
                except:
                    pass
            except:
                continue

        metrics.total_lines_of_code = total_loc
        metrics.total_functions_analyzed = total_functions

        # Count violations by severity
        for violation in cert_report.violations:
            metrics.nasa_violations_by_severity[violation.severity] += 1

        return metrics

    def _perform_risk_assessment(self, cert_report: DefenseCertificationReport) -> List[RiskAssessment]:
        """Perform comprehensive risk assessment."""
        risks = []

        # Critical compliance risks
        if cert_report.overall_certification_score < 85:
            risks.append(RiskAssessment(
                risk_level="critical",
                risk_category="compliance",
                description="Overall compliance below acceptable threshold",
                impact="Certification failure, project delays, regulatory penalties",
                likelihood="high",
                mitigation_priority=1,
                estimated_effort="2-4 weeks",
                business_impact="High - affects project delivery and compliance status"
            ))

        # NASA POT10 specific risks
        if cert_report.nasa_pot10_score < 95:
            risks.append(RiskAssessment(
                risk_level="high",
                risk_category="security",
                description="NASA POT10 compliance below defense industry standards",
                impact="Safety-critical software vulnerabilities",
                likelihood="medium",
                mitigation_priority=2,
                estimated_effort="1-3 weeks",
                business_impact="Medium - affects safety certification"
            ))

        # Security requirement risks
        critical_violations = [v for v in cert_report.violations if v.severity == "critical"]
        if len(critical_violations) > 0:
            risks.append(RiskAssessment(
                risk_level="critical",
                risk_category="security",
                description=f"{len(critical_violations)} critical security violations detected",
                impact="Potential security breaches, data exposure",
                likelihood="high",
                mitigation_priority=1,
                estimated_effort="1-2 weeks",
                business_impact="High - immediate security risk"
            ))

        return risks

    def _generate_executive_summary(self, cert_report: DefenseCertificationReport,
                                   metrics: ValidationMetrics) -> str:
        """Generate executive summary in markdown format."""
        return f"""# Executive Summary: {self.project_name} Compliance Report

## Overview
This report presents the comprehensive compliance assessment for **{self.project_name}** against defense industry standards including NASA POT10, DFARS, NIST, and DoD requirements.

## Key Findings

### Overall Compliance Score: {cert_report.overall_certification_score:.1f}%
**Status:** {cert_report.certification_status.upper().replace('_', ' ')}

### Component Scores
- **NASA POT10:** {cert_report.nasa_pot10_score:.1f}% (Target: 95%)
- **DFARS:** {cert_report.dfars_compliance_score:.1f}% (Target: 90%)
- **NIST:** {cert_report.nist_compliance_score:.1f}% (Target: 85%)
- **DoD:** {cert_report.dod_compliance_score:.1f}% (Target: 90%)

### Analysis Scope
- **Files Analyzed:** {metrics.total_files_analyzed:,}
- **Functions Analyzed:** {metrics.total_functions_analyzed:,}
- **Lines of Code:** {metrics.total_lines_of_code:,}
- **Analysis Duration:** {metrics.analysis_duration:.1f} seconds

### Violation Summary
- **Total Violations:** {len(cert_report.violations)}
- **Critical:** {metrics.nasa_violations_by_severity.get('critical', 0)}
- **High:** {metrics.nasa_violations_by_severity.get('high', 0)}
- **Medium:** {metrics.nasa_violations_by_severity.get('medium', 0)}
- **Low:** {metrics.nasa_violations_by_severity.get('low', 0)}
- **Auto-Fixable:** {len([v for v in cert_report.violations if v.auto_fixable])}

## Risk Assessment

{self._format_risk_assessments(metrics.risk_assessments)}

## Recommendations

### Immediate Actions (0-2 weeks)
{self._format_immediate_actions(cert_report)}

### Short-term Actions (2-6 weeks)
{self._format_short_term_actions(cert_report)}

### Long-term Actions (6+ weeks)
{self._format_long_term_actions(cert_report)}

## Certification Timeline

Based on current compliance levels, estimated certification timeline:

{'- **Immediate Certification:** Possible with minor remediation' if cert_report.overall_certification_score >= 95 else ''}
{'- **Conditional Certification:** 2-4 weeks with focused remediation' if 85 <= cert_report.overall_certification_score < 95 else ''}
{'- **Full Remediation Required:** 4-8 weeks for comprehensive fixes' if cert_report.overall_certification_score < 85 else ''}

## Next Steps

1. Review detailed compliance report for specific violations
2. Implement automated fixes for auto-fixable violations
3. Prioritize manual remediation based on risk assessment
4. Establish continuous compliance monitoring
5. Schedule follow-up assessment after remediation

---
*Report generated on {cert_report.timestamp.strftime('%Y-%m-%d at %H:%M:%S')}*
*Compliance validation system version 1.0*
"""

    def _format_risk_assessments(self, risks: List[RiskAssessment]) -> str:
        """Format risk assessments for markdown."""
        if not risks:
            return "No significant risks identified."

        risk_text = ""
        for risk in sorted(risks, key=lambda r: r.mitigation_priority):
            risk_text += f"""
### {risk.risk_level.upper()}: {risk.description}
- **Category:** {risk.risk_category}
- **Impact:** {risk.impact}
- **Likelihood:** {risk.likelihood}
- **Business Impact:** {risk.business_impact}
- **Estimated Effort:** {risk.estimated_effort}
"""
        return risk_text

    def _format_immediate_actions(self, cert_report: DefenseCertificationReport) -> str:
        """Format immediate action items."""
        actions = []

        critical_violations = [v for v in cert_report.violations if v.severity == "critical"]
        if critical_violations:
            actions.append(f"Fix {len(critical_violations)} critical violations immediately")

        auto_fixable = [v for v in cert_report.violations if v.auto_fixable]
        if auto_fixable:
            actions.append(f"Apply automated fixes for {len(auto_fixable)} violations")

        if cert_report.nasa_pot10_score < 95:
            actions.append("Focus on NASA POT10 compliance gaps")

        return '\n'.join(f"- {action}" for action in actions) if actions else "- No immediate actions required"

    def _format_short_term_actions(self, cert_report: DefenseCertificationReport) -> str:
        """Format short-term action items."""
        actions = []

        if cert_report.dfars_compliance_score < 90:
            actions.append("Address DFARS compliance requirements")

        high_violations = [v for v in cert_report.violations if v.severity == "high"]
        if high_violations:
            actions.append(f"Remediate {len(high_violations)} high-severity violations")

        actions.append("Implement continuous compliance monitoring")
        actions.append("Establish automated compliance checking in CI/CD")

        return '\n'.join(f"- {action}" for action in actions)

    def _format_long_term_actions(self, cert_report: DefenseCertificationReport) -> str:
        """Format long-term action items."""
        actions = [
            "Establish compliance governance framework",
            "Implement security-by-design practices",
            "Conduct regular compliance assessments",
            "Build compliance training program",
            "Develop automated remediation capabilities"
        ]

        return '\n'.join(f"- {action}" for action in actions)

    def _generate_ci_integration_script(self, cert_report: DefenseCertificationReport) -> str:
        """Generate CI/CD integration script."""
        return f"""#!/bin/bash
# Automated Compliance Check Script
# Generated for {self.project_name}

set -e

echo "Running NASA POT10 and Defense Compliance Checks..."

# Set compliance thresholds
NASA_THRESHOLD=95
DFARS_THRESHOLD=90
OVERALL_THRESHOLD=90

# Run compliance analysis
python -m analyzer.enterprise.nasa_pot10_analyzer --path . --report nasa_compliance.json

# Run defense certification
python -m analyzer.enterprise.defense_certification_tool \\
    --project "{self.project_name}" \\
    --path . \\
    --output defense_certification.json

# Check results
python << 'EOF'
import json
import sys

# Load results
with open('defense_certification.json', 'r') as f:
    results = json.load(f)

nasa_score = results['scores']['nasa_pot10']
dfars_score = results['scores']['dfars_compliance']
overall_score = results['scores']['overall_certification']

print(f"NASA POT10: {{nasa_score:.1f}}% (threshold: {NASA_THRESHOLD}%)")
print(f"DFARS: {{dfars_score:.1f}}% (threshold: {DFARS_THRESHOLD}%)")
print(f"Overall: {{overall_score:.1f}}% (threshold: {OVERALL_THRESHOLD}%)")

# Check thresholds
if nasa_score < {NASA_THRESHOLD}:
    print(" NASA POT10 compliance below threshold!")
    sys.exit(1)

if dfars_score < {DFARS_THRESHOLD}:
    print(" DFARS compliance below threshold!")
    sys.exit(1)

if overall_score < {OVERALL_THRESHOLD}:
    print(" Overall compliance below threshold!")
    sys.exit(1)

print(" All compliance checks passed!")
EOF

echo "Compliance checks completed successfully!"
"""

def main():
    """Main execution function."""
    import argparse

    parser = argparse.ArgumentParser(description='Comprehensive Validation Reporting System')
    parser.add_argument('--project', required=True, help='Project name')
    parser.add_argument('--path', default='.', help='Codebase path to analyze')
    parser.add_argument('--output', default='reports', help='Output directory')

    args = parser.parse_args()

    # Initialize reporting system
    output_dir = Path(args.output)
    reporting_system = ValidationReportingSystem(args.project, output_dir)

    # Generate comprehensive report
    codebase_path = Path(args.path)
    results = reporting_system.generate_comprehensive_report(codebase_path)

    # Print summary
    cert_report = results['certification_report']
    metrics = results['validation_metrics']

    print(f"\n{'='*60}")
    print(f"COMPREHENSIVE VALIDATION REPORT - {args.project}")
    print(f"{'='*60}")
    print(f"Overall Compliance: {cert_report.overall_certification_score:.1f}%")
    print(f"Certification Status: {cert_report.certification_status.upper()}")
    print(f"Total Violations: {len(cert_report.violations)}")
    print(f"Analysis Duration: {metrics.analysis_duration:.1f}s")
    print(f"\nReports generated in: {output_dir}")

    for report_type, file_path in results['report_files'].items():
        print(f"  {report_type.upper()}: {file_path}")

    # Return appropriate exit code
    if cert_report.overall_certification_score >= 95:
        return 0
    elif cert_report.overall_certification_score >= 85:
        return 1
    else:
        return 2

if __name__ == '__main__':
    sys.exit(main())