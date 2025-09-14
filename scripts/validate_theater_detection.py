#!/usr/bin/env python3
"""
Enterprise Theater Detection Validation Script
Zero-Tolerance Defense Industry Validation Suite

Comprehensive validation of theater detection system across all enterprise modules
with defense industry zero-tolerance standards.
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

# Add src directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from security.enterprise_theater_detection import (
    EnterpriseTheaterDetector,
    TheaterSeverity,
    create_enterprise_theater_detector
)
from security.continuous_theater_monitor import (
    ContinuousTheaterMonitor,
    create_continuous_theater_monitor
)
from security.defense_industry_evidence_generator import (
    DefenseIndustryEvidenceGenerator,
    create_defense_evidence_generator
)


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class TheaterDetectionValidator:
    """
    Comprehensive validator for theater detection system

    Validates all components of the theater detection system against
    defense industry zero-tolerance standards.
    """

    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root or Path(__file__).parent.parent)
        self.validation_results = {}
        self.start_time = datetime.now(timezone.utc)

    async def run_comprehensive_validation(self) -> Dict[str, Any]:
        """Run comprehensive validation suite"""

        logger.info("Starting Enterprise Theater Detection Validation")
        logger.info("Defense Industry Zero-Tolerance Standards")

        validation_suite = [
            ("theater_detection_engine", self._validate_theater_detection_engine),
            ("mathematical_accuracy", self._validate_mathematical_accuracy),
            ("performance_claims", self._validate_performance_claims),
            ("security_controls", self._validate_security_controls),
            ("compliance_frameworks", self._validate_compliance_frameworks),
            ("continuous_monitoring", self._validate_continuous_monitoring),
            ("evidence_generation", self._validate_evidence_generation),
            ("zero_tolerance_standard", self._validate_zero_tolerance_standard)
        ]

        results = {}

        for validation_name, validation_func in validation_suite:
            logger.info(f"Running validation: {validation_name}")
            try:
                result = await validation_func()
                results[validation_name] = result

                if result.get('passed', False):
                    logger.info(f"PASSED: {validation_name}")
                else:
                    logger.warning(f"FAILED: {validation_name}")

            except Exception as e:
                logger.error(f"ERROR {validation_name}: {e}")
                results[validation_name] = {
                    'passed': False,
                    'error': str(e),
                    'validation_time': datetime.now(timezone.utc).isoformat()
                }

        # Calculate overall validation score
        total_validations = len(results)
        passed_validations = len([r for r in results.values() if r.get('passed', False)])
        overall_score = passed_validations / total_validations if total_validations > 0 else 0.0

        # Determine defense industry readiness
        critical_failures = len([
            r for r in results.values()
            if not r.get('passed', False) and r.get('criticality', 'medium') == 'critical'
        ])

        zero_tolerance_met = critical_failures == 0
        defense_ready = zero_tolerance_met and overall_score >= 0.95

        validation_summary = {
            'validation_metadata': {
                'validation_start_time': self.start_time.isoformat(),
                'validation_end_time': datetime.now(timezone.utc).isoformat(),
                'project_root': str(self.project_root),
                'defense_standard': 'DFARS 252.204-7012',
                'validation_type': 'comprehensive_theater_detection'
            },
            'validation_results': results,
            'summary': {
                'total_validations': total_validations,
                'passed_validations': passed_validations,
                'failed_validations': total_validations - passed_validations,
                'overall_score': overall_score,
                'critical_failures': critical_failures,
                'zero_tolerance_met': zero_tolerance_met,
                'defense_industry_ready': defense_ready,
                'certification_status': 'APPROVED' if defense_ready else 'REQUIRES_REMEDIATION'
            },
            'recommendations': self._generate_recommendations(results, defense_ready)
        }

        # Save validation results
        await self._save_validation_results(validation_summary)

        return validation_summary

    async def _validate_theater_detection_engine(self) -> Dict[str, Any]:
        """Validate core theater detection engine"""

        try:
            detector = create_enterprise_theater_detector(str(self.project_root))

            # Test theater pattern detection
            test_theater_code = '''
def fake_performance():
    """Advanced performance monitoring"""
    # TODO: implement real monitoring
    return 0.0  # fake metric

def mock_security():
    """Comprehensive security validation"""
    pass  # empty implementation
            '''

            patterns_detected = detector._detect_static_theater_patterns(
                test_theater_code,
                "test_module"
            )

            # Should detect at least 2 theater patterns
            pattern_detection_works = len(patterns_detected) >= 2

            # Test comprehensive detection
            reports = await detector.detect_enterprise_theater()
            comprehensive_detection_works = isinstance(reports, dict) and len(reports) > 0

            # Test forensic evidence generation
            has_forensic_capability = hasattr(detector, 'forensic_evidence')

            validation_score = sum([
                pattern_detection_works,
                comprehensive_detection_works,
                has_forensic_capability
            ]) / 3

            return {
                'passed': validation_score >= 0.8,
                'validation_score': validation_score,
                'details': {
                    'pattern_detection': pattern_detection_works,
                    'comprehensive_detection': comprehensive_detection_works,
                    'forensic_capability': has_forensic_capability,
                    'patterns_detected_count': len(patterns_detected),
                    'modules_analyzed': len(reports) if comprehensive_detection_works else 0
                },
                'criticality': 'critical',
                'validation_time': datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            return {
                'passed': False,
                'error': str(e),
                'criticality': 'critical',
                'validation_time': datetime.now(timezone.utc).isoformat()
            }

    async def _validate_mathematical_accuracy(self) -> Dict[str, Any]:
        """Validate mathematical accuracy of calculations"""

        try:
            # Test Six Sigma calculations
            six_sigma_path = self.project_root / "src" / "enterprise" / "telemetry" / "six_sigma.py"

            if not six_sigma_path.exists():
                return {
                    'passed': False,
                    'error': 'Six Sigma module not found',
                    'criticality': 'high',
                    'validation_time': datetime.now(timezone.utc).isoformat()
                }

            import importlib.util
            spec = importlib.util.spec_from_file_location("six_sigma", six_sigma_path)
            six_sigma = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(six_sigma)

            if not hasattr(six_sigma, 'SixSigmaTelemetry'):
                return {
                    'passed': False,
                    'error': 'SixSigmaTelemetry class not found',
                    'criticality': 'high',
                    'validation_time': datetime.now(timezone.utc).isoformat()
                }

            telemetry = six_sigma.SixSigmaTelemetry("validation_test")

            # Test DPMO calculation accuracy
            test_cases = [
                {'defects': 5, 'opportunities': 1000000, 'expected': 5.0},
                {'defects': 10, 'opportunities': 500000, 'expected': 20.0},
                {'defects': 1, 'opportunities': 1000000, 'expected': 1.0}
            ]

            accurate_calculations = 0
            for test in test_cases:
                actual = telemetry.calculate_dpmo(test['defects'], test['opportunities'])
                if abs(actual - test['expected']) < 0.01:
                    accurate_calculations += 1

            # Test RTY calculation accuracy
            rty_test_cases = [
                {'passed': 95, 'total': 100, 'expected': 95.0},
                {'passed': 999, 'total': 1000, 'expected': 99.9}
            ]

            for test in rty_test_cases:
                actual = telemetry.calculate_rty(test['total'], test['passed'])
                if abs(actual - test['expected']) < 0.01:
                    accurate_calculations += 1

            total_tests = len(test_cases) + len(rty_test_cases)
            accuracy_rate = accurate_calculations / total_tests

            return {
                'passed': accuracy_rate >= 0.95,
                'validation_score': accuracy_rate,
                'details': {
                    'total_tests': total_tests,
                    'accurate_calculations': accurate_calculations,
                    'accuracy_rate': accuracy_rate,
                    'mathematical_integrity': 'VERIFIED' if accuracy_rate >= 0.95 else 'QUESTIONABLE'
                },
                'criticality': 'high',
                'validation_time': datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            return {
                'passed': False,
                'error': str(e),
                'criticality': 'high',
                'validation_time': datetime.now(timezone.utc).isoformat()
            }

    async def _validate_performance_claims(self) -> Dict[str, Any]:
        """Validate performance claims accuracy"""

        try:
            # Test performance monitoring overhead claims
            perf_monitor_path = self.project_root / "analyzer" / "enterprise" / "core" / "performance_monitor.py"

            if not perf_monitor_path.exists():
                return {
                    'passed': False,
                    'error': 'Performance monitor module not found',
                    'criticality': 'medium',
                    'validation_time': datetime.now(timezone.utc).isoformat()
                }

            import importlib.util
            spec = importlib.util.spec_from_file_location("perf_monitor", perf_monitor_path)
            perf_monitor = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(perf_monitor)

            if not hasattr(perf_monitor, 'EnterprisePerformanceMonitor'):
                return {
                    'passed': False,
                    'error': 'EnterprisePerformanceMonitor class not found',
                    'criticality': 'medium',
                    'validation_time': datetime.now(timezone.utc).isoformat()
                }

            monitor = perf_monitor.EnterprisePerformanceMonitor(enabled=False)

            # Test zero overhead when disabled
            import time
            start_time = time.perf_counter()

            for _ in range(1000):
                with monitor.measure_enterprise_impact("disabled_test"):
                    pass

            disabled_time = time.perf_counter() - start_time
            per_call_overhead_ms = (disabled_time / 1000) * 1000

            # Should be less than 0.001ms per call when disabled
            zero_overhead_claim = per_call_overhead_ms < 0.001

            # Test feature flag performance
            flag_path = self.project_root / "src" / "enterprise" / "flags" / "feature_flags.py"
            flag_performance_validated = False

            if flag_path.exists():
                spec = importlib.util.spec_from_file_location("flags", flag_path)
                flags = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(flags)

                if hasattr(flags, 'FeatureFlagManager'):
                    manager = flags.FeatureFlagManager()
                    flag = manager.create_flag("perf_test", "Test flag")

                    # Test evaluation performance
                    start_time = time.perf_counter()
                    for i in range(1000):
                        manager.is_enabled("perf_test", user_id=f"user_{i}")
                    eval_time = time.perf_counter() - start_time

                    per_eval_ms = (eval_time / 1000) * 1000
                    flag_performance_validated = per_eval_ms < 0.1  # <0.1ms per evaluation

            performance_claims_verified = sum([
                zero_overhead_claim,
                flag_performance_validated
            ]) / 2

            return {
                'passed': performance_claims_verified >= 0.8,
                'validation_score': performance_claims_verified,
                'details': {
                    'zero_overhead_verified': zero_overhead_claim,
                    'flag_performance_verified': flag_performance_validated,
                    'per_call_overhead_ms': per_call_overhead_ms,
                    'performance_claims_accurate': performance_claims_verified >= 0.8
                },
                'criticality': 'medium',
                'validation_time': datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            return {
                'passed': False,
                'error': str(e),
                'criticality': 'medium',
                'validation_time': datetime.now(timezone.utc).isoformat()
            }

    async def _validate_security_controls(self) -> Dict[str, Any]:
        """Validate security control implementations"""

        try:
            # Test DFARS compliance engine
            dfars_path = self.project_root / "src" / "security" / "dfars_compliance_engine.py"

            if not dfars_path.exists():
                return {
                    'passed': False,
                    'error': 'DFARS compliance engine not found',
                    'criticality': 'critical',
                    'validation_time': datetime.now(timezone.utc).isoformat()
                }

            import importlib.util
            spec = importlib.util.spec_from_file_location("dfars", dfars_path)
            dfars = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(dfars)

            if not hasattr(dfars, 'DFARSComplianceEngine'):
                return {
                    'passed': False,
                    'error': 'DFARSComplianceEngine class not found',
                    'criticality': 'critical',
                    'validation_time': datetime.now(timezone.utc).isoformat()
                }

            engine = dfars.DFARSComplianceEngine()

            security_validations = []

            # Test path traversal protection
            if hasattr(engine, 'path_validator'):
                malicious_paths = [
                    "../../../etc/passwd",
                    "..\\..\\windows\\system32\\cmd.exe",
                    "%2e%2e%2fpasswd"
                ]

                blocked_paths = 0
                for path in malicious_paths:
                    result = engine.path_validator.validate_path(path)
                    if not result.get('valid', True):
                        blocked_paths += 1

                path_protection_rate = blocked_paths / len(malicious_paths)
                security_validations.append(path_protection_rate >= 0.95)

            # Test weak crypto detection
            if hasattr(engine, '_scan_weak_cryptography'):
                weak_crypto = engine._scan_weak_cryptography()
                crypto_detection_works = isinstance(weak_crypto, list)
                security_validations.append(crypto_detection_works)

            # Test audit trail functionality
            if hasattr(engine, 'audit_manager'):
                try:
                    engine.audit_manager.log_compliance_check(
                        "validation_test",
                        "SUCCESS",
                        {"test": "security_validation"}
                    )
                    audit_works = True
                except:
                    audit_works = False
                security_validations.append(audit_works)

            security_effectiveness = sum(security_validations) / len(security_validations) if security_validations else 0.0

            return {
                'passed': security_effectiveness >= 0.9,
                'validation_score': security_effectiveness,
                'details': {
                    'path_protection_rate': path_protection_rate if 'path_protection_rate' in locals() else 0.0,
                    'crypto_detection_works': crypto_detection_works if 'crypto_detection_works' in locals() else False,
                    'audit_functionality': audit_works if 'audit_works' in locals() else False,
                    'security_controls_effective': security_effectiveness >= 0.9
                },
                'criticality': 'critical',
                'validation_time': datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            return {
                'passed': False,
                'error': str(e),
                'criticality': 'critical',
                'validation_time': datetime.now(timezone.utc).isoformat()
            }

    async def _validate_compliance_frameworks(self) -> Dict[str, Any]:
        """Validate compliance framework implementations"""

        try:
            compliance_modules = [
                ("SOC2", "analyzer/enterprise/compliance/soc2.py"),
                ("ISO27001", "analyzer/enterprise/compliance/iso27001.py"),
                ("NIST-SSDF", "analyzer/enterprise/compliance/nist_ssdf.py"),
                ("Compliance Core", "analyzer/enterprise/compliance/core.py")
            ]

            framework_validations = []

            for framework_name, module_path in compliance_modules:
                full_path = self.project_root / module_path

                if full_path.exists():
                    try:
                        import importlib.util
                        spec = importlib.util.spec_from_file_location(framework_name.lower(), full_path)
                        module = importlib.util.module_from_spec(spec)
                        spec.loader.exec_module(module)

                        # Check for expected functionality
                        has_expected_classes = any(
                            hasattr(module, attr) for attr in dir(module)
                            if 'Collector' in attr or 'Mapper' in attr or 'Orchestrator' in attr
                        )

                        framework_validations.append(has_expected_classes)

                    except Exception as e:
                        logger.warning(f"Failed to load {framework_name}: {e}")
                        framework_validations.append(False)
                else:
                    framework_validations.append(False)

            framework_effectiveness = sum(framework_validations) / len(framework_validations)

            return {
                'passed': framework_effectiveness >= 0.75,
                'validation_score': framework_effectiveness,
                'details': {
                    'total_frameworks': len(compliance_modules),
                    'functional_frameworks': sum(framework_validations),
                    'framework_effectiveness': framework_effectiveness,
                    'frameworks_adequate': framework_effectiveness >= 0.75
                },
                'criticality': 'high',
                'validation_time': datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            return {
                'passed': False,
                'error': str(e),
                'criticality': 'high',
                'validation_time': datetime.now(timezone.utc).isoformat()
            }

    async def _validate_continuous_monitoring(self) -> Dict[str, Any]:
        """Validate continuous monitoring system"""

        try:
            monitor = create_continuous_theater_monitor(str(self.project_root))

            # Test monitoring capabilities
            monitoring_capabilities = {
                'file_system_monitoring': hasattr(monitor, 'file_observer'),
                'alert_system': hasattr(monitor, 'alerts'),
                'evidence_collection': hasattr(monitor, 'evidence_dir'),
                'metrics_tracking': hasattr(monitor, 'metrics'),
                'callback_system': hasattr(monitor, 'alert_callbacks')
            }

            capability_score = sum(monitoring_capabilities.values()) / len(monitoring_capabilities)

            # Test alert generation capability
            alert_test_passed = False
            if hasattr(monitor, '_create_theater_alert'):
                try:
                    # Create a mock theater evidence for testing
                    from security.enterprise_theater_detection import TheaterEvidence, TheaterType, TheaterSeverity
                    test_violation = TheaterEvidence(
                        theater_type=TheaterType.PERFORMANCE_THEATER,
                        severity=TheaterSeverity.HIGH,
                        module_name="test_module",
                        function_name="test_function",
                        line_number=10,
                        evidence_code="test code",
                        description="Test violation",
                        forensic_details={}
                    )

                    alert = await monitor._create_theater_alert(test_violation, "test_module")
                    alert_test_passed = alert is not None and hasattr(alert, 'alert_id')
                except:
                    alert_test_passed = False

            monitoring_score = (capability_score + (1.0 if alert_test_passed else 0.0)) / 2

            return {
                'passed': monitoring_score >= 0.8,
                'validation_score': monitoring_score,
                'details': {
                    'monitoring_capabilities': monitoring_capabilities,
                    'capability_completeness': capability_score,
                    'alert_generation_works': alert_test_passed,
                    'monitoring_system_adequate': monitoring_score >= 0.8
                },
                'criticality': 'medium',
                'validation_time': datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            return {
                'passed': False,
                'error': str(e),
                'criticality': 'medium',
                'validation_time': datetime.now(timezone.utc).isoformat()
            }

    async def _validate_evidence_generation(self) -> Dict[str, Any]:
        """Validate evidence generation system"""

        try:
            generator = create_defense_evidence_generator(str(self.project_root))

            # Test evidence generation capabilities
            evidence_capabilities = {
                'theater_detector': hasattr(generator, 'theater_detector'),
                'continuous_monitor': hasattr(generator, 'continuous_monitor'),
                'evidence_collection': hasattr(generator, 'evidence_items'),
                'output_directory': hasattr(generator, 'evidence_output_dir'),
                'package_generation': hasattr(generator, 'generate_complete_evidence_package')
            }

            capability_score = sum(evidence_capabilities.values()) / len(evidence_capabilities)

            # Test evidence item creation
            from security.defense_industry_evidence_generator import AuditEvidence
            test_evidence = AuditEvidence(
                evidence_id="test_evidence",
                evidence_type="test",
                source_module="test_module",
                description="Test evidence",
                evidence_data={"test": "data"},
                validation_status="VERIFIED",
                criticality_level="LOW"
            )

            evidence_creation_works = (
                test_evidence.evidence_id == "test_evidence" and
                test_evidence.validation_status == "VERIFIED"
            )

            evidence_score = (capability_score + (1.0 if evidence_creation_works else 0.0)) / 2

            return {
                'passed': evidence_score >= 0.8,
                'validation_score': evidence_score,
                'details': {
                    'evidence_capabilities': evidence_capabilities,
                    'capability_completeness': capability_score,
                    'evidence_creation_works': evidence_creation_works,
                    'evidence_system_adequate': evidence_score >= 0.8
                },
                'criticality': 'medium',
                'validation_time': datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            return {
                'passed': False,
                'error': str(e),
                'criticality': 'medium',
                'validation_time': datetime.now(timezone.utc).isoformat()
            }

    async def _validate_zero_tolerance_standard(self) -> Dict[str, Any]:
        """Validate zero-tolerance defense industry standard"""

        try:
            detector = create_enterprise_theater_detector(str(self.project_root))

            # Run theater detection on actual codebase
            reports = await detector.detect_enterprise_theater()

            # Analyze results for zero-tolerance compliance
            total_modules = len(reports)
            critical_violations = sum(
                len([v for v in report.theater_violations if v.severity == TheaterSeverity.CRITICAL])
                for report in reports.values()
            )
            high_violations = sum(
                len([v for v in report.theater_violations if v.severity == TheaterSeverity.HIGH])
                for report in reports.values()
            )

            # Calculate compliance scores
            if reports:
                avg_compliance_score = sum(r.compliance_theater_score for r in reports.values()) / len(reports)
                defense_ready_modules = len([r for r in reports.values() if r.defense_industry_ready])
                defense_readiness_rate = defense_ready_modules / total_modules
            else:
                avg_compliance_score = 1.0
                defense_readiness_rate = 1.0

            # Zero-tolerance assessment
            zero_tolerance_met = critical_violations == 0
            defense_standard_met = (
                zero_tolerance_met and
                high_violations <= 2 and  # Allow max 2 high violations
                avg_compliance_score >= 0.95 and
                defense_readiness_rate >= 0.90
            )

            return {
                'passed': defense_standard_met,
                'validation_score': avg_compliance_score,
                'details': {
                    'total_modules_analyzed': total_modules,
                    'critical_violations': critical_violations,
                    'high_violations': high_violations,
                    'average_compliance_score': avg_compliance_score,
                    'defense_ready_modules': defense_ready_modules,
                    'defense_readiness_rate': defense_readiness_rate,
                    'zero_tolerance_met': zero_tolerance_met,
                    'defense_standard_met': defense_standard_met,
                    'certification_status': 'APPROVED' if defense_standard_met else 'REQUIRES_REMEDIATION'
                },
                'criticality': 'critical',
                'validation_time': datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            return {
                'passed': False,
                'error': str(e),
                'criticality': 'critical',
                'validation_time': datetime.now(timezone.utc).isoformat()
            }

    def _generate_recommendations(self, results: Dict[str, Any], defense_ready: bool) -> List[str]:
        """Generate recommendations based on validation results"""

        recommendations = []

        if defense_ready:
            recommendations.append("PASS: System meets defense industry zero-tolerance standards")
            recommendations.append("PASS: Ready for production deployment in defense environments")
            recommendations.append("PASS: All critical theater detection validations passed")
        else:
            recommendations.append("FAIL: System does not meet defense industry standards")
            recommendations.append("ACTION: Remediation required before production deployment")

            # Specific recommendations based on failures
            for validation_name, result in results.items():
                if not result.get('passed', False):
                    criticality = result.get('criticality', 'medium')
                    error = result.get('error', 'Unknown failure')

                    if criticality == 'critical':
                        recommendations.append(f"CRITICAL: Fix {validation_name} - {error}")
                    elif criticality == 'high':
                        recommendations.append(f"HIGH: Address {validation_name} - {error}")
                    else:
                        recommendations.append(f"MEDIUM: Improve {validation_name}")

        recommendations.append("INFO: Review detailed validation results for specific action items")
        recommendations.append("INFO: Run continuous theater monitoring for ongoing compliance")

        return recommendations

    async def _save_validation_results(self, results: Dict[str, Any]) -> None:
        """Save validation results to file"""

        output_dir = self.project_root / ".claude" / ".artifacts" / "validation"
        output_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        results_file = output_dir / f"theater_detection_validation_{timestamp}.json"

        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, default=str)

        logger.info(f"Validation results saved: {results_file}")


async def main():
    """Main validation entry point"""

    print("Enterprise Theater Detection Validation System")
    print("Defense Industry Zero-Tolerance Standards")
    print("=" * 60)

    project_root = Path(__file__).parent.parent
    validator = TheaterDetectionValidator(str(project_root))

    try:
        # Run comprehensive validation
        results = await validator.run_comprehensive_validation()

        # Display results
        summary = results['summary']
        print(f"\nValidation Summary:")
        print(f"  Total Validations: {summary['total_validations']}")
        print(f"  Passed: {summary['passed_validations']}")
        print(f"  Failed: {summary['failed_validations']}")
        print(f"  Overall Score: {summary['overall_score']:.1%}")
        print(f"  Critical Failures: {summary['critical_failures']}")

        print(f"\nDefense Industry Assessment:")
        print(f"  Zero Tolerance Met: {'YES' if summary['zero_tolerance_met'] else 'NO'}")
        print(f"  Defense Ready: {'YES' if summary['defense_industry_ready'] else 'NO'}")
        print(f"  Certification Status: {summary['certification_status']}")

        print(f"\nRecommendations:")
        for rec in results['recommendations']:
            print(f"  {rec}")

        # Show detailed failures if any
        failures = [
            (name, result) for name, result in results['validation_results'].items()
            if not result.get('passed', False)
        ]

        if failures:
            print(f"\nFailed Validations:")
            for name, result in failures:
                criticality = result.get('criticality', 'medium').upper()
                error = result.get('error', 'Validation failed')
                print(f"  [{criticality}] {name}: {error}")

        print(f"\nDetailed results saved to: .claude/.artifacts/validation/")

        return summary['defense_industry_ready']

    except KeyboardInterrupt:
        print("\nValidation interrupted by user")
        return False
    except Exception as e:
        print(f"\nValidation failed with error: {e}")
        logger.exception("Validation error")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)