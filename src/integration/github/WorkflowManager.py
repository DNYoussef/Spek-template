"""
WorkflowManager - Extracted from github_integration
Handles GitHub Actions workflow management
Part of god object decomposition (Day 4)
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
import json
import logging
import subprocess

from dataclasses import dataclass, field
import yaml

logger = logging.getLogger(__name__)

@dataclass
class Workflow:
    """GitHub Actions workflow information."""
    id: int
    name: str
    path: str
    state: str  # active, disabled
    created_at: datetime
    updated_at: datetime
    url: str
    badge_url: str

@dataclass
class WorkflowRun:
    """Workflow run information."""
    id: int
    name: str
    workflow_id: int
    status: str  # queued, in_progress, completed
    conclusion: Optional[str]  # success, failure, cancelled, skipped
    branch: str
    commit_sha: str
    created_at: datetime
    updated_at: datetime
    run_number: int
    run_attempt: int
    jobs: List[Dict[str, Any]] = field(default_factory=list)

@dataclass
class Job:
    """Workflow job information."""
    id: int
    name: str
    status: str
    conclusion: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    steps: List[Dict[str, Any]] = field(default_factory=list)

@dataclass
class Artifact:
    """Workflow artifact information."""
    id: int
    name: str
    size_bytes: int
    archive_download_url: str
    expired: bool
    created_at: datetime
    expires_at: datetime

class WorkflowManager:
    """
    Handles GitHub Actions workflow management.

    Extracted from github_integration (1, 37 LOC -> ~200 LOC component).
    Handles:
    - Workflow listing and management
    - Workflow runs and jobs
    - Artifacts and logs
    - Workflow dispatch
    - Status monitoring
    """

def __init__(self, repo_owner: str, repo_name: str):
        """Initialize workflow manager."""
        self.repo_owner = repo_owner
        self.repo_name = repo_name
        self.workflows_cache: Dict[int, Workflow] = {}
        self.runs_cache: Dict[int, WorkflowRun] = {}

def list_workflows(self) -> List[Workflow]:
        """List all workflows in repository."""
        try:
            result = subprocess.run(
                ['gh', 'workflow', 'list',
                '--repo', f'{self.repo_owner}/{self.repo_name}',
                '--all',
                '--json', 'id, name, path, state'],
                capture_output=True,
                text=True,
                check=True
            )

            data = json.loads(result.stdout)
            workflows = []

            for workflow_data in data:
                workflow = Workflow(
                    id=workflow_data.get('id', 0),
                    name=workflow_data.get('name', ''),
                    path=workflow_data.get('path', ''),
                    state=workflow_data.get('state', 'active'),
                    created_at=datetime.now(),  # Not provided by gh cli
                    updated_at=datetime.now(),  # Not provided by gh cli
                    url=f"https://github.com/{self.repo_owner}/{self.repo_name}/actions/workflows/{workflow_data.get('path', '')}",
                    badge_url=f"https://github.com/{self.repo_owner}/{self.repo_name}/workflows/{workflow_data.get('name', '')}/badge.svg"
                )
                workflows.append(workflow)
                self.workflows_cache[workflow.id] = workflow

            return workflows

        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            logger.error(f"Failed to list workflows: {e}")
            return []

def trigger_workflow(self,
                        workflow_name: str,
                        ref: str = 'main',
                        inputs: Optional[Dict[str, Any]] = None) -> bool:
        """Manually trigger workflow."""
        try:
            cmd = [
                'gh', 'workflow', 'run', workflow_name,
                '--repo', f'{self.repo_owner}/{self.repo_name}',
                '--ref', ref
            ]

            if inputs:
                for key, value in inputs.items():
                    cmd.extend(['-f', f'{key}={value}'])

            subprocess.run(cmd, check=True, capture_output=True)
            logger.info(f"Triggered workflow: {workflow_name}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to trigger workflow: {e}")
            return False

def list_runs(self,
                workflow_name: Optional[str] = None,
                status: Optional[str] = None,
                limit: int = 10) -> List[WorkflowRun]:
        """List workflow runs."""
        try:
            cmd = [
                'gh', 'run', 'list',
                '--repo', f'{self.repo_owner}/{self.repo_name}',
                '--limit', str(limit),
                '--json', 'databaseId, name, workflowDatabaseId, status, conclusion, headBranch, headSha, createdAt, updatedAt, runNumber, runAttempt'
            ]

            if workflow_name:
                cmd.extend(['--workflow', workflow_name])

            if status:
                cmd.extend(['--status', status])

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )

            data = json.loads(result.stdout)
            runs = []

            for run_data in data:
                run = WorkflowRun(
                    id=run_data.get('databaseId', 0),
                    name=run_data.get('name', ''),
                    workflow_id=run_data.get('workflowDatabaseId', 0),
                    status=run_data.get('status', ''),
                    conclusion=run_data.get('conclusion'),
                    branch=run_data.get('headBranch', ''),
                    commit_sha=run_data.get('headSha', ''),
                    created_at=datetime.fromisoformat(run_data.get('createdAt', datetime.now().isoformat())),
                    updated_at=datetime.fromisoformat(run_data.get('updatedAt', datetime.now().isoformat())),
                    run_number=run_data.get('runNumber', 0),
                    run_attempt=run_data.get('runAttempt', 1)
                )
                runs.append(run)
                self.runs_cache[run.id] = run

            return runs

        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            logger.error(f"Failed to list workflow runs: {e}")
            return []

def get_run_details(self, run_id: int) -> Optional[WorkflowRun]:
        """Get detailed workflow run information."""
        if run_id in self.runs_cache:
            return self.runs_cache[run_id]

        try:
            result = subprocess.run(
                ['gh', 'run', 'view', str(run_id),
                '--repo', f'{self.repo_owner}/{self.repo_name}',
                '--json', 'databaseId, name, workflowDatabaseId, status, conclusion, headBranch, headSha, createdAt, updatedAt, runNumber, runAttempt, jobs'],
                capture_output=True,
                text=True,
                check=True
            )

            data = json.loads(result.stdout)

            run = WorkflowRun(
                id=data.get('databaseId', run_id),
                name=data.get('name', ''),
                workflow_id=data.get('workflowDatabaseId', 0),
                status=data.get('status', ''),
                conclusion=data.get('conclusion'),
                branch=data.get('headBranch', ''),
                commit_sha=data.get('headSha', ''),
                created_at=datetime.fromisoformat(data.get('createdAt', datetime.now().isoformat())),
                updated_at=datetime.fromisoformat(data.get('updatedAt', datetime.now().isoformat())),
                run_number=data.get('runNumber', 0),
                run_attempt=data.get('runAttempt', 1),
                jobs=data.get('jobs', [])
            )

            self.runs_cache[run_id] = run
            return run

        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            logger.error(f"Failed to get run details: {e}")
            return None

def cancel_run(self, run_id: int) -> bool:
        """Cancel workflow run."""
        try:
            subprocess.run(
                ['gh', 'run', 'cancel', str(run_id),
                '--repo', f'{self.repo_owner}/{self.repo_name}'],
                check=True,
                capture_output=True
            )
            logger.info(f"Cancelled run #{run_id}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to cancel run: {e}")
            return False

def rerun_workflow(self, run_id: int, failed_only: bool = False) -> bool:
        """Rerun workflow."""
        try:
            cmd = ['gh', 'run', 'rerun', str(run_id),
                    '--repo', f'{self.repo_owner}/{self.repo_name}']

            if failed_only:
                cmd.append('--failed')

            subprocess.run(cmd, check=True, capture_output=True)
            logger.info(f"Reran workflow run #{run_id}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to rerun workflow: {e}")
            return False

def download_artifact(self,
                        run_id: int,
                        artifact_name: str,
                        destination: str = '.') -> bool:
        """Download workflow artifact."""
        try:
            subprocess.run(
                ['gh', 'run', 'download', str(run_id),
                '--repo', f'{self.repo_owner}/{self.repo_name}',
                '--name', artifact_name,
                '--dir', destination],
                check=True,
                capture_output=True
            )
            logger.info(f"Downloaded artifact {artifact_name} to {destination}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to download artifact: {e}")
            return False

def view_logs(self, run_id: int) -> str:
        """View workflow run logs."""
        try:
            result = subprocess.run(
                ['gh', 'run', 'view', str(run_id),
                '--repo', f'{self.repo_owner}/{self.repo_name}',
                '--log'],
                capture_output=True,
                text=True,
                check=True
            )

            return result.stdout

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to view logs: {e}")
            return ""

def enable_workflow(self, workflow_name: str) -> bool:
        """Enable disabled workflow."""
        try:
            subprocess.run(
                ['gh', 'workflow', 'enable', workflow_name,
                '--repo', f'{self.repo_owner}/{self.repo_name}'],
                check=True,
                capture_output=True
            )
            logger.info(f"Enabled workflow: {workflow_name}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to enable workflow: {e}")
            return False

def disable_workflow(self, workflow_name: str) -> bool:
        """Disable workflow."""
        try:
            subprocess.run(
                ['gh', 'workflow', 'disable', workflow_name,
                '--repo', f'{self.repo_owner}/{self.repo_name}'],
                check=True,
                capture_output=True
            )
            logger.info(f"Disabled workflow: {workflow_name}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to disable workflow: {e}")
            return False

def create_workflow(self,
                        name: str,
                        path: str,
                        content: str) -> bool:
        """Create new workflow file."""
        try:
            # Parse YAML to validate
            yaml.safe_load(content)

            # Write workflow file
            workflow_path = f'.github/workflows/{path}'
            with open(workflow_path, 'w') as f:
                f.write(content)

            # Commit and push
            subprocess.run(['git', 'add', workflow_path], check=True)
            subprocess.run(['git', 'commit', '-m', f'Add workflow: {name}'], check=True)
            subprocess.run(['git', 'push'], check=True)

            logger.info(f"Created workflow: {name}")
            return True

        except (yaml.YAMLError, subprocess.CalledProcessError) as e:
            logger.error(f"Failed to create workflow: {e}")
            return False

def get_workflow_stats(self) -> Dict[str, Any]:
        """Get workflow statistics."""
        runs = self.list_runs(limit=100)

        if not runs:
            return {"total_runs": 0}

        successful = sum(1 for r in runs if r.conclusion == 'success')
        failed = sum(1 for r in runs if r.conclusion == 'failure')
        cancelled = sum(1 for r in runs if r.conclusion == 'cancelled')

        return {
            "total_runs": len(runs),
            "successful": successful,
            "failed": failed,
            "cancelled": cancelled,
            "success_rate": (successful / len(runs) * 100) if runs else 0,
            "active_workflows": len(self.list_workflows())
        }