# SPEK-AUGMENT Operational Guardrails

## Overview

This document defines the operational guardrails, tripwires, and playbooks for the SPEK-AUGMENT system integrated with Claude Flow v2 Alpha. These mechanisms prevent and contain failure modes identified in our comprehensive premortem analysis.

## Auto-Action Tripwire Matrix

| Metric (rolling) | Tripwire | Auto-action |
|------------------|----------|-------------|
| Auto-repair attempts / PR | >=3 | Escalate to planner; disable auto-repair for PR; require `/fix:planned` |
| CI P95 (min) | >15 | Switch to `GATES_PROFILE=light` (changed-files-only); schedule nightly full scans |
| Waivers open | >10 or age>30d | Open "Rule Pruning" issue; page security-manager to review |
| Plane sync drift | >1 task mismatch | Block PR open; run `/pm:sync --fix`; add comment with diff |
| Sandbox count | >10 or disk<15% | Pause auto-repair; run cleanup; alert |
| Secret-scan hits | >=1 | Block artifact upload; rotate keys; create SECURITY incident ticket |
| PR size | >250 LOC | Force "multi" plan; require architecture steps |

## Environment Variables

### Core Configuration
```bash
# Gate profile selection
GATES_PROFILE=full|light            # Default: full
CF_DEGRADED_MODE=false|true         # Default: false

# Auto-repair limits
AUTO_REPAIR_MAX_ATTEMPTS=2          # Default: 2
AUTO_REPAIR_DISABLED=false|true     # Set by tripwires
AUTO_REPAIR_PAUSED=false|true       # Set by resource limits

# Sandbox management
SANDBOX_TTL_HOURS=72                # Default: 72
SANDBOX_MAX=10                      # Default: 10

# PM integration
PM_SYNC_BLOCKING=true|false         # Default: true
PROJECT_ID=${PROJECT_ID}            # Plane project ID
```

### Claude Flow v2 Alpha Integration
```bash
# Hive-mind namespacing
HIVE_NAMESPACE=spek/$(date +%Y%m%d)
SESSION_ID=swarm-$(git branch --show-current)

# Neural training
CF_NEURAL_TRAINING=true|false       # Default: true
CF_PATTERN_LEARNING=true|false      # Default: true
```

## Failure Mode Playbooks

### 1. Model/API Outage (CF Components)

**Signals**: HTTP 429/5xx, retry storms, Flow timeouts
**Auto-Action**: 
```bash
export CF_DEGRADED_MODE=true
export GATES_PROFILE=light
echo "Degraded mode: Using fallback tools only" >> .claude/.artifacts/system_status.log
```

**Manual Escalation**:
1. Check CF health: `npx claude-flow@alpha health check --components all`
2. Enable manual review for big tasks
3. Queue PM sync operations for later
4. Post incident status to repo STATUS.md

### 2. Sandbox Sprawl/Disk Exhaustion

**Signals**: Many `.sandboxes/*`, ENOSPC, stale branches
**Auto-Action**: 
```bash
scripts/sandbox_janitor.sh emergency-cleanup
export AUTO_REPAIR_PAUSED=true
```

**Manual Recovery**:
1. Run `scripts/sandbox_janitor.sh report` to assess status
2. Clean stale git branches: `git branch | grep "codex/" | xargs git branch -D`
3. Verify disk recovery: `df . | tail -1`

### 3. CI Time Blow-up

**Signals**: P95 pipeline time >15 minutes, queueing
**Auto-Action**:
```bash
export GATES_PROFILE=light
# Schedule nightly full scans only
```

**Manual Optimization**:
1. Shard tests across more runners
2. Cache dependencies aggressively
3. Run full Semgrep/Connascence nightly only
4. Use changed-files-only scans for PRs

### 4. Auto-Repair Thrash

**Signals**: >2 auto-repair attempts per PR, oscillating failures
**Auto-Action**:
```bash
npx claude-flow@alpha task orchestrate --escalate architecture --reason "repeated-failure"
export AUTO_REPAIR_DISABLED=true
```

**Manual Resolution**:
1. Switch to `/fix:planned` with checkpoints
2. Schedule human review
3. Analyze failure patterns in `.claude/.artifacts/`

### 5. Gate Fatigue

**Signals**: High false positive rate, many waivers
**Auto-Action**:
```bash
gh issue create --title "Rule Pruning Required" --body "Open waivers: $count > threshold" --label "security"
```

**Manual Review**:
1. Run quarterly rules council
2. Set expiry on waivers
3. Track "waivers outstanding" metric
4. Adopt changed-files-only gating

### 6. Security Incidents

**Signals**: Tokens/keys in artifacts, secret-scan hits
**Auto-Action**:
```bash
touch .claude/.artifacts/.upload_blocked
echo "SECURITY INCIDENT: Credential compromise" >> .claude/.artifacts/system_status.log
```

**Immediate Response**:
1. Rotate compromised keys/tokens
2. Purge artifacts with leaked secrets
3. Audit access logs
4. Create SECURITY.md post-mortem entry

## Operational Scripts

### `scripts/ops_tripwires.sh`
Central tripwire monitoring and auto-actions:
```bash
scripts/ops_tripwires.sh check-limits    # Check all tripwires
scripts/ops_tripwires.sh update-metrics  # Update system metrics
scripts/ops_tripwires.sh health-check    # CF health + auto-heal
scripts/ops_tripwires.sh gate-profile    # Risk-based gate selection
scripts/ops_tripwires.sh report         # Generate operational report
```

### `scripts/sandbox_janitor.sh`
Sandbox lifecycle management:
```bash
scripts/sandbox_janitor.sh cleanup-now       # Full maintenance
scripts/sandbox_janitor.sh emergency-cleanup # Remove all sandboxes
scripts/sandbox_janitor.sh report           # Status report
scripts/sandbox_janitor.sh schedule         # Register with CF scheduler
```

### `scripts/impact_quickcheck.sh`
Impact map validation against code reality:
```bash
scripts/impact_quickcheck.sh validate <impact.json>  # Validate Gemini map
scripts/impact_quickcheck.sh quick-check <target>    # Quick analysis
scripts/impact_quickcheck.sh callers <function>      # Find callers
scripts/impact_quickcheck.sh report <target>         # Comprehensive report
```

## Claude Flow v2 Alpha Integration Points

### Hive-Mind Sessions
- Each feature gets namespace: `spek/$(date +%Y%m%d)`
- Session persistence: `swarm-$(git branch --show-current)`
- Cross-session memory via SQLite backend

### Neural Training
- **Success patterns**: Feed to CF models on gate pass
- **Failure patterns**: Learn from QA failures and escalations
- **Risk prediction**: CF neural models influence gate profiles

### GitHub Integration
- **PR management**: CF GitHub modes for evidence-rich PRs
- **Issue linking**: Idempotent Plane MCP sync
- **Release coordination**: CF release-manager workflows

## Monitoring and Alerting

### Key Metrics
- Auto-repair success rate
- CI pipeline P95/P99 times
- Gate failure categorization
- Sandbox resource usage
- Secret scan violations

### Dashboards
- System health: CF component status, degraded mode flags
- Resource usage: Disk space, sandbox count, memory usage
- Quality gates: Pass/fail rates, waiver trends
- Neural patterns: Model accuracy, pattern recognition confidence

## Emergency Procedures

### Total System Failure
1. **Immediate**: Set `CF_DEGRADED_MODE=true` globally
2. **Fallback**: Switch to manual workflows
3. **Recovery**: Health check each component individually
4. **Resume**: Gradual re-enablement with monitoring

### Data Corruption
1. **Stop**: Halt all automated workflows
2. **Assess**: Check `.claude/.artifacts/` integrity
3. **Restore**: From last known good backup
4. **Verify**: Run smoke tests before resuming

### Security Breach
1. **Contain**: Block all artifact uploads
2. **Assess**: Audit all recent operations
3. **Remediate**: Rotate all credentials
4. **Document**: Full incident report

## Continuous Improvement

### Weekly Reviews
- Review tripwire activations
- Analyze failure patterns
- Update neural training data
- Adjust thresholds based on metrics

### Monthly Audits
- Rule effectiveness analysis
- Waiver pattern review
- Resource utilization optimization
- Security posture assessment

### Quarterly Updates
- Premortem analysis refresh
- Playbook effectiveness review
- Tool integration assessment
- Team feedback incorporation

## Contact Information

- **Escalation**: Architecture team for repeated failures
- **Security**: Security-manager for policy violations  
- **Operations**: Platform team for infrastructure issues
- **Emergency**: On-call rotation for critical failures

---

**Last Updated**: $(date -u +%Y-%m-%dT%H:%M:%SZ)
**Version**: SPEK-AUGMENT v1 + CF v2 Alpha
**Review Cycle**: Monthly