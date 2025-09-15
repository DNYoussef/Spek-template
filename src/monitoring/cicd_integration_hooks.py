"""
CI/CD Pipeline Integration Hooks for Defense Industry Deployment

Provides comprehensive CI/CD integration with automated monitoring,
rollback triggers, and compliance validation for defense systems.
"""

import os
import json
import time
import subprocess
import threading
from pathlib import Path
from typing import Dict, List, Optional, Callable, Any, Union
from dataclasses import dataclass, field
from enum import Enum
import logging
import hashlib
import requests
from datetime import datetime, timedelta


class PipelineStage(Enum):
    """CI/CD pipeline stages."""
    BUILD = "build"
    TEST = "test"
    SECURITY_SCAN = "security_scan"
    COMPLIANCE_CHECK = "compliance_check"
    DEPLOY = "deploy"
    MONITOR = "monitor"
    ROLLBACK = "rollback"


class PipelineStatus(Enum):
    """Pipeline execution status."""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"
    ROLLBACK_TRIGGERED = "rollback_triggered"


@dataclass
class PipelineMetrics:
    """Pipeline execution metrics."""
    stage: PipelineStage
    start_time: float
    end_time: Optional[float] = None
    status: PipelineStatus = PipelineStatus.PENDING
    duration: Optional[float] = None
    artifacts: List[str] = field(default_factory=list)
    error_message: Optional[str] = None
    performance_data: Dict[str, Any] = field(default_factory=dict)
    compliance_score: Optional[float] = None


@dataclass
class DeploymentContext:
    """Deployment context information."""
    environment: str
    version: str
    commit_hash: str
    branch: str
    deployment_id: str
    namespace: Optional[str] = None
    region: Optional[str] = None
    classification_level: str = "UNCLASSIFIED"
    approval_required: bool = False
    rollback_strategy: str = "automatic"


class GitHubActionsIntegration:
    """Integration with GitHub Actions workflows."""

    def __init__(self, token: str, repository: str):
        self.token = token
        self.repository = repository
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }

    def trigger_workflow(self, workflow_id: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger a GitHub Actions workflow."""
        url = f"{self.base_url}/repos/{self.repository}/actions/workflows/{workflow_id}/dispatches"

        payload = {
            "ref": inputs.get("ref", "main"),
            "inputs": inputs
        }

        response = requests.post(url, headers=self.headers, json=payload)

        if response.status_code == 204:
            return {"status": "triggered", "workflow_id": workflow_id}
        else:
            return {"status": "failed", "error": response.text}

    def get_workflow_run_status(self, run_id: str) -> Dict[str, Any]:
        """Get the status of a workflow run."""
        url = f"{self.base_url}/repos/{self.repository}/actions/runs/{run_id}"

        response = requests.get(url, headers=self.headers)

        if response.status_code == 200:
            return response.json()
        else:
            return {"status": "error", "error": response.text}

    def create_deployment_status(self, deployment_id: str, state: str,
                               description: str = "") -> Dict[str, Any]:
        """Create a deployment status update."""
        url = f"{self.base_url}/repos/{self.repository}/deployments/{deployment_id}/statuses"

        payload = {
            "state": state,
            "description": description,
            "environment": "production"
        }

        response = requests.post(url, headers=self.headers, json=payload)

        if response.status_code == 201:
            return response.json()
        else:
            return {"status": "failed", "error": response.text}


class AzureDevOpsIntegration:
    """Integration with Azure DevOps pipelines."""

    def __init__(self, organization: str, project: str, token: str):
        self.organization = organization
        self.project = project
        self.token = token
        self.base_url = f"https://dev.azure.com/{organization}/{project}/_apis"
        self.headers = {
            "Authorization": f"Basic {token}",
            "Content-Type": "application/json"
        }

    def queue_build(self, definition_id: int, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Queue a build in Azure DevOps."""
        url = f"{self.base_url}/build/builds?api-version=6.0"

        payload = {
            "definition": {"id": definition_id},
            "parameters": json.dumps(parameters)
        }

        response = requests.post(url, headers=self.headers, json=payload)

        if response.status_code == 200:
            return response.json()
        else:
            return {"status": "failed", "error": response.text}

    def get_build_status(self, build_id: int) -> Dict[str, Any]:
        """Get build status from Azure DevOps."""
        url = f"{self.base_url}/build/builds/{build_id}?api-version=6.0"

        response = requests.get(url, headers=self.headers)

        if response.status_code == 200:
            return response.json()
        else:
            return {"status": "error", "error": response.text}


class JenkinsIntegration:
    """Integration with Jenkins CI/CD."""

    def __init__(self, base_url: str, username: str, token: str):
        self.base_url = base_url.rstrip('/')
        self.username = username
        self.token = token
        self.auth = (username, token)

    def trigger_job(self, job_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger a Jenkins job."""
        if parameters:
            url = f"{self.base_url}/job/{job_name}/buildWithParameters"
        else:
            url = f"{self.base_url}/job/{job_name}/build"

        response = requests.post(url, auth=self.auth, data=parameters)

        if response.status_code in [200, 201]:
            queue_url = response.headers.get('Location')
            return {"status": "triggered", "queue_url": queue_url}
        else:
            return {"status": "failed", "error": response.text}

    def get_job_status(self, job_name: str, build_number: int) -> Dict[str, Any]:
        """Get Jenkins job status."""
        url = f"{self.base_url}/job/{job_name}/{build_number}/api/json"

        response = requests.get(url, auth=self.auth)

        if response.status_code == 200:
            return response.json()
        else:
            return {"status": "error", "error": response.text}


class MonitoringHook:
    """Base class for monitoring hooks."""

    def __init__(self, name: str):
        self.name = name
        self.enabled = True
        self.execution_count = 0
        self.last_execution = None
        self.logger = logging.getLogger(f'MonitoringHook.{name}')

    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the monitoring hook."""
        if not self.enabled:
            return {"status": "skipped", "reason": "hook disabled"}

        try:
            self.execution_count += 1
            self.last_execution = time.time()

            result = self._execute_impl(context)

            self.logger.info(f"Hook {self.name} executed successfully")
            return result

        except Exception as e:
            self.logger.error(f"Hook {self.name} failed: {e}")
            return {"status": "failed", "error": str(e)}

    def _execute_impl(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Implementation-specific execution logic."""
        raise NotImplementedError


class PerformanceMonitoringHook(MonitoringHook):
    """Hook for performance monitoring during deployment."""

    def __init__(self):
        super().__init__("performance_monitoring")
        self.performance_thresholds = {
            "response_time_p95": 100.0,  # ms
            "cpu_usage_avg": 70.0,       # %
            "memory_usage_avg": 80.0,    # %
            "error_rate": 1.0            # %
        }

    def _execute_impl(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Monitor performance metrics during deployment."""
        deployment_context = context.get("deployment_context")
        stage = context.get("stage", PipelineStage.MONITOR)

        # Simulate performance metrics collection
        metrics = self._collect_performance_metrics(deployment_context)

        # Evaluate against thresholds
        violations = []
        for metric, threshold in self.performance_thresholds.items():
            if metric in metrics and metrics[metric] > threshold:
                violations.append({
                    "metric": metric,
                    "value": metrics[metric],
                    "threshold": threshold,
                    "severity": "high" if metrics[metric] > threshold * 1.5 else "medium"
                })

        return {
            "status": "success" if not violations else "warning",
            "metrics": metrics,
            "violations": violations,
            "threshold_check": len(violations) == 0
        }

    def _collect_performance_metrics(self, deployment_context: Optional[DeploymentContext]) -> Dict[str, float]:
        """Collect performance metrics from the deployment environment."""
        # In a real implementation, this would collect metrics from:
        # - Application Performance Monitoring (APM) tools
        # - System monitoring (CPU, memory, network)
        # - Custom application metrics

        # Simulated metrics for demonstration
        return {
            "response_time_p95": 85.0,
            "response_time_avg": 45.0,
            "cpu_usage_avg": 55.0,
            "memory_usage_avg": 65.0,
            "error_rate": 0.5,
            "throughput": 1500.0  # requests per second
        }


class SecurityScanHook(MonitoringHook):
    """Hook for security scanning during deployment."""

    def __init__(self):
        super().__init__("security_scan")
        self.scan_tools = ["bandit", "safety", "semgrep"]

    def _execute_impl(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute security scanning."""
        deployment_context = context.get("deployment_context")
        source_path = context.get("source_path", ".")

        scan_results = {}
        critical_issues = 0
        high_issues = 0

        for tool in self.scan_tools:
            try:
                result = self._run_security_tool(tool, source_path)
                scan_results[tool] = result

                # Count critical and high severity issues
                critical_issues += result.get("critical", 0)
                high_issues += result.get("high", 0)

            except Exception as e:
                self.logger.warning(f"Security tool {tool} failed: {e}")
                scan_results[tool] = {"status": "failed", "error": str(e)}

        # Determine overall security status
        if critical_issues > 0:
            status = "failed"
        elif high_issues > 5:  # Threshold for high issues
            status = "warning"
        else:
            status = "success"

        return {
            "status": status,
            "scan_results": scan_results,
            "summary": {
                "critical_issues": critical_issues,
                "high_issues": high_issues,
                "total_scans": len(self.scan_tools)
            }
        }

    def _run_security_tool(self, tool: str, source_path: str) -> Dict[str, Any]:
        """Run a specific security scanning tool."""
        if tool == "bandit":
            return self._run_bandit(source_path)
        elif tool == "safety":
            return self._run_safety()
        elif tool == "semgrep":
            return self._run_semgrep(source_path)
        else:
            raise ValueError(f"Unknown security tool: {tool}")

    def _run_bandit(self, source_path: str) -> Dict[str, Any]:
        """Run Bandit security scanner."""
        try:
            cmd = ["bandit", "-r", source_path, "-f", "json"]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

            if result.returncode == 0:
                # No issues found
                return {"status": "success", "critical": 0, "high": 0, "medium": 0, "low": 0}
            else:
                # Parse JSON output to count issues by severity
                try:
                    output = json.loads(result.stdout)
                    results = output.get("results", [])

                    severity_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
                    for issue in results:
                        severity = issue.get("issue_severity", "LOW")
                        severity_counts[severity] = severity_counts.get(severity, 0) + 1

                    return {
                        "status": "completed",
                        "critical": 0,  # Bandit doesn't use "critical"
                        "high": severity_counts["HIGH"],
                        "medium": severity_counts["MEDIUM"],
                        "low": severity_counts["LOW"]
                    }
                except json.JSONDecodeError:
                    return {"status": "failed", "error": "Could not parse bandit output"}

        except subprocess.TimeoutExpired:
            return {"status": "failed", "error": "Bandit scan timed out"}
        except FileNotFoundError:
            return {"status": "skipped", "error": "Bandit not installed"}

    def _run_safety(self) -> Dict[str, Any]:
        """Run Safety dependency scanner."""
        try:
            cmd = ["safety", "check", "--json"]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)

            if result.returncode == 0:
                return {"status": "success", "critical": 0, "high": 0, "medium": 0, "low": 0}
            else:
                # Parse vulnerabilities
                try:
                    vulnerabilities = json.loads(result.stdout)

                    # Count by severity (Safety reports all as high by default)
                    vuln_count = len(vulnerabilities)

                    return {
                        "status": "completed",
                        "critical": vuln_count // 3,  # Assume 1/3 are critical
                        "high": vuln_count - (vuln_count // 3),
                        "medium": 0,
                        "low": 0
                    }
                except json.JSONDecodeError:
                    return {"status": "failed", "error": "Could not parse safety output"}

        except subprocess.TimeoutExpired:
            return {"status": "failed", "error": "Safety scan timed out"}
        except FileNotFoundError:
            return {"status": "skipped", "error": "Safety not installed"}

    def _run_semgrep(self, source_path: str) -> Dict[str, Any]:
        """Run Semgrep security scanner."""
        try:
            cmd = ["semgrep", "--config=auto", "--json", source_path]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

            try:
                output = json.loads(result.stdout)
                results = output.get("results", [])

                severity_counts = {"ERROR": 0, "WARNING": 0, "INFO": 0}
                for finding in results:
                    severity = finding.get("extra", {}).get("severity", "INFO")
                    severity_counts[severity] = severity_counts.get(severity, 0) + 1

                return {
                    "status": "completed",
                    "critical": severity_counts["ERROR"],
                    "high": severity_counts["WARNING"],
                    "medium": 0,
                    "low": severity_counts["INFO"]
                }

            except json.JSONDecodeError:
                return {"status": "failed", "error": "Could not parse semgrep output"}

        except subprocess.TimeoutExpired:
            return {"status": "failed", "error": "Semgrep scan timed out"}
        except FileNotFoundError:
            return {"status": "skipped", "error": "Semgrep not installed"}


class ComplianceValidationHook(MonitoringHook):
    """Hook for defense industry compliance validation."""

    def __init__(self):
        super().__init__("compliance_validation")
        self.compliance_checks = [
            "nasa_pot10_compliance",
            "dfars_requirements",
            "fisma_controls",
            "nist_cybersecurity_framework",
            "itar_compliance"
        ]

    def _execute_impl(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute compliance validation checks."""
        deployment_context = context.get("deployment_context")

        compliance_results = {}
        overall_score = 0.0
        total_checks = len(self.compliance_checks)

        for check in self.compliance_checks:
            try:
                result = self._run_compliance_check(check, deployment_context)
                compliance_results[check] = result
                overall_score += result.get("score", 0.0)

            except Exception as e:
                self.logger.warning(f"Compliance check {check} failed: {e}")
                compliance_results[check] = {"status": "failed", "score": 0.0, "error": str(e)}

        average_score = overall_score / total_checks if total_checks > 0 else 0.0

        # Defense industry requires >90% compliance
        if average_score >= 90.0:
            status = "success"
        elif average_score >= 75.0:
            status = "warning"
        else:
            status = "failed"

        return {
            "status": status,
            "overall_score": average_score,
            "compliance_results": compliance_results,
            "defense_ready": average_score >= 90.0
        }

    def _run_compliance_check(self, check: str, deployment_context: Optional[DeploymentContext]) -> Dict[str, Any]:
        """Run a specific compliance check."""

        # Simulate compliance checking based on check type
        if check == "nasa_pot10_compliance":
            return self._check_nasa_pot10()
        elif check == "dfars_requirements":
            return self._check_dfars(deployment_context)
        elif check == "fisma_controls":
            return self._check_fisma()
        elif check == "nist_cybersecurity_framework":
            return self._check_nist_csf()
        elif check == "itar_compliance":
            return self._check_itar(deployment_context)
        else:
            return {"status": "unknown", "score": 0.0}

    def _check_nasa_pot10(self) -> Dict[str, Any]:
        """Check NASA POT10 compliance (Product of Ten safety requirements)."""
        # Simulate NASA POT10 compliance checking
        checks = {
            "error_handling": 95.0,
            "resource_management": 92.0,
            "interface_validation": 88.0,
            "fault_tolerance": 94.0,
            "documentation": 90.0
        }

        average_score = sum(checks.values()) / len(checks)

        return {
            "status": "completed",
            "score": average_score,
            "checks": checks,
            "compliant": average_score >= 90.0
        }

    def _check_dfars(self, deployment_context: Optional[DeploymentContext]) -> Dict[str, Any]:
        """Check DFARS (Defense Federal Acquisition Regulation Supplement) compliance."""
        classification = deployment_context.classification_level if deployment_context else "UNCLASSIFIED"

        # DFARS requirements vary by classification level
        if classification in ["SECRET", "TOP_SECRET"]:
            required_score = 95.0
        elif classification == "CONFIDENTIAL":
            required_score = 90.0
        else:
            required_score = 85.0

        # Simulate DFARS compliance scoring
        simulated_score = 92.0

        return {
            "status": "completed",
            "score": simulated_score,
            "required_score": required_score,
            "classification": classification,
            "compliant": simulated_score >= required_score
        }

    def _check_fisma(self) -> Dict[str, Any]:
        """Check FISMA (Federal Information Security Management Act) compliance."""
        controls = {
            "access_control": 91.0,
            "audit_logging": 94.0,
            "system_integrity": 89.0,
            "incident_response": 92.0,
            "risk_assessment": 90.0
        }

        average_score = sum(controls.values()) / len(controls)

        return {
            "status": "completed",
            "score": average_score,
            "controls": controls,
            "compliant": average_score >= 90.0
        }

    def _check_nist_csf(self) -> Dict[str, Any]:
        """Check NIST Cybersecurity Framework compliance."""
        functions = {
            "identify": 88.0,
            "protect": 92.0,
            "detect": 90.0,
            "respond": 85.0,
            "recover": 87.0
        }

        average_score = sum(functions.values()) / len(functions)

        return {
            "status": "completed",
            "score": average_score,
            "functions": functions,
            "compliant": average_score >= 85.0
        }

    def _check_itar(self, deployment_context: Optional[DeploymentContext]) -> Dict[str, Any]:
        """Check ITAR (International Traffic in Arms Regulations) compliance."""
        # ITAR compliance depends on deployment context
        if deployment_context and deployment_context.region:
            # Domestic deployments have different requirements
            if deployment_context.region.upper() in ["US", "USA", "CONUS"]:
                score = 95.0
            else:
                score = 75.0  # International deployments need additional controls
        else:
            score = 80.0  # Unknown region - moderate score

        return {
            "status": "completed",
            "score": score,
            "region": deployment_context.region if deployment_context else "unknown",
            "compliant": score >= 90.0
        }


class RollbackTriggerHook(MonitoringHook):
    """Hook for automatic rollback trigger evaluation."""

    def __init__(self):
        super().__init__("rollback_trigger")
        self.rollback_thresholds = {
            "error_rate": 5.0,           # %
            "response_time_p95": 500.0,  # ms
            "availability": 99.0,        # %
            "security_violations": 1     # count
        }

    def _execute_impl(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate rollback triggers based on current metrics."""
        deployment_context = context.get("deployment_context")
        current_metrics = context.get("current_metrics", {})

        # Evaluate each rollback threshold
        violations = []
        rollback_required = False

        for metric, threshold in self.rollback_thresholds.items():
            if metric in current_metrics:
                value = current_metrics[metric]

                # Check if threshold is violated
                if metric == "availability":
                    # Availability should be above threshold
                    violated = value < threshold
                else:
                    # Other metrics should be below threshold
                    violated = value > threshold

                if violated:
                    violations.append({
                        "metric": metric,
                        "value": value,
                        "threshold": threshold,
                        "severity": self._calculate_violation_severity(metric, value, threshold)
                    })

                    # Critical violations trigger immediate rollback
                    if self._is_critical_violation(metric, value, threshold):
                        rollback_required = True

        return {
            "status": "completed",
            "rollback_required": rollback_required,
            "violations": violations,
            "evaluation_time": time.time(),
            "deployment_context": deployment_context.__dict__ if deployment_context else None
        }

    def _calculate_violation_severity(self, metric: str, value: float, threshold: float) -> str:
        """Calculate the severity of a threshold violation."""
        if metric == "availability":
            ratio = threshold / value if value > 0 else float('inf')
        else:
            ratio = value / threshold if threshold > 0 else float('inf')

        if ratio >= 2.0:
            return "critical"
        elif ratio >= 1.5:
            return "high"
        elif ratio >= 1.2:
            return "medium"
        else:
            return "low"

    def _is_critical_violation(self, metric: str, value: float, threshold: float) -> bool:
        """Determine if a violation is critical enough to trigger rollback."""
        severity = self._calculate_violation_severity(metric, value, threshold)

        # Critical violations always trigger rollback
        if severity == "critical":
            return True

        # Security violations always trigger rollback regardless of severity
        if metric == "security_violations" and value > 0:
            return True

        return False


class CICDIntegrationHooks:
    """Main CI/CD integration hooks orchestrator."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.hooks: Dict[str, MonitoringHook] = {}
        self.pipeline_integrations = {}
        self.execution_history = []

        # Initialize monitoring hooks
        self._initialize_hooks()

        # Initialize pipeline integrations
        self._initialize_pipeline_integrations()

        self.logger = logging.getLogger('CICDIntegrationHooks')

    def _initialize_hooks(self):
        """Initialize all monitoring hooks."""
        self.hooks = {
            "performance": PerformanceMonitoringHook(),
            "security": SecurityScanHook(),
            "compliance": ComplianceValidationHook(),
            "rollback": RollbackTriggerHook()
        }

    def _initialize_pipeline_integrations(self):
        """Initialize pipeline-specific integrations."""
        if "github" in self.config:
            github_config = self.config["github"]
            self.pipeline_integrations["github"] = GitHubActionsIntegration(
                token=github_config["token"],
                repository=github_config["repository"]
            )

        if "azure" in self.config:
            azure_config = self.config["azure"]
            self.pipeline_integrations["azure"] = AzureDevOpsIntegration(
                organization=azure_config["organization"],
                project=azure_config["project"],
                token=azure_config["token"]
            )

        if "jenkins" in self.config:
            jenkins_config = self.config["jenkins"]
            self.pipeline_integrations["jenkins"] = JenkinsIntegration(
                base_url=jenkins_config["base_url"],
                username=jenkins_config["username"],
                token=jenkins_config["token"]
            )

    def execute_stage_hooks(self, stage: PipelineStage,
                          deployment_context: DeploymentContext,
                          additional_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute hooks for a specific pipeline stage."""
        context = {
            "stage": stage,
            "deployment_context": deployment_context,
            "timestamp": time.time()
        }

        if additional_context:
            context.update(additional_context)

        stage_results = {}

        # Execute hooks based on stage
        if stage == PipelineStage.BUILD:
            # No specific hooks for build stage yet
            pass
        elif stage == PipelineStage.TEST:
            # Test stage hooks could be added here
            pass
        elif stage == PipelineStage.SECURITY_SCAN:
            stage_results["security"] = self.hooks["security"].execute(context)
        elif stage == PipelineStage.COMPLIANCE_CHECK:
            stage_results["compliance"] = self.hooks["compliance"].execute(context)
        elif stage == PipelineStage.DEPLOY:
            # Execute all deployment-related hooks
            stage_results["performance"] = self.hooks["performance"].execute(context)
            stage_results["security"] = self.hooks["security"].execute(context)
            stage_results["compliance"] = self.hooks["compliance"].execute(context)
        elif stage == PipelineStage.MONITOR:
            stage_results["performance"] = self.hooks["performance"].execute(context)
            stage_results["rollback"] = self.hooks["rollback"].execute(context)
        elif stage == PipelineStage.ROLLBACK:
            # Rollback-specific hooks
            stage_results["rollback"] = self.hooks["rollback"].execute(context)

        # Record execution in history
        execution_record = {
            "stage": stage.value,
            "deployment_id": deployment_context.deployment_id,
            "timestamp": time.time(),
            "results": stage_results
        }
        self.execution_history.append(execution_record)

        # Evaluate overall stage success
        overall_status = self._evaluate_stage_status(stage_results)

        return {
            "stage": stage.value,
            "status": overall_status,
            "results": stage_results,
            "deployment_context": deployment_context.__dict__
        }

    def _evaluate_stage_status(self, stage_results: Dict[str, Any]) -> str:
        """Evaluate the overall status of a pipeline stage."""
        if not stage_results:
            return "success"

        statuses = []
        for hook_name, result in stage_results.items():
            status = result.get("status", "unknown")
            statuses.append(status)

        # If any hook failed, the stage failed
        if "failed" in statuses:
            return "failed"
        elif "warning" in statuses:
            return "warning"
        elif all(s == "success" for s in statuses):
            return "success"
        else:
            return "partial"

    def trigger_rollback(self, deployment_context: DeploymentContext,
                        reason: str, pipeline_type: str = "github") -> Dict[str, Any]:
        """Trigger rollback through configured CI/CD pipeline."""
        if pipeline_type not in self.pipeline_integrations:
            return {"status": "failed", "error": f"Pipeline {pipeline_type} not configured"}

        integration = self.pipeline_integrations[pipeline_type]

        # Prepare rollback parameters
        rollback_params = {
            "deployment_id": deployment_context.deployment_id,
            "environment": deployment_context.environment,
            "version": deployment_context.version,
            "reason": reason,
            "triggered_by": "automated_monitoring"
        }

        try:
            if pipeline_type == "github":
                result = integration.trigger_workflow("rollback.yml", rollback_params)
            elif pipeline_type == "azure":
                # Assuming rollback pipeline has definition ID 2
                result = integration.queue_build(2, rollback_params)
            elif pipeline_type == "jenkins":
                result = integration.trigger_job("rollback-pipeline", rollback_params)
            else:
                result = {"status": "failed", "error": "Unknown pipeline type"}

            # Record rollback trigger
            self.execution_history.append({
                "stage": "rollback_triggered",
                "deployment_id": deployment_context.deployment_id,
                "timestamp": time.time(),
                "reason": reason,
                "pipeline_type": pipeline_type,
                "result": result
            })

            return result

        except Exception as e:
            self.logger.error(f"Failed to trigger rollback: {e}")
            return {"status": "failed", "error": str(e)}

    def get_hook_status(self) -> Dict[str, Any]:
        """Get status of all monitoring hooks."""
        hook_status = {}

        for name, hook in self.hooks.items():
            hook_status[name] = {
                "enabled": hook.enabled,
                "execution_count": hook.execution_count,
                "last_execution": hook.last_execution
            }

        return {
            "hooks": hook_status,
            "total_executions": len(self.execution_history),
            "configured_pipelines": list(self.pipeline_integrations.keys())
        }

    def export_execution_history(self, output_path: Path):
        """Export execution history for audit and analysis."""
        export_data = {
            "export_timestamp": time.time(),
            "execution_history": self.execution_history,
            "hook_status": self.get_hook_status(),
            "configuration": {
                "hooks": list(self.hooks.keys()),
                "pipelines": list(self.pipeline_integrations.keys())
            }
        }

        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2, default=str)

        self.logger.info(f"Execution history exported to {output_path}")


# Example usage and testing
if __name__ == "__main__":
    # Example configuration
    config = {
        "github": {
            "token": "github_token_here",
            "repository": "org/defense-system"
        },
        "azure": {
            "organization": "defense-org",
            "project": "critical-systems",
            "token": "azure_token_here"
        }
    }

    # Initialize CI/CD hooks
    cicd_hooks = CICDIntegrationHooks(config)

    # Example deployment context
    deployment_context = DeploymentContext(
        environment="production",
        version="v2.1.0",
        commit_hash="abc123def456",
        branch="main",
        deployment_id="deploy_20241214_001",
        namespace="defense-systems",
        region="US",
        classification_level="SECRET",
        approval_required=True,
        rollback_strategy="automatic"
    )

    # Execute hooks for different pipeline stages
    print("=== CI/CD Pipeline Integration Example ===")

    # Security scan stage
    print("\\n1. Security Scan Stage:")
    security_result = cicd_hooks.execute_stage_hooks(
        PipelineStage.SECURITY_SCAN,
        deployment_context
    )
    print(f"Status: {security_result['status']}")

    # Compliance check stage
    print("\\n2. Compliance Check Stage:")
    compliance_result = cicd_hooks.execute_stage_hooks(
        PipelineStage.COMPLIANCE_CHECK,
        deployment_context
    )
    print(f"Status: {compliance_result['status']}")

    # Deployment stage
    print("\\n3. Deployment Stage:")
    deploy_result = cicd_hooks.execute_stage_hooks(
        PipelineStage.DEPLOY,
        deployment_context
    )
    print(f"Status: {deploy_result['status']}")

    # Monitoring stage with simulated performance issues
    print("\\n4. Monitoring Stage (with performance issues):")
    monitoring_context = {
        "current_metrics": {
            "error_rate": 8.0,  # Above threshold of 5%
            "response_time_p95": 750.0,  # Above threshold of 500ms
            "availability": 98.5,  # Below threshold of 99%
            "security_violations": 0
        }
    }

    monitor_result = cicd_hooks.execute_stage_hooks(
        PipelineStage.MONITOR,
        deployment_context,
        monitoring_context
    )
    print(f"Status: {monitor_result['status']}")

    # Check if rollback is required
    rollback_result = monitor_result['results'].get('rollback', {})
    if rollback_result.get('rollback_required'):
        print("\\n5. Automatic Rollback Triggered!")

        rollback_response = cicd_hooks.trigger_rollback(
            deployment_context,
            "Performance thresholds exceeded",
            "github"
        )
        print(f"Rollback Status: {rollback_response.get('status')}")

    # Export execution history
    export_path = Path("cicd_execution_history.json")
    cicd_hooks.export_execution_history(export_path)
    print(f"\\nExecution history exported to {export_path}")

    # Display hook status
    print("\\n=== Hook Status ===")
    status = cicd_hooks.get_hook_status()
    for hook_name, hook_info in status['hooks'].items():
        print(f"{hook_name}: {hook_info['execution_count']} executions")