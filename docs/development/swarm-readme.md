# Hierarchical Swarm Scripts

Complete swarm infrastructure for god object remediation with Queen-Princess-Drone architecture.

## Quick Start

### Initialize Swarm
```bash
ts-node scripts/swarm/initialize-hierarchical-swarm.ts
```

### Run Test Suite
```bash
ts-node scripts/swarm/test-swarm-initialization.ts
```

## Architecture

- **SwarmQueen**: Central orchestrator
- **6 Princesses**: DevelopmentPrincess, QualityPrincess, SecurityPrincess, ResearchPrincess, InfrastructurePrincess, CoordinationPrincess
- **Byzantine Consensus**: 67% quorum, 33% fault tolerance
- **Parallel Pipelines**: 12 total (2 per princess), 48 files/cycle capacity

## Features

- God object detection and analysis
- Multi-phase decomposition (Development -> Quality -> Security)
- Real-time monitoring dashboard
- Byzantine fault-tolerant consensus
- Automatic health checks and recovery
- Comprehensive reporting

## Success Criteria

- All 6 princesses operational
- Byzantine consensus healthy (>=67%)
- Parallel pipelines ready (12 total)
- Monitoring active
- Target: 20 god objects in 72 hours

See `.claude/.artifacts/swarm/SWARM-INITIALIZATION-COMPLETE.md` for full documentation.
