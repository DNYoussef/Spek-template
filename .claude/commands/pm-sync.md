# /pm:sync

## Purpose
Synchronize development progress with GitHub Project Manager. Maintains bidirectional sync between code implementation status and GitHub Projects, ensuring accurate project visibility and stakeholder alignment. Integrates with SPEK workflow phases for automated progress reporting using native GitHub integration.

## Usage
/pm:sync [operation=sync|status|update] [project_id=auto]

## Implementation

### 1. Project Management Integration Setup

#### GitHub Project Manager Configuration:
```javascript
// Configuration for GitHub Project Manager integration
const GITHUB_PROJECT_CONFIG = {
  owner: process.env.GITHUB_OWNER || detectGitHubOwner(),
  repo: process.env.GITHUB_REPO || detectGitHubRepo(),
  project_number: process.env.GITHUB_PROJECT_NUMBER || detectProjectNumber(),
  token: process.env.GITHUB_TOKEN,
  api_endpoint: 'https://api.github.com'
};

function initializeGitHubProjectConnection() {
  return {
    owner: GITHUB_PROJECT_CONFIG.owner,
    repo: GITHUB_PROJECT_CONFIG.repo,
    project: GITHUB_PROJECT_CONFIG.project_number,
    authenticated: !!GITHUB_PROJECT_CONFIG.token,
    connection_status: 'pending'
  };
}
```

#### Auto-Detection of Project Context:
```javascript
function detectProjectContext() {
  const context = {
    project_id: null,
    repository: null,
    current_milestone: null,
    active_cycle: null,
    team_members: []
  };
  
  // Try to detect from git remote
  try {
    const gitRemote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    context.repository = parseGitRemote(gitRemote);
  } catch (error) {
    console.warn('Could not detect git remote');
  }
  
  // Try to detect from existing GitHub Project configuration
  if (fs.existsSync('config/github-project.json')) {
    const githubConfig = JSON.parse(fs.readFileSync('config/github-project.json', 'utf8'));
    context.project_id = githubConfig.project_number;
    context.current_milestone = githubConfig.current_milestone;
  }
  
  // Try to detect from package.json or project metadata
  if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (pkg.github?.project_number) {
      context.project_id = pkg.github.project_number;
    }
  }
  
  return context;
}
```

### 2. Bidirectional Synchronization

#### Development Status -> GitHub Projects:
```javascript
async function syncDevelopmentToGitHub(planJson, qaResults) {
  const sync_payload = {
    timestamp: new Date().toISOString(),
    sync_type: 'dev_to_pm',
    project_context: detectProjectContext(),
    
    // Map SPEK tasks to GitHub issues
    task_updates: planJson.tasks.map(task => ({
      spek_task_id: task.id,
      github_issue_id: findLinkedIssue(task),
      status_update: determineTaskStatus(task, qaResults),
      progress_metrics: {
        completion_percentage: calculateTaskProgress(task, qaResults),
        quality_score: extractQualityScore(task, qaResults),
        blockers: identifyTaskBlockers(task, qaResults)
      }
    })),
    
    // Overall project health metrics
    project_health: {
      overall_quality_score: qaResults?.summary?.risk_assessment || 'unknown',
      test_coverage: qaResults?.results?.coverage?.total_coverage || 0,
      security_status: qaResults?.results?.security?.high === 0 ? 'secure' : 'issues_found',
      technical_debt: calculateTechnicalDebt(qaResults)
    },
    
    // Development velocity metrics
    velocity_metrics: {
      tasks_completed_this_cycle: countCompletedTasks(planJson.tasks),
      average_task_completion_time: calculateAverageCompletionTime(),
      code_quality_trend: analyzeTrendData(),
      deployment_readiness: assessDeploymentReadiness(qaResults)
    }
  };
  
  // Send to Plane via MCP
  const sync_result = await callPlaneMCP('sync_development_status', sync_payload);
  return sync_result;
}

function determineTaskStatus(task, qaResults) {
  // Map SPEK task states to Plane issue states
  const status_mapping = {
    'not_started': 'backlog',
    'in_progress': 'in_progress', 
    'implemented': 'in_review',
    'qa_passed': 'done',
    'qa_failed': 'in_progress',
    'blocked': 'blocked'
  };
  
  // Determine current status based on QA results and implementation
  if (qaResults && taskHasQAResults(task, qaResults)) {
    const task_qa_status = getTaskQAStatus(task, qaResults);
    return task_qa_status.passed ? 'qa_passed' : 'qa_failed';
  }
  
  // Check if task is implemented but not QA'd
  if (taskHasImplementation(task)) {
    return 'implemented';
  }
  
  return task.status || 'not_started';
}
```

#### PM System -> Development Sync:
```javascript
async function syncPlaneToDevlopment() {
  const github_updates = await callGitHubAPI('get_project_updates', {
    project_id: PLANE_CONFIG.project_id,
    since_timestamp: getLastSyncTimestamp()
  });
  
  const sync_actions = {
    new_issues: [],
    updated_priorities: [],
    status_changes: [],
    requirement_changes: []
  };
  
  for (const update of github_updates.updates) {
    if (update.type === 'issue_created') {
      sync_actions.new_issues.push({
        github_issue_id: update.issue_id,
        title: update.title,
        description: update.description,
        priority: update.priority,
        assignee: update.assignee,
        labels: update.labels,
        suggested_spek_task: generateSPEKTaskFromIssue(update)
      });
    }
    
    if (update.type === 'priority_changed') {
      sync_actions.updated_priorities.push({
        issue_id: update.issue_id,
        old_priority: update.old_priority,
        new_priority: update.new_priority,
        affected_spek_tasks: findRelatedSPEKTasks(update.issue_id)
      });
    }
    
    if (update.type === 'requirements_updated') {
      sync_actions.requirement_changes.push({
        issue_id: update.issue_id,
        requirement_changes: update.changes,
        impact_analysis: analyzeRequirementImpact(update),
        recommended_actions: generateRecommendedActions(update)
      });
    }
  }
  
  return sync_actions;
}
```

### 3. Automated Progress Reporting

#### SPEK Phase Progress Tracking:
```javascript
function trackSPEKPhaseProgress(currentPhase, planJson, qaResults) {
  const phase_mapping = {
    'SPECIFY': 'requirements_analysis',
    'PLAN': 'technical_planning', 
    'DISCOVER': 'research_and_analysis',
    'IMPLEMENT': 'development',
    'VERIFY': 'testing_and_qa',
    'REVIEW': 'code_review',
    'DELIVER': 'deployment_ready',
    'LEARN': 'retrospective'
  };
  
  const progress_data = {
    current_phase: currentPhase,
    phase_completion: calculatePhaseCompletion(currentPhase, planJson, qaResults),
    tasks_by_phase: categorizeTaksByPhase(planJson.tasks),
    quality_gates_status: extractQualityGatesStatus(qaResults),
    estimated_completion: calculateEstimatedCompletion(planJson, currentPhase),
    blockers_and_risks: identifyBlockersAndRisks(planJson, qaResults)
  };
  
  return progress_data;
}

function calculatePhaseCompletion(phase, planJson, qaResults) {
  const completion_metrics = {
    SPECIFY: () => planJson ? 100 : 0,
    PLAN: () => planJson.tasks.length > 0 ? 100 : 0,
    DISCOVER: () => calculateDiscoveryCompletion(planJson),
    IMPLEMENT: () => calculateImplementationCompletion(planJson.tasks),
    VERIFY: () => calculateVerificationCompletion(qaResults),
    REVIEW: () => calculateReviewCompletion(planJson, qaResults),
    DELIVER: () => calculateDeliveryReadiness(qaResults),
    LEARN: () => 0 // Manual phase
  };
  
  return completion_metrics[phase]?.() || 0;
}
```

#### Automated Status Updates:
```javascript
async function sendAutomatedStatusUpdate(sync_data) {
  const status_update = {
    timestamp: new Date().toISOString(),
    update_type: 'automated_progress_report',
    
    summary: {
      phase: sync_data.current_phase,
      completion_percentage: sync_data.phase_completion,
      quality_score: sync_data.quality_gates_status.overall_score,
      deployment_readiness: sync_data.quality_gates_status.deployment_ready
    },
    
    detailed_progress: {
      tasks_completed: sync_data.tasks_by_phase.completed.length,
      tasks_in_progress: sync_data.tasks_by_phase.in_progress.length, 
      tasks_blocked: sync_data.tasks_by_phase.blocked.length,
      quality_issues: sync_data.quality_gates_status.failing_gates.length
    },
    
    risk_assessment: {
      overall_risk: sync_data.blockers_and_risks.overall_risk,
      timeline_risk: sync_data.estimated_completion.risk_level,
      quality_risk: sync_data.quality_gates_status.risk_level,
      mitigation_actions: sync_data.blockers_and_risks.recommended_actions
    },
    
    next_steps: generateNextSteps(sync_data)
  };
  
  // Send to Plane
  const update_result = await callPlaneMCP('create_status_update', {
    project_id: PLANE_CONFIG.project_id,
    update: status_update,
    notify_stakeholders: shouldNotifyStakeholders(status_update)
  });
  
  return update_result;
}
```

### 4. Stakeholder Communication

#### Automated Stakeholder Notifications:
```javascript
function determineNotificationRecipients(update_data) {
  const notification_rules = {
    // Critical issues - notify all stakeholders
    critical_blocker: ['project_manager', 'tech_lead', 'product_owner'],
    
    // Quality issues - notify technical stakeholders
    quality_gate_failure: ['tech_lead', 'qa_lead'],
    
    // Timeline risks - notify planning stakeholders  
    timeline_risk: ['project_manager', 'product_owner'],
    
    // Deployment ready - notify deployment stakeholders
    deployment_ready: ['devops_lead', 'product_owner', 'project_manager'],
    
    // Regular progress - notify subscribers only
    progress_update: ['subscribers']
  };
  
  const notification_type = classifyUpdateType(update_data);
  return notification_rules[notification_type] || ['subscribers'];
}

async function sendStakeholderNotification(recipients, update_data) {
  const notification_payload = {
    recipients,
    subject: generateNotificationSubject(update_data),
    content: generateNotificationContent(update_data),
    urgency: determineNotificationUrgency(update_data),
    action_items: extractActionItems(update_data),
    attachments: generateAttachments(update_data)
  };
  
  const notification_result = await callPlaneMCP('send_notification', notification_payload);
  return notification_result;
}
```

### 5. Comprehensive Sync Results

Generate detailed pm-sync.json:

```json
{
  "timestamp": "2024-09-08T14:30:00Z",
  "sync_id": "pm-sync-1709905800",
  "operation": "full_sync",
  
  "project_context": {
    "project_id": "proj_abc123def456",
    "workspace": "acme-corp",
    "repository": "github.com/acme-corp/user-auth-system",
    "current_milestone": "v2.1.0 - Enhanced Authentication",
    "active_cycle": "Sprint 15 - Auth Implementation"
  },
  
  "sync_status": {
    "github_connection": "connected",
    "last_sync": "2024-09-08T14:30:00Z",
    "sync_direction": "bidirectional",
    "conflicts_detected": 0,
    "sync_success": true
  },
  
  "development_to_pm_sync": {
    "tasks_synced": 8,
    "status_updates_sent": 5,
    "progress_metrics_updated": true,
    
    "task_mappings": [
      {
        "spek_task_id": "auth-001",
        "github_issue_id": "#234",
        "status_change": "backlog -> in_progress",
        "completion_percentage": 75,
        "quality_score": 85,
        "blockers": []
      },
      {
        "spek_task_id": "auth-002", 
        "github_issue_id": "#235",
        "status_change": "in_progress -> done",
        "completion_percentage": 100,
        "quality_score": 92,
        "blockers": []
      }
    ],
    
    "project_health_update": {
      "overall_quality_score": "good",
      "test_coverage": 94.2,
      "security_status": "secure",
      "technical_debt_hours": 12.5
    }
  },
  
  "pm_to_development_sync": {
    "new_issues_created": 1,
    "priority_changes": 2,
    "requirement_updates": 0,
    
    "incoming_changes": [
      {
        "type": "new_issue",
        "github_issue_id": "#238",
        "title": "Add rate limiting to login endpoint",
        "priority": "high", 
        "assignee": "dev-team",
        "suggested_spek_task": {
          "id": "auth-005",
          "type": "small",
          "estimated_loc": 20,
          "verification_commands": ["npm test", "npm run security-scan"]
        }
      },
      {
        "type": "priority_change",
        "github_issue_id": "#236",
        "old_priority": "medium",
        "new_priority": "high",
        "affected_spek_tasks": ["auth-003"],
        "recommended_action": "Prioritize in current sprint"
      }
    ]
  },
  
  "progress_reporting": {
    "current_phase": "IMPLEMENT",
    "phase_completion": 68,
    "tasks_by_status": {
      "completed": 3,
      "in_progress": 2, 
      "blocked": 0,
      "not_started": 1
    },
    "velocity_metrics": {
      "tasks_completed_this_week": 2,
      "average_task_completion_days": 3.5,
      "sprint_burn_down": "on_track",
      "estimated_completion": "2024-09-12"
    }
  },
  
  "stakeholder_notifications": {
    "notifications_sent": 2,
    "recipients": [
      {
        "role": "project_manager",
        "notification_type": "progress_update",
        "urgency": "normal"
      },
      {
        "role": "product_owner",
        "notification_type": "milestone_progress", 
        "urgency": "normal"
      }
    ],
    "notification_content": {
      "subject": "Auth System Implementation - 68% Complete",
      "key_updates": [
        "JWT token implementation completed and tested",
        "Rate limiting requirement added (high priority)",
        "On track for Sprint 15 completion"
      ],
      "action_items": [
        "Review and approve rate limiting specification",
        "Schedule security review for next week"
      ]
    }
  },
  
  "risk_assessment": {
    "overall_project_risk": "low",
    "timeline_risk": "low",
    "quality_risk": "low",
    "resource_risk": "medium",
    
    "risk_factors": [
      {
        "type": "resource",
        "description": "New high-priority requirement may impact sprint capacity",
        "impact": "medium",
        "mitigation": "Consider moving lower-priority tasks to next sprint"
      }
    ],
    
    "recommended_actions": [
      "Assess capacity impact of new rate limiting requirement",
      "Consider technical spike for rate limiting complexity",
      "Schedule stakeholder review of sprint scope"
    ]
  },
  
  "quality_metrics": {
    "code_quality_score": 85,
    "test_coverage_trend": "+2.1%",
    "security_compliance": "100%",
    "performance_metrics": "within_targets",
    "documentation_coverage": "87%"
  }
}
```

### 6. Conflict Resolution

#### Sync Conflict Detection and Resolution:
```javascript
function detectSyncConflicts(dev_data, pm_data) {
  const conflicts = [];
  
  // Status conflicts
  for (const task of dev_data.tasks) {
    const linked_issue = findLinkedIssue(task, pm_data);
    if (linked_issue) {
      const dev_status = task.status;
      const pm_status = linked_issue.status;
      
      if (!isStatusCompatible(dev_status, pm_status)) {
        conflicts.push({
          type: 'status_conflict',
          spek_task: task.id,
          github_issue: linked_issue.id,
          dev_status,
          pm_status,
          resolution_options: getStatusResolutionOptions(dev_status, pm_status)
        });
      }
    }
  }
  
  // Timeline conflicts
  const dev_timeline = calculateDevelopmentTimeline(dev_data);
  const pm_timeline = pm_data.project_timeline;
  
  if (dev_timeline.estimated_completion > pm_timeline.target_completion) {
    conflicts.push({
      type: 'timeline_conflict',
      dev_estimate: dev_timeline.estimated_completion,
      pm_target: pm_timeline.target_completion,
      gap_days: calculateDateDifference(dev_timeline.estimated_completion, pm_timeline.target_completion),
      resolution_options: getTimelineResolutionOptions(dev_timeline, pm_timeline)
    });
  }
  
  return conflicts;
}

async function resolveConflicts(conflicts) {
  const resolutions = [];
  
  for (const conflict of conflicts) {
    let resolution;
    
    if (conflict.type === 'status_conflict') {
      // Prefer development status as source of truth for implementation
      resolution = await resolvStatusConflict(conflict, 'prefer_dev');
    } else if (conflict.type === 'timeline_conflict') {
      // Require stakeholder input for timeline conflicts
      resolution = await requestStakeholderInput(conflict);
    }
    
    resolutions.push(resolution);
  }
  
  return resolutions;
}
```

## Integration Points

### Used by:
- `flow/workflows/spec-to-pr.yaml` - For project tracking integration
- `scripts/self_correct.sh` - For progress reporting during automated fixes
- CF v2 Alpha - For cross-system coordination and learning
- SPEK workflow phases - For automated progress reporting

### Produces:
- `pm-sync.json` - Comprehensive sync results and status
- Automated stakeholder notifications
- Project health and velocity metrics
- Risk assessment and mitigation recommendations

### Consumes:
- `plan.json` - SPEK task definitions and status
- `qa.json` - Quality metrics and test results
- GitHub Project data
- Git repository metadata and commit history

## Examples

### Successful Full Sync:
```json
{
  "sync_status": {"sync_success": true, "conflicts_detected": 0},
  "development_to_pm_sync": {"tasks_synced": 5, "status_updates_sent": 3},
  "stakeholder_notifications": {"notifications_sent": 2, "urgency": "normal"}
}
```

### New Requirements from PM:
```json
{
  "pm_to_development_sync": {
    "new_issues_created": 2,
    "priority_changes": 1,
    "incoming_changes": [
      {"type": "new_issue", "priority": "high", "title": "Add security headers"}
    ]
  }
}
```

### Timeline Risk Detected:
```json
{
  "risk_assessment": {
    "timeline_risk": "high",
    "risk_factors": [{"type": "timeline", "gap_days": 5}],
    "recommended_actions": ["Reassess sprint scope", "Request timeline extension"]
  }
}
```

## Error Handling

### GitHub Project Manager Connection Issues:
- Graceful degradation when Plane is unavailable
- Offline mode with sync queue for later processing
- Clear error reporting for authentication failures
- Retry logic with exponential backoff

### Sync Conflict Resolution:
- User prompts for manual conflict resolution
- Configurable conflict resolution preferences
- Audit trail for all sync decisions
- Rollback capability for incorrect syncs

### Data Consistency:
- Validation of sync data integrity
- Detection of circular dependency updates
- Protection against sync loops
- Data backup before major sync operations

## Performance Requirements

- Complete sync operations within 60 seconds
- Handle projects with up to 100 active tasks
- Efficient incremental sync for large projects
- Rate limiting compliance with Plane API limits

This command provides comprehensive project management integration, ensuring development progress stays synchronized with stakeholder visibility and project tracking systems.