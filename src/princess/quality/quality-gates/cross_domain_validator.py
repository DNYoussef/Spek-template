from src.constants.base import API_TIMEOUT_SECONDS, MAXIMUM_FILE_LENGTH_LINES, MAXIMUM_FUNCTION_PARAMETERS

MISSION: Validate deliverables across all Princess domains
AUTHORITY: Cross-domain validation and integration testing
TARGET: 100% domain integration compliance and zero conflicts
"""

import json
import os
import sys
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
from datetime import datetime
import subprocess
import asyncio
from concurrent.futures import ThreadPoolExecutor

@dataclass
class DomainDeliverable:
    """Princess domain deliverable definition"""
    domain: str
    deliverable_type: str  # 'component', 'service', 'configuration', 'documentation'
    file_path: str
    dependencies: List[str]
    interfaces: List[str]
    quality_score: float
    validation_status: str

@dataclass
class IntegrationTest:
    """Cross-domain integration test"""
    test_name: str
    domains_involved: List[str]
    test_type: str  # 'interface', 'data_flow', 'security', 'performance'
    expected_result: Any
    actual_result: Any
    passed: bool
    evidence: List[str]

@dataclass
class ConflictDetection:
    """Domain conflict detection result"""
    conflict_type: str  # 'naming', 'interface', 'dependency', 'resource'
    domains_affected: List[str]
    severity: str  # 'low', 'medium', 'high', 'critical'
    description: str
    resolution_required: bool
    suggested_resolution: str

@dataclass
class CrossDomainReport:
    """Complete cross-domain validation report"""
    domains_validated: List[str]
    integration_tests: List[IntegrationTest]
    conflicts_detected: List[ConflictDetection]
    overall_status: str
    deployment_ready: bool
    recommendations: List[str]
    validation_timestamp: str

class CrossDomainValidator:
    """Cross-domain validation and integration testing system"""

    def __init__(self):
        self.princess_domains = {
            'development': {
                'path': 'src/princess/development',
                'deliverables': ['components', 'services', 'apis'],
                'interfaces': ['rest_api', 'graphql', 'websockets']
            },
            'testing': {
                'path': 'src/princess/testing',
                'deliverables': ['test_suites', 'automation', 'coverage_reports'],
                'interfaces': ['test_api', 'metrics_api']
            },
            'deployment': {
                'path': 'src/princess/deployment',
                'deliverables': ['containers', 'configs', 'pipelines'],
                'interfaces': ['ci_cd_api', 'deployment_api']
            },
            'monitoring': {
                'path': 'src/princess/monitoring',
                'deliverables': ['dashboards', 'alerts', 'metrics'],
                'interfaces': ['metrics_api', 'alerts_api']
            },
            'security': {
                'path': 'src/princess/security',
                'deliverables': ['policies', 'scans', 'compliance'],
                'interfaces': ['auth_api', 'security_api']
            },
            'quality': {
                'path': 'src/princess/quality',
                'deliverables': ['gates', 'reports', 'validation'],
                'interfaces': ['quality_api', 'validation_api']
            }
        }

        self.integration_test_matrix = self._build_integration_matrix()

    def _build_integration_matrix(self) -> Dict[str, List[str]]:
        """Build integration test matrix between domains"""
        return {
            'development_testing': [
                'test_api_integration',
                'code_coverage_validation',
                'build_artifact_compatibility'
            ],
            'development_deployment': [
                'container_compatibility',
                'environment_configuration',
                'deployment_readiness'
            ],
            'development_security': [
                'security_scan_integration',
                'vulnerability_assessment',
                'compliance_validation'
            ],
            'development_quality': [
                'quality_gate_validation',
                'theater_detection_integration',
                'code_quality_assessment'
            ],
            'testing_deployment': [
                'test_environment_setup',
                'automated_deployment_testing',
                'rollback_testing'
            ],
            'testing_monitoring': [
                'test_metrics_collection',
                'performance_monitoring',
                'failure_alerting'
            ],
            'deployment_monitoring': [
                'deployment_metrics',
                'health_check_integration',
                'resource_monitoring'
            ],
            'security_monitoring': [
                'security_event_monitoring',
                'threat_detection_integration',
                'compliance_monitoring'
            ],
            'quality_all_domains': [
                'cross_domain_quality_gates',
                'integrated_validation',
                'overall_quality_assessment'
            ]
        }

    async def validate_all_domains(self, base_path: str) -> CrossDomainReport:
        """Validate all Princess domains and their interactions"""
        print("Starting cross-domain validation...")

        # Discover domain deliverables
        domain_deliverables = {}
        for domain, config in self.princess_domains.items():
            domain_path = os.path.join(base_path, config['path'])
            if os.path.exists(domain_path):
                deliverables = await self._discover_domain_deliverables(domain, domain_path)
                domain_deliverables[domain] = deliverables

        # Run integration tests
        integration_tests = await self._run_integration_tests(domain_deliverables)

        # Detect conflicts
        conflicts = await self._detect_domain_conflicts(domain_deliverables)

        # Assess overall status
        overall_status = self._assess_overall_status(integration_tests, conflicts)
        deployment_ready = self._assess_deployment_readiness(integration_tests, conflicts)

        # Generate recommendations
        recommendations = self._generate_recommendations(integration_tests, conflicts)

        return CrossDomainReport(
            domains_validated=list(domain_deliverables.keys()),
            integration_tests=integration_tests,
            conflicts_detected=conflicts,
            overall_status=overall_status,
            deployment_ready=deployment_ready,
            recommendations=recommendations,
            validation_timestamp=datetime.now().isoformat()
        )

    async def _discover_domain_deliverables(self, domain: str, domain_path: str) -> List[DomainDeliverable]:
        """Discover deliverables within a Princess domain"""
        deliverables = []

        for root, dirs, files in os.walk(domain_path):
            for file in files:
                if file.endswith(('.py', '.js', '.ts', '.json', '.yaml', '.yml')):
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, domain_path)

                    # Determine deliverable type
                    deliverable_type = self._determine_deliverable_type(file_path)

                    # Extract dependencies and interfaces
                    dependencies = await self._extract_dependencies(file_path)
                    interfaces = await self._extract_interfaces(file_path)

                    # Calculate quality score (placeholder)
                    quality_score = await self._calculate_quality_score(file_path)

                    deliverable = DomainDeliverable(
                        domain=domain,
                        deliverable_type=deliverable_type,
                        file_path=relative_path,
                        dependencies=dependencies,
                        interfaces=interfaces,
                        quality_score=quality_score,
                        validation_status='pending'
                    )

                    deliverables.append(deliverable)

        return deliverables

    def _determine_deliverable_type(self, file_path: str) -> str:
        """Determine the type of deliverable based on file path and content"""
        path_lower = file_path.lower()

        if 'component' in path_lower or 'widget' in path_lower:
            return 'component'
        elif 'service' in path_lower or 'api' in path_lower:
            return 'service'
        elif 'config' in path_lower or 'settings' in path_lower:
            return 'configuration'
        elif 'test' in path_lower or 'spec' in path_lower:
            return 'test'
        elif 'doc' in path_lower or 'readme' in path_lower:
            return 'documentation'
        else:
            return 'module'

    async def _extract_dependencies(self, file_path: str) -> List[str]:
        """Extract dependencies from a file"""
        dependencies = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Python imports
            if file_path.endswith('.py'):
                import re
                import_pattern = r'from\s+([\w\.]+)\s+import|import\s+([\w\.]+)'
                matches = re.findall(import_pattern, content)
                for match in matches:
                    dep = match[0] or match[1]
                    if dep and not dep.startswith('.'):
                        dependencies.append(dep.split('.')[0])

            # JavaScript/TypeScript imports
            elif file_path.endswith(('.js', '.ts', '.jsx', '.tsx')):
                import re
                import_pattern = r'(?:import|require)\s*\(?[\'"]([^\'"]+)[\'"]'
                matches = re.findall(import_pattern, content)
                dependencies.extend(matches)

        except Exception:
            pass  # Ignore errors in dependency extraction

        return list(set(dependencies))  # Remove duplicates

    async def _extract_interfaces(self, file_path: str) -> List[str]:
        """Extract interfaces/APIs defined in a file"""
        interfaces = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Look for API endpoints, class definitions, function definitions
            import re

            # REST API endpoints
            api_pattern = r'@app\.route\([\'"]([^\'"]+)[\'"]|app\.get\([\'"]([^\'"]+)[\'"]'
            matches = re.findall(api_pattern, content)
            for match in matches:
                endpoint = match[0] or match[1]
                if endpoint:
                    interfaces.append(f"REST:{endpoint}")

            # Python class definitions
            if file_path.endswith('.py'):
                class_pattern = r'class\s+(\w+)'
                matches = re.findall(class_pattern, content)
                interfaces.extend([f"CLASS:{cls}" for cls in matches])

            # Function definitions that might be APIs
            func_pattern = r'def\s+(\w+)'
            matches = re.findall(func_pattern, content)
            public_functions = [f for f in matches if not f.startswith('_')]
            interfaces.extend([f"FUNC:{func}" for func in public_functions[:5]])  # Limit to first 5

        except Exception:
            pass  # Ignore errors in interface extraction

        return interfaces

    async def _calculate_quality_score(self, file_path: str) -> float:
        """Calculate quality score for a deliverable"""
        try:
            # Basic quality metrics
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            score = 50.0  # Base score

            # File size penalty/bonus
            lines = len(content.splitlines())
            if 10 <= lines <= MAXIMUM_FILE_LENGTH_LINES:
                score += 20  # Good size
            elif lines > 1000:
                score -= 15  # Too large

            # Documentation bonus
            if 'docstring' in content.lower() or '"""' in content or "'''" in content:'
                score += 15

            # Error handling bonus
            if 'try:' in content or 'except:' in content or 'catch' in content:
                score += MAXIMUM_FUNCTION_PARAMETERS

            # Test presence bonus
            if 'test' in file_path.lower() or 'spec' in file_path.lower():
                score += 10

            return min(100.0, max(0.0, score))

        except Exception:
            return 0.0

    async def _run_integration_tests(self, domain_deliverables: Dict[str, List[DomainDeliverable]]) -> List[IntegrationTest]:
        """Run integration tests between domains"""
        integration_tests = []

        with ThreadPoolExecutor(max_workers=4) as executor:
            tasks = []

            for test_group, test_names in self.integration_test_matrix.items():
                for test_name in test_names:
                    task = executor.submit(self._run_single_integration_test,
                                        test_name, test_group, domain_deliverables)
                    tasks.append(task)

            # Wait for all tests to complete
            for task in tasks:
                try:
                    result = task.result(timeout=API_TIMEOUT_SECONDS)  # API_TIMEOUT_SECONDS second timeout per test
                    if result:
                        integration_tests.append(result)
                except Exception as e:
                    # Create a failed test result
                    integration_tests.append(IntegrationTest(
                        test_name=f"failed_test",
                        domains_involved=['unknown'],
                        test_type='error',
                        expected_result='success',
                        actual_result=f'error: {str(e)}',
                        passed=False,
                        evidence=[f"Test execution failed: {str(e)}"]
                    ))

        return integration_tests

    def _run_single_integration_test(self, test_name: str, test_group: str,
                                    domain_deliverables: Dict[str, List[DomainDeliverable]]) -> Optional[IntegrationTest]:
        """Run a single integration test"""
        try:
            # Parse domains from test group
            domains_involved = test_group.split('_')
            if 'all' in domains_involved:
                domains_involved = list(domain_deliverables.keys())

            # Test specific logic based on test name
            if 'api_integration' in test_name:
                return self._test_api_integration(domains_involved, domain_deliverables)
            elif 'compatibility' in test_name:
                return self._test_compatibility(domains_involved, domain_deliverables)
            elif 'security' in test_name:
                return self._test_security_integration(domains_involved, domain_deliverables)
            elif 'quality' in test_name:
                return self._test_quality_integration(domains_involved, domain_deliverables)
            elif 'monitoring' in test_name:
                return self._test_monitoring_integration(domains_involved, domain_deliverables)
            else:
                return self._test_generic_integration(test_name, domains_involved, domain_deliverables)

        except Exception as e:
            return IntegrationTest(
                test_name=test_name,
                domains_involved=domains_involved if 'domains_involved' in locals() else ['unknown'],
                test_type='error',
                expected_result='success',
                actual_result=f'error: {str(e)}',
                passed=False,
                evidence=[f"Integration test failed: {str(e)}"]
            )

    def _test_api_integration(self, domains: List[str], deliverables: Dict[str, List[DomainDeliverable]]) -> IntegrationTest:
        """Test API integration between domains"""
        # Check for API interface compatibility
        api_interfaces = {}
        for domain in domains:
            if domain in deliverables:
                domain_apis = []
                for deliverable in deliverables[domain]:
                    apis = [iface for iface in deliverable.interfaces if iface.startswith('REST:')]
                    domain_apis.extend(apis)
                api_interfaces[domain] = domain_apis

        # Check for overlapping endpoints
        all_endpoints = []
        for domain_apis in api_interfaces.values():
            all_endpoints.extend(domain_apis)

        unique_endpoints = len(set(all_endpoints))
        total_endpoints = len(all_endpoints)

        passed = unique_endpoints == total_endpoints  # No conflicts

        return IntegrationTest(
            test_name='api_integration',
            domains_involved=domains,
            test_type='interface',
            expected_result='no_conflicts',
            actual_result=f'{total_endpoints - unique_endpoints}_conflicts',
            passed=passed,
            evidence=[
                f"Total API endpoints: {total_endpoints}",
                f"Unique endpoints: {unique_endpoints}",
                f"Conflicts detected: {total_endpoints - unique_endpoints}"
            ]
        )

    def _test_compatibility(self, domains: List[str], deliverables: Dict[str, List[DomainDeliverable]]) -> IntegrationTest:
        """Test compatibility between domain deliverables"""
        compatibility_score = 0.0
        total_checks = 0
        evidence = []

        for domain in domains:
            if domain in deliverables:
                domain_deliverables = deliverables[domain]
                avg_quality = sum(d.quality_score for d in domain_deliverables) / len(domain_deliverables) if domain_deliverables else 0
                compatibility_score += avg_quality
                total_checks += 1
                evidence.append(f"{domain} average quality: {avg_quality:.1f}")

        final_score = compatibility_score / total_checks if total_checks > 0 else 0
        passed = final_score >= 60.0  # 60% compatibility threshold

        return IntegrationTest(
            test_name='compatibility_check',
            domains_involved=domains,
            test_type='compatibility',
            expected_result='>=60',
            actual_result=f'{final_score:.1f}',
            passed=passed,
            evidence=evidence
        )

    def _test_security_integration(self, domains: List[str], deliverables: Dict[str, List[DomainDeliverable]]) -> IntegrationTest:
        """Test security integration between domains"""
        security_violations = 0
        evidence = []

        # Check for security-related deliverables
        security_present = False
        for domain in domains:
            if domain == 'security' and domain in deliverables:
                security_present = True
                security_deliverables = len(deliverables[domain])
                evidence.append(f"Security domain has {security_deliverables} deliverables")
                break

        if not security_present:
            security_violations += 1
            evidence.append("Security domain not found or empty")

        # Check for authentication interfaces
        auth_interfaces = []
        for domain in domains:
            if domain in deliverables:
                for deliverable in deliverables[domain]:
                    auth_ifaces = [iface for iface in deliverable.interfaces if 'auth' in iface.lower()]
                    auth_interfaces.extend(auth_ifaces)

        if not auth_interfaces:
            security_violations += 1
            evidence.append("No authentication interfaces found")
        else:
            evidence.append(f"Found {len(auth_interfaces)} authentication interfaces")

        passed = security_violations == 0

        return IntegrationTest(
            test_name='security_integration',
            domains_involved=domains,
            test_type='security',
            expected_result='0_violations',
            actual_result=f'{security_violations}_violations',
            passed=passed,
            evidence=evidence
        )

    def _test_quality_integration(self, domains: List[str], deliverables: Dict[str, List[DomainDeliverable]]) -> IntegrationTest:
        """Test quality integration across domains"""
        total_quality = 0.0
        total_deliverables = 0
        evidence = []

        for domain in domains:
            if domain in deliverables:
                domain_deliverables = deliverables[domain]
                domain_total = sum(d.quality_score for d in domain_deliverables)
                total_quality += domain_total
                total_deliverables += len(domain_deliverables)

                domain_avg = domain_total / len(domain_deliverables) if domain_deliverables else 0
                evidence.append(f"{domain}: {len(domain_deliverables)} deliverables, avg quality {domain_avg:.1f}")

        overall_quality = total_quality / total_deliverables if total_deliverables > 0 else 0
        passed = overall_quality >= 70.0  # 70% quality threshold

        return IntegrationTest(
            test_name='quality_integration',
            domains_involved=domains,
            test_type='quality',
            expected_result='>=70',
            actual_result=f'{overall_quality:.1f}',
            passed=passed,
            evidence=evidence + [f"Overall quality score: {overall_quality:.1f}"]
        )

    def _test_monitoring_integration(self, domains: List[str], deliverables: Dict[str, List[DomainDeliverable]]) -> IntegrationTest:
        """Test monitoring integration"""
        monitoring_coverage = 0
        evidence = []

        # Check if monitoring domain exists
        if 'monitoring' in domains and 'monitoring' in deliverables:
            monitoring_deliverables = len(deliverables['monitoring'])
            monitoring_coverage += 50  # Base coverage for having monitoring
            evidence.append(f"Monitoring domain present with {monitoring_deliverables} deliverables")

        # Check for metrics interfaces in other domains
        metrics_interfaces = 0
        for domain in domains:
            if domain != 'monitoring' and domain in deliverables:
                for deliverable in deliverables[domain]:
                    metrics_ifaces = [iface for iface in deliverable.interfaces if 'metric' in iface.lower()]
                    metrics_interfaces += len(metrics_ifaces)

        if metrics_interfaces > 0:
            monitoring_coverage += min(50, metrics_interfaces * 10)  # Up to 50 points for metrics
            evidence.append(f"Found {metrics_interfaces} metrics interfaces in other domains")

        passed = monitoring_coverage >= 60

        return IntegrationTest(
            test_name='monitoring_integration',
            domains_involved=domains,
            test_type='monitoring',
            expected_result='>=60',
            actual_result=f'{monitoring_coverage}',
            passed=passed,
            evidence=evidence
        )

    def _test_generic_integration(self, test_name: str, domains: List[str],
                                deliverables: Dict[str, List[DomainDeliverable]]) -> IntegrationTest:
        """Generic integration test"""
        # Basic integration check - do domains have deliverables?
        domain_counts = {}
        for domain in domains:
            count = len(deliverables.get(domain, []))
            domain_counts[domain] = count

        total_deliverables = sum(domain_counts.values())
        passed = total_deliverables > 0

        return IntegrationTest(
            test_name=test_name,
            domains_involved=domains,
            test_type='generic',
            expected_result='>0_deliverables',
            actual_result=f'{total_deliverables}_deliverables',
            passed=passed,
            evidence=[f"{domain}: {count} deliverables" for domain, count in domain_counts.items()]
        )

    async def _detect_domain_conflicts(self, domain_deliverables: Dict[str, List[DomainDeliverable]]) -> List[ConflictDetection]:
        """Detect conflicts between Princess domains"""
        conflicts = []

        # Check for naming conflicts
        conflicts.extend(self._detect_naming_conflicts(domain_deliverables))

        # Check for interface conflicts
        conflicts.extend(self._detect_interface_conflicts(domain_deliverables))

        # Check for dependency conflicts
        conflicts.extend(self._detect_dependency_conflicts(domain_deliverables))

        # Check for resource conflicts
        conflicts.extend(self._detect_resource_conflicts(domain_deliverables))

        return conflicts

    def _detect_naming_conflicts(self, domain_deliverables: Dict[str, List[DomainDeliverable]]) -> List[ConflictDetection]:
        """Detect naming conflicts between domains"""
        conflicts = []
        file_names = {}

        # Collect all file names by domain
        for domain, deliverables in domain_deliverables.items():
            for deliverable in deliverables:
                file_name = os.path.basename(deliverable.file_path)
                if file_name not in file_names:
                    file_names[file_name] = []
                file_names[file_name].append(domain)

        # Find conflicts
        for file_name, domains in file_names.items():
            if len(domains) > 1:
                conflicts.append(ConflictDetection(
                    conflict_type='naming',
                    domains_affected=domains,
                    severity='medium',
                    description=f"File name '{file_name}' exists in multiple domains",
                    resolution_required=False,
                    suggested_resolution=f"Consider renaming to domain-specific names"
                ))

        return conflicts

    def _detect_interface_conflicts(self, domain_deliverables: Dict[str, List[DomainDeliverable]]) -> List[ConflictDetection]:
        """Detect interface conflicts between domains"""
        conflicts = []
        interfaces = {}

        # Collect all interfaces by domain
        for domain, deliverables in domain_deliverables.items():
            for deliverable in deliverables:
                for interface in deliverable.interfaces:
                    if interface not in interfaces:
                        interfaces[interface] = []
                    interfaces[interface].append(domain)

        # Find conflicts
        for interface, domains in interfaces.items():
            if len(domains) > 1 and interface.startswith('REST:'):
                conflicts.append(ConflictDetection(
                    conflict_type='interface',
                    domains_affected=domains,
                    severity='high',
                    description=f"API endpoint '{interface}' defined in multiple domains",
                    resolution_required=True,
                    suggested_resolution="Consolidate API endpoints or use different paths"
                ))

        return conflicts

    def _detect_dependency_conflicts(self, domain_deliverables: Dict[str, List[DomainDeliverable]]) -> List[ConflictDetection]:
        """Detect dependency conflicts between domains"""
        conflicts = []

        # Check for circular dependencies
        domain_deps = {}
        for domain, deliverables in domain_deliverables.items():
            domain_deps[domain] = set()
            for deliverable in deliverables:
                for dep in deliverable.dependencies:
                    # Check if dependency is another princess domain
                    for other_domain in domain_deliverables.keys():
                        if other_domain in dep.lower():
                            domain_deps[domain].add(other_domain)

        # Detect circular dependencies
        for domain_a in domain_deps:
            for domain_b in domain_deps[domain_a]:
                if domain_a in domain_deps.get(domain_b, set()):
                    conflicts.append(ConflictDetection(
                        conflict_type='dependency',
                        domains_affected=[domain_a, domain_b],
                        severity='critical',
                        description=f"Circular dependency between {domain_a} and {domain_b}",
                        resolution_required=True,
                        suggested_resolution="Refactor to remove circular dependencies"
                    ))

        return conflicts

    def _detect_resource_conflicts(self, domain_deliverables: Dict[str, List[DomainDeliverable]]) -> List[ConflictDetection]:
        """Detect resource conflicts between domains"""
        conflicts = []

        # Check for port conflicts (if any configuration files specify ports)
        port_usage = {}
        for domain, deliverables in domain_deliverables.items():
            for deliverable in deliverables:
                if deliverable.deliverable_type == 'configuration':
                    # This would parse config files for port numbers
                    import re
                    try:
                        with open(deliverable.file_path, 'r') as f:
                            content = f.read()

                        port_matches = re.findall(r'port["\']?\s*[:=]\s*(\d+)', content, re.IGNORECASE)
                        for port in port_matches:
                            port_num = int(port)
                            if port_num not in port_usage:
                                port_usage[port_num] = []
                            port_usage[port_num].append(domain)

                    except Exception:
                        pass  # Ignore file read errors

        # Find port conflicts
        for port, domains in port_usage.items():
            if len(domains) > 1:
                conflicts.append(ConflictDetection(
                    conflict_type='resource',
                    domains_affected=domains,
                    severity='high',
                    description=f"Port {port} configured in multiple domains",
                    resolution_required=True,
                    suggested_resolution=f"Assign unique ports to each domain"
                ))

        return conflicts

    def _assess_overall_status(self, integration_tests: List[IntegrationTest],
                            conflicts: List[ConflictDetection]) -> str:
        """Assess overall validation status"""
        failed_tests = len([t for t in integration_tests if not t.passed])
        critical_conflicts = len([c for c in conflicts if c.severity == 'critical'])
        high_conflicts = len([c for c in conflicts if c.severity == 'high'])

        if failed_tests == 0 and critical_conflicts == 0 and high_conflicts == 0:
            return 'PASS'
        elif critical_conflicts > 0:
            return 'CRITICAL_FAILURE'
        elif failed_tests > len(integration_tests) * 0.5:  # More than 50% tests failed
            return 'MAJOR_FAILURE'
        elif high_conflicts > 0 or failed_tests > 0:
            return 'MINOR_ISSUES'
        else:
            return 'WARNING'

    def _assess_deployment_readiness(self, integration_tests: List[IntegrationTest],
                                    conflicts: List[ConflictDetection]) -> bool:
        """Assess if system is ready for deployment"""
        blocking_conflicts = [c for c in conflicts if c.resolution_required]
        critical_failures = [t for t in integration_tests if not t.passed and t.test_type in ['security', 'compatibility']]

        return len(blocking_conflicts) == 0 and len(critical_failures) == 0

    def _generate_recommendations(self, integration_tests: List[IntegrationTest],
                                conflicts: List[ConflictDetection]) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []

        # Address critical conflicts first
        critical_conflicts = [c for c in conflicts if c.severity == 'critical']
        if critical_conflicts:
            recommendations.append(
                f"CRITICAL: Resolve {len(critical_conflicts)} critical conflicts before deployment"
            )
            for conflict in critical_conflicts[:3]:  # Show first 3
                recommendations.append(f"  - {conflict.description}: {conflict.suggested_resolution}")

        # Address failed integration tests
        failed_tests = [t for t in integration_tests if not t.passed]
        if failed_tests:
            recommendations.append(
                f"Fix {len(failed_tests)} failed integration tests"
            )

            # Group by test type
            test_types = {}
            for test in failed_tests:
                if test.test_type not in test_types:
                    test_types[test.test_type] = 0
                test_types[test.test_type] += 1

            for test_type, count in test_types.items():
                recommendations.append(f"  - {test_type}: {count} failures")

        # Address high-severity conflicts
        high_conflicts = [c for c in conflicts if c.severity == 'high']
        if high_conflicts:
            recommendations.append(
                f"Resolve {len(high_conflicts)} high-priority conflicts"
            )

        # General recommendations
        if not conflicts and not failed_tests:
            recommendations.append("All cross-domain validations passed - system ready for deployment")
        else:
            recommendations.append("Run validation again after addressing issues")

        return recommendations

async def main():
    """Command-line interface for cross-domain validation"""
    import argparse

    parser = argparse.ArgumentParser(description='SPEK Cross-Domain Princess Validator')
    parser.add_argument('base_path', help='Base path containing princess domains')
    parser.add_argument('--output', '-o', help='Output file for validation report')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')

    args = parser.parse_args()

    validator = CrossDomainValidator()

    print("SPEK Cross-Domain Princess Validator - Quality Princess Domain")
    print("Validating integration between all Princess domains")
    print("=" * 70)

    # Run validation
    report = await validator.validate_all_domains(args.base_path)

    # Display results
    print(f"Domains Validated: {', '.join(report.domains_validated)}")
    print(f"Overall Status: {report.overall_status}")
    print(f"Deployment Ready: {'YES' if report.deployment_ready else 'NO'}")

    passed_tests = len([t for t in report.integration_tests if t.passed])

    if args.verbose and report.integration_tests:
        for test in report.integration_tests:
            status = "PASS" if test.passed else "FAIL"

    print(f"\nConflicts Detected: {len(report.conflicts_detected)}")
    if report.conflicts_detected:
        conflict_counts = {}
        for conflict in report.conflicts_detected:
            severity = conflict.severity
            conflict_counts[severity] = conflict_counts.get(severity, 0) + 1

        for severity, count in conflict_counts.items():
            print(f"  {severity.upper()}: {count}")

        if args.verbose:
            print("\nDetailed Conflicts:")
            for conflict in report.conflicts_detected:
                print(f"  {conflict.conflict_type.upper()} ({conflict.severity}): {conflict.description}")
                print(f"    Domains: {', '.join(conflict.domains_affected)}")
                print(f"    Resolution: {conflict.suggested_resolution}")

    if report.recommendations:
        print(f"\nRecommendations:")
        for i, rec in enumerate(report.recommendations, 1):
            print(f"  {i}. {rec}")

    # Save report
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(asdict(report), f, indent=2, default=str)
        print(f"\nDetailed report saved to: {args.output}")

    # Exit with appropriate code
    exit_code = 0 if report.deployment_ready else 1
    sys.exit(exit_code)

if __name__ == '__main__':
    asyncio.run(main())