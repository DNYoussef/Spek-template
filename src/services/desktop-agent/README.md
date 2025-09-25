# SPEK Desktop Agent - Bytebot Integration

This directory contains the SPEK-adapted Bytebot computer-use functionality integrated into the SPEK platform.

## Overview

The desktop agent provides computer automation capabilities through:
- Computer interaction (mouse, keyboard, screenshots)
- MCP (Model Context Protocol) tools integration
- Desktop application control
- File system operations

## Directory Structure

```
src/services/desktop-agent/
___ computer-use/           # Core computer automation service
_   ___ computer-use.controller.ts  # REST API endpoints
_   ___ computer-use.module.ts      # NestJS module configuration
_   ___ computer-use.service.ts     # Core service implementation
_   ___ dto/                        # Data transfer objects and validation
___ mcp/                    # MCP integration for AI model interaction
_   ___ bytebot-mcp.module.ts      # MCP module configuration
_   ___ computer-use.tools.ts      # MCP tools for computer actions
_   ___ compressor.ts              # Image compression utilities
_   ___ index.ts                   # Module exports
___ shared/                 # Shared types and utilities
_   ___ types/
_   _   ___ computerAction.types.ts    # Computer action type definitions
_   _   ___ messageContent.types.ts    # Message content types
_   ___ utils/
_       ___ computerAction.utils.ts    # Computer action utilities
_       ___ messageContent.utils.ts    # Message content utilities
___ nut/                    # Network UPS Tools integration (stub)
_   ___ nut.service.ts             # Power management service
_   ___ nut.module.ts              # NestJS module for NUT
___ README.md               # This file
```

## Docker Integration

### Files Copied
- `docker/bytebot/bytebot-desktop.Dockerfile` - Desktop container configuration
- `docker/bytebot/docker-compose.core.yml` - Core services
- `docker/bytebot/docker-compose.spek.yml` - SPEK-adapted composition

### Running the Desktop Agent

```bash
# Using SPEK-adapted docker compose
cd docker/bytebot
docker-compose -f docker-compose.spek.yml up -d

# Services will be available at:
# - Desktop agent: http://localhost:9990
# - Agent API: http://localhost:9991
# - UI: http://localhost:9992
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/spekdb

# AI API Keys
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# Service URLs
SPEK_DESKTOP_BASE_URL=http://spek-desktop:9990
SPEK_AGENT_BASE_URL=http://spek-agent:9991
SPEK_DESKTOP_VNC_URL=http://spek-desktop:9990/websockify
```

## Computer Actions Supported

The service supports the following computer actions:

### Mouse Actions
- `move_mouse` - Move cursor to coordinates
- `click_mouse` - Click at coordinates
- `press_mouse` - Press/release mouse button
- `drag_mouse` - Drag along path
- `trace_mouse` - Trace path with mouse
- `scroll` - Scroll in direction

### Keyboard Actions
- `type_text` - Type text string
- `type_keys` - Type specific keys
- `press_keys` - Press/release key combinations
- `paste_text` - Paste text from clipboard

### System Actions
- `screenshot` - Capture screen
- `cursor_position` - Get cursor position
- `wait` - Wait for duration
- `application` - Launch applications

### File Actions
- `read_file` - Read file contents
- `write_file` - Write file contents

## MCP Tools Integration

The MCP tools provide AI model access to computer actions:

```typescript
// Example usage in AI model
await computerUse.action({
  action: 'move_mouse',
  coordinates: { x: 100, y: 200 }
});

await computerUse.action({
  action: 'click_mouse',
  coordinates: { x: 100, y: 200 },
  button: 'left',
  clickCount: 1
});
```

## Integration with SPEK

### Import Adaptations Made
- Changed `@bytebot/shared` imports to relative paths
- Added stub NutService implementation
- Adapted container names and network configuration
- Updated environment variable names for SPEK consistency

### SPEK-Specific Features
- Integrated with SPEK agent coordination system
- Compatible with SPEK's 3-Loop development system
- Supports SPEK's AI model optimization framework
- Works with SPEK's quality gate requirements

## Security Considerations

- Container runs in privileged mode for desktop access
- File operations should be sandboxed
- Network access should be restricted to necessary services
- All computer actions should be logged for audit

## Future Enhancements

1. **Agent Coordination**: Full integration with SPEK's 85+ agent system
2. **Quality Gates**: Integration with SPEK's theater detection
3. **Memory Integration**: Cross-session computer action history
4. **Security Hardening**: Improved sandboxing and access controls
5. **Performance Monitoring**: Integration with SPEK's monitoring systems

## Development

To extend the desktop agent:

1. Add new action types to `shared/types/computerAction.types.ts`
2. Implement handlers in `computer-use/computer-use.service.ts`
3. Create MCP tools in `mcp/computer-use.tools.ts`
4. Update validation in `computer-use/dto/`
5. Test with Docker compose setup

## Troubleshooting

### Common Issues
- **Container fails to start**: Check privileged mode and display forwarding
- **Actions not working**: Verify desktop environment is properly initialized
- **Connection refused**: Ensure all services are running and networking is configured

### Logs
```bash
# View service logs
docker-compose -f docker-compose.spek.yml logs spek-desktop
docker-compose -f docker-compose.spek.yml logs spek-agent
```

This integration provides a foundation for computer automation within the SPEK platform while maintaining compatibility with the broader Bytebot ecosystem.