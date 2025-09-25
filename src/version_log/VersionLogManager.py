"""
VersionLogManager Module - Main coordinator for version log system
Manages footer operations, integrates with other components, and handles persistence
"""

from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List
import json
import os

from .ContentHasher import ContentHasher
from .SemverManager import SemverManager, ChangeType
from .FooterRenderer import FooterRenderer

class VersionLogManager:
    """Main manager for version log operations"""

    def __init__(self, artifacts_dir: str = None):
        """
        Initialize the version log manager

        Args:
            artifacts_dir: Directory for storing audit logs
        """
        self.hasher = ContentHasher()
        self.semver = SemverManager()
        self.renderer = FooterRenderer()

        # Set artifacts directory
        if artifacts_dir:
            self.artifacts_dir = Path(artifacts_dir)
        else:
            # Default to .claude/.artifacts/
            self.artifacts_dir = Path.cwd() / '.claude' / '.artifacts'

        # Ensure directory exists
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)

        # Sidecar log file
        self.run_log_file = self.artifacts_dir / 'run_logs.jsonl'

    def update_file(self,
                    file_path: str,
                    agent_meta: str,
                    change_summary: str,
                    artifacts_changed: List[str] = None,
                    status: str = 'OK',
                    cost_usd: float = 0.0,
                    versions: Dict[str, str] = None,
                    inputs: List[str] = None,
                    tools_used: List[str] = None,
                    metadata: Dict[str, Any] = None) -> str:
        """
        Update a file with version log footer

        Args:
            file_path: Path to the file to update
            agent_meta: Agent/model identifier
            change_summary: Description of changes
            artifacts_changed: List of affected artifacts
            status: Operation status (OK, PARTIAL, BLOCKED)
            cost_usd: Cost in USD
            versions: Version information
            inputs: Input files/sources
            tools_used: Tools and MCP servers used
            metadata: Additional metadata

        Returns:
            Updated file content with footer
        """
        # Read current content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Split content and footer
        body = self.hasher.strip_footer(content)
        existing_footer_data = self.renderer.parse_existing_footer(content, file_path)

        # Compute content hash (excluding footer)
        pre_footer_hash = self.hasher.compute_hash(body)

        # Get existing rows or initialize
        rows = []
        if existing_footer_data:
            rows = existing_footer_data.get('rows', [])

        # Check for idempotency
        last_hash = None
        current_version = '1.0.0'
        if rows:
            last_row = rows[-1]
            last_hash = last_row.get('content_hash', '')
            current_version = last_row.get('version', '1.0.0')

        # Determine version and status
        if last_hash == pre_footer_hash:
            # No material change - idempotent
            version = current_version
            status = 'PARTIAL'
            note = 'no-op (idempotent)'
        elif not rows:
            # First time adding footer - use initial version
            version = '1.0.0'
            note = '--'
        else:
            # Detect change type and bump version
            change_type = ChangeType.PATCH  # Default
            if metadata:
                if metadata.get('breaking_change'):
                    change_type = ChangeType.MAJOR
                elif metadata.get('schema_change'):
                    change_type = ChangeType.MINOR

            version = self.semver.bump_version(current_version, change_type)
            note = '--'

        # Create new row
        new_row = {
            'version': version,
            'timestamp': datetime.now().isoformat(),
            'agent_model': agent_meta,
            'change_summary': self._truncate(change_summary, 80),
            'artifacts_changed': artifacts_changed or ['--'],
            'status': status,
            'warnings_notes': note if status != 'BLOCKED' else metadata.get('reason', '--'),
            'cost_usd': cost_usd,
            'content_hash': pre_footer_hash
        }

        # Add to rows and limit to max
        rows.append(new_row)
        if len(rows) > self.renderer.max_rows:
            rows = rows[-self.renderer.max_rows:]

        # Create receipt
        run_id = self._generate_run_id()
        receipt = {
            'status': status,
            'reason_if_blocked': metadata.get('reason', '--') if status == 'BLOCKED' else '--',
            'run_id': run_id,
            'inputs': inputs or [],
            'tools_used': tools_used or [],
            'versions': versions or {}
        }

        # Render new footer
        footer = self.renderer.render_footer(file_path, rows, receipt)

        # Combine body and footer
        updated_content = body + '\n\n' + footer

        # Write back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)

        # Emit sidecar log
        self._emit_sidecar_log({
            'run_id': run_id,
            'file': file_path,
            'pre_footer_hash': pre_footer_hash,
            'status': status,
            'version': version,
            'change_summary': change_summary,
            'artifacts_changed': artifacts_changed,
            'timestamp': datetime.now().isoformat(),
            'agent': agent_meta,
            'tools_used': tools_used,
            'cost_usd': cost_usd,
            'inputs': inputs
        })

        return updated_content

    def validate_footer(self, file_path: str) -> Dict[str, Any]:
        """
        Validate footer in a file

        Args:
            file_path: Path to file to validate

        Returns:
            Validation result dictionary
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Check if footer exists
            footer_data = self.renderer.parse_existing_footer(content, file_path)
            if not footer_data:
                return {
                    'valid': False,
                    'error': 'No footer found',
                    'file': file_path
                }

            # Validate content hash
            body = self.hasher.strip_footer(content)
            actual_hash = self.hasher.compute_hash(body)

            rows = footer_data.get('rows', [])
            if rows:
                last_row = rows[-1]
                expected_hash = last_row.get('content_hash', '')

                if actual_hash != expected_hash:
                    return {
                        'valid': False,
                        'error': 'Hash mismatch',
                        'expected': expected_hash,
                        'actual': actual_hash,
                        'file': file_path
                    }

            # Check row count
            if len(rows) > self.renderer.max_rows:
                return {
                    'valid': False,
                    'error': f'Too many rows ({len(rows)} > {self.renderer.max_rows})',
                    'file': file_path
                }

            return {
                'valid': True,
                'rows': len(rows),
                'last_version': rows[-1]['version'] if rows else None,
                'file': file_path
            }

        except Exception as e:
            return {
                'valid': False,
                'error': str(e),
                'file': file_path
            }

    def _truncate(self, text: str, max_length: int) -> str:
        """Truncate text to maximum length"""
        if len(text) <= max_length:
            return text
        return text[:max_length-3] + '...'

    def _generate_run_id(self) -> str:
        """Generate unique run ID"""
        import hashlib
        import time
        data = f"{time.time()}-{os.getpid()}"
        return hashlib.sha256(data.encode()).hexdigest()[:8]

    def _emit_sidecar_log(self, entry: Dict[str, Any]) -> None:
        """
        Emit entry to sidecar JSONL log

        Args:
            entry: Log entry dictionary
        """
        try:
            with open(self.run_log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(entry) + '\n')
        except Exception as e:
            # Log errors but don't fail the operation
            print(f"Warning: Failed to write sidecar log: {e}")

    def get_file_history(self, file_path: str) -> Optional[List[Dict[str, Any]]]:
        """
        Get version history for a file

        Args:
            file_path: Path to the file

        Returns:
            List of version rows or None if no footer
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            footer_data = self.renderer.parse_existing_footer(content, file_path)
            if footer_data:
                return footer_data.get('rows', [])
            return None

        except Exception:
            return None

    def repair_footer(self, file_path: str) -> bool:
        """
        Repair a corrupted or invalid footer

        Args:
            file_path: Path to file to repair

        Returns:
            True if repaired successfully
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Strip any existing footer
            body = self.hasher.strip_footer(content)

            # Compute correct hash
            correct_hash = self.hasher.compute_hash(body)

            # Try to salvage existing footer data
            footer_data = self.renderer.parse_existing_footer(content, file_path)
            rows = []
            if footer_data:
                rows = footer_data.get('rows', [])
                # Fix the last row's hash
                if rows:
                    rows[-1]['content_hash'] = correct_hash

            # If no rows, create initial
            if not rows:
                rows = [{
                    'version': '1.0.0',
                    'timestamp': datetime.now().isoformat(),
                    'agent_model': 'repair@System',
                    'change_summary': 'Footer repair',
                    'artifacts_changed': ['--'],
                    'status': 'OK',
                    'warnings_notes': 'Automatic repair',
                    'cost_usd': 0.0,
                    'content_hash': correct_hash
                }]

            # Create receipt
            receipt = {
                'status': 'OK',
                'reason_if_blocked': '--',
                'run_id': self._generate_run_id(),
                'inputs': [file_path],
                'tools_used': ['version-log-repair'],
                'versions': {'repair': 'v1'}
            }

            # Render footer
            footer = self.renderer.render_footer(file_path, rows, receipt)

            # Write repaired content
            repaired_content = body + '\n\n' + footer
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(repaired_content)

            return True

        except Exception as e:
            print(f"Error repairing footer: {e}")
            return False