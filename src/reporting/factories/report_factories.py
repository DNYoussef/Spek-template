from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS

Factory pattern implementation for report generation, providing flexible
and extensible report creation with multiple formats and templates.

Refactored from coordinator.py and refactoring_audit_report.py
Target: 40-60% LOC reduction while maintaining functionality.
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from enum import Enum
import json
import logging

from ...patterns.factory_base import Factory, AbstractFactory, get_factory_registry

logger = logging.getLogger(__name__)

class ReportFormat(Enum):
    """Supported report output formats."""
    JSON = "json"
    HTML = "html"
    MARKDOWN = "markdown"
    XML = "xml"
    CSV = "csv"
    PDF = "pdf"
    TEXT = "text"
    SARIF = "sarif"

class ReportType(Enum):
    """Types of reports that can be generated."""
    ANALYSIS_SUMMARY = "analysis_summary"
    COMPLIANCE_AUDIT = "compliance_audit"
    PERFORMANCE_METRICS = "performance_metrics"
    SECURITY_SCAN = "security_scan"
    REFACTORING_AUDIT = "refactoring_audit"
    DASHBOARD_DATA = "dashboard_data"
    EXECUTIVE_SUMMARY = "executive_summary"

class ReportTemplate:
    """Base class for report templates."""

    def __init__(self, template_name: str, format_type: ReportFormat):
        self.template_name = template_name
        self.format_type = format_type
        self.created_at = datetime.now()

    def get_template_info(self) -> Dict[str, Any]:
        """Get template information."""
        return {
            'name': self.template_name,
            'format': self.format_type.value,
            'created_at': self.created_at.isoformat()
        }

class Report:
    """Base report class containing common report data and metadata."""

    def __init__(self, report_id: str, report_type: ReportType, data: Dict[str, Any],
                metadata: Optional[Dict[str, Any]] = None):
        self.report_id = report_id
        self.report_type = report_type
        self.data = data
        self.metadata = metadata or {}
        self.generated_at = datetime.now()
        self.format_type: Optional[ReportFormat] = None
        self.template_name: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert report to dictionary."""
        return {
            'report_id': self.report_id,
            'report_type': self.report_type.value,
            'data': self.data,
            'metadata': self.metadata,
            'generated_at': self.generated_at.isoformat(),
            'format_type': self.format_type.value if self.format_type else None,
            'template_name': self.template_name
        }

    def get_summary(self) -> Dict[str, Any]:
        """Get report summary."""
        return {
            'report_id': self.report_id,
            'type': self.report_type.value,
            'generated_at': self.generated_at.isoformat(),
            'data_keys': list(self.data.keys()) if isinstance(self.data, dict) else [],
            'metadata_keys': list(self.metadata.keys())
        }

class ReportBuilder(ABC):
    """Abstract base class for report builders."""

    def __init__(self, builder_name: str):
        self.builder_name = builder_name

    @abstractmethod
    def build_report(self, report_type: ReportType, data: Dict[str, Any],
                    template: Optional[ReportTemplate] = None,
                    options: Optional[Dict[str, Any]] = None) -> Report:
        """Build report from data using specified template."""

    @abstractmethod
    def get_supported_types(self) -> List[ReportType]:
        """Get supported report types."""

    def validate_data(self, report_type: ReportType, data: Dict[str, Any]) -> bool:
        """Validate input data for report generation."""
        if not isinstance(data, dict):
            return False
        if not data:
            return False
        return True

class JSONReportBuilder(ReportBuilder):
    """Builder for JSON format reports."""

    def __init__(self):
        super().__init__("json_report_builder")

    def build_report(self, report_type: ReportType, data: Dict[str, Any],
                    template: Optional[ReportTemplate] = None,
                    options: Optional[Dict[str, Any]] = None) -> Report:
        """Build JSON report."""
        report_id = f"{report_type.value}_{int(datetime.now().timestamp())}"

        # Process data based on report type
        processed_data = self._process_data(report_type, data, options or {})

        report = Report(report_id, report_type, processed_data)
        report.format_type = ReportFormat.JSON
        report.template_name = template.template_name if template else "default_json"

        return report

    def get_supported_types(self) -> List[ReportType]:
        """Get supported report types."""
        return [
            ReportType.ANALYSIS_SUMMARY,
            ReportType.COMPLIANCE_AUDIT,
            ReportType.PERFORMANCE_METRICS,
            ReportType.SECURITY_SCAN,
            ReportType.REFACTORING_AUDIT
        ]

    def _process_data(self, report_type: ReportType, data: Dict[str, Any],
                    options: Dict[str, Any]) -> Dict[str, Any]:
        """Process data specific to JSON format."""
        processed = {
            'report_metadata': {
                'type': report_type.value,
                'generated_at': datetime.now().isoformat(),
                'format': 'json',
                'options': options
            },
            'content': data
        }

        # Add type-specific processing
        if report_type == ReportType.ANALYSIS_SUMMARY:
            processed['summary_stats'] = self._calculate_summary_stats(data)
        elif report_type == ReportType.COMPLIANCE_AUDIT:
            processed['compliance_score'] = self._calculate_compliance_score(data)

        return processed

    def _calculate_summary_stats(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate summary statistics for analysis reports."""
        stats = {
            'total_items': 0,
            'categories': {},
            'severity_distribution': {}
        }

        # Extract stats from various data structures
        if 'violations' in data:
            violations = data['violations']
            if isinstance(violations, list):
                stats['total_items'] = len(violations)
                for violation in violations:
                    if isinstance(violation, dict):
                        severity = violation.get('severity', 'unknown')
                        stats['severity_distribution'][severity] = \
                            stats['severity_distribution'].get(severity, 0) + 1

        return stats

    def _calculate_compliance_score(self, data: Dict[str, Any]) -> float:
        """Calculate compliance score for audit reports."""
        if 'overall_compliance_score' in data:
            return float(data['overall_compliance_score'])

        # Calculate based on individual scores
        scores = []
        if 'standards_results' in data:
            standards = data['standards_results']
            if isinstance(standards, dict):
                for standard_result in standards.values():
                    if isinstance(standard_result, dict) and 'score' in standard_result:
                        scores.append(float(standard_result['score']))

        return sum(scores) / len(scores) if scores else 0.0

class HTMLReportBuilder(ReportBuilder):
    """Builder for HTML format reports."""

    def __init__(self):
        super().__init__("html_report_builder")

    def build_report(self, report_type: ReportType, data: Dict[str, Any],
                    template: Optional[ReportTemplate] = None,
                    options: Optional[Dict[str, Any]] = None) -> Report:
        """Build HTML report."""
        report_id = f"{report_type.value}_{int(datetime.now().timestamp())}"

        html_content = self._generate_html_content(report_type, data, options or {})

        processed_data = {
            'html_content': html_content,
            'title': self._get_report_title(report_type),
            'generated_at': datetime.now().isoformat()
        }

        report = Report(report_id, report_type, processed_data)
        report.format_type = ReportFormat.HTML
        report.template_name = template.template_name if template else "default_html"

        return report

    def get_supported_types(self) -> List[ReportType]:
        """Get supported report types."""
        return [
            ReportType.ANALYSIS_SUMMARY,
            ReportType.DASHBOARD_DATA,
            ReportType.EXECUTIVE_SUMMARY,
            ReportType.REFACTORING_AUDIT
        ]

    def _generate_html_content(self, report_type: ReportType, data: Dict[str, Any],
                                options: Dict[str, Any]) -> str:
        """Generate HTML content for report."""
        title = self._get_report_title(report_type)

        html_template = f"""
<!DOCTYPE html>
<html>
<head>
    <title>{title}</title>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }}
        .header {{ background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px; }}
        .metrics {{ display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }}
        .metric {{ flex: 1; min-width: 200px; padding: 15px; background: #e7f3ff; border-radius: 5px; text-align: center; }}
        .section {{ margin: 30px 0; }}
        .data-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        .data-table th, .data-table td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
        .data-table th {{ background-color: #f2f2f2; }}
        .status-ok {{ color: green; font-weight: bold; }}
        .status-warning {{ color: orange; font-weight: bold; }}
        .status-error {{ color: red; font-weight: bold; }}
        .footer {{ margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>{title}</h1>
        <p><strong>Generated:</strong> {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
        <p><strong>Report Type:</strong> {report_type.value.replace('_', ' ').title()}</p>
    </div>
"""

        # Add type-specific content
        if report_type == ReportType.ANALYSIS_SUMMARY:
            html_template += self._generate_analysis_summary_content(data)
        elif report_type == ReportType.DASHBOARD_DATA:
            html_template += self._generate_dashboard_content(data)
        elif report_type == ReportType.REFACTORING_AUDIT:
            html_template += self._generate_audit_content(data)
        else:
            html_template += self._generate_generic_content(data)

        html_template += """
    <div class="footer">
        <p>Generated by SPEK Enhanced Development Platform</p>
    </div>
</body>
</html>
"""
        return html_template

    def _generate_analysis_summary_content(self, data: Dict[str, Any]) -> str:
        """Generate content for analysis summary reports."""
        content = '<div class="section"><h2>Analysis Summary</h2>'

        # Metrics section
        if 'quality_metrics' in data:
            metrics = data['quality_metrics']
            content += '<div class="metrics">'
            for key, value in metrics.items():
                content += f'<div class="metric"><h3>{key.replace("_", " ").title()}</h3><div style="font-size: 24px; font-weight: bold;">{value}</div></div>'
            content += '</div>'

        # Violations table
        if 'violations' in data and isinstance(data['violations'], list):
            content += '<h3>Issues Found</h3>'
            content += '<table class="data-table"><tr><th>Type</th><th>Severity</th><th>Description</th><th>File</th></tr>'
            for violation in data['violations'][:10]:  # Limit to 10 items
                if isinstance(violation, dict):
                    severity_class = f"status-{violation.get('severity', 'ok').lower()}"
                    content += f"""<tr>
                        <td>{violation.get('type', 'Unknown')}</td>
                        <td class="{severity_class}">{violation.get('severity', 'Unknown')}</td>
                        <td>{violation.get('description', '')}</td>
                        <td>{violation.get('file_path', '')}</td>
                    </tr>"""
            content += '</table>'

        content += '</div>'
        return content

    def _generate_dashboard_content(self, data: Dict[str, Any]) -> str:
        """Generate content for dashboard reports."""
        content = '<div class="section"><h2>Dashboard Overview</h2>'

        if 'project_info' in data:
            project = data['project_info']
            content += f'<p><strong>Project:</strong> {project.get("name", "Unknown")}</p>'
            content += f'<p><strong>Files Analyzed:</strong> {project.get("analyzed_files", 0)}</p>'

        if 'quality_metrics' in data:
            content += self._generate_analysis_summary_content(data)

        content += '</div>'
        return content

    def _generate_audit_content(self, data: Dict[str, Any]) -> str:
        """Generate content for audit reports."""
        content = '<div class="section"><h2>Refactoring Audit Results</h2>'

        if 'audit_summary' in data:
            summary = data['audit_summary']
            content += f'<p><strong>Overall Score:</strong> {summary.get("overall_score", 0):.2f}/10</p>'
            content += f'<p><strong>Production Ready:</strong> {"Yes" if summary.get("production_ready", False) else "No"}</p>'

        if 'stage_results' in data:
            content += '<h3>Stage Results</h3>'
            content += '<table class="data-table"><tr><th>Stage</th><th>Score</th><th>Status</th></tr>'
            for stage_name, stage_data in data['stage_results'].items():
                if isinstance(stage_data, dict):
                    score = stage_data.get('score', 0)
                    status = "PASS" if score >= 8.0 else "REVIEW"
                    status_class = "status-ok" if score >= 8.0 else "status-warning"
                    content += f"""<tr>
                        <td>{stage_data.get('name', stage_name)}</td>
                        <td>{score:.1f}/MAXIMUM_FUNCTION_PARAMETERS</td>
                        <td class="{status_class}">{status}</td>
                    </tr>"""
            content += '</table>'

        content += '</div>'
        return content

    def _generate_generic_content(self, data: Dict[str, Any]) -> str:
        """Generate generic content for unknown report types."""
        content = '<div class="section"><h2>Report Data</h2>'
        content += '<pre style="background: #f8f9fa; padding: 20px; border-radius: 5px; overflow-x: auto;">'
        content += json.dumps(data, indent=2, default=str)
        content += '</pre></div>'
        return content

    def _get_report_title(self, report_type: ReportType) -> str:
        """Get appropriate title for report type."""
        titles = {
            ReportType.ANALYSIS_SUMMARY: "Code Analysis Summary Report",
            ReportType.COMPLIANCE_AUDIT: "Compliance Audit Report",
            ReportType.PERFORMANCE_METRICS: "Performance Metrics Report",
            ReportType.SECURITY_SCAN: "Security Scan Report",
            ReportType.REFACTORING_AUDIT: "Refactoring Audit Report",
            ReportType.DASHBOARD_DATA: "Dashboard Overview",
            ReportType.EXECUTIVE_SUMMARY: "Executive Summary Report"
        }
        return titles.get(report_type, "System Report")

class MarkdownReportBuilder(ReportBuilder):
    """Builder for Markdown format reports."""

    def __init__(self):
        super().__init__("markdown_report_builder")

    def build_report(self, report_type: ReportType, data: Dict[str, Any],
                    template: Optional[ReportTemplate] = None,
                    options: Optional[Dict[str, Any]] = None) -> Report:
        """Build Markdown report."""
        report_id = f"{report_type.value}_{int(datetime.now().timestamp())}"

        markdown_content = self._generate_markdown_content(report_type, data, options or {})

        processed_data = {
            'markdown_content': markdown_content,
            'title': self._get_report_title(report_type),
            'generated_at': datetime.now().isoformat()
        }

        report = Report(report_id, report_type, processed_data)
        report.format_type = ReportFormat.MARKDOWN
        report.template_name = template.template_name if template else "default_markdown"

        return report

    def get_supported_types(self) -> List[ReportType]:
        """Get supported report types."""
        return [
            ReportType.ANALYSIS_SUMMARY,
            ReportType.COMPLIANCE_AUDIT,
            ReportType.EXECUTIVE_SUMMARY,
            ReportType.REFACTORING_AUDIT
        ]

    def _generate_markdown_content(self, report_type: ReportType, data: Dict[str, Any],
                                    options: Dict[str, Any]) -> str:
        """Generate Markdown content."""
        title = self._get_report_title(report_type)
        content = f"# {title}\n\n"
        content += f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        content += f"**Report Type:** {report_type.value.replace('_', ' ').title()}\n\n"

        if report_type == ReportType.ANALYSIS_SUMMARY:
            content += self._generate_analysis_markdown(data)
        elif report_type == ReportType.COMPLIANCE_AUDIT:
            content += self._generate_compliance_markdown(data)
        elif report_type == ReportType.EXECUTIVE_SUMMARY:
            content += self._generate_executive_markdown(data)
        else:
            content += self._generate_generic_markdown(data)

        return content

    def _generate_analysis_markdown(self, data: Dict[str, Any]) -> str:
        """Generate Markdown for analysis reports."""
        content = "## Analysis Summary\n\n"

        if 'quality_metrics' in data:
            content += "### Quality Metrics\n\n"
            metrics = data['quality_metrics']
            for key, value in metrics.items():
                content += f"- **{key.replace('_', ' ').title()}**: {value}\n"
            content += "\n"

        if 'violations' in data and isinstance(data['violations'], list):
            content += f"### Issues Found ({len(data['violations'])} total)\n\n"
            content += "| Type | Severity | Description | File |\n"
            content += "|------|----------|-------------|------|\n"
            for violation in data['violations'][:10]:  # Limit to 10
                if isinstance(violation, dict):
                    content += f"| {violation.get('type', 'Unknown')} | {violation.get('severity', 'Unknown')} | {violation.get('description', '')} | {violation.get('file_path', '')} |\n"
            content += "\n"

        return content

    def _generate_compliance_markdown(self, data: Dict[str, Any]) -> str:
        """Generate Markdown for compliance reports."""
        content = "## Compliance Audit Results\n\n"

        if 'overall_compliance_score' in data:
            score = data['overall_compliance_score']
            content += f"**Overall Compliance Score:** {score:.2f}/1.0\n\n"

        if 'standards_results' in data:
            content += "### Standards Results\n\n"
            for standard, result in data['standards_results'].items():
                if isinstance(result, dict):
                    score = result.get('score', 0)
                    status = "[OK] PASS" if result.get('passed', False) else "[FAIL] FAIL"
                    content += f"- **{standard}**: {score:.2f} {status}\n"
            content += "\n"

        return content

    def _generate_executive_markdown(self, data: Dict[str, Any]) -> str:
        """Generate Markdown for executive summary."""
        content = "## Executive Summary\n\n"

        if 'summary' in data:
            content += f"{data['summary']}\n\n"

        if 'key_metrics' in data:
            content += "### Key Metrics\n\n"
            for metric, value in data['key_metrics'].items():
                content += f"- **{metric}**: {value}\n"
            content += "\n"

        if 'recommendations' in data and isinstance(data['recommendations'], list):
            content += "### Recommendations\n\n"
            for i, rec in enumerate(data['recommendations'], 1):
                content += f"{i}. {rec}\n"
            content += "\n"

        return content

    def _generate_generic_markdown(self, data: Dict[str, Any]) -> str:
        """Generate generic Markdown content."""
        content = "## Report Data\n\n"
        content += "```json\n"
        content += json.dumps(data, indent=2, default=str)
        content += "\n```\n\n"
        return content

    def _get_report_title(self, report_type: ReportType) -> str:
        """Get appropriate title for report type."""
        return report_type.value.replace('_', ' ').title() + " Report"

# Report Factory Implementation
class ReportBuilderFactory(Factory):
    """Factory for creating report builders."""

    def __init__(self):
        super().__init__("report_builder_factory")
        self._register_builders()

    def _register_builders(self):
        """Register available report builders."""
        self.register_product("json", JSONReportBuilder)
        self.register_product("html", HTMLReportBuilder)
        self.register_product("markdown", MarkdownReportBuilder)

    def _get_base_product_type(self):
        return ReportBuilder

class ReportFactory:
    """High-level factory for creating reports with different builders and templates."""

    def __init__(self):
        self.builder_factory = ReportBuilderFactory()
        self.templates: Dict[str, ReportTemplate] = {}
        self._initialize_default_templates()

    def _initialize_default_templates(self):
        """Initialize default report templates."""
        self.templates['default_json'] = ReportTemplate('default_json', ReportFormat.JSON)
        self.templates['default_html'] = ReportTemplate('default_html', ReportFormat.HTML)
        self.templates['default_markdown'] = ReportTemplate('default_markdown', ReportFormat.MARKDOWN)

    def create_report(self, report_type: ReportType, data: Dict[str, Any],
                    format_type: ReportFormat, template_name: Optional[str] = None,
                    options: Optional[Dict[str, Any]] = None) -> Report:
        """Create report using appropriate builder and template."""
        # Get appropriate builder for format
        builder = self._get_builder_for_format(format_type)

        # Get template
        template = self._get_template(template_name, format_type)

        # Validate that builder supports the report type
        if report_type not in builder.get_supported_types():
            logger.warning(
                f"Builder {builder.builder_name} doesn't officially support {report_type.value}, "
                "but attempting to create report anyway"
            )

        return builder.build_report(report_type, data, template, options)

    def _get_builder_for_format(self, format_type: ReportFormat) -> ReportBuilder:
        """Get appropriate builder for format type."""
        format_to_builder = {
            ReportFormat.JSON: "json",
            ReportFormat.HTML: "html",
            ReportFormat.MARKDOWN: "markdown"
        }

        builder_type = format_to_builder.get(format_type, "json")
        return self.builder_factory.create_product(builder_type)

    def _get_template(self, template_name: Optional[str], format_type: ReportFormat) -> ReportTemplate:
        """Get template by name or create default for format."""
        if template_name and template_name in self.templates:
            return self.templates[template_name]

        # Create default template for format
        default_name = f"default_{format_type.value}"
        if default_name not in self.templates:
            self.templates[default_name] = ReportTemplate(default_name, format_type)

        return self.templates[default_name]

    def register_template(self, template: ReportTemplate):
        """Register custom template."""
        self.templates[template.template_name] = template

    def get_available_formats(self) -> List[ReportFormat]:
        """Get available report formats."""
        return [ReportFormat.JSON, ReportFormat.HTML, ReportFormat.MARKDOWN]

    def get_available_templates(self) -> List[str]:
        """Get available template names."""
        return list(self.templates.keys())

# Global report factory instance
_global_report_factory: Optional[ReportFactory] = None

def get_report_factory() -> ReportFactory:
    """Get global report factory instance."""
    global _global_report_factory
    if _global_report_factory is None:
        _global_report_factory = ReportFactory()
    return _global_report_factory

# Convenience functions
def create_report(report_type: ReportType, data: Dict[str, Any],
                format_type: ReportFormat = ReportFormat.JSON,
                template_name: Optional[str] = None,
                options: Optional[Dict[str, Any]] = None) -> Report:
    """Create report using global factory."""
    factory = get_report_factory()
    return factory.create_report(report_type, data, format_type, template_name, options)

def create_analysis_report(analysis_data: Dict[str, Any],
                            format_type: ReportFormat = ReportFormat.HTML) -> Report:
    """Create analysis summary report."""
    return create_report(ReportType.ANALYSIS_SUMMARY, analysis_data, format_type)

def create_compliance_report(compliance_data: Dict[str, Any],
                            format_type: ReportFormat = ReportFormat.MARKDOWN) -> Report:
    """Create compliance audit report."""
    return create_report(ReportType.COMPLIANCE_AUDIT, compliance_data, format_type)

def save_report_to_file(report: Report, output_path: Union[str, Path]) -> bool:
    """Save report to file."""
    try:
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        if report.format_type == ReportFormat.JSON:
            content = json.dumps(report.data, indent=2, default=str)
        elif report.format_type == ReportFormat.HTML:
            content = report.data.get('html_content', str(report.data))
        elif report.format_type == ReportFormat.MARKDOWN:
            content = report.data.get('markdown_content', str(report.data))
        else:
            content = json.dumps(report.to_dict(), indent=2, default=str)

        path.write_text(content, encoding='utf-8')
        logger.info(f"Report saved to {path}")
        return True

    except Exception as e:
        logger.error(f"Failed to save report: {e}")
        return False

# Initialize factory and register with global registry
def initialize_report_factories():
    """Initialize report factories."""
    builder_factory = ReportBuilderFactory()
    registry = get_factory_registry()
    registry.register_factory("report_builders", builder_factory)

    # Also initialize the global report factory
    get_report_factory()

    logger.info("Report factories initialized and registered")

# Auto-initialize when module is imported
initialize_report_factories()