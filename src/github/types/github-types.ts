/**
 * GitHub Integration Types - Type definitions for GitHub API and integration features
 */
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubUser;
  private: boolean;
  description?: string;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage?: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language?: string;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  forks_count: number;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license?: GitHubLicense;
  topics?: string[];
  visibility: 'public' | 'private' | 'internal';
  default_branch: string;
}
export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  url: string;
  html_url: string;
  type: 'User' | 'Organization';
  site_admin: boolean;
  name?: string;
  company?: string;
  blog?: string;
  location?: string;
  email?: string;
  bio?: string;
}
export interface GitHubPullRequest {
  id: number;
  number: number;
  state: 'open' | 'closed';
  locked: boolean;
  title: string;
  user: GitHubUser;
  body?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  merged_at?: string;
  merge_commit_sha?: string;
  assignee?: GitHubUser;
  assignees?: GitHubUser[];
  requested_reviewers?: GitHubUser[];
  labels?: GitHubLabel[];
  milestone?: GitHubMilestone;
  draft: boolean;
  head: GitHubBranch;
  base: GitHubBranch;
  author_association: string;
  auto_merge?: any;
  active_lock_reason?: string;
}
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  user: GitHubUser;
  labels?: GitHubLabel[];
  state: 'open' | 'closed';
  locked: boolean;
  assignee?: GitHubUser;
  assignees?: GitHubUser[];
  milestone?: GitHubMilestone;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  author_association: string;
  active_lock_reason?: string;
  body?: string;
  reactions?: GitHubReactions;
}
export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  default: boolean;
  description?: string;
}
export interface GitHubMilestone {
  id: number;
  number: number;
  title: string;
  description?: string;
  creator: GitHubUser;
  open_issues: number;
  closed_issues: number;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  due_on?: string;
  closed_at?: string;
}
export interface GitHubBranch {
  label: string;
  ref: string;
  sha: string;
  user: GitHubUser;
  repo: GitHubRepository;
}
export interface GitHubCommit {
  sha: string;
  node_id: string;
  commit: {
    author: GitHubCommitAuthor;
    committer: GitHubCommitAuthor;
    message: string;
    tree: {
      sha: string;
      url: string;
    };
    url: string;
    comment_count: number;
    verification: GitHubVerification;
  };
  url: string;
  html_url: string;
  comments_url: string;
  author?: GitHubUser;
  committer?: GitHubUser;
  parents: Array<{
    sha: string;
    url: string;
    html_url: string;
  }>;
}
export interface GitHubCommitAuthor {
  name: string;
  email: string;
  date: string;
}
export interface GitHubVerification {
  verified: boolean;
  reason: string;
  signature?: string;
  payload?: string;
}
export interface GitHubLicense {
  key: string;
  name: string;
  spdx_id: string;
  url?: string;
  node_id: string;
}
export interface GitHubReactions {
  total_count: number;
  '+1': number;
  '-1': number;
  laugh: number;
  hooray: number;
  confused: number;
  heart: number;
  rocket: number;
  eyes: number;
}
export interface GitHubWorkflow {
  id: number;
  name: string;  path: string;
  state: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
  url: string;
  html_url: string;
  badge_url: string;
}
export interface GitHubWorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  run_number: number;
  event: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required';
  workflow_id: number;
  url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_attempt: number;
  run_started_at: string;
}