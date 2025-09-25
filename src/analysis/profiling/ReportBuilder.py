"""
ReportBuilder - Extracted from result_aggregation_profiler
Handles report generation and formatting
Part of god object decomposition (Day 4)
"""

from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
import json
import logging

from dataclasses import dataclass, asdict
import csv

logger = logging.getLogger(__name__)

@dataclass
class ReportSection:
    """Report section definition."""
    title: str
    content: Any
    format: str  # text, table, chart, json
    order: int
    metadata: Dict[str, Any]

@dataclass
class ReportTemplate:
    """Report template definition."""
    name: str
    sections: List[ReportSection]
    format: str  # html, pdf, markdown, json
    style: Optional[Dict[str, Any]]

@dataclass
class Report:
    """Generated report."""
    id: str
    title: str
    generated_at: datetime
    sections: List[ReportSection]
    format: str
    metadata: Dict[str, Any]
    content: str

class ReportBuilder:
    """
    Handles report generation and formatting.

    Extracted from result_aggregation_profiler (1, 16 LOC -> ~200 LOC component).
    Handles:
    - Report generation
    - Multiple output formats
    - Template management
    - Visualization preparation
    - Export functionality
    """

    def __init__(self):
        """Initialize report builder."""
        self.templates: Dict[str, ReportTemplate] = {}
        self.reports: Dict[str, Report] = {}
        self.default_sections: List[str] = [
            'executive_summary',
            'performance_metrics',
            'resource_usage',
            'detailed_analysis',
            'recommendations'
        ]

        self._initialize_default_templates()

    def _initialize_default_templates(self):
        """Initialize default report templates."""
        # Performance report template
        self.templates['performance'] = ReportTemplate(
            name='Performance Report',
            sections=[
                ReportSection('Executive Summary', None, 'text', 1, {}),
                ReportSection('Performance Metrics', None, 'table', 2, {}),
                ReportSection('Resource Usage', None, 'chart', 3, {}),
                ReportSection('Bottlenecks', None, 'table', 4, {}),
                ReportSection('Recommendations', None, 'text', 5, {})
            ],
            format='html',
            style={'theme': 'default'}
        )

        # Analysis report template
        self.templates['analysis'] = ReportTemplate(
            name='Analysis Report',
            sections=[
                ReportSection('Overview', None, 'text', 1, {}),
                ReportSection('Data Summary', None, 'table', 2, {}),
                ReportSection('Statistical Analysis', None, 'table', 3, {}),
                ReportSection('Trends', None, 'chart', 4, {}),
                ReportSection('Conclusions', None, 'text', 5, {})
            ],
            format='markdown',
            style=None
        )

    def create_report(self,
                    title: str,
                    data: Dict[str, Any],
                    template_name: str = 'performance',
                    format: Optional[str] = None) -> Report:
        """Create report from data using template."""
        template = self.templates.get(template_name)
        if not template:
            template = self._create_default_template()

        # Use specified format or template default
        report_format = format or template.format

        # Generate report ID
        report_id = f"report-{int(datetime.now().timestamp())}"

        # Build sections from data
        sections = self._build_sections(data, template)

        # Generate content based on format
        content = self._generate_content(sections, report_format)

        # Create report object
        report = Report(
            id=report_id,
            title=title,
            generated_at=datetime.now(),
            sections=sections,
            format=report_format,
            metadata={
                'template': template_name,
                'data_keys': list(data.keys())
            },
            content=content
        )

        self.reports[report_id] = report
        logger.info(f"Created report: {report_id}")
        return report

    def _build_sections(self,
                        data: Dict[str, Any],
                        template: ReportTemplate) -> List[ReportSection]:
        """Build report sections from data."""
        sections = []

        for template_section in template.sections:
            # Map data to section content
            section_key = template_section.title.lower().replace(' ', '_')
            section_data = data.get(section_key, {})

            section = ReportSection(
                title=template_section.title,
                content=self._format_section_content(section_data, template_section.format),
                format=template_section.format,
                order=template_section.order,
                metadata=template_section.metadata
            )
            sections.append(section)

        return sorted(sections, key=lambda x: x.order)

    def _format_section_content(self, data: Any, format: str) -> Any:
        """Format section content based on type."""
        if format == 'text':
            return self._format_text(data)
        elif format == 'table':
            return self._format_table(data)
        elif format == 'chart':
            return self._format_chart_data(data)
        elif format == 'json':
            return data
        else:
            return str(data)

    def _format_text(self, data: Any) -> str:
        """Format data as text."""
        if isinstance(data, str):
            return data
        elif isinstance(data, dict):
            lines = []
            for key, value in data.items():
                lines.append(f"{key.replace('_', ' ').title()}: {value}")
            return '\n'.join(lines)
        elif isinstance(data, list):
            return '\n'.join(f"- {item}" for item in data)
        else:
            return str(data)

    def _format_table(self, data: Any) -> List[Dict[str, Any]]:
        """Format data as table."""
        if isinstance(data, list) and all(isinstance(item, dict) for item in data):
            return data
        elif isinstance(data, dict):
            # Convert dict to table format
            return [{'Key': k, 'Value': v} for k, v in data.items()]
        else:
            return [{'Value': str(data)}]

    def _format_chart_data(self, data: Any) -> Dict[str, Any]:
        """Format data for chart visualization."""
        if isinstance(data, dict) and 'labels' in data and 'values' in data:
            return data
        elif isinstance(data, list):
            return {
                'labels': list(range(len(data))),
                'values': data
            }
        elif isinstance(data, dict):
            return {
                'labels': list(data.keys()),
                'values': list(data.values())
            }
        else:
            return {'labels': ['Data'], 'values': [data]}

    def _generate_content(self, sections: List[ReportSection], format: str) -> str:
        """Generate report content in specified format."""
        if format == 'html':
            return self._generate_html(sections)
        elif format == 'markdown':
            return self._generate_markdown(sections)
        elif format == 'json':
            return self._generate_json(sections)
        elif format == 'csv':
            return self._generate_csv(sections)
        else:
            return self._generate_text(sections)

    def _generate_html(self, sections: List[ReportSection]) -> str:
        """Generate HTML report."""
        html = ['<html><head><title>Report</title></head><body>']

        for section in sections:
            html.append(f'<h2>{section.title}</h2>')

            if section.format == 'table' and isinstance(section.content, list):
                html.append('<table border="1">')
                if section.content:
                    # Header
                    html.append('<tr>')
                    for key in section.content[0].keys():
                        html.append(f'<th>{key}</th>')
                    html.append('</tr>')

                    # Rows
                    for row in section.content:
                        html.append('<tr>')
                        for value in row.values():
                            html.append(f'<td>{value}</td>')
                        html.append('</tr>')
                html.append('</table>')
            else:
                html.append(f'<div>{section.content}</div>')

        html.append('</body></html>')
        return ''.join(html)

    def _generate_markdown(self, sections: List[ReportSection]) -> str:
        """Generate Markdown report."""
        markdown = []

        for section in sections:
            markdown.append(f'## {section.title}\n')

            if section.format == 'table' and isinstance(section.content, list):
                if section.content:
                    # Header
                    headers = list(section.content[0].keys())
                    markdown.append('| ' + ' | '.join(headers) + ' |')
                    markdown.append('|' + '---|' * len(headers))

                    # Rows
                    for row in section.content:
                        values = [str(v) for v in row.values()]
                        markdown.append('| ' + ' | '.join(values) + ' |')
                markdown.append('')
            else:
                markdown.append(str(section.content))
                markdown.append('')

        return '\n'.join(markdown)

    def _generate_json(self, sections: List[ReportSection]) -> str:
        """Generate JSON report."""
        data = {
            'sections': [
                {
                    'title': section.title,
                    'content': section.content,
                    'format': section.format
                }
                for section in sections
            ]
        }
        return json.dumps(data, indent=2, default=str)

    def _generate_csv(self, sections: List[ReportSection]) -> str:
        """Generate CSV report (tables only)."""
        output = []

        for section in sections:
            if section.format == 'table' and isinstance(section.content, list):
                output.append(f'# {section.title}')
                if section.content:
                    import io
                    csv_buffer = io.StringIO()
                    writer = csv.DictWriter(csv_buffer, fieldnames=section.content[0].keys())
                    writer.writeheader()
                    writer.writerows(section.content)
                    output.append(csv_buffer.getvalue())

        return '\n'.join(output)

    def _generate_text(self, sections: List[ReportSection]) -> str:
        """Generate plain text report."""
        text = []

        for section in sections:
            text.append(f'{section.title}')
            text.append('=' * len(section.title))
            text.append(str(section.content))
            text.append('')

        return '\n'.join(text)

    def export_report(self,
                    report_id: str,
                    output_path: str) -> bool:
        """Export report to file."""
        if report_id not in self.reports:
            logger.error(f"Report not found: {report_id}")
            return False

        report = self.reports[report_id]

        try:
            path = Path(output_path)
            path.parent.mkdir(parents=True, exist_ok=True)

            with open(path, 'w') as f:
                f.write(report.content)

            logger.info(f"Exported report to {output_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to export report: {e}")
            return False

    def _create_default_template(self) -> ReportTemplate:
        """Create default report template."""
        return ReportTemplate(
            name='Default',
            sections=[
                ReportSection('Summary', None, 'text', 1, {}),
                ReportSection('Data', None, 'json', 2, {})
            ],
            format='json',
            style=None
        )

    def add_template(self, name: str, template: ReportTemplate):
        """Add custom report template."""
        self.templates[name] = template
        logger.info(f"Added template: {name}")

    def list_reports(self) -> List[Dict[str, Any]]:
        """List all generated reports."""
        return [
            {
                'id': report.id,
                'title': report.title,
                'generated_at': report.generated_at.isoformat(),
                'format': report.format
            }
            for report in self.reports.values()
        ]