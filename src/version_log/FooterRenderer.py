"""
FooterRenderer Module - Multi-format footer rendering for different file types
Supports various comment styles and maintains format consistency
"""

from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
import json

class FooterRenderer:
    """Renders version log footers in appropriate formats for different file types"""

    def __init__(self):
        """Initialize the footer renderer with comment style mappings"""
        self.comment_styles = self._load_comment_styles()
        self.max_rows = 20  # Maximum number of history rows to keep

    def _load_comment_styles(self) -> Dict[str, Dict[str, str]]:
        """
        Load comment style configuration for different file types

        Returns:
            Dictionary mapping file extensions to comment styles
        """
        return {
            '.md': {
                'style': 'html',
                'begin': '<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->',
                'end': '<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->',
                'line_prefix': '',
                'line_suffix': ''
            },
            '.html': {
                'style': 'html',
                'begin': '<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->',
                'end': '<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->',
                'line_prefix': '',
                'line_suffix': ''
            },
            '.py': {
                'style': 'hash',
                'begin': '# ===== AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE =====',
                'end': '# ===== AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE =====',
                'line_prefix': '# ',
                'line_suffix': ''
            },
            '.sh': {
                'style': 'hash',
                'begin': '# ===== AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE =====',
                'end': '# ===== AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE =====',
                'line_prefix': '# ',
                'line_suffix': ''
            },
            '.js': {
                'style': 'block',
                'begin': '/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE',
                'end': 'AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */',
                'line_prefix': '',
                'line_suffix': ''
            },
            '.ts': {
                'style': 'block',
                'begin': '/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE',
                'end': 'AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */',
                'line_prefix': '',
                'line_suffix': ''
            },
            '.jsx': {
                'style': 'block',
                'begin': '/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE',
                'end': 'AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */',
                'line_prefix': '',
                'line_suffix': ''
            },
            '.tsx': {
                'style': 'block',
                'begin': '/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE',
                'end': 'AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */',
                'line_prefix': '',
                'line_suffix': ''
            },
            '.java': {
                'style': 'block',
                'begin': '/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE',
                'end': 'AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */',
                'line_prefix': '',
                'line_suffix': ''
            },
            '.c': {
                'style': 'block',
                'begin': '/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE',
                'end': 'AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */',
                'line_prefix': '',
                'line_suffix': ''
            },
            '.cpp': {
                'style': 'block',
                'begin': '/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE',
                'end': 'AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */',
                'line_prefix': '',
                'line_suffix': ''
            },
            '.go': {
                'style': 'block',
                'begin': '/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE',
                'end': 'AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */',
                'line_prefix': '',
                'line_suffix': ''
            },
            '.yaml': {
                'style': 'hash',
                'begin': '# ===== AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE =====',
                'end': '# ===== AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE =====',
                'line_prefix': '# ',
                'line_suffix': ''
            },
            '.yml': {
                'style': 'hash',
                'begin': '# ===== AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE =====',
                'end': '# ===== AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE =====',
                'line_prefix': '# ',
                'line_suffix': ''
            }
        }

    def get_comment_style(self, file_path: str) -> Dict[str, str]:
        """
        Get the appropriate comment style for a file

        Args:
            file_path: Path to the file

        Returns:
            Comment style configuration
        """
        path = Path(file_path)
        suffix = path.suffix.lower()

        # Return specific style or default
        return self.comment_styles.get(suffix, self.comment_styles['.md'])

    def render_footer(self,
                    file_path: str,
                    rows: List[Dict[str, Any]],
                    receipt: Dict[str, Any]) -> str:
        """
        Render a complete footer for the given file type

        Args:
            file_path: Path to the file
            rows: List of version log rows
            receipt: Current operation receipt data

        Returns:
            Formatted footer string
        """
        style = self.get_comment_style(file_path)
        lines = []

        # Begin marker
        lines.append(style['begin'])

        # Add blank line if not hash style
        if style['style'] != 'hash':
            lines.append('')

        # Title
        lines.append(self._format_line('## Version & Run Log', style))
        lines.append('')

        # Table header
        lines.append(self._format_line(
            '| Version | Timestamp (ISO-8601)     | Agent/Model | Change Summary | Artifacts Changed | Status | Warnings/Notes | Cost (USD) | Content Hash |',
            style
        ))
        lines.append(self._format_line(
            '|--------:|---------------------------|-------------|----------------|-------------------|--------|----------------|-----------:|--------------|',
            style
        ))

        # Limit rows to max_rows
        display_rows = rows[-self.max_rows:] if len(rows) > self.max_rows else rows

        # Table rows
        for row in display_rows:
            row_str = self._format_table_row(row)
            lines.append(self._format_line(row_str, style))

        # Receipt section
        lines.append('')
        lines.append(self._format_line('### Receipt', style))
        lines.extend(self._format_receipt(receipt, style))

        # Add blank line if not hash style
        if style['style'] != 'hash':
            lines.append('')

        # End marker
        lines.append(style['end'])

        return '\n'.join(lines)

    def _format_line(self, content: str, style: Dict[str, str]) -> str:
        """
        Format a line with appropriate comment prefix/suffix

        Args:
            content: Line content
            style: Comment style configuration

        Returns:
            Formatted line
        """
        if not content:
            return style['line_prefix'].rstrip() if style['line_prefix'] else ''

        return f"{style['line_prefix']}{content}{style['line_suffix']}"

    def _format_table_row(self, row: Dict[str, Any]) -> str:
        """
        Format a single table row

        Args:
            row: Row data dictionary

        Returns:
            Formatted table row string
        """
        # Ensure all fields exist with defaults
        version = row.get('version', '1.0.0')
        timestamp = row.get('timestamp', datetime.now().isoformat())
        agent_model = row.get('agent_model', 'unknown')
        change_summary = self._truncate(row.get('change_summary', ''), 80)
        artifacts = row.get('artifacts_changed', '--')
        if isinstance(artifacts, list):
            artifacts = ', '.join(artifacts) if artifacts else '--'
        status = row.get('status', 'OK')
        notes = row.get('warnings_notes', '--')
        cost = f"{row.get('cost_usd', 0.00):.2f}"
        content_hash = row.get('content_hash', '0000000')[:7]

        return f"| {version:7} | {timestamp:25} | {agent_model:11} | {change_summary:14} | {artifacts:17} | {status:6} | {notes:14} | {cost:>10} | {content_hash:12} |"

    def _format_receipt(self, receipt: Dict[str, Any], style: Dict[str, str]) -> List[str]:
        """
        Format the receipt section

        Args:
            receipt: Receipt data
            style: Comment style configuration

        Returns:
            List of formatted receipt lines
        """
        lines = []

        # Format each receipt field
        lines.append(self._format_line(f"- `status`: {receipt.get('status', 'OK')}", style))
        lines.append(self._format_line(f"- `reason_if_blocked`: {receipt.get('reason_if_blocked', '--')}", style))
        lines.append(self._format_line(f"- `run_id`: {receipt.get('run_id', 'unknown')}", style))

        # Format inputs array
        inputs = receipt.get('inputs', [])
        inputs_str = json.dumps(inputs) if inputs else '[]'
        lines.append(self._format_line(f"- `inputs`: {inputs_str}", style))

        # Format tools array
        tools = receipt.get('tools_used', [])
        tools_str = json.dumps(tools) if tools else '[]'
        lines.append(self._format_line(f"- `tools_used`: {tools_str}", style))

        # Format versions object
        versions = receipt.get('versions', {})
        versions_str = json.dumps(versions) if versions else '{}'
        lines.append(self._format_line(f"- `versions`: {versions_str}", style))

        return lines

    def _truncate(self, text: str, max_length: int) -> str:
        """
        Truncate text to maximum length

        Args:
            text: Text to truncate
            max_length: Maximum allowed length

        Returns:
            Truncated text
        """
        if len(text) <= max_length:
            return text
        return text[:max_length-3] + '...'

    def parse_existing_footer(self, content: str, file_path: str) -> Optional[Dict[str, Any]]:
        """
        Parse an existing footer from file content

        Args:
            content: File content containing footer
            file_path: Path to the file

        Returns:
            Parsed footer data or None if not found
        """
        style = self.get_comment_style(file_path)

        # Find footer boundaries
        begin_idx = content.find(style['begin'])
        end_idx = content.find(style['end'])

        if begin_idx == -1 or end_idx == -1:
            return None

        # Extract footer content
        footer_content = content[begin_idx:end_idx + len(style['end'])]

        # Parse table rows
        rows = []
        in_table = False
        for line in footer_content.split('\n'):
            # Remove comment prefixes
            clean_line = line
            if style['line_prefix']:
                clean_line = line.replace(style['line_prefix'], '', 1)
            clean_line = clean_line.strip()

            # Check for table rows
            if clean_line.startswith('|') and not clean_line.startswith('|--'):
                parts = [p.strip() for p in clean_line.split('|')[1:-1]]
                if len(parts) >= 9 and parts[0] != 'Version':  # Skip header
                    row = {
                        'version': parts[0],
                        'timestamp': parts[1],
                        'agent_model': parts[2],
                        'change_summary': parts[3],
                        'artifacts_changed': parts[4],
                        'status': parts[5],
                        'warnings_notes': parts[6],
                        'cost_usd': float(parts[7]) if parts[7] and parts[7] != '--' else 0.0,
                        'content_hash': parts[8]
                    }
                    rows.append(row)

        # Parse receipt (simplified for now)
        receipt = {
            'status': 'OK',
            'reason_if_blocked': '--',
            'run_id': 'parsed',
            'inputs': [],
            'tools_used': [],
            'versions': {}
        }

        return {
            'rows': rows,
            'receipt': receipt
        }