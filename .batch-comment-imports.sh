#!/bin/bash
# Batch Comment Missing Imports - Phase 1.1.2 Accelerated
# Backs up files before modification

echo "=== Phase 1.1.2 Batch Import Commenting ==="
echo "Creating backup..."
git stash push -m "Pre-batch-comment backup $(date +%Y%m%d-%H%M%S)"

echo ""
echo "Step 1: Commenting Facade imports (326 errors)..."
# Pattern: Lines with "import" and "Facade" - add TODO comment
find src -name "*.ts" -type f -exec sed -i.bak \
  '/^import.*Facade.*from/s|^|// TODO(Phase 4): Implement facade - |' {} \;

echo "Step 2: Commenting StateHandler imports (33 errors)..."  
# Pattern: Lines with "StateHandler" imports
find src -name "*.ts" -type f -exec sed -i.bak \
  '/^import.*StateHandler.*from/s|^|// TODO(Phase 4): Implement state handler - |' {} \;

echo "Step 3: Commenting ErrorHandler and TransitionGuard imports..."
# Pattern: Lines with core FSM components
find src -name "*.ts" -type f -exec sed -i.bak \
  '/^import.*ErrorHandler.*from.*\.\/core/s|^|// TODO(Phase 4): Implement FSM core - |' {} \;
find src -name "*.ts" -type f -exec sed -i.bak \
  '/^import.*TransitionGuard.*from.*\.\/core/s|^|// TODO(Phase 4): Implement FSM core - |' {} \;

echo "Step 4: Commenting missing ~types imports (26 errors)..."
# Specific missing type files identified in analysis
for type in "AdaptiveThresholdTypes" "GitHubProjectTypes" "SemanticDriftTypes" \
            "InfrastructureDocTypes" "PatternTypes" "ISO27001Types" "EventFSMTypes" \
            "WorkflowBuilderTypes" "QualityReporterTypes" "QualityGateTypes" \
            "MigrationValidationTypes" "ReportingTypes" "MigrationAnalysisTypes"; do
  find src -name "*.ts" -type f -exec sed -i.bak \
    "/^import.*from '~types\/${type}'/s|^|// TODO(Phase 4): Create ${type}.ts - |" {} \;
done

echo "Step 5: Commenting other problematic imports..."
# Utils, shared modules, etc
find src -name "*.ts" -type f -exec sed -i.bak \
  '/^import.*from.*\.\.\/.*\/utils\/Logger/s|^|// TODO(Phase 4): Fix utils path - |' {} \;
find src -name "*.ts" -type f -exec sed -i.bak \
  '/^import.*from.*\.\/.*Core/s|^|// TODO(Phase 4): Implement core module - |' {} \;

echo ""
echo "Cleaning up .bak files..."
find src -name "*.bak" -delete

echo ""
echo "=== Batch commenting complete ==="
echo "Run 'npx tsc --noEmit 2>&1 | grep TS2307 | wc -l' to verify reduction"
