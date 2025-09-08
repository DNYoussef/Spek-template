# Troubleshooting Guide

**Common issues and solutions for SPEK-AUGMENT development workflow**

## 🚨 Quick Fixes

| Issue | Quick Solution | Details |
|-------|---------------|---------|
| Command not found | Update Claude Code | [See below](#command-not-found) |
| Quality gate failure | Run `/qa:analyze` | [See below](#quality-gate-failures) |
| Sandbox conflicts | `git stash && retry` | [See below](#sandbox-issues) |
| Large codebase slow | Use `scope=changed` | [See below](#performance-issues) |
| Artifact not found | Run `/qa:run` first | [See below](#missing-artifacts) |

## 📋 Common Issues

### Command Not Found

**Symptoms**:
- `/spec:plan` or other commands not recognized
- Claude Code shows "command not found"
- Autocomplete doesn't show slash commands

**Solutions**:
1. **Update Claude Code**:
   ```bash
   # Ensure you have the latest version with all 17 commands
   # Check .claude/commands/ directory contains all command files
   ls .claude/commands/
   ```

2. **Verify Command Files**:
   ```bash
   # Should show 17 .md files
   find .claude/commands -name "*.md" | wc -l
   # Expected: 17
   ```

3. **Restart Claude Code**:
   - Exit and restart Claude Code application
   - Reload command definitions

**Expected Files**:
```
.claude/commands/
├── spec-plan.md
├── gemini-impact.md
├── codex-micro.md
├── codex-micro-fix.md
├── fix-planned.md
├── qa-run.md
├── qa-gate.md
├── qa-analyze.md
├── sec-scan.md
├── conn-scan.md
├── pm-sync.md
├── pr-open.md
├── specify.md
├── plan.md
└── tasks.md
```

### Quality Gate Failures

**Symptoms**:
- `/qa:gate` returns `"ok": false`
- Tests failing after implementation
- TypeScript or linting errors blocking progress

**Diagnostic Steps**:
1. **Run Analysis**:
   ```bash
   /qa:analyze
   ```

2. **Check Specific Gates**:
   ```bash
   # View detailed results
   cat .claude/.artifacts/qa.json
   
   # Check specific failures
   cat .claude/.artifacts/gate.json
   ```

3. **Follow Routing Recommendations**:
   ```json
   {
     "fix_strategy": {
       "primary_approach": "codex:micro",
       "success_rate": 0.85,
       "estimated_time": "3-5 minutes"
     }
   }
   ```

**Common Gate Failures**:

#### Test Failures
```bash
# Check test output
npm test -- --verbose

# Run specific failing test
npm test -- --testNamePattern="failing test name"

# Fix with targeted approach
/codex:micro-fix "test failure context" "specific error message"
```

#### TypeScript Errors
```bash
# Check specific errors
npm run typecheck

# Common fixes
/codex:micro 'Fix TypeScript error: add missing type definition'
/codex:micro 'Fix TypeScript error: update interface definition'
```

#### Linting Issues
```bash
# Check linting errors
npm run lint

# Auto-fix where possible
npm run lint -- --fix

# Manual fixes for remaining issues
/codex:micro 'Fix linting error: remove unused variable'
```

### Sandbox Issues

**Symptoms**:
- "Working tree not clean" errors
- Codex micro operations failing
- Git conflicts in sandbox branches

**Solutions**:
1. **Clean Working Tree**:
   ```bash
   # Save current work
   git stash push -u -m "Save work before retry"
   
   # Check status
   git status
   
   # Should show clean working tree
   ```

2. **Remove Stale Sandbox Branches**:
   ```bash
   # List sandbox branches
   git branch | grep "codex/"
   
   # Remove old sandbox branches
   git branch | grep "codex/" | xargs git branch -D
   ```

3. **Reset to Clean State**:
   ```bash
   # Return to main branch
   git checkout main
   
   # Pull latest changes
   git pull origin main
   
   # Clean workspace
   git clean -fd
   ```

4. **Retry Operation**:
   ```bash
   # After cleaning, retry the command
   /codex:micro 'your change description'
   ```

### Performance Issues

**Symptoms**:
- Commands taking very long to complete
- Large codebase scans timing out
- Memory issues during analysis

**Solutions**:

#### Use Scope Limitation
```bash
# For security scans
/sec:scan changed json

# For connascence analysis
/conn:scan changed 90

# Set environment for light gates
export GATES_PROFILE=light
```

#### Optimize CI/CD Performance
```bash
# Use parallel test execution
npm test -- --maxWorkers=4

# Enable incremental TypeScript
npm run typecheck -- --incremental

# Use changed files only in CI
export CI_CHANGED_FILES_ONLY=true
```

#### Memory Optimization
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Clean npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules && npm install
```

### Missing Artifacts

**Symptoms**:
- Commands report "artifact not found"
- Empty `.claude/.artifacts/` directory
- Analysis commands failing due to missing inputs

**Solutions**:
1. **Run Prerequisites**:
   ```bash
   # Always run QA first
   /qa:run
   
   # Then run dependent commands
   /qa:analyze
   /qa:gate
   ```

2. **Check Artifact Directory**:
   ```bash
   # Verify directory exists and has correct permissions
   ls -la .claude/.artifacts/
   
   # Create if missing
   mkdir -p .claude/.artifacts
   chmod 755 .claude/.artifacts
   ```

3. **Regenerate Missing Artifacts**:
   ```bash
   # For QA results
   /qa:run
   
   # For impact analysis  
   /gemini:impact 'your change description'
   
   # For security results
   /sec:scan
   ```

### Project Management Integration Issues

**Symptoms**:
- `/pm:sync` fails with connection errors
- Project ID not detected automatically
- Synchronization conflicts

**Solutions**:
1. **Configure Plane MCP**:
   ```bash
   # Set environment variables
   export PLANE_SERVER_URL=https://app.plane.so
   export PLANE_WORKSPACE=your-workspace
   export PROJECT_ID=your-project-id
   export PLANE_API_TOKEN=your-token
   ```

2. **Manual Project ID**:
   ```bash
   # Specify project ID explicitly
   /pm:sync sync your-project-id-here
   ```

3. **Check Configuration**:
   ```bash
   # Verify .plane/config.json exists
   cat .plane/config.json
   
   # Check package.json for plane configuration
   cat package.json | grep -A 5 '"plane"'
   ```

## 🔧 Advanced Troubleshooting

### Debug Mode

Enable detailed logging for diagnosis:

```bash
# Set debug environment
export DEBUG=spek:*
export VERBOSE_LOGGING=true

# Run command with debugging
/qa:run
```

### Artifact Analysis

Examine command outputs for issues:

```bash
# Check QA results structure
cat .claude/.artifacts/qa.json | jq '.'

# Look for specific errors
cat .claude/.artifacts/qa.json | jq '.results.tests.details.failed_tests'

# Check gate decisions
cat .claude/.artifacts/gate.json | jq '.blocking_issues'
```

### Command Sequencing

Ensure proper command execution order:

```bash
# Correct sequence for full workflow
/spec:plan                    # 1. Generate plan
/gemini:impact 'description'  # 2. Analyze impact (optional)
/codex:micro 'change'        # 3. Implement
/qa:run                      # 4. Run QA
/qa:gate                     # 5. Check gates
/pr:open                     # 6. Create PR

# Don't skip steps or run out of order
```

### Resource Monitoring

Monitor system resources during operations:

```bash
# Check disk space
df -h .

# Monitor memory usage
free -h

# Check process usage
top | grep -E "(node|python|semgrep)"
```

## 🚀 Performance Optimization

### Large Codebases

For projects with >10k LOC:

```bash
# Use changed-files-only scans
export GATES_PROFILE=light

# Limit analysis scope
/sec:scan changed
/conn:scan changed

# Optimize Git operations
git config core.preloadindex true
git config core.fscache true
```

### CI/CD Optimization

For faster continuous integration:

```bash
# Parallel execution
npm test -- --maxWorkers=auto

# Incremental builds
npm run build -- --incremental

# Cache optimization
export NPM_CONFIG_CACHE=.npm-cache
npm ci --cache .npm-cache
```

### Memory Management

For memory-constrained environments:

```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=8192"

# Use streaming for large files
export STREAM_LARGE_FILES=true

# Garbage collection tuning
export NODE_OPTIONS="--gc-concurrent"
```

## 🔍 Diagnostic Commands

### System Health Check

```bash
# Check all prerequisites
node --version              # Should be 18+
git --version              # Should be 2.0+
npm --version              # Should be 8+

# Verify tools
npx semgrep --version      # Security scanner
python --version           # For connascence analysis

# Check permissions
ls -la .claude/
ls -la .claude/.artifacts/
```

### Command Validation

```bash
# Test each command individually
/spec:plan                 # Should work with SPEC.md
/qa:run                    # Should generate qa.json
/qa:gate                   # Should read qa.json
/pr:open --help           # Should show usage
```

### Integration Testing

```bash
# Test complete workflow with sample
echo "# Test Spec" > SPEC.md
/spec:plan
/qa:run
/qa:gate

# Verify artifacts created
ls -la .claude/.artifacts/
```

## 📞 Getting Help

### Self-Service Resources

1. **Documentation**: 
   - `docs/COMMANDS.md` - Complete command reference
   - `docs/QUICK-REFERENCE.md` - Command cheat sheet
   - `examples/` - Step-by-step tutorials

2. **Log Analysis**:
   ```bash
   # Check recent command outputs
   tail -f .claude/.artifacts/*.json
   
   # Look for error patterns
   grep -r "error\|failed\|exception" .claude/.artifacts/
   ```

3. **Community Resources**:
   - GitHub Issues: Report bugs and request features
   - Documentation Updates: Contribute improvements

### Escalation Path

If you can't resolve the issue:

1. **Collect Diagnostic Info**:
   ```bash
   # System information
   uname -a
   node --version
   git --version
   
   # Project state
   git status
   ls -la .claude/.artifacts/
   
   # Recent command history and outputs
   ```

2. **Create Minimal Reproduction**:
   - Simplest possible example that shows the issue
   - Step-by-step commands to reproduce
   - Expected vs actual behavior

3. **Report with Context**:
   - What you were trying to accomplish
   - What commands you ran
   - What error messages you saw
   - What you've already tried

## ✅ Prevention Checklist

### Before Starting Work

- [ ] Working tree is clean (`git status`)
- [ ] On correct branch
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables set
- [ ] `.claude/.artifacts/` directory exists

### Before Running Commands

- [ ] SPEC.md exists and is complete
- [ ] Previous commands completed successfully
- [ ] Sufficient disk space available
- [ ] Network connectivity for external tools

### After Command Failures

- [ ] Read error messages carefully
- [ ] Check artifact files for details
- [ ] Try suggested solutions
- [ ] Use `/qa:analyze` for routing guidance
- [ ] Clean workspace if needed

---

**Remember**: Most issues are resolved by ensuring clean state, proper command sequence, and following the routing recommendations from `/qa:analyze`. When in doubt, start fresh with a clean working tree and follow the step-by-step workflow guides!