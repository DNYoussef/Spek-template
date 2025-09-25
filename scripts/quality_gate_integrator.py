from src.constants.base import REGULATORY_FACTUALITY_REQUIREMENT, THEATER_DETECTION_WARNING_THRESHOLD
"""

Features:
- CI/CD workflow integration 
- Quality orchestrator coordination
- Automated quality gate decisions
- Deployment readiness assessment
- Defense industry compliance validation
- Reality validation integration
"""

import json
import yaml
import sys
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import subprocess
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

class QualityGateIntegrator:
    """Integrates quality gate validation with CI/CD and orchestration systems."""
    
    def __init__(self, base_path: str = None):
        """Initialize integrator."""
        self.base_path = Path(base_path or os.getcwd())
        self.artifacts_path = self.base_path / ".claude" / ".artifacts"
        self.config = self._load_config()
        
    def _load_config(self) -> Dict[str, Any]:
        """Load quality gate configuration."""
        config_path = self.base_path / "configs" / "quality_gate_mappings.yaml"
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning(f"Config not found: {config_path}, using defaults")
            return self._default_config()
            
    def _default_config(self) -> Dict[str, Any]:
        """Default configuration fallback."""
        return {
            'thresholds': {
                'nasa_compliance': {'value': REGULATORY_FACTUALITY_REQUIREMENT, 'critical': True},
                'god_objects': {'value': 2, 'critical': True},
                'critical_violations': {'value': 0, 'critical': True},
                'mece_score': {'value': THEATER_DETECTION_WARNING_THRESHOLD, 'critical': False}
            }
        }
        
    def validate_deployment_readiness(self) -> Dict[str, Any]:
        """Comprehensive deployment readiness assessment."""
        logger.info("Starting deployment readiness validation...")
        
        # Run JSON validator
        validation_results = self._run_json_validator()
        
        # Load latest quality gates report
        quality_gates = self._load_quality_gates_report()
        
        # Check critical systems
        critical_systems = self._check_critical_systems()
        
        # NASA compliance verification
        nasa_status = self._verify_nasa_compliance()
        
        # Defense industry readiness
        defense_ready = self._assess_defense_readiness(nasa_status)
        
        # Generate deployment decision
        deployment_decision = self._make_deployment_decision(
            validation_results,
            quality_gates, 
            critical_systems,
            nasa_status,
            defense_ready
        )
        
        return deployment_decision
        
    def _run_json_validator(self) -> Dict[str, Any]:
        """Run JSON validator and return results."""
        try:
            validator_path = self.base_path / "scripts" / "json_validator.py"
            result = subprocess.run([
                sys.executable, str(validator_path),
                "--path", str(self.base_path)
            ], capture_output=True, text=True, timeout=300)
            
            # Load validation report
            report_path = self.artifacts_path / "json_validation_report.json"
            if report_path.exists():
                with open(report_path, 'r') as f:
                    return json.load(f)
            else:
                return {'validation_summary': {'passed': 0, 'failed': 1, 'pass_rate': 0}}
                
        except Exception as e:
            logger.error(f"JSON validation failed: {e}")
            return {'validation_summary': {'passed': 0, 'failed': 1, 'pass_rate': 0}}
            
    def _load_quality_gates_report(self) -> Dict[str, Any]:
        """Load latest quality gates report."""
        report_path = self.artifacts_path / "quality_gates_report.json"
        try:
            with open(report_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning("Quality gates report not found")
            return {'quality_gates': {'overall_gate_passed': False}}
            
    def _check_critical_systems(self) -> Dict[str, bool]:
        """Check status of critical systems."""
        critical_systems = {
            'tests_pass': self._check_tests(),
            'typescript_compile': self._check_typescript(),
            'security_scan': self._check_security(),
            'linting_pass': self._check_linting()
        }
        
        logger.info(f"Critical systems status: {critical_systems}")
        return critical_systems
        
    def _check_tests(self) -> bool:
        """Check if all tests pass."""
        try:
            result = subprocess.run(['npm', 'test'], cwd=self.base_path, 
                                    capture_output=True, text=True, timeout=300)
            return result.returncode == 0
        except Exception:
            return False
            
    def _check_typescript(self) -> bool:
        """Check TypeScript compilation."""
        try:
            result = subprocess.run(['npm', 'run', 'typecheck'], cwd=self.base_path,
                                    capture_output=True, text=True, timeout=180)
            return result.returncode == 0
        except Exception:
            return False
            
    def _check_security(self) -> bool:
        """Check security scan status."""
        security_report = self.artifacts_path / "security" / "security_gates_report.json"
        try:
            with open(security_report, 'r') as f:
                data = json.load(f)
                return data.get('overall_security_score', 0) >= 0.8
        except Exception:
            return False
            
    def _check_linting(self) -> bool:
        """Check linting status."""
        try:
            result = subprocess.run(['npm', 'run', 'lint'], cwd=self.base_path,
                                    capture_output=True, text=True, timeout=120)
            return result.returncode == 0
        except Exception:
            return False
            
    def _verify_nasa_compliance(self) -> Dict[str, Any]:
        """Verify NASA POT10 compliance status."""
        nasa_report = self.artifacts_path / "nasa-compliance" / "baseline_assessment.json"
        try:
            with open(nasa_report, 'r') as f:
                data = json.load(f)
                compliance_score = data.get('nasa_pot10_compliance', {}).get('overall_score', 0)
                return {
                    'score': compliance_score,
                    'passing': compliance_score >= REGULATORY_FACTUALITY_REQUIREMENT,
                    'defense_threshold': compliance_score >= 0.92,
                    'certification_ready': data.get('nasa_pot10_compliance', {}).get('certification_ready', False)
                }
        except Exception as e:
            logger.warning(f"NASA compliance check failed: {e}")
            return {'score': 0.0, 'passing': False, 'defense_threshold': False}
            
    def _assess_defense_readiness(self, nasa_status: Dict[str, Any]) -> Dict[str, Any]:
        """Assess defense industry readiness."""
        # Load multiple compliance reports
        reports = [
            self.artifacts_path / "connascence_full.json",
            self.artifacts_path / "mece_analysis.json", 
            self.artifacts_path / "god_objects.json"
        ]
        
        compliance_scores = []
        for report_path in reports:
            if report_path.exists():
                try:
                    with open(report_path, 'r') as f:
                        data = json.load(f)
                        if 'nasa_compliance' in data:
                            score = data['nasa_compliance'].get('score', 0)
                            compliance_scores.append(score)
                except Exception:
                    continue
                    
        avg_compliance = sum(compliance_scores) / len(compliance_scores) if compliance_scores else 0
        
        return {
            'nasa_score': nasa_status.get('score', 0),
            'avg_compliance': avg_compliance,
            'defense_ready': (nasa_status.get('score', 0) >= 0.92 and avg_compliance >= REGULATORY_FACTUALITY_REQUIREMENT),
            'certification_eligible': nasa_status.get('certification_ready', False)
        }
        
    def _make_deployment_decision(self, validation_results: Dict[str, Any],
                                quality_gates: Dict[str, Any], 
                                critical_systems: Dict[str, bool],
                                nasa_status: Dict[str, Any],
                                defense_ready: Dict[str, Any]) -> Dict[str, Any]:
        """Make final deployment decision based on all criteria."""
        
        # Extract key metrics
        json_validation_passed = validation_results.get('quality_gates', {}).get('overall_gate_passed', False)
        quality_gates_passed = quality_gates.get('quality_gates', {}).get('overall_gate_passed', False) or quality_gates.get('multi_tier_results', {}).get('critical_gates', {}).get('passed', False)
        all_critical_systems_pass = all(critical_systems.values())
        nasa_compliant = nasa_status.get('passing', False)
        defense_industry_ready = defense_ready.get('defense_ready', False)
        
        # Blocking conditions
        blocking_issues = []
        if not json_validation_passed:
            blocking_issues.append("JSON validation failed")
        if not quality_gates_passed:
            blocking_issues.append("Quality gates failed")  
        if not all_critical_systems_pass:
            failed_systems = [k for k, v in critical_systems.items() if not v]
            blocking_issues.append(f"Critical systems failed: {', '.join(failed_systems)}")
        if not nasa_compliant:
            blocking_issues.append(f"NASA compliance insufficient: {nasa_status.get('score', 0):.1%}")
            
        # Deployment decision matrix
        can_deploy = len(blocking_issues) == 0
        can_deploy_defense = can_deploy and defense_industry_ready
        
        # Determine deployment environment
        if can_deploy_defense:
            deployment_env = "DEFENSE_PRODUCTION"
        elif can_deploy:
            deployment_env = "COMMERCIAL_PRODUCTION"  
        else:
            deployment_env = "BLOCKED"
            
        # Generate recommendations
        recommendations = []
        if not json_validation_passed:
            recommendations.append("Fix JSON validation issues in artifacts")
        if not nasa_compliant:
            recommendations.append(f"Improve NASA compliance from {nasa_status.get('score', 0):.1%} to >=90%")
        if not defense_industry_ready and nasa_compliant:
            recommendations.append("Complete defense industry certification requirements")
            
        decision = {
            'timestamp': datetime.now().isoformat(),
            'deployment_decision': {
                'can_deploy': can_deploy,
                'deployment_environment': deployment_env,
                'blocking_issues_count': len(blocking_issues),
                'defense_industry_ready': defense_industry_ready
            },
            'quality_summary': {
                'json_validation_passed': json_validation_passed,
                'quality_gates_passed': quality_gates_passed,
                'critical_systems_passed': all_critical_systems_pass,
                'nasa_compliance_score': nasa_status.get('score', 0),
                'defense_readiness_score': defense_ready.get('avg_compliance', 0)
            },
            'blocking_issues': blocking_issues,
            'recommendations': recommendations,
            'next_steps': self._generate_next_steps(blocking_issues, nasa_status),
            'compliance_details': {
                'nasa_pot10': nasa_status,
                'defense_industry': defense_ready,
                'critical_systems': critical_systems
            }
        }
        
        # Save decision report
        self._save_deployment_decision(decision)
        
        return decision
        
    def _generate_next_steps(self, blocking_issues: List[str], nasa_status: Dict[str, Any]) -> List[str]:
        """Generate actionable next steps."""
        next_steps = []
        
        if "JSON validation failed" in str(blocking_issues):
            next_steps.append("Run: python scripts/json_validator.py --fix")
            
        if "Quality gates failed" in str(blocking_issues):
            next_steps.append("Execute quality gate fixes: npm run qa:fix")
            
        if "Critical systems failed" in str(blocking_issues):
            next_steps.append("Fix failing tests and compilation issues")
            
        if nasa_status.get('score', 0) < 0.90:
            next_steps.append("Execute NASA compliance improvement: /codex:micro NASA rule violations")
            
        if not next_steps:
            next_steps.append("System ready for deployment - execute deployment pipeline")
            
        return next_steps
        
    def _save_deployment_decision(self, decision: Dict[str, Any]):
        """Save deployment decision to artifacts."""
        output_path = self.artifacts_path / "deployment_readiness_assessment.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(decision, f, indent=2, ensure_ascii=False)
        logger.info(f"Deployment decision saved: {output_path}")
        
    def integrate_with_github_workflows(self) -> Dict[str, Any]:
        """Generate GitHub workflow integration configuration."""
        workflow_integration = {
            'quality_gate_steps': [
                {
                    'name': 'Validate JSON Artifacts',
                    'run': 'python scripts/json_validator.py --path . --fix',
                    'continue-on-error': False
                },
                {
                    'name': 'Check Quality Gates',
                    'run': 'python scripts/quality_gate_integrator.py --validate',
                    'continue-on-error': False
                },
                {
                    'name': 'Assess Deployment Readiness',
                    'run': 'python scripts/quality_gate_integrator.py --deploy-check',
                    'continue-on-error': False
                }
            ],
            'quality_gates': {
                'required_checks': [
                    'json_validation',
                    'nasa_compliance', 
                    'critical_systems',
                    'security_scan'
                ],
                'blocking_thresholds': {
                    'nasa_compliance_score': REGULATORY_FACTUALITY_REQUIREMENT,
                    'critical_violations': 0,
                    'pass_rate': 95.0
                }
            },
            'deployment_environments': {
                'commercial': {
                    'required_score': 0.90,
                    'required_gates': ['json_validation', 'quality_gates', 'tests']
                },
                'defense': {
                    'required_score': 0.92,
                    'required_gates': ['json_validation', 'quality_gates', 'tests', 'nasa_compliance', 'security_scan']
                }
            }
        }
        
        output_path = self.artifacts_path / "github_workflow_integration.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(workflow_integration, f, indent=2, ensure_ascii=False)
            
        return workflow_integration

def main():
    """Main CLI interface."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Quality Gate Integration System")
    parser.add_argument("--validate", action="store_true", help="Run quality gate validation")
    parser.add_argument("--deploy-check", action="store_true", help="Check deployment readiness")
    parser.add_argument("--github-integration", action="store_true", help="Generate GitHub workflow integration")
    parser.add_argument("--path", help="Base path (default: current directory)")
    
    args = parser.parse_args()
    
    integrator = QualityGateIntegrator(args.path)
    
    if args.validate or args.deploy_check:
        results = integrator.validate_deployment_readiness()
        
        print("=== Deployment Readiness Assessment ===")
        decision = results.get('deployment_decision', {})
        print(f"Can Deploy: {decision.get('can_deploy', False)}")
        print(f"Environment: {decision.get('deployment_environment', 'UNKNOWN')}")
        print(f"Defense Ready: {decision.get('defense_industry_ready', False)}")
        
        quality = results.get('quality_summary', {})
        print(f"\\nQuality Summary:")
        print(f"  NASA Compliance: {quality.get('nasa_compliance_score', 0):.1%}")
        print(f"  JSON Validation: {'PASS' if quality.get('json_validation_passed') else 'FAIL'}")
        print(f"  Quality Gates: {'PASS' if quality.get('quality_gates_passed') else 'FAIL'}")
        print(f"  Critical Systems: {'PASS' if quality.get('critical_systems_passed') else 'FAIL'}")
        
        blocking_issues = results.get('blocking_issues', [])
        if blocking_issues:
            print(f"\\nBlocking Issues ({len(blocking_issues)}):")
            for issue in blocking_issues:
                print(f"  - {issue}")
                
        next_steps = results.get('next_steps', [])
        if next_steps:
            print(f"\\nNext Steps:")
            for step in next_steps:
                print(f"  - {step}")
                
        # Exit with appropriate code
        sys.exit(0 if decision.get('can_deploy', False) else 1)
        
    elif args.github_integration:
        integration = integrator.integrate_with_github_workflows()
        print("GitHub workflow integration generated successfully")
        sys.exit(0)
        
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == '__main__':
    main()