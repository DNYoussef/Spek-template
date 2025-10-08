#!/bin/bash
# Phase 1.1.3: Uncomment imports that point to EXISTING files
# Strategy: Check if target file exists, then uncomment the import

echo "Phase 1.1.3: Uncommenting imports for existing type files"
echo "=========================================================="

# Function to check if import target exists
check_and_uncomment() {
    local file="$1"
    local import_line_pattern="$2"
    local expected_path="$3"

    # Check if the target file exists
    if [ -f "$expected_path" ]; then
        echo "✓ Uncommenting in $file -> $expected_path exists"
        # Uncomment the import line
        sed -i.bak "s|^// TODO(Phase 4): [^-]* - \(import.*from.*${import_line_pattern}\)|\1|" "$file"
        return 0
    else
        echo "✗ Skipping $file -> $expected_path NOT FOUND"
        return 1
    fi
}

# Counter for statistics
total_uncommented=0
total_skipped=0

# Pattern 1: Uncomment imports from ../SyncTypes (memory sync states)
echo ""
echo "Pattern 1: Memory Sync State Handlers -> SyncTypes.ts"
echo "-----------------------------------------------------"
for statefile in src/memory/sync/fsm/states/*.ts; do
    if [ -f "$statefile" ]; then
        # Check if SyncTypes.ts exists
        typefile="src/memory/sync/fsm/SyncTypes.ts"
        if [ -f "$typefile" ]; then
            # Uncomment the import
            sed -i.bak "s|^// TODO(Phase 4): Implement state handler - \(import .* from '../SyncTypes'\)|\1|" "$statefile"
            echo "✓ Uncommented: $statefile"
            ((total_uncommented++))
        fi
    fi
done

# Pattern 2: Uncomment imports from BroadcasterTypes (memory sharing broadcasters)
echo ""
echo "Pattern 2: Broadcaster State Handlers -> BroadcasterTypes.ts"
echo "-------------------------------------------------------------"
for statefile in src/memory/sharing/broadcaster-fsm/states/*.ts; do
    if [ -f "$statefile" ]; then
        typefile="src/memory/sharing/broadcaster-fsm/BroadcasterTypes.ts"
        if [ -f "$typefile" ]; then
            sed -i.bak "s|^// TODO(Phase 4): [^-]* - \(import .* from '../BroadcasterTypes'\)|\1|" "$statefile"
            echo "✓ Uncommented: $statefile"
            ((total_uncommented++))
        fi
    fi
done

# Pattern 3: Uncomment imports from parent directory types (e.g., ~types/...)
echo ""
echo "Pattern 3: Type imports from ~types aliases"
echo "--------------------------------------------"

# Find all commented imports with ~types
grep -r "^// TODO(Phase 4).*import.*~types" src --include="*.ts" | \
    sed 's/:.*import/\|import/' | \
    while IFS='|' read -r filepath importline; do
        # Extract the type file path from import
        typepath=$(echo "$importline" | sed -E "s/.*from ['\"]([^'\"]+)['\"].*/\1/")

        # Convert ~types alias to actual path
        if [[ "$typepath" == ~types/* ]]; then
            actualpath=$(echo "$typepath" | sed 's|~types|src/types|')
            actualpath="${actualpath}.ts"

            if [ -f "$actualpath" ]; then
                # Uncomment this specific import
                sed -i.bak "s|^// TODO(Phase 4).*\(import.*from ['\"]${typepath}['\"];\)|\1|" "$filepath"
                echo "✓ Uncommented: $filepath -> $actualpath"
                ((total_uncommented++))
            else
                echo "✗ Skipped: $filepath -> $actualpath (not found)"
                ((total_skipped++))
            fi
        fi
    done

# Pattern 4: Uncomment StateHandler imports from ./core/BaseStateHandler
echo ""
echo "Pattern 4: BaseStateHandler imports"
echo "------------------------------------"
find src -name "*.ts" -exec grep -l "^// TODO.*BaseStateHandler.*from.*core/BaseStateHandler" {} \; | \
    while read -r statefile; do
        # Get the directory of the state file
        statedir=$(dirname "$statefile")
        basepath="$statedir/core/BaseStateHandler.ts"

        if [ -f "$basepath" ]; then
            sed -i.bak "s|^// TODO(Phase 4): Implement state handler - \(import .* from './core/BaseStateHandler';\)|\1|" "$statefile"
            echo "✓ Uncommented: $statefile"
            ((total_uncommented++))
        else
            echo "✗ Skipped: $statefile (BaseStateHandler not found)"
            ((total_skipped++))
        fi
    done

echo ""
echo "=========================================================="
echo "Phase 1.1.3 Statistics:"
echo "  Imports uncommented: $total_uncommented"
echo "  Imports skipped (file not found): $total_skipped"
echo "=========================================================="
echo ""
echo "Running TypeScript check to see error reduction..."
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l | xargs echo "Total TS errors:"
