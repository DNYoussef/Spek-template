"""
AgentFooterMiddleware - Integration layer for agent file operations
Automatically adds version log footers to all file modifications
"""

from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, Callable
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.version_log import VersionLogManager

class AgentFooterMiddleware:
    """Middleware for automatic footer management in agent operations"""

    def __init__(self, artifacts_dir: str = None):
        """
        Initialize the middleware

        Args:
            artifacts_dir: Directory for audit logs
        """
        self.manager = VersionLogManager(artifacts_dir)
        self.enabled = True
        self.auto_repair = True

    def wrap_file_operation(self, operation: Callable) -> Callable:
        """
        Wrap a file operation with footer management

        Args:
            operation: Original file operation function

        Returns:
            Wrapped function with footer management
        """
        def wrapped_operation(file_path: str, content: str, *args, **kwargs):
            # Execute original operation
            result = operation(file_path, content, *args, **kwargs)

            if self.enabled:
                # Extract agent metadata from context
                agent_meta = kwargs.get('agent_meta', 'unknown@System')
                change_summary = kwargs.get('change_summary', 'File modification')
                artifacts = kwargs.get('artifacts', [])
                status = 'OK'
                cost = kwargs.get('cost', 0.0)
                versions = kwargs.get('versions', {})
                inputs = kwargs.get('inputs', [])
                tools = kwargs.get('tools', [])
                metadata = kwargs.get('metadata', {})

                try:
                    # Update file with footer
                    self.manager.update_file(
                        file_path=file_path,
                        agent_meta=agent_meta,
                        change_summary=change_summary,
                        artifacts_changed=artifacts,
                        status=status,
                        cost_usd=cost,
                        versions=versions,
                        inputs=inputs,
                        tools_used=tools,
                        metadata=metadata
                    )
                except Exception as e:
                    # Log error but don't fail the operation
                    self._log_error(f"Footer update failed: {e}")

            return result

        return wrapped_operation

    def process_agent_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process an agent action and add footer if it's a file operation

        Args:
            action: Agent action dictionary

        Returns:
            Processed action with footer management
        """
        action_type = action.get('type', '')

        # Check if this is a file operation
        if action_type in ['write_file', 'edit_file', 'create_file', 'modify_file']:
            file_path = action.get('file_path')
            if file_path:
                # Extract metadata
                agent_info = action.get('agent', {})
                agent_meta = f"{agent_info.get('name', 'unknown')}@{agent_info.get('model', 'Unknown')}"

                # Prepare footer data
                footer_data = {
                    'agent_meta': agent_meta,
                    'change_summary': action.get('description', 'File operation'),
                    'artifacts': action.get('related_files', []),
                    'status': 'OK' if action.get('success', True) else 'PARTIAL',
                    'cost': action.get('cost', 0.0),
                    'versions': {
                        'agent': agent_info.get('version', '1.0'),
                        'model': agent_info.get('model_version', 'latest')
                    },
                    'inputs': action.get('inputs', []),
                    'tools': action.get('tools_used', []),
                    'metadata': action.get('metadata', {})
                }

                # Update file with footer
                try:
                    self.manager.update_file(
                        file_path=file_path,
                        **footer_data
                    )
                    action['footer_added'] = True
                except Exception as e:
                    action['footer_error'] = str(e)

        return action

    def validate_file_footers(self, file_paths: list) -> Dict[str, Any]:
        """
        Validate footers for multiple files

        Args:
            file_paths: List of file paths to validate

        Returns:
            Validation results
        """
        results = {
            'valid': [],
            'invalid': [],
            'missing': [],
            'errors': []
        }

        for file_path in file_paths:
            if not os.path.exists(file_path):
                results['missing'].append(file_path)
                continue

            try:
                validation = self.manager.validate_footer(file_path)
                if validation['valid']:
                    results['valid'].append(file_path)
                else:
                    results['invalid'].append({
                        'file': file_path,
                        'error': validation.get('error', 'Unknown error')
                    })
            except Exception as e:
                results['errors'].append({
                    'file': file_path,
                    'error': str(e)
                })

        # Auto-repair if enabled
        if self.auto_repair and results['invalid']:
            for invalid in results['invalid']:
                try:
                    if self.manager.repair_footer(invalid['file']):
                        results['valid'].append(invalid['file'])
                        results['invalid'].remove(invalid)
                except Exception:
                    pass  # Keep in invalid list

        return results

    def get_agent_context(self) -> Dict[str, Any]:
        """
        Get current agent context for footer metadata

        Returns:
            Agent context dictionary
        """
        # This would integrate with the actual agent system
        return {
            'agent_name': os.environ.get('AGENT_NAME', 'unknown'),
            'agent_model': os.environ.get('AGENT_MODEL', 'System'),
            'agent_version': os.environ.get('AGENT_VERSION', '1.0.0'),
            'session_id': os.environ.get('SESSION_ID', self._generate_session_id()),
            'mcp_servers': os.environ.get('MCP_SERVERS', '').split(','),
            'timestamp': datetime.now().isoformat()
        }

    def _generate_session_id(self) -> str:
        """Generate unique session ID"""
        import hashlib
        import time
        data = f"{time.time()}-{os.getpid()}"
        return hashlib.sha256(data.encode()).hexdigest()[:8]

    def _log_error(self, message: str) -> None:
        """Log error message"""
        error_log = Path.cwd() / '.claude' / '.artifacts' / 'footer-errors.log'
        error_log.parent.mkdir(parents=True, exist_ok=True)

        with open(error_log, 'a', encoding='utf-8') as f:
            f.write(f"{datetime.now().isoformat()} - {message}\n")

# Singleton instance
_middleware_instance = None

def get_middleware() -> AgentFooterMiddleware:
    """Get or create the middleware singleton"""
    global _middleware_instance
    if _middleware_instance is None:
        _middleware_instance = AgentFooterMiddleware()
    return _middleware_instance

def wrap_agent_file_operations():
    """
    Monkey-patch common file operations to add footer support
    This would be called during agent initialization
    """
    middleware = get_middleware()

    # Example of wrapping built-in operations

    # Original write function
    original_write = open

    def wrapped_open(file, mode='r', *args, **kwargs):
        # Only wrap write modes
        if 'w' in mode or 'a' in mode:
            # Store original for later wrapping
            pass  # Would implement actual wrapping logic
        return original_write(file, mode, *args, **kwargs)

    # This is just an example - actual implementation would be more sophisticated