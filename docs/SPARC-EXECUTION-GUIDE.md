# SPARC Execution Guide

## Overview

The SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) system is now fully operational with multiple execution methods to ensure reliability regardless of environment constraints.

## Execution Methods

### Method 1: Local SPARC Executor (Recommended)

The local SPARC executor provides reliable execution with fallback capabilities.

```bash
# List available modes
node scripts/sparc-executor.js modes

# Run a specific mode
node scripts/sparc-executor.js run spec "User authentication system"

# Run a workflow
node scripts/sparc-executor.js workflow sparc-tdd

# Validate quality gates
node scripts/sparc-executor.js validate
```

### Method 2: SPARC Wrapper Script

The wrapper script automatically detects and uses the best available executor.

```bash
# Make script executable (first time only)
chmod +x scripts/sparc-wrapper.sh

# List modes
./scripts/sparc-wrapper.sh modes

# Run with shorthand
./scripts/sparc-wrapper.sh spec "Payment system"

# Run workflow
./scripts/sparc-wrapper.sh workflow sparc-pipeline
```

### Method 3: Direct NPX (When Available)

```bash
# Try with stable version
npx claude-flow@latest sparc modes
npx claude-flow@latest sparc run spec "Feature name"

# Or with alpha version
npx claude-flow@alpha sparc modes
```

### Method 4: MCP Tools in Claude Code

When using Claude Code with MCP tools available:

```javascript
// Initialize swarm
mcp__flow-nexus__swarm_init {
  topology: "hierarchical",
  maxAgents: 8
}

// Execute SPARC mode
mcp__flow-nexus__task_orchestrate {
  task: "Implement user authentication",
  strategy: "adaptive"
}
```

## Available Modes

| Mode | Description | Primary Agents |
|------|-------------|----------------|
| **spec** | Requirements specification | specification, researcher, planner |
| **spec-pseudocode** | Spec + algorithm design | specification, pseudocode |
| **architect** | System architecture | architecture, system-architect |
| **tdd** | Test-driven development | tester, coder, reviewer |
| **tdd-london** | London School TDD | tdd-london-swarm, tester |
| **integration** | Component integration | coder, tester, reviewer |
| **refactor** | Code refactoring | code-analyzer, coder |
| **coder** | Direct implementation | coder, sparc-coder |
| **research** | Technical research | researcher, researcher-gemini |
| **review** | Code review | reviewer, code-analyzer |
| **test** | Comprehensive testing | tester, api-tester |
| **debug** | Debugging | coder, tester, analyzer |
| **optimize** | Performance optimization | perf-analyzer, benchmark-suite |
| **document** | Documentation | api-docs, content-creator |
| **pipeline** | Full SPARC pipeline | sparc-coord, orchestrator-task |
| **swarm** | Multi-agent coordination | swarm-init, coordinators |
| **theater-detect** | Fake work detection | theater-killer, reality-checker |

## Workflows

### TDD Workflow
```bash
node scripts/sparc-executor.js workflow sparc-tdd
```

Executes:
1. Specification definition
2. Write tests first (Red)
3. Implementation (Green)
4. Refactoring
5. Integration testing
6. Theater detection

### Full Pipeline Workflow
```bash
node scripts/sparc-executor.js workflow sparc-pipeline
```

Executes complete 15-step pipeline from research to production validation.

### Swarm Workflow
```bash
node scripts/sparc-executor.js workflow sparc-swarm
```

Executes distributed multi-agent swarm with consensus mechanisms.

## Templates

All templates are located in `.roo/templates/`:

- **SPEC.md.template** - Specification documentation
- **architecture.md.template** - Architecture design
- **documentation.md.template** - Project documentation
- **review-report.md.template** - Code review reports
- **plan.json.template** - Project planning
- **tdd-test.js.template** - TDD test structure

## Quality Gates

The system enforces strict quality gates:

| Gate | Threshold | Enforcement |
|------|-----------|-------------|
| Test Coverage | ≥80% | Required |
| Security Issues | 0 critical/high | Required |
| Performance | No regression | Required |
| Code Complexity | ≤10 | Required |
| Duplication | ≤5% | Required |
| Theater Detection | 0 tolerance | Required |
| NASA POT10 | ≥90% | Required |

## Configuration

### Main Configuration
`.roo/sparc-config.json` - Core SPARC settings

### Mode Configuration
`.roomodes` - Defines all available modes and agent mappings

### Workflow Definitions
`.roo/workflows/*.json` - Workflow specifications

## Troubleshooting

### Issue: claude-flow command errors

**Solution**: Use the local executor instead:
```bash
node scripts/sparc-executor.js run <mode> "<task>"
```

### Issue: Missing configuration files

**Solution**: Initialize SPARC environment:
```bash
./scripts/sparc-wrapper.sh init
```

### Issue: Permission denied on wrapper script

**Solution**: Make script executable:
```bash
chmod +x scripts/sparc-wrapper.sh
```

### Issue: Quality gates failing

**Solution**: Check specific gate requirements:
```bash
node scripts/sparc-executor.js validate
```

## Best Practices

1. **Always start with specification**: Run `spec` mode first to define clear requirements

2. **Use workflows for complex tasks**: Leverage pre-defined workflows for consistency

3. **Monitor quality gates**: Regularly run validation to ensure compliance

4. **Leverage templates**: Use provided templates for consistency across artifacts

5. **Enable parallel execution**: Use `--parallel` flag for faster execution when possible

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run SPARC Pipeline
  run: |
    npm install
    node scripts/sparc-executor.js workflow sparc-pipeline
    node scripts/sparc-executor.js validate
```

### Pre-commit Hook
```bash
#!/bin/bash
node scripts/sparc-executor.js validate
if [ $? -ne 0 ]; then
  echo "Quality gates failed. Please fix issues before committing."
  exit 1
fi
```

## Advanced Usage

### Custom Mode Execution
```javascript
const SPARCExecutor = require('./scripts/sparc-executor');
const executor = new SPARCExecutor();

// Run with custom options
await executor.runMode('spec', 'Custom feature', {
  verbose: true,
  parallel: true
});
```

### Programmatic Validation
```javascript
const results = await executor.validateQualityGates();
console.log('Quality gates passed:', results.every(r => r.passed));
```

## Support

For issues or questions:
1. Check this guide first
2. Review the audit report: `SPARC_AUDIT_REPORT.md`
3. Examine logs in `.roo/logs/`
4. Use fallback execution methods if primary fails

---

*SPARC Execution Guide v2.0.0*
*System Status: Fully Operational*