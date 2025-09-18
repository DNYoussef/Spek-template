# Desktop Automation Integration with SPEK

## Overview

The Desktop Automation Integration connects SPEK's agent system to Bytebot's desktop automation capabilities through a comprehensive MCP server bridge. This enables AI agents to interact with desktop applications, perform UI testing, and automate complex workflows.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ SPEK Agents     │    │ MCP Server       │    │ Bytebot         │
│                 │    │ Bridge           │    │ Containers      │
│ • desktop-      │◄──►│                  │◄──►│                 │
│   automator     │    │ • Tool routing   │    │ • Desktop UI    │
│ • ui-tester     │    │ • Security       │    │ • Agent API     │
│ • qa-specialist │    │ • Evidence       │    │ • Automation    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Evidence         │
                       │ Collection       │
                       │ .claude/         │
                       │ .artifacts/      │
                       │ desktop/         │
                       └──────────────────┘
```

## Components

### 1. MCP Server Bridge (`src/flow/servers/desktop-automation-mcp.js`)

**Features:**
- Full MCP protocol implementation for desktop tools
- Bridge communication with Bytebot containers
- Comprehensive error handling and validation
- Evidence collection for quality gates integration
- Security validation and audit logging

**Available Tools:**
- `desktop_screenshot` - Capture desktop/application screenshots
- `desktop_click` - Click at specified coordinates
- `desktop_type` - Type text at cursor position
- `desktop_move_mouse` - Move mouse to coordinates
- `desktop_scroll` - Scroll in specified direction
- `desktop_app_launch` - Launch applications
- `desktop_file_operations` - Perform file operations
- `desktop_health_check` - System health monitoring

### 2. Desktop Automation Service (`src/services/desktop-agent/desktop-automation-service.js`)

**Features:**
- Bytebot container lifecycle management
- Health monitoring and connection management
- Operation queue management for high-throughput scenarios
- Security validation and sandbox isolation
- Integration with SPEK quality gate system

### 3. Agent Integration (`src/flow/config/agent-model-registry.js`)

**New Agent Types:**
- **desktop-automator** (GPT-5 Codex) - Comprehensive desktop automation
- **ui-tester** (GPT-5 Codex) - UI testing with screenshot validation
- **app-integration-tester** (GPT-5 Codex) - Application integration testing
- **desktop-qa-specialist** (Claude Opus 4.1) - Quality assurance with evidence collection
- **desktop-workflow-automator** (GPT-5 Codex) - Complex workflow automation

## Configuration

### Environment Variables

```bash
# Bytebot Connection
BYTEBOT_DESKTOP_URL=http://localhost:9990
BYTEBOT_AGENT_URL=http://localhost:9991

# MCP Server
MCP_SERVER_PORT=9995

# Evidence Collection
EVIDENCE_DIR=.claude/.artifacts/desktop

# Security
ALLOWED_APPS=*  # Or comma-separated list
SECURITY_MODE=strict
AUDIT_TRAIL=true
MAX_COORDINATE_VALUE=4096
```

### MCP Configuration (`src/flow/config/mcp-multi-platform.json`)

The desktop automation server is automatically configured in the MCP multi-platform configuration with:
- Server command and arguments
- Environment variable mapping
- Security configuration
- Agent platform mappings

## Setup Instructions

### 1. Start Bytebot Containers

```bash
# Option A: Docker Compose (if available)
docker-compose up bytebot-desktop bytebot-agent

# Option B: Manual Docker containers
docker run -d -p 9990:9990 --name bytebot-desktop bytebot/desktop
docker run -d -p 9991:9991 --name bytebot-agent bytebot/agent
```

### 2. Install Dependencies

```bash
cd src/flow/servers
npm install
```

### 3. Add MCP Server to Claude Code

```bash
claude mcp add desktop-automation node src/flow/servers/desktop-automation-mcp.js
```

### 4. Test the Integration

```bash
# Run comprehensive tests
node src/flow/servers/test-desktop-mcp.js

# Run health check
node src/flow/servers/health-check.js

# Test specific functionality
npm run test
```

## Usage Examples

### Basic Desktop Automation

```javascript
// Spawn desktop automation agent
const { agentSpawner } = require('./src/flow/core/agent-spawner');

const agent = await agentSpawner.spawnAgent(
  'desktop-automator',
  'Take screenshot and click on the "Save" button'
);

// Agent automatically gets:
// - GPT-5 Codex model for visual feedback
// - desktop-automation MCP server
// - Evidence collection capabilities
```

### UI Testing Workflow

```javascript
// Spawn UI testing agent
const tester = await agentSpawner.spawnAgent(
  'ui-tester',
  'Test the login workflow in the application'
);

// Agent has access to:
// - Desktop automation tools
// - Browser automation (playwright)
// - Evidence collection
// - Quality validation
```

### Quality Assurance

```javascript
// Spawn QA specialist
const qaAgent = await agentSpawner.spawnAgent(
  'desktop-qa-specialist',
  'Validate the application meets accessibility standards'
);

// Agent uses:
// - Claude Opus 4.1 for superior analysis
// - Desktop automation for testing
// - Evidence collection for compliance
// - Quality gate validation
```

## Security Features

### Coordinate Bounds Validation
- All mouse coordinates validated against configurable bounds
- Default maximum: 4096x4096 pixels
- Prevents automation outside safe areas

### Application Allowlists
- Configurable allowlist of applications
- Wildcard (`*`) or specific application names
- Blocks automation of unauthorized applications

### Audit Logging
- Comprehensive audit trail of all operations
- Timestamped entries with session tracking
- Evidence collection for compliance

### Sandbox Isolation
- Operations run in controlled environment
- Resource limits and timeouts
- Graceful error handling and recovery

## Evidence Collection

All desktop automation operations generate evidence stored in `.claude/.artifacts/desktop/`:

- **Screenshots** - Timestamped PNG files
- **Operation Logs** - JSONL format with full operation details
- **Audit Trail** - Security and compliance logging
- **Error Logs** - Detailed error tracking and debugging
- **Health Reports** - System health and performance metrics

## Quality Gates Integration

The desktop automation system integrates with SPEK's quality gate framework:

- **Operation Success Rate** - Percentage of successful operations
- **Response Time Metrics** - Performance tracking
- **Security Compliance** - Audit trail validation
- **Evidence Completeness** - Screenshot and log verification
- **Error Rate Monitoring** - Failure pattern analysis

## Troubleshooting

### Common Issues

1. **Bytebot Connection Failed**
   ```bash
   # Check if containers are running
   docker ps | grep bytebot

   # Check connectivity
   curl http://localhost:9990/health
   curl http://localhost:9991/health
   ```

2. **MCP Server Registration Failed**
   ```bash
   # Verify file exists
   ls -la src/flow/servers/desktop-automation-mcp.js

   # Check dependencies
   cd src/flow/servers && npm install

   # Test server directly
   node src/flow/servers/desktop-automation-mcp.js
   ```

3. **Permission Errors**
   ```bash
   # Check evidence directory permissions
   ls -la .claude/.artifacts/

   # Create directory if needed
   mkdir -p .claude/.artifacts/desktop
   ```

### Health Check Commands

```bash
# Comprehensive health check
node src/flow/servers/health-check.js

# Test MCP connectivity
node src/flow/servers/test-desktop-mcp.js

# Manual connection test
curl -X POST http://localhost:9990/screenshot \
  -H "Content-Type: application/json" \
  -d '{"area": "full", "quality": "medium"}'
```

## Performance Considerations

### Optimization Strategies

1. **Screenshot Compression** - Configurable quality levels
2. **Operation Queuing** - Batch operations for efficiency
3. **Connection Pooling** - Reuse HTTP connections
4. **Evidence Cleanup** - Automatic cleanup of old evidence
5. **Health Monitoring** - Proactive issue detection

### Scaling Recommendations

- **Horizontal Scaling** - Multiple Bytebot container instances
- **Load Balancing** - Distribute operations across containers
- **Caching** - Cache frequently accessed screenshots
- **Async Processing** - Queue operations for high throughput

## Integration with SPEK Workflow

### SPARC Methodology Support

The desktop automation integration supports all SPARC phases:

- **Specification** - Define UI testing requirements
- **Planning** - Plan automation workflows
- **Architecture** - Design test architectures
- **Refinement** - Iterative UI improvement
- **Completion** - Evidence-based validation

### 3-Loop System Integration

- **Loop 1 (Planning)** - Requirements analysis for UI testing
- **Loop 2 (Development)** - Automated UI testing during development
- **Loop 3 (Quality)** - Comprehensive UI validation and compliance

## API Reference

See the MCP server implementation for complete API documentation:
- Tool schemas and parameters
- Response formats and error codes
- Security validation rules
- Evidence collection formats

## Contributing

When extending the desktop automation integration:

1. Follow SPEK patterns from existing implementations
2. Maintain security validation for all new operations
3. Include comprehensive evidence collection
4. Add appropriate tests and health checks
5. Update agent model registry for new agent types

## License

This integration is part of the SPEK Enhanced Development Platform and follows the project's MIT license.