# SPEK-AUGMENT Examples & Tutorials

Welcome to the comprehensive tutorial collection for the SPEK-AUGMENT development template! This directory contains step-by-step guides, workflow examples, and sample specifications to help you master AI-driven, quality-gated development.

## [ROCKET] Getting Started

**New to SPEK?** Start here:

1. **[Getting Started Tutorial](getting-started.md)** - Initialize template and run your first workflow
2. **[Basic Workflow](basic-workflow.md)** - Simple feature implementation with `/codex:micro`
3. **[Quality Gates Deep-Dive](quality-gates.md)** - Understanding the QA system

## [U+1F4DA] Learning Path

### Beginner Level
- [Getting Started](getting-started.md) - Template setup and basic usage
- [Basic Workflow](basic-workflow.md) - Single-file changes with quality gates
- [Quality Gates](quality-gates.md) - Understanding tests, linting, security

### Intermediate Level  
- [Complex Workflow](complex-workflow.md) - Multi-file changes with checkpoints
- [Security Scanning](security-scanning.md) - OWASP compliance and vulnerability management
- [Project Management](project-management.md) - Plane MCP integration

### Advanced Level
- [Architecture Changes](workflows/architecture-migration.md) - Large-scale refactoring
- [Custom Workflows](workflows/custom-automation.md) - Claude Flow orchestration
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

## [TOOL] Workflow Examples

| Scenario | Guide | Commands Used |
|----------|-------|---------------|
| **Simple Bug Fix** | [Basic Workflow](basic-workflow.md) | `/codex:micro`, `/qa:run` |
| **New Feature** | [Complex Workflow](complex-workflow.md) | `/spec:plan`, `/fix:planned` |
| **Security Review** | [Security Scanning](security-scanning.md) | `/sec:scan`, `/conn:scan` |
| **Architecture Change** | [workflows/architecture-migration.md](workflows/architecture-migration.md) | `/gemini:impact`, `/fix:planned` |
| **CI/CD Integration** | [workflows/ci-integration.md](workflows/ci-integration.md) | `/qa:gate`, automated flows |

## [CLIPBOARD] Sample Specifications

Ready-to-use SPEC.md examples for different project types:

- **[Simple Feature](sample-specs/simple-feature.md)** - Add utility function
- **[Authentication System](sample-specs/auth-system.md)** - JWT implementation
- **[Architecture Migration](sample-specs/architecture-migration.md)** - Microservices transition
- **[Security Hardening](sample-specs/security-hardening.md)** - OWASP compliance
- **[Performance Optimization](sample-specs/performance-optimization.md)** - Speed improvements

## [TARGET] Quick Command Reference

### Essential Commands
```bash
/spec:plan              # Convert SPEC.md to tasks
/codex:micro 'change'   # Small, safe edits
/qa:run                 # Full quality check
/pr:open                # Create evidence-rich PR
```

### Analysis Commands
```bash
/gemini:impact 'change' # Architectural impact analysis
/qa:analyze             # Route failures to fixes
/sec:scan               # Security vulnerability scan
/conn:scan              # Code quality and coupling analysis
```

### Advanced Workflows
```bash
/fix:planned 'complex'  # Multi-file systematic fixes
/pm:sync                # Project management integration
```

## [CYCLE] Workflow Patterns

### Standard Development Flow
```mermaid
graph LR
    A[Edit SPEC.md] --> B[/spec:plan]
    B --> C[/codex:micro or /fix:planned]
    C --> D[/qa:run]
    D --> E[/qa:gate]
    E --> F[/pr:open]
```

### Quality-First Flow
```mermaid
graph LR
    A[Code Changes] --> B[/qa:run]
    B --> C[/qa:analyze]
    C --> D[Auto-fix Routes]
    D --> B
    C --> E[/pr:open]
```

### Security-Focused Flow
```mermaid
graph LR
    A[Implementation] --> B[/sec:scan]
    B --> C[/conn:scan]
    C --> D[/qa:gate]
    D --> E[/pr:open]
```

## [U+1F6E0][U+FE0F] Template Customization

### Project-Specific Setup
- **Package.json Integration**: Add custom scripts
- **CI/CD Configuration**: GitHub Actions workflows  
- **Quality Thresholds**: Adjust CTQ parameters
- **Security Rules**: Custom Semgrep configurations

### Tool Integration
- **Testing Frameworks**: Jest, Vitest, Cypress
- **Build Systems**: Webpack, Vite, Rollup
- **Deployment**: Vercel, Netlify, AWS
- **Monitoring**: Sentry, LogRocket, DataDog

## [CHART] Metrics & Analytics

Track your development effectiveness:

- **Quality Scores**: Test coverage, lint compliance, security posture
- **Velocity Metrics**: Task completion rates, fix success rates
- **Architectural Health**: NASA POT10 compliance, technical debt
- **Team Productivity**: PR cycle times, review effectiveness

## [U+1F393] Best Practices

### Command Usage
- Start with `/codex:micro` for simple changes
- Use `/gemini:impact` before major architectural changes
- Always run `/qa:run` before creating PRs
- Leverage `/qa:analyze` for intelligent fix routing

### Quality Management
- Maintain 100% test pass rate
- Keep security findings at zero critical/high
- Monitor NASA POT10 compliance >=90%
- Track coverage on changed lines only

### Workflow Optimization
- Use `changed` scope for faster scans on large codebases
- Enable parallel execution for CI environments
- Configure appropriate quality profiles per environment
- Set up automated stakeholder notifications

## [SEARCH] Troubleshooting Quick Fixes

| Issue | Quick Fix | Documentation |
|-------|-----------|---------------|
| Command not found | Update Claude Code | [troubleshooting.md](troubleshooting.md) |
| Quality gate failure | Run `/qa:analyze` | [quality-gates.md](quality-gates.md) |
| Sandbox conflicts | `git stash` and retry | [troubleshooting.md](troubleshooting.md) |
| Large codebase slow | Use `scope=changed` | [performance tips](troubleshooting.md#performance) |

## [U+1F91D] Contributing Examples

Have a great workflow example? Contribute to this collection:

1. Create example in appropriate directory
2. Follow existing format and structure
3. Include real command outputs
4. Add troubleshooting section
5. Update this README index

## [U+1F4DA] Additional Resources

- **[Command Reference](../docs/COMMANDS.md)** - Complete slash command documentation
- **[Quick Reference](../docs/QUICK-REFERENCE.md)** - Command cheat sheet
- **[SPEK Methodology](../docs/CTQ.md)** - Quality framework details
- **[GitHub Spec Kit](https://github.com/github/spec-kit)** - Official specification toolkit

---

**Ready to start building?** [ROCKET]

Choose your learning path:
- **First time?** -> [Getting Started](getting-started.md)
- **Simple change?** -> [Basic Workflow](basic-workflow.md)  
- **Complex feature?** -> [Complex Workflow](complex-workflow.md)
- **Architecture work?** -> [workflows/architecture-migration.md](workflows/architecture-migration.md)

*Happy coding with SPEK-AUGMENT!* [U+2728]