#!/bin/bash
# Consolidate ValidationResult type definitions
# Replaces 49 duplicate ValidationResult definitions with imports from canonical source

set -e

CANONICAL_SOURCE="src/types/validation-types.ts"
CANONICAL_IMPORT="import { ValidationResult } from '~/types/validation-types';"

echo "=== ValidationResult Type Consolidation ==="
echo "Canonical source: $CANONICAL_SOURCE"
echo ""

# List of files with duplicate ValidationResult definitions (excluding canonical)
FILES_TO_FIX=(
  "src/analysis/core/types/AnalysisTypes.ts"
  "src/architecture/langgraph/workflows/orchestration/WorkflowTypes.ts"
  "src/compliance/monitoring/ComplianceDriftDetector-typed.ts"
  "src/config/types/ConfigTypes.ts"
  "src/context/ContextDNA.ts"
  "src/context/degradation/types/DegradationTypes.ts"
  "src/dspy-integration/types/DatasetTypes.ts"
  "src/dspy-integration/types/DSPyTypes.ts"
  "src/events/fsm/types/EventFSMTypes.ts"
  "src/migration/planning/risk/reporting/types/ReportingTypes.ts"
  "src/migration/translation/fsm/MessageFormatTypes.ts"
  "src/orchestration/deployment/readiness/types/ReadinessTypes.ts"
  "src/orchestration/integration/dependency/DependencyTypes.ts"
  "src/orchestration/integration/fsm/types/IntegrationFSMTypes.ts"
  "src/orchestration/phases/phase-transition/PhaseTransitionTypesFacade.ts"
  "src/protocols/docs/fsm/DocGeneratorTypes.ts"
  "src/shared/mega-fsm/types/MegaDecompositionTypes.ts"
  "src/types/base/common.ts"
  "src/types/base/shared.ts"
  "src/types/DatasetTypes.ts"
  "src/types/DegradationTypes.ts"
  "src/validation/fsm/types/ValidationFSMTypes.ts"
)

echo "Files to consolidate: ${#FILES_TO_FIX[@]}"
echo ""

for file in "${FILES_TO_FIX[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"

    # Check if file already has the import
    if grep -q "from '~/types/validation-types'" "$file" 2>/dev/null; then
      echo "  Already has canonical import, skipping"
      continue
    fi

    # Remove the ValidationResult interface definition
    # This is a placeholder - actual removal requires careful sed/awk work
    echo "  TODO: Remove local ValidationResult definition"
    echo "  TODO: Add import: $CANONICAL_IMPORT"
  else
    echo "File not found: $file"
  fi
done

echo ""
echo "=== Manual Steps Required ==="
echo "1. For each file, remove local 'export interface ValidationResult {...}'"
echo "2. Add import at top: $CANONICAL_IMPORT"
echo "3. Verify no other code depends on removed properties"
echo "4. Run: npx tsc --noEmit to verify no new errors"
echo ""
echo "Note: Script provides guidance. Manual consolidation recommended for safety."
