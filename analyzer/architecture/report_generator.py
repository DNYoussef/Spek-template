from src.constants.base import MAXIMUM_NESTED_DEPTH

Specialized report generation using template pattern.
NASA Rule 4 Compliant: All methods under 60 lines.
NASA Rule MAXIMUM_NESTED_DEPTH Compliant: Comprehensive defensive assertions.
"""

import json
import xml.etree.ElementTree as ET
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ReportTemplate(ABC):
    """
    Abstract template for report generation.
    NASA Rule 4: Template interface under 60 lines.
    """

    @abstractmethod
    def generate_header(self, analysis_results: Dict[str, Any]) -> str:
        """Generate report header."""

    @abstractmethod
    def generate_summary(self, analysis_results: Dict[str, Any]) -> str:
        """Generate report summary."""

    @abstractmethod
    def generate_details(self, analysis_results: Dict[str, Any]) -> str:
        """Generate detailed results."""

    @abstractmethod
    def generate_footer(self, analysis_results: Dict[str, Any]) -> str:
        """Generate report footer."""

    def generate_report(self, analysis_results: Dict[str, Any]) -> str:
        """
        Template method to generate complete report.
        NASA Rule 4: Template orchestration under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(analysis_results, dict), "analysis_results must be dict"

        header = self.generate_header(analysis_results)
        summary = self.generate_summary(analysis_results)
        details = self.generate_details(analysis_results)
        footer = self.generate_footer(analysis_results)

        return self._combine_sections(header, summary, details, footer)

    @abstractmethod
    def _combine_sections(self, header: str, summary: str, details: str, footer: str) -> str:
        """Combine report sections."""

class JsonReportTemplate(ReportTemplate):
    """
    JSON report template implementation.
    NASA Rule 4: JSON generation under 60 lines.
    """

    def generate_header(self, analysis_results: Dict[str, Any]) -> str:
        """Generate JSON header."""
        header = {
            "report_type": "comprehensive_analysis",
            "timestamp": datetime.now().isoformat(),
            "generator": "AnalyzerPrincess",
            "version": "2.0.0"
        }
        return json.dumps(header, indent=2)

    def generate_summary(self, analysis_results: Dict[str, Any]) -> str:
        """Generate JSON summary."""
        summary = {
            "overall_success": analysis_results.get("success", False),
            "total_violations": len(analysis_results.get("aggregated_violations", [])),
            "overall_score": analysis_results.get("overall_score", 0.0),
            "execution_time": analysis_results.get("execution_time", 0.0),
            "strategies_executed": analysis_results.get("strategies_executed", [])
        }
        return json.dumps({"summary": summary}, indent=2)

    def generate_details(self, analysis_results: Dict[str, Any]) -> str:
        """Generate JSON details."""
        details = {
            "violations": analysis_results.get("aggregated_violations", []),
            "metrics": analysis_results.get("aggregated_metrics", {}),
            "strategy_results": self._sanitize_strategy_results(
                analysis_results.get("strategy_results", {})
            )
        }
        return json.dumps({"details": details}, indent=2)

    def generate_footer(self, analysis_results: Dict[str, Any]) -> str:
        """Generate JSON footer."""
        footer = {
            "recommendations": analysis_results.get("recommendations", []),
            "nasa_compliance": "See strategy_results.compliance for details",
            "report_complete": True
        }
        return json.dumps({"footer": footer}, indent=2)

    def _combine_sections(self, header: str, summary: str, details: str, footer: str) -> str:
        """Combine JSON sections."""
        # Parse each section and combine into single JSON object
        header_obj = json.loads(header)
        summary_obj = json.loads(summary)
        details_obj = json.loads(details)
        footer_obj = json.loads(footer)

        combined = {**header_obj, **summary_obj, **details_obj, **footer_obj}
        return json.dumps(combined, indent=2)

    def _sanitize_strategy_results(self, strategy_results: Dict) -> Dict:
        """Sanitize strategy results for JSON serialization."""
        sanitized = {}
        for strategy_name, result in strategy_results.items():
            if hasattr(result, '__dict__'):
                sanitized[strategy_name] = result.__dict__
            else:
                sanitized[strategy_name] = result
        return sanitized

class HtmlReportTemplate(ReportTemplate):
    """
    HTML report template implementation.
    NASA Rule 4: HTML generation under 60 lines.
    """

    def generate_header(self, analysis_results: Dict[str, Any]) -> str:
        """Generate HTML header."""
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analysis Report - {datetime.now().strftime('%Y-%m-%d %H:%M')}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        .header {{ background: #f4f4f4; padding: 20px; border-radius: 8px; }}
        .summary {{ background: #e8f5e8; padding: 15px; margin: 20px 0; }}
        .violation {{ background: #ffe6e6; padding: 10px; margin: 5px 0; border-left: 4px solid #ff4444; }}
        .metric {{ display: inline-block; margin: 10px; padding: 10px; background: #f0f8ff; border-radius: 4px; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Comprehensive Analysis Report</h1>
        <p>Generated: {datetime.now().isoformat()}</p>
        <p>Target: {analysis_results.get('target_path', 'Unknown')}</p>
    </div>"""

    def generate_summary(self, analysis_results: Dict[str, Any]) -> str:
        """Generate HTML summary."""
        violations_count = len(analysis_results.get("aggregated_violations", []))
        overall_score = analysis_results.get("overall_score", 0.0)
        status_color = "#4CAF50" if overall_score > 0.8 else "#FF9800" if overall_score > 0.5 else "#F44336"

        return f"""
    <div class="summary">
        <h2>Executive Summary</h2>
        <p><strong>Overall Score:</strong> <span style="color: {status_color}; font-weight: bold;">{overall_score:.2f}</span></p>
        <p><strong>Total Violations:</strong> {violations_count}</p>
        <p><strong>Analysis Status:</strong> {'Success' if analysis_results.get('success') else 'Failed'}</p>
        <p><strong>Execution Time:</strong> {analysis_results.get('execution_time', 0.0):.2f} seconds</p>
    </div>"""

    def generate_details(self, analysis_results: Dict[str, Any]) -> str:
        """Generate HTML details."""
        details_html = "<div class='details'><h2>Detailed Results</h2>"

        # Violations section
        violations = analysis_results.get("aggregated_violations", [])
        details_html += f"<h3>Violations ({len(violations)})</h3>"

        for violation in violations[:10]:  # Show first 10
            severity = violation.get('severity', 'medium')
            details_html += f"""
            <div class="violation">
                <strong>[{severity.upper()}]</strong> {violation.get('type', 'Unknown')}
                <br><em>{violation.get('description', 'No description')}</em>
            </div>"""

        if len(violations) > 10:
            details_html += f"<p><em>... and {len(violations) - 10} more violations</em></p>"

        # Metrics section
        metrics = analysis_results.get("aggregated_metrics", {})
        details_html += "<h3>Metrics</h3><div class='metrics'>"

        for metric_name, value in metrics.items():
            if isinstance(value, (int, float)):
                details_html += f"<div class='metric'><strong>{metric_name}:</strong> {value:.2f}</div>"

        details_html += "</div></div>"
        return details_html

    def generate_footer(self, analysis_results: Dict[str, Any]) -> str:
        """Generate HTML footer."""
        recommendations = analysis_results.get("recommendations", [])
        footer_html = "<div class='footer'><h2>Recommendations</h2><ul>"

        for recommendation in recommendations:
            footer_html += f"<li>{recommendation}</li>"

        footer_html += f"""</ul>
        <hr>
        <p><small>Report generated by AnalyzerPrincess v2.0.0 - {datetime.now().isoformat()}</small></p>
    </div>
</body>
</html>"""
        return footer_html

    def _combine_sections(self, header: str, summary: str, details: str, footer: str) -> str:
        """Combine HTML sections."""
        return header + summary + details + footer

class MarkdownReportTemplate(ReportTemplate):
    """
    Markdown report template implementation.
    NASA Rule 4: Markdown generation under 60 lines.
    """

    def generate_header(self, analysis_results: Dict[str, Any]) -> str:
        """Generate Markdown header."""
        return f"""# Comprehensive Analysis Report

**Generated:** {datetime.now().isoformat()}
**Target:** {analysis_results.get('target_path', 'Unknown')}
**Analyzer:** AnalyzerPrincess v2.0.0

---
"""

    def generate_summary(self, analysis_results: Dict[str, Any]) -> str:
        """Generate Markdown summary."""
        violations_count = len(analysis_results.get("aggregated_violations", []))
        overall_score = analysis_results.get("overall_score", 0.0)

        status_emoji = " " if overall_score > 0.8 else "  " if overall_score > 0.5 else " "

        return f"""## Executive Summary

- **Overall Score:** {status_emoji} {overall_score:.2f}
- **Total Violations:** {violations_count}
- **Analysis Status:** {'  Success' if analysis_results.get('success') else '  Failed'}
- **Execution Time:** {analysis_results.get('execution_time', 0.0):.2f} seconds

"""

    def generate_details(self, analysis_results: Dict[str, Any]) -> str:
        """Generate Markdown details."""
        details_md = "## Detailed Results\n\n"

        # Violations section
        violations = analysis_results.get("aggregated_violations", [])
        details_md += f"### Violations ({len(violations)})\n\n"

        for violation in violations[:5]:  # Show first 5
            severity = violation.get('severity', 'medium')
            emoji = {"critical": " ", "high": " ", "medium": " ", "low": " "}.get(severity, " ")
            details_md += f"- {emoji} **[{severity.upper()}]** {violation.get('type', 'Unknown')}\n"
            details_md += f"  - {violation.get('description', 'No description')}\n\n"

        if len(violations) > 5:
            details_md += f"*... and {len(violations) - 5} more violations*\n\n"

        # Metrics section
        metrics = analysis_results.get("aggregated_metrics", {})
        details_md += "### Key Metrics\n\n"

        for metric_name, value in list(metrics.items())[:10]:  # Show first 10 metrics
            if isinstance(value, (int, float)):
                details_md += f"- **{metric_name}:** {value:.2f}\n"

        return details_md + "\n"

    def generate_footer(self, analysis_results: Dict[str, Any]) -> str:
        """Generate Markdown footer."""
        recommendations = analysis_results.get("recommendations", [])
        footer_md = "## Recommendations\n\n"

        for i, recommendation in enumerate(recommendations, 1):
            footer_md += f"{i}. {recommendation}\n"

        footer_md += f"\n---\n*Report generated by AnalyzerPrincess v2.0.0 - {datetime.now().isoformat()}*\n"
        return footer_md

    def _combine_sections(self, header: str, summary: str, details: str, footer: str) -> str:
        """Combine Markdown sections."""
        return header + summary + details + footer

class ReportGenerator:
    """
    Main report generator using template pattern.
    NASA Rule 4: Template orchestration under 60 lines.

    Methods: 8 (under 18 limit)
    """

    def __init__(self):
        """Initialize report generator."""
        self.templates = {
            "json": JsonReportTemplate(),
            "html": HtmlReportTemplate(),
            "markdown": MarkdownReportTemplate()
        }

    def generate_report(self, analysis_results: Dict[str, Any], format_type: str = "json") -> str:
        """
        Generate report in specified format.
        NASA Rule 4: Main generation under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(analysis_results, dict), "analysis_results must be dict"
        assert isinstance(format_type, str), "format_type must be string"
        assert format_type in self.templates, f"Unsupported format: {format_type}"

        try:
            template = self.templates[format_type]
            report = template.generate_report(analysis_results)

            logger.info(f"Generated {format_type} report ({len(report)} characters)")
            return report

        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            return self._generate_error_report(str(e), format_type)

    def get_supported_formats(self) -> List[str]:
        """Get list of supported report formats."""
        return list(self.templates.keys())

    def register_template(self, format_name: str, template: ReportTemplate):
        """Register custom report template."""
        assert isinstance(format_name, str), "format_name must be string"
        assert isinstance(template, ReportTemplate), "template must be ReportTemplate"

        self.templates[format_name] = template
        logger.info(f"Registered report template: {format_name}")

    def _generate_error_report(self, error_message: str, format_type: str) -> str:
        """Generate error report in requested format."""
        error_data = {
            "success": False,
            "error": error_message,
            "timestamp": datetime.now().isoformat()
        }

        if format_type == "json":
            return json.dumps(error_data, indent=2)
        elif format_type == "html":
            return f"<html><body><h1>Report Generation Error</h1><p>{error_message}</p></body></html>"
        else:  # markdown
            return f"# Report Generation Error\n\n**Error:** {error_message}\n\n**Time:** {datetime.now().isoformat()}"

    def create_report_generator() -> ReportGenerator:
    """Factory function to create report generator."""
    return ReportGenerator()