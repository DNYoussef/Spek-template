"""
Footer Middleware v2.0 - Enhanced with Ops Kit Specification
Minimal, real, copy-paste ready middleware for footer management
"""

from datetime import datetime, timezone
from hashlib import sha256
from typing import Optional, Tuple, Dict, List, Any
import json
import re

from .receipt_schema import Receipt, FooterRow, FooterMarkers

class FooterMiddleware:
    """
    Middleware for managing Version & Run Log footers
    Handles hashing, append-only operations, and rotation
    """

    BEGIN = "AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE"
    END = "AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE"
    MAX_ROWS = 20

    def __init__(self):
        self.hash_length = 7

    def _normalize(self, text: str) -> str:
        """Normalize text for consistent hashing"""
        return text.replace("\r\n", "\n").rstrip()

    def _short_hash(self, s: str) -> str:
        """Compute 7-character SHA256 hash"""
        return sha256(self._normalize(s).encode()).hexdigest()[:self.hash_length]

    def split_footer(self, text: str) -> Tuple[str, Optional[str]]:
        """
        Split file content into body and footer
        Returns (body, footer) or (text, None) if no footer
        """
        if self.BEGIN not in text or self.END not in text:
            return text, None

        # Find marker positions
        start_idx = text.index(self.BEGIN)
        end_idx = text.index(self.END) + len(self.END)

        # Look for comment fence boundaries
        pre = text[:start_idx]
        post = text[end_idx:]

        # Try to find full comment boundaries
        fence_patterns = [
            ('<!--', '-->'),
            ('/*', '*/'),
            ('#', '\n'),
            ('--', '\n')
        ]

        actual_start = start_idx
        actual_end = end_idx

        for open_fence, close_fence in fence_patterns:
            fence_start = pre.rfind(open_fence)
            if fence_start != -1:
                actual_start = fence_start
                # Find corresponding close
                if close_fence == '\n':
                    # For line comments, footer ends at next line
                    next_line = post.find('\n')
                    if next_line != -1:
                        actual_end = end_idx + next_line + 1
                else:
                    fence_end = post.find(close_fence)
                    if fence_end != -1:
                        actual_end = end_idx + fence_end + len(close_fence)
                break

        body = text[:actual_start].rstrip()
        footer = text[actual_start:actual_end]

        return body, footer

    def parse_footer_rows(self, footer: str) -> List[Dict[str, Any]]:
        """Parse existing footer rows from footer text"""
        rows = []
        in_table = False

        for line in footer.splitlines():
            line = line.strip()
            if not line:
                continue

            # Skip header rows
            if "Version" in line and "|" in line:
                in_table = True
                continue

            if in_table and line.startswith("|") and "---" not in line:
                # Parse table row
                cells = [c.strip() for c in line.split("|")[1:-1]]
                if len(cells) >= 9:
                    rows.append({
                        'version': cells[0],
                        'timestamp': cells[1],
                        'agent_model': cells[2],
                        'change_summary': cells[3],
                        'artifacts_changed': cells[4],
                        'status': cells[5],
                        'warnings_notes': cells[6],
                        'cost_usd': cells[7],
                        'content_hash': cells[8]
                    })

            if line.startswith("### Receipt"):
                break

        return rows

    def determine_version(
        self,
        last_version: Optional[str],
        content_hash: str,
        last_hash: Optional[str],
        is_breaking: bool = False,
        is_feature: bool = False
    ) -> Tuple[str, str, str]:
        """
        Determine new version based on content changes
        Returns (version, status, note)
        """
        # Idempotency check
        if last_hash == content_hash:
            version = last_version or "1.0.0"
            return version, "PARTIAL", "no-op (idempotent)"

        # Initial version
        if not last_version:
            return "1.0.0", "OK", "--"

        # Parse version
        parts = last_version.split(".")
        major, minor, patch = int(parts[0]), int(parts[1]), int(parts[2])

        # Bump based on change type
        if is_breaking:
            major += 1
            minor = 0
            patch = 0
        elif is_feature:
            minor += 1
            patch = 0
        else:
            patch += 1

        version = f"{major}.{minor}.{patch}"
        return version, "OK", "--"

    def render_footer(
        self,
        file_path: str,
        rows: List[FooterRow],
        receipt: Receipt,
        file_extension: Optional[str] = None
    ) -> str:
        """Render complete footer with appropriate comment style"""
        if not file_extension:
            file_extension = '.' + file_path.split('.')[-1] if '.' in file_path else '.md'

        markers = FooterMarkers.get_markers(file_extension)

        # Build table
        header = "| Version | Timestamp | Agent/Model | Change Summary | Artifacts Changed (IDs) | Status | Warnings/Notes | Cost (USD) | Content Hash |"
        divider = "|--------:|-----------|-------------|----------------|-------------------|--------|----------------|-----------:|--------------|"

        table_rows = [row.to_table_row() for row in rows[-self.MAX_ROWS:]]

        # Build receipt section
        receipt_text = receipt.to_footer_receipt()

        # Combine with markers
        lines = [
            markers['begin'],
            "## Version & Run Log",
            header,
            divider
        ]
        lines.extend(table_rows)
        lines.append(receipt_text)
        lines.append(markers['end'])

        return "\n".join(lines)

    def update_footer(
        self,
        file_text: str,
        agent_meta: str,
        change_summary: str,
        artifacts_changed: List[str],
        status: str,
        cost_usd: float,
        receipt: Receipt,
        file_path: str = "file.md"
    ) -> str:
        """
        Main entry point: update file with footer
        Returns updated file content
        """
        body, existing_footer = self.split_footer(file_text)
        content_hash = self._short_hash(body)

        # Parse existing rows
        rows = []
        last_version = None
        last_hash = None

        if existing_footer:
            parsed_rows = self.parse_footer_rows(existing_footer)
            if parsed_rows:
                last_row = parsed_rows[-1]
                last_version = last_row['version']
                last_hash = last_row['content_hash']
                # Convert to FooterRow objects
                for pr in parsed_rows:
                    rows.append(FooterRow(
                        version=pr['version'],
                        timestamp=pr['timestamp'],
                        agent_model=pr['agent_model'],
                        change_summary=pr['change_summary'],
                        artifacts_changed=pr['artifacts_changed'].split(', ') if pr['artifacts_changed'] != '--' else [],
                        status=pr['status'],
                        warnings_notes=pr['warnings_notes'],
                        cost_usd=float(pr['cost_usd']) if pr['cost_usd'] != '--' else 0.0,
                        content_hash=pr['content_hash']
                    ))

        # Determine version
        version, actual_status, note = self.determine_version(
            last_version, content_hash, last_hash
        )

        # Override status if provided status is more restrictive
        if status == "BLOCKED":
            actual_status = status
            note = receipt.reason_if_blocked or "check warnings"
        elif status == "PARTIAL" and actual_status == "OK":
            actual_status = status
            note = receipt.warnings[0] if receipt.warnings else "check warnings"

        # Create new row
        new_row = FooterRow(
            version=version,
            timestamp=datetime.now().astimezone().isoformat(timespec="seconds"),
            agent_model=agent_meta,
            change_summary=change_summary[:80] if change_summary else "--",
            artifacts_changed=artifacts_changed,
            status=actual_status,
            warnings_notes=note,
            cost_usd=cost_usd,
            content_hash=content_hash
        )

        rows.append(new_row)

        # Render footer
        file_ext = '.' + file_path.split('.')[-1] if '.' in file_path else '.md'
        footer = self.render_footer(file_path, rows, receipt, file_ext)

        # Combine
        separator = "\n\n" if body and not body.endswith("\n") else "\n" if body else ""
        return body + separator + footer

    def validate_footer(self, file_text: str, file_path: str = "file.md") -> Dict[str, Any]:
        """Validate footer integrity"""
        body, footer = self.split_footer(file_text)

        if not footer:
            return {
                'valid': False,
                'error': 'No footer found',
                'file': file_path
            }

        rows = self.parse_footer_rows(footer)
        if not rows:
            return {
                'valid': False,
                'error': 'No rows in footer',
                'file': file_path
            }

        # Check row count
        if len(rows) > self.MAX_ROWS:
            return {
                'valid': False,
                'error': f'Too many rows: {len(rows)} > {self.MAX_ROWS}',
                'file': file_path
            }

        # Validate hash
        actual_hash = self._short_hash(body)
        last_row = rows[-1]
        expected_hash = last_row['content_hash']

        if actual_hash != expected_hash:
            return {
                'valid': False,
                'error': 'Hash mismatch',
                'expected': expected_hash,
                'actual': actual_hash,
                'file': file_path
            }

        return {
            'valid': True,
            'rows': len(rows),
            'version': last_row['version'],
            'status': last_row['status'],
            'file': file_path
        }