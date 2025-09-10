# /pr:open

## Purpose
Create evidence-rich pull requests with comprehensive QA results, impact analysis, and stakeholder-ready documentation. Integrates all SPEK workflow artifacts to generate professional PRs that facilitate informed code review and deployment decisions.

## Usage
/pr:open [target_branch=main] [draft=false] [auto_merge=false]

## Implementation

### 1. Pre-PR Validation and Preparation

#### Comprehensive Readiness Check:
```javascript
function validatePRReadiness() {
  const validation = {
    quality_gates: 'pending',
    artifacts_available: 'pending', 
    branch_status: 'pending',
    conflicts: 'pending',
    overall_ready: false
  };
  
  // Check quality gates
  const qa_results = readQAResults();
  if (qa_results) {
    validation.quality_gates = qa_results.overall_status === 'pass' ? 'pass' : 'fail';
  } else {
    validation.quality_gates = 'missing';
  }
  
  // Check required artifacts
  const required_artifacts = [
    '.claude/.artifacts/qa.json',
    'plan.json'
  ];
  
  const optional_artifacts = [
    '.claude/.artifacts/impact.json',
    '.claude/.artifacts/security.json',
    '.claude/.artifacts/connascence.json',
    '.claude/.artifacts/pm-sync.json'
  ];
  
  validation.artifacts_available = {
    required: required_artifacts.every(path => fs.existsSync(path)),
    optional: optional_artifacts.filter(path => fs.existsSync(path))
  };
  
  // Check git status
  validation.branch_status = checkBranchStatus();
  validation.conflicts = checkForConflicts();
  
  validation.overall_ready = 
    validation.quality_gates === 'pass' &&
    validation.artifacts_available.required &&
    validation.branch_status.clean &&
    !validation.conflicts.has_conflicts;
  
  return validation;
}

function checkBranchStatus() {
  const status = {
    clean: false,
    ahead_count: 0,
    behind_count: 0,
    current_branch: '',
    tracking_branch: ''
  };
  
  try {
    // Get current branch
    status.current_branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    
    // Check if working tree is clean
    const git_status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    status.clean = git_status === '';
    
    // Check ahead/behind status
    const ahead_behind = execSync('git rev-list --count --left-right HEAD...@{upstream}', { encoding: 'utf8' }).trim();
    const [ahead, behind] = ahead_behind.split('\t').map(Number);
    status.ahead_count = ahead;
    status.behind_count = behind;
    
  } catch (error) {
    console.warn('Could not determine git status:', error.message);
  }
  
  return status;
}
```

#### Automated Pre-PR Tasks:
```bash
# Automated pre-PR preparation
prepare_pr_environment() {
    local target_branch="${1:-main}"
    
    echo "[ROCKET] Preparing PR environment..."
    
    # Ensure all changes are committed
    if [[ -n $(git status --porcelain) ]]; then
        echo "[FAIL] Working tree not clean. Please commit or stash changes."
        return 1
    fi
    
    # Update target branch
    git fetch origin "$target_branch"
    
    # Check for conflicts
    if ! git merge-tree $(git merge-base HEAD "origin/$target_branch") HEAD "origin/$target_branch" >/dev/null 2>&1; then
        echo "[WARN] Potential merge conflicts detected with $target_branch"
        echo "Run: git rebase origin/$target_branch"
        return 1
    fi
    
    # Final QA run to ensure freshness
    if [[ ! -f ".claude/.artifacts/qa.json" ]] || [[ $(find ".claude/.artifacts/qa.json" -mmin +10) ]]; then
        echo "[SEARCH] Running fresh QA scan..."
        # Would typically call /qa:run here
    fi
    
    echo "[OK] PR environment ready"
    return 0
}
```

### 2. Evidence Collection and Analysis

#### Comprehensive Artifact Aggregation:
```javascript
function collectPREvidence() {
  const evidence = {
    quality_metrics: {},
    impact_analysis: {},
    security_assessment: {},
    architectural_analysis: {},
    project_management: {},
    test_evidence: {},
    performance_metrics: {}
  };
  
  // Quality metrics from QA results
  if (fs.existsSync('.claude/.artifacts/qa.json')) {
    const qa_data = JSON.parse(fs.readFileSync('.claude/.artifacts/qa.json', 'utf8'));
    evidence.quality_metrics = extractQualityMetrics(qa_data);
  }
  
  // Impact analysis from Gemini
  if (fs.existsSync('.claude/.artifacts/impact.json')) {
    const impact_data = JSON.parse(fs.readFileSync('.claude/.artifacts/impact.json', 'utf8'));
    evidence.impact_analysis = extractImpactAnalysis(impact_data);
  }
  
  // Security assessment
  if (fs.existsSync('.claude/.artifacts/security.json')) {
    const security_data = JSON.parse(fs.readFileSync('.claude/.artifacts/security.json', 'utf8'));
    evidence.security_assessment = extractSecurityEvidence(security_data);
  }
  
  // Connascence and architectural quality
  if (fs.existsSync('.claude/.artifacts/connascence.json')) {
    const conn_data = JSON.parse(fs.readFileSync('.claude/.artifacts/connascence.json', 'utf8'));
    evidence.architectural_analysis = extractArchitecturalEvidence(conn_data);
  }
  
  // Project management sync
  if (fs.existsSync('.claude/.artifacts/pm-sync.json')) {
    const pm_data = JSON.parse(fs.readFileSync('.claude/.artifacts/pm-sync.json', 'utf8'));
    evidence.project_management = extractProjectEvidence(pm_data);
  }
  
  return evidence;
}

function extractQualityMetrics(qa_data) {
  return {
    overall_status: qa_data.overall_status,
    test_results: {
      total: qa_data.results.tests.total,
      passed: qa_data.results.tests.passed,
      failed: qa_data.results.tests.failed,
      coverage_delta: qa_data.results.coverage?.coverage_delta || 'N/A'
    },
    code_quality: {
      typecheck_errors: qa_data.results.typecheck.errors,
      lint_errors: qa_data.results.lint.errors,
      lint_warnings: qa_data.results.lint.warnings
    },
    risk_assessment: qa_data.summary.risk_assessment
  };
}
```

### 3. Professional PR Body Generation

#### Structured PR Template:
```javascript
function generatePRBody(evidence, pr_config) {
  const pr_body = {
    title: generatePRTitle(evidence),
    description: generateDescription(evidence),
    sections: {
      summary: generateSummary(evidence),
      changes: generateChangesSection(evidence),
      quality_assurance: generateQASection(evidence),
      impact_analysis: generateImpactSection(evidence),
      testing: generateTestingSection(evidence),
      security: generateSecuritySection(evidence),
      deployment: generateDeploymentSection(evidence),
      checklist: generateChecklist(evidence)
    }
  };
  
  return formatPRBody(pr_body);
}

function generateSummary(evidence) {
  const summary_data = {
    feature_description: extractFeatureDescription(evidence),
    business_value: extractBusinessValue(evidence),
    technical_approach: extractTechnicalApproach(evidence),
    risk_level: evidence.impact_analysis.riskAssessment?.overall_risk || 'low'
  };
  
  return `## [CLIPBOARD] Summary

**Feature**: ${summary_data.feature_description}

**Business Value**: ${summary_data.business_value}

**Technical Approach**: ${summary_data.technical_approach}

**Risk Level**: ${getRiskEmoji(summary_data.risk_level)} ${summary_data.risk_level}`;
}

function generateQASection(evidence) {
  const qa = evidence.quality_metrics;
  
  return `## [U+1F9EA] Quality Assurance

### Test Results
- **Tests**: ${qa.test_results.passed}/${qa.test_results.total} passing ${qa.test_results.failed === 0 ? '[OK]' : '[FAIL]'}
- **Coverage**: ${qa.test_results.coverage_delta} ${getCoverageTrend(qa.test_results.coverage_delta)}
- **Type Check**: ${qa.code_quality.typecheck_errors === 0 ? '[OK] Pass' : `[FAIL] ${qa.code_quality.typecheck_errors} errors`}
- **Linting**: ${qa.code_quality.lint_errors === 0 ? '[OK] Pass' : `[FAIL] ${qa.code_quality.lint_errors} errors`}${qa.code_quality.lint_warnings > 0 ? ` (${qa.code_quality.lint_warnings} warnings)` : ''}

### Risk Assessment: ${getRiskEmoji(qa.risk_assessment)} ${qa.risk_assessment}

${generateQualityEvidence(evidence)}`;
}

function generateImpactSection(evidence) {
  if (!evidence.impact_analysis.hotspots) {
    return `## [TARGET] Impact Analysis
*No impact analysis available*`;
  }
  
  const impact = evidence.impact_analysis;
  
  return `## [TARGET] Impact Analysis

### Files Changed
${impact.hotspots.map(h => `- **${h.file}** (${h.impact_level} impact) - ${h.reason}`).join('\n')}

### Dependencies
${impact.callers?.length > 0 ? 
  impact.callers.map(c => `- ${c.caller_file} -> ${c.target_file} (${c.risk_level} risk)`).join('\n') :
  '*No significant dependency impacts*'}

### Recommended Approach: ${impact.riskAssessment?.recommended_approach || 'standard'}

${generateRiskMitigation(impact.riskAssessment)}`;
}

function generateSecuritySection(evidence) {
  const security = evidence.security_assessment;
  
  if (!security.summary) {
    return `## [U+1F512] Security Assessment
*No security scan results available*`;
  }
  
  const critical = security.summary.by_severity?.critical || 0;
  const high = security.summary.by_severity?.high || 0;
  const medium = security.summary.by_severity?.medium || 0;
  
  return `## [U+1F512] Security Assessment

### Security Scan Results
- **Critical**: ${critical} ${critical === 0 ? '[OK]' : '[U+1F6A8]'}
- **High**: ${high} ${high === 0 ? '[OK]' : '[WARN]'}
- **Medium**: ${medium} ${medium === 0 ? '[OK]' : '[INFO]'}

${critical > 0 || high > 0 ? 
  `### [U+1F6A8] Security Issues Requiring Attention\n${generateSecurityIssuesList(security)}` :
  '### [OK] No critical or high-severity security issues found'}

${generateSecurityEvidence(evidence)}`;
}
```

#### Professional Formatting:
```javascript
function formatPRBody(pr_body) {
  return `# ${pr_body.title}

${pr_body.sections.summary}

${pr_body.sections.changes}

${pr_body.sections.quality_assurance}

${pr_body.sections.impact_analysis}

${pr_body.sections.testing}

${pr_body.sections.security}

${pr_body.sections.deployment}

${pr_body.sections.checklist}

---

${generateFooter()}`;
}

function generateChecklist(evidence) {
  const checklist_items = [
    { text: 'All tests pass', checked: evidence.quality_metrics.test_results.failed === 0 },
    { text: 'Code coverage maintained/improved', checked: evidence.quality_metrics.test_results.coverage_delta >= '0%' },
    { text: 'No TypeScript errors', checked: evidence.quality_metrics.code_quality.typecheck_errors === 0 },
    { text: 'Linting passes', checked: evidence.quality_metrics.code_quality.lint_errors === 0 },
    { text: 'Security scan clear', checked: evidence.security_assessment.summary?.by_severity?.critical === 0 },
    { text: 'Documentation updated', checked: false }, // Manual check
    { text: 'Breaking changes documented', checked: !hasBreakingChanges(evidence) }
  ];
  
  return `## [OK] Pre-merge Checklist

${checklist_items.map(item => `- [${item.checked ? 'x' : ' '}] ${item.text}`).join('\n')}

### Manual Verification Required:
- [ ] Code review completed
- [ ] Documentation updated if needed
- [ ] Deployment plan reviewed (if applicable)`;
}
```

### 4. GitHub Integration

#### PR Creation via GitHub CLI:
```bash
# Create pull request with rich content
create_pull_request() {
    local target_branch="${1:-main}"
    local draft="${2:-false}"
    local auto_merge="${3:-false}"
    
    # Generate PR body
    local pr_body_file="/tmp/pr_body_$(date +%s).md"
    node -e "
        const { generatePRBody, collectPREvidence } = require('./scripts/pr-generator');
        const evidence = collectPREvidence();
        const pr_config = { target_branch: '$target_branch', draft: $draft };
        const body = generatePRBody(evidence, pr_config);
        require('fs').writeFileSync('$pr_body_file', body);
    "
    
    # Create PR using GitHub CLI
    local gh_flags=""
    if [[ "$draft" == "true" ]]; then
        gh_flags="--draft"
    fi
    
    # Create the PR
    local pr_url=$(gh pr create \
        --title "$(extract_pr_title_from_body $pr_body_file)" \
        --body-file "$pr_body_file" \
        --base "$target_branch" \
        --head "$(git branch --show-current)" \
        $gh_flags)
    
    # Add labels based on evidence
    add_pr_labels "$pr_url"
    
    # Auto-merge if requested and all checks pass
    if [[ "$auto_merge" == "true" && "$draft" == "false" ]]; then
        setup_auto_merge "$pr_url"
    fi
    
    # Cleanup
    rm -f "$pr_body_file"
    
    echo "[PARTY] Pull request created: $pr_url"
    return 0
}

# Add contextual labels based on evidence
add_pr_labels() {
    local pr_url="$1"
    local pr_number=$(echo "$pr_url" | grep -o '[0-9]\+$')
    local labels=()
    
    # Analyze evidence for label suggestions
    if [[ -f ".claude/.artifacts/qa.json" ]]; then
        local qa_risk=$(jq -r '.summary.risk_assessment' .claude/.artifacts/qa.json)
        case "$qa_risk" in
            "low") labels+=("risk:low") ;;
            "medium") labels+=("risk:medium") ;;
            "high") labels+=("risk:high") ;;
        esac
    fi
    
    # Security labels
    if [[ -f ".claude/.artifacts/security.json" ]]; then
        local security_issues=$(jq -r '.summary.by_severity.critical + .summary.by_severity.high' .claude/.artifacts/security.json)
        if [[ "$security_issues" -gt 0 ]]; then
            labels+=("security-review-required")
        fi
    fi
    
    # Impact labels
    if [[ -f ".claude/.artifacts/impact.json" ]]; then
        local overall_risk=$(jq -r '.riskAssessment.overall_risk' .claude/.artifacts/impact.json)
        if [[ "$overall_risk" == "high" ]]; then
            labels+=("high-impact")
        fi
    fi
    
    # Add size labels
    local lines_changed=$(git diff --stat "$target_branch" | tail -1 | grep -o '[0-9]\+ insertions' | cut -d' ' -f1)
    if [[ $lines_changed -lt 50 ]]; then
        labels+=("size:small")
    elif [[ $lines_changed -lt 200 ]]; then
        labels+=("size:medium") 
    else
        labels+=("size:large")
    fi
    
    # Apply labels
    if [[ ${#labels[@]} -gt 0 ]]; then
        gh pr edit "$pr_number" --add-label "$(IFS=,; echo "${labels[*]}")"
    fi
}
```

### 5. Comprehensive PR Results

Generate detailed pr-open.json:

```json
{
  "timestamp": "2024-09-08T14:45:00Z",
  "operation_id": "pr-open-1709906700",
  
  "pr_details": {
    "url": "https://github.com/acme-corp/user-auth-system/pull/42",
    "number": 42,
    "title": "feat: Implement JWT token authentication system",
    "target_branch": "main",
    "source_branch": "feature/jwt-authentication",
    "draft": false,
    "auto_merge_enabled": false
  },
  
  "readiness_validation": {
    "overall_ready": true,
    "quality_gates": "pass",
    "artifacts_available": {
      "required": true,
      "optional": [
        ".claude/.artifacts/qa.json",
        ".claude/.artifacts/impact.json", 
        ".claude/.artifacts/security.json",
        ".claude/.artifacts/connascence.json"
      ]
    },
    "branch_status": {
      "clean": true,
      "ahead_count": 5,
      "behind_count": 0,
      "conflicts": false
    }
  },
  
  "evidence_summary": {
    "quality_metrics": {
      "overall_status": "pass",
      "test_results": {
        "total": 156,
        "passed": 156, 
        "failed": 0,
        "coverage_delta": "+2.3%"
      },
      "code_quality": {
        "typecheck_errors": 0,
        "lint_errors": 0,
        "lint_warnings": 2
      },
      "risk_assessment": "low"
    },
    
    "impact_analysis": {
      "files_changed": 6,
      "hotspots_identified": 4,
      "overall_risk": "medium",
      "recommended_approach": "incremental",
      "coordination_required": true
    },
    
    "security_assessment": {
      "total_findings": 0,
      "critical": 0,
      "high": 0,
      "medium": 0,
      "compliance_status": "secure"
    },
    
    "architectural_analysis": {
      "nasa_pot10_score": 89.2,
      "duplication_score": 0.82,
      "architectural_debt_hours": 8.5,
      "compliance_level": "acceptable"
    }
  },
  
  "pr_content": {
    "summary_generated": true,
    "sections_included": [
      "summary",
      "changes",
      "quality_assurance",
      "impact_analysis", 
      "testing",
      "security",
      "deployment",
      "checklist"
    ],
    "evidence_artifacts_linked": 8,
    "checklist_items_total": 7,
    "checklist_items_automated": 5
  },
  
  "labels_applied": [
    "risk:low",
    "size:medium",
    "feature",
    "authentication",
    "ready-for-review"
  ],
  
  "stakeholder_notifications": {
    "reviewers_assigned": [
      "tech-lead",
      "security-reviewer"
    ],
    "pm_notification_sent": true,
    "deployment_team_notified": false
  },
  
  "deployment_readiness": {
    "all_gates_passed": true,
    "breaking_changes": false,
    "configuration_changes": true,
    "database_migrations": false,
    "deployment_notes": [
      "Requires JWT_SECRET environment variable",
      "Backward compatible with existing authentication"
    ]
  },
  
  "automation_setup": {
    "ci_checks_configured": true,
    "auto_merge_conditions": [
      "All checks pass",
      "At least 1 approval",
      "No conflicts"
    ],
    "deployment_pipeline": "production-ready"
  }
}
```

### 6. Advanced Features

#### Auto-Merge Configuration:
```javascript
function setupAutoMerge(pr_url, conditions) {
  const auto_merge_config = {
    enable_auto_merge: true,
    merge_method: 'squash',
    conditions: {
      required_reviews: 1,
      required_status_checks: ['ci/tests', 'ci/security-scan', 'ci/quality-gates'],
      dismiss_stale_reviews: true,
      require_code_owner_reviews: false
    }
  };
  
  // Configure via GitHub CLI
  const pr_number = extractPRNumber(pr_url);
  
  // Enable auto-merge
  execSync(`gh pr merge ${pr_number} --auto --squash`, { stdio: 'inherit' });
  
  // Set branch protection if not already configured
  setupBranchProtection(conditions);
  
  return auto_merge_config;
}
```

#### Reviewer Assignment:
```javascript
function assignReviewers(evidence, pr_number) {
  const reviewer_rules = {
    // High risk changes need senior review
    high_risk: ['tech-lead', 'senior-engineer'],
    
    // Security changes need security review  
    security_changes: ['security-reviewer'],
    
    // Database changes need DBA review
    database_changes: ['dba-reviewer'],
    
    // Frontend changes need UX review
    ui_changes: ['ux-reviewer'],
    
    // Default reviewers for standard changes
    standard: ['team-lead']
  };
  
  const reviewers = new Set();
  
  // Risk-based assignment
  if (evidence.impact_analysis.overall_risk === 'high') {
    reviewer_rules.high_risk.forEach(r => reviewers.add(r));
  }
  
  // Security-based assignment
  if (evidence.security_assessment.total_findings > 0 || 
      evidence.files_changed.some(f => f.includes('security') || f.includes('auth'))) {
    reviewer_rules.security_changes.forEach(r => reviewers.add(r));
  }
  
  // Default assignment
  if (reviewers.size === 0) {
    reviewer_rules.standard.forEach(r => reviewers.add(r));
  }
  
  // Assign reviewers
  const reviewer_list = Array.from(reviewers).join(',');
  execSync(`gh pr edit ${pr_number} --add-reviewer "${reviewer_list}"`);
  
  return Array.from(reviewers);
}
```

## Integration Points

### Used by:
- `flow/workflows/spec-to-pr.yaml` - Final step in complete workflow
- Manual developer workflow - When ready to create PR
- Automated deployment pipelines - For release PRs
- CF v2 Alpha - For automated PR enhancement

### Produces:
- GitHub Pull Request with comprehensive documentation
- `pr-open.json` - PR creation results and metadata
- Stakeholder notifications and reviewer assignments
- Automated merge configuration and labels

### Consumes:
- All `.claude/.artifacts/*.json` files (QA, security, impact, etc.)
- `plan.json` - SPEK task definitions and status
- Git repository state and change history
- Project configuration and stakeholder definitions

## Examples

### Standard Feature PR:
```json
{
  "pr_details": {"title": "feat: Add user profile management", "draft": false},
  "evidence_summary": {"quality_metrics": {"overall_status": "pass"}},
  "labels_applied": ["feature", "risk:low", "size:medium"]
}
```

### High-Risk Architecture Change:
```json
{
  "pr_details": {"title": "refactor: Restructure authentication system", "draft": false},
  "evidence_summary": {"impact_analysis": {"overall_risk": "high"}},
  "labels_applied": ["refactor", "risk:high", "architecture", "breaking-change"],
  "stakeholder_notifications": {"reviewers_assigned": ["tech-lead", "security-reviewer", "senior-engineer"]}
}
```

### Security-Focused PR:
```json
{
  "evidence_summary": {"security_assessment": {"total_findings": 0, "compliance_status": "secure"}},
  "labels_applied": ["security", "risk:low", "hardening"],
  "deployment_readiness": {"security_review_passed": true}
}
```

## Error Handling

### PR Creation Failures:
- Detailed error reporting for GitHub API issues
- Fallback to manual PR creation with body saved to file
- Validation of required information before creation
- Recovery options for failed PR operations

### Evidence Collection Issues:
- Graceful handling of missing artifacts
- Warning indicators for incomplete evidence
- Suggestion to run missing analysis commands
- Partial PR creation with available evidence

### Branch and Merge Issues:
- Conflict detection and resolution guidance
- Branch synchronization recommendations
- Merge strategy validation and suggestions
- Rollback procedures for failed operations

## Performance Requirements

- Generate comprehensive PR within 30 seconds
- Handle projects with extensive evidence artifacts
- Efficient processing of large changesets
- Minimal network requests to GitHub API

This command provides the culmination of the SPEK workflow, creating professional, evidence-rich pull requests that facilitate informed code review and confident deployment decisions.