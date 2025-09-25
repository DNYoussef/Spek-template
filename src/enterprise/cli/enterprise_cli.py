"""
Enterprise CLI Integration

Command-line interface for all enterprise features with seamless integration
into existing CLI systems and comprehensive command support.
"""

from lib.shared.utilities import get_logger

class EnterpriseCommand:
    """Base class for enterprise CLI commands"""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        
    def add_arguments(self, parser: argparse.ArgumentParser):
        """Add command-specific arguments to parser"""
        
    async def execute(self, args: argparse.Namespace) -> int:
        """Execute command and return exit code with comprehensive error handling."""
        try:
            # NASA Rule 5: Input validation
            assert isinstance(args, argparse.Namespace), "args must be argparse.Namespace"

            # Log command execution
            logger.info(f"Executing enterprise command: {self.name}")

            # Execute command-specific logic
            result = await self._execute_command_logic(args)

            # Validate result
            if isinstance(result, int):
                return result
            elif result is True:
                return 0  # Success
            elif result is False:
                return 1  # Generic failure
            else:
                logger.warning(f"Command {self.name} returned unexpected result type: {type(result)}")
                return 0  # Default to success

        except Exception as e:
            logger.error(f"Enterprise command {self.name} failed: {e}")
            return 1  # Error exit code

    async def _execute_command_logic(self, args: argparse.Namespace) -> Any:
        """Command-specific execution logic - to be overridden by subclasses."""
        logger.info(f"Executing base command logic for {self.name}")

        # Default implementation - log the command and arguments
        arg_dict = vars(args)
        logger.info(f"Command arguments: {json.dumps(arg_dict, default=str, indent=2)}")

        # Return success for base implementation
        return True
        
class TelemetryCommand(EnterpriseCommand):
    """Six Sigma telemetry commands"""
    
    def __init__(self):
        super().__init__("telemetry", "Six Sigma telemetry and quality metrics")
        
    def add_arguments(self, parser: argparse.ArgumentParser):
        subparsers = parser.add_subparsers(dest='telemetry_action', help='Telemetry actions')
        
        # Status command
        status_parser = subparsers.add_parser('status', help='Show telemetry status')
        status_parser.add_argument('--process', default='default', help='Process name')
        
        # Report command
        report_parser = subparsers.add_parser('report', help='Generate metrics report')
        report_parser.add_argument('--output', '-o', help='Output file path')
        report_parser.add_argument('--format', choices=['json', 'text'], default='json')
        
        # Record command
        record_parser = subparsers.add_parser('record', help='Record metrics')
        record_parser.add_argument('--defect', action='store_true', help='Record a defect')
        record_parser.add_argument('--unit', action='store_true', help='Record processed unit')
        record_parser.add_argument('--passed', action='store_true', help='Unit passed (with --unit)')
        
    async def execute(self, args: argparse.Namespace) -> int:
        try:
            telemetry = SixSigmaTelemetry(args.process if hasattr(args, 'process') else 'default')
            
            if args.telemetry_action == 'status':
                metrics = telemetry.generate_metrics_snapshot()
                print(f"Process: {metrics.process_name}")
                print(f"DPMO: {metrics.dpmo}")
                print(f"RTY: {metrics.rty}%")
                print(f"Sigma Level: {metrics.sigma_level}")
                print(f"Quality Level: {metrics.quality_level.name if metrics.quality_level else 'N/A'}")
                print(f"Sample Size: {metrics.sample_size}")
                print(f"Defects: {metrics.defect_count}")
                
            elif args.telemetry_action == 'report':
                metrics = telemetry.export_metrics()
                
                if args.output:
                    output_path = Path(args.output)
                    if args.format == 'json':
                        with open(output_path, 'w') as f:
                            json.dump(metrics, f, indent=2, default=str)
                    else:
                        with open(output_path, 'w') as f:
                            f.write(f"Telemetry Report - {datetime.now()}\n")
                            f.write("=" * 40 + "\n")
                            f.write(json.dumps(metrics, indent=2, default=str))
                    print(f"Report saved to {output_path}")
                else:
                    print(json.dumps(metrics, indent=2, default=str))
                    
            elif args.telemetry_action == 'record':
                if args.defect:
                    telemetry.record_defect("cli_recorded_defect")
                    print("Defect recorded")
                elif args.unit:
                    passed = args.passed if hasattr(args, 'passed') else True
                    telemetry.record_unit_processed(passed=passed)
                    print(f"Unit recorded as {'passed' if passed else 'failed'}")
                else:
                    print("Specify --defect or --unit")
                    return 1
                    
            return 0
            
        except Exception as e:
            logger.error(f"Telemetry command error: {e}")
            print(f"Error: {e}", file=sys.stderr)
            return 1

class SecurityCommand(EnterpriseCommand):
    """Supply chain security commands"""
    
    def __init__(self):
        super().__init__("security", "Supply chain security and SBOM/SLSA generation")
        
    def add_arguments(self, parser: argparse.ArgumentParser):
        subparsers = parser.add_subparsers(dest='security_action', help='Security actions')
        
        # SBOM command
        sbom_parser = subparsers.add_parser('sbom', help='Generate SBOM')
        sbom_parser.add_argument('--format', choices=['spdx-json', 'cyclonedx-json'], 
                                default='spdx-json', help='SBOM format')
        sbom_parser.add_argument('--output', '-o', help='Output file path')
        
        # SLSA command
        slsa_parser = subparsers.add_parser('slsa', help='Generate SLSA attestation')
        slsa_parser.add_argument('--level', type=int, choices=[1, 2, 3, 4], 
                                default=2, help='SLSA level')
        slsa_parser.add_argument('--output', '-o', help='Output file path')
        
        # Report command
        report_parser = subparsers.add_parser('report', help='Generate security report')
        report_parser.add_argument('--level', choices=['basic', 'enhanced', 'critical', 'top_secret'],
                                default='enhanced', help='Security level')
        report_parser.add_argument('--output', '-o', help='Output directory')
        
        # Status command
        status_parser = subparsers.add_parser('status', help='Show security status')
        
    async def execute(self, args: argparse.Namespace) -> int:
        try:
            project_root = Path.cwd()
            security_level = SecurityLevel(args.level if hasattr(args, 'level') else 'enhanced')
            security = SupplyChainSecurity(project_root, security_level)
            
            if args.security_action == 'sbom':
                from ..security.sbom_generator import SBOMFormat
                
                format_map = {
                    'spdx-json': SBOMFormat.SPDX_JSON,
                    'cyclonedx-json': SBOMFormat.CYCLONEDX_JSON
                }
                
                sbom_format = format_map[args.format]
                output_file = Path(args.output) if args.output else None
                
                sbom_file = await security.sbom_generator.generate_sbom(sbom_format, output_file)
                print(f"SBOM generated: {sbom_file}")
                
            elif args.security_action == 'slsa':
                from ..security.slsa_generator import SLSALevel
                
                slsa_level = SLSALevel(args.level)
                attestation_file = await security.slsa_generator.generate_attestation(slsa_level)
                
                if args.output:
                    output_path = Path(args.output)
                    output_path.write_bytes(attestation_file.read_bytes())
                else:
                    pass
                    
            elif args.security_action == 'report':
                report = await security.generate_comprehensive_security_report()
                
                if args.output:
                    output_dir = Path(args.output)
                    exported_files = await security.export_security_artifacts(output_dir)
                    
                    print(f"Security report generated in {output_dir}")
                    for artifact_type, file_path in exported_files.items():
                        print(f"  {artifact_type}: {file_path}")
                else:
                    print(f"Security Level: {report.security_level.value}")
                    print(f"Risk Score: {report.risk_score}")
                    print(f"Vulnerabilities: {report.vulnerabilities_found}")
                    print(f"SBOM Generated: {report.sbom_generated}")
                    print(f"SLSA Level: {report.slsa_level.value if report.slsa_level else 'None'}")
                    
            elif args.security_action == 'status':
                status = security.get_security_status()
                print(json.dumps(status, indent=2, default=str))
                
            return 0
            
        except Exception as e:
            logger.error(f"Security command error: {e}")
            print(f"Error: {e}", file=sys.stderr)
            return 1

class ComplianceCommand(EnterpriseCommand):
    """Compliance matrix commands"""
    
    def __init__(self):
        super().__init__("compliance", "Compliance matrix and framework management")
        
    def add_arguments(self, parser: argparse.ArgumentParser):
        subparsers = parser.add_subparsers(dest='compliance_action', help='Compliance actions')
        
        # Status command
        status_parser = subparsers.add_parser('status', help='Show compliance status')
        status_parser.add_argument('--framework', 
                                choices=['soc2-type2', 'iso27001', 'nist-csf', 'gdpr'],
                                help='Specific framework')
        
        # Report command
        report_parser = subparsers.add_parser('report', help='Generate compliance report')
        report_parser.add_argument('--framework', required=True,
                                choices=['soc2-type2', 'iso27001', 'nist-csf', 'gdpr'])
        report_parser.add_argument('--output', '-o', help='Output file path')
        
        # Update command
        update_parser = subparsers.add_parser('update', help='Update control status')
        update_parser.add_argument('--control', required=True, help='Control ID')
        update_parser.add_argument('--status', required=True,
                                choices=['not_started', 'in_progress', 'implemented', 
                                        'tested', 'compliant', 'non_compliant'])
        update_parser.add_argument('--notes', help='Update notes')
        
        # Export command
        export_parser = subparsers.add_parser('export', help='Export compliance matrix')
        export_parser.add_argument('--output', '-o', required=True, help='Output file path')
        
    async def execute(self, args: argparse.Namespace) -> int:
        try:
            project_root = Path.cwd()
            compliance = ComplianceMatrix(project_root)
            
            # Add standard frameworks
            compliance.add_framework(ComplianceFramework.SOC2_TYPE2)
            compliance.add_framework(ComplianceFramework.ISO27001)
            compliance.add_framework(ComplianceFramework.NIST_CSF)
            compliance.add_framework(ComplianceFramework.GDPR)
            
            if args.compliance_action == 'status':
                if args.framework:
                    framework = ComplianceFramework(args.framework.replace('-', '_').upper())
                    report = compliance.generate_compliance_report(framework)
                    
                    print(f"Framework: {framework.value}")
                    print(f"Overall Compliance: {report.overall_status:.1f}%")
                    print(f"Total Controls: {report.total_controls}")
                    print(f"Compliant: {report.compliant_controls}")
                    print(f"In Progress: {report.in_progress_controls}")
                    print(f"Non-Compliant: {report.non_compliant_controls}")
                else:
                    coverage = compliance.get_framework_coverage()
                    for framework, data in coverage.items():
                        print(f"\n{framework.upper()}:")
                        print(f"  Compliance: {data['compliance_percentage']:.1f}%")
                        print(f"  Controls: {data['compliant_controls']}/{data['total_controls']}")
                        
            elif args.compliance_action == 'report':
                framework = ComplianceFramework(args.framework.replace('-', '_').upper())
                report = compliance.generate_compliance_report(framework)
                
                report_data = {
                    'framework': report.framework.value,
                    'report_date': report.report_date.isoformat(),
                    'overall_status': report.overall_status,
                    'total_controls': report.total_controls,
                    'compliant_controls': report.compliant_controls,
                    'in_progress_controls': report.in_progress_controls,
                    'non_compliant_controls': report.non_compliant_controls,
                    'risk_summary': report.risk_summary,
                    'category_breakdown': report.category_breakdown,
                    'recommendations': report.recommendations,
                    'evidence_gaps': report.evidence_gaps,
                    'next_actions': report.next_actions
                }
                
                if args.output:
                    with open(args.output, 'w') as f:
                        json.dump(report_data, f, indent=2)
                    print(f"Compliance report saved: {args.output}")
                else:
                    print(json.dumps(report_data, indent=2))
                    
            elif args.compliance_action == 'update':
                from ..compliance.matrix import ComplianceStatus
                
                status = ComplianceStatus(args.status.upper())
                compliance.update_control_status(
                    args.control, 
                    status, 
                    notes=args.notes
                )
                print(f"Control {args.control} updated to {status.value}")
                
            elif args.compliance_action == 'export':
                compliance.export_compliance_matrix(Path(args.output))
                print(f"Compliance matrix exported: {args.output}")
                
            return 0
            
        except Exception as e:
            logger.error(f"Compliance command error: {e}")
            print(f"Error: {e}", file=sys.stderr)
            return 1

class TestCommand(EnterpriseCommand):
    """Enterprise testing commands"""
    
    def __init__(self):
        super().__init__("test", "Enterprise testing and validation")
        
    def add_arguments(self, parser: argparse.ArgumentParser):
        subparsers = parser.add_subparsers(dest='test_action', help='Test actions')
        
        # Run command
        run_parser = subparsers.add_parser('run', help='Run enterprise tests')
        run_parser.add_argument('--output', '-o', help='Test report output file')
        run_parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
        
    async def execute(self, args: argparse.Namespace) -> int:
        try:
            project_root = Path.cwd()
            test_runner = EnterpriseTestRunner(project_root)
            
            if args.test_action == 'run':
                pass
                
                if args.verbose:
                    logging.getLogger().setLevel(logging.INFO)
                    
                result = await test_runner.run_all_tests()
                
                print(f"Failures: {result.failures}")
                print(f"Errors: {result.errors}")
                print(f"Success Rate: {result.success_rate:.1f}%")
                print(f"Execution Time: {result.execution_time:.2f}s")
                
                if args.output:
                    report_file = test_runner.generate_test_report(Path(args.output))
                    print(f"\nDetailed report: {report_file}")
                    
                return 0 if result.failures == 0 and result.errors == 0 else 1
                
        except Exception as e:
            logger.error(f"Test command error: {e}")
            print(f"Error: {e}", file=sys.stderr)
            return 1

class EnterpriseCLI:
    """
    Enterprise CLI main interface
    
    Provides unified command-line interface for all enterprise features
    with seamless integration into existing CLI systems.
    """
    
    def __init__(self):
        self.commands: Dict[str, EnterpriseCommand] = {}
        self.parser = None
        
        # Register built-in commands
        self.register_command(TelemetryCommand())
        self.register_command(SecurityCommand())
        self.register_command(ComplianceCommand())
        self.register_command(TestCommand())
        
    def register_command(self, command: EnterpriseCommand):
        """Register a new command"""
        self.commands[command.name] = command
        
    def create_parser(self) -> argparse.ArgumentParser:
        """Create argument parser with all commands"""
        parser = argparse.ArgumentParser(
            prog='enterprise',
            description='Enterprise features for SPEK Enhanced Development Platform'
        )
        
        parser.add_argument('--config', help='Configuration file path')
        parser.add_argument('--environment', 
                            choices=['development', 'testing', 'staging', 'production'],
                            default='development', help='Environment')
        parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
        
        # Add subparsers for commands
        subparsers = parser.add_subparsers(dest='command', help='Available commands')
        
        for command in self.commands.values():
            cmd_parser = subparsers.add_parser(command.name, help=command.description)
            command.add_arguments(cmd_parser)
            
        self.parser = parser
        return parser
        
    async def run(self, args: Optional[List[str]] = None) -> int:
        """Run CLI with given arguments"""
        if not self.parser:
            self.create_parser()
            
        parsed_args = self.parser.parse_args(args)
        
        # Setup logging
        if parsed_args.verbose:
            logging.basicConfig(level=logging.INFO)
        else:
            logging.basicConfig(level=logging.WARNING)
            
        # Load configuration
        if parsed_args.config:
            config = EnterpriseConfig(Path(parsed_args.config))
        else:
            environment = EnvironmentType(parsed_args.environment)
            config = EnterpriseConfig(environment=environment)
            
        config.setup_logging()
        
        # Execute command
        if not parsed_args.command:
            self.parser.print_help()
            return 1
            
        command = self.commands.get(parsed_args.command)
        if not command:
            print(f"Unknown command: {parsed_args.command}", file=sys.stderr)
            return 1
            
        try:
            return await command.execute(parsed_args)
        except KeyboardInterrupt:
            print("\nInterrupted", file=sys.stderr)
            return 130
        except Exception as e:
            logger.error(f"Command execution error: {e}")
            print(f"Error: {e}", file=sys.stderr)
            return 1
            
    def run_sync(self, args: Optional[List[str]] = None) -> int:
        """Synchronous wrapper for async run method"""
        try:
            return asyncio.run(self.run(args))
        except KeyboardInterrupt:
            return 130

# CLI entry point
def main():
    """Main CLI entry point"""
    cli = EnterpriseCLI()
    return cli.run_sync()

if __name__ == '__main__':
    sys.exit(main())