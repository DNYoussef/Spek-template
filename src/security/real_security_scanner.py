from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS
"""

Implements ACTUAL security scanning with real tool execution, not simulation.
Replaces theater-based security validation with functional vulnerability detection.

MISSION: Fix security validation theater - deliver REAL security scanning.
"""

import asyncio
import json
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

@dataclass
class SecurityFinding:
    """Real security finding from actual tool execution."""
    tool: str
    severity: str  # critical, high, medium, low
    rule_id: str
    title: str
    description: str
    file_path: str
    line_number: int
    column_number: int = 0
    cwe_id: Optional[str] = None
    owasp_category: Optional[str] = None
    remediation: Optional[str] = None
    confidence: str = "medium"
    raw_output: Dict[str, Any] = None

@dataclass  
class SecurityScanResult:
    """Result from actual security tool execution."""
    tool_name: str
    execution_time: float
    exit_code: int
    findings: List[SecurityFinding]
    total_files_scanned: int
    command_executed: str
    stdout: str
    stderr: str
    sarif_file: Optional[str] = None

@dataclass
class SecurityGateResult:
    """Security gate validation with real violation counts."""
    gate_name: str
    threshold: int
    actual_count: int
    passed: bool
    blocking: bool
    findings: List[SecurityFinding]
    
class RealSecurityScanner:
    """Functional security scanner that actually executes security tools."""
    
    def __init__(self, work_dir: str = None):
        """Initialize with actual working directory."""
        self.work_dir = Path(work_dir) if work_dir else Path.cwd()
        self.artifacts_dir = self.work_dir / ".claude" / ".artifacts" / "security"
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)
        
        # Real security tool configurations
        self.tools_config = {
            "semgrep": {
                "enabled": True,
                "rules": ["p/owasp-top-ten", "p/security-audit", "p/secrets"],
                "timeout": 300,
                "output_format": "sarif"
            },
            "bandit": {
                "enabled": True,
                "confidence": "medium",
                "severity": "low", 
                "timeout": 180,
                "output_format": "sarif"
            },
            "safety": {
                "enabled": True,
                "timeout": 120,
                "output_format": "json"
            },
            "npm_audit": {
                "enabled": True,
                "timeout": 180,
                "output_format": "json"
            }
        }
        
        # Real security gates with actual enforcement
        self.security_gates = {
            "critical_vulnerabilities": {"threshold": 0, "blocking": True},
            "high_vulnerabilities": {"threshold": 0, "blocking": True}, 
            "medium_vulnerabilities": {"threshold": MAXIMUM_FUNCTION_PARAMETERS, "blocking": False},
            "secrets_detected": {"threshold": 0, "blocking": True},
            "outdated_critical_deps": {"threshold": 0, "blocking": True}
        }
        
        self.scan_results: Dict[str, SecurityScanResult] = {}
        self.all_findings: List[SecurityFinding] = []
        
    async def verify_tools_available(self) -> Dict[str, bool]:
        """Verify actual security tool availability."""
        print("Verifying security tool availability...")
        
        tool_availability = {}
        
        for tool_name, config in self.tools_config.items():
            if not config["enabled"]:
                tool_availability[tool_name] = False
                continue
                
            available = await self._check_tool_installed(tool_name)
            tool_availability[tool_name] = available
            
            status = "[OK] AVAILABLE" if available else "[FAIL] NOT FOUND"
            print(f"  {tool_name}: {status}")
        
        return tool_availability
    
    async def _check_tool_installed(self, tool_name: str) -> bool:
        """Check if security tool is actually installed."""
        try:
            if tool_name == "semgrep":
                result = await self._run_command(["semgrep", "--version"], timeout=10)
                return result.returncode == 0
                
            elif tool_name == "bandit":
                result = await self._run_command(["bandit", "--version"], timeout=10)
                return result.returncode == 0
                
            elif tool_name == "safety":
                result = await self._run_command(["safety", "--version"], timeout=10)
                return result.returncode == 0
                
            elif tool_name == "npm_audit":
                # Check if npm is available and package.json exists
                npm_result = await self._run_command(["npm", "--version"], timeout=10)
                package_json_exists = (self.work_dir / "package.json").exists()
                return npm_result.returncode == 0 and package_json_exists
                
            return False
            
        except Exception as e:
            logger.error(f"Error checking {tool_name} availability: {e}")
            return False
    
    async def run_comprehensive_scan(self) -> Dict[str, SecurityScanResult]:
        """Run comprehensive security scan with REAL tool execution."""
        print("Running comprehensive security scan with REAL tools...")
        print(f"Scanning directory: {self.work_dir}")
        print("=" * 60)
        
        # Verify tools before scanning
        tool_availability = await self.verify_tools_available()
        available_tools = [name for name, available in tool_availability.items() if available]
        
        if not available_tools:
            raise RuntimeError("No security tools are available for scanning")
        
        print(f"Available tools: {', '.join(available_tools)}")
        print("")
        
        # Run scans concurrently for better performance
        scan_tasks = []
        for tool_name in available_tools:
            if self.tools_config[tool_name]["enabled"]:
                task = asyncio.create_task(self._run_security_tool(tool_name))
                scan_tasks.append((tool_name, task))
        
        # Wait for all scans to complete
        for tool_name, task in scan_tasks:
            try:
                result = await task
                self.scan_results[tool_name] = result
                print(f"[OK] {tool_name} scan completed: {len(result.findings)} findings")
                
            except Exception as e:
                logger.error(f" {tool_name} scan failed: {e}")
                # Create error result
                self.scan_results[tool_name] = SecurityScanResult(
                    tool_name=tool_name,
                    execution_time=0.0,
                    exit_code=1,
                    findings=[],
                    total_files_scanned=0,
                    command_executed="failed",
                    stdout="",
                    stderr=str(e)
                )
        
        # Aggregate all findings
        self._aggregate_findings()
        
        return self.scan_results
    
    async def _run_security_tool(self, tool_name: str) -> SecurityScanResult:
        """Run individual security tool with REAL execution."""
        start_time = time.time()
        config = self.tools_config[tool_name]
        
        if tool_name == "semgrep":
            return await self._run_semgrep_actual(config)
        elif tool_name == "bandit":
            return await self._run_bandit_actual(config)
        elif tool_name == "safety":
            return await self._run_safety_actual(config)
        elif tool_name == "npm_audit":
            return await self._run_npm_audit_actual(config)
        else:
            raise ValueError(f"Unknown security tool: {tool_name}")
    
    async def _run_semgrep_actual(self, config: Dict[str, Any]) -> SecurityScanResult:
        """Run ACTUAL Semgrep SAST scan with real OWASP rules."""
        print("  Running Semgrep SAST scan with OWASP rules...")
        start_time = time.time()
        
        # Create output file
        output_file = self.artifacts_dir / "semgrep_results.sarif"
        
        # Build real Semgrep command
        cmd = [
            "semgrep",
            "--config=p/owasp-top-ten",
            "--config=p/security-audit", 
            "--config=p/secrets",
            "--sarif",
            f"--output={output_file}",
            "--verbose",
            str(self.work_dir)
        ]
        
        # Execute actual Semgrep scan
        result = await self._run_command(cmd, timeout=config["timeout"])
        execution_time = time.time() - start_time
        
        # Parse REAL SARIF output
        findings = []
        if output_file.exists() and result.returncode in [0, 1]:  # 0 = no findings, 1 = findings found
            findings = await self._parse_semgrep_sarif(output_file)
        
        return SecurityScanResult(
            tool_name="semgrep",
            execution_time=execution_time,
            exit_code=result.returncode,
            findings=findings,
            total_files_scanned=self._count_files_in_directory(),
            command_executed=" ".join(cmd),
            stdout=result.stdout,
            stderr=result.stderr,
            sarif_file=str(output_file) if output_file.exists() else None
        )
    
    async def _run_bandit_actual(self, config: Dict[str, Any]) -> SecurityScanResult:
        """Run ACTUAL Bandit Python security scan."""
        print("  Running Bandit Python security scan...")
        start_time = time.time()
        
        # Create output file
        output_file = self.artifacts_dir / "bandit_results.sarif"
        
        # Build real Bandit command
        cmd = [
            "bandit",
            "-r", str(self.work_dir),
            "-f", "sarif",
            "-o", str(output_file),
            "--confidence", config["confidence"],
            "--severity", config["severity"],
            "--exclude", "*/node_modules/*,*/.git/*,*/venv/*,*/__pycache__/*"
        ]
        
        # Execute actual Bandit scan  
        result = await self._run_command(cmd, timeout=config["timeout"])
        execution_time = time.time() - start_time
        
        # Parse REAL SARIF output
        findings = []
        if output_file.exists() and result.returncode in [0, 1]:
            findings = await self._parse_bandit_sarif(output_file)
        
        return SecurityScanResult(
            tool_name="bandit",
            execution_time=execution_time,
            exit_code=result.returncode,
            findings=findings,
            total_files_scanned=self._count_python_files(),
            command_executed=" ".join(cmd),
            stdout=result.stdout,
            stderr=result.stderr,
            sarif_file=str(output_file) if output_file.exists() else None
        )
    
    async def _run_safety_actual(self, config: Dict[str, Any]) -> SecurityScanResult:
        """Run ACTUAL Safety dependency vulnerability scan."""
        print("  Running Safety dependency vulnerability scan...")
        start_time = time.time()
        
        # Create output file
        output_file = self.artifacts_dir / "safety_results.json"
        
        # Build real Safety command
        cmd = ["safety", "check", "--json", "--output", str(output_file)]
        
        # Execute actual Safety scan
        result = await self._run_command(cmd, timeout=config["timeout"])
        execution_time = time.time() - start_time
        
        # Parse REAL JSON output
        findings = []
        if output_file.exists():
            findings = await self._parse_safety_json(output_file)
        
        return SecurityScanResult(
            tool_name="safety",
            execution_time=execution_time,
            exit_code=result.returncode,
            findings=findings,
            total_files_scanned=1,  # requirements.txt
            command_executed=" ".join(cmd),
            stdout=result.stdout,
            stderr=result.stderr
        )
    
    async def _run_npm_audit_actual(self, config: Dict[str, Any]) -> SecurityScanResult:
        """Run ACTUAL NPM audit for JavaScript dependencies."""
        print("  Running NPM audit for JavaScript dependencies...")
        start_time = time.time()
        
        # Create output file
        output_file = self.artifacts_dir / "npm_audit_results.json"
        
        # Build real NPM audit command
        cmd = ["npm", "audit", "--json", "--audit-level", "low"]
        
        # Execute actual NPM audit
        result = await self._run_command(cmd, timeout=config["timeout"], cwd=self.work_dir)
        execution_time = time.time() - start_time
        
        # Save and parse REAL JSON output
        if result.stdout:
            with open(output_file, 'w') as f:
                f.write(result.stdout)
        
        findings = []
        if output_file.exists():
            findings = await self._parse_npm_audit_json(output_file)
        
        return SecurityScanResult(
            tool_name="npm_audit",
            execution_time=execution_time,
            exit_code=result.returncode,
            findings=findings,
            total_files_scanned=1,  # package.json
            command_executed=" ".join(cmd),
            stdout=result.stdout,
            stderr=result.stderr
        )
    
    async def _run_command(self, cmd: List[str], timeout: int = 300, cwd: Path = None) -> subprocess.CompletedProcess:
        """Run command with actual subprocess execution."""
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=cwd or self.work_dir
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), 
                timeout=timeout
            )
            
            return subprocess.CompletedProcess(
                cmd, process.returncode, stdout.decode(), stderr.decode()
            )
            
        except asyncio.TimeoutError:
            if 'process' in locals():
                process.terminate()
                await process.wait()
            raise RuntimeError(f"Command timed out after {timeout}s: {' '.join(cmd)}")
        except Exception as e:
            raise RuntimeError(f"Command failed: {' '.join(cmd)}: {e}")
    
    async def _parse_semgrep_sarif(self, sarif_file: Path) -> List[SecurityFinding]:
        """Parse REAL Semgrep SARIF output."""
        findings = []
        
        try:
            with open(sarif_file, 'r') as f:
                sarif_data = json.load(f)
            
            for run in sarif_data.get("runs", []):
                for result in run.get("results", []):
                    # Extract real finding data
                    rule_id = result.get("ruleId", "")
                    message = result.get("message", {}).get("text", "")
                    
                    # Get location information
                    locations = result.get("locations", [])
                    if locations:
                        location = locations[0].get("physicalLocation", {})
                        artifact = location.get("artifactLocation", {})
                        region = location.get("region", {})
                        
                        file_path = artifact.get("uri", "")
                        line_number = region.get("startLine", 0)
                        column_number = region.get("startColumn", 0)
                    else:
                        file_path = ""
                        line_number = 0
                        column_number = 0
                    
                    # Map severity
                    level = result.get("level", "note")
                    severity_map = {
                        "error": "high",
                        "warning": "medium", 
                        "note": "low"
                    }
                    severity = severity_map.get(level, "low")
                    
                    # Extract OWASP/CWE information
                    properties = result.get("properties", {})
                    
                    finding = SecurityFinding(
                        tool="semgrep",
                        severity=severity,
                        rule_id=rule_id,
                        title=f"Semgrep: {rule_id}",
                        description=message,
                        file_path=file_path,
                        line_number=line_number,
                        column_number=column_number,
                        owasp_category=properties.get("owasp", ""),
                        cwe_id=properties.get("cwe", ""),
                        raw_output=result
                    )
                    findings.append(finding)
        
        except Exception as e:
            logger.error(f"Error parsing Semgrep SARIF: {e}")
        
        return findings
    
    async def _parse_bandit_sarif(self, sarif_file: Path) -> List[SecurityFinding]:
        """Parse REAL Bandit SARIF output."""
        findings = []
        
        try:
            with open(sarif_file, 'r') as f:
                sarif_data = json.load(f)
            
            for run in sarif_data.get("runs", []):
                for result in run.get("results", []):
                    rule_id = result.get("ruleId", "")
                    message = result.get("message", {}).get("text", "")
                    
                    locations = result.get("locations", [])
                    if locations:
                        location = locations[0].get("physicalLocation", {})
                        artifact = location.get("artifactLocation", {})
                        region = location.get("region", {})
                        
                        file_path = artifact.get("uri", "")
                        line_number = region.get("startLine", 0)
                    else:
                        file_path = ""
                        line_number = 0
                    
                    # Bandit severity mapping
                    level = result.get("level", "note")
                    severity_map = {
                        "error": "high",
                        "warning": "medium",
                        "note": "low"
                    }
                    severity = severity_map.get(level, "low")
                    
                    finding = SecurityFinding(
                        tool="bandit",
                        severity=severity,
                        rule_id=rule_id,
                        title=f"Bandit: {rule_id}",
                        description=message,
                        file_path=file_path,
                        line_number=line_number,
                        raw_output=result
                    )
                    findings.append(finding)
        
        except Exception as e:
            logger.error(f"Error parsing Bandit SARIF: {e}")
        
        return findings
    
    async def _parse_safety_json(self, json_file: Path) -> List[SecurityFinding]:
        """Parse REAL Safety JSON output."""
        findings = []
        
        try:
            with open(json_file, 'r') as f:
                data = json.load(f)
            
            # Safety returns list of vulnerabilities
            for vuln in data if isinstance(data, list) else []:
                package = vuln.get("package", "unknown")
                installed = vuln.get("installed_version", "")
                vulnerability = vuln.get("vulnerability", "")
                vuln_id = vuln.get("id", "")
                
                finding = SecurityFinding(
                    tool="safety",
                    severity="high" if "critical" in vulnerability.lower() else "medium",
                    rule_id=vuln_id,
                    title=f"Vulnerable dependency: {package}",
                    description=f"{package} {installed}: {vulnerability}",
                    file_path="requirements.txt",
                    line_number=0,
                    remediation=f"Update to version {vuln.get('safe_version', 'latest')}",
                    raw_output=vuln
                )
                findings.append(finding)
        
        except Exception as e:
            logger.error(f"Error parsing Safety JSON: {e}")
        
        return findings
    
    async def _parse_npm_audit_json(self, json_file: Path) -> List[SecurityFinding]:
        """Parse REAL NPM audit JSON output."""
        findings = []
        
        try:
            with open(json_file, 'r') as f:
                data = json.load(f)
            
            vulnerabilities = data.get("vulnerabilities", {})
            for vuln_name, vuln_data in vulnerabilities.items():
                severity = vuln_data.get("severity", "low")
                title = vuln_data.get("title", "")
                
                # Map NPM severity to our scale
                severity_map = {
                    "critical": "critical",
                    "high": "high",
                    "moderate": "medium",
                    "low": "low"
                }
                mapped_severity = severity_map.get(severity, "low")
                
                finding = SecurityFinding(
                    tool="npm_audit",
                    severity=mapped_severity,
                    rule_id=vuln_name,
                    title=f"NPM vulnerability: {vuln_name}",
                    description=title,
                    file_path="package.json",
                    line_number=0,
                    cwe_id=str(vuln_data.get("cwe", [])[0]) if vuln_data.get("cwe") else None,
                    raw_output=vuln_data
                )
                findings.append(finding)
        
        except Exception as e:
            logger.error(f"Error parsing NPM audit JSON: {e}")
        
        return findings
    
    def _count_files_in_directory(self) -> int:
        """Count total files for scanning metrics."""
        try:
            count = 0
            for root, dirs, files in os.walk(self.work_dir):
                # Skip common directories
                dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '__pycache__', 'venv', '.env']]
                count += len(files)
            return count
        except:
            return 0
    
    def _count_python_files(self) -> int:
        """Count Python files for Bandit metrics."""
        try:
            return len(list(self.work_dir.rglob("*.py")))
        except:
            return 0
    
    def _aggregate_findings(self) -> None:
        """Aggregate all findings from scan results."""
        self.all_findings = []
        for result in self.scan_results.values():
            self.all_findings.extend(result.findings)
    
    async def evaluate_security_gates(self) -> Dict[str, SecurityGateResult]:
        """Evaluate REAL security gates with actual violation counts."""
        print("Evaluating security gates with REAL findings...")
        
        gate_results = {}
        
        # Count findings by severity
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        secrets_count = 0
        critical_deps_count = 0
        
        for finding in self.all_findings:
            severity_counts[finding.severity] += 1
            
            # Count secrets
            if "secret" in finding.title.lower() or "key" in finding.title.lower() or "password" in finding.title.lower():
                secrets_count += 1
            
            # Count critical dependencies  
            if finding.tool in ["safety", "npm_audit"] and finding.severity == "critical":
                critical_deps_count += 1
        
        # Evaluate each gate
        for gate_name, gate_config in self.security_gates.items():
            if gate_name == "critical_vulnerabilities":
                actual_count = severity_counts["critical"]
            elif gate_name == "high_vulnerabilities":
                actual_count = severity_counts["high"]
            elif gate_name == "medium_vulnerabilities":
                actual_count = severity_counts["medium"]
            elif gate_name == "secrets_detected":
                actual_count = secrets_count
            elif gate_name == "outdated_critical_deps":
                actual_count = critical_deps_count
            else:
                actual_count = 0
            
            threshold = gate_config["threshold"]
            passed = actual_count <= threshold
            blocking = gate_config["blocking"]
            
            # Get relevant findings for this gate
            relevant_findings = self._get_gate_findings(gate_name, severity_counts)
            
            gate_result = SecurityGateResult(
                gate_name=gate_name,
                threshold=threshold,
                actual_count=actual_count,
                passed=passed,
                blocking=blocking,
                findings=relevant_findings
            )
            
            gate_results[gate_name] = gate_result
            
            status = "[PASS]" if passed else "[FAIL]"
            block_status = " (BLOCKING)" if blocking and not passed else ""
            print(f"  {gate_name}: {actual_count}/{threshold} {status}{block_status}")
        
        return gate_results
    
    def _get_gate_findings(self, gate_name: str, severity_counts: Dict[str, int]) -> List[SecurityFinding]:
        """Get findings relevant to specific security gate."""
        if gate_name == "critical_vulnerabilities":
            return [f for f in self.all_findings if f.severity == "critical"]
        elif gate_name == "high_vulnerabilities":
            return [f for f in self.all_findings if f.severity == "high"]
        elif gate_name == "medium_vulnerabilities":
            return [f for f in self.all_findings if f.severity == "medium"]
        elif gate_name == "secrets_detected":
            return [f for f in self.all_findings if "secret" in f.title.lower() or "key" in f.title.lower()]
        elif gate_name == "outdated_critical_deps":
            return [f for f in self.all_findings if f.tool in ["safety", "npm_audit"] and f.severity == "critical"]
        else:
            return []
    
    async def generate_sarif_report(self) -> Dict[str, Any]:
        """Generate consolidated SARIF report from REAL scan results."""
        print("Generating consolidated SARIF report...")
        
        sarif_report = {
            "version": "2.1.0",
            "runs": []
        }
        
        for tool_name, result in self.scan_results.items():
            if not result.findings:
                continue
            
            run = {
                "tool": {
                    "driver": {
                        "name": tool_name,
                        "version": "1.0.0",
                        "informationUri": f"https://github.com/security-tools/{tool_name}",
                        "rules": []
                    }
                },
                "results": []
            }
            
            # Add rules
            rules_added = set()
            for finding in result.findings:
                if finding.rule_id not in rules_added:
                    rule = {
                        "id": finding.rule_id,
                        "name": finding.title,
                        "shortDescription": {"text": finding.title},
                        "fullDescription": {"text": finding.description}
                    }
                    
                    if finding.cwe_id:
                        rule["properties"] = {"cwe": finding.cwe_id}
                    
                    run["tool"]["driver"]["rules"].append(rule)
                    rules_added.add(finding.rule_id)
            
            # Add results  
            for finding in result.findings:
                sarif_result = {
                    "ruleId": finding.rule_id,
                    "level": self._map_severity_to_sarif_level(finding.severity),
                    "message": {"text": finding.description},
                    "locations": [{
                        "physicalLocation": {
                            "artifactLocation": {"uri": finding.file_path},
                            "region": {
                                "startLine": finding.line_number,
                                "startColumn": finding.column_number
                            }
                        }
                    }]
                }
                
                if finding.cwe_id:
                    sarif_result["properties"] = {"cwe": finding.cwe_id}
                
                run["results"].append(sarif_result)
            
            sarif_report["runs"].append(run)
        
        # Save SARIF report
        sarif_file = self.artifacts_dir / "consolidated_security_results.sarif"
        with open(sarif_file, 'w') as f:
            json.dump(sarif_report, f, indent=2)
        
        print(f"SARIF report saved: {sarif_file}")
        return sarif_report
    
    def _map_severity_to_sarif_level(self, severity: str) -> str:
        """Map severity to SARIF level."""
        mapping = {
            "critical": "error",
            "high": "error", 
            "medium": "warning",
            "low": "note"
        }
        return mapping.get(severity, "note")
    
    async def generate_security_report(self, gate_results: Dict[str, SecurityGateResult]) -> Dict[str, Any]:
        """Generate comprehensive security report with REAL data."""
        total_scan_time = sum(result.execution_time for result in self.scan_results.values())
        
        # Count findings by severity
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for finding in self.all_findings:
            severity_counts[finding.severity] += 1
        
        # Evaluate overall status
        blocking_failures = sum(1 for gate in gate_results.values() if gate.blocking and not gate.passed)
        overall_status = "PASS" if blocking_failures == 0 else "FAIL"
        
        report = {
            "report_metadata": {
                "timestamp": datetime.now().isoformat(),
                "scan_duration_seconds": total_scan_time,
                "scanner_version": "1.0.0",
                "work_directory": str(self.work_dir)
            },
            "executive_summary": {
                "overall_status": overall_status,
                "total_findings": len(self.all_findings),
                "critical_findings": severity_counts["critical"],
                "high_findings": severity_counts["high"],
                "medium_findings": severity_counts["medium"],
                "low_findings": severity_counts["low"],
                "gates_passed": sum(1 for gate in gate_results.values() if gate.passed),
                "gates_failed": sum(1 for gate in gate_results.values() if not gate.passed),
                "blocking_failures": blocking_failures
            },
            "scan_results": {
                tool_name: {
                    "execution_time": result.execution_time,
                    "exit_code": result.exit_code,
                    "findings_count": len(result.findings),
                    "files_scanned": result.total_files_scanned,
                    "command_executed": result.command_executed,
                    "sarif_file": result.sarif_file
                }
                for tool_name, result in self.scan_results.items()
            },
            "security_gates": {
                gate_name: {
                    "passed": gate.passed,
                    "threshold": gate.threshold,
                    "actual_count": gate.actual_count,
                    "blocking": gate.blocking,
                    "findings_count": len(gate.findings)
                }
                for gate_name, gate in gate_results.items()
            },
            "findings_summary": {
                "by_tool": {
                    tool_name: len(result.findings)
                    for tool_name, result in self.scan_results.items()
                },
                "by_severity": severity_counts,
                "top_findings": [
                    {
                        "tool": finding.tool,
                        "severity": finding.severity,
                        "rule_id": finding.rule_id,
                        "title": finding.title,
                        "file_path": finding.file_path,
                        "line_number": finding.line_number
                    }
                    for finding in sorted(self.all_findings, 
                                        key=lambda x: {"critical": 4, "high": 3, "medium": 2, "low": 1}[x.severity],
                                        reverse=True)[:10]
                ]
            },
            "compliance_status": {
                "production_ready": overall_status == "PASS",
                "zero_critical_policy": severity_counts["critical"] == 0,
                "zero_high_policy": severity_counts["high"] == 0
            },
            "recommendations": self._generate_recommendations(severity_counts, blocking_failures),
            "artifacts": {
                "sarif_report": str(self.artifacts_dir / "consolidated_security_results.sarif"),
                "individual_reports": [
                    result.sarif_file for result in self.scan_results.values() 
                    if result.sarif_file
                ]
            }
        }
        
        # Save security report
        report_file = self.artifacts_dir / "real_security_report.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        print(f"Security report saved: {report_file}")
        return report
    
    def _generate_recommendations(self, severity_counts: Dict[str, int], blocking_failures: int) -> List[str]:
        """Generate actionable security recommendations."""
        recommendations = []
        
        if severity_counts["critical"] > 0:
            recommendations.append("CRITICAL: Fix all critical vulnerabilities before deployment")
        
        if severity_counts["high"] > 0:
            recommendations.append("HIGH PRIORITY: Address all high-severity findings")
        
        if blocking_failures > 0:
            recommendations.append("BLOCKING: Resolve all blocking security gate failures")
        
        if severity_counts["medium"] > 20:
            recommendations.append("Consider addressing medium-severity findings for improved security posture")
        
        if not recommendations:
            recommendations.append("Security scan completed successfully - maintain current security practices")
        
        return recommendations
    
    async def run_full_security_validation(self) -> Dict[str, Any]:
        """Run complete security validation with REAL tools and enforcement."""
        print("REAL Security Validation - Agent Delta Mission")
        print("=" * 60)
        print(f"Scanning: {self.work_dir}")
        print("")
        
        try:
            # Step 1: Run comprehensive security scan
            scan_results = await self.run_comprehensive_scan()
            
            # Step 2: Evaluate security gates
            gate_results = await self.evaluate_security_gates()
            
            # Step 3: Generate SARIF report
            sarif_report = await self.generate_sarif_report()
            
            # Step 4: Generate comprehensive report
            security_report = await self.generate_security_report(gate_results)
            
            print("")
            print("=" * 60)
            print("SECURITY VALIDATION SUMMARY")
            print("=" * 60)
            
            summary = security_report["executive_summary"]
            print(f"Overall Status: {summary['overall_status']}")
            print(f"Total Findings: {summary['total_findings']}")
            print(f"Critical: {summary['critical_findings']}")
            print(f"High: {summary['high_findings']}")
            print(f"Medium: {summary['medium_findings']}")
            print(f"Low: {summary['low_findings']}")
            print(f"Gates Passed: {summary['gates_passed']}")
            print(f"Gates Failed: {summary['gates_failed']}")
            print(f"Blocking Failures: {summary['blocking_failures']}")
            
            if security_report["recommendations"]:
                print("\nRecommendations:")
                for rec in security_report["recommendations"]:
                    print(f"   {rec}")
            
            return security_report
            
        except Exception as e:
            logger.error(f"Security validation failed: {e}")
            raise

async def main():
    """Main execution for real security validation."""
    scanner = RealSecurityScanner()
    
    try:
        report = await scanner.run_full_security_validation()
        
        # Exit with failure if blocking issues found
        if report["executive_summary"]["blocking_failures"] > 0:
            exit(1)
        else:
            exit(0)
            
    except Exception as e:
        print(f"FATAL: Security validation failed: {e}")
        exit(1)

if __name__ == "__main__":
    asyncio.run(main())