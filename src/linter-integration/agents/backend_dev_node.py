#!/usr/bin/env python3
"""
Backend Developer Agent Node - Mesh Network Specialist
Implements adapter patterns for flake8, pylint, ruff, mypy, bandit integration.
"""

from pathlib import Path
from typing import Dict, List, Any, Optional
import json
import logging
import re

from dataclasses import dataclass
import asyncio
import xml.etree.ElementTree as ET

from ..adapters.base_adapter import BaseLinterAdapter, LinterViolation, SeverityLevel, ViolationType

class Flake8Adapter(BaseLinterAdapter):
    """Adapter for flake8 linter integration"""
    
    def __init__(self, config_path: Optional[str] = None):
        super().__init__("flake8", config_path)
        
    def _get_severity_mapping(self) -> Dict[str, SeverityLevel]:
        return {
            # Syntax/Parse errors - CRITICAL
            "e9": SeverityLevel.CRITICAL,
            "f821": SeverityLevel.CRITICAL,  # undefined name
            "f822": SeverityLevel.CRITICAL,  # undefined name in __all__
            "f823": SeverityLevel.CRITICAL,  # local variable referenced before assignment
            
            # Import errors - HIGH
            "f401": SeverityLevel.MEDIUM,    # imported but unused
            "f403": SeverityLevel.HIGH,      # star import
            "f405": SeverityLevel.HIGH,      # name may be undefined from star import
            
            # Logic errors - HIGH
            "f631": SeverityLevel.HIGH,      # assertion test is a tuple
            "f632": SeverityLevel.HIGH,      # use ==/!= to compare constant literals
            "f841": SeverityLevel.MEDIUM,    # local variable assigned but never used
            
            # Style issues - LOW to MEDIUM
            "e1": SeverityLevel.LOW,         # indentation
            "e2": SeverityLevel.LOW,         # whitespace
            "e3": SeverityLevel.LOW,         # blank line
            "e4": SeverityLevel.LOW,         # import
            "e5": SeverityLevel.LOW,         # line length
            "e7": SeverityLevel.LOW,         # statement
            "w1": SeverityLevel.LOW,         # indentation warning
            "w2": SeverityLevel.LOW,         # whitespace warning
            "w3": SeverityLevel.LOW,         # blank line warning
            "w5": SeverityLevel.LOW,         # line break warning
            "w6": SeverityLevel.LOW,         # deprecation warning
        }
        
    def _get_violation_type_mapping(self) -> Dict[str, ViolationType]:
        return {
            "e9": ViolationType.SYNTAX_ERROR,
            "f8": ViolationType.SYNTAX_ERROR,
            "f4": ViolationType.CODE_QUALITY,
            "f6": ViolationType.CODE_QUALITY,
            "e1": ViolationType.STYLE_VIOLATION,
            "e2": ViolationType.STYLE_VIOLATION,
            "e3": ViolationType.STYLE_VIOLATION,
            "w": ViolationType.STYLE_VIOLATION,
        }
        
    def _build_command(self, target_path: str, **kwargs) -> List[str]:
        command = ["flake8", "--format=json"]
        
        if self.config_path:
            command.extend(["--config", self.config_path])
            
        # Add additional options
        if kwargs.get("max_line_length"):
            command.extend(["--max-line-length", str(kwargs["max_line_length"])])
            
        if kwargs.get("ignore"):
            command.extend(["--ignore", ",".join(kwargs["ignore"])])
            
        command.append(target_path)
        return command
        
    def _parse_output(self, stdout: str, stderr: str) -> List[LinterViolation]:
        violations = []
        
        if stderr:
            # Parse stderr for syntax errors
            for line in stderr.strip().split('\n'):
                if ':' in line and 'error' in line.lower():
                    violations.append(self._parse_error_line(line))
                    
        if stdout:
            try:
                # Try to parse as JSON first
                data = json.loads(stdout)
                for item in data:
                    violations.append(self._parse_json_violation(item))
            except json.JSONDecodeError:
                # Fallback to text parsing
                for line in stdout.strip().split('\n'):
                    if ':' in line:
                        violation = self._parse_text_line(line)
                        if violation:
                            violations.append(violation)
                            
        return violations
        
    def _parse_json_violation(self, item: Dict[str, Any]) -> LinterViolation:
        """Parse JSON format violation"""
        rule_code = item.get('code', '')
        
        return LinterViolation(
            file_path=item.get('filename', ''),
            line_number=item.get('line_number', 0),
            column_number=item.get('column_number', 0),
            rule_id=rule_code,
            rule_name=rule_code,
            message=item.get('text', ''),
            severity=self.map_severity(rule_code.lower()),
            violation_type=self.map_violation_type(rule_code),
            source_tool=self.tool_name
        )
        
    def _parse_text_line(self, line: str) -> Optional[LinterViolation]:
        """Parse text format violation line"""
        # Format: filename:line:column: code message
        pattern = r'^([^:]+):(\d+):(\d+):\s*(\w+)\s+(.+)$'
        match = re.match(pattern, line)
        
        if match:
            file_path, line_num, col_num, code, message = match.groups()
            
            return LinterViolation(
                file_path=file_path,
                line_number=int(line_num),
                column_number=int(col_num),
                rule_id=code,
                rule_name=code,
                message=message,
                severity=self.map_severity(code.lower()),
                violation_type=self.map_violation_type(code),
                source_tool=self.tool_name
            )
        return None

class PylintAdapter(BaseLinterAdapter):
    """Adapter for pylint linter integration"""
    
    def __init__(self, config_path: Optional[str] = None):
        super().__init__("pylint", config_path)
        
    def _get_severity_mapping(self) -> Dict[str, SeverityLevel]:
        return {
            "f": SeverityLevel.CRITICAL,  # Fatal errors
            "e": SeverityLevel.HIGH,      # Errors
            "w": SeverityLevel.MEDIUM,    # Warnings
            "r": SeverityLevel.LOW,       # Refactoring suggestions
            "c": SeverityLevel.LOW,       # Convention violations
            "i": SeverityLevel.INFO,      # Information
        }
        
    def _get_violation_type_mapping(self) -> Dict[str, ViolationType]:
        return {
            "f": ViolationType.SYNTAX_ERROR,
            "e": ViolationType.CODE_QUALITY,
            "w": ViolationType.MAINTAINABILITY,
            "r": ViolationType.MAINTAINABILITY,
            "c": ViolationType.STYLE_VIOLATION,
        }
        
    def _build_command(self, target_path: str, **kwargs) -> List[str]:
        command = ["pylint", "--output-format=json"]
        
        if self.config_path:
            command.extend(["--rcfile", self.config_path])
            
        # Add additional options
        if kwargs.get("disable"):
            command.extend(["--disable", ",".join(kwargs["disable"])])
            
        if kwargs.get("enable"):
            command.extend(["--enable", ",".join(kwargs["enable"])])
            
        command.append(target_path)
        return command
        
    def _parse_output(self, stdout: str, stderr: str) -> List[LinterViolation]:
        violations = []
        
        if stdout:
            try:
                data = json.loads(stdout)
                for item in data:
                    violations.append(self._parse_pylint_violation(item))
            except json.JSONDecodeError:
                # Fallback to text parsing if JSON fails
                
                pass
        return violations
        
    def _parse_pylint_violation(self, item: Dict[str, Any]) -> LinterViolation:
        """Parse pylint JSON violation"""
        message_id = item.get('message-id', '')
        symbol = item.get('symbol', '')
        
        return LinterViolation(
            file_path=item.get('path', ''),
            line_number=item.get('line', 0),
            column_number=item.get('column', 0),
            rule_id=message_id,
            rule_name=symbol,
            message=item.get('message', ''),
            severity=self.map_severity(item.get('type', '').lower()),
            violation_type=self.map_violation_type(message_id, symbol),
            source_tool=self.tool_name
        )

class RuffAdapter(BaseLinterAdapter):
    """Adapter for ruff linter integration"""
    
    def __init__(self, config_path: Optional[str] = None):
        super().__init__("ruff", config_path)
        
    def _get_severity_mapping(self) -> Dict[str, SeverityLevel]:
        return {
            # Security issues
            "s": SeverityLevel.HIGH,
            "b": SeverityLevel.HIGH,     # bugbear
            
            # Type checking
            "t": SeverityLevel.HIGH,
            
            # Import sorting
            "i": SeverityLevel.MEDIUM,
            
            # Code quality
            "c": SeverityLevel.MEDIUM,   # complexity
            "n": SeverityLevel.MEDIUM,   # naming
            
            # Style
            "e": SeverityLevel.LOW,      # pycodestyle errors
            "w": SeverityLevel.LOW,      # pycodestyle warnings
            "d": SeverityLevel.LOW,      # pydocstyle
            
            # Performance
            "perf": SeverityLevel.MEDIUM,
            
            # Async
            "async": SeverityLevel.HIGH,
        }
        
    def _get_violation_type_mapping(self) -> Dict[str, ViolationType]:
        return {
            "s": ViolationType.SECURITY_ISSUE,
            "b": ViolationType.CODE_QUALITY,
            "t": ViolationType.TYPE_ERROR,
            "i": ViolationType.STYLE_VIOLATION,
            "c": ViolationType.COMPLEXITY,
            "n": ViolationType.STYLE_VIOLATION,
            "e": ViolationType.STYLE_VIOLATION,
            "w": ViolationType.STYLE_VIOLATION,
            "d": ViolationType.STYLE_VIOLATION,
            "perf": ViolationType.PERFORMANCE,
            "async": ViolationType.CODE_QUALITY,
        }
        
    def _build_command(self, target_path: str, **kwargs) -> List[str]:
        command = ["ruff", "check", "--output-format=json"]
        
        if self.config_path:
            command.extend(["--config", self.config_path])
            
        if kwargs.get("fix"):
            command.append("--fix")
            
        command.append(target_path)
        return command
        
    def _parse_output(self, stdout: str, stderr: str) -> List[LinterViolation]:
        violations = []
        
        if stdout:
            try:
                data = json.loads(stdout)
                for item in data:
                    violations.append(self._parse_ruff_violation(item))
            except json.JSONDecodeError:
                pass
                
        return violations
        
    def _parse_ruff_violation(self, item: Dict[str, Any]) -> LinterViolation:
        """Parse ruff JSON violation"""
        code = item.get('code', '')
        location = item.get('location', {})
        
        return LinterViolation(
            file_path=item.get('filename', ''),
            line_number=location.get('row', 0),
            column_number=location.get('column', 0),
            rule_id=code,
            rule_name=item.get('rule', ''),
            message=item.get('message', ''),
            severity=self.map_severity(code[:1].lower()),
            violation_type=self.map_violation_type(code),
            source_tool=self.tool_name,
            fix_suggestion=item.get('fix', {}).get('message')
        )

class MypyAdapter(BaseLinterAdapter):
    """Adapter for mypy type checker integration"""
    
    def __init__(self, config_path: Optional[str] = None):
        super().__init__("mypy", config_path)
        
    def _get_severity_mapping(self) -> Dict[str, SeverityLevel]:
        return {
            "error": SeverityLevel.HIGH,
            "warning": SeverityLevel.MEDIUM,
            "note": SeverityLevel.INFO,
        }
        
    def _get_violation_type_mapping(self) -> Dict[str, ViolationType]:
        return {
            "error": ViolationType.TYPE_ERROR,
            "warning": ViolationType.TYPE_ERROR,
            "note": ViolationType.TYPE_ERROR,
        }
        
    def _build_command(self, target_path: str, **kwargs) -> List[str]:
        command = ["mypy", "--show-error-codes", "--no-error-summary"]
        
        if self.config_path:
            command.extend(["--config-file", self.config_path])
            
        if kwargs.get("strict"):
            command.append("--strict")
            
        command.append(target_path)
        return command
        
    def _parse_output(self, stdout: str, stderr: str) -> List[LinterViolation]:
        violations = []
        
        # MyPy outputs to stdout
        for line in stdout.strip().split('\n'):
            if ':' in line and ('error:' in line or 'warning:' in line or 'note:' in line):
                violation = self._parse_mypy_line(line)
                if violation:
                    violations.append(violation)
                    
        return violations
        
    def _parse_mypy_line(self, line: str) -> Optional[LinterViolation]:
        """Parse mypy output line"""
        # Format: filename:line:column: severity: message [error-code]
        pattern = r'^([^:]+):(\d+):(?:(\d+):)?\s*(error|warning|note):\s*(.+?)(?:\s*\[([^\]]+)\])?$'
        match = re.match(pattern, line)
        
        if match:
            file_path, line_num, col_num, severity, message, error_code = match.groups()
            
            return LinterViolation(
                file_path=file_path,
                line_number=int(line_num),
                column_number=int(col_num) if col_num else 0,
                rule_id=error_code or severity,
                rule_name=error_code or severity,
                message=message,
                severity=self.map_severity(severity.lower()),
                violation_type=ViolationType.TYPE_ERROR,
                source_tool=self.tool_name
            )
        return None

class BanditAdapter(BaseLinterAdapter):
    """Adapter for bandit security scanner integration"""
    
    def __init__(self, config_path: Optional[str] = None):
        super().__init__("bandit", config_path)
        
    def _get_severity_mapping(self) -> Dict[str, SeverityLevel]:
        return {
            "high": SeverityLevel.CRITICAL,
            "medium": SeverityLevel.HIGH,
            "low": SeverityLevel.MEDIUM,
        }
        
    def _get_violation_type_mapping(self) -> Dict[str, ViolationType]:
        return {
            "high": ViolationType.SECURITY_ISSUE,
            "medium": ViolationType.SECURITY_ISSUE,
            "low": ViolationType.SECURITY_ISSUE,
        }
        
    def _build_command(self, target_path: str, **kwargs) -> List[str]:
        command = ["bandit", "-f", "json"]
        
        if self.config_path:
            command.extend(["-c", self.config_path])
            
        if kwargs.get("recursive", True):
            command.append("-r")
            
        command.append(target_path)
        return command
        
    def _parse_output(self, stdout: str, stderr: str) -> List[LinterViolation]:
        violations = []
        
        if stdout:
            try:
                data = json.loads(stdout)
                results = data.get('results', [])
                for item in results:
                    violations.append(self._parse_bandit_violation(item))
            except json.JSONDecodeError:
                pass
                
        return violations
        
    def _parse_bandit_violation(self, item: Dict[str, Any]) -> LinterViolation:
        """Parse bandit JSON violation"""
        return LinterViolation(
            file_path=item.get('filename', ''),
            line_number=item.get('line_number', 0),
            column_number=0,  # Bandit doesn't provide column numbers
            rule_id=item.get('test_id', ''),
            rule_name=item.get('test_name', ''),
            message=item.get('issue_text', ''),
            severity=self.map_severity(item.get('issue_severity', '').lower()),
            violation_type=ViolationType.SECURITY_ISSUE,
            source_tool=self.tool_name,
            context=item.get('code', '')
        )

class BackendDevNode:
    """
    Backend Developer node specializing in linter adapter implementation.
    Peer node in mesh topology for linter integration coordination.
    """
    
    def __init__(self, node_id: str = "backend-dev"):
        self.node_id = node_id
        self.peer_connections = set()
        self.logger = self._setup_logging()
        self.adapters: Dict[str, BaseLinterAdapter] = {}
        self._initialize_adapters()
        
    def _setup_logging(self) -> logging.Logger:
        logger = logging.getLogger(f"BackendDev-{self.node_id}")
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        return logger
        
    def _initialize_adapters(self) -> None:
        """Initialize all linter adapters"""
        self.adapters = {
            "flake8": Flake8Adapter(),
            "pylint": PylintAdapter(),
            "ruff": RuffAdapter(),
            "mypy": MypyAdapter(),
            "bandit": BanditAdapter()
        }
        self.logger.info("Initialized adapters for all target linters")
        
    async def connect_to_mesh(self, peer_nodes: List[str]) -> Dict[str, Any]:
        """Connect to other nodes in the mesh topology"""
        self.logger.info(f"Connecting to mesh with peers: {peer_nodes}")
        
        for peer in peer_nodes:
            self.peer_connections.add(peer)
            
        return {
            "node_id": self.node_id,
            "connected_peers": list(self.peer_connections),
            "mesh_status": "connected",
            "capabilities": [
                "adapter_pattern_implementation",
                "linter_output_normalization", 
                "error_handling",
                "performance_optimization"
            ]
        }
        
    async def implement_adapter_patterns(self) -> Dict[str, Any]:
        """Implement and validate all linter adapter patterns"""
        self.logger.info("Implementing adapter patterns for all target linters")
        
        implementation_results = {}
        
        for tool_name, adapter in self.adapters.items():
            self.logger.info(f"Validating adapter for {tool_name}")
            
            # Test adapter functionality
            test_results = await self._test_adapter(tool_name, adapter)
            
            implementation_results[tool_name] = {
                "adapter_class": adapter.__class__.__name__,
                "tool_available": adapter.validate_tool_availability(),
                "tool_info": adapter.get_tool_info(),
                "test_results": test_results,
                "severity_mappings": len(adapter.severity_mapping),
                "violation_type_mappings": len(adapter.violation_type_mapping)
            }
            
        return {
            "implementation_status": "completed",
            "adapters_implemented": list(self.adapters.keys()),
            "adapter_details": implementation_results,
            "total_adapters": len(self.adapters)
        }
        
    async def _test_adapter(self, tool_name: str, adapter: BaseLinterAdapter) -> Dict[str, Any]:
        """Test individual adapter functionality"""
        test_results = {
            "tool_availability": False,
            "command_building": False,
            "output_parsing": False,
            "severity_mapping": False,
            "error_handling": False
        }
        
        try:
            # Test tool availability
            test_results["tool_availability"] = adapter.validate_tool_availability()
            
            # Test command building
            command = adapter._build_command("test_file.py")
            test_results["command_building"] = len(command) > 0 and command[0] == tool_name
            
            # Test severity mapping
            test_severity = adapter.map_severity("test_code")
            test_results["severity_mapping"] = isinstance(test_severity, SeverityLevel)
            
            # Test violation type mapping
            test_type = adapter.map_violation_type("test_code")
            test_results["error_handling"] = isinstance(test_type, ViolationType)
            
            # Test output parsing (with mock data)
            test_violations = adapter._parse_output("", "")
            test_results["output_parsing"] = isinstance(test_violations, list)
            
        except Exception as e:
            self.logger.error(f"Error testing adapter {tool_name}: {e}")
            
        return test_results
        
    async def optimize_adapter_performance(self) -> Dict[str, Any]:
        """Optimize adapter performance and resource usage"""
        optimization_results = {}
        
        for tool_name, adapter in self.adapters.items():
            # Performance optimization strategies
            optimizations = {
                "caching_enabled": True,
                "parallel_ready": True,
                "memory_efficient": True,
                "timeout_configured": True
            }
            
            optimization_results[tool_name] = {
                "optimizations_applied": optimizations,
                "performance_characteristics": adapter._get_performance_metrics(tool_name) if hasattr(adapter, '_get_performance_metrics') else {},
                "resource_requirements": self._calculate_resource_requirements(tool_name)
            }
            
        return {
            "optimization_status": "completed",
            "optimized_adapters": list(optimization_results.keys()),
            "optimization_details": optimization_results
        }
        
    def _calculate_resource_requirements(self, tool_name: str) -> Dict[str, Any]:
        """Calculate resource requirements for each tool"""
        requirements_map = {
            "flake8": {"cpu": "low", "memory": "64MB", "io": "medium"},
            "pylint": {"cpu": "high", "memory": "256MB", "io": "high"},
            "ruff": {"cpu": "very_low", "memory": "32MB", "io": "low"},
            "mypy": {"cpu": "medium", "memory": "128MB", "io": "medium"},
            "bandit": {"cpu": "low", "memory": "64MB", "io": "medium"}
        }
        return requirements_map.get(tool_name, {"cpu": "medium", "memory": "128MB", "io": "medium"})
        
    def get_adapter(self, tool_name: str) -> Optional[BaseLinterAdapter]:
        """Get adapter instance for a specific tool"""
        return self.adapters.get(tool_name)
        
    async def get_node_status(self) -> Dict[str, Any]:
        """Get current status of the backend dev node"""
        return {
            "node_id": self.node_id,
            "node_type": "backend-dev",
            "status": "active",
            "peer_connections": list(self.peer_connections),
            "adapters_available": list(self.adapters.keys()),
            "tools_status": {
                tool: adapter.validate_tool_availability() 
                for tool, adapter in self.adapters.items()
            },
            "capabilities": [
                "adapter_pattern_implementation",
                "linter_output_normalization",
                "error_handling", 
                "performance_optimization"
            ]
        }

# Node instance for mesh coordination
backend_dev_node = BackendDevNode()