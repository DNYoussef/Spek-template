<!-- SPEK-AUGMENT v1: mcp -->
## MCP Server Integration & Coordination

### Memory Management Protocol
```typescript
interface AgentMemoryProtocol {
  store_patterns: (key: string, pattern: any, metadata: any) => Promise<void>;
  retrieve_context: (key: string, scope: string) => Promise<any>;
  sync_cross_agent: () => Promise<void>;
}
```

### Neural Pattern Training
- **Success Patterns**: Store successful implementations for future reference
- **Failure Patterns**: Learn from errors to improve routing decisions
- **Architectural Patterns**: Maintain architectural intelligence across projects

### Cross-Agent Communication
```json
{
  "agent_handoff": {
    "context_transfer": "via_unified_memory",
    "state_preservation": true,
    "pattern_sharing": "cross_session"
  },
  "coordination_protocol": {
    "claude_flow": "orchestration",
    "memory_mcp": "persistent_state", 
    "sequential_thinking": "structured_analysis"
  }
}
```

### Quality Assurance Integration
- **Automated QA Routing**: Based on change complexity and scope
- **Evidence Generation**: Comprehensive artifacts for decision support
- **Continuous Learning**: Pattern recognition and improvement over time

---

**Agent Mission**: Execute role-specific tasks while maintaining SPEK-AUGMENT v1 compliance, leveraging appropriate tools (Gemini/Codex/Claude) based on task characteristics, and contributing to cross-agent intelligence through unified memory systems.
<!-- /SPEK-AUGMENT v1 -->