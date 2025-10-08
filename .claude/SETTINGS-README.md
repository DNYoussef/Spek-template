# Claude Code Settings Documentation

**Last Updated**: 2025-10-07
**Claude Code Version**: 2.0.9
**claude-flow Version**: 2.5.0-alpha.139

---

## Settings Files in This Project

### settings.json
Main project settings shared with the team via git.

**Key Configuration**:
- **Environment Variables**: claude-flow v2.5.0+ integration
  - `CLAUDE_FLOW_AUTO_COMMIT`: false (manual commits)
  - `CLAUDE_FLOW_AUTO_PUSH`: false (manual push)
  - `CLAUDE_FLOW_HOOKS_ENABLED`: true (automatic hooks)
  - `CLAUDE_FLOW_TELEMETRY_ENABLED`: true (metrics)
  - `CLAUDE_FLOW_REMOTE_EXECUTION`: true (remote capability)
  - `CLAUDE_FLOW_GITHUB_INTEGRATION`: true (GitHub features)
  - `CLAUDE_FLOW_CHECKPOINTS_ENABLED`: true (git checkpoints)
  - `CREATE_GH_RELEASE`: true (automatic releases)

- **Permissions**: 40+ Bash command patterns with `:*` wildcard syntax
  - All git commands (diff, log, add, commit, etc.)
  - npm/node commands
  - File operations (find, grep, sed, awk, cat, etc.)
  - GitHub CLI (gh)
  - claude-flow integration

- **Hooks**: Automatic integration with claude-flow v2.5.0+
  - **PreToolUse**: Validates commands, assigns agents, loads context
  - **PostToolUse**: Formats code, updates memory, creates checkpoints
  - **UserPromptSubmit**: Creates task checkpoints with GitHub releases
  - **Stop**: Generates session summaries, persists state
  - **PreCompact**: Provides agent context before compaction

- **MCP Servers**: 87 tools via ruv-swarm unified platform
  - `claude-flow`: Core orchestration
  - `ruv-swarm`: 87 unified tools (swarm, neural, memory, GitHub, etc.)

**Purpose**: Team-wide configuration for consistent development experience.

---

### settings.local.json
Personal preferences NOT committed to git.

**Key Configuration**:
- **Permissions**: Extended personal permissions
  - SlashCommand permissions
  - Desktop directory access
  - Python analyzer commands
  - MCP filesystem/memory tools
  - Additional Bash patterns for personal workflow

- **MCP Settings**:
  - `enableAllProjectMcpServers`: true
  - Same MCP servers as main settings

**Purpose**: Personal customizations that override project settings.

---

## Settings Hierarchy

Claude Code loads settings in this priority order:

1. **User settings**: `~/.claude/settings.json` (lowest priority)
2. **User local**: `~/.claude/settings.local.json`
3. **Project settings**: `./.claude/settings.json`
4. **Project local**: `./.claude/settings.local.json` (highest priority)

Higher priority settings override lower priority ones.

---

## Environment Variables Explained

### CLAUDE_FLOW_AUTO_COMMIT
- **Value**: `"false"`
- **Purpose**: Requires manual `git commit` commands
- **Set to true**: Auto-commits after file edits

### CLAUDE_FLOW_AUTO_PUSH
- **Value**: `"false"`
- **Purpose**: Requires manual `git push` commands
- **Set to true**: Auto-pushes commits to remote

### CLAUDE_FLOW_HOOKS_ENABLED
- **Value**: `"true"`
- **Purpose**: Enables all claude-flow hooks
- **Set to false**: Disables automatic hook execution

### CLAUDE_FLOW_TELEMETRY_ENABLED
- **Value**: `"true"`
- **Purpose**: Tracks metrics and performance
- **Set to false**: Disables telemetry collection

### CLAUDE_FLOW_REMOTE_EXECUTION
- **Value**: `"true"`
- **Purpose**: Allows remote agent execution
- **Set to false**: Local execution only

### CLAUDE_FLOW_GITHUB_INTEGRATION
- **Value**: `"true"`
- **Purpose**: Enables GitHub CLI integration
- **Set to false**: Disables GitHub features

### CLAUDE_FLOW_CHECKPOINTS_ENABLED
- **Value**: `"true"`
- **Purpose**: Creates git checkpoints after edits
- **Set to false**: No automatic checkpoints

### CREATE_GH_RELEASE
- **Value**: `"true"`
- **Purpose**: Creates GitHub releases for checkpoints
- **Set to false**: No GitHub releases

---

## Hooks Explained

### PreToolUse
**When**: Before any tool execution
**Purpose**: Preparation and validation

**Bash Hook**:
- Validates command safety
- Prepares resources
- Calls: `npx claude-flow@alpha hooks pre-command`

**Write|Edit|MultiEdit Hook**:
- Auto-assigns agents by file type
- Loads file context and history
- Creates pre-edit checkpoint branch
- Calls: `npx claude-flow@alpha hooks pre-edit`

### PostToolUse
**When**: After tool execution
**Purpose**: Cleanup and storage

**Bash Hook**:
- Tracks command metrics
- Stores execution results
- Calls: `npx claude-flow@alpha hooks post-command`

**Write|Edit|MultiEdit Hook**:
- Formats code automatically
- Updates memory with changes
- Creates git checkpoint tag
- Stores checkpoint metadata
- Calls: `npx claude-flow@alpha hooks post-edit`

### UserPromptSubmit
**When**: When you submit a prompt
**Purpose**: Task checkpoint creation

**Actions**:
- Creates git commit with task description
- Creates GitHub release for checkpoint (if `gh` CLI available)
- Stores checkpoint metadata in `.claude/checkpoints/`
- Provides rollback instructions

### Stop
**When**: Session ends
**Purpose**: Session summary and state persistence

**Actions**:
- Generates session summary
- Persists state for next session
- Exports performance metrics
- Creates final session tag
- Optionally creates GitHub session summary

### PreCompact
**When**: Context window is compacting
**Purpose**: Provide guidance before context reduction

**Manual Compaction**:
- Reviews CLAUDE.md for agent info
- Reminds about 54 agents and concurrent patterns
- Shows custom compact instructions if provided

**Auto Compaction**:
- Warns about context window full
- Reminds about agent coordination strategies
- Applies concurrent execution rules

---

## MCP Servers

### claude-flow
**Purpose**: Core orchestration and coordination
**Tools**: Swarm initialization, agent spawning, task orchestration

### ruv-swarm
**Purpose**: Unified platform with 87 tools
**Categories**:
- **Swarm Coordination** (12): swarm_init, agent_spawn, task_orchestrate
- **Neural Networks** (15): neural_train, pattern_recognize, inference_run
- **Memory & Persistence** (12): memory_usage, memory_search, memory_persist
- **GitHub Integration** (10+): PR automation, issue management
- **Performance** (10+): Metrics, benchmarking, profiling

**Total Tools**: 87 accessible via `npx claude-flow mcp tools`

---

## Permission Wildcard Syntax

**IMPORTANT**: Claude Code v1.0.51+ requires `:*` for prefix matching.

### Correct Syntax
```json
"Bash(git diff:*)"    // Matches: git diff HEAD, git diff --cached, etc.
"Bash(npm test:*)"    // Matches: npm test, npm test:unit, etc.
"Bash(node:*)"        // Matches: node script.js, node --version, etc.
```

### Incorrect Syntax (INVALID)
```json
"Bash(git diff *)"    // ❌ Space before * - INVALID
"Bash(npm test *)"    // ❌ Space before * - INVALID
"Bash(node *)"        // ❌ Space before * - INVALID
```

**Reference**: [GitHub Issue #773](https://github.com/ruvnet/claude-flow/issues/773)

---

## Common Issues

### Issue: "_comment" fields cause validation errors
**Cause**: Claude Code v1.0.51+ flags unrecognized fields
**Solution**: Use this README instead of in-file comments
**Reference**: [GitHub Issue #4475](https://github.com/anthropics/claude-code/issues/4475)

### Issue: Hooks not executing
**Check**:
1. `CLAUDE_FLOW_HOOKS_ENABLED=true` in env
2. `jq` command installed (for JSON parsing)
3. Git repository initialized
4. claude-flow installed: `npx claude-flow --version`

### Issue: MCP servers not found
**Check**:
1. Run: `npx claude-flow mcp status`
2. Verify: `enabledMcpjsonServers` in settings
3. Start if needed: `npx claude-flow mcp start`

### Issue: Permissions denied
**Check**:
1. Correct wildcard syntax (`:*` not `*`)
2. Command in `allow` list
3. Not in `deny` list
4. No conflicting permission rules

---

## Testing Your Configuration

```bash
# Test permissions
git status
git diff HEAD~1
npm test
node --version
find . -name "*.json" | head -3

# Test MCP
npx claude-flow mcp status
npx claude-flow mcp tools | head -20

# Test hooks (create a test file to trigger hooks)
echo "test" > test.txt
# Hooks should execute automatically
rm test.txt
```

---

## Disabling claude-flow Integration

To use native Claude Code only (without claude-flow):

1. **Disable hooks**:
   ```json
   "env": {
     "CLAUDE_FLOW_HOOKS_ENABLED": "false"
   }
   ```

2. **Or remove hooks section entirely**:
   ```json
   {
     "env": {...},
     "permissions": {...}
     // No "hooks" section
   }
   ```

3. **Keep MCP if desired**:
   ```json
   "enabledMcpjsonServers": ["claude-flow", "ruv-swarm"]
   ```

---

## Migrating to Claude Agent SDK

The official **Claude Agent SDK** provides native alternatives to claude-flow:

**Features**:
- Subagents in `./.claude/agents/`
- Slash commands in `./.claude/commands/`
- Native MCP support
- Production error handling

**Migration Path**:
- Current claude-flow setup is production-ready
- Monitor [claude-flow development](https://github.com/ruvnet/claude-flow)
- Evaluate Agent SDK when features match your needs
- Gradual migration: Agent SDK for new features, claude-flow for existing

---

## Backups

Backups are automatically created before fixes:
- **Project**: `.claude/settings.json.backup-20251007-084345`
- **User**: `~/.claude/settings.json.backup-*`

### Restore if needed:
```bash
# Project settings
cp .claude/settings.json.backup-20251007-084345 .claude/settings.json

# User settings
cp ~/.claude/settings.json.backup-* ~/.claude/settings.json
```

---

## References

- [Claude Code Settings Docs](https://docs.claude.com/en/docs/claude-code/settings)
- [Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk/overview)
- [claude-flow Repository](https://github.com/ruvnet/claude-flow)
- [Wildcard Syntax Issue](https://github.com/ruvnet/claude-flow/issues/773)
- [Comment Fields Issue](https://github.com/anthropics/claude-code/issues/4475)

---

## Getting Help

1. **Check this README** for configuration explanations
2. **Run diagnostics**: `npx claude-flow mcp status`
3. **View documentation**: See `docs/` directory for detailed reports
4. **Check logs**: `.claude/checkpoints/` for hook execution history

---

**Maintained by**: SPEK Template Project
**Compatible with**: Claude Code v2.0.9 + claude-flow v2.5.0-alpha.139
