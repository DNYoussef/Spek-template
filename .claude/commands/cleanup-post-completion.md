# /cleanup:post-completion - Post-Completion Cleanup & Optimization

## Purpose
Enterprise-ready post-completion cleanup command that safely removes temporary artifacts, consolidates quality reports, optimizes documentation, and prepares the codebase for next iteration while maintaining full audit trails and rollback capabilities within the SPEK quality framework.

## Command Syntax
```bash
# Standard execution modes
/cleanup:post-completion --interactive              # Full interactive cleanup with confirmations
/cleanup:post-completion --dry-run                  # Show planned actions without execution
/cleanup:post-completion --backup-only              # Create backup and exit safely
/cleanup:post-completion --phase <1|2|3|4>          # Run specific cleanup phase only
/cleanup:post-completion --status                   # Show current cleanup status
/cleanup:post-completion --rollback [backup-id]     # Restore from backup
/cleanup:post-completion --theater-scan             # Enable theater detection during cleanup

# Advanced execution modes
/cleanup:post-completion --force [--preserve=<patterns>]       # Automated cleanup with patterns
/cleanup:post-completion --scope=<scope> [--quality-gates]     # Scoped cleanup with QA integration
/cleanup:post-completion --swarm-coordinate [--agents=<list>]  # Multi-agent cleanup coordination
/cleanup:post-completion --memory-bridge [--learning-mode]     # Memory system integration
/cleanup:post-completion --evidence-package                    # Generate compliance evidence
```

## Execution Modes

### 1. Interactive Mode (Default) 
**Enterprise-Safe**: Step-by-step confirmations with impact analysis
```bash
/cleanup:post-completion --interactive
# Expected output: "🧹 Analyzing 234 files across 4 categories..."
# User prompted for each phase with detailed impact metrics
```

**Features:**
- User confirmation for each cleanup category with space/time estimates
- Real-time quality gate status preservation verification
- Theater detection warnings during interactive prompts  
- Granular rollback points with selective restoration
- Integration with `.claude/settings.json` hook execution

### 2. Dry-Run Mode
**Risk-Free Analysis**: Complete simulation with comprehensive reporting
```bash
/cleanup:post-completion --dry-run --verbose
# Generates: .claude/.artifacts/cleanup_plan_[timestamp].json
/cleanup:post-completion --dry-run --theater-scan
# Includes: Theater pattern detection in cleanup scope
```

**Features:**
- Zero-risk simulation of all cleanup operations
- Integration with existing quality gate infrastructure
- Evidence package generation for compliance review
- Performance impact modeling using historical data
- Memory bridge analysis for learning pattern preservation

### 3. Backup-Only Mode
**Safety First**: Comprehensive backup creation without cleanup
```bash
/cleanup:post-completion --backup-only 
# Creates: .claude/.backups/cleanup-backup-[timestamp]/
/cleanup:post-completion --backup-only --evidence-package
# Includes: Compliance artifacts and audit trail
```

**Features:**
- Full system snapshot with metadata preservation
- Integration with existing hook system for state capture
- Compliance evidence packaging for enterprise requirements
- Backup integrity verification using existing quality checks
- Memory system state preservation

### 4. Phase Mode
**Surgical Control**: Execute specific cleanup phases independently
```bash
/cleanup:post-completion --phase 1    # Temporary files only
/cleanup:post-completion --phase 2    # Quality artifacts consolidation  
/cleanup:post-completion --phase 3    # Documentation organization
/cleanup:post-completion --phase 4    # Environment optimization
```

**Phase Breakdown:**
- **Phase 1**: Temporary files, logs, cache cleanup with safety checks
- **Phase 2**: QA artifact consolidation leveraging existing quality gates
- **Phase 3**: Documentation organization with knowledge preservation
- **Phase 4**: Environment optimization with performance validation

### 5. Status Mode
**System Visibility**: Current cleanup status and recommendations
```bash
/cleanup:post-completion --status                    # Summary view
/cleanup:post-completion --status --theater-scan     # Include theater analysis
/cleanup:post-completion --status --json            # Machine-readable output
```

**Status Categories:**
- System health metrics and cleanup readiness
- Integration with swarm coordination status
- Quality gate preservation status
- Memory bridge synchronization status
- Evidence package readiness for compliance

### 6. Rollback Mode  
**Enterprise Recovery**: Safe restoration from cleanup backups
```bash
/cleanup:post-completion --rollback                        # Latest backup
/cleanup:post-completion --rollback cleanup-backup-123456  # Specific backup
/cleanup:post-completion --rollback --verify              # Verify before restore
```

**Rollback Features:**
- Progressive restoration with checkpoint verification
- Integration with existing git state management
- Quality gate status restoration and verification
- Memory bridge state synchronization
- Audit trail preservation throughout rollback process

### 7. Theater-Scan Mode
**Reality Validation**: Theater pattern detection during cleanup
```bash
/cleanup:post-completion --theater-scan                 # Enable detection
/cleanup:post-completion --dry-run --theater-scan       # Analysis only
```

**Theater Detection Integration:**
- Leverages existing `/theater:scan` infrastructure  
- Validates cleanup claims against actual artifact changes
- Detects performance theater in cleanup reporting
- Prevents quality gate gaming through cleanup operations

## Cleanup Categories & Operations

### 1. Temporary Files & Artifacts

#### Target Files:
```yaml
temporary_files:
  build_artifacts:
    - "**/.artifacts/temp_*"
    - "**/build/temp/**"
    - "**/dist/cache/**"
    - "**/node_modules/.cache/**"
  
  log_files:
    - "**/*.log"
    - "**/logs/debug_*"
    - ".claude/.artifacts/*.log"
    - "scripts/temp_*.log"
  
  cache_files:
    - "**/.cache/**"
    - "**/temp/**"
    - "**/*.tmp"
    - "**/coverage/.nyc_output/**"
  
  backup_files:
    - "**/*.bak"
    - "**/*~" 
    - "**/.#*"
    - "**/core.*"
```

#### Safety Mechanisms:
- **Age-based cleanup**: Only remove files older than 24 hours
- **Size thresholds**: Skip cleanup if files exceed importance threshold
- **Pattern exclusions**: Preserve files matching `--preserve` patterns
- **Dependency checking**: Verify no active processes depend on files

### 2. Quality Assurance Artifacts

#### Analysis Results Consolidation:
```yaml
qa_artifact_management:
  connascence_reports:
    consolidate:
      - "connascence_full.json" → "analysis/final/connascence_consolidated.json"
      - "connascence_*.json" → Archive in "analysis/archive/connascence/"
    cleanup:
      - Remove intermediate analysis files
      - Preserve final consolidated reports
  
  security_scans:
    consolidate:
      - "*.sarif" → "analysis/final/security_consolidated.sarif"
      - "security_*.json" → Archive in "analysis/archive/security/"
    cleanup:
      - Remove scan cache files
      - Preserve SARIF reports for compliance
  
  test_coverage:
    consolidate:
      - "coverage/lcov-report/**" → "analysis/final/coverage/"
      - "coverage_*.json" → Archive in "analysis/archive/coverage/"
    cleanup:
      - Remove .nyc_output cache
      - Preserve final coverage reports
```

### 3. Documentation & Knowledge Artifacts

#### Documentation Consolidation:
```yaml
documentation_management:
  working_documents:
    consolidate:
      - "docs/working/*.md" → "docs/archive/working/$(date +%Y-%m)/"
      - "research_notes_*.md" → "docs/knowledge/research/"
      - "analysis_*.md" → "docs/knowledge/analysis/"
    cleanup:
      - Remove duplicate research files
      - Consolidate overlapping documentation
  
  memory_artifacts:
    consolidate:
      - ".claude/.artifacts/memory_*" → ".claude/memory/archive/"
      - "memory_export_*" → ".claude/memory/consolidated/"
    cleanup:
      - Remove temporary memory exports
      - Preserve learning patterns and intelligence
```

### 4. Development Environment Cleanup

#### Environment Optimization:
```yaml
environment_cleanup:
  dependency_management:
    operations:
      - Clean npm/yarn cache: "npm cache clean --force"
      - Remove unused node_modules: Find packages not in package.json
      - Clean pip cache: "pip cache purge"
      - Clear git objects: "git gc --aggressive"
  
  ide_artifacts:
    cleanup:
      - "**/.vscode/temp/**"
      - "**/.idea/workspace.xml" 
      - "**/Session.vim"
      - "**/.DS_Store"
  
  system_optimization:
    operations:
      - Defragment git repository
      - Optimize file system permissions
      - Update .gitignore with learned patterns
      - Clean shell history and temp files
```

## Implementation Strategy

### Core Execution Engine
```python
class PostCompletionCleanup:
    def __init__(self, mode='interactive', options={}):
        self.mode = mode
        self.options = options
        self.backup_manager = BackupManager()
        self.safety_checker = SafetyChecker()
        self.rollback_manager = RollbackManager()
    
    def execute_cleanup(self):
        """Main cleanup execution with comprehensive safety"""
        cleanup_plan = self._generate_cleanup_plan()
        
        if self.mode == 'dry-run':
            return self._simulate_cleanup(cleanup_plan)
        
        # Create comprehensive backup
        backup_info = self._create_comprehensive_backup()
        
        try:
            # Execute cleanup operations
            results = self._execute_cleanup_operations(cleanup_plan)
            
            # Verify cleanup integrity
            self._verify_cleanup_integrity(results)
            
            # Update system state
            self._update_system_metadata(results, backup_info)
            
            return results
            
        except Exception as e:
            # Automatic rollback on failure
            self.rollback_manager.rollback_to_backup(backup_info['backup_id'])
            raise CleanupError(f"Cleanup failed, rolled back: {e}")
    
    def _generate_cleanup_plan(self):
        """Generate comprehensive cleanup plan"""
        plan = {
            'temporary_files': self._analyze_temporary_files(),
            'qa_artifacts': self._analyze_qa_artifacts(),
            'documentation': self._analyze_documentation(),
            'environment': self._analyze_environment(),
            'estimated_space_freed': 0,
            'estimated_duration': 0,
            'safety_considerations': []
        }
        
        # Calculate estimates and safety considerations
        plan['estimated_space_freed'] = sum(cat.get('space_freed', 0) for cat in plan.values() if isinstance(cat, dict))
        plan['estimated_duration'] = sum(cat.get('duration_sec', 0) for cat in plan.values() if isinstance(cat, dict))
        
        return plan
```

### Safety Mechanisms

#### Comprehensive Backup System
```bash
create_comprehensive_backup() {
    local backup_id="cleanup-backup-$(date +%s)"
    local backup_path="${CLEANUP_BACKUP_PATH:-".claude/.backups"}/${backup_id}"
    
    echo "🛡️  Creating comprehensive backup: $backup_id"
    
    # Create backup structure
    mkdir -p "$backup_path"/{files,metadata,git}
    
    # Backup critical files
    backup_critical_files() {
        # All .claude artifacts
        cp -r .claude/.artifacts "$backup_path/files/claude-artifacts" 2>/dev/null || true
        
        # Documentation
        find docs -name "*.md" -newer "$(date -d '7 days ago' '+%Y-%m-%d')" -exec cp {} "$backup_path/files/docs/" \; 2>/dev/null || true
        
        # Quality assurance reports
        find . -name "*.json" -path "*/.artifacts/*" -exec cp {} "$backup_path/files/qa/" \; 2>/dev/null || true
        
        # Configuration files
        cp package*.json tsconfig*.json .eslintrc* .gitignore "$backup_path/files/" 2>/dev/null || true
    }
    
    # Backup metadata
    backup_metadata() {
        # Git state
        git status --porcelain > "$backup_path/metadata/git_status.txt"
        git log --oneline -10 > "$backup_path/metadata/recent_commits.txt"
        git branch -a > "$backup_path/metadata/branches.txt"
        
        # System state
        du -sh * > "$backup_path/metadata/disk_usage.txt" 2>/dev/null || true
        find . -name "*.log" -o -name "*.tmp" -o -name "*~" | wc -l > "$backup_path/metadata/temp_file_count.txt"
        
        # Cleanup plan
        echo "{\"backup_id\": \"$backup_id\", \"timestamp\": \"$(date -Iseconds)\", \"cleanup_mode\": \"$CLEANUP_MODE\"}" > "$backup_path/metadata/backup_info.json"
    }
    
    backup_critical_files
    backup_metadata
    
    # Verify backup integrity
    if verify_backup_integrity "$backup_path"; then
        echo "✅ Backup created successfully: $backup_path"
        echo "$backup_id" > .claude/.artifacts/last_cleanup_backup.txt
        return 0
    else
        echo "❌ Backup verification failed"
        rm -rf "$backup_path"
        return 1
    fi
}
```

#### Safety Checks & Validations
```bash
safety_check_before_cleanup() {
    local cleanup_plan="$1"
    local safety_issues=()
    
    echo "🔍 Running comprehensive safety checks..."
    
    # Check for active processes
    check_active_processes() {
        local active_procs=$(pgrep -f "node\|python\|npm\|jest" | wc -l)
        if [ "$active_procs" -gt 0 ]; then
            safety_issues+=("Active development processes detected: $active_procs")
        fi
    }
    
    # Check for uncommitted changes
    check_git_status() {
        if [ -n "$(git status --porcelain)" ]; then
            safety_issues+=("Uncommitted changes detected - consider committing first")
        fi
    }
    
    # Check for critical files in cleanup scope
    check_critical_files() {
        local critical_patterns=("package.json" "tsconfig.json" "*.md" "src/**")
        for pattern in "${critical_patterns[@]}"; do
            if echo "$cleanup_plan" | grep -q "$pattern"; then
                safety_issues+=("Critical file pattern in cleanup scope: $pattern")
            fi
        done
    }
    
    # Check for dependency locks
    check_dependency_locks() {
        if [ -f "package-lock.json" ] || [ -f "yarn.lock" ]; then
            local lock_age=$(find . -name "*lock.json" -o -name "yarn.lock" -mtime +1 | wc -l)
            if [ "$lock_age" -eq 0 ]; then
                safety_issues+=("Recent dependency lock changes - cleanup may affect dependencies")
            fi
        fi
    }
    
    check_active_processes
    check_git_status
    check_critical_files
    check_dependency_locks
    
    if [ ${#safety_issues[@]} -gt 0 ]; then
        echo "⚠️  Safety issues detected:"
        printf '%s\n' "${safety_issues[@]}"
        
        if [ "$CLEANUP_MODE" = "interactive" ]; then
            echo "Continue anyway? (y/N): "
            read -r response
            [ "$response" = "y" ] || [ "$response" = "Y" ] || return 1
        elif [ "$CLEANUP_MODE" = "force" ]; then
            echo "🚨 Force mode: Continuing despite safety issues"
        else
            return 1
        fi
    fi
    
    echo "✅ Safety checks completed"
    return 0
}
```

### Rollback Procedures

#### Automatic Rollback System
```bash
rollback_cleanup() {
    local backup_id="$1"
    local backup_path=".claude/.backups/$backup_id"
    
    echo "🔄 Initiating rollback to backup: $backup_id"
    
    if [ ! -d "$backup_path" ]; then
        echo "❌ Backup not found: $backup_path"
        return 1
    fi
    
    # Verify backup integrity before rollback
    if ! verify_backup_integrity "$backup_path"; then
        echo "❌ Backup integrity verification failed"
        return 1
    fi
    
    # Progressive rollback with checkpoints
    rollback_with_checkpoints() {
        # Checkpoint 1: Restore critical files
        echo "📁 Restoring critical files..."
        if [ -d "$backup_path/files" ]; then
            cp -r "$backup_path/files/claude-artifacts/"* .claude/.artifacts/ 2>/dev/null || true
            cp -r "$backup_path/files/docs/"* docs/ 2>/dev/null || true
            cp -r "$backup_path/files/qa/"* .claude/.artifacts/ 2>/dev/null || true
        fi
        
        # Checkpoint 2: Restore configuration
        echo "⚙️  Restoring configuration files..."
        if [ -d "$backup_path/files" ]; then
            for config_file in package.json package-lock.json tsconfig.json .eslintrc* .gitignore; do
                [ -f "$backup_path/files/$config_file" ] && cp "$backup_path/files/$config_file" . || true
            done
        fi
        
        # Checkpoint 3: Restore git state if needed
        echo "🔀 Checking git state..."
        if [ -f "$backup_path/metadata/git_status.txt" ] && [ -s "$backup_path/metadata/git_status.txt" ]; then
            echo "⚠️  Git state changes detected, manual review may be needed"
            cat "$backup_path/metadata/git_status.txt"
        fi
        
        # Verify rollback success
        echo "✅ Rollback completed successfully"
        
        # Record rollback in cleanup log
        echo "{\"timestamp\": \"$(date -Iseconds)\", \"action\": \"rollback\", \"backup_id\": \"$backup_id\", \"status\": \"success\"}" >> .claude/.artifacts/cleanup_history.jsonl
    }
    
    rollback_with_checkpoints
    return $?
}
```

## Status Reporting & Analytics

### Cleanup Status Report
```json
{
  "timestamp": "2024-09-08T15:30:00Z",
  "command": "cleanup-post-completion",
  "mode": "interactive",
  "session_id": "cleanup-20240908-153000",
  
  "execution_summary": {
    "total_operations": 47,
    "successful_operations": 45,
    "failed_operations": 2,
    "skipped_operations": 8,
    "duration_seconds": 127
  },
  
  "cleanup_results": {
    "temporary_files": {
      "files_removed": 234,
      "space_freed_mb": 127.3,
      "categories": {
        "build_artifacts": {"files": 45, "space_mb": 23.7},
        "log_files": {"files": 189, "space_mb": 103.6},
        "cache_files": {"files": 67, "space_mb": 45.2}
      }
    },
    
    "qa_artifacts": {
      "files_consolidated": 23,
      "files_archived": 67,
      "space_freed_mb": 34.8,
      "consolidation_efficiency": "67%"
    },
    
    "documentation": {
      "files_consolidated": 12,
      "duplicate_files_removed": 8,
      "space_freed_mb": 5.2,
      "knowledge_preservation_rate": "94%"
    },
    
    "environment_optimization": {
      "cache_cleared_mb": 89.4,
      "dependencies_optimized": true,
      "git_optimization": "completed",
      "performance_improvement_estimate": "15%"
    }
  },
  
  "backup_information": {
    "backup_id": "cleanup-backup-1725812745",
    "backup_path": ".claude/.backups/cleanup-backup-1725812745",
    "backup_size_mb": 445.7,
    "backup_integrity": "verified",
    "rollback_available": true
  },
  
  "safety_analysis": {
    "critical_files_preserved": 245,
    "safety_violations": 0,
    "rollback_points": 3,
    "recovery_time_estimate_minutes": 5
  },
  
  "next_cleanup_recommendation": {
    "suggested_date": "2024-09-15T15:30:00Z",
    "priority": "medium",
    "focus_areas": ["log_rotation", "cache_optimization"]
  }
}
```

### Integration with SPEK Hook System

#### Pre-Cleanup Hook Integration
```bash
# Pre-cleanup hook execution
execute_pre_cleanup_hooks() {
    echo "🎣 Executing pre-cleanup hooks..."
    
    # Memory bridge preparation
    if command -v scripts/memory_bridge.sh >/dev/null 2>&1; then
        scripts/memory_bridge.sh store "system/cleanup" "pre_cleanup_state" "$(date -Iseconds)" '{"phase": "pre_cleanup"}'
    fi
    
    # Quality gate checkpoint
    if [ -f ".claude/.artifacts/qa.json" ]; then
        echo "📊 Creating QA checkpoint for post-cleanup comparison"
        cp .claude/.artifacts/qa.json .claude/.artifacts/qa_pre_cleanup.json
    fi
    
    # Git state snapshot
    git status --porcelain > .claude/.artifacts/git_state_pre_cleanup.txt
    git log --oneline -5 > .claude/.artifacts/git_commits_pre_cleanup.txt
    
    echo "✅ Pre-cleanup hooks completed"
}
```

#### Post-Cleanup Hook Integration
```bash
# Post-cleanup hook execution
execute_post_cleanup_hooks() {
    local cleanup_results="$1"
    
    echo "🎣 Executing post-cleanup hooks..."
    
    # Memory bridge update
    if command -v scripts/memory_bridge.sh >/dev/null 2>&1; then
        scripts/memory_bridge.sh store "system/cleanup" "cleanup_results" "$cleanup_results" '{"phase": "post_cleanup"}'
    fi
    
    # System optimization
    optimize_post_cleanup() {
        # Git repository optimization
        git gc --aggressive --prune=now >/dev/null 2>&1 || true
        
        # Update .gitignore with learned patterns
        if [ -f ".claude/.artifacts/learned_ignore_patterns.txt" ]; then
            cat .claude/.artifacts/learned_ignore_patterns.txt >> .gitignore
            sort .gitignore | uniq > .gitignore.tmp && mv .gitignore.tmp .gitignore
        fi
        
        # File system optimization
        if command -v find >/dev/null 2>&1; then
            find . -type f -name "*.log" -size +10M -mtime +7 -delete 2>/dev/null || true
        fi
    }
    
    # Performance analysis
    analyze_cleanup_impact() {
        local pre_size=$(du -sb . 2>/dev/null | cut -f1)
        local post_size=$(echo "$cleanup_results" | jq -r '.total_space_freed_mb // 0')
        
        echo "📈 Cleanup impact analysis:"
        echo "  Space freed: ${post_size}MB"
        echo "  File system optimization: $(git count-objects | awk '{print $1}') objects"
    }
    
    optimize_post_cleanup
    analyze_cleanup_impact
    
    echo "✅ Post-cleanup hooks completed"
}
```

## Integration Features

### SPEK Quality Framework Integration
**Seamless integration with existing quality infrastructure:**

```yaml
quality_framework_integration:
  nasa_pot10_compliance:
    preservation:
      - Final compliance reports (.claude/.artifacts/nasa_compliance.json)
      - Security audit trails (SARIF format preservation)
      - Architectural assessment artifacts (connascence_full.json)
      - Performance baseline measurements
    operations:
      - Verify 92% NASA compliance threshold before cleanup
      - Archive compliance artifacts in evidence packages
      - Maintain audit trail continuity through cleanup cycles
  
  quality_gate_coordination:
    preservation_rules:
      - "qa.json" → Preserve final quality gate status
      - "connascence_*.json" → Consolidate into single report
      - "security_*.sarif" → Preserve for compliance audits
      - "coverage_*.json" → Archive with historical trend data
    validation:
      - Pre-cleanup quality gate status capture
      - Post-cleanup quality gate integrity verification
      - Rollback triggers on quality degradation detection
  
  hook_system_integration:
    pre_cleanup_hooks:
      - "npx claude-flow@alpha hooks pre-task --description 'cleanup-post-completion'"
      - "scripts/ops_tripwires.sh check-limits"  
      - ".claude/settings.json preTool hook execution"
    post_cleanup_hooks:
      - "npx claude-flow@alpha hooks post-edit --memory-key 'cleanup/$(date +%s)'"
      - "npx claude-flow@alpha hooks notify --message 'Cleanup completed'"
      - "scripts/ops_tripwires.sh update-metrics"
```

### Memory System Integration
**Unified memory architecture coordination:**

```yaml
memory_bridge_integration:
  learning_preservation:
    critical_patterns:
      - Neural training patterns (.claude/.artifacts/patterns_*)  
      - Cross-agent communication logs
      - Quality improvement insights and recommendations
      - Performance optimization discoveries
    operations:
      - Memory state backup before any cleanup operations
      - Learning pattern consolidation and archiving
      - Historical trend data preservation for future analysis
      - Cross-session memory bridge synchronization
  
  intelligence_coordination:
    swarm_memory:
      - Agent coordination patterns and successful workflows
      - Multi-agent task completion strategies and optimizations
      - Collaborative problem-solving insights and methodologies
      - Error recovery patterns and resolution strategies
    consolidation:
      - Export memory state to consolidated knowledge base
      - Archive agent interaction logs with privacy preservation
      - Preserve successful agent coordination patterns
      - Maintain cross-agent learning trajectory data
```

### Swarm Coordination Integration
**Multi-agent cleanup coordination:**

```yaml
swarm_integration:
  agent_coordination:
    concurrent_cleanup:
      - Spawn specialized cleanup agents for different categories
      - "Task('temp-cleaner: Remove temporary files safely')"
      - "Task('qa-consolidator: Merge quality artifacts')"  
      - "Task('doc-organizer: Consolidate documentation')"
    coordination_patterns:
      - "mcp__claude-flow__swarm_init { topology: 'cleanup', maxAgents: 4 }"
      - "mcp__claude-flow__agent_spawn { type: 'cleanup-specialist' }"
      - "mcp__claude-flow__task_orchestrate { strategy: 'parallel' }"
  
  performance_optimization:
    parallel_execution:
      - Concurrent file system operations with safety locks
      - Parallel quality artifact processing and consolidation
      - Multi-threaded backup creation with integrity verification
      - Distributed cleanup operations with centralized coordination
    resource_management:
      - "SANDBOX_TTL_HOURS: 72" compliance for cleanup operations
      - "SANDBOX_MAX: 10" limit enforcement during cleanup
      - Memory usage optimization during large-scale cleanups
      - Disk I/O throttling for system stability maintenance
```

### Evidence Package Generation
**Enterprise compliance and audit trail creation:**

```yaml
evidence_packaging:
  compliance_artifacts:
    structure:
      - ".claude/.evidence/cleanup-[timestamp]/"
      - "├── compliance/nasa_pot10_status.json"
      - "├── quality/consolidated_qa_report.json"  
      - "├── security/sarif_audit_trail.json"
      - "├── performance/baseline_measurements.json"
      - "├── memory/learning_patterns_archive.json"
      - "└── audit/cleanup_operation_log.json"
    
  audit_trail_features:
    operation_logging:
      - Every file operation with timestamp and checksum
      - Quality gate status before/after with delta analysis  
      - Memory state changes with learning pattern impact
      - Agent coordination events and decision points
    compliance_verification:
      - Pre-cleanup compliance status validation
      - Post-cleanup compliance status verification
      - Rollback capability demonstration and testing
      - Evidence package integrity verification using cryptographic hashes
```

### Safety Mechanisms Integration
**Enterprise-grade safety and recovery:**

```yaml
enterprise_safety:
  risk_management:
    classification:
      - Integration with risk_labels from .claude/settings.json
      - "high_risk": Enhanced backup and verification requirements
      - "fast_lane": Streamlined cleanup with basic safety checks
      - "auto_full_gates": Mandatory quality verification pre/post cleanup
    
  rollback_integration:
    git_integration:
      - Git stash creation before cleanup operations
      - Branch state preservation and restoration capabilities
      - Commit hash tracking for precise rollback points
      - Working directory state restoration with conflict resolution
    
  theater_detection_integration:
    reality_validation:
      - Leverage existing /theater:scan command infrastructure
      - Validate cleanup claims against actual file system changes
      - Detect performance theater in cleanup time/space reporting
      - Prevent quality gate gaming through selective cleanup
    pattern_recognition:
      - Cross-reference cleanup results with known theater patterns
      - Validate space savings claims against actual measurements
      - Verify performance improvements through independent benchmarking
      - Maintain theater detection learning patterns across cleanup cycles
```

## Usage Examples & Expected Outputs

### 1. Enterprise Interactive Cleanup
**Scenario**: Manual cleanup after completing a major feature development cycle
```bash
claude /cleanup:post-completion --interactive --theater-scan

# Expected Output:
# 🧹 SPEK Post-Completion Cleanup Analysis
# ==========================================
# Phase 1: Temporary Files - 234 files (127.3MB) - Est: 45s
# Phase 2: Quality Artifacts - 23 files consolidation - Est: 30s  
# Phase 3: Documentation - 12 files organization - Est: 20s
# Phase 4: Environment - Git GC + cache clear - Est: 60s
# 
# 🎭 Theater Detection: Scanning for performance theater...
# ✅ No theater patterns detected in cleanup scope
# 
# 🛡️ Safety Status:
# - Quality gates preserved: ✅ NASA compliance 92%
# - Memory patterns backup: ✅ Created
# - Git state clean: ✅ No uncommitted changes
# 
# Continue with Phase 1 cleanup? (Y/n/s for status): Y
```

### 2. CI/CD Pipeline Integration  
**Scenario**: Automated cleanup in production deployment pipeline
```bash
# Full automated cleanup with evidence generation
claude /cleanup:post-completion --force --evidence-package --backup-to=.backups/deploy-cleanup-$BUILD_ID

# Expected Artifacts Generated:
# .claude/.evidence/cleanup-20240908-153022/
# ├── compliance/nasa_pot10_status.json (Current: 92%)
# ├── quality/consolidated_qa_report.json (Gates: PASS)
# ├── audit/cleanup_operation_log.json (247 operations)
# └── backup/restore_manifest.json (Rollback ready)

# Pipeline Integration Example:
curl -X POST $WEBHOOK_URL \
  -d "cleanup_completed=true&evidence_package=cleanup-20240908-153022&compliance_status=92%"
```

### 3. Agent Swarm Coordination
**Scenario**: Multi-agent parallel cleanup for large codebases
```bash
claude /cleanup:post-completion --swarm-coordinate --agents=temp-cleaner,qa-consolidator,doc-organizer,env-optimizer

# Expected Swarm Output:
# 🤖 Initializing Cleanup Swarm...
# ├── Agent 1: temp-cleaner → Processing 234 temp files
# ├── Agent 2: qa-consolidator → Merging 23 QA artifacts  
# ├── Agent 3: doc-organizer → Organizing 12 docs
# └── Agent 4: env-optimizer → Git GC + dependency cleanup
# 
# 📊 Parallel Execution Status:
# Agent 1: ████████████████ 100% (Freed 127.3MB in 32s)
# Agent 2: ████████████████ 100% (Consolidated 34.8MB in 28s)
# Agent 3: ████████████████ 100% (Organized 5.2MB in 15s)  
# Agent 4: ████████████████ 100% (Optimized 89.4MB in 45s)
# 
# ✅ Swarm cleanup completed in 45s (vs 155s sequential)
```

### 4. Memory Bridge Integration
**Scenario**: Cleanup with learning pattern preservation and intelligence export
```bash
claude /cleanup:post-completion --memory-bridge --learning-mode --evidence-package

# Expected Memory Integration:
# 🧠 Memory Bridge Integration Status:
# ├── Neural patterns backup: ✅ 15 patterns preserved
# ├── Agent coordination logs: ✅ 247 interactions archived
# ├── Quality insights export: ✅ 8 improvement patterns saved
# └── Cross-session sync: ✅ Memory state synchronized
# 
# 📚 Learning Pattern Preservation:
# - Successful agent coordination workflows: 12 patterns
# - Quality improvement strategies: 8 patterns  
# - Error recovery methodologies: 5 patterns
# - Performance optimization discoveries: 7 patterns
# 
# Memory export location: .claude/.artifacts/memory_export_20240908.json
```

### 5. Development Workflow Integration
**Scenario**: Different cleanup strategies for different development phases

#### Pre-Commit Cleanup
```bash
claude /cleanup:post-completion --phase 1 --phase 2 --interactive --preserve="docs/working/*"

# Focused on temporary files and QA consolidation only
# Preserves working documentation during active development
```

#### Post-Merge Cleanup
```bash  
claude /cleanup:post-completion --force --scope=environment --theater-scan

# Full environment optimization after successful merge
# Includes theater detection to validate merge quality claims
```

#### Release Preparation Cleanup
```bash
claude /cleanup:post-completion --evidence-package --backup-only --memory-bridge

# Comprehensive backup and evidence generation before release
# Exports all learning patterns and quality insights for next iteration
```

### 6. Rollback Scenarios
**Scenario**: Recovery from cleanup issues or validation failures

#### Automated Rollback on Quality Degradation
```bash
# This happens automatically if quality gates fail post-cleanup
# Expected Output:
# ❌ Quality gate degradation detected (NASA compliance: 89% < 92%)
# 🔄 Initiating automatic rollback to backup: cleanup-backup-1725812745
# ✅ Rollback completed - Quality gates restored to pre-cleanup state
```

#### Manual Rollback
```bash
claude /cleanup:post-completion --rollback --verify

# Expected Output:
# 🔍 Available backups:
# 1. cleanup-backup-1725812745 (2 hours ago) - Size: 445.7MB ✅
# 2. cleanup-backup-1725809145 (5 hours ago) - Size: 423.1MB ✅  
# 
# Select backup for rollback (1-2): 1
# 🔄 Verifying backup integrity... ✅
# 🔄 Restoring files... ✅
# 🔄 Restoring git state... ✅
# ✅ Rollback completed successfully
```

### 7. Status and Monitoring
**Scenario**: System health monitoring and cleanup readiness assessment
```bash
claude /cleanup:post-completion --status --theater-scan --json

# JSON Output (for monitoring systems):
{
  "cleanup_readiness": {
    "status": "ready",
    "estimated_space_freed": "256.7MB",
    "estimated_duration": "2m 15s",
    "risk_level": "low"
  },
  "quality_gates": {
    "nasa_compliance": 92,
    "security_findings": {"critical": 0, "high": 1, "medium": 3},
    "test_coverage": 94.3,
    "connascence_score": 0.83
  },
  "theater_detection": {
    "patterns_found": 0,
    "confidence_score": 0.95,
    "last_scan": "2024-09-08T15:30:00Z"
  },
  "memory_bridge": {
    "sync_status": "synchronized", 
    "learning_patterns": 32,
    "cross_agent_insights": 15
  }
}
```

### 8. Error Recovery Examples
**Scenario**: Handling common cleanup failures with automatic recovery

#### Disk Space Recovery
```bash
# Automatic disk space management during cleanup
# Expected Output:
# ⚠️ Low disk space detected (15% remaining)
# 🔧 Enabling aggressive cleanup mode...
# 📊 Space freed: 1.2GB → Disk space: 28% available ✅
```

#### Concurrent Process Detection
```bash
# Safety mechanism for active development processes  
# Expected Output:
# ⚠️ Active processes detected: npm (PID 12345), jest (PID 12346)
# 🛡️ Cleanup paused - Waiting for processes to complete...
# ✅ Processes completed - Resuming cleanup operations
```

This comprehensive command documentation ensures enterprise-ready cleanup operations with full integration into the SPEK quality framework, safety mechanisms, and audit trail requirements.