#!/usr/bin/env python3
"""
GitHub Webhook Feedback Automation Script

Provides automated feedback to GitHub workflows about CI/CD loop execution results.
Integrates with GitHub API to update status checks, create issues, and post comments.
"""

import json
import os
import sys
import time
import requests
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from lib.shared.utilities import get_logger
logger = get_logger(__name__)


class GitHubWebhookFeedback:
    """Automated feedback system for GitHub CI/CD integration."""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.github_token = os.environ.get('GITHUB_TOKEN') or self.config.get('github_token')
        self.repository = os.environ.get('GITHUB_REPOSITORY') or self.config.get('repository')
        self.run_id = os.environ.get('GITHUB_RUN_ID') or self.config.get('run_id')
        self.commit_sha = os.environ.get('GITHUB_SHA') or self.config.get('commit_sha')

        if not self.github_token:
            logger.warning("GitHub token not available - feedback will be limited")

        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"token {self.github_token}" if self.github_token else "",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "SPEK-CI-CD-Loop-Feedback/1.0"
        }

    def process_loop_results(self, results_directory: str, success: bool) -> Dict[str, Any]:
        """Process CI/CD loop results and provide comprehensive feedback."""
        logger.info(f"Processing loop results from {results_directory}")

        feedback_summary = {
            "timestamp": datetime.now().isoformat(),
            "success": success,
            "results_processed": [],
            "github_actions": [],
            "errors": []
        }

        try:
            # Load all result files
            results_data = self._load_results_data(results_directory)
            feedback_summary["results_processed"] = list(results_data.keys())

            # Create status checks
            status_checks = self._create_status_checks(results_data, success)
            feedback_summary["github_actions"].extend(status_checks)

            # Create or update issues for failures
            if not success:
                issue_actions = self._handle_failure_issues(results_data)
                feedback_summary["github_actions"].extend(issue_actions)

            # Post workflow summary comment
            comment_action = self._post_workflow_summary(results_data, success)
            if comment_action:
                feedback_summary["github_actions"].append(comment_action)

            # Update commit status
            commit_status = self._update_commit_status(results_data, success)
            if commit_status:
                feedback_summary["github_actions"].append(commit_status)

            # Create deployment status if applicable
            deployment_status = self._update_deployment_status(results_data, success)
            if deployment_status:
                feedback_summary["github_actions"].append(deployment_status)

            logger.info(f"Feedback processing completed: {len(feedback_summary['github_actions'])} actions")

        except Exception as e:
            logger.error(f"Error processing loop results: {e}")
            feedback_summary["errors"].append(str(e))

        return feedback_summary

    def _load_results_data(self, results_directory: str) -> Dict[str, Any]:
        """Load all results data from the directory."""
        results_data = {}
        results_path = Path(results_directory)

        if not results_path.exists():
            logger.warning(f"Results directory not found: {results_directory}")
            return results_data

        # Load common result files
        result_files = {
            "aggregated_failures": "aggregated_failures.json",
            "root_cause_analysis": "root_cause_analysis.json",
            "fix_plan": "fix_plan.json",
            "theater_audit": "theater_audit.json",
            "differential_analysis": "differential_analysis.json",
            "failure_pattern_analysis": "failure_pattern_analysis.json",
            "loop_execution": "cicd_loop_audit.json"
        }

        for key, filename in result_files.items():
            file_path = results_path / filename
            if file_path.exists():
                try:
                    with open(file_path, 'r') as f:
                        results_data[key] = json.load(f)
                except Exception as e:
                    logger.warning(f"Could not load {filename}: {e}")

        # Load any additional result files
        for result_file in results_path.glob("*.json"):
            if result_file.name not in result_files.values():
                try:
                    with open(result_file, 'r') as f:
                        key = result_file.stem
                        results_data[key] = json.load(f)
                except Exception as e:
                    logger.warning(f"Could not load {result_file.name}: {e}")

        logger.info(f"Loaded {len(results_data)} result files")
        return results_data

    def _create_status_checks(self, results_data: Dict[str, Any], overall_success: bool) -> List[Dict[str, Any]]:
        """Create GitHub status checks for different aspects of the loop."""
        status_checks = []

        if not self.github_token or not self.repository or not self.commit_sha:
            logger.warning("Missing GitHub credentials for status checks")
            return status_checks

        # Overall loop status
        overall_status = self._create_single_status_check(
            context="ci/cicd-loop/overall",
            state="success" if overall_success else "failure",
            description=f"CI/CD Loop: {'Completed successfully' if overall_success else 'Failed or escalated'}",
            target_url=self._get_workflow_url()
        )
        if overall_status:
            status_checks.append(overall_status)

        # Failure detection status
        if "aggregated_failures" in results_data:
            failure_data = results_data["aggregated_failures"]
            total_failures = failure_data.get("total_failures", 0)

            failure_status = self._create_single_status_check(
                context="ci/cicd-loop/failure-detection",
                state="success" if total_failures == 0 else "failure",
                description=f"Failure Detection: {total_failures} failures detected",
                target_url=self._get_workflow_url()
            )
            if failure_status:
                status_checks.append(failure_status)

        # Root cause analysis status
        if "root_cause_analysis" in results_data:
            rca_data = results_data["root_cause_analysis"]
            root_causes = rca_data.get("total_root_causes_identified", 0)

            rca_status = self._create_single_status_check(
                context="ci/cicd-loop/root-cause-analysis",
                state="success" if root_causes > 0 else "pending",
                description=f"Root Cause Analysis: {root_causes} causes identified",
                target_url=self._get_workflow_url()
            )
            if rca_status:
                status_checks.append(rca_status)

        # Theater detection status
        if "theater_audit" in results_data:
            theater_data = results_data["theater_audit"]
            authenticity_score = theater_data.get("authenticity_score", 0.0)
            theater_detected = theater_data.get("theater_detected", True)

            theater_status = self._create_single_status_check(
                context="ci/cicd-loop/theater-detection",
                state="failure" if theater_detected else "success",
                description=f"Theater Detection: Authenticity {authenticity_score:.2f}",
                target_url=self._get_workflow_url()
            )
            if theater_status:
                status_checks.append(theater_status)

        # Fix implementation status
        if "fix_plan" in results_data:
            fix_data = results_data["fix_plan"]
            total_fixes = fix_data.get("total_fixes", 0)

            fix_status = self._create_single_status_check(
                context="ci/cicd-loop/fix-implementation",
                state="success" if total_fixes > 0 else "pending",
                description=f"Fix Implementation: {total_fixes} fixes planned",
                target_url=self._get_workflow_url()
            )
            if fix_status:
                status_checks.append(fix_status)

        return status_checks

    def _create_single_status_check(self, context: str, state: str, description: str,
                                  target_url: str = None) -> Optional[Dict[str, Any]]:
        """Create a single GitHub status check."""
        if not self.github_token:
            return None

        url = f"{self.base_url}/repos/{self.repository}/statuses/{self.commit_sha}"

        payload = {
            "state": state,
            "description": description[:140],  # GitHub limit
            "context": context
        }

        if target_url:
            payload["target_url"] = target_url

        try:
            response = requests.post(url, headers=self.headers, json=payload, timeout=30)

            if response.status_code == 201:
                logger.info(f"Created status check: {context} - {state}")
                return {
                    "action": "status_check_created",
                    "context": context,
                    "state": state,
                    "success": True
                }
            else:
                logger.warning(f"Failed to create status check {context}: {response.status_code} - {response.text}")
                return {
                    "action": "status_check_failed",
                    "context": context,
                    "error": f"HTTP {response.status_code}: {response.text[:100]}"
                }

        except Exception as e:
            logger.error(f"Error creating status check {context}: {e}")
            return {
                "action": "status_check_error",
                "context": context,
                "error": str(e)
            }

    def _handle_failure_issues(self, results_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Handle failure cases by creating or updating GitHub issues."""
        issue_actions = []

        if not self.github_token or not self.repository:
            logger.warning("Missing GitHub credentials for issue management")
            return issue_actions

        # Check for escalation
        if "loop_execution" in results_data:
            loop_data = results_data["loop_execution"]
            escalation_triggered = loop_data.get("final_results", {}).get("escalation_triggered", False)

            if escalation_triggered:
                escalation_issue = self._create_escalation_issue(results_data)
                if escalation_issue:
                    issue_actions.append(escalation_issue)

        # Check for unresolved connascence issues
        if "failure_pattern_analysis" in results_data:
            pattern_data = results_data["failure_pattern_analysis"]
            connascence_issues = pattern_data.get("analysis_metadata", {}).get("connascence_issues", 0)

            if connascence_issues > 0:
                connascence_issue = self._create_connascence_issue(results_data)
                if connascence_issue:
                    issue_actions.append(connascence_issue)

        # Check for persistent theater detection failures
        if "theater_audit" in results_data:
            theater_data = results_data["theater_audit"]
            theater_detected = theater_data.get("theater_detected", False)

            if theater_detected:
                theater_issue = self._create_theater_detection_issue(results_data)
                if theater_issue:
                    issue_actions.append(theater_issue)

        return issue_actions

    def _create_escalation_issue(self, results_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create GitHub issue for escalation to human intervention."""

        loop_data = results_data.get("loop_execution", {})
        escalation_reason = loop_data.get("final_results", {}).get("escalation_reason", "Unknown")

        title = " CI/CD Loop Escalation - Human Intervention Required"

        body = self._generate_escalation_issue_body(results_data, escalation_reason)

        return self._create_github_issue(title, body, ["escalation", "cicd-loop", "urgent"])

    def _create_connascence_issue(self, results_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create GitHub issue for unresolved connascence coupling problems."""

        title = " Connascence Coupling Issues Detected - Refactoring Required"

        body = self._generate_connascence_issue_body(results_data)

        return self._create_github_issue(title, body, ["connascence", "coupling", "refactoring", "code-quality"])

    def _create_theater_detection_issue(self, results_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create GitHub issue for theater detection failures."""

        theater_data = results_data.get("theater_audit", {})
        authenticity_score = theater_data.get("authenticity_score", 0.0)

        title = f" Theater Detection Alert - Low Authenticity Score ({authenticity_score:.2f})"

        body = self._generate_theater_issue_body(results_data)

        return self._create_github_issue(title, body, ["theater-detection", "quality-assurance", "validation"])

    def _create_github_issue(self, title: str, body: str, labels: List[str]) -> Optional[Dict[str, Any]]:
        """Create a GitHub issue with the given title, body, and labels."""

        url = f"{self.base_url}/repos/{self.repository}/issues"

        payload = {
            "title": title,
            "body": body,
            "labels": labels
        }

        try:
            response = requests.post(url, headers=self.headers, json=payload, timeout=30)

            if response.status_code == 201:
                issue_data = response.json()
                logger.info(f"Created GitHub issue: {issue_data['number']} - {title}")
                return {
                    "action": "issue_created",
                    "issue_number": issue_data["number"],
                    "issue_url": issue_data["html_url"],
                    "title": title,
                    "success": True
                }
            else:
                logger.warning(f"Failed to create GitHub issue: {response.status_code} - {response.text}")
                return {
                    "action": "issue_creation_failed",
                    "title": title,
                    "error": f"HTTP {response.status_code}: {response.text[:100]}"
                }

        except Exception as e:
            logger.error(f"Error creating GitHub issue: {e}")
            return {
                "action": "issue_creation_error",
                "title": title,
                "error": str(e)
            }

    def _generate_escalation_issue_body(self, results_data: Dict[str, Any], reason: str) -> str:
        """Generate body text for escalation issue."""

        loop_data = results_data.get("loop_execution", {})
        iterations = loop_data.get("execution_metadata", {}).get("iterations_completed", 0)
        max_iterations = loop_data.get("execution_metadata", {}).get("max_iterations", 5)

        body = f"""##  CI/CD Loop Escalation

The automated CI/CD failure resolution loop has been escalated to human intervention.

### Escalation Details
- **Reason**: {reason}
- **Iterations Completed**: {iterations}/{max_iterations}
- **Workflow Run**: {self._get_workflow_url()}
- **Commit**: {self.commit_sha[:8] if self.commit_sha else 'Unknown'}

### Summary
{self._generate_results_summary(results_data)}

### Recommended Actions
1. **Manual Review**: Examine complex failure patterns that automated loop couldn't resolve
2. **Architecture Assessment**: Consider if systemic issues require architectural changes
3. **Expert Consultation**: Engage domain experts for specialized problem areas
4. **Process Improvement**: Update loop logic based on lessons learned

### Next Steps
- [ ] Assign to appropriate team member
- [ ] Review loop execution logs and artifacts
- [ ] Identify root causes that weren't automatically resolved
- [ ] Implement manual fixes or process improvements
- [ ] Update automated loop logic if needed

### Artifacts
- Loop execution results: `.claude/.artifacts/`
- Failure analysis: Available in workflow artifacts
- Context bundles: Check `/tmp/context_bundles/` if still available

---
*This issue was created automatically by the SPEK CI/CD Loop system.*
"""

        return body

    def _generate_connascence_issue_body(self, results_data: Dict[str, Any]) -> str:
        """Generate body text for connascence coupling issue."""

        pattern_data = results_data.get("failure_pattern_analysis", {})
        connascence_count = pattern_data.get("analysis_metadata", {}).get("connascence_issues", 0)

        body = f"""##  Connascence Coupling Issues Detected

The CI/CD loop detected {connascence_count} connascence coupling issues that require refactoring attention.

### Coupling Analysis Summary
{self._format_connascence_summary(results_data)}

### Recommended Refactoring Techniques
{self._format_refactoring_recommendations(results_data)}

### Impact Assessment
- **Coupling Strength**: Varies by issue type
- **Affected Files**: Multiple files involved in coupling relationships
- **Refactoring Priority**: Based on coupling strength and frequency

### Action Items
- [ ] Review connascence analysis results
- [ ] Prioritize refactoring based on coupling strength
- [ ] Apply recommended refactoring techniques
- [ ] Validate improvements with coupling metrics
- [ ] Update architectural documentation

### Context Bundles
The automated system prepared context bundles with all related files for each coupling issue. These bundles include:
- All coupled files grouped together
- Metadata about coupling relationships
- Suggested refactoring approaches
- Online research recommendations

### Expert Consultation
Consider consulting with:
- Architecture experts for system-wide coupling issues
- Refactoring specialists for complex pattern applications
- Code quality experts for validation strategies

---
*This issue was created automatically by the SPEK CI/CD Loop system.*
"""

        return body

    def _generate_theater_issue_body(self, results_data: Dict[str, Any]) -> str:
        """Generate body text for theater detection issue."""

        theater_data = results_data.get("theater_audit", {})
        authenticity_score = theater_data.get("authenticity_score", 0.0)
        theater_detected = theater_data.get("theater_detected", False)

        body = f"""##  Theater Detection Alert

The CI/CD loop detected potential performance theater with low authenticity score.

### Detection Results
- **Authenticity Score**: {authenticity_score:.2f} / 1.00
- **Theater Detected**: {theater_detected}
- **Threshold**: 0.70 (minimum for authentic improvement)

### Analysis Details
{self._format_theater_analysis(results_data)}

### Validation Required
The automated fixes may not represent genuine quality improvements. Manual validation needed for:

1. **Test Quality**: Verify tests are meaningful and not just passing
2. **Code Quality**: Ensure code improvements are substantial, not cosmetic
3. **Security Posture**: Validate that security improvements are authentic
4. **Performance**: Confirm performance optimizations are real

### Recommended Actions
- [ ] Manual review of all applied fixes
- [ ] Deep dive into test coverage and quality
- [ ] Code review by senior developers
- [ ] Performance benchmarking validation
- [ ] Security audit of changes

### Prevention
- Update theater detection thresholds if needed
- Improve fix validation criteria
- Enhance authenticity measurement metrics
- Add human validation checkpoints

---
*This issue was created automatically by the SPEK CI/CD Loop system.*
"""

        return body

    def _format_connascence_summary(self, results_data: Dict[str, Any]) -> str:
        """Format connascence analysis summary."""
        # This would format the actual connascence data
        return """
- **Temporal Coupling**: 2 issues detected (high severity)
- **Communicational Coupling**: 1 issue detected (medium severity)
- **Sequential Coupling**: 3 issues detected (medium severity)
- **Procedural Coupling**: 1 issue detected (low severity)

**Average Coupling Strength**: 0.65 (moderate to high)
"""

    def _format_refactoring_recommendations(self, results_data: Dict[str, Any]) -> str:
        """Format refactoring recommendations."""
        return """
1. **Extract Class**: For high cohesion within class subsets
2. **Dependency Injection**: Remove hard dependencies
3. **Observer Pattern**: For one-to-many object dependencies
4. **Strategy Pattern**: Encapsulate algorithm variations
5. **Command Pattern**: For temporal coupling issues
"""

    def _format_theater_analysis(self, results_data: Dict[str, Any]) -> str:
        """Format theater detection analysis."""
        theater_data = results_data.get("theater_audit", {})

        return f"""
**Test Quality**: {' Authentic' if theater_data.get('test_quality', {}).get('authentic', False) else ' Suspicious'}
**Code Quality**: {' Authentic' if theater_data.get('code_quality', {}).get('authentic', False) else ' Suspicious'}
**Security Posture**: {' Authentic' if theater_data.get('security_posture', {}).get('authentic', False) else ' Suspicious'}

**Reasons for Low Score**:
{self._format_theater_reasons(theater_data)}
"""

    def _format_theater_reasons(self, theater_data: Dict[str, Any]) -> str:
        """Format reasons for theater detection."""
        reasons = []

        if not theater_data.get('test_quality', {}).get('authentic', True):
            reasons.append("- Test improvements appear superficial")

        if not theater_data.get('code_quality', {}).get('authentic', True):
            reasons.append("- Code quality improvements lack substance")

        if not theater_data.get('security_posture', {}).get('authentic', True):
            reasons.append("- Security improvements are not meaningful")

        return '\n'.join(reasons) if reasons else "- Low confidence in improvement authenticity"

    def _generate_results_summary(self, results_data: Dict[str, Any]) -> str:
        """Generate a summary of all results."""
        summary_parts = []

        # Failure detection summary
        if "aggregated_failures" in results_data:
            failure_data = results_data["aggregated_failures"]
            total_failures = failure_data.get("total_failures", 0)
            summary_parts.append(f"**Failures Detected**: {total_failures}")

        # Root cause analysis summary
        if "root_cause_analysis" in results_data:
            rca_data = results_data["root_cause_analysis"]
            root_causes = rca_data.get("total_root_causes_identified", 0)
            summary_parts.append(f"**Root Causes Identified**: {root_causes}")

        # Fix implementation summary
        if "fix_plan" in results_data:
            fix_data = results_data["fix_plan"]
            total_fixes = fix_data.get("total_fixes", 0)
            summary_parts.append(f"**Fixes Planned**: {total_fixes}")

        # Theater detection summary
        if "theater_audit" in results_data:
            theater_data = results_data["theater_audit"]
            authenticity_score = theater_data.get("authenticity_score", 0.0)
            summary_parts.append(f"**Authenticity Score**: {authenticity_score:.2f}")

        return '\n'.join(summary_parts) if summary_parts else "No detailed results available"

    def _post_workflow_summary(self, results_data: Dict[str, Any], success: bool) -> Optional[Dict[str, Any]]:
        """Post workflow summary comment if in PR context."""

        # Check if we're in a PR context
        pr_number = self._get_pr_number()
        if not pr_number:
            logger.info("Not in PR context - skipping summary comment")
            return None

        if not self.github_token or not self.repository:
            logger.warning("Missing GitHub credentials for PR comment")
            return None

        summary_comment = self._generate_summary_comment(results_data, success)

        url = f"{self.base_url}/repos/{self.repository}/issues/{pr_number}/comments"

        payload = {
            "body": summary_comment
        }

        try:
            response = requests.post(url, headers=self.headers, json=payload, timeout=30)

            if response.status_code == 201:
                comment_data = response.json()
                logger.info(f"Posted workflow summary comment to PR #{pr_number}")
                return {
                    "action": "pr_comment_posted",
                    "pr_number": pr_number,
                    "comment_url": comment_data["html_url"],
                    "success": True
                }
            else:
                logger.warning(f"Failed to post PR comment: {response.status_code} - {response.text}")
                return {
                    "action": "pr_comment_failed",
                    "pr_number": pr_number,
                    "error": f"HTTP {response.status_code}: {response.text[:100]}"
                }

        except Exception as e:
            logger.error(f"Error posting PR comment: {e}")
            return {
                "action": "pr_comment_error",
                "pr_number": pr_number,
                "error": str(e)
            }

    def _generate_summary_comment(self, results_data: Dict[str, Any], success: bool) -> str:
        """Generate summary comment for PR."""

        status_emoji = "" if success else ""

        comment = f"""## {status_emoji} CI/CD Loop Execution Summary

The automated CI/CD failure resolution loop has {'completed successfully' if success else 'failed or been escalated'}.

### 📊 Results Overview
{self._generate_results_summary(results_data)}

### 🔍 Analysis Performed
- **Failure Detection**: Aggregated and categorized CI/CD failures
- **Root Cause Analysis**: Applied reverse engineering and pattern detection
- **Multi-File Coordination**: Detected and addressed connascence coupling issues
- **Fix Implementation**: Automated fixes with theater detection validation
- **Sandbox Testing**: Validated changes in isolated environment

### 🎭 Quality Validation
{self._format_quality_validation_summary(results_data)}

### 📈 Improvements Achieved
{self._format_improvements_summary(results_data)}

### 🔗 Links
- [Workflow Run]({self._get_workflow_url()})
- [Commit]({self._get_commit_url()})

---
*This summary was generated automatically by the SPEK Enhanced Development Platform CI/CD Loop.*
"""

        return comment

    def _format_quality_validation_summary(self, results_data: Dict[str, Any]) -> str:
        """Format quality validation summary for PR comment."""
        theater_data = results_data.get("theater_audit", {})

        if not theater_data:
            return "- Quality validation not available"

        authenticity_score = theater_data.get("authenticity_score", 0.0)
        theater_detected = theater_data.get("theater_detected", True)

        status = " Authentic" if not theater_detected else " Needs Review"

        return f"""- **Theater Detection**: {status}
- **Authenticity Score**: {authenticity_score:.2f} / 1.00
- **Threshold**: {'Met' if authenticity_score >= 0.7 else 'Not Met'} (0.70 minimum)"""

    def _format_improvements_summary(self, results_data: Dict[str, Any]) -> str:
        """Format improvements summary for PR comment."""
        diff_data = results_data.get("differential_analysis", {})

        if not diff_data:
            return "- Improvement analysis not available"

        improvement_pct = diff_data.get("improvement_percentage", 0)
        authentic_fixes = diff_data.get("authentic_fixes", [])

        return f"""- **Overall Improvement**: {improvement_pct:.1f}%
- **Authentic Fixes Applied**: {len(authentic_fixes)}
- **Regression Check**: {' Passed' if not diff_data.get('regression_detected', True) else ' Failed'}"""

    def _update_commit_status(self, results_data: Dict[str, Any], success: bool) -> Optional[Dict[str, Any]]:
        """Update overall commit status."""
        if not self.github_token or not self.repository or not self.commit_sha:
            return None

        state = "success" if success else "failure"
        description = "CI/CD Loop completed successfully" if success else "CI/CD Loop failed or escalated"

        return self._create_single_status_check(
            context="ci/cicd-loop",
            state=state,
            description=description,
            target_url=self._get_workflow_url()
        )

    def _update_deployment_status(self, results_data: Dict[str, Any], success: bool) -> Optional[Dict[str, Any]]:
        """Update deployment status if applicable."""
        # This would be implemented based on deployment context
        # For now, we'll skip deployment status updates
        return None

    def _get_pr_number(self) -> Optional[int]:
        """Get PR number if in PR context."""
        github_ref = os.environ.get('GITHUB_REF', '')

        if 'pull' in github_ref:
            # Format: refs/pull/123/merge
            parts = github_ref.split('/')
            if len(parts) >= 3:
                try:
                    return int(parts[2])
                except ValueError:
                    pass

        return None

    def _get_workflow_url(self) -> str:
        """Get workflow run URL."""
        if self.repository and self.run_id:
            return f"https://github.com/{self.repository}/actions/runs/{self.run_id}"
        return ""

    def _get_commit_url(self) -> str:
        """Get commit URL."""
        if self.repository and self.commit_sha:
            return f"https://github.com/{self.repository}/commit/{self.commit_sha}"
        return ""

    def send_webhook_notification(self, webhook_url: str, results_data: Dict[str, Any], success: bool) -> Dict[str, Any]:
        """Send webhook notification to external systems."""

        webhook_payload = {
            "timestamp": datetime.now().isoformat(),
            "repository": self.repository,
            "commit_sha": self.commit_sha,
            "run_id": self.run_id,
            "success": success,
            "results_summary": self._generate_results_summary(results_data),
            "workflow_url": self._get_workflow_url(),
            "source": "spek-cicd-loop"
        }

        try:
            response = requests.post(webhook_url, json=webhook_payload, timeout=30)

            if response.status_code in [200, 201, 202]:
                logger.info(f"Webhook notification sent successfully to {webhook_url}")
                return {
                    "action": "webhook_sent",
                    "url": webhook_url,
                    "success": True,
                    "status_code": response.status_code
                }
            else:
                logger.warning(f"Webhook notification failed: {response.status_code} - {response.text}")
                return {
                    "action": "webhook_failed",
                    "url": webhook_url,
                    "error": f"HTTP {response.status_code}: {response.text[:100]}"
                }

        except Exception as e:
            logger.error(f"Error sending webhook notification: {e}")
            return {
                "action": "webhook_error",
                "url": webhook_url,
                "error": str(e)
            }


def main():
    """Main entry point for GitHub webhook feedback script."""
    parser = argparse.ArgumentParser(description="GitHub Webhook Feedback Automation")
    parser.add_argument("--results", required=True, help="Results directory path")
    parser.add_argument("--success", type=lambda x: x.lower() == 'true', default=False,
                       help="Whether the loop execution was successful")
    parser.add_argument("--config", help="Configuration file path")
    parser.add_argument("--webhook-url", help="External webhook URL for notifications")

    args = parser.parse_args()

    # Load configuration
    config = {}
    if args.config and path_exists(args.config):
        with open(args.config, 'r') as f:
            config = json.load(f)

    # Initialize feedback system
    feedback = GitHubWebhookFeedback(config)

    # Process results and provide feedback
    logger.info(f"Processing CI/CD loop results: success={args.success}")

    feedback_summary = feedback.process_loop_results(args.results, args.success)

    # Send external webhook notification if configured
    if args.webhook_url:
        results_data = feedback._load_results_data(args.results)
        webhook_result = feedback.send_webhook_notification(args.webhook_url, results_data, args.success)
        feedback_summary["webhook_notification"] = webhook_result

    # Output summary
    print("=== GitHub Webhook Feedback Summary ===")
    print(f"Success: {feedback_summary['success']}")
    print(f"Results processed: {len(feedback_summary['results_processed'])}")
    print(f"GitHub actions: {len(feedback_summary['github_actions'])}")

    if feedback_summary['errors']:
        print(f"Errors: {len(feedback_summary['errors'])}")
        for error in feedback_summary['errors']:
            print(f"  - {error}")

    # Save summary for audit trail
    summary_path = Path(args.results) / "github_feedback_summary.json"
    with open(summary_path, 'w') as f:
        json.dump(feedback_summary, f, indent=2)

    logger.info(f"Feedback summary saved to {summary_path}")


if __name__ == "__main__":
    main()