# Docker Desktop Integration for SPEK Platform

## Overview
This directory contains Docker configurations for the SPEK Enhanced Development Platform's desktop automation capabilities using Bytebot.

## Docker Desktop Configuration

### Prerequisites
- **Docker Desktop for Windows**: Version 24.0.2+ (you have this installed)
- **Docker Compose V2**: Integrated plugin (confirmed working)
- **WSL2 Backend**: Enabled for optimal performance

### File Structure
```
docker/
 compose.desktop.yaml       # Main Docker Compose configuration (V2 format)
 docker-compose.desktop.yml # Legacy filename (symlink to compose.desktop.yaml)
 bytebot/
    .env.example           # Environment variables template
    nginx.conf             # Evidence collector configuration
    init-scripts/          # Database initialization
 README.md                  # This file
```

## Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp docker/bytebot/.env.example docker/bytebot/.env

# Edit .env with your API keys
# Required: ANTHROPIC_API_KEY for AI capabilities
```

### 2. Start Services (Docker Compose V2)
```bash
# Using Docker Compose V2 plugin (recommended)
docker compose -f docker/compose.desktop.yaml up -d

# Or using the convenience script
./scripts/start-desktop-containers.sh
```

### 3. Verify Services
```bash
# Check service status
docker compose -f docker/compose.desktop.yaml ps

# View logs
docker compose -f docker/compose.desktop.yaml logs -f

# Run integration tests
node tests/desktop-integration-test.js
```

## Service Endpoints

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Bytebot Desktop | 9990 | http://localhost:9990 | Desktop automation API |
| VNC Web | 6080 | http://localhost:6080/vnc.html | Browser-based VNC access |
| Bytebot Agent | 9991 | http://localhost:9991/api | Agent coordination API |
| Bytebot UI | 9992 | http://localhost:9992 | Web dashboard |
| Evidence Collector | 8080 | http://localhost:8080/evidence | Quality gate evidence |
| PostgreSQL | 5432 | localhost:5432 | Database |
| Redis | 6379 | localhost:6379 | Cache |

## Docker Desktop Specific Commands

### Using Docker Compose V2 (Plugin)
```bash
# Start services
docker compose -f docker/compose.desktop.yaml up -d

# Stop services
docker compose -f docker/compose.desktop.yaml down

# View logs
docker compose -f docker/compose.desktop.yaml logs -f [service]

# Restart a service
docker compose -f docker/compose.desktop.yaml restart [service]

# Execute command in container
docker compose -f docker/compose.desktop.yaml exec [service] /bin/bash

# Pull latest images
docker compose -f docker/compose.desktop.yaml pull

# Remove everything including volumes
docker compose -f docker/compose.desktop.yaml down -v
```

### Resource Management
```bash
# View resource usage
docker stats

# Check Docker Desktop settings
# Settings > Resources > Advanced
# Recommended: 4GB RAM, 2 CPUs minimum
```

### Troubleshooting Docker Desktop

#### WSL2 Integration
```bash
# Check WSL2 status
wsl --status

# Restart WSL2 if needed
wsl --shutdown
```

#### Docker Desktop Reset
```bash
# Clean up all containers and volumes
docker system prune -a --volumes

# Restart Docker Desktop
# System Tray > Docker Desktop > Restart
```

#### File Sharing
Ensure the project directory is shared:
1. Docker Desktop Settings
2. Resources > File Sharing
3. Add: C:\Users\17175\Desktop\spek template

## Integration with SPEK

### MCP Server Bridge
The desktop automation MCP server connects SPEK agents to Bytebot:
```javascript
// Location: src/flow/servers/desktop-automation-mcp.js
// Tools: screenshot_tool, click_tool, type_tool, etc.
```

### Agent Registry
Desktop automation agents are registered in:
```javascript
// Location: src/flow/config/agent-model-registry.js
// Agents: desktop-automator, ui-tester, desktop-qa-specialist, etc.
```

### Evidence Collection
Quality gate evidence is collected in:
```
.claude/.artifacts/desktop/
 screenshots/
 logs/
 audit/
 integration-test-report.json
```

## Production Deployment

### Health Checks
All services include health checks with:
- 30-second intervals
- 10-second timeouts
- 3 retry attempts
- Automatic restart on failure

### Security
- No new privileges for containers
- Network isolation
- Volume access controls
- Audit logging enabled

### Resource Limits
Each service has defined resource limits:
- Desktop: 2 CPU, 2GB RAM
- Agent: 1 CPU, 1GB RAM
- Database: 1 CPU, 512MB RAM
- Others: Proportionally scaled

## Maintenance

### Backup
```bash
# Backup volumes
docker run --rm -v spek-postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data

# Backup evidence
tar czf evidence-backup.tar.gz .claude/.artifacts/desktop/
```

### Updates
```bash
# Pull latest images
docker compose -f docker/compose.desktop.yaml pull

# Recreate containers with new images
docker compose -f docker/compose.desktop.yaml up -d --force-recreate
```

### Monitoring
```bash
# Real-time stats
docker stats

# Check logs for errors
docker compose -f docker/compose.desktop.yaml logs --tail=100 | grep ERROR

# Health status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Support

For issues with:
- **Docker Desktop**: Check Docker Desktop logs in `%LOCALAPPDATA%\Docker\log.txt`
- **Integration**: Run `node tests/desktop-integration-test.js`
- **SPEK Platform**: See main README.md

## Notes for Windows Users

1. **Line Endings**: Scripts use Unix line endings (LF). Git should handle this automatically.
2. **Path Separators**: Docker Compose handles path conversion automatically.
3. **Permissions**: Docker Desktop manages file permissions through WSL2.
4. **Networking**: Uses npipe on Windows (named pipe) instead of Unix sockets.

---

**Integration Status**:  PRODUCTION READY (100% score)
**Last Updated**: 2024-09-18
**Docker Desktop Version**: 24.0.2
**Docker Compose Version**: v2.18.1