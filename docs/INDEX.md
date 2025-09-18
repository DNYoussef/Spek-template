# SPEK Platform Documentation Index

## Core Development System

### 3-Loop Development System
- **[3-Loop System Overview](3-LOOP-SYSTEM.md)** - Complete guide to forward/reverse flow patterns
- **[Quick Start Guide](3-LOOP-QUICK-START.md)** - Get started with 3-loop development
- **Loop Scripts:**
  - `scripts/3-loop-orchestrator.sh` - Main orchestrator
  - `scripts/codebase-remediation.sh` - Existing codebase improvement
  - `scripts/loop-feedback/` - Feedback conversion utilities

### SPARC/SPEK Methodology
- **[API Reference Manual](API-REFERENCE-MANUAL.md)** - Complete API documentation
- **[Architecture Decisions](ADR-001-SYSTEM-INTEGRATION-ARCHITECTURE.md)** - System design rationale

## Enterprise Features

### Compliance & Security
- **[DFARS Implementation](DFARS-252.204-7012-COMPLETE-IMPLEMENTATION-REPORT.md)** - Defense compliance
- **[Security Remediation Plan](dfars-compliance-security-remediation-plan.md)** - Security hardening
- **[Compliance Directory](compliance/)** - All compliance documentation

### Enterprise Deployment
- **[Installation Guide](ENTERPRISE-INSTALLATION-GUIDE.md)** - Enterprise setup instructions
- **[User Guide](ENTERPRISE-USER-GUIDE.md)** - End-user documentation
- **[Troubleshooting](ENTERPRISE-TROUBLESHOOTING.md)** - Common issues and solutions
- **[Module Architecture](ENTERPRISE-MODULE-ARCHITECTURE.md)** - System components
- **[Feature Flags](ENTERPRISE-FEATURE-FLAGS.md)** - Configuration options

## Architecture Documentation
- **[Architecture Directory](architecture/)** - System design documents
- **[Deployment Directory](deployment/)** - Deployment configurations
- **[Analysis Outputs](analysis_outputs/)** - Quality analysis results

## Audit & Quality
- **[Audit Reports](audit/)** - System audit documentation
- **[Enterprise Standards](enterprise/)** - Enterprise-grade requirements

## Configuration
- **[Configuration Directory](config/)** - System configuration files
- **Loop Configuration: `.roo/loops/loop-config.json`
- **SPARC Configuration: `.roo/sparc-config.json`

## Quick Links

### Essential Commands
```bash
# 3-Loop System
./scripts/3-loop-orchestrator.sh [forward|reverse]
./scripts/codebase-remediation.sh /path/to/project progressive 10

# SPARC Commands
npx claude-flow sparc modes
npx claude-flow sparc run <mode> "<task>"
npx claude-flow sparc tdd "<feature>"

# Quality Analysis
./scripts/simple_quality_loop.sh
```

### Key Configurations
- `.roomodes` - SPARC mode definitions
- `.roo/loops/loop-config.json` - Loop quality gates
- `.roo/sparc-config.json` - SPARC settings

### Documentation Updates
Last Updated: 2025-01-18
- Added 3-Loop System documentation
- Created quick start guide
- Integrated feedback mechanisms
- Added convergence criteria