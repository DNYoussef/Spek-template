# Information Flow Diagram - SPEK Enhanced Development Platform

## Executive Summary

Based on reverse engineering analysis of the codebase, the SPEK Enhanced Development Platform operates through a complex multi-layered architecture with actual information flows that differ significantly from the documented theoretical patterns. This analysis reveals the true data pathways and component interactions.

## Core Information Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLAUDE CODE CLI                          │
│  Entry Point: Primary control interface for all operations     │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PACKAGE.JSON SCRIPTS                        │
│  • test: jest                                                   │
│  • lint: eslint src/ --ext .js,.ts,.tsx                       │
│  • typecheck: tsc --noEmit                                     │
│  • dspy:optimize-all-agents: ./scripts/deploy-dspy-optimization│
│  • validate: Combined test+lint+typecheck                      │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CORE ENTRY POINTS                           │
│                                                                 │
│  1. SwarmQueen.ts → QueenOrchestrator.ts (Facade Pattern)      │
│  2. WorkflowFacade.ts → WorkflowTransitionHub.ts (FSM Core)    │
│  3. TheaterScannerFSM.ts → MonitoringHub (Theater Detection)   │
│  4. AgentRegistry.js → MCPServerAssigner.js (Agent Config)     │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ACTUAL DATA FLOW LAYERS                      │
│                                                                 │
│  Layer 1: Configuration Management                             │
│  ├── config/codex.json (Budget & Path Controls)                │
│  ├── config/github-project.json (GitHub Integration)           │
│  └── MCP Server Assignments (15+ servers)                      │
│                                                                 │
│  Layer 2: Agent Coordination                                   │
│  ├── Queen → Princess Communication (A2ACommunicationEngine)   │
│  ├── Princess → Drone Task Distribution                        │
│  └── FSM State Management (WorkflowTransitionHub)              │
│                                                                 │
│  Layer 3: Process Execution                                    │
│  ├── Step Execution (StepExecutor)                             │
│  ├── Monitoring (ProcessMonitor)                               │
│  └── Validation (WorkflowValidator)                            │
│                                                                 │
│  Layer 4: Quality Gates                                        │
│  ├── Theater Detection (TheaterScannerFSM)                     │
│  ├── NASA Rule 10 Compliance                                   │
│  └── DSPy Optimization Framework                               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OUTPUT DESTINATIONS                         │
│                                                                 │
│  • .claude/.artifacts/ (Reports & Analysis)                    │
│  • dist/ (Compiled TypeScript)                                 │
│  • coverage/ (Test Coverage Reports)                           │
│  • GitHub Projects (via MCP Integration)                       │
│  • Console Logs (Event-driven monitoring)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Component Flow Analysis

### 1. Entry Point Flow (Claude Code → Scripts)

**ACTUAL PATH:**
```
Claude Code CLI → package.json scripts → Node.js execution
```

**KEY FINDING:** No direct command router or dispatcher found in source code. All operations route through npm scripts, indicating a script-based rather than API-based architecture.

### 2. Agent Hierarchy Flow (Queen-Princess-Drone)

**DOCUMENTED:** Complex hierarchical communication with byzantine consensus
**ACTUAL:** Simplified facade pattern with event forwarding

```typescript
// SwarmQueen.ts (Actual Implementation)
export class SwarmQueen extends EventEmitter {
  private orchestrator: QueenOrchestrator;  // Delegation target

  async executeTask(description, context, options) {
    return await this.orchestrator.executeTask(description, context, options);
  }
}

// QueenOrchestrator.ts (Real Implementation)
export class QueenOrchestrator extends EventEmitter {
  private princessManager: PrincessManager;
  private consensusCoordinator: ConsensusCoordinator;
  // Actual business logic here
}
```

**KEY FINDING:** The Queen is a facade that immediately delegates to QueenOrchestrator. True coordination happens in the orchestrator, not the queen interface.

### 3. MCP Server Integration Flow

**DISCOVERED PATTERN:**
```
AgentRegistry.js → MCPServerAssigner.js → Agent Deployment
```

**ACTUAL MCP SERVERS FOUND IN CODE:**
- claude-flow (Universal)
- memory (Universal)
- sequential-thinking (Universal)
- filesystem (Security-controlled)
- github (Repository management)
- playwright (Browser automation)
- figma (Design integration)
- eva (Performance evaluation)

**KEY FINDING:** MCP integration is agent-type specific, not universal. Different agents get different MCP server combinations based on their specialization.

### 4. Workflow Execution Flow

**DOCUMENTED:** Complex workflow engine
**ACTUAL:** FSM-based state management with clear transitions

```typescript
// WorkflowFacade.ts (Actual Pattern)
export class WorkflowFacade extends EventEmitter {
  private transitionHub: WorkflowTransitionHub;
  private stepExecutor: StepExecutor;
  private processMonitor: ProcessMonitor;
  private workflowValidator: WorkflowValidator;

  async executeWorkflow(workflowId, input, options) {
    // FSM-driven execution
    await this.transitionHub.transitionWorkflow(workflowId, WorkflowEvent.INITIALIZE);
    await this.transitionHub.transitionWorkflow(workflowId, WorkflowEvent.START);
    // Execute steps through StepExecutor
    await this.transitionHub.transitionWorkflow(workflowId, WorkflowEvent.COMPLETE);
  }
}
```

**KEY FINDING:** Workflows are FSM-first, not traditional orchestration engine. All state changes go through centralized TransitionHub.

## Critical Information Bottlenecks

### 1. Configuration Bottleneck
**FILE:** `config/codex.json`
**IMPACT:** Controls budget limits (max_loc: 25, max_files: 2) and path access
**RISK:** Single point of failure for all operations

### 2. Agent Assignment Bottleneck
**FILE:** `src/flow/config/agent/MCPServerAssigner.js`
**IMPACT:** Determines which MCP servers each agent can access
**RISK:** Misconfiguration breaks agent capabilities

### 3. Event Propagation Bottleneck
**PATTERN:** All components extend EventEmitter
**IMPACT:** Heavy reliance on event-driven architecture
**RISK:** Event loop blocking can halt entire system

## Message Flow Patterns

### Queen → Princess Communication
```
Queen.executeTask()
  → QueenOrchestrator.executeTask()
  → PrincessManager.getPrincess()
  → Princess.executeTask()
  → A2ACommunicationEngine.routeCommunication()
```

### Princess → Drone Communication
```
Princess.executeTask()
  → StepExecutor.executeStep()
  → ProcessMonitor.startMonitoring()
  → WorkflowValidator.validateWorkflow()
```

### Quality Gate Flow
```
TheaterScannerFSM.performScan()
  → MonitoringHub.scanDirectory()
  → PatternDetectors.detectPatterns()
  → DSPy Enhancement (if available)
  → QualityGates.checkThresholds()
```

## Data Persistence Patterns

### 1. Artifacts Storage
**PATH:** `.claude/.artifacts/`
**CONTENT:** All analysis results, reports, and quality measurements
**ACCESS:** Read/Write through filesystem MCP tools

### 2. Configuration Storage
**PATH:** `config/`
**CONTENT:** Agent assignments, compliance rules, integration settings
**ACCESS:** Direct file reads (no abstraction layer)

### 3. Runtime State
**STORAGE:** In-memory event emitters and Maps
**PERSISTENCE:** None found - all state is ephemeral
**RISK:** No state recovery after failures

## External Integration Points

### 1. GitHub Integration
**CONFIG:** `config/github-project.json`
**MCP:** `github` and `github-project-manager`
**FLOW:** Direct API calls through MCP servers

### 2. DSPy Integration
**ENTRY:** `src/dspy-integration/`
**PATTERN:** Optional enhancement layer
**STATUS:** Partially implemented, not core dependency

### 3. Browser Automation
**MCP:** `playwright` and `puppeteer`
**AGENTS:** `frontend-developer`, `ui-designer`, `mobile-dev`
**FLOW:** Agent-specific MCP assignment

## Conclusion

The actual information flow is significantly simpler than documented:

1. **No Complex Routing:** Direct script execution through npm
2. **Facade Pattern Dominates:** Most "god objects" are actually simple facades
3. **FSM-First Architecture:** State machines control all workflows
4. **Event-Driven:** Heavy reliance on EventEmitter for component communication
5. **MCP Specialization:** Agents get specialized MCP server combinations
6. **No Central Database:** All persistence through files and artifacts

The system is more of a "script orchestrator with quality gates" than a complex multi-agent system as documented.