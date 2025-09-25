"""Bandit security linter adapter implementation."""

from typing import List, Dict, Any
import io
import json

import csv

from src.adapters.base_adapter import BaseLinterAdapter
from src.models.linter_models import (
    LinterConfig, LinterViolation, StandardSeverity, ViolationType
)

class BanditAdapter(BaseLinterAdapter):
    """Adapter for Bandit security linter."""
    
def __init__(self, config: LinterConfig):
        super().__init__(config)
        self.tool_name = "bandit"
    
def get_command_args(self, target_paths: List[str]) -> List[str]:
        """Build bandit command arguments."""
        cmd = self.config.get_command_base()
        
        # Add JSON format for structured output
        cmd.extend(['-f', 'json'])
        
        # Add config file if specified
        if self.config.config_file:
            cmd.extend(['-c', self.config.config_file])
        
        # Recursive scan for directories
        cmd.append('-r')
        
        # Add target paths
        cmd.extend(target_paths)
        
        return cmd
    
def parse_output(self, raw_output: str, stderr: str = "") -> List[LinterViolation]:
        """Parse bandit JSON output into standardized violations."""
        violations = []
        
        if not raw_output.strip():
            return violations
        
        # Try JSON parsing
        json_violations = self._parse_json_output(raw_output)
        if json_violations:
            return json_violations
        
        # Fall back to text parsing if needed
        return self._parse_text_output(raw_output)
    
def _parse_json_output(self, output: str) -> List[LinterViolation]:
        """Parse JSON-formatted bandit output."""
        violations = []
        
        json_data = self.safe_json_parse(output)
        if not json_data:
            return violations
        
        # Bandit JSON structure has 'results' key
        results = []
        if isinstance(json_data, dict):
            results = json_data.get('results', [])
        elif isinstance(json_data, list):
            # Sometimes it's just a list of results
            results = json_data
        
        for item in results:
            if not isinstance(item, dict):
                continue
            
            # Extract violation data
            test_id = item.get('test_id', item.get('test_name', ''))
            issue_severity = item.get('issue_severity', 'MEDIUM')
            issue_confidence = item.get('issue_confidence', 'MEDIUM')
            issue_text = item.get('issue_text', '')
            
            filename = item.get('filename', '')
            line_number = item.get('line_number', 0)
            line_range = item.get('line_range', [line_number])
            
            # Get code context
            code = item.get('code', '')
            
            # Get CWE information if available
            cwe_id = self._get_cwe_mapping(test_id)
            
            # Build comprehensive message
            message = issue_text
            if code:
                message = f"{issue_text} (Code: {code[:50]}...)" if len(code) > 50 else f"{issue_text} (Code: {code})"
            
            # Create violation
            violation = self.create_violation(
                rule_id=test_id,
                message=message,
                file_path=filename,
                line=line_number,
                column=None,  # Bandit doesn't provide column info
                end_line=max(line_range) if line_range else None,
                severity_raw=issue_severity,
                category='security',
                confidence=issue_confidence,
                cwe_id=cwe_id,
                rule_description=self._get_test_description(test_id),
                raw_data=item
            )
            violations.append(violation)
        
        return violations
    
def _parse_text_output(self, output: str) -> List[LinterViolation]:
        """Parse text-formatted bandit output (fallback)."""
        violations = []
        
        # Text parsing for bandit is complex due to multi-line format
        lines = output.strip().split('\n')
        current_issue = {}
        
        for line in lines:
            line = line.strip()
            
            if line.startswith('>> Issue: ['):
                # New issue found
                if current_issue:
                    # Process previous issue
                    violation = self._create_violation_from_text(current_issue)
                    if violation:
                        violations.append(violation)
                
                # Start new issue
                current_issue = {'line': line}
            elif current_issue:
                current_issue.setdefault('details', []).append(line)
        
        # Process last issue
        if current_issue:
            violation = self._create_violation_from_text(current_issue)
            if violation:
                violations.append(violation)
        
        return violations
    
def _create_violation_from_text(self, issue_data: Dict[str, Any]) -> LinterViolation:
        """Create violation from parsed text data."""
        # This is a simplified implementation
        line = issue_data.get('line', '')
        details = issue_data.get('details', [])
        
        # Extract basic information (simplified)
        rule_id = 'B000'  # Default
        message = 'Security issue detected'
        filename = 'unknown'
        line_num = 1
        
        return self.create_violation(
            rule_id=rule_id,
            message=message,
            file_path=filename,
            line=line_num,
            severity_raw='MEDIUM',
            category='security',
            raw_data=issue_data
        )
    
def normalize_severity(self, tool_severity: str, rule_id: str = "") -> StandardSeverity:
        """Convert bandit severity to standard severity."""
        # Apply user overrides first
        if rule_id:
            override = self.apply_severity_overrides(rule_id, None)
            if override:
                return override
        
        # Bandit severity mapping
        severity_map = {
            'HIGH': StandardSeverity.ERROR,
            'MEDIUM': StandardSeverity.WARNING,
            'LOW': StandardSeverity.INFO,
        }
        
        return severity_map.get(tool_severity.upper(), StandardSeverity.WARNING)
    
def get_violation_type(self, rule_id: str, category: str = "") -> ViolationType:
        """Determine violation type from bandit rule ID."""
        # All bandit violations are security-related
        return ViolationType.SECURITY
    
def _get_cwe_mapping(self, test_id: str) -> str:
        """Get CWE ID mapping for bandit test IDs."""
        # Common Bandit test ID to CWE mappings
        cwe_mapping = {
            'B101': 'CWE-78',   # assert_used
            'B102': 'CWE-78',   # exec_used
            'B103': 'CWE-732',  # set_bad_file_permissions
            'B104': 'CWE-319',  # hardcoded_bind_all_interfaces
            'B105': 'CWE-798',  # hardcoded_password_string
            'B106': 'CWE-798',  # hardcoded_password_funcarg
            'B107': 'CWE-798',  # hardcoded_password_default
            'B108': 'CWE-377',  # hardcoded_tmp_directory
            'B110': 'CWE-703',  # try_except_pass
            'B112': 'CWE-703',  # try_except_continue
            'B201': 'CWE-78',   # flask_debug_true
            'B301': 'CWE-502',  # pickle
            'B302': 'CWE-502',  # pickle
            'B303': 'CWE-502',  # pickle
            'B304': 'CWE-502',  # pickle
            'B305': 'CWE-502',  # pickle
            'B306': 'CWE-502',  # pickle
            'B307': 'CWE-78',   # eval
            'B308': 'CWE-696',  # mark_safe
            'B309': 'CWE-330',  # httpsconnection
            'B310': 'CWE-22',   # urllib_urlopen
            'B311': 'CWE-330',  # random
            'B312': 'CWE-209',  # telnetlib
            'B313': 'CWE-79',   # xml_bad_cElementTree
            'B314': 'CWE-79',   # xml_bad_ElementTree
            'B315': 'CWE-79',   # xml_bad_expatreader
            'B316': 'CWE-79',   # xml_bad_expatbuilder
            'B317': 'CWE-79',   # xml_bad_sax
            'B318': 'CWE-79',   # xml_bad_minidom
            'B319': 'CWE-79',   # xml_bad_pulldom
            'B320': 'CWE-79',   # xml_bad_etree
            'B321': 'CWE-78',   # ftplib
            'B322': 'CWE-331',  # input
            'B323': 'CWE-327',  # unverified_context
            'B324': 'CWE-327',  # hashlib_new_insecure_functions
            'B325': 'CWE-377',  # tempfile_mktemp
            'B401': 'CWE-327',  # import_telnet
            'B402': 'CWE-327',  # import_ftp
            'B403': 'CWE-327',  # import_pickle
            'B404': 'CWE-78',   # import_subprocess
            'B405': 'CWE-79',   # import_xml_etree
            'B406': 'CWE-79',   # import_xml_sax
            'B407': 'CWE-79',   # import_xml_expat
            'B408': 'CWE-79',   # import_xml_minidom
            'B409': 'CWE-79',   # import_xml_pulldom
            'B410': 'CWE-79',   # import_lxml
            'B411': 'CWE-330',  # import_random
            'B501': 'CWE-295',  # request_with_no_cert_validation
            'B502': 'CWE-295',  # ssl_with_bad_version
            'B503': 'CWE-295',  # ssl_with_bad_defaults
            'B504': 'CWE-295',  # ssl_with_no_version
            'B505': 'CWE-327',  # weak_cryptographic_key
            'B506': 'CWE-798',  # yaml_load
            'B507': 'CWE-78',   # ssh_no_host_key_verification
            'B601': 'CWE-78',   # paramiko_calls
            'B602': 'CWE-78',   # subprocess_popen_with_shell_equals_true
            'B603': 'CWE-78',   # subprocess_without_shell_equals_true
            'B604': 'CWE-78',   # any_other_function_with_shell_equals_true
            'B605': 'CWE-78',   # start_process_with_a_shell
            'B606': 'CWE-78',   # start_process_with_no_shell
            'B607': 'CWE-78',   # start_process_with_partial_path
            'B608': 'CWE-89',   # hardcoded_sql_expressions
            'B609': 'CWE-78',   # linux_commands_wildcard_injection
            'B610': 'CWE-22',   # django_extra_used
            'B611': 'CWE-22',   # django_rawsql_used
        }
        
        return cwe_mapping.get(test_id, '')
    
def _get_test_description(self, test_id: str) -> str:
        """Get description for bandit test ID."""
        descriptions = {
            'B101': 'Use of assert detected',
            'B102': 'Use of exec detected',
            'B103': 'Setting a bad file permission',
            'B104': 'Possible binding to all interfaces',
            'B105': 'Possible hardcoded password',
            'B106': 'Possible hardcoded password in function argument',
            'B107': 'Possible hardcoded password in default argument',
            'B108': 'Probable insecure usage of temp file/directory',
            'B110': 'Try, Except, Pass detected',
            'B112': 'Try, Except, Continue detected',
            'B201': 'Flask app appears to be run with debug=True',
            'B301': 'Pickle library appears to be in use',
            'B302': 'Pickle library appears to be in use',
            'B303': 'Pickle library appears to be in use',
            'B304': 'Pickle library appears to be in use',
            'B305': 'Pickle library appears to be in use',
            'B306': 'Pickle library appears to be in use',
            'B307': 'Use of possibly insecure function - consider using safer ast.literal_eval',
            'B308': 'Use of mark_safe() may expose cross-site scripting vulnerabilities',
            'B309': 'Use of HTTPSConnection does not verify HTTPS certificates',
            'B310': 'Audit url open for permitted schemes',
            'B311': 'Standard pseudo-random generators are not suitable for security/cryptographic purposes',
            'B312': 'Telnet-related functions are being called',
            'B601': 'Shell injection possible with Paramiko calls',
            'B602': 'Subprocess call with shell=True identified',
            'B603': 'Subprocess call without shell equals true identified',
            'B604': 'Function call with shell=True parameter identified',
            'B605': 'Starting a process with a shell, possible injection',
            'B606': 'Starting a process without a shell',
            'B607': 'Starting a process with a partial executable path',
            'B608': 'Possible SQL injection vector through string-based query construction',
            'B609': 'Possible wildcard injection via shell command execution',
            'B610': 'Potential SQL injection on extra function',
            'B611': 'Potential SQL injection on RawSQL function',
        }
        
        return descriptions.get(test_id, f'Security issue: {test_id}')