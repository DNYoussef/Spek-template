from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES

import asyncio
import json
import sys
import argparse
from pathlib import Path
from datetime import datetime
import logging

# Import the existing NIST-SSDF validator
sys.path.append(str(Path(__file__).parent.parent.parent / 'analyzer' / 'enterprise' / 'compliance'))
from nist_ssdf import NISTSSDFPracticeValidator

class NISTSSDFCLIAdapter:
    """Command-line adapter for NIST-SSDF compliance validation"""
    
    def __init__(self, config=None):
        self.config = config or {}
        self.logger = self._setup_logging()
        
    def _setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        return logging.getLogger(__name__)
        
    async def validate_compliance(self, project_path, output_dir, audit_hash, evidence_collection=True):
        """Run NIST-SSDF compliance validation"""
        
        # Configure the validator
        validator_config = {
            'artifacts_path': output_dir,
            'project_path': project_path,
            'evidence_collection': evidence_collection,
            'audit_hash': audit_hash,
            **self.config
        }
        
        validator = NISTSSDFPracticeValidator(validator_config)
        
        try:
            # Run the analysis
            self.logger.info(f"Starting NIST-SSDF compliance analysis for {project_path}")
            results = await validator.analyze_compliance(project_path)
            
            if results.get('status') == 'error':
                self.logger.error(f"Analysis failed: {results.get('error')}")
                return False
                
            # Calculate compliance score
            compliance_score = results.get('overall_compliance_score', 0.0) / 60.0
            
            # Create standardized output for GitHub Actions workflow
            standardized_results = {
                'framework': 'NIST-SSDF',
                'version': '1.1',
                'timestamp': results.get('analysis_timestamp'),
                'overall_score': compliance_score,
                'total_findings': len([
                    gap for gap in results.get('gap_analysis', {}).get('detailed_gaps', [])
                ]),
                'audit_hash': audit_hash,
                'practices_assessed': results.get('practices_assessed', 0),
                'implementation_tier': results.get('implementation_tier', {}).get('overall_implementation_tier', 1),
                'maturity_level': results.get('maturity_assessment', {}).get('overall_maturity', 'initial'),
                'compliance_matrix': results.get('compliance_matrix', {}),
                'gap_analysis': results.get('gap_analysis', {}),
                'recommendations': results.get('recommendations', []),
                'evidence_summary': {
                    'total_practices': results.get('practices_assessed', 0),
                    'evidence_collected': evidence_collection,
                    'implementation_roadmap': results.get('gap_analysis', {}).get('implementation_roadmap', [])
                }
            }
            
            # Write standardized compliance score file
            score_file = Path(output_dir) / 'compliance-score.json'
            with open(score_file, 'w') as f:
                json.dump(standardized_results, f, indent=2, default=str)
                
            # Generate markdown report
            report_file = Path(output_dir) / 'nist-ssdf-compliance-report.md'
            markdown_report = self._generate_markdown_report(standardized_results)
            with open(report_file, 'w') as f:
                f.write(markdown_report)
                
            self.logger.info(f"NIST-SSDF compliance score: {compliance_score:.3f} ({compliance_score*MAXIMUM_FUNCTION_LENGTH_LINES:.1f}%)")
            self.logger.info(f"Implementation tier: {standardized_results['implementation_tier']}")
            self.logger.info(f"Maturity level: {standardized_results['maturity_level']}")
            
            # Return True if compliance meets threshold (95%)
            return compliance_score >= 0.95
            
        except Exception as e:
            self.logger.error(f"NIST-SSDF validation failed: {str(e)}")
            return False
            
    def _generate_markdown_report(self, results):
        """Generate markdown compliance report"""
        timestamp = results.get('timestamp', datetime.now().isoformat())
        score_percentage = results.get('overall_score', 0) * 100
        
        report = f"""# NIST-SSDF v1.1 Compliance Report

**Generated:** {timestamp}
**Framework Version:** {results.get('version', '1.1')}
**Overall Score:** {score_percentage:.1f}%
**Implementation Tier:** {results.get('implementation_tier', 1)}
**Maturity Level:** {results.get('maturity_level', 'initial').title()}
**Total Findings:** {results.get('total_findings', 0)}
**Audit Hash:** {results.get('audit_hash', 'N/A')}

## Executive Summary

{self._get_compliance_status_message(results.get('overall_score', 0))}

**Practices Assessed:** {results.get('practices_assessed', 0)}
**Current Implementation Tier:** {results.get('implementation_tier', 1)} of 4
**Maturity Assessment:** {results.get('maturity_level', 'initial').title()}

## Practice Group Compliance

"""
        
        # Add compliance matrix if available
        compliance_matrix = results.get('compliance_matrix', {})
        if compliance_matrix.get('practice_groups'):
            report += "| Practice Group | Name | Compliance | Implemented | Total | Avg Tier |\n"
            report += "|---------------|------|------------|-------------|--------|----------|\n"
            
            group_names = {
                'PO': 'Prepare the Organization',
                'PS': 'Protect the Software', 
                'PW': 'Produce Well-Secured Software',
                'RV': 'Respond to Vulnerabilities'
            }
            
            for group, details in compliance_matrix.get('practice_groups', {}).items():
                name = group_names.get(group, group)
                compliance_pct = details.get('compliance_percentage', 0)
                implemented = details.get('implemented', 0)
                total = details.get('total', 0)
                avg_tier = details.get('average_tier', 1)
                
                status = "[OK]" if compliance_pct >= 95 else "[WARN]" if compliance_pct >= 70 else "[FAIL]"
                
                report += f"| {group} | {name} | {status} {compliance_pct:.1f}% | {implemented} | {total} | {avg_tier} |\n"
                
        # Add gap analysis
        gap_analysis = results.get('gap_analysis', {})
        if gap_analysis.get('total_gaps', 0) > 0:
            report += f"\n## Gap Analysis Summary\n\n"
            report += f"**Total Gaps Identified:** {gap_analysis.get('total_gaps', 0)}\n\n"
            
            gaps_by_priority = gap_analysis.get('gaps_by_priority', {})
            if gaps_by_priority:
                report += f"- **High Priority:** {gaps_by_priority.get('high', 0)} gaps\n"
                report += f"- **Medium Priority:** {gaps_by_priority.get('medium', 0)} gaps\n" 
                report += f"- **Low Priority:** {gaps_by_priority.get('low', 0)} gaps\n\n"
                
        # Add recommendations
        recommendations = results.get('recommendations', [])
        if recommendations:
            report += "## Recommendations\n\n"
            for i, rec in enumerate(recommendations, 1):
                report += f"{i}. {rec}\n"
                
        # Add implementation roadmap
        roadmap = results.get('evidence_summary', {}).get('implementation_roadmap', [])
        if roadmap:
            report += "\n## Implementation Roadmap\n\n"
            for phase in roadmap:
                report += f"### Phase {phase.get('phase', '')}: {phase.get('title', '')}\n"
                report += f"**Duration:** {phase.get('duration_weeks', 0)} weeks\n"
                report += f"**Focus:** {phase.get('focus', '')}\n"
                report += f"**Success Criteria:** {phase.get('success_criteria', '')}\n\n"
                
        report += f"\n---\n*This report was generated by the NIST-SSDF Compliance Engine v1.1*\n"
        
        return report
        
    def _get_compliance_status_message(self, score):
        """Get compliance status message based on score"""
        if score >= 0.95:
            return "[OK] **COMPLIANT** - Organization meets NIST-SSDF v1.1 requirements."
        elif score >= 0.75:
            return "[WARN] **PARTIALLY COMPLIANT** - Organization shows good progress but requires improvements."
        elif score >= 0.50:
            return " **DEVELOPING** - Organization has basic practices in place but significant gaps remain."
        else:
            return "[FAIL] **NON-COMPLIANT** - Organization requires substantial improvements to meet NIST-SSDF requirements."

def main():
    """Command-line entry point"""
    parser = argparse.ArgumentParser(description='NIST-SSDF Compliance Validation Engine')
    parser.add_argument('--config', help='Configuration file path')
    parser.add_argument('--output-dir', required=True, help='Output directory for reports')
    parser.add_argument('--audit-hash', help='Audit hash for traceability')
    parser.add_argument('--evidence-collection', type=str, default='true', 
                        choices=['true', 'false'], help='Enable evidence collection')
    parser.add_argument('--project-path', default='.', help='Project path to analyze')
    
    args = parser.parse_args()
    
    # Load configuration if provided
    config = {}
    if args.config:
        try:
            with open(args.config, 'r') as f:
                config = json.load(f)
        except Exception as e:
            print(f"Warning: Could not load config file {args.config}: {e}", file=sys.stderr)
            
    # Create adapter and run validation
    adapter = NISTSSDFCLIAdapter(config)
    evidence_collection = args.evidence_collection.lower() == 'true'
    
    # Run async validation
    try:
        result = asyncio.run(adapter.validate_compliance(
            args.project_path,
            args.output_dir, 
            args.audit_hash,
            evidence_collection
        ))
        
        # Exit with appropriate code
        sys.exit(0 if result else 1)
        
    except Exception as e:
        print(f"NIST-SSDF validation failed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()