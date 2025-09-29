# Communication Patterns - SPEK Enhanced Development Platform

## Executive Summary

Through reverse engineering analysis, the actual communication patterns in SPEK differ significantly from documented theoretical models. The system uses simplified event-driven facade patterns rather than complex multi-agent protocols.

## Discovered Communication Architecture

### 1. Event-Driven Facade Pattern (Primary)

**Pattern:** All major components extend `EventEmitter` and use delegation
**Implementation:** Simple event forwarding through facade interfaces
**Performance:** Lightweight, minimal overhead

```typescript
// Actual Pattern Found in SwarmQueen.ts
export class SwarmQueen extends EventEmitter {
  private orchestrator: QueenOrchestrator;

  async executeTask(description, context, options) {
    // Direct delegation - no complex routing
    return await this.orchestrator.executeTask(description, context, options);
  }

  // Event forwarding setup
  private setupEventForwarding(): void {
    const events = ['queen:initialized', 'task:created', 'task:completed'];
    for (const event of events) {
      this.orchestrator.on(event, (...args) => this.emit(event, ...args));
    }
  }
}
```

### 2. FSM State Transition Hub (Secondary)

**Pattern:** Centralized state management through WorkflowTransitionHub
**Implementation:** All state changes flow through single hub
**Coordination:** State-based rather than message-based

```typescript
// Pattern from WorkflowFacade.ts
export class WorkflowFacade extends EventEmitter {
  private transitionHub: WorkflowTransitionHub;

  async executeWorkflow(workflowId, input, options) {
    // All state changes through hub
    await this.transitionHub.transitionWorkflow(workflowId, WorkflowEvent.INITIALIZE);
    await this.transitionHub.transitionWorkflow(workflowId, WorkflowEvent.START);
    // Process execution...
    await this.transitionHub.transitionWorkflow(workflowId, WorkflowEvent.COMPLETE);
  }
}
```

## Message Flow Protocols

### Queen → Princess Communication

**DOCUMENTED:** Complex hierarchical messaging with consensus
**ACTUAL:** Simple method delegation with event forwarding

```
FLOW: Queen.executeTask() → QueenOrchestrator.executeTask() → PrincessManager.getPrincess() → Princess.executeTask()

MESSAGE FORMAT: Plain JavaScript objects (no protocol headers)
{
  id: "task_timestamp_random",
  type: "inferred_from_description",
  priority: "medium",
  context: raw_input,
  requiredDomains: ["inferred", "domains"]
}

RESPONSE: Direct return values (no async messaging)
```

**A2A Communication Enhancement (Optional):**
```typescript
// Only if DSPy integration enabled
private async optimizeDirective(taskDescription: string, targetPrincess: string) {
  const message: AgentMessage = {
    content: taskDescription,
    sourceAgent: { role: 'QUEEN' },
    targetAgent: { role: 'PRINCESS' }
  };

  const result = await this.a2aEngine.routeCommunication(
    queenIdentity, princessIdentity, message
  );

  return result.optimizedMessage;
}
```

### Princess → Drone Communication

**DOCUMENTED:** Sophisticated task distribution
**ACTUAL:** Direct method calls through StepExecutor

```
FLOW: Princess.executeTask() → StepExecutor.executeStep() → Direct execution

MESSAGE FORMAT: StepDefinition objects
{
  stepId: string,
  timeout: number,
  maxRetries: number,
  implementation: function
}

COORDINATION: Sequential execution (default) or Promise.all (parallel)
```

### MCP Server Communication

**DOCUMENTED:** Complex integration protocols
**ACTUAL:** Direct function calls through assigned servers

```
AGENT → MCP ASSIGNMENT FLOW:
1. AgentRegistry.getAgentModelConfig(agentType)
2. MCPServerAssigner.assign(config)
3. Capability-based server selection
4. Direct MCP tool invocation

MCP MESSAGE FORMAT: Standard MCP protocol
{
  method: "tool_name",
  params: { ... },
  id: request_id
}

RESPONSE: Standard MCP response format
{
  result: { ... } | null,
  error: { code, message } | null,
  id: request_id
}
```

## Detailed Protocol Specifications

### 1. Event Propagation Protocol

**Event Types:**
- `queen:initialized` - Queen startup complete
- `task:created` - New task registered
- `task:completed` - Task execution finished
- `task:failed` - Task execution error
- `step:completed` - Individual step finished
- `health:critical_issues` - System health alert

**Event Payload Structure:**
```typescript
interface BaseEvent {
  timestamp: number;
  source: string;
  type: string;
  data: any;
}

interface TaskEvent extends BaseEvent {
  taskId: string;
  workflowId?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}
```

### 2. Configuration Communication

**Agent Model Assignment Protocol:**
```javascript
// AgentRegistry.js - Actual implementation
getAgentModelConfig(agentType) {
  // 1. Load base configuration
  let config = this.loader.load(agentType);

  // 2. Apply defaults if missing
  if (!config) {
    config = this.loader.getDefaultConfig();
    config.capabilities = this.capabilityMapper.getCapabilities(agentType);
  }

  // 3. Select AI model
  const modelInfo = this.modelSelector.select(config);
  config.primaryModel = modelInfo.primaryModel;

  // 4. Assign MCP servers
  config.mcpServers = this.mcpAssigner.assign(config);

  return config;
}
```

**MCP Server Assignment Rules:**
```javascript
// MCPServerAssigner.js - Capability mapping
const capabilityMCPMap = {
  'browser_automation': ['playwright', 'puppeteer'],
  'research': ['deepwiki', 'firecrawl', 'ref', 'context7'],
  'coding': ['github', 'filesystem'],
  'quality_analysis': ['eva', 'github'],
  'orchestration': ['sequential-thinking', 'plane']
};
```

### 3. Quality Gate Communication

**Theater Detection Protocol:**
```typescript
// TheaterScannerFSM.ts
interface TheaterScanResult {
  overallScore: number;          // 0-100 scale
  theaterPatterns: TheaterPattern[];
  summary: TheaterSummary;
  recommendations: string[];
  autoFixable: TheaterPattern[];
}

// Alert generation when score < 60
interface MonitorAlert {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'THEATER_THRESHOLD' | 'THEATER_CRITICAL';
  message: string;
  data: { score: number; threshold: number };
}
```

## Error Handling and Recovery

### 1. Task Failure Protocol

**Workflow Level:**
```typescript
try {
  await this.executeStepsSequential(workflow, input, options);
  workflow.state = WorkflowState.COMPLETED;
} catch (error) {
  await this.transitionHub.transitionWorkflow(workflowId, WorkflowEvent.FAIL);
  workflow.state = WorkflowState.FAILED;
  this.emit('workflow:failed', { workflowId, error: error.message });
  throw error;
}
```

**Step Level:**
```typescript
// Retry logic in step execution
if (options.retryPolicy) {
  for (let attempt = 0; attempt < options.retryPolicy.maxRetries; attempt++) {
    try {
      return await this.executeStep(stepDefinition);
    } catch (error) {
      if (attempt === options.retryPolicy.maxRetries - 1) throw error;
      await this.delay(options.retryPolicy.retryDelay);
    }
  }
}
```

### 2. Communication Failure Recovery

**Event Delivery Failure:**
```typescript
// From QueenOrchestrator.ts
this.protocol.on('message:failed', ({ message, target }) => {
  console.error(`Message delivery failed to ${target}`);
});

this.protocol.on('princess:unresponsive', ({ princess }) => {
  console.warn(`Princess ${princess} unresponsive`);
  this.princessManager.healPrincess(princess);
});
```

**Circuit Breaker Pattern:**
```typescript
// Router events for degraded services
this.router.on('circuit:open', ({ princess }) => {
  console.warn(`Circuit breaker opened for ${princess}`);
});
```

## Security Communication Patterns

### 1. MCP Access Control

**Filesystem Security:**
```json
// config/codex.json
{
  "allowlist": ["src/**", "lib/**", "tests/**"],
  "denylist": [".claude/**", ".github/**", "node_modules/**"]
}
```

**Server Assignment Security:**
```javascript
// Only specific agents get filesystem access
if (config.capabilities.includes('coding') || config.capabilities.includes('file_operations')) {
  servers.add('filesystem');
}
```

### 2. Budget Control Communication

**Budget Enforcement:**
```json
{
  "budgets": {
    "max_loc": 25,      // Maximum lines of code per operation
    "max_files": 2      // Maximum files per operation
  }
}
```

## Performance Characteristics

### 1. Latency Patterns

**Synchronous Operations:**
- Event emission: ~1ms (immediate)
- Direct method calls: ~1-5ms (CPU bound)
- Configuration loading: ~10-50ms (file I/O)

**Asynchronous Operations:**
- MCP server calls: ~100-500ms (network bound)
- File system operations: ~50-200ms (disk I/O)
- AI model calls: ~1000-5000ms (API bound)

### 2. Throughput Limitations

**Bottlenecks Identified:**
1. **Single-threaded event loop** - JavaScript limitation
2. **Sequential step execution** - Default workflow mode
3. **File-based configuration** - No caching layer
4. **MCP server latency** - External dependencies

## Message Format Standards

### 1. Task Messages
```typescript
interface SwarmTask {
  id: string;                    // task_timestamp_random
  type: string;                  // inferred from description
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiredDomains: string[];     // ['development', 'quality']
  context: any;                  // raw input
  status: 'pending' | 'assigned' | 'executing' | 'completed' | 'failed';
  assignedPrincesses: string[];  // princess IDs
  results?: any;                 // execution output
  evidencePaths?: string[];      // file artifacts
}
```

### 2. Agent Configuration Messages
```javascript
{
  agentType: "frontend-developer",
  primaryModel: "gpt-5",
  fallbackModel: "gpt-4",
  capabilities: ["browser_automation", "visual_validation"],
  mcpServers: ["claude-flow", "memory", "playwright", "figma"],
  sequentialThinking: false,
  reasoningComplexity: "medium"
}
```

### 3. Quality Gate Messages
```typescript
interface ValidationReport {
  workflowId: string;
  validationStatus: 'passed' | 'failed' | 'warning';
  checks: ValidationCheck[];
  overallScore: number;
  recommendations: string[];
}
```

## Integration Points

### 1. External System Integration

**GitHub Integration:**
```
Claude Code → MCP github server → GitHub API
Message: Standard GitHub API calls (REST/GraphQL)
Auth: Token-based via environment variables
```

**Browser Automation:**
```
Agent → MCP playwright server → Browser instance
Message: Playwright commands (JSON over WebSocket)
Session: Persistent browser contexts
```

### 2. Cross-Component Integration

**Queen ↔ Princess:**
```
Direct method calls + event forwarding
No network protocol - in-process communication
Error propagation through exceptions + events
```

**Workflow ↔ Steps:**
```
FSM state transitions + direct execution
State persistence through TransitionHub
Progress tracking through events
```

## Conclusion

The SPEK communication patterns are simpler and more direct than documented:

1. **Event-driven facades** rather than complex message protocols
2. **Direct method calls** rather than network communication
3. **File-based configuration** rather than distributed config management
4. **MCP tool integration** rather than custom protocols
5. **FSM state management** rather than message-passing coordination

This architecture is more maintainable and performant than the documented theoretical models, but the simplification should be reflected in the documentation.