"""
PRManager - Extracted from github_integration
Handles GitHub pull request management
Part of god object decomposition (Day 4)
"""

from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
import json
import logging
import subprocess

from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

@dataclass
class PullRequest:
    """GitHub pull request information."""
    number: int
    title: str
    body: str
    state: str  # open, closed, merged
    author: str
    base_branch: str
    head_branch: str
    created_at: datetime
    updated_at: datetime
    merged: bool
    mergeable: Optional[bool]
    labels: List[str] = field(default_factory=list)
    reviewers: List[str] = field(default_factory=list)
    checks: List[Dict[str, Any]] = field(default_factory=list)

@dataclass
class Review:
    """Pull request review information."""
    id: int
    author: str
    state: str  # APPROVED, CHANGES_REQUESTED, COMMENTED
    body: str
    submitted_at: datetime

@dataclass
class Comment:
    """Pull request comment."""
    id: int
    author: str
    body: str
    created_at: datetime
    path: Optional[str] = None
    line: Optional[int] = None

class PRManager:
    """
    Handles GitHub pull request management.

    Extracted from github_integration (1, 37 LOC -> ~250 LOC component).
    Handles:
    - PR creation and updates
    - Reviews and approvals
    - Comments and discussions
    - Merge operations
    - PR status checks
    """

def __init__(self, repo_owner: str, repo_name: str):
        """Initialize PR manager."""
        self.repo_owner = repo_owner
        self.repo_name = repo_name
        self.pull_requests: Dict[int, PullRequest] = {}

def create_pull_request(self,
                            title: str,
                            body: str,
                            head_branch: str,
                            base_branch: str = 'main',
                            labels: Optional[List[str]] = None,
                            reviewers: Optional[List[str]] = None) -> Optional[PullRequest]:
        """Create new pull request."""
        try:
            cmd = [
                'gh', 'pr', 'create',
                '--title', title,
                '--body', body,
                '--base', base_branch,
                '--head', head_branch,
                '--repo', f'{self.repo_owner}/{self.repo_name}'
            ]

            if labels:
                cmd.extend(['--label', ','.join(labels)])

            if reviewers:
                cmd.extend(['--reviewer', ','.join(reviewers)])

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )

            # Extract PR number from output
            pr_url = result.stdout.strip()
            pr_number = int(pr_url.split('/')[-1])

            # Get PR details
            pr = self.get_pull_request(pr_number)
            logger.info(f"Created pull request #{pr_number}: {title}")
            return pr

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to create pull request: {e}")
            return None

def get_pull_request(self, pr_number: int) -> Optional[PullRequest]:
        """Get pull request details."""
        try:
            result = subprocess.run(
                ['gh', 'pr', 'view', str(pr_number),
                '--repo', f'{self.repo_owner}/{self.repo_name}',
                '--json', 'number, title, body, state, author, baseRefName, headRefName, createdAt, updatedAt, merged, mergeable, labels, reviewRequests, statusCheckRollup'],
                capture_output=True,
                text=True,
                check=True
            )

            data = json.loads(result.stdout)

            pr = PullRequest(
                number=data.get('number', pr_number),
                title=data.get('title', ''),
                body=data.get('body', ''),
                state=data.get('state', 'OPEN').lower(),
                author=data.get('author', {}).get('login', ''),
                base_branch=data.get('baseRefName', 'main'),
                head_branch=data.get('headRefName', ''),
                created_at=datetime.fromisoformat(data.get('createdAt', datetime.now().isoformat())),
                updated_at=datetime.fromisoformat(data.get('updatedAt', datetime.now().isoformat())),
                merged=data.get('merged', False),
                mergeable=data.get('mergeable'),
                labels=[label.get('name', '') for label in data.get('labels', [])],
                reviewers=[r.get('login', '') for r in data.get('reviewRequests', [])],
                checks=data.get('statusCheckRollup', [])
            )

            self.pull_requests[pr_number] = pr
            return pr

        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            logger.error(f"Failed to get pull request: {e}")
            return None

def list_pull_requests(self,
                            state: str = 'open',
                            limit: int = 10) -> List[PullRequest]:
        """List pull requests."""
        try:
            cmd = [
                'gh', 'pr', 'list',
                '--repo', f'{self.repo_owner}/{self.repo_name}',
                '--state', state,
                '--limit', str(limit),
                '--json', 'number, title, state, author, createdAt, updatedAt, labels'
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )

            data = json.loads(result.stdout)
            prs = []

            for pr_data in data:
                pr = PullRequest(
                    number=pr_data.get('number', 0),
                    title=pr_data.get('title', ''),
                    body='',  # Not included in list view
                    state=pr_data.get('state', 'OPEN').lower(),
                    author=pr_data.get('author', {}).get('login', ''),
                    base_branch='',  # Not included in list view
                    head_branch='',  # Not included in list view
                    created_at=datetime.fromisoformat(pr_data.get('createdAt', datetime.now().isoformat())),
                    updated_at=datetime.fromisoformat(pr_data.get('updatedAt', datetime.now().isoformat())),
                    merged=False,
                    mergeable=None,
                    labels=[label.get('name', '') for label in pr_data.get('labels', [])]
                )
                prs.append(pr)

            return prs

        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            logger.error(f"Failed to list pull requests: {e}")
            return []

def update_pull_request(self,
                            pr_number: int,
                            title: Optional[str] = None,
                            body: Optional[str] = None,
                            labels: Optional[List[str]] = None) -> bool:
        """Update pull request."""
        try:
            cmd = ['gh', 'pr', 'edit', str(pr_number),
                    '--repo', f'{self.repo_owner}/{self.repo_name}']

            if title:
                cmd.extend(['--title', title])
            if body:
                cmd.extend(['--body', body])
            if labels is not None:
                cmd.extend(['--add-label', ','.join(labels)])

            subprocess.run(cmd, check=True, capture_output=True)
            logger.info(f"Updated pull request #{pr_number}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to update pull request: {e}")
            return False

def add_comment(self,
                    pr_number: int,
                    comment: str) -> bool:
        """Add comment to pull request."""
        try:
            subprocess.run(
                ['gh', 'pr', 'comment', str(pr_number),
                '--repo', f'{self.repo_owner}/{self.repo_name}',
                '--body', comment],
                check=True,
                capture_output=True
            )
            logger.info(f"Added comment to PR #{pr_number}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to add comment: {e}")
            return False

def request_review(self,
                        pr_number: int,
                        reviewers: List[str]) -> bool:
        """Request reviews for pull request."""
        try:
            subprocess.run(
                ['gh', 'pr', 'review', str(pr_number),
                '--repo', f'{self.repo_owner}/{self.repo_name}',
                '--request'] + reviewers,
                check=True,
                capture_output=True
            )
            logger.info(f"Requested reviews for PR #{pr_number} from {reviewers}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to request reviews: {e}")
            return False

def approve_pull_request(self,
                            pr_number: int,
                            comment: Optional[str] = None) -> bool:
        """Approve pull request."""
        try:
            cmd = ['gh', 'pr', 'review', str(pr_number),
                    '--repo', f'{self.repo_owner}/{self.repo_name}',
                    '--approve']

            if comment:
                cmd.extend(['--body', comment])

            subprocess.run(cmd, check=True, capture_output=True)
            logger.info(f"Approved PR #{pr_number}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to approve pull request: {e}")
            return False

def request_changes(self,
                        pr_number: int,
                        comment: str) -> bool:
        """Request changes on pull request."""
        try:
            subprocess.run(
                ['gh', 'pr', 'review', str(pr_number),
                '--repo', f'{self.repo_owner}/{self.repo_name}',
                '--request-changes',
                '--body', comment],
                check=True,
                capture_output=True
            )
            logger.info(f"Requested changes for PR #{pr_number}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to request changes: {e}")
            return False

def merge_pull_request(self,
                            pr_number: int,
                            merge_method: str = 'merge') -> bool:
        """Merge pull request."""
        try:
            method_map = {
                'merge': '--merge',
                'squash': '--squash',
                'rebase': '--rebase'
            }

            subprocess.run(
                ['gh', 'pr', 'merge', str(pr_number),
                '--repo', f'{self.repo_owner}/{self.repo_name}',
                method_map.get(merge_method, '--merge'),
                '--delete-branch'],
                check=True,
                capture_output=True
            )
            logger.info(f"Merged PR #{pr_number} using {merge_method}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to merge pull request: {e}")
            return False

def close_pull_request(self,
                            pr_number: int,
                            comment: Optional[str] = None) -> bool:
        """Close pull request without merging."""
        try:
            cmd = ['gh', 'pr', 'close', str(pr_number),
                    '--repo', f'{self.repo_owner}/{self.repo_name}']

            if comment:
                cmd.extend(['--comment', comment])

            subprocess.run(cmd, check=True, capture_output=True)
            logger.info(f"Closed PR #{pr_number}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to close pull request: {e}")
            return False

def get_pr_checks(self, pr_number: int) -> List[Dict[str, Any]]:
        """Get status checks for pull request."""
        try:
            result = subprocess.run(
                ['gh', 'pr', 'checks', str(pr_number),
                '--repo', f'{self.repo_owner}/{self.repo_name}',
                '--json', 'name, status, conclusion, startedAt, completedAt'],
                capture_output=True,
                text=True,
                check=True
            )

            return json.loads(result.stdout)

        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            logger.error(f"Failed to get PR checks: {e}")
            return []

def get_pr_diff(self, pr_number: int) -> str:
        """Get diff for pull request."""
        try:
            result = subprocess.run(
                ['gh', 'pr', 'diff', str(pr_number),
                '--repo', f'{self.repo_owner}/{self.repo_name}'],
                capture_output=True,
                text=True,
                check=True
            )

            return result.stdout

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to get PR diff: {e}")
            return ""