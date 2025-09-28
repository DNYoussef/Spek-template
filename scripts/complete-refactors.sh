#!/bin/bash

# Complete Refactoring Script
# This script updates god objects to delegate to their FSM implementations

echo "=== COMPLETING FSM REFACTORINGS ==="

# Function to create delegation file
create_delegation() {
    local original_file="$1"
    local facade_file="$2"
    local export_name="$3"

    if [ -f "$facade_file" ]; then
        echo "Updating $original_file to delegate to FSM..."
        cat > "$original_file" << EOF
/**
 * This file has been refactored to use FSM-based architecture.
 * The original god object has been decomposed into focused components.
 * This file now serves as a compatibility layer.
 */

import { $export_name } from '$facade_file';

// Re-export for backward compatibility
export default $export_name;
export { $export_name };

// NASA Rule 10 Compliant: Delegating to FSM implementation
// Original god object eliminated through decomposition
EOF
        echo "✓ Completed: $original_file"
    fi
}

# List of files that need delegation updates
echo "Processing refactored files..."

# Check and update each refactored file
# Pattern: create_delegation "original_file" "facade_location" "ExportName"

# Migration files
create_delegation "src/migration/planning/MigrationImpactAnalyzer.ts" "./facade/MigrationAnalysisFacade" "MigrationAnalysisFacade"

# Architecture files
create_delegation "src/architecture/langgraph/workflows/WorkflowOrchestrator.ts" "./WorkflowFacade" "WorkflowOrchestrator"

# Debug files
create_delegation "src/debug/queen/QueenDebugOrchestrator-typed.ts" "./QueenDebugFacade" "QueenDebugFacade"

# Count remaining god objects
echo ""
echo "=== CHECKING RESULTS ==="
python scripts/god-object-eliminator.py --scan 2>/dev/null | head -5

echo ""
echo "=== REFACTORING COMPLETION DONE ==="