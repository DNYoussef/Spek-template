"""
IssueTracker - Extracted from github_integration
Handles GitHub issue tracking operations
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
class Issue:
    """GitHub issue information."""
    number: int
    title: str
    body: str
    state: str  # open, closed
    author: str
    assignees: List[str]
    labels: List[str]
    milestone: Optional[str]
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime]
    comments_count: int
    reactions: Dict[str, int] = field(default_factory=dict)

@dataclass
class IssueComment:
    """Issue comment information."""
    id: int
    author: str
    body: str
    created_at: datetime
    updated_at: datetime
    reactions: Dict[str, int] = field(default_factory=dict)

@dataclass
class Label:
    """GitHub label information."""
    name: str
    color: str
    description: Optional[str]

@dataclass
class Milestone:
    """GitHub milestone information."""
    number: int
    title: str
    description: Optional[str]
    state: str  # open, closed
    due_date: Optional[datetime]
    open_issues: int
    closed_issues: int

class IssueTracker:
    """
    Handles GitHub issue tracking operations.

    Extracted from github_integration (1, 37 LOC -> ~200 LOC component).
    Handles:
    - Issue creation and management
    - Labels and milestones
    - Comments and reactions
    - Issue search and filtering
    - Issue templates
    """

def __init__(self, repo_owner: str, repo_name: str):
        """Initialize issue tracker."""
        self.repo_owner = repo_owner
        self.repo_name = repo_name
        self.issues_cache: Dict[int, Issue] = {}
        self.labels_cache: List[Label] = []
        self.milestones_cache: List[Milestone] = []

def create_issue(self,
                    title: str,
                    body: str,
                    labels: Optional[List[str]] = None,
                    assignees: Optional[List[str]] = None,
                    milestone: Optional[str] = None) -> Optional[Issue]:
        """Create new GitHub issue."""
        try:
            cmd = [
                'gh', 'issue', 'create',
                '--title', title,
                '--body', body,
                '--repo', f'{self.repo_owner}/{self.repo_name}'
            ]

            if labels:
                cmd.extend(['--label', ','.join(labels)])

            if assignees:
                cmd.extend(['--assignee', ','.join(assignees)])

            if milestone:
                cmd.extend(['--milestone', milestone])

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )

            # Extract issue number from output
            issue_url = result.stdout.strip()
            issue_number = int(issue_url.split('/')[-1])

            # Get issue details
            issue = self.get_issue(issue_number)
            logger.info(f"Created issue #{issue_number}: {title}")
            return issue

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to create issue: {e}")
            return None

def get_issue(self, issue_number: int) -> Optional[Issue]:
        """Get issue details."""
        if issue_number in self.issues_cache:
            return self.issues_cache[issue_number]

        try:
            result = subprocess.run(
                ['gh', 'issue', 'view', str(issue_number),
                '--repo', f'{self.repo_owner}/{self.repo_name}',
                '--json', 'number, title, body, state, author, assignees, labels, milestone, createdAt, updatedAt, closedAt, comments'],
                capture_output=True,
                text=True,
                check=True
            )

            data = json.loads(result.stdout)

            issue = Issue(
                number=data.get('number', issue_number),
                title=data.get('title', ''),
                body=data.get('body', ''),
                state=data.get('state', 'OPEN').lower(),
                author=data.get('author', {}).get('login', ''),
                assignees=[a.get('login', '') for a in data.get('assignees', [])],
                labels=[l.get('name', '') for l in data.get('labels', [])],
                milestone=data.get('milestone', {}).get('title') if data.get('milestone') else None,
                created_at=datetime.fromisoformat(data.get('createdAt', datetime.now().isoformat())),
                updated_at=datetime.fromisoformat(data.get('updatedAt', datetime.now().isoformat())),
                closed_at=datetime.fromisoformat(data.get('closedAt')) if data.get('closedAt') else None,
                comments_count=len(data.get('comments', []))
            )

            self.issues_cache[issue_number] = issue
            return issue

        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            logger.error(f"Failed to get issue: {e}")
            return None

def list_issues(self,
                    state: str = 'open',
                    labels: Optional[List[str]] = None,
                    assignee: Optional[str] = None,
                    limit: int = 30) -> List[Issue]:
        """List issues with filters."""
        try:
            cmd = [
                'gh', 'issue', 'list',
                '--repo', f'{self.repo_owner}/{self.repo_name}',
                '--state', state,
                '--limit', str(limit),
                '--json', 'number, title, state, author, labels, assignees, createdAt, updatedAt'
            ]

            if labels:
                cmd.extend(['--label', ','.join(labels)])

            if assignee:
                cmd.extend(['--assignee', assignee])

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )

            data = json.loads(result.stdout)
            issues = []

            for issue_data in data:
                issue = Issue(
                    number=issue_data.get('number', 0),
                    title=issue_data.get('title', ''),
                    body='',  # Not included in list
                    state=issue_data.get('state', 'OPEN').lower(),
                    author=issue_data.get('author', {}).get('login', ''),
                    assignees=[a.get('login', '') for a in issue_data.get('assignees', [])],
                    labels=[l.get('name', '') for l in issue_data.get('labels', [])],
                    milestone=None,
                    created_at=datetime.fromisoformat(issue_data.get('createdAt', datetime.now().isoformat())),
                    updated_at=datetime.fromisoformat(issue_data.get('updatedAt', datetime.now().isoformat())),
                    closed_at=None,
                    comments_count=0
                )
                issues.append(issue)

            return issues

        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            logger.error(f"Failed to list issues: {e}")
            return []

def update_issue(self,
                    issue_number: int,
                    title: Optional[str] = None,
                    body: Optional[str] = None,
                    state: Optional[str] = None,
                    labels: Optional[List[str]] = None,
                    assignees: Optional[List[str]] = None) -> bool:
        """Update issue."""
        try:
            cmd = ['gh', 'issue', 'edit', str(issue_number),
                    '--repo', f'{self.repo_owner}/{self.repo_name}']

            if title:
                cmd.extend(['--title', title])
            if body:
                cmd.extend(['--body', body])
            if labels is not None:
                cmd.extend(['--add-label', ','.join(labels)])
            if assignees is not None:
                cmd.extend(['--add-assignee', ','.join(assignees)])

            subprocess.run(cmd, check=True, capture_output=True)

            # Handle state change separately
            if state:
                if state == 'closed':
                    self.close_issue(issue_number)
                elif state == 'open':
                    self.reopen_issue(issue_number)

            # Clear cache
            if issue_number in self.issues_cache:
                del self.issues_cache[issue_number]

            logger.info(f"Updated issue #{issue_number}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to update issue: {e}")
            return False

def close_issue(self,
                    issue_number: int,
                    comment: Optional[str] = None) -> bool:
        """Close issue."""
        try:
            cmd = ['gh', 'issue', 'close', str(issue_number),
                    '--repo', f'{self.repo_owner}/{self.repo_name}']

            if comment:
                cmd.extend(['--comment', comment])

            subprocess.run(cmd, check=True, capture_output=True)
            logger.info(f"Closed issue #{issue_number}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to close issue: {e}")
            return False

def reopen_issue(self, issue_number: int) -> bool:
        """Reopen closed issue."""
        try:
            subprocess.run(
                ['gh', 'issue', 'reopen', str(issue_number),
                '--repo', f'{self.repo_owner}/{self.repo_name}'],
                check=True,
                capture_output=True
            )
            logger.info(f"Reopened issue #{issue_number}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to reopen issue: {e}")
            return False

def add_comment(self,
                    issue_number: int,
                    comment: str) -> bool:
        """Add comment to issue."""
        try:
            subprocess.run(
                ['gh', 'issue', 'comment', str(issue_number),
                '--repo', f'{self.repo_owner}/{self.repo_name}',
                '--body', comment],
                check=True,
                capture_output=True
            )
            logger.info(f"Added comment to issue #{issue_number}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to add comment: {e}")
            return False

def create_label(self,
                    name: str,
                    description: Optional[str] = None,
                    color: Optional[str] = None) -> bool:
        """Create new label."""
        try:
            cmd = ['gh', 'label', 'create', name,
                    '--repo', f'{self.repo_owner}/{self.repo_name}']

            if description:
                cmd.extend(['--description', description])
            if color:
                cmd.extend(['--color', color])

            subprocess.run(cmd, check=True, capture_output=True)
            logger.info(f"Created label: {name}")

            # Clear cache
            self.labels_cache = []
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to create label: {e}")
            return False

def list_labels(self) -> List[Label]:
        """List all repository labels."""
        if self.labels_cache:
            return self.labels_cache

        try:
            result = subprocess.run(
                ['gh', 'label', 'list',
                '--repo', f'{self.repo_owner}/{self.repo_name}',
                '--json', 'name, color, description'],
                capture_output=True,
                text=True,
                check=True
            )

            data = json.loads(result.stdout)
            labels = []

            for label_data in data:
                label = Label(
                    name=label_data.get('name', ''),
                    color=label_data.get('color', ''),
                    description=label_data.get('description')
                )
                labels.append(label)

            self.labels_cache = labels
            return labels

        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            logger.error(f"Failed to list labels: {e}")
            return []

def search_issues(self, query: str) -> List[Issue]:
        """Search issues using GitHub search syntax."""
        try:
            result = subprocess.run(
                ['gh', 'search', 'issues',
                query,
                f'--repo={self.repo_owner}/{self.repo_name}',
                '--json', 'number, title, state, author, createdAt'],
                capture_output=True,
                text=True,
                check=True
            )

            data = json.loads(result.stdout)
            issues = []

            for issue_data in data:
                issue = Issue(
                    number=issue_data.get('number', 0),
                    title=issue_data.get('title', ''),
                    body='',
                    state=issue_data.get('state', 'OPEN').lower(),
                    author=issue_data.get('author', {}).get('login', ''),
                    assignees=[],
                    labels=[],
                    milestone=None,
                    created_at=datetime.fromisoformat(issue_data.get('createdAt', datetime.now().isoformat())),
                    updated_at=datetime.now(),
                    closed_at=None,
                    comments_count=0
                )
                issues.append(issue)

            return issues

        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            logger.error(f"Failed to search issues: {e}")
            return []

def get_issue_timeline(self, issue_number: int) -> List[Dict[str, Any]]:
        """Get issue timeline events."""
        try:
            result = subprocess.run(
                ['gh', 'api',
                f'/repos/{self.repo_owner}/{self.repo_name}/issues/{issue_number}/timeline',
                '--paginate'],
                capture_output=True,
                text=True,
                check=True
            )

            return json.loads(result.stdout) if result.stdout else []

        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            logger.error(f"Failed to get issue timeline: {e}")
            return []