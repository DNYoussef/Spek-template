"""
GitHubClient - Extracted from github_integration
Handles core GitHub repository operations
Part of god object decomposition (Day 4)
"""

from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
import json
import logging
import os
import subprocess

from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class Repository:
    """GitHub repository information."""
    owner: str
    name: str
    url: str
    default_branch: str
    description: Optional[str]
    topics: List[str]
    is_private: bool
    created_at: datetime
    updated_at: datetime

@dataclass
class Branch:
    """Git branch information."""
    name: str
    sha: str
    protected: bool
    ahead_by: int
    behind_by: int

@dataclass
class Commit:
    """Git commit information."""
    sha: str
    message: str
    author: str
    author_email: str
    date: datetime
    files_changed: List[str]

class GitHubClient:
    """
    Handles core GitHub repository operations.

    Extracted from github_integration (1, 37 LOC -> ~250 LOC component).
    Handles:
    - Repository management
    - Branch operations
    - Commit history
    - File operations
    - GitHub API interactions
    """

    def __init__(self, token: Optional[str] = None):
        """Initialize GitHub client."""
        self.token = token or os.environ.get('GITHUB_TOKEN')
        self.current_repo: Optional[Repository] = None
        self.api_cache: Dict[str, Any] = {}

        # Validate gh CLI availability
        self._validate_gh_cli()

    def _validate_gh_cli(self) -> None:
        """Validate GitHub CLI is installed and authenticated."""
        try:
            result = subprocess.run(
                ['gh', 'auth', 'status'],
                capture_output=True,
                text=True,
                check=False
            )
            if result.returncode != 0:
                logger.warning("GitHub CLI not authenticated. Some features may be limited.")
        except FileNotFoundError:
            logger.warning("GitHub CLI not found. Install with: brew install gh")

    def _execute_gh_command(self, args: List[str]) -> Dict[str, Any]:
        """Execute GitHub CLI command and return JSON output."""
        try:
            cmd = ['gh'] + args + ['--json']
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            return json.loads(result.stdout) if result.stdout else {}
        except subprocess.CalledProcessError as e:
            logger.error(f"GitHub CLI command failed: {e}")
            return {}
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse GitHub CLI output: {e}")
            return {}

    def get_repository(self, owner: str, name: str) -> Optional[Repository]:
        """Get repository information."""
        cache_key = f"repo:{owner}/{name}"
        if cache_key in self.api_cache:
            return self.api_cache[cache_key]

        data = self._execute_gh_command([
            'repo', 'view', f'{owner}/{name}',
            '--json', 'owner, name, url, defaultBranchRef, description, repositoryTopics, isPrivate, createdAt, updatedAt'
        ])

        if not data:
            return None

        repo = Repository(
            owner=data.get('owner', {}).get('login', owner),
            name=data.get('name', name),
            url=data.get('url', f'https://github.com/{owner}/{name}'),
            default_branch=data.get('defaultBranchRef', {}).get('name', 'main'),
            description=data.get('description'),
            topics=[t.get('name', '') for t in data.get('repositoryTopics', [])],
            is_private=data.get('isPrivate', False),
            created_at=datetime.fromisoformat(data.get('createdAt', datetime.now().isoformat())),
            updated_at=datetime.fromisoformat(data.get('updatedAt', datetime.now().isoformat()))
        )

        self.api_cache[cache_key] = repo
        self.current_repo = repo
        return repo

    def list_branches(self, repo: Optional[Repository] = None) -> List[Branch]:
        """List all branches in repository."""
        repo = repo or self.current_repo
        if not repo:
            raise ValueError("No repository specified")

        data = self._execute_gh_command([
            'api',
            f'/repos/{repo.owner}/{repo.name}/branches',
            '--paginate'
        ])

        branches = []
        for branch_data in data:
            branch = Branch(
                name=branch_data.get('name', ''),
                sha=branch_data.get('commit', {}).get('sha', ''),
                protected=branch_data.get('protected', False),
                ahead_by=0,  # Would need comparison API
                behind_by=0   # Would need comparison API
            )
            branches.append(branch)

        return branches

    def create_branch(self, branch_name: str, base_branch: str = 'main') -> bool:
        """Create new branch from base branch."""
        try:
            subprocess.run(
                ['git', 'checkout', '-b', branch_name, f'origin/{base_branch}'],
                check=True,
                capture_output=True
            )
            logger.info(f"Created branch {branch_name} from {base_branch}")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to create branch: {e}")
            return False

    def get_commit_history(self,
                            branch: str = 'main',
                            limit: int = 10) -> List[Commit]:
        """Get commit history for branch."""
        if not self.current_repo:
            raise ValueError("No repository set")

        data = self._execute_gh_command([
            'api',
            f'/repos/{self.current_repo.owner}/{self.current_repo.name}/commits',
            '--paginate',
            '-F', f'sha={branch}',
            '-F', f'per_page={limit}'
        ])

        commits = []
        for commit_data in data[:limit]:
            commit = Commit(
                sha=commit_data.get('sha', ''),
                message=commit_data.get('commit', {}).get('message', ''),
                author=commit_data.get('commit', {}).get('author', {}).get('name', ''),
                author_email=commit_data.get('commit', {}).get('author', {}).get('email', ''),
                date=datetime.fromisoformat(
                    commit_data.get('commit', {}).get('author', {}).get('date', datetime.now().isoformat())
                ),
                files_changed=[]  # Would need separate API call
            )
            commits.append(commit)

        return commits

    def get_file_content(self, path: str, branch: str = 'main') -> Optional[str]:
        """Get file content from repository."""
        if not self.current_repo:
            raise ValueError("No repository set")

        try:
            result = subprocess.run(
                ['gh', 'api',
                f'/repos/{self.current_repo.owner}/{self.current_repo.name}/contents/{path}',
                '-F', f'ref={branch}'],
                capture_output=True,
                text=True,
                check=True
            )
            data = json.loads(result.stdout)

            if data.get('type') == 'file':
                import base64
                content = base64.b64decode(data.get('content', '')).decode('utf-8')
                return content

            return None
        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            logger.error(f"Failed to get file content: {e}")
            return None

    def update_file(self,
                    path: str,
                    content: str,
                    message: str,
                    branch: str = 'main') -> bool:
        """Update file in repository."""
        try:
            # Write content to local file
            with open(path, 'w') as f:
                f.write(content)

            # Stage file
            subprocess.run(['git', 'add', path], check=True)

            # Commit
            subprocess.run(['git', 'commit', '-m', message], check=True)

            # Push to branch
            subprocess.run(['git', 'push', 'origin', branch], check=True)

            logger.info(f"Updated file {path} on branch {branch}")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to update file: {e}")
            return False

    def clone_repository(self, repo_url: str, target_dir: str) -> bool:
        """Clone repository to local directory."""
        try:
            subprocess.run(
                ['git', 'clone', repo_url, target_dir],
                check=True,
                capture_output=True
            )
            logger.info(f"Cloned repository to {target_dir}")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to clone repository: {e}")
            return False

    def push_changes(self, branch: str, message: str = "Update") -> bool:
        """Push local changes to remote branch."""
        try:
            # Add all changes
            subprocess.run(['git', 'add', '.'], check=True)

            # Commit
            subprocess.run(['git', 'commit', '-m', message], check=True)

            # Push
            subprocess.run(['git', 'push', 'origin', branch], check=True)

            logger.info(f"Pushed changes to branch {branch}")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to push changes: {e}")
            return False

    def get_repository_stats(self) -> Dict[str, Any]:
        """Get repository statistics."""
        if not self.current_repo:
            raise ValueError("No repository set")

        stats = self._execute_gh_command([
            'api',
            f'/repos/{self.current_repo.owner}/{self.current_repo.name}',
            '--jq', '"{stargazers_count: .stargazers_count, forks: .forks, open_issues: .open_issues}"'
        ])

        return stats

    def search_code(self, query: str, repo: Optional[Repository] = None) -> List[Dict[str, Any]]:
        """Search code in repository."""
        repo = repo or self.current_repo
        if not repo:
            raise ValueError("No repository specified")

        results = self._execute_gh_command([
            'search', 'code',
            query,
            f'--repo={repo.owner}/{repo.name}',
            '--json', 'path, url, match'
        ])

        return results if isinstance(results, list) else []