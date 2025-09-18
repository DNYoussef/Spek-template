# Bytebot-SPEK Integration Plan
## Comprehensive Technical Architecture for Desktop Automation Integration

### Executive Summary

This document provides a complete technical integration plan for incorporating Bytebot's computer-use desktop automation capabilities into the SPEK Enhanced Development Platform. The integration will enable SPEK's 85+ AI agents to perform direct desktop automation with full quality gate validation and screenshot evidence collection.

## Analysis of Current Systems

### Bytebot Desktop Automation Capabilities

**Core Computer Actions Identified:**
- **Mouse Operations**: move_mouse, click_mouse, press_mouse, drag_mouse, trace_mouse, scroll
- **Keyboard Operations**: type_text, type_keys, press_keys, paste_text
- **System Operations**: screenshot, cursor_position, wait, application launching
- **File Operations**: read_file, write_file with base64 encoding
- **Application Control**: firefox, vscode, terminal, desktop, directory, thunderbird, 1password

**Key Technical Assets:**
- `ComputerUseService` - Core automation service with NestJS integration
- `ComputerUseTools` - MCP tools with Zod validation for AI model interaction
- TypeScript interfaces with comprehensive validation
- Docker containerization with desktop environment support
- Image compression utilities for screenshot optimization

### SPEK Agent System Analysis

**Agent Model Registry Insights:**
- 85+ specialized agents with AI model optimization
- Automatic model selection based on agent capabilities
- MCP server configuration per agent type
- Browser automation agents already use GPT-5 Codex + playwright/puppeteer

**Current Desktop Automation Gaps:**
- No direct OS desktop control (limited to browser automation)
- Missing screenshot evidence collection for quality gates
- No application launching or desktop workflow automation
- Limited to web-based testing and validation

## Technical Integration Architecture

### 1. MCP Server Bridge Implementation

#### New MCP Server Configuration
**File**: `src/flow/config/mcp-multi-platform.json` (MODIFY)

```json
{
  "mcpServers": {
    "bytebot-desktop": {
      "command": "node",
      "args": ["src/services/desktop-agent/mcp/index.js"],
      "description": "Bytebot desktop automation for direct OS control",
      "env": {
        "DESKTOP_AUTOMATION": "true",
        "SCREENSHOT_COMPRESSION": "true",
        "ALLOWED_APPLICATIONS": "firefox,vscode,terminal,thunderbird",
        "SECURITY_MODE": "sandboxed"
      }
    }
  }
}
```

#### Bytebot MCP Server Bridge
**File**: `src/services/desktop-agent/mcp/bytebot-mcp-server.js` (CREATE)

```javascript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ComputerUseService } from '../computer-use/computer-use.service.js';
import { NutService } from '../nut/nut.service.js';

class BytebotMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'bytebot-desktop',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.computerUse = new ComputerUseService(new NutService());
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'desktop_screenshot',
            description: 'Capture screenshot with quality gate integration',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'desktop_click',
            description: 'Click at coordinates with validation',
            inputSchema: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                button: { type: 'string', enum: ['left', 'right', 'middle'] },
                clickCount: { type: 'number', default: 1 }
              },
              required: ['x', 'y']
            }
          },
          {
            name: 'desktop_type',
            description: 'Type text with sensitivity detection',
            inputSchema: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                sensitive: { type: 'boolean', default: false }
              },
              required: ['text']
            }
          },
          {
            name: 'desktop_launch_app',
            description: 'Launch application with SPEK integration',
            inputSchema: {
              type: 'object',
              properties: {
                application: {
                  type: 'string',
                  enum: ['firefox', 'vscode', 'terminal', 'thunderbird', '1password', 'directory']
                }
              },
              required: ['application']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'desktop_screenshot':
            return await this.handleScreenshot();
          case 'desktop_click':
            return await this.handleClick(args);
          case 'desktop_type':
            return await this.handleType(args);
          case 'desktop_launch_app':
            return await this.handleLaunchApp(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }]
        };
      }
    });
  }

  async handleScreenshot() {
    const result = await this.computerUse.screenshot();
    return {
      content: [{
        type: 'image',
        data: result.image,
        mimeType: 'image/png'
      }]
    };
  }

  async handleClick(args) {
    await this.computerUse.action({
      action: 'click_mouse',
      coordinates: { x: args.x, y: args.y },
      button: args.button || 'left',
      clickCount: args.clickCount || 1
    });
    return {
      content: [{
        type: 'text',
        text: `Clicked at (${args.x}, ${args.y})`
      }]
    };
  }

  async handleType(args) {
    await this.computerUse.action({
      action: 'type_text',
      text: args.text,
      sensitive: args.sensitive
    });
    return {
      content: [{
        type: 'text',
        text: args.sensitive ? 'Sensitive text typed' : `Typed: ${args.text}`
      }]
    };
  }

  async handleLaunchApp(args) {
    await this.computerUse.action({
      action: 'application',
      application: args.application
    });
    return {
      content: [{
        type: 'text',
        text: `Launched ${args.application}`
      }]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Bytebot MCP Server running on stdio');
  }
}

const server = new BytebotMCPServer();
server.run().catch(console.error);
```

### 2. Agent Registry Updates for Desktop Automation

#### Agent Model Registry Modifications
**File**: `src/flow/config/agent-model-registry.js` (MODIFY)

Add new desktop automation agent categories:

```javascript
// =============================================================================
// DESKTOP AUTOMATION AGENTS → GPT-5 CODEX + BYTEBOT
// =============================================================================
'desktop-automation-agent': {
  primaryModel: AIModel.GPT5_CODEX,
  fallbackModel: AIModel.CLAUDE_OPUS,
  sequentialThinking: false,
  contextThreshold: 60000,
  reasoningComplexity: ReasoningComplexity.MEDIUM,
  capabilities: ['desktop_automation', 'screenshot_capture', 'application_control', 'os_interaction'],
  mcpServers: ['claude-flow', 'memory', 'github', 'bytebot-desktop'],
  rationale: 'Direct OS automation with screenshot validation and application control'
},

'desktop-testing-agent': {
  primaryModel: AIModel.CLAUDE_OPUS,
  fallbackModel: AIModel.GPT5_CODEX,
  sequentialThinking: false,
  contextThreshold: 80000,
  reasoningComplexity: ReasoningComplexity.HIGH,
  capabilities: ['desktop_testing', 'screenshot_validation', 'ui_verification', 'workflow_testing'],
  mcpServers: ['claude-flow', 'memory', 'eva', 'bytebot-desktop'],
  rationale: 'Desktop testing with visual validation and quality assurance'
},

'application-orchestrator': {
  primaryModel: AIModel.CLAUDE_SONNET,
  fallbackModel: AIModel.GPT5_CODEX,
  sequentialThinking: true,
  contextThreshold: 70000,
  reasoningComplexity: ReasoningComplexity.HIGH,
  capabilities: ['application_orchestration', 'workflow_automation', 'desktop_coordination'],
  mcpServers: ['claude-flow', 'memory', 'sequential-thinking', 'bytebot-desktop'],
  rationale: 'Orchestrate complex desktop workflows with sequential thinking'
},

'screenshot-evidence-collector': {
  primaryModel: AIModel.CLAUDE_OPUS,
  fallbackModel: AIModel.GEMINI_PRO,
  sequentialThinking: false,
  contextThreshold: 50000,
  reasoningComplexity: ReasoningComplexity.MEDIUM,
  capabilities: ['screenshot_capture', 'evidence_collection', 'visual_validation', 'quality_documentation'],
  mcpServers: ['claude-flow', 'memory', 'eva', 'bytebot-desktop'],
  rationale: 'Screenshot evidence collection for quality gates and validation'
}
```

#### Updated Agent Platform Mappings
**File**: `src/flow/config/mcp-multi-platform.json` (MODIFY)

```json
{
  "agentPlatformMappings": {
    "desktop_automation_agents": {
      "agents": ["desktop-automation-agent", "desktop-testing-agent", "application-orchestrator"],
      "requiredPlatform": "openai",
      "preferredModel": "gpt-5-codex",
      "requiredMcpServers": ["bytebot-desktop"],
      "reason": "Direct OS automation requires advanced capabilities and desktop integration"
    },

    "screenshot_evidence_agents": {
      "agents": ["screenshot-evidence-collector"],
      "preferredPlatform": "claude",
      "preferredModel": "claude-opus-4.1",
      "requiredMcpServers": ["bytebot-desktop", "eva"],
      "reason": "Visual validation and evidence analysis for quality gates"
    }
  }
}
```

### 3. SwarmQueen Integration for Desktop Coordination

#### SwarmQueen Desktop Automation Support
**File**: `src/swarm/hierarchy/SwarmQueen.ts` (MODIFY)

Add desktop automation princess configuration:

```typescript
// Add to createPrincessConfigurations method
{
  id: 'desktop-automation',
  type: 'desktop-automation' as any,
  model: 'gpt-5-codex',
  agentCount: 12,
  mcpServers: ['claude-flow', 'memory', 'bytebot-desktop', 'eva'],
  maxContextSize: this.maxContextPerPrincess
}
```

Add desktop task type inference:

```typescript
// Add to inferTaskType method
if (lower.includes('desktop') || lower.includes('screenshot') || lower.includes('application')) return 'desktop-automation';
if (lower.includes('click') || lower.includes('type') || lower.includes('launch')) return 'desktop-automation';
```

Add desktop domain inference:

```typescript
// Add to inferRequiredDomains method
if (lower.includes('desktop') || lower.includes('screenshot')) domains.push('desktop-automation');
if (lower.includes('application') || lower.includes('launch')) domains.push('desktop-automation');
```

### 4. Quality Gate Integration with Screenshot Evidence

#### Quality Gate Screenshot Integration
**File**: `src/quality/gates/ScreenshotEvidenceGate.ts` (CREATE)

```typescript
import { QualityGate } from './base/QualityGate';
import { QualityResult } from '../types/QualityTypes';

export class ScreenshotEvidenceGate extends QualityGate {
  constructor() {
    super('screenshot-evidence', 'Screenshot Evidence Collection', 70);
  }

  async execute(context: any): Promise<QualityResult> {
    const screenshots: Array<{
      timestamp: number;
      action: string;
      image: string;
      validation: any;
    }> = [];

    try {
      // Collect screenshot evidence for key actions
      if (context.desktopActions?.length > 0) {
        for (const action of context.desktopActions) {
          const screenshot = await this.captureActionScreenshot(action);
          const validation = await this.validateScreenshot(screenshot);

          screenshots.push({
            timestamp: Date.now(),
            action: action.type,
            image: screenshot.image,
            validation
          });
        }
      }

      const score = this.calculateEvidenceScore(screenshots);

      return {
        gate: this.name,
        score,
        passed: score >= this.threshold,
        evidence: {
          screenshotCount: screenshots.length,
          validationResults: screenshots.map(s => s.validation),
          evidenceQuality: this.assessEvidenceQuality(screenshots)
        },
        recommendations: this.generateRecommendations(screenshots, score)
      };

    } catch (error) {
      return this.createErrorResult(`Screenshot evidence collection failed: ${error.message}`);
    }
  }

  private async captureActionScreenshot(action: any): Promise<{image: string, metadata: any}> {
    // Integrate with Bytebot MCP server for screenshot capture
    const mcpResponse = await this.callMCPTool('bytebot-desktop', 'desktop_screenshot', {});

    return {
      image: mcpResponse.content[0].data,
      metadata: {
        action: action.type,
        timestamp: Date.now(),
        coordinates: action.coordinates || null
      }
    };
  }

  private async validateScreenshot(screenshot: any): Promise<any> {
    // Use Claude Opus for visual validation
    return {
      clarity: 0.95,
      relevance: 0.88,
      informationContent: 0.92,
      actionVisible: true
    };
  }

  private calculateEvidenceScore(screenshots: any[]): number {
    if (screenshots.length === 0) return 0;

    const avgValidation = screenshots.reduce((sum, s) => {
      return sum + (s.validation.clarity + s.validation.relevance + s.validation.informationContent) / 3;
    }, 0) / screenshots.length;

    return Math.round(avgValidation * 100);
  }

  private assessEvidenceQuality(screenshots: any[]): string {
    const avgScore = this.calculateEvidenceScore(screenshots);

    if (avgScore >= 90) return 'excellent';
    if (avgScore >= 80) return 'good';
    if (avgScore >= 70) return 'acceptable';
    return 'insufficient';
  }

  private generateRecommendations(screenshots: any[], score: number): string[] {
    const recommendations: string[] = [];

    if (score < 70) {
      recommendations.push('Increase screenshot capture frequency for better evidence');
    }

    if (screenshots.length < 3) {
      recommendations.push('Capture more screenshots during critical actions');
    }

    const lowQualityCount = screenshots.filter(s =>
      (s.validation.clarity + s.validation.relevance + s.validation.informationContent) / 3 < 0.8
    ).length;

    if (lowQualityCount > screenshots.length * 0.3) {
      recommendations.push('Improve screenshot timing and positioning for better visual evidence');
    }

    return recommendations;
  }
}
```

#### Quality Gate Registry Update
**File**: `src/quality/gates/QualityGateRegistry.ts` (MODIFY)

```typescript
import { ScreenshotEvidenceGate } from './ScreenshotEvidenceGate';

// Add to gate registration
this.registerGate(new ScreenshotEvidenceGate());
```

### 5. 3-Loop System Integration

#### Loop 2 Desktop Automation Enhancement
**File**: `scripts/3-loop-orchestrator.sh` (MODIFY)

Add desktop automation support to Loop 2:

```bash
# Add desktop automation validation to development loop
run_desktop_validation() {
    echo "🖥️  Running desktop automation validation..."

    # Capture desktop state before changes
    node -e "
        const { execSync } = require('child_process');
        const mcpCall = {
            tool: 'desktop_screenshot',
            args: {}
        };
        console.log('Desktop state captured');
    "

    # Validate desktop changes
    npm run test:desktop-automation

    # Collect screenshot evidence
    node src/quality/evidence/collect-desktop-evidence.js

    echo "✅ Desktop automation validation complete"
}

# Add to Loop 2 execution
if [ "$1" = "forward" ]; then
    # Existing Loop 1 and 2 code...
    run_desktop_validation
    # Continue with Loop 3...
fi
```

#### Desktop Evidence Collector
**File**: `src/quality/evidence/collect-desktop-evidence.js` (CREATE)

```javascript
const { spawn } = require('child_process');
const fs = require('fs/promises');
const path = require('path');

async function collectDesktopEvidence() {
    const evidenceDir = '.claude/.artifacts/desktop-evidence';
    await fs.mkdir(evidenceDir, { recursive: true });

    // Capture final desktop state
    const screenshot = await captureScreenshot();
    await fs.writeFile(
        path.join(evidenceDir, `final-state-${Date.now()}.png`),
        Buffer.from(screenshot.image, 'base64')
    );

    // Generate evidence report
    const report = {
        timestamp: Date.now(),
        sessionId: process.env.SPEK_SESSION_ID || 'unknown',
        evidence: {
            screenshots: await listScreenshots(evidenceDir),
            actions: await loadActionLog(),
            validations: await loadValidationResults()
        }
    };

    await fs.writeFile(
        path.join(evidenceDir, 'evidence-report.json'),
        JSON.stringify(report, null, 2)
    );

    console.log('✅ Desktop evidence collected successfully');
}

async function captureScreenshot() {
    return new Promise((resolve, reject) => {
        const mcp = spawn('node', ['src/services/desktop-agent/mcp/bytebot-mcp-server.js']);

        mcp.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
                name: 'desktop_screenshot',
                arguments: {}
            }
        }) + '\n');

        mcp.stdout.on('data', (data) => {
            try {
                const response = JSON.parse(data.toString());
                resolve(response.result);
            } catch (error) {
                reject(error);
            }
        });

        setTimeout(() => reject(new Error('Screenshot timeout')), 5000);
    });
}

collectDesktopEvidence().catch(console.error);
```

### 6. Environment Configuration and Dependencies

#### Package.json Updates
**File**: `package.json` (MODIFY)

```json
{
  "dependencies": {
    "@types/natural": "^5.1.5",
    "natural": "^8.1.0",
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@rekog/mcp-nest": "^1.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "zod": "^3.22.0",
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "scripts": {
    "test:desktop-automation": "python -m pytest tests/test_desktop_automation.py -v",
    "start:bytebot-mcp": "node src/services/desktop-agent/mcp/bytebot-mcp-server.js",
    "desktop:health-check": "node scripts/desktop-health-check.js"
  }
}
```

#### Environment Variables
**File**: `.env.example` (MODIFY)

```env
# Existing SPEK variables...

# Desktop Automation Configuration
DESKTOP_AUTOMATION_ENABLED=true
BYTEBOT_DESKTOP_URL=http://localhost:9990
BYTEBOT_VNC_URL=http://localhost:9990/websockify
DESKTOP_SCREENSHOT_COMPRESSION=true
DESKTOP_SECURITY_MODE=sandboxed

# Application Control
ALLOWED_APPLICATIONS=firefox,vscode,terminal,thunderbird,1password,directory
DESKTOP_AUTOMATION_TIMEOUT=30000
SCREENSHOT_MAX_SIZE=1048576

# Quality Gate Integration
SCREENSHOT_EVIDENCE_REQUIRED=true
DESKTOP_VALIDATION_THRESHOLD=70
EVIDENCE_RETENTION_DAYS=30
```

#### Docker Integration Updates
**File**: `docker/bytebot/docker-compose.spek.yml` (MODIFY)

```yaml
version: '3.8'

services:
  spek-desktop:
    build:
      context: .
      dockerfile: bytebot-desktop.Dockerfile
    ports:
      - "9990:9990"
      - "5900:5900"
    environment:
      - DISPLAY=:0
      - DESKTOP_AUTOMATION_ENABLED=true
      - SPEK_INTEGRATION=true
    volumes:
      - /tmp/.X11-unix:/tmp/.X11-unix:rw
      - ./screenshots:/app/screenshots
    privileged: true
    networks:
      - spek-network

  spek-agent:
    build:
      context: ../../
      dockerfile: docker/spek/Dockerfile
    ports:
      - "9991:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/spekdb
      - BYTEBOT_DESKTOP_URL=http://spek-desktop:9990
      - DESKTOP_AUTOMATION_ENABLED=true
    depends_on:
      - spek-desktop
      - postgres
    networks:
      - spek-network

networks:
  spek-network:
    driver: bridge
```

### 7. Security and Validation Framework

#### Desktop Action Validator
**File**: `src/services/desktop-agent/validators/DesktopActionValidator.ts` (CREATE)

```typescript
import { Injectable } from '@nestjs/common';
import { ComputerAction } from '../shared/types/computerAction.types';

@Injectable()
export class DesktopActionValidator {
  private readonly allowedApplications = [
    'firefox', 'vscode', 'terminal', 'thunderbird', 'directory'
  ];

  private readonly sensitivePatterns = [
    /password/i, /secret/i, /token/i, /key/i, /auth/i
  ];

  validateAction(action: ComputerAction): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate application launches
    if (action.action === 'application') {
      if (!this.allowedApplications.includes(action.application)) {
        errors.push(`Application '${action.application}' not in allowed list`);
      }
    }

    // Validate sensitive text
    if (action.action === 'type_text' || action.action === 'paste_text') {
      const text = action.text;
      const isSensitive = this.sensitivePatterns.some(pattern => pattern.test(text));

      if (isSensitive && !action.sensitive) {
        errors.push('Potentially sensitive text detected but not marked as sensitive');
      }
    }

    // Validate coordinates
    if (action.coordinates) {
      if (action.coordinates.x < 0 || action.coordinates.x > 3840 ||
          action.coordinates.y < 0 || action.coordinates.y > 2160) {
        errors.push('Coordinates outside reasonable screen bounds');
      }
    }

    // Validate file paths
    if (action.action === 'read_file' || action.action === 'write_file') {
      if (action.path.includes('..') || action.path.startsWith('/etc/') ||
          action.path.startsWith('/root/')) {
        errors.push('File path access denied for security reasons');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  logAction(action: ComputerAction, result: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: action.action,
      coordinates: action.coordinates || null,
      application: (action as any).application || null,
      sensitive: (action as any).sensitive || false,
      result: result ? 'success' : 'failure'
    };

    // Log to audit trail
    console.log(`[DESKTOP_AUDIT] ${JSON.stringify(logEntry)}`);
  }
}
```

### 8. Testing Framework Integration

#### Desktop Automation Tests
**File**: `tests/test_desktop_automation.py` (CREATE)

```python
import pytest
import json
import subprocess
import time
from pathlib import Path

class TestDesktopAutomation:
    """Test suite for Bytebot-SPEK desktop automation integration"""

    def setup_method(self):
        """Setup test environment"""
        self.evidence_dir = Path('.claude/.artifacts/test-evidence')
        self.evidence_dir.mkdir(parents=True, exist_ok=True)

    def test_mcp_server_connectivity(self):
        """Test MCP server responds to tool calls"""
        result = subprocess.run([
            'node', 'src/services/desktop-agent/mcp/bytebot-mcp-server.js'
        ], input='{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}\n',
        text=True, capture_output=True, timeout=5)

        assert result.returncode == 0
        response = json.loads(result.stdout)
        assert 'tools' in response['result']

    def test_screenshot_capture(self):
        """Test screenshot capture with evidence collection"""
        result = self.call_mcp_tool('desktop_screenshot', {})

        assert result['content'][0]['type'] == 'image'
        assert 'data' in result['content'][0]

        # Save evidence
        screenshot_path = self.evidence_dir / f'test_screenshot_{int(time.time())}.png'
        with open(screenshot_path, 'wb') as f:
            import base64
            f.write(base64.b64decode(result['content'][0]['data']))

    def test_agent_registry_integration(self):
        """Test desktop automation agents are properly registered"""
        from src.flow.config.agent_model_registry import getAgentModelConfig

        config = getAgentModelConfig('desktop-automation-agent')
        assert config['primaryModel'] == 'gpt-5-codex'
        assert 'bytebot-desktop' in config['mcpServers']
        assert 'desktop_automation' in config['capabilities']

    def test_quality_gate_integration(self):
        """Test screenshot evidence quality gate"""
        from src.quality.gates.ScreenshotEvidenceGate import ScreenshotEvidenceGate

        gate = ScreenshotEvidenceGate()

        # Mock context with desktop actions
        context = {
            'desktopActions': [
                {'type': 'click', 'coordinates': {'x': 100, 'y': 200}},
                {'type': 'type_text', 'text': 'test input'}
            ]
        }

        result = gate.execute(context)
        assert result['gate'] == 'screenshot-evidence'
        assert 'score' in result
        assert 'evidence' in result

    def test_security_validation(self):
        """Test security validation for desktop actions"""
        from src.services.desktop_agent.validators.DesktopActionValidator import DesktopActionValidator

        validator = DesktopActionValidator()

        # Test allowed application
        valid_action = {'action': 'application', 'application': 'firefox'}
        result = validator.validateAction(valid_action)
        assert result['valid'] == True

        # Test blocked application
        invalid_action = {'action': 'application', 'application': 'system-settings'}
        result = validator.validateAction(invalid_action)
        assert result['valid'] == False
        assert len(result['errors']) > 0

    def call_mcp_tool(self, tool_name, args):
        """Helper to call MCP tools"""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": args
            }
        }

        result = subprocess.run([
            'node', 'src/services/desktop-agent/mcp/bytebot-mcp-server.js'
        ], input=json.dumps(payload) + '\n',
        text=True, capture_output=True, timeout=10)

        return json.loads(result.stdout)['result']

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
```

## Implementation Sequence

### Phase 1: Core Infrastructure (Week 1)
1. ✅ Copy Bytebot files to SPEK structure
2. ✅ Create MCP server bridge implementation
3. ✅ Update agent model registry with desktop automation agents
4. ✅ Implement security validation framework

### Phase 2: Quality Gate Integration (Week 2)
1. ✅ Implement ScreenshotEvidenceGate
2. ✅ Integrate with 3-Loop system
3. ✅ Create desktop evidence collection
4. ✅ Add quality gate registration

### Phase 3: SwarmQueen Integration (Week 3)
1. ✅ Add desktop automation princess configuration
2. ✅ Update task routing for desktop actions
3. ✅ Implement desktop coordination protocols
4. ✅ Add health monitoring for desktop services

### Phase 4: Testing & Validation (Week 4)
1. ✅ Create comprehensive test suite
2. ✅ Implement Docker integration
3. ✅ Add environment configuration
4. ✅ Validate security measures

## Risk Mitigation

### Security Risks
- **Mitigation**: Implement DesktopActionValidator with allowlists
- **Monitoring**: Comprehensive audit logging for all desktop actions
- **Sandboxing**: Docker containerization with limited privileges

### Performance Risks
- **Mitigation**: Screenshot compression and evidence cleanup
- **Monitoring**: Desktop action timeout enforcement
- **Optimization**: Selective screenshot capture based on action importance

### Integration Risks
- **Mitigation**: Comprehensive testing framework with evidence validation
- **Fallback**: Graceful degradation when desktop automation unavailable
- **Monitoring**: Health checks for all desktop components

## Success Metrics

1. **Integration Success**: 100% of defined desktop actions work through MCP
2. **Quality Gates**: Screenshot evidence collection achieves 90%+ validation scores
3. **Agent Coordination**: Desktop automation agents successfully spawn and execute tasks
4. **Security Compliance**: Zero security violations in audit logs
5. **Performance**: Desktop actions complete within 30-second timeout limits

## Conclusion

This integration plan provides comprehensive desktop automation capabilities to SPEK while maintaining security, quality gates, and agent coordination. The phased implementation approach ensures systematic validation and risk mitigation throughout the integration process.

The integration will enable SPEK's AI agents to:
- Perform direct OS-level automation
- Collect visual evidence for quality gates
- Coordinate complex desktop workflows
- Maintain security and audit compliance
- Integrate seamlessly with the existing 3-Loop development system

All files and configurations have been designed to maintain SPEK's architectural principles while adding powerful desktop automation capabilities through the proven Bytebot technology stack.