# Memory System Integration Implementation Guide

## Overview

This guide provides practical implementation patterns for unifying Claude Flow memory and Memory MCP systems, including code examples, configuration patterns, and migration procedures.

## Current Integration Patterns Analysis

### Claude Flow Memory Operations

**Session Management Pattern:**
```bash
# Session initialization with namespace
HIVE_NAMESPACE="spek/spec-to-pr/$(date +%Y%m%d)"
SESSION_ID="swarm-$(git branch --show-current || echo 'main')"

# Memory operations
npx claude-flow@alpha memory usage --namespace "$HIVE_NAMESPACE" --restore-session "$SESSION_ID"
npx claude-flow@alpha memory store --key "plan/$(date +%s)" --value "$(cat plan.json)" --namespace "$HIVE_NAMESPACE"
npx claude-flow@alpha memory export --namespace "$HIVE_NAMESPACE" --format json
```

**Neural Training Integration:**
```bash
# Pattern learning from success/failure
npx claude-flow@alpha neural train --model success_patterns --session "$SESSION_ID" --input "$(git diff --stat)"
npx claude-flow@alpha neural train --model failure_patterns --session "$SESSION_ID" --input "$(cat triage.json)"
```

### Memory MCP Integration Patterns

**Analysis Pattern Storage:**
```bash
# Sequential thinking and memory updates
mcp_memory.update_analysis_patterns("connascence", analysis_results)
mcp_memory.update_architecture_insights("hotspots", hotspot_data) 
mcp_memory.update_performance_baselines("detector_pools", performance_metrics)
mcp_memory.store_recommendations("refactoring", smart_recommendations)
```

**Quality Learning Integration:**
```bash
# Quality pattern learning in analyzer commands
/conn:scan --sequential-thinking --memory-update
/conn:arch --recommendations --memory-update --gemini-context
/qa:run --performance-monitor --memory-update
```

## Unified Integration Architecture

### 1. Memory Coordinator Implementation

```typescript
// unified-memory-coordinator.ts
export interface MemoryContext {
  namespace: string;
  sessionId?: string;
  type: 'coordination' | 'analysis' | 'intelligence' | 'shared';
  priority: 'low' | 'medium' | 'high' | 'critical';
  ttl?: number;
}

export class UnifiedMemoryCoordinator {
  private cfMemory: ClaudeFlowMemory;
  private mcpMemory: MemoryMCP;
  private router: MemoryRouter;
  private bridge: IntegrationBridge;
  
  constructor() {
    this.router = new MemoryRouter(this.getRoutingRules());
    this.bridge = new IntegrationBridge(this.cfMemory, this.mcpMemory);
  }
  
  async store(key: string, value: any, context: MemoryContext): Promise<void> {
    const target = this.router.route(context);
    
    switch (target) {
      case 'claude-flow':
        return this.cfMemory.store(key, value, context);
        
      case 'memory-mcp':
        return this.mcpMemory.store(key, value, context);
        
      case 'unified':
        // Store in both systems with synchronization
        await Promise.all([
          this.cfMemory.store(key, value, context),
          this.mcpMemory.store(key, value, context)
        ]);
        
        // Bridge data for cross-system access
        await this.bridge.synchronize(key, value, context);
        break;
    }
  }
  
  async retrieve(key: string, context: MemoryContext): Promise<any> {
    const target = this.router.route(context);
    
    // Try primary system first
    let result = await this.getFromPrimary(target, key, context);
    
    // Fallback to secondary system if not found
    if (!result) {
      result = await this.getFromSecondary(target, key, context);
    }
    
    return result;
  }
  
  private getRoutingRules(): RoutingRule[] {
    return [
      // Swarm coordination -> Claude Flow
      { pattern: /^swarm\/.*/, target: 'claude-flow' },
      { pattern: /^session\/.*/, target: 'claude-flow' },
      { pattern: /^agent\/.*/, target: 'claude-flow' },
      
      // Analysis patterns -> Memory MCP
      { pattern: /^analysis\/.*/, target: 'memory-mcp' },
      { pattern: /^quality\/.*/, target: 'memory-mcp' },
      { pattern: /^performance\/.*/, target: 'memory-mcp' },
      
      // Hybrid domains -> Unified
      { pattern: /^patterns\/.*/, target: 'unified' },
      { pattern: /^learning\/.*/, target: 'unified' },
      { pattern: /^intelligence\/.*/, target: 'unified' }
    ];
  }
}
```

### 2. Integration Bridge Implementation

```typescript
// integration-bridge.ts
export class IntegrationBridge {
  private syncQueue: Map<string, SyncOperation>;
  private conflictResolver: ConflictResolver;
  
  async synchronize(key: string, value: any, context: MemoryContext): Promise<void> {
    // Add to sync queue for batch processing
    this.syncQueue.set(key, {
      key,
      value,
      context,
      timestamp: Date.now(),
      retries: 0
    });
    
    // Process immediately for critical operations
    if (context.priority === 'critical') {
      await this.processSyncOperation(key);
    }
  }
  
  async bridgeSessionContext(sessionId: string): Promise<void> {
    // Get CF session data
    const cfSession = await this.cfMemory.getSession(sessionId);
    
    // Transform for MCP context
    const mcpContext = this.transformCFToMCP(cfSession);
    
    // Set MCP context
    await this.mcpMemory.setContext(sessionId, mcpContext);
    
    // Log bridging operation
    logger.info(`Bridged session ${sessionId} from CF to MCP`);
  }
  
  async mergePatterns(): Promise<void> {
    // Get patterns from both systems
    const [cfPatterns, mcpPatterns] = await Promise.all([
      this.cfMemory.getPatterns(),
      this.mcpMemory.getPatterns()
    ]);
    
    // Merge with conflict resolution
    const mergedPatterns = await this.conflictResolver.merge(
      cfPatterns,
      mcpPatterns
    );
    
    // Update both systems
    await Promise.all([
      this.cfMemory.updatePatterns(mergedPatterns),
      this.mcpMemory.updatePatterns(mergedPatterns)
    ]);
  }
  
  private transformCFToMCP(cfData: any): any {
    // Transform Claude Flow data structure to MCP format
    return {
      sessionId: cfData.sessionId,
      namespace: cfData.namespace,
      context: cfData.swarmContext,
      patterns: cfData.neuralPatterns,
      metrics: cfData.performanceMetrics
    };
  }
}
```

### 3. Memory Router Configuration

```typescript
// memory-router.ts
export interface RoutingRule {
  pattern: RegExp;
  target: 'claude-flow' | 'memory-mcp' | 'unified';
  priority: number;
  conditions?: (context: MemoryContext) => boolean;
}

export class MemoryRouter {
  constructor(private rules: RoutingRule[]) {
    // Sort rules by priority
    this.rules.sort((a, b) => b.priority - a.priority);
  }
  
  route(context: MemoryContext): string {
    const key = this.buildRoutingKey(context);
    
    for (const rule of this.rules) {
      if (rule.pattern.test(key)) {
        // Check additional conditions if specified
        if (rule.conditions && !rule.conditions(context)) {
          continue;
        }
        
        return rule.target;
      }
    }
    
    // Default routing based on namespace
    return this.getDefaultTarget(context);
  }
  
  private buildRoutingKey(context: MemoryContext): string {
    return `${context.type}/${context.namespace}`;
  }
  
  private getDefaultTarget(context: MemoryContext): string {
    switch (context.type) {
      case 'coordination': return 'claude-flow';
      case 'analysis': return 'memory-mcp';
      case 'intelligence': return 'unified';
      case 'shared': return 'unified';
      default: return 'unified';
    }
  }
}
```

## Command Integration Patterns

### 1. Enhanced Command Integration

```bash
#!/bin/bash
# enhanced-memory-command.sh

# Unified memory operation wrapper
unified_memory_store() {
    local key="$1"
    local value="$2"
    local context_type="$3"
    local namespace="$4"
    
    # Route based on context type
    case "$context_type" in
        "coordination"|"swarm"|"session")
            npx claude-flow@alpha memory store --key "$key" --value "$value" --namespace "$namespace"
            ;;
        "analysis"|"quality"|"performance")
            # Use Memory MCP through analyzer
            python -c "
import json
from analyzer.memory_integration import mcp_memory
mcp_memory.store('$key', json.loads('$value'), '$namespace')
"
            ;;
        "unified"|"intelligence")
            # Store in both systems
            npx claude-flow@alpha memory store --key "$key" --value "$value" --namespace "$namespace"
            python -c "
import json
from analyzer.memory_integration import mcp_memory
mcp_memory.store('$key', json.loads('$value'), '$namespace')
"
            ;;
    esac
}

# Enhanced analyzer command with memory integration
enhanced_conn_scan() {
    local flags="$1"
    
    # Pre-analysis: Restore session context
    if [[ "$flags" =~ --memory-update ]]; then
        SESSION_ID="${SESSION_ID:-$(git branch --show-current)}"
        NAMESPACE="analysis/connascence/$(date +%Y%m%d)"
        
        # Bridge session context from CF to MCP
        npx claude-flow@alpha memory usage --session "$SESSION_ID" --export-json | \
        python -c "
import json, sys
from analyzer.memory_integration import mcp_memory
data = json.load(sys.stdin)
mcp_memory.set_session_context('$SESSION_ID', data)
"
    fi
    
    # Run analysis
    claude /conn:scan $flags
    
    # Post-analysis: Sync patterns back to CF
    if [[ "$flags" =~ --memory-update ]]; then
        python -c "
from analyzer.memory_integration import mcp_memory
patterns = mcp_memory.get_patterns()
" | npx claude-flow@alpha memory store --key "patterns/$(date +%s)" --namespace "$NAMESPACE" --stdin
    fi
}
```

### 2. Workflow Integration Updates

```yaml
# Enhanced workflow with unified memory
name: enhanced-spec-to-pr
environment:
  UNIFIED_NAMESPACE: "intelligence/spec-to-pr/$(date +%Y%m%d)"
  SESSION_ID: "unified-$(git branch --show-current || echo 'main')"

steps:
  - id: init_unified_memory
    run: |
      # Initialize both memory systems
      npx claude-flow@alpha swarm init --namespace "$UNIFIED_NAMESPACE"
      
      # Set up memory bridging
      python -c "
from memory.unified_coordinator import UnifiedMemoryCoordinator
coordinator = UnifiedMemoryCoordinator()
coordinator.initialize_session('$SESSION_ID', '$UNIFIED_NAMESPACE')
"

  - id: enhanced_analysis
    run: |
      # Run analysis with unified memory
      claude /conn:scan \
        --architecture \
        --sequential-thinking \
        --memory-update \
        --unified-memory
        
      # Bridge patterns between systems
      python -c "
from memory.unified_coordinator import UnifiedMemoryCoordinator
coordinator = UnifiedMemoryCoordinator()
coordinator.bridge_patterns('$SESSION_ID')
"
```

## Migration Implementation

### 1. Data Migration Strategy

```python
# migration-tool.py
import asyncio
import json
from pathlib import Path
from typing import Dict, Any, List

class MemoryMigrationTool:
    def __init__(self):
        self.cf_memory = ClaudeFlowMemory()
        self.mcp_memory = MemoryMCP()
        self.migration_log = []
        
    async def migrate_namespace(self, cf_namespace: str, target_namespace: str):
        """Migrate data from CF namespace to unified structure."""
        
        # Export CF data
        cf_data = await self.cf_memory.export_namespace(cf_namespace)
        
        # Transform data structure
        unified_data = self.transform_to_unified(cf_data, target_namespace)
        
        # Import to unified structure
        await self.import_unified_data(unified_data)
        
        # Log migration
        self.migration_log.append({
            'source': cf_namespace,
            'target': target_namespace,
            'records': len(unified_data),
            'timestamp': datetime.now().isoformat()
        })
    
    def transform_to_unified(self, cf_data: Dict, target_namespace: str) -> Dict:
        """Transform CF data to unified format."""
        unified = {
            'namespace': target_namespace,
            'version': '2.0.0',
            'data': {},
            'metadata': {
                'migrated_from': 'claude-flow',
                'migration_timestamp': datetime.now().isoformat()
            }
        }
        
        # Transform each record
        for key, value in cf_data.items():
            unified_key = self.transform_key(key, target_namespace)
            unified_value = self.transform_value(value)
            unified['data'][unified_key] = unified_value
            
        return unified
        
    async def validate_migration(self, original_namespace: str, unified_namespace: str):
        """Validate migrated data integrity."""
        
        # Get original data
        original = await self.cf_memory.export_namespace(original_namespace)
        
        # Get migrated data
        migrated = await self.get_unified_data(unified_namespace)
        
        # Validate record count
        assert len(original) == len(migrated['data']), "Record count mismatch"
        
        # Validate data integrity
        for key in original:
            unified_key = self.transform_key(key, unified_namespace)
            assert unified_key in migrated['data'], f"Missing key: {unified_key}"
            
        return True
```

### 2. Rollback Procedures

```bash
#!/bin/bash
# rollback-memory-migration.sh

rollback_unified_memory() {
    local backup_dir="$1"
    local target_namespace="$2"
    
    echo "🔄 Rolling back unified memory migration..."
    
    # Restore CF memory from backup
    if [[ -f "$backup_dir/claude-flow-backup.json" ]]; then
        npx claude-flow@alpha memory import --file "$backup_dir/claude-flow-backup.json"
        echo "✅ Claude Flow memory restored"
    fi
    
    # Restore MCP memory from backup
    if [[ -f "$backup_dir/mcp-memory-backup.json" ]]; then
        python -c "
from analyzer.memory_integration import mcp_memory
import json
with open('$backup_dir/mcp-memory-backup.json') as f:
    data = json.load(f)
mcp_memory.restore_backup(data)
"
        echo "✅ Memory MCP restored"
    fi
    
    # Validate rollback
    validate_rollback "$backup_dir" "$target_namespace"
}

validate_rollback() {
    local backup_dir="$1"
    local namespace="$2"
    
    echo "🔍 Validating rollback..."
    
    # Check CF memory integrity
    cf_status=$(npx claude-flow@alpha memory usage --namespace "$namespace" --validate)
    if [[ "$cf_status" == *"valid"* ]]; then
        echo "✅ Claude Flow memory validation passed"
    else
        echo "❌ Claude Flow memory validation failed"
        return 1
    fi
    
    # Check MCP memory integrity
    python -c "
from analyzer.memory_integration import mcp_memory
if mcp_memory.validate_integrity():
    print('✅ Memory MCP validation passed')
else:
    print('❌ Memory MCP validation failed')
    exit(1)
"
}
```

## Performance Optimization

### 1. Caching Strategy

```typescript
// memory-cache.ts
export class UnifiedMemoryCache {
  private l1Cache: Map<string, any>; // Hot data
  private l2Cache: LRUCache<string, any>; // Frequently accessed
  private compressionCache: Map<string, Buffer>; // Compressed storage
  
  async get(key: string, context: MemoryContext): Promise<any> {
    // L1 cache - hot data
    if (this.l1Cache.has(key)) {
      return this.l1Cache.get(key);
    }
    
    // L2 cache - LRU
    if (this.l2Cache.has(key)) {
      const value = this.l2Cache.get(key);
      this.promoteToL1(key, value, context);
      return value;
    }
    
    // Compression cache
    if (this.compressionCache.has(key)) {
      const compressed = this.compressionCache.get(key);
      const value = await this.decompress(compressed);
      this.l2Cache.set(key, value);
      return value;
    }
    
    // Cache miss - fetch from storage
    return null;
  }
  
  private promoteToL1(key: string, value: any, context: MemoryContext): void {
    if (context.priority === 'critical' || context.type === 'coordination') {
      this.l1Cache.set(key, value);
      
      // Evict LRU item if cache full
      if (this.l1Cache.size > 1000) {
        const oldestKey = this.l1Cache.keys().next().value;
        this.l1Cache.delete(oldestKey);
      }
    }
  }
}
```

### 2. Compression Implementation

```python
# memory-compression.py
import gzip
import pickle
import json
from typing import Any, Dict

class MemoryCompression:
    
    @staticmethod
    def compress_value(value: Any) -> bytes:
        """Compress memory value using optimal algorithm."""
        
        # Determine best compression strategy
        if isinstance(value, dict) and len(json.dumps(value)) > 1024:
            # Large JSON objects - use gzip
            json_str = json.dumps(value, separators=(',', ':'))
            return gzip.compress(json_str.encode('utf-8'))
        elif isinstance(value, (list, tuple)) and len(value) > 100:
            # Large collections - use pickle + gzip
            pickled = pickle.dumps(value)
            return gzip.compress(pickled)
        else:
            # Small objects - store uncompressed
            return json.dumps(value).encode('utf-8')
    
    @staticmethod 
    def decompress_value(compressed: bytes) -> Any:
        """Decompress memory value."""
        
        try:
            # Try gzip decompression first
            decompressed = gzip.decompress(compressed)
            
            # Try JSON decode
            try:
                return json.loads(decompressed.decode('utf-8'))
            except json.JSONDecodeError:
                # Try pickle decode
                return pickle.loads(decompressed)
                
        except gzip.BadGzipFile:
            # Not compressed - direct JSON decode
            return json.loads(compressed.decode('utf-8'))
```

## Monitoring and Observability

### 1. Memory Operation Monitoring

```typescript
// memory-monitor.ts
export class UnifiedMemoryMonitor {
  private metrics: Map<string, OperationMetrics>;
  private alerts: AlertManager;
  
  async trackOperation(
    operation: string,
    target: string,
    duration: number,
    success: boolean
  ): Promise<void> {
    const key = `${target}:${operation}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, new OperationMetrics());
    }
    
    const metric = this.metrics.get(key)!;
    metric.record(duration, success);
    
    // Check for performance issues
    if (metric.avgDuration > 1000) { // > 1s
      await this.alerts.send({
        type: 'performance',
        message: `Slow memory operation: ${operation} on ${target}`,
        duration: metric.avgDuration
      });
    }
    
    // Check for error rate
    if (metric.errorRate > 0.1) { // > 10%
      await this.alerts.send({
        type: 'reliability',
        message: `High error rate for ${operation} on ${target}`,
        errorRate: metric.errorRate
      });
    }
  }
  
  generateReport(): MemoryReport {
    return {
      operations: Array.from(this.metrics.entries()).map(([key, metric]) => ({
        operation: key,
        totalCalls: metric.totalCalls,
        avgDuration: metric.avgDuration,
        errorRate: metric.errorRate,
        lastError: metric.lastError
      })),
      cacheStats: this.getCacheStats(),
      systemHealth: this.getSystemHealth()
    };
  }
}
```

## Testing Strategy

### 1. Integration Testing

```python
# test-memory-integration.py
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock

class TestUnifiedMemoryCoordinator:
    
    @pytest.fixture
    async def coordinator(self):
        cf_memory = AsyncMock()
        mcp_memory = AsyncMock() 
        return UnifiedMemoryCoordinator(cf_memory, mcp_memory)
    
    async def test_routing_coordination_to_cf(self, coordinator):
        """Test coordination operations route to Claude Flow."""
        context = MemoryContext(
            namespace="swarm/test",
            type="coordination",
            priority="high"
        )
        
        await coordinator.store("test-key", {"data": "test"}, context)
        
        # Verify routed to Claude Flow
        coordinator.cfMemory.store.assert_called_once()
        coordinator.mcpMemory.store.assert_not_called()
    
    async def test_routing_analysis_to_mcp(self, coordinator):
        """Test analysis operations route to Memory MCP."""
        context = MemoryContext(
            namespace="analysis/connascence",
            type="analysis",
            priority="medium"
        )
        
        await coordinator.store("test-key", {"patterns": []}, context)
        
        # Verify routed to Memory MCP
        coordinator.mcpMemory.store.assert_called_once()
        coordinator.cfMemory.store.assert_not_called()
        
    async def test_unified_intelligence_storage(self, coordinator):
        """Test intelligence data stored in both systems."""
        context = MemoryContext(
            namespace="intelligence/patterns",
            type="intelligence", 
            priority="critical"
        )
        
        await coordinator.store("test-key", {"learning": "data"}, context)
        
        # Verify stored in both systems
        coordinator.cfMemory.store.assert_called_once()
        coordinator.mcpMemory.store.assert_called_once()
```

## Configuration Management

### 1. Unified Configuration

```yaml
# unified-memory-config.yml
memory:
  coordination:
    claude_flow:
      base_url: "http://localhost:3001"
      max_connections: 10
      timeout_ms: 5000
      namespaces:
        - "swarm/*"
        - "session/*" 
        - "agent/*"
        
  analysis:
    memory_mcp:
      connection: "local"
      max_memory_mb: 512
      compression: true
      namespaces:
        - "analysis/*"
        - "quality/*"
        - "performance/*"
        
  unified:
    intelligence:
      sync_interval_ms: 30000
      conflict_resolution: "latest_wins"
      backup_enabled: true
      namespaces:
        - "patterns/*"
        - "learning/*"
        - "intelligence/*"
        
  performance:
    cache:
      l1_size: 1000
      l2_size: 10000
      ttl_seconds: 3600
      compression_threshold: 1024
      
    monitoring:
      enabled: true
      alert_threshold_ms: 1000
      error_rate_threshold: 0.1
```

This implementation guide provides a comprehensive roadmap for unifying the memory systems while maintaining performance and reliability. The approach ensures backward compatibility during migration while delivering the benefits of a unified architecture.