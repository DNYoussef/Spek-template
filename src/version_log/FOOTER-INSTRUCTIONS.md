# Version & Run Log Footer Instructions

## Universal Agent Instructions

### MANDATORY: File Footer Management

Every agent MUST maintain a file footer called "Version & Run Log" between markers:

```
BEGIN MARKER: AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
END MARKER: AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
```

### Behavior Rules

1. **Footer Creation**: If the footer is missing, CREATE it exactly in the specified format
2. **Footer Update**: If present, APPEND one new table row with:
   - **Version** (semver): Bump patch for content, minor for structure, major for breaking
   - **Timestamp** (ISO-8601): Include timezone (e.g., 2025-09-24T15:12:03-04:00)
   - **Agent/Model**: Your identifier (e.g., planner@GPT-5, reviewer@Claude-Opus)
   - **Change Summary**: <=80 chars, imperative mood (e.g., "Updated validation logic")
   - **Artifacts Changed**: IDs or file paths affected, or "--" if none
   - **Status**: OK | PARTIAL | BLOCKED
   - **Warnings/Notes**: Brief note or "--"
   - **Cost (USD)**: Rounded to 2 decimals
   - **Content Hash**: First 7 chars of SHA-256 hash (content WITHOUT footer)

3. **Receipt Section**: Update the receipt metadata under the table:
   - status: Current operation status
   - reason_if_blocked: Explanation if blocked, or "--"
   - run_id: Unique execution identifier
   - inputs: Source files or data used
   - tools_used: MCP servers and tools invoked
   - versions: Model and prompt versions

4. **Idempotency**: If Content Hash matches last row, status=PARTIAL with note "no-op (idempotent)"
5. **Table Rotation**: Keep only the 20 most recent rows
6. **Boundary Respect**: NEVER alter content outside the footer markers

### Footer Format

#### For Markdown/HTML Files
```markdown
<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->

## Version & Run Log

| Version | Timestamp (ISO-8601)     | Agent/Model | Change Summary | Artifacts Changed | Status | Warnings/Notes | Cost (USD) | Content Hash |
|--------:|---------------------------|-------------|----------------|-------------------|--------|----------------|-----------:|--------------|
| 1.0.0   | 2025-09-24T15:12:03-04:00 | agent@Model | Initial implementation | file1.ts, file2.ts | OK | -- | 0.12 | a1b2c3d |

### Receipt
- `status`: OK
- `reason_if_blocked`: --
- `run_id`: abc123
- `inputs`: ["SPEC.md", "plan.json"]
- `tools_used`: ["claude-flow", "memory", "github"]
- `versions`: {"model":"gpt-5","prompt":"v18"}

<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
```

#### For Python Files
```python
# ===== AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE =====
# ## Version & Run Log
# | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
# |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
# | 1.0.0   | 2025-09-24T15:12:03-04:00 | coder@GPT-5 | Add validation | -- | OK | -- | 0.08 | e12ad9c |
#
# ### Receipt
# - status: OK
# - reason_if_blocked: --
# - run_id: xyz789
# - inputs: ["utils.py"]
# - tools_used: []
# - versions: {"model":"gpt-5","prompt":"v6"}
# ===== AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE =====
```

#### For JavaScript/TypeScript Files
```javascript
/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-24T15:12:03-04:00 | frontend@GPT-5 | Create UI | -- | OK | -- | 0.15 | f9a8b7c |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: def456
- inputs: ["mockup.png"]
- tools_used: ["playwright", "figma"]
- versions: {"model":"gpt-5","prompt":"v12"}
AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */
```

### Quality & Safety

- If required data is missing, insert "TK CONFIRM" placeholder and set status=PARTIAL
- Never fabricate external facts; use "TK CONFIRM" rather than guessing
- Follow length limits strictly
- Avoid vague language

### Implementation Priority

1. **Always** compute Content Hash correctly (SHA-256, first 7 chars, exclude footer)
2. **Always** maintain chronological order in table
3. **Always** preserve existing rows (up to 20)
4. **Never** modify the footer structure
5. **Never** edit outside the footer markers

### Integration with SPEK Platform

- **Theater Detection**: Footer provides evidence of real work vs fake completion
- **3-Loop System**: Each loop phase gets tracked in version history
- **Quality Gates**: Footer status must be OK for gate passage
- **Audit Trail**: Complete NASA POT10 compliance tracking

### Agent-Specific Configuration

Each agent type should include additional context:

- **Coder agents**: Track LOC changes, test coverage impact
- **Reviewer agents**: Note security findings, code quality scores
- **Tester agents**: Include test results, coverage metrics
- **Planner agents**: Reference SPEC.md sections modified
- **Coordinator agents**: List spawned sub-agents

### Error Handling

If unable to update footer:
1. Set status=BLOCKED
2. Add reason in reason_if_blocked
3. Log to `.claude/.artifacts/footer-errors.log`
4. Continue with primary task (footer is auxiliary)

### Verification

Agents should self-verify:
1. Content Hash matches actual content (minus footer)
2. Version follows semver rules
3. Timestamp is current
4. All required fields populated

This footer system ensures complete traceability, version control, and audit compliance across all agent operations in the SPEK platform.