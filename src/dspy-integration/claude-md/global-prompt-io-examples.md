# DSPy Global Prompt I/O Examples for CLAUDE.md

## Optimized Input/Output Patterns for 87+ SPEK Agents

### 1. Concurrency Pattern
**Input**: "Create authentication system with user management"
**Optimized Output**:
```typescript
// CONCURRENT: All operations in single message
[BatchTool]:
  TodoWrite(["Design auth schema", "Implement JWT", "Create user CRUD", "Add tests", "Document API"])
  Task("researcher", "Analyze auth patterns")
  Task("backend-dev", "Implement JWT service")
  Task("tester", "Create auth test suite")
  Bash("mkdir -p src/auth tests/auth docs/auth")
  Write("src/auth/jwt.service.ts", jwtImplementation)
  Write("tests/auth/jwt.test.ts", jwtTests)
```

### 2. NASA Rule 10 Pattern
**Input**: "Process large dataset"
**Optimized Output**:
```typescript
function processDataset(data: any[]): void {
  assert(data !== null, 'Data required');
  assert(data.length <= 1000, 'Max 1000 items');
  
  // Fixed loop, no recursion
  for (let i = 0; i < Math.min(data.length, 1000); i++) {
    processItem(data[i]);
  }
  
  assert(processed === data.length, 'All items processed');
}
```

### 3. FSM State Management
**Input**: "Handle user state transitions"
**Optimized Output**:
```typescript
enum UserState { IDLE, ACTIVE, SUSPENDED, DELETED }
enum UserEvent { LOGIN, LOGOUT, SUSPEND, DELETE }

// Centralized transitions
const transitions = {
  [UserState.IDLE]: {
    [UserEvent.LOGIN]: UserState.ACTIVE
  },
  [UserState.ACTIVE]: {
    [UserEvent.LOGOUT]: UserState.IDLE,
    [UserEvent.SUSPEND]: UserState.SUSPENDED
  }
};
```

### 4. Quality Gate Pattern
**Input**: "Deploy feature with validation"
**Optimized Output**:
```typescript
// Quality enforcement before deployment
const validation = {
  nasaCompliance: 0.95,    // Required
  fsmCoverage: 0.90,        // Required  
  theaterScore: 59,         // <60 required
  testCoverage: 0.85        // Required
};

if (Object.values(validation).every(v => v >= threshold)) {
  deploy();
}
```

### 5. Memory Optimization Pattern
**Input**: "Store communication in memory"
**Optimized Output**:
```typescript
// Dual memory with cleanup
const { mcpId, snapshotId } = await memoryCoordinator.storeCommunication(
  communication,
  sourceAgent,
  targetAgent
);

// Automatic cleanup at 1000 entities
if (entities.size >= 1000) {
  await performCleanup();
}
```

### 6. Queen-Princess Communication
**Input**: "Queen delegates task to princess"
**Optimized Output**:
```typescript
// DSPy optimized with quality score
const directive = await optimizeDirective(
  "Implement OAuth integration",
  "princess_development"
);

if (directive.qualityScore >= 0.85) {
  await princess.execute(directive.optimized);
}
```

### 7. Princess-Drone Task Delegation
**Input**: "Princess assigns work to drone"
**Optimized Output**:
```typescript
// FSM-based delegation
await princess.transition(PrincessState.DELEGATING);
const optimizedTask = await optimizer.delegateToDrone({
  task: "Fix authentication bug",
  droneType: "backend-dev",
  qualityThreshold: 0.88
});
```

### 8. Drone Status Reporting
**Input**: "Drone reports completion"
**Optimized Output**:
```typescript
// Evidence-based reporting
const report = {
  status: 'completed',
  evidence: ['tests/passed.log', 'coverage/report.html'],
  qualityScore: 0.91,
  artifacts: ['auth.service.ts', 'auth.test.ts']
};

await drone.reportToPrincess(report);
```

### 9. Context DNA Enhancement
**Input**: "Optimize large context"
**Optimized Output**:
```typescript
// 60-80% compression
const enhanced = await contextEnhancer.enhance(context);
const compressed = {
  dna: enhanced.semanticHash,
  relevance: enhanced.relevanceScore,
  size: original.length * 0.3  // 70% reduction
};
```

### 10. Agent Configuration Pattern
**Input**: "Configure specialized agent"
**Optimized Output**:
```typescript
const config = {
  agentType: 'backend-dev',
  modelType: 'claude-sonnet-4',
  mcpServers: ['claude-flow', 'memory', 'github'],
  qualityThreshold: 0.87,
  dspyOptimization: {
    enabled: true,
    signatureType: 'domain-specific'
  }
};
```

### 11. Batch Processing Pattern
**Input**: "Process multiple agents"
**Optimized Output**:
```typescript
// Bounded batch processing
const BATCH_SIZE = 10;
for (let i = 0; i < agents.length; i += BATCH_SIZE) {
  const batch = agents.slice(i, Math.min(i + BATCH_SIZE, agents.length));
  await Promise.all(batch.map(agent => process(agent)));
}
```

### 12. Error Recovery Pattern
**Input**: "Handle operation failure"
**Optimized Output**:
```typescript
// FSM error state with recovery
await fsm.transition(State.ERROR);
const recovery = {
  action: 'rollback',
  checkpoint: lastValidState,
  retryCount: Math.min(retries, 3)
};
await fsm.recover(recovery);
```

### 13. Validation Pattern
**Input**: "Validate before execution"
**Optimized Output**:
```typescript
// Pre-execution validation
const validation = await validator.validate({
  nasaRule10: true,
  fsmPattern: true,
  qualityGates: true,
  theaterDetection: true
});

if (validation.allPassed) {
  execute();
}
```

### 14. Audit Trail Pattern
**Input**: "Log operation for compliance"
**Optimized Output**:
```typescript
// Comprehensive audit entry
await audit.log({
  operation: 'OPTIMIZE',
  entityType: 'COMMUNICATION',
  entityId: message.id,
  agentId: agent.id,
  qualityScore: 0.92,
  timestamp: Date.now(),
  receipt: {
    status: 'OK',
    tools_used: ['memory', 'github'],
    cost: 0.03
  }
});
```

### 15. Performance Monitoring Pattern
**Input**: "Track system performance"
**Optimized Output**:
```typescript
// Real-time metrics
const metrics = {
  communicationQuality: 0.91,  // Target: 0.85+
  nasaCompliance: 0.95,         // Target: 0.92+
  fsmCoverage: 0.98,            // Target: 0.90+
  theaterScore: 45,             // Target: <60
  memoryEfficiency: 0.87        // Target: 0.80+
};

await monitor.track(metrics);
```

## Global Rules Applied to All Patterns

1. **NO Unicode characters** - Plain ASCII only
2. **Functions ≤60 lines** - NASA Rule 10
3. **No recursion** - Use fixed loops
4. **≥2 assertions per function** - Validation required
5. **Enum events** - No string literals for states/events
6. **Version footers** - All files must have run logs
7. **No TODOs** - Production-ready code only
8. **Concurrent operations** - Single message for all related tasks
9. **Quality thresholds** - Minimum 0.85 for all scores
10. **Evidence-based** - All claims must have proof