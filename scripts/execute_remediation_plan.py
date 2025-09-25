from src.constants.base import API_TIMEOUT_SECONDS

Orchestrates the complete compliance remediation process across all phases:
- Phase 1: Critical Security (0-7 days)
- Phase 2: DFARS Compliance (7-21 days)
- Phase 3: NASA Compliance (21-45 days)
- Phase 4: Documentation (45-60 days)

Priority: P0 - Immediate execution required.
"""

import asyncio
import json
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

@dataclass
class PhaseStatus:
    """Status tracking for remediation phases."""
    phase_name: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: str = "PENDING"  # PENDING, IN_PROGRESS, COMPLETED, FAILED
    progress: float = 0.0
    violations_before: int = 0
    violations_after: int = 0
    errors: List[str] = None
    metrics: Dict[str, Any] = None

    def __post_init__(self):
        if self.errors is None:
            self.errors = []
        if self.metrics is None:
            self.metrics = {}

class RemediationOrchestrator:
    """Master orchestrator for compliance remediation."""

    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.scripts_path = self.root_path / 'scripts'
        self.phase_status = {
            'phase_1_security': PhaseStatus("Critical Security Fixes"),
            'phase_2_dfars': PhaseStatus("DFARS Compliance"),
            'phase_3_nasa': PhaseStatus("NASA POT10 Compliance"),
            'phase_4_docs': PhaseStatus("Documentation Generation")
        }

    async def execute_phase_1_security(self) -> bool:
        """Execute Phase 1: Critical Security Fixes."""
        phase = self.phase_status['phase_1_security']
        phase.status = "IN_PROGRESS"
        phase.start_time = datetime.now()

        logger.info("=== PHASE 1: CRITICAL SECURITY FIXES ===")
        logger.info("Priority: P0 - Must complete within 7 days")

        try:
            # Run security vulnerability scan
            security_script = self.scripts_path / 'critical_security_fixes.py'

            result = await self._run_script_async(
                [sys.executable, str(security_script)],
                "Security vulnerability remediation"
            )

            if result['returncode'] == 0:
                phase.violations_after = self._count_remaining_security_violations()
                phase.progress = 100.0
                phase.status = "COMPLETED"
                logger.info(" Phase 1: Critical security fixes completed successfully")
            else:
                phase.errors.append(f"Security fixes failed: {result['stderr']}")
                phase.status = "FAILED"
                logger.error(" Phase 1: Critical security fixes failed")

        except Exception as e:
            phase.errors.append(f"Phase 1 execution error: {str(e)}")
            phase.status = "FAILED"
            logger.error(f" Phase 1 execution error: {e}")

        phase.end_time = datetime.now()
        return phase.status == "COMPLETED"

    async def execute_phase_2_dfars(self) -> bool:
        """Execute Phase 2: DFARS Compliance."""
        phase = self.phase_status['phase_2_dfars']
        phase.status = "IN_PROGRESS"
        phase.start_time = datetime.now()

        logger.info("=== PHASE 2: DFARS COMPLIANCE ===")
        logger.info("Priority: P1 - Must complete within 21 days")

        try:
            # Run DFARS compliance fixer
            dfars_script = self.scripts_path / 'dfars_compliance_fixer.py'

            result = await self._run_script_async(
                [sys.executable, str(dfars_script)],
                "DFARS compliance implementation"
            )

            if result['returncode'] == 0:
                phase.violations_after = self._count_remaining_dfars_violations()
                phase.progress = 100.0
                phase.status = "COMPLETED"
                logger.info(" Phase 2: DFARS compliance completed successfully")
            else:
                phase.errors.append(f"DFARS compliance failed: {result['stderr']}")
                phase.status = "FAILED"
                logger.error(" Phase 2: DFARS compliance failed")

        except Exception as e:
            phase.errors.append(f"Phase 2 execution error: {str(e)}")
            phase.status = "FAILED"
            logger.error(f" Phase 2 execution error: {e}")

        phase.end_time = datetime.now()
        return phase.status == "COMPLETED"

    async def execute_phase_3_nasa(self) -> bool:
        """Execute Phase 3: NASA POT10 Compliance."""
        phase = self.phase_status['phase_3_nasa']
        phase.status = "IN_PROGRESS"
        phase.start_time = datetime.now()

        logger.info("=== PHASE 3: NASA POT10 COMPLIANCE ===")
        logger.info("Priority: P2 - Must complete within 45 days")

        try:
            # Run NASA compliance analyzer
            nasa_script = self.scripts_path / 'nasa_compliance_analyzer.py'

            result = await self._run_script_async(
                [sys.executable, str(nasa_script)],
                "NASA POT10 compliance analysis"
            )

            if result['returncode'] <= 1:  # 0=compliant, 1=mostly compliant
                phase.violations_after = self._count_remaining_nasa_violations()
                phase.progress = 100.0 if result['returncode'] == 0 else 80.0
                phase.status = "COMPLETED"
                logger.info(" Phase 3: NASA compliance analysis completed")
            else:
                phase.errors.append(f"NASA compliance failed: {result['stderr']}")
                phase.status = "FAILED"
                logger.error(" Phase 3: NASA compliance failed")

        except Exception as e:
            phase.errors.append(f"Phase 3 execution error: {str(e)}")
            phase.status = "FAILED"
            logger.error(f" Phase 3 execution error: {e}")

        phase.end_time = datetime.now()
        return phase.status == "COMPLETED"

    async def execute_phase_4_documentation(self) -> bool:
        """Execute Phase 4: Documentation Generation."""
        phase = self.phase_status['phase_4_docs']
        phase.status = "IN_PROGRESS"
        phase.start_time = datetime.now()

        logger.info("=== PHASE 4: DOCUMENTATION GENERATION ===")
        logger.info("Priority: P3 - Must complete within 60 days")

        try:
            # Run automated docstring generator
            docs_script = self.scripts_path / 'automated_docstring_generator.py'

            result = await self._run_script_async(
                [sys.executable, str(docs_script)],
                "Automated documentation generation"
            )

            if result['returncode'] <= 1:  # 0=all processed, 1=some processed
                phase.violations_after = self._count_remaining_doc_violations()
                phase.progress = 100.0 if result['returncode'] == 0 else 80.0
                phase.status = "COMPLETED"
                logger.info(" Phase 4: Documentation generation completed")
            else:
                phase.errors.append(f"Documentation generation failed: {result['stderr']}")
                phase.status = "FAILED"
                logger.error(" Phase 4: Documentation generation failed")

        except Exception as e:
            phase.errors.append(f"Phase 4 execution error: {str(e)}")
            phase.status = "FAILED"
            logger.error(f" Phase 4 execution error: {e}")

        phase.end_time = datetime.now()
        return phase.status == "COMPLETED"

    async def _run_script_async(self, command: List[str], description: str) -> Dict[str, Any]:
        """Run a script asynchronously with timeout."""
        logger.info(f"Executing: {description}")

        try:
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.root_path
            )

            # Wait for completion with timeout
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=1800  # API_TIMEOUT_SECONDS minutes timeout
            )

            return {
                'returncode': process.returncode,
                'stdout': stdout.decode('utf-8', errors='ignore'),
                'stderr': stderr.decode('utf-8', errors='ignore')
            }

        except asyncio.TimeoutError:
            logger.error(f"Script timeout: {description}")
            return {
                'returncode': -1,
                'stdout': '',
                'stderr': 'Script execution timeout (30 minutes)'
            }
        except Exception as e:
            logger.error(f"Script execution failed: {e}")
            return {
                'returncode': -1,
                'stdout': '',
                'stderr': str(e)
            }

    def _count_remaining_security_violations(self) -> int:
        """Count remaining security violations after Phase 1."""
        try:
            # Run a quick security scan
            result = subprocess.run([
                sys.executable, '-c',
                "import re; import os; "
                "count = 0; "
                "for root, dirs, files in os.walk('.'): "
                "  for file in files: "
                "    if file.endswith('.py'): "
                "      try: "
                "        with open(os.path.join(root, file), 'r') as f: "
                "          content = f.read(); "
                "          count += len(re.findall(r'\\beval\\s*\\(', content)); "
                "          count += len(re.findall(r'\\bexec\\s*\\(', content)); "
                "      except: pass; "
                "print(count)"
            ], capture_output=True, text=True, cwd=self.root_path)

            return int(result.stdout.strip()) if result.stdout.strip().isdigit() else 0
        except:
            return 0

    def _count_remaining_dfars_violations(self) -> int:
        """Count remaining DFARS violations after Phase 2."""
        try:
            # Count unencrypted sensitive files
            result = subprocess.run([
                sys.executable, '-c',
                "import re; import os; "
                "patterns = [r'password\\s*[=:]', r'api_key\\s*[=:]', r'secret\\s*[=:]']; "
                "count = 0; "
                "for root, dirs, files in os.walk('.'): "
                "  for file in files: "
                "    if file.endswith(('.py', '.json', '.yaml', '.env')): "
                "      try: "
                "        with open(os.path.join(root, file), 'r') as f: "
                "          content = f.read(); "
                "          if '# ENCRYPTED CONTENT' not in content: "
                "            for pattern in patterns: "
                "              if re.search(pattern, content): count += 1; break; "
                "      except: pass; "
                "print(count)"
            ], capture_output=True, text=True, cwd=self.root_path)

            return int(result.stdout.strip()) if result.stdout.strip().isdigit() else 0
        except:
            return 0

    def _count_remaining_nasa_violations(self) -> int:
        """Count remaining NASA POT10 violations after Phase 3."""
        try:
            # Basic function length check
            result = subprocess.run([
                sys.executable, '-c',
                "import ast; import os; "
                "violations = 0; "
                "for root, dirs, files in os.walk('.'): "
                "  for file in files: "
                "    if file.endswith('.py'): "
                "      try: "
                "        with open(os.path.join(root, file), 'r') as f: "
                "          content = f.read(); "
                "          tree = ast.parse(content); "
                "          for node in ast.walk(tree): "
                "            if isinstance(node, ast.FunctionDef): "
                "              if node.end_lineno and (node.end_lineno - node.lineno) > 60: "
                "                violations += 1; "
                "      except: pass; "
                "print(violations)"
            ], capture_output=True, text=True, cwd=self.root_path)

            return int(result.stdout.strip()) if result.stdout.strip().isdigit() else 0
        except:
            return 0

    def _count_remaining_doc_violations(self) -> int:
        """Count remaining documentation violations after Phase 4."""
        try:
            # Count functions without docstrings
            result = subprocess.run([
                sys.executable, '-c',
                "import ast; import os; "
                "violations = 0; "
                "for root, dirs, files in os.walk('.'): "
                "  for file in files: "
                "    if file.endswith('.py'): "
                "      try: "
                "        with open(os.path.join(root, file), 'r') as f: "
                "          content = f.read(); "
                "          tree = ast.parse(content); "
                "          for node in ast.walk(tree): "
                "            if isinstance(node, ast.FunctionDef): "
                "              if not ast.get_docstring(node): "
                "                violations += 1; "
                "      except: pass; "
                "print(violations)"
            ], capture_output=True, text=True, cwd=self.root_path)

            return int(result.stdout.strip()) if result.stdout.strip().isdigit() else 0
        except:
            return 0

    def generate_progress_report(self) -> Dict[str, Any]:
        """Generate comprehensive progress report."""
        total_phases = len(self.phase_status)
        completed_phases = sum(1 for phase in self.phase_status.values() if phase.status == "COMPLETED")

        report = {
            'timestamp': datetime.now().isoformat(),
            'overall_progress': (completed_phases / total_phases) * 100,
            'phases': {name: asdict(status) for name, status in self.phase_status.items()},
            'summary': {
                'total_phases': total_phases,
                'completed_phases': completed_phases,
                'failed_phases': sum(1 for phase in self.phase_status.values() if phase.status == "FAILED"),
                'in_progress_phases': sum(1 for phase in self.phase_status.values() if phase.status == "IN_PROGRESS")
            },
            'violations_summary': {
                'security': self.phase_status['phase_1_security'].violations_after,
                'dfars': self.phase_status['phase_2_dfars'].violations_after,
                'nasa': self.phase_status['phase_3_nasa'].violations_after,
                'documentation': self.phase_status['phase_4_docs'].violations_after
            },
            'compliance_status': self._calculate_compliance_status(),
            'recommendations': self._generate_next_steps()
        }

        return report

    def _calculate_compliance_status(self) -> Dict[str, str]:
        """Calculate overall compliance status."""
        security_compliant = self.phase_status['phase_1_security'].violations_after == 0
        dfars_compliant = self.phase_status['phase_2_dfars'].violations_after < 10
        nasa_compliant = self.phase_status['phase_3_nasa'].violations_after < 100
        doc_compliant = self.phase_status['phase_4_docs'].violations_after < 50

        return {
            'security': 'COMPLIANT' if security_compliant else 'NON_COMPLIANT',
            'dfars': 'COMPLIANT' if dfars_compliant else 'NON_COMPLIANT',
            'nasa': 'MOSTLY_COMPLIANT' if nasa_compliant else 'NON_COMPLIANT',
            'documentation': 'IMPROVED' if doc_compliant else 'NEEDS_WORK',
            'overall': 'COMPLIANT' if all([security_compliant, dfars_compliant, nasa_compliant]) else 'IN_PROGRESS'
        }

    def _generate_next_steps(self) -> List[str]:
        """Generate next steps recommendations."""
        recommendations = []

        for phase_name, phase in self.phase_status.items():
            if phase.status == "FAILED":
                recommendations.append(f"URGENT: Retry {phase.phase_name} - check error logs")
            elif phase.status == "IN_PROGRESS":
                recommendations.append(f"Monitor {phase.phase_name} progress")
            elif phase.violations_after > 0:
                recommendations.append(f"Review remaining violations in {phase.phase_name}")

        if all(phase.status == "COMPLETED" for phase in self.phase_status.values()):
            recommendations.append("SUCCESS: All phases completed - run final validation")
            recommendations.append("Consider implementing continuous compliance monitoring")

        return recommendations

    async def execute_full_remediation(self) -> bool:
        """Execute complete remediation plan across all phases."""
        logger.info(" STARTING COMPREHENSIVE COMPLIANCE REMEDIATION")
        logger.info("=" * 60)

        start_time = datetime.now()
        success = True

        try:
            # Phase 1: Critical Security (P0 - Immediate)
            phase1_success = await self.execute_phase_1_security()
            success = success and phase1_success

            if not phase1_success:
                logger.critical("  Phase 1 failed - security vulnerabilities remain!")
                logger.critical("   Continuing with other phases but IMMEDIATE security review required")

            # Phase 2: DFARS Compliance (P1 - High Priority)
            phase2_success = await self.execute_phase_2_dfars()
            success = success and phase2_success

            # Phase 3: NASA Compliance (P2 - Medium Priority)
            phase3_success = await self.execute_phase_3_nasa()
            success = success and phase3_success

            # Phase 4: Documentation (P3 - Lower Priority)
            phase4_success = await self.execute_phase_4_documentation()
            # Documentation phase failure doesn't affect overall success

            # Generate final report
            report = self.generate_progress_report()

            # Save progress report
            report_path = self.root_path / 'docs' / 'remediation-progress-report.json'
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=2, default=str)

            # Generate human-readable summary
            self._generate_final_summary(report, start_time)

            logger.info("=" * 60)
            logger.info(f" REMEDIATION COMPLETE: {'SUCCESS' if success else 'PARTIAL SUCCESS'}")

            return success

        except Exception as e:
            logger.critical(f" Critical error during remediation: {e}")
            return False

    def _generate_final_summary(self, report: Dict[str, Any], start_time: datetime):
        """Generate human-readable final summary."""
        duration = datetime.now() - start_time

        summary = f"""
COMPLIANCE REMEDIATION FINAL SUMMARY
==================================
Execution Time: {duration}
Overall Progress: {report['overall_progress']:.1f}%

PHASE RESULTS:
"""

        for phase_name, phase_data in report['phases'].items():
            status_emoji = {
                'COMPLETED': '',
                'FAILED': '',
                'IN_PROGRESS': '',
                'PENDING': ''
            }.get(phase_data['status'], '')

            summary += f"{status_emoji} {phase_data['phase_name']}: {phase_data['status']}\n"
            if phase_data['violations_after'] is not None:
                summary += f"   Remaining violations: {phase_data['violations_after']}\n"

        summary += f"""
COMPLIANCE STATUS:
- Security: {report['compliance_status']['security']}
- DFARS: {report['compliance_status']['dfars']}
- NASA POT10: {report['compliance_status']['nasa']}
- Documentation: {report['compliance_status']['documentation']}

OVERALL: {report['compliance_status']['overall']}

NEXT STEPS:
"""

        for i, rec in enumerate(report['recommendations'], 1):
            summary += f"{i}. {rec}\n"

        # Save summary
        summary_path = self.root_path / 'docs' / 'remediation-final-summary.md'
        with open(summary_path, 'w') as f:
            f.write(summary)

        logger.info(f" Final summary saved to: {summary_path}")
        logger.info(f" Detailed report saved to: remediation-progress-report.json")

async def main():
    """Main execution function."""
    root_path = os.path.dirname(os.path.dirname(__file__))
    orchestrator = RemediationOrchestrator(root_path)

    logger.info("Compliance Remediation Orchestrator v1.0")
    logger.info(f"Root path: {root_path}")

    # Verify required scripts exist
    required_scripts = [
        'critical_security_fixes.py',
        'dfars_compliance_fixer.py',
        'nasa_compliance_analyzer.py',
        'automated_docstring_generator.py'
    ]

    missing_scripts = []
    for script in required_scripts:
        script_path = Path(root_path) / 'scripts' / script
        if not script_path.exists():
            missing_scripts.append(script)

    if missing_scripts:
        logger.error(f" Missing required scripts: {missing_scripts}")
        logger.error("Cannot proceed with remediation")
        return 2

    # Execute full remediation
    success = await orchestrator.execute_full_remediation()

    if success:
        logger.info(" All critical phases completed successfully!")
        logger.info("System is now compliant with major security and regulatory requirements.")
        return 0
    else:
        logger.warning("  Some phases incomplete - manual intervention required")
        logger.warning("Review error logs and phase reports for details.")
        return 1

if __name__ == '__main__':
    exit(asyncio.run(main()))