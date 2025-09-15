#!/usr/bin/env python3
"""
NASA POT10 Compliance Validation Runner
======================================

Enhanced runner script that integrates all NASA POT10 compliance tools:
- Enhanced NASA POT10 analyzer with all 10 rules
- Defense certification tool integration
- Comprehensive validation reporting
- Automated fixing capabilities
- CI/CD integration support

Usage:
    python run_nasa_compliance_validation.py --project "MyProject" --fix --report
"""

import argparse
import json
import logging
import sys
import time
from pathlib import Path
from datetime import datetime

# Add analyzer to path
sys.path.insert(0, str(Path(__file__).parent.parent / "analyzer"))

try:
    from enterprise.nasa_pot10_analyzer import NASAPowerOfTenAnalyzer, AutomatedNASAFixer
    from enterprise.defense_certification_tool import DefenseCertificationTool
    from enterprise.validation_reporting_system import ValidationReportingSystem
except ImportError as e:
    logging.error(f"Failed to import NASA compliance modules: {e}")
    logging.error("Ensure all required modules are installed and paths are correct")
    sys.exit(1)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class NASAComplianceValidator:
    """Main NASA POT10 compliance validation coordinator."""

    def __init__(self, project_name: str, codebase_path: Path, output_dir: Path):
        self.project_name = project_name
        self.codebase_path = codebase_path
        self.output_dir = output_dir
        self.output_dir.mkdir(exist_ok=True)

        # Initialize analyzers
        self.nasa_analyzer = NASAPowerOfTenAnalyzer(str(codebase_path))
        self.cert_tool = DefenseCertificationTool(project_name)
        self.reporting_system = ValidationReportingSystem(project_name, output_dir)
        self.fixer = AutomatedNASAFixer()

    def run_complete_validation(self, apply_fixes: bool = False,
                              generate_reports: bool = True) -> dict:
        """Run complete NASA POT10 compliance validation."""
        logger.info(f"Starting NASA POT10 compliance validation for {self.project_name}")
        start_time = time.time()

        results = {
            'project_name': self.project_name,
            'validation_timestamp': datetime.now().isoformat(),
            'codebase_path': str(self.codebase_path),
            'nasa_compliance': {},
            'defense_certification': {},
            'fixes_applied': {},
            'reports_generated': {},
            'validation_summary': {}
        }

        # Step 1: Run NASA POT10 Analysis
        logger.info("Step 1: Running NASA POT10 analysis...")
        try:
            nasa_metrics = self.nasa_analyzer.analyze_codebase()
            results['nasa_compliance'] = {
                'compliance_score': nasa_metrics.compliance_score,
                'total_files': nasa_metrics.total_files,
                'violations_by_rule': {
                    str(rule): len(violations)
                    for rule, violations in nasa_metrics.violations_by_rule.items()
                },
                'total_violations': sum(len(v) for v in nasa_metrics.violations_by_rule.values()),
                'recommendations': nasa_metrics.fix_recommendations
            }
            logger.info(f"NASA POT10 compliance: {nasa_metrics.compliance_score:.1f}%")
        except Exception as e:
            logger.error(f"NASA POT10 analysis failed: {e}")
            results['nasa_compliance']['error'] = str(e)
            return results

        # Step 2: Apply Automated Fixes (if requested)
        if apply_fixes:
            logger.info("Step 2: Applying automated fixes...")
            try:
                all_violations = []
                for violations in nasa_metrics.violations_by_rule.values():
                    all_violations.extend(violations)

                fix_results = self.fixer.apply_fixes(all_violations)
                results['fixes_applied'] = {
                    'fixed_count': len(fix_results['fixed']),
                    'failed_count': len(fix_results['failed']),
                    'manual_review_count': len(fix_results['manual_review']),
                    'fix_details': {
                        'fixed_violations': [
                            {
                                'rule': v.rule_number,
                                'file': v.file_path,
                                'line': v.line_number,
                                'description': v.description
                            }
                            for v in fix_results['fixed']
                        ]
                    }
                }
                logger.info(f"Applied fixes to {len(fix_results['fixed'])} violations")

                # Re-run analysis after fixes
                logger.info("Re-running analysis after fixes...")
                nasa_metrics_after_fix = self.nasa_analyzer.analyze_codebase()
                results['nasa_compliance']['compliance_score_after_fix'] = nasa_metrics_after_fix.compliance_score
                logger.info(f"NASA POT10 compliance after fixes: {nasa_metrics_after_fix.compliance_score:.1f}%")

            except Exception as e:
                logger.error(f"Automated fixing failed: {e}")
                results['fixes_applied']['error'] = str(e)

        # Step 3: Run Defense Certification Analysis
        logger.info("Step 3: Running defense certification analysis...")
        try:
            cert_report = self.cert_tool.run_comprehensive_certification(self.codebase_path)
            results['defense_certification'] = {
                'overall_score': cert_report.overall_certification_score,
                'nasa_pot10_score': cert_report.nasa_pot10_score,
                'dfars_score': cert_report.dfars_compliance_score,
                'nist_score': cert_report.nist_compliance_score,
                'dod_score': cert_report.dod_compliance_score,
                'certification_status': cert_report.certification_status,
                'total_violations': len(cert_report.violations),
                'security_requirements_count': len(cert_report.security_requirements)
            }
            logger.info(f"Defense certification score: {cert_report.overall_certification_score:.1f}%")
        except Exception as e:
            logger.error(f"Defense certification analysis failed: {e}")
            results['defense_certification']['error'] = str(e)

        # Step 4: Generate Comprehensive Reports (if requested)
        if generate_reports:
            logger.info("Step 4: Generating comprehensive reports...")
            try:
                report_results = self.reporting_system.generate_comprehensive_report(self.codebase_path)
                results['reports_generated'] = {
                    'report_files': {
                        report_type: str(file_path)
                        for report_type, file_path in report_results['report_files'].items()
                    },
                    'dashboard_updated': True
                }
                logger.info(f"Generated reports in {self.output_dir}")
            except Exception as e:
                logger.error(f"Report generation failed: {e}")
                results['reports_generated']['error'] = str(e)

        # Step 5: Generate Validation Summary
        end_time = time.time()
        duration = end_time - start_time

        results['validation_summary'] = {
            'duration_seconds': duration,
            'overall_success': self._determine_success(results),
            'target_compliance_achieved': results['nasa_compliance'].get('compliance_score', 0) >= 95,
            'recommended_actions': self._generate_action_items(results),
            'next_validation_recommended': (datetime.now().date() +
                                          (timedelta(days=7) if results['nasa_compliance'].get('compliance_score', 0) < 95
                                           else timedelta(days=30))).isoformat()
        }

        logger.info(f"Validation completed in {duration:.1f} seconds")
        logger.info(f"Overall success: {results['validation_summary']['overall_success']}")

        return results

    def _determine_success(self, results: dict) -> bool:
        """Determine if validation was successful."""
        # Check for errors
        if 'error' in results.get('nasa_compliance', {}):
            return False
        if 'error' in results.get('defense_certification', {}):
            return False

        # Check compliance scores
        nasa_score = results.get('nasa_compliance', {}).get('compliance_score', 0)
        defense_score = results.get('defense_certification', {}).get('overall_score', 0)

        # Success if both scores are above minimum thresholds
        return nasa_score >= 85 and defense_score >= 80

    def _generate_action_items(self, results: dict) -> list:
        """Generate prioritized action items based on results."""
        actions = []

        nasa_score = results.get('nasa_compliance', {}).get('compliance_score', 0)
        defense_score = results.get('defense_certification', {}).get('overall_score', 0)

        if nasa_score < 95:
            actions.append({
                'priority': 'HIGH',
                'action': f'Achieve NASA POT10 95% compliance (current: {nasa_score:.1f}%)',
                'estimated_effort': '1-2 weeks'
            })

        if defense_score < 90:
            actions.append({
                'priority': 'HIGH',
                'action': f'Improve defense certification score (current: {defense_score:.1f}%)',
                'estimated_effort': '2-3 weeks'
            })

        total_violations = results.get('nasa_compliance', {}).get('total_violations', 0)
        if total_violations > 50:
            actions.append({
                'priority': 'MEDIUM',
                'action': f'Reduce total violation count from {total_violations}',
                'estimated_effort': '1 week'
            })

        # Add automated fixing recommendation if not applied
        if 'fixes_applied' not in results and total_violations > 0:
            actions.append({
                'priority': 'LOW',
                'action': 'Run with --fix flag to apply automated fixes',
                'estimated_effort': '< 1 day'
            })

        return actions

    def export_results(self, results: dict, output_file: Path = None) -> Path:
        """Export validation results to JSON file."""
        if output_file is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = self.output_dir / f"nasa_compliance_validation_{timestamp}.json"

        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2, default=str)

        logger.info(f"Validation results exported to {output_file}")
        return output_file

def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(
        description='NASA POT10 Compliance Validation Runner',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run basic validation
  python run_nasa_compliance_validation.py --project "MyProject"

  # Run with automated fixes
  python run_nasa_compliance_validation.py --project "MyProject" --fix

  # Run with reports generation
  python run_nasa_compliance_validation.py --project "MyProject" --report

  # Full validation with all features
  python run_nasa_compliance_validation.py --project "MyProject" --fix --report --output results/
        """
    )

    parser.add_argument('--project', required=True,
                       help='Project name for validation')
    parser.add_argument('--path', default='.',
                       help='Path to codebase to analyze (default: current directory)')
    parser.add_argument('--output', default='nasa_compliance_results',
                       help='Output directory for results (default: nasa_compliance_results)')
    parser.add_argument('--fix', action='store_true',
                       help='Apply automated fixes for violations')
    parser.add_argument('--report', action='store_true',
                       help='Generate comprehensive reports (HTML, PDF, etc.)')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Enable verbose logging')
    parser.add_argument('--json-output',
                       help='Specify custom JSON output file path')

    args = parser.parse_args()

    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Validate inputs
    codebase_path = Path(args.path).resolve()
    if not codebase_path.exists():
        logger.error(f"Codebase path does not exist: {codebase_path}")
        return 1

    output_dir = Path(args.output)

    # Initialize validator
    validator = NASAComplianceValidator(args.project, codebase_path, output_dir)

    # Run validation
    try:
        results = validator.run_complete_validation(
            apply_fixes=args.fix,
            generate_reports=args.report
        )

        # Export results
        json_output = Path(args.json_output) if args.json_output else None
        result_file = validator.export_results(results, json_output)

        # Print summary to console
        print("\n" + "="*80)
        print(f"NASA POT10 COMPLIANCE VALIDATION SUMMARY - {args.project}")
        print("="*80)

        nasa_compliance = results.get('nasa_compliance', {})
        defense_cert = results.get('defense_certification', {})
        summary = results.get('validation_summary', {})

        print(f"NASA POT10 Compliance Score: {nasa_compliance.get('compliance_score', 'N/A'):.1f}%")
        print(f"Defense Certification Score: {defense_cert.get('overall_score', 'N/A'):.1f}%")
        print(f"Total Violations: {nasa_compliance.get('total_violations', 'N/A')}")
        print(f"Validation Duration: {summary.get('duration_seconds', 'N/A'):.1f} seconds")
        print(f"Overall Success: {' YES' if summary.get('overall_success') else ' NO'}")
        print(f"Target Achieved: {' YES' if summary.get('target_compliance_achieved') else ' NO'}")

        if args.fix and 'fixes_applied' in results:
            fixes = results['fixes_applied']
            print(f"\nAutomated Fixes Applied: {fixes.get('fixed_count', 0)}")
            print(f"Fixes Failed: {fixes.get('failed_count', 0)}")
            print(f"Manual Review Required: {fixes.get('manual_review_count', 0)}")

        if args.report and 'reports_generated' in results:
            print(f"\nReports Generated:")
            reports = results['reports_generated'].get('report_files', {})
            for report_type, file_path in reports.items():
                print(f"  {report_type.upper()}: {file_path}")

        # Print action items
        actions = summary.get('recommended_actions', [])
        if actions:
            print(f"\nRecommended Actions:")
            for i, action in enumerate(actions, 1):
                print(f"  {i}. [{action['priority']}] {action['action']}")
                print(f"     Estimated effort: {action['estimated_effort']}")

        print(f"\nDetailed results saved to: {result_file}")
        print("="*80)

        # Return appropriate exit code
        if summary.get('target_compliance_achieved'):
            return 0  # Success: 95%+ compliance achieved
        elif summary.get('overall_success'):
            return 1  # Partial success: Above minimum thresholds
        else:
            return 2  # Failure: Below minimum thresholds

    except KeyboardInterrupt:
        logger.info("Validation interrupted by user")
        return 130
    except Exception as e:
        logger.error(f"Validation failed with unexpected error: {e}")
        return 3

if __name__ == '__main__':
    from datetime import timedelta
    sys.exit(main())