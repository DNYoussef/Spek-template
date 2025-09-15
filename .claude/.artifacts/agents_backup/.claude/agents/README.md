# Claude Code Agents Directory Structure

This directory contains sub-agent definitions organized by type and purpose. Each agent has specific capabilities, tool restrictions, and naming conventions that trigger automatic delegation.

## Directory Structure

```
.claude/agents/
[U+251C][U+2500][U+2500] README.md                    # This file
[U+251C][U+2500][U+2500] _templates/                  # Agent templates
[U+2502]   [U+251C][U+2500][U+2500] base-agent.yaml
[U+2502]   [U+2514][U+2500][U+2500] agent-types.md
[U+251C][U+2500][U+2500] development/                 # Development agents
[U+2502]   [U+251C][U+2500][U+2500] backend/
[U+2502]   [U+251C][U+2500][U+2500] frontend/
[U+2502]   [U+251C][U+2500][U+2500] fullstack/
[U+2502]   [U+2514][U+2500][U+2500] api/
[U+251C][U+2500][U+2500] testing/                     # Testing agents
[U+2502]   [U+251C][U+2500][U+2500] unit/
[U+2502]   [U+251C][U+2500][U+2500] integration/
[U+2502]   [U+251C][U+2500][U+2500] e2e/
[U+2502]   [U+2514][U+2500][U+2500] performance/
[U+251C][U+2500][U+2500] architecture/                # Architecture agents
[U+2502]   [U+251C][U+2500][U+2500] system-design/
[U+2502]   [U+251C][U+2500][U+2500] database/
[U+2502]   [U+251C][U+2500][U+2500] cloud/
[U+2502]   [U+2514][U+2500][U+2500] security/
[U+251C][U+2500][U+2500] devops/                      # DevOps agents
[U+2502]   [U+251C][U+2500][U+2500] ci-cd/
[U+2502]   [U+251C][U+2500][U+2500] infrastructure/
[U+2502]   [U+251C][U+2500][U+2500] monitoring/
[U+2502]   [U+2514][U+2500][U+2500] deployment/
[U+251C][U+2500][U+2500] documentation/               # Documentation agents
[U+2502]   [U+251C][U+2500][U+2500] api-docs/
[U+2502]   [U+251C][U+2500][U+2500] user-guides/
[U+2502]   [U+251C][U+2500][U+2500] technical/
[U+2502]   [U+2514][U+2500][U+2500] readme/
[U+251C][U+2500][U+2500] analysis/                    # Analysis agents
[U+2502]   [U+251C][U+2500][U+2500] code-review/
[U+2502]   [U+251C][U+2500][U+2500] performance/
[U+2502]   [U+251C][U+2500][U+2500] security/
[U+2502]   [U+2514][U+2500][U+2500] refactoring/
[U+251C][U+2500][U+2500] data/                        # Data agents
[U+2502]   [U+251C][U+2500][U+2500] etl/
[U+2502]   [U+251C][U+2500][U+2500] analytics/
[U+2502]   [U+251C][U+2500][U+2500] ml/
[U+2502]   [U+2514][U+2500][U+2500] visualization/
[U+2514][U+2500][U+2500] specialized/                 # Specialized agents
    [U+251C][U+2500][U+2500] mobile/
    [U+251C][U+2500][U+2500] embedded/
    [U+251C][U+2500][U+2500] blockchain/
    [U+2514][U+2500][U+2500] ai-ml/
```

## Naming Conventions

Agent files follow this naming pattern:
`[type]-[specialization]-[capability].agent.yaml`

Examples:
- `dev-backend-api.agent.yaml`
- `test-unit-jest.agent.yaml`
- `arch-cloud-aws.agent.yaml`
- `docs-api-openapi.agent.yaml`

## Automatic Delegation Triggers

Claude Code automatically delegates to agents based on:
1. **Keywords in user request**: "test", "deploy", "document", "review"
2. **File patterns**: `*.test.js` -> testing agent, `*.tf` -> infrastructure agent
3. **Task complexity**: Multi-step tasks spawn coordinator agents
4. **Domain detection**: Database queries -> data agent, API endpoints -> backend agent

## Tool Restrictions

Each agent type has specific tool access:
- **Development agents**: Full file system access, code execution
- **Testing agents**: Test runners, coverage tools, limited write access
- **Architecture agents**: Read-only access, diagram generation
- **Documentation agents**: Markdown tools, read access, limited write to docs/
- **DevOps agents**: Infrastructure tools, deployment scripts, environment access
- **Analysis agents**: Read-only access, static analysis tools