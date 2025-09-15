# CI/CD Loop Deployment Guide

## Overview

The CI/CD GitHub Integration Edit Loop provides automated failure detection, analysis, and resolution using AI agents with connascence detection and theater validation. This guide covers complete deployment setup.

## Architecture

```
GitHub Webhooks -> Failure Detection -> AI Analysis -> Code Fixes -> Theater Detection -> Validation -> GitHub Feedback
      |                 |                   |             |              |               |
   Hook Events    Pattern Analysis    Connascence    Authenticity    Loop Control    Status Updates
                                       Detection       Scoring
```

## Prerequisites

### Required Tools
- GitHub CLI (`gh`) authenticated with repository access
- Python 3.8+ with required packages
- Node.js 16+ for npm operations
- Git with push permissions
- Claude Code with SPEK Enhanced Platform

### Environment Variables
```bash
export GITHUB_TOKEN="your_github_token"
export GITHUB_REPOSITORY="owner/repo-name"
export OPENAI_API_KEY="your_openai_key"  # For Gemini integration
export CLAUDE_API_KEY="your_claude_key"  # For agent coordination
```

### Python Dependencies
```bash
pip install github3.py requests aiohttp pandas scikit-learn numpy
```

## Installation Steps

### 1. Deploy Core Components

```bash
# Ensure all CI/CD loop files are in place
ls -la .claude/commands/cicd-loop.md
ls -la src/analysis/failure_pattern_detector.py
ls -la src/coordination/loop_orchestrator.py
ls -la scripts/github_webhook_feedback.py
ls -la .github/workflows/closed-loop-automation.yml
```

### 2. Configure GitHub Workflow

The enhanced CI/CD loop is integrated into `.github/workflows/closed-loop-automation.yml`. Key features:

- **Event Detection Hub**: Monitors for failures across multiple triggers
- **Enhanced CI/CD Loop Job**: Executes 8-step automated resolution
- **Connascence Detection**: Multi-file coupling analysis with context bundles
- **Theater Detection**: Authenticity validation for quality improvements
- **Sandbox Testing**: Isolated environment for fix validation

### 3. Set Repository Secrets

In GitHub repository settings > Secrets and variables > Actions:

```
GITHUB_TOKEN: Personal access token with repo permissions
OPENAI_API_KEY: For Gemini agent integration
CLAUDE_API_KEY: For Claude agent coordination
SLACK_WEBHOOK_URL: Optional notification endpoint
```

### 4. Enable GitHub Webhook Integration

```bash
# Test webhook feedback component
cd scripts
python github_webhook_feedback.py --test-mode

# Verify GitHub API access
gh api user
gh api repos/:owner/:repo/actions/workflows
```

## Usage

### Manual Execution

```bash
# Run complete CI/CD loop
/cicd:loop --mode=auto --max-iterations=5 --target-failures=all

# Supervised mode with human approval
/cicd:loop --mode=supervised --max-iterations=3

# Analysis only (no fixes applied)
/cicd:loop --mode=analysis --target-failures=testing
```

### Automatic Trigger Conditions

The loop automatically triggers on:
- **Workflow Failures**: Any GitHub Actions workflow failure
- **Quality Gate Failures**: Test, lint, typecheck, or security scan failures
- **Manual Dispatch**: Via GitHub Actions UI with configurable parameters
- **Scheduled Runs**: Daily analysis at 02:00 UTC (configurable)

### Command Parameters

| Parameter | Description | Values | Default |
|-----------|-------------|---------|---------|
| `--mode` | Execution mode | `auto`, `supervised`, `analysis` | `auto` |
| `--max-iterations` | Maximum loop cycles | 1-10 | 5 |
| `--target-failures` | Failure scope | `all`, `testing`, `build`, `security` | `all` |
| `--skip-sandbox` | Skip sandbox validation | `true`, `false` | `false` |
| `--theater-threshold` | Authenticity threshold | 0.0-1.0 | 0.75 |

## 8-Step Loop Process

### Step 1: GitHub Failure Detection
- Downloads workflow run failures via GitHub API
- Categorizes failures (testing, build, security, etc.)
- Extracts logs and error details
- Creates failure pattern database

### Step 2: AI Agent Analysis
- **Gemini Agent**: Large-context analysis with sequential thinking MCP
- **Research Agents**: Examine each failure with specialized focus
- **Pattern Detection**: Historical failure correlation
- **Root Cause Analysis**: Reverse engineering principles

### Step 3: Reverse Engineering Analysis
- **Cascade Detection**: Identifies root issues causing multiple failures
- **Dependency Analysis**: Maps failure propagation chains
- **Impact Assessment**: Estimates fix complexity and risk
- **Priority Ranking**: Orders fixes by effectiveness

### Step 4: Code Implementation
- **Connascence Detection**: Analyzes multi-file coupling issues
- **Context Bundling**: Sends all coupled files to AI specialists
- **Refactoring Research**: Online lookup of proven techniques
- **Targeted Fixes**: Implements minimal, effective changes

### Step 5: Theater Detection Audit
- **Authenticity Scoring**: Validates genuine quality improvements
- **Pattern Recognition**: Detects superficial or cosmetic changes
- **Effectiveness Measurement**: Compares before/after metrics
- **Quality Correlation**: Ensures fixes address actual issues

### Step 6: Sandbox Testing
- **Isolated Environment**: Codex sandbox for safe validation
- **Differential Analysis**: Compares results to original GitHub reports
- **Regression Detection**: Ensures no new failures introduced
- **Authenticity Verification**: Only genuine improvements allowed

### Step 7: Loop Control
- **Success Validation**: Checks if all target failures resolved
- **Iteration Management**: Continues loop if improvements needed
- **Escalation Logic**: Human intervention for complex issues
- **Early Exit**: Terminates on exceptional success

### Step 8: GitHub Integration
- **Status Updates**: Commit status and check updates
- **PR Creation**: Evidence-rich pull request with analysis
- **Issue Management**: Creates tracking issues for unresolved items
- **Metrics Collection**: Performance and effectiveness data

## Connascence Detection Features

### 7 Coupling Types Analyzed
1. **Coincidental**: Unrelated elements grouped together
2. **Logical**: Elements grouped by category rather than function
3. **Temporal**: Elements dependent on timing
4. **Procedural**: Elements dependent on order
5. **Communicational**: Elements operating on same data
6. **Sequential**: Output of one is input to another
7. **Functional**: Elements cooperating on same task

### Context Bundle Preparation
- **Multi-File Coordination**: All coupled files sent together to AI specialists
- **Dependency Mapping**: Visual representation of file relationships
- **Change Impact Analysis**: Predicts effects of modifications
- **Refactoring Recommendations**: Online research for proven techniques

## Theater Detection System

### Authenticity Metrics
- **Code Coverage Impact**: Real improvement in test coverage
- **Complexity Reduction**: Measurable decrease in cyclomatic complexity
- **Performance Gains**: Actual speed or memory improvements
- **Bug Fix Validation**: Confirmed resolution of reported issues

### Quality Correlation Analysis
- **Before/After Comparison**: Quantitative quality measurements
- **Regression Prevention**: Ensures no quality degradation
- **Effectiveness Scoring**: 0.0-1.0 scale for improvement authenticity
- **Continuous Learning**: Improves detection accuracy over time

## Monitoring and Observability

### Loop Execution Metrics
- **Cycle Count**: Number of iterations required
- **Success Rate**: Percentage of issues successfully resolved
- **Time to Resolution**: Average time per fix implementation
- **Authenticity Score**: Theater detection effectiveness

### GitHub Integration Status
- **Webhook Health**: Continuous monitoring of webhook delivery
- **API Rate Limits**: Tracks GitHub API usage and limits
- **Authentication Status**: Validates token permissions
- **Repository Access**: Confirms read/write capabilities

### Alert Conditions
- **Loop Failure**: Unable to make progress after max iterations
- **Authentication Issues**: Token expiration or permission problems
- **Quality Degradation**: Theater detection identifies fake improvements
- **System Overload**: Resource constraints affecting performance

## Troubleshooting

### Common Issues

#### Loop Not Triggering
```bash
# Check GitHub webhook configuration
gh api repos/:owner/:repo/hooks

# Verify workflow file syntax
gh workflow view closed-loop-automation

# Test manual trigger
gh workflow run closed-loop-automation -f loop_mode=manual
```

#### Authentication Failures
```bash
# Verify GitHub token permissions
gh auth status

# Test repository access
gh api repos/:owner/:repo

# Check environment variables
echo $GITHUB_TOKEN | wc -c  # Should be 40+ characters
```

#### Connascence Detection Issues
```bash
# Test detector with sample files
cd src/coordination
python -c "
from loop_orchestrator import ConnascenceDetector
detector = ConnascenceDetector()
issues = detector._analyze_file_coupling('loop_orchestrator.py', ['loop_orchestrator.py'])
print(f'Found {len(issues)} coupling issues')
"
```

#### Theater Detection False Positives
```bash
# Review authenticity scoring logs
grep "authenticity_score" .claude/.artifacts/loop_execution_*.json

# Adjust threshold in workflow configuration
# Edit .github/workflows/closed-loop-automation.yml
# Set THEATER_THRESHOLD to higher value (0.8-0.9)
```

### Performance Optimization

#### Reducing Loop Execution Time
- **Parallel Analysis**: Enable concurrent agent execution
- **Smart Filtering**: Focus on high-impact failures first
- **Caching**: Reuse analysis for similar failure patterns
- **Early Exit**: Stop on exceptional success (>95% authenticity)

#### Resource Management
- **Memory Limits**: Configure agent memory constraints
- **API Rate Limiting**: Implement GitHub API request throttling
- **Concurrent Execution**: Limit parallel processes to system capacity
- **Cleanup**: Regular cleanup of temporary files and logs

## Security Considerations

### Token Management
- **Least Privilege**: Grant minimum required permissions
- **Rotation**: Regular token rotation (30-90 days)
- **Audit Logging**: Track all API access and modifications
- **Encryption**: Store tokens encrypted in GitHub Secrets

### Code Integrity
- **Signed Commits**: Require GPG signatures for loop commits
- **Branch Protection**: Protect main branch from direct pushes
- **Review Requirements**: Mandate code review for sensitive changes
- **Audit Trail**: Complete log of all automated changes

### Sandbox Security
- **Isolation**: Ensure complete sandbox isolation
- **Resource Limits**: Prevent resource exhaustion attacks
- **Clean Environment**: Fresh environment for each test cycle
- **Network Restrictions**: Limit external network access

## Advanced Configuration

### Custom Failure Categories
Edit `src/analysis/failure_pattern_detector.py`:
```python
CUSTOM_FAILURE_PATTERNS = {
    'database': r'connection.*timeout|sql.*error|database.*unavailable',
    'api': r'http.*error|rest.*failed|api.*timeout',
    'frontend': r'javascript.*error|react.*failed|css.*broken'
}
```

### Connascence Threshold Tuning
Modify `src/coordination/loop_orchestrator.py`:
```python
COUPLING_THRESHOLDS = {
    'functional': 0.9,     # High coupling tolerance
    'sequential': 0.7,     # Medium coupling tolerance
    'coincidental': 0.3,   # Low coupling tolerance
}
```

### Theater Detection Sensitivity
Adjust in `.github/workflows/closed-loop-automation.yml`:
```yaml
env:
  THEATER_THRESHOLD: 0.85        # Stricter authenticity requirements
  QUALITY_CORRELATION_MIN: 0.7   # Minimum quality improvement correlation
  PERFORMANCE_IMPACT_MIN: 0.05   # 5% minimum performance improvement
```

## Integration Examples

### Slack Notifications
```bash
# Add to scripts/github_webhook_feedback.py
def send_slack_notification(self, message, channel="#cicd-alerts"):
    webhook_url = os.environ.get('SLACK_WEBHOOK_URL')
    if webhook_url:
        requests.post(webhook_url, json={
            "channel": channel,
            "text": f"CI/CD Loop: {message}",
            "username": "CICD-Bot"
        })
```

### Jira Integration
```bash
# Create ticket for unresolved issues
def create_jira_ticket(self, failure_info):
    jira_api = os.environ.get('JIRA_API_ENDPOINT')
    auth_token = os.environ.get('JIRA_AUTH_TOKEN')

    ticket_data = {
        "fields": {
            "project": {"key": "CICD"},
            "summary": f"Automated fix failed: {failure_info['title']}",
            "description": failure_info['detailed_analysis'],
            "issuetype": {"name": "Bug"}
        }
    }
```

### Custom Quality Gates
```bash
# Add custom validation in loop orchestrator
async def _validate_custom_quality_gates(self, execution):
    """Custom quality validation beyond standard gates"""

    # Performance regression check
    if not self._check_performance_regression():
        return False

    # Security scan validation
    if not self._run_security_validation():
        return False

    # Custom business logic validation
    if not self._validate_business_rules():
        return False

    return True
```

## Maintenance

### Regular Tasks
- **Log Rotation**: Clean up execution logs (weekly)
- **Metrics Review**: Analyze loop effectiveness (monthly)
- **Pattern Updates**: Update failure detection patterns (quarterly)
- **Security Audit**: Review tokens and permissions (quarterly)

### Upgrades
- **Agent Updates**: Keep AI agents updated with latest capabilities
- **Dependency Updates**: Regular update of Python and Node.js dependencies
- **GitHub API**: Monitor for GitHub API changes and deprecations
- **Performance Tuning**: Regular optimization based on usage patterns

---

## Support and Troubleshooting

For issues with the CI/CD loop deployment:
1. Check GitHub workflow logs for detailed error messages
2. Review `.claude/.artifacts/` for loop execution details
3. Validate all environment variables and tokens
4. Test individual components before full loop execution
5. Consult the theater detection logs for authenticity issues

The system is designed for self-healing and continuous improvement, learning from each execution cycle to enhance future performance.