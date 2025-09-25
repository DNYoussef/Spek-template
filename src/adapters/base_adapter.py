"""Base adapter implementation with common functionality."""

from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import json
import subprocess
import time

from lib.shared.utilities import get_logger
import asyncio

class BaseLinterAdapter(LinterAdapter):
    """Base implementation for common linter adapter functionality."""
    
    def __init__(self, config: LinterConfig):
        super().__init__(config)
        self._version_cache: Optional[str] = None
    
    async def run_linter(self, target_paths: List[str]) -> LinterResult:
        """Execute the linter with proper error handling and timing."""
        start_time = time.time()
        
        try:
            # Build command
            cmd = self.get_command_args(target_paths)
            
            # Execute linter
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=Path.cwd()
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=self.config.timeout
                )
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
                raise RuntimeError(f"Linter {self.tool_name} timed out after {self.config.timeout}s")
            
            execution_time = time.time() - start_time
            
            # Decode output
            stdout_str = stdout.decode('utf-8', errors='replace')
            stderr_str = stderr.decode('utf-8', errors='replace')
            
            # Parse violations
            violations = self.parse_output(stdout_str, stderr_str)
            
            # Build result
            result = LinterResult(
                tool=self.tool_name,
                exit_code=process.returncode or 0,
                violations=violations,
                execution_time=execution_time,
                files_analyzed=target_paths,
                config_used=self.config.config_file,
                version=await self.get_version(),
                error_output=stderr_str if stderr_str.strip() else None
            )
            
            logger.info(
                f"{self.tool_name} completed: {len(violations)} violations "
                f"in {execution_time:.2f}s"
            )
            
            return result
            
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Error running {self.tool_name}: {e}")
            
            return LinterResult(
                tool=self.tool_name,
                exit_code=-1,
                violations=[],
                execution_time=execution_time,
                files_analyzed=target_paths,
                error_output=str(e)
            )
    
    async def get_version(self) -> Optional[str]:
        """Get the version of the linter tool."""
        if self._version_cache:
            return self._version_cache
        
        try:
            version_cmd = [self.config.executable_path or self.tool_name, "--version"]
            process = await asyncio.create_subprocess_exec(
                *version_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await process.communicate()
            self._version_cache = stdout.decode('utf-8').strip()
            return self._version_cache
        except Exception:
            return None
    
    def create_violation(
        self,
        rule_id: str,
        message: str,
        file_path: str,
        line: int,
        column: Optional[int] = None,
        severity_raw: str = "",
        category: str = "",
        **kwargs
    ) -> LinterViolation:
        """Helper to create standardized violation objects."""
        
        severity = self.normalize_severity(severity_raw, rule_id)
        violation_type = self.get_violation_type(rule_id, category)
        
        position = Position(
            line=line,
            column=column,
            end_line=kwargs.get('end_line'),
            end_column=kwargs.get('end_column')
        )
        
        return LinterViolation(
            tool=self.tool_name,
            rule_id=rule_id,
            message=message,
            severity=severity,
            violation_type=violation_type,
            file_path=file_path,
            position=position,
            rule_description=kwargs.get('rule_description'),
            fix_suggestion=kwargs.get('fix_suggestion'),
            confidence=kwargs.get('confidence'),
            category=category,
            cwe_id=kwargs.get('cwe_id'),
            raw_data=kwargs.get('raw_data', {})
        )
    
    def safe_json_parse(self, content: str) -> List[Dict[str, Any]]:
        """Safely parse JSON content with error handling."""
        try:
            data = json.loads(content)
            if isinstance(data, list):
                return data
            elif isinstance(data, dict):
                return [data]
            else:
                return []
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON from {self.tool_name}: {e}")
            return []
    
    def extract_file_paths(self, target_paths: List[str]) -> List[str]:
        """Extract all Python files from target paths."""
        files = []
        for path_str in target_paths:
            path = Path(path_str)
            if path.is_file() and path.suffix == '.py':
                files.append(str(path))
            elif path.is_dir():
                files.extend(str(p) for p in path.rglob('*.py'))
        return files
    
    def apply_severity_overrides(self, rule_id: str, default_severity: StandardSeverity) -> StandardSeverity:
        """Apply user-defined severity overrides."""
        return self.config.severity_overrides.get(rule_id, default_severity)
    
    def is_rule_enabled(self, rule_id: str) -> bool:
        """Check if a rule is enabled based on configuration."""
        if self.config.disabled_rules and rule_id in self.config.disabled_rules:
            return False
        if self.config.enabled_rules:
            return rule_id in self.config.enabled_rules
        return True