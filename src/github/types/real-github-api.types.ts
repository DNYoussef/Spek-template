/**
 * Real GitHub API Types
 * Comprehensive TypeScript types for authentic GitHub API responses
 */

// Repository Types
export interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubUser;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  archive_url: string;
  assignees_url: string;
  blobs_url: string;
  branches_url: string;
  collaborators_url: string;
  comments_url: string;
  commits_url: string;
  compare_url: string;
  contents_url: string;
  contributors_url: string;
  deployments_url: string;
  downloads_url: string;
  events_url: string;
  forks_url: string;
  git_commits_url: string;
  git_refs_url: string;
  git_tags_url: string;
  git_url: string;
  issue_comment_url: string;
  issue_events_url: string;
  issues_url: string;
  keys_url: string;
  labels_url: string;
  languages_url: string;
  merges_url: string;
  milestones_url: string;
  notifications_url: string;
  pulls_url: string;
  releases_url: string;
  ssh_url: string;
  stargazers_url: string;
  statuses_url: string;
  subscribers_url: string;
  subscription_url: string;
  tags_url: string;
  teams_url: string;
  trees_url: string;
  clone_url: string;
  mirror_url: string | null;
  hooks_url: string;
  svn_url: string;
  homepage: string | null;
  language: string | null;
  forks_count: number;
  stargazers_count: number;
  watchers_count: number;
  size: number;
  default_branch: string;
  open_issues_count: number;
  is_template: boolean;
  topics: string[];
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_downloads: boolean;
  archived: boolean;
  disabled: boolean;
  visibility: 'public' | 'private' | 'internal';
  pushed_at: string | null;
  created_at: string;
  updated_at: string;
  permissions?: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
  template_repository?: GitHubRepository | null;
  temp_clone_token?: string;
  delete_branch_on_merge?: boolean;
  subscribers_count?: number;
  network_count?: number;
  code_of_conduct?: {
    key: string;
    name: string;
    url: string;
    body?: string;
  };
  license?: {
    key: string;
    name: string;
    spdx_id: string | null;
    url: string | null;
    node_id: string;
  } | null;
  security_and_analysis?: {
    advanced_security?: {
      status: 'enabled' | 'disabled';
    };
    secret_scanning?: {
      status: 'enabled' | 'disabled';
    };
    secret_scanning_push_protection?: {
      status: 'enabled' | 'disabled';
    };
  } | null;
}

// User Types
export interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string | null;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: 'User' | 'Bot' | 'Organization';
  site_admin: boolean;
  name?: string | null;
  company?: string | null;
  blog?: string | null;
  location?: string | null;
  email?: string | null;
  hireable?: boolean | null;
  bio?: string | null;
  twitter_username?: string | null;
  public_repos?: number;
  public_gists?: number;
  followers?: number;
  following?: number;
  created_at?: string;
  updated_at?: string;
  private_gists?: number;
  total_private_repos?: number;
  owned_private_repos?: number;
  disk_usage?: number;
  collaborators?: number;
  two_factor_authentication?: boolean;
  plan?: {
    name: string;
    space: number;
    private_repos: number;
    collaborators: number;
  };
}

// Issue Types
export interface GitHubIssue {
  id: number;
  node_id: string;
  url: string;
  repository_url: string;
  labels_url: string;
  comments_url: string;
  events_url: string;
  html_url: string;
  number: number;
  state: 'open' | 'closed';
  state_reason?: 'completed' | 'not_planned' | 'reopened' | null;
  title: string;
  body?: string | null;
  user: GitHubUser;
  labels: GitHubLabel[];
  assignee?: GitHubUser | null;
  assignees?: GitHubUser[];
  milestone?: GitHubMilestone | null;
  locked: boolean;
  active_lock_reason?: 'resolved' | 'off-topic' | 'too heated' | 'spam' | null;
  comments: number;
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
    merged_at?: string | null;
  };
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  draft?: boolean;
  closed_by?: GitHubUser | null;
  body_html?: string;
  body_text?: string;
  timeline_url?: string;
  repository?: GitHubRepository;
  performed_via_github_app?: GitHubApp | null;
  author_association: 'COLLABORATOR' | 'CONTRIBUTOR' | 'FIRST_TIMER' | 'FIRST_TIME_CONTRIBUTOR' | 'MANNEQUIN' | 'MEMBER' | 'NONE' | 'OWNER';
  reactions?: {
    '+1': number;
    '-1': number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
    url: string;
    total_count: number;
  };
}

// Pull Request Types
export interface GitHubPullRequest {
  id: number;
  node_id: string;
  url: string;
  html_url: string;
  diff_url: string;
  patch_url: string;
  issue_url: string;
  commits_url: string;
  review_comments_url: string;
  review_comment_url: string;
  comments_url: string;
  statuses_url: string;
  number: number;
  state: 'open' | 'closed';
  locked: boolean;
  title: string;
  user: GitHubUser;
  body: string | null;
  labels: GitHubLabel[];
  milestone: GitHubMilestone | null;
  active_lock_reason?: 'resolved' | 'off-topic' | 'too heated' | 'spam' | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merge_commit_sha: string | null;
  assignee: GitHubUser | null;
  assignees: GitHubUser[];
  requested_reviewers: GitHubUser[];
  requested_teams: GitHubTeam[];
  head: {
    label: string;
    ref: string;
    sha: string;
    user: GitHubUser;
    repo: GitHubRepository;
  };
  base: {
    label: string;
    ref: string;
    sha: string;
    user: GitHubUser;
    repo: GitHubRepository;
  };
  _links: {
    self: { href: string };
    html: { href: string };
    issue: { href: string };
    comments: { href: string };
    review_comments: { href: string };
    review_comment: { href: string };
    commits: { href: string };
    statuses: { href: string };
  };
  author_association: 'COLLABORATOR' | 'CONTRIBUTOR' | 'FIRST_TIMER' | 'FIRST_TIME_CONTRIBUTOR' | 'MANNEQUIN' | 'MEMBER' | 'NONE' | 'OWNER';
  auto_merge: {
    enabled_by: GitHubUser;
    merge_method: 'merge' | 'squash' | 'rebase';
    commit_title: string;
    commit_message: string;
  } | null;
  draft: boolean;
  merged: boolean;
  mergeable: boolean | null;
  rebaseable?: boolean | null;
  mergeable_state: 'behind' | 'blocked' | 'clean' | 'dirty' | 'draft' | 'has_hooks' | 'unknown' | 'unstable';
  merged_by: GitHubUser | null;
  comments: number;
  review_comments: number;
  maintainer_can_modify: boolean;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
}

// Label Types
export interface GitHubLabel {
  id: number;
  node_id: string;
  url: string;
  name: string;
  description: string | null;
  color: string;
  default: boolean;
}

// Milestone Types
export interface GitHubMilestone {
  id: number;
  node_id: string;
  number: number;
  state: 'open' | 'closed';
  title: string;
  description: string | null;
  creator: GitHubUser;
  open_issues: number;
  closed_issues: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  due_on: string | null;
  url: string;
  html_url: string;
  labels_url: string;
}

// Team Types
export interface GitHubTeam {
  id: number;
  node_id: string;
  url: string;
  html_url: string;
  name: string;
  slug: string;
  description: string | null;
  privacy: 'closed' | 'secret';
  permission: 'pull' | 'push' | 'admin' | 'maintain' | 'triage';
  members_url: string;
  repositories_url: string;
  parent?: GitHubTeam | null;
}

// App Types
export interface GitHubApp {
  id: number;
  slug?: string;
  node_id: string;
  owner: GitHubUser;
  name: string;
  description: string | null;
  external_url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  permissions: {
    actions?: 'read' | 'write';
    administration?: 'read' | 'write';
    checks?: 'read' | 'write';
    contents?: 'read' | 'write';
    deployments?: 'read' | 'write';
    environments?: 'read' | 'write';
    issues?: 'read' | 'write';
    metadata?: 'read' | 'write';
    packages?: 'read' | 'write';
    pages?: 'read' | 'write';
    pull_requests?: 'read' | 'write';
    repository_hooks?: 'read' | 'write';
    repository_projects?: 'read' | 'write' | 'admin';
    secret_scanning_alerts?: 'read' | 'write';
    secrets?: 'read' | 'write';
    security_events?: 'read' | 'write';
    single_file?: 'read' | 'write';
    statuses?: 'read' | 'write';
    vulnerability_alerts?: 'read' | 'write';
    workflows?: 'read' | 'write';
    members?: 'read' | 'write';
    organization_administration?: 'read' | 'write';
    organization_hooks?: 'read' | 'write';
    organization_plan?: 'read';
    organization_projects?: 'read' | 'write' | 'admin';
    organization_secrets?: 'read' | 'write';
    organization_self_hosted_runners?: 'read' | 'write';
    organization_user_blocking?: 'read' | 'write';
    team_discussions?: 'read' | 'write';
  };
  events: string[];
  installations_count?: number;
  client_id?: string;
  client_secret?: string;
  webhook_secret?: string;
  pem?: string;
}

// Workflow Types
export interface GitHubWorkflow {
  id: number;
  node_id: string;
  name: string;
  path: string;
  state: 'active' | 'deleted' | 'disabled_fork' | 'disabled_inactivity' | 'disabled_manually';
  created_at: string;
  updated_at: string;
  url: string;
  html_url: string;
  badge_url: string;
}

export interface GitHubWorkflowRun {
  id: number;
  name?: string;
  node_id: string;
  check_suite_id: number;
  check_suite_node_id: string;
  head_branch: string;
  head_sha: string;
  path: string;
  run_number: number;
  run_attempt?: number;
  referenced_workflows?: Array<{
    path: string;
    sha: string;
    ref?: string;
  }>;
  event: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
  workflow_id: number;
  url: string;
  html_url: string;
  pull_requests: Array<{
    id: number;
    number: number;
    url: string;
    head: {
      ref: string;
      sha: string;
      repo: {
        id: number;
        name: string;
        url: string;
      };
    };
    base: {
      ref: string;
      sha: string;
      repo: {
        id: number;
        name: string;
        url: string;
      };
    };
  }>;
  created_at: string;
  updated_at: string;
  actor?: GitHubUser;
  run_started_at?: string;
  triggering_actor?: GitHubUser;
  jobs_url: string;
  logs_url: string;
  check_suite_url: string;
  artifacts_url: string;
  cancel_url: string;
  rerun_url: string;
  previous_attempt_url?: string | null;
  workflow_url: string;
  head_commit: {
    id: string;
    tree_id: string;
    message: string;
    timestamp: string;
    author: {
      name: string;
      email: string;
    };
    committer: {
      name: string;
      email: string;
    };
  };
  repository: GitHubRepository;
  head_repository: GitHubRepository;
}

export interface GitHubWorkflowJob {
  id: number;
  run_id: number;
  workflow_name?: string;
  head_branch?: string;
  run_url: string;
  run_attempt?: number;
  node_id: string;
  head_sha: string;
  url: string;
  html_url: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
  started_at: string;
  completed_at: string | null;
  name: string;
  steps?: Array<{
    name: string;
    status: 'queued' | 'in_progress' | 'completed';
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
    number: number;
    started_at?: string;
    completed_at?: string;
  }>;
  check_run_url: string;
  labels: string[];
  runner_id?: number | null;
  runner_name?: string | null;
  runner_group_id?: number | null;
  runner_group_name?: string | null;
}

// Rate Limit Types
export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
  resource: string;
}

export interface GitHubRateLimitResponse {
  rate: GitHubRateLimit;
  search: GitHubRateLimit;
  graphql: GitHubRateLimit;
  integration_manifest?: GitHubRateLimit;
  source_import?: GitHubRateLimit;
  code_scanning_upload?: GitHubRateLimit;
  actions_runner_registration?: GitHubRateLimit;
  scim?: GitHubRateLimit;
}

// Webhook Types
export interface GitHubWebhookEvent {
  zen?: string;
  hook_id?: number;
  hook?: {
    type: string;
    id: number;
    name: string;
    active: boolean;
    events: string[];
    config: {
      content_type: string;
      insecure_ssl: string;
      url: string;
    };
    updated_at: string;
    created_at: string;
    url: string;
    test_url: string;
    ping_url: string;
    deliveries_url: string;
    last_response: {
      code: number | null;
      status: string;
      message: string | null;
    };
  };
  repository?: GitHubRepository;
  organization?: {
    login: string;
    id: number;
    node_id: string;
    url: string;
    repos_url: string;
    events_url: string;
    hooks_url: string;
    issues_url: string;
    members_url: string;
    public_members_url: string;
    avatar_url: string;
    description: string | null;
    gravatar_id?: string | null;
    name?: string;
    company?: string | null;
    blog?: string | null;
    location?: string | null;
    email?: string | null;
    twitter_username?: string | null;
    has_organization_projects: boolean;
    has_repository_projects: boolean;
    public_repos: number;
    public_gists: number;
    followers: number;
    following: number;
    html_url: string;
    created_at: string;
    updated_at: string;
    type: 'Organization';
  };
  sender: GitHubUser;
  action?: string;
  number?: number;
  issue?: GitHubIssue;
  pull_request?: GitHubPullRequest;
  ref?: string;
  before?: string;
  after?: string;
  commits?: Array<{
    id: string;
    tree_id: string;
    distinct: boolean;
    message: string;
    timestamp: string;
    url: string;
    author: {
      name: string;
      email: string;
      username?: string;
    };
    committer: {
      name: string;
      email: string;
      username?: string;
    };
    added: string[];
    removed: string[];
    modified: string[];
  }>;
  head_commit?: {
    id: string;
    tree_id: string;
    distinct: boolean;
    message: string;
    timestamp: string;
    url: string;
    author: {
      name: string;
      email: string;
      username?: string;
    };
    committer: {
      name: string;
      email: string;
      username?: string;
    };
    added: string[];
    removed: string[];
    modified: string[];
  };
}

// Projects v2 Types (GraphQL)
export interface GitHubProjectV2 {
  id: string;
  number: number;
  title: string;
  url: string;
  shortDescription?: string;
  readme?: string;
  closed: boolean;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  creator?: GitHubUser;
  owner: GitHubUser;
  teams?: {
    totalCount: number;
  };
  items?: {
    totalCount: number;
    nodes: GitHubProjectV2Item[];
  };
  fields?: {
    nodes: GitHubProjectV2Field[];
  };
  views?: {
    nodes: GitHubProjectV2View[];
  };
}

export interface GitHubProjectV2Item {
  id: string;
  type: 'ISSUE' | 'PULL_REQUEST' | 'DRAFT_ISSUE';
  content?: {
    id: string;
    number: number;
    title: string;
    url: string;
    state: string;
    repository?: {
      name: string;
      owner: {
        login: string;
      };
    };
  };
  fieldValues?: {
    nodes: GitHubProjectV2ItemFieldValue[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface GitHubProjectV2Field {
  id: string;
  name: string;
  dataType: 'TEXT' | 'NUMBER' | 'DATE' | 'SINGLE_SELECT' | 'ITERATION';
  options?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export interface GitHubProjectV2View {
  id: string;
  name: string;
  layout: 'BOARD_LAYOUT' | 'TABLE_LAYOUT';
  number: number;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubProjectV2ItemFieldValue {
  id: string;
  field: {
    id: string;
    name: string;
  };
  value?: string | number;
  text?: string;
  number?: number;
  date?: string;
  singleSelectOption?: {
    id: string;
    name: string;
    color: string;
  };
  iterationId?: string;
}

// Search Types
export interface GitHubSearchResult<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
}

export interface GitHubSearchRepositoryResult extends GitHubSearchResult<GitHubRepository> {}
export interface GitHubSearchIssueResult extends GitHubSearchResult<GitHubIssue> {}
export interface GitHubSearchCodeResult extends GitHubSearchResult<{
  name: string;
  path: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  repository: GitHubRepository;
  score: number;
}> {}

// Error Types
export interface GitHubAPIError {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
    message?: string;
  }>;
}

// Authentication Types
export interface GitHubTokenInfo {
  scopes: string[];
  token: string;
  hashed_token: string;
  app: {
    url: string;
    name: string;
    client_id: string;
  };
  note?: string;
  note_url?: string;
  updated_at: string;
  created_at: string;
  fingerprint?: string;
}

// Installation Types (for GitHub Apps)
export interface GitHubInstallation {
  id: number;
  account: GitHubUser;
  repository_selection: 'all' | 'selected';
  access_tokens_url: string;
  repositories_url: string;
  html_url: string;
  app_id: number;
  app_slug: string;
  target_id: number;
  target_type: 'Organization' | 'User';
  permissions: Record<string, string>;
  events: string[];
  created_at: string;
  updated_at: string;
  single_file_name?: string | null;
  has_multiple_single_files?: boolean;
  single_file_paths?: string[];
  suspended_by?: GitHubUser | null;
  suspended_at?: string | null;
}

// Content Types
export interface GitHubContent {
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  size: number;
  name: string;
  path: string;
  content?: string;
  encoding?: string;
  sha: string;
  url: string;
  git_url: string | null;
  html_url: string | null;
  download_url: string | null;
  _links: {
    git: string | null;
    html: string | null;
    self: string;
  };
}

// Version & Run Log
// | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
// |---------|-----------|-------------|----------------|-----------|--------|-------|------|------|
// | 1.0.0   | 2025-01-27T22:05:00Z | assistant@claude-sonnet-4 | Comprehensive real GitHub API types for authentic integration | real-github-api.types.ts | OK | Complete TypeScript types matching real GitHub API responses | 0.00 | b3d7f8a |

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: github-phase8-api-types-001
// inputs: ["GitHub API type requirements", "Real API response specifications"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"api-types-v1"}